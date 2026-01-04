/**
 * useVirtualScroll.js
 * Composable para virtualização de listas longas (windowing simples sem lib).
 * 
 * Renderiza apenas os itens visíveis + buffer, mantendo performance com milhares de pontos.
 * 
 * Uso:
 * const { visibleItems, containerStyle, onScroll, scrollToIndex } = useVirtualScroll({
 *   items: routePoints,      // ref ou computed de array
 *   itemHeight: 60,          // altura aproximada de cada item em px
 *   containerHeight: 400,    // altura do container de scroll
 *   buffer: 5                // itens extras acima/abaixo do visível
 * });
 */

import { ref, computed, watch } from 'vue';

export function useVirtualScroll(options) {
  const {
    items,           // Ref<Array> - lista completa de itens
    itemHeight = 60, // Altura estimada de cada item (px)
    containerHeight = 400, // Altura do container de scroll (px)
    buffer = 5       // Número de itens extras acima/abaixo do viewport
  } = options;

  // Posição atual do scroll
  const scrollTop = ref(0);
  
  // Ref do container (para acesso externo)
  const containerRef = ref(null);

  // Total de itens
  const totalItems = computed(() => {
    return Array.isArray(items.value) ? items.value.length : 0;
  });

  // Altura total do conteúdo virtual (para criar scrollbar correta)
  const totalHeight = computed(() => {
    return totalItems.value * itemHeight;
  });

  // Quantos itens cabem no viewport
  const visibleCount = computed(() => {
    return Math.ceil(containerHeight / itemHeight) + 1;
  });

  // Índice do primeiro item visível (considerando scroll)
  const startIndex = computed(() => {
    const index = Math.floor(scrollTop.value / itemHeight);
    return Math.max(0, index - buffer);
  });

  // Índice do último item visível
  const endIndex = computed(() => {
    const index = startIndex.value + visibleCount.value + buffer * 2;
    return Math.min(totalItems.value, index);
  });

  // Offset top para posicionar os itens visíveis corretamente
  const offsetTop = computed(() => {
    return startIndex.value * itemHeight;
  });

  // Itens visíveis com índice real preservado
  const visibleItems = computed(() => {
    if (!items.value || items.value.length === 0) {
      return [];
    }
    
    const start = startIndex.value;
    const end = endIndex.value;
    
    return items.value.slice(start, end).map((item, i) => ({
      item,
      realIndex: start + i // Índice real na lista completa
    }));
  });

  // Estilo do container interno (spacer)
  const spacerStyle = computed(() => ({
    height: `${totalHeight.value}px`,
    position: 'relative'
  }));

  // Estilo do wrapper dos itens visíveis
  const itemsWrapperStyle = computed(() => ({
    position: 'absolute',
    top: `${offsetTop.value}px`,
    left: 0,
    right: 0
  }));

  // Handler de scroll
  const onScroll = (event) => {
    scrollTop.value = event.target.scrollTop;
  };

  // Scroll para um índice específico (para sync com mapa)
  const scrollToIndex = (index, behavior = 'smooth') => {
    if (!containerRef.value) return;
    
    const targetTop = index * itemHeight - (containerHeight / 2) + (itemHeight / 2);
    
    containerRef.value.scrollTo({
      top: Math.max(0, targetTop),
      behavior
    });
  };

  // Watch para resetar scroll quando items mudam completamente
  watch(() => items.value?.length, () => {
    scrollTop.value = 0;
    if (containerRef.value) {
      containerRef.value.scrollTop = 0;
    }
  });

  return {
    // Refs
    containerRef,
    scrollTop,
    
    // Computed
    visibleItems,
    totalItems,
    startIndex,
    endIndex,
    
    // Estilos para template
    spacerStyle,
    itemsWrapperStyle,
    
    // Métodos
    onScroll,
    scrollToIndex
  };
}

/**
 * Versão simplificada com paginação ("Carregar mais")
 * Alternativa ao windowing para casos onde virtualização não é necessária.
 */
export function usePagination(options) {
  const {
    items,           // Ref<Array> - lista completa de itens
    pageSize = 200   // Itens por página
  } = options;

  const currentPage = ref(1);

  // Total de páginas
  const totalPages = computed(() => {
    const total = items.value?.length || 0;
    return Math.ceil(total / pageSize);
  });

  // Itens visíveis (primeiras N páginas)
  const paginatedItems = computed(() => {
    if (!items.value) return [];
    const end = currentPage.value * pageSize;
    return items.value.slice(0, end);
  });

  // Há mais itens para carregar?
  const hasMore = computed(() => {
    return currentPage.value < totalPages.value;
  });

  // Quantos itens restam
  const remainingCount = computed(() => {
    const total = items.value?.length || 0;
    const shown = paginatedItems.value.length;
    return total - shown;
  });

  // Carregar próxima página
  const loadMore = () => {
    if (hasMore.value) {
      currentPage.value++;
    }
  };

  // Resetar para primeira página
  const reset = () => {
    currentPage.value = 1;
  };

  // Watch para resetar quando items mudam
  watch(() => items.value?.length, () => {
    reset();
  });

  return {
    paginatedItems,
    currentPage,
    totalPages,
    hasMore,
    remainingCount,
    loadMore,
    reset
  };
}
