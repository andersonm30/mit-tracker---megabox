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

    // TRAVA: Deprecation warning DEV-only
    if (process.env.NODE_ENV !== 'production') {
      if (typeof window !== 'undefined') {
        if (window.$traccar) {
          console.warn('[RuntimeApiPlugin] ⚠️ window.$traccar detectado. Use runtimeApi (inject/getRuntimeApi).')
        }
        if (window.$tarkan) {
          console.warn('[RuntimeApiPlugin] ⚠️ window.$tarkan detectado. Use runtimeApi (inject/getRuntimeApi).')
        }
      }
    }

    app.provide('runtimeApi', api)

    // Para Vuex Store e componentes legados
    setRuntimeApi(api)
    app.config.globalProperties.$runtimeApi = api
  },
}
