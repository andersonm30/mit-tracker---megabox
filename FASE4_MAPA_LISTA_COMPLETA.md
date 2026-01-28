# 📋 FASE 4 COMPLETA - Migração Mapa + Lista de Dispositivos

> **Data:** 28 de Janeiro de 2026  
> **Fase:** 4 - Mapa e Lista de Dispositivos  
> **Status:** ✅ CONCLUÍDA

---

## 📊 RESUMO

| Métrica | Valor |
|---------|-------|
| Arquivos alterados | **2** |
| Ocorrências migradas | **14** |
| Referências `/tarkan/assets` restantes | **0** (nesses arquivos) |
| Helpers utilizados | `categoryImageUrl()`, `driverImageUrl()`, `assetUrl()` |

---

## ✅ ARQUIVOS ALTERADOS

### 1. `src/tarkan/components/kore-map.vue`

| Linha | Antes | Depois |
|-------|-------|--------|
| Import | - | `import { categoryImageUrl, driverImageUrl } from '@/branding'` |
| L645 | `@error="...'/tarkan/assets/images/drivers/default.png'"` | `@error="$event.target.src = driverImageUrl('default.png')"` |
| L696 | `@error="...'/tarkan/assets/images/categories/default.png'"` | `@error="$event.target.src = categoryImageUrl('default')"` |
| L1244 | `return '/tarkan/assets/images/drivers/default.png'` | `return driverImageUrl('default.png')` |
| L1277 | `return '/tarkan/assets/images/drivers/default.png'` | `return driverImageUrl('default.png')` |
| L1345 | `return '/tarkan/assets/images/categories/default.png'` | `return categoryImageUrl('default')` |
| L1356 | `` return `/tarkan/assets/images/categories/${category}.png` `` | `return categoryImageUrl(category)` |
| L2328 | `` const iconUrl = `/tarkan/assets/images/categories/${category}.png` `` | `const iconUrl = categoryImageUrl(category)` |

**Total: 7 ocorrências**

---

### 2. `src/templates/devices.internal.vue`

| Linha | Antes | Depois |
|-------|-------|--------|
| Import | - | `import { assetUrl, categoryImageUrl, driverImageUrl } from '@/branding'` |
| L753 | `` `/tarkan/assets/images/categories/${...}.png?...` `` | `categoryImageUrl(...) + '?...'` |
| L765 | `` `/tarkan/assets/images/${device.id}.png?uncache=...` `` | `assetUrl(\`images/${device.id}.png?uncache=...\`)` |
| L772 | `` `/tarkan/assets/images/categories/${...}.png?uncache=...` `` | `categoryImageUrl(...) + '?uncache=...'` |
| L780 | `` `/tarkan/assets/images/categories/${...}.png?uncache=...` `` | `categoryImageUrl(...) + '?uncache=...'` |
| L2014 | `` '/tarkan/assets/images/categories/'+...+'.png?extreme=' `` | `categoryImageUrl(...) + '?extreme=...'` |
| L2295 | `` `/tarkan/assets/images/drivers/${driver.id}.png` `` | `driverImageUrl(driver.id + '.png')` |
| L2296 | `onerror="this.src='/tarkan/assets/images/drivers/default.png'"` | `onerror="this.src='${driverImageUrl('default.png')}'"` |

**Total: 7 ocorrências**

---

## 🔍 DIFF COMPLETO

### `kore-map.vue`

```diff
 <script setup>
 import { devLog, devWarn } from '@/utils/devLog';
 import { startMark, endMark } from '@/utils/devPerf';
+import { categoryImageUrl, driverImageUrl } from '@/branding';
 import {
   formatCPF,

 <!-- Template: driver avatar error -->
-@error="$event.target.src = '/tarkan/assets/images/drivers/default.png'"
+@error="$event.target.src = driverImageUrl('default.png')"

 <!-- Template: vehicle photo error -->
-@error="$event.target.src = '/tarkan/assets/images/categories/default.png'"
+@error="$event.target.src = categoryImageUrl('default')"

 // getDriverPhotoUrl - primeiro return
-if (!device) return '/tarkan/assets/images/drivers/default.png';
+if (!device) return driverImageUrl('default.png');

 // getDriverPhotoUrl - segundo return
-return '/tarkan/assets/images/drivers/default.png';
+return driverImageUrl('default.png');

 // getDeviceImageUrl - primeiro return
-if (!device) return '/tarkan/assets/images/categories/default.png';
+if (!device) return categoryImageUrl('default');

 // getDeviceImageUrl - return com categoria
-return `/tarkan/assets/images/categories/${category}.png`;
+return categoryImageUrl(category);

 // Playback icon
-const iconUrl = `/tarkan/assets/images/categories/${category}.png`;
+const iconUrl = categoryImageUrl(category);
```

---

### `devices.internal.vue`

```diff
 // i18n helper
 import KT from '../tarkan/func/kt.js';
 import defaultDeviceData from '../defaultDeviceData.js';
+
+// Branding helpers
+import { assetUrl, categoryImageUrl, driverImageUrl } from '@/branding';
 
 // Composables

 // hasImage false/undefined - categoria direta
-const categoryUrl = `/tarkan/assets/images/categories/${...}.png?noDeviceImage=${Date.now()}`;
+const categoryUrl = categoryImageUrl(device.category || 'default') + `?noDeviceImage=${Date.now()}`;

 // testImage - device URL
-const deviceImageUrl = `/tarkan/assets/images/${device.id}.png?uncache=${timestamp}`;
+const deviceImageUrlPath = assetUrl(`images/${device.id}.png?uncache=${timestamp}`);

 // Timeout fallback
-const categoryImageUrl = `/tarkan/assets/images/categories/${...}.png?uncache=${timestamp}`;
+const categoryImgUrl = categoryImageUrl(device.category || 'default') + `?uncache=${timestamp}`;

 // onerror fallback
-const categoryImageUrl = `/tarkan/assets/images/categories/${...}.png?uncache=${timestamp}`;
+const categoryImgUrl = categoryImageUrl(device.category || 'default') + `?uncache=${timestamp}`;

 // Salida - categoria extrema
-const categoryUrl = '/tarkan/assets/images/categories/'+...+'.png?extreme=' + extremeForce;
+const categoryUrl = categoryImageUrl(device.value?.category || 'default') + '?extreme=' + extremeForce;

 // PDF template - driver photo
-<img src="/tarkan/assets/images/drivers/${driver.id}.png?v=..."
-     onerror="this.src='/tarkan/assets/images/drivers/default.png'" />
+<img src="${driverImageUrl(driver.id + '.png')}?v=..."
+     onerror="this.src='${driverImageUrl('default.png')}'" />
```

---

## ✅ VALIDAÇÃO PÓS-ALTERAÇÃO

| Verificação | Resultado |
|-------------|-----------|
| `grep "/tarkan/assets" kore-map.vue` | **0 matches** ✅ |
| `grep "/tarkan/assets" devices.internal.vue` | **0 matches** ✅ |

---

## 🧪 CHECKLIST DE TESTES

### Testes do Mapa (kore-map.vue)
- [ ] Abrir `/home` → mapa aparece
- [ ] Zoom in/out → ícones/markers continuam visíveis
- [ ] Clicar em dispositivo no mapa → painel flutuante abre
- [ ] Foto do motorista carrega no painel (ou fallback default)
- [ ] Foto do veículo carrega no painel (ou fallback categoria)
- [ ] Playback de rota → ícone do veículo aparece
- [ ] Testar com dispositivo sem motorista → fallback OK

### Testes da Lista (devices.internal.vue)
- [ ] Abrir lista de dispositivos → imagens de categoria OK
- [ ] Dispositivo com imagem → carrega imagem específica
- [ ] Dispositivo sem imagem → fallback para categoria
- [ ] Dispositivo com `hasImage: false` → vai direto para categoria (sem 404)
- [ ] Card de motorista → foto OK (fallback OK)
- [ ] Gerar PDF de motorista → foto carrega no PDF

### Smoke Test
- [ ] Testar modo "Slow 3G" no DevTools → nada desaparece permanentemente
- [ ] Console não mostra erros 404 para imagens

---

## 📝 NOTAS TÉCNICAS

### Padrões de Migração Aplicados

1. **Categoria de dispositivo:**
   ```javascript
   // Antes
   `/tarkan/assets/images/categories/${category}.png`
   
   // Depois
   categoryImageUrl(category)
   // Helper já adiciona path + extensão
   ```

2. **Imagem de motorista:**
   ```javascript
   // Antes
   `/tarkan/assets/images/drivers/${id}.png`
   
   // Depois
   driverImageUrl(id + '.png')
   // ou driverImageUrl('default.png') para fallback
   ```

3. **Imagem de dispositivo específico:**
   ```javascript
   // Antes
   `/tarkan/assets/images/${deviceId}.png`
   
   // Depois
   assetUrl(`images/${deviceId}.png`)
   ```

4. **Cache-busting mantido:**
   ```javascript
   categoryImageUrl(category) + `?uncache=${timestamp}`
   // Query strings continuam funcionando
   ```

5. **Templates HTML (PDF):**
   ```javascript
   // Interpolação dentro de template string
   `<img src="${driverImageUrl(driver.id + '.png')}" />`
   ```

### Renomeação de Variável
- Em `devices.internal.vue`, a variável `deviceImageUrl` foi renomeada para `deviceImageUrlPath` para evitar conflito com o helper importado `deviceImageUrl` do branding.

---

## 🔜 PRÓXIMAS FASES

### Fase 5: Composables
```
src/composables/useBranding.js         (2 fallbacks hardcoded)
```

### Fase 6: Finalização
- Desativar `FEATURES.useLegacyAssets`
- Remover proxy `/tarkan`
- (Opcional) Renomear `src/tarkan` → `src/core`

---

## 📊 PROGRESSO GERAL DO REBRAND

| Fase | Arquivos | Ocorrências | Status |
|------|----------|-------------|--------|
| 1 | Backend | - | ✅ |
| 2 | Críticos (4) | 7 | ✅ |
| 3 | Componentes Imagem (4) | 12 | ✅ |
| 4 | Mapa + Lista (2) | 14 | ✅ |
| 5 | Composables | - | ⏳ |
| 6 | Finalização | - | ⏳ |

**Total migrado:** 10 arquivos, 33 ocorrências

---

*Fase 4 concluída em 28/01/2026 por GitHub Copilot*
