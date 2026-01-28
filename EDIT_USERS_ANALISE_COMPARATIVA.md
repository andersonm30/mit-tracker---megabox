# 📄 ANÁLISE COMPARATIVA — edit-users.vue vs edit-users-dark.vue

**Data:** 25 de janeiro de 2026  
**Objetivo:** Transformar `edit-users.vue` para o nível do `edit-users-dark.vue`  
**Estratégia:** Dark mode via tokens CSS + UX moderno + 1 componente único

---

## 🔍 VISÃO GERAL

| Métrica | edit-users.vue (Atual) | edit-users-dark.vue (Modelo) | Delta |
|---------|------------------------|------------------------------|-------|
| **Linhas Totais** | 1.151 | 3.916 | +2.765 |
| **Funcionalidades** | 12 básicas | 28 completas | +16 |
| **Colunas Tabela** | 5 (ID, Nome, Email, Admin, Status) | 10 (+ Devices, Users, Billing) | +5 |
| **Botões Footer** | 1 (Fechar) | 18 (ações completas) | +17 |
| **Modais Internos** | 0 | 1 (importação) | +1 |
| **Exports** | 0 | 2 (PDF + Excel) | +2 |
| **Imports** | 0 | 1 (Excel com 4 etapas) | +1 |
| **Cards Stats** | 3 (Total, Admin, Suspensos) | 4 (+ Deudores) | +1 |
| **Expansão de Linhas** | ❌ Não | ✅ Sim (devices/users) | +1 |
| **Mobile View** | Tabela quebrada | Cards otimizados | ✅ |

---

## ✅ MANTER (do edit-users.vue atual)

### 🏗️ Estrutura Base Sólida

1. **Sistema de Tokens CSS** (já implementado):
   ```css
   --u-bg, --u-surface, --u-muted-bg, --u-border, --u-text, 
   --u-subtext, --u-subtle, --u-accent-1, --u-accent-2, 
   --u-shadow, --u-shadow-hover
   ```

2. **Header Moderno**:
   - ✅ Gradient `linear-gradient(135deg, var(--u-accent-1), var(--u-accent-2))`
   - ✅ Ícone + título bem posicionados
   - ✅ X do close não invade o header (padding correto)

3. **Cards de Estatísticas**:
   - ✅ Grid responsivo (3 colunas desktop → 1 coluna mobile)
   - ✅ Clicáveis com filtro ativo
   - ✅ Hover com transform + shadow

4. **Tabela `<el-table>`**:
   - ✅ Sorting funcional (7 colunas)
   - ✅ Highlight da linha selecionada
   - ✅ Stripe alternado
   - ✅ Cursor pointer

5. **Busca e Filtros**:
   - ✅ Input com ícone de search
   - ✅ Filtro por query (busca em todos os campos + attributes)
   - ✅ Filtro por tipo (all/admin/suspended)
   - ✅ Contador "Mostrando X de Y"

6. **Empty State**:
   - ✅ Ícone grande com opacity
   - ✅ Título + subtítulo
   - ✅ Botões de ação (limpar filtro, adicionar user)

7. **Dropdown de Ações (⋯)**:
   - ✅ Por linha da tabela
   - ✅ 10+ itens (edit, delete, logs, link_users, link_devices, link_geofences, etc.)
   - ✅ Ícones + texto
   - ✅ Classe `.danger-item` para delete

8. **Features Premium**:
   - ✅ Avatar com iniciais (2 letras)
   - ✅ Chip de domínio de email
   - ✅ Watch para resetar seleção ao trocar filtro

### 🔒 Lógica de Negócio (Preservar Integralmente)

1. **Segurança em `doDelete()`**:
   ```js
   - Não pode deletar a si mesmo
   - Não pode deletar admin superior
   - Confirmação com ElMessageBox
   ```

2. **Permissões**:
   ```js
   store.getters.advancedPermissions(17) // Adicionar
   store.getters.advancedPermissions(18) // Editar
   store.getters.advancedPermissions(19) // Deletar
   ```

3. **Integração com Componentes**:
   ```js
   editUserRef?.editUser(userId)
   linkObjectsRef?.showObjects({ userId, type: 'devices' })
   logObjectsRef?.showLogs({ userId })
   ```

4. **Ocultar User ID 1**:
   ```js
   if (f.id === 1 && store.state.auth.id !== 1) return false;
   ```

---

## 🔁 MIGRAR do edit-users-dark.vue

### 🔴 PRIORIDADE ALTA (Funcionalidades Críticas)

#### 1️⃣ Colunas de Contadores (Devices + Users)

**O que falta:**
- ❌ Coluna "Dispositivos" com contador clicável
- ❌ Coluna "Usuários" com contador clicável
- ❌ Cache de contadores (`deviceCounts`, `userCounts`)
- ❌ Loading state por célula

**Funcionalidades:**
```js
// Refs para cache
const deviceCounts = ref({})  // { userId: count }
const userCounts = ref({})    // { userId: count }
const loadingCounts = ref({}) // { userId: true/false }

// Computed para obter contadores
const getUserDeviceCount = (userId) => {
  if (loadingCounts.value[userId]) return '...'
  return deviceCounts.value[userId] || 0
}

const getUserUserCount = (userId) => {
  if (loadingCounts.value[userId]) return '...'
  return userCounts.value[userId] || 0
}

// Clique simples: abre modal de link-objects
const showDevicesModal = (userId) => {
  linkObjectsRef?.showObjects({ userId, type: 'devices' })
}

const showUsersModal = (userId) => {
  linkObjectsRef?.showObjects({ userId, type: 'users' })
}

// Duplo clique: força refresh do contador
const refreshUserCounts = async (userId) => {
  loadingCounts.value[userId] = true
  try {
    const [devices, users] = await Promise.all([
      store.dispatch('users/getUserDevices', userId),
      store.dispatch('users/getUserUsers', userId)
    ])
    deviceCounts.value[userId] = devices?.length || 0
    userCounts.value[userId] = users?.length || 0
  } finally {
    loadingCounts.value[userId] = false
  }
}
```

**Template:**
```vue
<el-table-column label="Dispositivos" width="120" align="center">
  <template #default="{ row }">
    <div 
      class="clickable-count device-count"
      @click.stop="showDevicesModal(row.id)"
      @dblclick.stop="refreshUserCounts(row.id)"
    >
      <i class="fas fa-car"></i>
      <span>{{ getUserDeviceCount(row.id) }}</span>
    </div>
  </template>
</el-table-column>

<el-table-column label="Usuários" width="120" align="center">
  <template #default="{ row }">
    <div 
      class="clickable-count user-count"
      @click.stop="showUsersModal(row.id)"
      @dblclick.stop="refreshUserCounts(row.id)"
    >
      <i class="fas fa-users"></i>
      <span>{{ getUserUserCount(row.id) }}</span>
    </div>
  </template>
</el-table-column>
```

**CSS:**
```css
.clickable-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-count:hover {
  background: rgba(59, 130, 246, 0.2);
  transform: translateY(-1px);
}

.clickable-count i {
  font-size: 14px;
  color: var(--u-accent-1);
}

.clickable-count span {
  font-weight: 600;
  color: var(--u-text);
}
```

---

#### 2️⃣ Card de "Deudores" (4º Stats Card)

**O que falta:**
- ❌ Card com contador de usuários com faturas pendentes
- ❌ Filtro `filterBy('debtors')`
- ❌ Computed `debtorsCount`

**Implementação:**
```js
// Ref para invoices
const userInvoices = ref({})

// Computed para contar devedores
const debtorsCount = computed(() => {
  return filteredUsers.value.filter(user => {
    const invoices = userInvoices.value[user.id] || []
    return invoices.some(inv => inv.status === 'pending' && inv.balance > 0)
  }).length
})

// Atualizar filteredUsersFinal para suportar 'debtors'
const filteredUsersFinal = computed(() => {
  const baseFiltered = filteredUsers.value
  
  if (selectedFilter.value === 'all') return baseFiltered
  if (selectedFilter.value === 'admin') return baseFiltered.filter(u => u.administrator === true)
  if (selectedFilter.value === 'suspended') return baseFiltered.filter(u => u.disabled === true)
  if (selectedFilter.value === 'debtors') {
    return baseFiltered.filter(user => {
      const invoices = userInvoices.value[user.id] || []
      return invoices.some(inv => inv.status === 'pending' && inv.balance > 0)
    })
  }
  
  return baseFiltered
})

// Carregar invoices ao abrir modal
const loadUserInvoices = async () => {
  if (!store.state.auth.administrator) return
  
  const users = getUsersList()
  for (const user of users.slice(0, 50)) { // Limitar a 50 para performance
    try {
      const invoices = await store.dispatch('invoices/getUserInvoices', user.id)
      userInvoices.value[user.id] = invoices
    } catch (e) {
      userInvoices.value[user.id] = []
    }
  }
}
```

**Template:**
```vue
<!-- Adicionar após stat-card-suspended -->
<div 
  class="stat-card stat-card-debtors" 
  :class="{ active: selectedFilter === 'debtors' }" 
  @click="filterBy('debtors')"
>
  <i class="fas fa-exclamation-triangle stat-icon"></i>
  <div class="stat-content">
    <div class="stat-number">{{ debtorsCount }}</div>
    <div class="stat-label">{{ KT('user.debtors') || 'Devedores' }}</div>
  </div>
</div>
```

**CSS:**
```css
.stat-card-debtors {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
```

---

#### 3️⃣ Footer com Botões de Relação (18 botões)

**O que falta:**
- ❌ Botões: Devices, Geofences, Groups, Notifications, Calendars, Attributes, Drivers, Commands, Maintence
- ❌ Botão "Crear Sesión" (assumir identidade)
- ❌ Botões PDF/Excel
- ❌ Botões Import/Template

**Layout do Footer Dark:**
```vue
<template #footer>
  <div class="users-footer users-footer--full">
    <!-- Linha 1: Ações de Edição -->
    <div class="footer-actions-group">
      <el-button
        v-if="store.getters.advancedPermissions(19)"
        type="danger"
        :plain="selected === 0"
        @click="doDelete()"
        @mouseenter.stop="showTip($event, KT('user.remove'))"
        @mouseleave="hideTip"
      >
        <i class="fas fa-user-minus"></i>
      </el-button>

      <el-button
        v-if="store.getters.advancedPermissions(18)"
        type="warning"
        :plain="selected === 0"
        @click="editUserRef?.editUser(selected)"
        @mouseenter.stop="showTip($event, KT('user.edit'))"
        @mouseleave="hideTip"
      >
        <i class="fas fa-user-edit"></i>
      </el-button>

      <el-button
        v-if="store.state.server.isPlus && store.state.auth.administrator"
        plain
        :disabled="selected === 0"
        @click="logObjectsRef?.showLogs({ userId: selected })"
        @mouseenter.stop="showTip($event, KT('user.logs'))"
        @mouseleave="hideTip"
      >
        <i class="fas fa-clipboard-list"></i>
      </el-button>
    </div>

    <!-- Linha 2: Relações -->
    <div class="footer-relations-group">
      <!-- Users -->
      <el-button
        v-if="store.getters.advancedPermissions(16) && store.getters.advancedPermissions(18)"
        plain
        :disabled="selected === 0 || !(user && (user.userLimit === -1 || user.userLimit > 0))"
        @click="handleRelationButtonClick('users')"
        @mouseenter.stop="showTip($event, KT('user.users'))"
        @mouseleave="hideTip"
      >
        <i class="fas fa-users"></i>
      </el-button>

      <!-- Devices -->
      <el-button
        v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(8)"
        plain
        :disabled="selected === 0"
        @click="handleRelationButtonClick('devices')"
        @mouseenter.stop="showTip($event, KT('device.devices'))"
        @mouseleave="hideTip"
      >
        <i class="fas fa-car"></i>
      </el-button>

      <!-- Geofences -->
      <el-button
        v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(40)"
        plain
        :disabled="selected === 0"
        @click="handleRelationButtonClick('geofences')"
        @mouseenter.stop="showTip($event, KT('geofence.geofences'))"
        @mouseleave="hideTip"
      >
        <i class="fas fa-draw-polygon"></i>
      </el-button>

      <!-- Groups -->
      <el-button
        v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(48)"
        plain
        :disabled="selected === 0"
        @click="handleRelationButtonClick('groups')"
        @mouseenter.stop="showTip($event, KT('group.groups'))"
        @mouseleave="hideTip"
      >
        <i class="far fa-object-group"></i>
      </el-button>

      <!-- Notifications -->
      <el-button
        v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(32)"
        plain
        :disabled="selected === 0"
        @click="handleRelationButtonClick('notifications')"
        @mouseenter.stop="showTip($event, KT('notification.notifications'))"
        @mouseleave="hideTip"
      >
        <i class="far fa-envelope"></i>
      </el-button>

      <!-- Calendars -->
      <el-button
        v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(88)"
        plain
        :disabled="selected === 0"
        @click="handleRelationButtonClick('calendars')"
        @mouseenter.stop="showTip($event, KT('calendar.calendars'))"
        @mouseleave="hideTip"
      >
        <i class="far fa-calendar-alt"></i>
      </el-button>

      <!-- Attributes -->
      <el-button
        v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(64)"
        plain
        :disabled="selected === 0"
        @click="handleRelationButtonClick('attributes')"
        @mouseenter.stop="showTip($event, KT('attribute.computedAttributes'))"
        @mouseleave="hideTip"
      >
        <i class="fas fa-server"></i>
      </el-button>

      <!-- Drivers -->
      <el-button
        v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(80)"
        plain
        :disabled="selected === 0"
        @click="handleRelationButtonClick('drivers')"
        @mouseenter.stop="showTip($event, KT('driver.drivers'))"
        @mouseleave="hideTip"
      >
        <i class="fas fa-user-tag"></i>
      </el-button>

      <!-- Commands -->
      <el-button
        v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(56)"
        plain
        :disabled="selected === 0"
        @click="handleRelationButtonClick('commands')"
        @mouseenter.stop="showTip($event, KT('command.savedCommands'))"
        @mouseleave="hideTip"
      >
        <i class="far fa-keyboard"></i>
      </el-button>

      <!-- Maintenence -->
      <el-button
        v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(96)"
        plain
        :disabled="selected === 0"
        @click="handleRelationButtonClick('maintence')"
        @mouseenter.stop="showTip($event, KT('maintenance.maintenance'))"
        @mouseleave="hideTip"
      >
        <i class="fas fa-tools"></i>
      </el-button>
    </div>

    <!-- Linha 3: Sessão + Reports -->
    <div class="footer-extras-group">
      <!-- Crear Sesión -->
      <el-button
        v-if="store.state.auth.administrator || (store.getters.advancedPermissions(16) && store.getters.advancedPermissions(18))"
        type="success"
        plain
        :disabled="selected === 0"
        @click="createSession"
        @mouseenter.stop="showTip($event, KT('user.changesesion'))"
        @mouseleave="hideTip"
      >
        <i class="fas fa-passport"></i>
      </el-button>

      <!-- PDF -->
      <el-button
        type="info"
        plain
        :loading="isGeneratingPDF"
        :disabled="isGeneratingPDF || filteredUsers.length === 0"
        @click="generatePdf"
        @mouseenter.stop="showTip($event, KT('user.generatePDF'))"
        @mouseleave="hideTip"
      >
        <i v-if="!isGeneratingPDF" class="fas fa-file-pdf"></i>
        <i v-else class="fas fa-spinner fa-spin"></i>
      </el-button>

      <!-- Excel -->
      <el-button
        type="info"
        plain
        :disabled="filteredUsers.length === 0"
        @click="generateExcel"
        @mouseenter.stop="showTip($event, KT('user.generateExcel'))"
        @mouseleave="hideTip"
      >
        <i class="fas fa-file-excel"></i>
      </el-button>

      <!-- Import Users -->
      <el-button
        type="success"
        :disabled="!canImportUsers()"
        @click="canImportUsers() ? openImportModal() : showUserLimitExceeded()"
        @mouseenter.stop="showTip($event, KT('user.importUsers'))"
        @mouseleave="hideTip"
      >
        <i class="fas fa-upload"></i>
      </el-button>

      <!-- Download Template -->
      <el-button
        type="info"
        @click="downloadTemplate"
        @mouseenter.stop="showTip($event, 'Descargar Plantilla Excel')"
        @mouseleave="hideTip"
      >
        <i class="fas fa-download"></i>
      </el-button>
    </div>

    <!-- Botão Fechar (direita) -->
    <el-button plain @click="show = false">
      <i class="fas fa-times"></i>
      <span class="btn-text">{{ KT('common.close') || 'Fechar' }}</span>
    </el-button>
  </div>
</template>
```

**Função Handler:**
```js
const handleRelationButtonClick = (type) => {
  if (selected.value === 0) return
  linkObjectsRef?.showObjects({ userId: selected.value, type })
}

const createSession = () => {
  if (selected.value === 0) return
  // Lógica para assumir sessão do usuário selecionado
  store.dispatch('auth/createSessionAs', selected.value)
}
```

---

#### 4️⃣ Colunas de Faturação (Condicional)

**O que falta:**
- ❌ 3 colunas extras: "Facturas Pendientes", "Saldo Pendiente", "Último Vencimiento"
- ❌ Computed `showBillingColumns` (verifica se módulo invoices existe)
- ❌ Funções `getPendingInvoices()`, `getPendingBalance()`, `getLastDueDate()`

**Implementação:**
```js
// Computed para verificar se deve mostrar colunas de billing
const showBillingColumns = computed(() => {
  return store.state.auth.administrator && 
         store.state.server.modules?.includes('invoices')
})

const getPendingInvoices = (userId) => {
  const invoices = userInvoices.value[userId] || []
  return invoices.filter(inv => inv.status === 'pending').length
}

const getPendingBalance = (userId) => {
  const invoices = userInvoices.value[userId] || []
  return invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + (inv.balance || 0), 0)
}

const getLastDueDate = (userId) => {
  const invoices = userInvoices.value[userId] || []
  const pending = invoices.filter(inv => inv.status === 'pending')
  if (pending.length === 0) return '-'
  
  const sorted = pending.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const lastDue = sorted[0]?.dueDate
  return lastDue ? new Date(lastDue).toLocaleDateString('pt-BR') : '-'
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
```

**Template:**
```vue
<!-- Adicionar após coluna "Usuários" -->
<el-table-column 
  v-if="showBillingColumns"
  label="Fact. Pend." 
  width="120" 
  align="center"
>
  <template #default="{ row }">
    {{ getPendingInvoices(row.id) }}
  </template>
</el-table-column>

<el-table-column 
  v-if="showBillingColumns"
  label="Saldo Pend." 
  width="140" 
  align="center"
>
  <template #default="{ row }">
    {{ formatCurrency(getPendingBalance(row.id)) }}
  </template>
</el-table-column>

<el-table-column 
  v-if="showBillingColumns"
  label="Últ. Venc." 
  width="120" 
  align="center"
>
  <template #default="{ row }">
    {{ getLastDueDate(row.id) }}
  </template>
</el-table-column>
```

---

### 🟡 PRIORIDADE MÉDIA (Features Avançadas)

#### 5️⃣ Expansão de Linhas (Dispositivos/Usuários Subordinados)

**O que é:**
- Ao clicar em "Auto" ou "Usuario" na linha, abre uma subseção expandida
- Mostra lista completa de devices/users relacionados
- Botão PDF dentro da expansão para gerar relatório

**Estado Necessário:**
```js
const expandedRows = ref(new Set())      // Set de keys: "userId-type"
const expandedData = ref({})             // { userId: [data], "userId_type": "devices" }
const loadingExpanded = ref({})          // { "userId-type": true/false }
const generatingPDF = ref({})            // { userId: true/false }
```

**Funções Principais:**
```js
const toggleUserExpansion = async (userId, type) => {
  const key = `${userId}-${type}`
  const currentExpanded = expandedRows.value.has(key)
  
  if (currentExpanded) {
    closeExpansion(userId)
  } else {
    expandedRows.value.clear()  // Fecha todas outras
    expandedData.value = {}
    
    expandedRows.value.add(key)
    loadingExpanded.value[key] = true
    
    try {
      let data = []
      if (type === 'devices') {
        data = await store.dispatch('users/getUserDevices', userId) || []
      } else if (type === 'users') {
        data = await store.dispatch('users/getUserUsers', userId) || []
      }
      
      expandedData.value[userId] = data
      expandedData.value[`${userId}_type`] = type
    } finally {
      loadingExpanded.value[key] = false
    }
  }
}

const closeExpansion = (userId) => {
  const keysToRemove = Array.from(expandedRows.value)
    .filter(key => key.startsWith(`${userId}-`))
  keysToRemove.forEach(key => expandedRows.value.delete(key))
  
  delete expandedData.value[userId]
  delete expandedData.value[`${userId}_type`]
}

const isRowExpanded = (userId) => {
  return Array.from(expandedRows.value).some(key => key.startsWith(`${userId}-`))
}

const isDeviceExpansion = (userId) => {
  return expandedData.value[`${userId}_type`] === 'devices'
}
```

**Template (adicionar coluna "Ações"):**
```vue
<el-table-column label="Ações" width="150" align="center">
  <template #default="{ row }">
    <div class="row-expansion-actions">
      <el-button
        size="small"
        type="primary"
        @click.stop="toggleUserExpansion(row.id, 'devices')"
        :loading="loadingExpanded[`${row.id}-devices`]"
      >
        <i class="fas fa-car"></i>
        Auto
      </el-button>
      
      <el-button
        size="small"
        type="success"
        @click.stop="toggleUserExpansion(row.id, 'users')"
        :loading="loadingExpanded[`${row.id}-users`]"
      >
        <i class="fas fa-users"></i>
        User
      </el-button>
    </div>
  </template>
</el-table-column>

<!-- Linha expandida (após cada row) -->
<template #expand="{ row }">
  <div v-if="isRowExpanded(row.id)" class="expanded-section">
    <div class="expanded-header">
      <i :class="isDeviceExpansion(row.id) ? 'fas fa-car' : 'fas fa-users'"></i>
      <span>{{ isDeviceExpansion(row.id) ? 'Dispositivos' : 'Usuários' }}</span>
      
      <el-button
        size="small"
        type="primary"
        @click="generateExpandedPDF(row.id)"
        :loading="generatingPDF[row.id]"
      >
        <i class="fas fa-file-pdf"></i>
      </el-button>
      
      <el-button size="small" text @click="closeExpansion(row.id)">
        <i class="fas fa-times"></i>
      </el-button>
    </div>
    
    <div class="expanded-list">
      <div v-if="!expandedData[row.id]?.length" class="no-data">
        Nenhum registro encontrado
      </div>
      
      <div v-else>
        <div v-for="item in expandedData[row.id]" :key="item.id" class="expanded-item">
          #{{ item.id }} - {{ item.name }}
          <span v-if="isDeviceExpansion(row.id)">
            IMEI: {{ item.uniqueId }} | Placa: {{ item.attributes?.placa }}
          </span>
          <span v-else>
            Email: {{ item.email }} | Status: {{ item.disabled ? 'Inativo' : 'Ativo' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
```

**⚠️ Nota:** `<el-table>` não suporta nativamente linhas expandidas customizadas. Alternativas:
1. Usar `expand` slot (limitado)
2. Migrar para lista customizada (como no dark)
3. Usar modal separado (mais simples)

**Recomendação:** Usar modal separado por simplicidade.

---

#### 6️⃣ Exportação PDF/Excel

**Libs Necessárias:**
```bash
npm install jspdf jspdf-autotable xlsx
```

**Implementação PDF:**
```js
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

const isGeneratingPDF = ref(false)

const generatePdf = async () => {
  if (isGeneratingPDF.value) return
  isGeneratingPDF.value = true
  
  try {
    const doc = new jsPDF()
    const users = filteredUsers.value
    
    // Header
    doc.setFontSize(18)
    doc.text('Lista de Usuários', 14, 20)
    doc.setFontSize(11)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28)
    doc.text(`Total: ${users.length} usuários`, 14, 35)
    
    // Tabela
    const tableData = users.map(user => [
      user.id,
      user.name,
      user.email,
      user.administrator ? 'Sim' : 'Não',
      user.disabled ? 'Suspenso' : 'Ativo',
      getUserDeviceCount(user.id),
      getUserUserCount(user.id)
    ])
    
    doc.autoTable({
      head: [['ID', 'Nome', 'Email', 'Admin', 'Status', 'Devices', 'Users']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [102, 126, 234] }
    })
    
    doc.save(`usuarios_${Date.now()}.pdf`)
    
    ElNotification({
      title: 'PDF Gerado',
      message: `${users.length} usuários exportados com sucesso`,
      type: 'success'
    })
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    ElMessage.error('Erro ao gerar PDF')
  } finally {
    isGeneratingPDF.value = false
  }
}
```

**Implementação Excel:**
```js
const generateExcel = async () => {
  try {
    const XLSX = await loadXLSX()
    const users = filteredUsers.value
    
    const data = users.map(user => ({
      'ID': user.id,
      'Nome': user.name,
      'Email': user.email,
      'Telefone': user.phone || '',
      'Administrador': user.administrator ? 'Sim' : 'Não',
      'Status': user.disabled ? 'Suspenso' : 'Ativo',
      'Dispositivos': getUserDeviceCount(user.id),
      'Usuários': getUserUserCount(user.id)
    }))
    
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuários')
    
    XLSX.writeFile(workbook, `usuarios_${Date.now()}.xlsx`)
    
    ElMessage.success('Excel gerado com sucesso')
  } catch (error) {
    console.error('Erro ao gerar Excel:', error)
    ElMessage.error('Erro ao gerar Excel')
  }
}
```

---

#### 7️⃣ Importação de Usuários (Modal 4 Etapas)

**Features:**
- Drag & drop de arquivo Excel
- Preview com validação de dados
- Mapeamento automático de colunas
- Progress bar durante importação
- Log de sucessos/erros
- Verificação de limites

**Estado:**
```js
const showImportModal = ref(false)
const currentStep = ref(1)  // 1-4
const selectedFile = ref(null)
const previewData = ref([])
const importProgress = ref(0)
const successCount = ref(0)
const errorCount = ref(0)
const importLog = ref([])
```

**⚠️ Complexidade:** 500+ linhas de código

**Recomendação:** Implementar em Fase 2 (não MVP)

---

### 🟢 PRIORIDADE BAIXA (UX/Polish)

#### 8️⃣ Width Fixo Desktop (1200px)

```css
@media (min-width: 1025px) {
  .users-dialog .el-dialog {
    min-width: 1200px !important;
    width: 1200px !important;
    max-width: none !important;
  }
}
```

---

#### 9️⃣ Mobile: Cards em vez de Tabela

```vue
<!-- Adicionar após .users-content -->
<div class="mobile-users-list">
  <div
    v-for="user in filteredUsersFinal"
    :key="user.id"
    class="mobile-user-card"
    :class="{ selected: selected === user.id }"
    @click="selected = user.id"
    @dblclick="editUserRef?.editUser(user.id)"
  >
    <div class="mobile-user-header">
      <div class="mobile-user-name">{{ user.name }}</div>
      <div class="mobile-user-id">ID: {{ user.id }}</div>
    </div>
    
    <div class="mobile-user-info">
      <div class="mobile-info-item">
        <i class="fas fa-car"></i>
        <span>{{ getUserDeviceCount(user.id) }} dispositivos</span>
      </div>
      
      <div class="mobile-info-item">
        <i class="fas fa-users"></i>
        <span>{{ getUserUserCount(user.id) }} usuários</span>
      </div>
    </div>
    
    <div class="mobile-user-status">
      <el-tag v-if="user.administrator" type="danger" size="small">
        Admin
      </el-tag>
      <el-tag :type="user.disabled ? 'danger' : 'success'" size="small">
        {{ user.disabled ? 'Suspenso' : 'Ativo' }}
      </el-tag>
    </div>
  </div>
</div>
```

**CSS:**
```css
/* Desktop: Mostrar tabela, esconder cards */
.mobile-users-list {
  display: none;
}

/* Mobile: Esconder tabela, mostrar cards */
@media (max-width: 768px) {
  .users-table {
    display: none !important;
  }
  
  .mobile-users-list {
    display: block;
    padding: 12px;
    max-height: calc(100vh - 280px);
    overflow-y: auto;
  }
  
  .mobile-user-card {
    background: var(--u-surface);
    border: 1px solid var(--u-border);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
    transition: all 0.2s ease;
  }
  
  .mobile-user-card.selected {
    border-color: var(--u-accent-1);
    background: rgba(102, 126, 234, 0.05);
  }
}
```

---

## 🧹 REMOVER

**❌ Nada deve ser removido** — toda lógica atual é funcional e será preservada.

---

## 🎨 TOKENS CSS ADICIONAIS

**Novos tokens necessários:**
```css
/* Adicionar aos tokens existentes */
:deep(.users-dialog.el-dialog) {
  /* ... tokens existentes ... */
  
  /* Novos tokens */
  --u-primary-100: #dbeafe;
  --u-primary-300: #93c5fd;
  --u-primary-500: #3b82f6;
  --u-primary-600: #2563eb;
  --u-primary-700: #1d4ed8;
  
  --u-success: #27ae60;
  --u-danger: #e74c3c;
  --u-warning: #f39c12;
  --u-info: #3498db;
}
```

---

## 🛡️ ISOLAMENTO CSS

**Estratégia Atual (manter):**
```css
:deep(.users-dialog .el-dialog__header),
:deep(.users-dialog .el-dialog__body),
:deep(.users-dialog .el-dialog__footer) {
  padding: 0 !important;
  margin: 0 !important;
}
```

**Adicionar:**
```css
/* Footer com layout flex */
.users-footer--full {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px !important;
  border-top: 1px solid var(--u-border);
}

.footer-actions-group,
.footer-relations-group,
.footer-extras-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* Mobile: Grid 44px */
@media (max-width: 768px) {
  .users-footer--full {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
    gap: 8px;
  }
  
  .users-footer--full .el-button {
    min-width: 44px !important;
    height: 44px !important;
  }
  
  .users-footer--full .el-button span {
    display: none !important;
  }
}
```

---

## ⚠️ RISCOS E TESTES OBRIGATÓRIOS

### 🔴 CRÍTICO

1. **Evento `@closed` não forwardado em `<el-dialog>`**
   - ⚠️ Mesmo problema do edit-device.vue
   - **Teste:** Fechar modal 5x → backdrop não deve acumular

2. **Performance com cache de contadores**
   - ⚠️ `deviceCounts` pode crescer infinitamente
   - **Solução:** Limpar ao fechar modal
   ```js
   watch(show, (newVal) => {
     if (!newVal) {
       deviceCounts.value = {}
       userCounts.value = {}
       expandedData.value = {}
     }
   })
   ```

3. **Duplo clique conflitando**
   - ⚠️ Click na linha vs click em contador vs dblclick
   - **Solução:** `.stop` em todos os cliques especiais
   - **Teste:** Clicar device count → não deve selecionar linha

4. **Sorting com colunas computadas**
   - ⚠️ `deviceCount` não existe no objeto user
   - **Solução:** Adicionar ao computed antes de passar
   ```js
   const usersWithCounts = computed(() => {
     return filteredUsers.value.map(user => ({
       ...user,
       deviceCount: getUserDeviceCount(user.id),
       userCount: getUserUserCount(user.id)
     }))
   })
   ```

5. **Import excedendo limite**
   - ⚠️ Verificar limite **em cada iteração**
   - **Teste:** Import 50 users com limite 30 → deve parar

### 🟡 MÉDIO

6. **Footer com 18 botões quebra layout mobile**
   - **Solução:** Grid auto-fit 44px (já no CSS acima)

7. **PDF com 500+ dispositivos trava navegador**
   - **Solução:** Limitar a 100 + warning

8. **Dark mode nos modais internos**
   - **Solução:** Aplicar class `.users-dialog` no modal de import

9. **Scroll horizontal com 10 colunas**
   - **Solução:** `.users-content { overflow-x: auto; }`

10. **Memory leak com watchers**
    - **Solução:** Limpar refs no `onUnmounted()`

### 🟢 BAIXO

11. **Animações não suaves no Safari**
12. **Tooltip preso em botões hover rápido**

---

## 📊 ESTATÍSTICAS PREVISTAS PÓS-MIGRAÇÃO

| Métrica | Atual | Fase 1 (MVP) | Fase 2 (Completo) | Fase 3 (Premium) |
|---------|-------|--------------|-------------------|------------------|
| **Linhas** | 1.151 | ~1.800 | ~2.500 | ~2.800 |
| **Funcionalidades** | 12 | 18 | 25 | 28 |
| **Colunas Tabela** | 5 | 8 | 10 | 10 |
| **Botões Footer** | 1 | 15 | 18 | 18 |
| **Exports** | 0 | 2 | 2 | 2 |
| **Imports** | 0 | 0 | 1 | 1 |
| **Expansão** | ❌ | ❌ | ✅ | ✅ |
| **Mobile View** | ❌ | ❌ | ✅ | ✅ |

---

## 🎯 PRIORIZAÇÃO: 3 FASES

### Fase 1 — MVP (70% funcional)
**Tempo estimado:** 4-6 horas

✅ **Implementar:**
1. Colunas Devices + Users (com cache)
2. Card "Deudores" + filtro
3. Footer com 15 botões essenciais
4. Width 1200px desktop
5. Tokens CSS extras

✅ **Resultado:**
- Interface moderna completa
- Relações visíveis (devices/users)
- Ações rápidas no footer
- Dark mode funcionando

---

### Fase 2 — Feature Completo (90% funcional)
**Tempo estimado:** 6-8 horas

✅ **Implementar:**
1. Colunas de billing (condicional)
2. Exportação PDF/Excel
3. Mobile cards view
4. Botão "Crear Sesión"
5. Responsividade completa

✅ **Resultado:**
- Billing integrado (se módulo existir)
- Exports profissionais
- Mobile 100% usável

---

### Fase 3 — Premium (100% funcional)
**Tempo estimado:** 8-10 horas

✅ **Implementar:**
1. Importação de usuários (4 etapas)
2. Expansão de linhas (devices/users)
3. PDF de sublistados
4. Animações + polish

✅ **Resultado:**
- Paridade total com edit-users-dark.vue
- Experiência premium
- Todas features avançadas

---

## 🚀 PRÓXIMO PASSO

**Você confirma a Fase 1 (MVP)?**

Se sim, eu gero o patch final com:
- ✅ Colunas devices/users + cache
- ✅ Card "Deudores"
- ✅ Footer com 15 botões
- ✅ Width 1200px desktop
- ✅ Tokens CSS extras
- ✅ Preservar toda lógica atual

**Arquivo único:** `edit-users.vue` (1800 linhas)  
**Tempo de aplicação:** ~5 min (copiar/colar + salvar)

---

**📌 Aguardando confirmação para gerar o patch...**
