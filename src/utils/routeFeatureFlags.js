/**
 * routeFeatureFlags.js
 * 
 * FASE 10 + FASE 11 — Feature Flags centralizadas para Route Player
 * 
 * Kill Switch para desligar features em PROD sem redeploy.
 * Permite debug rápido com cliente.
 * Suporta modo Basic vs Premium por cliente/plano.
 * 
 * ⚠️ REGRAS:
 * - Todas as flags TRUE por padrão
 * - Pode ser sobrescrito via localStorage ou window
 * - Mudanças não requerem reload (exceto algumas)
 */

// ============================================================================
// FEATURE FLAGS PADRÃO
// ============================================================================

const DEFAULT_FLAGS = {
  // =========================================
  // FASE 11: Controle de Plano/Premium
  // =========================================
  
  // Master switch - se FALSE, premium nunca ativa (controle por tenant/plano)
  ROUTE_PREMIUM_ALLOWED: true,  // Tenant tem direito a premium?
  
  // Flags granulares premium (só funcionam se ROUTE_PREMIUM_ALLOWED = true)
  ROUTE_INSIGHTS: true,         // Resumo executivo
  ROUTE_CHAPTERS: true,         // Capítulos de viagem
  ROUTE_BOOKMARKS: true,        // Favoritos
  ROUTE_EVENTS: true,           // Eventos (paradas, velocidade)
  ROUTE_EXPORT_PREMIUM: true,   // PDF/Excel Premium
  ROUTE_SHARE_LINK: true,       // Copiar link compartilhável
  
  // =========================================
  // Core features (sempre disponíveis)
  // =========================================
  ENABLE_HEATMAP: true,
  ENABLE_ROUTE_MARKERS: true,
  
  // FASE 7: Eventos (legacy - mapeado para ROUTE_EVENTS)
  ENABLE_EVENTS: true,
  ENABLE_EVENT_MARKERS: true,
  
  // FASE 8: Capítulos e Bookmarks (legacy - mapeados)
  ENABLE_CHAPTERS: true,
  ENABLE_BOOKMARKS: true,
  ENABLE_SUMMARY: true,
  
  // FASE 9: Export e Share (legacy - mapeados)
  ENABLE_EXPORT_PDF: true,
  ENABLE_EXPORT_EXCEL: true,
  ENABLE_SHARE: true,
  ENABLE_EXPORT_PREMIUM: true,
  
  // FASE 13: Export KML (Google Earth)
  ENABLE_EXPORT_KML: false,
  
  // FASE 6: Player
  ENABLE_PLAYER: true,
  ENABLE_SCRUB: true,
  ENABLE_SEEK_FROM_TIMELINE: true,
  
  // Limites de segurança
  MAX_POINTS_WARNING: 10000,
  MAX_POINTS_HARD_LIMIT: 50000,
  MAX_EVENTS_DISPLAY: 500,
  MAX_CHAPTERS_DISPLAY: 100,
  MAX_BOOKMARKS: 50,
  
  // Performance
  ENABLE_VIRTUAL_SCROLL: true,
  VIRTUAL_BUFFER_SIZE: 8,
  
  // Debug
  ENABLE_TELEMETRY: process.env.NODE_ENV === 'development'
};

// ============================================================================
// STORAGE KEY
// ============================================================================

const STORAGE_KEY = 'kore-route-feature-flags';

// ============================================================================
// STATE
// ============================================================================

let cachedFlags = null;

// ============================================================================
// FUNÇÕES
// ============================================================================

/**
 * Carrega flags do localStorage (se existirem)
 * @returns {Object}
 */
const loadFromStorage = () => {
  if (typeof localStorage === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.warn('[FeatureFlags] Error loading from storage:', e);
    return {};
  }
};

/**
 * Carrega flags do window (para override em runtime)
 * @returns {Object}
 */
const loadFromWindow = () => {
  if (typeof window === 'undefined') return {};
  return window.ROUTE_FEATURE_FLAGS || {};
};

/**
 * Obtém todas as flags (merged: default < storage < window)
 * @param {boolean} [forceRefresh=false] - Força recarregar do storage/window
 * @returns {Object}
 */
export const getFlags = (forceRefresh = false) => {
  if (cachedFlags && !forceRefresh) {
    return cachedFlags;
  }
  
  const storageFlags = loadFromStorage();
  const windowFlags = loadFromWindow();
  
  cachedFlags = {
    ...DEFAULT_FLAGS,
    ...storageFlags,
    ...windowFlags
  };
  
  return cachedFlags;
};

/**
 * Obtém uma flag específica
 * @param {string} flagName 
 * @param {any} [defaultValue] - Valor padrão se não existir
 * @returns {any}
 */
export const getFlag = (flagName, defaultValue = false) => {
  const flags = getFlags();
  return Object.prototype.hasOwnProperty.call(flags, flagName) ? flags[flagName] : defaultValue;
};

/**
 * Verifica se uma feature está habilitada
 * @param {string} flagName 
 * @returns {boolean}
 */
export const isEnabled = (flagName) => {
  return getFlag(flagName, false) === true;
};

/**
 * Define uma flag em runtime (persiste no localStorage)
 * @param {string} flagName 
 * @param {any} value 
 */
export const setFlag = (flagName, value) => {
  const stored = loadFromStorage();
  stored[flagName] = value;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    console.warn('[FeatureFlags] Error saving to storage:', e);
  }
  
  // Invalidar cache
  cachedFlags = null;
  
  console.log(`[FeatureFlags] ${flagName} = ${value}`);
};

/**
 * Remove uma flag do localStorage (volta ao default)
 * @param {string} flagName 
 */
export const resetFlag = (flagName) => {
  const stored = loadFromStorage();
  delete stored[flagName];
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    console.warn('[FeatureFlags] Error saving to storage:', e);
  }
  
  cachedFlags = null;
  
  console.log(`[FeatureFlags] ${flagName} reset to default`);
};

/**
 * Reseta todas as flags para o padrão
 */
export const resetAllFlags = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[FeatureFlags] Error clearing storage:', e);
  }
  
  cachedFlags = null;
  
  console.log('[FeatureFlags] All flags reset to defaults');
};

/**
 * Lista todas as flags atuais
 * @returns {Object}
 */
export const listFlags = () => {
  const flags = getFlags(true);
  console.table(flags);
  return flags;
};

/**
 * Valida se um limite numérico é respeitado
 * @param {string} limitFlag - Nome da flag de limite
 * @param {number} value - Valor a validar
 * @returns {{ ok: boolean, limit: number, exceeded: number }}
 */
export const checkLimit = (limitFlag, value) => {
  const limit = getFlag(limitFlag, Infinity);
  const ok = value <= limit;
  return {
    ok,
    limit,
    value,
    exceeded: ok ? 0 : value - limit
  };
};

// ============================================================================
// GUARDS (para usar em templates/componentes)
// ============================================================================

/**
 * Guard para renderização condicional
 * @param {string} flagName 
 * @param {Function} callback - Executado se flag ativa
 * @returns {any}
 */
export const withFeature = (flagName, callback) => {
  if (isEnabled(flagName)) {
    return callback();
  }
  return null;
};

/**
 * Guard que retorna valor ou fallback
 * @param {string} flagName 
 * @param {any} value - Valor se ativo
 * @param {any} fallback - Valor se desativado
 * @returns {any}
 */
export const featureValue = (flagName, value, fallback = null) => {
  return isEnabled(flagName) ? value : fallback;
};

// ============================================================================
// HELPERS DE CONSOLE (DEV)
// ============================================================================

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.routeFlags = {
    list: listFlags,
    get: getFlag,
    set: setFlag,
    reset: resetFlag,
    resetAll: resetAllFlags,
    isEnabled
  };
  
  console.log('🚩 Route Feature Flags available: window.routeFlags.list()');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getFlags,
  getFlag,
  isEnabled,
  setFlag,
  resetFlag,
  resetAllFlags,
  listFlags,
  checkLimit,
  withFeature,
  featureValue,
  DEFAULT_FLAGS
};
