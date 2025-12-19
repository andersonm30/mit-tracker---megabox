<template>
  <div id="pano">VIEW</div>
</template>

<script setup>
import {onMounted,onUnmounted,watch,ref} from 'vue';
import {useRoute} from 'vue-router';
import {useStore} from 'vuex';
const route = useRoute();
const store = useStore();
const panorama = ref(null);
const errorCount = ref(0);
const lastUpdateTime = ref(Date.now());
const isRecreating = ref(false);
const consecutiveFailures = ref(0);
const lastPosition = ref(null);
const updatesSinceLastRecreate = ref(0);
let globalErrorHandler = null;

// Função para recriar o panorama quando há muitos erros
const recreatePanorama = (position) => {
  if (isRecreating.value) {
    console.log('StreetView: Recriação já em andamento, ignorando');
    return false;
  }

  isRecreating.value = true;
  console.log('StreetView: === INICIANDO RECRIAÇÃO DO PANORAMA ===');
  console.log('StreetView: Posição para recriação:', position);

  const panoElement = document.getElementById("pano");
  if (!panoElement || typeof google === 'undefined') {
    console.error('StreetView: Não é possível recriar panorama - elemento ou Google Maps indisponível');
    isRecreating.value = false;
    return false;
  }

  try {
    // Limpa o panorama anterior completamente
    if (panorama.value) {
      try {
        // Remove todos os listeners possíveis
        // eslint-disable-next-line no-undef
        google.maps.event.clearInstanceListeners(panorama.value);
        panorama.value.setVisible(false);
      } catch (e) {
        console.warn('StreetView: Erro ao limpar panorama anterior:', e);
      }
      panorama.value = null;
    }

    // Limpa o elemento DOM
    panoElement.innerHTML = '';

    // Pequeno delay para garantir que o Google Maps limpe os recursos
    setTimeout(() => {
      try {
        // Cria novo panorama
        // eslint-disable-next-line no-undef
        panorama.value = new google.maps.StreetViewPanorama(
          panoElement,
          {
            addressControl: false,
            disableDefaultUI: true,
            disableDoubleClickZoom: true,
            // eslint-disable-next-line no-undef
            position: new google.maps.LatLng(position.latitude, position.longitude),
            pov: {
              heading: position.course,
              pitch: 10,
            },
            motionTracking: false,
            motionTrackingControl: false
          }
        );

        window.$pano = panorama.value;
        errorCount.value = 0; // Reset contador de erros
        consecutiveFailures.value = 0; // Reset falhas consecutivas
        updatesSinceLastRecreate.value = 0; // Reset contador de atualizações
        lastUpdateTime.value = Date.now(); // Marca tempo da recriação
        isRecreating.value = false;

        // Reinicia o health check
        stopHealthCheck();
        console.log('StreetView: Iniciando health check após recriação');
        startHealthCheck();

        console.log('StreetView: === PANORAMA RECRIADO COM SUCESSO ===');
      } catch (error) {
        console.error('StreetView: Erro ao recriar panorama:', error);
        isRecreating.value = false;
      }
    }, 500);

    return true;
  } catch (error) {
    console.error('StreetView: Erro ao recriar panorama:', error);
    isRecreating.value = false;
    return false;
  }
}

// Handler para capturar erros globais do Google Maps
const setupGlobalErrorHandler = () => {
  if (globalErrorHandler) return;

  console.log('StreetView: Configurando handler de erro global');

  globalErrorHandler = (event) => {
    console.log('StreetView: Erro global capturado:', event);

    const error = event.error || event.reason;
    console.log('StreetView: Erro extraído:', error);

    if (error) {
      const stack = error.stack || '';
      const message = error.message || '';

      console.log('StreetView: Stack:', stack);
      console.log('StreetView: Message:', message);

      if (stack.includes('imagery_viewer') ||
          stack.includes('streetview') ||
          message.includes('Maps')) {

        console.warn('StreetView: Erro do Google Maps detectado - forçando recriação');

        // Se temos uma posição atual, força recriação
        if (route.params.deviceId && !isRecreating.value) {
          const position = store.state.devices.positionsList[parseInt(route.params.deviceId)];
          if (position) {
            console.log('StreetView: Forçando recriação devido a erro global');
            setTimeout(() => recreatePanorama(position), 1000);
          } else {
            console.log('StreetView: Posição não encontrada para recriação');
          }
        } else {
          console.log('StreetView: Recriação não possível - deviceId:', route.params.deviceId, 'isRecreating:', isRecreating.value);
        }
      }
    }
  };

  // Adiciona listeners para diferentes tipos de erro
  window.addEventListener('error', globalErrorHandler);
  window.addEventListener('unhandledrejection', globalErrorHandler);
  console.log('StreetView: Handler de erro global configurado');
}

const removeGlobalErrorHandler = () => {
  if (globalErrorHandler) {
    window.removeEventListener('error', globalErrorHandler);
    window.removeEventListener('unhandledrejection', globalErrorHandler);
    globalErrorHandler = null;
  }
}

// Função segura para atualizar posição com retry e recovery
const safeUpdatePosition = (position) => {
  if (!position || !panorama.value || isRecreating.value) return false;

  try {
    // eslint-disable-next-line no-undef
    panorama.value.setPosition(new google.maps.LatLng(position.latitude, position.longitude));
    panorama.value.setPov({heading: position.course, pitch: 10});

    // Reset contador de erros em caso de sucesso
    errorCount.value = 0;
    consecutiveFailures.value = 0;
    lastUpdateTime.value = Date.now();
    console.log('StreetView: Panorama atualizado com sucesso!');
    return true;
  } catch (error) {
    errorCount.value++;
    consecutiveFailures.value++;
    console.warn(`StreetView: Erro ao atualizar panorama (tentativa ${errorCount.value}, consecutivas ${consecutiveFailures.value}):`, error);

    // Se há muitos erros consecutivos, tenta recriar o panorama
    if (errorCount.value >= 2 && !isRecreating.value) {
      console.log('StreetView: Muitos erros consecutivos, tentando recriar panorama...');
      setTimeout(() => recreatePanorama(position), 500);
    }

    return false;
  }
}

// Função para verificar se houve mudança significativa de posição
const hasSignificantChange = (pos1, pos2) => {
  if (!pos1 || !pos2) return true;
  const latDiff = Math.abs(pos1.latitude - pos2.latitude);
  const lngDiff = Math.abs(pos1.longitude - pos2.longitude);
  return latDiff > 0.0001 || lngDiff > 0.0001; // ~10 metros
};

// Watcher para monitorar mudanças de posição diretamente no store
const unwatchPosition = store.watch(
  () => store.state.devices.positionsList[parseInt(route.params.deviceId)],
  (newPosition) => {
    if (isRecreating.value) {
      console.log('StreetView: Posição mudou durante recriação, ignorando');
      return;
    }

    console.log('StreetView: Posição monitorada mudou!', newPosition);
    if (newPosition && route.params.deviceId) {

      // Verifica se houve mudança significativa de posição
      const hasChanged = hasSignificantChange(lastPosition.value, newPosition);

      console.log(`StreetView: Posição recebida:`, {
        lat: newPosition.latitude,
        lng: newPosition.longitude,
        heading: newPosition.course,
        significantChange: hasChanged
      });

      // Se a posição não mudou significativamente, ignora
      if (!hasChanged) {
        console.log('StreetView: Posição não mudou significativamente, ignorando atualização');
        return;
      }

      updatesSinceLastRecreate.value++;
      console.log('StreetView: DEBUG - updatesSinceLastRecreate.value agora é:', updatesSinceLastRecreate.value);

      // SOLUÇÃO DEFINITIVA: Google Maps Street View tem um bug que quebra após a primeira atualização
      // Portanto, recriamos o panorama A CADA mudança significativa de posição para evitar o erro
      if (updatesSinceLastRecreate.value >= 1) {
        console.log(`StreetView: Recriando panorama (posição mudou - workaround para bug do Google Maps)`);
        updatesSinceLastRecreate.value = 0;
        lastPosition.value = newPosition;
        setTimeout(() => recreatePanorama(newPosition), 100);
        return;
      }
    }
  },
  { deep: true }
);
watch(()=> route.params.deviceId,()=>{
if(route.params.deviceId){
updatePosition();
}else{
store.dispatch("devices/toggleStreet");
}
})
const updatePosition = ()=>{
console.log('StreetView: updatePosition() chamada');
const device = store.getters['devices/getDevice'](parseInt(route.params.deviceId));
console.log('StreetView: updatePosition device:', device);

if(!device || !device.positionId) {
  console.log('StreetView: updatePosition - device sem positionId');
  return;
}

// As posições estão armazenadas por deviceId, não por positionId
const position = store.state.devices.positionsList[device.id];
console.log('StreetView: updatePosition nova posição:', position);

if(!position) {
  console.log('StreetView: updatePosition - position não encontrada');
  return;
}

if(!panorama.value) {
  console.log('StreetView: updatePosition - panorama não inicializado');
  return;
}

console.log('StreetView: updatePosition atualizando para:', {lat: position.latitude, lng: position.longitude, heading: position.course});

// Usa a função segura para atualizar
if (!safeUpdatePosition(position)) {
  console.warn('StreetView: Falha em updatePosition');
}
}
window.$updatePano = (id, position)=>{
console.log('StreetView: $updatePano chamada com id:', id, 'position:', position, 'route.params.deviceId:', route.params.deviceId);
if(id === parseInt(route.params.deviceId)){
  console.log('StreetView: $updatePano - ID corresponde, atualizando posição');

  if(!panorama.value) {
    console.log('StreetView: $updatePano - panorama não inicializado');
    return;
  }

  if(position) {
    console.log('StreetView: $updatePano atualizando para posição recebida:', {lat: position.latitude, lng: position.longitude, heading: position.course});
    // Usa a função segura para atualizar
    if (!safeUpdatePosition(position)) {
      console.warn('StreetView: Falha em $updatePano');
    }
  } else {
    console.log('StreetView: $updatePano - posição não fornecida, chamando updatePosition()');
    updatePosition();
  }
} else {
  console.log('StreetView: $updatePano - ID não corresponde, ignorando');
}
};
// eslint-disable-next-line no-unused-vars
const initialize = ()=>{
console.log('StreetView: Iniciando initialize()');
console.log('route.params.deviceId:', route.params.deviceId);
console.log('google maps disponível:', typeof google !== 'undefined');

if(!route.params.deviceId) {
  console.log('StreetView: Nenhum deviceId encontrado');
  return;
}

const device = store.getters['devices/getDevice'](parseInt(route.params.deviceId));
console.log('StreetView: Device encontrado:', device);

if(!device || !device.positionId) {
  console.log('StreetView: Device sem positionId, device:', device);
  return;
}

console.log('StreetView: Device positionId:', device.positionId);
console.log('StreetView: Todas as positions no store:', store.state.devices.positionsList);

// As posições estão armazenadas por deviceId, não por positionId
const position = store.state.devices.positionsList[device.id];
console.log('StreetView: Position encontrada (usando device.id):', position);

if(!position) {
  console.log('StreetView: Position não encontrada');
  return;
}

const fenway = {lat: position.latitude, lng: position.longitude};
console.log('StreetView: Coordenadas:', fenway);

const panoElement = document.getElementById("pano");
console.log('StreetView: Elemento #pano:', panoElement);

if (!panoElement) {
  console.error('StreetView: Elemento #pano não encontrado');
  return;
}

if (typeof google === 'undefined') {
  console.error('StreetView: Google Maps API não carregada');
  return;
}

try {
  // eslint-disable-next-line no-undef
  panorama.value = new google.maps.StreetViewPanorama(
      panoElement,
      {
        addressControl: false,
        disableDefaultUI: true,
        disableDoubleClickZoom: true,
        position: fenway,
        pov: {
          heading: position.course,
          pitch: 10,
        },
        motionTracking: false,
        motionTrackingControl: false,
        enableCloseButton: false
      }
  );
  window.$pano = panorama.value;
  updatesSinceLastRecreate.value = 0; // Inicia contador de atualizações
  lastUpdateTime.value = Date.now(); // Marca tempo da criação inicial
  console.log('StreetView: Panorama criado com sucesso');

  // Configura handler de erros globais
  setupGlobalErrorHandler();

  // Inicia o health check após criação bem sucedida
  console.log('StreetView: Iniciando health check após criação inicial');
  startHealthCheck();
} catch (error) {
  console.error('StreetView: Erro ao criar panorama:', error);
}
}
onMounted(()=>{
console.log('StreetView: onMounted executado');

if(!document.querySelector("#gmaps")) {
  console.log('StreetView: Script do Google Maps não encontrado, carregando...');

  // pega a API dos atributos do servidor
  const gkey = store.getters['server/getAttribute']('google_api');
  console.log('StreetView: Google API key do servidor:', gkey);

  const tmp = document.createElement("script");
  tmp.id = "gmaps"

  if (gkey){
    tmp.src = "https://maps.googleapis.com/maps/api/js?key="+gkey+"&v=weekly&channel=2";
    console.log('StreetView: Usando API key do servidor');
  }
  else{
    tmp.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyAK9rvhahXGmNQs9KQs-gbx4etmqSiAewo&v=weekly&channel=2";
    console.log('StreetView: Usando API key padrão (hardcoded)');
  }

  console.log('StreetView: URL da API:', tmp.src);

  tmp.async = true;
  tmp.onload = () => {
    console.log('StreetView: Google Maps API carregada com sucesso');
    initialize();
  }
  tmp.onerror = (error) => {
    console.error('StreetView: Erro ao carregar Google Maps API:', error);
  }
  document.body.appendChild(tmp);
  console.log('StreetView: Script adicionado ao body');
}else{
  console.log('StreetView: Script do Google Maps já existe, executando initialize');
  initialize();
}
})

// Sistema de monitoramento para detectar quando StreetView para de responder
let healthCheckInterval = null;

const startHealthCheck = () => {
  // Verifica a cada 5 segundos se o panorama está respondendo adequadamente
  healthCheckInterval = setInterval(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime.value;

    // Debug: mostra estado atual
    console.log('StreetView: Health check - tempo desde última atualização:', Math.floor(timeSinceLastUpdate / 1000), 'segundos');
    console.log('StreetView: consecutiveFailures:', consecutiveFailures.value);

    // Se teve muitas falhas consecutivas ou passou tempo demais sem atualização
    if ((consecutiveFailures.value >= 3 || timeSinceLastUpdate > 20000) && route.params.deviceId && !isRecreating.value) {
      const position = store.state.devices.positionsList[parseInt(route.params.deviceId)];
      if (position && panorama.value) {
        console.log('StreetView: Health check detectou problema - forçando recriação');
        console.log('StreetView: Motivo:', consecutiveFailures.value >= 3 ? 'Muitas falhas consecutivas' : 'Muito tempo sem atualização');

        setTimeout(() => recreatePanorama(position), 100);
      }
    }
  }, 5000);
}

const stopHealthCheck = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

onUnmounted(() => {
  console.log('StreetView: Component sendo desmontado, removendo watcher e health check');
  unwatchPosition();
  stopHealthCheck();
  removeGlobalErrorHandler();
  if (window.$updatePano) {
    delete window.$updatePano;
  }
});
</script>

<style scoped>
#pano{
position: absolute;
right: 0px;
bottom: 0px;
background: white;
z-index: 1003;
width: 380px;
height: 310px;
}
</style>