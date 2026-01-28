# 🚀 MITAPP REBRANDING & REFATORAÇÃO COMPLETA

**PROMPT PARA COPIAR/COLAR NO COPILOT/CLAUDE/CHATGPT**

---

## 🎯 CONTEXTO

Você é um **engenheiro sênior Vue 3** (Composition API com `<script setup>`) + **Vuex** + **Element Plus**, especializado em:
- Refatoração segura e incremental
- Design Systems e tokens CSS
- UI/UX moderna e acessível  
- White-label e multi-tenancy
- Performance e manutenibilidade

### 📌 SITUAÇÃO ATUAL

Tenho uma aplicação Vue 3 (rastreamento GPS) que precisa de **rebranding completo** após separação societária:

**Produto atual**: Tarkan (paths `/tarkan/...`, logo `/tarkan/assets/...`)  
**Novo produto**: **MITAPP** (identidade própria + white-label)

**Problemas principais**:
1. **God Component**: App.vue faz tudo (layout, modais, mapa, tema, menu)
2. **Sem Design System**: cores hardcoded, gradientes aleatórios (nth-child)
3. **Dark mode incompleto**: toggle existe mas não aplica no body + não persiste
4. **Sem tokens**: Element Plus não respeita tema customizado
5. **Código duplicado**: lógica de branding, layout, tema espalhada

**Objetivo**: Transformar em plataforma **enterprise-ready** com:
- ✅ Identidade MITAPP (nova paleta, tipografia, componentes)
- ✅ Dark mode funcional (body class + localStorage + Element Plus tokens)
- ✅ White-label pronto (window.CONFIG sobrescreve branding)
- ✅ Código organizado (composables, CSS modular, tokens)
- ✅ UX moderna (acessibilidade, responsividade real, loading states)

---

## ⚠️ REGRAS CRÍTICAS

### ✅ PODE FAZER
- Extrair código para composables e arquivos CSS
- Criar Design System (tokens.css + theme.css)
- Melhorar UX e acessibilidade
- Unificar estilos e remover hardcodes
- Adicionar validações e error boundaries

### ❌ NÃO PODE FAZER
- Remover funcionalidades ou rotas existentes
- Mudar comportamentos críticos (menu, mapa, modais, comandos)
- Reescrever componentes inteiros (refatorar, não reescrever)
- Quebrar compatibilidade mobile/portrait
- Remover suporte iOS safe-area
- Alterar comunicação com backend Traccar

### 🎯 METODOLOGIA
- **Refatoração segura**: passos pequenos, PR-friendly
- **Backward compatible**: funcionalidades existentes continuam funcionando
- **Progressive enhancement**: melhorar sem quebrar
- **Código pronto**: entregar arquivos completos, não pseudo-código

---

## 📋 TAREFAS (ENTREGAR NESSA ORDEM)

### **A) DIAGNÓSTICO (análise sem código)**

Liste:
1. **Problemas estruturais** encontrados no App.vue (acoplamento, responsabilidades, hardcodes)
2. **Riscos** de quebra (funcionalidades críticas que NÃO mexer)
3. **Oportunidades** de melhoria rápida (quick wins)
4. **Estratégia** de refatoração (ordem de execução, dependências)

---

### **B) DARK MODE 100% FUNCIONAL** ⚡ PRIORIDADE #1

**Problema**: O toggle dark mode existe mas não:
- Aplica classe no `<body>`
- Persiste no localStorage
- Sincroniza com Element Plus

**Solução**:

#### 1. Completar o módulo `store/modules/ui.js`

Já existe, mas precisa garantir que a mutation `setDarkMode`:
```javascript
setDarkMode(state, isDark) {
  state.darkMode = isDark;
  
  // ✅ Persistência
  localStorage.setItem('darkMode', JSON.stringify(isDark));
  
  // ✅ Aplicar no body
  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}
```

#### 2. Adicionar watcher global no App.vue

No `<script setup>`:
```javascript
import { watch } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// ✅ Dark mode reativo
const isDarkMode = computed(() => store.state.ui?.darkMode ?? false);

// ✅ Watch que aplica no body
watch(isDarkMode, (isDark) => {
  document.body.classList.toggle('dark-mode', isDark);
}, { immediate: true });

// ✅ Inicializar no onMounted
onMounted(() => {
  store.dispatch('ui/initDarkMode');
});

// ✅ Toggle function
const toggleDarkMode = () => {
  store.dispatch('ui/toggleDarkMode');
};
```

#### 3. Garantir Element Plus respeita o tema

No arquivo de tokens (`tokens.css`), mapear:
```css
:root {
  --el-bg-color: var(--brand-bg);
  --el-text-color-primary: var(--brand-text);
  /* ... etc */
}

body.dark-mode {
  --el-bg-color: #1A1A1A;
  --el-text-color-primary: #E0E0E0;
  /* ... etc */
}
```

**Entrega**: Arquivo completo do `store/modules/ui.js` + trecho do App.vue com watch + tokens CSS

---

### **C) DESIGN SYSTEM MITAPP** 🎨

#### Criar arquivos CSS modulares:

**1. `src/styles/tokens.css`**
- Cores: `--brand-primary`, `--brand-success`, `--brand-danger`, `--brand-warning`, `--brand-info`
- Surfaces: `--brand-bg`, `--brand-surface`, `--brand-surface-elevated`, `--brand-surface-modal`
- Text: `--brand-text`, `--brand-text-secondary`, `--brand-text-muted`, `--brand-text-disabled`
- Borders: `--brand-border`, `--brand-border-light`, `--brand-border-lighter`
- Layout: `--brand-header-bg`, `--brand-menu-bg`, `--brand-panel-bg`
- Shadows: `--brand-shadow-sm`, `--brand-shadow-md`, `--brand-shadow-lg`
- Radius: `--brand-radius-sm`, `--brand-radius-md`, `--brand-radius-lg`
- Spacing: `--brand-space-xs/sm/md/lg/xl` (escala 8px)
- Typography: `--brand-font-family`, `--brand-font-size-*`, `--brand-font-weight-*`
- Gradientes controlados: `--brand-gradient-1` a `--brand-gradient-6` (substituir nth-child)

**2. `src/styles/theme.css`**
- Importa tokens
- Aplica `:root` (light mode)
- Aplica `body.dark-mode` (dark mode)
- Mapeia para Element Plus (`--el-*`)
- Remove hardcodes de cores

**3. Importar no `main.js` ou `App.vue`**:
```javascript
import '@/styles/tokens.css';
import '@/styles/theme.css';
```

**Entrega**: Arquivos completos `tokens.css` e `theme.css` prontos para usar

---

### **D) REFATORAÇÃO SEGURA DO APP.VUE**

Extrair para **composables** (sem alterar template):

#### 1. `src/composables/useTheme.js`
```javascript
export function useTheme() {
  const store = useStore();
  
  const isDarkMode = computed(() => store.state.ui?.darkMode ?? false);
  
  const toggleDarkMode = () => {
    store.dispatch('ui/toggleDarkMode');
  };
  
  const syncPrimaryColor = () => {
    // lógica existente de getComputedStyle
  };
  
  // ✅ Watch que aplica body.dark-mode
  watch(isDarkMode, (isDark) => {
    document.body.classList.toggle('dark-mode', isDark);
  }, { immediate: true });
  
  onMounted(() => {
    store.dispatch('ui/initDarkMode');
    syncPrimaryColor();
  });
  
  return {
    isDarkMode,
    toggleDarkMode,
    syncPrimaryColor,
  };
}
```

#### 2. `src/composables/useBranding.js`
```javascript
export function useBranding() {
  const store = useStore();
  
  const runtimeConfig = ref({});
  const refreshRuntimeConfig = () => {
    // lógica existente
  };
  
  const labelConf = computed(() => {
    // prioriza runtimeConfig sobre store
  });
  
  const headLogo = computed(() => labelConf.value?.headLogo || {});
  
  const whatsappNumber = computed(() => {
    // sanitiza + adiciona DDI 55
  });
  
  return {
    runtimeConfig,
    labelConf,
    headLogo,
    whatsappNumber,
    refreshRuntimeConfig,
  };
}
```

#### 3. `src/composables/useResponsiveLayout.js`
```javascript
export function useResponsiveLayout() {
  const portrait = ref(false);
  const menuShown = ref(false);
  const sidebarClosed = ref(false);
  
  const computePortrait = () => {
    // lógica existente de matchMedia
  };
  
  const toggleMenu = () => {
    menuShown.value = !menuShown.value;
  };
  
  const effectiveMenuOpen = computed(() => {
    return portrait.value ? menuShown.value : !sidebarClosed.value;
  });
  
  const shouldShowHamburger = computed(() => {
    return portrait.value || sidebarClosed.value;
  });
  
  onMounted(() => {
    computePortrait();
    window.addEventListener('resize', computePortrait);
  });
  
  onBeforeUnmount(() => {
    window.removeEventListener('resize', computePortrait);
  });
  
  return {
    portrait,
    menuShown,
    sidebarClosed,
    effectiveMenuOpen,
    shouldShowHamburger,
    toggleMenu,
  };
}
```

**No App.vue**, substituir código inline por:
```javascript
import { useTheme } from '@/composables/useTheme';
import { useBranding } from '@/composables/useBranding';
import { useResponsiveLayout } from '@/composables/useResponsiveLayout';

const { isDarkMode, toggleDarkMode } = useTheme();
const { headLogo, whatsappNumber } = useBranding();
const { portrait, menuShown, toggleMenu, shouldShowHamburger } = useResponsiveLayout();
```

**Entrega**: 3 arquivos de composables completos + diff do App.vue

---

### **E) AJUSTES DO EDIT-USERS.VUE** 📝

**Objetivo**: Modal enterprise com tokens, dark mode, acessibilidade

#### 1. Dialog responsivo real
```vue
<el-dialog
  v-model="visible"
  :width="portrait ? '95vw' : '850px'"
  :close-on-click-modal="false"
  :close-on-press-escape="true"
  @opened="handleOpened"
  @closed="handleClosed"
  class="edit-users-dialog"
>
```

#### 2. Usar tokens (remover hardcodes)
```css
<style scoped>
.edit-users-dialog {
  background: var(--brand-surface-modal);
  color: var(--brand-text);
}

.stat-card {
  background: var(--brand-surface);
  border: 1px solid var(--brand-border);
  border-radius: var(--brand-radius-md);
  box-shadow: var(--brand-shadow-sm);
  color: var(--brand-text);
}

.stat-card:hover {
  background: var(--brand-surface-elevated);
  box-shadow: var(--brand-shadow-md);
}

/* Cores primárias via tokens */
.stat-card--primary {
  border-left: 3px solid var(--brand-primary);
}

/* Dark mode automático (herda do body.dark-mode) */
body.dark-mode .edit-users-dialog {
  background: var(--brand-surface-modal);
}
```

#### 3. Acessibilidade
```javascript
const handleOpened = () => {
  // ✅ Foco automático no campo de busca
  nextTick(() => {
    searchInputRef.value?.focus();
  });
};

const handleClosed = () => {
  // ✅ Devolver foco para elemento que abriu
  if (returnFocusElement.value) {
    returnFocusElement.value.focus();
  }
};
```

#### 4. Loading states
```vue
<template>
  <div v-if="loading" class="skeleton-loader">
    <el-skeleton :rows="5" animated />
  </div>
  
  <div v-else-if="error" class="error-state">
    <i class="fas fa-exclamation-triangle"></i>
    <p>{{ error }}</p>
    <el-button @click="retry">Tentar novamente</el-button>
  </div>
  
  <div v-else-if="!users.length" class="empty-state">
    <i class="fas fa-inbox"></i>
    <p>{{ KT('user.noResults') || 'Nenhum usuário encontrado' }}</p>
  </div>
  
  <el-table v-else ...>
    <!-- tabela -->
  </el-table>
</template>
```

#### 5. Tabela com densidade
```vue
<el-table
  :data="paginatedUsers"
  size="default"
  :max-height="portrait ? '60vh' : '500px'"
  stripe
  highlight-current-row
  :header-cell-style="{ background: 'var(--brand-surface-elevated)' }"
>
```

**Entrega**: Diff do edit-users.vue com:
- Classes e tokens
- Acessibilidade (foco)
- Loading/error/empty states
- Dark mode automático

---

### **F) CHECKLIST FINAL** ✅

Criar checklist de testes manuais:

#### Desktop (Chrome/Edge)
- [ ] Abrir app → tema light carrega corretamente
- [ ] Clicar toggle dark mode → aplica instantaneamente
- [ ] Recarregar página → dark mode persiste
- [ ] Abrir edit-users modal → cores/tokens corretos
- [ ] Abrir outras modais → Element Plus respeita tema
- [ ] Menu lateral → gradientes controlados (não aleatórios)
- [ ] Mapa → invalidate funciona, markers visíveis
- [ ] Comandos → não quebraram

#### Mobile (Safari iOS / Chrome Android)
- [ ] Layout responsivo funciona
- [ ] Menu overlay abre/fecha com hamburger
- [ ] Safe-area iOS respeitada
- [ ] Edit-users modal: 95vw, scroll interno
- [ ] Dark mode funciona
- [ ] Tabela rolável horizontalmente

#### Acessibilidade
- [ ] Tab navigation funciona
- [ ] Esc fecha modais
- [ ] Foco retorna após fechar modal
- [ ] Screen reader consegue navegar

#### Performance
- [ ] Hot reload < 3s
- [ ] Build production sem erros
- [ ] Lighthouse score > 90
- [ ] Sem console errors

---

## 📦 ESTRUTURA DE ENTREGA

Para cada tarefa, entregar:

### 1. Arquivo completo (se novo)
```
📁 src/styles/tokens.css
📁 src/styles/theme.css
📁 src/composables/useTheme.js
📁 src/composables/useBranding.js
📁 src/composables/useResponsiveLayout.js
```

### 2. Diff (se modificação)
```diff
// src/App.vue (linha X-Y)
- const isDarkMode = ref(false);
+ const { isDarkMode, toggleDarkMode } = useTheme();
```

### 3. Instruções de integração
```bash
# 1. Criar arquivos CSS
# 2. Importar no main.js
import '@/styles/tokens.css';
import '@/styles/theme.css';

# 3. Criar composables
# 4. Modificar App.vue
# 5. Testar checklist
```

---

## 🎨 PALETA DE CORES MITAPP (SUGESTÃO)

**Primary**: `#409EFF` (azul Element Plus padrão, pode mudar)  
**Success**: `#67C23A`  
**Warning**: `#E6A23C`  
**Danger**: `#F56C6C`  
**Info**: `#909399`

**Light Mode**:
- Background: `#FFFFFF`
- Surface: `#FAFAFA`
- Text: `#222222`
- Border: `#DCDFE6`

**Dark Mode**:
- Background: `#1A1A1A`
- Surface: `#2A2A2A`
- Text: `#E0E0E0`
- Border: `#444444`

---

## 🚨 ATENÇÃO ESPECIAL

### White-label via window.CONFIG

Garantir que tokens possam ser sobrescritos:

```javascript
// main.js ou App.vue
if (window.CONFIG?.branding) {
  document.documentElement.style.setProperty('--brand-primary', window.CONFIG.branding.primary);
  document.documentElement.style.setProperty('--brand-logo', `url(${window.CONFIG.branding.logo})`);
  // ... outros overrides
}
```

### Gradientes do menu (nth-child → tokens)

**Antes** (ruim):
```css
.menu-item:nth-child(1) { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.menu-item:nth-child(2) { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
/* etc */
```

**Depois** (bom):
```vue
<template>
  <div 
    v-for="(item, index) in menuItems" 
    :key="item.id"
    :style="{ background: `var(--brand-gradient-${(index % 6) + 1})` }"
    class="menu-item"
  >
```

---

## 📝 RESUMO EXECUTIVO

**O que vamos fazer**:
1. ✅ Dark mode 100% funcional (body class + localStorage + Element Plus)
2. ✅ Design System MITAPP (tokens.css + theme.css)
3. ✅ Composables para organizar código (useTheme, useBranding, useResponsiveLayout)
4. ✅ Edit-users enterprise (tokens, acessibilidade, loading states)
5. ✅ White-label pronto (window.CONFIG)
6. ✅ Checklist de testes

**O que NÃO vamos fazer**:
- ❌ Reescrever componentes inteiros
- ❌ Mudar rotas ou comportamentos críticos
- ❌ Quebrar mobile/portrait
- ❌ Remover funcionalidades

**Resultado esperado**:
- 🎨 Identidade MITAPP profissional
- 🌓 Dark mode que realmente funciona
- 🧩 Código organizado e manutenível
- ♿ Acessibilidade e UX moderna
- 🏷️ White-label pronto para clientes

---

## 🤖 INSTRUÇÕES PARA A IA

1. **Leia TODO o contexto** antes de começar
2. **Siga a ordem** das tarefas (A → B → C → D → E → F)
3. **Entregue código completo**, não pseudo-código
4. **Teste mentalmente** antes de entregar (vai quebrar algo?)
5. **Seja conservador**: se não tem certeza, pergunte
6. **Documente decisões**: por que escolheu X em vez de Y
7. **Priorize**: dark mode > tokens > composables > refinamentos

**Qualidade esperada**: 🟢 ENTERPRISE LEVEL (código de produção, não POC)

---

**COMECE PELA TAREFA A (DIAGNÓSTICO)**

Analise o contexto e liste problemas/riscos/oportunidades antes de propor código.
