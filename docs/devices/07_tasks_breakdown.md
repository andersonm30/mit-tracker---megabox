# Tasks Breakdown

## Refactor técnico
- P (2d): Extrair engine de filtros (texto/tempo/estado) de [src/templates/devices.vue](src/templates/devices.vue) para helper composable; critério: 100% cobertura dos casos atuais, sem regressão.
- M (3d): Introduzir feature flag para painel de filtros avançados; critério: toggle on/off sem alterar baseline.

## Performance
- P (1d): Implementar window slice + sync de ícones (referência [src/templates/devices-2.vue#L1120-L1190](src/templates/devices-2.vue#L1120-L1190)); critério: scroll fluido com 500+ devices.
- M (3d): Debounce/Throttle centralizado para watchers de `query`, `sorting`, `getOrderedDevices`; critério: zero loops e CPU < 30% em lista grande.

## UI/UX
- P (2d): Barra de busca com badge de filtros e chip de situação; critério: badge mostra total filtrado; mantém atalhos de tooltip.
- M (3d): Painel de filtros avançados enxuto (estado/situação/conectividade/âncora/driver/ignition/locked); critério: layout responsivo ≤420px.
- G (5d): Modo cards dinâmico opcional; critério: toggle de densidade sem quebrar tabela.

## Bugs
- P (1d): Garantir que ícones sejam removidos quando filtro oculta device (array vs objeto); critério: sem ícones órfãos após filtro.
- P (1d): Adicionar fallback se `DeviceItem` ausente (render inline ou lazy import corrigindo path); critério: build passa sem arquivo faltante.
- M (2d): Corrigir persistência de `query`/`situacao` localStorage com reset controlado; critério: limpar filtros não apaga estado crítico.

## Testes
- P (1d): Casos unitários para `getLastUpdated` e parse de `last:+/-` tempo; critério: 100% caminhos cobertos.
- M (2d): E2E fumaça (login → filtro → clique → voltar); critério: rodar em pipeline CI.

Dependências: concluir Refactor técnico antes de UI/UX; performance tuning antes de cards dinâmicos; E2E depende de painel de filtros implementado.
