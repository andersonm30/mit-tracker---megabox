<template>
  <el-form label-width="120px" label-position="top">
    <el-form-item :label="KT('device.imei')" >
      <el-input v-model="formData.imei" :placeholder="KT('device.imei')"></el-input>
    </el-form-item>
    <el-form-item :label="KT('device.plate')" >
      <el-input v-model="formData.placa" :placeholder="KT('device.plate')"></el-input>
    </el-form-item>
    <el-form-item :label="KT('device.model')" >
      <el-input v-model="formData.modelo" :placeholder="KT('device.model')"></el-input>
    </el-form-item>

    <el-form-item :label="KT('device.category')" >
      <el-select v-model="formData.categoria" filterable :size="'large'" :placeholder="KT('device.category')" :no-match-text="KT('NO_MATCH_TEXT')" :no-data-text="KT('NO_DATA_TEXT')">
        <el-option
            v-for="item in _availableTypes"
            :key="item.key"
            :label="item.name"
            :value="item.key"
        >
        </el-option>
      </el-select>
    </el-form-item>

    <div style="float: right;">
      <el-button @click="doSend()" type="primary">Concluir</el-button>
    </div>
  </el-form>


</template>

<script setup>


import {ref,onMounted,inject} from 'vue';
import {useRoute} from 'vue-router';

const route = useRoute();
const runtimeApi = inject('runtimeApi', null);
if (!runtimeApi) throw new Error('Runtime API não disponível. Recarregue a página.');

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

import {ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton, ElMessageBox} from "element-plus";
import KT from "@/tarkan/func/kt";

const formData = ref({
  imei: '',
  placa: '',
  modelo: '',
  categoria: ''
});


const _availableTypes = ref([
  {key: 'default',name: 'Padrão'},
  {key: 'arrow',name: 'Seta'},
  {key: 'person',name: 'Pessoas'}
]);

onMounted(()=>{
  if(route.params['id']){
    formData.value.imei = route.params['id'];
  }
})

const doSend = ()=>{
  runtimeApi.autoLink(formData.value).then(()=>{
    ElMessageBox.alert('O dispositivo foi adicionado com sucesso', KT('device.saveError'), {
      confirmButtonText: 'OK'
    }).then(()=>{
      window.location = '/home?t='+new Date().getTime();
    });
  }).catch(()=>{
    ElMessageBox.alert('Não foi possivel adicionar o dispositivo a sua conta', KT('device.saveError'), {
      confirmButtonText: 'OK'
    })
  });

}


</script>