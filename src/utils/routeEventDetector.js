/**
 * routeEventDetector.js
 * 
 * FASE 7 — Detecção de Eventos na Rota
 * 
 * Funções puras para detectar eventos relevantes em uma rota:
 * - Paradas longas (> X minutos)
 * - Excesso de velocidade (> limite configurável)
 * - Início e fim de viagem
 * - Eventos especiais (ignição, motor, etc.)
 * 
 * ⚠️ REGRAS:
 * - Funções puras (sem side effects)
 * - Sem dependência de Vue/Store
 * - Retorno sempre ordenado por index
 * - Performance O(n) - uma passada
 */

// ============================================================================
// TIPOS DE EVENTOS
// ============================================================================

/**
 * @typedef {Object} RouteEvent
 * @property {'start'|'end'|'stop'|'speed'|'ignition_on'|'ignition_off'} type - Tipo do evento
 * @property {number} index - Índice do ponto na rota (0-based)
 * @property {string} label - Texto para exibição
 * @property {string} [icon] - Classe FontAwesome do ícone
 * @property {string} [color] - Cor do evento (hex ou CSS var)
 * @property {Object} [meta] - Dados extras do evento
 */

/**
 * @typedef {Object} DetectionConfig
 * @property {number} [stopMinMinutes=10] - Tempo mínimo para considerar parada (minutos)
 * @property {number} [speedLimit=80] - Limite de velocidade (km/h)
 * @property {boolean} [detectStops=true] - Detectar paradas longas
 * @property {boolean} [detectSpeed=true] - Detectar excesso de velocidade
 * @property {boolean} [detectStartEnd=true] - Detectar início/fim
 * @property {boolean} [detectIgnition=false] - Detectar eventos de ignição (se disponível)
 */

// ============================================================================
// CONSTANTES
// ============================================================================

const DEFAULT_CONFIG = {
  stopMinMinutes: 10,
  speedLimit: 80,
  detectStops: true,
  detectSpeed: true,
  detectStartEnd: true,
  detectIgnition: false,
};

const EVENT_STYLES = {
  start: {
    icon: 'fas fa-play-circle',
    color: 'var(--el-color-success)',
    priority: 1,
  },
  end: {
    icon: 'fas fa-flag-checkered',
    color: 'var(--el-color-danger)',
    priority: 2,
  },
  stop: {
    icon: 'fas fa-parking',
    color: 'var(--el-color-warning)',
    priority: 3,
  },
  speed: {
    icon: 'fas fa-tachometer-alt',
    color: 'var(--el-color-danger)',
    priority: 4,
  },
  ignition_on: {
    icon: 'fas fa-key',
    color: 'var(--el-color-success)',
    priority: 5,
  },
  ignition_off: {
    icon: 'fas fa-power-off',
    color: 'var(--el-color-info)',
    priority: 6,
  },
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formata duração em minutos para texto legível
 * @param {number} minutes 
 * @returns {string}
 */
const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Calcula diferença em minutos entre dois timestamps
 * @param {string|Date} time1 
 * @param {string|Date} time2 
 * @returns {number}
 */
const getMinutesDiff = (time1, time2) => {
  const t1 = new Date(time1).getTime();
  const t2 = new Date(time2).getTime();
  return Math.abs(t2 - t1) / (1000 * 60);
};

// ============================================================================
// DETECTORES INDIVIDUAIS
// ============================================================================

/**
 * Detecta início e fim da rota
 * @param {Array} points 
 * @returns {RouteEvent[]}
 */
const detectStartEnd = (points) => {
  if (points.length < 2) return [];
  
  const events = [];
  
  // Início
  events.push({
    type: 'start',
    index: 0,
    label: 'Início da viagem',
    ...EVENT_STYLES.start,
    meta: {
      time: points[0].fixTime,
      address: points[0].address,
    },
  });
  
  // Fim
  const lastIndex = points.length - 1;
  events.push({
    type: 'end',
    index: lastIndex,
    label: 'Fim da viagem',
    ...EVENT_STYLES.end,
    meta: {
      time: points[lastIndex].fixTime,
      address: points[lastIndex].address,
    },
  });
  
  return events;
};

/**
 * Detecta paradas longas
 * @param {Array} points 
 * @param {number} minMinutes - Tempo mínimo para considerar parada
 * @returns {RouteEvent[]}
 */
const detectStops = (points, minMinutes = 10) => {
  if (points.length < 3) return [];
  
  const events = [];
  let stopStartIndex = null;
  let stopStartTime = null;
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const isStopped = (point.speed || 0) < 1; // Velocidade < 1 km/h = parado
    
    if (isStopped) {
      if (stopStartIndex === null) {
        // Início de uma possível parada
        stopStartIndex = i;
        stopStartTime = point.fixTime;
      }
    } else {
      // Voltou a mover
      if (stopStartIndex !== null && stopStartTime !== null) {
        const prevPoint = points[i - 1];
        const durationMinutes = getMinutesDiff(stopStartTime, prevPoint.fixTime);
        
        if (durationMinutes >= minMinutes) {
          events.push({
            type: 'stop',
            index: stopStartIndex,
            label: `Parada ${formatDuration(durationMinutes)}`,
            ...EVENT_STYLES.stop,
            meta: {
              startTime: stopStartTime,
              endTime: prevPoint.fixTime,
              durationMinutes,
              address: points[stopStartIndex].address,
              endIndex: i - 1,
            },
          });
        }
        
        stopStartIndex = null;
        stopStartTime = null;
      }
    }
  }
  
  // Verificar se terminou parado
  if (stopStartIndex !== null && stopStartTime !== null) {
    const lastPoint = points[points.length - 1];
    const durationMinutes = getMinutesDiff(stopStartTime, lastPoint.fixTime);
    
    if (durationMinutes >= minMinutes) {
      events.push({
        type: 'stop',
        index: stopStartIndex,
        label: `Parada ${formatDuration(durationMinutes)}`,
        ...EVENT_STYLES.stop,
        meta: {
          startTime: stopStartTime,
          endTime: lastPoint.fixTime,
          durationMinutes,
          address: points[stopStartIndex].address,
          endIndex: points.length - 1,
        },
      });
    }
  }
  
  return events;
};

/**
 * Detecta eventos de excesso de velocidade
 * @param {Array} points 
 * @param {number} speedLimit - Limite em km/h
 * @returns {RouteEvent[]}
 */
const detectSpeedEvents = (points, speedLimit = 80) => {
  if (points.length < 2) return [];
  
  const events = [];
  let speedingStartIndex = null;
  let maxSpeed = 0;
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const speed = point.speed || 0;
    const isSpeeding = speed > speedLimit;
    
    if (isSpeeding) {
      if (speedingStartIndex === null) {
        // Início de excesso de velocidade
        speedingStartIndex = i;
        maxSpeed = speed;
      } else {
        // Continua excedendo, atualizar máxima
        maxSpeed = Math.max(maxSpeed, speed);
      }
    } else {
      // Parou de exceder
      if (speedingStartIndex !== null) {
        events.push({
          type: 'speed',
          index: speedingStartIndex,
          label: `${Math.round(maxSpeed)} km/h`,
          ...EVENT_STYLES.speed,
          meta: {
            maxSpeed,
            speedLimit,
            startIndex: speedingStartIndex,
            endIndex: i - 1,
            time: points[speedingStartIndex].fixTime,
          },
        });
        
        speedingStartIndex = null;
        maxSpeed = 0;
      }
    }
  }
  
  // Verificar se terminou em excesso
  if (speedingStartIndex !== null) {
    events.push({
      type: 'speed',
      index: speedingStartIndex,
      label: `${Math.round(maxSpeed)} km/h`,
      ...EVENT_STYLES.speed,
      meta: {
        maxSpeed,
        speedLimit,
        startIndex: speedingStartIndex,
        endIndex: points.length - 1,
        time: points[speedingStartIndex].fixTime,
      },
    });
  }
  
  return events;
};

/**
 * Detecta eventos de ignição (se dados disponíveis)
 * @param {Array} points 
 * @returns {RouteEvent[]}
 */
const detectIgnitionEvents = (points) => {
  if (points.length < 2) return [];
  
  const events = [];
  let lastIgnitionState = null;
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const ignition = point.attributes?.ignition;
    
    // Só processar se temos dado de ignição
    if (ignition === undefined) continue;
    
    if (lastIgnitionState !== null && ignition !== lastIgnitionState) {
      if (ignition) {
        events.push({
          type: 'ignition_on',
          index: i,
          label: 'Ignição ligada',
          ...EVENT_STYLES.ignition_on,
          meta: {
            time: point.fixTime,
            address: point.address,
          },
        });
      } else {
        events.push({
          type: 'ignition_off',
          index: i,
          label: 'Ignição desligada',
          ...EVENT_STYLES.ignition_off,
          meta: {
            time: point.fixTime,
            address: point.address,
          },
        });
      }
    }
    
    lastIgnitionState = ignition;
  }
  
  return events;
};

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

/**
 * Detecta todos os eventos relevantes em uma rota
 * 
 * @param {Array} points - Array de pontos da rota
 * @param {DetectionConfig} [config] - Configurações de detecção
 * @returns {RouteEvent[]} - Array de eventos ordenados por index
 * 
 * @example
 * const events = detectRouteEvents(routePoints, { 
 *   stopMinMinutes: 5, 
 *   speedLimit: 100 
 * });
 */
export const detectRouteEvents = (points, config = {}) => {
  if (!points || points.length < 2) {
    return [];
  }
  
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const events = [];
  
  // Detectar cada tipo de evento
  if (cfg.detectStartEnd) {
    events.push(...detectStartEnd(points));
  }
  
  if (cfg.detectStops) {
    events.push(...detectStops(points, cfg.stopMinMinutes));
  }
  
  if (cfg.detectSpeed) {
    events.push(...detectSpeedEvents(points, cfg.speedLimit));
  }
  
  if (cfg.detectIgnition) {
    events.push(...detectIgnitionEvents(points));
  }
  
  // Ordenar por index, depois por prioridade
  events.sort((a, b) => {
    if (a.index !== b.index) {
      return a.index - b.index;
    }
    return (a.priority || 99) - (b.priority || 99);
  });
  
  return events;
};

/**
 * Cria um mapa de índice -> eventos para lookup rápido O(1)
 * 
 * @param {RouteEvent[]} events 
 * @returns {Map<number, RouteEvent[]>}
 */
export const createEventIndexMap = (events) => {
  const map = new Map();
  
  for (const event of events) {
    if (!map.has(event.index)) {
      map.set(event.index, []);
    }
    map.get(event.index).push(event);
  }
  
  return map;
};

/**
 * Calcula posições percentuais dos eventos para a barra de progresso
 * 
 * @param {RouteEvent[]} events 
 * @param {number} totalPoints 
 * @returns {Array<{event: RouteEvent, percent: number}>}
 */
export const calculateEventPositions = (events, totalPoints) => {
  if (!events.length || totalPoints <= 1) {
    return [];
  }
  
  return events.map(event => ({
    event,
    percent: (event.index / (totalPoints - 1)) * 100,
  }));
};

// Exportar estilos para uso em componentes
export const EVENT_STYLE_MAP = EVENT_STYLES;

// Exportar config padrão para referência
export const DEFAULT_DETECTION_CONFIG = DEFAULT_CONFIG;

export default {
  detectRouteEvents,
  createEventIndexMap,
  calculateEventPositions,
  EVENT_STYLE_MAP,
  DEFAULT_DETECTION_CONFIG,
};
