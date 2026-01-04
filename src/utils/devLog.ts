/**
 * devLog - Sistema de logging para desenvolvimento
 * 
 * Fornece logging condicional baseado em:
 * 1. NODE_ENV === 'development' (build-time check)
 * 2. localStorage.DEBUG_MAP === '1' (runtime check)
 * 
 * USAGE:
 * ```typescript
 * import { devLog } from '@/utils/devLog';
 * 
 * devLog('[MyComponent]', 'Inicializando...', { data: value });
 * ```
 * 
 * ATIVAÇÃO:
 * 1. Abra DevTools (F12) no navegador
 * 2. No Console, execute: localStorage.setItem('DEBUG_MAP', '1')
 * 3. Recarregue a página (F5)
 * 
 * DESATIVAÇÃO:
 * localStorage.removeItem('DEBUG_MAP')
 * 
 * IMPORTANTE:
 * - Logs são automaticamente desabilitados em produção (NODE_ENV !== 'development')
 * - Não adiciona overhead em produção (tree-shaking remove o código)
 * - Nunca commit com DEBUG_MAP ativado por padrão
 * 
 * @module devLog
 */

/**
 * Verifica se o logging de debug está habilitado
 * 
 * Condições:
 * 1. Deve estar em ambiente de desenvolvimento
 * 2. localStorage.DEBUG_MAP deve estar definido como '1'
 * 
 * @returns {boolean} true se logging está habilitado
 */
const isDebugEnabled = (): boolean => {
  // Em produção, sempre retorna false (tree-shaking remove o código)
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }

  // Em desenvolvimento, verifica localStorage
  try {
    return localStorage.getItem('DEBUG_MAP') === '1';
  } catch (error) {
    // Fallback se localStorage não disponível (SSR, etc.)
    return false;
  }
};

/**
 * Função de logging condicional para desenvolvimento
 * 
 * Comportamento:
 * - Se debug desabilitado: não faz nada (0 overhead)
 * - Se debug habilitado: chama console.log com todos os argumentos
 * 
 * Suporta múltiplos argumentos como console.log nativo:
 * - Strings, números, objetos, arrays
 * - Formatação com %s, %d, %o, etc.
 * 
 * @param {...any} args - Argumentos a serem logados (qualquer tipo)
 * 
 * @example
 * devLog('[kore-map]', 'Mapa inicializado');
 * devLog('[PLAY]', 'Index:', 42, 'Coords:', { lat, lng });
 * devLog('[ERROR]', 'Falha:', error);
 */
export const devLog = (...args: any[]): void => {
  if (isDebugEnabled()) {
    console.log(...args);
  }
};

/**
 * Função de warning condicional para desenvolvimento
 * 
 * Similar a devLog, mas usa console.warn para destacar avisos
 * 
 * @param {...any} args - Argumentos a serem logados como warning
 * 
 * @example
 * devWarn('[kore-map]', 'Mapa ainda não inicializado');
 */
export const devWarn = (...args: any[]): void => {
  if (isDebugEnabled()) {
    console.warn(...args);
  }
};

/**
 * Função de error condicional para desenvolvimento
 * 
 * Similar a devLog, mas usa console.error para destacar erros
 * Útil para erros não-críticos que não devem poluir produção
 * 
 * @param {...any} args - Argumentos a serem logados como erro
 * 
 * @example
 * devError('[kore-map]', 'Erro no watcher:', error);
 */
export const devError = (...args: any[]): void => {
  if (isDebugEnabled()) {
    console.error(...args);
  }
};

/**
 * Helper para verificar se debug está ativo
 * Útil para evitar computações custosas quando debug desabilitado
 * 
 * @returns {boolean} true se debug ativo
 * 
 * @example
 * if (isDebugActive()) {
 *   const expensiveData = computeExpensiveDebugInfo();
 *   devLog('[DEBUG]', expensiveData);
 * }
 */
export const isDebugActive = (): boolean => {
  return isDebugEnabled();
};

/**
 * Cria uma função de log com prefixo fixo
 * Útil para componentes que logam frequentemente
 * 
 * @param {string} prefix - Prefixo a ser adicionado a todos os logs
 * @returns {Function} Função de log com prefixo
 * 
 * @example
 * const log = createLogger('[kore-map]');
 * log('Inicializando...'); // Output: [kore-map] Inicializando...
 * log('Zoom:', 10); // Output: [kore-map] Zoom: 10
 */
export const createLogger = (prefix: string) => {
  return (...args: any[]) => {
    devLog(prefix, ...args);
  };
};

// Export default para uso simples
export default devLog;
