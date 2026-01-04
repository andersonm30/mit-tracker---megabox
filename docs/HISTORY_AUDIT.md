# 📊 HISTORY AUDIT - Auditoria do Módulo de Histórico

**Data:** 30/12/2025  
**Projeto Atual:** `K:\projeto\Versao-tarkan-Jesse\front-end`  
**Projeto Referência:** `K:\projeto\Tarkan-Mit-2025\tarkan-front-2025 - Versao - Front Argentino Dark`

---

## 📑 ÍNDICE

1. [Erros Identificados no Console](#erros-identificados-no-console)
2. [Inventário - Projeto Atual](#inventário---projeto-atual)
3. [Inventário - Projeto Referência](#inventário---projeto-referência)
4. [Matriz de Comparação](#matriz-de-comparação)
5. [Features Faltantes](#features-faltantes)
6. [Riscos e Dependências](#riscos-e-dependências)
7. [Plano de Correção Priorizado](#plano-de-correção-priorizado)

---

## 🚨 ERROS IDENTIFICADOS NO CONSOLE

### 1. Erro de Mídia - "No decoders for requested formats: text/html"
- **Descrição:** Tentativa de reproduzir conteúdo HTML como mídia
- **Causa Provável:** Servidor retornando erro/redirect/login page em vez de vídeo/áudio
- **Impacto:** Reprodução de vídeos de alarme não funciona
- **Localização Afetada:** Funcionalidade de vídeo no histórico (não implementada no projeto atual)

### 2. Erro CORS - `/tarkan/shares`
- **Mensagem:** `Cross-Origin Request Blocked: http://dev.martinianosit.com.br:8090/tarkan/shares`
- **Causa:** Backend não configurado para aceitar CORS ou frontend apontando para URL errada
- **Arquivos Afetados:**
  - `src/tarkan/tarkanConnector/tarkanConnector.js` (linha 32: `getShares()`)
  - `src/store/modules/shares.js`
- **Impacto:** Funcionalidade de compartilhamento não funciona

### 3. Erro SockJS Dev Server
- **Mensagem:** `CORS request did not succeed: http://192.168.1.119:8083/sockjs-node/info`
- **Causa:** Dev server Vue CLI com configuração de host incorreta para rede local
- **Arquivo Afetado:** `vue.config.js` (devServer config)
- **Impacto:** Hot-reload não funciona em dispositivos da rede

### 4. Erro Leaflet MarkerCluster
- **Mensagem:** `[CanvaMarker] L.MarkerClusterGroup não disponível. Importar leaflet.markercluster`
- **Causa:** Import condicional do markercluster não executando corretamente
- **Arquivo Afetado:** `src/tarkan/test/CanvaMarker.vue` (linhas 6-9, 1011-1012)
- **Impacto:** Clustering de markers no mapa pode falhar

---

## 📂 INVENTÁRIO - PROJETO ATUAL

### Arquivos Principais do Histórico

| Arquivo | Linhas | Responsabilidade | Dependências | Endpoints |
|---------|--------|-----------------|--------------|-----------|
| `src/templates/history.vue` | 1513 | **View principal** do histórico - formulário, timeline, estatísticas, filtros, export CSV/PDF | store/devices, store/reports, store/drivers, traccarConnector, kore-map | `/reports/route` |
| `src/templates/historynew.vue` | 407 | **View alternativa** simplificada do histórico (legacy) | store/devices, traccarConnector | `/reports/route` |
| `src/templates/pdf-route-report.vue` | ~200 | Componente para geração de PDF do percurso | - | - |

### Componentes de Suporte

| Arquivo | Responsabilidade | Usado Por |
|---------|-----------------|-----------|
| `src/templates/device-components/DeviceHistoryBar.vue` | Barra visual de histórico (movimento/parada) | devices.internal.vue |
| `src/templates/device-components/DeviceEventsHistory.vue` | Lista de eventos recentes do dispositivo | devices.internal.vue |

### Store/Vuex

| Arquivo | Responsabilidade | Usado Por |
|---------|-----------------|-----------|
| `src/store/modules/devices.js` | Estado de dispositivos, filtros, estados de rota | history.vue, kore-map |
| `src/store/modules/reports.js` | Dados de relatórios compartilhados | history.vue, reportTypes |
| `src/store/modules/drivers.js` | Lista de motoristas | history.vue (exibir motorista) |
| `src/store/modules/shares.js` | Compartilhamentos (com erro CORS) | edit-shares.vue |

### Services/Connectors

| Arquivo | Função Relevante | Endpoint |
|---------|-----------------|----------|
| `src/tarkan/traccarConnector/traccarConnector.js` | `loadRoute(id, from, to, exp)` | `GET /reports/route` |
| `src/tarkan/tarkanConnector/tarkanConnector.js` | `getShares()`, `createShare()` | `/shares` |

### Rotas

| Path | Componente | Meta |
|------|-----------|------|
| `/history` | history.vue | showRoute: true |
| `/reports/history` | history.vue | closed: true, backBtn: '/reports' |

### Componentes de Mapa

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/tarkan/components/kore-map.vue` | Mapa principal, recebe rota via inject `updateRoute` |
| `src/tarkan/test/CanvaMarker.vue` | Marcadores canvas com clustering |
| `src/tarkan/test/CanvaPoints.vue` | Pontos da rota no mapa |
| `src/tarkan/test/cluster.js` | Implementação do MarkerCluster |

### i18n (Traduções)

- `src/lang/pt-BR.js` - `report.history`, `route.empty`, etc.
- `src/lang/en-US.js`
- `src/lang/es-ES.js`

---

## 📂 INVENTÁRIO - PROJETO REFERÊNCIA

### Arquivos Principais do Histórico

| Arquivo | Linhas | Features Adicionais vs Atual |
|---------|--------|------------------------------|
| `src/templates/history.vue` | **2246** | +733 linhas - Modal de vídeo, KML export, PDF detalhado/tabular, atributos (ignição, bloqueio, movimento, energia), thumbnails, VideoJS |
| `src/templates/historynew.vue` | Similar | Legacy |
| `src/templates/pdf-route-report.vue` | Completo | PDF com mapas estáticos, métricas avançadas |

### Store Adicional

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/store/modules/routes.js` | **NÃO EXISTE NO ATUAL** - Estado dedicado para rotas com getters `getPositionById`, `getCurrentPosition` |

### Features Exclusivas do Projeto Referência

1. **Modal de Vídeo Moderno**
   - Reprodução de vídeos de alarme
   - Thumbnails com preview
   - VideoJS integration
   - Loading states

2. **Export KML (Google Earth)**
   - `handleGenerateKML()` - gera arquivo .kml

3. **PDF Detalhado vs Tabular**
   - `handleGenerateDetailedPDF()` - com mapa, métricas visuais
   - `handleGenerateTabularPDF()` - todos os pontos em tabela

4. **Atributos de Pontos**
   - Ignição (on/off)
   - Bloqueio (locked/unlocked)
   - Movimento (motion/stopped)
   - Energia (voltage)
   - Driver info por ponto

5. **Datetime Inputs Nativos**
   - Usa `<el-input type="datetime-local">` em vez de DatePicker
   - Layout mais compacto

6. **Scroll Automático para Ponto Ativo**
   - `scrollToActivePoint()` - sincroniza timeline com mapa

7. **Store de Rotas Separada**
   - Mutations: `SET_ROUTE_POINTS`, `ADD_POSITIONS`, `CLEAR_POSITIONS`
   - Actions: `loadRoute`, `clearRoute`, `loadAddress`

---

## 📊 MATRIZ DE COMPARAÇÃO

| Feature | Projeto Atual | Projeto Referência | Ação |
|---------|--------------|-------------------|------|
| Timeline básica | ✅ | ✅ | - |
| Estatísticas (distância, velocidade, duração) | ✅ | ✅ | - |
| Filtros (busca, tipo evento, velocidade) | ✅ | ❌ | Manter |
| Remover duplicatas | ✅ | ❌ | Manter |
| Export CSV | ✅ | ❌ | Manter |
| Export Excel (backend) | ✅ | ✅ | - |
| Export PDF (print) | ✅ | ✅ | Melhorar |
| Export PDF Detalhado | ❌ | ✅ | **MIGRAR** |
| Export PDF Tabular | ❌ | ✅ | **MIGRAR** |
| Export KML | ❌ | ✅ | **MIGRAR** |
| Modal de Vídeo | ❌ | ✅ | **MIGRAR** |
| Thumbnails Alarme | ❌ | ✅ | **MIGRAR** |
| Atributos (ignição, bloqueio) | ❌ | ✅ | **MIGRAR** |
| Scroll automático ponto ativo | ❌ | ✅ | **MIGRAR** |
| Store routes.js dedicada | ❌ | ✅ | **MIGRAR** |
| Mapa de Calor toggle | ✅ | ❌ | Manter |
| Percurso toggle | ✅ | ❌ | Manter |
| Performance logging | ✅ | ❌ | Manter |
| Validação de formulário | ✅ | ✅ | - |
| Loading states | ✅ | ✅ | - |
| Empty states | ✅ | ✅ | - |
| Error handling | ✅ Básico | ✅ | Melhorar |
| Driver atual (pill) | ✅ | ✅ | - |
| DatePicker com shortcuts | ✅ | ❌ (usa datetime-local) | Manter |

---

## ⚠️ FEATURES FALTANTES (PRIORIDADE DE MIGRAÇÃO)

### 🔴 Alta Prioridade

1. **Modal de Vídeo** (~200 linhas)
   - Componente: `showVideoModal`, `currentVideo`, `playVideo()`, `closeVideoModal()`
   - Dependências: VideoJS (verificar se já está no projeto)

2. **Atributos de Ponto na Timeline** (~100 linhas)
   - Ignição, Bloqueio, Movimento, Energia
   - Ícones condicionais com tooltips

3. **Store routes.js** (~170 linhas)
   - Adicionar ao projeto para melhor separação de concerns

### 🟡 Média Prioridade

4. **Export KML** (~50 linhas)
   - Função `handleGenerateKML()` - simples de migrar

5. **PDF Detalhado/Tabular** (~150 linhas)
   - Usar pdf-route-report.vue como base

6. **Scroll Automático** (~30 linhas)
   - `scrollToActivePoint()` + watch `currentPlayingPoint`

### 🟢 Baixa Prioridade (Melhorias)

7. **Layout Compacto** (CSS)
8. **Thumbnails de Alarme** (requer backend)

---

## 🔒 RISCOS E DEPENDÊNCIAS

### Dependências Externas

| Dependência | Status | Ação |
|-------------|--------|------|
| `leaflet.markercluster` | ✅ Instalado (yarn.lock) | Verificar import |
| `html2pdf.js` | Verificar | Adicionar se necessário |
| `dayjs` | ✅ Usado | - |
| `file-saver` | ✅ Usado | - |
| `video.js` | ❓ Verificar | Adicionar para modal vídeo |

### Riscos Identificados

1. **CORS no /tarkan/shares**
   - Risco: Funcionalidades de share não funcionam
   - Mitigação: Configurar proxy ou ajustar backend

2. **Vídeos retornando HTML**
   - Risco: Erros no console, UX ruim
   - Mitigação: Validar Content-Type antes de reproduzir

3. **MarkerCluster não disponível**
   - Risco: Mapa sem clustering em alguns cenários
   - Mitigação: Fallback sem clustering

4. **Dev Server CORS (SockJS)**
   - Risco: Hot-reload não funciona na rede
   - Mitigação: Configurar vue.config.js corretamente

5. **Migração pode quebrar funcionalidades existentes**
   - Risco: Regressões
   - Mitigação: Commits pequenos, testes manuais por feature

---

## 🎯 PLANO DE CORREÇÃO PRIORIZADO

### FASE 2A - Correções de Erros Críticos

| # | Problema | Arquivo | Complexidade | Tempo Est. |
|---|----------|---------|--------------|------------|
| 1 | CORS Dev Server (SockJS) | `vue.config.js` | 🟢 Baixa | 10 min |
| 2 | MarkerCluster import | `src/tarkan/test/CanvaMarker.vue` | 🟢 Baixa | 15 min |
| 3 | CORS /tarkan/shares | `src/tarkan/tarkanConnector/tarkanConnector.js` | 🟡 Média | 30 min |
| 4 | Validação Content-Type mídia | `history.vue` (se migrar vídeo) | 🟡 Média | 30 min |

### FASE 2B - Validações Defensivas

| # | Melhoria | Arquivo | Complexidade | Tempo Est. |
|---|----------|---------|--------------|------------|
| 5 | Tratamento de erro HTTP com mensagem UI | `history.vue`, `traccarConnector.js` | 🟢 Baixa | 20 min |
| 6 | Logs DEV-only via flag | Vários | 🟢 Baixa | 15 min |

### FASE 3 - Migração de Features

| # | Feature | Complexidade | Tempo Est. |
|---|---------|--------------|------------|
| 7 | Criar `store/modules/routes.js` | 🟢 Baixa | 30 min |
| 8 | Atributos de ponto (ignição, bloqueio, etc.) | 🟡 Média | 1h |
| 9 | Export KML | 🟢 Baixa | 30 min |
| 10 | PDF Detalhado/Tabular | 🟡 Média | 1h |
| 11 | Modal de Vídeo | 🔴 Alta | 2h |
| 12 | Scroll automático | 🟢 Baixa | 20 min |

---

## 📋 CHECKLIST DE VALIDAÇÃO PÓS-MIGRAÇÃO

- [ ] Histórico carrega sem erros no console
- [ ] Timeline exibe pontos corretamente
- [ ] Estatísticas calculadas corretamente
- [ ] Filtros funcionam (busca, tipo, velocidade)
- [ ] Export CSV funciona
- [ ] Export Excel funciona
- [ ] Export PDF funciona
- [ ] Export KML funciona (novo)
- [ ] Atributos de ponto visíveis (novo)
- [ ] Mapa sincroniza com timeline
- [ ] Mapa de calor toggle funciona
- [ ] Percurso toggle funciona
- [ ] Modal de vídeo abre/fecha (novo)
- [ ] Não há erros CORS
- [ ] MarkerCluster funciona
- [ ] Hot-reload funciona no dev

---

## 📝 PRÓXIMOS PASSOS

1. **Aprovar este documento** - Confirmar escopo
2. **Executar FASE 2A** - Correções de erros (começar por vue.config.js)
3. **Testar correções** - Verificar console limpo
4. **Executar FASE 3** - Migração incremental
5. **Criar HISTORY_TESTPLAN.md** - Roteiro de testes

---

*Documento gerado automaticamente - HISTORY_AUDIT v1.0*
