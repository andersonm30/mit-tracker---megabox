/**
 * @file dateUtils.js
 * @description Funções puras para manipulação de datas - sem dependências de DOM, store ou window
 */

/**
 * Formata uma data para o formato ISO local (YYYY-MM-DDTHH:MM:SS)
 * @param {Date} date - Objeto Date a ser formatado
 * @returns {string|null} Data formatada ou null se inválida
 */
export const formatLocalDate = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }
  
  const pad = (num) => num.toString().padStart(2, '0');
  
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

/**
 * Verifica se uma data de CNH está expirada
 * @param {string} dateString - Data no formato DD-MM-YYYY
 * @param {Date} [referenceDate] - Data de referência para comparação (default: now)
 * @returns {boolean} True se expirada
 */
export const isDriverExpired = (dateString, referenceDate = new Date()) => {
  if (!dateString || typeof dateString !== 'string') return false;
  
  const parts = dateString.split('-');
  if (parts.length !== 3) return false;
  
  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return false;
  
  return date < referenceDate;
};

/**
 * Calcula quantos dias faltam para a CNH expirar
 * @param {string} dateString - Data no formato DD-MM-YYYY
 * @param {Date} [referenceDate] - Data de referência (default: now)
 * @returns {number} Dias até expiração (999 se inválido, negativo se já expirou)
 */
export const getCNHDaysToExpire = (dateString, referenceDate = new Date()) => {
  if (!dateString || typeof dateString !== 'string') return 999;
  
  const parts = dateString.split('-');
  if (parts.length !== 3) return 999;
  
  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return 999;
  
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return 999;
  
  // Normalizar ambas as datas para meia-noite para comparação de dias
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const normalizedRef = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  
  const diffTime = normalizedDate - normalizedRef;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Formata uma data de motorista para exibição no modal (formato brasileiro)
 * @param {string} dateString - Data no formato DD-MM-YYYY
 * @returns {string|null} Data formatada em pt-BR ou null se inválida
 */
export const formatDriverDateForModal = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;
  
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  // Validar range básico
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
    return null;
  }
  
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return null;
  
  return date.toLocaleDateString('pt-BR');
};

/**
 * Wrapper para verificar expiração de driver a partir do objeto driver
 * @param {Object} driver - Objeto driver com attributes.cnhValidity
 * @param {Date} [referenceDate] - Data de referência (default: now)
 * @returns {boolean} True se expirado
 */
export const isDriverExpiredFromObject = (driver, referenceDate = new Date()) => {
  if (!driver?.attributes?.cnhValidity) return false;
  return isDriverExpired(driver.attributes.cnhValidity, referenceDate);
};

/**
 * Parseia uma data no formato DD-MM-YYYY para objeto Date
 * @param {string} dateString - Data no formato DD-MM-YYYY
 * @returns {Date|null} Objeto Date ou null se inválido
 */
export const parseDDMMYYYY = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;
  
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return null;
  
  return date;
};
