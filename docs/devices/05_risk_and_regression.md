# Riscos e Pontos de Regressão

## Riscos por mudança
- Filtros avançados: aumentar número de watchers pode gerar loops ou recalcular mapa; mitigar com debounce e testes de 500+ devices.
- Sincronização de ícones: remover `addToMap/remove` incorretamente pode deixar ícones fantasmas; manter slice controlado e logs em dev.
- Export/Import: pode expor dados sem permissão ou travar UI em listas grandes; limitar a admin e usar Web Worker/batch.
- Densidades/cards: altura dinâmica errada corta footer ou quebra scroll; medir via ResizeObserver com fallback fixo.
- GPS filters: listas longas elevam bundle; lazy-load e limitar a marcas comuns.
- DOM direto (herdado do dark): risco de desalinhamento com reatividade; evitar ou encapsular em diretivas.

## Regressões clássicas a vigiar
- Watchers infinitos: sync recíproco store↔local (como em devices-dark) pode loopar; proteger com comparação e debounce.
- Eventos não removidos: intervals (`setInterval` de now), ResizeObserver; limpar em `onUnmounted`.
- Computeds pesados: `filteredDevices` percorrendo toda lista sem memo; aplicar curto-circuitos e throttling.
- Lista grande travando: evitar manipular DOM manual e não iterar `addToMap` para itens fora da janela.
- fitBounds/cluster: não presente na prod, mas dark usa classes; se integrar clustering, garantir mapa pronto antes de manipular.
- Dependências globais: `window.$showTip`, `window.$isCalculating`, `mapPref`; validar presença ou proteger com fallback.
- Mutações diretas no store (dark): não replicar; sempre via mutations/actions.
