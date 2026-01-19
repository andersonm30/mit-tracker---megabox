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
                  <el-dropdown-menu>
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
                  <el-dropdown-menu>
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
            <div v-if="showDetailsPanel && detailsPoint" class="route-details-panel">
              <div class="route-details-header">
                <div><i class="fas fa-info-circle"></i> {{ KT('attribute.details') || 'Detalhes do Ponto' }}</div>
                <div class="route-details-close" @click="showDetailsPanel = false"><i class="fas fa-times"></i></div>
              </div>
              <div class="route-details-content">
                <div v-if="detailsPoint">
                  <!-- Status Icons Row -->
                  <div class="status-icons-row">
                    <!-- Ignição -->
                    <div class="status-icon-item"
                      :class="{ 'active': detailsPoint.attributes?.ignition === true, 'inactive': detailsPoint.attributes?.ignition === false }"
                      :title="KT('device.ignition') + ': ' + (detailsPoint.attributes?.ignition ? 'Ligado' : 'Desligado')">
                      <i class="fas fa-key"></i>
                    </div>
                    <!-- Bloqueio -->
                    <div class="status-icon-item"
                      :class="{ 'danger': detailsPoint.attributes?.blocked === true, 'active': detailsPoint.attributes?.blocked === false }"
                      :title="detailsPoint.attributes?.blocked ? KT('device.blocked') : KT('device.unblocked')">
                      <i :class="detailsPoint.attributes?.blocked ? 'fas fa-lock' : 'fas fa-lock-open'"></i>
                    </div>
                    <!-- Movimento -->
                    <div class="status-icon-item"
                      :class="{ 'active': detailsPoint.speed > 0, 'warning': detailsPoint.speed === 0 }"
                      :title="detailsPoint.speed > 0 ? 'Em movimento' : 'Parado'">
                      <i :class="detailsPoint.speed > 0 ? 'fas fa-car' : 'fas fa-parking'"></i>
                    </div>
                    <!-- Bateria Veículo -->
                    <div class="status-icon-item" v-if="detailsPoint.attributes?.power"
                      :class="{ 'active': detailsPoint.attributes?.power > 12, 'warning': detailsPoint.attributes?.power <= 12 && detailsPoint.attributes?.power > 10, 'danger': detailsPoint.attributes?.power <= 10 }"
                      :title="'Bateria: ' + (detailsPoint.attributes?.power || 0).toFixed(1) + 'V'">
                      <i class="fas fa-car-battery"></i>
                    </div>
                    <!-- Sinal -->
                    <div class="status-icon-item" v-if="detailsPoint.attributes?.rssi"
                      :class="getSignalClass(detailsPoint.attributes?.rssi)"
                      :title="'Sinal: ' + (detailsPoint.attributes?.rssi || 0) + 'dBm'">
                      <i class="fas fa-signal"></i>
                    </div>
                    <!-- Satélites -->
                    <div class="status-icon-item"
                      :class="{ 'active': (detailsPoint.attributes?.sat || detailsPoint.attributes?.satellites || 0) >= 4 }"
                      :title="'Satélites: ' + (detailsPoint.attributes?.sat || detailsPoint.attributes?.satellites || 0)">
                      <i class="fas fa-satellite"></i>
                    </div>
                  </div>

                  <!-- Informações Principais -->
                  <div class="detail-info-grid">
                    <!-- Velocidade -->
                    <div class="detail-info-item">
                      <div class="detail-icon"><i class="fas fa-tachometer-alt"></i></div>
                      <div class="detail-text">
                        <span class="detail-value-main">{{ Math.round((detailsPoint.speed || 0) * 1.852) }}
                          km/h</span>
                      </div>
                    </div>
                    <!-- Direção -->
                    <div class="detail-info-item">
                      <div class="detail-icon"><i class="fas fa-compass"></i></div>
                      <div class="detail-text">
                        <span class="detail-value-main">{{ getCardinalDirection(detailsPoint.course) }} ({{
                          detailsPoint.course || 0 }}°)</span>
                      </div>
                    </div>
                    <!-- Data/Hora -->
                    <div class="detail-info-item">
                      <div class="detail-icon"><i class="fas fa-clock"></i></div>
                      <div class="detail-text">
                        <span class="detail-value-main">{{ formatDateTime(detailsPoint.deviceTime) }}</span>
                      </div>
                    </div>
                    <!-- Bateria -->
                    <div class="detail-info-item" v-if="detailsPoint.attributes?.power">
                      <div class="detail-icon"><i class="fas fa-car-battery"></i></div>
                      <div class="detail-text">
                        <span class="detail-value-main">{{ (detailsPoint.attributes?.power || 0).toFixed(1)
                        }}V</span>
                      </div>
                    </div>
                  </div>

                  <!-- Endereço -->
                  <div class="detail-address" v-if="detailsAddress">
                    <div class="detail-icon"><i class="fas fa-map-marker-alt"></i></div>
                    <div class="detail-address-text">{{ detailsAddress }}</div>
                  </div>

                  <!-- Coordenadas -->
                  <div class="detail-coords">
                    <span class="coords-text">{{ detailsPoint.latitude?.toFixed(6) }}, {{
                      detailsPoint.longitude?.toFixed(6) }}</span>
                  </div>

                  <!-- Botões de Ação -->
                  <div class="detail-actions">
                    <button class="detail-action-btn" @click="copyLocation(detailsPoint)" :title="'Copiar coordenadas'">
                      <i class="fas fa-copy"></i>
                    </button>
                    <button class="detail-action-btn" @click="openInMaps(detailsPoint)" :title="'Abrir no Google Maps'">
                      <i class="fas fa-external-link-alt"></i>
                    </button>
                    <button class="detail-action-btn" @click="openStreetView(detailsPoint)" :title="'Street View'">
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
          <!-- PATCH 3: HUD só aparece durante playback (isPlayingRoute)      -->
          <!-- UX POLISH: Transition para fade suave                          -->
          <!-- ============================================================== -->
          <transition name="route-mini-hud">
            <l-control position="bottomleft" v-if="store.state.devices.showRoutes && isPlayingRoute && detailsPoint">
              <div class="route-mini-hud">
                <!-- Linha 1: Ícones de Status Compactos -->
                <div class="mini-hud-status-row">
                  <!-- Ignição -->
                  <div class="mini-status-icon"
                    :class="{ 'active': detailsPoint.attributes?.ignition === true, 'inactive': detailsPoint.attributes?.ignition === false }"
                    :title="(KT('device.ignition') || 'Ignição') + ': ' + (detailsPoint.attributes?.ignition ? 'Ligado' : 'Desligado')">
                    <i class="fas fa-key"></i>
                  </div>
                  <!-- Bloqueio -->
                  <div class="mini-status-icon"
                    :class="{ 'danger': detailsPoint.attributes?.blocked === true, 'active': detailsPoint.attributes?.blocked === false }"
                    :title="detailsPoint.attributes?.blocked ? (KT('device.blocked') || 'Bloqueado') : (KT('device.unblocked') || 'Desbloqueado')">
                    <i :class="detailsPoint.attributes?.blocked ? 'fas fa-lock' : 'fas fa-lock-open'"></i>
                  </div>
                  <!-- Movimento -->
                  <div class="mini-status-icon"
                    :class="{ 'active': detailsPoint.speed > 0, 'warning': detailsPoint.speed === 0 }"
                    :title="detailsPoint.speed > 0 ? (KT('device.moving') || 'Em movimento') : (KT('device.stopped') || 'Parado')">
                    <i :class="detailsPoint.speed > 0 ? 'fas fa-car' : 'fas fa-parking'"></i>
                  </div>
                  <!-- Bateria Veículo -->
                  <div class="mini-status-icon" v-if="detailsPoint.attributes?.power"
                    :class="{ 'active': detailsPoint.attributes?.power > 12, 'warning': detailsPoint.attributes?.power <= 12 && detailsPoint.attributes?.power > 10, 'danger': detailsPoint.attributes?.power <= 10 }"
                    :title="(KT('device.battery') || 'Bateria') + ': ' + (detailsPoint.attributes?.power || 0).toFixed(1) + 'V'">
                    <i class="fas fa-car-battery"></i>
                  </div>
                  <!-- Sinal -->
                  <div class="mini-status-icon" v-if="detailsPoint.attributes?.rssi"
                    :class="getSignalClass(detailsPoint.attributes?.rssi)"
                    :title="(KT('device.signal') || 'Sinal') + ': ' + (detailsPoint.attributes?.rssi || 0) + 'dBm'">
                    <i class="fas fa-signal"></i>
                  </div>
                </div>

                <!-- Linha 2: Info Principal (velocidade, direção, hora, endereço) -->
                <div class="mini-hud-info-row">
                  <span class="mini-info-item">
                    <i class="fas fa-tachometer-alt"></i>
                    {{ Math.round((detailsPoint.speed || 0) * 1.852) }} km/h
                  </span>
                  <span class="mini-info-item">
                    <i class="fas fa-compass"></i>
                    {{ getCardinalDirection(detailsPoint.course) }}
                  </span>
                  <span class="mini-info-item">
                    <i class="fas fa-clock"></i>
                    {{ formatDateTime(detailsPoint.deviceTime) }}
                  </span>
                </div>

                <!-- Linha 2.5: Endereço (PATCH 4: usa detailsAddress com fallback) -->
                <div class="mini-hud-address" v-if="detailsAddress">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>{{ detailsAddress }}</span>
                </div>

                <!-- Linha 3: Botões de Ação -->
                <div class="mini-hud-actions">
                  <button class="mini-action-btn" @click="showRouteDetails()"
                    :title="KT('attribute.details') || 'Detalhes'">
                    <i class="fas fa-info-circle"></i>
                  </button>
                  <button class="mini-action-btn" @click="copyLocation(detailsPoint)"
                    :title="KT('map.copyCoords') || 'Copiar coordenadas'">
                    <i class="fas fa-copy"></i>
                  </button>
                  <button class="mini-action-btn" @click="openInMaps(detailsPoint)"
                    :title="KT('map.openMaps') || 'Abrir no Google Maps'">
                    <i class="fas fa-external-link-alt"></i>
                  </button>
                </div>
              </div>
            </l-control>
          </transition>

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
// PR#4: Overlay Registry para gerenciamento centralizado de overlays
import { createOverlayRegistry } from '../../map/overlayRegistry';

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
import { computed, watch, ref, onMounted, onUnmounted, inject, provide, getCurrentInstance } from "vue";  // Adicionado provide
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

// ===============================
// KORE DEBUG (diagnóstico de performance)
// Ative no console: window.__KORE_DEBUG__.enabled = true
// ===============================
const __KORE_DEBUG__ = (window.__KORE_DEBUG__ ||= {
  enabled: false,
  fps: 0,
  frames: 0,
  lastFpsTs: performance.now(),
  layers: 0,
  markers: 0,
  listeners: 0,
  logs: [],
  log(msg) {
    if (!this.enabled) return;
    const line = `[KORE] ${msg}`;
    this.logs.push({ t: Date.now(), msg: line });
    if (this.logs.length > 200) this.logs.shift();
    // eslint-disable-next-line no-console
    console.debug(line);
  },
});

// ===============================
// LISTENER REGISTRY (evita vazamento de event listeners)
// ===============================
function createListenerRegistry() {
  const disposers = [];

  function onDom(target, event, handler, options) {
    target?.addEventListener?.(event, handler, options);
    disposers.push(() => target?.removeEventListener?.(event, handler, options));
    __KORE_DEBUG__.listeners++;
  }

  function onLeaflet(target, event, handler) {
    target?.on?.(event, handler);
    disposers.push(() => target?.off?.(event, handler));
    __KORE_DEBUG__.listeners++;
  }

  function cleanup() {
    const count = disposers.length;
    for (let i = count - 1; i >= 0; i--) disposers[i]();
    disposers.length = 0;
    __KORE_DEBUG__.listeners = Math.max(0, __KORE_DEBUG__.listeners - count);
    __KORE_DEBUG__.log(`ListenerRegistry cleanup: ${count} listeners removidos`);
  }

  return { onDom, onLeaflet, cleanup };
}

const listenerRegistry = createListenerRegistry();

/**
 * 🔧 PATCH 3: Throttle por RAF - mata "update storm" em pan/zoom/realtime
 * Se 30 updates chegam em 50ms, processa apenas 1 por frame (60fps máx)
 * 
 * Uso típico:
 * const updateMarkersThrottled = rafThrottle((payload) => {
 *   // sua lógica de update que roda muito
 * });
 * 
 * // Em vez de chamar updateMarkers() direto em loops:
 * updateMarkersThrottled(payload);
 */
// eslint-disable-next-line no-unused-vars
function rafThrottle(fn) {
  let raf = 0;
  let lastArgs = null;

  return (...args) => {
    lastArgs = args;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      fn(...lastArgs);
    });
  };
}

// 🔧 PATCH 3: Expor rafThrottle para uso global
if (typeof window !== 'undefined' && window.__KORE_DEBUG__) {
  window.__KORE_DEBUG__.rafThrottle = rafThrottle;
}

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
// PR#4: OVERLAY REGISTRY - Gerenciamento centralizado de overlays do mapa
// ============================================================================
const overlayRegistry = createOverlayRegistry('kore-map');

// PATCH 2: Conectar overlayRegistry ao __KORE_DEBUG__ para diagnóstico unificado
if (typeof window !== 'undefined' && window.__KORE_DEBUG__) {
  window.__KORE_DEBUG__.overlayRegistry = overlayRegistry;
}

// DEBUG: Expor stats no window para testes via console
if (typeof window !== 'undefined') {
  window.$overlayStats = () => {
    const stats = overlayRegistry.getStats();
    console.table(stats);
    console.log('\n📋 Interpretação:');
    console.log(`  • registered: ${stats.registered} (total criado desde início)`);
    console.log(`  • removed: ${stats.removed} (total removido)`);
    console.log(`  • leaked: ${stats.leaked} (erros ao remover)`);
    console.log(`  • active: ${stats.active} (atual no mapa)`);
    console.log('\n✅ Ideal: active === 0 após clearAllOverlays()');
    return stats;
  };

  window.$clearMap = (reason = 'manual-test') => {
    console.log(`🧪 Teste manual: clearAllOverlays('${reason}')`);
    if (window.$map?.__clearFn) {
      window.$map.__clearFn({ reason });
    } else {
      console.warn('⚠️ Função clear não disponível. Aguarde mapa carregar.');
    }
  };
}

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
  const attrs = position?.attributes ?? {};
  
  // ========================================
  // DRIVER RESOLUTION - REGRA PADRONIZADA
  // ========================================
  const driverUniqueId = attrs.driverUniqueId || null;
  const rfid = attrs.rfid || null;
  const rfidStatus = attrs.rfidStatus || null;
  
  // Montar driver efetivo
  let effectiveDriverId = driverUniqueId;
  
  // Fallback para rfid SOMENTE se status é VALID
  if (!effectiveDriverId && rfid && rfidStatus === 'VALID') {
    effectiveDriverId = rfid;
  }
  
  // Último fallback: device.attributes
  if (!effectiveDriverId && device.attributes?.driverUniqueId) {
    effectiveDriverId = device.attributes.driverUniqueId;
  }
  
  // 🔍 DEBUG: Log apenas em dev
  if (process.env.NODE_ENV === 'development' || window.DEBUG_DRIVER_LOOKUP) {
    console.log('[kore-map/getDriverName]', {
      deviceId: device.id,
      positionId: position?.id,
      driverUniqueId,
      rfid,
      rfidStatus,
      effectiveDriverId
    });
  }
  
  if (effectiveDriverId) {
    const driver = store.getters['drivers/getDriverByUniqueId']?.(effectiveDriverId);
    if (driver) return driver.name || driver.uniqueId;
    return effectiveDriverId;
  }
  return 'Sem motorista';
};

const getDriverId = (device) => {
  if (!device) return null;
  const position = store.getters["devices/getPosition"](device.id);
  const attrs = position?.attributes ?? {};
  
  // DRIVER RESOLUTION - REGRA PADRONIZADA
  const driverUniqueId = attrs.driverUniqueId || null;
  const rfid = attrs.rfid || null;
  const rfidStatus = attrs.rfidStatus || null;
  
  let effectiveDriverId = driverUniqueId;
  if (!effectiveDriverId && rfid && rfidStatus === 'VALID') {
    effectiveDriverId = rfid;
  }
  if (!effectiveDriverId && device.attributes?.driverUniqueId) {
    effectiveDriverId = device.attributes.driverUniqueId;
  }
  
  if (effectiveDriverId) {
    const driver = store.getters['drivers/getDriverByUniqueId']?.(effectiveDriverId);
    return driver?.id || null;
  }
  return null;
};

const getDriverPhotoUrl = (device) => {
  if (!device) return '/tarkan/assets/images/drivers/default.png';
  
  const position = store.getters["devices/getPosition"](device.id);
  const attrs = position?.attributes ?? {};
  
  // DRIVER RESOLUTION - REGRA PADRONIZADA
  const driverUniqueId = attrs.driverUniqueId || null;
  const rfid = attrs.rfid || null;
  const rfidStatus = attrs.rfidStatus || null;
  
  let effectiveDriverId = driverUniqueId;
  if (!effectiveDriverId && rfid && rfidStatus === 'VALID') {
    effectiveDriverId = rfid;
  }
  if (!effectiveDriverId && device.attributes?.driverUniqueId) {
    effectiveDriverId = device.attributes.driverUniqueId;
  }
  
  // Cache indexa por deviceId + effectiveDriverId para evitar conflitos
  const cacheKey = `driver_${device.id}_${effectiveDriverId || 'none'}`;
  
  if (imageUrlCache.value.has(cacheKey)) {
    return imageUrlCache.value.get(cacheKey);
  }
  
  if (effectiveDriverId) {
    const driver = store.getters['drivers/getDriverByUniqueId']?.(effectiveDriverId);
    if (driver?.attributes?.photo) {
      const url = driver.attributes.photo;
      imageUrlCache.value.set(cacheKey, url);
      return url;
    }
  }
  return '/tarkan/assets/images/drivers/default.png';
};

// Helper interno para resolver effectiveDriverId
const _resolveEffectiveDriverId = (device) => {
  if (!device) return null;
  const position = store.getters["devices/getPosition"](device.id);
  const attrs = position?.attributes ?? {};
  
  const driverUniqueId = attrs.driverUniqueId || null;
  const rfid = attrs.rfid || null;
  const rfidStatus = attrs.rfidStatus || null;
  
  let effectiveDriverId = driverUniqueId;
  if (!effectiveDriverId && rfid && rfidStatus === 'VALID') {
    effectiveDriverId = rfid;
  }
  if (!effectiveDriverId && device.attributes?.driverUniqueId) {
    effectiveDriverId = device.attributes.driverUniqueId;
  }
  return effectiveDriverId;
};

const getDriverCNH = (device) => {
  const effectiveDriverId = _resolveEffectiveDriverId(device);
  if (effectiveDriverId) {
    const driver = store.getters['drivers/getDriverByUniqueId']?.(effectiveDriverId);
    return driver?.attributes?.cnh || null;
  }
  return null;
};

const getDriverCPF = (device) => {
  const effectiveDriverId = _resolveEffectiveDriverId(device);
  if (effectiveDriverId) {
    const driver = store.getters['drivers/getDriverByUniqueId']?.(effectiveDriverId);
    return driver?.attributes?.cpf || null;
  }
  return null;
};

const getDriverCNHExpiry = (device) => {
  const effectiveDriverId = _resolveEffectiveDriverId(device);
  if (effectiveDriverId) {
    const driver = store.getters['drivers/getDriverByUniqueId']?.(effectiveDriverId);
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

  // FIX: Disparar evento para recalcular mapa após fechar div
  setTimeout(() => {
    document.dispatchEvent(new Event('mapResize'));
  }, 150);

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

// ============================================================================
// GATE 4: REALTIME VS PLAYBACK - Single Writer Pattern
// ============================================================================
// Quando playback está ativo, realtime NÃO escreve em overlays do mapa
// Isso evita "briga" de posição/rotação, flicker e update storm
let isPlaybackActive = false;
let isPlaybackSeeking = false; // Opcional: diferencia play vs scrub/seek

// Expor no window para debug
if (typeof window !== 'undefined' && window.__KORE_DEBUG__) {
  Object.defineProperty(window.__KORE_DEBUG__, 'playbackActive', {
    get: () => isPlaybackActive
  });
  Object.defineProperty(window.__KORE_DEBUG__, 'playbackSeeking', {
    get: () => isPlaybackSeeking
  });
}
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

// ===============================
// PLAYBACK PREMIUM ANIMATION STATE
// Separado do updatePlayVehicleMarker para não quebrar preview/seek
// ===============================
let playbackAnimRaf = 0;
let playbackAnimToken = 0;
let lastPlaybackLatLng = null;     // { lat, lng }
let lastPlaybackCourse = null;     // degrees 0..360

const cancelPlaybackAnim = () => {
  playbackAnimToken++;
  if (playbackAnimRaf) cancelAnimationFrame(playbackAnimRaf);
  playbackAnimRaf = 0;
};

const clamp01 = (t) => Math.max(0, Math.min(1, t));

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t) => t * t * t;

// Distância em metros (haversine)
const haversineMeters = (a, b) => {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Normaliza ângulo p/ 0..360
const normDeg = (deg) => ((deg % 360) + 360) % 360;

// Interpola rotação sem "quebra" 359→0
const interpolateAngle = (fromDeg, toDeg, t) => {
  const a = normDeg(fromDeg);
  const b = normDeg(toDeg);
  let delta = b - a;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return normDeg(a + delta * t);
};

// Bezier quadrática: p(t)= (1-t)^2 p0 + 2(1-t)t p1 + t^2 p2
const bezierPoint = (p0, p1, p2, t) => {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  return {
    lat: uu * p0.lat + 2 * u * t * p1.lat + tt * p2.lat,
    lng: uu * p0.lng + 2 * u * t * p1.lng + tt * p2.lng
  };
};

// Ponto de controle com "lookahead" simples
const calculateControlPoint = (from, to, next) => {
  // Base: meio do caminho
  const mid = { lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 };

  // Se não tiver next, curva mínima
  if (!next) return mid;

  // "Curvatura" proporcional à mudança de direção (bem leve para não "sambar")
  const v1 = { lat: to.lat - from.lat, lng: to.lng - from.lng };
  const v2 = { lat: next.lat - to.lat, lng: next.lng - to.lng };

  const dot = v1.lat * v2.lat + v1.lng * v2.lng;
  const m1 = Math.hypot(v1.lat, v1.lng) || 1;
  const m2 = Math.hypot(v2.lat, v2.lng) || 1;
  const cos = dot / (m1 * m2);
  const angle = Math.acos(Math.max(-1, Math.min(1, cos))); // 0..pi

  // Offset perpendicular pequeno (ajuste fino - strength bem conservador)
  const strength = (angle / Math.PI) * 0.0004;
  const perp = { lat: -v1.lng, lng: v1.lat };
  const perpMag = Math.hypot(perp.lat, perp.lng) || 1;

  return {
    lat: mid.lat + (perp.lat / perpMag) * strength,
    lng: mid.lng + (perp.lng / perpMag) * strength
  };
};

// Duração (ms) proporcional à velocidade (km/h) e distância.
// Clamp para não ficar "rápido demais" ou "lento demais".
const computeAnimationDuration = (distanceM, speedKmh) => {
  const speed = Math.max(5, Number(speedKmh) || 0); // evita 0
  const ms = (distanceM / (speed * 1000 / 3600)) * 1000;
  return Math.max(120, Math.min(650, ms));
};

const selectEasing = (speedKmh) => {
  const speed = Number(speedKmh) || 0;
  // mais rápido: easeOut (desacelera natural), mais lento: mix suave
  return speed >= 40 ? easeOutCubic : (t) => (easeInCubic(t) * 0.5 + easeOutCubic(t) * 0.5);
};

/**
 * Move premium com curva + rotação suave.
 * - NÃO usa no "seek/preview" (esses usam updatePlayVehicleMarker)
 * - Só usar no tick do playback
 */
const animateMarkerMovePremium = ({ marker, from, to, next, courseFrom, courseTo, speedKmh }) => {
  cancelPlaybackAnim();
  const token = playbackAnimToken;

  const distance = haversineMeters(from, to);
  const duration = computeAnimationDuration(distance, speedKmh);
  const easing = selectEasing(speedKmh);
  const control = calculateControlPoint(from, to, next);

  const el = marker.getElement();
  const container = el ? el.querySelector('.play-marker-container') : null;
  if (container) {
    container.style.transition = 'transform 0.25s linear';
  }

  const start = performance.now();

  const step = (now) => {
    if (token !== playbackAnimToken) return; // cancelado
    const rawT = (now - start) / duration;
    const t = clamp01(rawT);
    const te = easing(t);

    const p = bezierPoint(from, control, to, te);
    marker.setLatLng([p.lat, p.lng]);

    if (container) {
      const ang = interpolateAngle(courseFrom ?? 0, courseTo ?? 0, te);
      container.style.transform = `rotate(${ang}deg)`;
    }

    if (t < 1) {
      playbackAnimRaf = requestAnimationFrame(step);
    } else {
      playbackAnimRaf = 0;
    }
  };

  playbackAnimRaf = requestAnimationFrame(step);
};

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
const selectedRoutePoint = ref(null); // Ponto selecionado pelo usuário (clique)
const isDragging = ref(false); // Se está arrastando a timeline
const showDetailsPanel = ref(false); // Se mostra o painel de detalhes
const playbackDeviceId = ref(null); // Device ID para obter ícone correto no playback

// ============================================================================
// MARKER REGISTRY - Gerenciamento robusto de markers via provide/inject
// ============================================================================
const deviceMarkerRegistry = (() => {
  const markers = new Map();        // deviceId -> marker
  const hidden = new Set();         // deviceIds escondidos

  const set = (id, marker) => {
    if (id == null || !marker) return;
    markers.set(String(id), marker);
  };

  const get = (id) => markers.get(String(id));

  const hide = (id) => {
    const m = get(id);
    if (!m) return false;

    hidden.add(String(id));

    // PATCH FINAL A: Usar __setHidden se disponível (CanvasMarker)
    if (typeof m.__setHidden === 'function') {
      m.__setHidden(true);
      return true;
    }

    // Leaflet Marker padrão
    if (typeof m.setOpacity === 'function') {
      m.setOpacity(0);
      return true;
    }

    // CanvasMarker (custom) - tenta flags comuns
    try {
      if (m.options?.img) {
        m.options.img.hidden = true;
        m.options.img.hide = true;
      }
      if (typeof m.redraw === 'function') m.redraw();
      if (typeof m._update === 'function') m._update();
      if (typeof m.update === 'function') m.update();
      return true;
    } catch (_) {
      return false;
    }
  };

  const show = (id) => {
    const m = get(id);
    if (!m) return false;

    hidden.delete(String(id));

    // PATCH FINAL A: Usar __setHidden se disponível (CanvasMarker)
    if (typeof m.__setHidden === 'function') {
      m.__setHidden(false);
      return true;
    }

    if (typeof m.setOpacity === 'function') {
      m.setOpacity(1);
      return true;
    }

    try {
      if (m.options?.img) {
        m.options.img.hidden = false;
        m.options.img.hide = false;
      }
      if (typeof m.redraw === 'function') m.redraw();
      if (typeof m._update === 'function') m._update();
      if (typeof m.update === 'function') m.update();
      return true;
    } catch (_) {
      return false;
    }
  };

  const isHidden = (id) => hidden.has(String(id));

  return { set, get, hide, show, isHidden };
})();

// Expor registry para CanvaMarker via provide
provide('deviceMarkerRegistry', deviceMarkerRegistry);

// ============================================================================
// FONTE ÚNICA para HUD + Modal: detailsPoint computed
// ============================================================================
const detailsPoint = computed(() => {
  // Se usuário selecionou/clicou num ponto, prioriza
  if (selectedRoutePoint.value) return selectedRoutePoint.value;

  // Durante playback, usa o ponto atual
  if (isPlayingRoute.value) return currentRoutePoint.value;

  // Fora do playback, mostra o último ponto atual
  return currentRoutePoint.value || null;
});

// Fallback de endereço: address || attributes.address
const detailsAddress = computed(() => {
  const p = detailsPoint.value;
  if (!p) return '';
  return p.address || p.attributes?.address || '';
});

// Metadados enriquecidos para HUD/Modal (enterprise)
// eslint-disable-next-line no-unused-vars
const detailsMeta = computed(() => {
  const p = detailsPoint.value;
  if (!p) return [];

  const a = p.attributes || {};

  const kmh = Math.round((p.speed || 0) * 1.852);
  const battery = a.battery ?? a.deviceBattery ?? a.batteryLevel ?? null;
  const power = a.power ?? a.externalPower ?? null;
  const sat = a.sat ?? a.satellites ?? null;
  const hdop = a.hdop ?? null;
  const ignition = a.ignition === true ? 'Ligado' : (a.ignition === false ? 'Desligado' : '—');
  const motion = a.motion === true ? 'Sim' : (a.motion === false ? 'Não' : '—');
  const blocked = a.blocked === true ? 'Bloqueado' : (a.blocked === false ? 'Livre' : '—');
  const rssi = a.rssi ?? a.gsm ?? null;
  const odometer = a.odometer ?? a.totalDistance ?? null;

  return [
    { label: 'Velocidade', value: `${kmh} km/h`, icon: 'fa-tachometer-alt' },
    { label: 'Ignição', value: ignition, icon: 'fa-key' },
    { label: 'Movimento', value: motion, icon: 'fa-car' },
    { label: 'Bloqueio', value: blocked, icon: 'fa-lock' },
    { label: 'Bateria', value: battery != null ? `${battery}%` : '—', icon: 'fa-battery-half' },
    { label: 'Alimentação', value: power != null ? `${power.toFixed?.(1) || power}V` : '—', icon: 'fa-car-battery' },
    { label: 'Satélites', value: sat != null ? String(sat) : '—', icon: 'fa-satellite' },
    { label: 'HDOP', value: hdop != null ? String(hdop) : '—', icon: 'fa-crosshairs' },
    { label: 'Sinal', value: rssi != null ? `${rssi} dBm` : '—', icon: 'fa-signal' },
    { label: 'Odômetro', value: odometer != null ? `${(odometer / 1000).toFixed(1)} km` : '—', icon: 'fa-road' },
    { label: 'Data/Hora', value: formatDateTime(p.deviceTime || p.fixTime), icon: 'fa-clock' },
  ];
});

/**
 * Callback executado a cada tick do playback
 * Atualiza marker, rota progressiva e follow pan
 */
const handlePlaybackTick = (index) => {
  startMark('playbackTick');

  // [AUDIT FIX] Guard contra array vazio
  if (routePoints.value.length === 0) {
    endMark('playbackTick');
    return;
  }

  // [AUDIT FIX] Guard contra índice fora dos limites
  if (index < 0 || index >= routePoints.value.length) {
    devWarn('[PLAY] Index fora dos limites:', index, '/', routePoints.value.length);
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
    // UX PREMIUM: Extrair velocidade para animação proporcional
    const speed = currentRoutePoint.value[2] || currentRoutePoint.value.speed || 30;

    // FASE 13.4.4: Validação defensiva de coordenadas
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      // 🔧 DEBUG: Log do tick (DEV only)
      if (process.env.NODE_ENV === 'development') {
        devLog('[PLAY] tick idx:', index, 'lat:', lat, 'lng:', lng, 'course:', course, 'speed:', speed);
      }
      pushPlayPoint([lat, lng]);

      // 🚗 UX PREMIUM: Atualiza marcador com animação (Bezier + bearing interpolado)
      // Lookahead: pegar próximo ponto para curva suave
      const nextRaw = routePoints.value[index + 1];
      const nextPoint = nextRaw ? {
        lat: nextRaw[0] || nextRaw.latitude,
        lng: nextRaw[1] || nextRaw.longitude
      } : null;
      updatePlayVehicleMarkerPlaybackPremium(lat, lng, course, speed, nextPoint);

      // 📍 FASE 13.4.1: Follow Mode com smartPan (anti-jitter + throttle)
      playTickCounter++;
      if (followPlay.value && playTickCounter % FOLLOW_PAN_INTERVAL === 0) {
        smartPan(lat, lng);
      }
    }
  }

  // [FIX PONTO 1] REMOVIDO: Bloco que movia o marker do device real
  // Durante playback, SÓ o playVehicleMarker deve se mover
  // O marker do device representa "posição atual real", não "posição do replay"
  endMark('playbackTick');
};

/**
 * Esconde o marker REAL do device durante playback
 * Usa deviceMarkerRegistry (provide/inject) - robusto e sem race condition
 * @param {number|string} deviceId - ID do dispositivo
 */
const hideDeviceMarker = (deviceId) => {
  if (!deviceId) return;
  const m = deviceMarkerRegistry.get(deviceId);
  const ok = deviceMarkerRegistry.hide(deviceId);
  devLog('[PLAY] 👻 hideDeviceMarker result', {
    id: deviceId,
    ok,
    hidden: m?.options?.__hidden,
    hasSetHidden: typeof m?.__setHidden === 'function',
    markerFound: !!m,
  });
};

/**
 * Mostra o marker REAL do device após parar playback
 * Usa deviceMarkerRegistry (provide/inject) - robusto e sem race condition
 * @param {number|string} deviceId - ID do dispositivo
 */
const showDeviceMarker = (deviceId) => {
  if (!deviceId) return;
  const m = deviceMarkerRegistry.get(deviceId);
  const ok = deviceMarkerRegistry.show(deviceId);
  devLog('[PLAY] 👁️ showDeviceMarker result', {
    id: deviceId,
    ok,
    hidden: m?.options?.__hidden,
    hasSetHidden: typeof m?.__setHidden === 'function',
    markerFound: !!m,
  });
};

/**
 * Callback executado quando estado do playback muda
 * Sincroniza refs locais com estado do composable
 * FIX: Esconde marker real do device durante playback
 */
const handleStateChange = (state) => {
  // START: Sincronizar estado + esconder marker real
  if (state.isPlaying && !isPlayingRoute.value) {
    isPlayingRoute.value = true;
    playRoutePoints.value = [];

    // GATE 4: Ativar bloqueio de realtime
    isPlaybackActive = true;
    isPlaybackSeeking = false;
    devLog('[GATE4] 🚪 Playback ativado - realtime bloqueado');

    // UX PREMIUM: Reset state para primeira animação sem jump
    cancelPlaybackAnim();
    lastPlaybackLatLng = null;
    lastPlaybackCourse = null;
    devLog('[PLAY UX] 🎬 Iniciando playback - preparando animação premium');

    // FIX: Esconder o marker REAL do device para não ter "dois carros"
    if (playbackDeviceId.value) {
      hideDeviceMarker(playbackDeviceId.value);
    }

    devLog('[PLAY] ▶️ Playback iniciado - marker real escondido');
  }

  // PAUSE: Manter gate ativo (recomendado para não "voltar" pro realtime)
  if (state.isPaused && isPlayingRoute.value) {
    isPlaybackActive = true; // mantém bloqueio
    devLog('[GATE4] ⏸️ Playback pausado - gate mantido ativo');
  }

  // STOP/END: Restaurar marker real + liberar realtime
  if (!state.isPlaying && !state.isPaused && isPlayingRoute.value) {
    isPlayingRoute.value = false;
    clearPlayVehicleMarker();

    // GATE 4: Desativar bloqueio de realtime
    isPlaybackActive = false;
    isPlaybackSeeking = false;
    devLog('[GATE4] 🚪 Playback parado - realtime liberado');

    // FIX: Restaurar o marker REAL do device
    if (playbackDeviceId.value) {
      showDeviceMarker(playbackDeviceId.value);
    }

    devLog('[PLAY] ⏹️ Playback parado - marker real restaurado');
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

// PATCH FINAL B: SVG inline como fallback (zero 404)
const DEFAULT_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
    <path fill="#2196F3" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
    <circle cx="12" cy="4" r="2" fill="#4CAF50"/>
  </svg>
`;

/**
 * Obtém a URL do ícone do dispositivo para o playback marker
 * @returns {string} URL da imagem do veículo ou '' se deve usar SVG fallback
 */
/**
 * Obtém a URL do ícone do dispositivo para o playback marker
 * FIX: Adiciona logging para debug de 404 e fallback robusto
 * PATCH FINAL B: Retorna '' se não encontrar, para usar SVG fallback
 * @returns {string} URL da imagem do veículo ou '' para fallback SVG
 */
// Mapeamento de categorias numéricas para nomes de ícone
const CATEGORY_MAP = {
  1: 'car', 2: 'motorcycle', 3: 'truck', 4: 'bus', 5: 'van',
  6: 'pickup', 7: 'tractor', 8: 'boat', 9: 'helicopter', 10: 'airplane',
  11: 'bicycle', 12: 'scooter', 13: 'animal', 14: 'person', 15: 'crane',
  // Adicionar mais conforme necessário
};

const getPlaybackDeviceIconUrl = () => {
  if (!playbackDeviceId.value) {
    devLog('[PlaybackIcon] Sem deviceId, usando SVG fallback');
    return '';
  }

  const deviceId = playbackDeviceId.value;
  const devicesList = store.state.devices?.list || {};
  const devicesCount = Object.keys(devicesList).length;
  const foundByKey = !!devicesList[deviceId];

  // Log detalhado de lookup
  devLog('[PlaybackIcon] lookup', {
    playbackDeviceId: deviceId,
    devicesCount,
    foundByKey,
  });

  // Buscar o dispositivo na store (tenta ambos formatos de ID)
  const device = devicesList[deviceId]
    || Object.values(devicesList).find(d =>
      d.id == deviceId || String(d.id) === String(deviceId)
    );

  if (!device) {
    devLog('[PlaybackIcon] ❌ Device não encontrado:', deviceId);
    return '';  // SVG fallback
  }

  // Log de device encontrado
  devLog('[PlaybackIcon] ✅ device found', {
    id: device.id,
    name: device.name,
    category: device.category,
    hasCustomImage: !!device.attributes?.image,
  });

  // Usar imagem customizada se existir e for URL válida
  if (device.attributes?.image) {
    const customUrl = device.attributes.image;
    devLog('[PlaybackIcon] 🖼️ Usando imagem customizada:', { deviceId, customUrl });
    return customUrl;
  }

  // Mapear categoria numérica para string se necessário
  let category = device.category;
  if (typeof category === 'number') {
    category = CATEGORY_MAP[category] || 'default';
    devLog('[PlaybackIcon] 🔢 Categoria numérica mapeada:', { original: device.category, mapped: category });
  }
  category = category || 'default';

  const iconUrl = `/tarkan/assets/images/categories/${category}.png`;

  devLog('[PlaybackIcon] 🚗 Usando categoria:', { deviceId, category, iconUrl });
  return iconUrl;
};

/**
 * [FIX BUG #1] Atualiza ou cria o marcador do veículo durante o play
 * VERSÃO SIMPLES: setLatLng imediato para seek/preview (sem animação)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude  
 * @param {number} course - Ângulo de rotação (0-360)
 */
const updatePlayVehicleMarker = (lat, lng, course) => {
  startMark('updatePlayVehicleMarker');

  // Validar parâmetros
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
    endMark('updatePlayVehicleMarker');
    return;
  }

  const leafletMap = map.value?.leafletObject;
  if (!leafletMap) {
    endMark('updatePlayVehicleMarker');
    return;
  }

  // Normalizar curso para rotação do ícone
  const normalizedCourse = normalizeCourse(course || 0);

  // Obter URL do ícone do dispositivo
  const iconUrl = getPlaybackDeviceIconUrl();

  // Criar ou atualizar o marcador de playback
  if (!playVehicleMarker.value) {
    // PATCH FINAL B: Usar SVG fallback se iconUrl estiver vazio
    const iconContent = iconUrl
      ? `<img src="${iconUrl}" style="width: 32px; height: 32px; object-fit: contain;" 
             onerror="this.outerHTML='${DEFAULT_ICON_SVG.replace(/'/g, "\\'").replace(/\n/g, ' ').trim()}'" />`
      : DEFAULT_ICON_SVG;

    // Criar novo marker com ícone do veículo real (categoria) ou SVG fallback
    // eslint-disable-next-line no-undef
    const icon = L.divIcon({
      className: 'play-vehicle-marker-icon',
      html: `<div class="play-marker-container" style="transform: rotate(${normalizedCourse}deg);">
               ${iconContent}
             </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // eslint-disable-next-line no-undef
    playVehicleMarker.value = L.marker([lat, lng], {
      icon,
      zIndexOffset: 999999, // Garantir que playback marker sempre fique acima
      interactive: false
    }).addTo(leafletMap);

    // PR#4: Registrar no overlayRegistry para cleanup centralizado
    overlayRegistry.addMarker(playVehicleMarker.value, 'playback');

    devLog('[PLAY] 🚗 Marker de playback criado com ícone:', iconUrl);
  } else {
    // SIMPLES: setLatLng direto para seek/preview
    playVehicleMarker.value.setLatLng([lat, lng]);

    // Atualizar rotação
    const el = playVehicleMarker.value.getElement?.();
    const container = el?.querySelector('.play-marker-container');
    if (container) {
      container.style.transform = `rotate(${normalizedCourse}deg)`;
    }
  }

  endMark('updatePlayVehicleMarker');
};

/**
 * [UX PREMIUM] Atualiza o marcador com animação suave (Bezier + bearing interpolado)
 * VERSÃO PREMIUM: Curva bezier, rotação interpolada, velocidade proporcional
 * USO: Apenas no handlePlaybackTick (tick automático), não no seek/preview
 * @param {number} lat - Latitude destino
 * @param {number} lng - Longitude destino  
 * @param {number} course - Ângulo destino (0-360)
 * @param {number} speedKmh - Velocidade em km/h para duração proporcional
 * @param {object|null} nextPoint - Próximo ponto para lookahead { lat, lng }
 */
const updatePlayVehicleMarkerPlaybackPremium = (lat, lng, course, speedKmh = 30, nextPoint = null) => {
  startMark('updatePlayVehicleMarkerPlaybackPremium');

  // Validar parâmetros
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
    endMark('updatePlayVehicleMarkerPlaybackPremium');
    return;
  }

  const normalizedCourse = normalizeCourse(course || 0);

  // Primeira chamada ou marker não existe: criar via função simples e inicializar state
  if (!playVehicleMarker.value) {
    updatePlayVehicleMarker(lat, lng, course);
    lastPlaybackLatLng = { lat, lng };
    lastPlaybackCourse = normalizedCourse;
    endMark('updatePlayVehicleMarkerPlaybackPremium');
    return;
  }

  // Calcular from/to para animação
  const from = lastPlaybackLatLng || { lat, lng };
  const to = { lat, lng };
  const courseFrom = lastPlaybackCourse ?? normalizedCourse;
  const courseTo = normalizedCourse;

  // Animar com sistema premium (Bezier + bearing interpolado)
  animateMarkerMovePremium({
    marker: playVehicleMarker.value,
    from,
    to,
    next: nextPoint,
    courseFrom,
    courseTo,
    speedKmh
  });

  // Atualizar state para próxima animação
  lastPlaybackLatLng = { lat, lng };
  lastPlaybackCourse = normalizedCourse;

  endMark('updatePlayVehicleMarkerPlaybackPremium');
};

/**
 * [FASE D1] Remove o marcador do veículo do play
 * ⚠️ Só remove o marker visual - NÃO altera estado isPlayingRoute
 * O estado é gerenciado por handleStateChange
 */
const clearPlayVehicleMarker = () => {
  // UX PREMIUM: Cancelar animação pendente e resetar estado
  cancelPlaybackAnim();
  lastPlaybackLatLng = null;
  lastPlaybackCourse = null;

  // Remove o marcador de playback via registry
  if (playVehicleMarker.value) {
    // Usa removeItem do registry - remove do mapa E do tracking interno
    overlayRegistry.removeItem(playVehicleMarker.value);
    playVehicleMarker.value = null;
    devLog('[PLAY] 🚨 Vehicle marker removido via registry');
  }

  // ⚠️ NÃO resetar isPlayingRoute aqui - isso é responsabilidade do handleStateChange
  // ⚠️ NÃO resetar playTickCounter aqui - isso é feito no resetPlay()
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

// FIX: Handlers de resize (declarados aqui para cleanup correto)
const handleWindowResize = () => {
  setTimeout(() => mapInteraction.invalidateSize(), 100);
};

const handleMapResize = () => {
  setTimeout(() => mapInteraction.invalidateSize(), 100);
};

// FIX PONTO 1: Função nomeada para listener (evita memory leak no removeEventListener)
const onHideFollowTooltip = () => followDevice.hideTooltipManually();

// ===============================
// FPS MONITOR (diagnóstico leve)
// ===============================
let fpsRaf = 0;
function fpsTick() {
  fpsRaf = requestAnimationFrame(fpsTick);
  if (!__KORE_DEBUG__.enabled) return;

  __KORE_DEBUG__.frames++;
  const now = performance.now();
  if (now - __KORE_DEBUG__.lastFpsTs >= 1000) {
    __KORE_DEBUG__.fps = __KORE_DEBUG__.frames;
    __KORE_DEBUG__.frames = 0;
    __KORE_DEBUG__.lastFpsTs = now;

    // PATCH 2: Incluir stats do overlayRegistry no diagnóstico
    const registryStats = overlayRegistry.getStats();
    __KORE_DEBUG__.active = registryStats.active || 0;
    __KORE_DEBUG__.leaked = registryStats.leaked || 0;

    __KORE_DEBUG__.log(
      `fps=${__KORE_DEBUG__.fps} ` +
      `layers=${__KORE_DEBUG__.layers} ` +
      `markers=${__KORE_DEBUG__.markers} ` +
      `active=${__KORE_DEBUG__.active} ` +
      `leaked=${__KORE_DEBUG__.leaked} ` +
      `listeners=${__KORE_DEBUG__.listeners}`
    );
  }
}

onMounted(() => {
  // REMOVIDO: ResizeObserver manual (agora no composable useMapInteraction)
  // Bind dos handlers de geofence após mapa pronto
  mapInteraction.bindGeofenceHandlers();

  // ===============================
  // KORE DEBUG: Iniciar FPS monitor e métricas de layers
  // ===============================
  fpsTick();
  
  // Rastrear layers/markers via eventos do Leaflet
  const leafletMap = map.value?.leafletObject;
  if (leafletMap) {
    listenerRegistry.onLeaflet(leafletMap, "layeradd", (e) => {
      if (!__KORE_DEBUG__.enabled) return;
      __KORE_DEBUG__.layers++;
      // Heurística simples: marker tem getLatLng
      if (e?.layer?.getLatLng) __KORE_DEBUG__.markers++;
    });

    listenerRegistry.onLeaflet(leafletMap, "layerremove", (e) => {
      if (!__KORE_DEBUG__.enabled) return;
      __KORE_DEBUG__.layers = Math.max(0, __KORE_DEBUG__.layers - 1);
      if (e?.layer?.getLatLng) __KORE_DEBUG__.markers = Math.max(0, __KORE_DEBUG__.markers - 1);
    });
    
    __KORE_DEBUG__.log('FPS monitor e métricas de layers iniciados');
  }

  // ============================================================================
  // EVENT LISTENERS - Eventos do sistema (com funções nomeadas para cleanup)
  // ============================================================================

  // Listener para fechar o tooltip de follow (delegado ao composable)
  // FIX PONTO 1: Usando função nomeada para cleanup correto
  document.addEventListener("hideFollowTooltip", onHideFollowTooltip);

  // Listener para abrir o panel flotante
  document.addEventListener("openFloatingPanel", onOpenFloatingPanel);

  // Escutar eventos de commandResult desde Traccar
  document.addEventListener("traccarEvent", onTraccarEvent);

  // Keyboard listeners para Ctrl+Click (registrados aqui, removidos no unmount)
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  // FIX: Listeners de resize (handlers declarados acima para cleanup correto)
  window.addEventListener('resize', handleWindowResize);
  document.addEventListener('mapResize', handleMapResize);

  // Helper global para forçar resize manualmente
  window.$resizeMap = () => {
    mapInteraction.invalidateSize();
    console.log('🗺️ Mapa redimensionado manualmente');
  };

  // REMOVIDO: watcher de isFollowingId (agora no composable useFollowDevice)
})

onUnmounted(() => {
  // ===============================
  // KORE DEBUG: Cleanup de FPS monitor e listeners
  // ===============================
  cancelAnimationFrame(fpsRaf);
  listenerRegistry.cleanup();
  __KORE_DEBUG__.log('FPS monitor parado e listeners limpos');

  // FASE E2.1: Cleanup Markers composable
  markers.cleanup();
  devLog('[Cleanup] Markers composable destruído');

  // Cleanup FollowDevice composable (FASE D3)
  followDevice.cleanup();
  devLog('[Cleanup] FollowDevice composable destruído');

  // FASE E1.1: Cleanup MapInteraction composable (remove TODOS os listeners automaticamente)
  mapInteraction.cleanup();
  devLog('[Cleanup] MapInteraction composable destruído');

  // FASE E1.1: Cleanup manual de bounds REMOVIDO - agora feito pelo composable

  // FASE D1: STUB - Layer Manager não implementado, cleanup removido
  // TODO(E3): Remover stubs do layerManager

  // Cleanup de event listeners do sistema (usando funções nomeadas)
  // FIX PONTO 1: Agora remove corretamente (mesma referência de função)
  document.removeEventListener("hideFollowTooltip", onHideFollowTooltip);
  document.removeEventListener("openFloatingPanel", onOpenFloatingPanel);
  document.removeEventListener("traccarEvent", onTraccarEvent);

  // GUARD RAIL: Cleanup de keyboard listeners para evitar memory leak
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)

  // FIX: Cleanup de resize listeners (usando referências corretas)
  window.removeEventListener('resize', handleWindowResize);
  document.removeEventListener('mapResize', handleMapResize);

  // Remover helper global
  if (window.$resizeMap) {
    delete window.$resizeMap;
  }

  // FIX PONTO 4: Cleanup explícito do searchControl (segurança extra)
  if (window.$searchControl) {
    if (map.value?.leafletObject) {
      try {
        map.value.leafletObject.removeControl(window.$searchControl);
      } catch (e) {
        // Ignora se já foi removido pelo registry
      }
    }
    overlayRegistry.clear('search');
    window.$searchControl = null;
    devLog('[Cleanup] SearchControl removido');
  }

  // REMOVIDO: stopFollowingWatch (agora no composable)

  // FASE C1: Cleanup do playback composable
  if (playback) {
    playback.cleanup();
    playback = null;
    devLog('[Cleanup] Playback composable destruído');
  }

  // REMOVIDO: Cleanup duplicado de followDevice e mapInteraction (já feito acima)

  // PR#4: Cleanup centralizado de TODOS overlays do mapa
  overlayRegistry.clearAll();
  devLog('[Cleanup] OverlayRegistry limpo');

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

  // PR#4: Expor clearAllOverlays para testes via console
  window.$map.__clearFn = clearAllOverlays;

  // PR#4 FIX: Setar referência do mapa no registry para cleanup robusto
  const m = map.value?.leafletObject;
  if (m) {
    overlayRegistry.setMap(m);
  }

  // FASE E1.1: Registrar listeners via composable (zero memory leak)
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
      // Se já está adicionado, removemos - e limpa do registry
      map.removeControl(window.$searchControl);
      overlayRegistry.clear('search'); // Limpa layers e control dessa categoria
      ElMessage.success(KT('map.search.disabled') || 'Busca desativada');
    } else {
      // Criamos uma nova camada para os marcadores buscáveis
      const searchLayer = new L.LayerGroup();
      map.addLayer(searchLayer);

      // PR#4 FIX: Registrar searchLayer no registry para cleanup automático
      overlayRegistry.addLayer(searchLayer, 'search');

      // Adicionamos os dispositivos como marcadores buscáveis
      if (store.state.devices && store.state.devices.list) {
        Object.values(store.state.devices.list).forEach(device => {
          if (device.latitude && device.longitude) {
            const marker = L.marker([device.latitude, device.longitude]);
            marker.bindPopup(device.name || 'Sem nome');
            // É importante que a propriedade name coincida com propertyName no controle de busca
            marker.name = device.name || 'Sem nome';
            searchLayer.addLayer(marker);
            // PR#4 FIX: Registrar cada marker no registry
            overlayRegistry.addMarker(marker, 'search');
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

      // PR#4 FIX: Registrar control no registry para cleanup automático
      overlayRegistry.addControl(window.$searchControl, 'search');

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

// [PONTO 1] Cache de device REMOVIDO - não mais movemos o marker do device real durante playback

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
  console.log(`🎨 [PR#4] drawFullRoute: ${arr.length} pontos`);

  // NORMALIZAR: converter formato, filtrar inválidos, ordenar por tempo
  const normalized = normalizeRoutePoints(arr);
  console.log(`  ✅ Normalizados: ${normalized.length} válidos`);

  fullRoutePoints.value = normalized;

  // Markers seguem a rota completa (se toggle ativado)
  markerPoints.value = arr;

  // Manter compatibilidade com código legado
  routePoints.value = arr;
  endMark('drawFullRoute');
};

/**
 * Reseta a rota do play (limpa apenas a camada de reprodução progressiva)
 * ⚠️ NÃO limpar o marker aqui - ele é reutilizado durante o playback
 * O marker só é limpo em: stopPlayRoute(), updateRoute() (nova rota)
 */
const resetPlay = () => {
  // Limpa APENAS a polyline progressiva (não o marker!)
  playRoutePoints.value = [];
  // Resetar contador de ticks para throttle do follow
  playTickCounter = 0;
  devLog('[PLAY] 🔄 Rota progressiva resetada (marker preservado)');
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
 * PR#4: Limpa TODOS os overlays do mapa (rota, markers, layers)
 * Ordem crítica: listeners → markers → polylines → layers → refs locais
 * @param {Object} options - Opções de limpeza
 * @param {string} options.reason - Motivo da limpeza (para debug)
 */
const clearAllOverlays = ({ reason = 'unknown' } = {}) => {
  console.log(`🧹 [PR#4] clearAllOverlays: ${reason}`);

  // DEBUG: Stats ANTES do clear
  const statsBefore = overlayRegistry.getStats();
  console.log('  📊 Stats ANTES:', statsBefore);

  try {
    // 1. Limpar via OverlayRegistry (gerencia listeners, markers, polylines, layers)
    overlayRegistry.clearAll();

    // 2. Limpar refs locais (Vue reactivity)
    fullRoutePoints.value = [];
    playRoutePoints.value = [];
    markerPoints.value = [];
    routePoints.value = [];

    // 3. Limpar carLayer (veículos) via clearLayers (Leaflet native)
    if (carLayer.value?.leafletObject) {
      carLayer.value.leafletObject.clearLayers();
    }

    // 4. Resetar estados de visualização
    showRouteMarkers.value = false;
    showHeat.value = false;
    isPlayingRoute.value = false;
    currentRoutePoint.value = null;

    // 5. Limpar marcador do veículo do play
    clearPlayVehicleMarker();

    // DEBUG: Stats DEPOIS do clear
    const statsAfter = overlayRegistry.getStats();
    console.log('  ✅ Stats DEPOIS:', statsAfter);
    console.log(`  🎯 Removidos: ${statsAfter.removed - statsBefore.removed}`);
  } catch (error) {
    console.error('[kore-map] ❌ Erro em clearAllOverlays:', error);
  }
};

/**
 * Atualiza a rota no mapa (função principal exposta para components externos)
 * @param {Array} points - Array de pontos da rota (objetos com lat/lng ou arrays)
 * @param {Boolean} show - Se true, mostra markers; se false, oculta markers
 * @param {Number|String} deviceId - ID do dispositivo para obter ícone correto no playback
 */
const updateRoute = (points, show = true, deviceId = null) => {
  devLog('[kore-map] updateRoute chamado:', points.length, 'pontos, show =', show, 'deviceId =', deviceId);

  // FIX: Armazenar deviceId para uso no playback marker
  playbackDeviceId.value = deviceId;

  // [FIX PONTO 2+3] Parar e limpar playback anterior ANTES de processar nova rota
  // Isso evita vazamento de timers, markers fantasmas e estados inconsistentes
  if (playback) {
    playback.stop(); // Para timer interno do composable
  }
  clearPlayVehicleMarker(); // Remove marker visual do mapa
  resetPlay(); // Limpa polyline progressiva e refs

  // Resetar índice na store para sincronizar timeline
  store.commit("devices/setRoutePlayPoint", 0);

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

  // [FIX BUG #4] Inicializar playback com os novos pontos
  // Só inicializa DEPOIS que tudo foi limpo e pontos estão prontos
  if (points.length > 0) {
    initializePlayback(points.length);
    devLog('[kore-map] Playback inicializado com', points.length, 'pontos');
  }

  // Manter compatibilidade com código legado
  showRoutePoints.value = true; // Rota sempre visível agora

  if (points.length > 0) {
    let tmp = [];
    for (var p in points) {
      // FIX: Suportar tanto objetos quanto arrays
      const point = points[p];
      const lat = point.latitude ?? point[0];
      const lng = point.longitude ?? point[1];
      if (lat != null && lng != null) {
        tmp.push([lat, lng]);
      }
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

// PR#4: Expor clearAllOverlays para cleanup de overlays
app.provide('clearAllOverlays', clearAllOverlays);

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
  padding: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  min-width: 280px;
  /* [FIX BUG #3] Reduzido de 380px para 280px */
  max-width: 320px;
}

/* ============================================================================
   Play Vehicle Marker - Ícone do veículo durante playback
   ============================================================================ */
.play-vehicle-marker-icon {
  background: transparent !important;
  border: none !important;
}

.play-vehicle-marker-icon .play-marker-container {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* UX POLISH: Rotação suave do ícone (sincronizado com JS) */
  transition: transform 0.25s linear;
}

.play-vehicle-marker-icon .play-marker-container i {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
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
  /* UX POLISH: Transição suave para fade in/out */
  transition: opacity 0.3s ease, transform 0.3s ease;
}

/* UX POLISH: Animação de entrada/saída do HUD */
.route-mini-hud-enter-active,
.route-mini-hud-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.route-mini-hud-enter-from,
.route-mini-hud-leave-to {
  opacity: 0;
  transform: translateY(10px);
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
  line-clamp: 2;
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
    min-width: 260px;
    /* [FIX BUG #3] Reduzido */
    padding: 8px;
  }

  .kore-map-root .route-details-panel {
    width: 260px;
  }
}

@media (max-width: 480px) {
  .kore-map-root .modern-playback-widget {
    min-width: 220px;
    /* [FIX BUG #3] Reduzido */
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
<!-- =========================================================================== -->
<!-- CSS GLOBAL MIGRADO para: src/assets/css/kore-map.poppers.css               -->
<!-- Importado via main.js para funcionar com poppers teleportados              -->
<!-- =========================================================================== -->
