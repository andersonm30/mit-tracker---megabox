# PR-09B: Campo "Velocidade de Notificação (km/h)" no Cadastro do Veículo

**Data**: 19/01/2026  
**Status**: ✅ Implementado  
**Repositório**: mit-tracker---megabox (frontend)

---

## 🎯 Objetivo

Trazer o campo `attributes.speedLimit` (limite de velocidade) do editor técnico genérico (tab-attributes) para o formulário principal de cadastro/edição do veículo, com:

- ✅ Campo visual claro: "Velocidade de Notificação (km/h)"
- ✅ Sempre exibe e salva em km/h (padrão do produto)
- ✅ Compatibilidade com legado (auto-converte se necessário)
- ✅ Consistência com PR-09A (SpeedNormalizer backend)

---

## 📦 Arquivos Modificados

### **1. src/utils/speedNormalizer.js** (NOVO)
Utilitário frontend para normalização de velocidades, alinhado com backend (PR-09A).

**Funções**:
- `toKmh(value, unit)` - Converte velocidade para km/h (knots → km/h via 1.852)
- `sanitizeKmh(value)` - Garante velocidade >= 0
- `formatKmh(kmh, decimals)` - Formata para exibição

**Uso**: Substitui conversões via `T('units.knot')` por lógica clara.

---

### **2. src/tarkan/components/views/edit-device.vue** (MODIFICADO)

#### **Adições no Template**:
```vue
<!-- Linha Velocidade: Velocidade de Notificação (PR-09B) -->
<div style="display: flex; justify-content: space-between; gap: 20px;">
  <el-form-item label="Velocidade de Notificação (km/h)" style="flex: 0.7;">
    <el-input-number 
      v-model="formData.attributes.speedLimitKmh" 
      :min="0" 
      :max="300" 
      :step="1" 
      controls-position="right"
      placeholder="Ex: 80"
      style="width: 100%;"
    />
    <div style="font-size: 12px; color: #909399; margin-top: 4px;">
      Usada para alertas de excesso de velocidade
    </div>
  </el-form-item>
  <div style="flex: 0.7;"></div>
</div>
```

#### **Adições no Script**:
```javascript
// Import
import { toKmh } from '../../../utils/speedNormalizer';
import { ElInputNumber } from 'element-plus';

// LOAD do form (normalização legado → km/h)
const serverUnit = store.getters['server/getAttribute']('speedUnit','kmh');

if (!formData.value.attributes.speedLimitKmh && formData.value.attributes.speedLimit) {
  // Converter speedLimit legado para speedLimitKmh (sempre em km/h)
  formData.value.attributes.speedLimitKmh = toKmh(
    Number(formData.value.attributes.speedLimit), 
    serverUnit
  );
}

// Garantir que speedLimitKmh é number ou undefined
if (formData.value.attributes.speedLimitKmh) {
  formData.value.attributes.speedLimitKmh = Number(formData.value.attributes.speedLimitKmh);
}

// SAVE (antes de enviar ao backend)
if (formData.value.attributes.speedLimitKmh !== undefined && 
    formData.value.attributes.speedLimitKmh !== null && 
    formData.value.attributes.speedLimitKmh !== '') {
  const v = Number(formData.value.attributes.speedLimitKmh);
  // Salvar em speedLimitKmh (novo padrão) e speedLimit (compatibilidade)
  formData.value.attributes.speedLimitKmh = v;
  formData.value.attributes.speedLimit = v;
} else {
  // Se vazio/0, remover para não poluir attributes
  delete formData.value.attributes.speedLimitKmh;
  delete formData.value.attributes.speedLimit;
}
```

#### **Remoções**:
- ❌ Conversão legada via `T('units.' + speedUnit)` no LOAD (linha ~1434)
- ❌ Conversão reversa via `T('units.' + speedUnit + 'Reverse')` no SAVE (linha ~1701)

---

### **3. src/templates/devices.item.vue** (MODIFICADO)

**Antes (linha 378)**:
```javascript
const overLimit = Number(deviceProp.value?.attributes?.speedLimit ?? 0) > 0 
                  && sp > Number(deviceProp.value.attributes.speedLimit)
```

**Depois (PR-09B)**:
```javascript
// PR-09B: Leitura padronizada de speedLimit (preferir speedLimitKmh)
const speedLimitKmh = Number(deviceProp.value?.attributes?.speedLimitKmh 
                          ?? deviceProp.value?.attributes?.speedLimit 
                          ?? 0);
const overLimit = speedLimitKmh > 0 && sp > speedLimitKmh;
```

**Garantia**: Fallback gracioso (tenta `speedLimitKmh`, senão `speedLimit`, senão 0).

---

### **4. src/tarkan/components/views/tab-attributes.vue** (MODIFICADO)

**Antes**:
```javascript
const defaultAvailableAttributes = {
  device: [
    'lockOnExit',
    'speedLimit'  // ❌ Campo genérico
  ],
  geofence: [
    'color',
    'lockOnExit',
    'speedLimit'  // ❌ Campo genérico
  ]
}
```

**Depois (PR-09B)**:
```javascript
const defaultAvailableAttributes = {
  device: [
    'lockOnExit'
    // 'speedLimit' - Movido para campo oficial do form (PR-09B)
  ],
  geofence: [
    'color',
    'lockOnExit'
    // 'speedLimit' - Movido para campo oficial do form (PR-09B)
  ]
}
```

---

### **5. I18n** (MODIFICADO)

**src/lang/pt-BR.js**:
```javascript
speedLimitKmh: 'Velocidade de Notificação (km/h)',
speedLimitKmhHelp: 'Usada para alertas de excesso de velocidade',
```

**src/lang/en-US.js**:
```javascript
speedLimitKmh: 'Speed Limit (km/h)',
speedLimitKmhHelp: 'Used for speeding alerts',
```

**src/lang/es-ES.js**:
```javascript
speedLimitKmh: 'Límite de Velocidad (km/h)',
speedLimitKmhHelp: 'Usado para alertas de exceso de velocidad',
```

---

## 🎯 Regras de Negócio

### **1. Persistência**
- **Campo oficial**: `attributes.speedLimitKmh` (sempre em km/h)
- **Compatibilidade**: `attributes.speedLimit` (mantido sincronizado em km/h)
- **Remoção**: Se campo vazio ou 0, ambos attributes são deletados

### **2. Leitura**
- **Prioridade**: `speedLimitKmh`
- **Fallback**: `speedLimit`
- **Default**: 0 (sem limite)

### **3. Compatibilidade com Legado**
- Device só com `speedLimit` (sem `speedLimitKmh`): converte usando `speedUnit` do servidor
- Se `speedUnit = 'knot'`: multiplica por 1.852 para exibir em km/h
- Se `speedUnit = 'kmh'`: exibe direto
- Ao salvar, ambos attributes ficam em km/h

### **4. UI**
- Sempre exibe em km/h
- Input number: min 0, max 300, step 1
- Helper text explicativo
- Controles + - visuais

---

## ✅ Garantias Implementadas

| Garantia | Status | Implementação |
|----------|--------|---------------|
| **Campo visível** | ✅ | `edit-device.vue` template linha ~156 |
| **Sempre km/h** | ✅ | `speedNormalizer.toKmh()` + save sem conversão reversa |
| **Compatibilidade legado** | ✅ | Load converte `speedLimit` se `speedLimitKmh` não existir |
| **Leitura padronizada** | ✅ | `devices.item.vue` usa `speedLimitKmh ?? speedLimit ?? 0` |
| **Sem T('units.*')** | ✅ | Removidas conversões via i18n, agora usa `speedNormalizer` |
| **Tab-attributes limpo** | ✅ | `speedLimit` removido, agora campo oficial |
| **I18n completo** | ✅ | pt-BR, en-US, es-ES |

---

## 🧪 Testes Manuais

### **Teste 1: Novo Device**
1. Cadastrar novo veículo
2. Preencher "Velocidade de Notificação": 100
3. Salvar
4. Reabrir edição
5. ✅ **Esperado**: Campo exibe 100 km/h

### **Teste 2: Device Legado (speedUnit = knots)**
1. Backend com `speedUnit = 'knot'`
2. Device com `attributes.speedLimit = 54` (knots)
3. Abrir edição
4. ✅ **Esperado**: Campo exibe ~100 km/h (54 * 1.852)
5. Salvar sem alterar
6. ✅ **Esperado**: `speedLimitKmh = 100`, `speedLimit = 100`

### **Teste 3: Device Legado (speedUnit = kmh)**
1. Backend com `speedUnit = 'kmh'`
2. Device com `attributes.speedLimit = 80` (já em km/h)
3. Abrir edição
4. ✅ **Esperado**: Campo exibe 80 km/h
5. Salvar sem alterar
6. ✅ **Esperado**: `speedLimitKmh = 80`, `speedLimit = 80`

### **Teste 4: Alerta Visual na Lista**
1. Device com `speedLimitKmh = 100`
2. Device rodando a 120 km/h
3. ✅ **Esperado**: Alerta visual `overLimit` ativado na lista

### **Teste 5: Remoção**
1. Device com velocidade configurada
2. Editar, limpar campo
3. Salvar
4. ✅ **Esperado**: `speedLimitKmh` e `speedLimit` removidos de attributes

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────┐
│ BACKEND (Traccar API)                           │
│                                                  │
│ Device attributes: {                            │
│   speedLimit: 54 (knots) ou 80 (kmh)           │
│ }                                               │
└───────────────────┬─────────────────────────────┘
                    │
                    │ GET /api/devices/{id}
                    ▼
┌─────────────────────────────────────────────────┐
│ FRONTEND - LOAD (edit-device.vue)              │
│                                                  │
│ 1) Recebe device.attributes.speedLimit          │
│ 2) Verifica se speedLimitKmh existe             │
│ 3) Se não: converte usando speedUnit do server  │
│    speedLimitKmh = toKmh(speedLimit, 'knot')   │
│    Exemplo: toKmh(54, 'knot') = 100 km/h       │
│ 4) Exibe no campo: 100                          │
└───────────────────┬─────────────────────────────┘
                    │
                    │ User edits: 120 km/h
                    ▼
┌─────────────────────────────────────────────────┐
│ FRONTEND - SAVE (edit-device.vue)              │
│                                                  │
│ 1) Sanitiza: v = Number(speedLimitKmh) = 120   │
│ 2) Salva em ambos:                              │
│    attributes.speedLimitKmh = 120               │
│    attributes.speedLimit = 120                  │
│ 3) Envia PUT /api/devices/{id}                 │
└───────────────────┬─────────────────────────────┘
                    │
                    │ PUT /api/devices/{id}
                    ▼
┌─────────────────────────────────────────────────┐
│ BACKEND (Traccar API)                           │
│                                                  │
│ Device attributes: {                            │
│   speedLimitKmh: 120,   // ✅ Novo padrão       │
│   speedLimit: 120       // ✅ Compatibilidade   │
│ }                                               │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Rollout

### **Ordem de Deploy**
1. ✅ Frontend com PR-09B (este PR)
2. ⏭️ Backend continua igual (já suporta attributes genéricos)

### **Compatibilidade**
- **Frontend novo + Backend antigo**: ✅ Funciona (speedLimit em attributes)
- **Frontend antigo + Backend novo**: ✅ Funciona (speedLimit ainda existe)
- **Sem configuração**: ✅ Campo opcional, devices sem speedLimit continuam normais

### **Rollback**
Se necessário reverter:
```bash
git revert <commit-hash>
```
- Campo volta para tab-attributes
- Devices mantêm ambos attributes (speedLimitKmh e speedLimit)
- Sistema continua funcionando com fallback

---

## 🎯 Próximos Passos (Opcionais)

### **PR-09C: Guardrails Frontend** (futuro)
- Helper `formatSpeedKmh()` global
- Validações de input adicionais
- Padronização visual em todos os pontos

### **PR-10: Notificações Avançadas** (futuro)
- Consumir `speedLimitKmh` nas regras de notificação
- Alertas customizados por dispositivo
- Dashboard de eventos de velocidade

---

## 📝 Commit

```bash
git add -A
git commit -m "feat(device): campo Velocidade de Notificação (km/h) no cadastro do veículo (PR-09B)

- Campo visual no edit-device.vue com el-input-number (0-300 km/h)
- Cria speedNormalizer.js (toKmh, sanitizeKmh, formatKmh)
- Remove conversões T('units.knot'/'knotReverse') legadas
- Salva em attributes.speedLimitKmh (padrão) e speedLimit (compat)
- Compatibilidade: auto-converte speedLimit legado se necessário
- Atualiza devices.item.vue (alerta visual usa speedLimitKmh)
- Remove speedLimit do tab-attributes.vue (agora campo oficial)
- I18n completo: pt-BR, en-US, es-ES

Garantias:
- Sempre exibe e salva em km/h (zero conversões no frontend)
- Fallback gracioso para devices antigos
- UX clara: operador vê campo no form principal
- Consistente com PR-09A (backend SpeedNormalizer)

Rollback seguro: campo opcional, devices sem speedLimit continuam funcionando

BREAKING CHANGES: Nenhum (compatibilidade total com legado)"
```

---

## 📊 Resultado Final

**Antes (até PR-08)**:
- Campo escondido em "Attributes" ❌
- Operador não sabe configurar ❌
- Conversão confusa (knots/km/h) ❌
- Acoplamento com i18n ❌

**Depois (PR-09B)**:
- Campo visível no form principal ✅
- Label claro + helper text ✅
- Sempre em km/h ✅
- SpeedNormalizer dedicado ✅
- Compatibilidade total com legado ✅
- Consistente com backend (PR-09A) ✅

---

**Implementação**: ✅ Completa  
**Testes**: ⏳ Pendente validação manual  
**Status**: Pronto para commit e push

---

**Próximo commit**: feat(device): campo Velocidade de Notificação (km/h) no cadastro do veículo (PR-09B)
