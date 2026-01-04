# E1_AUDIT — Auditoria de Map Interaction

**Data**: 2026-01-03  
**Auditor**: GitHub Copilot  
**Objetivo**: Identificar interações Leaflet diretas no `kore-map.vue` e validar isolamento do `useMapInteraction.ts`

---

## 📋 Resumo Executivo

**Status do Isolamento**: ⚠️ **PARCIAL (60%)** — Composable existe e funciona, mas há vazamento significativo de código Leaflet no componente.

**Principais Achados:**
- ✅ `useMapInteraction.ts` está bem estruturado e funcional
- ⚠️ **20+ acessos diretos** a `map.value.leafletObject` no componente
- ⚠️ **Event listeners** Leaflet gerenciados manualmente (`on/off`)
- ⚠️ **Search Control** Leaflet criado diretamente no componente
- ⚠️ **setTimeout duplo** no flyTo (pode ser otimizado)
- ✅ ResizeObserver já foi movido para o composable

---

## 🔍 Análise Detalhada

### ✅ O Que Já Está Isolado (useMapInteraction.ts)

| Método | Status | Notas |
|--------|--------|-------|
| `flyTo()` | ✅ Isolado | Com setTimeout duplo (herança legado) |
| `zoomIn()` | ✅ Isolado | Validação de map ready OK |
| `zoomOut()` | ✅ Isolado | Validação de map ready OK |
| `invalidateSize()` | ✅ Isolado | Com requestAnimationFrame |
| `latLngToContainerPoint()` | ✅ Isolado | Try/catch implementado |
| `bindGeofenceHandlers()` | ✅ Isolado | Window event listener |
| `cleanup()` | ✅ Isolado | ResizeObserver + listeners |

**Arquitetura do Composable:** ✅ CORRETA
- Dependency Injection via callbacks
- Guards de validação (`isMapReady`, `hasMapMethod`)
- Cleanup obrigatório
- Zero lógica de negócio

---

### ⚠️ O Que Ainda Está NO COMPONENTE (Precisa Mover)

#### 1. **Acesso Direto ao Leaflet Object** (20+ ocorrências)

**Localizações:**

```typescript
// Linha 1215: getBounds para lazy load
const bounds = map.value?.leafletObject?.getBounds();

// Linha 1626-1627: Event listeners manuais
leafletMap.on('dragstart', onUserInteraction);
leafletMap.on('zoomstart', onUserInteraction);

// Linha 1643: getBounds para safe viewport
const bounds = leafletMap.getBounds();

// Linha 1684: panTo direto
map.value?.leafletObject?.panTo([lat, lng], { animate: true, duration: 0.25 });

// Linha 1767: panTo via safeMapOperation (guard)
leafletMap.panTo([lat, lng], { animate: true, duration: 0.25 });

// Linha 1863 e 1965: on/off manual de eventos
m.off('moveend zoomend', updateMapBounds);
m.on('moveend zoomend', updateMapBounds);

// Linha 2055-2120: Search Control Leaflet
const map = window.$map.leafletObject;
window.$searchControl = new L.Control.Search({...});
map.addControl(window.$searchControl);
```

**Risco**: Quebra de isolamento, dificulta teste, código espalhado.

---

#### 2. **Funções que Devem Ser Movidas Para o Composable**

| Função | Localização | Motivo | Prioridade |
|--------|-------------|--------|------------|
| `setupUserInteractionListeners()` | Linha 1613 | Acessa `leafletMap.on()` | 🔴 ALTA |
| `isInSafeViewport()` | Linha 1638 | Usa `leafletMap.getBounds()` | 🔴 ALTA |
| `smartPan()` | Linha 1674 | Usa `map.value.leafletObject.panTo()` | 🔴 ALTA |
| `updateMapBounds()` | Linha ~1640 | Usa `leafletMap.getBounds()` | 🟡 MÉDIA |
| `toggleMapSearch()` | Linha 2053 | Cria `L.Control.Search()` | 🟡 MÉDIA |

---

#### 3. **Event Listeners Manuais**

**Problema**: Event listeners Leaflet gerenciados manualmente no componente

```typescript
// SETUP (linha 1626-1627)
leafletMap.on('dragstart', onUserInteraction);
leafletMap.on('zoomstart', onUserInteraction);

// BIND (linha 1965)
m.on('moveend zoomend', updateMapBounds);

// UNBIND (linha 1865)
m.off('moveend zoomend', updateMapBounds);
```

**Risco**: Se componente desmontar sem chamar cleanup, listeners ficam ativos (memory leak).

**Solução**: Mover para o composable com cleanup garantido.

---

#### 4. **setTimeout/setInterval no Componente**

| Localização | Tipo | Propósito | Status |
|-------------|------|-----------|--------|
| Linha 1594 | `setTimeout` | Playback log throttle | ⚠️ Legítimo (log) |
| Linha 2114 | `setTimeout` | Focus no search input | ⚠️ Legítimo (UX) |
| Linha 2380 | `setTimeout` | Debounce helper | ⚠️ Legítimo (util) |
| Linha 2825 | `setTimeout` | ? (precisa verificar) | ⚠️ Verificar |
| Composable flyTo | `setTimeout` duplo | Guard rail legado | 🔴 OTIMIZAR |

**Nota**: Timers de log/UX são legítimos. O problema é o `setTimeout` duplo no `flyTo`.

---

#### 5. **Search Control Leaflet**

**Problema**: Criação e gerenciamento de `L.Control.Search` no componente (linhas 2053-2120)

```typescript
window.$searchControl = new L.Control.Search({...});
map.addControl(window.$searchControl);
map.removeControl(window.$searchControl);
```

**Risco**: 
- Controle global (`window.$searchControl`) sem cleanup
- Pode vazar memória se não for removido corretamente
- Lógica de negócio (store.dispatch) misturada com Leaflet

**Solução**: Criar método no composable `setSearchControl({ add: boolean, options })`.

---

## 🛡️ Riscos Identificados

### 🔴 CRÍTICOS (Devem ser corrigidos)

1. **Memory Leak - Event Listeners**
   - `on('moveend zoomend')` sem garantia de `off()`
   - Se componente desmontar em estado inválido, listeners permanecem

2. **Double setTimeout no flyTo**
   - Causa delay de 200ms sem necessidade real
   - Pode ser substituído por `leafletMap.whenReady()` (já disponível no Leaflet)

3. **Search Control Global**
   - `window.$searchControl` nunca limpo adequadamente
   - Pode acumular layers/markers ao longo do tempo

### 🟡 MÉDIOS (Melhorar quando possível)

4. **Acesso Direto ao leafletObject**
   - 20+ chamadas diretas quebram isolamento
   - Dificulta teste e manutenção

5. **Funções de Pan/Bounds no Componente**
   - `smartPan`, `isInSafeViewport`, `updateMapBounds` pertencem ao composable
   - Lógica de map interaction misturada com lógica de negócio

### 🟢 BAIXOS (Aceitáveis por enquanto)

6. **Timers de UX/Log**
   - `setTimeout` para focus, log, debounce são legítimos
   - Não representam risco desde que sejam limpos

---

## 📐 API Atual vs Proposta

### API Atual (useMapInteraction.ts)

```typescript
interface UseMapInteractionReturn {
  flyTo(lat, lng, zoom, options?)
  zoomIn()
  zoomOut()
  invalidateSize()
  latLngToContainerPoint(latlng)
  bindGeofenceHandlers()
  unbindGeofenceHandlers()
  cleanup()
}
```

### API Proposta (Completa)

```typescript
interface UseMapInteractionReturn {
  // Navegação
  flyTo(lat, lng, zoom, options?)        // ✅ Já existe
  panTo(lat, lng, options?)              // 🆕 Adicionar
  setView(lat, lng, zoom, options?)      // 🆕 Adicionar
  fitBounds(bounds, options?)            // 🆕 Adicionar
  
  // Zoom
  zoomIn()                                // ✅ Já existe
  zoomOut()                               // ✅ Já existe
  setZoom(level)                          // 🆕 Adicionar
  
  // Bounds e viewport
  getBounds()                             // 🆕 Adicionar
  isInViewport(lat, lng, padding?)       // 🆕 Adicionar (isInSafeViewport)
  
  // Eventos
  onMapEvent(event, handler)             // 🆕 Adicionar (dragstart, zoomstart, moveend, etc)
  offMapEvent(event, handler)            // 🆕 Adicionar
  
  // Controles
  addControl(control, options?)          // 🆕 Adicionar (search, custom)
  removeControl(control)                 // 🆕 Adicionar
  
  // Utilitários
  invalidateSize()                        // ✅ Já existe
  latLngToContainerPoint(latlng)         // ✅ Já existe
  containerPointToLatLng(point)          // 🆕 Adicionar
  
  // Geofence (já tem)
  bindGeofenceHandlers()                 // ✅ Já existe
  unbindGeofenceHandlers()               // ✅ Já existe
  
  // Lifecycle
  cleanup()                               // ✅ Já existe
}
```

---

## 🔧 Plano de Refatoração

### Fase 1: Eventos e Listeners (Crítico) 🔴

**Objetivo**: Centralizar todos os event listeners no composable

**Tarefas:**
1. Adicionar método `onMapEvent(event, handler)` no composable
2. Adicionar método `offMapEvent(event, handler)` no composable
3. Mover `setupUserInteractionListeners()` para o composable
4. Mover bind/unbind de `moveend/zoomend` para o composable
5. Garantir cleanup automático de todos os listeners

**Arquivos Afetados:**
- `useMapInteraction.ts` (adicionar métodos)
- `kore-map.vue` (remover linhas 1626-1627, 1863, 1965)

---

### Fase 2: Pan e Bounds (Alto Impacto) 🔴

**Objetivo**: Mover toda lógica de pan/bounds para o composable

**Tarefas:**
1. Adicionar `panTo(lat, lng, options)` no composable
2. Adicionar `getBounds()` no composable
3. Adicionar `isInViewport(lat, lng, padding)` no composable (renomear `isInSafeViewport`)
4. Mover `smartPan()` para o composable (ou para `useMapFollow` se fizer mais sentido)
5. Mover `updateMapBounds()` para o composable

**Arquivos Afetados:**
- `useMapInteraction.ts` (adicionar métodos)
- `kore-map.vue` (remover linhas 1638-1691)

---

### Fase 3: Otimizar flyTo (Remover setTimeout Duplo) 🟡

**Objetivo**: Substituir `setTimeout` duplo por `whenReady()`

**Implementação:**
```typescript
const flyTo = (lat, lng, zoom, options = {}) => {
  if (!isMapReady()) return;
  
  const mapObj = getMapObject();
  if (!mapObj?.leafletObject) return;
  
  // ✅ Usar whenReady ao invés de setTimeout duplo
  mapObj.leafletObject.whenReady(() => {
    mapObj.leafletObject.flyTo([lat, lng], zoom, {
      animate: options.animate ?? true,
      duration: options.duration ?? 1.5
    });
  });
};
```

**Arquivos Afetados:**
- `useMapInteraction.ts` (otimizar flyTo)

---

### Fase 4: Search Control (Isolamento) 🟡

**Objetivo**: Mover gerenciamento de controles para o composable

**Tarefas:**
1. Adicionar `addControl(control, options)` no composable
2. Adicionar `removeControl(control)` no composable
3. Criar método helper `createSearchControl(options)` (pode ser util separado)
4. Mover `toggleMapSearch()` para usar composable
5. Garantir cleanup de `window.$searchControl` no `cleanup()`

**Arquivos Afetados:**
- `useMapInteraction.ts` (adicionar métodos de controle)
- `kore-map.vue` (simplificar toggleMapSearch)

---

### Fase 5: Validação e Hardening 🟢

**Objetivo**: Garantir robustez total

**Tarefas:**
1. Adicionar try/catch em todos os métodos novos
2. Garantir que `cleanup()` pode ser chamado múltiplas vezes
3. Adicionar guards para chamadas após cleanup
4. Validar que nenhum listener fica órfão
5. Adicionar logs DEV-only para debug

---

## ✅ Checklist de Validação Final

Após refatoração, o componente deve atender:

- [ ] **Zero acessos diretos** a `map.value.leafletObject` no componente
- [ ] **Zero imports** de `L` (Leaflet) no componente
- [ ] **Zero event listeners** Leaflet gerenciados no componente
- [ ] **Zero setTimeout duplo** (usar `whenReady()`)
- [ ] **Cleanup único e centralizado** no composable
- [ ] **Todos os métodos com guards** (map ready, após cleanup)
- [ ] **Search control limpo** no cleanup
- [ ] **Nenhuma mudança visual ou comportamental**

---

## 📊 Métricas de Impacto

### Estado Atual

| Métrica | Valor | Status |
|---------|-------|--------|
| Acessos `leafletObject` no componente | 20+ | ⚠️ |
| Event listeners manuais | 4 | ⚠️ |
| Funções de map no componente | 5 | ⚠️ |
| setTimeout no flyTo | 2 | ⚠️ |
| Composable funcional | Sim | ✅ |
| Cleanup garantido | Parcial | ⚠️ |

### Meta Pós-Refatoração

| Métrica | Meta | Redução |
|---------|------|---------|
| Acessos `leafletObject` no componente | 0 | -100% |
| Event listeners manuais | 0 | -100% |
| Funções de map no componente | 0 | -100% |
| setTimeout no flyTo | 0 | -100% |
| Composable funcional | Sim | = |
| Cleanup garantido | Total | +100% |

---

## 🎯 Prioridades Recomendadas

### Executar AGORA (Crítico) 🔴
1. **Fase 1**: Eventos e Listeners — evita memory leaks
2. **Fase 3**: Otimizar flyTo — melhora UX (remove delay 200ms)

### Executar EM BREVE (Alto Impacto) 🟡
3. **Fase 2**: Pan e Bounds — completa o isolamento
4. **Fase 4**: Search Control — limpa globals

### Executar DEPOIS (Polimento) 🟢
5. **Fase 5**: Hardening — garantias extras

---

## 📝 Notas Importantes

### Por Que Não Mover Tudo de Uma Vez?

- Cada fase pode ser testada independentemente
- Reduz risco de regressão
- Permite rollback granular se necessário
- Facilita code review

### O Que NÃO Deve Ser Movido?

- Lógica de negócio (store, router) → permanece no componente
- Callbacks de UI (ElMessage, window.$showTip) → permanece no componente
- Timers de UX/log (focus, debounce) → legítimos no componente

### Critério de Isolamento

**Mover para composable SE:**
- Acessa Leaflet diretamente (`map.leafletObject`, `L.`)
- Gerencia event listeners do mapa
- Calcula bounds/viewport
- Controla navegação (pan, zoom, flyTo)

**Manter no componente SE:**
- Lógica de negócio (when, why)
- Acesso ao store/router
- Callbacks de UI
- Timers de UX (exceto guard rails)

---

## 🔗 Referências

- **Composable Atual**: [src/tarkan/composables/useMapInteraction.ts](../src/tarkan/composables/useMapInteraction.ts)
- **Componente**: [src/tarkan/components/kore-map.vue](../src/tarkan/components/kore-map.vue)
- **Leaflet API**: https://leafletjs.com/reference.html
- **FASE D3 (Follow)**: [docs/FASE_D3_FOLLOW_TOOLTIP.md](./FASE_D3_FOLLOW_TOOLTIP.md)

---

## ✅ Próximo Passo

**Recomendação**: Executar **Fase 1 + Fase 3** juntas (event listeners + otimizar flyTo)

Motivo:
- São as mudanças mais críticas (memory leaks + UX)
- Têm baixo risco de regressão
- Impacto imediato na qualidade

**Após auditoria aprovada**, iniciar Prompt E1.1 com foco em Fase 1 + 3.

---

**⚠️ AUDITORIA CONCLUÍDA — Refatoração recomendada mas não obrigatória. Código atual funciona, mas pode ser melhorado significativamente.**
