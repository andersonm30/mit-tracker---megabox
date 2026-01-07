// src/plugins/runtimeApi.js
import { createRuntimeApi } from '@/services/runtimeApi'

/**
 * RuntimeApiPlugin
 * - provide('runtimeApi', api)  -> inject('runtimeApi')
 * - app.config.globalProperties.$runtimeApi -> uso legado/transição
 */
export const RuntimeApiPlugin = {
  install(app, options = {}) {
    const api = createRuntimeApi(options)

    app.provide('runtimeApi', api)

    // Ajuda migração gradual (opcional, mas muito útil)
    app.config.globalProperties.$runtimeApi = api
  },
}
