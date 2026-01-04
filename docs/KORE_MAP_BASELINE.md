# Baseline de Funcionalidades: kore-map.vue

## 📌 Sobre este Documento

Este arquivo documenta **TODAS** as funcionalidades existentes do `kore-map.vue` antes da refatoração.  
Serve como **referência de não regressão**: qualquer mudança deve preservar o comportamento descrito aqui.

**Versão do componente**: 5165 linhas  
**Data do baseline**: 2025-01-02  
**Última atualização**: 2025-01-02

---

## 🎯 Funcionalidades Principais

### 1. Visualização de Dispositivos (Markers)
- **Exibição de markers no mapa** com ícones customizados por categoria
- **Cluster de markers** para contas com muitos dispositivos (ativa/desativa via toggle)
- **Visualização de grupos** de dispositivos com agrupamento visual
- **Exibição de nomes** dos dispositivos no mapa
- **Exibição de placas** dos veículos no mapa
- **Indicador de status** (online/offline) nos markers
- **Círculo de precisão GPS** ao redor do marker
- **Tooltip ao hover** com informações rápidas
- **Click em marker** abre painel de detalhes do dispositivo
- **Filtro de visibilidade** por tipo de dispositivo (car, truck, etc.)

### 2. Playback de Rotas (Route Player)
- **Carregamento de rota histórica** com pontos de posição
- **Desenho da rota completa** no mapa (polyline colorida)
- **Play/Pause** da animação da rota
- **Stop** para reiniciar do início
- **Timeline interativa** com barra de progresso
- **Drag na timeline** para navegar pela rota
- **Click na timeline** para pular para posição específica
- **Controle de velocidade** (1x, 2x, 4x, 8x)
- **Marker animado do veículo** seguindo a rota
- **Rotação do marker** de acordo com o curso (direção)
- **Markers de início/fim da rota** (bandeiras verde/vermelha)
- **Markers de eventos** (paradas, ignição, etc.) ao longo da rota
- **Info box do ponto atual** mostrando:
  - Data/hora
  - Velocidade
  - Endereço (se disponível)
  - Eventos (ignição, parada, etc.)
- **Follow durante playback** (câmera acompanha veículo)
- **Suspensão temporária do follow** ao usuário interagir com mapa
- **Heatmap de densidade** de pontos da rota

### 3. Geocercas (Geofences)
- **Exibição de geocercas** no mapa (polígonos, círculos)
- **Toggle de visibilidade** das geocercas
- **Exibição de nomes** das geocercas
- **Cores customizadas** por geocerca
- **Click em geocerca** abre detalhes

### 4. Seguimento em Tempo Real (Follow)
- **Follow de dispositivo ativo** (câmera segue veículo em tempo real)
- **Painel flutuante do motorista** durante follow:
  - Foto do motorista
  - Nome, CNH, CPF
  - Validade da CNH (indicador de vencimento)
  - Foto do veículo
  - Status do veículo
  - Botões de ação (comando, street view, detalhes)
- **Suspensão temporária do follow** ao usuário interagir
- **Retomada automática do follow** após 5 segundos de inatividade

### 5. Heatmap
- **Toggle do heatmap** para visualizar densidade de posições
- **Configuração de intensidade** e raio do heatmap
- **Oculta markers** quando heatmap ativo
- **Restaura markers** ao desativar heatmap

### 6. Controles de Mapa
- **Zoom in/out** via botões customizados
- **Troca de camadas** (Google Maps, OpenStreetMap, Satellite, etc.)
- **Busca no mapa** (search plugin do Leaflet)
- **Atualização manual** do mapa (refresh)
- **Botão de fechar rotas** (quando rota ativa)
- **Botão de compartilhamento** (shares)
- **Dropdown de preferências visuais**:
  - Cluster
  - Grupos
  - Geocercas
  - Nomes
  - Placas
  - Status
  - Precisão GPS
- **Dropdown de visibilidade por tipo** de dispositivo
- **Status counters** (dispositivos online/offline/total)

### 7. Integrações Externas
- **Street View** (Google Maps)
- **Assistente Virtual** (WhatsApp)
- **Modal de comandos** para dispositivos
- **Slider de confirmação** para comandos críticos (bloqueio/desbloqueio)

### 8. Responsividade e Adaptabilidade
- **Layout adaptativo** para mobile/tablet/desktop
- **Controles otimizados** para toque (mobile)
- **Resize observer** para ajuste dinâmico
- **Lazy loading** de componentes pesados

---

## 🖱️ Eventos e Ações do Usuário

### Eventos de Mapa (Leaflet)
| Evento | Descrição | Handler |
|--------|-----------|---------|
| `@ready` | Mapa inicializado | `mapReady()` |
| `@click` | Click no mapa | `mapClick()` |
| `@mousemove` | Mouse movendo no mapa | `mapMove()` |
| `@update:zoom` | Zoom alterado | `zoomUpdated()` |
| Drag do mapa | Usuário arrastou mapa | Suspende follow temporariamente |

### Eventos de Timeline
| Evento | Descrição | Handler |
|--------|-----------|---------|
| Click na track | Pula para posição | `moveTimelinePosition()` |
| `@mousedown` no handle | Inicia drag | `startDrag()` |
| `@mousemove` (global) | Durante drag | `onDrag()` |
| `@mouseup` (global) | Finaliza drag | `stopDrag()` |
| `@touchstart` no handle | Inicia drag (mobile) | `startDrag()` |
| `@touchmove` (global) | Durante drag (mobile) | `onDrag()` |
| `@touchend` (global) | Finaliza drag (mobile) | `stopDrag()` |

### Eventos de Playback
| Ação | Descrição | Handler |
|------|-----------|---------|
| Click Play | Inicia playback | `playRoute()` |
| Click Pause | Pausa playback | `pausePlayRoute()` |
| Click Stop | Para e reseta | `stopRoute()` |
| Alterar velocidade | Muda velocidade (1x~8x) | `changePlaySpeed()` |
| Toggle follow | Ativa/desativa follow | `toggleFollow()` |

### Eventos de Markers
| Evento | Descrição | Handler |
|--------|-----------|---------|
| `@click` no marker | Abre info do dispositivo | `markerClick()` |
| `@mouseover` no marker | Mostra tooltip | `markerOver()` |
| `@click` em ponto da rota | Abre info do ponto | `openMarkInfo()` |

### Eventos de Controles
| Ação | Descrição | Handler |
|------|-----------|---------|
| Click Zoom In | Aumenta zoom | `zoomIn()` |
| Click Zoom Out | Diminui zoom | `zoomOut()` |
| Click Refresh | Atualiza mapa | `refreshMap()` |
| Click Search | Abre busca | `toggleMapSearch()` |
| Trocar camada | Muda base map | `changeMap()` |
| Toggle visibilidade | Liga/desliga filtro | `store.dispatch('devices/toggleHiddenFilter')` |
| Toggle preferência | Altera pref visual | `store.dispatch('setMapPref')` |

### Eventos de Geocercas
| Evento | Descrição | Handler |
|--------|-----------|---------|
| Toggle geocercas | Liga/desliga exibição | `showGeofences = !showGeofences` |
| Toggle nomes | Liga/desliga nomes | `store.dispatch('setMapPref')` |

### Eventos de Modais
| Ação | Descrição | Handler |
|------|-----------|---------|
| Abrir comando | Modal de comando | `openCommandModal()` |
| Abrir street view | Abre street view | `openStreetView()` |
| Abrir WhatsApp | Abre assistente | `openWhatsAppAssistant()` |
| Confirmar slider | Comando crítico OK | `onSliderConfirmed()` |
| Cancelar slider | Comando crítico cancelado | `onSliderCancelled()` |

---

## 🔄 Estados Críticos (Reactive State)

### Estados de Playback
```javascript
const routePlayState = ref(false)          // true = playing, false = paused
const routePlayIndex = ref(0)              // Índice atual na rota
const routePlayPos = ref(0)                // Posição X na timeline (pixels)
const playSpeed = ref(1)                   // Velocidade (1x, 2x, 4x, 8x)
const isDragging = ref(false)              // true durante drag da timeline
const isPlayingRoute = computed()          // Alias de routePlayState
const currentRoutePoint = computed()       // Ponto atual da rota
```

### Estados de Follow
```javascript
const isFollowing = ref(false)             // true = seguindo dispositivo
const followedDeviceId = ref(null)         // ID do dispositivo sendo seguido
const followSuspended = ref(false)         // true = follow pausado temporariamente
const followSuspendTimer = ref(null)       // Timer para retomar follow
const showFloatingPanel = ref(false)       // Painel do motorista visível
const floatingPanelDevice = ref(null)      // Dispositivo do painel
```

### Estados de Mapa
```javascript
const zoom = ref(3)                        // Nível de zoom atual
const zoomForce = ref(3)                   // Zoom forçado (para animação)
const center = ref([-29.942484, -50.990526]) // Centro do mapa (lat, lng)
const selectedMap = ref('google')          // Camada base ativa
const map = ref(null)                      // Instância do Leaflet map
```

### Estados de Rota
```javascript
const fullRoutePoints = ref([])            // Todos os pontos da rota
const playRoutePoints = computed()         // Pontos já percorridos (para polyline)
const cptPoints = computed()               // Pontos computados (full route)
const routeColor = ref('#2196F3')          // Cor da polyline
const showRouteMarkers = ref(true)         // Exibe markers de eventos
const showRoutePoints = ref(true)          // Exibe markers de início/fim
const markerPoints = computed()            // Pontos com eventos (computed)
const playDeviceMarkerPos = ref(null)      // Posição do marker animado
```

### Estados de Heatmap
```javascript
const heatmapEnabled = ref(false)          // Heatmap ativo
const heatLayer = ref(null)                // Layer do heatmap no Leaflet
```

### Estados de Cluster
```javascript
const clustered = computed()               // Cluster ativo (do store)
const clusterLayer = ref(null)             // Layer do cluster
```

### Estados de UI
```javascript
const showGeofences = ref(true)            // Geocercas visíveis
const eyeFilter = ref('')                  // Filtro de busca no dropdown
const availableTypes = computed()          // Tipos de dispositivos disponíveis
const availableMaps = computed()           // Camadas disponíveis
const commandModalOpen = ref(false)        // Modal de comando aberto
const showSliderConfirm = ref(false)       // Slider de confirmação visível
const sliderConfirmData = ref({})          // Dados do slider
```

### Estados de Debug
```javascript
const DEBUG_MODE = false                   // Flag de debug (hardcoded)
const debugLog = (...args) => {}           // Função de log condicional
```

### Estados do Store (Vuex)
```javascript
store.state.devices.showRoutes             // Rota ativa (boolean)
store.state.devices.routeDeviceId          // ID do dispositivo da rota
store.state.devices.routePoints            // Pontos da rota atual
store.getters['mapPref']('clustered')      // Preferências do mapa
store.state.auth.attributes                // Atributos do usuário
store.state.server.serverInfo              // Info do servidor
```

---

## 🔧 Como Ativar Logs de Debug (DEBUG_MAP)

### Passo 1: Habilitar flag no código (temporário - apenas desenvolvimento)
O componente já possui uma flag `DEBUG_MODE` no topo:
```javascript
const DEBUG_MODE = false; // Altere para true
```

### Passo 2: Habilitar via localStorage (recomendado)
Abra o DevTools (F12) e no Console execute:
```javascript
localStorage.setItem('DEBUG_MAP', '1');
```

Depois **recarregue a página** (F5).

### Passo 3: Verificar se está ativo
Logs de debug aparecerão no console com prefixos como:
- `[kore-map]`
- `[PLAY]`
- `[SEEK]`
- `[FASE 13.4.2]`
- `[toggleHeatmap]`

### Passo 4: Desabilitar logs
```javascript
localStorage.removeItem('DEBUG_MAP');
```

E recarregue a página.

---

## ⚡ Como Ativar Métricas de Performance (DEBUG_PERF)

### Passo 1: Habilitar via localStorage
Abra o DevTools (F12) e no Console execute:
```javascript
localStorage.setItem('DEBUG_PERF', '1');
```

Depois **recarregue a página** (F5).

### Passo 2: Verificar métricas no Console
Métricas de performance aparecerão no console com prefixo `[PERF]`:
- **Verde** (< 16ms): Performance excelente
- **Amarelo** (16-50ms): Performance aceitável
- **Vermelho** (> 50ms): Alerta de performance

Exemplo de saída:
```
[PERF] playbackTick: 2.35ms
[PERF] updatePlayVehicleMarker: 0.87ms
[PERF] drawFullRoute: 145.23ms
```

### Passo 3: Hotspots monitorados
O sistema mede automaticamente:
1. **`playbackTick`**: Loop de atualização durante playback de rota
2. **`updatePlayVehicleMarker`**: Atualização do marker do veículo animado
3. **`drawFullRoute`**: Renderização completa da polyline da rota

### Passo 4: Desabilitar métricas
```javascript
localStorage.removeItem('DEBUG_PERF');
```

E recarregue a página.

### Passo 5: Analisar Performance
Para análise detalhada:
```javascript
// Combinar com DevTools Performance Profiler:
// 1. Abrir DevTools (F12) → Performance tab
// 2. Ativar DEBUG_PERF
// 3. Clicar Record → Interagir com mapa → Stop
// 4. Procurar por marcações [PERF] na timeline
```

---

## 🚨 IMPORTANTE
- **Logs só funcionam em desenvolvimento** (`process.env.NODE_ENV === 'development'`)
- **Em produção**, logs e métricas são automaticamente desabilitados (tree-shaking)
- **Nunca commit com flags ativadas** no código
- **Use localStorage** para controle dinâmico

### Logs existentes no componente
Atualmente existem **20+ console.log** no código:
- Slider confirmed/cancelled
- openMarkInfo
- Cor da rota alterada
- Play tick
- Vehicle marker criado/removido
- Preview/Seek
- drawFullRoute/updateRoute
- toggleHeatmap
- Watcher de seguimento (console.error)

**Após implementar `devLog`**, todos esses logs serão protegidos.

---

## 📊 Métricas de Baseline (Antes da Refatoração)

| Métrica | Valor Atual |
|---------|-------------|
| Linhas totais | 5165 |
| Linhas de código (sem comentários) | ~4800 |
| Linhas de template | ~600 |
| Linhas de script | ~3500 |
| Linhas de styles | ~1000 |
| Número de refs | ~40 |
| Número de computed | ~30 |
| Número de watchers | ~15 |
| Número de métodos | ~80 |
| Dependências principais | Leaflet, Vuex, ElementPlus, Vue Leaflet |

---

## 🎨 Preferências do Usuário (localStorage)

O componente usa as seguintes preferências salvas pelo Vuex:
- `clustered`: Cluster ativo (boolean)
- `groups`: Mostrar grupos (boolean)
- `geofenceNames`: Nomes de geocercas (boolean)
- `name`: Mostrar nomes de dispositivos (boolean)
- `plate`: Mostrar placas (boolean)
- `status`: Mostrar status (boolean)
- `precision`: Mostrar precisão GPS (boolean)

Salvas em: `store.getters['mapPref']()` e `store.dispatch('setMapPref')`

---

## 🔗 Integrações com Outros Componentes

### Componentes Importados
- `KoreMarker` (markers customizados)
- `KoreFence` (geocercas)
- `KoreCanvaMarker` (markers em canvas - performance)
- `KoreCanvaPoint` (pontos em canvas - performance)
- `StreetViewDark` (street view Google)
- `CommandModalDark` (modal de comandos)
- `SliderConfirmModal` (confirmação slider)

### Dependências de Store (Vuex)
- `store.state.devices.*` (dispositivos, rotas, filtros)
- `store.state.auth.*` (usuário autenticado)
- `store.state.server.*` (configurações do servidor)
- `store.getters.advancedPermissions()` (permissões)
- `store.dispatch('devices/toggleHiddenFilter')` (filtros)
- `store.dispatch('setMapPref')` (preferências)

### Dependências Externas (NPM)
- `leaflet` (biblioteca de mapas)
- `leaflet.heat` (plugin de heatmap)
- `leaflet-search` (plugin de busca)
- `@vue-leaflet/vue-leaflet` (wrapper Vue para Leaflet)
- `element-plus` (UI components)
- `resize-observer-polyfill` (polyfill para resize)

---

## ⚠️ Comportamentos Críticos (Não Quebrar!)

### 1. Follow durante Playback
**Comportamento**: Quando `isFollowing = true` durante playback, a câmera segue o marker animado.  
**Suspensão**: Ao usuário interagir (drag, zoom), follow é suspenso por 5 segundos.  
**Retomada**: Após 5s sem interação, follow é retomado automaticamente.

### 2. Timeline Drag
**Comportamento**: Usuário pode arrastar o handle da timeline para navegar pela rota.  
**Durante drag**: Playback é pausado automaticamente.  
**Após soltar**: Playback não retoma automaticamente (usuário precisa clicar Play).

### 3. Cluster e Performance
**Comportamento**: Com cluster ativo, markers são agrupados em números.  
**Threshold**: Agrupa quando zoom < 16 (aproximadamente).  
**Performance**: Essencial para contas com 100+ dispositivos.

### 4. Heatmap vs Markers
**Comportamento**: Heatmap e markers são mutuamente exclusivos.  
**Quando heatmap ativo**: Markers são ocultados.  
**Quando heatmap desligado**: Markers são restaurados.

### 5. Marker Rotation (Course)
**Comportamento**: Marker do veículo rotaciona de acordo com `course` (direção em graus).  
**Range**: 0-360° (0 = Norte, 90 = Leste, 180 = Sul, 270 = Oeste).  
**Animação**: Rotação é suave (CSS transition).

---

## 🧪 Casos de Teste Manuais (Smoke Tests)

Execute antes e depois de qualquer refatoração:

1. **Carregar mapa com 10 dispositivos** → Markers aparecem
2. **Ativar cluster** → Markers agrupam
3. **Desativar cluster** → Markers individuais aparecem
4. **Clicar em marker** → Info abre
5. **Carregar rota histórica** → Rota desenha no mapa
6. **Clicar Play** → Marker se move
7. **Arrastar timeline** → Marker pula para posição
8. **Ativar follow** → Câmera segue marker
9. **Arrastar mapa durante follow** → Follow suspende
10. **Aguardar 5s** → Follow retoma
11. **Ativar heatmap** → Heatmap aparece, markers somem
12. **Desativar heatmap** → Markers voltam
13. **Trocar camada de mapa** → Mapa altera (Google → OSM)
14. **Zoom in/out** → Funciona suavemente
15. **Mobile: tocar e arrastar** → Mapa responde

---

## 📝 Notas de Implementação

### Limitações Conhecidas
- **Performance com 500+ dispositivos**: Cluster é OBRIGATÓRIO
- **Playback de rotas longas (10k+ pontos)**: Pode travar em dispositivos fracos
- **Street View**: Requer Google API Key válida
- **Heatmap**: Pode ser lento em dispositivos mobile

### Bugs Conhecidos (não corrigir agora)
- [ ] Timeline às vezes "pula" 1-2 pixels no drag
- [ ] Follow suspende ao zoom com scroll (indesejado?)
- [ ] Heatmap não limpa layer anterior às vezes
- [ ] Cluster não atualiza imediatamente ao adicionar dispositivo

### TO-DOs Futuros (pós-refatoração)
- [ ] Adicionar testes unitários para composables
- [ ] Implementar lazy loading para Street View
- [ ] Otimizar render de polylines longas
- [ ] Cache de markers para melhor performance

---

## 🔄 Histórico de Mudanças

| Data | Versão | Mudança | Autor |
|------|--------|---------|-------|
| 2025-01-02 | 1.0 | Baseline inicial criado | - |

---

## 📚 Referências Internas

- **Plano de Refatoração**: [REFACTOR_KORE_MAP_PLAN.md](./REFACTOR_KORE_MAP_PLAN.md)
- **Código fonte**: [kore-map.vue](../src/tarkan/components/kore-map.vue)
- **Componentes relacionados**:
  - [kore-marker.vue](../src/tarkan/components/kore-marker.vue)
  - [kore-fence.vue](../src/tarkan/components/kore-fence.vue)
  - [CanvaMarker.vue](../src/tarkan/test/CanvaMarker.vue)
  - [CanvaPoints.vue](../src/tarkan/test/CanvaPoints.vue)

---

**Última atualização**: 2025-01-02  
**Versão do documento**: 1.0  
**Status**: Baseline estabelecido ✅
