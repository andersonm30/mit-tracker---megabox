# HARDENING GATES - Checklist de Validação Final

Este documento valida que todos os requisitos de hardening foram implementados no componente `devices.internal.vue` e composables relacionados.

---

## 📋 Status dos Gates

| # | Gate | Status | Verificação |
|---|------|--------|-------------|
| 1 | Smoke tests Playwright | ✅ | 6 testes configurados (A-E + STRESS) |
| 2 | Zero setTimeout/setInterval diretos | ✅ | Apenas via timerRegistry |
| 3 | cleanupAll em 3 pontos | ✅ | onBeforeUnmount, onBeforeRouteLeave, watch(deviceId) |
| 4 | Lock de reentrância | ✅ | `cleanupInProgress` com reset ao final |
| 5 | Ordem do cleanupAll | ✅ | abort → video → dual → timers → listeners |
| 6 | PDF com try/catch/finally | ✅ | isGeneratingPDF sempre reseta |
| 7 | safeTraccarCall | ✅ | 7 chamadas protegidas |

---

## 🔍 Detalhes de Cada Gate

### Gate 1: Smoke Tests Playwright
**Arquivo:** `tests/smoke/device-internal.smoke.spec.js`

```bash
npx playwright test --list
# Resultado esperado: 6 testes listados
```

Testes implementados:
- [x] A: Troca rápida 10x sem TypeError
- [x] B: Route-leave mata tudo
- [x] C: Camera open/close + trocar device
- [x] D: Dual camera toggle on/off
- [x] E: Navegação back/forward
- [x] STRESS: 20 trocas consecutivas

---

### Gate 2: Zero setTimeout/setInterval Diretos
**Verificação:**
```bash
grep -E "setTimeout|setInterval|clearTimeout|clearInterval" src/templates/devices.internal.vue
# Resultado esperado: Nenhuma ocorrência (ou apenas em comentários)
```

**Implementação:**
- ✅ Todos os timers usam `setSafeTimeout` / `setSafeInterval`
- ✅ Todas as limpezas usam `clearSafeTimeout` / `clearSafeInterval`
- ✅ Import de `timerRegistry.js` presente

---

### Gate 3: cleanupAll em 3 Pontos
**Arquivo:** `devices.internal.vue`

| Ponto | Linha | Código |
|-------|-------|--------|
| onBeforeUnmount | ~1599 | `cleanupAll('unmount')` |
| onBeforeRouteLeave | ~1604 | `cleanupAll('route-leave')` |
| watch(deviceId) | ~1610 | `cleanupAll('device-change')` |

---

### Gate 4: Lock de Reentrância
**Arquivo:** `devices.internal.vue`

```javascript
let cleanupInProgress = false;  // Linha ~884

const cleanupAll = (reason) => {
  if (cleanupInProgress) {      // Linha ~1022
    console.debug('[cleanupAll] Skip - cleanup em andamento');
    return;
  }
  
  cleanupInProgress = true;     // Linha ~1027
  // ... cleanup ...
  cleanupInProgress = false;    // Linha ~1099 (sempre executa)
};
```

**Validação:**
- ✅ Flag `cleanupInProgress` impede reentrância
- ✅ Flag é liberada ao final (permite chamadas futuras)
- ✅ Não usa flag permanente (não bloqueia device-change)

---

### Gate 5: Ordem do cleanupAll
**Arquivo:** `devices.internal.vue` (linhas ~1040-1097)

| Ordem | Operação | Linha |
|-------|----------|-------|
| 1 | `abortAllControllers()` | ~1041 |
| 2 | `videoPlayer.cleanup()` | ~1048 |
| 3 | `cleanupDualCameraResources()` | ~1056 |
| 4 | `clearAllTimers()` | ~1064 |
| 5 | Clear interval refs | ~1071 |
| 6 | Clear timeout refs | ~1086 |
| 7 | `removeAllDomListeners()` | ~1092 |

**Racional:**
- Abort primeiro = para network ANTES de dispose
- Timers antes de listeners = evita callbacks órfãos

---

### Gate 6: PDF com try/catch/finally
**Arquivo:** `devices.internal.vue` (linhas ~2124-2141)

```javascript
const generateDriverPDF = async () => {
  if (!selectedDriver.value || isGeneratingPDF.value) return;
  
  isGeneratingPDF.value = true;
  
  try {
    await generateSingleDriverPDF();
  } catch (error) {
    messageError(KT('driver.errorGeneratingReport'));
  } finally {
    setSafeTimeout(() => {
      isGeneratingPDF.value = false;  // ← SEMPRE reseta
    }, 1500);
  }
};
```

**Validação:**
- ✅ `try/catch/finally` garante reset
- ✅ Usa `setSafeTimeout` (não setTimeout direto)
- ✅ Delay de 1500ms para UX suave

---

### Gate 7: safeTraccarCall
**Arquivo:** `devices.internal.vue` (linhas ~606-620)

```javascript
const safeTraccarCall = async (label, fn) => {
  if (!window.$traccar) {
    console.warn(`[safeTraccarCall] $traccar indisponível: ${label}`);
    notifyWarning(KT('error.serviceUnavailable'));
    return null;
  }
  try {
    return await fn(window.$traccar);
  } catch (e) {
    console.error(`[safeTraccarCall] Erro em ${label}:`, e);
    return null;
  }
};
```

**Chamadas protegidas (7):**
| # | Label | Linha |
|---|-------|-------|
| 1 | getTypeCommands | ~1689 |
| 2 | sendCommand:type | ~1698 |
| 3 | getAvailableCommands | ~1705 |
| 4 | sendCommand:saved | ~1738 |
| 5 | loadRoute | ~1760 |
| 6 | getReportEvents:history | ~1780 |
| 7 | getReportEvents:load | ~1798 |

---

## 🧪 Como Verificar

### Verificação Automatizada
```bash
npm run verify:hardening
```

### Verificação Manual
```bash
# Gate 1: Testes E2E
npm run test:e2e

# Gate 2: Verificar timers diretos
grep -rE "setTimeout\(|setInterval\(" src/templates/devices.internal.vue | grep -v "setSafe"

# Gate 3-7: Revisar código manualmente
```

---

## 📊 Métricas de Debug

Com `DEBUG_RESOURCES` ativo:
```javascript
localStorage.setItem('DEBUG_RESOURCES', '1');
location.reload();

// Após cleanup, verificar:
window.__DEBUG_RESOURCES__.snapshot()
// Esperado: controllers=0, timersTotal=0, domListeners=0
```

---

## ✅ Conclusão

Todos os **7 gates obrigatórios** foram implementados e validados:

- [x] Smoke tests configurados
- [x] Timer registry centralizado
- [x] Cleanup em 3 pontos
- [x] Lock de reentrância
- [x] Ordem correta de cleanup
- [x] PDF com finally
- [x] safeTraccarCall protegendo chamadas

---

## 🚀 Pronto para Próxima Fase

O código está **hardened** e pronto para as próximas fases:

1. **Split Components** - Extrair subcomponentes do devices.internal.vue
2. **Performance** - Otimizações de renderização e memoização
3. **Observability** - Métricas de produção e APM

---

## 📁 Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| [devices.internal.vue](src/templates/devices.internal.vue) | Componente principal |
| [timerRegistry.js](src/utils/timerRegistry.js) | Registry de timers |
| [useDeviceVideoPlayer.js](src/composables/useDeviceVideoPlayer.js) | Composable de vídeo |
| [useDualCamera.js](src/composables/useDualCamera.js) | Composable dual camera |
| [device-internal.smoke.spec.js](tests/smoke/device-internal.smoke.spec.js) | Smoke tests |
| [DEBUG_RESOURCES.md](DEBUG_RESOURCES.md) | Documentação de debug |
| [TEST_PLAN.md](TEST_PLAN.md) | Plano de testes |
