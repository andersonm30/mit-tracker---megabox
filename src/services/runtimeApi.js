// src/services/runtimeApi.js

/**
 * Runtime API Bridge
 * ------------------
 * Objetivo:
 * - Encapsular acesso a globals (window.$traccar / window.$tarkan)
 * - Fornecer uma interface estável para components/composables/store
 * - Centralizar asserts e mensagens de erro
 *
 * Regras:
 * - Nunca use window.$traccar direto fora daqui (exceto legacy até migrar)
 * - Métodos devem falhar com erro claro e previsível
 */

const ERR = {
  TRACCAR_UNAVAILABLE: 'Runtime API (Traccar) não disponível. Recarregue a página.',
  TARKAN_UNAVAILABLE: 'Runtime API (Tarkan) não disponível. Recarregue a página.',
}

const getGlobal = () => (typeof window !== 'undefined' ? window : null)

const assertFn = (fn, message) => {
  if (typeof fn !== 'function') {
    throw new Error(message)
  }
}

export function createRuntimeApi({ traccar, tarkan } = {}) {
  const w = getGlobal()

  // Permite DI em testes, mas default é window
  const $traccar = traccar || w?.$traccar || null
  const $tarkan = tarkan || w?.$tarkan || null

  // =========================
  // Traccar (core)
  // =========================
  const sendCommand = async (payload) => {
    assertFn($traccar?.sendCommand, ERR.TRACCAR_UNAVAILABLE)
    return $traccar.sendCommand(payload)
  }

  const getAvailableCommands = async (deviceId) => {
    assertFn($traccar?.getAvailableCommands, 'Runtime API (Traccar.getAvailableCommands) não disponível.')
    return $traccar.getAvailableCommands(deviceId)
  }

  const getTypeCommands = async (deviceId) => {
    assertFn($traccar?.getTypeCommands, 'Runtime API (Traccar.getTypeCommands) não disponível.')
    return $traccar.getTypeCommands(deviceId)
  }

  const getReportEvents = async (...args) => {
    assertFn($traccar?.getReportEvents, 'Runtime API (Traccar.getReportEvents) não disponível.')
    return $traccar.getReportEvents(...args)
  }

  // Helpers HTTP (se existirem no seu $traccar). Se não existirem,
  // deixamos erro claro para você mapear o método correto depois.
  const get = async (url, params) => {
    assertFn($traccar?.get, 'Runtime API (Traccar.get) não disponível.')
    return $traccar.get(url, params)
  }

  const post = async (url, body) => {
    assertFn($traccar?.post, 'Runtime API (Traccar.post) não disponível.')
    return $traccar.post(url, body)
  }

  const put = async (url, body) => {
    assertFn($traccar?.put, 'Runtime API (Traccar.put) não disponível.')
    return $traccar.put(url, body)
  }

  const del = async (url) => {
    assertFn($traccar?.delete, 'Runtime API (Traccar.delete) não disponível.')
    return $traccar.delete(url)
  }

  // Alguns projetos usam $traccar.api(...) genérico
  const api = async (...args) => {
    assertFn($traccar?.api, 'Runtime API (Traccar.api) não disponível.')
    return $traccar.api(...args)
  }

  // =========================
  // Tarkan (helpers)
  // =========================
  const tarkanToast = (message, type = 'info') => {
    assertFn($tarkan?.toast, ERR.TARKAN_UNAVAILABLE)
    return $tarkan.toast(message, type)
  }

  const tarkanConfirm = async (opts) => {
    assertFn($tarkan?.confirm, ERR.TARKAN_UNAVAILABLE)
    return $tarkan.confirm(opts)
  }

  // =========================
  // Expor também raw (escape hatch)
  // =========================
  const raw = {
    traccar: $traccar,
    tarkan: $tarkan,
  }

  return {
    // Traccar
    sendCommand,
    getAvailableCommands,
    getTypeCommands,
    getReportEvents,
    get,
    post,
    put,
    delete: del,
    api,

    // Tarkan
    tarkanToast,
    tarkanConfirm,

    // Raw
    raw,
  }
}
