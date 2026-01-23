# PR-10C - VALIDAÇÃO PRÉ-DEPLOY (CHECKLIST CIRÚRGICO)

## ⚠️ CRÍTICO: Validar ANTES de comemorar

**Problema comum:** Código compila, migrations rodaram, mas notificação não envia porque **evento não está conectado**.

---

## 🔍 Validação Rápida (3 comandos)

### 1. Event está registrado?

```bash
php artisan event:list | grep -i speed
```

**Esperado:**
```
App\Events\SpeedEventCreated
  App\Listeners\SpeedEventCreatedListener
```

**❌ Se vazio:** EventServiceProvider não foi registrado em `config/app.php`

---

### 2. Worker processou algum job com erro?

```bash
php artisan queue:failed
```

**Esperado:** Vazio (ou erros antigos não relacionados)

**❌ Se tem `SendSpeedNotificationJob`:** Worker crashou, ver logs

---

### 3. Notificações estão sendo criadas?

```sql
-- Gerar 1 speed event manualmente
INSERT INTO tarkan_logs.speed_events 
(event_type, device_id, driver_id, position_time, server_time, 
 speed_kmh, speed_limit_kmh, exceed_by_kmh, latitude, longitude, 
 address, event_hash, created_at, updated_at)
VALUES 
('overspeed_limit', 123, NULL, NOW(), NOW(), 
 105.5, 80, 25.5, -23.55, -46.63, 
 'Test Address', SHA2(CONCAT('test-', UNIX_TIMESTAMP()), 256), NOW(), NOW());

-- Aguardar 2 segundos

-- Verificar se notificação foi criada
SELECT id, device_id, channel, status, created_at 
FROM tarkan_logs.speed_notifications 
ORDER BY id DESC 
LIMIT 3;
```

**Esperado:** Pelo menos 1 linha com `status = 'queued'`

**❌ Se vazio:** Event não está sendo disparado (ver seção Troubleshooting)

---

## ✅ Checklist de Integração (passo a passo)

### Passo 1: Registrar EventServiceProvider

**Verificar se existe:**

```bash
cat app/Providers/EventServiceProvider.php | grep SpeedEvent
```

**Esperado:**
```php
use App\Events\SpeedEventCreated;
use App\Listeners\SpeedEventCreatedListener;

protected $listen = [
    SpeedEventCreated::class => [
        SpeedEventCreatedListener::class,
    ],
];
```

**Se não existe ou está incompleto:**

Editar `app/Providers/EventServiceProvider.php` (usar o stub criado em PR-10C).

**Registrar no config/app.php:**

```bash
cat config/app.php | grep EventServiceProvider
```

**Esperado:**
```php
'providers' => [
    // ...
    App\Providers\EventServiceProvider::class,
],
```

**Se não existe:**

Adicionar `App\Providers\EventServiceProvider::class` no array `providers`.

---

### Passo 2: Disparar evento após criar SpeedEvent

**Localizar onde cria SpeedEvent:**

```bash
grep -r "SpeedEvent::create" app/
```

**Esperado:** `app/Jobs/ProcessSpeedEventsJob.php` (linha ~281)

**Verificar se dispara evento:**

```bash
cat app/Jobs/ProcessSpeedEventsJob.php | grep -A 5 "SpeedEvent::create"
```

**Esperado:**
```php
$event = SpeedEvent::create($data);

// PR-10C: Disparar event
try {
    event(new SpeedEventCreated($event));
} catch (\Exception $e) {
    \Log::warning('[PR-10C] Erro ao disparar SpeedEventCreated', [
        'speed_event_id' => $event->id,
        'error' => $e->getMessage(),
    ]);
}
```

**❌ Se não tem `event(new SpeedEventCreated($event))`:**

Adicionar conforme `INTEGRATION_PR10C.php` (linha 31-40).

**Adicionar import no topo:**

```php
use App\Events\SpeedEventCreated;
```

---

### Passo 3: Configurar fila "notifications"

**Verificar se existe worker rodando:**

```bash
ps aux | grep "queue:work" | grep notifications
```

**Esperado:** Pelo menos 1 processo ativo

**❌ Se vazio:**

```bash
# Iniciar worker (teste)
php artisan queue:work --queue=notifications --tries=3 --timeout=60

# Produção: usar supervisor
```

**Supervisor config exemplo:**

```ini
[program:laravel-notifications-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/back-end/artisan queue:work --queue=notifications --tries=3 --timeout=60 --sleep=3
autostart=true
autorestart=true
numprocs=2
user=www-data
redirect_stderr=true
stdout_logfile=/path/to/back-end/storage/logs/worker-notifications.log
```

---

### Passo 4: Validar cache (throttling)

**Verificar driver de cache:**

```bash
php artisan tinker
>>> config('cache.default')
```

**Esperado:** `redis` ou `memcached` (produção)

**⚠️ Se `file`:** Throttling pode falhar em multi-instância (spam duplicado)

**Recomendação:** Trocar para Redis

```env
# .env
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

---

### Passo 5: Configurar email (se usar canal email)

**Verificar .env:**

```bash
cat .env | grep MAIL
```

**Esperado:**
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

```bash
php artisan tinker
>>> Mail::raw('PR-10C smoke test', function($m) { $m->to('admin@example.com')->subject('Test'); });
```

**Esperado:** Email recebido (ou aceito pelo SMTP)

---

### Passo 6: Adicionar rotas API

**Verificar se rotas existem:**

```bash
php artisan route:list | grep speed-notification
```

**Esperado:**
```
GET    /api/speed-notification-channels
POST   /api/speed-notification-channels
PUT    /api/speed-notification-channels/{id}
DELETE /api/speed-notification-channels/{id}
GET    /api/speed-notifications
GET    /api/speed-notifications/{id}
```

**❌ Se vazio:**

Adicionar rotas do `routes/api_pr10c.php` no `routes/api.php` existente.

**⚠️ Middleware:** Proteger com `auth:api` ou `auth:sanctum`

---

## 🧪 Smoke Tests (6 cenários, ordem crítica)

### Teste 1: Evento cria notificação (queued)

**Objetivo:** Validar que o fluxo `SpeedEvent::create()` → `event()` → `Listener` → `Job` funciona.

**Passos:**

1. Limpar tabela (opcional):
   ```sql
   TRUNCATE tarkan_logs.speed_notifications;
   ```

2. Criar SpeedEvent manualmente:
   ```sql
   INSERT INTO tarkan_logs.speed_events 
   (event_type, device_id, driver_id, position_time, server_time, 
    speed_kmh, speed_limit_kmh, exceed_by_kmh, latitude, longitude, 
    address, event_hash, created_at, updated_at)
   VALUES 
   ('overspeed_limit', 123, 7, NOW(), NOW(), 
    105.5, 80, 25.5, -23.55, -46.63, 
    'Av Paulista, 1000', SHA2(CONCAT('smoke-test-', UNIX_TIMESTAMP()), 256), NOW(), NOW());
   ```

3. **OU** gerar via PHP:
   ```bash
   php artisan tinker
   >>> $event = \App\Models\SpeedEvent::create([
         'event_type' => 'overspeed_limit',
         'device_id' => 123,
         'speed_kmh' => 105.5,
         'speed_limit_kmh' => 80,
         'exceed_by_kmh' => 25.5,
         'latitude' => -23.55,
         'longitude' => -46.63,
         'position_time' => now(),
         'server_time' => now(),
         'event_hash' => hash('sha256', 'smoke-test-' . time()),
       ]);
   >>> event(new \App\Events\SpeedEventCreated($event));
   ```

4. Aguardar 2 segundos

5. Verificar notificação:
   ```sql
   SELECT id, speed_event_id, device_id, channel, status, created_at 
   FROM tarkan_logs.speed_notifications 
   ORDER BY id DESC 
   LIMIT 3;
   ```

**✅ Esperado:** Pelo menos 1 linha `status = 'queued'`

**❌ Se vazio:**
- Event não está registrado (ver Passo 1)
- Event não está sendo disparado (ver Passo 2)
- Listener falhou (ver `storage/logs/laravel.log`)

---

### Teste 2: Worker processa e envia (webhook)

**Pré-requisito:** Teste 1 passou (notificação `queued` existe)

**Objetivo:** Validar que worker pega job e envia webhook.

**Passos:**

1. Configurar canal webhook:
   ```bash
   curl -X POST http://localhost:8000/api/speed-notification-channels \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "deviceId": 123,
       "channel": "webhook",
       "enabled": true,
       "target": "https://webhook.site/your-unique-url",
       "throttle_seconds": 60
     }'
   ```

2. Gerar speed event (repetir Teste 1, passo 2)

3. Iniciar worker (se não estiver rodando):
   ```bash
   php artisan queue:work --queue=notifications --tries=3 --timeout=60 --once
   ```

4. Verificar status:
   ```sql
   SELECT id, status, sent_at, error_message 
   FROM tarkan_logs.speed_notifications 
   WHERE device_id = 123 
   ORDER BY id DESC 
   LIMIT 1;
   ```

**✅ Esperado:**
- `status = 'sent'`
- `sent_at` preenchido
- `error_message` NULL

**Webhook recebido em https://webhook.site:**

```json
{
  "type": "overspeed_limit",
  "deviceId": 123,
  "driverId": 7,
  "timestamp": "2025-01-20T...",
  "speedKmh": 105.5,
  "speedLimitKmh": 80,
  "exceedByKmh": 25.5,
  "latitude": -23.55,
  "longitude": -46.63,
  "address": "Av Paulista, 1000"
}
```

**❌ Se `status = 'queued'`:**
- Worker não está rodando (ver Passo 3)
- Job falhou (ver `php artisan queue:failed`)

**❌ Se `status = 'failed'`:**
- Webhook URL inválida (ver `error_message`)
- Timeout > 3s (webhook muito lento)

---

### Teste 3: Throttling (2 eventos em 30s → 1 sent + 1 skipped)

**Objetivo:** Validar que throttling evita spam.

**Passos:**

1. Gerar evento 1:
   ```bash
   php artisan tinker
   >>> $e1 = \App\Models\SpeedEvent::create([...]);
   >>> event(new \App\Events\SpeedEventCreated($e1));
   ```

2. Aguardar 5 segundos (worker processar)

3. Gerar evento 2 (mesmo device):
   ```bash
   >>> $e2 = \App\Models\SpeedEvent::create([...]);
   >>> event(new \App\Events\SpeedEventCreated($e2));
   ```

4. Verificar:
   ```sql
   SELECT id, status, created_at 
   FROM tarkan_logs.speed_notifications 
   WHERE device_id = 123 
   ORDER BY id DESC 
   LIMIT 2;
   ```

**✅ Esperado:**
- Linha 1: `status = 'skipped'` (throttled)
- Linha 2: `status = 'sent'`

**❌ Se ambos `sent`:**
- Cache não está funcionando (ver Passo 4)
- Throttle seconds = 0 (verificar configuração canal)

---

### Teste 4: Idempotência (duplicar hash → não cria nova notificação)

**Objetivo:** Validar que notification_hash unique evita duplicação.

**Passos:**

1. Tentar criar notificação com mesmo hash:
   ```bash
   php artisan tinker
   >>> \App\Models\SpeedNotification::create([
         'speed_event_id' => 123,
         'device_id' => 123,
         'channel' => 'webhook',
         'target' => 'https://example.com',
         'status' => 'queued',
         'notification_hash' => 'duplicate-hash-test',
       ]);
   
   >>> \App\Models\SpeedNotification::create([
         'speed_event_id' => 124,
         'device_id' => 123,
         'channel' => 'webhook',
         'target' => 'https://example.com',
         'status' => 'queued',
         'notification_hash' => 'duplicate-hash-test', // mesmo hash
       ]);
   ```

**✅ Esperado:** Segunda criação lança exceção `Duplicate entry` (silenciada no Job)

**Verificar:**
```sql
SELECT COUNT(*) FROM tarkan_logs.speed_notifications 
WHERE notification_hash = 'duplicate-hash-test';
```

**✅ Esperado:** `COUNT(*) = 1` (só primeira notificação criada)

---

### Teste 5: Webhook down → failed MAS webhook do Traccar continua 200

**Objetivo:** Validar que falha em notificação NÃO quebra webhook do Traccar.

**Passos:**

1. Configurar webhook para URL inválida:
   ```sql
   UPDATE tarkan_logs.speed_notification_channels 
   SET target = 'https://invalid-url-404.example.com/webhook' 
   WHERE device_id = 123 AND channel = 'webhook';
   ```

2. Gerar speed event via ProcessSpeedEventsJob (simular webhook Traccar real):
   ```bash
   # Simular posição no Traccar
   curl -X POST http://localhost:8082/api/positions \
     -u admin@example.com:admin \
     -H "Content-Type: application/json" \
     -d '{
       "deviceId": 123,
       "latitude": -23.55,
       "longitude": -46.63,
       "speed": 105.5,
       "fixTime": "2025-01-20T10:05:00Z"
     }'
   ```

3. Aguardar ProcessSpeedEventsJob processar (polling)

4. Verificar notificação:
   ```sql
   SELECT id, status, error_message 
   FROM tarkan_logs.speed_notifications 
   WHERE device_id = 123 
   ORDER BY id DESC 
   LIMIT 1;
   ```

**✅ Esperado:**
- `status = 'failed'`
- `error_message = 'Webhook failed: HTTP 404 - ...'`

5. **CRÍTICO:** Verificar que speed_event FOI CRIADO (webhook não quebrou):
   ```sql
   SELECT COUNT(*) FROM tarkan_logs.speed_events 
   WHERE device_id = 123 
     AND position_time >= NOW() - INTERVAL 5 MINUTE;
   ```

**✅ Esperado:** `COUNT(*) >= 1` (evento criado, independente de notificação falhar)

**❌ Se evento não foi criado:**
- Try/catch faltando (ver INTEGRATION_PR10C.php)
- Listener propagou exceção (não pode!)

---

### Teste 6: Email funcional

**Objetivo:** Validar envio de email.

**Passos:**

1. Configurar canal email:
   ```bash
   curl -X POST http://localhost:8000/api/speed-notification-channels \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "deviceId": 123,
       "channel": "email",
       "enabled": true,
       "target": "admin@example.com",
       "throttle_seconds": 300
     }'
   ```

2. Gerar speed event (repetir Teste 1)

3. Worker processa

4. Verificar email recebido:
   ```
   Subject: ⚠️ Alerta de Velocidade - Device #123
   
   Alerta de Excesso de Velocidade
   
   Device: #123
   Motorista: #7
   Data/Hora: 20/01/2025 10:05:00
   
   Velocidade: 105.5 km/h
   Limite: 80 km/h
   Excedeu: 25.5 km/h
   
   Endereço: Av Paulista, 1000
   ```

5. Verificar status:
   ```sql
   SELECT id, status, sent_at 
   FROM tarkan_logs.speed_notifications 
   WHERE device_id = 123 AND channel = 'email' 
   ORDER BY id DESC 
   LIMIT 1;
   ```

**✅ Esperado:**
- `status = 'sent'`
- `sent_at` preenchido

**❌ Se `failed`:**
- SMTP não configurado (ver Passo 5)
- Credenciais inválidas (ver `error_message`)

---

## 🚨 Troubleshooting (os 3 erros mais comuns)

### Erro 1: Notificação não cria (speed_notifications vazio)

**Sintoma:** Teste 1 falha, nenhuma linha em `speed_notifications`.

**Causa raiz:** Event não está sendo disparado.

**Diagnóstico:**

1. Verificar se EventServiceProvider está registrado:
   ```bash
   php artisan event:list | grep SpeedEvent
   ```

2. Verificar se evento é disparado no código:
   ```bash
   grep -r "event(new SpeedEventCreated" app/
   ```

3. Verificar logs:
   ```bash
   tail -f storage/logs/laravel.log | grep PR-10C
   ```

**Solução:**
- Adicionar `event(new SpeedEventCreated($event))` após `SpeedEvent::create()` (ver INTEGRATION_PR10C.php)
- Registrar EventServiceProvider em `config/app.php`
- Limpar cache: `php artisan config:clear && php artisan event:cache`

---

### Erro 2: Notificação fica "queued" eternamente

**Sintoma:** Teste 2 falha, `status = 'queued'` não muda.

**Causa raiz:** Worker não está rodando.

**Diagnóstico:**

```bash
ps aux | grep "queue:work" | grep notifications
```

**Solução:**

```bash
# Teste manual
php artisan queue:work --queue=notifications --tries=3 --timeout=60 --once

# Produção: supervisor
sudo supervisorctl status laravel-notifications-worker
sudo supervisorctl start laravel-notifications-worker
```

---

### Erro 3: Throttling não funciona (spam)

**Sintoma:** Teste 3 falha, todos `sent` (nenhum `skipped`).

**Causa raiz:** Cache não está configurado corretamente.

**Diagnóstico:**

```bash
php artisan tinker
>>> Cache::put('test-pr10c', 'value', 60);
>>> Cache::get('test-pr10c'); // deve retornar 'value'
```

**Solução:**

```env
# .env
CACHE_DRIVER=redis # ou memcached
```

```bash
# Instalar Redis (se necessário)
sudo apt install redis-server
php artisan cache:clear
```

---

## ✅ Resultado Final

Se todos os 6 smoke tests passaram:

- ✅ Event está conectado (SpeedEvent → SpeedEventCreated → Listener → Job)
- ✅ Worker processa fila `notifications`
- ✅ Webhook envia com sucesso
- ✅ Throttling evita spam
- ✅ Idempotência evita duplicação
- ✅ Falha em notificação NÃO quebra webhook do Traccar
- ✅ Email funcional (se configurado)

**PR-10C está 100% operacional em produção.** ✅

---

## 🔄 Rollback Seguro

Se algo der errado:

1. **Parar worker notifications:**
   ```bash
   sudo supervisorctl stop laravel-notifications-worker
   ```

2. **Desabilitar todos os canais:**
   ```sql
   UPDATE tarkan_logs.speed_notification_channels SET enabled = 0;
   ```

3. **Remover integração:**
   - Comentar `event(new SpeedEventCreated($event))` em ProcessSpeedEventsJob.php
   - Rebuild + deploy

4. **Rollback migrations (se necessário):**
   ```bash
   php artisan migrate:rollback --database=logs --step=2
   ```

**Nota:** Webhook do Traccar e polling PR-10A.1 continuam funcionando normalmente (zero impacto).

---

**Validação PR-10C COMPLETA.**  
**Use este checklist ANTES de deploy em produção.** ✅
