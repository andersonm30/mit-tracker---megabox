# PR-10C - Comandos de Validação (Windows/PowerShell)

## 🪟 Adaptação para Windows

Os comandos bash do checklist foram adaptados para PowerShell/Windows.

---

## 🔍 Validação Rápida (3 comandos)

### Opção A: Script automatizado (recomendado)

```powershell
# Navegar para backend
cd C:\projeto\Versao-tarkan-Jesse\front-end\backend-pr10a

# Executar script de validação
.\validate-pr10c-windows.ps1
```

**O script valida automaticamente:**
- ✅ Event registrado
- ✅ Jobs falhados
- ✅ Cria SpeedEvent de teste
- ✅ Verifica notificação criada

---

### Opção B: Comandos manuais

#### 1. Event está registrado?

```powershell
cd C:\projeto\Versao-tarkan-Jesse\front-end\backend-pr10a

php artisan event:list | Select-String -Pattern "SpeedEvent"
```

**Esperado:**
```
App\Events\SpeedEventCreated
  App\Listeners\SpeedEventCreatedListener
```

**❌ Se vazio:**
- EventServiceProvider não está registrado em `config/app.php`

---

#### 2. Worker processou algum job com erro?

```powershell
php artisan queue:failed
```

**Esperado:** Vazio (ou erros antigos não relacionados)

**❌ Se tem `SendSpeedNotificationJob`:**
- Worker crashou, verificar logs: `storage/logs/laravel.log`

---

#### 3. Criar SpeedEvent de teste

```powershell
# Método 1: Via tinker interativo
php artisan tinker

# Copiar e colar dentro do tinker:
$event = \App\Models\SpeedEvent::create([
  'event_type' => 'overspeed_limit',
  'device_id' => 123,
  'speed_kmh' => 105.5,
  'speed_limit_kmh' => 80,
  'exceed_by_kmh' => 25.5,
  'latitude' => -23.55,
  'longitude' => -46.63,
  'position_time' => now(),
  'server_time' => now(),
  'event_hash' => hash('sha256', 'test-' . time()),
]);

echo "Event ID: " . $event->id . "\n";

event(new \App\Events\SpeedEventCreated($event));

echo "Event dispatched!\n";

# Sair do tinker
exit
```

**Método 2: Via arquivo .php**

Criar arquivo `test-event.php`:

```php
<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$event = \App\Models\SpeedEvent::create([
  'event_type' => 'overspeed_limit',
  'device_id' => 123,
  'speed_kmh' => 105.5,
  'speed_limit_kmh' => 80,
  'exceed_by_kmh' => 25.5,
  'latitude' => -23.55,
  'longitude' => -46.63,
  'position_time' => now(),
  'server_time' => now(),
  'event_hash' => hash('sha256', 'test-' . time()),
]);

echo "Event ID: " . $event->id . "\n";

event(new \App\Events\SpeedEventCreated($event));

echo "Event dispatched!\n";
```

Executar:
```powershell
php test-event.php
```

---

#### 4. Verificar notificação criada

**Aguardar 2-3 segundos após criar o evento**, depois:

```powershell
# Opção 1: Via mysql.exe (se tiver no PATH)
mysql -u root -p tarkan_logs -e "SELECT id, device_id, channel, status, created_at FROM speed_notifications ORDER BY id DESC LIMIT 3;"

# Opção 2: Via HeidiSQL/phpMyAdmin
# Executar manualmente a query:
```

```sql
USE tarkan_logs;
SELECT id, device_id, channel, status, created_at 
FROM speed_notifications 
ORDER BY id DESC 
LIMIT 3;
```

**✅ Esperado:** Pelo menos 1 linha com `status = 'queued'` ou `'sent'`

**❌ Se vazio:**
- Event não está sendo disparado (ver seção Troubleshooting abaixo)

---

## 🔧 Configurações Necessárias

### 1. Migrations (rodar apenas na conexão logs)

```powershell
cd C:\projeto\Versao-tarkan-Jesse\front-end\backend-pr10a

php artisan migrate --database=logs
```

**Validar tabelas criadas:**

```sql
USE tarkan_logs;
SHOW TABLES LIKE 'speed_notification%';
-- Esperado: speed_notification_channels, speed_notifications

DESC speed_notification_channels;
DESC speed_notifications;
```

---

### 2. Worker de notificações (essencial!)

**Iniciar worker separado:**

```powershell
# Terminal dedicado (manter aberto)
cd C:\projeto\Versao-tarkan-Jesse\front-end\backend-pr10a

php artisan queue:work --queue=notifications --tries=3 --timeout=60
```

**Verificar se está rodando:**

```powershell
# Listar processos php
Get-Process -Name php
```

**⚠️ IMPORTANTE:** Worker deve ficar rodando. Se fechar terminal, worker para.

**Solução produção:** Usar `nssm` (Non-Sucking Service Manager) para criar serviço Windows:

```powershell
# Instalar nssm: https://nssm.cc/download
# Depois:
nssm install laravel-notifications-worker "C:\php\php.exe" "C:\projeto\Versao-tarkan-Jesse\front-end\backend-pr10a\artisan queue:work --queue=notifications --tries=3 --timeout=60"

nssm start laravel-notifications-worker
```

---

### 3. Cache (throttling)

**Verificar driver de cache:**

```powershell
php artisan tinker

# Dentro do tinker:
config('cache.default')
# Esperado: 'redis' ou 'memcached' (produção)
# Se 'file': OK para dev, mas produção precisa Redis
```

**⚠️ Se cache = file em produção:**
- Throttling pode falhar em multi-instância
- Recomendação: instalar Redis

---

### 4. Email (se usar canal email)

**Verificar .env:**

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=yourpassword
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="Tarkan Tracker"
```

**Testar envio:**

```powershell
php artisan tinker

# Dentro do tinker:
Mail::raw('PR-10C smoke test', function($m) { 
    $m->to('admin@example.com')->subject('Test'); 
});
```

---

## 🚨 Troubleshooting

### ❌ Teste 1 falhou (Event não registrado)

**Problema:** `php artisan event:list` não mostra SpeedEventCreated

**Solução:**

1. Verificar se `EventServiceProvider.php` existe:
   ```powershell
   Test-Path C:\projeto\Versao-tarkan-Jesse\front-end\backend-pr10a\app\Providers\EventServiceProvider.php
   ```

2. Se existe, verificar se está registrado em `config/app.php`:
   ```powershell
   Select-String -Path C:\projeto\Versao-tarkan-Jesse\front-end\backend-pr10a\config\app.php -Pattern "EventServiceProvider"
   ```

3. Se não encontrar, adicionar no array `providers`:
   ```php
   'providers' => [
       // ...
       App\Providers\EventServiceProvider::class,
   ],
   ```

4. Limpar cache:
   ```powershell
   php artisan config:clear
   php artisan event:cache
   ```

---

### ❌ Teste 4 falhou (Notificação não criada)

**Problema:** SpeedEvent criado, mas `speed_notifications` vazio

**Diagnóstico:**

1. **Event está sendo disparado?**
   
   Verificar se `ProcessSpeedEventsJob.php` tem:
   ```powershell
   Select-String -Path .\app\Jobs\ProcessSpeedEventsJob.php -Pattern "SpeedEventCreated"
   ```
   
   **Esperado:** Linha com `event(new SpeedEventCreated($event))`
   
   **Se não encontrar:** Adicionar conforme `INTEGRATION_PR10C.php`

2. **Listener está registrado?**
   
   ```powershell
   php artisan event:list | Select-String -Pattern "SpeedEvent"
   ```
   
   **Se vazio:** Ver solução "Teste 1 falhou" acima

3. **Worker está rodando?**
   
   ```powershell
   Get-Process -Name php | Where-Object { $_.CommandLine -like "*queue:work*" }
   ```
   
   **Se vazio:** Iniciar worker (ver seção "2. Worker de notificações")

4. **Job entrou na fila?**
   
   ```sql
   USE tarkan_logs;
   SELECT * FROM jobs WHERE queue = 'notifications' ORDER BY id DESC LIMIT 5;
   ```
   
   **Se vazio:** Event não está disparando job (ver passo 1)

5. **Job falhou?**
   
   ```powershell
   php artisan queue:failed
   ```
   
   **Se tem erro:** Verificar `storage/logs/laravel.log`

---

## 📝 Queries SQL Úteis

```sql
-- Ver eventos criados
USE tarkan_logs;
SELECT * FROM speed_events ORDER BY id DESC LIMIT 10;

-- Ver notificações criadas
SELECT id, speed_event_id, device_id, channel, status, created_at, error_message 
FROM speed_notifications 
ORDER BY id DESC 
LIMIT 10;

-- Ver notificações por status
SELECT status, COUNT(*) as total 
FROM speed_notifications 
GROUP BY status;

-- Ver notificações falhadas (últimas 24h)
SELECT * FROM speed_notifications 
WHERE status = 'failed' 
  AND created_at >= NOW() - INTERVAL 24 HOUR 
ORDER BY id DESC;

-- Ver canais configurados
SELECT * FROM speed_notification_channels 
WHERE enabled = 1;

-- Ver jobs na fila
SELECT * FROM jobs 
WHERE queue = 'notifications' 
ORDER BY id DESC 
LIMIT 5;

-- Ver jobs falhados
SELECT * FROM failed_jobs 
WHERE payload LIKE '%SendSpeedNotificationJob%' 
ORDER BY failed_at DESC 
LIMIT 5;
```

---

## ✅ Checklist Completo de Deploy

Ver: `PR-10C_VALIDATION_CHECKLIST.md`

---

## 🎯 Resumo dos Comandos Essenciais

```powershell
# 1. Navegar para backend
cd C:\projeto\Versao-tarkan-Jesse\front-end\backend-pr10a

# 2. Rodar migrations
php artisan migrate --database=logs

# 3. Verificar event registrado
php artisan event:list | Select-String -Pattern "SpeedEvent"

# 4. Iniciar worker (terminal separado)
php artisan queue:work --queue=notifications --tries=3 --timeout=60

# 5. Criar evento de teste (tinker)
php artisan tinker
# (copiar código do teste 3)

# 6. Verificar notificações (SQL)
mysql -u root -p tarkan_logs -e "SELECT * FROM speed_notifications ORDER BY id DESC LIMIT 3;"
```

---

**Validação PR-10C para Windows/PowerShell.**  
**Todos os comandos bash adaptados.** ✅
