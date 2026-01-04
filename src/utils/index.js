/**
 * @file index.js
 * @description Barrel export for all utility functions
 * 
 * Import usage:
 * import { formatLocalDate, isDriverExpired, findAttribute, safeNumber } from '@/utils'
 */

// Date utilities
export {
  formatLocalDate,
  isDriverExpired,
  getCNHDaysToExpire,
  formatDriverDateForModal,
  isDriverExpiredFromObject,
  parseDDMMYYYY
} from './dateUtils.js';

// Attribute utilities
export {
  getNestedValue,
  findAttribute,
  hasAttribute,
  findAttributes,
  extractFlatAttributes
} from './attributeUtils.js';

// Guards and validation utilities
export {
  isValidCoords,
  safeNumber,
  safeInt,
  safeFloat,
  isNonEmptyString,
  isNonEmptyArray,
  isObject,
  clamp,
  isValidSpeed,
  isValidCourse,
  isValidAltitude,
  ensure,
  isValidDeviceId
} from './guards.js';

// Timer registry
export {
  setSafeTimeout,
  setSafeInterval,
  clearSafeTimeout,
  clearSafeInterval,
  clearAllTimers,
  getActiveTimerCount
} from './timerRegistry.js';

// Observability
export {
  getResourceSnapshot,
  startResourceMonitor,
  stopResourceMonitor,
  createSpan,
  spans
} from './observability.js';
