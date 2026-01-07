# 🔒 CHECKLIST FINAL DE MERGE - MIGRAÇÃO RUNTIMEAPI

## ✅ Status da Migração

**Data:** 7 de janeiro de 2026  
**Total de refs eliminadas:** 93 refs (window.$traccar + window.$tarkan)  
**Arquivos modificados:** 47 arquivos  
**Commits criados:** 7  

---

## 📋 1. SMOKE TEST (Ordem de Detecção Máxima)

### A) Boot + Sessão
- [ ] Hard reload (Ctrl+F5) carrega sem erros
- [ ] Login → navega 3 telas → reload com sessão ativa
- [ ] Logout → login de novo (testa getSession/deleteSession)

### B) Core UX (Tier 1)
- [ ] Device list abre e renderiza
- [ ] Bloquear/Desbloquear via App.vue modal
- [ ] Bloquear/Desbloquear via devices.item inline
- [ ] Erro forçado (simula API off) → mensagem "Runtime API não disponível. Recarregue a página."

### C) Mapa (Tier 2)
- [ ] Marker renderiza corretamente
- [ ] Context menu abre no marker
- [ ] Envia comando pelo context menu do marker
- [ ] Zoom/pan/resize funciona (valida invalidate + throttle)

### D) Reports (Tier 3)
- [ ] history: loadRoute funciona
- [ ] events: getReportEvents funciona
- [ ] stops: relatório carrega
- [ ] travels: relatório carrega
- [ ] resume: getReportSummary + loadRoute funcionam

### E) Admin UI (Tier 4)
- [ ] link-objects: listar → criar → editar → deletar (cobre 11 métodos get*)
- [ ] actAnchor: fluxo que chama linkObjects (criar geofence + vincular device)

### F) Templates (autolink + qr-driver)
- [ ] autolink: adicionar dispositivo via IMEI
- [ ] qr-driver: check-in/check-out via QR code

### G) WS Close (ref extra store/index.js)
- [ ] Troca de rota/tela fecha WS corretamente
- [ ] Abre e fecha mapa/realtime 2x (verifica vazamento)

---

## 🔒 2. TRAVAS APLICADAS (Nunca Mais Voltar)

### TRAVA A: ESLint Rule ✅
**Arquivo:** `.eslintrc.js`  
**Rule:** `no-restricted-properties`  
**Config:**
```javascript
{
  object: 'window',
  property: '$traccar',
  message: 'Use runtimeApi (inject/getRuntimeApi) ao invés de window.$traccar. Refs legadas foram removidas.'
},
{
  object: 'window',
  property: '$tarkan',
  message: 'Use runtimeApi (inject/getRuntimeApi) ao invés de window.$tarkan. Refs legadas foram removidas.'
}
```

**Teste:**
- [ ] `npm run lint` passa sem erros
- [ ] Criar arquivo test.js com `window.$traccar.sendCommand()` → lint bloqueia

### TRAVA B: Deprecation Warning DEV-only ✅
**Arquivo:** `src/plugins/runtimeApi.js`  
**Comportamento:** Console warning se detectar window.$traccar ou window.$tarkan  

**Teste:**
- [ ] `npm run serve` → console não mostra warnings (legados removidos)
- [ ] Adicionar `window.$traccar = {}` temporariamente → console mostra warning

### TRAVA C: CI/CD Pipeline ✅
**Arquivo:** `scripts/check-legacy-refs.sh`  
**Comando:** `bash scripts/check-legacy-refs.sh`  

**Teste:**
- [ ] Executa script → retorna "✅ PASSOU: 0 refs legadas encontradas."
- [ ] Adicionar `window.$traccar` em arquivo → script falha com exit 1

**Integração CI:** Adicionar ao `.gitlab-ci.yml` ou GitHub Actions:
```yaml
legacy-check:
  script:
    - bash scripts/check-legacy-refs.sh
```

---

## 🔍 3. VERIFICAÇÃO GREP (Confirmação Zero Refs)

### PowerShell (Windows):
```powershell
Select-String -Pattern "window\.\$traccar|window\.\$tarkan" `
  -Path k:\projeto\Versao-tarkan-Jesse\front-end\src\**\*.js,k:\projeto\Versao-tarkan-Jesse\front-end\src\**\*.vue `
  -Exclude "*runtimeApi.js","*traccarConnector.js","*tarkanConnector.js","*.backup.*"
```

### Bash (Linux/Mac):
```bash
bash scripts/check-legacy-refs.sh
```

**Resultado Esperado:** `0 refs encontradas` ou `✅ PASSOU`

---

## 📊 4. RESUMO DAS MUDANÇAS

### Infraestrutura Criada
1. **src/services/runtimeApi.js** (115 linhas)
   - Factory pattern: `createRuntimeApi({ traccar, tarkan })`
   - 11+ métodos: sendCommand, getAvailableCommands, getTypeCommands, getReportEvents, loadRoute, getServer, getUsers, getDevices, getSavedCommands, getMaintenance, getComputedAttributes, getCalendars, getNotifications, getGroups, getDrivers, linkObjects, unlinkObjects, get, post, put, delete, api, tarkanToast, tarkanConfirm, autoLink, checkDriver, checkOutDriver

2. **src/services/runtimeApiRef.js** (21 linhas)
   - Singleton: `setRuntimeApi(api)` / `getRuntimeApi()`
   - Para Vuex Store

3. **src/plugins/runtimeApi.js** (35 linhas)
   - Triple registration: `app.provide` + `globalProperties` + `setRuntimeApi`
   - Deprecation warning DEV-only

### Tiers Migrados
- **Tier 1 (Core UX):** 20 refs - App.vue, devices.item, useMarkers, useDeviceVideoPlayer, useDualCamera
- **Tier 2 (Map/Modals):** 10 refs - kore-map-dark, CommandModal, CommandModalDark
- **Tier 3 (Reports):** 7 refs - reportEvents, reportStops, reportTravels, reportResume, history, history-refactored
- **Tier 4 (Admin UI):** 23 refs - actAnchor, link-objects, store/index.js
- **Tier 5 Part 1 (Store 1-8):** 20 refs - routes, users, server, maintenance, groups, geofence, events
- **Tier 5 Part 2 (Store 9-15):** 31 refs - index/auth, devices, devices-dark, commands, drivers, calendars, computedAttributes
- **Templates:** 3 refs - autolink, qr-driver

### Padrões de DI
- **Componentes Vue:** `inject('runtimeApi', null)`
- **Composables:** Recebe `{ runtimeApi }` como parâmetro
- **Vuex Store:** `const { getRuntimeApi } = await import('@/services/runtimeApiRef')`

---

## 📝 5. CHANGELOG PARA PR

```markdown
## 🔄 Migração Runtime API - window.$traccar/window.$tarkan → runtimeApi

### Contexto
Unificação de `window.$traccar` e `window.$tarkan` em serviço centralizado com DI pattern.

### Mudanças
- ✅ 93 refs eliminadas (90 + 3 templates)
- ✅ 47 arquivos modificados
- ✅ Infraestrutura: runtimeApi.js, runtimeApiRef.js, RuntimeApiPlugin
- ✅ 3 travas aplicadas: ESLint rule, deprecation warning, CI/CD pipeline
- ✅ Padrões de DI: inject() para componentes, getRuntimeApi() para Store

### Impacto
- **Breaking:** Nenhum (window.$traccar/window.$tarkan ainda disponíveis via legado)
- **Build:** ✅ Passa sem erros
- **Tests:** Smoke test necessário (checklist completo no PR)
- **Lint:** ✅ ESLint bloqueia novas refs legadas

### Próximos Passos
1. Smoke test completo (ver checklist)
2. Integrar `scripts/check-legacy-refs.sh` no CI/CD
3. Deprecar window.$traccar/window.$tarkan em versão futura
```

---

## ✅ 6. APROVAÇÃO FINAL

- [ ] **Smoke test:** Todos os itens checados
- [ ] **Grep:** 0 refs encontradas (excluindo infraestrutura)
- [ ] **ESLint:** Rule aplicada e testada
- [ ] **CI/CD:** Script integrado
- [ ] **Changelog:** PR atualizado

**Aprovador:** _______________  
**Data:** _______________

---

## 🚀 7. DEPLOY

- [ ] Merge para `main`
- [ ] Deploy staging → smoke test
- [ ] Deploy produção
- [ ] Monitorar logs por 24h (buscar "Runtime API não disponível")

---

**Última atualização:** 2026-01-07  
**Responsável:** Migração runtimeApi Tier 1-5 + Templates
