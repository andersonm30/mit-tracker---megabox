<template>
  <div class="header-container">
    <div class="search-section">
      <el-input 
        v-model="query" 
        :placeholder="KT('device.search')" 
        class="search-input"
      >
        <template #prefix>
          <el-button
            type="text"
            @click="toggleFiltersPanel"
            @mouseleave="hideTip"
            @mouseenter.stop="showTip($event, 'Filtros')"
            class="filter-toggle-button"
            :class="{ 'active': showFiltersPanel || hasActiveFilters }"
          >
            <i class="fas fa-filter"></i>
            <span class="filter-badge" v-if="activeFiltersCount > 0">{{ activeFiltersCount }}</span>
          </el-button>
        </template>
      </el-input>
      
      <div class="actions-group">
        <el-button
          type="primary"
          @click="showModal"
          @mouseleave="hideTip"
          @mouseenter.stop="showTip($event, 'Informes')"
          class="action-button reports-button-top"
        >
          <i class="fas fa-file-alt"></i>
        </el-button>

        <el-button
          v-if="store.getters.advancedPermissions(49)"
          @mouseleave="hideTip"
          @mouseenter.stop="showTip($event, KT('group.add'))"
          type="primary"
          @click="editGroupRef.newGroup()"
          plain
          class="action-button"
        >
          <i class="fas fa-folder-plus"></i>
        </el-button>

        <el-button
          @mouseleave="hideTip"
          @mouseenter.stop="showTip($event, 'Importar Dispositivos')"
          v-if="store.getters.advancedPermissions(13)"
          :disabled="!store.getters['checkDeviceLimit']"
          type="success"
          @click="store.getters['checkDeviceLimit'] ? openImportModal() : deviceLimitExceded()"
          class="action-button"
        >
          <i class="fas fa-upload"></i>
        </el-button>

        <el-button
          @mouseleave="hideTip"
          @mouseenter.stop="showTip($event, 'Descargar Plantilla Excel')"
          v-if="store.getters.advancedPermissions(13)"
          type="info"
          @click="downloadTemplate"
          class="action-button"
        >
          <i class="fas fa-download"></i>
        </el-button>

        <el-button
          @mouseleave="hideTip"
          @mouseenter.stop="showTip($event, KT('device.add'))"
          :disabled="!store.getters['checkDeviceLimit']"
          v-if="store.getters.advancedPermissions(13) && (store.state.auth.deviceLimit === -1 || store.state.auth.deviceLimit > 0)"
          type="primary"
          @click="(store.getters['checkDeviceLimit']) ? editDeviceRef.newDevice() : deviceLimitExceded()"
          class="action-button"
        >
          <i class="fas fa-plus"></i>
        </el-button>
      </div>
    </div>

    <div class="modal-container" v-if="isShowModal">
      <div class="modal">
        <div class="modal-header">
          <div class="flex items-center text-lg">Informes Sobre Dispositivos</div>
          <button aria-label="close" @click="closeModal" class="close-button">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path clip-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" fill-rule="evenodd"></path>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div style="display: flex; flex-direction: column; gap: 10px; align-items: flex-start;">
            <el-button class="custom-button" size="small" @click="generatePDF">Dispositivos Activos (PDF)</el-button>
            <el-button class="custom-button" size="small" @click="generateOfflinePDF">Dispositivos OFFline (PDF)</el-button>
            <el-button class="custom-button" size="small" @click="filterLastHour">Última Hora</el-button>
            <el-button class="custom-button" size="small" @click="generateExcel">Dispositivos Activos (Excel)</el-button>
            <el-button class="custom-button" size="small" @click="generateOfflineExcel">Dispositivos OFFline (Excel)</el-button>
            <el-button class="custom-button" size="small" @click="generateJSON">Dispositivos Activos (JSON)</el-button>
            <el-button class="custom-button" size="small" @click="generateOfflineJSON">Dispositivos OFFline (JSON)</el-button>
          </div>
        </div>
        <div class="modal-footer">
          <div class="flex justify-end w-full">
            <button class="decline-button" @click="closeModal">Salir</button>
          </div>
        </div>
      </div>
    </div>
  </div>


  
  <div class="device-container">
    <div class="deviceHead">
      <!-- Botones de ordenación ocultos hasta nuevo aviso -->
      <div class="sorting-buttons-container" style="display: none;">
        <div @click="store.dispatch('devices/setSorting', 'name')" class="sorting-button">
          {{ KT('device.name') }}
          <span v-if="store.getters['devices/sorting'] === 'name-asc'">
            <i class="fas fa-sort-alpha-down"></i>
          </span>
          <span v-else-if="store.getters['devices/sorting'] === 'name-desc'">
            <i class="fas fa-sort-alpha-up"></i>
          </span>
          <span v-else>
            <i style="color: silver;" class="fas fa-sort-alpha-down"></i>
          </span>
        </div>
        
        <div @click="store.dispatch('devices/setSorting', 'status')" class="sorting-button">
          {{ KT('device.status') }}
          <span v-if="store.getters['devices/sorting'] === 'status-asc'">
            <i class="fas fa-sort-alpha-down"></i>
          </span>
          <span v-else-if="store.getters['devices/sorting'] === 'status-desc'">
            <i class="fas fa-sort-alpha-up"></i>
          </span>
          <span v-else>
            <i style="color: silver;" class="fas fa-sort-alpha-down"></i>
          </span>
        </div>
        
        <div @click="store.dispatch('devices/setSorting', 'lastUpdate')" class="sorting-button">
          {{ KT('device.updated') }}
          <span v-if="store.getters['devices/sorting'] === 'lastUpdate-asc'">
            <i class="fas fa-sort-alpha-down"></i>
          </span>
          <span v-else-if="store.getters['devices/sorting'] === 'lastUpdate-desc'">
            <i class="fas fa-sort-alpha-up"></i>
          </span>
          <span v-else>
            <i style="color: silver;" class="fas fa-sort-alpha-down"></i>
          </span>
        </div>
        
        <div @click="setSortingByState()" class="sorting-button">
          {{ KT('sorting.' + store.getters['devices/sorting']) }}
          <span><i class="fas fa-sort"></i></span>
        </div>
      </div>
      
      <!-- Filtro de estado del dispositivo (oculto) -->
      <div class="filter-section" style="margin-top: 10px; display: none; gap: 10px; padding: 5px;">
        <el-select v-model="stateFilter" @change="setStateFilter" placeholder="Estado" size="small" style="flex: 1;">
          <el-option :label="KT('device.state_all')" value="all"></el-option>
          <el-option :label="KT('device.state_installed')" value="installed"></el-option>
          <el-option :label="KT('device.state_in_service')" value="in_service"></el-option>
          <el-option :label="KT('device.state_in_stock')" value="in_stock"></el-option>
          <el-option :label="KT('device.state_with_failures')" value="with_failures"></el-option>
          <el-option :label="KT('device.state_company')" value="company"></el-option>
          <el-option :label="KT('device.state_withdrawn')" value="withdrawn"></el-option>
        </el-select>
      </div>
      
      <!-- Panel de filtros compacto con dos líneas -->
      <div class="filters-panel" v-if="showFiltersPanel">
        <!-- Barra superior con título y botón de limpiar -->
        <div class="filters-panel-header">
          <h4>Filtros</h4>
          <el-button type="text" @click="clearAllFilters" class="clear-all-btn">
            <i class="fas fa-trash-alt"></i> Limpiar
          </el-button>
        </div>

        <!-- Primera línea: Categoría 1 con fondo estético - solo visible para administradores -->
        <div class="filters-row primary-row" v-if="store.state.auth.administrator">
          <div class="category-label">
            <span>Estado</span>
          </div>
          <div class="filters-group state-filters">
            <div class="filter-icon all large"
                 :class="{ active: stateFilter === 'all' }"
                 @click="stateFilter = 'all'; setStateFilter('all')"
                 @mouseenter.stop="showTip($event, KT('device.state_all'))" 
                 @mouseleave="hideTip">
              <i class="fas fa-globe"></i>
            </div>
            <div class="filter-icon installed large" 
                 :class="{ active: stateFilter === 'installed' }"
                 @click="stateFilter = 'installed'; setStateFilter('installed')" 
                 @mouseenter.stop="showTip($event, KT('device.state_installed'))" 
                 @mouseleave="hideTip">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="filter-icon in-service large"
                 :style="stateFilter === 'in_service' ? 'background-color: rgba(64, 158, 255, 0.3); border: 1px solid #409EFF; box-shadow: 0 0 8px rgba(64, 158, 255, 0.6); transform: scale(1.1);' : ''"
                 :class="{ active: stateFilter === 'in_service' }"
                 @click="stateFilter = 'in_service'; setStateFilter('in_service')"
                 @mouseenter.stop="showTip($event, KT('device.state_in_service'))" 
                 @mouseleave="hideTip">
              <i class="fas fa-tools" :style="stateFilter === 'in_service' ? 'color: #409EFF;' : ''"></i>
            </div>
            <div class="filter-icon with-failures large"
                 :style="stateFilter === 'with_failures' ? 'background-color: rgba(64, 158, 255, 0.3); border: 1px solid #409EFF; box-shadow: 0 0 8px rgba(64, 158, 255, 0.6); transform: scale(1.1);' : ''"
                 :class="{ active: stateFilter === 'with_failures' }"
                 @click="stateFilter = 'with_failures'; setStateFilter('with_failures')"
                 @mouseenter.stop="showTip($event, KT('device.state_with_failures'))" 
                 @mouseleave="hideTip">
              <i class="fas fa-exclamation-triangle" :style="stateFilter === 'with_failures' ? 'color: #f56c6c;' : ''"></i>
            </div>
            <div class="filter-icon in-stock large"
                 :style="stateFilter === 'in_stock' ? 'background-color: rgba(64, 158, 255, 0.3); border: 1px solid #409EFF; box-shadow: 0 0 8px rgba(64, 158, 255, 0.6); transform: scale(1.1);' : ''"
                 :class="{ active: stateFilter === 'in_stock' }"
                 @click="stateFilter = 'in_stock'; setStateFilter('in_stock')"
                 @mouseenter.stop="showTip($event, KT('device.state_in_stock'))" 
                 @mouseleave="hideTip">
              <i class="fas fa-box" :style="stateFilter === 'in_stock' ? 'color: #909399;' : ''"></i>
            </div>
            <div class="filter-icon withdrawn large"
                 :class="{ active: stateFilter === 'withdrawn' }"
                 @click="stateFilter = 'withdrawn'; setStateFilter('withdrawn')"
                 @mouseenter.stop="showTip($event, KT('device.state_withdrawn'))" 
                 @mouseleave="hideTip">
              <i class="fas fa-archive"></i>
            </div>
            <div class="filter-icon company large"
                 :class="{ active: stateFilter === 'company' }"
                 @click="stateFilter = 'company'; setStateFilter('company')"
                 @mouseenter.stop="showTip($event, KT('device.state_company'))" 
                 @mouseleave="hideTip">
              <i class="fas fa-building"></i>
            </div>
          </div>
        </div>
        
        <!-- Segunda línea: 3 categorías restantes en una fila -->
        <div class="filters-row secondary-row">
          <!-- Sección Conectividad -->
          <div class="section-wrapper">
            <div class="category-label small">
              <span>Conectividad</span>
            </div>
            <div class="filters-group connectivity-filters">
              <div class="filter-icon online medium"
                   :class="{ active: store.state.devices.applyFilters.combinedStatusFilter === 'online' }"
                   @click="handleStatusFilter('online')"
                   @mouseenter.stop="showTip($event, KT('device.status_online'))" 
                   @mouseleave="hideTip">
                <i class="fas fa-wifi"></i>
              </div>
              <div class="filter-icon offline medium"
                   :class="{ active: store.state.devices.applyFilters.combinedStatusFilter === 'offline' }"
                   @click="handleStatusFilter('offline')"
                   @mouseenter.stop="showTip($event, KT('device.status_offline'))" 
                   @mouseleave="hideTip">
                <i class="fas fa-power-off"></i>
              </div>
              <div class="filter-icon unknown medium"
                   :class="{ active: store.state.devices.applyFilters.combinedStatusFilter === 'unknown' || store.state.devices.applyFilters.combinedStatusFilter === 'undefined' }"
                   @click="handleStatusFilter('unknown')"
                   @mouseenter.stop="showTip($event, KT('device.status_unknown'))" 
                   @mouseleave="hideTip">
                <i class="fas fa-question-circle"></i>
              </div>
              <div class="filter-icon motion medium"
                   :class="{ active: store.state.devices.applyFilters.combinedStatusFilter === 'moving' }"
                   @click="handleStatusFilter('moving')"
                   @mouseenter.stop="showTip($event, KT('device.in_motion'))" 
                   @mouseleave="hideTip">
                <i class="fas fa-running"></i>
              </div>
              <div class="filter-icon stopped medium"
                   :class="{ active: store.state.devices.applyFilters.combinedStatusFilter === 'stopped' }"
                   @click="handleStatusFilter('stopped')"
                   @mouseenter.stop="showTip($event, KT('device.status_stopped'))" 
                   @mouseleave="hideTip">
                <i class="fas fa-hand-paper"></i>
              </div>
            </div>
          </div>
          
          <!-- Sección Avanzados -->
          <div class="section-wrapper">
            <div class="category-label small">
              <span>Avanzados</span>
            </div>
            <div class="filters-group advanced-filters">
              <div class="filter-icon anchor small"
                   :class="{ active: isFilterActive('anchor', true) }"
                   @click="toggleAdvancedFilter('anchor', true)"
                   @mouseenter.stop="showTip($event, 'Cerca')" 
                   @mouseleave="hideTip">
                <i class="fas fa-anchor"></i>
              </div>
              <div class="filter-icon driver small"
                   :class="{ active: isFilterActive('driver', true) }"
                   @click="toggleAdvancedFilter('driver', true)"
                   @mouseenter.stop="showTip($event, 'Conductor')" 
                   @mouseleave="hideTip">
                <i class="fas fa-id-card"></i>
              </div>
              <div class="filter-icon ignition-on small"
                   :class="{ active: isFilterActive('ignition', true) }"
                   @click="toggleAdvancedFilter('ignition', true, 'exclusive')"
                   @mouseenter.stop="showTip($event, 'Ignición On')" 
                   @mouseleave="hideTip">
                <i class="fas fa-key" style="color: #4CAF50;"></i>
              </div>
              <div class="filter-icon ignition-off small"
                   :class="{ active: isFilterActive('ignition', false) }"
                   @click="toggleAdvancedFilter('ignition', false, 'exclusive')"
                   @mouseenter.stop="showTip($event, 'Ignición Off')" 
                   @mouseleave="hideTip">
                <i class="fas fa-key" style="color: #F56C6C;"></i>
              </div>
              <div class="filter-icon locked small"
                   :class="{ active: isFilterActive('locked', true) }"
                   @click="toggleAdvancedFilter('locked', true, 'exclusive')"
                   @mouseenter.stop="showTip($event, 'Bloqueado')" 
                   @mouseleave="hideTip">
                <i class="fas fa-lock" style="color: #F56C6C;"></i>
              </div>
              <div class="filter-icon unlocked small"
                   :class="{ active: isFilterActive('locked', false) }"
                   @click="toggleAdvancedFilter('locked', false, 'exclusive')"
                   @mouseenter.stop="showTip($event, 'Desbloqueado')" 
                   @mouseleave="hideTip">
                <i class="fas fa-unlock" style="color: #67c23a;"></i>
              </div>
            </div>
          </div>
          
          <!-- Sección GPS -->
          <div class="section-wrapper">
            <div class="category-label small">
              <span>GPS</span>
              <!-- Botón para activar/desactivar filtros GPS -->
              <el-button 
                type="text" 
                size="small" 
                @click="toggleGpsFilters" 
                style="margin-left: 5px; padding: 2px;"
                :class="{ 'active-toggle': showGpsFilters }">
                <i :class="showGpsFilters ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
              </el-button>
              <!-- Indicador de filtros GPS activos -->
              <span v-if="hasAnyGpsFilter" style="color: #409EFF; font-size: 11px; margin-left: 5px;">
                <i class="fas fa-filter"></i>
              </span>
            </div>
            <div class="filters-group gps-filters" v-show="showGpsFilters">
              <!-- GPS Brand Filter dropdown -->
              <el-dropdown @command="handleGpsBrandFilter" trigger="click" size="small" :hide-on-click="false">
                <div class="filter-icon small gps-brand"
                     :style="isFilterActive('gps_brand') ? 'background-color: rgba(64, 158, 255, 0.2); border: 1px solid #409EFF; box-shadow: 0 0 8px rgba(64, 158, 255, 0.5); transform: scale(1.1);' : ''"
                     :class="{ active: isFilterActive('gps_brand') }"
                     @mouseenter.stop="showTip($event, 'Marca')" 
                     @mouseleave="hideTip">
                  <i class="fas fa-satellite-dish" :style="isFilterActive('gps_brand') ? 'color: #409EFF;' : ''"></i>
                </div>
                <template #dropdown>
                  <div style="max-height: 300px; overflow-y: auto;">
                    <el-dropdown-menu class="gps-brand-menu">
                      <el-dropdown-item v-for="brand in commonGpsBrands" :key="brand" :command="brand"
                                        :class="{ 'is-active': isFilterActive('gps_brand', brand) }">
                        {{ brand }}
                      </el-dropdown-item>
                      <el-dropdown-item command="" style="color: #F56C6C; font-weight: bold;">Desactivar</el-dropdown-item>
                    </el-dropdown-menu>
                  </div>
                </template>
              </el-dropdown>
              
              <!-- GPS Model Filter dropdown -->
              <el-dropdown @command="handleGpsModelFilter" trigger="click" size="small" :hide-on-click="false">
                <div class="filter-icon small gps-model"
                     :style="isFilterActive('gps_model') ? 'background-color: rgba(64, 158, 255, 0.2); border: 1px solid #409EFF; box-shadow: 0 0 8px rgba(64, 158, 255, 0.5); transform: scale(1.1);' : ''"
                     :class="{ active: isFilterActive('gps_model') }"
                     @mouseenter.stop="showTip($event, 'Modelo')" 
                     @mouseleave="hideTip">
                  <i class="fas fa-microchip" :style="isFilterActive('gps_model') ? 'color: #409EFF;' : ''"></i>
                </div>
                <template #dropdown>
                  <div style="max-height: 300px; overflow-y: auto;">
                    <el-dropdown-menu class="gps-model-menu">
                      <el-dropdown-item v-for="model in commonGpsModels" :key="model" :command="model"
                                        :class="{ 'is-active': isFilterActive('gps_model', model) }">
                        {{ model }}
                      </el-dropdown-item>
                      <el-dropdown-item command="" style="color: #F56C6C; font-weight: bold;">Desactivar</el-dropdown-item>
                    </el-dropdown-menu>
                  </div>
                </template>
              </el-dropdown>
              
              <!-- Technology Filter dropdown -->
              <el-dropdown @command="handleTechnologyFilter" trigger="click" size="small" :hide-on-click="false">
                <div class="filter-icon small technology"
                     :style="isFilterActive('technology') ? 'background-color: rgba(64, 158, 255, 0.2); border: 1px solid #409EFF; box-shadow: 0 0 8px rgba(64, 158, 255, 0.5); transform: scale(1.1);' : ''"
                     :class="{ active: isFilterActive('technology') }"
                     @mouseenter.stop="showTip($event, 'Tecnología')" 
                     @mouseleave="hideTip">
                  <i class="fas fa-broadcast-tower" :style="isFilterActive('technology') ? 'color: #409EFF;' : ''"></i>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="2G" :class="{ 'is-active': isFilterActive('technology', '2G') }">2G</el-dropdown-item>
                    <el-dropdown-item command="3G" :class="{ 'is-active': isFilterActive('technology', '3G') }">3G</el-dropdown-item>
                    <el-dropdown-item command="2-4G" :class="{ 'is-active': isFilterActive('technology', '2-4G') }">2/4G</el-dropdown-item>
                    <el-dropdown-item command="4G" :class="{ 'is-active': isFilterActive('technology', '4G') }">4G</el-dropdown-item>
                    <el-dropdown-item command="5G" :class="{ 'is-active': isFilterActive('technology', '5G') }">5G</el-dropdown-item>
                    <el-dropdown-item command="LBS" :class="{ 'is-active': isFilterActive('technology', 'LBS') }">LBS</el-dropdown-item>
                    <el-dropdown-item command="WiFi" :class="{ 'is-active': isFilterActive('technology', 'WiFi') }">WiFi</el-dropdown-item>
                    <el-dropdown-item command="" style="color: #F56C6C; font-weight: bold;">Desactivar</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div ref="realDevices" @scroll="realScroll($event)" class="devices-scroll-container">
      <!-- Contador de dispositivos total -->
      <div class="devices-count">{{ filteredDevices.length }} dispositivos</div>
      
      <!-- Contador de filtros con indicador de cantidad al estilo de grupos -->
      <div v-if="query && query.length > 0" class="filter-counter">
        {{ KT('device.filtered') }}&nbsp;<span class="filter-bubble">{{ filteredDevices.length }}</span>
      </div>
      
      <!-- Vamos voltar ao layout original, mas mantendo algumas melhorias de reatividade -->
      <div class="device-list">
        <div v-for="(group) in groupedDevices" :key="group.id" class="device-group">
          <div v-if="group.id !== -1" @click="store.dispatch('setGroupPref', group.id)" class="group-header">
            <span v-if="store.getters.groupPref(group.id)">
              <i class="fas fa-angle-up"></i>
            </span>
            <span v-else>
              <i class="fas fa-angle-down"></i>
            </span>
            &nbsp;&nbsp;&nbsp;{{ group.name }}
            <!-- Contador de dispositivos en el grupo -->
            <span class="group-count">{{ group.devices.length }}</span>
          </div>
  
          <div v-if="group.id == -1 || store.getters.groupPref(group.id)" class="group-devices">
            <DeviceItem 
              v-for="(device) in group.devices" 
              :key="device.id" 
              class="device oblea" 
              :device="device"
              @click="handleDeviceClick(device)" 
              @contextmenu.prevent="markerContext($event, device.id)" 
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de importación -->
  <el-dialog
    v-model="showImportModal"
    width="85%"
    :before-close="handleClose"
    :show-close="false"
    custom-class="import-modal"
  >
    <template #header>
      <div class="import-modal-header">
        <h3 class="import-modal-title">
          <i class="fas fa-upload"></i>
          Importar Dispositivos
        </h3>
        <el-button 
          @click="handleClose" 
          type="text" 
          class="import-modal-close"
          size="large"
        >
          <i class="fas fa-times"></i>
        </el-button>
      </div>
    </template>
    
    <div class="import-content">
      <!-- Indicador de pasos -->
      <div class="steps-indicator">
        <div class="step-item" :class="{ active: importStep >= 1, completed: importStep > 1 }">
          <div class="step-number">1</div>
          <div class="step-title">Seleccionar Arquivo</div>
        </div>
        <div class="step-line" :class="{ completed: importStep > 1 }"></div>
        <div class="step-item" :class="{ active: importStep >= 2, completed: importStep > 2 }">
          <div class="step-number">2</div>
          <div class="step-title">Visualizar e Validar</div>
        </div>
        <div class="step-line" :class="{ completed: importStep > 2 }"></div>
        <div class="step-item" :class="{ active: importStep >= 3, completed: importStep > 3 }">
          <div class="step-number">3</div>
          <div class="step-title">Importando</div>
        </div>
        <div class="step-line" :class="{ completed: importStep > 3 }"></div>
        <div class="step-item" :class="{ active: importStep >= 4, completed: importStep > 4 }">
          <div class="step-number">4</div>
          <div class="step-title">Resultado</div>
        </div>
      </div>
      
      <!-- Paso 1: Seleccionar archivo -->
      <div v-if="importStep === 1">
        <h3>Seleccionar archivo Excel</h3>
        <div class="file-upload-area" 
             @drop="handleDrop" 
             @dragover.prevent 
             @dragenter.prevent
             @click="$refs.fileInput.click()">
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Arrastra y suelta tu archivo Excel aquí o haz clic para seleccionar</p>
          <p class="file-info">Formatos soportados: .xlsx, .xls</p>
        </div>
        <input ref="fileInput" type="file" accept=".xlsx,.xls" @change="handleFileSelect" style="display: none;">
        
        <div class="template-section">
          <hr style="margin: 30px 0;">
          <p style="text-align: center; margin-bottom: 15px;">Não tem arquivo? Baixe nossa modelo</p>
          <div style="text-align: center;">
            <el-button @click="downloadTemplate" type="success" plain>
              <i class="fas fa-download"></i> Baixar Modelo Excel
            </el-button>
          </div>
        </div>
      </div>

      <!-- Paso 2: Vista previa y mapeo -->
      <div v-if="importStep === 2">
        <h3>Vista previa del archivo</h3>
        <p><strong>Archivo:</strong> {{ fileName }}</p>
        <p><strong>Total de filas:</strong> {{ previewData.length }}</p>
        
        <div class="mapping-info">
          <h4>Mapeo de columnas:</h4>
          <ul>
            <li><strong>uniqueId:</strong> uniqueId, UniqueId, UNIQUEID, imei, IMEI, Imei, serial, Serial, SERIAL</li>
            <li><strong>name:</strong> name, Name, NAME, nome</li>
            <li><strong>groupId:</strong> groupId, GroupId, GROUPID (opcional, por defecto 0)</li>
            <li><strong>contact:</strong> contact, contato (opcional)</li>
            <li><strong>Atributos:</strong> device.*, tarkan.*, iccid, phone, broker, operator, APN, model, brand, color, placa, chassis, vin</li>
          </ul>
        </div>
        
        <div class="preview-table-container">
          <table class="preview-table">
            <thead>
              <tr>
                <th v-for="(header, index) in headers" :key="index">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in previewData.slice(0, 5)" :key="index">
                <td v-for="(header, headerIndex) in headers" :key="headerIndex">
                  {{ row[header] || '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <p v-if="previewData.length > 5" class="preview-note">
          Mostrando las primeras 5 filas de {{ previewData.length }} total
        </p>
      </div>

      <!-- Paso 3: Progreso de importación -->
      <div v-if="importStep === 3">
        <h3>Importando dispositivos...</h3>
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <p>{{ processedCount }} de {{ totalToProcess }} dispositivos procesados ({{ progressPercentage }}%)</p>
        </div>
        
        <div class="import-stats">
          <div class="stat-item success">
            <span class="stat-label">Exitosos:</span>
            <span class="stat-value">{{ successCount }}</span>
          </div>
          <div class="stat-item error">
            <span class="stat-label">Errores:</span>
            <span class="stat-value">{{ errorCount }}</span>
          </div>
        </div>
        
        <!-- Log de errores -->
        <div v-if="errorLog.length > 0" class="error-log">
          <h4>Detalles de la importación:</h4>
          <div class="log-container">
            <div v-for="(log, index) in errorLog" :key="index" 
                 :class="['log-item', log.type]">
              <div class="log-header">
                <span class="log-row">Fila {{ log.row }}:</span>
                <span class="log-device">{{ log.uniqueId }} - {{ log.name }}</span>
                <span :class="['log-status', log.type]">
                  <i :class="log.type === 'success' ? 'fas fa-check' : 'fas fa-times'"></i>
                  {{ log.type === 'success' ? 'OK' : 'ERROR' }}
                </span>
              </div>
              <div class="log-message">{{ log.message }}</div>
              <div v-if="log.details && Object.keys(log.details).length > 0" class="log-details">
                <strong>Detalles técnicos:</strong>
                <pre>{{ JSON.stringify(log.details, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Paso 4: Resultado final -->
      <div v-if="importStep === 4">
        <div class="result-summary">
          <div class="result-icon">
            <i :class="successCount > 0 ? 'fas fa-check-circle success' : 'fas fa-times-circle error'"></i>
          </div>
          <h2>{{ getResultTitle() }}</h2>
          <p>{{ getResultSubtitle() }}</p>

          <div class="final-stats">
            <div class="stat-box">
              <span class="stat-label">Total Processados</span>
              <span class="stat-value">{{ processedCount }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Sucessos</span>
              <span class="stat-value success">{{ successCount }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Erros</span>
              <span class="stat-value error">{{ errorCount }}</span>
            </div>
          </div>
        </div>

        <div v-if="errorLog.length > 0" class="error-details">
          <h4>Detalhes dos Erros</h4>
          <table class="error-table">
            <thead>
              <tr>
                <th>Linha</th>
                <th>Dispositivo</th>
                <th>Erro</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="error in errorLog.filter(log => log.type === 'error')" :key="error.row">
                <td>{{ error.row }}</td>
                <td>{{ error.uniqueId }} - {{ error.name }}</td>
                <td>{{ error.message }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button v-if="importStep === 1" @click="showImportModal = false">Cancelar</el-button>
      <el-button v-if="importStep === 2" @click="importStep = 1">Atrás</el-button>
      <el-button v-if="importStep === 2" type="primary" @click="startImport" :disabled="!previewData.length">
        Importar {{ previewData.length }} dispositivos
      </el-button>
      <el-button v-if="importStep === 4" @click="closeImport" type="primary">Fechar</el-button>
    </template>
  </el-dialog>

</template>
  

<script setup>
  
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/dialog/style/css'
//import { Eleme } from '@element-plus/icons-vue'
import {ElButton, ElInput, ElMessage, ElDialog, ElMessageBox, ElNotification} from "element-plus";

import {ref,computed,inject,onMounted,onUnmounted,watch} from 'vue';
import {useStore} from "vuex"
import {useRoute} from 'vue-router';
//import {useRouter} from 'vue-router';

import KT from '../tarkan/func/kt.js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
// import DeviceImportModal from '../tarkan/components/SimpleDeviceImport.vue';
const store = useStore();
const route = useRoute();
//const router = useRouter();
const map = ref(null); 
import L from 'leaflet';

// Función auxiliar para aplicar filtros avanzados
function applyAdvancedFilter(device, position, filter, currentVisibility) {
  if (!filter || filter.type === 'none') return currentVisibility;
  
  // Logging detallado para depuración (solo para dispositivo 1 y 2 para evitar spam)
  const shouldLog = device.id === 1 || device.id === 2;
  
  // Mostrar datos completos de un dispositivo para debuggear
  if (device.id === 1) {
    console.log('Mostrando atributos completos del dispositivo 1 para diagnóstico:');
    console.log('- Atributos del device:', device.attributes);
    console.log('- Posición:', position);
    if (position) console.log('- Atributos de posición:', position.attributes);
  }
  
  const result = (() => {
    switch(filter.type) {
      case 'anchor': {
        // Verificar si el dispositivo está anclado
        const isAnchored = store.getters['geofences/isAnchored'](device.id);
        const result = isAnchored ? currentVisibility : false;
        if (shouldLog) console.log(`Filtro anchor: ${isAnchored ? 'PASA' : 'NO PASA'}`);
        return result;
      }
      case 'driver': {
        // Verificar si el dispositivo tiene conductor asignado
        const hasDriver = position && position.attributes && position.attributes.driverUniqueId;
        const result = hasDriver ? currentVisibility : false;
        if (shouldLog) console.log(`Filtro driver: ${hasDriver ? 'PASA' : 'NO PASA'}`);
        return result;
      }
      case 'ignition': {
        // Verificar estado de ignición
        const ignitionMatches = position && position.attributes && position.attributes.ignition === filter.value;
        const result = ignitionMatches ? currentVisibility : false;
        if (shouldLog) console.log(`Filtro ignition=${filter.value}: ${ignitionMatches ? 'PASA' : 'NO PASA'}`);
        return result;
      }
      case 'locked': {
        // Verificar estado de bloqueo
        const lockMatches = position && position.attributes && position.attributes.blocked === filter.value;
        const result = lockMatches ? currentVisibility : false;
        if (shouldLog) console.log(`Filtro locked=${filter.value}: ${lockMatches ? 'PASA' : 'NO PASA'}`);
        return result;
      }
      case 'gps_brand': {
        // Filtrar por marca de GPS - comprobar exactamente "device.gpsBrand"
        const brandAttr = device.attributes && device.attributes['device.gpsBrand'];
        if (shouldLog) console.log(`Buscando device.gpsBrand en dispositivo ${device.id}: ${brandAttr || 'no encontrado'}`);
        
        const brandMatches = brandAttr && brandAttr === filter.value;
        const result = brandMatches ? currentVisibility : false;
        
        if (shouldLog) {
          console.log(`Filtro gps_brand=${filter.value}: ${brandMatches ? 'PASA' : 'NO PASA'}`);
          console.log(`- Valor esperado: ${filter.value}`);
          console.log(`- Valor actual: ${brandAttr || 'undefined'}`);
        }
        
        return result;
      }
      case 'gps_model': {
        // Filtrar por modelo de GPS - comprobar exactamente "device.model"
        const modelAttr = device.attributes && device.attributes['device.model'];
        if (shouldLog) console.log(`Buscando device.model en dispositivo ${device.id}: ${modelAttr || 'no encontrado'}`);
        
        const modelMatches = modelAttr && modelAttr === filter.value;
        const result = modelMatches ? currentVisibility : false;
        
        if (shouldLog) {
          console.log(`Filtro gps_model=${filter.value}: ${modelMatches ? 'PASA' : 'NO PASA'}`);
          console.log(`- Valor esperado: ${filter.value}`);
          console.log(`- Valor actual: ${modelAttr || 'undefined'}`);
        }
        
        return result;
      }
      case 'technology': {
        // Filtrar por tecnología - comprobar exactamente "device.technology"
        const techAttr = device.attributes && device.attributes['device.technology'];
        if (shouldLog) console.log(`Buscando device.technology en dispositivo ${device.id}: ${techAttr || 'no encontrado'}`);
        
        const techMatches = techAttr && techAttr === filter.value;
        const result = techMatches ? currentVisibility : false;
        
        if (shouldLog) {
          console.log(`Filtro technology=${filter.value}: ${techMatches ? 'PASA' : 'NO PASA'}`);
          console.log(`- Valor esperado: ${filter.value}`);
          console.log(`- Valor actual: ${techAttr || 'undefined'}`);
        }
        
        return result;
      }
      default:
        if (shouldLog) console.log(`Filtro desconocido ${filter.type}: IGNORADO`);
        return currentVisibility;
    }
  })();
  
  // Mostrar cambio de visibilidad para depuración del primer dispositivo
  if (shouldLog && currentVisibility !== result) {
    console.log(`Visibilidad CAMBIADA por filtro ${filter.type}: ${currentVisibility} -> ${result}`);
  }
  
  return result;
}

// Estado del dispositivo
const stateFilter = ref('all');
const showGpsFilters = ref(true); // Mostrar los filtros de GPS por defecto

// Variables para filtros de GPS
const gpsBrandFilter = ref('');
const gpsModelFilter = ref('');
const technologyFilter = ref('');

// Función para activar/desactivar los filtros de GPS
const toggleGpsFilters = () => {
  showGpsFilters.value = !showGpsFilters.value;
  if (!showGpsFilters.value) {
    clearAllGpsFilters(); // Si se desactivan los filtros, limpiarlos todos
  }
};

// Lista inicial de modelos GPS para el filtro
const commonGpsModels = ref([
  "TK102", "TK103", "GT06", "ST901", "FMB120", "FMB125", "GV55", "GV300"
]);

// Lista inicial de marcas GPS (será actualizada después)
const commonGpsBrands = ref([
  "Coban", "Concox", "Queclink", "Sinotrack", "Teltonika", "Meitrack", "Gosafe", "Suntech"
]);

// Función para verificar si un filtro está activo
const isFilterActive = (type, value) => {
  const isMainFilter = store.state.devices.applyFilters.advancedFilter.type === type && 
                     (store.state.devices.applyFilters.advancedFilter.value === value || 
                      value === undefined);
  
  if (isMainFilter) return true;
  
  // Verificar en los filtros combinados si value es undefined, verificar solo el tipo
  if (value === undefined) {
    return store.state.devices.applyFilters.combinedAdvancedFilters.some(
      filter => filter.type === type
    );
  }
  
  // Si value está definido, verificar tipo y valor exacto
  return store.state.devices.applyFilters.combinedAdvancedFilters.some(
    filter => filter.type === type && filter.value === value
  );
};

// Función para alternar filtros avanzados (ahora con soporte para combinación)
const toggleAdvancedFilter = (type, value, mode = 'normal') => {
  const isActive = isFilterActive(type, value);
  console.log(`Toggling filter ${type}=${value}, current state: ${isActive}`);
  
  if (isActive) {
    // Si ya está activo, desactivarlo completamente
    console.log("Desactivando filtro activo");
    
    // Quitar de los filtros combinados
    const newCombinedFilters = store.state.devices.applyFilters.combinedAdvancedFilters.filter(
      filter => !(filter.type === type && filter.value === value)
    );
    store.state.devices.applyFilters.combinedAdvancedFilters = newCombinedFilters;
    
    // Si este es el filtro principal actual, limpiarlo
    if (store.state.devices.applyFilters.advancedFilter.type === type && 
        store.state.devices.applyFilters.advancedFilter.value === value) {
      
      // Si hay otros filtros, usar el último como principal
      if (newCombinedFilters.length > 0) {
        store.dispatch('devices/setAdvancedFilter', newCombinedFilters[newCombinedFilters.length - 1]);
      } else {
        // Si no hay más filtros, desactivar completamente
        store.dispatch('devices/setAdvancedFilter', {type: 'none', value: null});
      }
    }
  } else {
    // Si no está activo, activarlo
    console.log("Activando nuevo filtro");
    
    // Si el modo es excluyente, eliminar cualquier otro filtro del mismo tipo
    if (mode === 'exclusive') {
      console.log("Modo exclusivo: eliminando filtros del mismo tipo");
      
      // Quitar de filtros combinados
      store.state.devices.applyFilters.combinedAdvancedFilters = 
        store.state.devices.applyFilters.combinedAdvancedFilters.filter(
          filter => filter.type !== type
        );
      
      // Si el filtro principal es del mismo tipo, actualizarlo
      if (store.state.devices.applyFilters.advancedFilter.type === type) {
        store.dispatch('devices/setAdvancedFilter', {type, value});
        return; // Ya se ha actualizado el filtro principal
      }
    }
    
    // Crear filtro
    const newFilter = {type, value};
    
    // Agregarlo a filtros combinados
    store.state.devices.applyFilters.combinedAdvancedFilters.push(newFilter);
    
    // Si no hay filtro principal activo, establecer este como principal
    if (store.state.devices.applyFilters.advancedFilter.type === 'none') {
      store.dispatch('devices/setAdvancedFilter', newFilter);
    }
  }
  
  // Forzar una actualización de dispositivos
  console.log("Actualizando lista de dispositivos con nuevos filtros");
  filteredDevices.value = recalcDevices();
  
  // Actualizar el estado visual de todos los filtros
  setTimeout(() => {
    updateFilterIcons();
  }, 50);
};

// Eliminada la función de manejo de cierre de dropdown para simplificar

// Manejadores para los filtros de GPS
const handleGpsBrandFilter = (brand) => {
  console.log("Filtro de marca GPS seleccionado:", brand);
  
  if (brand) {
    // Actualizar filtros y UI usando el sistema de filtros combinados
    toggleAdvancedFilter('gps_brand', brand, 'exclusive');
    
    // Actualizar los modelos disponibles si se seleccionó una marca
    const brandModels = getBrandModels(brand);
    if (brandModels && brandModels.length > 0) {
      // Mostrar todos los modelos disponibles para la marca seleccionada
      commonGpsModels.value = brandModels;
      
      // Limpiar cualquier filtro de modelo existente
      if (isFilterActive('gps_model')) {
        // Desactivar filtro de modelo si existe
        if (isFilterActive('gps_model', store.state.devices.applyFilters.advancedFilter.value)) {
          toggleAdvancedFilter('gps_model', store.state.devices.applyFilters.advancedFilter.value);
        }
        
        // Quitar cualquier modelo seleccionado de los filtros combinados
        const gpsModelFilter = store.state.devices.applyFilters.combinedAdvancedFilters.find(
          filter => filter.type === 'gps_model'
        );
        if (gpsModelFilter) {
          toggleAdvancedFilter('gps_model', gpsModelFilter.value);
        }
      }
    }
    
    // Asegurarse de que el dropdown muestre la marca seleccionada
    const allDropdownButtons = document.querySelectorAll('.gps-brand');
    allDropdownButtons.forEach(btn => {
      btn.classList.add('active');
    });
  } else {
    // Desactivar completamente el filtro
    if (isFilterActive('gps_brand', store.state.devices.applyFilters.advancedFilter.value)) {
      toggleAdvancedFilter('gps_brand', store.state.devices.applyFilters.advancedFilter.value);
    }
    
    // Quitar cualquier marca seleccionada de los filtros combinados
    const gpsBrandFilter = store.state.devices.applyFilters.combinedAdvancedFilters.find(
      filter => filter.type === 'gps_brand'
    );
    if (gpsBrandFilter) {
      toggleAdvancedFilter('gps_brand', gpsBrandFilter.value);
    }
    
    // Desactivar indicador visual
    const allDropdownButtons = document.querySelectorAll('.gps-brand');
    allDropdownButtons.forEach(btn => {
      btn.classList.remove('active');
    });
  }
  
  // Forzar actualización
  filteredDevices.value = recalcDevices();
};

const handleGpsModelFilter = (model) => {
  console.log("Filtro de modelo GPS seleccionado:", model);
  
  if (model) {
    // Activar el filtro con exclusividad (solo un modelo a la vez)
    toggleAdvancedFilter('gps_model', model, 'exclusive');
    
    // Activar indicador visual
    const allDropdownButtons = document.querySelectorAll('.gps-model');
    allDropdownButtons.forEach(btn => {
      btn.classList.add('active');
    });
  } else {
    // Desactivar el filtro actual si existe
    if (isFilterActive('gps_model', store.state.devices.applyFilters.advancedFilter.value)) {
      toggleAdvancedFilter('gps_model', store.state.devices.applyFilters.advancedFilter.value);
    }
    
    // Quitar cualquier modelo de los filtros combinados
    const gpsModelFilter = store.state.devices.applyFilters.combinedAdvancedFilters.find(
      filter => filter.type === 'gps_model'
    );
    if (gpsModelFilter) {
      toggleAdvancedFilter('gps_model', gpsModelFilter.value);
    }
    
    // Desactivar indicador visual
    const allDropdownButtons = document.querySelectorAll('.gps-model');
    allDropdownButtons.forEach(btn => {
      btn.classList.remove('active');
    });
  }
  
  // Forzar actualización
  filteredDevices.value = recalcDevices();
};

const handleTechnologyFilter = (tech) => {
  console.log("Filtro de tecnología seleccionado:", tech);
  
  if (tech) {
    // Activar filtro con exclusividad
    toggleAdvancedFilter('technology', tech, 'exclusive');
    
    // Activar indicador visual
    const allDropdownButtons = document.querySelectorAll('.technology');
    allDropdownButtons.forEach(btn => {
      btn.classList.add('active');
    });
  } else {
    // Desactivar el filtro actual si existe
    if (isFilterActive('technology', store.state.devices.applyFilters.advancedFilter.value)) {
      toggleAdvancedFilter('technology', store.state.devices.applyFilters.advancedFilter.value);
    }
    
    // Quitar cualquier tecnología de los filtros combinados
    const techFilter = store.state.devices.applyFilters.combinedAdvancedFilters.find(
      filter => filter.type === 'technology'
    );
    if (techFilter) {
      toggleAdvancedFilter('technology', techFilter.value);
    }
    
    // Desactivar indicador visual
    const allDropdownButtons = document.querySelectorAll('.technology');
    allDropdownButtons.forEach(btn => {
      btn.classList.remove('active');
    });
  }
};

// Función para obtener modelos de una marca
const getBrandModels = (brand) => {
  // Lista de modelos comunes por marca
  const modelMap = {
    "Coban": ["TK102", "TK103", "GPS303", "TK303", "TK303F", "TK303G", "TK305", "TK306", "TK307", "TK310", "TK315", "TK319", "GPS306", "GPS307"],
  
  "Concox": ["GT06", "GT06N", "GT06E", "GT08", "GT08E", "X1", "X3", "AT4", "AT6", "JM-VL01", "TR02", "TR06", "GV25", "GV55", "GV55 Lite", "GV75", "GV300", "GV300W", "GT02", "GT02A", "GT02D", "GT09", "GT300", "GT800", "GT820", "ET100", "ET200", "GS503", "GS550", "GS550W", "GS850", "GS900"],
  
  "Queclink": ["GV55", "GV55 Lite", "GV75", "GV300", "GV300W", "GV350", "GV600", "GV300M", "GL50", "GL50MG", "GL100", "GL100M", "GL200", "GL300", "GL300W", "GL500", "GL505", "GL505M", "GV20", "GV25", "GV500", "GV500MA", "GV200", "GL50B", "GL50LC", "GL300M", "GL300MG", "GV30W", "GV55MA", "GV65", "GV65Plus"],
  
  "Sinotrack": ["ST-901", "ST-902", "ST-906", "ST-907", "ST-909", "ST-910", "ST-915", "ST-818", "ST-919", "ST-919G", "ST-901A", "ST-902A", "ST-905", "ST-908", "ST-920", "ST-922", "ST-930", "ST-935", "ST-940"],
  
  "Eelink": ["TK115", "TK116", "TK116 Pro", "TK119", "TK119-H", "TK116 3G", "TK116 4G", "M588N", "M588T", "TK117", "TK118", "TK119-L", "TK120", "TK121", "TK210", "TK220", "TK319", "TK369", "TK419", "M558", "M588S", "M588G"],
  
  "Teltonika": ["FMB001", "FMB002", "FMB003", "FMB010", "FMB110", "FMB120", "FMB122", "FMB125", "FMB130", "FMB140", "FMB204", "FMB208", "FMM001", "FMC001", "FMM125", "FMP100", "FMB920", "FMB921", "FMB640", "FMB630", "FMB150", "FMB202", "FMB900", "FMB910", "FMU125", "FMU126", "FMA120", "FMA130", "TMT250", "GH5200", "TAT100"],
  
  "Meitrack": ["T311", "T333", "T355", "T366", "T366G", "T622G", "MVT100", "MVT340", "MVT380", "MVT600", "MVT800", "T311U", "T322", "T333G", "T344", "T388", "T633L", "MVT340G", "MVT380G", "MVT400", "MVT500", "MVT700", "P88L", "P99G", "T1", "T3"],
  
  "Gosafe": ["G1", "G6", "G737", "G787", "G797", "G7A", "G7B", "G79", "G79W", "G79W+", "G3", "G6S", "G717", "G7C", "G7D", "G79B", "G200", "G70", "G737L", "G70S", "G808", "G828"],
  
  "JiMi/Concox": ["GT06", "GT06N", "JM01", "JM-VL01", "JM-LL01", "JM-VL02", "JM-LL02", "HVT001", "HVT002", "JM02", "JM-VL03", "JM-LL03", "JM-VL04", "JM-LL04", "JM-TL01", "JM-TL02", "JM-TL03", "HVT003", "HVT004"],
  
  "TK Star": ["TK905", "TK906", "TK909", "TK911", "TK915", "TK919", "TK925", "TK218", "TK913", "TK928", "TK935", "TK102B", "TK103B", "TK105", "TK116", "TK800", "TK816", "TK916", "TK918", "TK1000"],
  
  "GT06": ["J16", "J16 iButton","GT06", "GT06N", "GT06E", "GT09", "GT02", "GT02A", "GT02D", "GT100", "GT170", "GT500", "GT800", "GT900", "GT03A", "GT03B", "GT03C", "GT03D"],
  
  "Aotego": ["AT1", "AT2", "AT4", "AT06", "AT07", "AT09", "AT05", "AT08", "AT10", "AT11", "AT12", "AT15", "AT20", "AT30", "AT100", "AT200"],
  
  "Jointech": ["GP4000", "GP6000", "GP8000", "GP9000", "VT900", "VT1000", "GP2000", "GP3000", "GP5000", "GP7000", "GP10000", "VT300", "VT600", "VT800", "VT1100", "GT200"],
  
  "Suntech": ["ST200", "ST300", "ST340", "ST600", "ST600R", "ST650", "ST900", "ST940", "ST800", "ST850", "ST910", "ST930", "ST1100", "ST4100", "ST4300", "ST4340", "ST5100", "ST7100"],
  
  "GlobaSat": ["TR-151", "TR-203", "TR-206", "TR-207", "TR-600", "GTR-128", "GTR-129", "GTR-388", "TR-102", "TR-202", "TR-208", "TR-306", "TR-606", "GTR-100", "GTR-209", "GTR-359", "GTR-399", "TT8850"],
  
  "Aika": ["A1", "A2", "A3", "A5", "A6", "A8", "A9", "A4", "A7", "A10", "A11", "A12", "A15", "A20", "A30", "A100"],
  
  "Orion": ["Orion 2.0", "OL-3000", "OL-4000", "OL-5000", "OL-6000", "Orion 1.0", "Orion 3.0", "OL-1000", "OL-2000", "OL-7000", "OL-8000", "OL-9000", "OL-10000"],
  
  "Neoway": ["N200", "N300", "N400", "M590", "M590E", "L300", "N100", "N500", "N600", "M680", "M590G", "L500", "L600", "M100", "M110", "M680C"],
  
  "Aplicom": ["A1", "A9", "A10", "A11", "A12", "C10", "A5", "A7", "A8", "A13", "A15", "C5", "C8", "C12", "C15", "T10", "T15"],
  
  "Sanav": ["GC-101", "CT-24", "ML-10", "ST-4710", "FT-5000", "CT-24G", "CT-28", "GC-201", "GC-301", "ML-20", "ST-5500", "FT-3000", "FT-4000", "FT-6000"],
  
  "Calamp": ["LMU-200", "LMU-300", "LMU-400", "LMU-500", "LMU-700", "LMU-800", "LMU-900", "LMU-1100", "LMU-2600", "LMU-2700", "LMU-3000", "LMU-3030", "LMU-4200", "LMU-4230", "LMU-1200", "LMU-1300", "LMU-2000", "LMU-2100", "LMU-2500", "LMU-5000", "LMU-5530", "TTU-700", "TTU-1200", "TTU-2830"],
  
  "TotemTrack": ["TT12", "TT15", "TT18", "TT100", "TT120", "TT300", "TT360", "TT20", "TT25", "TT30", "TT200", "TT250", "TT400", "TT500", "TT600"],
  
  "Ruptela": ["FM-Pro3", "FM-Pro4", "FM-Tco4 HCV", "FM-Eco4", "FM-Eco4 S", "FM-Eco4 T", "FM-Eco4 Light", "FM-Eco4 Light+", "FM-Pro5", "FM-Tco5", "FM-Tco5 HCV", "FM-Eco5", "FM-Eco6", "FM-Pro6", "FM-Tco6", "FM-Tco6 HCV", "FM-Pro3G", "FM-Eco6 S"],
  
  "ZKTeco": ["VT1000", "VT200", "VT300", "VT900", "VT100", "VT400", "VT500", "VT600", "VT700", "VT800", "VT1200", "VT1500", "VT2000"],
  
  "Tramigo": ["T22", "T23", "M1", "M1 Move", "M1 Fleet", "M1 Sky", "T10", "T20", "T24", "M7", "M5", "PHOX"],
  
  "Skypatrol": ["TT8750", "TT8750 Plus", "TT9200", "TT8850", "TT8860", "TT9400", "TT9500", "TT9800", "SP7600", "SP8100"],
  
  "Xenun": ["TK10GSM", "TK20GSM", "TK30GSM", "TK510", "TK510 Plus", "TK1000", "SL48", "SL44", "EC33", "TG100", "TG200", "TG300"],
  
  "TopFlyTech": ["T8803", "T8803 Plus", "T8801", "T8806", "T8808", "T1000", "T5000", "T8800", "T8804", "T8805", "T8810", "T8900"],
  
  "Enfora": ["MT-GL", "MT-3000", "MT-4000", "GSM2338", "GSM2358", "GSM2418", "Spider AT", "Spider MT", "Spider PT", "Mini MT"],
  
  "Benway": ["BW08", "BW09", "BW10", "BW20", "GT06", "GT06E", "GT100", "GT300", "GS102", "GS103"],
  
  "Navixy": ["A1", "A5", "A7", "M1", "M3", "M5", "M7", "S1", "S3", "S5", "S7", "X1", "X3", "X5", "X7"],
  
  "ATrack": ["AX5", "AX7", "AX9", "AX11", "AX7 Plus", "AL1", "AL5", "AK1", "AK3", "AK11", "AU7", "AT1", "AT5", "AT5i"],
  
  "Xexun": ["TK102", "TK103", "TK201", "TK202", "TK203", "TK208", "TK208-2", "TK209", "TK210", "TK510", "TK510-2", "XT008", "XT009", "XT107", "XT107-2"],
  
  "Falcom": ["FOX3-2G", "FOX3-3G", "FOX3-4G", "STEPP III", "BOLERO", "MAMBO", "SAMBA", "JAZZ", "ORCA", "FOX2", "FOX4", "FOX5"],
  
  "Wonde Proud": ["TK510", "TK510-2", "TK510-3", "TK510-3G", "TK510-L", "WP-360", "WP-810", "WP-900", "WP-900G", "WP-3500"],
  
  "Topten": ["GT02A", "GT02", "GT06", "GT06E", "GT06N", "GT100", "GT100X", "GT1000", "GT300", "GT300X", "GT500", "GT900"]
  };
  
  return modelMap[brand] || [];
};

// Función para obtener todas las marcas de GPS disponibles
const getAllGpsBrands = () => {
  // Extraer todas las marcas del objeto modelMap en getBrandModels
  const modelMap = {
    "Coban": [], "Concox": [], "Queclink": [], "Sinotrack": [], "Eelink": [],
    "Teltonika": [], "Meitrack": [], "Gosafe": [], "JiMi/Concox": [], "TK Star": [],
    "GT06": [], "Aotego": [], "Jointech": [], "Suntech": [], "GlobaSat": [],
    "Aika": [], "Orion": [], "Neoway": [], "Aplicom": [], "Sanav": [],
    "Calamp": [], "TotemTrack": [], "Ruptela": [], "ZKTeco": [], "Tramigo": [],
    "Skypatrol": [], "Xenun": [], "TopFlyTech": [], "Enfora": [], "Benway": [],
    "Navixy": [], "ATrack": [], "Xexun": [], "Falcom": [], "Wonde Proud": [],
    "Topten": []
  };
  return Object.keys(modelMap).sort();
};

// Actualizar la lista de marcas con todas las disponibles
onMounted(() => {
  commonGpsBrands.value = getAllGpsBrands();
  
  // Agregar estilos globales para los dropdowns
  const style = document.createElement('style');
  style.textContent = `
    .el-dropdown-menu {
      max-height: 300px !important;
      overflow-y: auto !important;
    }
    .gps-brand-menu, .gps-model-menu {
      max-height: 300px !important;
      overflow-y: auto !important;
    }
    .el-dropdown-menu::-webkit-scrollbar {
      width: 6px !important;
    }
    .el-dropdown-menu::-webkit-scrollbar-thumb {
      background-color: #dcdfe6 !important;
      border-radius: 3px !important;
    }
  `;
  document.head.appendChild(style);
});

const updateFilterIcons = () => {
  // Actualizar iconos de filtros de Estado
  const stateValue = stateFilter.value;
  document.querySelectorAll('.state-filters .filter-icon').forEach(icon => {
    if (icon.classList.contains(`${stateValue}`) || 
        (stateValue === 'all' && icon.classList.contains('all'))) {
      icon.classList.add('active');
    } else {
      icon.classList.remove('active');
    }
  });
  
  // Actualizar iconos de filtros de Conectividad
  const connectivityValue = store.state.devices.applyFilters.combinedStatusFilter;
  document.querySelectorAll('.connectivity-filters .filter-icon').forEach(icon => {
    if ((icon.classList.contains('online') && connectivityValue === 'online') ||
        (icon.classList.contains('offline') && connectivityValue === 'offline') ||
        (icon.classList.contains('unknown') && connectivityValue === 'unknown') ||
        (icon.classList.contains('motion') && connectivityValue === 'moving') ||
        (icon.classList.contains('stopped') && connectivityValue === 'stopped')) {
      icon.classList.add('active');
    } else if (connectivityValue === 'all') {
      icon.classList.remove('active');
    }
  });
  
  // Actualizar iconos de filtros Avanzados
  const advancedFilters = [...store.state.devices.applyFilters.combinedAdvancedFilters];
  if (store.state.devices.applyFilters.advancedFilter.type !== 'none') {
    advancedFilters.push(store.state.devices.applyFilters.advancedFilter);
  }
  
  // Primero restablecer todos los filtros avanzados
  document.querySelectorAll('.advanced-filters .filter-icon').forEach(icon => {
    icon.classList.remove('active');
  });
  
  // Luego activar los que están en uso
  advancedFilters.forEach(filter => {
    if (filter.type === 'anchor' && filter.value === true) {
      document.querySelector('.filter-icon.anchor')?.classList.add('active');
    }
    if (filter.type === 'driver' && filter.value === true) {
      document.querySelector('.filter-icon.driver')?.classList.add('active');
    }
    if (filter.type === 'ignition' && filter.value === true) {
      document.querySelector('.filter-icon.ignition-on')?.classList.add('active');
    }
    if (filter.type === 'ignition' && filter.value === false) {
      document.querySelector('.filter-icon.ignition-off')?.classList.add('active');
    }
    if (filter.type === 'locked' && filter.value === true) {
      document.querySelector('.filter-icon.locked-on')?.classList.add('active');
    }
    if (filter.type === 'locked' && filter.value === false) {
      document.querySelector('.filter-icon.locked-off')?.classList.add('active');
    }
  });
  
  // Actualizar filtros de GPS
  const gpsBrand = document.querySelector('.gps-brand-dropdown .el-dropdown-selfdefine');
  const gpsModel = document.querySelector('.gps-model-dropdown .el-dropdown-selfdefine');
  const technology = document.querySelector('.technology-dropdown .el-dropdown-selfdefine');
  
  if (gpsBrandFilter.value) {
    gpsBrand?.classList.add('active');
  } else {
    gpsBrand?.classList.remove('active');
  }
  
  if (gpsModelFilter.value) {
    gpsModel?.classList.add('active');
  } else {
    gpsModel?.classList.remove('active');
  }
  
  if (technologyFilter.value) {
    technology?.classList.add('active');
  } else {
    technology?.classList.remove('active');
  }
};

const setStateFilter = (value) => {
  console.log("Setting state filter to:", value);
  // Actualizar estado local y en el store
  stateFilter.value = value;
  store.dispatch('devices/setStateFilter', value);
  
  // Preservar los filtros avanzados (mantener candados y otros filtros activos)
  // No se borran los filtros avanzados cuando se cambia el filtro de estado
  
  // Forzar que los iconos se actualicen con la clase activa correcta
  const stateFilterIcons = document.querySelectorAll('.filters-group.state-filters .filter-icon');
  stateFilterIcons.forEach(icon => {
    if ((icon.classList.contains('all') && value === 'all') ||
        (icon.classList.contains('installed') && value === 'installed') ||
        (icon.classList.contains('in-service') && value === 'in_service') ||
        (icon.classList.contains('with-failures') && value === 'with_failures') ||
        (icon.classList.contains('in-stock') && value === 'in_stock') ||
        (icon.classList.contains('withdrawn') && value === 'withdrawn') ||
        (icon.classList.contains('company') && value === 'company')) {
      icon.classList.add('active');
    } else {
      icon.classList.remove('active');
    }
  });
  
  // Forzar recálculo inmediato
  setTimeout(() => {
    filteredDevices.value = recalcDevices();
    // Actualizar el estado visual de todos los filtros
    updateFilterIcons();
  }, 100);
}

import DeviceItem from "./devices.item"



const markerContext = inject('markerContext');
//const markerClick = inject('markerClick');

const filteredDevices = ref([]);

const query = ref(window.localStorage.getItem('query') || '');
const showImportModal = ref(false);

// Variables para importación
const importStep = ref(1);
const fileName = ref('');
const previewData = ref([]);
const headers = ref([]);
const processedCount = ref(0);
const totalToProcess = ref(0);
const successCount = ref(0);
const errorCount = ref(0);
const errorLog = ref([]);

// Computed para progreso
const progressPercentage = computed(() => {
  if (totalToProcess.value === 0) return 0;
  return Math.round((processedCount.value / totalToProcess.value) * 100);
});
//const editDeviceRef = inject('edit-device');
const editGroupRef = inject('edit-group');

// Variable para controlar la visibilidad del panel de filtros
const showFiltersPanel = ref(false);

// Función para verificar si hay algún filtro GPS activo
const hasAnyGpsFilter = computed(() => {
  // Verificar en filtros combinados
  const hasGpsFilter = store.state.devices.applyFilters.combinedAdvancedFilters.some(
    filter => filter.type === 'gps_brand' || filter.type === 'gps_model' || filter.type === 'technology'
  );
  
  // También verificar en el filtro principal
  const mainFilter = store.state.devices.applyFilters.advancedFilter;
  const hasMainGpsFilter = mainFilter.type === 'gps_brand' || 
                           mainFilter.type === 'gps_model' || 
                           mainFilter.type === 'technology';
  
  return hasGpsFilter || hasMainGpsFilter;
});

// Función para limpiar todos los filtros GPS
const clearAllGpsFilters = () => {
  console.log("Limpiando todos los filtros GPS");
  
  // Limpiar filtros GPS del filtro principal
  const mainFilter = store.state.devices.applyFilters.advancedFilter;
  if (mainFilter.type === 'gps_brand' || mainFilter.type === 'gps_model' || mainFilter.type === 'technology') {
    store.dispatch('devices/setAdvancedFilter', {type: 'none', value: null});
  }
  
  // Limpiar filtros GPS de los filtros combinados
  store.state.devices.applyFilters.combinedAdvancedFilters = 
    store.state.devices.applyFilters.combinedAdvancedFilters.filter(
      filter => filter.type !== 'gps_brand' && filter.type !== 'gps_model' && filter.type !== 'technology'
    );
  
  // Forzar actualización de la lista de dispositivos
  filteredDevices.value = recalcDevices();
};

// Función para limpiar todos los filtros
const clearAllFilters = () => {
  console.log("Limpiando todos los filtros");
  
  // Restablecer filtro de estado a "todos"
  stateFilter.value = 'all';
  store.dispatch('devices/setStateFilter', 'all');
  
  // Limpiar también los filtros GPS
  clearAllGpsFilters();
  
  // Restablecer filtro combinado a "todos"
  store.dispatch('devices/setCombinedStatusFilter', 'all');
  
  // Limpiar filtro avanzado
  store.dispatch('devices/setAdvancedFilter', {type: 'none', value: null});
  
  // Limpiar filtros combinados
  store.state.devices.applyFilters.combinedAdvancedFilters = [];
  
  // Forzar actualización de la lista de dispositivos
  filteredDevices.value = recalcDevices();
};

// Verificar si hay algún filtro activo
const hasActiveFilters = computed(() => {
  return stateFilter.value !== 'all' ||
         store.state.devices.applyFilters.combinedStatusFilter !== 'all' ||
         store.state.devices.applyFilters.advancedFilter.type !== 'none' ||
         store.state.devices.applyFilters.combinedAdvancedFilters.length > 0;
});

// Mostrar el número de dispositivos filtrados en el badge
const activeFiltersCount = computed(() => {
  // Verificar si hay filtros activos
  const isFiltering = hasActiveFilters.value || query.value.trim().length > 0;
  
  // Si hay filtros activos, mostrar la cantidad de dispositivos filtrados
  // Si no hay filtros activos, mostrar 0 (lo que ocultará el badge)
  return isFiltering ? filteredDevices.value.length : 0;
});

// Función para alternar el panel de filtros
const toggleFiltersPanel = () => {
  // Si el panel está abierto y vamos a cerrarlo, limpiar los filtros
  if (showFiltersPanel.value) {
    clearAllFilters();
  }
  // Alternar la visibilidad del panel
  showFiltersPanel.value = !showFiltersPanel.value;
};

// Función para manejar los filtros de conectividad
const handleStatusFilter = (status) => {
  // Cambiar el estado del filtro
  const currentValue = store.state.devices.applyFilters.combinedStatusFilter;
  const newValue = currentValue === status ? 'all' : status;
  
  // Actualizar en el store
  store.dispatch('devices/setCombinedStatusFilter', newValue);
  
  // Actualizar la UI después de un breve delay para asegurar que todos los cambios tomen efecto
  setTimeout(() => {
    updateFilterIcons();
  }, 50);
};

const now = ref(0);

const deviceId = computed(() =>(parseInt(route.params.device.id)));  // Ejemplo de un `id` de dispositivo almacenado en `state`

//const device = computed(() => {
 // return store.getters['devices/getDevice'](parseInt(route.params.deviceId));  // Obtenemos el dispositivo usando el `id`
//});

// Usar un watcher para imprimir el valor de 'device' en la consola

//const device = store.getters['devices/getDevice'](device.value.Id)

const deviceLimitExceded = () => {
  const currentCount = Object.keys(store.state.devices.deviceList).length;
  const userLimit = store.state.auth.deviceLimit;
  const serverLimit = parseInt(store.getters['server/getAttribute']('tarkan.deviceLimit') || -1);
  const allowedLimit = parseInt(store.state.server.allowedLimit);
  
  let limitType = '';
  let limitValue = 0;
  
  if (store.state.auth.administrator) {
    if (store.state.server.allowedLimit !== false && allowedLimit <= currentCount) {
      limitType = 'servidor (licencia)';
      limitValue = allowedLimit;
    } else if (serverLimit > 0) {
      limitType = 'servidor';
      limitValue = serverLimit;
    }
  } else {
    limitType = 'usuario';
    limitValue = userLimit;
  }
  
  ElMessageBox.alert(
    `Has alcanzado el límite de ${limitValue} dispositivos permitidos para tu ${limitType}.\n\nDispositivos actuales: ${currentCount}`,
    KT('device.deviceLimitReached'),
    {
      confirmButtonText: KT('common.ok'),
      type: 'warning'
    }
  );
}

const showTip = (evt,text)=>{
  window.$showTip(evt,text);
}

const hideTip = (evt,text)=>{
  window.$hideTip(evt,text);
}



//const showAlarmTip = ($event,deviceId)=>{
//  const position = store.getters['devices/getPosition'](deviceId);
//  showTip($event,KT('alarms.'+position.attributes.alarm))
//}


//const showStopped = ($event,deviceId)=>{
//
 // const position = store.getters['devices/getPosition'](deviceId);
////
 // showTip($event,'Parado há '+getLastUpdated(position.attributes.stoppedTime,now.value))
//}

//const showDriverTip = ($event,deviceId)=>{
  //const position = store.getters['devices/getPosition'](deviceId);

 // if(position.attributes['driverUniqueId']){
  //  const driver = store.getters['drivers/getDriverByUniqueId'](position.attributes['driverUniqueId']);
 //   if(driver){
 //     showTip($event,driver.name)
 //   }else{
 //     showTip($event,position.attributes['driverUniqueId'])
////    }
 // }

//}





const realDevices = ref(null);
// Variables para paginación (no usadas actualmente)

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


// Definir imageUrl como un ref
//import {defineProps} from 'vue';

// Definir imageUrl como un ref reactivo
//const imageUrls = ref({});
// Definir props si es necesario (por ejemplo, el grupo)
const device = store.getters['devices/getDevice'](deviceId);




// Variable para controlar si estamos retornando a la vista de dispositivos
const isReturningToDevicesView = ref(false);

// Referencia al intervalo de tiempo para poder limpiarlo
const timeInterval = ref(null);

onMounted(() => {
  // Actualizar hora actual a intervalos (optimizado a 3 segundos)
  timeInterval.value = setInterval(() => {
    now.value = new Date();
  }, 3000);

  // Configuración para optimizar rendimiento al retornar a la vista
  isReturningToDevicesView.value = sessionStorage.getItem('returningToDevicesView') === 'true';
  
  // Cargar los dispositivos
  try {
    filteredDevices.value = recalcDevices();
  } catch (err) {
    console.error("Error al cargar dispositivos:", err);
  }
  
  // Si estamos retornando, eliminar la marca
  if (isReturningToDevicesView.value) {
    sessionStorage.removeItem('returningToDevicesView');
  }
    
  setSortingByState();

  // Si la ruta tiene el parámetro 'edit', abrimos el editor
  if (route.query.edit) {
    openEdit();
  }

  // Inicializar mapa si es necesario
  if (map.value) {
    map.value.leafletObject = L.map(map.value).setView([51.505, -0.09], 13);
  }

  // Guardar lista completa de dispositivos
  devices.value = store.getters['devices/getOrderedDevices'];
});

// Mover onUnmounted fuera de onMounted para evitar problemas de cierre
onUnmounted(() => {
  // Limpiar intervalo si existe
  if (timeInterval.value) {
    clearInterval(timeInterval.value);
    timeInterval.value = null;
  }
  
  // Marcar que estamos saliendo de la vista de dispositivos
  sessionStorage.setItem('returningToDevicesView', 'true');
});

// Debounce para a busca (query)
let queryUpdateTimeout = null;

watch(query, () => {
  // Cancelar timeout anterior se existir
  if (queryUpdateTimeout) {
    clearTimeout(queryUpdateTimeout);
  }
  
  // Definir novo timeout de 300ms para debounce durante digitação
  queryUpdateTimeout = setTimeout(() => {
    filteredDevices.value = recalcDevices();
  }, 300);
});

// Usando debounce para evitar múltiplas execuções em sequência
let deviceUpdateTimeout = null;

watch(()=> store.getters['devices/getOrderedDevices'].length, () => {
  // Cancelar timeout anterior se existir
  if (deviceUpdateTimeout) {
    clearTimeout(deviceUpdateTimeout);
  }
  
  // Definir novo timeout de 200ms para debounce
  deviceUpdateTimeout = setTimeout(() => {
    console.log("Mudança detectada nos dispositivos - recalculando lista");
    filteredDevices.value = recalcDevices();
  }, 200);
});


// Debounce para mudanças de ordenação
let sortingUpdateTimeout = null;

watch(()=> store.getters['devices/sorting'], () => {
  // Cancelar timeout anterior se existir
  if (sortingUpdateTimeout) {
    clearTimeout(sortingUpdateTimeout);
  }
  
  // Usar timeout mais curto para ordenação (100ms) pois é uma ação direta do usuário
  sortingUpdateTimeout = setTimeout(() => {
    filteredDevices.value = recalcDevices();
  }, 100);
});

// Observar cambios en los filtros de dispositivos para actualizar la lista
// Este watch asegura que cuando los filtros en el store cambian,
// la lista de dispositivos visible se actualiza para mantenerse sincronizada
watch(() => store.getters['devices/getFilters'], (newFilters) => {
  console.log("Filtros cambiados en store:", newFilters);
  
  // Sincronizar el filtro de estado local con el del store
  if (stateFilter.value !== newFilters.stateFilter) {
    console.log("Sincronizando filtro de estado:", newFilters.stateFilter);
    stateFilter.value = newFilters.stateFilter;
  }
  
  // Actualizamos la lista filtrada después de un breve retraso
  setTimeout(() => {
    filteredDevices.value = recalcDevices();
  }, 100);
}, { deep: true });

// Observar cambios en el filtro de estado local para mantener sincronizado con el store
watch(stateFilter, (newValue) => {
  console.log("Estado local cambiado a:", newValue);
  
  // Verificar si el valor en el store es diferente
  if (store.state.devices.applyFilters.stateFilter !== newValue) {
    console.log("Sincronizando estado con store:", newValue);
    store.dispatch('devices/setStateFilter', newValue);
  }
  
  // Actualizar UI para reflejar el nuevo estado
  const filterIcons = document.querySelectorAll('.filter-icon');
  if (filterIcons) {
    filterIcons.forEach(icon => {
      if (icon.classList.contains(`state-${newValue}`) || 
          (newValue === 'all' && icon.classList.contains('all'))) {
        icon.classList.add('active');
      } else {
        icon.classList.remove('active');
      }
    });
  }
});

// Método para manejar el scroll y asegurar que los contadores estén actualizados
const realScroll = () => {
  // Actualizar el contador de dispositivos totales
  const deviceCounter = document.querySelector('.devices-count');
  if (deviceCounter && filteredDevices.value) {
    deviceCounter.textContent = filteredDevices.value.length + ' dispositivos';
  }
  
  // Actualizar contador de filtros si es necesario
  if (query.value && query.value.length > 0) {
    const filterCounter = document.querySelector('.filter-counter');
    if (filterCounter) {
      // Usar la estructura HTML para mantener la burbuja de conteo
      const filterText = document.createElement('span');
      filterText.textContent = KT('device.filtered') + '\u00A0'; // \u00A0 es espacio no rompible
      
      const filterBubble = document.createElement('span');
      filterBubble.className = 'filter-bubble';
      filterBubble.textContent = filteredDevices.value.length;
      
      // Limpiar el contenido actual y agregar los nuevos elementos
      filterCounter.innerHTML = '';
      filterCounter.appendChild(filterText);
      filterCounter.appendChild(filterBubble);
    }
  }
}




//////////aqui getLastUpdate////////


// Variable para indicar si está calculando
if (!window.$isCalculating) {
  window.$isCalculating = false;
}

// Flag para indicar si el filtrado proviene de un botón
const isButtonFilter = ref(false);

// Función optimizada de recálculo de dispositivos con procesamiento por lotes
// Versión mejorada con soporte para clustering
const recalcDevices = (onComplete = null) => {
  // Evitar recálculos simultáneos
  if (window.$isCalculating) {
    return filteredDevices.value || [];
  }
  
  window.$isCalculating = true;
  
  // Inicialmente no hay filtrado activo
  let isCurrentlyFiltering = false;

  // Guardar búsqueda en localStorage
  if (!isButtonFilter.value) {
    window.localStorage.setItem('query', query.value);
  }

  // Procesar filtros especiales (días, horas, etc.)
  const r = query.value.toLowerCase().matchAll(/(.*?):(?<sinal>\+|-|=)(?<tempo>\d*) (?<filtro>dias|minutos|horas|segundos)/gi);
  const s = r.next();

  // Buscar grupos que coincidan con la búsqueda
  let groupList = [];
  if (query.value && query.value.length > 2) {
    store.state.groups.groupList.forEach((g) => {
      if (g && g.name && String(g.name).toLowerCase().includes(query.value.toLowerCase())) {
        groupList.push(g.id);
      }
    });
  }

  // Implementación mejorada para filtrado de estado consistente
  const allDevices = store.getters['devices/getOrderedDevices'] || [];
  let filteredResults = [];
  
  // Sincronizar con el filtro de estado en el store y la UI
  const currentStateFilter = store.state.devices.applyFilters.stateFilter || 'all';
  stateFilter.value = currentStateFilter;
  
  console.log("Filtrado de estado aplicado:", currentStateFilter);
  
  // Verificar si tenemos algún filtro activo
  if (currentStateFilter !== 'all') {
    isCurrentlyFiltering = true;
    console.log("Filtro por estado activo:", currentStateFilter);
  }
  
  if (query.value && query.value.length > 0) {
    isCurrentlyFiltering = true;
    console.log("Filtro por búsqueda activo:", query.value);
  }
  
  if (isButtonFilter.value) {
    isCurrentlyFiltering = true;
    console.log("Filtro por botón activo");
  }
  
  // Verificar filtro combinado de estado
  if (store.state.devices.applyFilters.combinedStatusFilter !== 'all') {
    isCurrentlyFiltering = true;
    console.log("Filtro combinado activo:", store.state.devices.applyFilters.combinedStatusFilter);
  }
  
  // Verificar filtro avanzado
  if (store.state.devices.applyFilters.advancedFilter.type !== 'none') {
    isCurrentlyFiltering = true;
    console.log("Filtro avanzado activo:", store.state.devices.applyFilters.advancedFilter);
  }
  
  // Verificar otros filtros
  if (store.state.devices.applyFilters.statusFilter !== 'all') {
    isCurrentlyFiltering = true;
    console.log("Filtro por estado de conexión activo:", store.state.devices.applyFilters.statusFilter);
  }
  
  if (store.state.devices.applyFilters.motionFilter) {
    isCurrentlyFiltering = true;
    console.log("Filtro por movimiento activo");
  }
  
  // Comprobar si el clustering está habilitado
  const isClusterEnabled = store.getters['mapPref']('clustered', true);
  
  // Iteramos sobre todos los dispositivos aplicando filtros
  for (let i = 0; i < allDevices.length; i++) {
    const deviceId = allDevices[i];
    const device = store.getters['devices/getDevice'](deviceId);
    
    if (!device) continue;
    
    // Con clustering activado, no manipulamos directamente los íconos
    // Esto se hará automáticamente a través de la clase CSS "way-filtering"
    // Solo removemos íconos si no hay clustering
    if (!isClusterEnabled && device.icon && device.icon[0] && typeof device.icon[0].remove === 'function') {
      device.icon[0].remove();
    }
    
    let visible = false;
    
    // PRIMER FILTRO: Verificar filtro de estado (prioridad absoluta)
    if (currentStateFilter !== 'all') {
      // Solo procesar dispositivos que coincidan con el estado seleccionado
      if (!(device.attributes && device.attributes['device.state'] === currentStateFilter)) {
        // Si no coincide con el estado, pasar al siguiente dispositivo
        continue;
      }
      // Si pasa el filtro de estado, marcarlo como potencialmente visible
      visible = true;
    } else {
      // Si no hay filtro de estado, todos son potencialmente visibles
      visible = true;
    }
    
    // SEGUNDO FILTRO: Aplicar filtros de búsqueda y otros
    if (query.value || isButtonFilter.value) {
      // Reiniciar visibilidad para evaluar los otros filtros
      visible = false;
      
      const queryLower = query.value.toLowerCase();
      
      // Filtros de fecha
      if (s && s.value && s.value.groups) {
        if (s.value.groups.filtro === 'dias') {
          const df = parseInt(s.value.groups.tempo) * 86400;
          const diff = Math.round((new Date().getTime() - new Date(device.lastUpdate).getTime()) / 1000);
          
          if ((s.value.groups.sinal === '+' && diff >= df) || 
              (s.value.groups.sinal === '-' && diff <= df)) {
            visible = true;
          }
        }
      }
      // Búsqueda de texto
      else if (query.value && query.value.length > 2) {
        // Propiedades más comunes para la búsqueda
        if (device.name?.toLowerCase().includes(queryLower) || 
            device.status?.toLowerCase().replace('unknown', 'desconhecido').includes(queryLower) ||
            device.uniqueId?.toLowerCase().includes(queryLower) ||
            device.attributes?.placa?.toLowerCase().includes(queryLower)) {
          visible = true;
        }
        // Búsqueda en otros atributos
        else if (device.attributes) {
          for (const key in device.attributes) {
            if (device.attributes[key] && 
                String(device.attributes[key]).toLowerCase().includes(queryLower)) {
              visible = true;
              break;
            }
          }
        }
        
        // Filtro por grupo
        if (!visible && device.groupId !== 0 && groupList.includes(device.groupId)) {
          visible = true;
        }
      } 
      // Filtro de botón especial (por ejemplo, última hora)
      else if (isButtonFilter.value) {
        // Este caso se maneja donde se establece el filtro de botón
        visible = true;
      }
      // Sin filtros adicionales, mantener visible
      else {
        visible = true;
      }
    }
    
    // TERCER FILTRO: Verificar filtros de estado (online, offline, unknown) y de movimiento
    // Check if we're using the combined status filter
    if (visible && store.state.devices.applyFilters.combinedStatusFilter !== 'all') {
      const combinedStatusFilter = store.state.devices.applyFilters.combinedStatusFilter;
      const position = store.getters['devices/getPosition'](device.id);
      
      switch(combinedStatusFilter) {
        case 'online':
          if (device.status !== 'online') {
            visible = false;
          }
          break;
        case 'offline':
          if (device.status !== 'offline') {
            visible = false;
          }
          break;
        case 'unknown':
          if (device.status !== 'unknown') {
            visible = false;
          }
          break;
        case 'moving': {
          // REGLA BÁSICA: Si está offline, NO puede estar en movimiento
          if (device.status !== 'online') {
            visible = false;
          }
          // Solo si está online, verificar si tiene motion=true
          else if (!position || !position.attributes || !position.attributes.motion) {
            visible = false;
          }
        }
          break;
        case 'stopped':
          // Device must be online but not in motion
          if (device.status !== 'online' || (position && position.attributes && position.attributes.motion)) {
            visible = false;
          }
          break;
      }
    }
    
    // CUARTO FILTRO: Filtros avanzados - Con soporte para filtros combinados y mejores diagnósticos
    // Crear una copia de los filtros combinados para debugging
    const combinedFilters = [...store.state.devices.applyFilters.combinedAdvancedFilters];
    
    // Añadir el filtro principal si no es 'none' y no está ya en la lista combinada
    if (store.state.devices.applyFilters.advancedFilter.type !== 'none') {
      const mainFilter = store.state.devices.applyFilters.advancedFilter;
      const exists = combinedFilters.some(f => 
        f.type === mainFilter.type && f.value === mainFilter.value
      );
      
      if (!exists) {
        combinedFilters.push(mainFilter);
      }
    }
    
    // Aplicar todos los filtros si hay alguno
    if (visible && combinedFilters.length > 0) {
      const position = store.getters['devices/getPosition'](device.id);
      
      // Logging para seguimiento (solo para desarrollo)
      if (device.id === 1) { // Solo imprimir para el primer dispositivo para evitar spam
        console.log(`Aplicando ${combinedFilters.length} filtros avanzados a dispositivo ${device.id}:`, 
          combinedFilters.map(f => `${f.type}=${f.value}`).join(', '));
      }
      
      // Filtros de atributos del dispositivo (independientes de la posición)
      const deviceFilters = combinedFilters.filter(f => 
        ['gps_brand', 'gps_model', 'technology'].includes(f.type)
      );
      
      // Filtros de posición (dependen de tener datos de posición)
      const positionFilters = combinedFilters.filter(f => 
        ['anchor', 'driver', 'ignition', 'locked'].includes(f.type)
      );
      
      // Aplicar filtros de dispositivo primero (más rápido y no requiere posición)
      for (const filter of deviceFilters) {
        visible = applyAdvancedFilter(device, position, filter, visible);
        if (!visible) break;
      }
      
      // Si sigue visible, aplicar filtros de posición
      if (visible && positionFilters.length > 0) {
        for (const filter of positionFilters) {
          visible = applyAdvancedFilter(device, position, filter, visible);
          if (!visible) break;
        }
      }
    }
    
    // QUINTO FILTRO: Filtros básicos (aplicados independientemente de los otros filtros)
    if (visible && store.state.devices.applyFilters.statusFilter !== 'all') {
      if (device.status !== store.state.devices.applyFilters.statusFilter) {
        visible = false;
      }
    }
    
    if (visible && store.state.devices.applyFilters.motionFilter) {
      const position = store.getters['devices/getPosition'](device.id);
      // REGLA BÁSICA: Si está offline, NO puede estar en movimiento
      if (device.status !== 'online') {
        visible = false;
      }
      // Solo si está online, verificar si tiene motion=true
      else if (!position || !position.attributes || !position.attributes.motion) {
        visible = false;
      }
    }
    
    // Agregar a resultados si pasa todos los filtros
    if (visible) {
      // Añadir la clase filter-visible al marcador para filtrado con clustering
      if (device.icon && device.icon[0] && device.icon[0].options && device.icon[0].options.el) {
        device.icon[0].options.el.classList.add('filter-visible');
      }
      
      // Añadir icono al mapa solo si no hay clustering
      if (!isClusterEnabled && device.icon && device.icon[0] && typeof device.icon[0].addToMap === 'function') {
        device.icon[0].addToMap();
      }
      filteredResults.push(device);
    } else {
      // Si no es visible, asegurarse de que se quite la clase filter-visible
      if (device.icon && device.icon[0] && device.icon[0].options && device.icon[0].options.el) {
        device.icon[0].options.el.classList.remove('filter-visible');
      }
    }
  }
  
  // Actualizar resultados
  filteredDevices.value = filteredResults;
  isButtonFilter.value = false;
  
  // Actualizar contador y burbuja de filtro en la UI
  const deviceCounter = document.querySelector('.devices-count');
  if (deviceCounter) {
    deviceCounter.textContent = filteredResults.length + ' dispositivos';
  }
  
  // Mostrar indicador de filtro si es necesario
  if (isCurrentlyFiltering) {
    const filterCounter = document.querySelector('.filter-counter');
    if (filterCounter) {
      const filterText = document.createElement('span');
      filterText.textContent = KT('device.filtered') + '\u00A0';
      
      const filterBubble = document.createElement('span');
      filterBubble.className = 'filter-bubble';
      filterBubble.textContent = filteredResults.length;
      
      filterCounter.innerHTML = '';
      filterCounter.appendChild(filterText);
      filterCounter.appendChild(filterBubble);
      filterCounter.style.display = 'flex';
    }
  } else {
    const filterCounter = document.querySelector('.filter-counter');
    if (filterCounter) {
      filterCounter.style.display = 'none';
    }
  }
  
  // IMPORTANTE: Notificar al store sobre el estado de filtrado
  console.log("Actualizando estado de filtrado en recalcDevices:", isCurrentlyFiltering);
  store.dispatch("setFiltering", isCurrentlyFiltering);
  
  // Forzar actualización de clases CSS para clustering
  if (isCurrentlyFiltering) {
    setTimeout(() => {
      if (isClusterEnabled) {
        document.body.classList.add("way-filtering");
        
        // Actualizar contadores de filtrado
        const advFilterType = store.state.devices.applyFilters.advancedFilter.type;
        if (advFilterType !== 'none') {
          console.log(`Dispositivos filtrados por ${advFilterType}: ${filteredResults.length}`);
        }
      }
    }, 50);
  } else {
    setTimeout(() => {
      if (isClusterEnabled) {
        document.body.classList.remove("way-filtering");
      }
    }, 50);
  }
  
  // Scroll al inicio
  setTimeout(() => {
    const scrollContainer = document.querySelector('.devices-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, 50);
  
  // Finalizar cálculo
  window.$isCalculating = false;
  
  // Ejecutar callback si existe
  if (typeof onComplete === 'function') {
    onComplete(filteredResults);
  }
  
  return filteredResults;
}



// Función para acceder a dispositivos filtrados (no usada actualmente)

const groupedDevices = computed(()=>{
  let showGroups = store.getters['mapPref']('groups');

  // IMPORTANTE: verificar primero si hay dispositivos filtrados
  if(!filteredDevices.value || filteredDevices.value.length === 0){
    // Caso especial: no hay dispositivos, devolver algo simple
    return [{id: -1, name: '', devices: [], open: true}];
  }

  if(showGroups){
    let tmp = {};
    const groups = store.state.groups.groupList || [];
    
    // Procesar cada dispositivo en los grupos
    filteredDevices.value.forEach((device)=>{
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
    });

    let list = [];

    // Agregar grupo sin asignación primero
    if(tmp[0] && tmp[0].length > 0) {
      list.push({id: 0, name: 'Sem Grupo', devices: tmp[0], open: true});
    }
    
    // Agregar los demás grupos que tengan dispositivos
    groups.forEach((g)=>{
      if(tmp[g.id] && tmp[g.id].length > 0) {
        list.push({id: g.id, name: g.name, devices: tmp[g.id], open: true}); // Cambiado a open:true
      }
    });

    // Verificar que haya grupos
    if(list.length === 0) {
      list.push({id: -1, name: '', devices: [], open: true});
    }

    return list;
  } else {
    // Sin agrupación, un solo grupo con todos los dispositivos
    return [{id: -1, name: '', devices: filteredDevices.value || [], open: true}];
  }
})

const generatePDF = async () => {
  try {
    ElMessage({
      message: `Generando PDF profesional con ${filteredDevices.value.length} dispositivos activos...`,
      type: 'info',
      duration: 3000
    });

    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Colores corporativos
    const primaryColor = [0, 83, 156]; // #00539c
    const lightGray = [245, 245, 245];
    const darkGray = [80, 80, 80];
    
    // Configuración de página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    
    // Función para agregar encabezado
    const addHeader = (pageNumber, totalPages) => {
      // Fondo del header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      // Logo y título
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Relatório de Dispositivos Ativos', margin, 15);
      
      // Fecha y página
      doc.setFontSize(10);
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
      doc.text(`Gerado em: ${dateStr}`, pageWidth - margin, 10, { align: 'right' });
      doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin, 20, { align: 'right' });
    };

    // Función para agregar pie de página
    const addFooter = () => {
      doc.setFillColor(...lightGray);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      doc.setTextColor(...darkGray);
      doc.setFontSize(8);
      doc.text('Sistema de Rastreamento Profissional', pageWidth / 2, pageHeight - 5, { align: 'center' });
    };

    // Preparar datos para la tabla
    const tableData = filteredDevices.value.map(device => {
      const position = store.getters['devices/getPosition'](device.id);
      const driver = position?.attributes?.driverUniqueId ? 
        store.getters['drivers/getDriverByUniqueId'](position.attributes.driverUniqueId) : null;
      
      return [
        device.name || 'N/A',
        device.uniqueId || 'N/A',
        device.attributes?.placa || 'N/A',
        device.attributes?.model || 'N/A',
        device.attributes?.brand || 'N/A',
        device.attributes?.color || 'N/A',
        driver?.name || 'Sem condutor',
        position?.speed ? `${Math.round(position.speed * 1.852)} km/h` : '0 km/h',
        position ? (position.attributes?.ignition ? 'Ligado' : 'Desligado') : 'N/A',
        position?.deviceTime ? new Date(position.deviceTime).toLocaleString('pt-BR') : 'N/A'
      ];
    });

    // Definir columnas da tabela
    const columns = [
      { header: 'Nome', dataKey: 'name' },
      { header: 'ID Único', dataKey: 'uniqueId' },
      { header: 'Placa', dataKey: 'placa' },
      { header: 'Modelo', dataKey: 'model' },
      { header: 'Marca', dataKey: 'brand' },
      { header: 'Cor', dataKey: 'color' },
      { header: 'Condutor', dataKey: 'driver' },
      { header: 'Velocidade', dataKey: 'speed' },
      { header: 'Ignição', dataKey: 'ignition' },
      { header: 'Última Atualização', dataKey: 'lastUpdate' }
    ];

    // Função para calcular total de páginas
    const calculatePages = () => {
      const rowsPerPage = 15; // Aproximadamente
      return Math.ceil(tableData.length / rowsPerPage) || 1;
    };

    const totalPages = calculatePages();
    let currentPage = 1;

    // Primeira página - Header e resumo
    addHeader(currentPage, totalPages);
    addFooter();

    // Resumo estatístico
    let yPos = 35;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Resumo Executivo', margin, yPos);
    
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const totalDevices = filteredDevices.value.length;
    const onlineDevices = filteredDevices.value.filter(device => {
      const position = store.getters['devices/getPosition'](device.id);
      return position && position.attributes?.ignition;
    }).length;
    const offlineDevices = totalDevices - onlineDevices;
    
    const withDriver = filteredDevices.value.filter(device => {
      const position = store.getters['devices/getPosition'](device.id);
      return position?.attributes?.driverUniqueId;
    }).length;

    doc.text(`• Total de Dispositivos: ${totalDevices}`, margin, yPos);
    yPos += 6;
    doc.text(`• Dispositivos Online: ${onlineDevices} (${Math.round(onlineDevices/totalDevices*100)}%)`, margin, yPos);
    yPos += 6;
    doc.text(`• Dispositivos Offline: ${offlineDevices} (${Math.round(offlineDevices/totalDevices*100)}%)`, margin, yPos);
    yPos += 6;
    doc.text(`• Com Condutor Atribuído: ${withDriver} (${Math.round(withDriver/totalDevices*100)}%)`, margin, yPos);
    
    yPos += 15;

    // Tabela usando jsPDF-autoTable
    doc.autoTable({
      head: [columns.map(col => col.header)],
      body: tableData,
      startY: yPos,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      columnStyles: {
        0: { cellWidth: 35 }, // Nome
        1: { cellWidth: 25 }, // ID Único
        2: { cellWidth: 20 }, // Placa
        3: { cellWidth: 25 }, // Modelo
        4: { cellWidth: 20 }, // Marca
        5: { cellWidth: 15 }, // Cor
        6: { cellWidth: 30 }, // Condutor
        7: { cellWidth: 20 }, // Velocidade
        8: { cellWidth: 18 }, // Ignição
        9: { cellWidth: 40 }  // Última Atualização
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          addHeader(data.pageNumber, totalPages);
        }
        addFooter();
      }
    });

    // Salvar PDF
    const fileName = `dispositivos_ativos_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(fileName);

    ElMessage({
      message: 'PDF gerado com sucesso!',
      type: 'success',
      duration: 3000
    });

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    ElMessage.error('Erro ao gerar PDF');
  }
};


const generateExcel = () => {
  // Definir las columnas
  const columns = ["Unique ID", "Placa", "Nome", "Teléfono", "Operador", "ICCID", "Contacto", "Categoría", "Deshabilitado"];

  // Preparar los datos
  const usersData = filteredDevices.value.map(device => [
    device.uniqueId || '-',
    device.attributes?.placa || '-',
    device.name || '-',
    device.phone || '-',
    device.attributes?.operator || '-',
    device.attributes?.iccid || '-',
    device.contact || '-',
    device.category || '-',
    device.disabled ? 'Sí' : 'No'
  ]);

  // Ordenar dispositivos por última actualización
  const sortedDevices = [...usersData].sort((a, b) => {
    return new Date(b.lastUpdate) - new Date(a.lastUpdate); // Cambiar según la estructura de usersData
  });

  // Crear una nueva hoja de trabajo
  const ws = XLSX.utils.aoa_to_sheet([columns, ...sortedDevices]);

  // Crear un nuevo libro de trabajo
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dispositivos Activos");

  // Establecer opciones para la descarga
  XLSX.writeFile(wb, "reporte_dispositivos_activos.xlsx");
};
const generateJSON = () => {
  const usersData = filteredDevices.value.map(device => ({
    uniqueId: device.uniqueId || '-',
    placa: device.attributes?.placa || '-',
    name: device.name || '-',
    phone: device.phone || '-',
    operator: device.attributes?.operator || '-',
    iccid: device.attributes?.iccid || '-',
    contact: device.contact || '-',
    category: device.category || '-',
    disabled: device.disabled ? 'Sí' : 'No'
  }));

  const jsonString = JSON.stringify(usersData, null, 2); // Convertir a JSON con formato
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reporte_dispositivos_activos.json';
  a.click();
  URL.revokeObjectURL(url); // Limpiar el objeto URL
};
// Función para generar PDF de dispositivos fuera de línea

const generateOfflinePDF = async () => {
  try {
    const now = new Date();
    
    // Filtrar dispositivos offline - sin posición reciente o ignición apagada
    const offlineDevices = filteredDevices.value.filter(device => {
      const position = store.getters['devices/getPosition'](device.id);
      if (!position) return true; // Sin posición = offline
      
      // Sin actualización en las últimas 24 horas
      const lastUpdate = new Date(position.deviceTime);
      const hoursAgo = (now - lastUpdate) / (1000 * 60 * 60);
      return hoursAgo > 24 || !position.attributes?.ignition;
    });

    ElMessage({
      message: `Generando PDF profesional con ${offlineDevices.length} dispositivos offline...`,
      type: 'info',
      duration: 3000
    });

    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Colores corporativos
    const primaryColor = [156, 39, 176]; // Púrpura para offline
    const lightGray = [245, 245, 245];
    const darkGray = [80, 80, 80];
    
    // Configuración de página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    
    // Función para agregar encabezado
    const addHeader = (pageNumber, totalPages) => {
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Relatório de Dispositivos Offline', margin, 15);
      
      doc.setFontSize(10);
      const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
      doc.text(`Gerado em: ${dateStr}`, pageWidth - margin, 10, { align: 'right' });
      doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin, 20, { align: 'right' });
    };

    const addFooter = () => {
      doc.setFillColor(...lightGray);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      doc.setTextColor(...darkGray);
      doc.setFontSize(8);
      doc.text('Sistema de Rastreamento Profissional - Relatório de Dispositivos Offline', pageWidth / 2, pageHeight - 5, { align: 'center' });
    };

    // Preparar datos para la tabla
    const tableData = offlineDevices.map(device => {
      const position = store.getters['devices/getPosition'](device.id);
      const lastUpdate = position?.deviceTime ? new Date(position.deviceTime) : null;
      const hoursOffline = lastUpdate ? Math.round((now - lastUpdate) / (1000 * 60 * 60)) : 'N/A';
      
      return [
        device.name || 'N/A',
        device.uniqueId || 'N/A',
        device.attributes?.placa || 'N/A',
        device.attributes?.model || 'N/A',
        device.attributes?.brand || 'N/A',
        device.attributes?.color || 'N/A',
        lastUpdate ? lastUpdate.toLocaleString('pt-BR') : 'Nunca',
        hoursOffline !== 'N/A' ? `${hoursOffline}h` : 'N/A',
        position?.attributes?.ignition === false ? 'Desligado' : 'Sem sinal',
        device.phone || 'N/A'
      ];
    });

    const columns = [
      { header: 'Nome', dataKey: 'name' },
      { header: 'ID Único', dataKey: 'uniqueId' },
      { header: 'Placa', dataKey: 'placa' },
      { header: 'Modelo', dataKey: 'model' },
      { header: 'Marca', dataKey: 'brand' },
      { header: 'Cor', dataKey: 'color' },
      { header: 'Última Comunicação', dataKey: 'lastUpdate' },
      { header: 'Tempo Offline', dataKey: 'offlineTime' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Telefone', dataKey: 'phone' }
    ];

    const calculatePages = () => {
      const rowsPerPage = 15;
      return Math.ceil(tableData.length / rowsPerPage) || 1;
    };

    const totalPages = calculatePages();
    
    // Primeira página
    addHeader(1, totalPages);
    addFooter();

    // Resumo estatístico
    let yPos = 35;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Resumo de Dispositivos Offline', margin, yPos);
    
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const totalDevices = filteredDevices.value.length;
    const offlineCount = offlineDevices.length;
    const offlinePercentage = Math.round(offlineCount/totalDevices*100);
    
    const over24h = offlineDevices.filter(device => {
      const position = store.getters['devices/getPosition'](device.id);
      if (!position) return true;
      const hoursAgo = (now - new Date(position.deviceTime)) / (1000 * 60 * 60);
      return hoursAgo > 24;
    }).length;

    doc.text(`• Total de Dispositivos: ${totalDevices}`, margin, yPos);
    yPos += 6;
    doc.text(`• Dispositivos Offline: ${offlineCount} (${offlinePercentage}%)`, margin, yPos);
    yPos += 6;
    doc.text(`• Sem comunicação há +24h: ${over24h}`, margin, yPos);
    yPos += 6;
    doc.text(`• Necessitam atenção imediata: ${Math.ceil(offlineCount * 0.3)}`, margin, yPos);
    
    yPos += 15;

    // Tabela
    doc.autoTable({
      head: [columns.map(col => col.header)],
      body: tableData,
      startY: yPos,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [250, 240, 240] // Ligero tinte rojizo para offline
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Nome
        1: { cellWidth: 25 }, // ID Único
        2: { cellWidth: 20 }, // Placa
        3: { cellWidth: 25 }, // Modelo
        4: { cellWidth: 20 }, // Marca
        5: { cellWidth: 15 }, // Cor
        6: { cellWidth: 40 }, // Última Comunicação
        7: { cellWidth: 20 }, // Tempo Offline
        8: { cellWidth: 25 }, // Status
        9: { cellWidth: 25 }  // Telefone
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          addHeader(data.pageNumber, totalPages);
        }
        addFooter();
      }
    });

    // Salvar PDF
    const fileName = `dispositivos_offline_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(fileName);

    ElMessage({
      message: 'PDF de dispositivos offline gerado com sucesso!',
      type: 'success',
      duration: 3000
    });

  } catch (error) {
    console.error('Erro ao gerar PDF offline:', error);
    ElMessage.error('Erro ao gerar PDF offline');
  }
};

const generateOfflineExcel = () => {
  const columns = ["IMEI", "Placa", "Nombre", "Teléfono", "Operador", "ICCID", "Última Actualización", "Diferencia (Horas)"];
  const now = new Date();

  // Filtrar dispositivos fuera de línea en las últimas 24 horas
  const offlineDevices = store.getters['devices/getOrderedDevices'].filter(deviceId => {
    const device = store.getters['devices/getDevice'](deviceId);
    const lastUpdate = new Date(device.lastUpdate);
    return (now - lastUpdate) > (24 * 60 * 60 * 1000); // Últimas 24 horas
  });

  // Crear un array de datos para la tabla
  const rows = offlineDevices.map(deviceId => {
    const device = store.getters['devices/getDevice'](deviceId);
    const deviceName = device.name.length > 30 ? device.name.substring(0, 27) + '...' : device.name;

    const lastUpdate = new Date(device.lastUpdate);
    const hoursDiff = Math.floor((now - lastUpdate) / (1000 * 60 * 60));

    return [
      device.uniqueId || '-',
      device.attributes?.placa || '-',
      deviceName,
      device.phone || '-',
      device.attributes?.operator || '-',
      device.attributes?.iccid || '-',
      lastUpdate, // Mantener la fecha como objeto Date
      hoursDiff // Diferencia en horas
    ];
  });

  // Crear una nueva hoja de trabajo
  const ws = XLSX.utils.aoa_to_sheet([columns, ...rows.map(row => {
    return [
      row[0],
      row[1],
      row[2],
      row[3],
      row[4],
      row[5],
      `${row[6].getDate()}/${row[6].getMonth() + 1}/${row[6].getFullYear()} ${row[6].getHours()}:${row[6].getMinutes().toString().padStart(2, '0')}`,
      row[7]
    ];
  })]);

  // Crear un nuevo libro de trabajo
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dispositivos Fuera de Línea");

  // Establecer opciones para la descarga
  XLSX.writeFile(wb, "reporte_dispositivos_fuera_de_linea.xlsx");
};

const generateOfflineJSON = () => {
  const now = new Date();
  const offlineDevices = store.getters['devices/getOrderedDevices'].filter(deviceId => {
    const device = store.getters['devices/getDevice'](deviceId);
    const lastUpdate = new Date(device.lastUpdate);
    return (now - lastUpdate) > (24 * 60 * 60 * 1000); // Últimas 24 horas
  });

  const jsonData = offlineDevices.map(deviceId => {
    const device = store.getters['devices/getDevice'](deviceId);
    return {
      uniqueId: device.uniqueId || '-',
      placa: device.attributes?.placa || '-',
      nombre: device.name || '-',
      telefono: device.phone || '-',
      operador: device.attributes?.operator || '-',
      iccid: device.attributes?.iccid || '-',
      ultimaActualizacion: device.lastUpdate,
      diferenciaHoras: Math.floor((now - new Date(device.lastUpdate)) / (1000 * 60 * 60))
    };
  });

  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reporte_dispositivos_fuera_de_linea.json';
  a.click();
  URL.revokeObjectURL(url); // Limpiar el objeto URL
};







// Función para filtrar dispositivos por última hora
const filterLastHour = () => {
  // Establecer flag para indicar que es un filtro por botón
  isButtonFilter.value = true;
  
  const now = new Date();
  const filtered = store.getters['devices/getOrderedDevices'].filter(deviceId => {
    const device = store.getters['devices/getDevice'](deviceId);
    if (!device || !device.lastUpdate) return false;
    
    const lastUpdate = new Date(device.lastUpdate);
    return (now - lastUpdate) <= (60 * 60 * 1000); // Última hora
  });

  // Actualizar filteredDevices con la nueva lista
  filteredDevices.value = filtered.map(id => {
    const device = store.getters['devices/getDevice'](id);
    if (device && device.icon && device.icon[0] && typeof device.icon[0].addToMap === 'function') {
      device.icon[0].addToMap();
    }
    return device;
  }).filter(Boolean); // Eliminar valores nulos
  
  // Notificar al usuario
  ElMessage({
    message: `${filteredDevices.value.length} dispositivos actualizados en la última hora`,
    type: 'success',
    duration: 3000
  });
  
  // Forzar actualización de la vista
  setTimeout(() => {
    const scrollContainer = document.querySelector('.devices-scroll-container');
    if (scrollContainer) {
      realScroll({ target: scrollContainer, stopPropagation: () => {} });
    }
  }, 50);
  
  // Cerrar el modal después de filtrar
  closeModal();
};

const isShowModal = ref(false);

function closeModal() {
  isShowModal.value = false;
}

function handleClose() {
  showImportModal.value = false;
}

////de informes///
function showModal() {
 isShowModal.value = true;
}




/*
const getLastUpdated = (t, tt) => {
  // Si t es null, significa que el valor aún no ha sido establecido.
  if (t === null) {
    return KT('new');
  }

  // Usamos el tiempo actual si tt no está definido.
  tt = tt || new Date();

  // Calculamos la diferencia en segundos entre las dos fechas.
  const diffInSeconds = Math.round((new Date(tt).getTime() - new Date(t).getTime()) / 1000);

  // Si la diferencia es negativa (esto no debería suceder normalmente), devolvemos 'ahora'
  if (diffInSeconds < 0) {
    return KT('now');
  }

  // Si la diferencia es mayor a un día (86400 segundos)
  if (diffInSeconds >= 86400) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${KT('days')}`;
  }

  // Si la diferencia es mayor a una hora (3600 segundos)
  if (diffInSeconds >= 3600) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${KT('hours')}`;
  }

  // Si la diferencia es mayor a un minuto (60 segundos)
  if (diffInSeconds >= 60) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${KT('minutes')}`;
  }

  // Si la diferencia es menor a un minuto, devolvemos el texto para menos de un minuto
  return KT('lessMinute');
};*/

const editDeviceRef = inject('edit-device');
const openEdit = (id = false)=>{
  editDeviceRef.value.editDevice(id?id:device.value.Id);
}

// Função para calcular a altura foi removida pois voltamos ao layout original
watch(()=> route.query.edit,(a)=>{
  if(a){
    openEdit();
  }
})






const handleDeviceClick = (device) => {
  // Mostrar los detalles del dispositivo


  // Hacer zoom en el dispositivo
  flyToDevice(device);
};


const flyToDevice = inject('flyToDevice');





const devices = ref([]);

// Función para abrir modal de importación
const openImportModal = () => {
  console.log('openImportModal llamada');
  resetImportState();
  showImportModal.value = true;
  console.log('showImportModal.value:', showImportModal.value);
};

// Función para descargar plantilla Excel
const downloadTemplate = () => {
  // Crear datos de ejemplo con TODOS los campos posibles
  const templateData = [
    {
      // Campos básicos del dispositivo
      name: 'Ejemplo Dispositivo 1',
      uniqueId: '123456789012345',
      imei: '123456789012345',
      groupId: '',
      contact: '5511999999999',
      disabled: false,
      
      // Campos del dispositivo (GPS/Hardware)
      'device.model': 'GPS Tracker GT06N',
      'device.brand': 'Concox',
      'device.technology': '2G',
      'device.protocol': 'gt06',
      'device.state': 'installed',
      
      // Campos del SIM/Conectividad
      phone: '5511999999999',
      iccid: '89550000000000000001',
      operator: 'Vivo',
      broker: 'M2M Solutions',
      APN: 'zap.vivo.com.br',
      ValoMensual: '15.00',
      dataSimAct: '2024-01-15',
      dataSimVal: '2024-02-15',
      
      // Campos del usuario/contacto
      'tarkan.name': 'João Silva',
      'tarkan.email': 'joao@email.com',
      'tarkan.cep': '01234-567',
      'tarkan.rua': 'Rua das Flores',
      'tarkan.numero': '123',
      'tarkan.complemento': 'Apt 45',
      'tarkan.bairro': 'Centro',
      'tarkan.cidade': 'São Paulo',
      'tarkan.estado': 'SP',
      
      // Campos del vehículo (pestaña Details)
      model: 'Corolla', // Modelo del vehículo
      brand: 'Toyota', // Marca del vehículo
      color: 'Branco', // Color del vehículo
      motor: '1.8 16V', // Motor
      date: '2020', // Año
      vin: '9BR53ZEC4B8123456', // VIN
      chassis: '9BR53ZEC4B8123456', // Chassis
      placa: 'ABC-1234', // Placa
      
      // Consumo y combustible
      litersx100km: '8.5', // Litros por 100km
      fuelPrice: '5.50', // Precio combustible
      fuelTank: '50', // Tanque de combustible
      
      // Categoría/Icono del dispositivo
      category: 'car', // Icono/categoría del vehículo
      
      // Campos de instalación
      'instalation.empresa': 'GPS Tech Solutions',
      'instalation.instalador': 'Carlos Santos',
      'instalation.phone': '5511999999999',
      'instalation.email': 'instalador@gpstech.com',
      'instalation.data': '2024-01-15',
      'instalation.observation': 'Instalação realizada com sucesso no painel do veículo',
      
      // Observaciones generales
      observation: 'Cliente solicitou instalação discreta. Configuração padrão aplicada.',
      
      // Campo de comando
      commandId: ''
    },
    {
      // Segundo ejemplo con valores diferentes
      name: 'Ejemplo Dispositivo 2',
      uniqueId: '987654321098765',
      imei: '987654321098765',
      groupId: '',
      contact: '5511888888888',
      disabled: false,
      
      'device.model': 'TK103B',
      'device.brand': 'Coban',
      'device.technology': '2G',
      'device.protocol': 'tk103',
      'device.state': 'in_stock',
      
      phone: '5511888888888',
      iccid: '89550000000000000002',
      operator: 'Claro',
      broker: 'IoT Connect',
      APN: 'claro.com.br',
      ValoMensual: '12.50',
      dataSimAct: '2024-01-20',
      dataSimVal: '2024-02-20',
      
      'tarkan.name': 'Maria Santos',
      'tarkan.email': 'maria@email.com',
      'tarkan.cep': '98765-432',
      'tarkan.rua': 'Av. Paulista',
      'tarkan.numero': '456',
      'tarkan.complemento': 'Sala 12',
      'tarkan.bairro': 'Bela Vista',
      'tarkan.cidade': 'São Paulo',
      'tarkan.estado': 'SP',
      
      model: 'Civic',
      brand: 'Honda',
      color: 'Preto',
      motor: '2.0 16V',
      date: '2021',
      vin: '9BR53ZEC4B8654321',
      chassis: '9BR53ZEC4B8654321',
      placa: 'XYZ-9876',
      
      litersx100km: '9.2',
      fuelPrice: '5.80',
      fuelTank: '47',
      
      category: 'car',
      
      'instalation.empresa': 'Auto Track Brasil',
      'instalation.instalador': 'Pedro Lima',
      'instalation.phone': '5511888888888',
      'instalation.email': 'pedro@autotrack.com',
      'instalation.data': '2024-01-20',
      'instalation.observation': 'Instalação especial no porta-luvas conforme solicitado pelo cliente',
      
      observation: 'Cliente preferiu instalação no porta-luvas para fácil acesso. Configuração personalizada.',
      
      commandId: ''
    }
  ];

  // Crear workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);
  
  // Ajustar ancho de columnas
  const colWidths = [
    { wch: 20 }, // name
    { wch: 15 }, // uniqueId
    { wch: 15 }, // imei
    { wch: 10 }, // groupId
    { wch: 15 }, // contact
    { wch: 15 }, // phone
    { wch: 15 }, // device.model
    { wch: 12 }, // device.brand
    { wch: 12 }, // device.technology
    { wch: 12 }, // device.protocol
    { wch: 12 }, // device.state
    { wch: 20 }, // iccid
    { wch: 12 }, // operator
    { wch: 15 }, // broker
    { wch: 15 }, // APN
    { wch: 12 }, // ValoMensual
    { wch: 12 }, // dataSimAct
    { wch: 12 }, // dataSimVal
    { wch: 20 }, // tarkan.name
    { wch: 25 }, // tarkan.email
    { wch: 12 }, // tarkan.cep
    { wch: 10 }, // commandId
    { wch: 10 }  // disabled
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Dispositivos');
  
  // Descargar archivo
  const fileName = 'plantilla_importacion_dispositivos.xlsx';
  XLSX.writeFile(wb, fileName);
  
  console.log('Plantilla Excel descargada:', fileName);
};

// Resetear estado de importación
const resetImportState = () => {
  importStep.value = 1;
  fileName.value = '';
  previewData.value = [];
  headers.value = [];
  processedCount.value = 0;
  totalToProcess.value = 0;
  successCount.value = 0;
  errorCount.value = 0;
  errorLog.value = [];
};

// Manejar selección de archivo
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    processFile(file);
  }
};

// Manejar drop de archivo
const handleDrop = (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) {
    processFile(file);
  }
};

// Procesar archivo Excel
const processFile = (file) => {
  fileName.value = file.name;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        ElMessage.error('El archivo está vacío o no tiene datos válidos');
        return;
      }
      
      headers.value = Object.keys(jsonData[0]);
      previewData.value = jsonData;
      importStep.value = 2;
      
    } catch (error) {
      console.error('Error procesando archivo:', error);
      ElMessage.error('Error al procesar el archivo. Verifica que sea un archivo Excel válido.');
    }
  };
  
  reader.readAsArrayBuffer(file);
};

// Función auxiliar para calcular dispositivos restantes
const getRemainingDeviceLimit = (currentCount) => {
  const userLimit = store.state.auth.deviceLimit;
  const serverLimit = parseInt(store.getters['server/getAttribute']('tarkan.deviceLimit') || -1);
  const allowedLimit = parseInt(store.state.server.allowedLimit);
  
  // Admin no tiene límites de usuario, solo del servidor
  if (store.state.auth.administrator) {
    // Verificar límite del servidor desde headers
    if (store.state.server.allowedLimit !== false && allowedLimit <= currentCount) {
      return 0;
    }
    // Verificar límite configurado del servidor
    if (serverLimit > 0) {
      return Math.max(0, serverLimit - currentCount);
    }
    return -1; // Sin límite
  }
  
  // Usuario normal: verificar límites del usuario
  if (userLimit > -1) {
    return Math.max(0, userLimit - currentCount);
  }
  
  return -1; // Sin límite
};

// Iniciar importación
const startImport = async () => {
  importStep.value = 3;
  totalToProcess.value = previewData.value.length;
  processedCount.value = 0;
  successCount.value = 0;
  errorCount.value = 0;
  errorLog.value = [];
  
  // Verificar límites antes de iniciar la importación
  const currentDeviceCount = Object.keys(store.state.devices.deviceList).length;
  const remainingDevices = getRemainingDeviceLimit(currentDeviceCount);
  
  if (remainingDevices !== -1 && previewData.value.length > remainingDevices) {
    ElNotification({
      title: KT('device.error'),
      message: `${KT('device.importLimitExceeded')}: ${remainingDevices} ${KT('device.devicesRemaining')}`,
      type: 'error',
      duration: 5000
    });
    
    errorLog.value.push({
      row: 0,
      type: 'limit_error',
      message: `Límite excedido: Solo puedes importar ${remainingDevices} dispositivos más`,
      details: {
        currentDevices: currentDeviceCount,
        toImport: previewData.value.length,
        remaining: remainingDevices
      }
    });
    
    importStep.value = 4;
    return;
  }
  
  for (let i = 0; i < previewData.value.length; i++) {
    // Verificar límite en cada iteración por si se actualiza dinámicamente
    if (!store.getters['checkDeviceLimit']) {
      errorCount.value++;
      errorLog.value.push({
        row: i + 1,
        type: 'limit_error',
        uniqueId: previewData.value[i].uniqueId || 'N/A',
        name: previewData.value[i].name || 'N/A',
        message: KT('device.deviceLimitReached'),
        details: { reason: 'Límite de dispositivos alcanzado durante la importación' }
      });
      processedCount.value++;
      continue;
    }
    const row = previewData.value[i];
    
    try {
      // Validaciones básicas - mapear IMEI como uniqueId
      const uniqueId = row.uniqueId || row.UniqueId || row.UNIQUEID || 
                      row.imei || row.IMEI || row.Imei ||
                      row.serial || row.Serial || row.SERIAL;
      const name = row.name || row.Name || row.NAME || row.nome;
      
      if (!uniqueId || uniqueId.toString().trim() === '') {
        throw new Error(`Fila ${i + 1}: uniqueId/imei es requerido`);
      }
      
      if (!name || name.toString().trim() === '') {
        throw new Error(`Fila ${i + 1}: name es requerido`);
      }
      
      // Crear objeto de dispositivo compatible con la API de Traccar
      const deviceData = {
        uniqueId: uniqueId.toString().trim(),
        name: name.toString().trim(),
        groupId: parseInt(row.groupId || row.GroupId || row.GROUPID) || 0,
        disabled: false,
        attributes: {}
      };
      
      // Mapear atributos
      Object.keys(row).forEach(key => {
        if (key.startsWith('device.') || key.startsWith('tarkan.') || key.startsWith('instalation.') ||
            ['iccid', 'phone', 'broker', 'operator', 'APN', 'model', 'brand', 'color', 'placa', 'chassis', 'vin',
             'motor', 'date', 'litersx100km', 'fuelPrice', 'fuelTank', 'observation', 'category',
             'ValoMensual', 'dataSimAct', 'dataSimVal'].includes(key)) {
          if (row[key] && row[key].toString().trim() !== '') {
            deviceData.attributes[key] = row[key].toString().trim();
          }
        }
      });
      
      // Mapear contact directamente al campo contact del dispositivo
      if (row.contact || row.contato) {
        deviceData.contact = (row.contact || row.contato).toString().trim();
      }
      
      // Mapear category directamente al campo category del dispositivo
      if (row.category) {
        deviceData.category = row.category.toString().trim();
      }
      
      console.log(`Importando dispositivo ${i + 1}:`, deviceData);
      
      // Guardar dispositivo usando el store
      await store.dispatch('devices/save', deviceData);
      successCount.value++;
      
      errorLog.value.push({
        row: i + 1,
        type: 'success',
        uniqueId: deviceData.uniqueId,
        name: deviceData.name,
        message: 'Importado correctamente'
      });
      
    } catch (error) {
      console.error(`Error importando dispositivo fila ${i + 1}:`, error);
      errorCount.value++;
      
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      const errorDetails = error.response?.data || {};
      
      errorLog.value.push({
        row: i + 1,
        type: 'error',
        uniqueId: row.uniqueId || row.UniqueId || row.UNIQUEID || 
                 row.imei || row.IMEI || row.Imei ||
                 row.serial || row.Serial || row.SERIAL || 'N/A',
        name: row.name || row.Name || row.NAME || row.nome || 'N/A',
        message: errorMessage,
        details: errorDetails,
        data: row
      });
    }
    
    processedCount.value++;
    
    // Pequeña pausa para permitir que la UI se actualice
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  ElMessage.success(`Importación completada. ${successCount.value} dispositivos importados correctamente.`);
  
  // Avanzar al paso 4 de resultado
  importStep.value = 4;
  
  // Recargar lista de dispositivos
  store.dispatch('devices/fetch');
};

// Funciones para el resultado final
const getResultTitle = () => {
  if (successCount.value === processedCount.value) {
    return 'Importação bem-sucedida!';
  } else if (successCount.value > 0) {
    return 'Importação parcialmente bem-sucedida';
  } else {
    return 'Erro na importação';
  }
};

const getResultSubtitle = () => {
  return `${successCount.value} de ${processedCount.value} dispositivos importados corretamente`;
};

// Cerrar importación
const closeImport = () => {
  resetImportState();
  showImportModal.value = false;
};

// Función que maneja el evento de carga exitosa de una imagen


// Función que maneja el evento de error al cargar la imagen

// Lógica para cargar las imágenes de los dispositivos

</script>

<style scoped>
/* Modal de importación profesional */
:deep(.import-modal) {
  --el-dialog-border-radius: 0;
  --el-dialog-box-shadow: none;
  --el-dialog-margin-top: 5vh;
}

:deep(.import-modal .el-dialog) {
  margin: 0 !important;
  border-radius: 0 !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid #e4e7ed;
}

:deep(.import-modal .el-dialog__header) {
  padding: 0 !important;
  margin: 0 !important;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.import-modal .el-dialog__body) {
  padding: 0 !important;
  margin: 0 !important;
}

:deep(.import-modal .el-dialog__footer) {
  padding: 0 !important;
  margin: 0 !important;
  border-top: 1px solid #e4e7ed;
}

.import-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #fafbfc;
  border-bottom: 1px solid #e4e7ed;
}

.import-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.import-modal-title i {
  color: #409eff;
  font-size: 20px;
}

.import-modal-close {
  color: #6b7280 !important;
  font-size: 18px !important;
  padding: 8px !important;
  min-height: auto !important;
  border-radius: 4px;
  transition: all 0.2s;
}

.import-modal-close:hover {
  background: #f3f4f6 !important;
  color: #374151 !important;
}

.import-content {
  padding: 24px;
}

/* Pasos del modal */
.step-indicator {
  margin-bottom: 24px;
}

.step-indicator .el-steps {
  margin-bottom: 20px;
}

/* Sección de archivo */
.file-section {
  background: #f8f9fa;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.file-section:hover {
  border-color: #409eff;
  background: #f0f8ff;
}

.file-section.dragover {
  border-color: #409eff;
  background: #e6f4ff;
}

/* Botones del modal */
.modal-footer {
  padding: 16px 24px;
  background: #fafbfc;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-footer .el-button {
  padding: 10px 20px;
  font-weight: 500;
}

/* Tabla de vista previa */
.preview-table {
  margin: 20px 0;
}

.preview-table .el-table {
  border-radius: 8px;
  overflow: hidden;
}

/* Log de errores */
.error-log {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.error-log h4 {
  color: #dc2626;
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
}

.error-item {
  background: white;
  border: 1px solid #fed7d7;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
}

.error-item:last-child {
  margin-bottom: 0;
}

.error-item.success {
  background: #f0f9ff;
  border-color: #bae6fd;
}

.error-item.success .error-type {
  color: #0369a1;
}

.error-type {
  font-weight: 600;
  color: #dc2626;
  font-size: 12px;
  text-transform: uppercase;
}

.error-message {
  color: #374151;
  font-size: 13px;
  margin-top: 4px;
}

/* Barra de progreso */
.progress-section {
  margin: 20px 0;
}

.progress-section .el-progress {
  margin: 10px 0;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 14px;
  color: #6b7280;
}

.header-container {
  padding: 8px; /* Reducido padding general */
  padding-top: 15px; /* Reducido a 15px - estaba en 30px */
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px; /* Reducido margen inferior */
  margin-top: 5px; /* Reducido a 5px - estaba en 20px */
}

.search-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px; /* Reducido espacio entre elementos */
  height: 30px; /* Altura fija reducida */
  flex-wrap: nowrap; /* Cambiado a nowrap para mantener los elementos en línea */
width: 100%;
}

.search-input {
  flex: 0.8; /* Cambiado para que ocupe 80% del espacio */
  --el-input-border-radius: 8px;
  font-size: 12px;
  overflow: hidden;
}

/* Estilo para el botón de filtro en la barra de búsqueda */
.filter-toggle-button {
  padding: 0;
  margin-right: 5px;
  position: relative;
  color: #909399;
  transition: all 0.2s ease;
}

.filter-toggle-button.active {
  color: var(--el-color-primary);
  transform: scale(1.1); /* Ligero aumento de tamaño */
  text-shadow: 0 0 5px rgba(64, 158, 255, 0.3); /* Brillo alrededor del icono */
}

.filter-toggle-button:hover {
  color: var(--el-color-primary);
}

/* Estilo para el badge de filtros activos */
.filter-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background-color: #F56C6C;
  color: white;
  border-radius: 10px; /* Cambiado de 50% a 10px para permitir números más grandes */
  min-width: 16px; /* Ahora es mínimo (para que se expanda con números grandes) */
  height: 16px;
  font-size: 9px; /* Reducido de 10px */
  padding: 1px 5px; /* Más padding horizontal y vertical */
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-sizing: border-box; /* Asegura que el padding no afecte el tamaño total */
  box-shadow: 0 1px 2px rgba(0,0,0,0.2); /* Sombra sutil */
  animation: pulseBadge 2s infinite; /* Animación para destacar */
}

@keyframes pulseBadge {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Animación mejorada para el placeholder de la barra de búsqueda con compatibilidad en Safari */
.search-input :deep(input::placeholder) {
  animation: fade-in-out 6s ease-in-out infinite;
  white-space: nowrap;
  overflow: hidden;
  display: block;
  opacity: 0.9;
  width: 100%;
  position: relative;
}

/* Animación de fade en lugar de text-indent para mejor compatibilidad con Safari */
@keyframes fade-in-out {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.actions-group {
  display: flex;
  gap: 5px; /* Reducido espacio entre botones */
  flex: 0.2; /* Cambiado para que ocupe 20% del espacio */
  justify-content: flex-end;
}

.action-button {
  height: 26px; /* Reducido a la mitad aproximadamente */
  width: 26px; /* Reducido a la mitad aproximadamente */
  border-radius: 4px; /* Bordes más pequeños */
  padding: 0 !important; /* Sin padding */
  min-height: 26px !important; /* Forzar altura mínima */
}

.action-button :deep(i) {
  font-size: 12px; /* Iconos más pequeños */
}

.device-container {
  border: silver 2px solid;
  border-radius: 8px;
  margin-top: 5px; /* Reducido a 5px - estaba en 10px */
  margin-bottom: 10px; /* REDUCIDO */
  height: calc(75vh);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  background-color: white;
  overflow: hidden; /* Impide que el contenido desborde */
  display: flex;
  flex-direction: column;
  will-change: transform; /* Optimiza rendimiento */
}

/* Nuevo: Contador de dispositivos */
.devices-count {
  position: absolute;
  top: -20px; /* Ajustado a -20px - estaba en -25px */
  right: 10px;
  font-size: 12px;
  background-color: #f0f0f0;
  padding: 3px 10px;
  border-radius: 12px;
  color: #666;
  font-weight: bold;
  z-index: 10;
}

/* Contador de filtros */
.filter-counter {
  position: absolute;
  top: -20px; /* Ajustado a -20px - estaba en -25px */
  left: 10px;
  font-size: 12px;
  background-color: #f0f7ff;
  padding: 3px 10px;
  border-radius: 12px;
  color: var(--el-color-primary);
  font-weight: bold;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 5px;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Burbuja del contador de filtros */
.filter-bubble {
  background-color: var(--el-color-primary);
  color: white;
  font-size: 11px;
  font-weight: bold;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  animation: pulseBubble 2s infinite;
}

@keyframes pulseBubble {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.deviceHead {
  padding: 10px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0; /* Impede que o cabeçalho encolha */
  margin-top: 5px; /* Reducido a 5px - estaba en 10px */
}

.devices-scroll-container {
  overflow-y: auto; /* Cambiado de scroll a auto para mejor comportamiento */
  height: auto; /* Altura automática */
  flex-grow: 1; /* Hace que el contenedor crezca para llenar el espacio restante */
  padding: 10px;
  position: relative; /* Para posicionamiento adecuado */
  background-color: #ffffff; /* Fondo blanco para evitar transparencias */
  overscroll-behavior: contain; /* Evita comportamientos extraños al hacer scroll */
  -webkit-overflow-scrolling: touch; /* Scroll suave en iOS */
}

.device-group {
  margin-bottom: 15px;
}

.group-header {
  background: #f7f7f7;
  padding: 8px 12px; /* REDUCIDO */
  cursor: pointer;
  font-size: 14px;
  border-radius: 6px;
  margin-bottom: 8px; /* REDUCIDO */
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-count {
  background: #e0e0e0;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
  color: #666;
  margin-left: auto;
}

.group-devices {
  display: flex;
  flex-direction: column;
  gap: 10px; /* REDUCIDO para más compacto */
}

.actions-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

.reports-button-top {
  background-color: #409EFF;
  color: white;
}

/* Estilos existentes modificados */
.icons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.icons div {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  border-right: var(--el-border-color-light) 1px dotted;
  font-size: 12px;
  padding: 0 8px;
}

.icons div i {
  font-size: 16px;
  margin-right: 5px;
}

.icons div:first-child {
  border-right: none;
}

.icons div span {
  display: flex;
  padding: 4px;
  padding-left: 5px;
}

.subtitle {
  margin-top: 20px;
  font-weight: bold;
  font-size: 16px;
  text-transform: uppercase;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
}

.subtitle i {
  font-size: 14px;
  margin-right: 8px;
}

.isDisabled {
  opacity: 0.4;
}

.button-container {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.modal-container {
  position: fixed;
  z-index: 999;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background-color: white;
  border-radius: 12px;
  width: 350px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.modal-header {
  border-bottom: 1px solid #e5e7eb;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 30px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

.decline-button {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.decline-button:hover {
  background-color: #f5f5f5;
}

.accept-button {
  background-color: #38a169;
  color: white;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 500;
  border: none;
}

.custom-button {
  background-color: #409EFF;
  color: white;
  border: none;
  font-size: 14px;
  border-radius: 6px;
  padding: 12px 15px;
  width: 240px;
  margin-bottom: 5px;
  transition: background-color 0.3s;
  text-align: center;
}

.custom-button:hover {
  background-color: #337ecc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.device-list {
  width: 100%;
  min-height: 100%;
  overflow: visible;
  position: relative;
  padding-bottom: 20px; /* Añadir espacio inferior para evitar cortes */
  will-change: transform; /* Optimiza rendimiento de renderizado */
}

.devices-scroll-container {
  overflow-y: auto;
  height: calc(75vh); 
  flex-grow: 1;
  padding: 10px;
  position: relative;
  background-color: #ffffff;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.group-devices {
  margin-bottom: 15px;
}

.device {
  transition: transform 0.2s, box-shadow 0.3s;
  margin-bottom: 10px; /* REDUCIDO a 10px */
  overflow: hidden;
  max-width: 100%;
  display: block;
  min-height: 145px; /* REDUCIDO a 145px */
  height: 145px; /* REDUCIDO a 145px */
  background-color: #ffffff;
  border-radius: 8px;
  backface-visibility: hidden;
  will-change: transform, opacity;
  position: relative;
}

.device:hover {
  background: var(--el-color-primary-light-8);
  background-color: #f8f8f8;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.device.isDisabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.device .el-tooltip {
  position: absolute;
  top: 10px;
  right: 10px;
}

.sorting-buttons-container {
  display: flex;
  justify-content: space-between;
  background-color: #f5f5f5;
  padding: 6px 8px; /* Reducido padding */
  border-radius: 6px; /* Bordes más pequeños */
  gap: 5px; /* Menor espacio entre botones */
  margin-bottom: 8px; /* Reducido margen */
  height: 25px; /* Altura fija reducida */
  align-items: center; /* Centrar verticalmente */
}

.sorting-button {
  background-color: #e8e8e8;
  color: #333;
  font-weight: 500;
  padding: 2px 6px; /* Reducido padding */
  font-size: 9px; /* Letra más pequeña */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px; /* Bordes más pequeños */
  cursor: pointer;
  flex-grow: 1;
  transition: background-color 0.2s, transform 0.1s;
  text-align: center;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
  white-space: nowrap; /* Evitar salto de línea */
  overflow: hidden; /* Ocultar exceso */
  text-overflow: ellipsis; /* Mostrar elipsis */
  height: 18px; /* Altura fija reducida */
  line-height: 1; /* Línea ajustada */
}

.sorting-button:hover {
  background-color: #d0d0d0;
  transform: translateY(-1px);
}

.sorting-button i {
  margin-left: 3px; /* Reducido margen */
  font-size: 8px; /* Iconos más pequeños */
}

.loading-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #666;
  font-size: 16px;
  text-align: center;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
/* Estilos para el panel de filtros */
.filters-panel {
  background-color: #f8f9fa;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  margin-top: 5px;
  margin-bottom: 8px;
  padding: 6px 8px; /* Reducido de 8px 10px */
  transition: all 0.3s ease;
  animation: fadeIn 0.3s ease;
  max-width: 100%;
}

.filters-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px; /* Reducido de 8px */
  padding-bottom: 4px; /* Reducido de 5px */
  border-bottom: 1px solid #eaeaea;
}

.filters-panel-header h4 {
  margin: 0;
  font-size: 12px; /* Reducido de 13px */
  font-weight: 600;
  color: #333;
}

.clear-all-btn {
  font-size: 10px; /* Reducido de 11px */
  color: #F56C6C;
  padding: 0;
  height: auto;
}

.clear-all-btn:hover {
  opacity: 0.8;
}

/* Filas de filtros */
.filters-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 6px; /* Reducido de 8px */
}

/* Primera fila con fondo estético y profesional */
.primary-row {
  background: linear-gradient(to right, #e8f3ff, #ecf8ff);
  border-radius: 5px;
  padding: 5px 6px; /* Reducido de 6px 8px */
  border: 1px solid #d8ebff;
  margin-bottom: 5px; /* Añadido para separación */
  position: relative; /* Para sombra interior */
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.03); /* Sombra interior sutil */
}

/* Segunda fila con las tres categorías */
.secondary-row {
  display: flex;
  justify-content: space-between;
  gap: 6px; /* Reducido de 8px */
}

/* Contenedor para cada sección en la segunda fila */
.section-wrapper {
  flex: 1;
  background-color: #f5f8fa;
  border-radius: 4px; /* Reducido de 5px */
  padding: 4px; /* Reducido de 5px */
  border: 1px solid #edf2f7;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02); /* Sombra sutil */
}

/* Etiquetas de categoría */
.category-label {
  font-size: 10px; /* Reducido de 11px */
  font-weight: 600;
  color: #409EFF;
  margin-right: 8px; /* Reducido de 10px */
  display: flex;
  align-items: center;
  min-width: 45px; /* Reducido de 50px */
}

.category-label.small {
  font-size: 9px; /* Reducido de 10px */
  margin-bottom: 2px; /* Reducido de 3px */
  display: block;
  text-align: center;
  margin-right: 0;
  color: #606266;
}

/* Grupos de filtros */
.filters-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px; /* Reducido de 5px */
  justify-content: center;
}

/* Estilos específicos para los grupos */
.state-filters {
  flex: 1;
}

.connectivity-filters, 
.advanced-filters, 
.gps-filters {
  justify-content: center;
}

/* Estilo base para todos los botones de filtro */
.filter-icon {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  background-color: #f5f5f5;
  margin: 0;
  position: relative;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.filter-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
}

/* Tamaños de filtros por categoría */
.filter-icon.large {
  width: 24px; /* Reducido de 26px */
  height: 24px; /* Reducido de 26px */
  font-size: 11px; /* Reducido de 12px */
}

.filter-icon.medium {
  width: 20px; /* Reducido de 22px */
  height: 20px; /* Reducido de 22px */
  font-size: 9px; /* Reducido de 10px */
}

.filter-icon.small {
  width: 16px; /* Reducido de 18px */
  height: 16px; /* Reducido de 18px */
  font-size: 8px; /* Reducido de 9px */
}

/* Colores para la primera categoría de filtros */
.filter-icon.installed {
  color: #67c23a;
}

.filter-icon.in-service {
  color: #409eff;
}

.filter-icon.in-stock {
  color: #909399;
}

.filter-icon.with-failures {
  color: #f56c6c;
}

.filter-icon.company {
  color: #e6a23c;
}

.filter-icon.all {
  color: #606266;
}

.filter-icon.withdrawn {
  color: #3F51B5; /* Cambiado de naranja a azul indigo */
}

/* Colores para la segunda categoría */
.filter-icon.motion {
  color: #2196F3;
}

.filter-icon.stopped {
  color: #FF9800; /* Orange for stopped */
}

.filter-icon.online {
  color: #4CAF50;
}

.filter-icon.unknown {
  color: #9E9E9E;
}

.filter-icon.offline {
  color: #F44336;
}

/* Estilo para la segunda categoría de filtros */
.secondary-filters {
  margin-top: 5px; /* Reducido espacio vertical */
  border-top: 1px solid #f0f0f0;
  padding-top: 5px; /* Reducido espacio vertical */
}

/* Estilo para indicar filtro activo */
.filter-icon.active {
  border-color: currentColor;
  background-color: rgba(255,255,255,0.9);
}

.third-filters, .fourth-filters {
  margin-top: 5px; /* Reducido espacio vertical */
  border-top: 1px solid #f0f0f0;
  padding-top: 5px; /* Reducido espacio vertical */
}

.fourth-filters {
  margin-top: 3px; /* Aún más compacto */
  padding-bottom: 5px; /* Espacio extra en la parte inferior */
  display: flex;
  justify-content: center;
  gap: 8px;
}

.filter-icon.gps-brand,
.filter-icon.gps-model,
.filter-icon.technology {
  font-size: 9px; /* Reducido de 10px */
  width: 18px; /* Reducido de 22px */
  height: 18px; /* Reducido de 22px */
}

.filter-icon.gps-brand i,
.filter-icon.gps-model i, 
.filter-icon.technology i {
  color: #2196F3; /* Azul para dispositivos GPS */
}

.filter-icon.gps-filters-toggle {
  background-color: #e3f2fd; /* Fondo azul claro */
  transition: all 0.3s;
}

.filter-icon.gps-filters-toggle i {
  color: #1976D2; /* Azul más oscuro para el icono */
}

.filter-icon.gps-filters-toggle.active {
  background-color: #bbdefb; /* Fondo azul más intenso cuando activo */
  transform: scale(1.1);
}

/* Estilos para los botones de filtros de GPS */
.filter-icon-button {
  height: 22px;
  padding: 0 8px;
  font-size: 11px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-icon-button i {
  color: #2196F3; /* Azul para dispositivos GPS */
}

/* Estilos para hacer scrollable los dropdown menus de GPS */
.el-dropdown-menu {
  max-height: 300px !important;
  overflow-y: auto !important;
  scrollbar-width: thin !important;
}

/* Estilos específicos para los dropdowns de marca y modelo */
.el-dropdown-menu.gps-brand-menu,
.el-dropdown-menu.gps-model-menu {
  max-height: 300px !important;
  overflow-y: auto !important;
  padding-right: 5px !important;
}

/* Estilos para el scrollbar en navegadores webkit (Chrome, Safari) */
.el-dropdown-menu::-webkit-scrollbar {
  width: 6px !important;
}

.el-dropdown-menu::-webkit-scrollbar-thumb {
  background-color: #dcdfe6 !important;
  border-radius: 3px !important;
}

.el-dropdown-menu::-webkit-scrollbar-track {
  background-color: #f5f7fa !important;
}

/* Estilos para el modal de importación */
.import-container {
  padding: 20px 0;
}

.file-upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
  background-color: #fafafa;
}

.file-upload-area:hover {
  border-color: #409eff;
  background-color: #f0f8ff;
}

.file-upload-area i {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.file-upload-area p {
  margin: 8px 0;
  color: #606266;
}

.file-info {
  font-size: 12px;
  color: #909399;
}

.preview-table-container {
  max-height: 300px;
  overflow: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin: 16px 0;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
  text-align: left;
  font-size: 14px;
}

.preview-table th {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #606266;
  position: sticky;
  top: 0;
  z-index: 1;
}

.preview-note {
  font-size: 12px;
  color: #909399;
  text-align: center;
  margin-top: 8px;
}

.progress-container {
  margin: 20px 0;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #f5f7fa;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background-color: #409eff;
  transition: width 0.3s ease;
}

.import-stats {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  min-width: 100px;
}

.stat-item.success {
  background-color: #f0f9ff;
  border: 1px solid #67c23a;
}

.stat-item.error {
  background-color: #fef0f0;
  border: 1px solid #f56c6c;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.stat-item.success .stat-value {
  color: #67c23a;
}

.stat-item.error .stat-value {
  color: #f56c6c;
}

/* Estilos para el log de errores */
.error-log {
  margin-top: 20px;
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.error-log h4 {
  margin-bottom: 16px;
  color: #606266;
  font-size: 16px;
}

.log-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.log-item {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.success {
  background-color: #f0f9ff;
  border-left: 4px solid #67c23a;
}

.log-item.error {
  background-color: #fef0f0;
  border-left: 4px solid #f56c6c;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-weight: 600;
}

.log-row {
  color: #909399;
  font-size: 12px;
  min-width: 60px;
}

.log-device {
  flex: 1;
  color: #606266;
  font-size: 14px;
}

.log-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.log-status.success {
  background-color: #67c23a;
  color: white;
}

.log-status.error {
  background-color: #f56c6c;
  color: white;
}

.log-message {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.log-details {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 8px;
  margin-top: 8px;
}

.log-details strong {
  display: block;
  margin-bottom: 4px;
  color: #495057;
  font-size: 12px;
}

.log-details pre {
  background: none;
  border: none;
  margin: 0;
  padding: 0;
  font-size: 11px;
  color: #495057;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Estilos para información de mapeo */
.mapping-info {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.mapping-info h4 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 14px;
}

.mapping-info ul {
  margin: 0;
  padding-left: 20px;
}

.mapping-info li {
  margin-bottom: 8px;
  font-size: 13px;
  color: #6c757d;
}

.mapping-info li strong {
  color: #495057;
}

/* Estilos para el indicador de pasos */
.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 30px 0 40px 0;
  padding: 0 20px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 120px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
  background: #f5f7fa;
  color: #909399;
  border: 2px solid #e4e7ed;
  transition: all 0.3s ease;
}

.step-item.active .step-number {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.step-item.completed .step-number {
  background: #67c23a;
  color: white;
  border-color: #67c23a;
}

.step-item.completed .step-number:before {
  content: "✓";
  font-weight: bold;
}

.step-title {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  max-width: 100px;
  line-height: 1.2;
}

.step-item.active .step-title {
  color: #409eff;
  font-weight: 600;
}

.step-item.completed .step-title {
  color: #67c23a;
  font-weight: 600;
}

.step-line {
  flex: 1;
  height: 2px;
  background: #e4e7ed;
  margin: 0 10px;
  max-width: 80px;
  transition: all 0.3s ease;
}

.step-line.completed {
  background: #67c23a;
}

/* Estilos para el resultado final */
.result-summary {
  text-align: center;
  margin: 30px 0;
  padding: 20px;
}

.result-summary h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.result-summary p {
  color: #909399;
  margin: 0 0 30px 0;
  font-size: 16px;
}

.result-icon {
  margin-bottom: 20px;
}

.result-icon i {
  font-size: 64px;
}

.result-icon i.success {
  color: #67c23a;
}

.result-icon i.error {
  color: #f56c6c;
}

.final-stats {
  display: flex;
  justify-content: space-around;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.stat-box {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.error {
  color: #f56c6c;
}

.error-details {
  margin-top: 30px;
  text-align: left;
}

.error-details h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.error-table {
  width: 100%;
  border-collapse: collapse;
  max-height: 300px;
  overflow-y: auto;
}

.error-table th,
.error-table td {
  border: 1px solid #ebeef5;
  padding: 8px 12px;
  text-align: left;
}

.error-table th {
  background: #f5f7fa;
  font-weight: 600;
  color: #909399;
}

.template-section {
  text-align: center;
  margin-top: 30px;
}

@media (max-width: 768px) {
  .steps-indicator {
    margin: 20px 0 30px 0;
  }
  
  .step-item {
    min-width: 80px;
  }
  
  .step-number {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }
  
  .step-title {
    font-size: 10px;
    max-width: 60px;
  }
  
  .final-stats {
    flex-direction: column;
    gap: 15px;
  }
}
</style>