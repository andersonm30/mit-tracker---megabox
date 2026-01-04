/**
 * sanitize.js
 * 
 * Utilitário para sanitização de texto/HTML
 * Previne XSS em tooltips, context menus e outras UIs dinâmicas
 * 
 * FASE E2.0: Segurança/Anti-Bug
 */

/**
 * Escapa caracteres HTML perigosos
 * @param {unknown} input - Qualquer valor
 * @returns {string} String escapada
 */
export function sanitizeText(input) {
  // null/undefined -> string vazia
  if (input === null || input === undefined) {
    return '';
  }
  
  // Cast para string
  const str = String(input);
  
  // Escape HTML entities
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitiza objeto device (nome, placa, etc)
 * @param {Object} device
 * @returns {Object} Device com campos sanitizados
 */
export function sanitizeDevice(device) {
  if (!device) return {};
  
  return {
    ...device,
    name: sanitizeText(device.name),
    uniqueId: sanitizeText(device.uniqueId)
  };
}

/**
 * Sanitiza endereço de position
 * @param {Object} position
 * @returns {string} Endereço sanitizado
 */
export function sanitizeAddress(position) {
  if (!position || !position.address) return '';
  return sanitizeText(position.address);
}

/**
 * Sanitiza nome de driver
 * @param {Object} driver
 * @returns {string} Nome sanitizado
 */
export function sanitizeDriverName(driver) {
  if (!driver || !driver.name) return '';
  return sanitizeText(driver.name);
}
