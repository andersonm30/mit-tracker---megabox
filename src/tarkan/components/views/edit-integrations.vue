<template>
  <edit-integrations-configure ref="configurator"></edit-integrations-configure>
  <el-dialog :lock-scroll="true" v-model="show">
    <template v-slot:title>
      <div style="border-bottom: #e0e0e0 1px solid;padding: 20px;">
        <div class="modal-title">{{title}}</div>
      </div>
    </template>
    
    <div style="display: flex;">
      <div v-for="integration in safeIntegrations" style="border: silver 1px solid;margin: 10px; border-radius: 5px;width: 25%;" :key="integration.key">
        <div style="padding: 20px;text-align: center;">{{KT('integrations.'+integration.key+'.title',integration.title)}}</div>
        <div style="display: flex;justify-content: space-between;align-items: center;border-top: silver 1px dotted;">
          <el-switch :value="getIntegrationStatus(integration)" @change="toggleState($event,integration)" style="margin: 10px;"></el-switch>
          <el-button @click="configure(integration)" size="small" type="primary" style="margin: 10px;">{{KT('integrations.configure')}}</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/switch/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/tab-pane/style/css'
import 'element-plus/es/components/tabs/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/checkbox/style/css'

import {ref, defineExpose, onMounted, computed} from 'vue';

const configurator = ref(null);

import {
  ElDialog,
  ElButton,
  ElSwitch
} from "element-plus";

import {useStore} from 'vuex'
const store = useStore();

const toggleState = (event, integration) => {
  if (!integration.settings || integration.settings === false) {
    configure(integration);
  } else {
    console.log("toggleState");
  }
}

const configure = (integration) => {
  configurator.value.configureIntegration(integration);
}

// Función para obtener el estado de la integración de forma segura
const getIntegrationStatus = (integration) => {
  if (!integration || !integration.settings || integration.settings === false) {
    return false;
  }
  return integration.settings.enabled === true;
}

// Computed property para asegurar que las integraciones estén disponibles
const availableIntegrations = computed(() => {
  try {
    const integrations = store.state.integrations?.integrationsList;
    return Array.isArray(integrations) ? integrations : [];
  } catch (error) {
    console.warn('Error accessing integrations:', error);
    return [];
  }
});

// Computed property para filtrar integraciones válidas
const safeIntegrations = computed(() => {
  try {
    const integrations = availableIntegrations.value;
    if (!Array.isArray(integrations)) {
      return [];
    }
    return integrations.filter(integration => 
      integration && 
      typeof integration === 'object' && 
      integration.key
    );
  } catch (error) {
    console.warn('Error filtering integrations:', error);
    return [];
  }
});

onMounted(() => {
  store.dispatch("integrations/load");
})

const title = ref('');
const show = ref(false);
const tab = ref('first');

import KT from '../../func/kt';
import EditIntegrationsConfigure from "@/tarkan/components/views/edit-integrations-configure.vue";

const showIntegrations = () => {
  title.value = KT('integrations.title');
  tab.value = 'first';
  show.value = true;
}

defineExpose({
  showIntegrations
});
</script>

<style>
.el-select.el-select--large {
  width: 100%;
}

.el-dialog__header, .el-dialog__body, .el-dialog__footer {
  padding: 0px !important;
}

.el-dialog__footer {
  margin-top: 20px;
}

.el-tabs__nav-wrap {
  padding-left: 20px;
  padding-right: 20px;
}

.el-tabs__content {
  padding-left: 20px;
  padding-right: 20px;
}
</style>