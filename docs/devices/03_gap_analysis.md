# Análise de Lacunas

## O que existe em devices-2 ou devices-dark e NÃO existe na produção
- [GANHO REAL] Painel de filtros avançados (estado, conectividade, âncora/driver/ignition/locked, GPS brand/model/tech) ([src/templates/devices-2.vue#L50-L220](src/templates/devices-2.vue#L50-L220)).
- [GANHO REAL] Densidades e modo dinâmico de cards com medição automática de altura ([src/templates/devices-2.vue#L230-L360](src/templates/devices-2.vue#L230-L360)).
- [GANHO REAL] Exportações (PDF/XLSX/JSON) e relatórios profissionais com templates ([src/templates/devices-2.vue#L300-L520](src/templates/devices-2.vue#L300-L520)).
- [GANHO REAL] Filtro combinado por tempo offline (chips) e badge de filtros ativos ([src/templates/devices-2.vue#L140-L220](src/templates/devices-2.vue#L140-L220)).
- [GANHO REAL] Importação de devices via Excel (devices-dark) com passos e logs ([src/templates/devices-dark.vue#L840-L1500](src/templates/devices-dark.vue#L840-L1500)).
- [COSMÉTICO] Tema escuro com animações e badges destacadas (devices-dark) ([src/templates/devices-dark.vue#L1-L200](src/templates/devices-dark.vue#L1-L200)).
- [DÍVIDA TÉCNICA] Combinadores de filtros GPS massivos e listas grandes (devices-dark) ([src/templates/devices-dark.vue#L900-L1400](src/templates/devices-dark.vue#L900-L1400)).

## O que existe na produção e SUMIU em devices-2 (potencial risco)
- [RISCO] Prefetch de [src/templates/devices.internal.vue](src/templates/devices.internal.vue) para primeiro clique rápido (ausente em devices-2/dark) ([src/templates/devices.vue#L200-L210](src/templates/devices.vue#L200-L210)).
- [RISCO] Virtual scroll simples ajustado para altura fixa de 33px; devices-2 usa altura dinâmica que pode quebrar mapa/ícones se medir errado.
- [RISCO] Manipulação explícita de ícones (remove/add) por device durante filtro; em devices-2 essa lógica mudou para slice e pode deixar ícones antigos se não sincronizado.
- [BUG PROVÁVEL] devices-2 depende de `DeviceItem` inexistente; copiar sem arquivo quebra build.
- [BUG PROVÁVEL] devices-2 não trata `edit-group` injetado (só `edit-device`), pode faltar ação de grupo existente na prod.

## Comportamentos divergentes
- Filtro de texto: prod procura em `device` e `attributes`; devices-2 inclui grupo, posição e parse de `query` com tempo; dark limpa filtros ao fechar painel → pode surpreender usuário.
- Ordenação por estado: prod usa `setSortingByState` com ciclo motion→anchor→locked→ignition→driver→alert; dark manipula classe e pode resetar store.
- Integração com mapa: prod remove/add ícones por device; dark usa classes CSS para clustering e muta store, aumentando risco de divergência.
- Export: prod inexistente; devices-2/dark criam arquivos locais; exige política de permissão/limite.
- Import: apenas dark; requer validação e quotas.
