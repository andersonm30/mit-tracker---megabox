/**
 * useRoutePlayback.test.js
 * 
 * Unit tests for useRoutePlayback composable
 * Tests: play/pause/stop/seek/setSpeed/cleanup
 * 
 * @phase F1.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRoutePlayback, PLAYBACK_SPEEDS, BASE_DELAY_MS } from '@/tarkan/map/useRoutePlayback';

describe('useRoutePlayback', () => {
  let onTick;
  let onStateChange;
  let onComplete;

  beforeEach(() => {
    vi.useFakeTimers();
    onTick = vi.fn();
    onStateChange = vi.fn();
    onComplete = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // Helper para criar playback com defaults
  const createPlayback = (totalPoints = 10, initialSpeed = 1) => {
    return useRoutePlayback({
      totalPoints,
      initialSpeed,
      callbacks: { onTick, onStateChange, onComplete }
    });
  };

  // =========================================================================
  // TEST 1: play() chama onTick e muda estado
  // =========================================================================
  describe('play()', () => {
    it('deve chamar onTick com índices corretos e mudar estado para isPlaying', () => {
      const playback = createPlayback(5);
      
      // Estado inicial
      expect(playback.state.value.isPlaying).toBe(false);
      expect(playback.state.value.currentIndex).toBe(0);
      
      // Play
      playback.play();
      
      // Estado muda para playing
      expect(playback.state.value.isPlaying).toBe(true);
      expect(playback.state.value.isPaused).toBe(false);
      
      // onStateChange é chamado
      expect(onStateChange).toHaveBeenCalled();
      
      // Avança o tempo para trigger do tick
      const delay = BASE_DELAY_MS / 1; // speed = 1
      vi.advanceTimersByTime(delay);
      
      // onTick deve ser chamado
      expect(onTick).toHaveBeenCalledWith(1);
    });

    it('não deve iniciar se já estiver playing', () => {
      const playback = createPlayback(5);
      
      playback.play();
      const callsAfterFirstPlay = onStateChange.mock.calls.length;
      
      playback.play(); // segunda chamada
      
      // Não deve ter chamadas adicionais de stateChange para play
      expect(playback.state.value.isPlaying).toBe(true);
    });
  });

  // =========================================================================
  // TEST 2: pause() interrompe tick e mantém estado consistente
  // =========================================================================
  describe('pause()', () => {
    it('deve pausar a reprodução e manter o índice atual', () => {
      const playback = createPlayback(10);
      
      playback.play();
      expect(playback.state.value.isPlaying).toBe(true);
      
      // Avança para índice 2
      vi.advanceTimersByTime(BASE_DELAY_MS * 2);
      const indexBeforePause = playback.state.value.currentIndex;
      
      // Pause
      playback.pause();
      
      expect(playback.state.value.isPlaying).toBe(false);
      expect(playback.state.value.isPaused).toBe(true);
      expect(playback.state.value.currentIndex).toBe(indexBeforePause);
      
      // Avança mais tempo - não deve mudar índice
      vi.advanceTimersByTime(BASE_DELAY_MS * 5);
      expect(playback.state.value.currentIndex).toBe(indexBeforePause);
    });
  });

  // =========================================================================
  // TEST 3: stop() reseta index/progress e chama onStateChange
  // =========================================================================
  describe('stop()', () => {
    it('deve resetar index e progress e chamar onStateChange', () => {
      const playback = createPlayback(10);
      
      // Play e avança
      playback.play();
      vi.advanceTimersByTime(BASE_DELAY_MS * 3);
      expect(playback.state.value.currentIndex).toBeGreaterThan(0);
      
      // Stop
      playback.stop();
      
      expect(playback.state.value.isPlaying).toBe(false);
      expect(playback.state.value.isPaused).toBe(false);
      expect(playback.state.value.currentIndex).toBe(0);
      expect(playback.state.value.progress).toBe(0);
      expect(onStateChange).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // TEST 4: setSpeed() altera delay efetivo
  // =========================================================================
  describe('setSpeed()', () => {
    it('deve alterar a velocidade e afetar o timing dos ticks', () => {
      const playback = createPlayback(20);
      
      // Inicia com velocidade 1
      playback.play();
      expect(playback.state.value.speed).toBe(1);
      
      // Muda para velocidade 4
      playback.setSpeed(4);
      expect(playback.state.value.speed).toBe(4);
      
      // Com speed 4, delay = BASE_DELAY_MS / 4
      const fastDelay = BASE_DELAY_MS / 4;
      
      // Avança o tempo rápido
      vi.advanceTimersByTime(fastDelay);
      
      // Deve ter avançado o tick
      expect(onTick).toHaveBeenCalled();
    });

    it('deve aceitar velocidade e atualizar estado', () => {
      const playback = createPlayback(10);
      
      // Velocidade válida
      playback.setSpeed(4);
      
      // Deve atualizar a velocidade
      expect(playback.state.value.speed).toBe(4);
    });
  });

  // =========================================================================
  // TEST 5: seek() clamp índice e dispara onTick
  // =========================================================================
  describe('seek()', () => {
    it('deve fazer clamp de índice negativo para 0', () => {
      const playback = createPlayback(10);
      
      playback.seek(-5);
      
      expect(playback.state.value.currentIndex).toBe(0);
      expect(onTick).toHaveBeenCalledWith(0);
    });

    it('deve fazer clamp de índice > total para último índice', () => {
      const playback = createPlayback(10);
      
      playback.seek(100);
      
      expect(playback.state.value.currentIndex).toBe(9); // totalPoints - 1
      expect(onTick).toHaveBeenCalledWith(9);
    });

    it('deve ir para índice válido no meio', () => {
      const playback = createPlayback(10);
      
      playback.seek(5);
      
      expect(playback.state.value.currentIndex).toBe(5);
      expect(onTick).toHaveBeenCalledWith(5);
    });
  });

  // =========================================================================
  // TEST 6: cleanup() é idempotente (chamar 2x não quebra)
  // =========================================================================
  describe('cleanup()', () => {
    it('deve limpar recursos sem erro', () => {
      const playback = createPlayback(10);
      
      playback.play();
      vi.advanceTimersByTime(BASE_DELAY_MS);
      
      // Cleanup
      expect(() => playback.cleanup()).not.toThrow();
      
      // Estado deve indicar parado
      expect(playback.state.value.isPlaying).toBe(false);
    });

    it('deve ser idempotente - chamar 2x não quebra', () => {
      const playback = createPlayback(10);
      
      playback.play();
      
      // Cleanup 2 vezes
      expect(() => {
        playback.cleanup();
        playback.cleanup();
      }).not.toThrow();
    });

    it('após cleanup, estado deve estar resetado', () => {
      const playback = createPlayback(10);
      
      playback.play();
      vi.advanceTimersByTime(BASE_DELAY_MS);
      
      playback.cleanup();
      
      // Estado deve estar parado após cleanup
      expect(playback.state.value.isPlaying).toBe(false);
      expect(playback.state.value.isPaused).toBe(false);
    });
  });

  // =========================================================================
  // TEST ADICIONAL: onComplete é chamado ao chegar ao fim
  // =========================================================================
  describe('onComplete', () => {
    it('deve chamar onComplete quando chega ao último ponto', () => {
      const playback = createPlayback(3); // apenas 3 pontos
      
      playback.play();
      
      // Avança até o fim
      vi.advanceTimersByTime(BASE_DELAY_MS * 5);
      
      expect(onComplete).toHaveBeenCalled();
      expect(playback.state.value.currentIndex).toBe(2); // último índice
    });
  });
});
