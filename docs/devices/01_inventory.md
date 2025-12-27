# Inventário rápido (ETAPA 0)

## Baseline — src/templates/devices.vue
- Lista com busca, sort, filtro simples de situação; scroll virtual com `realDevices`/`fakeScroll`.
- Sincroniza ícones no mapa (add/remove) para janela visível; usa tooltips globais.
- Usa Vuex devices/groups/geofences/drivers; permissões via `advancedPermissions` e limite de dispositivos.
- CSS scoped claro, sem painel de filtros avançados nem exportações.

## Nova — src/templates/devices-2.vue
- Mesma base de lista, com header compacto, botão de filtros e contadores.
- Painel de filtros avançados (estado, situação, offlines, avançados, GPS brand/model/tech); modo dinâmico (cards) opcional.
- Exportações PDF/XLSX e modal de relatórios profissionais; persistência local de filtros/estilo.
- Importa `DeviceItem` (arquivo não encontrado) e depende de módulos `reports`/permissões.

## Benchmark — src/templates/devices-dark.vue
- Tema escuro, não scoped; ações extras (relatórios simples, criar grupo, importar Excel, download template).
- Filtros ricos com combinedAdvancedFilters e GPS; integração direta com `store.state.devices.applyFilters`.
- Importação em múltiplas etapas (upload/preview/progresso); export PDF/XLSX/JSON simples.
- Usa `DeviceItem` ausente; manipula DOM/classes e clustering para mapa.

## Dependências e notas
- Rota /devices em src/routes.js; templates ficam em src/templates (não há devices*.vue em src/components).
- Módulos Vuex relevantes: devices.js (baseline), devices-dark.js (variante), reports.js, drivers.js, geofences.js, groups.js.
- Bloqueios: criar fallback/impl para `DeviceItem`; validar disponibilidade do módulo `reports` e permissões antes de ligar export/relatórios.
