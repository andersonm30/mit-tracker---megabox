<template>
  <el-dialog :lock-scroll="true" v-model="show">

    <template v-slot:title>
      <div  style="border-bottom: #e0e0e0 1px solid;padding: 20px;">
        <div class="modal-title" >{{title}}</div>
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
      <el-tab-pane label="Geocerca" name="first">
        <el-form label-width="120px" label-position="top">
          <el-form-item label="Nome da Geocerca" >
            <el-input v-model="formData.name"></el-input>
          </el-form-item>
          <el-form-item label="Tipo de Cerca" >
            <el-button-group size="large">              
              <el-button type="primary" :plain="!(formData.type==='POLYGON')" @click="formData.type='POLYGON'">POLIGONO</el-button>
              <el-button type="primary" :plain="!(formData.type==='CIRCLE')" @click="formData.type='CIRCLE'">CIRCULO</el-button>              
              <el-button type="primary" :plain="!(formData.type==='LINESTRING')" @click="formData.type='LINESTRING'">LINHA</el-button>
            </el-button-group>

          </el-form-item>


          <div style="display: flex;flex-direction: row;">
              <div style="flex: 1;">

                <el-form-item label="Área Total" >
                  <el-input disabled :value="store.getters['geofences/getTotalArea']"></el-input>
                </el-form-item>

              </div>

            <div style="padding-top: 35px;margin-left: 10px;">
              <el-button type="primary" @click="doEditArea()">Editar Área</el-button>
            </div>

          </div>



        </el-form>


      </el-tab-pane>


      
      <el-tab-pane label="Atributos" name="attributes">
        <tab-attributes v-model="formData.attributes" :type="'geofence'"></tab-attributes>
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
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'


import {ElDialog,ElTabs,ElMessageBox,ElNotification,ElTabPane,ElForm,ElFormItem,ElButton,ElInput} from "element-plus";


import TabAttributes from "./tab-attributes";

const defaultGeofenceData = {
  name: '',
  type: 'POLYGON',
  attributes: {} // ✅ FIX: Objeto (não array) - consistência com Traccar
}

const defaultTraccarGeofenceData = {
  "id": 0,
  "name": "",
  "description": "",
  "area": "",
  "calendarId": 0,
  "attributes": { }
}





import {ref, inject} from 'vue'; // ✅ defineExpose é macro, não precisa importar
import {useStore} from 'vuex'

const store = useStore();
const contextMenuRef = inject('contextMenu');



const show = ref(false);
const tab = ref('first');


const title = ref('');

// eslint-disable-next-line no-undef
const formData = ref(defaultGeofenceData);



const doDelete = ()=>{
  ElMessageBox.confirm('Deseja realmente excluir esta geocerca?','Tem certeza?').then(()=>{
    store.dispatch("geofences/delete",formData.value.id).then(()=>{
      show.value = false;
      ElNotification({
        title: 'Info',
        message: 'Geocerca deletada com suceso.',
        type: 'info',
      });
    })
  });
}

const newGeofence = ()=>{
  title.value = 'Cadastrar Geocerca';

  // eslint-disable-next-line no-undef
    formData.value = JSON.parse(JSON.stringify(defaultGeofenceData));
    show.value = true;
}

const editGeofence = (geofence)=>{
  
   
  title.value = 'Editar Geocerca';
  // eslint-disable-next-line no-undef
  formData.value = JSON.parse(JSON.stringify(defaultGeofenceData));

  

  Object.assign(formData.value,JSON.parse(JSON.stringify(geofence)));


  const area = getAreaParsed(geofence.area);
  console.log('Tudo certo');

  
  console.log(area.type);
  console.log(geofence);

  formData.value.type = area.type;

  // ✅ FIX CRÍTICO: Preserva dados do círculo ao editar
  if(area.type === 'CIRCLE') {
    // Parse correto: CIRCLE (lat lng, radius)
    const circleData = area.params;
    if (circleData && circleData.length >= 4) {
      store.commit("geofences/setParams", [
        parseFloat(circleData[1]), // lat
        parseFloat(circleData[2]), // lng
        parseFloat(circleData[3])  // radius
      ]);
    }
  } else {
    store.commit("geofences/setParams", area.params);
  }

  show.value = true;
  //  })
}

defineExpose({
  newGeofence,
  editGeofence,
  contextMenuRef
});


const doEditArea = async ()=>{
  // ✅ FIX: Confirmação antes de limpar área existente
  if(store.state.geofences.mapPointEditingParams.length > 0) {
    try {
      await ElMessageBox.confirm(
        'Ao editar a área, os pontos atuais serão substituídos. Deseja continuar?',
        'Confirmar Edição',
        { type: 'warning' }
      );
    } catch {
      return; // Cancelou
    }
  }
  store.dispatch("geofences/enableEditing",formData.value.type)
}

const doCancel = ()=>{
  show.value = false;
}


// ✅ Regex patterns para POLYGON e LINESTRING (CIRCLE usa match inline)
var fenceAreaPolygon = /(\s?([-\d.]*)\s([-\d.]*),?)/gm;
var fenceAreaLinestring = /(\s?([-\d.]*)\s([-\d.]*),?)/gm;

const getAreaParsed = (a)=>{
  // ✅ NULL SAFETY: Evita crash se area vier vazio/null/undefined
  if (!a || typeof a !== 'string') {
    return { type: formData.value.type || 'POLYGON', params: [] };
  }

  const type = a.split("(")[0].trim().toUpperCase(); // ✅ FIX: Case-insensitive


  if(type === 'LINESTRING'){

    const linestring = a.match(fenceAreaLinestring) || []; // ✅ NULL SAFETY: Fallback se match null
    let tmp = [];
    linestring.forEach((L)=>{
      const S = L.trim().replace(",","").split(" ");
      if(S.length===2) {
        tmp.push(S);
      }
    })


    return {type: 'LINESTRING',params: tmp};
  }else if(type === 'POLYGON'){

    const polygon = a.match(fenceAreaPolygon) || []; // ✅ NULL SAFETY: Fallback se match null
    let tmp = [];
    polygon.forEach((L)=>{
      const S = L.trim().replace(",","").split(" ");
      if(S.length===2) {
        tmp.push(S);
      }
    })


    return {type: 'POLYGON',params: tmp};

  }else if(type === 'CIRCLE'){
    // ✅ FIX CRÍTICO: Parse correto do WKT CIRCLE (lat lng, radius)
    const match = a.match(/CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([-\d.]+)\s*\)/i);
    if(match) {
      return {
        type: 'CIRCLE',
        params: [match[0], match[1], match[2], match[3]] // [fullMatch, lat, lng, radius]
      };
    }
    return {type: 'CIRCLE', params: []};
  }

  return {type};
}

const getParsedArea = (paramsOverride)=>{
    const type = formData.value.type;
    const params = paramsOverride || store.state.geofences.mapPointEditingParams; // ✅ FIX: Aceita override
    if(type==='CIRCLE'){
      return 'CIRCLE ('+params[0]+' '+params[1]+', '+params[2]+')';
    }else if(type==='LINESTRING'){
      let tmp = 'LINESTRING ('

      params.forEach((p)=>{
        tmp+=p[0]+' '+p[1]+', ';
      })

      tmp = tmp.substring(0,tmp.length-2);

      tmp+= ')';

      return tmp;
    }else if(type==='POLYGON'){
      let tmp = 'POLYGON(('

      params.forEach((p)=>{
        tmp+=p[0]+' '+p[1]+', ';
      })

      tmp = tmp.substring(0,tmp.length-2);

      tmp+= '))';

      return tmp;
    }


}

const doSave = ()=>{

  const tmp = JSON.parse(JSON.stringify(defaultTraccarGeofenceData));

  tmp.id = formData.value.id;
  tmp.name = formData.value.name;
  
  // ✅ FIX CRÍTICO: Auto-close de polígono SEM mutar store (cópia local)
  let paramsForSave = store.state.geofences.mapPointEditingParams;
  
  if(formData.value.type === 'POLYGON') {
    const params = store.state.geofences.mapPointEditingParams;
    if(params.length < 3) {
      ElMessageBox.alert('O polígono precisa ter pelo menos 3 pontos.', 'Área Inválida', { type: 'error' });
      return;
    }
    // Fechar polígono em CÓPIA LOCAL se necessário (primeiro != último)
    const first = params[0];
    const last = params[params.length - 1];
    if(first[0] !== last[0] || first[1] !== last[1]) {
      // ✅ Cópia local - NÃO commita no store (evita mutação se cancelar)
      paramsForSave = [...params, [first[0], first[1]]];
    }
  }
  
  tmp.area = getParsedArea(paramsForSave); // ✅ Passa cópia local
  tmp.attributes = formData.value.attributes;

  if(tmp.name.trim()===''){
    ElMessageBox.confirm('Você precisa digitar um nome para a sua geocerca','Ops!').then(()=>{});
  }else {

    store.dispatch("geofences/save", tmp).then(() => {
      show.value = false;
    })
  }
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