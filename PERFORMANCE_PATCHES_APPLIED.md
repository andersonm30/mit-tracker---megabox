# ✅ Performance Patches - "FPS cai conforme mexe no mapa"

## 📊 Status
- **Data**: 14/01/2026 12:49
- **Arquivo Principal**: [src/tarkan/components/kore-map.vue](src/tarkan/components/kore-map.vue)
- **Lint**: ✅ Passou sem erros

---

## 🔧 PATCH 2: OverlayRegistry + Diagnóstico Unificado

### O que foi feito
1. **Conectado overlayRegistry ao `__KORE_DEBUG__`**
   - Agora o diagnóstico tem acesso aos stats do registry
   - Linha: ~902 (`window.__KORE_DEBUG__.overlayRegistry = overlayRegistry`)

2. **Métricas ampliadas no FPS monitor**
   - Adicionado `active` (objetos ativos no mapa)
   - Adicionado `leaked` (objetos que falharam ao remover)
   - Linha: ~2468-2480

3. **Output de diagnóstico enriquecido**
   ```javascript
   fps=XX layers=YY markers=ZZ active=WW leaked=LL listeners=MM
   ```

### Como usar
```javascript
// No console do navegador:
window.__KORE_DEBUG__.enabled = true

// Aguarde 30s interagindo com o mapa (pan, zoom, toggle layers)
// Observe console a cada 1s para ver métricas em tempo real

// Verificar stats detalhados:
window.$overlayStats()
```

---

## 🔧 PATCH 3: rafThrottle (Update Storm Killer)

### O que foi feito
1. **Função `rafThrottle()` implementada**
   - Limita updates a 1 por frame (60fps máx)
   - Linha: ~858-881
   - Exposta em `window.__KORE_DEBUG__.rafThrottle`

2. **Padrão de uso documentado**
   ```javascript
   // Em vez de chamar direto:
   function updateMarkers(payload) {
     // lógica cara
   }
   
   // Wrap com rafThrottle:
   const updateMarkersThrottled = rafThrottle((payload) => {
     // lógica cara (roda no máximo 1x por frame)
   });
   
   // Chame sempre:
   updateMarkersThrottled(payload);
   ```

### Onde aplicar (próximos passos)
- ✅ **devices.js** já tem throttle próprio (MAP_THROTTLE_MS = 150ms)
- ⏳ **Futuros targets**:
  - Realtime marker updates em loop
  - Pan/zoom listeners
  - Layer redraw triggers
  - Playback tick updates (se FPS cair durante play)

---

## 📈 Critérios de Sucesso (GO/NO-GO)

### ✅ Saudável
- `listeners` para de crescer após primeiro mount
- `markers` fica estável (ou sobe/volta ao trocar camada)
- `active` = 0 após `window.$clearMap()`
- `leaked` = 0 ou muito baixo
- `fps` não degrada com o tempo (pode cair momentaneamente, mas volta)

### ❌ Ainda vazando
- `markers` só sobe e nunca volta
- `layers` só sobe e nunca volta
- `active` cresce sem controle
- `leaked` cresce continuamente
- `listeners` dobra após navegar e voltar
- `fps` cai em "ladeira abaixo" e não recupera

---

## 🧪 Como testar

### 1. Ativar diagnóstico
```javascript
window.__KORE_DEBUG__.enabled = true
```

### 2. Cenário básico (30s)
1. Pan no mapa 5x
2. Zoom in/out 3x
3. Toggle 2 camadas (eventos, geofences)
4. Selecionar device e seguir
5. Desselecionar

**Output esperado no console:**
```
[KORE] fps=60 layers=15 markers=120 active=135 leaked=0 listeners=8
[KORE] fps=58 layers=15 markers=120 active=135 leaked=0 listeners=8
[KORE] fps=60 layers=15 markers=120 active=135 leaked=0 listeners=8
```

### 3. Cenário stress (2min)
1. Abrir histórico de device
2. Iniciar playback
3. Pan/zoom durante playback
4. Pausar/retomar 3x
5. Voltar para realtime
6. Toggle layers múltiplas vezes

**Verificar:**
- `markers` volta ao baseline após voltar de playback?
- `active` volta a ~0 após clearAllOverlays?
- `leaked` permanece 0?
- `fps` recupera para ~60?

---

## 🔧 GATE 4: Realtime vs Playback (Single Writer)

### O que foi feito
1. **Flags de controle de estado**
   - `isPlaybackActive` - bloqueia realtime quando true
   - `isPlaybackSeeking` - diferencia play vs scrub (opcional)
   - Linha: ~1493-1510 (kore-map.vue)

2. **handleStateChange atualizado**
   - START: liga gate (`isPlaybackActive = true`)
   - PAUSE: mantém gate ativo (evita "pulo" pro realtime)
   - STOP/END: desliga gate (`isPlaybackActive = false`)
   - Linha: ~1950-1997 (kore-map.vue)

3. **Bloqueio em devices.js**
   - `updatePosition()`: retorna early se playback ativo
   - `updatePositions()`: retorna early se playback ativo
   - Ainda atualiza `positionsList` (UI pode precisar)
   - Mas NÃO mexe em Leaflet markers/layers
   - Linha: ~754 e ~873 (devices.js)

### Como usar
```javascript
// No console do navegador:
window.__KORE_DEBUG__.enabled = true

// Verificar estado do gate:
window.__KORE_DEBUG__.playbackActive  // true durante playback

// Testar playback:
// 1. Abrir histórico
// 2. Dar play
// 3. Observar logs no console:
//    [GATE4] 🚪 Playback ativado - realtime bloqueado
// 4. Pan/zoom durante playback (15s)
// 5. Verificar FPS estável, sem flicker
// 6. Stop
// 7. Observar:
//    [GATE4] 🚪 Playback parado - realtime liberado
```

### Problema resolvido
- ❌ **Antes**: Realtime e playback "brigam" pelo mesmo marker → flicker, FPS cai
- ✅ **Depois**: Single writer pattern → apenas playback escreve durante play

### Documentação completa
Ver [GATE4_REALTIME_VS_PLAYBACK.md](GATE4_REALTIME_VS_PLAYBACK.md) para:
- Testes detalhados (cenário 1 e 2)
- Critérios GO/NO-GO
- Debug via console
- Troubleshooting

---

## 🎯 Próximos passos (se ainda cair FPS)

### Opção A: Update storm detectado
**Sintoma**: `fps` cai mas contadores estáveis
**Solução**: Aplicar `rafThrottle` em:
- Playback tick handler
- Realtime position updates (se não estiver throttled)
- Layer redraw loops

### Opção B: Leak detectado
**Sintoma**: `active` ou `leaked` crescem sem parar
**Solução**:
- Auditar uso do overlayRegistry (verificar se todos addLayer/addMarker têm seu remove)
- Verificar cleanup no unmount
- Adicionar category tracking mais granular

### Opção C: Disputa Realtime vs Playback
**Sintoma**: FPS cai APENAS durante/após playback
**Solução**: Gate realtime vs playback (quando playback ativo, realtime não mexe no playMarker)

---

## 📝 Notas técnicas

### OverlayRegistry já implementado
O sistema já possui um `overlayRegistry` robusto em [src/map/overlayRegistry.js](src/map/overlayRegistry.js):
- Gerencia markers, polylines, layers, controls, listeners
- Suporta categorias (route, events, geofences)
- Stats detalhados (registered, removed, leaked, active)
- Cleanup centralizado via `clearAll()` ou `clear(category)`

**Patches aplicados apenas conectaram diagnóstico ao registry existente.**

### Throttle em devices.js
A store já possui throttle próprio:
- `MAP_THROTTLE_MS = 150ms` por device
- Flush garantido (último update sempre aplicado)
- Ver [src/store/modules/devices.js](src/store/modules/devices.js) linha ~765

**rafThrottle é complementar para casos onde RAF é mais apropriado que timer.**

---

## 🔗 Arquivos modificados
- [src/tarkan/components/kore-map.vue](src/tarkan/components/kore-map.vue)
  - Linha ~858: `rafThrottle()` function
  - Linha ~885: Expor rafThrottle em `__KORE_DEBUG__`
  - Linha ~902: Conectar overlayRegistry ao `__KORE_DEBUG__`
  - Linha ~2468: Incluir stats do registry no FPS monitor

---

## 📚 Documentação relacionada
- [OBSERVABILITY.md](OBSERVABILITY.md) - Sistema de debug já existente
- [PR4_MAP_CLEANUP_COMPLETE.md](PR4_MAP_CLEANUP_COMPLETE.md) - OverlayRegistry original
- [PERF_NOTES.md](PERF_NOTES.md) - Histórico de otimizações

---

## ✅ Checklist de deployment
- [x] Código implementado
- [x] Lint passou
- [x] Diagnóstico funcional (via `__KORE_DEBUG__`)
- [x] rafThrottle disponível para uso futuro
- [x] **Gate 4 implementado** - Realtime vs Playback (ver [GATE4_REALTIME_VS_PLAYBACK.md](GATE4_REALTIME_VS_PLAYBACK.md))
- [ ] **Aguardando**: User testar e reportar métricas
- [ ] **Próximo**: Aplicar rafThrottle em hotspots identificados
- [ ] **Próximo**: Reuso de markers por deviceId (se `active` crescer)
