# HISTORY_DEPENDENCY_MAP_OURS.md
# Mapeamento Minucioso do history.vue (Versao-tarkan-Jesse)

## 📦 1. IMPORTS & COMPONENTES

### 1.1 Vue Core & Ecosystem
```javascript
// Linha 646
import { ref, inject, onMounted, watch, onBeforeUnmount, nextTick, computed, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
```

### 1.2 Element Plus (UI Components)
```javascript
// Linhas 618-636
import {
  ElButton, ElForm, ElSelect, ElOption, ElFormItem, ElSwitch, 
  ElInput, ElInputNumber, ElDatePicker, ElDropdown, 
  ElDropdownMenu, ElDropdownItem, ElCard, ElMessage
} from 'element-plus';

// CSS Imports (linhas 612-635)
import 'element-plus/es/components/button/style/css';
import 'element-plus/es/components/icon/style/css';
import 'element-plus/es/components/tooltip/style/css';
import 'element-plus/es/components/form/style/css';
import 'element-plus/es/components/form-item/style/css';
import 'element-plus/es/components/select/style/css';
import 'element-plus/es/components/option/style/css';
import 'element-plus/es/components/switch/style/css';
import 'element-plus/es/components/input/style/css';
import 'element-plus/es/components/input-number/style/css';
import 'element-plus/es/components/message-box/style/css';
import 'element-plus/es/components/date-picker/style/css';
import 'element-plus/es/components/dropdown/style/css';
import 'element-plus/es/components/dropdown-menu/style/css';
import 'element-plus/es/components/dropdown-item/style/css';
import 'element-plus/es/components/card/style/css';
import 'element-plus/es/components/message/style/css';
```

### 1.3 Componentes Locais (Subcomponentes)
```javascript
// Linha 651
import TimelinePoint from './components/TimelinePoint.vue';

// Linha 654 - Controles de Reprodução
import RoutePlaybackControls from '@/components/RoutePlaybackControls.vue';
```

### 1.4 Utils Internos
```javascript
// Linha 657 - Detector de Eventos
import { detectRouteEvents, createEventIndexMap } from '@/utils/routeEventDetector';

// Linha 660 - Capítulos e Resumo
import { buildRouteChapters, buildRouteSummary } from '@/utils/routeChapters';

// Linha 663 - Composable de Bookmarks
import { useRouteBookmarks } from '@/composables/useRouteBookmarks';

// Linhas 666-671 - Export Premium + Share
import { 
  generatePremiumPdfHtml, 
  generateExcelCsv,
  parseSharePayload,
  generateShareUrl 
} from '@/utils/routeExportPremium';

// Linhas 674-679 - Telemetria
import { 
  startMeasure, 
  endMeasure,
  incrementCounter
} from '@/utils/routeTelemetry';

// Linha 680 - Feature Flags
import { isEnabled, getFlag } from '@/utils/routeFeatureFlags';

// Linhas 681-686 - Fail-Safe
import { 
  enforceLimits, 
  guardExport,
  limitEvents,
  limitChapters
} from '@/utils/routeFailSafe';

// Linha 689 - Modo Basic vs Premium
import { useRouteMode } from '@/composables/useRouteMode';

// Linha 692 - Request Control
import { getDefaultDateRange } from '@/composables/useRequestControl';
```

---

## 🧩 2. CHILD COMPONENTS (Template)

### 2.1 TimelinePoint
| Prop | Tipo | Descrição |
|------|------|-----------|
| `point` | Object | Dados do ponto (latitude, longitude, fixTime, speed, address, etc.) |
| `index` | Number | Índice no array filteredRoutePoints |
| `type` | String | 'start' \| 'middle' \| 'end' |
| `is-active` | Boolean | Se é o ponto sendo reproduzido |
| `is-visited` | Boolean | Se já foi visitado durante reprodução |
| `speed-unit` | String | Unidade de velocidade ('km/h', 'mph', etc.) |
| `event` | Object \| null | Evento associado ao ponto |
| `bookmarked` | Boolean | Se está marcado como favorito |

**Events emitidos:**
- `@seek` → `onSeekToPoint(realIndex)`
- `@toggle-bookmark` → `onToggleBookmark(point, index)`

### 2.2 RoutePlaybackControls
| Prop | Tipo | Descrição |
|------|------|-----------|
| `total-points` | Number | Total de pontos filtrados |
| `points` | Array | Array de pontos filtrados |
| `events` | Array | Array de eventos detectados |

**Events emitidos:**
- `@seek` → `onSeekToPoint(realIndex)`

---

## 🔌 3. INJECTS & PROVIDES

### 3.1 Injects Consumidos

| Chave | Tipo | Provedor | Uso |
|-------|------|----------|-----|
| `show-graphics` | Ref | kore-map.vue | Abre painel de gráficos via `.showGraphic(points)` |
| `showRouteMarkers` | Ref\<boolean\> | kore-map.vue | Toggle de marcadores de rota no mapa |
| `updateRoute` | Function | kore-map.vue | `updateRoute(coords)` - Desenha rota no mapa |
| `toggleHeatmap` | Function | kore-map.vue | Habilita/desabilita mapa de calor |
| `isPlayingRoute` | Ref\<boolean\> | kore-map.vue | Estado de reprodução (fallback: `ref(false)`) |
| `routeColor` | Ref\<string\> | kore-map.vue | Cor atual da rota |
| `setRouteColor` | Function | kore-map.vue | Setter da cor da rota |
| `ROUTE_COLOR_OPTIONS` | Array | kore-map.vue | Array de opções de cores disponíveis |
| `previewRoutePoint` | Function \| null | kore-map.vue | Preview de ponto no mapa (marker + panTo) |
| `showHeatmap` | Ref\<boolean\> \| null | kore-map.vue | Estado do mapa de calor (com fallback) |

**Código de inject (linhas 724-747):**
```javascript
const showGraphicsRef = inject('show-graphics');
const showRouteMarkers = inject('showRouteMarkers');
const updateRoute = inject('updateRoute');
const toggleHeatmap = inject('toggleHeatmap');
const isPlayingRoute = inject('isPlayingRoute', ref(false));
const routeColorRef = inject('routeColor');
const setRouteColor = inject('setRouteColor');
const ROUTE_COLOR_OPTIONS = inject('ROUTE_COLOR_OPTIONS');
const previewRoutePoint = inject('previewRoutePoint', null);
const injectedShowHeatmap = inject('showHeatmap', null);
const showHeatmap = injectedShowHeatmap ?? ref(false);
```

---

## 🗃️ 4. VUEX DEPENDENCIES

### 4.1 Store Instance
```javascript
const store = useStore(); // Linha 721
```

### 4.2 State Access

| Path | Tipo | Uso |
|------|------|-----|
| `store.state.devices.routePlayPoint` | Number | Índice do ponto atual sendo reproduzido |
| `store.state.devices.deviceList` | Array \| Object | Lista de dispositivos |
| `store.state.devices.devicesList` | Array | Alias para deviceList |
| `store.state.devices.list` | Array | Alias para deviceList |
| `store.state.devices.devices` | Array | Alias para deviceList |
| `store.state.devices.showCalor` | Boolean | Estado do mapa de calor |
| `store.state.drivers.driversList` | Array | Lista de motoristas |
| `store.state.drivers.list` | Array | Alias para driversList |

### 4.3 Getters

| Getter | Retorno | Uso |
|--------|---------|-----|
| `store.getters['server/getAttribute']('speedUnit', 'speedUnit')` | String | Unidade de velocidade do servidor |
| `store.getters['devices/getPosition'](deviceId)` | Object | Posição atual do dispositivo |
| `store.getters['drivers/getDriverByUniqueId'](uniqueId)` | Object | Busca motorista por uniqueId |
| `store.getters['drivers/getDriverById'](id)` | Object | Busca motorista por ID |

### 4.4 Mutations (Commits)

| Mutation | Payload | Uso |
|----------|---------|-----|
| `devices/setRoutePlayPoint` | Number (índice) | Sincroniza ponto com mapa durante seek |

**Código (linha 913):**
```javascript
store.commit('devices/setRoutePlayPoint', realIndex);
```

### 4.5 Actions (Dispatch)

| Action | Payload | Uso |
|--------|---------|-----|
| `reports/updateReportData` | `{ deviceId, date }` | Sync form com store de reports |
| `devices/setDeviceFilter` | Number (deviceId) | Oculta outros devices, foca neste |
| `devices/resetDeviceStates` | - | Limpa estados ao desmontar |

---

## 🛣️ 5. VUE ROUTER

### 5.1 Acesso
```javascript
const route = useRoute(); // Linha 722
```

### 5.2 Query Params Usados

| Param | Tipo | Uso |
|-------|------|-----|
| `route.query.deviceId` | String \| Number | Auto-load de rota ao montar |
| `route.query.share` | String | Payload codificado do share link |

### 5.3 Auto-Load via Query
```javascript
// Watcher (linhas 2036-2041)
watch(() => route.query.deviceId, () => {
  if (route.query.deviceId) {
    formData.value.deviceId = parseInt(route.query.deviceId);
    loadRoute();
  }
});

// onMounted (linhas 2061-2063)
if (route.query.deviceId) {
  formData.value.deviceId = parseInt(route.query.deviceId);
  loadRoute();
}
```

### 5.4 Share Link Handling
```javascript
// onMounted (linhas 2053-2060)
const shareResult = restoreFromShareLink();
if (shareResult?.shouldLoad) {
  nextTick(() => {
    loadRoute().then(() => {
      if (shareResult.seekIndex !== null && shareResult.seekIndex >= 0) {
        setTimeout(() => onSeekToPoint(shareResult.seekIndex), 500);
      }
    });
  });
}
```

---

## 📊 6. STATE & COMPUTED

### 6.1 Refs (Estado Reativo)

| Ref | Tipo | Default | Descrição |
|-----|------|---------|-----------|
| `timelineScrollRef` | DOM Ref | null | Referência ao container de scroll virtual |
| `timelineKey` | Number | 0 | Key para forçar remount limpo |
| `formData` | Object | `{ deviceId: '', date: [defaultStart, defaultEnd] }` | Dados do formulário |
| `loadingState` | String | 'idle' | 'idle' \| 'loading' \| 'export_ok' \| 'error' |
| `searchQuery` | String | '' | Busca por endereço |
| `eventFilter` | String | 'all' | 'all' \| 'moving' \| 'stopped' \| 'fast' |
| `customSpeed` | Number | 80 | Limite de velocidade para filtro 'fast' |
| `removeDuplicates` | Boolean | false | Remover pontos duplicados |
| `routePoints` | Array | [] | Pontos brutos da rota (do backend) |
| `currentRouteColor` | String | '#05a7e3' | Cor atual da rota |
| `isLoading` | Boolean | false | Estado de loading do botão |
| `hasLoadedOnce` | Boolean | false | Flag para exibir estados vazios |
| `playbackSpeed` | Number | 1 | Velocidade de reprodução (share link) |
| `followPlay` | Boolean | true | Seguir reprodução (share link) |
| `insightsActiveTab` | String | 'summary' | Tab ativa no painel premium |
| `virtualScrollTop` | Number | 0 | Posição de scroll para virtualização |
| `containerHeight` | Number | 400 | Altura do container (medida no mount) |

### 6.2 Computed

| Computed | Retorno | Descrição |
|----------|---------|-----------|
| `currentPlayingPoint` | Number | `store.state.devices?.routePlayPoint \|\| 0` |
| `speedUnit` | String | Unidade de velocidade do servidor |
| `devicesList` | Array | Lista normalizada de dispositivos (suporta vários formatos) |
| `isFormValid` | Boolean | Validação do formulário |
| `selectedDevice` | Object \| null | Dispositivo selecionado |
| `currentDriverName` | String \| null | Nome do motorista atual |
| `filteredRoutePoints` | Array | Pontos filtrados por busca/evento/duplicatas |
| `stats` | Object | `{ totalDistance, avgSpeed, duration, stopTime }` |
| `routeEvents` | Array | Eventos detectados (paradas, velocidade, início/fim) |
| `routeEventIndexMap` | Map | Mapa índice → eventos para lookup O(1) |
| `routeSummary` | Object \| null | Resumo executivo da rota |
| `routeChapters` | Array | Capítulos da viagem |
| `middlePoints` | Array | Pontos intermediários (sem primeiro e último) |
| `virtualScrollState` | Object | Estado da virtualização (startIndex, endIndex, styles) |
| `visibleMiddlePoints` | Array | Pontos visíveis com índice real preservado |
| `routeColorOptions` | Array | Opções de cores com i18n |
| `dateShortcuts` | Array | Atalhos de data para o date-picker |

---

## ⚡ 7. KEY METHODS

### 7.1 Carregamento de Dados

#### `loadRoute(showGraphAfter = false)`
**Linhas:** 1320-1380  
**Descrição:** Carrega rota do backend com controle de concorrência

```javascript
const loadRoute = async (showGraphAfter = false) => {
  if (!validateForm()) return;
  
  startMeasure('loadRoute');
  const thisRequestId = ++loadRouteRequestId;
  
  const $traccar = window.$traccar;
  const response = await $traccar.loadRoute(deviceId, startDate, endDate, false);
  
  // Race condition guard
  if (thisRequestId !== loadRouteRequestId) return;
  
  // Fail-safe limits
  const { points: safePoints, truncated, warning } = enforceLimits(response.data, {
    warningLimit: getFlag('MAX_POINTS_WARNING'),
    hardLimit: getFlag('MAX_POINTS_HARD_LIMIT')
  });
  
  routePoints.value = safePoints;
  updateMapRoute();
  
  store.dispatch('devices/setDeviceFilter', deviceId);
};
```

#### `updateMapRoute()`
**Linha:** 1315  
**Descrição:** Transforma pontos e envia para o mapa

```javascript
const updateMapRoute = () => {
  const coords = filteredRoutePoints.value.map(p => [p.latitude, p.longitude, p.id, p.course]);
  updateRoute(coords);
};
```

### 7.2 Playback / Seek

#### `onSeekToPoint(realIndex)`
**Linhas:** 900-921  
**Descrição:** Seek/Preview para um ponto da timeline

```javascript
const onSeekToPoint = (realIndex) => {
  const point = filteredRoutePoints.value[realIndex];
  
  // Atualizar store para sincronizar timeline
  store.commit('devices/setRoutePlayPoint', realIndex);
  
  // Preview no mapa
  if (previewRoutePoint) {
    previewRoutePoint({ point, index: realIndex });
  }
  
  scrollToActivePoint(realIndex);
};
```

#### `scrollToActivePoint(index)`
**Linhas:** 879-892  
**Descrição:** Scroll para ponto específico (sync com mapa)

```javascript
const scrollToActivePoint = (index) => {
  if (!timelineScrollRef.value) return;
  
  const virtualIndex = index - 1;
  const targetTop = virtualIndex * VIRTUAL_ITEM_HEIGHT - (containerHeight.value / 2) + (VIRTUAL_ITEM_HEIGHT / 2);
  
  timelineScrollRef.value.scrollTo({
    top: Math.max(0, targetTop),
    behavior: 'smooth'
  });
};
```

### 7.3 Exports

| Método | Linhas | Descrição |
|--------|--------|-----------|
| `exportCsv()` | 1487-1533 | Export CSV básico (separador `;`, BOM UTF-8) |
| `exportPrintPdf()` | 1535-1628 | Export PDF via print window |
| `exportPdfPremium()` | 1664-1724 | Export PDF Premium (summary, chapters, events) |
| `exportExcelPremium()` | 1726-1795 | Export Excel Premium (CSV multi-seção) |
| `copyShareLink()` | 1830-1870 | Gera e copia link de compartilhamento |

### 7.4 Share Link

#### `restoreFromShareLink()`
**Linhas:** 1875-1925  
**Descrição:** Restaura estado a partir de share param na URL

```javascript
const restoreFromShareLink = () => {
  const shareParam = route.query.share;
  if (!shareParam) return false;
  
  const payload = parseSharePayload(shareParam);
  if (!payload) return false;
  
  // Aplicar estado: deviceId, dateRange, filters, routeColor, etc.
  // ...
  
  // Limpar share param da URL
  window.history.replaceState({}, '', url.toString());
  
  return { shouldLoad: true, seekIndex, bookmarkIndexes };
};
```

---

## 👀 8. WATCHERS & LIFECYCLE

### 8.1 Watchers

| Watch | Trigger | Efeito |
|-------|---------|--------|
| `formData` (deep) | Mudança no form | `sendDataToStore()` - Sync com store de reports |
| `[searchQuery, eventFilter, customSpeed, removeDuplicates]` | Mudança em filtros | Debounce 250ms → `updateMapRoute()` |
| `showHeatmap` | Toggle heatmap | `toggleHeatmap(enabled)` + atualiza store |
| `currentPlayingPoint` | Mudança no índice de reprodução | `scrollToActivePoint(newValue)` se estiver tocando |
| `route.query.deviceId` | Mudança na query | Auto-load da rota |

### 8.2 Lifecycle

#### `onMounted()`
**Linhas:** 2045-2068
```javascript
onMounted(() => {
  // 1. Medir altura do container para virtualização
  if (timelineScrollRef.value) {
    containerHeight.value = timelineScrollRef.value.clientHeight || 400;
  }
  
  // 2. Verificar share link na URL
  const shareResult = restoreFromShareLink();
  
  // 3. Auto-load se share link ou query.deviceId
  if (shareResult?.shouldLoad) {
    nextTick(() => loadRoute().then(...));
  } else if (route.query.deviceId) {
    formData.value.deviceId = parseInt(route.query.deviceId);
    loadRoute();
  }
});
```

#### `onBeforeUnmount()`
**Linhas:** 2070-2080
```javascript
onBeforeUnmount(() => {
  // 1. Limpar debounce timer
  if (debounceTimer) clearTimeout(debounceTimer);
  
  // 2. Invalidar requests pendentes
  loadRouteRequestId++;
  
  // 3. Resetar estados do store
  store.dispatch('devices/resetDeviceStates');
});
```

---

## 🖼️ 9. UI SURFACE (Template)

### 9.1 Estrutura Principal

```
┌─────────────────────────────────────────────────────────────┐
│ el-card.history-card                                        │
│   ├─ el-form (Formulário)                                   │
│   │   ├─ el-select (Dispositivo)                            │
│   │   ├─ el-date-picker (Período - datetimerange)           │
│   │   └─ .view-options                                      │
│   │       ├─ el-switch (Marcadores)                         │
│   │       ├─ el-switch (Mapa de Calor)                      │
│   │       └─ el-select (Cor da Rota)                        │
│   └─ .history-actions                                       │
│       ├─ el-button (Toggle Premium/Basic) [condicional]     │
│       ├─ el-dropdown (Export: PDF, Excel, Premium, Share)   │
│       ├─ el-button (Carregar Rota)                          │
│       └─ el-button (Gráfico)                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ESTADOS VAZIOS (el-alert)                                   │
│   ├─ "Selecione um dispositivo"                             │
│   ├─ "Selecione o período"                                  │
│   └─ "Sem dados para este período" + botões de período      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ el-card.stats-card (Estatísticas)                           │
│   ├─ .stats-header (Título + Driver Pill)                   │
│   ├─ .stats-container                                       │
│   │   ├─ Distância Total                                    │
│   │   ├─ Velocidade Média                                   │
│   │   ├─ Duração                                            │
│   │   └─ Tempo Parado                                       │
│   └─ .stats-disclaimer                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ el-card.premium-insights-card [Premium Mode Only]           │
│   └─ el-tabs                                                │
│       ├─ Tab: Resumo Executivo (summary-grid)               │
│       ├─ Tab: Capítulos (chapters-list)                     │
│       └─ Tab: Favoritos (bookmarks-list)                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ el-card.timeline-filters (Filtros)                          │
│   ├─ el-input (Busca por endereço)                          │
│   ├─ el-select (Tipo de evento)                             │
│   ├─ el-input-number (Velocidade) [se filter=fast]          │
│   ├─ el-switch (Remover duplicatas)                         │
│   └─ Contador de pontos                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ .timeline-container                                         │
│   ├─ Loading / Error / Empty states                         │
│   ├─ RoutePlaybackControls (barra de progresso + eventos)   │
│   ├─ TimelinePoint (Start)                                  │
│   ├─ .timeline-scroll (Virtual Scroll Container)            │
│   │   └─ TimelinePoint v-for (Middle - virtualizados)       │
│   └─ TimelinePoint (End)                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌐 10. RUNTIME GLOBALS

### 10.1 Window Objects Esperados

| Global | Tipo | Uso |
|--------|------|-----|
| `window.$traccar` | Object | API client - `$traccar.loadRoute(deviceId, start, end, false)` |
| `window.$showTip` | Function | Tooltip global - `$showTip(event, text)` |
| `window.$hideTip` | Function | Tooltip global - `$hideTip(event, text)` |
| `window.DEBUG_ROUTE` | Boolean | Flag de debug (não usado diretamente, mas disponível) |
| `window.__OBSERVABILITY__` | Object | Telemetria (via routeTelemetry.js) |

### 10.2 Constantes de Configuração

```javascript
const PERF_DEBUG = process.env.NODE_ENV === 'development' && false;
const DEBUG_HISTORY = process.env.NODE_ENV === 'development';
const DEBOUNCE_DELAY = 250; // ms
const VIRTUAL_ITEM_HEIGHT = 65; // px
const VIRTUAL_BUFFER = 8; // itens extras
```

---

## 🔗 11. ENDPOINTS / BACKENDS

### 11.1 Via window.$traccar

| Método | Parâmetros | Retorno | Descrição |
|--------|------------|---------|-----------|
| `$traccar.loadRoute(deviceId, startDate, endDate, false)` | deviceId, Date, Date, Boolean | `{ data: Point[] }` | Carrega pontos da rota |

### 11.2 Estrutura do Point (Retorno)

```typescript
interface Point {
  id: number;
  latitude: number;
  longitude: number;
  fixTime: string; // ISO 8601
  speed: number; // km/h
  course: number; // graus
  address?: string;
  attributes?: {
    driverUniqueId?: string;
    driverId?: number;
    ignition?: boolean;
    // ... outros atributos
  };
}
```

### 11.3 API Traccar Original (Indireta)
O `window.$traccar.loadRoute()` internamente chama:
```
GET /api/positions
  ?deviceId={deviceId}
  &from={startDate.toISOString()}
  &to={endDate.toISOString()}
```

---

## 📁 12. ARQUIVOS RELACIONADOS

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/templates/history.vue` | Vue Component | Este componente (2696 linhas) |
| `src/templates/components/TimelinePoint.vue` | Vue Component | Ponto individual da timeline |
| `src/components/RoutePlaybackControls.vue` | Vue Component | Controles de reprodução (766 linhas) |
| `src/utils/routeEventDetector.js` | Util | Detecção de eventos na rota |
| `src/utils/routeChapters.js` | Util | Segmentação em capítulos |
| `src/utils/routeExportPremium.js` | Util | Export PDF/Excel premium + share |
| `src/utils/routeTelemetry.js` | Util | Métricas de performance |
| `src/utils/routeFeatureFlags.js` | Util | Feature flags |
| `src/utils/routeFailSafe.js` | Util | Limites de segurança |
| `src/composables/useRouteMode.js` | Composable | Toggle Basic/Premium |
| `src/composables/useRouteBookmarks.js` | Composable | Gestão de bookmarks |
| `src/composables/useRequestControl.js` | Composable | Controle de requests |
| `src/tarkan/components/kore-map.vue` | Vue Component | Mapa principal (provê injects) |
| `src/store/modules/devices.js` | Vuex Module | Store de dispositivos |
| `src/store/modules/drivers.js` | Vuex Module | Store de motoristas |
| `src/store/modules/reports.js` | Vuex Module | Store de relatórios |
| `src/store/modules/server.js` | Vuex Module | Store do servidor |

---

## 🎯 13. FEATURE FLAGS (routeFeatureFlags.js)

| Flag | Default | Descrição |
|------|---------|-----------|
| `ENABLE_EVENTS` | true | Habilita detecção de eventos |
| `ENABLE_SUMMARY` | true | Habilita resumo executivo |
| `ENABLE_CHAPTERS` | true | Habilita capítulos |
| `ENABLE_BOOKMARKS` | true | Habilita favoritos |
| `ENABLE_EXPORT_PREMIUM` | true | Habilita exports premium |
| `ENABLE_SHARE` | true | Habilita share link |
| `MAX_POINTS_WARNING` | 5000 | Limite de aviso |
| `MAX_POINTS_HARD_LIMIT` | 10000 | Limite rígido (trunca) |

---

## 📐 14. VIRTUALIZAÇÃO (Windowing)

### Configuração
```javascript
const VIRTUAL_ITEM_HEIGHT = 65; // px por item
const VIRTUAL_BUFFER = 8; // itens extras acima/abaixo
```

### Cálculo
```javascript
const virtualScrollState = computed(() => {
  const totalItems = middlePoints.value.length;
  const totalHeight = totalItems * VIRTUAL_ITEM_HEIGHT;
  
  const visibleCount = Math.ceil(containerHeight.value / VIRTUAL_ITEM_HEIGHT) + 1;
  const startIndex = Math.max(0, Math.floor(virtualScrollTop.value / VIRTUAL_ITEM_HEIGHT) - VIRTUAL_BUFFER);
  const endIndex = Math.min(totalItems, startIndex + visibleCount + VIRTUAL_BUFFER * 2);
  const offsetTop = startIndex * VIRTUAL_ITEM_HEIGHT;
  
  return {
    startIndex,
    endIndex,
    spacerStyle: { height: `${totalHeight}px`, position: 'relative' },
    itemsWrapperStyle: { position: 'absolute', top: `${offsetTop}px`, left: 0, right: 0 }
  };
});
```

### Scroll Sync com Playback
```javascript
const scrollToActivePoint = (index) => {
  const virtualIndex = index - 1;
  const targetTop = virtualIndex * VIRTUAL_ITEM_HEIGHT - (containerHeight.value / 2) + (VIRTUAL_ITEM_HEIGHT / 2);
  
  timelineScrollRef.value.scrollTo({
    top: Math.max(0, targetTop),
    behavior: 'smooth'
  });
};
```
