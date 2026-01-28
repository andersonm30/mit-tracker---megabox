<template>
    <LMap id="LMap" :options="{ preferCanvas: true, zoomControl: false }" :use-global-leaflet="true" ref="map"
        :zoom="zoomForce" :min-zoom="3" :max-zoom="21" :zoom-animation="true" :fade-animation="true"
        :marker-zoom-animation="false" @ready="mapReady($event)" @click="mapClick" @mousemove="mapMove" :center="center"
        @update:zoom="zoomUpdated($event)" style="width: 100%;height: 100%;">

        <!-- Branding helpers imported in script setup -->
        <street-view v-if="store.state.devices.streetview" />


        <l-control position="topright">
            <!-- Contenedor vertical simple con fondo negro transparente -->
            <div class="vertical-controls-container">
                <el-button type="danger" size="small" v-if="store.state.devices.showRoutes" @click="closeRoutes()"
                    style="margin-bottom: 1px;"><i class="fas fa-times"></i></el-button>

                <!-- 1. Compartir -->
                <el-button size="small" style="margin-bottom: 1px;"
                    v-if="((store.state.server.serverInfo.attributes['tarkan.enableAdvancedPerms'] && store.getters.advancedPermissions(24))) || (!store.state.server.serverInfo.attributes['tarkan.enableAdvancedPerms'] && !store.state.auth.attributes['isShared'] && !store.getters['isReadonly'])"
                    @click="editSharesRef.showShares()"><i class="fas fa-share-alt"></i></el-button>

                <!-- 2. Ojo (Visibilidad) -->
                <el-dropdown v-if="!store.state.auth.attributes['isShared']" size="small" trigger="click"
                    placement="left-start" popper-class="kore-map-popper kore-map-popper--dark" style="margin-bottom: 1px; display: block;">
                    <el-button size="small"><i class="fas fa-eye"></i></el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <!-- Contenido del dropdown (se mantiene igual) -->
                            <div style="padding: 8px 10px;">
                                <el-input v-model="eyeFilter" size="small" placeholder="Buscar..."
                                    prefix-icon="el-icon-search"></el-input>
                            </div>

                            <div class="section-title">
                                <i class="fas fa-cog" style="margin-right: 6px;"></i>{{ KT('preferences') }}
                            </div>

                            <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                                <i class="fas fa-globe" style="width: 20px; font-size: 11px;"></i>
                                <span
                                    style="margin-left: 12px; font-size: 11px; flex-grow: 1; font-family: 'Roboto', sans-serif;">{{
                                    KT('map.showCluster') }}</span>
                                <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                                    :model-value="store.getters['mapPref']('clustered', true)"
                                    @click="store.dispatch('setMapPref', ['clustered', !store.getters['mapPref']('clustered', true)])"></el-switch>
                            </div>

                            <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                                <i class="fas fa-object-group" style="width: 20px; font-size: 11px;"></i>
                                <span
                                    style="margin-left: 12px; font-size: 11px; flex-grow: 1; font-family: 'Roboto', sans-serif;">{{
                                    KT('map.showGroups') }}</span>
                                <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                                    :model-value="store.getters['mapPref']('groups')"
                                    @click="store.dispatch('setMapPref', 'groups')"></el-switch>
                            </div>

                            <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                                <i class="fas fa-draw-polygon" style="width: 20px; ; font-size: 11px;"></i>
                                <span
                                    style="margin-left: 12px; font-size: 11px; flex-grow: 1; font-family: 'Roboto', sans-serif;">{{
                                    KT('map.showGeofences') }}</span>
                                <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                                    :model-value="showGeofences"
                                    @change="(value) => store.dispatch('setMapPref', ['showGeofences', value])"></el-switch>
                            </div>

                            <div v-if="showGeofences"
                                style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                                <i class="fas fa-tag" style="width: 20px; font-size: 11px; margin-left: 20px;"></i>
                                <span
                                    style="margin-left: 12px; font-size: 11px; flex-grow: 1; font-family: 'Roboto', sans-serif;">{{
                                    KT('map.showGeofenceNames') }}</span>
                                <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                                    :model-value="store.getters['mapPref']('geofenceNames')"
                                    @change="(value) => store.dispatch('setMapPref', ['geofenceNames', value])"></el-switch>
                            </div>

                            <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                                <i class="fas fa-tag" style="width: 20px; font-size: 11px;"></i>
                                <span
                                    style="margin-left: 12px; font-size: 11px; flex-grow: 1; font-family: 'Roboto', sans-serif;">{{
                                    KT('map.showNames') }}</span>
                                <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                                    :model-value="store.getters['mapPref']('name')"
                                    @click="store.dispatch('setMapPref', 'name')"></el-switch>
                            </div>

                            <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                                <i class="fas fa-id-card" style="width: 20px; font-size: 11px;"></i>
                                <span
                                    style="margin-left: 12px; font-size: 11px; flex-grow: 1; font-family: 'Roboto', sans-serif;">{{
                                    KT('map.showPlates') }}</span>
                                <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                                    :model-value="store.getters['mapPref']('plate')"
                                    @click="store.dispatch('setMapPref', 'plate')"></el-switch>
                            </div>

                            <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                                <i class="fas fa-info-circle" style="width: 20px; font-size: 11px;"></i>
                                <span
                                    style="margin-left: 12px; font-size: 11px; flex-grow: 1; font-family: 'Roboto', sans-serif;">{{
                                    KT('map.showStatus') }}</span>
                                <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                                    :model-value="store.getters['mapPref']('status')"
                                    @click="store.dispatch('setMapPref', 'status')"></el-switch>
                            </div>

                            <div style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 3px;">
                                <i class="fas fa-crosshairs" style="width: 20px; font-size: 11px;"></i>
                                <span
                                    style="margin-left: 12px; font-size: 11px; flex-grow: 1; font-family: 'Roboto', sans-serif;">{{
                                    KT('map.showPrecision') }}</span>
                                <el-switch style="min-width: 36px; justify-content: flex-end;" size="small"
                                    :model-value="store.getters['mapPref']('precision')"
                                    @click="store.dispatch('setMapPref', 'precision')"></el-switch>
                            </div>

                            <div class="section-title"
                                style="display: flex; justify-content: space-between; align-items: center;">
                                <span><i class="fas fa-car" style="margin-right: 6px;"></i>{{ KT('device.devices')
                                    }}</span>
                                <div style="font-size: 9px; white-space: nowrap;">
                                    <a @click.prevent="eyeAll(true)"
                                        style="color: var(--el-color-primary);text-decoration: none;margin-right: 4px;font-family: 'Roboto', sans-serif;">{{
                                        KT('all') }}</a>
                                    <span style="margin: 0 2px;font-family: 'Roboto', sans-serif;">|</span>
                                    <a @click.prevent="eyeAll(false)"
                                        style="color: var(--el-color-primary);text-decoration: none;margin-left: 4px;font-family: 'Roboto', sans-serif;">{{
                                        KT('none') }}</a>
                                </div>
                            </div>

                            <div style="padding-top: 2px;">
                                <el-dropdown-item v-for="(t, tk) in availableTypes" :key="tk"
                                    @click="store.dispatch('devices/toggleHiddenFilter', t.key)"
                                    style="height: auto !important; padding: 0 !important; display: block !important;">
                                    <div
                                        style="display: flex; align-items: center; padding: 5px 12px; margin-bottom: 2px;">
                                        <i class="fas fa-car" style="width: 20px; font-size: 11px;"></i>
                                        <span
                                            style="margin-left: 12px; font-size: 11px; flex-grow: 1; font-family: 'Roboto', sans-serif;">{{
                                                KT('map.devices.' + t.key)
                                            }}</span>
                                        <el-switch :key="'chk' + t.key"
                                            style="min-width: 36px; justify-content: flex-end;" size="small"
                                            :model-value="store.getters['devices/isHiddenFilter'](t.key)"
                                            disabled></el-switch>
                                    </div>
                                </el-dropdown-item>
                            </div>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>

                <!-- 3. Capas de mapa -->
                <el-dropdown size="small" trigger="click" placement="left-start" popper-class="kore-map-popper kore-map-popper--dark"
                    style="margin-bottom: 1px; display: block;">
                    <el-button size="small"><i class="fas fa-layer-group"></i></el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <div class="section-title">
                                <i class="fas fa-layer-group" style="margin-right: 6px;"></i>{{ KT('map.layers') ||
                                'Capas' }}
                            </div>
                            <el-dropdown-item v-for="(m, mk) in availableMaps" :key="'map-' + mk"
                                @click="changeMap(m.id)" style="padding: 5px 12px; min-height: auto;">
                                <el-radio v-model="selectedMap" :label="m.id" size="small"
                                    style="margin-right: 0; display: flex; align-items: center;">
                                    <span
                                        style="font-size: 11px; font-weight: 500; white-space: nowrap; font-family: 'Roboto', sans-serif;">{{
                                        m.name }}</span>
                                </el-radio>
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>

                <!-- 4. Asistente Virtual (solo si está configurado WhatsApp) -->
                <el-button size="small" style="margin-bottom: 1px;"
                    v-if="store.state.server.labelConf.whatsapp && store.state.server.labelConf.whatsapp !== ''"
                    @click="openWhatsAppAssistant" title="Asistente Virtual">
                    <i class="fas fa-headset"></i>
                </el-button>

                <el-button size="small" style="margin-bottom: 1px;" @click="toggleSearch">
                    <i class="fas fa-search"></i>
                </el-button>
            </div>
        </l-control>

        <l-control position="topleft" v-if="!store.state.auth.attributes?.['isShared']">
            <div class="status-counters">
                <el-tooltip placement="right-start" :content="KT('all')">
                    <div class="counter all"
                        :class="{ active: store.state.devices.applyFilters.statusFilter === 'all' }"
                        @click="store.dispatch('devices/setStatusFilter', 'all')">
                        {{ store.getters['devices/deviceCount'].all }}
                    </div>
                </el-tooltip>
                <el-tooltip placement="right-start" :content="KT('online')">
                    <div class="counter online"
                        :class="{ active: store.state.devices.applyFilters.statusFilter === 'online' }"
                        @click="store.dispatch('devices/setStatusFilter', 'online')">
                        {{ store.getters['devices/deviceCount'].online }}
                    </div>
                </el-tooltip>
                <el-tooltip placement="right-start" :content="KT('offline')">
                    <div class="counter offline"
                        :class="{ active: store.state.devices.applyFilters.statusFilter === 'offline' }"
                        @click="store.dispatch('devices/setStatusFilter', 'offline')">
                        {{ store.getters['devices/deviceCount'].offline }}
                    </div>
                </el-tooltip>
                <el-tooltip placement="right-start" :content="KT('unknown')">
                    <div class="counter unknown"
                        :class="{ active: store.state.devices.applyFilters.statusFilter === 'unknown' }"
                        @click="store.dispatch('devices/setStatusFilter', 'unknown')">
                        {{ store.getters['devices/deviceCount'].unknown }}
                    </div>
                </el-tooltip>
                <el-tooltip placement="right-start" :content="KT('device.moving')">
                    <div class="counter motion" :class="{ active: store.state.devices.applyFilters.motionFilter }"
                        @click="store.dispatch('devices/toggleMotionFilter')">
                        {{ store.getters['devices/deviceCount'].motion }}
                    </div>
                </el-tooltip>
            </div>


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
                        <button @click="stopPlayRoute()" class="control-btn secondary-btn" title="Detener">
                            <i class="fas fa-stop"></i>
                        </button>
                        <button @click="restartPlayRoute()" class="control-btn secondary-btn" title="Reiniciar">
                            <i class="fas fa-redo-alt"></i>
                        </button>
                        <button @click="moveBackward()" class="control-btn secondary-btn" title="Retroceder">
                            <i class="fas fa-step-backward"></i>
                        </button>
                    </div>

                    <!-- Primary Play/Pause Button -->
                    <div class="primary-control">
                        <button v-if="routePlayState" @click="pausePlayRoute()" class="control-btn primary-btn"
                            title="Pausar">
                            <i class="fas fa-pause"></i>
                        </button>
                        <button v-else @click="runPlayRoute()" class="control-btn primary-btn" title="Reproducir">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>

                    <!-- Secondary Controls -->
                    <div class="secondary-controls">
                        <button @click="moveForward()" class="control-btn secondary-btn" title="Avanzar">
                            <i class="fas fa-step-forward"></i>
                        </button>
                        <button @click="togglePlaybackSpeed()" class="control-btn speed-btn"
                            :title="'Velocidad: ' + playbackSpeed.value + 'x'">
                            {{ playbackSpeed.value }}x
                        </button>
                        <button @click="showRouteDetails()" class="control-btn secondary-btn" title="Información">
                            <i class="fas fa-info"></i>
                        </button>
                    </div>
                </div>
            </div>
        </l-control>

        <!-- Painel de controle centralizado na parte inferior -->

        <l-control position="topright">
            <!-- Painel de detalhes lateral -->
            <div v-if="showDetailsPanel && currentRoutePoint" class="route-details-panel">
                <div class="route-details-header">
                    <div><i class="fas fa-info-circle"></i> {{ KT('attribute.details') || 'Detalhes do Ponto' }}</div>
                    <div class="route-details-close" @click="showDetailsPanel = false"><i class="fas fa-times"></i>
                    </div>
                </div>
                <div class="route-details-content">
                    <div v-if="currentRoutePoint">
                        <div class="route-detail-item compact">
                            <div>
                                <div class="detail-label"><i class="fas fa-map-marker-alt"></i> {{
                                    KT('attribute.position') ||
                                    'Posição'
                                    }}
                                </div>
                                <div class="detail-value small">{{ currentRoutePoint.latitude.toFixed(6) }}, {{
                                    currentRoutePoint.longitude.toFixed(6) }}</div>
                            </div>
                        </div>

                        <div class="route-detail-item compact">
                            <div>
                                <div class="detail-label"><i class="fas fa-compass"></i> {{ KT('attribute.course') ||
                                    'Direção'
                                    }}</div>
                                <div class="detail-value small">{{ getCardinalDirection(currentRoutePoint.course) }} ({{
                                    currentRoutePoint.course || 0 }}°)</div>
                            </div>
                        </div>

                        <div class="route-detail-item compact">
                            <div>
                                <div class="detail-label"><i class="fas fa-clock"></i> {{ KT('attribute.time') || 'Data e Hora' }}</div>
                                <div class="detail-value small">{{ formatDateTime(currentRoutePoint.deviceTime) }}</div>
                            </div>
                        </div>

                        <div class="route-detail-item compact" v-if="currentRoutePoint.address">
                            <div>
                                <div class="detail-label"><i class="fas fa-road"></i> {{ KT('attribute.address') ||
                                    'Endereço'
                                    }}</div>
                                <div class="detail-value small">{{ currentRoutePoint.address }}</div>
                            </div>
                        </div>

                        <!-- Grid de atributos principales (3x3 grid) -->
                        <div class="main-attributes-grid"
                            style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                            <!-- Ignición -->
                            <div class="main-attribute-card">
                                <div class="attribute-icon"
                                    :class="{ 'active': currentRoutePoint.attributes && currentRoutePoint.attributes.ignition === true }">
                                    <i class="fas fa-key"></i>
                                </div>
                                <div class="attribute-info">
                                    <div class="attribute-value">{{ currentRoutePoint.attributes &&
                                        currentRoutePoint.attributes.ignition
                                        ?
                                        KT('device.ignitionOn') : KT('device.ignitionOff') }}</div>
                                </div>
                            </div>

                            <!-- Bloqueado -->
                            <div class="main-attribute-card">
                                <div class="attribute-icon"
                                    :class="{ 'danger': currentRoutePoint.attributes && currentRoutePoint.attributes.blocked === true }">
                                    <i class="fas fa-lock"></i>
                                </div>
                                <div class="attribute-info">
                                    <div class="attribute-value">{{ currentRoutePoint.attributes &&
                                        currentRoutePoint.attributes.blocked ?
                                        KT('yes') : KT('no') }}</div>
                                </div>
                            </div>

                            <!-- Satélites -->
                            <div class="main-attribute-card">
                                <div class="attribute-icon">
                                    <i class="fas fa-satellite"></i>
                                </div>
                                <div class="attribute-info">
                                    <div class="attribute-value">{{ currentRoutePoint.attributes &&
                                        currentRoutePoint.attributes.sat || 0
                                        }}
                                    </div>
                                </div>
                            </div>

                            <!-- Potencia/Batería -->
                            <div class="main-attribute-card">
                                <div class="attribute-icon"
                                    :class="getBatteryClass(currentRoutePoint.attributes && currentRoutePoint.attributes.power)">
                                    <i class="fas fa-car-battery"></i>
                                </div>
                                <div class="attribute-info">
                                    <div class="attribute-value">{{ currentRoutePoint.attributes &&
                                        currentRoutePoint.attributes.power ?
                                        parseFloat(currentRoutePoint.attributes.power).toFixed(1) + 'V' : '-' }}</div>
                                </div>
                            </div>

                            <!-- Distancia Total -->
                            <div class="main-attribute-card">
                                <div class="attribute-icon">
                                    <i class="fas fa-road"></i>
                                </div>
                                <div class="attribute-info">
                                    <div class="attribute-value">{{ currentRoutePoint.attributes &&
                                        currentRoutePoint.attributes.totalDistance
                                        ? (currentRoutePoint.attributes.totalDistance / 1000).toFixed(2) + ' km' : '-'
                                        }}</div>
                                </div>
                            </div>

                            <!-- Batería Interna -->
                            <div class="main-attribute-card">
                                <div class="attribute-icon"
                                    :class="getBatteryClass(currentRoutePoint.attributes && currentRoutePoint.attributes.batteryLevel)">
                                    <i
                                        :class="getBatteryIcon(currentRoutePoint.attributes && currentRoutePoint.attributes.batteryLevel)"></i>
                                </div>
                                <div class="attribute-info">
                                    <div class="attribute-value">{{ currentRoutePoint.attributes &&
                                        currentRoutePoint.attributes.battery ?
                                        parseFloat(currentRoutePoint.attributes.battery).toFixed(1) + 'V' :
                                        (currentRoutePoint.attributes &&
                                        currentRoutePoint.attributes.batteryLevel ?
                                        currentRoutePoint.attributes.batteryLevel +
                                        '%' : '-')
                                        }}
                                    </div>
                                </div>
                            </div>

                            <!-- Distance (Trip) -->
                            <div class="main-attribute-card">
                                <div class="attribute-icon">
                                    <i class="fas fa-route"></i>
                                </div>
                                <div class="attribute-info">
                                    <div class="attribute-value">{{ currentRoutePoint.attributes &&
                                        currentRoutePoint.attributes.distance
                                        ?
                                        (currentRoutePoint.attributes.distance / 1000).toFixed(2) + ' km' : '-' }}</div>
                                </div>
                            </div>

                            <!-- Hours -->
                            <div class="main-attribute-card">
                                <div class="attribute-icon">
                                    <i class="fas fa-hourglass-half"></i>
                                </div>
                                <div class="attribute-info">
                                    <div class="attribute-value">{{ currentRoutePoint.attributes &&
                                        currentRoutePoint.attributes.hours ?
                                        currentRoutePoint.attributes.hours.toFixed(2) + ' h' : '-' }}</div>
                                </div>
                            </div>

                            <!-- Temperature -->
                            <div class="main-attribute-card">
                                <div class="attribute-icon"
                                    :class="getTemperatureClass(currentRoutePoint.attributes && currentRoutePoint.attributes.temperature)">
                                    <i class="fas fa-thermometer-half"></i>
                                </div>
                                <div class="attribute-info">
                                    <div class="attribute-value">{{ currentRoutePoint.attributes &&
                                        currentRoutePoint.attributes.temperature ?
                                        currentRoutePoint.attributes.temperature + '°C' : '-' }}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Otros atributos con scroll -->
                        <div class="route-detail-item"
                            v-if="currentRoutePoint.attributes && Object.keys(currentRoutePoint.attributes).length > 0">
                            <div>
                                <div class="detail-label"><i class="fas fa-list-alt"></i> {{
                                    KT('device.otherAttributes') ||
                                    'Outros Atributos' }}</div>

                                <div class="detail-attributes scrollable">
                                    <div class="attribute-item" v-for="(value, key) in filteredAttributes" :key="key">
                                        <div class="attribute-key small">{{ KT('attribute.' + key) || key }}</div>
                                        <div class="attribute-value small">{{ formatAttributeValue(key, value) }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="route-no-point">
                        {{ KT('route.noPointSelected') || 'Nenhum ponto selecionado' }}
                    </div>
                </div>
            </div>

        </l-control>


        <l-control position="bottomleft" v-if="currentRoutePoint && showRouteDetailsPanel">




            <div class="player-control-panel">
                <!-- Linha superior: ícones de status -->
                <div class="route-info-row status-icons">
                    <!-- Ícone de ignição -->
                    <div class="status-icon"
                        :class="{ 'active': currentRoutePoint.attributes && currentRoutePoint.attributes.ignition === true }"
                        :title="KT('device.ignition') + ': ' + (currentRoutePoint.attributes && currentRoutePoint.attributes.ignition === true ? KT('device.ignitionOn') : KT('device.ignitionOff'))">
                        <i class="fas fa-key"></i>
                    </div>

                    <!-- Ícone de bloqueio -->
                    <div class="status-icon"
                        :class="{ 'danger': currentRoutePoint.attributes && currentRoutePoint.attributes.blocked === true }"
                        :title="currentRoutePoint.attributes && currentRoutePoint.attributes.blocked === true ? KT('device.blocked') : KT('device.unblocked')">
                        <i class="fas fa-lock"></i>
                    </div>

                    <!-- Ícone de movimento -->
                    <div class="status-icon" :class="{ 'active': currentRoutePoint.speed > 0 }"
                        :title="currentRoutePoint.speed > 0 ? KT('device.moving') : KT('device.stopped')">
                        <i class="fas fa-running"></i>
                    </div>

                    <!-- Ícone de bateria do dispositivo -->
                    <div class="status-icon"
                        :class="getBatteryClass(currentRoutePoint.attributes && currentRoutePoint.attributes.batteryLevel)"
                        :title="KT('device.battery') + ': ' + (currentRoutePoint.attributes && currentRoutePoint.attributes.batteryLevel ? currentRoutePoint.attributes.batteryLevel + '%' : KT('device.unknown'))">
                        <i
                            :class="getBatteryIcon(currentRoutePoint.attributes && currentRoutePoint.attributes.batteryLevel)"></i>
                    </div>

                    <!-- Ícone de bateria do veículo (power) -->
                    <div class="status-icon"
                        :class="getBatteryClass(currentRoutePoint.attributes && currentRoutePoint.attributes.power)"
                        :title="KT('device.power') + ': ' + (currentRoutePoint.attributes && currentRoutePoint.attributes.power ? currentRoutePoint.attributes.power + 'V' : KT('device.unknown'))">
                        <i class="fas fa-car-battery"></i>
                    </div>

                    <!-- Ícone de sinal -->
                    <div class="status-icon"
                        :class="getSignalClass(currentRoutePoint.attributes && currentRoutePoint.attributes.rssi)"
                        :title="KT('device.signal') + ': ' + (currentRoutePoint.attributes && currentRoutePoint.attributes.rssi ? currentRoutePoint.attributes.rssi + 'dBm' : KT('device.unknown'))">
                        <i class="fas fa-signal"></i>
                    </div>
                </div>

                <!-- Linha do meio: informações detalhadas -->
                <div class="route-info-row detail-info">
                    <div class="info-group">
                        <div class="info-label"><i class="fas fa-tachometer-alt"></i></div>
                        <div class="info-value">{{ currentRoutePoint.speed || 0 }} km/h</div>
                    </div>

                    <div class="info-group">
                        <div class="info-label"><i class="fas fa-compass"></i></div>
                        <div class="info-value">{{ getCardinalDirection(currentRoutePoint.course) }} ({{
                            currentRoutePoint.course || 0}}°)</div>
                    </div>

                    <div class="info-group">
                        <div class="info-label"><i class="fas fa-clock"></i></div>
                        <div class="info-value">{{ formatDateTime(currentRoutePoint.deviceTime, true) }}</div>
                    </div>

                    <div class="info-group wide">
                        <div class="info-label"><i class="fas fa-map-marker-alt"></i></div>
                        <div class="info-value address">{{ currentRoutePoint.address || "Carregando..." }}</div>
                    </div>
                </div>

                <!-- Linha inferior: botões -->
                <div class="route-info-row action-buttons">
                    <button class="action-button primary" @click="showAdvancedDetails()">
                        <i class="fas fa-info-circle"></i> {{ KT('attribute.details') || 'Detalhes' }}
                    </button>

                    <button class="action-button" @click="copyLocation(currentRoutePoint)">
                        <i class="fas fa-copy"></i>
                    </button>

                    <button class="action-button" v-if="currentRoutePoint.address"
                        @click="openInMaps(currentRoutePoint)">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                </div>
            </div>
        </l-control>

        <l-tile-layer v-for="(m, mk) in availableMaps" :key="'tsmap' + mk" :name="m.name" layer-type="base"
            :visible="m.id === selectedMap" :subdomains="m.subdomains" :url="m.url"></l-tile-layer>

        <l-layer-group layer-type="overlay" name="Geocercas">

            <template v-if="showGeofences && !store.getters['geofences/isEditing']">
                <kore-fence v-for="(f) in store.getters['geofences/fenceList']" :key="f.id" :geofence="f"></kore-fence>
            </template>

            <template v-if="!store.getters['geofences/isEditing']">
                <kore-fence v-for="(f) in store.getters['geofences/anchorList']" :key="f.id" :color="'#ff0000'"
                    :geofence="f"></kore-fence>
            </template>

            <template v-if="store.getters['geofences/isEditing']">
                <l-polyline :key="'polyline-' + store.getters['geofences/getLatLngs'].length"
                    v-if="store.state.geofences.mapPointEditingType === 'LINESTRING' && store.state.geofences.mapPointEditingParams.length > 0"
                    :lat-lngs="store.getters['geofences/getLatLngs']" :color="'#05a7e3'"></l-polyline>
                <l-polygon :key="'polygon-' + store.getters['geofences/getLatLngs'].length" :no-clip="true"
                    v-else-if="store.state.geofences.mapPointEditingType === 'POLYGON' && store.state.geofences.mapPointEditingParams.length > 0"
                    :lat-lngs="store.getters['geofences/getLatLngs']" :fill-opacity="0.15" :fill="true"
                    :fill-color="'#05a7e3'" :color="'#05a7e3'"></l-polygon>
                <l-circle :key="'circle-' + store.state.geofences.mapPointEditingParams.join('-')"
                    v-else-if="store.state.geofences.mapPointEditingType === 'CIRCLE' && store.state.geofences.mapPointEditingParams.length === 3"
                    :lat-lng="[store.state.geofences.mapPointEditingParams[0], store.state.geofences.mapPointEditingParams[1]]"
                    :radius="parseFloat(store.state.geofences.mapPointEditingParams[2])" :fill="true"
                    :fill-opacity="0.15" :fill-color="'#05a7e3'" :color="'#05a7e3'"></l-circle>
            </template>








            <template v-if="dPosition && store.getters['mapPref']('precision')">
                <l-circle :interactive="false" :lat-lng="[dPosition.latitude, dPosition.longitude]"
                    :radius="parseFloat(dPosition.accuracy | 20)" :fill="true" :fill-opacity="0.05"
                    :fill-color="'#e3c505'" :color="'#e3d105'"></l-circle>
            </template>
        </l-layer-group>




        <l-layer-group layer-type="overlay" name="Carros" ref="carLayer" :attribution="'Carros'">



            <l-polyline v-if="store.state.devices.trail !== false" :lat-lngs="store.getters['devices/getTrails']"
                :color="'#05a7e3'"></l-polyline>

            <kore-canva-marker :map="map" :zoom="zoom" @click="markerClick" @mouseover="markerOver"
                @mouseout="markerOut" @contextmenu="markerContext"></kore-canva-marker>



        </l-layer-group>


        <l-layer-group v-if="true" layer-type="overlay" name="Rota" :attribution="'Rota'">
            <l-polyline v-if="showRoutePoints" :lat-lngs="cptPoints" :color="'#05a7e3'"></l-polyline>

            <kore-canva-point v-if="showRouteMarkers" :points="routePoints" :leaflet-map="map?.leafletObject"
                @click="openMarkInfo($event)" @mouseover="markerOver($event)" @mouseout="markerOut($event)"
                @playVideo="handlePlayVideo($event)"></kore-canva-point>

            <template v-if="showRoutePoints">
                <template v-for="(p, k) in routePoints" :key="'mkrs-' + k">
                    <kore-marker v-if="k === 0 || k === routePoints.length - 1"
                        :name="(k === 0) ? 'start' : (k === routePoints.length - 1) ? 'end' : 'point'" :position="p"
                        :type="(k === 0) ? 'start' : (k === routePoints.length - 1) ? 'end' : 'point'"
                        @click="openMarkInfo($event)" @mouseover="showTooltip(k, p)" @mouseleave="hideTooltip">
                    </kore-marker>

                </template>

                <div v-if="tooltipVisible" :style="tooltipStyle" class="tooltip">
                    <strong>{{ tooltipData.name }}</strong><br>
                    <strong>Distancia:</strong> {{ tooltipData.distance }} m<br>
                    <strong>Velocidad:</strong> {{ tooltipData.speed }} km/h
                </div>
            </template>

            <template v-if="showRoutePoints">
                <template v-for="(p, k) in routePoints" :key="'mkrs-' + k">
                    <kore-marker v-if="k === 0 || k === routePoints.length - 1"
                        :name="(k === 0) ? 'start' : (k === routePoints.length - 1) ? 'end' : 'point'" :position="p"
                        :type="(k === 0) ? 'start' : (k === routePoints.length - 1) ? 'end' : 'point'"
                        @click="openMarkInfo($event)" @mouseover="showTooltip(k, p)" @mouseleave="hideTooltip">
                    </kore-marker>
                </template>

                <!-- Tooltip -->
                <div v-if="tooltipVisible" :style="tooltipStyle" class="tooltip">
                    <strong>{{ tooltipData.name }}</strong><br>
                    <strong>Distancia:</strong> {{ tooltipData.distance }} m<br>
                    <strong>Velocidad:</strong> {{ tooltipData.speed }} km/h
                </div>
            </template>
        </l-layer-group>





        <!-- Controles de zoom en la esquina inferior izquierda -->
        <l-control position="bottomleft">
            <div class="leaflet-control-zoom leaflet-bar leaflet-control">
                <a class="leaflet-control-zoom-in" href="#" title="Zoom in" role="button" aria-label="Zoom in"
                    @click.prevent="zoomIn">+</a>
                <a class="leaflet-control-zoom-out" href="#" title="Zoom out" role="button" aria-label="Zoom out"
                    @click.prevent="zoomOut">−</a>
            </div>
        </l-control>

        <!-- Command Modal -->
        <CommandModal ref="commandModalRef" v-model="commandModalOpen" :device="selectedDevice" />

        <!-- Asistente IA (Solo visible con permisos) -->
        <!-- <AIAssistant v-if="showAIAssistant" /> -->

        <!-- Panel flotante de seguimiento -->
        <div v-if="showFloatingPanel && floatingPanelDevice" class="floating-follow-panel">
            <div class="panel-header">
                <h4>{{ floatingPanelDevice.name }}</h4>
                <button @click="showFloatingPanel = false" class="close-panel-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="panel-content">
                <!-- 🎯 SEÇÃO APRIMORADA DO MOTORISTA -->
                <div class="driver-section-enhanced">
                    <div class="driver-card-header">
                        <i class="fas fa-user-tie"></i>
                        <span class="section-title">Motorista Atual</span>
                        <div class="driver-status-indicator" :class="getDriverStatusClass(floatingPanelDevice)">
                            <span class="status-dot"></span>
                            <span class="status-text">{{ getDriverStatusText(floatingPanelDevice) }}</span>
                        </div>
                    </div>

                    <div class="driver-card-content">
                        <div class="driver-photo-enhanced">
                            <img :src="getDriverPhotoUrl(floatingPanelDevice)" :alt="getDriverName(floatingPanelDevice)"
                                @error="$event.target.src = driverImageUrl('default.png')"
                                class="driver-avatar" />
                            <div class="photo-overlay" v-if="isDriverCNHExpired(floatingPanelDevice)">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                        </div>

                        <div class="driver-details">
                            <div class="driver-main-info">
                                <div class="driver-name-enhanced">
                                    <strong>{{ getDriverName(floatingPanelDevice) || 'Motorista não identificado'
                                        }}</strong>
                                    <span class="driver-id" v-if="getDriverId(floatingPanelDevice)">
                                        ID: {{ getDriverId(floatingPanelDevice) }}
                                    </span>
                                </div>
                            </div>

                            <div class="driver-credentials"
                                v-if="getDriverCNH(floatingPanelDevice) || getDriverCPF(floatingPanelDevice)">
                                <div class="credential-item" v-if="getDriverCNH(floatingPanelDevice)">
                                    <i class="fas fa-id-card"></i>
                                    <span class="label">CNH:</span>
                                    <span class="value">{{ getDriverCNH(floatingPanelDevice) }}</span>
                                    <span class="category" v-if="getDriverCNHCategory(floatingPanelDevice)">
                                        ({{ getDriverCNHCategory(floatingPanelDevice) }})
                                    </span>
                                </div>
                                <div class="credential-item" v-if="getDriverCPF(floatingPanelDevice)">
                                    <i class="fas fa-user"></i>
                                    <span class="label">CPF:</span>
                                    <span class="value">{{ formatCPF(getDriverCPF(floatingPanelDevice)) }}</span>
                                </div>
                            </div>

                            <div class="driver-expiry-section" v-if="getDriverCNHExpiry(floatingPanelDevice)">
                                <div class="expiry-item" :class="getCNHExpiryClass(floatingPanelDevice)">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span class="label">Validade CNH:</span>
                                    <span class="expiry-date">{{
                                        formatExpiryDate(getDriverCNHExpiry(floatingPanelDevice))
                                        }}</span>
                                    <span class="expiry-warning" v-if="isDriverCNHExpired(floatingPanelDevice)">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        VENCIDA
                                    </span>
                                    <span class="expiry-warning warning"
                                        v-else-if="isDriverCNHExpiring(floatingPanelDevice)">
                                        <i class="fas fa-clock"></i>
                                        VENCENDO
                                    </span>
                                    <div class="days-remaining" v-if="!isDriverCNHExpired(floatingPanelDevice)">
                                        {{ getDaysUntilExpiry(getDriverCNHExpiry(floatingPanelDevice)) }} dias restantes
                                    </div>
                                </div>
                            </div>

                            <!-- Ações Rápidas do Motorista -->
                            <div class="driver-quick-actions" v-if="getDriverId(floatingPanelDevice)">
                                <el-button size="mini" type="info"
                                    @click="viewDriverDetails(getDriverId(floatingPanelDevice))">
                                    <i class="fas fa-eye"></i>
                                    Ver Perfil
                                </el-button>
                                <el-button size="mini" type="warning"
                                    @click="generateDriverReport(getDriverId(floatingPanelDevice))">
                                    <i class="fas fa-file-pdf"></i>
                                    Relatório
                                </el-button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Foto del vehículo (grande) -->
                <div class="vehicle-image-section">
                    <div class="vehicle-photo-large">
                        <img :src="getDeviceImageUrl(floatingPanelDevice)" :alt="floatingPanelDevice.name"
                            @error="$event.target.src = categoryImageUrl('default')" />
                    </div>
                </div>

                <!-- Información del vehículo -->
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
            </div>
        </div>

    </LMap>
</template>

<style scoped>
.map-layer-dropdown :deep(.el-dropdown-menu) {
    min-width: 180px;
    padding: 5px 0;
}

.map-layer-dropdown :deep(.el-radio__input) {
    margin-right: 8px;
}

.map-layer-dropdown :deep(.el-radio__label) {
    padding-left: 4px;
}

/* Estilos para el menú de visibilidad */
.visibility-dropdown :deep(.el-dropdown-menu) {
    min-width: 200px;
    padding: 5px 0;
}

.pref-option {
    display: flex;
    align-items: center;
    padding: 4px 12px;
    min-height: 24px;
    margin-bottom: 2px;
}

.pref-icon {
    width: 16px;
    font-size: 11px;
    color: var(--el-color-primary-light-3);
    text-align: center;
    margin-right: 2px;
}

.pref-label {
    font-size: 11px;
    margin-left: 10px;
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.pref-switch {
    margin-left: auto;
    min-width: 28px;
    /* Asegura un ancho mínimo para alineación */
    display: flex;
    justify-content: flex-end;
}

.device-item {
    display: flex !important;
    align-items: center !important;
    padding: 4px 12px !important;
    min-height: 24px !important;
    height: auto !important;
    line-height: normal !important;
    margin-bottom: 1px !important;
}

.device-icon {
    width: 16px;
    font-size: 11px;
    color: var(--el-color-primary-light-3);
    text-align: center;
    margin-right: 2px;
}

.device-label {
    font-size: 11px;
    margin-left: 10px;
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.device-switch {
    margin-left: auto;
    min-width: 28px;
    /* Asegura un ancho mínimo para alineación */
    display: flex;
    justify-content: flex-end;
}

/* Estilos para el panel flotante de seguimiento */
.floating-follow-panel {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    right: 20px;
    width: 320px;
    background: rgba(0, 0, 0, 0.9);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
    z-index: 10000;
    color: white;
    font-family: 'Roboto', sans-serif;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(74, 144, 226, 0.3), rgba(37, 99, 235, 0.3));
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: white;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.close-panel-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    font-size: 12px;
    transition: background 0.2s ease;
}

.close-panel-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.panel-content {
    padding: 16px;
}

.driver-section {
    text-align: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.driver-photo-large {
    width: 120px;
    height: 120px;
    border-radius: 12px;
    overflow: hidden;
    margin: 0 auto 12px auto;
    border: 3px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.driver-photo-large img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.vehicle-image-section {
    margin: 16px 0;
    text-align: center;
}

.vehicle-photo-large {
    width: 140px;
    height: 100px;
    border-radius: 12px;
    overflow: hidden;
    margin: 0 auto;
    border: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.vehicle-photo-large img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.driver-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.driver-name,
.driver-cnh,
.driver-cnh-expiry {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: white;
}

.driver-name i,
.driver-cnh i,
.driver-cnh-expiry i {
    width: 16px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
}

.driver-name strong {
    font-weight: 600;
}

.vehicle-section {
    margin-top: 16px;
}

.info-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    font-size: 12px;
    gap: 8px;
}

.info-row:last-child {
    margin-bottom: 0;
}

.info-row i {
    width: 16px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    flex-shrink: 0;
}

.info-row .value {
    color: white;
    font-weight: 600;
    margin-left: 8px;
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Estados con fondo de color y letras blancas */
.status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    color: white !important;
    text-align: center;
    min-width: 80px;
}

.status-moving {
    background: #3b82f6;
    /* Azul para movimiento */
}

.status-online {
    background: #10b981;
    /* Verde para en línea */
}

.status-offline {
    background: #ef4444;
    /* Rojo para desconectado */
}

.status-unknown {
    background: #f59e0b;
    /* Amarillo para desconocido */
}
</style>

<script setup>

// Branding helpers
import { assetUrl, categoryImageUrl, driverImageUrl } from '@/branding';

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

import 'leaflet-search/dist/leaflet-search.min.css'



import { ElMessage, ElMessageBox, ElTooltip, ElRadio, ElDropdown, ElDropdownMenu, ElDropdownItem, ElNotification, ElSwitch, ElButton, ElInput } from "element-plus";
import L from 'leaflet';
import 'leaflet-search';
import { LMap, LTileLayer, LControl, LLayerGroup, LPolyline, LCircle, LPolygon } from "@vue-leaflet/vue-leaflet";
import KoreMarker from "./kore-marker";
import KoreFence from "./kore-fence";
import KoreCanvaMarker from "../test/CanvaMarker";
import KoreCanvaPoint from "../test/CanvaPoints"
import CommandModal from "./CommandModal.vue"
// import AIAssistant from "../../components/AIAssistant.vue"
import { computed, watch, ref, onMounted, onUnmounted, inject, getCurrentInstance } from "vue";
import { useStore } from 'vuex';
import router from "../../routes";
import KT from "../func/kt";
import StreetView from "./street-view.vue";
//import {LMarkerCluster} from "leaflet.markercluster/dist/leaflet.markercluster-src";
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
//import {ElIcon} from "element-plus/es/components/icon";
import 'element-plus/es/components/icon/style/css'
const store = useStore();
const app = getCurrentInstance().appContext.app;
const runtimeApi = inject('runtimeApi', null);

const carLayer = ref(null);
const focusLayer = ref(null);
import { useRoute } from 'vue-router';


const route = useRoute();

// Variable para mostrar el Asistente IA
// const showAIAssistant = computed(() => {
//   // Para pruebas, siempre mostrar el asistente
//   // TODO: Ajustar lógica de permisos según necesidades
//   return true
// });

app.provide("focusLayer", focusLayer);


const openMarkInfo = (e) => {
    // Si es un punto de ruta, no mostrar el tooltip feo anterior
    if (e.pointData && Array.isArray(e.pointData)) {
        console.log('🔍 Es punto de ruta, no mostrar tooltip feo');
        return;
    }

    console.log('🔍 openMarkInfo ejecutado, evento completo:', e);
    console.log('🔍 e.pointData:', e.pointData);
    console.log('🔍 e.detail:', e.detail);

    // Extraer datos del punto - CanvaPoints envía datos en e.pointData
    const point = e.pointData || e.detail || e;
    console.log('🔍 punto extraído:', point);

    let lat, lng, id, course, fixTime, speed;

    // Manejar formato de array [lat, lng, id, course, fixTime, speed]
    if (Array.isArray(point)) {
        [lat, lng, id, course, fixTime, speed] = point;
        console.log('🔍 datos parseados - lat:', lat, 'lng:', lng, 'id:', id, 'course:', course, 'fixTime:', fixTime, 'speed:', speed);
    } else {
        console.log('❌ Formato de punto no reconocido:', point);
        console.log('❌ Tipo:', typeof point);

        // Intentar mostrar algo básico si no es array
        if (point && typeof point === 'object') {
            console.log('🔍 Intentando extraer de objeto...');
            ElMessageBox.alert(`Punto clickeado pero formato no reconocido:<br><pre>${JSON.stringify(point, null, 2)}</pre>`, {
                title: 'Debug - Punto de Ruta',
                dangerouslyUseHTMLString: true,
                type: 'warning'
            });
        }
        return;
    }

    console.log('✅ Creando modal con información del punto...');

    // Crear mensaje con información del punto
    let message = `📍 <b>Información del Punto</b><br><br>`;
    message += `<b>📌 Coordenadas:</b> ${lat}, ${lng}<br>`;

    if (fixTime) {
        const fecha = new Date(fixTime);
        message += `<b>🕒 Fecha/Hora:</b> ${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}<br>`;
    }

    if (speed !== undefined && speed !== null) {
        const speedUnit = store.getters['server/getAttribute']('speedUnit', 'speedUnit');
        const speedValue = speedUnit === 'kmh' ? Math.round(speed * 1.852) : speed;
        const unit = speedUnit === 'kmh' ? 'km/h' : speedUnit === 'mph' ? 'mph' : 'kn';
        message += `<b>⚡ Velocidad:</b> ${speedValue} ${unit}<br>`;
    }

    if (course !== undefined && course !== null) {
        message += `<b>🧭 Rumbo:</b> ${course}°<br>`;
    }

    message += `<b>🆔 ID Posición:</b> ${id}`;

    console.log('✅ Mostrando modal...');

    // Mostrar el modal con la información
    ElMessageBox.alert(message, {
        title: 'Datos del Punto de Ruta',
        dangerouslyUseHTMLString: true,
        type: 'info',
        customClass: 'route-point-modal'
    }).then(() => {
        console.log('✅ Modal cerrado correctamente');
    }).catch((error) => {
        console.error('❌ Error al mostrar modal:', error);
    });
}

const handlePlayVideo = (videoFile) => {
    console.log('🎥 Reproduzindo vídeo em kore-map:', videoFile);
    // Emitir evento para o componente de histórico
    window.dispatchEvent(new CustomEvent('playVideoFromMap', { detail: videoFile }));
}


watch(() => store.getters['isFiltering'], () => {
    const s = store.getters['mapPref']('clustered');
    const f = store.getters['isFiltering'];


    if (s && f) {
        document.body.classList.add("way-filtering");
    } else if (s && !f) {
        document.body.classList.remove("way-filtering");
    }


});


watch(() => store.getters['mapPref']('clustered', true), () => {
    const s = store.getters['mapPref']('clustered', true);

    if (s) {
        document.body.classList.remove("way-filtering");
    } else {
        document.body.classList.add("way-filtering");
    }


});

watch(() => store.getters['mapPref']('name'), () => {
    window.$hiddenLayer.eachLayer((layer) => {
        if (layer.setLabel) {
            layer.setLabel({ name: store.getters['mapPref']('name'), plate: store.getters['mapPref']('plate'), status: store.getters['mapPref']('status') });
        }
    });

    window.$mk.eachLayer((layer) => {
        if (layer.setLabel) {
            layer.setLabel({ name: store.getters['mapPref']('name'), plate: store.getters['mapPref']('plate'), status: store.getters['mapPref']('status') });
        }
    });
})

watch(() => store.getters['mapPref']('plate'), () => {
    window.$hiddenLayer.eachLayer((layer) => {
        if (layer.setLabel) {
            layer.setLabel({ name: store.getters['mapPref']('name'), plate: store.getters['mapPref']('plate'), status: store.getters['mapPref']('status') });
        }
    });

    window.$mk.eachLayer((layer) => {
        if (layer.setLabel) {
            layer.setLabel({ name: store.getters['mapPref']('name'), plate: store.getters['mapPref']('plate'), status: store.getters['mapPref']('status') });
        }
    });
})

watch(() => store.getters['mapPref']('status'), () => {
    window.$hiddenLayer.eachLayer((layer) => {
        if (layer.setLabel) {
            layer.setLabel({ name: store.getters['mapPref']('name'), plate: store.getters['mapPref']('plate'), status: store.getters['mapPref']('status') });
        }
    });

    window.$mk.eachLayer((layer) => {
        if (layer.setLabel) {
            layer.setLabel({ name: store.getters['mapPref']('name'), plate: store.getters['mapPref']('plate'), status: store.getters['mapPref']('status') });
        }
    });
})

window.addEventListener("keydown", (e) => {
    if (e.code === 'ControlLeft') {
        window.$hiddenLayer.eachLayer((layer) => {
            if (layer.setPressed) {
                layer.setPressed(true);
            }
        });

        window.$mk.eachLayer((layer) => {
            if (layer.setPressed) {
                layer.setPressed(true);
            }
        });
    }
});

window.addEventListener("keyup", (e) => {
    if (e.code === 'ControlLeft') {
        window.$hiddenLayer.eachLayer((layer) => {
            if (layer.setPressed) {
                layer.setPressed(false);
            }
        });

        window.$mk.eachLayer((layer) => {
            if (layer.setPressed) {
                layer.setPressed(false);
            }
        });
    }
});

const closeRoutes = () => {
    // Desactivar bandera de rutas y limpiar los puntos de ruta
    store.commit("devices/setRoute", false);
    updateRoute([]);

    // Restore previous clustering state if it was saved
    if (window.previousClusterState === true) {
        // Re-enable clustering
        store.dispatch('setMapPref', ['clustered', true]);
        // Clear the saved state
        window.previousClusterState = undefined;
    }

    // Limpiar los datos de ruta en el store
    store.dispatch("routes/clearRoute");

    // Si hay un deviceId en la ruta, actualizar la URL sin recargar la página
    if (route.query.deviceId) {
        // Usar history.pushState para modificar la URL sin recargar la página
        const newUrl = route.path;
        history.pushState(null, '', newUrl);
    }

    // Limpiar los puntos y el punto de reproducción 
    // Reiniciar el punto de reproducción a 0 (inicio)
    store.commit("devices/setRoutePlayPoint", 0);

    // Cerrar paneles de reproducción y detalles
    showDetailsPanel.value = false;
    showRouteDetailsPanel.value = false;

    // Detener la reproducción si está activa
    routePlayState.value = false;

    // Ocultar marcadores y puntos de ruta
    store.commit('devices/setShowRouteMarkers', false);
    showRoutePoints.value = false;

    // Limpiar punto actual
    currentRoutePoint.value = null;

    // Ocultar tooltip si está visible
    if (window.$hideTip) {
        window.$hideTip();
    }

    // SOLUCIÓN SIMPLE: Forzar recarga de la página para garantizar que los marcadores
    // vuelvan a aparecer correctamente en sus posiciones actuales
    window.location.reload();//////////////////////////////////////////////////////////////////

    // El código siguiente ya no se ejecutará debido a la recarga de la página
    // pero lo mantenemos como referencia
    if (map.value && map.value.leafletObject) {
        if (store.state.devices.deviceList.length > 0) {
            // Si hay dispositivos, mostrar todos en el mapa
            const bounds = [];
            store.state.devices.deviceList.forEach(device => {
                const position = store.getters["devices/getPosition"](device.id);
                if (position) {
                    bounds.push([position.latitude, position.longitude]);
                }
            });

            if (bounds.length > 0) {
                // Ajustar el mapa para mostrar todos los dispositivos
                map.value.leafletObject.fitBounds(bounds);
            }
        }
    }
}


const dPosition = computed(() => {
    if (route.params.deviceId) {
        return store.getters['devices/getPosition'](parseInt(route.params.deviceId));
    } else {
        return false;
    }
})


const zoom = ref(10);
const map = ref(null);
const routePoints = ref([]);
const showRoutePoints = ref(true);
const commandModalOpen = ref(false);
const selectedDevice = ref(null);
const commandModalRef = ref(null);
// showRouteMarkers ahora se obtiene del store global

// Para la funcionalidad del tooltip de seguimiento
let tooltipUpdateInterval = null;
let mapResizeInterval = null;
// Variable para controlar si el tooltip ha sido cerrado manualmente
const tooltipManuallyHidden = ref(false);

// Para el panel flotante de seguimiento
const showFloatingPanel = ref(false);
const floatingPanelDevice = ref(null);

// Función para cerrar y marcar el tooltip como cerrado manualmente
const hideTooltipManually = () => {
    tooltipManuallyHidden.value = true;
    showFloatingPanel.value = false; // También cerrar el panel flotante
    if (window.$hideTip) {
        window.$hideTip();
    }
};

// Resetear el estado del tooltip cuando cambia el dispositivo seguido o se desactiva el seguimiento
watch(() => store.state.devices.isFollowingId, (newVal) => {
    if (newVal) {
        // Si hay un nuevo dispositivo seguido, resetear el estado para mostrar el tooltip
        tooltipManuallyHidden.value = false;
    }
});

// Actualizar el tooltip cuando el vehículo está en modo seguimiento
const updateFollowTooltip = () => {
    const deviceId = store.state.devices.isFollowingId;
    // Si el ID no existe o el tooltip fue cerrado manualmente, no mostrarlo
    if (!deviceId || tooltipManuallyHidden.value) return;

    const device = store.getters["devices/getDevice"](deviceId);
    const position = store.getters["devices/getPosition"](deviceId);

    if (device && position && window.$showTip && map.value) {
        // Contenedor del tooltip de seguimiento con transparencias correctas
        let tooltipContent = `<div style="padding:10px;min-width:280px;">
        <!-- Botones de acción -->
        <div style="position:absolute;top:6px;right:6px;display:flex;gap:2px;z-index:1000;">
          <!-- Botón de panel flotante -->
          <div onclick="document.dispatchEvent(new CustomEvent('openFloatingPanel', { detail: { deviceId: ${deviceId} } }));" style="background-color:rgba(255,255,255,0.15);width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <i class="fas fa-eye" style="color:white;font-size:9px;"></i>
          </div>
          <!-- Botón de cierre -->
          <div onclick="document.dispatchEvent(new CustomEvent('hideFollowTooltip'));" style="background-color:rgba(255,255,255,0.15);width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <i class="fas fa-times" style="color:white;font-size:9px;"></i>
          </div>
        </div>
        
        <!-- Nombre del dispositivo con círculo de estado -->
        <div style="font-weight:bold;color:#ffffff;text-align:center;font-size:14px;margin-bottom:10px;padding-right:20px;display:flex;align-items:center;justify-content:center;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${device.lastUpdate === null || (device.status !== 'online' && device.status !== 'offline') ? '#e6a23c' : device.status === 'online' && position && position.speed > 6 ? '#409eff' : device.status === 'online' ? '#67c23a' : '#f56c6c'};margin-right:6px;flex-shrink:0;"></span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${device.name}</span>
        </div>`;

        // Grid de iconos de estado
        if (position.attributes) {
            tooltipContent += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:10px;">';

            // 1. Ignición
            const ignitionColor = position.attributes.ignition ? '#4ade80' : '#ef4444';
            tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${ignitionColor};">
          <i class="fas fa-key" style="margin-bottom:1px;font-size:14px;"></i>
          <span style="font-size:10px;text-align:center;color:#ffffff;">${position.attributes.ignition ? 'LIG' : 'DES'}</span>
        </div>`;

            // 2. Bloqueo
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

            // 3. Batería del vehículo
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

            // 4. Batería interna
            let batteryColor = '#94a3b8';
            let batteryValue = 'N/A';
            if (position.attributes.batteryLevel) {
                const batteryLevel = parseInt(position.attributes.batteryLevel);
                batteryValue = batteryLevel + '%';
                batteryColor = batteryLevel < 30 ? '#ef4444' : (batteryLevel < 70 ? '#f59e0b' : '#4ade80');
            } else if (position.attributes.battery) {
                const battery = parseFloat(position.attributes.battery);
                batteryValue = battery.toFixed(1) + 'v';
                batteryColor = battery < 3.2 ? '#ef4444' : (battery < 3.7 ? '#f59e0b' : '#4ade80');
            }
            tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${batteryColor};">
          <i class="fas fa-battery-half" style="margin-bottom:1px;font-size:14px;"></i>
          <span style="font-size:9px;text-align:center;color:#ffffff;">${batteryValue}</span>
        </div>`;

            // 5. Combustible
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

            // 6. Velocidad
            const speedKmh = Math.round(position.speed * 1.852);
            const speedColor = speedKmh > 0 ? '#4ade80' : '#94a3b8';
            tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${speedColor};">
          <i class="fas fa-tachometer-alt" style="margin-bottom:1px;font-size:14px;"></i>
          <span style="font-size:9px;text-align:center;color:#ffffff;">${speedKmh}km</span>
        </div>`;

            // 7. Satélites
            let satellitesColor = '#94a3b8';
            let satellitesValue = 'N/A';
            if (position.attributes.satellites !== undefined) {
                const sat = parseInt(position.attributes.satellites);
                satellitesValue = sat.toString();
                satellitesColor = sat < 4 ? '#ef4444' : (sat < 8 ? '#f59e0b' : '#4ade80');
            } else if (position.attributes.sat !== undefined) {
                const sat = parseInt(position.attributes.sat);
                satellitesValue = sat.toString();
                satellitesColor = sat < 4 ? '#ef4444' : (sat < 8 ? '#f59e0b' : '#4ade80');
            }
            tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${satellitesColor};">
          <i class="fas fa-satellite" style="margin-bottom:1px;font-size:14px;"></i>
          <span style="font-size:9px;text-align:center;color:#ffffff;">${satellitesValue}</span>
        </div>`;

            tooltipContent += '</div>';

            // Dirección con truncado forzado
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

            // Conductor
            if ((device.attributes && device.attributes.driverUniqueId) || (position.attributes && position.attributes.driverUniqueId)) {
                const driverUniqueId = position.attributes?.driverUniqueId || device.attributes?.driverUniqueId;
                let driverInfo = driverUniqueId;
                const driver = store.getters['drivers/getDriverByUniqueId'](driverUniqueId);
                if (driver) {
                    driverInfo = driver.name || driver.uniqueId;
                }
                tooltipContent += `<div style="color:#ffffff;font-size:9px;margin-bottom:6px;text-align:center;">
            <i class="fas fa-user" style="margin-right:4px;color:#34d399;"></i>${driverInfo}
          </div>`;
            }

            // Línea inferior con iconos: fecha, ángulo y estado
            let bottomLine = '';

            // Fecha con reloj (separar icono y correr hora)
            if (device.lastUpdate) {
                const lastUpdateDate = new Date(device.lastUpdate);
                const formattedDate = lastUpdateDate.toLocaleDateString() + ' ' + lastUpdateDate.toLocaleTimeString();
                bottomLine += `<i class="fas fa-clock" style="color:#a78bfa;margin-right:4px;"></i>${formattedDate} `;
            }

            // Ángulo sin decimales con compass y dirección N/S
            if (position.course !== undefined && position.course !== null) {
                const angle = Math.round(position.course);
                const direction = angle >= 0 && angle <= 180 ? 'N' : 'S';
                bottomLine += `<i class="fas fa-compass" style="color:#fbbf24;margin-left:8px;margin-right:4px;"></i>${angle}°${direction} `;
            }

            // Estado del dispositivo con iconos exactos de device.item (solo admin)
            let deviceState = '';
            let stateIcon = '';
            let stateColor = '';
            if (device.attributes && device.attributes['device.state'] && store.state.auth.administrator) {
                const state = device.attributes['device.state'];
                switch (state) {
                    case 'installed':
                        deviceState = 'Instalado em Cliente';
                        stateIcon = 'fa-check-circle';
                        stateColor = '#67c23a';
                        break;
                    case 'in_service':
                        deviceState = 'Em Serviço Técnico';
                        stateIcon = 'fa-tools';
                        stateColor = '#f59e0b';
                        break;
                    case 'in_stock':
                        deviceState = 'Em Estoque';
                        stateIcon = 'fa-box';
                        stateColor = '#6b7280';
                        break;
                    case 'with_failures':
                        deviceState = 'Com Falhas';
                        stateIcon = 'fa-exclamation-triangle';
                        stateColor = '#ef4444';
                        break;
                    case 'company':
                        deviceState = 'Em Empresa';
                        stateIcon = 'fa-building';
                        stateColor = '#3b82f6';
                        break;
                    case 'withdrawn':
                        deviceState = 'Retirado';
                        stateIcon = 'fa-archive';
                        stateColor = '#dc2626';
                        break;
                    default:
                        deviceState = state;
                }
            }
            if (deviceState) {
                bottomLine += `<i class="fas ${stateIcon}" style="color:${stateColor};margin-left:8px;margin-right:4px;"></i>${deviceState}`;
            }

            if (bottomLine) {
                tooltipContent += `<div style="color:#ffffff;font-size:10px;margin-bottom:6px;text-align:center;">
            ${bottomLine}
          </div>`;
            }
        }

        tooltipContent += '</div>';

        // Posición del tooltip
        const markPoint = map.value.leafletObject.latLngToContainerPoint(L.latLng(position.latitude, position.longitude));
        const left = markPoint.x + (router.currentRoute.value.meta.shown ? 553 : 73);
        const top = markPoint.y;

        window.$showTip({ left: left + 'px', top: top + 'px' }, tooltipContent, true);
    }
};

// Función para actualizar la información del panel flotante (solo cuando cambia el dispositivo seguido)
const updateFloatingPanel = () => {
    if (!showFloatingPanel.value || !floatingPanelDevice.value) return;

    const followingId = store.state.devices.isFollowingId;
    if (followingId && followingId !== floatingPanelDevice.value.id) {
        const updatedDevice = store.getters["devices/getDevice"](followingId);
        if (updatedDevice) {
            floatingPanelDevice.value = updatedDevice;
            // Limpiar cache de imágenes para el nuevo dispositivo
            imageUrlCache.value.delete(`driver_${updatedDevice.id}`);
            imageUrlCache.value.delete(`device_${updatedDevice.id}`);
        }
    }
};

// Función para obtener el nombre del conductor
const getDriverName = (device) => {
    if (!device) return 'Sin conductor';

    const position = store.getters["devices/getPosition"](device.id);
    const driverUniqueId = position?.attributes?.driverUniqueId || device.attributes?.driverUniqueId;

    if (driverUniqueId) {
        const driver = store.getters['drivers/getDriverByUniqueId'](driverUniqueId);
        if (driver) {
            return driver.name || driver.uniqueId;
        }
        return driverUniqueId;
    }

    return 'Sin conductor';
};

// URLs estáticas cacheadas para evitar requests constantes
const imageUrlCache = ref(new Map());

// Función para obtener la URL de la foto del conductor (cacheada)
const getDriverPhotoUrl = (device) => {
    if (!device) return driverImageUrl('default.png');

    const cacheKey = `driver_${device.id}`;
    if (imageUrlCache.value.has(cacheKey)) {
        return imageUrlCache.value.get(cacheKey);
    }

    const position = store.getters["devices/getPosition"](device.id);
    const driverUniqueId = position?.attributes?.driverUniqueId || device.attributes?.driverUniqueId;

    let url = driverImageUrl('default.png');
    if (driverUniqueId) {
        const driver = store.getters['drivers/getDriverByUniqueId'](driverUniqueId);
        if (driver && driver.id) {
            const timestamp = new Date().getTime();
            url = driverImageUrl(`${driver.id}.png`) + `?v=${timestamp}`;
        }
    }

    imageUrlCache.value.set(cacheKey, url);
    return url;
};

// Función para obtener la URL de la imagen del dispositivo (cacheada)
const getDeviceImageUrl = (device) => {
    if (!device) return categoryImageUrl('default');

    const cacheKey = `device_${device.id}`;
    if (imageUrlCache.value.has(cacheKey)) {
        return imageUrlCache.value.get(cacheKey);
    }

    // URL simple sin cache-busting constante
    const url = assetUrl(`images/${device.id}.png`);
    imageUrlCache.value.set(cacheKey, url);
    return url;
};

// Función para obtener la CNH del conductor
const getDriverCNH = (device) => {
    if (!device) return null;

    const position = store.getters["devices/getPosition"](device.id);
    const driverUniqueId = position?.attributes?.driverUniqueId || device.attributes?.driverUniqueId;

    if (driverUniqueId) {
        const driver = store.getters['drivers/getDriverByUniqueId'](driverUniqueId);
        if (driver && driver.attributes && driver.attributes.cnhNumber) {
            return driver.attributes.cnhNumber;
        }
    }

    return null;
};

// Función para obtener la fecha de vencimiento de CNH
const getDriverCNHExpiry = (device) => {
    if (!device) return null;

    const position = store.getters["devices/getPosition"](device.id);
    const driverUniqueId = position?.attributes?.driverUniqueId || device.attributes?.driverUniqueId;

    if (driverUniqueId) {
        const driver = store.getters['drivers/getDriverByUniqueId'](driverUniqueId);
        if (driver && driver.attributes && driver.attributes.cnhExpiryDate) {
            // Formatear la fecha si viene en formato ISO
            const date = new Date(driver.attributes.cnhExpiryDate);
            return date.toLocaleDateString('pt-BR');
        }
    }

    return null;
};

// Función para obtener la placa del vehículo
const getVehiclePlate = (device) => {
    if (!device) return null;

    // Usar device.attributes.placa como especificado
    if (device.attributes && device.attributes.placa) {
        return device.attributes.placa;
    }

    return null;
};

// Función para obtener el texto del estado
const getStatusText = (device) => {
    if (!device) return 'Desconocido';

    const position = store.getters["devices/getPosition"](device.id);
    if (position) {
        if (position.speed > 6) return 'En movimiento';
        if (device.status === 'online') return 'Estacionado';
    }

    return device.status === 'online' ? 'En línea' :
        device.status === 'offline' ? 'Desconectado' : 'Desconocido';
};

// Función para obtener la clase CSS del estado
const getStatusClass = (device) => {
    if (!device) return 'status-unknown';

    const position = store.getters["devices/getPosition"](device.id);
    if (position && position.speed > 6) return 'status-moving';
    if (device.status === 'online') return 'status-online';
    if (device.status === 'offline') return 'status-offline';

    return 'status-unknown';
};

const routePlayState = ref(false);
const routePlayPoint = ref(0);
let routePlayTimer = null;
const showRouteDetailsPanel = ref(false);
const currentRoutePoint = ref(null);
const playbackSpeed = ref(1); // Velocidade de reprodução: 0.5, 1, 2 ou 4


const routePlayPos = computed(() => {
    const pct = (routePlayPoint.value * 100) / routePoints.value.length;
    const sz = (pct * 280) / 100;


    return sz;
})

const stopPlayRoute = () => {
    routePlayState.value = false;
    clearTimeout(routePlayTimer);
    routePlayPoint.value = 0;

    // Limpiar los marcadores de eventos al detener la reproducción
    //clearEventMarkers();
}

const pausePlayRoute = () => {
    routePlayState.value = false;
    window.clearTimeout(routePlayTimer);
}

const restartPlayRoute = () => {
    // Detener la reproducción actual
    pausePlayRoute();

    // Limpiar los marcadores de eventos
    // Función clearEventMarkers no definida, se comenta temporalmente
    // clearEventMarkers();

    // Regresar al inicio de la ruta
    routePlayPoint.value = 0;

    // Actualizar la posición en el mapa
    updatePositionFromTimeline();

    // Iniciar la reproducción
    runPlayRoute();
}

// Función para avanzar al siguiente punto manualmente
const moveForward = () => {
    // Pausar la reproducción si está activa
    if (routePlayState.value) {
        pausePlayRoute();
    }

    // Verificar si hay un punto siguiente
    if (routePlayPoint.value < routePoints.value.length - 1) {
        // Avanzar al siguiente punto
        routePlayPoint.value++;

        // Actualizar la posición en el mapa
        updatePositionFromTimeline();
    }
}

// Función para retroceder al punto anterior manualmente
const moveBackward = () => {
    // Pausar la reproducción si está activa
    if (routePlayState.value) {
        pausePlayRoute();
    }

    // Verificar si hay un punto anterior
    if (routePlayPoint.value > 0) {
        // Retroceder al punto anterior
        routePlayPoint.value--;

        // Actualizar la posición en el mapa
        updatePositionFromTimeline();
    }
}

const nextRoutePoint = () => {
    // Incrementa o ponto atual
    routePlayPoint.value++;

    // Verifica se ainda há pontos para reproduzir
    if (routePlayPoint.value < routePoints.value.length) {
        // Atualiza a posição no mapa conforme o novo ponto
        updatePositionFromTimeline();

        // Calcula o tempo de espera baseado na velocidade de reprodução
        const baseDelay = 2500; // 2.5 segundos como base
        const adjustedDelay = baseDelay / playbackSpeed.value;

        // Agenda o próximo ponto
        routePlayTimer = window.setTimeout(() => {
            nextRoutePoint();
        }, adjustedDelay);
    } else {
        // Parou no final da rota
        routePlayState.value = false;
        routePlayPoint.value = routePoints.value.length - 1;
    }
}

const runPlayRoute = () => {
    if (!routePlayState.value) {
        routePlayState.value = true;
        nextRoutePoint();
    }
}


// Computed para acceder al estado global
const showRouteMarkers = computed(() => store.state.devices.showRouteMarkers);

// Watcher para reaccionar a cambios en showRouteMarkers
watch(showRouteMarkers, (newValue) => {
    console.log('showRouteMarkers changed to:', newValue);
    // Aquí se puede agregar lógica adicional cuando cambie el estado
});

app.provide("showRouteMarkers", showRouteMarkers);


const eyeFilter = ref('');

const waitForMap = () => {
    if (map.value && map.value.leafletObject.createPane) {


        map.value.leafletObject.createPane('hiddenMarkersPane');
        map.value.leafletObject.createPane('clusterMarkersPane');

        const s = store.getters['mapPref']('clustered', true);

        if (s) {
            document.body.classList.remove("way-filtering");
        } else {
            document.body.classList.add("way-filtering");
        }



    } else {
        setTimeout(() => {
            waitForMap();
        }, 1000);
    }
}


onMounted(() => {
    // Añadir listener para el evento personalizado de cierre del tooltip
    document.addEventListener("hideFollowTooltip", hideTooltipManually);

    // Listener para abrir el panel flotante
    document.addEventListener("openFloatingPanel", (event) => {
        const deviceId = event.detail.deviceId;
        const device = store.getters["devices/getDevice"](deviceId);
        if (device) {
            floatingPanelDevice.value = device;
            showFloatingPanel.value = true;
        }
    });

    // Escuchar eventos de commandResult desde Traccar
    document.addEventListener("traccarEvent", (event) => {
        const traccarEvent = event.detail;
        if (traccarEvent.type === 'commandResult' && commandModalRef.value) {
            commandModalRef.value.processDeviceEvent(traccarEvent);
        }
    });


    // Configurar un observador para los cambios en el seguimiento del dispositivo
    watch(() => store.state.devices.isFollowingId, (newValue, oldValue) => {
        try {
            if (!newValue && oldValue) {
                // Si se dejó de seguir el dispositivo, detener el intervalo y ocultar tooltip
                if (tooltipUpdateInterval) {
                    clearInterval(tooltipUpdateInterval);
                    tooltipUpdateInterval = null;
                    window.$hideTip();
                }
                showFloatingPanel.value = false; // También cerrar el panel flotante
            } else if (newValue && !oldValue) {
                // Si empezamos a seguir un dispositivo
                // Creamos el intervalo para actualizar la posición del tooltop si es necesario
                if (!tooltipUpdateInterval) {
                    tooltipUpdateInterval = setInterval(updateFollowTooltip, 1000);
                }
            } else if (newValue && oldValue && newValue !== oldValue) {
                // Si cambió de un dispositivo a otro, actualizar el panel flotante
                updateFloatingPanel();
            }
        } catch (error) {
            console.error("Error en el watcher de seguimiento:", error);
        }
    });

    // Monitor device id changes - keep this watcher light
    watch(() => route.params.deviceId, (newDeviceId, oldDeviceId) => {
        // Only handle route changes, avoid heavy processing here
        console.log("Route device ID changed:", oldDeviceId, "->", newDeviceId);
    });
    waitForMap();
    mapResizeInterval = setInterval(() => {
        if (map.value && map.value.leafletObject && map.value.leafletObject.invalidateSize) {
            map.value.leafletObject.invalidateSize();
        }
    }, 1000);
});

onUnmounted(() => {
    // Eliminar el listener cuando el componente se desmonte
    document.removeEventListener("hideFollowTooltip", hideTooltipManually);
    document.removeEventListener("traccarEvent", (event) => {
        const traccarEvent = event.detail;
        if (traccarEvent.type === 'commandResult' && commandModalRef.value) {
            commandModalRef.value.processDeviceEvent(traccarEvent);
        }
    });

    // Limpiar intervalos
    if (tooltipUpdateInterval) {
        clearInterval(tooltipUpdateInterval);
        tooltipUpdateInterval = null;
    }
    if (mapResizeInterval) {
        clearInterval(mapResizeInterval);
        mapResizeInterval = null;
    }
});

const _availableTypes = ref([
    { key: 'default', name: 'Padrão', isActive: false },
    { key: 'arrow', name: 'Seta', isActive: false },
    { key: 'person', name: 'Pessoas', isActive: false },
    { key: 'animal', name: 'Animais', isActive: false },
    { key: 'bicycle', name: 'Bicicletas', isActive: false },
    { key: 'motorcycle', name: 'Motos', isActive: false },
    { key: 'scooter', name: 'Scooters', isActive: false },
    { key: 'car', name: 'Carros', isActive: false },
    { key: 'pickup', name: 'Pick-Up', isActive: false },
    { key: 'van', name: 'Van', isActive: false },
    { key: 'truck', name: 'Caminhão', isActive: false },
    { key: 'truck1', name: 'Caminhão Cavalo Mecânico', isActive: false },
    { key: 'truck2', name: 'Caminhão Carreta', isActive: false },
    { key: 'tractor', name: 'Tratores', isActive: false },
    { key: 'boat', name: 'Barcos', isActive: false },
    { key: 'ship', name: 'Lanchas', isActive: false },
    { key: 'bus', name: 'Ônibus', isActive: false },
    { key: 'train', name: 'Trêm', isActive: false },
    { key: 'trolleybus', name: 'Ônibus Elétrico', isActive: false },
    { key: 'tram', name: 'Trêm Elétrico', isActive: false },
    { key: 'crane', name: 'Guindastes', isActive: false },
    { key: 'plane', name: 'Aviões', isActive: false },
    { key: 'helicopter', name: 'Helicópteros', isActive: false },
    { key: 'offroad', name: 'Off-Road', isActive: false }
]);


const center = ref([-29.942484, -50.990526]);
const zoomForce = ref(14);



const cptPoints = computed(() => {
    let tmp = [];
    routePoints.value.forEach((p) => {
        tmp.push([p[0], p[1]]);
    })

    return tmp;
})

const changeMap = (id) => {
    let map = 2;
    switch (id) {
        case 1:
            map = 'openstreet';
            break;
        case 2:
            map = 'googleST';
            break;
        case 3:
            map = 'googleTR';
            break;
        case 4:
            map = 'googleSN';
            break;
        case 5:
            map = 'googleDK';
            break;
        case 6:
            map = 'googleDKTR';
            break;
    }

    store.dispatch("setMap", map);
}

const mapReady = (e) => {
    window.$map = e;

    // Inicializamos el control de búsqueda pero lo mantenemos oculto inicialmente
    if (e && e.leafletObject) {
        const searchLayer = new L.LayerGroup();
        e.leafletObject.addLayer(searchLayer);

        // Creamos el control de búsqueda pero no lo añadimos al mapa todavía
        const searchControl = new L.Control.Search({
            layer: searchLayer,
            initial: false,
            propertyName: 'name',
            marker: false,
            position: 'topright',
            moveToLocation: function (latlng, title, map) {
                map.setView(latlng, 16); // Zoom al encontrar ubicación
            },
            buildTip: function (text) {
                return '<a href="#">' + text + '</a>';
            },
            firstTipSubmit: true,
            autoCollapse: true,
            autoType: false,
            minLength: 3,
            textPlaceholder: KT('map.search.placeholder') || 'Buscar dispositivo...',
            textErr: KT('map.search.notFound') || 'No encontrado',
            textCancel: KT('cancel') || 'Cancelar',
            zoom: 16
        });

        // Guardamos la referencia al control para usarla después
        window.$searchControl = searchControl;
    }
}

const zoomUpdated = (z) => {
    zoom.value = z;
}

// Funciones para los controles de zoom
const zoomIn = () => {
    if (map.value && map.value.leafletObject) {
        map.value.leafletObject.zoomIn();
    }
}

const zoomOut = () => {
    if (map.value && map.value.leafletObject) {
        map.value.leafletObject.zoomOut();
    }
}

const selectedMap = computed(() => {
    const userMap = (store.state.auth && store.state.auth['map']) ? store.state.auth['map'] : undefined;
    const serverMap = (store.state.server.serverInfo && store.state.server.serverInfo['map']) ? store.state.server.serverInfo['map'] : 'openstreet'

    const map = userMap || serverMap;

    switch (map) {
        case "googleDKTR":
            return 6;
        case "googleDK":
            return 5;
        case "googleSN":
            return 4;
        case "googleTR":
            return 3;
        case "googleST":
            return 2;
        case "openstreet":
            return 1;
    }


    return 1;

});

const showGeofences = computed(() => store.getters['mapPref']('showGeofences', true));


const availableMaps = ref([
    { id: 1, name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
    { id: 2, name: 'Google Maps Sat', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], url: 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=MA&gl=MA' },
    { id: 3, name: 'Google Maps Trafego', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], url: 'https://{s}.google.com/vt/lyrs=m@221097413,traffic&x={x}&y={y}&z={z}&hl=MA&gl=MA' },
    { id: 4, name: 'Google Maps', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], url: 'https://{s}.google.com/vt/lyrs=m@221097413&x={x}&y={y}&z={z}&hl=MA&gl=MA' },
    { id: 5, name: 'Google Maps Dark', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], url: 'https://{s}.google.com/vt/lyrs=m@221097413&x={x}&y={y}&z={z}&hl=pt-BR&apistyle=s.e%3Ag%7Cp.c%3A%23ff212121%2Cs.e%3Al.i%7Cp.v%3Aoff%2Cs.e%3Al.t.f%7Cp.c%3A%23ff757575%2Cs.e%3Al.t.s%7Cp.c%3A%23ff212121%2Cs.t%3A1%7Cs.e%3Ag%7Cp.c%3A%23ff757575%2Cs.t%3A17%7Cs.e%3Al.t.f%7Cp.c%3A%23ff9e9e9e%2Cs.t%3A21%7Cp.v%3Aoff%2Cs.t%3A19%7Cs.e%3Al.t.f%7Cp.c%3A%23ffbdbdbd%2Cs.t%3A2%7Cs.e%3Al.t.f%7Cp.c%3A%23ff757575%2Cs.t%3A40%7Cs.e%3Ag%7Cp.c%3A%23ff181818%2Cs.t%3A40%7Cs.e%3Al.t.f%7Cp.c%3A%23ff616161%2Cs.t%3A40%7Cs.e%3Al.t.s%7Cp.c%3A%23ff1b1b1b%2Cs.t%3A3%7Cs.e%3Ag.f%7Cp.c%3A%23ff2c2c2c%2Cs.t%3A3%7Cs.e%3Al.t.f%7Cp.c%3A%23ff8a8a8a%2Cs.t%3A50%7Cs.e%3Ag%7Cp.c%3A%23ff373737%2Cs.t%3A49%7Cs.e%3Ag%7Cp.c%3A%23ff3c3c3c%2Cs.t%3A51%7Cs.e%3Al.t.f%7Cp.c%3A%23ff616161%2Cs.t%3A4%7Cs.e%3Al.t.f%7Cp.c%3A%23ff757575%2Cs.t%3A6%7Cs.e%3Ag%7Cp.c%3A%23ff000000%2Cs.t%3A6%7Cs.e%3Al.t.f%7Cp.c%3A%23ff3d3d3d' },
    { id: 6, name: 'Google Maps Dark Trafego', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], url: 'https://{s}.google.com/vt/lyrs=m@221097413,traffic&x={x}&y={y}&z={z}&hl=pt-BR&apistyle=s.e%3Ag%7Cp.c%3A%23ff212121%2Cs.e%3Al.i%7Cp.v%3Aoff%2Cs.e%3Al.t.f%7Cp.c%3A%23ff757575%2Cs.e%3Al.t.s%7Cp.c%3A%23ff212121%2Cs.t%3A1%7Cs.e%3Ag%7Cp.c%3A%23ff757575%2Cs.t%3A17%7Cs.e%3Al.t.f%7Cp.c%3A%23ff9e9e9e%2Cs.t%3A21%7Cp.v%3Aoff%2Cs.t%3A19%7Cs.e%3Al.t.f%7Cp.c%3A%23ffbdbdbd%2Cs.t%3A2%7Cs.e%3Al.t.f%7Cp.c%3A%23ff757575%2Cs.t%3A40%7Cs.e%3Ag%7Cp.c%3A%23ff181818%2Cs.t%3A40%7Cs.e%3Al.t.f%7Cp.c%3A%23ff616161%2Cs.t%3A40%7Cs.e%3Al.t.s%7Cp.c%3A%23ff1b1b1b%2Cs.t%3A3%7Cs.e%3Ag.f%7Cp.c%3A%23ff2c2c2c%2Cs.t%3A3%7Cs.e%3Al.t.f%7Cp.c%3A%23ff8a8a8a%2Cs.t%3A50%7Cs.e%3Ag%7Cp.c%3A%23ff373737%2Cs.t%3A49%7Cs.e%3Ag%7Cp.c%3A%23ff3c3c3c%2Cs.t%3A51%7Cs.e%3Al.t.f%7Cp.c%3A%23ff616161%2Cs.t%3A4%7Cs.e%3Al.t.f%7Cp.c%3A%23ff757575%2Cs.t%3A6%7Cs.e%3Ag%7Cp.c%3A%23ff000000%2Cs.t%3A6%7Cs.e%3Al.t.f%7Cp.c%3A%23ff3d3d3d' }
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

const eyeAll = (showAll) => {
    _availableTypes.value.forEach((t) => {
        // Si showAll es true, mostrar todos los dispositivos (no ocultar)
        // Si showAll es false, ocultar todos los dispositivos
        const targetState = showAll !== undefined ? showAll : false;

        if (store.getters['devices/isHiddenFilter'](t.key) !== targetState) {
            store.dispatch('devices/toggleHiddenFilter', t.key);
        }
    });
};

const markerOut = () => {
    window.$hideTip();
}

// Los tooltips de puntos de ruta se manejan directamente en CanvaPoints.vue

const markerOver = (e) => {

    // Detectar si es un evento de punto de ruta (ya se maneja en CanvaPoints.vue)
    if (e.pointData) {
        return;
    }

    const deviceId = (e.target) ? e.target.options.id : e;
    const device = store.getters['devices/getDevice'](deviceId);
    const position = store.getters['devices/getPosition'](deviceId);


    const markPoint = map.value.leafletObject.latLngToContainerPoint(e.target._latlng);

    const left = markPoint.x + (router.currentRoute.value.meta.shown ? 553 : 73);
    const top = markPoint.y;

    // Create enhanced tooltip content with device status
    // Añadir círculo de estado de conexión antes del nombre
    let connectionStatusColor = '#e6a23c'; // unknown por defecto

    if (device.lastUpdate === null || (device.status !== 'online' && device.status !== 'offline')) {
        connectionStatusColor = '#e6a23c';
    } else if (device.status === 'online' && position && position.speed > 6) {
        connectionStatusColor = '#409eff';
    } else if (device.status === 'online') {
        connectionStatusColor = '#67c23a';
    } else if (device.status === 'offline') {
        connectionStatusColor = '#f56c6c';
    }

    // Tooltip de hover con estilos consistentes y transparencias correctas
    let tooltipContent = `<div style="padding:10px;min-width:280px;">
      <!-- Nombre del dispositivo con círculo de estado -->
      <div style="font-weight:bold;color:#ffffff;text-align:center;font-size:14px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${connectionStatusColor};margin-right:6px;flex-shrink:0;"></span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${device.name}</span>
      </div>`;

    // Grid de iconos de estado
    if (position && position.attributes) {
        tooltipContent += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:10px;">';

        // 1. Ignición
        const ignitionColor = position.attributes.ignition ? '#4ade80' : '#ef4444';
        tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${ignitionColor};">
        <i class="fas fa-key" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:10px;text-align:center;color:#ffffff;">${position.attributes.ignition ? 'LIG' : 'DES'}</span>
      </div>`;

        // 2. Bloqueo
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

        // 3. Batería del vehículo
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

        // 4. Batería interna
        let batteryColor = '#94a3b8';
        let batteryValue = 'N/A';
        if (position.attributes.batteryLevel) {
            const batteryLevel = parseInt(position.attributes.batteryLevel);
            batteryValue = batteryLevel + '%';
            batteryColor = batteryLevel < 30 ? '#ef4444' : (batteryLevel < 70 ? '#f59e0b' : '#4ade80');
        } else if (position.attributes.battery) {
            const battery = parseFloat(position.attributes.battery);
            batteryValue = battery.toFixed(1) + 'v';
            batteryColor = battery < 3.2 ? '#ef4444' : (battery < 3.7 ? '#f59e0b' : '#4ade80');
        }
        tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${batteryColor};">
        <i class="fas fa-battery-half" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:9px;text-align:center;color:#ffffff;">${batteryValue}</span>
      </div>`;

        // 5. Combustible
        let fuelColor = '#94a3b8';
        let fuelValue = 'N/A';
        if (position.attributes.fuel !== undefined) {
            const fuel = parseInt(position.attributes.fuel);
            fuelValue = fuel + '%';
            fuelColor = fuel < 25 ? '#ef4444' : (fuel < 50 ? '#f59e0b' : '#4ade80');
        }
        tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${fuelColor};">
        <i class="fas fa-gas-pump" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:9px;text-align:center;color:#ffffff;">${fuelValue}</span>
      </div>`;

        // 6. Velocidad
        const speedKmh = Math.round(position.speed * 1.852);
        const speedColor = speedKmh > 0 ? '#4ade80' : '#94a3b8';
        tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${speedColor};">
        <i class="fas fa-tachometer-alt" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:9px;text-align:center;color:#ffffff;">${speedKmh}km</span>
      </div>`;

        // 7. Satélites
        let satellitesColor = '#94a3b8';
        let satellitesValue = 'N/A';
        if (position.attributes.satellites !== undefined) {
            const sat = parseInt(position.attributes.satellites);
            satellitesValue = sat.toString();
            satellitesColor = sat < 4 ? '#ef4444' : (sat < 8 ? '#f59e0b' : '#4ade80');
        } else if (position.attributes.sat !== undefined) {
            const sat = parseInt(position.attributes.sat);
            satellitesValue = sat.toString();
            satellitesColor = sat < 4 ? '#ef4444' : (sat < 8 ? '#f59e0b' : '#4ade80');
        }
        tooltipContent += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${satellitesColor};">
        <i class="fas fa-satellite" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:9px;text-align:center;color:#ffffff;">${satellitesValue}</span>
      </div>`;

        tooltipContent += '</div>';

        // Dirección/Coordenadas con truncado forzado
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

        // Conductor (comprobamos tanto en device.attributes como en position.attributes)
        if ((device.attributes && device.attributes.driverUniqueId) || (position.attributes && position.attributes.driverUniqueId)) {
            // Priorizar el driver de position.attributes que es el más actualizado
            const driverUniqueId = position.attributes?.driverUniqueId || device.attributes?.driverUniqueId;
            let driverInfo = driverUniqueId;

            // Obtener información del conductor usando el getter
            const driver = store.getters['drivers/getDriverByUniqueId'](driverUniqueId);
            if (driver) {
                driverInfo = driver.name || driver.uniqueId;
            }

            tooltipContent += `<div style="color:#ffffff;font-size:9px;margin-bottom:6px;text-align:center;">
          <i class="fas fa-user" style="margin-right:4px;color:#34d399;"></i>${driverInfo}
        </div>`;
        }

        // Línea inferior con iconos: fecha, ángulo y estado
        let bottomLine = '';

        // Fecha con reloj (separar icono y correr hora)
        if (device.lastUpdate) {
            const lastUpdateDate = new Date(device.lastUpdate);
            const formattedDate = lastUpdateDate.toLocaleDateString() + ' ' + lastUpdateDate.toLocaleTimeString();
            bottomLine += `<i class="fas fa-clock" style="color:#a78bfa;margin-right:4px;"></i>${formattedDate} `;
        }

        // Ángulo sin decimales con compass y dirección N/S
        if (position.course !== undefined && position.course !== null) {
            const angle = Math.round(position.course);
            const direction = angle >= 0 && angle <= 180 ? 'N' : 'S';
            bottomLine += `<i class="fas fa-compass" style="color:#fbbf24;margin-left:8px;margin-right:4px;"></i>${angle}°${direction} `;
        }

        // Estado del dispositivo con iconos exactos de device.item (solo admin)
        let deviceState = '';
        let stateIcon = '';
        let stateColor = '';
        if (device.attributes && device.attributes['device.state'] && store.state.auth.administrator) {
            const state = device.attributes['device.state'];
            switch (state) {
                case 'installed':
                    deviceState = 'Instalado em Cliente';
                    stateIcon = 'fa-check-circle';
                    stateColor = '#67c23a';
                    break;
                case 'in_service':
                    deviceState = 'Em Serviço Técnico';
                    stateIcon = 'fa-tools';
                    stateColor = '#f59e0b';
                    break;
                case 'in_stock':
                    deviceState = 'Em Estoque';
                    stateIcon = 'fa-box';
                    stateColor = '#6b7280';
                    break;
                case 'with_failures':
                    deviceState = 'Com Falhas';
                    stateIcon = 'fa-exclamation-triangle';
                    stateColor = '#ef4444';
                    break;
                case 'company':
                    deviceState = 'Em Empresa';
                    stateIcon = 'fa-building';
                    stateColor = '#3b82f6';
                    break;
                case 'withdrawn':
                    deviceState = 'Retirado';
                    stateIcon = 'fa-archive';
                    stateColor = '#dc2626';
                    break;
                default:
                    deviceState = state;
            }
        }
        if (deviceState) {
            bottomLine += `<i class="fas ${stateIcon}" style="color:${stateColor};margin-left:8px;margin-right:4px;"></i>${deviceState}`;
        }

        if (bottomLine) {
            tooltipContent += `<div style="color:#ffffff;font-size:10px;margin-bottom:6px;text-align:center;">
          ${bottomLine}
        </div>`;
        }
    }

    tooltipContent += '</div>';
    window.$showTip({ left: left + 'px', top: (top) + 'px' }, tooltipContent, true);
}

const flyToDevice = (device) => {
    const position = store.getters["devices/getPosition"](device.id);
    const zoom = (store.state.server.serverInfo.attributes && store.state.server.serverInfo.attributes['web.selectZoom']) ? store.state.server.serverInfo.attributes['web.selectZoom'] : 18;
    if (position) {
        setTimeout(() => {
            //map.value.leafletObject.setZoom(17)
            setTimeout(() => {
                map.value.leafletObject.flyTo([position.latitude, position.longitude], zoom, { animate: true, duration: 1.5 });
            }, 100);
        }, 100);
    }
}



const markerClick = (e) => {
    console.log(e);

    const deviceId = (e.target) ? e.target.options.id : e;

    // Si Street View está activo, lo desactivamos
    if (store.state.devices.streetview) {
        store.dispatch("devices/toggleStreet");
    }

    // Navegar a la vista de detalles del dispositivo
    router.push('/devices/' + deviceId);

    const device = store.getters['devices/getDevice'](deviceId);
    store.commit("devices/setFollow", deviceId);

    // Traer el icono del dispositivo al frente
    if (device && device.icon) {
        device.icon.forEach((i) => {
            if (i) i.bringToFront();
        });
    }

    if (device) {
        flyToDevice(device);
    }

}


const updateRoute = (points, show = true) => {

    if (points.length) {
        store.commit("devices/setRoute", true);

        // Disable clustering when showing a route by setting clustered preference to false
        // Only if it's currently enabled
        if (store.getters['mapPref']('clustered', true)) {
            // Save current cluster state to restore it later when route is closed
            window.previousClusterState = true;
            // Disable clustering
            store.dispatch('setMapPref', ['clustered', false]);
        }
    }

    routePoints.value = points;
    showRoutePoints.value = show;

    if (points.length > 0) {
        let tmp = [];
        for (var p in points) {
            tmp.push([points[p][0], points[p][1]]);
        }

        setTimeout(() => {
            const bds = L.latLngBounds(tmp);
            map.value.leafletObject.fitBounds(bds);
        }, 300);
    }
}



const setMapCenter = (pos) => {
    map.value.leafletObject.panTo(pos);
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

const mapMove = (e) => {
    if (e.latlng && store.state.geofences.mapPointEditing === 2 && store.state.geofences.mapPointEditingType === 'CIRCLE' && store.state.geofences.mapPointEditingParams.length === 3) {
        // eslint-disable-next-line no-undef
        store.dispatch("geofences/setCircleRadius", L.latLng(store.getters["geofences/getCirclePosition"]).distanceTo(e.latlng));
    }
}

const showCustomCommandDialog = (device) => {
    console.log('showCustomCommandDialog llamado con device:', device);
    selectedDevice.value = device;
    commandModalOpen.value = true;
    console.log('commandModalOpen establecido a:', commandModalOpen.value);
};

const markerContext = async (evt, e) => {

    let addSep = false;

    const deviceId = (evt.target && evt.target.options && evt.target.options.id) ? evt.target.options.id : e;

    const user = store.state.auth;
    const device = store.getters["devices/getDevice"](deviceId);
    const position = store.getters["devices/getPosition"](deviceId)

    let availableSaved = [];

    let commands = [];

    // Agregar opción de comando personalizado al inicio
    commands.push({
        text: KT('device.custom_command'),
        icon: 'fas fa-edit',
        cb: () => {
            showCustomCommandDialog(device);
        }
    });

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
    }

    // Always get commands regardless of device status
    if (!runtimeApi) throw new Error('Runtime API não disponível. Recarregue a página.');
    runtimeApi.getTypeCommands(deviceId).then((response) => {
        const availableTypesCommand = response.data;

        availableTypesCommand.forEach((c) => {
            // Usar SliderConfirmModal para comandos de bloqueo/desbloqueo
            console.log('Procesando comando tipo:', c.type, c);
            if (c.type === 'engineStop') {
                console.log('DETECTADO COMANDO engineStop - usando modal slider');
                commands.push({
                    text: KT('actions.' + c.type),
                    className: device.status !== 'online' ? 'offline-command' : '',
                    cb: () => {
                        // Emitir evento para abrir modal de bloqueo
                        console.log('Emitiendo evento openBlockModal:', { device, command: c });
                        window.dispatchEvent(new CustomEvent('openBlockModal', {
                            detail: { device: device, command: c }
                        }));
                    }
                });
            } else if (c.type === 'engineResume') {
                console.log('DETECTADO COMANDO engineResume - usando modal slider');
                commands.push({
                    text: KT('actions.' + c.type),
                    className: device.status !== 'online' ? 'offline-command' : '',
                    cb: () => {
                        // Emitir evento para abrir modal de desbloqueo
                        window.dispatchEvent(new CustomEvent('openUnlockModal', {
                            detail: { device: device, command: c }
                        }));
                    }
                });
            } else {
                commands.push({
                    text: KT('actions.' + c.type),
                    className: device.status !== 'online' ? 'offline-command' : '',
                    cb: () => {
                        runtimeApi.sendCommand({ deviceId: deviceId, type: c.type });
                        ElNotification({
                            header: KT('success'),
                            message: device.status !== 'online' ? KT('device.command_queued') : KT('device.command_sent'),
                            type: 'success',
                        });
                    }
                });
            }
        });

        runtimeApi.getAvailableCommands(deviceId).then((response) => {
            availableSaved = response.data;

            if (commands.length > 0 && availableSaved.length > 0) {
                commands.push({ text: 'separator' });
            }

            availableSaved.forEach((c) => {
                // Usar SliderConfirmModal para comandos de bloqueo/desbloqueo guardados
                console.log('Procesando comando guardado:', c.type, c.description, c);
                if (c.type === 'engineStop' || c.description.toLowerCase().includes('bloquear')) {
                    commands.push({
                        text: c.description,
                        className: device.status !== 'online' ? 'offline-command' : '',
                        cb: () => {
                            // Emitir evento para abrir modal de bloqueo
                            window.dispatchEvent(new CustomEvent('openBlockModal', {
                                detail: { device: device, command: c }
                            }));
                        }
                    });
                } else if (c.type === 'engineResume' || c.description.toLowerCase().includes('desbloquear')) {
                    commands.push({
                        text: c.description,
                        className: device.status !== 'online' ? 'offline-command' : '',
                        cb: () => {
                            // Emitir evento para abrir modal de desbloqueo
                            window.dispatchEvent(new CustomEvent('openUnlockModal', {
                                detail: { device: device, command: c }
                            }));
                        }
                    });
                } else {
                    commands.push({
                        text: c.description,
                        className: device.status !== 'online' ? 'offline-command' : '',
                        cb: () => {
                            ElMessageBox.confirm(
                                KT('device.confirm_command', device),
                                device.status !== 'online' ? KT('device.offline') : 'Warning',
                                {
                                    confirmButtonText: KT('OK'),
                                    cancelButtonText: KT('Cancel'),
                                    type: device.status !== 'online' ? 'info' : 'warning',
                                }
                            ).then(() => {
                                runtimeApi.sendCommand({ ...c, ...{ deviceId: deviceId } });

                                ElNotification({
                                    header: KT('success'),
                                    message: device.status !== 'online' ? KT('device.command_queued') : KT('device.command_sent'),
                                    type: 'success',
                                });
                            }).catch(() => {
                                ElMessage.error(KT('userCancel'));
                            })
                        }
                    });
                }
            });
        })
    });

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

                // ✅ REMOVIDO: Street View não deve abrir automaticamente
                // Usuário pode ativar manualmente se quiser
                // const googleApiKey = store.getters['server/getAttribute']('google_api');
                // if (googleApiKey && googleApiKey.trim() !== '') {
                //     if (!store.state.devices.streetview) {
                //         store.dispatch("devices/toggleStreet");
                //     }
                // }
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


    //


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

    if (store.getters.advancedPermissions(25)) {
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
                    header: device.name,
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

                ElMessage.success(KT('map.copytranfer'));

                //ElMessage.success( KT('device.Copiado_pararea de transferência'));
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
                    header: device.name,
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

                ElMessage.success(KT('map.copytranfer'));
            }

        }
    });

    tmp.push({
        text: KT('device.share'),
        icon: 'fas fa-share-alt',
        submenu: shares
    });




    addSep = true;

    // Primera opción de anchor (DESHABILITADA - usar la segunda opción con slider)
    /*
    if (store.state.server.isPlus && store.getters.advancedPermissions(9)) {

      if (addSep) {
        tmp.push({ text: 'separator' });
        addSep = false;
      }

      const isAnchored = store.getters['geofences/isAnchored'](device.id);

      tmp.push({
        text: KT((isAnchored) ? 'actions.anchorDisable' : 'actions.anchorEnable'),
        icon: isAnchored ? 'fas fa-anchor' : 'fas fa-anchor',
        cb: () => {
          actAnchor(device.id);
        }
      });
    }
    */



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

    if (store.getters.advancedPermissions(32)) {


        attributions.push({
            text: KT('notification.notifications'),
            icon: 'fas fa-bell',
            cb: () => {
                linkObjectsRef.value.showObjects({ deviceId: device.id, type: 'notifications' });
            }
        });
        /*
        attributions.push({
          text: KT('notification.notifications'), cb: () => {
            linkObjectsRef.value.showObjects({deviceId: device.id, type: 'events'});
          }
        });
      */



    }


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
    if (user.administrator) {
        tmp.push({
            text: KT('device.logs'),
            icon: 'fas fa-list-alt',
            cb: () => {
                logObjectsRef.value.showLogs({ deviceId: deviceId });
            }
        });
    }

    // Agregar opción de anchor
    if (store.getters.advancedPermissions(9)) {
        const isAnchored = store.getters['geofences/isAnchored'](deviceId);
        tmp.push({
            text: KT(isAnchored ? 'actions.anchorDisable' : 'actions.anchorEnable'),
            icon: 'fas fa-anchor',
            cb: () => {
                const actionType = isAnchored ? 'anchor_disable' : 'anchor_enable';

                // Emitir evento para abrir modal de anchor
                window.dispatchEvent(new CustomEvent('openAnchorModal', {
                    detail: { device: device, command: { type: actionType } }
                }));
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



// Tooltip visible/oculto y datos del tooltip
const tooltipVisible = ref(false);
const tooltipData = ref({
    name: '',
    distance: 0,
    speed: 0
});
const tooltipStyle = ref({ top: '0px', left: '0px' }); // Aquí puedes cambiar el estilo dinámicamente

// Mostrar el tooltip cuando el mouse pasa sobre un marcador
function showTooltip(index, point) {
    tooltipData.value = {
        name: index === 0 ? 'Start' : index === routePoints.value.length - 1 ? 'End' : `Point ${index + 1}`,
        distance: point.distance,
        speed: point.speed
    };
    tooltipVisible.value = true;

    // Calcular y actualizar la posición del tooltip en función de la posición del marcador
    // Asumimos que 'p' es un objeto con 'lat' y 'lng', en la práctica necesitarás convertir estas coordenadas a píxeles.
    tooltipStyle.value = { top: `${index * 30}px`, left: '50px' }; // Aquí puedes hacer ajustes según la UI
}

// Ocultar el tooltip cuando el mouse se va
function hideTooltip() {
    tooltipVisible.value = false;
}

// Funções para a caixa de detalhes da rota
const showRouteDetails = () => {
    showRouteDetailsPanel.value = true;
    updateCurrentRoutePoint();
};

// Função removida por não ser utilizada
// const closeRouteDetails = () => {
//   showRouteDetailsPanel.value = false;
//   currentRoutePoint.value = null;
// };

const showDetailsPanel = ref(false);
const showAdvancedDetails = () => {
    // Abrir o painel lateral com detalhes completos
    showDetailsPanel.value = true;
    updateCurrentRoutePoint();
};

const copyLocation = (point) => {
    if (!point) return;

    const locationText = `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`;
    const tempElement = document.createElement('textarea');
    tempElement.value = locationText;
    document.body.appendChild(tempElement);
    tempElement.select();
    document.execCommand('copy');
    document.body.removeChild(tempElement);

    ElMessage.success(KT('map.copytranfer') || 'Posição copiada para área de transferência');
};

const openInMaps = (point) => {
    if (!point) return;

    const url = `http://maps.google.com/maps?q=loc:${point.latitude},${point.longitude}`;
    window.open(url, '_blank');
};

const getBatteryIcon = (level) => {
    if (level === undefined || level === null) return 'fas fa-battery-empty';

    if (level >= 90) return 'fas fa-battery-full';
    if (level >= 70) return 'fas fa-battery-three-quarters';
    if (level >= 40) return 'fas fa-battery-half';
    if (level >= 10) return 'fas fa-battery-quarter';
    return 'fas fa-battery-empty';
};

const getBatteryClass = (level) => {
    if (level === undefined || level === null) return '';

    if (level >= 50) return 'active';
    if (level >= 20) return 'warning';
    return 'danger';
};

const getTemperatureClass = (temp) => {
    if (temp === undefined || temp === null) return '';

    if (temp > 80) return 'danger';
    if (temp > 60) return 'warning';
    if (temp < 0) return 'info';
    return 'active';
};

const getSignalClass = (rssi) => {
    if (rssi === undefined || rssi === null) return '';

    // Valores de referência para RSSI (ajuste conforme necessário)
    // RSSI geralmente é negativo, valores mais próximos de 0 são melhores
    if (rssi > -70) return 'active';
    if (rssi > -85) return 'warning';
    return 'danger';
};

const updateCurrentRoutePoint = async () => {
    if (routePoints.value.length > 0 && routePlayPoint.value < routePoints.value.length) {
        // Obter o ID do ponto atual da rota
        const pointId = routePoints.value[routePlayPoint.value][2];

        // Buscar os detalhes completos da posição na store
        let pointDetails = store.getters['routes/getPositionById'](pointId);

        // Se não tiver endereço, tente carregá-lo
        if (pointDetails && !pointDetails.address) {
            pointDetails = await store.dispatch('routes/loadAddress', pointId);
        }

        // Atualizar o ponto atual com os detalhes completos
        currentRoutePoint.value = pointDetails;
    } else {
        currentRoutePoint.value = null;
    }
};

const formatDateTime = (timestamp, compact = false) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp);

    if (compact) {
        // Formato compacto: apenas hora e minuto
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } else {
        // Formato completo
        return date.toLocaleString();
    }
};

// Lista de atributos que se mostrarán en la cuadrícula principal
const mainAttributes = ['ignition', 'blocked', 'sat', 'power', 'totalDistance', 'battery', 'batteryLevel', 'distance', 'hours', 'temperature', 'fuel', 'motion', 'satellites'];

// Filtrar atributos para excluir los que ya se muestran en la cuadrícula principal
const filteredAttributes = computed(() => {
    if (!currentRoutePoint.value || !currentRoutePoint.value.attributes) return {};

    const result = {};
    // Lista de atributos a excluir
    const excludedAttributes = ['raw'];

    for (const [key, value] of Object.entries(currentRoutePoint.value.attributes)) {
        // Excluir los atributos principales, los atributos en la lista de excluidos,
        // y aquellos que son objetos complejos o null
        if (!mainAttributes.includes(key) &&
            !excludedAttributes.includes(key) &&
            value !== null &&
            typeof value !== 'object') {
            result[key] = value;
        }
    }
    return result;
});

const formatAttributeValue = (key, value) => {
    // Formatar valores específicos
    if (key === 'totalDistance' || key === 'distance' || key === 'odometer') {
        return (value / 1000).toFixed(2) + ' km';
    } else if (key === 'batteryLevel' || key === 'fuel') {
        return value + '%';
    } else if (key === 'power' || key === 'battery') {
        return parseFloat(value).toFixed(1) + 'V';
    } else if (key === 'speed') {
        return value + ' km/h';
    } else if (key === 'temperature') {
        return value + '°C';
    } else if (typeof value === 'boolean') {
        return value ? KT('yes') : KT('no');
    } else if (key.toLowerCase().includes('time') && !isNaN(new Date(value).getTime())) {
        // Se parece uma data/hora
        return formatDateTime(value);
    } else if (typeof value === 'number') {
        // Formatar valores numéricos com 2 casas decimais se for um número flutuante
        return Number.isInteger(value) ? value : value.toFixed(2);
    }

    // Valor padrão como string
    return value.toString();
};

// Converter ângulo em direção cardinal
const getCardinalDirection = (angle) => {
    if (angle === null || angle === undefined) return 'N/A';

    // Normalizar o ângulo para 0-360
    const normAngle = ((angle % 360) + 360) % 360;

    // Definir os pontos cardeais e colaterais
    const directions = [
        { name: 'N', min: 348.75, max: 360 },
        { name: 'N', min: 0, max: 11.25 },
        { name: 'NNE', min: 11.25, max: 33.75 },
        { name: 'NE', min: 33.75, max: 56.25 },
        { name: 'ENE', min: 56.25, max: 78.75 },
        { name: 'L', min: 78.75, max: 101.25 },
        { name: 'ESE', min: 101.25, max: 123.75 },
        { name: 'SE', min: 123.75, max: 146.25 },
        { name: 'SSE', min: 146.25, max: 168.75 },
        { name: 'S', min: 168.75, max: 191.25 },
        { name: 'SSO', min: 191.25, max: 213.75 },
        { name: 'SO', min: 213.75, max: 236.25 },
        { name: 'OSO', min: 236.25, max: 258.75 },
        { name: 'O', min: 258.75, max: 281.25 },
        { name: 'ONO', min: 281.25, max: 303.75 },
        { name: 'NO', min: 303.75, max: 326.25 },
        { name: 'NNO', min: 326.25, max: 348.75 }
    ];

    // Encontrar a direção correspondente ao ângulo
    for (const dir of directions) {
        if ((dir.min <= normAngle && normAngle < dir.max) ||
            (dir.name === 'N' && (normAngle >= 348.75 || normAngle < 11.25))) {
            return dir.name;
        }
    }

    return 'N/A'; // Fallback
};

// Função removida por não ser utilizada
// const calculateDistance = (index) => {
//   if (index <= 0 || index >= routePoints.value.length) {
//     return 0;
//   }
//   
//   const currentPoint = routePoints.value[index];
//   const previousPoint = routePoints.value[index - 1];
//   
//   // Usar a biblioteca Leaflet para calcular a distância
//   const distance = L.latLng(currentPoint[0], currentPoint[1])
//     .distanceTo(L.latLng(previousPoint[0], previousPoint[1]));
//   
//   return Math.round(distance);
// };

// Funções para controle de arrastar a timeline
const isDragging = ref(false);
const startX = ref(0);

const startDrag = (event) => {
    // Para eventos de mouse e touch
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    startX.value = clientX;
    isDragging.value = true;

    // Pausa a reprodução se estiver acontecendo
    if (routePlayState.value) {
        pausePlayRoute();
    }

    // Adiciona os event listeners para quando o mouse se move e quando solta
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);

    // Previne comportamento padrão
    if (event.preventDefault) {
        event.preventDefault();
    }
};

const onDrag = (event) => {
    if (!isDragging.value) return;

    // Para eventos de mouse e touch
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const deltaX = clientX - startX.value;
    startX.value = clientX;

    // Calcula a nova posição
    // const timelineContainer = event.target.parentElement; // Variável não utilizada
    const timelineWidth = 280; // Largura da nossa linha de timeline

    // Calcula quanto isso representa em porcentagem do progresso
    const pixelPerPoint = timelineWidth / (routePoints.value.length - 1);
    const pointsDelta = Math.round(deltaX / pixelPerPoint);

    // Atualiza ponto atual
    let newPoint = routePlayPoint.value + pointsDelta;

    // Limita aos limites da timeline
    newPoint = Math.max(0, Math.min(newPoint, routePoints.value.length - 1));

    // Atualiza o ponto
    if (newPoint !== routePlayPoint.value) {
        routePlayPoint.value = newPoint;
        updatePositionFromTimeline();
    }

    // Previne comportamento padrão como scroll
    if (event.preventDefault) {
        event.preventDefault();
    }
};











const stopDrag = () => {
    isDragging.value = false;

    // Remove os event listeners
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
};

const moveTimelinePosition = (event) => {
    // Calcula a posição clicada na timeline
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;

    // Calcula o percentual da timeline
    const percent = x / 280; // 280px é o tamanho da timeline

    // Calcula o índice do ponto
    const newPointIndex = Math.round(percent * (routePoints.value.length - 1));

    // Atualiza o ponto
    routePlayPoint.value = newPointIndex;

    // Atualiza a posição no mapa
    updatePositionFromTimeline();
};
/////////////////////////////////////
const updatePositionFromTimeline = () => {
    if (routePlayPoint.value >= 0 && routePlayPoint.value < routePoints.value.length) {
        const point = routePoints.value[routePlayPoint.value];
        const device = store.getters['devices/getDevice'](parseInt(store.state.devices.applyFilters.showOnlyId));

        if (device && device.icon && device.icon[0]) {
            // Ajusta o tempo de animação com base na velocidade de reprodução (mais rápido para velocidades maiores)
            const animationDuration = 200 / playbackSpeed.value;
            device.icon[0].moveTo(L.latLng(point[0], point[1]), animationDuration);
            device.icon[0].options.img.rotate = point[3];

            // Atualiza o ponto atual para a caixa de detalhes se estiver visível
            if (showRouteDetailsPanel.value) {
                updateCurrentRoutePoint();
            }

            // Armazena o ponto atual na store
            store.commit("devices/setRoutePlayPoint", routePlayPoint.value);
        }
    }
};

////////////////////////////////////////////

const togglePlaybackSpeed = () => {
    // Alternar entre 0.5x, 1x, 2x e 4x
    const speeds = [0.5, 1, 2, 4];
    const currentIndex = speeds.indexOf(playbackSpeed.value);
    const nextIndex = (currentIndex + 1) % speeds.length;
    playbackSpeed.value = speeds[nextIndex];

    // Se estiver reproduzindo, pausar e reiniciar para aplicar a nova velocidade
    if (routePlayState.value) {
        // Lembrar a posição atual
        // const currentPosition = routePlayPoint.value; // Variável não utilizada

        // Pausar a reprodução
        pausePlayRoute();

        // Reiniciar a reprodução com a nova velocidade
        routePlayState.value = true;
        nextRoutePoint();
    }
};

// Función para mostrar/ocultar el control de búsqueda
const toggleSearch = () => {
    if (window.$map && window.$map.leafletObject) {
        const map = window.$map.leafletObject;

        // Verificamos si el control ya está añadido al mapa
        if (window.$searchControl && window.$searchControl._map) {
            // Si ya está añadido, lo eliminamos
            map.removeControl(window.$searchControl);
            ElMessage.success(KT('map.search.disabled') || 'Búsqueda desactivada');
        } else if (window.$searchControl) {
            // Creamos una nueva capa para los marcadores buscables
            const searchLayer = new L.LayerGroup();
            map.addLayer(searchLayer);

            // Añadimos los dispositivos como marcadores buscables
            if (store.state.devices && store.state.devices.list) {
                Object.values(store.state.devices.list).forEach(device => {
                    if (device.latitude && device.longitude) {
                        const marker = L.marker([device.latitude, device.longitude], {
                            title: device.name || 'Sin nombre',
                        });
                        marker.bindPopup(device.name || 'Sin nombre');
                        // Es importante que la propiedad name coincida con propertyName en el control de búsqueda
                        marker.name = device.name || 'Sin nombre';
                        searchLayer.addLayer(marker);
                    }
                });
            }

            // Establecemos la capa de búsqueda y añadimos el control al mapa
            window.$searchControl.setLayer(searchLayer);
            map.addControl(window.$searchControl);

            ElMessage.success(KT('map.search.enabled') || 'Búsqueda activada');
        }
    }
};

// Función para abrir el asistente virtual (WhatsApp)
const openWhatsAppAssistant = () => {
    if (store.state.server.labelConf.whatsapp && store.state.server.labelConf.whatsapp !== '') {
        const phoneNumber = store.state.server.labelConf.whatsapp;
        const message = 'Hola, necesito ayuda con el sistema de rastreo';
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    } else {
        // Si no hay número configurado, mostrar un mensaje o abrir un modal de asistente
        ElMessage.info('Asistente virtual no configurado');
    }
};







</script>

<!-- ⚠️ CSS de popper movido para src/assets/css/kore-map.poppers.css
     Usar: popper-class="kore-map-popper kore-map-popper--dark"
     NÃO adicionar estilos de popper aqui - são teleportados para <body> -->

<style scoped>
/* Estilos para el contenedor vertical de botones */
.vertical-controls-container {
    position: relative;
    display: flex;
    flex-direction: column;
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 12px;
    padding: 2px;
    width: auto;
    min-width: 30px;
    gap: 1px;
}

/* Ajuste de tamaño y apariencia de los botones dentro del contenedor */
.vertical-controls-container .el-button {
    background-color: transparent;
    border: none;
    min-width: 26px !important;
    height: 26px !important;
    padding: 0 !important;
    font-size: 12px;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

/* Asegurar que todos los iconos estén centrados */
.vertical-controls-container .el-button i {
    display: block;
    width: 100%;
    text-align: center;
    line-height: 1;
    margin: 0;
}

.vertical-controls-container .el-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
}

/* Aseguramos que los dropdowns se muestren correctamente */
.vertical-controls-container .el-dropdown {
    width: 100%;
}

.vertical-controls-container .el-dropdown .el-button {
    width: 100%;
    margin: 0;
}


/* Responsive para móviles - reducir altura del contenedor */
@media (orientation: portrait) and (max-width: 768px) {
    .vertical-controls-container {
        padding: 1px;
        min-width: 26px;
        border-radius: 8px;
        gap: 0px;
    }

    .vertical-controls-container .el-button {
        min-width: 22px !important;
        height: 22px !important;
        font-size: 10px;
        margin-bottom: 0px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }

    .vertical-controls-container .el-button i {
        display: block;
        width: 100%;
        text-align: center;
        line-height: 1;
        margin: 0;
    }

    /* Eliminar todos los márgenes en móvil */
    .vertical-controls-container .el-button[style*="margin-bottom"] {
        margin-bottom: 0px !important;
    }

    /* Dropdowns em mobile - estilos movidos para kore-map.poppers.css */
}

/* Estilos para el control de búsqueda */
:deep(.leaflet-control-search) {
    background: white;
    border-radius: 4px;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.4);
    padding: 5px;
}

:deep(.leaflet-control-search .search-input) {
    width: 180px;
    padding: 5px 25px 5px 8px;
    height: 32px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 12px;
}

:deep(.leaflet-control-search .search-button) {
    background: var(--el-color-primary);
    border-radius: 4px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

:deep(.leaflet-control-search .search-tooltip) {
    background: white;
    border-radius: 4px;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.4);
    max-height: 200px;
    overflow: auto;
}

:deep(.leaflet-control-search .search-tip) {
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
    font-size: 12px;
    cursor: pointer;
    color: #333;
}

:deep(.leaflet-control-search .search-tip:hover) {
    background-color: var(--el-color-primary-light-8);
}

.route-details-panel {
    position: absolute;
    right: 2px;
    top: 5px;
    /* Posição abaixo dos controles superiores */
    width: 250px;
    max-height: 80vh;
    /* Altura adaptativa */
    background: white;
    border-radius: 8px;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 3px 10px;
    z-index: 1000;
    transition: all 0.3s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.route-details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--el-color-primary);
    color: white;
    font-weight: bold;
    font-size: 13px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.route-details-header i {
    margin-right: 6px;
    font-size: 12px;
}

.route-details-close {
    cursor: pointer;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
    background-color: rgba(255, 255, 255, 0.1);
    font-size: 11px;
}

.route-details-close:hover {
    background-color: rgba(255, 255, 255, 0.25);
    transform: rotate(90deg);
}

.route-details-content {
    padding: 10px;
    flex-grow: 1;
    overflow-y: auto;
    scrollbar-width: thin;
}

.route-detail-item {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    padding-bottom: 0;
    gap: 8px;
}

.route-detail-item:not(:last-child) {
    border-bottom: 1px solid var(--el-border-color-light);
    padding-bottom: 10px;
}

.detail-label {
    font-weight: 600;
    font-size: 9px;
    color: var(--el-color-info);
    margin-bottom: 3px;
    display: flex;
    align-items: center;
}

.detail-label i,
.detail-label svg {
    margin-right: 8px;
    font-size: 10px;
    color: var(--el-color-primary);
}

.detail-value {
    font-size: 13px;
    color: var(--el-text-color-primary);
    font-weight: 500;
    width: 100%;
}

.route-no-point {
    text-align: center;
    padding: 30px 0;
    color: var(--el-text-color-secondary);
    font-style: italic;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 120px;
}

.route-no-point:before {
    content: "\f1e5";
    /* fa-binoculars */
    font-family: "Font Awesome 5 Free";
    font-weight: 900;
    font-size: 24px;
    margin-bottom: 12px;
    color: var(--el-color-info-light-5);
}

.detail-attributes {
    margin-top: 8px;
    max-height: 200px;
    overflow-y: auto;
    background-color: var(--el-fill-color-light);
    border-radius: 6px;
    padding: 8px;
    scrollbar-width: thin;
    width: 100%;
}

.attribute-item {
    margin-bottom: 8px;
    font-size: 11px;
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--el-border-color-lighter);
}

.attribute-item:last-child {
    margin-bottom: 0;
    border-bottom: none;
    padding-bottom: 0;
}

.attribute-key {
    font-weight: 600;
    color: var(--el-color-info);
    margin-bottom: 3px;
    font-size: 10px;
}

.attribute-value {
    color: var(--el-text-color-primary);
    font-weight: 500;
    font-size: 11px;
}

/* Estilos para a timeline */
.timeline-track {
    overflow: hidden;
    transition: background-color 0.2s ease-in-out;
}

.timeline-track:hover {
    background-color: var(--el-color-info-light-5) !important;
}

.timeline-progress {
    height: 100%;
    background-color: var(--el-color-primary);
    border-radius: 3px;
    transition: width 0.2s ease-in-out;
}


/* Modern Playback Widget */
.modern-playback-widget {
    position: absolute;
    left: 50px;
    top: 25px;
    background: rgba(255, 255, 255, 0.98);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    min-width: 320px;
}

/* Timeline Section */
.timeline-section {
    padding: 20px 20px 10px 20px;
    position: relative;
}

.timeline-track {
    width: 280px;
    height: 8px;
    background: rgba(64, 158, 255, 0.1);
    border-radius: 4px;
    position: relative;
    cursor: pointer;
    margin: 0 auto;
}

.timeline-progress {
    height: 100%;
    background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
    border-radius: 4px;
    transition: width 0.3s ease;
}

.timeline-handle {
    width: 24px;
    height: 24px;
    background: var(--el-color-primary);
    border-radius: 50%;
    position: absolute;
    top: -8px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    border: 3px solid white;
    transition: all 0.2s ease;
    z-index: 10;
}

.timeline-handle:hover {
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
    border-color: rgba(255, 255, 255, 0.9);
}

.timeline-handle i {
    font-size: 8px;
    color: white;
}

/* Modern Controls */
.modern-playback-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 20px 20px 20px;
    gap: 12px;
}

.secondary-controls {
    display: flex;
    gap: 8px;
    align-items: center;
}

.primary-control {
    display: flex;
    align-items: center;
}

.control-btn {
    border: none;
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 14px;
    outline: none;
    position: relative;
    overflow: hidden;
}

.control-btn:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: scale(0);
    transition: transform 0.3s ease;
}

.control-btn:hover:before {
    transform: scale(1);
}

.secondary-btn {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #909399, #a6a9ad);
    box-shadow: 0 2px 8px rgba(144, 147, 153, 0.3);
}

.secondary-btn:hover {
    box-shadow: 0 4px 16px rgba(144, 147, 153, 0.4);
    transform: translateY(-1px);
}

.primary-btn {
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
    font-size: 18px;
}

.primary-btn:hover {
    box-shadow: 0 6px 24px rgba(64, 158, 255, 0.4);
    transform: translateY(-2px);
}

.speed-btn {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, var(--el-color-warning), var(--el-color-warning-light-3));
    box-shadow: 0 2px 8px rgba(230, 162, 60, 0.3);
    font-size: 10px;
    font-weight: 600;
}

.speed-btn:hover {
    box-shadow: 0 4px 16px rgba(230, 162, 60, 0.4);
    transform: translateY(-1px);
}

/* Estilos para los marcadores de eventos */
.event-marker {
    background: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    border: 2px solid white;
}

.event-marker i {
    font-size: 14px;
}

.event-marker.ignition-on {
    background-color: #f0f9eb;
    border-color: #67c23a;
}

.event-marker.ignition-off {
    background-color: #fef0f0;
    border-color: #f56c6c;
}

.event-marker.blocked {
    background-color: #fef0f0;
    border-color: #f56c6c;
}

.event-marker.unblocked {
    background-color: #f0f9eb;
    border-color: #67c23a;
}

.event-marker.driver-change {
    background-color: #ecf5ff;
    border-color: #409eff;
}

.event-marker.stop {
    background-color: #fdf6ec;
    border-color: #e6a23c;
}

.event-marker.moving {
    background-color: #f0f9eb;
    border-color: #67c23a;
}

.event-marker.speeding {
    background-color: #fef0f0;
    border-color: #f56c6c;
}

.event-marker.normal-speed {
    background-color: #f0f9eb;
    border-color: #67c23a;
}

.event-marker.route-start {
    background-color: #f0f9eb;
    border-color: #67c23a;
}

.event-marker.route-end {
    background-color: #ecf5ff;
    border-color: #409eff;
}


/* Estilos para o painel de controle inferior */
.player-control-panel {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 15px;
    max-width: 90vw;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(230, 230, 230, 0.8);
    width: 320px;
}

.route-info-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.route-info-row:last-child {
    margin-bottom: 0;
}

/* Estilos para a linha de ícones de status */
.status-icons {
    display: flex;
    justify-content: space-around;
    gap: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.status-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: var(--el-color-info-light-9);
    color: var(--el-color-info);
    font-size: 12px;
    transition: all 0.2s ease;
}

.status-icon.active {
    background-color: var(--el-color-success-light-9);
    color: var(--el-color-success);
}

.status-icon.warning {
    background-color: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
}

.status-icon.danger {
    background-color: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
}

/* Estilos para a linha de informações detalhadas */
.detail-info {
    display: flex;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    flex-wrap: wrap;
}

.info-group {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 80px;
}

.info-group.wide {
    flex: 100%;
    margin-top: 4px;
}

.info-label {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    border-radius: 4px;
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-size: 12px;
}

.info-value {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.info-value.address {
    white-space: normal;
    max-height: 32px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.2;
    font-size: 11px;
}

/* Estilos para a linha de botões */
.action-buttons {
    display: flex;
    gap: 6px;
    padding-top: 8px;
    justify-content: space-around;
}

.action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 5px 8px;
    border-radius: 4px;
    border: none;
    background-color: var(--el-color-info-light-9);
    color: var(--el-color-info-dark-2);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 0;
    flex: 1;
}

.action-button i {
    font-size: 12px;
}

.action-button:hover {
    background-color: var(--el-color-info-light-7);
}

.action-button.primary {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary-dark-2);
}

.action-button.primary:hover {
    background-color: var(--el-color-primary-light-7);
}

/* =========================================
   CONTADORES (top-left)
   ========================================= */
.status-counters {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    background: rgba(0, 0, 0, 0.55);
    padding: 6px;
    border-radius: 10px;
    margin-bottom: 6px;
}

.status-counters .counter {
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
    opacity: .9;
    transition: transform .15s ease, opacity .15s ease, box-shadow .15s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, .15);
    user-select: none;
}

.status-counters .counter:hover {
    opacity: 1;
    transform: translateY(-1px)
}

.status-counters .counter.active {
    outline: 2px solid rgba(255, 255, 255, .9);
    outline-offset: 1px;
}

.status-counters .counter.all {
    background: #909399
}

.status-counters .counter.online {
    background: #67c23a
}

.status-counters .counter.offline {
    background: #f56c6c
}

.status-counters .counter.unknown {
    background: #e6a23c
}

.status-counters .counter.motion {
    background: #409eff
}
</style>

<!-- ⚠️ CSS de popper/dropdown MOVIDO para src/assets/css/kore-map.poppers.css
     Usar: popper-class="kore-map-popper kore-map-popper--dark"
     NÃO adicionar estilos de popper aqui - são teleportados para <body> -->
<style>
/* Iconos de los BOTONES del mapa siempre blancos */
.vertical-controls-container .el-button i,
.vertical-controls-container .el-button .fas,
.vertical-controls-container .el-button .far,
.vertical-controls-container .el-button .fab {
    color: white !important;
}

.vertical-controls-container .el-button:hover i,
.vertical-controls-container .el-button:hover .fas,
.vertical-controls-container .el-button:hover .far,
.vertical-controls-container .el-button:hover .fab {
    color: white !important;
}

/* Estilos para el modal de información del punto de ruta */
:deep(.route-point-modal) {
    max-width: 400px;
}

:deep(.route-point-modal .el-message-box__title) {
    color: var(--el-color-primary);
    font-weight: bold;
}

:deep(.route-point-modal .el-message-box__content) {
    color: var(--el-text-color-regular);
    line-height: 1.6;
}

:deep(.route-point-modal .el-message-box__message) {
    font-size: 14px;
}

/* 🎯 ESTILOS APRIMORADOS PARA SEÇÃO DO MOTORISTA */
.driver-section-enhanced {
    background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.driver-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e2e8f0;
}

.driver-card-header i {
    color: #3b82f6;
    font-size: 18px;
    margin-right: 8px;
}

.section-title {
    font-weight: 600;
    color: #1e293b;
    font-size: 16px;
    display: flex;
    align-items: center;
}

.driver-status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
}

.driver-status-indicator.active {
    background: #dcfce7;
    color: #166534;
}

.driver-status-indicator.inactive {
    background: #fee2e2;
    color: #991b1b;
}

.driver-status-indicator.warning {
    background: #fef3c7;
    color: #92400e;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
}

.driver-card-content {
    display: flex;
    gap: 16px;
}

.driver-photo-enhanced {
    position: relative;
    flex-shrink: 0;
}

.driver-avatar {
    width: 80px;
    height: 80px;
    border-radius: 16px;
    object-fit: cover;
    border: 3px solid #e2e8f0;
    transition: all 0.3s ease;
}

.driver-avatar:hover {
    border-color: #3b82f6;
    transform: scale(1.05);
}

.photo-overlay {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 24px;
    height: 24px;
    background: #ef4444;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.driver-details {
    flex: 1;
    min-width: 0;
}

.driver-main-info {
    margin-bottom: 12px;
}

.driver-name-enhanced strong {
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
    display: block;
    line-height: 1.3;
}

.driver-id {
    display: block;
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
    margin-top: 2px;
}

.driver-credentials {
    margin-bottom: 12px;
}

.credential-item {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    font-size: 13px;
    line-height: 1.4;
}

.credential-item i {
    color: #64748b;
    width: 16px;
    text-align: center;
    font-size: 12px;
}

.credential-item .label {
    color: #64748b;
    font-weight: 500;
    min-width: 35px;
}

.credential-item .value {
    color: #1e293b;
    font-weight: 500;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
}

.credential-item .category {
    background: #e2e8f0;
    color: #64748b;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
}

.driver-expiry-section {
    margin-bottom: 12px;
}

.expiry-item {
    background: #f8fafc;
    border-radius: 8px;
    padding: 8px 12px;
    border-left: 4px solid #e2e8f0;
}

.expiry-item.valid {
    border-left-color: #10b981;
    background: #f0fdf4;
}

.expiry-item.warning {
    border-left-color: #f59e0b;
    background: #fffbeb;
}

.expiry-item.expired {
    border-left-color: #ef4444;
    background: #fef2f2;
}

.expiry-item i {
    color: #64748b;
    width: 16px;
    text-align: center;
    font-size: 12px;
    margin-right: 6px;
}

.expiry-item .label {
    color: #64748b;
    font-weight: 500;
    font-size: 12px;
    margin-right: 6px;
}

.expiry-date {
    color: #1e293b;
    font-weight: 600;
    font-size: 13px;
}

.expiry-warning {
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

.expiry-warning:not(.warning) {
    background: #fef2f2;
    color: #991b1b;
}

.expiry-warning.warning {
    background: #fef3c7;
    color: #92400e;
}

.expiry-warning i {
    margin-right: 4px;
}

.days-remaining {
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
    font-style: italic;
}

.driver-quick-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
}

.driver-quick-actions .el-button {
    font-size: 11px;
    padding: 6px 12px;
    border-radius: 6px;
    font-weight: 500;
}

.driver-quick-actions .el-button i {
    margin-right: 4px;
}

/* Responsivo para seção do motorista */
@media (max-width: 480px) {
    .driver-card-content {
        flex-direction: column;
        gap: 12px;
    }

    .driver-photo-enhanced {
        align-self: center;
    }

    .driver-quick-actions {
        flex-direction: column;
        gap: 6px;
    }

    .driver-quick-actions .el-button {
        width: 100%;
        justify-content: center;
    }
}
</style>
