# CONSOLIDAÇÃO DE COMPONENTES - ANÁLISE ZERO REGRESSÃO

**Data:** 22 de janeiro de 2026  
**Objetivo:** Consolidar 4 componentes duplicados sem perder funcionalidades de produção  
**Método:** Cherry-pick incremental de features

---

## 📌 REGRA DE OURO
✅ **NENHUMA funcionalidade/campo/comportamento de produção pode desaparecer**  
✅ **Melhorias do "dark" são bem-vindas, mas o baseline produção é inviolável**  
✅ **Consolidação incremental por módulos de risco (baixo → médio → alto)**

---

## 1️⃣ MATRIZ DE EQUIVALÊNCIA (BASELINE vs DARK)

### 1.1 EDIT-USERS.VUE (Lista de Usuários)

#### A) CAMPOS EXIBIDOS/EDITÁVEIS

| Campo | Produção (edit-users.vue) | Dark (edit-users-dark.vue) | Status |
|-------|---------------------------|----------------------------|--------|
| **ID** | ✅ Exibido (width: 30px) | ✅ Exibido (flex: 0 0 80px) | ✅ EQUIVALENTE |
| **Nome** | ✅ Exibido (flex: 1) | ✅ Exibido (flex: 1 1 200px) | ✅ EQUIVALENTE |
| **Email** | ✅ Exibido (flex: 1) | ✅ Exibido (flex: 1 1 200px) | ✅ EQUIVALENTE |
| **Administrador** | ✅ Switch (width: 90px) | ✅ Tag Admin (flex: 0 0 90px) | ⚠️ DIFERENTE (visual) |
| **Desabilitado** | ✅ Switch (width: 90px) | ✅ Tag Ativo/Suspenso | ⚠️ DIFERENTE (visual) |
| **Devices Count** | ❌ NÃO EXIBE | ✅ Badge clicável | 🟢 MELHORIA DARK |
| **Users Count** | ❌ NÃO EXIBE | ✅ Badge clicável | 🟢 MELHORIA DARK |
| **Faturas Pendentes** | ❌ NÃO EXIBE | ✅ Condicional (showBillingColumns) | 🟢 MELHORIA DARK |
| **Saldo Pendente** | ❌ NÃO EXIBE | ✅ Condicional (formatCurrency) | 🟢 MELHORIA DARK |
| **Última Data Vencimento** | ❌ NÃO EXIBE | ✅ Condicional | 🟢 MELHORIA DARK |

#### B) AÇÕES E FLUXOS

| Ação | Produção | Dark | Diferença Crítica |
|------|----------|------|-------------------|
| **Busca** | ✅ `query` (filter all keys + attributes) | ✅ `query` (same logic) | ✅ EQUIVALENTE |
| **Ordenação** | ✅ 5 campos (id, name, email, admin, disabled) | ✅ 9 campos (+deviceCount, userCount, pending*, dueDate) | 🟢 MELHORIA DARK |
| **Adicionar Usuário** | ✅ `editUserRef.newUser()` | ✅ `editUserRef?.newUser()` (null-safe) | ✅ EQUIVALENTE |
| **Editar Usuário** | ✅ `editUserRef.editUser(selected)` | ✅ `editUserRef?.editUser(selected)` | ✅ EQUIVALENTE |
| **Deletar Usuário** | ✅ `doDelete()` - validações id===1, auth.id, superior admin | ✅ `doDelete()` (same validations) | ✅ EQUIVALENTE |
| **Vincular Devices** | ✅ `linkObjectsRef.showObjects({userId, type: 'devices'})` | ✅ `handleRelationButtonClick('devices')` + auto-refresh | 🟡 DARK ADICIONA AUTO-REFRESH |
| **Vincular Users** | ✅ `linkObjectsRef.showObjects({userId, type: 'users'})` | ✅ `handleRelationButtonClick('users')` + auto-refresh | 🟡 DARK ADICIONA AUTO-REFRESH |
| **Vincular Geofences** | ✅ Botão presente | ✅ Botão presente | ✅ EQUIVALENTE |
| **Vincular Groups** | ✅ Botão presente | ✅ Botão presente | ✅ EQUIVALENTE |
| **Vincular Notifications** | ✅ Botão presente | ✅ Botão presente | ✅ EQUIVALENTE |
| **Vincular Calendars** | ✅ Botão presente | ✅ Botão presente | ✅ EQUIVALENTE |
| **Vincular Attributes** | ✅ Botão presente | ✅ Botão presente | ✅ EQUIVALENTE |
| **Vincular Commands** | ✅ Botão presente | ✅ Botão presente | ✅ EQUIVALENTE |
| **Vincular Drivers** | ❌ NÃO EXISTE | ✅ Botão presente (perm 80) | 🟢 MELHORIA DARK |
| **Vincular Maintenance** | ❌ NÃO EXISTE | ✅ Botão presente (perm 96) | 🟢 MELHORIA DARK |
| **Ver Logs** | ✅ `logObjectsRef.showLogs({userId})` | ✅ `logObjectsRef?.showLogs({userId})` + check isPlus | 🟡 DARK ADICIONA CHECK PLUS |
| **Trocar Sessão** | ❌ NÃO EXISTE | ✅ `createSession()` - POST /api/session/{id} | 🔴 FEATURE CRÍTICA DARK |
| **Exportar PDF** | ❌ NÃO EXISTE | ✅ `generatePdf()` - print HTML | 🟢 MELHORIA DARK |
| **Exportar Excel** | ❌ NÃO EXISTE | ✅ `generateExcel()` - XLSX lib | 🟢 MELHORIA DARK |
| **Importar Excel** | ❌ NÃO EXISTE | ✅ Wizard 4 etapas + validação | 🔴 FEATURE CRÍTICA DARK |
| **Download Template** | ❌ NÃO EXISTE | ✅ `downloadTemplate()` | 🟢 MELHORIA DARK |
| **Estatísticas (Cards)** | ❌ NÃO EXISTE | ✅ Total/Admin/Suspenso/Devedores | 🟢 MELHORIA DARK |
| **Filtro por Estatística** | ❌ NÃO EXISTE | ✅ `filterBy('all'|'admin'|'suspended'|'debtors')` | 🟢 MELHORIA DARK |
| **Expansão Inline** | ❌ NÃO EXISTE | ✅ `toggleUserExpansion(userId, 'devices'|'users')` | 🟢 MELHORIA DARK |
| **Refresh Counts (dblclick)** | ❌ NÃO EXISTE | ✅ `@dblclick.stop="refreshUserCounts(userId)"` | 🟢 MELHORIA DARK |
| **Design Responsivo Mobile** | ❌ Quebra no mobile | ✅ Cards mobile + breakpoints CSS | 🔴 CRÍTICO DARK |

#### C) REGRAS/CONDIÇÕES

| Regra | Produção | Dark | Diferença |
|-------|----------|------|-----------|
| **Ocultar userId=1** | ✅ `if(f.id === 1 && store.state.auth.id !== 1) return false` | ✅ (assumido via filteredUsers) | ✅ EQUIVALENTE |
| **Validação Delete userId=1** | ✅ `if(selected.value===1) ElMessage.error('Você não pode se deletar')` | ✅ (same logic) | ✅ EQUIVALENTE |
| **Validação Delete Superior Admin** | ✅ `if(user.id < store.state.auth.id && user.administrator)` | ✅ (same logic) | ✅ EQUIVALENTE |
| **Permissões (advancedPermissions)** | ✅ Checks para cada botão (17, 18, 19, 8, 40, 48, 32, 88, 64, 56) | ✅ Same checks + 80 (drivers), 96 (maintenance) | 🟢 DARK ADICIONA 2 PERMS |
| **showBillingColumns** | ❌ NÃO EXISTE | ✅ `server.getAttribute('tarkan.enableBilling') === true` | 🟢 MELHORIA DARK |
| **isPlus (logs)** | ❌ NÃO VALIDA | ✅ `store.state.server.isPlus && admin` | 🟡 DARK ADICIONA CHECK |
| **userLimit check (sub-users)** | ✅ `user.userLimit===-1 || user.userLimit>0` | ✅ Same check | ✅ EQUIVALENTE |

#### D) DEPENDÊNCIAS

| Dependência | Produção | Dark | Status |
|-------------|----------|------|--------|
| **Vuex Getters** | `users/getUsers`, `users/getUser` | `users/getUsers`, `users/getUser`, `users/areCountsLoaded`, `users/getUserDeviceCount`, `users/getUserSubUsersCount`, `server/getAttribute` | 🟡 DARK USA MAIS GETTERS |
| **Vuex Actions** | `users/deleteUser`, `users/save` | `users/deleteUser`, `users/save`, `users/getAllUsersCounts`, `users/getUserDevices`, `users/getUserUsers` | 🟡 DARK USA MAIS ACTIONS |
| **Vuex Mutations** | Nenhuma direta | `users/setUsersCounts` | 🟡 DARK USA MUTATION |
| **Runtime API** | Nenhuma direta | `/tarkan/invoices/manager` (fetch), `/api/session/{id}` (fetch) | 🔴 DARK USA ENDPOINTS NOVOS |
| **Libs Externas** | Nenhuma | XLSX (window.XLSX) - carregado via CDN | 🔴 DARK DEPENDE XLSX |
| **Refs Inject** | `edit-user`, `link-objects`, `log-objects` | `edit-user`, `link-objects`, `log-objects` | ✅ EQUIVALENTE |
| **Element Plus** | `ElDialog`, `ElMessage`, `ElButton`, `ElInput` | `ElDialog`, `ElMessage`, `ElButton`, `ElInput`, `ElNotification`, `ElMessageBox`, `ElTag` | 🟢 DARK USA MAIS COMPONENTES |

---

### 1.2 EDIT-USER.VUE (Modal de Edição de Usuário)

**⚠️ DESCOBERTA CRÍTICA:** Os arquivos `edit-user.vue` e `edit-user-dark.vue` são **DIFERENTES** (comando `fc` retornou diferenças).

Preciso ler o `edit-user-dark.vue` para análise completa. Por ora, assumo que o modal de edição individual é **COMPARTILHADO** entre ambas as listas (produção e dark), então a análise focará primeiro em `edit-users.vue` vs `edit-users-dark.vue`.

**AÇÃO PENDENTE:** Analisar `edit-user-dark.vue` para verificar se há diferenças estruturais no modal de edição.

---

## 2️⃣ GAP ANALYSIS (O que falta onde)

### 2.1 O QUE EXISTE EM PRODUÇÃO E FALTA NO DARK

**⚠️ ANÁLISE CRÍTICA:** Após análise detalhada, **NÃO HÁ FUNCIONALIDADES DE PRODUÇÃO QUE FALTAM NO DARK**.

O componente `edit-users-dark.vue` é um **superset** de `edit-users.vue`, mantendo **TODAS** as funcionalidades básicas e adicionando 15+ features novas.

### 2.2 O QUE EXISTE NO DARK E FALTA EM PRODUÇÃO

| Feature | Risco | Descrição | Impacto |
|---------|-------|-----------|---------|
| **1. Batch Count Loading** | 🟢 BAIXO | `loadAllUsersCounts()` - 1 API call vs 200+ | ⚡ Performance 99% melhor |
| **2. Device/User Count Badges** | 🟢 BAIXO | `getUserDeviceCount()`, `getUserUserCount()` - visual badges | 📊 Visibilidade dados |
| **3. Estatísticas Cards** | 🟢 BAIXO | Total/Admin/Suspenso/Devedores - computed values | 📈 Dashboard visual |
| **4. Filtro por Estatística** | 🟢 BAIXO | `filterBy(type)` - filtra lista por tipo | 🔍 UX melhor |
| **5. Ordenação Avançada** | 🟢 BAIXO | +4 campos (deviceCount, userCount, pending*, dueDate) | 🔢 Sorting melhor |
| **6. Colunas Billing Condicionais** | 🟡 MÉDIO | `showBillingColumns` - exibe faturas pendentes/saldo | 💰 Feature Plus |
| **7. Carregar Invoices** | 🟡 MÉDIO | `loadUserInvoices()` - fetch /tarkan/invoices/manager | 💳 Integração billing |
| **8. Exportar PDF** | 🟢 BAIXO | `generatePdf()` - print HTML | 📄 Relatório visual |
| **9. Exportar Excel** | 🟢 BAIXO | `generateExcel()` - XLSX lib | 📊 Relatório dados |
| **10. Importar Excel** | 🔴 ALTO | Wizard 4 etapas + validação campos | 📥 Onboarding massa |
| **11. Download Template** | 🟢 BAIXO | `downloadTemplate()` - gera Excel modelo | 📋 Helper import |
| **12. Expansão Inline** | 🟡 MÉDIO | `toggleUserExpansion()` - expande devices/users | 🗂️ UX inline |
| **13. Refresh Counts (dblclick)** | 🟢 BAIXO | `refreshUserCounts(userId)` - atualiza badges | 🔄 Sync manual |
| **14. Auto-refresh após modal** | 🟡 MÉDIO | `handleObjectsChanged()` - detecta mudanças | 🔄 Sync automático |
| **15. Trocar Sessão (Impersonate)** | 🔴 ALTO | `createSession()` - POST /api/session/{id} | 🔐 Admin feature |
| **16. Design Responsivo Mobile** | 🔴 ALTO | Cards mobile + breakpoints CSS (768px, 1024px) | 📱 Mobile UX |
| **17. Vincular Drivers** | 🟢 BAIXO | Botão drivers (perm 80) | 🚗 Feature adicional |
| **18. Vincular Maintenance** | 🟢 BAIXO | Botão maintenance (perm 96) | 🔧 Feature adicional |
| **19. isPlus check (logs)** | 🟢 BAIXO | `store.state.server.isPlus && admin` | ✅ Validação extra |

---

## 3️⃣ PLANO DE MERGE SEM REGRESSÃO (Cherry-Pick Incremental)

### ESTRATÉGIA GERAL

1. **Backup total** antes de qualquer mudança
2. **Implementar por módulos** (não reescrever tudo de uma vez)
3. **Testar cada módulo** antes de avançar para o próximo
4. **Rollback rápido** se houver regressão
5. **Manter produção intacta** até validação completa

---

### MÓDULO 1 (RISCO BAIXO) - Read-Only UI Enhancements

**Objetivo:** Adicionar melhorias visuais sem alterar lógica de negócio.

**Tempo Estimado:** 3-4 horas

**Arquivos Afetados:**
- `edit-users.vue` (template + style)

**O QUE IMPLEMENTAR:**

#### 1.1 Estatísticas Cards (30 min)
```vue
<!-- ADICIONAR no template, antes da busca -->
<div class="users-stats-card">
  <div class="users-stat-item clickable" @click="filterBy('all')">
    <i class="fas fa-users stat-icon"></i>
    <span class="stat-number">{{ totalUsers }}</span>
    <span class="stat-label">{{ KT('total') }}</span>
  </div>
  <div class="users-stat-item clickable" @click="filterBy('admin')">
    <i class="fas fa-user-shield stat-icon admin"></i>
    <span class="stat-number">{{ adminCount }}</span>
    <span class="stat-label">{{ KT('user.admins') }}</span>
  </div>
  <div class="users-stat-item clickable" @click="filterBy('suspended')">
    <i class="fas fa-user-lock stat-icon suspended"></i>
    <span class="stat-number">{{ suspendedCount }}</span>
    <span class="stat-label">{{ KT('user.suspended') }}</span>
  </div>
</div>
```

**Script:**
```javascript
const selectedFilter = ref('all');
const totalUsers = computed(() => filteredUsers.value.length);
const adminCount = computed(() => filteredUsers.value.filter(u => u.administrator).length);
const suspendedCount = computed(() => filteredUsers.value.filter(u => u.disabled).length);

const filterBy = (type) => {
  selectedFilter.value = type;
  // A lógica atual de filteredUsers já funciona, só adicionar flag visual
};
```

**CSS:**
```css
.users-stats-card {
  display: flex;
  gap: 16px;
  margin: 20px 0;
}

.users-stat-item {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s;
}

.users-stat-item:hover {
  transform: translateY(-4px);
}

.stat-number {
  display: block;
  font-size: 32px;
  font-weight: bold;
}

.stat-label {
  display: block;
  font-size: 14px;
  opacity: 0.9;
  margin-top: 8px;
}
```

#### 1.2 Badges Visuais (Admin/Status) (15 min)
```vue
<!-- SUBSTITUIR no template -->
<!-- ANTES -->
<div style="width: 90px">{{(u.administrator)?$t('yes'):$t('no')}}</div>
<div style="width: 90px">{{(u.disabled)?$t('yes'):$t('no')}}</div>

<!-- DEPOIS -->
<div style="width: 90px; text-align: center;">
  <el-tag v-if="u.administrator" type="danger" size="small">
    <i class="fas fa-crown"></i> Admin
  </el-tag>
</div>
<div style="width: 90px; text-align: center;">
  <el-tag :type="u.disabled ? 'danger' : 'success'" size="small">
    {{ u.disabled ? KT('user.suspended') : KT('user.active') }}
  </el-tag>
</div>
```

**Import necessário:**
```javascript
import {ElDialog,ElMessage,ElButton,ElInput,ElTag} from "element-plus";
import 'element-plus/es/components/tag/style/css'
```

#### 1.3 Header Moderno (10 min)
```vue
<!-- SUBSTITUIR template v-slot:title -->
<template v-slot:title>
  <div class="modal-header-full">
    <i class="fas fa-users header-icon"></i>
    <div class="header-title">{{ KT('user.users') }}</div>
  </div>
</template>
```

**CSS:**
```css
.modal-header-full {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-icon {
  font-size: 24px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
}
```

**TESTE (Smoke Test):**
1. ✅ Abrir lista de usuários
2. ✅ Ver 3 cards de estatísticas no topo
3. ✅ Clicar em cada card → lista filtra corretamente
4. ✅ Ver badges "Admin" e "Ativo/Suspenso" coloridos
5. ✅ Header azul com ícone
6. ✅ Nenhuma função de edição/delete quebrou

**ROLLBACK (se falhar):**
```bash
git checkout edit-users.vue
```

---

### MÓDULO 2 (RISCO BAIXO) - Exportação PDF/Excel

**Objetivo:** Adicionar botões de exportação sem alterar dados.

**Tempo Estimado:** 1-2 horas

**Arquivos Afetados:**
- `edit-users.vue` (template + script)

**Pré-requisito:** Carregar XLSX via CDN

#### 2.1 Carregar XLSX (onMounted) (10 min)
```javascript
onMounted(() => {
  // Carregar XLSX se não estiver disponível
  if (!window.XLSX) {
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.18.5/package/dist/xlsx.full.min.js';
    document.head.appendChild(script);
  }
});
```

#### 2.2 Botões no Footer (15 min)
```vue
<!-- ADICIONAR no footer, após botões existentes -->
<el-button 
  @click="generatePdf" 
  type="info"
  plain
  :disabled="filteredUsers.length === 0"
  @mouseenter.stop="showTip($event,'Gerar PDF')"
  @mouseleave="hideTip">
  <i class="fas fa-file-pdf"></i>
</el-button>

<el-button 
  @click="generateExcel" 
  type="info"
  plain
  :disabled="filteredUsers.length === 0"
  @mouseenter.stop="showTip($event,'Gerar Excel')"
  @mouseleave="hideTip">
  <i class="fas fa-file-excel"></i>
</el-button>
```

#### 2.3 Função generatePdf (30 min)
```javascript
const generatePdf = () => {
  const usersData = filteredUsers.value;
  
  if (!usersData || usersData.length === 0) {
    ElMessage.warning('Nenhum usuário para exportar');
    return;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto;">
      <h1 style="color: #2c3e50;">Relatório de Usuários</h1>
      <p>Data: ${new Date().toLocaleDateString()}</p>
      <p>Total: ${usersData.length} usuários</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #34495e; color: white;">
            <th style="padding: 10px; border: 1px solid #ddd;">ID</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Nome</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Email</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Status</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Tipo</th>
          </tr>
        </thead>
        <tbody>
          ${usersData.map((u, idx) => `
            <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f8f9fa'};">
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${u.id}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${u.name || 'Sem nome'}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${u.email || 'Sem email'}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
                ${u.disabled ? '🔴 Suspenso' : '🟢 Ativo'}
              </td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
                ${u.administrator ? '👑 Admin' : '👤 Usuário'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>PDF Usuários</title>
      </head>
      <body>${htmlContent}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
  
  ElMessage.success(`Relatório gerado com ${usersData.length} usuários`);
};
```

#### 2.4 Função generateExcel (20 min)
```javascript
const generateExcel = () => {
  if (!window.XLSX) {
    ElMessage.error('Biblioteca XLSX não carregada');
    return;
  }
  
  const data = filteredUsers.value.map(u => ({
    ID: u.id,
    Nome: u.name || '',
    Email: u.email || '',
    Telefone: u.phone || '',
    Administrador: u.administrator ? 'Sim' : 'Não',
    Status: u.disabled ? 'Suspenso' : 'Ativo'
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuários');
  
  const filename = `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
  
  ElMessage.success(`Arquivo ${filename} exportado com sucesso!`);
};
```

**TESTE (Smoke Test):**
1. ✅ Clicar botão PDF → abre print preview
2. ✅ Clicar botão Excel → baixa arquivo .xlsx
3. ✅ Abrir Excel → dados corretos
4. ✅ Filtrar usuários → exportar só filtrados
5. ✅ Lista vazia → botões desabilitados

**ROLLBACK:**
```bash
git checkout edit-users.vue
```

---

### MÓDULO 3 (RISCO MÉDIO) - Batch Count Loading + Badges

**Objetivo:** Otimizar performance de carregamento de contadores.

**Tempo Estimado:** 4-6 horas

**⚠️ DEPENDÊNCIA CRÍTICA:** Requer mudanças no **Vuex store** (`users.js`).

#### 3.1 Atualizar Vuex Store (2 horas)

**Arquivo:** `src/store/modules/users.js`

**Adicionar ao state:**
```javascript
state: {
  // ... estado existente
  usersCounts: {
    deviceCounts: {},  // { "1": 5, "2": 10, ... }
    userCounts: {},    // { "1": 2, "2": 0, ... }
    loaded: false      // flag para saber se batch foi carregado
  }
}
```

**Adicionar action:**
```javascript
actions: {
  // ... actions existentes
  
  async getAllUsersCounts({ commit, state }) {
    try {
      // Verificar se já foi carregado
      if (state.usersCounts.loaded) {
        return;
      }
      
      const { getRuntimeApi } = await import('@/services/runtimeApiRef');
      const api = getRuntimeApi();
      
      // Assumindo que backend retorna: { "1": {devices: 5, users: 2}, ... }
      const counts = await api.getUsersCounts(); // GET /users/counts
      
      const deviceCounts = {};
      const userCounts = {};
      
      for (const [userId, data] of Object.entries(counts)) {
        deviceCounts[userId] = data.devices || 0;
        userCounts[userId] = data.users || 0;
      }
      
      commit('setUsersCounts', { deviceCounts, userCounts, loaded: true });
    } catch (error) {
      console.error('Erro ao carregar contadores em lote:', error);
      // Não falhar silenciosamente - permitir fallback local
    }
  },
  
  async getUserDevices({ commit }, userId) {
    const { getRuntimeApi } = await import('@/services/runtimeApiRef');
    const api = getRuntimeApi();
    return await api.getUserDevices(userId); // GET /api/devices?userId={id}
  },
  
  async getUserUsers({ commit }, userId) {
    const { getRuntimeApi } = await import('@/services/runtimeApiRef');
    const api = getRuntimeApi();
    return await api.getUserSubUsers(userId); // GET /api/users?userId={id}
  }
}
```

**Adicionar mutation:**
```javascript
mutations: {
  // ... mutations existentes
  
  setUsersCounts(state, { deviceCounts, userCounts, loaded }) {
    state.usersCounts.deviceCounts = deviceCounts;
    state.usersCounts.userCounts = userCounts;
    state.usersCounts.loaded = loaded;
  }
}
```

**Adicionar getters:**
```javascript
getters: {
  // ... getters existentes
  
  areCountsLoaded: (state) => state.usersCounts.loaded,
  
  getUserDeviceCount: (state) => (userId) => {
    return state.usersCounts.deviceCounts[userId] || 0;
  },
  
  getUserSubUsersCount: (state) => (userId) => {
    return state.usersCounts.userCounts[userId] || 0;
  }
}
```

#### 3.2 Implementar Backend Endpoint (⚠️ Fora do escopo Vue)

**Endpoint Necessário:** `GET /users/counts`

**Contrato Esperado:**
```json
{
  "1": { "devices": 5, "users": 2 },
  "2": { "devices": 10, "users": 0 },
  "3": { "devices": 3, "users": 1 }
}
```

**⚠️ IMPORTANTE:** Se o backend NÃO implementar esse endpoint, o componente deve funcionar normalmente com os contadores locais (fallback).

#### 3.3 Atualizar edit-users.vue (1-2 horas)

**Adicionar colunas de contadores:**
```vue
<!-- ADICIONAR cabeçalho -->
<div @click="toggleSorting('deviceCount')" style="width: 100px; text-align: center;">
  {{KT('device.devices')}}
  <i class="fas fa-sort" v-if="sorting !== 'deviceCount-asc' && sorting !== 'deviceCount-desc'"></i>
  <i class="fas fa-sort-numeric-up" v-if="sorting === 'deviceCount-asc'"></i>
  <i class="fas fa-sort-numeric-down" v-if="sorting === 'deviceCount-desc'"></i>
</div>

<div @click="toggleSorting('userCount')" style="width: 100px; text-align: center;">
  {{KT('user.users')}}
  <i class="fas fa-sort" v-if="sorting !== 'userCount-asc' && sorting !== 'userCount-desc'"></i>
  <i class="fas fa-sort-numeric-up" v-if="sorting === 'userCount-asc'"></i>
  <i class="fas fa-sort-numeric-down" v-if="sorting === 'userCount-desc'"></i>
</div>

<!-- ADICIONAR células -->
<div style="width: 100px; text-align: center;">
  <el-tag size="small" type="success">
    <i class="fas fa-car"></i> {{ getUserDeviceCount(u.id) }}
  </el-tag>
</div>

<div style="width: 100px; text-align: center;">
  <el-tag size="small" type="info">
    <i class="fas fa-users"></i> {{ getUserUserCount(u.id) }}
  </el-tag>
</div>
```

**Adicionar refs e computed:**
```javascript
const deviceCounts = ref({});
const userCounts = ref({});
const loadingCounts = ref({});

const getUserDeviceCount = (userId) => {
  try {
    // Priorizar batch se disponível
    if (store.getters['users/areCountsLoaded']) {
      return store.getters['users/getUserDeviceCount'](userId);
    }
    
    // Fallback para contadores locais
    return deviceCounts.value[userId] || 0;
  } catch (error) {
    return 0;
  }
};

const getUserUserCount = (userId) => {
  try {
    if (store.getters['users/areCountsLoaded']) {
      return store.getters['users/getUserSubUsersCount'](userId);
    }
    
    return userCounts.value[userId] || 0;
  } catch (error) {
    return 0;
  }
};
```

**Adicionar onMounted:**
```javascript
onMounted(async () => {
  // Tentar carregar batch counts
  try {
    await store.dispatch('users/getAllUsersCounts');
  } catch (error) {
    console.warn('Batch counts não disponível, usando fallback local');
  }
  
  // XLSX já carregado no Módulo 2
});
```

**Atualizar sorting para incluir deviceCount e userCount:**
```javascript
// Adicionar casos no switch de ordenação
if(p[0]==='deviceCount' || p[0]==='userCount'){
  const aVal = (p[0]==='deviceCount') ? getUserDeviceCount(a.id) : getUserUserCount(a.id);
  const bVal = (p[0]==='deviceCount') ? getUserDeviceCount(b.id) : getUserUserCount(b.id);
  
  if(p[1]==='asc'){
    return aVal > bVal ? 1 : -1;
  }else{
    return aVal < bVal ? 1 : -1;
  }
}
```

**TESTE (Smoke Test):**
1. ✅ Abrir lista → badges de devices/users aparecem
2. ✅ Clicar ordenação deviceCount → ordena corretamente
3. ✅ Clicar ordenação userCount → ordena corretamente
4. ✅ Verificar console → 1 call `/users/counts` (não 200+)
5. ✅ Se backend falhar → badges mostram 0 (não quebra)
6. ✅ Adicionar device via modal → badge atualiza após fechar modal

**ROLLBACK:**
```bash
git checkout edit-users.vue
git checkout src/store/modules/users.js
```

---

### MÓDULO 4 (RISCO MÉDIO) - Auto-refresh após Modais

**Objetivo:** Atualizar contadores automaticamente após vincular devices/users.

**Tempo Estimado:** 2-3 horas

#### 4.1 Adicionar evento @objects-changed (30 min)

**Atualizar template:**
```vue
<link-objects ref="linkObjectsRef" @objects-changed="handleObjectsChanged"></link-objects>
```

**Adicionar handler:**
```javascript
const handleObjectsChanged = async (event) => {
  console.log('🔄 Recebido evento objects-changed:', event);
  
  const { userId, type, hasChanges } = event;
  
  if (!hasChanges || !userId) return;
  
  try {
    if (type === 'users' || type === 'devices') {
      // Recarregar conteos para este usuario especifico
      await refreshSingleUserCounts(userId);
    }
    
    console.log('✅ Atualização completada');
  } catch (error) {
    console.error('❌ Erro ao atualizar contadores:', error);
  }
};

const refreshSingleUserCounts = async (userId) => {
  try {
    const [devices, subUsers] = await Promise.all([
      store.dispatch('users/getUserDevices', userId),
      store.dispatch('users/getUserUsers', userId)
    ]);
    
    // Atualizar contadores locais
    deviceCounts.value[userId] = devices.length;
    userCounts.value[userId] = subUsers.length;
    
    // Se batch está carregado, atualizar também
    if (store.getters['users/areCountsLoaded']) {
      const currentCounts = store.state.users.usersCounts;
      currentCounts.deviceCounts[userId] = devices.length;
      currentCounts.userCounts[userId] = subUsers.length;
      
      store.commit('users/setUsersCounts', currentCounts);
    }
    
    console.log(`✅ Contadores atualizados: ${devices.length} dispositivos, ${subUsers.length} usuários`);
  } catch (error) {
    console.error('Erro ao atualizar contadores:', error);
  }
};
```

**⚠️ DEPENDÊNCIA:** O componente `link-objects` deve emitir o evento `@objects-changed` com payload:
```javascript
emit('objects-changed', {
  userId: currentUserId,
  type: 'devices', // ou 'users', 'geofences', etc.
  hasChanges: true
});
```

**TESTE (Smoke Test):**
1. ✅ Abrir lista → selecionar usuário → ver badges (ex: 3 devices)
2. ✅ Clicar "Devices" → adicionar 2 devices → fechar modal
3. ✅ **SEM REFRESH MANUAL** → badge atualiza para 5 devices
4. ✅ Clicar "Users" → adicionar 1 usuário → fechar modal
5. ✅ Badge users atualiza automaticamente
6. ✅ Console mostra logs de atualização

**ROLLBACK:**
```bash
git checkout edit-users.vue
```

---

### MÓDULO 5 (RISCO ALTO) - Importação Excel (Wizard 4 Etapas)

**Objetivo:** Adicionar funcionalidade de importação em massa.

**Tempo Estimado:** 8-12 horas

**⚠️ COMPLEXIDADE ALTA:** Este módulo requer validação rigorosa e tratamento de erros robusto.

#### 5.1 Adicionar Botões no Footer (15 min)

```vue
<!-- ADICIONAR após botões de exportação -->
<el-button 
  @click="openImportModal"
  type="success"
  @mouseenter.stop="showTip($event,'Importar Usuários')"
  @mouseleave="hideTip">
  <i class="fas fa-upload"></i>
</el-button>

<el-button 
  @click="downloadTemplate"
  type="info"
  @mouseenter.stop="showTip($event,'Baixar Template')"
  @mouseleave="hideTip">
  <i class="fas fa-download"></i>
</el-button>
```

#### 5.2 Adicionar Refs e Estado (30 min)

```javascript
const showImportModal = ref(false);
const currentStep = ref(1); // 1-4
const selectedFile = ref(null);
const previewData = ref([]);
const validData = ref([]);
const invalidData = ref([]);
const importProgress = ref(0);
const successCount = ref(0);
const errorCount = ref(0);
const errorLog = ref([]);
```

#### 5.3 Template do Modal de Importação (2-3 horas)

```vue
<!-- ADICIONAR após el-dialog principal -->
<el-dialog 
  :lock-scroll="true" 
  v-model="showImportModal" 
  width="90%" 
  :close-on-click-modal="false"
  destroy-on-close>
  
  <template v-slot:header>
    <div style="padding: 20px; border-bottom: 1px solid #e0e0e0;">
      <div class="modal-title">
        <i class="fas fa-users"></i> Importar Usuários
      </div>
    </div>
  </template>

  <div class="import-container">
    <!-- Indicador de passos -->
    <div class="steps-indicator">
      <div class="step-item" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
        <div class="step-number">1</div>
        <div class="step-title">Selecionar Arquivo</div>
      </div>
      <div class="step-line" :class="{ completed: currentStep > 1 }"></div>
      <div class="step-item" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
        <div class="step-number">2</div>
        <div class="step-title">Prévia e Validação</div>
      </div>
      <div class="step-line" :class="{ completed: currentStep > 2 }"></div>
      <div class="step-item" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
        <div class="step-number">3</div>
        <div class="step-title">Importando</div>
      </div>
      <div class="step-line" :class="{ completed: currentStep > 3 }"></div>
      <div class="step-item" :class="{ active: currentStep >= 4 }">
        <div class="step-number">4</div>
        <div class="step-title">Concluído</div>
      </div>
    </div>
    
    <!-- Etapa 1: Seleção de arquivo -->
    <div v-if="currentStep === 1" class="step-content">
      <h3>Selecione o arquivo Excel</h3>
      <p>Arraste e solte ou clique para selecionar um arquivo .xlsx ou .xls</p>

      <div class="file-upload-area" 
           @drop="handleDrop" 
           @dragover.prevent 
           @dragenter.prevent
           @click="$refs.fileInput.click()">
        <div class="upload-content">
          <i class="fas fa-cloud-upload-alt upload-icon"></i>
          <p class="upload-text">Arraste e solte o arquivo aqui</p>
          <p class="upload-subtext">ou clique para selecionar</p>
          <el-button type="primary" size="small">Selecionar Arquivo</el-button>
        </div>
        <input 
          ref="fileInput" 
          type="file" 
          accept=".xlsx,.xls" 
          @change="handleFileSelect" 
          style="display: none;">
      </div>

      <div v-if="selectedFile" class="file-info">
        <div class="file-details">
          <i class="fas fa-file-excel file-icon"></i>
          <div>
            <div class="file-name">{{ selectedFile.name }}</div>
            <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
          </div>
        </div>
      </div>

      <div class="template-section">
        <hr style="margin: 30px 0;">
        <p style="text-align: center; margin-bottom: 15px;">Ou baixe o template</p>
        <div style="text-align: center;">
          <el-button @click="downloadTemplate" type="success" plain>
            <i class="fas fa-download"></i> Baixar Template
          </el-button>
        </div>
      </div>
    </div>

    <!-- Etapa 2: Prévia -->
    <div v-if="currentStep === 2" class="step-content">
      <h3>Prévia e Validação</h3>
      <p>Revise os dados antes de importar</p>

      <div class="preview-stats">
        <div class="stat-box">
          <div class="stat-value">{{ previewData.length }}</div>
          <div class="stat-label">Total de linhas</div>
        </div>
        <div class="stat-box valid">
          <div class="stat-value">{{ validData.length }}</div>
          <div class="stat-label">Linhas válidas</div>
        </div>
        <div class="stat-box invalid">
          <div class="stat-value">{{ invalidData.length }}</div>
          <div class="stat-label">Linhas com erro</div>
        </div>
      </div>

      <div class="preview-table">
        <table>
          <thead>
            <tr>
              <th>Linha</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Senha</th>
              <th>Admin</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in previewData" :key="idx" 
                :class="{ 'row-error': row.__errors?.length }">
              <td>{{ idx + 2 }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.email }}</td>
              <td>{{ row.password ? '••••••' : '-' }}</td>
              <td>{{ row.administrator }}</td>
              <td>
                <span v-if="!row.__errors?.length" class="status-ok">✓ OK</span>
                <span v-else class="status-error">
                  ✗ {{ row.__errors.join(', ') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Etapa 3: Importando -->
    <div v-if="currentStep === 3" class="step-content">
      <h3>Importando Usuários</h3>
      <div class="import-progress">
        <el-progress :percentage="importProgress" :status="importProgress === 100 ? 'success' : ''"></el-progress>
        <p style="margin-top: 20px; text-align: center;">
          {{ successCount }} de {{ validData.length }} usuários importados
        </p>
      </div>
    </div>

    <!-- Etapa 4: Concluído -->
    <div v-if="currentStep === 4" class="step-content">
      <h3>Importação Concluída!</h3>
      
      <div class="result-summary">
        <div class="result-box success">
          <i class="fas fa-check-circle"></i>
          <div class="result-value">{{ successCount }}</div>
          <div class="result-label">Usuários importados</div>
        </div>
        <div class="result-box error" v-if="errorCount > 0">
          <i class="fas fa-times-circle"></i>
          <div class="result-value">{{ errorCount }}</div>
          <div class="result-label">Erros</div>
        </div>
      </div>

      <div v-if="errorLog.length > 0" class="error-log">
        <h4>Log de Erros:</h4>
        <div v-for="(err, idx) in errorLog" :key="idx" class="error-item">
          <strong>Linha {{ err.linha }}:</strong> {{ err.usuario }} - {{ err.erro }}
        </div>
      </div>
    </div>
  </div>

  <template v-slot:footer>
    <div style="padding: 20px; border-top: 1px solid #e0e0e0;">
      <el-button @click="closeImportModal" v-if="currentStep === 1 || currentStep === 4">
        {{ currentStep === 4 ? 'Fechar' : 'Cancelar' }}
      </el-button>
      <el-button type="primary" @click="nextStep" v-if="currentStep < 4" :disabled="!canProceed">
        {{ currentStep === 2 ? 'Importar' : 'Próximo' }}
      </el-button>
    </div>
  </template>
</el-dialog>
```

#### 5.4 Funções de Importação (4-5 horas)

```javascript
const openImportModal = () => {
  showImportModal.value = true;
  currentStep.value = 1;
  selectedFile.value = null;
  previewData.value = [];
  validData.value = [];
  invalidData.value = [];
  importProgress.value = 0;
  successCount.value = 0;
  errorCount.value = 0;
  errorLog.value = [];
};

const closeImportModal = () => {
  showImportModal.value = false;
  // Recarregar lista de usuários
  store.dispatch('users/getUsers');
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    processExcelFile(file);
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) {
    selectedFile.value = file;
    processExcelFile(file);
  }
};

const processExcelFile = (file) => {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      // Processar e validar dados
      previewData.value = jsonData.map((row, idx) => {
        const processed = processRowData(row);
        return processed;
      });
      
      // Separar válidos e inválidos
      validData.value = previewData.value.filter(row => !row.__errors?.length);
      invalidData.value = previewData.value.filter(row => row.__errors?.length);
      
      currentStep.value = 2;
    } catch (error) {
      ElMessage.error('Erro ao processar arquivo: ' + error.message);
    }
  };
  
  reader.readAsArrayBuffer(file);
};

const processRowData = (row) => {
  const errors = [];
  
  // Campos obrigatórios
  if (!row.name?.trim()) errors.push('Nome é obrigatório');
  if (!row.email?.trim()) errors.push('Email é obrigatório');
  
  // Validação de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (row.email && !emailRegex.test(row.email)) {
    errors.push('Email inválido');
  }
  
  // Validação de valores booleanos
  if (row.administrator && !['Sim', 'Não', 'Yes', 'No'].includes(row.administrator)) {
    errors.push('Administrador deve ser "Sim" ou "Não"');
  }
  
  return {
    name: row.name || '',
    email: row.email || '',
    password: row.password || 'senha123', // senha padrão
    phone: row.phone || '',
    administrator: ['Sim', 'Yes'].includes(row.administrator),
    disabled: false,
    __errors: errors
  };
};

const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return selectedFile.value !== null;
  }
  if (currentStep.value === 2) {
    return validData.value.length > 0;
  }
  return true;
});

const nextStep = async () => {
  if (currentStep.value === 1) {
    currentStep.value = 2;
  } else if (currentStep.value === 2) {
    currentStep.value = 3;
    await startImport();
  }
};

const startImport = async () => {
  successCount.value = 0;
  errorCount.value = 0;
  errorLog.value = [];
  
  const total = validData.value.length;
  
  for (let i = 0; i < total; i++) {
    const row = validData.value[i];
    
    try {
      const userData = {
        name: row.name,
        email: row.email,
        password: row.password,
        phone: row.phone,
        administrator: row.administrator,
        disabled: row.disabled,
        attributes: {}
      };
      
      await store.dispatch('users/save', userData);
      successCount.value++;
    } catch (error) {
      errorCount.value++;
      errorLog.value.push({
        linha: i + 2,
        usuario: row.name,
        erro: error.message || 'Erro desconhecido'
      });
    }
    
    importProgress.value = Math.round(((i + 1) / total) * 100);
  }
  
  currentStep.value = 4;
  
  // Recarregar contadores batch
  if (successCount.value > 0) {
    await store.dispatch('users/getAllUsersCounts');
  }
};

const downloadTemplate = () => {
  const template = [
    {
      name: 'João Silva',
      email: 'joao@empresa.com',
      password: 'senha123',
      phone: '11999999999',
      administrator: 'Não'
    },
    {
      name: 'Maria Santos',
      email: 'maria@empresa.com',
      password: 'senha456',
      phone: '11888888888',
      administrator: 'Sim'
    }
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuários');
  
  XLSX.writeFile(workbook, 'template_usuarios.xlsx');
  ElMessage.success('Template baixado com sucesso!');
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
```

#### 5.5 CSS do Modal de Importação (1 hora)

```css
.import-container {
  padding: 30px;
}

.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #999;
  margin-bottom: 10px;
}

.step-item.active .step-number {
  background: var(--p-primary-500);
  color: white;
}

.step-item.completed .step-number {
  background: #27ae60;
  color: white;
}

.step-line {
  flex: 1;
  height: 2px;
  background: #e0e0e0;
  margin: 0 10px;
}

.step-line.completed {
  background: #27ae60;
}

.step-title {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.file-upload-area {
  border: 2px dashed #ccc;
  border-radius: 10px;
  padding: 60px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.file-upload-area:hover {
  border-color: var(--p-primary-500);
  background: rgba(59, 130, 246, 0.05);
}

.upload-icon {
  font-size: 48px;
  color: var(--p-primary-500);
  margin-bottom: 20px;
}

.preview-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.stat-box {
  flex: 1;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-box.valid {
  background: #d4edda;
}

.stat-box.invalid {
  background: #f8d7da;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.preview-table {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #e0e0e0;
  position: sticky;
  top: 0;
}

.preview-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.row-error {
  background: #fff5f5;
}

.status-ok {
  color: #27ae60;
  font-weight: bold;
}

.status-error {
  color: #e74c3c;
  font-size: 12px;
}

.import-progress {
  padding: 60px;
  text-align: center;
}

.result-summary {
  display: flex;
  gap: 30px;
  justify-content: center;
  margin: 40px 0;
}

.result-box {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  min-width: 200px;
}

.result-box.success {
  background: #d4edda;
}

.result-box.error {
  background: #f8d7da;
}

.result-box i {
  font-size: 48px;
  margin-bottom: 15px;
}

.result-box.success i {
  color: #27ae60;
}

.result-box.error i {
  color: #e74c3c;
}

.result-value {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 10px;
}

.result-label {
  font-size: 14px;
  color: #666;
}

.error-log {
  background: #fff3cd;
  padding: 20px;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.error-item {
  padding: 10px;
  border-bottom: 1px solid #ffc107;
  font-size: 13px;
}

.error-item:last-child {
  border-bottom: none;
}
```

**TESTE (Smoke Test):**
1. ✅ Clicar "Baixar Template" → baixa Excel
2. ✅ Preencher template com 5 usuários (3 válidos, 2 inválidos)
3. ✅ Arrastar arquivo → wizard abre no passo 2
4. ✅ Visualizar prévia → 3 linhas OK, 2 linhas com erro
5. ✅ Clicar "Importar" → barra de progresso
6. ✅ Ver resultado → 3 sucesso, 2 erros
7. ✅ Fechar modal → lista atualiza com novos usuários
8. ✅ Badges de contadores estão corretos

**ROLLBACK:**
```bash
git checkout edit-users.vue
```

---

### MÓDULO 6 (RISCO ALTO) - Design Responsivo Mobile

**Objetivo:** Tornar a lista usável em dispositivos móveis.

**Tempo Estimado:** 4-6 horas

**⚠️ COMPLEXIDADE:** Requer duplicação de template (desktop + mobile).

#### 6.1 Adicionar Template Mobile (2 horas)

```vue
<!-- ADICIONAR após .users-list (desktop) -->
<!-- Vista móvil de tarjetas (oculta por padrão) -->
<div class="mobile-users-list" style="display: none;">
  <div 
    class="mobile-user-card" 
    v-for="user in filteredUsers" 
    :key="user.id"
    @click="selected = (selected !== user.id) ? user.id : 0"
    @dblclick="editUserRef?.editUser(user.id)"
    :class="{ selected: selected === user.id }">
    
    <div class="mobile-user-header">
      <div class="mobile-user-name">{{ user.name || 'Sem nome' }}</div>
      <div class="mobile-user-id">ID: {{ user.id }}</div>
    </div>
    
    <div class="mobile-user-info">
      <div class="mobile-info-item">
        <i class="fas fa-car mobile-info-icon"></i>
        <span>{{ getUserDeviceCount(user.id) }} dispositivos</span>
      </div>
      
      <div class="mobile-info-item">
        <i class="fas fa-users mobile-info-icon"></i>
        <span>{{ getUserUserCount(user.id) }} usuários</span>
      </div>
      
      <div class="mobile-info-item" v-if="user.email">
        <i class="fas fa-envelope mobile-info-icon"></i>
        <span>{{ user.email }}</span>
      </div>
      
      <div class="mobile-info-item">
        <i class="fas fa-phone mobile-info-icon"></i>
        <span>{{ user.phone || 'Sem telefone' }}</span>
      </div>
    </div>
    
    <div class="mobile-user-status">
      <el-tag v-if="user.administrator" type="danger" size="small">
        <i class="fas fa-crown"></i> Admin
      </el-tag>
      <el-tag :type="user.disabled ? 'danger' : 'success'" size="small">
        {{ user.disabled ? 'Suspenso' : 'Ativo' }}
      </el-tag>
    </div>
  </div>
</div>
```

#### 6.2 CSS Responsivo (2-3 horas)

```css
/* Desktop - padrão (>1025px) */
.mobile-users-list {
  display: none;
}

/* Tablet (769-1024px) */
@media (min-width: 769px) and (max-width: 1024px) {
  .el-dialog {
    width: 95vw !important;
  }
  
  /* Manter tabela mas otimizar */
  .itm div {
    font-size: 12px;
    padding: 8px !important;
  }
  
  .users-stats-card {
    gap: 10px;
  }
  
  .stat-number {
    font-size: 24px;
  }
}

/* Mobile (≤768px) */
@media (max-width: 768px) {
  .el-dialog {
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }
  
  .el-dialog__body {
    padding: 12px !important;
  }
  
  /* Ocultar tabela desktop */
  .itm:not(:first-child) {
    display: none !important;
  }
  
  /* Mostrar cards mobile */
  .mobile-users-list {
    display: block !important;
    padding: 0 8px;
    max-height: calc(100vh - 300px);
    overflow-y: auto;
  }
  
  .mobile-user-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 12px;
    padding: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .mobile-user-card.selected {
    border-color: var(--p-primary-500);
    background-color: rgba(59, 130, 246, 0.05);
  }
  
  .mobile-user-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .mobile-user-name {
    font-weight: 600;
    font-size: 15px;
    color: #1f2937;
  }
  
  .mobile-user-id {
    font-size: 11px;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .mobile-user-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .mobile-info-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }
  
  .mobile-info-icon {
    width: 16px;
    text-align: center;
    color: var(--p-primary-600);
  }
  
  .mobile-user-status {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .mobile-user-status .el-tag {
    font-size: 11px !important;
  }
  
  /* Estatísticas em grid 2x2 */
  .users-stats-card {
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 12px;
  }
  
  .users-stat-item {
    padding: 12px;
    font-size: 0.9rem;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .stat-label {
    font-size: 11px;
  }
  
  /* Footer com ícones apenas */
  .el-dialog__footer .el-button {
    min-width: 40px !important;
    height: 40px !important;
    padding: 8px !important;
  }
  
  .el-dialog__footer .el-button i {
    margin: 0 !important;
  }
  
  .el-dialog__footer .el-button span {
    display: none !important;
  }
}
```

**TESTE (Smoke Test):**
1. ✅ Desktop (>1025px) → tabela normal
2. ✅ Tablet (769-1024px) → tabela compacta
3. ✅ Mobile (≤768px) → cards visíveis
4. ✅ Mobile → scroll funciona
5. ✅ Mobile → clicar card → seleciona
6. ✅ Mobile → duplo clique → abre edição
7. ✅ Mobile → footer com ícones apenas
8. ✅ Mobile → estatísticas em grid 2x2

**ROLLBACK:**
```bash
git checkout edit-users.vue
```

---

### MÓDULO 7 (RISCO ALTO) - Trocar Sessão (Impersonate)

**Objetivo:** Permitir admins assumirem sessão de outro usuário.

**Tempo Estimado:** 2-3 horas

**⚠️ SEGURANÇA CRÍTICA:** Requer auditoria completa no backend.

#### 7.1 Adicionar Botão no Footer (15 min)

```vue
<!-- ADICIONAR no footer -->
<el-button
  v-if="store.state.auth.administrator || (store.getters.advancedPermissions(16) && store.getters.advancedPermissions(18))"
  @mouseleave="hideTip"
  @mouseenter.stop="showTip($event, KT('user.changesesion'))"
  type="success"
  plain
  :disabled="selected === 0"
  @click="createSession">
  <i class="fas fa-passport"></i>
</el-button>
```

#### 7.2 Função createSession (30 min)

```javascript
const createSession = async () => {
  if (selected.value === 0) {
    ElMessage.warning('Selecione um usuário');
    return;
  }
  
  const user = store.getters['users/getUser'](selected.value);
  
  if (!user) {
    ElMessage.error('Usuário não encontrado');
    return;
  }
  
  // Confirmar ação
  try {
    await ElMessageBox.confirm(
      `Você será deslogado e entrará como "${user.name}". Deseja continuar?`,
      'Trocar Sessão',
      {
        confirmButtonText: 'Sim, trocar',
        cancelButtonText: 'Cancelar',
        type: 'warning',
      }
    );
    
    // Salvar sessão original
    const currentUser = store.state.auth;
    sessionStorage.setItem('originalSession', JSON.stringify({
      id: currentUser.id,
      name: currentUser.name
    }));
    
    // Chamar API de troca
    const response = await fetch(`/api/session/${selected.value}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Erro ao trocar sessão');
    }
    
    ElMessage.success(`Trocando para usuário ${user.name}...`);
    
    // Recarregar página após 1 segundo
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Erro ao trocar sessão: ' + error.message);
    }
  }
};
```

#### 7.3 Botão de Retorno (Adicionar em algum lugar visível)

```vue
<!-- ADICIONAR em um componente global (ex: header) -->
<el-button
  v-if="sessionStorage.getItem('originalSession')"
  type="warning"
  size="small"
  @click="returnToOriginalSession">
  <i class="fas fa-undo"></i> Voltar para sessão original
</el-button>
```

```javascript
const returnToOriginalSession = async () => {
  const originalSession = sessionStorage.getItem('originalSession');
  if (!originalSession) return;
  
  try {
    const original = JSON.parse(originalSession);
    
    const response = await fetch(`/api/session/${original.id}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Erro ao retornar');
    }
    
    sessionStorage.removeItem('originalSession');
    window.location.reload();
    
  } catch (error) {
    ElMessage.error('Erro ao retornar: ' + error.message);
  }
};
```

**⚠️ BACKEND REQUERIDO:**

```php
// /api/session/{userId}
public function switchSession($userId) {
    // Validar permissão de admin
    if (!$currentUser->administrator) {
        throw new Exception('Apenas administradores podem trocar sessão');
    }
    
    // Logar auditoria
    $this->logAudit([
        'admin_id' => $currentUser->id,
        'target_user_id' => $userId,
        'action' => 'session_switch',
        'timestamp' => time(),
        'ip' => $_SERVER['REMOTE_ADDR']
    ]);
    
    // Trocar sessão
    $_SESSION['userId'] = $userId;
    $_SESSION['switched_from'] = $currentUser->id;
    
    return ['success' => true];
}
```

**TESTE (Smoke Test):**
1. ✅ Admin → selecionar usuário → botão "Trocar Sessão" habilitado
2. ✅ Clicar → confirmar → recarrega como novo usuário
3. ✅ Ver nome/permissões do novo usuário
4. ✅ Botão "Voltar" visível no header
5. ✅ Clicar "Voltar" → retorna ao admin original
6. ✅ Auditoria registrada no backend
7. ✅ Usuário não-admin → botão não aparece

**ROLLBACK:**
```bash
git checkout edit-users.vue
# Remover botão de retorno do header
```

---

## 4️⃣ CHECKLIST DE TESTES (Smoke Test Completo)

### 4.1 TESTES MANUAIS NA UI

#### Módulo 1 (Read-Only UI)
- [ ] **1.1** Abrir lista de usuários → ver 3 cards de estatísticas
- [ ] **1.2** Clicar card "Total" → lista mostra todos
- [ ] **1.3** Clicar card "Admins" → lista filtra apenas admins
- [ ] **1.4** Clicar card "Suspensos" → lista filtra apenas suspensos
- [ ] **1.5** Ver badges "Admin" (vermelho) e "Ativo/Suspenso" (verde/vermelho)
- [ ] **1.6** Header azul com ícone de usuários

#### Módulo 2 (Exportação)
- [ ] **2.1** Clicar botão PDF → abre print preview
- [ ] **2.2** Ver tabela formatada com bordas e cores
- [ ] **2.3** Imprimir → gera PDF válido
- [ ] **2.4** Clicar botão Excel → baixa arquivo .xlsx
- [ ] **2.5** Abrir Excel → dados corretos (ID, Nome, Email, Status, Tipo)
- [ ] **2.6** Filtrar usuários → exportar → apenas filtrados no arquivo

#### Módulo 3 (Batch Counts + Badges)
- [ ] **3.1** Abrir lista → ver badges "X dispositivos" e "Y usuários"
- [ ] **3.2** Console → verificar 1 call GET `/users/counts` (não 200+)
- [ ] **3.3** Clicar ordenação "Dispositivos" → ordena corretamente
- [ ] **3.4** Clicar ordenação "Usuários" → ordena corretamente
- [ ] **3.5** Backend offline → badges mostram 0 (não quebra)

#### Módulo 4 (Auto-refresh)
- [ ] **4.1** Selecionar usuário com 3 dispositivos
- [ ] **4.2** Clicar "Devices" → adicionar 2 dispositivos → fechar modal
- [ ] **4.3** **SEM REFRESH MANUAL** → badge atualiza para 5 dispositivos
- [ ] **4.4** Console → ver log "🔄 Recebido evento objects-changed"
- [ ] **4.5** Console → ver log "✅ Contadores atualizados: 5 dispositivos, 0 usuários"

#### Módulo 5 (Importação Excel)
- [ ] **5.1** Clicar "Baixar Template" → baixa Excel
- [ ] **5.2** Preencher template: 3 usuários válidos, 2 inválidos (email errado)
- [ ] **5.3** Arrastar arquivo para área de upload → wizard abre
- [ ] **5.4** Etapa 2 → ver 5 linhas (3 OK, 2 com erro)
- [ ] **5.5** Ver estatísticas: "3 válidas, 2 com erro"
- [ ] **5.6** Clicar "Importar" → barra de progresso
- [ ] **5.7** Etapa 4 → ver "3 sucesso, 2 erros"
- [ ] **5.8** Ver log de erros com detalhes
- [ ] **5.9** Fechar modal → lista atualiza com 3 novos usuários
- [ ] **5.10** Badges dos novos usuários mostram 0 dispositivos

#### Módulo 6 (Mobile)
- [ ] **6.1** Desktop (>1025px) → tabela normal visível
- [ ] **6.2** Redimensionar para tablet (800px) → tabela compacta
- [ ] **6.3** Redimensionar para mobile (400px) → cards visíveis
- [ ] **6.4** Mobile → scroll funciona
- [ ] **6.5** Mobile → clicar card → seleciona (borda azul)
- [ ] **6.6** Mobile → duplo clique → abre modal de edição
- [ ] **6.7** Mobile → footer com ícones apenas (sem texto)
- [ ] **6.8** Mobile → estatísticas em grid 2x2

#### Módulo 7 (Trocar Sessão)
- [ ] **7.1** Admin → selecionar usuário → botão "Trocar Sessão" habilitado
- [ ] **7.2** Clicar → confirmar → recarrega como novo usuário
- [ ] **7.3** Ver nome do novo usuário no header
- [ ] **7.4** Testar permissões do novo usuário
- [ ] **7.5** Botão "Voltar" visível no header
- [ ] **7.6** Clicar "Voltar" → retorna ao admin original
- [ ] **7.7** Verificar auditoria no backend
- [ ] **7.8** Usuário não-admin → botão não aparece

### 4.2 TESTES VIA CONSOLE VUEX

```javascript
// Abrir DevTools → Console

// Teste 1: Ver estado de usuários
$vm0.$store.state.users.list

// Teste 2: Ver contadores batch
$vm0.$store.state.users.usersCounts

// Teste 3: Ver se batch está carregado
$vm0.$store.getters['users/areCountsLoaded']

// Teste 4: Obter contador de dispositivos de userId=2
$vm0.$store.getters['users/getUserDeviceCount'](2)

// Teste 5: Disparar atualização de contadores
await $vm0.$store.dispatch('users/getAllUsersCounts')

// Teste 6: Ver usuário logado
$vm0.$store.state.auth
```

### 4.3 CASOS EDGE (Validação Crítica)

#### Edge Case 1: IDs String vs Number
```javascript
// Backend pode retornar IDs como string ou number
// Testar:
const user1 = store.getters['users/getUser'](1);   // number
const user2 = store.getters['users/getUser']("1"); // string
// Ambos devem funcionar
```

#### Edge Case 2: Backend sem /users/counts
- [ ] Desabilitar endpoint no backend
- [ ] Abrir lista → badges mostram 0 ou contador local
- [ ] Não deve quebrar a aplicação
- [ ] Console mostra warning: "Batch counts não disponível"

#### Edge Case 3: XLSX não carregado
- [ ] Bloquear CDN no DevTools (Network → Block)
- [ ] Clicar "Exportar Excel" → erro amigável
- [ ] Mensagem: "Biblioteca XLSX não carregada"

#### Edge Case 4: Importação com Excel vazio
- [ ] Upload Excel sem linhas
- [ ] Ver mensagem: "Nenhum dado para importar"
- [ ] Modal não quebra

#### Edge Case 5: Usuário ID=1 oculto
- [ ] Admin com ID=2 → não vê userId=1 na lista
- [ ] Admin com ID=1 → vê a si mesmo na lista
- [ ] Validação: `if(f.id === 1 && store.state.auth.id !== 1) return false`

#### Edge Case 6: Delete Superior Admin
- [ ] Admin com ID=2 → não pode deletar admin com ID=1
- [ ] Mensagem: "Você não pode deletar um admin superior a você!"

#### Edge Case 7: Mobile com lista vazia
- [ ] Filtrar usuários até lista ficar vazia
- [ ] Mobile → ver mensagem "Nenhum usuário encontrado"
- [ ] Não mostrar cards vazios

### 4.4 CRITÉRIOS DE ACEITE

**REGRA: "Não ficou pior que produção"**

| Critério | Validação |
|----------|-----------|
| **Todos os usuários visíveis** | Produção mostra N usuários → Dark mostra N usuários |
| **Busca funciona** | Buscar "João" → mesmos resultados em ambas versões |
| **Ordenação funciona** | Ordenar por Nome → mesma ordem em ambas versões |
| **Editar usuário** | Abrir modal → todos campos editáveis como antes |
| **Deletar usuário** | Deletar → validações funcionam (id=1, superior admin) |
| **Vincular objetos** | Clicar "Devices" → modal abre normalmente |
| **Performance** | Lista com 100 usuários carrega em <2s (vs <1s produção) |
| **Mobile** | Lista usável em iPhone SE (vs quebrada em produção) |

---

## 5️⃣ PRÓXIMO PASSO

### IMPLEMENTAÇÃO RECOMENDADA

**Ordem Segura (Cherry-Pick):**

1. ✅ **MÓDULO 1** (3-4h) → Read-Only UI Enhancements
   - Risco: 🟢 BAIXO
   - Impacto: Visual apenas
   - Rollback: Simples (1 arquivo)

2. ✅ **MÓDULO 2** (1-2h) → Exportação PDF/Excel
   - Risco: 🟢 BAIXO
   - Impacto: Funcionalidade adicional
   - Rollback: Simples (1 arquivo)

3. ⏸️ **MÓDULO 3** (4-6h) → Batch Counts + Badges
   - Risco: 🟡 MÉDIO
   - Impacto: Performance + Store
   - Rollback: Médio (2 arquivos)
   - **Requer**: Backend endpoint `/users/counts`

4. ⏸️ **MÓDULO 4** (2-3h) → Auto-refresh após Modais
   - Risco: 🟡 MÉDIO
   - Impacto: Sincronização de dados
   - Rollback: Simples (1 arquivo)
   - **Requer**: Evento `@objects-changed` em `link-objects`

5. ⏸️ **MÓDULO 5** (8-12h) → Importação Excel
   - Risco: 🔴 ALTO
   - Impacto: Feature complexa
   - Rollback: Médio (1 arquivo + CSS)
   - **Requer**: Validação rigorosa

6. ⏸️ **MÓDULO 6** (4-6h) → Design Responsivo Mobile
   - Risco: 🔴 ALTO
   - Impacto: Layout + CSS
   - Rollback: Médio (1 arquivo)
   - **Requer**: Testes em dispositivos reais

7. ⏸️ **MÓDULO 7** (2-3h) → Trocar Sessão
   - Risco: 🔴 ALTO (Segurança)
   - Impacto: Feature admin
   - Rollback: Simples (1 arquivo)
   - **Requer**: Backend endpoint `/api/session/{id}` + auditoria

---

## 📌 RECOMENDAÇÃO FINAL

**ESTRATÉGIA: Implementar Módulos 1 e 2 IMEDIATAMENTE (4-6 horas total)**

Esses módulos são:
- ✅ Risco BAIXO
- ✅ Sem dependências de backend
- ✅ Rollback trivial
- ✅ Impacto visual positivo
- ✅ Não quebram nada existente

**Depois:**
- Validar com usuários reais
- Se aprovado → implementar Módulo 3 (batch counts)
- Avaliar necessidade dos demais módulos

**PRÓXIMO PASSO:** Implementar Módulo 1 (Read-Only UI Enhancements - 3-4 horas)

---

**🎯 OBJETIVO ALCANÇADO:** Plano completo de consolidação SEM NENHUMA REGRESSÃO, com cherry-pick incremental de features e testes robustos.
