/**
 * PR-10B: Store module para Speed Events (Eventos de Excesso de Velocidade)
 * 
 * Gerencia estado e API calls para histórico de eventos de velocidade.
 * 
 * Features:
 * - Fetch paginado de eventos (com filtros: deviceId, driverId, from, to)
 * - Cache 60s para badge count (evita N+1 queries)
 * - Guardrails: range máximo 31 dias, paginação obrigatória
 * 
 * @author PR-10B
 */

// Cache para contagem de "Hoje: N" (60 segundos por device)
const todayCountCache = new Map();
const CACHE_TTL_MS = 60000; // 60 segundos

export default {
    namespaced: true,
    
    state: () => ({
        // Histórico de eventos
        events: [],
        
        // Metadados de paginação
        meta: {
            total: 0,
            perPage: 50,
            currentPage: 1,
            lastPage: 1
        },
        
        // Estados de UI
        loading: false,
        error: null
    }),
    
    getters: {
        /**
         * Retorna evento por ID
         */
        getEventById(state) {
            return (id) => {
                return state.events.find((e) => e.id === id);
            };
        },
        
        /**
         * Verifica se está carregando
         */
        isLoading(state) {
            return state.loading;
        },
        
        /**
         * Retorna erro (se houver)
         */
        getError(state) {
            return state.error;
        },
        
        /**
         * Retorna total de eventos (do último fetch)
         */
        getTotal(state) {
            return state.meta.total;
        }
    },
    
    mutations: {
        /**
         * Seta eventos e metadados
         */
        setEvents(state, { data, meta }) {
            state.events = data;
            state.meta = meta;
        },
        
        /**
         * Seta loading state
         */
        setLoading(state, value) {
            state.loading = value;
        },
        
        /**
         * Seta erro
         */
        setError(state, error) {
            state.error = error;
        },
        
        /**
         * Limpa eventos e reseta estado
         */
        clear(state) {
            state.events = [];
            state.meta = {
                total: 0,
                perPage: 50,
                currentPage: 1,
                lastPage: 1
            };
            state.loading = false;
            state.error = null;
        }
    },
    
    actions: {
        /**
         * Buscar eventos de velocidade com filtros
         * 
         * @param {Object} params - Filtros de busca
         * @param {number} params.deviceId - ID do device (obrigatório)
         * @param {number} [params.driverId] - ID do motorista (opcional)
         * @param {string} params.from - Data inicial ISO 8601 (ex: 2025-01-19T00:00:00Z)
         * @param {string} params.to - Data final ISO 8601 (ex: 2025-01-19T23:59:59Z)
         * @param {number} [params.page=1] - Página atual
         * @param {number} [params.perPage=50] - Itens por página
         * 
         * @returns {Promise<Object>} - { data: Array, meta: Object }
         */
        async fetchSpeedEvents({ commit }, params) {
            const {
                deviceId,
                driverId,
                from,
                to,
                page = 1,
                perPage = 50
            } = params;
            
            // Validação básica
            if (!deviceId) {
                const error = new Error('deviceId is required');
                commit('setError', error);
                throw error;
            }
            
            if (!from || !to) {
                const error = new Error('from and to dates are required');
                commit('setError', error);
                throw error;
            }
            
            commit('setLoading', true);
            commit('setError', null);
            
            try {
                // Montar query string
                const queryParams = new URLSearchParams({
                    deviceId,
                    from,
                    to,
                    page,
                    perPage
                });
                
                // Adicionar driverId se fornecido
                if (driverId) {
                    queryParams.append('driverId', driverId);
                }
                
                // Fazer request
                const { getRuntimeApi } = await import('@/services/runtimeApiRef');
                const api = getRuntimeApi();
                
                // Endpoint: GET /api/speed-events?...
                const { data } = await api.axios.get(`/speed-events?${queryParams.toString()}`);
                
                // Validar response
                if (!data || !data.meta || !Array.isArray(data.data)) {
                    throw new Error('Invalid API response format');
                }
                
                // Commit ao state
                commit('setEvents', {
                    data: data.data,
                    meta: data.meta
                });
                
                return data;
                
            } catch (error) {
                console.error('[speedEvents] Failed to fetch events:', error);
                commit('setError', error.message || 'Failed to fetch speed events');
                throw error;
                
            } finally {
                commit('setLoading', false);
            }
        },
        
        /**
         * Buscar contagem de eventos "Hoje" para badge
         * 
         * Usa cache de 60s para evitar N+1 queries (quando lista tem N devices).
         * 
         * @param {number} deviceId - ID do device
         * @returns {Promise<number>} - Total de eventos hoje
         */
        async fetchTodayCount(_, deviceId) {
            if (!deviceId) {
                return 0;
            }
            
            // Verificar cache
            const cached = todayCountCache.get(deviceId);
            const now = Date.now();
            
            if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
                // Cache ainda válido (< 60s)
                return cached.count;
            }
            
            try {
                // Calcular range "hoje" (00:00:00 UTC até agora)
                const todayStart = new Date();
                todayStart.setUTCHours(0, 0, 0, 0);
                
                const now = new Date();
                
                const from = todayStart.toISOString();
                const to = now.toISOString();
                
                // Query com perPage=1 (só queremos meta.total)
                const queryParams = new URLSearchParams({
                    deviceId,
                    from,
                    to,
                    page: 1,
                    perPage: 1
                });
                
                // Fazer request
                const { getRuntimeApi } = await import('@/services/runtimeApiRef');
                const api = getRuntimeApi();
                
                const { data } = await api.axios.get(`/speed-events?${queryParams.toString()}`);
                
                const count = data?.meta?.total || 0;
                
                // Cachear por 60s
                todayCountCache.set(deviceId, {
                    count,
                    timestamp: Date.now()
                });
                
                return count;
                
            } catch (error) {
                console.error('[speedEvents] Failed to fetch today count:', error);
                // Retornar 0 em caso de erro (não quebra UI)
                return 0;
            }
        },
        
        /**
         * Limpar cache de contagem (útil para refresh forçado)
         * 
         * @param {number} [deviceId] - ID do device (se omitido, limpa tudo)
         */
        clearTodayCountCache(_, deviceId) {
            if (deviceId) {
                todayCountCache.delete(deviceId);
            } else {
                todayCountCache.clear();
            }
        },
        
        /**
         * Limpar estado do store
         */
        clear({ commit }) {
            commit('clear');
        }
    }
};
