# 🔍 AUDITORIA DE REBRAND - Tarkan → MIT.app

> **Data:** 27 de Janeiro de 2026  
> **Status:** 🟡 Em Transição  
> **Fase Atual:** Infraestrutura pronta, migração de paths pendente

---

## 📊 RESUMO EXECUTIVO

| Métrica | Valor |
|---------|-------|
| Arquivos com `/tarkan/assets` hardcoded | **~30** |
| Arquivos críticos (visíveis ao usuário) | **4** |
| Sistema de branding centralizado | ✅ Pronto |
| Flag de transição ativa | ✅ `useLegacyAssets: true` |
| Pronto para produção? | ⚠️ Funciona, mas com paths legados |

---

## ✅ O QUE ESTÁ OK

### Infraestrutura de Branding
| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `src/branding/brand.js` | ✅ | Constantes centralizadas |
| `src/branding/asset.js` | ✅ | Helpers de URL |
| `src/branding/index.js` | ✅ | Re-exports |
| `src/utils/asyncComponent.js` | ✅ | Helper para componentes async |

### Configurações
| Item | Status | Valor |
|------|--------|-------|
| `vue.config.js` PWA name | ✅ | "MIT.app" |
| Store UI Street View | ✅ | Controlado por flag |
| Proxy `/mit` | ✅ | Configurado |

### Composables
| Arquivo | Status | Nota |
|---------|--------|------|
| `useBranding.js` | ⚠️ | Funciona, mas tem fallbacks hardcoded para `/tarkan` |

---

## ❌ O QUE AINDA ESTÁ LEGADO

### 🔴 CRÍTICO - Primeira coisa que usuário vê

| Arquivo | Linha | Path Hardcoded | Impacto |
|---------|-------|----------------|---------|
| `public/index.html` | 7 | `/tarkan/assets/custom/icons/favicon-16x16.png` | Favicon |
| `public/index.html` | 9 | `/tarkan/assets/custom/config.js` | Config global |
| `public/index.html` | 51 | `/tarkan/assets/custom/colors.js` | Cores do tema |
| `public/index.html` | 61 | `/tarkan/assets/custom/models.js` | Modelos |
| `login.vue` | 360 | `url('/tarkan/assets/custom/bg.jpg')` | Background login |
| `maintenance.vue` | 3, 64 | Logo e background | Tela de manutenção |
| `package.json` | 2 | `"name": "tarkan-basic"` | Nome do pacote |

### 🟠 ALTO - Componentes internos

| Arquivo | Ocorrências | Tipo |
|---------|-------------|------|
| `kore-map.vue` | 6 | Drivers, categories |
| `devices.internal.vue` | 8 | Images, categories, drivers |
| `device.image.vue` | 5 | Device images |
| `DeviceMainInfo.vue` | 1 | Device image |
| `DeviceDriverModal.vue` | 2 | Driver images |
| `DeviceDriverCard.vue` | 2 | Driver images |

### 🟡 MÉDIO - Composables e Utils

| Arquivo | Ocorrências | Tipo |
|---------|-------------|------|
| `useBranding.js` | ~~2~~ **0** ✅ | ~~Fallbacks hardcoded~~ **MIGRADO FASE 5** |

### ⚪ BAIXO - Arquivos de teste/docs

| Arquivo | Nota |
|---------|------|
| `test/demo.html` | Arquivo de teste, não vai para produção |
| Vários `.md` | Documentação, não afeta runtime |

---

## ⚠️ O QUE QUEBRA SE REMOVER LEGACY AGORA

### Cenário: Desativar `useLegacyAssets` sem migrar paths

| Componente | Resultado |
|------------|-----------|
| `index.html` | ❌ TELA BRANCA - config.js não carrega |
| Login | ❌ Background não aparece |
| Maintenance | ❌ Logo e background quebrados |
| Mapa | ❌ Ícones de veículos 404 |
| Lista dispositivos | ❌ Imagens de categoria 404 |
| Cards de motorista | ❌ Fotos de motorista 404 |

---

## 📋 CHECKLIST GO / NO-GO

| Ação | Pode fazer? | Motivo |
|------|-------------|--------|
| Remover `LEGACY_ASSET_BASE` do código | ❌ NO-GO | 30+ arquivos dependem |
| Desativar `FEATURES.useLegacyAssets` | ❌ NO-GO | Paths hardcoded não usam helper |
| Remover proxy `/tarkan` do vue.config | ❌ NO-GO | index.html depende |
| Deploy em produção atual | ✅ GO | Funciona (ainda usa legacy) |
| Renomear `src/tarkan` para `src/core` | ⚠️ WAIT | Muitos imports, fazer por último |

---

## 🛤️ ORDEM SEGURA DE MIGRAÇÃO

### FASE 1: Preparar Backend (PRIMEIRO!)
```bash
# Opção A: Cópia (mais seguro)
cp -r /var/www/tarkan/assets /var/www/mit/assets

# Opção B: Symlink (rollback instantâneo)
ln -s /var/www/tarkan/assets /var/www/mit/assets
```

### FASE 2: Migrar index.html
**Prioridade:** 🔴 Máxima  
**Risco:** Alto (quebra tudo se errar)  
**Estratégia:** Substituir paths direto

```html
<!-- DE -->
<link rel="icon" href="/tarkan/assets/custom/icons/favicon-16x16.png">
<script src="/tarkan/assets/custom/config.js" ...></script>

<!-- PARA -->
<link rel="icon" href="/mit/assets/custom/icons/favicon-16x16.png">
<script src="/mit/assets/custom/config.js" ...></script>
```

### FASE 3: Migrar Templates de Autenticação
**Ordem:**
1. `login.vue` - Background CSS
2. `maintenance.vue` - Logo e background

### FASE 4: Migrar Componentes de Imagem
**Ordem:**
1. `device.image.vue` - Usado em vários lugares
2. `DeviceDriverCard.vue`
3. `DeviceDriverModal.vue`
4. `DeviceMainInfo.vue`

### FASE 5: Migrar Mapa e Lista ✅ CONCLUÍDA
**Migrado em:** 28/01/2026  
**Arquivos:** kore-map.vue (7), devices.internal.vue (7)  
**Total:** 14 ocorrências

### FASE 5.1: Atualizar Composables ✅ CONCLUÍDA
**Migrado em:** 28/01/2026  
**Arquivo:** useBranding.js - 2 fallbacks removidos  
**Helper usado:** `assetUrl()` do `@/branding`

### FASE 6: Desativar Legacy ⏳ PRÓXIMA

### FASE 7: Atualizar package.json
```json
"name": "mit-app"
```

### FASE 8: Desativar Legacy
```javascript
// src/branding/brand.js
FEATURES: {
  useLegacyAssets: false  // AGORA SEGURO!
}
```

### FASE 9: Remover proxy legado
```javascript
// vue.config.js - remover
'/tarkan': { ... }
```

### FASE 10: Renomear pasta src/tarkan
```bash
# Por último, quando tudo estiver estável
mv src/tarkan src/core
# + atualizar todos os imports
```

---

## 🔧 ARQUIVOS PARA CORRIGIR (Lista Detalhada)

### Tier 1 - Críticos (fazer primeiro)
```
public/index.html
src/templates/login.vue
src/templates/maintenance.vue
package.json
```

### Tier 2 - Componentes de Imagem
```
src/templates/device.image.vue
src/templates/device-components/DeviceMainInfo.vue
src/templates/device-components/DeviceDriverModal.vue
src/templates/device-components/DeviceDriverCard.vue
```

### Tier 3 - Mapa e Lista
```
src/tarkan/components/kore-map.vue
src/templates/devices.internal.vue
```

### Tier 4 - Composables
```
src/composables/useBranding.js
```

### Tier 5 - Backend PHP
```
public/tarkan/device-photo-upload.php
```

---

## 🧠 PROMPTS PARA PRÓXIMAS ETAPAS

### Quando backend estiver pronto:
```
📌 VALIDAÇÃO PÓS-BACKEND

Os assets já estão em /mit/assets no servidor.

1. Aplique as correções em:
   - public/index.html
   - login.vue (CSS)
   - maintenance.vue

2. Teste e confirme funcionamento.
```

### Para migrar componentes de imagem:
```
📌 MIGRAR COMPONENTES DE IMAGEM

Migre os paths hardcoded para usar assetUrl() do branding:
- device.image.vue
- DeviceMainInfo.vue
- DeviceDriverModal.vue
- DeviceDriverCard.vue

Use categoryImageUrl() e driverImageUrl() onde aplicável.
```

### Para validação final:
```
📌 VALIDAÇÃO FINAL PRÉ-DEPLOY

1. Grep por /tarkan/assets - deve retornar ZERO em código Vue/JS
2. Confirme que posso desativar useLegacyAssets
3. Liste qualquer dependência oculta restante
```

---

## 📈 PROGRESSO

- [x] Sistema de branding criado
- [x] Helpers de asset criados
- [x] Flag de transição implementada
- [x] vue.config.js atualizado
- [x] Store UI expandida
- [x] Documentação criada
- [x] Backend: copiar assets para /mit ✅ (confirmado pelo usuário)
- [x] index.html migrado ✅ (27/01/2026)
- [x] login.vue migrado ✅ (27/01/2026)
- [x] maintenance.vue migrado ✅ (27/01/2026)
- [x] package.json renomeado ✅ (27/01/2026)
- [x] Componentes de imagem migrados ✅ (27/01/2026)
  - device.image.vue (5 ocorrências)
  - DeviceMainInfo.vue (1 ocorrência)
  - DeviceDriverModal.vue (2 ocorrências)
  - DeviceDriverCard.vue (4 ocorrências)
- [x] Mapa migrado ✅ (28/01/2026)
  - kore-map.vue (7 ocorrências)
- [x] Lista de dispositivos migrada ✅ (28/01/2026)
  - devices.internal.vue (7 ocorrências)
- [ ] Composables atualizados
- [ ] Flag useLegacyAssets desativada
- [ ] Proxy /tarkan removido
- [ ] Pasta src/tarkan renomeada

---

## 📞 SUPORTE

Documentos relacionados:
- `REBRAND_IMPLEMENTATION_SUMMARY.md` - Detalhes da implementação
- `BUGFIX_REPORT.md` - Correções de bugs
- `QA_SMOKE_TEST.md` - Checklist de testes
- `ALTERACOES_SESSAO_REBRAND.md` - Log de alterações

---

*Gerado em 27/01/2026 por GitHub Copilot*
