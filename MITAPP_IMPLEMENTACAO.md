# ✅ MITAPP REBRANDING - ARQUIVOS ENTREGUES

**Data**: 25 de janeiro de 2026  
**Status**: 🟢 PRONTO PARA IMPLEMENTAÇÃO

---

## 📦 ARQUIVOS CRIADOS

### 1. **MITAPP_REBRANDING_PROMPT.md** (PRINCIPAL)
**Prompt completo** para copiar/colar no Copilot/Claude/ChatGPT

**Conteúdo**:
- ✅ Contexto completo do projeto
- ✅ Regras críticas (pode/não pode fazer)
- ✅ 6 tarefas ordenadas (A→F):
  - A) Diagnóstico
  - B) Dark Mode 100% funcional ⚡ PRIORIDADE #1
  - C) Design System MITAPP 🎨
  - D) Refatoração segura (composables)
  - E) Ajustes edit-users.vue
  - F) Checklist final
- ✅ Código de exemplo para cada tarefa
- ✅ Instruções de integração
- ✅ Paleta de cores MITAPP
- ✅ White-label via window.CONFIG

**Como usar**:
```bash
# 1. Abrir MITAPP_REBRANDING_PROMPT.md
# 2. Copiar TODO o conteúdo
# 3. Colar no Copilot/Claude/ChatGPT
# 4. A IA vai entregar arquivos prontos seguindo a ordem
```

---

### 2. **src/styles/tokens.css** (DESIGN SYSTEM)
**Sistema de tokens completo** com suporte Light/Dark mode

**Tokens incluídos**:
- ✅ Cores primárias: `--brand-primary`, `--brand-success`, `--brand-danger`, etc.
- ✅ Surfaces: `--brand-bg`, `--brand-surface`, `--brand-surface-modal`
- ✅ Texto: `--brand-text`, `--brand-text-secondary`, `--brand-text-muted`
- ✅ Bordas: `--brand-border`, `--brand-border-light`
- ✅ Layout: `--brand-header-bg`, `--brand-menu-bg`, `--brand-panel-bg`
- ✅ Shadows: `--brand-shadow-sm/md/lg`
- ✅ Radius: `--brand-radius-sm/md/lg`
- ✅ Spacing: `--brand-space-xs/sm/md/lg/xl` (escala 8px)
- ✅ Typography: família, tamanhos, weights
- ✅ Gradientes: `--brand-gradient-1` a `--brand-gradient-6` (substituir nth-child)
- ✅ Integração Element Plus: `--el-*` mapeados

**Dark Mode**:
```css
body.dark-mode {
  --brand-bg: #1A1A1A;
  --brand-surface: #2A2A2A;
  --brand-text: #E0E0E0;
  /* ... todos os tokens ajustados */
}
```

**Como usar**:
```javascript
// main.js ou App.vue
import '@/styles/tokens.css';
```

---

### 3. **src/styles/edit-users-tokens.css** (COMPONENTE)
**Estilos do edit-users.vue** com tokens responsivos ao dark mode

**Melhorias aplicadas**:
- ✅ Stat cards usam `var(--mit-accent)` ao invés de hardcode
- ✅ Background usa `var(--mit-bg)` e `var(--mit-surface)`
- ✅ Texto usa `var(--mit-text)` e `var(--mit-subtext)`
- ✅ Tabela com tokens (header, linhas, bordas)
- ✅ Footer com tokens
- ✅ Mobile cards com tokens
- ✅ Loading state (skeleton) com cores ajustadas
- ✅ Empty state e error state
- ✅ Acessibilidade (focus visible)
- ✅ Responsivo (desktop/tablet/mobile)

**Dark mode automático**:
```css
body.dark-mode .stat-card {
  filter: brightness(0.9);
}

body.dark-mode .users-table :deep(.el-table__header th) {
  background: var(--mit-surface-elevated) !important;
  color: var(--mit-text);
}
```

**Como usar**:
```vue
<!-- edit-users.vue -->
<style src="@/styles/edit-users-tokens.css"></style>
```

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### **Fase 1: Preparação** (5 min)
```bash
# 1. Criar diretório de estilos (se não existir)
mkdir src/styles

# 2. Copiar arquivos
# - tokens.css
# - edit-users-tokens.css

# 3. Importar no main.js
import '@/styles/tokens.css';
```

### **Fase 2: Dark Mode Funcional** (15 min)
```bash
# 1. Copiar prompt MITAPP_REBRANDING_PROMPT.md
# 2. Colar no Copilot/Claude
# 3. Pedir pra executar TAREFA B (Dark Mode 100%)
# 4. A IA vai entregar:
#    - store/modules/ui.js (completo)
#    - App.vue (watch + onMounted)
#    - Instruções de teste
```

### **Fase 3: Aplicar Tokens no edit-users** (10 min)
```vue
<!-- edit-users.vue -->
<template>
  <el-dialog class="users-dialog users-dialog--mitapp" ...>
    <!-- resto do template igual -->
  </el-dialog>
</template>

<style src="@/styles/edit-users-tokens.css"></style>
```

### **Fase 4: Testes** (20 min)
```bash
# 1. npm run serve
# 2. Abrir http://localhost:8083
# 3. Testar:
#    - Toggle dark mode (deve persistir no reload)
#    - Abrir edit-users (cores devem mudar)
#    - Mobile (responsivo deve funcionar)
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Dark Mode
- [ ] Toggle no header funciona
- [ ] Classe `body.dark-mode` aplicada corretamente
- [ ] localStorage persiste o estado
- [ ] Reload mantém preferência
- [ ] Element Plus respeita tema (dialogs, buttons, inputs)

### Tokens
- [ ] Stat cards usam `var(--mit-accent)`
- [ ] Background usa `var(--mit-bg)`
- [ ] Texto usa `var(--mit-text)`
- [ ] Tabela muda cor no dark mode
- [ ] Sem hardcodes de cores

### Edit-users
- [ ] Modal abre sem erros
- [ ] Cores corretas no light mode
- [ ] Cores corretas no dark mode
- [ ] Mobile: 95vw, responsivo
- [ ] Tabela scrollável
- [ ] Footer com tokens

### Acessibilidade
- [ ] Focus visível em stat cards
- [ ] Tab navigation funciona
- [ ] Esc fecha modal
- [ ] Screen reader consegue navegar

---

## 📝 PRÓXIMOS PASSOS

### Imediato (HOJE)
1. **Importar tokens.css** no main.js
2. **Adicionar tokens no edit-users.vue**
3. **Copiar prompt** e pedir dark mode funcional
4. **Testar** checklist acima

### Curto prazo (ESTA SEMANA)
1. Executar **TAREFA C** do prompt (Design System completo)
2. Executar **TAREFA D** (composables para App.vue)
3. Executar **TAREFA E** (refinamentos edit-users)
4. Executar **TAREFA F** (checklist completo)

### Médio prazo (PRÓXIMO MÊS)
1. Aplicar tokens em TODOS os componentes
2. Trocar gradientes nth-child por tokens
3. Implementar white-label (window.CONFIG)
4. Criar biblioteca de componentes MITAPP

---

## 🎨 PALETA MITAPP (PREVIEW)

### Light Mode
- **Primary**: #409EFF (azul Element Plus)
- **Background**: #FFFFFF (branco puro)
- **Surface**: #FAFAFA (cinza claro)
- **Text**: #222222 (quase preto)
- **Border**: #DCDFE6 (cinza médio)

### Dark Mode
- **Primary**: #409EFF (mesmo azul, destaca no escuro)
- **Background**: #1A1A1A (preto suave)
- **Surface**: #2A2A2A (cinza escuro)
- **Text**: #E0E0E0 (branco suave)
- **Border**: #444444 (cinza escuro)

---

## 💡 DICAS DE USO

### White-label (futuro)
```javascript
// Sobrescrever tokens via window.CONFIG
if (window.CONFIG?.branding) {
  document.documentElement.style.setProperty(
    '--brand-primary', 
    window.CONFIG.branding.primary
  );
}
```

### Gradientes do menu (substituir nth-child)
```vue
<!-- ANTES (ruim) -->
<style>
.menu-item:nth-child(1) { background: linear-gradient(...); }
.menu-item:nth-child(2) { background: linear-gradient(...); }
</style>

<!-- DEPOIS (bom) -->
<div 
  v-for="(item, index) in menuItems"
  :style="{ background: `var(--brand-gradient-${(index % 6) + 1})` }"
>
```

### Tokens personalizados por componente
```css
.meu-componente {
  /* Herda tokens globais */
  --local-accent: var(--brand-primary);
  --local-bg: var(--brand-surface);
  
  background: var(--local-bg);
  color: var(--local-accent);
}

/* Dark mode ajusta automaticamente */
body.dark-mode .meu-componente {
  /* Tokens globais já mudaram, local herda */
}
```

---

## 🤖 USANDO O PROMPT

**Copie TODO o MITAPP_REBRANDING_PROMPT.md** e cole no Copilot/Claude/ChatGPT:

**Você**: [COLAR PROMPT COMPLETO]

**IA**: 
```
Entendido! Vou começar pela TAREFA A (Diagnóstico).

DIAGNÓSTICO DO APP.VUE:

Problemas estruturais:
1. God Component: App.vue tem 3000+ linhas
2. Acoplamento: lógica de tema + layout + modais no mesmo arquivo
3. Hardcodes: cores RGB fixas, gradientes nth-child
...

TAREFA B (Dark Mode):
Arquivo: store/modules/ui.js
[CÓDIGO COMPLETO]

Arquivo: App.vue (modificações)
[DIFF COMPLETO]

Instruções:
1. Criar store/modules/ui.js
2. Modificar App.vue linhas X-Y
3. Testar: abrir app → clicar lua/sol → recarregar
...
```

**Você**: "Agora execute TAREFA C (Design System)"

**IA**: [ENTREGA tokens.css + theme.css + instruções]

---

## 🎯 RESULTADO ESPERADO

Após implementar tudo:

### Antes ❌
- Dark mode só visual (não funciona)
- Cores hardcoded (`#FF6B35`, `rgba(255,107,53,0.9)`)
- Element Plus não respeita tema
- Código gigante no App.vue
- Gradientes aleatórios (nth-child)

### Depois ✅
- Dark mode 100% funcional (persiste, body class, tokens)
- Todas as cores via tokens (`var(--brand-primary)`)
- Element Plus sincronizado com tema
- Código organizado (composables)
- Gradientes controlados (tokens)
- White-label pronto (window.CONFIG)
- Acessibilidade e UX moderna

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Dark mode não funciona**: Verificar se `store/modules/ui.js` foi criado e registrado em `store/index.js`
2. **Cores erradas**: Verificar se `tokens.css` foi importado no `main.js`
3. **Element Plus não muda**: Verificar mapeamento `--el-*` no `tokens.css`
4. **Build quebra**: Verificar sintaxe CSS (variáveis válidas)

---

**STATUS**: 🟢 PRONTO PARA USAR

Copie o prompt e comece a transformação MITAPP! 🚀
