<template>
  <div class="odometer-hours-section">
    <!-- Odometer Display -->
    <template v-if="displayMode === 'odometer' || displayMode === 'both'">
      <div class="stats-block flex-1 text-center">
        <div class="stat-label-lg mt-20">
          <div class="subtitle"><i class="fas fa-road"></i> {{ KT('device.distance') }}</div>
        </div>
        <div class="stat-value-odometer">
          <div class="odometer-display">
            <template v-for="(digit, index) in odometerDigits" :key="index">
              <div class="odometer-digit">
                {{ digit }}
              </div>
            </template>
            <div class="odometer-unit">
              {{ distanceUnit }}
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <!-- Hours Display -->
    <template v-if="displayMode === 'hours' || displayMode === 'both'">
      <div class="stats-block flex-1 text-center" :class="{ 'border-left-dotted': displayMode === 'both' }">
        <div class="mt-20" :class="displayMode === 'both' ? 'stat-label-sm' : 'stat-label-lg'">
          <div class="subtitle"><i class="fas fa-clock"></i> {{ KT('device.hoursMovement') }}</div>
        </div>
        <div :class="displayMode === 'both' ? 'stat-value-hours-sm' : 'stat-value-hours'">
          <div class="hours-display">
            <template v-if="hoursValue">
              <template v-for="(digit, index) in hoursDigits" :key="index">
                <div :class="displayMode === 'both' ? 'hours-digit-sm' : 'hours-digit'">
                  {{ digit }}
                </div>
              </template>
            </template>
            <template v-else>
              <div :class="displayMode === 'both' ? 'hours-digit-sm' : 'hours-digit'">
                0
              </div>
            </template>
            <div :class="displayMode === 'both' ? 'hours-unit-sm' : 'hours-unit'">
              hs
            </div>
          </div>
        </div>
      </div>
    </template>
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
  displayMode: {
    type: String,
    default: 'both', // 'odometer', 'hours', or 'both'
    validator: (value) => ['odometer', 'hours', 'both'].includes(value)
  },
  distanceUnit: {
    type: String,
    default: 'km'
  }
});

const odometerValue = computed(() => {
  if (!props.position?.attributes?.totalDistance) return 0;
  
  const totalDistance = props.position.attributes.totalDistance;
  
  if (props.distanceUnit === 'km') {
    return totalDistance / 1000;
  } else if (props.distanceUnit === 'mi') {
    return totalDistance / 1609.34;
  }
  return totalDistance;
});

const odometerDigits = computed(() => {
  return Math.floor(odometerValue.value).toString().split('');
});

const hoursValue = computed(() => {
  return props.position?.attributes?.hours || 0;
});

const hoursDigits = computed(() => {
  return Math.round(hoursValue.value / 3600000).toString().split('');
});
</script>

<style scoped>
.odometer-hours-section {
  display: flex;
  width: 100%;
}

.stats-block {
  padding: 10px;
}

.flex-1 {
  flex: 1;
}

.text-center {
  text-align: center;
}

.mt-20 {
  margin-top: 20px;
}

.border-left-dotted {
  border-left: var(--el-border-color-light) 1px dotted;
}

.subtitle {
  text-transform: uppercase;
  font-size: 11px;
  color: var(--el-text-color-regular);
}

.stat-label-lg {
  font-size: 14px;
}

.stat-label-sm {
  font-size: 12px;
}

.stat-value-odometer,
.stat-value-hours {
  margin-top: 15px;
  margin-bottom: 20px;
}

.stat-value-hours-sm {
  margin-top: 10px;
  margin-bottom: 15px;
}

.odometer-display,
.hours-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
}

.odometer-digit {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: #00ff88;
  font-family: 'Courier New', monospace;
  font-size: 24px;
  font-weight: bold;
  padding: 8px 10px;
  border-radius: 4px;
  min-width: 28px;
  text-align: center;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hours-digit {
  background: linear-gradient(180deg, #2d2d44 0%, #1a1a2e 100%);
  color: #4fc3f7;
  font-family: 'Courier New', monospace;
  font-size: 22px;
  font-weight: bold;
  padding: 6px 8px;
  border-radius: 4px;
  min-width: 24px;
  text-align: center;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hours-digit-sm {
  background: linear-gradient(180deg, #2d2d44 0%, #1a1a2e 100%);
  color: #4fc3f7;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: bold;
  padding: 4px 6px;
  border-radius: 4px;
  min-width: 20px;
  text-align: center;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.odometer-unit,
.hours-unit {
  font-size: 14px;
  font-weight: bold;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
  text-transform: uppercase;
}

.hours-unit-sm {
  font-size: 12px;
  font-weight: bold;
  color: var(--el-text-color-secondary);
  margin-left: 6px;
  text-transform: uppercase;
}
</style>
