<template>
  <div class="kore-map-root">
    <div class="map-wrapper">
      <div ref="mapContainer" id="map-container">
        <LMap id="LMap" :options="{ preferCanvas: true, zoomControl: false }" :use-global-leaflet="true" ref="map"
          :zoom="zoomForce" :min-zoom="3" :max-zoom="21" :zoom-animation="true" :fade-animation="true"
          :marker-zoom-animation="false" @ready="mapReady($event)" @click="mapClick" @mousemove="mapMove"
          :center="center" @update:zoom="zoomUpdated($event)" style="width: 100%;height: 100%;">
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
                v-if="((store.state.server.serverInfo?.attributes?.['tarkan.enableAdvancedPerms'] && store.getters.advancedPermissions(24))) || (!store.state.server.serverInfo?.attributes?.['tarkan.enableAdvancedPerms'] && !store.state.auth.attributes?.['isShared'] && !store.getters['isReadonly'])"
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
                      <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showCluster') }}</span>
                      <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                        :model-value="store.getters['mapPref']('clustered')"
                        @change="(val) => store.dispatch('setMapPref', ['clustered', val])"></el-switch>
                    </div>

                    <!-- Mostrar Grupos: Exibe agrupamento visual por grupos de dispositivos -->
                    <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                      <i class="fas fa-layer-group" style="width: 20px; font-size: 11px;"></i>
                      <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showGroups') }}</span>
                      <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                        :model-value="store.getters['mapPref']('groups')"
                        @change="(val) => store.dispatch('setMapPref', ['groups', val])"></el-switch>
                    </div>

                    <!-- Mostrar Geocercas: Exibe/oculta as áreas delimitadas (cercas virtuais) -->
                    <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                      <i class="fas fa-draw-polygon" style="width: 20px; font-size: 11px;"></i>
                      <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showGeofences')
                        }}</span>
                      <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                        v-model="showGeofences"></el-switch>
                    </div>

                    <!-- Mostrar Nomes das Geocercas: Exibe nomes das geocercas no mapa (só aparece se geocercas ativas) -->
                    <div v-if="showGeofences"
                      style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                      <i class="fas fa-tag" style="width: 20px; font-size: 11px; margin-left: 20px;"></i>
                      <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showGeofenceNames')
                        }}</span>
                      <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                        :model-value="store.getters['mapPref']('geofenceNames')"
                        @change="(val) => store.dispatch('setMapPref', ['geofenceNames', val])"></el-switch>
                    </div>

                    <!-- Mostrar Nomes: Exibe o nome do veículo no mapa -->
                    <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                      <i class="fas fa-tag" style="width: 20px; font-size: 11px;"></i>
                      <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showNames') }}</span>
                      <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                        :model-value="store.getters['mapPref']('name')"
                        @change="(val) => store.dispatch('setMapPref', ['name', val])"></el-switch>
                    </div>

                    <!-- Mostrar Placas: Exibe a placa do veículo no mapa -->
                    <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                      <i class="fas fa-id-card" style="width: 20px; font-size: 11px;"></i>
                      <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showPlates') }}</span>
                      <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                        :model-value="store.getters['mapPref']('plate')"
                        @change="(val) => store.dispatch('setMapPref', ['plate', val])"></el-switch>
                    </div>

                    <!-- Mostrar Status: Exibe indicador de status (online/offline) no ícone -->
                    <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                      <i class="fas fa-info-circle" style="width: 20px; font-size: 11px;"></i>
                      <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showStatus') }}</span>
                      <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                        :model-value="store.getters['mapPref']('status')"
                        @change="(val) => store.dispatch('setMapPref', ['status', val])"></el-switch>
                    </div>

                    <!-- Mostrar Precisão GPS: Exibe círculo de precisão do GPS ao redor do veículo -->
                    <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                      <i class="fas fa-crosshairs" style="width: 20px; font-size: 11px;"></i>
                      <span style="margin-left: 12px; font-size: 11px; flex-grow: 1;">{{ KT('map.showPrecision')
                        }}</span>
                      <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                        :model-value="store.getters['mapPref']('precision')"
                        @change="(val) => store.dispatch('setMapPref', ['precision', val])"></el-switch>
                    </div>

                    <!-- Seção Dispositivos -->
                    <div class="section-title"
                      style="display: flex; justify-content: space-between; align-items: center;">
                      <span><i class="fas fa-car" style="margin-right: 6px;"></i>{{ KT('device.devices') ||
                        'Dispositivos'
                        }}</span>
                      <div style="font-size: 9px; white-space: nowrap;">
                        <a @click.prevent="eyeAll(true)"
                          style="color: var(--el-color-primary);text-decoration: none;margin-right: 4px;">{{ KT('all')
                            ||
                          'Todos' }}</a>
                        <span style="margin: 0 2px;">|</span>
                        <a @click.prevent="eyeAll(false)"
                          style="color: var(--el-color-primary);text-decoration: none;margin-left: 4px;">{{ KT('none')
                            ||
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
                          <el-switch :key="'chk' + t.key" style="min-width: 36px; justify-content: flex-end;"
                            size="small" :model-value="store.getters['devices/isHiddenFilter'](t.key)"
                            disabled></el-switch>
                        </div>
                      </el-dropdown-item>
                    </div>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>

              <!-- Dropdown de Camadas -->
              <el-dropdown size="small" trigger="click" placement="left-start" popper-class="kore-map-popper"
                style="margin-bottom: 1px; display: block;">
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
                <div class="counter online"
                  :class="{ active: store.state.devices.applyFilters.statusFilter === 'online' }"
                  @click="store.dispatch('devices/setStatusFilter', 'online')">
                  {{ store.getters['devices/deviceCount'].online }}
                </div>
              </el-tooltip>
              <el-tooltip placement="right-start" :content="KT('offline') || 'Offline'">
                <div class="counter offline"
                  :class="{ active: store.state.devices.applyFilters.statusFilter === 'offline' }"
                  @click="store.dispatch('devices/setStatusFilter', 'offline')">
                  {{ store.getters['devices/deviceCount'].offline }}
                </div>
              </el-tooltip>
              <el-tooltip placement="right-start" :content="KT('unknown') || 'Desconhecido'">
                <div class="counter unknown"
                  :class="{ active: store.state.devices.applyFilters.statusFilter === 'unknown' }"
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
                :lat-lngs="store.getters['geofences/getLatLngs']" :fill-opacity="MAP_CONSTANTS.FILL_OPACITY"
                :fill="true" :fill-color="MAP_CONSTANTS.GEOFENCE_EDIT_COLOR" :color="MAP_CONSTANTS.GEOFENCE_EDIT_COLOR">
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
              :color="routeColor">
            </l-polyline>
            <kore-canva-marker :map="map" :zoom="zoom" @click="markerClick" @mouseover="markerOver"
              @mouseout="markerOut" @contextmenu="markerContext">
            </kore-canva-marker>
          </l-layer-group>

          <!-- Camada de Rotas -->
          <l-layer-group v-if="fullRoutePoints.length > 0 && store.state.devices.showRoutes" layer-type="overlay"
            name="Rota" :attribution="'Rota'">

            <!-- POLYLINE 1: Rota completa (SOMENTE visível quando NÃO está em play) -->
            <l-polyline v-if="fullRoutePoints.length && !isPlayingRoute" :lat-lngs="cptPoints" :color="routeColor"
              :weight="4" :opacity="0.55">
            </l-polyline>

            <!-- POLYLINE 2: Rota do play (progressiva, SOMENTE durante play) -->
            <l-polyline v-if="playRoutePoints.length && isPlayingRoute" :lat-lngs="playRoutePoints" :color="routeColor"
              :weight="5" :opacity="0.95">
            </l-polyline>

            <!-- MARKER DO DEVICE: Agora controlado imperativamente via updatePlayVehicleMarker -->
            <!-- Removido l-marker declarativo para usar L.marker com setLatLng (performance) -->

            <!-- Markers (toggle) -->
            <kore-canva-point v-if="showRouteMarkers" :points="markerPoints" @click="openMarkInfo($event)">
            </kore-canva-point>

            <!-- Markers de início/fim (sempre visíveis se showRoutePoints) -->
            <template v-if="showRoutePoints">
              <template v-for="(p, k) in fullRoutePoints" :key="'mkrs-'+k">
                <kore-marker v-if="k === 0 || k === fullRoutePoints.length - 1"
                  :name="(k === 0) ? 'start' : (k === fullRoutePoints.length - 1) ? 'end' : 'point'" :position="p"
                  :type="(k === 0) ? 'start' : (k === fullRoutePoints.length - 1) ? 'end' : 'point'"
                  @click="openMarkInfo($event)">
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
import { devLog, devWarn } from '@/utils/devLog';
import { startMark, endMark } from '@/utils/devPerf';
import {
  formatCPF,
  normalizeCourse,
  getCardinalDirection,
  formatDateTime,
  getSignalClass
} from '../map/mapUtils';
import { useRoutePlayback, TIMELINE_WIDTH } from '../map/useRoutePlayback.js';
import { useFollowDevice } from '../composables/useFollowDevice.js';
import { useMapInteraction } from '../composables/useMapInteraction.js';
// HARDENING: Guards centralizados para validação robusta (imports parciais temporários)
import {
  extractLatLng,
  clampIndex,
  safeMapOperation
} from '../map/mapGuards';

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
// REMOVIDO: import ResizeObserver (agora no composable useMapInteraction)
import KoreMarker from "./kore-marker";
import KoreFence from "./kore-fence";
import KoreCanvaMarker from "../test/CanvaMarker";
import KoreCanvaPoint from "../test/CanvaPoints"
import { computed, watch, ref, onMounted, onUnmounted, inject, getCurrentInstance } from "vue";  // Adicionado onUnmounted
import { useStore } from 'vuex';
import router from "../../routes";
import KT from "../func/kt";
import actAnchor from "../func/actAnchor";
import { useMarkers } from '../composables/useMarkers';
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

// ============================================================================
// FOLLOW DEVICE COMPOSABLE
// ============================================================================
const followDevice = useFollowDevice({
  getDevice: (id) => store.getters['devices/getDevice'](id),
  getPosition: (id) => store.getters['devices/getPosition'](id),
  getFollowingId: () => store.state.devices.isFollowingId,
  showTooltip: (html, position) => {
    if (window.$showTip) {
      window.$showTip(position, html, true);
    }
  },
  hideTooltip: () => {
    if (window.$hideTip) {
      window.$hideTip();
    }
  },
  getMarkerPosition: (deviceId) => {
    // Buscar posição do marker no DOM (via data-device-id)
    const markerEl = document.querySelector(`[data-device-id="${deviceId}"]`);
    if (!markerEl) return null;
    const rect = markerEl.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  },
  updateInterval: 1000,
  cacheTTL: 30000,
  cacheMaxSize: 500
});

// Aliases para compatibilidade
// eslint-disable-next-line no-unused-vars
const tooltipManuallyHidden = followDevice.tooltipManuallyHidden;
const showFloatingPanel = followDevice.showFloatingPanel;
const floatingPanelDevice = followDevice.floatingPanelDevice;

// ============================================================================
// MAP INTERACTION COMPOSABLE
// ============================================================================
const mapInteraction = useMapInteraction({
  getMapObject: () => map.value,
  getMapContainer: () => mapContainer.value,
  onMapClick: (e) => {
    // Lógica de negócio: edição de geofences
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
  },
  onMapMove: (e) => {
    // Lógica de negócio: resize de círculo durante edição
    if (e.latlng &&
      store.state.geofences.mapPointEditing === 2 &&
      store.state.geofences.mapPointEditingType === 'CIRCLE' &&
      store.state.geofences.mapPointEditingParams.length === 3) {
      store.dispatch(
        "geofences/setCircleRadius",
        L.latLng(store.getters["geofences/getCirclePosition"]).distanceTo(e.latlng)
      );
    }
  },
  onMapInvalidate: () => {
    // Custom handler se necessário
    mapInteraction.invalidateSize();
  }
});

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
  devLog('[SliderConfirm] Slider confirmed');
  showSliderConfirm.value = false;
};

const onSliderCancelled = () => {
  devLog('[SliderConfirm] Slider cancelled');
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

// REMOVIDO: showFloatingPanel, floatingPanelDevice (agora no composable useFollowDevice)
// Aliases criados na linha ~863 para compatibilidade

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

// formatCPF movido para mapUtils.ts (FASE B1)

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
  devLog('[kore-map] openMarkInfo', e);
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

// ⚡ OPT-6: Shallow watch suficiente (detecta mudança de referência)
watch(mapLabelPrefs, (newPrefs) => {
  updateVisibleLabels(newPrefs);
}, { deep: true })

// REMOVIDO: Watchers toggleCalor, togglePontos, togglePontosCorrelacao, showCalorCorrelacao
// Esses controlavam iframes legados que foram removidos (COMMIT 1)

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

  // Forçar recalcular tamanho (via composable)
  mapInteraction.invalidateSize();

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

// REMOVIDO simplifyRoute e routeForPolyline - não são mais usados
// cptPoints agora usa fullRoutePoints diretamente (já normalizado)

devLog('[kore-map.vue] 🔵 Criando ROUTE LAYERS refs...');

// ============================================================================
// ROUTE LAYERS - Camadas separadas para evitar sobreposição
// ============================================================================
const fullRoutePoints = ref([]);     // Rota completa SEMPRE visível
const playRoutePoints = ref([]);     // Rota progressiva do play (por cima)
const markerPoints = ref([]);        // Markers (toggle)
const showRouteMarkers = ref(false); // Toggle "Mostrar Marcadores"
const showHeat = ref(false);         // Toggle "Mapa de Calor"
// FASE D1: REMOVIDO lastShowMarkersBeforeHeat (LayerManager stub)
// FASE D1: heatLayer agora gerenciado internamente pelo layerManager

// ============================================================================
// PLAY VEHICLE MARKER - Marcador imperativo para performance (setLatLng)
// ============================================================================
// eslint-disable-next-line no-unused-vars
const playVehicleMarker = ref(null);  // LEGADO: mantido por compatibilidade (ref será populado)
const followPlay = ref(true);         // Follow mode: mapa acompanha o veículo durante play
let playTickCounter = 0;              // Contador de ticks para otimizar panTo (a cada N ticks)

// FASE D1: COURSE_CHANGE_THRESHOLD (3°) movido para MapLayerManager (interno)
const FOLLOW_PAN_INTERVAL = 5;     // a cada N ticks faz panTo (evita animação contínua)

// FASE 13.4.1: Follow play inteligente (anti-jitter)
const SAFE_VIEWPORT_PADDING = 0.20;  // 20% de padding - marker pode sair dessa área antes de pan
let lastPanTime = 0;                  // Timestamp do último pan (throttle)
const PAN_THROTTLE_MS = 200;          // Mínimo de 200ms entre pans

// FASE 13.4.2: User override - suspender follow quando usuário interage
let followPlaySuspendedUntil = 0;    // Timestamp até quando suspender follow
const USER_OVERRIDE_DURATION = 5000;  // 5 segundos de suspensão ao interagir

// FASE 13.4.3: Preview marker efêmero para feedback visual
// eslint-disable-next-line no-unused-vars
let previewMarker = null;              // CircleMarker temporário ao clicar em ponto

// ============================================================================
// COR DA ROTA CONFIGURÁVEL - COMMIT 3
// ============================================================================
const ROUTE_COLOR_OPTIONS = [
  { value: '#05a7e3', label: 'Azul Padrão' },
  { value: '#FF5733', label: 'Laranja' },
  { value: '#28a745', label: 'Verde' },
  { value: '#dc3545', label: 'Vermelho' },
  { value: '#6f42c1', label: 'Roxo' },
  { value: '#fd7e14', label: 'Amarelo' },
  { value: '#20c997', label: 'Turquesa' },
  { value: '#e83e8c', label: 'Rosa' },
];

// Lê cor salva do localStorage, ou usa padrão
const savedRouteColor = localStorage.getItem('kore-route-color') || '#05a7e3';
const routeColor = ref(savedRouteColor);

// Função para mudar cor da rota
const setRouteColor = (color) => {
  routeColor.value = color;
  localStorage.setItem('kore-route-color', color);
  devLog('[kore-map] 🎨 Cor da rota alterada para:', color);
};

devLog('[kore-map.vue] ✅ ROUTE LAYERS refs criados');

// Ref legado mantido apenas para compatibilidade com componentes externos
const showRoutePoints = ref(true);   // Mantido para não quebrar código existente
// REMOVIDO: showMapadeCalor, showPercurso, showPontos, showPontosCorrelacao, showMapadeCalorCorrelacao
// Esses controlavam iframes legados removidos no COMMIT 1

// ============================================================================
// PLAYBACK STATE - Controle de reprodução de rotas (usando useRoutePlayback)
// FASE C1: Totalmente migrado para composable puro (FASE C1 COMPLETA)
// ============================================================================

// Refs locais para compatibilidade com template e código existente
const isPlayingRoute = ref(false); // COMMIT 1: Controla visibilidade da rota durante play
const currentRoutePoint = ref(null); // Ponto atual da rota para exibir detalhes
const isDragging = ref(false); // Se está arrastando a timeline
const showDetailsPanel = ref(false); // Se mostra o painel de detalhes

/**
 * Callback executado a cada tick do playback
 * Atualiza marker, rota progressiva e follow pan
 */
const handlePlaybackTick = (index) => {
  startMark('playbackTick');
  
  if (routePoints.value.length === 0) {
    endMark('playbackTick');
    return;
  }

  // Atualizar ponto atual
  currentRoutePoint.value = routePoints.value[index];

  // Atualiza o ponto na store para sincronizar com a lista do histórico
  store.commit("devices/setRoutePlayPoint", index);

  // Adiciona ponto à camada de play progressiva (NOVO)
  if (currentRoutePoint.value) {
    const lat = currentRoutePoint.value[0] || currentRoutePoint.value.latitude;
    const lng = currentRoutePoint.value[1] || currentRoutePoint.value.longitude;
    const course = currentRoutePoint.value[3] || currentRoutePoint.value.course || 0;

    // FASE 13.4.4: Validação defensiva de coordenadas
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      // 🔧 DEBUG: Log do tick (DEV only)
      if (process.env.NODE_ENV === 'development') {
        devLog('[PLAY] tick idx:', index, 'lat:', lat, 'lng:', lng, 'course:', course);
      }
      pushPlayPoint([lat, lng]);
      // 🚗 Atualiza marcador do veículo (imperativo, usa setLatLng)
      updatePlayVehicleMarker(lat, lng, course);

      // 📍 FASE 13.4.1: Follow Mode com smartPan (anti-jitter + throttle)
      playTickCounter++;
      if (followPlay.value && playTickCounter % FOLLOW_PAN_INTERVAL === 0) {
        smartPan(lat, lng);
      }
    }
  }

  // Move o marcador do veículo no mapa (ícone do device no CanvaMarker)
  if (currentRoutePoint.value) {
    const point = currentRoutePoint.value;
    const lat = point[0] || point.latitude;
    const lng = point[1] || point.longitude;
    const course = point[3] || point.course || 0;

    // FASE 13.4.4: Validação defensiva
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      // ⚡ OPT-3: Cache de device (só busca se ID mudou)
      const deviceId = parseInt(store.state.devices.applyFilters.showOnlyId);
      if (deviceId !== _cachedDeviceId) {
        _cachedDevice = store.getters['devices/getDevice'](deviceId);
        _cachedDeviceId = deviceId;
      }

      if (_cachedDevice && _cachedDevice.icon) {
        // Suporta tanto array (CanvaMarker) quanto objeto único
        const marker = Array.isArray(_cachedDevice.icon) ? _cachedDevice.icon[0] : _cachedDevice.icon;

        if (marker && typeof marker.moveTo === 'function') {
          // Move o marcador com animação suave
          const animationDuration = 200 / playback.speed.value;
          marker.moveTo(L.latLng(lat, lng), animationDuration);

          // FASE 13.4.4: Só atualiza rotação se marker.options.img existir
          if (marker.options && marker.options.img) {
            marker.options.img.rotate = normalizeCourse(course);
          }
        }
      }
    }
  }
  endMark('playbackTick');
};

/**
 * Callback executado quando estado do playback muda
 * Sincroniza refs locais com estado do composable
 */
const handleStateChange = (state) => {
  // Sincronizar estado de playing com visibilidade da rota
  if (state.isPlaying && !isPlayingRoute.value) {
    isPlayingRoute.value = true;
    resetPlay(); // Limpa rota progressiva ao iniciar
  }
  
  if (!state.isPlaying && !state.isPaused && isPlayingRoute.value) {
    // Stop: restaura rota completa
    isPlayingRoute.value = false;
  }
};

/**
 * Callback executado quando playback completa
 */
const handlePlaybackComplete = () => {
  devLog('[PLAY] Playback completado');
};

// Inicializar playback composable (será configurado após carregar rota)
let playback = null;

/**
 * Inicializa o playback com os callbacks
 * Chamado ao carregar rota
 */
// eslint-disable-next-line no-unused-vars
const initializePlayback = (totalPoints) => {
  playback = useRoutePlayback({
    totalPoints,
    initialSpeed: 1,
    callbacks: {
      onTick: handlePlaybackTick,
      onStateChange: handleStateChange,
      onComplete: handlePlaybackComplete
    }
  });
  
  devLog('[PLAYBACK] Inicializado com', totalPoints, 'pontos');
};

// Getters para acessar estado do playback (compatibilidade)
const routePlayState = computed(() => playback?.isPlaying.value || false);
// eslint-disable-next-line no-unused-vars
const routePlayIndex = computed(() => playback?.currentIndex.value || 0);
const routePlayPos = computed(() => playback?.timelinePosition.value || 0);
const playbackSpeed = computed(() => playback?.speed.value || 1);

// ============================================================================
// PLAYBACK DEVICE MARKER - Marker animado seguindo o play
// ============================================================================
// ⚡ OPT-1: Cache para evitar recriação de objeto
let _cachedMarkerPos = null;
let _cachedPointsLength = 0;

// eslint-disable-next-line no-unused-vars
const playDeviceMarkerPos = computed(() => {
  if (!isPlayingRoute.value || !playRoutePoints.value?.length) return null;
  
  // Cache hit: mesmo array, retornar objeto cacheado
  if (_cachedPointsLength === playRoutePoints.value.length && _cachedMarkerPos) {
    return _cachedMarkerPos;
  }
  
  const p = playRoutePoints.value[playRoutePoints.value.length - 1];
  if (!p) return null;
  // Suporta [lat, lng] ou {latitude, longitude}
  const lat = p[0] ?? p.latitude ?? p.lat;
  const lng = p[1] ?? p.longitude ?? p.lng;
  if (lat == null || lng == null) return null;
  
  // Cache miss: criar e cachear
  _cachedMarkerPos = { lat, lng };
  _cachedPointsLength = playRoutePoints.value.length;
  return _cachedMarkerPos;
});

// NOTA: playDeviceMarkerCourse removido - agora usa getPlayVehicleIcon() diretamente

// 🔧 DEBUG: Log quando playRoutePoints muda (DEV only)
// ⚡ OPT-5: Debounce para evitar spam no console
let _playPointsLogTimer = null;

watch(() => playRoutePoints.value.length, (len) => {
  if (process.env.NODE_ENV !== 'development' || len === 0) return;
  
  // Debounce: só log após 500ms de inatividade
  if (_playPointsLogTimer) clearTimeout(_playPointsLogTimer);
  _playPointsLogTimer = setTimeout(() => {
    const last = playRoutePoints.value[len - 1];
    devLog('[PLAY] points len:', len, 'last:', last);
  }, 500);
});

// FASE D1: REMOVIDO - playDeviceIconUrl não mais usado (LayerManager stub)
// TODO(E3): Remover código relacionado ao layerManager

// FASE E1.1: setupUserInteractionListeners REMOVIDO
// Agora gerenciado via mapInteraction.onMapEvents() no mapReady

// normalizeCourse movido para mapUtils.ts (FASE B1)

/**
 * FASE 13.4.1: Verifica se um ponto está dentro da "safe box" do viewport
 * Safe box = viewport com padding de 20% em cada borda
 * @param {number} lat - Latitude do ponto
 * @param {number} lng - Longitude do ponto
 * @returns {boolean} true se está na safe box (não precisa pan)
 */
const isInSafeViewport = (lat, lng) => {
  const leafletMap = map.value?.leafletObject;
  if (!leafletMap || lat == null || lng == null) return true; // fallback: não pan

  const bounds = leafletMap.getBounds();
  const latRange = bounds.getNorth() - bounds.getSouth();
  const lngRange = bounds.getEast() - bounds.getWest();

  // Aplicar padding de 20%
  const latPadding = latRange * SAFE_VIEWPORT_PADDING;
  const lngPadding = lngRange * SAFE_VIEWPORT_PADDING;

  const safeBounds = L.latLngBounds(
    [bounds.getSouth() + latPadding, bounds.getWest() + lngPadding],
    [bounds.getNorth() - latPadding, bounds.getEast() - lngPadding]
  );

  return safeBounds.contains([lat, lng]);
};

/**
 * FASE 13.4.1: Pan inteligente com throttle e safe viewport
 * Só faz pan se necessário (marker saiu da safe box) e respeitando throttle
 * @param {number} lat - Latitude alvo
 * @param {number} lng - Longitude alvo
 */
const smartPan = (lat, lng) => {
  const now = Date.now();
  
  // ⚡ OPT-4: Validações baratas primeiro (ordem otimizada)
  if (now < followPlaySuspendedUntil) {
    return; // Follow suspenso - não fazer pan
  }
  
  // Throttle ANTES de bounds check (barato)
  if (now - lastPanTime < PAN_THROTTLE_MS) {
    return; // Muito cedo para novo pan
  }
  
  // Verificar se está na safe box (cálculo pesado só se passou throttle)
  if (isInSafeViewport(lat, lng)) {
    return; // Não precisa pan - ainda está visível
  }

  // Fazer pan
  map.value?.leafletObject?.panTo([lat, lng], { animate: true, duration: 0.25 });
  lastPanTime = now;
};

/**
 * Cria ícone Leaflet DivIcon para o marcador de play
 * @param {number} course - Ângulo de rotação (já normalizado)
 * @returns {L.DivIcon}
 */
// FASE D1: getPlayVehicleIcon() removido - agora privado no MapLayerManager._createVehicleIcon()

/**
 * [FASE D1] Atualiza ou cria o marcador do veículo durante o play
 * ⚠️ LEGADO: Função mantida por compatibilidade, DELEGA para layerManager
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude  
 * @param {number} course - Ângulo de rotação (0-360)
 */
const updatePlayVehicleMarker = () => {
  startMark('updatePlayVehicleMarker');
  
  // FASE D1: STUB - Layer Manager não implementado (remoção futura)
  // TODO(E3): Remover stubs do layerManager
  
  endMark('updatePlayVehicleMarker');
};

/**
 * [FASE D1] Remove o marcador do veículo do play
 * ⚠️ LEGADO: Função mantida por compatibilidade, DELEGA para layerManager
 */
const clearPlayVehicleMarker = () => {
  // FASE D1: STUB - Layer Manager não implementado (remoção futura)
  // TODO(E3): Remover stubs do layerManager
  
  // Resetar contador de ticks
  playTickCounter = 0;
  devLog('[PLAY] 🚨 Vehicle marker removido (stub)');
};

/**
 * Preview/Seek de ponto na timeline (FASE 4 + FASE 13.4.3)
 * - Se estiver tocando (isPlayingRoute): muda o ponto atual e continua do novo ponto
 * - Se NÃO estiver tocando: apenas mostra preview do marcador + panTo
 * - FASE 13.4.3: Adiciona feedback visual com halo temporário (2s)
 * @param {Object} payload - { point, index }
 */
const previewRoutePoint = (payload) => {
  if (!payload || !payload.point) return;

  const { point, index } = payload;

  // HARDENING: Extrair lat/lng com validação robusta
  const latLng = extractLatLng(point, 'previewRoutePoint');
  if (!latLng) {
    devWarn('[SEEK] Preview ignorado: coordenadas inválidas');
    return;
  }

  const [lat, lng] = latLng;
  const course = point[3] ?? point.course ?? 0;

  devLog('[SEEK] Preview/Seek para índice:', index, 'lat:', lat, 'lng:', lng);

  // Atualizar marcador do veículo (funciona tanto em play quanto em preview)
  updatePlayVehicleMarker(lat, lng, course);

  // FASE 13.4.3: STUB - Layer Manager não implementado
  // TODO(E3): Remover stubs do layerManager

  // Pan suave para o ponto (sempre, é ação do usuário)
  // HARDENING: Usar safeMapOperation para evitar crash se mapa não pronto
  safeMapOperation(map.value?.leafletObject, 'previewRoutePoint.panTo', (leafletMap) => {
    // Limpar suspensão temporariamente para este seek manual
    const previousSuspension = followPlaySuspendedUntil;
    followPlaySuspendedUntil = 0;
    leafletMap.panTo([lat, lng], { animate: true, duration: 0.25 });
    // Restaurar suspensão se estava ativa
    if (previousSuspension > Date.now()) {
      followPlaySuspendedUntil = previousSuspension;
    }
  });

  // Se estiver tocando, atualizar índice na store para sincronizar
  // FASE C1: Usar playback.seek() ao invés de manipular índice diretamente
  if (isPlayingRoute.value && playback) {
    const safeIndex = clampIndex(index, routePoints.value.length, 'previewRoutePoint');
    playback.seek(safeIndex);
  }
};

// ============================================================================
// TOOLTIP FOLLOW STATE - Estado do tooltip ao seguir dispositivo
// ============================================================================
// TOOLTIP E FOLLOW - Gerenciado por useFollowDevice composable
// ============================================================================
// REMOVIDO: tooltipUpdateInterval, tooltipManuallyHidden, showFloatingPanel, floatingPanelDevice
// Agora gerenciados pelo composable useFollowDevice

// Posição do dispositivo para círculo de precisão GPS
const dPosition = computed(() => {
  if (route.params.deviceId) {
    return store.getters['devices/getPosition'](parseInt(route.params.deviceId));
  } else {
    return false;
  }
});

app.provide("showRouteMarkers", showRouteMarkers);
// REMOVIDO: provides legados showMapadeCalor, showPercurso, showPontos, showPontosCorrelacao

const eyeFilter = ref('');
// REMOVIDO: resizeObserver (agora no composable useMapInteraction)
// REMOVIDO: stopFollowingWatch (agora no composable useFollowDevice)

// ============================================================================
// EVENT HANDLERS - Funções nomeadas para proper cleanup de event listeners
// ============================================================================

// REMOVIDO: handleMapInvalidate (agora no composable useMapInteraction)

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
  // REMOVIDO: ResizeObserver manual (agora no composable useMapInteraction)
  // Bind dos handlers de geofence após mapa pronto
  mapInteraction.bindGeofenceHandlers();

  // ============================================================================
  // EVENT LISTENERS - Eventos do sistema (com funções nomeadas para cleanup)
  // ============================================================================

  // Listener para fechar o tooltip de follow (delegado ao composable)
  document.addEventListener("hideFollowTooltip", () => followDevice.hideTooltipManually());

  // Listener para abrir o panel flotante
  document.addEventListener("openFloatingPanel", onOpenFloatingPanel);

  // Escutar eventos de commandResult desde Traccar
  document.addEventListener("traccarEvent", onTraccarEvent);

  // Keyboard listeners para Ctrl+Click (registrados aqui, removidos no unmount)
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  // REMOVIDO: watcher de isFollowingId (agora no composable useFollowDevice)
})

onUnmounted(() => {
  // FASE E2.1: Cleanup Markers composable
  markers.cleanup();
  devLog('[Cleanup] Markers composable destruído');
  
  // Cleanup FollowDevice composable (FASE D3)
  followDevice.cleanup();
  
  // FASE E1.1: Cleanup MapInteraction composable (remove TODOS os listeners automaticamente)
  mapInteraction.cleanup();

  // FASE E1.1: Cleanup manual de bounds REMOVIDO - agora feito pelo composable

  // FASE D1: STUB - Layer Manager não implementado, cleanup removido
  // TODO(E3): Remover stubs do layerManager

  // Cleanup de event listeners do sistema (usando funções nomeadas)
  document.removeEventListener("hideFollowTooltip", () => followDevice.hideTooltipManually());
  document.removeEventListener("openFloatingPanel", onOpenFloatingPanel);
  document.removeEventListener("traccarEvent", onTraccarEvent);

  // GUARD RAIL: Cleanup de keyboard listeners para evitar memory leak
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)

  // REMOVIDO: stopFollowingWatch (agora no composable)

  // FASE C1: Cleanup do playback composable
  if (playback) {
    playback.cleanup();
    playback = null;
    devLog('[Cleanup] Playback composable destruído');
  }

  // FASE C2 + D3: Cleanup do follow composable
  followDevice.cleanup();
  devLog('[Cleanup] FollowDevice composable destruído');
  
  // FASE E1.1: Cleanup MapInteraction composable (remove TODOS os listeners automaticamente)
  mapInteraction.cleanup();
  devLog('[Cleanup] MapInteraction composable destruído');

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

// cptPoints agora usa fullRoutePoints (já normalizado) - FONTE ÚNICA DE VERDADE
const cptPoints = computed(() => {
  // Usar fullRoutePoints que já está normalizado e ordenado por normalizeRoutePoints
  // Garantir que polyline e markers usam EXATAMENTE os mesmos pontos
  return fullRoutePoints.value.map(p => [p[0], p[1]]);
});

const changeMap = (id) => {
  // Salvar diretamente no localStorage para persistência imediata
  localStorage.setItem('selectedMapId', String(id));
  // Forçar reatividade atualizando o ref
  currentMapId.value = id;
  // console.log('[Map] Mapa alterado para:', id);
}

const mapReady = (e) => {
  // console.log('mapReady', e);
  window.$map = e;

  // FASE E1.1: Registrar listeners via composable (zero memory leak)
  const m = map.value?.leafletObject;
  if (m) {
    m.whenReady(() => {
      updateMapBounds(); // Atualizar bounds inicial
      
      // FASE E1.1: Usar composable para gerenciar listeners
      const onUserInteraction = () => {
        if (followPlay.value && isPlayingRoute.value) {
          followPlaySuspendedUntil = Date.now() + USER_OVERRIDE_DURATION;
          devLog('[FASE 13.4.2] Follow suspenso por interação do usuário (5s)');
        }
      };
      
      mapInteraction.onMapEvents([
        { event: 'moveend', handler: updateMapBounds },
        { event: 'zoomend', handler: updateMapBounds },
        { event: 'dragstart', handler: onUserInteraction },
        { event: 'zoomstart', handler: onUserInteraction }
      ]);

      // FASE C1: STUB - useMapFollow não implementado (remoção futura)
      // TODO(E3): Remover stub do mapFollow ou implementar useMapFollow
      // mapFollow.setupUserInteractionListeners({ requirePlaying: true });

      // 🎯 HANDSHAKE: Emitir evento quando mapa está 100% pronto
      window.dispatchEvent(new CustomEvent('tarkan:mapReady', {
        detail: { map: window.$map }
      }));
      // console.log('✅ [MapReady] window.$map disponível');
    });
  }
}

const zoomUpdated = (z) => {
  zoom.value = z;
}

// Mapa selecionado - lê do localStorage com fallback para 1 (Google Maps)
const currentMapId = ref(parseInt(localStorage.getItem('selectedMapId') || '1', 10));
const selectedMap = computed(() => currentMapId.value);

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

// Lista de mapas disponíveis - consolidada para evitar redundância
const availableMaps = ref([
  // Google Maps - os mais usados
  { id: 1, name: 'Google Ruas', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=pt-BR' },
  { id: 2, name: 'Google Satélite', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], url: 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=pt-BR' },
  { id: 3, name: 'Google Trânsito', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], url: 'https://{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}&hl=pt-BR' },
  // OpenStreetMap - gratuito e confiável
  { id: 4, name: 'OpenStreetMap', subdomains: ['a', 'b', 'c'], url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  // Carto - mapas clean para dashboards
  { id: 5, name: 'Light', subdomains: ['a', 'b', 'c', 'd'], url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
  { id: 6, name: 'Dark', subdomains: ['a', 'b', 'c', 'd'], url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
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
 * FASE C1: Delega para playback composable
 */
const runPlayRoute = () => {
  if (!playback || routePoints.value.length === 0) return;
  playback.play();
};

/**
 * Pausa a reprodução
 * FASE C1: Delega para playback composable
 */
const pausePlayRoute = () => {
  if (!playback) return;
  playback.pause();
};

/**
 * Para a reprodução e volta ao início
 * FASE C1: Delega para playback composable
 */
const stopPlayRoute = () => {
  if (!playback) return;
  
  playback.stop();
  
  // Limpar estado visual
  isPlayingRoute.value = false;
  currentRoutePoint.value = routePoints.value[0] || null;
  resetPlay(); // Limpa rota progressiva
  clearPlayVehicleMarker(); // 🚗 Remove marcador do veículo
};

/**
 * Reinicia a reprodução do início
 * FASE C1: Delega para playback composable
 */
const restartPlayRoute = () => {
  if (!playback) return;
  
  resetPlay();
  playback.restart();
};

/**
 * Avança para o próximo ponto
 * FASE C1: Delega para playback composable
 */
const moveForward = () => {
  if (!playback) return;
  playback.forward();
};

/**
 * Retrocede para o ponto anterior
 * FASE C1: Delega para playback composable
 */
const moveBackward = () => {
  if (!playback) return;
  playback.backward();
};

/**
 * Alterna entre velocidades de reprodução
 * FASE C1: Delega para playback composable
 */
const togglePlaybackSpeed = () => {
  if (!playback) return;
  playback.toggleSpeed();
};

/**
 * Define velocidade de reprodução (FASE 5 - controle externo)
 * @param {number} speed - Velocidade desejada (1, 2, 5, 10, etc.)
 * FASE C1: Delega para playback composable
 */
const setPlaybackSpeed = (speed) => {
  if (!playback || typeof speed !== 'number' || speed < 1) return;
  playback.setSpeed(speed);
};

/**
 * Retorna velocidade atual de reprodução (FASE 5 - getter externo)
 * @returns {number}
 */
const getPlaybackSpeed = () => playbackSpeed.value;

// ⚡ OPT-3: Cache de device (mantido para handlePlaybackTick)
let _cachedDeviceId = null;
let _cachedDevice = null;

/**
 * Clica na timeline para mover para posição
 * FASE C1: Usa playback.seekByProgress()
 */
const moveTimelinePosition = (event) => {
  if (!playback || routePoints.value.length === 0) return;

  const rect = event.target.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const progress = Math.max(0, Math.min(1, clickX / (TIMELINE_WIDTH - 20)));

  playback.seekByProgress(progress);
};

/**
 * Inicia o arrasto da timeline
 * FASE C1: Usa playback.seekByProgress()
 */
const startDrag = (event) => {
  if (!playback) return;
  
  event.preventDefault();
  isDragging.value = true;

  const onDrag = (e) => {
    if (!isDragging.value || !playback) return;

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const timeline = document.querySelector('.timeline-track');
    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (clientX - rect.left) / (TIMELINE_WIDTH - 20)));
    playback.seekByProgress(progress);
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

// getCardinalDirection e formatDateTime movidos para mapUtils.ts (FASE B1)

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

// getBatteryIcon, getBatteryClass, getTemperatureClass, getSignalClass, formatAttributeValue
// movidos para ../map/mapUtils.ts (FASE B1)

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
 * FASE C2: Follow functions delegadas ao composable useFollowDevice
 * hideTooltipManually, updateFloatingPanel, updateFollowTooltip, buildTooltipHtml
 * Todas movidas para useFollowDevice.ts (zero memory leaks, cache LRU + TTL)
 */

// Delegação para compatibilidade
// eslint-disable-next-line no-unused-vars
const hideTooltipManually = () => followDevice.hideTooltipManually();
// eslint-disable-next-line no-unused-vars
const updateFloatingPanel = () => followDevice.updateFloatingPanel();

// REMOVIDO: updateFollowTooltip (agora no composable)
// REMOVIDO: buildTooltipHtml (agora no composable com cache LRU)
// REMOVIDO: tooltipCache (agora no composable)

/**
 * Controles de zoom
 */
const zoomIn = () => {
  mapInteraction.zoomIn();
};

const zoomOut = () => {
  mapInteraction.zoomOut();
};

// FASE E2.1: Funções de marcador (markerOut, markerOver, markerClick, markerContext)
// agora são fornecidas pelo composable useMarkers (importado acima).
// Cache LRU, debounce adaptativo, cooldown e sanitização gerenciados pelo composable.

const flyToDevice = (device) => {
  const position = store.getters["devices/getPosition"](device.id);
  const zoom = store.state.server.serverInfo?.attributes?.['web.selectZoom'] ?? MAP_CONSTANTS.FLY_TO_ZOOM;

  if (position) {
    // FASE E1.1: Delegado ao composable (agora usa whenReady ao invés de setTimeout)
    mapInteraction.flyTo(
      position.latitude,
      position.longitude,
      zoom,
      { animate: true, duration: MAP_CONSTANTS.FLY_DURATION }
    );
  }
}





// ============================================================================
// ROUTE MANAGEMENT FUNCTIONS - Gerenciamento de camadas de rota
// ============================================================================

/**
 * Normaliza pontos da rota: converte para [lat, lng], filtra inválidos, ordena por tempo
 * @param {Array} rawPoints - Pontos brutos (podem ser [lat,lng] ou {latitude, longitude})
 * @returns {Array} Array normalizado de [lat, lng, ...extras]
 */
const normalizeRoutePoints = (rawPoints) => {
  if (!Array.isArray(rawPoints) || rawPoints.length === 0) return [];

  // Filtrar pontos válidos e normalizar formato
  const normalized = rawPoints
    .filter(p => {
      if (!p) return false;
      const lat = Array.isArray(p) ? p[0] : p.latitude;
      const lng = Array.isArray(p) ? p[1] : p.longitude;
      return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
    })
    .map(p => {
      if (Array.isArray(p)) {
        // Já está em formato [lat, lng, ...], preservar extras
        return p;
      } else {
        // Converter objeto para array [lat, lng, speed, time, ...]
        return [
          p.latitude,
          p.longitude,
          p.altitude || 0,
          p.speed || 0,
          p.course || 0,
          p.fixTime || p.serverTime || p.deviceTime || Date.now(),
          p // Preservar objeto original como último elemento
        ];
      }
    });

  // Ordenar por tempo (último elemento se objeto, ou índice 5 se array)
  normalized.sort((a, b) => {
    const timeA = typeof a[a.length - 1] === 'object'
      ? (a[a.length - 1].fixTime || a[a.length - 1].serverTime || a[a.length - 1].deviceTime || 0)
      : (a[5] || 0);
    const timeB = typeof b[b.length - 1] === 'object'
      ? (b[b.length - 1].fixTime || b[b.length - 1].serverTime || b[b.length - 1].deviceTime || 0)
      : (b[5] || 0);
    return timeA - timeB;
  });

  return normalized;
};

/**
 * Desenha a rota completa no mapa (sempre visível)
 * @param {Array} points - Array de pontos [lat, lng] ou objetos com latitude/longitude
 */
const drawFullRoute = (points) => {
  startMark('drawFullRoute');
  const arr = Array.isArray(points) ? points : [];
  devLog('[kore-map] drawFullRoute chamado com', arr.length, 'pontos');

  // NORMALIZAR: converter formato, filtrar inválidos, ordenar por tempo
  const normalized = normalizeRoutePoints(arr);
  devLog('[kore-map] Após normalização:', normalized.length, 'pontos válidos');

  fullRoutePoints.value = normalized;

  // Markers seguem a rota completa (se toggle ativado)
  markerPoints.value = arr;

  // Manter compatibilidade com código legado
  routePoints.value = arr;
  endMark('drawFullRoute');
};

/**
 * Reseta a rota do play (limpa apenas a camada de reprodução)
 */
const resetPlay = () => {
  playRoutePoints.value = [];
  clearPlayVehicleMarker(); // 🚗 Remove marcador do veículo ao resetar
};

/**
 * Adiciona um ponto à rota do play (reprodução progressiva)
 * @param {Array|Object} point - Ponto [lat, lng] ou {latitude, longitude}
 */
const pushPlayPoint = (point) => {
  if (!point) return;

  // Normalizar formato do ponto
  const normalized = Array.isArray(point)
    ? point
    : [point.latitude || point[0], point.longitude || point[1]];

  playRoutePoints.value = [...playRoutePoints.value, normalized];
};

/**
 * Atualiza a rota no mapa (função principal exposta para components externos)
 * @param {Array} points - Array de pontos da rota
 * @param {Boolean} show - Se true, mostra markers; se false, oculta markers
 */
const updateRoute = (points, show = true) => {
  devLog('[kore-map] updateRoute chamado:', points.length, 'pontos, show =', show);

  if (points.length) {
    store.commit("devices/setRoute", true);
  }

  // Desenhar rota completa SEMPRE (nova arquitetura)
  drawFullRoute(points);

  // "show" agora controla apenas MARKERS, não a polyline
  if (typeof show === 'boolean') {
    showRouteMarkers.value = show;
  } else {
    showRouteMarkers.value = true;
  }

  // Resetar play ao carregar nova rota
  resetPlay();

  // Manter compatibilidade com código legado
  showRoutePoints.value = true; // Rota sempre visível agora

  if (points.length > 0) {
    let tmp = [];
    for (var p in points) {
      tmp.push([points[p][0], points[p][1]]);
    }

    setTimeout(() => {
      // eslint-disable-next-line no-undef
      const bds = L.latLngBounds(tmp);
      map.value?.leafletObject?.fitBounds(bds);
    }, 300);
  }
}

/**
 * Toggle Heatmap - 100% VUE/LEAFLET (sem PHP/iframe)
 * @param {Boolean} enabled - Se true, ativa heatmap; se false, desativa
 * COMMIT 2: Ao ligar heatmap, desliga play automaticamente
 */
const toggleHeatmap = (enabled) => {
  showHeat.value = !!enabled;

  // FASE D1: STUB - Layer Manager não implementado
  // TODO(E3): Remover stubs do layerManager ou implementar LayerManager
  devWarn('[toggleHeatmap] Funcionalidade temporariamente desabilitada (LayerManager pendente)');
  showHeat.value = false;
};


const setMapCenter = (pos) => {
  map.value?.leafletObject?.panTo(pos);
}
window.$setMapCenter = setMapCenter;

// REMOVIDO: mapClick (lógica movida para composable useMapInteraction)
// REMOVIDO: mapMove (lógica movida para composable useMapInteraction)
// REMOVIDO: mapMoveThrottleTimer (agora gerenciado pelo composable)

// Delegates para manter compatibilidade com template
const mapClick = (e) => {
  // Delegado ao composable via callback onMapClick
  if (mapInteraction && e.latlng) {
    mapInteraction.bindGeofenceHandlers();
  }
};

// eslint-disable-next-line no-unused-vars
const mapMove = (e) => {
  // Delegado ao composable via callback onMapMove
  // Throttle gerenciado internamente pelo composable
};



devLog('[kore-map.vue] 🔵 Registrando provides...');

const runtimeApi = inject('runtimeApi', null);
const contextMenuRef = inject("contextMenu");
const logObjectsRef = inject("log-objects");
const linkObjectsRef = inject("link-objects");
const editSharesRef = inject("edit-shares");
const editShareRef = inject("edit-share");
const editDeviceRef = inject("edit-device");

// ============================================================================
// FASE E2.1: Integração do useMarkers composable
// ============================================================================
const markers = useMarkers({
  store,
  router,
  mapApi: mapInteraction,
  followApi: followDevice,
  runtimeApi,
  env: {
    isEnterprise: !!store.state.server.serverInfo?.attributes?.['tarkan.enterprise'],
    debugFlag: process.env.NODE_ENV !== 'production'
  },
  ui: {
    editDevice: editDeviceRef,
    editShare: editShareRef,
    linkObjects: linkObjectsRef,
    logObjects: logObjectsRef,
    contextMenu: contextMenuRef,
    sliderConfirm: openSliderConfirm,
    actAnchor: actAnchor,
    messageBox: ElMessageBox,
    message: ElMessage,
    notification: ElNotification
  },
  utils: { KT }
});

// Destructure das funções do composable
const { markerOver, markerOut, markerClick, markerContext } = markers;

devLog('[kore-map.vue] ✅ useMarkers integrado:', { markerOver: !!markerOver, markerClick: !!markerClick, markerContext: !!markerContext });

app.provide('markerClick', markerClick);
app.provide('flyToDevice', flyToDevice)
app.provide('updateRoute', updateRoute)
app.provide('resetPlayRoute', resetPlay)
app.provide('pushPlayPoint', pushPlayPoint)
app.provide('toggleHeatmap', toggleHeatmap)
app.provide('markerContext', markerContext);

// COMMIT 1: Provide para controle de play externo
app.provide('isPlayingRoute', isPlayingRoute);
app.provide('setRoutePlaying', (v) => { isPlayingRoute.value = !!v; });

// FASE 3: Provide para controle do follow mode
app.provide('followPlay', followPlay);
app.provide('setFollowPlay', (v) => {
  followPlay.value = !!v;
  // FASE 13.4.2: Limpar suspensão quando usuário ativa follow manualmente
  if (v) {
    followPlaySuspendedUntil = 0;
  }
});

// FASE 4: Provide para seek/preview de ponto na timeline
app.provide('previewRoutePoint', previewRoutePoint);

// FASE 5: Provides para controle de playback externo
app.provide('runPlayRoute', runPlayRoute);
app.provide('pausePlayRoute', pausePlayRoute);
app.provide('stopPlayRoute', stopPlayRoute);
app.provide('setPlaybackSpeed', setPlaybackSpeed);
app.provide('getPlaybackSpeed', getPlaybackSpeed);
app.provide('playbackSpeed', playbackSpeed);
app.provide('routePlayState', routePlayState);

// COMMIT 3: Provides para cor da rota configurável
app.provide('routeColor', routeColor);
app.provide('setRouteColor', setRouteColor);
app.provide('ROUTE_COLOR_OPTIONS', ROUTE_COLOR_OPTIONS);

devLog('[kore-map] ✅ Provides registrados:', {
  markerClick: !!markerClick,
  flyToDevice: !!flyToDevice,
  updateRoute: !!updateRoute,
  resetPlayRoute: !!resetPlay,
  pushPlayPoint: !!pushPlayPoint,
  toggleHeatmap: !!toggleHeatmap,
  markerContext: !!markerContext,
  routeColor: routeColor.value,
  setRouteColor: !!setRouteColor
});

// ============================================================================
// FUNÇÕES DE CONTROLE DE MARKERS (MANTIDAS)
// ============================================================================
const showMarkersLayer = () => {
  showRouteMarkers.value = true;
};
const hideMarkersLayerr = () => {
  showRouteMarkers.value = false;
};

app.provide("showMarkersLayer", showMarkersLayer);
app.provide("hideMarkersLayerr", hideMarkersLayerr);

// REMOVIDO COMMIT 2: Funções legadas de show/hide layers
// showPercursoLayer, hidePercursoLayer, showPontosLayer, hidePontosLayer
// showPontosCorrelacaoLayer, hidePontosCorrelacaoLayer, showMapadeCalorCorrelacaoLayer, hideCalorCorrelacaoLayer
// Essas controlavam iframes PHP agora removidos - usar apenas toggleHeatmap para heatmap
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

  /* FIX: For\u00e7ar dimens\u00f5es compactas em qualquer contexto */
  width: auto !important;
  height: auto !important;
  max-width: 42px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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
/* MARKER DO DEVICE ANIMADO DURANTE PLAYBACK                                    */
/* ============================================================================ */
.play-device-marker {
  transition: transform 0.2s ease-out;
  animation: playMarkerPulse 1.5s infinite;
}

@keyframes playMarkerPulse {

  0%,
  100% {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  }

  50% {
    filter: drop-shadow(0 4px 12px rgba(5, 167, 227, 0.6));
  }
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
