<template>
  <div>
    <div id="ShowPercurso" style="width: 100%; height: 900px; position: relative;"></div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';

export default {
  setup() {
    const panorama = ref(null);
    const store = useStore();

    const updateIframeSrc = () => {
      const reportData = store.state.reports.reportData;
      const deviceId = reportData.deviceId;
      const startDate = reportData.date[0];
      const endDate = reportData.date[1];

      if (!deviceId || !startDate || !endDate) {
        console.error('Invalid report data parameters');
        return;
      }

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

      const iframe = document.createElement('iframe');
      iframe.src = `./mapa_percurso_parametro.php?deviceid=${deviceId}&data_inicial=${date1}&data_final=${date2}`;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.frameBorder = '0';

      const percursoDiv = document.getElementById('ShowPercurso');
      percursoDiv.innerHTML = '';
      percursoDiv.appendChild(iframe);

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
#ShowPercurso {
  position: relative;
  width: 100%;
  height: 900px;
  background: white;
}
</style>
