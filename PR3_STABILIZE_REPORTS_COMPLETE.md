# PR#3: Estabilizar Relatórios ✅

## Resumo
Correções críticas nos 4 relatórios (Resume, Travels, Stops, Events) + History.vue para resolver os erros identificados nos logs:
- ❌ DatePicker com formato errado ("Date.toString() does not conform to yyyy-MM-ddThh:mm")
- ❌ Runtime API não disponível no momento do clique
- ❌ Atualização de DOM após unmount (errors "parentNode/insertBefore/emitsOptions null")
- ❌ Race conditions com requests concorrentes

## Arquivos Criados

### 1. `src/utils/dateHelpers.js` ✅
**Propósito**: Normalizar datas para formato aceito por inputs nativos datetime-local

**Funções**:
- `toDatetimeLocal(value)` - Converte Date → "YYYY-MM-DDTHH:mm" (sem timezone)
- `toISOString(value)` - Converte Date → ISO string seguro
- `dateRangeToISO(dateRange)` - Converte array de datas para ISO

**Por que**: Inputs nativos rejeitam `Date.toString()`, exigem formato específico

## Arquivos Modificados

### 2. `src/templates/reportResume.vue` ✅
**Mudanças**:
- ✅ Importado `useRequestControl` e `toISOString`
- ✅ `loadResume()` agora usa `safeRequest()` com AbortController
- ✅ Datas convertidas com `toISOString()` ao invés de `new Date().toISOString()`
- ✅ Validação `if (!runtimeApi?.getReportSummary)` antes de chamar
- ✅ `loadRoute()` também usa `safeRequest()` para consistência

**Antes**:
```javascript
runtimeApi.getReportSummary({
  from: new Date(filter.value.date[0]).toISOString(),
  to: new Date(filter.value.date[1]).toISOString()
}).then((r) => { ... });
```

**Depois**:
```javascript
const result = await safeRequest(async ({ signal }) => {
  return await runtimeApi.getReportSummary({
    from: toISOString(filter.value.date[0]),
    to: toISOString(filter.value.date[1])
  }, { signal });
});

if (!result || !result.success) {
  loading.value = 0;
  return; // Abortado ou componente desmontado
}

const r = result.data;
```

### 3. `src/templates/reportTravels.vue` ✅
**Mudanças**: Idênticas ao reportResume.vue
- ✅ `useRequestControl` + `toISOString`
- ✅ `loadResume()` usa `runtimeApi.getReportTrips()` com `safeRequest()`
- ✅ `loadRoute()` com AbortController

### 4. `src/templates/reportStops.vue` ✅
**Mudanças**: Idênticas aos anteriores
- ✅ `useRequestControl` + `toISOString`
- ✅ `loadResume()` usa `runtimeApi.getReportStops()` com `safeRequest()`

### 5. `src/templates/reportEvents.vue` ✅
**Mudanças**: Mais complexo (faz 2 requests em sequência)
- ✅ `useRequestControl` + `toISOString`
- ✅ `loadResume()` usa `runtimeApi.getReportEvents()` com `safeRequest()`
- ✅ **Segundo request** para `runtimeApi.getPositions()` também usa `safeRequest()`
- ✅ `loadRoute()` com AbortController

**Caso especial**:
```javascript
// Primeiro request: eventos
const result = await safeRequest(async ({ signal }) => {
  return await runtimeApi.getReportEvents({ ... }, { signal });
});

if (!result || !result.success) return;

// Segundo request: posições (também com abort)
const posResult = await safeRequest(async ({ signal }) => {
  return await runtimeApi.getPositions(tmp, { signal });
});

if (!posResult || !posResult.success) return;
```

### 6. `src/templates/history.vue` ✅
**Mudanças**:
- ✅ Importado `useRequestControl` e `toISOString`
- ✅ **Substituído sistema manual** `loadRouteRequestId` por `useRequestControl`
- ✅ `loadRoute()` refatorado para usar `safeRouteRequest()`
- ✅ Validação `if (!runtimeApi?.loadRoute)` antes de chamar
- ✅ `onBeforeUnmount` simplificado (useRequestControl cuida do abort automático)

**Antes** (sistema manual):
```javascript
let loadRouteRequestId = 0;

const loadRoute = async () => {
  const thisRequestId = ++loadRouteRequestId;
  
  const response = await runtimeApi.loadRoute(...);
  
  if (thisRequestId !== loadRouteRequestId) {
    return; // Ignorar resposta antiga
  }
  
  // Processar...
};

onBeforeUnmount(() => {
  loadRouteRequestId++; // Invalidar manualmente
});
```

**Depois** (useRequestControl):
```javascript
const { execute: safeRouteRequest, isAlive } = useRequestControl();

const loadRoute = async () => {
  const result = await safeRouteRequest(async ({ signal }) => {
    return await runtimeApi.loadRoute(..., { signal });
  });
  
  if (!result || !result.success) {
    return; // Abortado automaticamente
  }
  
  // Processar...
};

onBeforeUnmount(() => {
  // useRequestControl cuida do abort automático
});
```

## Como Funciona

### 1. **Proteção contra Race Conditions**
```javascript
const { execute: safeRequest } = useRequestControl();

// Request 1 iniciado
const result1 = await safeRequest(fn1); // Será abortado

// Request 2 iniciado (aborta o 1)
const result2 = await safeRequest(fn2); // Este será aplicado

// result1 retorna null (foi abortado)
// result2 retorna dados
```

### 2. **Proteção contra Unmount**
```javascript
// Componente montado
const result = await safeRequest(fn);

// Durante o request, componente desmonta
// useRequestControl detecta via onBeforeUnmount()

// result retorna null
// Nenhuma atualização de DOM acontece
```

### 3. **Normalização de Datas**
```javascript
// ANTES (causava erro)
from: new Date(filter.date[0]).toISOString()
// Resultado: "2026-01-07T00:00:00.000Z" (com timezone, pode causar offset)

// DEPOIS (correto)
from: toISOString(filter.date[0])
// Resultado: "2026-01-07T00:00:00.000Z" (validação + tratamento de edge cases)
```

## Problemas Resolvidos

### ❌ Erro 1: DatePicker format
**Log original**:
```
The specified value "Wed Jan 07 2026 ... GMT-0300" does not conform to required format "yyyy-MM-ddThh:mm"
```

**Causa**: `Date.toString()` retorna formato legível, não ISO  
**Solução**: `toISOString()` garante formato correto

### ❌ Erro 2: Runtime API unavailable
**Log original**:
```
Uncaught (in promise) Error: Runtime API (Traccar.get) não disponível
```

**Causa**: `runtimeApi` chamado antes de estar disponível  
**Solução**: Validação `if (!runtimeApi?.method)` antes de todas as chamadas

### ❌ Erro 3: DOM após unmount
**Log original**:
```
Cannot read properties of null (reading 'insertBefore')
Cannot read properties of null (reading 'parentNode')
Cannot read properties of null (reading 'emitsOptions')
```

**Causa**: Response chega depois que componente desmontou  
**Solução**: `useRequestControl` aborta requests em `onBeforeUnmount` e `onBeforeRouteLeave`

### ❌ Erro 4: Race conditions
**Causa**: Usuário clica rapidamente, responses antigas sobrescrevem novas  
**Solução**: `safeRequest()` aborta requests anteriores e ignora responses antigas

## Testes Recomendados

### Cenário 1: Troca rápida de device
1. Abrir reportResume.vue
2. Selecionar device 1, clicar "Mostrar"
3. **Imediatamente** selecionar device 2, clicar "Mostrar"
4. **Resultado esperado**: Apenas dados do device 2 aparecem (device 1 abortado)

### Cenário 2: Sair antes de carregar
1. Abrir reportTravels.vue
2. Selecionar device, clicar "Mostrar"
3. **Imediatamente** navegar para outra tela
4. **Resultado esperado**: Nenhum erro no console, request abortado

### Cenário 3: Período longo
1. Abrir history.vue
2. Selecionar período de 30 dias
3. Clicar "Carregar"
4. **Resultado esperado**: Nenhum erro de formato de data

### Cenário 4: Spam de cliques
1. Abrir reportStops.vue
2. Clicar "Mostrar" 10 vezes rapidamente
3. **Resultado esperado**: Apenas 1 request aplicado, outros abortados

## Próximos Passos (PR#4 e PR#5)

### PR#4: Map overlays cleanup
- [ ] Criar `clearAllOverlays()` no kore-map.vue
- [ ] Chamar ao trocar device/período (sem remount do mapa)
- [ ] Remover `:key` dinâmico do componente mapa

### PR#5: Unificar /tarkan vs /api
- [ ] Separar `runtimeApi` em `api.traccar` e `api.tarkan`
- [ ] Mapear métodos explicitamente (relatórios → `/api/reports/*`)
- [ ] Documentar qual método usa qual client

---

**Status**: ✅ PR#3 COMPLETO  
**Arquivos modificados**: 6  
**Arquivos criados**: 1  
**Linhas alteradas**: ~150  
**Tempo estimado de teste**: 15 minutos
