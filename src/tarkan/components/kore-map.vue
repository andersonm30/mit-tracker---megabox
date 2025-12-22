<template>
  <div class="map-wrapper">
  <div ref="mapContainer" id="map-container">
    <LMap
      :options="{preferCanvas: true}"
      :use-global-leaflet="true"
      ref="map"
      :zoom="zoomForce"
      :min-zoom="4"
      :max-zoom="19"
      :zoom-animation="true"
      :fade-animation="true"
      :marker-zoom-animation="true"
      @ready="mapReady($event)"
      @click="mapClick"
      @mousemove="mapMove"
      :center="center"
      @update:zoom="zoomUpdated($event)"
      style="width: 100%;height: 100%;"
    >
      <l-control position="topright">
        <el-button
          type="danger"
          v-if="store.state.devices.showRoutes"
          @click="closeRoutes()"
          style="margin-right: 5px;">
          <i class="fas fa-times"></i>
        </el-button>

        <!-- <div class="search-container">
<el-autocomplete
  v-if="searchVisible"
  v-model="searchQuery"
  :fetch-suggestions="fetchSuggestions"
  @select="handleSelect"
  @focus="keepSearchVisible"
  @blur="delayedHideSearch"
  placeholder="Digite o endereço"
  style="width: 300px;"
  class="autocomplete-results"
>
  <template v-slot:append>
    <el-button @click="searchAddress">
      OK
    </el-button>
  </template>
</el-autocomplete>
<el-button 
  v-show="!searchVisible"
  @mouseenter="showSearch"
  style="margin-right: 5px;">
  <i class="fas fa-search-location"></i>
</el-button>
</div> -->


          <el-tooltip placement="right" content="Atualizar Mapa">
          <el-button @click="refreshMap">
            <i class="fas fa-sync"></i>
          </el-button>
          </el-tooltip>

        <el-button
          v-if="store.state.server.isPlus && ((store.state.server.serverInfo?.attributes?.['tarkan.enableAdvancedPerms'] && store.getters.advancedPermissions(24))) || (!store.state.server.serverInfo?.attributes?.['tarkan.enableAdvancedPerms'] && !store.state.auth.attributes?.['isShared'] && !store.getters['isReadonly'])"
          @click="editSharesRef.showShares()"
          style="margin-right: 5px;">
          <i class="fas fa-share-alt"></i>
        </el-button>

        <el-dropdown
          v-if="!store.state.auth.attributes?.['isShared']"
          size="large"
          style="margin-right: 5px;"
          max-height="50%"
          :hide-timeout="300"
          :hide-on-click="false"
          trigger="click">
          <el-button><i class="fas fa-eye"></i></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <div style="padding-left: 10px;padding-right: 10px;">
                <el-input v-model="eyeFilter"></el-input>
              </div>
              <div style="padding-left: 10px;padding-right: 10px;font-weight: bold;margin-top: 20px;text-transform: uppercase;">
                Preferências
              </div>
              <div style="padding: 5px;padding-left: 20px;padding-right: 20px;">
                <el-switch
                  size="small"
                  v-model="showGeofences">
                </el-switch>
                <span style="margin-left: 10px;">Mostrar Geocercas</span>
              </div>
              <div style="padding: 5px;padding-left: 20px;padding-right: 20px;">
                <el-switch
                  size="small"
                  :model-value="store.getters['mapPref']('name')"
                  @click="store.dispatch('setMapPref','name')">
                </el-switch>
                <span style="margin-left: 10px;">Mostrar Nome</span>
              </div>
              <div style="padding: 5px;padding-left: 20px;padding-right: 20px;">
                <el-switch
                  size="small"
                  :model-value="store.getters['mapPref']('status')"
                  @click="store.dispatch('setMapPref','status')">
                </el-switch>
                <span style="margin-left: 10px;">Mostrar Status</span>
              </div>
              <div style="padding-left: 10px;padding-right: 10px;font-weight: bold;margin-top: 20px;text-transform: uppercase;">
                Devices
                <div style="float: right;font-size: 9px;padding-top: 3px;">
                  <a
                    @click.prevent="eyeAll(true)"
                    style="color: var(--el-color-primary);text-decoration: none;"
                    href="">Todos</a>
                  |
                  <a
                    @click.prevent="eyeAll(false)"
                    style="color: var(--el-color-primary);text-decoration: none;"
                    href="">Nenhum</a>
                </div>
              </div>
              <div style="overflow: auto;max-height: 50vh;">
                <el-dropdown-item
                  v-for="(t,tk) in availableTypes"
                  :key="tk"
                  @click="store.dispatch('devices/toggleHiddenFilter',t.key)">
                  <el-switch
                    :key="'chk'+t.key"
                    size="small"
                    :model-value="store.getters['devices/isHiddenFilter'](t.key)">
                  </el-switch>
                  <span style="margin-left: 10px;">{{t.name}}</span>
                </el-dropdown-item>
              </div>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown size="large" trigger="click">
          <el-button><i class="fas fa-layer-group"></i></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="(m,mk) in availableMaps"
                :key="'map-'+mk"
                @click="changeMap(m.id)">
                <el-radio v-model="selectedMap" :label="m.id"> {{m.name}}</el-radio>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </l-control>

      <l-control position="topleft" v-if="!store.state.auth.attributes?.['isShared']">
        <div :set="count = store.getters['devices/deviceCount']">
          <el-tooltip
            placement="right-start"
            :content="KT('all')">
            <div
              class="customFilter all"
              @click="store.dispatch('devices/setStatusFilter','all')"
              :class="{active: store.state.devices.applyFilters.statusFilter==='all'}">
              {{count.all}}
            </div>
          </el-tooltip>
          <el-tooltip
            placement="right-start"
            :content="KT('online')">
            <div
              class="customFilter online"
              @click="store.dispatch('devices/setStatusFilter','online')"
              :class="{active: store.state.devices.applyFilters.statusFilter==='online'}">
              {{count.online}}
            </div>
          </el-tooltip>
          <el-tooltip
            placement="right-start"
            :content="KT('offline')">
            <div
              class="customFilter offline"
              @click="store.dispatch('devices/setStatusFilter','offline')"
              :class="{active: store.state.devices.applyFilters.statusFilter==='offline'}">
              {{count.offline}}
            </div>
          </el-tooltip>
          <el-tooltip
            placement="right-start"
            :content="KT('unknown')">
            <div
              class="customFilter unknown"
              @click="store.dispatch('devices/setStatusFilter','unknown')"
              :class="{active: store.state.devices.applyFilters.statusFilter==='unknown'}">
              {{count.unknown}}
            </div>
          </el-tooltip>
          <el-tooltip
            placement="right-start"
            :content="KT('device.moving')">
            <div
              class="customFilter motion"
              @click="store.dispatch('devices/toggleMotionFilter')"
              :class="{active: store.state.devices.applyFilters.motionFilter}">
              {{count.motion}}
            </div>
          </el-tooltip>
        </div>
      </l-control>

      <l-tile-layer
        v-for="(m,mk) in availableMaps"
        :key="'tsmap'+mk"
        :name="m.name"
        layer-type="base"
        :visible="m.id === selectedMap"
        :subdomains="m.subdomains"
        :url="m.url"
      ></l-tile-layer>

      <l-layer-group layer-type="overlay" name="Áreas">
        <template v-if="showGeofences && !store.getters['geofences/isEditing']">
          <kore-fence
            v-for="(f) in store.getters['geofences/fenceList']"
            :key="f.id"
            :geofence="f">
          </kore-fence>
        </template>
        <template v-if="!store.getters['geofences/isEditing']">
          <kore-fence
            v-for="(f) in store.getters['geofences/anchorList']"
            :key="f.id"
            :color="'#ff0000'"
            :geofence="f">
          </kore-fence>
        </template>
        <template v-if="store.getters['geofences/isEditing']">
          <l-polyline
  :key="'polyline-'+store.getters['geofences/getLatLngs'].length + '-line'"
  v-if="store.state.geofences.mapPointEditingType==='LINESTRING' && store.state.geofences.mapPointEditingParams.length>0"
  :lat-lngs="store.getters['geofences/getLatLngs']"
  :color="'#05a7e3'">
</l-polyline>

<l-polygon
  :key="'polyline-'+store.getters['geofences/getLatLngs'].length + '-polygon'"
  :no-clip="true"
  v-else-if="store.state.geofences.mapPointEditingType==='POLYGON' && store.state.geofences.mapPointEditingParams.length>0"
  :lat-lngs="store.getters['geofences/getLatLngs']"
  :fill-opacity="0.15"
  :fill="true"
  :fill-color="'#05a7e3'"
  :color="'#05a7e3'">
</l-polygon>

<l-circle
  :key="'circle-'+store.getters['geofences/getLatLngs'].length"
  v-else-if="store.state.geofences.mapPointEditingType==='CIRCLE' && store.state.geofences.mapPointEditingParams.length===3"
  :lat-lng="[store.state.geofences.mapPointEditingParams[0],store.state.geofences.mapPointEditingParams[1]]"
  :radius="parseFloat(store.state.geofences.mapPointEditingParams[2])"
  :fill="true"
  :fill-opacity="0.15"
  :fill-color="'#05a7e3'"
  :color="'#05a7e3'">
</l-circle>

        </template>
      </l-layer-group>

      <l-layer-group layer-type="overlay" name="Carros" ref="carLayer" :attribution="'Carros'">
        <l-polyline
          v-if="store.state.devices.trail!==false"
          :lat-lngs="store.getters['devices/getTrails']"
          :color="'#05a7e3'">
        </l-polyline>        
        <kore-canva-marker
          :map="map"
          :zoom="zoom"
          @click="markerClick"
          @mouseover="markerOver"
          @mouseout="markerOut"
          @contextmenu="markerContext">
        </kore-canva-marker>       
      </l-layer-group>
   <l-layer-group
      v-if="routePoints.length>0 && store.state.devices.showRoutes"
      layer-type="overlay"
      name="Rota"
      :attribution="'Rota'"
  >
    <l-polyline v-if="showRoutePoints" :lat-lngs="cptPoints" :color="'#05a7e3'"></l-polyline>

    <kore-canva-point v-if="showRouteMarkers" :points="routePoints" @click="openMarkInfo($event)"></kore-canva-point>

    <template v-if="showRoutePoints">
      <template v-for="(p,k) in routePoints" :key="'mkrs-'+k">
        <kore-marker v-if="k===0 || k===routePoints.length-1" :name="(k===0)?'start':(k===routePoints.length-1)?'end':'point'" :position="p" :type="(k===0)?'start':(k===routePoints.length-1)?'end':'point'"  @click="openMarkInfo($event)"></kore-marker>
      </template>
    </template>
  </l-layer-group>

    </LMap>
  </div>
</div>
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
import 'element-plus/es/components/radio/style/css'
import 'element-plus/es/components/dropdown/style/css'
import 'element-plus/es/components/dropdown-item/style/css'
import 'element-plus/es/components/dropdown-menu/style/css'

import {ElMessage,ElMessageBox,ElTooltip,ElRadio,ElDropdown,ElDropdownMenu,ElDropdownItem,ElNotification,ElSwitch,ElButton,ElInput} from "element-plus";

import { LMap,LTileLayer,LControl,LLayerGroup,LPolyline,LCircle,LPolygon } from "@vue-leaflet/vue-leaflet";
import ResizeObserver from 'resize-observer-polyfill';
import KoreMarker from "./kore-marker";
import KoreFence from "./kore-fence";
import KoreCanvaMarker from "../test/CanvaMarker";
import KoreCanvaPoint from "../test/CanvaPoints"
import {computed, watch,ref, onMounted, onUnmounted, inject,getCurrentInstance} from "vue";  // Adicionado onUnmounted
import {useStore} from 'vuex';
import router from "../../routes";
import KT from "../func/kt";
import actAnchor from "../func/actAnchor";
import L from 'leaflet';
// import axios from 'axios';

// const searchQuery = ref('');
// const searchVisible = ref(false);

const store = useStore();
const app = getCurrentInstance().appContext.app;

const carLayer = ref(null);
const focusLayer = ref(null);
import {useRoute} from 'vue-router';

const route = useRoute();

app.provide("focusLayer",focusLayer);

// const searchAddress = async () => {
// if (!searchQuery.value) {
//   ElMessage.warning('Digite um endereço para buscar.');
//   return;
// }

// try {
//   const response = await axios.get('https://nominatim.openstreetmap.org/search', {
//     params: {
//       q: searchQuery.value,
//       format: 'json',
//       addressdetails: 1,
//       limit: 1
//     }
//   });

//   if (response.data.length === 0) {
//     ElMessage.error('Endereço não encontrado.');
//     return;
//   }

//   const location = response.data[0];
//   const latLng = [parseFloat(location.lat), parseFloat(location.lon)];
//   center.value = latLng;

//   showDevicesInArea(latLng);

//   if (map.value) {
//     map.value.leafletObject.flyTo(latLng, 16);
//   }
// } catch (error) {
//   ElMessage.error('Erro ao buscar o endereço.');
// }
// };

// const fetchSuggestions = async (queryString, cb) => {
// if (!queryString) {
//   return cb([]);
// }

// try {
//   const response = await axios.get('https://nominatim.openstreetmap.org/search', {
//     params: {
//       q: queryString,
//       format: 'json',
//       addressdetails: 1,
//       limit: 5
//     }
//   });

//   const results = response.data.map(location => ({
//     value: location.display_name,
//     latLng: [parseFloat(location.lat), parseFloat(location.lon)]
//   }));

//   cb(results);
// } catch (error) {
//   console.error('Erro ao buscar sugestões:', error);
//   cb([]);
// }
// };

// const handleSelect = (item) => {
// center.value = item.latLng;

// showDevicesInArea(item.latLng);

// if (map.value) {
//   map.value.leafletObject.flyTo(item.latLng, 16);
// }
// };

// const showDevicesInArea = (latLng) => {
// console.log('Mostrar dispositivos na área de:', latLng);
// };

// const showSearch = () => {
// searchVisible.value = true;
// };

// // const hideSearch = () => {
// // setTimeout(() => {
// //   searchVisible.value = false;
// // }, 3000); // Oculta a pesquisa após 3 segundos
// // };

// // const toggleSearch = () => {
// // searchVisible.value = !searchVisible.value;
// // };

const openMarkInfo = (e)=>{
console.log('openMarkInfo', e);
}

watch(()=> store.getters['mapPref']('name'),()=>{
carLayer.value?.leafletObject?.eachLayer((layer)=>{
  layer.setLabel({name: store.getters['mapPref']('name'),plate: store.getters['mapPref']('plate'),status: store.getters['mapPref']('status')});
});
})

watch(()=> store.getters['mapPref']('plate'),()=>{
carLayer.value?.leafletObject?.eachLayer((layer)=>{
  layer.setLabel({name: store.getters['mapPref']('name'),plate: store.getters['mapPref']('plate'),status: store.getters['mapPref']('status')});
});
})

watch(()=> store.getters['mapPref']('status'),()=>{
carLayer.value?.leafletObject?.eachLayer((layer)=>{
  layer.setLabel({name: store.getters['mapPref']('name'),plate: store.getters['mapPref']('plate'),status: store.getters['mapPref']('status')});
});
})

watch(() => store.state.devices.toggleCalor, (newVal) => {
showMapadeCalor.value = newVal;
if (newVal) {
  showCalorLayer();
} else {
  hideCalorLayer();
}
});

watch(() => store.state.devices.togglePontos, (newVal) => {
showPontos.value = newVal;
if (newVal) {
  showPontosLayer();
} else {
  hidePontosLayer();
}
});


watch(() => store.state.devices.togglePontosCorrelacao, (newVal) => {
showPontosCorrelacao.value = newVal;
if (newVal) {
  showPontosCorrelacaoLayer();
} else {
  hidePontosCorrelacaoLayer();
}
});


watch(() => store.state.devices.showCalorCorrelacao, (newVal) => {
showMapadeCalorCorrelacao.value = newVal;
if (newVal) {
  showMapadeCalorCorrelacaoLayer();
} else {
  hideCalorCorrelacaoLayer();
}
});

window.addEventListener("keydown",(e)=>{
if(e.code==='ControlLeft'){
  carLayer.value?.leafletObject?.eachLayer((layer)=>{
    layer.setPressed(true);
  });
}
});

window.addEventListener("keyup",(e)=>{
if(e.code==='ControlLeft'){
  carLayer.value?.leafletObject?.eachLayer((layer)=>{
    layer.setPressed(false);
  });
}
});

const closeRoutes = () => {
store.commit("devices/setRoute", false);
updateRoute([]);
if(route.query.deviceId){
  window.location = route.path;
} else {
  window.location.reload();
}
}

// Removido - era usado apenas para exibir o círculo de precisão GPS
// const dPosition = computed(()=>{
// if(route.params.deviceId) {
//   return store.getters['devices/getPosition'](parseInt(route.params.deviceId));
// }else{
//   return false;
// }
// })



const zoom = ref(10);
const map = ref(null);

const mapContainer = ref(null);

const routePoints = ref([]);
const showRoutePoints = ref(true);
const showRouteMarkers = ref(false);
const showMapadeCalor = ref(false);
const showPercurso = ref(false);
const showPontos = ref(false);
const showPontosCorrelacao = ref(false);
const showMapadeCalorCorrelacao = ref(false);

app.provide("showRouteMarkers",showRouteMarkers);
app.provide("showMapadeCalor",showMapadeCalor);
app.provide("showPercurso",showPercurso);
app.provide("showPontos",showPontos);
app.provide("showPontosCorrelacao",showPontosCorrelacao); 

const eyeFilter = ref('');
let resizeObserver = null;

const handleMapInvalidate = () => {
  if (map.value?.leafletObject) {
    requestAnimationFrame(() => {
      map.value?.leafletObject?.invalidateSize()
    })
  }
}

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    if (map.value?.leafletObject?.invalidateSize) {
      map.value.leafletObject.invalidateSize()
    }
  })

  if (mapContainer.value) {
    resizeObserver.observe(mapContainer.value)
  }

  window.addEventListener('map:invalidate', handleMapInvalidate)
})

onUnmounted(() => {
  if (mapContainer.value && resizeObserver) {
    resizeObserver.unobserve(mapContainer.value)
  }
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('map:invalidate', handleMapInvalidate)
})

const _availableTypes = ref([
{key: 'default',name: 'Padrão'},
{key: 'arrow',name: 'Seta'},
{key: 'person',name: 'Pessoas'}
]);

const center = ref([-29.942484, -50.990526]);
const zoomForce = ref(3);

const cptPoints = computed(() => {
return routePoints.value.map(p => [p[0], p[1]]);
});

const changeMap = (id)=>{
  let map = 1;
  switch(id){
    case 1:
      map = 'googleST';
      break;
    case 2:
      map = 'googleTR';
      break;
    case 3:
      map = 'googleSN';
      break;
  }

  store.dispatch("setMap",map);
}

const mapReady = (e)=>{
console.log('mapReady', e);
window.$map = e;
}

const zoomUpdated = (z) => {
zoom.value = z;
}

const selectedMap = computed(()=>{
const userMap = (store.state.auth && store.state.auth['map'])?store.state.auth['map']:undefined;
const serverMap = (store.state.server.serverInfo && store.state.server.serverInfo['map'])?store.state.server.serverInfo['map']:'openstreet'

const map = userMap || serverMap;

  switch(map){
    case "googleSN":
      return 3;
    case "googleTR":
      return 2;
    case "googleST":
      return 1;
   }


  return 1;

});

const showGeofences = computed({
  get: () => {
    // Usa o getter do store que já verifica localStorage e defaults do servidor
    return store.getters['mapPref']('geofences');
  },
  set: () => {
    // Quando o usuário mudar, salva no store (que salva no localStorage)
    store.dispatch('setMapPref', 'geofences');
  }
});

const availableMaps = ref([
// {id: 1, name: 'MapBox',url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYW5nZWxvZmFyaWFzIiwiYSI6ImNsNTFiczBreTAwb2wzam45MW9yNXhuMGYifQ.gvxk36N9LnrU72igP4ME0A'},
{id: 1, name: 'Google Maps',subdomains: ['mt0','mt1','mt2','mt3'],url: 'https://{s}.google.com/vt/lyrs=m@221097413&x={x}&y={y}&z={z}&hl=pt-BR'},
{id: 2, name: 'Google Maps Sat',subdomains: ['mt0','mt1','mt2','mt3'],url: 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=pt-BR'},
{id: 3, name: 'Google Maps Trafego',subdomains: ['mt0','mt1','mt2','mt3'],url: 'https://{s}.google.com/vt/lyrs=m@221097413,traffic&x={x}&y={y}&z={z}&hl=pt-BR'},
]);

const availableTypes = computed(()=>{
if(eyeFilter.value.length>3) {
  return _availableTypes.value.filter((t) => {
    return t.name.toLowerCase().match(eyeFilter.value.toLowerCase());
  });
}else{
  return _availableTypes.value;
}
});

const eyeAll = (b)=>{
_availableTypes.value.forEach((t)=>{
  if(store.getters['devices/isHiddenFilter'](t.key)!==b){
    store.dispatch('devices/toggleHiddenFilter',t.key);
  }
});
}

const refreshMap = () => {
window.location.reload();
};

const markerOut = ()=>{
window.$hideTip();
}

const markerOver = (e)=>{
const deviceId = (e.target)?e.target.options.id:e;
const device = store.getters['devices/getDevice'](deviceId);
if (!map.value?.leafletObject) return;
const markPoint = map.value.leafletObject.latLngToContainerPoint(e.target._latlng);
const left = markPoint.x+(router.currentRoute.value.meta.shown?553:73);
const top = markPoint.y;
window.$showTip({left: left+'px',top: (top)+'px'},device.name,true);
}

const flyToDevice = (device) =>{
const position = store.getters["devices/getPosition"](device.id);
const zoom = (store.state.server.serverInfo.attributes && store.state.server.serverInfo.attributes['web.selectZoom'])?store.state.server.serverInfo.attributes['web.selectZoom']:16;
if(position){
  setTimeout(()=> {
    setTimeout(() => {
      map.value?.leafletObject?.flyTo([position.latitude, position.longitude],zoom,{animate: true,duration: 1.5});
    }, 100);
  },100);
}
}


const markerClick = (e) =>{
const deviceId = (e.target)?e.target.options.id:e;
router.push('/devices/'+deviceId);
const device = store.getters['devices/getDevice'](deviceId);
store.commit("devices/setFollow", deviceId);
device.icon.bringToFront();
flyToDevice(device);
}


const updateRoute = (points,show=true) =>{

if(points.length) {
store.commit("devices/setRoute", true);
}


routePoints.value = points;
showRoutePoints.value = show;

if(points.length>0) {
let tmp = [];
for(var p in points){
  tmp.push([points[p][0],points[p][1]]);
}

setTimeout(() => {

  // eslint-disable-next-line no-undef
  const bds = L.latLngBounds(tmp);
  //map.value.leafletObject.flyTo([points[0][0],points[0][1]], 12, {animate: true, duration: 1.5});
  map.value?.leafletObject?.fitBounds(bds);
}, 300);
}
}


const setMapCenter = (pos)=>{
map.value?.leafletObject?.panTo(pos);
}
window.$setMapCenter = setMapCenter;

const mapClick = (e)=>{
if(e.latlng && store.state.geofences.mapEditing!==0){
  if(store.state.geofences.mapPointEditingType==='CIRCLE'){
    if(store.state.geofences.mapPointEditing!==2){
      store.dispatch("geofences/setupCircle",[e.latlng.lat, e.latlng.lng, 10])
    }else {
      store.dispatch("geofences/completeCircle")
    }
  }else if(store.state.geofences.mapPointEditingType==='LINESTRING'){
    store.dispatch("geofences/setupLine",[e.latlng.lat, e.latlng.lng])
  }else if(store.state.geofences.mapPointEditingType==='POLYGON'){
    store.dispatch("geofences/setupPolygon",[e.latlng.lat, e.latlng.lng])
  }
}
}

const mapMove = (e)=>{
if(e.latlng && store.state.geofences.mapPointEditing === 2 && store.state.geofences.mapPointEditingType === 'CIRCLE' && store.state.geofences.mapPointEditingParams.length===3){
  store.dispatch("geofences/setCircleRadius",L.latLng(store.getters["geofences/getCirclePosition"]).distanceTo(e.latlng));
}
}

const markerContext =  async (evt, e) => {
let addSep = false;

const deviceId = (evt.target && evt.target.options && evt.target.options.id) ? evt.target.options.id : e;
const user = store.state.auth;
const device = store.getters["devices/getDevice"](deviceId);
const position = store.getters["devices/getPosition"](deviceId)
let availableSaved = [];
let commands = [];

if (device.status !== 'online') {
  commands.push({
    text: KT('actions.offline'), cb: () => {
      ElMessageBox.confirm(
          KT('actions.offline_message', device),
          'Warning',
          {
            confirmButtonText: KT('OK'),
            cancelButtonText: KT('Cancel'),
            type: 'warning',
          }
      ).then(() => {
        console.log("OK")
      }).catch(() => {
        ElMessage.error(KT('userCancel'));
      })
    }
  });
} else {
  window.$traccar.getTypeCommands(deviceId).then((response) => {
    const availableTypesCommand = response.data;
    availableTypesCommand.forEach((c) => {
      commands.push({
        text: KT('actions.' + c.type), cb: () => {
          ElMessageBox.confirm(
              KT('device.confirm_command', device),
              'Warning',
              {
                confirmButtonText: KT('OK'),
                cancelButtonText: KT('Cancel'),
                type: 'warning',
              }
          ).then(() => {
            window.$traccar.sendCommand({deviceId: deviceId, type: c.type});
            ElNotification({
              title: KT('success'),
              message: KT('device.command_sent'),
              type: 'success',
            });
          }).catch(() => {
            ElMessage.error(KT('userCancel'));
          })
        }
      });
    });
    window.$traccar.getAvailableCommands(deviceId).then((response) => {
      availableSaved = response.data;

      if (commands.length > 0 && availableSaved.length > 0) {
        commands.push({text: 'separator'});
      }

      availableSaved.forEach((c) => {
        commands.push({
          text: c.description, cb: () => {
            ElMessageBox.confirm(
                KT('device.confirm_command', device),
                'Warning',
                {
                  confirmButtonText: KT('OK'),
                  cancelButtonText: KT('Cancel'),
                  type: 'warning',
                }
            ).then(() => {
              window.$traccar.sendCommand({...c, ...{deviceId: deviceId}});
              ElNotification({
                title: KT('success'),
                message: KT('device.command_sent'),
                type: 'success',
              });
            }).catch(() => {
              ElMessage.error(KT('userCancel'));
            })
          }
        });
      });
    })
  });
}

let tmp = [];
tmp.push({
  text: KT('device.details'), cb: () => {
    router.push('/devices/' + deviceId);
  }
});

tmp.push({
  text: KT('device.zoom'), cb: () => {
    flyToDevice(device);
  }
});

if (store.state.devices.isFollowingId === deviceId) {
  tmp.push({
    text: KT('device.unfollow'), cb: () => {
      store.commit("devices/setFollow", 0)
    }
  });
} else {
  tmp.push({
    text: KT('device.follow'), cb: () => {
      store.commit("devices/setFollow", deviceId);
      flyToDevice(device);
    }
  });
}

if (store.state.devices.trail === deviceId) {
  tmp.push({
    text: KT('device.untrail'), cb: () => {
      store.commit("devices/setTrail", false)
    }
  });
} else {
  tmp.push({
    text: KT('device.trail'), cb: () => {
      store.commit("devices/setTrail", deviceId);
      flyToDevice(device);
    }
  });
}

let shareOpen = [];
shareOpen.push({
  text: KT('device.openMaps'),
  cb: () => {
      const elm = document.createElement("a");
      elm.target = "_blank";
      elm.href = 'http://maps.google.com/maps?q=loc:' + position.latitude + "," + position.longitude;
      document.body.appendChild(elm);
      elm.click();
      document.body.removeChild(elm);
    }
});

shareOpen.push({
  text: KT('device.openStreet'),
  cb: () => {
    const link = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + position.latitude + ',' + position.longitude + '&heading=' + position.course + '&pitch=10&fov=80';
      const elm = document.createElement("a");
      elm.target = "_blank";
      elm.href = link;
      document.body.appendChild(elm);
      elm.click();
    }
});

tmp.push({
  text: KT('device.openExternal'),
  submenu: shareOpen
});

let shares = [];

if (store.state.server.isPlus && store.getters.advancedPermissions(25)) {
  shares.push({
    text: KT('device.shareLink'),
    cb: () => {
      editShareRef.value.newShare(device.id);
    }
  });
}

shares.push({
  text: KT('device.shareMaps'),
  cb: () => {
    if (navigator.share) {
      navigator.share({
        title: device.name,
        url: 'http://maps.google.com/maps?q=loc:' + position.latitude + "," + position.longitude
      }).then(() => {
        console.log('Thanks for sharing!');
      }).catch(console.error);
    } else {
      const elm = document.createElement("input");
      elm.value = 'http://maps.google.com/maps?q=loc:' + position.latitude + "," + position.longitude;
      document.body.appendChild(elm);
      elm.select();
      document.execCommand("copy");
      document.body.removeChild(elm);
      ElMessage.success('Copiado para área de transferência');
    }
  }
});

shares.push({
  text: KT('device.shareStreet'),
  cb: () => {
    const link = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + position.latitude + ',' + position.longitude + '&heading=' + position.course + '&pitch=10&fov=80';
    if (navigator.share) {
      navigator.share({
        title: device.name,
        url: link
      }).then(() => {
        console.log('Thanks for sharing!');
      }).catch(console.error);
    } else {
      const elm = document.createElement("input");
      elm.value = link;
      document.body.appendChild(elm);
      elm.select();
      document.execCommand("copy");
      document.body.removeChild(elm);
      ElMessage.success('Copiado para área de transferência');
    }
  }
});

tmp.push({
  text: KT('device.share'),
  submenu: shares
});

addSep = true;

if (store.state.server.isPlus && store.getters.advancedPermissions(9)) {
  if(addSep) {
    tmp.push({text: 'separator'});
    addSep = false;
  }
  const isAnchored = store.getters['geofences/isAnchored'](device.id);
  tmp.push({
    text: KT((isAnchored) ? 'actions.anchorDisable' : 'actions.anchorEnable'), cb: () => {
      actAnchor(device.id);
    }
  });
}

if (position.attributes.blocked && store.getters.advancedPermissions(11)) {
  if(addSep) {
    tmp.push({text: 'separator'});
    addSep = false;
  }
  tmp.push({
    disabled: (device.status !== 'online'),
    text: KT('device.unlock'), cb: () => {
      ElMessageBox.confirm(
          KT('device.confirm_unlock', device),
          'Warning',
          {
            confirmButtonText: KT('OK'),
            cancelButtonText: KT('Cancel'),
            type: 'warning',
          }
      ).then(() => {
        const changeNative = availableSaved.find((a) => a.attributes['tarkan.changeNative'] && a.attributes['tarkan.changeNative'] === 'engineResume');
        if (changeNative) {
          window.$traccar.sendCommand({...changeNative, ...{deviceId: deviceId}});
        } else {
          window.$traccar.sendCommand({deviceId: deviceId, type: "engineResume"});
        }
        ElNotification({
          title: KT('success'),
          message: KT('device.command_sent'),
          type: 'success',
        });
      }).catch(() => {
        ElMessage.error(KT('userCancel'));
      })
    }
  });
} else if (store.getters.advancedPermissions(10)) {
  if(addSep) {
    tmp.push({text: 'separator'});
    addSep = false;
  }
  tmp.push({
    disabled: (device.status !== 'online'),
    text: KT('device.lock'), cb: () => {
      ElMessageBox.confirm(
          KT('device.confirm_lock', device),
          'Warning',
          {
            confirmButtonText: KT('OK'),
            cancelButtonText: KT('Cancel'),
            type: 'warning',
          }
      ).then(() => {
        const changeNative = availableSaved.find((a) => a.attributes['tarkan.changeNative'] && a.attributes['tarkan.changeNative'] === 'engineStop');
        if (changeNative) {
          window.$traccar.sendCommand({...changeNative, ...{deviceId: deviceId}});
        } else {
          window.$traccar.sendCommand({deviceId: deviceId, type: "engineStop"});
        }
        ElNotification({
          title: KT('success'),
          message: KT('device.command_sent'),
          type: 'success',
        });
      }).catch(() => {
        ElMessage.error(KT('userCancel'));
      })
    }
  });
}

if (store.getters.advancedPermissions(12)) {
  if(addSep) {
    tmp.push({text: 'separator'});
    addSep = false;
  }
  tmp.push({
    text: KT('device.send_command'),
    submenu: commands
  });
}

let attributions = [];
attributions.push({
  text: KT('geofence.geofences'), cb: () => {
    linkObjectsRef.value.showObjects({deviceId: device.id, type: 'geofences'});
  }
});

attributions.push({
  text: KT('attribute.computedAttributes'), cb: () => {
    linkObjectsRef.value.showObjects({deviceId: device.id, type: 'attributes'});
  }
});

attributions.push({
  text: KT('driver.drivers'), cb: () => {
    linkObjectsRef.value.showObjects({deviceId: device.id, type: 'drivers'});
  }
});

attributions.push({
  text: KT('command.savedCommands'), cb: () => {
    linkObjectsRef.value.showObjects({deviceId: device.id, type: 'commands'});
  }
});

attributions.push({
  text: KT('notification.notifications'), cb: () => {
    linkObjectsRef.value.showObjects({deviceId: device.id, type: 'notifications'});
  }
});

attributions.push({
  text: KT('maintenance.maintenances'), cb: () => {
    linkObjectsRef.value.showObjects({deviceId: device.id, type: 'maintence'});
  }
});

if (store.getters.advancedPermissions(14)) {
  tmp.push({
    text: KT('device.attributions'),
    submenu: attributions
  });

  tmp.push({
    text: KT('device.edit'), cb: () => {
      editDeviceRef.value.editDevice(deviceId);
    }
  });
}
if (store.state.server.isPlus && user.administrator) {
  tmp.push({
    text: KT('device.logs'), cb: () => {
      logObjectsRef.value.showLogs({deviceId: deviceId});
    }
  });
}
contextMenuRef.value.openMenu({evt: evt.originalEvent || evt, menus: tmp})
};

const contextMenuRef = inject("contextMenu");
const logObjectsRef = inject("log-objects");
const linkObjectsRef = inject("link-objects");
const editSharesRef = inject("edit-shares");
const editShareRef = inject("edit-share");
const editDeviceRef = inject("edit-device");

app.provide('markerClick', markerClick);
app.provide('flyToDevice',flyToDevice)
app.provide('updateRoute',updateRoute)
app.provide('markerContext',markerContext);


const showPercursoLayer = () => {
showPercurso.value = true;
};

const hidePercursoLayer = () => {
showPercurso.value = false;
};

const showCalorLayer = () => {
showMapadeCalor.value = true;
};

const hideCalorLayer = () => {
showMapadeCalor.value = false;
};
const showMarkersLayer = () => {
showRouteMarkers.value = true;
};
const hideMarkersLayerr = () => {
showRouteMarkers.value = false;
};

const showPontosLayer = () => {
showPontos.value = true;
};

const hidePontosLayer = () => {
showPontos.value = false;
};  


const showPontosCorrelacaoLayer = () => {
showPontosCorrelacao.value = true;
};

const hidePontosCorrelacaoLayer = () => {
showPontosCorrelacao.value = false;
};

const showMapadeCalorCorrelacaoLayer = () => {
showMapadeCalorCorrelacao.value = true;
};

const hideCalorCorrelacaoLayer = () => {
showMapadeCalorCorrelacao.value = false;
};


app.provide("showPercursoLayer", showPercursoLayer);
app.provide("hidePercursoLayer", hidePercursoLayer);
app.provide("showCalorLayer", showCalorLayer);
app.provide("hideCalorLayer", hideCalorLayer);
app.provide("showMarkersLayer", showMarkersLayer);
app.provide("hideMarkersLayerr", hideMarkersLayerr);
app.provide("showPontosLayer", showPontosLayer);
app.provide("hidePontosLayer", hidePontosLayer);
app.provide("showPontosCorrelacaoLayer", showPontosCorrelacaoLayer);
app.provide("hidePontosCorrelacaoLayer", hidePontosCorrelacaoLayer);
</script>


<style scoped>
.map-wrapper {
position: relative;
width: 100%;
height: 100%;
overflow: hidden;
z-index: 0; /* Garantir que o mapa tenha um z-index menor */
}

#map-container {
position: relative;
width: 100%;
height: 100%;
overflow: hidden;
z-index: 0; /* Garantir que o contêiner do mapa tenha um z-index menor */
}


.search-container {
display: flex;
align-items: center;
}

.search-container .el-input__inner {
font-size: 18px; /* Mantém o tamanho da fonte */
font-weight: bold; /* Mantém o texto em negrito */
}

.autocomplete-results .el-autocomplete-suggestion__wrap {
font-size: 22px; /* Aumenta o tamanho da fonte das sugestões */
font-weight: bold; /* Torna a fonte das sugestões em negrito */
}

</style>
