# 🎯 Runtime API Migration Plan

**Objetivo:** Unificar `window.$traccar` + `window.$tarkan` em serviço centralizado com error handling, type safety e testabilidade.

**ROI:** Corta risco de "API não disponível" espalhado, padroniza erros, abre caminho pra mock/test, reduz acoplamento global.

---

## 📊 Inventário Completo

### window.$traccar (84 ocorrências em código ativo)

#### 🎯 Tier 1: Alta Criticidade (Core UX)
| Arquivo | Linhas | Métodos | Prioridade |
|---------|--------|---------|------------|
| `src/App.vue` | 977, 989, 1008, 1020 | `sendCommand` | **P0** - Modal confirmar bloqueio/desbloqueio |
| `src/templates/devices.item.vue` | 500, 508, 525, 533 | `getAvailableCommands`, `sendCommand` | **P0** - Item device bloquear/desbloquear |
| `src/tarkan/composables/useMarkers.js` | 657, 683, 697, 727, 1008, 1010, 1069, 1071 | `getTypeCommands`, `getAvailableCommands`, `sendCommand` | **P0** - Markers contexto comando |
| `src/composables/useDeviceVideoPlayer.js` | 521, 525 | `sendCommand` | **P1** - Dual camera video player |
| `src/composables/useDualCamera.js` | 62, 399 | `sendCommand` | **P1** - Dual camera |

#### 🔧 Tier 2: Componentes Complexos
| Arquivo | Linhas | Métodos | Prioridade |
|---------|--------|---------|------------|
| `src/tarkan/components/CommandModalDark.vue` | 237, 238, 366 | `getReportEvents`, `sendCommand` | **P1** - Modal comando dark |
| `src/tarkan/components/CommandModal.vue` | 211, 214, 472 | `getReportEvents`, `sendCommand` | **P1** - Modal comando light |
| `src/tarkan/components/kore-map-dark.vue` | 2691, 2727, 2738, 2784 | `getTypeCommands`, `getAvailableCommands`, `sendCommand` | **P2** - Mapa dark (4 refs) |

#### 📄 Tier 3: Reports (Read-only)
| Arquivo | Linhas | Métodos | Prioridade |
|---------|--------|---------|------------|
| `src/templates/history.vue` | 1387 | `loadRoute` | **P2** - History route loader |
| `src/templates/reportEvents.vue` | 99 | read-only | **P3** |
| `src/templates/reportStops.vue` | 127 | read-only | **P3** |
| `src/templates/reportTravels.vue` | 151 | read-only | **P3** |
| `src/templates/reportResume.vue` | 103, 137 | read-only | **P3** |

#### 🔗 Tier 4: Admin/Link Objects
| Arquivo | Linhas | Métodos | Prioridade |
|---------|--------|---------|------------|
| `src/tarkan/components/views/link-objects.vue` | 93, 98, 140, 144, 152, 165, 173, 177, 185, 189, 197, 201, 209, 213, 221, 225, 233, 237, 245, 249, 257, 261 | `linkObjects`, `unlinkObjects`, `getGeofences`, `getDevices`, `getSavedCommands`, `getMaintenance`, `getComputedAttributes`, `getCalendars`, `getNotifications`, `getUsers`, `getGroups`, `getDrivers` | **P3** - Admin UI (22 refs) |
| `src/tarkan/components/views/edit-notification.vue` | 242, 246, 397, 409, 421 | `getNotificators`, `getNotificationTypes`, `linkObjects` | **P3** |
| `src/tarkan/components/views/edit-maintenance.vue` | 216, 230, 244 | `linkObjects` | **P3** |
| `src/tarkan/components/views/edit-command.vue` | 126, 221 | `getTypeCommands`, `linkObjects` | **P3** |
| `src/tarkan/components/views/edit-calendar.vue` | 403 | `linkObjects` | **P3** |
| `src/tarkan/components/views/edit-attribute.vue` | 183, 292 | `attributeTest`, `linkObjects` | **P3** |
| `src/tarkan/components/views/edit-events.vue` | 246 | `unlinkObjects` | **P3** |
| `src/tarkan/components/views/edit-server.vue` | 384 | `restartServer` | **P3** |
| `src/tarkan/components/views/edit-user.vue` | 1577 | `testNotification` | **P3** |

#### 🏪 Tier 5: Vuex Store (Redux pattern)
| Arquivo | Linhas | Métodos | Prioridade |
|---------|--------|---------|------------|
| `src/store/modules/devices.js` | 1074, 1132, 1156, 1177, 1192, 1215, 1230 | diversos | **P2** - Store devices |
| `src/store/modules/geofence.js` | 104, 114, 127 | diversos | **P2** |
| `src/store/modules/events.js` | 185, 196, 209, 216 | `updateNotification`, `createNotification` | **P2** |
| `src/store/modules/drivers.js` | 42, 53, 78 | `deleteDriver` | **P2** |
| `src/store/modules/groups.js` | 38, 51, 65, 73 | CRUD groups | **P2** |
| `src/store/modules/maintenance.js` | 32, 45, 59, 67 | CRUD maintenance | **P2** |
| `src/store/modules/server.js` | 109, 134 | `saveServer` | **P2** |
| `src/store/modules/users.js` | 48, 59, 84 | `deleteUser` | **P2** |
| `src/store/modules/routes.js` | 137 | route ops | **P2** |

#### 🌐 Tier 6: Legacy/Other
| Arquivo | Linhas | Métodos | Prioridade |
|---------|--------|---------|------------|
| `src/tarkan/func/actAnchor.js` | 69 | `linkObjects` | **P3** - Func anchor |

---

### window.$tarkan (12 ocorrências)

| Arquivo | Linhas | Métodos | Prioridade |
|---------|--------|---------|------------|
| `src/tarkan/components/views/edit-theme.vue` | 583 | `saveTheme` | **P3** |
| `src/tarkan/components/views/edit-theme-dark.vue` | 908 | `saveTheme` | **P3** |
| `src/templates/qr-driver.vue` | 70, 87 | `checkDriver`, `checkOutDriver` | **P3** |
| `src/templates/autolink.vue` | 76 | `autoLink` | **P3** |
| `src/tarkan/components/views/log-objects.vue` | 427, 432, 437 | `getServerLogs`, `getUserLogs`, `getDeviceLogs` | **P3** |
| `src/store/modules/shares.js` | 37, 50, 74 | `deleteShare` | **P2** |

---

## 🏗️ Estratégia de Implementação (MVP → Full)

### FASE 1: Foundation (3 arquivos) ✅ MVP

```bash
1. src/services/runtimeApi.js        # Factory + assert + métodos comuns
2. src/plugins/runtimeApi.js          # Plugin Vue 3 (provide/inject)
3. src/main.js                        # app.use(RuntimeApiPlugin)
```

**Entrega:** API disponível via `inject('runtimeApi')` em todos os componentes.

---

### FASE 2: Ataque Tier 1 (P0 - Core UX)

**Ordem segura (sem quebrar nada):**

1. ✅ **App.vue** (4 refs)
   - `sendCommand` no modal confirmar
   - Já tem setup, só adicionar `inject('runtimeApi')`

2. ✅ **devices.item.vue** (4 refs)
   - `getAvailableCommands` + `sendCommand`
   - Bloquear/desbloquear device item

3. ✅ **useMarkers.js** (8 refs)
   - Composable com lógica pesada de comandos
   - `getTypeCommands`, `getAvailableCommands`, `sendCommand`

4. ✅ **useDeviceVideoPlayer.js** (2 refs)
   - Dual camera video player
   - `sendCommand` (já tem try/catch)

5. ✅ **useDualCamera.js** (2 refs)
   - Dual camera control
   - `sendCommand` (line 399 tem bug: falta `()`)

**Total Fase 2:** 20 refs eliminadas, core UX protegido.

---

### FASE 3: Ataque Tier 2 (Componentes Complexos)

1. ✅ **CommandModalDark.vue** (3 refs)
2. ✅ **CommandModal.vue** (3 refs)
3. ✅ **kore-map-dark.vue** (4 refs)

**Total Fase 3:** 10 refs eliminadas.

---

### FASE 4: Ataque Tier 5 (Vuex Store)

**Por quê store agora?** Store tem pattern Redux (actions com context), fácil centralizar error handling.

**Ordem:**
1. ✅ `store/modules/devices.js` (7 refs - maior volume)
2. ✅ `store/modules/geofence.js` (3 refs)
3. ✅ `store/modules/events.js` (4 refs)
4. ✅ Outros stores menores (1-3 refs cada)

**Total Fase 4:** ~30 refs eliminadas, Vuex limpo.

---

### FASE 5: Ataque Tier 3 + 4 (Reports + Admin)

**Reports (read-only, baixo risco):**
- history.vue, reportEvents, reportStops, reportTravels, reportResume

**Admin UI:**
- link-objects.vue (22 refs - bulk operation)
- edit-* views (notification, maintenance, command, calendar, attribute, etc.)

**Total Fase 5:** ~40 refs eliminadas.

---

### FASE 6: Cleanup + Deprecation

1. ✅ Adicionar console.warn deprecation em `traccarConnector/index.js`:
   ```javascript
   window.$traccar = traccarConnector
   if (process.env.NODE_ENV === 'development') {
     console.warn('[DEPRECATED] window.$traccar será removido. Use inject("runtimeApi").')
   }
   ```

2. ✅ Mesma coisa em `tarkanConnector/index.js`

3. ✅ ESLint rule (opcional):
   ```javascript
   'no-restricted-globals': ['error', {
     name: 'window.$traccar',
     message: 'Use inject("runtimeApi") ao invés de window.$traccar'
   }]
   ```

---

## 📋 Checklist de Migração (por arquivo)

### Template de Refactor

```vue
<!-- ANTES -->
<script setup>
const handleCommand = async () => {
  if (!window.$traccar?.sendCommand) {
    ElNotification.error('API não disponível')
    return
  }
  try {
    await window.$traccar.sendCommand({ deviceId, type: 'engineStop' })
  } catch (e) {
    ElNotification.error('Erro ao enviar comando')
  }
}
</script>

<!-- DEPOIS -->
<script setup>
import { inject } from 'vue'
import { ElNotification } from 'element-plus'

const runtimeApi = inject('runtimeApi')

const handleCommand = async () => {
  try {
    await runtimeApi.sendCommand({ deviceId, type: 'engineStop' })
    ElNotification.success('Comando enviado')
  } catch (e) {
    // Error já tratado no service, só precisa notificar
    ElNotification.error(e.message || 'Erro ao enviar comando')
  }
}
</script>
```

---

## 🎯 Métodos do RuntimeAPI Service (MVP)

### traccar API (frequência decrescente)

```javascript
// COMANDOS (alta frequência)
sendCommand(payload)              // ~35 refs
getAvailableCommands(deviceId)    // ~10 refs
getTypeCommands(deviceId?)        // ~8 refs

// LINK/UNLINK (admin)
linkObjects(payload)              // ~20 refs
unlinkObjects(payload)            // ~5 refs

// CRUD READ (reports/admin)
getDevices(params)                // ~5 refs
getGeofences(params)              // ~4 refs
getNotifications(params)          // ~4 refs
getSavedCommands(params)          // ~2 refs
getMaintenance(params)            // ~2 refs
getComputedAttributes(params)     // ~2 refs
getCalendars(params)              // ~2 refs
getUsers(params)                  // ~2 refs
getGroups(params)                 // ~2 refs
getDrivers(params)                // ~2 refs

// CRUD WRITE (admin)
createNotification(data)
updateNotification(id, data)
deleteMaintenance(id)
updateMaintenance(id, data)
createMaintenance(data)
deleteGroup(id)
updateGroup(id, data)
createGroup(data)
deleteDriver(id)
deleteUser(id)

// REPORTS
loadRoute(deviceId, start, end, simplified)
getReportEvents(params)

// TESTS/UTILS
attributeTest(deviceId, data)
testNotification()
restartServer()

// NOTIFICATORS
getNotificators()
getNotificationTypes()
```

### tarkan API (baixa frequência)

```javascript
saveTheme(payload)
checkDriver(scan)
checkOutDriver()
autoLink(data)
getServerLogs()
getUserLogs(userId)
getDeviceLogs(deviceId)
deleteShare(params)
```

---

## 🚨 Regras Daqui Pra Frente

### ✅ PERMITIDO
- `inject('runtimeApi')` em componentes
- `runtimeApi.sendCommand()`, `runtimeApi.traccar().*`, `runtimeApi.tarkan().*`
- Error handling centralizado (ElNotification no catch)

### ❌ PROIBIDO
- `window.$traccar` direto em novos componentes
- `window.$tarkan` direto em novos componentes
- `if (!window.$traccar) return` (error handling manual)

### 🔧 PR REVIEW CHECKLIST
- [ ] Usa `inject('runtimeApi')`?
- [ ] Não tem `window.$traccar` nem `window.$tarkan`?
- [ ] Error handling com try/catch + notification?
- [ ] Testes (se aplicável)?

---

## 📈 Métricas de Sucesso

| Métrica | Antes | Meta | Status |
|---------|-------|------|--------|
| Refs `window.$traccar` | 84 | 0 | 🔴 84 |
| Refs `window.$tarkan` | 12 | 0 | 🔴 12 |
| Arquivos afetados | 42 | 0 | 🔴 42 |
| Coverage runtimeApi | 0% | 80% | 🔴 0% |
| Error handling padronizado | ❌ | ✅ | 🔴 |

---

## 🚀 Quick Start (Copiar & Colar)

### 1. Criar service
```bash
# Windows PowerShell
New-Item -Path "src\services\runtimeApi.js" -ItemType File -Force
```

### 2. Criar plugin
```bash
New-Item -Path "src\plugins\runtimeApi.js" -ItemType File -Force
```

### 3. Registrar no main.js
```javascript
import RuntimeApiPlugin from '@/plugins/runtimeApi'
app.use(RuntimeApiPlugin)
```

### 4. Usar em componente
```javascript
import { inject } from 'vue'
const runtimeApi = inject('runtimeApi')
await runtimeApi.sendCommand({ deviceId, type: 'engineStop' })
```

---

**Próximo passo:** Você quer que eu:

A) Crie os 3 arquivos MVP (service + plugin + main.js patch)?

B) Liste exatamente as substituições do App.vue (Tier 1.1)?

C) Crie script grep automatizado pra validar migração (zerar refs)?
