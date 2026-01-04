/**
 * useRouteBookmarks.js
 * 
 * FASE 8 — Composable para Bookmarks de Rota
 * 
 * Gerencia bookmarks (favoritos) persistidos em localStorage.
 * Cada dispositivo tem sua própria lista de bookmarks.
 * 
 * ⚠️ REGRAS:
 * - Persistência em localStorage
 * - Lookup O(1) via Map
 * - Compatível com virtualização
 * - Não cria timers
 */

import { ref, computed, watch, unref } from 'vue';

// Prefixo para chave no localStorage
const STORAGE_PREFIX = 'kore-route-bookmarks:';

/**
 * Composable para gerenciar bookmarks de rota
 * 
 * @param {Ref<string|number>|string|number} deviceIdRef - ID do dispositivo (ref ou valor)
 * @returns {Object} - API do composable
 * 
 * @example
 * const { bookmarks, toggleBookmark, isBookmarked, seekToBookmark } = useRouteBookmarks(deviceId);
 */
export function useRouteBookmarks(deviceIdRef) {
  // Estado interno
  const bookmarks = ref([]);
  const bookmarkIndexSet = ref(new Set());
  
  // ============================================================================
  // STORAGE
  // ============================================================================
  
  /**
   * Gera a chave de storage para o dispositivo atual
   */
  const getStorageKey = () => {
    const deviceId = unref(deviceIdRef);
    return deviceId ? `${STORAGE_PREFIX}${deviceId}` : null;
  };
  
  /**
   * Carrega bookmarks do localStorage
   */
  const loadBookmarks = () => {
    const key = getStorageKey();
    if (!key) {
      bookmarks.value = [];
      bookmarkIndexSet.value = new Set();
      return;
    }
    
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        bookmarks.value = Array.isArray(parsed) ? parsed : [];
      } else {
        bookmarks.value = [];
      }
      
      // Rebuild index set for O(1) lookup
      bookmarkIndexSet.value = new Set(bookmarks.value.map(b => b.index));
    } catch (e) {
      console.warn('[useRouteBookmarks] Erro ao carregar bookmarks:', e);
      bookmarks.value = [];
      bookmarkIndexSet.value = new Set();
    }
  };
  
  /**
   * Salva bookmarks no localStorage
   */
  const saveBookmarks = () => {
    const key = getStorageKey();
    if (!key) return;
    
    try {
      if (bookmarks.value.length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(bookmarks.value));
      }
    } catch (e) {
      console.warn('[useRouteBookmarks] Erro ao salvar bookmarks:', e);
    }
  };
  
  // ============================================================================
  // API PÚBLICA
  // ============================================================================
  
  /**
   * Verifica se um índice está bookmarked (O(1))
   * @param {number} index 
   * @returns {boolean}
   */
  const isBookmarked = (index) => {
    return bookmarkIndexSet.value.has(index);
  };
  
  /**
   * Retorna o bookmark de um índice específico
   * @param {number} index 
   * @returns {Object|null}
   */
  const getBookmark = (index) => {
    return bookmarks.value.find(b => b.index === index) || null;
  };
  
  /**
   * Adiciona um bookmark
   * @param {Object} point - Ponto da rota
   * @param {number} index - Índice do ponto
   * @param {string} [label] - Label opcional
   */
  const addBookmark = (point, index, label = null) => {
    if (isBookmarked(index)) return;
    
    const bookmark = {
      index,
      pointId: point.id || null,
      fixTime: point.fixTime,
      lat: point.latitude,
      lng: point.longitude,
      address: point.address || `${point.latitude},${point.longitude}`,
      label: label || `Ponto #${index + 1}`,
      createdAt: new Date().toISOString()
    };
    
    bookmarks.value.push(bookmark);
    bookmarks.value.sort((a, b) => a.index - b.index); // Manter ordenado
    bookmarkIndexSet.value.add(index);
    saveBookmarks();
  };
  
  /**
   * Remove um bookmark pelo índice
   * @param {number} index 
   */
  const removeBookmark = (index) => {
    const idx = bookmarks.value.findIndex(b => b.index === index);
    if (idx !== -1) {
      bookmarks.value.splice(idx, 1);
      bookmarkIndexSet.value.delete(index);
      saveBookmarks();
    }
  };
  
  /**
   * Toggle bookmark (adiciona ou remove)
   * @param {Object} point - Ponto da rota
   * @param {number} index - Índice do ponto
   */
  const toggleBookmark = (point, index) => {
    if (isBookmarked(index)) {
      removeBookmark(index);
    } else {
      addBookmark(point, index);
    }
  };
  
  /**
   * Atualiza o label de um bookmark
   * @param {number} index 
   * @param {string} newLabel 
   */
  const updateBookmarkLabel = (index, newLabel) => {
    const bookmark = bookmarks.value.find(b => b.index === index);
    if (bookmark) {
      bookmark.label = newLabel;
      saveBookmarks();
    }
  };
  
  /**
   * Limpa todos os bookmarks
   */
  const clearBookmarks = () => {
    bookmarks.value = [];
    bookmarkIndexSet.value = new Set();
    saveBookmarks();
  };
  
  /**
   * Exporta bookmarks como JSON string
   */
  const exportBookmarks = () => {
    return JSON.stringify(bookmarks.value, null, 2);
  };
  
  /**
   * Importa bookmarks de JSON string
   * @param {string} jsonStr 
   */
  const importBookmarks = (jsonStr) => {
    try {
      const imported = JSON.parse(jsonStr);
      if (Array.isArray(imported)) {
        bookmarks.value = imported;
        bookmarkIndexSet.value = new Set(imported.map(b => b.index));
        saveBookmarks();
        return true;
      }
    } catch (e) {
      console.warn('[useRouteBookmarks] Erro ao importar:', e);
    }
    return false;
  };
  
  // ============================================================================
  // WATCHERS
  // ============================================================================
  
  // Recarregar quando deviceId mudar
  watch(
    () => unref(deviceIdRef),
    () => {
      loadBookmarks();
    },
    { immediate: true }
  );
  
  // ============================================================================
  // COMPUTED
  // ============================================================================
  
  /**
   * Contagem de bookmarks
   */
  const bookmarkCount = computed(() => bookmarks.value.length);
  
  /**
   * Lista de bookmarks ordenada
   */
  const sortedBookmarks = computed(() => {
    return [...bookmarks.value].sort((a, b) => a.index - b.index);
  });
  
  // ============================================================================
  // RETORNO
  // ============================================================================
  
  return {
    // Estado
    bookmarks: sortedBookmarks,
    bookmarkCount,
    
    // Métodos
    loadBookmarks,
    isBookmarked,
    getBookmark,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    updateBookmarkLabel,
    clearBookmarks,
    exportBookmarks,
    importBookmarks
  };
}

export default useRouteBookmarks;
