# Gap Analysis (curto)

## A) Divergências principais
- UI/UX: baseline sem painel de filtros avançados, chips/badges, contadores; devices-2/dark trazem cards dinâmicos, filtros ricos, relatórios/export/import.
- Filtros: baseline só texto + situacao; devices-2 adiciona estado/combos/avançados/GPS; dark inclui combinedAdvancedFilters e sincroniza com store.devices.applyFilters.
- Map sync: baseline e devices-2 fazem add/remove de ícones na janela visível; dark tem lógica de clustering e manipula DOM/classes adicionais.
- Export/relatórios: ausentes no baseline; presentes em devices-2 (PDF/XLSX) e dark (PDF/XLSX/JSON simples + import Excel).
- Theme/escopo CSS: baseline scoped claro; devices-2 scoped detalhado; dark não scoped e tema escuro global (risco de bleed).

## B) Blocos/pendências
- `DeviceItem` importado em devices-2/dark não existe no repo; precisa criar fallback ou ajustar template antes de portar.
- Aplicação usa arquivos em `src/templates`, não há `devices*.vue` em `src/components`; alinhar destino dos merges.
- Integração `reports` e `combinedAdvancedFilters` do store precisa validação antes de expor UI.

## C) Itens para portar (ordem sugerida)
1) UI básica: barra de busca compacta + botão de filtros, contadores e chips de filtros ativos.
2) Painel de filtros: estado/situação/offline/avançados/GPS com persistência local, mas sem alterar engine do store inicialmente.
3) Janela virtual + sync de ícones: manter baseline e adicionar limpeza segura ao esconder.
4) Export simples (PDF/XLSX) opcional atrás de flag; import deixar fora na primeira etapa.
5) Estilos: trazer apenas blocos scoped claros do devices-2; evitar CSS global do dark.

## D) Riscos
- Falta de `DeviceItem` quebra build se importar sem fallback.
- Manipulação de ícones no dark usa DOM/class extra; risco de vazamento de estilos ao misturar.
- Relatórios/import dependem de módulos `reports` e permissões; checar antes de ligar por padrão.
