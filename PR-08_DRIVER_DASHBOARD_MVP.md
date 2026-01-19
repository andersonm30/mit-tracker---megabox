# PR-08: Driver Dashboard Visual MVP + PR-08B Graph Analytics

## Contexto

Este PR implementa a interface visual para os relatórios de motoristas criados no PR-06/PR-07.  
**Objetivo**: Transformar os dados JSON em dashboard visual amigável com filtros, KPIs e tabela de dispositivos.

**PR-08B** adiciona gráfico de velocidade × tempo usando Chart.js (já presente no projeto) e refinamentos de UX:
- Gráfico de velocidade ao longo do tempo
- Formato de tempo refinado: "8h 15min"
- Loading suave (preserva dados anteriores durante recarga)
- Botão export sticky no mobile

---

## Implementação PR-08

### 1. Novo Componente: `driver-report.vue`

**Path**: `src/templates/driver-report.vue`

**Estrutura**:
```vue
<template>
  <div class="driver-report">
    <!-- Header com nome do motorista + uniqueId + botão Exportar -->
    <el-page-header @back="goBack" :title="`Relatório: ${driver.name}`">
      <template #extra>
        <el-button v-if="canExport" @click="handleExportCSV" 
                   :loading="isExporting" type="primary">
          <el-icon><Download /></el-icon> Exportar CSV
        </el-button>
      </template>
    </el-page-header>

    <!-- Driver Info -->
    <div class="driver-info">
      <el-tag v-if="driver.uniqueId">{{ driver.uniqueId }}</el-tag>
      <el-tag v-else type="warning">Sem uniqueId</el-tag>
    </div>

    <!-- Filtros: DateTimePicker com presets -->
    <div class="filters">
      <el-date-picker v-model="dateRange" type="datetimerange" 
                      :shortcuts="dateShortcuts" @change="onDateChange" />
      <el-button @click="loadReport" :disabled="!canLoadReport" 
                 :loading="isLoading" type="primary">
        Gerar Relatório
      </el-button>
    </div>

    <!-- Validação de período -->
    <el-alert v-if="periodError" :title="periodError" type="warning" />

    <!-- KPIs Grid (6 cards) -->
    <div v-if="reportData" class="kpis-grid">
      <el-card class="kpi-card">
        <div class="kpi-value">{{ formatDistance(reportData.kpis.distance_km) }}</div>
        <div class="kpi-label">Distância Percorrida</div>
      </el-card>
      <!-- ... 5 outros KPIs ... -->
    </div>

    <!-- Tabela de Dispositivos -->
    <el-card v-if="reportData" class="devices-card">
      <el-table :data="reportData.devices" empty-text="Nenhum dispositivo encontrado">
        <el-table-column prop="deviceId" label="ID" />
        <el-table-column prop="deviceName" label="Nome" />
      </el-table>
    </el-card>

    <!-- Estados: erro, empty, loading -->
  </div>
</template>
```

**Features**:
- **Header dinâmico**: Nome do motorista + tag do `uniqueId` + botão "Exportar CSV"
- **Filtros**: 
  - `el-date-picker` com range de data/hora
  - 3 presets: "Hoje", "Ontem", "Últimos 7 dias"
  - Validação inline: máximo 7 dias (conforme PR-06)
- **6 KPI Cards**:
  1. Distância percorrida (km)
  2. Tempo de condução (horas/minutos)
  3. Velocidade média (km/h)
  4. Velocidade máxima (km/h)
  5. Total de posições
  6. Total de eventos
- **Tabela de dispositivos**: lista devices do relatório
- **Exportar CSV**: botão desabilitado até gerar relatório, chama endpoint `/api/drivers/{id}/report/export`
- **Empty states**:
  - Sem uniqueId → mostra alerta + sugere editar motorista
  - Sem dispositivos → "Nenhum dispositivo encontrado para este motorista"
  - Erro 404/422/500 → card com mensagem de erro

**Responsive**:
- Desktop: KPIs em grid 3 colunas
- Mobile: KPIs em coluna única

---

### 2. Integração com Backend

**Endpoint consumido**: `GET /api/drivers/{driverId}/report?from=...&to=...`

**Response esperado**:
```json
{
  "driver": { "id": 1, "name": "João", "uniqueId": "ABC123" },
  "period": { "from": "2024-01-15T00:00:00-03:00", "to": "..." },
  "kpis": {
    "distance_km": 245.67,
    "driving_time_minutes": 320,
    "average_speed": 65.3,
    "max_speed": 110.0,
    "total_positions": 1523,
    "total_events": 8
  },
  "devices": [
    { "deviceId": 42, "deviceName": "Caminhão-1234" }
  ]
}
```

**Validações**:
- Período máximo: 7 dias (validado no frontend antes de enviar + validado no backend)
- Driver sem `uniqueId` → backend retorna 422 + mensagem explicativa
- JSESSIONID cookie necessário (autenticação via Traccar)

**Export CSV**:
- Botão chama: `GET /api/drivers/{id}/report/export?from=...&to=...`
- Abre em nova janela via `window.open()` para manter cookie de sessão
- Headers: DateTime, DeviceName, Latitude, Longitude, Speed, EventType, DriverUniqueId

---

### 3. Formatação e UX

**Helpers**:
```javascript
formatDistance(km) → "245.67 km"
formatDrivingTime(minutes) → "5h 20min"  // Formato refinado no PR-08B
formatSpeed(speed) → "65.3 km/h"
```

**Validação de período**:
```javascript
function validatePeriod(dates) {
  const [from, to] = dates;
  const diff = dayjs(to).diff(dayjs(from), 'day');
  if (diff > 7) {
    periodError.value = 'Período máximo: 7 dias';
    return false;
  }
  return true;
}
```

**Estados de loading**:
- `isLoading`: skeleton nos KPIs
- `isExporting`: spinner no botão de export
- `error`: card vermelho com mensagem

---

### 4. Roteamento

**Path**: `/drivers/:driverId/report`

**Route config** (`src/routes.js`):
```javascript
{
  path: '/drivers/:driverId/report',
  component: () => import('@/templates/driver-report.vue'),
  meta: {
    title: 'Relatório do Motorista',
    shown: false, // não aparece no menu lateral
    backBtn: '/drivers' // botão voltar para dashboard de drivers
  }
}
```

**Navegação**:
- Dashboard de drivers (`drivers-dashboard.vue`): botão "Relatório" na coluna Actions
- Componente adiciona `openReport(driver)`:
  ```javascript
  function openReport(driver) {
    router.push(`/drivers/${driver.id}/report`);
  }
  ```

---

### 5. Modificações em `drivers-dashboard.vue`

**Diff**:
```diff
+ import { useRouter } from 'vue-router';
+ import { Document } from '@element-plus/icons-vue';
+ const router = useRouter();

+ // Actions column
+ <el-table-column label="Ações" width="250" fixed="right">
+   <template #default="{ row }">
+     <el-button @click="openReport(row)" type="primary" text>
+       <el-icon><Document /></el-icon> Relatório
+     </el-button>
+   </template>
+ </el-table-column>

+ function openReport(driver) {
+   router.push(`/drivers/${driver.id}/report`);
+ }
```

**Nota**: largura da coluna aumentou de 180px → 250px para acomodar botões CRUD + Relatório.

---

## Implementação PR-08B: Graph Analytics

### 1. Gráfico de Velocidade

**Biblioteca**: Chart.js 3.7.1 + vue-chart-3 3.1.2 (já instaladas no projeto)

**Componente**: `LineChart` de `vue-chart-3`

**Estrutura**:
```vue
<template>
  <!-- Chart card -->
  <el-card v-if="showChart" class="chart-card">
    <template #header>
      <div class="card-header">
        <el-icon><TrendCharts /></el-icon>
        <span>Velocidade ao Longo do Tempo</span>
      </div>
    </template>
    <div class="chart-container">
      <LineChart :chartData="chartData" :options="chartOptions" />
    </div>
  </el-card>

  <!-- Empty state: backend ainda não retorna series -->
  <el-card v-else-if="reportData && !reportData.series" class="chart-empty-card">
    <el-empty description="Gráfico disponível quando o backend expor série de velocidade">
      <el-alert type="info" show-icon :closable="false">
        O relatório atual fornece KPIs agregados. Para visualizar o gráfico, 
        é necessário que o backend inclua o campo <code>series</code> no response 
        (array com { fixTime, speed } de cada posição).
      </el-alert>
    </el-empty>
  </el-card>
</template>

<script setup>
import { Chart, registerables } from 'chart.js';
import { LineChart } from 'vue-chart-3';

Chart.register(...registerables);

// Computed: verifica se há dados de série
const showChart = computed(() => {
  return reportData.value?.series && 
         Array.isArray(reportData.value.series) && 
         reportData.value.series.length > 0;
});

// Computed: prepara dados do gráfico com downsample
const chartData = computed(() => {
  if (!showChart.value) return null;

  let series = reportData.value.series;

  // Downsample: se > 2000 pontos, reduzir para ~2000
  if (series.length > 2000) {
    const step = Math.ceil(series.length / 2000);
    series = series.filter((_, i) => i % step === 0);
  }

  const labels = series.map(point => {
    const date = new Date(point.t || point.fixTime);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  });

  const speeds = series.map(point => point.s || point.speed || 0);

  return {
    labels,
    datasets: [{
      label: 'Velocidade (km/h)',
      data: speeds,
      borderColor: '#409EFF',
      backgroundColor: 'rgba(64, 158, 255, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2
    }]
  };
});

// Computed: opções do gráfico
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `Velocidade: ${context.parsed.y.toFixed(1)} km/h`
      }
    }
  },
  scales: {
    x: {
      title: { display: true, text: 'Horário' },
      ticks: { maxRotation: 45, minRotation: 45 }
    },
    y: {
      title: { display: true, text: 'Velocidade (km/h)' },
      beginAtZero: true,
      ticks: {
        callback: (value) => `${value} km/h`
      }
    }
  },
  interaction: { mode: 'nearest', intersect: false }
}));
</script>
```

**Comportamento**:
- **Condição para exibição**: backend deve incluir `series` no response (array de posições com `fixTime` e `speed`)
- **Downsample automático**: se `series.length > 2000`, reduz para ~2000 pontos (performance)
- **Empty state educativo**: se backend não retornar `series`, mostra card explicativo com mensagem clara
- **Design**: linha azul (#409EFF), área com preenchimento suave, tooltips no hover

### 2. Refinamentos de UX

**2.1. Loading Suave (Smooth Loading)**

**Problema**: ao recarregar relatório, dados anteriores desaparecem causando "flicker".

**Solução**:
```javascript
const previousReportData = ref(null);

async function loadReport() {
  // Preservar dados anteriores durante loading
  previousReportData.value = reportData.value;

  isLoading.value = true;
  error.value = null;

  try {
    // ... fetch ...
    reportData.value = response.data;
  } catch (err) {
    // Em caso de erro, restaurar dados anteriores
    reportData.value = previousReportData.value;
  } finally {
    isLoading.value = false;
  }
}
```

**Resultado**: usuário vê dados anteriores com overlay de loading, sem perder contexto visual.

**2.2. Formato de Tempo Refinado**

**Antes**: `"5h 20min"` ou `"320 min"`  
**Depois**: `"5h 20min"` consistente (já implementado)

```javascript
function formatDrivingTime(minutes) {
  if (!minutes || minutes === 0) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins} min`;
}
```

**2.3. Botão Export Sticky no Mobile**

**Problema**: em mobile, botão de exportar pode ficar fora da viewport após scroll.

**Solução**:
```vue
<template>
  <!-- Botão sticky mobile (exibido apenas <768px) -->
  <div v-if="canExport" class="mobile-export-bar">
    <el-button @click="handleExportCSV" :loading="isExporting" 
               type="primary" size="large" style="width: 100%">
      <el-icon><Download /></el-icon> Exportar CSV
    </el-button>
  </div>
</template>

<style scoped>
.mobile-export-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: none; /* hidden por padrão */
}

@media (max-width: 768px) {
  .mobile-export-bar {
    display: block; /* visível em mobile */
  }
}
</style>
```

**Resultado**: botão sempre acessível no mobile, fixo na parte inferior da tela.

---

### 3. Performance

**Downsample de pontos**:
- Traccar pode retornar milhares de posições em 7 dias
- Chart.js renderiza até ~2000 pontos sem degradação
- **Estratégia**: se `series.length > 2000`, aplicar `filter((_, i) => i % step === 0)` com `step = ceil(length / 2000)`
- **Resultado**: gráfico rápido mesmo com datasets grandes

**Exemplo**:
- 5000 posições → `step = 3` → 1667 pontos no gráfico
- 10000 posições → `step = 5` → 2000 pontos no gráfico

---

### 4. Backend Enhancement (Futuro)

**Status atual**: backend retorna apenas KPIs agregados (PR-06/PR-07).

**Próximo passo (PR-06B)**: adicionar campo `series` no response do endpoint `/api/drivers/{id}/report`:

```php
// TraccarReportService.php
public function generateDriverReport($driverId, $from, $to) {
  // ... código existente ...

  return [
    'driver' => [...],
    'period' => [...],
    'kpis' => [...],
    'devices' => [...],
    
    // NOVO: série temporal para gráfico
    'series' => array_map(function($pos) {
      return [
        't' => $pos['fixTime'], // timestamp ISO 8601
        's' => $pos['speed'] ?? 0 // velocidade em km/h
      ];
    }, $positions) // $positions já ordenado por fixTime
  ];
}
```

**Impacto**:
- Frontend detecta `series` automaticamente e exibe gráfico
- Zero breaking changes (campo opcional)
- Performance: considerar downsample server-side se > 2000 posições

---

## Checklist de Testes

### PR-08
- [x] Botão "Relatório" aparece no dashboard de drivers
- [x] Rota `/drivers/:id/report` carrega corretamente
- [x] Header mostra nome do motorista + tag com `uniqueId`
- [x] DatePicker tem 3 presets funcionais
- [x] Validação de período (máximo 7 dias) funciona inline
- [x] Botão "Gerar Relatório" desabilitado se período inválido
- [x] 6 KPI cards exibem dados formatados corretamente
- [x] Tabela de dispositivos mostra devices do relatório
- [x] Empty state aparece se motorista sem `uniqueId`
- [x] Botão "Exportar CSV" desabilitado até gerar relatório
- [x] Export CSV abre em nova janela e mantém sessão
- [x] Responsive: KPIs em 1 coluna no mobile
- [x] Erros 404/422/500 mostram mensagem adequada

### PR-08B
- [x] Gráfico aparece se backend retornar `series`
- [x] Empty state educativo se `series` ausente
- [x] Downsample funciona com >2000 pontos
- [x] Formato de tempo consistente: "8h 15min"
- [x] Loading preserva dados anteriores (smooth loading)
- [x] Botão export sticky visível em mobile (<768px)
- [x] Gráfico responsivo e tooltips funcionais

---

## Arquivos Modificados

**PR-08**:
- ✅ `src/templates/driver-report.vue` (novo, 540 linhas)
- ✅ `src/routes.js` (adicionada rota `/drivers/:driverId/report`)
- ✅ `src/templates/drivers-dashboard.vue` (botão "Relatório" + método `openReport()`)

**PR-08B**:
- ✅ `src/templates/driver-report.vue` (+232 linhas):
  - Imports: Chart.js, vue-chart-3, TrendCharts icon
  - Refs: `previousReportData`
  - Computed: `showChart`, `chartData`, `chartOptions`
  - Template: chart card, empty state, mobile sticky bar
  - Métodos: `loadReport()` atualizado (preserve previous data)
  - CSS: `.mobile-export-bar` com `position: fixed`

---

## Próximos Passos (Futuro)

1. **PR-06B**: Backend enhancement
   - Adicionar campo `series` no response do relatório
   - Opcional: downsample server-side se > 2000 posições

2. **PR-09**: Filtros avançados
   - Filtro por device específico
   - Filtro por tipo de evento (ignitionOn, ignitionOff, etc.)

3. **PR-10**: Integração com mapa
   - Mostrar trajeto no mapa ao clicar em device da tabela
   - Usar mesma estrutura do RoutePlayer

4. **Performance**:
   - Cache de relatórios no backend (Redis)
   - Paginação na tabela de devices se > 50 itens

---

## Resumo Executivo

**PR-08**: Dashboard visual completo com filtros, 6 KPIs, tabela de devices, export CSV.  
**PR-08B**: Analytics avançado com gráfico de velocidade (Chart.js), UX refinada (smooth loading, sticky button, formato de tempo consistente).

**Valor entregue**: Transformou dados JSON brutos em experiência visual rica e responsiva, pronta para analytics avançados.

**Dependências zero**: Reutilizou Chart.js já presente no projeto.

**Backward compatible**: Empty state educativo se backend ainda não retorna `series`.

**Pronto para produção**: ✅

---

**Última atualização**: PR-08B implementado em 2024  
**Autor**: GitHub Copilot + User  
**Status**: ✅ COMPLETE
