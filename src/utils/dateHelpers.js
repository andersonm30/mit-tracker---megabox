// src/utils/dateHelpers.js

/**
 * Utilitários de data para corrigir problemas com DatePicker
 * -----------------------------------------------------
 * Problema: inputs nativos datetime-local rejeitam Date.toString()
 * Solução: normalizar sempre para formato ISO local "YYYY-MM-DDTHH:mm"
 */

/**
 * Converte Date ou string para formato aceito por input datetime-local
 * @param {Date|string} value - Data a ser convertida
 * @returns {string} Formato "YYYY-MM-DDTHH:mm" (sem timezone)
 */
export function toDatetimeLocal(value) {
  if (!value) return '';
  
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  
  const pad = (n) => String(n).padStart(2, '0');
  
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Converte Date ou string para ISO string
 * @param {Date|string} value - Data a ser convertida
 * @returns {string} ISO string
 */
export function toISOString(value) {
  if (!value) return '';
  
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  
  return d.toISOString();
}

/**
 * Converte array de datas [start, end] para ISO strings
 * @param {Array<Date|string>} dateRange - Range de datas
 * @returns {Array<string>} Array de ISO strings
 */
export function dateRangeToISO(dateRange) {
  if (!Array.isArray(dateRange) || dateRange.length !== 2) {
    return ['', ''];
  }
  
  return [toISOString(dateRange[0]), toISOString(dateRange[1])];
}
