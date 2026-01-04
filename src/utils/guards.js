/**
 * @file guards.js
 * @description Funções puras de validação e guards - sem dependências de DOM, store ou window
 */

/**
 * Verifica se coordenadas são válidas
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} True se coordenadas são válidas
 */
export const isValidCoords = (lat, lon) => {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (isNaN(lat) || isNaN(lon)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  // Coordenadas (0, 0) geralmente indicam GPS inválido
  if (lat === 0 && lon === 0) return false;
  return true;
};

/**
 * Converte valor para número de forma segura
 * @param {*} value - Valor a converter
 * @param {number} [defaultValue=0] - Valor padrão se conversão falhar
 * @returns {number} Número convertido ou default
 */
export const safeNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Converte valor para inteiro de forma segura
 * @param {*} value - Valor a converter
 * @param {number} [defaultValue=0] - Valor padrão se conversão falhar
 * @returns {number} Inteiro convertido ou default
 */
export const safeInt = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Converte valor para float de forma segura
 * @param {*} value - Valor a converter
 * @param {number} [defaultValue=0] - Valor padrão se conversão falhar
 * @returns {number} Float convertido ou default
 */
export const safeFloat = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Verifica se valor é string não vazia
 * @param {*} value - Valor a verificar
 * @returns {boolean} True se string não vazia
 */
export const isNonEmptyString = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Verifica se valor é array não vazio
 * @param {*} value - Valor a verificar
 * @returns {boolean} True se array não vazio
 */
export const isNonEmptyArray = (value) => {
  return Array.isArray(value) && value.length > 0;
};

/**
 * Verifica se valor é objeto não nulo (exclui arrays)
 * @param {*} value - Valor a verificar
 * @returns {boolean} True se objeto válido
 */
export const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Clamp de valor numérico entre min e max
 * @param {number} value - Valor a limitar
 * @param {number} min - Mínimo
 * @param {number} max - Máximo
 * @returns {number} Valor clamped
 */
export const clamp = (value, min, max) => {
  const num = safeNumber(value, min);
  return Math.min(Math.max(num, min), max);
};

/**
 * Verifica se velocidade é válida (não negativa, dentro de limite razoável)
 * @param {*} speed - Velocidade a verificar
 * @param {number} [maxSpeed=500] - Velocidade máxima aceitável (km/h)
 * @returns {boolean} True se velocidade válida
 */
export const isValidSpeed = (speed, maxSpeed = 500) => {
  const num = safeNumber(speed, -1);
  return num >= 0 && num <= maxSpeed;
};

/**
 * Verifica se heading/course é válido (0-360)
 * @param {*} course - Curso/heading a verificar
 * @returns {boolean} True se válido
 */
export const isValidCourse = (course) => {
  const num = safeNumber(course, -1);
  return num >= 0 && num <= 360;
};

/**
 * Verifica se altitude é razoável
 * @param {*} altitude - Altitude a verificar
 * @param {number} [minAlt=-500] - Altitude mínima (metros abaixo do mar)
 * @param {number} [maxAlt=50000] - Altitude máxima (metros)
 * @returns {boolean} True se altitude válida
 */
export const isValidAltitude = (altitude, minAlt = -500, maxAlt = 50000) => {
  const num = safeNumber(altitude, minAlt - 1);
  return num >= minAlt && num <= maxAlt;
};

/**
 * Garante que um valor existe ou retorna fallback
 * @param {*} value - Valor a verificar
 * @param {*} fallback - Valor de fallback
 * @returns {*} Valor original ou fallback
 */
export const ensure = (value, fallback) => {
  return value !== null && value !== undefined ? value : fallback;
};

/**
 * Verifica se deviceId é válido
 * @param {*} deviceId - ID do dispositivo
 * @returns {boolean} True se válido
 */
export const isValidDeviceId = (deviceId) => {
  if (typeof deviceId === 'number') return deviceId > 0;
  if (typeof deviceId === 'string') return deviceId.trim().length > 0;
  return false;
};
