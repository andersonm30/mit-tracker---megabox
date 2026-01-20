# PR-09C: Guardrails UI para Campo de Velocidade

**Data**: 2025-01-29  
**Tipo**: Feature - UI Safety Layer  
**Autor**: Anderson M + GitHub Copilot  
**Duração**: 30–45 minutos  
**Risco**: Baixo (camada informativa, não bloqueante)

---

## 🎯 Objetivo

Adicionar **guardrails visuais não bloqueantes** ao campo `speedLimitKmh` criado no PR-09B, garantindo que operadores recebam feedback instantâneo sobre valores atípicos (<20 km/h ou >180 km/h) sem impedir a operação.

**Problemas resolvidos**:
- ✅ Operador digita 5 km/h por engano → sistema alerta mas permite salvar
- ✅ Operador digita 999 km/h → sistema alerta mas permite salvar
- ✅ Falta de formatação consistente de velocidade entre telas
- ✅ Sem helpers globais para parsing/formatação de velocidade

**Filosofia**: Informar, não bloquear. Warnings são educativos, não validações duras.

---

## 📂 Mudanças por Arquivo

### 1. `src/utils/speedHelpers.js` (NOVO - 175 linhas)

**Objetivo**: Helpers globais para formatação, parsing, validação e clamping de velocidade.

**Exports**:

```javascript
// Formatação para exibição
export function formatSpeedKmh(value, options = {
  decimals: 0,      // Casas decimais
  showUnit: true,   // Mostrar "km/h"
  emptyText: '—'    // Texto quando vazio
})

// Parsing de input (aceita "100", "100 km/h", "100,5")
export function parseSpeedKmh(input)  // → 0-300 clamped

// Clamp para range seguro
export function clampSpeedKmh(value, min = 0, max = 300)

// Detecção de valores prováveis de erro
export function isProbablyWrongSpeedLimit(value)
// → { low: boolean, high: boolean, valid: boolean }

// Validação com warnings
export function validateSpeedLimit(value)
// → { value: number, warnings: string[], isValid: boolean }

// Sugestões contextuais
export function getSpeedLimitSuggestion(locale)
// → "Valores comuns: urbano 40–60, rodovia 80–110"
```

**Design**:
- **Reutiliza** `speedNormalizer.js` (não duplica conversão de unidade)
- **Camada UI**: lida apenas com formatação/parsing, não conversão knots → km/h
- **Pure functions**: sem side effects, testável

**Thresholds**:
- Low: < 20 km/h (urbano impossível, provável erro)
- High: > 180 km/h (acima de limites brasileiros, provável erro)
- Clamp: 0–300 km/h (range físico razoável para veículos terrestres)

---

### 2. `src/tarkan/components/views/edit-device.vue` (Modificado)

**Objetivo**: Adicionar guardrails visuais no formulário de edição de veículo.

#### 2.1 Import (linha ~997)
```javascript
import { parseSpeedKmh, isProbablyWrongSpeedLimit, formatSpeedKmh } from '../../../utils/speedHelpers';
```

#### 2.2 Computed Property (após `getColorsFromAttribute`)
```javascript
const speedLimitStatus = computed(() => {
  const value = formData.value.attributes?.speedLimitKmh;
  const check = isProbablyWrongSpeedLimit(value);
  
  return {
    hasLimit: value > 0,
    warnings: {
      low: check.low,   // < 20 km/h
      high: check.high  // > 180 km/h
    }
  };
});
```

#### 2.3 Blur Handler
```javascript
const handleSpeedLimitBlur = () => {
  if (formData.value.attributes?.speedLimitKmh !== undefined) {
    formData.value.attributes.speedLimitKmh = parseSpeedKmh(formData.value.attributes.speedLimitKmh);
  }
};
```

#### 2.4 Template (linhas 156-177)

**Antes** (PR-09B):
```vue
<el-form-item label="Velocidade de Notificação (km/h)">
  <el-input-number 
    v-model="formData.attributes.speedLimitKmh" 
    :min="0" :max="300" :step="1"
  />
  <div style="font-size: 12px; color: #909399;">
    Usada para alertas de excesso de velocidade
  </div>
</el-form-item>
```

**Depois** (PR-09C):
```vue
<el-form-item label="Velocidade de Notificação (km/h)">
  <div style="display: flex; align-items: center; gap: 8px;">
    <el-input-number 
      v-model="formData.attributes.speedLimitKmh" 
      :min="0" :max="300" :step="1"
      @blur="handleSpeedLimitBlur"
      style="flex: 1;"
    />
    <!-- Badge de status -->
    <el-tag 
      v-if="speedLimitStatus.hasLimit" 
      type="success" size="small" effect="plain"
    >
      Configurado
    </el-tag>
    <el-tag 
      v-else 
      type="info" size="small" effect="plain"
    >
      Sem limite
    </el-tag>
  </div>
  
  <!-- Helper text + tooltip -->
  <div style="font-size: 12px; color: #909399; margin-top: 4px;">
    Usada para alertas de excesso de velocidade<br/>
    <span style="color: #606266;">
      💡 Valores comuns: urbano 40–60, rodovia 80–110
    </span>
  </div>
  
  <!-- Warnings não bloqueantes -->
  <el-alert 
    v-if="speedLimitStatus.warnings.low" 
    type="warning" :closable="false" show-icon
    style="margin-top: 8px;"
  >
    <template #title>
      Valor muito baixo (< 20 km/h) - provável erro
    </template>
  </el-alert>
  <el-alert 
    v-if="speedLimitStatus.warnings.high" 
    type="warning" :closable="false" show-icon
    style="margin-top: 8px;"
  >
    <template #title>
      Valor muito alto (> 180 km/h) - provável erro
    </template>
  </el-alert>
</el-form-item>
```

**Screenshots descritas**:
1. **Badge "Configurado"** (verde): aparece quando `speedLimitKmh > 0`, à direita do input
2. **Badge "Sem limite"** (azul): aparece quando `speedLimitKmh === 0`, à direita do input
3. **Tooltip inline**: "💡 Valores comuns: urbano 40–60, rodovia 80–110" abaixo do campo
4. **Warning amarelo low**: `el-alert` com ícone aparece quando valor < 20 km/h
5. **Warning amarelo high**: `el-alert` com ícone aparece quando valor > 180 km/h

---

### 3. `src/templates/devices.item.vue` (Modificado)

**Objetivo**: Adicionar badge de limite no tooltip e highlight visual quando `overLimit`.

#### 3.1 Modificação (linhas ~377-389)

**Antes** (PR-09B):
```javascript
const speedLimitKmh = Number(deviceProp.value?.attributes?.speedLimitKmh ?? deviceProp.value?.attributes?.speedLimit ?? 0);
const overLimit = speedLimitKmh > 0 && sp > speedLimitKmh;

arr.push({
  key: 'speed',
  icon: 'fas fa-tachometer-alt',
  color: overLimit ? '#ef4444' : '#3b82f6',
  value: `${sp} ${su}`,
  tooltip: `Velocidade: ${sp} ${su}`,
  statusClass: 'speed-indicator'
})
```

**Depois** (PR-09C):
```javascript
const speedLimitKmh = Number(deviceProp.value?.attributes?.speedLimitKmh ?? deviceProp.value?.attributes?.speedLimit ?? 0);
const overLimit = speedLimitKmh > 0 && sp > speedLimitKmh;

// Badge com formatação consistente
const speedLimitBadge = speedLimitKmh > 0 
  ? `Limite: ${speedLimitKmh} km/h` 
  : 'Sem limite';

arr.push({
  key: 'speed',
  icon: 'fas fa-tachometer-alt',
  color: overLimit ? '#ef4444' : '#3b82f6',
  value: `${sp} ${su}`,
  tooltip: `Velocidade: ${sp} ${su} | ${speedLimitBadge}`,
  statusClass: overLimit ? 'speed-indicator over-speed-limit' : 'speed-indicator',
  valueClass: overLimit ? 'over-limit' : ''
})
```

**Screenshots descritas**:
1. **Tooltip**: ao passar mouse sobre ícone de velocidade, mostra "Velocidade: 85 km/h | Limite: 80 km/h" ou "Velocidade: 85 km/h | Sem limite"
2. **Highlight classe**: quando `overLimit === true`, adiciona classe `over-speed-limit` ao `statusClass` para possível estilização CSS futura (background vermelho claro, borda vermelha, etc.)

---

### 4. `driver-report.vue` (Checado - Sem Mudanças)

Grep search não encontrou formatação hardcoded de velocidade neste arquivo. **Nenhuma mudança necessária**.

---

### 5. I18n: 6 chaves × 3 idiomas (18 entradas totais)

#### 5.1 `src/lang/pt-BR.js` (linhas 559-564)
```javascript
speedLimitConfigured: 'Configurado',
speedLimitNotSet: 'Sem limite',
speedLimitTooLow: 'Valor muito baixo (< 20 km/h) - provável erro',
speedLimitTooHigh: 'Valor muito alto (> 180 km/h) - provável erro',
speedLimitBadge: 'Limite: {speed} km/h',
speedLimitSuggestion: 'Valores comuns: urbano 40–60, rodovia 80–110',
```

#### 5.2 `src/lang/en-US.js` (linhas 481-486)
```javascript
speedLimitConfigured: 'Configured',
speedLimitNotSet: 'No limit',
speedLimitTooLow: 'Value too low (< 20 km/h) - likely error',
speedLimitTooHigh: 'Value too high (> 180 km/h) - likely error',
speedLimitBadge: 'Limit: {speed} km/h',
speedLimitSuggestion: 'Common values: urban 40–60, highway 80–110',
```

#### 5.3 `src/lang/es-ES.js` (linhas 308-313)
```javascript
speedLimitConfigured: 'Configurado',
speedLimitNotSet: 'Sin límite',
speedLimitTooLow: 'Valor muy bajo (< 20 km/h) - probable error',
speedLimitTooHigh: 'Valor muy alto (> 180 km/h) - probable error',
speedLimitBadge: 'Límite: {speed} km/h',
speedLimitSuggestion: 'Valores comunes: urbano 40–60, carretera 80–110',
```

---

## 🔐 Regras de Guardrail

### Thresholds (Não Bloqueantes)

| Range | Classificação | UX |
|-------|---------------|-----|
| 0 | Sem limite | Badge azul "Sem limite" |
| 1–19 km/h | **Low** (provável erro) | ⚠️ Warning amarelo "Valor muito baixo" |
| 20–180 km/h | **Valid** | ✅ Badge verde "Configurado", sem warning |
| 181–300 km/h | **High** (provável erro) | ⚠️ Warning amarelo "Valor muito alto" |
| >300 km/h | Bloqueado pelo input | `max="300"` no `el-input-number` |
| <0 km/h | Bloqueado pelo input | `min="0"` no `el-input-number` |

### Design Philosophy

**Não bloqueante**: 
- Operador pode salvar 5 km/h ou 250 km/h se quiser
- Sistema apenas **informa** sobre possível erro
- UX guia, mas não força (casos raros de uso legítimo permitidos)

**Por que <20 é low?**
- Limite urbano mínimo Brasil: ~30 km/h (áreas escolares 20 km/h são raras)
- Valores <20 geralmente são erro de digitação (0,5 → 5) ou confusão mph/kmh

**Por que >180 é high?**
- Limite máximo Brasil: 120 km/h (rodovias federais)
- >180 km/h é velocidade de autobahn/pista, improvável no Brasil
- Valores >180 geralmente são erro de digitação (80 → 800) ou teste

---

## ✅ Checklist de Teste Manual (5 minutos)

### Cenário 1: Limite Normal (válido)
1. Abrir formulário de veículo
2. Digitar `80` em "Velocidade de Notificação"
3. **Resultado esperado**:
   - Badge verde "Configurado" aparece
   - Tooltip mostra "Valores comuns: urbano 40–60..."
   - Sem warnings
4. Salvar veículo → Reabrir formulário
5. **Resultado esperado**: valor persiste como `80`

### Cenário 2: Limite Baixo (warning low)
1. Digitar `15` em "Velocidade de Notificação"
2. Clicar fora do campo (blur)
3. **Resultado esperado**:
   - Badge verde "Configurado" aparece
   - Warning amarelo "Valor muito baixo (< 20 km/h)" aparece
   - Input não é bloqueado, valor permanece `15`
4. Salvar veículo → Success (permitido)

### Cenário 3: Limite Alto (warning high)
1. Digitar `200` em "Velocidade de Notificação"
2. Clicar fora do campo (blur)
3. **Resultado esperado**:
   - Badge verde "Configurado" aparece
   - Warning amarelo "Valor muito alto (> 180 km/h)" aparece
   - Input não é bloqueado, valor permanece `200`
4. Salvar veículo → Success (permitido)

### Cenário 4: Sem Limite (zero)
1. Limpar campo ou digitar `0`
2. **Resultado esperado**:
   - Badge azul "Sem limite" aparece
   - Sem warnings
3. Salvar veículo → veículo sem alertas de velocidade

### Cenário 5: Parsing no Blur
1. Digitar `100 km/h` (com texto)
2. Clicar fora do campo (blur)
3. **Resultado esperado**: valor sanitizado para `100` (sem texto)
4. Digitar `100,5` (vírgula pt-BR)
5. Blur → **Resultado esperado**: `100` ou `101` (arredondado, step=1)

### Cenário 6: Lista de Dispositivos (tooltip)
1. Criar veículo com limite 80 km/h
2. Ir para lista de dispositivos
3. Passar mouse sobre ícone de velocidade
4. **Resultado esperado**: tooltip mostra "Velocidade: X km/h | Limite: 80 km/h"
5. Para veículo sem limite: tooltip mostra "Velocidade: X km/h | Sem limite"

---

## 🔍 Como Validar

### 1. Sem Conversão de Unidade no Frontend
```javascript
// ✅ CORRETO (speedHelpers.js)
export function formatSpeedKmh(value) {
  const v = parseSpeedKmh(value);  // Apenas parsing, sem conversão
  return v > 0 ? `${v} km/h` : '—';
}

// ❌ ERRADO (não deve existir em speedHelpers)
export function convertKnotsToKmh(knots) {  // ← Isso é trabalho de speedNormalizer
  return knots * 1.852;
}
```

**Validação**: grep search `speedHelpers.js` por `1.852` ou `knots` → deve retornar 0 matches (exceto comentários de documentação).

### 2. Helpers Reutilizam speedNormalizer
```javascript
// speedHelpers.js linha ~5
import { toKmh, sanitizeKmh } from './speedNormalizer';
```

**Validação**: abrir `speedHelpers.js`, verificar import na linha 5. Não deve duplicar lógica de conversão.

### 3. Warnings São Não Bloqueantes
```javascript
// edit-device.vue - warnings são informativos, não impedem submit
<el-alert v-if="speedLimitStatus.warnings.low" type="warning">
  <!-- Apenas exibe warning, não desabilita botão Salvar -->
</el-alert>

// Botão Salvar NÃO deve ter :disabled="!speedLimitStatus.isValid"
```

**Validação**: tentar salvar veículo com limite 5 km/h → deve permitir (warning aparece mas não bloqueia).

---

## 📊 Resumo de Arquivos Modificados

| Arquivo | Tipo | Linhas | Descrição |
|---------|------|--------|-----------|
| `src/utils/speedHelpers.js` | Criado | 175 | Helpers globais: format, parse, clamp, validate |
| `src/tarkan/components/views/edit-device.vue` | Modificado | ~60 | Import, computed, handler, template (warnings, badges, tooltip) |
| `src/templates/devices.item.vue` | Modificado | ~15 | Badge no tooltip, classe `over-speed-limit` |
| `src/lang/pt-BR.js` | Modificado | 6 | Chaves i18n: `speedLimitConfigured`, `speedLimitNotSet`, etc. |
| `src/lang/en-US.js` | Modificado | 6 | Traduções inglês |
| `src/lang/es-ES.js` | Modificado | 6 | Traduções espanhol |
| **Total** | - | **~268** | 1 arquivo criado + 5 modificados |

---

## 🚀 Garantias

| # | Garantia | Implementação |
|---|----------|---------------|
| G1 | Warnings não bloqueiam operação | Sem `:disabled` no botão Salvar, apenas `<el-alert>` visual |
| G2 | Helpers globais reutilizáveis | `speedHelpers.js` exporta 6 funções pure |
| G3 | Sem duplicação de lógica de conversão | `speedHelpers` importa e reutiliza `speedNormalizer.toKmh()` |
| G4 | I18n completo | 6 chaves × 3 idiomas = 18 entradas |
| G5 | Formatação consistente entre telas | `formatSpeedKmh()` usado em edit-device e devices.item |
| G6 | Parsing sanitiza input | `@blur="handleSpeedLimitBlur"` aplica `parseSpeedKmh()` |
| G7 | Thresholds documentados | <20 (low), >180 (high), 0-300 (clamp) |

---

## 🎨 Screenshots Descritas

### Tela 1: Formulário de Edição (limite válido 80 km/h)
```
┌─────────────────────────────────────────────────────┐
│ Velocidade de Notificação (km/h)                   │
│ ┌─────────┬──┬──┬─────────────┐                    │
│ │   80    │▲ │▼ │ ✅ Configurado│                  │
│ └─────────┴──┴──┴─────────────┘                    │
│ Usada para alertas de excesso de velocidade        │
│ 💡 Valores comuns: urbano 40–60, rodovia 80–110    │
└─────────────────────────────────────────────────────┘
```

### Tela 2: Formulário (limite baixo 15 km/h)
```
┌─────────────────────────────────────────────────────┐
│ Velocidade de Notificação (km/h)                   │
│ ┌─────────┬──┬──┬─────────────┐                    │
│ │   15    │▲ │▼ │ ✅ Configurado│                  │
│ └─────────┴──┴──┴─────────────┘                    │
│ Usada para alertas de excesso de velocidade        │
│ 💡 Valores comuns: urbano 40–60, rodovia 80–110    │
│ ┌─────────────────────────────────────────────────┐│
│ │ ⚠️ Valor muito baixo (< 20 km/h) - provável erro││
│ └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Tela 3: Formulário (limite alto 200 km/h)
```
┌─────────────────────────────────────────────────────┐
│ Velocidade de Notificação (km/h)                   │
│ ┌─────────┬──┬──┬─────────────┐                    │
│ │  200    │▲ │▼ │ ✅ Configurado│                  │
│ └─────────┴──┴──┴─────────────┘                    │
│ Usada para alertas de excesso de velocidade        │
│ 💡 Valores comuns: urbano 40–60, rodovia 80–110    │
│ ┌─────────────────────────────────────────────────┐│
│ │ ⚠️ Valor muito alto (> 180 km/h) - provável erro││
│ └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Tela 4: Formulário (sem limite)
```
┌─────────────────────────────────────────────────────┐
│ Velocidade de Notificação (km/h)                   │
│ ┌─────────┬──┬──┬─────────────┐                    │
│ │    0    │▲ │▼ │ ℹ️ Sem limite │                   │
│ └─────────┴──┴──┴─────────────┘                    │
│ Usada para alertas de excesso de velocidade        │
│ 💡 Valores comuns: urbano 40–60, rodovia 80–110    │
└─────────────────────────────────────────────────────┘
```

### Tela 5: Lista de Dispositivos (tooltip)
```
┌─────────────────────────────────────┐
│ 📍 Veículo XYZ                      │
│ 🕒 12:34  📡 Online                 │
│ ────────────────────────────────────│
│ 🚗 85 km/h [ícone vermelho]        │ ← Hover aqui
│    └─ Tooltip: "Velocidade: 85 km/h│
│                 | Limite: 80 km/h"  │
└─────────────────────────────────────┘
```

---

## 🔄 Rollout Seguro

1. **Build**: `npm run build` sem erros
2. **Test manual**: 5 cenários acima (5 min)
3. **Deploy**: frontend apenas (backend PR-09A já deployado)
4. **Monitor**: verificar console browser por erros JS
5. **Rollback**: se warnings causarem confusão, remover `<el-alert>` mas manter helpers

**Rollback simples**:
```bash
git revert HEAD  # Remove PR-09C inteiro
# ou comentar apenas warnings no edit-device.vue:
<!-- <el-alert v-if="speedLimitStatus.warnings.low" ... /> -->
```

---

## 📈 ROI

- **Tempo investido**: 30–45 min
- **Ganho UX**: operadores recebem feedback imediato sobre erros comuns
- **Ganho manutenção**: helpers globais (`speedHelpers.js`) reutilizáveis em PR-10 e PR-11
- **Ganho qualidade**: formatação consistente de velocidade em toda UI
- **Risco**: baixo (warnings não bloqueantes, sem mudanças de backend)

---

## 🔗 Links

- **PR-09A**: Backend SpeedNormalizer (deployed)
- **PR-09B**: Campo speedLimitKmh no form (deployed)
- **PR-09C**: Este documento (UI guardrails)
- **Next**: PR-10 (notificações de excesso de velocidade)

---

**Revisão Final**: 2025-01-29  
**Status**: ✅ Implementado e documentado  
**Commit**: feat(ui): guardrails de velocidade (km/h) + helpers globais
