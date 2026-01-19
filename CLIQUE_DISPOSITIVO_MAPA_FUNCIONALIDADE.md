# 📋 FUNCIONALIDADE COMPLETA: Clique no Dispositivo no Mapa

> **Documento de Portabilidade**  
> Lista completa de todos os componentes, funções e fluxo necessários para implementar o clique no dispositivo no mapa que abre o painel lateral e faz zoom.

---

## 🎯 OBJETIVO

Quando o usuário clica no ícone de um dispositivo no mapa, o sistema deve:

1. ✅ **Abrir o painel lateral** `devices.internal.vue` com detalhes do dispositivo
2. ✅ **Dar zoom suave** (flyTo) na posição do dispositivo
3. ✅ **Ativar follow mode** para acompanhar o dispositivo
4. ✅ **Trazer marker para frente** (bringToFront) para melhor visibilidade

---

## 📂 ARQUIVOS PRINCIPAIS

### **1. Componente do Marker**
- **Arquivo:** `src/tarkan/test/CanvaMarker.vue`
- **Responsabilidade:** Renderizar o marker e capturar eventos de clique
- **Evento disparado:** `@click="emit('click', evt)"`

### **2. Composable de Markers**
- **Arquivo:** `src/tarkan/composables/useMarkers.js`
- **Função:** `markerClick(e)` (linha 572)
- **Responsabilidade:** Processar clique, navegar rota, zoom e follow

### **3. Composable de Interação com Mapa**
- **Arquivo:** `src/tarkan/composables/useMapInteraction.js`
- **Função:** `flyTo(lat, lng, zoom, options)` (linha 228)
- **Responsabilidade:** Executar zoom suave (flyTo) no Leaflet

### **4. Componente Principal do Mapa**
- **Arquivo:** `src/tarkan/components/kore-map.vue`
- **Integração:** Linha 568 (`@click="markerClick"`)
- **Integração:** Linha 3579 (`const { markerClick } = markers`)

### **5. Painel Lateral de Detalhes**
- **Arquivo:** `src/templates/devices.internal.vue`
- **Responsabilidade:** Mostrar detalhes completos do dispositivo selecionado

### **6. Rotas**
- **Arquivo:** `src/routes.js`
- **Rota:** `/devices/:deviceId` (linha 16)
- **Componente:** `devices.internal.vue`

---

## 🔄 FLUXO COMPLETO DO CLIQUE

### **PASSO 1: Captura do Evento de Clique**

**Arquivo:** `src/tarkan/test/CanvaMarker.vue`

```vue
<template>
  <!-- Canvas marker com evento de clique -->
  <div 
    @click="handleClick"
    @contextmenu.prevent="handleContext"
    class="canva-marker"
  >
    <!-- Conteúdo do marker -->
  </div>
</template>

<script setup>
const emit = defineEmits(['click', 'mouseover', 'mouseout', 'contextmenu']);

const handleClick = (evt) => {
  emit('click', evt); // Dispara evento para kore-map.vue
};
</script>
```

**Evento disparado:**
```javascript
emit('click', { 
  target: { 
    options: { 
      id: deviceId // ID do dispositivo
    } 
  } 
})
```

---

### **PASSO 2: Binding do Evento no kore-map.vue**

**Arquivo:** `src/tarkan/components/kore-map.vue` (linha 568)

```vue
<kore-canva-marker 
  :map="map" 
  :zoom="zoom" 
  @click="markerClick"      <!-- ✅ Binding do evento -->
  @mouseover="markerOver"
  @mouseout="markerOut"
  @contextmenu="markerContext"
/>
```

**Integração com composable (linha 3579):**
```javascript
const markers = useMarkers({
  store,
  router,
  mapApi: mapInteraction,
  followApi: followDevice,
  runtimeApi,
  env: { isEnterprise, debugFlag },
  ui: { /* ... */ },
  utils: { KT }
});

const { markerOver, markerOut, markerClick, markerContext } = markers;
```

---

### **PASSO 3: Processamento do Clique (markerClick)**

**Arquivo:** `src/tarkan/composables/useMarkers.js` (linha 572-607)

```javascript
const markerClick = (e) => {
  if (disposed) return;
  
  try {
    // 1. Extrair deviceId do evento
    const deviceId = (e.target) ? e.target.options.id : e;
    const device = store.getters['devices/getDevice'](deviceId);
    
    // 2. Debug log (DEV only)
    devMark('markerClick', { deviceId, deviceName: device?.name });
    
    // 3. NAVEGAÇÃO: Abrir painel lateral (devices.internal.vue)
    router.push('/devices/' + deviceId);
    
    // 4. FOLLOW MODE: Ativar acompanhamento
    store.commit("devices/setFollow", deviceId);
    
    // 5. BRING TO FRONT: Trazer marker para frente
    if (device?.icon) {
      const marker = Array.isArray(device.icon) ? device.icon[0] : device.icon;
      if (marker?.bringToFront) {
        marker.bringToFront();
      }
    }
    
    // 6. ZOOM: Voar para a posição do dispositivo
    const position = store.getters["devices/getPosition"](device.id);
    const zoom = store.state.server.serverInfo?.attributes?.['web.selectZoom'] ?? 17;
    
    if (position) {
      mapApi.flyTo(
        position.latitude,
        position.longitude,
        zoom,
        { animate: true, duration: 0.8 }
      );
    }
  } catch (err) {
    console.warn('[useMarkers] markerClick error:', err);
  }
};
```

**Dependências necessárias:**
- ✅ `store` (Vuex/Pinia)
- ✅ `router` (Vue Router)
- ✅ `mapApi` (useMapInteraction)
- ✅ Getters: `devices/getDevice`, `devices/getPosition`
- ✅ Mutation: `devices/setFollow`

---

### **PASSO 4: Execução do Zoom (flyTo)**

**Arquivo:** `src/tarkan/composables/useMapInteraction.js` (linha 228-260)

```javascript
const flyTo = (lat, lng, zoom, options = { animate: true, duration: 1.5 }) => {
  // 1. Validar lifecycle
  if (!assertAlive('flyTo')) return;
  
  // 2. Validar coordenadas
  if (!isValidLatLng(lat, lng)) {
    devWarn('flyTo:invalid-coords', `flyTo: Coordenadas inválidas (${lat}, ${lng})`);
    return;
  }
  
  // 3. Ajustar zoom para range seguro (1-20)
  const safeZoom = clampZoom(zoom);
  if (safeZoom !== zoom) {
    devWarn('flyTo:zoom-clamped', `flyTo: Zoom ajustado de ${zoom} para ${safeZoom}`);
  }
  
  // 4. Verificar se mapa está pronto
  if (!isMapReady()) {
    devWarn('flyTo:not-ready', 'flyTo: Mapa não está pronto');
    return;
  }
  
  // 5. Executar flyTo do Leaflet
  safe('flyTo', () => {
    const mapObj = getMapObject();
    if (mapObj?.leafletObject?.flyTo) {
      mapObj.leafletObject.flyTo([lat, lng], safeZoom, {
        animate: options.animate ?? true,
        duration: options.duration ?? 1.5,
        easeLinearity: 0.25
      });
    }
  });
};
```

**Validações importantes:**
- ✅ Coordenadas válidas: lat (-90 a 90), lng (-180 a 180)
- ✅ Zoom válido: 1 a 20
- ✅ Mapa pronto: `mapObj.leafletObject` existe
- ✅ Lifecycle: não executar após cleanup

---

### **PASSO 5: Navegação e Abertura do Painel**

**Arquivo:** `src/routes.js` (linha 11-17)

```javascript
{
  path: '/devices',
  meta: { title: 'menu.user', shown: true },
  component: () => import("./components/empty-rv"),
  children: [
    { 
      path: '', 
      components: { default: () => import('./templates/devices') }, 
      meta: { closed: true, allowExpand: false, backBtn: '/home' }
    },
    { 
      path: ':deviceId',  // ✅ Rota dinâmica /devices/123
      components: { default: () => import('./templates/devices.internal') }, 
      meta: { mobileBottom: true, closed: true, backBtn: '/devices' }
    }
  ]
}
```

**Quando `router.push('/devices/123')` é executado:**
1. Vue Router navega para a rota `/devices/:deviceId`
2. Carrega o componente `devices.internal.vue`
3. Passa `deviceId` como parâmetro de rota (`$route.params.deviceId`)

---

### **PASSO 6: Renderização do Painel Lateral**

**Arquivo:** `src/templates/devices.internal.vue`

```vue
<template>
  <div v-if="device" data-testid="device-detail" class="device">
    <!-- Nome do dispositivo -->
    <div class="name name-relative" data-testid="device-name">
      {{ device.name }}
    </div>
    
    <!-- Ícones de resumo (ignição, bloqueio, etc) -->
    <DeviceResumeIcons
      :device="device"
      :position="position"
      :show-anchor="permissions.canAnchor"
      :is-anchored="isAnchored"
    />
    
    <!-- Informações detalhadas -->
    <div class="info info-flex border-bottom-dotted">
      <!-- Imagem do veículo -->
      <div class="flex-1 border-right-dotted flex-center">          
        <Device-Image 
          :id="device.id" 
          :category="device.category" 
          :allow-upload="true" 
        />
      </div>
      
      <!-- Velocidade -->
      <div class="flex-1">
        <div class="stat-label mt-10">
          <i class="fas fa-tachometer-alt"></i> {{ KT('device.positionSpeed') }}
        </div>
        <div class="stat-value-primary mt-10 mb-10">
          {{ $t('units.' + serverAttrs.speedUnit, { speed: position ? position.speed : 0 }) }}
        </div>
        
        <!-- RPM (se disponível) -->
        <div v-if="position && position.attributes['rpm']" class="border-bottom-dotted">
          <div class="stat-label mt-10">
            <i class="fas fa-tachometer-alt"></i> {{ KT('device.rpm') }}
          </div>
          <div class="stat-value-primary mt-10 mb-10">
            {{ position.attributes.rpm }} RPM
          </div>
        </div>
      </div>
    </div>
    
    <!-- Mais seções: câmera, motorista, status, etc -->
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

const route = useRoute();
const store = useStore();

// Obter deviceId da rota
const deviceId = computed(() => Number(route.params.deviceId));

// Obter device e position do store
const device = computed(() => store.getters['devices/getDevice'](deviceId.value));
const position = computed(() => store.getters['devices/getPosition'](deviceId.value));
</script>
```

---

## 🔧 COMPONENTES DE SUPORTE

### **1. Store - Mutation setFollow**

**Arquivo:** `src/store/modules/devices.js`

```javascript
mutations: {
  setFollow(state, deviceId) {
    state.isFollowingId = deviceId;
  }
}
```

### **2. Store - Getters**

```javascript
getters: {
  getDevice: (state) => (deviceId) => {
    if (!deviceId) return false;
    return state.deviceList[deviceId];
  },
  
  getPosition: (state) => (deviceId) => {
    if (!deviceId) return false;
    return state.positionsList[deviceId];
  }
}
```

### **3. DeviceResumeIcons Component**

**Arquivo:** `src/templates/devices.internal.vue` (dentro do template)

Exibe ícones de status:
- 🔑 Ignição (ligada/desligada)
- 🔒 Bloqueio (bloqueado/desbloqueado)
- ⚓ Âncora (ancorado/livre)
- 📡 Sinal GPS
- 🔋 Bateria

### **4. Device-Image Component**

**Arquivo:** Provavelmente `src/templates/device.image.vue`

Exibe imagem customizada do veículo ou ícone padrão por categoria.

---

## ⚙️ CONFIGURAÇÃO DO ZOOM

### **Nível de Zoom Padrão**

**Fonte:** `store.state.server.serverInfo.attributes['web.selectZoom']`

```javascript
const zoom = store.state.server.serverInfo?.attributes?.['web.selectZoom'] ?? 17;
```

**Fallback:** `17` (zoom médio - bairro)

**Range válido:** 1 a 20
- `1-5`: Mundo/continente
- `6-10`: País/região
- `11-15`: Cidade
- `16-18`: Bairro
- `19-20`: Rua

---

## 🐛 DEBUG E TROUBLESHOOTING

### **Ativar Debug de Markers**

```javascript
// No console do navegador:
localStorage.setItem('DEBUG_MARKERS', '1');
// Recarregar página

// Ver logs:
// [🔍 MARKERS DEBUG] markerClick: { deviceId: 123, deviceName: "Veículo Teste" }

// Desativar:
localStorage.removeItem('DEBUG_MARKERS');
```

### **Checklist de Problemas Comuns**

#### **❌ Clique não abre o painel**
1. ✅ Verificar se `router.push('/devices/' + deviceId)` é executado
2. ✅ Verificar se rota `/devices/:deviceId` existe em `routes.js`
3. ✅ Verificar se `devices.internal.vue` está sendo carregado
4. ✅ Verificar se `deviceId` é válido (não null/undefined)

#### **❌ Zoom não acontece**
1. ✅ Verificar se `position` existe para o dispositivo
2. ✅ Verificar se `mapApi.flyTo` está definido
3. ✅ Verificar se coordenadas são válidas (lat/lng)
4. ✅ Verificar console por erros: `flyTo: Mapa não está pronto`

#### **❌ Marker não vem para frente**
1. ✅ Verificar se `device.icon` existe
2. ✅ Verificar se `device.icon.bringToFront` é função
3. ✅ Verificar se marker está renderizado no DOM

#### **❌ Follow mode não ativa**
1. ✅ Verificar se `store.commit("devices/setFollow", deviceId)` é executado
2. ✅ Verificar se mutation `setFollow` existe no store
3. ✅ Verificar se `state.isFollowingId` é atualizado

---

## 📦 DEPENDÊNCIAS EXTERNAS

### **NPM Packages**
- `vue` (^3.0.0)
- `vue-router` (^4.0.0)
- `vuex` ou `pinia`
- `leaflet` (^1.7.1)
- `element-plus` (para ElMessage, ElMessageBox)

### **Composables Internos**
- `useMarkers.js`
- `useMapInteraction.js`
- `useFollowDevice.js`

### **Utils**
- `sanitize.js` (sanitização de texto)
- `i18n.js` (traduções)

---

## 🚀 CHECKLIST DE IMPLEMENTAÇÃO

Para portar esta funcionalidade para outra versão, você precisa:

### **1. Arquivos Obrigatórios**
- [ ] `src/tarkan/test/CanvaMarker.vue`
- [ ] `src/tarkan/composables/useMarkers.js`
- [ ] `src/tarkan/composables/useMapInteraction.js`
- [ ] `src/tarkan/components/kore-map.vue`
- [ ] `src/templates/devices.internal.vue`
- [ ] `src/routes.js` (adicionar rota `/devices/:deviceId`)

### **2. Store (Vuex/Pinia)**
- [ ] Module `devices`
- [ ] Mutation `setFollow`
- [ ] Getters `getDevice`, `getPosition`
- [ ] State `isFollowingId`, `deviceList`, `positionsList`

### **3. Integração no kore-map.vue**
- [ ] Import `useMarkers`
- [ ] Binding `@click="markerClick"`
- [ ] Provide `markerClick` para child components

### **4. Rotas**
- [ ] Rota `/devices/:deviceId`
- [ ] Componente `devices.internal.vue`
- [ ] Meta: `backBtn: '/devices'`

### **5. Testes**
- [ ] Clicar em marker abre painel
- [ ] Zoom funciona com coordenadas válidas
- [ ] Follow mode ativa
- [ ] Marker vem para frente
- [ ] Navegação de volta funciona

---

## 📝 NOTAS IMPORTANTES

### **Performance**
- Debounce de hover: 40ms (padrão) / 80ms (enterprise)
- Cache de tooltips: 500 entradas, TTL 30s
- Throttle de mapMove: 16ms (~60fps)

### **Segurança**
- Sanitização de texto via `sanitize.js`
- Validação de coordenadas (-90/90, -180/180)
- Validação de zoom (1-20)
- Rate limiting de logs (3s por key)

### **Acessibilidade**
- Teste de keyboard: Tab para focar marker, Enter para clicar
- ARIA labels nos markers
- Tooltip com informações essenciais

### **Mobile**
- `meta.mobileBottom: true` para painel aparecer na parte inferior
- Touch events compatíveis
- Zoom adaptativo para telas pequenas

---

## 🎓 ARQUITETURA E PADRÕES

### **Injeção de Dependências**
Todos os composables recebem dependências via parâmetros, nunca importam diretamente:

```javascript
// ✅ BOM
const markers = useMarkers({ store, router, mapApi });

// ❌ RUIM
import store from '@/store';
const markers = useMarkers();
```

### **Composable Puro**
- Zero lógica de negócio em `useMapInteraction.js`
- Apenas wrapper do Leaflet
- Validações e safety checks

### **Event Flow**
```
CanvaMarker (emite click)
  ↓
kore-map.vue (@click="markerClick")
  ↓
useMarkers.markerClick()
  ↓ (router.push)
devices.internal.vue (renderiza)
  ↓ (mapApi.flyTo)
useMapInteraction.flyTo()
  ↓
Leaflet.map.flyTo() (DOM)
```

---

## 📚 REFERÊNCIAS

- **Leaflet API:** https://leafletjs.com/reference.html#map-flyto
- **Vue Router:** https://router.vuejs.org/guide/essentials/dynamic-matching.html
- **Vuex Getters:** https://vuex.vuejs.org/guide/getters.html

---

## ✅ CONCLUSÃO

Esta funcionalidade envolve **6 arquivos principais**, **4 composables**, **1 rota**, e múltiplas integrações com o store. O fluxo completo é:

1. **Clique** → CanvaMarker emite evento
2. **Captura** → kore-map.vue recebe evento
3. **Processamento** → useMarkers.markerClick()
4. **Navegação** → router.push('/devices/123')
5. **Renderização** → devices.internal.vue mostra detalhes
6. **Zoom** → mapApi.flyTo() centraliza mapa
7. **Follow** → store.commit('setFollow') ativa acompanhamento

Todos os componentes seguem padrões de:
- ✅ Injeção de dependências
- ✅ Validação defensiva
- ✅ Cleanup garantido
- ✅ Debug DEV-only
- ✅ Rate limiting
- ✅ Safety checks

---

**Documento gerado em:** 16 de janeiro de 2026  
**Versão:** 1.0  
**Autor:** GitHub Copilot
