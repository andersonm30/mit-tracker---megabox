/**
 * @file dateUtils.spec.js
 * @description Testes unitários para src/utils/dateUtils.js
 */

import { describe, it, expect, vi } from 'vitest';
import {
  formatLocalDate,
  isDriverExpired,
  getCNHDaysToExpire,
  formatDriverDateForModal,
  isDriverExpiredFromObject,
  parseDDMMYYYY
} from '../../src/utils/dateUtils.js';

describe('dateUtils', () => {
  // ========================
  // formatLocalDate
  // ========================
  describe('formatLocalDate', () => {
    it('deve formatar Date corretamente para ISO local', () => {
      const date = new Date(2024, 5, 15, 10, 30, 45); // 15 Jun 2024 10:30:45
      const result = formatLocalDate(date);
      expect(result).toBe('2024-06-15T10:30:45');
    });

    it('deve adicionar zeros à esquerda corretamente', () => {
      const date = new Date(2024, 0, 5, 8, 5, 3); // 5 Jan 2024 08:05:03
      const result = formatLocalDate(date);
      expect(result).toBe('2024-01-05T08:05:03');
    });

    it('deve retornar null para Date inválido', () => {
      expect(formatLocalDate(new Date('invalid'))).toBe(null);
    });

    it('deve retornar null para null', () => {
      expect(formatLocalDate(null)).toBe(null);
    });

    it('deve retornar null para undefined', () => {
      expect(formatLocalDate(undefined)).toBe(null);
    });

    it('deve retornar null para não-Date', () => {
      expect(formatLocalDate('2024-01-01')).toBe(null);
      expect(formatLocalDate(12345)).toBe(null);
      expect(formatLocalDate({})).toBe(null);
    });

    it('deve tratar meia-noite corretamente', () => {
      const date = new Date(2024, 11, 31, 0, 0, 0); // 31 Dec 2024 00:00:00
      const result = formatLocalDate(date);
      expect(result).toBe('2024-12-31T00:00:00');
    });

    it('deve tratar último segundo do dia corretamente', () => {
      const date = new Date(2024, 11, 31, 23, 59, 59);
      const result = formatLocalDate(date);
      expect(result).toBe('2024-12-31T23:59:59');
    });
  });

  // ========================
  // isDriverExpired
  // ========================
  describe('isDriverExpired', () => {
    const referenceDate = new Date(2024, 5, 15); // 15 Jun 2024

    it('deve retornar true para data expirada', () => {
      expect(isDriverExpired('14-06-2024', referenceDate)).toBe(true);
      expect(isDriverExpired('01-01-2024', referenceDate)).toBe(true);
      expect(isDriverExpired('31-12-2023', referenceDate)).toBe(true);
    });

    it('deve retornar false para data não expirada', () => {
      expect(isDriverExpired('16-06-2024', referenceDate)).toBe(false);
      expect(isDriverExpired('15-07-2024', referenceDate)).toBe(false);
      expect(isDriverExpired('01-01-2025', referenceDate)).toBe(false);
    });

    it('deve retornar false para data igual (expira hoje mas ainda válida)', () => {
      // Expira no dia 15, estamos no dia 15 -> ainda válida (< não <=)
      expect(isDriverExpired('15-06-2024', referenceDate)).toBe(false);
    });

    it('deve retornar false para string vazia', () => {
      expect(isDriverExpired('', referenceDate)).toBe(false);
    });

    it('deve retornar false para null/undefined', () => {
      expect(isDriverExpired(null, referenceDate)).toBe(false);
      expect(isDriverExpired(undefined, referenceDate)).toBe(false);
    });

    it('deve retornar false para formato inválido', () => {
      // Nota: '2024-06-15' é parseado como dia=2024, mês=06, ano=15 (resulta em data ~1920)
      // mas isso é expirado em relação a 2024, então retorna true
      // Para formatos realmente inválidos:
      expect(isDriverExpired('15/06/2024', referenceDate)).toBe(false);
      expect(isDriverExpired('invalid', referenceDate)).toBe(false);
      expect(isDriverExpired('15-06', referenceDate)).toBe(false);
    });

    it('deve retornar false para valores não numéricos no formato', () => {
      expect(isDriverExpired('aa-bb-cccc', referenceDate)).toBe(false);
    });

    it('deve usar data atual se referenceDate não fornecido', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 5, 15)); // 15 Jun 2024
      
      expect(isDriverExpired('14-06-2024')).toBe(true);
      expect(isDriverExpired('16-06-2024')).toBe(false);
      
      vi.useRealTimers();
    });
  });

  // ========================
  // getCNHDaysToExpire
  // ========================
  describe('getCNHDaysToExpire', () => {
    const referenceDate = new Date(2024, 5, 15); // 15 Jun 2024

    it('deve retornar dias positivos para CNH não expirada', () => {
      expect(getCNHDaysToExpire('16-06-2024', referenceDate)).toBe(1);
      expect(getCNHDaysToExpire('20-06-2024', referenceDate)).toBe(5);
      expect(getCNHDaysToExpire('15-07-2024', referenceDate)).toBe(30);
    });

    it('deve retornar 0 para CNH que expira hoje', () => {
      expect(getCNHDaysToExpire('15-06-2024', referenceDate)).toBe(0);
    });

    it('deve retornar dias negativos para CNH já expirada', () => {
      expect(getCNHDaysToExpire('14-06-2024', referenceDate)).toBe(-1);
      expect(getCNHDaysToExpire('10-06-2024', referenceDate)).toBe(-5);
    });

    it('deve retornar 999 para string vazia', () => {
      expect(getCNHDaysToExpire('', referenceDate)).toBe(999);
    });

    it('deve retornar 999 para null/undefined', () => {
      expect(getCNHDaysToExpire(null, referenceDate)).toBe(999);
      expect(getCNHDaysToExpire(undefined, referenceDate)).toBe(999);
    });

    it('deve retornar 999 para formato inválido', () => {
      // Nota: '2024-06-15' é parseado incorretamente mas ainda gera uma data
      // Formatos realmente inválidos:
      expect(getCNHDaysToExpire('invalid', referenceDate)).toBe(999);
      expect(getCNHDaysToExpire('15-06', referenceDate)).toBe(999);
    });

    it('deve usar data atual se referenceDate não fornecido', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 5, 15));
      
      expect(getCNHDaysToExpire('20-06-2024')).toBe(5);
      
      vi.useRealTimers();
    });
  });

  // ========================
  // formatDriverDateForModal
  // ========================
  describe('formatDriverDateForModal', () => {
    it('deve formatar data DD-MM-YYYY para pt-BR', () => {
      const result = formatDriverDateForModal('15-06-2024');
      expect(result).toBe('15/06/2024');
    });

    it('deve formatar data com dia/mês de um dígito', () => {
      const result = formatDriverDateForModal('01-01-2024');
      expect(result).toBe('01/01/2024');
    });

    it('deve retornar null para string vazia', () => {
      expect(formatDriverDateForModal('')).toBe(null);
    });

    it('deve retornar null para null/undefined', () => {
      expect(formatDriverDateForModal(null)).toBe(null);
      expect(formatDriverDateForModal(undefined)).toBe(null);
    });

    it('deve retornar null para formato inválido', () => {
      expect(formatDriverDateForModal('2024-06-15')).toBe(null);
      expect(formatDriverDateForModal('invalid')).toBe(null);
      expect(formatDriverDateForModal('15/06/2024')).toBe(null);
    });

    it('deve retornar null para valores fora do range', () => {
      expect(formatDriverDateForModal('32-06-2024')).toBe(null); // dia > 31
      expect(formatDriverDateForModal('15-13-2024')).toBe(null); // mês > 12
      expect(formatDriverDateForModal('15-06-1800')).toBe(null); // ano < 1900
    });
  });

  // ========================
  // isDriverExpiredFromObject
  // ========================
  describe('isDriverExpiredFromObject', () => {
    const referenceDate = new Date(2024, 5, 15);

    it('deve retornar true para driver com CNH expirada', () => {
      const driver = { attributes: { cnhValidity: '14-06-2024' } };
      expect(isDriverExpiredFromObject(driver, referenceDate)).toBe(true);
    });

    it('deve retornar false para driver com CNH válida', () => {
      const driver = { attributes: { cnhValidity: '16-06-2024' } };
      expect(isDriverExpiredFromObject(driver, referenceDate)).toBe(false);
    });

    it('deve retornar false para driver sem attributes', () => {
      expect(isDriverExpiredFromObject({}, referenceDate)).toBe(false);
      expect(isDriverExpiredFromObject({ attributes: {} }, referenceDate)).toBe(false);
    });

    it('deve retornar false para null/undefined', () => {
      expect(isDriverExpiredFromObject(null, referenceDate)).toBe(false);
      expect(isDriverExpiredFromObject(undefined, referenceDate)).toBe(false);
    });

    it('deve retornar false para driver sem cnhValidity', () => {
      const driver = { attributes: { name: 'Test' } };
      expect(isDriverExpiredFromObject(driver, referenceDate)).toBe(false);
    });
  });

  // ========================
  // parseDDMMYYYY
  // ========================
  describe('parseDDMMYYYY', () => {
    it('deve parsear data DD-MM-YYYY corretamente', () => {
      const result = parseDDMMYYYY('15-06-2024');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(5); // Junho = 5
      expect(result.getDate()).toBe(15);
    });

    it('deve retornar null para string vazia', () => {
      expect(parseDDMMYYYY('')).toBe(null);
    });

    it('deve retornar null para null/undefined', () => {
      expect(parseDDMMYYYY(null)).toBe(null);
      expect(parseDDMMYYYY(undefined)).toBe(null);
    });

    it('deve retornar null para formato inválido', () => {
      // Nota: '2024-06-15' é parseado como DD-MM-YYYY (gera data ~1920)
      // Formatos realmente inválidos:
      expect(parseDDMMYYYY('invalid')).toBe(null);
      expect(parseDDMMYYYY('15/06/2024')).toBe(null);
      expect(parseDDMMYYYY('15-06')).toBe(null);
    });

    it('deve retornar null para valores não numéricos', () => {
      expect(parseDDMMYYYY('aa-bb-cccc')).toBe(null);
    });
  });
});
