<template>
  <div class="devices-page">
    <!-- ===== Linha de busca + ações ===== -->
    <div class="search-row">
      <el-input v-model="query" class="search-input" size="small"
        :placeholder="KT('device.search_short') || 'Buscar...'" clearable @clear="onClearInput" @keydown.enter.prevent>
        <!-- Prefixo: filtro leve (não aumenta a altura) -->
        <template #prefix>
          <span class="filter-toggle-button" :class="{ 'active': showFiltersPanel || activeFiltersCount > 0 }"
            role="button" tabindex="0" @click="toggleFiltersPanel" @keydown.enter.stop.prevent="toggleFiltersPanel"
            @mouseenter.stop="showTip($event, 'Filtros avançados')" @mouseleave="hideTip">
            <i class="fas fa-filter"></i>
            <span v-if="activeFiltersCount > 0" class="filter-badge">{{ activeFiltersCount }}</span>
          </span>
        </template>
      </el-input>

      <div class="actions-group">
        <el-dropdown v-if="store.state.auth.administrator" trigger="click" :hide-on-click="true" :teleported="false"
          :append-to-body="false" popper-class="dropdown-popper" :popper-options="{ strategy: 'fixed' }"
          placement="bottom-start" @command="runReport">
          <el-button class="reports-btn" size="small" type="info" circle
            @mouseenter.stop="showTip($event, 'Relatórios / Exportar')" @mouseleave="hideTip">
            <i class="fas fa-file-export"></i>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item divided disabled><strong>Dispositivos Online</strong></el-dropdown-item>
              <el-dropdown-item command="online:pdf">PDF (online)</el-dropdown-item>
              <el-dropdown-item command="online:xlsx">Excel (online)</el-dropdown-item>
              <el-dropdown-item command="online:json">JSON (online)</el-dropdown-item>

              <el-dropdown-item divided disabled><strong>Dispositivos OFFline</strong></el-dropdown-item>
              <el-dropdown-item command="offline:pdf">PDF (offline)</el-dropdown-item>
              <el-dropdown-item command="offline:xlsx">Excel (offline)</el-dropdown-item>
              <el-dropdown-item command="offline:json">JSON (offline)</el-dropdown-item>

              <el-dropdown-item divided disabled><strong>Visíveis na tela</strong></el-dropdown-item>
              <el-dropdown-item command="visible:pdf">PDF (visíveis)</el-dropdown-item>
              <el-dropdown-item command="visible:xlsx">Excel (visíveis)</el-dropdown-item>
              <el-dropdown-item command="visible:json">JSON (visíveis)</el-dropdown-item>

              <el-dropdown-item divided disabled><strong>Relatórios Profissionais</strong></el-dropdown-item>
              <el-dropdown-item @click="openProfessionalReports">
                <i class="fas fa-file-alt"></i> Relatórios Avançados
              </el-dropdown-item>

              <el-dropdown-item divided @click="goReports()">Abrir aba Relatórios</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button class="add-btn" size="small" type="primary" :disabled="!store.getters['checkDeviceLimit']"
          v-if="store.getters.advancedPermissions(13) && (store.state.auth.deviceLimit === -1 || store.state.auth.deviceLimit > 0)"
          @click="(store.getters['checkDeviceLimit']) ? editDeviceRef.newDevice() : deviceLimitExceded()"
          @mouseenter.stop="showTip($event, KT('device.add'))" @mouseleave="hideTip">
          <i class="fas fa-plus"></i>
        </el-button>
      </div>
    </div>

    <!-- ===== Painel de Filtros Avançados ===== -->
    <div v-if="showFiltersPanel" class="filters-panel">
      <div class="filters-panel-header">
        <h4>Filtros</h4>
        <el-button type="text" @click="advClearAllAdvancedFilters" class="clear-all-btn">
          <i class="fas fa-trash-alt"></i> Limpar
        </el-button>
      </div>

      <!-- Linha 1: Estado (adm) + Situação (todos) -->
      <div class="filters-row primary-row">
        <div class="category-label">
          <span>Estado</span>
        </div>

        <div class="filters-group state-filters" v-if="store.state.auth.administrator">
          <div class="filter-icon all large" :class="{ active: stateFilter === 'all' }" @click="applyStateFilter('all')"
            @mouseenter.stop="showTip($event, KT('device.state_all'))" @mouseleave="hideTip"><i
              class="fas fa-globe"></i>
          </div>
          <div class="filter-icon installed large" :class="{ active: stateFilter === 'installed' }"
            @click="applyStateFilter('installed')" @mouseenter.stop="showTip($event, KT('device.state_installed'))"
            @mouseleave="hideTip"><i class="fas fa-check-circle"></i></div>
          <div class="filter-icon in-service large" :class="{ active: stateFilter === 'in_service' }"
            @click="applyStateFilter('in_service')" @mouseenter.stop="showTip($event, KT('device.state_in_service'))"
            @mouseleave="hideTip"><i class="fas fa-tools"></i></div>
          <div class="filter-icon with-failures large" :class="{ active: stateFilter === 'with_failures' }"
            @click="applyStateFilter('with_failures')"
            @mouseenter.stop="showTip($event, KT('device.state_with_failures'))" @mouseleave="hideTip"><i
              class="fas fa-exclamation-triangle"></i></div>
          <div class="filter-icon in-stock large" :class="{ active: stateFilter === 'in_stock' }"
            @click="applyStateFilter('in_stock')" @mouseenter.stop="showTip($event, KT('device.state_in_stock'))"
            @mouseleave="hideTip"><i class="fas fa-box"></i></div>
          <div class="filter-icon withdrawn large" :class="{ active: stateFilter === 'withdrawn' }"
            @click="applyStateFilter('withdrawn')" @mouseenter.stop="showTip($event, KT('device.state_withdrawn'))"
            @mouseleave="hideTip"><i class="fas fa-archive"></i></div>
          <div class="filter-icon company large" :class="{ active: stateFilter === 'company' }"
            @click="applyStateFilter('company')" @mouseenter.stop="showTip($event, KT('device.state_company'))"
            @mouseleave="hideTip"><i class="fas fa-building"></i></div>
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

      <!-- Linha 2: Conectividade / Avançados (apenas admins) -->
      <div class="filters-row secondary-row" v-if="store.state.auth.administrator">
        <div class="section-wrapper">
          <div class="category-label small"><span>Conectividade</span></div>
          <div class="filters-group connectivity-filters">
            <div class="filter-icon online medium" :class="{ active: combinedStatus === 'online' }"
              @click="setCombinedStatus('online')" @mouseenter.stop="showTip($event, KT('device.status_online'))"
              @mouseleave="hideTip"><i class="fas fa-wifi"></i></div>
            <div class="filter-icon offline medium" :class="{ active: combinedStatus === 'offline' }"
              @click="setCombinedStatus('offline')" @mouseenter.stop="showTip($event, KT('device.status_offline'))"
              @mouseleave="hideTip"><i class="fas fa-power-off"></i></div>
            <div class="filter-icon unknown medium" :class="{ active: combinedStatus === 'unknown' }"
              @click="setCombinedStatus('unknown')" @mouseenter.stop="showTip($event, KT('device.status_unknown'))"
              @mouseleave="hideTip"><i class="fas fa-question-circle"></i></div>
            <div class="filter-icon motion medium" :class="{ active: combinedStatus === 'moving' }"
              @click="setCombinedStatus('moving')" @mouseenter.stop="showTip($event, KT('device.in_motion'))"
              @mouseleave="hideTip"><i class="fas fa-running"></i></div>
            <div class="filter-icon stopped medium" :class="{ active: combinedStatus === 'stopped' }"
              @click="setCombinedStatus('stopped')" @mouseenter.stop="showTip($event, KT('device.status_stopped'))"
              @mouseleave="hideTip"><i class="fas fa-hand-paper"></i></div>
          </div>
        </div>

        <div class="section-wrapper">
          <div class="category-label small"><span>Avançados</span></div>
          <div class="filters-group advanced-filters">
            <div class="filter-icon anchor small" :class="{ active: isAdvActive('anchor', true) }"
              @click="toggleAdvFilter('anchor', true)" @mouseenter.stop="showTip($event, 'Âncora/Geofence')"
              @mouseleave="hideTip"><i class="fas fa-anchor"></i></div>
            <div class="filter-icon driver small" :class="{ active: isAdvActive('driver', true) }"
              @click="toggleAdvFilter('driver', true)" @mouseenter.stop="showTip($event, 'Condutor')"
              @mouseleave="hideTip">
              <i class="fas fa-id-card"></i>
            </div>
            <div class="filter-icon ignition-on small" :class="{ active: isAdvActive('ignition', true) }"
              @click="toggleAdvFilter('ignition', true, 'exclusive')" @mouseenter.stop="showTip($event, 'Ignição On')"
              @mouseleave="hideTip"><i class="fas fa-key"></i></div>
            <div class="filter-icon ignition-off small" :class="{ active: isAdvActive('ignition', false) }"
              @click="toggleAdvFilter('ignition', false, 'exclusive')" @mouseenter.stop="showTip($event, 'Ignição Off')"
              @mouseleave="hideTip"><i class="fas fa-key"></i></div>
            <div class="filter-icon locked small" :class="{ active: isAdvActive('locked', true) }"
              @click="toggleAdvFilter('locked', true, 'exclusive')" @mouseenter.stop="showTip($event, 'Bloqueado')"
              @mouseleave="hideTip"><i class="fas fa-lock"></i></div>
            <div class="filter-icon unlocked small" :class="{ active: isAdvActive('locked', false) }"
              @click="toggleAdvFilter('locked', false, 'exclusive')" @mouseenter.stop="showTip($event, 'Desbloqueado')"
              @mouseleave="hideTip"><i class="fas fa-unlock"></i></div>
          </div>
        </div>

        <!-- Seção GPS Avançado -->
        <div class="section-wrapper">
          <div class="category-label small"><span>GPS Avançado</span></div>
          <div class="filters-group gps-filters">
            <!-- Filtro por Marca -->
            <div class="filter-dropdown">
              <select v-model="gpsBrandFilter" @change="handleGpsBrandFilter($event.target.value)" 
                      class="gps-select brand-select">
                <option value="">Todas as Marcas</option>
                <option v-for="brand in gpsBrands" :key="brand" :value="brand">{{ brand }}</option>
              </select>
            </div>
            
            <!-- Filtro por Modelo -->
            <div class="filter-dropdown">
              <select v-model="gpsModelFilter" @change="handleGpsModelFilter($event.target.value)" 
                      class="gps-select model-select" :disabled="!gpsBrandFilter">
                <option value="">Todos os Modelos</option>
                <option v-for="model in getBrandModels(gpsBrandFilter)" :key="model" :value="model">{{ model }}</option>
              </select>
            </div>
            
            <!-- Filtro por Tecnologia -->
            <div class="filter-dropdown">
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
            <div class="filter-icon clear-gps small" v-if="gpsBrandFilter || gpsModelFilter || technologyFilter" 
                 @click="clearGpsFilters" @mouseenter.stop="showTip($event, 'Limpar filtros GPS')" @mouseleave="hideTip">
              <i class="fas fa-times"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Linha 3: Estilo -->
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
          <div class="filter-icon small" :class="{ active: estilo === 'ultra' }" @click="setEstilo('ultra')"
            @mouseenter.stop="showTip($event, 'Ultra')" @mouseleave="hideTip">
            <i class="fas fa-bolt"></i>
          </div>
          <div class="filter-icon small" :class="{ active: estilo === 'dynamic' }" @click="setEstilo('dynamic')"
            @mouseenter.stop="showTip($event, 'Dinâmico')" @mouseleave="hideTip">
            <i class="fas fa-sliders-h"></i>
          </div>
        </div>
      </div>

      <!-- Linha 4: Offlines (adm) -->
      <div class="filters-row" v-if="store.state.auth.administrator">
        <div class="category-label"><span>Offlines</span></div>
        <div class="filters-group offline-filters">
          <div class="filter-icon small" :class="{ active: timeFilter === 'offline-1h' }"
            @click="setTimeFilter('offline-1h')" @mouseenter.stop="showTip($event, 'Offline < 1h')"
            @mouseleave="hideTip"><i class="fas fa-hourglass-start"></i>
          </div>
          <div class="filter-icon small" :class="{ active: timeFilter === 'offline-2h' }"
            @click="setTimeFilter('offline-2h')" @mouseenter.stop="showTip($event, 'Offline < 2h')"
            @mouseleave="hideTip"><i class="fas fa-hourglass-half"></i>
          </div>
          <div class="filter-icon small" :class="{ active: timeFilter === 'offline-6h' }"
            @click="setTimeFilter('offline-6h')" @mouseenter.stop="showTip($event, 'Offline < 6h')"
            @mouseleave="hideTip"><i class="fas fa-hourglass-end"></i>
          </div>
          <div class="filter-icon small" :class="{ active: timeFilter === 'offline-12h' }"
            @click="setTimeFilter('offline-12h')" @mouseenter.stop="showTip($event, 'Offline < 12h')"
            @mouseleave="hideTip"><i class="fas fa-stopwatch"></i></div>
          <div class="filter-icon small" :class="{ active: timeFilter === 'offline-24h' }"
            @click="setTimeFilter('offline-24h')" @mouseenter.stop="showTip($event, 'Offline < 24h')"
            @mouseleave="hideTip"><i class="fas fa-clock"></i></div>

          <div class="filter-icon small" v-if="timeFilter" @click="clearTimeFilter"
            @mouseenter.stop="showTip($event, 'Limpar filtro de offline')" @mouseleave="hideTip">
            <i class="fas fa-times"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== Cabeçalho (somente quando NÃO dinâmico) ===== -->
    <template v-if="!isDynamic">
      <div class="deviceHead" :style="{ height: rowHeightPx + 'px' }">
        <div v-if="store.getters['isAdmin']" class="name col-id" @click="store.dispatch('devices/setSorting', 'id')">
          {{ KT('device.id') }}
          <span v-if="store.getters['devices/sorting'] === 'id-asc'"><i class="fas fa-sort-alpha-down"></i></span>
          <span v-else-if="store.getters['devices/sorting'] === 'id-desc'"><i class="fas fa-sort-alpha-up"></i></span>
          <span v-else><i class="fas fa-sort-alpha-down" style="color:silver;"></i></span>
        </div>

        <div class="name col-name" @click="store.dispatch('devices/setSorting', 'name')">
          {{ KT('device.name') }}
          <span v-if="store.getters['devices/sorting'] === 'name-asc'"><i class="fas fa-sort-alpha-down"></i></span>
          <span v-else-if="store.getters['devices/sorting'] === 'name-desc'"><i class="fas fa-sort-alpha-up"></i></span>
          <span v-else><i class="fas fa-sort-alpha-down" style="color:silver;"></i></span>
        </div>

        <div class="name col-status" @click="store.dispatch('devices/setSorting', 'status')">
          <span v-if="store.getters['devices/sorting'] === 'status-asc'"><i class="fas fa-sort-alpha-down"></i></span>
          <span v-else-if="store.getters['devices/sorting'] === 'status-desc'"><i class="fas fa-sort-alpha-up"></i></span>
          <span v-else><i class="fas fa-sort-alpha-down" style="color:silver;"></i></span>
        </div>

        <div class="name col-updated" @click="store.dispatch('devices/setSorting', 'lastUpdate')">
          {{ KT('device.updated') }}
          <span v-if="store.getters['devices/sorting'] === 'lastUpdate-asc'"><i class="fas fa-sort-alpha-down"></i></span>
          <span v-else-if="store.getters['devices/sorting'] === 'lastUpdate-desc'"><i
              class="fas fa-sort-alpha-up"></i></span>
          <span v-else><i class="fas fa-sort-alpha-down" style="color:silver;"></i></span>
        </div>

        <div class="name col-icons" @click="setSortingByState()">
          {{ store.getters['devices/sorting'] }} <span><i class="fas fa-sort"></i></span>
        </div>
      </div>
    </template>

    <!-- ===== Lista (virtualizada) / Dinâmico (cards) ===== -->
    <div ref="realDevices" class="list auto-fill" @scroll="onScroll">
      <div class="fakeScroll" :style="{ height: (filteredDevices.length * rowHeightPx) + 'px' }">
        <div :style="{ height: (offsetDevices * rowHeightPx) + 'px' }"></div>

        <!-- Dinâmico: cards -->
        <template v-if="isDynamic">
          <div v-for="device in visibleSlice" :key="device.id" class="dyn-wrap" :class="dynClass(device)"
            @click="safeMarkerClick(device.id)" @contextmenu.prevent="safeMarkerContext($event, device.id)">
            <DeviceItem :device="device" :item="device" :position="pos(device.id)" :pos="pos(device.id)"
              :row-height="rowHeightPx" />
          </div>
        </template>

        <!-- Tabela em grupos -->
        <template v-else>
          <div v-for="group in groupedDevices" :key="group.id">
            <div v-if="group.id !== -1" class="groupTitle" @click="store.dispatch('setGroupPref', group.id)">
              <span v-if="store.getters.groupPref(group.id)"><i class="fas fa-angle-up"></i></span>
              <span v-else><i class="fas fa-angle-down"></i></span>
              &nbsp;&nbsp;{{ group.name }}
              <span class="group-count">{{ group.devices.length }}</span>
            </div>

            <div v-if="group.id === -1 || store.getters.groupPref(group.id)">
              <div v-for="device in group.devices" :key="device.id" class="device"
                :class="{ isDisabled: device.disabled }" :style="{ height: rowHeightPx + 'px' }"
                @click="safeMarkerClick(device.id)" @contextmenu.prevent="safeMarkerContext($event, device.id)">
                <div v-if="store.getters['isAdmin']" class="name col-id text-center">{{ device.id }}</div>

                <div class="name col-name" :title="device.name">{{ device.name }}</div>

                <div class="name col-status text-center">
                  <div @mouseleave="hideTip"
                    @mouseenter.stop="showTip($event, device.disabled ? KT('disabled') : device.lastUpdate === null ? KT('new') : device.status === 'online' ? KT('online') : (device.status === 'offline') ? KT('offline') : KT('unknown'))">
                    <span v-if="device.lastUpdate === null"><i class="fas fa-question-circle"
                        style="color:var(--el-color-info)"></i></span>
                    <span v-else-if="device.status === 'online'"><i class="fas fa-check-circle"
                        style="color:var(--el-color-success)"></i></span>
                    <span v-else-if="device.status === 'offline'"><i class="fas fa-exclamation-circle"
                        style="color:var(--el-color-danger)"></i></span>
                    <span v-else><i class="fas fa-question-circle" style="color:var(--el-color-warning)"></i></span>
                  </div>
                </div>

                <div class="name col-updated text-center">{{ getLastUpdated(device.lastUpdate) }}</div>

                <div v-if="pos(device.id)" class="icons col-icons">
                  <div @mouseleave="hideTip" @mouseenter.stop="showAlarmTip($event, device.id)"
                    :style="{ color: pos(device.id).attributes.alarm ? 'var(--el-color-danger)' : 'var(--el-color-info)' }">
                    <i class="fas fa-exclamation-triangle"></i>
                  </div>

                  <div v-if="pos(device.id).attributes['driverUniqueId']" @mouseleave="hideTip"
                    @mouseenter.stop="showDriverTip($event, device.id)" :style="{ color: 'var(--el-color-success)' }"><i
                      class="far fa-id-card"></i></div>
                  <div v-else-if="pos(device.id).attributes['isQrLocked'] === true" @mouseleave="hideTip"
                    @mouseenter.stop="showTip($event, KT('device.noDriverLocked'))"
                    :style="{ color: 'var(--el-color-danger)' }"><i class="far fa-id-card"></i></div>
                  <div v-else @mouseleave="hideTip" @mouseenter.stop="showTip($event, KT('device.noDriver'))"
                    :style="{ color: 'var(--el-color-info)' }"><i class="far fa-id-card"></i></div>

                  <div @mouseleave="hideTip"
                    @mouseenter.stop="showTip($event, pos(device.id).attributes.ignition === true ? KT('device.ignitionOn') : pos(device.id).attributes.ignition === false ? KT('device.ignitionOff') : KT('unknown'))"
                    :style="{ color: pos(device.id).attributes.ignition === true ? 'var(--el-color-success)' : 'var(--el-color-danger)' }">
                    <i class="fas fa-key"></i></div>

                  <div @mouseleave="hideTip"
                    @mouseenter.stop="showTip($event, pos(device.id).attributes.blocked === true ? KT('device.blocked') : pos(device.id).attributes.blocked === false ? KT('device.unblocked') : KT('unknown'))"
                    :style="{ color: pos(device.id).attributes.blocked === true ? 'var(--el-color-danger)' : 'var(--el-color-success)' }">
                    <i :class="pos(device.id).attributes.blocked === true ? 'fas fa-lock' : 'fas fa-lock-open'"></i>
                  </div>

                  <template v-if="store.getters.advancedPermissions(9)">
                    <div @mouseleave="hideTip"
                      @mouseenter.stop="showTip($event, store.getters['geofences/isAnchored'](device.id) ? KT('device.anchorEnabled') : KT('device.anchorDisabled'))"
                      :style="{ color: store.getters['geofences/isAnchored'](device.id) ? 'var(--el-color-warning)' : 'var(--el-color-info)' }">
                      <i class="fas fa-anchor"></i></div>
                  </template>

                  <div @mouseleave="hideTip"
                    @mouseenter.stop="pos(device.id).attributes.motion ? showTip($event, KT('device.moving')) : pos(device.id).attributes.stoppedTime ? showTip($event, (KT('device.stoped') || 'Parado') + ' • ' + getLastUpdated(pos(device.id).attributes.stoppedTime)) : showTip($event, KT('device.stoped'))"
                    :style="{ color: pos(device.id).attributes.motion ? 'var(--el-color-primary)' : 'var(--el-color-info)' }">
                    <i class="fas fa-angle-double-right"></i></div>
                </div>

                <div v-else class="icons col-icons muted">
                  <i>
                    <svg xmlns="http://www.w3.org/2000/svg" style="opacity:.3" height="15px" viewBox="0 0 640 512">
                      <path
                        d="M154 95.42C187.3 38.35 249.2 0 320 0C426 0 512 85.96 512 192C512 230.7 489 282.8 459 334.5L630.8 469.1C641.2 477.3 643.1 492.4 634.9 502.8C626.7 513.2 611.6 515.1 601.2 506.9L9.196 42.89C-1.236 34.71-3.065 19.63 5.112 9.196C13.29-1.236 28.37-3.065 38.81 5.112L154 95.42zM257.8 176.8L349.6 248.7C370.1 238 384 216.7 384 192C384 156.7 355.3 128 320 128C289.9 128 264.7 148.8 257.8 176.8zM296.3 499.2C245.9 436.2 132.3 285.2 128.1 196.9L406.2 416.1C382.7 449.5 359.9 478.9 343.7 499.2C331.4 514.5 308.6 514.5 296.3 499.2V499.2z" />
                    </svg>
                  </i>
                  <span>{{ KT('device.noPosition') }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>

  <!-- Modal de Relatórios Profissionais -->
  <el-dialog v-model="showReportsModal" title="Relatórios Profissionais" width="800px" 
             :before-close="closeReportsModal" class="reports-modal">
    <div class="reports-content">
      <!-- Seção de Configurações -->
      <div class="config-section">
        <h3><i class="fas fa-cog"></i> Configurações do Relatório</h3>
        
        <!-- Seletor de Template -->
        <div class="form-group">
          <label>Template:</label>
          <el-select v-model="selectedTemplate" placeholder="Selecione um template" @change="onTemplateChange">
            <el-option label="Dispositivos - Resumo Executivo" value="devices-summary"></el-option>
            <el-option label="Dispositivos - Análise Detalhada" value="devices-detailed"></el-option>
            <el-option label="Posições - Relatório de Localização" value="positions-report"></el-option>
            <el-option label="Eventos - Log de Atividades" value="events-log"></el-option>
            <el-option label="Performance - KPIs e Métricas" value="performance-kpis"></el-option>
            <el-option label="Análise de Rota - Percursos" value="route-analysis"></el-option>
          </el-select>
        </div>

        <!-- Período -->
        <div class="form-group">
          <label>Período:</label>
          <el-select v-model="selectedPeriod" placeholder="Selecione o período">
            <el-option label="Dados Atuais" value="current"></el-option>
            <el-option label="Último Dia" value="last-day"></el-option>
            <el-option label="Última Semana" value="last-week"></el-option>
            <el-option label="Último Mês" value="last-month"></el-option>
            <el-option label="Personalizado" value="custom"></el-option>
          </el-select>
        </div>

        <!-- Período Personalizado -->
        <div v-if="selectedPeriod === 'custom'" class="form-group date-range">
          <label>Data Início:</label>
          <el-date-picker v-model="customStartDate" type="date" placeholder="Data de início"></el-date-picker>
          <label>Data Fim:</label>
          <el-date-picker v-model="customEndDate" type="date" placeholder="Data de fim"></el-date-picker>
        </div>

        <!-- Filtros -->
        <div class="form-group">
          <label>Filtros Aplicados:</label>
          <div class="filter-summary">
            <span v-if="!hasActiveFilters" class="no-filters">Nenhum filtro ativo</span>
            <div v-else class="active-filters">
              <span v-if="gpsBrandFilter" class="filter-tag">Marca: {{ gpsBrandFilter }}</span>
              <span v-if="gpsModelFilter" class="filter-tag">Modelo: {{ gpsModelFilter }}</span>
              <span v-if="technologyFilter" class="filter-tag">Tecnologia: {{ technologyFilter }}</span>
              <span v-if="stateFilter !== 'all'" class="filter-tag">Estado: {{ stateFilter }}</span>
            </div>
          </div>
        </div>

        <!-- Formato de Exportação -->
        <div class="form-group">
          <label>Formato:</label>
          <div class="export-options">
            <el-radio-group v-model="exportFormat">
              <el-radio label="pdf">
                <i class="fas fa-file-pdf"></i> PDF Profissional
              </el-radio>
              <el-radio label="excel">
                <i class="fas fa-file-excel"></i> Excel Avançado
              </el-radio>
              <el-radio label="both">
                <i class="fas fa-files"></i> Ambos (PDF + Excel)
              </el-radio>
            </el-radio-group>
          </div>
        </div>
      </div>

      <!-- Prévia do Template -->
      <div class="preview-section">
        <h3><i class="fas fa-eye"></i> Prévia do Template</h3>
        <div class="template-preview">
          <div v-if="selectedTemplate === 'devices-summary'" class="preview-content">
            <h4>📊 Dispositivos - Resumo Executivo</h4>
            <p>• Total de dispositivos: {{ filteredDevices.length }}</p>
            <p>• Dispositivos online: {{ onlineDevicesCount }}</p>
            <p>• Última atualização: {{ currentDate }}</p>
            <p>• Gráficos de distribuição por marca, status e localização</p>
          </div>
          
          <div v-else-if="selectedTemplate === 'devices-detailed'" class="preview-content">
            <h4>📋 Dispositivos - Análise Detalhada</h4>
            <p>• Lista completa com todas as informações</p>
            <p>• ID, Nome, Modelo, Última posição, Status</p>
            <p>• Tabelas formatadas com cores e indicadores</p>
            <p>• {{ filteredDevices.length }} dispositivos serão incluídos</p>
          </div>

          <div v-else class="preview-content">
            <h4>{{ getTemplateTitle(selectedTemplate) }}</h4>
            <p>Template personalizado com dados específicos do tipo selecionado.</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeReportsModal">Cancelar</el-button>
        <el-button type="primary" @click="generateReport" :loading="generatingReport" :disabled="!selectedTemplate">
          <i class="fas fa-download"></i> Gerar Relatório
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/dropdown/style/css'
import 'element-plus/es/components/dropdown-menu/style/css'
import 'element-plus/es/components/dropdown-item/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/date-picker/style/css'
import 'element-plus/es/components/radio/style/css'
import 'element-plus/es/components/radio-group/style/css'

import {
  ElInput, ElButton,
  ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessage,
  ElDialog, ElSelect, ElOption, ElDatePicker, ElRadio, ElRadioGroup
} from 'element-plus'

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { ref, computed, inject, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import KT from '../tarkan/func/kt.js'

/* Dinâmico: nosso card */
import DeviceItem from "./devices.item.vue"

const store = useStore()
const router = useRouter()

const markerClick   = inject('markerClick')
const markerContext = inject('markerContext')
const editDeviceRef = inject('edit-device')

// Fallbacks p/ injects ausentes
function safeMarkerClick(...args) {
  if (typeof markerClick === 'function') return markerClick(...args)
  console.warn('markerClick não está definido ou não é função')
}
function safeMarkerContext(...args) {
  if (typeof markerContext === 'function') return markerContext(...args)
  console.warn('markerContext não está definido ou não é função')
}

/* busca */
const query  = ref(window.localStorage.getItem('query') || '')
watch(query, v => window.localStorage.setItem('query', v))

/* estilo/densidade */
const estilo = ref(window.localStorage.getItem('devices_style') || 'compact')
watch(estilo, v => window.localStorage.setItem('devices_style', v))

// Alturas das linhas (tabela) + altura dinâmica dos cards
const densityToRowHeight = { cozy: 36, compact: 30, ultra: 24 }
const dynamicRowPx = ref(132) // fallback seguro p/ não cortar o footer do card
const isDynamic   = computed(() => estilo.value === 'dynamic')
const rowHeightPx = computed(() => isDynamic.value ? dynamicRowPx.value : (densityToRowHeight[estilo.value] || 30))
function setEstilo(cmd){ estilo.value = String(cmd) }

/* situação */
const situacaoFilter = ref(window.localStorage.getItem('situacao_filter') || 'todos')

/* Filtros GPS Avançados */
const gpsBrandFilter = ref('')
const gpsModelFilter = ref('')
const technologyFilter = ref('')

// Lista de modelos GPS comuns
const commonGpsModels = ref([
  "TK102", "TK103", "GT06", "GT06N", "ST901", "FMB120", "FMB125", 
  "GV55", "GV300", "T311", "T333", "MVT340", "G737", "JM01", 
  "TK905", "AT4", "GP4000", "ST300", "TR-151", "A1", "N200", 
  "LMU-200", "TT12", "FM-Pro3", "VT1000", "T22", "TT8750"
])

// Função para obter modelos por marca
const getBrandModels = (brand) => {
  const modelMap = {
    "Coban": ["TK102", "TK103", "GPS303", "TK303", "TK305", "TK306", "TK307"],
    "Concox": ["GT06", "GT06N", "GT06E", "GT08", "X1", "X3", "AT4", "AT6", "JM-VL01"],
    "Queclink": ["GV55", "GV75", "GV300", "GV350", "GL50", "GL100", "GL200", "GL300"],
    "Teltonika": ["FMB001", "FMB002", "FMB010", "FMB110", "FMB120", "FMB125", "FMB130"],
    "Meitrack": ["T311", "T333", "T355", "T366", "MVT100", "MVT340", "MVT380"],
    "Sinotrack": ["ST-901", "ST-902", "ST-906", "ST-907", "ST-909", "ST-910"],
    "TK Star": ["TK905", "TK906", "TK909", "TK911", "TK915", "TK919"]
  }
  return modelMap[brand] || []
}
function filterDevices(cmd){
  situacaoFilter.value = String(cmd || 'todos').toLowerCase()
  window.localStorage.setItem('situacao_filter', situacaoFilter.value)
}

/* relógio p/ “Atualizado há …” */
const now = ref(new Date())
let tick = null
onMounted(()=> { tick = setInterval(() => (now.value = new Date()), 3000) })
onBeforeUnmount(()=> { if (tick) clearInterval(tick) })

/* tooltips */
const showTip = (evt, text) => {
  // ✅ FIX: Validar que text não seja undefined/null/empty antes de passar para o tooltip
  if (!text || text === '' || text === 'undefined') return
  return window.$showTip && window.$showTip(evt, text)
}
const hideTip = () => window.$hideTip && window.$hideTip()
const deviceLimitExceded = () => ElMessage.warning(KT('device.limitExceeded') || 'Limite de dispositivos atingido')

/* ---------------- Painel/Badge de filtros avançados ---------------- */
const showFiltersPanel = ref(false)

/* filtro “Estado” (linha 1 – admins) */
const stateFilter = ref('all')
function applyStateFilter(val){ stateFilter.value = String(val || 'all') }
function matchStateFilter(device){
  if (stateFilter.value === 'all') return true
  const v = (device?.attributes?.state || device?.state || '').toString().toLowerCase()
  return v === stateFilter.value
}

/* Conectividade combinada */
const combinedStatus   = ref('all')
function setCombinedStatus(val){ combinedStatus.value = String(val || 'all') }
function matchCombinedStatus(device, position){
  switch (combinedStatus.value) {
    case 'online':  return device.status==='online'
    case 'offline': return device.status==='offline'
    case 'unknown': return device.status==='unknown'
    case 'moving':  return device.status==='online' && !!position?.attributes?.motion
    case 'stopped': return device.status==='online' && !position?.attributes?.motion
    default:        return true
  }
}

/* Meta: contagem de filtros ativos do PAINEL (badge do botão) */
const advFilters = ref([]) // {type, value}
const activeFiltersCount = computed(() =>
  (stateFilter.value !== 'all' ? 1 : 0) +
  (combinedStatus.value !== 'all' ? 1 : 0) +
  (timeFilter.value ? 1 : 0) +
  (situacaoFilter.value !== 'todos' ? 1 : 0) +
  (estilo.value !== 'compact' ? 1 : 0) +
  advFilters.value.length
)
// const hasActiveFilters = computed(() => activeFiltersCount.value > 0)

function toggleFiltersPanel(){
  if (showFiltersPanel.value) {
    advClearAllAdvancedFilters()
    combinedStatus.value = 'all'
    stateFilter.value = 'all'
  }
  showFiltersPanel.value = !showFiltersPanel.value
}

/* Filtros básicos de tempo (apenas linha “Offlines”) */
const timeFilter = ref('')
function clearTimeFilter(){
  timeFilter.value = ''
  if (/^last:/.test(String(query.value || ''))) query.value = ''
}

// Função para limpar filtros GPS
function clearGpsFilters() {
  gpsBrandFilter.value = ''
  gpsModelFilter.value = ''
  technologyFilter.value = ''
  ElMessage.success('Filtros GPS limpos com sucesso!')
}

/* contadores (usado no PDF) */
const counts = computed(() => {
  const ordered = store.getters['devices/getOrderedDevices'] || []
  let all=0, online=0, offline=0, moving=0, alarm=0
  for (const dk of ordered) {
    const d = store.getters['devices/getDevice'](dk); if (!d) continue
    const pos = store.getters['devices/getPosition'](d.id)
    all++
    if (d.status==='online') online++
    if (d.status==='offline') offline++
    if (pos?.attributes?.motion) moving++
    if (pos?.attributes?.alarm)  alarm++
  }
  return { all, online, moving, alarm, offline }
})

/* ----- busca e tempo na query ----- */
function parseTimeQuery(text){
  const r = String(text||'').toLowerCase().matchAll(/(.*?):(?<sinal>\+|-|=)(?<tempo>\d+)\s(?<filtro>dias|minutos|horas|segundos)/gi)
  const s = r.next(); if (!s.value || !s.value.groups) return null
  const { sinal, tempo, filtro } = s.value.groups
  const mul = filtro==='dias' ? 86400 : filtro==='horas' ? 3600 : filtro==='minutos' ? 60 : 1
  return { sinal, seconds: parseInt(tempo,10)*mul }
}
function matchTimeQuery(device){
  const q = parseTimeQuery(query.value); if (!q) return true
  const { sinal, seconds } = q
  const base = device.lastUpdate ? new Date(device.lastUpdate).getTime() : 0
  if (!base) return false
  const diffSec = Math.round((Date.now() - base)/1000)
  if (sinal==='+') return diffSec >= seconds
  if (sinal==='-') return diffSec <= seconds
  if (sinal==='=') return diffSec === seconds
  return true
}
function matchTextQuery(device, position, groupsById){
  const q = String(query.value||'').toLowerCase().trim(); if (!q) return true
  const group = groupsById.get(device.groupId)
  if (group && String(group.name).toLowerCase().includes(q)) return true
  for (const k of Object.keys(device)){
    if (device[k]==null) continue
    const val = String(device[k]).toLowerCase()
    if (k==='status' && val.replace('unknown','desconhecido').includes(q)) return true
    if (val.includes(q)) return true
  }
  if (device.attributes){
    for (const k of Object.keys(device.attributes)){
      const v = device.attributes[k]
      if (v!=null && String(v).toLowerCase().includes(q)) return true
    }
  }
  if (position?.attributes){
    for (const k of Object.keys(position.attributes)){
      const v = position.attributes[k]
      if (v!=null && String(v).toLowerCase().includes(q)) return true
    }
  }
  return false
}
function matchSituacao(device){
  const s = situacaoFilter.value
  if (!s || s==='todos') return true
  const cur = (device?.attributes?.situacao || '').toString().toLowerCase()
  return cur === s
}

/* Chips rápidos de tempo (usados somente na linha “Offlines”) */
function setTimeFilter(cmd) {
  timeFilter.value = cmd
  switch (cmd) {
    case 'ultima-hora':
      query.value = 'last:-60 minutos'
      ElMessage.success('Filtrando dispositivos atualizados na última hora')
      break
    case 'offline-1h':
      query.value = 'last:-1 horas';  ElMessage.success('Offline há menos de 1 hora'); break
    case 'offline-2h':
      query.value = 'last:-2 horas';  ElMessage.success('Offline há menos de 2 horas'); break
    case 'offline-6h':
      query.value = 'last:-6 horas';  ElMessage.success('Offline há menos de 6 horas'); break
    case 'offline-12h':
      query.value = 'last:-12 horas'; ElMessage.success('Offline há menos de 12 horas'); break
    case 'offline-24h':
      query.value = 'last:-24 horas'; ElMessage.success('Offline há menos de 24 horas'); break
  }
}

/* -------- filtros avançados (âncora/motorista/ignição/bloqueio) -------- */
function isAdvActive(type, value){
  return advFilters.value.some(f => f.type===type && (value===undefined || f.value===value))
}
function toggleAdvFilter(type, value, mode='normal'){
  if (isAdvActive(type, value)) {
    advFilters.value = advFilters.value.filter(f => !(f.type===type && f.value===value))
  } else {
    if (mode==='exclusive'){
      advFilters.value = advFilters.value.filter(f => f.type!==type)
    }
    advFilters.value.push({ type, value })
  }
}
function advClearAllAdvancedFilters(){ advFilters.value = [] }

/* ===== PROFESSIONAL REPORTS SYSTEM ===== */
// Modal de relatórios
const showReportsModal = ref(false)
const generatingReport = ref(false)

// Configurações do relatório
const selectedTemplate = ref('')
const selectedPeriod = ref('current')
const customStartDate = ref(null)
const customEndDate = ref(null)
const exportFormat = ref('pdf')

// Computed helpers
const hasActiveFilters = computed(() => {
  return gpsBrandFilter.value || gpsModelFilter.value || technologyFilter.value || 
         stateFilter.value !== 'all' || advFilters.value.length > 0
})

const onlineDevicesCount = computed(() => {
  return filteredDevices.value.filter(device => {
    const position = store.getters['devices/getPosition'](device.id)
    return position && Date.now() - position.fixTime < 300000 // 5 minutos
  }).length
})

const currentDate = computed(() => {
  return new Date().toLocaleString('pt-BR')
})

// Funções do modal de relatórios
const openProfessionalReports = () => {
  showReportsModal.value = true
}

const closeReportsModal = () => {
  showReportsModal.value = false
  selectedTemplate.value = ''
  selectedPeriod.value = 'current'
  customStartDate.value = null
  customEndDate.value = null
  exportFormat.value = 'pdf'
}

const onTemplateChange = (template) => {
  console.log('Template selecionado:', template)
}

const getTemplateTitle = (template) => {
  const titles = {
    'devices-summary': '📊 Dispositivos - Resumo Executivo',
    'devices-detailed': '📋 Dispositivos - Análise Detalhada',
    'positions-report': '📍 Posições - Relatório de Localização',
    'events-log': '📝 Eventos - Log de Atividades',
    'performance-kpis': '📈 Performance - KPIs e Métricas',
    'route-analysis': '🗺️ Análise de Rota - Percursos'
  }
  return titles[template] || 'Template Personalizado'
}

// Função principal de geração de relatórios
const generateReport = async () => {
  if (!selectedTemplate.value) {
    ElMessage.warning('Selecione um template para continuar')
    return
  }

  generatingReport.value = true

  try {
    const reportData = await prepareReportData()
    
    if (exportFormat.value === 'pdf' || exportFormat.value === 'both') {
      await generatePDFReport(reportData)
    }
    
    if (exportFormat.value === 'excel' || exportFormat.value === 'both') {
      await generateExcelReport(reportData)
    }

    ElMessage.success('Relatório gerado com sucesso!')
    closeReportsModal()
    
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    ElMessage.error('Erro ao gerar relatório. Tente novamente.')
  } finally {
    generatingReport.value = false
  }
}

// Preparar dados do relatório
const prepareReportData = async () => {
  const devices = filteredDevices.value
  const reportInfo = {
    title: getTemplateTitle(selectedTemplate.value),
    generatedAt: currentDate.value,
    template: selectedTemplate.value,
    period: selectedPeriod.value,
    totalDevices: devices.length,
    onlineDevices: onlineDevicesCount.value,
    offlineDevices: devices.length - onlineDevicesCount.value,
    filters: {
      brand: gpsBrandFilter.value,
      model: gpsModelFilter.value,
      technology: technologyFilter.value,
      state: stateFilter.value
    }
  }

  const deviceDetails = devices.map(device => {
    const position = store.getters['devices/getPosition'](device.id)
    return {
      id: device.id,
      name: device.name,
      model: device.model || 'N/A',
      status: position ? 'Online' : 'Offline',
      lastUpdate: position ? new Date(position.fixTime).toLocaleString('pt-BR') : 'N/A',
      latitude: position?.latitude || 'N/A',
      longitude: position?.longitude || 'N/A',
      address: position?.address || 'N/A',
      speed: position?.speed ? `${Math.round(position.speed)} km/h` : 'N/A',
      course: position?.course || 'N/A'
    }
  })

  return { reportInfo, deviceDetails }
}

// Gerar relatório PDF
const generatePDFReport = async (data) => {
  const { reportInfo, deviceDetails } = data
  
  const doc = new jsPDF('p', 'mm', 'a4')
  const margin = 20

  // Cabeçalho do relatório
  doc.setFontSize(20)
  doc.setTextColor(40, 116, 166)
  doc.text(reportInfo.title, margin, 30)
  
  doc.setFontSize(12)
  doc.setTextColor(100)
  doc.text(`Gerado em: ${reportInfo.generatedAt}`, margin, 45)
  
  // Resumo executivo
  doc.setFontSize(14)
  doc.setTextColor(60)
  doc.text('Resumo Executivo', margin, 65)
  
  doc.setFontSize(11)
  doc.setTextColor(80)
  const summaryY = 75
  doc.text(`Total de Dispositivos: ${reportInfo.totalDevices}`, margin, summaryY)
  doc.text(`Dispositivos Online: ${reportInfo.onlineDevices}`, margin, summaryY + 8)
  doc.text(`Dispositivos Offline: ${reportInfo.offlineDevices}`, margin, summaryY + 16)
  
  // Filtros aplicados
  if (reportInfo.filters.brand || reportInfo.filters.model || reportInfo.filters.technology) {
    doc.text('Filtros Aplicados:', margin, summaryY + 30)
    let filterY = summaryY + 38
    if (reportInfo.filters.brand) {
      doc.text(`• Marca: ${reportInfo.filters.brand}`, margin + 5, filterY)
      filterY += 6
    }
    if (reportInfo.filters.model) {
      doc.text(`• Modelo: ${reportInfo.filters.model}`, margin + 5, filterY)
      filterY += 6
    }
    if (reportInfo.filters.technology) {
      doc.text(`• Tecnologia: ${reportInfo.filters.technology}`, margin + 5, filterY)
    }
  }

  // Tabela de dispositivos (se template detalhado)
  if (reportInfo.template === 'devices-detailed' && deviceDetails.length > 0) {
    const tableStartY = 140
    
    const tableColumns = [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nome', dataKey: 'name' },
      { header: 'Modelo', dataKey: 'model' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Última Atualização', dataKey: 'lastUpdate' }
    ]

    const tableData = deviceDetails.map(device => ({
      id: device.id,
      name: device.name,
      model: device.model,
      status: device.status,
      lastUpdate: device.lastUpdate
    }))

    doc.autoTable({
      startY: tableStartY,
      head: [tableColumns.map(col => col.header)],
      body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 116, 166], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: margin, right: margin }
    })
  }

  // Salvar PDF
  const fileName = `relatorio-${reportInfo.template}-${Date.now()}.pdf`
  doc.save(fileName)
}

// Gerar relatório Excel
const generateExcelReport = async (data) => {
  const { reportInfo, deviceDetails } = data

  // Criar workbook
  const wb = XLSX.utils.book_new()
  
  // Aba de resumo
  const summaryData = [
    ['Relatório de Dispositivos'],
    [''],
    ['Informações Gerais'],
    ['Título', reportInfo.title],
    ['Data/Hora', reportInfo.generatedAt],
    ['Template', reportInfo.template],
    [''],
    ['Estatísticas'],
    ['Total de Dispositivos', reportInfo.totalDevices],
    ['Dispositivos Online', reportInfo.onlineDevices],
    ['Dispositivos Offline', reportInfo.offlineDevices],
    ['Taxa de Online (%)', Math.round((reportInfo.onlineDevices / reportInfo.totalDevices) * 100)],
    ['']
  ]

  if (reportInfo.filters.brand || reportInfo.filters.model || reportInfo.filters.technology) {
    summaryData.push(['Filtros Aplicados'])
    if (reportInfo.filters.brand) summaryData.push(['Marca', reportInfo.filters.brand])
    if (reportInfo.filters.model) summaryData.push(['Modelo', reportInfo.filters.model])
    if (reportInfo.filters.technology) summaryData.push(['Tecnologia', reportInfo.filters.technology])
  }

  const ws_summary = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, ws_summary, 'Resumo')

  // Aba de dispositivos detalhados
  if (deviceDetails.length > 0) {
    const ws_devices = XLSX.utils.json_to_sheet(deviceDetails.map(device => ({
      'ID': device.id,
      'Nome': device.name,
      'Modelo': device.model,
      'Status': device.status,
      'Última Atualização': device.lastUpdate,
      'Latitude': device.latitude,
      'Longitude': device.longitude,
      'Endereço': device.address,
      'Velocidade': device.speed,
      'Direção': device.course
    })))
    
    XLSX.utils.book_append_sheet(wb, ws_devices, 'Dispositivos')
  }

  // Aba de análise por marca (se houver dados)
  const brandAnalysis = deviceDetails.reduce((acc, device) => {
    if (device.model !== 'N/A') {
      const brand = getBrandFromModel(device.model) || 'Outros'
      acc[brand] = (acc[brand] || 0) + 1
    }
    return acc
  }, {})

  if (Object.keys(brandAnalysis).length > 0) {
    const brandData = [
      ['Marca', 'Quantidade', 'Percentual']
    ]
    
    Object.entries(brandAnalysis).forEach(([brand, count]) => {
      const percentage = Math.round((count / deviceDetails.length) * 100)
      brandData.push([brand, count, `${percentage}%`])
    })
    
    const ws_brands = XLSX.utils.aoa_to_sheet(brandData)
    XLSX.utils.book_append_sheet(wb, ws_brands, 'Análise por Marca')
  }

  // Salvar Excel
  const fileName = `relatorio-${reportInfo.template}-${Date.now()}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// Obter marca do modelo GPS
function getBrandFromModel(model) {
  if (!model) return null
  const modelMap = {
    "Coban": ["TK102", "TK103", "GPS303", "TK303", "TK305", "TK306", "TK307"],
    "Concox": ["GT06", "GT06N", "GT06E", "GT08", "X1", "X3", "AT4", "AT6", "JM-VL01"],
    "Queclink": ["GV55", "GV75", "GV300", "GV350", "GL50", "GL100", "GL200", "GL300"],
    "Teltonika": ["FMB001", "FMB002", "FMB010", "FMB110", "FMB120", "FMB125", "FMB130"],
    "Meitrack": ["T311", "T333", "T355", "T366", "MVT100", "MVT340", "MVT380"],
    "Sinotrack": ["ST-901", "ST-902", "ST-906", "ST-907", "ST-909", "ST-910"],
    "TK Star": ["TK905", "TK906", "TK909", "TK911", "TK915", "TK919"]
  }
  for (const [brand, models] of Object.entries(modelMap)) {
    if (models.includes(model)) {
      return brand
    }
  }
  return null
}

// Obter tecnologia do modelo GPS
function getTechnologyFromModel(model) {
  if (!model) return null
  const technologies = {
    'GSM': ['GT02', 'GT06', 'TK103', 'TK303', 'ST901', 'ST940'],
    '3G': ['GT300', 'GT600', 'GV200', 'GV300', 'VT400'],
    '4G': ['GT06N', 'GV350', 'GV500', 'VT900', 'AT4'],
    'Satellite': ['GlobalStar', 'Iridium', 'Thuraya'],
    'LoRa': ['LoRa-GPS', 'LoRaWAN']
  }
  
  for (const [tech, models] of Object.entries(technologies)) {
    if (models.includes(model)) {
      return tech
    }
  }
  return 'GSM' // default
}

const handleGpsBrandFilter = (brand) => {
  if (brand) {
    // Remove filtro anterior e adiciona novo
    advFilters.value = advFilters.value.filter(f => f.type !== 'gps_brand')
    advFilters.value.push({ type: 'gps_brand', value: brand })
    gpsBrandFilter.value = brand
    
    // Atualizar modelos disponíveis
    const brandModels = getBrandModels(brand)
    if (brandModels.length > 0) {
      commonGpsModels.value = brandModels
    }
  } else {
    // Desativar filtro
    advFilters.value = advFilters.value.filter(f => f.type !== 'gps_brand')
    gpsBrandFilter.value = ''
  }
}

const handleGpsModelFilter = (model) => {
  if (model) {
    advFilters.value = advFilters.value.filter(f => f.type !== 'gps_model')
    advFilters.value.push({ type: 'gps_model', value: model })
    gpsModelFilter.value = model
  } else {
    advFilters.value = advFilters.value.filter(f => f.type !== 'gps_model')
    gpsModelFilter.value = ''
  }
}

const handleTechnologyFilter = (tech) => {
  if (tech) {
    advFilters.value = advFilters.value.filter(f => f.type !== 'technology')
    advFilters.value.push({ type: 'technology', value: tech })
    technologyFilter.value = tech
  } else {
    advFilters.value = advFilters.value.filter(f => f.type !== 'technology')
    technologyFilter.value = ''
  }
}

/* aplicar filtros avançados */
function applyAdvanced(device, position){
  // Verificar filtros GPS
  if (gpsBrandFilter.value && device.model) {
    const brand = getBrandFromModel(device.model)
    if (brand !== gpsBrandFilter.value) return false
  }
  
  if (gpsModelFilter.value && device.model) {
    if (device.model !== gpsModelFilter.value) return false
  }
  
  if (technologyFilter.value) {
    const tech = getTechnologyFromModel(device.model)
    if (tech !== technologyFilter.value) return false
  }
  
  // Filtros avançados originais
  if (!advFilters.value.length) return true
  let visible = true
  for (const f of advFilters.value){
    if (!visible) break
    switch (f.type){
      case 'anchor': {
        try {
          visible = !!store.getters['geofences/isAnchored']?.(device.id)
        } catch (e) {
          visible = false
        }
        break
      }
      case 'driver':    visible = !!position?.attributes?.driverUniqueId; break
      case 'ignition':  visible = (position?.attributes?.ignition === f.value); break
      case 'locked':    visible = (position?.attributes?.blocked  === f.value); break
      default: break
    }
  }
  return visible
}

/* lista filtrada */
const filteredDevices = computed(() => {
  const groupsById = new Map((store.state.groups.groupList || []).map(g => [g.id, g]))
  const ordered    = store.getters['devices/getOrderedDevices'] || []
  const list = []
  for (const dk of ordered) {
    const d = store.getters['devices/getDevice'](dk); if (!d) continue
    const position = store.getters['devices/getPosition'](d.id)
    if (!matchSituacao(d)) continue
    if (!matchStateFilter(d)) continue
    if (!matchCombinedStatus(d,position)) continue
    if (!applyAdvanced(d,position)) continue
    if (!matchTextQuery(d,position,groupsById)) continue
    if (!matchTimeQuery(d)) continue
    list.push(d)
  }
  return list
})

/* virtualização */
const realDevices   = ref(null)
const offsetDevices = ref(0)
const maxDevices    = ref(0)
function recalcWindow(el){
  const h = el.clientHeight
  maxDevices.value = Math.floor(h / rowHeightPx.value) + 3
  offsetDevices.value = Math.floor(el.scrollTop / rowHeightPx.value)
}
function onScroll(e){ recalcWindow(e.target) }

/* ==== Medição da altura real do card dinâmico (para não cortar o footer) ==== */
let _resizeObs = null
function measureDynamicHeight () {
  if (!isDynamic.value) return
  const listEl = realDevices.value
  if (!listEl) return
  const firstItem = listEl.querySelector('.dyn-wrap')
  if (!firstItem) return
  const h = Math.round(firstItem.getBoundingClientRect().height)
  if (h && h !== dynamicRowPx.value) dynamicRowPx.value = h
}

/* Reagir a mudança de estilo para medir quando virar "dynamic" */
watch(estilo, async (val) => {
  await nextTick()
  if (val === 'dynamic') {
    measureDynamicHeight()
  }
  const el = realDevices.value
  if (el) recalcWindow(el)
})

onMounted(async () => {
  await nextTick()

  // mede a altura do card dinâmico (se estiver nesse modo)
  measureDynamicHeight()

  // calcula a janela e observa redimensionamentos
  const el = realDevices.value
  if (el) {
    recalcWindow(el)

    _resizeObs = new ResizeObserver(() => {
      measureDynamicHeight()
      recalcWindow(el)
    })

    _resizeObs.observe(el) // mudanças no container
    const firstItem = el.querySelector('.dyn-wrap')
    if (firstItem) _resizeObs.observe(firstItem) // mudanças no card
  }
})

onBeforeUnmount(() => {
  if (_resizeObs) {
    try {
      _resizeObs.disconnect()
    } catch (err) {
      // Evita catch vazio e ajuda na depuração sem quebrar em produção
      console.debug('[devices] ResizeObserver disconnect error:', err)
    } finally {
      _resizeObs = null
    }
  }
})


const visibleSlice = computed(() => {
  const start = offsetDevices.value
  const end   = Math.min(start + maxDevices.value, filteredDevices.value.length)
  return filteredDevices.value.slice(start, end)
})

/* agrupamento (modo tabela) */
const groupedDevices = computed(() => {
  const showGroups = store.getters['mapPref']('groups')
  const groups     = store.state.groups.groupList || []
  if (!showGroups) return [{ id: -1, name: '', devices: visibleSlice.value }]
  const tmp = {}
  for (const device of visibleSlice.value) {
    const gid = groups.find(g => g.id===device.groupId) ? device.groupId : 0
    if (!tmp[gid]) tmp[gid] = []
    tmp[gid].push(device)
  }
  const list = []
  list.push({ id: 0, name: 'Sem Grupo', devices: tmp[0] || [] })
  groups.forEach(g => { if (tmp[g.id]?.length) list.push({ id: g.id, name: g.name, devices: tmp[g.id] }) })
  return list
})

/* sync mapa */
const visibleIds = ref(new Set())
watch(visibleSlice, (rows) => {
  const next = new Set(rows.map((d) => d.id))
  visibleIds.value.forEach((id) => {
    if (!next.has(id)) {
      const d = store.getters['devices/getDevice'](id)
      if (d && d.icon && typeof d.icon.remove === 'function') d.icon.remove()
    }
  })
  next.forEach((id) => {
    if (!visibleIds.value.has(id)) {
      const d = store.getters['devices/getDevice'](id)
      if (d && d.icon && typeof d.icon.addToMap === 'function') d.icon.addToMap()
    }
  })
  visibleIds.value = next
}, { immediate: true })

/* helpers + dicas */
function pos(id){ return store.getters['devices/getPosition'](id) || null }
function showAlarmTip($event, deviceId){
  const p = pos(deviceId); const code = p?.attributes?.alarm
  showTip($event, KT('alarms.' + (code || 'none')))
}
function showDriverTip($event, deviceId){
  const p = pos(deviceId); const id = p?.attributes?.['driverUniqueId']
  if (id){
    const driver = store.getters['drivers/getDriverByUniqueId'](id)
    showTip($event, driver ? driver.name : id)
  }
}
function getLastUpdated(t){
  const tt = now.value
  if (t===null || !t) return KT('new')
  const diff = Math.round((new Date(tt).getTime() - new Date(t).getTime())/1000)
  if (diff < 0) return KT('now')
  if (diff > 86400) { const d = Math.round(diff/86400); return d + ' ' + KT('days') }
  if (diff > 3600)  { const h = Math.round(diff/3600);  return h + ' ' + KT('hours') }
  if (diff > 60)    { const m = Math.round(diff/60);    return m + ' ' + KT('minutes') }
  return KT('lessMinute')
}

/* sorting por estado */
const validStates = ['motion','anchor','locked','ignition','driver','alert']
function setSortingByState(){
  const tmp = (store.getters['devices/sorting'] || '').split('-')
  if (tmp[0] === 'state') {
    let idx = validStates.findIndex(i => i===tmp[1]) + 1
    if (idx > validStates.length - 1) store.dispatch('devices/setSorting','name')
    else store.dispatch('devices/setSortingState','state-' + validStates[idx])
  } else {
    store.dispatch('devices/setSortingState','state-motion')
  }
}

/* classes do card dinâmico */
function dynClass(device){
  const p = pos(device.id)
  return {
    'card--online':  device.status === 'online',
    'card--offline': device.status === 'offline',
    'card--moving':  !!p?.attributes?.motion,
    'card--alarm':   !!p?.attributes?.alarm
  }
}

/* ======== Exportações ======== */
function mapForExport(list){
  return list.map(d => ({
    id: d.id,
    uniqueId: d.uniqueId || '-',
    placa: d.attributes?.placa || '-',
    name: d.name || '-',
    phone: d.phone || '-',
    operator: d.attributes?.operator || '-',
    iccid: d.attributes?.iccid || '-',
    contact: d.contact || '-',
    category: d.category || '-',
    disabled: d.disabled ? 'Sim' : 'Não',
    lastUpdate: d.lastUpdate || null,
    status: d.status || '-',
    position: store.getters['devices/getPosition'](d.id) || null
  }))
}

function exportJSON(rows, filename){
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function exportXLSX(rows, sheetName, filename){
  const cols = ['ID','Unique ID','Placa','Nome','Telefone','Operador','ICCID','Contato','Categoria','Desabilitado','Última atualização','Status']
  const data = rows.map(d => [
    d.id, d.uniqueId, d.placa, d.name, d.phone, d.operator, d.iccid, d.contact, d.category, d.disabled,
    d.lastUpdate ? new Date(d.lastUpdate).toISOString().replace('T',' ').slice(0,19) : '-', d.status
  ])
  const ws = XLSX.utils.aoa_to_sheet([cols, ...data])
  ws['!cols'] = cols.map(() => ({ wch: 18 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

function exportPDF(rows, { title = 'Relatório de Dispositivos', filename = 'dispositivos.pdf' } = {}) {
  const { jsPDF } = window.jspdf || {}
  if (!jsPDF) { ElMessage.error('Biblioteca PDF não carregada.'); return }

  const doc = new jsPDF('landscape', 'mm', 'a4')

  // Cabeçalho
  doc.setFillColor(0,123,255)
  doc.rect(0, 0, 297, 22, 'F')

  const logoBase64 =
    (store?.state?.server?.labelConf?.logoWhiteBase64) ||
    (store?.state?.server?.labelConf?.logoBase64) || null
  if (logoBase64){
    try { doc.addImage(logoBase64, 'PNG', 8, 4, 28, 14) } catch (e) { console.debug('logo inválido', e) }
  }

  doc.setTextColor(255,255,255)
  doc.setFont('helvetica','bold'); doc.setFontSize(16)
  doc.text(title, logoBase64 ? 42 : 10, 10)
  doc.setFont('helvetica','normal'); doc.setFontSize(10)
  const resumo = `Total: ${rows.length} • On: ${counts.value.online} • Off: ${counts.value.offline} • Mov.: ${counts.value.moving} • Alerta: ${counts.value.alarm}`
  doc.text(`${new Date().toLocaleString()}  •  ${resumo}`, logoBase64 ? 42 : 10, 16)
  doc.setDrawColor(222,226,230); doc.line(8, 23, 289, 23)

  const autoTableFn = doc.autoTable || window.jspdfAutoTable
  if (autoTableFn){
    const headers = [
      { header:'ID', key:'id' },
      { header:'Nome', key:'name' },
      { header:'Unique ID', key:'uniqueId' },
      { header:'Status', key:'status' },
      { header:'Últ. Atualização', key:'lastUpdate' },
      { header:'Posição', key:'position' },
      { header:'Categoria', key:'category' },
    ]
    const tableData = rows.map(r => ({
      id: r.id,
      name: r.name || '-',
      uniqueId: r.uniqueId || '-',
      status: r.status || '-',
      lastUpdate: r.lastUpdate ? new Date(r.lastUpdate).toLocaleString('pt-BR') : '-',
      position: r.position ? `${Number(r.position.latitude).toFixed(5)}, ${Number(r.position.longitude).toFixed(5)}` : '-',
      category: r.category || '-'
    }))

    ;(doc.autoTable ? doc.autoTable({
      startY: 26,
      head: [headers.map(h => h.header) ],
      body: tableData.map(row => headers.map(h => row[h.key] )),
      theme:'grid',
      styles: { font:'helvetica', fontSize:9, cellPadding:3, lineColor:[222,226,230] },
      headStyles: { fillColor:[30,64,175], textColor:255, fontStyle:'bold', halign:'center' },
      alternateRowStyles: { fillColor:[240,249,255] },
      columnStyles: { 0:{cellWidth:15}, 1:{cellWidth:50}, 2:{cellWidth:38}, 3:{cellWidth:28}, 4:{cellWidth:40}, 5:{cellWidth:40}, 6:{cellWidth:'auto'} },
      didDrawPage: () => {
        const total = doc.internal.getNumberOfPages()
        const size  = doc.internal.pageSize
        const ph    = size.height || size.getHeight()
        const pw    = size.width  || size.getWidth()
        doc.setFontSize(8); doc.setTextColor(100)
        doc.text(`Página ${doc.internal.getCurrentPageInfo().pageNumber} de ${total}`, pw - 12, ph - 8, { align:'right' })
        const app = store?.state?.server?.labelConf?.appTitle || 'Sistema'
        doc.text(app, 10, ph - 8)
      }
    }) : autoTableFn(doc, {
      startY:26,
      head: [headers.map(h => h.header)],
      body: tableData.map(row => headers.map(h => row[h.key] )),
      theme:'grid',
      styles: { font:'helvetica', fontSize:9, cellPadding:3, lineColor:[222,226,230] },
      headStyles: { fillColor:[30,64,175], textColor:255, fontStyle:'bold', halign:'center' },
      alternateRowStyles: { fillColor:[240,249,255] }
    }))
  } else {
    // Fallback simples
    const cols = ['ID','Nome','Unique ID','Status','Últ. atualização','Categoria']
    const left=10, colW=44; let y=28
    doc.setFontSize(10); doc.setTextColor(33,37,41)
    doc.setFillColor(230,230,230); doc.rect(left, y-6, colW*cols.length, 6, 'F')
    cols.forEach((c,i)=> doc.text(c, left+2+i*colW, y-2))
    const fmt = (d) => d ? new Date(d).toLocaleString('pt-BR') : '-'
    rows.forEach((r, idx) => {
      if (y>195) { doc.addPage(); y=20 }
      doc.setFillColor(idx%2?255:245, idx%2?255:245, idx%2?255:245)
      doc.rect(left, y, colW*cols.length, 6, 'F')
      const row = [r.id, r.name || '-', r.uniqueId || '-', r.status || '-', fmt(r.lastUpdate), r.category || '-']
      row.forEach((v,i)=> doc.text(String(v).slice(0,26), left+2+i*colW, y+4))
      y += 6
    })
    const total = doc.internal.getNumberOfPages()
    for (let i=1;i<=total;i++){
      doc.setPage(i); doc.setFontSize(8)
      doc.text(`Página ${i} de ${total}`, 280, 205, { align:'right' })
    }
  }

  doc.save(filename)
}

function runReport(cmd){
  const [scope, fmt] = String(cmd || '').split(':')
  try {
    if (scope === 'visible') {
      const rows = mapForExport(visibleSlice.value)
      if (fmt === 'json') return exportJSON(rows, 'visible.json')
      if (fmt === 'xlsx') return exportXLSX(rows, 'Visíveis', 'visible.xlsx')
      if (fmt === 'pdf')  return exportPDF(rows, { title:'Dispositivos (visíveis)', filename:'visible.pdf' })
    }
    if (scope === 'online') {
      if (fmt === 'xlsx') return store.dispatch('reports/exportActiveExcel')
      if (fmt === 'json') return store.dispatch('reports/exportActiveJSON')
      if (fmt === 'pdf')  return exportPDF(mapForExport(filteredDevices.value.filter(d => d.status==='online')), { title:'Dispositivos Online', filename:'online.pdf' })
    }
    if (scope === 'offline') {
      if (fmt === 'xlsx') return store.dispatch('reports/exportOfflineExcel')
      if (fmt === 'json') return store.dispatch('reports/exportOfflineJSON')
      if (fmt === 'pdf')  return exportPDF(mapForExport(filteredDevices.value.filter(d => d.status==='offline')), { title:'Dispositivos Offline', filename:'offline.pdf' })
    }
    // fallback: exporta filtrados
    const rows = mapForExport(filteredDevices.value)
    if (fmt === 'json') return exportJSON(rows, 'dispositivos.json')
    if (fmt === 'xlsx') return exportXLSX(rows, 'Dispositivos', 'dispositivos.xlsx')
    if (fmt === 'pdf')  return exportPDF(rows, { title:'Relatório de Dispositivos', filename:'dispositivos.pdf' })
    ElMessage.warning('Tipo de relatório não disponível')
  } catch (e) {
    console.error('[devices] erro ao gerar/exportar relatório', e)
    ElMessage.error('Falha ao gerar relatório')
  }
}

/* Ir para aba Relatórios */
function goReports(kind){
  try {
    const patch =
      kind === 'online'  ? { only: 'online',  situacao: 'ativo' } :
      kind === 'offline' ? { only: 'offline' } :
      kind === 'moving'  ? { only: 'moving'  } :
      kind === 'alarm'   ? { only: 'alarm'   } :
                           { only: 'all'     }
    try { store.commit('reports/SET_FILTERS', patch) } catch (e) {
      console.debug('[devices] reports/SET_FILTERS indisponível', e)
    }
  } catch (e) {
    console.debug('[devices] erro preparando filtros p/ reports', e)
  }
  const targetQuery = kind ? { kind } : {}
  const tries = [
    () => router.push({ name: 'reports.resume', query: targetQuery }),
    () => router.push({ name: 'reports',        query: targetQuery }),
    () => router.push({ path: '/reports',       query: targetQuery }),
  ]
  ;(async () => {
    for (const t of tries) {
      try { await t(); return } catch (e) {
        console.debug('[devices] rota alternativa de reports falhou', e)
      }
    }
  })()
}

/* input clear (placeholder para o @clear do input) */
function onClearInput(){ /* noop */ }
</script>

<style scoped>
  /* =========================== LAYOUT BASE / CONTAINER =========================== */
  .devices-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  /* scroll principal da lista */
  .auto-fill {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .fakeScroll { width: 100%; }

  .list {
    border: 1px solid silver;
    border-radius: 6px;
    background: #fff;
  }

  /* =========================== CHIPS & BUSCA =========================== */
  .chips-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .chips-row :deep(.el-check-tag) {
    background: #f8fafc !important;
    border: 1px solid var(--el-border-color) !important;
    padding: 6px 10px !important;
    border-radius: 999px !important;
  }

  .chip i { margin-right: 6px; }
  .chip .chip-label { margin-right: 6px; }
  .clear-link { margin-left: 6px; white-space: nowrap; }

  /* contadores nos chips */
  .chip-count{
    display:inline-flex;align-items:center;justify-content:center;margin-left:8px;font-weight:800;
    min-width:22px;height:18px;padding:0 8px;border-radius:999px;font-size:12px;line-height:18px;border:none;
    background:#e5e7eb;color:#111827;
  }
  .chip-count.neutral{background:#e5e7eb;color:#111827;}
  .chip-count.online{background:#16a34a;color:#fff;}
  .chip-count.moving{background:#2563eb;color:#fff;}
  .chip-count.alarm{background:#ef4444;color:#fff;}
  .chip-count.offline{background:#6b7280;color:#fff;}

  .chip-badge{border:1px dashed var(--el-border-color);background:#f8fafc !important;}
  .chip-sit{background:#eef2ff !important;border-color:#a5b4fc;}
  .chip-style{background:#ecfeff !important;border-color:#67e8f9;}

  /* =========================== BARRA DE BUSCA + AÇÕES =========================== */
  .search-row{
    display:flex;align-items:center;gap:8px;margin-bottom:12px;width:100%;
    flex-wrap:nowrap; /* evita quebra dos botões */
  }

  /* input compacto */
  .search-input{flex:1 1 auto;min-width:0;}
  .search-input :deep(.el-input__wrapper){
    height:32px;padding-left:24px;padding-right:8px;box-shadow:0 1px 2px rgba(0,0,0,.06);
  }
  .search-input :deep(.el-input__inner){line-height:30px;font-size:13px;}
  .search-input :deep(.el-input__prefix){
    display:flex;align-items:center;padding-left:2px;gap:0;height:100%;
  }

  /* ícone “filtros” dentro do input – pequeno */
  .filter-toggle-button{
    padding:0;margin-left:2px;margin-right:4px;position:relative;color:#909399;width:12px;height:12px;
    display:inline-flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;font-size:10px;
  }
  .filter-toggle-button:hover{color:var(--el-color-primary);transform:translateY(-1px);}
  .filter-toggle-button.active{color:var(--el-color-primary);transform:scale(1.05);text-shadow:0 0 5px rgba(64,158,255,.25);}
  .filter-badge{
    position:absolute;top:-6px;right:-7px;background:#F56C6C;color:#fff;border-radius:10px;min-width:14px;height:14px;
    font-size:9px;padding:0 4px;display:flex;align-items:center;justify-content:center;font-weight:700;box-sizing:border-box;
    box-shadow:0 1px 2px rgba(0,0,0,.2);animation:pulseBadge 2s infinite;
  }

  /* grupo de ações à direita (NÃO mexe no filtro) */
  .actions-group{
    display:flex;align-items:center;gap:6px;flex-wrap:nowrap;flex-shrink:0;min-width:fit-content;
    margin-left:auto; /* empurra os botões para a direita */
  }
  .action-button{ box-shadow:0 2px 4px rgba(0,0,0,.08); }

  /* botões arredondados da barra */
  .search-row .el-button{
    border-radius:50% !important;width:32px;height:32px;min-width:32px;padding:0;
    display:inline-flex;align-items:center;justify-content:center;
    box-shadow:0 3px 6px rgba(0,0,0,.12);transition:all .15s ease;flex-shrink:0;
  }
  .search-row .el-button:hover{transform:translateY(-1px);box-shadow:0 4px 8px rgba(0,0,0,.16);}

  /* CTA adicionar */
  .add-btn{
    background:var(--el-color-primary);border-color:var(--el-color-primary);color:#fff;
    box-shadow:0 4px 8px rgba(0,110,255,.18);transition:transform .15s, box-shadow .15s;
  }
  .add-btn:hover{transform:translateY(-2px);box-shadow:0 6px 12px rgba(0,110,255,.28);}

  /* botão relatórios */
  .reports-btn{
    background:var(--el-color-info-light-3);border-color:var(--el-color-info-light-5);
    color:var(--el-color-info);box-shadow:0 3px 6px rgba(96,98,102,.15);
  }

  /* =========================== CABEÇALHO MODO TABELA =========================== */
  .deviceHead{
    border-bottom:var(--el-border-color-light) 1px solid;display:flex;flex-direction:row;align-items:center;
    cursor:pointer;margin-right:-1px;background:var(--el-color-info-light);
  }
  .name{
    font-size:12px;padding:7px;text-align:left;line-height:14px;font-weight:800;border-right:var(--el-border-color-light) 1px dotted;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  }
  .col-id{flex:0 0 52px;text-align:center;}
  .col-name{flex:1 1 48%;}
  .col-status{flex:0 0 34px;text-align:center;}
  .col-updated{flex:0 0 96px;text-align:center;}
  .col-icons{flex:0 0 148px;display:flex;align-items:center;justify-content:center;}

  /* =========================== GRUPOS E LINHAS =========================== */
  .groupTitle{
    background:#f7f7f7;padding:6px 8px;font-size:13px;display:flex;align-items:center;gap:8px;
    border-bottom:1px dashed var(--el-border-color-lighter);
  }
  .group-count{
    margin-left:auto;background:#eef2ff;color:#4f46e5;font-weight:700;font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid #c7d2fe;
  }

  .device{
    border-bottom:var(--el-border-color-light) 1px solid;display:flex;flex-direction:row;align-items:center;cursor:pointer;margin-right:-1px;
    transition:background .2s ease;
  }
  .device:hover{ background:var(--el-color-primary-light-9); }
  .text-center{ text-align:center; }
  .isDisabled{ opacity:.45; }

  /* =========================== ÍCONES =========================== */
  .icons{display:flex;justify-content:center;align-items:center;gap:6px;font-size:11px;}
  .icons>div{display:flex;justify-content:center;align-items:center;width:24px;height:22px;}
  .icons:not(.muted)>div i{font-size:12px;line-height:1;padding:4px;border-radius:999px;box-shadow:0 0 0 1px var(--el-border-color-lighter) inset;}
  .icons.muted{color:var(--el-text-color-disabled);gap:8px;}
  .icons.muted i{padding:0;box-shadow:none;}

  /* =========================== CARD DINÂMICO =========================== */
  .dyn-wrap{padding:8px 10px;}
  .dyn-wrap>*{
    position:relative;background:#fff;border:1px solid #d1d5db;border-radius:16px;box-shadow:0 4px 12px rgba(16,24,40,.08);
    overflow:visible;transition:transform .2s ease, box-shadow .2s ease;
  }
  .dyn-wrap>*:hover{transform:translateY(-2px);box-shadow:0 8px 16px rgba(16,24,40,.12);}
  .dyn-wrap>*::before{
    content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--accent,#e5e7eb);
    border-top-left-radius:16px;border-bottom-left-radius:16px;
  }
  .card--online>*{--accent:#22c55e;}
  .card--moving>*{--accent:#3b82f6;}
  .card--alarm>*{--accent:#ef4444;}
  .card--offline>*{--accent:#9ca3af;}

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

  .filters-row{display:flex;flex-direction:row;align-items:center;margin-bottom:6px;gap:6px;}
  .primary-row{
    background:linear-gradient(to right,#e8f3ff,#ecf8ff);border-radius:5px;padding:5px 6px;border:1px solid #d8ebff;margin-bottom:5px;
    position:relative;box-shadow:inset 0 1px 3px rgba(0,0,0,.03);
  }
  .secondary-row{display:flex;justify-content:space-between;gap:6px;}
  .section-wrapper{flex:1;background:#f5f8fa;border-radius:4px;padding:4px;border:1px solid #edf2f7;box-shadow:0 1px 2px rgba(0,0,0,.02);}

  .category-label{
    font-size:10px;font-weight:600;color:#409EFF;margin-right:8px;display:flex;align-items:center;min-width:45px;
  }
  .category-label.small{
    font-size:9px;margin-bottom:2px;display:block;text-align:center;margin-right:0;color:#606266;
  }

  .filters-group{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;}

  /* botões “chip” */
  .filter-chip{
    background:#fff;border:1px solid var(--el-border-color);border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer;transition:all .2s;
  }
  .filter-chip:hover{border-color:var(--el-color-primary);color:var(--el-color-primary);}
  .filter-chip.active{background:#eff6ff;border-color:#93c5fd;color:#1d4ed8;}
  .filter-chip.ghost{background:#fff;border-style:dashed;}

  /* ícones padrão */
  .filter-icon{
    border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s ease;border:1px solid transparent;
    background:#f5f5f5;margin:0;position:relative;box-shadow:0 1px 2px rgba(0,0,0,.05);
  }
  .filter-icon:hover{transform:scale(1.1);box-shadow:0 2px 4px rgba(0,0,0,.15);}
  .filter-icon.large{width:24px;height:24px;font-size:11px;}
  .filter-icon.medium{width:20px;height:20px;font-size:9px;}
  .filter-icon.small{width:16px;height:16px;font-size:8px;}
  .filter-icon.active{border-color:currentColor;background:rgba(255,255,255,.9);}

  /* cores por categoria */
  .filter-icon.installed{color:#67c23a;}
  .filter-icon.in-service{color:#409eff;}
  .filter-icon.in-stock{color:#909399;}
  .filter-icon.with-failures{color:#f56c6c;}
  .filter-icon.company{color:#e6a23c;}
  .filter-icon.all{color:#606266;}
  .filter-icon.withdrawn{color:#3F51B5;}

  /* Conectividade */
  .filter-icon.motion{color:#2196F3;}
  .filter-icon.stopped{color:#FF9800;}
  .filter-icon.online{color:#4CAF50;}
  .filter-icon.unknown{color:#9E9E9E;}
  .filter-icon.offline{color:#F44336;}

  /* ===== Estado + Situação ===== */
  .state-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
  .subsection{
    display:flex;align-items:center;gap:6px;background:#fff;border:1px dashed #dbeafe;border-radius:8px;padding:4px 6px;
  }
  .subsection .category-label.small{margin:0 4px 0 0;}

  /* Situação (ícones) */
  .filter-icon.sit-all{color:#606266;}
  .filter-icon.sit-ativo{color:#16a34a;}
  .filter-icon.sit-estoque{color:#64748b;}
  .filter-icon.sit-desativado{color:#ef4444;}

  /* ===== Linha “Estilo” ===== */
  .style-row{display:flex;align-items:center;gap:6px;}
  .filter-icon.style-cozy{color:#0ea5e9;}
  .filter-icon.style-compact{color:#2563eb;}
  .filter-icon.style-ultra{color:#7c3aed;}
  .filter-icon.style-dynamic{color:#06b6d4;}

  /* ===== Linha “Offlines” ===== */
  .offline-row{display:flex;align-items:center;gap:6px;}
  .filter-chip.off-1h.active{border-color:#f59e0b;color:#b45309;}
  .filter-chip.off-2h.active{border-color:#f97316;color:#9a3412;}
  .filter-chip.off-6h.active{border-color:#ef4444;color:#991b1b;}
  .filter-chip.off-12h.active{border-color:#dc2626;color:#7f1d1d;}
  .filter-chip.off-24h.active{border-color:#b91c1c;color:#7f1d1d;}

  /* ===== GPS Avançado ===== */
  .gps-filters{
    display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;
  }
  .filter-dropdown{
    position:relative;min-width:120px;
  }
  .gps-select{
    width:100%;padding:4px 8px;border:1px solid #dbeafe;border-radius:6px;background:#fff;
    font-size:11px;color:#374151;transition:all .2s ease;outline:none;
  }
  .gps-select:focus{
    border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.1);
  }
  .gps-select:disabled{
    background:#f9fafb;color:#9ca3af;cursor:not-allowed;
  }
  .brand-select{border-color:#16a34a;}
  .model-select{border-color:#2563eb;}
  .tech-select{border-color:#7c3aed;}
  
  .filter-icon.clear-gps{
    color:#ef4444;background:#fef2f2;border-color:#fecaca;
  }
  .filter-icon.clear-gps:hover{
    background:#fee2e2;transform:scale(1.1);
  }

  /* contadores auxiliares em containers */
  .devices-count{
    position:absolute;top:-20px;right:10px;font-size:12px;background:#f0f0f0;padding:3px 10px;border-radius:12px;color:#666;font-weight:bold;z-index:10;
  }
  .filter-counter{
    position:absolute;top:-20px;left:10px;font-size:12px;background:#f0f7ff;padding:3px 10px;border-radius:12px;color:var(--el-color-primary);
    font-weight:bold;z-index:10;display:flex;align-items:center;gap:5px;animation:fadeIn .3s ease-in-out;
  }
  .filter-bubble{
    background:var(--el-color-primary);color:#fff;font-size:11px;font-weight:bold;border-radius:50%;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;
    padding:0 4px;box-shadow:0 1px 2px rgba(0,0,0,.2);animation:pulseBubble 2s infinite;
  }

  /* =========================== POPPERS / DROPDOWNS =========================== */
  :deep(.dropdown-popper){ z-index:4000 !important; }

  /* =========================== ANIMAÇÕES =========================== */
  @keyframes pulseBadge{0%{transform:scale(1)}50%{transform:scale(1.1)}100%{transform:scale(1)}}
  @keyframes pulseBubble{0%{transform:scale(1)}50%{transform:scale(1.05)}100%{transform:scale(1)}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}

  /* =========================== RESPONSIVIDADE =========================== */
  @media (max-width:900px){
    .col-icons{flex-basis:140px;}
    .col-updated{flex-basis:92px;}
  }

  @media (max-width:640px){
    .chips-row :deep(.el-check-tag){padding:6px 8px !important;}
  }

  @media (max-width:420px){
    .col-id{display:none;}
    .col-name{flex:1 1 60%;}
    .col-icons{flex-basis:132px;}
    .col-updated{flex-basis:86px;}
    .name{padding:6px;}
    .groupTitle{font-size:12px;}

    /* barra de busca: tudo na MESMA LINHA */
    .search-row{gap:6px;flex-wrap:nowrap !important;}
    .search-input{font-size:14px;flex:1 1 auto;min-width:0;}
    .search-input :deep(.el-input__wrapper){height:30px;padding-left:20px;padding-right:8px;}
    .search-input :deep(.el-input__prefix){padding-left:2px;}
    .actions-group{gap:6px;flex-shrink:0;margin-left:auto;}

    .search-row .el-button{width:30px;height:30px;min-width:30px;}
  }

  /* ——— MOBILE: encolher botões + ícones da barra ——— */
  @media (max-width:420px){
    .search-input :deep(.el-input__wrapper){height:32px;padding-left:8px;padding-right:8px;font-size:14px;}
    .search-row .el-button,
    .search-row .el-button.el-button--small{
      width:32px;height:32px;min-width:32px;padding:0;border-radius:50% !important;box-shadow:0 2px 4px rgba(96,98,102,.15);
    }
    .search-row .el-button i,
    .search-row .el-button .el-icon{font-size:14px;line-height:1;}
    .add-btn,.reports-btn{
      height:32px;min-height:32px;padding:0 12px;font-size:14px;border-radius:16px;box-shadow:0 4px 6px rgba(0,110,255,.2);
    }
    .reports-btn{
      background:var(--el-color-info-light-3);border-color:var(--el-color-info-light-5);color:var(--el-color-info);
      box-shadow:0 2px 4px rgba(96,98,102,.15);
    }
    .add-btn i,.reports-btn i{font-size:14px;margin-right:4px;}
    /* mantém os botões ao lado do input */
    .search-row{gap:8px;width:100%;flex-wrap:nowrap !important;}
    .actions-group{gap:8px;margin-left:auto;}
    .search-input{flex:1 1 auto;min-width:120px;}
  }

  /* ===== FIX: botões da barra menores e 100% circulares ===== */
.search-row .el-button,
.search-row .el-button.el-button--small {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  box-shadow: 0 2px 4px rgba(0,0,0,.12);
}

/* Remove o padding interno do <span> do Element Plus (que causava a “pílula”) */
.search-row .el-button > span {
  padding: 0 !important;
  line-height: 1 !important;
}

/* Garante que os dois botões sejam tratados como ícone-only */
.add-btn,
.reports-btn {
  padding: 0 !important;
  min-height: 28px !important;
  height: 28px !important;
  width: 28px !important;
  border-radius: 50% !important;
}

/* Tamanho do ícone */
.search-row .el-button i,
.search-row .el-button .el-icon,
.add-btn i,
.reports-btn i {
  font-size: 12px !important;
  line-height: 1 !important;
}

/* Em telas bem pequenas, pode reduzir mais um pouco opcionalmente */
@media (max-width: 420px) {
  .search-row .el-button,
  .search-row .el-button.el-button--small,
  .add-btn,
  .reports-btn {
    width: 26px !important;
    height: 26px !important;
    min-width: 26px !important;
  }
  .search-row .el-button i,
  .search-row .el-button .el-icon,
  .add-btn i,
  .reports-btn i {
    font-size: 11px !important;
  }
}

/* ===== PROFESSIONAL REPORTS MODAL ===== */
.reports-modal :deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

.reports-modal :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
}

.reports-modal :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.reports-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 24px 0;
}

.config-section h3,
.preview-section h3 {
  color: #2d3748;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-section h3 i {
  color: #4299e1;
}

.preview-section h3 i {
  color: #38a169;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-group :deep(.el-select),
.form-group :deep(.el-date-picker) {
  width: 100%;
}

.date-range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: end;
}

.date-range label {
  margin-bottom: 4px;
}

.filter-summary {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  min-height: 60px;
}

.no-filters {
  color: #a0aec0;
  font-style: italic;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-tag {
  background: #bee3f8;
  color: #2b6cb0;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.export-options :deep(.el-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-options :deep(.el-radio) {
  margin-right: 0;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;
}

.export-options :deep(.el-radio:hover) {
  border-color: #4299e1;
  background: #f0f8ff;
}

.export-options :deep(.el-radio.is-checked) {
  border-color: #4299e1;
  background: #e6f3ff;
}

.export-options :deep(.el-radio__label) {
  font-weight: 500;
  color: #2d3748;
}

.export-options i {
  margin-right: 8px;
  width: 16px;
}

.template-preview {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  min-height: 200px;
}

.preview-content h4 {
  color: #2d3748;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.preview-content p {
  color: #4a5568;
  margin-bottom: 8px;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
}

.dialog-footer :deep(.el-button) {
  padding: 10px 20px;
  font-weight: 500;
}

.dialog-footer :deep(.el-button--primary) {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  border: none;
}

/* Responsivo */
@media (max-width: 768px) {
  .reports-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .date-range {
    grid-template-columns: 1fr;
  }
}

/* ===== ENHANCED ANIMATIONS AND INTERACTIONS ===== */
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

/* Animações para painéis */
.filters-panel {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.section-wrapper {
  animation: slideInRight 0.3s ease-out;
  transition: all 0.3s ease;
}

.section-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Melhorias nos filtros */
.filter-icon {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.filter-icon::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.filter-icon:hover::before {
  left: 100%;
}

.filter-icon:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.filter-icon.active {
  animation: pulseGlow 2s infinite;
  transform: scale(1.02);
}

/* Melhorias nos selects GPS */
.gps-select {
  transition: all 0.3s ease;
  position: relative;
}

.gps-select:focus {
  transform: scale(1.02);
  animation: bounceIn 0.6s ease-out;
}

.gps-select:hover {
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
}

/* Micro-interações nos botões */
.add-btn,
.clear-all-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.add-btn:hover,
.clear-all-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.add-btn::after,
.clear-all-btn::after {
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
.clear-all-btn:active::after {
  width: 300px;
  height: 300px;
}

/* Efeitos nos dropdowns */
:deep(.el-dropdown-menu) {
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: fadeInUp 0.3s ease-out;
}

:deep(.el-dropdown-menu__item) {
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 4px 8px;
}

:deep(.el-dropdown-menu__item:hover) {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  transform: translateX(4px);
}

/* Melhorias na busca */
.search-input :deep(.el-input__wrapper) {
  transition: all 0.3s ease;
  border-radius: 12px;
}

.search-input :deep(.el-input__wrapper):focus-within {
  transform: scale(1.02);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 8px 25px rgba(0, 0, 0, 0.1);
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

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Enhanced responsiveness */
@media (max-width: 640px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .category-label {
    text-align: center;
    margin-bottom: 8px;
  }
  
  .filters-group {
    justify-content: center;
  }
  
  .gps-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-dropdown {
    min-width: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}


/* =========================== MOBILE FIX (≤420px): garantir botões visíveis =========================== */
@media (max-width:420px){
  /* força TAMANHO/CÍRCULO e visibilidade */
  .actions-group .el-button,
  .actions-group .el-button.el-button--small,
  .actions-group .add-btn,
  .actions-group .reports-btn{
    display:inline-flex !important;
    align-items:center !important;
    justify-content:center !important;
    width:30px !important;
    height:30px !important;
    min-width:30px !important;
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
    box-shadow:0 3px 6px rgba(0,110,255,.18) !important;
  }
  .actions-group .reports-btn{
    background:var(--el-color-info-light-3) !important;
    border-color:var(--el-color-info-light-5) !important;
    color:var(--el-color-info) !important;
    box-shadow:0 2px 4px rgba(96,98,102,.15) !important;
  }

  /* tamanho do ícone */
  .actions-group .el-button i,
  .actions-group .el-button .el-icon{
    font-size:14px !important;
    line-height:1 !important;
  }
}
</style>
