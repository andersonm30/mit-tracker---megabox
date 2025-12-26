<template>
  <div v-if="show" class="tooltip" :class="{ 'tooltip-device-item': tooltipSource === 'device-item' }" :style="{left: position.left,top: position.top}"> 
    <div v-html="text"></div>
  </div>
</template>

<script setup>

import {onMounted,ref} from "vue";

const show = ref(false);
const text = ref('');
const position = ref({left: 0,top: 0});
const tooltipSource = ref(null);


const showTip = (evt,txt,e=false,source=null)=>{
  if(e){
    position.value = evt;
  }else {
    const pos = evt.target.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Calcular posição inicial
    let left = pos.left + (pos.width / 2);
    let top = pos.top - 5;

    // Se vem de device.item, usar posicionamento específico
    if (source === 'device-item') {
      // Posicionar mais à direita para elementos da lista
      left = pos.right + 10;
      top = pos.top + (pos.height / 2);

      // Ajustar se sai pela direita
      if (left > viewport.width - 250) {
        left = pos.left - 10;
      }

      // Ajustar se sai por cima
      if (top < 50) {
        top = pos.bottom + 5;
      }

      // Ajustar se sai por baixo
      if (top > viewport.height - 50) {
        top = pos.top - 5;
      }
    } else {
      // Comportamento original para outros casos (veículos no mapa)
      // Para textos longos (endereços), ajustar posicionamento
      if (txt && txt.length > 30) {
        // Ajustar se o tooltip sai pela esquerda
        if (left < 200) {
          left = Math.max(150, pos.left + 10);
        }

        // Ajustar se o tooltip sai pela direita
        if (left > viewport.width - 200) {
          left = Math.min(viewport.width - 150, pos.right - 10);
        }
      }
    }

    position.value = {left: left + 'px', top: top + 'px'};
  }

  show.value = true;
  text.value = txt;
  tooltipSource.value = source;
}

const hideTip = ()=>{
  show.value = false;
  tooltipSource.value = null;
}


onMounted(()=>{
  window.$showTip = showTip;
  window.$hideTip = hideTip;
})

</script>


<style scoped>
.tooltip{
  /* ESTILO DARK PROFISSIONAL */
  background: rgba(0,0,0,0.88);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  color: #ffffff !important;
  font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 12px;
  padding: 6px 10px;
  position: absolute;
  z-index: 99999999999;
  transform: translate(-50%,-101%);
  min-width: auto;
  max-width: 320px;
  width: auto;
  white-space: nowrap;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tooltip .device-status {
  margin-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.3);
  padding-top: 10px;
  font-size: 14px;
  color: white !important;
}

.tooltip .device-status div {
  margin: 6px 0;
  white-space: nowrap;
  line-height: 1.6;
  color: white !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Estilos específicos para tooltips de device.item */
.tooltip-device-item {
  font-size: 11px !important;
  padding: 6px 8px !important;
  max-width: 280px !important;
  white-space: normal !important;
  text-align: left !important;
  transform: none !important;
  line-height: 1.3;
  word-break: break-word;
  border-radius: 4px !important;
}
</style>