# 🚀 ROADMAP — edit-users.vue MITApp

**Versão Atual:** Fase 1 MVP (70% funcional)  
**Data:** 25/01/2026

---

## ✅ **FASE 1 — MVP (IMPLEMENTADA)**

**Status:** ✅ Completa  
**Tempo Estimado:** 4-6 horas  
**Linhas de Código:** ~1.800

### Funcionalidades Entregues

1. ✅ **Colunas Devices + Users** com cache local
   - `deviceCounts`, `userCounts`, `loadingCounts`
   - Clique simples: abre modal linkObjects
   - Duplo-clique: força refresh do contador
   - Loading state por célula (spinner)

2. ✅ **Card "Devedores"** (4º stats card)
   - Filtro dedicado `selectedFilter = 'debtors'`
   - Condicional: só aparece se `modules.includes('invoices')` + admin
   - Computed `debtorsCount`

3. ✅ **Colunas de Billing** (condicionais)
   - "Fact. Pend." → `getPendingInvoices(userId)`
   - "Saldo Pend." → `formatCurrency(getPendingBalance(userId))`
   - "Últ. Venc." → `getLastDueDate(userId)`
   - Só aparecem se módulo invoices ativo + admin

4. ✅ **Footer Expandido** (15 botões)
   - Grupo 1: Remover, Editar, Logs
   - Grupo 2: Users, Devices, Geofences, Groups, Notifications, Calendars, Attributes, Drivers, Commands, Maintenance
   - Grupo 3: Criar Sessão, PDF, Excel
   - Layout responsivo (grid 44px mobile)

5. ✅ **UX MITApp Original**
   - Tokens CSS MIT (`--mit-accent: #FF6B35`, `--mit-accent-secondary: #F7931E`)
   - Paleta laranja MIT (não cópia do dark)
   - Header com gradiente MIT
   - Cards stats com cores distintas
   - Microinterações (hover, scale)

6. ✅ **Mobile View**
   - Cards substituem tabela em `@media (max-width: 768px)`
   - Footer vira grid 44px
   - Textos viram ícones

7. ✅ **Limpeza de Cache**
   - `watch(show)` limpa refs ao fechar
   - Previne memory leak

8. ✅ **Integração Intacta**
   - `editUserRef`, `linkObjectsRef`, `logObjectsRef`
   - Eventos `@opened/@closed` corretos

### Lógica de Negócio Preservada

- ✅ `doDelete()` com proteções (não deletar a si mesmo, admin superior)
- ✅ Permissões `advancedPermissions(17/18/19...)`
- ✅ Ocultar user ID 1
- ✅ Filtros e sorting funcionais
- ✅ Dropdown de ações por linha (⋯)

---

## 🔄 **FASE 2 — FEATURE COMPLETO (90% funcional)**

**Status:** 🟡 Planejada  
**Tempo Estimado:** 6-8 horas  
**Linhas Adicionais:** ~700 (total: ~2.500)

### Funcionalidades a Implementar

1. **🎯 Exports PDF/Excel Reais**
   - Lazy load: `import('jspdf')` e `import('xlsx')`
   - PDF com jsPDF AutoTable
   - Excel com `XLSX.utils.json_to_sheet`
   - Progress bar durante geração
   - Limite de 1000 linhas (performance)
   - Incluir logo MIT no PDF
   - Formatar billing no export

2. **🎯 Sorting nas Colunas de Contadores**
   - Criar computed `usersWithCounts`:
     ```js
     const usersWithCounts = computed(() => {
       return filteredUsers.value.map(user => ({
         ...user,
         deviceCount: getUserDeviceCount(user.id),
         userCount: getUserUserCount(user.id)
       }))
     })
     ```
   - Passar `usersWithCounts` pra tabela
   - Adicionar headers sortable

3. **🎯 Carregamento Assíncrono de Contadores**
   - Carregar contadores em batch (20 por vez)
   - Observer para lazy load ao rolar tabela
   - Cache persistente (sessionStorage)
   - Invalidação inteligente (5 min)

4. **🎯 Botão "Atualizar Todos os Contadores"**
   - No toolbar, ao lado de "Adicionar"
   - Força refresh de todos os visíveis
   - Progress bar: "Atualizando 15/50..."

5. **🎯 Melhorias Mobile**
   - Swipe to delete no card
   - Pull to refresh
   - Virtual scroll (performance com 500+ users)

6. **🎯 Filtros Avançados**
   - Dropdown com multi-select: Admin + Suspenso
   - Range de IDs
   - Data de criação (se `created_at` existir)

7. **🎯 Tooltips Informativos**
   - Card devedores: hover mostra top 5 devedores
   - Contador: hover mostra última atualização
   - Billing: hover mostra breakdown

### Arquivos Novos

- `lib/pdf-generator.js` (lógica de PDF isolada)
- `lib/excel-generator.js` (lógica de Excel isolada)
- `composables/useUserCounters.js` (lógica de cache reutilizável)

---

## 🌟 **FASE 3 — PREMIUM (100% funcional)**

**Status:** 🔵 Futura  
**Tempo Estimado:** 8-10 horas  
**Linhas Adicionais:** ~300 (total: ~2.800)

### Funcionalidades Premium

1. **🎯 Import de Usuários (4 Etapas)**
   - **Etapa 1:** Upload de arquivo (drag & drop)
   - **Etapa 2:** Preview com validação
     - Validar emails únicos
     - Validar limites de devices/users
     - Mostrar erros inline
   - **Etapa 3:** Mapeamento de colunas
     - Auto-detect (nome, email, telefone)
     - Permitir ajuste manual
   - **Etapa 4:** Execução + Log
     - Progress bar: "Importando 25/100..."
     - Log: "✅ João Silva criado | ❌ maria@x.com (email duplicado)"
     - Botão "Baixar Log de Erros"

2. **🎯 Expansão de Linhas**
   - **Opção 1:** Modal separado (recomendado)
     - Botões "Auto" e "Usuario" abrem modal fullscreen
     - Lista com search/filtro
     - Export PDF da sublista
   - **Opção 2:** Expand slot (limitado)
     - `<el-table expand>`
     - Mostra top 10 dispositivos/users
     - Botão "Ver Todos" abre modal

3. **🎯 Animações Avançadas**
   - Transições entre filtros (fade)
   - Skeleton loading ao abrir modal
   - Confetti ao criar usuário 🎉
   - Smooth scroll ao selecionar linha

4. **🎯 Bulk Actions**
   - Checkbox selection (multi-select)
   - Footer mostra: "3 selecionados"
   - Ações em lote:
     - Deletar múltiplos
     - Exportar selecionados
     - Atribuir grupo em lote

5. **🎯 Histórico de Ações**
   - Painel lateral "Últimas 10 ações"
   - Undo/Redo (só para Fase 3+)

6. **🎯 Temas Customizáveis**
   - Picker de cor para `--mit-accent`
   - Salvar em localStorage
   - Preset: "MIT Orange", "Ocean Blue", "Forest Green"

### Arquivos Novos

- `components/UserImportModal.vue` (500+ linhas)
- `components/UserBulkActions.vue`
- `lib/import-validator.js`
- `lib/animation-utils.js`

---

## 📊 **COMPARAÇÃO DE FUNCIONALIDADES**

| Feature | Fase 1 MVP | Fase 2 Completo | Fase 3 Premium |
|---------|------------|-----------------|----------------|
| **Colunas Tabela** | 10 | 10 | 12 (+ bulk select) |
| **Cards Stats** | 4 | 4 | 5 (+ "Novos 7d") |
| **Botões Footer** | 15 | 18 | 22 (+ bulk) |
| **Exports** | Stub | PDF + Excel | PDF + Excel + Custom |
| **Imports** | ❌ | ❌ | ✅ 4 etapas |
| **Expansão Linhas** | ❌ | ❌ | ✅ Modal |
| **Mobile** | Cards básicos | Cards + swipe | Cards + virtual scroll |
| **Sorting** | 7 colunas | 9 colunas | 12 colunas |
| **Performance** | 200 users | 500 users | 2000+ users |
| **Animações** | Hover básico | Transitions | Skeleton + confetti |
| **Temas** | MIT fixo | MIT fixo | Customizável |

---

## 🎯 **PRIORIZAÇÃO RECOMENDADA**

### Deploy Imediato (Fase 1)
- ✅ MVP com 70% das funcionalidades
- ✅ UX original MITApp
- ✅ ZERO regressão
- ✅ Mobile responsivo

### Sprint 1 (2 semanas) — Fase 2
**Prioridade Alta:**
1. Exports PDF/Excel reais
2. Sorting nas colunas de contadores
3. Carregamento assíncrono de contadores

**Prioridade Média:**
4. Melhorias mobile (swipe, pull-to-refresh)
5. Filtros avançados

### Sprint 2 (3 semanas) — Fase 3
**Prioridade Alta:**
1. Import de usuários (4 etapas)

**Prioridade Baixa:**
2. Expansão de linhas
3. Animações avançadas
4. Bulk actions
5. Temas customizáveis

---

## 💡 **SUGESTÕES DE OTIMIZAÇÃO**

### Performance

1. **Virtual Scroll**
   - Usar `vue-virtual-scroller` ou `@vueuse/core`
   - Renderizar apenas 50 linhas visíveis
   - Ganho: 10x mais rápido com 1000+ users

2. **Web Workers para Exports**
   - Gerar PDF/Excel em thread separada
   - Não travar UI principal

3. **IndexedDB Cache**
   - Cachear contadores localmente
   - Sincronizar em background

### UX

1. **Feedback Visual Imediato**
   - Clique em botão → highlight instantâneo
   - Loading states em <200ms

2. **Acessibilidade**
   - ARIA labels em todos os botões
   - Navegação por teclado (Tab + Enter)
   - Focus trap no modal

3. **Analytics**
   - Trackear ações: "export_pdf", "filter_debtors", "delete_user"
   - Heatmap de cliques
   - Tempo médio no modal

---

## 🔒 **SEGURANÇA**

### Fase 2
- ✅ Validar permissões no backend antes de export
- ✅ Sanitizar input no import
- ✅ Rate limit em bulk actions

### Fase 3
- ✅ Criptografar dados sensíveis no export
- ✅ Audit log de imports
- ✅ 2FA para ações críticas (delete múltiplo)

---

## 📈 **MÉTRICAS DE SUCESSO**

| Métrica | Fase 1 | Fase 2 | Fase 3 |
|---------|--------|--------|--------|
| **Tempo de carregamento** | <2s (100 users) | <3s (500 users) | <5s (2000 users) |
| **Cliques para editar usuário** | 2 cliques | 1 clique | 1 clique |
| **Taxa de erro em deletes** | <1% | <0.5% | <0.1% |
| **Satisfação usuário (NPS)** | 7/10 | 8/10 | 9/10 |
| **Mobile usabilidade** | 6/10 | 8/10 | 9/10 |

---

**🚀 ROADMAP APROVADO PARA EXECUÇÃO**
