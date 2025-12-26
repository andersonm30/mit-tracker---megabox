<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    custom-class="slider-confirm-dialog"
    @close="handleClose"
  >
    <div class="slider-confirm-content">
      <!-- Ícone de aviso -->
      <div class="warning-icon" :class="actionType">
        <i :class="actionIcon"></i>
      </div>

      <!-- Mensagem -->
      <div class="message-section">
        <h3 class="device-name">{{ deviceName }}</h3>
        <p class="action-message">{{ message }}</p>
        <p class="warning-text" v-if="warningText">
          <i class="fas fa-exclamation-triangle"></i>
          {{ warningText }}
        </p>
      </div>

      <!-- Slider de Confirmação -->
      <div class="slider-section">
        <div class="slider-container" ref="sliderContainer">
          <div class="slider-track" :class="{ 'confirming': isSliding, 'confirmed': isConfirmed }">
            <div class="slider-progress" :style="{ width: sliderProgress + '%' }"></div>
            <span class="slider-text" v-if="!isConfirmed">
              {{ sliderText }}
            </span>
            <span class="slider-text confirmed" v-else>
              <i class="fas fa-check"></i> Confirmado!
            </span>
          </div>
          <div
            class="slider-thumb"
            ref="sliderThumb"
            :class="{ 'confirmed': isConfirmed }"
            :style="{ left: thumbPosition + 'px' }"
            @mousedown="startSlide"
            @touchstart.prevent="startSlide"
          >
            <i class="fas fa-chevron-right" v-if="!isConfirmed"></i>
            <i class="fas fa-check" v-else></i>
          </div>
        </div>
        <p class="slider-hint" v-if="!isConfirmed">
          <i class="fas fa-hand-pointer"></i> Arraste para confirmar
        </p>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="isLoading">
          Cancelar
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
/* eslint-disable no-unused-vars */
/* global defineProps, defineEmits */
import { ref, computed, watch } from 'vue';
import { ElDialog, ElButton, ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirmar Ação'
  },
  deviceName: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: 'Deseja confirmar esta ação?'
  },
  warningText: {
    type: String,
    default: ''
  },
  sliderText: {
    type: String,
    default: 'Deslize para confirmar'
  },
  actionType: {
    type: String,
    default: 'warning', // 'warning', 'danger', 'success'
    validator: (value) => ['warning', 'danger', 'success'].includes(value)
  },
  confirmCallback: {
    type: Function,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

// Refs
const sliderContainer = ref(null);
const sliderThumb = ref(null);

// State
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const isSliding = ref(false);
const isConfirmed = ref(false);
const isLoading = ref(false);
const thumbPosition = ref(0);
const sliderProgress = ref(0);

// Computed
const actionIcon = computed(() => {
  switch (props.actionType) {
    case 'danger':
      return 'fas fa-lock';
    case 'success':
      return 'fas fa-unlock';
    case 'warning':
    default:
      return 'fas fa-exclamation-triangle';
  }
});

// Methods
const startSlide = () => {
  if (isConfirmed.value || isLoading.value) return;
  
  isSliding.value = true;
  
  const moveHandler = (moveEvent) => {
    if (!isSliding.value) return;
    
    const container = sliderContainer.value;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const thumbWidth = 50;
    const maxPosition = containerRect.width - thumbWidth;
    
    let clientX;
    if (moveEvent.type === 'touchmove') {
      clientX = moveEvent.touches[0].clientX;
    } else {
      clientX = moveEvent.clientX;
    }
    
    let newPosition = clientX - containerRect.left - (thumbWidth / 2);
    newPosition = Math.max(0, Math.min(newPosition, maxPosition));
    
    thumbPosition.value = newPosition;
    sliderProgress.value = (newPosition / maxPosition) * 100;
    
    // Confirmar quando chegar ao final
    if (sliderProgress.value >= 95) {
      isConfirmed.value = true;
      isSliding.value = false;
      thumbPosition.value = maxPosition;
      sliderProgress.value = 100;
      
      // Trigger confirmation
      setTimeout(() => {
        handleConfirm();
      }, 500);
    }
  };
  
  const endHandler = () => {
    if (!isConfirmed.value) {
      // Reset slider if not confirmed
      isSliding.value = false;
      thumbPosition.value = 0;
      sliderProgress.value = 0;
    }
    
    document.removeEventListener('mousemove', moveHandler);
    document.removeEventListener('mouseup', endHandler);
    document.removeEventListener('touchmove', moveHandler);
    document.removeEventListener('touchend', endHandler);
  };
  
  document.addEventListener('mousemove', moveHandler);
  document.addEventListener('mouseup', endHandler);
  document.addEventListener('touchmove', moveHandler);
  document.addEventListener('touchend', endHandler);
};

const handleConfirm = async () => {
  isLoading.value = true;
  
  try {
    if (props.confirmCallback) {
      await props.confirmCallback();
    }
    emit('confirm');
    
    setTimeout(() => {
      handleClose();
    }, 1000);
  } catch (error) {
    console.error('Erro ao confirmar:', error);
    ElMessage.error('Erro ao executar comando');
    resetSlider();
  } finally {
    isLoading.value = false;
  }
};

const handleClose = () => {
  resetSlider();
  emit('update:modelValue', false);
  emit('cancel');
};

const resetSlider = () => {
  isSliding.value = false;
  isConfirmed.value = false;
  thumbPosition.value = 0;
  sliderProgress.value = 0;
};

// Watch for dialog visibility
watch(visible, (newVal) => {
  if (newVal) {
    resetSlider();
  }
});
</script>

<style scoped>
.slider-confirm-content {
  padding: 10px 0;
  text-align: center;
}

.warning-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 36px;
}

.warning-icon.warning {
  background: rgba(230, 162, 60, 0.15);
  color: #e6a23c;
  border: 2px solid rgba(230, 162, 60, 0.3);
}

.warning-icon.danger {
  background: rgba(245, 108, 108, 0.15);
  color: #f56c6c;
  border: 2px solid rgba(245, 108, 108, 0.3);
}

.warning-icon.success {
  background: rgba(103, 194, 58, 0.15);
  color: #67c23a;
  border: 2px solid rgba(103, 194, 58, 0.3);
}

.message-section {
  margin-bottom: 25px;
}

.device-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 10px 0;
}

.action-message {
  font-size: 14px;
  color: #606266;
  margin: 0 0 10px 0;
}

.warning-text {
  font-size: 12px;
  color: #e6a23c;
  margin: 10px 0 0 0;
  padding: 8px 12px;
  background: rgba(230, 162, 60, 0.1);
  border-radius: 6px;
  display: inline-block;
}

.warning-text i {
  margin-right: 6px;
}

.slider-section {
  margin-top: 20px;
}

.slider-container {
  position: relative;
  width: 100%;
  height: 56px;
  border-radius: 28px;
  overflow: hidden;
  user-select: none;
}

.slider-track {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e4e7ed, #dcdfe6);
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.slider-track.confirming {
  background: linear-gradient(135deg, #fdf6ec, #faecd8);
}

.slider-track.confirmed {
  background: linear-gradient(135deg, #f0f9eb, #e1f3d8);
}

.slider-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.3), rgba(245, 108, 108, 0.3));
  border-radius: 28px;
  transition: background 0.3s ease;
}

.slider-track.confirmed .slider-progress {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.4), rgba(103, 194, 58, 0.6));
}

.slider-text {
  position: relative;
  z-index: 1;
  font-size: 14px;
  font-weight: 500;
  color: #909399;
  transition: all 0.3s ease;
}

.slider-text.confirmed {
  color: #67c23a;
  font-weight: 600;
}

.slider-text.confirmed i {
  margin-right: 6px;
}

.slider-thumb {
  position: absolute;
  top: 3px;
  left: 0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transition: background 0.3s ease, transform 0.2s ease;
  z-index: 2;
}

.slider-thumb:hover {
  transform: scale(1.05);
}

.slider-thumb:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.slider-thumb.confirmed {
  background: linear-gradient(135deg, #67c23a, #5daf34);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
}

.slider-thumb i {
  color: white;
  font-size: 18px;
}

.slider-hint {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
}

.slider-hint i {
  margin-right: 6px;
  animation: point 1s ease-in-out infinite;
}

@keyframes point {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(5px);
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
}

/* Dark theme support */
:deep(.slider-confirm-dialog) {
  border-radius: 12px;
}

:deep(.slider-confirm-dialog .el-dialog__header) {
  padding: 20px 20px 10px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.slider-confirm-dialog .el-dialog__body) {
  padding: 20px;
}

:deep(.slider-confirm-dialog .el-dialog__footer) {
  padding: 10px 20px 20px;
  border-top: 1px solid #ebeef5;
}
</style>
