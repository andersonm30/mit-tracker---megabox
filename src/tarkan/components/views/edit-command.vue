<template>
  <el-dialog :lock-scroll="true" v-model="show" title="Teste">

    <template v-slot:title>
      <div  style="border-bottom: #e0e0e0 1px solid;padding: 20px;">
        <div class="modal-title" >Cadastrar Comando</div>
      </div>
    </template>
    <template v-slot:footer>
      <div  style="border-top: #e0e0e0 1px solid;padding: 20px;display: flex;justify-content: space-between">
        <div><el-button  type="danger" @click="doDelete()">Excluir</el-button></div>
        <div><el-button type="danger" plain @click="doCancel()">Cancelar</el-button>
          <el-button type="primary" @click="doSave()">Salvar</el-button></div>
      </div>
    </template>

    <el-tabs v-model="tab">
      <el-tab-pane label="Comando" name="first">
        <el-form label-width="120px" label-position="top">
          <el-form-item label="Nome do Comando" >
            <el-input v-model="formData.description"></el-input>
          </el-form-item>


          <el-form-item label="Tipo de Comando" >
            <el-select v-model="formData.type" :value-key="'id'" filterable placeholder="Tipo de Comando" :size="'large'" :no-data-text="'Nenhum tipo disponível'">
              <el-option
                  v-for="item in types"
                  :key="item.type"
                  :label="$t('actions.'+item.type)"
                  :value="item.type"
              >
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item v-if="formData.type==='custom'" label="Enviar" >
            <el-input v-model="formData.attributes['data']"></el-input>
          </el-form-item>


          <br>
          <el-switch
              v-model="changeNative"
              active-text="Substituir um comando nativo por este comando."
          >
          </el-switch>
          <el-form-item v-if="changeNative" label="Qual ação você deseja substituir?" >
            <el-select v-model="formData.attributes['tarkan.changeNative']" :value-key="'id'" filterable placeholder="Grupo" :size="'large'" :no-data-text="'Nenhum tipo disponível'">
              <el-option
                  v-for="item in actions"
                  :key="item.type"
                  :label="$t('actions.'+item.type)"
                  :value="item.type"
              >
              </el-option>
            </el-select>
          </el-form-item>





        </el-form>


      </el-tab-pane>

      <el-tab-pane label="Dispositivos" :name="devices">
        <tab-devices ref="deviceList"></tab-devices>
      </el-tab-pane>
    </el-tabs>
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

import {ElDialog,ElTabs,ElTabPane,ElForm,ElSwitch,ElFormItem,ElSelect,ElOption,ElButton,ElInput} from "element-plus";

import TabDevices from "./tab-devices";

const defaultGeofenceData = {
  "id": 0,
  "deviceId": 0,
  "description": "",
  "type": "",
  "attributes": { }
}


import {ElMessageBox} from 'element-plus/es/components/message-box';
import {ElNotification} from 'element-plus/es/components/notification';
import {ref, defineExpose, onMounted} from 'vue';
import {useStore} from 'vuex'




const store = useStore();

//import {ElDialog,ElForm,ElFormItem,ElInput} from 'element-plus'

const deviceList = ref(null);
const show = ref(false);
const tab = ref('first');

const changeNative = ref(false);
const types = ref([]);
const actions = ref([{type: 'engineStop'},{type: 'engineResume'}]);

onMounted(()=>{
  window.$traccar.getTypeCommands().then(({data})=>{
    types.value = data;
  });
})



// eslint-disable-next-line no-undef
const formData = ref(defaultGeofenceData);




const newCommand = ()=>{
  // eslint-disable-next-line no-undef
    formData.value = JSON.parse(JSON.stringify(defaultGeofenceData));
    show.value = true;
}

const editCommand = (command)=>{

  // eslint-disable-next-line no-undef
  formData.value = JSON.parse(JSON.stringify(defaultGeofenceData));



  Object.assign(formData.value,JSON.parse(JSON.stringify(command)));


  if(command.attributes['tarkan.changeNative']){
      changeNative.value = true;
  }

  show.value = true;
}

defineExpose({
  newCommand,
  editCommand
});




const doCancel = ()=>{
  show.value = false;
}


const doDelete = ()=>{
  ElMessageBox.confirm('Deseja realmente excluir este comando?','Tem certeza?').then(()=>{
    store.dispatch("commands/delete",formData.value.id).then(()=>{
      show.value = false;
      ElNotification({
        title: 'Info',
        message: 'Comando deletado com suceso.',
        type: 'info',
      });
    })
  });
}

const doSave = ()=>{

  ElNotification({
    title: 'Info',
    message: 'Cadastrando seu comando...',
    type: 'info',
  });

  const tmp = JSON.parse(JSON.stringify(defaultGeofenceData));

  Object.assign(tmp,formData.value);


  if(changeNative.value===false){
      tmp.attributes['tarkan.changeNative'] = false;
  }



  store.dispatch("commands/save",tmp).then(async (data)=>{
    const selectedDevices = deviceList.value.selected;

    if(selectedDevices.length>0) {
      for(let device of selectedDevices){

        console.log(device);

        ElNotification({
          title: 'Info',
          message: 'Vinculando comando ao dispositivo '+device.name,
          type: 'info',
        });

        await window.$traccar.linkObjects({deviceId: device.id,commandId: data.id});

      }
    }


    ElNotification({
      title: 'Successo',
      message: 'Comando personalizado cadastrado com sucesso.',
      type: 'success',
    });

    show.value = false;

  })




  /*

  tmp.name = formData.value.name;
  tmp.area = getParsedArea();

  store.dispatch("geofences/save",tmp).then(()=>{
      show.value = false;
  })*/
}


</script>

<style>

.el-button-group{
  display: flex !important;
}

.el-button-group .el-button--large{
  flex: 1 !important;
}

.el-select.el-select--large{
  width: 100%;
}

.el-dialog__header,.el-dialog__body,.el-dialog__footer{
  padding: 0px !important;
}

.el-dialog__footer{
  margin-top: 20px;
}

.el-tabs__nav-wrap{
  padding-left: 20px;
  padding-right: 20px;
}

.el-tabs__content{
  padding-left: 20px;
  padding-right: 20px;
}



.isCar{
  border: #05a7e3 1px solid !important;
}
</style>