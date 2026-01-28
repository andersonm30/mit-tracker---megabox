<template>
  <el-dialog
    v-model="model"
    class="tarkan-modal"
    :class="modalClass"
    :top="top"
    :width="width"
    :fullscreen="fullscreen"
    :lock-scroll="lockScroll"
    :append-to-body="appendToBody"
    :destroy-on-close="destroyOnClose"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :draggable="draggable"
    :align-center="alignCenter"
    @open="$emit('open')"
    @opened="$emit('opened')"
    @close="$emit('close')"
    @closed="$emit('closed')"
  >
    <!-- HEADER -->
    <template v-if="$slots.header || title" #header>
      <div class="bm-header">
        <slot name="header">
          <div class="bm-header__content">
            <i v-if="icon" :class="icon" class="bm-header__icon"></i>
            <div class="bm-header__title">{{ title }}</div>
          </div>
        </slot>
      </div>
    </template>

    <!-- BODY -->
    <div class="bm-body">
      <div class="bm-content">
        <slot />
      </div>
    </div>

    <!-- FOOTER -->
    <template v-if="$slots.footer || showDefaultFooter" #footer>
      <div class="bm-footer" :class="{ 'bm-footer--compact': compactFooter }">
        <slot name="footer">
          <el-button plain size="small" @click="model = false">
            <i class="fas fa-times"></i>
            <span class="bm-btn-text">{{ closeText }}</span>
          </el-button>
        </slot>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/button/style/css'
import { computed } from 'vue'
import { ElDialog, ElButton } from 'element-plus'

const props = defineProps({
  modelValue: { type: Boolean, default: false },

  // Visual
  title: { type: String, default: '' },
  icon: { type: String, default: '' }, // ex: "fas fa-users"
  width: { type: [String, Number], default: '70%' },
  top: { type: String, default: '50px' },
  fullscreen: { type: Boolean, default: false },
  alignCenter: { type: Boolean, default: false },
  draggable: { type: Boolean, default: false },

  // Behavior
  lockScroll: { type: Boolean, default: true },
  appendToBody: { type: Boolean, default: false },
  destroyOnClose: { type: Boolean, default: false },
  closeOnClickModal: { type: Boolean, default: true },
  closeOnPressEscape: { type: Boolean, default: true },
  showClose: { type: Boolean, default: true },

  // Footer
  showDefaultFooter: { type: Boolean, default: true },
  compactFooter: { type: Boolean, default: true },
  closeText: { type: String, default: 'Fechar' },

  // CSS hooks
  variant: { type: String, default: '' }, // ex: "users", "device"
  maxBodyHeightOffset: { type: Number, default: 140 }, // calc(100vh - offset)
})

const emit = defineEmits(['update:modelValue', 'open', 'opened', 'close', 'closed'])

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const modalClass = computed(() => {
  const base = ['bm']
  if (props.variant) base.push(`bm--${props.variant}`)
  return base.join(' ')
})
</script>

<style scoped>
/* =========================
   TOKENS (LIGHT DEFAULT)
   ========================= */
:deep(.tarkan-modal.el-dialog) {
  --m-bg: #ffffff;
  --m-surface: #ffffff;
  --m-muted-bg: #f8f9fa;
  --m-border: #eaeaea;
  --m-text: #303133;
  --m-subtext: #606266;
  --m-subtle: #909399;

  --m-accent-1: #667eea;
  --m-accent-2: #764ba2;

  --m-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  --m-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.15);

  background: var(--m-bg);
  border-radius: 12px;
  overflow: hidden;
}

/* =========================
   TOKENS (DARK via body.dark-mode)
   ========================= */
:global(body.dark-mode) :deep(.tarkan-modal.el-dialog) {
  --m-bg: #0f1115;
  --m-surface: #141824;
  --m-muted-bg: #121626;
  --m-border: rgba(255, 255, 255, 0.08);
  --m-text: rgba(255, 255, 255, 0.92);
  --m-subtext: rgba(255, 255, 255, 0.72);
  --m-subtle: rgba(255, 255, 255, 0.55);

  --m-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
  --m-shadow-hover: 0 6px 18px rgba(0, 0, 0, 0.45);
}

/* =========================
   ISOLAMENTO contra CSS global
   (ganha especificidade + !important)
   ========================= */
:deep(.bm .el-dialog__header),
:deep(.bm .el-dialog__body),
:deep(.bm .el-dialog__footer) {
  padding: 0 !important;
  margin: 0 !important;
}

/* Se o global mete margin-top no footer */
:deep(.bm .el-dialog__footer) {
  margin-top: 0 !important;
}

/* Garantir botão X acima de header custom */
:deep(.bm .el-dialog__headerbtn) {
  z-index: 10;
  top: 14px;
  right: 14px;
}

/* =========================
   HEADER
   ========================= */
.bm-header {
  background: linear-gradient(135deg, var(--m-accent-1) 0%, var(--m-accent-2) 100%);
  color: #fff;
  padding: 14px 52px 14px 18px; /* reserva área do X */
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.bm-header__content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bm-header__icon {
  font-size: 18px;
  opacity: 0.95;
  flex-shrink: 0;
}

.bm-header__title {
  font-size: 16px;
  font-weight: 600;
  max-width: calc(100% - 52px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =========================
   BODY (layout flex anti "vazio")
   ========================= */
.bm-body {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 140px); /* padrão; ajuste por variant se precisar */
  background: var(--m-bg);
}

.bm-content {
  flex: 1;
  min-height: 0;
  background: var(--m-surface);
  color: var(--m-text);
}

/* =========================
   FOOTER
   ========================= */
.bm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 6px 16px;
  border-top: 1px solid var(--m-border);
  background: transparent;
}

.bm-footer--compact {
  padding: 4px 12px;
}

.bm-btn-text {
  margin-left: 6px;
}

:deep(.bm-footer--compact .el-button) {
  min-width: 88px;
}
</style>
