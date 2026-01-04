/**
 * useRouteMode.js
 * 
 * FASE 11 — Composable para gerenciar modo Basic vs Premium
 * 
 * Controla se o usuário está vendo a UI básica ou premium.
 * Persiste escolha do usuário no localStorage.
 * Integra com feature flags e plano do cliente.
 * 
 * ⚠️ REGRAS:
 * - Default sempre 'basic'
 * - Premium só ativa se permitido pelo plano/flags
 * - Preferência do usuário é respeitada (se permitido)
 */

import { ref, computed, watch } from 'vue';
import { isEnabled } from '@/utils/routeFeatureFlags';

// ============================================================================
// CONSTANTES
// ============================================================================

const STORAGE_KEY = 'kore-route-ui-mode';
const MODES = {
  BASIC: 'basic',
  PREMIUM: 'premium'
};

// ============================================================================
// STATE (singleton)
// ============================================================================

let _routeMode = null;
let _store = null;

// ============================================================================
// COMPOSABLE
// ============================================================================

/**
 * Composable para gerenciar modo de UI da rota
 * @param {Object} [store] - Vuex store (opcional, para integração com plano)
 * @returns {Object}
 */
export const useRouteMode = (store = null) => {
  // Guardar referência ao store se passado
  if (store && !_store) {
    _store = store;
  }
  
  // Singleton - criar apenas uma vez
  if (!_routeMode) {
    _routeMode = ref(loadModeFromStorage());
  }
  
  /**
   * Carrega modo salvo do localStorage
   * @returns {string}
   */
  function loadModeFromStorage() {
    if (typeof localStorage === 'undefined') return MODES.BASIC;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === MODES.PREMIUM || saved === MODES.BASIC) {
        return saved;
      }
    } catch (e) {
      console.warn('[RouteMode] Error loading from storage:', e);
    }
    
    return MODES.BASIC;
  }
  
  /**
   * Salva modo no localStorage
   * @param {string} mode 
   */
  function saveModeToStorage(mode) {
    if (typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      console.warn('[RouteMode] Error saving to storage:', e);
    }
  }
  
  // ============================================================================
  // COMPUTED: Verificação de permissão de plano
  // ============================================================================
  
  /**
   * Verifica se o plano do cliente permite premium
   * Integra com Vuex store quando disponível
   * 
   * Níveis de verificação:
   * 1. Feature flag ROUTE_PREMIUM_ALLOWED
   * 2. Store: auth/getCompanyPlan ou similar
   * 3. Window override: window.ROUTE_PLAN_ALLOWS_PREMIUM
   */
  const planAllowsPremium = computed(() => {
    // Nível 1: Feature flag master
    if (!isEnabled('ROUTE_PREMIUM_ALLOWED')) {
      return false;
    }
    
    // Nível 2: Integração com store (quando implementado)
    if (_store) {
      try {
        // Tentar buscar plano do cliente
        // Adapte para seu getter real:
        // const plan = _store.getters['auth/getCompanyPlan'];
        // if (plan === 'basic') return false;
        // if (plan === 'pro' || plan === 'enterprise') return true;
        
        // Por enquanto, fallback true se store existe
        const capabilities = _store.getters['auth/getCapabilities'];
        if (capabilities?.routePremium === false) {
          return false;
        }
      } catch (e) {
        // Store não tem esse getter ainda, fallback
      }
    }
    
    // Nível 3: Override via window (para admin/debug)
    if (typeof window !== 'undefined' && window.ROUTE_PLAN_ALLOWS_PREMIUM === false) {
      return false;
    }
    
    // Default: permitido
    return true;
  });
  
  /**
   * Gate central: pode usar recursos premium?
   * Combina: modo ativo + permissão do plano
   */
  const canUsePremiumRoutes = computed(() => {
    return _routeMode.value === MODES.PREMIUM && planAllowsPremium.value;
  });
  
  /**
   * Modo atual (basic ou premium)
   */
  const routeMode = computed(() => _routeMode.value);
  
  /**
   * Está no modo básico?
   */
  const isBasicMode = computed(() => _routeMode.value === MODES.BASIC);
  
  /**
   * Está no modo premium? (e tem permissão)
   */
  const isPremiumMode = computed(() => canUsePremiumRoutes.value);
  
  /**
   * Deve mostrar toggle de modo?
   * Só aparece se premium é permitido pelo plano
   */
  const showModeToggle = computed(() => planAllowsPremium.value);
  
  // ============================================================================
  // ACTIONS
  // ============================================================================
  
  /**
   * Define o modo de UI
   * @param {string} mode - 'basic' ou 'premium'
   */
  const setMode = (mode) => {
    if (mode !== MODES.BASIC && mode !== MODES.PREMIUM) {
      console.warn('[RouteMode] Invalid mode:', mode);
      return;
    }
    
    // Se tentar ativar premium sem permissão, força basic
    if (mode === MODES.PREMIUM && !planAllowsPremium.value) {
      console.warn('[RouteMode] Premium not allowed by plan, staying basic');
      mode = MODES.BASIC;
    }
    
    _routeMode.value = mode;
    saveModeToStorage(mode);
    
    console.log('[RouteMode] Mode set to:', mode);
  };
  
  /**
   * Alterna entre basic e premium
   */
  const toggleMode = () => {
    const newMode = _routeMode.value === MODES.BASIC ? MODES.PREMIUM : MODES.BASIC;
    setMode(newMode);
  };
  
  /**
   * Força modo básico
   */
  const setBasicMode = () => setMode(MODES.BASIC);
  
  /**
   * Ativa modo premium (se permitido)
   */
  const setPremiumMode = () => setMode(MODES.PREMIUM);
  
  /**
   * Reseta para default (basic)
   */
  const resetMode = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    _routeMode.value = MODES.BASIC;
  };
  
  // ============================================================================
  // GUARDS PARA FEATURES ESPECÍFICAS
  // ============================================================================
  
  /**
   * Verifica se uma feature premium específica está disponível
   * Combina: modo premium + flag específica
   * 
   * @param {string} featureFlag - Nome da flag (ex: 'ROUTE_CHAPTERS')
   * @returns {boolean}
   */
  const canUseFeature = (featureFlag) => {
    if (!canUsePremiumRoutes.value) return false;
    return isEnabled(featureFlag);
  };
  
  /**
   * Shortcuts para features comuns
   */
  const canUseInsights = computed(() => canUseFeature('ROUTE_INSIGHTS'));
  const canUseChapters = computed(() => canUseFeature('ROUTE_CHAPTERS'));
  const canUseBookmarks = computed(() => canUseFeature('ROUTE_BOOKMARKS'));
  const canUseEvents = computed(() => canUseFeature('ROUTE_EVENTS'));
  const canUseExportPremium = computed(() => canUseFeature('ROUTE_EXPORT_PREMIUM'));
  const canUseShareLink = computed(() => canUseFeature('ROUTE_SHARE_LINK'));
  
  // ============================================================================
  // WATCH: Auto-fallback se plano mudar
  // ============================================================================
  
  watch(planAllowsPremium, (allowed) => {
    if (!allowed && _routeMode.value === MODES.PREMIUM) {
      console.log('[RouteMode] Plan changed, falling back to basic');
      setBasicMode();
    }
  });
  
  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    // Estado
    routeMode,
    isBasicMode,
    isPremiumMode,
    
    // Permissões
    planAllowsPremium,
    canUsePremiumRoutes,
    showModeToggle,
    
    // Feature guards
    canUseFeature,
    canUseInsights,
    canUseChapters,
    canUseBookmarks,
    canUseEvents,
    canUseExportPremium,
    canUseShareLink,
    
    // Actions
    setMode,
    toggleMode,
    setBasicMode,
    setPremiumMode,
    resetMode,
    
    // Constantes
    MODES
  };
};

// ============================================================================
// HELPERS GLOBAIS (DEV)
// ============================================================================

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.routeMode = {
    get: () => _routeMode?.value,
    setBasic: () => { if (_routeMode) _routeMode.value = MODES.BASIC; },
    setPremium: () => { if (_routeMode) _routeMode.value = MODES.PREMIUM; },
    toggle: () => { 
      if (_routeMode) {
        _routeMode.value = _routeMode.value === MODES.BASIC ? MODES.PREMIUM : MODES.BASIC;
      }
    }
  };
  
  console.log('🎛️ Route Mode available: routeMode.toggle()');
}

export default useRouteMode;
