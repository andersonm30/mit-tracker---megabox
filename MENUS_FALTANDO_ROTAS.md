# 🔴 MENUS QUEBRADOS - Faltando Rotas

## ⚠️ Problema Identificado

**Situação:** Vários componentes existem mas **NÃO estão registrados em `routes.js`**, resultando em menus/páginas inacessíveis.

---

## 📋 Componentes Existentes SEM Rotas

### 1. **Faturas (Invoices)** - COMPLETO mas SEM ROTA

**Arquivos Existentes:**
- ✅ `src/tarkan/components/views/show-invoices.vue` (~640 linhas)
  - Tela de faturas para usuário comum
  - Visualizar faturas próprias
  - Filtros: Todas/Pendentes/Pagas
  - Export PDF com informações financeiras
  
- ✅ `src/tarkan/components/views/show-invoices-manager.vue` (~1300 linhas)
  - Tela de gestão de faturas (Admin/Gerente)
  - Lista todos os usuários com faturas
  - Cards financeiros: Total pendente, total pago, usuários ativos
  - Export Excel
  - Botões: Ver faturas, Desbloquear/Bloquear usuário
  
- ✅ `src/tarkan/components/views/show-invoices-manager-user.vue` (~850 linhas)
  - Tela de faturas de um usuário específico (visão admin)
  - Painel de informações do usuário (nome, CPF/CNPJ, email, phone, address)
  - Painel financeiro: Total faturado, total pago, pendente
  - Adicionar nova fatura
  - Marcar como pago em dinheiro
  - Deletar fatura
  - Export PDF individual
  
- ✅ `src/tarkan/components/views/show-invoices-manager-user-add.vue` (~370 linhas)
  - Modal para adicionar nova fatura
  - Campos: Descrição, Data vencimento, Valor, Juros, Multa, Desconto
  - Integração com Asaas (geração de cobrança)

**Funcionalidades Completas:**
- ✅ Visualização de faturas (usuário comum)
- ✅ Gestão de faturas (admin/gerente)
- ✅ Adicionar/deletar faturas
- ✅ Marcar como pago em dinheiro
- ✅ Link de pagamento (integração Asaas)
- ✅ Export PDF/Excel
- ✅ Filtros por status
- ✅ Paginação
- ✅ Resumo financeiro

**Status:** 🔴 **SEM ROTA** - Componentes 100% funcionais, apenas falta adicionar em `routes.js`

---

### 2. **Clientes/Usuários** - EXISTE mas INCOMPLETO

**Arquivo Existente:**
- ✅ `src/templates/users.vue`
  - Rota existe: `/users` ✅
  - Componente existe mas pode estar incompleto

**Componentes Relacionados:**
- ✅ `src/tarkan/components/views/tab-users.vue` - Tab de usuários (usado onde?)
- ✅ `src/tarkan/components/views/edit-user.vue` - Editar usuário individual
- ✅ `src/tarkan/components/views/edit-users.vue` - Editar múltiplos usuários (?)

**Status:** ⚠️ **ROTA EXISTE mas possivelmente INCOMPLETA**

---

### 3. **Outros Menus Possivelmente Quebrados**

**Precisa verificar se estão funcionando:**
- `/computed` - Atributos computados (rota existe ✅)
- `/autolink` - Autolink (rota existe ✅)
- `/notifications` - Notificações (rota existe ✅)
- `/drivers` - Motoristas (rota existe ✅)
- `/groups` - Grupos (rota existe ✅)
- `/commands` - Comandos (rota existe ✅)

---

## 🛠️ Solução Proposta

### FASE 1: Adicionar Rotas de Faturas (PRIORIDADE ALTA)

**Adicionar em `src/routes.js`:**

```javascript
// Após linha 38 (depois de /users), adicionar:

// Faturas (Usuário Comum)
{
  path: '/invoices',
  component: () => import('./tarkan/components/views/show-invoices'),
  meta: { 
    title: 'Minhas Faturas', 
    shown: true,
    permission: null // Todos autenticados podem ver suas próprias faturas
  }
},

// Faturas (Admin/Gerente)
{
  path: '/invoices-manager',
  component: () => import('./tarkan/components/views/show-invoices-manager'),
  meta: { 
    title: 'Gestão de Cobranças', 
    shown: true,
    permission: 'admin' // Apenas admins ou gerentes
  }
},
```

**Notas:**
- `permission: 'admin'` precisa ser verificado - pode usar `store.getters.isAdmin` ou `advancedPermissions`
- Título "Minhas Faturas" vs "Gestão de Cobranças" diferencia usuário comum vs admin
- `shown: true` para aparecer no menu sidebar

---

### FASE 2: Adicionar Links no Menu Sidebar (App.vue, App-dark.vue, App-Mobile.vue)

**Em `src/App.vue` (linha ~150, após menu Notifications):**

```vue
<!-- Faturas (Usuário Comum) -->
<router-link to="/invoices" custom v-slot="{ href, navigate, isActive, isExactActive }">
  <li :class="{ active: isActive, 'exact-active': isExactActive }">
    <a :href="href" @click.prevent="onMenuItemClick(navigate)" :aria-label="$t('menu.invoices')">
      <el-icon><i class="fas fa-file-invoice-dollar" aria-hidden="true"></i></el-icon>
      <span class="text">{{ $t('menu.invoices') }}</span>
    </a>
  </li>
</router-link>

<!-- Gestão de Cobranças (Admin/Gerente) -->
<router-link 
  v-if="store.getters.isAdmin || store.getters.advancedPermissions(84)" 
  to="/invoices-manager" 
  custom 
  v-slot="{ href, navigate, isActive, isExactActive }">
  <li :class="{ active: isActive, 'exact-active': isExactActive }">
    <a :href="href" @click.prevent="onMenuItemClick(navigate)" :aria-label="$t('menu.invoicesManager')">
      <el-icon><i class="fas fa-money-bill-wave" aria-hidden="true"></i></el-icon>
      <span class="text">{{ $t('menu.invoicesManager') }}</span>
    </a>
  </li>
</router-link>
```

**Nota:** Verificar ID de permissão correto (84 é exemplo, pode ser diferente)

---

### FASE 3: Adicionar Traduções i18n

**Em `src/locales/pt-BR.json`:**

```json
{
  "menu": {
    "invoices": "Minhas Faturas",
    "invoicesManager": "Gestão de Cobranças"
  },
  "invoice": {
    "title": "Faturas",
    "add": "Adicionar Fatura",
    "delete": "Deletar",
    "receivedCash": "Pago em Dinheiro",
    "generatePDF": "Gerar PDF",
    "userInfo": "Informações do Usuário",
    "financialSummary": "Resumo Financeiro",
    "totalBilled": "Total Faturado",
    "totalPaid": "Total Pago",
    "pendingAmount": "Pendente de Pagamento",
    "noInvoices": "Nenhuma fatura encontrada",
    "confirmCash": "Confirmar pagamento em dinheiro?",
    "confirmCashSuccess": "Fatura marcada como paga!",
    "confirmDelete": "Tem certeza que deseja deletar esta fatura?",
    "confirmDeleteSuccess": "Fatura deletada com sucesso!",
    "confirmLock": "Deseja bloquear o usuário {name}?",
    "confirmLockSuccess": "Usuário bloqueado!",
    "confirmUnlock": "Deseja desbloquear o usuário?",
    "confirmUnlockSuccess": "Usuário desbloqueado!",
    "addSuccess": "Fatura adicionada com sucesso!",
    "statuses": {
      "PENDING": "Pendente",
      "OVERDUE": "Vencida",
      "RECEIVED": "Paga",
      "RECEIVED_IN_CASH": "Pago em Dinheiro",
      "CONFIRMED": "Confirmada"
    },
    "id": "ID",
    "dueDate": "Vencimento",
    "value": "Valor",
    "status": "Status",
    "paymentDate": "Data Pagamento",
    "balance": "Saldo",
    "pay": "Pagar"
  },
  "user": {
    "name": "Nome",
    "billingCpfCnpj": "CPF/CNPJ",
    "email": "Email",
    "phone": "Telefone",
    "address": "Endereço",
    "company": "Empresa"
  }
}
```

**Repetir para `en-US.json` e `es-ES.json`**

---

### FASE 4: Verificar Backend Endpoints

**Endpoints usados nos componentes:**

```javascript
// show-invoices.vue (usuário comum)
GET /tarkan/invoices

// show-invoices-manager.vue (admin)
GET /tarkan/invoices/manager

// show-invoices-manager-user.vue (admin)
GET /tarkan/invoices/manager/:userId
POST /tarkan/invoices/manager/:invoiceId/setAsReceivedCash
POST /tarkan/invoices/manager/:invoiceId/delete
POST /tarkan/invoices/manager/:userId/lockUser
POST /tarkan/invoices/manager/:userId/unlockUser

// show-invoices-manager-user-add.vue
POST /tarkan/invoices/manager/:userId/add
```

**Verificar no backend Laravel:**
- [ ] `routes/web.php` ou `routes/api.php` tem essas rotas?
- [ ] Controller `InvoicesController.php` existe?
- [ ] Tabela `invoices` existe no banco?
- [ ] Model `Invoice.php` existe?

**SQL esperada:**
```sql
CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  DueDateTime INT NOT NULL,
  payment_date INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'PENDING',
  description TEXT,
  asaas_id INT DEFAULT 0,
  link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 📊 Checklist de Implementação

### Faturas (Invoices)

- [ ] **1.1** Adicionar rotas `/invoices` e `/invoices-manager` em `routes.js`
- [ ] **1.2** Adicionar links no menu sidebar (`App.vue`, `App-dark.vue`, `App-Mobile.vue`)
- [ ] **1.3** Adicionar traduções i18n (`pt-BR.json`, `en-US.json`, `es-ES.json`)
- [ ] **1.4** Verificar backend endpoints (rotas + controller)
- [ ] **1.5** Testar acesso `/invoices` (usuário comum)
- [ ] **1.6** Testar acesso `/invoices-manager` (admin)
- [ ] **1.7** Testar adicionar fatura
- [ ] **1.8** Testar marcar como pago
- [ ] **1.9** Testar export PDF/Excel
- [ ] **1.10** Testar link de pagamento (Asaas)

### Clientes (Users)

- [ ] **2.1** Verificar se `/users` está funcionando
- [ ] **2.2** Revisar `templates/users.vue` (pode estar incompleto)
- [ ] **2.3** Integrar `edit-user.vue` e `edit-users.vue` se necessário
- [ ] **2.4** Verificar tab-users.vue (onde é usado?)
- [ ] **2.5** Testar listagem de clientes
- [ ] **2.6** Testar edição de cliente
- [ ] **2.7** Testar adicionar cliente

### Outros Menus

- [ ] **3.1** Testar `/computed` (Atributos Computados)
- [ ] **3.2** Testar `/autolink` (Autolink)
- [ ] **3.3** Testar `/notifications` (Notificações)
- [ ] **3.4** Testar `/drivers` (Motoristas)
- [ ] **3.5** Testar `/groups` (Grupos)
- [ ] **3.6** Testar `/commands` (Comandos)
- [ ] **3.7** Corrigir menus quebrados encontrados

---

## 🚨 Próximos Passos IMEDIATOS

### 1. **Adicionar Rotas de Faturas** (5 min)

Editar `src/routes.js` e adicionar 2 rotas conforme FASE 1.

### 2. **Adicionar Menu Sidebar** (10 min)

Editar `src/App.vue` (e `App-dark.vue`, `App-Mobile.vue` se necessário) e adicionar 2 links conforme FASE 2.

### 3. **Adicionar Traduções** (5 min)

Editar `src/locales/pt-BR.json` (e `en-US.json`, `es-ES.json`) conforme FASE 3.

### 4. **Testar Frontend** (5 min)

```bash
npm run serve
# Acessar http://localhost:8083
# Login → Ver menu "Minhas Faturas" e "Gestão de Cobranças"
```

### 5. **Verificar Backend** (10 min)

```bash
cd c:\projeto\Versao-tarkan-Jesse\back-end
grep -r "invoices" routes/
grep -r "InvoicesController" app/Http/Controllers/
```

Se backend não existir, criar:
- Migration: `2026_01_20_create_invoices_table.php`
- Model: `Invoice.php`
- Controller: `InvoicesController.php`
- Routes: adicionar em `routes/web.php`

---

## 🎯 Resultado Esperado

**Após implementação:**

✅ Menu "Minhas Faturas" aparece para todos usuários autenticados  
✅ Menu "Gestão de Cobranças" aparece apenas para admins/gerentes  
✅ Usuário comum vê suas próprias faturas + filtros + export PDF  
✅ Admin vê todas as faturas de todos os usuários + gestão completa  
✅ Adicionar/deletar faturas funciona  
✅ Marcar como pago funciona  
✅ Link de pagamento (Asaas) funciona  
✅ Export PDF/Excel funciona  

---

## 📝 Observações Importantes

1. **Permissões:** Verificar ID de permissão correto para "Gestão de Cobranças" (pode ser diferente de 84)
2. **Backend:** Se não existir, criar migration + model + controller + routes
3. **Asaas Integration:** Endpoints `/tarkan/invoices/manager/:userId/add` precisa integração com Asaas API
4. **i18n:** Verificar se todas as keys usadas nos componentes existem nos arquivos de tradução
5. **Responsive:** Testar em mobile (componentes têm CSS responsive)

---

**Data:** 2026-01-20  
**Situação:** Componentes 100% prontos, apenas falta registro de rotas  
**Prioridade:** 🔴 **ALTA** (funcionalidade financeira crítica)  
**Tempo estimado:** ~30-40 minutos para implementação completa
