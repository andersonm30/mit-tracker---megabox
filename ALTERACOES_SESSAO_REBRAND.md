# 📋 DOCUMENTAÇÃO COMPLETA DE ALTERAÇÕES
## Sessão de Rebrand MIT.app + Correções de Bugs

> **Data:** 27 de Janeiro de 2026  
> **Sessão:** Rebrand Tarkan → MIT.app  
> **Status:** ✅ Implementação Completa

---

## 📑 Índice

1. [Resumo Executivo](#resumo-executivo)
2. [Arquivos Criados](#arquivos-criados)
3. [Arquivos Modificados](#arquivos-modificados)
4. [Bug #1 - Menu Não Abre Modais](#bug-1---menu-não-abre-modais)
5. [Bug #2 - Street View Sempre Ativo](#bug-2---street-view-sempre-ativo)
6. [Sistema de Branding](#sistema-de-branding)
7. [Código Fonte dos Novos Arquivos](#código-fonte-dos-novos-arquivos)
8. [Próximos Passos](#próximos-passos)

---

## Resumo Executivo

| Item | Descrição | Status |
|------|-----------|--------|
| **Rebrand** | Tarkan → MIT.app | ✅ Infraestrutura pronta |
| **Bug Menu/Modais** | Menu não abria modais async | ✅ Corrigido |
| **Bug Street View** | Sempre ativo na tela | ✅ Corrigido |
| **Documentação** | 3 arquivos MD | ✅ Criados |

---

## Arquivos Criados

### 1. `src/branding/brand.js`
**Propósito:** Constantes centralizadas de branding do sistema

```javascript
// Identificação da aplicação
export const APP_NAME = 'MIT.app';
export const APP_DISPLAY_NAME = 'MIT.app Rastreamento';
export const APP_VERSION = '2.0.0';

// Caminhos base para assets
export const ASSET_BASE = '/mit/assets';
export const LEGACY_ASSET_BASE = '/tarkan/assets';

// Chaves de localStorage
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'mit_auth_token',
  USER_PREFS: 'mit_user_prefs',
  DARK_MODE: 'darkMode',
  REMEMBER_ME: 'rememberme',
  LANGUAGE: 'mit_language'
};

// Feature flags
export const FEATURES = {
  useLegacyAssets: true,       // Usar /tarkan/assets durante transição
  enableNewDashboard: false,
  enableBetaFeatures: false,
  enableStreetView: true,
  enableClusters: true
};
```

---

### 2. `src/branding/asset.js`
**Propósito:** Funções helper para resolver URLs de assets

```javascript
import { ASSET_BASE, LEGACY_ASSET_BASE, FEATURES } from './brand';

// Retorna a base correta baseada na flag
function getAssetBase() {
  return FEATURES.useLegacyAssets ? LEGACY_ASSET_BASE : ASSET_BASE;
}

// URL genérica de asset
export function assetUrl(path) {
  const base = getAssetBase();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}/${cleanPath}`;
}

// URL para assets customizados (logo, bg, etc)
export function customAssetUrl(filename) {
  return assetUrl(`custom/${filename}`);
}

// URL para imagens gerais
export function imageAssetUrl(path) {
  return assetUrl(`images/${path}`);
}

// URL para imagem de categoria de dispositivo
export function categoryImageUrl(category) {
  return assetUrl(`images/categories/${category || 'default'}.png`);
}

// URL para imagem específica de dispositivo
export function deviceImageUrl(deviceImage) {
  return assetUrl(`images/devices/${deviceImage}`);
}

// URL para imagem de motorista
export function driverImageUrl(driverImage) {
  return assetUrl(`images/drivers/${driverImage}`);
}
```

---

### 3. `src/branding/index.js`
**Propósito:** Re-exportação centralizada do módulo de branding

```javascript
// Re-export de brand.js
export {
  APP_NAME,
  APP_DISPLAY_NAME,
  APP_VERSION,
  ASSET_BASE,
  LEGACY_ASSET_BASE,
  STORAGE_KEYS,
  FEATURES
} from './brand';

// Re-export de asset.js
export {
  assetUrl,
  customAssetUrl,
  imageAssetUrl,
  categoryImageUrl,
  deviceImageUrl,
  driverImageUrl
} from './asset';
```

---

### 4. `src/utils/asyncComponent.js`
**Propósito:** Helpers para trabalhar com componentes carregados via `defineAsyncComponent`

```javascript
/**
 * Aguarda até que um ref de componente assíncrono esteja pronto
 * Resolve o problema de timing com componentes lazy-loaded
 */
export function ensureAsyncRefReady(ref, options = {}) {
  const {
    timeoutMs = 2000,
    pollIntervalMs = 50,
    requiredMethod = null,
    silent = false
  } = options;

  return new Promise((resolve) => {
    const startTime = Date.now();

    const check = () => {
      // Verifica se o ref existe e está montado
      if (ref.value) {
        // Se requiredMethod especificado, verifica se o método existe
        if (requiredMethod) {
          if (typeof ref.value[requiredMethod] === 'function') {
            resolve(true);
            return;
          }
        } else {
          // Sem método específico, apenas verifica se ref existe
          resolve(true);
          return;
        }
      }

      // Verifica timeout
      if (Date.now() - startTime >= timeoutMs) {
        if (!silent) {
          console.warn(`[asyncComponent] Timeout (${timeoutMs}ms) waiting for ref`, {
            requiredMethod,
            refValue: ref.value
          });
        }
        resolve(false);
        return;
      }

      // Continua polling
      setTimeout(check, pollIntervalMs);
    };

    check();
  });
}

/**
 * Chama um método em um ref de componente async de forma segura
 */
export async function safeCallAsyncMethod(ref, methodName, args = [], options = {}) {
  const ready = await ensureAsyncRefReady(ref, {
    ...options,
    requiredMethod: methodName
  });

  if (ready && ref.value && typeof ref.value[methodName] === 'function') {
    return ref.value[methodName](...args);
  }

  return null;
}
```

---

## Arquivos Modificados

### 1. `src/store/modules/ui.js`

**Adições:**
- Estado `streetViewEnabled` (boolean, default: false)
- Estado `streetViewPosition` (object, default: null)
- Estados `sidebarOpen`, `mobileMenuOpen`, `activeModal`
- Mutations: `setStreetViewEnabled`, `setStreetViewPosition`, `resetUIState`
- Actions: `openStreetView`, `closeStreetView`, `toggleStreetView`, `resetForLogout`

---

### 2. `src/store/index.js`

**Adição na action `logout`:**
```javascript
logout({ commit, dispatch }) {
  // ... código existente ...
  dispatch('ui/resetForLogout');  // ← Adicionado
}
```

---

### 3. `src/App.vue`

**Imports adicionados:**
```javascript
import { assetUrl, deviceImageUrl, categoryImageUrl } from '@/branding';
import { ensureAsyncRefReady } from '@/utils/asyncComponent';
```

**Computed adicionados:**
```javascript
const logoSrc = computed(() => assetUrl('custom/logo.png'));
const streetViewEnabled = computed(() => store.state.ui?.streetViewEnabled ?? false);
```

**Alteração no template:**
```html
<!-- Antes -->
<street-view></street-view>

<!-- Depois -->
<street-view v-if="streetViewEnabled"></street-view>
```

**Alteração no logo:**
```html
<!-- Antes -->
<img src="/tarkan/assets/custom/logo.png" />

<!-- Depois -->
<img :src="logoSrc" />
```

**Função userMenu convertida para async:**
```javascript
// Antes
const userMenu = (key, keyPath) => {
  switch(key){
    case 'users':
      userRef.value.showUsers();  // ❌ Pode falhar
      break;
  }
}

// Depois
const userMenu = async (key, keyPath) => {
  switch(key){
    case 'users':
      await ensureAsyncRefReady(userRef, { requiredMethod: 'showUsers', timeoutMs: 2000 });
      userRef.value?.showUsers();  // ✅ Seguro
      break;
  }
}
```

---

### 4. `vue.config.js`

**Alterações:**
```javascript
// Nome do PWA
pwa: {
  name: 'MIT.app',  // Antes: 'Tarkan'
}

// Proxy adicionado
devServer: {
  proxy: {
    '/mit': {
      target: 'http://localhost:8082',
      changeOrigin: true
    }
  }
}
```

---

## Bug #1 - Menu Não Abre Modais

### Problema
Componentes carregados com `defineAsyncComponent` (via função `lazy()`) não estavam prontos quando o usuário clicava no menu.

### Sintoma
- Clicar em "Usuários" não abria nada
- Comportamento intermitente
- Pior em conexões lentas

### Solução
1. Criado `ensureAsyncRefReady()` que faz polling até componente estar pronto
2. Função `userMenu` convertida para async
3. Todas as chamadas de métodos em refs agora aguardam o componente

### Código da Correção
```javascript
// Cada case do userMenu agora usa:
await ensureAsyncRefReady(refDoModal, { 
  requiredMethod: 'nomeDoMetodo', 
  timeoutMs: 2000 
});
refDoModal.value?.nomeDoMetodo();
```

---

## Bug #2 - Street View Sempre Ativo

### Problema
Componente `<street-view>` era renderizado incondicionalmente, sempre visível.

### Sintoma
- Street View aparecia mesmo sem ser solicitado
- Consumia recursos desnecessariamente

### Solução
1. Adicionado estado `streetViewEnabled` no Vuex (default: false)
2. Renderização condicional com `v-if="streetViewEnabled"`
3. Reset automático no logout

### Como Usar Agora
```javascript
// Abrir Street View
store.dispatch('ui/openStreetView', { lat: -23.55, lng: -46.63 });

// Fechar Street View
store.dispatch('ui/closeStreetView');

// Verificar estado
const ativo = store.state.ui.streetViewEnabled;
```

---

## Sistema de Branding

### Arquitetura
```
src/branding/
├── brand.js    → Constantes (APP_NAME, ASSET_BASE, FEATURES)
├── asset.js    → Funções (assetUrl, categoryImageUrl, etc)
└── index.js    → Re-exports centralizados
```

### Uso
```javascript
import { APP_NAME, assetUrl, categoryImageUrl } from '@/branding';

// Obter URL de asset
const logo = assetUrl('custom/logo.png');
// Resultado: "/tarkan/assets/custom/logo.png" (com useLegacyAssets: true)

// Obter URL de categoria
const icon = categoryImageUrl('car');
// Resultado: "/tarkan/assets/images/categories/car.png"
```

### Flag de Migração
```javascript
// Em brand.js
FEATURES: {
  useLegacyAssets: true  // Quando false, usa /mit/assets
}
```

---

## Próximos Passos

### Imediato (Necessário)
1. **Corrigir node_modules:**
   ```bash
   rm -rf node_modules
   npm install
   npm run build
   ```

### Curto Prazo
2. **Migrar assets físicos:**
   - Copiar `/tarkan/assets/` → `/mit/assets/` no servidor
   - Alterar `FEATURES.useLegacyAssets` para `false`
   - Testar aplicação

### Médio Prazo
3. **Migrar paths hardcoded:**
   - ~30 arquivos ainda usam `/tarkan/assets` diretamente
   - Substituir gradualmente por `assetUrl()`

4. **Renomear pasta src/tarkan:**
   - Após testes, renomear para `src/core` ou `src/mit`
   - Atualizar todos os imports

---

## Documentação Relacionada

| Arquivo | Descrição |
|---------|-----------|
| `REBRAND_IMPLEMENTATION_SUMMARY.md` | Resumo técnico detalhado |
| `BUGFIX_REPORT.md` | Relatório de bugs (versão anterior) |
| `QA_SMOKE_TEST.md` | Checklist de 41 testes |

---

## Checklist de Validação

### Testes de Menu
- [ ] "Usuários" abre modal EditUsers
- [ ] "Motoristas" abre modal EditDrivers  
- [ ] "Grupos" abre modal EditGroups
- [ ] "Cercas" abre modal EditGeofences
- [ ] "Manutenções" abre modal EditMaintenance
- [ ] "Conta" abre modal EditAccount
- [ ] Testar com DevTools → Network → Slow 3G

### Testes de Street View
- [ ] Não aparece no carregamento inicial
- [ ] Abre quando solicitado
- [ ] Fecha corretamente
- [ ] Reseta após logout

### Testes de Branding
- [ ] Logo carrega
- [ ] PWA mostra "MIT.app"
- [ ] Assets funcionam

---

*Documento gerado em 27/01/2026 pelo GitHub Copilot*
