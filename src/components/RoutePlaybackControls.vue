<template>
  <!--
    RoutePlaybackControls.vue
    Barra de controles de reprodução de rota (FASE 5 + FASE 6)
    
    Componente puramente de UI + orquestração via inject/store.
    NÃO gerencia estado de play - apenas dispara ações no kore-map.
    
    FASE 6: Scrub interativo na barra de progresso
  -->
  <div 
    class="playback-controls"
    :class="{ 'playback-disabled': !hasRoute, 'playback-playing': isPlaying, 'playback-scrubbing': isScrubbing }"
  >
    <!-- Barra de Progresso Visual - FASE 6: Agora interativa, FASE 7: Com marcadores de eventos -->
    <div 
      ref="progressBarRef"
      class="progress-bar-container"
      :class="{ 'progress-bar-interactive': hasRoute }"
      @mousedown="onScrubStart"
      @touchstart.prevent="onScrubStart"
    >
      <!-- Barra de preenchimento -->
      <div 
        class="progress-bar-fill" 
        :style="{ width: displayPercent + '%' }"
      ></div>
      
      <!-- FASE 7: Marcadores de eventos na barra -->
      <div 
        v-for="(ep, idx) in eventPositions" 
        :key="`event-${idx}`"
        class="event-marker"
        :class="[`event-marker-${ep.event.type}`]"
        :style="{ left: ep.percent + '%', '--event-color': ep.event.color }"
        :title="ep.event.label"
        @click.stop="onEventClick(ep.event)"
      >
        <i :class="ep.event.icon"></i>
      </div>
      
      <!-- Thumb/Indicador arrastável -->
      <div 
        v-if="hasRoute"
        class="progress-bar-thumb"
        :style="{ left: displayPercent + '%' }"
        :class="{ 'thumb-active': isScrubbing }"
      ></div>
      
      <!-- Tooltip com índice durante scrub -->
      <div 
        v-if="isScrubbing"
        class="scrub-tooltip"
        :style="{ left: scrubPercent + '%' }"
      >
        {{ scrubIndex + 1 }}
      </div>
    </div>

    <!-- Controles Principais -->
    <div class="controls-row">
      <!-- Indicador de Progresso -->
      <div class="progress-indicator">
        <span class="current-point">{{ currentPoint }}</span>
        <span class="separator">/</span>
        <span class="total-points">{{ totalPoints }}</span>
      </div>

      <!-- Botões de Controle -->
      <div class="control-buttons">
        <!-- Voltar 5 pontos -->
        <button 
          class="control-btn" 
          :disabled="!hasRoute"
          :title="$t('playback.backward') || 'Voltar 5 pontos'"
          @click="skipBackward"
        >
          <i class="fas fa-backward"></i>
        </button>

        <!-- Play / Pause -->
        <button 
          class="control-btn control-btn-primary" 
          :disabled="!hasRoute"
          :title="isPlaying ? ($t('playback.pause') || 'Pausar') : ($t('playback.play') || 'Reproduzir')"
          @click="togglePlay"
        >
          <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
        </button>

        <!-- Avançar 5 pontos -->
        <button 
          class="control-btn" 
          :disabled="!hasRoute"
          :title="$t('playback.forward') || 'Avançar 5 pontos'"
          @click="skipForward"
        >
          <i class="fas fa-forward"></i>
        </button>
      </div>

      <!-- Controles Secundários -->
      <div class="secondary-controls">
        <!-- Velocidade -->
        <button 
          class="control-btn speed-btn" 
          :disabled="!hasRoute"
          :title="'Velocidade: ' + currentSpeed + 'x'"
          @click="cycleSpeed"
        >
          {{ currentSpeed }}x
        </button>

        <!-- Follow Mode -->
        <button 
          class="control-btn follow-btn" 
          :class="{ 'follow-active': followEnabled }"
          :disabled="!hasRoute"
          :title="followEnabled ? 'Seguindo veículo' : 'Seguir veículo'"
          @click="toggleFollow"
        >
          <i class="fas fa-crosshairs"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { calculateEventPositions } from '@/utils/routeEventDetector';

// Props
const props = defineProps({
  totalPoints: {
    type: Number,
    default: 0
  },
  points: {
    type: Array,
    default: () => []
  },
  // FASE 7: Eventos detectados na rota
  events: {
    type: Array,
    default: () => []
  }
});

// Store
const store = useStore();

// Injects do kore-map.vue
const isPlayingRoute = inject('isPlayingRoute', ref(false));
const followPlay = inject('followPlay', ref(true));
const setFollowPlay = inject('setFollowPlay', null);
const previewRoutePoint = inject('previewRoutePoint', null);

// Funções de controle injetadas do kore-map
const runPlayRouteFn = inject('runPlayRoute', null);
const pausePlayRouteFn = inject('pausePlayRoute', null);
const setPlaybackSpeedFn = inject('setPlaybackSpeed', null);
const playbackSpeedRef = inject('playbackSpeed', ref(1));

// Estado local - Velocidades alinhadas com kore-map.vue
const SPEED_OPTIONS = [1, 2, 4, 8, 16];

// Persistência do follow mode
const FOLLOW_STORAGE_KEY = 'kore-follow-play';

// ============================================================================
// FASE 6: SCRUB STATE
// ============================================================================
const progressBarRef = ref(null);
const isScrubbing = ref(false);
const scrubPercent = ref(0);
const scrubIndex = ref(0);
const wasPlayingBeforeScrub = ref(false);

onMounted(() => {
  // Restaurar follow mode do localStorage
  const savedFollow = localStorage.getItem(FOLLOW_STORAGE_KEY);
  if (savedFollow !== null && setFollowPlay) {
    setFollowPlay(savedFollow === 'true');
  }
});

// Cleanup de event listeners globais
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onScrubMove);
  document.removeEventListener('mouseup', onScrubEnd);
  document.removeEventListener('touchmove', onScrubMove);
  document.removeEventListener('touchend', onScrubEnd);
});

// Computed
const hasRoute = computed(() => props.totalPoints > 0);

const isPlaying = computed(() => isPlayingRoute?.value ?? false);

const currentPoint = computed(() => {
  return (store.state.devices?.routePlayPoint ?? 0) + 1; // 1-indexed para UI
});

const progressPercent = computed(() => {
  if (props.totalPoints <= 1) return 0;
  const current = store.state.devices?.routePlayPoint ?? 0;
  return (current / (props.totalPoints - 1)) * 100;
});

// FASE 6: Percentual exibido (usa scrub durante arraste, senão usa progressPercent)
const displayPercent = computed(() => {
  return isScrubbing.value ? scrubPercent.value : progressPercent.value;
});

const currentSpeed = computed(() => {
  return playbackSpeedRef?.value ?? 1;
});

const followEnabled = computed(() => followPlay?.value ?? true);

// ============================================================================
// FASE 7: EVENTOS NA BARRA DE PROGRESSO
// ============================================================================

/**
 * Calcula posições percentuais dos eventos para exibição na barra
 */
const eventPositions = computed(() => {
  if (!props.events.length || props.totalPoints <= 1) {
    return [];
  }
  return calculateEventPositions(props.events, props.totalPoints);
});

/**
 * Handler de clique em um marcador de evento
 * Faz seek direto para o índice do evento
 */
const onEventClick = (event) => {
  if (!event || typeof event.index !== 'number') return;
  
  // Pausar se estiver tocando
  if (isPlaying.value) {
    pausePlayRouteFn?.();
  }
  
  // Atualizar store
  store.commit('devices/setRoutePlayPoint', event.index);
  
  // Preview no mapa
  if (previewRoutePoint && props.points[event.index]) {
    previewRoutePoint({ point: props.points[event.index], index: event.index });
  }
  
  // Emitir seek para sincronizar lista
  emit('seek', event.index);
};

// ============================================================================
// FASE 6: SCRUB HANDLERS
// ============================================================================

/**
 * Calcula o índice baseado na posição X do evento
 * @param {MouseEvent|TouchEvent} event
 * @returns {{ percent: number, index: number }}
 */
const calculateScrubPosition = (event) => {
  if (!progressBarRef.value || props.totalPoints <= 1) {
    return { percent: 0, index: 0 };
  }
  
  const rect = progressBarRef.value.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  
  // Calcular percentual (clamped 0-100)
  const rawPercent = ((clientX - rect.left) / rect.width) * 100;
  const percent = Math.max(0, Math.min(100, rawPercent));
  
  // Converter para índice (0 a totalPoints-1)
  const index = Math.round((percent / 100) * (props.totalPoints - 1));
  
  return { percent, index };
};

/**
 * Inicia o scrub (mousedown/touchstart na barra)
 */
const onScrubStart = (event) => {
  if (!hasRoute.value) return;
  
  // Salvar estado do play para restaurar depois
  wasPlayingBeforeScrub.value = isPlaying.value;
  
  // Pausar durante scrub para evitar conflito
  if (isPlaying.value) {
    pausePlayRouteFn?.();
  }
  
  isScrubbing.value = true;
  
  // Calcular posição inicial
  const { percent, index } = calculateScrubPosition(event);
  scrubPercent.value = percent;
  scrubIndex.value = index;
  
  // Preview imediato do ponto
  updateScrubPreview(index);
  
  // Adicionar listeners globais para movimento e soltar
  document.addEventListener('mousemove', onScrubMove);
  document.addEventListener('mouseup', onScrubEnd);
  document.addEventListener('touchmove', onScrubMove, { passive: false });
  document.addEventListener('touchend', onScrubEnd);
};

/**
 * Durante o arraste (mousemove/touchmove)
 */
const onScrubMove = (event) => {
  if (!isScrubbing.value) return;
  
  // Prevenir scroll durante touch
  if (event.cancelable) {
    event.preventDefault();
  }
  
  const { percent, index } = calculateScrubPosition(event);
  scrubPercent.value = percent;
  
  // Só atualizar preview se o índice mudou (otimização)
  if (index !== scrubIndex.value) {
    scrubIndex.value = index;
    updateScrubPreview(index);
  }
};

/**
 * Finaliza o scrub (mouseup/touchend)
 */
const onScrubEnd = () => {
  if (!isScrubbing.value) return;
  
  // Remover listeners globais
  document.removeEventListener('mousemove', onScrubMove);
  document.removeEventListener('mouseup', onScrubEnd);
  document.removeEventListener('touchmove', onScrubMove);
  document.removeEventListener('touchend', onScrubEnd);
  
  // Aplicar o índice final na store
  store.commit('devices/setRoutePlayPoint', scrubIndex.value);
  
  // Emitir seek para sincronizar lista
  emit('seek', scrubIndex.value);
  
  isScrubbing.value = false;
  
  // Retomar play se estava tocando antes
  if (wasPlayingBeforeScrub.value) {
    runPlayRouteFn?.();
  }
};

/**
 * Atualiza preview do ponto durante scrub
 * Chama a mesma função usada pelo seek da lista
 */
const updateScrubPreview = (index) => {
  if (previewRoutePoint && props.points[index]) {
    previewRoutePoint({ point: props.points[index], index });
  }
  
  // Atualizar store para sincronizar UI (lista, etc.)
  store.commit('devices/setRoutePlayPoint', index);
};

// ============================================================================
// HANDLERS ORIGINAIS (Play, Skip, Speed, Follow)
// ============================================================================

// Handlers
const togglePlay = () => {
  if (isPlaying.value) {
    pausePlayRouteFn?.();
  } else {
    runPlayRouteFn?.();
  }
};

const skipBackward = () => {
  if (!hasRoute.value) return;
  
  const current = store.state.devices?.routePlayPoint ?? 0;
  const newIndex = Math.max(0, current - 5);
  
  // Atualizar store
  store.commit('devices/setRoutePlayPoint', newIndex);
  
  // Chamar preview no mapa se temos o ponto
  if (previewRoutePoint && props.points[newIndex]) {
    previewRoutePoint({ point: props.points[newIndex], index: newIndex });
  }
  
  emit('seek', newIndex);
};

const skipForward = () => {
  if (!hasRoute.value) return;
  
  const current = store.state.devices?.routePlayPoint ?? 0;
  const newIndex = Math.min(props.totalPoints - 1, current + 5);
  
  store.commit('devices/setRoutePlayPoint', newIndex);
  
  // Chamar preview no mapa se temos o ponto
  if (previewRoutePoint && props.points[newIndex]) {
    previewRoutePoint({ point: props.points[newIndex], index: newIndex });
  }
  
  emit('seek', newIndex);
};

const cycleSpeed = () => {
  // Encontrar próxima velocidade no ciclo
  const currentIdx = SPEED_OPTIONS.indexOf(playbackSpeedRef?.value ?? 1);
  const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length;
  const newSpeed = SPEED_OPTIONS[nextIdx];
  
  if (setPlaybackSpeedFn) {
    setPlaybackSpeedFn(newSpeed);
  }
  
  emit('speedChange', newSpeed);
};

const toggleFollow = () => {
  const newValue = !followEnabled.value;
  
  if (setFollowPlay) {
    setFollowPlay(newValue);
  }
  
  // Persistir no localStorage
  localStorage.setItem(FOLLOW_STORAGE_KEY, String(newValue));
};

// Emits
const emit = defineEmits(['seek', 'speedChange']);
</script>

<style scoped>
.playback-controls {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
  transition: opacity 0.2s, box-shadow 0.2s;
}

.playback-controls:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.playback-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.playback-playing {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
}

/* Barra de Progresso */
.progress-bar-container {
  height: 3px;
  background: var(--el-fill-color-light);
  width: 100%;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: var(--el-color-primary);
  transition: width 0.15s ease-out;
  pointer-events: none;
}

/* ============================================================================
   FASE 6: Estilos de Scrub/Interatividade na Barra de Progresso
   ============================================================================ */

/* Barra interativa (quando tem rota) */
.progress-bar-interactive {
  cursor: pointer;
  height: 8px;
  margin: -2px 0;
  transition: height 0.15s ease;
}

.progress-bar-interactive:hover {
  height: 12px;
  margin: -4px 0;
}

/* Durante scrub ativo */
.playback-scrubbing .progress-bar-container {
  height: 12px;
  margin: -4px 0;
}

/* Thumb/Indicador arrastável */
.progress-bar-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: var(--el-color-primary);
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.15s, transform 0.1s;
  pointer-events: none;
  z-index: 2;
}

.progress-bar-container:hover .progress-bar-thumb,
.thumb-active {
  opacity: 1;
}

.thumb-active {
  transform: translate(-50%, -50%) scale(1.2);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

/* Tooltip durante scrub */
.scrub-tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  transform: translateX(-50%);
  background: var(--el-color-primary);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.scrub-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--el-color-primary);
}

/* Controles */
.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  gap: 12px;
}

/* Indicador de Progresso */
.progress-indicator {
  font-size: 12px;
  font-family: 'Roboto Mono', monospace;
  color: var(--el-text-color-regular);
  min-width: 80px;
}

.current-point {
  color: var(--el-color-primary);
  font-weight: 600;
}

.separator {
  margin: 0 2px;
  color: var(--el-text-color-secondary);
}

.total-points {
  color: var(--el-text-color-secondary);
}

/* Botões */
.control-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 12px;
}

.control-btn:hover:not(:disabled) {
  background: var(--el-fill-color);
  color: var(--el-color-primary);
}

.control-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-btn-primary {
  width: 40px;
  height: 40px;
  background: var(--el-color-primary);
  color: white;
  font-size: 14px;
}

.control-btn-primary:hover:not(:disabled) {
  background: var(--el-color-primary-dark-2);
  color: white;
}

/* Controles Secundários */
.secondary-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.speed-btn {
  width: auto;
  padding: 0 8px;
  font-weight: 600;
  font-size: 11px;
}

.follow-btn {
  position: relative;
}

.follow-btn.follow-active {
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
}

.follow-btn.follow-active::after {
  content: '';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  background: var(--el-color-success);
  border-radius: 50%;
}

/* ============================================================================
   FASE 7: Estilos dos Marcadores de Eventos na Barra
   ============================================================================ */

.event-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid var(--event-color, var(--el-color-primary));
  border-radius: 50%;
  cursor: pointer;
  z-index: 3;
  transition: transform 0.15s, box-shadow 0.15s;
  font-size: 8px;
  color: var(--event-color, var(--el-color-primary));
}

.event-marker:hover {
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  z-index: 5;
}

/* Estilos específicos por tipo de evento */
.event-marker-start {
  background: var(--el-color-success-light-9);
}

.event-marker-end {
  background: var(--el-color-danger-light-9);
}

.event-marker-stop {
  background: var(--el-color-warning-light-9);
}

.event-marker-speed {
  background: var(--el-color-danger-light-9);
}

/* Em telas pequenas, esconder ícones e mostrar só pontos */
@media (max-width: 480px) {
  .event-marker {
    width: 10px;
    height: 10px;
    font-size: 0; /* Esconde ícone */
  }
  
  .event-marker i {
    display: none;
  }
}

/* Responsivo */
@media (max-width: 480px) {
  .controls-row {
    padding: 6px 8px;
    gap: 8px;
  }
  
  .progress-indicator {
    font-size: 11px;
    min-width: 60px;
  }
  
  .control-btn {
    width: 28px;
    height: 28px;
  }
  
  .control-btn-primary {
    width: 36px;
    height: 36px;
  }
}
</style>
