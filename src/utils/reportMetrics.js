/**
 * reportMetrics.js
 * 
 * Utilitários para normalizar métricas de relatórios
 * Resolve bugs de unidade (ms vs s) e padroniza exports
 * 
 * PR#1 (P0): Implementação mínima para destravar bugs críticos
 */

export const toNumber = (v, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Normaliza duração para segundos.
 * Aceita:
 * - segundos (ex: 3600)
 * - milissegundos (ex: 3600000)
 * - string numérica
 *
 * Heurística segura:
 * - se for >= 1e6, é quase sempre ms (>= ~16min em ms).
 */
export const normalizeDurationSeconds = (value) => {
  const n = toNumber(value, 0)
  if (!n) return 0
  return n >= 1e6 ? Math.round(n / 1000) : Math.round(n)
}

export const formatDurationHhMm = (seconds) => {
  const s = Math.max(0, normalizeDurationSeconds(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Engine hours em horas, com normalização (ms/seconds).
 * Retorna número com 1 casa.
 */
export const formatEngineHours = (value) => {
  const s = normalizeDurationSeconds(value)
  const hours = s / 3600
  return Math.round(hours * 10) / 10
}

export const generateExportFilename = ({
  type,
  deviceName,
  from,
  to,
  ext,
}) => {
  const safe = (str) =>
    String(str || '')
      .trim()
      .replace(/[^\w\d-_]+/g, '_')
      .slice(0, 80)

  const d = (iso) => {
    if (!iso) return 'na'
    // pega YYYY-MM-DD se for ISO
    return String(iso).slice(0, 10)
  }

  return `Relatorio_${safe(type)}_${safe(deviceName)}_${d(from)}_a_${d(to)}.${ext}`
}

export default {
  toNumber,
  normalizeDurationSeconds,
  formatDurationHhMm,
  formatEngineHours,
  generateExportFilename
}
