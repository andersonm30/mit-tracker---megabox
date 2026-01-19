# 🧪 PR#4 - Roteiro de Validação (3 minutos)

## 🎯 Comandos no Console (DevTools)

Abra o console do Chrome/Edge e rode estes comandos:

### 1️⃣ Verificar Stats (a qualquer momento)

```javascript
window.$overlayStats()
```

**Saída esperada**:
```
┌─────────────┬────────┐
│   (index)   │ Values │
├─────────────┼────────┤
│ registered  │   47   │
│ removed     │   47   │
│ leaked      │   0    │
│ active      │   0    │
└─────────────┴────────┘

📋 Interpretação:
  • registered: 47 (total criado desde início)
  • removed: 47 (total removido)
  • leaked: 0 (erros ao remover)
  • active: 0 (atual no mapa)

✅ Ideal: active === 0 após clearAllOverlays()
```

### 2️⃣ Limpar Manualmente (para testar)

```javascript
window.$clearMap('teste-manual')
```

**Saída esperada**:
```
🧹 [PR#4] clearAllOverlays: teste-manual
  📊 Stats ANTES: { active: 25, ... }
  ✅ Stats DEPOIS: { active: 0, ... }
  🎯 Removidos: 25
```

---

## 🧪 Teste A: Trocar Device 10x

### Passos:
1. Abrir "Histórico / Rota"
2. Selecionar Device A, clicar "Mostrar"
3. Rodar no console: `window.$overlayStats()`
4. Trocar para Device B, "Mostrar"
5. Rodar: `window.$overlayStats()`
6. Repetir para C, D, E... (10x total)

### ✅ Critérios de Sucesso:

**No console, você DEVE ver**:
```
🧹 [PR#4] clearAllOverlays: load-new-route
  📊 Stats ANTES: { active: 25, ... }
  ✅ Stats DEPOIS: { active: 0, ... }
  🎯 Removidos: 25
🎨 [PR#4] drawFullRoute: 450 pontos
  ✅ Normalizados: 448 válidos
```

**Validação após 10 trocas**:
```javascript
window.$overlayStats()
// active DEVE ser > 0 (rota atual no mapa)
// removed DEVE ser ~= registered (diferença < 5%)
// leaked DEVE ser 0
```

### ❌ FALHOU se:
- `active` cresce a cada troca (ex: 25 → 50 → 75...)
- `leaked` > 0
- Mapa "pisca" ao trocar
- Rota antiga + nova aparecem juntas

---

## 🧪 Teste B: Trocar Período 10x (Rápido)

### Passos:
1. Mesmo device
2. Mudar período para "Últimos 7 dias", "Mostrar"
3. ANTES de carregar, mudar para "Últimos 3 dias", "Mostrar"
4. ANTES de carregar, mudar para "Últimos 1 dia", "Mostrar"
5. Aguardar última request completar
6. Rodar: `window.$overlayStats()`

### ✅ Critérios de Sucesso:

**No console**:
```
🧹 [PR#4] clearAllOverlays: load-new-route  (3x)
🎨 [PR#4] drawFullRoute: 150 pontos        (só o último)
```

**Validação**:
- Apenas a rota do último período visível
- `active` reflete só a rota atual (não acumula)
- `leaked === 0`

### ❌ FALHOU se:
- Múltiplas rotas sobrepostas
- `active` alto demais (indica duplicação)

---

## 🧪 Teste C: Sair e Voltar

### Passos:
1. Carregar rota em "Histórico / Rota"
2. Rodar: `window.$overlayStats()` (anote o `active`)
3. Navegar para "Dashboard" ou "Relatórios"
4. Rodar: `window.$overlayStats()` (DEVE ser `active: 0`)
5. Voltar para "Histórico / Rota"
6. Rodar: `window.$overlayStats()`

### ✅ Critérios de Sucesso:

**No console ao sair**:
```
🧹 [PR#4] clearAllOverlays: route-leave
  📊 Stats ANTES: { active: 25, ... }
  ✅ Stats DEPOIS: { active: 0, ... }
```

**Validação**:
- Ao sair: `active === 0`
- Ao voltar: mapa limpo (sem rota anterior)

### ❌ FALHOU se:
- Não logou `clearAllOverlays: route-leave`
- `active` não zerou ao sair
- Rota anterior persiste ao voltar

---

## 🚨 Diagnóstico por Sintoma

### Sintoma 1: Mapa "pisca" ao trocar device
**Causa**: Mapa está sendo destruído/recriado (v-if/key dinâmico)
**Debug**:
```javascript
// Verificar se <LMap> tem :key dinâmico
// Procurar por v-if no kore-map ou RouterView
```

### Sintoma 2: Rotas duplicadas (antiga + nova)
**Causa**: `clearAllOverlays` não remove polylines/layers
**Debug**:
```javascript
window.$overlayStats()
// Se active cresce: registry não está removendo
// Se active === 0 mas visual duplicado: layers fora do registry
```

### Sintoma 3: `active` cresce indefinidamente
**Causa**: Overlays não estão sendo registrados no `overlayRegistry`
**Solução**: Verificar onde polylines/markers são criados

### Sintoma 4: `leaked > 0`
**Causa**: Método de remoção errado para Leaflet
**Debug**: Ver logs de erro no console (try/catch silencioso)

---

## 📊 Tabela de Valores Esperados

| Momento | registered | removed | leaked | active |
|---------|------------|---------|--------|--------|
| Início (sem rota) | 0 | 0 | 0 | 0 |
| Após 1ª rota | ~25 | 0 | 0 | ~25 |
| Após clear | ~25 | ~25 | 0 | 0 |
| Após 2ª rota | ~50 | ~25 | 0 | ~25 |
| Após 10 trocas | ~250 | ~225 | 0 | ~25 |
| Após sair | ~250 | ~250 | 0 | 0 |

**Regras ouro**:
- `active` NUNCA deve crescer além da rota atual (~20-30)
- `leaked` SEMPRE deve ser 0
- `removed` deve ser ~= `registered - active`

---

## 🔍 Validação Profunda (Opcional)

### Memory Profiler (se `active` sempre 0 mas UI duplica)

1. DevTools > Memory > Take Heap Snapshot
2. Trocar device 10x
3. Take Heap Snapshot novamente
4. Comparar > procurar "Detached"
5. Se houver 100+ "Detached DOM nodes": memory leak real

### Network Throttling (validar PR#3 + PR#4 juntos)

1. DevTools > Network > Slow 3G
2. Clicar "Mostrar" 5x rápido
3. Aguardar todas as requests
4. Verificar: só última renderiza, `active` estável

---

## 📝 Reporte de Feedback

**Se TUDO PASSOU** ✅:
> "Rodei A/B/C, stats estáveis, leaked=0, active sempre < 30. Bora PR#5!"

**Se FALHOU** ❌, informar:
1. Qual teste falhou (A/B/C)?
2. Sintoma exato (pisca? duplica? active cresce?)
3. Screenshot do `window.$overlayStats()` após 10 trocas
4. Log do console (copiar bloco de `clearAllOverlays`)

---

## 🎯 Próximo Passo

Se validação passou → **PR#5 - Unificar /tarkan vs /api**

Se validação falhou → Patch cirúrgico com base no sintoma reportado
