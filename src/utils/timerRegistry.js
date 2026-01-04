/**
 * Timer Registry - Gerenciamento centralizado de timers
 * 
 * Objetivo: Eliminar vazamentos de setTimeout/setInterval órfãos
 * 
 * Uso:
 * - setSafeTimeout(fn, ms) → substitui setTimeout
 * - setSafeInterval(fn, ms) → substitui setInterval
 * - clearSafeTimeout(id) → substitui clearTimeout
 * - clearSafeInterval(id) → substitui clearInterval
 * - clearAllTimers() → limpa TUDO de uma vez (kill switch)
 * 
 * @module timerRegistry
 */

// Sets para rastrear todos os timers ativos
const timeouts = new Set();
const intervals = new Set();

/**
 * Cria um setTimeout rastreado que se auto-remove ao executar
 * @param {Function} fn - Função a executar
 * @param {number} ms - Delay em milissegundos
 * @returns {number} Timer ID
 */
export function setSafeTimeout(fn, ms) {
  const id = setTimeout(() => {
    timeouts.delete(id);
    fn();
  }, ms);
  timeouts.add(id);
  return id;
}

/**
 * Cria um setInterval rastreado
 * @param {Function} fn - Função a executar
 * @param {number} ms - Intervalo em milissegundos
 * @returns {number} Interval ID
 */
export function setSafeInterval(fn, ms) {
  const id = setInterval(fn, ms);
  intervals.add(id);
  return id;
}

/**
 * Limpa um timeout e remove do registry
 * @param {number|null} id - Timer ID
 */
export function clearSafeTimeout(id) {
  if (id) {
    clearTimeout(id);
    timeouts.delete(id);
  }
}

/**
 * Limpa um interval e remove do registry
 * @param {number|null} id - Interval ID
 */
export function clearSafeInterval(id) {
  if (id) {
    clearInterval(id);
    intervals.delete(id);
  }
}

/**
 * KILL SWITCH: Limpa TODOS os timers e intervals de uma vez
 * Chamado no cleanupAll para garantir que nenhum timer órfão sobreviva
 */
export function clearAllTimers() {
  // Limpar todos os timeouts
  timeouts.forEach(id => {
    try {
      clearTimeout(id);
    } catch (e) {
      // Ignorar erros de timers já limpos
    }
  });
  timeouts.clear();
  
  // Limpar todos os intervals
  intervals.forEach(id => {
    try {
      clearInterval(id);
    } catch (e) {
      // Ignorar erros de intervals já limpos
    }
  });
  intervals.clear();
  
  console.debug('[timerRegistry] clearAllTimers - todos os timers limpos');
}

/**
 * Debug: retorna contagem de timers ativos
 * @returns {Object} { timeouts: number, intervals: number }
 */
export function getActiveTimerCount() {
  return {
    timeouts: timeouts.size,
    intervals: intervals.size
  };
}

export default {
  setSafeTimeout,
  setSafeInterval,
  clearSafeTimeout,
  clearSafeInterval,
  clearAllTimers,
  getActiveTimerCount
};
