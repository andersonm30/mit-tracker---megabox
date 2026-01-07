/**
 * useDeviceVideoPlayer.js
 * Composable para gerenciar reprodução de vídeo ao vivo via VideoJS + HLS
 * 
 * State Machine: IDLE -> INIT -> WAITING_STREAM -> PLAYING -> ERROR -> IDLE
 */

import { ref, readonly } from 'vue';
import { spans as obsSpans } from '../utils/observability.js';

// ============================================
// CONSTANTES
// ============================================
const POLL_INTERVAL_MS = 3000;           // Intervalo de polling para verificar stream
const MAX_POLL_ATTEMPTS = 20;            // Máximo de tentativas de polling
const VIDEO_LOAD_TIMEOUT_MS = 15000;     // Timeout para carregar vídeo
const VIDEO_BASE_URL = 'https://play.wdns.ws';
const VIDEOJS_CDN = {
  css: 'https://vjs.zencdn.net/7.20.3/video-js.css',
  js: 'https://vjs.zencdn.net/7.20.3/video.min.js'
};

// Estados da state machine
const States = {
  IDLE: 'IDLE',
  INIT: 'INIT',
  WAITING_STREAM: 'WAITING_STREAM',
  PLAYING: 'PLAYING',
  ERROR: 'ERROR'
};

// ============================================
// CACHE GLOBAL DO VIDEOJS
// ============================================
let videojsLoadPromise = null;

/**
 * Carrega VideoJS dinamicamente (apenas uma vez, mesmo com múltiplas chamadas)
 * @returns {Promise<VideoJS>}
 */
const loadVideoJS = () => {
  if (window.videojs) {
    return Promise.resolve(window.videojs);
  }
  
  if (videojsLoadPromise) {
    return videojsLoadPromise;
  }
  
  videojsLoadPromise = new Promise((resolve, reject) => {
    // Cargar CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = VIDEOJS_CDN.css;
    document.head.appendChild(link);
    
    // Cargar script
    const script = document.createElement('script');
    script.src = VIDEOJS_CDN.js;
    script.async = true;
    
    script.onload = () => {
      if (window.videojs) {
        resolve(window.videojs);
      } else {
        reject(new Error('VideoJS loaded but not available'));
      }
    };
    
    script.onerror = () => {
      videojsLoadPromise = null; // Permitir retry
      reject(new Error('Failed to load VideoJS'));
    };
    
    document.head.appendChild(script);
  });
  
  return videojsLoadPromise;
};

// ============================================
// COMPOSABLE
// ============================================
// eslint-disable-next-line no-unused-vars
export function useDeviceVideoPlayer({ store: _store, KT, notify, runtimeApi, createAbortController = null }) {
  // Validar runtimeApi
  if (!runtimeApi) {
    throw new Error('Runtime API não disponível. Recarregue a página.');
  }
  // State
  const state = ref(States.IDLE);
  const isOpen = ref(false);
  const statusText = ref('');
  const channel = ref(null);
  
  // DOM Elements
  let videoContainer = null;
  let videoViewContainer = null;
  let videoSpinner = null;
  let videoMessage = null;
  let videoCloseButton = null;
  let videoPlayerInstance = null;
  
  // Polling & Timers
  let pollingInterval = null;
  let loadTimeout = null;
  let abortController = null;
  let currentAttempts = 0;
  
  // Metadata
  // eslint-disable-next-line no-unused-vars
  let _currentChannel = null;
  // eslint-disable-next-line no-unused-vars
  let _currentUniqueId = null;
  let isInitialized = false;
  
  // ============================================
  // INTERNAL: State Machine Transitions
  // ============================================
  const setState = (newState, message = '') => {
    console.log(`[VideoPlayer] ${state.value} -> ${newState}`, message);
    state.value = newState;
    if (message) {
      statusText.value = message;
    }
  };
  
  // ============================================
  // INTERNAL: DOM Creation
  // ============================================
  const createDOMElements = () => {
    if (isInitialized) return;
    
    // Container principal
    videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.style.cssText = `
      position: fixed;
      right: 0;
      bottom: 0;
      width: 380px;
      height: 310px;
      z-index: 1003;
      background: #222;
      overflow: hidden;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
      border-radius: 5px 0 0 0;
      display: none;
    `;
    
    // Container para video
    videoViewContainer = document.createElement('div');
    videoViewContainer.className = 'video-view-container';
    videoViewContainer.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    `;
    
    // Spinner de carga
    videoSpinner = document.createElement('div');
    videoSpinner.className = 'video-spinner';
    videoSpinner.style.cssText = `
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #409EFF;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    `;
    
    // Mensaje de estado
    videoMessage = document.createElement('div');
    videoMessage.className = 'video-message';
    videoMessage.style.cssText = `
      color: white;
      font-size: 14px;
      text-align: center;
      margin-bottom: 15px;
    `;
    videoMessage.textContent = KT('device.waitingVideo');
    
    // Botón cerrar
    videoCloseButton = document.createElement('button');
    videoCloseButton.className = 'video-close-button';
    videoCloseButton.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      font-size: 14px;
      z-index: 1004;
    `;
    videoCloseButton.innerHTML = '<i class="fas fa-times"></i>';
    videoCloseButton.addEventListener('click', closeVideo);
    
    // Añadir estilos globales para animación
    if (!document.getElementById('videojs-spinner-style')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'videojs-spinner-style';
      styleSheet.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .video-js {
          width: 100%;
          height: 100%;
          outline: none;
        }
        .video-js .vjs-control-bar {
          font-size: 0.8em;
        }
      `;
      document.head.appendChild(styleSheet);
    }
    
    // Montar estructura
    videoViewContainer.appendChild(videoSpinner);
    videoViewContainer.appendChild(videoMessage);
    videoContainer.appendChild(videoViewContainer);
    videoContainer.appendChild(videoCloseButton);
    document.body.appendChild(videoContainer);
    
    isInitialized = true;
  };
  
  // ============================================
  // INTERNAL: Cleanup DOM Elements
  // ============================================
  const removeDOMElements = () => {
    if (videoCloseButton) {
      videoCloseButton.removeEventListener('click', closeVideo);
    }
    
    if (videoContainer && videoContainer.parentNode) {
      videoContainer.parentNode.removeChild(videoContainer);
    }
    
    videoContainer = null;
    videoViewContainer = null;
    videoSpinner = null;
    videoMessage = null;
    videoCloseButton = null;
    isInitialized = false;
  };
  
  // ============================================
  // INTERNAL: Cleanup Timers & Player
  // ============================================
  const cleanupTimers = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      loadTimeout = null;
    }
    
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    
    currentAttempts = 0;
  };
  
  const disposePlayer = () => {
    if (videoPlayerInstance && typeof videoPlayerInstance.dispose === 'function') {
      try {
        videoPlayerInstance.dispose();
      } catch (error) {
        console.warn('[VideoPlayer] Error disposing player:', error);
      }
      videoPlayerInstance = null;
    }
  };
  
  // ============================================
  // INTERNAL: Check Video Availability
  // ============================================
  const checkVideoAvailability = async (channelNum, uniqueId) => {
    const timestamp = Date.now();
    const url = `${VIDEO_BASE_URL}/${channelNum}/${uniqueId}/hls.m3u8?nocache=${timestamp}`;
    
    console.log(`[VideoPlayer] Checking availability: ${url}`);
    
    try {
      // Usa createAbortController do parent (registrado centralmente) ou fallback local
      abortController = createAbortController ? createAbortController() : new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 5000); // 5s timeout
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: abortController.signal
      });
      
      clearTimeout(timeoutId);
      
      const isAvailable = response.ok;
      console.log(`[VideoPlayer] Status: ${response.status}, Available: ${isAvailable}`);
      
      return isAvailable;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[VideoPlayer] Check aborted or timeout');
      } else {
        console.error('[VideoPlayer] Check error:', error);
      }
      return false;
    } finally {
      abortController = null;
    }
  };
  
  // ============================================
  // INTERNAL: Start Polling
  // ============================================
  const startPolling = (channelNum, uniqueId) => {
    setState(States.WAITING_STREAM, KT('device.waitingVideo'));
    currentAttempts = 0;
    
    pollingInterval = setInterval(async () => {
      currentAttempts++;
      
      const message = `${KT('device.waitingVideo')} (${currentAttempts}/${MAX_POLL_ATTEMPTS})`;
      statusText.value = message;
      if (videoMessage) videoMessage.textContent = message;
      
      try {
        const isAvailable = await checkVideoAvailability(channelNum, uniqueId);
        
        if (isAvailable) {
          console.log(`[VideoPlayer] Stream available after ${currentAttempts} attempts`);
          cleanupTimers();
          showPlayer(channelNum, uniqueId);
        } else if (currentAttempts >= MAX_POLL_ATTEMPTS) {
          console.error('[VideoPlayer] Max attempts reached');
          cleanupTimers();
          setState(States.ERROR, KT('device.videoNotAvailableAfterAttempts'));
          
          notify({
            title: KT('device.error'),
            message: KT('device.videoNotAvailable'),
            type: 'error'
          });
        }
      } catch (error) {
        console.error('[VideoPlayer] Polling error:', error);
        if (currentAttempts >= MAX_POLL_ATTEMPTS) {
          cleanupTimers();
          setState(States.ERROR, KT('device.errorCheckingAvailability'));
        }
      }
    }, POLL_INTERVAL_MS);
  };
  
  // ============================================
  // INTERNAL: Show Player
  // ============================================
  const showPlayer = (channelNum, uniqueId) => {
    if (!videoViewContainer || !window.videojs) {
      console.error('[VideoPlayer] Cannot show player: missing container or videojs');
      return;
    }
    
    // Limpiar player anterior
    disposePlayer();
    
    // Limpiar contenedor
    videoViewContainer.innerHTML = '';
    
    const timestamp = Date.now();
    const videoUrl = `${VIDEO_BASE_URL}/${channelNum}/${uniqueId}/hls.m3u8?nocache=${timestamp}`;
    
    console.log(`[VideoPlayer] Initializing player for: ${videoUrl}`);
    
    // Crear elemento de video
    const videoId = `video-player-${Date.now()}`;
    const videoElement = document.createElement('video');
    videoElement.className = 'video-js vjs-default-skin vjs-big-play-centered';
    videoElement.id = videoId;
    videoElement.controls = true;
    videoElement.preload = 'auto';
    videoElement.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('autoplay', '');
    
    // Agregar source
    const sourceElement = document.createElement('source');
    sourceElement.src = videoUrl;
    sourceElement.type = 'application/x-mpegURL';
    videoElement.appendChild(sourceElement);
    
    // Agregar al contenedor
    videoViewContainer.appendChild(videoElement);
    
    try {
      // Inicializar VideoJS
      videoPlayerInstance = window.videojs(videoId, {
        autoplay: true,
        responsive: true,
        fluid: false,
        liveui: true,
        html5: {
          hls: {
            overrideNative: true,
            enableLowInitialPlaylist: true,
          }
        },
        controlBar: {
          playToggle: false,
          volumePanel: {
            inline: true,
            vertical: false
          },
          progressControl: false,
          fullscreenToggle: true,
          remainingTimeDisplay: false
        }
      });
      
      // Timeout para carga
      loadTimeout = setTimeout(() => {
        if (!videoPlayerInstance.readyState()) {
          console.error('[VideoPlayer] Load timeout');
          setState(States.ERROR, KT('device.videoLoadTimeout'));
        }
      }, VIDEO_LOAD_TIMEOUT_MS);
      
      // Event listeners
      videoPlayerInstance.on('error', function() {
        console.error('[VideoPlayer] Player error:', videoPlayerInstance.error());
        clearTimeout(loadTimeout);
        setState(States.ERROR, KT('device.errorPlayingVideo'));
      });
      
      videoPlayerInstance.on('loadeddata', function() {
        clearTimeout(loadTimeout);
        console.log('[VideoPlayer] Video loaded successfully');
        setState(States.PLAYING, KT('device.playing'));
      });
      
      // Configurar fuente
      videoPlayerInstance.src({
        src: videoUrl,
        type: 'application/x-mpegURL'
      });
      
      // Iniciar reproducción
      videoPlayerInstance.play().catch(error => {
        console.error('[VideoPlayer] Play error:', error);
        setState(States.ERROR, KT('device.errorPlayingVideo'));
      });
      
    } catch (error) {
      console.error('[VideoPlayer] Initialization error:', error);
      setState(States.ERROR, KT('device.errorInitializingPlayer'));
    }
  };
  
  // ============================================
  // PUBLIC: Open Video
  // ============================================
  const openVideo = async ({ deviceId, uniqueId, protocol, channel: channelName }) => {
    // APM: Track camera open
    const span = obsSpans.cameraOpen.start({ deviceId, channel: channelName, protocol });
    
    try {
      setState(States.INIT, KT('device.initializing'));
      
      // Cargar VideoJS si no está cargado
      await loadVideoJS();
      
      // Crear elementos DOM si no existen
      createDOMElements();
      
      // Mostrar container
      if (videoContainer) {
        videoContainer.style.display = 'block';
      }
      isOpen.value = true;
      
      // Guardar metadata
      _currentChannel = channelName;
      _currentUniqueId = uniqueId;
      channel.value = channelName;
      
      // Determinar comando según protocolo
      let channelCode;
      let command;
      
      if (protocol && protocol.toLowerCase() === 'jimijc2xx') {
        const channelNum = channelName === 'IN' ? 2 : 1;
        channelCode = channelNum;
        command = {
          type: 'START_LIVEJTT',
          attributes: { data: channelNum },
          deviceId
        };
      } else {
        channelCode = channelName;
        command = {
          type: 'custom',
          attributes: { data: `RTMP,ON,${channelName}#,0` },
          deviceId
        };
      }
      
      // Enviar comando
      await runtimeApi.sendCommand(command);

      span.end({ success: true });
      
      notify({
        title: KT('device.info'),
        message: `${KT('device.requestingCamera')} ${channelName}`,
        type: 'info',
        duration: 3000
      });
      
      // Determinar número de canal para URL
      const channelNum = typeof channelCode === 'number' ? 
        channelCode.toString() : 
        channelCode === 'IN' ? '1' : '0';
      
      // Iniciar polling
      startPolling(channelNum, uniqueId);
      
    } catch (error) {
      console.error('[VideoPlayer] Open error:', error);
      span.error(error);
      setState(States.ERROR, KT('device.errorRequestingCamera'));
      
      notify({
        title: KT('device.error'),
        message: KT('device.errorSendingCommand'),
        type: 'error'
      });
      
      closeVideo();
    }
  };
  
  // ============================================
  // PUBLIC: Close Video
  // ============================================
  const closeVideo = () => {
    console.log('[VideoPlayer] Closing video');
    
    cleanupTimers();
    disposePlayer();
    
    if (videoContainer) {
      videoContainer.style.display = 'none';
    }
    
    isOpen.value = false;
    setState(States.IDLE, '');
    channel.value = null;
    _currentChannel = null;
    _currentUniqueId = null;
  };
  
  // ============================================
  // PUBLIC: Full Cleanup
  // ============================================
  const cleanup = () => {
    console.log('[VideoPlayer] Full cleanup');
    closeVideo();
    removeDOMElements();
  };
  
  // ============================================
  // RETURN PUBLIC API
  // ============================================
  return {
    // State (readonly)
    state: readonly(state),
    isOpen: readonly(isOpen),
    statusText: readonly(statusText),
    channel: readonly(channel),
    
    // Methods
    openVideo,
    closeVideo,
    cleanup,
    
    // Shared utilities (for dual camera composable)
    loadVideoJS,
    checkVideoAvailability
  };
}
