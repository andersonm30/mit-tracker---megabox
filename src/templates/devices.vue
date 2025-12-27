<template>
  <div class="devices-page" :class="{ 'is-compact': estilo === 'compact' }">
    <!-- ===== Linha de busca + ações ===== -->
    <div class="search-row">
      <el-input v-model="query" class="search-input" size="small"
        :placeholder="KT('device.search')" clearable @clear="onClearInput">
        <!-- Prefixo: filtro leve (ADMIN ONLY) -->
        <template #prefix>
          <span v-if="store.getters['isAdmin']" class="filter-toggle-button" :class="{ 'active': showFiltersPanel || activeFiltersCount > 0 }"
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
        <el-button class="view-mode-btn" size="small" 
          @click="toggleViewMode"
          @mouseenter.stop="showTip($event, viewMode === 'list' ? 'Visualização em Cards' : 'Visualização em Lista')" 
          @mouseleave="hideTip">
          <i :class="viewMode === 'list' ? 'fas fa-th' : 'fas fa-list'"></i>
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

    <!-- ===== ETAPA 6A/8B/8C: KPI Mini-Cards (Admin-only, Global/Shown, Collapsible) ===== -->
    <div v-if="canSeeKpis" class="kpi-grid-compact" :class="{ 'kpi-collapsed': kpisCollapsed }">
      <div class="kpi-mini kpi-mini--online" :class="{ active: connectivityFilter === 'online' }" @click="toggleConnectivityFilter('online')"
        @mouseenter.stop="showTip($event, `Online: ${onlineCount}${onlineCount !== onlineCountGlobal ? ' / ' + onlineCountGlobal + ' total' : ''}`)" @mouseleave="hideTip">
        <div class="kpi-mini__content">
          <div class="kpi-mini__value">{{ onlineCount }}<span v-if="onlineCount !== onlineCountGlobal" class="kpi-mini__total"> / {{ onlineCountGlobal }}</span></div>
          <div class="kpi-mini__label">Online</div>
        </div>
      </div>
      <div class="kpi-mini kpi-mini--offline" :class="{ active: connectivityFilter === 'offline' }" @click="toggleConnectivityFilter('offline')"
        @mouseenter.stop="showTip($event, `Offline: ${offlineCount}${offlineCount !== offlineCountGlobal ? ' / ' + offlineCountGlobal + ' total' : ''}`)" @mouseleave="hideTip">
        <div class="kpi-mini__content">
          <div class="kpi-mini__value">{{ offlineCount }}<span v-if="offlineCount !== offlineCountGlobal" class="kpi-mini__total"> / {{ offlineCountGlobal }}</span></div>
          <div class="kpi-mini__label">Offline</div>
        </div>
      </div>
      <div class="kpi-mini kpi-mini--offline-critical" :class="{ active: timeFilter === 'custom' }" @click="setTimeFilter('custom')"
        @mouseenter.stop="showTip($event, `Offline > ${offlineHoursThreshold}h: ${offlineExceedingThreshold}`)" @mouseleave="hideTip">
        <div class="kpi-mini__content">
          <div class="kpi-mini__value">{{ offlineExceedingThreshold }}</div>
          <div class="kpi-mini__label">Offline > {{ offlineHoursThreshold }}h</div>
        </div>
      </div>
      <div class="kpi-mini" :class="{ active: movingOnly }" @click="toggleMovingFilter"
        @mouseenter.stop="showTip($event, `Em movimento: ${movingCount}${movingCount !== movingCountGlobal ? ' / ' + movingCountGlobal + ' total' : ''}`)" @mouseleave="hideTip">
        <i class="kpi-mini__icon moving fas fa-location-arrow"></i>
        <div class="kpi-mini__content">
          <div class="kpi-mini__value">{{ movingCount }}<span v-if="movingCount !== movingCountGlobal" class="kpi-mini__total"> / {{ movingCountGlobal }}</span></div>
          <div class="kpi-mini__label">Movimento</div>
        </div>
      </div>
      <div class="kpi-mini" :class="{ active: situacaoFilter === 'ativo' }" @click="toggleSituacaoFilter('ativo')"
        @mouseenter.stop="showTip($event, `Ativo: ${ativoCount}${ativoCount !== ativoCountGlobal ? ' / ' + ativoCountGlobal + ' total' : ''}`)" @mouseleave="hideTip">
        <i class="kpi-mini__icon ativo fas fa-check-circle"></i>
        <div class="kpi-mini__content">
          <div class="kpi-mini__value">{{ ativoCount }}<span v-if="ativoCount !== ativoCountGlobal" class="kpi-mini__total"> / {{ ativoCountGlobal }}</span></div>
          <div class="kpi-mini__label">Ativo</div>
        </div>
      </div>
      <div class="kpi-mini" :class="{ active: situacaoFilter === 'estoque' }" @click="toggleSituacaoFilter('estoque')"
        @mouseenter.stop="showTip($event, `Estoque: ${estoqueCount}${estoqueCount !== estoqueCountGlobal ? ' / ' + estoqueCountGlobal + ' total' : ''}`)" @mouseleave="hideTip">
        <i class="kpi-mini__icon estoque fas fa-box"></i>
        <div class="kpi-mini__content">
          <div class="kpi-mini__value">{{ estoqueCount }}<span v-if="estoqueCount !== estoqueCountGlobal" class="kpi-mini__total"> / {{ estoqueCountGlobal }}</span></div>
          <div class="kpi-mini__label">Estoque</div>
        </div>
      </div>
      <div class="kpi-mini" :class="{ active: situacaoFilter === 'desativado' }" @click="toggleSituacaoFilter('desativado')"
        @mouseenter.stop="showTip($event, `Desativado: ${desativadoCount}${desativadoCount !== desativadoCountGlobal ? ' / ' + desativadoCountGlobal + ' total' : ''}`)" @mouseleave="hideTip">
        <i class="kpi-mini__icon desativado fas fa-times-circle"></i>
        <div class="kpi-mini__content">
          <div class="kpi-mini__value">{{ desativadoCount }}<span v-if="desativadoCount !== desativadoCountGlobal" class="kpi-mini__total"> / {{ desativadoCountGlobal }}</span></div>
          <div class="kpi-mini__label">Desativado</div>
        </div>
      </div>
      <div class="kpi-mini total"
        @mouseenter.stop="showTip($event, `Total exibido: ${totalShown}${totalShown !== totalGlobal ? ' de ' + totalGlobal : ''}`)" @mouseleave="hideTip">
        <i class="kpi-mini__icon fas fa-layer-group"></i>
        <div class="kpi-mini__content">
          <div class="kpi-mini__value">{{ totalShown }}<span v-if="totalShown !== totalGlobal" class="kpi-mini__total"> / {{ totalGlobal }}</span></div>
          <div class="kpi-mini__label">Total</div>
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

    <!-- ===== Painel de Filtros Avançados (UI apenas, Accordion) - Desktop apenas, ADMIN ONLY (ETAPA 8D) ===== -->
    <div v-if="!isMobile && showFiltersPanel && store.getters['isAdmin']" class="filters-accordion">
      <div class="filters-accordion__header">
        <div class="filters-accordion__title">
          <span>Filtros</span>
          <span v-if="activeFiltersCount > 0" class="filter-count-badge">{{ activeFiltersCount }}</span>
        </div>
        <div class="filters-accordion__actions">
          <label class="filters-ui-toggle-compact">
            <input type="checkbox" v-model="showOnlyActiveControls" @change="saveUIOnlyActiveState">
            <span class="toggle-label-compact">Somente ativos</span>
          </label>
          <button class="btn-clear-compact" :disabled="activeFiltersCount === 0" @click="clearAllFilters"
            @mouseenter.stop="showTip($event, activeFiltersCount === 0 ? 'Nenhum filtro ativo' : 'Limpar')" @mouseleave="hideTip">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>

      <!-- ETAPA 6B/8B: Seção Presets (Collapsible) -->
      <div class="section-collapsible">
        <div class="section-collapsible__head" @click="toggleSection('presets')">
          <div class="section-collapsible__title">
            <i class="fas" :class="openSections.presets ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
            <span>Presets</span>
          </div>
          <button class="save-preset-btn-compact" @click.stop="saveCurrentPreset"
            @mouseenter.stop="showTip($event, 'Salvar')" @mouseleave="hideTip">
            <i class="fas fa-save"></i>
          </button>
        </div>
        
        <div v-show="openSections.presets" class="section-collapsible__body">
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

      <!-- ETAPA 6B/8B: Seção Situação (Collapsible, Segmented Control) -->
      <div v-if="!showOnlyActiveControls || situacaoFilter !== 'todos'" class="section-collapsible">
        <div class="section-collapsible__head" @click="toggleSection('situacao')">
          <div class="section-collapsible__title">
            <i class="fas" :class="openSections.situacao ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
            <span>Situação</span>
          </div>
          <div class="section-collapsible__hint">Status operacional</div>
        </div>
        <div v-show="openSections.situacao" class="section-collapsible__body">
          <div class="segmented-control">
          <div class="segmented-btn" :class="{ active: situacaoFilter === 'todos' }" @click="filterDevices('todos')"
            @mouseenter.stop="showTip($event, 'Todos')" @mouseleave="hideTip">
            <i class="fas fa-layer-group"></i>
          </div>
          <div class="segmented-btn" :class="{ active: situacaoFilter === 'ativo' }" @click="filterDevices('ativo')"
            @mouseenter.stop="showTip($event, 'Ativos')" @mouseleave="hideTip">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="segmented-btn" :class="{ active: situacaoFilter === 'estoque' }"
            @click="filterDevices('estoque')" @mouseenter.stop="showTip($event, 'Estoque')" @mouseleave="hideTip">
            <i class="fas fa-box-open"></i>
          </div>
          <div class="segmented-btn" :class="{ active: situacaoFilter === 'desativado' }"
            @click="filterDevices('desativado')" @mouseenter.stop="showTip($event, 'Desativados')" @mouseleave="hideTip">
            <i class="fas fa-ban"></i>
          </div>
          </div>
        </div>
      </div>

      <!-- ETAPA 6B/8B: Seção Conectividade (Collapsible, Segmented Control) -->
      <div v-if="!showOnlyActiveControls || connectivityFilter !== 'todos' || movingOnly" class="section-collapsible">
        <div class="section-collapsible__head" @click="toggleSection('connectivity')">
          <div class="section-collapsible__title">
            <i class="fas" :class="openSections.connectivity ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
            <span>Conectividade</span>
          </div>
          <div class="section-collapsible__hint">Conexão e movimento</div>
        </div>
        <div v-show="openSections.connectivity" class="section-collapsible__body">
          <div class="segmented-control">
            <div class="segmented-btn" :class="{ active: connectivityFilter === 'todos' }" 
              @click="setConnectivityFilter('todos')"
              @mouseenter.stop="showTip($event, 'Todos')" @mouseleave="hideTip">
              <i class="fas fa-globe"></i>
            </div>
            <div class="segmented-btn" :class="{ active: connectivityFilter === 'online' }" 
              @click="setConnectivityFilter('online')"
              @mouseenter.stop="showTip($event, 'Online')" @mouseleave="hideTip">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="segmented-btn" :class="{ active: connectivityFilter === 'offline' }" 
              @click="setConnectivityFilter('offline')"
              @mouseenter.stop="showTip($event, 'Offline')" @mouseleave="hideTip">
              <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="segmented-btn" :class="{ active: movingOnly }" 
              @click="toggleMoving"
              @mouseenter.stop="showTip($event, 'Movimento')" @mouseleave="hideTip">
              <i class="fas fa-running"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- NOVA SEÇÃO: GPS Avançado (Collapsible) -->
      <div v-if="!showOnlyActiveControls || gpsBrandFilter || gpsModelFilter || technologyFilter" class="section-collapsible">
        <div class="section-collapsible__head" @click="toggleSection('gps')">
          <div class="section-collapsible__title">
            <i class="fas" :class="openSections.gps ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
            <span>GPS Avançado</span>
          </div>
          <div class="section-collapsible__hint">Marca, modelo e tecnologia</div>
        </div>
        <div v-show="openSections.gps" class="section-collapsible__body">
          <div class="gps-filters-grid">
            <!-- Filtro por Marca -->
            <div class="gps-filter-item">
              <label class="gps-filter-label">Marca</label>
              <select v-model="gpsBrandFilter" @change="handleGpsBrandFilter($event.target.value)" 
                      class="gps-select brand-select">
                <option value="">Todas as Marcas</option>
                <option v-for="brand in gpsBrands" :key="brand" :value="brand">{{ brand }}</option>
              </select>
            </div>
            
            <!-- Filtro por Modelo -->
            <div class="gps-filter-item">
              <label class="gps-filter-label">Modelo</label>
              <select v-model="gpsModelFilter" @change="handleGpsModelFilter($event.target.value)" 
                      class="gps-select model-select" :disabled="!gpsBrandFilter">
                <option value="">Todos os Modelos</option>
                <option v-for="model in commonGpsModels" :key="model" :value="model">{{ model }}</option>
              </select>
            </div>
            
            <!-- Filtro por Tecnologia -->
            <div class="gps-filter-item">
              <label class="gps-filter-label">Tecnologia</label>
              <select v-model="technologyFilter" @change="handleTechnologyFilter($event.target.value)" 
                      class="gps-select tech-select">
                <option value="">Todas Tecnologias</option>
                <option value="GSM">GSM</option>
                <option value="3G">3G</option>
                <option value="4G">4G</option>
                <option value="Satellite">Satélite</option>
                <option value="LoRa">LoRa</option>
              </select>
            </div>

            <!-- Botão para limpar filtros GPS -->
            <div v-if="gpsBrandFilter || gpsModelFilter || technologyFilter" class="gps-clear-btn-wrapper">
              <button class="gps-clear-btn" @click="clearGpsFilters" 
                      @mouseenter.stop="showTip($event, 'Limpar filtros GPS')" @mouseleave="hideTip">
                <i class="fas fa-times"></i> Limpar GPS
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Seção Offline (Chips rápidos + Threshold configurável) -->
      <div v-if="!showOnlyActiveControls || timeFilter" class="section-collapsible">
        <div class="section-collapsible__head" @click="toggleSection('offline')">
          <div class="section-collapsible__title">
            <i class="fas" :class="openSections.offline ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
            <span>Filtros Offline</span>
          </div>
          <div class="section-collapsible__hint">Tempo offline e threshold</div>
        </div>
        <div v-show="openSections.offline" class="section-collapsible__body">
          <!-- Chips rápidos -->
          <div class="offline-chips-row">
            <div class="offline-chip" :class="{ active: timeFilter === 'offline-1h' }" @click="setTimeFilter('offline-1h')"
              @mouseenter.stop="showTip($event, 'Offline < 1h')" @mouseleave="hideTip">
              <i class="fas fa-hourglass-start"></i>
              <span>1h</span>
            </div>
            <div class="offline-chip" :class="{ active: timeFilter === 'offline-2h' }" @click="setTimeFilter('offline-2h')"
              @mouseenter.stop="showTip($event, 'Offline < 2h')" @mouseleave="hideTip">
              <i class="fas fa-hourglass-half"></i>
              <span>2h</span>
            </div>
            <div class="offline-chip" :class="{ active: timeFilter === 'offline-6h' }" @click="setTimeFilter('offline-6h')"
              @mouseenter.stop="showTip($event, 'Offline < 6h')" @mouseleave="hideTip">
              <i class="fas fa-hourglass-end"></i>
              <span>6h</span>
            </div>
            <div class="offline-chip" :class="{ active: timeFilter === 'offline-12h' }" @click="setTimeFilter('offline-12h')"
              @mouseenter.stop="showTip($event, 'Offline < 12h')" @mouseleave="hideTip">
              <i class="fas fa-stopwatch"></i>
              <span>12h</span>
            </div>
            <div class="offline-chip" :class="{ active: timeFilter === 'offline-24h' }" @click="setTimeFilter('offline-24h')"
              @mouseenter.stop="showTip($event, 'Offline < 24h')" @mouseleave="hideTip">
              <i class="fas fa-clock"></i>
              <span>24h</span>
            </div>
            <div v-if="timeFilter" class="offline-chip clear" @click="clearTimeFilter"
              @mouseenter.stop="showTip($event, 'Limpar filtro')" @mouseleave="hideTip">
              <i class="fas fa-times"></i>
            </div>
          </div>
          
          <!-- Threshold configurável -->
          <div class="threshold-config">
            <label class="threshold-label">Threshold customizado (horas):</label>
            <div class="threshold-input-group">
              <input type="number" v-model.number="offlineHoursThreshold" 
                @change="setOfflineHoursThreshold(offlineHoursThreshold)"
                min="1" max="720" class="threshold-input">
              <button class="threshold-apply-btn" @click="setTimeFilter('custom')"
                @mouseenter.stop="showTip($event, 'Aplicar filtro')" @mouseleave="hideTip">
                <i class="fas fa-check"></i> Aplicar
              </button>
            </div>
            <div class="threshold-info">
              <i class="fas fa-info-circle"></i>
              <span>{{ offlineExceedingThreshold }} veículos offline > {{ offlineHoursThreshold }}h</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ETAPA 6B/8B: Seção Estilo (Collapsible, Segmented Control) -->
      <div v-if="!showOnlyActiveControls || estilo !== 'cozy'" class="section-collapsible">
        <div class="section-collapsible__head" @click="toggleSection('estilo')">
          <div class="section-collapsible__title">
            <i class="fas" :class="openSections.estilo ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
            <span>Estilo</span>
          </div>
          <div class="section-collapsible__hint">Densidade da lista</div>
        </div>
        <div v-show="openSections.estilo" class="section-collapsible__body">
          <div class="segmented-control">
            <div class="segmented-btn" :class="{ active: estilo === 'cozy' }" @click="setEstilo('cozy')"
              @mouseenter.stop="showTip($event, 'Conforto')" @mouseleave="hideTip">
              <i class="fas fa-mug-hot"></i>
            </div>
            <div class="segmented-btn" :class="{ active: estilo === 'compact' }" @click="setEstilo('compact')"
              @mouseenter.stop="showTip($event, 'Compacto')" @mouseleave="hideTip">
              <i class="fas fa-th"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== ETAPA 8D: Drawer Mobile para Filtros ===== -->
    <div v-if="isMobile && filtersDrawerOpen" class="filters-drawer-backdrop" @click.self="closeDrawer">
      <div class="filters-drawer">
        <div class="filters-drawer__header">
          <div class="filters-drawer__title">
            <span>Filtros</span>
            <span v-if="activeFiltersCount > 0" class="filter-count-badge">{{ activeFiltersCount }}</span>
          </div>
          <button class="filters-drawer__close" @click="closeDrawer" aria-label="Fechar">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="filters-drawer__actions">
          <label class="filters-ui-toggle-compact">
            <input type="checkbox" v-model="showOnlyActiveControls" @change="saveUIOnlyActiveState">
            <span class="toggle-label-compact">Somente ativos</span>
          </label>
          <button class="btn-clear-compact" :disabled="activeFiltersCount === 0" @click="clearAllFilters">
            <i class="fas fa-trash-alt"></i>
            <span>Limpar</span>
          </button>
        </div>
        
        <div class="filters-drawer__body">
          <!-- Reutilizar as mesmas seções do accordion -->
          <!-- Presets -->
          <div class="section-collapsible mobile">
            <div class="section-collapsible__head" @click="toggleSection('presets')">
              <div class="section-collapsible__title">
                <i class="fas" :class="openSections.presets ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                <span>Presets</span>
              </div>
              <button class="save-preset-btn-compact" @click.stop="saveCurrentPreset">
                <i class="fas fa-save"></i>
              </button>
            </div>
            <div v-show="openSections.presets" class="section-collapsible__body">
              <div class="presets-row">
                <div v-for="preset in defaultPresets" :key="preset.id" class="preset-container">
                  <div class="preset-btn default" @click="applyPreset(preset)">
                    <i :class="preset.icon"></i>
                    <span>{{ preset.name }}</span>
                  </div>
                  <button class="preset-favorite" :class="{ active: isFavorite(preset.id) }" @click="toggleFavorite(preset.id)">
                    <i :class="isFavorite(preset.id) ? 'fas fa-star' : 'far fa-star'"></i>
                  </button>
                </div>
              </div>
              <div v-if="savedPresets.length > 0" class="saved-presets">
                <div class="saved-presets-label">Salvos</div>
                <div v-for="preset in savedPresets" :key="preset.id" class="preset-item">
                  <button class="preset-favorite" :class="{ active: isFavorite(preset.id) }" @click="toggleFavorite(preset.id)">
                    <i :class="isFavorite(preset.id) ? 'fas fa-star' : 'far fa-star'"></i>
                  </button>
                  <div class="preset-btn saved" @click="applyPreset(preset)">
                    <i class="fas fa-bookmark"></i>
                    <span>{{ preset.name }}</span>
                  </div>
                  <button class="preset-remove" @click="removePreset(preset.id)">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Situação -->
          <div v-if="!showOnlyActiveControls || situacaoFilter !== 'todos'" class="section-collapsible mobile">
            <div class="section-collapsible__head" @click="toggleSection('situacao')">
              <div class="section-collapsible__title">
                <i class="fas" :class="openSections.situacao ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                <span>Situação</span>
              </div>
            </div>
            <div v-show="openSections.situacao" class="section-collapsible__body">
              <div class="segmented-control">
                <div class="segmented-btn" :class="{ active: situacaoFilter === 'todos' }" @click="filterDevices('todos')">
                  <i class="fas fa-layer-group"></i>
                </div>
                <div class="segmented-btn" :class="{ active: situacaoFilter === 'ativo' }" @click="filterDevices('ativo')">
                  <i class="fas fa-check-circle"></i>
                </div>
                <div class="segmented-btn" :class="{ active: situacaoFilter === 'estoque' }" @click="filterDevices('estoque')">
                  <i class="fas fa-box-open"></i>
                </div>
                <div class="segmented-btn" :class="{ active: situacaoFilter === 'desativado' }" @click="filterDevices('desativado')">
                  <i class="fas fa-ban"></i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Conectividade -->
          <div v-if="!showOnlyActiveControls || connectivityFilter !== 'todos' || movingOnly" class="section-collapsible mobile">
            <div class="section-collapsible__head" @click="toggleSection('connectivity')">
              <div class="section-collapsible__title">
                <i class="fas" :class="openSections.connectivity ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                <span>Conectividade</span>
              </div>
            </div>
            <div v-show="openSections.connectivity" class="section-collapsible__body">
              <div class="segmented-control">
                <div class="segmented-btn" :class="{ active: connectivityFilter === 'todos' }" @click="setConnectivityFilter('todos')">
                  <i class="fas fa-globe"></i>
                </div>
                <div class="segmented-btn" :class="{ active: connectivityFilter === 'online' }" @click="setConnectivityFilter('online')">
                  <i class="fas fa-check-circle"></i>
                </div>
                <div class="segmented-btn" :class="{ active: connectivityFilter === 'offline' }" @click="setConnectivityFilter('offline')">
                  <i class="fas fa-exclamation-circle"></i>
                </div>
                <div class="segmented-btn" :class="{ active: movingOnly }" @click="toggleMoving">
                  <i class="fas fa-running"></i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- GPS Avançado -->
          <div v-if="!showOnlyActiveControls || gpsBrandFilter || gpsModelFilter || technologyFilter" class="section-collapsible mobile">
            <div class="section-collapsible__head" @click="toggleSection('gps')">
              <div class="section-collapsible__title">
                <i class="fas" :class="openSections.gps ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                <span>GPS Avançado</span>
              </div>
            </div>
            <div v-show="openSections.gps" class="section-collapsible__body">
              <div class="gps-filters-grid">
                <div class="gps-filter-item">
                  <label class="gps-filter-label">Marca</label>
                  <select v-model="gpsBrandFilter" @change="handleGpsBrandFilter($event.target.value)" 
                          class="gps-select brand-select">
                    <option value="">Todas as Marcas</option>
                    <option v-for="brand in gpsBrands" :key="brand" :value="brand">{{ brand }}</option>
                  </select>
                </div>
                <div class="gps-filter-item">
                  <label class="gps-filter-label">Modelo</label>
                  <select v-model="gpsModelFilter" @change="handleGpsModelFilter($event.target.value)" 
                          class="gps-select model-select" :disabled="!gpsBrandFilter">
                    <option value="">Todos os Modelos</option>
                    <option v-for="model in commonGpsModels" :key="model" :value="model">{{ model }}</option>
                  </select>
                </div>
                <div class="gps-filter-item">
                  <label class="gps-filter-label">Tecnologia</label>
                  <select v-model="technologyFilter" @change="handleTechnologyFilter($event.target.value)" 
                          class="gps-select tech-select">
                    <option value="">Todas Tecnologias</option>
                    <option value="GSM">GSM</option>
                    <option value="3G">3G</option>
                    <option value="4G">4G</option>
                    <option value="Satellite">Satélite</option>
                    <option value="LoRa">LoRa</option>
                  </select>
                </div>
                <div v-if="gpsBrandFilter || gpsModelFilter || technologyFilter" class="gps-clear-btn-wrapper">
                  <button class="gps-clear-btn" @click="clearGpsFilters">
                    <i class="fas fa-times"></i> Limpar GPS
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Estilo -->
          <div v-if="!showOnlyActiveControls || estilo !== 'cozy'" class="section-collapsible mobile">
            <div class="section-collapsible__head" @click="toggleSection('estilo')">
              <div class="section-collapsible__title">
                <i class="fas" :class="openSections.estilo ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                <span>Estilo</span>
              </div>
            </div>
            <div v-show="openSections.estilo" class="section-collapsible__body">
              <div class="segmented-control">
                <div class="segmented-btn" :class="{ active: estilo === 'cozy' }" @click="setEstilo('cozy')">
                  <i class="fas fa-mug-hot"></i>
                </div>
                <div class="segmented-btn" :class="{ active: estilo === 'compact' }" @click="setEstilo('compact')">
                  <i class="fas fa-th"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ETAPA 9A: Contador global + Toggle de agrupamento -->
    <div class="devices-counter-row">
      <div class="devices-counter-text">
        <span class="counter-primary">Mostrando {{ displayDevices.length }}</span>
        <span class="counter-secondary"> de {{ totalGlobal }} dispositivos</span>
        <span v-if="groupMode === 'grouped' && groupCount > 0" class="counter-groups">
          • {{ groupCount }} {{ groupCount === 1 ? 'grupo' : 'grupos' }}
        </span>
        <span v-if="groupMode === 'grouped' && groupsWithResults > 0" class="counter-results">
          • {{ groupsWithResults }} com resultados
        </span>
      </div>
      <button class="group-toggle-btn" :class="{ active: groupMode === 'grouped' }" @click="toggleGroupMode"
        @mouseenter.stop="showTip($event, groupMode === 'grouped' ? 'Desagrupar' : 'Agrupar por grupo')" 
        @mouseleave="hideTip">
        <i class="fas fa-layer-group"></i>
        <span>{{ groupMode === 'grouped' ? 'Agrupado' : 'Agrupar' }}</span>
      </button>
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

    <!-- VISUALIZAÇÃO EM CARDS -->
    <div v-if="viewMode === 'card'" class="cards-container" style="overflow-y: scroll; height: calc(100vh - 230px); padding: 12px;">
      <div class="cards-grid">
        <div v-for="device in displayDevices" :key="device.id" 
          class="device-card" 
          :class="{
            'card-online': device.status === 'online',
            'card-offline': device.status === 'offline',
            'card-moving': device.status === 'online' && store.getters['devices/getPosition'](device.id)?.attributes?.motion,
            'card-disabled': device.disabled
          }"
          @click="markerClick(device.id)" 
          @contextmenu.prevent="markerContext($event, device.id)">
          
          <!-- Barra de status lateral -->
          <div class="card-status-bar"></div>
          
          <!-- Conteúdo do card -->
          <div class="card-content">
            <!-- Cabeçalho -->
            <div class="card-header">
              <div class="card-name">{{ device.name }}</div>
              <div class="card-status-icon">
                <i v-if="device.lastUpdate === null" class="fas fa-question-circle" style="color: var(--el-color-info);"></i>
                <i v-else-if="device.status === 'online'" class="fas fa-check-circle" style="color: var(--el-color-success);"></i>
                <i v-else-if="device.status === 'offline'" class="fas fa-exclamation-circle" style="color: var(--el-color-danger);"></i>
                <i v-else class="fas fa-question-circle" style="color: var(--el-color-warning);"></i>
              </div>
            </div>
            
            <!-- ID (admin only) -->
            <div v-if="store.getters['isAdmin']" class="card-id">ID: {{ device.id }}</div>
            
            <!-- Última atualização -->
            <div class="card-update">
              <i class="far fa-clock"></i>
              {{ getLastUpdated(device.lastUpdate, now) }}
            </div>
            
            <!-- Ícones de status -->
            <div v-if="store.getters['devices/getPosition'](device.id)" class="card-icons" :set="position = store.getters['devices/getPosition'](device.id)">
              <!-- Alarme -->
              <div class="card-icon" :class="{ active: position.attributes.alarm }">
                <i class="fas fa-exclamation-triangle" :style="{ color: position.attributes.alarm ? 'var(--el-color-danger)' : 'var(--el-color-info)' }"></i>
              </div>
              
              <!-- Motorista -->
              <div class="card-icon" :class="{ active: position.attributes['driverUniqueId'] }">
                <i class="far fa-id-card" :style="{ 
                  color: position.attributes['driverUniqueId'] ? 'var(--el-color-success)' : 
                         position.attributes['isQrLocked'] ? 'var(--el-color-danger)' : 'var(--el-color-info)'
                }"></i>
              </div>
              
              <!-- Ignição -->
              <div class="card-icon" :class="{ active: position.attributes.ignition === true }">
                <i class="fas fa-key" :style="{ 
                  color: position.attributes.ignition === true ? 'var(--el-color-success)' : 
                         position.attributes.ignition === false ? 'var(--el-color-danger)' : 'var(--el-color-info)'
                }"></i>
              </div>
              
              <!-- Bloqueio -->
              <div class="card-icon" :class="{ active: position.attributes.blocked === false }">
                <i :class="position.attributes.blocked === true ? 'fas fa-lock' : 'fas fa-lock-open'" 
                   :style="{ 
                     color: position.attributes.blocked === true ? 'var(--el-color-danger)' : 
                            position.attributes.blocked === false ? 'var(--el-color-success)' : 'var(--el-color-info)'
                   }"></i>
              </div>
              
              <!-- Movimento -->
              <div class="card-icon" :class="{ active: position.attributes.motion }">
                <i class="fas fa-angle-double-right" :style="{ 
                  color: position.attributes.motion ? 'var(--el-color-primary)' : 'var(--el-color-info)'
                }"></i>
              </div>
            </div>
            
            <!-- Sem posição -->
            <div v-else class="card-no-position">
              <i class="fas fa-eye-slash"></i>
              <span>{{ KT('device.noPosition') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- VISUALIZAÇÃO EM LISTA (original) -->
    <div v-else ref="realDevices" @scroll="realScroll($event)" class="list-container" style="overflow-x: hidden;overflow-y: scroll;height: calc(100vh - 230px);">
      <div class="fakeScroll" :style="{height: (displayDevices.length*33)+'px'}">

        <div v-for="(group) in groupsForRender" :key="group.id" class="group-block">
          <!-- ETAPA 9A/9B PREMIUM: Header de grupo elegante com accordion e contadores -->
          <button 
            v-if="group.id !== -1" 
            class="group-row" 
            :class="{ 'is-open': !collapsedGroups[group.id] }"
            @click="toggleGroupCollapse(group.id)"
            :aria-expanded="!collapsedGroups[group.id]"
            :aria-label="`Grupo ${group.name}, ${group.total} dispositivos, ${group.rendered} exibidos`">
            <i class="fas fa-chevron-right group-row__chev" :class="{ 'rot': !collapsedGroups[group.id] }"></i>
            <i class="fas fa-layer-group group-row__icon"></i>
            <span class="group-row__title">{{ group.name }}</span>
            <div class="group-row__stats">
              <span class="group-row__count">{{ group.total }}</span>
              <span v-if="collapsedGroups[group.id]" class="group-row__subtext">recolhido</span>
              <span v-else class="group-row__subtext">{{ group.rendered }} de {{ group.total }}</span>
            </div>
          </button>

          <!-- Devices do grupo (oculto se collapsed) -->
          <div v-if="group.id === -1 || !collapsedGroups[group.id]" class="group-body">

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

// ETAPA 8B: Accordion state para seções de filtros
const loadOpenSections = () => {
  try {
    const stored = localStorage.getItem('device_filters_open_sections');
    return stored ? JSON.parse(stored) : { presets: true, situacao: false, connectivity: false, gps: false, offline: false, estilo: false };
  } catch (error) {
    return { presets: true, situacao: false, connectivity: false, gps: false, offline: false, estilo: false };
  }
};

const openSections = ref(loadOpenSections());

// ETAPA 8C: Estado para collapse dos KPIs no scroll
const kpisCollapsed = ref(false);
const scrollContainerRef = ref(null);
let scrollAnimationFrame = null;

// ETAPA 8D-A: Deteção de mobile com matchMedia
const isMobile = ref(false);
const mediaQueryList = typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)') : null;
let resizeAnimationFrame = null;

// ETAPA 8D-B: Estado do drawer mobile
const filtersDrawerOpen = ref(false);

// ETAPA 9A: Agrupamento por grupos
const loadGroupMode = () => {
  try {
    const stored = localStorage.getItem('device_group_mode');
    return stored || 'flat'; // 'flat' | 'grouped'
  } catch (error) {
    return 'flat';
  }
};

const loadCollapsedGroups = () => {
  try {
    const stored = localStorage.getItem('device_groups_collapsed');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    return {};
  }
};

const groupMode = ref(loadGroupMode());
const collapsedGroups = ref(loadCollapsedGroups());

const toggleGroupMode = () => {
  groupMode.value = groupMode.value === 'flat' ? 'grouped' : 'flat';
  debouncePersist('device_group_mode', groupMode.value, 150);
};

const toggleGroupCollapse = (groupId) => {
  collapsedGroups.value[groupId] = !collapsedGroups.value[groupId];
  debouncePersist('device_groups_collapsed', JSON.stringify(collapsedGroups.value), 150);
};

// ETAPA 6C: Salvar com debounce
const saveUIOnlyActiveState = () => {
  debouncePersist('device_filters_ui_only_active', showOnlyActiveControls.value, 150);
};

// ETAPA 8B: Funções para controlar accordion de filtros
const toggleSection = (section) => {
  openSections.value[section] = !openSections.value[section];
  saveOpenSections();
};

const saveOpenSections = () => {
  debouncePersist('device_filters_open_sections', JSON.stringify(openSections.value), 150);
};

// ETAPA 8C-C: Handler de scroll para auto-collapse dos KPIs
const handleScrollForKpis = () => {
  if (scrollAnimationFrame) {
    cancelAnimationFrame(scrollAnimationFrame);
  }
  
  scrollAnimationFrame = requestAnimationFrame(() => {
    if (!scrollContainerRef.value) return;
    
    const scrollTop = scrollContainerRef.value.scrollTop;
    
    // Auto-collapse: scroll > 40px => collapse, < 10px => expand
    if (scrollTop > 40 && !kpisCollapsed.value) {
      kpisCollapsed.value = true;
    } else if (scrollTop < 10 && kpisCollapsed.value) {
      kpisCollapsed.value = false;
    }
    
    scrollAnimationFrame = null;
  });
};

// ETAPA 8D-B: Funções para controlar drawer mobile
const openDrawer = () => {
  filtersDrawerOpen.value = true;
  // Forçar KPIs colapsados para economizar espaço
  if (isMobile.value) {
    kpisCollapsed.value = true;
  }
  // Bloquear scroll do body
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden';
  }
};

const closeDrawer = () => {
  filtersDrawerOpen.value = false;
  // Restaurar scroll do body
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }
};

const handleEscKey = (event) => {
  if (event.key === 'Escape' && filtersDrawerOpen.value) {
    closeDrawer();
  }
};

// ETAPA 8D-A: Handler de resize com rAF debounce
const handleMediaChange = () => {
  if (resizeAnimationFrame) {
    cancelAnimationFrame(resizeAnimationFrame);
  }
  
  resizeAnimationFrame = requestAnimationFrame(() => {
    if (mediaQueryList) {
      isMobile.value = mediaQueryList.matches;
      // Fechar drawer ao mudar para desktop
      if (!isMobile.value && filtersDrawerOpen.value) {
        closeDrawer();
      }
    }
    resizeAnimationFrame = null;
  });
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

// FILTRO OFFLINE CONFIGURÁVEL (Cliente pediu)
const offlineHoursThreshold = ref(parseInt(localStorage.getItem('device_offline_hours_threshold') || '24', 10));
const timeFilter = ref(''); // Para chips rápidos: offline-1h, offline-2h, etc

// MODO DE VISUALIZAÇÃO: list ou card
const viewMode = ref(localStorage.getItem('device_view_mode') || 'list'); // 'list' | 'card'


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

// ETAPA 8C-A: Helper robusto para detectar admin (múltiplos caminhos)
const isAdminUser = computed(() => {
  // Tentar múltiplos caminhos conhecidos (ordem de prioridade)
  if (store.state.auth?.administrator !== undefined) {
    return !!store.state.auth.administrator;
  }
  if (store.state.session?.user?.administrator !== undefined) {
    return !!store.state.session.user.administrator;
  }
  try {
    const sessionUser = store.getters['session/user'];
    if (sessionUser?.administrator !== undefined) {
      return !!sessionUser.administrator;
    }
  } catch (e) {
    // Getter session/user não existe ou não está disponível, tentar próximo caminho
  }
  try {
    if (store.getters['auth/isAdmin'] !== undefined) {
      return !!store.getters['auth/isAdmin'];
    }
  } catch (e) {
    // Getter auth/isAdmin não existe, tentar próximo caminho
  }
  try {
    if (store.getters['session/isAdmin'] !== undefined) {
      return !!store.getters['session/isAdmin'];
    }
  } catch (e) {
    // Getter session/isAdmin não existe, usar fallback
  }
  if (store.state.user?.administrator !== undefined) {
    return !!store.state.user.administrator;
  }
  // TODO: Verificar qual caminho está ativo no store após testes de produção
  // Fallback seguro: não mostrar KPIs se não conseguir determinar permissão
  return false;
});

const canSeeKpis = computed(() => isAdminUser.value);

// ETAPA 6A/8C-B: KPI Summary Computeds (Shown = filtrado atual, Global = base antes de situacao/connectivity filters)
const totalShown = computed(() => {
  return displayDevices.value.length;
});

const totalGlobal = computed(() => {
  return filteredDevices.value.length;
});

// ETAPA 9A: Computeds de agrupamento
const groupNameMap = computed(() => {
  const map = {};
  if (store.state.groups && store.state.groups.groupList) {
    store.state.groups.groupList.forEach(g => {
      map[g.id] = g.name;
    });
  }
  return map;
});

const devicesByGroup = computed(() => {
  const grouped = {};
  displayDevices.value.forEach(device => {
    const groupId = device.groupId || 0; // 0 = sem grupo
    if (!grouped[groupId]) {
      grouped[groupId] = [];
    }
    grouped[groupId].push(device);
  });
  return grouped;
});

const groupsForRender = computed(() => {
  if (groupMode.value === 'flat') {
    return [{ 
      id: -1, 
      name: '', 
      total: displayDevices.value.length,
      rendered: chunkedDisplayDevices.value.length,
      count: displayDevices.value.length, 
      devices: chunkedDisplayDevices.value 
    }];
  }
  
  const grouped = devicesByGroup.value;
  const groups = [];
  
  // Sem grupo sempre primeiro (se tiver itens)
  if (grouped[0] && grouped[0].length > 0) {
    const isCollapsed = collapsedGroups.value[0];
    groups.push({
      id: 0,
      name: 'Sem grupo',
      total: grouped[0].length,
      rendered: isCollapsed ? 0 : grouped[0].length,
      count: grouped[0].length,
      devices: grouped[0]
    });
  }
  
  // Demais grupos ordenados por nome (ocultar grupos com 0 itens)
  Object.keys(grouped)
    .filter(id => id !== '0')
    .filter(id => grouped[id].length > 0) // ETAPA 9B: ocultar grupos vazios
    .sort((a, b) => {
      const nameA = groupNameMap.value[a] || `Grupo ${a}`;
      const nameB = groupNameMap.value[b] || `Grupo ${b}`;
      return nameA.localeCompare(nameB);
    })
    .forEach(groupId => {
      const isCollapsed = collapsedGroups.value[groupId];
      groups.push({
        id: parseInt(groupId),
        name: groupNameMap.value[groupId] || `Grupo ${groupId}`,
        total: grouped[groupId].length,
        rendered: isCollapsed ? 0 : grouped[groupId].length,
        count: grouped[groupId].length,
        devices: grouped[groupId]
      });
    });
  
  return groups;
});

const groupCount = computed(() => {
  if (groupMode.value === 'flat') return 0;
  return groupsForRender.value.filter(g => g.id !== -1).length;
});

// ETAPA 9B: Contar grupos com resultados (total > 0)
const groupsWithResults = computed(() => {
  if (groupMode.value === 'flat') return 0;
  return groupsForRender.value.filter(g => g.id !== -1 && g.total > 0).length;
});

const onlineCount = computed(() => {
  return displayDevices.value.filter(device => {
    return getDeviceConnectivity(device) === 'online';
  }).length;
});

const onlineCountGlobal = computed(() => {
  return filteredDevices.value.filter(device => {
    return getDeviceConnectivity(device) === 'online';
  }).length;
});

const offlineCount = computed(() => {
  return displayDevices.value.filter(device => {
    return getDeviceConnectivity(device) === 'offline';
  }).length;
});

const offlineCountGlobal = computed(() => {
  return filteredDevices.value.filter(device => {
    return getDeviceConnectivity(device) === 'offline';
  }).length;
});

const movingCount = computed(() => {
  return displayDevices.value.filter(device => {
    return getDeviceMoving(device);
  }).length;
});

const movingCountGlobal = computed(() => {
  return filteredDevices.value.filter(device => {
    return getDeviceMoving(device);
  }).length;
});

const ativoCount = computed(() => {
  return displayDevices.value.filter(device => {
    const situacao = device.attributes?.['situacao']?.toLowerCase();
    return situacao === 'ativo';
  }).length;
});

const ativoCountGlobal = computed(() => {
  return filteredDevices.value.filter(device => {
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

const estoqueCountGlobal = computed(() => {
  return filteredDevices.value.filter(device => {
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

const desativadoCountGlobal = computed(() => {
  return filteredDevices.value.filter(device => {
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
  if (isMobile.value) {
    // Mobile: abrir drawer
    if (filtersDrawerOpen.value) {
      closeDrawer();
    } else {
      openDrawer();
    }
  } else {
    // Desktop: toggle accordion inline
    showFiltersPanel.value = !showFiltersPanel.value;
  }
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
  const position = store.getters['devices/getPosition'](device.id);
  return !!position?.attributes?.motion;
};

// FUNÇÕES PARA FILTRO OFFLINE CONFIGURÁVEL
const setOfflineHoursThreshold = (hours) => {
  offlineHoursThreshold.value = hours;
  debouncePersist('device_offline_hours_threshold', hours, 150);
};

const setTimeFilter = (cmd) => {
  timeFilter.value = cmd;
  switch (cmd) {
    case 'offline-1h':
      query.value = 'last:-1 horas';
      break;
    case 'offline-2h':
      query.value = 'last:-2 horas';
      break;
    case 'offline-6h':
      query.value = 'last:-6 horas';
      break;
    case 'offline-12h':
      query.value = 'last:-12 horas';
      break;
    case 'offline-24h':
      query.value = 'last:-24 horas';
      break;
    case 'custom':
      // Usar threshold configurável
      query.value = `last:-${offlineHoursThreshold.value} horas`;
      break;
  }
};

const clearTimeFilter = () => {
  timeFilter.value = '';
  if (/^last:/.test(String(query.value || ''))) query.value = '';
};

// Contar veículos offline além do threshold configurável
const offlineExceedingThreshold = computed(() => {
  const ordered = store.getters['devices/getOrderedDevices'] || [];
  const thresholdMs = offlineHoursThreshold.value * 3600000; // horas para ms
  let count = 0;
  
  for (const dk of ordered) {
    const d = store.getters['devices/getDevice'](dk);
    if (!d) continue;
    
    if (d.status === 'offline' && d.lastUpdate) {
      const offlineTime = Date.now() - new Date(d.lastUpdate).getTime();
      if (offlineTime > thresholdMs) {
        count++;
      }
    }
  }
  
  return count;
});

// FUNÇÃO PARA TOGGLE VIEW MODE
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'card' : 'list';
  debouncePersist('device_view_mode', viewMode.value, 150);
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
watch(visibleDeviceIds, (newIds) => {
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
  
  // ETAPA 8C-C: Listener para auto-collapse KPIs no scroll
  setTimeout(() => {
    const container = document.querySelector('.devices-page > div[style*="border"]');
    if (container) {
      scrollContainerRef.value = container;
      container.addEventListener('scroll', handleScrollForKpis);
    }
  }, 300);
  
  // ETAPA 8D-A/B: Listeners para mobile e ESC
  if (mediaQueryList) {
    isMobile.value = mediaQueryList.matches;
    mediaQueryList.addEventListener('change', handleMediaChange);
  }
  document.addEventListener('keydown', handleEscKey);
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
  
  // ETAPA 8C-C: Limpar scroll listener e animation frame
  if (scrollContainerRef.value) {
    scrollContainerRef.value.removeEventListener('scroll', handleScrollForKpis);
  }
  if (scrollAnimationFrame) {
    cancelAnimationFrame(scrollAnimationFrame);
  }
  
  // ETAPA 8D: Cleanup drawer e mobile listeners
  if (mediaQueryList) {
    mediaQueryList.removeEventListener('change', handleMediaChange);
  }
  document.removeEventListener('keydown', handleEscKey);
  if (resizeAnimationFrame) {
    cancelAnimationFrame(resizeAnimationFrame);
  }
  // Garantir que body overflow seja restaurado
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
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
  /* ETAPA 8C-C: Sticky header */
  position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.95);
  backdrop-filter:blur(8px);padding:8px 0;margin-top:-8px;
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

/* =========================== ETAPA 8B: KPI MINI-CARDS COMPACTOS =========================== */
.kpi-grid-compact{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:6px;
  margin-bottom:10px;padding:0;
}

@media (max-width: 768px) {
  .kpi-grid-compact{
    grid-template-columns:repeat(2,1fr);
    gap: 8px;
  }
  
  .kpi-mini {
    padding: 10px 8px;
    gap: 6px;
  }
  
  .kpi-mini__value {
    font-size: 15px;
  }
  
  .kpi-mini__label {
    font-size: 11px;
  }
  
  .kpi-mini__icon {
    font-size: 16px;
  }
}

@media (max-width: 420px) {
  .kpi-grid-compact{
    grid-template-columns:repeat(2,1fr);
    gap: 6px;
  }
  
  .kpi-mini {
    padding: 8px 6px;
    gap: 4px;
    border-left-width: 3px;
  }
  
  .kpi-mini__value {
    font-size: 14px;
  }
  
  .kpi-mini__label {
    font-size: 10px;
  }
  
  .kpi-mini__icon {
    font-size: 14px;
  }
  
  .kpi-mini__total {
    font-size: 10px;
  }
}

.kpi-mini{
  display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fff;
  border:1px solid #e9eef6;border-radius:6px;cursor:pointer;
  transition:all .2s ease;box-shadow:0 1px 2px rgba(0,0,0,.03);
  border-left-width:4px;
}

.kpi-mini--online{
  border-left-color:#67c23a;
}

.kpi-mini--offline{
  border-left-color:#f56c6c;
}

.kpi-mini:hover{
  border-color:#a0cfff;box-shadow:0 2px 6px rgba(64,158,255,.08);
}

.kpi-mini--online:hover{
  border-left-color:#67c23a;
}

.kpi-mini--offline:hover{
  border-left-color:#f56c6c;
}

.kpi-mini.active{
  border-color:#409EFF;background:#f0f9ff;
  box-shadow:0 0 0 2px rgba(64,158,255,.15);
}

.kpi-mini--online.active{
  border-left-color:#67c23a;
  background:#f0fdf4;
}

.kpi-mini--offline.active{
  border-left-color:#f56c6c;
  background:#fef2f2;
}

.kpi-mini.total{
  cursor:default;background:#f9fafb;
  border-color:#e5e7eb;
}

.kpi-mini.total:hover{
  box-shadow:0 1px 2px rgba(0,0,0,.03);border-color:#e5e7eb;
}

.kpi-mini__icon{
  font-size:20px;
  width:28px;
  height:28px;
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
  flex-shrink:0;
}

.kpi-mini__icon.online{color:#67c23a !important;}
.kpi-mini__icon.offline{color:#f56c6c !important;}
.kpi-mini__icon.moving{color:#409EFF;}
.kpi-mini__icon.ativo{color:#16a34a;}
.kpi-mini__icon.estoque{color:#64748b;}
.kpi-mini__icon.desativado{color:#ef4444;}
.kpi-mini.total .kpi-mini__icon{color:#6b7280;}

.kpi-mini__content{
  display:flex;flex-direction:column;gap:1px;flex:1;min-width:0;
}

.kpi-mini__value{
  font-size:16px;font-weight:700;color:#303133;line-height:1.2;
}

.kpi-mini__label{
  font-size:10px;color:#909399;font-weight:500;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}

.kpi-mini__total{
  font-size:12px;color:#909399;font-weight:400;margin-left:2px;
}

/* ETAPA 8C-C: Collapsed state (reduz altura) */
.kpi-grid-compact.kpi-collapsed{
  max-height:32px;overflow:hidden;opacity:0.6;
  transition:max-height .3s ease, opacity .3s ease;
}

.kpi-grid-compact.kpi-collapsed:hover{
  opacity:0.9;
}

.kpi-mini__total{
  font-size:12px;color:#909399;font-weight:400;margin-left:2px;
}

/* ETAPA 8C-C: Collapsed state (reduz altura) */
.kpi-grid-compact.kpi-collapsed{
  max-height:32px;overflow:hidden;opacity:0.6;
  transition:max-height .3s ease, opacity .3s ease;
}

.kpi-grid-compact.kpi-collapsed:hover{
  opacity:0.9;
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

/* =========================== ETAPA 8B: FILTERS ACCORDION (COMPACTO) =========================== */
.filters-accordion{
  background:#fafbfc;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,.06);
  margin-top:5px;margin-bottom:8px;padding:8px;
  transition:all .3s ease;animation:fadeIn .3s ease;
}

.filters-accordion__header{
  display:flex;justify-content:space-between;align-items:center;
  padding:6px 8px;margin-bottom:8px;border-bottom:1px solid #e9eef6;
}

.filters-accordion__title{
  display:flex;align-items:center;gap:6px;
  font-size:13px;font-weight:600;color:#303133;
}

.filter-count-badge{
  display:inline-flex;align-items:center;justify-content:center;
  min-width:18px;height:18px;padding:0 5px;
  background:#409EFF;color:#fff;border-radius:9px;
  font-size:10px;font-weight:700;line-height:1;
}

.filters-accordion__actions{
  display:flex;align-items:center;gap:8px;
}

.filters-ui-toggle-compact{
  display:flex;align-items:center;gap:5px;cursor:pointer;user-select:none;
}

.filters-ui-toggle-compact input[type="checkbox"]{
  width:13px;height:13px;cursor:pointer;accent-color:#409EFF;
}

.toggle-label-compact{
  font-size:10px;color:#606266;font-weight:500;
}

.filters-ui-toggle-compact:hover .toggle-label-compact{
  color:#409EFF;
}

.btn-clear-compact{
  background:transparent;border:none;color:#f56c6c;
  font-size:11px;padding:4px 6px;cursor:pointer;border-radius:4px;
  transition:all .2s ease;
}

.btn-clear-compact:hover:not(:disabled){
  background:rgba(245,108,108,.1);
}

.btn-clear-compact:disabled{
  color:#c0c4cc;cursor:not-allowed;opacity:.5;
}

/* =========================== SECTION COLLAPSIBLE =========================== */
.section-collapsible{
  background:#fff;border-radius:5px;padding:8px 10px;margin-bottom:6px;
  border:1px solid #e9eef6;transition:all .2s ease;
}

.section-collapsible:hover{
  border-color:#d4dce9;
}

.section-collapsible__head{
  display:flex;justify-content:space-between;align-items:center;
  cursor:pointer;user-select:none;padding:2px 0;
}

.section-collapsible__title{
  display:flex;align-items:center;gap:6px;
  font-size:11px;font-weight:600;color:#409EFF;flex:1;
}

.section-collapsible__title i{
  font-size:10px;transition:transform .2s ease;
}

.section-collapsible__hint{
  font-size:9px;color:#909399;font-style:italic;opacity:.8;
  margin-left:auto;margin-right:8px;
}

.section-collapsible__body{
  padding-top:8px;
  animation:slideDown .25s ease;
}

@keyframes slideDown {
  from {
    opacity:0;transform:translateY(-4px);
  }
  to {
    opacity:1;transform:translateY(0);
  }
}

.save-preset-btn-compact{
  background:transparent;border:none;color:#409EFF;
  font-size:12px;padding:2px 6px;cursor:pointer;border-radius:3px;
  transition:all .2s ease;
}

.save-preset-btn-compact:hover{
  background:rgba(64,158,255,.1);
}

/* =========================== SEGMENTED CONTROL (MINI) =========================== */
.segmented-control{
  display:flex;gap:4px;flex-wrap:wrap;
}

.segmented-btn{
  flex:1;min-width:50px;display:flex;align-items:center;justify-content:center;
  padding:6px 10px;background:#f5f7fa;border:1px solid #dcdfe6;
  border-radius:4px;cursor:pointer;transition:all .2s ease;
  font-size:14px;color:#606266;
}

.segmented-btn:hover{
  background:#ecf5ff;border-color:#b3d8ff;color:#409EFF;
}

.segmented-btn.active{
  background:#ecf5ff;border-color:#409EFF;color:#409EFF;
  box-shadow:0 0 0 2px rgba(64,158,255,.1);font-weight:600;
}

.segmented-btn i{
  font-size:13px;
}

/* =========================== GPS AVANÇADO =========================== */
.gps-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  align-items: start;
}

.gps-filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gps-filter-label {
  font-size: 11px;
  font-weight: 600;
  color: #606266;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.gps-select {
  padding: 6px 10px;
  font-size: 13px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}

.gps-select:hover:not(:disabled) {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.gps-select:focus:not(:disabled) {
  border-color: #409EFF;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
}

.gps-select:disabled {
  background: #f5f7fa;
  color: #c0c4cc;
  cursor: not-allowed;
}

.gps-clear-btn-wrapper {
  display: flex;
  align-items: flex-end;
  grid-column: span 2;
}

.gps-clear-btn {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #F56C6C;
  background: rgba(245, 108, 108, 0.1);
  border: 1px solid rgba(245, 108, 108, 0.2);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.gps-clear-btn:hover {
  background: rgba(245, 108, 108, 0.15);
  border-color: #F56C6C;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(245, 108, 108, 0.2);
}

.gps-clear-btn i {
  font-size: 11px;
}

/* =========================== FILTROS OFFLINE =========================== */
.offline-chips-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.offline-chip {
  flex: 1;
  min-width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 6px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
  color: #606266;
}

.offline-chip i {
  font-size: 14px;
}

.offline-chip span {
  font-weight: 600;
  font-size: 10px;
}

.offline-chip:hover {
  background: #ecf5ff;
  border-color: #409EFF;
  color: #409EFF;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.offline-chip.active {
  background: #409EFF;
  border-color: #409EFF;
  color: #fff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.offline-chip.clear {
  background: rgba(245, 108, 108, 0.1);
  border-color: rgba(245, 108, 108, 0.3);
  color: #F56C6C;
}

.offline-chip.clear:hover {
  background: rgba(245, 108, 108, 0.2);
  border-color: #F56C6C;
}

.threshold-config {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.threshold-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.threshold-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.threshold-input {
  flex: 1;
  padding: 6px 10px;
  font-size: 13px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #606266;
  outline: none;
  transition: all 0.2s ease;
}

.threshold-input:focus {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.threshold-apply-btn {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background: #409EFF;
  border: 1px solid #409EFF;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.threshold-apply-btn:hover {
  background: #66b1ff;
  border-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

.threshold-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #909399;
  padding: 6px 8px;
  background: #fff;
  border-radius: 4px;
}

.threshold-info i {
  color: #409EFF;
}

/* KPI Offline Critical */
.kpi-mini--offline-critical {
  border-left-width: 4px;
  border-left-color: #F56C6C;
}

.kpi-mini--offline-critical.active {
  background: #fef2f2;
  border-color: #F56C6C;
}

/* View Mode Button */
.view-mode-btn {
  background: #fff;
  border-color: #dcdfe6;
  color: #606266;
}

.view-mode-btn:hover {
  background: #ecf5ff;
  border-color: #409EFF;
  color: #409EFF;
}

@media (max-width: 640px) {
  .offline-chips-row {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .threshold-input-group {
    flex-direction: column;
  }
}

/* ========================= CARDS VIEW STYLES ========================= */

.cards-container {
  background: #f5f7fa;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 4px;
}

.device-card {
  position: relative;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.06);
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  animation: fadeInUp 0.4s ease-out;
}

.device-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(16, 24, 40, 0.12);
  border-color: #3b82f6;
}

.device-card:active {
  transform: translateY(-2px);
}

/* Barra de status lateral colorida */
.card-status-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  background: #e5e7eb;
  transition: background 0.3s ease;
}

.device-card.card-online .card-status-bar {
  background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
}

.device-card.card-moving .card-status-bar {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  animation: pulseGlow 2s ease-in-out infinite;
}

.device-card.card-offline .card-status-bar {
  background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
}

.device-card.card-disabled {
  opacity: 0.6;
  filter: grayscale(30%);
}

/* Conteúdo do card */
.card-content {
  padding: 16px;
  padding-left: 20px;
}

/* Cabeçalho do card */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 12px;
}

.card-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
  flex: 1;
  word-break: break-word;
}

.card-status-icon {
  font-size: 20px;
  flex-shrink: 0;
  line-height: 1;
}

/* ID do dispositivo */
.card-id {
  font-size: 11px;
  color: #6b7280;
  font-family: 'Courier New', monospace;
  margin-bottom: 8px;
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 6px;
  display: inline-block;
}

/* Última atualização */
.card-update {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-update i {
  opacity: 0.7;
}

/* Ícones de status */
.card-icons {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  justify-content: space-around;
}

.card-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f9fafb;
  transition: all 0.2s ease;
  font-size: 16px;
}

.card-icon:hover {
  background: #f3f4f6;
  transform: scale(1.1);
}

.card-icon.active {
  background: #e0f2fe;
  box-shadow: 0 0 0 2px #bae6fd;
}

/* Sem posição */
.card-no-position {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef3c7;
  border-radius: 8px;
  color: #92400e;
  font-size: 13px;
  margin-top: 8px;
}

.card-no-position i {
  font-size: 16px;
  opacity: 0.7;
}

/* Animações para cards */
@keyframes cardPulse {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(16, 24, 40, 0.06);
  }
  50% {
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
  }
}

.device-card.card-moving {
  animation: fadeInUp 0.4s ease-out, cardPulse 3s ease-in-out infinite;
}

/* Responsivo - cards */
@media (max-width: 768px) {
  .cards-container {
    padding: 8px;
  }
  
  .cards-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 10px;
  }
  
  .card-content {
    padding: 12px;
    padding-left: 16px;
  }
  
  .card-header {
    gap: 8px;
  }
  
  .card-name {
    font-size: 15px;
  }
  
  .card-update {
    font-size: 12px;
  }
  
  .card-icons {
    gap: 6px;
  }
  
  .card-icon {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
}

@media (max-width: 640px) {
  .cards-container {
    padding: 6px;
    height: calc(100vh - 200px) !important;
  }
  
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .device-card {
    border-radius: 10px;
  }
  
  .card-content {
    padding: 10px;
    padding-left: 14px;
  }
  
  .card-status-bar {
    width: 4px;
  }
}

@media (max-width: 420px) {
  .cards-container {
    padding: 4px;
    height: calc(100vh - 180px) !important;
  }
  
  .cards-grid {
    gap: 6px;
  }
  
  .device-card {
    border-radius: 8px;
  }
  
  .card-content {
    padding: 8px;
    padding-left: 12px;
  }
  
  .card-header {
    margin-bottom: 6px;
  }
  
  .card-name {
    font-size: 14px;
    line-height: 1.3;
  }
  
  .card-status-icon {
    font-size: 16px;
  }
  
  .card-id {
    font-size: 10px;
    padding: 3px 6px;
    margin-bottom: 6px;
  }
  
  .card-update {
    font-size: 11px;
    margin-bottom: 8px;
  }
  
  .card-icons {
    gap: 4px;
    padding-top: 8px;
  }
  
  .card-icon {
    width: 28px;
    height: 28px;
    font-size: 13px;
  }
  
  .card-no-position {
    padding: 8px;
    font-size: 12px;
  }
}

@media (max-width: 640px) {
  .cards-container {
    padding: 6px;
    height: calc(100vh - 200px) !important;
  }
  
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .device-card {
    border-radius: 10px;
  }
  
  .card-content {
    padding: 10px;
    padding-left: 14px;
  }
  
  .card-status-bar {
    width: 4px;
  }
}

@media (max-width: 420px) {
  .cards-container {
    padding: 4px;
    height: calc(100vh - 180px) !important;
  }
  
  .cards-grid {
    gap: 6px;
  }
  
  .device-card {
    border-radius: 8px;
  }
  
  .card-content {
    padding: 8px;
    padding-left: 12px;
  }
  
  .card-header {
    margin-bottom: 6px;
  }
  
  .card-name {
    font-size: 14px;
    line-height: 1.3;
  }
  
  .card-status-icon {
    font-size: 16px;
  }
  
  .card-id {
    font-size: 10px;
    padding: 3px 6px;
    margin-bottom: 6px;
  }
  
  .card-update {
    font-size: 11px;
    margin-bottom: 8px;
  }
  
  .card-icons {
    gap: 4px;
    padding-top: 8px;
  }
  
  .card-icon {
    width: 28px;
    height: 28px;
    font-size: 13px;
  }
  
  .card-no-position {
    padding: 8px;
    font-size: 12px;
  }
}

@media (max-width: 640px) {
  .gps-filters-grid {
    grid-template-columns: 1fr;
  }
  
  .gps-clear-btn-wrapper {
    grid-column: span 1;
  }
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

/* =========================== ETAPA 9A: CONTADOR + AGRUPAMENTO =========================== */
.devices-counter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  margin-top: 8px;
  gap: 12px;
}

.devices-counter-text {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  flex-wrap: wrap;
}

.counter-primary {
  font-weight: 700;
  color: var(--el-color-primary);
  font-size: 13px;
}

.counter-secondary {
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.counter-groups {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 600;
  margin-left: 4px;
}

.counter-results {
  color: #67c23a;
  font-size: 11px;
  font-weight: 600;
  margin-left: 4px;
}

.group-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: #ffffff;
  color: var(--el-text-color-regular);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.group-toggle-btn:hover {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  transform: translateY(-1px);
}

.group-toggle-btn.active {
  background: linear-gradient(135deg, var(--el-color-primary) 0%, #764ba2 100%);
  border-color: var(--el-color-primary);
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

.group-toggle-btn.active:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.4);
}

.group-toggle-btn i {
  font-size: 12px;
}

/* Header de grupo PREMIUM (ETAPA 9A BÔNUS) */
.group-block {
  margin-bottom: 8px;
}

.group-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #e9eef6;
  border-radius: 10px;
  background: #fbfcfe;
  transition: transform 0.12s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  user-select: none;
  cursor: pointer;
  font-family: inherit;
  width: 100%;
  text-align: left;
  margin-bottom: 6px;
}

.group-row:hover {
  background: #ffffff;
  border-color: #dbe7fb;
  box-shadow: 0 6px 18px rgba(31, 45, 61, 0.06);
  transform: translateY(-1px);
}

.group-row:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.18);
}

.group-row.is-open {
  border-color: #cfe3ff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.10);
  background: #f7fbff;
}

.group-row.is-open:hover {
  transform: translateY(0);
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15), 0 4px 12px rgba(31, 45, 61, 0.08);
}

.group-row__chev {
  font-size: 11px;
  color: #909399;
  transition: transform 0.18s ease, color 0.15s ease;
  flex-shrink: 0;
}

.group-row__chev.rot {
  transform: rotate(90deg);
  color: #409eff;
}

.group-row__icon {
  font-size: 13px;
  color: #606266;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.group-row.is-open .group-row__icon {
  color: #409eff;
}

.group-row__title {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-row__stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  margin-left: auto;
  flex-shrink: 0;
}

.group-row__count {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #ecf5ff;
  color: #409eff;
  border: 1px solid #d9ecff;
  font-weight: 700;
  min-width: 34px;
  text-align: center;
  transition: all 0.15s ease;
}

.group-row__subtext {
  font-size: 9px;
  color: #909399;
  font-weight: 500;
  text-align: right;
  line-height: 1;
}

.group-row:hover .group-row__count {
  background: #e1f0ff;
  border-color: #b3d8ff;
}

.group-row.is-open .group-row__count {
  background: linear-gradient(135deg, #409eff 0%, #6bb0ff 100%);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.25);
}

.group-body {
  padding: 6px 0 8px 0;
}

/* =========================== LISTA - MOBILE ADJUSTMENTS =========================== */
@media (max-width: 640px) {
  .list-container {
    height: calc(100vh - 200px) !important;
  }
  
  .deviceHead {
    padding: 6px 8px !important;
  }
  
  .deviceHead .name {
    font-size: 11px !important;
  }
}

@media (max-width: 420px) {
  .list-container {
    height: calc(100vh - 180px) !important;
  }
  
  .device {
    padding: 6px 8px !important;
    min-height: 28px !important;
  }
  
  .device .name {
    font-size: 12px !important;
    padding: 2px 4px !important;
  }
  
  .icons {
    gap: 4px !important;
  }
  
  .icons div {
    width: 20px !important;
    height: 20px !important;
  }
  
  .icons div i {
    font-size: 11px !important;
  }
  
  .group-row {
    padding: 8px 10px !important;
  }
  
  .group-row__title {
    font-size: 13px !important;
  }
  
  .group-row__count {
    font-size: 10px !important;
    padding: 2px 6px !important;
    min-width: 28px !important;
  }
  
  .group-row__subtext {
    font-size: 8px !important;
  }
}

/* =========================== RESPONSIVIDADE =========================== */
@media (max-width: 640px) {
  .search-row {
    gap: 8px;
    padding: 8px 10px;
  }
  
  .search-input {
    font-size: 15px;
  }
  
  .search-input :deep(.el-input__wrapper) {
    height: 36px;
    padding-left: 8px;
    padding-right: 10px;
  }
  
  .filter-toggle-button {
    width: 32px;
    height: 32px;
  }
  
  .filter-toggle-button i {
    font-size: 16px;
  }
  
  .actions-group {
    gap: 8px;
  }
  
  .search-row .el-button {
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
    padding: 0 !important;
  }
  
  .search-row .el-button i {
    font-size: 16px;
  }
  
  .view-mode-btn,
  .export-btn,
  .share-link-btn,
  .add-btn {
    font-size: 16px !important;
  }
}

@media (max-width:420px){
  .search-row{gap:6px;flex-wrap:nowrap !important; padding: 6px 8px;}
  .search-input{font-size:14px;flex:1 1 auto;min-width:0;}
  .search-input :deep(.el-input__wrapper){height:34px;padding-left:8px;padding-right:8px;}
  .search-input :deep(.el-input__prefix){padding-left:2px;}
  .filter-toggle-button {
    width: 30px;
    height: 30px;
  }
  .filter-toggle-button i {
    font-size: 15px;
  }
  .actions-group{gap:6px;flex-shrink:0;margin-left:auto;}
  .search-row .el-button{width:34px !important;height:34px !important;min-width:34px !important; padding: 0 !important;}
  .search-row .el-button i {
    font-size: 15px;
  }
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

/* =========================== ETAPA 8D: MOBILE DRAWER =========================== */
/* Backdrop com fade suave */
.filters-drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1000;
  animation: backdropFadeIn 0.3s ease-out;
}

@keyframes backdropFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Drawer desliza de baixo com bounce sutil */
.filters-drawer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85vh;
  background: #ffffff;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: drawerSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@keyframes drawerSlideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Header fixo do drawer */
.filters-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.filters-drawer__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.filters-drawer__close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: var(--el-text-color-regular);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 16px;
}

.filters-drawer__close:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
}

/* Ações compactas (Somente ativos + Limpar) */
.filters-drawer__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  background: #fafafa;
}

.filters-ui-toggle-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  user-select: none;
}

.filters-ui-toggle-compact input {
  cursor: pointer;
  width: 14px;
  height: 14px;
}

.toggle-label-compact {
  font-weight: 500;
}

.btn-clear-compact {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #f56c6c 0%, #e84749 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(245, 108, 108, 0.3);
}

.btn-clear-compact:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 108, 108, 0.4);
}

.btn-clear-compact:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Corpo com scroll */
.filters-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 16px;
  overscroll-behavior: contain;
}

/* Seções colapsáveis mobile (densidade reduzida) */
.section-collapsible.mobile {
  background: #ffffff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
}

.section-collapsible.mobile .section-collapsible__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  background: #fafafa;
  transition: all 0.2s;
  user-select: none;
}

.section-collapsible.mobile .section-collapsible__head:active {
  background: #f0f0f0;
}

.section-collapsible.mobile .section-collapsible__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-collapsible.mobile .section-collapsible__title i {
  font-size: 11px;
  transition: transform 0.2s;
  color: var(--el-color-primary);
}

.section-collapsible.mobile .section-collapsible__body {
  padding: 12px;
  background: #ffffff;
}

/* Botão salvar preset compacto */
.save-preset-btn-compact {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: linear-gradient(135deg, #67c23a 0%, #529b2e 100%);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(103, 194, 58, 0.3);
}

.save-preset-btn-compact:hover {
  transform: scale(1.08);
  box-shadow: 0 3px 6px rgba(103, 194, 58, 0.4);
}

/* Ajustes de densidade mobile */
@media (max-width: 768px) {
  .section-collapsible.mobile .section-collapsible__head {
    padding: 8px 10px;
  }
  
  .section-collapsible.mobile .section-collapsible__title {
    font-size: 12px;
    gap: 6px;
  }
  
  .section-collapsible.mobile .section-collapsible__body {
    padding: 10px;
  }
  
  .segmented-control {
    gap: 4px;
  }
  
  .segmented-btn {
    padding: 6px 8px;
    font-size: 11px;
  }
  
  .preset-container {
    gap: 4px;
  }
  
  .preset-btn {
    padding: 6px 10px;
    font-size: 11px;
  }
  
  .saved-presets-label {
    font-size: 10px;
    padding: 4px 8px;
  }
  
  .preset-item {
    gap: 6px;
    padding: 4px;
  }
}

/* =========================== ANIMAÇÕES E MICRO-INTERAÇÕES =========================== */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Aplicar animações */
.filters-accordion {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.section-collapsible {
  animation: slideInRight 0.3s ease-out;
  transition: all 0.3s ease;
}

.section-collapsible:hover {
  transform: translateY(-2px);
}

/* Melhorias nos filtros */
.segmented-btn {
  position: relative;
  overflow: hidden;
}

.segmented-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.segmented-btn:hover::before {
  left: 100%;
}

.segmented-btn:hover {
  transform: translateY(-2px) scale(1.02);
}

.segmented-btn.active {
  animation: pulseGlow 2s infinite;
}

/* Melhorias nos selects GPS */
.gps-select:focus:not(:disabled) {
  animation: bounceIn 0.6s ease-out;
}

/* Micro-interações nos botões */
.add-btn,
.export-btn,
.share-link-btn,
.gps-clear-btn {
  position: relative;
  overflow: hidden;
}

.add-btn::after,
.export-btn::after,
.share-link-btn::after,
.gps-clear-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.add-btn:active::after,
.export-btn:active::after,
.share-link-btn:active::after,
.gps-clear-btn:active::after {
  width: 300px;
  height: 300px;
}

/* Loading states */
.generating-report {
  position: relative;
  overflow: hidden;
}

.generating-report::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
  animation: shimmer 1.5s infinite;
}

/* Enhanced hover effects */
.kpi-mini {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.kpi-mini:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.preset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Search input animation */
.search-input :deep(.el-input__wrapper):focus-within {
  transform: scale(1.01);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* =========================== MELHORIAS MOBILE (≤420px) =========================== */
@media (max-width:420px){
  /* força TAMANHO/CÍRCULO e visibilidade */
  .actions-group .el-button,
  .actions-group .el-button.el-button--small,
  .actions-group .add-btn,
  .actions-group .export-btn,
  .actions-group .share-link-btn {
    display:inline-flex !important;
    align-items:center !important;
    justify-content:center !important;
    width:32px !important;
    height:32px !important;
    min-width:32px !important;
    padding:0 !important;
    border-radius:50% !important;
    opacity:1 !important;
    visibility:visible !important;
  }

  /* mantém FUNDO dos CTAs no mobile (não ficam transparentes) */
  .actions-group .add-btn{
    background:var(--el-color-primary) !important;
    border-color:var(--el-color-primary) !important;
    color:#fff !important;
    box-shadow:0 3px 8px rgba(0,110,255,.2) !important;
  }
  
  .actions-group .export-btn{
    background:var(--el-color-success) !important;
    border-color:var(--el-color-success) !important;
    color:#fff !important;
    box-shadow:0 3px 8px rgba(103, 194, 58, 0.2) !important;
  }
  
  .actions-group .share-link-btn{
    background:#fff !important;
    border-color:#dcdfe6 !important;
    color:#606266 !important;
    box-shadow:0 2px 4px rgba(0, 0, 0, 0.1) !important;
  }

  /* tamanho do ícone */
  .actions-group .el-button i,
  .actions-group .el-button .el-icon{
    font-size:15px !important;
    line-height:1 !important;
  }
  
  /* Hover mobile */
  .actions-group .add-btn:active {
    transform: scale(0.95);
  }
  
  .actions-group .export-btn:active {
    transform: scale(0.95);
  }
  
  .actions-group .share-link-btn:active {
    transform: scale(0.95);
  }
}

/* =========================== ACESSIBILIDADE =========================== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>