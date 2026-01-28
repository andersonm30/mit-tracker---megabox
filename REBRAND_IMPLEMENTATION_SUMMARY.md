# REBRAND IMPLEMENTATION SUMMARY
## MIT.app - Modernização e Rebrand (tarkan → MIT.app)

**Data:** 27/01/2026  
**Versão:** 1.0.0

---

## 📋 Resumo Executivo

Este documento detalha a implementação do rebrand completo do sistema de "tarkan" para "MIT.app", incluindo:
- Sistema centralizado de branding
- Correções de bugs críticos de UI
- Modernização do App.vue
- Helper para componentes async

---

## 🏗️ Arquivos Criados

### Sistema de Branding
| Arquivo | Descrição |
|---------|-----------|
| `src/branding/brand.ts` | Constantes centrais: APP_NAME, ASSET_BASE, STORAGE_KEYS |
| `src/branding/asset.ts` | Funções TypeScript: assetUrl(), deviceImageUrl(), etc. |
| `src/branding/asset.js` | Versão JavaScript para compatibilidade com Vue existente |
| `src/branding/index.ts` | Re-exporta todas as funcionalidades |

### Utilitários
| Arquivo | Descrição |
|---------|-----------|
| `src/utils/asyncComponent.ts` | Helper `ensureAsyncRefReady()` para componentes lazy |

---

## 📝 Arquivos Modificados

### Core
| Arquivo | Mudanças |
|---------|----------|
| `src/App.vue` | Street View condicional, imports de branding, userMenu com async safety |
| `src/store/modules/ui.js` | Adicionado: streetViewEnabled, streetViewPosition, mutations e actions |
| `src/store/index.js` | Action logout chama ui/resetForLogout |
| `vue.config.js` | PWA name "Tarkan" → "MIT.app", proxy /mit adicionado |

### Templates
| Arquivo | Status |
|---------|--------|
| `src/templates/login.vue` | ✅ Já usava MIT.app no rodapé |

---

## 🎯 Decisões de Arquitetura

### 1. Sistema de Branding Centralizado

```typescript
// src/branding/brand.ts
export const APP_NAME = 'MIT.app';
export const ASSET_BASE = '/mit/assets';
export const LEGACY_ASSET_BASE = '/tarkan/assets'; // Compatibilidade temporária
```

**Decisão:** Manter `LEGACY_ASSET_BASE` enquanto os assets físicos não forem migrados no servidor.

### 2. Feature Flag para Assets Legados

```typescript
export const FEATURES = {
  useLegacyAssets: true, // Enquanto true, usa /tarkan/assets como base
};
```

**Quando desativar:** Após copiar/renomear a pasta `/tarkan/assets` para `/mit/assets` no backend.

### 3. Street View Controlado por Store

```javascript
// Antes (sempre ativo):
<street-view></street-view>

// Depois (condicional):
<street-view v-if="streetViewEnabled"></street-view>

// Controlado via:
store.dispatch('ui/openStreetView', { lat, lng })
store.dispatch('ui/closeStreetView')
```

### 4. Componentes Async com Safety

```javascript
// Antes (podia falhar se componente não carregou):
cb: () => editUsersRef.value.showUsers()

// Depois (aguarda componente estar pronto):
cb: async () => {
  await ensureAsyncRefReady(editUsersRef, { requiredMethod: 'showUsers' })
  editUsersRef.value?.showUsers()
}
```

---

## ⚠️ Itens Pendentes (TODO)

### Alta Prioridade
- [ ] Migrar pasta física `/tarkan/assets` → `/mit/assets` no backend
- [ ] Atualizar `manifest.json` com novo nome
- [ ] Atualizar `index.html` title para "MIT.app"

### Média Prioridade (após migração de assets)
- [ ] Setar `FEATURES.useLegacyAssets = false` em `src/branding/brand.ts`
- [ ] Atualizar `vue.config.js` iconPaths para `/mit/assets/`
- [ ] Remover proxy `/tarkan` do devServer

### Baixa Prioridade
- [ ] Migrar todos os arquivos `.vue` para usar `assetUrl()` em vez de hardcode
- [ ] Atualizar arquivos `.md` de documentação que referenciam "tarkan"
- [ ] Remover comentários `// TODO: migrar para mit` após migração completa

---

## 📊 Métricas de Impacto

| Métrica | Antes | Depois |
|---------|-------|--------|
| Referências "tarkan" em UI visível | ~5 | 0 |
| Pontos de configuração de branding | Distribuídos | 1 (brand.ts) |
| Bug menu não abre modal | Frequente | Corrigido |
| Street View sempre ativo | Sim | Não (controlado) |

---

## 🔍 Como Verificar a Implementação

1. **Build funciona:**
   ```bash
   npm run build
   ```

2. **Buscar vestígios tarkan em UI:**
   ```bash
   grep -r "tarkan" src/ --include="*.vue" | grep -v "/tarkan/" | grep -v "LEGACY"
   ```

3. **Verificar Street View:**
   - Abrir app → Street View NÃO deve estar visível
   - Clicar em "Street View" em algum lugar → Deve aparecer
   - Fazer logout → Street View deve desativar

4. **Verificar menu:**
   - Clicar no ícone de usuário 10x rapidamente
   - Todos os modais devem abrir sem falha

---

## 📚 Referências

- [src/branding/brand.ts](src/branding/brand.ts) - Configuração central
- [src/utils/asyncComponent.ts](src/utils/asyncComponent.ts) - Helper de async
- [src/store/modules/ui.js](src/store/modules/ui.js) - Estado de UI
- [BUGFIX_REPORT.md](BUGFIX_REPORT.md) - Detalhes dos bugs corrigidos
- [QA_SMOKE_TEST.md](QA_SMOKE_TEST.md) - Roteiro de testes

---

*Documento gerado automaticamente pela implementação de rebrand MIT.app*
