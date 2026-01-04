# Análise Comparativa: History.vue

## Mapeamento do Nosso Projeto (Versao-tarkan-Jesse)

### Imports & Componentes

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `history.vue` | 640-700 | Vue 3 Composition API (ref, inject, onMounted, watch, computed, etc.) |
| `history.vue` | 650-680 | Element Plus: ElButton, ElForm, ElSelect, ElCard, ElMessage, etc. |
| `history.vue` | 700-720 | Componentes locais: `TimelinePoint.vue`, `RoutePlaybackControls.vue` |
| `history.vue` | 722-740 | Utils: `routeEventDetector`, `routeChapters`, `routeBookmarks`, `routeExportPremium`, `routeTelemetry`, `routeFeatureFlags`, `routeFailSafe` |
| `history.vue` | 745 | Composables: `useRouteMode`, `useRequestControl`, `useRouteBookmarks` |

### Injects/Provides

| Inject | Provido Por | Descrição |
|--------|-------------|-----------|
| `show-graphics` | kore-map.vue | Abre painel de gráficos |
| `showRouteMarkers` | kore-map.vue | Ref para mostrar/ocultar marcadores |
| `updateRoute` | kore-map.vue | Função para desenhar rota no mapa |
| `toggleHeatmap` | kore-map.vue | Habilita/desabilita mapa de calor |
| `isPlayingRoute` | kore-map.vue | Estado de reprodução |
| `routeColor` | kore-map.vue | Cor da rota |
| `setRouteColor` | kore-map.vue | Setter da cor da rota |
| `ROUTE_COLOR_OPTIONS` | kore-map.vue | Opções de cores |
| `previewRoutePoint` | kore-map.vue | Preview de ponto no mapa |

### Vuex Store (devices module)

| Getter/Mutation/Action | Uso |
|------------------------|-----|
| `store.state.devices.routePlayPoint` | Índice do ponto atual |
| `store.state.devices.deviceList` | Lista de dispositivos |
| `store.commit('devices/setRoutePlayPoint', idx)` | Sincroniza ponto com mapa |
| `store.dispatch('devices/setDeviceFilter', id)` | Filtra para device específico |
| `store.getters['server/getAttribute']` | Atributos do servidor |
| `store.getters['drivers/getDriverByUniqueId']` | Busca motorista |

### Funcionalidades Principais

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| **Virtualização (Windowing)** | ✅ | Performance para milhares de pontos |
| **Subcomponentes** | ✅ | TimelinePoint, RoutePlaybackControls |
| **Detecção de Eventos** | ✅ | Paradas, excesso velocidade, início/fim |
| **Capítulos de Viagem** | ✅ | Segmentação por paradas longas |
| **Bookmarks** | ✅ | Favoritos na rota |
| **Modo Premium/Basic** | ✅ | Feature flags |
| **Export Premium** | ✅ | PDF/Excel avançado |
| **Share Link** | ✅ | Compartilhar rota via URL |
| **Telemetria** | ✅ | Métricas de performance |
| **Feature Flags** | ✅ | Habilitar/desabilitar recursos |
| **Fail-Safe** | ✅ | Limites de segurança |

---

## Mapeamento do Outro Projeto (Tarkan-Mit-2025 - Argentino Dark)

### Imports & Componentes

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `history.vue` | 525-545 | Vue 3 Options API (defineComponent, setup) |
| `history.vue` | 535-550 | Element Plus: ElCard, ElButton, ElForm, ElSelect, ElSwitch, ElDialog |
| `history.vue` | 525-530 | file-saver (saveAs), html2pdf.js, dayjs |
| `history.vue` | 530 | FontAwesome icons |
| `history.vue` | 520 | Componente filho: `PdfRouteReport.vue` |

### Injects/Provides

| Inject | Provido Por | Descrição |
|--------|-------------|-----------|
| `show-graphics` | kore-map.vue | Abre painel de gráficos |
| `updateRoute` | kore-map.vue | Função para desenhar rota |

### Vuex Store

| Getter/Mutation/Action | Uso |
|------------------------|-----|
| `store.state.devices.routePlayPoint` | Índice do ponto atual |
| `store.state.devices.deviceList` | Lista de dispositivos (objeto, não array) |
| `store.state.devices.showRouteMarkers` | Estado global dos marcadores |
| `store.commit('devices/setRoutePlayPoint', idx)` | Atualiza ponto |
| `store.commit('devices/setShowRouteMarkers', bool)` | Toggle marcadores |
| `store.dispatch('routes/loadRoute', params)` | Carrega rota via store action |
| `store.dispatch('devices/setDeviceFilter', id)` | Filtra device |
| `store.getters['drivers/getDriverByUniqueId']` | Busca motorista |

### Funcionalidades Principais

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| **Timeline com Pontos Ativos** | ✅ | Destaca ponto atual durante play |
| **Scroll Automático** | ✅ | Timeline acompanha reprodução |
| **Export KML** | ✅ | Google Earth |
| **Export PDF Detalhado** | ✅ | Via PdfRouteReport.vue |
| **Export PDF Tabular** | ✅ | Via PdfRouteReport.vue |
| **Export Excel** | ✅ | Via store action |
| **Vídeo de Alarme** | ✅ | Thumbnails + modal VideoJS |
| **Marcadores de Rota** | ✅ | Switch para exibir |

---

## 🔴 DIFERENÇAS CRÍTICAS

### 1. Movimento do Ícone do Veículo no Mapa

**Outro Projeto (Funciona):**
```javascript
// kore-map.vue - updatePositionFromTimeline()
const updatePositionFromTimeline = () => {
  if (routePlayPoint.value >= 0 && routePlayPoint.value < routePoints.value.length) {
    const point = routePoints.value[routePlayPoint.value];
    const device = store.getters['devices/getDevice'](parseInt(store.state.devices.applyFilters.showOnlyId));

    if (device && device.icon && device.icon[0]) {
      const animationDuration = 200 / playbackSpeed.value;
      // CHAVE: device.icon[0].moveTo() - usa o primeiro ícone do array
      device.icon[0].moveTo(L.latLng(point[0], point[1]), animationDuration);
      device.icon[0].options.img.rotate = point[3];
      
      store.commit("devices/setRoutePlayPoint", routePlayPoint.value);
    }
  }
};
```

**Nosso Projeto (Problema):**
```javascript
// kore-map.vue - updatePlaybackPosition()
const updatePlaybackPosition = () => {
  // ...
  if (device && device.icon) {
    const animationDuration = 200 / playbackSpeed.value;
    // PROBLEMA: device.icon.moveTo() - assume que icon é o objeto direto
    device.icon.moveTo(L.latLng(lat, lng), animationDuration);
    // ...
  }
};
```

**Problema:** No nosso projeto, `device.icon` pode ser um **array** (quando usa CanvaMarker com clusters), mas o código assume que é um objeto único. No outro projeto, acessa `device.icon[0]`.

---

### 2. Estrutura dos Dados de Rota

**Outro Projeto:**
- `routePoints` é um **array de objetos** retornados diretamente do servidor
- Cada ponto tem: `latitude`, `longitude`, `fixTime`, `speed`, `address`, `attributes`

**Nosso Projeto:**
- `routePoints` é um **array de arrays** após transformação para o mapa
- Formato: `[lat, lng, id, course]`
- Perde metadados importantes (fixTime, attributes, etc.)

---

### 3. Timeline com Destaque do Ponto Ativo

**Outro Projeto (Funciona):**
```vue
<!-- history.vue -->
<div 
  v-for="(p, k) in routePoints" 
  :key="`route-${routePoints.length}-point-${p.id}-${k}`"
  :class="['timeline-point', 'timeline-middle', { 'timeline-active': k === currentPlayingPoint }]"
>
  <!-- CSS classes específicas para estado ativo -->
</div>
```

CSS incluído:
```css
.timeline-active {
  background-color: rgba(64, 158, 255, 0.08);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}
.timeline-active::before {
  width: 3px;
  background-color: var(--el-color-primary);
}
.timeline-dot-active {
  animation: pulse-dot 1.5s infinite;
}
```

**Nosso Projeto:**
- Usa componente `TimelinePoint.vue`
- Props `is-active` e `is-visited` passadas
- Precisa verificar se o componente aplica os estilos corretamente

---

### 4. Carregamento de Dados

**Outro Projeto:**
```javascript
const loadRoute = async (g = false, e = false) => {
  const result = await store.dispatch('routes/loadRoute', params);
  
  if (!e) {
    // Limpa antes de atualizar (evita memory leak)
    routePoints.value = [];
    await new Promise(resolve => setTimeout(resolve, 50));
    routePoints.value = result.data;
    
    // Atualiza mapa se result.points existir
    if (result.points) {
      updateRoute(result.points);
    }
  }
};
```

**Nosso Projeto:**
```javascript
const loadRoute = async (showGraphAfter = false) => {
  const $traccar = window.$traccar;
  const response = await $traccar.loadRoute(deviceId, startDate, endDate, false);
  
  routePoints.value = safePoints;
  updateMapRoute(); // Transforma dados antes de enviar
};
```

**Diferença:** 
- Outro usa Vuex action `routes/loadRoute`
- Nosso usa `window.$traccar.loadRoute()` diretamente

---

### 5. Vídeos de Alarme

**Outro Projeto (Tem):**
- Suporte completo a vídeos de alarme
- Thumbnails gerados dinamicamente
- Modal VideoJS para reprodução
- Cache de URLs
- Listener para eventos do mapa

**Nosso Projeto (Não Tem):**
- Não implementado

---

### 6. Export de Arquivos

| Recurso | Outro Projeto | Nosso Projeto |
|---------|---------------|---------------|
| Excel via Store | ✅ `routes/loadRoute(params, isExport: true)` | ❌ CSV manual |
| PDF Detalhado | ✅ `PdfRouteReport.vue` | ✅ Premium PDF |
| PDF Tabular | ✅ `PdfRouteReport.vue` | ❌ |
| KML (Google Earth) | ✅ | ❌ |
| Share Link | ❌ | ✅ |

---

### 7. Controles de Reprodução

**Outro Projeto:**
- Controles embutidos no `kore-map.vue`
- Timeline visual com arrasto
- Velocidades: 0.5x, 1x, 2x, 4x
- Botões: play, pause, stop, restart, forward, backward

**Nosso Projeto:**
- Componente separado `RoutePlaybackControls.vue`
- Mais recursos: eventos na barra, tooltip durante scrub
- Velocidades: 0.5x, 1x, 2x, 4x
- Mesmos controles básicos

---

### 8. Virtualização

**Outro Projeto:**
- Sem virtualização
- Renderiza todos os pontos (pode travar com muitos pontos)
- `max-height: 500px` com overflow-y

**Nosso Projeto:**
- Virtualização completa (windowing)
- Apenas pontos visíveis são renderizados
- Performance superior com milhares de pontos

---

## 🔧 CORREÇÕES APLICADAS

### ✅ 1. Corrigido Acesso ao Ícone do Veículo (kore-map.vue)

**Arquivo:** `src/tarkan/components/kore-map.vue`

**Localização:** Função `updatePlaybackPosition()` (linha ~2054)

**Antes (PROBLEMA):**
```javascript
if (device && device.icon) {
  device.icon.moveTo(L.latLng(lat, lng), animationDuration);
}
```

**Depois (CORRIGIDO):**
```javascript
if (device && device.icon) {
  // Suporta tanto array (CanvaMarker) quanto objeto único
  const marker = Array.isArray(device.icon) ? device.icon[0] : device.icon;
  
  if (marker && typeof marker.moveTo === 'function') {
    const animationDuration = 200 / playbackSpeed.value;
    marker.moveTo(L.latLng(lat, lng), animationDuration);
    
    if (marker.options && marker.options.img) {
      marker.options.img.rotate = normalizeCourse(course);
    }
  }
}
```

**Também corrigido:** Função `markerClick()` (linha ~2881)

---

## 🔧 CORREÇÕES PENDENTES

### 2. Sync Timeline e Mapa ✅ JÁ IMPLEMENTADO

O watcher de `currentPlayingPoint` JÁ ESTÁ no código:

```javascript
// history.vue linhas 2030-2036
watch(currentPlayingPoint, (newValue) => {
  if (!isPlayingRoute.value) return;
  if (newValue > 0 && filteredRoutePoints.value.length > 0) {
    nextTick(() => scrollToActivePoint(newValue));
  }
});
```

### 3. Melhorar Estrutura de Dados

Manter metadados completos na rota para exibição na timeline:

```javascript
// Ao carregar rota
routePoints.value = response.data; // Mantém objetos completos

// Para o mapa, transformar apenas quando necessário
const updateMapRoute = () => {
  const coords = routePoints.value.map(p => [
    p.latitude, 
    p.longitude, 
    p.id, 
    p.course
  ]);
  updateRoute(coords);
};
```

---

## 📋 RESUMO DAS PRIORIDADES

| Prioridade | Tarefa | Status |
|------------|--------|--------|
| ✅ RESOLVIDO | Corrigir moveTo do ícone (array vs objeto) | **CORRIGIDO** |
| ✅ OK | Scroll automático da timeline | **JÁ IMPLEMENTADO** |
| 🟢 BAIXA | Export PDF Tabular | Já tem premium |
