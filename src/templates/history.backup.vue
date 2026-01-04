<template>
  <el-card class="history-card" shadow="hover">
  <div class="history-form">
  <el-form>
    <!-- Linha 1: Dispositivo -->
    <el-form-item>
      <div class="form-group">
        <label for="theInputDevice">{{$t('device.select')}}</label>
        <el-select v-model="formData.deviceId" :value-key="'id'" filterable :placeholder="$t('device.device')" :size="'large'" :no-data-text="$t('NO_DATA_TEXT')" :no-match-text="$t('NO_MATCH_TEXT')">
          <el-option
            v-for="item in devicesList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
          </el-option>
        </el-select>
      </div>
    </el-form-item>

    <!-- Linha 2: Período -->
    <el-form-item>
      <div class="form-group">
        <label>{{$t('startDate')}}</label>
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
      <el-switch v-model="showRouteMarkers" :active-text="$t('report.showMarkers')"></el-switch>
      <!-- COMMIT 2: Toggle heatmap com ref local + watch (não usa mais @click) -->
      <el-switch v-model="showHeatmap" :active-text="$t('report.showMapadeCalor')"></el-switch>
      
      <!-- COMMIT 3: Seletor de Cor da Rota -->
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
          <i class="fas fa-download"></i> {{$t('export.label')}}
          <i class="el-icon--right fas fa-angle-down"></i>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="pdf">
              <i class="fas fa-file-pdf"></i> {{$t('report.pdf')}}
            </el-dropdown-item>
            <el-dropdown-item command="excel">
              <i class="fas fa-file-excel"></i> {{$t('report.excel')}}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button
        @mouseleave="hideTip" @mouseenter.stop="showTip($event,$t('device.routes'))"
        type="primary" @click="loadRoute()"
        :disabled="!isFormValid"
      >
        <i class="fas fa-route"></i> {{$t('report.show')}}
      </el-button>
      <el-button
        @mouseleave="hideTip" @mouseenter.stop="showTip($event,$t('device.graphic'))"
        type="success" @click="loadGraph()"
        :disabled="!isFormValid"
      >
        <i class="fas fa-chart-bar"></i> {{$t('report.chart')}}
      </el-button>
    </div>
  </div>
  </el-card> 
         

    <!-- Cartões de Estatísticas -->
    <el-card v-if="routePoints.length > 0" class="stats-card" shadow="never">
      <template #header>
        <div class="stats-header">
          <div class="stats-title">
            <i class="fas fa-chart-line"></i> {{$t('report.statistics')}}
          </div>
          <div v-if="currentDriverName" class="driver-pill">
            <i class="fas fa-user"></i> Motorista: {{ currentDriverName }}
          </div>
        </div>
      </template>
      <div class="stats-container">
        <div class="stat-box">
          <div class="stat-content">
            <i class="fas fa-route stat-icon stat-icon-primary"></i>
            <div class="stat-info">
              <div class="stat-label">{{$t('report.totalDistance')}}</div>
              <div class="stat-value">{{calculateTotalDistance()}} km</div>
            </div>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-content">
            <i class="fas fa-tachometer-alt stat-icon stat-icon-success"></i>
            <div class="stat-info">
              <div class="stat-label">{{$t('report.avgSpeed')}}</div>
              <div class="stat-value">{{calculateAvgSpeed()}} km/h</div>
            </div>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-content">
            <i class="fas fa-clock stat-icon stat-icon-warning"></i>
            <div class="stat-info">
              <div class="stat-label">{{$t('report.tripDuration')}}</div>
              <div class="stat-value">{{calculateDuration()}}</div>
            </div>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-content">
            <i class="fas fa-pause-circle stat-icon stat-icon-danger"></i>
            <div class="stat-info">
              <div class="stat-label">{{$t('report.stopTime')}}</div>
              <div class="stat-value">{{calculateStopTime()}}</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

  <!-- Filtros da Timeline -->
  <el-card v-if="routePoints.length > 0" class="timeline-filters" shadow="never" style="margin-top: 16px;">
    <template #header>
      <div style="font-weight: bold;">
        <i class="fas fa-filter"></i> {{$t('report.filters')}}
      </div>
    </template>
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px;">
          <label style="font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; display: block;">
            <i class="fas fa-search"></i> {{$t('report.searchLabel')}}
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
            <i class="fas fa-list"></i> {{$t('report.eventType')}}
          </label>
          <el-select
            v-model="eventFilter"
            :placeholder="$t('report.filterByEvent')"
            style="width: 100%;"
            @change="onEventFilterChange"
          >
            <el-option :label="$t('report.all')" value="all"></el-option>
            <el-option :label="$t('report.moving')" value="moving"></el-option>
            <el-option :label="$t('report.stopped')" value="stopped"></el-option>
            <el-option :label="$t('report.fastSpeed')" value="fast"></el-option>
          </el-select>
        </div>
        <div v-if="eventFilter === 'fast'" style="min-width: 180px;">
          <label style="font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; display: block;">
            <i class="fas fa-tachometer-alt"></i> {{$t('report.insertSpeed')}}
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
        ></el-switch>
        <div style="font-size: 13px; color: var(--el-text-color-regular); font-weight: 500;">
          <i class="fas fa-map-marker-alt"></i> 
          <span v-if="filteredRoutePoints.length !== routePoints.length">
            {{filteredRoutePoints.length}} / {{routePoints.length}} {{$t('report.points')}}
          </span>
          <span v-else>
            {{routePoints.length}} {{$t('report.points')}}
          </span>
        </div>
      </div>
    </div>
  </el-card>


  <div class="timeline-container">
    <template v-if="loadingState === 'loading'">
      <div class="timeline-message">
        <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 8px;"></i>
        <div>{{$t('LOADING')}}</div>
      </div>
    </template>
    <template v-else-if="loadingState === 'export_ok'">
      <div class="timeline-message">
        <i class="fas fa-check-circle" style="font-size: 24px; margin-bottom: 8px; color: var(--el-color-success);"></i>
        <div>{{$t('ExportOK')}}</div>
      </div>
    </template>
    <template v-else-if="loadingState === 'error'">
      <div class="timeline-message" style="color: var(--el-color-danger);">
        <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 8px;"></i>
        <div>{{$t('report.loadError') || 'Erro ao carregar dados'}}</div>
      </div>
    </template>
    <template v-else-if="routePoints.length === 0">
      <div class="timeline-message">{{$t('route.empty')}}</div>
    </template>
    <template v-else>
      <div v-if="routePoints.length>0" class="timeline-point timeline-point-start">
        <div class="timeline-time">
          <div class="timeline-line timeline-line-bottom"></div>
          <div class="timeline-icon">
            <i class="fas fa-flag"></i>
          </div>
          <div class="timeline-date">
            {{new Date(routePoints[0].fixTime).toLocaleDateString()}}<br>
            {{new Date(routePoints[0].fixTime).toLocaleTimeString()}}
          </div>
        </div>
        <div class="timeline-address">{{routePoints[0].address}}</div>
        <div class="timeline-speed">
          <i class="fas fa-tachometer-alt"></i>
          {{$t('units.'+store.getters['server/getAttribute']('speedUnit','speedUnit'),{speed: routePoints[0].speed})}}
        </div>
      </div>
      <div v-if="filteredRoutePoints.length>2" class="timeline-scroll" ref="timelineScrollRef">
        <template v-for="(p,k) in filteredRoutePoints" :key="p.id">
            <div v-if="k>0 && k<filteredRoutePoints.length-1" 
                 class="timeline-point timeline-point-middle"
                 :class="{ 
                   'timeline-active': isPlayingRoute && k === currentPlayingPoint,
                   'is-visited': isPlayingRoute && k < currentPlayingPoint
                 }"
                 :id="'timeline-point-' + k">
              <div class="timeline-time">
                <div class="timeline-line timeline-line-full"></div>
                <div class="timeline-dot" :class="{ 
                  'timeline-dot-active': isPlayingRoute && k === currentPlayingPoint,
                  'timeline-dot-visited': isPlayingRoute && k < currentPlayingPoint
                }"></div>
                <div class="timeline-date">
                  {{new Date(p.fixTime).toLocaleDateString()}}<br>
                  {{new Date(p.fixTime).toLocaleTimeString()}}
                </div>
              </div>
              <div class="timeline-content-wrapper">
                <div class="timeline-address">
                  <a target="_blank" class="timeline-link" :href="'https://maps.google.com/?q='+p.latitude+','+p.longitude">
                    {{p.address || p.latitude+','+p.longitude }} <i class="fas fa-external-link-alt"></i>
                  </a>
                </div>
                <!-- 🎯 MIGRAÇÃO: Atributos do ponto (ignição, bloqueio, movimento, energia) -->
                <div v-if="p.attributes" class="timeline-attributes">
                  <!-- Ignição -->
                  <span v-if="p.attributes.ignition !== undefined" 
                        class="attr-badge" 
                        :class="p.attributes.ignition ? 'attr-success' : 'attr-danger'"
                        :title="$t('device.ignition') + ': ' + (p.attributes.ignition ? $t('yes') : $t('no'))">
                    <i class="fas fa-key"></i>
                  </span>
                  <!-- Bloqueio -->
                  <span v-if="p.attributes.blocked !== undefined" 
                        class="attr-badge" 
                        :class="p.attributes.blocked ? 'attr-danger' : 'attr-success'"
                        :title="$t('device.blocked') + ': ' + (p.attributes.blocked ? $t('yes') : $t('no'))">
                    <i :class="p.attributes.blocked ? 'fas fa-lock' : 'fas fa-unlock'"></i>
                  </span>
                  <!-- Movimento -->
                  <span v-if="p.attributes.motion !== undefined" 
                        class="attr-badge" 
                        :class="p.attributes.motion ? 'attr-success' : 'attr-warning'"
                        :title="$t('device.motion') + ': ' + (p.attributes.motion ? $t('yes') : $t('no'))">
                    <i :class="p.attributes.motion ? 'fas fa-car' : 'fas fa-parking'"></i>
                  </span>
                  <!-- Energia -->
                  <span v-if="p.attributes.power !== undefined" 
                        class="attr-badge attr-info"
                        :title="$t('device.power') + ': ' + parseFloat(p.attributes.power).toFixed(1) + 'V'">
                    <i class="fas fa-car-battery"></i>
                    <span class="attr-value">{{ parseFloat(p.attributes.power).toFixed(1) }}V</span>
                  </span>
                </div>
              </div>
              <div class="timeline-speed">
                <i class="fas fa-tachometer-alt"></i>
                {{$t('units.'+store.getters['server/getAttribute']('speedUnit','speedUnit'),{speed: p.speed})}}
              </div>
            </div>
        </template>
      </div>
    <div v-if="routePoints.length>0" class="timeline-point timeline-point-end">
      <div class="timeline-time">
        <div class="timeline-line timeline-line-top"></div>
        <div class="timeline-icon">
          <i class="fas fa-flag"></i>
        </div>
        <div class="timeline-date">
          {{new Date(routePoints[routePoints.length-1].fixTime).toLocaleDateString()}}<br>
          {{new Date(routePoints[routePoints.length-1].fixTime).toLocaleTimeString()}}
        </div>
      </div>
      <div class="timeline-address">{{routePoints[routePoints.length-1].address}}</div>
      <div class="timeline-speed">
        <i class="fas fa-tachometer-alt"></i>
        {{$t('units.'+store.getters['server/getAttribute']('speedUnit','speedUnit'),{speed: routePoints[routePoints.length-1].speed})}}
      </div>
    </div>
    </template>
  </div>

</template>

<script setup>



import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/tooltip/style/css'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/switch/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/input-number/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/date-picker/style/css'
import 'element-plus/es/components/dropdown/style/css'
import 'element-plus/es/components/dropdown-menu/style/css'
import 'element-plus/es/components/dropdown-item/style/css'
import 'element-plus/es/components/card/style/css'


import {ElButton,ElForm,ElSelect,ElOption,ElFormItem,ElSwitch,ElInput,ElInputNumber,ElDatePicker,ElDropdown,ElDropdownMenu,ElDropdownItem,ElCard,ElMessage} from "element-plus";
import 'element-plus/es/components/message/style/css'

import {ref,inject,onMounted,watch,onBeforeUnmount,nextTick,computed,getCurrentInstance} from 'vue';
import {useStore} from 'vuex';
import {useRoute} from 'vue-router'

// ============================================
// CONFIGURAÇÃO DE PERFORMANCE (history.vue)
// ============================================
const PERF_DEBUG = process.env.NODE_ENV === 'development' && false; // Ativar logs de performance (dev only)
const DEBUG_HISTORY = process.env.NODE_ENV === 'development'; // Logs gerais de debug

// Helper de log de performance
const perfLog = (label, startTime, extra = '') => {
    if (!PERF_DEBUG) return;
    const elapsed = performance.now() - startTime;
    console.log(`[PERF:history] ${label}: ${elapsed.toFixed(2)}ms ${extra}`);
};

// Helper de log de debug
const debugLog = (...args) => {
    if (DEBUG_HISTORY) console.log('[History]', ...args);
};

// 🎯 MIGRAÇÃO: Ref para scroll automático da timeline
const timelineScrollRef = ref(null);

// 🎯 MIGRAÇÃO: Computed para ponto atual sendo reproduzido no mapa
const currentPlayingPoint = computed(() => {
  return store.state.devices?.routePlayPoint || 0;
});

// 🎯 MIGRAÇÃO: Função de scroll automático para ponto ativo
const scrollToActivePoint = (index) => {
  if (!timelineScrollRef.value) return;
  
  const element = document.getElementById(`timeline-point-${index}`);
  if (!element) {
    debugLog(`Elemento timeline-point-${index} não encontrado`);
    return;
  }
  
  const container = timelineScrollRef.value;
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  
  // Calcular scroll para centralizar o elemento
  const scrollTop = element.offsetTop - (containerRect.height / 2) + (elementRect.height / 2);
  
  container.scrollTo({
    top: Math.max(0, scrollTop),
    behavior: 'smooth'
  });
  
  debugLog(`Scroll para ponto ${index}`);
};

const showGraphicsRef = inject("show-graphics");

// Estados de loading: 'idle' | 'loading' | 'export_ok' | 'error'
const loadingState = ref('idle');
const searchQuery = ref('');
const eventFilter = ref('all');
const customSpeed = ref(80);
const removeDuplicates = ref(false);

// Timer para debounce do updateMapRoute
let debounceTimer = null;
const DEBOUNCE_DELAY = 250; // ms

const date1 = new Date();
const date2 = new Date();

date1.setHours(0);
date1.setMinutes(0);

const showRouteMarkers = inject("showRouteMarkers");


const showTip = (evt,text)=>{
  window.$showTip(evt,text);
}

const hideTip = (evt,text)=>{
  window.$hideTip(evt,text);
}



const formData = ref({deviceId: '',date: [date1,date2]})
const store = useStore();
const route = useRoute();

// Computed para validar form
const isFormValid = computed(() => {
  return !!(formData.value.deviceId && formData.value.date?.[0] && formData.value.date?.[1]);
});

const sendDataToStore = ()=>{
  const deviceId = formData.value.deviceId;
  const startDate = formData.value.date[0];
  const endDate = formData.value.date[1];

  store.dispatch('reports/updateReportData',{deviceId,date: [startDate,endDate]});
}

watch(formData, () => {
  const { deviceId, date } = formData.value;
  if (!deviceId || !date?.[0] || !date?.[1]) return;
  sendDataToStore();
}, { deep: true });

watch([searchQuery, eventFilter, customSpeed, removeDuplicates], () => {
  if (routePoints.value.length > 0) {
    // Debounce para evitar recalcular a cada tecla
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      updateMapRoute();
    }, DEBOUNCE_DELAY);
  }
});


onMounted(()=>{
  if(route.query.deviceId){
    formData.value.deviceId = parseInt(route.query.deviceId);

    loadRoute();
  }
})


onBeforeUnmount(() => {
  // Limpar debounce timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  // Resetar estados do store
  store.dispatch('devices/resetDeviceStates');
});

watch(()=> route.query.deviceId,()=>{
  if(route.query.deviceId){
    formData.value.deviceId = parseInt(route.query.deviceId);

    loadRoute();
  }
})

// 🎯 MIGRAÇÃO: Watch para scroll automático quando ponto de reprodução muda
watch(currentPlayingPoint, (newValue) => {
  if (newValue > 0 && routePoints.value.length > 0) {
    nextTick(() => {
      scrollToActivePoint(newValue);
    });
  }
});

const updateRoute = inject('updateRoute');
const toggleHeatmap = inject('toggleHeatmap');

// COMMIT 1: Inject do estado de play para controlar highlight da timeline
const isPlayingRoute = inject('isPlayingRoute');

// COMMIT 3: Cor da rota configurável
const routeColorRef = inject('routeColor');
const setRouteColor = inject('setRouteColor');
const ROUTE_COLOR_OPTIONS = inject('ROUTE_COLOR_OPTIONS');

// Acessar $t via proxy do getCurrentInstance (compatível com legacy mode)
const { proxy } = getCurrentInstance();

// Mapeamento de cores para chaves de tradução
const colorKeyMap = {
  '#05a7e3': 'colorBlue',
  '#FF5733': 'colorOrange',
  '#28a745': 'colorGreen',
  '#dc3545': 'colorRed',
  '#6f42c1': 'colorPurple',
  '#fd7e14': 'colorYellow',
  '#20c997': 'colorTurquoise',
  '#e83e8c': 'colorPink',
};

// Computed que traduz labels das cores dinamicamente
const routeColorOptions = computed(() => {
  const baseOptions = ROUTE_COLOR_OPTIONS || [
    { value: '#05a7e3' },
    { value: '#FF5733' },
    { value: '#28a745' },
    { value: '#dc3545' },
    { value: '#6f42c1' },
    { value: '#fd7e14' },
    { value: '#20c997' },
    { value: '#e83e8c' },
  ];
  return baseOptions.map(opt => ({
    value: opt.value,
    label: proxy.$t(`report.${colorKeyMap[opt.value] || 'colorBlue'}`)
  }));
});

// Cor atual (sync com kore-map via inject)
const currentRouteColor = ref(routeColorRef?.value || localStorage.getItem('kore-route-color') || '#05a7e3');

const handleRouteColorChange = (color) => {
  if (setRouteColor) {
    setRouteColor(color);
  }
  console.log('[history.vue] 🎨 Cor da rota alterada para:', color);
};

// ============================================================================
// COMMIT 2: Toggle Mapa de Calor - Ref local + watch
// ============================================================================
const showHeatmap = ref(false);

// Watch que dispara toggleHeatmap quando o switch muda
watch(showHeatmap, (enabled) => {
  console.log('[history.vue] 🔥 Heatmap toggle:', enabled);
  if (toggleHeatmap) {
    toggleHeatmap(enabled);
  }
  // Sync com store para manter consistência (opcional)
  store.state.devices.showCalor = enabled;
});

// Legado removido: showCalorLayer, hideCalorLayer, showPercursoLayer, hidePercursoLayer
// Agora usa apenas toggleHeatmap via watch


const routePoints = ref([]);

// Lista de dispositivos normalizada (aceita array, objeto ou {list: []})
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

// ============================================================================
// COMPUTED - Motorista atual do dispositivo selecionado
// ============================================================================
const selectedDevice = computed(() => {
  const id = Number(formData.value.deviceId);
  if (!id) return null;
  return devicesList.value.find(d => Number(d.id) === id) || null;
});

const currentDriverName = computed(() => {
  const dev = selectedDevice.value;
  if (!dev) return null;

  const posGetter = store.getters["devices/getPosition"];
  const pos = typeof posGetter === "function" ? posGetter(dev.id) : null;

  const attrs = pos?.attributes || dev?.attributes || {};

  const driverUniqueId =
    attrs.driverUniqueId ||
    attrs.driver_unique_id ||
    dev?.driverUniqueId ||
    dev?.driver_unique_id;

  const driverId =
    attrs.driverId ||
    attrs.driver_id ||
    dev?.driverId ||
    dev?.driver_id;

  // 1) getter por uniqueId (se existir)
  const byUnique = store.getters["drivers/getDriverByUniqueId"];
  if (driverUniqueId && typeof byUnique === "function") {
    const d = byUnique(driverUniqueId);
    if (d) return d.name || d.uniqueId || driverUniqueId;
  }

  // 2) getter por id (se existir)
  const byId = store.getters["drivers/getDriverById"];
  if (driverId && typeof byId === "function") {
    const d = byId(driverId);
    if (d) return d.name || d.uniqueId || String(driverId);
  }

  // 3) fallback em listas do state
  const driversRaw =
    store.state.drivers?.driversList ??
    store.state.drivers?.list ??
    store.state.drivers?.items ??
    store.state.drivers ??
    [];

  const drivers = Array.isArray(driversRaw)
    ? driversRaw
    : (driversRaw && Array.isArray(driversRaw.list) ? driversRaw.list : Object.values(driversRaw || {}));

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
  // Se 'all', mantém todos os pontos (inclusive velocidade 0)
  
  // Remover duplicatas se habilitado (só agora clonamos se necessário)
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

const dateShortcuts = [
  {
    text: 'Hoje',
    value: () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      return [start, end];
    },
  },
  {
    text: 'Ontem',
    value: () => {
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    },
  },
  {
    text: 'Última semana',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    },
  },
  {
    text: 'Último mês',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    },
  },
];

const onEventFilterChange = () => {
  // Atualizar rota no mapa com pontos filtrados
  if (filteredRoutePoints.value.length > 0) {
    updateMapRoute();
  }
};

// Validação antes de carregar ou exportar
const validateForm = () => {
  // Verificar se dispositivo foi selecionado
  if (!formData.value.deviceId) {
    ElMessage.warning('Selecione um dispositivo');
    return false;
  }
  
  // Verificar se período foi selecionado
  if (!formData.value.date || !formData.value.date[0] || !formData.value.date[1]) {
    ElMessage.warning('Selecione o período');
    return false;
  }
  
  // Verificar se data final é maior que inicial
  const startDate = new Date(formData.value.date[0]);
  const endDate = new Date(formData.value.date[1]);
  
  if (endDate <= startDate) {
    ElMessage.warning('A data final deve ser maior que a data inicial');
    return false;
  }
  
  // Limite opcional: máximo 31 dias
  const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  if (diffDays > 31) {
    ElMessage.warning('O período máximo permitido é de 31 dias');
    return false;
  }
  
  return true;
};

const updateMapRoute = () => {
  let tmp = [];
  filteredRoutePoints.value.forEach((p) => {
    tmp.push([p.latitude, p.longitude, p.id, p.course]);
  });
  updateRoute(tmp);
};

// Obter nome do dispositivo pelo ID
const getDeviceName = (deviceId) => {
  const device = devicesList.value.find(d => Number(d.id) === Number(deviceId));
  return device ? device.name : `Device ${deviceId}`;
};

// Formatar data para nome de arquivo (YYYYMMDD_HHmm)
const formatDateForFilename = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};

// Escapar valor para CSV (lidar com ;, ", quebras de linha)
const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Se contém delimitador, aspas ou quebra de linha, envolver em aspas e escapar aspas internas
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

// Export CSV nativo (sem dependências externas)
const exportCsv = () => {
  // Validar dados
  if (filteredRoutePoints.value.length === 0) {
    ElMessage.warning('Sem pontos para exportar');
    return;
  }
  
  if (!validateForm()) {
    return;
  }
  
  const deviceId = formData.value.deviceId;
  const deviceName = getDeviceName(deviceId);
  const startDate = formatDateForFilename(formData.value.date[0]);
  const endDate = formatDateForFilename(formData.value.date[1]);
  
  // Header do CSV
  const headers = ['Data/Hora', 'Dispositivo', 'Latitude', 'Longitude', 'Velocidade (km/h)', 'Curso', 'Endereço'];
  
  // Linhas de dados
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
  
  // Montar CSV com BOM para acentos no Excel pt-BR
  const BOM = '\ufeff';
  const csv = BOM + headers.join(';') + '\r\n' + rows.join('\r\n');
  
  // Criar blob e download
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
  
  ElMessage.success('Arquivo CSV exportado com sucesso');
};

// Export Print/PDF nativo (HTML + window.print)
const exportPrintPdf = () => {
  // Validar dados
  if (filteredRoutePoints.value.length === 0) {
    ElMessage.warning('Sem pontos para exportar');
    return;
  }
  
  if (!validateForm()) {
    return;
  }
  
  const deviceId = formData.value.deviceId;
  const deviceName = getDeviceName(deviceId);
  const startDateStr = new Date(formData.value.date[0]).toLocaleString('pt-BR');
  const endDateStr = new Date(formData.value.date[1]).toLocaleString('pt-BR');
  
  // Estatísticas
  const totalDistance = calculateTotalDistance();
  const avgSpeed = calculateAvgSpeed();
  const duration = calculateDuration();
  const stopTime = calculateStopTime();
  
  // Gerar linhas da tabela
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
  
  // HTML do relatório
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Percurso - ${deviceName}</title>
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
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Relatório de Percurso</h1>
    <div class="subtitle">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
  </div>
  
  <div class="info">
    <div class="info-item">
      <strong>Dispositivo:</strong> ${deviceName} (ID: ${deviceId})
    </div>
    <div class="info-item">
      <strong>Período:</strong> ${startDateStr} a ${endDateStr}
    </div>
    <div class="info-item">
      <strong>Pontos:</strong> ${filteredRoutePoints.value.length} registros
    </div>
  </div>
  
  <div class="stats">
    <div class="stat-box">
      <div class="value">${totalDistance} km</div>
      <div class="label">Distância Total</div>
    </div>
    <div class="stat-box">
      <div class="value">${avgSpeed} km/h</div>
      <div class="label">Velocidade Média</div>
    </div>
    <div class="stat-box">
      <div class="value">${duration}</div>
      <div class="label">Duração</div>
    </div>
    <div class="stat-box">
      <div class="value">${stopTime}</div>
      <div class="label">Tempo Parado</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Data/Hora</th>
        <th>Latitude</th>
        <th>Longitude</th>
        <th>Velocidade</th>
        <th>Endereço</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  
  <div class="footer">
    Sistema de Rastreamento - Relatório gerado automaticamente
  </div>
</body>
</html>
  `;
  
  // Abrir nova janela e imprimir
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Aguardar carregamento antes de imprimir
    setTimeout(() => {
      printWindow.print();
    }, 250);
  } else {
    ElMessage.error('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.');
  }
};

const handleExport = (command) => {
  if (command === 'pdf') {
    exportPrintPdf();
  } else if (command === 'excel') {
    exportCsv();
  }
};

const calculateTotalDistance = () => {
  if (routePoints.value.length === 0) return '0.00';
  
  let totalDistance = 0;
  for (let i = 1; i < routePoints.value.length; i++) {
    const p1 = routePoints.value[i - 1];
    const p2 = routePoints.value[i];
    const distance = getDistanceFromLatLonInKm(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
    totalDistance += distance;
  }
  
  return totalDistance.toFixed(2);
};

const calculateAvgSpeed = () => {
  if (routePoints.value.length === 0) return '0.00';
  
  const totalSpeed = routePoints.value.reduce((sum, p) => sum + (p.speed || 0), 0);
  const avgSpeed = totalSpeed / routePoints.value.length;
  
  return avgSpeed.toFixed(2);
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
    
    // Se está parado (velocidade < 1 km/h)
    if (p.speed < 1) {
      if (!isCurrentlyStopped) {
        // Começou a parar
        isCurrentlyStopped = true;
        stopStartTime = new Date(p.fixTime).getTime();
      }
    } else {
      // Se estava parado e agora está em movimento
      if (isCurrentlyStopped && stopStartTime !== null) {
        const stopEndTime = new Date(p.fixTime).getTime();
        stopTimeMs += (stopEndTime - stopStartTime);
        isCurrentlyStopped = false;
        stopStartTime = null;
      }
    }
  }
  
  // Se terminou parado, adicionar o tempo até o último ponto
  if (isCurrentlyStopped && stopStartTime !== null) {
    const lastPoint = routePoints.value[routePoints.value.length - 1];
    const stopEndTime = new Date(lastPoint.fixTime).getTime();
    stopTimeMs += (stopEndTime - stopStartTime);
  }
  
  const hours = Math.floor(stopTimeMs / (1000 * 60 * 60));
  const minutes = Math.floor((stopTimeMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

const loadGraph = ()=>{
    if(routePoints.value.length===0){
      loadRoute(true);
    }else{
      showGraphicsRef.value.showGraphic(routePoints.value);
    }
}
const hideDevices = (deviceId=0)=>{
  store.dispatch("devices/setDeviceFilter",deviceId);
}

/*
const resetDevices = ()=>{
  store.dispatch("devices/setDeviceFilter",0);
}*/


// import {saveAs} from "file-saver";

const loadRoute = (g=false)=>{
  // Validar formulário antes de carregar
  if (!validateForm()) {
    return;
  }
  
  const perfStart = PERF_DEBUG ? performance.now() : 0;
  const $traccar = window.$traccar;
  loadingState.value = 'loading';

  $traccar.loadRoute(formData.value.deviceId,formData.value.date[0],formData.value.date[1],false)
    .then((r)=>{
      perfLog('loadRoute API', perfStart, `points:${r.data.length}`);
      
      const perfRender = PERF_DEBUG ? performance.now() : 0;
      
      // Carregar rota
      const data = r.data;
      routePoints.value = data;

      // Usar updateMapRoute que considera filteredRoutePoints
      updateMapRoute();
      
      nextTick(() => {
        hideDevices(formData.value.deviceId);
        perfLog('loadRoute render', perfRender, `points:${data.length}`);
      });

      loadingState.value = 'idle';
      
      if (g && data.length > 0) {
        loadGraph();
      }
    })
    .catch((error) => {
      console.error('Erro ao carregar rota:', error);
      loadingState.value = 'error';
      ElMessage.error('Erro ao carregar dados do dispositivo');
      
      // Voltar ao idle após 3 segundos
      setTimeout(() => {
        loadingState.value = 'idle';
      }, 3000);
    });
}

// toggleCalor REMOVIDO - COMMIT 2: Agora usa watch em showHeatmap
// togglePercurso REMOVIDO - rota agora é sempre visível por padrão

</script>

<style scoped>
.el-select.el-select--large{
  width: 100%;
}


.device{
  border-bottom: var(--el-border-color-light) 1px solid;
  display: flex;
  flex-direction: row;
  text-align: center;
  cursor: pointer;
  margin-right: -1px;
}

.deviceHead{
  border-bottom: var(--el-border-color-light) 1px solid;
  display: flex;
  flex-direction: row;
  text-align: center;
  cursor: pointer;
  margin-right: -1px;
  background: var(--el-color-info-light);
}

.device:hover{
  background: var(--el-color-primary-light-9);
}



.device .name,.deviceHead .name{
  font-size: 12px;
  padding: 7px;
  text-align: left;
  line-height: 14px;
  font-weight: 800;
  border-right: silver 1px dotted;
  width: 60%;
}

.icons{
  display: flex;
  justify-content: center;
  flex-direction: row-reverse;
  flex: 1;
  font-size: 11px;
}

.icons div{
  display: flex;
  justify-content: center;
  flex: 1;
  border-right: silver 1px dotted;
  padding: 7px;
  font-size: 11px;
}
.icons div i{
  font-size: 14px;
}

.icons div:first-child{
  border-right: none;
}

.icons div span{
  display: flex;
  padding: 2px;
  padding-left: 5px;
}

.subtitle{
  margin-top: 20px;
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
  color: var(--text-black);
}

.subtitle i{
  font-size: 12px;
  margin-right: 3px;
}

/* Timeline Styles */
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

.timeline-point {
  display: flex;
  border-bottom: var(--el-border-color-lighter) 1px dotted;
  transition: background-color 0.2s;
}

.timeline-point:hover {
  background-color: var(--el-fill-color-lighter);
}

.timeline-point-start,
.timeline-point-end {
  border-bottom: var(--el-border-color-light) 2px solid;
}

.timeline-point-end {
  border-bottom: none;
  border-top: var(--el-border-color-light) 2px solid;
}

.timeline-time {
  text-align: right;
  padding: 10px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  position: relative;
  min-width: 90px;
  width: 90px;
}

.timeline-line {
  position: absolute;
  border-right: var(--el-border-color) 1px dashed;
  width: 1px;
  right: 3px;
  transform: translate(-55%, 0);
}

.timeline-line-bottom {
  height: 55%;
  bottom: 0%;
}

.timeline-line-top {
  height: 55%;
  top: 0%;
}

.timeline-line-full {
  height: 100%;
  bottom: 0%;
}

.timeline-icon {
  position: absolute;
  width: 20px;
  height: 20px;
  font-size: 16px;
  text-align: center;
  right: -10px;
  top: 50%;
  border-radius: 50%;
  transform: translateY(-50%);
  color: var(--el-color-primary);
}

.timeline-dot {
  position: absolute;
  background: var(--el-color-primary);
  width: 10px;
  height: 10px;
  right: 0px;
  top: 50%;
  border-radius: 50%;
  transform: translateY(-50%);
}

.timeline-date {
  position: absolute;
  right: 15px;
  top: 50%;
  border-radius: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  font-size: 11px;
  line-height: 1.3;
}

.timeline-address {
  padding: 10px;
  font-size: 14px;
  flex: 1;
  color: var(--el-text-color-primary);
}

.timeline-point-middle .timeline-address {
  font-size: 13px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.timeline-link {
  text-decoration: none;
  color: var(--el-text-color-primary);
  transition: color 0.2s;
}

.timeline-link:hover {
  color: var(--el-color-primary);
}

.timeline-speed {
  padding: 10px;
  min-width: 90px;
  width: 90px;
  text-align: right;
  font-size: 12px;
  color: var(--el-text-color-regular);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
}

.timeline-speed i {
  font-size: 14px;
  color: var(--el-color-success);
}

.timeline-scroll {
  overflow: auto;
  max-height: clamp(260px, 40vh, 420px);
}

/* ============================================================================ */
/* STATS CARD - Anti-zoom/scale inheritance (corrige contadores gigantes)       */
/* ============================================================================ */
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

/* Stats Container */
.stats-container {
  animation: fadeIn 0.3s ease-in;
}

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

.view-options .el-switch {
  margin-right: 0;
}

/* COMMIT 3: Seletor de cor da rota */
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

.stat-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

/* Responsividade mobile para stats */
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

/* ============================================ */
/* 🎯 MIGRAÇÃO: Estilos para atributos de ponto */
/* ============================================ */
.timeline-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 0;
}

.timeline-attributes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.attr-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  transition: transform 0.2s;
}

.attr-badge:hover {
  transform: scale(1.05);
}

.attr-badge i {
  font-size: 10px;
}

.attr-value {
  font-size: 10px;
}

.attr-success {
  background-color: var(--el-color-success-light-8);
  color: var(--el-color-success-dark-2);
}

.attr-danger {
  background-color: var(--el-color-danger-light-8);
  color: var(--el-color-danger-dark-2);
}

.attr-warning {
  background-color: var(--el-color-warning-light-8);
  color: var(--el-color-warning-dark-2);
}

.attr-info {
  background-color: var(--el-color-info-light-8);
  color: var(--el-color-info-dark-2);
}

/* 🎯 MIGRAÇÃO: Estilos para ponto ativo (sincronizado com mapa) */
.timeline-active {
  background-color: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
}

.timeline-dot-active {
  background: var(--el-color-primary) !important;
  box-shadow: 0 0 0 3px var(--el-color-primary-light-5);
  animation: pulse 1.5s infinite;
}

/* COMMIT 1: Estilos para pontos já visitados durante play */
.is-visited {
  opacity: 0.6;
  background-color: var(--el-color-success-light-9);
}

.is-visited .timeline-address,
.is-visited .timeline-date,
.is-visited .timeline-speed {
  color: var(--el-text-color-secondary);
}

.timeline-dot-visited {
  background: var(--el-color-success) !important;
  opacity: 0.7;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 3px var(--el-color-primary-light-5);
  }
  50% {
    box-shadow: 0 0 0 6px var(--el-color-primary-light-8);
  }
}

</style>