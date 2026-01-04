/**
 * @file attributeUtils.spec.js
 * @description Testes unitários para src/utils/attributeUtils.js
 */

import { describe, it, expect } from 'vitest';
import {
  getNestedValue,
  findAttribute,
  hasAttribute,
  findAttributes,
  extractFlatAttributes
} from '../../src/utils/attributeUtils.js';

describe('attributeUtils', () => {
  // ========================
  // getNestedValue
  // ========================
  describe('getNestedValue', () => {
    const testObj = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3
        }
      },
      zero: 0,
      empty: '',
      falsyValue: false
    };

    it('deve obter valor de primeiro nível', () => {
      expect(getNestedValue(testObj, 'a')).toBe(1);
    });

    it('deve obter valor de segundo nível', () => {
      expect(getNestedValue(testObj, 'b.c')).toBe(2);
    });

    it('deve obter valor de terceiro nível', () => {
      expect(getNestedValue(testObj, 'b.d.e')).toBe(3);
    });

    it('deve retornar null para caminho inexistente', () => {
      expect(getNestedValue(testObj, 'x')).toBe(null);
      expect(getNestedValue(testObj, 'b.x')).toBe(null);
      expect(getNestedValue(testObj, 'b.d.x')).toBe(null);
    });

    it('deve retornar valores falsy corretamente (não null)', () => {
      expect(getNestedValue(testObj, 'zero')).toBe(0);
      expect(getNestedValue(testObj, 'empty')).toBe('');
      expect(getNestedValue(testObj, 'falsyValue')).toBe(false);
    });

    it('deve retornar null para objeto null/undefined', () => {
      expect(getNestedValue(null, 'a')).toBe(null);
      expect(getNestedValue(undefined, 'a')).toBe(null);
    });

    it('deve retornar null para path null/undefined', () => {
      expect(getNestedValue(testObj, null)).toBe(null);
      expect(getNestedValue(testObj, undefined)).toBe(null);
    });

    it('deve retornar null para path não string', () => {
      expect(getNestedValue(testObj, 123)).toBe(null);
      expect(getNestedValue(testObj, [])).toBe(null);
    });
  });

  // ========================
  // findAttribute
  // ========================
  describe('findAttribute', () => {
    const position = {
      speed: 50,
      latitude: -23.5,
      longitude: -46.6,
      attributes: {
        fuel: 75.5,
        temperature: 22.3,
        driver: {
          name: 'João',
          id: 123
        },
        zero: 0,
        empty: '',
        falsyValue: false
      }
    };

    it('deve encontrar atributo direto em attributes', () => {
      expect(findAttribute(position, 'fuel')).toBe(75.5);
      expect(findAttribute(position, 'temperature')).toBe(22.3);
    });

    it('deve encontrar atributo direto em position', () => {
      expect(findAttribute(position, 'speed')).toBe(50);
      expect(findAttribute(position, 'latitude')).toBe(-23.5);
    });

    it('deve encontrar atributo aninhado em attributes', () => {
      expect(findAttribute(position, 'driver.name')).toBe('João');
      expect(findAttribute(position, 'driver.id')).toBe(123);
    });

    it('deve encontrar atributo com path completo', () => {
      expect(findAttribute(position, 'attributes.fuel')).toBe(75.5);
    });

    it('deve retornar valores falsy corretamente', () => {
      expect(findAttribute(position, 'zero')).toBe(0);
      expect(findAttribute(position, 'empty')).toBe('');
      expect(findAttribute(position, 'falsyValue')).toBe(false);
    });

    it('deve retornar null para atributo inexistente', () => {
      expect(findAttribute(position, 'nonexistent')).toBe(null);
      expect(findAttribute(position, 'driver.nonexistent')).toBe(null);
    });

    it('deve retornar null para position null/undefined', () => {
      expect(findAttribute(null, 'speed')).toBe(null);
      expect(findAttribute(undefined, 'speed')).toBe(null);
    });

    it('deve retornar null para attributePath null/undefined', () => {
      expect(findAttribute(position, null)).toBe(null);
      expect(findAttribute(position, undefined)).toBe(null);
    });

    it('deve funcionar com position sem attributes', () => {
      const simplePosition = { speed: 100, latitude: -20 };
      expect(findAttribute(simplePosition, 'speed')).toBe(100);
      expect(findAttribute(simplePosition, 'fuel')).toBe(null);
    });
  });

  // ========================
  // hasAttribute
  // ========================
  describe('hasAttribute', () => {
    const position = {
      speed: 50,
      attributes: {
        fuel: 75.5,
        nullValue: null,
        zero: 0
      }
    };

    it('deve retornar true para atributo existente', () => {
      expect(hasAttribute(position, 'speed')).toBe(true);
      expect(hasAttribute(position, 'fuel')).toBe(true);
    });

    it('deve retornar true para valor zero', () => {
      expect(hasAttribute(position, 'zero')).toBe(true);
    });

    it('deve retornar false para atributo null', () => {
      expect(hasAttribute(position, 'nullValue')).toBe(false);
    });

    it('deve retornar false para atributo inexistente', () => {
      expect(hasAttribute(position, 'nonexistent')).toBe(false);
    });
  });

  // ========================
  // findAttributes
  // ========================
  describe('findAttributes', () => {
    const position = {
      speed: 50,
      latitude: -23.5,
      attributes: {
        fuel: 75.5,
        temperature: 22.3
      }
    };

    it('deve retornar múltiplos atributos encontrados', () => {
      const result = findAttributes(position, ['speed', 'fuel', 'temperature']);
      expect(result).toEqual({
        speed: 50,
        fuel: 75.5,
        temperature: 22.3
      });
    });

    it('deve omitir atributos não encontrados', () => {
      const result = findAttributes(position, ['speed', 'nonexistent', 'fuel']);
      expect(result).toEqual({
        speed: 50,
        fuel: 75.5
      });
      expect(result.nonexistent).toBeUndefined();
    });

    it('deve retornar objeto vazio para array vazio', () => {
      expect(findAttributes(position, [])).toEqual({});
    });

    it('deve retornar objeto vazio para position null', () => {
      expect(findAttributes(null, ['speed'])).toEqual({});
    });

    it('deve retornar objeto vazio para paths não array', () => {
      expect(findAttributes(position, 'speed')).toEqual({});
    });
  });

  // ========================
  // extractFlatAttributes
  // ========================
  describe('extractFlatAttributes', () => {
    it('deve extrair todos os atributos flat', () => {
      const position = {
        attributes: {
          fuel: 75.5,
          temperature: 22.3,
          rpm: 3000
        }
      };
      const result = extractFlatAttributes(position);
      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ name: 'fuel', value: 75.5 });
      expect(result).toContainEqual({ name: 'temperature', value: 22.3 });
      expect(result).toContainEqual({ name: 'rpm', value: 3000 });
    });

    it('deve omitir valores null/undefined', () => {
      const position = {
        attributes: {
          fuel: 75.5,
          nullValue: null,
          undefinedValue: undefined,
          validValue: 100
        }
      };
      const result = extractFlatAttributes(position);
      expect(result).toHaveLength(2);
      expect(result.find(a => a.name === 'nullValue')).toBeUndefined();
    });

    it('deve incluir valores zero e string vazia', () => {
      const position = {
        attributes: {
          zero: 0,
          empty: ''
        }
      };
      const result = extractFlatAttributes(position);
      expect(result).toContainEqual({ name: 'zero', value: 0 });
      expect(result).toContainEqual({ name: 'empty', value: '' });
    });

    it('deve retornar array vazio para position sem attributes', () => {
      expect(extractFlatAttributes({})).toEqual([]);
      expect(extractFlatAttributes({ speed: 50 })).toEqual([]);
    });

    it('deve retornar array vazio para position null/undefined', () => {
      expect(extractFlatAttributes(null)).toEqual([]);
      expect(extractFlatAttributes(undefined)).toEqual([]);
    });
  });
});
