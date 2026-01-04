<template>
  <div 
    class="info fuel-temp-section" 
    v-if="hasFuelOrTemperature"
    data-testid="device-fuel-temperature"
  >
    <!-- Fuel Level -->
    <div v-if="hasFuel" class="fuel-temp-block border-right-dotted">
      <div class="stat-label mt-20">
        <i class="fas fa-gas-pump"></i> {{ KT('device.fuel') }}
      </div>
      <div class="stat-value-primary mt-10 mb-20">
        {{ fuelFormatted }} {{ volumeUnit }}
      </div>
    </div>
    
    <!-- Fuel Cost -->
    <div v-if="hasFuel" class="fuel-temp-block border-right-dotted">
      <div class="stat-label mt-20">
        <i class="fas fa-gas-pump"></i> {{ KT('device.spentFuel') }}
      </div>
      <div class="stat-value-primary mt-10 mb-20">
        {{ fuelCostFormatted }} {{ currency }}
      </div>
      <div 
        class="reset-link" 
        role="button"
        tabindex="0"
        :aria-label="KT('device.zeroodometrocombustible')"
        @click="$emit('reset-odometer')"
        @keydown.enter="$emit('reset-odometer')"
        @keydown.space.prevent="$emit('reset-odometer')"
      >
        {{ KT('device.zeroodometrocombustible') }}
      </div>
    </div>
    
    <!-- Temperature -->
    <div v-if="hasTemperature" class="fuel-temp-block">
      <div class="stat-label mt-20">
        <i class="fas fa-thermometer-full"></i> {{ KT('device.temperature') }}
      </div>
      <div class="stat-value-primary mt-10 mb-20">
        {{ temperatureFormatted }} {{ temperatureUnit }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue';

const KT = inject('KT');

const props = defineProps({
  position: {
    type: Object,
    default: null
  },
  fuelPrice: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: '$'
  },
  volumeUnit: {
    type: String,
    default: 'L'
  },
  temperatureUnit: {
    type: String,
    default: 'ºc'
  }
});

defineEmits(['reset-odometer']);

// Computed
const hasFuel = computed(() => {
  return props.position?.attributes?.fuel != null;
});

const hasTemperature = computed(() => {
  return props.position?.attributes?.temperature != null;
});

const hasFuelOrTemperature = computed(() => {
  return hasFuel.value || hasTemperature.value;
});

const fuelFormatted = computed(() => {
  if (!hasFuel.value) return '0.00';
  return parseFloat(props.position.attributes.fuel).toFixed(2);
});

const fuelCostFormatted = computed(() => {
  if (!hasFuel.value) return '0.00';
  const fuel = parseFloat(props.position.attributes.fuel) || 0;
  const price = props.fuelPrice || 0;
  return (fuel * price).toFixed(2);
});

const temperatureFormatted = computed(() => {
  if (!hasTemperature.value) return '0.00';
  return parseFloat(props.position.attributes.temperature).toFixed(2);
});
</script>

<style scoped>
/* Estilos movidos do parent - manter iguais */
.fuel-temp-section {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}

.fuel-temp-block {
  flex: 1;
  min-width: 100px;
  text-align: center;
  padding: 0 10px;
}

.reset-link {
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 12px;
  text-decoration: underline;
}

.reset-link:hover {
  color: var(--el-color-primary-light-3);
}
</style>
