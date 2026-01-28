/**
 * UI MODULE - MIT.app
 * ========================================
 * Gerencia estado global de UI (dark mode, theme preferences, street view, etc.)
 * 
 * @module store/modules/ui
 * @version 2.0.0
 */

export default {
  namespaced: true,

  /* ===========================
   *  STATE
   * =========================== */
  state: {
    darkMode: false, // Estado global do dark mode
    streetViewEnabled: false, // Street View começa DESATIVADO por padrão
    streetViewPosition: null, // { lat, lng } quando ativo
    sidebarOpen: true, // Estado da sidebar
    mobileMenuOpen: false, // Menu mobile
    activeModal: null, // Modal atualmente aberto (para controle de z-index)
  },

  /* ===========================
   *  MUTATIONS
   * =========================== */
  mutations: {
    /**
     * Define o estado do dark mode
     * @param {Object} state - Vuex state
     * @param {boolean} isDark - Novo valor do dark mode
     */
    setDarkMode(state, isDark) {
      state.darkMode = isDark;
      
      // Persiste no localStorage
      try {
        localStorage.setItem('darkMode', JSON.stringify(isDark));
      } catch (e) {
        console.warn('⚠️ Não foi possível salvar preferência de dark mode:', e);
      }
      
      // Aplica classe CSS no body
      if (isDark) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    },

    /**
     * Define se o Street View está ativo
     * @param {Object} state - Vuex state
     * @param {boolean} enabled - Se Street View deve estar ativo
     */
    setStreetViewEnabled(state, enabled) {
      state.streetViewEnabled = !!enabled;
      
      // Se desativando, limpa a posição também
      if (!enabled) {
        state.streetViewPosition = null;
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('[ui] streetViewEnabled =', state.streetViewEnabled);
      }
    },

    /**
     * Define a posição do Street View
     * @param {Object} state - Vuex state
     * @param {Object|null} position - { lat, lng } ou null
     */
    setStreetViewPosition(state, position) {
      state.streetViewPosition = position;
      
      // Se definiu posição, ativa automaticamente
      if (position && !state.streetViewEnabled) {
        state.streetViewEnabled = true;
      }
    },

    /**
     * Define estado da sidebar
     * @param {Object} state - Vuex state
     * @param {boolean} open - Se sidebar está aberta
     */
    setSidebarOpen(state, open) {
      state.sidebarOpen = !!open;
    },

    /**
     * Define estado do menu mobile
     * @param {Object} state - Vuex state
     * @param {boolean} open - Se menu mobile está aberto
     */
    setMobileMenuOpen(state, open) {
      state.mobileMenuOpen = !!open;
    },

    /**
     * Define o modal atualmente ativo
     * @param {Object} state - Vuex state
     * @param {string|null} modalName - Nome do modal ou null
     */
    setActiveModal(state, modalName) {
      state.activeModal = modalName;
    },

    /**
     * Reset completo do estado UI (usado em logout)
     * @param {Object} state - Vuex state
     */
    resetUIState(state) {
      state.streetViewEnabled = false;
      state.streetViewPosition = null;
      state.sidebarOpen = true;
      state.mobileMenuOpen = false;
      state.activeModal = null;
      // darkMode NÃO é resetado no logout (preferência do usuário)
    },
  },

  /* ===========================
   *  ACTIONS
   * =========================== */
  actions: {
    /**
     * Inicializa dark mode a partir do localStorage
     * @param {Object} context - Vuex context
     */
    initDarkMode({ commit }) {
      try {
        const saved = localStorage.getItem('darkMode');
        const isDark = saved ? JSON.parse(saved) : false;
        commit('setDarkMode', isDark);
      } catch (e) {
        console.warn('⚠️ Erro ao carregar preferência de dark mode, usando padrão (light):', e);
        commit('setDarkMode', false);
      }
    },

    /**
     * Alterna entre light e dark mode
     * @param {Object} context - Vuex context
     */
    toggleDarkMode({ state, commit }) {
      commit('setDarkMode', !state.darkMode);
    },

    /**
     * Ativa Street View em uma posição específica
     * @param {Object} context - Vuex context
     * @param {Object} position - { lat, lng }
     */
    openStreetView({ commit }, position) {
      if (position && position.lat != null && position.lng != null) {
        commit('setStreetViewPosition', position);
        commit('setStreetViewEnabled', true);
      }
    },

    /**
     * Desativa Street View
     * @param {Object} context - Vuex context
     */
    closeStreetView({ commit }) {
      commit('setStreetViewEnabled', false);
      commit('setStreetViewPosition', null);
    },

    /**
     * Alterna Street View
     * @param {Object} context - Vuex context
     */
    toggleStreetView({ state, commit }) {
      commit('setStreetViewEnabled', !state.streetViewEnabled);
    },

    /**
     * Toggle da sidebar
     * @param {Object} context - Vuex context
     */
    toggleSidebar({ state, commit }) {
      commit('setSidebarOpen', !state.sidebarOpen);
    },

    /**
     * Toggle do menu mobile
     * @param {Object} context - Vuex context
     */
    toggleMobileMenu({ state, commit }) {
      commit('setMobileMenuOpen', !state.mobileMenuOpen);
    },

    /**
     * Reset de UI para logout
     * @param {Object} context - Vuex context
     */
    resetForLogout({ commit }) {
      commit('resetUIState');
    },
  },

  /* ===========================
   *  GETTERS
   * =========================== */
  getters: {
    /**
     * Retorna se dark mode está ativo
     * @param {Object} state - Vuex state
     * @returns {boolean}
     */
    isDarkMode: (state) => state.darkMode,

    /**
     * Retorna se Street View está ativo
     * @param {Object} state - Vuex state
     * @returns {boolean}
     */
    isStreetViewEnabled: (state) => state.streetViewEnabled,

    /**
     * Retorna posição do Street View
     * @param {Object} state - Vuex state
     * @returns {Object|null}
     */
    streetViewPosition: (state) => state.streetViewPosition,

    /**
     * Retorna se a sidebar está aberta
     * @param {Object} state - Vuex state
     * @returns {boolean}
     */
    isSidebarOpen: (state) => state.sidebarOpen,

    /**
     * Retorna se o menu mobile está aberto
     * @param {Object} state - Vuex state
     * @returns {boolean}
     */
    isMobileMenuOpen: (state) => state.mobileMenuOpen,

    /**
     * Retorna o modal atualmente ativo
     * @param {Object} state - Vuex state
     * @returns {string|null}
     */
    activeModal: (state) => state.activeModal,
  },
};
