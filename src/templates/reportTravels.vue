<template>
  <report-common @change="onChange($event)"></report-common>

  <div style="display: flex;justify-content: space-between;align-items: center;">
    <!-- Indicador de viagem selecionada -->
    <div v-if="selectedTrip" style="display: flex;align-items: center;gap: 10px;">
      <el-tag type="success" closable @close="clearRoute">
        <i class="fas fa-route"></i> 
        {{getDevice(selectedTrip.deviceId).name}} - 
        {{new Date(selectedTrip.startTime).toLocaleDateString()}}
      </el-tag>
      <span style="color: var(--el-text-color-secondary);font-size: 12px;">
        <i class="fas fa-info-circle"></i> Use os controles no mapa para reproduzir
      </span>
    </div>
    <div v-else></div>

    <!-- Controles -->
    <div style="display: flex;gap: 10px;">
      <el-button type="info" @click="loadResume(true)">{{$t('report.export')}}</el-button>
      <el-button type="primary" @click="loadResume()">{{$t('report.load')}}</el-button>
    </div>
  </div>

  <!-- Contador de viagens -->
  <div v-if="loading===2 && data.length > 0" style="margin-top: 15px;padding: 10px;background: var(--el-fill-color-light);border-radius: 8px;text-align: center;font-weight: 600;color: var(--el-text-color-primary);">
    <i class="fas fa-list"></i> {{data.length}} {{data.length === 1 ? 'viagem encontrada' : 'viagens encontradas'}}
  </div>

  <div style="margin-top: 20px;">

    <div v-if="loading===1" class="reportBlock" style="padding: 10px;">{{$t('LOADING')}}</div>
    <div v-if="loading===2 && data.length===0" class="reportBlock" style="padding: 10px;">{{$t('NO_DATA_TEXT')}}</div>

      <div 
        class="reportBlock" 
        v-for="(b,bk) in data" 
        :key="bk" 
        :class="{ 'reportBlock-selected': selectedTrip && selectedTrip.startTime === b.startTime }"
      >
        <!-- Header com nome do dispositivo e ações -->
        <div style="display: flex;justify-content: space-between;align-items: center;padding: 10px;border-bottom: 1px solid var(--el-border-color-lighter);">
          <div style="color: var(--el-text-color-primary);font-weight: bold;font-size: 16px;">
            {{getDevice(b.deviceId).name}}
          </div>
          <div style="display: flex;gap: 5px;">
            <el-button 
              size="small" 
              circle 
              @click.stop="loadRoute(b)"
              :type="selectedTrip && selectedTrip.startTime === b.startTime ? 'primary' : ''"
            >
              <i class="fas fa-play"></i>
            </el-button>
            <el-button 
              size="small" 
              circle 
              @click.stop="exportSingleTrip(b)"
            >
              <i class="fas fa-download"></i>
            </el-button>
          </div>
        </div>

        <!-- Conteúdo do card -->
        <div @click="loadRoute(b)" style="cursor: pointer;">
        <div style="border-top: var(--el-border-color-light) 1px dotted;display: flex;justify-content: space-between;min-height: 53px;">
          <div style="text-align: right;padding: 10px;font-size: 11px; color: #5b5b5b;position: relative;width: 70px;">
            <div style="position: absolute;width: 20px;height: 20px;font-size: 16px;text-align: center;right: -10px;top: 50%;border-radius: 50%;transform: translateY(-50%)">
              <i class="fas fa-flag"></i>

            </div>
            <div style="position: absolute;right: 15px;top: 50%;border-radius: 50%;transform: translateY(-50%)">
              {{new Date(b.startTime).toLocaleDateString()}}<br>
              {{new Date(b.startTime).toLocaleTimeString()}}
            </div>
          </div>
          <div style="padding: 10px;font-size: 14px;flex: 1;">
            <template v-if="b.startAddress">
              {{b.startAddress}}
            </template>
            <template v-else>
              {{b.startLat}}, {{b.startLon}}
            </template>
          </div>
        </div>

        <div style="border-top: var(--el-border-color-light) 1px dotted;display: flex;justify-content: space-between;">

          <div style="flex: 1;text-align: center;border-right: var(--el-border-color-light) 1px dotted;">
            <div style="text-transform: uppercase;margin-top: 10px;font-size: 11px;color: var(--el-text-color-regular);">{{$t('device.startOdometer')}}</div>
            <div style="margin-top: 5px;margin-bottom: 10px;font-size: 20px;color: var(--el-color-primary)">{{$t('units.'+store.getters['server/getAttribute']('distanceUnit','distanceUnit'),{distance: b.startOdometer})}}</div>
          </div>
          <div style="flex: 1;text-align: center;">
            <div style="text-transform: uppercase;margin-top: 10px;font-size: 11px;color: var(--el-text-color-regular);">{{$t('device.endOdometer')}}</div>
            <div style="margin-top: 5px;margin-bottom: 10px;font-size: 20px;color: var(--el-color-primary)">{{$t('units.'+store.getters['server/getAttribute']('distanceUnit','distanceUnit'),{distance: b.endOdometer})}}</div>
          </div>
        </div>


        <div style="border-top: var(--el-border-color-light) 1px dotted;display: flex;justify-content: space-between;">
          <div style="flex: 1;text-align: center;border-right: var(--el-border-color-light) 1px dotted;">
            <div style="text-transform: uppercase;margin-top: 10px;font-size: 11px;color: var(--el-text-color-regular);">{{$t('device.averageSpeed')}}</div>
            <div style="margin-top: 5px;margin-bottom: 10px;font-size: 20px;color: var(--el-color-primary)">
              <span v-if="getAverageSpeed(b) > 0">{{$t('units.'+store.getters['server/getAttribute']('speedUnit','speedUnit'),{speed: getAverageSpeed(b)})}}</span>
              <span v-else style="color: var(--el-text-color-secondary)">N/A</span>
            </div>
          </div>
          <div style="flex: 1;text-align: center;border-right: var(--el-border-color-light) 1px dotted;">
            <div style="text-transform: uppercase;margin-top: 10px;font-size: 11px;color: var(--el-text-color-regular);">{{$t('device.maxSpeed')}}</div>
            <div style="margin-top: 5px;margin-bottom: 10px;font-size: 20px;color: var(--el-color-primary)">
              <span v-if="b.maxSpeed">{{$t('units.'+store.getters['server/getAttribute']('speedUnit','speedUnit'),{speed: b.maxSpeed})}}</span>
              <span v-else style="color: var(--el-text-color-secondary)">N/A</span>
            </div>
          </div>
        </div>


        <div style="border-top: var(--el-border-color-light) 1px dotted;display: flex;justify-content: space-between;">
          <div style="flex: 1;text-align: center;border-right: var(--el-border-color-light) 1px dotted;">
            <div style="text-transform: uppercase;margin-top: 10px;font-size: 11px;color: var(--el-text-color-regular);">{{$t('device.duration')}}</div>
            <div style="margin-top: 5px;margin-bottom: 10px;font-size: 20px;color: var(--el-color-primary)">{{formatDurationHhMm(b.duration)}}</div>
          </div>
          <div style="flex: 1;text-align: center;border-right: var(--el-border-color-light) 1px dotted;">
            <div style="text-transform: uppercase;margin-top: 10px;font-size: 11px;color: var(--el-text-color-regular);">{{$t('device.distance')}}</div>
            <div style="margin-top: 5px;margin-bottom: 10px;font-size: 20px;color: var(--el-color-primary)">{{$t('units.'+store.getters['server/getAttribute']('distanceUnit','distanceUnit'),{distance: getDistance(b)})}}</div>
          </div>
          <div style="flex: 1;text-align: center;border-right: var(--el-border-color-light) 1px dotted;">
            <div style="text-transform: uppercase;margin-top: 10px;font-size: 11px;color: var(--el-text-color-regular);">{{$t('device.spentFuel')}}</div>
            <div style="margin-top: 5px;margin-bottom: 10px;font-size: 20px;color: var(--el-color-primary)">
              <span v-if="getSpentFuel(b, getDevice(b.deviceId)) > 0">{{getSpentFuel(b, getDevice(b.deviceId)).toFixed(2)}} L</span>
              <span v-else style="color: var(--el-text-color-secondary)">0.00 L</span>
            </div>
          </div>
        </div>

        <div style="border-top: var(--el-border-color-light) 1px dotted;display: flex;justify-content: space-between;">
          <div style="text-align: right;padding: 10px;font-size: 11px; color: #5b5b5b;position: relative;width: 70px;">
            <div style="position: absolute;width: 20px;height: 20px;font-size: 16px;text-align: center;right: -10px;top: 50%;border-radius: 50%;transform: translateY(-50%)">
              <i class="fas fa-flag-checkered"></i>
            </div>
            <div style="position: absolute;right: 15px;top: 50%;border-radius: 50%;transform: translateY(-50%)">
              {{new Date(b.endTime).toLocaleDateString()}}<br>
              {{new Date(b.endTime).toLocaleTimeString()}}
            </div>
          </div>
          <div style="padding: 10px;font-size: 14px;flex: 1;">

            <template v-if="b.endAddress">
              {{b.endAddress}}
            </template>
            <template v-else>
              {{b.endLat}}, {{b.endLon}}
            </template>

          </div>
        </div>
        </div> <!-- Fim do conteúdo clicável -->
      </div>

  </div>
</template>

<script setup>
/* eslint-disable no-restricted-properties */
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/tooltip/style/css'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/date-picker/style/css'
import 'element-plus/es/components/switch/style/css'
import 'element-plus/es/components/tag/style/css'

import {ElButton,ElTag} from "element-plus";

import {inject, ref, onBeforeUnmount} from 'vue';
import {useStore} from 'vuex';
import {saveAs} from "file-saver";
import ReportCommon from "./reportCommon.vue";

const loading = ref(0);
const selectedTrip = ref(null);
const data = ref([]);
const filter = ref({});

const store = useStore();

const updateRoute = inject('updateRoute');
const flyToDevice = inject('flyToDevice', null);
const resetPlay = inject('resetPlayRoute', null);

// Função helper para buscar device
const getDevice = (deviceId) => {
  return store.getters['devices/getDevice'](deviceId);
};

// Calcular distância total (se não vier do backend)
const getDistance = (report) => {
  if (report.distance) {
    return report.distance;
  }
  // Calcular pela diferença do odômetro
  if (report.endOdometer && report.startOdometer) {
    return report.endOdometer - report.startOdometer;
  }
  return 0;
};

// Calcular velocidade média (se não vier do backend)
const getAverageSpeed = (report) => {
  if (report.averageSpeed) {
    return report.averageSpeed;
  }
  // Calcular baseado em distância e duração
  const distance = getDistance(report);
  if (distance && report.duration && report.duration > 0) {
    // Converter: metros/milissegundos para km/h
    return (distance / report.duration) * 3600;
  }
  return 0;
};

// Função para calcular combustível gasto (estimado ou real)
const getSpentFuel = (report, device) => {
  // Se o backend já retornou o spentFuel, usar ele
  if (report.spentFuel && report.spentFuel > 0) {
    return report.spentFuel;
  }
  
  // Estimar baseado na distância e consumo médio
  const distance = getDistance(report);
  if (distance > 0) {
    const distanceKm = distance / 1000;
    
    // Usar consumo configurado ou padrão de 10 L/100km
    let consumption = 10;
    if (device?.attributes?.litersx100km) {
      consumption = parseFloat(device.attributes.litersx100km);
    }
    
    const estimatedFuel = (distanceKm / 100) * consumption;
    return estimatedFuel;
  }
  
  return 0;
};

// Formatar duração em hh:mm
const formatDurationHhMm = (ms) => {
  if (!ms) return '00:00';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const onChange = (e)=>{
  filter.value = e;
}


const hideDevices = (deviceId=0)=>{
  store.dispatch("devices/setDeviceFilter",deviceId);
}

/*
const resetDevices = ()=>{
  store.dispatch("devices/setDeviceFilter",0);
}*/

/*
onBeforeUnmount(()=>{
  resetDevices();
  updateRoute([]);
})*/

const loadRoute = (b)=>{
  const $traccar = window.$traccar;
  loading.value = 1;
  selectedTrip.value = b; // Marcar viagem selecionada

  $traccar.loadRoute(b.deviceId,b.startTime,b.endTime).then(({data})=>{
    // Formato para updateRoute (mapa) - array de coordenadas
    let tmp = [];
    data.forEach((p)=>{
      tmp.push([p.latitude,p.longitude,p.id,p.course]);
    });

    hideDevices(b.deviceId);
    
    // Atualizar rota no mapa (isso ativa automaticamente os controles de playback)
    updateRoute(tmp);
    
    loading.value = false;
    
    // Centralizar mapa no primeiro ponto
    if (flyToDevice && data.length > 0) {
      flyToDevice([data[0].latitude, data[0].longitude]);
    }
  })
}

// Exportar viagem específica
const exportSingleTrip = (trip) => {
  const $traccar = window.$traccar;
  
  // Converter datas para ISO string
  const fromDate = new Date(trip.startTime).toISOString();
  const toDate = new Date(trip.endTime).toISOString();
  
  // Usar a mesma API de export mas para uma viagem só
  $traccar.getReportTravels(trip.deviceId, [], fromDate, toDate, true).then((r) => {
    if(r['headers']['content-type']==='application/pdf'){
      const deviceName = getDevice(trip.deviceId).name;
      const date = new Date(trip.startTime).toLocaleDateString().replace(/\//g, '-');
      saveAs(new Blob([r.data], {type: 'application/pdf'}), `viagem_${deviceName}_${date}.pdf`);
    } else {
      const deviceName = getDevice(trip.deviceId).name;
      const date = new Date(trip.startTime).toLocaleDateString().replace(/\//g, '-');
      saveAs(new Blob([r.data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), `viagem_${deviceName}_${date}.xlsx`);
    }
  }).catch((error) => {
    console.error('Erro ao exportar viagem:', error);
  });
};

// Limpar rota selecionada
const clearRoute = () => {
  selectedTrip.value = null;
  updateRoute([]);
  
  // Reset playback se existir
  if (resetPlay) {
    resetPlay();
  }
  
  loading.value = 0;
};

// Limpar ao sair
onBeforeUnmount(() => {
  clearRoute();
});

const loadResume = (e=false)=>{
  const $traccar = window.$traccar;
  loading.value = 1;

  console.log('DEBUG loadResume - filter.value:', filter.value);
  console.log('DEBUG loadResume - date[0]:', filter.value.date[0]);
  console.log('DEBUG loadResume - date[1]:', filter.value.date[1]);
  console.log('DEBUG loadResume - deviceId:', filter.value.deviceId);
  console.log('DEBUG loadResume - groupId:', filter.value.groupId);
  
  const fromDate = new Date(filter.value.date[0]).toISOString();
  const toDate = new Date(filter.value.date[1]).toISOString();
  
  console.log('DEBUG loadResume - Chamando API com:', {
    deviceId: filter.value.deviceId,
    groupId: filter.value.groupId,
    fromDate,
    toDate,
    export: e
  });

  $traccar.getReportTravels(filter.value.deviceId, filter.value.groupId, fromDate, toDate, e).then((r)=>{
  
  if(e){

      loading.value = 0;

      if(r['headers']['content-type']==='application/pdf'){
        saveAs(new Blob([r.data], {type: 'application/pdf'}), 'viagens.pdf');

      }else {
        saveAs(new Blob([r.data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), 'viagens.xlsx');
      }
    }else {
      loading.value = 2;

      console.log('DEBUG reportTravels - Dados recebidos:', r.data);
      console.log('DEBUG reportTravels - Headers:', r.headers);
      console.log('DEBUG reportTravels - Status:', r.status);
      if (r.data && r.data.length > 0) {
        console.log('DEBUG reportTravels - Primeira viagem:', {
          deviceId: r.data[0].deviceId,
          distance: r.data[0].distance,
          startOdometer: r.data[0].startOdometer,
          endOdometer: r.data[0].endOdometer,
          spentFuel: r.data[0].spentFuel
        });
      }
      data.value = r.data;
    }
  }).catch(error => {
    console.error('❌ ERROR reportTravels - Erro na chamada:', error);
    console.error('❌ ERROR reportTravels - Response:', error.response);
    loading.value = 0;
  });
}

</script>


<style scoped>
.reportBlock{
  border: var(--el-border-color-light) 1px solid;
  border-radius: 10px;
  text-align: center;
  margin-top: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reportBlock:hover{
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.reportBlock-selected {
  border: 2px solid var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
}
</style>