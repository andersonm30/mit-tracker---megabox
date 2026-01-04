# 📋 HISTORY MIGRATION PLAN - Plano de Migração do Histórico

**Data:** 30/12/2025  
**Status:** ✅ Em Execução

---

## 📑 ÍNDICE

1. [Resumo das Mudanças](#resumo-das-mudanças)
2. [Arquivos Modificados](#arquivos-modificados)
3. [Arquivos Criados](#arquivos-criados)
4. [Checklist de Migração](#checklist-de-migração)
5. [Próximos Passos](#próximos-passos)

---

## 📝 RESUMO DAS MUDANÇAS

### FASE 2A - Correções de Erros (✅ Concluído)

| # | Problema | Status | Arquivo |
|---|----------|--------|---------|
| 1 | CORS Dev Server (SockJS) | ✅ | `vue.config.js` |
| 2 | MarkerCluster fallback | ✅ | `src/tarkan/test/CanvaMarker.vue` |
| 3 | Validação Content-Type | ✅ | `traccarConnector.js`, `tarkanConnector.js` |
| 4 | Proxy /tarkan/* | ✅ | `vue.config.js` |

### FASE 2B - Validações Defensivas (✅ Concluído)

| # | Melhoria | Status | Arquivo |
|---|----------|--------|---------|
| 5 | Interceptor de resposta com validação | ✅ | `traccarConnector.js` |
| 6 | Logs DEV-only via flag | ✅ | `traccarConnector.js`, `tarkanConnector.js`, `history.vue` |
| 7 | Tratamento de erro HTML como mídia | ✅ | `traccarConnector.js` |

### FASE 3 - Migração de Features (✅ Concluído)

| # | Feature | Status | Arquivo |
|---|---------|--------|---------|
| 8 | Store routes.js | ✅ Criado | `src/store/modules/routes.js` |
| 9 | Registro no store principal | ✅ | `src/store/index.js` |
| 10 | Atributos de ponto (ignição, bloqueio, etc.) | ✅ | `src/templates/history.vue` |
| 11 | Scroll automático para ponto ativo | ✅ | `src/templates/history.vue` |
| 12 | Estilos para ponto ativo | ✅ | `src/templates/history.vue` |

---

## 📂 ARQUIVOS MODIFICADOS

### vue.config.js
```diff
devServer: {
  port: 8083,
+ host: '0.0.0.0',
+ allowedHosts: 'all',
+ client: {
+   webSocketURL: {
+     hostname: '0.0.0.0',
+     pathname: '/ws',
+     port: 8083,
+   },
+ },
  proxy: {
    '/api': { ... },
+   '/tarkan': {
+     target: 'http://localhost/back-end',
+     changeOrigin: true,
+     secure: false
+   }
  }
}
```

### src/tarkan/traccarConnector/traccarConnector.js
- ✅ Adicionado `DEBUG_TRACCAR` flag para logs de desenvolvimento
- ✅ Adicionado `validateResponse()` para detectar respostas HTML
- ✅ Adicionado interceptor de resposta com validação de Content-Type
- ✅ Tratamento especial para mídia que retorna HTML

### src/tarkan/tarkanConnector/tarkanConnector.js
- ✅ Adicionado `DEBUG_TARKAN` flag para logs de desenvolvimento
- ✅ Adicionado `validateJsonResponse()` para detectar respostas HTML
- ✅ Adicionado interceptor de resposta
- ✅ Wrapper `_safeCall()` para chamadas críticas

### src/tarkan/test/CanvaMarker.vue
- ✅ Adicionado fallback dinâmico para MarkerClusterGroup
- ✅ Tentativa de importar cluster.js local se MarkerClusterGroup não disponível
- ✅ Continua sem clustering se fallback falhar (fail-soft)

### src/store/index.js
- ✅ Importado módulo `routes`
- ✅ Registrado no objeto `modules`

### src/templates/history.vue

#### Template (linha ~250-280)
- ✅ Adicionado `ref="timelineScrollRef"` no container de scroll
- ✅ Adicionado `:id="'timeline-point-' + k"` para cada ponto
- ✅ Adicionado classes dinâmicas `timeline-active` e `timeline-dot-active`
- ✅ Adicionado seção de atributos (ignição, bloqueio, movimento, energia)

#### Script (linha ~360-410)
- ✅ Adicionado `DEBUG_HISTORY` flag
- ✅ Adicionado `timelineScrollRef` ref
- ✅ Adicionado `currentPlayingPoint` computed
- ✅ Adicionado `scrollToActivePoint()` função
- ✅ Adicionado watch para `currentPlayingPoint`

#### Styles (final do arquivo)
- ✅ Adicionado `.timeline-content-wrapper`
- ✅ Adicionado `.timeline-attributes`
- ✅ Adicionado `.attr-badge`, `.attr-success`, `.attr-danger`, etc.
- ✅ Adicionado `.timeline-active`, `.timeline-dot-active`
- ✅ Adicionado animação `pulse` para ponto ativo

---

## 📂 ARQUIVOS CRIADOS

### src/store/modules/routes.js
Store Vuex dedicada para gerenciamento de rotas:

```javascript
// State
- routePositions: {} // Posições completas por ID
- currentRoute: []   // Formato simplificado [lat, lng, id, course]
- isLoading: false
- lastError: null
- routeMeta: { deviceId, startDate, endDate, totalPoints }

// Getters
- getRoutePoints
- getPositionById(id)
- getCurrentPosition
- isLoading
- hasRoute
- getRouteMeta
- getTotalPoints

// Actions
- loadRoute({ deviceId, startDate, endDate, isExport })
- clearRoute()
- loadAddress(positionId)
```

### docs/HISTORY_AUDIT.md
Documento de auditoria completo com:
- Erros identificados
- Inventário de arquivos (projeto atual vs referência)
- Matriz de comparação
- Features faltantes
- Riscos e dependências
- Plano de correção priorizado

---

## ✅ CHECKLIST DE MIGRAÇÃO

### Correções de Erros
- [x] CORS Dev Server - `vue.config.js` atualizado
- [x] MarkerCluster - fallback implementado
- [x] Validação Content-Type - interceptors adicionados
- [x] Proxy /tarkan/* - configurado em dev

### Store
- [x] routes.js criado
- [x] Registrado no store/index.js

### History.vue
- [x] Atributos de ponto (ignição, bloqueio, movimento, energia)
- [x] Scroll automático para ponto ativo
- [x] Estilos para ponto ativo com animação pulse
- [x] Debug logs com flag

### Features Pendentes (para próxima iteração)
- [ ] Modal de Vídeo (requer VideoJS)
- [ ] Export KML
- [ ] PDF Detalhado/Tabular

---

## 🚀 PRÓXIMOS PASSOS

### Imediato
1. **Testar as correções** - Iniciar o dev server e verificar console
2. **Validar atributos** - Carregar histórico de dispositivo com dados de ignição/bloqueio
3. **Testar scroll** - Reproduzir rota no mapa e verificar sincronização

### Próxima Iteração
4. **Implementar Export KML** (~30 min)
5. **Implementar Modal de Vídeo** (~2h)
6. **Implementar PDF Detalhado/Tabular** (~1h)

### Validação Final
7. **Executar HISTORY_TESTPLAN.md**
8. **Code review**
9. **Deploy para staging**

---

## 📊 MÉTRICAS

| Métrica | Valor |
|---------|-------|
| Arquivos modificados | 6 |
| Arquivos criados | 3 |
| Linhas adicionadas | ~450 |
| Linhas removidas | ~20 |
| Features migradas | 4 |
| Erros corrigidos | 4 |

---

*Documento atualizado em 30/12/2025*
