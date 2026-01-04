<template>
  <div class="dual-camera-section">
    <!-- Camera Selection Buttons (initial state) -->
    <div v-if="!cameraSelected" class="dual-camera-selector">
      <el-button 
        @click="$emit('selectCamera', 'IN')" 
        class="camera-btn camera-btn-left"
        type="primary"
        size="small">
        <i class="fas fa-video mr-4"></i> {{ KT('device.internalCamera') }}
      </el-button>
      <el-button 
        @click="$emit('selectCamera', 'OUT')" 
        class="camera-btn camera-btn-right"
        type="success"
        size="small">
        <i class="fas fa-video mr-4"></i> {{ KT('device.externalCamera') }}
      </el-button>
    </div>

    <!-- Dual Camera Container (after selection) -->
    <div v-if="cameraSelected" class="dual-camera-container">
      <!-- Close Button -->
      <div class="camera-header-controls">
        <el-button 
          @click="$emit('closeCamera')" 
          size="small" 
          type="danger" 
          circle
          class="camera-close-btn">
          <i class="fas fa-times"></i>
        </el-button>
      </div>

      <!-- Camera Titles -->
      <div class="camera-titles">
        <div class="camera-title camera-title-left">
          <i class="fas fa-video mr-4"></i> {{ KT('device.internalCamera') }}
        </div>
        <div class="camera-title camera-title-right">
          <i class="fas fa-video mr-4"></i> {{ KT('device.externalCamera') }}
        </div>
      </div>
      
      <!-- Camera Containers -->
      <div class="cameras-wrapper">
        <!-- Left Camera -->
        <div class="camera-container camera-left">
          <div id="camera-left-container" class="camera-inner-container">
            <div class="camera-spinner camera-spinner-left"></div>
            <div class="camera-message">
              {{ leftCameraMessage }}
            </div>
          </div>
        </div>
        
        <!-- Right Camera -->
        <div class="camera-container camera-right">
          <div id="camera-right-container" class="camera-inner-container">
            <div class="camera-spinner camera-spinner-right"></div>
            <div class="camera-message">
              {{ rightCameraMessage }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Camera Control Buttons -->
      <div class="camera-buttons">
        <el-button 
          @click="$emit('loadLeftCamera', 'IN')" 
          class="camera-btn camera-btn-left"
          type="primary"
          size="small">
          <i class="fas fa-video mr-4"></i> {{ KT('device.internalCamera') }}
        </el-button>
        <el-button 
          @click="$emit('loadRightCamera', 'OUT')" 
          class="camera-btn camera-btn-right"
          type="success"
          size="small">
          <i class="fas fa-video mr-4"></i> {{ KT('device.externalCamera') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElButton } from 'element-plus';
import KT from '../../tarkan/func/kt.js';

defineProps({
  cameraSelected: {
    type: Boolean,
    default: false
  },
  leftCameraMessage: {
    type: String,
    default: ''
  },
  rightCameraMessage: {
    type: String,
    default: ''
  }
});

defineEmits(['selectCamera', 'closeCamera', 'loadLeftCamera', 'loadRightCamera']);
</script>

<style scoped>
.dual-camera-section {
  width: 100%;
}

.dual-camera-selector {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 15px;
  border-bottom: var(--el-border-color-light) 1px dotted;
}

.dual-camera-container {
  padding: 10px;
  border-bottom: var(--el-border-color-light) 1px dotted;
}

.camera-header-controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.camera-close-btn {
  width: 28px;
  height: 28px;
}

.camera-titles {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.camera-title {
  flex: 1;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  color: var(--el-text-color-regular);
  padding: 5px;
}

.camera-title-left {
  border-right: var(--el-border-color-light) 1px dotted;
}

.cameras-wrapper {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.camera-container {
  flex: 1;
  aspect-ratio: 16/9;
  background-color: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.camera-inner-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.camera-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid transparent;
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: none;
}

.camera-spinner-left.loading,
.camera-spinner-right.loading {
  display: block;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.camera-message {
  font-size: 12px;
  color: #888;
  text-align: center;
  padding: 10px;
}

.camera-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding-top: 10px;
}

.camera-btn {
  min-width: 120px;
}

.camera-btn-left {
  border-radius: 6px 0 0 6px;
}

.camera-btn-right {
  border-radius: 0 6px 6px 0;
}

.mr-4 {
  margin-right: 4px;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .cameras-wrapper {
    flex-direction: column;
  }
  
  .camera-container {
    width: 100%;
  }
  
  .camera-titles {
    flex-direction: column;
  }
  
  .camera-title-left {
    border-right: none;
    border-bottom: var(--el-border-color-light) 1px dotted;
  }
  
  .camera-buttons {
    flex-direction: column;
  }
  
  .camera-btn-left,
  .camera-btn-right {
    border-radius: 6px;
    width: 100%;
  }
}
</style>
