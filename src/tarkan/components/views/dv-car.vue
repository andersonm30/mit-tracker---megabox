<template>
  <div
      :class="{car: true,isCar: props.selected}"
      style="">
    <img class="base" :src="getImagePath(props.img, 'base')">
    <img v-if="props.color1" class="color" :style="'filter:'+props.filter1" :src="getImagePath(props.img, 'color1')">
    <img v-if="props.color2" class="color" :style="'filter:'+props.filter2" :src="getImagePath(props.img, 'color2')">
  </div>
</template>

<script setup>

import {defineProps} from 'vue';
const props = defineProps(['selected','img','color1','color2','filter1','filter2','isV2']);

// Função para determinar o caminho correto das imagens
const getImagePath = (img, type) => {
  if (props.isV2) {
    return `/img/cars-v2/${img}_${type}.png`;
  }
  return `/img/cars/${img}_${type}.png`;
};



</script>

<style scoped>
.car {
  cursor: pointer;
  margin: 5px;
  border: silver 1px dotted;
  border-radius: 10px;
  padding: 15px 10px;
  width: calc(13.7% - 10px);
  height: 60px;
  display: flex;
  align-content: center;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;
}

.car .base{
  height: auto;
  max-height: 60px;
  max-width: 100%;
  position: absolute;
  object-fit: contain;
}


.car .color{
  height: auto;
  max-height: 60px;
  max-width: 100%;
  position: absolute;
  object-fit: contain;
}


.isCar{
  border: #05a7e3 1px solid !important;
}


</style>