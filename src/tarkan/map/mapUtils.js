/**
 * Map utility functions
 * Helper functions for map-related operations
 */

/**
 * Formata CPF para exibição
 * @param {string} cpf - CPF sem formatação
 * @returns {string} CPF formatado (XXX.XXX.XXX-XX)
 */
export const formatCPF = (cpf) => {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Normaliza course (direção) para 0-360 graus
 * @param {number} course - Direção em graus
 * @returns {number} Direção normalizada (0-360)
 */
export const normalizeCourse = (course) => {
  if (course == null || isNaN(course)) return 0;
  let normalized = course % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
};

/**
 * Converte graus em direção cardeal (N, NE, E, SE, S, SW, W, NW)
 * @param {number} degrees - Graus (0-360)
 * @returns {string} Direção cardeal
 */
export const getCardinalDirection = (degrees) => {
  if (degrees == null || isNaN(degrees)) return 'N';
  const normalized = normalizeCourse(degrees);
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
};

/**
 * Formata data/hora para exibição
 * @param {Date|string|number} date - Data a formatar
 * @returns {string} Data formatada (DD/MM/YYYY HH:mm:ss)
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/**
 * Retorna classe CSS baseada na qualidade do sinal
 * @param {object} position - Objeto de posição com atributo 'rssi' ou 'signalStrength'
 * @returns {string} Classe CSS (signal-excellent, signal-good, signal-fair, signal-poor, signal-none)
 */
export const getSignalClass = (position) => {
  if (!position) return 'signal-none';
  
  const rssi = position.attributes?.rssi || position.attributes?.signalStrength;
  if (!rssi) return 'signal-none';
  
  // RSSI típico: -50 (excelente) a -100 (ruim)
  if (rssi >= -50) return 'signal-excellent';
  if (rssi >= -70) return 'signal-good';
  if (rssi >= -85) return 'signal-fair';
  if (rssi >= -100) return 'signal-poor';
  return 'signal-none';
};
