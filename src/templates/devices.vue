<template>
  <div class="devices-page" :class="{ 'is-compact': estilo === 'compact' }">
    <!-- ===== Linha de busca + ações ===== -->
    <div class="search-row">
      <el-input v-model="query" class="search-input" size="small"
        :placeholder="KT('device.search')" clearable @clear="onClearInput">
        <!-- Prefixo: filtro leve -->
        <template #prefix>
          <span class="filter-toggle-button" :class="{ 'active': showFiltersPanel || activeFiltersCount > 0 }"
            role="button" tabindex="0" @click="toggleFiltersPanel"
            @mouseenter.stop="showTip($event, 'Filtros avançados')" @mouseleave="hideTip">
            <i class="fas fa-filter"></i>
            <span v-if="activeFiltersCount > 0" class="filter-badge">{{ activeFiltersCount }}</span>
          </span>
        </template>
      </el-input>

      <div class="actions-group">
        <div v-if="EXPORT_ENABLED && displayDevices.length > 0" class="export-dropdown-wrapper">
          <el-button ref="exportBtnRef" class="export-btn" size="small" type="success"
            @click="toggleExportMenu"
            @mouseenter.stop="showTip($event, 'Exportar')" @mouseleave="hideTip">
            <i class="fas fa-file-export"></i>
          </el-button>
          
          <div v-if="showExportMenu" class="export-menu">
            <div class="export-menu-item" @click="exportToCsv('filtered')">
              <i class="fas fa-file-csv"></i>
              <span>CSV (filtrados)</span>
            </div>
            <div class="export-menu-item" @click="exportToCsv('visible')">
              <i class="fas fa-file-csv"></i>
              <span>CSV (visíveis)</span>
            </div>
            <div v-if="isXlsxAvailable" class="export-menu-divider"></div>
            <div v-if="isXlsxAvailable" class="export-menu-item" @click="exportToXlsx('filtered')">
              <i class="fas fa-file-excel"></i>
              <span>XLSX (filtrados)</span>
            </div>
            <div v-if="isXlsxAvailable" class="export-menu-item" @click="exportToXlsx('visible')">
              <i class="fas fa-file-excel"></i>
              <span>XLSX (visíveis)</span>
            </div>
          </div>
        </div>
        <el-button class="add-btn" size="small" type="primary" :disabled="!store.getters['checkDeviceLimit']"
          v-if="store.getters.advancedPermissions(13) && (store.state.auth.deviceLimit === -1 || store.state.auth.deviceLimit > 0)"
          @click="(store.getters['checkDeviceLimit']) ? editDeviceRef.newDevice() : deviceLimitExceded()"
          @mouseenter.stop="showTip($event, KT('device.add'))" @mouseleave="hideTip">
          <i class="fas fa-plus"></i>
        </el-button>
      </div>
    </div>

    <!-- ===== ETAPA 3B: Chips de filtros ativos ===== -->
    <div v-if="activeFilterChips.length > 0" class="active-filters-chips">
      <div v-for="chip in activeFilterChips" :key="chip.key" class="filter-chip">
        <span class="chip-label">{{ chip.label }}</span>
        <button class="chip-remove" @click="chip.onRemove" @mouseenter.stop="showTip($event, 'Remover filtro')" @mouseleave="hideTip">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div v-if="resultSummary" class="result-summary">{{ resultSummary }}</div>
    </div>

    <!-- ===== Painel de Filtros Avançados (UI apenas) ===== -->
    <div v-if="showFiltersPanel" class="filters-panel">
      <div class="filters-panel-header">
        <h4>Filtros</h4>
        <el-button type="text" @click="clearAllFilters" class="clear-all-btn">
          <i class="fas fa-trash-alt"></i> Limpar
        </el-button>
      </div>

      <!-- ETAPA 5A: Presets rápidos -->
      <div class="presets-section">
        <div class="presets-header">
          <span class="presets-title">Presets</span>
          <el-button type="text" @click="saveCurrentPreset" class="save-preset-btn"
            @mouseenter.stop="showTip($event, 'Salvar filtro atual')" @mouseleave="hideTip">
            <i class="fas fa-save"></i>
          </el-button>
        </div>
        
        <!-- Presets padrão -->
        <div class="presets-row">
          <div v-for="preset in defaultPresets" :key="preset.id" 
            class="preset-btn default" @click="applyPreset(preset)"
            @mouseenter.stop="showTip($event, preset.name)" @mouseleave="hideTip">
            <i :class="preset.icon"></i>
            <span>{{ preset.name }}</span>
          </div>
        </div>
        
        <!-- Presets salvos -->
        <div v-if="savedPresets.length > 0" class="saved-presets">
          <div class="saved-presets-label">Salvos</div>
          <div v-for="preset in savedPresets" :key="preset.id" class="preset-item">
            <div class="preset-btn saved" @click="applyPreset(preset)">
              <i class="fas fa-bookmark"></i>
              <span>{{ preset.name }}</span>
            </div>
            <button class="preset-remove" @click="removePreset(preset.id)"
              @mouseenter.stop="showTip($event, 'Remover preset')" @mouseleave="hideTip">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Linha 1: Situação -->
      <div class="filters-row primary-row">
        <div class="category-label">
          <span>Situação</span>
        </div>
        <div class="filters-group situacao-filters">
          <div class="filter-icon small" :class="{ active: situacaoFilter === 'todos' }" @click="filterDevices('todos')"
            @mouseenter.stop="showTip($event, 'Todos')" @mouseleave="hideTip">
            <i class="fas fa-layer-group"></i>
          </div>
          <div class="filter-icon small" :class="{ active: situacaoFilter === 'ativo' }" @click="filterDevices('ativo')"
            @mouseenter.stop="showTip($event, 'Ativos')" @mouseleave="hideTip">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="filter-icon small" :class="{ active: situacaoFilter === 'estoque' }"
            @click="filterDevices('estoque')" @mouseenter.stop="showTip($event, 'Estoque')" @mouseleave="hideTip">
            <i class="fas fa-box-open"></i>
          </div>
          <div class="filter-icon small" :class="{ active: situacaoFilter === 'desativado' }"
            @click="filterDevices('desativado')" @mouseenter.stop="showTip($event, 'Desativados')" @mouseleave="hideTip">
            <i class="fas fa-ban"></i>
          </div>
        </div>
      </div>

      <!-- Linha 2: Estilo -->
      <div class="filters-row">
        <div class="category-label"><span>Estilo</span></div>
        <div class="filters-group style-filters">
          <div class="filter-icon small" :class="{ active: estilo === 'cozy' }" @click="setEstilo('cozy')"
            @mouseenter.stop="showTip($event, 'Conforto')" @mouseleave="hideTip">
            <i class="fas fa-mug-hot"></i>
          </div>
          <div class="filter-icon small" :class="{ active: estilo === 'compact' }" @click="setEstilo('compact')"
            @mouseenter.stop="showTip($event, 'Compacto')" @mouseleave="hideTip">
            <i class="fas fa-th"></i>
          </div>
        </div>
      </div>

      <!-- Linha 3: Conectividade (ETAPA 3A) -->
      <div class="filters-row">
        <div class="category-label"><span>Conectividade</span></div>
        <div class="filters-group">
          <div class="filter-icon medium" :class="{ active: connectivityFilter === 'todos' }" 
            @click="connectivityFilter = 'todos'; localStorage.setItem('device_connectivity_filter', 'todos')"
            @mouseenter.stop="showTip($event, 'Todos')" @mouseleave="hideTip">
            <i class="fas fa-globe"></i>
          </div>
          <div class="filter-icon medium" :class="{ active: connectivityFilter === 'online' }" 
            @click="connectivityFilter = 'online'; localStorage.setItem('device_connectivity_filter', 'online')"
            @mouseenter.stop="showTip($event, 'Online')" @mouseleave="hideTip">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="filter-icon medium" :class="{ active: connectivityFilter === 'offline' }" 
            @click="connectivityFilter = 'offline'; localStorage.setItem('device_connectivity_filter', 'offline')"
            @mouseenter.stop="showTip($event, 'Offline')" @mouseleave="hideTip">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <div class="filter-icon small" :class="{ active: movingOnly }" 
            @click="movingOnly = !movingOnly; localStorage.setItem('device_moving_only', movingOnly)"
            @mouseenter.stop="showTip($event, 'Somente em movimento')" @mouseleave="hideTip">
            <i class="fas fa-running"></i>
          </div>
        </div>
      </div>
    </div>

  <div style="border: silver 1px solid; border-radius: 5px;margin-top: 12px;height: calc(100vh - 200px);">
    <div class="deviceHead">
      <div v-if="store.getters['isAdmin']" @click="store.dispatch('devices/setSorting','id')" class="name" style="font-size: 12px;box-sizing: border-box;font-weight: 100;padding: 5px;flex: 1 1 15%;">
        {{KT('device.id')}}
        <span v-if="store.getters['devices/sorting']==='id-asc'">
          <i class="fas fa-sort-alpha-down"></i>
        </span>
        <span v-else-if="store.getters['devices/sorting']==='id-desc'">
          <i  class="fas fa-sort-alpha-up"></i>
        </span>
        <span v-else>
          <i style="color: silver;" class="fas fa-sort-alpha-down"></i>
        </span>
      </div>
      <div @click="store.dispatch('devices/setSorting','name')" class="name" style="font-size: 12px;box-sizing: border-box;font-weight: 100;padding: 5px;flex: 1 1 40%;">
        {{KT('device.name')}}
        <span v-if="store.getters['devices/sorting']==='name-asc'">
          <i class="fas fa-sort-alpha-down"></i>
        </span>
        <span v-else-if="store.getters['devices/sorting']==='name-desc'">
          <i class="fas fa-sort-alpha-up"></i>
        </span>
        <span v-else>
          <i style="color: silver;" class="fas fa-sort-alpha-down"></i>
        </span>
      </div>      
      <div @click="store.dispatch('devices/setSorting','status')" class="name" style="font-size: 12px;box-sizing: border-box;font-weight: 100;padding: 5px;flex: 1 1 15%;">
        <span v-if="store.getters['devices/sorting']==='status-asc'">
          <i class="fas fa-sort-alpha-down"></i>
        </span>
        <span v-else-if="store.getters['devices/sorting']==='status-desc'">
          <i  class="fas fa-sort-alpha-up"></i>
        </span>
        <span v-else>
          <i style="color: silver;" class="fas fa-sort-alpha-down"></i>
        </span>
      </div>
      <div @click="store.dispatch('devices/setSorting','lastUpdate')" class="name" style="font-size: 12px;box-sizing: border-box;font-weight: 100;padding: 5px;text-align: center;flex: 1 1 30%;">
        {{KT('device.updated')}}

        <span v-if="store.getters['devices/sorting']==='lastUpdate-asc'">
          <i class="fas fa-sort-alpha-down"></i>
        </span>
        <span v-else-if="store.getters['devices/sorting']==='lastUpdate-desc'">
          <i class="fas fa-sort-alpha-up"></i>
        </span>
        <span v-else>
          <i style="color: silver;" class="fas fa-sort-alpha-down"></i>
        </span>
      </div>
      <div class="icons" @click="setSortingByState()"  style="flex: none;width: 183px !important;font-size: 12px;box-sizing: border-box;font-weight: 100;padding: 5px;text-align: center;flex: 1 1 35%">
        {{store.getters['devices/sorting']}}

        <span><i class="fas fa-sort"></i></span>
      </div>
    </div>
    <div ref="realDevices" @scroll="realScroll($event)" style="overflow-x: hidden;overflow-y: scroll;height: calc(100vh - 230px);">
      <div class="fakeScroll" :style="{height: (displayDevices.length*33)+'px'}">

        <div v-for="(group) in displayedGroupedDevices" :key="group.id">
          <div v-if="group.id!==-1" style="background: #f7f7f7;padding: 5px;font-size: 13px;"><i class="far fa-object-group"></i>&nbsp;&nbsp;&nbsp;{{group.name}}</div>

          <div v-for="(device) in group.devices" :key="device.id" class="device" :class="{'isDisabled': device.disabled}" @click="markerClick(device.id)" @contextmenu.prevent="markerContext($event,device.id)" :set="position = store.getters['devices/getPosition'](device.id)">                      
          <div v-if="store.getters['isAdmin']" class="name" style="width: 90px;box-sizing: border-box;overflow: hidden;white-space: nowrap;text-align: center; flex: 1 1 15%" >{{device.id}}</div>            
          <div class="name" style="flex: 1 1 40%;;">{{device.name}}</div>
          <div class="name" style="width: 32px;overflow: hidden;text-align: center;font-size: 18px;box-sizing: border-box;overflow: hidden;flex: 1 1 15%;">
            <div
                @mouseleave="hideTip" @mouseenter.stop="showTip($event,device.disabled ? KT('disabled') : device.lastUpdate===null ? KT('new') : device.status === 'online' ? KT('online'): (device.status==='offline') ? KT('offline'):KT('unknown'))"
               >
              <span v-if="device.lastUpdate===null"><i  style="color: var(--el-color-info);" class="fas fa-question-circle"></i></span>
              <span v-else-if="device.status==='online'" ><i style="color: var(--el-color-success);" class="fas fa-check-circle"></i></span>
              <span v-else-if="device.status==='offline'" ><i style="color: var(--el-color-danger);" class="fas fa-exclamation-circle"></i></span>
              <span v-else ><i class="fas fa-question-circle" style="color: var(--el-color-warning);"></i></span>
            </div>

          </div>
          <div class="name" style="width: 90px;box-sizing: border-box;overflow: hidden;white-space: nowrap;text-align: center; flex: 1 1 30%" >{{getLastUpdated(device.lastUpdate,now)}}</div>
          <div v-if="position" class="icons" style="width: 178px !important;flex: 1 1 35%;">


              <div v-if="position.attributes.alarm"
                  @mouseleave="hideTip" @mouseenter.stop="showAlarmTip($event,device.id)"
                  :style="{color: 'var(--el-color-danger)'}"><i class="fas fa-exclamation-triangle"></i></div>

              <div v-else
                   @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('alarms.none'))" :style="{color: 'var(--el-color-info)'}"><i class="fas fa-exclamation-triangle"></i></div>


            <div
                v-if="position.attributes['driverUniqueId']"
                @mouseleave="hideTip" @mouseenter.stop="showDriverTip($event,device.id)"
                :style="{color: 'var(--el-color-success)'}"><i class="far fa-id-card"></i></div>

            <div
                v-else-if="position.attributes['isQrLocked'] && position.attributes['isQrLocked']==true"
                @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('device.noDriverLocked'))"
                :style="{color: 'var(--el-color-danger)'}"><i class="far fa-id-card"></i></div>

            <div
                v-else
                @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('device.noDriver'))"
                :style="{color: 'var(--el-color-info)'}"><i class="far fa-id-card"></i></div>






              <div
                  @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('device.ignitionOn'))"
                  v-if="position.attributes.ignition===true" :style="{color: 'var(--el-color-success)'}"><i class="fas fa-key"></i></div>

              <div
                  @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('device.ignitionOff'))"
                  v-else-if="position.attributes.ignition===false" :style="{color: 'var(--el-color-danger)'}"><i class="fas fa-key"></i></div>

              <div
                  @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('unknown'))"
                  v-else :style="{color: 'var(--el-color-info)'}"><i class="fas fa-key"></i></div>



              <div
                  @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('device.blocked'))"
                  v-if="position.attributes.blocked===true" :style="{color: 'var(--el-color-danger)'}"><i class="fas fa-lock"></i></div>

              <div
                  @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('device.unblocked'))"
                  v-else-if="position.attributes.blocked===false"  :style="{color: 'var(--el-color-success)'}"><i class="fas fa-lock-open"></i></div>

              <div
                  v-else
                  @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('unknown'))"
                  :style="{color: 'var(--el-color-info)'}"><i class="fas fa-lock-open"></i></div>

            <template v-if="store.state.server.isPlus && store.getters.advancedPermissions(9)">
              <div
                  v-if="store.getters['geofences/isAnchored'](device.id)"
                  @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('device.anchorEnabled'))"
                  :style="{color: 'var(--el-color-warning)'}"><i class="fas fa-anchor"></i></div>

              <div
                  v-else
                  @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('device.anchorDisabled'))"
                  :style="{color: 'var(--el-color-info)'}"><i class="fas fa-anchor"></i></div>
            </template>




            <div
                v-if="position.attributes.motion"
                @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('device.moving'))"
                :style="{color: 'var(--el-color-primary)'}"><i class="fas fa-angle-double-right"></i></div>

            <div
                v-else-if="position.attributes.stoppedTime"
                @mouseleave="hideTip" @mouseenter.stop="showStopped($event,device.id)"
                :style="{color: 'var(--el-color-info)'}"><i class="fas fa-angle-double-right"></i></div>
            <div
                v-else
                @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('device.stoped'))"
                :style="{color: 'var(--el-color-info)'}"><i class="fas fa-angle-double-right"></i></div>




          </div>
          <div v-else class="icons" style="flex: none;width: 178px !important;">
            <div style="color: var(--el-text-color-disabled-base)">
              <i>
                <svg xmlns="http://www.w3.org/2000/svg" style="opacity: 0.3"  height="15px" viewBox="0 0 640 512">
                  <path d="M154 95.42C187.3 38.35 249.2 0 320 0C426 0 512 85.96 512 192C512 230.7 489 282.8 459 334.5L630.8 469.1C641.2 477.3 643.1 492.4 634.9 502.8C626.7 513.2 611.6 515.1 601.2 506.9L9.196 42.89C-1.236 34.71-3.065 19.63 5.112 9.196C13.29-1.236 28.37-3.065 38.81 5.112L154 95.42zM257.8 176.8L349.6 248.7C370.1 238 384 216.7 384 192C384 156.7 355.3 128 320 128C289.9 128 264.7 148.8 257.8 176.8zM296.3 499.2C245.9 436.2 132.3 285.2 128.1 196.9L406.2 416.1C382.7 449.5 359.9 478.9 343.7 499.2C331.4 514.5 308.6 514.5 296.3 499.2V499.2z"/>
                </svg>
              </i> <span>{{KT('device.noPosition')}}</span>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  </div>
  </div>

</template>

<script setup>



import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'


import { ElButton, ElInput } from "element-plus";


import {ref,computed,inject,onMounted,watch,onBeforeUnmount} from 'vue';
import {useStore} from "vuex"

import KT from '../tarkan/func/kt.js';

// ETAPA 4A: Feature flag para exportação
const EXPORT_ENABLED = true;

const store = useStore();

const markerContext = inject('markerContext');
const markerClick = inject('markerClick');

const filteredDevices = ref([]);

const query = ref(localStorage.getItem('device_query') || '');
const estilo = ref(localStorage.getItem('device_estilo') || 'cozy');
const situacaoFilter = ref('todos');
const showFiltersPanel = ref(false);
const showExportMenu = ref(false);
const exportBtnRef = ref(null);

// ETAPA 4B: Verificar disponibilidade de XLSX
const isXlsxAvailable = computed(() => {
  return typeof window !== 'undefined' && window.XLSX !== undefined;
});

// ETAPA 3A: Filtros de conectividade
const connectivityFilter = ref(localStorage.getItem('device_connectivity_filter') || 'todos');
const movingOnly = ref(localStorage.getItem('device_moving_only') === 'true');

// ETAPA 5A: Presets de filtros
const defaultPresets = [
  {
    id: 'preset_offline',
    name: 'Offline',
    icon: 'fas fa-exclamation-circle',
    filters: {
      situacaoFilter: 'todos',
      connectivityFilter: 'offline',
      movingOnly: false,
      query: '',
      estilo: 'cozy'
    }
  },
  {
    id: 'preset_moving',
    name: 'Em movimento',
    icon: 'fas fa-running',
    filters: {
      situacaoFilter: 'todos',
      connectivityFilter: 'todos',
      movingOnly: true,
      query: '',
      estilo: 'cozy'
    }
  },
  {
    id: 'preset_ativo',
    name: 'Ativos',
    icon: 'fas fa-check-circle',
    filters: {
      situacaoFilter: 'ativo',
      connectivityFilter: 'todos',
      movingOnly: false,
      query: '',
      estilo: 'cozy'
    }
  },
  {
    id: 'preset_estoque',
    name: 'Estoque',
    icon: 'fas fa-box-open',
    filters: {
      situacaoFilter: 'estoque',
      connectivityFilter: 'todos',
      movingOnly: false,
      query: '',
      estilo: 'cozy'
    }
  }
];

const loadSavedPresets = () => {
  try {
    const stored = localStorage.getItem('device_filter_presets');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading presets:', error);
    return [];
  }
};

const savedPresets = ref(loadSavedPresets());

const activeFiltersCount = computed(() => {
  let count = 0;
  if (situacaoFilter.value !== 'todos') count++;
  if (estilo.value !== 'cozy') count++;
  if (connectivityFilter.value !== 'todos') count++;
  if (movingOnly.value) count++;
  return count;
});

// ETAPA 3B: Chips de filtros ativos
const activeFilterChips = computed(() => {
  const chips = [];
  
  if (situacaoFilter.value !== 'todos') {
    const labels = {
      'ativo': 'Ativo',
      'estoque': 'Estoque',
      'desativado': 'Desativado'
    };
    chips.push({
      key: 'situacao',
      label: `Situação: ${labels[situacaoFilter.value] || situacaoFilter.value}`,
      onRemove: () => {
        situacaoFilter.value = 'todos';
        filterDevices('todos');
      }
    });
  }
  
  if (connectivityFilter.value !== 'todos') {
    const labels = {
      'online': 'Online',
      'offline': 'Offline'
    };
    chips.push({
      key: 'connectivity',
      label: `Conectividade: ${labels[connectivityFilter.value]}`,
      onRemove: () => {
        connectivityFilter.value = 'todos';
        localStorage.removeItem('device_connectivity_filter');
      }
    });
  }
  
  if (movingOnly.value) {
    chips.push({
      key: 'moving',
      label: 'Em movimento',
      onRemove: () => {
        movingOnly.value = false;
        localStorage.removeItem('device_moving_only');
      }
    });
  }
  
  return chips;
});

// ETAPA 3B: Resumo inteligente de resultados
const resultSummary = computed(() => {
  const displayed = displayDevices.value.length;
  const total = filteredDevices.value.length;
  
  if (displayed === total || displayed === 0) {
    return null;
  }
  
  return `Mostrando ${displayed} de ${total} dispositivos`;
});

// ETAPA 4B: Datasets para exportação
const exportDevicesFiltered = computed(() => {
  return displayDevices.value;
});

const exportDevicesVisible = computed(() => {
  return chunkedDisplayDevices.value;
});

const editDeviceRef = inject('edit-device');

// UI handlers
const toggleFiltersPanel = () => {
  showFiltersPanel.value = !showFiltersPanel.value;
};

const toggleExportMenu = () => {
  showExportMenu.value = !showExportMenu.value;
};

const closeExportMenu = () => {
  showExportMenu.value = false;
};

const clearAllFilters = () => {
  situacaoFilter.value = 'todos';
  estilo.value = 'cozy';
  connectivityFilter.value = 'todos';
  movingOnly.value = false;
  filterDevices('todos');
  localStorage.removeItem('device_estilo');
  localStorage.removeItem('device_connectivity_filter');
  localStorage.removeItem('device_moving_only');
};

// ETAPA 5A: Funções de presets
const applyPreset = (preset) => {
  const filters = preset.filters;
  
  // Aplicar todos os filtros do preset
  situacaoFilter.value = filters.situacaoFilter || 'todos';
  connectivityFilter.value = filters.connectivityFilter || 'todos';
  movingOnly.value = filters.movingOnly || false;
  query.value = filters.query || '';
  estilo.value = filters.estilo || 'cozy';
  
  // Atualizar localStorage
  localStorage.setItem('device_estilo', estilo.value);
  localStorage.setItem('device_connectivity_filter', connectivityFilter.value);
  localStorage.setItem('device_moving_only', movingOnly.value);
  localStorage.setItem('device_query', query.value);
  
  // Aplicar filtro de situação
  filterDevices(situacaoFilter.value);
};

const saveCurrentPreset = () => {
  const name = window.prompt('Nome do preset:');
  
  if (!name || name.trim() === '') {
    return;
  }
  
  const newPreset = {
    id: 'preset_custom_' + Date.now(),
    name: name.trim(),
    filters: {
      situacaoFilter: situacaoFilter.value,
      connectivityFilter: connectivityFilter.value,
      movingOnly: movingOnly.value,
      query: query.value,
      estilo: estilo.value
    }
  };
  
  savedPresets.value.push(newPreset);
  
  try {
    localStorage.setItem('device_filter_presets', JSON.stringify(savedPresets.value));
  } catch (error) {
    console.error('Error saving preset:', error);
  }
};

const removePreset = (presetId) => {
  savedPresets.value = savedPresets.value.filter(p => p.id !== presetId);
  
  try {
    localStorage.setItem('device_filter_presets', JSON.stringify(savedPresets.value));
  } catch (error) {
    console.error('Error removing preset:', error);
  }
};

const setEstilo = (value) => {
  estilo.value = value;
  localStorage.setItem('device_estilo', value);
};

const onClearInput = () => {
  query.value = '';
};

// const editGroupRef = inject('edit-group');

const now = ref(0);


const deviceLimitExceded = ()=>{

}

const showTip = (evt,text)=>{
  window.$showTip(evt,text);
}

const hideTip = (evt,text)=>{
  window.$hideTip(evt,text);
}

const showAlarmTip = ($event,deviceId)=>{
  const position = store.getters['devices/getPosition'](deviceId);
  showTip($event,KT('alarms.'+position.attributes.alarm))
}


const showStopped = ($event,deviceId)=>{

  const position = store.getters['devices/getPosition'](deviceId);

  showTip($event,'Parado há '+getLastUpdated(position.attributes.stoppedTime,now.value))
}

const showDriverTip = ($event,deviceId)=>{
  const position = store.getters['devices/getPosition'](deviceId);

  if(position.attributes['driverUniqueId']){
    const driver = store.getters['drivers/getDriverByUniqueId'](position.attributes['driverUniqueId']);
    if(driver){
      showTip($event,driver.name)
    }else{
      showTip($event,position.attributes['driverUniqueId'])
    }
  }

}

const realDevices = ref(null);
const offsetDevices = ref(0);
const maxDevices = ref(0);

// ETAPA 2C: Controle de sync de markers do mapa
const prevVisibleIds = new Set();
let syncDebounceTimer = null;

// ETAPA 3A: Helpers para filtros de conectividade
const getDeviceConnectivity = (device) => {
  // Prioridade 1: device.status
  if (device.status !== undefined && device.status !== null) {
    return device.status;
  }
  
  // Prioridade 2: device.attributes?.status
  if (device.attributes && device.attributes.status !== undefined && device.attributes.status !== null) {
    return device.attributes.status;
  }
  
  // Prioridade 3: lastUpdate comparison (10 minutos = 600000ms)
  const lastUpdate = device.lastUpdate || device.attributes?.lastUpdate;
  if (lastUpdate) {
    const tenMinutesAgo = Date.now() - 600000;
    return new Date(lastUpdate).getTime() > tenMinutesAgo ? 'online' : 'offline';
  }
  
  // Fallback final
  return 'unknown';
};

const getDeviceMoving = (device) => {
  if (!device.attributes) return false;
  return (device.attributes.speed > 0) || (device.attributes.motion === true);
};

// ETAPA 4A: Helpers para exportação CSV
const escapeCsv = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // Verifica se precisa escapar (contém vírgula, aspas ou quebra de linha)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Duplica aspas duplas e envolve em aspas
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }
  
  return stringValue;
};

const toCsvRow = (device) => {
  const connectivity = getDeviceConnectivity(device);
  const moving = getDeviceMoving(device);
  const lastUpdate = device.lastUpdate || device.attributes?.lastUpdate || '';
  
  return [
    escapeCsv(device.name),
    escapeCsv(device.id),
    escapeCsv(device.uniqueId),
    escapeCsv(device.attributes?.['situacao'] || ''),
    escapeCsv(connectivity),
    escapeCsv(moving ? 'Sim' : 'Não'),
    escapeCsv(device.attributes?.speed || ''),
    escapeCsv(lastUpdate)
  ].join(',');
};

const downloadCsv = (filename, csvText) => {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Revogar URL após uso
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};

const exportToCsv = (mode = 'filtered') => {
  closeExportMenu();
  
  const list = mode === 'visible' ? exportDevicesVisible.value : exportDevicesFiltered.value;
  
  if (list.length === 0) {
    return;
  }
  
  // Header CSV
  const header = ['Nome', 'ID', 'UniqueId', 'Situação', 'Conectividade', 'Em Movimento', 'Velocidade', 'Última Atualização'].join(',');
  
  // Linhas de dados
  const rows = list.map(device => toCsvRow(device));
  
  // CSV completo
  const csvContent = [header, ...rows].join('\n');
  
  // Nome do arquivo com timestamp
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
  const modeLabel = mode === 'visible' ? 'visiveis' : 'filtrados';
  const filename = `devices_export_${modeLabel}_${timestamp}.csv`;
  
  downloadCsv(filename, csvContent);
};

// ETAPA 4B: Exportação XLSX
const exportToXlsx = (mode = 'filtered') => {
  closeExportMenu();
  
  if (!isXlsxAvailable.value) {
    console.warn('XLSX library not available');
    return;
  }
  
  const list = mode === 'visible' ? exportDevicesVisible.value : exportDevicesFiltered.value;
  
  if (list.length === 0) {
    return;
  }
  
  try {
    // Montar array de objetos para XLSX
    const rows = list.map(device => {
      const connectivity = getDeviceConnectivity(device);
      const moving = getDeviceMoving(device);
      const lastUpdate = device.lastUpdate || device.attributes?.lastUpdate || '';
      
      return {
        'Nome': device.name || '',
        'ID': device.id || '',
        'UniqueId': device.uniqueId || '',
        'Situação': device.attributes?.['situacao'] || '',
        'Conectividade': connectivity || '',
        'Em Movimento': moving ? 'Sim' : 'Não',
        'Velocidade': device.attributes?.speed || '',
        'Última Atualização': lastUpdate
      };
    });
    
    // Criar worksheet
    const ws = window.XLSX.utils.json_to_sheet(rows);
    
    // Criar workbook
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Devices');
    
    // Nome do arquivo com timestamp
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
    const modeLabel = mode === 'visible' ? 'visiveis' : 'filtrados';
    const filename = `devices_export_${modeLabel}_${timestamp}.xlsx`;
    
    // Download
    window.XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Error exporting to XLSX:', error);
  }
};

// Debounce para otimizar recálculos
let recalcTimeout = null;
const debouncedRecalc = (situacao = null, delay = 150) => {
  if (recalcTimeout) {
    clearTimeout(recalcTimeout);
  }
  recalcTimeout = setTimeout(() => {
    filteredDevices.value = recalcDevices(situacao);
  }, delay);
};

const validStates = [
    'motion',
    'anchor',
    'locked',
    'ignition',
    'driver',
    'alert'
]

const setSortingByState = ()=>{

    const tmp = store.getters['devices/sorting'].split("-");

    if(tmp[0]==='state') {
      let idx = validStates.findIndex((i)=> i===tmp[1])+1;
      if(idx>(validStates.length-1)){
        store.dispatch("devices/setSorting","name");
      }else {
        store.dispatch('devices/setSortingState', 'state-' + validStates[idx]);
      }
    }else{
      store.dispatch('devices/setSortingState','state-motion');
    }
}

onMounted(()=>{

  const real = realDevices.value;

  maxDevices.value = Math.floor(real.clientHeight / 33)+3;
  offsetDevices.value = Math.floor(real.scrollTop / 33);
  setInterval(()=>{
    now.value = new Date();
  },3000);

  // Primeiro carregamento sem debounce
  filteredDevices.value = recalcDevices();

  // Prefetch do componente devices.internal para que o primeiro clique seja instantâneo
  // O chunk será baixado em background enquanto o usuário visualiza a lista
  setTimeout(() => {
    import('./devices.internal.vue');
  }, 1000);
});

// Debounce na busca por texto (usuário digitando)
watch(query,()=>{
  localStorage.setItem('device_query', query.value);
  debouncedRecalc(null, 300);
});

// Debounce quando a lista de dispositivos muda
watch(()=> store.getters['devices/getOrderedDevices'].length,()=>{
  debouncedRecalc(null, 150);
});

// Sem debounce na ordenação (ação direta do usuário)
watch(()=> store.getters['devices/sorting'],()=>{
  filteredDevices.value = recalcDevices();
});

const realScroll = (event)=>{
  const real = event.target;


  maxDevices.value = Math.floor(real.clientHeight / 33)+3;
  offsetDevices.value = Math.floor(real.scrollTop / 33);

}




const getLastUpdated = (t,tt)=>{
  tt = new Date();

  if(t===null){
    return KT('new');
  }

  const diff = Math.round((new Date(tt).getTime() - new Date(t).getTime())/1000);

  if(diff<0){
    return KT('now');
  }else if(diff>86400){
    const dias = Math.round(diff/86400);

    return dias+' '+KT('days');
  }else if(diff>3600){
    const horas = Math.round(diff/3600);

    return horas+' '+KT('hours');
  }else if(diff>60){
    const minutos = Math.round(diff/60);

    return minutos+' '+KT('minutes');
  }else{
    return KT('lessMinute');
  }

}


const filterDevices = (situacao) => {
  situacaoFilter.value = situacao;
  if (situacao === 'todos') {
    filteredDevices.value = recalcDevices(); // Chama recalcDevices sem filtro
  } else {
    filteredDevices.value = recalcDevices(situacao.toLowerCase()); // Garante que o filtro seja case insensitive
  }
};



const recalcDevices = (situacao = null) => {
  localStorage.setItem('device_query', query.value);

  const r = query.value.toLowerCase().matchAll(/(.*?):(?<sinal>\+|-|=)(?<tempo>\d*) (?<filtro>dias|minutos|horas|segundos)/gi);
  const s = r.next();

  let groupList = [];

  store.state.groups.groupList.forEach((g) => {
    if (String(g.name).toLowerCase().match(query.value.toLowerCase())) {
      groupList.push(g.id);
    }
  });

  let tmp = [];

  store.getters['devices/getOrderedDevices'].forEach((dk) => {
    const d = store.getters['devices/getDevice'](dk);
    let visible = false;

    // Verifica se o campo 'situacao' existe e é válido antes de tentar acessá-lo
    const deviceSituacao = d.attributes['situacao'] ? d.attributes['situacao'].toLowerCase() : null;

    // Verifica se há uma situação específica para filtrar
    if (situacao && deviceSituacao === situacao) {
      visible = true;
    } else if (!situacao) {
      // Lógica de filtro atual baseada em query
      if (s.value) {
        if (s.value.groups.filtro === 'dias') {
          const df = parseInt(s.value.groups.tempo) * 86400;
          const diff = Math.round((new Date().getTime() - new Date(d.lastUpdate).getTime()) / 1000);

          if (s.value.groups.sinal === '+' && diff >= df) {
            visible = true;
          } else if (s.value.groups.sinal === '-' && diff <= df) {
            visible = true;
          }
        }
      }

      for (let k of Object.keys(d)) {
        if (k === 'status' && String(d[k]).toLowerCase().replace('unknown', 'desconhecido').match(query.value.toLowerCase())) {
          visible = true;
        } else if (String(d[k]).toLowerCase().match(query.value.toLowerCase())) {
          visible = true;
        }
      }

      for (let k of Object.keys(d.attributes)) {
        if (d.attributes[k] && d.attributes[k].toString().toLowerCase().match(query.value.toLowerCase())) {
          visible = true;
        }
      }

      if (!visible && d.groupId !== 0 && groupList.includes(d.groupId)) {
        visible = true;
      }
    }

    if (visible) {
      tmp.push(d);
    }
  });

  return tmp;
};




// ETAPA 2A/3A: Computed final que aplica todos os filtros em cascata
const displayDevices = computed(() => {
  let result = filteredDevices.value;
  
  // Filtro de situação (ETAPA 2A)
  if (situacaoFilter.value !== 'todos') {
    result = result.filter((device) => {
      const deviceSituacao = device.attributes?.['situacao'] ? device.attributes['situacao'].toLowerCase() : null;
      return deviceSituacao === situacaoFilter.value;
    });
  }
  
  // Filtro de conectividade (ETAPA 3A)
  if (connectivityFilter.value !== 'todos') {
    result = result.filter((device) => {
      const connectivity = getDeviceConnectivity(device);
      return connectivity === connectivityFilter.value;
    });
  }
  
  // Filtro "somente em movimento" (ETAPA 3A)
  if (movingOnly.value) {
    result = result.filter((device) => {
      return getDeviceMoving(device);
    });
  }
  
  return result;
});

const chunkedDisplayDevices = computed(()=>{
  let tmp = Object.assign([],displayDevices.value);
  return tmp.splice(0,maxDevices.value+offsetDevices.value);
});

const displayedGroupedDevices = computed(()=>{
  let showGroups = store.getters['mapPref']('groups');

  if(showGroups){
    let tmp = {};
    const groups = store.state.groups.groupList;

    chunkedDisplayDevices.value.forEach((device)=>{
        if(!groups.find((g)=> g.id===device.groupId )){
          if (!tmp[0]) {
            tmp[0] = [];
          }
          tmp[0].push(device);
        }else {
          if (!tmp[device.groupId]) {
            tmp[device.groupId] = [];
          }
          tmp[device.groupId].push(device);
        }
    })

    let list = [];
    list.push({id: 0,name: 'Sem Grupo',devices: tmp[0]});
    groups.forEach((g)=>{
      if(tmp[g.id] && tmp[g.id].length>0) {
        list.push({id: g.id, name: g.name, devices: tmp[g.id]});
      }
    })

    return list;
  }else{
    return [{id: -1,name: '',devices: chunkedDisplayDevices.value}];
  }
})

// ETAPA 2C: Computed para sync de markers (janela virtual flat)
const visibleDevicesForMap = computed(() => {
  return chunkedDisplayDevices.value;
});

// ETAPA 2C: Helpers para manipular markers (reutiliza lógica baseline)
const safeIconRemove = (icon) => {
  if (!icon) return;
  if (Array.isArray(icon)) {
    icon.forEach(i => i?.remove?.());
  } else {
    icon.remove?.();
  }
};

const safeIconAddToMap = (icon) => {
  if (!icon) return;
  if (Array.isArray(icon)) {
    icon.forEach(i => i?.addToMap?.());
  } else {
    icon.addToMap?.();
  }
};

// ETAPA 2C: Sync de markers com diff de IDs
const syncMapMarkers = () => {
  const nowIds = new Set(visibleDevicesForMap.value.map(d => d.id));
  
  // IDs para adicionar
  const toAdd = [...nowIds].filter(id => !prevVisibleIds.has(id));
  
  // IDs para remover
  const toRemove = [...prevVisibleIds].filter(id => !nowIds.has(id));
  
  // Remove markers que saíram da janela
  toRemove.forEach(deviceId => {
    const device = store.getters['devices/getDevice'](deviceId);
    if (device?.icon) {
      safeIconRemove(device.icon);
    }
  });
  
  // Adiciona markers que entraram na janela
  toAdd.forEach(deviceId => {
    const device = store.getters['devices/getDevice'](deviceId);
    if (device?.icon) {
      safeIconAddToMap(device.icon);
    }
  });
  
  // Atualiza estado
  prevVisibleIds.clear();
  nowIds.forEach(id => prevVisibleIds.add(id));
};

// ETAPA 2C: Watcher com debounce
watch(visibleDevicesForMap, () => {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }
  
  syncDebounceTimer = setTimeout(() => {
    syncMapMarkers();
  }, 80);
}, { deep: true });

// ETAPA 4B: Listener para fechar menu ao clicar fora
const handleClickOutside = (event) => {
  if (showExportMenu.value && exportBtnRef.value && !exportBtnRef.value.$el.contains(event.target)) {
    const menu = document.querySelector('.export-menu');
    if (menu && !menu.contains(event.target)) {
      closeExportMenu();
    }
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

// ETAPA 2C: Cleanup no unmount
onBeforeUnmount(() => {
  // Remove listener de clique fora
  document.removeEventListener('click', handleClickOutside);
  
  // Remove todos os markers ainda visíveis
  prevVisibleIds.forEach(deviceId => {
    const device = store.getters['devices/getDevice'](deviceId);
    if (device?.icon) {
      safeIconRemove(device.icon);
    }
  });
  prevVisibleIds.clear();
  
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }
});



</script>

<style scoped>
/* =========================== WRAPPER ===========================  */
.devices-page {
  padding: 0;
}

/* =========================== BARRA DE BUSCA + AÇÕES =========================== */
.search-row{
  display:flex;align-items:center;gap:8px;margin-bottom:12px;width:100%;
  flex-wrap:nowrap;
}

.search-input{flex:1 1 auto;min-width:0;}
.search-input :deep(.el-input__wrapper){
  height:32px;padding-left:24px;padding-right:8px;box-shadow:0 1px 2px rgba(0,0,0,.06);
}
.search-input :deep(.el-input__inner){line-height:30px;font-size:13px;}
.search-input :deep(.el-input__prefix){
  display:flex;align-items:center;padding-left:2px;gap:0;height:100%;
}

.filter-toggle-button{
  padding:0;margin-left:2px;margin-right:4px;position:relative;color:#909399;width:12px;height:12px;
  display:inline-flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;font-size:10px;
  cursor:pointer;
}
.filter-toggle-button:hover{color:var(--el-color-primary);transform:translateY(-1px);}
.filter-toggle-button.active{color:var(--el-color-primary);transform:scale(1.05);text-shadow:0 0 5px rgba(64,158,255,.25);}
.filter-badge{
  position:absolute;top:-6px;right:-7px;background:#F56C6C;color:#fff;border-radius:10px;min-width:14px;height:14px;
  font-size:9px;padding:0 4px;display:flex;align-items:center;justify-content:center;font-weight:700;box-sizing:border-box;
  box-shadow:0 1px 2px rgba(0,0,0,.2);animation:pulseBadge 2s infinite;
}

.actions-group{
  display:flex;align-items:center;gap:6px;flex-wrap:nowrap;flex-shrink:0;min-width:fit-content;
  margin-left:auto;
}

.search-row .el-button{
  border-radius:50% !important;width:32px;height:32px;min-width:32px;padding:0;
  display:inline-flex;align-items:center;justify-content:center;
  box-shadow:0 3px 6px rgba(0,0,0,.12);transition:all .15s ease;flex-shrink:0;
}
.search-row .el-button:hover{transform:translateY(-1px);box-shadow:0 4px 8px rgba(0,0,0,.16);}

.add-btn{
  background:var(--el-color-primary);border-color:var(--el-color-primary);color:#fff;
  box-shadow:0 4px 8px rgba(0,110,255,.18);transition:transform .15s, box-shadow .15s;
}
.add-btn:hover{transform:translateY(-2px);box-shadow:0 6px 12px rgba(0,110,255,.28);}

.export-btn{
  background:#67c23a;border-color:#67c23a;color:#fff;
  box-shadow:0 4px 8px rgba(103,194,58,.18);transition:transform .15s, box-shadow .15s;
}
.export-btn:hover{transform:translateY(-2px);box-shadow:0 6px 12px rgba(103,194,58,.28);}

/* =========================== ETAPA 4B: EXPORT DROPDOWN =========================== */
.export-dropdown-wrapper{position:relative;display:inline-block;}

.export-menu{
  position:absolute;top:calc(100% + 4px);right:0;background:#fff;
  border:1px solid #e4e7ed;border-radius:6px;box-shadow:0 2px 12px rgba(0,0,0,.15);
  min-width:160px;z-index:2000;padding:4px 0;animation:fadeIn .2s ease;
}

.export-menu-item{
  display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;
  font-size:12px;color:#606266;transition:all .15s ease;
}

.export-menu-item:hover{
  background:#f5f7fa;color:#409EFF;
}

.export-menu-item i{
  width:14px;font-size:12px;text-align:center;
}

.export-menu-item .fa-file-csv{color:#67c23a;}
.export-menu-item .fa-file-excel{color:#409EFF;}

.export-menu-divider{
  height:1px;background:#e4e7ed;margin:4px 0;
}

/* =========================== PAINEL DE FILTROS =========================== */
.filters-panel{
  background:#f8f9fa;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,.1);margin-top:5px;margin-bottom:8px;padding:6px 8px;
  transition:all .3s ease;animation:fadeIn .3s ease;
}
.filters-panel-header{
  display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #eaeaea;
}
.filters-panel-header h4{margin:0;font-size:12px;font-weight:600;color:#333;}
.clear-all-btn{font-size:10px;color:#F56C6C;padding:0;height:auto;}
.clear-all-btn:hover{opacity:.8;}

/* =========================== ETAPA 5A: PRESETS =========================== */
.presets-section{
  background:#fff;border-radius:6px;padding:8px;margin-bottom:8px;
  border:1px solid #e4e7ed;
}

.presets-header{
  display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;
}

.presets-title{
  font-size:11px;font-weight:600;color:#606266;text-transform:uppercase;letter-spacing:0.5px;
}

.save-preset-btn{
  font-size:11px;color:#409EFF;padding:0;height:auto;
}
.save-preset-btn:hover{opacity:.8;}

.presets-row{
  display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px;
}

.preset-btn{
  display:inline-flex;align-items:center;gap:4px;padding:5px 10px;
  border-radius:12px;font-size:11px;cursor:pointer;transition:all .2s ease;
  border:1px solid #e4e7ed;background:#f9fafb;
}

.preset-btn:hover{
  border-color:#409EFF;background:#ecf5ff;color:#409EFF;transform:translateY(-1px);
  box-shadow:0 2px 4px rgba(64,158,255,.15);
}

.preset-btn.default{
  color:#606266;
}

.preset-btn.default i{
  font-size:10px;
}

.preset-btn.saved{
  background:#fff;color:#409EFF;border-color:#409EFF;
}

.saved-presets{
  margin-top:8px;padding-top:8px;border-top:1px solid #e4e7ed;
}

.saved-presets-label{
  font-size:10px;color:#909399;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;
}

.preset-item{
  display:flex;align-items:center;gap:4px;margin-bottom:4px;
}

.preset-item .preset-btn{
  flex:1;
}

.preset-remove{
  background:none;border:none;padding:4px 6px;cursor:pointer;
  color:#F56C6C;transition:all .2s ease;border-radius:4px;
}

.preset-remove:hover{
  background:#fee;transform:scale(1.1);
}

.preset-remove i{
  font-size:10px;
}

/* =========================== ETAPA 3B: CHIPS DE FILTROS ATIVOS =========================== */
.active-filters-chips{
  display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0;padding:8px 12px;
  background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb;
}

.filter-chip{
  display:inline-flex;align-items:center;gap:6px;padding:4px 8px;background:#fff;
  border:1px solid #d1d5db;border-radius:12px;font-size:11px;color:#374151;
  transition:all .2s ease;box-shadow:0 1px 2px rgba(0,0,0,.05);
}

.filter-chip:hover{
  border-color:#409EFF;box-shadow:0 2px 4px rgba(64,158,255,.15);
}

.chip-label{font-weight:500;}

.chip-remove{
  background:none;border:none;padding:0;width:14px;height:14px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;cursor:pointer;
  color:#9ca3af;transition:all .2s ease;font-size:9px;
}

.chip-remove:hover{
  background:#fee;color:#ef4444;transform:scale(1.1);
}

.result-summary{
  font-size:11px;color:#6b7280;font-style:italic;margin-left:auto;font-weight:500;
}

.filters-row{display:flex;flex-direction:row;align-items:center;margin-bottom:6px;gap:6px;}
.primary-row{
  background:linear-gradient(to right,#e8f3ff,#ecf8ff);border-radius:5px;padding:5px 6px;border:1px solid #d8ebff;margin-bottom:5px;
  position:relative;box-shadow:inset 0 1px 3px rgba(0,0,0,.03);
}

.category-label{
  font-size:10px;font-weight:600;color:#409EFF;margin-right:8px;display:flex;align-items:center;min-width:45px;
}

.filters-group{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;}

.filter-icon{
  border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s ease;border:1px solid transparent;
  background:#f5f5f5;margin:0;position:relative;box-shadow:0 1px 2px rgba(0,0,0,.05);
}
.filter-icon:hover{transform:scale(1.1);box-shadow:0 2px 4px rgba(0,0,0,.15);}
.filter-icon.large{width:24px;height:24px;font-size:11px;}
.filter-icon.medium{width:20px;height:20px;font-size:9px;}
.filter-icon.small{width:16px;height:16px;font-size:8px;}
.filter-icon.active{border-color:currentColor;background:rgba(255,255,255,.9);}

.filter-icon.sit-all{color:#606266;}
.filter-icon.sit-ativo{color:#16a34a;}
.filter-icon.sit-estoque{color:#64748b;}
.filter-icon.sit-desativado{color:#ef4444;}

/* =========================== ANIMAÇÕES =========================== */
@keyframes pulseBadge{0%{transform:scale(1)}50%{transform:scale(1.1)}100%{transform:scale(1)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}

/* =========================== TABELA BASELINE =========================== */
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
  border-right: var(--el-border-color-light) 1px dotted;
  width: 60%;
}

.icons{
  display: flex;
  justify-content: center;
  flex-direction: row-reverse;
  flex: 1;
  align-items: center;
  font-size: 11px;
}

.icons div{
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  border-right: var(--el-border-color-light) 1px dotted;
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
  color: var(--el-text-color-primary);
}

.subtitle i{
  font-size: 12px;
  margin-right: 3px;
}

.isDisabled{
  opacity: 0.4;
}

/* =========================== RESPONSIVIDADE =========================== */
@media (max-width:420px){
  .search-row{gap:6px;flex-wrap:nowrap !important;}
  .search-input{font-size:14px;flex:1 1 auto;min-width:0;}
  .search-input :deep(.el-input__wrapper){height:30px;padding-left:20px;padding-right:8px;}
  .search-input :deep(.el-input__prefix){padding-left:2px;}
  .actions-group{gap:6px;flex-shrink:0;margin-left:auto;}
  .search-row .el-button{width:30px;height:30px;min-width:30px;}
}

/* =========================== MODO COMPACTO (ETAPA 2B) =========================== */
.is-compact .device {
  min-height: 26px !important;
}

.is-compact .device .name,
.is-compact .deviceHead .name {
  font-size: 11px !important;
  padding: 4px !important;
  line-height: 12px !important;
}

.is-compact .icons div i {
  font-size: 12px !important;
}

.is-compact .fakeScroll {
  /* altura da linha compacta: 26px */
}
</style>