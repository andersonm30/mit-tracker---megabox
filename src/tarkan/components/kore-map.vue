<template>
  <div class="kore-map-root">
    <div class="map-wrapper">
      <div ref="mapContainer" id="map-container">
      <LMap id="LMap" :options="{ preferCanvas: true, zoomControl: false }" :use-global-leaflet="true" ref="map"
        :zoom="zoomForce" :min-zoom="3" :max-zoom="21" :zoom-animation="true" :fade-animation="true"
        :marker-zoom-animation="false" @ready="mapReady($event)" @click="mapClick" @mousemove="mapMove" :center="center"
        @update:zoom="zoomUpdated($event)" style="width: 100%;height: 100%;">
        <!-- ============================================================== -->
        <!-- CONTROLES SUPERIORES DIREITO - Container Vertical Moderno      -->
        <!-- ============================================================== -->
        <l-control position="topright">
          <div class="vertical-controls-container">
            <!-- Botão fechar rotas -->
            <el-button type="danger" size="small" v-if="store.state.devices.showRoutes" @click="closeRoutes()"
              style="margin-bottom: 1px;">
              <i class="fas fa-times"></i>
            </el-button>

            <!-- Botão compartilhar -->
            <el-button size="small" style="margin-bottom: 1px;"
              v-if="store.state.server.isPlus && ((store.state.server.serverInfo?.attributes?.['tarkan.enableAdvancedPerms'] && store.getters.advancedPermissions(24))) || (!store.state.server.serverInfo?.attributes?.['tarkan.enableAdvancedPerms'] && !store.state.auth.attributes?.['isShared'] && !store.getters['isReadonly'])"
              @click="editSharesRef.showShares()">
              <i class="fas fa-share-alt"></i>
            </el-button>

            <!-- Dropdown de Visibilidade (Olho) -->
            <el-dropdown v-if="!store.state.auth.attributes?.['isShared']" size="small" trigger="click"
              placement="left-start" popper-class="kore-map-popper" style="margin-bottom: 1px; display: block;">
              <el-button size="small"><i class="fas fa-eye"></i></el-button>
              <template #dropdown>
                <el-dropdown-menu class="professional-dropdown">
                  <!-- Busca -->
                  <div style="padding: 8px 10px;">
                    <el-input v-model="eyeFilter" size="small" placeholder="Buscar..."
                      prefix-icon="el-icon-search"></el-input>
                  </div>

                  <div class="section-title">
                    <i class="fas fa-cog" style="margin-right: 6px;"></i>{{ KT('map.preferences') }}
                  </div>

                  <!-- Agrupar Markers (Cluster): Agrupa veículos próximos para melhor visualização em contas grandes -->
                  <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                    <i class="fas fa-globe" style="width: 20px; font-size: 11px;"></i>
                    <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showCluster') || 'Agrupar (cluster)' }}</span>
                    <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                      :model-value="store.getters['mapPref']('clustered', true)"
                      @click="store.dispatch('setMapPref', ['clustered', store.getters['mapPref']('clustered', true) ? false : true])"></el-switch>
                  </div>

                  <!-- Mostrar Grupos: Exibe agrupamento visual por grupos de dispositivos -->
                  <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                    <i class="fas fa-layer-group" style="width: 20px; font-size: 11px;"></i>
                    <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showGroups') || 'Mostrar grupos' }}</span>
                    <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                      :model-value="store.getters['mapPref']('groups')"
                      @click="store.dispatch('setMapPref', 'groups')"></el-switch>
                  </div>

                  <!-- Mostrar Geocercas: Exibe/oculta as áreas delimitadas (cercas virtuais) -->
                  <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                    <i class="fas fa-draw-polygon" style="width: 20px; font-size: 11px;"></i>
                    <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showGeofences') }}</span>
                    <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                      v-model="showGeofences"></el-switch>
                  </div>

                  <!-- Mostrar Nomes das Geocercas: Exibe nomes das geocercas no mapa (só aparece se geocercas ativas) -->
                  <div v-if="showGeofences" style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                    <i class="fas fa-tag" style="width: 20px; font-size: 11px; margin-left: 20px;"></i>
                    <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showGeofenceNames') || 'Nomes das geocercas' }}</span>
                    <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                      :model-value="store.getters['mapPref']('geofenceNames')"
                      @change="(value) => store.dispatch('setMapPref', ['geofenceNames', value])"></el-switch>
                  </div>

                  <!-- Mostrar Nomes: Exibe o nome do veículo no mapa -->
                  <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                    <i class="fas fa-tag" style="width: 20px; font-size: 11px;"></i>
                    <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showNames') }}</span>
                    <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                      :model-value="store.getters['mapPref']('name')"
                      @click="store.dispatch('setMapPref', 'name')"></el-switch>
                  </div>

                  <!-- Mostrar Placas: Exibe a placa do veículo no mapa -->
                  <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                    <i class="fas fa-id-card" style="width: 20px; font-size: 11px;"></i>
                    <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showPlates') }}</span>
                    <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                      :model-value="store.getters['mapPref']('plate')"
                      @click="store.dispatch('setMapPref', 'plate')"></el-switch>
                  </div>

                  <!-- Mostrar Status: Exibe indicador de status (online/offline) no ícone -->
                  <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                    <i class="fas fa-info-circle" style="width: 20px; font-size: 11px;"></i>
                    <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showStatus') }}</span>
                    <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                      :model-value="store.getters['mapPref']('status')"
                      @click="store.dispatch('setMapPref', 'status')"></el-switch>
                  </div>

                  <!-- Mostrar Precisão GPS: Exibe círculo de precisão do GPS ao redor do veículo -->
                  <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                    <i class="fas fa-crosshairs" style="width: 20px; font-size: 11px;"></i>
                    <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showPrecision') }}</span>
                    <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                      :model-value="store.getters['mapPref']('precision')"
                      @click="store.dispatch('setMapPref', 'precision')"></el-switch>
                  </div>

                  <!-- Seção Dispositivos -->
                  <div class="section-title"
                    style="display: flex; justify-content: space-between; align-items: center;">
                    <span><i class="fas fa-car" style="margin-right: 6px;"></i>{{ KT('device.devices') || 'Dispositivos'
                      }}</span>
                    <div style="font-size: 9px; white-space: nowrap;">
                      <a @click.prevent="eyeAll(true)"
                        style="color: var(--el-color-primary);text-decoration: none;margin-right: 4px;">{{ KT('all') ||
                        'Todos' }}</a>
                      <span style="margin: 0 2px;">|</span>
                      <a @click.prevent="eyeAll(false)"
                        style="color: var(--el-color-primary);text-decoration: none;margin-left: 4px;">{{ KT('none') ||
                        'Nenhum' }}</a>
                    </div>
                  </div>

                  <div style="overflow: auto; max-height: 50vh; padding-top: 2px;">
                    <el-dropdown-item v-for="(t, tk) in availableTypes" :key="tk"
                      @click="store.dispatch('devices/toggleHiddenFilter', t.key)"
                      style="height: auto !important; padding: 0 !important; display: block !important;">
                      <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 2px;">
                        <i class="fas fa-car" style="width: 20px; font-size: 11px;"></i>
                        <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ t.name }}</span>
                        <el-switch :key="'chk' + t.key" style="min-width: 36px; justify-content: flex-end;" size="small"
                          :model-value="store.getters['devices/isHiddenFilter'](t.key)" disabled></el-switch>
                      </div>
                    </el-dropdown-item>
                  </div>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <!-- Dropdown de Camadas -->
            <el-dropdown size="small" trigger="click" placement="left-start"
              popper-class="kore-map-popper" style="margin-bottom: 1px; display: block;">
              <el-button size="small"><i class="fas fa-layer-group"></i></el-button>
              <template #dropdown>
                <el-dropdown-menu class="professional-dropdown">
                  <div class="section-title">
                    <i class="fas fa-layer-group" style="margin-right: 6px;"></i>{{ KT('map.layers') || 'Camadas' }}
                  </div>
                  <el-dropdown-item v-for="(m, mk) in availableMaps" :key="'map-' + mk" @click="changeMap(m.id)"
                    style="padding: 5px 12px; min-height: auto;">
                    <el-radio v-model="selectedMap" :label="m.id" size="small"
                      style="margin-right: 0; display: flex; align-items: center;">
                      <span style="font-size: 11px; font-weight: 500; white-space: nowrap;">{{ m.name }}</span>
                    </el-radio>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <!-- Botão Atualizar -->
            <el-tooltip placement="left" :content="KT('map.refresh') || 'Atualizar Mapa'">
              <el-button size="small" @click="refreshMap" style="margin-bottom: 1px;">
                <i class="fas fa-sync"></i>
              </el-button>
            </el-tooltip>

            <!-- Botão Busca no Mapa -->
            <el-tooltip placement="left" :content="KT('map.search.toggle') || 'Buscar Dispositivo'">
              <el-button size="small" @click="toggleMapSearch" style="margin-bottom: 1px;">
                <i class="fas fa-search"></i>
              </el-button>
            </el-tooltip>

            <!-- Botão Assistente Virtual / WhatsApp (condicional) -->
            <el-tooltip
              v-if="!store.state.auth.attributes?.['isShared'] && store.state.server.labelConf?.whatsapp && store.state.server.labelConf.whatsapp !== ''"
              placement="left" :content="KT('map.whatsappAssistant') || 'Assistente Virtual'">
              <el-button size="small" @click="openWhatsAppAssistant" style="margin-bottom: 1px;" type="success">
                <i class="fas fa-headset"></i>
              </el-button>
            </el-tooltip>
          </div>
        </l-control>

        <!-- ============================================================== -->
        <!-- CONTROLES SUPERIORES ESQUERDO - Status Counters Modernos       -->
        <!-- ============================================================== -->
        <l-control position="topleft" v-if="!store.state.auth.attributes?.['isShared']">
          <div class="status-counters">
            <el-tooltip placement="right-start" :content="KT('all') || 'Todos'">
              <div class="counter all" :class="{ active: store.state.devices.applyFilters.statusFilter === 'all' }"
                @click="store.dispatch('devices/setStatusFilter', 'all')">
                {{ store.getters['devices/deviceCount'].all }}
              </div>
            </el-tooltip>
            <el-tooltip placement="right-start" :content="KT('online') || 'Online'">
              <div class="counter online" :class="{ active: store.state.devices.applyFilters.statusFilter === 'online' }"
                @click="store.dispatch('devices/setStatusFilter', 'online')">
                {{ store.getters['devices/deviceCount'].online }}
              </div>
            </el-tooltip>
            <el-tooltip placement="right-start" :content="KT('offline') || 'Offline'">
              <div class="counter offline" :class="{ active: store.state.devices.applyFilters.statusFilter === 'offline' }"
                @click="store.dispatch('devices/setStatusFilter', 'offline')">
                {{ store.getters['devices/deviceCount'].offline }}
              </div>
            </el-tooltip>
            <el-tooltip placement="right-start" :content="KT('unknown') || 'Desconhecido'">
              <div class="counter unknown" :class="{ active: store.state.devices.applyFilters.statusFilter === 'unknown' }"
                @click="store.dispatch('devices/setStatusFilter', 'unknown')">
                {{ store.getters['devices/deviceCount'].unknown }}
              </div>
            </el-tooltip>
            <el-tooltip placement="right-start" :content="KT('device.moving') || 'Em Movimento'">
              <div class="counter motion" :class="{ active: store.state.devices.applyFilters.motionFilter }"
                @click="store.dispatch('devices/toggleMotionFilter')">
                {{ store.getters['devices/deviceCount'].motion }}
              </div>
            </el-tooltip>
          </div>

          <!-- ============================================================== -->
          <!-- WIDGET DE PLAYBACK MODERNO                                     -->
          <!-- ============================================================== -->
          <div v-if="store.state.devices.showRoutes" class="modern-playback-widget">
            <!-- Timeline Section -->
            <div class="timeline-section">
              <div class="timeline-track" @click="moveTimelinePosition($event)">
                <div class="timeline-progress" :style="{ width: `${routePlayPos}px` }"></div>
                <div class="timeline-handle"
                  :style="{ left: (routePlayPos + 10) + 'px', cursor: isDragging ? 'grabbing' : 'grab' }"
                  @mousedown="startDrag" @touchstart="startDrag">
                  <i class="fas fa-grip-lines-vertical"></i>
                </div>
              </div>
            </div>

            <!-- Controls Section -->
            <div class="modern-playback-controls">
              <!-- Secondary Controls -->
              <div class="secondary-controls">
                <button @click="stopPlayRoute()" class="control-btn secondary-btn"
                  :title="KT('playback.stop') || 'Parar'">
                  <i class="fas fa-stop"></i>
                </button>
                <button @click="restartPlayRoute()" class="control-btn secondary-btn"
                  :title="KT('playback.restart') || 'Reiniciar'">
                  <i class="fas fa-redo-alt"></i>
                </button>
                <button @click="moveBackward()" class="control-btn secondary-btn"
                  :title="KT('playback.backward') || 'Retroceder'">
                  <i class="fas fa-step-backward"></i>
                </button>
              </div>

              <!-- Primary Play/Pause Button -->
              <div class="primary-control">
                <button v-if="routePlayState" @click="pausePlayRoute()" class="control-btn primary-btn"
                  :title="KT('playback.pause') || 'Pausar'">
                  <i class="fas fa-pause"></i>
                </button>
                <button v-else @click="runPlayRoute()" class="control-btn primary-btn"
                  :title="KT('playback.play') || 'Reproduzir'">
                  <i class="fas fa-play"></i>
                </button>
              </div>

              <!-- Secondary Controls -->
              <div class="secondary-controls">
                <button @click="moveForward()" class="control-btn secondary-btn"
                  :title="KT('playback.forward') || 'Avançar'">
                  <i class="fas fa-step-forward"></i>
                </button>
                <button @click="togglePlaybackSpeed()" class="control-btn speed-btn"
                  :title="'Velocidade: ' + playbackSpeed + 'x'">
                  {{ playbackSpeed }}x
                </button>
                <button @click="showRouteDetails()" class="control-btn secondary-btn"
                  :title="KT('attribute.details') || 'Detalhes'">
                  <i class="fas fa-info"></i>
                </button>
              </div>
            </div>
          </div>
        </l-control>

        <!-- ============================================================== -->
        <!-- PAINEL DE DETALHES DA ROTA (AVANÇADO)                          -->
        <!-- ============================================================== -->
        <l-control position="topright">
          <div v-if="showDetailsPanel && currentRoutePoint" class="route-details-panel">
            <div class="route-details-header">
              <div><i class="fas fa-info-circle"></i> {{ KT('attribute.details') || 'Detalhes do Ponto' }}</div>
              <div class="route-details-close" @click="showDetailsPanel = false"><i class="fas fa-times"></i></div>
            </div>
            <div class="route-details-content">
              <div v-if="currentRoutePoint">
                <!-- Status Icons Row -->
                <div class="status-icons-row">
                  <!-- Ignição -->
                  <div class="status-icon-item"
                    :class="{ 'active': currentRoutePoint.attributes?.ignition === true, 'inactive': currentRoutePoint.attributes?.ignition === false }"
                    :title="KT('device.ignition') + ': ' + (currentRoutePoint.attributes?.ignition ? 'Ligado' : 'Desligado')">
                    <i class="fas fa-key"></i>
                  </div>
                  <!-- Bloqueio -->
                  <div class="status-icon-item"
                    :class="{ 'danger': currentRoutePoint.attributes?.blocked === true, 'active': currentRoutePoint.attributes?.blocked === false }"
                    :title="currentRoutePoint.attributes?.blocked ? KT('device.blocked') : KT('device.unblocked')">
                    <i :class="currentRoutePoint.attributes?.blocked ? 'fas fa-lock' : 'fas fa-lock-open'"></i>
                  </div>
                  <!-- Movimento -->
                  <div class="status-icon-item"
                    :class="{ 'active': currentRoutePoint.speed > 0, 'warning': currentRoutePoint.speed === 0 }"
                    :title="currentRoutePoint.speed > 0 ? 'Em movimento' : 'Parado'">
                    <i :class="currentRoutePoint.speed > 0 ? 'fas fa-car' : 'fas fa-parking'"></i>
                  </div>
                  <!-- Bateria Veículo -->
                  <div class="status-icon-item" v-if="currentRoutePoint.attributes?.power"
                    :class="{ 'active': currentRoutePoint.attributes?.power > 12, 'warning': currentRoutePoint.attributes?.power <= 12 && currentRoutePoint.attributes?.power > 10, 'danger': currentRoutePoint.attributes?.power <= 10 }"
                    :title="'Bateria: ' + (currentRoutePoint.attributes?.power || 0).toFixed(1) + 'V'">
                    <i class="fas fa-car-battery"></i>
                  </div>
                  <!-- Sinal -->
                  <div class="status-icon-item" v-if="currentRoutePoint.attributes?.rssi"
                    :class="getSignalClass(currentRoutePoint.attributes?.rssi)"
                    :title="'Sinal: ' + (currentRoutePoint.attributes?.rssi || 0) + 'dBm'">
                    <i class="fas fa-signal"></i>
                  </div>
                  <!-- Satélites -->
                  <div class="status-icon-item"
                    :class="{ 'active': (currentRoutePoint.attributes?.sat || currentRoutePoint.attributes?.satellites || 0) >= 4 }"
                    :title="'Satélites: ' + (currentRoutePoint.attributes?.sat || currentRoutePoint.attributes?.satellites || 0)">
                    <i class="fas fa-satellite"></i>
                  </div>
                </div>

                <!-- Informações Principais -->
                <div class="detail-info-grid">
                  <!-- Velocidade -->
                  <div class="detail-info-item">
                    <div class="detail-icon"><i class="fas fa-tachometer-alt"></i></div>
                    <div class="detail-text">
                      <span class="detail-value-main">{{ Math.round((currentRoutePoint.speed || 0) * 1.852) }}
                        km/h</span>
                    </div>
                  </div>
                  <!-- Direção -->
                  <div class="detail-info-item">
                    <div class="detail-icon"><i class="fas fa-compass"></i></div>
                    <div class="detail-text">
                      <span class="detail-value-main">{{ getCardinalDirection(currentRoutePoint.course) }} ({{
                        currentRoutePoint.course || 0 }}°)</span>
                    </div>
                  </div>
                  <!-- Data/Hora -->
                  <div class="detail-info-item">
                    <div class="detail-icon"><i class="fas fa-clock"></i></div>
                    <div class="detail-text">
                      <span class="detail-value-main">{{ formatDateTime(currentRoutePoint.deviceTime) }}</span>
                    </div>
                  </div>
                  <!-- Bateria -->
                  <div class="detail-info-item" v-if="currentRoutePoint.attributes?.power">
                    <div class="detail-icon"><i class="fas fa-car-battery"></i></div>
                    <div class="detail-text">
                      <span class="detail-value-main">{{ (currentRoutePoint.attributes?.power || 0).toFixed(1)
                        }}V</span>
                    </div>
                  </div>
                </div>

                <!-- Endereço -->
                <div class="detail-address" v-if="currentRoutePoint.address">
                  <div class="detail-icon"><i class="fas fa-map-marker-alt"></i></div>
                  <div class="detail-address-text">{{ currentRoutePoint.address }}</div>
                </div>

                <!-- Coordenadas -->
                <div class="detail-coords">
                  <span class="coords-text">{{ currentRoutePoint.latitude?.toFixed(6) }}, {{
                    currentRoutePoint.longitude?.toFixed(6) }}</span>
                </div>

                <!-- Botões de Ação -->
                <div class="detail-actions">
                  <button class="detail-action-btn" @click="copyLocation(currentRoutePoint)"
                    :title="'Copiar coordenadas'">
                    <i class="fas fa-copy"></i>
                  </button>
                  <button class="detail-action-btn" @click="openInMaps(currentRoutePoint)"
                    :title="'Abrir no Google Maps'">
                    <i class="fas fa-external-link-alt"></i>
                  </button>
                  <button class="detail-action-btn" @click="openStreetView(currentRoutePoint)" :title="'Street View'">
                    <i class="fas fa-street-view"></i>
                  </button>
                </div>
              </div>
              <div v-else class="route-no-point">
                {{ KT('route.noPointSelected') || 'Nenhum ponto selecionado' }}
              </div>
            </div>
          </div>
        </l-control>

        <!-- ============================================================== -->
        <!-- PAINEL COMPACTO DE ROTA - Mini HUD durante playback            -->
        <!-- ============================================================== -->
        <l-control position="bottomleft" v-if="store.state.devices.showRoutes && currentRoutePoint">
          <div class="route-mini-hud">
            <!-- Linha 1: Ícones de Status Compactos -->
            <div class="mini-hud-status-row">
              <!-- Ignição -->
              <div class="mini-status-icon"
                :class="{ 'active': currentRoutePoint.attributes?.ignition === true, 'inactive': currentRoutePoint.attributes?.ignition === false }"
                :title="(KT('device.ignition') || 'Ignição') + ': ' + (currentRoutePoint.attributes?.ignition ? 'Ligado' : 'Desligado')">
                <i class="fas fa-key"></i>
              </div>
              <!-- Bloqueio -->
              <div class="mini-status-icon"
                :class="{ 'danger': currentRoutePoint.attributes?.blocked === true, 'active': currentRoutePoint.attributes?.blocked === false }"
                :title="currentRoutePoint.attributes?.blocked ? (KT('device.blocked') || 'Bloqueado') : (KT('device.unblocked') || 'Desbloqueado')">
                <i :class="currentRoutePoint.attributes?.blocked ? 'fas fa-lock' : 'fas fa-lock-open'"></i>
              </div>
              <!-- Movimento -->
              <div class="mini-status-icon"
                :class="{ 'active': currentRoutePoint.speed > 0, 'warning': currentRoutePoint.speed === 0 }"
                :title="currentRoutePoint.speed > 0 ? (KT('device.moving') || 'Em movimento') : (KT('device.stopped') || 'Parado')">
                <i :class="currentRoutePoint.speed > 0 ? 'fas fa-car' : 'fas fa-parking'"></i>
              </div>
              <!-- Bateria Veículo -->
              <div class="mini-status-icon" v-if="currentRoutePoint.attributes?.power"
                :class="{ 'active': currentRoutePoint.attributes?.power > 12, 'warning': currentRoutePoint.attributes?.power <= 12 && currentRoutePoint.attributes?.power > 10, 'danger': currentRoutePoint.attributes?.power <= 10 }"
                :title="(KT('device.battery') || 'Bateria') + ': ' + (currentRoutePoint.attributes?.power || 0).toFixed(1) + 'V'">
                <i class="fas fa-car-battery"></i>
              </div>
              <!-- Sinal -->
              <div class="mini-status-icon" v-if="currentRoutePoint.attributes?.rssi"
                :class="getSignalClass(currentRoutePoint.attributes?.rssi)"
                :title="(KT('device.signal') || 'Sinal') + ': ' + (currentRoutePoint.attributes?.rssi || 0) + 'dBm'">
                <i class="fas fa-signal"></i>
              </div>
            </div>

            <!-- Linha 2: Info Principal (velocidade, direção, hora, endereço) -->
            <div class="mini-hud-info-row">
              <span class="mini-info-item">
                <i class="fas fa-tachometer-alt"></i>
                {{ Math.round((currentRoutePoint.speed || 0) * 1.852) }} km/h
              </span>
              <span class="mini-info-item">
                <i class="fas fa-compass"></i>
                {{ getCardinalDirection(currentRoutePoint.course) }}
              </span>
              <span class="mini-info-item">
                <i class="fas fa-clock"></i>
                {{ formatDateTime(currentRoutePoint.deviceTime) }}
              </span>
            </div>

            <!-- Linha 2.5: Endereço -->
            <div class="mini-hud-address" v-if="currentRoutePoint.address">
              <i class="fas fa-map-marker-alt"></i>
              <span>{{ currentRoutePoint.address }}</span>
            </div>

            <!-- Linha 3: Botões de Ação -->
            <div class="mini-hud-actions">
              <button class="mini-action-btn" @click="showRouteDetails()"
                :title="KT('attribute.details') || 'Detalhes'">
                <i class="fas fa-info-circle"></i>
              </button>
              <button class="mini-action-btn" @click="copyLocation(currentRoutePoint)"
                :title="KT('map.copyCoords') || 'Copiar coordenadas'">
                <i class="fas fa-copy"></i>
              </button>
              <button class="mini-action-btn" @click="openInMaps(currentRoutePoint)"
                :title="KT('map.openMaps') || 'Abrir no Google Maps'">
                <i class="fas fa-external-link-alt"></i>
              </button>
            </div>
          </div>
        </l-control>

        <!-- ============================================================== -->
        <!-- CONTROLES DE ZOOM (canto inferior esquerdo)                    -->
        <!-- ============================================================== -->
        <l-control position="bottomleft">
          <div class="leaflet-control-zoom leaflet-bar leaflet-control">
            <a class="leaflet-control-zoom-in" href="#" title="Zoom in" role="button" @click.prevent="zoomIn">+</a>
            <a class="leaflet-control-zoom-out" href="#" title="Zoom out" role="button" @click.prevent="zoomOut">−</a>
          </div>
        </l-control>

        <!-- ============================================================== -->
        <!-- CAMADAS DO MAPA                                                -->
        <!-- ============================================================== -->
        <l-tile-layer v-for="(m, mk) in availableMaps" :key="'tsmap' + mk" :name="m.name" layer-type="base"
          :visible="m.id === selectedMap" :subdomains="m.subdomains" :url="m.url"></l-tile-layer>

        <!-- Camada de Geocercas -->
        <l-layer-group layer-type="overlay" name="Geocercas">
          <template v-if="showGeofences && !store.getters['geofences/isEditing']">
            <kore-fence v-for="(f) in store.getters['geofences/fenceList']" :key="f.id" :geofence="f">
            </kore-fence>
          </template>
          <template v-if="!store.getters['geofences/isEditing']">
            <kore-fence v-for="(f) in store.getters['geofences/anchorList']" :key="f.id"
              :color="MAP_CONSTANTS.ANCHOR_COLOR" :geofence="f">
            </kore-fence>
          </template>
          <template v-if="store.getters['geofences/isEditing']">
            <l-polyline :key="'polyline-' + store.getters['geofences/getLatLngs'].length + '-line'"
              v-if="store.state.geofences.mapPointEditingType === 'LINESTRING' && store.state.geofences.mapPointEditingParams.length > 0"
              :lat-lngs="store.getters['geofences/getLatLngs']" :color="MAP_CONSTANTS.GEOFENCE_EDIT_COLOR">
            </l-polyline>

            <l-polygon :key="'polygon-' + store.getters['geofences/getLatLngs'].length" :no-clip="true"
              v-else-if="store.state.geofences.mapPointEditingType === 'POLYGON' && store.state.geofences.mapPointEditingParams.length > 0"
              :lat-lngs="store.getters['geofences/getLatLngs']" :fill-opacity="MAP_CONSTANTS.FILL_OPACITY" :fill="true"
              :fill-color="MAP_CONSTANTS.GEOFENCE_EDIT_COLOR" :color="MAP_CONSTANTS.GEOFENCE_EDIT_COLOR">
            </l-polygon>

            <l-circle :key="'circle-' + store.state.geofences.mapPointEditingParams.join('-')"
              v-else-if="store.state.geofences.mapPointEditingType === 'CIRCLE' && store.state.geofences.mapPointEditingParams.length === 3"
              :lat-lng="[store.state.geofences.mapPointEditingParams[0], store.state.geofences.mapPointEditingParams[1]]"
              :radius="parseFloat(store.state.geofences.mapPointEditingParams[2])" :fill="true"
              :fill-opacity="MAP_CONSTANTS.FILL_OPACITY" :fill-color="MAP_CONSTANTS.GEOFENCE_EDIT_COLOR"
              :color="MAP_CONSTANTS.GEOFENCE_EDIT_COLOR">
            </l-circle>
          </template>

          <!-- Círculo de precisão GPS -->
          <template v-if="dPosition && store.getters['mapPref']('precision')">
            <l-circle :interactive="false" :lat-lng="[dPosition.latitude, dPosition.longitude]"
              :radius="parseFloat(dPosition.accuracy || 20)" :fill="true"
              :fill-opacity="MAP_CONSTANTS.GPS_PRECISION_OPACITY" :fill-color="MAP_CONSTANTS.GPS_PRECISION_COLOR"
              :color="MAP_CONSTANTS.GPS_PRECISION_COLOR">
            </l-circle>
          </template>
        </l-layer-group>

        <!-- Camada de Veículos -->
        <l-layer-group layer-type="overlay" name="Carros" ref="carLayer" :attribution="'Carros'">
          <l-polyline v-if="store.state.devices.trail !== false" :lat-lngs="store.getters['devices/getTrails']"
            :color="MAP_CONSTANTS.ROUTE_COLOR">
          </l-polyline>
          <kore-canva-marker :map="map" :zoom="zoom" @click="markerClick" @mouseover="markerOver" @mouseout="markerOut"
            @contextmenu="markerContext">
          </kore-canva-marker>
        </l-layer-group>

        <!-- Camada de Rotas -->
        <l-layer-group v-if="routePoints.length > 0 && store.state.devices.showRoutes" layer-type="overlay" name="Rota"
          :attribution="'Rota'">
          <l-polyline v-if="showRoutePoints" :lat-lngs="cptPoints" :color="MAP_CONSTANTS.ROUTE_COLOR"></l-polyline>

          <kore-canva-point v-if="showRouteMarkers" :points="routePoints"
            @click="openMarkInfo($event)"></kore-canva-point>

          <template v-if="showRoutePoints">
            <template v-for="(p, k) in routePoints" :key="'mkrs-'+k">
              <kore-marker v-if="k === 0 || k === routePoints.length - 1"
                :name="(k === 0) ? 'start' : (k === routePoints.length - 1) ? 'end' : 'point'" :position="p"
                :type="(k === 0) ? 'start' : (k === routePoints.length - 1) ? 'end' : 'point'" @click="openMarkInfo($event)">
              </kore-marker>
            </template>
          </template>
        </l-layer-group>

      </LMap>

      <!-- ============================================================== -->
      <!-- COMPONENTES EXTERNOS DO MAPA                                   -->
      <!-- ============================================================== -->

      <!-- Street View -->
      <street-view-dark v-if="store.state.devices?.streetview" />

      <!-- Command Modal -->
      <CommandModalDark ref="commandModalRef" v-model="commandModalOpen" :device="selectedDevice" />

      <!-- Slider Confirm Modal (para comandos críticos como bloquear/desbloquear) -->
      <SliderConfirmModal v-model="showSliderConfirm" :title="sliderConfirmData.title"
        :device-name="sliderConfirmData.deviceName" :message="sliderConfirmData.message"
        :warning-text="sliderConfirmData.warningText" :slider-text="sliderConfirmData.sliderText"
        :action-type="sliderConfirmData.actionType" :confirm-callback="sliderConfirmData.callback"
        @confirm="onSliderConfirmed" @cancel="onSliderCancelled" />

      <!-- Painel Flutuante do Motorista (durante follow) -->
      <div v-if="showFloatingPanel && floatingPanelDevice" class="floating-follow-panel">
        <div class="panel-header">
          <h4>{{ floatingPanelDevice.name }}</h4>
          <button @click="showFloatingPanel = false" class="close-panel-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="panel-content">
          <!-- Seção do Motorista -->
          <div class="driver-section-enhanced">
            <div class="driver-card-header">
              <i class="fas fa-user-tie"></i>
              <span class="section-title">Motorista Atual</span>
            </div>

            <div class="driver-card-content">
              <div class="driver-photo-enhanced">
                <img :src="getDriverPhotoUrl(floatingPanelDevice)" :alt="getDriverName(floatingPanelDevice)"
                  @error="$event.target.src = '/tarkan/assets/images/drivers/default.png'" class="driver-avatar" />
                <div class="photo-overlay" v-if="isDriverCNHExpired(floatingPanelDevice)">
                  <i class="fas fa-exclamation-triangle"></i>
                </div>
              </div>

              <div class="driver-details">
                <div class="driver-main-info">
                  <div class="driver-name-enhanced">
                    <strong>{{ getDriverName(floatingPanelDevice) || 'Motorista não identificado' }}</strong>
                  </div>
                </div>

                <div class="driver-credentials"
                  v-if="getDriverCNH(floatingPanelDevice) || getDriverCPF(floatingPanelDevice)">
                  <div class="credential-item" v-if="getDriverCNH(floatingPanelDevice)">
                    <i class="fas fa-id-card"></i>
                    <span class="label">CNH:</span>
                    <span class="value">{{ getDriverCNH(floatingPanelDevice) }}</span>
                  </div>
                  <div class="credential-item" v-if="getDriverCPF(floatingPanelDevice)">
                    <i class="fas fa-user"></i>
                    <span class="label">CPF:</span>
                    <span class="value">{{ formatCPF(getDriverCPF(floatingPanelDevice)) }}</span>
                  </div>
                </div>

                <div class="driver-expiry-section" v-if="getDriverCNHExpiry(floatingPanelDevice)">
                  <div class="expiry-item"
                    :class="{ expired: isDriverCNHExpired(floatingPanelDevice), expiring: isDriverCNHExpiring(floatingPanelDevice) }">
                    <i class="fas fa-calendar-alt"></i>
                    <span class="label">Validade CNH:</span>
                    <span class="expiry-date">{{ new
                      Date(getDriverCNHExpiry(floatingPanelDevice)).toLocaleDateString('pt-BR')
                      }}</span>
                    <span class="expiry-warning" v-if="isDriverCNHExpired(floatingPanelDevice)">
                      <i class="fas fa-exclamation-triangle"></i> VENCIDA
                    </span>
                    <span class="expiry-warning warning" v-else-if="isDriverCNHExpiring(floatingPanelDevice)">
                      <i class="fas fa-clock"></i> VENCENDO
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Foto do Veículo -->
          <div class="vehicle-image-section">
            <div class="vehicle-photo-large">
              <img :src="getDeviceImageUrl(floatingPanelDevice)" :alt="floatingPanelDevice.name"
                @error="$event.target.src = '/tarkan/assets/images/categories/default.png'" />
            </div>
          </div>

          <!-- Informações do Veículo -->
          <div class="vehicle-section">
            <div class="vehicle-info">
              <div class="info-row">
                <i class="fas fa-car"></i>
                <span class="value">{{ floatingPanelDevice.name }}</span>
              </div>
              <div class="info-row" v-if="getVehiclePlate(floatingPanelDevice)">
                <i class="fas fa-rectangle-ad"></i>
                <span class="value">{{ getVehiclePlate(floatingPanelDevice) }}</span>
              </div>
              <div class="info-row">
                <i class="fas fa-signal"></i>
                <span class="value status-badge" :class="getStatusClass(floatingPanelDevice)">
                  {{ getStatusText(floatingPanelDevice) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Botões de Ação -->
          <div class="panel-actions">
            <el-button size="small" type="primary" @click="openCommandModal(floatingPanelDevice)">
              <i class="fas fa-terminal"></i> Comando
            </el-button>
            <el-button size="small" type="info" @click="viewDriverDetails(floatingPanelDevice)"
              v-if="getDriverId(floatingPanelDevice)">
              <i class="fas fa-user"></i> Motorista
            </el-button>
            <el-button size="small" type="success" @click="openStreetView(floatingPanelDevice)"
              v-if="store.state.server.serverInfo?.attributes?.google_api">
              <i class="fas fa-street-view"></i> Street View
            </el-button>
          </div>
        </div>
      </div>

    </div>
  </div>
  </div>
</template>

<script setup>
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/switch/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/tab-pane/style/css'
import 'element-plus/es/components/tabs/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/radio/style/css'
import 'element-plus/es/components/dropdown/style/css'
import 'element-plus/es/components/dropdown-item/style/css'
import 'element-plus/es/components/dropdown-menu/style/css'

import { ElMessage, ElMessageBox, ElTooltip, ElRadio, ElDropdown, ElDropdownMenu, ElDropdownItem, ElNotification, ElSwitch, ElButton, ElInput } from "element-plus";

import { LMap, LTileLayer, LControl, LLayerGroup, LPolyline, LCircle, LPolygon } from "@vue-leaflet/vue-leaflet";
import ResizeObserver from 'resize-observer-polyfill';
import KoreMarker from "./kore-marker";
import KoreFence from "./kore-fence";
import KoreCanvaMarker from "../test/CanvaMarker";
import KoreCanvaPoint from "../test/CanvaPoints"
import { computed, watch, ref, onMounted, onUnmounted, inject, getCurrentInstance } from "vue";  // Adicionado onUnmounted
import { useStore } from 'vuex';
import router from "../../routes";
import KT from "../func/kt";
import actAnchor from "../func/actAnchor";
import L from 'leaflet';
import 'leaflet.heat';
// import axios from 'axios';

// Plugin de busca no mapa
import 'leaflet-search/dist/leaflet-search.min.css';
import 'leaflet-search';

// Componentes novos do projeto Dark
import StreetViewDark from "./street-view-dark.vue";
import CommandModalDark from "./CommandModalDark.vue";
import SliderConfirmModal from "./SliderConfirmModal.vue";

// ============================================================================
// CONSTANTES DO MAPA
// Centraliza valores mágicos para fácil manutenção e consistência
// ============================================================================
const MAP_CONSTANTS = {
  // Zoom
  DEFAULT_ZOOM: 3,
  MIN_ZOOM: 4,
  MAX_ZOOM: 19,
  FLY_TO_ZOOM: 16,

  // Centro padrão (Brasil - RS)
  DEFAULT_CENTER: [-29.942484, -50.990526],

  // Animações
  FLY_DURATION: 1.5, // segundos
  FLY_DELAY: 100, // ms
  FIT_BOUNDS_DELAY: 300, // ms

  // Cores
  ROUTE_COLOR: '#05a7e3',
  GEOFENCE_EDIT_COLOR: '#05a7e3',
  ANCHOR_COLOR: '#ff0000',
  GPS_PRECISION_COLOR: '#e3c505',

  // Opacidades
  FILL_OPACITY: 0.15,
  GPS_PRECISION_OPACITY: 0.05,
};

const store = useStore();
const app = getCurrentInstance().appContext.app;

// PATCH: Computed para filtrar dispositivos baseado no filtro do store
const deviceFilterId = computed(() => {
  return store.state.devices?.deviceFilter || store.state.devices?.filterDeviceId || 0;
});

const visibleDevices = computed(() => {
  const deviceList = store.state.devices?.deviceList || store.state.devices?.list || [];
  const list = Array.isArray(deviceList) ? deviceList : Object.values(deviceList || {});
  const filterId = Number(deviceFilterId.value || 0);

  if (!filterId) return list;
  return list.filter(d => Number(d?.id) === filterId);
});

// ULTRA ENTERPRISE 1: Detecção de conta corporativa (500+ veículos)
const totalDevices = computed(() => visibleDevices.value.length);
const isEnterprise = computed(() => totalDevices.value >= 500);

// ULTRA ENTERPRISE 1: Preferências efetivas com tuning automático
const effectivePrefs = computed(() => {
  const base = {
    clustered: store.getters['mapPref']('clustered', false),
    labels: store.getters['mapPref']('labels', true),
    compactTooltip: store.getters['mapPref']('compactTooltip', false),
  };

  // Modo enterprise: força otimizações automáticas
  if (!isEnterprise.value) return base;

  return {
    ...base,
    clustered: true,        // ✅ Cluster obrigatório
    labels: false,          // ✅ Labels OFF (economia CPU)
    compactTooltip: true,   // ✅ Tooltip compacto
  };
});

// FIX 4 ENTERPRISE: Cluster inteligente - usa effectivePrefs ao invés de preferencia direta
// NOTA: Comentado pois CanvaMarker agora pega clustered diretamente do store
// eslint-disable-next-line no-unused-vars
const clustered = computed(() => {
  const count = visibleDevices.value.length;
  // Auto-ativar cluster em contas grandes (300+ veículos)
  if (count > 300) return true;
  // Usar preferência efetiva (já considera enterprise)
  return effectivePrefs.value.clustered;
});

const carLayer = ref(null);
const focusLayer = ref(null);
import { useRoute } from 'vue-router';

const route = useRoute();

app.provide("focusLayer", focusLayer);

// ============================================================================
// COMPONENTES DARK MODE - Command Modal, Painel Flutuante do Motorista
// ============================================================================
const commandModalOpen = ref(false);
const selectedDevice = ref(null);
const commandModalRef = ref(null);

// Slider Confirm Modal (para comandos críticos)
const showSliderConfirm = ref(false);
const sliderConfirmData = ref({
  title: '',
  deviceName: '',
  message: '',
  warningText: '',
  sliderText: 'Deslize para confirmar',
  actionType: 'warning',
  callback: null
});

// Funções do Slider Confirm Modal
const openSliderConfirm = (options) => {
  sliderConfirmData.value = {
    title: options.title || 'Confirmar Ação',
    deviceName: options.deviceName || '',
    message: options.message || 'Deseja confirmar esta ação?',
    warningText: options.warningText || '',
    sliderText: options.sliderText || 'Deslize para confirmar',
    actionType: options.actionType || 'warning',
    callback: options.callback || null
  };
  showSliderConfirm.value = true;
};

const onSliderConfirmed = () => {
  console.log('Slider confirmed');
  showSliderConfirm.value = false;
};

const onSliderCancelled = () => {
  console.log('Slider cancelled');
  showSliderConfirm.value = false;
};

// Ver detalhes do motorista
const viewDriverDetails = (device) => {
  const driverId = getDriverId(device);
  if (driverId) {
    // Abrir modal de edição do motorista
    router.push(`/drivers?edit=${driverId}`);
  } else {
    ElMessage.info('Nenhum motorista vinculado a este veículo');
  }
};

// Abrir Street View para o dispositivo
const openStreetView = (device) => {
  if (device) {
    // Se for um ponto de rota (tem latitude/longitude direto)
    if (device.latitude && device.longitude) {
      // Abrir Street View do Google diretamente
      const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${device.latitude},${device.longitude}`;
      window.open(url, '_blank');
    } else if (device.id) {
      // Se for um dispositivo com ID
      store.commit('devices/SET_STREETVIEW', device.id);
    }
  }
};// Expor função para outros componentes usarem
window.$openSliderConfirm = openSliderConfirm;

// Painel flutuante do motorista (durante follow)
const showFloatingPanel = ref(false);
const floatingPanelDevice = ref(null);

// Cache de URLs de imagens
const imageUrlCache = ref(new Map());

// Abrir command modal
const openCommandModal = (device) => {
  selectedDevice.value = device;
  commandModalOpen.value = true;
};

// Funções do painel flutuante do motorista
const getDriverName = (device) => {
  if (!device) return 'Sem motorista';
  const position = store.getters["devices/getPosition"](device.id);
  const driverUniqueId = position?.attributes?.driverUniqueId || device.attributes?.driverUniqueId;
  if (driverUniqueId) {
    const driver = store.getters['drivers/getDriverByUniqueId']?.(driverUniqueId);
    if (driver) return driver.name || driver.uniqueId;
    return driverUniqueId;
  }
  return 'Sem motorista';
};

const getDriverId = (device) => {
  if (!device) return null;
  const position = store.getters["devices/getPosition"](device.id);
  const driverUniqueId = position?.attributes?.driverUniqueId || device.attributes?.driverUniqueId;
  if (driverUniqueId) {
    const driver = store.getters['drivers/getDriverByUniqueId']?.(driverUniqueId);
    return driver?.id || null;
  }
  return null;
};

const getDriverPhotoUrl = (device) => {
  if (!device) return '/tarkan/assets/images/drivers/default.png';
  const cacheKey = `driver_${device.id}`;
  if (imageUrlCache.value.has(cacheKey)) {
    return imageUrlCache.value.get(cacheKey);
  }
  const position = store.getters["devices/getPosition"](device.id);
  const driverUniqueId = position?.attributes?.driverUniqueId || device.attributes?.driverUniqueId;
  if (driverUniqueId) {
    const driver = store.getters['drivers/getDriverByUniqueId']?.(driverUniqueId);
    if (driver?.attributes?.photo) {
      const url = driver.attributes.photo;
      imageUrlCache.value.set(cacheKey, url);
      return url;
    }
  }
  return '/tarkan/assets/images/drivers/default.png';
};

const getDriverCNH = (device) => {
  if (!device) return null;
  const position = store.getters["devices/getPosition"](device.id);
  const driverUniqueId = position?.attributes?.driverUniqueId || device.attributes?.driverUniqueId;
  if (driverUniqueId) {
    const driver = store.getters['drivers/getDriverByUniqueId']?.(driverUniqueId);
    return driver?.attributes?.cnh || null;
  }
  return null;
};

const getDriverCPF = (device) => {
  if (!device) return null;
  const position = store.getters["devices/getPosition"](device.id);
  const driverUniqueId = position?.attributes?.driverUniqueId || device.attributes?.driverUniqueId;
  if (driverUniqueId) {
    const driver = store.getters['drivers/getDriverByUniqueId']?.(driverUniqueId);
    return driver?.attributes?.cpf || null;
  }
  return null;
};

const getDriverCNHExpiry = (device) => {
  if (!device) return null;
  const position = store.getters["devices/getPosition"](device.id);
  const driverUniqueId = position?.attributes?.driverUniqueId || device.attributes?.driverUniqueId;
  if (driverUniqueId) {
    const driver = store.getters['drivers/getDriverByUniqueId']?.(driverUniqueId);
    return driver?.attributes?.cnhExpiry || driver?.attributes?.cnh_expiry || null;
  }
  return null;
};

const isDriverCNHExpired = (device) => {
  const expiry = getDriverCNHExpiry(device);
  if (!expiry) return false;
  return new Date(expiry) < new Date();
};

const isDriverCNHExpiring = (device) => {
  const expiry = getDriverCNHExpiry(device);
  if (!expiry) return false;
  const expiryDate = new Date(expiry);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return expiryDate > new Date() && expiryDate < thirtyDaysFromNow;
};

const formatCPF = (cpf) => {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
};

const getDeviceImageUrl = (device) => {
  if (!device) return '/tarkan/assets/images/categories/default.png';
  const cacheKey = `device_${device.id}`;
  if (imageUrlCache.value.has(cacheKey)) {
    return imageUrlCache.value.get(cacheKey);
  }
  if (device.attributes?.image) {
    const url = device.attributes.image;
    imageUrlCache.value.set(cacheKey, url);
    return url;
  }
  const category = device.category || 'default';
  return `/tarkan/assets/images/categories/${category}.png`;
};

const getVehiclePlate = (device) => {
  if (!device) return null;
  return device.attributes?.placa || device.attributes?.plate || null;
};

const getStatusText = (device) => {
  if (!device) return 'Desconhecido';
  const position = store.getters["devices/getPosition"](device.id);
  if (position) {
    if (position.speed > 6) return 'Em movimento';
    if (device.status === 'online') return 'Estacionado';
  }
  return device.status === 'online' ? 'Online' : device.status === 'offline' ? 'Desconectado' : 'Desconhecido';
};

const getStatusClass = (device) => {
  if (!device) return 'status-unknown';
  const position = store.getters["devices/getPosition"](device.id);
  if (position && position.speed > 6) return 'status-moving';
  if (device.status === 'online') return 'status-online';
  if (device.status === 'offline') return 'status-offline';
  return 'status-unknown';
};

// ============================================================================
// TODO (FASE 4): Implementar busca de endereço no mapa
// Referência: kore-map-dark.vue usa leaflet-search para isso
// ============================================================================

const openMarkInfo = (e) => {
  console.log('openMarkInfo', e);
}

// ============================================================================
// GUARD RAIL: Watcher unificado de preferências de label
// ATENÇÃO: Este watcher atualiza TODOS os marcadores quando qualquer pref muda.
// Se houver problemas de performance com muitos dispositivos, considerar:
// 1. Throttle de 100ms
// 2. Atualização incremental apenas dos marcadores visíveis
// ============================================================================
const mapLabelPrefs = computed(() => ({
  name: store.getters['mapPref']('name'),
  plate: store.getters['mapPref']('plate'),
  status: store.getters['mapPref']('status')
}));

// FIX 1 ENTERPRISE: Throttle helper inline (evita dependência lodash)
const throttle = (fn, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

// FIX 1 ENTERPRISE: Atualizar apenas labels visíveis (economia massiva em 1000+ veículos)
const updateVisibleLabels = throttle((prefs) => {
  const bounds = map.value?.leafletObject?.getBounds();
  if (!bounds || !carLayer.value?.leafletObject) return;

  carLayer.value.leafletObject.eachLayer((layer) => {
    // Só atualiza markers dentro do viewport
    if (layer.getLatLng && bounds.contains(layer.getLatLng())) {
      layer.setLabel(prefs);
    }
  });
}, 150);

watch(mapLabelPrefs, (newPrefs) => {
  updateVisibleLabels(newPrefs);
}, { deep: true })

watch(() => store.state.devices.toggleCalor, (newVal) => {
  showMapadeCalor.value = newVal;
  if (newVal) {
    showCalorLayer();
  } else {
    hideCalorLayer();
  }
});

watch(() => store.state.devices.togglePontos, (newVal) => {
  showPontos.value = newVal;
  if (newVal) {
    showPontosLayer();
  } else {
    hidePontosLayer();
  }
});


watch(() => store.state.devices.togglePontosCorrelacao, (newVal) => {
  showPontosCorrelacao.value = newVal;
  if (newVal) {
    showPontosCorrelacaoLayer();
  } else {
    hidePontosCorrelacaoLayer();
  }
});


watch(() => store.state.devices.showCalorCorrelacao, (newVal) => {
  showMapadeCalorCorrelacao.value = newVal;
  if (newVal) {
    showMapadeCalorCorrelacaoLayer();
  } else {
    hideCalorCorrelacaoLayer();
  }
});

// ============================================================================
// GUARD RAIL: Event listeners de teclado para Ctrl+Click
// IMPORTANTE: Funções nomeadas declaradas aqui, mas registradas apenas no onMounted
// ============================================================================
const handleKeyDown = (e) => {
  if (e.code === 'ControlLeft') {
    if (carLayer.value?.leafletObject?.eachLayer) {
      carLayer.value.leafletObject.eachLayer((layer) => {
        layer?.setPressed?.(true);
      });
    }
  }
};

const handleKeyUp = (e) => {
  if (e.code === 'ControlLeft') {
    if (carLayer.value?.leafletObject?.eachLayer) {
      carLayer.value.leafletObject.eachLayer((layer) => {
        layer?.setPressed?.(false);
      });
    }
  }
};

const closeRoutes = () => {
  store.commit("devices/setRoute", false);
  updateRoute([]);
  if (route.query.deviceId) {
    window.location = route.path;
  } else {
    // FIX 3 ENTERPRISE: Reset inteligente sem perder estado da aplicação
    softResetMap();
  }
}

// FIX 3 ENTERPRISE: Reset inteligente do mapa (substitui reload)
const softResetMap = () => {
  // Limpar dados de rota
  store.commit("devices/clearRoute");
  routePoints.value = [];
  showRoutePoints.value = false;
  
  // Limpar layers do mapa
  if (carLayer.value?.leafletObject) {
    carLayer.value.leafletObject.clearLayers();
  }
  
  // Forçar recalcular tamanho
  if (map.value?.leafletObject) {
    map.value.leafletObject.invalidateSize();
  }
  
  // Reconstruir markers (se store tem ação)
  if (store.dispatch) {
    store.dispatch('devices/rebuildMarkers').catch(() => {
      // Fallback: forçar re-render via mutation
      store.commit('devices/triggerUpdate');
    });
  }
};

// Removido - era usado apenas para exibir o círculo de precisão GPS
// const dPosition = computed(()=>{
// if(route.params.deviceId) {
//   return store.getters['devices/getPosition'](parseInt(route.params.deviceId));
// }else{
//   return false;
// }
// })



const zoom = ref(10);
const map = ref(null);

const mapContainer = ref(null);

// ULTRA ENTERPRISE 2: Lazy Load de markers por bounds
const mapBoundsReady = ref(false);
const mapBounds = ref(null);

// Throttle para updateBounds (evita recalcular a cada pixel)
const updateMapBounds = throttle(() => {
  const m = map.value?.leafletObject;
  if (!m) return;
  // 20% de buffer para não piscar ao arrastar
  mapBounds.value = m.getBounds().pad(0.20);
  mapBoundsReady.value = true;
}, 120);

// ULTRA ENTERPRISE 2: Devices filtrados por bounds (lazy load)
// NOTA: Comentado pois CanvaMarker agora pega devices diretamente do store
// eslint-disable-next-line no-unused-vars
// const lazyVisibleDevices = computed(() => {
//   // Fallback: se < 300 devices OU bounds não pronto, renderiza todos
//   if (totalDevices.value < 300 || !mapBoundsReady.value || !mapBounds.value) {
//     return visibleDevices.value;
//   }
//
//   // Lazy load: só devices dentro do bounds
//   return visibleDevices.value.filter(d => {
//     if (!d?.latitude || !d?.longitude) return false;
//     return mapBounds.value.contains([d.latitude, d.longitude]);
//   });
// });

const routePoints = ref([]);

// ULTRA ENTERPRISE 3: Simplify algorithm inline (Douglas-Peucker)
// Evita dependência externa, leve e eficiente
const simplifyRoute = (points, tolerance) => {
  if (points.length <= 2) return points;

  const getSqSegDist = (p, p1, p2) => {
    let x = p1.longitude;
    let y = p1.latitude;
    let dx = p2.longitude - x;
    let dy = p2.latitude - y;

    if (dx !== 0 || dy !== 0) {
      const t = ((p.longitude - x) * dx + (p.latitude - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = p2.longitude;
        y = p2.latitude;
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }

    dx = p.longitude - x;
    dy = p.latitude - y;
    return dx * dx + dy * dy;
  };

  const simplifyDouglasPeucker = (points, sqTolerance) => {
    const len = points.length;
    const markers = new Uint8Array(len);
    let first = 0;
    let last = len - 1;
    const stack = [];
    const newPoints = [];

    markers[first] = markers[last] = 1;

    while (last) {
      let maxSqDist = 0;
      let index = 0;

      for (let i = first + 1; i < last; i++) {
        const sqDist = getSqSegDist(points[i], points[first], points[last]);
        if (sqDist > maxSqDist) {
          index = i;
          maxSqDist = sqDist;
        }
      }

      if (maxSqDist > sqTolerance) {
        markers[index] = 1;
        stack.push(first, index, index, last);
      }

      last = stack.pop();
      first = stack.pop();
    }

    for (let i = 0; i < len; i++) {
      if (markers[i]) newPoints.push(points[i]);
    }

    return newPoints;
  };

  return simplifyDouglasPeucker(points, tolerance * tolerance);
};

// ULTRA ENTERPRISE 3: Rota simplificada para polyline (visual)
const routeForPolyline = computed(() => {
  const pts = routePoints.value || [];
  if (pts.length <= 300) return pts; // Rotas pequenas não precisam simplificar

  // Simplificar para ~200-300 pontos visuais (tolerance ajustável)
  return simplifyRoute(pts, 0.00008);
});

const showRoutePoints = ref(true);
const showRouteMarkers = ref(false);
const showMapadeCalor = ref(false);
const showPercurso = ref(false);
const showPontos = ref(false);
const showPontosCorrelacao = ref(false);
const showMapadeCalorCorrelacao = ref(false);

// Referência para a camada de mapa de calor
const heatmapLayer = ref(null);

// ============================================================================
// PLAYBACK STATE - Controle de reprodução de rotas
// ============================================================================
const routePlayState = ref(false); // true = reproduzindo, false = pausado
const routePlayPos = ref(0); // Posição atual na timeline (pixels)
const routePlayIndex = ref(0); // Índice do ponto atual na rota
const currentRoutePoint = ref(null); // Ponto atual da rota para exibir detalhes
const playbackSpeed = ref(1); // Velocidade de reprodução (1x, 2x, 4x, 8x)
const playbackInterval = ref(null); // Intervalo de reprodução
const isDragging = ref(false); // Se está arrastando a timeline
const showDetailsPanel = ref(false); // Se mostra o painel de detalhes
const PLAYBACK_SPEEDS = [1, 2, 4, 8, 16]; // Velocidades disponíveis
const TIMELINE_WIDTH = 350; // Largura da timeline em pixels

// ============================================================================
// TOOLTIP FOLLOW STATE - Estado do tooltip ao seguir dispositivo
// ============================================================================
let tooltipUpdateInterval = null;
const tooltipManuallyHidden = ref(false); // Se o tooltip foi fechado manualmente

// Resetar estado do tooltip quando muda o dispositivo seguido
watch(() => store.state.devices.isFollowingId, (newVal) => {
  if (newVal) {
    tooltipManuallyHidden.value = false;
  }
});

// Posição do dispositivo para círculo de precisão GPS
const dPosition = computed(() => {
  if (route.params.deviceId) {
    return store.getters['devices/getPosition'](parseInt(route.params.deviceId));
  } else {
    return false;
  }
});

app.provide("showRouteMarkers", showRouteMarkers);
app.provide("showMapadeCalor", showMapadeCalor);
app.provide("showPercurso", showPercurso);
app.provide("showPontos", showPontos);
app.provide("showPontosCorrelacao", showPontosCorrelacao);

const eyeFilter = ref('');
let resizeObserver = null;
let stopFollowingWatch = null; // Handle para parar o watcher quando desmontar

// ============================================================================
// EVENT HANDLERS - Funções nomeadas para proper cleanup de event listeners
// ============================================================================

// Handler para invalidação do mapa
const handleMapInvalidate = () => {
  if (map.value?.leafletObject) {
    requestAnimationFrame(() => {
      map.value?.leafletObject?.invalidateSize()
    })
  }
}

// Handler para abrir painel flutuante (document event)
const onOpenFloatingPanel = (event) => {
  const deviceId = event?.detail?.deviceId;
  const device = store.getters["devices/getDevice"](deviceId);
  if (device) {
    floatingPanelDevice.value = device;
    showFloatingPanel.value = true;
  }
};

// Handler para eventos do Traccar (document event)
const onTraccarEvent = (event) => {
  const traccarEvent = event?.detail;
  if (traccarEvent?.type === 'commandResult' && commandModalRef.value) {
    commandModalRef.value.processDeviceEvent(traccarEvent);
  }
};

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    if (map.value?.leafletObject?.invalidateSize) {
      map.value.leafletObject.invalidateSize()
    }
  })

  if (mapContainer.value) {
    resizeObserver.observe(mapContainer.value)
  }

  window.addEventListener('map:invalidate', handleMapInvalidate)

  // ============================================================================
  // EVENT LISTENERS - Eventos do sistema (com funções nomeadas para cleanup)
  // ============================================================================

  // Listener para fechar o tooltip de follow
  document.addEventListener("hideFollowTooltip", hideTooltipManually);

  // Listener para abrir o panel flotante
  document.addEventListener("openFloatingPanel", onOpenFloatingPanel);

  // Escutar eventos de commandResult desde Traccar
  document.addEventListener("traccarEvent", onTraccarEvent);

  // Keyboard listeners para Ctrl+Click (registrados aqui, removidos no unmount)
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  // ============================================================================
  // WATCHER - Observador para mudanças no seguimento de dispositivo
  // Movido para fora do onMounted para facilitar cleanup
  // ============================================================================
  stopFollowingWatch = watch(() => store.state.devices.isFollowingId, (newValue, oldValue) => {
    try {
      if (!newValue && oldValue) {
        // Se deixou de seguir, parar o intervalo e ocultar tooltip
        if (tooltipUpdateInterval) {
          clearInterval(tooltipUpdateInterval);
          tooltipUpdateInterval = null;
          window.$hideTip();
        }
        showFloatingPanel.value = false;
      } else if (newValue && !oldValue) {
        // Se começou a seguir, criar intervalo para atualizar tooltip
        if (!tooltipUpdateInterval) {
          tooltipUpdateInterval = setInterval(updateFollowTooltip, 1000);
        }
      } else if (newValue && oldValue && newValue !== oldValue) {
        // Se mudou de dispositivo, atualizar o panel flotante
        updateFloatingPanel();
      }
    } catch (error) {
      console.error("Erro no watcher de seguimento:", error);
    }
  });
})

onUnmounted(() => {
  // Cleanup ResizeObserver
  if (mapContainer.value && resizeObserver) {
    resizeObserver.unobserve(mapContainer.value)
  }
  resizeObserver?.disconnect()
  resizeObserver = null

  // Cleanup custom event listener
  window.removeEventListener('map:invalidate', handleMapInvalidate)
  
  // ULTRA ENTERPRISE 2: Cleanup listener de bounds (lazy load)
  const m = map.value?.leafletObject;
  if (m) {
    m.off('moveend zoomend', updateMapBounds);
  }

  // Cleanup de event listeners do sistema (usando funções nomeadas)
  document.removeEventListener("hideFollowTooltip", hideTooltipManually);
  document.removeEventListener("openFloatingPanel", onOpenFloatingPanel);
  document.removeEventListener("traccarEvent", onTraccarEvent);

  // GUARD RAIL: Cleanup de keyboard listeners para evitar memory leak
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)

  // Cleanup do watcher de seguimento
  if (stopFollowingWatch) {
    stopFollowingWatch();
    stopFollowingWatch = null;
  }

  // Cleanup do playback interval
  if (playbackInterval.value) {
    clearInterval(playbackInterval.value)
    playbackInterval.value = null
  }

  // Cleanup do tooltip update interval
  if (tooltipUpdateInterval) {
    clearInterval(tooltipUpdateInterval);
    tooltipUpdateInterval = null;
  }

  // Cleanup de referência global do mapa
  if (window.$map) {
    window.$map = null
  }
})

const _availableTypes = ref([
  // Pessoas e Animais
  { key: 'default', name: 'Padrão' },
  { key: 'arrow', name: 'Seta' },
  { key: 'person', name: 'Pessoas' },
  { key: 'animal', name: 'Animais' },
  // Duas Rodas
  { key: 'bicycle', name: 'Bicicletas' },
  { key: 'motorcycle', name: 'Motos' },
  { key: 'scooter', name: 'Patinetes' },
  // Veículos Leves
  { key: 'car', name: 'Carros' },
  { key: 'pickup', name: 'Pick-Up' },
  { key: 'van', name: 'Van' },
  { key: 'offroad', name: 'Off-Road' },
  // Veículos Pesados
  { key: 'truck', name: 'Caminhão' },
  { key: 'truck1', name: 'Cavalo Mecânico' },
  { key: 'truck2', name: 'Carreta' },
  { key: 'bus', name: 'Ônibus' },
  { key: 'trolleybus', name: 'Ônibus Elétrico' },
  // Agricultura e Construção
  { key: 'tractor', name: 'Tratores' },
  { key: 'crane', name: 'Guindastes' },
  // Aquático
  { key: 'boat', name: 'Barcos' },
  { key: 'ship', name: 'Lanchas' },
  // Ferroviário
  { key: 'train', name: 'Trem' },
  { key: 'tram', name: 'Trem Elétrico' },
  // Aéreo
  { key: 'plane', name: 'Aviões' },
  { key: 'helicopter', name: 'Helicópteros' },
]);

const center = ref(MAP_CONSTANTS.DEFAULT_CENTER);
const zoomForce = ref(MAP_CONSTANTS.DEFAULT_ZOOM);

// ULTRA ENTERPRISE 3: cptPoints agora usa routeForPolyline (simplificado) ao invés de routePoints bruto
const cptPoints = computed(() => {
  // Usar rota simplificada para visual (economia massiva em rotas grandes)
  return routeForPolyline.value.map(p => [p.latitude || p[0], p.longitude || p[1]]);
});

const changeMap = (id) => {
  let map = 1;
  switch (id) {
    case 1:
      map = 'googleST';
      break;
    case 2:
      map = 'googleTR';
      break;
    case 3:
      map = 'googleSN';
      break;
  }

  store.dispatch("setMap", map);
}

const mapReady = (e) => {
  console.log('mapReady', e);
  window.$map = e;
  
  // ULTRA ENTERPRISE 2: Registrar listener de bounds para lazy load
  const m = map.value?.leafletObject;
  if (m) {
    m.whenReady(() => {
      updateMapBounds(); // Atualizar bounds inicial
      m.on('moveend zoomend', updateMapBounds);
      
      // 🎯 HANDSHAKE: Emitir evento quando mapa está 100% pronto
      window.dispatchEvent(new CustomEvent('tarkan:mapReady', { 
        detail: { map: window.$map } 
      }));
      console.log('✅ [MapReady] window.$map disponível');
    });
  }
}

const zoomUpdated = (z) => {
  zoom.value = z;
}

const selectedMap = computed(() => {
  const userMap = (store.state.auth && store.state.auth['map']) ? store.state.auth['map'] : undefined;
  const serverMap = (store.state.server.serverInfo && store.state.server.serverInfo['map']) ? store.state.server.serverInfo['map'] : 'openstreet'

  const map = userMap || serverMap;

  switch (map) {
    case "googleSN":
      return 3;
    case "googleTR":
      return 2;
    case "googleST":
      return 1;
  }


  return 1;

});

const showGeofences = computed({
  get: () => {
    // Usa o getter do store que já verifica localStorage e defaults do servidor
    return store.getters['mapPref']('geofences');
  },
  set: () => {
    // Quando o usuário mudar, salva no store (que salva no localStorage)
    store.dispatch('setMapPref', 'geofences');
  }
});

const availableMaps = ref([
  // Google Maps
  { id: 1, name: 'Google Maps', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], url: 'https://{s}.google.com/vt/lyrs=m@221097413&x={x}&y={y}&z={z}&hl=pt-BR' },
  { id: 2, name: 'Google Satélite', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], url: 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=pt-BR' },
  { id: 3, name: 'Google Tráfego', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], url: 'https://{s}.google.com/vt/lyrs=m@221097413,traffic&x={x}&y={y}&z={z}&hl=pt-BR' },
  { id: 4, name: 'Google Terreno', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=pt-BR' },
  // Google Maps Dark Mode
  { id: 5, name: 'Google Dark', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], url: 'https://{s}.google.com/vt/lyrs=m@221097413&x={x}&y={y}&z={z}&hl=pt-BR&apistyle=s.e%3Ag%7Cp.c%3A%23ff212121%2Cs.e%3Al.i%7Cp.v%3Aoff%2Cs.e%3Al.t.f%7Cp.c%3A%23ff757575%2Cs.e%3Al.t.s%7Cp.c%3A%23ff212121%2Cs.t%3A1%7Cs.e%3Ag%7Cp.c%3A%23ff757575%2Cs.t%3A17%7Cs.e%3Al.t.f%7Cp.c%3A%23ff9e9e9e%2Cs.t%3A21%7Cp.v%3Aoff%2Cs.t%3A19%7Cs.e%3Al.t.f%7Cp.c%3A%23ffbdbdbd%2Cs.t%3A2%7Cs.e%3Al.t.f%7Cp.c%3A%23ff757575%2Cs.t%3A40%7Cs.e%3Ag%7Cp.c%3A%23ff181818%2Cs.t%3A40%7Cs.e%3Al.t.f%7Cp.c%3A%23ff616161%2Cs.t%3A3%7Cs.e%3Ag%7Cp.c%3A%23ff2c2c2c%2Cs.t%3A3%7Cs.e%3Al.t.f%7Cp.c%3A%23ff9e9e9e%2Cs.t%3A49%7Cs.e%3Ag.f%7Cp.c%3A%23ff2c2c2c%2Cs.t%3A49%7Cs.e%3Al.t.f%7Cp.c%3A%23ff9e9e9e%2Cs.t%3A4%7Cs.e%3Ag%7Cp.c%3A%23ff746855%2Cs.t%3A4%7Cs.e%3Ag.s%7Cp.c%3A%23ff1f2835%2Cs.t%3A4%7Cs.e%3Al.t.f%7Cp.c%3A%23ffd59563%2Cs.t%3A6%7Cs.e%3Ag%7Cp.c%3A%23ff17263c%2Cs.t%3A6%7Cs.e%3Al.t.f%7Cp.c%3A%23ff515c6d%2Cs.t%3A6%7Cs.e%3Al.t.s%7Cp.c%3A%23ff17263c' },
  { id: 6, name: 'Google Dark Tráfego', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], url: 'https://{s}.google.com/vt/lyrs=m@221097413,traffic&x={x}&y={y}&z={z}&hl=pt-BR&apistyle=s.e%3Ag%7Cp.c%3A%23ff212121%2Cs.e%3Al.i%7Cp.v%3Aoff%2Cs.e%3Al.t.f%7Cp.c%3A%23ff757575%2Cs.e%3Al.t.s%7Cp.c%3A%23ff212121%2Cs.t%3A1%7Cs.e%3Ag%7Cp.c%3A%23ff757575%2Cs.t%3A17%7Cs.e%3Al.t.f%7Cp.c%3A%23ff9e9e9e%2Cs.t%3A21%7Cp.v%3Aoff%2Cs.t%3A19%7Cs.e%3Al.t.f%7Cp.c%3A%23ffbdbdbd%2Cs.t%3A2%7Cs.e%3Al.t.f%7Cp.c%3A%23ff757575%2Cs.t%3A40%7Cs.e%3Ag%7Cp.c%3A%23ff181818%2Cs.t%3A40%7Cs.e%3Al.t.f%7Cp.c%3A%23ff616161%2Cs.t%3A3%7Cs.e%3Ag%7Cp.c%3A%23ff2c2c2c%2Cs.t%3A3%7Cs.e%3Al.t.f%7Cp.c%3A%23ff9e9e9e%2Cs.t%3A49%7Cs.e%3Ag.f%7Cp.c%3A%23ff2c2c2c%2Cs.t%3A49%7Cs.e%3Al.t.f%7Cp.c%3A%23ff9e9e9e%2Cs.t%3A4%7Cs.e%3Ag%7Cp.c%3A%23ff746855%2Cs.t%3A4%7Cs.e%3Ag.s%7Cp.c%3A%23ff1f2835%2Cs.t%3A4%7Cs.e%3Al.t.f%7Cp.c%3A%23ffd59563%2Cs.t%3A6%7Cs.e%3Ag%7Cp.c%3A%23ff17263c%2Cs.t%3A6%7Cs.e%3Al.t.f%7Cp.c%3A%23ff515c6d%2Cs.t%3A6%7Cs.e%3Al.t.s%7Cp.c%3A%23ff17263c' },
  // OpenStreetMap
  { id: 7, name: 'OpenStreetMap', subdomains: ['a', 'b', 'c'], url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  // CartoDB
  { id: 8, name: 'Carto Light', subdomains: ['a', 'b', 'c', 'd'], url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
  { id: 9, name: 'Carto Dark', subdomains: ['a', 'b', 'c', 'd'], url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  // Esri
  { id: 10, name: 'Esri WorldStreetMap', subdomains: [], url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}' },
  { id: 11, name: 'Esri WorldImagery', subdomains: [], url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
]);

const availableTypes = computed(() => {
  if (eyeFilter.value.length > 3) {
    return _availableTypes.value.filter((t) => {
      return t.name.toLowerCase().match(eyeFilter.value.toLowerCase());
    });
  } else {
    return _availableTypes.value;
  }
});

const eyeAll = (b) => {
  _availableTypes.value.forEach((t) => {
    if (store.getters['devices/isHiddenFilter'](t.key) !== b) {
      store.dispatch('devices/toggleHiddenFilter', t.key);
    }
  });
}

const refreshMap = () => {
  window.location.reload();
};

/**
 * Abre o assistente virtual via WhatsApp
 * Utiliza o número configurado em labelConf.whatsapp
 */
const openWhatsAppAssistant = () => {
  const whatsappNumber = store.state.server.labelConf?.whatsapp;
  if (whatsappNumber) {
    // Remove caracteres não numéricos para garantir formato correto
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  }
};

// ============================================================================
// BUSCA NO MAPA - Controle de pesquisa de dispositivos
// ============================================================================

/**
 * Alterna a exibição do controle de busca no mapa
 * Permite buscar dispositivos pelo nome diretamente no mapa
 */
const toggleMapSearch = () => {
  if (window.$map && window.$map.leafletObject) {
    const map = window.$map.leafletObject;

    // Verificamos se o controle já está adicionado ao mapa
    if (window.$searchControl && window.$searchControl._map) {
      // Se já está adicionado, removemos
      map.removeControl(window.$searchControl);
      ElMessage.success(KT('map.search.disabled') || 'Busca desativada');
    } else {
      // Criamos uma nova camada para os marcadores buscáveis
      const searchLayer = new L.LayerGroup();
      map.addLayer(searchLayer);

      // Adicionamos os dispositivos como marcadores buscáveis
      if (store.state.devices && store.state.devices.list) {
        Object.values(store.state.devices.list).forEach(device => {
          if (device.latitude && device.longitude) {
            const marker = L.marker([device.latitude, device.longitude]);
            marker.bindPopup(device.name || 'Sem nome');
            // É importante que a propriedade name coincida com propertyName no controle de busca
            marker.name = device.name || 'Sem nome';
            searchLayer.addLayer(marker);
          }
        });
      }

      // Criamos o controle de busca se ainda não existe
      if (!window.$searchControl) {
        window.$searchControl = new L.Control.Search({
          layer: searchLayer,
          initial: false,
          propertyName: 'name',
          marker: false,
          autoCollapse: true,
          autoType: false,
          minLength: 2,
          textPlaceholder: KT('map.search.placeholder') || 'Buscar dispositivo...',
          textErr: KT('map.search.notFound') || 'Não encontrado',
          textCancel: KT('cancel') || 'Cancelar',
          zoom: 16,
          moveToLocation: function (latlng, title, map) {
            map.setView(latlng, 16);

            // Encontra o dispositivo pelo nome e dá foco nele
            const device = Object.values(store.state.devices.list).find(d => d.name === title);
            if (device) {
              store.dispatch('devices/focusDevice', device.id);
            }
          }
        });
      } else {
        // Atualiza a camada do controle existente
        window.$searchControl.setLayer(searchLayer);
      }

      // Adiciona o controle ao mapa
      map.addControl(window.$searchControl);

      // Abre automaticamente o campo de busca
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);

      ElMessage.success(KT('map.search.enabled') || 'Busca ativada - Digite o nome do dispositivo');
    }
  }
};

// ============================================================================
// FUNÇÕES DE PLAYBACK - Controle de reprodução de rotas
// ============================================================================

/**
 * Inicia/continua a reprodução da rota
 */
const runPlayRoute = () => {
  if (routePoints.value.length === 0) return;

  routePlayState.value = true;

  const baseDelay = 2500; // 2.5 segundos base (igual ao dark)
  const delay = baseDelay / playbackSpeed.value;

  if (playbackInterval.value) {
    clearInterval(playbackInterval.value);
  }

  const playNextPoint = () => {
    if (routePlayIndex.value < routePoints.value.length - 1) {
      routePlayIndex.value++;
      updatePlaybackPosition();
      playbackInterval.value = setTimeout(playNextPoint, delay);
    } else {
      pausePlayRoute();
    }
  };

  playbackInterval.value = setTimeout(playNextPoint, delay);
};

/**
 * Pausa a reprodução
 */
const pausePlayRoute = () => {
  routePlayState.value = false;
  if (playbackInterval.value) {
    clearTimeout(playbackInterval.value);
    playbackInterval.value = null;
  }
};

/**
 * Para a reprodução e volta ao início
 */
const stopPlayRoute = () => {
  pausePlayRoute();
  routePlayIndex.value = 0;
  routePlayPos.value = 0;
  currentRoutePoint.value = routePoints.value[0] || null;
};

/**
 * Reinicia a reprodução do início
 */
const restartPlayRoute = () => {
  stopPlayRoute();
  runPlayRoute();
};

/**
 * Avança para o próximo ponto
 */
const moveForward = () => {
  if (routePlayIndex.value < routePoints.value.length - 1) {
    routePlayIndex.value++;
    updatePlaybackPosition();
  }
};

/**
 * Retrocede para o ponto anterior
 */
const moveBackward = () => {
  if (routePlayIndex.value > 0) {
    routePlayIndex.value--;
    updatePlaybackPosition();
  }
};

/**
 * Alterna entre velocidades de reprodução
 */
const togglePlaybackSpeed = () => {
  const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed.value);
  const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
  playbackSpeed.value = PLAYBACK_SPEEDS[nextIndex];

  // Se está reproduzindo, reinicia com nova velocidade
  if (routePlayState.value) {
    pausePlayRoute();
    runPlayRoute();
  }
};

/**
 * Atualiza a posição visual da timeline, move o marcador e o ponto atual
 */
const updatePlaybackPosition = () => {
  if (routePoints.value.length === 0) return;

  const progress = routePlayIndex.value / (routePoints.value.length - 1);
  routePlayPos.value = progress * (TIMELINE_WIDTH - 20);
  currentRoutePoint.value = routePoints.value[routePlayIndex.value];

  // Atualiza o ponto na store para sincronizar com a lista do histórico
  store.commit("devices/setRoutePlayPoint", routePlayIndex.value);

  // Move o marcador do veículo no mapa
  if (currentRoutePoint.value) {
    const point = currentRoutePoint.value;
    const lat = point[0] || point.latitude;
    const lng = point[1] || point.longitude;
    const course = point[3] || point.course || 0;

    if (lat && lng) {
      // Obtém o dispositivo atual para mover seu ícone
      const deviceId = parseInt(store.state.devices.applyFilters.showOnlyId);
      const device = store.getters['devices/getDevice'](deviceId);

      if (device && device.icon) {
        // Move o marcador com animação suave
        const animationDuration = 200 / playbackSpeed.value;
        device.icon.moveTo(L.latLng(lat, lng), animationDuration);
        if (device.icon.options && device.icon.options.img) {
          device.icon.options.img.rotate = course;
        }
      }

      // Centraliza o mapa no ponto atual
      map.value?.leafletObject?.panTo([lat, lng], { animate: true, duration: 0.3 });
    }
  }
};

/**
 * Clica na timeline para mover para posição
 */
const moveTimelinePosition = (event) => {
  if (routePoints.value.length === 0) return;

  const rect = event.target.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const progress = Math.max(0, Math.min(1, clickX / (TIMELINE_WIDTH - 20)));

  routePlayIndex.value = Math.round(progress * (routePoints.value.length - 1));
  updatePlaybackPosition();
};

/**
 * Inicia o arrasto da timeline
 */
const startDrag = (event) => {
  event.preventDefault();
  isDragging.value = true;

  const onDrag = (e) => {
    if (!isDragging.value) return;

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const timeline = document.querySelector('.timeline-track');
    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (clientX - rect.left) / (TIMELINE_WIDTH - 20)));
    routePlayIndex.value = Math.round(progress * (routePoints.value.length - 1));
    updatePlaybackPosition();
  };

  const stopDrag = () => {
    isDragging.value = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
  };

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchmove', onDrag);
  document.addEventListener('touchend', stopDrag);
};

/**
 * Mostra o painel de detalhes da rota
 */
const showRouteDetails = () => {
  showDetailsPanel.value = !showDetailsPanel.value;
};

/**
 * Retorna a direção cardinal baseada no curso
 */
const getCardinalDirection = (course) => {
  if (course === null || course === undefined) return 'N/A';

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(course / 45) % 8;
  return directions[index];
};

/**
 * Formata data/hora
 */
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateString;
  }
};

// ============================================================================
// FUNÇÕES AUXILIARES UI - Helpers para o painel de detalhes
// ============================================================================
/* eslint-disable no-unused-vars */

/**
 * Copia a localização para a área de transferência
 */
const copyLocation = (point) => {
  if (!point) return;

  const lat = point.latitude || point[0];
  const lng = point.longitude || point[1];
  const locationText = `${lat?.toFixed(6)}, ${lng?.toFixed(6)}`;

  const tempElement = document.createElement('textarea');
  tempElement.value = locationText;
  document.body.appendChild(tempElement);
  tempElement.select();
  document.execCommand('copy');
  document.body.removeChild(tempElement);

  ElMessage.success(KT('map.copytranfer') || 'Posição copiada para área de transferência');
};

/**
 * Abre a localização no Google Maps
 */
const openInMaps = (point) => {
  if (!point) return;

  const lat = point.latitude || point[0];
  const lng = point.longitude || point[1];
  const url = `http://maps.google.com/maps?q=loc:${lat},${lng}`;
  window.open(url, '_blank');
};

/**
 * Retorna o ícone de bateria baseado no nível
 */
const getBatteryIcon = (level) => {
  if (level === undefined || level === null) return 'fas fa-battery-empty';

  if (level >= 90) return 'fas fa-battery-full';
  if (level >= 70) return 'fas fa-battery-three-quarters';
  if (level >= 40) return 'fas fa-battery-half';
  if (level >= 10) return 'fas fa-battery-quarter';
  return 'fas fa-battery-empty';
};

/**
 * Retorna a classe CSS baseada no nível de bateria
 */
const getBatteryClass = (level) => {
  if (level === undefined || level === null) return '';

  if (level >= 50) return 'active';
  if (level >= 20) return 'warning';
  return 'danger';
};

/**
 * Retorna a classe CSS baseada na temperatura
 */
const getTemperatureClass = (temp) => {
  if (temp === undefined || temp === null) return '';

  if (temp > 80) return 'danger';
  if (temp > 60) return 'warning';
  if (temp < 0) return 'info';
  return 'active';
};

/**
 * Retorna a classe CSS baseada no sinal RSSI
 */
const getSignalClass = (rssi) => {
  if (rssi === undefined || rssi === null) return '';

  // RSSI geralmente é negativo, valores mais próximos de 0 são melhores
  if (rssi > -70) return 'active';
  if (rssi > -85) return 'warning';
  return 'danger';
};

/**
 * Formata o valor de um atributo de forma inteligente
 */
const formatAttributeValue = (key, value) => {
  if (value === undefined || value === null) return '-';

  // Distâncias
  if (key.toLowerCase().includes('distance') || key.toLowerCase().includes('odometer')) {
    if (typeof value === 'number') {
      return (value / 1000).toFixed(2) + ' km';
    }
  }

  // Percentuais
  if (key.toLowerCase().includes('level') || key.toLowerCase().includes('percent')) {
    return Math.round(value) + '%';
  }

  // Voltagens
  if (key.toLowerCase().includes('power') || key.toLowerCase().includes('battery') || key.toLowerCase().includes('voltage')) {
    if (typeof value === 'number' && value < 100) {
      return value.toFixed(1) + 'V';
    }
  }

  // Temperaturas
  if (key.toLowerCase().includes('temp')) {
    return value + '°C';
  }

  // Booleanos
  if (typeof value === 'boolean') {
    return value ? (KT('yes') || 'Sim') : (KT('no') || 'Não');
  }

  // Datas
  if (key.toLowerCase().includes('time') || key.toLowerCase().includes('date')) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  return String(value);
};

// Lista de atributos principais para o grid
const mainAttributes = ['ignition', 'blocked', 'sat', 'satellites', 'power', 'totalDistance', 'battery', 'batteryLevel', 'distance', 'hours', 'temperature', 'fuel', 'motion'];

// Filtra atributos para excluir os que já estão no grid principal
const filteredAttributes = computed(() => {
  if (!currentRoutePoint.value?.attributes) return {};

  const filtered = {};
  for (const [key, value] of Object.entries(currentRoutePoint.value.attributes)) {
    if (!mainAttributes.includes(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
});
/* eslint-enable no-unused-vars */

// ============================================================================
// TOOLTIP FOLLOW - Atualização do tooltip ao seguir dispositivo
// ============================================================================

/**
 * Fecha o tooltip manualmente
 */
const hideTooltipManually = () => {
  tooltipManuallyHidden.value = true;
  showFloatingPanel.value = false;
  if (window.$hideTip) {
    window.$hideTip();
  }
};

/**
 * Atualiza o painel flotante
 */
const updateFloatingPanel = () => {
  if (!showFloatingPanel.value || !floatingPanelDevice.value) return;

  const followingId = store.state.devices.isFollowingId;
  if (followingId && followingId !== floatingPanelDevice.value.id) {
    const updatedDevice = store.getters["devices/getDevice"](followingId);
    if (updatedDevice) {
      floatingPanelDevice.value = updatedDevice;
    }
  }
};

/**
 * Atualiza o tooltip quando o veículo está em modo seguimento
 */
const updateFollowTooltip = () => {
  const deviceId = store.state.devices.isFollowingId;
  // Se o ID não existe ou o tooltip foi fechado manualmente, não mostrar
  if (!deviceId || tooltipManuallyHidden.value) return;

  const device = store.getters["devices/getDevice"](deviceId);
  const position = store.getters["devices/getPosition"](deviceId);

  if (device && position && window.$showTip && map.value) {
    // Determinar cor do status de conexão
    let connectionStatusColor = '#e6a23c';
    if (device.lastUpdate === null || (device.status !== 'online' && device.status !== 'offline')) {
      connectionStatusColor = '#e6a23c';
    } else if (device.status === 'online' && position && position.speed > 6) {
      connectionStatusColor = '#409eff';
    } else if (device.status === 'online') {
      connectionStatusColor = '#67c23a';
    } else {
      connectionStatusColor = '#f56c6c';
    }

    // Conteúdo do tooltip de seguimento com botões de ação
    // Verificar se existe motorista para mostrar botão do painel
    const driverIdCheck = position.attributes?.driverUniqueId || device.attributes?.driverUniqueId;
    const hasDriver = !!driverIdCheck;

    let tooltipContent = `<div style="padding:10px;min-width:280px;position:relative;">
      <!-- Botões de ação -->
      <div style="position:absolute;top:6px;right:6px;display:flex;gap:2px;z-index:1000;">
        ${hasDriver ? `<!-- Botão de panel flotante do motorista -->
        <div onclick="document.dispatchEvent(new CustomEvent('openFloatingPanel', { detail: { deviceId: ${deviceId} } }));" style="background-color:rgba(255,255,255,0.15);width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="Ver motorista">
          <i class="fas fa-id-card" style="color:white;font-size:9px;"></i>
        </div>` : ''}
        <!-- Botão de fechar -->
        <div onclick="document.dispatchEvent(new CustomEvent('hideFollowTooltip'));" style="background-color:rgba(255,255,255,0.15);width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;">
          <i class="fas fa-times" style="color:white;font-size:9px;"></i>
        </div>
      </div>
      
      <!-- Nome do dispositivo com círculo de status -->
      <div style="font-weight:bold;color:#ffffff;text-align:center;font-size:14px;margin-bottom:10px;padding-right:20px;display:flex;align-items:center;justify-content:center;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${connectionStatusColor};margin-right:6px;flex-shrink:0;"></span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${device.name}</span>
      </div>`;

    // Grid de ícones de status
    if (position.attributes) {
      tooltipContent += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:10px;">';

      // 1. Ignição
      const ignitionColor = position.attributes.ignition ? '#4ade80' : '#ef4444';
      tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${ignitionColor};">
        <i class="fas fa-key" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:10px;text-align:center;color:#ffffff;">${position.attributes.ignition ? 'LIG' : 'DES'}</span>
      </div>`;

      // 2. Bloqueio
      let isBlocked = false;
      if (position.attributes.blocked !== undefined) {
        if (typeof position.attributes.blocked === 'boolean') {
          isBlocked = position.attributes.blocked;
        } else if (typeof position.attributes.blocked === 'string') {
          isBlocked = position.attributes.blocked.toLowerCase() === 'true';
        } else if (typeof position.attributes.blocked === 'number') {
          isBlocked = position.attributes.blocked !== 0;
        }
      }
      const blockedColor = isBlocked ? '#ef4444' : '#4ade80';
      tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${blockedColor};">
        <i class="fas ${isBlocked ? 'fa-lock' : 'fa-lock-open'}" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:10px;text-align:center;color:#ffffff;">${isBlocked ? 'BLO' : 'DES'}</span>
      </div>`;

      // 3. Bateria do veículo (power)
      let powerColor = '#94a3b8';
      let powerValue = 'N/A';
      if (position.attributes.power) {
        const power = parseFloat(position.attributes.power);
        powerValue = power.toFixed(1) + 'v';
        powerColor = power < 11.5 ? '#ef4444' : (power < 12.5 ? '#f59e0b' : '#4ade80');
      }
      tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${powerColor};">
        <i class="fas fa-car-battery" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:9px;text-align:center;color:#ffffff;">${powerValue}</span>
      </div>`;

      // 4. Bateria interna
      let batteryColor = '#94a3b8';
      let batteryValue = 'N/A';
      let batteryIcon = 'fas fa-battery-empty';
      if (position.attributes.batteryLevel) {
        const batteryLevel = parseInt(position.attributes.batteryLevel);
        batteryValue = batteryLevel + '%';
        batteryColor = batteryLevel < 30 ? '#ef4444' : (batteryLevel < 70 ? '#f59e0b' : '#4ade80');
        // Definir ícone baseado no nível
        if (batteryLevel >= 90) batteryIcon = 'fas fa-battery-full';
        else if (batteryLevel >= 70) batteryIcon = 'fas fa-battery-three-quarters';
        else if (batteryLevel >= 40) batteryIcon = 'fas fa-battery-half';
        else if (batteryLevel >= 10) batteryIcon = 'fas fa-battery-quarter';
        else batteryIcon = 'fas fa-battery-empty';
      } else if (position.attributes.battery) {
        const battery = parseFloat(position.attributes.battery);
        batteryValue = battery.toFixed(1) + 'v';
        batteryColor = battery < 3.2 ? '#ef4444' : (battery < 3.7 ? '#f59e0b' : '#4ade80');
        // Para voltagem, usar ícone baseado em faixas de tensão
        if (battery >= 4.0) batteryIcon = 'fas fa-battery-full';
        else if (battery >= 3.7) batteryIcon = 'fas fa-battery-three-quarters';
        else if (battery >= 3.5) batteryIcon = 'fas fa-battery-half';
        else if (battery >= 3.2) batteryIcon = 'fas fa-battery-quarter';
        else batteryIcon = 'fas fa-battery-empty';
      }
      tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${batteryColor};">
        <i class="${batteryIcon}" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:9px;text-align:center;color:#ffffff;">${batteryValue}</span>
      </div>`;

      // 5. Combustível
      let fuelColor = '#94a3b8';
      let fuelValue = 'N/A';
      if (position.attributes.fuel !== undefined) {
        const fuel = parseInt(position.attributes.fuel);
        fuelValue = fuel + 'L';
        fuelColor = fuel < 25 ? '#ef4444' : (fuel < 50 ? '#f59e0b' : '#4ade80');
      }
      tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${fuelColor};">
        <i class="fas fa-gas-pump" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:9px;text-align:center;color:#ffffff;">${fuelValue}</span>
      </div>`;

      // 6. Velocidade
      const speedKmh = Math.round(position.speed * 1.852);
      const speedColor = speedKmh > 0 ? '#4ade80' : '#94a3b8';
      tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${speedColor};">
        <i class="fas fa-tachometer-alt" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:9px;text-align:center;color:#ffffff;">${speedKmh}km</span>
      </div>`;

      // 7. Satélites
      let satellitesColor = '#94a3b8';
      let satellitesValue = 'N/A';
      if (position.attributes.satellites !== undefined || position.attributes.sat !== undefined) {
        const sat = parseInt(position.attributes.satellites || position.attributes.sat);
        satellitesValue = sat.toString();
        satellitesColor = sat < 4 ? '#ef4444' : (sat < 8 ? '#f59e0b' : '#4ade80');
      }
      tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${satellitesColor};">
        <i class="fas fa-satellite" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:9px;text-align:center;color:#ffffff;">${satellitesValue}</span>
      </div>`;

      tooltipContent += '</div>';

      // Endereço/Coordenadas
      if (position.address) {
        const address = position.address.length > 45 ? position.address.substring(0, 45) + '...' : position.address;
        tooltipContent += `<div style="color:#ffffff;font-size:9px;margin-bottom:6px;text-align:center;border-top:1px solid rgba(255,255,255,0.2);padding-top:6px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px;">
          <i class="fas fa-map-marker-alt" style="margin-right:4px;color:#60a5fa;"></i>${address}
        </div>`;
      } else {
        tooltipContent += `<div style="color:#ffffff;font-size:9px;margin-bottom:6px;text-align:center;border-top:1px solid rgba(255,255,255,0.2);padding-top:6px;">
          <i class="fas fa-map-marker-alt" style="margin-right:4px;color:#60a5fa;"></i>${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}
        </div>`;
      }

      // Motorista
      const driverUniqueId = position.attributes?.driverUniqueId || device.attributes?.driverUniqueId;
      if (driverUniqueId) {
        const driver = store.getters['drivers/getDriverByUniqueId'](driverUniqueId);
        const driverInfo = driver?.name || driverUniqueId;
        tooltipContent += `<div style="color:#ffffff;font-size:9px;margin-bottom:6px;text-align:center;">
          <i class="fas fa-user" style="margin-right:4px;color:#34d399;"></i>${driverInfo}
        </div>`;
      }

      // Linha inferior com data/hora e ângulo
      let bottomLine = '';
      if (device.lastUpdate) {
        const lastUpdateDate = new Date(device.lastUpdate);
        const formattedDate = lastUpdateDate.toLocaleDateString() + ' ' + lastUpdateDate.toLocaleTimeString();
        bottomLine += `<i class="fas fa-clock" style="color:#a78bfa;margin-right:4px;"></i>${formattedDate} `;
      }

      if (position.course !== undefined && position.course !== null) {
        const angle = Math.round(position.course);
        const direction = angle >= 0 && angle <= 180 ? 'N' : 'S';
        bottomLine += `<i class="fas fa-compass" style="color:#fbbf24;margin-left:8px;margin-right:4px;"></i>${angle}°${direction} `;
      }

      if (bottomLine) {
        tooltipContent += `<div style="color:#ffffff;font-size:10px;margin-bottom:6px;text-align:center;">
          ${bottomLine}
        </div>`;
      }
    }

    tooltipContent += '</div>';

    // Posição do tooltip
    const markPoint = map.value.leafletObject.latLngToContainerPoint(L.latLng(position.latitude, position.longitude));
    const left = markPoint.x + (router.currentRoute.value.meta.shown ? 553 : 73);
    const top = markPoint.y;

    window.$showTip({ left: left + 'px', top: top + 'px' }, tooltipContent, true);
  }
};

/**
 * Controles de zoom
 */
const zoomIn = () => {
  if (map.value?.leafletObject) {
    map.value.leafletObject.zoomIn();
  }
};

const zoomOut = () => {
  if (map.value?.leafletObject) {
    map.value.leafletObject.zoomOut();
  }
};

const markerOut = () => {
  window.$hideTip();
}

/**
 * FIX 2 ENTERPRISE: Debounce helper inline
 */
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * FIX 2 ENTERPRISE: Cache de tooltips por deviceId
 * Regenera apenas quando device/position mudam
 */
const tooltipCache = new Map();

const buildTooltipHtml = (deviceId, device, position, connectionStatusColor) => {
  // Verificar se cache é válido (lastUpdate não mudou)
  const cacheKey = `${deviceId}_${device.lastUpdate}_${position?.speed}_${device.status}`;
  if (tooltipCache.has(cacheKey)) {
    return tooltipCache.get(cacheKey);
  }

  // Limpar cache se ficar muito grande (>500 entradas)
  if (tooltipCache.size > 500) {
    const entriesToDelete = Array.from(tooltipCache.keys()).slice(0, 250);
    entriesToDelete.forEach(key => tooltipCache.delete(key));
  }

  // Tooltip DARK com estilo profissional
  let html = `<div style="padding:10px;min-width:260px;background:rgba(0,0,0,0.88);border-radius:8px;">`;

  // Header: Nome com círculo de status
  html += `<div style="font-weight:bold;color:#ffffff;text-align:center;font-size:14px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;">
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${connectionStatusColor};margin-right:6px;flex-shrink:0;"></span>
    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${device.name}</span>
  </div>`;

  if (position) {
    const speed = Math.round((position.speed || 0) * 1.852);
    const ignition = position.attributes?.ignition;
    const sat = position.attributes?.sat || position.attributes?.satellites || 0;
    const battery = position.attributes?.battery || position.attributes?.batteryLevel;
    const power = position.attributes?.power;
    const fuel = position.attributes?.fuel || position.attributes?.fuelLevel;

    // Detectar bloqueio de forma consistente
    let isBlocked = false;
    if (position.attributes?.blocked !== undefined) {
      if (typeof position.attributes.blocked === 'boolean') {
        isBlocked = position.attributes.blocked;
      } else if (typeof position.attributes.blocked === 'string') {
        isBlocked = position.attributes.blocked.toLowerCase() === 'true';
      } else if (typeof position.attributes.blocked === 'number') {
        isBlocked = position.attributes.blocked !== 0;
      }
    }

    // Grid DARK de 7 ícones em linha (estilo profissional)
    html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:10px;">';

    // 1. Ignição
    const ignitionColor = ignition ? '#4ade80' : '#ef4444';
    html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${ignitionColor};">
      <i class="fas fa-key" style="margin-bottom:1px;font-size:14px;"></i>
      <span style="font-size:10px;text-align:center;color:#ffffff;">${ignition ? 'LIG' : 'DES'}</span>
    </div>`;

    // 2. Bloqueio
    const blockedColor = isBlocked ? '#ef4444' : '#4ade80';
    html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${blockedColor};">
      <i class="fas ${isBlocked ? 'fa-lock' : 'fa-lock-open'}" style="margin-bottom:1px;font-size:14px;"></i>
      <span style="font-size:10px;text-align:center;color:#ffffff;">${isBlocked ? 'BLO' : 'DES'}</span>
    </div>`;

    // 3. Bateria do veículo (power)
    let powerColor = '#94a3b8';
    let powerValue = 'N/A';
    if (power !== undefined && power !== null) {
      const powerV = parseFloat(power);
      powerValue = powerV.toFixed(1) + 'v';
      powerColor = powerV < 11.5 ? '#ef4444' : (powerV < 12.5 ? '#f59e0b' : '#4ade80');
    }
    html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${powerColor};">
      <i class="fas fa-car-battery" style="margin-bottom:1px;font-size:14px;"></i>
      <span style="font-size:9px;text-align:center;color:#ffffff;">${powerValue}</span>
    </div>`;

    // 4. Bateria interna
    let batteryColor = '#94a3b8';
    let batteryValue = 'N/A';
    let batteryIcon = 'fas fa-battery-empty';
    if (battery !== undefined && battery !== null) {
      const batteryVal = parseFloat(battery);
      if (batteryVal > 100) {
        // É voltagem
        batteryValue = batteryVal.toFixed(1) + 'v';
        batteryColor = batteryVal < 3.2 ? '#ef4444' : (batteryVal < 3.7 ? '#f59e0b' : '#4ade80');
        // Ícone baseado em faixas de tensão
        if (batteryVal >= 4.0) batteryIcon = 'fas fa-battery-full';
        else if (batteryVal >= 3.7) batteryIcon = 'fas fa-battery-three-quarters';
        else if (batteryVal >= 3.5) batteryIcon = 'fas fa-battery-half';
        else if (batteryVal >= 3.2) batteryIcon = 'fas fa-battery-quarter';
        else batteryIcon = 'fas fa-battery-empty';
      } else {
        // É porcentagem
        batteryValue = Math.round(batteryVal) + '%';
        batteryColor = batteryVal < 30 ? '#ef4444' : (batteryVal < 70 ? '#f59e0b' : '#4ade80');
        // Ícone baseado em porcentagem
        if (batteryVal >= 90) batteryIcon = 'fas fa-battery-full';
        else if (batteryVal >= 70) batteryIcon = 'fas fa-battery-three-quarters';
        else if (batteryVal >= 40) batteryIcon = 'fas fa-battery-half';
        else if (batteryVal >= 10) batteryIcon = 'fas fa-battery-quarter';
        else batteryIcon = 'fas fa-battery-empty';
      }
    }
    html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${batteryColor};">
      <i class="${batteryIcon}" style="margin-bottom:1px;font-size:14px;"></i>
      <span style="font-size:9px;text-align:center;color:#ffffff;">${batteryValue}</span>
    </div>`;

    // 5. Combustível
    let fuelColor = '#94a3b8';
    let fuelValue = 'N/A';
    if (fuel !== undefined && fuel !== null) {
      const fuelVal = parseFloat(fuel);
      fuelValue = Math.round(fuelVal) + 'L';
      fuelColor = fuelVal < 25 ? '#ef4444' : (fuelVal < 50 ? '#f59e0b' : '#4ade80');
    }
    html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${fuelColor};">
      <i class="fas fa-gas-pump" style="margin-bottom:1px;font-size:14px;"></i>
      <span style="font-size:9px;text-align:center;color:#ffffff;">${fuelValue}</span>
    </div>`;

    // 6. Velocidade
    const speedColor = speed > 0 ? '#4ade80' : '#94a3b8';
    html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${speedColor};">
      <i class="fas fa-tachometer-alt" style="margin-bottom:1px;font-size:14px;"></i>
      <span style="font-size:9px;text-align:center;color:#ffffff;">${speed}km</span>
    </div>`;

    // 7. Satélites
    const satVal = parseInt(sat);
    const satellitesColor = satVal < 4 ? '#ef4444' : (satVal < 8 ? '#f59e0b' : '#4ade80');
    html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${satellitesColor};">
      <i class="fas fa-satellite" style="margin-bottom:1px;font-size:14px;"></i>
      <span style="font-size:9px;text-align:center;color:#ffffff;">${satVal || 'N/A'}</span>
    </div>`;

    html += '</div>'; // Fecha grid

    // Endereço ou coordenadas - estilo DARK
    if (position.address) {
      const address = position.address.length > 45 ? position.address.substring(0, 45) + '...' : position.address;
      html += `<div style="color:#ffffff;font-size:9px;margin-bottom:6px;text-align:center;border-top:1px solid rgba(255,255,255,0.2);padding-top:6px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px;">
        <i class="fas fa-map-marker-alt" style="margin-right:4px;color:#60a5fa;"></i>${address}
      </div>`;
    } else if (position.latitude && position.longitude) {
      html += `<div style="color:#ffffff;font-size:9px;margin-bottom:6px;text-align:center;border-top:1px solid rgba(255,255,255,0.2);padding-top:6px;">
        <i class="fas fa-map-marker-alt" style="margin-right:4px;color:#60a5fa;"></i>${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}
      </div>`;
    }

    // Motorista (se disponível)
    const driverUniqueId = position.attributes?.driverUniqueId || device.attributes?.driverUniqueId;
    if (driverUniqueId) {
      const driverObj = store.getters['drivers/getDriverByUniqueId']?.(driverUniqueId);
      const driverName = driverObj?.name || driverUniqueId;
      html += `<div style="color:#ffffff;font-size:9px;margin-bottom:6px;text-align:center;">
        <i class="fas fa-user" style="margin-right:4px;color:#34d399;"></i>${driverName}
      </div>`;
    }

    // Linha inferior: Data/hora, ângulo, estado - estilo DARK
    const lastUpdate = device.lastUpdate ? new Date(device.lastUpdate) : null;
    const course = position.course;
    const deviceState = device.attributes?.['device.state'];
    const isAdmin = store.state.auth.user?.administrator;

    let bottomLine = '';

    // Data/hora com ícone
    if (lastUpdate) {
      const formattedDate = lastUpdate.toLocaleDateString() + ' ' + lastUpdate.toLocaleTimeString();
      bottomLine += `<i class="fas fa-clock" style="color:#a78bfa;margin-right:4px;"></i>${formattedDate} `;
    }

    // Ângulo/direção com ícone
    if (course !== undefined && course !== null) {
      const angle = Math.round(course);
      const direction = angle >= 0 && angle <= 180 ? 'N' : 'S';
      bottomLine += `<i class="fas fa-compass" style="color:#fbbf24;margin-left:8px;margin-right:4px;"></i>${angle}°${direction} `;
    }

    // Estado do dispositivo (apenas admin) com ícones
    if (isAdmin && deviceState) {
      let stateIcon = '';
      let stateColor = '';
      let stateText = deviceState;
      switch (deviceState) {
        case 'installed':
          stateText = 'Instalado';
          stateIcon = 'fa-check-circle';
          stateColor = '#67c23a';
          break;
        case 'in_service':
          stateText = 'Em Serviço';
          stateIcon = 'fa-tools';
          stateColor = '#f59e0b';
          break;
        case 'in_stock':
          stateText = 'Estoque';
          stateIcon = 'fa-box';
          stateColor = '#6b7280';
          break;
        case 'with_failures':
          stateText = 'Com Falhas';
          stateIcon = 'fa-exclamation-triangle';
          stateColor = '#ef4444';
          break;
        case 'company':
          stateText = 'Empresa';
          stateIcon = 'fa-building';
          stateColor = '#3b82f6';
          break;
        case 'withdrawn':
          stateText = 'Retirado';
          stateIcon = 'fa-archive';
          stateColor = '#dc2626';
          break;
        default:
          stateIcon = 'fa-info-circle';
          stateColor = '#94a3b8';
      }
      bottomLine += `<i class="fas ${stateIcon}" style="color:${stateColor};margin-left:8px;margin-right:4px;"></i>${stateText}`;
    }

    if (bottomLine) {
      html += `<div style="color:#ffffff;font-size:10px;margin-bottom:6px;text-align:center;">
        ${bottomLine}
      </div>`;
    }
  }

  html += `</div>`;
  
  // Armazenar no cache
  tooltipCache.set(cacheKey, html);
  return html;
};

/**
 * Mostra tooltip rico com informações do dispositivo
 * FIX 2 ENTERPRISE: Agora com cache + debounce (40ms) para hover suave em 1000+ veículos
 * Grid visual DARK de 7 ícones: ignição, bloqueio, energia, bateria, combustível, velocidade, satélites
 * Estilo profissional igual ao kore-map-dark.vue
 */
const markerOver = debounce((e) => {
  const deviceId = (e.target) ? e.target.options.id : e;
  const device = store.getters['devices/getDevice'](deviceId);
  const position = store.getters['devices/getPosition'](deviceId);

  if (!map.value?.leafletObject || !device) return;

  const markPoint = map.value.leafletObject.latLngToContainerPoint(e.target._latlng);
  const left = markPoint.x + (router.currentRoute.value.meta.shown ? 553 : 73);
  const top = markPoint.y;

  // Determinar cor do status de conexão (azul=movendo, verde=parado online, vermelho=offline, amarelo=desconhecido)
  let connectionStatusColor = '#e6a23c';
  if (device.lastUpdate === null || (device.status !== 'online' && device.status !== 'offline')) {
    connectionStatusColor = '#e6a23c'; // amarelo - desconhecido
  } else if (device.status === 'online' && position && position.speed > 6) {
    connectionStatusColor = '#409eff'; // azul - movendo
  } else if (device.status === 'online') {
    connectionStatusColor = '#67c23a'; // verde - online parado
  } else {
    connectionStatusColor = '#f56c6c'; // vermelho - offline
  }

  // FIX 2 ENTERPRISE: Usar cache quando possível
  const html = buildTooltipHtml(deviceId, device, position, connectionStatusColor);

  window.$showTip({ left: left + 'px', top: (top) + 'px' }, html, true);
}, 40); // 40ms debounce para hover suave

const flyToDevice = (device) => {
  const position = store.getters["devices/getPosition"](device.id);
  const zoom = store.state.server.serverInfo?.attributes?.['web.selectZoom'] ?? MAP_CONSTANTS.FLY_TO_ZOOM;

  if (position) {
    // GUARD RAIL: setTimeout duplo necessário para garantir que o mapa esteja pronto
    // TODO: Investigar se podemos usar nextTick ou evento do Leaflet ao invés disso
    setTimeout(() => {
      setTimeout(() => {
        map.value?.leafletObject?.flyTo(
          [position.latitude, position.longitude],
          zoom,
          { animate: true, duration: MAP_CONSTANTS.FLY_DURATION }
        );
      }, MAP_CONSTANTS.FLY_DELAY);
    }, MAP_CONSTANTS.FLY_DELAY);
  }
}


const markerClick = (e) => {
  const deviceId = (e.target) ? e.target.options.id : e;
  router.push('/devices/' + deviceId);
  const device = store.getters['devices/getDevice'](deviceId);
  store.commit("devices/setFollow", deviceId);
  device.icon.bringToFront();
  flyToDevice(device);
}


const updateRoute = (points, show = true) => {

  if (points.length) {
    store.commit("devices/setRoute", true);
  }


  routePoints.value = points;
  showRoutePoints.value = show;

  if (points.length > 0) {
    let tmp = [];
    for (var p in points) {
      tmp.push([points[p][0], points[p][1]]);
    }

    setTimeout(() => {

      // eslint-disable-next-line no-undef
      const bds = L.latLngBounds(tmp);
      //map.value.leafletObject.flyTo([points[0][0],points[0][1]], 12, {animate: true, duration: 1.5});
      map.value?.leafletObject?.fitBounds(bds);
    }, 300);
  }
}


const setMapCenter = (pos) => {
  map.value?.leafletObject?.panTo(pos);
}
window.$setMapCenter = setMapCenter;

const mapClick = (e) => {
  if (e.latlng && store.state.geofences.mapEditing !== 0) {
    if (store.state.geofences.mapPointEditingType === 'CIRCLE') {
      if (store.state.geofences.mapPointEditing !== 2) {
        store.dispatch("geofences/setupCircle", [e.latlng.lat, e.latlng.lng, 10])
      } else {
        store.dispatch("geofences/completeCircle")
      }
    } else if (store.state.geofences.mapPointEditingType === 'LINESTRING') {
      store.dispatch("geofences/setupLine", [e.latlng.lat, e.latlng.lng])
    } else if (store.state.geofences.mapPointEditingType === 'POLYGON') {
      store.dispatch("geofences/setupPolygon", [e.latlng.lat, e.latlng.lng])
    }
  }
}

// ============================================================================
// GUARD RAIL: Throttle no mapMove
// O evento mousemove dispara ~60x/segundo. Sem throttle, isso causa:
// 1. Dispatch excessivo para store
// 2. Re-renders desnecessários
// 3. Lag visual durante edição de círculo
// ============================================================================
let mapMoveThrottleTimer = null;
const MAP_MOVE_THROTTLE_MS = 16; // ~60fps

const mapMove = (e) => {
  if (mapMoveThrottleTimer) return;

  mapMoveThrottleTimer = setTimeout(() => {
    mapMoveThrottleTimer = null;

    if (e.latlng &&
      store.state.geofences.mapPointEditing === 2 &&
      store.state.geofences.mapPointEditingType === 'CIRCLE' &&
      store.state.geofences.mapPointEditingParams.length === 3) {
      store.dispatch(
        "geofences/setCircleRadius",
        L.latLng(store.getters["geofences/getCirclePosition"]).distanceTo(e.latlng)
      );
    }
  }, MAP_MOVE_THROTTLE_MS);
}

const markerContext = async (evt, e) => {
  let addSep = false;

  const deviceId = (evt.target && evt.target.options && evt.target.options.id) ? evt.target.options.id : e;
  const user = store.state.auth;
  const device = store.getters["devices/getDevice"](deviceId);
  const position = store.getters["devices/getPosition"](deviceId)
  let availableSaved = [];
  let commands = [];

  if (device.status !== 'online') {
    commands.push({
      text: KT('actions.offline'), cb: () => {
        ElMessageBox.confirm(
          KT('actions.offline_message', device),
          'Warning',
          {
            confirmButtonText: KT('OK'),
            cancelButtonText: KT('Cancel'),
            type: 'warning',
          }
        ).then(() => {
          console.log("OK")
        }).catch(() => {
          ElMessage.error(KT('userCancel'));
        })
      }
    });
  } else {
    window.$traccar.getTypeCommands(deviceId).then((response) => {
      const availableTypesCommand = response.data;
      availableTypesCommand.forEach((c) => {
        commands.push({
          text: KT('actions.' + c.type), cb: () => {
            ElMessageBox.confirm(
              KT('device.confirm_command', device),
              'Warning',
              {
                confirmButtonText: KT('OK'),
                cancelButtonText: KT('Cancel'),
                type: 'warning',
              }
            ).then(() => {
              window.$traccar.sendCommand({ deviceId: deviceId, type: c.type });
              ElNotification({
                title: KT('success'),
                message: KT('device.command_sent'),
                type: 'success',
              });
            }).catch(() => {
              ElMessage.error(KT('userCancel'));
            })
          }
        });
      });
      window.$traccar.getAvailableCommands(deviceId).then((response) => {
        availableSaved = response.data;

        if (commands.length > 0 && availableSaved.length > 0) {
          commands.push({ text: 'separator' });
        }

        availableSaved.forEach((c) => {
          commands.push({
            text: c.description, cb: () => {
              ElMessageBox.confirm(
                KT('device.confirm_command', device),
                'Warning',
                {
                  confirmButtonText: KT('OK'),
                  cancelButtonText: KT('Cancel'),
                  type: 'warning',
                }
              ).then(() => {
                window.$traccar.sendCommand({ ...c, ...{ deviceId: deviceId } });
                ElNotification({
                  title: KT('success'),
                  message: KT('device.command_sent'),
                  type: 'success',
                });
              }).catch(() => {
                ElMessage.error(KT('userCancel'));
              })
            }
          });
        });
      })
    });
  }

  let tmp = [];
  tmp.push({
    text: KT('device.details'),
    icon: 'fas fa-info-circle',
    cb: () => {
      router.push('/devices/' + deviceId);
    }
  });

  tmp.push({
    text: KT('device.zoom'),
    icon: 'fas fa-search-plus',
    cb: () => {
      flyToDevice(device);
    }
  });

  if (store.state.devices.isFollowingId === deviceId) {
    tmp.push({
      text: KT('device.unfollow'),
      icon: 'fas fa-eye-slash',
      cb: () => {
        window.$hideTip();
        // Detener el intervalo de actualización del tooltip
        if (tooltipUpdateInterval) {
          clearInterval(tooltipUpdateInterval);
          tooltipUpdateInterval = null;
        }
        store.commit("devices/setFollow", 0);

        // Desactivar Street View si está activado
        if (store.state.devices.streetview) {
          store.dispatch("devices/toggleStreet");
        }
      }
    });
  } else {
    tmp.push({
      text: KT('device.follow'),
      icon: 'fas fa-eye',
      cb: () => {
        store.commit("devices/setFollow", deviceId);
        flyToDevice(device);

        // Iniciar la actualización del tooltip
        if (tooltipUpdateInterval) {
          clearInterval(tooltipUpdateInterval);
        }
        tooltipUpdateInterval = setInterval(updateFollowTooltip, 1000);
        updateFollowTooltip(); // Actualizar inmediatamente

        // Activar Street View si hay token de Google disponible
        const googleApiKey = store.getters['server/getAttribute']('google_api');
        if (googleApiKey && googleApiKey.trim() !== '') {
          // Solo activar Street View si no está ya activado
          if (!store.state.devices.streetview) {
            store.dispatch("devices/toggleStreet");
          }
        }
      }
    });
  }

  if (store.state.devices.trail === deviceId) {
    tmp.push({
      text: KT('device.untrail'),
      icon: 'fas fa-route',
      cb: () => {
        store.commit("devices/setTrail", false)
      }
    });
  } else {
    tmp.push({
      text: KT('device.trail'),
      icon: 'fas fa-map-signs',
      cb: () => {
        store.commit("devices/setTrail", deviceId);
        flyToDevice(device);
      }
    });
  }

  let shareOpen = [];
  shareOpen.push({
    text: KT('device.openMaps'),
    icon: 'fas fa-map-marked-alt',
    cb: () => {
      const elm = document.createElement("a");
      elm.target = "_blank";
      elm.href = 'http://maps.google.com/maps?q=loc:' + position.latitude + "," + position.longitude;
      document.body.appendChild(elm);
      elm.click();
      document.body.removeChild(elm);
    }
  });

  shareOpen.push({
    text: KT('device.openStreet'),
    icon: 'fas fa-street-view',
    cb: () => {
      const link = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + position.latitude + ',' + position.longitude + '&heading=' + position.course + '&pitch=10&fov=80';
      const elm = document.createElement("a");
      elm.target = "_blank";
      elm.href = link;
      document.body.appendChild(elm);
      elm.click();
    }
  });

  tmp.push({
    text: KT('device.openExternal'),
    icon: 'fas fa-external-link-alt',
    submenu: shareOpen
  });

  let shares = [];

  if (store.state.server.isPlus && store.getters.advancedPermissions(25)) {
    shares.push({
      text: KT('device.shareLink'),
      icon: 'fas fa-link',
      cb: () => {
        editShareRef.value.newShare(device.id);
      }
    });
  }

  shares.push({
    text: KT('device.shareMaps'),
    icon: 'fas fa-map-pin',
    cb: () => {
      if (navigator.share) {
        navigator.share({
          title: device.name,
          url: 'http://maps.google.com/maps?q=loc:' + position.latitude + "," + position.longitude
        }).then(() => {
          console.log('Thanks for sharing!');
        }).catch(console.error);
      } else {
        const elm = document.createElement("input");
        elm.value = 'http://maps.google.com/maps?q=loc:' + position.latitude + "," + position.longitude;
        document.body.appendChild(elm);
        elm.select();
        document.execCommand("copy");
        document.body.removeChild(elm);
        ElMessage.success('Copiado para área de transferência');
      }
    }
  });

  shares.push({
    text: KT('device.shareStreet'),
    icon: 'fas fa-road',
    cb: () => {
      const link = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + position.latitude + ',' + position.longitude + '&heading=' + position.course + '&pitch=10&fov=80';
      if (navigator.share) {
        navigator.share({
          title: device.name,
          url: link
        }).then(() => {
          console.log('Thanks for sharing!');
        }).catch(console.error);
      } else {
        const elm = document.createElement("input");
        elm.value = link;
        document.body.appendChild(elm);
        elm.select();
        document.execCommand("copy");
        document.body.removeChild(elm);
        ElMessage.success('Copiado para área de transferência');
      }
    }
  });

  tmp.push({
    text: KT('device.share'),
    icon: 'fas fa-share-alt',
    submenu: shares
  });

  addSep = true;

  if (store.state.server.isPlus && store.getters.advancedPermissions(9)) {
    if (addSep) {
      tmp.push({ text: 'separator' });
      addSep = false;
    }
    const isAnchored = store.getters['geofences/isAnchored'](device.id);
    tmp.push({
      text: KT((isAnchored) ? 'actions.anchorDisable' : 'actions.anchorEnable'),
      icon: 'fas fa-anchor',
      cb: () => {
        actAnchor(device.id);
      }
    });
  }

  if (position.attributes.blocked && store.getters.advancedPermissions(11)) {
    if (addSep) {
      tmp.push({ text: 'separator' });
      addSep = false;
    }
    tmp.push({
      disabled: (device.status !== 'online'),
      icon: 'fas fa-unlock',
      text: KT('device.unlock'), cb: () => {
        // Usar SliderConfirmModal para comandos críticos
        openSliderConfirm({
          title: KT('device.unlock') || 'Desbloquear Veículo',
          deviceName: device.name,
          message: KT('device.confirm_unlock', device) || `Deseja desbloquear o veículo "${device.name}"?`,
          warningText: device.status !== 'online'
            ? (KT('device.offline_warning') || 'Atenção: Dispositivo offline. O comando será executado quando ficar online.')
            : '',
          sliderText: 'Deslize para desbloquear',
          actionType: 'success',
          callback: async () => {
            const changeNative = availableSaved.find((a) => a.attributes['tarkan.changeNative'] && a.attributes['tarkan.changeNative'] === 'engineResume');
            if (changeNative) {
              await window.$traccar.sendCommand({ ...changeNative, ...{ deviceId: deviceId } });
            } else {
              await window.$traccar.sendCommand({ deviceId: deviceId, type: "engineResume" });
            }
            ElNotification({
              title: KT('success'),
              message: KT('device.command_sent'),
              type: 'success',
            });
          }
        });
      }
    });
  } else if (store.getters.advancedPermissions(10)) {
    if (addSep) {
      tmp.push({ text: 'separator' });
      addSep = false;
    }
    tmp.push({
      disabled: (device.status !== 'online'),
      icon: 'fas fa-lock',
      text: KT('device.lock'), cb: () => {
        // Usar SliderConfirmModal para comandos críticos
        openSliderConfirm({
          title: KT('device.lock') || 'Bloquear Veículo',
          deviceName: device.name,
          message: KT('device.confirm_lock', device) || `Deseja bloquear o veículo "${device.name}"?`,
          warningText: device.status !== 'online'
            ? (KT('device.offline_warning') || 'Atenção: Dispositivo offline. O comando será executado quando ficar online.')
            : '',
          sliderText: 'Deslize para bloquear',
          actionType: 'danger',
          callback: async () => {
            const changeNative = availableSaved.find((a) => a.attributes['tarkan.changeNative'] && a.attributes['tarkan.changeNative'] === 'engineStop');
            if (changeNative) {
              await window.$traccar.sendCommand({ ...changeNative, ...{ deviceId: deviceId } });
            } else {
              await window.$traccar.sendCommand({ deviceId: deviceId, type: "engineStop" });
            }
            ElNotification({
              title: KT('success'),
              message: KT('device.command_sent'),
              type: 'success',
            });
          }
        });
      }
    });
  }

  if (store.getters.advancedPermissions(12)) {
    if (addSep) {
      tmp.push({ text: 'separator' });
      addSep = false;
    }
    tmp.push({
      text: KT('device.send_command'),
      icon: 'fas fa-terminal',
      submenu: commands
    });
  }

  let attributions = [];
  attributions.push({
    text: KT('geofence.geofences'),
    icon: 'fas fa-map-marker-alt',
    cb: () => {
      linkObjectsRef.value.showObjects({ deviceId: device.id, type: 'geofences' });
    }
  });

  attributions.push({
    text: KT('attribute.computedAttributes'),
    icon: 'fas fa-calculator',
    cb: () => {
      linkObjectsRef.value.showObjects({ deviceId: device.id, type: 'attributes' });
    }
  });

  attributions.push({
    text: KT('driver.drivers'),
    icon: 'fas fa-user',
    cb: () => {
      linkObjectsRef.value.showObjects({ deviceId: device.id, type: 'drivers' });
    }
  });

  attributions.push({
    text: KT('command.savedCommands'),
    icon: 'fas fa-tasks',
    cb: () => {
      linkObjectsRef.value.showObjects({ deviceId: device.id, type: 'commands' });
    }
  });

  attributions.push({
    text: KT('notification.notifications'),
    icon: 'fas fa-bell',
    cb: () => {
      linkObjectsRef.value.showObjects({ deviceId: device.id, type: 'notifications' });
    }
  });

  attributions.push({
    text: KT('maintenance.maintenances'),
    icon: 'fas fa-wrench',
    cb: () => {
      linkObjectsRef.value.showObjects({ deviceId: device.id, type: 'maintence' });
    }
  });

  if (store.getters.advancedPermissions(14)) {
    tmp.push({
      text: KT('device.attributions'),
      icon: 'fas fa-tags',
      submenu: attributions
    });

    tmp.push({
      text: KT('device.edit'),
      icon: 'fas fa-edit',
      cb: () => {
        editDeviceRef.value.editDevice(deviceId);
      }
    });
  }
  if (store.state.server.isPlus && user.administrator) {
    tmp.push({
      text: KT('device.logs'),
      icon: 'fas fa-file-alt',
      cb: () => {
        logObjectsRef.value.showLogs({ deviceId: deviceId });
      }
    });
  }
  contextMenuRef.value.openMenu({ evt: evt.originalEvent || evt, menus: tmp })
};

const contextMenuRef = inject("contextMenu");
const logObjectsRef = inject("log-objects");
const linkObjectsRef = inject("link-objects");
const editSharesRef = inject("edit-shares");
const editShareRef = inject("edit-share");
const editDeviceRef = inject("edit-device");

app.provide('markerClick', markerClick);
app.provide('flyToDevice', flyToDevice)
app.provide('updateRoute', updateRoute)
app.provide('markerContext', markerContext);


const showPercursoLayer = () => {
  showPercurso.value = true;
};

const hidePercursoLayer = () => {
  showPercurso.value = false;
};

const showCalorLayer = () => {
  showMapadeCalor.value = true;

  // Criar camada de mapa de calor se houver pontos de rota
  if (routePoints.value.length > 0 && map.value?.leafletObject) {
    // Preparar dados para o heatmap: [lat, lng, intensidade]
    const heatData = routePoints.value.map(p => {
      // Usar velocidade como intensidade (normalizada)
      const intensity = Math.min(p[3] || 1, 100) / 100;
      return [p[0], p[1], intensity || 0.5];
    });

    // Remover camada existente se houver
    if (heatmapLayer.value) {
      map.value.leafletObject.removeLayer(heatmapLayer.value);
    }

    // Criar nova camada de mapa de calor
    heatmapLayer.value = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.0: 'blue',
        0.3: 'cyan',
        0.5: 'lime',
        0.7: 'yellow',
        1.0: 'red'
      }
    }).addTo(map.value.leafletObject);
  }
};

const hideCalorLayer = () => {
  showMapadeCalor.value = false;

  // Remover camada de mapa de calor
  if (heatmapLayer.value && map.value?.leafletObject) {
    map.value.leafletObject.removeLayer(heatmapLayer.value);
    heatmapLayer.value = null;
  }
};
const showMarkersLayer = () => {
  showRouteMarkers.value = true;
};
const hideMarkersLayerr = () => {
  showRouteMarkers.value = false;
};

const showPontosLayer = () => {
  showPontos.value = true;
};

const hidePontosLayer = () => {
  showPontos.value = false;
};


const showPontosCorrelacaoLayer = () => {
  showPontosCorrelacao.value = true;
};

const hidePontosCorrelacaoLayer = () => {
  showPontosCorrelacao.value = false;
};

const showMapadeCalorCorrelacaoLayer = () => {
  showMapadeCalorCorrelacao.value = true;
};

const hideCalorCorrelacaoLayer = () => {
  showMapadeCalorCorrelacao.value = false;
};


app.provide("showPercursoLayer", showPercursoLayer);
app.provide("hidePercursoLayer", hidePercursoLayer);
app.provide("showCalorLayer", showCalorLayer);
app.provide("hideCalorLayer", hideCalorLayer);
app.provide("showMarkersLayer", showMarkersLayer);
app.provide("hideMarkersLayerr", hideMarkersLayerr);
app.provide("showPontosLayer", showPontosLayer);
app.provide("hidePontosLayer", hidePontosLayer);
app.provide("showPontosCorrelacaoLayer", showPontosCorrelacaoLayer);
app.provide("hidePontosCorrelacaoLayer", hidePontosCorrelacaoLayer);
</script>

<style scoped>
/* ============================================================================ */
/* KORE-MAP ROOT WRAPPER - Isola todos os estilos do componente                */
/* ============================================================================ */
.kore-map-root {
  width: 100%;

  height: 100%;
  position: relative;
}

/* ============================================================================ */
/* MAP CONTAINER                                                                */
/* ============================================================================ */
.kore-map-root .map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.kore-map-root #map-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

/* ============================================================================ */
/* CONTROLES VERTICAIS - Container moderno (topright)                           */
/* ============================================================================ */
.kore-map-root .vertical-controls-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  padding: 2px;
  min-width: 30px;
}

.kore-map-root .vertical-controls-container .el-button {
  background-color: transparent;
  border: none;
  min-width: 26px;
  height: 26px;
  padding: 0;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s ease;
}

.kore-map-root .vertical-controls-container .el-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.kore-map-root .vertical-controls-container .el-button i {
  color: white;
}

.kore-map-root .vertical-controls-container .el-dropdown {
  width: 100%;
}

/* ============================================================================ */
/* STATUS COUNTERS - Filtros de status (topleft)                                */
/* ============================================================================ */
.kore-map-root .status-counters {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  background: rgba(0, 0, 0, 0.55);
  padding: 6px;
  border-radius: 10px;
  
  /* PATCH: Anti-scale/zoom herdado de transforms do painel */
  transform: none !important;
  zoom: 1;
  font-size: 12px;
  line-height: 1.2;
  contain: layout paint;
}

/* Reforçar reset em filhos do contador */
.kore-map-root .status-counters * {
  font-size: inherit;
  line-height: inherit;
  transform: none !important;
}

.kore-map-root .status-counters .counter {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  opacity: 0.9;
  transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  user-select: none;
}

.kore-map-root .status-counters .counter:hover {
  opacity: 1;
  transform: translateY(-1px);
}

.kore-map-root .status-counters .counter.active {
  outline: 2px solid rgba(255, 255, 255, 0.9);
  outline-offset: 1px;
}

.kore-map-root .status-counters .counter.all {
  background: #909399;
}

.kore-map-root .status-counters .counter.online {
  background: #67c23a;
}

.kore-map-root .status-counters .counter.offline {
  background: #f56c6c;
}

.kore-map-root .status-counters .counter.unknown {
  background: #e6a23c;
}

.kore-map-root .status-counters .counter.motion {
  background: #409eff;
}

/* ============================================================================ */
/* PLAYBACK WIDGET MODERNO                                                      */
/* ============================================================================ */
.kore-map-root .modern-playback-widget {
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  min-width: 380px;
}

/* Timeline Section */
.kore-map-root .timeline-section {
  margin-bottom: 12px;
  padding: 0 4px;
}

.kore-map-root .timeline-track {
  position: relative;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  transition: height 0.2s ease;
}

.kore-map-root .timeline-track:hover {
  height: 10px;
}

.kore-map-root .timeline-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
  transition: width 0.1s ease;
}

.kore-map-root .timeline-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: #fff;
  border: 3px solid #3b82f6;
  border-radius: 50%;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kore-map-root .timeline-handle:hover {
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.kore-map-root .timeline-handle:active {
  cursor: grabbing;
}

.kore-map-root .timeline-handle i {
  font-size: 8px;
  color: #3b82f6;
}

/* Playback Controls */
.kore-map-root .modern-playback-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.kore-map-root .secondary-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.kore-map-root .primary-control {
  margin: 0 8px;
}

.kore-map-root .control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.kore-map-root .control-btn.secondary-btn {
  width: 36px;
  height: 36px;
  background: #f3f4f6;
  color: #374151;
  font-size: 13px;
}

.kore-map-root .control-btn.secondary-btn:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.kore-map-root .control-btn.primary-btn {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.kore-map-root .control-btn.primary-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
}

.kore-map-root .control-btn.speed-btn {
  width: 40px;
  height: 36px;
  background: #dbeafe;
  color: #1e40af;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
}

.kore-map-root .control-btn.speed-btn:hover {
  background: #bfdbfe;
}

/* ============================================================================ */
/* PAINEL DE DETALHES DA ROTA - TEMA DARK                                       */
/* ============================================================================ */
.kore-map-root .route-details-panel {
  background: rgba(30, 30, 35, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  width: 280px;
  max-height: 400px;
  overflow: hidden;
}

.kore-map-root .route-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
}

.kore-map-root .route-details-header i {
  margin-right: 8px;
}

.kore-map-root .route-details-close {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.kore-map-root .route-details-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.kore-map-root .route-details-content {
  padding: 12px;
  max-height: 340px;
  overflow-y: auto;
  background: rgba(30, 30, 35, 0.95);
}

.kore-map-root .route-detail-item {
  margin-bottom: 12px;
}

.kore-map-root .route-detail-item.compact {
  margin-bottom: 8px;
}

.kore-map-root .detail-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.kore-map-root .detail-label i {
  width: 14px;
  text-align: center;
  color: #60a5fa;
}

.kore-map-root .detail-value {
  font-size: 13px;
  font-weight: 500;
  color: #ffffff;
}

.kore-map-root .detail-value.small {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

/* Grid de Atributos */
.kore-map-root .main-attributes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.kore-map-root .main-attribute-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.kore-map-root .attribute-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.kore-map-root .attribute-icon.active {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.kore-map-root .attribute-icon.danger {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.kore-map-root .attribute-info {
  text-align: center;
}

.kore-map-root .attribute-value {
  font-size: 10px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.kore-map-root .route-no-point {
  text-align: center;
  color: #9ca3af;
  padding: 24px;
  font-size: 13px;
}

/* Status Icons Row */
.kore-map-root .status-icons-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 10px 0;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.kore-map-root .status-icon-item {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  transition: all 0.2s ease;
}

.kore-map-root .status-icon-item.active {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.kore-map-root .status-icon-item.inactive {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.kore-map-root .status-icon-item.warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.kore-map-root .status-icon-item.danger {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Detail Info Grid */
.kore-map-root .detail-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}

.kore-map-root .detail-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.kore-map-root .detail-info-item .detail-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: #fff;
  border-radius: 4px;
  font-size: 11px;
}

.kore-map-root .detail-info-item .detail-text {
  flex: 1;
  min-width: 0;
}

.kore-map-root .detail-value-main {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Detail Address */
.kore-map-root .detail-address {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  margin-bottom: 8px;
}

.kore-map-root .detail-address .detail-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0ea5e9;
  color: #fff;
  border-radius: 4px;
  font-size: 10px;
  flex-shrink: 0;
  margin-top: 2px;
}

.kore-map-root .detail-address-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.4;
  word-break: break-word;
}

/* Detail Coords */
.kore-map-root .detail-coords {
  text-align: center;
  padding: 4px 0;
  margin-bottom: 8px;
}

.kore-map-root .coords-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-family: monospace;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

/* Detail Actions */
.kore-map-root .detail-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.kore-map-root .detail-action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.kore-map-root .detail-action-btn:hover {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

/* ============================================================================ */
/* MINI HUD DE ROTA - Painel compacto durante playback                         */
/* ============================================================================ */
.kore-map-root .route-mini-hud {
  background: rgba(17, 24, 39, 0.92);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 10px 12px;
  min-width: 260px;
  max-width: 320px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 8px;
  /* Espaço acima do controle de zoom */
}

.kore-map-root .mini-hud-status-row {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  justify-content: center;
}

.kore-map-root .mini-status-icon {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  background: rgba(107, 114, 128, 0.3);
  color: #9ca3af;
  transition: all 0.2s ease;
}

.kore-map-root .mini-status-icon.active {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.kore-map-root .mini-status-icon.inactive {
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
}

.kore-map-root .mini-status-icon.warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.kore-map-root .mini-status-icon.danger {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.kore-map-root .mini-hud-info-row {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.kore-map-root .mini-info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #e5e7eb;
  white-space: nowrap;
}

.kore-map-root .mini-info-item i {
  color: #9ca3af;
  font-size: 10px;
}

.kore-map-root .mini-hud-address {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 10px;
  color: #9ca3af;
  margin-bottom: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  line-height: 1.3;
}

.kore-map-root .mini-hud-address i {
  color: #3b82f6;
  margin-top: 1px;
  flex-shrink: 0;
}

.kore-map-root .mini-hud-address span {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.kore-map-root .mini-hud-actions {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.kore-map-root .mini-action-btn {
  width: 32px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.08);
  color: #d1d5db;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.kore-map-root .mini-action-btn:hover {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

/* ============================================================================ */
/* TOOLTIPS RICOS                                                               */
/* ============================================================================ */
/* Movido para bloco global - tooltips renderizados via teleport */

/* ============================================================================ */
/* CONTROLES DE ZOOM PERSONALIZADOS                                             */
/* ============================================================================ */
.kore-map-root .leaflet-control-zoom {
  border: none !important;
  border-radius: 8px !important;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15) !important;
}

.kore-map-root .leaflet-control-zoom a {
  width: 34px !important;
  height: 34px !important;
  line-height: 34px !important;
  font-size: 18px !important;
  font-weight: 400 !important;
  color: #374151 !important;
  background: rgba(255, 255, 255, 0.95) !important;
  border: none !important;
  transition: all 0.2s ease !important;
}

.kore-map-root .leaflet-control-zoom a:hover {
  background: #f3f4f6 !important;
  color: #1f2937 !important;
}

.kore-map-root .leaflet-control-zoom-in {
  border-bottom: 1px solid #e5e7eb !important;
}

/* ============================================================================ */
/* RESPONSIVIDADE MOBILE - Controles e painéis                                  */
/* ============================================================================ */
@media (orientation: portrait) and (max-width: 768px) {
  .kore-map-root .vertical-controls-container {
    padding: 1px;
    min-width: 26px;
    border-radius: 8px;
    gap: 0;
  }
  
  .kore-map-root .vertical-controls-container .el-button {
    min-width: 22px;
    height: 22px;
    font-size: 10px;
    margin-bottom: 0;
  }
  
  .kore-map-root .status-counters {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .kore-map-root .status-counters .counter {
    width: 28px;
    height: 24px;
    font-size: 11px;
  }
}

@media (max-width: 768px) {
  .kore-map-root .modern-playback-widget {
    min-width: 320px;
    padding: 10px;
  }

  .kore-map-root .route-details-panel {
    width: 260px;
  }
}

@media (max-width: 480px) {
  .kore-map-root .modern-playback-widget {
    min-width: 280px;
  }

  .kore-map-root .control-btn.primary-btn {
    width: 42px;
    height: 42px;
  }

  .kore-map-root .control-btn.secondary-btn {
    width: 32px;
    height: 32px;
  }
}

/* ============================================================================ */
/* PAINEL FLUTUANTE DO MOTORISTA                                                */
/* ============================================================================ */
.kore-map-root .floating-follow-panel {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  right: 20px;
  width: 320px;
  background: rgba(26, 26, 46, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  z-index: 10000;
  color: white;
  font-family: 'Roboto', sans-serif;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.kore-map-root .floating-follow-panel .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.3), rgba(37, 99, 235, 0.3));
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.kore-map-root .floating-follow-panel .panel-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: white;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kore-map-root .floating-follow-panel .close-panel-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
}

.kore-map-root .floating-follow-panel .close-panel-btn:hover {
  background: rgba(245, 108, 108, 0.3);
}

.kore-map-root .floating-follow-panel .panel-content {
  padding: 16px;
}

/* Seção do Motorista */
.kore-map-root .driver-section-enhanced {
  margin-bottom: 16px;
}

.kore-map-root .driver-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.kore-map-root .driver-card-header i {
  color: #409eff;
}

.kore-map-root .driver-card-header .section-title {
  font-size: 13px;
  font-weight: 600;
  color: #c0c4cc;
}

.kore-map-root .driver-card-content {
  display: flex;
  gap: 12px;
}

.kore-map-root .driver-photo-enhanced {
  position: relative;
  flex-shrink: 0;
}

.kore-map-root .driver-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(64, 158, 255, 0.5);
}

.kore-map-root .photo-overlay {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #f56c6c;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kore-map-root .photo-overlay i {
  font-size: 10px;
  color: white;
}

.kore-map-root .driver-details {
  flex: 1;
  min-width: 0;
}

.kore-map-root .driver-name-enhanced strong {
  font-size: 14px;
  color: white;
  display: block;
  margin-bottom: 8px;
}

.kore-map-root .driver-credentials {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.kore-map-root .credential-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #909399;
}

.kore-map-root .credential-item i {
  width: 14px;
  color: #606266;
}

.kore-map-root .credential-item .label {
  color: #909399;
}

.kore-map-root .credential-item .value {
  color: #c0c4cc;
  font-family: 'Courier New', monospace;
}

.kore-map-root .expiry-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #909399;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.kore-map-root .expiry-item.expired {
  background: rgba(245, 108, 108, 0.15);
  border: 1px solid rgba(245, 108, 108, 0.3);
}

.kore-map-root .expiry-item.expiring {
  background: rgba(230, 162, 60, 0.15);
  border: 1px solid rgba(230, 162, 60, 0.3);
}

.kore-map-root .expiry-warning {
  font-size: 10px;
  font-weight: 600;
  color: #f56c6c;
  display: flex;
  align-items: center;
  gap: 4px;
}

.kore-map-root .expiry-warning.warning {
  color: #e6a23c;
}

/* Seção do Veículo */
.kore-map-root .vehicle-image-section {
  margin-bottom: 16px;
}

.kore-map-root .vehicle-photo-large {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.kore-map-root .vehicle-photo-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.kore-map-root .vehicle-section {
  margin-bottom: 16px;
}

.kore-map-root .vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kore-map-root .info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #c0c4cc;
}

.kore-map-root .info-row i {
  width: 18px;
  color: #606266;
}

.kore-map-root .info-row .value {
  color: white;
}

.kore-map-root .status-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.kore-map-root .status-moving {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.kore-map-root .status-online {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.kore-map-root .status-offline {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.kore-map-root .status-unknown {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.kore-map-root .panel-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* ============================================================================ */
/* CONTROLE DE BUSCA NO MAPA (leaflet-search)                                   */
/* ============================================================================ */
/* Movido para bloco global - controle renderizado via Leaflet */

/* ============================================================================ */
/* LEGACY - Mantido para compatibilidade (pode ser removido após testes)        */
/* ============================================================================ */
.kore-map-root .search-container {
  display: flex;
  align-items: center;
}

.kore-map-root .search-container .el-input__inner {
  font-size: 18px;
  font-weight: bold;
}

.kore-map-root .autocomplete-results .el-autocomplete-suggestion__wrap {
  font-size: 22px;
  font-weight: bold;
}
</style>

<!-- =========================================================================== -->
<!-- CSS GLOBAL - Apenas para poppers do Element Plus (teleport/portal)         -->
<!-- =========================================================================== -->
<style>
/* ============================================================================ */
/* DROPDOWN KORE-MAP - Estilo isolado para poppers do Element Plus             */
/* Classe: .kore-map-popper aplicada via popper-class nos el-dropdown          */
/* ============================================================================ */
.el-dropdown-menu.kore-map-popper {
  background: rgba(228, 226, 226, 0.923);
  border: 1px solid #eeeeee;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px;
  min-width: 200px;
  max-width: 220px;
  max-height: 75vh;
  overflow-y: auto;
}

.kore-map-popper .section-title {
  padding: 6px 10px;
  font-weight: 600;
  font-size: 10px;
  color: #000000;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin: 2px 4px 6px 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.kore-map-popper .el-dropdown-menu__item {
  padding: 0;
  line-height: normal;
  height: auto;
  background: transparent;
  border-bottom: 1px solid rgba(192, 192, 192, 0.2);
  color: #000000;
}

.kore-map-popper .el-dropdown-menu__item:hover {
  background: #f5f5f5;
  color: #000000;
}

.kore-map-popper .el-dropdown-menu__item:last-child {
  border-bottom: none;
}

/* Todos os textos em preto */
.kore-map-popper,
.kore-map-popper span,
.kore-map-popper div {
  color: #000000;
}

/* Todos os ícones em azul (cor principal) */
.kore-map-popper i,
.kore-map-popper .fas,
.kore-map-popper .far,
.kore-map-popper .fab {
  color: var(--el-color-primary);
  margin-right: 8px;
  font-size: 14px;
  width: 16px;
  text-align: center;
}

/* Switches padronizados */
.kore-map-popper .el-switch {
  height: 15px;
  line-height: 15px;
  min-width: 30px;
  width: 30px;
  --el-switch-on-color: var(--el-color-primary);
  --el-switch-off-color: #dcdfe6;
}

.kore-map-popper .el-switch__core {
  height: 15px;
  width: 30px;
  border-radius: 7.5px;
  background-color: #dcdfe6;
  border: 1px solid #dcdfe6;
}

.kore-map-popper .el-switch.is-checked .el-switch__core {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.kore-map-popper .el-switch__action {
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #fff;
  top: 1.5px;
  left: 1.5px;
}

.kore-map-popper .el-switch.is-checked .el-switch__action {
  left: calc(100% - 13.5px);
}

/* Input de busca */
.kore-map-popper .el-input__wrapper {
  background-color: white;
  border: 1px solid var(--el-color-primary);
  border-radius: 4px;
}

.kore-map-popper .el-input__inner {
  color: #000000;
}

.kore-map-popper .el-input__inner::placeholder {
  color: var(--el-color-primary);
  opacity: 0.7;
}

/* Radio buttons */
.kore-map-popper .el-radio__label {
  color: #000000;
  font-size: 11px;
  font-weight: 500;
}

.kore-map-popper .el-radio__input.is-checked .el-radio__inner {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.kore-map-popper .el-radio__inner {
  border-color: rgba(0, 0, 0, 0.4);
}

/* Links */
.kore-map-popper a {
  color: var(--el-color-primary);
  text-decoration: none;
}

.kore-map-popper a:hover {
  color: var(--el-color-primary-light-3);
}

/* Responsivo mobile para dropdown */
@media (orientation: portrait) and (max-width: 768px) {
  .el-dropdown-menu.kore-map-popper {
    min-width: 160px;
    max-width: 180px;
    padding: 3px;
  }
  
  .kore-map-popper .el-dropdown-menu__item {
    padding: 0;
    font-size: 10px;
  }
  
  .kore-map-popper .section-title {
    padding: 4px 8px;
    font-size: 9px;
    margin: 1px 2px 4px 2px;
  }
}
</style>
