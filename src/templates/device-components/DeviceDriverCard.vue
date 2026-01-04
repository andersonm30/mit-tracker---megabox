<template>
  <div class="driver-section">
    <div class="stat-label mt-20">
      <i class="far fa-id-card"></i> {{ KT('device.driver') }}
    </div>

    <div class="driver-card">
      <template v-if="driver">
        <!-- Photo with tooltip -->
        <div class="driver-photo-wrapper">
          <el-tooltip effect="dark" placement="right" popper-class="driver-info-tooltip">
            <template #content>
              <div class="tooltip-driver-card">
                <div class="tooltip-driver-header">
                  <img 
                    :src="driverPhotoUrl"
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
                    <div class="tooltip-driver-detail" :class="{ 'text-danger': isCnhExpired }">
                      <i class="fas fa-calendar-alt"></i> 
                      Validez: {{ formattedCnhValidity }}
                      <i v-if="isCnhExpired" class="fas fa-exclamation-triangle text-danger ms-1"></i>
                    </div>
                    <div class="tooltip-driver-detail" v-if="driver.attributes?.phone">
                      <i class="fas fa-phone"></i> Tel: {{ driver.attributes.phone }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <img 
              :src="driverPhotoUrl" 
              :alt="driver.name" 
              onerror="this.onerror=null;this.src='/tarkan/assets/images/drivers/default.png';" 
              class="driver-photo-small" />
          </el-tooltip>
        </div>
          
        <!-- Name and CNH container -->
        <div class="driver-info-container">
          <!-- Name with larger font -->
          <div 
            class="driver-name-link"
            @click="$emit('openDriverModal')"
            @dblclick="$emit('openDriverModal')"
            @mouseleave="hideTip" 
            @mouseenter.stop="showTip($event, driver.name + ' - Click para ver detalles')">
            {{ driver.name }}
          </div>
          
          <!-- CNH aligned with name -->
          <div class="driver-cnh-row">
            <i class="fas fa-id-card driver-cnh-icon"></i>
            <span class="driver-cnh-text">{{ driver.attributes?.cnhNumber || 'N/A' }}</span>
              
            <!-- Status icon only if there's an issue -->
            <template v-if="driver.attributes?.cnhValidity">
              <i v-if="cnhDaysToExpire <= 90 && cnhDaysToExpire > 30" 
                 class="fas fa-exclamation-circle cnh-icon-warning" 
                 :title="'CNH vence en ' + cnhDaysToExpire + ' días'"></i>
              <i v-else-if="cnhDaysToExpire <= 30 && cnhDaysToExpire > 0" 
                 class="fas fa-exclamation-triangle cnh-icon-orange" 
                 :title="'CNH vence en ' + cnhDaysToExpire + ' días'"></i>
              <i v-else-if="cnhDaysToExpire <= 0" 
                 class="fas fa-times-circle cnh-icon-expired" 
                 title="CNH vencida"></i>
            </template>
          </div>
        </div>
      </template>

      <!-- Unknown driver -->
      <template v-else-if="driverUniqueId">
        <el-tooltip 
          :content="'Conductor: ' + driverUniqueId"
          effect="dark"
          placement="right">
          <div class="driver-unknown-id">
            {{ driverUniqueId }}
          </div>
        </el-tooltip>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ElTooltip } from 'element-plus';
import KT from '../../tarkan/func/kt.js';

const props = defineProps({
  driver: {
    type: Object,
    default: null
  },
  driverUniqueId: {
    type: String,
    default: null
  },
  driverImageRefreshKey: {
    type: [String, Number],
    default: ''
  }
});

defineEmits(['openDriverModal']);

const driverPhotoUrl = computed(() => {
  if (!props.driver) return '/tarkan/assets/images/drivers/default.png';
  return `/tarkan/assets/images/drivers/${props.driver.id}.png?v=${props.driverImageRefreshKey}`;
});

const cnhDaysToExpire = computed(() => {
  if (!props.driver?.attributes?.cnhValidity) return null;
  const validity = new Date(props.driver.attributes.cnhValidity);
  const today = new Date();
  const diffTime = validity.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const isCnhExpired = computed(() => {
  return cnhDaysToExpire.value !== null && cnhDaysToExpire.value <= 0;
});

const formattedCnhValidity = computed(() => {
  if (!props.driver?.attributes?.cnhValidity) return 'N/A';
  return new Date(props.driver.attributes.cnhValidity).toLocaleDateString();
});

const showTip = (evt, text) => {
  window.$showTip(evt, text);
};

const hideTip = (evt, text) => {
  window.$hideTip(evt, text);
};
</script>

<style scoped>
.driver-section {
  flex: 1;
}

.stat-label {
  text-transform: uppercase;
  font-size: 11px;
  color: var(--el-text-color-regular);
}

.mt-20 {
  margin-top: 20px;
}

.driver-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
}

.driver-photo-wrapper {
  margin-bottom: 10px;
}

.driver-photo-small {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--el-border-color-light);
}

.tooltip-driver-card {
  padding: 10px;
}

.tooltip-driver-header {
  display: flex;
  gap: 15px;
}

.tooltip-driver-photo-large {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

.tooltip-driver-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tooltip-driver-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
}

.tooltip-driver-detail {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.driver-info-container {
  text-align: center;
}

.driver-name-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-color-primary);
  cursor: pointer;
  margin-bottom: 5px;
}

.driver-name-link:hover {
  text-decoration: underline;
}

.driver-cnh-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.driver-cnh-icon {
  font-size: 12px;
}

.driver-cnh-text {
  font-size: 12px;
}

.cnh-icon-warning {
  color: var(--el-color-warning);
}

.cnh-icon-orange {
  color: #ff9800;
}

.cnh-icon-expired {
  color: var(--el-color-danger);
}

.driver-unknown-id {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  padding: 10px;
  text-align: center;
}

.text-danger {
  color: var(--el-color-danger) !important;
}

.ms-1 {
  margin-left: 4px;
}
</style>
