<template>
  <!-- 
    PointAttributes.vue
    Componente para exibir badges de atributos de um ponto da timeline:
    - Ignição (ignition)
    - Bloqueio (blocked)
    - Movimento (motion)
    - Energia (power)
    
    Props:
    - attributes: Object - objeto de atributos do ponto (p.attributes)
  -->
  <div v-if="hasAnyAttribute" class="timeline-attributes">
    <!-- Ignição -->
    <span 
      v-if="attributes.ignition !== undefined" 
      class="attr-badge" 
      :class="attributes.ignition ? 'attr-success' : 'attr-danger'"
      :title="ignitionTitle"
    >
      <i class="fas fa-key"></i>
    </span>
    
    <!-- Bloqueio -->
    <span 
      v-if="attributes.blocked !== undefined" 
      class="attr-badge" 
      :class="attributes.blocked ? 'attr-danger' : 'attr-success'"
      :title="blockedTitle"
    >
      <i :class="attributes.blocked ? 'fas fa-lock' : 'fas fa-unlock'"></i>
    </span>
    
    <!-- Movimento -->
    <span 
      v-if="attributes.motion !== undefined" 
      class="attr-badge" 
      :class="attributes.motion ? 'attr-success' : 'attr-warning'"
      :title="motionTitle"
    >
      <i :class="attributes.motion ? 'fas fa-car' : 'fas fa-parking'"></i>
    </span>
    
    <!-- Energia/Tensão -->
    <span 
      v-if="attributes.power !== undefined" 
      class="attr-badge attr-info"
      :title="powerTitle"
    >
      <i class="fas fa-car-battery"></i>
      <span class="attr-value">{{ formattedPower }}V</span>
    </span>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue';

const props = defineProps({
  attributes: {
    type: Object,
    default: () => ({})
  }
});

// Acesso ao $t via proxy (compatível com legacy mode do vue3-i18n)
const { proxy } = getCurrentInstance();
const t = (key, fallback = '') => proxy.$t?.(key) || fallback;

// Computed: verifica se há algum atributo para exibir
const hasAnyAttribute = computed(() => {
  const attrs = props.attributes;
  if (!attrs) return false;
  return (
    attrs.ignition !== undefined ||
    attrs.blocked !== undefined ||
    attrs.motion !== undefined ||
    attrs.power !== undefined
  );
});

// Computed: tensão formatada
const formattedPower = computed(() => {
  const power = props.attributes?.power;
  return power !== undefined ? parseFloat(power).toFixed(1) : '0.0';
});

// Computed: títulos para tooltips (i18n)
const ignitionTitle = computed(() => {
  const value = props.attributes?.ignition;
  const yesNo = value ? t('yes') : t('no');
  return `${t('device.ignition', 'Ignição')}: ${yesNo}`;
});

const blockedTitle = computed(() => {
  const value = props.attributes?.blocked;
  const yesNo = value ? t('yes') : t('no');
  return `${t('device.blocked', 'Bloqueio')}: ${yesNo}`;
});

const motionTitle = computed(() => {
  const value = props.attributes?.motion;
  const yesNo = value ? t('yes') : t('no');
  return `${t('device.motion', 'Movimento')}: ${yesNo}`;
});

const powerTitle = computed(() => {
  return `${t('device.power', 'Tensão')}: ${formattedPower.value}V`;
});
</script>

<style scoped>
.timeline-attributes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.attr-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  transition: transform 0.2s;
}

.attr-badge:hover {
  transform: scale(1.05);
}

.attr-badge i {
  font-size: 10px;
}

.attr-value {
  font-size: 10px;
}

.attr-success {
  background-color: var(--el-color-success-light-8);
  color: var(--el-color-success-dark-2);
}

.attr-danger {
  background-color: var(--el-color-danger-light-8);
  color: var(--el-color-danger-dark-2);
}

.attr-warning {
  background-color: var(--el-color-warning-light-8);
  color: var(--el-color-warning-dark-2);
}

.attr-info {
  background-color: var(--el-color-info-light-8);
  color: var(--el-color-info-dark-2);
}
</style>
