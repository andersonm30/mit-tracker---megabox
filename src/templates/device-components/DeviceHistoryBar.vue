<template>
  <div class="history-section">
    <!-- History Title -->
    <div class="subtitle">
      <i class="fas fa-history"></i> {{ KT('device.historyPosition') }}
    </div>

    <!-- History Bar -->
    <div class="history-bar">
      <div
        v-for="segment in historyData"
        :key="`${segment.start}:${segment.motion ? 'm' : 's'}`"
        @mouseleave="hideTip"
        @mouseenter.stop="showTip($event, getSegmentTooltip(segment))"
        @click="$emit('goToReport', index)"
        class="history-segment"
        :class="{ 'history-segment-motion': segment.motion }"
        :style="{ width: segment.width + '%', left: segment.position + '%' }">
        &nbsp;
      </div>
    </div>
  </div>
</template>

<script setup>
import KT from '../../tarkan/func/kt.js';

defineProps({
  historyData: {
    type: Array,
    default: () => []
  }
});

defineEmits(['goToReport']);

const getSegmentTooltip = (segment) => {
  const motionText = segment.motion ? KT('device.motion') : KT('device.stopped');
  const durationMins = Math.round(segment.duration / 60000);
  return `${motionText} ${durationMins} mins`;
};

const showTip = (evt, text) => {
  window.$showTip(evt, text);
};

const hideTip = (evt, text) => {
  window.$hideTip(evt, text);
};
</script>

<style scoped>
.history-section {
  width: 100%;
}

.subtitle {
  padding: 7px 10px;
  border-bottom: 1px solid var(--el-border-color-light);
  text-transform: uppercase;
  font-size: 11px;
  color: var(--el-text-color-regular);
}

.history-bar {
  position: relative;
  height: 30px;
  background-color: var(--el-fill-color-light);
  margin: 10px;
  border-radius: 4px;
  overflow: hidden;
}

.history-segment {
  position: absolute;
  top: 0;
  height: 100%;
  background-color: var(--el-color-danger-light-5);
  cursor: pointer;
  transition: opacity 0.2s;
}

.history-segment:hover {
  opacity: 0.8;
}

.history-segment-motion {
  background-color: var(--el-color-success-light-5);
}
</style>
