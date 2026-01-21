/**
 * Speed Helpers - PR-09C
 * 
 * Guardrails e utilitários UI para velocidade (km/h)
 * Complementa speedNormalizer.js com funções de formatação e validação
 * 
 * Padrão: km/h sempre (alinhado com PR-09A backend + PR-09B frontend)
 */

/**
 * Formata velocidade para exibição
 * 
 * @param {number|string|null|undefined} value - Velocidade em km/h
 * @param {object} options - Opções de formatação
 * @param {number} options.decimals - Casas decimais (default: 0)
 * @param {boolean} options.showUnit - Exibir "km/h" (default: true)
 * @param {string} options.emptyText - Texto se vazio (default: "—")
 * @returns {string} Velocidade formatada (ex: "100 km/h" ou "—")
 */
export function formatSpeedKmh(value, options = {}) {
  const {
    decimals = 0,
    showUnit = true,
    emptyText = '—'
  } = options;
  
  // Sanitizar input
  const v = parseSpeedKmh(value);
  
  // Se zero ou inválido, retornar texto vazio
  if (v === 0 || isNaN(v)) {
    return emptyText;
  }
  
  // Formatar número
  const formatted = v.toFixed(decimals);
  
  // Adicionar unidade se solicitado
  return showUnit ? `${formatted} km/h` : formatted;
}

/**
 * Parse velocidade de string/number para number seguro
 * 
 * Aceita: "100", "100 km/h", "100,5" (pt-BR), 100 (number)
 * Sanitiza: NaN -> 0, negative -> 0, > 300 -> 300
 * 
 * @param {number|string|null|undefined} input - Input variado
 * @returns {number} Velocidade sanitizada (0..300)
 */
export function parseSpeedKmh(input) {
  if (input === null || input === undefined || input === '') {
    return 0;
  }
  
  // Se já for number
  if (typeof input === 'number') {
    return clampSpeedKmh(input);
  }
  
  // Se for string, limpar e converter
  let cleaned = String(input)
    .replace(/[^\d.,]/g, '') // Remove tudo exceto dígitos, ponto e vírgula
    .replace(',', '.'); // Converte vírgula pt-BR para ponto
  
  const parsed = parseFloat(cleaned);
  
  // Retornar clamped ou 0 se inválido
  return isNaN(parsed) ? 0 : clampSpeedKmh(parsed);
}

/**
 * Clamp velocidade dentro dos limites aceitáveis
 * 
 * @param {number} value - Velocidade
 * @param {number} min - Mínimo (default: 0)
 * @param {number} max - Máximo (default: 300)
 * @returns {number} Velocidade dentro dos limites
 */
export function clampSpeedKmh(value, min = 0, max = 300) {
  const v = parseFloat(value);
  if (isNaN(v)) return 0;
  return Math.max(min, Math.min(max, v));
}

/**
 * Verifica se valor de velocidade é provavelmente errado
 * 
 * Thresholds:
 * - Muito baixo: < 20 km/h (urbano lento, provável erro)
 * - Muito alto: > 180 km/h (raro, provável erro)
 * 
 * @param {number} value - Velocidade em km/h
 * @returns {object} { low: boolean, high: boolean, valid: boolean }
 */
export function isProbablyWrongSpeedLimit(value) {
  const v = parseSpeedKmh(value);
  
  // Se zero, não é erro (sem limite configurado)
  if (v === 0) {
    return { low: false, high: false, valid: true };
  }
  
  const low = v > 0 && v < 20;
  const high = v > 180;
  const valid = !low && !high;
  
  return { low, high, valid };
}

/**
 * Retorna texto de range sugerido para velocidade
 * 
 * @param {string} locale - Locale (pt-BR, en-US, es-ES)
 * @returns {string} Texto sugerido
 */
export function getSpeedLimitSuggestion(locale = 'pt-BR') {
  const suggestions = {
    'pt-BR': 'Valores comuns: urbano 40–60, rodovia 80–110',
    'en-US': 'Common values: urban 40–60, highway 80–110',
    'es-ES': 'Valores comunes: urbano 40–60, carretera 80–110'
  };
  
  return suggestions[locale] || suggestions['pt-BR'];
}

/**
 * Valida e sanitiza limite de velocidade
 * Retorna objeto com valor sanitizado + warnings
 * 
 * @param {number|string} value - Valor do input
 * @returns {object} { value: number, warnings: string[] }
 */
export function validateSpeedLimit(value) {
  const v = parseSpeedKmh(value);
  const check = isProbablyWrongSpeedLimit(v);
  const warnings = [];
  
  if (check.low) {
    warnings.push('Valor muito baixo (provável erro)');
  }
  
  if (check.high) {
    warnings.push('Valor muito alto (provável erro)');
  }
  
  return {
    value: v,
    warnings,
    isValid: check.valid
  };
}

export default {
  formatSpeedKmh,
  parseSpeedKmh,
  clampSpeedKmh,
  isProbablyWrongSpeedLimit,
  getSpeedLimitSuggestion,
  validateSpeedLimit
};
