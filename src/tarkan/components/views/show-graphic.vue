<template>
  <el-dialog :lock-scroll="true" :top="'50px'" :width="'70%'" v-model="show" title="Teste">

    <template v-slot:title>
      <div  style="border-bottom: #e0e0e0 1px solid;padding: 20px;">
        <div class="modal-title" style="display: flex;width: calc(100% - 50px);justify-content: space-between;">
            <div>{{ KT('report.graphic') || 'Gráfico' }}</div>
            <div>
              <el-select v-model="formData.type" filterable multiple :size="'large'"  :placeholder="KT('graph.graphicType')" :no-match-text="KT('NO_MATCH_TEXT')" :no-data-text="KT('NO_DATA_TEXT')">
                <el-option
                    v-for="item in graphicType"
                    :key="item"
                    :label="KT('graphs.'+item)"
                    :value="item"
                >
                </el-option>
              </el-select>
            </div>
        </div>
      </div>
    </template>

    <!-- KPIs de Velocidade -->
    <div v-if="speedKpis.maxSpeed > 0" class="speed-kpis">
      <div class="kpi-box">
        <div class="kpi-icon"><i class="fas fa-tachometer-alt"></i></div>
        <div class="kpi-content">
          <div class="kpi-value">{{ speedKpis.maxSpeed }} km/h</div>
          <div class="kpi-label">{{ KT('report.maxSpeed') || 'Velocidade Máxima' }}</div>
        </div>
      </div>
      <div class="kpi-box">
        <div class="kpi-icon kpi-icon-success"><i class="fas fa-gauge"></i></div>
        <div class="kpi-content">
          <div class="kpi-value">{{ speedKpis.avgSpeed }} km/h</div>
          <div class="kpi-label">{{ KT('report.avgSpeedMoving') || 'Velocidade Média (em movimento)' }}</div>
        </div>
      </div>
      <div class="kpi-box">
        <div class="kpi-icon kpi-icon-warning"><i class="fas fa-car-side"></i></div>
        <div class="kpi-content">
          <div class="kpi-value">{{ speedKpis.movingTime }}</div>
          <div class="kpi-label">{{ KT('report.movingTime') || 'Tempo em Movimento' }}</div>
        </div>
      </div>
      <div class="kpi-box">
        <div class="kpi-icon kpi-icon-danger"><i class="fas fa-parking"></i></div>
        <div class="kpi-content">
          <div class="kpi-value">{{ speedKpis.stoppedTime }}</div>
          <div class="kpi-label">{{ KT('report.stoppedTime') || 'Tempo Parado' }}</div>
        </div>
      </div>
    </div>

    <div style="margin: 20px;height: calc(65vh);">
      <LineChart style="height: 100%;" :chartData="testData"></LineChart>
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

import {ElDialog,ElSelect,ElOption} from "element-plus";

import {ref,defineExpose,computed,inject} from 'vue';

// Função de tradução (injetada ou fallback)
const KT = inject('KT', (key) => key);

const show = ref(false);

const data = ref([]);
const formData = ref({type: ['speed']});

const graphicType = computed(()=>{
    if(data.value.length>0) {

      let tmp = Object.keys(data.value[0]);

      Object.keys(data.value[0].attributes).forEach((t)=>{
        tmp.push('attributes.'+t);
      });

      return tmp;
    }else{
      return [];
    }
});



import { LineChart } from 'vue-chart-3';
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

// ============================================================================
// OTIMIZAÇÃO DE GRÁFICO: Agregação de dados para melhor visualização
// ============================================================================

/**
 * Agrega dados em buckets de tempo para reduzir poluição visual
 * @param {Array} points - Array de pontos de rota
 * @param {number} bucketSeconds - Tamanho do bucket em segundos
 * @returns {Array} Pontos agregados
 */
const aggregateDataByTime = (points, bucketSeconds = 60) => {
  if (!points || points.length === 0) return [];
  
  // Ordenar por tempo
  const sorted = [...points].sort((a, b) => 
    new Date(a.deviceTime) - new Date(b.deviceTime)
  );
  
  const result = [];
  let currentBucket = [];
  let bucketStartTime = null;
  
  sorted.forEach((point) => {
    const pointTime = new Date(point.deviceTime).getTime();
    
    if (!bucketStartTime) {
      bucketStartTime = pointTime;
      currentBucket = [point];
    } else if (pointTime - bucketStartTime < bucketSeconds * 1000) {
      currentBucket.push(point);
    } else {
      // Finalizar bucket atual e iniciar novo
      if (currentBucket.length > 0) {
        result.push(aggregateBucket(currentBucket));
      }
      bucketStartTime = pointTime;
      currentBucket = [point];
    }
  });
  
  // Último bucket
  if (currentBucket.length > 0) {
    result.push(aggregateBucket(currentBucket));
  }
  
  return result;
};

/**
 * Agrega pontos de um bucket usando max para velocidade
 */
const aggregateBucket = (bucket) => {
  if (bucket.length === 1) return bucket[0];
  
  // Usar o ponto do meio para timestamp, mas max para velocidade
  const midIndex = Math.floor(bucket.length / 2);
  const basePoint = { ...bucket[midIndex] };
  
  // Max velocidade do bucket
  basePoint.speed = Math.max(...bucket.map(p => parseFloat(p.speed) || 0));
  
  // Max de outros atributos numéricos interessantes
  if (basePoint.attributes) {
    const attrs = bucket.map(p => p.attributes || {});
    ['speed', 'odometer', 'fuel', 'power'].forEach(key => {
      const values = attrs.map(a => parseFloat(a[key]) || 0).filter(v => !isNaN(v));
      if (values.length > 0) {
        basePoint.attributes[key] = Math.max(...values);
      }
    });
  }
  
  return basePoint;
};

/**
 * Gera labels espaçados para o eixo X
 */
const generateSpacedLabels = (labels, maxLabels = 10) => {
  if (labels.length <= maxLabels) return labels;
  
  const step = Math.ceil(labels.length / maxLabels);
  return labels.map((label, i) => i % step === 0 ? label : '');
};

const testData = computed(()=>{

  let labels = [];
  let sets = [];
  let tmpSets = {};

  console.log('[show-graphic] Tipo selecionado:', formData.value.type);
  console.log('[show-graphic] Total de pontos recebidos:', data.value.length);

  // OTIMIZAÇÃO: Agregar dados para melhor visualização
  // Bucket de 60s para rotas longas, bucket menor para rotas curtas
  const bucketSize = data.value.length > 500 ? 120 : (data.value.length > 100 ? 60 : 30);
  const aggregatedData = data.value.length > 50 
    ? aggregateDataByTime(data.value, bucketSize)
    : data.value;
  
  console.log('[show-graphic] Pontos após agregação:', aggregatedData.length, `(bucket: ${bucketSize}s)`);

  aggregatedData.forEach((d)=>{
      labels.push(new Date(d.deviceTime).toLocaleString());

      formData.value.type.forEach((t)=>{

          if(!tmpSets[t]){
            tmpSets[t] = [];
          }

          // Suporte para atributos aninhados (ex: attributes.fuel)
          let value;
          if (t.startsWith('attributes.')) {
            const attrKey = t.replace('attributes.', '');
            value = parseFloat(d.attributes?.[attrKey]);
          } else {
            value = parseFloat(d[t]);
          }
          
          tmpSets[t].push(isNaN(value) ? 0 : value);

      })
  })

  // OTIMIZAÇÃO: Limitar labels do eixo X para evitar sobreposição
  const spacedLabels = generateSpacedLabels(labels, 10);

  formData.value.type.forEach((t)=>{

    const color = Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

    const colorAlpha = 'rgba('+parseInt(color.substring(0,2),16)+','+parseInt(color.substring(2,4),16)+','+parseInt(color.substring(4,6),16)+',0.4)';

    sets.push({
      label: t,
      data: tmpSets[t],
      borderColor: '#'+color,
      backgroundColor: colorAlpha,
      tension: 0.1, // Linha mais suave
      pointRadius: aggregatedData.length > 100 ? 0 : 2, // Esconder pontos se muitos dados
    });
  })


  return {
            labels: spacedLabels,
            datasets: sets
          }
});

// ============================================================================
// KPIs de Velocidade
// ============================================================================
const speedKpis = computed(() => {
  if (!data.value || data.value.length === 0) {
    return { maxSpeed: 0, avgSpeed: 0, movingTime: '0h 0m', stoppedTime: '0h 0m' };
  }

  const speeds = data.value.map(d => parseFloat(d.speed) || 0);
  const maxSpeed = Math.round(Math.max(...speeds));
  
  // Velocidade média apenas quando em movimento (speed > 1 km/h)
  const movingSpeeds = speeds.filter(s => s > 1);
  const avgSpeed = movingSpeeds.length > 0 
    ? Math.round(movingSpeeds.reduce((a, b) => a + b, 0) / movingSpeeds.length)
    : 0;
  
  // Calcular tempo em movimento vs parado
  let movingMs = 0;
  let stoppedMs = 0;
  
  for (let i = 1; i < data.value.length; i++) {
    const curr = data.value[i];
    const prev = data.value[i - 1];
    const timeDiff = new Date(curr.deviceTime) - new Date(prev.deviceTime);
    
    if ((parseFloat(prev.speed) || 0) > 1) {
      movingMs += timeDiff;
    } else {
      stoppedMs += timeDiff;
    }
  }
  
  // Formatar tempo em horas e minutos
  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };
  
  return {
    maxSpeed,
    avgSpeed,
    movingTime: formatTime(movingMs),
    stoppedTime: formatTime(stoppedMs)
  };
});

const showGraphic = (d)=>{

    data.value = d;
    show.value = true;
}


defineExpose({
  showGraphic
});





</script>

<style>

.itm{
  border-bottom: silver 1px dotted;
}

.itm div{
  border-right: silver 1px dotted;
}


.tr1{
  background: #f3f3f3;
}

.tr2{
  background: #f8f8f8;
}

.selected{
  background: rgba(5, 167, 227, 0.05) !important;
}

.itm div:last-child{
  border-right: none;
}

.el-select.el-select--large{
  width: 100%;
}

.el-dialog__header,.el-dialog__body,.el-dialog__footer{
  padding: 0px !important;
}

.el-dialog__footer{
  margin-top: 0px;
}

.el-tabs__nav-wrap{
  padding-left: 20px;
  padding-right: 20px;
}

.el-tabs__content{
  padding-left: 20px;
  padding-right: 20px;
}




.danger{
  --el-button-text-color: var(--el-color-danger) !important;
  --el-button-bg-color: #fef0f0 !important;
  --el-button-border-color: #fbc4c4 !important;
  --el-button-hover-text-color: var(--el-color-white) !important;
  --el-button-hover-bg-color: var(--el-color-danger) !important;
  --el-button-hover-border-color: var(--el-color-danger) !important;
  --el-button-active-text-color: var(--el-color-white) !important;
  --el-button-active-border-color: var(--el-color-danger) !important;
}

/* ============================================================================
   KPIs de Velocidade - Estilos
   ============================================================================ */
.speed-kpis {
  display: flex;
  gap: 16px;
  padding: 12px 20px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-bottom: 1px solid var(--el-border-color-lighter, #e4e7ed);
}

.kpi-box {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--el-color-primary-light-8, #d9ecff);
  color: var(--el-color-primary, #409eff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.kpi-icon-success {
  background: var(--el-color-success-light-8, #e1f3d8);
  color: var(--el-color-success, #67c23a);
}

.kpi-icon-warning {
  background: var(--el-color-warning-light-8, #fdf6ec);
  color: var(--el-color-warning, #e6a23c);
}

.kpi-icon-danger {
  background: var(--el-color-danger-light-8, #fef0f0);
  color: var(--el-color-danger, #f56c6c);
}

.kpi-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kpi-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  white-space: nowrap;
}

.kpi-label {
  font-size: 11px;
  color: var(--el-text-color-secondary, #909399);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

</style>