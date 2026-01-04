<template>
  <div class="attributes-section">
    <!-- Title -->
    <div class="subtitle">
      <i class="fas fa-microchip"></i> {{ KT('device.sensors') }}
    </div>
   
    <!-- Favorites Section -->
    <div 
      v-for="(attr, index) in favorites" 
      :key="'fav-' + index" 
      :class="{ tr1: index % 2, tr2: !(index % 2) }" 
      class="attr-row">
      <div class="attr-name">
        {{ KT('attribute.' + attr.name) }}
      </div>
      <div class="attr-value">
        {{ TT('units.' + attr.name, { value: attr.value }) }}
      </div>
      <div 
        v-if="showComplete && !(attr.type === 'server' && !isAdministrator)" 
        class="favBtn attr-btn" 
        @click="$emit('toggleFavorite', attr.name, false)">
        <i class="fas fa-thumbtack"></i>
      </div>
      <div v-else class="attr-btn-empty"></div>
    </div>
  
    <!-- Complete Attributes Section -->
    <div class="complete" v-show="showComplete">
      <div 
        v-for="(attr, index) in attributes" 
        :key="'attr-' + index" 
        :class="{ tr1: (index + favorites.length) % 2, tr2: !((index + favorites.length) % 2) }" 
        class="attr-row">
        <div class="attr-name">
          {{ KT('attribute.' + attr.name) }}
        </div>
        <div class="attr-value">
          {{ TT('units.' + attr.name, { value: attr.value }) }}
        </div>
        <div class="favBtn attr-btn attr-btn-info" @click="$emit('toggleFavorite', attr.name, true)">
          <i class="fas fa-thumbtack"></i>
        </div>
      </div>
    </div>
  
    <!-- Expand/Collapse Button -->
    <div @click="$emit('toggleComplete')" class="expand-btn">
      <i class="allBtn fas" :class="showComplete ? 'fa-angle-double-up' : 'fa-angle-double-down'"></i>
    </div>
  </div>
</template>

<script setup>
import KT from '../../tarkan/func/kt.js';
import TT from '../../tarkan/func/tt.js';

defineProps({
  favorites: {
    type: Array,
    default: () => []
  },
  attributes: {
    type: Array,
    default: () => []
  },
  showComplete: {
    type: Boolean,
    default: false
  },
  isAdministrator: {
    type: Boolean,
    default: false
  }
});

defineEmits(['toggleFavorite', 'toggleComplete']);
</script>

<style scoped>
.attributes-section {
  width: 100%;
  padding-bottom: 10px;
}

.subtitle {
  padding: 7px 10px;
  border-bottom: 1px solid var(--el-border-color-light);
  text-transform: uppercase;
  font-size: 11px;
  color: var(--el-text-color-regular);
}

.attr-row {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  font-size: 12px;
}

.tr1 {
  background-color: var(--el-fill-color-lighter);
}

.tr2 {
  background-color: transparent;
}

.attr-name {
  flex: 1;
  color: var(--el-text-color-secondary);
  text-transform: capitalize;
}

.attr-value {
  flex: 1;
  text-align: right;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.attr-btn {
  width: 30px;
  text-align: center;
  cursor: pointer;
  color: var(--el-color-primary);
  transition: color 0.2s;
}

.attr-btn:hover {
  color: var(--el-color-primary-dark-2);
}

.attr-btn-info {
  color: var(--el-color-info);
}

.attr-btn-info:hover {
  color: var(--el-color-info-dark-2);
}

.attr-btn-empty {
  width: 30px;
}

.favBtn {
  opacity: 0.6;
}

.favBtn:hover {
  opacity: 1;
}

.complete {
  border-top: var(--el-border-color-light) 1px dashed;
}

.expand-btn {
  display: flex;
  justify-content: center;
  padding: 10px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: color 0.2s;
}

.expand-btn:hover {
  color: var(--el-color-primary);
}

.allBtn {
  font-size: 16px;
}
</style>
