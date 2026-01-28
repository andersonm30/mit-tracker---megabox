# Script para aplicar conversão edit-device.vue → BaseModal
# Etapa 5: Substituições de inline styles

$filePath = "src\tarkan\components\views\edit-device.vue"
$content = Get-Content $filePath -Raw -Encoding UTF8

Write-Host "🚀 Aplicando conversão edit-device.vue → BaseModal..." -ForegroundColor Cyan
Write-Host "📄 Arquivo: $filePath" -ForegroundColor Yellow

# Contador de substituições
$count = 0

# 5.1 Form Rows
$before = $content
$content = $content -replace 'style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px;"', 'class="form-row"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px;"')).Count); $count += $replaced; Write-Host "OK Form rows (margin-bottom): $replaced" -ForegroundColor Green }

$before = $content
$content = $content -replace 'style="display: flex; justify-content: space-between; gap: 20px;"', 'class="form-row"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="display: flex; justify-content: space-between; gap: 20px;"')).Count); $count += $replaced; Write-Host "OK Form rows: $replaced" -ForegroundColor Green }

# 5.2 Form Columns
$before = $content
$content = $content -replace 'style="flex: 0\.7;"', 'class="form-col-70"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="flex: 0\.7;"')).Count); $count += $replaced; Write-Host "OK Form col 70%: $replaced" -ForegroundColor Green }

$before = $content
$content = $content -replace 'style="flex: 0\.6;"', 'class="form-col-60"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="flex: 0\.6;"')).Count); $count += $replaced; Write-Host "OK Form col 60%: $replaced" -ForegroundColor Green }

$before = $content
$content = $content -replace 'style="flex: 0\.8;"', 'class="form-col-80"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="flex: 0\.8;"')).Count); $count += $replaced; Write-Host "OK Form col 80%: $replaced" -ForegroundColor Green }

$before = $content
$content = $content -replace 'style="flex: 0\.5;"', 'class="form-col-50"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="flex: 0\.5;"')).Count); $count += $replaced; Write-Host "OK Form col 50%: $replaced" -ForegroundColor Green }

$before = $content
$content = $content -replace 'style="flex: 0\.4;"', 'class="form-col-40"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="flex: 0\.4;"')).Count); $count += $replaced; Write-Host "OK Form col 40%: $replaced" -ForegroundColor Green }

$before = $content
$content = $content -replace 'style="flex: 0\.33;"', 'class="form-col-33"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="flex: 0\.33;"')).Count); $count += $replaced; Write-Host "OK Form col 33%: $replaced" -ForegroundColor Green }

$before = $content
$content = $content -replace 'style="flex: 1;"', 'class="form-full"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="flex: 1;"')).Count); $count += $replaced; Write-Host "OK Form full width: $replaced" -ForegroundColor Green }

# 5.3 Device State Section
$before = $content
$content = $content -replace 'style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; padding: 10px; background-color: #f8f8f8; border-radius: 5px;"', 'class="device-state-section"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; padding: 10px; background-color: #f8f8f8; border-radius: 5px;"')).Count); $count += $replaced; Write-Host "OK Device state section: $replaced" -ForegroundColor Green }

# 5.4 Speed Limit Input
$before = $content
$content = $content -replace 'style="display: flex; align-items: center; gap: 8px;"', 'class="speed-limit-input"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="display: flex; align-items: center; gap: 8px;"')).Count); $count += $replaced; Write-Host "OK Speed limit input: $replaced" -ForegroundColor Green }

# 5.5 Speed Limit Helper
$before = $content
$content = $content -replace 'style="font-size: 12px; color: #909399; margin-top: 4px;"', 'class="speed-limit-helper"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="font-size: 12px; color: #909399; margin-top: 4px;"')).Count); $count += $replaced; Write-Host "OK Speed limit helper: $replaced" -ForegroundColor Green }

# 5.6 User Option
$before = $content
$content = $content -replace 'style="display: flex; justify-content: space-between;"', 'class="user-option"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="display: flex; justify-content: space-between;"')).Count); $count += $replaced; Write-Host "OK User option: $replaced" -ForegroundColor Green }

# 5.7 User Email
$before = $content
$content = $content -replace 'style="color: #8492a6; font-size: 13px;"', 'class="user-email"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="color: #8492a6; font-size: 13px;"')).Count); $count += $replaced; Write-Host "OK User email: $replaced" -ForegroundColor Green }

# 5.8 Accumulator Input
$before = $content
$content = $content -replace 'style="display: flex; align-items: center; gap: 5px;"', 'class="accumulator-input"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="display: flex; align-items: center; gap: 5px;"')).Count); $count += $replaced; Write-Host "OK Accumulator input: $replaced" -ForegroundColor Green }

# 5.9 Field Helper
$before = $content
$content = $content -replace 'style="font-size: 11px; color: #909399; margin-top: 5px;"', 'class="field-helper"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="font-size: 11px; color: #909399; margin-top: 5px;"')).Count); $count += $replaced; Write-Host "OK Field helper: $replaced" -ForegroundColor Green }

# 5.10 Vehicle Section Title
$before = $content
$content = $content -replace 'style="margin-top: 30px; margin-bottom: 15px; color: var\(--el-text-color-primary\); font-size: 16px; font-weight: 600;"', 'class="vehicle-section-title"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="margin-top: 30px; margin-bottom: 15px; color: var\(--el-text-color-primary\); font-size: 16px; font-weight: 600;"')).Count); $count += $replaced; Write-Host "OK Vehicle section title: $replaced" -ForegroundColor Green }

# 5.11 Icon Tabs
$before = $content
$content = $content -replace 'style="margin-bottom: 10px;"', 'class="icon-tabs"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="margin-bottom: 10px;"')).Count); $count += $replaced; Write-Host "OK Icon tabs: $replaced" -ForegroundColor Green }

# 5.12 Color Customization
$before = $content
$content = $content -replace 'style="display: flex;"', 'class="color-customization"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="display: flex;"')).Count); $count += $replaced; Write-Host "OK Color customization: $replaced" -ForegroundColor Green }

# 5.13 Color Section
$before = $content
$content = $content -replace 'style="flex: 1;margin-right: 30px;"', 'class="color-section"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="flex: 1;margin-right: 30px;"')).Count); $count += $replaced; Write-Host "OK Color section (right margin): $replaced" -ForegroundColor Green }

# 5.14 Color Label
$before = $content
$content = $content -replace 'class="el-form-item__label" style="margin-bottom: -15px !important;font-weight: bold;display: flex;justify-content: space-between"', 'class="el-form-item__label color-label"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'class="el-form-item__label" style="margin-bottom: -15px !important;font-weight: bold;display: flex;justify-content: space-between"')).Count); $count += $replaced; Write-Host "OK Color label: $replaced" -ForegroundColor Green }

# 5.15 Color Switch
$before = $content
$content = $content -replace 'style="margin-top: 0px;"', 'class="color-switch"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="margin-top: 0px;"')).Count); $count += $replaced; Write-Host "OK Color switch: $replaced" -ForegroundColor Green }

# 5.16 Color Sliders
$before = $content
$content = $content -replace 'style="display: flex;flex-direction: column;padding: 10px;"', 'class="color-sliders"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="display: flex;flex-direction: column;padding: 10px;"')).Count); $count += $replaced; Write-Host "OK Color sliders: $replaced" -ForegroundColor Green }

# 5.17 Slider Item
$before = $content
$content = $content -replace 'class="el-form-item" style="flex: 1;margin-right: 5px;"', 'class="el-form-item slider-item"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'class="el-form-item" style="flex: 1;margin-right: 5px;"')).Count); $count += $replaced; Write-Host "OK Slider item: $replaced" -ForegroundColor Green }

# 5.18 Slider Label
$before = $content
$content = $content -replace 'class="el-form-item__label" style="margin-bottom: -15px !important"', 'class="el-form-item__label slider-label"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'class="el-form-item__label" style="margin-bottom: -15px !important"')).Count); $count += $replaced; Write-Host "OK Slider label: $replaced" -ForegroundColor Green }

# 5.19 Color Palette
$before = $content
$content = $content -replace 'style="margin-top: 15px;display: flex;flex-wrap: wrap;"', 'class="color-palette"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="margin-top: 15px;display: flex;flex-wrap: wrap;"')).Count); $count += $replaced; Write-Host "OK Color palette: $replaced" -ForegroundColor Green }

# 5.20 Color Swatch
$before = $content
$content = $content -replace 'style="margin-right: 2px;margin-bottom: 2px;border: silver 1px solid;border-radius: 3px;cursor: pointer;"', 'class="color-swatch"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="margin-right: 2px;margin-bottom: 2px;border: silver 1px solid;border-radius: 3px;cursor: pointer;"')).Count); $count += $replaced; Write-Host "OK Color swatch: $replaced" -ForegroundColor Green }

# 5.21 Color Box
$before = $content
$content = $content -replace 'style="background: #3e8db9;width: 30px; height: 30px;"', 'class="color-box"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="background: #3e8db9;width: 30px; height: 30px;"')).Count); $count += $replaced; Write-Host "OK Color box: $replaced" -ForegroundColor Green }

# 5.22 Upload Placeholder
$before = $content
$content = $content -replace 'style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; color: #8c939d; text-align: center;"', 'class="upload-placeholder"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; color: #8c939d; text-align: center;"')).Count); $count += $replaced; Write-Host "OK Upload placeholder: $replaced" -ForegroundColor Green }

# 5.23 Upload Text
$before = $content
$content = $content -replace 'style="font-size: 13px; color: #8c939d;"', 'class="upload-text"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="font-size: 13px; color: #8c939d;"')).Count); $count += $replaced; Write-Host "OK Upload text: $replaced" -ForegroundColor Green }

# 5.24 Empty State
$before = $content
$content = $content -replace 'style="padding: 20px; text-align: center; color: #909399;"', 'class="empty-state"'
if ($content -ne $before) { $replaced = (([regex]::Matches($before, 'style="padding: 20px; text-align: center; color: #909399;"')).Count); $count += $replaced; Write-Host "OK Empty state: $replaced" -ForegroundColor Green }

# Salvar arquivo
Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline

Write-Host "`n===== ETAPA 5 COMPLETA! =====" -ForegroundColor Green
Write-Host "Total de substituições: $count" -ForegroundColor Cyan
Write-Host "`nPROXIMO PASSO: Execute o script para ETAPA 6 (CSS)" -ForegroundColor Yellow
