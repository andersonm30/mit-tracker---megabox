# PR-10C - SPEED EVENT NOTIFICATIONS

## ✅ Status: COMPLETO

**Data:** 2025-01-20  
**Arquivos criados:** 11  
**Dependências:** PR-10A (SpeedEvent model), PR-10A.1 (ProcessSpeedEventsJob)  
**Documentação:** Completa

---

## 📦 Arquivos Implementados

### ✅ Criados

1. **database/migrations/2026_01_20_000001_create_speed_notification_channels_table.php**
   - Tabela: `speed_notification_channels` (banco LOGS)
   - Colunas: id, device_id, channel (enum), enabled (bool), target (string), throttle_seconds (int), timestamps
   - Índices: idx_device_channel_enabled, idx_device_id
   - Unique constraint: device_id + channel (1 canal por tipo por device)

2. **database/migrations/2026_01_20_000002_create_speed_notifications_table.php**
   - Tabela: `speed_notifications` (banco LOGS)
   - Colunas: id, speed_event_id, device_id, channel, target, status (enum), error_message (text), sent_at (datetime), notification_hash (varchar 64), payload (json), timestamps
   - Índices: idx_device_created, idx_event_channel, idx_status_created
   - Unique constraint: notification_hash (idempotência)

3. **app/Models/SpeedNotificationChannel.php** (~120 linhas)
   - Model para `speed_notification_channels`
   - Connection: 'logs'
   - Fillable: device_id, channel, enabled, target, throttle_seconds
   - Scopes: enabled(), forDevice($deviceId), forChannel($channel)
   - Relationship: notifications() (hasMany SpeedNotification)

4. **app/Models/SpeedNotification.php** (~140 linhas)
   - Model para `speed_notifications`
   - Connection: 'logs'
   - Fillable: speed_event_id, device_id, channel, target, status, error_message, sent_at, notification_hash, payload
   - Scopes: sent(), failed(), skipped(), forDevice($deviceId), forChannel($channel), dateRange($from, $to)
   - Relationship: speedEvent() (belongsTo SpeedEvent)

5. **app/Events/SpeedEventCreated.php** (~40 linhas)
   - Event Laravel
   - Propriedade: $speedEvent (SpeedEvent model instance)
   - Disparado após SpeedEvent::create()

6. **app/Listeners/SpeedEventCreatedListener.php** (~70 linhas)
   - Listener para SpeedEventCreated
   - Dispara SendSpeedNotificationJob::dispatch($speedEventId)
   - Try/catch: NÃO propaga exceção (não quebra webhook)

7. **app/Providers/EventServiceProvider.php** (~50 linhas)
   - Registra mapeamento: SpeedEventCreated → SpeedEventCreatedListener
   - Adicionar ao EventServiceProvider existente se já houver

8. **app/Jobs/SendSpeedNotificationJob.php** (~450 linhas)
   - Job assíncrono (ShouldQueue)
   - Queue: 'notifications' (separada da default)
   - Timeout: 30s, Retries: 3, Backoff: [5, 15, 30]
   - Features:
     - Busca canais habilitados por device
     - Throttling via Cache (Laravel Cache::put)
     - Idempotência via notification_hash unique
     - Canal webhook: HTTP POST, timeout 3s, retry 2x
     - Canal email: Laravel Mail (template texto simples)
     - Auditoria: cria speed_notifications com status (queued → sent/failed/skipped)

9. **app/Http/Controllers/SpeedNotificationChannelController.php** (~170 linhas)
   - CRUD completo para canais
   - GET /api/speed-notification-channels?deviceId=123
   - POST /api/speed-notification-channels (criar/atualizar)
   - PUT /api/speed-notification-channels/{id}
   - DELETE /api/speed-notification-channels/{id}

10. **app/Http/Controllers/SpeedNotificationController.php** (~120 linhas)
    - Auditoria de notificações
    - GET /api/speed-notifications?deviceId=123&from=...&to=...&channel=webhook&status=sent&page=1&perPage=50
    - GET /api/speed-notifications/{id}

11. **routes/api_pr10c.php** (~60 linhas)
    - Stub de rotas (adicionar ao routes/api.php existente)
    - Middleware: 'auth:api' (recomendado)

### ✅ Modificado (stub/exemplo)

1. **INTEGRATION_PR10C.php**
   - Exemplo de integração no ProcessSpeedEventsJob.php
   - Adicionar `event(new SpeedEventCreated($event))` após `SpeedEvent::create()`
   - Try/catch para não quebrar webhook

---

## 🎯 Funcionalidades Implementadas

### 1. **Storage (DB Logs)**

**Tabela: speed_notification_channels**

Configuração de canais por device/cliente.

| Campo             | Tipo           | Descrição                                      |
|-------------------|----------------|------------------------------------------------|
| id                | BIGINT PK      | ID do canal                                    |
| device_id         | BIGINT         | ID do device (Traccar)                         |
| channel           | ENUM           | webhook, email, whatsapp, push                 |
| enabled           | BOOLEAN        | Canal habilitado/desabilitado                  |
| target            | VARCHAR(255)   | URL webhook, email, phone                      |
| throttle_seconds  | INT            | Throttle em segundos (padrão: 300 = 5 min)    |
| created_at        | TIMESTAMP      | Data criação                                   |
| updated_at        | TIMESTAMP      | Data atualização                               |

**Constraints:**
- Unique: (device_id, channel) → 1 canal por tipo por device
- Index: (device_id, channel, enabled) → queries rápidas

**Exemplo de registro:**

```json
{
  "id": 1,
  "device_id": 123,
  "channel": "webhook",
  "enabled": true,
  "target": "https://example.com/webhook",
  "throttle_seconds": 300,
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z"
}
```

---

**Tabela: speed_notifications**

Auditoria de envio (tracking + idempotência).

| Campo               | Tipo           | Descrição                                           |
|---------------------|----------------|-----------------------------------------------------|
| id                  | BIGINT PK      | ID da notificação                                   |
| speed_event_id      | BIGINT         | FK para speed_events                                |
| device_id           | BIGINT         | ID do device (denorm para queries)                  |
| channel             | ENUM           | webhook, email, whatsapp, push                      |
| target              | VARCHAR(255)   | Destinatário (URL, email, phone)                    |
| status              | ENUM           | queued, sent, failed, skipped                       |
| error_message       | TEXT           | Mensagem de erro (se failed)                        |
| sent_at             | DATETIME       | Quando foi enviado (se sent)                        |
| notification_hash   | VARCHAR(64)    | SHA-256 para idempotência (unique)                  |
| payload             | JSON           | Payload enviado                                     |
| created_at          | TIMESTAMP      | Data criação                                        |
| updated_at          | TIMESTAMP      | Data atualização                                    |

**Constraints:**
- Unique: notification_hash → idempotência (não repetir mesmo envio)
- Index: (device_id, created_at) → queries de auditoria
- Index: (speed_event_id, channel) → relacionamento
- Index: (status, created_at) → filtro por status

**Status lifecycle:**
1. `queued`: Criado, aguardando envio
2. `sent`: Enviado com sucesso (sent_at preenchido)
3. `failed`: Falhou após retries (error_message preenchido)
4. `skipped`: Pulado por throttle

**Exemplo de registro:**

```json
{
  "id": 42,
  "speed_event_id": 789,
  "device_id": 123,
  "channel": "webhook",
  "target": "https://example.com/webhook",
  "status": "sent",
  "error_message": null,
  "sent_at": "2025-01-20T10:05:12Z",
  "notification_hash": "a1b2c3d4e5f6...",
  "payload": {
    "type": "overspeed_limit",
    "deviceId": 123,
    "driverId": 7,
    "timestamp": "2025-01-20T10:05:00+00:00",
    "speedKmh": 105.5,
    "speedLimitKmh": 80,
    "exceedByKmh": 25.5,
    "latitude": -23.55,
    "longitude": -46.63,
    "address": "Av Paulista, 1000"
  },
  "created_at": "2025-01-20T10:05:12Z",
  "updated_at": "2025-01-20T10:05:12Z"
}
```

---

### 2. **Backend - Event/Listener/Job**

**Fluxo:**

```
SpeedEvent::create()
    ↓
event(new SpeedEventCreated($event))
    ↓
SpeedEventCreatedListener
    ↓
SendSpeedNotificationJob::dispatch($speedEventId)
    ↓
[Queue 'notifications']
    ↓
Job processa:
  1. Busca canais habilitados (device_id)
  2. Aplica throttling (Cache, TTL = throttle_seconds)
  3. Verifica idempotência (notification_hash unique)
  4. Cria speed_notifications (status = queued)
  5. Envia notificação (webhook/email)
  6. Atualiza status (sent/failed/skipped)
```

**Guardrails:**

1. **Não quebrar webhook do Traccar:**
   - Try/catch em SpeedEventCreatedListener: silencia erro
   - Try/catch no event(): silencia erro
   - Job assíncrono: não bloqueia ProcessSpeedEventsJob

2. **Throttling (evitar spam):**
   - Cache key: `speed_notification_throttle:{device_id}:{channel}`
   - TTL: `throttle_seconds` (padrão: 300s = 5 min)
   - Se cache existe: skipped (não envia)

3. **Idempotência (evitar duplicação):**
   - notification_hash = SHA-256 de: `speed_event_id|device_id|channel|target|floor(sent_window)`
   - sent_window: arredonda timestamp por throttle_seconds
   - Unique constraint: se duplicar, silencia erro (já enviado)

4. **Auditoria completa:**
   - Toda tentativa de envio gera registro em speed_notifications
   - Status tracking: queued → sent/failed/skipped
   - Error messages salvos em caso de falha

---

### 3. **Canal Webhook (Implementado)**

**Método:** `sendWebhook()`

**Request:**
- POST HTTP
- Timeout: 3 segundos
- Retries: 2 (100ms entre tentativas)
- Headers: Content-Type: application/json

**Payload:**

```json
{
  "type": "overspeed_limit",
  "deviceId": 123,
  "driverId": 7,
  "timestamp": "2025-01-20T10:05:00+00:00",
  "speedKmh": 105.5,
  "speedLimitKmh": 80,
  "exceedByKmh": 25.5,
  "latitude": -23.55,
  "longitude": -46.63,
  "address": "Av Paulista, 1000"
}
```

**Response esperado:**
- HTTP 200-299: sucesso (status = sent)
- HTTP 4xx/5xx: falha (status = failed, error_message salvo)

**Exemplo de configuração:**

```bash
POST /api/speed-notification-channels
{
  "deviceId": 123,
  "channel": "webhook",
  "enabled": true,
  "target": "https://example.com/webhook",
  "throttle_seconds": 300
}
```

---

### 4. **Canal Email (Implementado)**

**Método:** `sendEmail()`

**Template:** Texto simples (Laravel Mail::raw)

**Exemplo:**

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

**Configuração .env necessária:**

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

**Exemplo de configuração:**

```bash
POST /api/speed-notification-channels
{
  "deviceId": 123,
  "channel": "email",
  "enabled": true,
  "target": "admin@example.com",
  "throttle_seconds": 600
}
```

---

### 5. **API Endpoints**

**GET /api/speed-notification-channels?deviceId=123**

Listar canais configurados para um device.

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "device_id": 123,
      "channel": "webhook",
      "enabled": true,
      "target": "https://example.com/webhook",
      "throttle_seconds": 300,
      "created_at": "2025-01-20T10:00:00Z",
      "updated_at": "2025-01-20T10:00:00Z"
    },
    {
      "id": 2,
      "device_id": 123,
      "channel": "email",
      "enabled": false,
      "target": "admin@example.com",
      "throttle_seconds": 600,
      "created_at": "2025-01-20T10:00:00Z",
      "updated_at": "2025-01-20T10:00:00Z"
    }
  ]
}
```

---

**POST /api/speed-notification-channels**

Criar ou atualizar canal.

**Body:**

```json
{
  "deviceId": 123,
  "channel": "webhook",
  "enabled": true,
  "target": "https://example.com/webhook",
  "throttle_seconds": 300
}
```

**Response:**

```json
{
  "data": {
    "id": 1,
    "device_id": 123,
    "channel": "webhook",
    "enabled": true,
    "target": "https://example.com/webhook",
    "throttle_seconds": 300,
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z"
  }
}
```

---

**PUT /api/speed-notification-channels/{id}**

Atualizar canal existente.

**Body:**

```json
{
  "enabled": false,
  "throttle_seconds": 600
}
```

---

**DELETE /api/speed-notification-channels/{id}**

Deletar canal.

**Response:**

```json
{
  "message": "Channel deleted successfully"
}
```

---

**GET /api/speed-notifications?deviceId=123&from=2025-01-19T00:00:00Z&to=2025-01-20T23:59:59Z&channel=webhook&status=sent&page=1&perPage=50**

Listar notificações (auditoria).

**Response:**

```json
{
  "meta": {
    "total": 42,
    "perPage": 50,
    "currentPage": 1,
    "lastPage": 1
  },
  "data": [
    {
      "id": 42,
      "speed_event_id": 789,
      "device_id": 123,
      "channel": "webhook",
      "target": "https://example.com/webhook",
      "status": "sent",
      "error_message": null,
      "sent_at": "2025-01-20T10:05:12Z",
      "notification_hash": "a1b2c3d4e5f6...",
      "payload": { ... },
      "created_at": "2025-01-20T10:05:12Z",
      "updated_at": "2025-01-20T10:05:12Z"
    }
  ]
}
```

---

**GET /api/speed-notifications/{id}**

Detalhe de uma notificação (com speedEvent).

**Response:**

```json
{
  "data": {
    "id": 42,
    "speed_event_id": 789,
    "device_id": 123,
    "channel": "webhook",
    "target": "https://example.com/webhook",
    "status": "sent",
    "error_message": null,
    "sent_at": "2025-01-20T10:05:12Z",
    "notification_hash": "a1b2c3d4e5f6...",
    "payload": { ... },
    "created_at": "2025-01-20T10:05:12Z",
    "updated_at": "2025-01-20T10:05:12Z",
    "speed_event": {
      "id": 789,
      "event_type": "overspeed_limit",
      "device_id": 123,
      "driver_id": 7,
      "position_time": "2025-01-20T10:05:00Z",
      "speed_kmh": 105.5,
      "speed_limit_kmh": 80,
      "exceed_by_kmh": 25.5,
      "latitude": -23.55,
      "longitude": -46.63,
      "address": "Av Paulista, 1000"
    }
  }
}
```

---

## 🚀 Deploy e Setup

### Passo 1: Migrations

```bash
cd back-end

# Rodar migrations no banco LOGS
php artisan migrate --database=logs

# Verificar tabelas criadas
mysql -u root -p tarkan_logs

SHOW TABLES;
# speed_notification_channels ✓
# speed_notifications ✓

DESC speed_notification_channels;
DESC speed_notifications;
```

---

### Passo 2: Registrar EventServiceProvider

Adicionar ao `app/Providers/EventServiceProvider.php`:

```php
use App\Events\SpeedEventCreated;
use App\Listeners\SpeedEventCreatedListener;

protected $listen = [
    SpeedEventCreated::class => [
        SpeedEventCreatedListener::class,
    ],
];
```

Se arquivo não existir, usar o stub criado em `app/Providers/EventServiceProvider.php`.

**Registrar no config/app.php:**

```php
'providers' => [
    // ...
    App\Providers\EventServiceProvider::class, // PR-10C
],
```

---

### Passo 3: Configurar Queue Worker

**Opção A: Queue Worker (RECOMENDADO)**

```bash
# Iniciar worker (fila 'notifications')
php artisan queue:work --queue=notifications --tries=3 --timeout=30

# Supervisor (produção)
# /etc/supervisor/conf.d/laravel-notification-worker.conf
[program:laravel-notification-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/back-end/artisan queue:work --queue=notifications --tries=3 --timeout=30 --sleep=3
autostart=true
autorestart=true
numprocs=2
user=www-data
redirect_stderr=true
stdout_logfile=/path/to/back-end/storage/logs/worker-notifications.log
```

**Opção B: Sync (desenvolvimento)**

Se não tiver queue worker, usar sync (não recomendado produção):

```php
// .env
QUEUE_CONNECTION=sync
```

⚠️ **Sync bloqueia ProcessSpeedEventsJob até notificação enviar** (não ideal).

---

### Passo 4: Configurar Email (se usar canal email)

```env
# .env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=yourpassword
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="Tarkan Tracker"
```

Testar:

```bash
php artisan tinker

Mail::raw('Test PR-10C', function($msg) {
    $msg->to('admin@example.com')->subject('Test');
});
```

---

### Passo 5: Integrar no ProcessSpeedEventsJob

Abrir `app/Jobs/ProcessSpeedEventsJob.php`, adicionar import:

```php
use App\Events\SpeedEventCreated; // PR-10C
```

Localizar linha ~281 (após `SpeedEvent::create($data)`):

```php
try {
    // Criar evento (idempotente via event_hash unique)
    $event = SpeedEvent::create($data);

    // PR-10C: Disparar event para notificações
    // Crítico: try/catch para não quebrar o webhook
    try {
        event(new SpeedEventCreated($event));
    } catch (\Exception $notifError) {
        // Silenciar erro: não pode quebrar o webhook do Traccar
        \Log::warning('[PR-10C] Erro ao disparar SpeedEventCreated', [
            'speed_event_id' => $event->id,
            'error' => $notifError->getMessage(),
        ]);
    }

    // Dispatcher (stub PR-10A)
    $this->dispatcher->dispatch($event);

    return true;

} catch (\Illuminate\Database\QueryException $e) {
    // ...
}
```

---

### Passo 6: Adicionar Rotas API

Abrir `routes/api.php`, adicionar:

```php
use App\Http\Controllers\SpeedNotificationChannelController;
use App\Http\Controllers\SpeedNotificationController;

// PR-10C: Speed Notification Channels
Route::middleware(['auth:api'])->group(function () {
    Route::get('speed-notification-channels', [SpeedNotificationChannelController::class, 'index']);
    Route::post('speed-notification-channels', [SpeedNotificationChannelController::class, 'store']);
    Route::put('speed-notification-channels/{id}', [SpeedNotificationChannelController::class, 'update']);
    Route::delete('speed-notification-channels/{id}', [SpeedNotificationChannelController::class, 'destroy']);
});

// PR-10C: Speed Notifications (auditoria)
Route::middleware(['auth:api'])->group(function () {
    Route::get('speed-notifications', [SpeedNotificationController::class, 'index']);
    Route::get('speed-notifications/{id}', [SpeedNotificationController::class, 'show']);
});
```

---

## 🧪 Testes Manuais

### Teste 1: Configurar canal webhook

**1. Criar canal webhook para device 123:**

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

**Esperado:** HTTP 201, canal criado

---

### Teste 2: Simular speed event → 1 notificação sent

**1. Gerar overspeed para device 123:**

```bash
# Simular posição no Traccar (speed > limit)
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

**2. Aguardar ProcessSpeedEventsJob (polling):**

```bash
# Verificar logs
tail -f storage/logs/laravel.log | grep PR-10C

# Esperado:
# [PR-10C] SendSpeedNotificationJob dispatched speed_event_id=789 device_id=123
```

**3. Verificar webhook recebido em https://webhook.site:**

Payload:

```json
{
  "type": "overspeed_limit",
  "deviceId": 123,
  "driverId": null,
  "timestamp": "2025-01-20T10:05:00+00:00",
  "speedKmh": 105.5,
  "speedLimitKmh": 80,
  "exceedByKmh": 25.5,
  "latitude": -23.55,
  "longitude": -46.63,
  "address": null
}
```

**4. Verificar auditoria:**

```sql
SELECT * FROM tarkan_logs.speed_notifications 
WHERE device_id = 123 
ORDER BY created_at DESC 
LIMIT 5;

-- Esperado: 1 linha status = sent
```

---

### Teste 3: Throttling (reenviar mesmo evento → skipped)

**1. Gerar 2 overspeed em 30 segundos:**

```bash
# Evento 1
curl -X POST ...

# Aguardar 10s

# Evento 2 (mesmo device)
curl -X POST ...
```

**2. Verificar auditoria:**

```sql
SELECT id, status, created_at 
FROM tarkan_logs.speed_notifications 
WHERE device_id = 123 
ORDER BY created_at DESC 
LIMIT 2;

-- Esperado:
-- 1ª linha: status = sent
-- 2ª linha: status = skipped (throttled)
```

---

### Teste 4: Idempotência (duplicar evento → não gera notificação)

**1. Inserir speed_event manualmente (duplicar event_hash):**

```php
php artisan tinker

$event1 = SpeedEvent::create([...]);
event(new SpeedEventCreated($event1)); // → gera notification

$event2 = SpeedEvent::create([...]); // mesmo event_hash
event(new SpeedEventCreated($event2)); // → não gera (idempotência)
```

**2. Verificar:**

```sql
SELECT COUNT(*) FROM tarkan_logs.speed_notifications 
WHERE speed_event_id IN (789, 790);

-- Esperado: 1 (só primeira notificação criada)
```

---

### Teste 5: Webhook down → failed mas evento continua

**1. Configurar webhook para URL inválida:**

```bash
POST /api/speed-notification-channels
{
  "deviceId": 123,
  "channel": "webhook",
  "enabled": true,
  "target": "https://invalid-url-404.example.com/webhook",
  "throttle_seconds": 60
}
```

**2. Gerar overspeed:**

```bash
# Simular posição
curl -X POST http://localhost:8082/api/positions ...
```

**3. Verificar notificação:**

```sql
SELECT id, status, error_message 
FROM tarkan_logs.speed_notifications 
WHERE device_id = 123 
ORDER BY created_at DESC 
LIMIT 1;

-- Esperado:
-- status = failed
-- error_message = "Webhook failed: HTTP 404 - ..."
```

**4. Verificar que speed_event foi criado:**

```sql
SELECT COUNT(*) FROM tarkan_logs.speed_events 
WHERE device_id = 123 
  AND position_time >= NOW() - INTERVAL 5 MINUTE;

-- Esperado: 1 (evento criado, independente de notificação falhar)
```

---

### Teste 6: Email

**1. Configurar canal email:**

```bash
POST /api/speed-notification-channels
{
  "deviceId": 123,
  "channel": "email",
  "enabled": true,
  "target": "admin@example.com",
  "throttle_seconds": 300
}
```

**2. Gerar overspeed:**

```bash
# Simular posição
curl -X POST http://localhost:8082/api/positions ...
```

**3. Verificar email recebido:**

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

---

## 🛡️ Troubleshooting

### Erro 1: "Class 'SpeedEventCreated' not found"

**Causa:** Import faltando em ProcessSpeedEventsJob.php

**Solução:**

```php
use App\Events\SpeedEventCreated; // Adicionar no topo
```

---

### Erro 2: "Queue connection [database] not configured"

**Causa:** Queue não configurada no .env

**Solução:**

```env
# Opção A: Usar sync (desenvolvimento)
QUEUE_CONNECTION=sync

# Opção B: Usar database (produção)
QUEUE_CONNECTION=database
php artisan queue:table
php artisan migrate
php artisan queue:work --queue=notifications
```

---

### Erro 3: "SQLSTATE[42S02]: Base table or view not found: 'speed_notification_channels'"

**Causa:** Migration não rodou

**Solução:**

```bash
php artisan migrate --database=logs
```

---

### Erro 4: "Webhook failed: HTTP 0 - cURL error 28: Operation timed out"

**Causa:** Webhook URL não responde em 3s

**Solução:**

- Verificar se URL está acessível
- Aumentar timeout em SendSpeedNotificationJob::sendWebhook() (ex: 5s)
- Webhook deve responder rápido (< 3s recomendado)

---

### Erro 5: Notificação não envia (status queued eternamente)

**Causa:** Queue worker não está rodando

**Solução:**

```bash
# Verificar se worker está ativo
ps aux | grep queue:work

# Iniciar worker
php artisan queue:work --queue=notifications --tries=3 --timeout=30

# Processar job manualmente (desenvolvimento)
php artisan queue:work --once
```

---

### Erro 6: Throttling não funciona (envia repetidamente)

**Causa:** Cache não configurado

**Solução:**

```env
# .env
CACHE_DRIVER=file # ou redis

# Testar cache
php artisan tinker
Cache::put('test', 'value', 300);
Cache::get('test'); // deve retornar 'value'
```

---

## 📊 Métricas

### Backend Metrics

**Notificações enviadas (últimas 24h):**

```sql
SELECT 
  channel,
  status,
  COUNT(*) as total
FROM tarkan_logs.speed_notifications
WHERE created_at >= NOW() - INTERVAL 24 HOUR
GROUP BY channel, status
ORDER BY channel, status;
```

**Taxa de sucesso por canal:**

```sql
SELECT 
  channel,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped,
  ROUND(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
FROM tarkan_logs.speed_notifications
WHERE created_at >= NOW() - INTERVAL 7 DAY
GROUP BY channel;
```

**Latência média de envio (webhook):**

```sql
SELECT 
  channel,
  AVG(TIMESTAMPDIFF(SECOND, created_at, sent_at)) as avg_latency_seconds
FROM tarkan_logs.speed_notifications
WHERE status = 'sent'
  AND created_at >= NOW() - INTERVAL 24 HOUR
GROUP BY channel;
```

---

## 🔄 Próximos Passos

### PR-10C.1: WhatsApp + Push

**Canais adicionais:**
- WhatsApp (via Twilio/MessageBird/Z-API/Evolution API)
- Push (via Firebase Cloud Messaging)

**Entregáveis:**
- Implementar `sendWhatsApp()` em SendSpeedNotificationJob
- Implementar `sendPush()` em SendSpeedNotificationJob
- Configurar credenciais (TWILIO_*, FCM_*)
- Testes manuais

---

### PR-10C.2: Frontend UI (Configuração de Canais)

**Componente:** SpeedNotificationSettings.vue

**Features:**
- Listar canais configurados (GET /api/speed-notification-channels)
- Adicionar/editar/deletar canais (POST/PUT/DELETE)
- Toggle enabled/disabled
- Preview de payload
- Histórico de notificações (GET /api/speed-notifications)

**Integração:** Nova aba em edit-device.vue (após "Eventos de Velocidade")

---

### PR-10C.3: Templates Customizáveis

**Features:**
- Mailable Laravel para email (blade templates)
- Variáveis: {{deviceName}}, {{speed}}, {{limit}}, {{address}}
- Multi-idioma (pt-BR, en-US, es-ES)
- Preview de templates no frontend

---

## 🎉 Resultado Final

### ✅ PR-10C Completo

**Entregue:**
- ✅ 2 tabelas no banco LOGS (speed_notification_channels, speed_notifications)
- ✅ Event SpeedEventCreated + Listener SpeedEventCreatedListener
- ✅ Job SendSpeedNotificationJob (throttling, idempotência, webhook, email)
- ✅ Models SpeedNotificationChannel + SpeedNotification
- ✅ API Controllers (CRUD channels, auditoria notifications)
- ✅ Rotas API (GET/POST/PUT/DELETE)
- ✅ Documentação completa (este arquivo)
- ✅ Testes manuais (6 cenários documentados)
- ✅ Troubleshooting (6 erros comuns)

**Arquivos criados:** 11  
**Linhas de código:** ~1400 (migrations 150 + models 260 + event/listener 110 + job 450 + controllers 290 + routes 60 + docs 2000)

---

**Implementação PR-10C COMPLETA.**  
**Pronto para deploy.** ✅

---

**Commit message sugerida:**

```
feat(speed): notificações por canal para overspeed (PR-10C)

Adiciona sistema completo de notificações quando SpeedEvent é criado:

Backend:
- Event SpeedEventCreated + Listener SpeedEventCreatedListener
- Job SendSpeedNotificationJob (queue 'notifications', timeout 30s, retries 3)
- Throttling via Cache (padrão: 5 min por device+canal)
- Idempotência via notification_hash unique
- Canal webhook: HTTP POST, timeout 3s, retry 2x
- Canal email: Laravel Mail (template texto simples)

Storage (banco LOGS):
- Tabela speed_notification_channels (config por device/canal)
- Tabela speed_notifications (auditoria: queued → sent/failed/skipped)

API:
- GET/POST/PUT/DELETE /api/speed-notification-channels (CRUD)
- GET /api/speed-notifications (auditoria paginada)

Guardrails:
- Não quebra webhook do Traccar (try/catch silencioso)
- Throttling evita spam (Cache TTL = throttle_seconds)
- Idempotência evita duplicação (notification_hash unique)
- Auditoria completa (status tracking + error_message)

Migrations criadas:
- 2026_01_20_000001_create_speed_notification_channels_table.php
- 2026_01_20_000002_create_speed_notifications_table.php

Arquivos criados:
- app/Events/SpeedEventCreated.php
- app/Listeners/SpeedEventCreatedListener.php
- app/Providers/EventServiceProvider.php
- app/Jobs/SendSpeedNotificationJob.php
- app/Models/SpeedNotificationChannel.php
- app/Models/SpeedNotification.php
- app/Http/Controllers/SpeedNotificationChannelController.php
- app/Http/Controllers/SpeedNotificationController.php
- routes/api_pr10c.php
- INTEGRATION_PR10C.php
- PR-10C_SPEED_NOTIFICATIONS.md

Modificações necessárias:
- ProcessSpeedEventsJob.php: adicionar event(new SpeedEventCreated($event))
- routes/api.php: incluir rotas do api_pr10c.php
- config/app.php: registrar EventServiceProvider

Relacionado: PR-10A (SpeedEvent model), PR-10A.1 (ProcessSpeedEventsJob)
Próximo: PR-10C.1 (WhatsApp + Push), PR-10C.2 (Frontend UI)

Testes manuais: 6 cenários documentados em PR-10C_SPEED_NOTIFICATIONS.md
```
