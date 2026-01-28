# BUGFIX REPORT
## MIT.app - Correções de Bugs Críticos

**Data:** 27/01/2026  
**Versão:** 1.0.0

---

## 🐛 Bug #1: Menu Suspenso Não Abre Modais

### Descrição
O menu do usuário (ícone de usuário no header) frequentemente não conseguia abrir os modais (Usuários, Motoristas, Servidor, etc.). O comportamento era intermitente - às vezes funcionava, às vezes não.

### Causa Raiz
Os componentes de modal são carregados de forma **lazy** (assíncrona) via `defineAsyncComponent()`:

```javascript
const EditUsers = lazy('EditUsers', () => import('./tarkan/components/views/edit-users'))
```

Quando o usuário clicava no item do menu, o callback era executado imediatamente:

```javascript
cb: () => editUsersRef.value.showUsers()
```

**Problema:** Se o componente ainda não tinha terminado de carregar, `editUsersRef.value` era `null` ou o método `showUsers()` ainda não existia, causando erro silencioso ou comportamento inesperado.

### Solução Implementada

1. **Criado helper `ensureAsyncRefReady()`** em `src/utils/asyncComponent.ts`:

```typescript
export async function ensureAsyncRefReady(
  ref: Ref<any>,
  options: {
    timeoutMs?: number;      // default: 3000ms
    pollIntervalMs?: number; // default: 50ms
    requiredMethod?: string; // método que deve existir
    silent?: boolean;        // não lança erro em timeout
  }
): Promise<boolean>
```

O helper usa polling para verificar se:
- `ref.value` existe (componente montado)
- O método especificado existe no componente

2. **Atualizado `userMenu()` no App.vue**:

```javascript
// ANTES
cb: () => editUsersRef.value.showUsers()

// DEPOIS
cb: async () => {
  await ensureAsyncRefReady(editUsersRef, { requiredMethod: 'showUsers', timeoutMs: 2000 })
  editUsersRef.value?.showUsers()
}
```

### Arquivos Modificados
- `src/App.vue` - userMenu() agora usa callbacks async
- `src/utils/asyncComponent.ts` - Novo arquivo com helpers

### Como Testar
1. Fazer login no sistema
2. Clicar no ícone de usuário 10x rapidamente
3. Clicar em "Usuários" → Modal DEVE abrir
4. Fechar e repetir com "Motoristas", "Servidor", etc.
5. Todos os modais devem abrir consistentemente

### Métricas Esperadas
- Taxa de sucesso de abertura de modal: 100% (antes era ~70-80%)
- Tempo máximo de espera: 2000ms (timeout configurável)

---

## 🐛 Bug #2: Street View Sempre Ativo

### Descrição
O componente Street View estava sempre renderizado no DOM, mesmo quando não estava sendo usado. Isso causava:
- Consumo desnecessário de recursos
- Possíveis conflitos de estado
- Street View aparecendo em situações indesejadas

### Causa Raiz
No template do App.vue, o componente era renderizado incondicionalmente:

```vue
<!-- Street View sempre presente (paridade) -->
<street-view></street-view>
```

Não havia nenhum controle de estado para determinar quando o Street View deveria estar ativo.

### Solução Implementada

1. **Adicionado estado no módulo `ui` do Vuex** (`src/store/modules/ui.js`):

```javascript
state: {
  streetViewEnabled: false,    // Começa DESATIVADO
  streetViewPosition: null,    // { lat, lng } quando ativo
},

mutations: {
  setStreetViewEnabled(state, enabled) { ... },
  setStreetViewPosition(state, position) { ... },
  resetUIState(state) { ... }, // Reseta no logout
},

actions: {
  openStreetView({ commit }, position) { ... },
  closeStreetView({ commit }) { ... },
  toggleStreetView({ state, commit }) { ... },
  resetForLogout({ commit }) { ... },
},
```

2. **Renderização condicional no App.vue**:

```vue
<!-- ANTES -->
<street-view></street-view>

<!-- DEPOIS -->
<street-view v-if="streetViewEnabled"></street-view>
```

```javascript
// No script:
const streetViewEnabled = computed(() => store.state.ui?.streetViewEnabled ?? false)
```

3. **Reset automático no logout** (`src/store/index.js`):

```javascript
async logout(context) {
  // Reset UI state (Street View, etc.) antes do logout
  context.dispatch('ui/resetForLogout');
  // ... resto do logout
}
```

### Arquivos Modificados
- `src/store/modules/ui.js` - Adicionado estado e actions de Street View
- `src/store/index.js` - Logout reseta UI
- `src/App.vue` - Renderização condicional + computed

### Como Testar
1. Fazer login no sistema
2. **Verificar:** Street View NÃO deve estar visível inicialmente
3. Navegar até um dispositivo e clicar em "Street View" (se disponível)
4. **Verificar:** Street View deve aparecer
5. Fazer logout
6. Fazer login novamente
7. **Verificar:** Street View NÃO deve estar ativo (reset funcionou)

### API Disponível

```javascript
// Ativar Street View em uma posição
store.dispatch('ui/openStreetView', { lat: -23.5505, lng: -46.6333 })

// Desativar Street View
store.dispatch('ui/closeStreetView')

// Toggle
store.dispatch('ui/toggleStreetView')

// Verificar estado
store.getters['ui/isStreetViewEnabled'] // boolean
store.getters['ui/streetViewPosition']  // { lat, lng } | null
```

---

## 📊 Resumo das Correções

| Bug | Causa | Solução | Status |
|-----|-------|---------|--------|
| Menu não abre modais | Componentes async não carregados | Helper `ensureAsyncRefReady()` | ✅ Corrigido |
| Street View sempre ativo | Renderização incondicional | Flag no Vuex + v-if | ✅ Corrigido |

---

## 🔮 Recomendações Futuras

1. **Pré-carregamento de componentes críticos:**
   Considerar pré-carregar componentes de modal mais usados no `onMounted` do App.vue.

2. **Loading indicator no menu:**
   Mostrar um spinner breve enquanto aguarda o componente carregar.

3. **Error boundary:**
   Implementar tratamento de erro caso o componente não carregue nem após timeout.

4. **Street View em outros lugares:**
   Garantir que todos os lugares que ativam Street View usem `store.dispatch('ui/openStreetView')`.

---

*Documento gerado automaticamente pela implementação de bugfix MIT.app*
