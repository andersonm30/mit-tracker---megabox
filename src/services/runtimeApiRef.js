/**
 * Runtime API Singleton Reference
 * 
 * Holder global seguro para o runtimeApi, usado principalmente pelo Vuex Store.
 * O plugin seta a instância durante o app.use(), e o store pode acessar via getRuntimeApi().
 * 
 * Isso evita usar inject() dentro do store (que não tem acesso ao composition context)
 * e evita window.$ direto.
 */

let _api = null;

export const setRuntimeApi = (api) => {
  _api = api;
};

export const getRuntimeApi = () => {
  if (!_api) throw new Error('Runtime API não inicializada. Recarregue a página.');
  return _api;
};
