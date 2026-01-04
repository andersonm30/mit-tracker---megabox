# PERF NOTES - devices.internal.vue

## Setup

### DEBUG_PERF Habilitação
```javascript
// Opção 1: localStorage (persiste)
localStorage.setItem('DEBUG_PERF', '1');

// Opção 2: Runtime (sessão apenas)
window.DEBUG_PERF = 1;

// Para desabilitar:
localStorage.removeItem('DEBUG_PERF');
```

### Ambiente de Teste
- Browser: Chrome/Edge (DevTools)
- Vue 3 + Vuex
- Node: 16.x (projeto legado)

---

## Baseline (ANTES das otimizações)

### Problemas Identificados

1. **Template chamando `store.getters` diretamente** (20+ ocorrências)
   - Cada render recalculava todos os getters
   - Exemplos: `store.getters['geofences/isAnchored'](device.id)`, `store.getters.advancedPermissions(N)`

2. **Função `getDisplayMode()` chamada múltiplas vezes no template**
   - Chamada 6x no mesmo bloco de template
   - Não cacheada como computed

3. **v-for com keys baseadas em index** (2 componentes)
   - `DeviceEventsHistory.vue`: `v-for="(event, index) in events" :key="index"`
   - `DeviceHistoryBar.vue`: `v-for="(segment, index) in historyData" :key="index"`
   - Causava re-render desnecessário ao atualizar listas

4. **Cálculos inline complexos no template**
   - Conversão de distância: 3 getters + Math.floor no mesmo v-for
   - Conversão de horas: Math.round + divisão no v-for

### Métricas Estimadas (Baseline)
- Getters recalculados: ~20 por render
- Updates/segundo em uso normal: alto (cada tick de clock triggava)
- Tempo médio de loadEventsInfo: variável (sem métricas)

---

## Mudanças Implementadas

### Computed Audit (Fase A)

#### 1. Permissões Cachadas
```javascript
// ANTES: No template (recalcula a cada render)
:can-edit="store.getters.advancedPermissions(14)"
:can-send-command="store.getters.advancedPermissions(11)"

// DEPOIS: Computed (cache automático)
const permissions = computed(() => ({
  canEdit: store.getters.advancedPermissions(14),
  canSendCommand: store.getters.advancedPermissions(11),
  // ... 6 permissões total
}));
```

#### 2. Server Attributes Cachados
```javascript
const serverAttrs = computed(() => ({
  enableQrDriverId: store.getters['server/getAttribute']('tarkan.enableQrDriverId', false),
  enableLockUnlock: store.getters['server/getAttribute']('tarkan.enableLockUnlock', false),
  speedUnit: store.getters['server/getAttribute']('speedUnit', 'speedUnit'),
  distanceUnit: store.getters['server/getAttribute']('distanceUnit', 'km'),
  volumeUnit: store.getters['server/getAttribute']('volumeUnit', 'volumeUnit'),
}));
```

#### 3. Props Derivadas como Computed
```javascript
// isAnchored, showQrButton, showRoutesButton, showUnlockButton, showBlockButton
// currentDriver, formattedDistance, formattedHours, displayMode
```

#### 4. Lista de Computed Adicionados
| Computed | Dependência | Uso |
|----------|-------------|-----|
| `displayMode` | `device.value.attributes` | Template (6 ocorrências) |
| `permissions` | 6 getters diferentes | Props para subcomponentes |
| `serverAttrs` | 5 server attributes | Template + props |
| `isAnchored` | `device.value.id` | Props |
| `showQrButton` | serverAttrs + permissions | Props |
| `showRoutesButton` | auth + permissions | Props |
| `showUnlockButton` | position + permissions | Props |
| `showBlockButton` | position + permissions | Props |
| `currentDriver` | `position.value.attributes.driverUniqueId` | Props |
| `formattedDistance` | position + serverAttrs | Template v-for |
| `formattedHours` | position.attributes.hours | Template v-for |

---

### Template Lists (Fase B)

#### 1. DeviceEventsHistory.vue - Keys Estáveis
```html
<!-- ANTES -->
<div v-for="(event, index) in events" :key="index">

<!-- DEPOIS -->
<div v-for="event in events" :key="event.id || `${event.type}:${event.eventTime}:${event.deviceId}`">
```

#### 2. DeviceHistoryBar.vue - Keys Estáveis
```html
<!-- ANTES -->
<div v-for="(segment, index) in historyData" :key="index">

<!-- DEPOIS -->
<div v-for="segment in historyData" :key="`${segment.start}:${segment.motion ? 'm' : 's'}`">
```

#### 3. v-memo Considerações
- **NÃO aplicado** nesta fase porque:
  - Listas são pequenas (eventos ~20, history ~24 segmentos)
  - Keys estáveis já resolvem re-render desnecessário
  - v-memo adiciona complexidade sem benefício mensurável

---

### Micro-metrics (Fase C)

#### Sistema DEBUG_PERF
```javascript
// Habilitado via localStorage ou window.DEBUG_PERF
const DEBUG_PERF = process.env.NODE_ENV === 'development' || 
                   window.DEBUG_PERF === 1 || 
                   localStorage?.getItem?.('DEBUG_PERF') === '1';
```

#### Métricas Implementadas

1. **Contagem de Updates (onUpdated)**
```javascript
onUpdated(() => {
  if (!DEBUG_PERF) return;
  perfUpdateCount++;
  // Loga a cada 10 updates com tempo médio
});
```

2. **Tempo de loadEventsInfo**
```javascript
const loadEventsInfo = async (deviceId) => {
  const t0 = DEBUG_PERF ? performance.now() : 0;
  // ... fetch ...
  if (DEBUG_PERF) {
    console.debug(`[PERF] loadEventsInfo: ${dt.toFixed(2)}ms | count=${eventsInfo.value.length}`);
  }
};
```

3. **Helpers Disponíveis (não usados ainda, para expansão)**
```javascript
perfMeasure(label, fn)      // Síncrono
perfMeasureAsync(label, fn) // Assíncrono
```

---

## Results (DEPOIS das otimizações)

### Melhorias Esperadas

| Aspecto | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Getters no template | ~20/render | 0 | ✅ 100% |
| Computed cacheados | 5 | 16 | ✅ +11 |
| v-for com key estável | 0/2 | 2/2 | ✅ 100% |
| Cálculos inline | 2 | 0 | ✅ 100% |

### Console Output (DEBUG_PERF=1)
```
[PERF] Component updates: 10 total | Last 10 in 523ms | Avg: 52.3ms/update
[PERF] loadEventsInfo: 145.23ms | count=12
```

---

## Validation

### verify-hardening.js
```
╔════════════════════════════════════════════════════════════╗
║                        RESUMO                              ║
╚════════════════════════════════════════════════════════════╝

  ✓ Passou:  11
  ✗ Falhou:  0
  ⚠ Pulado:  1

  ════════════════════════════════════════════════════════════
  ✅ TODOS OS HARDENING GATES PASSARAM!
```

### Unit Tests
```
 Test Files  3 passed (3)
      Tests  125 passed (125)
   Duration  1.32s
```

### Smoke Tests (Playwright)
```
Total: 6 tests in 1 file
  - A: troca rápida 10x sem TypeError
  - B: route-leave mata tudo
  - C: camera open/close + trocar device
  - D: dual camera toggle on/off
  - E: navegação back/forward
  - STRESS: 20 trocas consecutivas
```

---

## Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| `devices.internal.vue` | +11 computed, DEBUG_PERF, onUpdated metrics |
| `DeviceEventsHistory.vue` | Key estável (event.id ou composição) |
| `DeviceHistoryBar.vue` | Key estável (start:motion) |

---

## Próximos Passos (Opcional)

1. **v-memo em listas grandes** - Se eventos crescerem muito (>100)
2. **shallowRef para historyInfo/eventsInfo** - Se arrays forem grandes
3. **Memoização de formattedDistance** - Se conversões forem caras
4. **Virtual scrolling** - Se listas ultrapassarem 200+ items

---

## Como Usar DEBUG_PERF

```javascript
// Habilitar
localStorage.setItem('DEBUG_PERF', '1');
location.reload();

// Ver métricas no Console (DevTools)
// Filtrar por: [PERF]

// Desabilitar
localStorage.removeItem('DEBUG_PERF');
location.reload();
```
