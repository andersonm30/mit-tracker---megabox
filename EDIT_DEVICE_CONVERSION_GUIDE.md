# 🔧 GUIA DE CONVERSÃO: edit-device.vue → BaseModal

**ATENÇÃO:** Arquivo muito grande (2705 linhas) - conversão em 5 etapas

---

## 🎯 ETAPA 1: Backup do Original

```bash
cp src/tarkan/components/views/edit-device.vue src/tarkan/components/views/edit-device.vue.BACKUP
```

---

## 🎯 ETAPA 2: Substituir Template Header (linhas 1-23)

### PROCURAR (linhas 1-23):
```vue
<template>
  <el-dialog :lock-scroll="true" v-model="show" width="70%" @closed="onDialogClosed">

    <template v-slot:title>
      <div style="border-bottom: #e0e0e0 1px solid;padding: 20px;">
        <div class="modal-title">{{title}}</div>
      </div>
    </template>
    <template v-slot:footer>
      <div  style="border-top: #e0e0e0 1px solid;padding: 20px;display: flex;justify-content: space-between;">

        <div style="display: flex; gap: 10px;">
          <el-button type="info" plain @click="generatePDF()" v-if="formData.id">
            <i class="fas fa-file-pdf"></i> {{KT('device.generatePDF')}}
          </el-button>
        </div>
        <div style="display: flex; gap: 10px;">
          <el-button type="danger" plain @click="doCancel()">{{KT('cancel')}}</el-button>
          <el-button type="primary" @click="doSave()">{{KT('save')}}</el-button>
        </div>
      </div>
    </template>
```

### SUBSTITUIR POR:
```vue
<template>
  <BaseModal
    v-model="show"
    :title="title"
    icon="fas fa-location-arrow"
    width="70%"
    variant="device"
    @closed="onDialogClosed"
  >
    <template #footer>
      <div class="device-footer">
        <div class="device-footer-left">
          <el-button type="info" plain @click="generatePDF()" v-if="formData.id">
            <i class="fas fa-file-pdf"></i> {{KT('device.generatePDF')}}
          </el-button>
        </div>
        <div class="device-footer-right">
          <el-button type="danger" plain @click="doCancel()">{{KT('cancel')}}</el-button>
          <el-button type="primary" @click="doSave()">{{KT('save')}}</el-button>
        </div>
      </div>
    </template>
```

---

## 🎯 ETAPA 3: Fechar BaseModal (linha 2683)

### PROCURAR (última linha do template):
```vue
  </el-dialog>
</template>
```

### SUBSTITUIR POR:
```vue
  </BaseModal>
</template>
```

---

## 🎯 ETAPA 4: Atualizar Imports (linhas 2688-2707)

### PROCURAR (após `<script setup>`):
```js
import TabAttributes from "./tab-attributes";
import SpeedEventHistory from '../../../components/speed/SpeedEventHistory.vue'; // PR-10B
```

### SUBSTITUIR POR:
```js
import BaseModal from '../ui/BaseModal.vue';
import TabAttributes from "./tab-attributes";
import SpeedEventHistory from '../../../components/speed/SpeedEventHistory.vue';
```

---

## 🎯 ETAPA 5: Substituir TODOS os Inline Styles

### BUSCAR e SUBSTITUIR (Global - Regex):

#### 5.1 Form Rows
```regex
BUSCAR: style="display: flex; justify-content: space-between; gap: 20px;"
SUBSTITUIR: class="form-row"
```

#### 5.2 Form Columns
```regex
BUSCAR: style="flex: 0\.7;"
SUBSTITUIR: class="form-col-70"

BUSCAR: style="flex: 0\.6;"
SUBSTITUIR: class="form-col-60"

BUSCAR: style="flex: 0\.8;"
SUBSTITUIR: class="form-col-80"

BUSCAR: style="flex: 0\.5;"
SUBSTITUIR: class="form-col-50"

BUSCAR: style="flex: 0\.4;"
SUBSTITUIR: class="form-col-40"

BUSCAR: style="flex: 0\.33;"
SUBSTITUIR: class="form-col-33"

BUSCAR: style="flex: 1;"
SUBSTITUIR: class="form-full"
```

#### 5.3 Device State Section (linha ~49)
```regex
BUSCAR: style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; padding: 10px; background-color: #f8f8f8; border-radius: 5px;"
SUBSTITUIR: class="device-state-section"
```

#### 5.4 Speed Limit Input (linha ~134)
```regex
BUSCAR: style="display: flex; align-items: center; gap: 8px;"
SUBSTITUIR: class="speed-limit-input"
```

#### 5.5 Speed Limit Helper (linha ~147)
```regex
BUSCAR: style="font-size: 12px; color: #909399; margin-top: 4px;"
SUBSTITUIR: class="speed-limit-helper"
```

#### 5.6 User Option (linha ~220)
```regex
BUSCAR: style="display: flex; justify-content: space-between;"
SUBSTITUIR: class="user-option"
```

#### 5.7 User Email (linha ~222)
```regex
BUSCAR: style="color: #8492a6; font-size: 13px;"
SUBSTITUIR: class="user-email"
```

#### 5.8 Accumulator Input (linha ~380)
```regex
BUSCAR: style="display: flex; align-items: center; gap: 5px;"
SUBSTITUIR: class="accumulator-input"
```

#### 5.9 Field Helper (linha ~390)
```regex
BUSCAR: style="font-size: 11px; color: #909399; margin-top: 5px;"
SUBSTITUIR: class="field-helper"
```

#### 5.10 Vehicle Section Title (linha ~420)
```regex
BUSCAR: style="margin-top: 30px; margin-bottom: 15px; color: var\(--el-text-color-primary\); font-size: 16px; font-weight: 600;"
SUBSTITUIR: class="vehicle-section-title"
```

#### 5.11 Icon Tabs (linha ~430)
```regex
BUSCAR: style="margin-bottom: 10px;"
SUBSTITUIR: class="icon-tabs"
```

#### 5.12 Color Customization (linha ~500)
```regex
BUSCAR: style="display: flex;"
SUBSTITUIR: class="color-customization"
```

#### 5.13 Color Section (linha ~501)
```regex
BUSCAR: style="flex: 1;margin-right: 30px;"
SUBSTITUIR: class="color-section"
```

#### 5.14 Color Label (linha ~502)
```regex
BUSCAR: class="el-form-item__label" style="margin-bottom: -15px !important;font-weight: bold;display: flex;justify-content: space-between"
SUBSTITUIR: class="el-form-item__label color-label"
```

#### 5.15 Color Switch (linha ~504)
```regex
BUSCAR: style="margin-top: 0px;"
SUBSTITUIR: class="color-switch"
```

#### 5.16 Color Sliders (linha ~507)
```regex
BUSCAR: style="display: flex;flex-direction: column;padding: 10px;"
SUBSTITUIR: class="color-sliders"
```

#### 5.17 Slider Item (linha ~509)
```regex
BUSCAR: class="el-form-item" style="flex: 1;margin-right: 5px;"
SUBSTITUIR: class="el-form-item slider-item"
```

#### 5.18 Slider Label (linha ~510)
```regex
BUSCAR: class="el-form-item__label" style="margin-bottom: -15px !important"
SUBSTITUIR: class="el-form-item__label slider-label"
```

#### 5.19 Color Palette (linha ~540)
```regex
BUSCAR: style="margin-top: 15px;display: flex;flex-wrap: wrap;"
SUBSTITUIR: class="color-palette"
```

#### 5.20 Color Swatch (linha ~541)
```regex
BUSCAR: style="margin-right: 2px;margin-bottom: 2px;border: silver 1px solid;border-radius: 3px;cursor: pointer;"
SUBSTITUIR: class="color-swatch"
```

#### 5.21 Color Box (linha ~542)
```regex
BUSCAR: style="background: #3e8db9;width: 30px; height: 30px;"
SUBSTITUIR: class="color-box"
```

#### 5.22 Upload Placeholder (linha ~850)
```regex
BUSCAR: style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; color: #8c939d; text-align: center;"
SUBSTITUIR: class="upload-placeholder"
```

#### 5.23 Upload Text (linha ~853)
```regex
BUSCAR: style="font-size: 13px; color: #8c939d;"
SUBSTITUIR: class="upload-text"
```

#### 5.24 Empty State (linha ~1100)
```regex
BUSCAR: style="padding: 20px; text-align: center; color: #909399;"
SUBSTITUIR: class="empty-state"
```

#### 5.25 Section Title (linha ~230, ~270, ~800, ~860)
```regex
BUSCAR: class="section-title"
(já existe - não alterar)
```

#### 5.26 Section Description (linha ~232, ~272, ~802, ~862)
```regex
BUSCAR: class="section-description"
(já existe - não alterar)
```

---

## 🎯 ETAPA 6: Substituir TODO o CSS (linhas 2530-2705)

### DELETAR TODO CSS ANTIGO (linhas 2530-2705):
```vue
<style>

.el-select.el-select--large{
  width: 100%;
}

.el-dialog__body,.el-dialog__footer{
  padding: 0px !important;
}

.el-tabs__nav-wrap{
  padding-left: 20px;
  padding-right: 20px;
}

.el-tabs__content{
  padding-left: 20px;
  padding-right: 20px;
}

/* ... TODO O RESTO ATÉ </style> ... */
</style>
```

### SUBSTITUIR POR NOVO CSS:
```vue
<style scoped>
/* Usando tokens do BaseModal (--m-*) */
:deep(.bm--device .bm-body) {
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  padding: 0 !important;
}

.device-footer {
  border-top: 1px solid var(--m-border);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  background: var(--m-bg);
}

.device-footer-left,
.device-footer-right {
  display: flex;
  gap: 10px;
}

.el-tabs__nav-wrap {
  padding-left: 20px;
  padding-right: 20px;
  background: var(--m-bg);
}

.el-tabs__content {
  padding: 20px;
  background: var(--m-bg);
}

.form-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.form-col-70 { flex: 0.7; }
.form-col-60 { flex: 0.6; }
.form-col-80 { flex: 0.8; }
.form-col-50 { flex: 0.5; }
.form-col-40 { flex: 0.4; }
.form-col-33 { flex: 0.33; }
.form-full { flex: 1; }

.device-state-section {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  padding: 10px;
  background-color: var(--m-muted-bg);
  border-radius: 5px;
}

.speed-limit-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.speed-limit-helper {
  font-size: 12px;
  color: var(--m-subtext);
  margin-top: 4px;
}

.speed-warning {
  margin-top: 8px;
}

.user-form-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.user-section {
  background: var(--m-muted-bg);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--m-border);
}

.section-title {
  margin: 0 0 20px 0;
  color: var(--m-text);
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid var(--m-border);
  padding-bottom: 8px;
}

.section-description {
  color: var(--m-subtext);
  font-size: 13px;
  margin-bottom: 15px;
  line-height: 1.5;
}

.address-row {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.user-form-item {
  flex: 1;
  min-width: 180px;
}

.cep-field {
  flex: 0 0 140px;
  min-width: 140px;
}

.street-field {
  flex: 2;
  min-width: 200px;
}

.number-field {
  flex: 0 0 100px;
  min-width: 100px;
}

.user-option {
  display: flex;
  justify-content: space-between;
}

.user-email {
  color: var(--m-subtle);
  font-size: 13px;
}

.user-linked-alert {
  margin-top: 10px;
}

.changed-input {
  border-color: #f39c12 !important;
  box-shadow: 0 0 0 2px rgba(243, 156, 18, 0.2) !important;
}

.changed-indicator {
  color: #f39c12;
  font-size: 14px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.accumulator-input {
  display: flex;
  align-items: center;
  gap: 5px;
}

.field-helper {
  font-size: 11px;
  color: var(--m-subtext);
  margin-top: 5px;
}

.vehicle-section-title {
  margin-top: 30px;
  margin-bottom: 15px;
  color: var(--m-text);
  font-size: 16px;
  font-weight: 600;
}

.icon-tabs {
  margin-bottom: 10px;
}

.icon-grid-container {
  display: flex;
  border: 1px solid var(--m-border);
  border-radius: 3px;
  flex-wrap: wrap;
  margin-right: -10px;
  overflow-y: auto;
  max-height: 350px;
  padding: 5px;
  background: var(--m-bg);
}

.icon-grid-v2 {
  max-height: 500px;
  padding: 10px;
}

.icon-grid-container::-webkit-scrollbar {
  width: 10px;
}

.icon-grid-container::-webkit-scrollbar-track {
  background: var(--m-muted-bg);
  border-radius: 5px;
}

.icon-grid-container::-webkit-scrollbar-thumb {
  background: var(--m-subtle);
  border-radius: 5px;
}

.icon-grid-container::-webkit-scrollbar-thumb:hover {
  background: var(--m-text);
}

.color-customization {
  display: flex;
}

.color-section {
  flex: 1;
}

.color-section:first-child {
  margin-right: 30px;
}

.color-section:last-child {
  margin-left: 30px;
}

.color-label {
  margin-bottom: -15px !important;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
}

.color-switch {
  margin-top: 0px;
}

.color-sliders {
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.slider-item {
  flex: 1;
  margin-right: 5px;
}

.slider-label {
  margin-bottom: -15px !important;
}

.color-palette {
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
}

.color-swatch {
  margin-right: 2px;
  margin-bottom: 2px;
  border: 1px solid var(--m-border);
  border-radius: 3px;
  cursor: pointer;
}

.color-box {
  background: #3e8db9;
  width: 30px;
  height: 30px;
}

.photos-container {
  padding: 10px;
}

.photo-section {
  background: var(--m-muted-bg);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--m-border);
  margin-bottom: 20px;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.upload-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-label {
  font-weight: 600;
  color: var(--m-text);
  font-size: 14px;
  margin-bottom: 5px;
}

.photo-uploader {
  width: 100%;
}

.photo-uploader :deep(.el-upload) {
  width: 100%;
  border: 2px dashed var(--m-border);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  background-color: var(--m-bg);
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-uploader :deep(.el-upload:hover) {
  border-color: var(--m-accent-1);
  background-color: var(--m-muted-bg);
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: var(--m-subtext);
  text-align: center;
}

.upload-placeholder i {
  font-size: 32px;
  margin-bottom: 8px;
  color: var(--m-subtle);
}

.upload-text {
  font-size: 13px;
  color: var(--m-subtext);
}

.remove-photo-btn {
  width: 100%;
  margin-top: 5px;
}

.photo-description-input {
  margin-top: 5px;
}

.photo-alert {
  margin-top: 20px;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: var(--m-subtext);
}

.empty-state i {
  font-size: 24px;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .user-form-container {
    gap: 20px;
  }
  
  .user-section {
    padding: 15px;
  }
  
  .address-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .user-form-item,
  .cep-field,
  .street-field,
  .number-field {
    flex: none;
    min-width: 100%;
  }
  
  .section-title {
    font-size: 14px;
  }
  
  .device-footer {
    flex-direction: column !important;
    gap: 10px !important;
  }
  
  .device-footer > div {
    justify-content: center !important;
  }
  
  .el-tabs__content {
    padding-left: 10px;
    padding-right: 10px;
  }
  
  .el-tabs__nav-wrap {
    padding-left: 10px;
    padding-right: 10px;
  }
  
  .el-button {
    min-height: 44px;
    padding: 12px 20px;
  }

  .upload-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .photo-section {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .el-tabs__content {
    padding-left: 5px;
    padding-right: 5px;
  }
  
  .el-tabs__nav-wrap {
    padding-left: 5px;
    padding-right: 5px;
  }
  
  .user-section {
    padding: 10px;
    margin-bottom: 10px;
  }
  
  .section-title {
    font-size: 13px;
    margin-bottom: 15px;
  }
  
  .device-footer {
    position: sticky !important;
    bottom: 0 !important;
    background: var(--m-bg) !important;
    z-index: 1000 !important;
    border-top: 1px solid var(--m-border) !important;
    margin-top: 0 !important;
  }
  
  :deep(.bm--device .bm-body) {
    padding-bottom: 80px !important;
  }
  
  .el-button {
    min-height: 48px !important;
    font-size: 16px !important;
    width: 100% !important;
    margin-bottom: 5px !important;
  }

  .photo-section .section-title {
    font-size: 14px;
  }
  
  .photo-section .section-description {
    font-size: 12px;
  }
}
</style>
```

---

## ✅ CHECKLIST FINAL

Após todas as substituições:

- [ ] `<BaseModal` existe no topo do template
- [ ] `</BaseModal>` existe no fim do template
- [ ] `import BaseModal` existe no script
- [ ] **ZERO** `style="..."` inline no template (exceto :style="{'filter': ...}")
- [ ] `class="device-footer"` no footer
- [ ] `class="form-row"` em todos os divs flex
- [ ] `class="form-col-70"` etc substituindo `style="flex: 0.7;"`
- [ ] CSS novo tem `scoped` e usa tokens `var(--m-*)`
- [ ] onDialogClosed preservado
- [ ] doSave preservado
- [ ] generatePDF preservado

---

## 🚀 TESTAR

```bash
npm run dev
```

1. Abrir http://localhost:PORTA/devices
2. Clicar "Editar Dispositivo"
3. Verificar modal BaseModal renderiza
4. Alternar dark mode → cores mudam
5. Testar todas as 7 tabs
6. Salvar device → sem erros
7. Upload fotos → preview funciona
8. Gerar PDF → download ok

---

## ⚠️ ROLLBACK SE NECESSÁRIO

```bash
mv src/tarkan/components/views/edit-device.vue.BACKUP src/tarkan/components/views/edit-device.vue
```

---

**FIM DO GUIA** 🎉
