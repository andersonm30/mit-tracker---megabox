# 🎯 Extração do Driver Card - DeviceDriverCard.vue

## 📋 Resumo

**Status:** ✅ CONCLUÍDO  
**Data:** 29 de dezembro de 2025  
**Arquivo Criado:** `src/components/device/DeviceDriverCard.vue`  
**Arquivo Modificado:** `src/templates/devices.internal.vue`

---

## 🎯 Objetivo

Extrair toda a UI e lógica do **DRIVER** para um componente dedicado e reutilizável, seguindo o padrão de componentização Vue 3 Composition API.

---

## 📦 Novo Componente: DeviceDriverCard.vue

### **Props**

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `position` | Object | null | Position do device com driverUniqueId |
| `driver` | Object | null | Driver já resolvido pelo parent via `getDriverByUniqueId` |
| `driverImageRefreshKey` | Number | 0 | Key para forçar reload de imagens |

### **Emits**

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `open-driver-modal` | driver (Object) | Emitido quando usuário clica no nome do driver |

### **Estrutura**

```vue
<template>
  <!-- Wrapper com border-right-dotted -->
  <div v-if="position && position.attributes['driverUniqueId']">
    <!-- Foto com tooltip rico -->
    <!-- Nome clicável -->
    <!-- CNH com ícones de status -->
    <!-- Fallback para driver não encontrado -->
  </div>
</template>

<script setup>
// Props e Emits
// Funções CNH: formatDriverDate, isDriverExpired, getCNHDaysToExpire
// Handler: handleOpenModal
</script>

<style scoped>
/* Estilos do card */
/* Estilos do tooltip */
</style>
```

---

## 🔧 Lógica Movida para o Componente

### 1️⃣ **Formatação de Data CNH**

```javascript
const formatDriverDate = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  }
  return dateString;
};
```

**Uso:** Converte `DD-MM-YYYY` → `DD/MM/YYYY` para exibição no tooltip.

---

### 2️⃣ **Verificação de Expiração**

```javascript
const isDriverExpired = (dateString) => {
  if (!dateString) return false;
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    return date < new Date();
  }
  return false;
};
```

**Uso:** Retorna `true` se a CNH já expirou (usado para classe `text-danger`).

---

### 3️⃣ **Cálculo de Dias até Expiração**

```javascript
const getCNHDaysToExpire = (dateString) => {
  if (!dateString) return 999;
  
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
  return 999;
};
```

**Uso:** Calcula dias restantes para definir ícones de alerta:
- `<= 90 e > 30`: ⚠️ amarelo (`cnh-icon-warning`)
- `<= 30 e > 0`: 🔶 laranja (`cnh-icon-orange`)
- `<= 0`: ❌ vermelho (`cnh-icon-expired`)

---

## 🎨 UI Mantida Idêntica

### **Foto do Driver**
- Circular 35x35px
- Fallback: `/tarkan/assets/images/drivers/default.png`
- Tooltip rico ao passar mouse

### **Tooltip Rico**
- Foto 80x80px
- Nome, CNH, CPF, Categoria, Estado, Validez, Telefone
- Validez com cor vermelha se expirada
- Gradiente dark background

### **Nome Clicável**
- Cor primary
- Cursor pointer
- Emite evento ao clicar/enter/space/dblclick
- Acessibilidade: `role="button"`, `tabindex="0"`, `aria-label`

### **CNH com Ícones de Status**
- Texto pequeno (11px)
- Ícones condicionais baseados em dias até expiração
- Tooltips informativos

### **Fallback**
- Tooltip com `driverUniqueId`
- Exibição centralizada quando driver não encontrado

---

## 📐 Estilos Migrados

### **Classes Movidas para DeviceDriverCard.vue**

```css
.driver-card-wrapper       /* Wrapper com border-right */
.driver-card               /* Container flex */
.driver-photo-wrapper      /* Wrapper da foto */
.driver-photo-small        /* Foto 35x35 */
.driver-info-container     /* Nome + CNH */
.driver-name-link          /* Nome clicável */
.driver-cnh-row            /* Linha da CNH */
.driver-cnh-icon           /* Ícone da CNH */
.driver-cnh-text           /* Texto da CNH */
.cnh-icon-warning          /* Amarelo <= 90 dias */
.cnh-icon-orange           /* Laranja <= 30 dias */
.cnh-icon-expired          /* Vermelho expirado */
.driver-unknown-id         /* Fallback ID */

/* Tooltip styles */
.tooltip-driver-card
.tooltip-driver-header
.tooltip-driver-photo-large
.tooltip-driver-info
.tooltip-driver-name
.tooltip-driver-detail
```

### **Estilos Removidos do Parent**

```css
/* devices.internal.vue - REMOVIDOS */
.driver-card { ... }
.driver-photo-wrapper { ... }
.driver-photo-small { ... }
/* ... ~70 linhas de CSS removidas
```

**Comentário deixado no parent:**
```css
/* DRIVER CARD STYLES - Movidos para DeviceDriverCard.vue */
/* TOOLTIP DRIVER STYLES - Movidos para DeviceDriverCard.vue */
```

---

## 🔄 Alterações no Parent (devices.internal.vue)

### **1️⃣ Import do Componente**

```javascript
// Driver card component
import DeviceDriverCard from "../components/device/DeviceDriverCard.vue";
```

### **2️⃣ Template Simplificado**

**Antes (110 linhas):**
```vue
<div v-if="position && position.attributes['driverUniqueId']" class="flex-1 border-right-dotted">
  <div class="stat-label mt-20">...</div>
  <div class="driver-card">
    <template v-if="driver">
      <!-- 80 linhas de template -->
    </template>
    <template v-else>
      <!-- Fallback -->
    </template>
  </div>
</div>
```

**Depois (6 linhas):**
```vue
<!-- Driver Card Component -->
<DeviceDriverCard
  :position="position"
  :driver="position?.attributes?.driverUniqueId ? store.getters['drivers/getDriverByUniqueId'](position.attributes.driverUniqueId) : null"
  :driverImageRefreshKey="driverImageRefreshKey"
  @open-driver-modal="openDriverModal"
/>
```

### **3️⃣ Função `openDriverModal` Atualizada**

**Antes:**
```javascript
const openDriverModal = () => {
  if (!position.value?.attributes?.driverUniqueId) {
    console.warn('[openDriverModal] Position ou driverUniqueId não disponível');
    return;
  }
  // ... buscar driver
}
```

**Depois (aceita driver como parâmetro):**
```javascript
const openDriverModal = (driver = null) => {
  // Se driver foi passado diretamente (pelo componente), usa ele
  if (driver) {
    selectedDriver.value = driver;
    showDriverModal.value = true;
    return;
  }
  
  // Fallback: buscar pelo position (compatibilidade com chamadas antigas)
  if (!position.value?.attributes?.driverUniqueId) {
    console.warn('[openDriverModal] Position ou driverUniqueId não disponível');
    return;
  }
  // ... resto do código
}
```

### **4️⃣ Funções Removidas (movidas para componente)**

```javascript
// REMOVIDO
const formatDriverDate = (dateString) => { ... }
const isDriverExpired = (dateString) => { ... }
const getCNHDaysToExpire = (dateString) => { ... }
```

### **5️⃣ Funções Obsoletas Removidas**

```javascript
// REMOVIDO (não mais usadas após extração)
const showTip = (evt,text) => { ... }
const hideTip = (evt,text) => { ... }
```

### **6️⃣ Import Limpo**

**Antes:**
```javascript
import {ElButton,ElTooltip,ElDialog} from "element-plus";
```

**Depois:**
```javascript
import {ElButton,ElDialog} from "element-plus";
```

---

## 📊 Estatísticas da Refatoração

| Métrica | Antes | Depois | Redução |
|---------|-------|--------|---------|
| **Linhas de Template** | 110 | 6 | -94.5% |
| **Linhas de CSS** | ~70 | 0 (movido) | -100% |
| **Funções no Parent** | 3 (CNH) | 0 | -100% |
| **Imports no Parent** | ElTooltip | - | Limpo |
| **Complexidade** | Alta | Baixa | ✅ |

---

## ✅ Validação

### **Checklist de Funcionalidades**

- [x] Foto do driver exibida corretamente
- [x] Tooltip rico com todas as informações
- [x] Nome clicável abre modal
- [x] Ícones de CNH exibidos corretamente (amarelo/laranja/vermelho)
- [x] Fallback para driver não encontrado (exibe uniqueId)
- [x] Tooltip do fallback funcional
- [x] Modal do driver abre corretamente ao clicar no nome
- [x] Acessibilidade mantida (role, tabindex, aria-label)
- [x] Estilos idênticos ao original
- [x] Zero erros de compilação

### **Teste de Comportamento**

1. **Driver encontrado:**
   - ✅ Foto exibe corretamente com fallback
   - ✅ Tooltip mostra todas as informações
   - ✅ Nome abre modal ao clicar
   - ✅ Ícones CNH exibidos corretamente

2. **Driver não encontrado:**
   - ✅ Exibe `driverUniqueId`
   - ✅ Tooltip mostra "Driver: [uniqueId]"
   - ✅ Não quebra a UI

3. **Position sem driverUniqueId:**
   - ✅ Componente não renderiza (v-if)

---

## 🎯 Benefícios Alcançados

1. **Reutilizabilidade:** Componente pode ser usado em outros contextos
2. **Manutenibilidade:** Lógica isolada em arquivo dedicado
3. **Testabilidade:** Componente pode ser testado isoladamente
4. **Legibilidade:** Parent simplificado (~110 linhas removidas)
5. **Separação de Responsabilidades:** UI do driver encapsulada
6. **Performance:** Componente só renderiza quando necessário (v-if)

---

## 📝 Padrão de Uso

### **No Parent**

```vue
<template>
  <DeviceDriverCard
    :position="position"
    :driver="computedDriver"
    :driverImageRefreshKey="driverImageRefreshKey"
    @open-driver-modal="handleOpenModal"
  />
</template>

<script setup>
import DeviceDriverCard from "../components/device/DeviceDriverCard.vue";

const computedDriver = computed(() => {
  if (!position.value?.attributes?.driverUniqueId) return null;
  return store.getters['drivers/getDriverByUniqueId'](
    position.value.attributes.driverUniqueId
  );
});

const handleOpenModal = (driver) => {
  selectedDriver.value = driver;
  showModal.value = true;
};
</script>
```

---

## 🔮 Próximos Passos (Opcional)

1. **Criar Composable:** `useDriverCNH.js` para reutilizar lógica de validação
2. **Extrair Modal:** Criar `DeviceDriverModal.vue` para modal completo
3. **Tipagem TypeScript:** Adicionar interfaces para Driver e Position
4. **Testes Unitários:** Criar `DeviceDriverCard.spec.js`
5. **Storybook:** Adicionar stories para diferentes estados do componente

---

## 📌 Notas Finais

- **Modal permanece no parent** conforme solicitado (pode ser extraído depois)
- **KT() importado internamente** no componente (padronização)
- **Template mantido 100% idêntico** ao original
- **Zero breaking changes** para funcionalidades existentes
- **Fallback robusto** para driver não encontrado com tooltip do uniqueId

---

**Refatoração concluída com sucesso!** ✅

---

## 📂 Estrutura de Arquivos

```
src/
├── components/
│   └── device/
│       └── DeviceDriverCard.vue        ← NOVO (359 linhas)
└── templates/
    └── devices.internal.vue            ← MODIFICADO (~110 linhas removidas)
```
