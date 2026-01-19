<template>
  <div class="driver-report">
    <!-- Header -->
    <div class="report-header">
      <el-page-header @back="goBack" :content="pageTitle">
        <template #extra>
          <el-button 
            type="primary" 
            :disabled="!canExport"
            @click="handleExportCSV"
            :loading="isExporting"
          >
            <el-icon><Download /></el-icon>
            Exportar CSV
          </el-button>
        </template>
      </el-page-header>
      
      <div v-if="driver" class="driver-info">
        <span class="driver-name">{{ driver.name }}</span>
        <el-tag v-if="driver.uniqueId" size="small" type="info">
          {{ driver.uniqueId }}
        </el-tag>
        <el-tag v-else size="small" type="warning">
          Sem uniqueId cadastrado
        </el-tag>
      </div>
    </div>

    <!-- Filtros -->
    <el-card class="filter-card" shadow="never">
      <div class="filters">
        <div class="date-picker-wrapper">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="até"
            start-placeholder="Data início"
            end-placeholder="Data fim"
            :shortcuts="datePresets"
            :disabled-date="disabledDate"
            :clearable="false"
            format="DD/MM/YYYY HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
            @change="onDateChange"
          />
        </div>

        <el-button 
          type="primary" 
          @click="loadReport"
          :disabled="!canLoadReport"
          :loading="isLoading"
        >
          Gerar Relatório
        </el-button>
      </div>

      <div v-if="periodError" class="period-error">
        <el-alert
          :title="periodError"
          type="warning"
          :closable="false"
          show-icon
        />
      </div>
    </el-card>

    <!-- Loading State -->
    <div v-if="isLoading" class="kpis-grid">
      <el-skeleton animated :rows="3" v-for="i in 6" :key="i" />
    </div>

    <!-- Error State -->
    <el-card v-else-if="error" class="error-card" shadow="never">
      <el-result
        :icon="errorIcon"
        :title="errorTitle"
        :sub-title="errorMessage"
      >
        <template #extra>
          <el-button type="primary" @click="loadReport" v-if="error.code !== 422">
            Tentar Novamente
          </el-button>
          <el-button type="primary" @click="goToDriverEdit" v-if="isUniqueIdError">
            Editar Motorista
          </el-button>
        </template>
      </el-result>
    </el-card>

    <!-- Empty State (sem dados ainda) -->
    <el-card v-else-if="!reportData" class="empty-card" shadow="never">
      <el-empty description="Selecione um período e clique em 'Gerar Relatório'" />
    </el-card>

    <!-- Report Data -->
    <div v-else class="report-content">
      <!-- KPIs Cards -->
      <div class="kpis-grid">
        <el-card class="kpi-card" shadow="hover">
          <div class="kpi-content">
            <el-icon class="kpi-icon" :size="32" color="#409EFF">
              <Location />
            </el-icon>
            <div class="kpi-data">
              <div class="kpi-value">{{ formatDistance(reportData.kpis.distance_km) }}</div>
              <div class="kpi-label">Distância Percorrida</div>
            </div>
          </div>
        </el-card>

        <el-card class="kpi-card" shadow="hover">
          <div class="kpi-content">
            <el-icon class="kpi-icon" :size="32" color="#67C23A">
              <Timer />
            </el-icon>
            <div class="kpi-data">
              <div class="kpi-value">{{ formatDrivingTime(reportData.kpis.driving_time_minutes) }}</div>
              <div class="kpi-label">Tempo de Condução</div>
            </div>
          </div>
        </el-card>

        <el-card class="kpi-card" shadow="hover">
          <div class="kpi-content">
            <el-icon class="kpi-icon" :size="32" color="#E6A23C">
              <Odometer />
            </el-icon>
            <div class="kpi-data">
              <div class="kpi-value">{{ formatSpeed(reportData.kpis.average_speed) }}</div>
              <div class="kpi-label">Velocidade Média</div>
            </div>
          </div>
        </el-card>

        <el-card class="kpi-card" shadow="hover">
          <div class="kpi-content">
            <el-icon class="kpi-icon" :size="32" color="#F56C6C">
              <Notification />
            </el-icon>
            <div class="kpi-data">
              <div class="kpi-value">{{ formatSpeed(reportData.kpis.max_speed) }}</div>
              <div class="kpi-label">Velocidade Máxima</div>
            </div>
          </div>
        </el-card>

        <el-card class="kpi-card" shadow="hover">
          <div class="kpi-content">
            <el-icon class="kpi-icon" :size="32" color="#909399">
              <Position />
            </el-icon>
            <div class="kpi-data">
              <div class="kpi-value">{{ reportData.kpis.total_positions }}</div>
              <div class="kpi-label">Total de Posições</div>
            </div>
          </div>
        </el-card>

        <el-card class="kpi-card" shadow="hover">
          <div class="kpi-content">
            <el-icon class="kpi-icon" :size="32" color="#606266">
              <Warning />
            </el-icon>
            <div class="kpi-data">
              <div class="kpi-value">{{ reportData.kpis.total_events }}</div>
              <div class="kpi-label">Total de Eventos</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Veículos Utilizados -->
      <el-card class="devices-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>Veículos Utilizados no Período</span>
            <el-tag size="small">{{ reportData.devices.length }}</el-tag>
          </div>
        </template>

        <div v-if="reportData.devices.length === 0" class="empty-devices">
          <el-empty description="Nenhum dispositivo utilizado no período selecionado">
            <el-alert
              type="info"
              :closable="false"
              show-icon
            >
              <template #title>
                O motorista pode não ter dirigido neste período ou o dispositivo não possui iButton/RFID configurado.
              </template>
            </el-alert>
          </el-empty>
        </div>

        <el-table 
          v-else
          :data="reportData.devices" 
          style="width: 100%"
          :show-header="true"
        >
          <el-table-column prop="deviceId" label="ID" width="80" />
          <el-table-column prop="deviceName" label="Nome do Veículo" />
        </el-table>
      </el-card>

      <!-- Gráfico de Velocidade (PR-08B) -->
      <el-card class="chart-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><TrendCharts /></el-icon>
            <span style="margin-left: 8px;">Velocidade ao Longo do Tempo</span>
          </div>
        </template>

        <DriverSpeedChart 
          :series="chartSeries"
          :isLoading="isLoadingChart"
          :height="200"
        />
      </el-card>
    </div>

    <!-- Sticky Export Button (Mobile) -->
    <div v-if="canExport" class="mobile-export-bar">
      <el-button 
        type="primary" 
        @click="handleExportCSV"
        :loading="isExporting"
        block
      >
        <el-icon><Download /></el-icon>
        Exportar CSV
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElNotification } from 'element-plus';
import {
  Download,
  Location,
  Timer,
  Odometer,
  Notification,
  Position,
  Warning,
  TrendCharts
} from '@element-plus/icons-vue';
import DriverSpeedChart from './components/driver-speed-chart.vue';

const route = useRoute();
const router = useRouter();

// State
const driver = ref(null);
const dateRange = ref([]);
const reportData = ref(null);
const previousReportData = ref(null); // Preservar dados anteriores durante loading
const isLoading = ref(false);
const isExporting = ref(false);
const error = ref(null);
const periodError = ref('');
const chartSeries = ref([]);
const isLoadingChart = ref(false);

// Computed
const pageTitle = computed(() => {
  return driver.value ? `Relatório - ${driver.value.name}` : 'Relatório do Motorista';
});

const canLoadReport = computed(() => {
  return dateRange.value && 
         dateRange.value.length === 2 && 
         !periodError.value &&
         !isLoading.value;
});

const canExport = computed(() => {
  return canLoadReport.value && reportData.value;
});

const isUniqueIdError = computed(() => {
  return error.value?.code === 422 && 
         error.value?.message?.includes('uniqueId');
});

const errorIcon = computed(() => {
  if (error.value?.code === 404) return 'warning';
  if (error.value?.code === 422) return 'info';
  return 'error';
});

const errorTitle = computed(() => {
  if (error.value?.code === 404) return 'Motorista não encontrado';
  if (error.value?.code === 422) return 'Dados incompletos';
  return 'Erro ao carregar relatório';
});

const errorMessage = computed(() => {
  return error.value?.message || 'Ocorreu um erro inesperado';
});

// Date presets
const datePresets = [
  {
    text: 'Hoje',
    value: () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: 'Ontem',
    value: () => {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: 'Últimos 7 dias',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  }
];

// Validação de período máximo (7 dias)
function validatePeriod(dates) {
  if (!dates || dates.length !== 2) {
    periodError.value = '';
    return true;
  }

  const [start, end] = dates;
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 7) {
    periodError.value = 'Período máximo permitido é de 7 dias';
    return false;
  }

  periodError.value = '';
  return true;
}

// Desabilitar datas futuras
function disabledDate(date) {
  return date > new Date();
}

// Handlers
function onDateChange(dates) {
  validatePeriod(dates);
}

async function loadReport() {
  if (!canLoadReport.value) return;

  isLoading.value = true;
  error.value = null;
  
  // Preservar dados anteriores durante loading (UX refinement)
  previousReportData.value = reportData.value;

  try {
    const [from, to] = dateRange.value;
    const driverId = route.params.driverId;

    // Fazer request usando window.$traccar (padrão do projeto)
    const url = `/api/drivers/${driverId}/report?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    
    const response = await window.$traccar.axios.get(url);
    
    reportData.value = response.data;
    
    // Carregar série de velocidade (PR-08B)
    await loadChartSeries(driverId, from, to);
    
    ElMessage.success('Relatório gerado com sucesso');

  } catch (err) {
    console.error('[DriverReport] Erro ao carregar relatório:', err);
    
    const status = err.response?.status;
    const data = err.response?.data;

    error.value = {
      code: status,
      message: data?.error || data?.message || 'Erro ao carregar relatório'
    };

    // Restaurar dados anteriores se houver erro
    reportData.value = previousReportData.value;

    ElNotification.error({
      title: 'Erro',
      message: error.value.message,
      duration: 5000
    });
  } finally {
    isLoading.value = false;
  }
}

// Carregar série de velocidade para o gráfico (PR-08B)
async function loadChartSeries(driverId, from, to) {
  isLoadingChart.value = true;
  chartSeries.value = [];

  try {
    // Tentar carregar do endpoint de série (PR-08C)
    const seriesUrl = `/api/drivers/${driverId}/report/series?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&maxPoints=600`;
    
    const response = await window.$traccar.axios.get(seriesUrl);
    
    if (response.data && response.data.series) {
      chartSeries.value = response.data.series;
    }
  } catch (err) {
    // Se endpoint não existir (404), silenciosamente não exibir gráfico
    if (err.response?.status === 404) {
      console.info('[DriverReport] Endpoint /series não implementado ainda');
      chartSeries.value = [];
    } else {
      console.warn('[DriverReport] Erro ao carregar série:', err);
      chartSeries.value = [];
    }
  } finally {
    isLoadingChart.value = false;
  }
}

async function handleExportCSV() {
  if (!canExport.value) return;

  isExporting.value = true;

  try {
    const [from, to] = dateRange.value;
    const driverId = route.params.driverId;

    // Construir URL com query params
    const params = new URLSearchParams({
      from: from,
      to: to
    });

    const url = `${window.$traccar.server}/api/drivers/${driverId}/report/export?${params.toString()}`;

    // Abrir em nova aba para manter cookie session
    window.open(url, '_blank');

    ElMessage.success('Download iniciado');

  } catch (err) {
    console.error('[DriverReport] Erro ao exportar CSV:', err);
    
    ElNotification.error({
      title: 'Erro ao exportar',
      message: 'Não foi possível exportar o relatório em CSV',
      duration: 5000
    });
  } finally {
    isExporting.value = false;
  }
}

function goBack() {
  router.push('/drivers');
}

function goToDriverEdit() {
  // Navegar para edição do motorista (assumindo que existe essa rota)
  router.push(`/drivers`);
  ElMessage.info('Edite o motorista e adicione o uniqueId (RFID/iButton)');
}

// Formatters
function formatDistance(km) {
  if (!km || km === 0) return '0 km';
  return `${km.toFixed(2)} km`;
}

function formatDrivingTime(minutes) {
  if (!minutes || minutes === 0) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins} min`;
}

function formatSpeed(speed) {
  if (!speed || speed === 0) return '0 km/h';
  return `${speed.toFixed(1)} km/h`;
}

// Lifecycle
onMounted(async () => {
  const driverId = route.params.driverId;

  if (!driverId) {
    ElMessage.error('ID do motorista não fornecido');
    router.push('/drivers');
    return;
  }

  // Buscar dados do motorista
  try {
    const response = await window.$traccar.getDrivers({ id: driverId });
    
    if (response.data && response.data.length > 0) {
      driver.value = response.data[0];
    } else {
      throw new Error('Motorista não encontrado');
    }

    // Inicializar com período padrão (últimos 7 dias)
    dateRange.value = datePresets[2].value();

  } catch (err) {
    console.error('[DriverReport] Erro ao carregar motorista:', err);
    ElMessage.error('Erro ao carregar dados do motorista');
    setTimeout(() => router.push('/drivers'), 2000);
  }
});
</script>

<style scoped>
.driver-report {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.report-header {
  margin-bottom: 20px;
}

.driver-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.driver-name {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.filter-card {
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.date-picker-wrapper {
  flex: 1;
  min-width: 300px;
}

.period-error {
  margin-top: 12px;
}

/* KPIs Grid */
.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.kpi-card {
  cursor: default;
  transition: transform 0.2s;
}

.kpi-card:hover {
  transform: translateY(-2px);
}

.kpi-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.kpi-icon {
  flex-shrink: 0;
}

.kpi-data {
  flex: 1;
}

.kpi-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.kpi-label {
  font-size: 14px;
  color: #909399;
}

/* Devices Card */
.devices-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.empty-devices {
  padding: 20px 0;
}

.error-card,
.empty-card {
  margin-top: 40px;
}

/* Mobile Export Bar (PR-08B) */
.mobile-export-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: none;
}

/* Responsive */
@media (max-width: 768px) {
  .driver-report {
    padding: 12px;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .date-picker-wrapper {
    width: 100%;
  }

  .kpis-grid {
    grid-template-columns: 1fr;
  }

  .driver-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .mobile-export-bar {
    display: block;
  }
}
</style>
