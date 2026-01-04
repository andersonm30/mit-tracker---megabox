/**
 * routeFailSafe.js
 * 
 * FASE 10 — Guards e Fail-Safes para Route Player
 * 
 * Funções de proteção para evitar crashes e garantir UX suave.
 * 
 * ⚠️ REGRAS:
 * - Nunca lançar exceção para o usuário
 * - Sempre retornar fallback seguro
 * - Logar erros para debug
 * - Mensagens claras para o usuário
 */

import { getFlag } from './routeFeatureFlags';

// ============================================================================
// CONSTANTES
// ============================================================================

const DEFAULT_LIMITS = {
  MAX_POINTS_WARNING: 10000,
  MAX_POINTS_HARD_LIMIT: 50000,
  MAX_EVENTS_DISPLAY: 500,
  MAX_CHAPTERS_DISPLAY: 100,
  MAX_BOOKMARKS: 50
};

// ============================================================================
// VALIDAÇÃO DE DADOS
// ============================================================================

/**
 * Valida se um ponto tem os atributos mínimos necessários
 * @param {Object} point 
 * @returns {Object} - Ponto normalizado com fallbacks
 */
export const normalizePoint = (point) => {
  if (!point || typeof point !== 'object') {
    return null;
  }
  
  return {
    id: point.id ?? 0,
    deviceId: point.deviceId ?? 0,
    latitude: parseFloat(point.latitude) || 0,
    longitude: parseFloat(point.longitude) || 0,
    speed: parseFloat(point.speed) || 0,
    course: parseFloat(point.course) || 0,
    fixTime: point.fixTime || new Date().toISOString(),
    address: point.address || '',
    attributes: point.attributes || {},
    valid: point.valid !== false
  };
};

/**
 * Valida e normaliza array de pontos
 * @param {Array} points 
 * @returns {{ points: Array, warnings: Array }}
 */
export const normalizePoints = (points) => {
  const warnings = [];
  
  if (!Array.isArray(points)) {
    warnings.push('Dados de rota inválidos');
    return { points: [], warnings };
  }
  
  const normalized = [];
  let invalidCount = 0;
  
  for (const p of points) {
    const norm = normalizePoint(p);
    if (norm) {
      normalized.push(norm);
    } else {
      invalidCount++;
    }
  }
  
  if (invalidCount > 0) {
    warnings.push(`${invalidCount} pontos inválidos removidos`);
  }
  
  return { points: normalized, warnings };
};

// ============================================================================
// LIMITES E TRUNCAMENTO
// ============================================================================

/**
 * Verifica limites e trunca se necessário
 * @param {Array} points 
 * @param {Object} options
 * @returns {{ points: Array, truncated: boolean, warning: string|null }}
 */
export const enforceLimits = (points, options = {}) => {
  const {
    warningLimit = getFlag('MAX_POINTS_WARNING', DEFAULT_LIMITS.MAX_POINTS_WARNING),
    hardLimit = getFlag('MAX_POINTS_HARD_LIMIT', DEFAULT_LIMITS.MAX_POINTS_HARD_LIMIT),
    showWarning = true
  } = options;
  
  let warning = null;
  let truncated = false;
  let result = points;
  
  if (points.length > hardLimit) {
    // Truncar para hard limit
    result = points.slice(0, hardLimit);
    truncated = true;
    warning = `Limite excedido: ${points.length} pontos truncados para ${hardLimit}`;
    console.warn('[FailSafe]', warning);
  } else if (points.length > warningLimit && showWarning) {
    warning = `Atenção: ${points.length} pontos carregados. Performance pode ser afetada.`;
    console.warn('[FailSafe]', warning);
  }
  
  return { points: result, truncated, warning };
};

/**
 * Limita eventos para exibição
 * @param {Array} events 
 * @returns {Array}
 */
export const limitEvents = (events) => {
  const limit = getFlag('MAX_EVENTS_DISPLAY', DEFAULT_LIMITS.MAX_EVENTS_DISPLAY);
  if (events.length > limit) {
    console.warn(`[FailSafe] Eventos limitados de ${events.length} para ${limit}`);
    return events.slice(0, limit);
  }
  return events;
};

/**
 * Limita capítulos para exibição
 * @param {Array} chapters 
 * @returns {Array}
 */
export const limitChapters = (chapters) => {
  const limit = getFlag('MAX_CHAPTERS_DISPLAY', DEFAULT_LIMITS.MAX_CHAPTERS_DISPLAY);
  if (chapters.length > limit) {
    console.warn(`[FailSafe] Capítulos limitados de ${chapters.length} para ${limit}`);
    return chapters.slice(0, limit);
  }
  return chapters;
};

/**
 * Limita bookmarks
 * @param {Array} bookmarks 
 * @returns {Array}
 */
export const limitBookmarks = (bookmarks) => {
  const limit = getFlag('MAX_BOOKMARKS', DEFAULT_LIMITS.MAX_BOOKMARKS);
  if (bookmarks.length > limit) {
    console.warn(`[FailSafe] Bookmarks limitados de ${bookmarks.length} para ${limit}`);
    return bookmarks.slice(0, limit);
  }
  return bookmarks;
};

// ============================================================================
// GUARDS DE OPERAÇÃO
// ============================================================================

/**
 * Guard para export - verifica se há dados
 * @param {Array} points 
 * @param {Function} onError - Callback de erro (recebe mensagem)
 * @returns {boolean}
 */
export const guardExport = (points, onError) => {
  if (!Array.isArray(points) || points.length === 0) {
    onError?.('Não há dados para exportar');
    return false;
  }
  return true;
};

/**
 * Guard para share - verifica dados mínimos
 * @param {Object} params 
 * @param {Function} onError 
 * @returns {boolean}
 */
export const guardShare = (params, onError) => {
  if (!params?.deviceId) {
    onError?.('Dispositivo não selecionado');
    return false;
  }
  if (!params?.dateRange?.[0] || !params?.dateRange?.[1]) {
    onError?.('Período não definido');
    return false;
  }
  return true;
};

/**
 * Guard para play - verifica se pode iniciar reprodução
 * @param {Array} points 
 * @param {Function} onError 
 * @returns {boolean}
 */
export const guardPlay = (points, onError) => {
  if (!Array.isArray(points) || points.length < 2) {
    onError?.('Mínimo de 2 pontos necessário para reprodução');
    return false;
  }
  return true;
};

/**
 * Guard para seek - valida índice
 * @param {number} index 
 * @param {number} maxIndex 
 * @returns {number} - Índice seguro (clamped)
 */
export const guardSeekIndex = (index, maxIndex) => {
  if (typeof index !== 'number' || isNaN(index)) return 0;
  if (index < 0) return 0;
  if (index > maxIndex) return maxIndex;
  return Math.floor(index);
};

// ============================================================================
// PARSE SEGURO
// ============================================================================

/**
 * Parse seguro de share payload
 * @param {string} encoded 
 * @param {Function} onError 
 * @returns {Object|null}
 */
export const safeParseSharePayload = (encoded, onError) => {
  if (!encoded || typeof encoded !== 'string') {
    return null;
  }
  
  try {
    const jsonStr = decodeURIComponent(escape(atob(encoded)));
    const payload = JSON.parse(jsonStr);
    
    // Validar estrutura mínima
    if (!payload.d) {
      throw new Error('Payload inválido: deviceId ausente');
    }
    
    return payload;
  } catch (e) {
    console.warn('[FailSafe] Share payload inválido:', e.message);
    onError?.('Link de compartilhamento inválido ou expirado');
    return null;
  }
};

/**
 * Parse seguro de JSON
 * @param {string} json 
 * @param {any} fallback 
 * @returns {any}
 */
export const safeParseJson = (json, fallback = null) => {
  if (!json) return fallback;
  
  try {
    return JSON.parse(json);
  } catch (e) {
    console.warn('[FailSafe] JSON parse error:', e.message);
    return fallback;
  }
};

// ============================================================================
// FALLBACKS DE UI
// ============================================================================

/**
 * Fallback seguro para exibição de velocidade
 * @param {any} speed 
 * @returns {string}
 */
export const displaySpeed = (speed) => {
  const num = parseFloat(speed);
  if (isNaN(num) || num < 0) return '0 km/h';
  return `${Math.round(num)} km/h`;
};

/**
 * Fallback seguro para exibição de coordenadas
 * @param {any} coord 
 * @param {number} decimals 
 * @returns {string}
 */
export const displayCoord = (coord, decimals = 6) => {
  const num = parseFloat(coord);
  if (isNaN(num)) return '0.000000';
  return num.toFixed(decimals);
};

/**
 * Fallback seguro para exibição de endereço
 * @param {any} address 
 * @returns {string}
 */
export const displayAddress = (address) => {
  if (!address || typeof address !== 'string') return '-';
  return address.trim() || '-';
};

/**
 * Fallback seguro para exibição de data
 * @param {any} date 
 * @param {string} locale 
 * @returns {string}
 */
export const displayDate = (date, locale = 'pt-BR') => {
  if (!date) return '-';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString(locale);
  } catch (e) {
    return '-';
  }
};

// ============================================================================
// WRAPPER DE ERRO
// ============================================================================

/**
 * Wrapper que captura erros e retorna fallback
 * @param {Function} fn 
 * @param {any} fallback 
 * @param {string} context - Contexto para log
 * @returns {any}
 */
export const safeExecute = (fn, fallback = null, context = 'unknown') => {
  try {
    return fn();
  } catch (e) {
    console.error(`[FailSafe:${context}]`, e);
    return fallback;
  }
};

/**
 * Wrapper async que captura erros
 * @param {Function} fn 
 * @param {any} fallback 
 * @param {string} context 
 * @returns {Promise<any>}
 */
export const safeExecuteAsync = async (fn, fallback = null, context = 'unknown') => {
  try {
    return await fn();
  } catch (e) {
    console.error(`[FailSafe:${context}]`, e);
    return fallback;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  normalizePoint,
  normalizePoints,
  enforceLimits,
  limitEvents,
  limitChapters,
  limitBookmarks,
  guardExport,
  guardShare,
  guardPlay,
  guardSeekIndex,
  safeParseSharePayload,
  safeParseJson,
  displaySpeed,
  displayCoord,
  displayAddress,
  displayDate,
  safeExecute,
  safeExecuteAsync
};
