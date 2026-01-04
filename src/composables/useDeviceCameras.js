/**
 * useDeviceCameras - Composable para gerenciamento de câmeras de dispositivos
 * 
 * Encapsula toda a lógica de:
 * - Carregamento dinâmico do VideoJS
 * - Verificação de disponibilidade de vídeo HLS
 * - Polling de câmeras (esquerda/direita)
 * - Gerenciamento de players de vídeo
 */

import { ref } from 'vue';

// ========================
// CONSTANTES DE CONFIGURAÇÃO
// ========================
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20;
const VIDEO_LOAD_TIMEOUT_MS = 15000;
const VIDEOJS_URL = 'https://vjs.zencdn.net/7.20.3/video.min.js';
const VIDEOJS_CSS_URL = 'https://vjs.zencdn.net/7.20.3/video-js.css';
const HLS_BASE_URL = 'https://play.wdns.ws';

// Flag para indicar se VideoJS já foi carregado
// eslint-disable-next-line no-unused-vars
let isVideoJSLoaded = false;

/**
 * Composable para gerenciamento de câmeras
 * @param {Function} KT - Função de tradução
 * @returns {Object} Funções e estados reativos para câmeras
 */
export function useDeviceCameras(KT = (k) => k) {
  // Estados reativos
  const leftCameraMessage = ref('');
  const rightCameraMessage = ref('');
  const isLeftCameraLoading = ref(false);
  const isRightCameraLoading = ref(false);
  
  // Referências dos players e intervalos
  let leftVideoPlayer = null;
  let rightVideoPlayer = null;
  let leftVideoInterval = null;
  let rightVideoInterval = null;

  /**
   * Carrega o VideoJS dinamicamente
   * @returns {Promise<Object>} Instância do VideoJS
   */
  const loadVideoJS = () => {
    return new Promise((resolve, reject) => {
      // Verificar se já está carregado
      if (window.videojs) {
        isVideoJSLoaded = true;
        resolve(window.videojs);
        return;
      }
      
      // Carregar CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = VIDEOJS_CSS_URL;
      document.head.appendChild(link);
      
      // Carregar script principal
      const script = document.createElement('script');
      script.src = VIDEOJS_URL;
      script.async = true;
      
      script.onload = () => {
        isVideoJSLoaded = true;
        resolve(window.videojs);
      };
        
      script.onerror = () => {
        reject(new Error('Error loading VideoJS'));
      };
      
      document.head.appendChild(script);
    });
  };

  /**
   * Verifica se o stream de vídeo HLS está disponível
   * @param {string} channelNum - Número do canal
   * @param {string} uniqueId - ID único do dispositivo
   * @returns {Promise<boolean>} true se disponível
   */
  const checkVideoAvailability = async (channelNum, uniqueId) => {
    try {
      const timestamp = new Date().getTime();
      const playlistUrl = `${HLS_BASE_URL}/${channelNum}/${uniqueId}/hls.m3u8?check=${timestamp}`;
      
      const response = await fetch(playlistUrl, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      return response.ok;
    } catch (error) {
      console.warn('Video availability check failed:', error);
      return false;
    }
  };

  /**
   * Cria um elemento de vídeo para o VideoJS
   * @param {string} videoId - ID do elemento de vídeo
   * @returns {HTMLVideoElement}
   */
  const createVideoElement = (videoId) => {
    const videoElement = document.createElement('video');
    videoElement.className = 'video-js vjs-default-skin vjs-big-play-centered';
    videoElement.id = videoId;
    videoElement.controls = true;
    videoElement.preload = 'auto';
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    videoElement.style.objectFit = 'cover';
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('autoplay', '');
    return videoElement;
  };

  /**
   * Cria configuração padrão do VideoJS
   * @returns {Object}
   */
  const getVideoJSConfig = () => ({
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
      volumePanel: { inline: true, vertical: false },
      progressControl: false,
      fullscreenToggle: true,
      remainingTimeDisplay: false,
      customControlSpacer: true
    }
  });

  /**
   * Inicializa e exibe o player de vídeo esquerdo
   * @param {string} channelNum - Número do canal
   * @param {string} uniqueId - ID único do dispositivo
   */
  const showLeftVideoPlayer = (channelNum, uniqueId) => {
    const container = document.getElementById('camera-left-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const timestamp = new Date().getTime();
    const videoUrl = `${HLS_BASE_URL}/${channelNum}/${uniqueId}/hls.m3u8?nocache=${timestamp}`;
    const videoId = 'left-camera-video-player';
    
    const videoElement = createVideoElement(videoId);
    
    const sourceElement = document.createElement('source');
    sourceElement.src = videoUrl;
    sourceElement.type = 'application/x-mpegURL';
    videoElement.appendChild(sourceElement);
    
    container.appendChild(videoElement);
    
    try {
      leftVideoPlayer = window.videojs(videoId, getVideoJSConfig());
      
      // Timeout para erros
      leftVideoPlayer.loadTimeout = setTimeout(() => {
        if (!leftVideoPlayer.readyState()) {
          console.error('Timeout loading left video');
          leftCameraMessage.value = KT('device.videoLoadTimeout');
        }
      }, VIDEO_LOAD_TIMEOUT_MS);
      
      // Handler de erro
      leftVideoPlayer.on('error', function() {
        console.error('Error in left player:', leftVideoPlayer.error());
        clearTimeout(leftVideoPlayer.loadTimeout);
        leftCameraMessage.value = KT('device.errorPlayingVideo');
      });
      
      // Vídeo pronto
      leftVideoPlayer.on('loadeddata', function() {
        clearTimeout(leftVideoPlayer.loadTimeout);
        isLeftCameraLoading.value = false;
        const messageElem = container.querySelector('.camera-message');
        if (messageElem) messageElem.style.display = 'none';
      });
      
      // Configurar fonte e reproduzir
      leftVideoPlayer.src({ src: videoUrl, type: 'application/x-mpegURL' });
      leftVideoPlayer.play().catch(error => {
        console.error('Error trying to play left video:', error);
      });
    } catch (error) {
      console.error('Error initializing left player:', error);
      leftCameraMessage.value = KT('device.errorInitializingPlayer');
    }
  };

  /**
   * Inicializa e exibe o player de vídeo direito
   * @param {string} channelNum - Número do canal
   * @param {string} uniqueId - ID único do dispositivo
   */
  const showRightVideoPlayer = (channelNum, uniqueId) => {
    const container = document.getElementById('camera-right-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const timestamp = new Date().getTime();
    const videoUrl = `${HLS_BASE_URL}/${channelNum}/${uniqueId}/hls.m3u8?nocache=${timestamp}`;
    const videoId = 'right-camera-video-player';
    
    const videoElement = createVideoElement(videoId);
    
    const sourceElement = document.createElement('source');
    sourceElement.src = videoUrl;
    sourceElement.type = 'application/x-mpegURL';
    videoElement.appendChild(sourceElement);
    
    container.appendChild(videoElement);
    
    try {
      rightVideoPlayer = window.videojs(videoId, getVideoJSConfig());
      
      // Timeout para erros
      rightVideoPlayer.loadTimeout = setTimeout(() => {
        if (!rightVideoPlayer.readyState()) {
          console.error('Timeout loading right video');
          rightCameraMessage.value = KT('device.videoLoadTimeout');
        }
      }, VIDEO_LOAD_TIMEOUT_MS);
      
      // Handler de erro
      rightVideoPlayer.on('error', function() {
        console.error('Error in right player:', rightVideoPlayer.error());
        clearTimeout(rightVideoPlayer.loadTimeout);
        rightCameraMessage.value = KT('device.errorPlayingVideo');
      });
      
      // Vídeo pronto
      rightVideoPlayer.on('loadeddata', function() {
        clearTimeout(rightVideoPlayer.loadTimeout);
        isRightCameraLoading.value = false;
        const messageElem = container.querySelector('.camera-message');
        if (messageElem) messageElem.style.display = 'none';
      });
      
      // Configurar fonte e reproduzir
      rightVideoPlayer.src({ src: videoUrl, type: 'application/x-mpegURL' });
      rightVideoPlayer.play().catch(error => {
        console.error('Error trying to play right video:', error);
      });
    } catch (error) {
      console.error('Error initializing right player:', error);
      rightCameraMessage.value = KT('device.errorInitializingPlayer');
    }
  };

  /**
   * Inicia polling para câmera esquerda
   * @param {string|number} channelCode - Código do canal ('IN' ou 'OUT' ou número)
   * @param {string} uniqueId - ID único do dispositivo
   */
  const startLeftCameraPolling = (channelCode, uniqueId) => {
    const channelNum = typeof channelCode === 'number' 
      ? channelCode.toString() 
      : channelCode === 'IN' ? '1' : '0';
    
    let attempts = 0;
    isLeftCameraLoading.value = true;
    
    leftVideoInterval = setInterval(async () => {
      attempts++;
      
      try {
        const isAvailable = await checkVideoAvailability(channelNum, uniqueId);
        leftCameraMessage.value = `${KT('device.waitingVideo')} (${attempts}/${MAX_POLL_ATTEMPTS})`;
        
        if (isAvailable) {
          console.log(`Left video available after ${attempts} attempts`);
          showLeftVideoPlayer(channelNum, uniqueId);
          clearInterval(leftVideoInterval);
          leftVideoInterval = null;
        } else if (attempts >= MAX_POLL_ATTEMPTS) {
          leftCameraMessage.value = KT('device.videoNotAvailableAfterAttempts');
          isLeftCameraLoading.value = false;
          clearInterval(leftVideoInterval);
          leftVideoInterval = null;
        }
      } catch (error) {
        console.error('Error during left video polling:', error);
        if (attempts >= MAX_POLL_ATTEMPTS) {
          leftCameraMessage.value = KT('device.errorCheckingAvailability');
          isLeftCameraLoading.value = false;
          clearInterval(leftVideoInterval);
          leftVideoInterval = null;
        }
      }
    }, POLL_INTERVAL_MS);
  };

  /**
   * Inicia polling para câmera direita
   * @param {string|number} channelCode - Código do canal ('IN' ou 'OUT' ou número)
   * @param {string} uniqueId - ID único do dispositivo
   */
  const startRightCameraPolling = (channelCode, uniqueId) => {
    const channelNum = typeof channelCode === 'number' 
      ? channelCode.toString() 
      : channelCode === 'IN' ? '1' : '0';
    
    let attempts = 0;
    isRightCameraLoading.value = true;
    
    rightVideoInterval = setInterval(async () => {
      attempts++;
      
      try {
        const isAvailable = await checkVideoAvailability(channelNum, uniqueId);
        rightCameraMessage.value = `${KT('device.waitingVideo')} (${attempts}/${MAX_POLL_ATTEMPTS})`;
        
        if (isAvailable) {
          console.log(`Right video available after ${attempts} attempts`);
          showRightVideoPlayer(channelNum, uniqueId);
          clearInterval(rightVideoInterval);
          rightVideoInterval = null;
        } else if (attempts >= MAX_POLL_ATTEMPTS) {
          rightCameraMessage.value = KT('device.videoNotAvailableAfterAttempts');
          isRightCameraLoading.value = false;
          clearInterval(rightVideoInterval);
          rightVideoInterval = null;
        }
      } catch (error) {
        console.error('Error during right video polling:', error);
        if (attempts >= MAX_POLL_ATTEMPTS) {
          rightCameraMessage.value = KT('device.errorCheckingAvailability');
          isRightCameraLoading.value = false;
          clearInterval(rightVideoInterval);
          rightVideoInterval = null;
        }
      }
    }, POLL_INTERVAL_MS);
  };

  /**
   * Para todos os players e intervalos de polling
   */
  const stopAllCameras = () => {
    // Limpar intervalos
    if (leftVideoInterval) {
      clearInterval(leftVideoInterval);
      leftVideoInterval = null;
    }
    if (rightVideoInterval) {
      clearInterval(rightVideoInterval);
      rightVideoInterval = null;
    }
    
    // Destruir players
    if (leftVideoPlayer) {
      try {
        if (leftVideoPlayer.loadTimeout) clearTimeout(leftVideoPlayer.loadTimeout);
        leftVideoPlayer.dispose();
      } catch (e) {
        console.warn('Error disposing left player:', e);
      }
      leftVideoPlayer = null;
    }
    
    if (rightVideoPlayer) {
      try {
        if (rightVideoPlayer.loadTimeout) clearTimeout(rightVideoPlayer.loadTimeout);
        rightVideoPlayer.dispose();
      } catch (e) {
        console.warn('Error disposing right player:', e);
      }
      rightVideoPlayer = null;
    }
    
    // Resetar estados
    leftCameraMessage.value = '';
    rightCameraMessage.value = '';
    isLeftCameraLoading.value = false;
    isRightCameraLoading.value = false;
  };

  /**
   * Para apenas a câmera esquerda
   */
  const stopLeftCamera = () => {
    if (leftVideoInterval) {
      clearInterval(leftVideoInterval);
      leftVideoInterval = null;
    }
    if (leftVideoPlayer) {
      try {
        if (leftVideoPlayer.loadTimeout) clearTimeout(leftVideoPlayer.loadTimeout);
        leftVideoPlayer.dispose();
      } catch (e) {
        console.warn('Error disposing left player:', e);
      }
      leftVideoPlayer = null;
    }
    leftCameraMessage.value = '';
    isLeftCameraLoading.value = false;
  };

  /**
   * Para apenas a câmera direita
   */
  const stopRightCamera = () => {
    if (rightVideoInterval) {
      clearInterval(rightVideoInterval);
      rightVideoInterval = null;
    }
    if (rightVideoPlayer) {
      try {
        if (rightVideoPlayer.loadTimeout) clearTimeout(rightVideoPlayer.loadTimeout);
        rightVideoPlayer.dispose();
      } catch (e) {
        console.warn('Error disposing right player:', e);
      }
      rightVideoPlayer = null;
    }
    rightCameraMessage.value = '';
    isRightCameraLoading.value = false;
  };

  return {
    // Estados reativos
    leftCameraMessage,
    rightCameraMessage,
    isLeftCameraLoading,
    isRightCameraLoading,
    
    // Funções
    loadVideoJS,
    checkVideoAvailability,
    showLeftVideoPlayer,
    showRightVideoPlayer,
    startLeftCameraPolling,
    startRightCameraPolling,
    stopAllCameras,
    stopLeftCamera,
    stopRightCamera,
    
    // Constantes expostas
    POLL_INTERVAL_MS,
    MAX_POLL_ATTEMPTS,
    VIDEO_LOAD_TIMEOUT_MS
  };
}

export default useDeviceCameras;
