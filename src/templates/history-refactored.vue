<template>
  <el-card class="history-card" shadow="hover">
  <div class="history-form">
  <el-form>
    <!-- Linha 1: Dispositivo -->
    <el-form-item>
      <div class="form-group">
        <label for="theInputDevice">{{ $t('device.select') }}</label>
        <el-select 
          v-model="formData.deviceId" 
          :value-key="'id'" 
          filterable 
          :placeholder="$t('device.device')" 
          :size="'large'" 
          :no-data-text="$t('NO_DATA_TEXT')" 
          :no-match-text="$t('NO_MATCH_TEXT')"
        >
          <el-option
            v-for="item in devicesList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </div>
    </el-form-item>

    <!-- Linha 2: Período -->
    <el-form-item>
      <div class="form-group">
        <label>{{ $t('startDate') }}</label>
        <el-date-picker
          v-model="formData.date"
          type="datetimerange"
          :range-separator="$t('report.to')"
          :start-placeholder="$t('startDate')"
          :end-placeholder="$t('endDate')"
          :shortcuts="dateShortcuts"
          style="width: 100%;"
        />
      </div>
    </el-form-item>

    <!-- Linha 3: Opções de Visualização -->
    <div class="view-options">
      <span class="view-options-label">
        <i class="fas fa-eye"></i> {{ $t('report.visualization') }}:
      </span>
      <el-switch v-model="showRouteMarkers" :active-text="$t('report.showMarkers')" />
      <el-switch v-model="showHeatmap" :active-text="$t('report.showMapadeCalor')" />
      
      <!-- Seletor de Cor da Rota -->
      <div class="route-color-selector">
        <span class="color-label">{{ $t('report.routeColor') }}:</span>
        <el-select 
          v-model="currentRouteColor" 
          size="small" 
          style="width: 130px;"
          @change="handleRouteColorChange"
        >
          <el-option
            v-for="option in routeColorOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          >
            <span class="color-option">
              <span class="color-swatch" :style="{ backgroundColor: option.value }"></span>
              {{ option.label }}
            </span>
          </el-option>
        </el-select>
      </div>
    </div>
  </el-form>

  <!-- Linha 4: Ações (sticky) -->
  <div class="history-actions">
      <el-dropdown trigger="click" @command="handleExport" :disabled="!isFormValid">
        <el-button type="info" :disabled="!isFormValid">
          <i class="fas fa-download"></i> {{ $t('export.label') }}
          <i class="el-icon--right fas fa-angle-down"></i>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="pdf">
              <i class="fas fa-file-pdf"></i> {{ $t('report.pdf') }}
            </el-dropdown-item>
            <el-dropdown-item command="excel">
              <i class="fas fa-file-excel"></i> {{ $t('report.excel') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button
        @mouseleave="hideTip" 
        @mouseenter.stop="showTip($event, $t('device.routes'))"
        type="primary" 
        @click="loadRoute()"
        :disabled="!isFormValid"
        :loading="isLoading"
      >
        <i v-if="!isLoading" class="fas fa-route"></i> {{ $t('report.show') }}
      </el-button>
      <el-button
        @mouseleave="hideTip" 
        @mouseenter.stop="showTip($event, $t('device.graphic'))"
        type="success" 
        @click="loadGraph()"
        :disabled="!isFormValid"
      >
        <i class="fas fa-chart-bar"></i> {{ $t('report.chart') }}
      </el-button>
    </div>
  </div>
  </el-card> 

  <!-- Cartões de Estatísticas -->
  <el-card v-if="routePoints.length > 0" class="stats-card" shadow="never">
    <template #header>
      <div class="stats-header">
        <div class="stats-title">
          <i class="fas fa-chart-line"></i> {{ $t('report.statistics') }}
        </div>
        <div v-if="currentDriverName" class="driver-pill">
          <i class="fas fa-user"></i> {{ $t('device.driver') }}: {{ currentDriverName }}
        </div>
      </div>
    </template>
    <div class="stats-container">
      <div class="stat-box">
        <div class="stat-content">
          <i class="fas fa-route stat-icon stat-icon-primary"></i>
          <div class="stat-info">
            <div class="stat-label">{{ $t('report.totalDistance') }}</div>
            <div class="stat-value">{{ stats.totalDistance }} km</div>
          </div>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-content">
          <i class="fas fa-tachometer-alt stat-icon stat-icon-success"></i>
          <div class="stat-info">
            <div class="stat-label">{{ $t('report.avgSpeed') }}</div>
            <div class="stat-value">{{ stats.avgSpeed }} km/h</div>
          </div>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-content">
          <i class="fas fa-clock stat-icon stat-icon-warning"></i>
          <div class="stat-info">
            <div class="stat-label">{{ $t('report.tripDuration') }}</div>
            <div class="stat-value">{{ stats.duration }}</div>
          </div>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-content">
          <i class="fas fa-pause-circle stat-icon stat-icon-danger"></i>
          <div class="stat-info">
            <div class="stat-label">{{ $t('report.stopTime') }}</div>
            <div class="stat-value">{{ stats.stopTime }}</div>
          </div>
        </div>
      </div>
    </div>
  </el-card>

  <!-- Filtros da Timeline -->
  <el-card v-if="routePoints.length > 0" class="timeline-filters" shadow="never" style="margin-top: 16px;">
    <template #header>
      <div style="font-weight: bold;">
        <i class="fas fa-filter"></i> {{ $t('report.filters') }}
      </div>
    </template>
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px;">
          <label style="font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; display: block;">
            <i class="fas fa-search"></i> {{ $t('report.searchLabel') }}
          </label>
          <el-input
            v-model="searchQuery"
            :placeholder="$t('report.searchAddress')"
            clearable
          >
            <template #prefix>
              <i class="fas fa-search"></i>
            </template>
          </el-input>
        </div>
        <div style="min-width: 200px;">
          <label style="font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; display: block;">
            <i class="fas fa-list"></i> {{ $t('report.eventType') }}
          </label>
          <el-select
            v-model="eventFilter"
            :placeholder="$t('report.filterByEvent')"
            style="width: 100%;"
            @change="onEventFilterChange"
          >
            <el-option :label="$t('report.all')" value="all" />
            <el-option :label="$t('report.moving')" value="moving" />
            <el-option :label="$t('report.stopped')" value="stopped" />
            <el-option :label="$t('report.fastSpeed')" value="fast" />
          </el-select>
        </div>
        <div v-if="eventFilter === 'fast'" style="min-width: 180px;">
          <label style="font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; display: block;">
            <i class="fas fa-tachometer-alt"></i> {{ $t('report.insertSpeed') }}
          </label>
          <el-input-number
            v-model="customSpeed"
            :min="1"
            :max="300"
            :controls="true"
            style="width: 100%;"
          />
          <span style="font-size: 11px; color: var(--el-text-color-secondary); margin-left: 4px;">km/h</span>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--el-border-color-lighter);">
        <el-switch
          v-model="removeDuplicates"
          :active-text="$t('report.removeDuplicates')"
        />
        <div style="font-size: 13px; color: var(--el-text-color-regular); font-weight: 500;">
          <i class="fas fa-map-marker-alt"></i> 
          <span v-if="filteredRoutePoints.length !== routePoints.length">
            {{ filteredRoutePoints.length }} / {{ routePoints.length }} {{ $t('report.points') }}
          </span>
          <span v-else>
            {{ routePoints.length }} {{ $t('report.points') }}
          </span>
        </div>
      </div>
    </div>
  </el-card>

  <!-- Timeline Container -->
  <div class="timeline-container" :key="timelineKey">
    <template v-if="loadingState === 'loading'">
      <div class="timeline-message">
        <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 8px;"></i>
        <div>{{ $t('LOADING') }}</div>
      </div>
    </template>
    <template v-else-if="loadingState === 'export_ok'">
      <div class="timeline-message">
        <i class="fas fa-check-circle" style="font-size: 24px; margin-bottom: 8px; color: var(--el-color-success);"></i>
        <div>{{ $t('device.ExportOK') }}</div>
      </div>
    </template>
    <template v-else-if="loadingState === 'error'">
      <div class="timeline-message" style="color: var(--el-color-danger);">
        <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 8px;"></i>
        <div>{{ $t('report.loadError') }}</div>
      </div>
    </template>
    <template v-else-if="routePoints.length === 0">
      <div class="timeline-message">{{ $t('route.empty') }}</div>
    </template>
    <template v-else>
      <!-- Ponto Inicial (Start) -->
      <TimelinePoint
        v-if="routePoints.length > 0"
        :point="routePoints[0]"
        :index="0"
        type="start"
        :speed-unit="speedUnit"
      />

      <!-- Pontos Intermediários (Middle) - Com Virtualização -->
      <div 
        v-if="filteredRoutePoints.length > 2" 
        ref="timelineScrollRef"
        class="timeline-scroll"
        @scroll="onTimelineScroll"
      >
        <!-- Spacer para altura total virtual -->
        <div :style="virtualScrollState.spacerStyle">
          <!-- Wrapper dos itens visíveis posicionado absolutamente -->
          <div :style="virtualScrollState.itemsWrapperStyle">
            <TimelinePoint
              v-for="{ item, realIndex } in visibleMiddlePoints"
              :key="item.id || realIndex"
              :point="item"
              :index="realIndex"
              type="middle"
              :is-active="isPlayingRoute && realIndex === currentPlayingPoint"
              :is-visited="isPlayingRoute && realIndex < currentPlayingPoint"
              :speed-unit="speedUnit"
            />
          </div>
        </div>
      </div>

      <!-- Ponto Final (End) -->
      <TimelinePoint
        v-if="routePoints.length > 0"
        :point="routePoints[routePoints.length - 1]"
        :index="routePoints.length - 1"
        type="end"
        :speed-unit="speedUnit"
      />
    </template>
  </div>
</template>

<script setup>
/**
 * history.vue - Componente de Histórico de Rotas
 * 
 * Refatorado para:
 * - Performance: Virtualização (windowing) para milhares de pontos
 * - Manutenibilidade: Subcomponentes TimelinePoint e PointAttributes
 * - Robustez: Controle de concorrência com requestId/AbortController
 * - Padronização: i18n consistente, sem strings hardcoded
 * - Timezone: Formatação correta de datas locais
 */

// Element Plus components
import 'element-plus/es/components/button/style/css';
import 'element-plus/es/components/icon/style/css';
import 'element-plus/es/components/tooltip/style/css';
import 'element-plus/es/components/form/style/css';
import 'element-plus/es/components/form-item/style/css';
import 'element-plus/es/components/select/style/css';
import 'element-plus/es/components/option/style/css';
import 'element-plus/es/components/switch/style/css';
import 'element-plus/es/components/input/style/css';
import 'element-plus/es/components/input-number/style/css';
import 'element-plus/es/components/message-box/style/css';
import 'element-plus/es/components/date-picker/style/css';
import 'element-plus/es/components/dropdown/style/css';
import 'element-plus/es/components/dropdown-menu/style/css';
import 'element-plus/es/components/dropdown-item/style/css';
import 'element-plus/es/components/card/style/css';
import 'element-plus/es/components/message/style/css';

import {
  ElButton, ElForm, ElSelect, ElOption, ElFormItem, ElSwitch, 
  ElInput, ElInputNumber, ElDatePicker, ElDropdown, 
  ElDropdownMenu, ElDropdownItem, ElCard, ElMessage
} from 'element-plus';

import { ref, inject, onMounted, watch, onBeforeUnmount, nextTick, computed, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

// Subcomponentes locais
import TimelinePoint from './components/TimelinePoint.vue';

// Composables
import { getDefaultDateRange } from '@/composables/useRequestControl';

// ============================================
// CONFIGURAÇÃO
// ============================================
const PERF_DEBUG = process.env.NODE_ENV === 'development' && false;
const DEBUG_HISTORY = process.env.NODE_ENV === 'development';
const DEBOUNCE_DELAY = 250; // ms para debounce de filtros

// Configuração de virtualização
const VIRTUAL_ITEM_HEIGHT = 65; // Altura estimada de cada ponto em px
const VIRTUAL_CONTAINER_HEIGHT = 400; // Altura do container de scroll
const VIRTUAL_BUFFER = 8; // Itens extras acima/abaixo do viewport

// Controle de concorrência (requestId simples)
let loadRouteRequestId = 0;

// Helpers de log
const perfLog = (label, startTime, extra = '') => {
  if (!PERF_DEBUG) return;
  const elapsed = performance.now() - startTime;
  console.log(`[PERF:history] ${label}: ${elapsed.toFixed(2)}ms ${extra}`);
};

const debugLog = (...args) => {
  if (DEBUG_HISTORY) console.log('[History]', ...args);
};

// ============================================
// INJECTS E STORE
// ============================================
const store = useStore();
const route = useRoute();
const { proxy } = getCurrentInstance();

const showGraphicsRef = inject('show-graphics');
const showRouteMarkers = inject('showRouteMarkers');
const updateRoute = inject('updateRoute');
const toggleHeatmap = inject('toggleHeatmap');
const isPlayingRoute = inject('isPlayingRoute');
const routeColorRef = inject('routeColor');
const setRouteColor = inject('setRouteColor');
const ROUTE_COLOR_OPTIONS = inject('ROUTE_COLOR_OPTIONS');

// ============================================
// REFS E ESTADO
// ============================================
const timelineScrollRef = ref(null);
const timelineKey = ref(0); // Key para forçar remount limpo

// Form data
const [defaultStart, defaultEnd] = getDefaultDateRange();
const formData = ref({ 
  deviceId: '', 
  date: [defaultStart, defaultEnd] 
});

// Estados de UI
const loadingState = ref('idle'); // 'idle' | 'loading' | 'export_ok' | 'error'
const searchQuery = ref('');
const eventFilter = ref('all');
const customSpeed = ref(80);
const removeDuplicates = ref(false);
const showHeatmap = ref(false);

// Dados da rota
const routePoints = ref([]);

// Cor da rota
const currentRouteColor = ref(
  routeColorRef?.value || localStorage.getItem('kore-route-color') || '#05a7e3'
);

// Estado de loading
const isLoading = ref(false);

// Timer de debounce
let debounceTimer = null;

// ============================================
// VIRTUALIZAÇÃO (Windowing simples)
// ============================================
const virtualScrollTop = ref(0);

// Pontos intermediários filtrados (sem primeiro e último)
const middlePoints = computed(() => {
  if (filteredRoutePoints.value.length <= 2) return [];
  return filteredRoutePoints.value.slice(1, -1);
});

// Estado da virtualização
const virtualScrollState = computed(() => {
  const totalItems = middlePoints.value.length;
  const totalHeight = totalItems * VIRTUAL_ITEM_HEIGHT;
  
  const visibleCount = Math.ceil(VIRTUAL_CONTAINER_HEIGHT / VIRTUAL_ITEM_HEIGHT) + 1;
  const startIndex = Math.max(0, Math.floor(virtualScrollTop.value / VIRTUAL_ITEM_HEIGHT) - VIRTUAL_BUFFER);
  const endIndex = Math.min(totalItems, startIndex + visibleCount + VIRTUAL_BUFFER * 2);
  const offsetTop = startIndex * VIRTUAL_ITEM_HEIGHT;
  
  return {
    startIndex,
    endIndex,
    spacerStyle: {
      height: `${totalHeight}px`,
      position: 'relative'
    },
    itemsWrapperStyle: {
      position: 'absolute',
      top: `${offsetTop}px`,
      left: 0,
      right: 0
    }
  };
});

// Pontos visíveis (slice com índice real preservado)
const visibleMiddlePoints = computed(() => {
  const { startIndex, endIndex } = virtualScrollState.value;
  const points = middlePoints.value;
  
  return points.slice(startIndex, endIndex).map((item, i) => ({
    item,
    // +1 porque o primeiro ponto (start) tem índice 0
    realIndex: startIndex + i + 1
  }));
});

// Handler de scroll para virtualização
const onTimelineScroll = (event) => {
  virtualScrollTop.value = event.target.scrollTop;
};

// Scroll para ponto específico (sync com mapa)
const scrollToActivePoint = (index) => {
  if (!timelineScrollRef.value) return;
  
  // Ajustar índice para o container virtual (subtrair 1 pelo start)
  const virtualIndex = index - 1;
  const targetTop = virtualIndex * VIRTUAL_ITEM_HEIGHT - (VIRTUAL_CONTAINER_HEIGHT / 2) + (VIRTUAL_ITEM_HEIGHT / 2);
  
  timelineScrollRef.value.scrollTo({
    top: Math.max(0, targetTop),
    behavior: 'smooth'
  });
  
  debugLog(`Scroll para ponto ${index}`);
};

// ============================================
// COMPUTED
// ============================================

// Ponto atual sendo reproduzido no mapa
const currentPlayingPoint = computed(() => {
  return store.state.devices?.routePlayPoint || 0;
});

// Unidade de velocidade do servidor
const speedUnit = computed(() => {
  return store.getters['server/getAttribute']('speedUnit', 'speedUnit');
});

// Lista de dispositivos normalizada
const devicesList = computed(() => {
  const raw =
    store.state.devices?.deviceList ??
    store.state.devices?.devicesList ??
    store.state.devices?.list ??
    store.state.devices?.devices ??
    [];

  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.list)) return raw.list;
  if (raw && typeof raw === 'object') return Object.values(raw);
  return [];
});

// Validação do formulário
const isFormValid = computed(() => {
  return !!(formData.value.deviceId && formData.value.date?.[0] && formData.value.date?.[1]);
});

// Dispositivo selecionado
const selectedDevice = computed(() => {
  const id = Number(formData.value.deviceId);
  if (!id) return null;
  return devicesList.value.find(d => Number(d.id) === id) || null;
});

// Nome do motorista atual
const currentDriverName = computed(() => {
  const dev = selectedDevice.value;
  if (!dev) return null;

  const posGetter = store.getters['devices/getPosition'];
  const pos = typeof posGetter === 'function' ? posGetter(dev.id) : null;
  const attrs = pos?.attributes || dev?.attributes || {};

  const driverUniqueId = attrs.driverUniqueId || attrs.driver_unique_id || dev?.driverUniqueId;
  const driverId = attrs.driverId || attrs.driver_id || dev?.driverId;

  // Tentar getters do store
  const byUnique = store.getters['drivers/getDriverByUniqueId'];
  if (driverUniqueId && typeof byUnique === 'function') {
    const d = byUnique(driverUniqueId);
    if (d) return d.name || d.uniqueId || driverUniqueId;
  }

  const byId = store.getters['drivers/getDriverById'];
  if (driverId && typeof byId === 'function') {
    const d = byId(driverId);
    if (d) return d.name || d.uniqueId || String(driverId);
  }

  // Fallback: buscar em listas do state
  const driversRaw = store.state.drivers?.driversList ?? store.state.drivers?.list ?? [];
  const drivers = Array.isArray(driversRaw) ? driversRaw : Object.values(driversRaw || {});

  if (driverUniqueId) {
    const d = drivers.find(x => x?.uniqueId === driverUniqueId);
    if (d) return d.name || d.uniqueId || driverUniqueId;
  }

  if (driverId) {
    const d = drivers.find(x => Number(x?.id) === Number(driverId));
    if (d) return d.name || d.uniqueId || String(driverId);
  }

  return driverUniqueId || (driverId ? String(driverId) : null);
});

// Pontos filtrados (busca, tipo de evento, duplicatas)
const filteredRoutePoints = computed(() => {
  const perfStart = PERF_DEBUG ? performance.now() : 0;
  let points = routePoints.value;
  
  // Filtrar por endereço
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    points = points.filter(p => 
      (p.address && p.address.toLowerCase().includes(search)) ||
      `${p.latitude},${p.longitude}`.includes(search)
    );
  }
  
  // Filtrar por tipo de evento
  if (eventFilter.value === 'moving') {
    points = points.filter(p => p.speed > 1);
  } else if (eventFilter.value === 'stopped') {
    points = points.filter(p => p.speed <= 1);
  } else if (eventFilter.value === 'fast') {
    points = points.filter(p => p.speed >= customSpeed.value);
  }
  
  // Remover duplicatas se habilitado
  if (removeDuplicates.value && points.length > 0) {
    const uniquePoints = [];
    let lastPoint = null;
    
    for (const point of points) {
      if (!lastPoint || 
          lastPoint.latitude !== point.latitude || 
          lastPoint.longitude !== point.longitude) {
        uniquePoints.push(point);
        lastPoint = point;
      }
    }
    points = uniquePoints;
  }
  
  perfLog('filteredRoutePoints', perfStart, `input:${routePoints.value.length} output:${points.length}`);
  return points;
});

// Estatísticas calculadas (memoizadas)
const stats = computed(() => {
  if (routePoints.value.length === 0) {
    return { totalDistance: '0.00', avgSpeed: '0.00', duration: '0h 0m', stopTime: '0h 0m' };
  }
  
  return {
    totalDistance: calculateTotalDistance(),
    avgSpeed: calculateAvgSpeed(),
    duration: calculateDuration(),
    stopTime: calculateStopTime()
  };
});

// Opções de cores da rota (i18n)
const colorKeyMap = {
  '#05a7e3': 'colorBlue',
  '#FF5733': 'colorOrange',
  '#28a745': 'colorGreen',
  '#dc3545': 'colorRed',
  '#6f42c1': 'colorPurple',
  '#fd7e14': 'colorYellow',
  '#20c997': 'colorTurquoise',
  '#e83e8c': 'colorPink'
};

const routeColorOptions = computed(() => {
  const baseOptions = ROUTE_COLOR_OPTIONS || [
    { value: '#05a7e3' },
    { value: '#FF5733' },
    { value: '#28a745' },
    { value: '#dc3545' },
    { value: '#6f42c1' },
    { value: '#fd7e14' },
    { value: '#20c997' },
    { value: '#e83e8c' }
  ];
  return baseOptions.map(opt => ({
    value: opt.value,
    label: proxy.$t(`report.${colorKeyMap[opt.value] || 'colorBlue'}`)
  }));
});

// Atalhos de data
const dateShortcuts = [
  {
    text: proxy.$t('now', 'Hoje'),
    value: () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return [start, new Date()];
    }
  },
  {
    text: proxy.$t('report.yesterday', 'Ontem'),
    value: () => {
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: proxy.$t('report.lastWeek', 'Última semana'),
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    }
  },
  {
    text: proxy.$t('report.lastMonth', 'Último mês'),
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    }
  }
];

// ============================================
// MÉTODOS
// ============================================

const showTip = (evt, text) => window.$showTip?.(evt, text);
const hideTip = (evt, text) => window.$hideTip?.(evt, text);

// Sync form com store de reports
const sendDataToStore = () => {
  const { deviceId, date } = formData.value;
  if (!deviceId || !date?.[0] || !date?.[1]) return;
  store.dispatch('reports/updateReportData', { deviceId, date: [date[0], date[1]] });
};

// Validação antes de carregar/exportar
const validateForm = () => {
  if (!formData.value.deviceId) {
    ElMessage.warning(proxy.$t('report.selectDevice', 'Selecione um dispositivo'));
    return false;
  }
  
  if (!formData.value.date?.[0] || !formData.value.date?.[1]) {
    ElMessage.warning(proxy.$t('report.selectPeriod', 'Selecione o período'));
    return false;
  }
  
  const startDate = new Date(formData.value.date[0]);
  const endDate = new Date(formData.value.date[1]);
  
  if (endDate <= startDate) {
    ElMessage.warning(proxy.$t('report.invalidPeriod', 'A data final deve ser maior que a data inicial'));
    return false;
  }
  
  const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  if (diffDays > 31) {
    ElMessage.warning(proxy.$t('report.maxPeriodDays', 'O período máximo permitido é de 31 dias').replace('{days}', '31'));
    return false;
  }
  
  return true;
};

// Atualizar rota no mapa com pontos filtrados
const updateMapRoute = () => {
  const coords = filteredRoutePoints.value.map(p => [p.latitude, p.longitude, p.id, p.course]);
  updateRoute(coords);
};

// Carregar rota do backend (com controle de concorrência via requestId)
const loadRoute = async (showGraphAfter = false) => {
  if (!validateForm()) return;
  
  const perfStart = PERF_DEBUG ? performance.now() : 0;
  loadingState.value = 'loading';
  isLoading.value = true;
  
  // Incrementar key para forçar remount limpo do container
  timelineKey.value++;
  
  // Controle de concorrência: guardar ID deste request
  const thisRequestId = ++loadRouteRequestId;
  
  const deviceId = formData.value.deviceId;
  const startDate = formData.value.date[0];
  const endDate = formData.value.date[1];
  
  debugLog(`loadRoute: device=${deviceId}, start=${startDate}, end=${endDate}, requestId=${thisRequestId}`);
  
  try {
    const $traccar = window.$traccar;
    const response = await $traccar.loadRoute(deviceId, startDate, endDate, false);
    
    // Verificar se ainda é o request mais recente (evita race condition)
    if (thisRequestId !== loadRouteRequestId) {
      debugLog(`loadRoute ignorado: requestId=${thisRequestId} superado por ${loadRouteRequestId}`);
      return;
    }
    
    perfLog('loadRoute API', perfStart, `points:${response.data.length}`);
    
    routePoints.value = response.data;
    updateMapRoute();
    
    // Ocultar outros devices para focar neste
    await nextTick();
    store.dispatch('devices/setDeviceFilter', deviceId);
    
    loadingState.value = 'idle';
    isLoading.value = false;
    virtualScrollTop.value = 0; // Reset scroll virtual
    
    perfLog('loadRoute render', perfStart);
    
    // Mostrar gráfico se solicitado
    if (showGraphAfter && response.data.length > 0) {
      loadGraph();
    }
  } catch (error) {
    // Verificar se ainda é o request atual antes de reportar erro
    if (thisRequestId !== loadRouteRequestId) {
      debugLog(`loadRoute erro ignorado: requestId=${thisRequestId} superado`);
      return;
    }
    
    console.error('Erro ao carregar rota:', error);
    loadingState.value = 'error';
    isLoading.value = false;
    ElMessage.error(proxy.$t('report.loadError', 'Erro ao carregar dados'));
    
    // Voltar ao idle após 3s
    setTimeout(() => {
      if (loadingState.value === 'error') loadingState.value = 'idle';
    }, 3000);
  }
};

// Carregar gráfico
const loadGraph = () => {
  if (routePoints.value.length === 0) {
    loadRoute(true);
  } else {
    showGraphicsRef.value?.showGraphic(routePoints.value);
  }
};

// Handler de mudança de cor da rota
const handleRouteColorChange = (color) => {
  setRouteColor?.(color);
  debugLog('Cor da rota alterada:', color);
};

// Handler de filtro de eventos
const onEventFilterChange = () => {
  if (filteredRoutePoints.value.length > 0) {
    updateMapRoute();
  }
};

// ============================================
// EXPORT: CSV e PDF
// ============================================

const getDeviceName = (deviceId) => {
  const device = devicesList.value.find(d => Number(d.id) === Number(deviceId));
  return device?.name || `Device ${deviceId}`;
};

const formatDateForFilename = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

const exportCsv = () => {
  if (filteredRoutePoints.value.length === 0) {
    ElMessage.warning(proxy.$t('route.empty', 'Sem pontos para exportar'));
    return;
  }
  if (!validateForm()) return;
  
  const deviceId = formData.value.deviceId;
  const deviceName = getDeviceName(deviceId);
  const startDate = formatDateForFilename(formData.value.date[0]);
  const endDate = formatDateForFilename(formData.value.date[1]);
  
  const headers = [
    proxy.$t('attribute.fixTime', 'Data/Hora'),
    proxy.$t('device.device', 'Dispositivo'),
    proxy.$t('attribute.latitude', 'Latitude'),
    proxy.$t('attribute.longitude', 'Longitude'),
    proxy.$t('attribute.speed', 'Velocidade (km/h)'),
    proxy.$t('attribute.course', 'Curso'),
    proxy.$t('attribute.address', 'Endereço')
  ];
  
  const rows = filteredRoutePoints.value.map(p => {
    const fixTime = new Date(p.fixTime).toLocaleString('pt-BR');
    return [
      escapeCsvValue(fixTime),
      escapeCsvValue(deviceName),
      escapeCsvValue(p.latitude),
      escapeCsvValue(p.longitude),
      escapeCsvValue(p.speed?.toFixed(2) || '0.00'),
      escapeCsvValue(p.course || ''),
      escapeCsvValue(p.address || '')
    ].join(';');
  });
  
  const BOM = '\ufeff';
  const csv = BOM + headers.join(';') + '\r\n' + rows.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const filename = `percurso_${deviceId}_${startDate}_${endDate}.csv`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  ElMessage.success(proxy.$t('device.ExportOK', 'Arquivo exportado com sucesso'));
};

const exportPrintPdf = () => {
  if (filteredRoutePoints.value.length === 0) {
    ElMessage.warning(proxy.$t('route.empty', 'Sem pontos para exportar'));
    return;
  }
  if (!validateForm()) return;
  
  const deviceId = formData.value.deviceId;
  const deviceName = getDeviceName(deviceId);
  const startDateStr = new Date(formData.value.date[0]).toLocaleString('pt-BR');
  const endDateStr = new Date(formData.value.date[1]).toLocaleString('pt-BR');
  
  const { totalDistance, avgSpeed, duration, stopTime } = stats.value;
  
  const tableRows = filteredRoutePoints.value.map((p, idx) => {
    const fixTime = new Date(p.fixTime).toLocaleString('pt-BR');
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${fixTime}</td>
        <td>${p.latitude?.toFixed(6) || ''}</td>
        <td>${p.longitude?.toFixed(6) || ''}</td>
        <td>${p.speed?.toFixed(2) || '0.00'}</td>
        <td>${p.address || '-'}</td>
      </tr>
    `;
  }).join('');
  
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${proxy.$t('report.history', 'Relatório de Percurso')} - ${deviceName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
    .header h1 { font-size: 18px; margin-bottom: 5px; }
    .header .subtitle { font-size: 14px; color: #666; }
    .info { display: flex; justify-content: space-between; margin-bottom: 15px; }
    .info-item { flex: 1; }
    .info-item strong { display: block; color: #333; }
    .stats { display: flex; gap: 15px; margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
    .stat-box { flex: 1; text-align: center; }
    .stat-box .value { font-size: 16px; font-weight: bold; color: #2196F3; }
    .stat-box .label { font-size: 10px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #4CAF50; color: white; font-size: 11px; }
    td { font-size: 10px; }
    tr:nth-child(even) { background: #f9f9f9; }
    .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #999; }
    @media print {
      body { padding: 10px; }
      .header { page-break-after: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${proxy.$t('report.history', 'Relatório de Percurso')}</h1>
    <div class="subtitle">${proxy.$t('report.generatedAt', 'Gerado em')} ${new Date().toLocaleString('pt-BR')}</div>
  </div>
  <div class="info">
    <div class="info-item"><strong>${proxy.$t('device.device', 'Dispositivo')}:</strong> ${deviceName} (ID: ${deviceId})</div>
    <div class="info-item"><strong>${proxy.$t('report.period', 'Período')}:</strong> ${startDateStr} ${proxy.$t('report.to', 'a')} ${endDateStr}</div>
    <div class="info-item"><strong>${proxy.$t('report.points', 'Pontos')}:</strong> ${filteredRoutePoints.value.length}</div>
  </div>
  <div class="stats">
    <div class="stat-box"><div class="value">${totalDistance} km</div><div class="label">${proxy.$t('report.totalDistance', 'Distância Total')}</div></div>
    <div class="stat-box"><div class="value">${avgSpeed} km/h</div><div class="label">${proxy.$t('report.avgSpeed', 'Velocidade Média')}</div></div>
    <div class="stat-box"><div class="value">${duration}</div><div class="label">${proxy.$t('report.tripDuration', 'Duração')}</div></div>
    <div class="stat-box"><div class="value">${stopTime}</div><div class="label">${proxy.$t('report.stopTime', 'Tempo Parado')}</div></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>${proxy.$t('attribute.fixTime', 'Data/Hora')}</th><th>${proxy.$t('attribute.latitude', 'Latitude')}</th><th>${proxy.$t('attribute.longitude', 'Longitude')}</th><th>${proxy.$t('attribute.speed', 'Velocidade')}</th><th>${proxy.$t('attribute.address', 'Endereço')}</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">${proxy.$t('report.footer', 'Sistema de Rastreamento - Relatório gerado automaticamente')}</div>
</body>
</html>`;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
  } else {
    ElMessage.error(proxy.$t('report.popupBlocked', 'Bloqueador de pop-ups ativo. Permita pop-ups para exportar.'));
  }
};

const handleExport = (command) => {
  if (command === 'pdf') exportPrintPdf();
  else if (command === 'excel') exportCsv();
};

// ============================================
// CÁLCULOS DE ESTATÍSTICAS
// ============================================

const deg2rad = (deg) => deg * (Math.PI / 180);

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + 
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateTotalDistance = () => {
  if (routePoints.value.length === 0) return '0.00';
  let total = 0;
  for (let i = 1; i < routePoints.value.length; i++) {
    const p1 = routePoints.value[i - 1];
    const p2 = routePoints.value[i];
    total += getDistanceFromLatLonInKm(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
  }
  return total.toFixed(2);
};

const calculateAvgSpeed = () => {
  if (routePoints.value.length === 0) return '0.00';
  const totalSpeed = routePoints.value.reduce((sum, p) => sum + (p.speed || 0), 0);
  return (totalSpeed / routePoints.value.length).toFixed(2);
};

const calculateDuration = () => {
  if (routePoints.value.length < 2) return '0h 0m';
  const startTime = new Date(routePoints.value[0].fixTime).getTime();
  const endTime = new Date(routePoints.value[routePoints.value.length - 1].fixTime).getTime();
  const durationMs = endTime - startTime;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const calculateStopTime = () => {
  if (routePoints.value.length < 2) return '0h 0m';
  let stopTimeMs = 0;
  let isCurrentlyStopped = false;
  let stopStartTime = null;
  
  for (let i = 0; i < routePoints.value.length; i++) {
    const p = routePoints.value[i];
    if (p.speed < 1) {
      if (!isCurrentlyStopped) {
        isCurrentlyStopped = true;
        stopStartTime = new Date(p.fixTime).getTime();
      }
    } else {
      if (isCurrentlyStopped && stopStartTime !== null) {
        stopTimeMs += (new Date(p.fixTime).getTime() - stopStartTime);
        isCurrentlyStopped = false;
        stopStartTime = null;
      }
    }
  }
  
  if (isCurrentlyStopped && stopStartTime !== null) {
    const lastPoint = routePoints.value[routePoints.value.length - 1];
    stopTimeMs += (new Date(lastPoint.fixTime).getTime() - stopStartTime);
  }
  
  const hours = Math.floor(stopTimeMs / (1000 * 60 * 60));
  const minutes = Math.floor((stopTimeMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

// ============================================
// WATCHERS
// ============================================

// Sync formData com store
watch(formData, () => {
  const { deviceId, date } = formData.value;
  if (!deviceId || !date?.[0] || !date?.[1]) return;
  sendDataToStore();
}, { deep: true });

// Debounce para filtros
watch([searchQuery, eventFilter, customSpeed, removeDuplicates], () => {
  if (routePoints.value.length > 0) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateMapRoute();
    }, DEBOUNCE_DELAY);
  }
});

// Heatmap toggle
watch(showHeatmap, (enabled) => {
  debugLog('Heatmap toggle:', enabled);
  toggleHeatmap?.(enabled);
  store.state.devices.showCalor = enabled;
});

// Scroll automático quando ponto de reprodução muda
watch(currentPlayingPoint, (newValue) => {
  if (newValue > 0 && routePoints.value.length > 0) {
    nextTick(() => scrollToActivePoint(newValue));
  }
});

// Carregar rota via query param (ex: ?deviceId=123)
watch(() => route.query.deviceId, () => {
  if (route.query.deviceId) {
    formData.value.deviceId = parseInt(route.query.deviceId);
    loadRoute();
  }
});

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  if (route.query.deviceId) {
    formData.value.deviceId = parseInt(route.query.deviceId);
    loadRoute();
  }
});

onBeforeUnmount(() => {
  // Limpar debounce timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  // Invalidar requests pendentes incrementando o ID
  loadRouteRequestId++;
  // Resetar estados do store
  store.dispatch('devices/resetDeviceStates');
});
</script>

<style scoped>
.el-select.el-select--large {
  width: 100%;
}

/* Timeline Container */
.timeline-container {
  display: flex;
  flex-direction: column;
  border: var(--el-border-color-light) 1px solid;
  margin-top: 20px;
  border-radius: 10px;
  background: var(--el-bg-color);
}

.timeline-message {
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.timeline-scroll {
  overflow: auto;
  max-height: clamp(260px, 40vh, 420px);
  position: relative;
}

/* Stats Card */
.stats-card,
.stats-card * {
  max-width: 100%;
  text-size-adjust: 100%;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-title {
  font-weight: bold;
  font-size: 14px;
}

.driver-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--el-fill-color-lighter);
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.driver-pill i {
  color: var(--el-color-primary);
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-box {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-box:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow) !important;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: clamp(20px, 2vw, 24px);
  flex-shrink: 0;
}

.stat-icon-primary { color: var(--el-color-primary); }
.stat-icon-success { color: var(--el-color-success); }
.stat-icon-warning { color: var(--el-color-warning); }
.stat-icon-danger { color: var(--el-color-danger); }

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  opacity: 0.85;
  margin-bottom: 4px;
}

.stat-value {
  font-size: clamp(16px, 1.6vw, 20px);
  line-height: 1.1;
  font-weight: 800;
  color: var(--el-text-color-primary);
}

/* Form e Actions */
.history-card {
  margin-bottom: 16px;
}

.history-form {
  padding: 16px 28px 0;
}

.view-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
  align-items: center;
  padding: 10px 0;
}

.view-options-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 600;
  margin-right: 8px;
}

.view-options-label i {
  margin-right: 4px;
}

.route-color-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
}

.route-color-selector .color-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.color-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0,0,0,0.15);
  flex-shrink: 0;
}

.history-actions {
  position: sticky;
  bottom: 0;
  background: var(--el-bg-color);
  padding: 12px 0;
  margin-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.stats-card {
  margin-top: 16px;
}

.timeline-filters {
  border: var(--el-border-color-lighter) 1px solid;
}

/* Animations */
.stats-container {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsividade */
@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: 1fr;
  }
  
  .stats-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .timeline-scroll {
    max-height: 320px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
