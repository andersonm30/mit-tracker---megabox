<template>
  <div id="pano">VIEW</div>
</template>

<script setup>
import {onMounted,watch,ref} from 'vue';
import {useRoute} from 'vue-router';
import {useStore} from 'vuex';
const route = useRoute();
const store = useStore();
const panorama = ref(null);
watch(()=> route.params.deviceId,()=>{
if(route.params.deviceId){
updatePosition();
}else{
store.dispatch("devices/toggleStreet");
}
})
const updatePosition = ()=>{
const position = store.getters['devices/getPosition'](parseInt(route.params.deviceId));
// eslint-disable-next-line no-undef
panorama.value.setPosition(new google.maps.LatLng(position.latitude, position.longitude));
panorama.value.setPov({heading: position.course,pitch: 10})
}
window.$updatePano = (id)=>{
if(id === parseInt(route.params.deviceId)){
  updatePosition();
}
};
// eslint-disable-next-line no-unused-vars
const initialize = ()=>{
if(route.params.deviceId) {
const position = store.getters['devices/getPosition'](parseInt(route.params.deviceId));
const fenway = {lat: position.latitude, lng: position.longitude};
// eslint-disable-next-line no-undef,no-unused-vars
panorama.value = new google.maps.StreetViewPanorama(
    document.getElementById("pano"),
    {
      addressControl: false,
      disableDefaultUI: true,
      disableDoubleClickZoom: true,
      position: fenway,
      pov: {
        heading: position.course,
        pitch: 10,
      },
    }
);
window.$pano = panorama.value;
}
//map.setStreetView(panorama);
}
onMounted(()=>{
if(!document.querySelector("#gmaps")) {

// pega a API dos atributos do servidor
const gkey = store.getters['server/getAttribute']('google_api');
console.log(gkey);
const tmp = document.createElement("script");
tmp.id = "gmaps"

if (gkey){
  tmp.src = "https://maps.googleapis.com/maps/api/js?key="+gkey+"&v=weekly&channel=2";  
}
else{
  tmp.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyAK9rvhahXGmNQs9KQs-gbx4etmqSiAewo&v=weekly&channel=2";  
}

// Condição: se o gkey for igual a vazio, pega a api desde arquivo mesmo, caso contrário pega do atributo do servidor

// para pegar a API do Street View aqui desse arquivo
// tmp.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyAlQFPiImltfUR2B7Z7hwXl23SoXw7jZBA&v=weekly&channel=2";

// para pegar a API do Street View dos atributos do servidor google_api
// tmp.src = "https://maps.googleapis.com/maps/api/js?key="+gkey+"&v=weekly&channel=2";

tmp.async = true;
tmp.onload = () => {
  initialize();
}
document.body.appendChild(tmp);
}else{
initialize();
}
})
</script>

<style scoped>
#pano{
position: absolute;
right: 0px;
bottom: 0px;
background: white;
z-index: 1003;
width: 380px;
height: 310px;
}
</style>