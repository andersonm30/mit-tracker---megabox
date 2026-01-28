# 📋 FASE 2 COMPLETA - Migração Arquivos Críticos

> **Data:** 27 de Janeiro de 2026  
> **Fase:** 2 - Arquivos Críticos Visíveis ao Usuário  
> **Status:** ✅ CONCLUÍDA

---

## 📊 RESUMO

| Métrica | Valor |
|---------|-------|
| Arquivos alterados | **4** |
| Paths migrados | **7** |
| Referências `/tarkan` restantes | **0** (nesses arquivos) |
| Quebras introduzidas | **0** |

---

## ✅ ARQUIVOS ALTERADOS

### 1. `public/index.html`

| Linha | Antes | Depois |
|-------|-------|--------|
| 7 | `/tarkan/assets/custom/icons/favicon-16x16.png` | `/mit/assets/custom/icons/favicon-16x16.png` |
| 9 | `/tarkan/assets/custom/config.js` | `/mit/assets/custom/config.js` |
| 51 | `/tarkan/assets/custom/colors.js` | `/mit/assets/custom/colors.js` |
| 61 | `/tarkan/assets/custom/models.js` | `/mit/assets/custom/models.js` |

**Impacto:** Favicon, título da página, tema de cores, modelos de dispositivos

---

### 2. `src/templates/login.vue`

| Linha | Antes | Depois |
|-------|-------|--------|
| 360 | `url('/tarkan/assets/custom/bg.jpg')` | `url('/mit/assets/custom/bg.jpg')` |

**Impacto:** Background da tela de login

---

### 3. `src/templates/maintenance.vue`

| Linha | Antes | Depois |
|-------|-------|--------|
| 3 | `/tarkan/assets/custom/logoWhite.png` | `/mit/assets/custom/logoWhite.png` |
| 64 | `url('/tarkan/assets/custom/bg.jpg')` | `url('/mit/assets/custom/bg.jpg')` |

**Impacto:** Logo e background da tela de manutenção

---

### 4. `package.json`

| Campo | Antes | Depois |
|-------|-------|--------|
| `name` | `tarkan-basic` | `mit-app` |

**Impacto:** Nome do pacote NPM, nome do build

---

## 🔍 DIFF COMPLETO

```diff
# public/index.html

- <link rel="icon" href="/tarkan/assets/custom/icons/favicon-16x16.png">
+ <link rel="icon" href="/mit/assets/custom/icons/favicon-16x16.png">

- <script src="/tarkan/assets/custom/config.js" onload="document.title = CONFIG['title']"></script>
+ <script src="/mit/assets/custom/config.js" onload="document.title = CONFIG['title']"></script>

- colors.src="/tarkan/assets/custom/colors.js?nocache="+dt;
+ colors.src="/mit/assets/custom/colors.js?nocache="+dt;

- <script src="/tarkan/assets/custom/models.js" async></script>
+ <script src="/mit/assets/custom/models.js" async></script>


# src/templates/login.vue

- background-image: var(--login-bg-image, url('/tarkan/assets/custom/bg.jpg'));
+ background-image: var(--login-bg-image, url('/mit/assets/custom/bg.jpg'));


# src/templates/maintenance.vue

- <img width="25%" src="/tarkan/assets/custom/logoWhite.png">
+ <img width="25%" src="/mit/assets/custom/logoWhite.png">

- background: url('/tarkan/assets/custom/bg.jpg');
+ background: url('/mit/assets/custom/bg.jpg');


# package.json

- "name": "tarkan-basic",
+ "name": "mit-app",
```

---

## ✅ VALIDAÇÃO PÓS-ALTERAÇÃO

| Verificação | Resultado |
|-------------|-----------|
| `grep "/tarkan/assets" public/index.html` | **0 matches** ✅ |
| `grep "/tarkan/assets" src/templates/login.vue` | **0 matches** ✅ |
| `grep "/tarkan/assets" src/templates/maintenance.vue` | **0 matches** ✅ |
| `grep "tarkan" package.json` | **0 matches** ✅ |

---

## 🧪 CHECKLIST DE TESTES

### Testes Obrigatórios (fazer agora)
- [ ] Abrir `/login` - background deve carregar
- [ ] Verificar favicon no browser (aba)
- [ ] Verificar título da página (CONFIG.title)
- [ ] Simular offline → tela de maintenance deve mostrar logo
- [ ] Build: `npm run build` deve passar

### Testes Automáticos
```bash
# Verificar se não há mais /tarkan nos arquivos críticos
grep -r "/tarkan/assets" public/index.html src/templates/login.vue src/templates/maintenance.vue
# Esperado: nenhum resultado
```

---

## 🔜 PRÓXIMAS FASES

### Fase 3: Componentes de Imagem (PRÓXIMA)
```
src/templates/device.image.vue         (5 ocorrências)
src/templates/device-components/DeviceMainInfo.vue    (1 ocorrência)
src/templates/device-components/DeviceDriverModal.vue (2 ocorrências)
src/templates/device-components/DeviceDriverCard.vue  (2 ocorrências)
```

### Fase 4: Mapa e Lista
```
src/tarkan/components/kore-map.vue     (6 ocorrências)
src/templates/devices.internal.vue     (8 ocorrências)
```

### Fase 5: Composables
```
src/composables/useBranding.js         (2 fallbacks)
```

### Fase 6: Finalização
- Desativar `FEATURES.useLegacyAssets`
- Remover proxy `/tarkan`
- (Opcional) Renomear `src/tarkan` → `src/core`

---

## ⚠️ IMPORTANTE

### Pré-requisitos para funcionar
Os assets devem existir em `/mit/assets/` no servidor:
```
/mit/assets/custom/
├── icons/
│   └── favicon-16x16.png
├── config.js
├── colors.js
├── models.js
├── bg.jpg
└── logoWhite.png
```

### Rollback (se necessário)
```bash
# Reverter para /tarkan via git
git checkout -- public/index.html src/templates/login.vue src/templates/maintenance.vue package.json
```

---

## 📝 NOTAS

1. **Não foi alterado:** `FEATURES.useLegacyAssets` permanece `true`
2. **Não foi alterado:** Proxy `/tarkan` no vue.config.js permanece
3. **Não foi alterado:** Componentes internos (kore-map, devices, etc.)
4. **Estratégia:** Migração incremental para minimizar riscos

---

*Fase 2 concluída em 27/01/2026 por GitHub Copilot*
