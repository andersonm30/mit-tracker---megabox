/**
 * @file observability.js
 * @description Sistema de observabilidade para produção
 * 
 * Features:
 * - Resource Monitor: reporta contagens a cada 60s (quando habilitado)
 * - APM Hooks: marcadores de spans para integração com APM externo
 * - Sampling configurável para evitar spam de logs
 * 
 * Habilitação:
 * - localStorage.setItem('DEBUG_RESOURCES', '1')
 * - Ou process.env.NODE_ENV === 'development'
 * 
 * @module observability
 */

import { getActiveTimerCount } from './timerRegistry.js';

// ========================
// CONFIGURAÇÃO
// ========================
const CONFIG = {
  // Intervalo de report em ms (60s por padrão)
  REPORT_INTERVAL_MS: 60000,
  
  // Sampling rate para spans (1 = 100%, 0.1 = 10%)
  SAMPLING_RATE: 1.0,
  
  // Threshold para alertar sobre recursos "altos"
  THRESHOLDS: {
    timers: 10,
    controllers: 5,
    domListeners: 20,
    players: 2
  },
  
  // Prefixo para logs
  LOG_PREFIX: '[Observability]'
};

// ========================
// STATE
// ========================
let monitorIntervalId = null;
let isMonitorActive = false;
let spanCounter = 0;

// Referências para recursos externos (injetadas via init)
let resourceProviders = {
  getControllerCount: () => 0,
  getDomListenerCount: () => 0,
  getPlayerCount: () => 0
};

// ========================
// HELPERS
// ========================

/**
 * Verifica se observability está habilitada
 */
const isEnabled = () => {
  if (typeof window === 'undefined') return false;
  return (
    process.env.NODE_ENV === 'development' ||
    localStorage.getItem('DEBUG_RESOURCES') === '1'
  );
};

/**
 * Decide se deve amostrar baseado no sampling rate
 */
const shouldSample = () => {
  return Math.random() < CONFIG.SAMPLING_RATE;
};

/**
 * Formata timestamp para log
 */
const timestamp = () => new Date().toISOString();

/**
 * Sanitiza dados para evitar logar informações sensíveis
 */
const sanitize = (data) => {
  if (!data) return data;
  if (typeof data !== 'object') return data;
  
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'cookie', 'session'];
  const sanitized = { ...data };
  
  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(s => lowerKey.includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

// ========================
// RESOURCE MONITOR
// ========================

/**
 * Coleta snapshot de todos os recursos
 */
export const getResourceSnapshot = () => {
  try {
    const timerCounts = getActiveTimerCount();
    
    return {
      timestamp: timestamp(),
      resources: {
        timeouts: timerCounts.timeouts || 0,
        intervals: timerCounts.intervals || 0,
        timersTotal: (timerCounts.timeouts || 0) + (timerCounts.intervals || 0),
        controllers: resourceProviders.getControllerCount(),
        domListeners: resourceProviders.getDomListenerCount(),
        players: resourceProviders.getPlayerCount()
      }
    };
  } catch (e) {
    return {
      timestamp: timestamp(),
      error: e.message,
      resources: {
        timeouts: 0,
        intervals: 0,
        timersTotal: 0,
        controllers: 0,
        domListeners: 0,
        players: 0
      }
    };
  }
};

/**
 * Verifica se algum recurso está acima do threshold
 */
const checkThresholds = (snapshot) => {
  const { resources } = snapshot;
  const warnings = [];
  
  if (resources.timersTotal > CONFIG.THRESHOLDS.timers) {
    warnings.push(`timers (${resources.timersTotal}) > threshold (${CONFIG.THRESHOLDS.timers})`);
  }
  if (resources.controllers > CONFIG.THRESHOLDS.controllers) {
    warnings.push(`controllers (${resources.controllers}) > threshold (${CONFIG.THRESHOLDS.controllers})`);
  }
  if (resources.domListeners > CONFIG.THRESHOLDS.domListeners) {
    warnings.push(`domListeners (${resources.domListeners}) > threshold (${CONFIG.THRESHOLDS.domListeners})`);
  }
  if (resources.players > CONFIG.THRESHOLDS.players) {
    warnings.push(`players (${resources.players}) > threshold (${CONFIG.THRESHOLDS.players})`);
  }
  
  return warnings;
};

/**
 * Reporta snapshot no console
 */
const reportSnapshot = () => {
  if (!isEnabled()) return;
  
  const snapshot = getResourceSnapshot();
  const warnings = checkThresholds(snapshot);
  
  // Log base
  console.debug(
    `${CONFIG.LOG_PREFIX} Resource Monitor`,
    snapshot.resources
  );
  
  // Warnings se houver
  if (warnings.length > 0) {
    console.warn(
      `${CONFIG.LOG_PREFIX} ⚠️ Resource warnings:`,
      warnings.join(', ')
    );
  }
};

/**
 * Inicia o monitor de recursos
 */
export const startResourceMonitor = (providers = {}) => {
  if (isMonitorActive) {
    console.debug(`${CONFIG.LOG_PREFIX} Monitor já está ativo`);
    return;
  }
  
  if (!isEnabled()) {
    console.debug(`${CONFIG.LOG_PREFIX} Monitor desabilitado (DEBUG_RESOURCES != 1)`);
    return;
  }
  
  // Injetar providers
  resourceProviders = {
    getControllerCount: providers.getControllerCount || (() => 0),
    getDomListenerCount: providers.getDomListenerCount || (() => 0),
    getPlayerCount: providers.getPlayerCount || (() => 0)
  };
  
  // Report inicial
  reportSnapshot();
  
  // Iniciar interval (usando setInterval nativo pois é do próprio monitor)
  monitorIntervalId = setInterval(reportSnapshot, CONFIG.REPORT_INTERVAL_MS);
  isMonitorActive = true;
  
  console.debug(
    `${CONFIG.LOG_PREFIX} ✅ Resource Monitor iniciado (report a cada ${CONFIG.REPORT_INTERVAL_MS / 1000}s)`
  );
};

/**
 * Para o monitor de recursos
 */
export const stopResourceMonitor = () => {
  if (monitorIntervalId) {
    clearInterval(monitorIntervalId);
    monitorIntervalId = null;
  }
  isMonitorActive = false;
  console.debug(`${CONFIG.LOG_PREFIX} Monitor parado`);
};

// ========================
// APM HOOKS (Spans)
// ========================

/**
 * Cria um span tracker para medir performance
 * 
 * Uso:
 * const span = createSpan('device_load', { deviceId: 123 });
 * const activeSpan = span.start();
 * // ... operação ...
 * activeSpan.end({ success: true });
 * 
 * @param {string} name - Nome do span
 * @param {Object} attributes - Atributos iniciais (serão sanitizados)
 * @returns {Object} Span object com método start() que retorna objeto com end()
 */
export const createSpan = (name, attributes = {}) => {
  const spanId = ++spanCounter;
  const shouldLog = shouldSample();
  
  return {
    id: spanId,
    name,
    
    /**
     * Inicia o span e retorna objeto com end()
     * @returns {Object} Active span com método end()
     */
    start: () => {
      const startTime = performance.now();
      
      // Não logar se sampling recusar
      if (!shouldLog && !isEnabled()) {
        return {
          end: () => ({ duration: 0, sampled: false })
        };
      }
      
      const sanitizedAttrs = sanitize(attributes);
      
      if (isEnabled()) {
        console.debug(
          `${CONFIG.LOG_PREFIX} 🚀 Span[${spanId}] START: ${name}`,
          sanitizedAttrs
        );
      }
      
      return {
        /**
         * Finaliza o span e loga duração
         * @param {Object} endAttributes - Atributos finais
         */
        end: (endAttributes = {}) => {
          const endTime = performance.now();
          const duration = Math.round(endTime - startTime);
          const sanitizedEndAttrs = sanitize(endAttributes);
          
          if (isEnabled()) {
            const status = endAttributes.success === false ? '❌' : '✅';
            console.debug(
              `${CONFIG.LOG_PREFIX} ${status} Span[${spanId}] END: ${name} (${duration}ms)`,
              { ...sanitizedAttrs, ...sanitizedEndAttrs }
            );
          }
          
          // Hook para APM externo (se existir)
          if (typeof window !== 'undefined' && window.__APM__?.recordSpan) {
            try {
              window.__APM__.recordSpan({
                name,
                spanId,
                duration,
                attributes: { ...sanitizedAttrs, ...sanitizedEndAttrs },
                timestamp: timestamp()
              });
            } catch (e) {
              // Silencioso - APM não deve quebrar a aplicação
            }
          }
          
          return { duration, sampled: shouldLog };
        }
      };
    }
  };
};

// ========================
// PREDEFINED SPANS
// ========================

/**
 * Spans pré-definidos para operações comuns
 */
export const spans = {
  /**
   * Span para carregamento de device
   * @param {number} deviceId - ID do device (não logar se sensível)
   */
  deviceLoad: (deviceId) => createSpan('device_load', { 
    deviceId: deviceId ? `device_${deviceId}` : 'unknown' 
  }),
  
  /**
   * Span para fetch de eventos
   */
  eventsFetch: (deviceId) => createSpan('events_fetch', { 
    deviceId: deviceId ? `device_${deviceId}` : 'unknown' 
  }),
  
  /**
   * Span para abertura de câmera
   */
  cameraOpen: (cameraType) => createSpan('camera_open', { 
    type: cameraType || 'unknown' 
  }),
  
  /**
   * Span para cleanup
   */
  cleanup: (reason) => createSpan('cleanup', { 
    reason: reason || 'unknown' 
  }),
  
  /**
   * Span para geração de PDF
   */
  pdfGenerate: () => createSpan('pdf_generate', {}),
  
  /**
   * Span para fetch de histórico
   */
  historyFetch: (deviceId) => createSpan('history_fetch', { 
    deviceId: deviceId ? `device_${deviceId}` : 'unknown' 
  })
};

// ========================
// SAFE SPAN HELPERS (fail-safe para produção)
// ========================

/**
 * Cria um span de forma segura, nunca quebra o runtime
 * @param {Function} spanFactory - Função do spans object (ex: spans.cleanup)
 * @param {any} param - Parâmetro para passar à factory
 * @returns {{ start: Function, end: Function }}
 */
export const safeSpan = (spanFactory, param) => {
  try {
    if (typeof spanFactory === 'function') {
      const span = spanFactory(param);
      // Verificar se span retornou objeto com start
      if (span && typeof span.start === 'function') {
        return span;
      }
    }
  } catch (e) {
    // Silenciar erros de observability em produção
    if (CONFIG.DEBUG) {
      console.debug(`${CONFIG.LOG_PREFIX} safeSpan error:`, e.message);
    }
  }
  // Retorna no-op span com start e end
  return { 
    start: () => ({ end: () => {} }),
    end: () => {} 
  };
};

/**
 * Inicia um span de forma segura
 * @param {Function} spanFactory - Função do spans object
 * @param {any} param - Parâmetro para passar à factory
 * @returns {{ end: Function }}
 */
export const safeSpanStart = (spanFactory, param) => {
  const span = safeSpan(spanFactory, param);
  try {
    return span.start();
  } catch (e) {
    return { end: () => {} };
  }
};

// ========================
// EXPOR GLOBALMENTE (apenas DEV)
// ========================

if (typeof window !== 'undefined' && isEnabled()) {
  window.__OBSERVABILITY__ = {
    getSnapshot: getResourceSnapshot,
    startMonitor: startResourceMonitor,
    stopMonitor: stopResourceMonitor,
    createSpan,
    spans,
    config: CONFIG,
    isEnabled: isEnabled()
  };
  
  // Log apenas em modo debug (não polui console normal)
  // console.debug(
  //   `${CONFIG.LOG_PREFIX} ✅ Observability disponível via window.__OBSERVABILITY__`
  // );
}

// ========================
// EXPORT
// ========================

export default {
  getResourceSnapshot,
  startResourceMonitor,
  stopResourceMonitor,
  createSpan,
  spans,
  safeSpan,
  safeSpanStart,
  isEnabled
};
