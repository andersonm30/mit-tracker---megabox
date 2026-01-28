/**
 * BRANDING MODULE - MIT.app
 * ========================================
 * Exporta todas as funcionalidades de branding.
 * 
 * @module branding
 * @version 1.0.0
 */

// Re-exporta constantes de brand
export {
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
} from './brand.js';

// Re-exporta funções de asset
export {
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
} from './asset.js';

// Default export para conveniência
import brand from './brand.js';
import asset from './asset.js';

export default {
  ...brand,
  ...asset,
};
