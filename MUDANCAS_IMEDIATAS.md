# ⚡ MITAPP - 2 MUDANÇAS IMEDIATAS

**Aplicar AGORA** (antes de usar o prompt completo)

---

## 🔴 MUDANÇA #1: DARK MODE REAL NO BODY

### **Problema**
O toggle dark mode existe (`store.dispatch('ui/toggleDarkMode')`), mas:
- ❌ Não aplica classe `dark-mode` no `<body>`
- ❌ Não persiste no localStorage
- ❌ Reload perde a preferência

### **Solução**

#### 1️⃣ Completar `store/modules/ui.js`

**Arquivo**: `src/store/modules/ui.js`

```javascript
/**
 * UI MODULE
 * ========================================
 * Gerencia estado global de UI (dark mode, theme preferences, etc.)
 */

export default {
  namespaced: true,

  state: {
    darkMode: false,
  },

  mutations: {
    setDarkMode(state, isDark) {
      state.darkMode = isDark;
      
      // ✅ NOVO: Persistência
      try {
        localStorage.setItem('darkMode', JSON.stringify(isDark));
      } catch (e) {
        console.warn('⚠️ Não foi possível salvar dark mode:', e);
      }
      
      // ✅ NOVO: Aplicar classe no body
      if (isDark) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    },
  },

  actions: {
    initDarkMode({ commit }) {
      // ✅ NOVO: Carregar do localStorage
      try {
        const saved = localStorage.getItem('darkMode');
        const isDark = saved ? JSON.parse(saved) : false;
        commit('setDarkMode', isDark);
      } catch (e) {
        console.warn('⚠️ Erro ao carregar dark mode:', e);
        commit('setDarkMode', false);
      }
    },

    toggleDarkMode({ state, commit }) {
      commit('setDarkMode', !state.darkMode);
    },
  },

  getters: {
    isDarkMode: (state) => state.darkMode,
  },
};
```

#### 2️⃣ Adicionar watcher no `App.vue`

**Arquivo**: `src/App.vue`

**Localização**: Dentro do `<script setup>`, após imports

```javascript
import { watch, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

/* ===========================
 *  DARK MODE GLOBAL
 * =========================== */
const isDarkMode = computed(() => store.state.ui?.darkMode ?? false);

// ✅ NOVO: Watch que aplica classe no body
watch(isDarkMode, (isDark) => {
  document.body.classList.toggle('dark-mode', isDark);
}, { immediate: true });

const toggleDarkMode = () => {
  store.dispatch('ui/toggleDarkMode');
};

// ✅ NOVO: Inicializar dark mode no mount
onMounted(() => {
  store.dispatch('ui/initDarkMode');
  
  // ... resto do onMounted existente
});
```

#### 3️⃣ Toggle no header (se ainda não existir)

**Arquivo**: `src/App.vue`

**Localização**: Template do header, após o botão de mute

```vue
<template>
  <div id="head">
    <!-- ... logo, hamburger ... -->
    
    <div style="display: flex;">
      <!-- Mute button (existente) -->
      <el-tooltip :content="(store.state.events.mute) ? 'Ouvir Notificações' : 'Silenciar Notificações'">
        <div id="mute" @click="store.dispatch('events/toggleMute')" ...>
          <!-- ... ícone mute ... -->
        </div>
      </el-tooltip>

      <!-- ✅ NOVO: Dark Mode Toggle -->
      <el-tooltip :content="isDarkMode ? 'Modo Claro' : 'Modo Escuro'">
        <div 
          @click="toggleDarkMode" 
          style="cursor: pointer; font-size: 1.2rem; margin: 0.3rem 0.5rem;"
          aria-label="Alternar tema claro/escuro"
        >
          <i v-if="isDarkMode" class="fas fa-sun" aria-hidden="true"></i>
          <i v-else class="fas fa-moon" aria-hidden="true"></i>
        </div>
      </el-tooltip>

      <!-- ... push notification, user menu ... -->
    </div>
  </div>
</template>
```

### **Teste**
```bash
# 1. Abrir http://localhost:8083
# 2. Clicar no ícone lua/sol
# 3. Verificar: body tem classe "dark-mode"
# 4. Recarregar página
# 5. Verificar: dark mode persistiu
# 6. Abrir DevTools → Application → Local Storage
# 7. Verificar: key "darkMode" = true/false
```

---

## 🟡 MUDANÇA #2: TOKENS NO MODAL CUSTOM

### **Problema**
Modais customizados (fora do Element Plus) têm cores hardcoded:
```css
.modal-content {
  background: rgba(255, 255, 255, 0.96); /* ❌ hardcode */
  color: #222; /* ❌ hardcode */
}
```

No dark mode isso não muda, fica branco sempre.

### **Solução**

#### 1️⃣ Substituir hardcodes por tokens

**Arquivo**: Qualquer arquivo CSS com modais customizados (ex: `App.vue`, `modal.css`)

**Buscar e substituir**:

```css
/* ❌ ANTES (hardcode) */
.modal-content {
  background: rgba(255, 255, 255, 0.96);
  color: #222;
  border: 1px solid #ddd;
}

/* ✅ DEPOIS (tokens) */
.modal-content {
  background: var(--brand-surface-modal);
  color: var(--brand-text);
  border: 1px solid var(--brand-border);
}
```

#### 2️⃣ Outros componentes comuns

```css
/* ===== HEADERS ===== */
/* ❌ ANTES */
.modal-header {
  background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
  color: white;
}

/* ✅ DEPOIS */
.modal-header {
  background: var(--brand-primary);
  color: white;
}

/* ===== TOOLBARS ===== */
/* ❌ ANTES */
.toolbar {
  background: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

/* ✅ DEPOIS */
.toolbar {
  background: var(--brand-surface);
  border-bottom: 1px solid var(--brand-border);
}

/* ===== CARDS ===== */
/* ❌ ANTES */
.card {
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-radius: 8px;
}

/* ✅ DEPOIS */
.card {
  background: var(--brand-surface);
  box-shadow: var(--brand-shadow-sm);
  border-radius: var(--brand-radius-md);
}

/* ===== TEXTO ===== */
/* ❌ ANTES */
.text-primary { color: #222; }
.text-secondary { color: #606266; }
.text-muted { color: #909399; }

/* ✅ DEPOIS */
.text-primary { color: var(--brand-text); }
.text-secondary { color: var(--brand-text-secondary); }
.text-muted { color: var(--brand-text-muted); }
```

#### 3️⃣ Dark mode automático

Depois de usar tokens, o dark mode funciona automaticamente:

```css
/* NÃO PRECISA FAZER ISSO: */
body.dark-mode .modal-content {
  background: rgba(42, 42, 42, 0.96); /* ❌ duplicação */
}

/* OS TOKENS JÁ MUDAM AUTOMATICAMENTE: */
body.dark-mode {
  --brand-surface-modal: rgba(42, 42, 42, 0.96); /* ✅ definido em tokens.css */
}

/* Então .modal-content herda o novo valor: */
.modal-content {
  background: var(--brand-surface-modal); /* ✅ muda sozinho */
}
```

### **Teste**
```bash
# 1. Importar tokens.css (se ainda não fez)
# 2. Substituir hardcodes por var(--brand-*)
# 3. Salvar arquivo
# 4. Abrir modal no light mode → verificar cores
# 5. Alternar para dark mode → verificar cores mudaram
# 6. Não deve ter cores "presas" (branco no dark)
```

---

## 🛠️ IMPLEMENTAÇÃO PASSO A PASSO

### **Passo 1**: Criar `tokens.css` (se ainda não existe)
```bash
# Copiar o arquivo tokens.css fornecido para:
src/styles/tokens.css
```

### **Passo 2**: Importar no `main.js`
```javascript
// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import store from './store';
import router from './routes';

// ✅ NOVO: Importar tokens
import '@/styles/tokens.css';

const app = createApp(App);
app.use(store);
app.use(router);
app.mount('#app');
```

### **Passo 3**: Completar `store/modules/ui.js`
```bash
# Substituir o arquivo inteiro pelo código acima
# (versão com localStorage + body class)
```

### **Passo 4**: Registrar módulo `ui` no store (se ainda não está)
```javascript
// src/store/index.js
import ui from './modules/ui';

export default createStore({
  modules: {
    // ... outros módulos
    ui, // ✅ Adicionar
  },
});
```

### **Passo 5**: Adicionar watcher no `App.vue`
```javascript
// Copiar código do watch(isDarkMode, ...) acima
```

### **Passo 6**: Substituir hardcodes por tokens
```bash
# Buscar em todos os arquivos .vue e .css:
# - rgba(255, 255, 255, ...) → var(--brand-bg)
# - #222, #333 → var(--brand-text)
# - #ddd, #e4e7ed → var(--brand-border)
# - linear-gradient(...) → var(--brand-gradient-X)
```

### **Passo 7**: Testar
```bash
npm run serve
# Abrir localhost:8083
# Clicar no ícone lua/sol
# Verificar tudo muda
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Dark Mode
- [ ] `store/modules/ui.js` criado
- [ ] `ui` registrado em `store/index.js`
- [ ] `watch(isDarkMode, ...)` no App.vue
- [ ] `onMounted(() => store.dispatch('ui/initDarkMode'))` no App.vue
- [ ] Toggle no header (lua/sol)
- [ ] Classe `body.dark-mode` aplicada ao clicar
- [ ] localStorage salva preferência
- [ ] Reload mantém dark mode

### Tokens
- [ ] `tokens.css` criado
- [ ] `tokens.css` importado no `main.js`
- [ ] Hardcodes substituídos por `var(--brand-*)`
- [ ] Modais customizados usam `var(--brand-surface-modal)`
- [ ] Texto usa `var(--brand-text)`
- [ ] Bordas usam `var(--brand-border)`
- [ ] Dark mode muda cores automaticamente

---

## 🚀 DEPOIS DE APLICAR

Após implementar essas 2 mudanças:

1. **Use o prompt completo** (`MITAPP_REBRANDING_PROMPT.md`)
2. Cole no Copilot/Claude e peça pra executar **TAREFA C** (Design System)
3. A IA vai entregar composables e refinamentos
4. Siga o plano do `MITAPP_IMPLEMENTACAO.md`

---

## 🎯 RESULTADO ESPERADO

**Antes**:
```bash
# Clicar dark mode → nada acontece
# Reload → perde preferência
# Modal branco mesmo no dark mode
```

**Depois**:
```bash
# Clicar dark mode → body.dark-mode aplicado instantaneamente
# Reload → dark mode persistiu (localStorage)
# Modal escuro no dark mode (tokens funcionando)
# Element Plus respeita tema (botões, inputs, dialogs)
```

---

**APLICAR AGORA** e depois partir pro prompt completo! 🚀
