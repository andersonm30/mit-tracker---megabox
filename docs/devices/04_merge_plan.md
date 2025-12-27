# Plano de Merge (evoluir a partir de devices.vue)

## Fase 1 – Segurança e Performance (prioridade)
- Mudanças: manter virtual scroll existente e adicionar debounce/configurável; sincronizar ícones apenas para slice visível; portar parsing de query por tempo e filtros básicos estruturados.
- Arquivos: [src/templates/devices.vue](src/templates/devices.vue), [src/store/modules/devices.js](src/store/modules/devices.js).
- Trechos a adaptar: `matchTimeQuery` e filtros de estado/situação de [src/templates/devices-2.vue#L600-L820](src/templates/devices-2.vue#L600-L820); slice visível com sync de ícones de [src/templates/devices-2.vue#L1120-L1190](src/templates/devices-2.vue#L1120-L1190).
- Critérios de aceite: scroll fluido com 500+ devices; sem vazamento de ícones no mapa; mesma ordenação e resultados da produção para filtros equivalentes.
- Rollback: preservar branch com `devices.vue` original; feature-flag para novo cálculo de filtros; toggle para caminho antigo.

## Fase 2 – UX/UI controlada
- Mudanças: barra de busca com badge de filtros; painel de filtros avançados enxuto (estado, situação, conectividade, âncora/driver/ignition/locked); densidades (compact/cozy) sem cards dinâmicos inicialmente.
- Arquivos: [src/templates/devices.vue](src/templates/devices.vue), estilos locais.
- Trechos: painel de filtros de [src/templates/devices-2.vue#L40-L220](src/templates/devices-2.vue#L40-L220); badges de contagem [src/templates/devices-2.vue#L300-L360](src/templates/devices-2.vue#L300-L360).
- Critérios: toggle para habilitar painel; responsivo até 420px; não alterar mapa/comandos existentes.
- Rollback: esconder painel via flag; manter barra original disponível.

## Fase 3 – Funcionalidades premium
- Mudanças: exportações PDF/XLSX/JSON de devices visíveis; chips de offlines; filtros GPS brand/model/tech (lista curta); modo cards dinâmico opcional.
- Arquivos: [src/templates/devices.vue](src/templates/devices.vue); considerar módulo dedicado para export util.
- Trechos: export helpers de [src/templates/devices-2.vue#L1180-L1500](src/templates/devices-2.vue#L1180-L1500); chips offlines [src/templates/devices-2.vue#L140-L200](src/templates/devices-2.vue#L140-L200).
- Critérios: export respeita filtros e permissões admin; arquivos baixam em <3s com 2k linhas; cards dinâmicos atrás de flag.
- Rollback: desativar flag de premium; remover botões via feature toggle.

## Fase 4 – Importação (opcional)
- Mudanças: importar devices via Excel com validação mínima (uniqueId, name, grupo opcional), sem clustering/DOM direto.
- Arquivos: novo componente isolado (não misturar com template principal) inspirado em [src/templates/devices-dark.vue#L840-L1500](src/templates/devices-dark.vue#L840-L1500).
- Critérios: feature só para admin; preview com 5 linhas; aborta em erro; sem mutar store diretamente (usar ações dedicadas).
- Rollback: esconder modal; remover rota/entrada do menu.

## Regras gerais
- Sempre partindo de `devices.vue`. Nenhuma remoção de fluxo crítico sem substituto funcional comprovado.
- Introduzir flags (ex.: `env.devicesNewFilters`, `env.devicesExports`) para alternar caminhos.
- Manter integração com `devices.internal` e prefetch existente até validar nova UI.
