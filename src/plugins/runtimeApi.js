// src/plugins/runtimeApi.js
import { createRuntimeApi } from '@/services/runtimeApi'
import { setRuntimeApi } from '@/services/runtimeApiRef'

/**
 * RuntimeApiPlugin
 * - provide('runtimeApi', api)  -> inject('runtimeApi')
 * - app.config.globalProperties.$runtimeApi -> uso legado/transição
 * - setRuntimeApi(api) -> getRuntimeApi() no Vuex Store
 */
export const RuntimeApiPlugin = {
  install(app, options = {}) {
    const api = createRuntimeApi(options)

    app.provide('runtimeApi', api)

    // Para Vuex Store e componentes legados
    setRuntimeApi(api)
    app.config.globalProperties.$runtimeApi = api
  },
}
