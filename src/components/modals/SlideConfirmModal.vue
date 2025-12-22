<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="descId"
      tabindex="-1"
      @keydown.esc.stop="onCancel"
    >
      <div class="modal-content" ref="modalContent">
        <!-- Vehicle/Device Info Slot -->
        <div class="modal-vehicle-info">
          <slot name="device-info">
            <img
              :src="deviceImage"
              :alt="device?.name || 'Dispositivo'"
              @error="onImgError"
              class="modal-vehicle-img"
            />
            <div class="modal-vehicle-details">
              <h3>{{ device?.name }}</h3>
              <p v-if="device?.uniqueId"><strong>IMEI:</strong> {{ device.uniqueId }}</p>
              <p v-if="device?.attributes?.placa"><strong>Placa:</strong> {{ device.attributes.placa }}</p>
              <p>
                <strong>Status:</strong>
                <span :class="device?.status === 'online' ? 'status-online' : 'status-offline'">
                  {{ device?.status === 'online' ? 'Online' : 'Offline' }}
                </span>
              </p>
            </div>
          </slot>
        </div>

        <!-- Warning Box -->
        <div :id="descId" class="modal-warning" :class="theme">
          <slot name="warning">
            <i :class="iconClass" aria-hidden="true"></i>
            <h4 :id="titleId">{{ title }}</h4>
            <p>{{ description }}</p>
          </slot>
        </div>

        <!-- Slider Container -->
        <div class="slider-container">
          <p class="slider-label">{{ sliderLabel }}</p>
          <div
            ref="sliderTrack"
            class="slider-track"
            role="slider"
            tabindex="0"
            @keydown.stop="onSliderKeydown"
            :aria-label="sliderLabel"
            aria-orientation="horizontal"
            :aria-valuemin="0"
            :aria-valuemax="100"
            :aria-valuenow="Math.round(progress)"
            :aria-disabled="loading"
            :style="{ pointerEvents: loading ? 'none' : 'auto' }"
          >
            <div class="slider-fill" :class="theme" :style="{ width: progress + '%' }"></div>
            <div
              ref="sliderThumb"
              class="slider-thumb"
              :class="{ confirmed: isConfirmed }"
              :style="{ left: thumbPosition + 'px', background: isConfirmed ? themeColor : 'white' }"
              @pointerdown="onPointerDown"
            >
              <i :class="thumbIcon" aria-hidden="true"></i>
            </div>
            <span class="slider-text" :style="{ opacity: isConfirmed ? 0 : 1 }">{{ sliderText }}</span>
            <span v-if="isConfirmed" class="slider-confirmed" aria-live="polite">✓ Confirmado</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button class="btn-cancel" @click="onCancel" :disabled="loading">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

/**
 * SlideConfirmModal - Componente reutilizável para modais críticos com slide-to-confirm
 * 
 * Props:
 * - modelValue: boolean - controla visibilidade (v-model)
 * - type: 'block' | 'unlock' | 'anchor' | 'delete' - tipo do modal
 * - title: string - título do warning
 * - description: string - descrição do warning
 * - theme: 'danger' | 'success' | 'warning' - tema visual
 * - confirmLabel: string - texto do slider
 * - device: object - dados do dispositivo
 * - loading: boolean - estado de carregamento
 * 
 * Emits:
 * - update:modelValue - para v-model
 * - confirm - quando slider é confirmado
 * - cancel - quando usuário cancela
 */

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'block',
    validator: (v) => ['block', 'unlock', 'anchor', 'delete', 'anchor_enable', 'anchor_disable'].includes(v)
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    default: 'danger',
    validator: (v) => ['danger', 'success', 'warning'].includes(v)
  },
  confirmLabel: {
    type: String,
    default: ''
  },
  device: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  deviceImage: {
    type: String,
    default: '/img/veiculos/default.png'
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

/* ===========================
 *  CONSTANTS
 * =========================== */
const SLIDER_PADDING = 2
const DEFAULT_THUMB_WIDTH = 46

/* ===========================
 *  REFS
 * =========================== */
const modalContent = ref(null)
const sliderTrack = ref(null)
const sliderThumb = ref(null)

const progress = ref(0)
const thumbPosition = ref(SLIDER_PADDING)
const isConfirmed = ref(false)
const isDragging = ref(false)

/* ===========================
 *  COMPUTED
 * =========================== */
const titleId = computed(() => `modal-title-${props.type}`)
const descId = computed(() => `modal-desc-${props.type}`)

const iconClass = computed(() => {
  const icons = {
    block: 'fas fa-exclamation-triangle',
    unlock: 'fas fa-unlock',
    anchor: 'fas fa-anchor',
    anchor_enable: 'fas fa-anchor',
    anchor_disable: 'fas fa-anchor',
    delete: 'fas fa-trash'
  }
  return icons[props.type] || 'fas fa-exclamation-triangle'
})

const thumbIcon = computed(() => {
  const icons = {
    block: 'fas fa-lock',
    unlock: 'fas fa-unlock',
    anchor: 'fas fa-anchor',
    anchor_enable: 'fas fa-anchor',
    anchor_disable: 'fas fa-anchor',
    delete: 'fas fa-trash'
  }
  return icons[props.type] || 'fas fa-lock'
})

const themeColor = computed(() => {
  const colors = {
    danger: 'var(--el-color-danger)',
    success: 'var(--el-color-success)',
    warning: 'var(--el-color-warning)'
  }
  return colors[props.theme] || colors.danger
})

const sliderLabel = computed(() => {
  if (props.confirmLabel) return props.confirmLabel
  
  const labels = {
    block: 'Deslize para confirmar bloqueio',
    unlock: 'Deslize para confirmar desbloqueio',
    anchor: 'Deslize para confirmar',
    anchor_enable: 'Deslize para ativar',
    anchor_disable: 'Deslize para desativar',
    delete: 'Deslize para confirmar exclusão'
  }
  return labels[props.type] || 'Deslize para confirmar'
})

const sliderText = computed(() => {
  const texts = {
    block: '→ Deslize para Bloquear',
    unlock: '→ Deslize para Desbloquear',
    anchor: '→ Deslize para Confirmar',
    anchor_enable: '→ Ativar',
    anchor_disable: '→ Desativar',
    delete: '→ Deslize para Excluir'
  }
  return texts[props.type] || '→ Deslize para Confirmar'
})

/* ===========================
 *  SLIDER LOGIC
 * =========================== */
let cleanupFn = null

const resetSlider = () => {
  progress.value = 0
  thumbPosition.value = SLIDER_PADDING
  isConfirmed.value = false
  isDragging.value = false
}

const getTrackWidth = () => {
  return sliderTrack.value?.clientWidth || 300
}

const getThumbWidth = () => {
  return sliderThumb.value?.offsetWidth || DEFAULT_THUMB_WIDTH
}

const onPointerDown = (e) => {
  if (props.loading || isConfirmed.value) return
  
  e.preventDefault()
  isDragging.value = true
  
  const startX = e.clientX
  const startPos = thumbPosition.value
  const trackWidth = getTrackWidth()
  const thumbWidth = getThumbWidth()
  const maxPos = trackWidth - thumbWidth - SLIDER_PADDING

  const onPointerMove = (moveE) => {
    if (!isDragging.value) return
    
    const delta = moveE.clientX - startX
    let newPos = Math.max(SLIDER_PADDING, Math.min(maxPos, startPos + delta))
    
    thumbPosition.value = newPos
    progress.value = ((newPos - SLIDER_PADDING) / (maxPos - SLIDER_PADDING)) * 100

    // Check confirmation threshold (95%)
    if (progress.value >= 95 && !isConfirmed.value) {
      isConfirmed.value = true
      thumbPosition.value = maxPos
      progress.value = 100
      
      // Emit confirm
      emit('confirm')
    }
  }

  const onPointerUp = () => {
    if (!isDragging.value) return
    isDragging.value = false
    
    // Se não confirmou, volta ao início
    if (!isConfirmed.value) {
      thumbPosition.value = SLIDER_PADDING
      progress.value = 0
    }
    
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    document.removeEventListener('pointercancel', onPointerUp)
  }

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
  document.addEventListener('pointercancel', onPointerUp)

  cleanupFn = () => {
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    document.removeEventListener('pointercancel', onPointerUp)
  }
}

const onSliderKeydown = (e) => {
  if (props.loading || isConfirmed.value) return
  
  const trackWidth = getTrackWidth()
  const thumbWidth = getThumbWidth()
  const maxPos = trackWidth - thumbWidth - SLIDER_PADDING
  const step = (maxPos - SLIDER_PADDING) / 10

  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    e.preventDefault()
    const newPos = Math.min(maxPos, thumbPosition.value + step)
    thumbPosition.value = newPos
    progress.value = ((newPos - SLIDER_PADDING) / (maxPos - SLIDER_PADDING)) * 100
    
    if (progress.value >= 95) {
      isConfirmed.value = true
      thumbPosition.value = maxPos
      progress.value = 100
      emit('confirm')
    }
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    e.preventDefault()
    if (!isConfirmed.value) {
      const newPos = Math.max(SLIDER_PADDING, thumbPosition.value - step)
      thumbPosition.value = newPos
      progress.value = ((newPos - SLIDER_PADDING) / (maxPos - SLIDER_PADDING)) * 100
    }
  } else if (e.key === 'End') {
    e.preventDefault()
    if (!isConfirmed.value) {
      isConfirmed.value = true
      thumbPosition.value = maxPos
      progress.value = 100
      emit('confirm')
    }
  } else if (e.key === 'Home') {
    e.preventDefault()
    if (!isConfirmed.value) {
      thumbPosition.value = SLIDER_PADDING
      progress.value = 0
    }
  }
}

const onCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}

const onImgError = (e) => {
  e.target.src = '/img/veiculos/default.png'
}

/* ===========================
 *  WATCHERS
 * =========================== */
watch(() => props.modelValue, (open) => {
  if (open) {
    nextTick(() => {
      resetSlider()
      // Focus trap: foca no modal quando abre
      modalContent.value?.focus?.()
    })
  } else {
    cleanupFn?.()
    resetSlider()
  }
})

/* ===========================
 *  CLEANUP
 * =========================== */
onBeforeUnmount(() => {
  cleanupFn?.()
})

/* ===========================
 *  EXPOSE
 * =========================== */
defineExpose({
  reset: resetSlider
})
</script>

<style scoped>
/* Estilos herdados do App.vue - modal-overlay, modal-content, etc. são globais */
/* Apenas estilos específicos do componente aqui para evitar duplicação */

.modal-overlay {
  position: fixed;
  inset: 0;

  background: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(6px);

  z-index: var(--z-modal, 10000);

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
}

.modal-content {
  width: 420px;
  max-width: 96vw;

  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);

  color: #222;
  border-radius: var(--r-lg, 16px);
  padding: 18px;

  box-shadow: var(--shadow-lg, 0 20px 60px rgba(0, 0, 0, 0.28));
  animation: modalSlideIn 240ms var(--ease, cubic-bezier(.2, .8, .2, 1));
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-14px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Vehicle info */
.modal-vehicle-info {
  display: flex;
  gap: 14px;
  margin-bottom: 16px;
}

.modal-vehicle-img {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: var(--shadow-sm, 0 2px 10px rgba(0, 0, 0, 0.10));
}

.modal-vehicle-details {
  flex: 1;
}

.modal-vehicle-details h3 {
  margin: 0 0 6px;
  color: #1f2937;
  font-size: 18px;
  font-weight: 800;
}

.modal-vehicle-details p {
  margin: 4px 0;
  color: #4b5563;
  font-size: 13.5px;
}

.status-online {
  color: #16a34a;
  font-weight: 700;
}

.status-offline {
  color: #dc2626;
  font-weight: 700;
}

/* Warning boxes */
.modal-warning {
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.modal-warning h4 {
  margin: 8px 0 6px;
  font-weight: 900;
  letter-spacing: 0.2px;
}

.modal-warning p {
  color: #374151;
  margin: 0;
  font-size: 13.5px;
}

.modal-warning.danger {
  background: linear-gradient(135deg, #fff7ed 0%, #ffe4e6 100%);
  border-color: rgba(220, 38, 38, 0.25);
}

.modal-warning.danger i {
  color: #dc2626;
  font-size: 22px;
  margin-bottom: 6px;
}

.modal-warning.danger h4 {
  color: #b91c1c;
}

.modal-warning.success {
  background: linear-gradient(135deg, #ecfdf5 0%, #e7f8ee 100%);
  border-color: rgba(22, 163, 74, 0.25);
}

.modal-warning.success i {
  color: #16a34a;
  font-size: 22px;
  margin-bottom: 6px;
}

.modal-warning.success h4 {
  color: #16a34a;
}

.modal-warning.warning {
  background: linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%);
  border-color: rgba(245, 158, 11, 0.25);
}

.modal-warning.warning i {
  color: #f59e0b;
  font-size: 22px;
  margin-bottom: 6px;
}

.modal-warning.warning h4 {
  color: #d97706;
}

/* Slider */
.slider-container {
  margin: 16px 0;
}

.slider-label {
  text-align: center;
  margin-bottom: 12px;
  font-weight: 800;
  color: #111827;
  font-size: 13.5px;
}

.slider-track {
  position: relative;
  width: 100%;
  height: 50px;

  background: var(--el-fill-color-light, #e9ecef);
  border-radius: 25px;
  overflow: hidden;

  touch-action: none;
  overscroll-behavior: contain;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;

  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.10);
  outline: none;
}

.slider-track:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25), inset 0 2px 5px rgba(0, 0, 0, 0.10);
}

.slider-track[aria-disabled="true"] {
  opacity: 0.75;
  cursor: not-allowed;
}

.slider-track[aria-disabled="true"] .slider-thumb {
  cursor: not-allowed;
}

.slider-track[aria-disabled="true"] * {
  cursor: not-allowed !important;
}

.slider-fill {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  border-radius: 25px;
  transition: width 100ms var(--ease, cubic-bezier(.2, .8, .2, 1));
}

.slider-fill.danger {
  background: linear-gradient(90deg, #ef4444, #b91c1c);
}

.slider-fill.success {
  background: linear-gradient(90deg, #22c55e, #15803d);
}

.slider-fill.warning {
  background: linear-gradient(90deg, #f59e0b, #b45309);
}

.slider-thumb {
  position: absolute;
  top: 2px;

  width: 46px;
  height: 46px;
  border-radius: 999px;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: grab;
  z-index: 10;

  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.20);
  transition: background var(--t-fast, 160ms) var(--ease, cubic-bezier(.2, .8, .2, 1)), transform var(--t-fast, 160ms) var(--ease, cubic-bezier(.2, .8, .2, 1));
  touch-action: none;
}

.slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.05);
}

.slider-thumb.confirmed {
  color: #fff;
}

.slider-text,
.slider-confirmed {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  z-index: 5;
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
  pointer-events: none;
}

.slider-text {
  color: #6b7280;
  transition: opacity var(--t-fast, 160ms) var(--ease, cubic-bezier(.2, .8, .2, 1));
}

.slider-confirmed {
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.30);
}

/* Actions */
.modal-actions {
  text-align: center;
  margin-top: 16px;
}

.btn-cancel {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--el-color-primary, #409eff) 0%, #0a62c2 100%);
  color: white;

  border: none;
  border-radius: 10px;

  cursor: pointer;
  font-size: 14px;
  font-weight: 800;

  transition: transform var(--t-fast, 160ms) var(--ease, cubic-bezier(.2, .8, .2, 1)), box-shadow var(--t-fast, 160ms) var(--ease, cubic-bezier(.2, .8, .2, 1)), filter var(--t-fast, 160ms) var(--ease, cubic-bezier(.2, .8, .2, 1));
}

.btn-cancel:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md, 0 10px 24px rgba(0, 0, 0, 0.14));
  filter: brightness(1.03);
}

.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile */
@media (orientation: portrait) {
  .modal-content {
    width: 96vw;
    max-width: 96vw;
  }
}
</style>
