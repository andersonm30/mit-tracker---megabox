<template>
  <div style="display: none">
    <!-- Componente invisible para manter o ciclo de vida -->
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

const route = useRoute();
const store = useStore();

// Variáveis para os elementos DOM que criaremos manualmente
let streetViewContainer = null;
let panoContainer = null;
let noImagesMessage = null;
let panorama = null;
let streetViewService = null;
let checkInterval = null;
let isInitialized = false;

// Estado para a mensagem de "não há imagens"
const showNoImagesMessage = ref(false);

// Verificar se o Street View está ativado no store
const isVisible = computed(() => {
  return store.state.devices.streetview;
});

// Função para criar os elementos do DOM
const createDomElements = () => {
  if (isInitialized) return;

  // Criar o container principal de Street View
  streetViewContainer = document.createElement('div');
  streetViewContainer.className = 'street-view-container';
  streetViewContainer.style.position = 'fixed';
  streetViewContainer.style.right = '0';
  streetViewContainer.style.bottom = '0';
  streetViewContainer.style.width = '380px';
  streetViewContainer.style.height = '310px';
  streetViewContainer.style.zIndex = '1003';
  streetViewContainer.style.background = '#1a1a2e';
  streetViewContainer.style.overflow = 'hidden';
  streetViewContainer.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.4)';
  streetViewContainer.style.borderRadius = '12px 0 0 0';
  streetViewContainer.style.display = 'none';
  streetViewContainer.style.border = '1px solid rgba(255, 255, 255, 0.1)';

  // Criar o container para o panorama
  panoContainer = document.createElement('div');
  panoContainer.className = 'pano-container';
  panoContainer.style.width = '100%';
  panoContainer.style.height = '100%';

  // Criar a mensagem de "não há imagens"
  noImagesMessage = document.createElement('div');
  noImagesMessage.className = 'no-images-message';
  noImagesMessage.style.position = 'absolute';
  noImagesMessage.style.top = '0';
  noImagesMessage.style.left = '0';
  noImagesMessage.style.width = '100%';
  noImagesMessage.style.height = '100%';
  noImagesMessage.style.display = 'flex';
  noImagesMessage.style.flexDirection = 'column';
  noImagesMessage.style.justifyContent = 'center';
  noImagesMessage.style.alignItems = 'center';
  noImagesMessage.style.background = 'rgba(26, 26, 46, 0.95)';
  noImagesMessage.style.textAlign = 'center';
  noImagesMessage.style.padding = '20px';
  noImagesMessage.style.boxSizing = 'border-box';
  noImagesMessage.style.zIndex = '1004';

  // Ícone para a mensagem
  const icon = document.createElement('i');
  icon.className = 'fas fa-street-view';
  icon.style.fontSize = '48px';
  icon.style.color = '#e6a23c';
  icon.style.marginBottom = '15px';

  // Texto para a mensagem
  const text = document.createElement('p');
  text.textContent = 'Não há imagens de Street View disponíveis para esta localização.';
  text.style.fontSize = '14px';
  text.style.color = '#909399';
  text.style.margin = '0';
  text.style.maxWidth = '80%';

  // Adicionar tudo ao DOM
  noImagesMessage.appendChild(icon);
  noImagesMessage.appendChild(text);
  streetViewContainer.appendChild(panoContainer);
  streetViewContainer.appendChild(noImagesMessage);
  document.body.appendChild(streetViewContainer);

  isInitialized = true;
};

// Função para criar e inicializar Street View
const initializeStreetView = () => {
  try {
    // Verificar que temos Google Maps e um ID de dispositivo
    if (!window.google || !window.google.maps || !route.params.deviceId) {
      console.log("Não é possível inicializar Street View - falta API ou ID");
      return;
    }

    // Criar os elementos DOM se não existem
    if (!isInitialized) {
      createDomElements();
    }

    // Tornar visível o container
    if (streetViewContainer) {
      streetViewContainer.style.display = 'block';
    }

    // Limpar o container antes de inicializar
    while (panoContainer.firstChild) {
      panoContainer.removeChild(panoContainer.firstChild);
    }

    // Ocultar mensagem de erro por padrão
    showNoImagesMessage.value = false;
    if (noImagesMessage) {
      noImagesMessage.style.display = 'none';
    }

    // Obter posição do dispositivo
    const deviceId = parseInt(route.params.deviceId);
    const position = store.getters['devices/getPosition'](deviceId);

    if (!position) {
      console.log("Não há posição para o dispositivo:", deviceId);
      showNoImagesMessage.value = true;
      return;
    }

    // Criar serviço de Street View se não existe
    if (!streetViewService) {
      streetViewService = new window.google.maps.StreetViewService();
    }

    // Verificar coordenadas
    const lat = parseFloat(position.latitude);
    const lng = parseFloat(position.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      console.log("Coordenadas inválidas:", position);
      showNoImagesMessage.value = true;
      return;
    }

    // Verificar disponibilidade de imagens
    streetViewService.getPanorama({
      location: {lat, lng},
      radius: 50,
      source: window.google.maps.StreetViewSource.OUTDOOR
    }, (data, status) => {
      if (status === window.google.maps.StreetViewStatus.OK && data && data.location) {
        // Há imagens disponíveis
        showNoImagesMessage.value = false;
        if (noImagesMessage) {
          noImagesMessage.style.display = 'none';
        }

        // Criar panorama
        panorama = new window.google.maps.StreetViewPanorama(panoContainer, {
          pano: data.location.pano,
          visible: true,
          pov: {
            heading: parseFloat(position.course) || 0,
            pitch: 10
          },
          addressControl: false,
          disableDefaultUI: true,
          disableDoubleClickZoom: true
        });

        // Expor panorama globalmente
        window.$pano = panorama;

        // Configurar atualização
        setupPanoramaUpdate();
      } else {
        // Não há imagens disponíveis
        showNoImagesMessage.value = true;
        if (noImagesMessage) {
          noImagesMessage.style.display = 'flex';
        }
        console.log("Não há imagens de Street View para esta localização");
      }
    });
  } catch (error) {
    console.error("Erro ao inicializar Street View:", error);
    showNoImagesMessage.value = true;
  }
};

// Configurar atualização periódica
const setupPanoramaUpdate = () => {
  // Limpar intervalo anterior se existe
  if (checkInterval) {
    clearInterval(checkInterval);
  }

  // Criar novo intervalo
  checkInterval = setInterval(() => {
    updatePanorama();
  }, 2000); // Atualizar a cada 2 segundos
};

// Função para atualizar o panorama
const updatePanorama = () => {
  try {
    if (!panorama || !route.params.deviceId) return;

    const deviceId = parseInt(route.params.deviceId);
    const position = store.getters['devices/getPosition'](deviceId);

    if (!position) return;

    // Atualizar posição
    const lat = parseFloat(position.latitude);
    const lng = parseFloat(position.longitude);
    const heading = parseFloat(position.course) || 0;

    if (isNaN(lat) || isNaN(lng)) return;

    // Verificar se há imagens na nova posição
    streetViewService.getPanorama({
      location: {lat, lng},
      radius: 50,
      source: window.google.maps.StreetViewSource.OUTDOOR
    }, (data, status) => {
      if (status === window.google.maps.StreetViewStatus.OK && data && data.location) {
        // Há imagens disponíveis
        showNoImagesMessage.value = false;
        if (noImagesMessage) {
          noImagesMessage.style.display = 'none';
        }

        // Atualizar panorama com o novo pano
        panorama.setPano(data.location.pano);

        // Atualizar POV
        panorama.setPov({
          heading: heading,
          pitch: 10
        });
      } else {
        // Não há imagens disponíveis
        showNoImagesMessage.value = true;
        if (noImagesMessage) {
          noImagesMessage.style.display = 'flex';
        }
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar panorama:", error);
  }
};

// Função global para atualizar o panorama
window.$updatePano = (id) => {
  if (parseInt(route.params.deviceId) === id) {
    updatePanorama();
  }
};

// Limpar e reinicializar quando muda a visibilidade
watch(isVisible, (newValue) => {
  if (newValue) {
    // Se ativar Street View, inicializá-lo
    setTimeout(() => {
      loadGoogleMapsAPI();
    }, 100);
  } else {
    // Se desativar, ocultar o container e limpar
    if (streetViewContainer) {
      streetViewContainer.style.display = 'none';
    }
    cleanupStreetView();
  }
});

// Reagir a mudanças no ID do dispositivo
watch(() => route.params.deviceId, () => {
  if (isVisible.value) {
    initializeStreetView();
  }
});

// Carregar a API do Google Maps
const loadGoogleMapsAPI = () => {
  if (!window.google || !window.google.maps) {
    const gkey = store.getters['server/getAttribute']('google_api');
    if (!gkey) {
      console.error("Não há Google API Key configurada");
      showNoImagesMessage.value = true;
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${gkey}&callback=initGoogleMapsCallback`;
    script.async = true;
    script.defer = true;

    // Callback global para inicializar quando a API estiver carregada
    window.initGoogleMapsCallback = () => {
      initializeStreetView();
      delete window.initGoogleMapsCallback;
    };

    document.head.appendChild(script);
  } else {
    // Se já estiver carregada, inicializar diretamente
    initializeStreetView();
  }
};

// Função para limpar Street View
const cleanupStreetView = () => {
  // Parar intervalo de atualização
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }

  // Limpar referências
  panorama = null;
  streetViewService = null;
  window.$pano = null;

  // Limpar container de panorama
  if (panoContainer) {
    while (panoContainer.firstChild) {
      panoContainer.removeChild(panoContainer.firstChild);
    }
  }
};

// Função para destruir completamente os elementos DOM
const destroyDomElements = () => {
  cleanupStreetView();

  // Remover o container principal do DOM
  if (streetViewContainer && document.body.contains(streetViewContainer)) {
    document.body.removeChild(streetViewContainer);
  }

  // Resetar todas as referências
  streetViewContainer = null;
  panoContainer = null;
  noImagesMessage = null;
  isInitialized = false;
};

// Inicialização ao montar
onMounted(() => {
  if (isVisible.value) {
    loadGoogleMapsAPI();
  }
});

// Limpeza ao desmontar
onBeforeUnmount(() => {
  destroyDomElements();
});
</script>

<style scoped>
/* CSS aplicado diretamente aos elementos DOM */
</style>
