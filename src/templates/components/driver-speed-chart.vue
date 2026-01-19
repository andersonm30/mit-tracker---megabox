<template>
  <div class="driver-speed-chart">
    <!-- Loading State -->
    <div v-if="isLoading" class="chart-loading">
      <el-skeleton animated :rows="4" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!hasSeries" class="chart-empty">
      <el-empty description="Sem dados de velocidade no período" />
    </div>

    <!-- Chart SVG -->
    <div v-else class="chart-wrapper">
      <svg 
        ref="svgRef"
        :width="chartWidth" 
        :height="computedHeight"
        class="speed-chart"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <!-- Grid lines (horizontal) -->
        <g class="grid">
          <line 
            v-for="(tick, i) in yTicks" 
            :key="`grid-${i}`"
            :x1="padding.left" 
            :y1="tick.y" 
            :x2="chartWidth - padding.right" 
            :y2="tick.y"
            stroke="#e4e7ed"
            stroke-width="1"
            stroke-dasharray="4 4"
          />
        </g>

        <!-- Y Axis labels -->
        <g class="y-axis">
          <text 
            v-for="(tick, i) in yTicks" 
            :key="`y-tick-${i}`"
            :x="padding.left - 10" 
            :y="tick.y + 5"
            text-anchor="end"
            font-size="12"
            fill="#606266"
          >
            {{ tick.label }}
          </text>
        </g>

        <!-- X Axis labels -->
        <g class="x-axis">
          <text 
            v-for="(tick, i) in xTicks" 
            :key="`x-tick-${i}`"
            :x="tick.x" 
            :y="chartHeight - padding.bottom + 20"
            text-anchor="middle"
            font-size="11"
            fill="#606266"
          >
            {{ tick.label }}
          </text>
        </g>

        <!-- Speed line (polyline) -->
        <polyline
          :points="polylinePoints"
          fill="none"
          stroke="#409EFF"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <!-- Fill area under line -->
        <polygon
          :points="fillAreaPoints"
          fill="rgba(64, 158, 255, 0.1)"
        />

        <!-- Hover indicator -->
        <g v-if="hoverPoint" class="hover-indicator">
          <circle
            :cx="hoverPoint.x"
            :cy="hoverPoint.y"
            r="4"
            fill="#409EFF"
            stroke="white"
            stroke-width="2"
          />
          <line
            :x1="hoverPoint.x"
            :y1="padding.top"
            :x2="hoverPoint.x"
            :y2="chartHeight - padding.bottom"
            stroke="#409EFF"
            stroke-width="1"
            stroke-dasharray="4 4"
            opacity="0.5"
          />
        </g>
      </svg>

      <!-- Tooltip -->
      <div 
        v-if="tooltip.visible" 
        class="chart-tooltip"
        :style="tooltipStyle"
      >
        <div class="tooltip-time">{{ tooltip.time }}</div>
        <div class="tooltip-speed">{{ tooltip.speed }} km/h</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';

const props = defineProps({
  series: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  height: {
    type: Number,
    default: 200
  }
});

// Refs
const svgRef = ref(null);
const chartWidth = ref(800);
const hoverPoint = ref(null);
const tooltip = ref({
  visible: false,
  time: '',
  speed: '',
  x: 0,
  y: 0
});

// Constants
const padding = {
  top: 20,
  right: 20,
  bottom: 40,
  left: 50
};

const computedHeight = computed(() => props.height);

const chartHeight = computed(() => {
  return computedHeight.value;
});

// Process series data
const hasSeries = computed(() => {
  return Array.isArray(props.series) && props.series.length > 0;
});

const processedSeries = computed(() => {
  if (!hasSeries.value) return [];

  let data = [...props.series];

  // Downsample if > 800 points
  if (data.length > 800) {
    const step = Math.ceil(data.length / 500);
    data = data.filter((_, i) => i % step === 0 || i === data.length - 1);
  }

  // Normalize timestamps
  return data.map(point => {
    let timestamp;
    
    if (typeof point.t === 'number') {
      // Epoch ms
      timestamp = point.t;
    } else if (typeof point.t === 'string') {
      // ISO string
      timestamp = new Date(point.t).getTime();
    } else if (point.fixTime) {
      // Fallback to fixTime
      timestamp = new Date(point.fixTime).getTime();
    } else {
      timestamp = Date.now();
    }

    return {
      timestamp,
      speed: point.speed || point.s || 0
    };
  }).sort((a, b) => a.timestamp - b.timestamp);
});

// Scales
const xScale = computed(() => {
  if (processedSeries.value.length === 0) return { min: 0, max: 1 };
  
  const timestamps = processedSeries.value.map(p => p.timestamp);
  return {
    min: Math.min(...timestamps),
    max: Math.max(...timestamps)
  };
});

const yScale = computed(() => {
  if (processedSeries.value.length === 0) return { min: 0, max: 100 };
  
  const speeds = processedSeries.value.map(p => p.speed);
  const maxSpeed = Math.max(...speeds);
  const minSpeed = Math.min(...speeds);
  
  // Add 10% padding
  const range = maxSpeed - minSpeed;
  const padding = range * 0.1;
  
  return {
    min: Math.max(0, minSpeed - padding),
    max: maxSpeed + padding
  };
});

// Axis ticks
const yTicks = computed(() => {
  const tickCount = 5;
  const range = yScale.value.max - yScale.value.min;
  const step = range / (tickCount - 1);
  
  return Array.from({ length: tickCount }, (_, i) => {
    const value = yScale.value.min + (step * i);
    const y = mapSpeedToY(value);
    
    return {
      label: `${Math.round(value)} km/h`,
      y
    };
  }).reverse();
});

const xTicks = computed(() => {
  const tickCount = Math.min(6, processedSeries.value.length);
  if (tickCount === 0) return [];
  
  const step = Math.floor((processedSeries.value.length - 1) / (tickCount - 1));
  
  return Array.from({ length: tickCount }, (_, i) => {
    const index = i === tickCount - 1 ? processedSeries.value.length - 1 : i * step;
    const point = processedSeries.value[index];
    const x = mapTimestampToX(point.timestamp);
    
    const date = new Date(point.timestamp);
    const label = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return { label, x };
  });
});

// Mapping functions
function mapTimestampToX(timestamp) {
  const range = xScale.value.max - xScale.value.min;
  const chartWidthInner = chartWidth.value - padding.left - padding.right;
  const normalized = (timestamp - xScale.value.min) / range;
  return padding.left + (normalized * chartWidthInner);
}

function mapSpeedToY(speed) {
  const range = yScale.value.max - yScale.value.min;
  const chartHeightInner = chartHeight.value - padding.top - padding.bottom;
  const normalized = (speed - yScale.value.min) / range;
  return chartHeight.value - padding.bottom - (normalized * chartHeightInner);
}

// Polyline points
const polylinePoints = computed(() => {
  return processedSeries.value
    .map(point => {
      const x = mapTimestampToX(point.timestamp);
      const y = mapSpeedToY(point.speed);
      return `${x},${y}`;
    })
    .join(' ');
});

const fillAreaPoints = computed(() => {
  if (processedSeries.value.length === 0) return '';
  
  const points = processedSeries.value.map(point => {
    const x = mapTimestampToX(point.timestamp);
    const y = mapSpeedToY(point.speed);
    return `${x},${y}`;
  });
  
  // Close the polygon at the bottom
  const lastPoint = processedSeries.value[processedSeries.value.length - 1];
  const firstPoint = processedSeries.value[0];
  const bottomY = chartHeight.value - padding.bottom;
  
  points.push(`${mapTimestampToX(lastPoint.timestamp)},${bottomY}`);
  points.push(`${mapTimestampToX(firstPoint.timestamp)},${bottomY}`);
  
  return points.join(' ');
});

// Tooltip style
const tooltipStyle = computed(() => {
  return {
    left: `${tooltip.value.x}px`,
    top: `${tooltip.value.y}px`
  };
});

// Event handlers
function handleMouseMove(event) {
  if (!svgRef.value || processedSeries.value.length === 0) return;
  
  const rect = svgRef.value.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  
  // Find closest point
  let closestIndex = 0;
  let minDistance = Infinity;
  
  processedSeries.value.forEach((point, index) => {
    const x = mapTimestampToX(point.timestamp);
    const distance = Math.abs(x - mouseX);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });
  
  const point = processedSeries.value[closestIndex];
  const x = mapTimestampToX(point.timestamp);
  const y = mapSpeedToY(point.speed);
  
  hoverPoint.value = { x, y };
  
  const date = new Date(point.timestamp);
  tooltip.value = {
    visible: true,
    time: date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }),
    speed: point.speed.toFixed(1),
    x: x + rect.left,
    y: y + rect.top - 60
  };
}

function handleMouseLeave() {
  hoverPoint.value = null;
  tooltip.value.visible = false;
}

// Responsive width
function updateWidth() {
  if (svgRef.value) {
    const parent = svgRef.value.parentElement;
    if (parent) {
      chartWidth.value = parent.clientWidth;
    }
  }
}

onMounted(() => {
  nextTick(() => {
    updateWidth();
    window.addEventListener('resize', updateWidth);
  });
});

watch(() => props.series, () => {
  nextTick(updateWidth);
});
</script>

<style scoped>
.driver-speed-chart {
  width: 100%;
  position: relative;
}

.chart-loading {
  padding: 20px;
}

.chart-empty {
  padding: 40px 20px;
}

.chart-wrapper {
  width: 100%;
  position: relative;
  overflow: hidden;
}

.speed-chart {
  display: block;
  width: 100%;
}

.chart-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 9999;
  transform: translateX(-50%);
  white-space: nowrap;
}

.tooltip-time {
  font-weight: 500;
  margin-bottom: 4px;
}

.tooltip-speed {
  font-size: 14px;
  font-weight: bold;
  color: #409EFF;
}

/* Responsive */
@media (max-width: 768px) {
  .speed-chart {
    font-size: 10px;
  }
  
  .chart-tooltip {
    font-size: 11px;
  }
}
</style>
