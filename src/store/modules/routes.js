/**
 * routes.js - Módulo Vuex para gerenciar dados de rotas/histórico
 * 
 * Migrado do projeto de referência com melhorias:
 * - Separação de concerns (routes separado de devices)
 * - Getters para acesso a posições específicas
 * - Tratamento de erros robusto
 */

const routes = {
  namespaced: true,

  state: () => ({
    // Objeto para armazenar detalhes completos de cada posição por ID
    routePositions: {},
    // Array de posições simplificadas para exibição no mapa [lat, lng, id, course]
    currentRoute: [],
    // Estado de carregamento
    isLoading: false,
    // Último erro ocorrido
    lastError: null,
    // Metadados da rota atual
    routeMeta: {
      deviceId: null,
      startDate: null,
      endDate: null,
      totalPoints: 0
    }
  }),

  getters: {
    // Obter todos os pontos da rota atual
    getRoutePoints: state => state.currentRoute,

    // Obter posição específica pelo ID
    getPositionById: state => id => state.routePositions[id] || null,

    // Obter detalhes completos da posição atual (sincronizada com mapa)
    getCurrentPosition: (state, getters, rootState) => {
      const index = rootState.devices?.routePlayPoint || 0;
      if (state.currentRoute.length === 0 || index >= state.currentRoute.length) {
        return null;
      }

      const pointId = state.currentRoute[index]?.[2]; // O ID está na posição 2 do array
      return pointId ? getters.getPositionById(pointId) : null;
    },

    // Status de carregamento
    isLoading: state => state.isLoading,

    // Verificar se há rota carregada
    hasRoute: state => state.currentRoute.length > 0,

    // Obter metadados da rota
    getRouteMeta: state => state.routeMeta,

    // Obter total de pontos
    getTotalPoints: state => state.currentRoute.length
  },

  mutations: {
    // Definir os pontos da rota atual (formato simplificado para o mapa)
    SET_ROUTE_POINTS(state, points) {
      state.currentRoute = points || [];
      state.routeMeta.totalPoints = points?.length || 0;
    },

    // Adicionar uma posição detalhada ao objeto de posições
    ADD_POSITION(state, position) {
      if (!position?.id) return;
      state.routePositions = {
        ...state.routePositions,
        [position.id]: position
      };
    },

    // Adicionar múltiplas posições detalhadas
    ADD_POSITIONS(state, positions) {
      if (!Array.isArray(positions)) return;
      
      const positionsMap = {};
      positions.forEach(position => {
        if (position?.id) {
          positionsMap[position.id] = position;
        }
      });

      state.routePositions = {
        ...state.routePositions,
        ...positionsMap
      };
    },

    // Limpar as posições armazenadas
    CLEAR_POSITIONS(state) {
      state.routePositions = {};
      state.currentRoute = [];
      state.routeMeta = {
        deviceId: null,
        startDate: null,
        endDate: null,
        totalPoints: 0
      };
      state.lastError = null;
    },

    // Definir estado de carregamento
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },

    // Definir metadados da rota
    SET_ROUTE_META(state, { deviceId, startDate, endDate }) {
      state.routeMeta.deviceId = deviceId;
      state.routeMeta.startDate = startDate;
      state.routeMeta.endDate = endDate;
    },

    // Definir último erro
    SET_ERROR(state, error) {
      state.lastError = error;
    }
  },

  actions: {
    /**
     * Carregar rota a partir da API
     * @param {Object} params - { deviceId, startDate, endDate, isExport }
     * @returns {Object} - { data: posições completas, points: formato simplificado }
     */
    async loadRoute({ commit }, { deviceId, startDate, endDate, isExport = false }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);

      try {
        const $traccar = window.$traccar;
        
        if (!$traccar) {
          throw new Error('TraccarConnector não disponível');
        }

        // Salvar metadados
        commit('SET_ROUTE_META', { deviceId, startDate, endDate });

        const response = await $traccar.loadRoute(deviceId, startDate, endDate, isExport);

        // Verificar resposta válida
        if (!response || !response.data) {
          console.error('[routes.js] Resposta inválida do servidor:', response);
          throw new Error('Resposta inválida do servidor');
        }

        if (!isExport) {
          // Verificar que response.data é um array
          if (!Array.isArray(response.data)) {
            console.error('[routes.js] Dados recebidos não são um array:', response.data);
            throw new Error('Formato de dados inválido');
          }

          // Armazenar dados completos das posições
          commit('ADD_POSITIONS', response.data);

          // Preparar formato simplificado para o mapa
          const simplifiedPoints = response.data.map(p => [
            p.latitude,
            p.longitude,
            p.id,
            p.course
          ]);

          // Atualizar pontos de rota
          commit('SET_ROUTE_POINTS', simplifiedPoints);

          console.log(`[routes.js] Rota carregada: ${response.data.length} pontos`);

          return {
            data: response.data,
            points: simplifiedPoints
          };
        }

        // Retornar resposta para export (blob)
        return response;

      } catch (error) {
        console.error('[routes.js] Erro ao carregar rota:', error);
        commit('SET_ERROR', error.message || 'Erro desconhecido');

        // Melhor tratamento de erros específicos
        if (error.response?.status === 404) {
          throw new Error('Nenhum dado encontrado para o período selecionado');
        } else if (error.isHtmlResponse) {
          throw new Error('Erro de autenticação. Faça login novamente.');
        } else if (error.message?.includes('JSON')) {
          throw new Error('Erro no formato de resposta do servidor');
        }

        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    /**
     * Limpar dados da rota
     */
    clearRoute({ commit }) {
      commit('CLEAR_POSITIONS');
    },

    /**
     * Obter endereço de uma posição específica (se não tiver)
     * @param {number} positionId 
     * @returns {Object} - Posição atualizada
     */
    async loadAddress({ getters }, positionId) {
      const position = getters.getPositionById(positionId);

      if (!position || position.address) {
        return position; // Já tem endereço ou não existe
      }

      try {
        // TODO: Implementar chamada à API de geocodificação
        // Por enquanto retorna posição sem endereço
        console.log('[routes.js] loadAddress não implementado para positionId:', positionId);
        return position;
      } catch (error) {
        console.error('[routes.js] Erro ao carregar endereço:', error);
        return position;
      }
    }
  }
};

export default routes;
