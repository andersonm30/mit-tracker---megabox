<template>
  <div v-if="position && position.attributes['driverUniqueId']" class="driver-card-wrapper">
    <div class="stat-label mt-20"><i class="far fa-id-card"></i> {{ KT('device.driver') }}</div>

    <div class="driver-card">
      <template v-if="driver">
        <!-- Foto centrada con tooltip -->
        <div class="driver-photo-wrapper">
          <el-tooltip effect="dark" placement="right" popper-class="driver-info-tooltip">
            <template #content>
              <div class="tooltip-driver-card">
                <div class="tooltip-driver-header">
                  <img 
                    :src="`/tarkan/assets/images/drivers/${driver.id}.png?v=${driverImageRefreshKey}`"
                    :alt="driver.name"
                    onerror="this.onerror=null;this.src='/tarkan/assets/images/drivers/default.png';"
                    class="tooltip-driver-photo-large"
                  />
                  <div class="tooltip-driver-info">
                    <div class="tooltip-driver-name">{{ driver.name }}</div>
                    <div class="tooltip-driver-detail">
                      <i class="fas fa-id-card"></i> CNH: {{ driver.attributes?.cnhNumber || 'N/A' }}
                    </div>
                    <div class="tooltip-driver-detail">
                      <i class="fas fa-fingerprint"></i> CPF: {{ driver.attributes?.cpf || 'N/A' }}
                    </div>
                    <div class="tooltip-driver-detail">
                      <i class="fas fa-certificate"></i> Categoría: {{ driver.attributes?.cnhCategory || 'N/A' }}
                    </div>
                    <div class="tooltip-driver-detail">
                      <i class="fas fa-map-marker-alt"></i> Estado: {{ driver.attributes?.state || 'N/A' }}
                    </div>
                    <div class="tooltip-driver-detail" :class="{ 'text-danger': isDriverExpired(driver.attributes?.cnhValidity) }">
                      <i class="fas fa-calendar-alt"></i> 
                      Validez: {{ formatDriverDate(driver.attributes?.cnhValidity) || 'N/A' }}
                      <i v-if="isDriverExpired(driver.attributes?.cnhValidity)" class="fas fa-exclamation-triangle text-danger ms-1"></i>
                    </div>
                    <div class="tooltip-driver-detail" v-if="driver.attributes?.phone">
                      <i class="fas fa-phone"></i> Tel: {{ driver.attributes.phone }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <img 
              :src="`/tarkan/assets/images/drivers/${driver.id}.png?v=${driverImageRefreshKey}`" 
              :alt="driver.name" 
              onerror="this.onerror=null;this.src='/tarkan/assets/images/drivers/default.png';" 
              class="driver-photo-small" />
          </el-tooltip>
        </div>
          
        <!-- Contenedor del nombre y CNH centrados pero alineados entre sí -->
        <div class="driver-info-container">
          <!-- Nombre con fuente más grande -->
          <div 
            class="driver-name-link"
            role="button"
            tabindex="0"
            :aria-label="KT('driver.viewDetails') + ': ' + driver.name"
            @click="handleOpenModal"
            @keydown.enter="handleOpenModal"
            @keydown.space.prevent="handleOpenModal"
            @dblclick="handleOpenModal">
            {{ driver.name }}
          </div>
          
          <!-- CNH alineado con el nombre -->
          <div class="driver-cnh-row">
            <i class="fas fa-id-card driver-cnh-icon"></i>
            <span class="driver-cnh-text">{{ driver.attributes?.cnhNumber || 'N/A' }}</span>
              
              <!-- Icono de estado solo si hay problema -->
              <template v-if="driver.attributes?.cnhValidity">
                <i v-if="getCNHDaysToExpire(driver.attributes.cnhValidity) <= 90 && getCNHDaysToExpire(driver.attributes.cnhValidity) > 30" 
                   class="fas fa-exclamation-circle cnh-icon-warning" 
                   :title="KT('driver.expiresIn') + ' ' + getCNHDaysToExpire(driver.attributes.cnhValidity) + ' ' + KT('days')"></i>
                <i v-else-if="getCNHDaysToExpire(driver.attributes.cnhValidity) <= 30 && getCNHDaysToExpire(driver.attributes.cnhValidity) > 0" 
                   class="fas fa-exclamation-triangle cnh-icon-orange" 
                   :title="KT('driver.expiresIn') + ' ' + getCNHDaysToExpire(driver.attributes.cnhValidity) + ' ' + KT('days')"></i>
                <i v-else-if="getCNHDaysToExpire(driver.attributes.cnhValidity) <= 0" 
                   class="fas fa-times-circle cnh-icon-expired" 
                   :title="KT('driver.expired')"></i>
              </template>
            </div>
        </div>
      </template>
      
      <!-- Fallback: driver não encontrado -->
      <template v-else>
        <el-tooltip 
          :content="KT('device.driver') + ': ' + position.attributes['driverUniqueId']"
          effect="dark"
          placement="right">
          <div class="driver-unknown-id">
            {{ position.attributes['driverUniqueId'] }}
          </div>
        </el-tooltip>
      </template>
    </div>
  </div>
</template>

<script setup>
import KT from '../../tarkan/func/kt.js';

// ========================
// PROPS
// ========================
const props = defineProps({
  position: {
    type: Object,
    default: null
  },
  driver: {
    type: Object,
    default: null
  },
  driverImageRefreshKey: {
    type: Number,
    default: 0
  }
});

// ========================
// EMITS
// ========================
const emit = defineEmits(['open-driver-modal']);

// ========================
// CNH LOGIC
// ========================

/**
 * Formata a data da CNH de DD-MM-YYYY para DD/MM/YYYY
 * @param {string} dateString - Data no formato DD-MM-YYYY
 * @returns {string|null} Data formatada ou null
 */
const formatDriverDate = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  }
  return dateString;
};

/**
 * Verifica se a CNH do motorista está expirada
 * @param {string} dateString - Data no formato DD-MM-YYYY
 * @returns {boolean} True se expirada
 */
const isDriverExpired = (dateString) => {
  if (!dateString) return false;
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    return date < new Date();
  }
  return false;
};

/**
 * Calcula quantos dias faltam para a CNH expirar
 * @param {string} dateString - Data no formato DD-MM-YYYY
 * @returns {number} Dias até expiração (999 se inválido)
 */
const getCNHDaysToExpire = (dateString) => {
  if (!dateString) return 999;
  
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
  return 999;
};

// ========================
// EVENT HANDLERS
// ========================

/**
 * Emite evento para abrir modal do driver
 */
const handleOpenModal = () => {
  if (!props.driver) {
    console.warn('[DeviceDriverCard] Driver não disponível para modal');
    return;
  }
  emit('open-driver-modal', props.driver);
};
</script>

<style scoped>
/* ========================================
   DRIVER CARD STYLES
   ======================================== */

.driver-card-wrapper {
  flex: 1;
  border-right: 1px dotted var(--el-border-color-light);
}

.driver-card {
  margin-top: 10px;
  margin-bottom: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.driver-photo-wrapper {
  margin-bottom: 10px;
}

.driver-photo-small {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  object-fit: cover;
  cursor: help;
}

.driver-info-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.driver-name-link {
  cursor: pointer;
  color: var(--el-color-primary);
  font-weight: 500;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.driver-name-link:hover {
  text-decoration: underline;
}

.driver-cnh-row {
  display: flex;
  align-items: center;
  font-size: 11px;
}

.driver-cnh-icon {
  margin-right: 4px;
  width: 12px;
  color: #666;
}

.driver-cnh-text {
  color: var(--el-text-color-regular);
}

.cnh-icon-warning {
  margin-left: 6px;
  color: #ffcc00;
  font-size: 12px;
}

.cnh-icon-orange {
  margin-left: 6px;
  color: #ffa500;
  font-size: 12px;
}

.cnh-icon-expired {
  margin-left: 6px;
  color: #ff4444;
  font-size: 12px;
}

.driver-unknown-id {
  font-size: 14px;
  color: var(--el-color-primary);
  margin-bottom: 15px;
  text-align: center;
}

/* ========================================
   TOOLTIP DRIVER STYLES
   ======================================== */

:deep(.driver-info-tooltip) {
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  padding: 16px !important;
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
}

.tooltip-driver-card {
  background: transparent;
  color: white;
  font-family: 'Roboto', sans-serif;
}

.tooltip-driver-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.tooltip-driver-photo-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.tooltip-driver-info {
  flex: 1;
  min-width: 0;
}

.tooltip-driver-name {
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: white;
  line-height: 1.2;
}

.tooltip-driver-detail {
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.3;
}

.tooltip-driver-detail i {
  width: 14px;
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}

.tooltip-driver-detail.text-danger {
  color: #ff6b6b !important;
}

.tooltip-driver-detail.text-danger i {
  color: #ff6b6b !important;
}

/* Utility classes */
.stat-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.5px;
}

.mt-20 {
  margin-top: 20px;
}
</style>
