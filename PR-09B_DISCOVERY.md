# PR-09B: Campo "Velocidade de Notificação" - Discovery

**Data**: 19/01/2026  
**Objetivo**: Trazer o campo `attributes.speedLimit` para o formulário principal do veículo, com normalização km/h

---

## 🎯 Problema Atual

Hoje o campo `speedLimit` está **escondido** no tab-attributes (campo técnico genérico). O operador precisa:
1. Abrir edição do veículo
2. Ir na aba "Attributes"
3. Adicionar manualmente "speedLimit"
4. Salvar sem feedback visual claro

**Isso causa**:
- Configuração perdida/esquecida
- Unidade confusa (knots vs km/h depende do servidor)
- Operação manual técnica (não é UX amigável)

---

## 📍 Onde o Sistema Lê `speedLimit` Hoje

### **1. devices.item.vue (linha 378)** - LISTA DE VEÍCULOS
```javascript
const overLimit = Number(deviceProp.value?.attributes?.speedLimit ?? 0) > 0 
                  && sp > Number(deviceProp.value.attributes.speedLimit)
```
**Uso**: Detecta se veículo está acima do limite para exibir alerta visual na lista

**Problema**: Lê direto de `attributes.speedLimit` sem normalização clara

---

### **2. edit-device.vue (linhas 1433-1435)** - LOAD DO FORM
```javascript
if(formData.value[k]['speedLimit']){
  formData.value.attributes.speedLimit = parseFloat(
    T('units.'+store.getters['server/getAttribute']('speedUnit','speedUnit'),
    {speed: formData.value.attributes.speedLimit}).replace(/[^0-9]/g, '')
  );
}
```
**Uso**: Ao carregar veículo do backend, **converte de speedUnit do servidor para display**

**Problema**: 
- Conversão via função `T()` (i18n units)
- Depende de `speedUnit` global do servidor
- Não é consistente com SpeedNormalizer (PR-09A não aplica aqui)

---

### **3. edit-device.vue (linhas 1700-1701)** - SAVE DO FORM
```javascript
if (formData.value.attributes['speedLimit']) {
  formData.value.attributes.speedLimit = parseFloat(
    T('units.' + store.getters['server/getAttribute']('speedUnit', 'speedUnit') 
    + 'Reverse', {speed: formData.value.attributes.speedLimit}).replace(/[^0-9]/g, '')
  );
}
```
**Uso**: Ao salvar, **converte de display de volta para speedUnit do servidor**

**Problema**: 
- Lógica reversa via `T('units.knotReverse')` ou `T('units.kmhReverse')`
- Acoplamento com i18n
- Não usa SpeedNormalizer

---

### **4. tab-attributes.vue (linhas 61, 69)** - TAB TÉCNICO
```javascript
const defaultAvailableAttributes = {
  device: [
    'lockOnExit',
    'speedLimit'  // <-- Campo genérico de attributes
  ],
  geofence: [
    'color',
    'lockOnExit',
    'speedLimit'
  ]
}
```
**Uso**: Define `speedLimit` como um dos attributes editáveis no tab técnico

**O que será**: Com PR-09B, remover daqui e trazer pro form principal

---

### **5. routeEventDetector.js (linha 243)** - DETECÇÃO DE EVENTOS (FRONTEND)
```javascript
const detectSpeedEvents = (points, speedLimit = 80) => {
  // ...
  const isSpeeding = speed > speedLimit;
```
**Uso**: Detecta excesso de velocidade em trajetos (history.vue)

**Nota**: Hoje usa `speedLimit` passado como parâmetro (default 80 km/h). Pode buscar do device.

---

## 🛠️ Arquivos a Modificar (PR-09B)

### **Frontend (3 arquivos principais)**

1. **edit-device.vue** (mudança CIRÚRGICA)
   - Adicionar campo visual: `el-input-number` "Velocidade de Notificação (km/h)"
   - **REMOVER** conversões via `T('units.knot')` e `T('units.knotReverse')`
   - **ADICIONAR** uso de SpeedNormalizer (consistência com PR-09A)
   - Persistir em `attributes.speedLimitKmh` (novo) ou manter `speedLimit` mas **sempre em km/h**
   - Compatibilidade: se vier knots do legado, converter ao carregar

2. **devices.item.vue** (linha 378)
   - Atualizar leitura para usar `attributes.speedLimitKmh ?? attributes.speedLimit`
   - Garantir que valor lido está em km/h

3. **tab-attributes.vue** (linhas 61, 69)
   - REMOVER `speedLimit` da lista de attributes genéricos (agora é campo oficial do form)

### **Opcional (melhorias)**

4. **routeEventDetector.js**
   - Atualizar para buscar `speedLimit` do device ao invés de usar default 80

5. **I18n** (pt-BR.js, en-US.js, es-ES.js)
   - Adicionar: `device.speedLimitKmh: 'Velocidade de Notificação (km/h)'`

---

## ✅ Checklist de Implementação

### Fase 1: Campo no Form (edit-device.vue)
- [ ] Adicionar `el-input-number` no form visual
  - Label: "Velocidade de Notificação (km/h)"
  - Min: 0, Max: 300, Step: 1
  - Helper text: "Usada para alertas de excesso de velocidade"
  - Bind: `v-model="formData.attributes.speedLimitKmh"`

### Fase 2: Normalização (SpeedNormalizer)
- [ ] **REMOVER** conversões via `T('units.knot')` e `T('units.knotReverse')`
- [ ] **ADICIONAR** no load do form:
  ```javascript
  // Compatibilidade: converter legado se necessário
  if (formData.value.attributes.speedLimit && !formData.value.attributes.speedLimitKmh) {
    const serverUnit = store.getters['server/getAttribute']('speedUnit', 'kmh');
    formData.value.attributes.speedLimitKmh = SpeedNormalizer.toKmh(
      formData.value.attributes.speedLimit, 
      serverUnit
    );
  }
  ```
- [ ] **ADICIONAR** no save:
  ```javascript
  // Salvar sempre em km/h (sem conversão reversa)
  if (formData.value.attributes.speedLimitKmh) {
    formData.value.attributes.speedLimit = formData.value.attributes.speedLimitKmh;
  }
  ```

### Fase 3: Leitura Padronizada (devices.item.vue)
- [ ] Atualizar linha 378:
  ```javascript
  const speedLimitKmh = Number(deviceProp.value?.attributes?.speedLimitKmh 
                            ?? deviceProp.value?.attributes?.speedLimit 
                            ?? 0);
  const overLimit = speedLimitKmh > 0 && sp > speedLimitKmh;
  ```

### Fase 4: Remover do Tab Técnico (tab-attributes.vue)
- [ ] Remover `'speedLimit'` das listas de attributes
- [ ] Opcional: adicionar comentário `// Movido para campo oficial do form (PR-09B)`

### Fase 5: Testes
- [ ] Criar novo device, salvar 100 km/h, recarregar → deve exibir 100 km/h
- [ ] Editar device legado (com `speedLimit` em knots), salvar → deve converter
- [ ] Verificar que alerta visual na lista funciona (devices.item.vue)
- [ ] Garantir que notificações usam o novo valor

---

## 🎯 Resultado Esperado

**Antes (PR-08)**:
- Campo escondido em "Attributes"
- Operador não sabe onde configurar
- Conversão confusa (knots vs km/h)

**Depois (PR-09B)**:
- Campo visível no form principal ✅
- Label claro: "Velocidade de Notificação (km/h)" ✅
- Helper text explicativo ✅
- Sempre exibe e salva em km/h ✅
- Compatível com legado (auto-converte) ✅
- Consistente com SpeedNormalizer (PR-09A) ✅

---

## 📝 Commit Message (modelo)

```
feat(device): adiciona campo Velocidade de Notificação no form principal

PR-09B: Trazer speedLimit para o cadastro oficial do veículo

- Campo visual no edit-device.vue: "Velocidade de Notificação (km/h)"
- Normalização via SpeedNormalizer (consistência com PR-09A)
- Remove conversões legadas via T('units.knot'/'knotReverse')
- Persistência: attributes.speedLimitKmh (sempre em km/h)
- Compatibilidade: auto-converte speedLimit legado se necessário
- Atualiza leitura em devices.item.vue (alerta visual lista)
- Remove speedLimit do tab-attributes.vue (agora campo oficial)

Garantias:
- Sempre exibe e salva em km/h (zero conversões no frontend)
- Fallback gracioso para devices antigos
- UX clara: operador vê o campo no form principal
- Notificações usam valor oficial

Rollback seguro: campo opcional, devices sem speedLimit continuam funcionando

BREAKING CHANGES: Nenhum (compatibilidade total com legado)
```

---

## 🚀 Pronto para Implementação

**Complexidade**: Média (3 arquivos principais, lógica clara)  
**Risco**: Baixo (campo opcional, compatibilidade mantida)  
**Valor**: Alto (resolve dor real de operação, padroniza km/h no produto)

**Tempo estimado**: 60-90 minutos (implementação + testes)

---

**Próximo passo**: Implementar ou revisar este discovery?
