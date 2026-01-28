<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="csm-overlay"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descId"
        tabindex="-1"
        @keydown.esc.stop="handleCancel"
        @keydown.tab="trapTab"
        @click.self="handleClickOutside"
      >
        <div class="csm-content" ref="contentRef">
          <!-- Vehicle Info -->
          <div class="csm-vehicle-info">
            <img
              :src="deviceImage"
              :alt="device?.name || 'Veículo'"
              class="csm-vehicle-img"
              @error="onImgError"
            />
            <div class="csm-vehicle-details">
              <h3 :id="titleId" :class="['csm-title', `csm-title--${colorVariant}`]">
                <i v-if="titleIcon" :class="titleIcon" aria-hidden="true" />
                {{ title }}
              </h3>
              <p v-if="device?.name"><strong>Nome:</strong> {{ device.name }}</p>
              <p v-if="device?.uniqueId"><strong>IMEI:</strong> {{ device.uniqueId }}</p>
              <p v-if="device?.attributes?.placa"><strong>Placa:</strong> {{ device.attributes.placa }}</p>
              <p>
                <strong>Status:</strong>
                <span :class="device?.status === 'online' ? 'csm-status-online' : 'csm-status-offline'">
                  {{ device?.status === 'online' ? 'Online' : 'Offline' }}
                </span>
              </p>
            </div>
          </div>

          <!-- Warning Block -->
          <div :id="descId" :class="['csm-warning', `csm-warning--${colorVariant}`]">
            <i class="fas fa-exclamation-triangle" aria-hidden="true" />
            <h4>{{ warningTitle }}</h4>
            <p>{{ warningText }}</p>
          </div>

          <!-- Slider -->
          <div class="csm-slider-container">
            <p class="csm-slider-label">{{ sliderLabel }}</p>
            <div
              ref="sliderRef"
              class="csm-slider-track"
              role="slider"
              tabindex="0"
              :aria-label="sliderLabel"
              aria-orientation="horizontal"
              :aria-valuemin="0"
              :aria-valuemax="100"
              :aria-valuenow="Math.round(progress)"
              :aria-disabled="loading"
              :class="{ 'csm-slider--disabled': loading }"
              @keydown.stop="handleSliderKeydown"
            >
              <div
                class="csm-slider-fill"
                :class="[`csm-slider-fill--${colorVariant}`, { 'csm-slider-fill--rtl': rtl }]"
                :style="fillStyle"
              />
              <div
                ref="thumbRef"
                class="csm-slider-thumb"
                :class="{ 'csm-slider-thumb--confirmed': confirmed }"
                :style="thumbStyle"
                @pointerdown="startDrag"
              >
                <i :class="iconClass" aria-hidden="true" />
              </div>

              <span class="csm-slider-text" :style="{ opacity: confirmed ? 0 : 1 }">
                {{ rtl ? '← ' : '→ ' }}{{ confirmLabel }}
              </span>

              <span v-if="confirmed" class="csm-slider-confirmed" aria-live="polite">
                ✓ Confirmado
              </span>
            </div>
          </div>

          <!-- Cancel Button -->
          <div class="csm-actions">
            <button
              type="button"
              class="csm-btn-cancel"
              :disabled="loading"
              @click="handleCancel"
            >
              <i class="fas fa-times" aria-hidden="true" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount, defineProps, defineEmits, defineExpose } from 'vue'
import { assetUrl, categoryImageUrl } from '@/branding'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  device: { type: Object, default: null },
  mode: {
    type: String,
    default: 'block',
    validator: (v) => ['block', 'unlock', 'anchor_enable', 'anchor_disable', 'delete'].includes(v)
  },
  loading: { type: Boolean, default: false },
  title: { type: String, default: '' },
  warningTitle: { type: String, default: 'ATENÇÃO' },
  warningText: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Deslize para confirmar' },
  sliderLabel: { type: String, default: 'Deslize para confirmar' },
  iconClass: { type: String, default: 'fas fa-lock' },
  titleIcon: { type: String, default: '' },
  colorVariant: {
    type: String,
    default: 'danger',
    validator: (v) => ['danger', 'success', 'warning'].includes(v)
  },
  rtl: { type: Boolean, default: false },
  allowClickOutside: { type: Boolean, default: true },
  backgroundRootSelector: { type: String, default: '#app' } // permite customizar o wrapper do app
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

// IDs únicos para acessibilidade
const uid = Math.random().toString(36).slice(2, 9)
const titleId = `csm-title-${uid}`
const descId = `csm-desc-${uid}`

// Refs
const sliderRef = ref(null)
const thumbRef = ref(null)
const contentRef = ref(null)

// Foco/restauração
const lastActiveEl = ref(null)

// Slider state
const PADDING = 2
const THUMB_WIDTH = 46
const progress = ref(0)
const thumbPosition = ref(PADDING)
const confirmed = ref(false)
const dragging = ref(false)

// Internal state
const state = {
  rafId: null,
  geometry: null,
  hasVibrated: false
}

// -------- A11Y: background aria-hidden / inert (com fallback) --------
const setBackgroundHidden = (hidden) => {
  const root = document.querySelector(props.backgroundRootSelector)
  if (!root) return

  if (hidden) {
    root.setAttribute('aria-hidden', 'true')
    // inert (quando suportado) melhora muito o foco/teclado
    try {
      if ('inert' in root) root.inert = true
    } catch { /* ignore */ }
  } else {
    root.removeAttribute('aria-hidden')
    try {
      if ('inert' in root) root.inert = false
    } catch { /* ignore */ }
  }
}

// -------- A11Y: trap de TAB --------
const trapTab = (e) => {
  if (e.key !== 'Tab') return
  const root = contentRef.value
  if (!root) return

  const focusables = root.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  const list = Array.from(focusables).filter((el) => {
    if (!el) return false
    if (el.hasAttribute('disabled')) return false
    if (el.getAttribute('aria-hidden') === 'true') return false
    // evita focar elemento invisível
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    return true
  })

  if (!list.length) return

  const first = list[0]
  const last = list[list.length - 1]
  const active = document.activeElement

  if (e.shiftKey && active === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

// Computed styles
const thumbStyle = computed(() => ({
  left: `${thumbPosition.value}px`,
  background: confirmed.value ? `var(--csm-color-${props.colorVariant})` : 'white'
}))

const fillStyle = computed(() => {
  if (props.rtl) {
    return { width: `${progress.value}%`, right: 0, left: 'auto' }
  }
  return { width: `${progress.value}%` }
})

// Device image
const deviceImage = computed(() => {
  if (!props.device) return categoryImageUrl('default')
  const ts = props.device?.attributes?.imageTimestamp || 0
  const v = props.device?.attributes?.imageVersion || 0
  return assetUrl(`images/${props.device.id}.png`) + `?v=${v}&ts=${ts}`
})

const onImgError = (e) => {
  const rawCat = props.device?.category || props.device?.attributes?.category || 'default'
  const safeCat = String(rawCat).toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'default'
  e.target.onerror = null
  e.target.src = categoryImageUrl(safeCat)
}

// Geometry helpers
const getGeometry = () => {
  const sliderEl = sliderRef.value
  const thumbEl = thumbRef.value
  const sliderRect = sliderEl?.getBoundingClientRect?.()
  if (!sliderRect) return null

  const thumbWidth = thumbEl?.offsetWidth ?? THUMB_WIDTH
  const maxLeftRaw = sliderRect.width - thumbWidth - PADDING
  const maxLeft = Math.max(PADDING, maxLeftRaw)

  return { rect: sliderRect, thumbWidth, maxLeft, padding: PADDING }
}

const getInitialPosition = (geometry) => {
  // RTL: thumb começa no final (direita), confirma indo para esquerda
  // LTR: thumb começa no início (esquerda), confirma indo para direita
  return props.rtl ? geometry.maxLeft : geometry.padding
}

const calculateProgress = (left, geometry) => {
  const range = geometry.maxLeft - geometry.padding
  if (range <= 0) return 0

  if (props.rtl) {
    // RTL: progress aumenta quando vai para ESQUERDA (left diminui)
    return ((geometry.maxLeft - left) / range) * 100
  }
  // LTR: progress aumenta quando vai para DIREITA (left aumenta)
  return ((left - geometry.padding) / range) * 100
}

const isAtConfirmThreshold = (left, geometry) => {
  const threshold = 5
  if (props.rtl) {
    // RTL: confirma quando chega na ESQUERDA (left <= padding + threshold)
    return left <= geometry.padding + threshold
  }
  // LTR: confirma quando chega na DIREITA (left >= maxLeft - threshold)
  return left >= geometry.maxLeft - threshold
}

// Haptics
const triggerHaptics = () => {
  if (state.hasVibrated) return
  state.hasVibrated = true
  try {
    navigator.vibrate?.(20)
  } catch { /* ignore */ }
}

// Drag handlers
const onPointerMove = (e) => {
  if (!dragging.value || !state.geometry || props.loading) return
  e.preventDefault()

  const clientX = e.clientX
  if (clientX == null || !Number.isFinite(clientX)) return

  if (state.rafId) {
    cancelAnimationFrame(state.rafId)
    state.rafId = null
  }

  state.rafId = requestAnimationFrame(() => {
    if (!dragging.value || !state.geometry) return

    const geometry = state.geometry
    const rawLeft = clientX - geometry.rect.left - geometry.thumbWidth / 2
    const newLeft = Math.max(geometry.padding, Math.min(rawLeft, geometry.maxLeft))

    thumbPosition.value = newLeft
    progress.value = calculateProgress(newLeft, geometry)

    if (isAtConfirmThreshold(newLeft, geometry)) {
      confirmed.value = true
      dragging.value = false
      triggerHaptics()
      cleanup()

      setTimeout(() => emit('confirm'), 250)
    }
  })
}

const onPointerEnd = () => {
  if (!dragging.value) return

  if (!confirmed.value) {
    const geometry = getGeometry()
    if (geometry) {
      thumbPosition.value = getInitialPosition(geometry)
      progress.value = 0
    }
  }

  dragging.value = false
  cleanup()
}

const startDrag = (e) => {
  if (props.loading || confirmed.value) return

  e.preventDefault()
  const geometry = getGeometry()
  if (!geometry) return

  state.geometry = geometry
  dragging.value = true
  state.hasVibrated = false

  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerEnd)
  window.addEventListener('pointercancel', onPointerEnd)
}

const cleanup = () => {
  if (state.rafId) {
    cancelAnimationFrame(state.rafId)
    state.rafId = null
  }

  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerEnd)
  window.removeEventListener('pointercancel', onPointerEnd)

  document.body.style.userSelect = ''
  state.geometry = null
}

// Reset slider
const reset = () => {
  const geometry = getGeometry()
  const initialPos = geometry ? getInitialPosition(geometry) : PADDING
  thumbPosition.value = initialPos
  progress.value = 0
  confirmed.value = false
  dragging.value = false
  state.hasVibrated = false
  cleanup()
}

// Keyboard support
const handleSliderKeydown = (e) => {
  if (props.loading || confirmed.value) return

  const geometry = getGeometry()
  if (!geometry) return

  const step = (geometry.maxLeft - geometry.padding) / 10
  let newLeft = thumbPosition.value
  const isRtl = props.rtl

  switch (e.key) {
    case 'ArrowRight':
      e.preventDefault()
      newLeft = isRtl
        ? Math.max(geometry.padding, thumbPosition.value - step)
        : Math.min(geometry.maxLeft, thumbPosition.value + step)
      break
    case 'ArrowLeft':
      e.preventDefault()
      newLeft = isRtl
        ? Math.min(geometry.maxLeft, thumbPosition.value + step)
        : Math.max(geometry.padding, thumbPosition.value - step)
      break
    case 'Home':
      e.preventDefault()
      newLeft = isRtl ? geometry.maxLeft : geometry.padding
      break
    case 'End':
      e.preventDefault()
      newLeft = isRtl ? geometry.padding : geometry.maxLeft
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      newLeft = isRtl ? geometry.padding : geometry.maxLeft
      break
    default:
      return
  }

  thumbPosition.value = newLeft
  progress.value = calculateProgress(newLeft, geometry)

  if (isAtConfirmThreshold(newLeft, geometry)) {
    confirmed.value = true
    triggerHaptics()
    setTimeout(() => emit('confirm'), 250)
  }
}

// Actions
const handleCancel = () => {
  if (props.loading) return
  reset()
  emit('cancel')
  emit('update:modelValue', false)
}

const handleClickOutside = () => {
  if (props.allowClickOutside && !props.loading && props.mode !== 'delete') {
    handleCancel()
  }
}

// Watch for open/close
watch(() => props.modelValue, (open) => {
  if (open) {
    lastActiveEl.value = document.activeElement
    setBackgroundHidden(true)
    reset()

    // ✅ REMOVIDO focusFirst() - o composable useModalA11yLock já cuida do foco inicial
    // nextTick(() => {
    //   focusFirst()
    // })
  } else {
    cleanup()
    setBackgroundHidden(false)

    // ✅ REMOVIDO restore de foco - o composable useModalA11yLock já cuida disso
    // nextTick(() => {
    //   lastActiveEl.value?.focus?.()
    //   lastActiveEl.value = null
    // })
  }
})

// Cleanup on unmount
onBeforeUnmount(() => {
  cleanup()
  setBackgroundHidden(false)
})

// Expose reset for parent
defineExpose({ reset })
</script>

<style scoped>
/* Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .csm-content,
.modal-fade-leave-active .csm-content {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .csm-content,
.modal-fade-leave-to .csm-content {
  transform: scale(0.95) translateY(-10px);
  opacity: 0;
}

/* Overlay (variáveis locais do componente - funciona com scoped) */
.csm-overlay {
  --csm-color-danger: #dc3545;
  --csm-color-success: #28a745;
  --csm-color-warning: #f59e0b;

  position: fixed;
  inset: 0;
  z-index: var(--z-modal, 10000);
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
}

/* Content */
.csm-content {
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 20px;
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;

  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* Vehicle Info */
.csm-vehicle-info {
  display: flex;
  gap: 14px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.csm-vehicle-img {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.csm-vehicle-details {
  flex: 1;
  min-width: 0;
}

.csm-vehicle-details h3 {
  margin: 0 0 6px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.csm-vehicle-details p {
  margin: 2px 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

.csm-vehicle-details strong {
  color: rgba(255, 255, 255, 0.9);
}

/* Title variants */
.csm-title--danger { color: #ef4444; }
.csm-title--success { color: #22c55e; }
.csm-title--warning { color: #f59e0b; }

.csm-title i {
  margin-right: 6px;
}

/* Status */
.csm-status-online {
  color: #22c55e;
  font-weight: 600;
}

.csm-status-offline {
  color: #ef4444;
  font-weight: 600;
}

/* Warning Block */
.csm-warning {
  text-align: center;
  padding: 14px;
  border-radius: 10px;
  margin-bottom: 16px;
}

.csm-warning--danger {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.csm-warning--success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

.csm-warning--warning {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fcd34d;
}

.csm-warning i {
  font-size: 1.4rem;
  margin-bottom: 6px;
  display: block;
}

.csm-warning h4 {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 800;
}

.csm-warning p {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.9;
}

/* Slider Container */
.csm-slider-container {
  margin-bottom: 16px;
}

.csm-slider-label {
  text-align: center;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

/* Slider Track */
.csm-slider-track {
  position: relative;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  overflow: hidden;
  cursor: pointer;
  touch-action: none;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.csm-slider-track:focus {
  outline: 2px solid var(--el-color-primary, #409eff);
  outline-offset: 2px;
}

.csm-slider--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* Slider Fill */
.csm-slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 25px;
  transition: width 0.05s linear;
}

.csm-slider-fill--rtl {
  left: auto;
  right: 0;
}

.csm-slider-fill--danger {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0.8) 100%);
}

.csm-slider-fill--success {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.8) 100%);
}

.csm-slider-fill--warning {
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.4) 0%, rgba(245, 158, 11, 0.8) 100%);
}

/* Slider Thumb */
.csm-slider-thumb {
  position: absolute;
  top: 2px;
  width: 46px;
  height: 46px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  touch-action: none;
  transition: background 0.2s ease, transform 0.1s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.csm-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.05);
}

.csm-slider-thumb i {
  font-size: 1.1rem;
  color: #333;
  transition: color 0.2s ease;
}

.csm-slider-thumb--confirmed i {
  color: white;
}

/* Slider Text */
.csm-slider-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  font-weight: 600;
  pointer-events: none;
  white-space: nowrap;
  transition: opacity 0.2s ease;
}

.csm-slider-confirmed {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #22c55e;
  font-size: 0.95rem;
  font-weight: 700;
  pointer-events: none;
}

/* Cancel Button */
.csm-actions {
  text-align: center;
}

.csm-btn-cancel {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.csm-btn-cancel:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.csm-btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.csm-btn-cancel i {
  margin-right: 6px;
}
</style>
