<script>

import {inject, onMounted, onBeforeUnmount, ref, watch} from "vue";
import {GLOBAL_LEAFLET_OPT, WINDOW_OR_GLOBAL} from "@vue-leaflet/vue-leaflet/src/utils";


export default{
  name: 'Kore-CanvaPoints',
  props: {
    points: { type: Array, default: () => [] },
    zoom: { type: Number, default: 10 },
    map: { type: Object, default: null }
  },
  // eslint-disable-next-line no-unused-vars
  setup(props, context){




    let L = WINDOW_OR_GLOBAL.L;

    const useGlobalLeaflet = inject(GLOBAL_LEAFLET_OPT);
    const addLayer = inject("addLayer");

    // 🛡️ MELHORIA: Usar Map para melhor performance de lookup
    const markerList = ref([]);
    const markerById = ref(new Map());

    // 🛡️ MELHORIA: Validação de point data
    const isValidPoint = (p) => {
      if (!p || !Array.isArray(p)) {
        console.warn('⚠️ [CanvaPoints] Point inválido:', p);
        return false;
      }
      
      const lat = p[0];
      const lng = p[1];
      
      if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) {
        console.warn('⚠️ [CanvaPoints] Coordenadas inválidas:', { lat, lng });
        return false;
      }
      
      // Validar range geográfico
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn('⚠️ [CanvaPoints] Coordenadas fora do range:', { lat, lng });
        return false;
      }
      
      return true;
    };




    onMounted(async () => {
      console.log('🔧 [CanvaPoints] Montando componente');
      
      try {
        L = useGlobalLeaflet
            ? WINDOW_OR_GLOBAL.L
            : await import("leaflet/dist/leaflet-src.esm");

        // Validar se L.CanvasMarker está disponível
        if (!L.CanvasMarker) {
          console.error('❌ [CanvaPoints] L.CanvasMarker não disponível');
          return;
        }

        // Renderizar points iniciais com validação
        if (Array.isArray(props.points) && props.points.length > 0) {
          console.log(`📍 [CanvaPoints] Renderizando ${props.points.length} pontos`);
          props.points.forEach((p) => {
            if (isValidPoint(p)) {
              addPoint(p);
            }
          });
        }
        
        console.log('✅ [CanvaPoints] Componente montado');
      } catch (error) {
        console.error('❌ [CanvaPoints] Erro no onMounted:', error);
      }
    });

    // 🛡️ MELHORIA: Cleanup completo de recursos
    onBeforeUnmount(() => {
      console.log('🧹 [CanvaPoints] Limpando recursos...');
      
      try {
        // Remover todos os markers
        if (markerList.value.length > 0) {
          markerList.value.forEach((marker) => {
            try {
              if (marker && marker.remove) {
                marker.remove();
              }
            } catch (e) {
              console.warn('⚠️ [CanvaPoints] Erro ao remover marker:', e);
            }
          });
        }
        
        // Limpar arrays e maps
        markerList.value = [];
        markerById.value.clear();
        
        console.log('✅ [CanvaPoints] Recursos limpos');
      } catch (error) {
        console.error('❌ [CanvaPoints] Erro no cleanup:', error);
      }
    });

    // 🛡️ MELHORIA: Watch para atualizar pontos dinamicamente
    watch(() => props.points, (newPoints, oldPoints) => {
      if (!L || !L.CanvasMarker) return;
      
      console.log(`🔄 [CanvaPoints] Atualizando pontos: ${oldPoints?.length || 0} → ${newPoints?.length || 0}`);
      
      // Remover todos os pontos antigos
      markerList.value.forEach(marker => {
        try { marker.remove(); } catch (e) { /* cleanup */ }
      });
      markerList.value = [];
      markerById.value.clear();
      
      // Adicionar novos pontos com validação
      if (Array.isArray(newPoints)) {
        newPoints.forEach(p => {
          if (isValidPoint(p)) {
            addPoint(p);
          }
        });
      }
    }, { deep: true });


    // 🛡️ MELHORIA: addPoint com validação robusta e error handling
    const addPoint = (d) => {
      try {
        // Validação já feita por isValidPoint antes de chamar
        if (!d || !L || !L.CanvasMarker) {
          console.warn('⚠️ [CanvaPoints] Ambiente inválido para adicionar ponto');
          return null;
        }

        const lat = Number(d[0]);
        const lng = Number(d[1]);
        const rotate = d[3] ? Number(d[3]) : 0;
        const id = d[2] || `point_${Date.now()}_${Math.random()}`;

        const latlng = L.latLng(lat, lng);

        const tmp = new L.CanvasMarker([latlng], [1000], {
          type: 'pointer',
          minZoom: 10,
          radius: 20,
          id: id,
          img: {
            rotate: rotate,
            offset: {x: 0, y: 0},
          },
        })
        .on("click", (e) => {
          context.emit('click', e);
        })
        .on("mouseover", (e) => {
          context.emit('mouseover', e);
        })
        .on("mouseout", (e) => {
          context.emit('mouseout', e);
        })
        .on("contextmenu", (e) => {
          context.emit('contextmenu', e);
        });

        const methods = {};

        addLayer({
          ...props,
          ...methods,
          leafletObject: tmp
        });

        markerList.value.push(tmp);
        markerById.value.set(id, tmp);

        return tmp;
      } catch (error) {
        console.error('❌ [CanvaPoints] Erro ao adicionar ponto:', error, d);
        return null;
      }
    };



  },
  
  // Componente renderless - rendering é feito via Leaflet Canvas
  render() {
    return null;
  }
}

</script>