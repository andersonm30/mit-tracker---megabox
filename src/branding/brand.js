/**
 * BRAND CONFIGURATION - MIT.app
 * ========================================
 * Ponto central de configuração de branding.
 * Todas as referências de nome/paths devem usar estas constantes.
 * 
 * @module branding/brand
 * @version 1.0.0
 */

// ===== APP IDENTITY =====
export const APP_NAME = 'MIT.app';
export const APP_NAME_SHORT = 'mitapp';
export const APP_COMPANY = 'MIT.app';
export const APP_DOMAIN = 'mit.app';
export const APP_URL = 'https://mit.app';

// ===== ASSET PATHS =====
// Base path para assets (usar import.meta.env.BASE_URL em produção se necessário)
export const ASSET_BASE = '/mit/assets';

// Legacy path mantido para compatibilidade temporária durante migração
// NOTA: Remover após migração completa dos assets
export const LEGACY_ASSET_BASE = '/tarkan/assets';

// ===== ASSET SUBDIRECTORIES =====
export const ASSET_PATHS = {
  custom: `${ASSET_BASE}/custom`,
  images: `${ASSET_BASE}/images`,
  categories: `${ASSET_BASE}/images/categories`,
  icons: `${ASSET_BASE}/custom/icons`,
  sounds: `${ASSET_BASE}/sounds`,
};

// Legacy paths (temporário)
export const LEGACY_ASSET_PATHS = {
  custom: `${LEGACY_ASSET_BASE}/custom`,
  images: `${LEGACY_ASSET_BASE}/images`,
  categories: `${LEGACY_ASSET_BASE}/images/categories`,
  icons: `${LEGACY_ASSET_BASE}/custom/icons`,
};

// ===== DEFAULT ASSETS =====
export const DEFAULT_ASSETS = {
  logo: 'custom/logo.png',
  logoDark: 'custom/logo-dark.png',
  background: 'custom/bg.jpg',
  favicon: 'custom/icons/favicon-32x32.png',
  defaultVehicle: 'images/categories/default.png',
};

// ===== LOCALSTORAGE KEYS =====
// Novos keys usam prefixo MIT, mantemos compat com antigos
export const STORAGE_KEYS = {
  sessionToken: 'MITSESSIONTOKEN',
  legacySessionToken: 'TKSESSIONTOKEN', // Mantido para compat
  darkMode: 'darkMode',
  rememberMe: 'rememberme',
  mapPref: 'mapPref',
  query: 'query',
};

// ===== BRANDING DEFAULTS =====
export const BRANDING_DEFAULTS = {
  title: APP_NAME,
  subtitle: 'Sistema de Rastreamento',
  footerText: `© ${new Date().getFullYear()} ${APP_COMPANY}`,
  forgotPasswordUrl: `${APP_URL}/recuperar-senha`,
};

// ===== FEATURE FLAGS =====
export const FEATURES = {
  useLegacyAssets: false, // FASE 6: Migração completa para /mit/assets
  showPoweredBy: false, // Mostrar "Powered by MIT.app" no rodapé
};

export default {
  APP_NAME,
  APP_NAME_SHORT,
  APP_COMPANY,
  APP_DOMAIN,
  APP_URL,
  ASSET_BASE,
  LEGACY_ASSET_BASE,
  ASSET_PATHS,
  LEGACY_ASSET_PATHS,
  DEFAULT_ASSETS,
  STORAGE_KEYS,
  BRANDING_DEFAULTS,
  FEATURES,
};
