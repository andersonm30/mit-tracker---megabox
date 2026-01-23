# PR-10C - VALIDAÇÃO RÁPIDA (PowerShell/Windows)
#
# Script adaptado para Windows/PowerShell
# Executa os 3 comandos críticos de validação do PR-10C
#
# Uso:
#   .\validate-pr10c-windows.ps1
#

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         PR-10C - VALIDAÇÃO RÁPIDA (Windows)                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# CONFIGURAÇÃO - AJUSTAR CONFORME SEU AMBIENTE
$BACKEND_PATH = "C:\projeto\Versao-tarkan-Jesse\front-end\backend-pr10a"
$MYSQL_USER = "root"
$MYSQL_PASSWORD = ""  # Ajustar se tiver senha
$MYSQL_DB = "tarkan_logs"

# Navegar para backend
if (Test-Path $BACKEND_PATH) {
    Set-Location $BACKEND_PATH
    Write-Host "✓ Navegado para: $BACKEND_PATH`n" -ForegroundColor Green
} else {
    Write-Host "✗ ERRO: Diretório backend não encontrado: $BACKEND_PATH" -ForegroundColor Red
    exit 1
}

###############################################################################
# TESTE 1: Event está registrado?
###############################################################################

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "[Teste 1] Verificando registro de eventos..." -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Write-Host "Executando: php artisan event:list | Select-String -Pattern 'SpeedEvent'`n" -ForegroundColor Gray

try {
    $eventList = php artisan event:list 2>$null | Select-String -Pattern "SpeedEvent"
    
    if ($eventList) {
        Write-Host "✓ PASSOU: Event SpeedEventCreated registrado" -ForegroundColor Green
        $eventList | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    } else {
        Write-Host "✗ FALHOU: SpeedEventCreated não está registrado" -ForegroundColor Red
        Write-Host "  Solução: Registrar EventServiceProvider em config/app.php`n" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ ERRO ao executar event:list: $_" -ForegroundColor Red
}

Write-Host ""

###############################################################################
# TESTE 2: Jobs falhados
###############################################################################

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "[Teste 2] Verificando jobs falhados..." -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Write-Host "Executando: php artisan queue:failed`n" -ForegroundColor Gray

try {
    $failedJobs = php artisan queue:failed 2>$null
    
    if ($failedJobs -match "SendSpeedNotificationJob") {
        Write-Host "⚠ AVISO: Jobs SendSpeedNotificationJob falhados encontrados" -ForegroundColor Yellow
        Write-Host "  Verificar detalhes com: php artisan queue:failed`n" -ForegroundColor Yellow
    } else {
        Write-Host "✓ PASSOU: Nenhum job SendSpeedNotificationJob falhado" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ ERRO ao verificar jobs: $_" -ForegroundColor Red
}

Write-Host ""

###############################################################################
# TESTE 3: Criar SpeedEvent de teste
###############################################################################

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "[Teste 3] Criando SpeedEvent de teste..." -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

$TEST_DEVICE_ID = 123
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$eventHash = [System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes("test-$(Get-Date -UFormat %s)"))
$eventHashString = [System.BitConverter]::ToString($eventHash).Replace("-", "").ToLower()

Write-Host "Criando evento no tinker...`n" -ForegroundColor Gray

$tinkerScript = @"
`$event = \App\Models\SpeedEvent::create([
  'event_type' => 'overspeed_limit',
  'device_id' => $TEST_DEVICE_ID,
  'speed_kmh' => 105.5,
  'speed_limit_kmh' => 80,
  'exceed_by_kmh' => 25.5,
  'latitude' => -23.55,
  'longitude' => -46.63,
  'position_time' => now(),
  'server_time' => now(),
  'event_hash' => hash('sha256', 'test-' . time()),
]);
echo "Event ID: " . `$event->id . "\n";
event(new \App\Events\SpeedEventCreated(`$event));
echo "Event dispatched!\n";
"@

try {
    # Executar tinker
    $result = $tinkerScript | php artisan tinker 2>&1
    
    Write-Host "Output do tinker:" -ForegroundColor Gray
    Write-Host $result -ForegroundColor Gray
    
    Write-Host "`n✓ SpeedEvent criado (device_id=$TEST_DEVICE_ID)" -ForegroundColor Green
    
    # Aguardar 3 segundos para job processar
    Write-Host "`nAguardando 3 segundos para job processar..." -ForegroundColor Gray
    Start-Sleep -Seconds 3
    
} catch {
    Write-Host "✗ ERRO ao criar SpeedEvent: $_" -ForegroundColor Red
}

Write-Host ""

###############################################################################
# TESTE 4: Verificar notificação criada
###############################################################################

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "[Teste 4] Verificando notificações criadas..." -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Write-Host "Executando query SQL...`n" -ForegroundColor Gray

$mysqlQuery = "SELECT id, device_id, channel, status, created_at FROM speed_notifications WHERE device_id = $TEST_DEVICE_ID ORDER BY id DESC LIMIT 3;"

try {
    if ($MYSQL_PASSWORD -eq "") {
        $mysqlCmd = "mysql -u $MYSQL_USER -e `"USE $MYSQL_DB; $mysqlQuery`""
    } else {
        $mysqlCmd = "mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -e `"USE $MYSQL_DB; $mysqlQuery`""
    }
    
    # Executar mysql
    $notifications = Invoke-Expression $mysqlCmd 2>$null
    
    if ($notifications) {
        Write-Host "✓ PASSOU: Notificações encontradas!" -ForegroundColor Green
        Write-Host "`nNotificações criadas:" -ForegroundColor Cyan
        Write-Host $notifications -ForegroundColor Gray
    } else {
        Write-Host "✗ FALHOU: Nenhuma notificação criada" -ForegroundColor Red
        Write-Host "`nDiagnóstico:" -ForegroundColor Red
        Write-Host "  1. Event não está sendo disparado (ver INTEGRATION_PR10C.php)" -ForegroundColor Red
        Write-Host "  2. Listener não está registrado (ver EventServiceProvider)" -ForegroundColor Red
        Write-Host "  3. Job não foi enfileirado (verificar queue worker)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ ERRO ao consultar MySQL: $_" -ForegroundColor Red
    Write-Host "  Verifique se MySQL está rodando e credenciais corretas" -ForegroundColor Yellow
    Write-Host "  Alternativamente, execute manualmente:" -ForegroundColor Yellow
    Write-Host "    mysql -u $MYSQL_USER -p" -ForegroundColor Gray
    Write-Host "    USE $MYSQL_DB;" -ForegroundColor Gray
    Write-Host "    $mysqlQuery" -ForegroundColor Gray
}

Write-Host ""

###############################################################################
# RESUMO FINAL
###############################################################################

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    PRÓXIMOS PASSOS                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "1. Se Teste 1 FALHOU:" -ForegroundColor Yellow
Write-Host "   - Registrar EventServiceProvider em config/app.php" -ForegroundColor Gray
Write-Host "   - Adicionar use App\Events\SpeedEventCreated; em ProcessSpeedEventsJob" -ForegroundColor Gray
Write-Host "   - Adicionar event(new SpeedEventCreated(`$event)) após SpeedEvent::create()`n" -ForegroundColor Gray

Write-Host "2. Se Teste 4 FALHOU (notificação não criada):" -ForegroundColor Yellow
Write-Host "   - Verificar se EventServiceProvider está em config/app.php" -ForegroundColor Gray
Write-Host "   - Rodar: php artisan config:clear && php artisan event:cache" -ForegroundColor Gray
Write-Host "   - Iniciar worker: php artisan queue:work --queue=notifications`n" -ForegroundColor Gray

Write-Host "3. Consultas manuais úteis:" -ForegroundColor Yellow
Write-Host "   - Ver eventos: mysql -u $MYSQL_USER -p -e `"USE $MYSQL_DB; SELECT * FROM speed_events ORDER BY id DESC LIMIT 5;`"" -ForegroundColor Gray
Write-Host "   - Ver notificações: mysql -u $MYSQL_USER -p -e `"USE $MYSQL_DB; SELECT * FROM speed_notifications ORDER BY id DESC LIMIT 5;`"" -ForegroundColor Gray
Write-Host "   - Ver jobs falhados: php artisan queue:failed`n" -ForegroundColor Gray

Write-Host "4. Checklist completo:" -ForegroundColor Yellow
Write-Host "   - Ver: backend-pr10a\PR-10C_VALIDATION_CHECKLIST.md" -ForegroundColor Gray
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  VALIDAÇÃO PR-10C CONCLUÍDA" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
