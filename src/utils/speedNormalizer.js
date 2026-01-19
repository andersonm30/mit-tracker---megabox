/**
 * SpeedNormalizer - Frontend
 * 
 * Normaliza velocidades para km/h independente da unidade de origem.
 * Alinhado com o padrão do produto (PR-09A backend, PR-09B frontend).
 * 
 * Regra: km/h é a unidade oficial do produto para exibição e persistência.
 */

/**
 * Converte velocidade para km/h
 * 
 * @param {number} value - Valor da velocidade
 * @param {string} unit - Unidade de origem: 'kmh', 'kn', 'knot', 'knots'
 * @returns {number} Velocidade em km/h (>= 0)
 */
export function toKmh(value, unit = 'kmh') {
  let v = parseFloat(value) || 0;
  
  // Sanitizar valores negativos
  if (v < 0) v = 0;
  
  // Normalizar nome da unidade
  const u = String(unit).toLowerCase().trim();
  
  // Conversão: 1 knot = 1.852 km/h
  if (u === 'kn' || u === 'knot' || u === 'knots') {
    v = v * 1.852;
  }
  
  return v;
}

/**
 * Sanitiza valor de velocidade em km/h
 * 
 * @param {number} value - Velocidade em km/h
 * @returns {number} Velocidade >= 0
 */
export function sanitizeKmh(value) {
  const v = parseFloat(value) || 0;
  return v >= 0 ? v : 0;
}

/**
 * Formata velocidade para exibição
 * 
 * @param {number} kmh - Velocidade em km/h
 * @param {number} decimals - Casas decimais (default: 0)
 * @returns {string} Velocidade formatada com unidade
 */
export function formatKmh(kmh, decimals = 0) {
  const v = sanitizeKmh(kmh);
  return `${v.toFixed(decimals)} km/h`;
}

export default {
  toKmh,
  sanitizeKmh,
  formatKmh
};
