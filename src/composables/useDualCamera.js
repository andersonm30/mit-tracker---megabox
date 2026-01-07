import { ref } from 'vue';

/**
 * Composable para gerenciar dual camera (left=IN, right=OUT)
 * 
 * @param {Object} options - Opções de configuração
 * @param {Object} options.store - Vuex store instance
 * @param {Function} options.KT - Função de tradução
 * @param {Function} options.notify - Função de notificação (ElNotification)
 * @param {Function} options.loadVideoJS - Função para carregar VideoJS
 * @param {Function} options.checkVideoAvailability - Função para verificar disponibilidade do stream
 * @returns {Object} API pública do composable
 */
// eslint-disable-next-line no-unused-vars
export function useDualCamera({ store: _store, KT, notify, runtimeApi, loadVideoJS, checkVideoAvailability }) {
  // Validar runtimeApi
  if (!runtimeApi) {
    throw new Error('Runtime API não disponível. Recarregue a página.');
  }
  // ========== CONSTANTS ==========
  const POLL_INTERVAL_MS = 3000;
  const MAX_POLL_ATTEMPTS = 20;
  const VIDEO_LOAD_TIMEOUT_MS = 15000;

  // ========== STATE ==========
  const showDualCameras = ref(false);
  const cameraSelected = ref(false);
  const leftCameraMessage = ref('');
  const rightCameraMessage = ref('');

  // ========== PRIVATE VARIABLES ==========
  let leftVideoPlayer = null;
  let rightVideoPlayer = null;
  let leftVideoInterval = null;
  let rightVideoInterval = null;

  // ========== PRIVATE FUNCTIONS ==========

  /**
   * Envia comando para dispositivo (RTMP ou START_LIVEJTT)
   */
  const sendCameraCommand = async (device, position, channel) => {
    let command = {};
    let channelCode = channel;

    if (position && position.protocol && position.protocol.toLowerCase() === 'jimijc2xx') {
      const channelNum = channel === 'IN' ? 2 : 1;
      channelCode = channelNum;
      command = {
        type: 'START_LIVEJTT',
        attributes: {
          data: channelNum
        },
        deviceId: device.id
      };
    } else {
      command = {
        type: 'custom',
        attributes: {
          data: `RTMP,ON,${channel}#,0`
        },
        deviceId: device.id
      };
    }

    await runtimeApi.sendCommand(command);
    return channelCode;
  };

  /**
   * Polling para verificar disponibilidade do stream (left)
   */
  const startLeftCameraPolling = (channelCode, uniqueId) => {
    let channelNum = typeof channelCode === 'number' 
      ? channelCode.toString() 
      : channelCode === 'IN' ? '1' : '0';

    let attempts = 0;

    leftVideoInterval = setInterval(async () => {
      attempts++;

      try {
        const isAvailable = await checkVideoAvailability(channelNum, uniqueId);

        leftCameraMessage.value = `${KT('device.waitingVideo')} (${attempts}/${MAX_POLL_ATTEMPTS})`;

        if (isAvailable) {
          console.log(`Video esquerdo disponível após ${attempts} tentativas`);
          showLeftVideoPlayer(channelNum, uniqueId);
          clearInterval(leftVideoInterval);
          leftVideoInterval = null;
        } else if (attempts >= MAX_POLL_ATTEMPTS) {
          leftCameraMessage.value = KT('device.videoNotAvailableAfterAttempts');
          clearInterval(leftVideoInterval);
          leftVideoInterval = null;

          notify({
            title: KT('device.error'),
            message: KT('device.videoNotAvailable'),
            type: 'error',
          });
        }
      } catch (error) {
        console.error('Erro durante polling de vídeo esquerdo:', error);
        if (attempts >= MAX_POLL_ATTEMPTS) {
          leftCameraMessage.value = KT('device.errorCheckingAvailability');
          clearInterval(leftVideoInterval);
          leftVideoInterval = null;
        }
      }
    }, POLL_INTERVAL_MS);
  };

  /**
   * Polling para verificar disponibilidade do stream (right)
   */
  const startRightCameraPolling = (channelCode, uniqueId) => {
    let channelNum = typeof channelCode === 'number' 
      ? channelCode.toString() 
      : channelCode === 'IN' ? '1' : '0';

    let attempts = 0;

    rightVideoInterval = setInterval(async () => {
      attempts++;

      try {
        const isAvailable = await checkVideoAvailability(channelNum, uniqueId);

        rightCameraMessage.value = `${KT('device.waitingVideo')} (${attempts}/${MAX_POLL_ATTEMPTS})`;

        if (isAvailable) {
          console.log(`Video direito disponível após ${attempts} tentativas`);
          showRightVideoPlayer(channelNum, uniqueId);
          clearInterval(rightVideoInterval);
          rightVideoInterval = null;
        } else if (attempts >= MAX_POLL_ATTEMPTS) {
          rightCameraMessage.value = KT('device.videoNotAvailableAfterAttempts');
          clearInterval(rightVideoInterval);
          rightVideoInterval = null;

          notify({
            title: KT('device.error'),
            message: KT('device.videoNotAvailable'),
            type: 'error',
          });
        }
      } catch (error) {
        console.error('Erro durante polling de vídeo direito:', error);
        if (attempts >= MAX_POLL_ATTEMPTS) {
          rightCameraMessage.value = KT('device.errorCheckingAvailability');
          clearInterval(rightVideoInterval);
          rightVideoInterval = null;
        }
      }
    }, POLL_INTERVAL_MS);
  };

  /**
   * Mostrar reprodutor de vídeo esquerdo
   */
  const showLeftVideoPlayer = (channelNum, uniqueId) => {
    const leftContainer = document.getElementById('camera-left-container');
    if (!leftContainer) return;

    leftContainer.innerHTML = '';

    const timestamp = new Date().getTime();
    const videoUrl = `https://play.wdns.ws/${channelNum}/${uniqueId}/hls.m3u8?nocache=${timestamp}`;

    const videoId = 'left-camera-video-player';
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

    const sourceElement = document.createElement('source');
    sourceElement.src = videoUrl;
    sourceElement.type = 'application/x-mpegURL';
    videoElement.appendChild(sourceElement);

    leftContainer.appendChild(videoElement);

    try {
      leftVideoPlayer = window.videojs(videoId, {
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
          remainingTimeDisplay: false,
          customControlSpacer: true
        }
      });

      leftVideoPlayer.loadTimeout = setTimeout(() => {
        if (!leftVideoPlayer.readyState()) {
          console.error('Timeout carregando vídeo esquerdo');
          leftCameraMessage.value = KT('device.videoLoadTimeout');
        }
      }, VIDEO_LOAD_TIMEOUT_MS);

      leftVideoPlayer.on('error', function() {
        console.error('Erro no player esquerdo:', leftVideoPlayer.error());
        clearTimeout(leftVideoPlayer.loadTimeout);
        leftCameraMessage.value = KT('device.errorPlayingVideo');
      });

      leftVideoPlayer.on('loadeddata', function() {
        clearTimeout(leftVideoPlayer.loadTimeout);
        console.log('Vídeo esquerdo carregado corretamente');

        const messageElem = leftContainer.querySelector('.camera-message');
        if (messageElem) messageElem.style.display = 'none';
      });

      leftVideoPlayer.src({
        src: videoUrl,
        type: 'application/x-mpegURL'
      });

      leftVideoPlayer.play().catch(error => {
        console.error('Erro ao tentar reproduzir vídeo esquerdo:', error);
      });
    } catch (error) {
      console.error('Erro ao inicializar player esquerdo:', error);
      leftCameraMessage.value = KT('device.errorInitializingPlayer');
    }
  };

  /**
   * Mostrar reprodutor de vídeo direito
   */
  const showRightVideoPlayer = (channelNum, uniqueId) => {
    const rightContainer = document.getElementById('camera-right-container');
    if (!rightContainer) return;

    rightContainer.innerHTML = '';

    const timestamp = new Date().getTime();
    const videoUrl = `https://play.wdns.ws/${channelNum}/${uniqueId}/hls.m3u8?nocache=${timestamp}`;

    const videoId = 'right-camera-video-player';
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

    const sourceElement = document.createElement('source');
    sourceElement.src = videoUrl;
    sourceElement.type = 'application/x-mpegURL';
    videoElement.appendChild(sourceElement);

    rightContainer.appendChild(videoElement);

    try {
      rightVideoPlayer = window.videojs(videoId, {
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
          remainingTimeDisplay: false,
          customControlSpacer: true
        }
      });

      rightVideoPlayer.loadTimeout = setTimeout(() => {
        if (!rightVideoPlayer.readyState()) {
          console.error('Timeout carregando vídeo direito');
          rightCameraMessage.value = KT('device.videoLoadTimeout');
        }
      }, VIDEO_LOAD_TIMEOUT_MS);

      rightVideoPlayer.on('error', function() {
        console.error('Erro no player direito:', rightVideoPlayer.error());
        clearTimeout(rightVideoPlayer.loadTimeout);
        rightCameraMessage.value = KT('device.errorPlayingVideo');
      });

      rightVideoPlayer.on('loadeddata', function() {
        clearTimeout(rightVideoPlayer.loadTimeout);
        console.log('Vídeo direito carregado corretamente');

        const messageElem = rightContainer.querySelector('.camera-message');
        if (messageElem) messageElem.style.display = 'none';
      });

      rightVideoPlayer.src({
        src: videoUrl,
        type: 'application/x-mpegURL'
      });

      rightVideoPlayer.play().catch(error => {
        console.error('Erro ao tentar reproduzir vídeo direito:', error);
      });
    } catch (error) {
      console.error('Erro ao inicializar player direito:', error);
      rightCameraMessage.value = KT('device.errorInitializingPlayer');
    }
  };

  // ========== PUBLIC API ==========

  /**
   * Toggle da visibilidade das câmeras duais
   */
  const toggleDual = () => {
    showDualCameras.value = !showDualCameras.value;

    if (!showDualCameras.value) {
      cleanupDualCameraResources();
    }
  };

  /**
   * Seleciona e ativa as câmeras (SEMPRE left=IN, right=OUT)
   */
  const selectCamera = (device, position) => {
    if (!device || !device.id) return;

    cameraSelected.value = true;

    // SEMPRE left=IN, right=OUT
    loadLeftCamera(device, position, 'IN');
    loadRightCamera(device, position, 'OUT');

    notify({
      title: KT('device.info'),
      message: KT('device.cameraActivated'),
      type: 'success',
      duration: 3000
    });
  };

  /**
   * Carrega câmera esquerda
   */
  const loadLeftCamera = async (device, position, channel) => {
    if (!device || !device.id) return;

    try {
      await loadVideoJS();

      if (leftVideoPlayer && typeof leftVideoPlayer.dispose === 'function') {
        leftVideoPlayer.dispose();
        leftVideoPlayer = null;
      }

      if (leftVideoInterval) {
        clearInterval(leftVideoInterval);
        leftVideoInterval = null;
      }

      leftCameraMessage.value = KT('device.requestingCamera') + ` ${channel}...`;

      const channelCode = await sendCameraCommand(device, position, channel);

      const uniqueId = device.uniqueId;
      if (!uniqueId) {
        throw new Error(KT('device.noUniqueId'));
      }

      // Comando já foi enviado via sendCameraCommand, esta linha estava duplicada/bugada

      notify({
        title: KT('device.info'),
        message: KT('device.requestingCamera') + ` ${channel}`,
        type: 'info',
        duration: 3000
      });

      startLeftCameraPolling(channelCode, uniqueId);
    } catch (error) {
      console.error('Erro ao carregar câmera esquerda:', error);
      leftCameraMessage.value = KT('device.errorRequestingCamera');

      notify({
        title: KT('device.error'),
        message: KT('device.errorSendingCommand'),
        type: 'error',
      });
    }
  };

  /**
   * Carrega câmera direita
   */
  const loadRightCamera = async (device, position, channel) => {
    if (!device || !device.id) return;

    try {
      await loadVideoJS();

      if (rightVideoPlayer && typeof rightVideoPlayer.dispose === 'function') {
        rightVideoPlayer.dispose();
        rightVideoPlayer = null;
      }

      if (rightVideoInterval) {
        clearInterval(rightVideoInterval);
        rightVideoInterval = null;
      }

      rightCameraMessage.value = KT('device.requestingCamera') + ` ${channel}...`;

      const channelCode = await sendCameraCommand(device, position, channel);

      const uniqueId = device.uniqueId;
      if (!uniqueId) {
        throw new Error(KT('device.noUniqueId'));
      }

      notify({
        title: KT('device.info'),
        message: KT('device.requestingCamera') + ` ${channel}`,
        type: 'info',
        duration: 3000
      });

      startRightCameraPolling(channelCode, uniqueId);
    } catch (error) {
      console.error('Erro ao carregar câmera direita:', error);
      rightCameraMessage.value = KT('device.errorRequestingCamera');

      notify({
        title: KT('device.error'),
        message: KT('device.errorSendingCommand'),
        type: 'error',
      });
    }
  };

  /**
   * Limpeza completa dos recursos das câmeras duais
   */
  const cleanupDualCameraResources = () => {
    // Dispose dos players
    if (leftVideoPlayer && typeof leftVideoPlayer.dispose === 'function') {
      leftVideoPlayer.dispose();
      leftVideoPlayer = null;
    }

    if (rightVideoPlayer && typeof rightVideoPlayer.dispose === 'function') {
      rightVideoPlayer.dispose();
      rightVideoPlayer = null;
    }

    // ClearInterval dos pollings
    if (leftVideoInterval) {
      clearInterval(leftVideoInterval);
      leftVideoInterval = null;
    }

    if (rightVideoInterval) {
      clearInterval(rightVideoInterval);
      rightVideoInterval = null;
    }

    // Reset de estado
    cameraSelected.value = false;

    // Reset de mensagens
    leftCameraMessage.value = KT('device.selectCamera');
    rightCameraMessage.value = KT('device.selectCamera');

    // Limpar containers com fallback
    const leftContainer = document.getElementById('camera-left-container');
    const rightContainer = document.getElementById('camera-right-container');

    if (leftContainer) {
      leftContainer.innerHTML = `
        <div class="camera-spinner-loader"></div>
        <div class="camera-message-text">
          ${leftCameraMessage.value}
        </div>
      `;
    }

    if (rightContainer) {
      rightContainer.innerHTML = `
        <div class="camera-spinner-loader"></div>
        <div class="camera-message-text">
          ${rightCameraMessage.value}
        </div>
      `;
    }
  };

  // ========== RETURN PUBLIC API ==========
  return {
    // State (reactive)
    showDualCameras,
    cameraSelected,
    leftCameraMessage,
    rightCameraMessage,

    // Methods
    toggleDual,
    selectCamera,
    loadLeftCamera,
    loadRightCamera,
    cleanupDualCameraResources,
  };
}
