# Análise e Correção da Implementação do Cluster

## Status Atual

✅ **Dependência instalada**: `leaflet.markercluster@1.5.3` está no package.json  
✅ **CSS importado**: kore-map-dark.vue importa os estilos  
❌ **cluster.js não usado**: Arquivo existe mas não é importado  
❌ **Implementação manual incompleta**: CanvaMarker usa grid-based clustering  

## Problemas na Implementação Atual

### 1. CanvaMarker.vue (Linha 39)
```javascript
// PROBLEMA: Implementação manual de clustering
const clusterByKey = ref(new Map());  // Não usa L.MarkerClusterGroup
```

### 2. Função renderClustered (Linha 307)
```javascript
// PROBLEMA: Grid-based manual ao invés de usar leaflet.markercluster
const renderClustered = (devices, token) => {
  const buckets = new Map();  // Grid manual
  // ... código grid-based
}
```

### 3. Falta de integração com cluster.js
```javascript
// NÃO HÁ:
import 'leaflet.markercluster';
// ou
import '../test/cluster.js';
```

## Solução: Integração com L.MarkerClusterGroup

### Estratégia Híbrida (Melhor Abordagem)

**Por que híbrida?**
- CanvasMarker customizado precisa ser preservado (desenho em canvas)
- L.MarkerClusterGroup não suporta canvas markers nativamente
- Solução: Usar L.MarkerClusterGroup como container + CanvasMarker como children

### Implementação Corrigida

#### Passo 1: Importar cluster.js no CanvaMarker.vue

```javascript
// No início do <script>
import '../test/cluster.js';  // Carrega L.MarkerClusterGroup
```

#### Passo 2: Criar MarkerClusterGroup no onMounted

```javascript
let clusterGroup = null;

onMounted(async () => {
  // ... código existente ...
  
  // Criar cluster group
  clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 80,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    chunkedLoading: true,
    chunkInterval: 200,
    chunkDelay: 50,
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount();
      const label = count >= 100 ? "99+" : String(count);
      
      return L.divIcon({
        html: `<div class="marker-cluster-custom">
          <div class="marker-cluster-inner">
            <span>${label}</span>
          </div>
        </div>`,
        className: 'marker-cluster-wrapper',
        iconSize: new L.Point(40, 40)
      });
    }
  });
});
```

#### Passo 3: Substituir renderClustered

```javascript
const renderClustered = (devices, token) => {
  if (!clusterGroup) return;
  
  // Limpar cluster anterior
  clusterGroup.clearLayers();
  
  // Adicionar markers ao cluster
  for (const d of devices) {
    if (token !== lastRenderToken.value) return;
    
    const marker = addDevice(d);  // Retorna L.CanvasMarker
    if (marker) {
      clusterGroup.addLayer(marker);
    }
  }
  
  // Adicionar cluster ao mapa
  if (!map.hasLayer(clusterGroup)) {
    map.addLayer(clusterGroup);
  }
};
```

#### Passo 4: Atualizar syncMarkers

```javascript
const syncMarkers = async () => {
  const map = props.map;
  if (!map) return;

  const storeDevices = store.state.devices?.deviceList;
  const devices = normalizeDevices(storeDevices);
  const token = ++lastRenderToken.value;

  if (isClusteredEnabled.value) {
    // Modo cluster: usar L.MarkerClusterGroup
    renderClustered(devices, token);
  } else {
    // Modo individual: remover cluster e adicionar direto
    if (clusterGroup && map.hasLayer(clusterGroup)) {
      map.removeLayer(clusterGroup);
    }
    clearAllMarkers();
    renderIndividual(devices, token);
  }
};
```

## CSS Customizado para Clusters

```css
/* Adicionar no <style> do CanvaMarker.vue */
.marker-cluster-custom {
  background: rgba(33, 150, 243, 0.92);
  border: 3px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.marker-cluster-inner span {
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.marker-cluster-wrapper {
  background: transparent;
}
```

## Testes Necessários

1. ✅ Verificar se clusters aparecem no zoom out
2. ✅ Testar spiderfy (zoom in em cluster)
3. ✅ Validar performance com 1000+ devices
4. ✅ Conferir se CanvasMarker customizado funciona dentro do cluster
5. ✅ Testar toggle cluster on/off

## Próximos Arquivos a Modificar

1. **CanvaMarker.vue** - Implementar mudanças acima
2. **kore-map.vue** - Verificar se imports de CSS estão corretos
3. **Adicionar CSS customizado** - Estilos dos clusters

## Benefícios da Nova Implementação

- ✅ Usa biblioteca testada e mantida (leaflet.markercluster)
- ✅ Performance superior (algoritmo otimizado)
- ✅ Funcionalidades prontas (spiderfy, zoom, hover)
- ✅ Mantém CanvasMarker customizado
- ✅ Menos código para manter
