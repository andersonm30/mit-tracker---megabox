<template>
  <div class="speed-event-history">
    <!-- Header -->
    <div class="speed-event-history__header">
      <h3 class="speed-event-history__title">
        {{ $t('speedEvents.title') }}
      </h3>
      
      <!-- Presets de Range -->
      <div class="speed-event-history__presets">
        <button
          v-for="preset in presets"
          :key="preset.key"
          :class="[
            'speed-event-history__preset-btn',
            { 'speed-event-history__preset-btn--active': selectedPreset === preset.key }
          ]"
          @click="selectPreset(preset.key)"
        >
          {{ $t(`speedEvents.filter.${preset.key}`) }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="speed-event-history__loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>{{ $t('speedEvents.loading') }}</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="speed-event-history__error">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="speed-event-history__empty">
      <i class="fas fa-tachometer-alt"></i>
      <p>{{ $t('speedEvents.empty') }}</p>
    </div>

    <!-- Lista de Eventos -->
    <div v-else class="speed-event-history__list">
      <div
        v-for="event in items"
        :key="event.id"
        class="speed-event-history__item"
      >
        <!-- Data/Hora -->
        <div class="speed-event-history__item-col speed-event-history__item-col--time">
          <span class="speed-event-history__item-label">{{ $t('speedEvents.columns.time') }}</span>
          <span class="speed-event-history__item-value">{{ formatDateTime(event.position_time) }}</span>
        </div>

        <!-- Velocidade -->
        <div class="speed-event-history__item-col speed-event-history__item-col--speed">
          <span class="speed-event-history__item-label">{{ $t('speedEvents.columns.speed') }}</span>
          <span class="speed-event-history__item-value speed-event-history__item-value--speed">
            {{ formatSpeed(event.speed_kmh) }}
          </span>
        </div>

        <!-- Limite -->
        <div class="speed-event-history__item-col speed-event-history__item-col--limit">
          <span class="speed-event-history__item-label">{{ $t('speedEvents.columns.limit') }}</span>
          <span class="speed-event-history__item-value">{{ formatSpeed(event.speed_limit_kmh) }}</span>
        </div>

        <!-- Excedeu -->
        <div class="speed-event-history__item-col speed-event-history__item-col--exceed">
          <span class="speed-event-history__item-label">{{ $t('speedEvents.columns.exceed') }}</span>
          <span class="speed-event-history__item-value speed-event-history__item-value--exceed">
            +{{ formatSpeed(event.exceed_by_kmh) }}
          </span>
        </div>

        <!-- Endereço -->
        <div class="speed-event-history__item-col speed-event-history__item-col--address">
          <span class="speed-event-history__item-label">{{ $t('speedEvents.columns.address') }}</span>
          <span class="speed-event-history__item-value">{{ event.address || '—' }}</span>
        </div>

        <!-- Motorista (se houver) -->
        <div v-if="event.driver_id" class="speed-event-history__item-col speed-event-history__item-col--driver">
          <span class="speed-event-history__item-label">{{ $t('speedEvents.columns.driver') }}</span>
          <span class="speed-event-history__item-value">{{ getDriverName(event.driver_id) }}</span>
        </div>
      </div>
    </div>

    <!-- Paginação -->
    <div v-if="meta.lastPage > 1" class="speed-event-history__pagination">
      <button
        class="speed-event-history__pagination-btn"
        :disabled="meta.currentPage === 1"
        @click="prevPage"
      >
        <i class="fas fa-chevron-left"></i>
        {{ $t('speedEvents.pagination.prev') }}
      </button>

      <span class="speed-event-history__pagination-info">
        {{ $t('speedEvents.pagination.info', { 
          current: meta.currentPage, 
          total: meta.lastPage 
        }) }}
      </span>

      <button
        class="speed-event-history__pagination-btn"
        :disabled="meta.currentPage === meta.lastPage"
        @click="nextPage"
      >
        {{ $t('speedEvents.pagination.next') }}
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { formatSpeedKmh } from '@/utils/speedHelpers';

// Props
const props = defineProps({
  deviceId: {
    type: Number,
    required: true
  },
  driverId: {
    type: Number,
    default: null
  }
});

// Setup
const store = useStore();
const { t } = useI18n();

// State
const selectedPreset = ref('today');
const page = ref(1);
const perPage = ref(50);

// Presets de range
const presets = [
  { key: 'today', days: 0 },
  { key: 'last7', days: 7 },
  { key: 'last30', days: 30 }
];

// Computed
const items = computed(() => store.state.speedEvents.events);
const meta = computed(() => store.state.speedEvents.meta);
const loading = computed(() => store.state.speedEvents.loading);
const error = computed(() => store.state.speedEvents.error);

/**
 * Selecionar preset de range
 */
function selectPreset(key) {
  selectedPreset.value = key;
  page.value = 1; // Reset para página 1
  fetchEvents();
}

/**
 * Calcular datas from/to baseado no preset
 */
function getDateRange() {
  const preset = presets.find(p => p.key === selectedPreset.value);
  const now = new Date();
  const from = new Date();

  if (preset.days === 0) {
    // Hoje: 00:00:00 até agora
    from.setHours(0, 0, 0, 0);
  } else {
    // Últimos N dias: N dias atrás 00:00:00 até agora
    from.setDate(now.getDate() - preset.days);
    from.setHours(0, 0, 0, 0);
  }

  return {
    from: from.toISOString(),
    to: now.toISOString()
  };
}

/**
 * Buscar eventos
 */
async function fetchEvents() {
  const { from, to } = getDateRange();

  try {
    await store.dispatch('speedEvents/fetchSpeedEvents', {
      deviceId: props.deviceId,
      driverId: props.driverId,
      from,
      to,
      page: page.value,
      perPage: perPage.value
    });
  } catch (err) {
    console.error('[SpeedEventHistory] Failed to fetch events:', err);
  }
}

/**
 * Formatar data/hora
 */
function formatDateTime(isoString) {
  if (!isoString) return '—';

  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formatar velocidade (usa speedHelpers do PR-09C)
 */
function formatSpeed(value) {
  return formatSpeedKmh(value, { decimals: 1, showUnit: true });
}

/**
 * Obter nome do motorista
 */
function getDriverName(driverId) {
  if (!driverId) return '—';
  const driver = store.getters['drivers/getDriver'](driverId);
  return driver?.name || `Driver #${driverId}`;
}

/**
 * Paginação: Página anterior
 */
function prevPage() {
  if (page.value > 1) {
    page.value--;
    fetchEvents();
  }
}

/**
 * Paginação: Próxima página
 */
function nextPage() {
  if (page.value < meta.value.lastPage) {
    page.value++;
    fetchEvents();
  }
}

// Lifecycle
onMounted(() => {
  fetchEvents();
});

// Watch deviceId changes (se component for reutilizado)
watch(() => props.deviceId, () => {
  page.value = 1;
  fetchEvents();
});
</script>

<style scoped>
.speed-event-history {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.speed-event-history__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
}

.speed-event-history__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.speed-event-history__presets {
  display: flex;
  gap: 8px;
}

.speed-event-history__preset-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.speed-event-history__preset-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.speed-event-history__preset-btn--active {
  background: #1976d2;
  border-color: #1976d2;
  color: #fff;
  font-weight: 600;
}

.speed-event-history__loading,
.speed-event-history__error,
.speed-event-history__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.speed-event-history__loading i,
.speed-event-history__error i,
.speed-event-history__empty i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.speed-event-history__error {
  color: #d32f2f;
}

.speed-event-history__error i {
  opacity: 1;
}

.speed-event-history__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.speed-event-history__item {
  display: grid;
  grid-template-columns: 140px 100px 100px 100px 1fr auto;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fafafa;
  transition: background 0.2s;
}

.speed-event-history__item:hover {
  background: #f5f5f5;
}

.speed-event-history__item-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.speed-event-history__item-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #999;
}

.speed-event-history__item-value {
  font-size: 14px;
  color: #333;
}

.speed-event-history__item-value--speed {
  font-weight: 600;
  color: #d32f2f;
}

.speed-event-history__item-value--exceed {
  font-weight: 600;
  color: #f57c00;
}

.speed-event-history__pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.speed-event-history__pagination-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.speed-event-history__pagination-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #ccc;
}

.speed-event-history__pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.speed-event-history__pagination-info {
  font-size: 14px;
  color: #666;
}

/* Responsive */
@media (max-width: 768px) {
  .speed-event-history__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .speed-event-history__item {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .speed-event-history__item-col {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
