# 🚀 ROUTE PLAYER - CHECKLIST DE PRODUÇÃO

## Versão: 1.2.0 | FASE 12 Complete

---

## 📋 Visão Geral

O Route Player é um sistema avançado de reprodução e análise de percursos que inclui:

- ✅ Player com controles profissionais (play, pause, seek, velocidade)
- ✅ Scrub interativo na barra de progresso
- ✅ Detecção automática de eventos (paradas, velocidade)
- ✅ Capítulos de viagem
- ✅ Bookmarks/Favoritos
- ✅ Export Premium (PDF/Excel)
- ✅ Share Link
- ✅ **Sistema Basic/Premium Mode** (FASE 11)

---

## 🎭 Modos de Operação (FASE 11)

O Route Player opera em dois modos distintos para diferentes níveis de acesso:

### Modo BASIC (Default)
- Formulário de seleção (dispositivo, data, horário)
- Botões de ação (Consultar, Limpar)
- Estatísticas básicas (distância, velocidade média, tempo)
- Timeline simples com pontos e filtros
- Export básico (PDF/Excel padrão)

### Modo PREMIUM (Opcional)
- Tudo do modo Basic, mais:
- Bloco "Insights Avançados" com tabs:
  - Resumo Executivo
  - Capítulos/Trechos da Viagem
  - Favoritos/Bookmarks
- Export Premium (PDF/Excel com gráficos)
- Share Link (copiar URL com estado)
- Detecção avançada de eventos

### Arquitetura de Controle

```
┌─────────────────────────────────────────────────────────┐
│                    CAMADA 3: BACKEND                     │
│            capabilities.routeAdvanced = true/false       │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                  CAMADA 2: STORE/GETTERS                 │
│             getter: hasRoutePremium                      │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│               CAMADA 1: FEATURE FLAGS                    │
│         ROUTE_PREMIUM_ALLOWED = true (default)           │
│         (Master switch - se false, tudo é Basic)         │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                 COMPOSABLE: useRouteMode                 │
│   routeMode (basic/premium), canUsePremiumRoutes,       │
│   showModeToggle, canUseInsights, canUseChapters, etc   │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                    UI: history.vue                       │
│   Toggle ⭐ (só se showModeToggle), tabs condicionais    │
└─────────────────────────────────────────────────────────┘
```

### Como Configurar Modo Premium

#### 1. Via Feature Flag (Operador)
```javascript
// Habilitar Premium para todos os clientes
routeFlags.set('ROUTE_PREMIUM_ALLOWED', true)

// Desabilitar Premium (força modo Basic)
routeFlags.set('ROUTE_PREMIUM_ALLOWED', false)
```

#### 2. Via Store (Plano do Cliente)
```javascript
// O getter hasRoutePremium deve retornar true
store.getters.hasRoutePremium
```

#### 3. Via Override (Debug)
```javascript
// Override temporário
window.ROUTE_PREMIUM_OVERRIDE = true
```

---

## 🎛️ Matriz de Funcionalidades por Modo

| Funcionalidade | BASIC | PREMIUM | Flag de Controle |
|---------------|-------|---------|------------------|
| Formulário | ✅ | ✅ | - |
| Estatísticas | ✅ | ✅ | - |
| Timeline | ✅ | ✅ | - |
| Filtros | ✅ | ✅ | - |
| Export PDF | ✅ | ✅ | - |
| Export Excel | ✅ | ✅ | - |
| Resumo Executivo | ❌ | ✅ | ROUTE_INSIGHTS |
| Capítulos | ❌ | ✅ | ROUTE_CHAPTERS |
| Bookmarks | ❌ | ✅ | ROUTE_BOOKMARKS |
| Eventos Avançados | ❌ | ✅ | ROUTE_EVENTS |
| Export Premium | ❌ | ✅ | ROUTE_EXPORT_PREMIUM |
| Share Link | ❌ | ✅ | ROUTE_SHARE_LINK |
| Toggle Mode ⭐ | ❌ | ✅ | - (automático) |

---

## 🎯 Modo BASIC — UX Impecável (FASE 12)

O modo BASIC foi projetado para oferecer experiência perfeita sem features avançadas.

### Estados Vazios

| Situação | Comportamento |
|----------|---------------|
| Sem dispositivo | Callout info: "Selecione um dispositivo para visualizar o histórico" |
| Sem período | Callout info: "Selecione o período para carregar o histórico" |
| Sem dados no período | Callout warning + botões rápidos: [24h] [7 dias] [30 dias] |

### Validação Humana

| Situação | Comportamento |
|----------|---------------|
| Data fim < início | Corrige automaticamente (swap) + mensagem info |
| Período > 31 dias | Aviso de que pode demorar (não bloqueia) |

### Estatísticas

- Stats sempre calculadas com base no **percurso completo** (routePoints)
- Texto explicativo: "Estatísticas calculadas com base no percurso completo"
- Filtros afetam apenas a timeline, não as estatísticas

### Ações

| Ação | Comportamento |
|------|---------------|
| Enter no formulário | Executa loadRoute() se isFormValid |
| Botões período rápido | Apenas ajustam formData.date (não carrega) |

### Acessibilidade

Elementos com aria-label:
- Select de dispositivo
- Date picker
- Switches de visualização
- Botões de ação (Mostrar, Gráfico)

---

## 🔒 Limites Suportados

| Recurso | Limite Warning | Limite Hard | Testado |
|---------|---------------|-------------|---------|
| Pontos de Rota | 10.000 | 50.000 | ✅ |
| Eventos | 500 | 1.000 | ✅ |
| Capítulos | 100 | 200 | ✅ |
| Bookmarks | 50 | 100 | ✅ |
| Export PDF | 10.000 pontos | 20.000 | ✅ |
| Export Excel | 5.000 pontos | 10.000 | ✅ |

### Performance Esperada

| Cenário | Pontos | Tempo Load | Tempo Events | Tempo Chapters |
|---------|--------|------------|--------------|----------------|
| Normal | 1.000 | < 500ms | < 50ms | < 30ms |
| Pesado | 5.000 | < 1.5s | < 200ms | < 100ms |
| Stress | 10.000 | < 3s | < 400ms | < 200ms |
| Extremo | 20.000 | < 6s | < 800ms | < 400ms |

---

## 🚩 Feature Flags

Todas as flags podem ser alteradas via:
- `localStorage` (persistente)
- `window.ROUTE_FEATURE_FLAGS` (runtime)
- Console: `routeFlags.set('FLAG_NAME', value)`

### Flags Disponíveis

```javascript
// Core
ENABLE_HEATMAP: true
ENABLE_ROUTE_MARKERS: true

// Eventos (FASE 7)
ENABLE_EVENTS: true
ENABLE_EVENT_MARKERS: true

// Capítulos e Bookmarks (FASE 8)
ENABLE_CHAPTERS: true
ENABLE_BOOKMARKS: true
ENABLE_SUMMARY: true

// Export e Share (FASE 9)
ENABLE_EXPORT_PDF: true
ENABLE_EXPORT_EXCEL: true
ENABLE_SHARE: true
ENABLE_EXPORT_PREMIUM: true

// Player (FASE 6)
ENABLE_PLAYER: true
ENABLE_SCRUB: true
ENABLE_SEEK_FROM_TIMELINE: true

// ============================================
// FASE 11: Premium Mode Flags
// ============================================
ROUTE_PREMIUM_ALLOWED: true     // Master switch - se false, força modo Basic
ROUTE_INSIGHTS: true            // Resumo Executivo
ROUTE_CHAPTERS: true            // Trechos/Capítulos da Viagem
ROUTE_BOOKMARKS: true           // Favoritos
ROUTE_EVENTS: true              // Eventos avançados
ROUTE_EXPORT_PREMIUM: true      // Export PDF/Excel Premium
ROUTE_SHARE_LINK: true          // Compartilhar Link

// Limites
MAX_POINTS_WARNING: 10000
MAX_POINTS_HARD_LIMIT: 50000
MAX_EVENTS_DISPLAY: 500
MAX_CHAPTERS_DISPLAY: 100
MAX_BOOKMARKS: 50

// Performance
ENABLE_VIRTUAL_SCROLL: true
VIRTUAL_BUFFER_SIZE: 8

// Debug
ENABLE_TELEMETRY: false (true em DEV)
```

### Como Usar

```javascript
// Desligar heatmap em produção
routeFlags.set('ENABLE_HEATMAP', false)

// Reduzir limite de pontos
routeFlags.set('MAX_POINTS_WARNING', 5000)

// Listar todas as flags
routeFlags.list()

// Resetar para defaults
routeFlags.resetAll()
```

---

## 🔍 Como Debugar

### 1. Ativar Telemetria

```javascript
// No console do browser
enableRouteDebug()

// Ou
window.DEBUG_ROUTE = true
```

### 2. Ver Relatório de Performance

```javascript
printRouteReport()
```

Output:
```
📊 Route Player Telemetry Report
Session Duration: 120 seconds
Total Measures: 45

⏱️ Performance Stats
┌─────────────────┬───────┬────────┬───────┬───────┬──────┬──────┐
│ label           │ count │ avg    │ min   │ max   │ p50  │ p95  │
├─────────────────┼───────┼────────┼───────┼───────┼──────┼──────┤
│ loadRoute       │ 3     │ 1234.5 │ 980.2 │ 1456.8│ 1234 │ 1456 │
│ detectEvents    │ 3     │ 45.2   │ 32.1  │ 58.3  │ 45   │ 58   │
│ buildChapters   │ 3     │ 23.1   │ 18.5  │ 27.7  │ 23   │ 27   │
└─────────────────┴───────┴────────┴───────┴───────┴──────┴──────┘
```

### 3. Ativar Logs Verbose

```javascript
window.DEBUG_ROUTE_VERBOSE = true
```

### 4. Ver Dados de Debug

```javascript
console.log(window.__routeDebug)
```

---

## 🔥 Modo Stress (Testes)

### Ativar Stress Mode

```javascript
// No console (apenas DEV)
routeStress.activate('MEDIUM')  // 5.000 pontos
routeStress.activate('LARGE')   // 10.000 pontos
routeStress.activate('EXTREME') // 20.000 pontos
routeStress.activate(15000)     // Custom

// Ver pontos gerados
routeStress.getPoints()

// Desativar
routeStress.deactivate()
```

### Presets

| Preset | Pontos | Uso |
|--------|--------|-----|
| SMALL | 1.000 | Teste rápido |
| MEDIUM | 5.000 | Uso normal |
| LARGE | 10.000 | Stress test |
| EXTREME | 20.000 | Limite |

---

## 🐛 Bugs Conhecidos

### 1. Heatmap + Play
**Sintoma**: Heatmap some durante reprodução  
**Causa**: Toggle automático para performance  
**Solução**: Desativado intencionalmente  

### 2. Scrub Lento com >10k Pontos
**Sintoma**: Delay no arrasto  
**Causa**: Re-render de muitos elementos  
**Solução**: Virtual scroll ativo por padrão  

### 3. Share Link Muito Longo
**Sintoma**: URL > 2000 chars  
**Causa**: Muitos bookmarks  
**Solução**: Limitado a índices apenas  

---

## 🔄 Como Reproduzir Bugs

### Setup de Debug

```javascript
// 1. Ativar tudo
enableRouteDebug()
window.DEBUG_ROUTE_VERBOSE = true

// 2. Carregar rota grande
routeStress.activate('LARGE')

// 3. Testar cenário
// ... reproduzir o bug ...

// 4. Coletar dados
printRouteReport()
console.log(window.__routeDebug)
```

### Cenários de Teste

1. **Play Normal**: Carregar rota → Play → Verificar FPS
2. **Scrub Agressivo**: Arrastar rapidamente pela barra
3. **Filtros**: Aplicar filtro de velocidade → Play
4. **Export**: Exportar PDF Premium com >5k pontos
5. **Share**: Copiar link → Abrir em nova aba

---

## 📊 Métricas de Saúde

### Métricas Críticas

| Métrica | Threshold | Ação se Exceder |
|---------|-----------|-----------------|
| loadRoute | > 5s | Verificar rede/backend |
| detectEvents | > 1s | Reduzir MAX_POINTS |
| FPS Play | < 30 | Desativar markers |
| Memory | > 500MB | Forçar cleanup |

### Como Monitorar

```javascript
// Após operações críticas
printRouteReport()

// FPS durante play
// (automático se DEBUG_ROUTE ativo)
```

---

## 🛡️ Fail-Safes Ativos

| Situação | Comportamento |
|----------|---------------|
| Export sem dados | Mensagem de erro |
| Share inválido | Reset + aviso |
| Pontos > limite | Warning + truncamento |
| Atributos ausentes | Fallback visual |
| Parse JSON falha | Retorna null seguro |
| Seek index inválido | Clamp para range válido |

---

## 📁 Arquivos Principais

```
src/
├── templates/
│   └── history.vue           # Componente principal
├── components/
│   ├── RoutePlaybackControls.vue  # Player
│   └── TimelinePoint.vue     # Ponto na timeline
├── composables/
│   ├── useRouteBookmarks.js  # Bookmarks
│   └── useRouteMode.js       # FASE 11: Basic/Premium mode
└── utils/
    ├── routeEventDetector.js # Detecção de eventos
    ├── routeChapters.js      # Capítulos e summary
    ├── routeExportPremium.js # Export PDF/Excel
    ├── routeTelemetry.js     # Telemetria DEV
    ├── routeFeatureFlags.js  # Feature flags (inclui Premium flags)
    ├── routeStressMode.js    # Modo stress
    └── routeFailSafe.js      # Guards e fallbacks
```

---

## ✅ Checklist Pre-Deploy

### Funcionalidade
- [ ] Modo Basic funcionando (default)
- [ ] Modo Premium funcionando (quando habilitado)
- [ ] Toggle de modo aparece só se planAllowsPremium
- [ ] Tabs de Insights renderizando corretamente
- [ ] Export básico funcionando
- [ ] Export Premium só em modo Premium
- [ ] Share Link só em modo Premium

### Flags
- [ ] Todos os flags em valores default
- [ ] `DEBUG_ROUTE` = false em PROD
- [ ] `ROUTE_PREMIUM_ALLOWED` conforme plano do cliente
- [ ] Limites configurados apropriadamente

### Performance
- [ ] Modo Basic não calcula insights premium
- [ ] Testes de stress passando
- [ ] Virtual scroll ativo
- [ ] Sem erros no console

### Testes
- [ ] Testar troca Basic ↔ Premium
- [ ] Testar persistência localStorage
- [ ] Export PDF testado com dados reais
- [ ] Share link funcionando cross-browser
- [ ] Heatmap toggle funcionando

---

## 📞 Suporte

Para debug com cliente:

1. Pedir para abrir Console (F12)
2. Executar: `enableRouteDebug()`
3. Verificar modo atual: `console.log(localStorage.getItem('kore-route-ui-mode'))`
4. Reproduzir problema
5. Executar: `printRouteReport()`
6. Screenshot do output

---

## 📈 Roadmap Futuro

- ✅ **FASE 11**: Sistema Basic/Premium Mode (Complete)
- ✅ **FASE 12**: Básico Impecável - UX (Complete)
- **FASE 13**: Premium por Tenant (capabilities)
- **FASE 14**: Polimento visual final
- **FASE 15**: Score de condução

---

*Documento gerado em: Janeiro 2026*  
*Última atualização: FASE 12 Complete*
