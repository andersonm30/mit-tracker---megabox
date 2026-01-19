<template>
  <div>
        <!-- Contenedor para video cámara que se creará dinámicamente mediante JS -->


  <!-- Header Actions Component -->
  <DeviceHeaderActions
    :device="device"
    :position="position"
    :is-camera-protocol="isCameraProtocol"
    :is-anchored="isAnchored"
    :is-qr-locked="device?.attributes?.isQrLocked || false"
    :show-qr-button="showQrButton"
    :show-routes-button="showRoutesButton"
    :show-anchor-button="permissions.canAnchor"
    :show-unlock-button="showUnlockButton"
    :show-block-button="showBlockButton"
    :can-edit="permissions.canEdit"
    :can-send-command="permissions.canSendCommand"
    :can-delete="permissions.canDelete"
    :is-device-offline="device?.status === 'offline'"
    @open-qr-code="openQrCode"
    @show-external="showExternal"
    @camera-or-street="isCameraProtocol ? showCameraOptions($event) : store.dispatch('devices/toggleStreet')"
    @go-to-routes="$router.push('/reports/history?deviceId=' + device.id)"
    @toggle-anchor="actAnchorWithModal(device.id)"
    @unlock="actUnlock"
    @block="actBlock"
    @context-menu="actContext"
    @open-edit="openEdit"
    @open-command="openCommandModal"
    @open-delete="openDeleteModal"
  />


  <div v-if="device" data-testid="device-detail" class="device" :class="{isAttrComplete: attrComplete}">
    <div class="name name-relative" data-testid="device-name">
      {{device.name}}
      <!-- Botón para mostrar/ocultar el espacio de las dos cámaras -->
      <button 
        v-if="isCameraProtocol" 
        @click="toggleDualCameraView" 
        class="dual-camera-toggle-btn" 
        :class="{'pulse-animation': !showDualCameras}"
        :title="showDualCameras ? KT('device.hideCameras') : KT('device.showCameras')"
        data-testid="dual-camera-toggle"
      >
        <i class="fas fa-video"></i>
      </button>
    </div>
    
    <!-- Espacio para las dos cámaras lado a lado -->
        <div class="resume">
      <!-- Resume Icons Component -->
      <DeviceResumeIcons
        :device="device"
        :position="position"
        :show-anchor="permissions.canAnchor"
        :is-anchored="isAnchored"
      />



       <div class="info info-flex border-bottom-dotted">

        
       <div class="flex-1 border-right-dotted flex-center">          
          <Device-Image :id="device.id" :category="device.category" :allow-upload="true" />
       </div>
       

        

        
      <div class="flex-1">


        <div class="border-bottom-dotted">

          <div class="stat-label mt-10"><i class="fas fa-tachometer-alt"></i> {{KT('device.positionSpeed')}}</div>
          <div class="stat-value-primary mt-10 mb-10">{{$t('units.'+serverAttrs.speedUnit,{speed: (position)?position.speed:0})}}</div>
        
          <div v-if="position && position.attributes['rpm']" class="border-bottom-dotted">

            
            <div class="stat-label mt-10"><i class="fas fa-tachometer-alt"></i> {{KT('device.rpm')}}</div>
            <div class="stat-value-primary mt-10 mb-10">{{position.attributes.rpm}} {{"RPM"}}</div>
          </div>
        
        
        </div>

       

        














        
        <div >
          <div class="stat-label mt-10"><i class="fas fa-address-card"></i> {{KT('device.plate')}}</div>
          <div class="stat-value-primary mt-10 mb-10">{{device.attributes['placa'] || '--'}}</div>
        </div>

        <div class="border-top-dotted">
          <div class="stat-label mt-10"><i class="fas fa-car"></i> {{KT('device.model')}}</div>
          <div class="stat-value-primary mt-10 mb-10">{{device.model || '--'}}</div>
        </div>

              
      </div>


    </div>

 






  <div class="stats" v-if="position">
    <!-- Dual Camera Component -->
    <DeviceDualCamera
      v-if="showDualCameras && isCameraProtocol"
      data-testid="dual-camera-container"
      :camera-selected="cameraSelected"
      :left-camera-message="leftCameraMessage"
      :right-camera-message="rightCameraMessage"
      @select-camera="selectCameraWrapper"
      @close-camera="cleanupDualCameraResources"
      @load-left-camera="loadLeftCamera"
      @load-right-camera="loadRightCamera"
    />



    <!-- Last Position Component -->
    <DeviceLastPosition
      :position="position"
      :show-share-link="store.getters.advancedPermissions(25)"
      :is-older-than3-hours="isOlderThan3Hours"
      :stopped-time-formatted="position?.attributes?.stoppedTime ? getLastUpdated(position.attributes.stoppedTime, currentTime) : ''"
      :current-time="currentTime"
      @share-link="editShareRef.newShare(device.id)"
      @share-maps="openMapsShare"
      @share-street="openStreetShare"
    />



  </div>
      <div class="stats" v-else>
        <div class="updated p-10">{{KT('device.noPosition')}}</div>
      </div>

      <div v-if="position" class="info info-flex border-top-dotted">


      <!-- Driver Card Component -->
      <DeviceDriverCard
        :position="position"
        :driver="currentDriver"
        :driverImageRefreshKey="driverImageRefreshKey"
        @open-driver-modal="openDriverModal"
      />
     
      <!-- Mostrar según configuración del dispositivo -->
      <template v-if="displayMode === 'odometer' || displayMode === 'both'">
        <div class="stats-block flex-1 text-center">
          <div class="stat-label-lg mt-20">
            <div class="subtitle"><i class="fas fa-road"></i> {{ KT('device.distance') }}</div>
          </div>
          <div class="stat-value-odometer">
            <div class="odometer-display">
              <template v-for="(digit, index) in formattedDistance.toString().split('')" :key="index">
                <div class="odometer-digit">{{ digit }}</div>
              </template>
              <div class="odometer-unit">{{ serverAttrs.distanceUnit }}</div>
            </div>
          </div>
        </div>
      </template>
      
      <!-- Mostrar horas motor -->
      <template v-if="displayMode === 'hours' || displayMode === 'both'">
        <div class="stats-block flex-1 text-center" :class="{ 'border-left-dotted': displayMode === 'both' }">
          <div class="mt-20" :class="displayMode === 'both' ? 'stat-label-sm' : 'stat-label-lg'">
            <div class="subtitle"><i class="fas fa-clock"></i> {{ KT('device.hoursMovement') }}</div>
          </div>
          <div :class="displayMode === 'both' ? 'stat-value-hours-sm' : 'stat-value-hours'">
            <div class="hours-display">
              <template v-if="position?.attributes?.hours">
                <template v-for="(digit, index) in formattedHours.split('')" :key="index">
                  <div :class="displayMode === 'both' ? 'hours-digit-sm' : 'hours-digit'">{{ digit }}</div>
                </template>
              </template>
              <template v-else>
                <div :class="displayMode === 'both' ? 'hours-digit-sm' : 'hours-digit'">0</div>
              </template>
              <div :class="displayMode === 'both' ? 'hours-unit-sm' : 'hours-unit'">hs</div>
            </div>
          </div>
        </div>
      </template>

    </div>

    </div>

    <!-- Sección Combustible y Temperatura -->
    <DeviceFuelTemperature
      v-if="position && (position.attributes?.fuel || position.attributes?.temperature)"
      :position="position"
      :fuel-price="device?.attributes?.fuelPrice"
      :currency="device?.attributes?.currency"
      :volume-unit="$t(serverAttrs.volumeUnit)"
      :temperature-unit="device?.attributes?.temperatureUnit"
      @reset-odometer="actResetOdometer(device.id)"
    />

    <!-- Sección Eventos Recientes -->
    <div v-if="eventsInfo.length > 0" class="border-top-dotted">
      <DeviceEventsHistory :events="eventsInfo" />
    </div>

    <!-- Sección Histórico de Movimento -->
    <div v-if="historyInfo.length>0" class="border-top-dotted">
      <DeviceHistoryBar 
        :history-data="historyInfo" 
        @go-to-report="goToReport"
      />
    </div>

    <!-- Sección Atributos/Favoritos -->
    <div v-if="position" class="favorites border-top-dotted">
      <DeviceAttributes
        :favorites="getFavorites(position)"
        :attributes="getAttributes(position)"
        :show-complete="attrComplete"
        :is-administrator="store.state.auth.administrator"
        @toggle-favorite="actFav"
        @toggle-complete="attrComplete = !attrComplete"
      />
    </div>
    


  </div>
    <div v-else class="text-center">{{$t('device.loading')}}</div>

 




  </div>

  <!-- Command Modal -->
  <CommandModal 
    ref="commandModalRef"
    v-model="commandModalOpen" 
    :device="device" 
  />

  


  <!-- Driver Details Modal -->
  <DeviceDriverModal
    :visible="showDriverModal"
    :driver="selectedDriver"
    :image-refresh-key="driverImageRefreshKey"
    :is-generating-p-d-f="isGeneratingPDF"
    @close="closeDriverModal"
    @generate-pdf="generateDriverPDF"
  />


</template>

<script setup>



import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/tooltip/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/dialog/style/css'

// ElButton e ElDialog foram movidos para DeviceDriverModal

import {useRoute,useRouter,onBeforeRouteLeave} from 'vue-router';

import {ref,computed,watch,inject,onMounted,onUnmounted,onBeforeUnmount,onUpdated,nextTick} from 'vue';
import {useStore} from "vuex"

import {ElMessage} from "element-plus/es/components/message";
import {ElMessageBox} from "element-plus/es/components/message-box";
import {ElNotification} from "element-plus/es/components/notification";


import DeviceImage from "./device.image.vue";
import CommandModal from "../tarkan/components/CommandModal.vue";

// Subcomponentes do device internal
import {
  DeviceHeaderActions,
  DeviceResumeIcons,
  DeviceLastPosition,
  DeviceDualCamera,
  DeviceEventsHistory,
  DeviceHistoryBar,
  DeviceAttributes,
  DeviceFuelTemperature,
  DeviceDriverModal
} from "./device-components";

// Driver card component
import DeviceDriverCard from "../components/device/DeviceDriverCard.vue";

// i18n helper
import KT from '../tarkan/func/kt.js';
import defaultDeviceData from '../defaultDeviceData.js';

// Composables
import { useDeviceVideoPlayer } from "../composables/useDeviceVideoPlayer.js";
import { useDualCamera } from "../composables/useDualCamera.js";

// Timer Registry - gerenciamento centralizado de timers
import {
  setSafeTimeout,
  setSafeInterval,
  clearSafeTimeout,
  clearSafeInterval,
  clearAllTimers,
  getActiveTimerCount
} from "../utils/timerRegistry.js";

// Observability - monitoramento de recursos e spans
import {
  startResourceMonitor,
  stopResourceMonitor,
  spans as obsSpans,
  safeSpanStart
} from "../utils/observability.js";

// ========================
// NOTIFICATION HELPERS
// ========================
/**
 * Notification helpers para padronizar durations e uso de KT()
 * 
 * @param {string} message - Mensagem traduzida via KT() ou texto direto
 * @param {number} duration - Duration em ms (opcional, usa default do tipo)
 */
const notifySuccess = (message, duration = 2500) => {
  ElNotification({
    title: KT('success'),
    message,
    type: 'success',
    duration
  });
};

const notifyError = (message, duration = 5000) => {
  ElNotification({
    title: KT('error'),
    message,
    type: 'error',
    duration
  });
};

const notifyInfo = (message, duration = 3000) => {
  ElNotification({
    title: KT('info'),
    message,
    type: 'info',
    duration
  });
};

// eslint-disable-next-line no-unused-vars
const notifyWarn = (message, duration = 3500) => {
  ElNotification({
    title: KT('warning'),
    message,
    type: 'warning',
    duration
  });
};

const messageSuccess = (message) => {
  ElMessage.success(message);
};

const messageError = (message) => {
  ElMessage.error(message);
};

const messageWarning = (message) => {
  ElMessage.warning(message);
};

// ========================
// SAFE TRACCAR WRAPPER
// ========================
/**
 * Wrapper seguro para chamadas ao runtimeApi
 * Garante que UI não quebra se serviço não estiver disponível
 * @param {string} label - Identificador para logs
 * @param {Function} fn - Função que recebe runtimeApi e retorna Promise
 * @returns {Promise<any|null>} Resultado da chamada ou null em caso de erro
 */
const safeTraccarCall = async (label, fn) => {
  if (!runtimeApi) {
    notifyError(KT('errors.traccarUnavailable') || 'Serviço Traccar não disponível');
    console.warn('[traccar]', label, 'service unavailable');
    return null;
  }
  try {
    return await fn(runtimeApi);
  } catch (e) {
    console.warn('[traccar]', label, e);
    notifyError(KT('errors.traccarCommunication') || 'Erro ao comunicar com servidor');
    return null;
  }
};

// ========================
// DOM LISTENERS REGISTRY
// ========================
// Centraliza event listeners para garantir remoção no cleanup
const domListeners = [];

/**
 * Adiciona um event listener e registra para remoção automática no cleanup
 * @param {EventTarget} target - Elemento alvo (window, document, elemento DOM)
 * @param {string} event - Nome do evento
 * @param {Function} handler - Função handler
 * @param {Object|boolean} opts - Opções do addEventListener
 */
const addDomListener = (target, event, handler, opts) => {
  if (!target) return;
  target.addEventListener(event, handler, opts);
  domListeners.push(() => {
    try {
      target.removeEventListener(event, handler, opts);
    } catch (e) {
      // Ignore - elemento pode já não existir
    }
  });
};

/**
 * Remove todos os event listeners registrados
 */
const removeAllDomListeners = () => {
  if (domListeners.length === 0) return;
  console.debug(`[DomListeners] Removendo ${domListeners.length} listeners`);
  domListeners.forEach(off => {
    try { off(); } catch (e) { /* ignore */ }
  });
  domListeners.length = 0;
};

// ========================
// CONSTANTES DE CONFIGURAÇÃO
// ========================
const IMAGE_DEBOUNCE_DELAY_MS = 300;     // Debounce para carregamento de imagem
const IMAGE_TIMEOUT_MS = 800;            // Timeout para detectar se imagem existe
const DRIVER_CHECK_DELAY_MS = 500;       // Delay para verificar drivers
const STATUS_CHANGE_STABILITY_MS = 3000; // Tempo de estabilidade após mudança de status
const EVENTS_INTERVAL_HOURS = 3;         // Horas de histórico de eventos

// ========================
// DEBUG PERF - MÉTRICAS DEV-ONLY
// ========================
// Habilitado via: localStorage.setItem('DEBUG_PERF', '1') ou window.DEBUG_PERF = 1
const DEBUG_PERF = process.env.NODE_ENV === 'development' || 
                   (typeof window !== 'undefined' && (
                     window.DEBUG_PERF === 1 || 
                     localStorage?.getItem?.('DEBUG_PERF') === '1'
                   ));

// Contadores de performance (só alocados se DEBUG_PERF)
let perfUpdateCount = 0;
let perfLastLogTime = 0;
const PERF_LOG_INTERVAL = 10; // Logar a cada N updates

// Helper para medir tempo de execução (DEV-only)
// eslint-disable-next-line no-unused-vars
const perfMeasure = (label, fn) => {
  if (!DEBUG_PERF) return fn();
  const t0 = performance.now();
  const result = fn();
  const dt = performance.now() - t0;
  if (dt > 5) { // Só logar se > 5ms
    console.debug(`[PERF] ${label}: ${dt.toFixed(2)}ms`);
  }
  return result;
};

// Helper async para medir (DEV-only)
// eslint-disable-next-line no-unused-vars
const perfMeasureAsync = async (label, fn) => {
  if (!DEBUG_PERF) return fn();
  const t0 = performance.now();
  const result = await fn();
  const dt = performance.now() - t0;
  console.debug(`[PERF] ${label}: ${dt.toFixed(2)}ms`);
  return result;
};

const historyInfo = ref([]);
const eventsInfo = ref([]);

// ========================
// ABORT CONTROLLER REGISTRY
// ========================
// Centraliza AbortControllers para cancelar requests pendentes no cleanup
const activeControllers = new Set();

/**
 * Cria um novo AbortController e registra para cleanup centralizado
 * @returns {AbortController} Controller registrado
 */
const createAbortController = () => {
  const controller = new AbortController();
  activeControllers.add(controller);
  
  // Auto-remove quando o signal é abortado
  controller.signal.addEventListener('abort', () => {
    activeControllers.delete(controller);
  }, { once: true });
  
  return controller;
};

/**
 * Aborta todos os controllers pendentes e limpa o registry
 */
const abortAllControllers = () => {
  if (activeControllers.size === 0) return;
  
  console.debug(`[AbortControllers] Abortando ${activeControllers.size} requests pendentes`);
  activeControllers.forEach(controller => {
    try {
      controller.abort();
    } catch (e) {
      // Ignore - controller pode já estar abortado
    }
  });
  activeControllers.clear();
};

const store = useStore();
const route = useRoute();
const router = useRouter();

// ========================
// RUNTIME API - DEVE VIR ANTES DE QUALQUER USO
// ========================
const runtimeApi = inject('runtimeApi', null);
const flyToDevice = inject('flyToDevice');
const contextOpenRef = inject('contextMenu');
const editShareRef = inject("edit-share");
const editDeviceRef = inject('edit-device');
const qrDeviceRef = inject('qr-device');

// ========================
// INITIALIZE COMPOSABLES (APÓS runtimeApi)
// ========================
// Initialize video player composable
const videoPlayer = useDeviceVideoPlayer({
  store,
  KT,
  notify: notifyInfo,
  runtimeApi,
  createAbortController
});

// Initialize dual camera composable
const dualCamera = useDualCamera({
  store,
  KT,
  notify: notifyInfo,
  runtimeApi,
  loadVideoJS: videoPlayer.loadVideoJS,
  checkVideoAvailability: videoPlayer.checkVideoAvailability
});

// Destructure dual camera API
const {
  showDualCameras,
  cameraSelected,
  leftCameraMessage,
  rightCameraMessage,
  toggleDual,
  selectCamera,
  loadLeftCamera,
  loadRightCamera,
  cleanupDualCameraResources,
} = dualCamera;

// ========================
// DEVICE COMPUTED PROPERTIES
// ========================
const deviceId = computed(() => {
  const id = parseInt(route.params.deviceId);
  return isNaN(id) ? null : id;
});

const device = computed(() => {
  return deviceId.value ? store.getters['devices/getDevice'](deviceId.value) : null;
});

// ========================
// STATE REFS
// ========================
const imageUrl = ref();
const isProcessingSalida = ref(false);
const attrComplete = ref(false);
const now = ref(false);

// Command Modal variables
const commandModalOpen = ref(false);
const commandModalRef = ref(null);

// ========================
// COMPUTED PARA PERFORMANCE (evita recálculos no template)
// ========================

// Modo de exibição - cached para evitar recálculos
const displayMode = computed(() => {
  if (!device.value || !device.value.attributes) return 'odometer';
  return device.value.attributes['tarkan.displayMode'] || 'odometer';
});

// Permissões cachadas - evita chamar getters repetidamente no template
const permissions = computed(() => ({
  canEdit: store.getters.advancedPermissions(14),
  canSendCommand: store.getters.advancedPermissions(11),
  canDelete: store.getters.advancedPermissions(15),
  canBlock: store.getters.advancedPermissions(10),
  canUnlock: store.getters.advancedPermissions(11),
  canAnchor: store.getters.advancedPermissions(9),
  canRoutes72: store.getters.advancedPermissions(72),
  canRoutes73: store.getters.advancedPermissions(73),
}));

// Server attributes cachados
const serverAttrs = computed(() => ({
  enableQrDriverId: store.getters['server/getAttribute']('tarkan.enableQrDriverId', false),
  enableLockUnlock: store.getters['server/getAttribute']('tarkan.enableLockUnlock', false),
  speedUnit: store.getters['server/getAttribute']('speedUnit', 'speedUnit'),
  distanceUnit: store.getters['server/getAttribute']('distanceUnit', 'km'),
  volumeUnit: store.getters['server/getAttribute']('volumeUnit', 'volumeUnit'),
}));

// Props calculadas para DeviceHeaderActions
const isAnchored = computed(() => {
  return device.value ? store.getters['geofences/isAnchored'](device.value.id) : false;
});

const showQrButton = computed(() => {
  return serverAttrs.value.enableQrDriverId && permissions.value.canAnchor;
});

const showRoutesButton = computed(() => {
  return !store.state.auth.attributes['isShared'] && 
         permissions.value.canRoutes72 && 
         permissions.value.canRoutes73;
});

const showUnlockButton = computed(() => {
  const posBlocked = position.value?.attributes?.blocked;
  return (posBlocked && permissions.value.canUnlock) || 
         (serverAttrs.value.enableLockUnlock && permissions.value.canUnlock);
});

const showBlockButton = computed(() => {
  const posBlocked = position.value?.attributes?.blocked;
  return (!posBlocked && permissions.value.canBlock) || 
         (serverAttrs.value.enableLockUnlock && permissions.value.canBlock);
});

// Driver do motorista atual - REGRA PADRONIZADA
const currentDriver = computed(() => {
  const attrs = position.value?.attributes ?? {};
  const driverUniqueId = attrs.driverUniqueId || null;
  const rfid = attrs.rfid || null;
  const rfidStatus = attrs.rfidStatus || null;
  
  let effectiveDriverId = driverUniqueId;
  if (!effectiveDriverId && rfid && rfidStatus === 'VALID') {
    effectiveDriverId = rfid;
  }
  if (!effectiveDriverId && device.value?.attributes?.driverUniqueId) {
    effectiveDriverId = device.value.attributes.driverUniqueId;
  }
  
  return effectiveDriverId ? store.getters['drivers/getDriverByUniqueId'](effectiveDriverId) : null;
});

// Distância formatada
const formattedDistance = computed(() => {
  if (!position.value?.attributes?.totalDistance) return '0';
  const dist = position.value.attributes.totalDistance;
  const unit = serverAttrs.value.distanceUnit;
  
  if (unit === 'km') return Math.floor(dist / 1000);
  if (unit === 'mi') return Math.floor(dist / 1609.34);
  return Math.floor(dist);
});

// Horas formatadas
const formattedHours = computed(() => {
  if (!position.value?.attributes?.hours) return '0';
  return Math.round(position.value.attributes.hours / 3600000).toString();
});

const testImage = (device, uncacheParam)=>{
  
  // Verificar si necesitamos procesar esta imagen (debounce)
  const now = Date.now();
  const deviceStateKey = `${device.id}_${device.attributes?.hasImage}_${device.status}`;
  
  // Si es el mismo estado y han pasado menos de 5 segundos, no procesar
  if (lastProcessedDeviceState === deviceStateKey && (now - lastImageLoadTime) < 5000) {
    console.log('⏭️ Saltando testImage - mismo estado reciente:', device.id);
    return;
  }
  
  // PRIMERA VERIFICACIÓN: Si hasImage es false O undefined (salida), ir directo a categoría SIN request HTTP
  if (device && device.attributes && (device.attributes.hasImage === false || device.attributes.hasImage === undefined)) {
    console.log('🚁 DEVICES.INTERNAL.VUE - hasImage no-true - EVITANDO REQUEST 404, CATEGORÍA DIRECTA:', device.id);
    const categoryUrl = `/tarkan/assets/images/categories/${(device.category) ? device.category : 'default'}.png?noDeviceImage=${Date.now()}`;
    imageUrl.value = categoryUrl;
    lastProcessedDeviceState = deviceStateKey;
    lastImageLoadTime = now;
    console.log('🚁 DEVICES.INTERNAL.VUE - Categoría asignada:', categoryUrl);
    return; // SALIR INMEDIATAMENTE - NO HACER NINGÚN REQUEST HTTP A 401.png
  }

  const testCar = document.createElement("img");
  
  // Cache-busting simple con uncache parameter
  const timestamp = uncacheParam || Date.now();
  const deviceImageUrl = `/tarkan/assets/images/${device.id}.png?uncache=${timestamp}`;
  
  console.log('🔍 Testeando imagen para device:', deviceImageUrl, 'Status device:', device.status);
  
  // Timeout para detectar cuando imagen no existe (especialmente en salidas)
  const timeout = setSafeTimeout(() => {
    console.log('⏰ Timeout - asumiendo imagen no existe, usando categoría para device:', device.id);
    const categoryImageUrl = `/tarkan/assets/images/categories/${(device.category) ? device.category : 'default'}.png?uncache=${timestamp}`;
    imageUrl.value = categoryImageUrl;
    console.log('🚁 Imagen de categoría asignada por timeout:', categoryImageUrl);
  }, IMAGE_TIMEOUT_MS);
  
  testCar.onerror = ()=>{
        clearSafeTimeout(timeout);
        console.log('❌ Imagen de device no encontrada, usando categoría:', device.id);
        const categoryImageUrl = `/tarkan/assets/images/categories/${(device.category) ? device.category : 'default'}.png?uncache=${timestamp}`;
        imageUrl.value = categoryImageUrl;
        console.log('🚁 Imagen de categoría:', categoryImageUrl);
  }
  
  testCar.onload = ()=>{
        clearSafeTimeout(timeout);
        console.log('✅ Imagen de device cargada:', device.id);
        // Actualizar cache
        lastProcessedDeviceState = deviceStateKey;
        lastImageLoadTime = now;
        // Forzar actualización limpiando primero
        imageUrl.value = '';
        setSafeTimeout(() => {
          imageUrl.value = deviceImageUrl;
          console.log('🖼️ Imagen device asignada:', deviceImageUrl);
        }, 10);
  }
  
  testCar.src = deviceImageUrl;
 
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

// For storing interval references
const eventsRefreshInterval = ref(null);
const timeRefreshInterval = ref(null);
const imageRefreshInterval = ref(null);

// Lock de reentrância - evita execução simultânea mas permite chamadas futuras
let cleanupInProgress = false;

// ========================
// DEBUG RESOURCES (apenas DEV)
// ========================
/**
 * Instrumentação para debug de recursos em desenvolvimento.
 * Ativar: localStorage.setItem('DEBUG_RESOURCES', '1')
 * Acessar: window.__DEBUG_RESOURCES__
 * 
 * Métodos:
 * - controllersCount(): número de AbortControllers ativos
 * - timersCount(): número de timers ativos {timeouts, intervals}
 * - domListenersCount(): número de DOM listeners registrados
 * - cleanup(reason): chama cleanupAll manualmente
 * - snapshot(): JSON com todas as contagens + timestamp
 */
const DEBUG_RESOURCES = (
  process.env.NODE_ENV === 'development'
) || (typeof localStorage !== 'undefined' && localStorage.getItem('DEBUG_RESOURCES') === '1');

// Funções de instrumentação (definidas antes do cleanupAll)
const getResourceCounts = () => {
  try {
    const timerCounts = getActiveTimerCount();
    return {
      controllers: activeControllers.size || 0,
      timeouts: timerCounts.timeouts || 0,
      intervals: timerCounts.intervals || 0,
      timersTotal: (timerCounts.timeouts || 0) + (timerCounts.intervals || 0),
      domListeners: domListeners.length || 0
    };
  } catch (e) {
    return { controllers: 0, timeouts: 0, intervals: 0, timersTotal: 0, domListeners: 0 };
  }
};

// Expor objeto global apenas se DEBUG_RESOURCES estiver ativo
if (DEBUG_RESOURCES && typeof window !== 'undefined') {
  window.__DEBUG_RESOURCES__ = {
    /**
     * Retorna número de AbortControllers ativos
     */
    controllersCount: () => {
      try { return activeControllers.size; } catch { return 0; }
    },
    
    /**
     * Retorna contagem de timers ativos
     */
    timersCount: () => {
      try { return getActiveTimerCount(); } catch { return { timeouts: 0, intervals: 0 }; }
    },
    
    /**
     * Retorna número de DOM listeners registrados
     */
    domListenersCount: () => {
      try { return domListeners.length; } catch { return 0; }
    },
    
    /**
     * Chama cleanupAll manualmente (para testes)
     * @param {string} reason - Motivo do cleanup
     */
    cleanup: (reason = 'debug') => {
      try {
        // cleanupAll será definido abaixo, mas como JS é hoisted para funções, funciona
        if (typeof cleanupAll === 'function') {
          cleanupAll('manual:' + reason);
        }
      } catch (e) {
        console.error('[DEBUG_RESOURCES] cleanup error:', e);
      }
    },
    
    /**
     * Retorna snapshot JSON com todas as contagens
     */
    snapshot: () => {
      try {
        const counts = getResourceCounts();
        return {
          timestamp: new Date().toISOString(),
          ...counts,
          cleanupInProgress
        };
      } catch (e) {
        return {
          timestamp: new Date().toISOString(),
          error: e.message,
          controllers: 0,
          timersTotal: 0,
          domListeners: 0
        };
      }
    },
    
    /**
     * Flag indicando se debug está ativo
     */
    enabled: true,
    
    /**
     * Versão da instrumentação
     */
    version: '1.0.0'
  };
  
  console.debug('[DEBUG_RESOURCES] Instrumentação ativa. Use window.__DEBUG_RESOURCES__.snapshot()');
}

// ========================
// KILL SWITCH - CLEANUP TOTAL
// ========================
/**
 * cleanupAll: Kill switch para limpeza total de recursos do device.
 * Chamado em 3 momentos:
 * 1) onBeforeUnmount
 * 2) onBeforeRouteLeave
 * 3) Quando deviceId muda (watch)
 * 
 * Recursos limpos:
 * - videoPlayer (HLS players, polling, promises)
 * - dualCamera (left/right players, polling intervals)
 * - TODOS os timers via clearAllTimers() (timerRegistry)
 * - TODOS os requests pendentes via abortAllControllers()
 * - Intervals: eventsRefresh, timeRefresh, imageRefresh (refs)
 * - Event listeners: window device-image-loaded
 * 
 * Padrão: lock de reentrância (não flag permanente)
 * - Se já está limpando, retorna (evita reentrância)
 * - No final, libera o lock para permitir chamadas futuras
 * 
 * @param {string} reason - Motivo do cleanup ('unmount' | 'route-leave' | 'device-change')
 */
const cleanupAll = (reason) => {
  // Guard: lock de reentrância - evita execução simultânea
  if (cleanupInProgress) {
    console.debug('[cleanupAll] Skip - cleanup em andamento, reason:', reason);
    return;
  }
  
  cleanupInProgress = true;
  
  // APM: Track cleanup span (fail-safe - nunca quebra o runtime)
  const span = safeSpanStart(obsSpans.cleanup, reason);
  
  // Log com métricas de recursos (antes do cleanup)
  if (DEBUG_RESOURCES) {
    const counts = getResourceCounts();
    console.debug(
      `[cleanupAll] reason=${reason} controllers=${counts.controllers} ` +
      `timers=${counts.timersTotal} listeners=${counts.domListeners}`
    );
  } else {
    console.debug('[cleanupAll] Iniciando:', reason);
  }
  
  // 1) PRIMEIRO: Abortar TODOS os requests pendentes (para network antes do dispose)
  try {
    abortAllControllers();
  } catch (e) {
    console.debug('[cleanupAll] Erro ao abortar controllers:', e.message);
  }
  
  // 2) Cleanup do video player composable (HLS players, polling, promises)
  try {
    if (videoPlayer?.cleanup) {
      videoPlayer.cleanup();
    }
  } catch (e) {
    console.debug('[cleanupAll] Erro ao limpar videoPlayer:', e.message);
  }
  
  // 3) Cleanup dual camera resources (left/right players, polling intervals)
  try {
    if (cleanupDualCameraResources) {
      cleanupDualCameraResources();
    }
  } catch (e) {
    console.debug('[cleanupAll] Erro ao limpar dualCamera:', e.message);
  }
  
  // 4) KILL SWITCH: Limpar TODOS os timers via timerRegistry
  try {
    clearAllTimers();
  } catch (e) {
    console.debug('[cleanupAll] Erro ao limpar timers:', e.message);
  }
  
  // 5) Limpar refs de intervals (para garantir que não sejam reutilizados)
  if (eventsRefreshInterval.value) {
    clearSafeInterval(eventsRefreshInterval.value);
    eventsRefreshInterval.value = null;
  }
  if (timeRefreshInterval.value) {
    clearSafeInterval(timeRefreshInterval.value);
    timeRefreshInterval.value = null;
  }
  if (imageRefreshInterval.value) {
    clearSafeInterval(imageRefreshInterval.value);
    imageRefreshInterval.value = null;
  }
  
  // 6) Limpar refs de timeouts (para garantir que não sejam reutilizados)
  imageLoadDebounceTimer = null;
  positionImageRefreshTimer = null;
  statusChangeTimers = [];
  
  // 🔧 FIX: Limpar estado de driver ao trocar device
  if (reason === 'device-change') {
    selectedDriver.value = null;
    showDriverModal.value = false;
    console.debug('[cleanupAll] Driver state resetado');
  }
  
  // 7) Remover TODOS os event listeners do DOM via registry
  try {
    removeAllDomListeners();
  } catch (e) {
    console.debug('[cleanupAll] Erro ao remover listeners:', e.message);
  }
  
  // Liberar lock - permite chamadas futuras (device-change, etc.)
  cleanupInProgress = false;
  
  // APM: Finalizar span de cleanup
  span.end({ 
    controllersAfter: getResourceCounts().controllers,
    timersAfter: getResourceCounts().timersTotal 
  });
  
  // Log final com métricas (após cleanup - devem estar zeradas)
  if (DEBUG_RESOURCES) {
    const counts = getResourceCounts();
    console.debug(
      `[cleanupAll] Concluído: ${reason} | ` +
      `Restante: controllers=${counts.controllers} timers=${counts.timersTotal} listeners=${counts.domListeners}`
    );
  } else {
    console.debug('[cleanupAll] Concluído:', reason);
  }
};

// ========================
// PERF METRICS - onUpdated (DEV-only)
// ========================
onUpdated(() => {
  if (!DEBUG_PERF) return;
  
  perfUpdateCount++;
  const now = Date.now();
  
  // Logar a cada PERF_LOG_INTERVAL updates
  if (perfUpdateCount % PERF_LOG_INTERVAL === 0) {
    const elapsed = perfLastLogTime ? (now - perfLastLogTime) : 0;
    console.debug(
      `[PERF] Component updates: ${perfUpdateCount} total | ` +
      `Last ${PERF_LOG_INTERVAL} in ${elapsed}ms | ` +
      `Avg: ${(elapsed / PERF_LOG_INTERVAL).toFixed(1)}ms/update`
    );
    perfLastLogTime = now;
  }
});

onMounted(()=>{
  // OBSERVABILITY: Iniciar Resource Monitor (só ativo se DEBUG_RESOURCES=1)
  startResourceMonitor({
    getControllerCount: () => activeControllers.size,
    getDomListenerCount: () => domListeners.length,
    getPlayerCount: () => (videoPlayer?.isOpen?.value ? 1 : 0) + (dualCamera?.showDualCameras?.value ? 2 : 0)
  });

  // CRÍTICO: Forçar recálculo do tamanho do mapa após montagem
  nextTick(() => {
    if (window.$map?.invalidateSize) {
      window.$map.invalidateSize(true);
    }
  });

  const deviceId = route.params.deviceId;
  if (deviceId) {
    const deviceObj = store.getters['devices/getDevice'](parseInt(deviceId));
    if (deviceObj) {
      testImage(deviceObj, uncache.value);
      loadHistoryInfo(parseInt(deviceId));
    }
  }

  // Verificar si hay drivers faltantes al montar el componente
  const checkMissingDrivers = () => {
    const driverUniqueId = position.value?.attributes?.driverUniqueId;
    if (driverUniqueId) {
      const driver = store.getters['drivers/getDriverByUniqueId'](driverUniqueId);
      if (!driver) {
        console.log('🔄 Driver faltante al montar componente, recargando lista...', driverUniqueId);
        store.dispatch('drivers/load').then(() => {
          console.log('✅ Lista de drivers actualizada en onMounted');
          driverImageRefreshKey.value = new Date().getTime();
        }).catch(err => {
          console.error('❌ Error al recargar drivers en onMounted:', err);
        });
      }
    }
  };
  
  // Ejecutar verificación después de un breve delay para asegurar que position esté cargada
  setSafeTimeout(checkMissingDrivers, DRIVER_CHECK_DELAY_MS);

  // Handler para quando uma nova imagem de device é carregada
  const handleDeviceImageLoaded = (event) => {
    if (event.detail.id == device.value?.id) {
      console.log('🖼️ Nueva imagen de device cargada, actualizando uncache...', event.detail.id);
      uncache.value = new Date().getTime();
    }
  };
  
  // Listener para cuando se cargue una nueva imagen de device (via registry)
  addDomListener(window, 'device-image-loaded', handleDeviceImageLoaded);

  // Refresh simple cada 10 segundos (menos agresivo y con validación)
  const refreshDeviceImage = () => {
    if (device.value) {
      // Se hasImage é false/undefined, não precisa fazer refresh (imagem não existe)
      if (device.value.attributes && (device.value.attributes.hasImage === false || device.value.attributes.hasImage === undefined)) {
        console.log('⏭️ Saltando refresh - device sin imagen (hasImage=false/undefined):', device.value.id);
        return;
      }
      
      // Solo hacer refresh si no hemos procesado recientemente
      const now = Date.now();
      if ((now - lastImageLoadTime) > 5000) {
        console.log('🔄 Refresh simple imagen...', device.value.id);
        uncache.value = new Date().getTime();
        testImage(device.value, uncache.value);
      } else {
        console.log('⏭️ Saltando refresh - imagen procesada recientemente');
      }
    }
  };
  
  imageRefreshInterval.value = setSafeInterval(refreshDeviceImage, 10000);

  // Update current time every second
  timeRefreshInterval.value = setSafeInterval(()=>{
    now.value = new Date();
  },1000);

  // Refresh events list every minute if device is selected
  eventsRefreshInterval.value = setSafeInterval(() => {
    const deviceId = route.params.deviceId;
    if (deviceId) {
      loadEventsInfo(parseInt(deviceId));
    }
  }, 60000); // 60000ms = 1 minute

  if(route.query.edit){
    openEdit();
  }
})

// Clean up intervals on component unmount (backup - cleanupAll já deve ter executado)
onUnmounted(() => {
  // Safety net: chamar cleanupAll novamente caso onBeforeUnmount não tenha sido chamado
  cleanupAll('unmount-final');
})


const openMapsShare = () => {
  if (!position.value?.latitude || !position.value?.longitude) {
    console.warn('[openMapsShare] Position sem coordenadas');
    messageError(KT('device.positionNotAvailable'));
    return;
  }
  
  if (!device.value?.name) {
    console.warn('[openMapsShare] Device name não disponível');
  }

  const link = 'http://maps.google.com/maps?q=loc:'+position.value.latitude+","+position.value.longitude;

  if (navigator.share) {
    navigator.share({
      title: device.value?.name || 'Device',
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

    messageSuccess(KT('device.copiedToClipboard'));
  }

};



const openStreetShare = () => {
  if (!position.value?.latitude || !position.value?.longitude) {
    console.warn('[openStreetShare] Position sem coordenadas');
    messageError(KT('device.positionNotAvailable'));
    return;
  }
  
  if (!device.value?.name) {
    console.warn('[openStreetShare] Device name não disponível');
  }

  const link = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint='+position.value.latitude+','+position.value.longitude+'&heading='+(position.value.course || 0)+'&pitch=10&fov=80';

  if (navigator.share) {
    navigator.share({
      title: device.value?.name || 'Device',
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

    messageSuccess(KT('device.copiedToClipboard'));
  }

}

// Position computed otimizado - usa deviceId diretamente para evitar recálculos
const position = computed(() => {
  return deviceId.value ? store.getters['devices/getPosition'](deviceId.value) : null;
});


const getFavorites = (position) => {
  let tmp = [];
  store.getters.getDeviceAttributes.forEach((f)=>{
      const value = findAttribute(position,f.id);

      if(value!==null){
        tmp.push({name: f.id, value: value,type: f.type});
      }
  })

  return tmp;
}

const getAttributes = (position)=>{
  let tmp = [];

  for(const k of Object.keys(position)){
    if(k==='attributes'){
      for(const kk of Object.keys(position.attributes)){


        if(position['attributes'][kk]!==null && !store.getters.getDeviceAttributes.find((a)=> a.id ==='attributes.'+kk)) {

          tmp.push({name: kk, value: position['attributes'][kk]});
        }
      }
    }else {
      if(position[k]!==null  && !store.getters.getDeviceAttributes.find((a)=> a.id === k)) {
        tmp.push({name: k, value: position[k]});
      }
    }
  }


  return tmp;
}


const findAttribute = (position, a) => {
  if (!position || !a) return null;
  
  // Implementação segura sem eval - suporta nested paths (ex: "attributes.speed")
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };
  
  // Primeiro tenta em position.attributes
  let result = position.attributes?.[a];
  
  // Se não encontrar, tenta caminho aninhado em attributes
  if (result === undefined || result === null) {
    result = getNestedValue(position.attributes, a);
  }
  
  // Se ainda não encontrar, tenta diretamente em position
  if (result === undefined || result === null) {
    result = position[a];
  }
  
  // Por fim, tenta caminho aninhado em position
  if (result === undefined || result === null) {
    result = getNestedValue(position, a);
  }

  return result;
}

const actFav = (evt,id,add)=>{

  if(store.state.auth.administrator && !add) {
      const findAttr = store.getters.getDeviceAttributes.find((a)=> a.id === id);
      if(findAttr.type==='server'){
        store.dispatch("pinServer", [id,false]);
      }else{
        store.dispatch("pinUser", [id,false]);
      }


  }else if(store.state.auth.administrator) {
    let commands = [];
    commands.push({
      text: KT('server.server'), cb: () => {
        store.dispatch("pinServer", [id,add]);
      }
    });
    commands.push({
      text: KT('user.user'), cb: () => {
        store.dispatch("pinUser", [id,add]);

      }
    });


    contextOpenRef.value.openMenu({evt: evt, menus: commands})
  }else{
    store.dispatch("pinUser", [id,add]);
  }



}




const actAnchorWithModal = async (deviceId) => {
  const targetDevice = store.getters['devices/getDevice'](deviceId);
  const isAnchored = store.getters['geofences/isAnchored'](deviceId);
  
  const actionType = isAnchored ? 'anchor_disable' : 'anchor_enable';
  
  // Emitir evento para abrir modal centralizado
  window.dispatchEvent(new CustomEvent('openAnchorModal', { 
    detail: { device: targetDevice, command: { type: actionType } } 
  }));
};

const openDeleteModal = () => {
  // Emitir evento para abrir modal de eliminación con slider
  window.dispatchEvent(new CustomEvent('openDeleteModal', { 
    detail: { device: device.value, command: { type: 'delete_device' } } 
  }));
};


const goToReport = (index = null) => {
  let startDate, endDate;

  if (index !== null) {
    // Obtener la fecha del período específico tocado
    const segment = historyInfo.value[index];
    
    // Crear fechas usando el timestamp (mantiene la zona horaria local)
    startDate = new Date(segment.start);
    
    // Si tenemos end, usarlo, sino calcular con la duración
    if (segment.end) {
      endDate = new Date(segment.end);
    } else {
      // Si no hay end, calcular aproximadamente desde la duración
      const endTime = segment.start + segment.duration;
      endDate = new Date(endTime);
    }
  } else {
    // Si se presiona el botón sin seleccionar un segmento, se toma el período completo
    if (historyInfo.value.length > 0) {
      // Primer segmento (inicio)
      startDate = new Date(historyInfo.value[0].start);
      
      // Último segmento (fin)
      const lastSegment = historyInfo.value[historyInfo.value.length - 1];
      if (lastSegment.end) {
        endDate = new Date(lastSegment.end);
      } else {
        const endTime = lastSegment.start + lastSegment.duration;
        endDate = new Date(endTime);
      }
    } else {
      // Si no hay datos, usar hora actual
      const now = new Date();
      startDate = new Date(now.getTime() - 3600000); // 1 hora atrás
      endDate = now;
    }
  }

  // Formatear las fechas para mantener la zona horaria local
  const formatLocalDate = (date) => {
    const pad = (num) => num.toString().padStart(2, '0');
    
    // YYYY-MM-DDTHH:MM:SS
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  
  const start = formatLocalDate(startDate);
  const end = formatLocalDate(endDate);
  
  console.log("Navegando al segmento con horario local:", start, "hasta", end);
  
  router.push({
    path: '/reports/history',
    query: {
      deviceId: device.value.id,
      from: start,
      to: end,
      type: '%'
    }
  });
};

const actResetOdometer = async (id)=>{
  ElMessageBox.confirm(
      'Deseja realmente zerar o consumo do dispositivo '+device.value.name+ '?',
      'Warning',
      {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancelar',
        type: 'warning',
      }
  ).then(()=>{

  // eslint-disable-next-line no-undef
      let tmp = JSON.parse(JSON.stringify(defaultDeviceData));
    
      const deviceData = store.getters['devices/getDevice'](id);

       // eslint-disable-next-line no-undef
      for(let k of Object.keys(defaultDeviceData)){
        if(k==='attributes') {
          tmp[k] = (deviceData[k] === null) ? {} : JSON.parse(JSON.stringify(deviceData[k]));
        }else {
          tmp[k] = (deviceData[k] === null) ? null : deviceData[k];
        }
      }



      const position = store.getters['devices/getPosition'](id);

      tmp.attributes['zeroOdometer'] = position.attributes.totalDistance;
      
      store.dispatch("devices/save", tmp).then(() => {
          
          notifySuccess(KT('device.updatedSuccessfully'));
      });
  });

}

const actBlock = async ()=>{
  if (!device.value || device.value.status === 'offline') {
    if (device.value?.status === 'offline') {
      messageWarning(KT('device.offlinePendingCommand'));
    }
  }
  
  // Emitir evento para abrir modal centralizado
  window.dispatchEvent(new CustomEvent('openBlockModal', { 
    detail: { device: device.value, command: { type: 'engineStop' } } 
  }));
};


const actUnlock = async ()=>{
  if (!device.value || device.value.status === 'offline') {
    if (device.value?.status === 'offline') {
      messageWarning(KT('device.offlinePendingCommand'));
    }
  }
  
  // Emitir evento para abrir modal centralizado
  window.dispatchEvent(new CustomEvent('openUnlockModal', { 
    detail: { device: device.value, command: { type: 'engineResume' } } 
  }));
};



const showExternal = (e)=>{



  let shareOpen = [];

  shareOpen.push({
    text: KT('device.openMaps'),
    cb: () => {
      if (!position.value?.latitude || !position.value?.longitude) {
        console.warn('[openShareContext] Position sem coordenadas');
        messageError(KT('device.positionNotAvailable'));
        return;
      }

      const elm = document.createElement("a");
      elm.target = "_blank";
      elm.href = 'http://maps.google.com/maps?q=loc:' + position.value.latitude + "," + position.value.longitude;
      document.body.appendChild(elm);
      elm.click();
      document.body.removeChild(elm);

    }
  });


  shareOpen.push({
    text: KT('device.openStreet'),
    cb: () => {
      if (!position.value?.latitude || !position.value?.longitude) {
        console.warn('[openShareContext] Position sem coordenadas');
        messageError(KT('device.positionNotAvailable'));
        return;
      }

      const link = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + position.value.latitude + ',' + position.value.longitude + '&heading=' + (position.value.course || 0) + '&pitch=10&fov=80';


      const elm = document.createElement("a");
      elm.target = "_blank";
      elm.href = link;
      document.body.appendChild(elm);
      elm.click();

    }


  });

  contextOpenRef.value.openMenu({evt: e, menus: shareOpen})


}


// ========================
// LIFECYCLE HOOKS - CLEANUP
// ========================

// Kill switch no beforeUnmount
onBeforeUnmount(() => {
  // OBSERVABILITY: Parar Resource Monitor antes do cleanup
  stopResourceMonitor();
  cleanupAll('unmount');
});

// Kill switch no beforeRouteLeave (navegação Vue Router)
onBeforeRouteLeave((to, from, next) => {
  cleanupAll('route-leave');
  next();
});

// Watch deviceId - cleanup ao mudar de device
watch(
  () => deviceId.value,
  (newId, oldId) => {
    if (oldId && newId !== oldId) {
      console.debug('[watch deviceId] Mudança detectada:', oldId, '->', newId);
      
      // 🔧 FIX: Resetar selectedDriver ao trocar device
      selectedDriver.value = null;
      showDriverModal.value = false;
      
      cleanupAll('device-change');
    }
  },
  { immediate: false }
);

// Wrappers para dual camera (usando composable)
const toggleDualCameraView = () => {
  toggleDual();
};

const selectCameraWrapper = () => {
  selectCamera(device.value, position.value);
};

const showCameraOptions = (e) => {
  if (!device.value) {
    console.warn('[showCameraOptions] Device não disponível');
    return;
  }
  
  let options = [];
  
  options.push({
    text: KT('device.internalCamera'),
    cb: () => {
      if (!device.value) {
        console.warn('[showCameraOptions] Device null ao abrir câmera interna');
        return;
      }
      videoPlayer.openVideo({
        deviceId: device.value.id,
        uniqueId: device.value.uniqueId,
        protocol: position.value?.protocol,
        channel: 'IN'
      });
    }
  });
  
  options.push({
    text: KT('device.externalCamera'),
    cb: () => {
      if (!device.value) {
        console.warn('[showCameraOptions] Device null ao abrir câmera externa');
        return;
      }
      videoPlayer.openVideo({
        deviceId: device.value.id,
        uniqueId: device.value.uniqueId,
        protocol: position.value?.protocol,
        channel: 'OUT'
      });
    }
  });
  
  options.push({
    text: KT('device.streetview'),
    cb: () => {
      store.dispatch('devices/toggleStreet');
    }
  });
  
  contextOpenRef.value.openMenu({evt: e, menus: options});
};

const actContext = async (e) => {
  if (!store.getters.advancedPermissions(12)) {
    return false;
  }

  const deviceId = parseInt(route.params.deviceId);
  let commands = [];

  // Buscar comandos de tipo
  const typeCommandsResponse = await safeTraccarCall('getTypeCommands', (t) => t.getTypeCommands(deviceId));
  if (!typeCommandsResponse) return;

  const availableTypesCommand = typeCommandsResponse.data || [];

  availableTypesCommand.forEach((c) => {
    commands.push({
      text: KT('actions.' + c.type),
      cb: async () => {
        const result = await safeTraccarCall('sendCommand:type', (t) => t.sendCommand({ deviceId: deviceId, type: c.type }));
        if (result) notifySuccess(KT('device.command_sent'));
      }
    });
  });

  // Buscar comandos salvos
  const availableCommandsResponse = await safeTraccarCall('getAvailableCommands', (t) => t.getAvailableCommands(deviceId));
  if (!availableCommandsResponse) return;

  const availableSaved = availableCommandsResponse.data || [];

  if (commands.length > 0 && availableSaved.length > 0) {
    commands.push({ text: 'separator' });
  }

  availableSaved.forEach((c) => {
    // Usar eventos para comandos de bloqueo/desbloqueo
    if (c.type === 'engineStop' || c.description.toLowerCase().includes('bloquear')) {
      commands.push({
        text: c.description,
        cb: () => {
          window.dispatchEvent(new CustomEvent('openBlockModal', {
            detail: { device: device.value, command: c }
          }));
        }
      });
    } else if (c.type === 'engineResume' || c.description.toLowerCase().includes('desbloquear')) {
      commands.push({
        text: c.description,
        cb: () => {
          window.dispatchEvent(new CustomEvent('openUnlockModal', {
            detail: { device: device.value, command: c }
          }));
        }
      });
    } else {
      commands.push({
        text: c.description,
        cb: async () => {
          const result = await safeTraccarCall('sendCommand:saved', (t) => t.sendCommand({ ...c, deviceId: deviceId }));
          if (result) notifySuccess(KT('device.command_sent'));
        }
      });
    }
  });

  contextOpenRef.value.openMenu({ evt: e, menus: commands });
}



const loadHistoryInfo = async (deviceId) => {
  const intervalo = (3600000 * EVENTS_INTERVAL_HOURS);
  const now = new Date().getTime();
  const inicio = new Date(now - intervalo);
  const fim = new Date();

  historyInfo.value = [];
  eventsInfo.value = [];

  if (store.getters['server/getAttribute']('tarkan.enableStops', false)) {
    const routeResult = await safeTraccarCall('loadRoute', (t) => t.loadRoute(deviceId, inicio, fim, false));
    if (routeResult && routeResult.data) {
      let tmp = { start: null, end: null, duration: 0, position: 0, width: 0, motion: false, ignition: false, blocked: false };
      routeResult.data.forEach((p, k) => {
        if (tmp.motion != p.attributes.motion || k >= (routeResult.data.length - 1)) {
          if (tmp.start != null) {
            tmp.position = ((tmp.start - inicio.getTime()) * 100) / intervalo;
            tmp.end = (k >= (routeResult.data.length - 1)) ? fim.toISOString() : p.fixTime;
            tmp.width = (((((k >= (routeResult.data.length - 1)) ? fim.getTime() : new Date(p.fixTime).getTime()) - inicio.getTime()) * 100) / intervalo) - tmp.position;
            tmp.duration = ((k >= (routeResult.data.length - 1)) ? fim.getTime() : new Date(p.fixTime).getTime()) - tmp.start;
            historyInfo.value.push(JSON.parse(JSON.stringify(tmp)));
          }
          tmp.motion = p.attributes.motion;
          tmp.start = new Date(p.fixTime).getTime();
        }
      });
    }
  }

  if (store.getters['server/getAttribute']('tarkan.enableEvents', false)) {
    const eventsResult = await safeTraccarCall('getReportEvents:history', (t) => 
      t.getReportEvents([deviceId], [], new Date(inicio).toISOString(), new Date(fim).toISOString(), false)
    );
    if (eventsResult && eventsResult.data) {
      eventsInfo.value = eventsResult.data.reverse();
    }
  }
}

// Função para carregar os eventos mais recentes
const loadEventsInfo = async (deviceId) => {
  if (!deviceId || !store.getters['server/getAttribute']('tarkan.enableEvents', false)) return;

  // APM: Track events fetch (fail-safe)
  const span = safeSpanStart(obsSpans.eventsFetch, deviceId);
  const t0 = DEBUG_PERF ? performance.now() : 0;

  try {
    const intervalo = (3600000 * EVENTS_INTERVAL_HOURS);
    const now = new Date().getTime();
    const inicio = new Date(now - intervalo);
    const fim = new Date();

    const eventsResult = await safeTraccarCall('getReportEvents:load', (t) => 
      t.getReportEvents([deviceId], [], new Date(inicio).toISOString(), new Date(fim).toISOString(), false)
    );
    if (eventsResult && eventsResult.data) {
      eventsInfo.value = eventsResult.data.reverse();
      span.end({ eventCount: eventsInfo.value.length });
      
      // PERF: Medir tempo total e logar
      if (DEBUG_PERF) {
        const dt = performance.now() - t0;
        console.debug(`[PERF] loadEventsInfo: ${dt.toFixed(2)}ms | count=${eventsInfo.value.length}`);
      }
    } else {
      span.end({ eventCount: 0 });
    }
  } catch (error) {
    span.error(error);
    throw error;
  }
}

watch(()=> route.params.deviceId,()=>{
  const deviceId = route.params.deviceId;
  const tmp = store.getters['devices/getDevice'](parseInt(deviceId));
  if(tmp) {
    testImage(tmp, uncache.value);
    loadHistoryInfo(parseInt(deviceId));
    flyToDevice(tmp);
    
    // CRÍTICO: Forçar recálculo do mapa ao trocar de device
    nextTick(() => {
      if (window.$map?.invalidateSize) {
        window.$map.invalidateSize(true);
      }
    });
  }
});

// Watch consolidado para position - actualiza eventos y imagen con debounce
watch(() => position.value, (newPos, oldPos) => {
  // Proteção: se não houver posição, sair
  if (!newPos) return;
  
  const deviceId = route.params.deviceId;
  
  // Verificar si hay cambios significativos
  const hasSignificantChange = !oldPos ||
    newPos?.fixTime !== oldPos?.fixTime ||
    newPos?.deviceTime !== oldPos?.deviceTime;
  
  // Actualizar lista de eventos (sem debounce - é rápido)
  if (deviceId && hasSignificantChange) {
    loadEventsInfo(parseInt(deviceId));
  }
  
  // Atualizar imagem APENAS se:
  // 1) Não está processando salida
  // 2) Mesmo device
  // 3) Respeitando limite de 5s entre refreshes
  if (!isProcessingSalida.value && 
      newPos && 
      oldPos && 
      newPos.deviceId === oldPos.deviceId) {
    
    const now = Date.now();
    const deviceStateKey = `${newPos.deviceId}_${device.value?.attributes?.hasImage}_${device.value?.status}`;
    
    // Verificar se já processamos recentemente
    if (lastProcessedDeviceState !== deviceStateKey && (now - lastImageLoadTime) >= 5000) {
      console.log('🔄 Position actualizada, refrescando imagen con debounce 5s...', newPos.deviceId);
      
      // Cancelar timer anterior
      if (positionImageRefreshTimer) {
        clearSafeTimeout(positionImageRefreshTimer);
      }
      
      // Novo timer com debounce
      positionImageRefreshTimer = setSafeTimeout(() => {
        uncache.value = new Date().getTime();
        if (device.value) {
          testImage(device.value, uncache.value);
        }
        positionImageRefreshTimer = null;
      }, 300); // debounce curto para agrupar mudanças rápidas
    } else {
      console.log('⏭️ Saltando refresh position - processado recentemente ou bloqueado');
    }
  }
}, { deep: true });



watch(()=> route.query.edit,(a)=>{
  if(a){
    openEdit();
  }
})

// Watcher para actualizar imágenes de drivers cuando cambie la lista
watch(() => store.state.drivers?.driverList, () => {
  driverImageRefreshKey.value = new Date().getTime();
})

// Watcher para recargar drivers cuando aparezca un nuevo driverUniqueId
watch(() => position.value?.attributes?.driverUniqueId, (newDriverId, oldDriverId) => {
  if (newDriverId && newDriverId !== oldDriverId) {
    // Buscar si el driver existe en el store
    const driver = store.getters['drivers/getDriverByUniqueId'](newDriverId);
    if (!driver) {
      // Si no existe, recargar la lista de drivers
      console.log('🔄 Nuevo driver detectado, recargando lista...', newDriverId);
      store.dispatch('drivers/load').then(() => {
        console.log('✅ Lista de drivers actualizada');
        driverImageRefreshKey.value = new Date().getTime();
      }).catch(err => {
        console.error('❌ Error al recargar drivers:', err);
      });
    }
  }
})

// Watcher para hasImage - consolidado com proteção e debounce
watch(() => device.value?.attributes?.hasImage, (newHasImage, oldHasImage) => {
  // Proteção: não executar durante processamento de salida
  if (isProcessingSalida.value) {
    console.log('⏸️ Saltando watch de hasImage - procesando salida');
    return;
  }
  
  // Só processar se houve mudança real
  if (newHasImage !== oldHasImage && device.value) {
    const now = Date.now();
    
    // Respeitar limite de 5s entre refreshes
    if ((now - lastImageLoadTime) >= 5000) {
      console.log('🔄 hasImage cambió, refrescando imagen con debounce...', device.value.id);
      
      // Cancelar timeout anterior
      if (imageLoadDebounceTimer) {
        clearSafeTimeout(imageLoadDebounceTimer);
      }
      
      // Aplicar debounce
      imageLoadDebounceTimer = setSafeTimeout(() => {
        uncache.value = new Date().getTime();
        if (device.value) {
          testImage(device.value, uncache.value);
        }
        imageLoadDebounceTimer = null;
      }, IMAGE_DEBOUNCE_DELAY_MS);
    } else {
      console.log('⏭️ Saltando hasImage watch - refresh recente');
    }
  }
})


// Función simple para refresh
const simpleRefresh = (deviceId) => {
  console.log('🔧 Refresh simple para device:', deviceId);
  uncache.value = new Date().getTime();
  if (device.value) {
    testImage(device.value, uncache.value);
  }
};

// Watcher específico para status - com limpeza adequada de timers
watch(() => device.value?.status, (newStatus, oldStatus) => {
  if (newStatus !== oldStatus && device.value?.id) {
    console.log('🔄 Status del device cambió:', { old: oldStatus, new: newStatus, deviceId: device.value.id });
    
    // Limpar todos os timers anteriores de status change
    statusChangeTimers.forEach(timer => clearSafeTimeout(timer));
    statusChangeTimers = [];
    
    // Si cambió a available (salida), usar estrategia especial anti-cache
    if (newStatus === 'available' && oldStatus === 'occupied') {
      console.log('🧹 Device liberado - forzando imagen de categoría');
      
      // Activar bandera para bloquear otros watchers
      isProcessingSalida.value = true;
      console.log('🚫 BLOQUEANDO OTROS WATCHERS DURANTE SALIDA');
      
      // Resetar estado de cache
      lastProcessedDeviceState = null;
      lastImageLoadTime = 0;
      
      console.log('🧹 INICIANDO LIMPIEZA COMPLETA DE CACHE PARA SALIDA');
      
      // Paso 1: Limpiar imagen actual
      imageUrl.value = '';
      
      const timer1 = setSafeTimeout(() => {
        // Paso 2: Forzar imagen en blanco para romper cache
        imageUrl.value = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=';
        console.log('🧽 Cache limpiado con imagen vacía');
        
        const timer2 = setSafeTimeout(() => {
          // Paso 3: Imagen de categoría con cache-buster extremo
          const extremeForce = Date.now() + '_' + Math.random() + '_' + performance.now() + '_' + Math.floor(Math.random() * 999999);
          const categoryUrl = '/tarkan/assets/images/categories/'+((device.value?.category)?device.value.category:'default')+'.png?extreme=' + extremeForce;
          imageUrl.value = categoryUrl;
          console.log('🚁 SALIDA - Imagen de categoría EXTREMA:', categoryUrl);
          
          // Desactivar bandera después de completar (tiempo extendido)
          const timer3 = setSafeTimeout(() => {
            isProcessingSalida.value = false;
            console.log('✅ WATCHERS DESBLOQUEADOS - SALIDA COMPLETADA');
            // Limpar referências após conclusão
            statusChangeTimers = statusChangeTimers.filter(t => t !== timer1 && t !== timer2 && t !== timer3);
          }, STATUS_CHANGE_STABILITY_MS);
          statusChangeTimers.push(timer3);
        }, 200);
        statusChangeTimers.push(timer2);
      }, 100);
      statusChangeTimers.push(timer1);
      
    } else {
      // Para entradas: refresh simple com debounce
      console.log('🔄 Entrada detectada - refresh simple');
      
      const now = Date.now();
      if ((now - lastImageLoadTime) >= 5000) {
        const timer = setSafeTimeout(() => {
          if (device.value?.id) {
            simpleRefresh(device.value.id);
          }
          statusChangeTimers = statusChangeTimers.filter(t => t !== timer);
        }, 1000);
        statusChangeTimers.push(timer);
      } else {
        console.log('⏭️ Saltando entrada refresh - processado recentemente');
      }
    }
  }
})



const openEdit = ()=>{


  editDeviceRef.value.editDevice(device.value.id);
}

const openCommandModal = () => {
  console.log('openCommandModal llamado con device:', device.value);
  commandModalOpen.value = true;
}


const openQrCode = ()=>{


  qrDeviceRef.value.editDevice(device.value.id);
}

// eslint-disable-next-line no-unused-vars
const doDelete = ()=>{
   ElMessageBox.confirm(KT('device.question_del1'),KT('device.question_del2')).then(()=>{
    // Proceder con la eliminación del dispositivo
    store.dispatch("devices/delete", device.value.id).then(() => {

      notifyInfo(KT('device.deviceDeleted'));

      router.push('/devices');
    }).catch(()=>{ 
      notifyError(KT('device.error_device_del'));
    });
  });
}

//import axios from 'axios';

const uncache = ref(new Date().getTime());
const driverImageRefreshKey = ref(new Date().getTime());

// Control de debounce y timers para cancelación adecuada
let imageLoadDebounceTimer = null;
let lastImageLoadTime = 0;
let lastProcessedDeviceState = null;
let positionImageRefreshTimer = null;
let statusChangeTimers = [];

// Modal del motorista
const showDriverModal = ref(false);
const selectedDriver = ref(null);
const isGeneratingPDF = ref(false);

// Funciones específicas para el modal del driver
const isDriverExpiredForModal = (driver) => {
  if (!driver || !driver.attributes || !driver.attributes.cnhValidity) return false;
  return isDriverExpired(driver.attributes.cnhValidity);
}

const formatDriverDateForModal = (dateString) => {
  if (!dateString) return null;
  // Usar la misma lógica que el tooltip que ya funciona
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    return date.toLocaleDateString('pt-BR');
  }
  return dateString;
}

const openDriverModal = (driver = null) => {
  // Se driver foi passado diretamente (pelo componente), usa ele
  if (driver) {
    selectedDriver.value = driver;
    showDriverModal.value = true;
    return;
  }
  
  // Fallback: buscar pelo position (compatibilidade com chamadas antigas)
  if (!position.value?.attributes?.driverUniqueId) {
    console.warn('[openDriverModal] Position ou driverUniqueId não disponível');
    return;
  }
  
  try {
    const fullDriver = store.getters['drivers/getDriverByUniqueId'](position.value.attributes.driverUniqueId);
    if (fullDriver) {
      selectedDriver.value = fullDriver;
      showDriverModal.value = true;
    } else {
      console.warn('[openDriverModal] Driver não encontrado:', position.value.attributes.driverUniqueId);
    }
  } catch (error) {
    console.warn('[openDriverModal] Erro ao buscar driver:', error);
  }
}

const closeDriverModal = () => {
  showDriverModal.value = false;
  selectedDriver.value = null;
}

// Función para generar PDF del motorista individual usando la misma lógica de edit-drivers.vue
const generateDriverPDF = async () => {
  if (!selectedDriver.value || isGeneratingPDF.value) return;
  
  isGeneratingPDF.value = true;
  
  try {
    notifyInfo(KT('driver.openingReport'));
    await generateSingleDriverPDF();
  } catch (error) {
    console.error('Error generating PDF:', error);
    messageError(KT('driver.errorGeneratingReport'));
  } finally {
    // Sempre resetar após um delay para UX suave, mas garantir que sempre reseta
    setSafeTimeout(() => {
      isGeneratingPDF.value = false;
    }, 1500);
  }
};

// Generar PDF para un solo driver
const generateSingleDriverPDF = async () => {
  const htmlContent = generateSingleDriverReportHTML();
  
  let printWindow = null;
  try {
    printWindow = window.open('', '_blank', 'width=800,height=600');
  } catch (e) {
    console.error('Error opening print window:', e);
    throw new Error('popup_open_failed');
  }
  
  if (!printWindow) {
    messageError(KT('driver.popupBlocked'));
    throw new Error('popup_blocked');
  }
  
  try {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setSafeTimeout(() => {
      try {
        printWindow.print();
      } catch (e) {
        console.warn('Print dialog error (user may have closed window):', e);
      }
    }, 1000);
  } catch (error) {
    console.error("Error writing to print window:", error);
    // Tentar fechar a janela se algo deu errado
    try { printWindow.close(); } catch (e) { /* ignore */ }
    throw error;
  }
};

// HTML para reporte individual del motorista
const generateSingleDriverReportHTML = () => {
  if (!selectedDriver.value) {
    console.warn('[generateSingleDriverReportHTML] selectedDriver é null');
    return '<html><body><h1>Erro: Driver não selecionado</h1></body></html>';
  }
  
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const currentTime = new Date().toLocaleTimeString('pt-BR');
  const driver = selectedDriver.value;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${KT('driver.driverReport')}</title>
        <style>
            @page { margin: 20mm; }
            body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 0;
                font-size: 12px;
                line-height: 1.4;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }
            .header h1 { 
                color: #333; 
                margin: 0 0 10px 0;
                font-size: 24px;
                font-weight: bold;
            }
            .header .subtitle {
                color: #666;
                font-size: 14px;
            }
            .driver-photo {
                text-align: center;
                margin: 20px 0;
            }
            .driver-photo img {
                max-width: 150px;
                max-height: 150px;
                border-radius: 8px;
                border: 2px solid #ddd;
            }
            .driver-info {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .driver-info th,
            .driver-info td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }
            .driver-info th {
                background-color: #f5f5f5;
                font-weight: bold;
                width: 30%;
            }
            .status-valid { color: #16a34a; font-weight: bold; }
            .status-expired { color: #dc2626; font-weight: bold; }
            .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 10px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 10px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${KT('driver.driverReport')}</h1>
            <div class="subtitle">${KT('driver.generatedOn')} ${currentDate} ${KT('driver.at')} ${currentTime}</div>
        </div>

        <div class="driver-photo">
            <img src="/tarkan/assets/images/drivers/${driver.id}.png?v=${driverImageRefreshKey.value}" 
                 onerror="this.src='/tarkan/assets/images/drivers/default.png'" 
                 alt="${driver.name}" />
        </div>

        <table class="driver-info">
            <tr>
                <th>${KT('driver.name')}</th>
                <td>${driver.name || KT('driver.notInformed')}</td>
            </tr>
            <tr>
                <th>${KT('driver.uniqueId')}</th>
                <td>${driver.uniqueId || KT('driver.notInformed')}</td>
            </tr>
            <tr>
                <th>${KT('driver.license')}</th>
                <td>${driver.attributes?.cnhNumber || KT('driver.notInformed')}</td>
            </tr>
            <tr>
                <th>${KT('driver.cpf')}</th>
                <td>${driver.attributes?.cpf || KT('driver.notInformed')}</td>
            </tr>
            <tr>
                <th>${KT('driver.cnhCategory')}</th>
                <td>${driver.attributes?.cnhCategory || KT('driver.notInformed')}</td>
            </tr>
            <tr>
                <th>${KT('driver.cnhState')}</th>
                <td>${driver.attributes?.state || KT('driver.notInformed')}</td>
            </tr>
            <tr>
                <th>${KT('driver.birthDate')}</th>
                <td>${formatDriverDateForModal(driver.attributes?.birthDate) || KT('driver.notInformed')}</td>
            </tr>
            <tr>
                <th>${KT('driver.firstLicenseDate')}</th>
                <td>${formatDriverDateForModal(driver.attributes?.firstLicenseDate) || KT('driver.notInformed')}</td>
            </tr>
            <tr>
                <th>${KT('driver.expiryDate')}</th>
                <td class="${isDriverExpiredForModal(driver) ? 'status-expired' : 'status-valid'}">
                    ${formatDriverDateForModal(driver.attributes?.cnhValidity) || KT('driver.notInformed')}
                    ${isDriverExpiredForModal(driver) ? ' (' + KT('driver.expired') + ')' : ''}
                </td>
            </tr>
            <tr>
                <th>${KT('driver.phone')}</th>
                <td>${driver.attributes?.phone || KT('driver.notInformed')}</td>
            </tr>
            <tr>
                <th>${KT('driver.cnhFiliation')}</th>
                <td>${driver.attributes?.cnhFiliation || KT('driver.notInformed')}</td>
            </tr>
            ${driver.attributes?.cnhObservations ? `
            <tr>
                <th>${KT('driver.cnhObservations')}</th>
                <td>${driver.attributes.cnhObservations}</td>
            </tr>
            ` : ''}
            <tr>
                <th>${KT('driver.status')}</th>
                <td class="${isDriverExpiredForModal(driver) ? 'status-expired' : 'status-valid'}">
                    ${isDriverExpiredForModal(driver) ? KT('driver.expired') : KT('driver.valid')}
                </td>
            </tr>
        </table>

        <div class="footer">
            ${KT('driver.reportGenerated')} - ${currentDate} ${currentTime}
        </div>
    </body>
    </html>
  `;
}

const currentTime = ref(new Date());

// Calcular si la diferencia entre fixTime y deviceTime es mayor a 3 horas
const isOlderThan3Hours = computed(() => {
  if (!position.value?.fixTime || !position.value?.deviceTime) {
    return false;
  }
  
  try {
    const fixTime = new Date(position.value.fixTime);
    const deviceTime = new Date(position.value.deviceTime);
    const diffInHours = (deviceTime - fixTime) / (1000 * 60 * 60); // Diferencia en horas
    return diffInHours > 3;
  } catch (error) {
    console.warn('[isOlderThan3Hours] Erro ao calcular diferença de tempo:', error);
    return false;
  }
});

// Verificar si el dispositivo usa protocolo JC4XX o JC2XX
const isCameraProtocol = computed(() => {
  if (!device.value || !position.value || !position.value.protocol) {
    return false;
  }
  
  try {
    const protocol = position.value.protocol.toLowerCase();
    return protocol.includes('jc4') || protocol.includes('jc2');
  } catch (error) {
    console.warn('[isCameraProtocol] Erro ao verificar protocolo:', error);
    return false;
  }
});

// Funciones de ejemplo para los eventos de mouse







</script>

<style scoped>

  #kr-actions .el-button{
    width: 40px;
    padding: 0px;
  }

  .device{
    border: var(--el-border-color-light) 1px solid;
    border-radius: 5px;
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    text-align: center;
  }

  .device .name{
    border-bottom: var(--el-border-color-light) 1px dotted;
    font-size: 18px;
    padding: 5px;
    font-weight: bold;

  }

  .icons{
    display: flex;
    justify-content: center;
  }

  .icons div{
    display: flex;
    justify-content: center;
    flex: 1;
    border-bottom: var(--el-border-color-light) 1px dotted;
    border-right: var(--el-border-color-light) 1px dotted;
    padding: 7px;
    font-size: 11px;
  }
  .icons div i{
    font-size: 16px;
  }

  .icons div:last-child{
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
    color: var(--el-text-color-regular);
  }

  .subtitle i{
    font-size: 12px;
    margin-right: 3px;
  }

  .updated{
    font-size: 12px;
    margin-top: 5px;
    color: var(--el-text-color-secondary);
  }

  .address{
    color: var(--el-color-primary);
    font-size: 15px;
    margin-top: 5px;
    margin-bottom: 5px;
    padding: 10px;
    line-height: 20px;
  }

  .tr1{
    background: var(--el-color-white);
  }

  .tr2{
    background: var(--el-color-info-lighter);
  }


  .resume{
    transition: max-height 0.15s ease;
    max-height: 100vh;
    overflow: hidden;
  }

  .complete{
    max-height: 0vh;
    overflow: hidden;
    transition: max-height 0.15s ease;
  }

  .isAttrComplete .resume{
    max-height: 0vh;
  }

  .isAttrComplete .complete{
    max-height: 2000vh;
  }

  .isAttrComplete .favorites{
    border-top: none !important;
  }

  .device .allBtn{
    transition: all 0.15s;
  }

  .isAttrComplete .allBtn{
    transform: rotate(180deg);
  }

  .favBtn{
    cursor: pointer;
  }

  /* TOOLTIP DRIVER STYLES - Movidos para DeviceDriverCard.vue */

  /* Estilos para modal del motorista */
  .driver-modal .el-dialog__header {
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
    color: white;
    border-radius: 8px 8px 0 0;
    padding: 20px 24px;
  }

  .driver-modal .el-dialog__title {
    color: white;
    font-weight: bold;
    font-size: 18px;
  }

  .driver-modal .el-dialog__body {
    padding: 24px;
  }

  .driver-modal-content {
    padding: 0;
  }

  .driver-modal-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 30px;
    padding: 20px;
    background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
    border-radius: 12px;
    border: 1px solid #e5e7eb;
  }

  .driver-large-photo {
    flex-shrink: 0;
  }

  .driver-large-photo img {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid #1f2937;
    box-shadow: 0 8px 32px rgba(31, 41, 55, 0.2);
  }

  .driver-main-info {
    flex: 1;
  }

  .driver-name {
    font-size: 24px;
    font-weight: bold;
    color: #111827;
    margin: 0 0 12px 0;
  }

  .driver-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    background: #059669;
    color: white;
  }

  .driver-status-badge.expired {
    background: #dc2626;
  }

  .driver-status-badge i {
    font-size: 10px;
  }

  .driver-details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .detail-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 10px;
    border-left: 4px solid #1f2937;
    transition: all 0.2s ease;
  }

  .detail-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .detail-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1f2937;
    color: white;
    border-radius: 50%;
    font-size: 16px;
    flex-shrink: 0;
  }

  .detail-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail-label {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .detail-value {
    font-size: 16px;
    font-weight: 500;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .driver-modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 16px 0;
  }

  .footer-center {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .footer-right {
    display: flex;
    justify-content: flex-end;
  }

  .driver-modal-footer .el-button {
    min-width: 120px;
  }

  /* Responsive para modal */
  @media (max-width: 768px) {
    .driver-modal .el-dialog {
      width: 95% !important;
      margin: 5vh auto;
    }
    
    .driver-details-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    
    .driver-modal-header {
      flex-direction: column;
      text-align: center;
      gap: 16px;
    }
  }

  .favBtn:hover{
    color: var(--el-color-primary) !important;
  }

  .carImage{
    position: relative;
  }

  .carImage #changeImage{
    position: absolute;
    background: rgba(0,0,0,0.5);
    left: 50%;
    top: 50%;
    padding: 10px;
    color: white;
    transform: translate(-50%,-50%);
    opacity: 0;
    transition: all 0.3s;
    cursor: pointer;
  }

  .carImage:hover #changeImage{
    opacity: 1;
  }

  #uploading{
    position: absolute;
    background: rgba(0,0,0,0.5);
    left: 50%;
    top: 50%;
    padding: 10px;
    color: white;
    transform: translate(-50%,-50%);
    opacity: 1;
    transition: all 0.3s;
    cursor: pointer;
  }








  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Estilos responsive para cámaras - formato ultra wide */
  .camera-container {
    min-height: 130px;
    aspect-ratio: 21/9; /* Formato ultra wide para cámaras */
  }
  
  @media (max-width: 768px) {
    .camera-container {
      min-height: 110px;
    }
  }
  
  @media (max-width: 480px) {
    .camera-container {
      min-height: 90px;
    }
  }
  
  .video-js {
    width: 100%;
    height: 100%;
    outline: none;
    font-size: 10px; /* Esto hace que todos los controles sean más pequeños */
    background-color: #e0e0e0;
  }
  
  .video-js .vjs-control-bar {
    font-size: 0.8em;
    height: 2.2em; /* Control bar más compacto */
    background-color: rgba(43, 51, 63, 0.7);
  }
  
  .video-js .vjs-button {
    width: 2.2em;
    height: 2.2em;
  }

  .video-js .vjs-big-play-button {
    background-color: rgba(0, 0, 0, 0.45);
    border: none;
    border-radius: 50%;
    width: 2em;
    height: 2em;
    line-height: 2em;
    top: 50%;
    left: 50%;
    margin-top: -1em;
    margin-left: -1em;
  }
  
  /* Estilos para la vista de doble cámara */
  .dual-camera-toggle {
    transition: all 0.3s ease;
  }
  
  .dual-camera-toggle:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 6px rgba(0,0,0,0.3);
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
  }
  
  .pulse-animation {
    animation: pulse 1.5s infinite ease-in-out;
  }

  /* Animación específica para botón QR activo */
  @keyframes qr-pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      background-color: #67c23a;
    }
    50% {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(103, 194, 58, 0.6);
      background-color: #85ce61;
    }
    100% {
      transform: scale(1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      background-color: #67c23a;
    }
  }
  
  .el-button.pulse-animation {
    animation: qr-pulse 1.2s infinite ease-in-out;
  }
  
  .el-button.pulse-animation i {
    color: white !important;
  }
  
  .dual-camera-container {
    transition: height 0.3s ease;
  }
  
  /* Botón de cierre de cámaras - pequeño y responsivo */
  .camera-close-btn {
    width: 20px !important;
    height: 20px !important;
    min-width: 20px !important;
    min-height: 20px !important;
    padding: 0 !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
  }
  
  .camera-close-btn i {
    font-size: 10px !important;
    margin: 0 !important;
  }
  
  @media (max-width: 768px) {
    .camera-close-btn {
      width: 18px !important;
      height: 18px !important;
      min-width: 18px !important;
      min-height: 18px !important;
    }
    
    .camera-close-btn i {
      font-size: 9px !important;
    }
  }
  
  @media (max-width: 480px) {
    .camera-close-btn {
      width: 16px !important;
      height: 16px !important;
      min-width: 16px !important;
      min-height: 16px !important;
    }
    
    .camera-close-btn i {
      font-size: 8px !important;
    }
  }

  /* Estilos responsive para botones de acción y sliders */
  @media (max-width: 768px) {
    #kr-actions {
      padding: 0 10px !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
      justify-content: center !important;
    }
    
    #kr-actions .el-button {
      width: 35px !important;
      height: 35px !important;
      min-width: 35px !important;
      font-size: 12px !important;
    }
    
    /* Ajustar sliders de ancora y bloqueo para móviles */
    .el-dialog {
      width: 90vw !important;
      max-width: 400px !important;
      margin: 0 auto !important;
    }
    
    /* Slider lateral - asegurar que no se salga del margen derecho */
    .slide-container {
      width: calc(100% - 20px) !important;
      max-width: 300px !important;
      right: 10px !important;
      left: auto !important;
    }
    
    /* Botón del slider - ajustar para móviles */
    .slide-button {
      min-width: 80px !important;
      max-width: 120px !important;
      font-size: 11px !important;
      padding: 8px 12px !important;
    }
  }
  
  @media (max-width: 480px) {
    #kr-actions {
      padding: 0 5px !important;
      gap: 5px !important;
    }
    
    #kr-actions .el-button {
      width: 30px !important;
      height: 30px !important;
      min-width: 30px !important;
      font-size: 10px !important;
    }
    
    /* Sliders aún más compactos en móviles pequeños */
    .slide-container {
      width: calc(100% - 10px) !important;
      max-width: 250px !important;
      right: 5px !important;
    }
    
    .slide-button {
      min-width: 70px !important;
      max-width: 100px !important;
      font-size: 10px !important;
      padding: 6px 10px !important;
    }
  }

  /* ========================================
     CLASSES UTILITÁRIAS
     ======================================== */
  
  /* Layout */
  .kr-actions-container {
    display: flex;
    justify-content: flex-end;
    align-content: space-between;
  }

  .info-flex {
    display: flex;
  }

  .flex-1 {
    flex: 1;
  }

  .flex-center {
    justify-content: center;
    align-content: center;
    display: flex;
    align-items: center;
  }

  .text-center {
    text-align: center;
  }

  /* Bordas */
  .border-bottom-dotted {
    border-bottom: var(--el-border-color-light) 1px dotted;
  }

  .border-top-dotted {
    border-top: var(--el-border-color-light) 1px dotted;
  }

  .border-right-dotted {
    border-right: var(--el-border-color-light) 1px dotted;
  }

  .border-left-dotted {
    border-left: var(--el-border-color-light) 1px dotted;
  }

  /* Margens */
  .mt-10 {
    margin-top: 10px;
  }

  .mt-20 {
    margin-top: 20px;
  }

  .mb-5 {
    margin-bottom: 5px;
  }

  .mb-10 {
    margin-bottom: 10px;
  }

  .mb-20 {
    margin-bottom: 20px;
  }

  .mr-4 {
    margin-right: 4px;
  }

  /* Padding */
  .p-5 {
    padding: 5px;
  }

  .p-10 {
    padding: 10px;
  }

  /* Texto */
  .text-danger {
    color: red !important;
  }

  /* ========================================
     ICONS STATUS
     ======================================== */

  .icon-status {
    font-size: 1rem;
  }

  .icon-1rem {
    font-size: 1rem;
  }

  .icon-success {
    color: var(--el-color-success);
  }

  .icon-danger {
    color: var(--el-color-danger);
  }

  .icon-warning {
    color: var(--el-color-warning);
  }

  .icon-info {
    color: var(--el-color-info);
  }

  /* ========================================
     STAT LABELS E VALUES
     ======================================== */

  .stat-label {
    text-transform: uppercase;
    font-size: 11px;
    color: var(--el-text-color-regular);
  }

  .stat-label-lg {
    text-transform: uppercase;
    font-size: 15px;
    color: var(--el-text-color-regular);
  }

  .stat-label-sm {
    text-transform: uppercase;
    font-size: 12px;
    color: var(--el-text-color-regular);
  }

  .stat-value-primary {
    font-size: 20px;
    color: var(--el-color-primary);
  }

  .stats-block {
    flex: 1;
  }

  /* ========================================
     ODOMETER DISPLAY
     ======================================== */

  .stat-value-odometer {
    margin-top: 10px;
    margin-bottom: 20px;
    font-size: 13px;
    color: var(--el-color-primary);
    text-align: center;
  }

  .odometer-display {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .odometer-digit {
    background-color: #d3d3d3;
    color: black;
    padding: 2px 5px;
    font-size: .75rem;
    font-weight: bold;
    margin-right: 1px;
    border-radius: 3px;
  }

  .odometer-unit {
    font-size: 1rem;
    color: var(--el-text-color-regular);
    margin-left: 5px;
  }

  /* ========================================
     HOURS DISPLAY
     ======================================== */

  .stat-value-hours {
    margin-top: 10px;
    margin-bottom: 20px;
    color: var(--el-color-primary);
    text-align: center;
    font-size: 13px;
  }

  .stat-value-hours-sm {
    margin-top: 10px;
    margin-bottom: 20px;
    color: var(--el-color-primary);
    text-align: center;
    font-size: 11px;
  }

  .hours-display {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .hours-digit {
    background-color: #e8f4fd;
    color: #1890ff;
    padding: 2px 5px;
    font-size: .75rem;
    font-weight: bold;
    margin-right: 1px;
    border-radius: 3px;
  }

  .hours-digit-sm {
    background-color: #e8f4fd;
    color: #1890ff;
    padding: 1px 3px;
    font-size: .6rem;
    font-weight: bold;
    margin-right: 1px;
    border-radius: 2px;
  }

  .hours-unit {
    font-size: 1rem;
    color: var(--el-text-color-regular);
    margin-left: 5px;
  }

  .hours-unit-sm {
    font-size: .8rem;
    color: var(--el-text-color-regular);
    margin-left: 3px;
  }

  /* ========================================
     SHARE BUTTONS
     ======================================== */

  .subtitle-relative {
    position: relative;
  }

  .share-buttons {
    position: absolute;
    right: 0px;
    top: 0px;
    display: flex;
    margin-right: 10px;
  }

  .share-btn {
    text-align: center;
    padding: 7px;
    border-radius: 5px;
    cursor: pointer;
    border: var(--el-border-color-light) 1px solid;
    margin-right: 2px;
  }

  .share-btn-last {
    margin-right: 0;
  }

  .share-icon {
    margin-right: 1px;
    margin-left: 1px;
  }

  /* ========================================
     ADDRESS FOOTER
     ======================================== */

  .address-footer {
    margin-top: 0;
  }

  .address-footer-text {
    font-size: 10px;
    margin-right: 5px;
    color: #888;
  }

  .address-footer-icon {
    font-size: 10px;
    margin-right: 5px;
  }

  .address-footer-date {
    font-size: 10px;
    margin-right: 5px;
    color: #888;
  }

  .address-footer-date.text-danger {
    color: red;
  }

  /* ========================================
     DRIVER CARD
     ======================================== */

  /* DRIVER CARD STYLES - Movidos para DeviceDriverCard.vue */

  /* ========================================
     DUAL CAMERA STYLES
     ======================================== */

  .dual-camera-selector {
    display: flex;
    width: 100%;
    padding: 4px;
    background: #e8e8e8;
    margin-bottom: 8px;
    border-bottom: var(--el-border-color-light) 1px dotted;
  }

  .dual-camera-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-bottom: 8px;
    border-bottom: var(--el-border-color-light) 1px dotted;
  }

  .camera-header-controls {
    display: flex;
    justify-content: flex-end;
    padding: 4px;
    background: #f0f0f0;
  }

  .camera-titles {
    display: flex;
    width: 100%;
    background: #f0f0f0;
    padding: 4px 8px;
    border-bottom: 1px solid #ddd;
  }

  .camera-title {
    flex: 1;
    text-align: center;
    font-size: 12px;
    font-weight: bold;
  }

  .camera-title-left {
    color: #409EFF;
  }

  .camera-title-right {
    color: #67C23A;
  }

  .cameras-wrapper {
    display: flex;
    width: 100%;
    height: 130px;
    background: #f5f5f5;
    padding: 4px;
  }

  .camera-left {
    flex: 1;
    position: relative;
    margin-right: 4px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }

  .camera-right {
    flex: 1;
    position: relative;
    margin-left: 4px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }

  .camera-inner-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  .camera-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
  }

  .camera-spinner-left {
    border-top-color: #409EFF;
  }

  .camera-spinner-right {
    border-top-color: #67C23A;
  }

  .camera-message {
    color: #333;
    font-size: 13px;
    text-align: center;
  }

  /* Spinner loader for dynamically created elements */
  .camera-spinner-loader {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #409EFF;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
  }

  .camera-message-text {
    color: white;
    font-size: 14px;
    text-align: center;
  }

  .camera-buttons {
    display: flex;
    width: 100%;
    background: #e8e8e8;
    padding: 4px;
  }

  .camera-btn {
    flex: 1;
    height: 32px;
    font-size: 12px;
  }

  .camera-btn-left {
    margin-right: 4px;
  }

  .camera-btn-right {
    margin-left: 4px;
  }

  /* ========================================
     EVENTS SECTION
     ======================================== */

  .events-container {
    margin: 10px;
    border: var(--el-border-color-light) 1px solid;
    border-radius: 5px;
    overflow: hidden;
  }

  .event-list-container {
    max-height: 150px;
    overflow-y: auto;
  }

  .event-item {
    border-top: var(--el-border-color-light) 1px dotted;
    display: flex;
    justify-content: space-between;
  }

  .event-date {
    text-align: right;
    padding: 10px;
    font-size: 10px;
    color: #5b5b5b;
    position: relative;
    width: 70px;
  }

  .event-icon {
    position: absolute;
    width: 20px;
    height: 16px;
    font-size: 14px;
    text-align: center;
    right: -10px;
    top: 50%;
    border-radius: 50%;
    transform: translateY(-50%);
  }

  .event-datetime {
    position: absolute;
    right: 15px;
    top: 50%;
    border-radius: 50%;
    transform: translateY(-50%);
  }

  .event-text {
    padding: 10px;
    font-size: 11px;
    flex: 1;
    text-align: left;
    padding-left: 20px;
  }

  /* ========================================
     HISTORY BAR
     ======================================== */

  .history-bar {
    background: var(--el-border-color-light);
    height: 20px;
    border-radius: 5px;
    margin: 5px 15px 15px;
    overflow: hidden;
    position: relative;
  }

  .history-segment {
    cursor: pointer;
    position: absolute;
    height: 20px;
  }

  .history-segment-motion {
    background: var(--el-color-primary);
  }

  /* ========================================
     ATTRIBUTES / FAVORITES
     ======================================== */

  .attr-row {
    display: flex;
  }

  .attr-name {
    flex: 1;
    border-right: var(--el-border-color-light) .5px dotted;
    padding: 5px;
    font-size: 9px;
    text-align: right;
    line-height: 1.1;
  }

  .attr-value {
    flex: 1;
    padding: 5px;
    max-width: 40%;
    font-size: 9px;
    text-align: left;
    line-height: 1.1;
  }

  .attr-btn {
    text-align: right;
    box-sizing: border-box;
    padding: 5px;
    font-size: 9px;
    width: 50px;
    line-height: 1.2;
  }

  .attr-btn-info {
    color: var(--el-color-info);
  }

  .attr-btn-empty {
    width: 50px;
    text-align: center;
    box-sizing: border-box;
  }

  .expand-btn {
    padding: 5px;
    background: var(--el-color-info-light);
  }

  /* ========================================
     FUEL/TEMPERATURE RESET LINK
     ======================================== */

  .reset-link {
    font-size: 11px;
    color: var(--el-border-color-secondary);
    cursor: pointer;
  }

  /* ========================================
     FUEL/TEMPERATURE SECTION
     ======================================== */

  .fuel-temp-section {
    display: flex;
    border-top: var(--el-border-color-light) 1px dotted;
  }

  .fuel-temp-block {
    flex: 1;
  }

  .mt-20 {
    margin-top: 20px;
  }

  .mb-20 {
    margin-bottom: 20px;
  }

  /* ========================================
     DUAL CAMERA TOGGLE BUTTON
     ======================================== */

  .name-relative {
    position: relative;
  }

  .dual-camera-toggle-btn {
    position: absolute;
    right: 10px;
    top: 5px;
    background: #4caf50;
    border: none;
    cursor: pointer;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .dual-camera-toggle-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 6px rgba(0,0,0,0.3);
  }
</style>