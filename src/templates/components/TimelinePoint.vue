<template>
  <!--
    TimelinePoint.vue
    Componente unificado para pontos da timeline: start, middle, end.
    
    Props:
    - point: Object - dados do ponto (latitude, longitude, fixTime, address, speed, attributes, etc.)
    - index: Number - índice real do ponto na lista completa
    - type: String - 'start' | 'middle' | 'end'
    - isActive: Boolean - se é o ponto atualmente em reprodução
    - isVisited: Boolean - se já foi visitado durante reprodução
    - speedUnit: String - unidade de velocidade do servidor
    
    Eventos:
    - seek(index): Emitido ao clicar no ponto para pular/pré-visualizar
  -->
  <div 
    :id="elementId"
    class="timeline-point"
    :class="pointClasses"
    role="button"
    tabindex="0"
    @click="onSeek"
    @keydown.enter="onSeek"
    @keydown.space.prevent="onSeek"
  >
    <!-- Coluna: Data/Hora e linha visual -->
    <div class="timeline-time">
      <div class="timeline-line" :class="lineClass"></div>
      
      <!-- Ícone (start/end) ou dot (middle) -->
      <div v-if="type !== 'middle'" class="timeline-icon">
        <i class="fas fa-flag"></i>
      </div>
      <div 
        v-else 
        class="timeline-dot"
        :class="dotClasses"
      ></div>
      
      <!-- Data/Hora formatada -->
      <div class="timeline-date">
        {{ formattedDate }}<br>{{ formattedTime }}
      </div>
    </div>
    
    <!-- Coluna: Conteúdo (endereço + atributos) -->
    <div v-if="type === 'middle'" class="timeline-content-wrapper">
      <div class="timeline-address">
        <a 
          target="_blank" 
          class="timeline-link" 
          :href="googleMapsUrl"
        >
          {{ displayAddress }} <i class="fas fa-external-link-alt"></i>
        </a>
      </div>
      <!-- Atributos do ponto (ignição, bloqueio, etc.) -->
      <PointAttributes 
        v-if="point.attributes" 
        :attributes="point.attributes" 
      />
    </div>
    
    <!-- Endereço simples para start/end -->
    <div v-else class="timeline-address">
      {{ displayAddress }}
    </div>
    
    <!-- FASE 7: Badge de evento (parada, velocidade, etc.) -->
    <div 
      v-if="event" 
      class="timeline-event-badge"
      :style="{ '--event-color': event.color }"
      :title="event.label"
    >
      <i :class="event.icon"></i>
      <span class="event-label">{{ event.label }}</span>
    </div>
    
    <!-- FASE 8: Botão de Bookmark (Favorito) -->
    <button 
      class="timeline-bookmark-btn"
      :class="{ 'is-bookmarked': bookmarked }"
      :title="bookmarked ? 'Remover favorito' : 'Adicionar favorito'"
      @click.stop="onToggleBookmark"
    >
      <i :class="bookmarked ? 'fas fa-star' : 'far fa-star'"></i>
    </button>
    
    <!-- Coluna: Velocidade -->
    <div class="timeline-speed">
      <i class="fas fa-tachometer-alt"></i>
      {{ formattedSpeed }}
    </div>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue';
import PointAttributes from './PointAttributes.vue';

const props = defineProps({
  point: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    default: 'middle',
    validator: (v) => ['start', 'middle', 'end'].includes(v)
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isVisited: {
    type: Boolean,
    default: false
  },
  speedUnit: {
    type: String,
    default: 'speedUnit'
  },
  // FASE 7: Evento associado a este ponto (parada, velocidade, etc.)
  event: {
    type: Object,
    default: null
  },
  // FASE 8: Se o ponto está nos favoritos
  bookmarked: {
    type: Boolean,
    default: false
  }
});

// Acesso ao $t via proxy (compatível com legacy mode do vue3-i18n)
const { proxy } = getCurrentInstance();

// Emits para comunicação com componente pai
const emit = defineEmits(['seek', 'toggle-bookmark']);

// Handler de clique para seek/preview
const onSeek = () => {
  emit('seek', props.index);
};

// FASE 8: Handler para toggle de bookmark
const onToggleBookmark = () => {
  emit('toggle-bookmark', props.point, props.index);
};

// ID do elemento para ancoragem de scroll
const elementId = computed(() => `timeline-point-${props.index}`);

// Classes CSS dinâmicas do ponto
const pointClasses = computed(() => ({
  'timeline-point-start': props.type === 'start',
  'timeline-point-middle': props.type === 'middle',
  'timeline-point-end': props.type === 'end',
  'timeline-active': props.isActive,
  'is-visited': props.isVisited
}));

// Classe da linha vertical (depende do tipo)
const lineClass = computed(() => {
  if (props.type === 'start') return 'timeline-line-bottom';
  if (props.type === 'end') return 'timeline-line-top';
  return 'timeline-line-full';
});

// Classes do dot (apenas middle)
const dotClasses = computed(() => ({
  'timeline-dot-active': props.isActive,
  'timeline-dot-visited': props.isVisited
}));

// Data formatada (localização do browser)
const formattedDate = computed(() => {
  if (!props.point.fixTime) return '';
  return new Date(props.point.fixTime).toLocaleDateString();
});

// Hora formatada
const formattedTime = computed(() => {
  if (!props.point.fixTime) return '';
  return new Date(props.point.fixTime).toLocaleTimeString();
});

// Endereço ou coordenadas como fallback
const displayAddress = computed(() => {
  const p = props.point;
  return p.address || `${p.latitude},${p.longitude}`;
});

// URL do Google Maps
const googleMapsUrl = computed(() => {
  const p = props.point;
  return `https://maps.google.com/?q=${p.latitude},${p.longitude}`;
});

// Velocidade formatada com unidade (i18n)
const formattedSpeed = computed(() => {
  const speed = props.point.speed || 0;
  // Usa a chave de tradução com a unidade configurada
  return proxy.$t(`units.${props.speedUnit}`, { speed });
});
</script>

<style scoped>
/* FASE 13.5.1: Base CSS premium com GPU acceleration */
.timeline-point {
  display: flex;
  position: relative;
  border-bottom: var(--el-border-color-lighter) 1px dotted;
  cursor: pointer;
  user-select: none;
  
  /* GPU acceleration + will-change para suavidade máxima */
  will-change: transform, box-shadow, background-color;
  transform: translateZ(0);
  
  /* Transições premium com cubic-bezier (Material Design) */
  transition:
    background-color 200ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
    border-left-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* FASE 13.5.2: Hover premium (desktop only) - discreto, não compete com active */
.timeline-point:hover {
  background-color: rgba(255, 255, 255, 0.03);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

/* FASE 13.6.3: Active lock visual - NENHUM hover aplica quando ativo (hierarquia absoluta) */
.timeline-point.timeline-active:hover,
.timeline-point.timeline-active:focus,
.timeline-point.timeline-active:active {
  /* Forçar estilos do active sem variação alguma */
  background-color: rgba(255, 255, 255, 0.06) !important;
  border-left: 4px solid var(--el-color-primary) !important;
  transform: translateX(2px) translateZ(0) !important;
  box-shadow:
    inset 0 0 0 1px rgba(64, 158, 255, 0.15),
    0 6px 18px rgba(0, 0, 0, 0.35) !important;
  cursor: default; /* Não é clicável quando ativo */
}

/* FASE 13.5.2: Hover suave no visited (feedback discreto) */
.timeline-point.is-visited:hover {
  opacity: 0.65; /* Leve lift, mas ainda recuado */
  background-color: rgba(255, 255, 255, 0.02);
}

/* FASE 13.5.2: Mobile - desabilitar hover (apenas touch) */
@media (hover: none) {
  .timeline-point:hover {
    background-color: transparent;
    box-shadow: none;
  }
}

/* FASE 13.6.4: Reduced Motion (A11y) - respeitar preferência do usuário */
@media (prefers-reduced-motion: reduce) {
  .timeline-point,
  .timeline-dot,
  .timeline-link,
  .timeline-bookmark-btn {
    transition: none !important;
    animation: none !important;
  }
  
  /* Desabilitar pulse no dot ativo */
  .timeline-dot-active {
    animation: none !important;
  }
  
  /* Manter estilos visuais, apenas remover movimento */
  .timeline-point.timeline-active {
    /* Visual permanece (border, shadow), mas sem transform */
    transform: translateZ(0) !important;
  }
}

.timeline-point:focus {
  outline: 2px solid var(--el-color-primary-light-5);
  outline-offset: -2px;
}

.timeline-point:active {
  background-color: var(--el-fill-color-light);
}

.timeline-point-start,
.timeline-point-end {
  border-bottom: var(--el-border-color-light) 2px solid;
}

.timeline-point-end {
  border-bottom: none;
  border-top: var(--el-border-color-light) 2px solid;
}

.timeline-time {
  text-align: right;
  padding: 10px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  position: relative;
  min-width: 90px;
  width: 90px;
}

.timeline-line {
  position: absolute;
  border-right: var(--el-border-color) 1px dashed;
  width: 1px;
  right: 3px;
  transform: translate(-55%, 0);
}

.timeline-line-bottom {
  height: 55%;
  bottom: 0%;
}

.timeline-line-top {
  height: 55%;
  top: 0%;
}

.timeline-line-full {
  height: 100%;
  bottom: 0%;
}

.timeline-icon {
  position: absolute;
  width: 20px;
  height: 20px;
  font-size: 16px;
  text-align: center;
  right: -10px;
  top: 50%;
  border-radius: 50%;
  transform: translateY(-50%);
  color: var(--el-color-primary);
}

.timeline-dot {
  position: absolute;
  background: var(--el-color-primary);
  width: 10px;
  height: 10px;
  right: 0px;
  top: 50%;
  border-radius: 50%;
  transform: translateY(-50%);
  /* FASE 13.5.1: Transições premium com cubic-bezier */
  transition: 
    transform 220ms cubic-bezier(0.4, 0, 0.2, 1), 
    box-shadow 220ms cubic-bezier(0.4, 0, 0.2, 1), 
    background-color 220ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* FASE 13.5.1: Dot ativo MUITO evidente com pulse refinado */
.timeline-dot-active {
  background: var(--el-color-primary) !important;
  transform: translateY(-50%) scale(1.15);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.35);
  animation: timeline-pulse 2s ease-in-out infinite;
}

/* FASE 13.5.1: Visited mais discreto (não compete com ativo) */
.timeline-dot-visited {
  background: rgba(255, 255, 255, 0.35) !important;
  transform: translateY(-50%) scale(0.85);
  box-shadow: none;
}

.timeline-date {
  position: absolute;
  right: 15px;
  top: 50%;
  border-radius: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  font-size: 11px;
  line-height: 1.3;
}

.timeline-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 0;
}

.timeline-address {
  padding: 10px;
  font-size: 14px;
  flex: 1;
  color: var(--el-text-color-primary);
}

.timeline-point-middle .timeline-address {
  font-size: 13px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  padding: 0;
}

.timeline-link {
  text-decoration: none;
  color: var(--el-text-color-primary);
  /* FASE 13.3: Transição suave no link */
  transition: color 180ms ease, text-shadow 180ms ease;
}

/* FASE 13.3: Hover mais sutil e profissional */
.timeline-link:hover {
  color: var(--el-color-primary);
  text-shadow: 0 0 1px var(--el-color-primary-light-5);
}

.timeline-speed {
  padding: 10px;
  min-width: 90px;
  width: 90px;
  text-align: right;
  font-size: 12px;
  color: var(--el-text-color-regular);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
}

.timeline-speed i {
  font-size: 14px;
  color: var(--el-color-success);
}

/* ============================================================================
   FASE 7: Badge de Evento
   ============================================================================ */

.timeline-event-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--event-color, var(--el-color-primary));
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 10px;
  white-space: nowrap;
  margin-left: auto;
  margin-right: 8px;
  flex-shrink: 0;
}

.timeline-event-badge i {
  font-size: 10px;
}

.timeline-event-badge .event-label {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Em mobile, só mostra ícone */
@media (max-width: 480px) {
  .timeline-event-badge .event-label {
    display: none;
  }
  
  .timeline-event-badge {
    padding: 4px;
    border-radius: 50%;
  }
}

/* ============================================================================
   FASE 8: Botão de Bookmark
   ============================================================================ */

.timeline-bookmark-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  margin-right: 4px;
}

.timeline-bookmark-btn:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-warning);
  transform: scale(1.1);
}

.timeline-bookmark-btn.is-bookmarked {
  color: var(--el-color-warning);
}

.timeline-bookmark-btn.is-bookmarked:hover {
  color: var(--el-color-warning-dark-2);
}

/* FASE 13.5.1: Ponto ativo MUITO evidente ("gruda" no play) */
.timeline-active {
  background-color: rgba(255, 255, 255, 0.06);
  border-left: 4px solid var(--el-color-primary);
  transform: translateX(2px) translateZ(0);
  
  /* Profundidade premium: sombra dupla (inset + externa) */
  box-shadow:
    inset 0 0 0 1px rgba(64, 158, 255, 0.15),
    0 6px 18px rgba(0, 0, 0, 0.35);
}

/* FASE 13.5.1: Visited recuado e silencioso */
.is-visited {
  opacity: 0.55;
  background-color: transparent;
  box-shadow: none;
  transform: translateZ(0);
}

/* FASE 13.5.1: Conteúdo visited levemente apagado */
.is-visited .timeline-address,
.is-visited .timeline-date,
.is-visited .timeline-speed {
  color: var(--el-text-color-secondary);
  opacity: 0.85;
}

.is-visited .timeline-content-wrapper {
  opacity: 0.85;
}

/* FASE 13.5.1: Pulse refinado e elegante (calmo, respiração natural) */
@keyframes timeline-pulse {
  0% {
    transform: translateY(-50%) scale(1.05);
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.35);
  }
  50% {
    transform: translateY(-50%) scale(1.18);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
  }
  100% {
    transform: translateY(-50%) scale(1.05);
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.35);
  }
}
</style>
