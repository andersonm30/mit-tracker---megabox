/**
 * ASYNC COMPONENT UTILITIES - MIT.app
 * ========================================
 * Helpers para trabalhar com componentes async e refs.
 * Resolve problemas de timing quando componentes lazy ainda não carregaram.
 * 
 * @module utils/asyncComponent
 * @version 1.0.0
 */

import { nextTick } from 'vue';

/**
 * Aguarda até que um componente async esteja montado e pronto para uso.
 * Resolve o problema de cliques no menu disparando antes do componente lazy carregar.
 * 
 * @param {import('vue').Ref} ref - Ref do componente
 * @param {Object} options - Opções de configuração
 * @param {number} [options.timeoutMs=3000] - Timeout máximo em ms
 * @param {number} [options.pollIntervalMs=50] - Intervalo de polling em ms
 * @param {string} [options.requiredMethod] - Método que deve existir no componente
 * @param {boolean} [options.silent=false] - Se true, não lança erro em timeout
 * @returns {Promise<boolean>} - true se pronto, false se timeout (modo silent)
 * @throws {Error} se timeout e não estiver em modo silent
 * 
 * @example
 * // No userMenu, antes de chamar o método:
 * await ensureAsyncRefReady(editUsersRef, { requiredMethod: 'showUsers' });
 * editUsersRef.value.showUsers();
 */
export async function ensureAsyncRefReady(ref, options = {}) {
  const {
    timeoutMs = 3000,
    pollIntervalMs = 50,
    requiredMethod,
    silent = false,
  } = options;

  const startTime = Date.now();

  // Helper para verificar se está pronto
  const isReady = () => {
    if (!ref.value) return false;
    
    // Se especificou método requerido, verifica se existe
    if (requiredMethod) {
      return typeof ref.value[requiredMethod] === 'function';
    }
    
    return true;
  };

  // Se já está pronto, retorna imediatamente
  if (isReady()) {
    await nextTick();
    return true;
  }

  // Polling até ficar pronto ou timeout
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      if (isReady()) {
        clearInterval(checkInterval);
        nextTick().then(() => resolve(true));
        return;
      }

      // Verifica timeout
      if (Date.now() - startTime >= timeoutMs) {
        clearInterval(checkInterval);
        
        if (silent) {
          resolve(false);
          return;
        }
        
        const methodInfo = requiredMethod ? ` com método '${requiredMethod}'` : '';
        reject(new Error(
          `ensureAsyncRefReady: Timeout aguardando componente async${methodInfo} (${timeoutMs}ms)`
        ));
      }
    }, pollIntervalMs);
  });
}

/**
 * Wrapper que executa uma função apenas se o ref estiver pronto.
 * Se não estiver pronto em tempo, mostra notificação ao usuário.
 * 
 * @param {import('vue').Ref} ref - Ref do componente
 * @param {string} method - Nome do método a chamar
 * @param {any[]} [args=[]] - Argumentos para o método
 * @param {Object} [options={}] - Opções adicionais
 * @returns {Promise<any>} - Resultado do método ou undefined se falhou
 * 
 * @example
 * // Simplifica o código do menu:
 * await safeCallAsyncMethod(editUsersRef, 'showUsers');
 */
export async function safeCallAsyncMethod(ref, method, args = [], options = {}) {
  try {
    const ready = await ensureAsyncRefReady(ref, {
      ...options,
      requiredMethod: method,
      silent: true,
    });

    if (!ready) {
      console.warn(`[safeCallAsyncMethod] Componente não ficou pronto a tempo para '${method}'`);
      
      // Tenta importar ElMessage para feedback ao usuário
      try {
        const { ElMessage } = await import('element-plus');
        ElMessage.warning('Aguarde, carregando...');
      } catch {
        // Ignora se não conseguir importar
      }
      
      return undefined;
    }

    // Chama o método
    await nextTick();
    return ref.value[method](...args);
    
  } catch (error) {
    console.error(`[safeCallAsyncMethod] Erro ao chamar '${method}':`, error);
    return undefined;
  }
}

/**
 * Cria um handler de menu que garante que o componente async esteja pronto.
 * 
 * @param {import('vue').Ref} ref - Ref do componente
 * @param {string} method - Nome do método a chamar
 * @param {any[]} [args=[]] - Argumentos para o método
 * @returns {Function} - Função callback para uso em menus
 * 
 * @example
 * const menuItems = [
 *   { text: 'Usuários', cb: createSafeMenuHandler(editUsersRef, 'showUsers') },
 *   { text: 'Motoristas', cb: createSafeMenuHandler(editDriversRef, 'showDrivers') },
 * ];
 */
export function createSafeMenuHandler(ref, method, args = []) {
  return async () => {
    await safeCallAsyncMethod(ref, method, args, { timeoutMs: 2000 });
  };
}

/**
 * Pré-carrega um componente async "tocando" seu ref.
 * Útil para antecipar o carregamento de componentes que serão usados em breve.
 * 
 * @param {import('vue').Ref[]} refs - Lista de refs para pré-carregar
 * 
 * @example
 * // No onMounted, pré-carrega componentes do menu do usuário:
 * preloadAsyncComponents([editUsersRef, editDriversRef, editServerRef]);
 */
export function preloadAsyncComponents(refs) {
  // Apenas acessa os refs para triggerar o lazy loading
  refs.forEach(ref => {
    // O simples acesso já pode triggerar o carregamento em alguns casos
    // eslint-disable-next-line no-unused-vars
    const _unused = ref.value;
  });
}

export default {
  ensureAsyncRefReady,
  safeCallAsyncMethod,
  createSafeMenuHandler,
  preloadAsyncComponents,
};
