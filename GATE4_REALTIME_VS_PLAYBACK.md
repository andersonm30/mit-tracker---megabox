# ✅ Gate 4 Implementado: Realtime vs Playback + Single Writer

## 📊 Status
- **Data**: 14/01/2026 13:01
- **Arquivos Modificados**: 
  - [src/tarkan/components/kore-map.vue](src/tarkan/components/kore-map.vue) - Flags de controle
  - [src/store/modules/devices.js](src/store/modules/devices.js) - Bloqueio de realtime
- **Lint**: ✅ Passou sem erros
- **Compile**: ✅ Sem erros

---

## 🎯 Problema Resolvido

**Sintoma:** FPS cai, flicker, travadas depois de play/stop, "briga" entre realtime e playback

**Causa Raiz:** Realtime e Playback escrevem no mesmo marker/camada simultaneamente

**Solução:** Single Writer Pattern - quando playback ativo, realtime fica "mute"

---

## 🔧 Implementação

### 1️⃣ Flags de Estado (kore-map.vue)

```javascript
// GATE 4: REALTIME VS PLAYBACK - Single Writer Pattern
let isPlaybackActive = false;
let isPlaybackSeeking = false; // Opcional: diferencia play vs scrub/seek

// Expor no window para debug
window.__KORE_DEBUG__.playbackActive  // getter dinâmico
window.__KORE_DEBUG__.playbackSeeking
```

**Localização:** Linha ~1493-1510

### 2️⃣ Controle do Gate (handleStateChange)

```javascript
// START: Liga o gate
if (state.isPlaying && !isPlayingRoute.value) {
  isPlaybackActive = true;
  isPlaybackSeeking = false;
  devLog('[GATE4] 🚪 Playback ativado - realtime bloqueado');
  // ... resto do código
}

// PAUSE: Mantém gate ativo
if (state.isPaused && isPlayingRoute.value) {
  isPlaybackActive = true; // mantém bloqueio
  devLog('[GATE4] ⏸️ Playback pausado - gate mantido ativo');
}

// STOP/END: Desliga o gate
if (!state.isPlaying && !state.isPaused && isPlayingRoute.value) {
  isPlaybackActive = false;
  isPlaybackSeeking = false;
  devLog('[GATE4] 🚪 Playback parado - realtime liberado');
  // ... resto do código
}
```

**Localização:** kore-map.vue linha ~1950-1997

### 3️⃣ Bloqueio de Realtime (devices.js)

#### updatePosition (single device)

```javascript
updatePosition(state, p) {
  // ... atualiza positionsList ...
  
  // GATE 4: Bloquear realtime durante playback
  const isPlaybackActive = window.__KORE_DEBUG__?.playbackActive ?? false;
  if (isPlaybackActive) {
    // Ainda atualiza positionsList (UI/tabelas podem usar)
    // Mas NÃO mexe em Leaflet markers/layers
    return;
  }
  
  // ... resto do código de update de markers ...
}
```

**Localização:** devices.js linha ~742-767

#### updatePositions (batch)

```javascript
updatePositions(state, positions) {
  // GATE 4: Bloquear realtime durante playback
  const isPlaybackActive = window.__KORE_DEBUG__?.playbackActive ?? false;
  if (isPlaybackActive) {
    // Ainda atualiza positionsList
    positions.forEach((p) => {
      state.positionsList[p.deviceId] = p;
    });
    return;
  }
  
  // ... resto do código de batch update ...
}
```

**Localização:** devices.js linha ~871-885

---

## 🧪 Como Testar

### Cenário 1: Playback ON (30s)

```javascript
// No console:
window.__KORE_DEBUG__.enabled = true

// 1. Abrir histórico de device
// 2. Dar play numa rota
// 3. Pan/zoom durante playback (15s)
// 4. Pausar playback
// 5. Pan/zoom novamente (5s)
// 6. Retomar play (5s)
// 7. Stop
// 8. Play novamente (5s)

// Observar console:
// [GATE4] 🚪 Playback ativado - realtime bloqueado
// [KORE] fps=XX layers=YY markers=ZZ active=WW leaked=0
// [GATE4] ⏸️ Playback pausado - gate mantido ativo
// [GATE4] 🚪 Playback parado - realtime liberado
```

#### ✅ Resultado Esperado

- **Sem flicker** do carro durante playback
- **Sem "puxar"** pro realtime no meio do play
- **FPS estável** ou queda mínima durante playback
- **FPS recupera** após stop (~60fps)
- `active` não cresce infinitamente
- `leaked` = 0

#### ❌ Sintomas de Problema

- Carro "pula" entre posição real e playback
- FPS vai "ladeira abaixo" após múltiplos play/stop
- `active` ou `markers` crescem sem controle

### Cenário 2: Playback OFF (realtime puro, 30s)

```javascript
// Sem playback ativo:
window.__KORE_DEBUG__.enabled = true

// 1. Deixar 30s rodando em realtime
// 2. Pan/zoom 5x
// 3. Observar console

// Output esperado:
// [KORE] fps=60 layers=15 markers=120 active=135 leaked=0
// (sem logs de [GATE4])
```

#### ✅ Resultado Esperado

- `active`/`markers` estabiliza
- `fps` estável (~60fps)
- Sem logs de gate (realtime flui normalmente)

---

## 📈 Métricas de Sucesso (GO/NO-GO)

### ✅ Gate funcionando

- Console mostra `[GATE4]` logs ao dar play/pause/stop
- `window.__KORE_DEBUG__.playbackActive === true` durante playback
- `window.__KORE_DEBUG__.playbackActive === false` após stop
- Markers não "brigam" (sem flicker)
- FPS não degrada após múltiplos play/stop
- `active` volta ao baseline após stop

### ❌ Gate com problema

- Logs de gate não aparecem
- `playbackActive` sempre false
- Flicker continua durante playback
- FPS cai continuamente
- `leaked` aumenta

---

## 🔍 Debug Via Console

```javascript
// Verificar estado do gate:
window.__KORE_DEBUG__.playbackActive  // deve ser true durante play

// Forçar gate manualmente (teste):
window.__KORE_DEBUG__.playbackActive = true // bloqueia realtime
window.__KORE_DEBUG__.playbackActive = false // libera realtime

// Verificar se realtime está bloqueado:
// Durante playback, não deve haver chamadas a moveTo() nos markers reais
```

---

## 🎯 Próximos Passos (Se Ainda Houver Problemas)

### A. FPS ainda cai durante playback

**Diagnóstico:**
```javascript
// Durante playback, verificar:
window.__KORE_DEBUG__.playbackActive // deve ser true
// Se console mostrar muitos updates de marker → aplicar rafThrottle
```

**Solução:** Aplicar `rafThrottle` no `handlePlaybackTick`:
```javascript
const handlePlaybackTickThrottled = rafThrottle(handlePlaybackTick);
// usar handlePlaybackTickThrottled no composable
```

### B. Markers "voltam" pro realtime durante pause

**Diagnóstico:**
```javascript
// Durante PAUSE:
window.__KORE_DEBUG__.playbackActive // deve ser true (mantido)
```

**Solução:** Já implementado - pause mantém gate ativo

### C. Memória/active cresce infinitamente

**Diagnóstico:**
```javascript
window.$overlayStats() // verificar leaked e active
```

**Solução:** Passo 5 - Reuso de markers por deviceId

---

## 📝 Notas Técnicas

### Single Writer Pattern

**Regra de Ouro:** Apenas UMA fonte escreve no marker em qualquer momento

**Antes (❌ problema):**
- Realtime: `marker.moveTo(lat, lng)`
- Playback: `playMarker.setLatLng(lat, lng)`
- **Resultado:** Briga, flicker, update storm

**Depois (✅ solução):**
- Realtime: bloqueado se `isPlaybackActive === true`
- Playback: escreve livremente (owner exclusivo)
- **Resultado:** Smooth, sem briga, FPS estável

### Por que PAUSE mantém gate ativo?

Se desligássemos o gate durante PAUSE:
1. Realtime atualizaria marker → volta pra posição "atual"
2. User retoma play → marker "pula" de volta pro histórico
3. **UX ruim:** movimento brusco/inesperado

**Solução:** Manter gate ativo = marker "congela" na posição do pause

### Throttle já existente ainda funciona

O gate NÃO substitui o throttle do devices.js:
- **Gate:** evita disputa realtime vs playback
- **Throttle:** evita update storm do realtime (quando ativo)

**Ambos trabalham juntos:**
```
WebSocket → updatePosition() 
  ↓
  Gate 4? → se playback ativo, RETURN
  ↓
  Throttle → limita a 150ms por device
  ↓
  moveTo() → atualiza marker
```

---

## 🔗 Arquivos Modificados

### [src/tarkan/components/kore-map.vue](src/tarkan/components/kore-map.vue)

- Linha ~1493: Flags `isPlaybackActive` e `isPlaybackSeeking`
- Linha ~1505: Expor em `window.__KORE_DEBUG__`
- Linha ~1950: `handleStateChange` - liga/desliga gate

### [src/store/modules/devices.js](src/store/modules/devices.js)

- Linha ~754: `updatePosition` - Gate 4 check
- Linha ~873: `updatePositions` - Gate 4 check batch

---

## 📚 Documentação Relacionada

- [PERFORMANCE_PATCHES_APPLIED.md](PERFORMANCE_PATCHES_APPLIED.md) - Patches 2 e 3
- [OBSERVABILITY.md](OBSERVABILITY.md) - Sistema de debug
- [PERF_NOTES.md](PERF_NOTES.md) - Histórico de otimizações

---

## ✅ Checklist de Deployment

- [x] Código implementado
- [x] Flags de controle criadas
- [x] handleStateChange atualizado
- [x] updatePosition com gate
- [x] updatePositions com gate
- [x] Lint passou
- [x] Compile passou
- [x] Debug helpers expostos
- [ ] **Aguardando**: User testar cenários 1 e 2
- [ ] **Próximo**: Reuso de markers por deviceId (se `active` ainda crescer)
- [ ] **Próximo**: rafThrottle no playbackTick (se FPS ainda cair durante play)

---

## 🚀 Benefícios Esperados

### Performance

- ✅ FPS estável durante playback (não vai "ladeira abaixo")
- ✅ Sem update storm (realtime mute durante play)
- ✅ CPU/GPU relaxam (menos recálculos de posição)

### UX

- ✅ Sem flicker do carro
- ✅ Sem "pulo" entre realtime e playback
- ✅ Smooth play/pause/stop/resume
- ✅ Animação premium sempre consistente

### Manutenibilidade

- ✅ Código mais previsível (single writer)
- ✅ Debug mais fácil (gate explícito)
- ✅ Menos race conditions

---

## 💡 Dica de Otimização Extra

Se após Gate 4 o FPS ainda cair DURANTE playback (não após, mas durante):

**Aplicar rafThrottle no handlePlaybackTick:**

```javascript
// Criar versão throttled:
const handlePlaybackTickThrottled = rafThrottle((index) => {
  // ... lógica original de handlePlaybackTick ...
});

// Usar no composable:
playback = useRoutePlayback({
  callbacks: {
    onTick: handlePlaybackTickThrottled, // <-- throttled
    onStateChange: handleStateChange,
    onComplete: handlePlaybackComplete
  }
});
```

Isso limita updates do playback a 60fps mesmo que o composable tente rodar mais rápido.
