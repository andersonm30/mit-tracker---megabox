<template>
  <div class="device-main-info">
    <!-- Device Image -->
    <div class="Device-Image" v-if="deviceImage">
      <img 
        :src="deviceImage" 
        :alt="device.name"
        class="device-image-img" />
    </div>

    <!-- Speed Block -->
    <div class="border-bottom-dotted">
      <div class="stat-label mt-10">
        <i class="fas fa-tachometer-alt"></i> {{ KT('device.positionSpeed') }}
      </div>
      <div class="stat-value-primary mt-10 mb-10">
        {{ speedFormatted }}
      </div>

      <!-- RPM Block -->
      <div v-if="hasRpm" class="border-bottom-dotted">
        <div class="stat-label mt-10">
          <i class="fas fa-tachometer-alt"></i> {{ KT('device.rpm') }}
        </div>
        <div class="stat-value-primary mt-10 mb-10">
          {{ rpmValue }} {{ "RPM" }}
        </div>
      </div>
    </div>

    <!-- Plate Block -->
    <div>
      <div class="stat-label mt-10">
        <i class="fas fa-address-card"></i> {{ KT('device.plate') }}
      </div>
      <div class="stat-value-primary mt-10 mb-10">
        {{ plateValue }}
      </div>
    </div>

    <!-- Model Block -->
    <div class="border-top-dotted">
      <div class="stat-label mt-10">
        <i class="fas fa-car"></i> {{ KT('device.model') }}
      </div>
      <div class="stat-value-primary mt-10 mb-10">
        {{ modelValue }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import KT from '../../tarkan/func/kt.js';

const props = defineProps({
  device: {
    type: Object,
    required: true
  },
  position: {
    type: Object,
    default: null
  },
  speedUnit: {
    type: String,
    default: 'km'
  }
});

const deviceImage = computed(() => {
  if (props.device?.attributes?.deviceImage) {
    return `/tarkan/assets/images/devices/${props.device.attributes.deviceImage}`;
  }
  return null;
});

const hasRpm = computed(() => {
  return props.position && props.position.attributes?.['rpm'];
});

const rpmValue = computed(() => {
  return props.position?.attributes?.['rpm'] || 0;
});

const speedFormatted = computed(() => {
  const speed = props.position?.speed || 0;
  // Speed conversion is handled by parent via $t()
  return `${Math.round(speed)} ${props.speedUnit}`;
});

const plateValue = computed(() => {
  return props.device?.attributes?.['placa'] || '--';
});

const modelValue = computed(() => {
  return props.device?.model || '--';
});
</script>

<style scoped>
.device-main-info {
  width: 100%;
}

.Device-Image {
  display: flex;
  justify-content: center;
  padding: 10px;
}

.device-image-img {
  max-width: 100%;
  max-height: 150px;
  object-fit: contain;
  border-radius: 8px;
}

.border-bottom-dotted {
  border-bottom: var(--el-border-color-light) 1px dotted;
}

.border-top-dotted {
  border-top: var(--el-border-color-light) 1px dotted;
}

.stat-label {
  text-transform: uppercase;
  font-size: 11px;
  color: var(--el-text-color-regular);
}

.stat-value-primary {
  font-size: 20px;
  color: var(--el-color-primary);
}

.mt-10 {
  margin-top: 10px;
}

.mb-10 {
  margin-bottom: 10px;
}
</style>
