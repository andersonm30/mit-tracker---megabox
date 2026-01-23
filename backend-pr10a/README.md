# PR-10A: Backend Speed Events - Guia de Implementação

**Status**: ✅ Código pronto, aguardando deploy  
**Data**: 2026-01-19  
**Duração estimada**: 30-45 minutos

---

## 📦 Estrutura de Arquivos

```
backend-pr10a/
├── app/
│   ├── Models/
│   │   └── SpeedEvent.php                              ✅ PRONTO
│   ├── Services/
│   │   └── Speed/
│   │       ├── SpeedLimitEventDetector.php            ✅ PRONTO
│   │       └── SpeedNotificationDispatcher.php        ✅ PRONTO
│   └── Http/
│       └── Controllers/
│           └── SpeedEventController.php                ✅ PRONTO
├── database/
│   └── migrations/
│       └── 2026_01_19_000001_create_speed_events_table.php  ✅ PRONTO
├── config/
│   └── database_logs_connection.php                    ⚠️ ADICIONAR MANUALMENTE
├── routes/
│   └── api_speed_events_routes.php                     ⚠️ ADICIONAR MANUALMENTE
├── INTEGRATION_EXAMPLE.php                             📖 CONSULTAR
└── README.md                                           📖 ESTE ARQUIVO
```

---

## 🚀 Deploy Rápido (5 passos)

### 1️⃣ Rodar Script de Deploy

```powershell
cd C:\projeto\Versao-tarkan-Jesse\front-end
.\deploy-pr10a.ps1
```

**O que faz**:
- ✅ Copia Migration para `back-end/database/migrations/`
- ✅ Copia Model SpeedEvent para `back-end/app/Models/`
- ✅ Cria diretório `back-end/app/Services/Speed/`
- ✅ Copia Detector e Dispatcher
- ✅ Copia Controller
- ⚠️ Avisa sobre arquivos que precisam edição manual

---

### 2️⃣ Atualizar config/database.php

**Arquivo**: `C:\projeto\Versao-tarkan-Jesse\back-end\config\database.php`

**Adicionar conexão 'logs'** (após `mysql_traccar`):

```php
'connections' => [
    'mysql' => [...],
    'mysql_traccar' => [...],
    
    // PR-10A: Banco de logs (isolado do Traccar)
    'logs' => [
        'driver' => 'mysql',
        'host' => env('LOGS_DB_HOST', '127.0.0.1'),
        'port' => env('LOGS_DB_PORT', '3306'),
        'database' => env('LOGS_DB_DATABASE', 'tarkan_logs'),
        'username' => env('LOGS_DB_USERNAME', 'root'),
        'password' => env('LOGS_DB_PASSWORD', ''),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => '',
        'strict' => true,
        'engine' => 'InnoDB',
    ],
],
```

---

### 3️⃣ Atualizar .env

**Arquivo**: `C:\projeto\Versao-tarkan-Jesse\back-end\.env`

**Adicionar variáveis**:

```env
# PR-10A: Banco de logs
LOGS_DB_HOST=localhost
LOGS_DB_PORT=3306
LOGS_DB_DATABASE=tarkan_logs
LOGS_DB_USERNAME=root
LOGS_DB_PASSWORD=sua_senha_aqui
```

---

### 4️⃣ Criar Banco e Rodar Migration

```bash
# 1. Criar database
mysql -u root -p
CREATE DATABASE tarkan_logs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 2. Rodar migration
cd C:\projeto\Versao-tarkan-Jesse\back-end
php artisan migrate --database=logs

# 3. Verificar
mysql -u root -p tarkan_logs
SHOW TABLES;  # Deve exibir: speed_events
DESC speed_events;  # Deve exibir 15 colunas
EXIT;
```

---

### 5️⃣ Adicionar Rotas API

**Arquivo**: `C:\projeto\Versao-tarkan-Jesse\back-end\routes\api.php`

**Adicionar no topo** (com outros use statements):

```php
use App\Http\Controllers\SpeedEventController;
```

**Adicionar no final** (após outras rotas):

```php
// PR-10A: Endpoints de eventos de excesso de velocidade
Route::group(['prefix' => 'speed-events'], function() {
    Route::get('/', [SpeedEventController::class, 'index']);
});
```

---

## 🔧 Integração no Código (CRÍTICO)

**Próximo passo**: Integrar detector onde positions são processadas.

### Como Encontrar o Ponto de Integração

```bash
cd C:\projeto\Versao-tarkan-Jesse\back-end

# Buscar por methods que processam positions
grep -r "fixTime" app/
grep -r "serverTime" app/
grep -r "updatePosition" app/
grep -r "processPosition" app/
grep -r "handleWebhook" app/
```

### Exemplo de Integração

**Consulte**: `backend-pr10a/INTEGRATION_EXAMPLE.php` para exemplos completos.

**Código resumido**:

```php
use App\Services\Speed\SpeedLimitEventDetector;
use App\Services\Speed\SpeedNotificationDispatcher;
use App\Models\SpeedEvent;

// No método onde position é processada:
try {
    $detector = new SpeedLimitEventDetector();
    $eventData = $detector->checkSpeedLimit($position, $device);
    
    if ($eventData) {
        $event = SpeedEvent::create($eventData);
        (new SpeedNotificationDispatcher())->dispatch($event);
    }
} catch (\Exception $e) {
    \Log::error('[PR-10A] Detection failed', [
        'device_id' => $device->id,
        'error' => $e->getMessage(),
    ]);
}
```

**IMPORTANTE**:
- ✅ Adicionar APÓS device estar carregado com attributes
- ✅ Adicionar dentro de try/catch (não quebrar fluxo)
- ✅ $position deve ser array com: fixTime, speed, latitude, longitude
- ✅ $device deve ter attributes.speedLimitKmh ou attributes.speedLimit

---

## ✅ Teste do Endpoint

```bash
# Testar endpoint (sem dados ainda, deve retornar vazio)
curl -X GET "http://localhost:8000/api/speed-events?from=2026-01-01T00:00:00Z&to=2026-01-31T23:59:59Z"

# Response esperado:
{
  "meta": {
    "from": "2026-01-01T00:00:00Z",
    "to": "2026-01-31T23:59:59Z",
    "total": 0,
    "perPage": 50,
    "currentPage": 1,
    "lastPage": 1,
    "filters": {
      "deviceId": null,
      "driverId": null
    }
  },
  "data": []
}
```

---

## 🛡️ Guardrails Implementados

| Guardrail | Implementação | Onde |
|-----------|---------------|------|
| **Debounce 10s** | Cache timestamp de início | SpeedLimitEventDetector.php linha 67 |
| **Rate-limit 5 min** | Cache::add() atômico | SpeedLimitEventDetector.php linha 91 |
| **Out-of-order protection** | max(0, now - start) | SpeedLimitEventDetector.php linha 88 |
| **Clear on recovery** | clearDebounce() | SpeedLimitEventDetector.php linha 57 |
| **Opt-in** | speedLimitKmh > 0 | SpeedLimitEventDetector.php linha 50 |
| **Payload array** | Model cast 'array' | SpeedEvent.php linha 57 |
| **DB isolado** | $connection = 'logs' | SpeedEvent.php linha 18 |
| **Max 31 dias** | Validação em controller | SpeedEventController.php linha 57 |
| **Paginação max 500** | min($perPage, 500) | SpeedEventController.php linha 84 |

---

## 📊 Verificação Final

### Checklist de Deploy

- [ ] Script `deploy-pr10a.ps1` executado com sucesso
- [ ] Conexão 'logs' adicionada em `config/database.php`
- [ ] Variáveis LOGS_DB_* adicionadas em `.env`
- [ ] Database `tarkan_logs` criado
- [ ] Migration rodada: `php artisan migrate --database=logs`
- [ ] Tabela `speed_events` existe e tem 15 colunas
- [ ] Rotas adicionadas em `routes/api.php`
- [ ] Endpoint testado: `GET /api/speed-events` retorna JSON válido
- [ ] Integração adicionada no ponto de processamento de positions
- [ ] Log de teste: verificar `storage/logs/laravel.log`

### Validação de Evento

Após integrar detector, simule um excesso:

1. Device com `speedLimitKmh = 80`
2. Enviar position com `speed > 80` por 15 segundos
3. Verificar: `SELECT * FROM tarkan_logs.speed_events ORDER BY id DESC LIMIT 5;`
4. Deve ter 1 registro com `exceed_by_kmh > 0`

---

## 🔄 Rollback (Se Necessário)

```bash
# 1. Comentar integração no código (try/catch do detector)

# 2. NÃO deletar tabela (manter histórico)
# NÃO FAZER: DROP TABLE speed_events;

# 3. Desabilitar rotas (comentar em routes/api.php)

# 4. Limpar cache
php artisan cache:clear
```

---

## 📚 Referências

- **PR-09A**: Backend SpeedNormalizer (deployed)
- **PR-09B**: Campo speedLimitKmh (deployed)
- **PR-09C**: Guardrails UI (deployed)
- **PR-10A**: Este documento (backend events)
- **BACKEND_DISCOVERY_V1.0.md**: Estrutura do backend Laravel

---

## 🚦 Próximos Passos

**Após PR-10A deployado**:

- **PR-10B** (Frontend): Toggle alertas, SpeedEventHistory.vue, badges
- **PR-10C** (Notificações): Webhook, WhatsApp, Push
- **PR-11** (Analytics): Dashboard, heatmap, ranking

---

## ❓ Troubleshooting

### Migration falha

```bash
# Erro: "SQLSTATE[HY000] [1049] Unknown database 'tarkan_logs'"
# Solução: Criar database primeiro
mysql -u root -p
CREATE DATABASE tarkan_logs CHARACTER SET utf8mb4;
```

### Endpoint retorna 404

```bash
# Erro: "Route [api/speed-events] not found"
# Solução: Verificar se rotas foram adicionadas em routes/api.php
php artisan route:list | grep speed
```

### Cache não funciona

```bash
# Erro: detector não debounce
# Solução: Verificar CACHE_DRIVER em .env
php artisan config:cache
php artisan cache:clear
```

### Eventos duplicados

```bash
# Erro: 2 eventos para mesma position
# Solução: Cache::add() deve estar sendo usado (não Cache::put)
# Verificar SpeedLimitEventDetector.php linha 91
```

---

**Fim do Guia de Implementação PR-10A** ✅
