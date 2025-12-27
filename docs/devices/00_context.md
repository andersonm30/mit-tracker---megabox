# Contexto e Regras

- Baseline imutável: a tela de produção é [src/templates/devices.vue](src/templates/devices.vue). Qualquer evolução deve partir dela e preservar comportamento crítico; mudanças precisam de justificativa e plano de rollback.
- Versão em andamento: [src/templates/devices-2.vue](src/templates/devices-2.vue). Não estável; usar apenas como fonte de ideias.
- Benchmark externo: [src/templates/devices-dark.vue](src/templates/devices-dark.vue). Referência de concorrente; adaptar ao padrão interno.
- Regra de segurança: não quebrar fluxos críticos nem degradar performance/UX. Rollback: manter `devices.vue` intacto e aplicar melhorias de forma incremental com feature flags ou toggles de estilo.

## Critérios de aceitação de mudança
1) Não quebrar fluxo crítico (login → lista → mapa → ações) nem fluxos da tela: carregamento, filtros, lista/cards, navegação, atualizações (WS/polling), mapa, ações rápidas, vazios/erro/loading.
2) Não degradar performance (scroll virtual, filtros, watchers, chamadas de API, manipulação de mapa/ícones, debounce/throttle).
3) Manter consistência visual e navegação (layout, densidade, estados, tooltips, ordenação, grouping, atalhos, responsividade).

## Fluxos críticos da tela (derivados do código)
- Carregamento inicial: montagem e cálculo de janela virtual, preenchimento de `filteredDevices`, leitura de `localStorage` e preload de [src/templates/devices.internal.vue](src/templates/devices.internal.vue).
- Busca/filtro: `query` + filtros de situação/estado/adv (inclui parse de datas) e atualização de ícones no mapa.
- Renderização de lista/cards: virtual scroll (offset/maxDevices) + agrupamento por grupo com ordenação dinâmica.
- Clique e navegação: `markerClick`/`markerContext` injetados; linha inteira clica e abre detalhe (ou interage com mapa).
- Atualização em tempo real: dependente de store `devices` (WS/polling); watchers reagem a mudanças de `getOrderedDevices`, sorting, filtros.
- Integração com mapa: remove/adiciona ícones em filtros/scroll; estados como anchor/motion/blocked/ignition e `mapPref('groups')`.
- Ações rápidas: tooltips de status, âncora, bloqueio, ignição, motorista, alarmes; botão de adicionar device com checagem de limite.
- Estados vazios/erro/loading: ícones de "sem posição" e estados `unknown/new/offline/online`; ausência explícita de telas de erro → cuidar ao evoluir.
