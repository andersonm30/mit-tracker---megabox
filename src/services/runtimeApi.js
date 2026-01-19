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
  // Traccar - Authentication & Session
  // =========================
  const login = async (email, password) => {
    assertFn($traccar?.login, 'Runtime API (Traccar.login) não disponível.')
    return $traccar.login(email, password)
  }

  const loginToken = async (token) => {
    assertFn($traccar?.loginToken, 'Runtime API (Traccar.loginToken) não disponível.')
    return $traccar.loginToken(token)
  }

  const getSession = async () => {
    assertFn($traccar?.getSession, 'Runtime API (Traccar.getSession) não disponível.')
    return $traccar.getSession()
  }

  const deleteSession = async () => {
    assertFn($traccar?.deleteSession, 'Runtime API (Traccar.deleteSession) não disponível.')
    return $traccar.deleteSession()
  }

  // =========================
  // Traccar - Server
  // =========================
  const getServer = async () => {
    assertFn($traccar?.getServer, 'Runtime API (Traccar.getServer) não disponível.')
    return $traccar.getServer()
  }

  const saveServer = async (params) => {
    assertFn($traccar?.saveServer, 'Runtime API (Traccar.saveServer) não disponível.')
    return $traccar.saveServer(params)
  }

  // =========================
  // Traccar - Users
  // =========================
  const getUsers = async (params) => {
    assertFn($traccar?.getUsers, 'Runtime API (Traccar.getUsers) não disponível.')
    return $traccar.getUsers(params)
  }

  const createUser = async (params) => {
    assertFn($traccar?.createUser, 'Runtime API (Traccar.createUser) não disponível.')
    return $traccar.createUser(params)
  }

  const updateUser = async (id, params) => {
    assertFn($traccar?.updateUser, 'Runtime API (Traccar.updateUser) não disponível.')
    return $traccar.updateUser(id, params)
  }

  const deleteUser = async (params) => {
    assertFn($traccar?.deleteUser, 'Runtime API (Traccar.deleteUser) não disponível.')
    return $traccar.deleteUser(params)
  }

  // =========================
  // Traccar - Devices
  // =========================
  const getDevices = async (params) => {
    assertFn($traccar?.getDevices, 'Runtime API (Traccar.getDevices) não disponível.')
    return $traccar.getDevices(params)
  }

  const createDevice = async (params) => {
    assertFn($traccar?.createDevice, 'Runtime API (Traccar.createDevice) não disponível.')
    return $traccar.createDevice(params)
  }

  const updateDevice = async (id, params) => {
    assertFn($traccar?.updateDevice, 'Runtime API (Traccar.updateDevice) não disponível.')
    return $traccar.updateDevice(id, params)
  }

  const deleteDevice = async (id) => {
    assertFn($traccar?.deleteDevice, 'Runtime API (Traccar.deleteDevice) não disponível.')
    return $traccar.deleteDevice(id)
  }

  const updateAccumulators = async (id, params) => {
    assertFn($traccar?.updateAccumulators, 'Runtime API (Traccar.updateAccumulators) não disponível.')
    return $traccar.updateAccumulators(id, params)
  }

  const getPositions = async (ids) => {
    assertFn($traccar?.getPositions, 'Runtime API (Traccar.getPositions) não disponível.')
    return $traccar.getPositions(ids)
  }

  // =========================
  // Traccar - Groups
  // =========================
  const getGroups = async (params) => {
    assertFn($traccar?.getGroups, 'Runtime API (Traccar.getGroups) não disponível.')
    return $traccar.getGroups(params)
  }

  const createGroup = async (params) => {
    assertFn($traccar?.createGroup, 'Runtime API (Traccar.createGroup) não disponível.')
    return $traccar.createGroup(params)
  }

  const updateGroup = async (id, params) => {
    assertFn($traccar?.updateGroup, 'Runtime API (Traccar.updateGroup) não disponível.')
    return $traccar.updateGroup(id, params)
  }

  const deleteGroup = async (id) => {
    assertFn($traccar?.deleteGroup, 'Runtime API (Traccar.deleteGroup) não disponível.')
    return $traccar.deleteGroup(id)
  }

  // =========================
  // Traccar - Geofences
  // =========================
  const getGeofences = async (params) => {
    assertFn($traccar?.getGeofences, 'Runtime API (Traccar.getGeofences) não disponível.')
    return $traccar.getGeofences(params)
  }

  const createGeofence = async (params) => {
    assertFn($traccar?.createGeofence, 'Runtime API (Traccar.createGeofence) não disponível.')
    return $traccar.createGeofence(params)
  }

  const updateGeofence = async (id, params) => {
    assertFn($traccar?.updateGeofence, 'Runtime API (Traccar.updateGeofence) não disponível.')
    return $traccar.updateGeofence(id, params)
  }

  const deleteGeofence = async (id) => {
    assertFn($traccar?.deleteGeofence, 'Runtime API (Traccar.deleteGeofence) não disponível.')
    return $traccar.deleteGeofence(id)
  }

  // =========================
  // Traccar - Notifications
  // =========================
  const getNotifications = async () => {
    assertFn($traccar?.getNotifications, 'Runtime API (Traccar.getNotifications) não disponível.')
    return $traccar.getNotifications()
  }

  const createNotification = async (params) => {
    assertFn($traccar?.createNotification, 'Runtime API (Traccar.createNotification) não disponível.')
    return $traccar.createNotification(params)
  }

  const updateNotification = async (id, params) => {
    assertFn($traccar?.updateNotification, 'Runtime API (Traccar.updateNotification) não disponível.')
    return $traccar.updateNotification(id, params)
  }

  const deleteNotification = async (params) => {
    assertFn($traccar?.deleteNotification, 'Runtime API (Traccar.deleteNotification) não disponível.')
    return $traccar.deleteNotification(params)
  }

  // =========================
  // Traccar - Drivers
  // =========================
  const getDrivers = async () => {
    assertFn($traccar?.getDrivers, 'Runtime API (Traccar.getDrivers) não disponível.')
    return $traccar.getDrivers()
  }

  const createDriver = async (params) => {
    assertFn($traccar?.createDriver, 'Runtime API (Traccar.createDriver) não disponível.')
    return $traccar.createDriver(params)
  }

  const updateDriver = async (id, params) => {
    assertFn($traccar?.updateDriver, 'Runtime API (Traccar.updateDriver) não disponível.')
    return $traccar.updateDriver(id, params)
  }

  const deleteDriver = async (params) => {
    assertFn($traccar?.deleteDriver, 'Runtime API (Traccar.deleteDriver) não disponível.')
    return $traccar.deleteDriver(params)
  }

  // =========================
  // Traccar - Maintenance
  // =========================
  const getMaintenance = async () => {
    assertFn($traccar?.getMaintenance, 'Runtime API (Traccar.getMaintenance) não disponível.')
    return $traccar.getMaintenance()
  }

  const createMaintenance = async (params) => {
    assertFn($traccar?.createMaintenance, 'Runtime API (Traccar.createMaintenance) não disponível.')
    return $traccar.createMaintenance(params)
  }

  const updateMaintenance = async (id, params) => {
    assertFn($traccar?.updateMaintenance, 'Runtime API (Traccar.updateMaintenance) não disponível.')
    return $traccar.updateMaintenance(id, params)
  }

  const deleteMaintenance = async (params) => {
    assertFn($traccar?.deleteMaintenance, 'Runtime API (Traccar.deleteMaintenance) não disponível.')
    return $traccar.deleteMaintenance(params)
  }

  // =========================
  // Traccar - Computed Attributes
  // =========================
  const getComputedAttributes = async () => {
    assertFn($traccar?.getComputedAttributes, 'Runtime API (Traccar.getComputedAttributes) não disponível.')
    return $traccar.getComputedAttributes()
  }

  const createComputedAttribute = async (params) => {
    assertFn($traccar?.createComputedAttribute, 'Runtime API (Traccar.createComputedAttribute) não disponível.')
    return $traccar.createComputedAttribute(params)
  }

  const updateComputedAttribute = async (id, params) => {
    assertFn($traccar?.updateComputedAttribute, 'Runtime API (Traccar.updateComputedAttribute) não disponível.')
    return $traccar.updateComputedAttribute(id, params)
  }

  const deleteComputedAttribute = async (params) => {
    assertFn($traccar?.deleteComputedAttribute, 'Runtime API (Traccar.deleteComputedAttribute) não disponível.')
    return $traccar.deleteComputedAttribute(params)
  }

  // =========================
  // Traccar - Saved Commands
  // =========================
  const getSavedCommands = async (params) => {
    assertFn($traccar?.getSavedCommands, 'Runtime API (Traccar.getSavedCommands) não disponível.')
    return $traccar.getSavedCommands(params)
  }

  const createSavedCommand = async (params) => {
    assertFn($traccar?.createSavedCommand, 'Runtime API (Traccar.createSavedCommand) não disponível.')
    return $traccar.createSavedCommand(params)
  }

  const updateSavedCommand = async (id, params) => {
    assertFn($traccar?.updateSavedCommand, 'Runtime API (Traccar.updateSavedCommand) não disponível.')
    return $traccar.updateSavedCommand(id, params)
  }

  const deleteSavedCommand = async (id) => {
    assertFn($traccar?.deleteSavedCommand, 'Runtime API (Traccar.deleteSavedCommand) não disponível.')
    return $traccar.deleteSavedCommand(id)
  }

  // =========================
  // Traccar - Calendars
  // =========================
  const getCalendars = async (params) => {
    assertFn($traccar?.getCalendars, 'Runtime API (Traccar.getCalendars) não disponível.')
    return $traccar.getCalendars(params)
  }

  const createCalendar = async (params) => {
    assertFn($traccar?.createCalendar, 'Runtime API (Traccar.createCalendar) não disponível.')
    return $traccar.createCalendar(params)
  }

  const updateCalendar = async (id, params) => {
    assertFn($traccar?.updateCalendar, 'Runtime API (Traccar.updateCalendar) não disponível.')
    return $traccar.updateCalendar(id, params)
  }

  const deleteCalendar = async (id) => {
    assertFn($traccar?.deleteCalendar, 'Runtime API (Traccar.deleteCalendar) não disponível.')
    return $traccar.deleteCalendar(id)
  }

  // =========================
  // Reports helpers
  // =========================
  const assertRequired = (cond, code, message) => {
    if (!cond) {
      const err = new Error(message)
      err.code = code
      throw err
    }
  }

  const normalizeReportRange = (params = {}) => {
    // Aceita múltiplos nomes (pra não quebrar UI antiga)
    const deviceId =
      params.deviceId ?? params.deviceID ?? params.device ?? params.id

    const from =
      params.from ?? params.startDate ?? params.start ?? params.dateFrom

    const to =
      params.to ?? params.endDate ?? params.end ?? params.dateTo

    return { deviceId, from, to }
  }

  // =========================
  // Traccar - Routes
  // =========================
  const loadRoute = async (deviceId, startDate, endDate, isExport) => {
    assertFn($traccar?.loadRoute, 'Runtime API (Traccar.loadRoute) não disponível.')
    return $traccar.loadRoute(deviceId, startDate, endDate, isExport)
  }

  // =========================
  // Traccar - Reports
  // =========================
  const getReportSummary = async (params = {}) => {
    const { deviceId, from, to } = normalizeReportRange(params)

    assertRequired(deviceId, 'ERR.REPORT_DEVICE_REQUIRED', 'deviceId é obrigatório.')
    assertRequired(from, 'ERR.REPORT_FROM_REQUIRED', 'from/startDate é obrigatório.')
    assertRequired(to, 'ERR.REPORT_TO_REQUIRED', 'to/endDate é obrigatório.')

    // Traccar REST padrão:
    // GET /reports/summary?deviceId=...&from=...&to=...
    assertFn($traccar?.get, 'Runtime API (Traccar.get) não disponível.')
    return $traccar.get('/reports/summary', {
      params: { deviceId, from, to },
      signal: params.signal // Suporte a AbortController
    })
  }

  const getReportTrips = async (params = {}) => {
    const { deviceId, from, to } = normalizeReportRange(params)

    assertRequired(deviceId, 'ERR.REPORT_DEVICE_REQUIRED', 'deviceId é obrigatório.')
    assertRequired(from, 'ERR.REPORT_FROM_REQUIRED', 'from/startDate é obrigatório.')
    assertRequired(to, 'ERR.REPORT_TO_REQUIRED', 'to/endDate é obrigatório.')

    // GET /reports/trips
    assertFn($traccar?.get, 'Runtime API (Traccar.get) não disponível.')
    return $traccar.get('/reports/trips', { 
      params: { deviceId, from, to },
      signal: params.signal // Suporte a AbortController
    })
  }

  const getReportStops = async (params = {}) => {
    const { deviceId, from, to } = normalizeReportRange(params)

    assertRequired(deviceId, 'ERR.REPORT_DEVICE_REQUIRED', 'deviceId é obrigatório.')
    assertRequired(from, 'ERR.REPORT_FROM_REQUIRED', 'from/startDate é obrigatório.')
    assertRequired(to, 'ERR.REPORT_TO_REQUIRED', 'to/endDate é obrigatório.')

    // GET /reports/stops
    assertFn($traccar?.get, 'Runtime API (Traccar.get) não disponível.')
    return $traccar.get('/reports/stops', { 
      params: { deviceId, from, to },
      signal: params.signal // Suporte a AbortController
    })
  }

  const getReportEvents = async (params = {}) => {
    const { deviceId, from, to } = normalizeReportRange(params)

    assertRequired(deviceId, 'ERR.REPORT_DEVICE_REQUIRED', 'deviceId é obrigatório.')
    assertRequired(from, 'ERR.REPORT_FROM_REQUIRED', 'from/startDate é obrigatório.')
    assertRequired(to, 'ERR.REPORT_TO_REQUIRED', 'to/endDate é obrigatório.')

    // GET /reports/events
    assertFn($traccar?.get, 'Runtime API (Traccar.get) não disponível.')
    return $traccar.get('/reports/events', { 
      params: { deviceId, from, to },
      signal: params.signal // Suporte a AbortController
    })
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
  // WebSocket
  // =========================
  const isWsConnected = () => {
    return $traccar?.isWsConnected?.() || false
  }

  const on = (event, handler) => {
    assertFn($traccar?.on, 'Runtime API (Traccar.on) não disponível.')
    return $traccar.on(event, handler)
  }

  const startWS = () => {
    assertFn($traccar?.startWS, 'Runtime API (Traccar.startWS) não disponível.')
    return $traccar.startWS()
  }

  const closeWS = () => {
    if (typeof $traccar?.closeWS === 'function') {
      return $traccar.closeWS()
    }
  }

  // =========================
  // Expor também raw (escape hatch)
  // =========================
  const raw = {
    traccar: $traccar,
    tarkan: $tarkan,
  }

  return {
    // Traccar - Core HTTP
    sendCommand,
    getAvailableCommands,
    getTypeCommands,
    get,
    post,
    put,
    delete: del,
    api,
    
    // Traccar - Authentication & Session
    login,
    loginToken,
    getSession,
    deleteSession,
    
    // Traccar - Server
    getServer,
    saveServer,
    
    // Traccar - Users
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    
    // Traccar - Devices
    getDevices,
    createDevice,
    updateDevice,
    deleteDevice,
    updateAccumulators,
    getPositions,
    
    // Traccar - Groups
    getGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    
    // Traccar - Geofences
    getGeofences,
    createGeofence,
    updateGeofence,
    deleteGeofence,
    
    // Traccar - Notifications
    getNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
    
    // Traccar - Drivers
    getDrivers,
    createDriver,
    updateDriver,
    deleteDriver,
    
    // Traccar - Maintenance
    getMaintenance,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
    
    // Traccar - Computed Attributes
    getComputedAttributes,
    createComputedAttribute,
    updateComputedAttribute,
    deleteComputedAttribute,
    
    // Traccar - Saved Commands
    getSavedCommands,
    createSavedCommand,
    updateSavedCommand,
    deleteSavedCommand,
    
    // Traccar - Calendars
    getCalendars,
    createCalendar,
    updateCalendar,
    deleteCalendar,
    
    // Traccar - Routes
    loadRoute,

    // Traccar - Reports
    getReportSummary,
    getReportTrips,
    getReportStops,
    getReportEvents,

    // Tarkan
    tarkanToast,
    tarkanConfirm,

    // WebSocket
    isWsConnected,
    on,
    startWS,
    closeWS,

    // Raw
    raw,
  }
}
