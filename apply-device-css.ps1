# ETAPA 6: Substituir TODO o CSS com tokens --m-*
$filePath = "src\tarkan\components\views\edit-device.vue"
$content = Get-Content $filePath -Raw -Encoding UTF8

Write-Host "===== ETAPA 6: Substituindo CSS =====" -ForegroundColor Cyan

# Encontrar linha onde começa <style>
$styleStart = $content.IndexOf('<style>')
$styleEnd = $content.LastIndexOf('</style>') + 8  # +8 para incluir "</style>"

if ($styleStart -eq -1 -or $styleEnd -eq 7) {
    Write-Host "ERRO: Não encontrou tags <style> no arquivo!" -ForegroundColor Red
    exit 1
}

# Separar em 3 partes: antes do style, style novo, depois do style
$beforeStyle = $content.Substring(0, $styleStart)
$afterStyle = $content.Substring($styleEnd)

# CSS novo completo com tokens --m-*
$newCSS = @'
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
'@

# Montar arquivo final
$newContent = $beforeStyle + $newCSS + $afterStyle

# Salvar
Set-Content -Path $filePath -Value $newContent -Encoding UTF8 -NoNewline

Write-Host "===== ETAPA 6 COMPLETA! =====" -ForegroundColor Green
Write-Host "CSS substituido com sucesso!" -ForegroundColor Cyan
Write-Host "- Tokens --m-* aplicados" -ForegroundColor Green
Write-Host "- scoped adicionado" -ForegroundColor Green
Write-Host "- Responsividade mantida" -ForegroundColor Green

Write-Host "`n===== CONVERSAO 100% COMPLETA! =====" -ForegroundColor Magenta
Write-Host "Arquivo convertido: $filePath" -ForegroundColor Yellow
Write-Host "`nPROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Executar: npm run dev" -ForegroundColor White
Write-Host "2. Testar modal (abrir/fechar 5x)" -ForegroundColor White
Write-Host "3. Verificar backdrop removido" -ForegroundColor White
Write-Host "4. Testar dark mode" -ForegroundColor White
Write-Host "5. Validar todas as 7 tabs" -ForegroundColor White
