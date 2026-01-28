# 📦 GUIA DE APLICAÇÃO — edit-users.vue MITApp

**Data:** 25/01/2026  
**Versão:** Fase 1 MVP  
**Arquivo a Substituir:** `c:\projeto\Versao-tarkan-Jesse\front-end\src\tarkan\components\views\edit-users.vue`

---

## 🚀 **PASSO A PASSO**

### **1️⃣ Backup do Arquivo Original**

```powershell
# No terminal PowerShell
cd c:\projeto\Versao-tarkan-Jesse\front-end
cp src\tarkan\components\views\edit-users.vue src\tarkan\components\views\edit-users.vue.backup
```

**✅ Confirmação:** Arquivo `edit-users.vue.backup` criado

---

### **2️⃣ Aplicar o Patch MITApp**

1. Abra o arquivo de patch gerado:
   - [EDIT_USERS_MITAPP_PATCH.vue](./EDIT_USERS_MITAPP_PATCH.vue)

2. Copie TODO o conteúdo (Ctrl+A → Ctrl+C)

3. Abra o arquivo original:
   - `src\tarkan\components\views\edit-users.vue`

4. Substitua TODO o conteúdo (Ctrl+A → Ctrl+V)

5. Salve o arquivo (Ctrl+S)

**✅ Confirmação:** Arquivo salvo, VSCode não mostra erros de lint

---

### **3️⃣ Verificar Imports no Build**

**Não é necessário instalar novas dependências!**

Todas as dependências já existem:
- ✅ `element-plus` (já instalado)
- ✅ `vuex` (já instalado)
- ✅ `vue` (já instalado)

**Libs para Fase 2 (não instalar agora):**
- ❌ `jspdf` (export PDF)
- ❌ `jspdf-autotable` (tabelas PDF)
- ❌ `xlsx` (export Excel)

---

### **4️⃣ Testar no Navegador**

1. **Iniciar dev server:**
   ```powershell
   npm run dev
   # ou
   npm run serve
   ```

2. **Abrir aplicação:** `http://localhost:8080` (ou porta configurada)

3. **Login como admin**

4. **Abrir modal de usuários:**
   - Menu → Usuários
   - Ou atalho direto

5. **Executar Checklist de Testes:**
   - Seguir [EDIT_USERS_MITAPP_CHECKLIST.md](./EDIT_USERS_MITAPP_CHECKLIST.md)
   - Foco nos 5 testes CRÍTICOS

---

## ✅ **VALIDAÇÃO VISUAL**

### **Header**
- ✅ Gradiente laranja MIT (`#FF6B35` → `#F7931E`)
- ✅ Ícone `fa-users` visível
- ✅ Título "Usuários" centralizado
- ✅ Botão X no canto superior direito (não invade header)

### **Cards de Estatísticas**
- ✅ 4 cards em grid (Total, Admins, Suspensos, Devedores*)
- ✅ Cores distintas (roxo, rosa, laranja, vermelho)
- ✅ Hover: sombra + translateY(-2px)
- ✅ Clique: ativa filtro (borda highlight)

*Se módulo invoices não estiver ativo, só aparecem 3 cards*

### **Tabela**
- ✅ Coluna ID (80px)
- ✅ Coluna Nome com avatar + chip de domínio
- ✅ Coluna Email
- ✅ **[NOVO]** Coluna Dispositivos (contador clicável)
- ✅ **[NOVO]** Coluna Usuários (contador clicável)
- ✅ **[NOVO]** Colunas Billing (se ativo)*
- ✅ Coluna Admin (tag vermelha/azul)
- ✅ Coluna Status (tag verde/vermelho)
- ✅ Coluna Ações (⋯)

*Colunas Billing: "Fact. Pend.", "Saldo Pend.", "Últ. Venc."*

### **Footer**
- ✅ **[NOVO]** 15 botões organizados em 3 grupos:
  - Grupo 1 (Ações): Remover, Editar, Logs
  - Grupo 2 (Relações): Users, Devices, Geofences, Groups, Notifications, Calendars, Attributes, Drivers, Commands, Maintenance
  - Grupo 3 (Extras): Criar Sessão, PDF, Excel
- ✅ Botão "Fechar" à direita
- ✅ Tooltips ao passar mouse
- ✅ Botões desabilitados se `selected === 0`

### **Mobile (< 768px)**
- ✅ Tabela desaparece
- ✅ Cards aparecem (avatar + nome + email + contadores)
- ✅ Footer vira grid 44px
- ✅ Textos dos botões desaparecem (só ícones)

---

## 🐛 **TROUBLESHOOTING**

### **Problema: Cards de stats não aparecem**
**Causa:** Computed `filteredUsers` retornando vazio  
**Fix:** Verificar que `store.getters['users/getUsers']` está populado

---

### **Problema: Contadores mostram "-" ou "..."**
**Causa:** Cache não populado  
**Fix:** 
1. Duplo-clique em um contador (força refresh)
2. Verificar que actions `users/getUserDevices` e `users/getUserUsers` existem no Vuex

---

### **Problema: Backdrop acumula ao fechar modal**
**Causa:** Eventos `@closed` não conectados  
**Fix:** Verificar que linha 8 do patch tem:
```vue
@closed="handleModalClosed"
```

---

### **Problema: Botões de relação não funcionam**
**Causa:** `linkObjectsRef` não injetado  
**Fix:** Verificar que componente pai fornece:
```js
provide('link-objects', linkObjectsRef)
```

---

### **Problema: Card "Devedores" aparece sem dados**
**Causa:** Módulo invoices não carregado  
**Fix:** 
1. Verificar `store.state.server.modules`
2. Se não incluir 'invoices', card não deve aparecer
3. Computed `showDebtorsCard` deve retornar `false`

---

### **Problema: Footer quebra no mobile**
**Causa:** CSS não carregou  
**Fix:** Hard refresh (Ctrl+Shift+R) ou limpar cache

---

### **Problema: Exports mostram "Funcionalidade em desenvolvimento"**
**Causa:** Fase 1 tem stubs  
**Fix:** Normal! Implementar em Fase 2 (ver roadmap)

---

## 🔄 **ROLLBACK (Se Necessário)**

```powershell
# Restaurar backup
cd c:\projeto\Versao-tarkan-Jesse\front-end
cp src\tarkan\components\views\edit-users.vue.backup src\tarkan\components\views\edit-users.vue
```

**✅ Confirmação:** Arquivo original restaurado

---

## 📊 **COMPARAÇÃO ANTES/DEPOIS**

| Métrica | Antes | Depois (Fase 1) | Delta |
|---------|-------|-----------------|-------|
| **Linhas** | 1.151 | ~1.800 | +649 (+56%) |
| **Funcionalidades** | 12 | 20 | +8 (+67%) |
| **Colunas Tabela** | 5 | 10* | +5 (+100%) |
| **Botões Footer** | 1 | 15 | +14 (+1400%) |
| **Cards Stats** | 3 | 4* | +1 (+33%) |
| **Mobile** | ❌ Quebrado | ✅ Cards | ✅ |
| **Dark Mode** | ✅ Tokens | ✅ Tokens MIT | ✅ |

*10 colunas = 5 originais + 2 contadores + 3 billing (se ativo)  
*4 cards = 3 originais + 1 devedores (se ativo)*

---

## 🎯 **CRITÉRIO DE SUCESSO**

✅ **Deploy Aprovado Se:**
1. Todos os 5 testes CRÍTICOS passam
2. ZERO erros de console no navegador
3. ZERO regressão funcional (tudo que funcionava antes continua funcionando)
4. Mobile usável (cards, footer grid 44px)
5. Performance aceitável (< 2s para carregar modal com 100 usuários)

---

## 📞 **SUPORTE**

**Problemas?**
1. Consultar [EDIT_USERS_MITAPP_CHECKLIST.md](./EDIT_USERS_MITAPP_CHECKLIST.md)
2. Verificar console do navegador (F12)
3. Testar com usuário admin
4. Verificar que store Vuex está populado

**Próximos Passos:**
- Fase 2: Exports reais (PDF/Excel)
- Fase 3: Import de usuários + Bulk actions

Consultar [EDIT_USERS_MITAPP_ROADMAP.md](./EDIT_USERS_MITAPP_ROADMAP.md)

---

**✅ PATCH PRONTO PARA DEPLOY**
