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
            <div v-if="isPdfAvailable" class="export-menu-divider"></div>
            <div v-if="isPdfAvailable" class="export-menu-item" @click="exportToPdf()">
              <i class="fas fa-file-pdf"></i>
              <span>PDF Executivo</span>
            </div>
          </div>
        </div>
        <el-button class="share-link-btn" size="small" 
          @click="copyShareLink"
          @mouseenter.stop="showTip($event, shareLinkCopied ? 'Link copiado!' : 'Copiar link com filtros')" 
          @mouseleave="hideTip">
          <i :class="shareLinkCopied ? 'fas fa-check' : 'fas fa-link'"></i>
        </el-button>
        <el-button class="add-btn" size="small" type="primary" :disabled="!store.getters['checkDeviceLimit']"
          v-if="store.getters.advancedPermissions(13) && (store.state.auth.deviceLimit === -1 || store.state.auth.deviceLimit > 0)"
          @click="(store.getters['checkDeviceLimit']) ? editDeviceRef.newDevice() : deviceLimitExceded()"
          @mouseenter.stop="showTip($event, KT('device.add'))" @mouseleave="hideTip">
          <i class="fas fa-plus"></i>
        </el-button>
      </div>
    </div>

    <!-- ===== ETAPA 5B: Quick Presets (Favoritos fixados) ===== -->
    <div v-if="favoritesList.length > 0" class="quick-presets-row">
      <div class="quick-preset" v-for="preset in favoritesList" :key="preset.id" 
        @click="applyPreset(preset)"
        @mouseenter.stop="showTip($event, preset.name)" @mouseleave="hideTip">
        <i :class="preset.icon || 'fas fa-bookmark'"></i>
        <span>{{ preset.name }}</span>
        <button class="quick-preset-unfav" @click.stop="toggleFavorite(preset.id)"
          @mouseenter.stop="showTip($event, 'Desfavoritar')" @mouseleave="hideTip">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- ===== ETAPA 6A: KPI Summary Cards ===== -->
    <div class="kpi-cards-row">
      <div class="kpi-card" :class="{ active: connectivityFilter === 'online' }" 
        @click="toggleConnectivityFilter('online')"
        @mouseenter.stop="showTip($event, 'Filtrar por Online')" @mouseleave="hideTip">
        <i class="fas fa-check-circle kpi-icon online"></i>
        <div class="kpi-content">
          <div class="kpi-value">{{ onlineCount }}</div>
          <div class="kpi-label">Online</div>
        </div>
      </div>
      
      <div class="kpi-card" :class="{ active: connectivityFilter === 'offline' }" 
        @click="toggleConnectivityFilter('offline')"
        @mouseenter.stop="showTip($event, 'Filtrar por Offline')" @mouseleave="hideTip">
        <i class="fas fa-exclamation-circle kpi-icon offline"></i>
        <div class="kpi-content">
          <div class="kpi-value">{{ offlineCount }}</div>
          <div class="kpi-label">Offline</div>
        </div>
      </div>
      
      <div class="kpi-card" :class="{ active: movingOnly }" 
        @click="toggleMovingFilter"
        @mouseenter.stop="showTip($event, 'Filtrar em movimento')" @mouseleave="hideTip">
        <i class="fas fa-running kpi-icon moving"></i>
        <div class="kpi-content">
          <div class="kpi-value">{{ movingCount }}</div>
          <div class="kpi-label">Em movimento</div>
        </div>
      </div>
      
      <div class="kpi-card" :class="{ active: situacaoFilter === 'ativo' }" 
        @click="toggleSituacaoFilter('ativo')"
        @mouseenter.stop="showTip($event, 'Filtrar por Ativos')" @mouseleave="hideTip">
        <i class="fas fa-check-circle kpi-icon ativo"></i>
        <div class="kpi-content">
          <div class="kpi-value">{{ ativoCount }}</div>
          <div class="kpi-label">Ativos</div>
        </div>
      </div>
      
      <div class="kpi-card" :class="{ active: situacaoFilter === 'estoque' }" 
        @click="toggleSituacaoFilter('estoque')"
        @mouseenter.stop="showTip($event, 'Filtrar por Estoque')" @mouseleave="hideTip">
        <i class="fas fa-box-open kpi-icon estoque"></i>
        <div class="kpi-content">
          <div class="kpi-value">{{ estoqueCount }}</div>
          <div class="kpi-label">Estoque</div>
        </div>
      </div>
      
      <div class="kpi-card" :class="{ active: situacaoFilter === 'desativado' }" 
        @click="toggleSituacaoFilter('desativado')"
        @mouseenter.stop="showTip($event, 'Filtrar por Desativados')" @mouseleave="hideTip">
        <i class="fas fa-ban kpi-icon desativado"></i>
        <div class="kpi-content">
          <div class="kpi-value">{{ desativadoCount }}</div>
          <div class="kpi-label">Desativados</div>
        </div>
      </div>
      
      <div class="kpi-card total">
        <i class="fas fa-layer-group kpi-icon"></i>
        <div class="kpi-content">
          <div class="kpi-value">{{ totalShown }}</div>
          <div class="kpi-label">Total</div>
        </div>
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
        <h4>Filtros Avançados</h4>
        <div class="header-actions">
          <label class="filters-ui-toggle">
            <input type="checkbox" v-model="showOnlyActiveControls" @change="saveUIOnlyActiveState">
            <span class="toggle-label">Somente ativos</span>
          </label>
          <el-button type="text" @click="clearAllFilters" class="btn-clear" :disabled="activeFiltersCount === 0"
            @mouseenter.stop="showTip($event, activeFiltersCount === 0 ? 'Nenhum filtro ativo' : 'Limpar todos os filtros')" @mouseleave="hideTip">
            <i class="fas fa-trash-alt"></i> Limpar
          </el-button>
        </div>
      </div>

      <!-- ETAPA 6B: Seção Presets (sempre visível) -->
      <div class="filter-section">
        <div class="filter-section__head">
          <div class="filter-section__title">Presets</div>
          <el-button type="text" @click="saveCurrentPreset" class="save-preset-btn"
            @mouseenter.stop="showTip($event, 'Salvar filtro atual')" @mouseleave="hideTip">
            <i class="fas fa-save"></i>
          </el-button>
        </div>
        
        <div class="filter-section__body">
          <!-- Presets padrão -->
          <div class="presets-row">
          <div v-for="preset in defaultPresets" :key="preset.id" class="preset-container">
            <div class="preset-btn default" @click="applyPreset(preset)"
              @mouseenter.stop="showTip($event, preset.name)" @mouseleave="hideTip">
              <i :class="preset.icon"></i>
              <span>{{ preset.name }}</span>
            </div>
            <button class="preset-favorite" :class="{ active: isFavorite(preset.id) }" 
              @click="toggleFavorite(preset.id)"
              @mouseenter.stop="showTip($event, isFavorite(preset.id) ? 'Desfavoritar' : 'Favoritar')" @mouseleave="hideTip">
              <i :class="isFavorite(preset.id) ? 'fas fa-star' : 'far fa-star'"></i>
            </button>
          </div>
        </div>
        
        <!-- Presets salvos -->
        <div v-if="savedPresets.length > 0" class="saved-presets">
          <div class="saved-presets-label">Salvos</div>
          <div v-for="preset in savedPresets" :key="preset.id" class="preset-item">
            <button class="preset-favorite" :class="{ active: isFavorite(preset.id) }" 
              @click="toggleFavorite(preset.id)"
              @mouseenter.stop="showTip($event, isFavorite(preset.id) ? 'Desfavoritar' : 'Favoritar')" @mouseleave="hideTip">
              <i :class="isFavorite(preset.id) ? 'fas fa-star' : 'far fa-star'"></i>
            </button>
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
      </div>

      <!-- ETAPA 6B: Seção Situação -->
      <div v-if="!showOnlyActiveControls || situacaoFilter !== 'todos'" class="filter-section">
        <div class="filter-section__head">
          <div class="filter-section__title">Situação</div>
          <div class="filter-section__hint">Status operacional do veículo</div>
        </div>
        <div class="filter-section__body">
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

      <!-- ETAPA 6B: Seção Conectividade -->
      <div v-if="!showOnlyActiveControls || connectivityFilter !== 'todos' || movingOnly" class="filter-section">
        <div class="filter-section__head">
          <div class="filter-section__title">Conectividade & Movimento</div>
          <div class="filter-section__hint">Estado de conexão e movimentação</div>
        </div>
        <div class="filter-section__body">
          <div class="filters-group">
            <div class="filter-icon small" :class="{ active: connectivityFilter === 'todos' }" 
              @click="setConnectivityFilter('todos')"
              @mouseenter.stop="showTip($event, 'Todos')" @mouseleave="hideTip">
              <i class="fas fa-globe"></i>
            </div>
            <div class="filter-icon small" :class="{ active: connectivityFilter === 'online' }" 
              @click="setConnectivityFilter('online')"
              @mouseenter.stop="showTip($event, 'Online')" @mouseleave="hideTip">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="filter-icon small" :class="{ active: connectivityFilter === 'offline' }" 
              @click="setConnectivityFilter('offline')"
              @mouseenter.stop="showTip($event, 'Offline')" @mouseleave="hideTip">
              <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="filter-icon small" :class="{ active: movingOnly }" 
              @click="toggleMoving"
              @mouseenter.stop="showTip($event, 'Somente em movimento')" @mouseleave="hideTip">
              <i class="fas fa-running"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- ETAPA 6B: Seção Estilo -->
      <div v-if="!showOnlyActiveControls || estilo !== 'cozy'" class="filter-section">
        <div class="filter-section__head">
          <div class="filter-section__title">Estilo de Visualização</div>
          <div class="filter-section__hint">Densidade da lista</div>
        </div>
        <div class="filter-section__body">
          <div class="filters-group">
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
// ETAPA 7A: Feature flag para exportação PDF
const EXPORT_PDF_ENABLED = true;

const store = useStore();

// ETAPA 6C: Helper para debounce de persistência no localStorage
const persistTimers = {};
const debouncePersist = (key, value, delay = 200) => {
  if (persistTimers[key]) {
    clearTimeout(persistTimers[key]);
  }
  
  persistTimers[key] = setTimeout(() => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Failed to persist', key, e);
    }
    delete persistTimers[key];
  }, delay);
};

const markerContext = inject('markerContext');
const markerClick = inject('markerClick');

const filteredDevices = ref([]);

const query = ref(localStorage.getItem('device_query') || '');
const estilo = ref(localStorage.getItem('device_estilo') || 'cozy');
const situacaoFilter = ref('todos');
const showFiltersPanel = ref(false);
const showExportMenu = ref(false);
const exportBtnRef = ref(null);

// ETAPA 6B: Toggle UI-only para mostrar apenas controles ativos no painel
const loadUIOnlyActiveState = () => {
  try {
    const stored = localStorage.getItem('device_filters_ui_only_active');
    return stored === 'true';
  } catch (error) {
    return false;
  }
};

const showOnlyActiveControls = ref(loadUIOnlyActiveState());

// ETAPA 6C: Salvar com debounce
const saveUIOnlyActiveState = () => {
  debouncePersist('device_filters_ui_only_active', showOnlyActiveControls.value, 150);
};

// ETAPA 4B: Verificar disponibilidade de XLSX
const isXlsxAvailable = computed(() => {
  return typeof window !== 'undefined' && window.XLSX !== undefined;
});

// ETAPA 7A: Verificar disponibilidade de jsPDF
const isPdfAvailable = computed(() => {
  return EXPORT_PDF_ENABLED && typeof window !== 'undefined' && (window.jspdf !== undefined || window.jsPDF !== undefined);
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

// ETAPA 5B: Favoritos (ETAPA 6C: com debounce persist)
const loadFavorites = () => {
  try {
    const stored = localStorage.getItem('device_filter_favorites');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
};

const saveFavorites = (favorites) => {
  debouncePersist('device_filter_favorites', JSON.stringify(favorites), 200);
};

const favoritePresetIds = ref(loadFavorites());

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

// ETAPA 5B: Lista de presets favoritos
const favoritesList = computed(() => {
  const allPresets = [...defaultPresets, ...savedPresets.value];
  const favorites = allPresets.filter(preset => favoritePresetIds.value.includes(preset.id));
  
  // Ordenar: defaults primeiro, depois salvos
  return favorites.sort((a, b) => {
    const aIsDefault = defaultPresets.some(p => p.id === a.id);
    const bIsDefault = defaultPresets.some(p => p.id === b.id);
    if (aIsDefault && !bIsDefault) return -1;
    if (!aIsDefault && bIsDefault) return 1;
    return 0;
  });
});

// ETAPA 6A: KPI Summary Computeds
const totalShown = computed(() => {
  return displayDevices.value.length;
});

const onlineCount = computed(() => {
  return displayDevices.value.filter(device => {
    return getDeviceConnectivity(device) === 'online';
  }).length;
});

const offlineCount = computed(() => {
  return displayDevices.value.filter(device => {
    return getDeviceConnectivity(device) === 'offline';
  }).length;
});

const movingCount = computed(() => {
  return displayDevices.value.filter(device => {
    return getDeviceMoving(device);
  }).length;
});

const ativoCount = computed(() => {
  return displayDevices.value.filter(device => {
    const situacao = device.attributes?.['situacao']?.toLowerCase();
    return situacao === 'ativo';
  }).length;
});

const estoqueCount = computed(() => {
  return displayDevices.value.filter(device => {
    const situacao = device.attributes?.['situacao']?.toLowerCase();
    return situacao === 'estoque';
  }).length;
});

const desativadoCount = computed(() => {
  return displayDevices.value.filter(device => {
    const situacao = device.attributes?.['situacao']?.toLowerCase();
    return situacao === 'desativado';
  }).length;
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
  
  // ETAPA 6C: Atualizar localStorage com debounce (múltiplas mudanças em batch)
  debouncePersist('device_estilo', estilo.value, 200);
  debouncePersist('device_connectivity_filter', connectivityFilter.value, 200);
  debouncePersist('device_moving_only', movingOnly.value, 200);
  debouncePersist('device_query', query.value, 200);
  
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
  debouncePersist('device_filter_presets', JSON.stringify(savedPresets.value), 200);
};

const removePreset = (presetId) => {
  savedPresets.value = savedPresets.value.filter(p => p.id !== presetId);
  
  // Remover dos favoritos se existir
  favoritePresetIds.value = favoritePresetIds.value.filter(id => id !== presetId);
  saveFavorites(favoritePresetIds.value);
  
  debouncePersist('device_filter_presets', JSON.stringify(savedPresets.value), 200);
};

// ETAPA 5B: Gerenciamento de favoritos
const isFavorite = (presetId) => {
  return favoritePresetIds.value.includes(presetId);
};

const toggleFavorite = (presetId) => {
  if (isFavorite(presetId)) {
    favoritePresetIds.value = favoritePresetIds.value.filter(id => id !== presetId);
  } else {
    favoritePresetIds.value.push(presetId);
  }
  saveFavorites(favoritePresetIds.value);
};

// ETAPA 6A: Quick toggle filters dos KPI cards (ETAPA 6C: com debounce persist)
const toggleConnectivityFilter = (value) => {
  if (connectivityFilter.value === value) {
    connectivityFilter.value = 'todos';
    localStorage.removeItem('device_connectivity_filter');
  } else {
    connectivityFilter.value = value;
    debouncePersist('device_connectivity_filter', value, 150);
  }
};

const toggleMovingFilter = () => {
  movingOnly.value = !movingOnly.value;
  debouncePersist('device_moving_only', movingOnly.value, 150);
};

const toggleSituacaoFilter = (value) => {
  if (situacaoFilter.value === value) {
    situacaoFilter.value = 'todos';
    filterDevices('todos');
  } else {
    situacaoFilter.value = value;
    filterDevices(value);
  }
};

const setEstilo = (value) => {
  estilo.value = value;
  debouncePersist('device_estilo', value, 150);
};

const onClearInput = () => {
  query.value = '';
};

// ETAPA 6C: Helpers para clicks inline (evitar localStorage direto no template)
const setConnectivityFilter = (value) => {
  connectivityFilter.value = value;
  debouncePersist('device_connectivity_filter', value, 100);
};

const toggleMoving = () => {
  movingOnly.value = !movingOnly.value;
  debouncePersist('device_moving_only', movingOnly.value, 100);
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

// ETAPA 7A: Exportação PDF Executiva
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
};

const formatFiltersSummary = () => {
  const parts = [];
  
  if (query.value) {
    parts.push(`Busca: "${query.value}"`);
  }
  
  if (situacaoFilter.value !== 'todos') {
    parts.push(`Situação: ${situacaoFilter.value}`);
  }
  
  if (connectivityFilter.value !== 'todos') {
    parts.push(`Conectividade: ${connectivityFilter.value}`);
  }
  
  if (movingOnly.value) {
    parts.push('Apenas em movimento');
  }
  
  if (estilo.value !== 'cozy') {
    parts.push(`Exibição: ${estilo.value}`);
  }
  
  return parts.length > 0 ? parts.join(' | ') : 'Nenhum filtro aplicado';
};

const exportToPdf = () => {
  closeExportMenu();
  
  if (!isPdfAvailable.value) {
    console.warn('jsPDF library not available');
    return;
  }
  
  try {
    // Usar displayDevices (resultado final dos filtros)
    const list = displayDevices.value.slice(0, 200);
    const hasMore = displayDevices.value.length > 200;
    
    if (list.length === 0) {
      return;
    }
    
    // Inicializar jsPDF
    const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
    const doc = new jsPDF();
    
    // Configurações
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    
    // Título
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Relatório de Dispositivos', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Data/hora
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const now = new Date();
    const dateStr = now.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Gerado em: ${dateStr}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Filtros aplicados
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Filtros aplicados:', 14, yPos);
    yPos += 6;
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const filterText = formatFiltersSummary();
    const splitFilters = doc.splitTextToSize(filterText, pageWidth - 28);
    doc.text(splitFilters, 14, yPos);
    yPos += splitFilters.length * 5 + 5;
    
    // KPIs
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Resumo:', 14, yPos);
    yPos += 7;
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Total de dispositivos: ${totalShown.value}`, 14, yPos);
    yPos += 5;
    doc.text(`Online: ${onlineCount.value}`, 14, yPos);
    yPos += 5;
    doc.text(`Offline: ${offlineCount.value}`, 14, yPos);
    yPos += 5;
    doc.text(`Em movimento: ${movingCount.value}`, 14, yPos);
    yPos += 10;
    
    // Aviso se houver mais registros
    if (hasMore) {
      doc.setFontSize(8);
      doc.setTextColor(200, 0, 0);
      doc.text(`Nota: Exibindo apenas os primeiros 200 de ${displayDevices.value.length} dispositivos`, 14, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 8;
    }
    
    // Tabela
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Dispositivos:', 14, yPos);
    yPos += 7;
    
    // Preparar dados da tabela
    const tableData = list.map(device => {
      const connectivity = getDeviceConnectivity(device);
      const moving = getDeviceMoving(device);
      const lastUpdate = device.lastUpdate || device.attributes?.lastUpdate || '';
      const speed = device.attributes?.speed ? `${Math.round(device.attributes.speed)} km/h` : '-';
      
      return [
        device.name || '',
        device.attributes?.['situacao'] || '-',
        connectivity || '-',
        speed,
        formatDate(lastUpdate)
      ];
    });
    
    // Usar autoTable se disponível
    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: yPos,
        head: [['Nome', 'Situação', 'Conectividade', 'Velocidade', 'Última Atualização']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [64, 158, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 10, left: 14, right: 14 }
      });
    } else {
      // Renderização manual simples
      doc.setFontSize(8);
      const colWidths = [60, 30, 30, 25, 40];
      const startX = 14;
      
      // Header
      doc.setFont(undefined, 'bold');
      doc.text('Nome', startX, yPos);
      doc.text('Situação', startX + colWidths[0], yPos);
      doc.text('Conectividade', startX + colWidths[0] + colWidths[1], yPos);
      doc.text('Velocidade', startX + colWidths[0] + colWidths[1] + colWidths[2], yPos);
      doc.text('Última Atualização', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPos);
      yPos += 5;
      
      // Linhas
      doc.setFont(undefined, 'normal');
      for (const row of tableData) {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.text(row[0].substring(0, 25), startX, yPos);
        doc.text(row[1], startX + colWidths[0], yPos);
        doc.text(row[2], startX + colWidths[0] + colWidths[1], yPos);
        doc.text(row[3], startX + colWidths[0] + colWidths[1] + colWidths[2], yPos);
        doc.text(row[4], startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPos);
        yPos += 5;
      }
    }
    
    // Nome do arquivo com timestamp
    const timestamp = now.toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
    const filename = `devices_report_${timestamp}.pdf`;
    
    // Download
    doc.save(filename);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
  }
};

// ETAPA 7B: Deep link de filtros
const shareLinkCopied = ref(false);

const buildDevicesShareUrl = () => {
  try {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();
    
    // Adicionar parâmetros apenas se diferentes do padrão
    if (query.value) {
      params.set('q', query.value.substring(0, 80).trim());
    }
    
    if (situacaoFilter.value !== 'todos') {
      params.set('sit', situacaoFilter.value);
    }
    
    if (connectivityFilter.value !== 'todos') {
      params.set('con', connectivityFilter.value);
    }
    
    if (movingOnly.value) {
      params.set('mov', '1');
    }
    
    if (estilo.value !== 'cozy') {
      params.set('sty', estilo.value);
    }
    
    if (showOnlyActiveControls.value) {
      params.set('ui', '1');
    }
    
    url.search = params.toString();
    return url.toString();
  } catch (error) {
    console.error('Error building share URL:', error);
    return window.location.href;
  }
};

const copyShareLink = async () => {
  const shareUrl = buildDevicesShareUrl();
  
  try {
    // Tentar usar Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      
      // Feedback visual
      shareLinkCopied.value = true;
      setTimeout(() => {
        shareLinkCopied.value = false;
      }, 1200);
    } else {
      // Fallback: prompt
      window.prompt('Copie o link abaixo:', shareUrl);
    }
  } catch (error) {
    console.warn('Clipboard copy failed, using fallback:', error);
    window.prompt('Copie o link abaixo:', shareUrl);
  }
};

const applyFiltersFromUrl = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Se não houver nenhum parâmetro reconhecido, não fazer nada
    const hasParams = urlParams.has('q') || urlParams.has('sit') || urlParams.has('con') || 
                     urlParams.has('mov') || urlParams.has('sty') || urlParams.has('ui');
    
    if (!hasParams) {
      return;
    }
    
    // Query (busca)
    if (urlParams.has('q')) {
      const q = urlParams.get('q').substring(0, 80).trim();
      if (q) {
        query.value = q;
        debouncePersist('device_query', q, 50);
      }
    }
    
    // Situação
    if (urlParams.has('sit')) {
      const sit = urlParams.get('sit');
      const validSituacao = ['todos', 'ativo', 'estoque', 'desativado'];
      if (validSituacao.includes(sit)) {
        situacaoFilter.value = sit;
      }
    }
    
    // Conectividade
    if (urlParams.has('con')) {
      const con = urlParams.get('con');
      const validConnectivity = ['todos', 'online', 'offline'];
      if (validConnectivity.includes(con)) {
        connectivityFilter.value = con;
        debouncePersist('device_connectivity_filter', con, 50);
      }
    }
    
    // Movimento
    if (urlParams.has('mov')) {
      const mov = urlParams.get('mov');
      movingOnly.value = mov === '1';
      debouncePersist('device_moving_only', movingOnly.value, 50);
    }
    
    // Estilo
    if (urlParams.has('sty')) {
      const sty = urlParams.get('sty');
      const validEstilo = ['cozy', 'compact'];
      if (validEstilo.includes(sty)) {
        estilo.value = sty;
        debouncePersist('device_estilo', sty, 50);
      }
    }
    
    // UI-only toggle
    if (urlParams.has('ui')) {
      const ui = urlParams.get('ui');
      showOnlyActiveControls.value = ui === '1';
      debouncePersist('device_filters_ui_only_active', showOnlyActiveControls.value, 50);
    }
    
    // Abrir painel de filtros se houver filtros aplicados
    if (hasParams) {
      showFiltersPanel.value = true;
    }
    
    // Aplicar filtro de situação (dispara recálculo)
    filterDevices(situacaoFilter.value);
    
    // Limpar URL (opcional, para não ficar poluída)
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  } catch (error) {
    console.error('Error applying filters from URL:', error);
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

// ETAPA 6C: Debounce na busca por texto com persistência otimizada
watch(query,()=>{
  debouncePersist('device_query', query.value, 300);
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
  // ETAPA 6C: localStorage já é persistido pelo watch do query (com debounce)
  
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

// ETAPA 6C: Computed de IDs para watch otimizado (evita deep watch)
const visibleDeviceIds = computed(() => {
  return visibleDevicesForMap.value.map(d => d.id);
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

// ETAPA 6C: Watcher otimizado baseado em IDs (sem deep watch)
watch(visibleDeviceIds, (newIds, oldIds) => {
  // Proteger se lista estiver vazia
  if (!newIds || newIds.length === 0) {
    return;
  }
  
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }
  
  syncDebounceTimer = setTimeout(() => {
    syncMapMarkers();
  }, 80);
});

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
  
  // ETAPA 7B: Aplicar filtros da URL (deep link)
  applyFiltersFromUrl();
});

// ETAPA 6C: Cleanup no unmount (map + persist timers)
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
  
  // Limpar timer de sync do mapa
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }
  
  // ETAPA 6C: Limpar todos os timers de persistência pendentes
  Object.keys(persistTimers).forEach(key => {
    clearTimeout(persistTimers[key]);
  });
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

/* =========================== ETAPA 5B: QUICK PRESETS (FAVORITOS) =========================== */
.quick-presets-row{
  display:flex;gap:6px;margin-bottom:8px;overflow-x:auto;padding:4px 2px;
  scrollbar-width:thin;scrollbar-color:#d1d5db transparent;
}

.quick-presets-row::-webkit-scrollbar{height:4px;}
.quick-presets-row::-webkit-scrollbar-track{background:transparent;}
.quick-presets-row::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:2px;}
.quick-presets-row::-webkit-scrollbar-thumb:hover{background:#9ca3af;}

.quick-preset{
  display:inline-flex;align-items:center;gap:4px;padding:4px 8px;
  background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
  border-radius:12px;font-size:10px;color:#fff;cursor:pointer;
  transition:all .2s ease;white-space:nowrap;flex-shrink:0;
  box-shadow:0 2px 4px rgba(102,126,234,.3);
}

.quick-preset:hover{
  transform:translateY(-1px);box-shadow:0 4px 8px rgba(102,126,234,.4);
}

.quick-preset i{font-size:9px;}

.quick-preset-unfav{
  background:rgba(255,255,255,.2);border:none;padding:2px 4px;
  border-radius:50%;cursor:pointer;color:#fff;transition:all .2s ease;
  margin-left:2px;width:14px;height:14px;display:flex;align-items:center;justify-content:center;
}

.quick-preset-unfav:hover{
  background:rgba(255,255,255,.4);transform:scale(1.1);
}

.quick-preset-unfav i{font-size:7px;}

/* =========================== ETAPA 6A: KPI SUMMARY CARDS =========================== */
.kpi-cards-row{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;
  margin-bottom:12px;padding:0;
}

@media (max-width: 768px) {
  .kpi-cards-row{
    grid-template-columns:repeat(2,1fr);
  }
}

.kpi-card{
  display:flex;align-items:center;gap:10px;padding:12px;background:#fff;
  border:2px solid #e4e7ed;border-radius:8px;cursor:pointer;
  transition:all .2s ease;box-shadow:0 1px 3px rgba(0,0,0,.06);
}

.kpi-card:hover{
  border-color:#409EFF;transform:translateY(-2px);
  box-shadow:0 4px 8px rgba(64,158,255,.15);
}

.kpi-card.active{
  border-color:#409EFF;background:linear-gradient(135deg,#ecf5ff 0%,#f0f9ff 100%);
  box-shadow:0 4px 12px rgba(64,158,255,.25);
}

.kpi-card.total{
  cursor:default;background:linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%);
  border-color:#d1d5db;
}

.kpi-card.total:hover{
  transform:none;border-color:#d1d5db;
  box-shadow:0 1px 3px rgba(0,0,0,.06);
}

.kpi-icon{
  font-size:24px;width:32px;text-align:center;flex-shrink:0;
}

.kpi-icon.online{color:#67c23a;}
.kpi-icon.offline{color:#f56c6c;}
.kpi-icon.moving{color:#409EFF;}
.kpi-icon.ativo{color:#16a34a;}
.kpi-icon.estoque{color:#64748b;}
.kpi-icon.desativado{color:#ef4444;}
.kpi-card.total .kpi-icon{color:#6b7280;}

.kpi-content{
  display:flex;flex-direction:column;gap:2px;flex:1;
}

.kpi-value{
  font-size:20px;font-weight:700;color:#303133;line-height:1;
}

.kpi-label{
  font-size:11px;color:#909399;text-transform:uppercase;letter-spacing:0.5px;
  font-weight:600;
}

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

.share-link-btn{
  background:#409EFF;border-color:#409EFF;color:#fff;
  box-shadow:0 4px 8px rgba(64,158,255,.18);transition:all .15s;
}
.share-link-btn:hover{transform:translateY(-2px);box-shadow:0 6px 12px rgba(64,158,255,.28);}
.share-link-btn i.fa-check{
  animation:checkPulse .3s ease;
}

@keyframes checkPulse{
  0%{transform:scale(1)}
  50%{transform:scale(1.2)}
  100%{transform:scale(1)}
}

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
.export-menu-item .fa-file-pdf{color:#f56c6c;}

.export-menu-divider{
  height:1px;background:#e4e7ed;margin:4px 0;
}

/* =========================== PAINEL DE FILTROS =========================== */
.filters-panel{
  background:#f8f9fa;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,.1);margin-top:5px;margin-bottom:8px;padding:8px;
  transition:all .3s ease;animation:fadeIn .3s ease;
}

.filters-panel-header{
  display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e4e7ed;
}

.filters-panel-header h4{
  margin:0;font-size:14px;font-weight:700;color:#303133;letter-spacing:0.5px;
}

.header-actions{
  display:flex;align-items:center;gap:12px;
}

/* ETAPA 6B: Toggle UI-only */
.filters-ui-toggle{
  display:flex;align-items:center;gap:6px;font-size:11px;color:#606266;cursor:pointer;
  user-select:none;transition:all .2s ease;
}

.filters-ui-toggle input[type="checkbox"]{
  width:14px;height:14px;cursor:pointer;accent-color:#409EFF;
}

.filters-ui-toggle:hover{
  color:#409EFF;
}

.toggle-label{
  font-weight:500;
}

/* Botão limpar melhorado */
.btn-clear{
  font-size:11px;color:#F56C6C;padding:4px 8px;height:auto;border-radius:4px;
  transition:all .2s ease;font-weight:600;
}

.btn-clear:not(:disabled):hover{
  background:rgba(245,108,108,.1);opacity:1;
}

.btn-clear:disabled{
  color:#c0c4cc;cursor:not-allowed;opacity:.5;
}

.btn-clear i{
  font-size:10px;
}

/* ETAPA 6B: Seções de filtro */
.filter-section{
  background:#fff;border-radius:6px;padding:10px 12px;margin-bottom:8px;
  border:1px solid #e4e7ed;transition:all .2s ease;
}

.filter-section:hover{
  border-color:#d1d5db;box-shadow:0 2px 4px rgba(0,0,0,.05);
}

.filter-section__head{
  display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;
}

.filter-section__title{
  font-size:12px;font-weight:700;color:#409EFF;text-transform:uppercase;
  letter-spacing:0.8px;line-height:1.2;
}

.filter-section__hint{
  font-size:10px;color:#909399;margin-top:2px;font-style:italic;
  opacity:.8;line-height:1.3;
}

.filter-section__body{
  margin-top:8px;
}

/* Responsivo */
@media (max-width: 420px) {
  .filter-section{
    padding:8px 10px;
  }
  
  .filter-section__title{
    font-size:11px;
  }
  
  .filter-section__hint{
    font-size:9px;
  }
  
  .filters-panel-header h4{
    font-size:12px;
  }
}

/* =========================== ETAPA 5A: PRESETS (ajustado para seções) =========================== */
.presets-row{
  display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px;
}

.save-preset-btn{
  font-size:11px;color:#409EFF;padding:4px 8px;height:auto;border-radius:4px;
  transition:all .2s ease;font-weight:600;
}

.save-preset-btn:hover{
  background:rgba(64,158,255,.1);
}

.save-preset-btn i{
  font-size:10px;
}

.preset-container{
  position:relative;display:inline-flex;align-items:center;
}

.preset-btn{
  display:inline-flex;align-items:center;gap:4px;padding:5px 10px;
  border-radius:12px;font-size:11px;cursor:pointer;transition:all .2s ease;
  border:1px solid #e4e7ed;background:#f9fafb;
}

.preset-favorite{
  position:absolute;top:-4px;right:-4px;background:#fff;border:1px solid #e4e7ed;
  padding:2px 4px;border-radius:50%;cursor:pointer;color:#d1d5db;
  transition:all .2s ease;width:16px;height:16px;display:flex;align-items:center;justify-content:center;
  box-shadow:0 1px 3px rgba(0,0,0,.1);z-index:1;
}

.preset-favorite:hover{
  border-color:#fbbf24;color:#fbbf24;transform:scale(1.15);
}

.preset-favorite.active{
  color:#fbbf24;border-color:#fbbf24;background:#fffbeb;
}

.preset-favorite i{
  font-size:8px;
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
  display:flex;align-items:center;gap:4px;margin-bottom:4px;position:relative;
}

.preset-item .preset-favorite{
  position:static;margin-right:4px;
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

/* ETAPA 6B: Classes antigas removidas (substituídas por .filter-section) */
/* .filters-row{display:flex;flex-direction:row;align-items:center;margin-bottom:6px;gap:6px;} */
/* .primary-row{
  background:linear-gradient(to right,#e8f3ff,#ecf8ff);border-radius:5px;padding:5px 6px;border:1px solid #d8ebff;margin-bottom:5px;
  position:relative;box-shadow:inset 0 1px 3px rgba(0,0,0,.03);
} */
/* .category-label{
  font-size:10px;font-weight:600;color:#409EFF;margin-right:8px;display:flex;align-items:center;min-width:45px;
} */

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