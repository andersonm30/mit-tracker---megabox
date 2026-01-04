// @ts-nocheck
/**
 * useRoutePlayback.ts
 * Composable puro para controle de playback de rotas (SEM Leaflet/DOM)
 * Extraído de kore-map.vue na FASE C1 (refatoração segura)
 * 
 * Regras:
 * - Zero dependências de Leaflet ou DOM
 * - Estado reativo puro (Vue Composition API)
 * - Callbacks para notificar mudanças (onTick, onStateChange)
 * - API clara: play/pause/stop/seek/setSpeed
 */

import { ref, computed } from 'vue';

/**
 * Constantes de playback
 */
export const PLAYBACK_SPEEDS = [1, 2, 4, 8, 16];
export const TIMELINE_WIDTH = 350; // pixels
export const BASE_DELAY_MS = 2500; // delay base entre pontos (será dividido pela velocidade)

/**
 * Tipos (JSDoc para compatibilidade com JavaScript)
 */

/**
 * @typedef {1|2|4|8|16} PlaybackSpeed
 */

/**
 * @typedef {Object} PlaybackState
 * @property {boolean} isPlaying
 * @property {boolean} isPaused
 * @property {number} currentIndex
 * @property {number} totalPoints
 * @property {PlaybackSpeed} speed
 * @property {number} progress
 * @property {number} timelinePosition
 */

/**
 * @typedef {Object} PlaybackCallbacks
 * @property {function(number): void} onTick
 * @property {function(PlaybackState): void} [onStateChange]
 * @property {function(): void} [onComplete]
 */

/**
 * @typedef {Object} RoutePlaybackOptions
 * @property {number} totalPoints
 * @property {PlaybackSpeed} [initialSpeed]
 * @property {PlaybackCallbacks} callbacks
 */

/**
 * Composable de playback de rotas (puro, sem side effects externos)
 * @param {RoutePlaybackOptions} options - Opções de configuração do playback
 * @returns {Object} API do playback
 */
export function useRoutePlayback(options) {
  // Estado reativo
  const isPlaying = ref(false); // true = reproduzindo rota progressiva
  const isPaused = ref(false); // true = pausado (mas mantém rota progressiva visível)
  const currentIndex = ref(0);
  const speed = ref(options.initialSpeed || 1);
  /** @type {import('vue').Ref<ReturnType<typeof setTimeout> | null>} */
  const timer = ref(null);
  const totalPoints = ref(options.totalPoints);

  // Callbacks
  const { onTick, onStateChange, onComplete } = options.callbacks;

  /**
   * Estado computado para exposição externa
   * @returns {import('vue').ComputedRef<PlaybackState>}
   */
  const state = computed(() => {
    const progress = totalPoints.value > 1 
      ? currentIndex.value / (totalPoints.value - 1) 
      : 0;
    
    return {
      isPlaying: isPlaying.value,
      isPaused: isPaused.value,
      currentIndex: currentIndex.value,
      totalPoints: totalPoints.value,
      speed: speed.value,
      progress,
      timelinePosition: progress * (TIMELINE_WIDTH - 20)
    };
  });

  /**
   * Notifica mudança de estado
   */
  const notifyStateChange = () => {
    if (onStateChange) {
      onStateChange(state.value);
    }
  };

  /**
   * Limpa timer se existir
   */
  const clearTimer = () => {
    if (timer.value) {
      clearTimeout(timer.value);
      timer.value = null;
    }
  };

  /**
   * Tick interno recursivo
   */
  const tick = () => {
    if (!isPlaying.value || currentIndex.value >= totalPoints.value - 1) {
      // Chegou ao fim
      pause();
      if (onComplete && currentIndex.value >= totalPoints.value - 1) {
        onComplete();
      }
      return;
    }

    // Avança índice
    currentIndex.value++;
    
    // Notifica kore-map.vue para atualizar marker/rota
    onTick(currentIndex.value);
    notifyStateChange();

    // Agenda próximo tick (delay inversamente proporcional à velocidade)
    const delay = BASE_DELAY_MS / speed.value;
    timer.value = setTimeout(tick, delay);
  };

  /**
   * Inicia/continua playback
   */
  const play = () => {
    if (totalPoints.value === 0) return;

    // Limpa timer anterior se existir
    clearTimer();

    isPlaying.value = true;
    isPaused.value = false;
    
    notifyStateChange();
    
    // Inicia loop recursivo
    const delay = BASE_DELAY_MS / speed.value;
    timer.value = setTimeout(tick, delay);
  };

  /**
   * Pausa playback (mantém estado visual)
   */
  const pause = () => {
    clearTimer();
    isPlaying.value = false;
    isPaused.value = true;
    notifyStateChange();
  };

  /**
   * Para playback e volta ao início
   */
  const stop = () => {
    clearTimer();
    isPlaying.value = false;
    isPaused.value = false;
    currentIndex.value = 0;
    
    // Notifica kore-map para limpar rota progressiva
    onTick(0);
    notifyStateChange();
  };

  /**
   * Reinicia playback do início
   */
  const restart = () => {
    currentIndex.value = 0;
    onTick(0);
    play();
  };

  /**
   * Seek para índice específico
   * @param index Índice do ponto (0 a totalPoints-1)
   */
  const seek = (index) => {
    const clampedIndex = Math.max(0, Math.min(totalPoints.value - 1, index));
    currentIndex.value = clampedIndex;
    onTick(clampedIndex);
    notifyStateChange();
  };

  /**
   * Seek por progresso (0-1)
   * @param progress Progresso normalizado (0 a 1)
   */
  const seekByProgress = (progress) => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const index = Math.round(clampedProgress * (totalPoints.value - 1));
    seek(index);
  };

  /**
   * Avança um ponto
   */
  const forward = () => {
    if (currentIndex.value < totalPoints.value - 1) {
      seek(currentIndex.value + 1);
    }
  };

  /**
   * Retrocede um ponto
   */
  const backward = () => {
    if (currentIndex.value > 0) {
      seek(currentIndex.value - 1);
    }
  };

  /**
   * Alterna entre velocidades disponíveis
   */
  const toggleSpeed = () => {
    const currentIdx = PLAYBACK_SPEEDS.indexOf(speed.value);
    const nextIdx = (currentIdx + 1) % PLAYBACK_SPEEDS.length;
    setSpeed(PLAYBACK_SPEEDS[nextIdx]);
  };

  /**
   * Define velocidade específica
   * @param {number} newSpeed - Nova velocidade (deve estar em PLAYBACK_SPEEDS)
   * @returns {void}
   */
  const setSpeed = (newSpeed) => {
    speed.value = newSpeed;
    
    // Se está reproduzindo, reinicia com nova velocidade
    if (isPlaying.value) {
      pause();
      play();
    } else {
      notifyStateChange();
    }
  };

  /**
   * Atualiza número total de pontos (quando rota muda)
   */
  const updateTotalPoints = (newTotal) => {
    totalPoints.value = newTotal;
    
    // Se índice atual é maior que novo total, ajusta
    if (currentIndex.value >= newTotal) {
      seek(Math.max(0, newTotal - 1));
    }
    
    notifyStateChange();
  };

  /**
   * Cleanup (deve ser chamado no onUnmounted do componente)
   */
  const cleanup = () => {
    clearTimer();
    isPlaying.value = false;
    isPaused.value = false;
  };

  return {
    // Estado reativo (readonly para evitar mutações externas)
    state,
    
    // Getters individuais (para backward compatibility)
    isPlaying: computed(() => isPlaying.value),
    isPaused: computed(() => isPaused.value),
    currentIndex: computed(() => currentIndex.value),
    speed: computed(() => speed.value),
    progress: computed(() => state.value.progress),
    timelinePosition: computed(() => state.value.timelinePosition),
    
    // Ações
    play,
    pause,
    stop,
    restart,
    seek,
    seekByProgress,
    forward,
    backward,
    toggleSpeed,
    setSpeed,
    updateTotalPoints,
    cleanup
  };
}
