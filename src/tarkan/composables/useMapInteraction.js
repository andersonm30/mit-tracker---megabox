/**
 * useMapInteraction.ts
 * 
 * Composable para isolar TODAS as interações diretas com Leaflet
 * 
 * RESPONSABILIDADES:
 * - flyTo: Voo suave para coordenadas
 * - zoom: Zoom in/out com validação
 * - invalidateSize: Recalcular tamanho do mapa (resize)
 * - latLngToContainerPoint: Converter coordenadas para pixels
 * - bindGeofenceHandlers: Bind de eventos para edição de geofences
 * 
 * PRINCÍPIOS:
 * - Zero lógica de negócio (store, router, etc)
 * - Validação de map ready obrigatória
 * - Cleanup completo de listeners
 * - Callbacks para comunicação com componente pai
 * 
 * ARQUITETURA:
 * - Composable puro com injeção de dependências
 * - Leaflet isolado (nenhuma dependência externa)
 * - kore-map.vue apenas chama métodos
 */

// REMOVIDO: import { ref, Ref } from 'vue' (não usado neste composable)
import ResizeObserver from 'resize-observer-polyfill';
// REMOVIDO: import L from 'leaflet' (não usado diretamente, apenas via mapObject)

// ============================================================================
// TYPES (removidos - agora é JavaScript puro)
// ============================================================================

/**
 * @typedef {Object} LeafletMap
 * @property {Object} leafletObject
 * 
 * @typedef {Object} UseMapInteractionOptions
 * @property {Function} getMapObject - Retorna objeto do mapa Leaflet
 * @property {Function} getMapContainer - Retorna container DOM do mapa
 * @property {Function} [onMapClick] - Callback para mapClick
 * @property {Function} [onMapMove] - Callback para mapMove
 * @property {Function} [onMapInvalidate] - Callback para invalidate
 * 
 * @typedef {Object} UseMapInteractionReturn
 * @property {Function} flyTo
 * @property {Function} zoomIn
 * @property {Function} zoomOut
 * @property {Function} invalidateSize
 * @property {Function} latLngToContainerPoint
 * @property {Function} onMapEvent
 * @property {Function} offMapEvent
 * @property {Function} onMapEvents
 * @property {Function} bindGeofenceHandlers
 * @property {Function} unbindGeofenceHandlers
 * @property {Function} cleanup
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const MAP_MOVE_THROTTLE_MS = 16; // ~60fps

// FASE E1.2: Validação de ranges geográficos
const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;
const ZOOM_MIN = 1;
const ZOOM_MAX = 20;

// FASE E1.2: Rate limiting de logs (3s por key)
const LOG_RATE_LIMIT_MS = 3000;

// ============================================================================
// COMPOSABLE
// ============================================================================

export function useMapInteraction(options) {
  const {
    getMapObject,
    getMapContainer,
    onMapClick,
    onMapMove,
    onMapInvalidate,
  } = options;

  // ============================================================================
  // STATE
  // ============================================================================

  let resizeObserver = null;
  let mapMoveThrottleTimer = null;
  let geofenceHandlersBound = false;
  
  // FASE E1.1: Tracking de event listeners para cleanup garantido
  const registeredListeners = [];
  
  // FASE E1.2: Lifecycle tracking + rate limiting
  let disposed = false;
  const lastLogTime = new Map();

  // ============================================================================
  // HELPERS - LOGGING (FASE E1.2)
  // ============================================================================

  /**
   * Log DEV-only com rate limiting
   * @param key Chave única para rate limiting (ex: 'flyTo:invalid')
   * @param message Mensagem
   */
  const devWarn = (key, message) => {
    if (process.env.NODE_ENV === 'production') return;
    
    const now = Date.now();
    const lastLog = lastLogTime.get(key);
    
    if (!lastLog || now - lastLog > LOG_RATE_LIMIT_MS) {
      console.warn(`[useMapInteraction] ${message}`);
      lastLogTime.set(key, now);
    }
  };

  /**
   * Verifica se ainda está vivo e retorna false se disposed
   * @param opName Nome da operação (para log)
   */
  const assertAlive = (opName) => {
    if (disposed) {
      devWarn(`${opName}:disposed`, `${opName}: Chamado após cleanup (NO-OP)`);
      return false;
    }
    return true;
  };

  /**
   * Wrapper safe para operações que podem falhar
   * @param opName Nome da operação
   * @param fn Função a executar
   * @returns Resultado da função ou null em caso de erro
   */
  const safe = (opName, fn) => {
    try {
      return fn();
    } catch (error) {
      devWarn(`${opName}:error`, `${opName} falhou: ${error}`);
      return null;
    }
  };

  // ============================================================================
  // HELPERS - VALIDATION (FASE E1.2)
  // ============================================================================

  /**
   * Valida coordenadas geográficas
   */
  const isValidLatLng = (lat, lng) => {
    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= LAT_MIN &&
      lat <= LAT_MAX &&
      lng >= LNG_MIN &&
      lng <= LNG_MAX
    );
  };

  /**
   * Valida e ajusta zoom dentro de range seguro
   */
  const clampZoom = (zoom) => {
    if (!Number.isFinite(zoom)) return ZOOM_MIN;
    return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
  };

  /**
   * Valida nome de evento
   */
  const isValidEventName = (eventName) => {
    return typeof eventName === 'string' && eventName.trim().length > 0;
  };

  /**
   * Valida handler
   */
  const isValidHandler = (handler) => {
    return typeof handler === 'function';
  };

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  /**
   * Valida se o mapa está pronto para interações
   * @returns true se map.value.leafletObject existe
   */
  const isMapReady = () => {
    const mapObj = getMapObject();
    return !!(mapObj?.leafletObject);
  };

  /**
   * Valida se o mapa tem um método específico
   */
  const hasMapMethod = (method) => {
    const mapObj = getMapObject();
    if (!mapObj?.leafletObject) return false;
    const leaflet = mapObj.leafletObject;
    return typeof leaflet[method] === 'function';
  };

  // ============================================================================
  // FLY TO
  // ============================================================================

  /**
   * FASE E1.1 (Fase 3): Voa para coordenadas específicas com animação
   * FASE E1.2: Validação de params + safe operation
   * 
   * OTIMIZAÇÃO: Removido setTimeout duplo, agora usa leafletMap.whenReady()
   * Benefícios:
   * - Zero delay desnecessário (antes: ~200ms)
   * - Mais confiável (whenReady é nativo do Leaflet)
   * - Sem risk de timer leak
   */
  const flyTo = (lat, lng, zoom, options = { animate: true, duration: 1.5 }) => {
    // FASE E1.2: Validações
    if (!assertAlive('flyTo')) return;
    
    if (!isValidLatLng(lat, lng)) {
      devWarn('flyTo:invalid-coords', `flyTo: Coordenadas inválidas (${lat}, ${lng})`);
      return;
    }
    
    const safeZoom = clampZoom(zoom);
    if (safeZoom !== zoom) {
      devWarn('flyTo:zoom-clamped', `flyTo: Zoom ajustado de ${zoom} para ${safeZoom}`);
    }

    if (!isMapReady()) {
      devWarn('flyTo:not-ready', 'flyTo: Mapa não está pronto');
      return;
    }

    const mapObj = getMapObject();
    if (!mapObj?.leafletObject) return;

    safe('flyTo', () => {
      // ✅ FASE E1.1: Usar whenReady ao invés de setTimeout duplo
      mapObj.leafletObject.whenReady(() => {
        mapObj.leafletObject.flyTo([lat, lng], safeZoom, {
          animate: options.animate ?? true,
          duration: options.duration ?? 1.5
        });
      });
    });
  };

  // ============================================================================
  // ZOOM
  // ============================================================================

  /**
   * Zoom in (incrementa 1 nível)
   * FASE E1.2: Safe operation
   */
  const zoomIn = () => {
    if (!assertAlive('zoomIn')) return;
    
    if (!hasMapMethod('zoomIn')) {
      devWarn('zoomIn:not-ready', 'zoomIn: Mapa não está pronto');
      return;
    }

    safe('zoomIn', () => {
      const mapObj = getMapObject();
      mapObj?.leafletObject?.zoomIn();
    });
  };

  /**
   * Zoom out (decrementa 1 nível)
   * FASE E1.2: Safe operation
   */
  const zoomOut = () => {
    if (!assertAlive('zoomOut')) return;
    
    if (!hasMapMethod('zoomOut')) {
      devWarn('zoomOut:not-ready', 'zoomOut: Mapa não está pronto');
      return;
    }

    safe('zoomOut', () => {
      const mapObj = getMapObject();
      mapObj?.leafletObject?.zoomOut();
    });
  };

  // ============================================================================
  // INVALIDATE SIZE
  // ============================================================================

  /**
   * Recalcula o tamanho do mapa (após resize do container)
   * Usa requestAnimationFrame para garantir que o DOM esteja atualizado
   * FASE E1.2: Safe operation (pode ser chamado após disposed)
   */
  const invalidateSize = () => {
    // Permitir invalidateSize mesmo após disposed (defensivo)
    if (!hasMapMethod('invalidateSize')) {
      return;
    }

    safe('invalidateSize', () => {
      requestAnimationFrame(() => {
        const mapObj = getMapObject();
        if (mapObj?.leafletObject && typeof mapObj.leafletObject.invalidateSize === 'function') {
          mapObj.leafletObject.invalidateSize();
        }
      });
    });
  };

  // ============================================================================
  // LAT LNG TO CONTAINER POINT
  // ============================================================================

  /**
   * Converte coordenadas lat/lng para posição em pixels
   * Usado para posicionar tooltips
   * FASE E1.2: Safe operation + validação
   */
  const latLngToContainerPoint = (latlng) => {
    if (!assertAlive('latLngToContainerPoint')) return null;
    
    if (!hasMapMethod('latLngToContainerPoint')) {
      devWarn('latLngToContainerPoint:not-ready', 'latLngToContainerPoint: Mapa não está pronto');
      return null;
    }

    return safe('latLngToContainerPoint', () => {
      const mapObj = getMapObject();
      if (!mapObj?.leafletObject) return null;
      return mapObj.leafletObject.latLngToContainerPoint(latlng);
    });
  };

  // ============================================================================
  // GEOFENCE HANDLERS
  // ============================================================================

  /**
   * Handler interno para mapClick (throttled)
   */
  // eslint-disable-next-line no-unused-vars
  const handleMapClick = (e) => {
    if (onMapClick && e.latlng) {
      onMapClick(e);
    }
  };

  /**
   * Handler interno para mapMove (throttled)
   * GUARD RAIL: Throttle no mapMove
   * O evento mousemove dispara ~60x/segundo. Sem throttle, isso causa:
   * 1. Dispatch excessivo para store
   * 2. Re-renders desnecessários
   * 3. Lag visual durante edição de círculo
   */
  // eslint-disable-next-line no-unused-vars
  const handleMapMove = (e) => {
    if (mapMoveThrottleTimer) return;

    mapMoveThrottleTimer = setTimeout(() => {
      mapMoveThrottleTimer = null;

      if (onMapMove && e.latlng) {
        onMapMove(e);
      }
    }, MAP_MOVE_THROTTLE_MS);
  };

  /**
   * Handler para invalidação externa do mapa (window event)
   */
  const handleMapInvalidate = () => {
    if (onMapInvalidate) {
      onMapInvalidate();
    } else {
      // Fallback: chamar invalidateSize diretamente
      invalidateSize();
    }
  };

  // ============================================================================
  // EVENT LISTENERS API (FASE E1.1)
  // ============================================================================

  /**
   * FASE E1.1: Registra um event listener no mapa
   * FASE E1.2: Validação + não duplicar + safe operation
   * 
   * @param eventName Nome do evento Leaflet (dragstart, zoomstart, moveend, etc)
   * @param handler Função callback
   * @param options Opções adicionais (não usado por enquanto)
   * 
   * Uso:
   * mapInteraction.onMapEvent('dragstart', () => console.log('drag started'));
   */
  const onMapEvent = (eventName, handler) => {
    // FASE E1.2: Validações
    if (!assertAlive('onMapEvent')) return;
    
    if (!isValidEventName(eventName)) {
      devWarn('onMapEvent:invalid-event', `onMapEvent: Nome de evento inválido "${eventName}"`);
      return;
    }
    
    if (!isValidHandler(handler)) {
      devWarn('onMapEvent:invalid-handler', 'onMapEvent: Handler inválido (não é função)');
      return;
    }

    if (!isMapReady()) {
      devWarn('onMapEvent:not-ready', `onMapEvent(${eventName}): Mapa não está pronto`);
      return;
    }

    const mapObj = getMapObject();
    if (!mapObj?.leafletObject) return;

    safe('onMapEvent', () => {
      // FASE E1.2: Não duplicar - verificar se já existe
      const alreadyRegistered = registeredListeners.some(
        (l) => l.event === eventName && l.handler === handler
      );
      
      if (alreadyRegistered) {
        devWarn(`onMapEvent:duplicate:${eventName}`, `onMapEvent(${eventName}): Handler já registrado (ignorado)`);
        return;
      }
      
      // Registrar listener no Leaflet
      mapObj.leafletObject.on(eventName, handler);
      
      // Armazenar para cleanup posterior
      registeredListeners.push({ event: eventName, handler });
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[useMapInteraction] ✅ Listener registrado: ${eventName}`);
      }
    });
  };

  /**
   * FASE E1.1: Remove um event listener específico do mapa
   * FASE E1.2: Funciona mesmo após disposed (defensivo)
   * 
   * @param eventName Nome do evento
   * @param handler Função callback (deve ser a mesma referência)
   */
  const offMapEvent = (eventName, handler) => {
    // FASE E1.2: Permitir remoção mesmo após disposed (defensivo)
    if (!isValidEventName(eventName) || !isValidHandler(handler)) {
      return;
    }

    const mapObj = getMapObject();
    if (!mapObj?.leafletObject) return;

    safe('offMapEvent', () => {
      // Remover listener do Leaflet
      mapObj.leafletObject.off(eventName, handler);
      
      // Remover do tracking
      const index = registeredListeners.findIndex(
        (l) => l.event === eventName && l.handler === handler
      );
      if (index !== -1) {
        registeredListeners.splice(index, 1);
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[useMapInteraction] ❌ Listener removido: ${eventName}`);
      }
    });
  };

  /**
   * FASE E1.1: Registra múltiplos event listeners de uma vez
   * FASE E1.2: Validação de lista
   * 
   * @param listeners Array de { event, handler }
   * 
   * Uso:
   * mapInteraction.onMapEvents([
   *   { event: 'dragstart', handler: onDrag },
   *   { event: 'zoomstart', handler: onZoom }
   * ]);
   */
  const onMapEvents = (listeners) => {
    if (!assertAlive('onMapEvents')) return;
    
    if (!Array.isArray(listeners)) {
      devWarn('onMapEvents:invalid', 'onMapEvents: Parâmetro deve ser um array');
      return;
    }
    
    listeners.forEach(({ event, handler }) => {
      onMapEvent(event, handler);
    });
  };

  /**
   * FASE E1.1: Remove todos os event listeners registrados (interno)
   * FASE E1.2: Idempotente + safe
   * Chamado automaticamente no cleanup()
   */
  const offAllMapEvents = () => {
    const mapObj = getMapObject();
    
    if (!mapObj?.leafletObject) {
      // Limpar tracking mesmo sem mapa (cleanup pós-unmount)
      registeredListeners.length = 0;
      return;
    }

    safe('offAllMapEvents', () => {
      // Remover todos os listeners do Leaflet
      registeredListeners.forEach(({ event, handler }) => {
        mapObj.leafletObject.off(event, handler);
      });
      
      if (process.env.NODE_ENV !== 'production' && registeredListeners.length > 0) {
        console.log(`[useMapInteraction] 🧹 ${registeredListeners.length} listeners removidos`);
      }
      
      // Limpar array de tracking
      registeredListeners.length = 0;
    });
  };

  /**
   * Bind dos handlers de geofence
   * Nota: Em vez de adicionar listeners diretamente ao Leaflet,
   * o componente pai (kore-map.vue) já tem @click e @mousemove no template.
   * Este método existe apenas para manter a interface consistente.
   */
  const bindGeofenceHandlers = () => {
    if (geofenceHandlersBound) return;

    // Adicionar listener para evento customizado de invalidação
    if (typeof window !== 'undefined') {
      window.addEventListener('map:invalidate', handleMapInvalidate);
    }

    geofenceHandlersBound = true;
  };

  /**
   * Unbind dos handlers de geofence
   */
  const unbindGeofenceHandlers = () => {
    if (!geofenceHandlersBound) return;

    // Remover listener de invalidação
    if (typeof window !== 'undefined') {
      window.removeEventListener('map:invalidate', handleMapInvalidate);
    }

    // Limpar throttle timer
    if (mapMoveThrottleTimer) {
      clearTimeout(mapMoveThrottleTimer);
      mapMoveThrottleTimer = null;
    }

    geofenceHandlersBound = false;
  };

  // ============================================================================
  // RESIZE OBSERVER
  // ============================================================================

  /**
   * Inicia o ResizeObserver para monitorar mudanças no tamanho do container
   * Deve ser chamado após o mapa estar pronto
   */
  const initResizeObserver = () => {
    const container = getMapContainer();
    if (!container) {
      console.warn('[useMapInteraction] initResizeObserver: Container não encontrado');
      return;
    }

    resizeObserver = new ResizeObserver(() => {
      invalidateSize();
    });

    resizeObserver.observe(container);
  };

  /**
   * Para o ResizeObserver
   */
  const destroyResizeObserver = () => {
    const container = getMapContainer();
    if (container && resizeObserver) {
      resizeObserver.unobserve(container);
    }
    resizeObserver?.disconnect();
    resizeObserver = null;
  };

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  /**
   * FASE E1.1: Cleanup completo de todos os recursos (idempotente)
   * FASE E1.2: Totalmente idempotente + disposed flag + limpar logs
   * 
   * Pode ser chamado múltiplas vezes sem erro
   * Chamado automaticamente no onUnmounted() do componente
   */
  const cleanup = () => {
    // FASE E1.2: Idempotência total - retornar se já foi disposed
    if (disposed) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[useMapInteraction] cleanup: Já foi executado (disposed=true)');
      }
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[useMapInteraction] 🧹 Executando cleanup...');
    }

    safe('cleanup', () => {
      // FASE E1.2: Marcar como disposed ANTES do cleanup
      disposed = true;

      // FASE E1.1: Remover TODOS os event listeners registrados
      offAllMapEvents();
      
      // Remover handlers de geofence
      unbindGeofenceHandlers();
      
      // Destruir ResizeObserver
      destroyResizeObserver();

      // FASE E1.2: Limpar mapa de logs
      lastLogTime.clear();
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('[useMapInteraction] ✅ Cleanup completo');
      }
    });
  };

  // ============================================================================
  // INIT
  // ============================================================================

  // Nota: ResizeObserver será inicializado automaticamente no primeiro uso
  // ou manualmente via bindGeofenceHandlers() após mapReady

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    initResizeObserver,
    flyTo,
    zoomIn,
    zoomOut,
    invalidateSize,
    latLngToContainerPoint,
    bindGeofenceHandlers,
    unbindGeofenceHandlers,
    onMapEvent,        // FASE E1.1: Nova API
    offMapEvent,       // FASE E1.1: Nova API
    onMapEvents,       // FASE E1.1: Nova API
    cleanup,
  };
}
