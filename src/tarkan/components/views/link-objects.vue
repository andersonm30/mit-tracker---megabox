<template>
  <el-dialog :lock-scroll="true" :top="'50px'" v-model="show" title="Teste">

    <template v-slot:title>
      <div  style="border-bottom: #e0e0e0 1px solid;padding: 20px;">
        <div class="modal-title" style="display: flex;width: calc(100% - 50px)">

          <el-input v-model="query" :placeholder="KT(search)" style="--el-input-border-radius: 5px;margin-right: 5px;"></el-input>




        </div>
      </div>
    </template>
    <template v-slot:footer>

    </template>
    <div class="itm" style="display: flex;background: #eeeeee;">
      <div style="width: 50px;padding: 10px;font-size: 12px;"> </div>
      <div style="width: 30px;text-align: center;padding: 10px;font-size: 12px;">Id</div>
      <div style="flex: 1;padding: 10px;font-size: 12px;text-align: center;">Nome</div>
    </div>
    <div style="height: calc(100vh - 300px); overflow: hidden; overflow-y: scroll;">



      <div class="itm" v-for="(u,k) in filteredObjects" :key="k" :class="{tr1: (k%2),tr2: !(k%2)}" style="display: flex;">

        <div style="width: 50px;padding: 10px;font-size: 14px;">
          <el-switch :model-value="isLinked(u.id)" @change="changeLink(u,$event)" :size="'large'"></el-switch>
        </div>
        <div style="width: 30px;text-align: center;padding: 10px;font-size: 14px;">
          {{u.id}}
        </div>
        <template v-if="objectType==='notifications' && !u.attributes['description']">
          <div style="flex: 1;padding: 10px;font-size: 14px;text-align: center;">{{KT('notification.types.'+u.type)}}</div>
          <div style="flex: 1;padding: 10px;font-size: 14px;text-align: center;">
            <template v-if="u.notificators.split(',').length">
              <span class="tblItem" v-for="(a,b) in u.notificators.split(',')" :key="b">{{KT('notification.channels.'+a,a)}}</span>
            </template>
          </div>
          <div style="flex: 1;padding: 10px;font-size: 14px;text-align: center;">
            <template v-if="u.attributes['alarms']">
              <span class="tblItem" v-for="(a,b) in u.attributes['alarms'].split(',')" :key="b">{{KT('alarms.'+a,a)}}</span>
            </template>
          </div>
        </template>
        <div v-else-if="objectType==='devices'" style="flex: 1;padding: 10px;font-size: 14px;text-align: center;">{{u.name || u.description || u.id|| u.attributes['description']}} | {{u.attributes['placa']}}</div>
        <div v-else style="flex: 1;padding: 10px;font-size: 14px;text-align: center;">{{u.name || u.description || u.attributes['description']}}</div>
      </div>

    </div>

  </el-dialog>
</template>


<script setup>
import {ref,defineExpose,provide,computed} from 'vue';


import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/switch/style/css'
import 'element-plus/es/components/dialog/style/css'

import {ElDialog,ElSwitch,ElInput} from "element-plus";

const query = ref('');
const show = ref(false);
const search = ref('search');

const objectType = ref(null);

const selection = ref({});
const keyType = ref(null);
const availableObjects = ref([]);
const selectedObjects = ref([]);

import KT from '../../func/kt';

const isLinked = (id)=>{
  return (selectedObjects.value.find((f)=> f.id === id))?true:false;
}

const changeLink = (obj,state)=>{

  let tmp = JSON.parse(JSON.stringify(selection.value));
      tmp[keyType.value] = obj.id;
  if(state){
    selectedObjects.value.push(obj);

    window.$traccar.linkObjects(tmp);

  }else{
    selectedObjects.value.splice(selectedObjects.value.findIndex((f)=> f.id === obj.id),1);

    window.$traccar.unlinkObjects(tmp);
  }
}


const filteredObjects = computed(()=>{
  if(query.value.length<3){
    return availableObjects.value;
  }else{
    return availableObjects.value.filter((f)=>{


      for(let k of Object.keys(f)){
        if(String(f[k]).toLowerCase().match(query.value.toLowerCase())){
          return true;
        }
      }


      for(let k of Object.keys(f.attributes)){
        if(String(f.attributes[k]).toLowerCase().match(query.value.toLowerCase())){
          return true;
        }
      }

      return false;
    })
  }
})

const showObjects = (params)=>{

  selection.value = {};

  objectType.value = params.type;
  selection.value[Object.keys(params)[0]] = params[Object.keys(params)[0]];

  if(params.type==='geofences'){

    keyType.value = 'geofenceId';
    search.value = 'geofence.search';

    window.$traccar.getGeofences({all: true}).then(({data})=>{
      availableObjects.value = data;
    });

    window.$traccar.getGeofences(selection.value).then(({data})=>{
      selectedObjects.value = data;
    });
  }else if(params.type==='devices'){

    keyType.value = 'deviceId';
    search.value = 'device.search';

    window.$traccar.getDevices({all: true}).then(({data})=>{
      let tmp = [];

      data.forEach((d)=>{
        if(!(d.uniqueId.split("-").length == 3 && d.uniqueId.split("-")[0]==="deleted")){
          tmp.push(d);
        }
      })


      availableObjects.value = tmp;
    });

    window.$traccar.getDevices(selection.value).then(({data})=>{
      selectedObjects.value = data;
    });
  }else if(params.type==='commands'){

    keyType.value = 'commandId';
    search.value = 'command.search';

    window.$traccar.getSavedCommands({all: true}).then(({data})=>{
      availableObjects.value = data;
    });

    window.$traccar.getSavedCommands(selection.value).then(({data})=>{
      selectedObjects.value = data;
    });
  }else if(params.type==='maintence'){

    keyType.value = 'maintenanceId';
    search.value = 'maintenance.search';

    window.$traccar.getMaintenance({all: true}).then(({data})=>{
      availableObjects.value = data;
    });

    window.$traccar.getMaintenance(selection.value).then(({data})=>{
      selectedObjects.value = data;
    });
  }else if(params.type==='attributes'){

    keyType.value = 'attributeId';
    search.value = 'attribute.search';

    window.$traccar.getComputedAttributes({all: true}).then(({data})=>{
      availableObjects.value = data;
    });

    window.$traccar.getComputedAttributes(selection.value).then(({data})=>{
      selectedObjects.value = data;
    });
  }else if(params.type==='calendars'){

    keyType.value = 'calendarId';
    search.value = 'calendar.search';

    window.$traccar.getCalendars({all: true}).then(({data})=>{
      availableObjects.value = data;
    });

    window.$traccar.getCalendars(selection.value).then(({data})=>{
      selectedObjects.value = data;
    });
  }else if(params.type==='notifications'){

    keyType.value = 'notificationId';
    search.value = 'notification.search';

    window.$traccar.getNotifications({all: true}).then(({data})=>{
      availableObjects.value = data;
    });

    window.$traccar.getNotifications(selection.value).then(({data})=>{
      selectedObjects.value = data;
    });
  }else if(params.type==='users'){

    keyType.value = 'managedUserId';
    search.value = 'user.search';

    window.$traccar.getUsers({all: true}).then(({data})=>{
      availableObjects.value = data;
    });

    window.$traccar.getUsers(selection.value).then(({data})=>{
      selectedObjects.value = data;
    });
  }else if(params.type==='groups'){

    keyType.value = 'groupId';
    search.value = 'group.search';

    window.$traccar.getGroups({all: true}).then(({data})=>{
      availableObjects.value = data;
    });

    window.$traccar.getGroups(selection.value).then(({data})=>{
      selectedObjects.value = data;
    });
  }else if(params.type==='drivers'){

    keyType.value = 'driverId';
    search.value = 'driver.search';

    window.$traccar.getDrivers({all: true}).then(({data})=>{
      availableObjects.value = data;
    });

    window.$traccar.getDrivers(selection.value).then(({data})=>{
      selectedObjects.value = data;
    });
  }


  show.value = true;
}

provide("showObjects",showObjects);

defineExpose({
  showObjects
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

.tblItem:after{
  content:", "
}

.tblItem:last-child:after{
  content:"";
}

</style>