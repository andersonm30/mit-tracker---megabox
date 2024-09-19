<template>
  <div>
    <div id="showCalor" style="width: 100%; height: 900px; position: relative;"></div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';

export default {
  setup() {
    const panorama = ref(null);
    const store = useStore(); // Injeta o Vuex store

    const updateIframeSrc = () => {
      // Obtenha os dados do store conforme necessário
      const reportData = store.state.reports.reportData; // Acessa o reportData do módulo reports
      const deviceId = reportData.deviceId;
      const startDate = reportData.date[0];
      const endDate = reportData.date[1];

      console.log("dados iframe", reportData);
      console.log("dados store", store.state.reports);

      // Converta as datas para o formato ISO8601 UTC
      const toISODateUTC = (dateStr) => {
        const date = new Date(dateStr);
        if (isNaN(date)) return null;
        const pad = (num) => String(num).padStart(2, '0');
        return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}Z`;
      };

      const date1 = toISODateUTC(startDate);
      const date2 = toISODateUTC(endDate);

      if (!date1 || !date2) {
        console.error('Invalid date parameters');
        return;
      }

      // Cria um iframe
      const iframe = document.createElement('iframe');
      
      // Cria a URL com os parâmetros
      iframe.src = `./mapa_percurso_calor.php?deviceid=${deviceId}&data_inicial=${date1}&data_final=${date2}`;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.frameBorder = '0';

console.log("iframe-calor",iframe.src);

      // Remove o iframe existente, se houver
      const calorDiv = document.getElementById('showCalor');
      calorDiv.innerHTML = '';
      
      // Insere o novo iframe na div com ID 'percurso'
      calorDiv.appendChild(iframe);

      // Atualiza a referência reativa
      panorama.value = iframe;
    };

    onMounted(updateIframeSrc);

    watch(
      () => [store.state.reports.reportData.deviceId, store.state.reports.reportData.date[0], store.state.reports.reportData.date[1]],
      updateIframeSrc
    );

    return {
      panorama,
    };
  },
};
</script>

<style scoped>
#pano {
  position: absolute;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 1003;
  width: 380px;
  height: 310px;
}
#showCalor {
  position: absolute;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 1003;
  width: 380px;
  height: 310px;
}
</style>
