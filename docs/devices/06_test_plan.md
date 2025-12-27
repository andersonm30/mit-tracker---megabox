# Plano de Testes

## Smoke obrigatório pós-deploy
1) Login → /devices carrega lista em <2s com 50 devices.
2) Busca textual retorna resultados consistentes e mantém ícones no mapa.
3) Ordenação por nome/status/lastUpdate funciona e reflete na UI.
4) Clique abre device interno e volta sem perder filtros.

## Casos manuais
- 0 devices: exibir vazio sem erro/console; mapa sem ícones.
- 1 device: filtros e ordenação não quebram; clique abre detalhes.
- 500+ devices: scroll suave, sem freezing; memória estável; sem lag no mapa.
- Devices sem posição: renderiza ícone cinza e não quebra tooltip.
- Conexão lenta: inputs responsivos; debounce evita múltiplas chamadas; não bloquear UI em export.
- Websocket instável: lista não duplica; estados permanecem consistentes.
- Mobile (≤420px): barra ajustada, botões acessíveis, scroll usable.
- Dark mode (benchmark): validar contraste se adicionarmos tema.

## Automatizáveis (se infra permitir)
- Unidade: funções de filtro (`matchTimeQuery`, `applyAdvanced`, `recalcDevices`) com mocks de store e posições.
- E2E: fluxo login → filtro → clique → voltar; export (gera arquivo) guard rails; responsividade snapshot.
- Performance: medir tempo de `recalcDevices` com 2k devices (p95 < 50ms) e scroll paint < 16ms.

## Casos de borda específicos
- Consulta `last:-60 minutos` e `last:+1 dias` simultâneo (somente último aplicado).
- Filtro combinando situação + estado + GPS brand.
- Device com `attributes.situacao` undefined: deve passar em filtro "todos".
- Device com ícone array vs objeto (usar helpers safe).
- Alarme sem code: tooltip `alarms.none` e cor neutra.
