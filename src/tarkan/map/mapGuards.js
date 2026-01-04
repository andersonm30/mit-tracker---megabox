/**
 * HARDENING: Guards centralizados para prevenir bugs silenciosos no kore-map
 * 
 * FILOSOFIA:
 * - Falhar rápido com mensagens claras (fail-fast)
 * - Retornar valores seguros ao invés de lançar exceções (graceful degradation)
 * - Log de warnings para debug, mas não quebrar UX
 * 
 * @module mapGuards
 * @created 2026-01-02
 */

// ============================================================================
// CONSTANTES DE VALIDAÇÃO
// ============================================================================

export const MAP_LIMITS = {
  LAT_MIN: -90,
  LAT_MAX: 90,
  LNG_MIN: -180,
  LNG_MAX: 180,
  ZOOM_MIN: 1,
  ZOOM_MAX: 22,
  COURSE_MIN: 0,
  COURSE_MAX: 360,
  SPEED_MIN: 0,
  SPEED_MAX: 999,
};

export const DEFAULT_VALUES = {
  LAT: -29.942484, // Porto Alegre (fallback)
  LNG: -50.990526,
  ZOOM: 10,
  COURSE: 0,
  SPEED: 0,
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Valida se valor é um número finito (não NaN, não Infinity)
 * @param {*} value - Valor a validar
 * @returns {boolean} true se número finito
 */
export function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Valida se lat/lng são coordenadas válidas
 * @param {*} lat - Latitude (-90 a 90)
 * @param {*} lng - Longitude (-180 a 180)
 * @returns {boolean} true se coordenadas válidas
 */
export function isValidLatLng(lat, lng) {
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
    return false;
  }
  
  return (
    lat >= MAP_LIMITS.LAT_MIN &&
    lat <= MAP_LIMITS.LAT_MAX &&
    lng >= MAP_LIMITS.LNG_MIN &&
    lng <= MAP_LIMITS.LNG_MAX
  );
}

/**
 * Valida se lat/lng são coordenadas válidas E não são (0,0)
 * @param {*} lat - Latitude
 * @param {*} lng - Longitude
 * @returns {boolean} true se coordenadas válidas e não (0,0)
 */
export function isValidNonZeroLatLng(lat, lng) {
  if (!isValidLatLng(lat, lng)) return false;
  
  const ZERO_TOLERANCE = 0.0001; // ~11 metros
  return Math.abs(lat) > ZERO_TOLERANCE || Math.abs(lng) > ZERO_TOLERANCE;
}

/**
 * Valida se zoom está dentro dos limites do mapa
 * @param {*} zoom - Nível de zoom (1-22)
 * @returns {boolean} true se zoom válido
 */
export function isValidZoom(zoom) {
  return isFiniteNumber(zoom) && 
         zoom >= MAP_LIMITS.ZOOM_MIN && 
         zoom <= MAP_LIMITS.ZOOM_MAX;
}

/**
 * Valida se course está dentro do range 0-360
 * @param {*} course - Ângulo de rotação (0-360)
 * @returns {boolean} true se course válido
 */
export function isValidCourse(course) {
  return isFiniteNumber(course) && 
         course >= MAP_LIMITS.COURSE_MIN && 
         course <= MAP_LIMITS.COURSE_MAX;
}

// ============================================================================
// SAFE CONVERTERS (Graceful Degradation)
// ============================================================================

/**
 * Converte valor para número, retorna fallback se inválido
 * @param {*} value - Valor a converter
 * @param {number} fallback - Valor de fallback (padrão: 0)
 * @param {string} context - Contexto para log (opcional)
 * @returns {number} Número válido ou fallback
 */
export function safeNumber(value, fallback = 0, context) {
  if (isFiniteNumber(value)) {
    return value;
  }
  
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  
  if (context && process.env.NODE_ENV === 'development') {
    console.warn(`[mapGuards] safeNumber: "${value}" inválido em ${context}, usando fallback ${fallback}`);
  }
  
  return fallback;
}

/**
 * Normaliza latitude para range válido (-90 a 90)
 * @param {*} lat - Latitude
 * @param {string} context - Contexto para log
 * @returns {number} Latitude válida ou fallback
 */
export function safeLatitude(lat, context) {
  const num = safeNumber(lat, DEFAULT_VALUES.LAT, context);
  
  if (num < MAP_LIMITS.LAT_MIN) {
    if (context && process.env.NODE_ENV === 'development') {
      console.warn(`[mapGuards] safeLatitude: ${num} < ${MAP_LIMITS.LAT_MIN} em ${context}, clampando`);
    }
    return MAP_LIMITS.LAT_MIN;
  }
  
  if (num > MAP_LIMITS.LAT_MAX) {
    if (context && process.env.NODE_ENV === 'development') {
      console.warn(`[mapGuards] safeLatitude: ${num} > ${MAP_LIMITS.LAT_MAX} em ${context}, clampando`);
    }
    return MAP_LIMITS.LAT_MAX;
  }
  
  return num;
}

/**
 * Normaliza longitude para range válido (-180 a 180)
 * @param {*} lng - Longitude
 * @param {string} context - Contexto para log
 * @returns {number} Longitude válida ou fallback
 */
export function safeLongitude(lng, context) {
  const num = safeNumber(lng, DEFAULT_VALUES.LNG, context);
  
  if (num < MAP_LIMITS.LNG_MIN) {
    if (context && process.env.NODE_ENV === 'development') {
      console.warn(`[mapGuards] safeLongitude: ${num} < ${MAP_LIMITS.LNG_MIN} em ${context}, clampando`);
    }
    return MAP_LIMITS.LNG_MIN;
  }
  
  if (num > MAP_LIMITS.LNG_MAX) {
    if (context && process.env.NODE_ENV === 'development') {
      console.warn(`[mapGuards] safeLongitude: ${num} > ${MAP_LIMITS.LNG_MAX} em ${context}, clampando`);
    }
    return MAP_LIMITS.LNG_MAX;
  }
  
  return num;
}

/**
 * Normaliza par de coordenadas [lat, lng]
 * @param {*} lat - Latitude
 * @param {*} lng - Longitude
 * @param {string} context - Contexto para log
 * @returns {Array} [lat, lng] válidos ou fallback
 */
export function safeLatLng(lat, lng, context) {
  const safeLat = safeLatitude(lat, context);
  const safeLng = safeLongitude(lng, context);
  
  return [safeLat, safeLng];
}

/**
 * Normaliza ângulo de course para range 0-360
 * @param {*} course - Ângulo de rotação
 * @param {string} context - Contexto para log
 * @returns {number} Course normalizado (0-360)
 */
export function normalizeCourse(course, context) {
  let num = safeNumber(course, DEFAULT_VALUES.COURSE, context);
  
  // Wrap para 0-360
  while (num < 0) {
    num += 360;
  }
  while (num >= 360) {
    num -= 360;
  }
  
  return num;
}

/**
 * Clampa zoom para range válido (1-22)
 * @param {*} zoom - Nível de zoom
 * @param {string} context - Contexto para log
 * @returns {number} Zoom válido
 */
export function clampZoom(zoom, context) {
  const num = safeNumber(zoom, DEFAULT_VALUES.ZOOM, context);
  
  if (num < MAP_LIMITS.ZOOM_MIN) {
    if (context && process.env.NODE_ENV === 'development') {
      console.warn(`[mapGuards] clampZoom: ${num} < ${MAP_LIMITS.ZOOM_MIN} em ${context}, clampando`);
    }
    return MAP_LIMITS.ZOOM_MIN;
  }
  
  if (num > MAP_LIMITS.ZOOM_MAX) {
    if (context && process.env.NODE_ENV === 'development') {
      console.warn(`[mapGuards] clampZoom: ${num} > ${MAP_LIMITS.ZOOM_MAX} em ${context}, clampando`);
    }
    return MAP_LIMITS.ZOOM_MAX;
  }
  
  return num;
}

/**
 * Normaliza velocidade para range válido (0-999 km/h)
 * @param {*} speed - Velocidade
 * @param {string} context - Contexto para log
 * @returns {number} Velocidade válida
 */
export function safeSpeed(speed, context) {
  const num = safeNumber(speed, DEFAULT_VALUES.SPEED, context);
  
  if (num < MAP_LIMITS.SPEED_MIN) {
    return MAP_LIMITS.SPEED_MIN;
  }
  
  if (num > MAP_LIMITS.SPEED_MAX) {
    if (context && process.env.NODE_ENV === 'development') {
      console.warn(`[mapGuards] safeSpeed: ${num} > ${MAP_LIMITS.SPEED_MAX} em ${context}, clampando`);
    }
    return MAP_LIMITS.SPEED_MAX;
  }
  
  return num;
}

/**
 * Converte valor para array, retorna array vazio se inválido
 * @param {*} value - Valor a converter
 * @param {string} context - Contexto para log
 * @returns {Array} Array válido ou []
 */
export function safeArray(value, context) {
  if (Array.isArray(value)) {
    return value;
  }
  
  if (context && value != null && process.env.NODE_ENV === 'development') {
    console.warn(`[mapGuards] safeArray: valor não é array em ${context}, retornando []`);
  }
  
  return [];
}

/**
 * Valida que índice está dentro do range de um array
 * @param {*} index - Índice a validar
 * @param {number} arrayLength - Tamanho do array
 * @param {string} context - Contexto para log
 * @returns {number} Índice clampado para range válido
 */
export function clampIndex(index, arrayLength, context) {
  const num = safeNumber(index, 0, context);
  
  if (arrayLength === 0) {
    return 0;
  }
  
  const clamped = Math.max(0, Math.min(num, arrayLength - 1));
  
  if (clamped !== num && context && process.env.NODE_ENV === 'development') {
    console.warn(`[mapGuards] clampIndex: índice ${num} fora do range [0, ${arrayLength-1}] em ${context}, clampado para ${clamped}`);
  }
  
  return clamped;
}

/**
 * Valida que ponto de rota tem estrutura mínima
 * @param {*} point - Ponto de rota
 * @returns {boolean} true se ponto válido
 */
export function isValidRoutePoint(point) {
  if (!point || typeof point !== 'object') {
    return false;
  }
  
  // Formato array: [lat, lng, ...]
  if (Array.isArray(point)) {
    return isValidLatLng(point[0], point[1]);
  }
  
  // Formato objeto: { latitude, longitude } ou { lat, lng }
  const lat = point.latitude ?? point.lat;
  const lng = point.longitude ?? point.lng;
  
  return isValidLatLng(lat, lng);
}

/**
 * Extrai lat/lng de ponto em qualquer formato
 * @param {*} point - Ponto em formato array ou objeto
 * @param {string} context - Contexto para log
 * @returns {Array|null} [lat, lng] válidos ou null se inválido
 */
export function extractLatLng(point, context) {
  if (!point) {
    return null;
  }
  
  // Formato array: [lat, lng, ...]
  if (Array.isArray(point)) {
    const lat = point[0];
    const lng = point[1];
    
    if (isValidLatLng(lat, lng)) {
      return [lat, lng];
    }
    
    if (context && process.env.NODE_ENV === 'development') {
      console.warn(`[mapGuards] extractLatLng: array inválido [${lat}, ${lng}] em ${context}`);
    }
    return null;
  }
  
  // Formato objeto: { latitude, longitude } ou { lat, lng }
  if (typeof point === 'object') {
    const lat = point.latitude ?? point.lat;
    const lng = point.longitude ?? point.lng;
    
    if (isValidLatLng(lat, lng)) {
      return [lat, lng];
    }
    
    if (context && process.env.NODE_ENV === 'development') {
      console.warn(`[mapGuards] extractLatLng: objeto inválido {lat: ${lat}, lng: ${lng}} em ${context}`);
    }
    return null;
  }
  
  if (context && process.env.NODE_ENV === 'development') {
    console.warn(`[mapGuards] extractLatLng: formato desconhecido em ${context}`);
  }
  return null;
}

/**
 * Filtra pontos inválidos de um array
 * @param {Array} points - Array de pontos
 * @param {string} context - Contexto para log
 * @returns {Array} Array com apenas pontos válidos
 */
export function filterValidPoints(points, context) {
  const valid = points.filter(p => isValidRoutePoint(p));
  
  const filtered = points.length - valid.length;
  if (filtered > 0 && context && process.env.NODE_ENV === 'development') {
    console.warn(`[mapGuards] filterValidPoints: ${filtered} pontos inválidos removidos de ${points.length} em ${context}`);
  }
  
  return valid;
}

/**
 * Lança erro se mapa não estiver pronto
 * @param {*} map - Instância do Leaflet map
 * @param {string} operation - Nome da operação sendo executada
 * @throws {Error} se mapa não estiver pronto
 */
export function assertMapReady(map, operation) {
  if (!map || typeof map !== 'object') {
    throw new Error(`[mapGuards] assertMapReady: mapa não existe para operação "${operation}"`);
  }
  
  if (!map._loaded) {
    throw new Error(`[mapGuards] assertMapReady: mapa não está carregado (_loaded=false) para operação "${operation}"`);
  }
  
  if (typeof map.panTo !== 'function') {
    throw new Error(`[mapGuards] assertMapReady: mapa não tem método panTo para operação "${operation}"`);
  }
}

/**
 * Executa operação com map, retorna false se mapa não pronto
 * @param {*} map - Instância do Leaflet map
 * @param {string} operation - Nome da operação
 * @param {Function} fn - Função a executar
 * @returns {boolean} true se sucesso, false se mapa não pronto
 */
export function safeMapOperation(map, operation, fn) {
  try {
    assertMapReady(map, operation);
    fn(map);
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[mapGuards] safeMapOperation: operação "${operation}" falhou:`, error);
    }
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  MAP_LIMITS,
  DEFAULT_VALUES,
  isFiniteNumber,
  isValidLatLng,
  isValidNonZeroLatLng,
  isValidZoom,
  isValidCourse,
  isValidRoutePoint,
  safeNumber,
  safeLatitude,
  safeLongitude,
  safeLatLng,
  normalizeCourse,
  clampZoom,
  safeSpeed,
  safeArray,
  clampIndex,
  extractLatLng,
  filterValidPoints,
  assertMapReady,
  safeMapOperation,
};
