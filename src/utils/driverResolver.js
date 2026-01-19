/**
 * driverResolver.js
 * 
 * Utilitário centralizado para resolução de motorista/RFID.
 * 
 * REGRAS:
 * - driverUniqueId só existe quando a TAG é VALID (vem do backend)
 * - rfid sempre existe quando houve leitura/tentativa
 * - rfidStatus pode ser VALID/INVALID/UNKNOWN
 * 
 * PRIORIDADE:
 * - "Motorista atual" = driverUniqueId (prioridade) || rfid (fallback)
 * - "Última tentativa" = rfid + rfidStatus
 * - NUNCA usar cache global que misture devices
 */

// Status de RFID do backend
export const RFID_STATUS = {
  VALID: 'VALID',
  INVALID: 'INVALID',
  UNKNOWN: 'UNKNOWN'
};

// Labels para exibição
export const RFID_STATUS_LABELS = {
  VALID: 'TAG AUTORIZADA',
  INVALID: 'TAG INVÁLIDA',
  UNKNOWN: 'TAG LIDA'
};

// Cores para badges
export const RFID_STATUS_COLORS = {
  VALID: 'success',
  INVALID: 'danger',
  UNKNOWN: 'warning'
};

/**
 * Extrai informações de driver/RFID de um position e device
 * @param {Object} position - Position do Traccar
 * @param {Object} device - Device do Traccar (fallback)
 * @returns {Object} Informações normalizadas
 */
export const extractDriverInfo = (position, device = null) => {
  const attrs = position?.attributes ?? {};
  const deviceAttrs = device?.attributes ?? {};
  
  // Driver atual (prioridade: driverUniqueId do position > rfid válido > device fallback)
  // NÃO usar rfid direto se rfidStatus !== VALID
  const driverUniqueId = attrs.driverUniqueId || null;
  const rfid = attrs.rfid || null;
  const rfidStatus = attrs.rfidStatus || null;
  const rfidTs = attrs.rfidTs || null;
  
  // Fallback para device.attributes (caso position não tenha)
  const deviceDriverUniqueId = deviceAttrs.driverUniqueId || null;
  
  // Driver efetivo: driverUniqueId OU rfid SE status é VALID
  // Nunca usar rfid como driver se status é INVALID/UNKNOWN
  let effectiveDriverId = driverUniqueId;
  let effectiveSource = driverUniqueId ? 'driverUniqueId' : null;
  
  if (!effectiveDriverId && rfid && rfidStatus === RFID_STATUS.VALID) {
    effectiveDriverId = rfid;
    effectiveSource = 'rfid_valid';
  }
  
  // Último fallback: device.attributes
  if (!effectiveDriverId && deviceDriverUniqueId) {
    effectiveDriverId = deviceDriverUniqueId;
    effectiveSource = 'device_fallback';
  }
  
  return {
    // Driver efetivo (para exibição de "Motorista Atual")
    effectiveDriverId,
    effectiveSource,
    
    // Dados brutos
    driverUniqueId,
    rfid,
    rfidStatus,
    rfidTs,
    
    // Helpers
    hasDriver: !!effectiveDriverId,
    hasRfidAttempt: !!rfid,
    isRfidValid: rfidStatus === RFID_STATUS.VALID,
    isRfidInvalid: rfidStatus === RFID_STATUS.INVALID,
    isRfidUnknown: rfidStatus === RFID_STATUS.UNKNOWN,
    
    // Debug
    deviceId: device?.id || null,
    positionId: position?.id || null
  };
};

/**
 * Resolve o nome do motorista via store
 * @param {string} driverUniqueId - ID único do driver
 * @param {Object} store - Vuex store
 * @returns {string|null} Nome do motorista ou uniqueId se não encontrar
 */
export const resolveDriverName = (driverUniqueId, store) => {
  if (!driverUniqueId) return null;
  
  try {
    const driver = store?.getters?.['drivers/getDriverByUniqueId']?.(driverUniqueId);
    if (driver) {
      return driver.name || driver.uniqueId || driverUniqueId;
    }
  } catch (e) {
    console.warn('[driverResolver] Erro ao resolver driver:', e);
  }
  
  return driverUniqueId;
};

/**
 * Obtém label e cor do status RFID
 * @param {string} rfidStatus - Status do RFID
 * @returns {Object} { label, color }
 */
export const getRfidStatusDisplay = (rfidStatus) => {
  const status = rfidStatus?.toUpperCase?.() || 'UNKNOWN';
  return {
    label: RFID_STATUS_LABELS[status] || RFID_STATUS_LABELS.UNKNOWN,
    color: RFID_STATUS_COLORS[status] || RFID_STATUS_COLORS.UNKNOWN
  };
};

/**
 * Log de debug para desenvolvimento
 * @param {string} source - Origem do log (componente)
 * @param {Object} info - Informações de driver
 */
export const debugDriverLookup = (source, info) => {
  if (process.env.NODE_ENV === 'development' || window.DEBUG_DRIVER_LOOKUP) {
    console.log(`[driverResolver/${source}]`, {
      deviceId: info.deviceId,
      positionId: info.positionId,
      driverUniqueId: info.driverUniqueId,
      rfid: info.rfid,
      rfidStatus: info.rfidStatus,
      effectiveDriverId: info.effectiveDriverId,
      effectiveSource: info.effectiveSource,
      timestamp: new Date().toISOString()
    });
  }
};

export default {
  RFID_STATUS,
  RFID_STATUS_LABELS,
  RFID_STATUS_COLORS,
  extractDriverInfo,
  resolveDriverName,
  getRfidStatusDisplay,
  debugDriverLookup
};
