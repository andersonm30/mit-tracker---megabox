<template>
  <el-card class="history-card">
    <el-form class="history-form">
      <!-- Linha 1: Seleção de dispositivo e datas -->
      <div class="form-row">
        <!-- Seleção de dispositivo -->
        <el-form-item class="device-selector">
          <el-select 
            v-model="formData.deviceId" 
            :value-key="'id'" 
            filterable 
            :placeholder="$t('device.device')" 
            size="default" 
            :no-data-text="$t('NO_DATA_TEXT')" 
            :no-match-text="$t('NO_MATCH_TEXT')"
          >
            <el-option
              v-for="item in Object.values(store.state.devices.deviceList)"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <!-- Botões compactos-->
        <div class="compact-buttons">
          <el-button-group size="small">
            <el-button 
              type="primary" 
              :disabled="!formData.deviceId || !formData.date[0] || !formData.date[1]" 
              @mouseleave="hideTip" 
              @mouseenter.stop="showTip($event, $t('device.routes'))" 
              @click="loadRoute()"
            >
              <i class="fas fa-route"></i>
            </el-button>
            
            <el-button 
              type="primary" 
              @mouseleave="hideTip" 
              @mouseenter.stop="showTip($event, $t('device.graphic'))" 
              :disabled="!formData.deviceId || !formData.date[0] || !formData.date[1]" 
              @click="loadGraph()"
            >
              <i class="fas fa-chart-bar"></i>
            </el-button>
            
            <el-button 
              type="info" 
              :disabled="!formData.deviceId || !formData.date[0] || !formData.date[1]" 
              @click="loadRoute(false, true)"
              @mouseleave="hideTip" 
              @mouseenter.stop="showTip($event, $t('export.excel') || 'Exportar Excel')"
            >
              <i class="fas fa-file-excel"></i>
            </el-button>
            
            <!-- Botón para exportar a KML (Google Earth) -->
            <el-button 
              type="info" 
              :loading="isLoadingKml"
              :disabled="!formData.deviceId || !formData.date[0] || !formData.date[1] || routePoints.length === 0" 
              @click="handleGenerateKML"
              @mouseleave="hideTip" 
              @mouseenter.stop="showTip($event, $t('export.kml') || 'Exportar KML (Google Earth)')"
            >
              <i class="fas fa-globe"></i>
            </el-button>
            
            <!-- Botón PDF Detallado -->
            <el-button 
              type="success" 
              :loading="isLoadingDetailed" 
              :disabled="!formData.deviceId || !formData.date[0] || !formData.date[1]" 
              @click="handleGenerateDetailedPDF"
              @mouseleave="hideTip" 
              @mouseenter.stop="showTip($event, 'PDF Detalhado (máx. 400 pontos)')"
              size="small"
            >
              <i class="fas fa-file-pdf"></i> Det
            </el-button>
            
            <!-- Botón PDF Tabular -->
            <el-button 
              type="warning" 
              :loading="isLoadingTabular" 
              :disabled="!formData.deviceId || !formData.date[0] || !formData.date[1]" 
              @click="handleGenerateTabularPDF"
              @mouseleave="hideTip" 
              @mouseenter.stop="showTip($event, 'PDF Tabular (todos os pontos)')"
              size="small"
            >
              <i class="fas fa-table"></i> Tab
            </el-button>
          </el-button-group>
        </div>
      </div>
      
      <!-- Linha 2: Datas e switch -->
      <div class="form-row dates-row">
        <!-- Datas compactas -->
        <div class="date-container">
          <el-input 
            v-model="formData.date[0]" 
            type="datetime-local"
            :placeholder="$t('startDate')"
            size="small"
          />
          
          <div class="date-separator">
            <i class="fas fa-arrow-right"></i>
          </div>
          
          <el-input 
            v-model="formData.date[1]" 
            type="datetime-local"
            :placeholder="$t('endDate')"
            size="small"
          />
        </div>
        
        <div class="marker-container">
          <el-tooltip :content="$t('report.showMarkers')" placement="top">
            <el-switch 
              v-model="showRouteMarkers" 
              class="marker-switch"
              size="small"
              @change="debugSwitchChange"
            >
              <template #default>
                <span class="switch-label">
                  <i class="fas fa-map-marker-alt"></i>
                </span>
              </template>
            </el-switch>
          </el-tooltip>
        </div>
      </div>
    </el-form>
  
    <!-- Conteúdo do histórico -->
    <el-card class="history-content" shadow="never">
      <!-- Estado de carregamento -->
      <template v-if="loading">
        <div class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <span>{{$t('LOADING')}}</span>
        </div>
      </template>
      
      <!-- Estado vazio -->
      <template v-else-if="routePoints.length===0">
        <div class="empty-state">
          <i class="fas fa-route"></i>
          <span>{{$t('route.empty')}}</span>
        </div>
      </template>
      
      <!-- Exibição da rota -->
      <template v-else>
        <div class="route-timeline" ref="routeTimelineRef">
          <!-- Ponto inicial -->
          <div class="timeline-point timeline-start" id="timeline-point-0">
            <div class="timeline-marker">
              <div class="timeline-line timeline-line-start"></div>
              <div class="timeline-icon">
                <i class="fas fa-flag"></i>
              </div>
              <div class="timeline-date">
                {{ new Date(routePoints[0].fixTime).toLocaleDateString() }}<br>
                {{ new Date(routePoints[0].fixTime).toLocaleTimeString() }}
              </div>
            </div>
            
            <div class="timeline-content">
              <div class="address">{{ routePoints[0].address }}</div>
              
              <div class="point-details">
                <div class="speed">
                  <i class="fas fa-tachometer-alt"></i>
                  {{$t('units.' + store.getters['server/getAttribute']('speedUnit', 'speedUnit'), { speed: routePoints[0].speed })}}
                </div>
                
                <div class="attributes">
                  <!-- Ignição -->
                  <div 
                    v-if="routePoints[0].attributes && routePoints[0].attributes.ignition !== undefined" 
                    class="attribute" 
                    :data-title="$t('device.ignition') + ': ' + (routePoints[0].attributes.ignition ? $t('yes') : $t('no'))"
                  >
                    <i :class="{
                      'fas fa-key': true,
                      'text-success': routePoints[0].attributes.ignition === true,
                      'text-danger': routePoints[0].attributes.ignition === false,
                      'text-muted': routePoints[0].attributes.ignition === undefined
                    }"></i>
                  </div>
                  
                  <!-- Bloqueio -->
                  <div 
                    v-if="routePoints[0].attributes && routePoints[0].attributes.blocked !== undefined" 
                    class="attribute"
                    :data-title="$t('device.blocked') + ': ' + (routePoints[0].attributes.blocked ? $t('yes') : $t('no'))"
                  >
                    <i :class="{
                      'fas fa-unlock': routePoints[0].attributes.blocked === false,
                      'fas fa-lock': routePoints[0].attributes.blocked === true,
                      'text-success': routePoints[0].attributes.blocked === false,
                      'text-danger': routePoints[0].attributes.blocked === true,
                      'text-muted': routePoints[0].attributes.blocked === undefined
                    }"></i>
                  </div>
                  
                  <!-- Movimento -->
                  <div 
                    v-if="routePoints[0].attributes && routePoints[0].attributes.motion !== undefined" 
                    class="attribute"
                    :data-title="$t('device.motion') + ': ' + (routePoints[0].attributes.motion ? $t('yes') : $t('no'))"
                  >
                    <i :class="{
                      'fas fa-car': routePoints[0].attributes.motion === true,
                      'fas fa-parking': routePoints[0].attributes.motion === false,
                      'text-success': routePoints[0].attributes.motion === true,
                      'text-danger': routePoints[0].attributes.motion === false,
                      'text-muted': routePoints[0].attributes.motion === undefined
                    }"></i>
                  </div>
                  
                  <!-- Energia -->
                  <div 
                    v-if="routePoints[0].attributes && routePoints[0].attributes.power !== undefined" 
                    class="attribute"
                    :data-title="$t('device.power')"
                  >
                    <i class="fas fa-car-battery" :class="{
                      'text-success': routePoints[0].attributes.power > 0,
                      'text-muted': routePoints[0].attributes.power <= 0
                    }"></i>
                    <span class="attribute-value">
                      {{ (parseFloat(routePoints[0].attributes.power)).toFixed(1) }} V
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Pontos intermediários -->
          <div v-for="(p, k) in routePoints" :key="`route-${routePoints.length}-point-${p.id}-${k}`"
               v-show="k > 0 && k < routePoints.length - 1" 
               :id="`timeline-point-${k}`"
               :class="['timeline-point', 'timeline-middle', { 'timeline-active': k === currentPlayingPoint }]">
              <div class="timeline-marker">
                <div :class="['timeline-line', { 'timeline-line-active': k === currentPlayingPoint }]"></div>
                <div :class="['timeline-dot', { 'timeline-dot-active': k === currentPlayingPoint }]"></div>
                <div :class="['timeline-date', { 'timeline-date-active': k === currentPlayingPoint }]">
                  {{ new Date(p.fixTime).toLocaleDateString() }}<br>
                  {{ new Date(p.fixTime).toLocaleTimeString() }}
                </div>
              </div>
              
              <div :class="['timeline-content', { 'timeline-content-active': k === currentPlayingPoint }]">
                <div class="address">
                  <a target="_blank" class="location-link" :href="'https://maps.google.com/?q=' + p.latitude + ',' + p.longitude">
                    {{ p.address || p.latitude + ',' + p.longitude }} 
                    <i class="fas fa-external-link-alt"></i>
                  </a>
                </div>
                
                <div class="point-details">
                  <div class="speed">
                    <i class="fas fa-tachometer-alt"></i>
                    {{$t('units.' + store.getters['server/getAttribute']('speedUnit', 'speedUnit'), { speed: p.speed })}}
                  </div>
                  
                  <!-- Conductor si está disponible -->
                  <div v-if="p.attributes && (p.attributes.driverUniqueId || (p.attributes.rfid && p.attributes.rfidStatus === 'VALID'))" class="driver-info">
                    <i class="fas fa-user-circle"></i>
                    <span>{{ getDriverName(p.attributes.driverUniqueId, p.attributes) }}</span>
                  </div>
                  
                  <div class="attributes">
                    <!-- Ignição -->
                    <div v-if="p.attributes && p.attributes.ignition !== undefined" class="attribute">
                      <i :class="{
                        'fas fa-key': true,
                        'text-success': p.attributes.ignition === true,
                        'text-danger': p.attributes.ignition === false,
                        'text-muted': p.attributes.ignition === undefined
                      }"></i>
                    </div>
                    
                    <!-- Bloqueio -->
                    <div v-if="p.attributes && p.attributes.blocked !== undefined" class="attribute">
                      <i :class="{
                        'fas fa-unlock': p.attributes.blocked === false,
                        'fas fa-lock': p.attributes.blocked === true,
                        'text-success': p.attributes.blocked === false,
                        'text-danger': p.attributes.blocked === true,
                        'text-muted': p.attributes.blocked === undefined
                      }"></i>
                    </div>
                    
                    <!-- Movimento -->
                    <div v-if="p.attributes && p.attributes.motion !== undefined" class="attribute">
                      <i :class="{
                        'fas fa-car': p.attributes.motion === true,
                        'fas fa-parking': p.attributes.motion === false,
                        'text-success': p.attributes.motion === true,
                        'text-danger': p.attributes.motion === false,
                        'text-muted': p.attributes.motion === undefined
                      }"></i>
                    </div>
                    
                    <!-- Energia -->
                    <div v-if="p.attributes && p.attributes.power !== undefined" class="attribute">
                      <i class="fas fa-car-battery" :class="{
                        'text-success': p.attributes.power > 0,
                        'text-muted': p.attributes.power <= 0
                      }"></i>
                      <span class="attribute-value">
                        {{ (parseFloat(p.attributes.power)).toFixed(1) }} V
                      </span>
                    </div>


                    
                    
                  </div>

                  <!-- Video/Alarma -->
                  <div v-if="p.attributes && p.attributes.alarm_file !== undefined" class="alarm-section">
                    <!-- Título da Alarma -->
                    <div class="alarm-header">
                      <i class="fas fa-exclamation-triangle text-warning"></i>
                      <span class="alarm-title">{{ $t('device.alarm') || 'Alarma' }}: </span>
                      <span class="alarm-text">{{ truncateText(p.attributes.alarm, 30) }}</span>
                    </div>
                    
                    <!-- Lista de Videos -->
                    <div v-if="getVideoFiles(p.attributes.alarm_file).length > 0" class="video-thumbnails">
                      <div 
                        v-for="(videoFile, index) in getVideoFiles(p.attributes.alarm_file)" 
                        :key="index"
                        class="video-thumbnail"
                        @click="playVideo(videoFile)"
                      >
                        <img 
                          :src="getThumbnailUrl(videoFile)" 
                          :alt="`Video ${index + 1}`"
                          class="thumbnail-image"
                          @error="$event.target.src = '/img/cars/default_base.png'"
                        />
                        <div class="play-overlay">
                          <i class="fas fa-play"></i>
                        </div>
                        <div class="video-info">
                          <span class="video-label">Video {{ index + 1 }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          
          <!-- Ponto final -->
          <div class="timeline-point timeline-end" :id="`timeline-point-${routePoints.length-1}`">
            <div class="timeline-marker">
              <div class="timeline-line timeline-line-end"></div>
              <div class="timeline-icon">
                <i class="fas fa-flag-checkered"></i>
              </div>
              <div class="timeline-date">
                {{ new Date(routePoints[routePoints.length-1].fixTime).toLocaleDateString() }}<br>
                {{ new Date(routePoints[routePoints.length-1].fixTime).toLocaleTimeString() }}
              </div>
            </div>
            
            <div class="timeline-content">
              <div class="address">{{ routePoints[routePoints.length-1].address }}</div>
              
              <div class="point-details">
                <div class="speed">
                  <i class="fas fa-tachometer-alt"></i>
                  {{$t('units.' + store.getters['server/getAttribute']('speedUnit', 'speedUnit'), { speed: routePoints[routePoints.length-1].speed })}}
                </div>
                
                <div class="attributes">
                  <!-- Ignição -->
                  <div v-if="routePoints[routePoints.length-1].attributes && routePoints[routePoints.length-1].attributes.ignition !== undefined" class="attribute">
                    <i :class="{
                      'fas fa-key': true,
                      'text-success': routePoints[routePoints.length-1].attributes.ignition === true,
                      'text-danger': routePoints[routePoints.length-1].attributes.ignition === false,
                      'text-muted': routePoints[routePoints.length-1].attributes.ignition === undefined
                    }"></i>
                  </div>
                  
                  <!-- Bloqueio -->
                  <div v-if="routePoints[routePoints.length-1].attributes && routePoints[routePoints.length-1].attributes.blocked !== undefined" class="attribute">
                    <i :class="{
                      'fas fa-unlock': routePoints[routePoints.length-1].attributes.blocked === false,
                      'fas fa-lock': routePoints[routePoints.length-1].attributes.blocked === true,
                      'text-success': routePoints[routePoints.length-1].attributes.blocked === false,
                      'text-danger': routePoints[routePoints.length-1].attributes.blocked === true,
                      'text-muted': routePoints[routePoints.length-1].attributes.blocked === undefined
                    }"></i>
                  </div>
                  
                  <!-- Movimento -->
                  <div v-if="routePoints[routePoints.length-1].attributes && routePoints[routePoints.length-1].attributes.motion !== undefined" class="attribute">
                    <i :class="{
                      'fas fa-car': routePoints[routePoints.length-1].attributes.motion === true,
                      'fas fa-parking': routePoints[routePoints.length-1].attributes.motion === false,
                      'text-success': routePoints[routePoints.length-1].attributes.motion === true,
                      'text-danger': routePoints[routePoints.length-1].attributes.motion === false,
                      'text-muted': routePoints[routePoints.length-1].attributes.motion === undefined
                    }"></i>
                  </div>
                  
                  <!-- Energia -->
                  <div v-if="routePoints[routePoints.length-1].attributes && routePoints[routePoints.length-1].attributes.power !== undefined" class="attribute">
                    <i class="fas fa-car-battery" :class="{
                      'text-success': routePoints[routePoints.length-1].attributes.power > 0,
                      'text-muted': routePoints[routePoints.length-1].attributes.power <= 0
                    }"></i>
                    <span class="attribute-value">
                      {{ (parseFloat(routePoints[routePoints.length-1].attributes.power)).toFixed(1) }} V
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </el-card>
  </el-card>
  
  <!-- Modal para reprodução de video -->
  <el-dialog 
    v-model="showVideoModal" 
    width="75%"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    custom-class="video-modal"
    top="3vh"
    @close="closeVideoModal"
  >
    <!-- Header customizado -->
    <template #header>
      <div class="modern-video-header">
        <div class="header-left">
          <div class="video-icon-wrapper">
            <i class="fas fa-play-circle"></i>
          </div>
          <div class="header-text">
            <h3>Reprodução de Vídeo</h3>
            <span class="header-subtitle">Visualizador de eventos</span>
          </div>
        </div>
        <button class="close-button" @click="closeVideoModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </template>
    
    <!-- Conteúdo do vídeo -->
    <div class="modern-video-content">
      <div v-if="currentVideo" class="video-wrapper" :class="{ loading: videoLoading }">
        <div class="video-frame">
          <video
            id="videoPlayer"
            :src="currentVideo"
            class="video-js vjs-default-skin modern-video-player"
            controls
            preload="auto"
            width="100%"
            height="100%"
            data-setup='{"responsive": true, "fluid": true}'
          >
            <p class="vjs-no-js">
              Para visualizar este vídeo, ative o JavaScript e considere atualizar para um
              <a href="https://videojs.com/html5-video-support/" target="_blank">
                navegador que suporte HTML5 video
              </a>.
            </p>
          </video>
        </div>
      </div>
    </div>
    
    <!-- Footer modernizado -->
    <template #footer>
      <div class="modern-video-footer">
        <div class="footer-info">
          <i class="fas fa-info-circle"></i>
          <span>Use os controles do player para navegar pelo vídeo</span>
        </div>
        <div class="footer-actions">
          <button class="modern-btn secondary" @click="closeVideoModal">
            <i class="fas fa-arrow-left"></i>
            <span>Voltar</span>
          </button>
          <button class="modern-btn primary" @click="closeVideoModal">
            <i class="fas fa-check"></i>
            <span>Concluir</span>
          </button>
        </div>
      </div>
    </template>
  </el-dialog>
  
  <!-- Componente oculto para generar informes PDF tabulares -->
  <pdf-route-report ref="pdfRouteReportRef" />
</template>

<script>
import { defineComponent, ref, inject, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { saveAs } from "file-saver";
import PdfRouteReport from './pdf-route-report.vue';
import html2pdf from "html2pdf.js";
import dayjs from 'dayjs';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faLock, faLockOpen, faCircleNotch } from '@fortawesome/free-solid-svg-icons';

// Import Element Plus components
import { 
  ElCard, 
  ElButton, 
  ElButtonGroup,
  ElForm, 
  ElFormItem, 
  ElSelect, 
  ElOption, 
  ElSwitch, 
  ElInput,
  ElTooltip,
  ElMessage,
  ElDialog 
} from 'element-plus';

// Add icons to the library
library.add(faLock, faLockOpen, faCircleNotch);

export default defineComponent({
  name: 'HistoryView',
  components: {
    ElCard,
    ElButton,
    ElButtonGroup,
    ElForm,
    ElFormItem,
    ElSelect,
    ElOption,
    ElSwitch,
    ElInput,
    ElTooltip,
    ElDialog,
    PdfRouteReport
  },
  setup() {
    // Injections
    const showGraphicsRef = inject("show-graphics");
    const updateRoute = inject('updateRoute');
    
    // Variable local para controlar marcadores de ruta
    const showRouteMarkers = ref(false);
    
    console.log('🔍 HISTORY.VUE - Usando showRouteMarkers local:', showRouteMarkers);
    
    // Store and route
    const store = useStore();
    const route = useRoute();
    
    // References
    const routeTimelineRef = ref(null);
    const pdfRouteReportRef = ref(null);
    
    // State
    const loading = ref(false);
    const isLoading = ref(false);
    const isLoadingDetailed = ref(false);
    const isLoadingTabular = ref(false);
    const isLoadingKml = ref(false);
    
    // Form data
    const date1 = new Date();
    const date2 = new Date();
    date1.setHours(0);
    date1.setMinutes(0);
    const formData = ref({ deviceId: '', date: [date1.toISOString().slice(0, 16), date2.toISOString().slice(0, 16)] });
    const routePoints = ref([]);
    const routePoints__ = ref([]);
    
    // Computed
    const currentPlayingPoint = computed(() => {
      return store.state.devices.routePlayPoint;
    });
    
    // Functions
    const showTip = (evt, text) => {
      window.$showTip(evt, text);
    };
    
    const hideTip = (evt) => {
      window.$hideTip(evt);
    };
    
    const getDriverName = (driverUniqueIdParam, pointAttrs = null) => {
      // REGRA PADRONIZADA: usar driverUniqueId ou rfid (se VALID)
      let effectiveDriverId = driverUniqueIdParam;
      
      // Se attrs foram passados, aplicar a regra completa
      if (pointAttrs && !effectiveDriverId) {
        const rfid = pointAttrs.rfid || null;
        const rfidStatus = pointAttrs.rfidStatus || null;
        if (rfid && rfidStatus === 'VALID') {
          effectiveDriverId = rfid;
        }
      }
      
      if (!effectiveDriverId) return '';
      
      const driver = store.getters['drivers/getDriverByUniqueId'](effectiveDriverId);
      if (driver) {
        return driver.name || driver.uniqueId;
      }
      return effectiveDriverId;
    };

    // Función para truncar texto largo con elipsis
    const truncateText = (text, maxLength = 20) => {
      if (!text && text !== 0) return '';
      // Convertir a string si no lo es
      const textString = String(text);
      if (textString.length <= maxLength) return textString;
      return textString.substring(0, maxLength) + '...';
    };

    // Función para procesar archivos de video de una alarma
    const getVideoFiles = (alarmFile) => {
      if (!alarmFile) return [];
      return alarmFile.split(',').map(filename => filename.trim()).filter(f => f);
    };

    // Función para generar URL de thumbnail con cache
    const getThumbnailUrl = (videoFile) => {
      const cacheKey = `${formData.value.deviceId}_${videoFile}`;
      
      if (thumbnailUrlCache.value.has(cacheKey)) {
        return thumbnailUrlCache.value.get(cacheKey);
      }
      
      // Usar URL temporal mientras se resuelve la URL correcta
      const tempUrl = `/uploads/events/${videoFile}.jpg`;
      
      // Resolver URL correcta en background
      resolveThumbnailUrl(videoFile, cacheKey);
      
      return tempUrl;
    };

    // Función para resolver URL de thumbnail en background
    const resolveThumbnailUrl = async (videoFile, cacheKey) => {
      try {
        const deviceId = formData.value.deviceId;
        const deviceInfo = await fetchDeviceById(deviceId);
        const imei = deviceInfo?.uniqueId || deviceId;
        const correctUrl = `/uploads/events/${imei}/thumbs/${videoFile}.jpg`;
        
        thumbnailUrlCache.value.set(cacheKey, correctUrl);
      } catch (error) {
        console.error('Error obteniendo IMEI del dispositivo:', error);
        // Mantener URL de fallback en cache
        thumbnailUrlCache.value.set(cacheKey, `/uploads/events/${videoFile}.jpg`);
      }
    };

    // Función para generar URL de video para reproducción
    const getVideoUrl = async (videoFile) => {
      try {
        const deviceId = formData.value.deviceId;
        const deviceInfo = await fetchDeviceById(deviceId);
        const imei = deviceInfo?.uniqueId || deviceId;
        return `/uploads/events/${imei}/webm/${videoFile}.webm`;
      } catch (error) {
        console.error('Error obteniendo IMEI del dispositivo:', error);
        // Fallback a la estructura antigua si hay error
        return `/uploads/webm/${videoFile}.webm`;
      }
    };

    // Estado para controlar reproductor de video
    const currentVideo = ref(null);
    const showVideoModal = ref(false);
    const videoLoading = ref(false);
    
    // Cache para URLs resueltas
    const thumbnailUrlCache = ref(new Map());
    const videoUrlCache = ref(new Map());

    // Función para reproducir video
    const playVideo = async (videoFile) => {
      videoLoading.value = true;
      showVideoModal.value = true;
      
      try {
        // Obtener URL correcta del video
        const videoUrl = await getVideoUrl(videoFile);
        currentVideo.value = videoUrl;
        
        // Inicializar VideoJS en el próximo tick
        nextTick(() => {
          initVideoPlayer();
          setTimeout(() => {
            videoLoading.value = false;
          }, 1000);
        });
      } catch (error) {
        console.error('Error cargando video:', error);
        videoLoading.value = false;
        ElMessage.error('Error al cargar el video');
      }
    };

    // Función para cerrar modal de video
    const closeVideoModal = () => {
      showVideoModal.value = false;
      currentVideo.value = null;
      // Destruir player si existe
      if (window.videoPlayer && typeof window.videoPlayer.dispose === 'function') {
        try {
          window.videoPlayer.dispose();
        } catch (error) {
          console.warn('Error al destruir videoPlayer:', error);
        }
        window.videoPlayer = null;
      }
    };

    // Función para inicializar VideoJS
    const initVideoPlayer = () => {
      if (typeof videojs !== 'undefined' && currentVideo.value) {
        // Destruir player existente si existe
        if (window.videoPlayer && typeof window.videoPlayer.dispose === 'function') {
          try {
            window.videoPlayer.dispose();
          } catch (error) {
            console.warn('Error al destruir videoPlayer existente:', error);
          }
        }
        
        // eslint-disable-next-line no-undef
        const player = videojs('videoPlayer', {
          controls: true,
          preload: 'auto',
          fluid: true,
          responsive: true
        });
        window.videoPlayer = player;
      }
    };
    
    const debugSwitchChange = () => {
      console.log('🔄 Switch cambiado a:', showRouteMarkers.value);
    };
    
    // Enviar el estado a kore-map cuando cambie
    watch(showRouteMarkers, (newValue) => {
      console.log('🔄 Notificando a kore-map:', newValue);
      
      // Comunicar via store global
      store.commit('devices/setShowRouteMarkers', newValue);
      
      // También emitir evento personalizado como fallback
      window.dispatchEvent(new CustomEvent('showRouteMarkersChanged', { detail: newValue }));
    });
    
    const loadGraph = () => {
      if (routePoints.value.length === 0) {
        loadRoute(true);
      } else {
        showGraphicsRef.value.showGraphic(routePoints.value);
      }
    };

    const loadRoute = async (g = false, e = false) => {
  loading.value = true;
  
  // Limpiar cache de URLs cuando cambie el dispositivo
  thumbnailUrlCache.value.clear();
  videoUrlCache.value.clear();
  
  try {
    // Verificar si estamos usando los parámetros directamente desde la URL
    let startDate, endDate;
    
    if (route.query.from && route.query.to) {
      console.log('Usando fechas desde params de URL para consulta');
      // En la URL ya están en formato YYYY-MM-DDThh:mm:ss
      startDate = route.query.from;
      endDate = route.query.to;
    } else if (formData.value.date[0] && formData.value.date[1]) {
      console.log('Usando fechas de formulario para consulta:', formData.value.date);
      // De los inputs necesitamos completarlos a formato YYYY-MM-DDThh:mm:ss
      startDate = formData.value.date[0] + ':00';
      endDate = formData.value.date[1] + ':00';
    } else {
      // Fallback para asegurar que siempre hay fechas
      console.log('Usando fechas predeterminadas');
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const formatDate = (date) => {
        const pad = (num) => num.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      };
      
      startDate = formatDate(yesterday);
      endDate = formatDate(now);
    }
    
    const params = {
      deviceId: formData.value.deviceId,
      startDate: startDate,
      endDate: endDate,
      isExport: e
    };
    
    console.log('Parámetros de consulta:', params);
    
    const result = await store.dispatch('routes/loadRoute', params);

    
    if (e) {
      // Lógica para exportar a Excel o PDF
      if (result['headers']['content-type'] === 'application/pdf') {
        saveAs(new Blob([result.data], { type: 'application/pdf' }), 'resume.pdf');
      } else {
        saveAs(new Blob([result.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'resume.xlsx');
      }
    } else {
      // Verificar que result y result.data existan antes de usarlos
      if (result && result.data) {
        // DEBUG: Estado antes da limpeza
        console.log('🔍 ANTES limpeza - routePoints:', routePoints.value.length);
        
        // Forçar Vue a destruir elementos antes de criar novos
        routePoints.value = [];
        
        console.log('🧹 APÓS limpeza - routePoints:', routePoints.value.length);
        
        // Aguardar que Vue destrua os elementos DOM antigos - setTimeout garante que DOM seja limpo
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log('⏱️ APÓS setTimeout - DOM completamente limpo');
        
        // Só então estabelecer novos dados
        routePoints.value = result.data;
        routePoints__.value = [];
        console.log('📥 NOVOS dados - routePoints:', routePoints.value.length, 'primeiros IDs:', routePoints.value.slice(0,3).map(p => p.id));
        
        // Actualizar mapa y filtrar dispositivos
        if (result.points) {
          updateRoute(result.points);
        }

        hideDevices(formData.value.deviceId);
        
        // Si hay un punto de reproducción activo, asegurarse de que sea visible
        if (currentPlayingPoint.value > 0 && currentPlayingPoint.value < result.data.length) {
          //await nextTick();
          //scrollToActivePoint(currentPlayingPoint.value);
        }
        // Carregar o gráfico se necessário
        if (g && result.data.length > 0) {
          loadGraph();
        }
        
        // Actualizar URL con los parámetros correctos si vienen de un segmento
        if (route.query.from && route.query.to) {
          console.log('Datos cargados con éxito usando fechas:', startDate, '-', endDate);
        }
      } else {
        console.warn('No se recibieron datos válidos del servidor');
        routePoints.value = [];
      }
    }
  } catch (error) {
    console.error("Erro ao carregar rota:", error);
    ElMessage.error('Erro ao carregar rota');
  } finally {
    loading.value = false;
  }
};
    
    const hideDevices = (deviceId = 0) => {
      store.dispatch("devices/setDeviceFilter", deviceId);
    };
    
    const scrollToActivePoint = (index) => {
      if (routeTimelineRef.value) {
        const container = routeTimelineRef.value;
        const element = document.getElementById(`timeline-point-${index}`);
        
        if (!element) {
          console.warn(`⚠️ Elemento timeline-point-${index} não encontrado`);
          return;
        }
        
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        const scrollTop = element.offsetTop - (containerRect.height / 2) + (elementRect.height / 2);
        
        container.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    };
    
    const fetchDeviceById = async (deviceId) => {
      try {
        // Since deviceList is an object (not an array), access it directly using the ID
        const deviceFromStore = store.state.devices.deviceList[deviceId];
        if (deviceFromStore) {
          return deviceFromStore;
        }
        
        const response = await fetch(`/api/devices/${deviceId}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error al obtener el dispositivo:", error);
        return null;
      }
    };
    
    // Function to calculate operation and stop hours
    function calculateOperationAndStopHours(routePoints) {
      if (!routePoints || routePoints.length < 2) {
        return { totalOperationHours: 0, totalStopHours: 0 };
      }

      let totalOperationHours = 0;
      let totalStopHours = 0;
      
      for (let i = 1; i < routePoints.length; i++) {
        const currentPoint = routePoints[i];
        const prevPoint = routePoints[i-1];
        
        const diffInHours = dayjs(currentPoint.deviceTime).diff(dayjs(prevPoint.deviceTime), 'millisecond') / 3600000;
        
        if (prevPoint.attributes && 
            currentPoint.attributes && 
            prevPoint.attributes.ignition !== undefined) {
          if (prevPoint.attributes.ignition === true) {
            totalOperationHours += diffInHours;
          } else if (prevPoint.attributes.ignition === false) {
            totalStopHours += diffInHours;
          } else if (prevPoint.attributes.motion !== undefined && 
                    prevPoint.attributes.motion === false) {
            totalStopHours += diffInHours;
          } else {
            totalOperationHours += diffInHours;
          }
        } else {
          const speed = prevPoint.speed || 0;
          if (speed < 0.5) {
            totalStopHours += diffInHours;
          } else {
            totalOperationHours += diffInHours;
          }
        }
      }
      
      return {
        totalOperationHours: parseFloat(totalOperationHours.toFixed(1)),
        totalStopHours: parseFloat(totalStopHours.toFixed(1))
      };
    }
    
    // KML Export - Fixed to use string concatenation for proper XML handling
    const escapeXml = (unsafe) => {
      if (!unsafe) return '';
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };
    
    const handleGenerateKML = async () => {
      isLoadingKml.value = true;
      
      try {
        if (routePoints.value.length === 0) {
          ElMessage.error('No hay puntos de ruta para exportar');
          return;
        }
        
        const deviceId = formData.value.deviceId;
        const deviceInfo = await fetchDeviceById(deviceId);
        const deviceName = deviceInfo?.name || `Dispositivo ${deviceId}`;
        
        // Using string concatenation for KML creation to avoid XML parsing issues
        let kml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        kml += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
        kml += '  <Document>\n';
        kml += '    <name>' + escapeXml(deviceName) + ' - Ruta</name>\n';
        kml += '    <Placemark>\n';
        kml += '      <name>Trayecto</name>\n';
        kml += '      <LineString>\n';
        kml += '        <coordinates>\n';
        
        // Add coordinates
        for (let i = 0; i < routePoints.value.length; i++) {
          const point = routePoints.value[i];
          kml += '          ' + point.longitude + ',' + point.latitude + ',0\n';
        }
        
        kml += '        </coordinates>\n';
        kml += '      </LineString>\n';
        kml += '    </Placemark>\n';
        kml += '  </Document>\n';
        kml += '</kml>';
        
        // Create and download the file
        const filename = `${deviceName}_Ruta_${dayjs().format('YYYYMMDD_HHmmss')}.kml`;
        const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
        saveAs(blob, filename);
        
        ElMessage({
          message: 'Archivo KML generado con éxito',
          type: 'success',
          duration: 3000
        });
      } catch (error) {
        console.error('Error al generar KML:', error);
        ElMessage.error('Error al generar el archivo KML');
      } finally {
        isLoadingKml.value = false;
      }
    };
    
    // PDF Generation
    const handleGenerateDetailedPDF = async () => {
      isLoadingDetailed.value = true;
      
      try {
        if (routePoints.value.length === 0) {
          ElMessage.error('Não há dados de rota disponíveis');
          return;
        }

        // Buscar informações do dispositivo
        const deviceId = formData.value.deviceId;
        const deviceInfo = await fetchDeviceById(deviceId);
        
        // Usar sempre o informe detalhado (se limitará internamente se > 400 pontos)
        await pdfRouteReportRef.value.generateDetailedReport(routePoints.value, deviceInfo);
        
      } catch (error) {
        console.error("Erro ao gerar PDF detalhado:", error);
        ElMessage.error("Não foi possível gerar o PDF detalhado. Verifique o console para detalhes.");
      } finally {
        isLoadingDetailed.value = false;
      }
    };

    const handleGeneratePDF = async () => {
      isLoading.value = true;
      try {
        if (routePoints.value.length === 0) {
          await loadRoute();
        }
        
        ElMessage({
          message: 'Generando PDF, por favor espere...',
          type: 'info',
          duration: 3000
        });
        
        await generatePDF();
      } catch (error) {
        console.error("Error al generar PDF:", error);
        ElMessage.error('Error al generar el informe PDF');
      } finally {
        isLoading.value = false;
      }
    };
    
    // Función mejorada para generar PDF con mejor diseño
    const generatePDF = async () => {
      try {
        if (routePoints.value.length === 0) {
          ElMessage.error('Não há dados de rota disponíveis');
          return;
        }

        // Buscar informações do dispositivo
        const deviceId = formData.value.deviceId;
        const deviceInfo = await fetchDeviceById(deviceId);
        
        // Formatar datas para exibição
        const startPoint = routePoints.value[0];
        const endPoint = routePoints.value[routePoints.value.length - 1];
        const startDate = dayjs(startPoint.deviceTime).format('DD/MM/YYYY HH:mm');
        const endDate = dayjs(endPoint.deviceTime).format('DD/MM/YYYY HH:mm');
        
        // Obter información del conductor asignado si existe
        let driverInfo = null;
        if (startPoint.attributes && startPoint.attributes.driverUniqueId) {
          driverInfo = store.getters['drivers/getDriverByUniqueId'](startPoint.attributes.driverUniqueId);
        }
        
        // Calcular horas de funcionamiento y parada
        const { totalOperationHours, totalStopHours } = calculateOperationAndStopHours(routePoints.value);
        
        // Cálculo de métricas
        const totalDistance = routePoints.value.reduce(
          (sum, point) => sum + (point.attributes?.distance || 0), 0
        ) / 1000; // em km
        
        const speeds = routePoints.value.map(p => p.speed * 1.852);
        const maxSpeed = Math.max(...speeds, 0);
        const avgSpeed = speeds.length > 0 ? 
          speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
        
        // Función para generar filas de la tabla
        const getTableRows = (points) => {
          // Mostrar solo los primeros 50 puntos si hay muchos
          const displayPoints = points.length > 50 ? 
            [...points.slice(0, 25), ...points.slice(points.length - 25)] : 
            points;
            
          return displayPoints.map((p, index) => {
            // Verificar si es punto de inicio o fin para destacarlo
            const isStartOrEnd = index === 0 || index === displayPoints.length - 1;
            const rowStyle = isStartOrEnd ? 
              'background-color: #f0f7ff; font-weight: 600;' : 
              index % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f9f9f9;';
              
            // Formatear fecha y hora
            const datetime = dayjs(p.deviceTime).format('DD/MM/YYYY HH:mm:ss');
            
            // Formatear velocidad
            const speed = `${Math.round(p.speed * 1.852)} km/h`;
            
            // Formatear ubicación
            const address = p.address || `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`;
            const shortAddress = address.length > 80 ? address.substring(0, 77) + '...' : address;
            
            // Obtener nombre del conductor
            let pointDriverName = "";
            if (p.attributes && p.attributes.driverUniqueId) {
              const driver = store.getters['drivers/getDriverByUniqueId'](p.attributes.driverUniqueId);
              pointDriverName = driver ? 
                (driver.name || driver.uniqueId || p.attributes.driverUniqueId) : 
                p.attributes.driverUniqueId;
            }
            
            // Generar iconos de atributos
            const ignitionIcon = p.attributes && p.attributes.ignition !== undefined ?
              (p.attributes.ignition ? 
                '<i class="fas fa-key" style="color: #2ecc71; margin-right: 3px;"></i>' : 
                '<i class="fas fa-key" style="color: #e74c3c; margin-right: 3px;"></i>') : 
              '';
              
            const blockedIcon = p.attributes && p.attributes.blocked !== undefined ?
              (p.attributes.blocked ? 
                '<i class="fas fa-lock" style="color: #e74c3c; margin-right: 3px;"></i>' : 
                '<i class="fas fa-unlock" style="color: #2ecc71; margin-right: 3px;"></i>') : 
              '';
              
            const motionIcon = p.attributes && p.attributes.motion !== undefined ?
              (p.attributes.motion ? 
                '<i class="fas fa-car" style="color: #2ecc71; margin-right: 3px;"></i>' : 
                '<i class="fas fa-parking" style="color: #e74c3c; margin-right: 3px;"></i>') : 
              '';
             
            // Crear la fila de la tabla
            return `
              <tr style="${rowStyle}">
                <td style="padding: 4px 5px; border-bottom: 1px solid #eee; text-align: left;">
                  ${datetime}
                </td>
                <td style="padding: 4px 5px; border-bottom: 1px solid #eee; text-align: left;">
                  ${speed}
                </td>
                <td style="padding: 4px 5px; border-bottom: 1px solid #eee; text-align: left;">
                  ${pointDriverName || '-'}
                </td>
                <td style="padding: 4px 5px; border-bottom: 1px solid #eee; text-align: left;">
                  ${ignitionIcon} ${blockedIcon} ${motionIcon}
                  ${p.attributes && p.attributes.power !== undefined ? 
                    `<span style="margin-right: 5px; font-size: 8px;"><i class="fas fa-battery-three-quarters" style="color: #3498db; margin-right: 2px;"></i>${parseFloat(p.attributes.power).toFixed(1)}V</span>` : ''}
                </td>
                <td style="padding: 4px 5px; border-bottom: 1px solid #eee; text-align: left;">
                  ${shortAddress}
                </td>
              </tr>
            `;
          }).join('');
        };
        
        // Criar HTML do relatório diretamente - versão moderna com ícones
        const htmlContent = `
        <div class="pdf-container" style="font-family: 'Helvetica', 'Arial', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: white; color: #333;">
          <!-- Cabeçalho com gradiente -->
          <div class="pdf-header" style="display: flex; align-items: center; padding: 15px; border-radius: 8px; margin-bottom: 20px; background: linear-gradient(135deg, #00539c, #0077cc); box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
            <div class="logo" style="width: 80px; padding-right: 15px;">
              <img src="/img/logoWhite.png" alt="Logo" style="max-width: 100%;" />
            </div>
            <div class="header-title" style="flex: 1; border-left: 2px solid rgba(255,255,255,0.3); padding-left: 15px;">
              <h1 style="font-size: 20px; margin: 0; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">Relatório de Histórico de Rota</h1>
              <p style="margin: 5px 0 0; font-size: 12px; color: rgba(255,255,255,0.8);">
                <i class="fas fa-calendar-alt" style="margin-right: 5px;"></i> Gerado em: ${dayjs().format('DD/MM/YYYY HH:mm')}
              </p>
            </div>
          </div>
          
          <!-- Informações do dispositivo com card estilizado -->
          <div class="device-info" style="margin-top: 12px; background-color: white; border-radius: 6px; padding: 10px; box-shadow: 0 2px 3px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
            <h2 style="font-size: 14px; margin: 0 0 10px 0; color: #00539c; display: flex; align-items: center; padding-left: 2px;">
              <i class="fas fa-car" style="margin-right: 6px; color: #00539c; font-size: 12px;"></i> Informações do Dispositivo
            </h2>
            
            <div class="info-section" style="display: flex; flex-wrap: wrap; justify-content: space-between; margin-left: 2px;">
              <div class="info-col" style="width: 49%;">
                <p style="margin: 5px 0; font-size: 10px; display: flex; align-items: center;">
                  <i class="fas fa-tag" style="width: 12px; margin-right: 5px; color: #00539c; font-size: 9px;"></i>
                  <span><strong>Nome:</strong> ${deviceInfo?.name || `Dispositivo ${deviceId}`}</span>
                </p>
                <p style="margin: 5px 0; font-size: 10px; display: flex; align-items: center;">
                  <i class="fas fa-fingerprint" style="width: 12px; margin-right: 5px; color: #00539c; font-size: 9px;"></i>
                  <span><strong>ID:</strong> ${deviceId}</span>
                </p>
                <p style="margin: 5px 0; font-size: 10px; display: flex; align-items: center;">
                  <i class="fas fa-id-card" style="width: 12px; margin-right: 5px; color: #00539c; font-size: 9px;"></i>
                  <span><strong>Placa:</strong> ${deviceInfo?.attributes?.placa || 'N/A'}</span>
                </p>
                ${driverInfo ? `
                <p style="margin: 5px 0; font-size: 10px; display: flex; align-items: center;">
                  <i class="fas fa-user-circle" style="width: 12px; margin-right: 5px; color: #00539c; font-size: 9px;"></i>
                  <span><strong>Condutor:</strong> ${driverInfo.name || driverInfo.uniqueId || 'N/A'}</span>
                </p>` : ''}
              </div>
              <div class="info-col" style="width: 49%;">
                <p style="margin: 5px 0; font-size: 10px; display: flex; align-items: center;">
                  <i class="fas fa-clock" style="width: 12px; margin-right: 5px; color: #00539c; font-size: 9px;"></i>
                  <span><strong>Período:</strong> ${startDate} - ${endDate}</span>
                </p>
              </div>
            </div>
          </div>
          
          <!-- Resumo da rota com cards coloridos -->
          <div class="route-summary" style="margin-top: 12px; background-color: white; border-radius: 6px; padding: 10px; box-shadow: 0 2px 3px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
            <h2 style="font-size: 14px; margin: 0 0 8px 0; color: #00539c; display: flex; align-items: center; padding-left: 2px;">
              <i class="fas fa-chart-pie" style="margin-right: 6px; color: #00539c; font-size: 12px;"></i> Resumo da Rota
            </h2>
            
            <div class="metrics-container" style="display: flex; flex-wrap: wrap; margin: -3px; justify-content: space-between;">
              <!-- Card de distância -->
              <div class="metric-card" style="flex-basis: calc(33.33% - 6px); margin: 3px; padding: 8px; border-radius: 5px; background: linear-gradient(to right, #00539c, #0077cc); color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center;">
                  <i class="fas fa-route" style="font-size: 18px; margin-right: 6px; opacity: 0.8;"></i>
                  <div>
                    <div style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">Distância Total</div>
                    <div style="font-size: 14px; font-weight: bold; margin-top: 1px;">${totalDistance.toFixed(2)} km</div>
                  </div>
                </div>
              </div>
              
              <!-- Card de velocidade máxima -->
              <div class="metric-card" style="flex-basis: calc(33.33% - 6px); margin: 3px; padding: 8px; border-radius: 5px; background: linear-gradient(to right, #e74c3c, #ff7675); color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center;">
                  <i class="fas fa-tachometer-alt" style="font-size: 18px; margin-right: 6px; opacity: 0.8;"></i>
                  <div>
                    <div style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">Velocidade Máxima</div>
                    <div style="font-size: 14px; font-weight: bold; margin-top: 1px;">${maxSpeed.toFixed(1)} km/h</div>
                  </div>
                </div>
              </div>
              
              <!-- Card de velocidade média -->
              <div class="metric-card" style="flex-basis: calc(33.33% - 6px); margin: 3px; padding: 8px; border-radius: 5px; background: linear-gradient(to right, #2ecc71, #55efc4); color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center;">
                  <i class="fas fa-gauge-high" style="font-size: i8px; margin-right: 6px; opacity: 0.8;"></i>
                  <div>
                    <div style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">Velocidade Média</div>
                    <div style="font-size: 14px; font-weight: bold; margin-top: 1px;">${avgSpeed.toFixed(1)} km/h</div>
                  </div>
                </div>
              </div>
              
              <!-- Card de Horas de Funcionamento -->
              <div class="metric-card" style="flex-basis: calc(33.33% - 6px); margin: 3px; padding: 8px; border-radius: 5px; background: linear-gradient(to right, #3498db, #74b9ff); color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center;">
                  <i class="fas fa-play-circle" style="font-size: 18px; margin-right: 6px; opacity: 0.8;"></i>
                  <div>
                    <div style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">Hrs. Funcionamento</div>
                    <div style="font-size: 14px; font-weight: bold; margin-top: 1px;">${totalOperationHours} h</div>
                  </div>
                </div>
              </div>
              
              <!-- Card de Horas Parado -->
              <div class="metric-card" style="flex-basis: calc(33.33% - 6px); margin: 3px; padding: 8px; border-radius: 5px; background: linear-gradient(to right, #f39c12, #feca57); color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center;">
                  <i class="fas fa-stop-circle" style="font-size: 18px; margin-right: 6px; opacity: 0.8;"></i>
                  <div>
                    <div style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">Hrs. Parado</div>
                    <div style="font-size: 14px; font-weight: bold; margin-top: 1px;">${totalStopHours} h</div>
                  </div>
                </div>
              </div>
              
              <!-- Card de pontos -->
              <div class="metric-card" style="flex-basis: calc(33.33% - 6px); margin: 3px; padding: 8px; border-radius: 5px; background: linear-gradient(to right, #9b59b6, #a55eea); color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center;">
                  <i class="fas fa-map-marker-alt" style="font-size: 18px; margin-right: 6px; opacity: 0.8;"></i>
                  <div>
                    <div style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">Pontos Analisados</div>
                    <div style="font-size: 14px; font-weight: bold; margin-top: 1px;">${routePoints.value.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Detalhes dos pontos com tabela moderna -->
          <div class="route-details" style="margin-top: 12px; background-color: white; border-radius: 6px; padding: 10px; box-shadow: 0 2px 3px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
            <h2 style="font-size: 14px; margin: 0 0 8px 0; color: #00539c; display: flex; align-items: center; padding-left: 2px;">
              <i class="fas fa-list-ul" style="margin-right: 6px; color: #00539c; font-size: 12px;"></i> Detalhes dos Pontos
            </h2>
            
            ${routePoints.value.length > 50 ? 
              `<p style="font-style: italic; font-size: 8px; color: #666; text-align: center; margin: 5px 0; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-info-circle" style="margin-right: 3px; color: #00539c; font-size: 8px;"></i> 
                Exibindo 50 pontos de ${routePoints.value.length} para melhor visualização
              </p>` : 
              ''}
            
            <table class="points-table" style="width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 8px; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
              <thead>
                <tr>
                  <th style="background: linear-gradient(to right, #00539c, #0077cc); color: white; text-align: left; padding: 5px; width: 15%; font-weight: 600; font-size: 8px;">
                    <i class="fas fa-calendar-day" style="margin-right: 3px; font-size: 8px;"></i> Data/Hora
                  </th>
                  <th style="background: linear-gradient(to right, #00539c, #0077cc); color: white; text-align: left; padding: 5px; width: 10%; font-weight: 600; font-size: 8px;">
                    <i class="fas fa-tachometer-alt" style="margin-right: 3px; font-size: 8px;"></i> Velocidade
                  </th>
                  <th style="background: linear-gradient(to right, #00539c, #0077cc); color: white; text-align: left; padding: 5px; width: 15%; font-weight: 600; font-size: 8px;">
                    <i class="fas fa-user-circle" style="margin-right: 3px; font-size: 8px;"></i> Condutor
                  </th>
                  <th style="background: linear-gradient(to right, #00539c, #0077cc); color: white; text-align: left; padding: 5px; width: 25%; font-weight: 600; font-size: 8px;">
                    <i class="fas fa-sliders" style="margin-right: 3px; font-size: 8px;"></i> Atributos
                  </th>
                  <th style="background: linear-gradient(to right, #00539c, #0077cc); color: white; text-align: left; padding: 5px; width: 35%; font-weight: 600; font-size: 8px;">
                    <i class="fas fa-map-marker-alt" style="margin-right: 3px; font-size: 8px;"></i> Localização
                  </th>
                </tr>
              </thead>
              <tbody>
                ${getTableRows(routePoints.value)}
              </tbody>
            </table>
          </div>
          
          <!-- Rodapé moderno -->
          <div class="pdf-footer" style="margin-top: 20px; padding: 10px; border-top: 1px solid #eaeaea; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center;">
              <img src="/img/favicon.ico" alt="Logo" style="height: 14px; margin-right: 6px;" />
              <span style="font-size: 10px; color: #666;">Tarkan - Sistema de Rastreamento</span>
            </div>
            <div style="display: flex; align-items: center; font-size: 10px; color: #666;">
              <i class="fas fa-file-pdf" style="margin-right: 5px;"></i> Página 1/1
            </div>
          </div>
        </div>
        `;
        
        // Crear elemento temporário e adicionar o HTML
        const tempElement = document.createElement('div');
        tempElement.innerHTML = htmlContent;
        document.body.appendChild(tempElement);
        
        // Configurações do html2pdf
        const pdfOptions = {
          margin: [10, 10, 15, 10], // [top, right, bottom, left]
          filename: `Relatório_${deviceInfo?.name || 'Dispositivo'}_${dayjs().format('YYYYMMDD')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            letterRendering: true,
            allowTaint: true
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
          }
        };
        
        // Gerar PDF
        await html2pdf().from(tempElement).set(pdfOptions).save();
        
        // Remover elemento temporário
        document.body.removeChild(tempElement);
        
        // Mensagem de sucesso
        ElMessage({
          message: 'PDF gerado com sucesso!',
          type: 'success',
          duration: 3000
        });
        
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        ElMessage.error("Não foi possível gerar o PDF. Verifique o console para detalhes.");
      }
    };
    
    const handleGenerateTabularPDF = async () => {
      isLoadingTabular.value = true;
      try {
        if (routePoints.value.length === 0) {
          await loadRoute();
        }
        
        ElMessage({
          message: 'Generando PDF tabular, por favor espere...',
          type: 'info',
          duration: 3000
        });
        
        const deviceId = formData.value.deviceId;
        const deviceInfo = await fetchDeviceById(deviceId);
        
        await pdfRouteReportRef.value.generateTabularReport(routePoints.value, deviceInfo);
      } catch (error) {
        console.error("Error al generar PDF tabular:", error);
        ElMessage.error('Error al generar el informe PDF tabular');
      } finally {
        isLoadingTabular.value = false;
      }
    };
    
    
    // Handler para vídeos do mapa
    const handleVideoFromMap = (event) => {
      console.log('🎬 Recebido evento de vídeo do mapa:', event.detail);
      playVideo(event.detail);
    };

    // DEBUG: Watch routePoints para detectar mudanças
    watch(routePoints, (newVal, oldVal) => {
      console.log('🔄 WATCH routePoints mudou:', {
        oldLength: oldVal?.length || 0,
        newLength: newVal?.length || 0,
        primeirosIDs: newVal?.slice(0, 3).map(p => p?.id) || []
      });
    }, { deep: false });

    // Lifecycle hooks
    onMounted(() => {
      console.log('🚀 MOUNTED - Componente montado');
      
      if (store.state.drivers.driverList.length === 0) {
        store.dispatch('drivers/load');
      }
      
      // Listener para vídeos do mapa
      window.addEventListener('playVideoFromMap', handleVideoFromMap);
      
      if (route.query.deviceId) {
        formData.value.deviceId = parseInt(route.query.deviceId);
        
        if (route.query.from && route.query.to) {
          try {
            const fromStr = route.query.from;
            const toStr = route.query.to;
            
            formData.value.date[0] = fromStr.slice(0, 16);
            formData.value.date[1] = toStr.slice(0, 16);
          } catch (error) {
            console.error('Error procesando fechas:', error);
          }
        }
        
        loadRoute();
      }
    });
    
    watch(() => route.query, (newQuery) => {
      if (newQuery.deviceId) {
        formData.value.deviceId = parseInt(newQuery.deviceId);
        
        if (newQuery.from && newQuery.to) {
          try {
            const fromStr = newQuery.from;
            const toStr = newQuery.to;
            
            formData.value.date[0] = fromStr.slice(0, 16);
            formData.value.date[1] = toStr.slice(0, 16);
          } catch (error) {
            console.error('Error procesando fechas actualizadas:', error);
          }
        }
        
        loadRoute();
      }
    }, { deep: true });
    
    watch(currentPlayingPoint, (newValue) => {
      nextTick(() => {
        scrollToActivePoint(newValue);
      });
    });
    
    onUnmounted(() => {
      // Limpar listener de vídeos do mapa
      window.removeEventListener('playVideoFromMap', handleVideoFromMap);
    });
    
    // Return values and functions for the template
    return {
      formData,
      routePoints,
      loading,
      showRouteMarkers,
      pdfRouteReportRef,
      isLoading,
      isLoadingDetailed,
      isLoadingTabular,
      isLoadingKml,
      routeTimelineRef,
      currentPlayingPoint,
      loadRoute,
      loadGraph,
      handleGeneratePDF,
      handleGenerateDetailedPDF,
      handleGenerateTabularPDF,
      handleGenerateKML,
      showTip,
      hideTip,
      getDriverName,
      truncateText,
      getVideoFiles,
      getThumbnailUrl,
      getVideoUrl,
      playVideo,
      closeVideoModal,
      currentVideo,
      showVideoModal,
      videoLoading,
      debugSwitchChange,
      store
    };
  }
});
</script>

<style scoped>
/* Estilos Gerais */
.history-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.form-title {
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--el-color-primary);
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.form-title i {
  margin-right: 10px;
}

/* Formulário */
.history-form {
  padding: 5px 0;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.device-selector {
  flex: 1;
  margin-bottom: 0;
  margin-right: 10px;
}

.compact-buttons {
  white-space: nowrap;
}

.dates-row {
  align-items: center;
}

.date-container {
  display: flex;
  align-items: center;
  flex: 1;
  margin-right: 10px;
}

.date-container .el-input {
  flex: 1;
}

.date-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  margin: 0 5px;
}

.marker-container {
  display: flex;
  align-items: center;
  margin-left: 5px;
  min-width: 40px;
}

.marker-switch {
  display: flex;
}

.switch-label {
  display: flex;
  align-items: center;
  margin-left: 5px;
  font-size: 14px;
  color: var(--el-color-primary);
}

/* Conteúdo do Histórico */
.history-content {
  margin-top: 15px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
}

/* Estados de carregamento e vazio */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.loading-state i, .empty-state i {
  font-size: 40px;
  margin-bottom: 15px;
  color: var(--el-color-primary);
}

/* Timeline */
.route-timeline {
  padding: 10px 0;
  max-height: 500px;
  overflow-y: auto;
  position: relative;
  scroll-behavior: smooth;
}

.timeline-point {
  display: flex;
  border-bottom: 1px dashed var(--el-border-color);
  position: relative;
}

.timeline-point:last-child {
  border-bottom: none;
}

.timeline-marker {
  position: relative;
  width: 80px;
  text-align: right;
  padding-right: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.timeline-line {
  position: absolute;
  right: 5px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: var(--el-color-primary-light-5);
}

.timeline-line-start {
  top: 50%;
}

.timeline-line-end {
  bottom: 50%;
}

.timeline-icon {
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background-color: var(--el-color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 2;
}

.timeline-dot {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background-color: var(--el-color-primary-light-5);
  border-radius: 50%;
  z-index: 2;
}

.timeline-date {
  position: absolute;
  right: 25px;
  top: 50%;
  transform: translateY(-50%);
  line-height: 1.3;
  font-size: 10px;
}

.timeline-content {
  flex: 1;
  padding: 10px 15px;
  position: relative;
}

.address {
  font-size: 12px;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.point-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.speed {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.attributes {
  display: flex;
  gap: 8px;
}

.attribute {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  margin-left: 4px;
  position: relative;
}

.attribute:hover::after {
  content: attr(data-title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  z-index: 10;
}

.attribute-value {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* Estilos específicos para alarmas/video */
.alarm-attribute {
  background: rgba(255, 193, 7, 0.1);
  border-radius: 4px;
  padding: 2px 6px;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.alarm-attribute:hover {
  background: rgba(255, 193, 7, 0.2);
  border-color: rgba(255, 193, 7, 0.5);
}

.alarm-value {
  color: var(--el-color-warning);
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Estilos para a seção de alarme e vídeos */
.alarm-section {
  margin: 8px 0;
  padding: 8px;
  background: rgba(255, 243, 205, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 193, 7, 0.2);
}

.alarm-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 4px;
}

.alarm-title {
  font-weight: 600;
  color: var(--el-color-warning-dark-2);
  font-size: 12px;
}

.alarm-text {
  color: var(--el-color-warning-dark-1);
  font-size: 11px;
}

.video-thumbnails {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.video-thumbnail {
  position: relative;
  width: 60px;
  height: 45px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid transparent;
}

.video-thumbnail:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
  border-color: var(--el-color-warning);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: background 0.2s;
}

.video-thumbnail:hover .play-overlay {
  background: rgba(255, 193, 7, 0.9);
  color: white;
}

.video-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  text-align: center;
  padding: 2px;
}

.video-label {
  font-size: 8px;
  font-weight: 500;
}

/* ========== MODAL DE VIDEO MODERNO ========== */
.video-modal {
  --el-dialog-bg-color: #ffffff;
  --el-dialog-border-radius: 16px;
}

.video-modal .el-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.video-modal .el-dialog__header {
  padding: 0;
  margin: 0;
  border-bottom: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.video-modal .el-dialog__body {
  padding: 0;
  background: #f8f9fa;
}

.video-modal .el-dialog__footer {
  padding: 0;
  margin: 0;
  background: #ffffff;
  border-top: 1px solid #e9ecef;
}

/* Header moderno */
.modern-video-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin: 0;
  width: calc(100% - 24px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.video-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.video-icon-wrapper i {
  font-size: 20px;
  color: #ffffff;
}

.header-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
}

.header-subtitle {
  font-size: 12px;
  opacity: 0.85;
  font-weight: 400;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.close-button i {
  font-size: 16px;
}

/* Conteúdo do vídeo */
.modern-video-content {
  padding: 16px;
  background: #f8f9fa;
}

.video-wrapper {
  position: relative;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.video-frame {
  position: relative;
  width: 100%;
  height: 380px;
  background: #000;
}

.modern-video-player {
  width: 100% !important;
  height: 100% !important;
  border-radius: 12px;
}

/* Loading overlay moderno */
.video-wrapper.loading::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.video-wrapper.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: modernSpin 1s linear infinite;
  z-index: 1001;
}

@keyframes modernSpin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

/* Footer moderno */
.modern-video-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  margin: 0;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c757d;
  font-size: 14px;
}

.footer-info i {
  color: #667eea;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

/* Botões modernos */
.modern-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  outline: none;
}

.modern-btn.secondary {
  background: #e9ecef;
  color: #495057;
  border: 1px solid #dee2e6;
}

.modern-btn.secondary:hover {
  background: #dee2e6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.modern-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.modern-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.modern-btn i {
  font-size: 14px;
}

/* Responsividade */
@media (max-width: 768px) {
  .video-modal {
    width: 95% !important;
    margin: 20px;
  }
  
  .modern-video-header {
    padding: 16px 20px;
  }
  
  .header-left {
    gap: 12px;
  }
  
  .video-icon-wrapper {
    width: 40px;
    height: 40px;
  }
  
  .video-icon-wrapper i {
    font-size: 20px;
  }
  
  .header-text h3 {
    font-size: 18px;
  }
  
  .header-subtitle {
    font-size: 13px;
  }
  
  .modern-video-content {
    padding: 16px;
  }
  
  .video-frame {
    height: 300px;
  }
  
  .modern-video-footer {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 16px 20px;
  }
  
  .footer-actions {
    justify-content: stretch;
  }
  
  .modern-btn {
    flex: 1;
    justify-content: center;
  }
}

.driver-info {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--el-color-primary);
  margin-right: 10px;
}

.driver-info i {
  font-size: 14px;
  margin-right: 5px;
  color: var(--el-color-primary);
}

.location-link {
  color: var(--el-color-primary);
  text-decoration: none;
  transition: color 0.2s;
}

.location-link:hover {
  color: var(--el-color-primary-light-3);
  text-decoration: underline;
}

/* Utilitários */
.text-success {
  color: var(--el-color-success);
}

.text-danger {
  color: var(--el-color-danger);
}

.text-muted {
  color: var(--el-text-color-secondary);
}

/* Estilos para elemento ativo durante a reprodução */
.timeline-active {
  background-color: rgba(64, 158, 255, 0.08);
  transition: all 0.3s ease;
  position: relative;
  z-index: 5;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.timeline-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background-color: var(--el-color-primary);
}

.timeline-line-active {
  background-color: var(--el-color-primary);
  width: 3px !important;
  box-shadow: 0 0 4px rgba(64, 158, 255, 0.5);
}

.timeline-dot-active {
  background-color: var(--el-color-primary);
  width: 12px;
  height: 12px;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.5);
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-dot {
  0% {
    transform: translateY(-50%) scale(1);
  }
  50% {
    transform: translateY(-50%) scale(1.2);
  }
  100% {
    transform: translateY(-50%) scale(1);
  }
}

.timeline-date-active {
  color: var(--el-color-primary);
  font-weight: 600;
  font-size: 10px;
}

.timeline-content-active {
  border-left: 3px solid var(--el-color-primary);
  padding-left: 12px;  /* 15px - 3px */
}

.timeline-content-active .address {
  color: var(--el-color-primary);
  font-weight: 600;
}

/* Responsividade */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .device-selector {
    margin-right: 0;
    margin-bottom: 8px;
  }
  
  .compact-buttons {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
  }
  
  .date-container {
    margin-right: 0;
    margin-bottom: 8px;
  }
  
  .marker-switch {
    align-self: flex-end;
  }
  
  .timeline-marker {
    width: 80px;
    padding: 10px;
  }

  .timeline-date {
    right: 15px;
    font-size: 10px;
  }
}
</style>