# HARDENING: Testes Manuais para mapGuards ✅

## 📋 Resumo Executivo

**Data**: 2026-01-02  
**Objetivo**: Validar que guards previnem bugs silenciosos sem afetar UX  
**Status**: ✅ PRONTO PARA TESTES

---

## 🎯 Critérios de Aceite

1. ✅ **Sem erros no console** em inputs ruins (lat/lng NaN, course null, índice fora do range)
2. ✅ **UX idêntica** em inputs válidos (sem degradação de performance)
3. ✅ **Logs informativos** em dev mode (warnings claros, não errors)
4. ✅ **Graceful degradation** (fallbacks sensatos, não quebra completa)

---

## 🧪 Cenários de Teste

### 1️⃣ Coordenadas Inválidas - Lat/Lng NaN

**Objetivo**: Validar que `isValidLatLng` e `safeLatLng` previnem markers/pans com coordenadas NaN

**Setup**:
1. Abrir DevTools Console
2. Injetar ponto com lat/lng inválidos no array de rota:
```javascript
// Simular ponto com lat/lng NaN
const badPoint = { latitude: NaN, longitude: NaN };
window.$map.panTo([badPoint.latitude, badPoint.longitude]);
```

**Comportamento Esperado**:
- ✅ Console mostra warning: `[mapGuards] extractLatLng: array inválido [NaN, NaN] em ...`
- ✅ Nenhum erro JavaScript
- ✅ Mapa não faz pan (permanece na posição atual)
- ✅ Nenhum marker é criado

**Comportamento Atual (Antes do Hardening)**:
- ❌ Console mostra erro: `Uncaught Error: Invalid LatLng object: (NaN, NaN)`
- ❌ Mapa pode crashar ou ficar em estado inconsistente

---

### 2️⃣ Coordenadas Fora do Range - Lat > 90 ou < -90

**Objetivo**: Validar que `safeLatitude` clampa valores extremos

**Setup**:
1. Abrir DevTools Console
2. Tentar criar marker com lat fora do range:
```javascript
// Simular latitude absurda
window.$map.setView([999, -50], 10);
```

**Comportamento Esperado**:
- ✅ Console mostra warning: `[mapGuards] safeLatitude: 999 > 90 em ..., clampando`
- ✅ Lat é clampado para 90 (máximo válido)
- ✅ Mapa faz pan para (90, -50) - polo norte
- ✅ Sem erro JavaScript

**Comportamento Atual (Antes do Hardening)**:
- ❌ Leaflet lança erro: `LatLng values are unbounded`
- ❌ Pan não acontece ou comportamento indefinido

---

### 3️⃣ Course NaN - Marcador do Veículo não Rotaciona

**Objetivo**: Validar que `normalizeCourse` previne ícone com rotation NaN

**Setup**:
1. Carregar rota com dispositivo
2. Iniciar play (▶️)
3. No código, simular ponto com course NaN:
```javascript
// Injetar ponto com course inválido
const point = { latitude: -29.9, longitude: -51.0, course: NaN };
window.$updatePlayVehicleMarker(point.latitude, point.longitude, point.course);
```

**Comportamento Esperado**:
- ✅ Console mostra warning: `[mapGuards] safeNumber: "NaN" inválido em normalizeCourse, usando fallback 0`
- ✅ Marker do veículo é criado/atualizado
- ✅ Ícone rotacionado para 0° (norte) - fallback
- ✅ Sem erro JavaScript

**Comportamento Atual (Antes do Hardening)**:
- ❌ Ícone fica invisível ou com `transform: rotate(NaN deg)`
- ❌ CSS quebrado, marker pode sumir

---

### 4️⃣ Seek Fora do Range - Timeline Clica Além do Fim

**Objetivo**: Validar que `clampIndex` previne seek para índice inválido

**Setup**:
1. Carregar rota com 100 pontos
2. Abrir DevTools Console
3. Simular seek para índice 999:
```javascript
// Tentar seek para índice inexistente
window.$previewRoutePoint({ point: routePoints[0], index: 999 });
```

**Comportamento Esperado**:
- ✅ Console mostra warning: `[mapGuards] clampIndex: índice 999 fora do range [0, 99] em previewRoutePoint, clampado para 99`
- ✅ Playback vai para último ponto (índice 99)
- ✅ Marker do veículo aparece no fim da rota
- ✅ Sem erro JavaScript

**Comportamento Atual (Antes do Hardening)**:
- ❌ `routePoints[999]` retorna undefined
- ❌ Erro: `Cannot read property 'latitude' of undefined`
- ❌ Playback para de funcionar

---

### 5️⃣ Array Vazio - drawFullRoute([])

**Objetivo**: Validar que `safeArray` e `filterValidPoints` lidam com arrays vazios

**Setup**:
1. Chamar `updateRoute([])` (array vazio)

**Comportamento Esperado**:
- ✅ Console mostra log: `[MapLayerManager] setFullRoute: nenhum ponto válido, não criando polyline`
- ✅ Nenhuma polyline é adicionada ao mapa
- ✅ Sem erro JavaScript
- ✅ UX: mapa limpo, sem rota visível (OK)

**Comportamento Atual (Antes do Hardening)**:
- ❌ Leaflet pode tentar criar polyline vazia
- ❌ Erro: `Invalid LatLng array`

---

### 6️⃣ Zoom Absurdo - setView([...], -1)

**Objetivo**: Validar que `clampZoom` previne zoom fora do range

**Setup**:
1. Abrir DevTools Console
2. Tentar setar zoom inválido:
```javascript
window.$map.setView([-29.9, -51.0], -1); // Zoom negativo
```

**Comportamento Esperado**:
- ✅ Console mostra warning: `[mapGuards] clampZoom: -1 < 1 em ..., clampando`
- ✅ Zoom é clampado para 1 (mínimo válido)
- ✅ Mapa renderiza no zoom 1 (muito afastado)
- ✅ Sem erro JavaScript

**Comportamento Atual (Antes do Hardening)**:
- ❌ Leaflet pode aceitar zoom negativo
- ❌ Mapa fica em estado inconsistente ou crashe

---

### 7️⃣ Heatmap com Velocidades Inválidas

**Objetivo**: Validar que `safeSpeed` normaliza velocidades absurdas

**Setup**:
1. Carregar rota com pontos onde `speed = 9999` (absurdo)
2. Ativar heatmap (🔥)

**Comportamento Esperado**:
- ✅ Console mostra warning: `[mapGuards] safeSpeed: 9999 > 999 em toggleHeatmap.speed, clampando`
- ✅ Velocidade é clampada para 999 km/h (máximo razoável)
- ✅ Heatmap renderiza com intensidade máxima (vermelho)
- ✅ Sem erro JavaScript

**Comportamento Atual (Antes do Hardening)**:
- ❌ Intensity calculada como `9999 / 100 = 99.99` (muito além de 1.0)
- ❌ Leaflet.heat pode ter comportamento indefinido

---

### 8️⃣ Mapa Não Carregado - panTo() Antes de Ready

**Objetivo**: Validar que `assertMapReady` previne operações antes do mapa carregar

**Setup**:
1. Abrir DevTools Console
2. Recarregar página
3. IMEDIATAMENTE após carregamento (antes do mapa estar pronto), tentar pan:
```javascript
// Executar logo após DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.$map?.panTo([-29.9, -51.0]);
  }, 50); // Antes do mapReady
});
```

**Comportamento Esperado**:
- ✅ Console mostra warning: `[mapGuards] safeMapOperation: operação "panTo" falhou: mapa não está carregado`
- ✅ Nenhum pan acontece
- ✅ Sem erro JavaScript
- ✅ Quando mapa ficar pronto, funciona normalmente

**Comportamento Atual (Antes do Hardening)**:
- ❌ Erro: `Cannot read property 'panTo' of undefined`
- ❌ Ou: `TypeError: this._loaded is not true`

---

### 9️⃣ Pontos (0,0) - Coordenadas Dummy

**Objetivo**: Validar que `isValidNonZeroLatLng` filtra pontos em (0,0)

**Setup**:
1. Injetar ponto com lat=0, lng=0 (dummy/default) na rota
2. Desenhar rota

**Comportamento Esperado**:
- ✅ Ponto (0,0) é filtrado (não aparece na rota)
- ✅ Console mostra log: `[mapGuards] filterValidPoints: X pontos inválidos removidos de Y em ...`
- ✅ Polyline renderiza apenas pontos válidos
- ✅ Sem erro JavaScript

**Comportamento Atual (Antes do Hardening)**:
- ❌ Ponto (0,0) aparece na rota (costa da África, meio do oceano)
- ❌ Polyline "pula" para (0,0) e volta

---

### 🔟 Performance - 10.000 Pontos com 10% Inválidos

**Objetivo**: Validar que guards não degradam performance em datasets grandes

**Setup**:
1. Gerar array de 10.000 pontos com 10% inválidos (NaN, null, fora do range)
2. Chamar `updateRoute(points)`
3. Medir tempo de execução

**Comportamento Esperado**:
- ✅ Tempo de execução < 500ms (aceitável para 10k pontos)
- ✅ Console mostra warning: `[mapGuards] filterValidPoints: 1000 pontos inválidos removidos de 10000 em ...`
- ✅ Polyline renderiza com 9.000 pontos válidos
- ✅ UX: mapa responsivo, sem lag perceptível

**Comportamento Atual (Antes do Hardening)**:
- ❌ Sem filtragem, pontos inválidos causam múltiplos erros
- ❌ Performance degradada por re-renders falhados

---

## 📊 Checklist de Validação

| Cenário | Sem Erro Console | Fallback Correto | UX Preservada | Dev Warnings |
|---------|------------------|------------------|---------------|--------------|
| 1. Lat/Lng NaN | ⬜ | ⬜ | ⬜ | ⬜ |
| 2. Lat/Lng Fora Range | ⬜ | ⬜ | ⬜ | ⬜ |
| 3. Course NaN | ⬜ | ⬜ | ⬜ | ⬜ |
| 4. Seek Fora Range | ⬜ | ⬜ | ⬜ | ⬜ |
| 5. Array Vazio | ⬜ | ⬜ | ⬜ | ⬜ |
| 6. Zoom Absurdo | ⬜ | ⬜ | ⬜ | ⬜ |
| 7. Velocidades Inválidas | ⬜ | ⬜ | ⬜ | ⬜ |
| 8. Mapa Não Ready | ⬜ | ⬜ | ⬜ | ⬜ |
| 9. Pontos (0,0) | ⬜ | ⬜ | ⬜ | ⬜ |
| 10. Performance 10k | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 🔍 Como Testar (Passo a Passo)

### Preparação

1. **Build do Projeto**:
```bash
npm run build
```

2. **Abrir em Dev Mode**:
```bash
npm run serve
```

3. **Abrir DevTools Console** (F12)

4. **Login na Aplicação**

### Execução dos Testes

Para cada cenário:

1. ✅ Executar código do "Setup"
2. ✅ Verificar "Comportamento Esperado"
3. ✅ Marcar checkbox na tabela acima
4. ✅ Capturar screenshot se encontrar bug

### Regressão (Smoke Test)

Após todos os cenários:

1. ✅ Carregar dispositivo com rota normal
2. ✅ Iniciar play (▶️) - marker deve aparecer e se mover
3. ✅ Pausar play (⏸️) - marker deve parar
4. ✅ Arrastar timeline - marker deve seguir
5. ✅ Ativar heatmap (🔥) - cores devem aparecer corretamente
6. ✅ Follow device - tooltip deve aparecer
7. ✅ Zoom in/out - sem lags ou erros
8. ✅ Abrir context menu (right-click marker) - todas opções funcionam

---

## 🐛 Relatório de Bugs

Se encontrar bug durante testes, preencher:

### Bug #1

**Cenário**: _____  
**Comportamento Esperado**: _____  
**Comportamento Atual**: _____  
**Console Error**: _____  
**Screenshot**: _____  
**Prioridade**: 🔴 Alta / 🟠 Média / 🟡 Baixa

---

## ✅ Critérios de Release

- [ ] Todos os 10 cenários passaram (0 erros)
- [ ] Smoke test passou (UX preservada)
- [ ] Performance não degradou (< 500ms para 10k pontos)
- [ ] Warnings aparecem apenas em dev mode (não em prod)
- [ ] Documentação atualizada (README.md)

---

## 📝 Notas de Implementação

### Funções Críticas Protegidas

| Função | Guards Aplicados | Arquivo |
|--------|------------------|---------|
| `setVehicleMarker()` | `isValidLatLng`, `safeLatLng`, `normalizeCourse` | MapLayerManager.js |
| `setFullRoute()` | `safeArray`, `filterValidPoints` | MapLayerManager.js |
| `toggleHeatmap()` | `safeArray`, `filterValidPoints`, `safeSpeed` | MapLayerManager.js |
| `previewRoutePoint()` | `extractLatLng`, `clampIndex`, `safeMapOperation` | kore-map.vue |
| `updatePlaybackPosition()` | `clampIndex` (pendente) | kore-map.vue |
| `flyToDevice()` | `safeMapOperation`, `clampZoom` (pendente) | kore-map.vue |

### Guards Mais Importantes

1. **isValidLatLng**: Valida que lat/lng são números finitos e dentro do range (-90,90) x (-180,180)
2. **safeLatLng**: Clampa lat/lng para range válido, retorna fallback se inválido
3. **normalizeCourse**: Normaliza course para 0-360°, lida com wraparound (359° → 1° = 2° diff)
4. **clampIndex**: Garante que índice está dentro do array (0 a length-1)
5. **assertMapReady**: Lança erro se mapa não estiver pronto (_loaded=false)

### Fallbacks Padrão

- **Lat**: -29.942484 (Porto Alegre)
- **Lng**: -50.990526
- **Zoom**: 10
- **Course**: 0° (norte)
- **Speed**: 0 km/h

---

**Status**: ✅ PRONTO PARA TESTES  
**Data**: 2026-01-02  
**Testador**: _____  
**Resultado**: ⬜ PASSOU / ⬜ FALHOU
