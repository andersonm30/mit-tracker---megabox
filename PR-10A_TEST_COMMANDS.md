# PR-10A: Comandos de Teste

**Após deploy completo**, use estes comandos para validar a implementação.

---

## 1. Verificar Database

```bash
mysql -u root -p
```

```sql
-- Verificar database criado
SHOW DATABASES LIKE 'tarkan_logs';

-- Usar database
USE tarkan_logs;

-- Verificar tabela
SHOW TABLES;

-- Ver estrutura
DESC speed_events;

-- Deve ter 15 colunas:
-- id, event_type, device_id, driver_id, position_time, server_time,
-- speed_kmh, speed_limit_kmh, exceed_by_kmh, latitude, longitude,
-- address, payload, created_at, updated_at

-- Ver índices
SHOW INDEX FROM speed_events;

-- Deve ter 3 índices compostos:
-- idx_device_time, idx_driver_time, idx_event_type

-- Verificar registros (vazio inicialmente)
SELECT COUNT(*) FROM speed_events;
-- Resultado esperado: 0

EXIT;
```

---

## 2. Testar Endpoint API

### Teste 1: Endpoint disponível

```bash
curl -X GET "http://localhost:8000/api/speed-events?from=2026-01-01T00:00:00Z&to=2026-01-31T23:59:59Z"
```

**Response esperado** (sem dados ainda):

```json
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

### Teste 2: Validação de datas

```bash
# Tentar range > 31 dias (deve retornar erro 400)
curl -X GET "http://localhost:8000/api/speed-events?from=2026-01-01T00:00:00Z&to=2026-03-01T23:59:59Z"
```

**Response esperado**:

```json
{
  "error": "Date range cannot exceed 31 days",
  "requested": {
    "from": "2026-01-01T00:00:00Z",
    "to": "2026-03-01T23:59:59Z",
    "days": 59
  },
  "max_allowed": 31
}
```

---

### Teste 3: Filtro por device

```bash
curl -X GET "http://localhost:8000/api/speed-events?from=2026-01-01T00:00:00Z&to=2026-01-31T23:59:59Z&deviceId=123"
```

**Response esperado** (vazio, mas aceita o filtro):

```json
{
  "meta": {
    "filters": {
      "deviceId": 123,
      "driverId": null
    }
  },
  "data": []
}
```

---

## 3. Verificar Laravel

```bash
cd C:\projeto\Versao-tarkan-Jesse\back-end
```

### Listar rotas

```bash
php artisan route:list | grep speed
```

**Output esperado**:

```
GET|HEAD  api/speed-events  speed-events.index › SpeedEventController@index
```

---

### Verificar cache

```bash
php artisan config:cache
php artisan cache:clear
```

---

### Verificar logs

```bash
# Windows PowerShell
Get-Content storage\logs\laravel.log -Tail 20
```

Procurar por:
- `[SpeedEvent]`
- `[SpeedLimitEventDetector]`
- `[PR-10A]`

---

## 4. Testar Detector (Após Integração)

### Inserir evento manualmente (para teste)

```sql
USE tarkan_logs;

INSERT INTO speed_events (
    event_type, device_id, driver_id,
    position_time, server_time,
    speed_kmh, speed_limit_kmh, exceed_by_kmh,
    latitude, longitude, address,
    payload, created_at, updated_at
) VALUES (
    'overspeed_limit', 123, 7,
    '2026-01-19 14:30:00', '2026-01-19 14:30:05',
    105.5, 80.0, 25.5,
    -23.550520, -46.633308, 'Av. Paulista, 1000',
    '{"deviceName":"Veículo Teste","protocol":"osmand"}',
    NOW(), NOW()
);

-- Verificar inserção
SELECT * FROM speed_events ORDER BY id DESC LIMIT 1;
```

---

### Consultar via API

```bash
curl -X GET "http://localhost:8000/api/speed-events?deviceId=123&from=2026-01-19T00:00:00Z&to=2026-01-19T23:59:59Z"
```

**Response esperado** (com o evento inserido):

```json
{
  "meta": {
    "total": 1
  },
  "data": [
    {
      "id": 1,
      "event_type": "overspeed_limit",
      "device_id": 123,
      "driver_id": 7,
      "position_time": "2026-01-19T14:30:00.000000Z",
      "speed_kmh": 105.5,
      "speed_limit_kmh": 80.0,
      "exceed_by_kmh": 25.5,
      "latitude": -23.55052,
      "longitude": -46.633308,
      "address": "Av. Paulista, 1000"
    }
  ]
}
```

---

## 5. Testar Guardrails

### Teste de Debounce (10s)

**Cenário**: Device excede limite por 5s → não deve gerar evento

1. Configurar device com `speedLimitKmh = 80`
2. Enviar position com `speed = 85` (90 kn)
3. Aguardar 5 segundos
4. Enviar position com `speed = 75` (abaixo do limite)
5. Verificar: `SELECT * FROM speed_events WHERE device_id = ?`
6. **Resultado esperado**: 0 eventos (não passou debounce de 10s)

---

### Teste de Debounce (passou)

**Cenário**: Device excede limite por 15s → deve gerar evento

1. Configurar device com `speedLimitKmh = 80`
2. Enviar position com `speed = 85` a cada 5s
3. Após 15 segundos (3 positions)
4. Verificar: `SELECT * FROM speed_events WHERE device_id = ?`
5. **Resultado esperado**: 1 evento criado

---

### Teste de Rate-Limit (5 min)

**Cenário**: Device mantém excesso → não deve gerar múltiplos eventos

1. Após gerar 1 evento (teste anterior)
2. Device continua com `speed = 90` por 3 minutos
3. Verificar: `SELECT COUNT(*) FROM speed_events WHERE device_id = ?`
4. **Resultado esperado**: 1 evento (rate-limit bloqueou novos)
5. Aguardar 6 minutos (total)
6. Enviar nova position com `speed = 90`
7. Verificar novamente
8. **Resultado esperado**: 2 eventos (rate-limit expirou)

---

### Teste de Clear on Recovery

**Cenário**: Device volta ao limite → debounce deve ser limpo

1. Device com `speed = 90` por 5s (em debounce)
2. Speed cai para `speed = 75` (abaixo do limite)
3. Speed sobe novamente para `speed = 85`
4. Aguardar 5s (total de apenas 5s neste ciclo)
5. **Resultado esperado**: Debounce foi resetado, não gera evento ainda

---

### Teste de Opt-in

**Cenário**: Device sem limite configurado → nunca gera eventos

1. Device com `speedLimitKmh = 0` ou `null`
2. Enviar position com `speed = 200` (muito acima)
3. Aguardar 20 segundos
4. Verificar: `SELECT * FROM speed_events WHERE device_id = ?`
5. **Resultado esperado**: 0 eventos (opt-out automático)

---

## 6. Verificar Performance

### Query de agregação (futuro PR-11)

```sql
USE tarkan_logs;

-- Top 10 devices com mais eventos
SELECT 
    device_id,
    COUNT(*) as total_events,
    AVG(exceed_by_kmh) as avg_exceed,
    MAX(exceed_by_kmh) as max_exceed
FROM speed_events
WHERE event_type = 'overspeed_limit'
    AND position_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY device_id
ORDER BY total_events DESC
LIMIT 10;
```

---

### Query de série temporal (futuro PR-11)

```sql
-- Eventos por dia (últimos 7 dias)
SELECT 
    DATE(position_time) as date,
    COUNT(*) as events,
    AVG(speed_kmh) as avg_speed,
    AVG(exceed_by_kmh) as avg_exceed
FROM speed_events
WHERE event_type = 'overspeed_limit'
    AND position_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(position_time)
ORDER BY date DESC;
```

---

## 7. Limpeza de Dados de Teste

```sql
USE tarkan_logs;

-- Deletar eventos de teste (CUIDADO!)
DELETE FROM speed_events WHERE device_id = 123;

-- Ou deletar todos (resetar para produção)
TRUNCATE TABLE speed_events;
```

---

## 8. Monitoramento Contínuo

### Log tail (monitorar eventos em tempo real)

```bash
# PowerShell
Get-Content C:\projeto\Versao-tarkan-Jesse\back-end\storage\logs\laravel.log -Wait -Tail 10 | Select-String "SpeedEvent"
```

---

### Redis cache (se estiver usando)

```bash
redis-cli

# Ver chaves de debounce/rate-limit
KEYS speed:*

# Ver valor de uma chave
GET speed:debounce:123
GET speed:ratelimit:123

# TTL de uma chave
TTL speed:ratelimit:123

# Deletar chave (forçar reset)
DEL speed:debounce:123
```

---

## ✅ Checklist de Validação

```
Database:
[ ] tarkan_logs existe
[ ] speed_events tem 15 colunas
[ ] 3 índices compostos criados
[ ] Query SELECT funciona

API:
[ ] GET /api/speed-events retorna 200
[ ] Validação de datas funciona (>31 dias → 400)
[ ] Filtro deviceId funciona
[ ] Filtro driverId funciona
[ ] Paginação funciona (page, perPage)

Laravel:
[ ] Route listada em php artisan route:list
[ ] Cache funcionando (redis ou file)
[ ] Logs em storage/logs/laravel.log

Detector:
[ ] Evento inserido manualmente consulta via API
[ ] Debounce 10s funciona
[ ] Rate-limit 5 min funciona
[ ] Clear on recovery funciona
[ ] Opt-in (speedLimitKmh > 0) funciona

Integration:
[ ] Detector integrado no backend
[ ] Position real gera evento
[ ] Driver_id capturado corretamente
[ ] Payload JSON salvo corretamente
[ ] Não quebra fluxo se falhar
```

---

**Fim dos Comandos de Teste PR-10A** ✅
