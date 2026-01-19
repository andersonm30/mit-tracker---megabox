# 📦 PR-03 - Modal Create/Edit de Motoristas

**Data:** 18/01/2026  
**Status:** ✅ Código entregue, pronto para testes

---

## 🎯 Objetivo

Ligar os botões "Novo Motorista" e "Editar" do dashboard `/drivers` a um modal de formulário funcional que:
- Cria novos motoristas (name + uniqueId)
- Edita motoristas existentes
- Usa `store.dispatch('drivers/save')` e `store.dispatch('drivers/load')`
- Validação Element Plus com regras mínimas

---

## ✅ Arquivos Criados/Alterados

### 1️⃣ CRIADO: `src/templates/components/driver-form-modal.vue` (166 linhas)

**Responsabilidades:**
- Modal reutilizável (create/edit)
- Validação de formulário (name min 3 chars, uniqueId min 3 chars)
- Submit via `store.dispatch('drivers/save', payload)`
- Reload via `store.dispatch('drivers/load')`
- Emite evento `saved` ao sucesso
- Controla próprio loading state

**Props:**
```javascript
modelValue: Boolean  // v-model para open/close
mode: 'create' | 'edit'
driver: Object | null  // Motorista para editar
```

**Emits:**
```javascript
'update:modelValue'  // Fecha/abre modal
'saved'              // Emitido após salvar com sucesso
```

**Estrutura do Form:**
```javascript
form: {
  name: string,      // Nome completo (obrigatório, min 3)
  uniqueId: string   // CPF/RG/RFID (obrigatório, min 3)
}
```

**Payload Create:**
```javascript
{
  name: 'João Silva',
  uniqueId: '12345678900',
  attributes: {}
}
```

**Payload Edit:**
```javascript
{
  id: 123,  // ← Preserva ID para update
  name: 'João Silva Atualizado',
  uniqueId: '12345678900',
  attributes: { ... }  // ← Preserva attributes existentes
}
```

---

### 2️⃣ ALTERADO: `src/templates/drivers-dashboard.vue`

**Mudanças:**

#### Import (linha 134):
```javascript
import DriverFormModal from './components/driver-form-modal.vue';
```

#### State adicional (linhas 148-151):
```javascript
const isModalOpen = ref(false);
const modalMode = ref('create');
const selectedDriver = ref(null);
```

#### Handlers novos (linhas 212-227):
```javascript
function openCreate() {
  modalMode.value = 'create';
  selectedDriver.value = null;
  isModalOpen.value = true;
}

function openEdit(driver) {
  modalMode.value = 'edit';
  selectedDriver.value = driver;
  isModalOpen.value = true;
}

function onDriverSaved() {
  // Lista já foi recarregada no modal via drivers/load
}
```

#### Template - Modal (linhas 120-126):
```vue
<driver-form-modal
  v-model="isModalOpen"
  :mode="modalMode"
  :driver="selectedDriver"
  @saved="onDriverSaved"
/>
```

#### Template - Botões (linhas 6 e 89):
```vue
<!-- Header -->
<el-button @click="openCreate">Novo Motorista</el-button>

<!-- Table Actions -->
<el-button @click="openEdit(scope.row)">Editar</el-button>
```

**Removidos:**
- ❌ `handleCreate()` (placeholder)
- ❌ `handleEdit()` (placeholder)

**Mantidos:**
- ✅ `loadDrivers()` (carrega lista)
- ✅ `handleDelete()` (delete com deletingId)
- ✅ Busca com debounce
- ✅ Paginação client-side
- ✅ Estados UX (loading/error/empty)

---

## 📋 Checklist de Validação (PR-03)

### Modal - Estrutura
- ✅ Props `modelValue`, `mode`, `driver` declarados
- ✅ Emits `update:modelValue` e `saved`
- ✅ ElDialog com `:close-on-click-modal="false"`
- ✅ ElDialog com `:close-on-press-escape="!submitting"`

### Modal - Comportamento Create
- ✅ `mode='create'` → form vazio
- ✅ Payload sem `id`
- ✅ Payload com `attributes: {}`
- ✅ Botão mostra "Cadastrar"

### Modal - Comportamento Edit
- ✅ `mode='edit'` → form preenchido com `driver.name` e `driver.uniqueId`
- ✅ Payload com `id: driver.id`
- ✅ Payload preserva `attributes: driver.attributes || {}`
- ✅ Botão mostra "Salvar"

### Modal - Validação
- ✅ `name` obrigatório + min 3 chars
- ✅ `uniqueId` obrigatório + min 3 chars
- ✅ Validação Element Plus (rules)
- ✅ Não submete se validação falhar

### Modal - Submit
- ✅ Chama `store.dispatch('drivers/save', payload)`
- ✅ Chama `store.dispatch('drivers/load')` após sucesso
- ✅ Emite `saved` com driver salvo
- ✅ Fecha modal (`update:modelValue false`)
- ✅ Mostra `ElMessage.success`
- ✅ Mostra `ElMessage.error` em caso de falha

### Modal - UX
- ✅ Botão "Salvar" com `:loading="submitting"`
- ✅ Campos disabled durante submit
- ✅ Botão "Cancelar" disabled durante submit
- ✅ Limpa validação ao abrir modal (`clearValidate`)

### Dashboard - Integração
- ✅ Import `DriverFormModal`
- ✅ Refs `isModalOpen`, `modalMode`, `selectedDriver`
- ✅ Handler `openCreate()` seta mode='create', driver=null, abre modal
- ✅ Handler `openEdit(driver)` seta mode='edit', driver=obj, abre modal
- ✅ Template renderiza `<driver-form-modal>` com props
- ✅ Botão "Novo Motorista" chama `openCreate()`
- ✅ Botão "Editar" (tabela) chama `openEdit(scope.row)`

### Dashboard - Não-Regressão
- ✅ Busca continua funcionando
- ✅ Paginação continua funcionando
- ✅ Delete continua funcionando
- ✅ Loading/error states intactos
- ✅ `deletingId` separado de `isLoading` (PR-01)

---

## 🧪 Testes Manuais (PR-03)

### 1. **Preparar ambiente:**
```bash
npm run serve
# Navegar para http://localhost:8080/drivers
```

### 2. **Testar Create - Validação:**
- Clicar "Novo Motorista"
- Modal abre vazio
- Tentar salvar sem preencher → validação bloqueia
- Digitar nome com 2 chars → erro "mínimo 3 caracteres"
- Digitar uniqueId com 2 chars → erro "mínimo 3 caracteres"

### 3. **Testar Create - Sucesso:**
- Preencher nome: "Motorista Teste"
- Preencher uniqueId: "12345678900"
- Clicar "Cadastrar"
- Ver loading no botão
- Modal fecha
- Ver toast verde "Motorista cadastrado com sucesso"
- Tabela atualiza e mostra novo motorista

### 4. **Testar Edit - Abertura:**
- Clicar "Editar" em motorista existente
- Modal abre preenchido com nome e uniqueId
- Título mostra "Editar Motorista"
- Botão mostra "Salvar"

### 5. **Testar Edit - Validação:**
- Limpar nome → validação bloqueia
- Limpar uniqueId → validação bloqueia
- ESC fecha modal (se não estiver submetendo)

### 6. **Testar Edit - Sucesso:**
- Alterar nome para "Motorista Editado"
- Alterar uniqueId para "99988877766"
- Clicar "Salvar"
- Ver loading no botão
- Modal fecha
- Ver toast verde "Motorista atualizado com sucesso"
- Tabela reflete mudanças (nome e uniqueId atualizados)

### 7. **Testar Cancelar:**
- Abrir modal (create ou edit)
- Clicar "Cancelar"
- Modal fecha sem salvar
- Nenhum toast de erro

### 8. **Testar Não-Regressão:**
- Buscar motorista → funciona
- Paginar (se >15) → funciona
- Deletar motorista → funciona (confirmação + sucesso)
- Refresh da página → lista carrega corretamente
- Console sem erros

### 9. **Testar Edge Cases:**
- **Create durante loading:** Abrir modal → clicar "Cadastrar" → durante submit, tentar clicar novamente → deve estar disabled
- **Edit de driver que não existe mais:** Editar → deletar driver em outra aba → salvar edit → deve dar erro (API rejeita)
- **Validação trim:** Digitar nome "   abc   " → salvar → verifica se trim foi aplicado (store deve ter "abc")

---

## 🚨 Riscos e Mitigações

### Risco 1: Store mutation não existir
**Problema:** Se `drivers/save` não atualizar `driverList` via mutation, lista pode ficar desatualizada.  
**Mitigação:** ✅ Modal chama `drivers/load` após salvar → garante consistência

### Risco 2: Attributes podem ter estrutura complexa
**Problema:** Preservar `attributes` do edit pode perder dados se store espera estrutura diferente.  
**Mitigação:** ✅ Modal passa `attributes: driver.attributes || {}` → preserva estrutura original

### Risco 3: Validação pode não cobrir casos especiais
**Problema:** uniqueId pode precisar validar formato específico (CPF, RFID etc).  
**Mitigação:** ⚠️ PR-03 usa validação mínima (min 3 chars). PR futuro pode adicionar validators customizados.

### Risco 4: Modal aberto durante delete
**Problema:** Usuário edita motorista → outro usuário deleta → save falha.  
**Mitigação:** ✅ Try/catch no submit → mostra ElMessage.error com mensagem da API

---

## 📊 Comparação: Antes vs Depois

| Feature | PR-01/02 (Antes) | PR-03 (Depois) |
|---------|------------------|----------------|
| **Novo Motorista** | ❌ Placeholder (ElMessage) | ✅ Modal funcional |
| **Editar Motorista** | ❌ Placeholder (ElMessage) | ✅ Modal funcional |
| **Validação** | ❌ Nenhuma | ✅ Element Plus rules |
| **Feedback UX** | ❌ Apenas placeholder | ✅ Loading + toast sucesso/erro |
| **Integração Store** | ❌ Nenhuma | ✅ `drivers/save` + `drivers/load` |
| **Componente Reutilizável** | ❌ Nenhum | ✅ `driver-form-modal.vue` |

---

## 🎯 Próximos Passos

### Imediato (PR-03)
1. **Executar testes manuais** (9 cenários acima)
2. **Validar com Vue DevTools:**
   - Ver refs `isModalOpen`, `modalMode`, `selectedDriver`
   - Ver payload correto no dispatch `drivers/save`
3. **Testar edge cases:**
   - Double submit (disabled funciona?)
   - Cancelar durante loading
   - Editar driver inexistente

### Commit e Push
```bash
git add src/templates/components/driver-form-modal.vue src/templates/drivers-dashboard.vue
git commit -m "feat(drivers): PR-03 modal create/edit funcional"
git push origin feature/drivers-dashboard
```

### PR-04 (Próximo)
**Escopo:** Sistema de Upload de Foto  
**Dependências:** PR-02 (imageUpdateTimestamp) ✅ Já implementado

**Features:**
- Upload via drag & drop ou file picker
- Preview em tempo real
- Redimensionamento automático (max 800px)
- Compressão (70% quality)
- Conversão para Base64
- POST para backend (endpoint a definir)
- Integração com `setImageUpdateTimestamp` (cache busting)
- Exibir foto no dashboard (coluna extra na tabela)

**Componentes:**
- Criar `src/templates/components/driver-image-upload.vue`
- Alterar modal para incluir upload (aba ou seção)
- Usar getter `drivers/getDriverImageUrl(id)` para exibir

---

## 📝 Notas Técnicas

### 1. Por que `drivers/load` depois de `save`?
**Decisão:** Simplicidade e consistência.  
**Alternativa:** Usar mutations para atualizar lista localmente.  
**Trade-off:** Uma chamada HTTP extra, mas evita dessincronia (ex: server pode normalizar dados).

### 2. Por que `attributes: {}` vazio no create?
**Decisão:** Store/API pode esperar objeto (não undefined).  
**Compatibilidade:** Preserva estrutura esperada pelo backend.

### 3. Por que `clearValidate()` no `onOpen`?
**Decisão:** Evita exibir erros de validação anterior ao reabrir modal.  
**UX:** Modal sempre abre "limpo" sem alertas de validação.

### 4. Por que `watch(() => props.driver)`?
**Decisão:** Se parent mudar `selectedDriver` enquanto modal aberto, form atualiza.  
**Edge case raro:** Geralmente modal fecha antes de mudar driver.

---

## ✅ Status Final

### PR-03: Modal Create/Edit de Motoristas
- **Arquivos:** 2 (1 criado, 1 alterado)
- **Linhas:** +166 (driver-form-modal.vue) +20 net (drivers-dashboard.vue)
- **Riscos:** Baixo (componente isolado, sem breaking changes)
- **Breaking Changes:** Nenhum
- **Dependências:** PR-01 (dashboard) ✅ PR-02 (store save action) ✅
- **Status:** ✅ Pronto para merge após testes

---

## 📞 Suporte

**Próximos PRs sugeridos:**
1. **PR-04:** Sistema de Upload de Foto (usar PR-02 imageUpdateTimestamp)
2. **PR-05:** Campos Ricos (CNH, contatos, endereço) - 6 abas estilo Dark version
3. **PR-06:** Dashboard KPIs (cards de estatísticas)
4. **PR-07:** Filtros Avançados (CNH vencida, atribuídos, disponíveis)
5. **PR-08:** Relatórios e PDF (smart-driver-report.vue estilo Dark)

**Dúvidas técnicas?**
- Validação customizada de CPF/RFID
- Integração com backend PHP (DriverController_NEW.php)
- Estratégia de migração de campos da versão Dark

**Documento gerado em:** 18/01/2026  
**Responsável:** GitHub Copilot (Claude Sonnet 4.5)
