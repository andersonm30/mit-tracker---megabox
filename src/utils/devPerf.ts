/**
 * devPerf - Sistema de medição de performance para desenvolvimento
 * 
 * Fornece medições de performance baseado em:
 * 1. NODE_ENV === 'development' (build-time check)
 * 2. localStorage.DEBUG_PERF === '1' (runtime check)
 * 
 * USAGE:
 * ```typescript
 * import { startMark, endMark } from '@/utils/devPerf';
 * 
 * startMark('renderMarkers');
 * // ... código pesado ...
 * endMark('renderMarkers'); // Output: [PERF] renderMarkers: 42.3ms
 * ```
 * 
 * ATIVAÇÃO:
 * 1. Abra DevTools (F12) no navegador
 * 2. No Console, execute: localStorage.setItem('DEBUG_PERF', '1')
 * 3. Recarregue a página (F5)
 * 
 * DESATIVAÇÃO:
 * localStorage.removeItem('DEBUG_PERF')
 * 
 * IMPORTANTE:
 * - Medições são automaticamente desabilitadas em produção (NODE_ENV !== 'development')
 * - Não adiciona overhead em produção (tree-shaking remove o código)
 * - Usa performance.now() para precisão de microssegundos
 * 
 * @module devPerf
 */

/**
 * Cache de marcações ativas
 * Map<markName, startTime>
 */
const activeMeasures = new Map<string, number>();

/**
 * Verifica se medição de performance está habilitada
 * 
 * Condições:
 * 1. Deve estar em ambiente de desenvolvimento
 * 2. localStorage.DEBUG_PERF deve estar definido como '1'
 * 
 * @returns {boolean} true se medição está habilitada
 */
const isPerfEnabled = (): boolean => {
  // Em produção, sempre retorna false (tree-shaking remove o código)
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }

  // Em desenvolvimento, verifica localStorage
  try {
    return localStorage.getItem('DEBUG_PERF') === '1';
  } catch (error) {
    // Fallback se localStorage não disponível (SSR, etc.)
    return false;
  }
};

/**
 * Inicia uma medição de performance
 * 
 * Comportamento:
 * - Se debug desabilitado: não faz nada (0 overhead)
 * - Se debug habilitado: registra tempo inicial
 * 
 * @param {string} markName - Nome único da marcação
 * 
 * @example
 * startMark('renderMarkers');
 * // ... código a medir ...
 * endMark('renderMarkers');
 */
export const startMark = (markName: string): void => {
  if (isPerfEnabled()) {
    activeMeasures.set(markName, performance.now());
  }
};

/**
 * Finaliza uma medição de performance e loga o resultado
 * 
 * Comportamento:
 * - Se debug desabilitado: não faz nada (0 overhead)
 * - Se debug habilitado: calcula diferença e loga
 * 
 * @param {string} markName - Nome da marcação (deve ter sido iniciada com startMark)
 * @param {boolean} resetMark - Se true, remove a marcação do cache após medir (padrão: true)
 * 
 * @example
 * startMark('updateRoute');
 * drawComplexRoute();
 * endMark('updateRoute'); // Output: [PERF] updateRoute: 123.45ms
 */
export const endMark = (markName: string, resetMark: boolean = true): void => {
  if (isPerfEnabled()) {
    const startTime = activeMeasures.get(markName);
    
    if (startTime === undefined) {
      console.warn(`[PERF] ⚠️ Marca "${markName}" não foi iniciada com startMark()`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Colorir output baseado na duração (verde < 16ms, amarelo < 50ms, vermelho >= 50ms)
    const color = duration < 16 ? '#22c55e' : duration < 50 ? '#eab308' : '#ef4444';
    
    console.log(
      `%c[PERF] ${markName}: ${duration.toFixed(2)}ms`,
      `color: ${color}; font-weight: bold;`
    );

    if (resetMark) {
      activeMeasures.delete(markName);
    }
  }
};

/**
 * Mede o tempo de execução de uma função síncrona
 * 
 * @param {string} markName - Nome da medição
 * @param {Function} fn - Função a ser medida
 * @returns {T} Retorno da função
 * 
 * @example
 * const result = measureSync('calculateRoute', () => {
 *   return heavyCalculation();
 * });
 */
export const measureSync = <T>(markName: string, fn: () => T): T => {
  startMark(markName);
  const result = fn();
  endMark(markName);
  return result;
};

/**
 * Mede o tempo de execução de uma função assíncrona
 * 
 * @param {string} markName - Nome da medição
 * @param {Function} fn - Função assíncrona a ser medida
 * @returns {Promise<T>} Retorno da função assíncrona
 * 
 * @example
 * const data = await measureAsync('fetchRouteData', async () => {
 *   return await fetchFromAPI();
 * });
 */
export const measureAsync = async <T>(markName: string, fn: () => Promise<T>): Promise<T> => {
  startMark(markName);
  try {
    const result = await fn();
    endMark(markName);
    return result;
  } catch (error) {
    endMark(markName);
    throw error;
  }
};

/**
 * Decorator para medição automática de métodos (experimental)
 * 
 * @param {string} markName - Nome da medição (opcional, usa nome do método se omitido)
 * @returns {Function} Decorator
 * 
 * @example
 * class MyComponent {
 *   @perfMeasure('complexOperation')
 *   complexMethod() {
 *     // código pesado
 *   }
 * }
 */
export const perfMeasure = (markName?: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const measureName = markName || propertyKey;

    descriptor.value = function (...args: any[]) {
      startMark(measureName);
      const result = originalMethod.apply(this, args);
      endMark(measureName);
      return result;
    };

    return descriptor;
  };
};

/**
 * Limpa todas as marcações ativas
 * Útil para resetar estado em caso de erro
 */
export const clearAllMarks = (): void => {
  if (isPerfEnabled()) {
    activeMeasures.clear();
    console.log('[PERF] 🧹 Todas as marcações foram limpas');
  }
};

/**
 * Lista todas as marcações ativas (útil para debug)
 */
export const listActiveMarks = (): void => {
  if (isPerfEnabled()) {
    if (activeMeasures.size === 0) {
      console.log('[PERF] Nenhuma marcação ativa');
      return;
    }

    console.log('[PERF] Marcações ativas:');
    activeMeasures.forEach((startTime, markName) => {
      const elapsed = performance.now() - startTime;
      console.log(`  - ${markName}: ${elapsed.toFixed(2)}ms (ainda em execução)`);
    });
  }
};

/**
 * Helper para verificar se performance tracking está ativo
 * 
 * @returns {boolean} true se performance tracking ativo
 * 
 * @example
 * if (isPerfActive()) {
 *   // Código de profiling adicional
 * }
 */
export const isPerfActive = (): boolean => {
  return isPerfEnabled();
};

// Export default para uso simples
export default {
  startMark,
  endMark,
  measureSync,
  measureAsync,
  perfMeasure,
  clearAllMarks,
  listActiveMarks,
  isPerfActive
};
