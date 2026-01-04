# Plano de Implementação do Cluster

## Problemas Identificados

1. **cluster.js não integrado**: O arquivo existe mas não é importado/usado
2. **Implementação manual incompleta**: CanvaMarker.vue tem clustering manual (grid-based) que não usa L.MarkerClusterGroup
3. **Falta de CSS do MarkerCluster**: Estilos não estão importados
4. **Problemas de sincronização**: Watches múltiplos causam re-renders desnecessários

## Solução Proposta

### Opção 1: Usar L.MarkerClusterGroup nativo (RECOMENDADA)
- Integrar cluster.js diretamente
- Usar API oficial do leaflet.markercluster
- Aproveitar recursos como spiderfy, zoom on click, etc
- Melhor performance e estabilidade

### Opção 2: Melhorar implementação manual
- Corrigir bugs na implementação grid-based atual
- Otimizar re-renders
- Adicionar throttle/debounce

## Implementação Opção 1 (ESCOLHIDA)

### Arquivos a modificar:

1. **CanvaMarker.vue** - Integrar L.MarkerClusterGroup
2. **kore-map.vue** - Ajustar controles e preferências
3. **package.json** - Verificar dependências
4. **main.js ou app.js** - Importar CSS do cluster

### Próximos passos:

1. Verificar se `leaflet.markercluster` está no package.json
2. Importar CSS do markercluster
3. Modificar CanvaMarker.vue para usar L.MarkerClusterGroup
4. Criar factory para markers customizados dentro do cluster
5. Testar com muitos dispositivos

## Bugs Corrigidos no Código Atual

- ✅ Verificação de `modelReady` antes de cachear
- ✅ Fallbacks seguros para `sizes` e `radius`
- ✅ parseFloat com defaults para color parsing
- ✅ Flags de visibilidade consistentes (hide/hidden/isVisible)
- ✅ Métodos `addToMap` e `removeFromMap` melhorados
