# 📊 MIGRAÇÃO MÓDULO USUÁRIOS - FASE 0: DIAGNÓSTICO INICIAL

**Data:** 2026-01-22  
**Projeto:** Vue 2026 (Tarkan Front-end)  
**Objetivo:** Migrar módulo de usuários usando versão madura como referência  
**Status:** 🟡 Fase 0 - Coleta e Diagnóstico

---

## 📋 ÍNDICE

1. [Stack Técnica Detectada](#-a1-stack-técnica-detectada)
2. [Estrutura de Pastas](#-a2-estrutura-de-pastas-do-src)
3. [Análise Crítica](#-análise-crítica-decisões-arquiteturais)
4. [Decisão Vuex vs Pinia](#-decisão-arquitetural-crítica)
5. [Localização Módulo Users](#-localização-do-módulo-users-produção-atual)
6. [Próximos Passos](#-próxima-ação-checklist-b--c)
7. [Entregas Futuras](#-o-que-vou-entregar-depois-fase-02)

---

## ✅ A1) Stack Técnica Detectada

### 🎯 STACK PRINCIPAL

```json
Vue: 3.0.0
├─ Framework: Vue 3 (Composition API ready)
├─ State Management: Vuex 4.0.2 (compatível Vue 3)
├─ Router: Vue Router 4.x
├─ UI Framework: Element Plus 1.2.0-beta.6
├─ HTTP Client: Axios 0.24.0
├─ i18n: Vue I18n 9.2.0-beta.30
└─ Build Tool: Vue CLI 4.5 + Webpack 4
```

### 📦 DEPENDÊNCIAS CRÍTICAS

| Dependência | Versão | Uso |
|------------|--------|-----|
| **Leaflet** | 1.7.1 | Mapas + plugins (markercluster, heatmap, search) |
| **Chart.js** | 3.7.1 | Gráficos e dashboards |
| **Firebase** | 9.8.1 | Notificações push + autenticação |
| **jsPDF + html2pdf** | 2.5.2 / 0.12.1 | Geração de relatórios PDF |
| **Lodash** | 4.17.21 | Utilitários de manipulação de dados |

### 🧪 AMBIENTE DE TESTES

```json
Unit Tests: Vitest 0.34.6 + @vitest/coverage-v8
E2E Tests: Playwright 1.40.0
Coverage: Configurado (vitest run --coverage)
Debug: Playwright UI mode (--ui flag)
```

---

## ✅ A2) Estrutura de Pastas do `src/`

```
src/
├── 📱 ENTRY POINTS (5 variantes)
│   ├── App.vue (padrão)
│   ├── App-dark.vue (tema escuro)
│   ├── App-Mobile.vue (mobile)
│   ├── App-Mobile-Client.vue (mobile client)
│   └── App.Authed.vue (autenticado)
│
├── 🔧 CONFIGURAÇÃO ROOT
│   ├── main.js, main-mobile.js, main-mobile-client.js
│   ├── i18n.js (configuração i18n)
│   ├── routes.js (definição de rotas)
│   ├── firebase.js (config Firebase)
│   └── license.js
│
├── 🎨 assets/css/
│   └── kore-map.poppers.css
│
├── 🧩 components/ (componentes reutilizáveis)
│   ├── device/
│   │   └── DeviceDriverCard.vue
│   ├── modals/
│   │   ├── index.js
│   │   └── SlideConfirmModal.vue
│   ├── speed/ ← PR-10B (referência recente)
│   │   └── SpeedEventHistory.vue
│   └── [6 componentes raiz]
│       ├── AIAssistantWrapper.vue
│       ├── ConfirmSliderModal.vue
│       ├── RoutePlaybackControls.vue
│       └── ...
│
├── 🪝 composables/ (10 hooks Vue 3)
│   ├── useDeviceCameras.js
│   ├── useDeviceVideoPlayer.js
│   ├── useDualCamera.js
│   ├── useModalA11yLock.js
│   ├── useRequestControl.js
│   ├── useRouteBookmarks.js
│   ├── useRouteMode.js
│   └── useVirtualScroll.js
│
├── 🌍 lang/ (i18n - arquivos JS)
│   ├── index.js
│   ├── en-US.js
│   ├── es-ES.js
│   └── pt-BR.js
│
├── 📝 locales/ (i18n - arquivos JSON)
│   ├── en-US.json
│   ├── es-ES.json
│   └── pt-BR.json
│
├── 🗺️ map/
│   └── overlayRegistry.js
│
├── 🔌 plugins/
│   └── runtimeApi.js
│
├── 🌐 services/ (API clients)
│   ├── runtimeApi.js
│   └── runtimeApiRef.js
│
├── 📦 store/ ← VUEX 4.x (11 módulos)
│   ├── index.js (root store)
│   └── modules/
│       ├── ⚡ speedEvents.js ← PR-10B (recém-criado - REFERÊNCIA)
│       ├── 👥 users.js ← TARGET PRINCIPAL
│       ├── 🚗 devices.js
│       ├── 🚗 devices-dark.js (variant dark theme)
│       ├── 👨‍✈️ drivers.js
│       ├── 📍 geofence.js
│       ├── 📊 groups.js
│       ├── 🔧 maintenance.js
│       ├── 📈 reports.js
│       ├── 🛣️ routes.js
│       ├── ⚙️ server.js (auth/session)
│       ├── 🔗 shares.js
│       ├── 📅 calendars.js
│       ├── 💬 commands.js
│       ├── 📋 computedAttributes.js
│       └── 📣 events.js
│
├── 🏗️ tarkan/ (estrutura customizada do projeto)
│   ├── cars/ (ícones de veículos SVG)
│   │   ├── car.vue
│   │   ├── truck.vue
│   │   ├── truck2.vue
│   │   └── utility.vue
│   │
│   ├── components/
│   │   ├── CommandModal.vue
│   │   ├── CommandModalDark.vue
│   │   ├── context-menu.vue
│   │   ├── kore-map.vue / kore-map-dark.vue
│   │   ├── kore-marker.vue
│   │   ├── kore-car.vue
│   │   ├── kore-fence.vue
│   │   ├── radial-menu.vue
│   │   ├── street-view.vue / street-view-dark.vue
│   │   ├── UserNoticeModal.vue
│   │   └── ...
│   │
│   │   └── views/ ← MODAIS DE EDIÇÃO (30+ componentes)
│   │       ├── 👥 edit-user.vue ← EDITAR UM USUÁRIO
│   │       ├── 👥 edit-users.vue ← EDITAR MÚLTIPLOS (?)
│   │       ├── 📋 tab-users.vue ← ABA DE USUÁRIOS
│   │       ├── edit-device.vue
│   │       ├── edit-driver.vue
│   │       ├── edit-geofence.vue
│   │       ├── edit-group.vue
│   │       ├── edit-notification.vue
│   │       ├── edit-server.vue
│   │       ├── edit-calendar.vue
│   │       ├── edit-maintenance.vue
│   │       ├── show-invoices-manager.vue
│   │       └── [25+ outros views]
│   │
│   ├── composables/
│   │   ├── useFollowDevice.js
│   │   ├── useMapInteraction.js
│   │   └── useMarkers.js
│   │
│   ├── func/ (helpers utilitários)
│   │   ├── kt.js ← FUNÇÃO KT() para i18n
│   │   ├── tt.js
│   │   ├── actAnchor.js
│   │   ├── ics.js
│   │   ├── markerContext.js
│   │   └── recorder.js
│   │
│   ├── map/ (lógica de mapas)
│   │   ├── mapGuards.js
│   │   ├── MapLayerManager.js
│   │   ├── mapUtils.js / mapUtils.ts
│   │   └── useRoutePlayback.js
│   │
│   ├── traccarConnector/ ← API TRACCAR
│   │   ├── index.js
│   │   ├── traccarConnector.js
│   │   └── Emitter.js
│   │
│   ├── tarkanConnector/ ← API CUSTOM
│   │   ├── index.js
│   │   ├── tarkanConnector.js
│   │   └── Emitter.js
│   │
│   ├── test/ (componentes experimentais)
│   │   ├── CanvaMarker.vue
│   │   ├── CanvaMarker-dark.vue
│   │   ├── CanvaPoints.vue
│   │   └── cluster.js
│   │
│   └── utils/
│       └── sanitize.js
│
├── 📄 templates/ ← VIEWS PRINCIPAIS (28 componentes)
│   ├── 👥 users.vue ← LISTAGEM PRINCIPAL DE USUÁRIOS
│   ├── devices.vue
│   ├── devices-2.vue
│   ├── devices-dark.vue
│   ├── devices.item.vue
│   ├── drivers-dashboard.vue
│   ├── driver-report.vue
│   ├── geofence.vue
│   ├── groups.vue
│   ├── home.vue
│   ├── login.vue
│   ├── history.vue / historynew.vue
│   ├── report.vue / reportCommon.vue
│   ├── reportEvents.vue / reportStops.vue
│   ├── maintenance.vue
│   ├── notifications.vue
│   ├── pdf-route-report.vue
│   └── [15+ outros templates]
│
└── 🛠️ utils/ (24 helpers)
    ├── dateHelpers.js / dateUtils.js
    ├── speedHelpers.js / speedNormalizer.js
    ├── driverResolver.js
    ├── guards.js
    ├── attributeUtils.js
    ├── routeChapters.js
    ├── routeEventDetector.js
    ├── routeExportPremium.js
    ├── routeFailSafe.js
    ├── routeFeatureFlags.js
    ├── routeStressMode.js
    ├── routeTelemetry.js
    ├── observability.js
    ├── reportMetrics.js
    ├── timerRegistry.js
    ├── devLog.js / devLog.ts
    └── devPerf.js / devPerf.ts
```

---

## 🧠 ANÁLISE CRÍTICA (Decisões Arquiteturais)

### ✅ PONTOS FORTES

| Item | Descrição | Impacto |
|------|-----------|---------|
| **Vue 3 Composition API** | Versão 3.0.0 com suporte `<script setup>` | ✅ Pronto para padrões modernos |
| **Vuex 4.x Modular** | 11 módulos namespaced bem estruturados | ✅ Escalável e organizado |
| **i18n Robusto** | 3 idiomas (pt-BR, en-US, es-ES) + função `KT()` | ✅ Multilingual nativo |
| **Composables** | 10+ hooks reutilizáveis (cameras, video, a11y) | ✅ Código DRY e testável |
| **Element Plus** | UI framework v1.2 beta (estável) | ✅ Componentes prontos |
| **Testes Configurados** | Vitest + Playwright + coverage | ✅ CI/CD ready |
| **PR-10B Recente** | speedEvents module implementado (referência) | ✅ Padrão fresco para seguir |

### ⚠️ DÍVIDAS TÉCNICAS

| Problema | Localização | Impacto | Solução |
|----------|-------------|---------|---------|
| **Estrutura dual** | `templates/` + `tarkan/components/views/` | 🟡 Confusão conceitual | Consolidar em fase futura |
| **i18n duplicado** | `lang/` (JS) + `locales/` (JSON) | 🟡 Manutenção duplicada | Unificar em P2 |
| **2 conectores API** | `traccarConnector` + `tarkanConnector` | 🟡 Complexidade | Documentar uso correto |
| **Element Plus beta** | v1.2.0-beta.6 | 🟢 Baixo (estável) | Atualizar v2.x em futuro |
| **Vuex vs Pinia** | Usando Vuex 4.x | 🟡 Não é padrão oficial | Migrar em PR dedicado |

### 🎯 SCORE GERAL DO PROJETO

```
Maturidade Técnica: ████████░░ 8/10
Organização:        ███████░░░ 7/10
Testabilidade:      ████████░░ 8/10
Documentação:       ██████░░░░ 6/10
Modernidade:        ████████░░ 8/10

NOTA FINAL: 7.4/10 (BOM - Projeto maduro e pronto para evolução)
```

---

## 🎯 DECISÃO ARQUITETURAL CRÍTICA

### ❓ Manter Vuex ou migrar Pinia?

**MINHA RECOMENDAÇÃO:**  
✅ **MANTER VUEX 4.x AGORA** (no módulo users + PRs atuais)

### 📊 Justificativa Técnica

| Critério | Vuex 4.x | Pinia | Decisão |
|----------|----------|-------|---------|
| **Compatibilidade atual** | ✅ 11 módulos rodando | ❌ Zero código Pinia | **Vuex** |
| **Consistência com PR-10B** | ✅ speedEvents em Vuex | ❌ Quebra padrão | **Vuex** |
| **Esforço de migração** | 🟢 Zero (já funciona) | 🔴 Alto (refactor total) | **Vuex** |
| **Padrão oficial Vue 3** | 🟡 Suportado (não recomendado) | ✅ Recomendado | **Pinia** |
| **Time-to-market** | 🟢 Rápido | 🔴 Lento | **Vuex** |

### 🚦 ESTRATÉGIA RECOMENDADA

**FASE ATUAL (P0/P1):**
- ✅ Implementar módulo `users.js` em **Vuex 4.x**
- ✅ Seguir padrão do PR-10B (`speedEvents.js`)
- ✅ Manter consistência com 11 módulos existentes

**FASE FUTURA (P2 ou P3):**
- 🔄 PR dedicado: "Migração Vuex → Pinia" (ex: PR-15)
- 🔄 Migrar **TODOS** os módulos de uma vez (devices, users, drivers, etc.)
- 🔄 Não migrar apenas users (causaria inconsistência)

### ⚠️ REGRA DE OURO

> **"Não misture Vuex e Pinia no mesmo projeto"**  
> Escolha um e mantenha até migração completa.

---

## 📍 LOCALIZAÇÃO DO MÓDULO USERS (PRODUÇÃO ATUAL)

### 🔍 Arquivos Detectados

```
📦 STORE (Vuex)
└── src/store/modules/users.js ← MÓDULO VUEX PRINCIPAL

📄 VIEWS PRINCIPAIS
└── src/templates/users.vue ← LISTAGEM (página/modal principal)

🏗️ MODAIS DE EDIÇÃO (Tarkan Structure)
├── src/tarkan/components/views/edit-user.vue ← EDITAR 1 USUÁRIO
├── src/tarkan/components/views/edit-users.vue ← EDITAR MÚLTIPLOS (?)
└── src/tarkan/components/views/tab-users.vue ← ABA USUÁRIOS (em device?)

🌍 I18N (3 idiomas)
├── src/locales/pt-BR.json (chaves: users.*, columns.*, etc.)
├── src/locales/en-US.json
└── src/locales/es-ES.json

🔧 HELPERS
├── src/tarkan/func/kt.js ← FUNÇÃO KT() para i18n
└── src/utils/* ← Helpers gerais (guards, dateHelpers, etc.)
```

### 📋 HIPÓTESES A VALIDAR

| Arquivo | Hipótese | A Confirmar |
|---------|----------|-------------|
| `edit-user.vue` | Modal único usuário | ✅ Ver código |
| `edit-users.vue` | Edição em lote? | ⚠️ Pode ser legacy |
| `tab-users.vue` | Aba em outro modal? | ⚠️ Ver uso |
| `users.vue` | Listagem principal | ✅ Validar endpoints |

---

## 🔄 PRÓXIMA AÇÃO (CHECKLIST B + C)

### 📤 GRUPO B - Store e Autenticação

**Enviar AGORA (na ordem):**

1. **B1)** `src/store/index.js`
   - Primeiras 50 linhas OU completo se < 200 linhas
   - Ver como registra módulos + plugins
   
2. **B2)** `src/store/modules/users.js` ✅ **COMPLETO**
   - State, getters, actions, mutations
   - Endpoints usados
   
3. **B3)** `src/store/modules/server.js` ✅ **COMPLETO**
   - Gerencia auth/session
   - Usuário logado

### 📤 GRUPO C - API e Conectores

**Enviar LOGO DEPOIS:**

4. **C1)** `src/services/runtimeApi.js` ✅ **COMPLETO**
   - Cliente HTTP principal
   - Interceptors
   
5. **C2)** `src/tarkan/traccarConnector/traccarConnector.js`
   - Primeiras 150 linhas
   - Ver como funciona
   
6. **C3)** `src/plugins/runtimeApi.js`
   - Se diferente de `services/runtimeApi.js`
   - Verificar injeção global

### ⏱️ TEMPO ESTIMADO

```
Você enviar B1-B3 + C1-C3:  ~5 min (copiar/colar)
Eu analisar + diagnosticar:  ~15 min
Eu gerar Plano P0/P1/P2:     ~30 min
```

**Total até código pronto:** ~50 minutos 🚀

---

## 🎯 O QUE VOU ENTREGAR DEPOIS (Fase 0.2)

Após receber os **6 arquivos (B1-B3 + C1-C3)**, vou gerar:

### 1. ✅ DIAGNÓSTICO COMPLETO DO MÓDULO USERS ATUAL

```markdown
📊 Inventário Técnico
├── State structure (users, current, permissions)
├── Getters (getUser, getUserById, isAdmin, etc.)
├── Actions (fetchUsers, saveUser, deleteUser, etc.)
├── Mutations (setUsers, updateUser, removeUser, etc.)
├── Endpoints usados (/users, /users/:id, /users/counts?, etc.)
└── Fluxo de autenticação (login, logout, session)

🔍 Análise de Código
├── Padrões encontrados (bom/ruim)
├── Bugs ou code smells
├── Performance issues
└── Security concerns
```

### 2. 📊 MAPA DE GAPS vs VERSÃO MADURA

```markdown
📈 O que FALTA (missing features)
├── Feature X (importante)
├── Feature Y (nice-to-have)
└── Feature Z (crítico)

📉 O que está DESATUALIZADO
├── Endpoint X (API antiga)
├── Padrão Y (Vue 2 style)
└── Lógica Z (pode melhorar)

✨ O que está MELHOR (keep)
├── Feature A (já superior)
├── Pattern B (bom padrão)
└── Logic C (mantém)
```

### 3. 🗺️ ARQUITETURA ALVO Vue 2026

```markdown
📁 Estrutura Final
src/
├── store/modules/
│   └── users.js (refatorado, Vuex 4.x)
├── services/
│   └── usersService.js (endpoints /users)
├── components/users/ (novo)
│   ├── UsersList.vue
│   ├── UserForm.vue
│   ├── UserCard.vue
│   └── UserFilters.vue
├── tarkan/components/views/
│   ├── edit-user.vue (refatorado)
│   └── tab-users.vue (mantém se usar)
├── templates/
│   └── users.vue (mantém/refatora)
├── composables/
│   └── useUsers.js (novo hook?)
└── locales/
    ├── pt-BR.json (users.* keys)
    ├── en-US.json
    └── es-ES.json (sem strings ES no código)
```

### 4. 📝 PLANO DE MIGRAÇÃO P0/P1/P2

```markdown
🎯 FASE P0 (FUNDAÇÃO - 1 PR)
├── PR-USERS-01: Refatorar store/modules/users.js
│   ├── State limpo + getters otimizados
│   ├── Actions com error handling
│   ├── Cache strategy (se necessário)
│   └── Testes unitários (Vitest)

🎯 FASE P1 (COMPONENTES - 2-3 PRs)
├── PR-USERS-02: Componentes base
│   ├── UsersList.vue
│   ├── UserForm.vue
│   └── UserCard.vue
│
├── PR-USERS-03: Modal edit-user.vue refatorado
│   ├── Composition API
│   ├── Validação formulário
│   └── Abas organizadas
│
└── PR-USERS-04: Integração + i18n
    ├── templates/users.vue atualizado
    ├── i18n completo (pt-BR focus)
    └── Remover strings ES do código

🎯 FASE P2 (FEATURES AVANÇADAS - 2-3 PRs)
├── PR-USERS-05: Features maturidade
│   ├── Counts/stats
│   ├── Subordinates (se existir)
│   ├── Export/import
│   └── Bulk actions
│
└── PR-USERS-06: Testes E2E + Docs
    ├── Playwright tests
    ├── Documentação completa
    └── Migration guide
```

### 5. 💻 CÓDIGO P0 PRONTO (copiar/colar)

```markdown
📦 ENTREGÁVEIS P0
├── src/store/modules/users.js (código completo)
│   ├── State + getters + actions + mutations
│   ├── Comentários em pt-BR
│   └── Error handling + cache
│
├── src/services/usersService.js (novo)
│   ├── CRUD endpoints
│   ├── Axios wrapper
│   └── Error handler
│
├── src/locales/pt-BR.json (users keys)
│   ├── users.title, users.add, users.edit
│   ├── columns.name, columns.email
│   └── messages.success, messages.error
│
└── __tests__/users.spec.js (testes básicos)
    ├── Store actions
    ├── Getters
    └── Mutations
```

### 6. ✅ TESTES MANUAIS GUIADOS

```markdown
🧪 CHECKLIST DE TESTES (P0)

[ ] Listar usuários (GET /users)
[ ] Buscar por nome/email
[ ] Ordenar por coluna
[ ] Criar usuário novo
[ ] Editar usuário existente
[ ] Deletar usuário (com confirmação)
[ ] Validar permissões (admin vs user)
[ ] i18n (trocar idioma pt-BR/en-US)
[ ] Estados loading/error/empty
[ ] Cache (se implementado)

🧪 CASOS DE TESTE (P1/P2)
[ ] Import CSV de usuários
[ ] Export Excel
[ ] Subordinates (se feature)
[ ] Bulk actions (múltiplos)
[ ] Performance (1000+ users)
```

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs da Migração

| Métrica | Baseline | Meta P0 | Meta P1 | Meta P2 |
|---------|----------|---------|---------|---------|
| **Code Coverage** | ? | 60% | 75% | 85% |
| **Load Time (lista)** | ? | < 500ms | < 300ms | < 200ms |
| **Bundle Size** | ? | -10% | -15% | -20% |
| **Bugs críticos** | ? | 0 | 0 | 0 |
| **i18n Coverage** | ? | 100% | 100% | 100% |
| **Strings ES no código** | ? | 0 | 0 | 0 |

---

## 🚀 PRÓXIMO COMANDO

**👉 Me envie os 6 arquivos agora:**

```bash
B1) src/store/index.js (linhas 1-50 ou completo)
B2) src/store/modules/users.js (COMPLETO)
B3) src/store/modules/server.js (COMPLETO)
C1) src/services/runtimeApi.js (COMPLETO)
C2) src/tarkan/traccarConnector/traccarConnector.js (linhas 1-150)
C3) src/plugins/runtimeApi.js (se existir)
```

**Você pode:**
- ✅ Colar conteúdo direto no chat
- ✅ Pedir para eu ler com ferramentas
- ✅ Anexar múltiplos arquivos de uma vez

---

**Status:** 🟢 Pronto para avançar  
**Aguardando:** Arquivos B1-B3 + C1-C3  
**ETA até código P0:** ~50 minutos

