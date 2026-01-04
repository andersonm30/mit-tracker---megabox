/**
 * useRequestControl.js
 * Composable para controle de concorrência em requests assíncronos.
 * 
 * Garante que apenas o último request seja aplicado, evitando race conditions
 * quando o usuário troca rapidamente de dispositivo/data.
 * 
 * Uso:
 * const { execute, isLoading, cancel, currentRequestId } = useRequestControl();
 * 
 * const result = await execute(async (signal) => {
 *   const response = await fetch(url, { signal });
 *   return response.json();
 * });
 */

import { ref, onBeforeUnmount } from 'vue';

export function useRequestControl() {
  // ID incremental para rastrear requests
  let requestIdCounter = 0;
  
  // ID do request atual (o que deve ser aplicado)
  const currentRequestId = ref(0);
  
  // Estado de loading
  const isLoading = ref(false);
  
  // AbortController atual
  let currentController = null;

  /**
   * Executa uma função assíncrona com controle de concorrência.
   * Se um novo request for iniciado antes do anterior terminar,
   * o anterior será cancelado e ignorado.
   * 
   * @param {Function} asyncFn - Função assíncrona que recebe AbortSignal como parâmetro
   * @returns {Promise<{success: boolean, data?: any, cancelled?: boolean, error?: Error}>}
   */
  const execute = async (asyncFn) => {
    // Cancelar request anterior se existir
    if (currentController) {
      currentController.abort();
    }
    
    // Criar novo controller e ID
    currentController = new AbortController();
    const thisRequestId = ++requestIdCounter;
    currentRequestId.value = thisRequestId;
    isLoading.value = true;

    try {
      // Executar a função com o signal
      const result = await asyncFn(currentController.signal);
      
      // Verificar se ainda é o request mais recente
      if (thisRequestId !== currentRequestId.value) {
        // Request foi superado por outro mais novo
        return { success: false, cancelled: true };
      }
      
      isLoading.value = false;
      return { success: true, data: result };
      
    } catch (error) {
      // Verificar se foi cancelamento intencional
      if (error.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      
      // Verificar se ainda é o request atual antes de reportar erro
      if (thisRequestId !== currentRequestId.value) {
        return { success: false, cancelled: true };
      }
      
      isLoading.value = false;
      return { success: false, error };
    }
  };

  /**
   * Cancela o request atual (se houver)
   */
  const cancel = () => {
    if (currentController) {
      currentController.abort();
      currentController = null;
    }
    isLoading.value = false;
  };

  /**
   * Reseta o estado (útil ao desmontar)
   */
  const reset = () => {
    cancel();
    requestIdCounter = 0;
    currentRequestId.value = 0;
  };

  // Cleanup automático ao desmontar o componente
  onBeforeUnmount(() => {
    cancel();
  });

  return {
    execute,
    isLoading,
    cancel,
    reset,
    currentRequestId
  };
}

/**
 * Helper para formatar datas para o backend (sem bug de timezone).
 * Formata a data local no formato esperado pelo backend: YYYY-MM-DDTHH:mm:ss
 * 
 * @param {Date} date - Data a ser formatada
 * @returns {string} Data formatada em ISO local (sem Z)
 */
export function formatDateForBackend(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const pad = (n) => String(n).padStart(2, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Helper para formatar data para input datetime-local.
 * Retorna no formato YYYY-MM-DDTHH:mm (sem segundos).
 * 
 * @param {Date} date - Data a ser formatada
 * @returns {string} Data formatada para datetime-local
 */
export function formatDateForInput(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const pad = (n) => String(n).padStart(2, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Helper para criar range de datas padrão.
 * 
 * @returns {[Date, Date]} - [início do dia atual, agora]
 */
export function getDefaultDateRange() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  
  return [startOfDay, now];
}
