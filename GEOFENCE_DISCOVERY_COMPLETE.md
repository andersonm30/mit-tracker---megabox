# 📍 LEVANTAMENTO COMPLETO - SISTEMA DE GEOCERCAS
## Versão Tarkan Jesse - Janeiro 2026

---

## 🔍 1. MAPA DO ESTADO ATUAL

### A. Fluxo do Usuário (Como funciona hoje)

#### 1.1 Criar Geocerca
- **Entrada**: Menu lateral → "Geocerca" (`/geofence`)
- **Componente**: `templates/geofence.vue` (lista) → `edit-geofence.vue` (modal)
- **Cliques até salvar**: **4-6 cliques**
  1. Clicar em "Geocerca" no menu
  2. Clicar no botão `+` (requer permissão 41)
  3. Preencher nome
  4. Escolher tipo (Polígono/Círculo/Linha)
  5. Clicar "Editar Área" → vai para o mapa
  6. Desenhar → Salvar

- **Tipos suportados**:
  - ✅ **POLYGON** (Polígono)
  - ✅ **CIRCLE** (Círculo)  
  - ✅ **LINESTRING** (Linha)

#### 1.2 Editar
- **Entrada**: Clicar na geocerca da lista (requer permissão 42)
- **Edita**: ✅ Nome, ✅ Tipo, ⚠️ Área (com alerta)
- **PROBLEMA CRÍTICO**: 
  ```javascript
  // Linha 170 de edit-geofence.vue
  if(area.type === 'CIRCLE') {
    ElMessageBox.confirm(
      'Deseja realmente Editar esta geocerca de Circulo,
      VOCÊ TERÁ QUE CRIAR A AREA DE NOVO!!',
      'Tem certeza?'
    );
  }
  ```
  **Ao editar círculo, PERDE O DESENHO!** 🔴

#### 1.3 Listar / Buscar
- **Filtros disponíveis**: 
  - ✅ Busca por nome (case insensitive)
  - ❌ NÃO filtra por tipo
  - ❌ NÃO filtra por grupo/usuário
  - ❌ NÃO mostra qtd devices vinculados
  - ❌ NÃO mostra tamanho/área
  - ❌ NÃO mostra status (ativo/inativo)
  
- **Exibição**: Lista simples com apenas o **nome**

#### 1.4 Vincular a Alertas
- **Fluxo**: Via componente `edit-notifications.vue` (separado)
- **Eventos disponíveis**:
  - `geofenceEnter` - "Entrou na Geocerca"
  - `geofenceExit` - "Saiu da Geocerca"
- **Canais**: Web (notificação push)
- ⚠️ **NÃO configurado direto na geocerca**

#### 1.5 Auditoria
- ❌ **NÃO EXISTE** histórico de eventos por geocerca
- ❌ NÃO rastreia quem entrou/saiu
- ❌ NÃO mostra timestamp de eventos

---

## 🐛 2. BUGS CLÁSSICOS DETECTADOS

### 🔴 CRÍTICOS (Quebram funcionalidade)

| # | Bug | Evidência no Código | Impacto |
|---|-----|---------------------|---------|
| 1 | **Editar círculo perde desenho** | `edit-geofence.vue:170` - Alerta explícito | Usuário tem que redesenhar tudo |
| 2 | **Sem validação de polígono fechado** | `store/geofence.js` - `getTotalArea` retorna apenas qtd pontos | Polígono pode não fechar |
| 3 | **Edição no mapa sem separação de modo** | `kore-map.vue:523` - `!isEditing` apenas esconde, não desabilita pan | Zoom/pan briga com draw |
| 4 | **Sem debounce em eventos geofence** | Nenhum controle no store | Spam de "entrou/saiu" na borda |

### 🟡 MÉDIOS (UX ruim mas funciona)

| # | Bug | Evidência | Solução |
|---|-----|-----------|---------|
| 5 | **Lista mostra só nome** | `geofence.vue:31` | Adicionar cards com tipo, área, cor |
| 6 | **Sem confirmação ao excluir área** | `edit-geofence.vue` - botão "Limpar" sem confirm | Adicionar ElMessageBox |
| 7 | **Mobile: impossível desenhar** | Nenhum tratamento touch | Adicionar botão "Concluir" fixo |
| 8 | **Sem export/import KML/GeoJSON** | Nenhuma funcionalidade | Adicionar wizard de import |

---

## 📐 3. REGRAS DE NEGÓCIO ATUAIS

### Permissões
```javascript
// Detectado no código
store.getters.advancedPermissions(41) // Criar geocerca
store.getters.advancedPermissions(42) // Editar geocerca
```

### Compartilhamento
- ⚠️ **Não implementado** - Geocercas são globais
- ❌ Não vincula a grupo
- ❌ Não vincula a usuário específico
- ✅ Tem atributo `isAnchor` (âncora de dispositivo)

### Persistência
```javascript
// Formato Traccar (WKT - Well-Known Text)
{
  id: 0,
  name: "Nome",
  area: "POLYGON((lat lng, lat lng, ...))" // ou CIRCLE(...) ou LINESTRING(...)
  attributes: { 
    color: "#05a7e3",
    isAnchor: false,
    deviceId: 123
  }
}
```

---

## 🎯 4. FLUXO PROFISSIONAL PROPOSTO

### Tela 1 - Lista Enterprise (Nova UX)

**Componentes a criar**:
- `GeofenceList.vue` - Lista com cards (substituir `geofence.vue`)
- `GeofenceCard.vue` - Card individual com info completa

**Features**:
- ✅ Busca por nome
- ✅ Filtro por tipo (Círculo/Polígono/Linha)
- ✅ Filtro por criador (Minhas/Compartilhadas/Globais)
- ✅ Filtro por grupo
- ✅ Cards mostram: tipo, cor, área, dispositivos vinculados, última edição
- ✅ Ações: Editar | Duplicar | Exportar | Excluir

**Layout proposto**:
```vue
<div class="geofence-manager">
  <!-- Header com filtros -->
  <div class="filters-bar">
    <el-input v-model="search" placeholder="Buscar por nome..." />
    <el-select v-model="filterType" placeholder="Tipo">
      <el-option label="Todos" value="" />
      <el-option label="Círculo" value="CIRCLE" />
      <el-option label="Polígono" value="POLYGON" />
      <el-option label="Linha" value="LINESTRING" />
    </el-select>
    <el-select v-model="filterOwner" placeholder="Criador">
      <el-option label="Minhas" value="mine" />
      <el-option label="Compartilhadas" value="shared" />
      <el-option label="Globais" value="global" />
    </el-select>
    <el-button type="primary" @click="openWizard">
      <i class="fas fa-plus"></i> Nova Geocerca
    </el-button>
  </div>
  
  <!-- Grid de cards -->
  <div class="geofence-grid">
    <geofence-card 
      v-for="fence in filteredFences" 
      :key="fence.id" 
      :fence="fence"
      @edit="editFence"
      @duplicate="duplicateFence"
      @export="exportFence"
      @delete="deleteFence"
    />
  </div>
</div>
```

### Tela 2 - Wizard de Criação (3 Passos)

**Componente a criar**:
- `GeofenceWizard.vue` - Wizard completo

**Passo 1: Dados Básicos**
- Nome (obrigatório)
- Cor (picker)
- Tipo (Círculo/Polígono/Linha)
- Compartilhar com (grupos/usuários) - se admin

**Passo 2: Desenhar no Mapa**
- Toolbar fixa:
  - Desenhar
  - Editar
  - Limpar
  - Desfazer
  - Concluir
- Para círculo: slider/input de raio + arrastar centro
- Para polígono: clique para pontos + "Concluir" (fecha e valida)
- Validações:
  - Mínimo 3 pontos
  - Evita polígonos "auto-intersect"
- Info em tempo real: área/distância

**Passo 3: Alertas e Ações**
- Disparar ao Entrar (checkbox)
- Disparar ao Sair (checkbox)
- Disparar ao Permanecer X min (checkbox + input)
- Canais: Push / Telegram / Email
- Vincular dispositivos (transfer component)

**Navegação**:
- Voltar / Avançar / Cancelar
- Salvar e Fechar / Salvar e Criar Outra

---

## 🔧 5. MELHORIAS TÉCNICAS (Anti-Bug)

### A. Antispam na Borda (Histerese + Debounce)

**Arquivo a criar**: `src/services/geofenceEngine.js`

**Conceito**:
- **Histerese**: Borda interna/externa (ex: 20m)
  - Só considera "entrou" se passou da borda interna
  - Só considera "saiu" se passou da borda externa
- **Debounce**: Não dispara mesmo evento por X segundos (ex: 60s)

**Implementação**:
```javascript
export class GeofenceEngine {
  constructor(options = {}) {
    this.hysteresisMeters = options.hysteresisMeters || 20;
    this.debounceSeconds = options.debounceSeconds || 60;
    this.deviceStates = new Map(); // deviceId => { inside, lastEvent, lastTimestamp }
  }
  
  checkGeofence(deviceId, position, geofence) {
    const currentState = this.deviceStates.get(deviceId) || {
      inside: false,
      lastEvent: null,
      lastTimestamp: 0
    };
    
    const now = Date.now();
    const isInside = this.pointInGeofence(position, geofence);
    const distanceToBorder = this.distanceToBorder(position, geofence);
    
    // Aplicar histerese
    let shouldTrigger = false;
    let event = null;
    
    if (!currentState.inside && isInside && distanceToBorder > this.hysteresisMeters) {
      shouldTrigger = true;
      event = 'geofenceEnter';
    } else if (currentState.inside && !isInside && distanceToBorder > this.hysteresisMeters) {
      shouldTrigger = true;
      event = 'geofenceExit';
    }
    
    // Aplicar debounce
    if (shouldTrigger && event === currentState.lastEvent) {
      const timeSinceLastEvent = (now - currentState.lastTimestamp) / 1000;
      if (timeSinceLastEvent < this.debounceSeconds) {
        shouldTrigger = false;
      }
    }
    
    if (shouldTrigger) {
      this.deviceStates.set(deviceId, {
        inside: event === 'geofenceEnter',
        lastEvent: event,
        lastTimestamp: now
      });
      return { event, position, geofence };
    }
    
    return null;
  }
  
  pointInGeofence(position, geofence) {
    // Ray-casting algorithm para POLYGON
    // Haversine distance para CIRCLE
  }
  
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }
  
  distanceToBorder(position, geofence) {
    // Calcular distância mínima à borda
  }
}
```

### B. Edição Sem Quebrar (Modo Draw vs Pan)

**Modificar**: `src/store/modules/geofence.js`

**Adicionar ao state**:
```javascript
state: () => ({
  // ... existente
  editMode: null, // null | 'draw' | 'edit' | 'pan'
  canPan: true,
  canZoom: true
}),
```

**Adicionar mutations**:
```javascript
mutations: {
  setEditMode(state, mode) {
    state.editMode = mode;
    if (mode === 'draw' || mode === 'edit') {
      state.canPan = false;
      state.canZoom = false;
    } else {
      state.canPan = true;
      state.canZoom = true;
    }
  }
}
```

**Aplicar em kore-map.vue**:
```javascript
const mapOptions = computed(() => ({
  dragging: store.state.geofences.canPan,
  scrollWheelZoom: store.state.geofences.canZoom,
  doubleClickZoom: store.state.geofences.canZoom,
  touchZoom: store.state.geofences.canZoom
}));
```

### C. Persistência com Versioning

**Modificar**: `src/store/modules/geofence.js` - actions

**Novo schema de attributes**:
```javascript
{
  id: 0,
  name: "",
  area: "",
  attributes: {
    color: "#05a7e3",
    version: 1,              // ✅ NOVO: Versioning
    createdAt: "2026-01-23T00:00:00Z",
    updatedAt: "2026-01-23T00:00:00Z",
    createdBy: 1,            // ✅ NOVO: User ID
    sharedWith: [],          // ✅ NOVO: [groupId, userId]
    isAnchor: false,
    deviceId: null,
    
    // ✅ NOVO: Configurações de alerta
    alertOnEnter: false,
    alertOnExit: false,
    alertOnDwell: false,
    dwellMinutes: 0,
    channels: []             // ['web', 'telegram', 'email']
  }
}
```

**Action save com versioning**:
```javascript
async save(context, params) {
  // Verificar versioning (prevenir sobrescrita)
  if (params.id > 0) {
    const existing = context.getters.getGeofenceById(params.id);
    if (existing && existing.attributes.version !== params.attributes.version) {
      throw new Error('Geocerca foi modificada por outro usuário. Recarregue e tente novamente.');
    }
    params.attributes.version = (params.attributes.version || 0) + 1;
  }
  
  params.attributes.updatedAt = new Date().toISOString();
  params.attributes.updatedBy = context.rootState.auth.id;
  
  // ... rest of save logic
}
```

### D. Corrigir Edição de Círculo

**Modificar**: `src/tarkan/components/views/edit-geofence.vue`

**Problema atual**:
```javascript
// Linha 170 - Remove este alerta e corrige o parse
if(area.type === 'CIRCLE') {
  ElMessageBox.confirm(
    'Deseja realmente Editar esta geocerca de Circulo,
    VOCÊ TERÁ QUE CRIAR A AREA DE NOVO!!',
    'Tem certeza?'
  );
}
```

**Correção**:
```javascript
const editGeofence = (geofence) => {
  title.value = 'Editar Geocerca';
  formData.value = JSON.parse(JSON.stringify(defaultGeofenceData));
  Object.assign(formData.value, JSON.parse(JSON.stringify(geofence)));
  
  const area = getAreaParsed(geofence.area);
  formData.value.type = area.type;
  
  // ✅ CORRIGIDO: Preserva dados do círculo
  if (area.type === 'CIRCLE') {
    const circleMatch = geofence.area.match(/CIRCLE \(([-\d.]+) ([-\d.]+), ([-\d.]+)\)/);
    if (circleMatch) {
      store.commit("geofences/setParams", [
        parseFloat(circleMatch[1]), // lat
        parseFloat(circleMatch[2]), // lng
        parseFloat(circleMatch[3])  // radius
      ]);
    }
  } else {
    store.commit("geofences/setParams", area.params);
  }
  
  show.value = true;
}
```

---

## 📋 6. BACKLOG PRIORIZADO

### Fase 1 - Correções Críticas (12-15h)

- [ ] **FENCE-001**: Criar GeofenceEngine com histerese + debounce (4h)
  - Arquivo: `src/services/geofenceEngine.js`
  - Implementar ray-casting, haversine, distanceToBorder
  - Testes unitários

- [ ] **FENCE-002**: Adicionar controle pan/draw no store (2h)
  - Modificar: `src/store/modules/geofence.js`
  - State: editMode, canPan, canZoom
  - Mutations: setEditMode

- [ ] **FENCE-003**: Corrigir edição de círculo (3h)
  - Modificar: `src/tarkan/components/views/edit-geofence.vue`
  - Parse correto do CIRCLE WKT
  - Preservar lat/lng/radius ao editar

- [ ] **FENCE-004**: Validar fechamento de polígono (3h)
  - Modificar: `src/tarkan/components/views/edit-geofence.vue`
  - Adicionar validação: primeiro ponto === último ponto
  - Fechar automaticamente se necessário

### Fase 2 - UX Enterprise (18-24h)

- [ ] **FENCE-005**: Criar lista com cards (3h)
  - Criar: `src/tarkan/components/views/GeofenceList.vue`
  - Criar: `src/tarkan/components/views/GeofenceCard.vue`
  - Mostrar: tipo, cor, área, devices, última edição

- [ ] **FENCE-006**: Adicionar filtros avançados (2h)
  - Filtro por tipo (CIRCLE/POLYGON/LINESTRING)
  - Filtro por criador (mine/shared/global)
  - Filtro por grupo

- [ ] **FENCE-007**: Wizard passo 1 (dados) (2h)
  - Criar: `src/tarkan/components/views/GeofenceWizard.vue`
  - Form: nome, cor, tipo, compartilhar

- [ ] **FENCE-008**: Wizard passo 2 (desenhar) (6h)
  - Toolbar: Desenhar/Editar/Limpar/Desfazer/Concluir
  - Slider de raio para círculo
  - Info em tempo real (área/distância)
  - Validações

- [ ] **FENCE-009**: Wizard passo 3 (alertas) (4h)
  - Checkboxes: entrar/sair/permanecer
  - Canais: web/telegram/email
  - Transfer: vincular dispositivos

- [ ] **FENCE-010**: Toolbar draw com undo (2h)
  - Botões: Desenhar/Editar/Limpar/Desfazer
  - Stack de undo (últimos 10 estados)

- [ ] **FENCE-011**: Mobile touch (4h)
  - Botão "Concluir" fixo na tela
  - Gestures: tap para ponto, long-press para centro círculo
  - Botões maiores (min 44x44px)

### Fase 3 - Features Avançadas (15-20h)

- [ ] **FENCE-012**: Export GeoJSON (2h)
  - Converter WKT → GeoJSON
  - Download como .geojson

- [ ] **FENCE-013**: Import GeoJSON/KML (4h)
  - Upload de arquivo
  - Parse KML/GeoJSON → WKT
  - Preview antes de salvar

- [ ] **FENCE-014**: Duplicar geocerca (1h)
  - Action: duplicateFence(id)
  - Adicionar " (cópia)" ao nome

- [ ] **FENCE-015**: Compartilhamento (4h)
  - Attributes: sharedWith []
  - UI: select grupos/usuários
  - Filtrar lista por acesso

- [ ] **FENCE-016**: Histórico de eventos (8h)
  - Backend: tabela geofence_events
  - Frontend: modal com timeline
  - Mostrar: device, evento, timestamp

- [ ] **FENCE-017**: Analytics (4h)
  - Tempo médio dentro da geocerca
  - Frequência de violação
  - Gráfico de eventos por dia

---

## 📊 7. ESTIMATIVA TOTAL

| Fase | Horas | Complexidade | Prioridade |
|------|-------|--------------|------------|
| Fase 1 - Correções Críticas | 12-15h | Média-Alta | 🔴 Urgente |
| Fase 2 - UX Enterprise | 18-24h | Média | 🟡 Alta |
| Fase 3 - Features Avançadas | 15-20h | Média-Alta | 🟢 Média |
| **TOTAL** | **45-59h** | | |

**Recomendação**: Implementar em sprints de 2 semanas
- Sprint 1: Fase 1 (críticos)
- Sprint 2-3: Fase 2 (UX)
- Sprint 4: Fase 3 (avançadas)

---

## 🎯 8. MÉTRICAS DE SUCESSO

### Antes (Atual)
- ❌ Editar círculo perde desenho
- ❌ Spam de eventos na borda (10-20 eventos/min)
- ❌ Lista mostra só nome
- ❌ Mobile impossível de usar
- ❌ Sem export/import
- ❌ Sem histórico

### Depois (Meta)
- ✅ Edição preserva desenho (0 perda)
- ✅ Eventos controlados (< 1 evento/min com histerese)
- ✅ Lista com cards informativos (tipo, área, devices)
- ✅ Mobile com UI touch-friendly
- ✅ Export/Import GeoJSON
- ✅ Histórico de eventos rastreável

---

## 📚 9. REFERÊNCIAS TÉCNICAS

### Arquivos Principais
- `src/templates/geofence.vue` - Lista atual (68 linhas)
- `src/tarkan/components/views/edit-geofence.vue` - Modal edição (329 linhas)
- `src/tarkan/components/kore-fence.vue` - Renderização no mapa (67 linhas)
- `src/store/modules/geofence.js` - Store (160 linhas)

### Algoritmos Necessários
- **Point-in-Polygon**: Ray-casting algorithm
- **Haversine Distance**: Distância esférica entre dois pontos
- **Point-to-Segment**: Distância de ponto a segmento de reta
- **WKT Parser**: Well-Known Text ↔ GeoJSON

### Bibliotecas Sugeridas
- `@turf/turf` - Operações geoespaciais (área, distância, validação)
- `leaflet-draw` - Plugin de desenho (já usa Leaflet)
- `wkt` - Parse WKT ↔ GeoJSON

---

## 🚀 10. PRÓXIMOS PASSOS

### Para começar a implementação, preciso:

1. **Confirmar prioridades**:
   - Qual fase começar? (Recomendo Fase 1 - Críticos)
   - Algum bug específico mais urgente?

2. **Validar arquitetura**:
   - OK criar `GeofenceEngine` como service?
   - OK refatorar store com versioning?
   - OK criar wizard novo (não modificar modal antigo)?

3. **Backend**:
   - Endpoint `/api/geofences` já existe?
   - Suporta attributes customizados?
   - Precisa criar tabela de eventos?

### Entregáveis prontos para gerar:

✅ Prompt completo para implementar `GeofenceEngine.js`
✅ Prompt completo para implementar `GeofenceWizard.vue`
✅ Prompt completo para refatorar `GeofenceList.vue`
✅ Prompt completo para corrigir edição de círculo
✅ Tasks atomizadas no formato GitHub Issues

---

**Documento gerado em**: 23 de janeiro de 2026
**Última atualização**: 23/01/2026
**Versão**: 1.0
**Status**: 📝 Levantamento Completo - Aguardando Aprovação
