# Plano de Refatoração: kore-map.vue

## 📋 Objetivo da Refatoração

Reduzir a complexidade do componente `kore-map.vue` (atualmente com **5165 linhas**), tornando-o mais:
- **Manutenível**: Código organizado em módulos menores e coesos
- **Testável**: Lógica isolada em funções/composables testáveis
- **Performático**: Otimização de watchers, computeds e renders
- **Escalável**: Facilitar adição de novas funcionalidades sem aumentar complexidade

**Meta**: Reduzir para ~2000 linhas no componente principal, delegando lógica para composables/utils.

---

## ⚠️ Riscos Identificados

### Risco Alto 🔴
1. **Quebra de funcionalidades críticas**
   - Sistema de follow em tempo real (rastreamento veículos)
   - Playback de rotas (timeline + animação)
   - Cluster de markers (visualização contas grandes)
   
2. **Regressão de performance**
   - Watchers mal refatorados causando loops infinitos
   - Render excessivo de markers
   - Memory leaks em listeners não removidos

3. **Perda de estados críticos**
   - isPlaying, follow, heatmap, clustered
   - Posição do playback, zoom, center
   - Preferências do usuário (localStorage)

### Risco Médio 🟡
1. **Integração com Vuex**
   - Mudanças podem quebrar comunicação store ↔ componente
   
2. **Eventos e callbacks**
   - Handlers de drag, zoom, click podem perder contexto
   
3. **Leaflet API**
   - Manipulação direta do mapa pode conflitar com Vue Leaflet

### Risco Baixo 🟢
1. **Estilização CSS**
   - Styles podem ser movidos para arquivos separados sem risco funcional
   
2. **Helpers/Utils**
   - Funções puras de formatação são seguras para extrair

---

## 🎯 Estratégia por Fases (A → E)

### **FASE A: Preparação e Baseline** ✅ (Esta fase)
**Objetivo**: Criar infraestrutura de segurança SEM mudanças funcionais

- [x] Criar documentação de baseline (KORE_MAP_BASELINE.md)
- [x] Criar plano de refatoração (este arquivo)
- [x] Implementar sistema de logs DEV-only (devLog)
- [x] Adicionar logs em pontos críticos (sem alterar lógica)
- [ ] Executar testes manuais de smoke (todas features básicas)
- [ ] Documentar cobertura de testes atual

**Critérios de Aceite**:
- ✅ Build passa sem erros
- ✅ Nenhum comportamento alterado
- ✅ Logs só aparecem com `DEBUG_MAP=1`

---

### **FASE B: Extração de Utilitários**
**Objetivo**: Mover funções puras para arquivos separados

**Tarefas**:
1. Extrair helpers de formatação:
   - `formatCPF`, `formatCNH`, `formatDate`
   - Criar `src/utils/formatters.ts`

2. Extrair helpers de driver:
   - `getDriverName`, `getDriverCNH`, `getDriverPhoto`, etc.
   - Criar `src/composables/useDriver.ts`

3. Extrair helpers de device:
   - `getDeviceImageUrl`, `getVehiclePlate`, `getStatusClass`
   - Criar `src/composables/useDevice.ts`

4. Extrair constantes:
   - MAP_CONSTANTS para `src/constants/mapConstants.ts`

**Critérios de Aceite**:
- Todos os testes (se houver) passam
- Comportamento visual idêntico
- Logs de debug confirmam fluxo correto

---

### **FASE C: Extração de Lógica de Estado**
**Objetivo**: Mover gerenciamento de estado para composables

**Tarefas**:
1. **Composable de Playback**:
   - Estados: `isPlaying`, `routePlayState`, `routePlayIndex`, `playSpeed`
   - Métodos: `playRoute`, `pausePlayRoute`, `stopRoute`, `seekTo`
   - Arquivo: `src/composables/useRoutePlayback.ts`

2. **Composable de Follow**:
   - Estados: `isFollowing`, `followedDeviceId`, `followSuspended`
   - Métodos: `startFollow`, `stopFollow`, `suspendFollow`
   - Arquivo: `src/composables/useFollowDevice.ts`

3. **Composable de Heatmap**:
   - Estados: `heatmapEnabled`, `heatLayer`
   - Métodos: `toggleHeatmap`, `updateHeatmap`
   - Arquivo: `src/composables/useHeatmap.ts`

4. **Composable de Cluster**:
   - Estados: `clustered`, `clusterLayer`
   - Métodos: `toggleCluster`, `updateCluster`
   - Arquivo: `src/composables/useCluster.ts`

**Critérios de Aceite**:
- Estados mantêm reatividade
- Watchers funcionam corretamente
- Performance não regride (verificar com DevTools)

---

### **FASE D: Extração de UI e Eventos**
**Objetivo**: Separar lógica de interação do usuário

**Tarefas**:
1. **Composable de Drag & Zoom**:
   - Eventos: `startDrag`, `onDrag`, `stopDrag`, `zoomIn`, `zoomOut`
   - Arquivo: `src/composables/useMapInteraction.ts`

2. **Composable de Timeline**:
   - Eventos: `moveTimelinePosition`, `updateTimeline`
   - Estados: `routePlayPos`, `isDragging`
   - Arquivo: `src/composables/useTimeline.ts`

3. **Composable de Markers**:
   - Métodos: `markerClick`, `markerOver`, `openMarkInfo`
   - Arquivo: `src/composables/useMarkers.ts`

**Critérios de Aceite**:
- Todas as interações funcionam (click, drag, zoom)
- Eventos não perdem contexto (this/refs)
- Cursores e feedbacks visuais corretos

---

### **FASE E: Otimização e Polimento**
**Objetivo**: Melhorar performance e DX (Developer Experience)

**Tarefas**:
1. **Performance**:
   - Debounce/throttle em watchers pesados
   - Lazy loading de componentes pesados
   - Memoização de computed custosos

2. **Testes**:
   - Unit tests para composables
   - Integration tests para fluxos críticos

3. **Documentação**:
   - JSDoc em funções públicas
   - README atualizado com arquitetura

4. **Cleanup**:
   - Remover código comentado
   - Remover logs de debug antigos
   - Consolidar estilos CSS

**Critérios de Aceite**:
- Lighthouse score > 90
- Cobertura de testes > 60%
- Zero warnings no build

---

## ✅ Checklist de Não Regressão

Execute após **CADA FASE** antes de prosseguir:

### Funcionalidades Principais
- [ ] **Visualização de Dispositivos**
  - [ ] Markers aparecem no mapa
  - [ ] Cluster funciona (ativação/desativação)
  - [ ] Follow funciona (seguir veículo em tempo real)
  - [ ] Nomes/placas aparecem corretamente

- [ ] **Playback de Rotas**
  - [ ] Rota carrega e desenha no mapa
  - [ ] Play/Pause funciona
  - [ ] Timeline responde a cliques
  - [ ] Drag da timeline funciona
  - [ ] Velocidade de playback altera corretamente
  - [ ] Marker de veículo se move suavemente

- [ ] **Geocercas**
  - [ ] Geocercas aparecem no mapa
  - [ ] Toggle de visibilidade funciona
  - [ ] Nomes das geocercas aparecem (quando ativado)

- [ ] **Heatmap**
  - [ ] Heatmap ativa/desativa
  - [ ] Cores representam densidade corretamente

- [ ] **Controles de Mapa**
  - [ ] Zoom in/out funciona
  - [ ] Troca de camadas (Google, OSM, etc.)
  - [ ] Busca no mapa funciona
  - [ ] Street View abre corretamente

### Interações do Usuário
- [ ] Click em marker abre info
- [ ] Drag no mapa não trava
- [ ] Zoom via scroll funciona
- [ ] Timeline drag não causa jumps
- [ ] Botões respondem sem delay

### Estados Críticos
- [ ] `isPlaying` mantém valor após refresh
- [ ] `follow` persiste corretamente
- [ ] Preferências do usuário (localStorage) carregam
- [ ] Zoom/center restauram ao voltar para página

### Performance
- [ ] Mapa carrega em < 3s (10 dispositivos)
- [ ] Sem memory leaks (verificar DevTools)
- [ ] FPS > 30 durante playback
- [ ] Cluster não trava com 100+ markers

### Responsividade
- [ ] Mobile: controles acessíveis
- [ ] Tablet: layout adaptado
- [ ] Desktop: todos os botões visíveis

---

## 📊 Métricas de Sucesso

| Métrica | Antes | Meta | Medição |
|---------|-------|------|---------|
| Linhas do componente | 5165 | ~2000 | LOC |
| Arquivos criados | 1 | ~15 | File count |
| Tempo de build | - | Sem degradação | npm run build |
| Lighthouse | - | > 90 | Chrome DevTools |
| Bundle size | - | Sem aumento > 5% | webpack-bundle-analyzer |
| Cobertura testes | 0% | > 60% | Jest/Vitest |

---

## 🚨 Gatilhos de Rollback

**Abortar fase** se ocorrer:
1. Build quebrar e não corrigir em 30min
2. Funcionalidade crítica parar (follow, playback)
3. Performance degradar > 20%
4. Memory leak detectado em produção

**Processo de Rollback**:
```bash
git revert HEAD~1  # ou número de commits da fase
npm run build
npm run test
```

---

## 📝 Notas de Implementação

### Guidelines de Código
- **Commits**: Um commit por tarefa com prefixo `[FASE-X]`
- **Branches**: Criar branch por fase (`refactor/fase-a`, etc.)
- **Reviews**: PR obrigatório entre fases
- **Debug**: Manter `devLog` em TODAS as fases

### Ferramentas Auxiliares
- **ESLint**: Forçar regras de complexidade (max 20)
- **Bundle Analyzer**: Verificar tamanho após cada fase
- **Vue DevTools**: Monitorar reatividade
- **Lighthouse**: Auditar performance

---

## 📅 Cronograma Estimado

| Fase | Duração | Responsável | Status |
|------|---------|-------------|--------|
| A - Preparação | 2 dias | - | ✅ Em Andamento |
| B - Utilitários | 3 dias | - | ⏳ Aguardando |
| C - Estado | 5 dias | - | ⏳ Aguardando |
| D - UI/Eventos | 4 dias | - | ⏳ Aguardando |
| E - Otimização | 3 dias | - | ⏳ Aguardando |
| **TOTAL** | **~3 semanas** | | |

---

## 🔗 Referências

### Documentos do Projeto
- 📄 [KORE_MAP_BASELINE.md](./KORE_MAP_BASELINE.md) - Baseline completo de funcionalidades
- 📄 [FASE_A_COMPLETE.md](./FASE_A_COMPLETE.md) - Status da Fase A (completa)
- 💻 [devLog.ts](../src/utils/devLog.ts) - Sistema de logging implementado
- 🗺️ [kore-map.vue](../src/tarkan/components/kore-map.vue) - Componente principal

### Links Externos
- [Vue Composition API Docs](https://vuejs.org/guide/reusability/composables.html)
- [Leaflet API](https://leafletjs.com/reference.html)
- [Refactoring Patterns](https://refactoring.guru/)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)

---

**Última atualização**: 2025-01-02  
**Versão do documento**: 1.0  
**Status**: ✅ FASE A COMPLETA | ⏳ Aguardando FASE B
