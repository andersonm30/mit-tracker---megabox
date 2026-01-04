/**
 * @file guards.spec.js
 * @description Testes unitários para src/utils/guards.js
 */

import { describe, it, expect } from 'vitest';
import {
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
} from '../../src/utils/guards.js';

describe('guards', () => {
  // ========================
  // isValidCoords
  // ========================
  describe('isValidCoords', () => {
    it('deve retornar true para coordenadas válidas', () => {
      expect(isValidCoords(-23.5505, -46.6333)).toBe(true); // São Paulo
      expect(isValidCoords(40.7128, -74.006)).toBe(true);   // New York
      expect(isValidCoords(90, 180)).toBe(true);            // Polo Norte, antimeridiano
      expect(isValidCoords(-90, -180)).toBe(true);          // Polo Sul, antimeridiano
    });

    it('deve retornar false para latitude fora do range', () => {
      expect(isValidCoords(91, 0)).toBe(false);
      expect(isValidCoords(-91, 0)).toBe(false);
    });

    it('deve retornar false para longitude fora do range', () => {
      expect(isValidCoords(0, 181)).toBe(false);
      expect(isValidCoords(0, -181)).toBe(false);
    });

    it('deve retornar false para (0, 0) - GPS inválido comum', () => {
      expect(isValidCoords(0, 0)).toBe(false);
    });

    it('deve retornar false para não números', () => {
      expect(isValidCoords('lat', 'lon')).toBe(false);
      expect(isValidCoords(null, null)).toBe(false);
      expect(isValidCoords(undefined, undefined)).toBe(false);
    });

    it('deve retornar false para NaN', () => {
      expect(isValidCoords(NaN, 0)).toBe(false);
      expect(isValidCoords(0, NaN)).toBe(false);
    });
  });

  // ========================
  // safeNumber
  // ========================
  describe('safeNumber', () => {
    it('deve retornar número para valor numérico', () => {
      expect(safeNumber(42)).toBe(42);
      expect(safeNumber(3.14)).toBe(3.14);
      expect(safeNumber(-100)).toBe(-100);
    });

    it('deve converter string numérica', () => {
      expect(safeNumber('42')).toBe(42);
      expect(safeNumber('3.14')).toBe(3.14);
    });

    it('deve retornar default para null/undefined', () => {
      expect(safeNumber(null)).toBe(0);
      expect(safeNumber(undefined)).toBe(0);
      expect(safeNumber(null, 99)).toBe(99);
    });

    it('deve retornar default para string não numérica', () => {
      expect(safeNumber('abc')).toBe(0);
      expect(safeNumber('abc', 42)).toBe(42);
    });

    it('deve retornar default para NaN', () => {
      expect(safeNumber(NaN)).toBe(0);
    });

    it('deve aceitar zero como valor válido', () => {
      expect(safeNumber(0)).toBe(0);
      expect(safeNumber('0')).toBe(0);
    });
  });

  // ========================
  // safeInt
  // ========================
  describe('safeInt', () => {
    it('deve retornar inteiro para valor inteiro', () => {
      expect(safeInt(42)).toBe(42);
      expect(safeInt(-100)).toBe(-100);
    });

    it('deve truncar decimais', () => {
      expect(safeInt(3.14)).toBe(3);
      expect(safeInt(3.99)).toBe(3);
      expect(safeInt(-3.99)).toBe(-3);
    });

    it('deve converter string numérica', () => {
      expect(safeInt('42')).toBe(42);
      expect(safeInt('3.99')).toBe(3);
    });

    it('deve retornar default para null/undefined', () => {
      expect(safeInt(null)).toBe(0);
      expect(safeInt(undefined, 10)).toBe(10);
    });
  });

  // ========================
  // safeFloat
  // ========================
  describe('safeFloat', () => {
    it('deve retornar float para valor numérico', () => {
      expect(safeFloat(3.14159)).toBe(3.14159);
      expect(safeFloat(42)).toBe(42);
    });

    it('deve converter string numérica', () => {
      expect(safeFloat('3.14')).toBe(3.14);
    });

    it('deve retornar default para inválidos', () => {
      expect(safeFloat(null)).toBe(0);
      expect(safeFloat('abc', 1.5)).toBe(1.5);
    });
  });

  // ========================
  // isNonEmptyString
  // ========================
  describe('isNonEmptyString', () => {
    it('deve retornar true para string não vazia', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('a')).toBe(true);
      expect(isNonEmptyString(' a ')).toBe(true);
    });

    it('deve retornar false para string vazia', () => {
      expect(isNonEmptyString('')).toBe(false);
    });

    it('deve retornar false para string só com espaços', () => {
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString('\t\n')).toBe(false);
    });

    it('deve retornar false para não strings', () => {
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString([])).toBe(false);
    });
  });

  // ========================
  // isNonEmptyArray
  // ========================
  describe('isNonEmptyArray', () => {
    it('deve retornar true para array não vazio', () => {
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
      expect(isNonEmptyArray([null])).toBe(true);
      expect(isNonEmptyArray([''])).toBe(true);
    });

    it('deve retornar false para array vazio', () => {
      expect(isNonEmptyArray([])).toBe(false);
    });

    it('deve retornar false para não arrays', () => {
      expect(isNonEmptyArray(null)).toBe(false);
      expect(isNonEmptyArray(undefined)).toBe(false);
      expect(isNonEmptyArray('string')).toBe(false);
      expect(isNonEmptyArray({ length: 1 })).toBe(false);
    });
  });

  // ========================
  // isObject
  // ========================
  describe('isObject', () => {
    it('deve retornar true para objetos', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject(new Date())).toBe(true);
    });

    it('deve retornar false para null', () => {
      expect(isObject(null)).toBe(false);
    });

    it('deve retornar false para arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it('deve retornar false para primitivos', () => {
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(true)).toBe(false);
      expect(isObject(undefined)).toBe(false);
    });
  });

  // ========================
  // clamp
  // ========================
  describe('clamp', () => {
    it('deve retornar valor quando dentro do range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('deve retornar min quando valor abaixo', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('deve retornar max quando valor acima', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('deve converter strings numéricas', () => {
      expect(clamp('5', 0, 10)).toBe(5);
    });

    it('deve usar min como default para inválidos', () => {
      expect(clamp(null, 0, 10)).toBe(0);
      expect(clamp('abc', 5, 10)).toBe(5);
    });
  });

  // ========================
  // isValidSpeed
  // ========================
  describe('isValidSpeed', () => {
    it('deve retornar true para velocidades válidas', () => {
      expect(isValidSpeed(0)).toBe(true);
      expect(isValidSpeed(100)).toBe(true);
      expect(isValidSpeed(500)).toBe(true);
    });

    it('deve retornar false para velocidades negativas', () => {
      expect(isValidSpeed(-1)).toBe(false);
    });

    it('deve retornar false para velocidades acima do máximo', () => {
      expect(isValidSpeed(501)).toBe(false);
      expect(isValidSpeed(1000)).toBe(false);
    });

    it('deve aceitar maxSpeed customizado', () => {
      expect(isValidSpeed(200, 150)).toBe(false);
      expect(isValidSpeed(200, 300)).toBe(true);
    });

    it('deve retornar false para inválidos', () => {
      expect(isValidSpeed(null)).toBe(false);
      expect(isValidSpeed('abc')).toBe(false);
    });
  });

  // ========================
  // isValidCourse
  // ========================
  describe('isValidCourse', () => {
    it('deve retornar true para curso válido (0-360)', () => {
      expect(isValidCourse(0)).toBe(true);
      expect(isValidCourse(180)).toBe(true);
      expect(isValidCourse(360)).toBe(true);
    });

    it('deve retornar false para curso fora do range', () => {
      expect(isValidCourse(-1)).toBe(false);
      expect(isValidCourse(361)).toBe(false);
    });

    it('deve retornar false para inválidos', () => {
      expect(isValidCourse(null)).toBe(false);
    });
  });

  // ========================
  // isValidAltitude
  // ========================
  describe('isValidAltitude', () => {
    it('deve retornar true para altitude válida', () => {
      expect(isValidAltitude(0)).toBe(true);
      expect(isValidAltitude(1000)).toBe(true);
      expect(isValidAltitude(-400)).toBe(true); // Mar Morto
    });

    it('deve retornar false para altitude fora do range', () => {
      expect(isValidAltitude(-501)).toBe(false);
      expect(isValidAltitude(50001)).toBe(false);
    });

    it('deve aceitar range customizado', () => {
      expect(isValidAltitude(-100, -200, 100)).toBe(true);
      expect(isValidAltitude(-100, 0, 100)).toBe(false);
    });
  });

  // ========================
  // ensure
  // ========================
  describe('ensure', () => {
    it('deve retornar valor original se não null/undefined', () => {
      expect(ensure(42, 0)).toBe(42);
      expect(ensure('hello', 'default')).toBe('hello');
      expect(ensure(false, true)).toBe(false);
      expect(ensure(0, 99)).toBe(0);
      expect(ensure('', 'default')).toBe('');
    });

    it('deve retornar fallback para null', () => {
      expect(ensure(null, 'fallback')).toBe('fallback');
    });

    it('deve retornar fallback para undefined', () => {
      expect(ensure(undefined, 'fallback')).toBe('fallback');
    });
  });

  // ========================
  // isValidDeviceId
  // ========================
  describe('isValidDeviceId', () => {
    it('deve retornar true para ID numérico positivo', () => {
      expect(isValidDeviceId(1)).toBe(true);
      expect(isValidDeviceId(12345)).toBe(true);
    });

    it('deve retornar false para ID numérico zero ou negativo', () => {
      expect(isValidDeviceId(0)).toBe(false);
      expect(isValidDeviceId(-1)).toBe(false);
    });

    it('deve retornar true para string não vazia', () => {
      expect(isValidDeviceId('abc123')).toBe(true);
      expect(isValidDeviceId('1')).toBe(true);
    });

    it('deve retornar false para string vazia', () => {
      expect(isValidDeviceId('')).toBe(false);
      expect(isValidDeviceId('   ')).toBe(false);
    });

    it('deve retornar false para null/undefined', () => {
      expect(isValidDeviceId(null)).toBe(false);
      expect(isValidDeviceId(undefined)).toBe(false);
    });

    it('deve retornar false para outros tipos', () => {
      expect(isValidDeviceId([])).toBe(false);
      expect(isValidDeviceId({})).toBe(false);
    });
  });
});
