/**
 * routeChapters.js
 * 
 * FASE 8 — Geração de Capítulos da Viagem
 * 
 * Segmenta a rota em trechos (capítulos) baseados em paradas longas.
 * Cada capítulo representa um trecho contínuo de movimento.
 * 
 * ⚠️ REGRAS:
 * - Funções puras (sem side effects)
 * - Performance O(n)
 * - Sem dependência de Vue/Store
 */

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calcula distância entre dois pontos usando Haversine (km)
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number}
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calcula a distância total de um trecho da rota
 * @param {Array} points - Array de pontos
 * @param {number} startIdx - Índice inicial
 * @param {number} endIdx - Índice final
 * @returns {number} - Distância em km
 */
const calculateSegmentDistance = (points, startIdx, endIdx) => {
  let distance = 0;
  for (let i = startIdx; i < endIdx && i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    distance += haversineDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
  }
  return distance;
};

/**
 * Formata duração em ms para texto legível
 * @param {number} ms 
 * @returns {string}
 */
const formatDurationMs = (ms) => {
  const minutes = Math.floor(ms / (1000 * 60));
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

// ============================================================================
// GERADOR DE CAPÍTULOS
// ============================================================================

/**
 * @typedef {Object} Chapter
 * @property {number} id - ID do capítulo (1-based)
 * @property {number} startIndex - Índice inicial do trecho
 * @property {number} endIndex - Índice final do trecho
 * @property {string} label - Nome do capítulo (ex: "Trecho 1")
 * @property {string} durationLabel - Duração formatada
 * @property {number} durationMs - Duração em ms
 * @property {number} distanceKm - Distância em km
 * @property {string} startAddress - Endereço inicial
 * @property {string} endAddress - Endereço final
 * @property {string} startTime - Hora de início
 * @property {string} endTime - Hora de fim
 * @property {number} pointCount - Quantidade de pontos no trecho
 */

/**
 * Gera capítulos da viagem baseado em paradas longas
 * 
 * @param {Array} points - Array de pontos da rota
 * @param {Array} events - Array de eventos (de detectRouteEvents)
 * @param {Object} [options] - Opções
 * @param {number} [options.minStopMinutes=10] - Tempo mínimo de parada para dividir capítulo
 * @returns {Chapter[]}
 * 
 * @example
 * const chapters = buildRouteChapters(points, events, { minStopMinutes: 10 });
 */
export const buildRouteChapters = (points, events, options = {}) => {
  if (!points || points.length < 2) {
    return [];
  }
  
  const { minStopMinutes = 10 } = options;
  
  // Filtrar apenas eventos de parada longa
  const stopEvents = events
    .filter(e => e.type === 'stop' && (e.meta?.durationMinutes || 0) >= minStopMinutes)
    .sort((a, b) => a.index - b.index);
  
  const chapters = [];
  let chapterStart = 0;
  let chapterId = 1;
  
  // Criar capítulos baseados nas paradas
  for (const stop of stopEvents) {
    // Capítulo vai do início atual até o início da parada
    if (stop.index > chapterStart) {
      const chapter = createChapter(
        points,
        chapterId,
        chapterStart,
        stop.index
      );
      chapters.push(chapter);
      chapterId++;
    }
    
    // Próximo capítulo começa após a parada
    // Usar endIndex da parada se disponível, senão usar index + 1
    const stopEndIndex = stop.meta?.endIndex ?? stop.index;
    chapterStart = Math.min(stopEndIndex + 1, points.length - 1);
  }
  
  // Último capítulo (da última parada até o fim)
  if (chapterStart < points.length - 1) {
    const chapter = createChapter(
      points,
      chapterId,
      chapterStart,
      points.length - 1
    );
    chapters.push(chapter);
  }
  
  // Se não houve paradas, criar capítulo único
  if (chapters.length === 0 && points.length >= 2) {
    chapters.push(createChapter(points, 1, 0, points.length - 1));
  }
  
  return chapters;
};

/**
 * Cria um objeto Chapter
 * @private
 */
const createChapter = (points, id, startIndex, endIndex) => {
  const startPoint = points[startIndex];
  const endPoint = points[endIndex];
  
  const startTime = new Date(startPoint.fixTime);
  const endTime = new Date(endPoint.fixTime);
  const durationMs = endTime.getTime() - startTime.getTime();
  
  const distanceKm = calculateSegmentDistance(points, startIndex, endIndex);
  
  return {
    id,
    startIndex,
    endIndex,
    label: `Trecho ${id}`,
    durationLabel: formatDurationMs(durationMs),
    durationMs,
    distanceKm: Math.round(distanceKm * 100) / 100,
    startAddress: startPoint.address || `${startPoint.latitude.toFixed(5)},${startPoint.longitude.toFixed(5)}`,
    endAddress: endPoint.address || `${endPoint.latitude.toFixed(5)},${endPoint.longitude.toFixed(5)}`,
    startTime: startTime.toLocaleTimeString(),
    endTime: endTime.toLocaleTimeString(),
    pointCount: endIndex - startIndex + 1
  };
};

// ============================================================================
// RESUMO EXECUTIVO
// ============================================================================

/**
 * @typedef {Object} RouteSummary
 * @property {number} totalPoints
 * @property {number} totalDistanceKm
 * @property {string} durationLabel
 * @property {number} durationMs
 * @property {number} stopCount
 * @property {string} totalStopTimeLabel
 * @property {number} totalStopTimeMs
 * @property {Object|null} longestStop
 * @property {number} speedEventCount
 * @property {Object|null} maxSpeed
 * @property {number} movingTimeMs
 * @property {string} movingTimeLabel
 * @property {number} movingPercent
 */

/**
 * Gera resumo executivo da rota
 * 
 * @param {Array} points - Array de pontos da rota
 * @param {Array} events - Array de eventos
 * @returns {RouteSummary}
 */
export const buildRouteSummary = (points, events) => {
  if (!points || points.length < 2) {
    return {
      totalPoints: points?.length || 0,
      totalDistanceKm: 0,
      durationLabel: '0min',
      durationMs: 0,
      stopCount: 0,
      totalStopTimeLabel: '0min',
      totalStopTimeMs: 0,
      longestStop: null,
      speedEventCount: 0,
      maxSpeed: null,
      movingTimeMs: 0,
      movingTimeLabel: '0min',
      movingPercent: 0
    };
  }
  
  // Calcular distância total
  const totalDistanceKm = calculateSegmentDistance(points, 0, points.length - 1);
  
  // Calcular duração total
  const startTime = new Date(points[0].fixTime).getTime();
  const endTime = new Date(points[points.length - 1].fixTime).getTime();
  const durationMs = endTime - startTime;
  
  // Processar eventos de parada
  const stopEvents = events.filter(e => e.type === 'stop');
  const stopCount = stopEvents.length;
  
  let totalStopTimeMs = 0;
  let longestStop = null;
  
  for (const stop of stopEvents) {
    const stopDurationMs = (stop.meta?.durationMinutes || 0) * 60 * 1000;
    totalStopTimeMs += stopDurationMs;
    
    if (!longestStop || stopDurationMs > (longestStop.durationMs || 0)) {
      longestStop = {
        index: stop.index,
        address: stop.meta?.address || points[stop.index]?.address || 'Desconhecido',
        durationMs: stopDurationMs,
        durationLabel: stop.label || formatDurationMs(stopDurationMs)
      };
    }
  }
  
  // Processar eventos de velocidade
  const speedEvents = events.filter(e => e.type === 'speed');
  const speedEventCount = speedEvents.length;
  
  let maxSpeed = null;
  
  // Encontrar velocidade máxima nos pontos
  let maxSpeedValue = 0;
  let maxSpeedIndex = 0;
  
  for (let i = 0; i < points.length; i++) {
    const speed = points[i].speed || 0;
    if (speed > maxSpeedValue) {
      maxSpeedValue = speed;
      maxSpeedIndex = i;
    }
  }
  
  if (maxSpeedValue > 0) {
    maxSpeed = {
      value: Math.round(maxSpeedValue),
      index: maxSpeedIndex,
      address: points[maxSpeedIndex]?.address || 'Desconhecido'
    };
  }
  
  // Calcular tempo em movimento
  const movingTimeMs = Math.max(0, durationMs - totalStopTimeMs);
  const movingPercent = durationMs > 0 ? Math.round((movingTimeMs / durationMs) * 100) : 0;
  
  return {
    totalPoints: points.length,
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    durationLabel: formatDurationMs(durationMs),
    durationMs,
    stopCount,
    totalStopTimeLabel: formatDurationMs(totalStopTimeMs),
    totalStopTimeMs,
    longestStop,
    speedEventCount,
    maxSpeed,
    movingTimeMs,
    movingTimeLabel: formatDurationMs(movingTimeMs),
    movingPercent
  };
};

export default {
  buildRouteChapters,
  buildRouteSummary
};
