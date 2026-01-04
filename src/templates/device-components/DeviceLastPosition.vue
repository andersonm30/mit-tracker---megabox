<template>
  <div class="last-position-section" v-if="position">
    <!-- Subtitle with Share Buttons -->
    <div class="subtitle subtitle-relative">
      <i class="fas fa-map-marker-alt"></i> {{ KT('device.lastPosition') }}

      <div class="share-buttons">
        <div 
          v-if="showShareLink" 
          @mouseleave="hideTip" 
          @mouseenter.stop="showTip($event, KT('device.shareLink'))" 
          @click="$emit('shareLink')" 
          class="share-btn">
          <i class="fas fa-share-alt share-icon"></i>
        </div>
        <div 
          @mouseleave="hideTip" 
          @mouseenter.stop="showTip($event, KT('device.shareMaps'))" 
          @click="$emit('shareMaps')" 
          class="share-btn">
          <i class="fas fa-map-marked share-icon"></i>
        </div>
        <div 
          @mouseleave="hideTip" 
          @mouseenter.stop="showTip($event, KT('device.shareStreet'))" 
          @click="$emit('shareStreet')" 
          class="share-btn share-btn-last">
          <i class="fas fa-street-view share-icon"></i>
        </div>
      </div>
    </div>

    <!-- Updated Times -->
    <div class="updated">
      <span 
        @mouseleave="hideTip" 
        @mouseenter.stop="showTip($event, KT('device.lastPositionTime'))"
        :class="{ 'text-danger': isOlderThan3Hours }">
        <i class="far fa-clock"></i> {{ formattedFixTime }}
      </span>

      <span 
        v-if="hasStoppedTime" 
        @mouseleave="hideTip" 
        @mouseenter.stop="showTip($event, KT('device.lastStoppedTime'))" 
        class="stopped-time">
        <i class="far fa-hand-paper"></i> {{ stoppedTimeFormatted }}
      </span>
    </div>

    <!-- Address Container -->
    <div class="address-container">
      <!-- Show address at top -->
      <div v-if="position.address" class="address">{{ position.address }}</div>
      
      <!-- Show lat/long if no address -->
      <div v-else class="address">
        {{ position.latitude }}, {{ position.longitude }}
      </div>
      
      <!-- Footer with icon and date -->
      <div class="address-footer">
        <span class="address-footer-text">
          {{ KT('device.ultconection') }}
        </span>
        <i class="far fa-clock address-footer-icon"></i>
        <span 
          class="address-footer-date"
          :class="{ 'text-danger': isOlderThan3Hours }"
          @mouseleave="hideTip" 
          @mouseenter.stop="showTip($event, KT('device.ultconection'))">
          {{ formattedDeviceTime }}
        </span>
      </div>
    </div>
  </div>

  <!-- No Position State -->
  <div v-else class="no-position">
    <div class="updated p-10">{{ KT('device.noPosition') }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import KT from '../../tarkan/func/kt.js';

const props = defineProps({
  position: {
    type: Object,
    default: null
  },
  showShareLink: {
    type: Boolean,
    default: false
  },
  isOlderThan3Hours: {
    type: Boolean,
    default: false
  },
  stoppedTimeFormatted: {
    type: String,
    default: ''
  },
  currentTime: {
    type: [Date, Number],
    default: null
  }
});

defineEmits(['shareLink', 'shareMaps', 'shareStreet']);

const formattedFixTime = computed(() => {
  if (!props.position?.fixTime) return '';
  return new Date(props.position.fixTime).toLocaleString();
});

const formattedDeviceTime = computed(() => {
  if (!props.position?.deviceTime) return '';
  return new Date(props.position.deviceTime).toLocaleString();
});

const hasStoppedTime = computed(() => {
  return props.position?.attributes?.stoppedTime && 
         props.position.attributes.stoppedTime !== -1 && 
         props.currentTime;
});

const showTip = (evt, text) => {
  window.$showTip(evt, text);
};

const hideTip = (evt, text) => {
  window.$hideTip(evt, text);
};
</script>

<style scoped>
.last-position-section {
  width: 100%;
}

.subtitle {
  padding: 7px 10px;
  border-bottom: 1px solid var(--el-border-color-light);
  text-transform: uppercase;
  font-size: 11px;
  color: var(--el-text-color-regular);
}

.subtitle-relative {
  position: relative;
}

.share-buttons {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 5px;
}

.share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background-color: var(--el-fill-color-light);
  cursor: pointer;
  transition: background-color 0.2s;
}

.share-btn:hover {
  background-color: var(--el-fill-color);
}

.share-btn-last {
  margin-right: 0;
}

.share-icon {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.updated {
  padding: 5px 10px;
  font-size: 12px;
  color: #888;
}

.stopped-time {
  margin-left: 15px;
}

.text-danger {
  color: red !important;
}

.address-container {
  padding: 10px;
}

.address {
  font-size: 13px;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

.address-footer {
  display: flex;
  align-items: center;
  margin-top: 8px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.address-footer-text {
  margin-right: 5px;
}

.address-footer-icon {
  margin-right: 4px;
}

.address-footer-date {
  color: var(--el-text-color-secondary);
}

.no-position {
  text-align: center;
}

.p-10 {
  padding: 10px;
}
</style>
