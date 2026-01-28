# 🔍 DIFF VISUAL — edit-users.vue (Antes → Depois)

**Data:** 25/01/2026

---

## 📸 **SCREENSHOTS ESPERADOS**

### **ANTES (edit-users.vue original)**
```
┌─────────────────────────────────────────────────────┐
│ [X] Usuários (header roxo/azul genérico)           │
├─────────────────────────────────────────────────────┤
│ [Total: 150] [Admins: 5] [Suspensos: 12]          │
├─────────────────────────────────────────────────────┤
│ [Busca...] [Mostrando 150 de 150] [+ Adicionar]   │
├─────────────────────────────────────────────────────┤
│ ID │ Nome          │ Email        │ Admin │ Status │
│ 1  │ João Silva    │ joao@x.com   │ ✅    │ Ativo  │
│ 2  │ Maria Santos  │ maria@y.com  │ ❌    │ Ativo  │
│ 3  │ Pedro Costa   │ pedro@z.com  │ ❌    │ Susp.  │
│                                              │ ⋯  │
└─────────────────────────────────────────────────────┘
                [Fechar]
```

---

### **DEPOIS (edit-users.vue MITApp)**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [X] 🧑‍🤝‍🧑 Usuários (header gradiente laranja MIT)                         │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────────┐                           │
│ │ 👥 150│ │ 🛡️ 5  │ │ 🔒 12 │ │ ⚠️ 8      │   (4 cards clicáveis)     │
│ │ Total │ │ Admin │ │ Susp. │ │ Devedores │                           │
│ └───────┘ └───────┘ └───────┘ └───────────┘                           │
├─────────────────────────────────────────────────────────────────────────┤
│ [🔍 Busca...] [Mostrando 150 de 150] [Use ⋯] [❌ Limpar] [+ Adicionar]│
├─────────────────────────────────────────────────────────────────────────┤
│ ID │ Nome        │ Email      │ 🚗 Dev │ 👥 Users │ Admin │ Status │ ⋯│
│ 1  │ 👤JS João   │ joao@x.com │   25   │    3     │  ✅   │ Ativo  │ ⋯│
│    │    x.com    │            │        │          │       │        │  │
│ 2  │ 👤MS Maria  │maria@y.com │   18   │    0     │  ❌   │ Ativo  │ ⋯│
│    │    y.com    │            │        │          │       │        │  │
│ 3  │ 👤PC Pedro  │pedro@z.com │    5   │    1     │  ❌   │ Susp.  │ ⋯│
│    │    z.com    │            │        │          │       │        │  │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│ [🗑️ Remover] [✏️ Editar] [📋 Logs]                                      │
│ [👥 Users] [🚗 Devices] [📍 Geo] [👨‍👩‍👧 Groups] [🔔 Notif] [📅 Cal]...     │
│ [🎫 Sessão] [📄 PDF] [📊 Excel]                      [❌ Fechar]        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 **DIFF ESTRUTURAL**

### **Template (Adições)**

```diff
<!-- ANTES -->
<el-dialog class="users-dialog" v-model="show">
  <template #header>
    <div class="users-modal-header">
      <i class="fas fa-users"></i>
      <div>Usuários</div>
    </div>
  </template>

  <!-- Stats: 3 cards -->
  <div class="users-stats-grid">
    <div>Total</div>
    <div>Admins</div>
    <div>Suspensos</div>
  </div>

  <!-- Tabela: 5 colunas -->
  <el-table-column prop="id" label="ID" />
  <el-table-column prop="name" label="Nome" />
  <el-table-column prop="email" label="Email" />
  <el-table-column label="Admin" />
  <el-table-column label="Status" />

  <!-- Footer: 1 botão -->
  <template #footer>
    <el-button @click="show = false">Fechar</el-button>
  </template>
</el-dialog>

<!-- DEPOIS -->
<el-dialog 
  class="users-dialog users-dialog--mitapp" 
  v-model="show"
+ @opened="handleModalOpened"
+ @closed="handleModalClosed"
>
  <template #header>
    <div class="users-modal-header">
      <i class="fas fa-users header-icon"></i>
      <div class="header-title">Usuários</div>
    </div>
  </template>

  <!-- Stats: 4 cards (+ Devedores) -->
  <div class="users-stats-grid">
    <div class="stat-card--total">Total</div>
    <div class="stat-card--admin">Admins</div>
    <div class="stat-card--suspended">Suspensos</div>
+   <div v-if="showDebtorsCard" class="stat-card--debtors">Devedores</div>
  </div>

  <!-- Tabela: 10 colunas (+ Devices, Users, Billing) -->
  <el-table-column prop="id" label="ID" />
  <el-table-column prop="name" label="Nome">
    <!-- Avatar + chip de domínio -->
  </el-table-column>
  <el-table-column prop="email" label="Email" />

+ <!-- NOVO: Contadores clicáveis -->
+ <el-table-column label="Dispositivos">
+   <div @click.stop="showDevicesModal" @dblclick.stop="refresh">
+     <i v-if="loading" class="fa-spinner fa-spin"></i>
+     {{ count }}
+   </div>
+ </el-table-column>

+ <el-table-column label="Usuários">
+   <div @click.stop="showUsersModal" @dblclick.stop="refresh">
+     {{ count }}
+   </div>
+ </el-table-column>

+ <!-- NOVO: Billing (condicional) -->
+ <el-table-column v-if="showBillingColumns" label="Fact. Pend." />
+ <el-table-column v-if="showBillingColumns" label="Saldo Pend." />
+ <el-table-column v-if="showBillingColumns" label="Últ. Venc." />

  <el-table-column label="Admin" />
  <el-table-column label="Status" />

+ <!-- NOVO: Mobile cards -->
+ <div class="mobile-users-list">
+   <div v-for="user in users" class="mobile-user-card">
+     <div class="mobile-user-avatar">{{ initials }}</div>
+     <div class="mobile-user-counts">
+       <div @click.stop="showDevices">🚗 {{ count }}</div>
+       <div @click.stop="showUsers">👥 {{ count }}</div>
+     </div>
+   </div>
+ </div>

  <!-- Footer: 15 botões -->
  <template #footer>
    <div class="users-footer--expanded">
+     <!-- Grupo 1: Ações -->
+     <el-button type="danger" @click="doDelete">Remover</el-button>
+     <el-button type="warning" @click="edit">Editar</el-button>
+     <el-button @click="showLogs">Logs</el-button>

+     <!-- Grupo 2: Relações -->
+     <el-button @click="handleRelation('users')">Users</el-button>
+     <el-button @click="handleRelation('devices')">Devices</el-button>
+     <el-button @click="handleRelation('geofences')">Geofences</el-button>
+     <!-- ... 7 botões mais ... -->

+     <!-- Grupo 3: Extras -->
+     <el-button type="success" @click="createSession">Sessão</el-button>
+     <el-button type="info" @click="generatePdf">PDF</el-button>
+     <el-button type="info" @click="generateExcel">Excel</el-button>

      <el-button @click="show = false">Fechar</el-button>
    </div>
  </template>
</el-dialog>
```

---

### **Script (Adições)**

```diff
<!-- ANTES -->
const query = ref('')
const selected = ref(0)
const show = ref(false)
const selectedFilter = ref('all')
const sorting = ref('id-asc')

const filteredUsers = computed(() => { ... })
const filteredUsersFinal = computed(() => { ... })

<!-- DEPOIS -->
const query = ref('')
const selected = ref(0)
const show = ref(false)
const selectedFilter = ref('all')
const sorting = ref('id-asc')

+ // MITAPP: Cache de contadores
+ const deviceCounts = ref({})
+ const userCounts = ref({})
+ const loadingCounts = ref({})

+ // MITAPP: Billing
+ const userInvoices = ref({})

+ // MITAPP: Exports
+ const isGeneratingPDF = ref(false)

const filteredUsers = computed(() => { ... })

+ // MITAPP: Computed para billing
+ const debtorsCount = computed(() => {
+   return users.filter(u => hasDebt(u)).length
+ })

+ const showDebtorsCard = computed(() => {
+   return isAdmin && hasInvoicesModule
+ })

+ const showBillingColumns = computed(() => {
+   return isAdmin && hasInvoicesModule
+ })

const filteredUsersFinal = computed(() => {
  if (filter === 'all') return base
  if (filter === 'admin') return base.filter(u => u.admin)
  if (filter === 'suspended') return base.filter(u => u.disabled)
+ if (filter === 'debtors') return base.filter(u => hasDebt(u))
  return base
})

+ // MITAPP: Funções de contadores
+ const getUserDeviceCount = (userId) => {
+   if (loading[userId]) return '...'
+   return counts[userId] ?? '-'
+ }

+ const showDevicesModal = (userId) => {
+   linkObjectsRef?.showObjects({ userId, type: 'devices' })
+ }

+ const refreshUserCounts = async (userId) => {
+   loading[userId] = true
+   const [devices, users] = await Promise.all([
+     dispatch('getUserDevices', userId),
+     dispatch('getUserUsers', userId)
+   ])
+   counts[userId] = devices.length
+   loading[userId] = false
+ }

+ // MITAPP: Billing
+ const getPendingInvoices = (userId) => { ... }
+ const formatCurrency = (value) => { ... }

+ // MITAPP: Relações
+ const handleRelationButtonClick = (type) => {
+   linkObjectsRef?.showObjects({ userId: selected, type })
+ }

+ // MITAPP: Criar sessão
+ const createSession = () => {
+   dispatch('auth/createSessionAs', selected)
+ }

+ // MITAPP: Exports (stub Fase 1)
+ const generatePdf = () => {
+   ElMessage.info('Funcionalidade em desenvolvimento')
+ }

+ // MITAPP: Lifecycle
+ const handleModalOpened = () => {
+   // Carregar contadores dos primeiros 20 usuários
+   visibleUsers.slice(0, 20).forEach(u => refreshUserCounts(u.id))
+   if (hasInvoices) loadUserInvoices()
+ }

+ const handleModalClosed = () => {
+   // Limpar cache (prevenir memory leak)
+   deviceCounts.value = {}
+   userCounts.value = {}
+   loadingCounts.value = {}
+   userInvoices.value = {}
+ }

+ // MITAPP: Watch para limpar ao fechar
+ watch(show, (newVal) => {
+   if (!newVal) handleModalClosed()
+ })
```

---

### **Style (Adições)**

```diff
<!-- ANTES -->
:deep(.users-dialog.el-dialog) {
  --u-bg: #ffffff;
  --u-accent-1: #667eea;
  --u-accent-2: #764ba2;
}

.users-modal-header {
  background: linear-gradient(135deg, var(--u-accent-1), var(--u-accent-2));
}

.users-stats-grid {
  grid-template-columns: repeat(3, 1fr);
}

.stat-card {
  background: linear-gradient(135deg, var(--u-accent-1), var(--u-accent-2));
}

.users-footer {
  padding: 4px 12px;
}

<!-- DEPOIS -->
:deep(.users-dialog.el-dialog) {
+ /* MITAPP: Tokens laranja MIT */
+ --mit-accent: #FF6B35;
+ --mit-accent-secondary: #F7931E;
+ --mit-accent-gradient: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
  --mit-bg: #ffffff;
  --mit-surface: #ffffff;
}

.users-modal-header {
+ background: var(--mit-accent-gradient);
+ padding: 16px 52px 16px 20px;
}

.users-stats-grid {
+ /* MITAPP: 4 cards (3+1 devedores) */
+ grid-template-columns: repeat(4, 1fr);
}

+ /* MITAPP: Cards com cores distintas */
+ .stat-card--total {
+   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
+ }

+ .stat-card--admin {
+   background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
+ }

+ .stat-card--suspended {
+   background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
+ }

+ .stat-card--debtors {
+   background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
+ }

+ /* MITAPP: Contadores clicáveis */
+ .clickable-count {
+   display: inline-flex;
+   align-items: center;
+   gap: 7px;
+   padding: 7px 14px;
+   border-radius: 8px;
+   background: rgba(255, 107, 53, 0.1);
+   cursor: pointer;
+   transition: all 0.2s ease;
+ }

+ .clickable-count:hover {
+   background: rgba(255, 107, 53, 0.2);
+   transform: scale(1.05);
+ }

+ /* MITAPP: Mobile cards */
+ .mobile-users-list {
+   display: none;
+ }

+ @media (max-width: 768px) {
+   .users-table--desktop {
+     display: none !important;
+   }
+   
+   .mobile-users-list {
+     display: block;
+   }
+ }

+ /* MITAPP: Footer expandido */
+ .users-footer--expanded {
+   padding: 12px 16px;
+   display: flex;
+   flex-wrap: wrap;
+   gap: 8px;
+ }

+ .footer-group {
+   display: flex;
+   gap: 6px;
+ }

+ .footer-group--actions {
+   border-right: 1px solid var(--mit-border);
+   padding-right: 12px;
+ }

+ @media (max-width: 768px) {
+   .users-footer--expanded {
+     display: grid !important;
+     grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
+   }
+   
+   .btn-text {
+     display: none !important;
+   }
+ }
```

---

## 📊 **MÉTRICAS DE MUDANÇA**

| Seção | Linhas Antes | Linhas Depois | Delta |
|-------|--------------|---------------|-------|
| **Template** | 380 | 720 | +340 (+89%) |
| **Script** | 530 | 870 | +340 (+64%) |
| **Style** | 240 | 430 | +190 (+79%) |
| **TOTAL** | 1.150 | 2.020 | +870 (+76%) |

---

## 🎨 **MUDANÇAS VISUAIS**

### **Paleta de Cores**

**ANTES:**
- Primary: `#667eea` (roxo)
- Secondary: `#764ba2` (roxo escuro)

**DEPOIS (MITApp):**
- Primary: `#FF6B35` (laranja MIT)
- Secondary: `#F7931E` (laranja dourado)

---

### **Cards de Estatísticas**

**ANTES:**
- 3 cards iguais (todos roxos)
- Grid 3 colunas

**DEPOIS:**
- 4 cards distintos (roxo, rosa, laranja, vermelho)
- Grid 4 colunas (desktop) → 2 (tablet) → 1 (mobile)
- Hover: sombra + translateY(-2px)

---

### **Tabela**

**ANTES:**
- 5 colunas fixas
- Sem contadores
- Sem billing

**DEPOIS:**
- 10 colunas (5 originais + 2 contadores + 3 billing*)
- Contadores clicáveis (+ duplo-clique)
- Avatar com iniciais
- Chip de domínio de email

---

### **Footer**

**ANTES:**
- 1 botão (Fechar)
- Alinhado à direita

**DEPOIS:**
- 15 botões organizados em 3 grupos
- Layout flex com wrap
- Mobile: grid 44px
- Tooltips em todos os botões

---

## ✅ **VALIDAÇÃO RÁPIDA**

### **Como saber se patch foi aplicado corretamente:**

1. ✅ Header tem gradiente laranja (não roxo)
2. ✅ 4 cards de stats (não 3)
3. ✅ Colunas "Dispositivos" e "Usuários" existem
4. ✅ Footer tem múltiplos botões (não só "Fechar")
5. ✅ Mobile: tabela vira cards
6. ✅ Console sem erros

### **Como saber se algo deu errado:**

1. ❌ Header ainda roxo → CSS não carregou
2. ❌ Contadores mostram "undefined" → Store não populado
3. ❌ Backdrop acumula → Eventos @closed/@opened não conectados
4. ❌ Botões de relação não funcionam → linkObjectsRef não injetado
5. ❌ Footer quebrado no mobile → CSS mobile não aplicado

---

**✅ DIFF VISUAL COMPLETO**
