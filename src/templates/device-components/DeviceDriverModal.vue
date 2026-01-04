<template>
  <el-dialog
    :model-value="visible"
    :title="KT('driver.details')"
    width="600px"
    :before-close="handleClose"
    custom-class="driver-modal"
    data-testid="driver-modal"
  >
    <div v-if="driver" class="driver-modal-content">
      <div class="driver-modal-header">
        <div class="driver-large-photo">
          <img 
            :src="`/tarkan/assets/images/drivers/${driver.id}.png?v=${imageRefreshKey}`"
            :alt="driver.name"
            onerror="this.onerror=null;this.src='/tarkan/assets/images/drivers/default.png';"
          />
        </div>
        <div class="driver-main-info">
          <h2 class="driver-name">{{ driver.name }}</h2>
          <div class="driver-status-badge" :class="{ 'expired': isExpired }">
            <i class="fas fa-circle"></i>
            {{ isExpired ? KT('driver.expired') : KT('driver.valid') }}
          </div>
        </div>
      </div>

      <div class="driver-details-grid">
        <!-- License -->
        <div class="detail-card">
          <div class="detail-icon">
            <i class="fas fa-id-card"></i>
          </div>
          <div class="detail-content">
            <span class="detail-label">{{ KT('driver.license') }}</span>
            <span class="detail-value">{{ driver.attributes?.cnhNumber || KT('driver.notInformed') }}</span>
          </div>
        </div>

        <!-- CPF -->
        <div class="detail-card">
          <div class="detail-icon">
            <i class="fas fa-fingerprint"></i>
          </div>
          <div class="detail-content">
            <span class="detail-label">{{ KT('driver.cpf') }}</span>
            <span class="detail-value">{{ driver.attributes?.cpf || KT('driver.notInformed') }}</span>
          </div>
        </div>

        <!-- Expiry Date -->
        <div class="detail-card">
          <div class="detail-icon">
            <i class="fas fa-calendar-alt"></i>
          </div>
          <div class="detail-content">
            <span class="detail-label">{{ KT('driver.expiryDate') }}</span>
            <span class="detail-value" :class="{ 'text-danger': isExpired }">
              {{ formatDate(driver.attributes?.cnhValidity) || KT('driver.notInformed') }}
              <i v-if="isExpired" class="fas fa-exclamation-triangle ms-1"></i>
            </span>
          </div>
        </div>

        <!-- Phone -->
        <div class="detail-card">
          <div class="detail-icon">
            <i class="fas fa-phone"></i>
          </div>
          <div class="detail-content">
            <span class="detail-label">{{ KT('driver.phone') }}</span>
            <span class="detail-value">{{ driver.attributes?.phone || KT('driver.notInformed') }}</span>
          </div>
        </div>

        <!-- Category -->
        <div class="detail-card">
          <div class="detail-icon">
            <i class="fas fa-certificate"></i>
          </div>
          <div class="detail-content">
            <span class="detail-label">{{ KT('driver.cnhCategory') }}</span>
            <span class="detail-value">{{ driver.attributes?.cnhCategory || KT('driver.notInformed') }}</span>
          </div>
        </div>

        <!-- State -->
        <div class="detail-card">
          <div class="detail-icon">
            <i class="fas fa-map-marker-alt"></i>
          </div>
          <div class="detail-content">
            <span class="detail-label">{{ KT('driver.cnhState') }}</span>
            <span class="detail-value">{{ driver.attributes?.state || KT('driver.notInformed') }}</span>
          </div>
        </div>

        <!-- Birth Date -->
        <div class="detail-card">
          <div class="detail-icon">
            <i class="fas fa-birthday-cake"></i>
          </div>
          <div class="detail-content">
            <span class="detail-label">{{ KT('driver.birthDate') }}</span>
            <span class="detail-value">{{ formatDate(driver.attributes?.birthDate) || KT('driver.notInformed') }}</span>
          </div>
        </div>

        <!-- First License Date -->
        <div class="detail-card">
          <div class="detail-icon">
            <i class="fas fa-car"></i>
          </div>
          <div class="detail-content">
            <span class="detail-label">{{ KT('driver.firstLicenseDate') }}</span>
            <span class="detail-value">{{ formatDate(driver.attributes?.firstLicenseDate) || KT('driver.notInformed') }}</span>
          </div>
        </div>

        <!-- Filiation -->
        <div class="detail-card">
          <div class="detail-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="detail-content">
            <span class="detail-label">{{ KT('driver.cnhFiliation') }}</span>
            <span class="detail-value">{{ driver.attributes?.cnhFiliation || KT('driver.notInformed') }}</span>
          </div>
        </div>

        <!-- Observations -->
        <div class="detail-card" v-if="driver.attributes?.cnhObservations">
          <div class="detail-icon">
            <i class="fas fa-sticky-note"></i>
          </div>
          <div class="detail-content">
            <span class="detail-label">{{ KT('driver.cnhObservations') }}</span>
            <span class="detail-value">{{ driver.attributes?.cnhObservations }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="driver-modal-footer">
        <div class="footer-center">
          <el-button 
            type="primary"
            :loading="isGeneratingPDF"
            @click="$emit('generate-pdf')"
          >
            <i class="fas fa-file-pdf"></i>
            {{ isGeneratingPDF ? KT('driver.generating') : KT('driver.generatePDF') }}
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">
            <i class="fas fa-times"></i>
            {{ KT('driver.close') }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { ElDialog, ElButton } from 'element-plus';
import 'element-plus/es/components/dialog/style/css';
import 'element-plus/es/components/button/style/css';
import KT from '../../tarkan/func/kt.js';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  driver: {
    type: Object,
    default: null
  },
  imageRefreshKey: {
    type: [Number, String],
    default: 0
  },
  isGeneratingPDF: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'generate-pdf']);

// Computed
const isExpired = computed(() => {
  if (!props.driver?.attributes?.cnhValidity) return false;
  const expiryDate = new Date(props.driver.attributes.cnhValidity);
  return expiryDate < new Date();
});

// Methods
const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString();
  } catch {
    return null;
  }
};

const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.driver-modal-content {
  padding: 0 10px;
}

.driver-modal-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.driver-large-photo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--el-color-primary);
  flex-shrink: 0;
}

.driver-large-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.driver-main-info {
  flex: 1;
}

.driver-name {
  margin: 0 0 8px;
  font-size: 1.5em;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.driver-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 500;
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.driver-status-badge.expired {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.driver-status-badge i {
  font-size: 0.6em;
}

.driver-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  transition: background-color 0.2s;
}

.detail-card:hover {
  background: var(--el-fill-color);
}

.detail-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: 8px;
  flex-shrink: 0;
}

.detail-content {
  flex: 1;
  min-width: 0;
}

.detail-label {
  display: block;
  font-size: 0.75em;
  color: var(--el-text-color-secondary);
  margin-bottom: 2px;
}

.detail-value {
  display: block;
  font-size: 0.9em;
  font-weight: 500;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.text-danger {
  color: var(--el-color-danger) !important;
}

.driver-modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.footer-right {
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 600px) {
  .driver-details-grid {
    grid-template-columns: 1fr;
  }
  
  .driver-modal-header {
    flex-direction: column;
    text-align: center;
  }
}
</style>
