/**
 * ASSET UTILITIES - MIT.app (JavaScript version)
 * ========================================
 * Versão JavaScript das funções de asset para uso em componentes Vue existentes.
 * 
 * @module branding/asset
 * @version 1.0.0
 */

// Configuração - FASE 6: Legacy desabilitado
const USE_LEGACY_ASSETS = false;
const ASSET_BASE = '/mit/assets';
const LEGACY_ASSET_BASE = '/tarkan/assets'; // Mantido apenas para referência

/**
 * Resolve um path de asset para a URL completa.
 * 
 * @param {string} path - Path relativo do asset
 * @param {boolean} [useLegacy] - Forçar uso do path legado
 * @returns {string} URL completa
 */
export function assetUrl(path, useLegacy) {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const shouldUseLegacy = useLegacy ?? USE_LEGACY_ASSETS;
  const base = shouldUseLegacy ? LEGACY_ASSET_BASE : ASSET_BASE;
  return `${base}/${cleanPath}`;
}

/**
 * URL para asset custom (logo, bg, etc)
 * @param {string} filename
 * @returns {string}
 */
export function customAssetUrl(filename) {
  return assetUrl(`custom/${filename}`);
}

/**
 * URL para imagem genérica
 * @param {string} path
 * @returns {string}
 */
export function imageAssetUrl(path) {
  return assetUrl(`images/${path}`);
}

/**
 * URL para imagem de categoria de veículo
 * @param {string} [category='default']
 * @returns {string}
 */
export function categoryImageUrl(category = 'default') {
  return imageAssetUrl(`categories/${category}.png`);
}

/**
 * URL para imagem de motorista
 * @param {number|string} driverId
 * @param {Object} [options]
 * @returns {string}
 */
export function driverImageUrl(driverId, options = {}) {
  const v = options.version || 0;
  return `${imageAssetUrl(`drivers/${driverId}.png`)}?v=${v}`;
}

/**
 * URL para imagem de motorista padrão
 * @returns {string}
 */
export function defaultDriverImageUrl() {
  return imageAssetUrl('drivers/default.png');
}

/**
 * URL para imagem de dispositivo com cache-busting
 * @param {number|string} deviceId
 * @param {Object} [options]
 * @returns {string}
 */
export function deviceImageUrl(deviceId, options = {}) {
  const ts = options.timestamp || Date.now();
  const v = options.imageVersion || 0;
  const d = options.driverUniqueId || '';
  const r = Math.random();
  return `${imageAssetUrl(`${deviceId}.png`)}?ts=${ts}&v=${v}&d=${d}&r=${r}&_=${Date.now()}`;
}

/**
 * URL para logo
 * @param {boolean} [isDark=false]
 * @returns {string}
 */
export function logoUrl(isDark = false) {
  return isDark ? customAssetUrl('logoDark.png') : customAssetUrl('logo.png');
}

/**
 * URL para logo branco
 * @returns {string}
 */
export function logoWhiteUrl() {
  return customAssetUrl('logoWhite.png');
}

/**
 * URL para background
 * @returns {string}
 */
export function backgroundUrl() {
  return customAssetUrl('bg.jpg');
}

/**
 * Gera handler de erro para fallback de imagem
 * @param {string} fallbackUrl
 * @returns {function}
 */
export function createImageErrorHandler(fallbackUrl) {
  return (event) => {
    event.target.onerror = null;
    event.target.src = fallbackUrl;
  };
}

export default {
  assetUrl,
  customAssetUrl,
  imageAssetUrl,
  categoryImageUrl,
  driverImageUrl,
  defaultDriverImageUrl,
  deviceImageUrl,
  logoUrl,
  logoWhiteUrl,
  backgroundUrl,
  createImageErrorHandler,
  // Constantes exportadas para uso direto
  ASSET_BASE,
  LEGACY_ASSET_BASE,
  USE_LEGACY_ASSETS,
};
