# 📊 AUDIT COMPLETO - MÓDULO DE RELATÓRIOS

**Data:** 2026-01-07  
**Objetivo:** Inventariar todos os relatórios, métricas, fontes de dados, exports e identificar inconsistências  
**Escopo:** PASSO 3 - Relatórios V2 (consistência + limpeza + upgrades)

---

## 1. INVENTÁRIO DE RELATÓRIOS ATIVOS

### Relatórios Registrados nas Rotas (`src/routes.js`)

| Rota | Componente | Arquivo | Status |
|------|-----------|---------|--------|
| `/reports` | Menu | `reportTypes.vue` | ✅ Ativo |
| `/reports/resume` | Resumo | `reportResume.vue` | ✅ Ativo |
| `/reports/travels` | Viagens | `reportTravels.vue` | ✅ Ativo |
| `/reports/stops` | Paradas | `reportStops.vue` | ✅ Ativo |
| `/reports/events` | Eventos | `reportEvents.vue` | ✅ Ativo |
| `/reports/history` | Histórico | `history.vue` | ✅ Ativo |
| `/history` | Histórico (direto) | `history.vue` | ✅ Ativo |

### Arquivos WIP / Não Usados

| Arquivo | Linhas | Status | Ação P2 |
|---------|--------|--------|---------|
| `history-refactored.vue` | 1410 | ⚠️ WIP - não está em rota | 🗑️ Remover |
| `historynew.vue` | 2370 | ⚠️ WIP - não está em rota | 🗑️ Remover |
| `report.vue` | 1 | 🐛 Stub vazio (`<template>s</template>`) | 🗑️ Remover |
| `pdf-route-report.vue` | ? | ⚠️ Usado apenas por WIP? | 🔍 Verificar uso |

---

## 2. MATRIZ: RELATÓRIO × MÉTRICA × FONTE × STATUS

### 2.1 Summary (Resumo) - `reportResume.vue`

| Métrica | Exibição | Fonte | Cálculo | Status |
|---------|----------|-------|---------|--------|
| **Distância** | `b.distance` (i18n units) | ✅ Backend `/reports/summary` | Traccar calcula | ⚠️ Unidade via i18n |
| **Odômetro Início** | `b.startOdometer` (i18n units) | ✅ Backend `/reports/summary` | Traccar busca posição | ⚠️ Unidade via i18n |
| **Odômetro Fim** | `b.endOdometer` (i18n units) | ✅ Backend `/reports/summary` | Traccar busca posição | ⚠️ Unidade via i18n |
| **Velocidade Média** | `b.averageSpeed` (i18n units) | ✅ Backend `/reports/summary` | Traccar calcula | ⚠️ Unidade via i18n |
| **Velocidade Máxima** | `b.maxSpeed` (i18n units) | ✅ Backend `/reports/summary` | Traccar calcula | ⚠️ Unidade via i18n |
| **Horas Motor** | `Math.round(((b.engineHours/60)/60)/1000)` | ✅ Backend `/reports/summary` | **🐛 FÓRMULA ERRADA** | 🔴 P0 - Fixar |
| **Combustível** | `b.spentFuel` | ✅ Backend `/reports/summary` | Traccar calcula | ✅ OK |

**Ações no Relatório:**
- Clicar card → `loadRoute()` → busca posições e desenha rota no mapa
- Filtro de device via `hideDevices(deviceId)`

**Exports:**
- PDF: ✅ `saveAs(blob, 'resume.pdf')`
- Excel/XLS: ✅ `saveAs(blob, 'resume.xlsx')`

---

### 2.2 Travels (Viagens) - `reportTravels.vue`

| Métrica | Exibição | Fonte | Cálculo | Status |
|---------|----------|-------|---------|--------|
| **Endereço Início** | `b.startAddress` ou `b.startLat, b.startLon` | ✅ Backend `/reports/trips` | Traccar geocode | ✅ OK |
| **Endereço Fim** | `b.endAddress` ou `b.endLat, b.endLon` | ✅ Backend `/reports/trips` | Traccar geocode | ✅ OK |
| **Odômetro Início** | `b.startOdometer` (i18n units) | ✅ Backend `/reports/trips` | Traccar busca posição | ⚠️ Unidade via i18n |
| **Odômetro Fim** | `b.endOdometer` (i18n units) | ✅ Backend `/reports/trips` | Traccar busca posição | ⚠️ Unidade via i18n |
| **Velocidade Média** | `b.averageSpeed` (i18n units) | ✅ Backend `/reports/trips` | Traccar calcula | ⚠️ Unidade via i18n |
| **Velocidade Máxima** | `b.maxSpeed` (i18n units) | ✅ Backend `/reports/trips` | Traccar calcula | ⚠️ Unidade via i18n |
| **Duração** | `Math.round(((b.duration/60)/60)/1000)` hs | ✅ Backend `/reports/trips` | **🐛 FÓRMULA ERRADA** | 🔴 P0 - Fixar |
| **Distância** | `b.distance` (i18n units) | ✅ Backend `/reports/trips` | Traccar calcula | ⚠️ Unidade via i18n |
| **Combustível** | `b.spentFuel` | ✅ Backend `/reports/trips` | Traccar calcula | ⚠️ `v-if="false"` oculto |

**Ações no Relatório:**
- Clicar trip → `loadRoute()` → busca posições e desenha rota
- Filtro de device via `hideDevices(deviceId)`
- Switch: "Mostrar Marcadores" (`showRouteMarkers`)

**Exports:**
- PDF: ✅ `saveAs(blob, 'resume.pdf')` ⚠️ **nome errado**
- Excel/XLS: ✅ `saveAs(blob, 'travels.xlsx')` ✅ nome correto

---

### 2.3 Stops (Paradas) - `reportStops.vue`

| Métrica | Exibição | Fonte | Cálculo | Status |
|---------|----------|-------|---------|--------|
| **Endereço** | `b.address` | ✅ Backend `/reports/stops` | Traccar geocode | ✅ OK |
| **Odômetro Início** | `parseInt(b.startOdometer)` km **hardcoded** | ✅ Backend `/reports/stops` | Traccar | 🔴 P0 - unidade fixa |
| **Odômetro Fim** | `parseInt(b.endOdometer)` km **hardcoded** | ✅ Backend `/reports/stops` | Traccar | 🔴 P0 - unidade fixa |
| **Velocidade Média** | `parseInt(b.averageSpeed)` km/h **hardcoded** | ✅ Backend `/reports/stops` | Traccar | 🔴 P0 - unidade fixa |
| **Velocidade Máxima** | `parseInt(b.maxSpeed)` km/h **hardcoded** | ✅ Backend `/reports/stops` | Traccar | 🔴 P0 - unidade fixa |
| **Tempo Total** | `b.duration` (sem conversão) | ✅ Backend `/reports/stops` | Traccar (string?) | ⚠️ P1 - formato? |
| **Distância** | `parseFloat(b.distance).toFixed(2)` km **hardcoded** | ✅ Backend `/reports/stops` | Traccar | 🔴 P0 - unidade fixa |
| **Combustível** | `b.spentFuel` L | ✅ Backend `/reports/stops` | Traccar | ✅ OK |

**Ações no Relatório:**
- Clicar stop → **NÃO tem loadRoute**, só plota os próprios stops no mapa
- `updateRoute(tmp, false)` → plota stops diretamente usando lat/lon das paradas
- Switch: "Mostrar Marcadores" (`showRouteMarkers`)

**Exports:**
- PDF: ✅ `saveAs(blob, 'resume.pdf')` ⚠️ **nome errado**
- Excel/XLS: ✅ `saveAs(blob, 'resume.xlsx')` ⚠️ **nome errado**

---

### 2.4 Events (Eventos) - `reportEvents.vue`

| Métrica | Exibição | Fonte | Cálculo | Status |
|---------|----------|-------|---------|--------|
| **Tipo de Evento** | `KT("notification.types."+e.type)` | ✅ Backend `/reports/events` | Traccar eventos | ✅ OK |
| **Data/Hora** | `new Date(e.eventTime).toLocaleXXX()` | ✅ Backend `/reports/events` | Traccar timestamp | ✅ OK |
| **Posições** | Lat/Lon das posições linkadas | ✅ Backend `/positions` (batch) | Busca positionId | ✅ OK |

**Ações no Relatório:**
- Agrupa eventos por deviceId usando `computed events()`
- Clicar device → **NÃO chama loadRoute corretamente** (b não tem startTime/endTime)
- Após carregar eventos → extrai `positionId` → chama `runtimeApi.getPositions(ids)` → plota no mapa
- Switch: "Mostrar Marcadores" (`showRouteMarkers`)

**Exports:**
- PDF: ✅ `saveAs(blob, 'resume.pdf')` ⚠️ **nome errado**
- Excel/XLS: ✅ `saveAs(blob, 'resume.xlsx')` ⚠️ **nome errado**

**🐛 BUG CRÍTICO:** `loadRoute(b)` espera `b.startTime/b.endTime`, mas eventos não têm essas propriedades → erro em runtime se usuário clicar

---

### 2.5 History (Histórico/Rota) - `history.vue`

**Arquivo:** 2802 linhas, altamente complexo, com agregação frontend

| Métrica | Exibição | Fonte | Cálculo | Status |
|---------|----------|-------|---------|--------|
| **Posições** | Array de [lat, lon, id, course] | ✅ Backend `/positions` | Traccar posições brutas | ✅ OK |
| **Distância Total** | Calculada no frontend | ❌ Frontend | `routeChapters.js` soma distâncias entre pontos | ⚠️ Fallback se backend falhar |
| **Velocidade Média** | Calculada no frontend | ❌ Frontend | `routeChapters.js` média ponderada | ⚠️ Fallback se backend falhar |
| **Velocidade Máxima** | `Math.max(...velocidades)` | ❌ Frontend | Loop de posições | ⚠️ Fallback |
| **Duração** | Diferença timestamps | ❌ Frontend | `endTime - startTime` | ✅ OK |
| **Paradas** | Detectadas por velocidade | ❌ Frontend | `routeEventDetector.js` | ⚠️ Heurística |
| **Eventos** | Acelerações, freadas, etc | ❌ Frontend | `routeEventDetector.js` | ⚠️ Heurística |
| **Capítulos** | Viagens segmentadas | ❌ Frontend | `routeChapters.js` detecta gaps | ⚠️ Heurística |
| **Odômetro** | Exibido se disponível | ✅ Backend (atributo) | Traccar posição | ✅ OK |
| **Horas Motor** | Não exibido diretamente | — | — | ⚠️ Não tem |

**Ações no Relatório:**
- Timeline interativa com scroll dinâmico
- Route Player (play/pause/velocidade)
- Heatmap overlay opcional
- Seleção de cor da rota
- Modo Premium vs Básico (toggle)

**Exports:**
- **CSV básico:** ✅ Posições brutas (lat, lon, speed, course, altitude, etc)
- **Excel básico:** ✅ Planilha com posições
- **PDF Premium:** ✅ Relatório completo com mapa, métricas, eventos, gráficos (`routeExportPremium.js`)
- **Excel Premium:** ✅ Múltiplas abas (resumo, posições, eventos, paradas)
- **KML:** ✅ Google Earth export (`FASE 13`) com LineString + Placemark

---

## 3. INCONSISTÊNCIAS IDENTIFICADAS (CRÍTICAS)

### 🔴 P0 - CRÍTICO (Dados Errados)

| ID | Problema | Impacto | Relatórios Afetados | Solução |
|----|----------|---------|---------------------|---------|
| **P0-1** | **Horas Motor calculadas errado** | Valor 1000x maior que deveria | Summary | `b.engineHours` já vem em **milissegundos**. Fórmula correta: `(b.engineHours / 1000 / 60 / 60).toFixed(1)` hs |
| **P0-2** | **Duração calculada errado** | Valor 1000x maior | Travels | `b.duration` já vem em **milissegundos**. Fórmula correta: `(b.duration / 1000 / 60 / 60).toFixed(1)` hs |
| **P0-3** | **Unidades hardcoded (km/km/h)** | Ignora preferência do servidor (mi/mph) | Stops | Todas as métricas usam `parseInt(valor) km` ao invés de i18n como nos outros relatórios |
| **P0-4** | **Nome de arquivo export errado** | Todos salvam como "resume.pdf/xlsx" | Travels, Stops, Events | Deve seguir padrão `Relatorio_<tipo>_<device>_<YYYY-MM-DD>.pdf` |
| **P0-5** | **loadRoute() quebrado em Events** | Clique no evento causa erro | Events | `b` (evento) não tem `startTime/endTime` → precisa usar `eventTime` ou remover ação |

### ⚠️ P1 - IMPORTANTE (Inconsistência/UX)

| ID | Problema | Impacto | Solução |
|----|----------|---------|---------|
| **P1-1** | **Distância Summary ≠ Travels** | Usuário vê valores diferentes para mesmo período | Usar mesmo endpoint ou mesma agregação |
| **P1-2** | **Odômetro mostra diferença sem explicar** | Summary mostra start/end; Travels mostra start/end mas não a diferença | Adicionar "Distância percorrida (odômetro)" |
| **P1-3** | **Velocidade média inconsistente** | History calcula no front; outros vêm do back | Documentar que History é fallback; preferir backend quando disponível |
| **P1-4** | **Horas motor só no Summary** | Trips/Stops/Events não mostram horas motor | Se backend não retorna, mostrar "—" + tooltip explicativo |
| **P1-5** | **Textos não i18n** | Stops/Events usam português hardcoded | Migrar para $t() keys |
| **P1-6** | **Loading/Empty/Error diferentes** | Cada relatório tem texto diferente | Criar componentes ReportLoading/EmptyState/ErrorState |
| **P1-7** | **duration em Stops sem formato** | Exibe `b.duration` direto (string? ms?) | Converter para hh:mm ou hs |

### 📝 P2 - MELHORIA (Limpeza/Otimização)

| ID | Problema | Impacto | Solução |
|----|----------|---------|---------|
| **P2-1** | **Código morto** | 3 arquivos não usados (3781 linhas) | Remover history-refactored, historynew, report.vue |
| **P2-2** | **Combustível oculto em Travels** | `v-if="false"` comentado | Remover código morto ou habilitar |
| **P2-3** | **Switch "Mostrar Marcadores" duplicado** | Todos os relatórios têm o mesmo switch | Mover para reportCommon.vue? |
| **P2-4** | **Exports não seguem convenção** | Nomes inconsistentes | Padronizar `Relatorio_<tipo>_<device>_<inicio>_a_<fim>.<ext>` |

---

## 4. PROPOSTA: `src/utils/reportMetrics.js`

```javascript
/**
 * UTILITÁRIO CENTRAL PARA MÉTRICAS DE RELATÓRIOS
 * Padroniza cálculos, conversões e formatação
 * Elimina inconsistências entre Summary/Trips/Stops/Events/History
 */

/**
 * Normaliza distância para km com precisão padrão
 * @param {number} value - Distância em metros (Traccar padrão)
 * @param {number} decimals - Casas decimais (padrão: 1)
 * @returns {number} Distância em km
 */
export function normalizeDistanceKm(value, decimals = 1) {
  if (!value || isNaN(value)) return 0;
  const km = value / 1000; // m → km
  return parseFloat(km.toFixed(decimals));
}

/**
 * Normaliza velocidade para km/h com precisão padrão
 * @param {number} value - Velocidade em knots (Traccar padrão)
 * @param {number} decimals - Casas decimais (padrão: 0 para inteiro)
 * @returns {number} Velocidade em km/h
 */
export function normalizeSpeed(value, decimals = 0) {
  if (!value || isNaN(value)) return 0;
  const kmh = value * 1.852; // knots → km/h
  return parseFloat(kmh.toFixed(decimals));
}

/**
 * Formata duração de milissegundos para hh:mm
 * @param {number} milliseconds - Duração em ms
 * @returns {string} Formato "02:30" (2h30min)
 */
export function formatDuration(milliseconds) {
  if (!milliseconds || isNaN(milliseconds)) return '00:00';
  const totalMinutes = Math.floor(milliseconds / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Formata duração de milissegundos para horas decimais
 * @param {number} milliseconds - Duração em ms
 * @param {number} decimals - Casas decimais (padrão: 1)
 * @returns {number} Horas decimais (ex: 2.5 = 2h30min)
 */
export function formatDurationHours(milliseconds, decimals = 1) {
  if (!milliseconds || isNaN(milliseconds)) return 0;
  const hours = milliseconds / 1000 / 60 / 60;
  return parseFloat(hours.toFixed(decimals));
}

/**
 * Resolve distância do odômetro com fallback
 * @param {Object} options
 * @param {number} options.startOdo - Odômetro inicial (m)
 * @param {number} options.endOdo - Odômetro final (m)
 * @param {number} options.fallbackDistanceKm - Distância calculada alternativa (km)
 * @returns {Object} { value: number, source: 'odometer'|'calculated', label: string }
 */
export function resolveOdometer({ startOdo, endOdo, fallbackDistanceKm }) {
  if (startOdo != null && endOdo != null && endOdo > startOdo) {
    const distanceKm = normalizeDistanceKm(endOdo - startOdo);
    return {
      value: distanceKm,
      source: 'odometer',
      label: 'Distância no Odômetro'
    };
  }
  
  if (fallbackDistanceKm != null && fallbackDistanceKm > 0) {
    return {
      value: fallbackDistanceKm,
      source: 'calculated',
      label: 'Distância Calculada (GPS)'
    };
  }
  
  return {
    value: 0,
    source: 'unavailable',
    label: '—'
  };
}

/**
 * Resolve velocidade média com fallback frontend
 * @param {Object} options
 * @param {number} options.avgSpeedBackend - Vel média do backend (knots)
 * @param {Array} options.routePoints - Pontos da rota para cálculo manual
 * @returns {Object} { value: number, source: 'backend'|'calculated', label: string }
 */
export function resolveAvgSpeed({ avgSpeedBackend, routePoints }) {
  // Preferir backend sempre que disponível
  if (avgSpeedBackend != null && avgSpeedBackend > 0) {
    return {
      value: normalizeSpeed(avgSpeedBackend),
      source: 'backend',
      label: 'Velocidade Média (Backend)'
    };
  }
  
  // Fallback: calcular no frontend (só History usa isso)
  if (routePoints && routePoints.length >= 2) {
    const speeds = routePoints
      .map(p => p.speed || 0)
      .filter(s => s > 0);
    
    if (speeds.length > 0) {
      const avgKnots = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      return {
        value: normalizeSpeed(avgKnots),
        source: 'calculated',
        label: 'Velocidade Média (Calculada)'
      };
    }
  }
  
  return {
    value: 0,
    source: 'unavailable',
    label: '—'
  };
}

/**
 * Resolve horas de motor com fallback para dispositivos sem suporte
 * @param {Object} options
 * @param {number} options.ignitionHoursBackend - Horas motor do backend (ms)
 * @param {boolean} options.ignitionSupported - Se o device suporta ignição
 * @returns {Object} { value: number, source: 'backend'|'unavailable', label: string, tooltip: string }
 */
export function resolveEngineHours({ ignitionHoursBackend, ignitionSupported }) {
  if (!ignitionSupported) {
    return {
      value: null,
      source: 'unavailable',
      label: '—',
      tooltip: 'Dispositivo não reporta horas de motor'
    };
  }
  
  if (ignitionHoursBackend != null && ignitionHoursBackend > 0) {
    return {
      value: formatDurationHours(ignitionHoursBackend, 1),
      source: 'backend',
      label: 'Horas de Motor',
      tooltip: ''
    };
  }
  
  return {
    value: 0,
    source: 'backend',
    label: '0 hs',
    tooltip: 'Motor não foi ligado neste período'
  };
}

/**
 * Gera nome padronizado para exports
 * @param {Object} options
 * @param {string} options.type - Tipo do relatório (summary|trips|stops|events|history)
 * @param {string} options.deviceName - Nome do dispositivo (sanitizado)
 * @param {Date} options.startDate - Data inicial
 * @param {Date} options.endDate - Data final
 * @param {string} options.extension - Extensão (pdf|xlsx|csv|kml)
 * @returns {string} Nome do arquivo
 */
export function generateExportFilename({ type, deviceName, startDate, endDate, extension }) {
  const sanitize = (str) => str.replace(/[^a-zA-Z0-9]/g, '_');
  const formatDate = (d) => {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  const typeName = {
    summary: 'Resumo',
    trips: 'Viagens',
    stops: 'Paradas',
    events: 'Eventos',
    history: 'Historico'
  }[type] || 'Relatorio';
  
  const device = sanitize(deviceName || 'Dispositivo');
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  return `Relatorio_${typeName}_${device}_${start}_a_${end}.${extension}`;
}

/**
 * INVARIANTES (regras que DEVEM ser seguidas em todos os relatórios):
 * 
 * 1. Distância: SEMPRE em km, SEMPRE 1 casa decimal
 * 2. Odômetro: Se tiver start/end → usar diferença; se não → usar distância calculada + label
 * 3. Velocidade: SEMPRE em km/h, SEMPRE inteiro (0 casas)
 * 4. Velocidade Média: PREFERIR backend; fallback frontend APENAS em History
 * 5. Duração: SEMPRE converter de ms → hh:mm OU horas decimais (1 casa)
 * 6. Horas Motor: Se não suportar → "—" + tooltip explicativo
 * 7. Exports: SEMPRE usar generateExportFilename()
 */
```

---

## 5. PLANO DE PRs (Execução Sequencial)

### PR #1 - P0: Criar utils + Fixar Summary (CRÍTICO)

**Objetivo:** Corrigir cálculos errados que mostram dados incorretos ao usuário

**Arquivos:**
- ✅ Criar `src/utils/reportMetrics.js`
- ✅ Editar `src/templates/reportResume.vue`

**Mudanças:**
```javascript
// ANTES (linha 56 reportResume.vue)
{{Math.round(((b.engineHours/60)/60)/1000)}} hs
// ❌ Divide por 1000 no final (errado!)

// DEPOIS
import { formatDurationHours } from '@/utils/reportMetrics'
{{formatDurationHours(b.engineHours)}} hs
// ✅ Converte ms → horas corretamente
```

**Checklist:**
- [ ] Criar `reportMetrics.js` com todas as funções
- [ ] Importar e usar `formatDurationHours` em Summary
- [ ] Importar e usar `generateExportFilename` em Summary
- [ ] Testar: Summary com período de 24h deve mostrar ~24hs motor (não 24000hs)
- [ ] Testar: Export deve ter nome `Relatorio_Resumo_<device>_<datas>.pdf`

---

### PR #2 - P0: Fixar Travels + Stops (Duração + Unidades)

**Objetivo:** Padronizar Travels e Stops com mesmas regras do Summary

**Arquivos:**
- ✅ `src/templates/reportTravels.vue`
- ✅ `src/templates/reportStops.vue`

**Mudanças Travels:**
```javascript
// ANTES (linha 76)
{{Math.round(((b.duration/60)/60)/1000)}} hs
// DEPOIS
{{formatDuration(b.duration)}}  // 02:30 format
```

**Mudanças Stops (múltiplas):**
```javascript
// ANTES (linhas 42, 46, 54, 58, 69 - todas hardcoded)
{{parseInt(b.startOdometer)}} km
{{parseInt(b.averageSpeed)}} km/h
{{parseFloat(b.distance).toFixed(2)}} km

// DEPOIS (usar i18n como Summary/Travels)
{{$t('units.'+store.getters['server/getAttribute']('distanceUnit','distanceUnit'),{distance: b.startOdometer})}}
{{$t('units.'+store.getters['server/getAttribute']('speedUnit','speedUnit'),{speed: b.averageSpeed})}}
```

**Checklist:**
- [ ] Travels: duração em hh:mm
- [ ] Travels: export com nome correto
- [ ] Stops: todas unidades via i18n (não hardcoded)
- [ ] Stops: duration formatado
- [ ] Stops: export com nome correto
- [ ] Testar: alterar preferência mi/mph no servidor → Stops deve respeitar

---

### PR #3 - P1: Fixar Events + UX (Loading/Empty/Error)

**Objetivo:** Corrigir bug de clique + padronizar estados de carregamento

**Arquivos:**
- ✅ `src/templates/reportEvents.vue`
- ✅ Criar `src/components/reports/ReportLoading.vue`
- ✅ Criar `src/components/reports/ReportEmptyState.vue`
- ✅ Criar `src/components/reports/ReportErrorState.vue`

**Mudanças Events:**
```vue
<!-- ANTES (linha 19) -->
<div @click="loadRoute(b)">
<!-- ❌ b = array de eventos, não tem startTime/endTime -->

<!-- DEPOIS -->
<div @click="showEventDetails(b)">
<!-- ✅ Mostra detalhes sem tentar carregar rota inexistente -->
```

**Componentes Novos:**
```vue
<!-- ReportLoading.vue -->
<template>
  <div class="report-loading">
    <el-spinner />
    <p>{{ message || $t('report.loading') }}</p>
  </div>
</template>

<!-- ReportEmptyState.vue -->
<template>
  <div class="report-empty">
    <i class="fas fa-inbox"></i>
    <p>{{ $t('report.noData') }}</p>
    <el-button @click="$emit('tryAgain')">
      {{ $t('report.tryAgain') }}
    </el-button>
  </div>
</template>

<!-- ReportErrorState.vue -->
<template>
  <div class="report-error">
    <i class="fas fa-exclamation-triangle"></i>
    <p>{{ $t('report.error') }}</p>
    <el-collapse v-if="details">
      <el-collapse-item title="Detalhes">
        <pre>{{ details }}</pre>
      </el-collapse-item>
    </el-collapse>
    <el-button @click="$emit('retry')">
      {{ $t('report.retry') }}
    </el-button>
  </div>
</template>
```

**Checklist:**
- [ ] Events: remover `@click="loadRoute(b)"` ou implementar corretamente
- [ ] Events: export com nome correto
- [ ] Criar 3 componentes de estado
- [ ] Substituir loading/empty inline nos 4 relatórios
- [ ] Adicionar i18n keys: `report.loading`, `report.noData`, `report.error`, etc

---

### PR #4 - P1: Encaixar History no util (sem refactor pesado)

**Objetivo:** History continua com agregação frontend, mas usa utils para consistência

**Arquivos:**
- ✅ `src/templates/history.vue`

**Mudanças:**
```javascript
// History já calcula no frontend, só encaixar na normalização
import { normalizeDistanceKm, normalizeSpeed, formatDuration } from '@/utils/reportMetrics'

// Ao calcular métricas, usar os helpers
const totalDistance = normalizeDistanceKm(calculatedMeters)
const avgSpeed = normalizeSpeed(calculatedKnots)
const duration = formatDuration(endMs - startMs)
```

**Checklist:**
- [ ] Importar utils em history.vue
- [ ] Substituir cálculos manuais por funções padronizadas
- [ ] Exports já funcionam, só testar nomes
- [ ] Validar que métricas History ≈ Summary (mesma precisão)

---

### PR #5 - P2: Limpeza de Código Morto

**Objetivo:** Remover 3781 linhas de código não usado

**Arquivos:**
- 🗑️ Deletar `src/templates/history-refactored.vue` (1410 linhas)
- 🗑️ Deletar `src/templates/historynew.vue` (2370 linhas)
- 🗑️ Deletar `src/templates/report.vue` (1 linha)
- 🔍 Verificar `src/templates/pdf-route-report.vue` (se usado apenas por WIP, deletar também)

**Checklist:**
- [ ] Grep workspace por imports desses arquivos (garantir zero uso)
- [ ] Deletar arquivos
- [ ] Rodar build: `npm run build` (deve passar)
- [ ] Testar navegação: /reports, /reports/resume, /reports/travels, /reports/stops, /reports/events, /history
- [ ] Redução de ~3800 linhas

---

### PR #6 (FUTURO) - Relatórios Novos (escolher 2)

**Opções mais valiosas:**

1. **Excesso de Velocidade**
   - Endpoint: `/reports/trips` filtrado por `maxSpeed > limite`
   - Ranking: por veículo, por condutor
   - Recorrência: heatmap por dia da semana/hora
   - Export: PDF com mapa de pontos críticos

2. **Marcha Lenta (Idle)**
   - Endpoint: Custom (ignition ON + speed = 0)
   - Métricas: tempo total idle, consumo desperdiçado (estimado)
   - ROI: economia real em litros/dinheiro
   - Export: PDF com gráfico de evolução semanal

---

## 6. RESUMO EXECUTIVO

### Inventário
- ✅ **5 relatórios ativos** (Summary, Trips, Stops, Events, History)
- ⚠️ **3 arquivos WIP não usados** (3781 linhas de código morto)
- 🐛 **1 stub vazio** (report.vue)

### Inconsistências Críticas (P0)
- 🔴 **Horas motor 1000x maior** (Summary)
- 🔴 **Duração 1000x maior** (Travels)
- 🔴 **Unidades hardcoded** (Stops ignora preferências)
- 🔴 **Exports com nomes errados** (todos salvam "resume")
- 🔴 **Bug de clique** (Events tenta carregar rota inexistente)

### Solução Proposta
- ✅ **Utils central:** `reportMetrics.js` com 7 funções + invariantes
- ✅ **5 PRs sequenciais:** P0 → P1 → P2 (não trava time)
- ✅ **Impacto:** ~200 linhas de código (utils) eliminam 5 bugs P0 + 7 inconsistências P1

### Métricas
- **Antes:** 5 relatórios, 5 formas diferentes de calcular distância/velocidade/duração
- **Depois:** 5 relatórios, 1 fonte de verdade (reportMetrics.js)
- **Redução:** -3781 linhas (código morto), +200 linhas (utils), = **-3581 linhas líquidas**

---

## PRÓXIMOS PASSOS

1. **Revisar este audit** com o time
2. **Priorizar PRs:** começar por P0-1 (Summary horas motor)
3. **Implementar PR#1:** criar utils + fixar Summary
4. **Testar em produção:** comparar Summary antes/depois
5. **Seguir sequência:** PR#2 → PR#3 → PR#4 → PR#5

**Pergunta para o usuário:**  
*"Qual é exatamente a inconsistência do Summary que você observou em produção? Ex.: distância bate com trips, mas odômetro não / vel média maior que vel máx?"*

Essa resposta ajudará a **priorizar qual métrica corrigir primeiro** e validar as suposições deste audit.
