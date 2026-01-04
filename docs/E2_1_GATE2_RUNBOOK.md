# 🧪 FASE E2.1 - GATE 2: RUNBOOK DE TESTES MANUAIS

**Status**: Ready to execute  
**Duração estimada**: 15-20 minutos  
**Pré-requisito**: DEBUG_MARKERS=1 ativado

---

## ⚙️ PRÉ-REQUISITOS

### Ambiente de Teste
- ✅ Conta com permissões de **administrador**
- ✅ Base com **1000+ devices** (para teste de performance)
- ✅ Pelo menos **1 device ONLINE** e **1 device OFFLINE**
- ✅ Device com nome malicioso para teste XSS (ex: `<img src=x onerror=alert('XSS')>`)

### Ativação do Debug Harness
Execute no **Console DevTools** (F12):
```javascript
localStorage.setItem('DEBUG_MARKERS', '1');
location.reload();
```

**Confirmação**: Após reload, deve aparecer no console:
```
[🔍 MARKERS DEBUG] ✅ Debug mode ENABLED
[🔍 MARKERS DEBUG] Para desabilitar: localStorage.removeItem("DEBUG_MARKERS")
```

---

## 🧪 TESTE 1: Menu de Contexto Completo

### Objetivo
Verificar se todas as opções do menu de contexto aparecem corretamente.

### Passos
1. Abrir mapa com devices visíveis
2. Clicar com **botão direito** em qualquer marcador
3. Verificar menu de contexto com todas as opções

### Resultado Esperado
Menu completo com pelo menos:
- ✅ Details (Detalhes)
- ✅ Zoom
- ✅ Follow / Unfollow
- ✅ Trail / Untrail
- ✅ Open External (Google Maps, Street View)
- ✅ Share (Link, Maps, Street)
- ✅ Lock / Unlock (se device online + permissões)
- ✅ Send Command (se device online + permissões)
- ✅ Attributions (Geofences, Drivers, Commands, Notifications, Maintenance)
- ✅ Edit (se admin)
- ✅ Logs (se admin)

### Log Esperado (DEBUG_MARKERS=1)
```javascript
[🔍 MARKERS DEBUG] markerContext: {
  deviceId: 123,
  deviceName: "Veículo Teste",
  status: "online"
}
```

### Fail Patterns
- ❌ **Menu não abre**: Verificar se `contextMenuRef.value.openMenu` existe
- ❌ **Opções faltando**: Verificar permissões do usuário (store.getters.advancedPermissions)
- ❌ **Lock/Unlock não aparece**: Verificar `position.attributes?.blocked` e permissões (9, 10, 11)

---

## 🧪 TESTE 2: Follow / Unfollow + Tooltip

### Objetivo
Validar que tooltip flutuante aparece/desaparece corretamente ao seguir/desseguir device.

### Passos
1. Click direito em device → **"Follow"**
2. Verificar: Tooltip flutuante aparece no mapa
3. Click direito novamente → **"Unfollow"**
4. Verificar: Tooltip desaparece

### Resultado Esperado
- ✅ Tooltip aparece imediatamente após "Follow"
- ✅ Tooltip se move com o device (se ele estiver em movimento)
- ✅ Tooltip desaparece após "Unfollow"
- ✅ Nenhum erro no console

### Log Esperado (DEBUG_MARKERS=1)
```javascript
[🔍 MARKERS DEBUG] markerContext: { deviceId: 123, ... }
// Ao passar mouse sobre device:
[🔍 MARKERS DEBUG] markerOver: { deviceId: 123, debounceMs: 40 }
[🔍 MARKERS DEBUG] markerOut: { action: 'hideTooltip' }
```

### Fail Patterns
- ❌ **Tooltip não aparece**: Verificar `followDevice.updateFloatingPanel()` no composable
- ❌ **Tooltip não desaparece**: Verificar `followDevice.hideTooltipManually()`
- ❌ **Multiple tooltips**: Verificar cleanup de timers em onUnmounted

---

## 🧪 TESTE 3: Lock / Unlock + Cooldown

### Objetivo
Validar que cooldown de 5s bloqueia spam de comandos críticos.

### Passos
1. Click direito em device **ONLINE** → **"Lock"** (ou "Unlock")
2. Confirmar slider arrastando até o fim
3. **IMEDIATAMENTE** após confirmação, click direito novamente → **"Lock"** (mesma ação)
4. Verificar: Mensagem de cooldown aparece

### Resultado Esperado
- ✅ Primeiro comando: Slider aparece, confirma, comando enviado
- ✅ Segundo comando (< 5s): Mensagem `"Aguarde Xs para reenviar este comando."` (onde X = segundos restantes)
- ✅ Terceiro comando (> 5s): Permite enviar novamente

### Log Esperado (DEBUG_MARKERS=1)
```javascript
// Primeira tentativa (sucesso):
[🔍 MARKERS DEBUG] markerContext: { deviceId: 123, status: "online" }

// Segunda tentativa (< 5s, bloqueado):
[🔍 MARKERS DEBUG] markerContext: { deviceId: 123, status: "online" }
[🔍 MARKERS DEBUG] cooldown: {
  deviceId: 123,
  commandType: "engineStop",
  remainingMs: 3245,
  remainingSec: 4
}
```

### Fail Patterns
- ❌ **Cooldown não bloqueia**: Verificar `isInCooldown()` e `registerCommand()` no composable
- ❌ **Cooldown > 5s**: Verificar constante `COMMAND_COOLDOWN = 5000` (5s)
- ❌ **Cooldown não reseta**: Verificar `commandCooldowns.clear()` no cleanup

---

## 🧪 TESTE 4: Comandos Online/Offline

### Objetivo
Validar que comandos só executam se device estiver online, ou exibem warning adequado.

### Passos
1. **Device ONLINE**:
   - Click direito → "Enviar Comando" (ou "Send Command")
   - Verificar: Lista de comandos disponíveis aparece
   - Selecionar um comando → Confirmar
   - Verificar: Comando enviado com sucesso

2. **Device OFFLINE**:
   - Click direito → "Enviar Comando"
   - Verificar: Mensagem de offline warning aparece

### Resultado Esperado
- ✅ **Online**: Lista de comandos carregada de `window.$traccar.getTypeCommands(deviceId)`
- ✅ **Offline**: Mensagem "Device offline" ou similar, comandos desabilitados
- ✅ Lock/Unlock mostra warning text em amarelo: "Atenção: Dispositivo offline. O comando será executado quando ficar online."

### Log Esperado (DEBUG_MARKERS=1)
```javascript
[🔍 MARKERS DEBUG] markerContext: {
  deviceId: 456,
  deviceName: "Device Offline",
  status: "offline"
}
```

### Fail Patterns
- ❌ **Comandos aparecem para offline**: Verificar `device.status !== 'online'` no markerContext
- ❌ **Lock/Unlock executam offline**: Verificar `disabled: (device.status !== 'online')` nos botões

---

## 🧪 TESTE 5: Share (Native vs Clipboard)

### Objetivo
Validar fallback: mobile usa native share, desktop usa clipboard.

### Passos
1. **Mobile** (ou simular no DevTools):
   - Click direito → "Compartilhar" → "Compartilhar Maps"
   - Verificar: Dialog nativo do SO aparece (WhatsApp, Email, etc)

2. **Desktop**:
   - Click direito → "Compartilhar" → "Compartilhar Maps"
   - Verificar: Mensagem "Copiado para área de transferência"
   - Colar (Ctrl+V): Link do Google Maps aparece

### Resultado Esperado
- ✅ Mobile: `navigator.share()` executado, dialog nativo aparece
- ✅ Desktop: Clipboard copy executado, mensagem de sucesso
- ✅ Link copiado contém `http://maps.google.com/maps?q=loc:`
- ✅ Street View link contém `https://www.google.com/maps/@?api=1&map_action=pano`

### Log Esperado (DEBUG_MARKERS=1)
```javascript
// Mobile:
[🔍 MARKERS DEBUG] share: {
  method: "native",
  url: "http://maps.google.com/maps?q=loc:...",
  type: "maps"
}

// Desktop:
[🔍 MARKERS DEBUG] share: {
  method: "clipboard",
  url: "http://maps.google.com/maps?q=loc:...",
  type: "maps"
}
```

### Fail Patterns
- ❌ **Desktop usa native (erro)**: `navigator.share` não detectado corretamente, verificar `if (navigator.share)`
- ❌ **Clipboard não copia**: Verificar `document.execCommand("copy")` (legacy) ou Clipboard API
- ❌ **Link malformado**: Verificar `position.latitude`, `position.longitude`, `position.course`

---

## 🧪 TESTE 6: Performance - Hover 1000+ Devices

### Objetivo
Validar que hover em 1000+ devices não causa lag (FPS ≥ 30, debounce suave).

### Pré-requisito
Base com pelo menos 1000 devices visíveis no mapa.

### Passos
1. Abrir mapa com 1000+ devices visíveis
2. Passar mouse **rapidamente** sobre 20 marcadores diferentes (movimento contínuo)
3. Verificar no console:
   - Nenhum erro
   - Logs `markerOver` aparecem com debounce (40ms ou 80ms)
4. Verificar FPS (DevTools → Performance → Record):
   - FPS médio ≥ 30
   - Sem spikes de memory

### Resultado Esperado
- ✅ Tooltips aparecem suavemente (não instantaneamente)
- ✅ Cache hits > 80% (após 10+ hovers no mesmo device)
- ✅ Console limpo, sem warnings
- ✅ FPS ≥ 30 durante hover

### Log Esperado (DEBUG_MARKERS=1)
```javascript
[🔍 MARKERS DEBUG] markerOver: { deviceId: 100, debounceMs: 40 }
[🔍 MARKERS DEBUG] markerOut: { action: 'hideTooltip' }
[🔍 MARKERS DEBUG] markerOver: { deviceId: 101, debounceMs: 40 }
[🔍 MARKERS DEBUG] markerOut: { action: 'hideTooltip' }
// Rate limit: máximo 1 log por label a cada 500ms
```

### Fail Patterns
- ❌ **Lag / FPS < 20**: Verificar debounce está ativo (40ms standard, 80ms enterprise)
- ❌ **Memory leak**: Verificar `tooltipCache.clear()` no cleanup
- ❌ **Cache não funciona**: Verificar `isCacheValid()` e TTL (30s)

---

## 🧪 TESTE 7: Unmount Limpo (Trocar Rota)

### Objetivo
Validar que cleanup executa corretamente ao sair do mapa (sem memory leaks).

### Passos
1. Abrir mapa (kore-map.vue)
2. Hover em alguns devices (preencher cache)
3. Click em "Devices" no menu lateral (ou navegar para `/devices/123`)
4. Verificar console:
   - Log `[Cleanup] Markers composable destruído` aparece
   - Nenhum erro de `Cannot read property of undefined`

### Resultado Esperado
- ✅ Log de cleanup aparece
- ✅ Nenhum timer pendente (debounce cancelado)
- ✅ Caches limpos (tooltipCache, commandCooldowns)
- ✅ Console limpo após navegar

### Log Esperado (DEBUG_MARKERS=1)
```javascript
[kore-map.vue] 🧹 Unmounting component...
[Cleanup] Markers composable destruído
[kore-map.vue] ✅ Cleanup completo
```

### Fail Patterns
- ❌ **Memory leak**: Verificar `markers.cleanup()` chamado no `onUnmounted`
- ❌ **Timers pendentes**: Verificar `clearTimeout(hoverDebounceTimer)`
- ❌ **Cache não limpo**: Verificar `tooltipCache.clear()`, `cacheTimestamps.clear()`

---

## 🧪 TESTE 8: Sanitização XSS

### Objetivo
Validar que nomes maliciosos são escapados e não executam scripts.

### Pré-requisito
Device com nome malicioso criado:
- Nome: `<img src=x onerror=alert('XSS')>`
- Ou: `<script>alert('Hacked')</script>`

### Passos
1. Localizar device malicioso no mapa
2. Passar mouse sobre o marcador
3. Verificar: Nome aparece como **texto** (não executa script)
4. Click direito → Menu de contexto
5. Verificar: Todos os textos são escapados (nome, opções, etc)

### Resultado Esperado
- ✅ Tooltip mostra texto: `&lt;img src=x onerror=alert('XSS')&gt;`
- ✅ **NUNCA** executa `alert()` ou qualquer script
- ✅ Menu de contexto também escapa textos
- ✅ Console limpo, sem errors

### Log Esperado (DEBUG_MARKERS=1)
```javascript
[🔍 MARKERS DEBUG] markerOver: { deviceId: 999, debounceMs: 40 }
[🔍 MARKERS DEBUG] sanitize: {
  field: "device.name",
  original: "<img src=x onerror=alert('XSS')>",
  sanitized: "&lt;img src=x onerror=alert('XSS')&gt;",
  threat: "XSS prevented"
}
```

### Fail Patterns
- ❌ **Script executa**: Sanitização FALHOU, verificar `sanitizeText()` em `utils/sanitize.js`
- ❌ **HTML renderiza**: Verificar uso de `textContent` ao invés de `innerHTML`
- ❌ **Sanitize não detecta**: Verificar log `sanitize` só aparece quando `sanitizedName !== device.name`

---

## ✅ CRITÉRIOS DE ACEITAÇÃO (GO/NO-GO)

### GATE 2: Todos os 8 testes devem PASSAR

| Teste | Status | Nota |
|-------|--------|------|
| 1. Menu Contexto | ☐ GO / ☐ NO-GO | |
| 2. Follow/Unfollow | ☐ GO / ☐ NO-GO | |
| 3. Lock/Unlock Cooldown | ☐ GO / ☐ NO-GO | |
| 4. Comandos Online/Offline | ☐ GO / ☐ NO-GO | |
| 5. Share Native/Clipboard | ☐ GO / ☐ NO-GO | |
| 6. Performance 1000+ | ☐ GO / ☐ NO-GO | |
| 7. Unmount Limpo | ☐ GO / ☐ NO-GO | |
| 8. Sanitização XSS | ☐ GO / ☐ NO-GO | |

### GATE 3: Build e Produção

- ☐ Build passa (`npm run serve` sem erros críticos)
- ☐ Warnings não-bloqueantes (CSS, imports não usados) ignorados
- ☐ Zero logs em produção (process.env.NODE_ENV === 'production')

---

## 🐛 TROUBLESHOOTING RÁPIDO

### Debug não ativa
```javascript
// Verificar no console:
localStorage.getItem('DEBUG_MARKERS') // deve retornar '1'
// Se null, reativar:
localStorage.setItem('DEBUG_MARKERS', '1');
location.reload();
```

### Logs não aparecem
1. Verificar: `[🔍 MARKERS DEBUG] ✅ Debug mode ENABLED` apareceu após reload
2. Verificar: `process.env.NODE_ENV !== 'production'` (deve ser 'development')
3. Verificar: Rate limit (500ms) → esperar meio segundo entre ações

### Performance ruim
1. Abrir DevTools → Performance → Record
2. Identificar bottlenecks (render > 16ms = FPS < 60)
3. Verificar cache hits no log (deve ser > 80% após warm-up)

### XSS executou (CRÍTICO)
1. **PARAR IMEDIATAMENTE**
2. Verificar `sanitizeText()` em `src/tarkan/utils/sanitize.js`
3. Reportar como **BLOCKER** (não fazer commit/deploy)

---

## 📊 RELATÓRIO FINAL

Após executar todos os 8 testes, preencher:

**Data**: ________________  
**Executor**: ________________  
**Branch**: ________________  

**Resultado Geral**:
- ✅ Todos os 8 testes passaram → **GATE 2 APROVADO** (prosseguir para commit)
- ❌ 1 ou mais testes falharam → **GATE 2 REPROVADO** (aplicar fixes)

**Próximos Passos**:
- Se APROVADO: Commit E2.1 + escolher FASE F (testes) ou E3 (timeline)
- Se REPROVADO: Usar "Prompt E2.1 — Gate 2: Fix pack" para correção focada

**Observações**:
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________

---

**Versão**: 1.0.0  
**Última atualização**: 2025-01-04  
**Responsável**: Equipe E2 (useMarkers Integration)
