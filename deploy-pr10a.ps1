# PR-10A: Script de Deploy Backend
# Copia arquivos do frontend/backend-pr10a/ para back-end/

# INSTRUÇÕES:
# 1. Executar este script no PowerShell como Administrador
# 2. Navegar até: cd C:\projeto\Versao-tarkan-Jesse\front-end
# 3. Rodar: .\deploy-pr10a.ps1

$ErrorActionPreference = "Stop"

# Caminhos
$sourcePath = "C:\projeto\Versao-tarkan-Jesse\front-end\backend-pr10a"
$backendPath = "C:\projeto\Versao-tarkan-Jesse\back-end"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PR-10A: Deploy Backend Speed Events" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se diretórios existem
if (-not (Test-Path $sourcePath)) {
    Write-Host "[ERRO] Source path não encontrado: $sourcePath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $backendPath)) {
    Write-Host "[ERRO] Backend path não encontrado: $backendPath" -ForegroundColor Red
    exit 1
}

Write-Host "[1/8] Copiando Migration..." -ForegroundColor Yellow
$migrationFile = Get-ChildItem "$sourcePath\database\migrations\*.php" | Select-Object -First 1
if ($migrationFile) {
    Copy-Item $migrationFile.FullName "$backendPath\database\migrations\" -Force
    Write-Host "  ✓ Migration copiada: $($migrationFile.Name)" -ForegroundColor Green
}

Write-Host "[2/8] Copiando Model SpeedEvent..." -ForegroundColor Yellow
Copy-Item "$sourcePath\app\Models\SpeedEvent.php" "$backendPath\app\Models\" -Force
Write-Host "  ✓ SpeedEvent.php copiado" -ForegroundColor Green

Write-Host "[3/8] Criando diretório app\Services\Speed..." -ForegroundColor Yellow
$speedServicesPath = "$backendPath\app\Services\Speed"
if (-not (Test-Path $speedServicesPath)) {
    New-Item -Path $speedServicesPath -ItemType Directory -Force | Out-Null
}
Write-Host "  ✓ Diretório criado" -ForegroundColor Green

Write-Host "[4/8] Copiando SpeedLimitEventDetector..." -ForegroundColor Yellow
Copy-Item "$sourcePath\app\Services\Speed\SpeedLimitEventDetector.php" "$speedServicesPath\" -Force
Write-Host "  ✓ SpeedLimitEventDetector.php copiado" -ForegroundColor Green

Write-Host "[5/8] Copiando SpeedNotificationDispatcher..." -ForegroundColor Yellow
Copy-Item "$sourcePath\app\Services\Speed\SpeedNotificationDispatcher.php" "$speedServicesPath\" -Force
Write-Host "  ✓ SpeedNotificationDispatcher.php copiado" -ForegroundColor Green

Write-Host "[6/8] Copiando SpeedEventController..." -ForegroundColor Yellow
Copy-Item "$sourcePath\app\Http\Controllers\SpeedEventController.php" "$backendPath\app\Http\Controllers\" -Force
Write-Host "  ✓ SpeedEventController.php copiado" -ForegroundColor Green

Write-Host "[7/8] Arquivos de configuração (MANUAL REQUIRED)..." -ForegroundColor Yellow
Write-Host "  ⚠ ATENÇÃO: Você precisa adicionar manualmente:" -ForegroundColor Magenta
Write-Host "    - config/database.php: adicionar conexão 'logs'" -ForegroundColor White
Write-Host "    - routes/api.php: adicionar rotas speed-events" -ForegroundColor White
Write-Host "    - .env: adicionar LOGS_DB_* variáveis" -ForegroundColor White
Write-Host ""
Write-Host "  Consulte:" -ForegroundColor White
Write-Host "    - backend-pr10a\config\database_logs_connection.php" -ForegroundColor Cyan
Write-Host "    - backend-pr10a\routes\api_speed_events_routes.php" -ForegroundColor Cyan

Write-Host ""
Write-Host "[8/8] Próximos passos (MANUAL):" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Atualizar .env:" -ForegroundColor White
Write-Host "   LOGS_DB_HOST=localhost" -ForegroundColor Gray
Write-Host "   LOGS_DB_PORT=3306" -ForegroundColor Gray
Write-Host "   LOGS_DB_DATABASE=tarkan_logs" -ForegroundColor Gray
Write-Host "   LOGS_DB_USERNAME=root" -ForegroundColor Gray
Write-Host "   LOGS_DB_PASSWORD=sua_senha" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Criar banco de dados:" -ForegroundColor White
Write-Host "   mysql> CREATE DATABASE tarkan_logs CHARACTER SET utf8mb4;" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Rodar migration:" -ForegroundColor White
Write-Host "   cd $backendPath" -ForegroundColor Gray
Write-Host "   php artisan migrate --database=logs" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Adicionar conexão 'logs' em config/database.php" -ForegroundColor White
Write-Host "   (copiar conteúdo de backend-pr10a\config\database_logs_connection.php)" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Adicionar rotas em routes/api.php" -ForegroundColor White
Write-Host "   (copiar conteúdo de backend-pr10a\routes\api_speed_events_routes.php)" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Integrar detector no ponto de processamento de positions" -ForegroundColor White
Write-Host "   (consultar PR-10A_OVERSPEED_EVENTS.md seção 'Ponto de Integração')" -ForegroundColor Gray
Write-Host ""
Write-Host "7. Testar endpoint:" -ForegroundColor White
Write-Host "   curl http://localhost:8000/api/speed-events?from=2026-01-01&to=2026-01-31" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
