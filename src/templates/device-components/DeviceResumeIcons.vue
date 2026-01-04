<template>
  <div v-if="position" class="icons">
    <!-- Ignition Status -->
    <div 
      v-if="position.attributes.ignition === true" 
      class="icon-status icon-success" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.ignitionOn'))">
      <i class="fas fa-key"></i>
    </div>
    <div 
      v-else-if="position.attributes.ignition === false" 
      class="icon-status icon-danger" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.ignitionOff'))">
      <i class="fas fa-key"></i>
    </div>
    <div 
      v-else 
      class="icon-status icon-info" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('unknown'))">
      <i class="fas fa-key"></i>
    </div>

    <!-- Blocked Status -->
    <div 
      v-if="position.attributes.blocked === true" 
      class="icon-status icon-danger" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.blocked'))">
      <i class="fas fa-lock"></i>
    </div>
    <div 
      v-else-if="position.attributes.blocked === false" 
      class="icon-status icon-success" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.unblocked'))">
      <i class="fas fa-lock-open"></i>
    </div>
    <div 
      v-else 
      class="icon-status icon-info" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('unknown'))">
      <i class="fas fa-lock-open"></i>
    </div>

    <!-- Anchor Status -->
    <template v-if="showAnchor">
      <div 
        v-if="isAnchored" 
        class="icon-status icon-warning" 
        @mouseleave="hideTip" 
        @mouseenter.stop="showTip($event, KT('device.anchorEnabled'))">
        <i class="fas fa-anchor"></i>
      </div>
      <div 
        v-else 
        class="icon-status icon-success" 
        @mouseleave="hideTip" 
        @mouseenter.stop="showTip($event, KT('device.anchorDisabled'))">
        <i class="fas fa-anchor"></i>
      </div>
    </template>

    <!-- RSSI / Network -->
    <div 
      v-if="position.attributes.rssi" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.rssi'))">
      <i class="fas fa-signal icon-1rem"></i>
      <span>
        <template v-if="position.network && position.network.networkType">{{ position.network.networkType }} | </template>
        {{ position.attributes.rssi }}
      </span>
    </div>
    <div 
      v-else-if="position.network && position.network.networkType" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.network'))">
      <i class="fas fa-signal icon-1rem"></i>
      <span>{{ position.network.gsm }}</span>
    </div>

    <!-- Operator -->
    <div 
      v-if="position.attributes.operator" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.operator'))">
      <i class="fas fa-mobile icon-1rem"></i>
      <span>{{ position.attributes.operator }}</span>
    </div>
    <div 
      v-else-if="deviceOperator" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.operator'))">
      <i class="fas fa-mobile icon-1rem"></i>
      <span>{{ deviceOperator }}</span>
    </div>

    <!-- Satellites -->
    <div 
      v-if="position.attributes.sat" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.sattelites'))">
      <i class="fas fa-satellite icon-1rem"></i>
      <span>{{ position.attributes.sat }}</span>
    </div>

    <!-- Power -->
    <div 
      v-if="position.attributes.power || position.attributes.io1 || position.attributes.adc1" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.power'))">
      <i class="fas fa-car-battery icon-1rem"></i>
      <span v-if="position.attributes.power">{{ (parseFloat(position.attributes.power)).toFixed(2) }}v</span>
      <span v-else-if="position.attributes.io1">{{ (parseFloat(position.attributes.io1)).toFixed(2) }}v</span>
      <span v-else-if="position.attributes.adc1">{{ (parseFloat(position.attributes.adc1)).toFixed(2) }}v</span>
    </div>

    <!-- Battery (voltage) -->
    <div 
      v-if="position.attributes.battery || position.attributes.io2" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.battery'))">
      <i class="fas fa-battery-full icon-1rem"></i>
      <span v-if="position.attributes.battery">{{ (parseFloat(position.attributes.battery)).toFixed(2) }}v</span>
      <span v-else-if="position.attributes.io2">{{ (parseFloat(position.attributes.io2)).toFixed(2) }}v</span>
    </div>

    <!-- Temperature -->
    <div 
      v-if="position.attributes.temperature" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.temperature'))">
      <i class="fas fa-thermometer-full icon-1rem"></i>
      <span>{{ position.attributes.temperature }}ºc</span>
    </div>

    <!-- Battery Level -->
    <div 
      v-else-if="position.attributes.batteryLevel" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('device.batteryLevel'))">
      <span v-if="position.attributes.batteryLevel > 80"><i class="fas fa-battery-full icon-1rem icon-success"></i></span>
      <span v-else-if="position.attributes.batteryLevel > 60"><i class="fas fa-battery-three-quarters icon-1rem"></i></span>
      <span v-else-if="position.attributes.batteryLevel > 40"><i class="fas fa-battery-half icon-1rem"></i></span>
      <span v-else-if="position.attributes.batteryLevel > 30"><i class="fas fa-battery-quarter icon-1rem"></i></span>
      <span v-else-if="position.attributes.batteryLevel > 20"><i class="fas fa-battery-empty icon-1rem icon-warning"></i></span>
      <span v-else><i class="fas fa-battery-empty icon-1rem icon-danger"></i></span>
      <span v-if="position.attributes.battery">{{ position.attributes.battery }}v</span>
      <span v-else>{{ position.attributes.batteryLevel }}%</span>
    </div>

    <!-- Alarm -->
    <div 
      v-if="position.attributes.alarm" 
      @mouseleave="hideTip" 
      @mouseenter.stop="showTip($event, KT('alarms.' + position.attributes.alarm))">
      <span><i class="fas fa-exclamation-triangle icon-1rem icon-danger"></i></span>
    </div>

    <!-- Device Status -->
    <div @mouseleave="hideTip" @mouseenter.stop="showTip($event, statusTooltip)">
      <span v-if="device.lastUpdate === null"><i class="fas fa-question-circle icon-1rem icon-info"></i></span>
      <span v-else-if="device.status === 'online'"><i class="fas fa-check-circle icon-1rem icon-success"></i></span>
      <span v-else-if="device.status === 'offline'"><i class="fas fa-exclamation-circle icon-1rem icon-danger"></i></span>
      <span v-else><i class="fas fa-question-circle icon-1rem icon-warning"></i></span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import KT from '../../tarkan/func/kt.js';

const props = defineProps({
  device: {
    type: Object,
    required: true
  },
  position: {
    type: Object,
    default: null
  },
  showAnchor: {
    type: Boolean,
    default: false
  },
  isAnchored: {
    type: Boolean,
    default: false
  }
});

const deviceOperator = computed(() => {
  return props.device?.attributes?.operator || null;
});

const statusTooltip = computed(() => {
  if (props.device.disabled) return KT('disabled');
  if (props.device.lastUpdate === null) return KT('new');
  if (props.device.status === 'online') return KT('online');
  if (props.device.status === 'offline') return KT('offline');
  return KT('unknown');
});

const showTip = (evt, text) => {
  window.$showTip(evt, text);
};

const hideTip = (evt, text) => {
  window.$hideTip(evt, text);
};
</script>

<style scoped>
.icons {
  display: flex;
  justify-content: center;
}

.icons div {
  display: flex;
  justify-content: center;
  flex: 1;
  border-bottom: var(--el-border-color-light) 1px dotted;
  border-right: var(--el-border-color-light) 1px dotted;
  padding: 7px;
  font-size: 11px;
}

.icons div i {
  font-size: 16px;
}

.icons div:last-child {
  border-right: none;
}

.icons div span {
  display: flex;
  padding: 2px;
  padding-left: 5px;
}

.icon-status {
  font-size: 1rem;
}

.icon-1rem {
  font-size: 1rem;
}

.icon-success {
  color: var(--el-color-success);
}

.icon-danger {
  color: var(--el-color-danger);
}

.icon-warning {
  color: var(--el-color-warning);
}

.icon-info {
  color: var(--el-color-info);
}
</style>
