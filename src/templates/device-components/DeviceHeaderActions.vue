<template>
  <div id="kr-actions" class="kr-actions-container">
    <!-- QR Code Button -->
    <el-button 
      plain 
      @click="$emit('openQrCode')"
      v-if="showQrButton"
      :class="{'pulse-animation': isQrLocked}"
      :type="isQrLocked ? 'success' : 'default'"
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.showQrCode'))">
      <i class="fas fa-qrcode"></i>
    </el-button>

    <!-- External Maps Button -->
    <el-button 
      plain 
      @click="$emit('showExternal', $event)"
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.openExternal'))">
      <i class="fas fa-map-marked-alt"></i>
    </el-button>

    <!-- Camera/Street View Button -->
    <el-button 
      plain 
      @click="$emit('cameraOrStreet', $event)"
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, isCameraProtocol ? KT('device.camera') : KT('device.streetview'))">
      <i :class="isCameraProtocol ? 'fas fa-camera' : 'fas fa-street-view'"></i>
    </el-button>

    <!-- Routes Button -->
    <el-button 
      type="primary" 
      @click="$emit('goToRoutes')" 
      plain
      v-if="showRoutesButton"
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.routes'))">
      <i class="fas fa-route"></i>
    </el-button>

    <template v-if="device">
      <!-- Anchor Button -->
      <el-button 
        type="success" 
        @click="$emit('toggleAnchor', device.id)" 
        :plain="!isAnchored"
        v-if="showAnchorButton"
        @mouseleave="hideTip" 
        @mouseenter.stop="showTip($event, KT(isAnchored ? 'actions.anchorDisable' : 'actions.anchorEnable'))">
        <i class="fas fa-anchor"></i>
      </el-button>

      <!-- Unlock Button -->
      <el-button 
        type="success" 
        @click="$emit('unlock')"
        v-if="showUnlockButton"
        :disabled="device.status === 'offline'" 
        @contextmenu.prevent="$emit('contextMenu', $event)" 
        plain
        @mouseleave="hideTip" 
        @mouseenter.stop="showTip($event, KT('actions.engineResume'))">
        <i class="fas fa-unlock"></i>
      </el-button>

      <!-- Block Button -->
      <el-button 
        type="warning" 
        @click="$emit('block')"
        v-if="showBlockButton"
        :disabled="device.status === 'offline'" 
        @contextmenu.prevent="$emit('contextMenu', $event)" 
        plain
        @mouseleave="hideTip" 
        @mouseenter.stop="showTip($event, KT('actions.engineStop'))">
        <i class="fas fa-lock"></i>
      </el-button>
    </template>

    <!-- Edit Button -->
    <el-button 
      type="primary" 
      @click="$emit('openEdit')" 
      plain
      v-if="canEdit"
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.edit'))">
      <i class="fas fa-edit"></i>
    </el-button>

    <!-- Command Button -->
    <el-button 
      type="info" 
      @click.stop="$emit('openCommand')" 
      plain
      v-if="canSendCommand"
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.custom_command'))">
      <i class="fas fa-terminal"></i>
    </el-button>

    <!-- Delete Button -->
    <el-button 
      type="danger" 
      @click="$emit('openDelete')" 
      plain
      v-if="canDelete"
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.remove'))">
      <i class="fas fa-trash"></i>
    </el-button>
  </div>
</template>

<script setup>
import { ElButton } from "element-plus";
import KT from '../../tarkan/func/kt.js';

defineProps({
  device: {
    type: Object,
    default: null
  },
  position: {
    type: Object,
    default: null
  },
  isCameraProtocol: {
    type: Boolean,
    default: false
  },
  isAnchored: {
    type: Boolean,
    default: false
  },
  isQrLocked: {
    type: Boolean,
    default: false
  },
  showQrButton: {
    type: Boolean,
    default: false
  },
  showRoutesButton: {
    type: Boolean,
    default: false
  },
  showAnchorButton: {
    type: Boolean,
    default: false
  },
  showUnlockButton: {
    type: Boolean,
    default: false
  },
  showBlockButton: {
    type: Boolean,
    default: false
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  canSendCommand: {
    type: Boolean,
    default: false
  },
  canDelete: {
    type: Boolean,
    default: false
  }
});

defineEmits([
  'openQrCode',
  'showExternal',
  'cameraOrStreet',
  'goToRoutes',
  'toggleAnchor',
  'unlock',
  'block',
  'contextMenu',
  'openEdit',
  'openCommand',
  'openDelete'
]);

const showTip = (evt, text) => {
  window.$showTip(evt, text);
};

const hideTip = (evt, text) => {
  window.$hideTip(evt, text);
};
</script>

<style scoped>
.kr-actions-container {
  display: flex;
  justify-content: flex-end;
  align-content: space-between;
}

#kr-actions .el-button {
  width: 40px;
  padding: 0px;
}

.pulse-animation {
  animation: qr-pulse 1.2s infinite ease-in-out;
}

@keyframes qr-pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    background-color: #67c23a;
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.6);
    background-color: #85ce61;
  }
  100% {
    transform: scale(1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    background-color: #67c23a;
  }
}

@media (max-width: 768px) {
  #kr-actions {
    padding: 0 10px !important;
    flex-wrap: wrap !important;
    gap: 8px !important;
    justify-content: center !important;
  }
  
  #kr-actions .el-button {
    width: 35px !important;
    height: 35px !important;
    min-width: 35px !important;
    font-size: 12px !important;
  }
}

@media (max-width: 480px) {
  #kr-actions {
    padding: 0 5px !important;
    gap: 5px !important;
  }
  
  #kr-actions .el-button {
    width: 30px !important;
    height: 30px !important;
    min-width: 30px !important;
    font-size: 10px !important;
  }
}
</style>
