/**
 * routeTelemetry.js
 * 
 * FASE 10 — Telemetria DEV-only para Route Player
 * 
 * Instrumentação leve usando performance.mark/measure.
 * Só ativa em DEV quando window.DEBUG_ROUTE === true.
 * Resultados consolidados em window.__routeDebug.
 * 
 * ⚠️ REGRAS:
 * - Zero overhead em PROD
 * - Não altera lógica de negócio
 * - Não cria timers próprios
 * - Apenas mede o que já existe
 */

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Verifica se telemetria está ativa
 * @returns {boolean}
 */
const isActive = () => {
  if (!IS_DEV) return false;
  return typeof window !== 'undefined' && window.DEBUG_ROUTE === true;
};

/**
 * Inicializa estrutura de debug no window
 */
const ensureDebugStore = () => {
  if (typeof window === 'undefined') return;
  
  if (!window.__routeDebug) {
    window.__routeDebug = {
      measures: [],
      counters: {},
      lastMeasures: {},
      fpsHistory: [],
      startTime: Date.now(),
      version: '1.0.0'
    };
  }
};

// ============================================================================
// MEDIÇÃO DE TEMPO
// ============================================================================

/**
 * Inicia uma medição de tempo
 * @param {string} label - Identificador único da medição
 */
export const startMeasure = (label) => {
  if (!isActive()) return;
  
  try {
    performance.mark(`route:${label}:start`);
  } catch (e) {
    // Silently ignore in case performance API is not available
  }
};

/**
 * Finaliza uma medição de tempo e registra resultado
 * @param {string} label - Identificador único da medição
 * @param {Object} [meta] - Metadados adicionais (ex: { points: 5000 })
 * @returns {number|null} - Duração em ms ou null se inativo
 */
export const endMeasure = (label, meta = {}) => {
  if (!isActive()) return null;
  
  ensureDebugStore();
  
  try {
    const startMark = `route:${label}:start`;
    const endMark = `route:${label}:end`;
    const measureName = `route:${label}`;
    
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    const entries = performance.getEntriesByName(measureName);
    const lastEntry = entries[entries.length - 1];
    const duration = lastEntry?.duration ?? 0;
    
    // Limpar marks
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
    
    // Registrar
    const record = {
      label,
      duration: Math.round(duration * 100) / 100,
      timestamp: Date.now(),
      ...meta
    };
    
    window.__routeDebug.measures.push(record);
    window.__routeDebug.lastMeasures[label] = record;
    
    // Manter apenas últimas 100 medições
    if (window.__routeDebug.measures.length > 100) {
      window.__routeDebug.measures.shift();
    }
    
    // Log opcional
    if (window.DEBUG_ROUTE_VERBOSE) {
      console.log(`[Telemetry] ${label}: ${duration.toFixed(2)}ms`, meta);
    }
    
    return duration;
  } catch (e) {
    console.warn('[Telemetry] Error measuring:', label, e);
    return null;
  }
};

/**
 * Wrapper para medir uma função async
 * @param {string} label 
 * @param {Function} fn 
 * @param {Object} [meta]
 * @returns {Promise<any>}
 */
export const measureAsync = async (label, fn, meta = {}) => {
  startMeasure(label);
  try {
    const result = await fn();
    endMeasure(label, meta);
    return result;
  } catch (e) {
    endMeasure(label, { ...meta, error: true });
    throw e;
  }
};

/**
 * Wrapper para medir uma função síncrona
 * @param {string} label 
 * @param {Function} fn 
 * @param {Object} [meta]
 * @returns {any}
 */
export const measureSync = (label, fn, meta = {}) => {
  startMeasure(label);
  try {
    const result = fn();
    endMeasure(label, meta);
    return result;
  } catch (e) {
    endMeasure(label, { ...meta, error: true });
    throw e;
  }
};

// ============================================================================
// CONTADORES
// ============================================================================

/**
 * Incrementa um contador
 * @param {string} name 
 * @param {number} [amount=1]
 */
export const incrementCounter = (name, amount = 1) => {
  if (!isActive()) return;
  
  ensureDebugStore();
  
  if (!window.__routeDebug.counters[name]) {
    window.__routeDebug.counters[name] = 0;
  }
  window.__routeDebug.counters[name] += amount;
};

/**
 * Reseta um contador
 * @param {string} name 
 */
export const resetCounter = (name) => {
  if (!isActive()) return;
  
  ensureDebugStore();
  window.__routeDebug.counters[name] = 0;
};

// ============================================================================
// FPS TRACKING (para monitorar play)
// ============================================================================

let fpsFrameCount = 0;
let fpsLastTime = 0;
let fpsInterval = null;

/**
 * Inicia tracking de FPS
 */
export const startFpsTracking = () => {
  if (!isActive()) return;
  
  ensureDebugStore();
  fpsFrameCount = 0;
  fpsLastTime = performance.now();
  
  // Contar frames via requestAnimationFrame
  const countFrame = () => {
    fpsFrameCount++;
    if (isActive() && fpsInterval !== null) {
      requestAnimationFrame(countFrame);
    }
  };
  
  fpsInterval = setInterval(() => {
    const now = performance.now();
    const elapsed = now - fpsLastTime;
    const fps = Math.round((fpsFrameCount / elapsed) * 1000);
    
    window.__routeDebug.fpsHistory.push({
      fps,
      timestamp: Date.now()
    });
    
    // Manter apenas últimos 60 registros (1 min a 1/s)
    if (window.__routeDebug.fpsHistory.length > 60) {
      window.__routeDebug.fpsHistory.shift();
    }
    
    fpsFrameCount = 0;
    fpsLastTime = now;
  }, 1000);
  
  requestAnimationFrame(countFrame);
};

/**
 * Para tracking de FPS
 * @returns {Object} - Estatísticas de FPS
 */
export const stopFpsTracking = () => {
  if (fpsInterval) {
    clearInterval(fpsInterval);
    fpsInterval = null;
  }
  
  if (!isActive() || !window.__routeDebug?.fpsHistory?.length) {
    return { avg: 0, min: 0, max: 0 };
  }
  
  const history = window.__routeDebug.fpsHistory;
  const fps = history.map(h => h.fps);
  
  return {
    avg: Math.round(fps.reduce((a, b) => a + b, 0) / fps.length),
    min: Math.min(...fps),
    max: Math.max(...fps),
    samples: fps.length
  };
};

// ============================================================================
// SCRUB TRACKING
// ============================================================================

let scrubStartTime = null;

/**
 * Marca início de scrub
 */
export const startScrubTracking = () => {
  if (!isActive()) return;
  scrubStartTime = performance.now();
};

/**
 * Marca fim de scrub e registra
 * @param {Object} meta - { fromIndex, toIndex }
 */
export const endScrubTracking = (meta = {}) => {
  if (!isActive() || scrubStartTime === null) return null;
  
  ensureDebugStore();
  
  const duration = performance.now() - scrubStartTime;
  scrubStartTime = null;
  
  const record = {
    label: 'scrub',
    duration: Math.round(duration * 100) / 100,
    timestamp: Date.now(),
    ...meta
  };
  
  window.__routeDebug.measures.push(record);
  window.__routeDebug.lastMeasures['scrub'] = record;
  
  return duration;
};

// ============================================================================
// RELATÓRIOS
// ============================================================================

/**
 * Gera relatório de performance
 * @returns {Object}
 */
export const generateReport = () => {
  if (!isActive()) {
    return { error: 'Telemetry not active. Set window.DEBUG_ROUTE = true' };
  }
  
  ensureDebugStore();
  
  const { measures, counters, lastMeasures, fpsHistory, startTime } = window.__routeDebug;
  
  // Agrupar medições por label
  const byLabel = {};
  measures.forEach(m => {
    if (!byLabel[m.label]) {
      byLabel[m.label] = [];
    }
    byLabel[m.label].push(m.duration);
  });
  
  // Calcular estatísticas por label
  const stats = {};
  Object.entries(byLabel).forEach(([label, durations]) => {
    const sorted = durations.sort((a, b) => a - b);
    stats[label] = {
      count: durations.length,
      avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 100) / 100,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1]
    };
  });
  
  // FPS stats
  let fpsStats = null;
  if (fpsHistory.length > 0) {
    const fps = fpsHistory.map(h => h.fps);
    fpsStats = {
      avg: Math.round(fps.reduce((a, b) => a + b, 0) / fps.length),
      min: Math.min(...fps),
      max: Math.max(...fps)
    };
  }
  
  return {
    sessionDuration: Math.round((Date.now() - startTime) / 1000),
    stats,
    counters,
    lastMeasures,
    fpsStats,
    totalMeasures: measures.length
  };
};

/**
 * Imprime relatório no console
 */
export const printReport = () => {
  const report = generateReport();
  
  if (report.error) {
    console.warn(report.error);
    return;
  }
  
  console.group('📊 Route Player Telemetry Report');
  console.log('Session Duration:', report.sessionDuration, 'seconds');
  console.log('Total Measures:', report.totalMeasures);
  
  console.group('⏱️ Performance Stats');
  console.table(report.stats);
  console.groupEnd();
  
  console.group('🔢 Counters');
  console.table(report.counters);
  console.groupEnd();
  
  if (report.fpsStats) {
    console.group('🎮 FPS Stats');
    console.table(report.fpsStats);
    console.groupEnd();
  }
  
  console.group('📝 Last Measures');
  console.table(report.lastMeasures);
  console.groupEnd();
  
  console.groupEnd();
};

/**
 * Limpa todos os dados de telemetria
 */
export const clearTelemetry = () => {
  if (typeof window !== 'undefined') {
    window.__routeDebug = null;
  }
  ensureDebugStore();
};

// ============================================================================
// HELPERS PARA ATIVAR/DESATIVAR
// ============================================================================

/**
 * Ativa telemetria
 */
export const enableTelemetry = () => {
  if (typeof window !== 'undefined') {
    window.DEBUG_ROUTE = true;
    ensureDebugStore();
    console.log('🔍 Route Telemetry ENABLED');
    console.log('Commands: __routeDebug, printRouteReport()');
  }
};

/**
 * Desativa telemetria
 */
export const disableTelemetry = () => {
  if (typeof window !== 'undefined') {
    window.DEBUG_ROUTE = false;
    console.log('🔍 Route Telemetry DISABLED');
  }
};

// Expor helpers globais para console
if (typeof window !== 'undefined' && IS_DEV) {
  window.enableRouteDebug = enableTelemetry;
  window.disableRouteDebug = disableTelemetry;
  window.printRouteReport = printReport;
  window.clearRouteDebug = clearTelemetry;
}

export default {
  startMeasure,
  endMeasure,
  measureAsync,
  measureSync,
  incrementCounter,
  resetCounter,
  startFpsTracking,
  stopFpsTracking,
  startScrubTracking,
  endScrubTracking,
  generateReport,
  printReport,
  clearTelemetry,
  enableTelemetry,
  disableTelemetry,
  isActive
};
