<template>
    <edit-notification ref="editEventRef"></edit-notification>
    <el-dialog :lock-scroll="true" :top="'50px'" v-model="show">
  
      <template v-slot:title>
        <div style="border-bottom: #e0e0e0 1px solid; padding: 20px;">
          <div class="modal-title">{{KT('notification.title2','Notificações')}}</div>
        </div>
      </template>
  
      <template v-slot:footer>
        <div style="border-top: #e0e0e0 1px solid;padding: 20px;display: flex;justify-content: flex-start;">
            <el-button
                v-if="store.getters.advancedPermissions(37)"
                @mouseleave="hideTip" @mouseenter.stop="showTip($event, KT('notification.add'))"
                type="primary" @click="editEventRef.newEvent()"><i class="fas fa-user-plus"></i></el-button>
  
            <el-button
                v-if="store.getters.advancedPermissions(39)"
                @mouseleave="hideTip" @mouseenter.stop="showTip($event, KT('notification.remove'))"
                type="danger" :plain="selected === 0" @click="doDelete()">
              <i class="fas fa-user-minus"></i>
            </el-button>
  
            <el-button
                v-if="store.getters.advancedPermissions(38)"
                @mouseleave="hideTip" @mouseenter.stop="showTip($event, KT('notification.edit'))"
                type="warning" :plain="selected === 0" @click="editEventRef.EditEvent(selected);">
              <i class="fas fa-user-edit"></i>
            </el-button>
        </div>
      </template>
  
      <edit-event ref="editEventRef"></edit-event>
  
      <!-- Lista de Notificaciones -->
      <div class="itm" style="display: flex; background: #eeeeee;">
        <div style="width: 140px; padding: 10px; font-size: 12px;">{{KT('notification.type')}}</div>
        <div style="width: 100px; padding: 10px; font-size: 12px; text-align: center;">{{KT('notification.all')}}</div>
        <div style="flex: 1; padding: 10px; font-size: 12px; text-align: center;">{{KT('notification.evento')}}</div>
        <div style="flex: 1; padding: 10px; font-size: 12px; text-align: center;">{{KT('notification.channel')}}</div>
      </div>
  
      <div style="height: calc(100vh - 300px); overflow: hidden; overflow-y: scroll;">
        <div class="itm" v-for="(u, k) in filteredNotifications" :key="k" @click="selected = (selected !== u.id) ? u.id : 0" :class="{ tr1: (k % 2), tr2: !(k % 2), selected: (selected === u.id) }" style="display: flex;">
          
          <!-- Tipo de Notificación -->
          <div style="width: 140px; padding: 10px; font-size: 14px;">
            {{KT('notification.types.' + u.type)}}
          </div>
  
          <!-- Siempre Activa -->
          <div style="width: 100px; padding: 10px; font-size: 14px; text-align: center;">
            {{KT((u.always) ? 'yes' : 'no')}}
          </div>
  
          <!-- Información del Dispositivo -->
          <div style="flex: 1; padding: 10px; font-size: 10px; text-align: center;">
        <template v-if="u.attributes['deviceId'] && u.attributes['deviceName']">
    <span class="tblItem">
      <!-- Mostramos los atributos del dispositivo en dos líneas con '||' entre ellos -->
      
      <div>
        <strong>{{ KT('device.id') }}:</strong> {{ u.attributes['deviceId'] }} || 
        <strong>{{ KT('device.name') }}:</strong> {{ u.attributes['deviceName'] }}
      </div>
      
      <div>
        <strong>{{ KT('device.placa') }}:</strong> {{ u.attributes['Placa'] }} || 
        <template v-if="u.attributes['commandId']">
          <strong>{{ KT('device.comando') }}:</strong> {{ u.attributes['commandId'] }}
        </template>
      </div>
  
      <!-- Mostrar CommandId y commandName si existen -->
      <template v-if="u.attributes['commandId']">
        <div>
          <strong>
          </strong> {{ u.attributes['commandName'] }} 
        </div>
      </template>
  
      <!-- Mostrar calendarId y calendarName si existen -->
      <template v-if="u.attributes['calendarId']">
        <div>
          <strong>{{ KT('device.calendar') }}:</strong> {{ u.attributes['calendarId'] }} || 
          <strong></strong> {{ u.attributes['calendarName'] }}
        </div>
      </template>
    </span>
  </template>
  
  
          </div>
  
          <!-- Canal de Notificación (si existe) -->
          <div style="flex: 1; padding: 10px; font-size: 14px; text-align: center;">
            <template v-if="u.notificators.split(',').length">
              <span class="tblItem">Command</span>
            </template>
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
  
  import {ElDialog,ElMessage,ElMessageBox,ElNotification,ElButton} from "element-plus";
  
  
  import {ref,defineExpose,computed} from 'vue';
  import {useStore} from 'vuex'
  
  
  import EditEvent from "./edit-event.vue";
  import KT from "../../func/kt";
  
  const store = useStore();
  const selected = ref(0);
  const show = ref(false);
  
  const editEventRef = ref(null);
  // Computed property to filter notifications that only have the 'command' channel in 'notificators'
  const filteredNotifications = computed(() => {
    return store.state.events.eventsList.filter(u => u.notificators.split(',').includes('command'));
  });
  
  
  
  const showTip = (evt,text)=>{
    window.$showTip(evt,text);
  }
  
  const hideTip = (evt,text)=>{
    window.$hideTip(evt,text);
  }
  
  const doDelete = () => {
    // Verificar si hay una notificación seleccionada
    if (selected.value === 0) {
      ElMessage.error(KT('notification.selectError'));
      return false;
    }
  
    const notification = store.getters["events/getNotificationById"](selected.value);
  
    // Obtener el `commandId` y `deviceId` desde los atributos de la notificación
    const commandId = notification.attributes.commandId;
    const deviceId = notification.attributes.deviceId;
  
    // Mostrar cuadro de confirmación
    ElMessageBox.confirm(
      KT('notification.confirmDelete', { type: KT('notification.types.' + notification.type) }),
      KT('danger'),
      {
        confirmButtonText: KT('delete'),
        confirmButtonClass: 'danger',
        cancelButtonText: KT('cancel'),
        type: 'warning',
      }
    ).then(() => {
      // 1. Desvincular la relación entre `commandId` y `deviceId` sin borrar los dispositivos ni los comandos
      if (commandId && deviceId) {
        unlinkObjectCommand({ deviceId, commandId });  // Llamada para eliminar solo la relación
      }
  
      // 2. Eliminar la notificación
      store.dispatch("events/delete", selected.value).then(() => {
        ElNotification({
          title: KT('success'),
          message: KT('notification.deleted'),
          type: 'success',
        });
        selected.value = 0;  // Restablecer la selección
      }).catch((e) => {
        ElNotification({
          title: KT('error'),
          message: e.response.data || KT('notification.deleteError'),
          type: 'danger',
        });
      });
    }).catch(() => {
      // Si el usuario cancela la operación
      ElMessage.error(KT('userCancel'));
    });
  };
  
  
  
  
  
  const showEvents = ()=>{
      show.value = true;
  }
  
  
  defineExpose({
    showEvents
  });
  
  const unlinkObjectCommand = async ({ deviceId, groupId, userId, commandId }) => {
    let unlinkData = {};
  
    // Asegúrate de que commandId y deviceId estén presentes
    console.log("Desvinculando con commandId:", commandId);
  
    // Desvincular del dispositivo
    if (deviceId) {
      unlinkData = { deviceId, commandId };
    }
    // Desvincular del grupo
    else if (groupId) {
      unlinkData = { groupId, commandId };
    }
    // Desvincular del usuario
    else if (userId) {
      unlinkData = { userId, commandId };
    } else {
      console.error("Faltan parámetros para la desvinculación");
      ElNotification({
        title: 'Error',
        message: 'Faltan parámetros necesarios para la desvinculación',
        type: 'error',
      });
      return;
    }
  
    console.log("Datos para desvincular:", unlinkData);
  
    try {
      // Realizamos la eliminación de la relación usando el API correspondiente
      await window.$traccar.unlinkObjects(unlinkData);  // Aquí llamamos al API que elimina la relación
      console.log("Desvinculación exitosa:", unlinkData);
    } catch (error) {
      console.error("Error al desvincular:", error);
      ElNotification({
        title: 'Error',
        message: 'Error al realizar la desvinculación.',
        type: 'error',
      });
    }
  };
  
  
  
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
  
  .tblItem:after{
    content:", "
  }
  
  .tblItem:last-child:after{
    content:"";
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
  
  </style>