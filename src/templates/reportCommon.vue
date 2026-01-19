<template>

  <el-form label-position="top">


    <el-form-item v-if="!isOnMobile">
      <el-date-picker
          v-model="formData.date"
          type="datetimerange"
          :shortcuts="shortcuts"
          :range-separator="$t('to')"
          format="DD/MM/YYYY HH:mm"
          :start-placeholder="$t('startDate')"
          :end-placeholder="$t('endDate')"

          @change="onChange"

      >
      </el-date-picker>
    </el-form-item>
    
    <el-form-item v-else>
      <div class="form-group" style="margin-left: 28px;">
              <label for="theInputDevice">SELECIONE O DISPOSITIVO</label>
              <el-select
                  @change="onChange" v-model="formData.deviceId" multiple :value-key="'id'" filterable :placeholder="$t('device.devices')" :size="'large'" :no-data-text="$t('NO_DATA_TEXT')" :no-match-text="$t('NO_MATCH_TEXT')">
                <el-option
                    v-for="item in store.state.devices.deviceList"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                >
                </el-option>
              </el-select>
            </div>
      
    </el-form-item>

    <div style="display: flex;flex-direction: column;gap: 10px;">
        <div style="flex: 1;">
            <el-form-item>
            <div class="form-group">  
            <label for="theInputDateTime">Data Hora Inicial</label>
            <el-date-picker
              v-model="startDate"
              type="datetime"
              format="DD/MM/YYYY HH:mm"
              :placeholder="$t('startDate')"
              style="width: 100%;"
              @change="onDateChange"
            />
            </div>
            </el-form-item>
        </div>
        <div style="flex: 1;">
            <el-form-item>
            <div class="form-group">  
            <label for="theInputDateTime">Data Hora Final</label>
            <el-date-picker
              v-model="endDate"
              type="datetime"
              format="DD/MM/YYYY HH:mm"
              :placeholder="$t('endDate')"
              style="width: 100%;"
              @change="onDateChange"
            />
            </div>
            </el-form-item>
        </div>
        <!-- <div style="flex: 1;">
            <el-form-item>
              <el-select
                  @change="onChange" v-model="formData.groupId" multiple :value-key="'id'" filterable :placeholder="$t('group.groups')" :size="'large'" :no-data-text="$t('NO_DATA_TEXT')" :no-match-text="$t('NO_MATCH_TEXT')">
                <el-option
                    v-for="item in store.state.groups.groupList"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                >
                </el-option>
              </el-select>
            </el-form-item>
        </div> -->
    </div>

  </el-form>

</template>

<script setup>



import 'element-plus/es/components/date-picker/style/css'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'

import {ElDatePicker,ElForm,ElSelect,ElOption,ElFormItem} from "element-plus";

import {ref,onMounted,defineEmits,watch} from 'vue';
import {useStore} from 'vuex';

import t from '@/tarkan/func/kt';



const emit = defineEmits(['change']);

const store = useStore();

const isOnMobile = ref(true);

const date1 = new Date();
const date2 = new Date();

date1.setHours(0);
date1.setMinutes(0);
date1.setSeconds(0);

date2.setHours(23);
date2.setMinutes(59);
date2.setSeconds(59);

const startDate = ref(date1);
const endDate = ref(date2);

const formData = ref({
  date: [date1,date2],
  deviceId: [],
  showMarkers: true,
  groupId: []
});

onMounted(()=>{
    emit("change",formData.value);

})

// Observar mudanças em startDate e atualizar formData
watch(startDate, (newVal) => {
  console.log('📅 [ReportCommon] startDate mudou:', newVal);
  formData.value.date[0] = newVal;
  emit("change",formData.value);
});

// Observar mudanças em endDate e atualizar formData
watch(endDate, (newVal) => {
  console.log('📅 [ReportCommon] endDate mudou:', newVal);
  formData.value.date[1] = newVal;
  emit("change",formData.value);
});

const onDateChange = ()=>{
  console.log('📅 [ReportCommon] onDateChange chamado');
  console.log('📅 [ReportCommon] startDate:', startDate.value);
  console.log('📅 [ReportCommon] endDate:', endDate.value);
  formData.value.date[0] = startDate.value;
  formData.value.date[1] = endDate.value;
  console.log('📅 [ReportCommon] formData.date atualizado:', formData.value.date);
  emit("change",formData.value);
}

const onChange = ()=>{
  emit("change",formData.value);
}


const shortcuts = ref([
  {
    text: t('today'),
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setHours(0);
      start.setMinutes(0);
      start.setSeconds(0);

      return [start, end]
    },
  },
  {
    text: t('yesterday'),
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setHours(0);
      start.setMinutes(0);
      start.setSeconds(0);
      start.setDate(start.getDate()-1);

      end.setHours(0);
      end.setMinutes(0);
      end.setSeconds(0);



      return [start, end]
    },
  },
  {
    text: t('thisweek'),
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: t('thismonth'),
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: t('theeemonths'),
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
]);

</script>

<style>
.el-range-editor.el-input__inner{
    width: 100% !important;
}
</style>