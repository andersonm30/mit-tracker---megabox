# PR-11A - SPEED ANALYTICS (Backend)

## ✅ Status: COMPLETO

**Data:** 2025-01-20  
**Tipo:** Read-only Analytics  
**Arquivos criados:** 3  
**Database:** `tarkan_logs.speed_events`

---

## 📦 Arquivos Implementados

### ✅ Criados

1. **app/Http/Controllers/SpeedAnalyticsController.php** (~300 linhas)
   - 3 métodos: `trends()`, `ranking()`, `heatmap()`
   - Somente SELECT (zero escrita)
   - Connection: tarkan_logs
   - Event type: overspeed_limit

2. **app/Http/Requests/SpeedAnalyticsRequest.php** (~150 linhas)
   - Validação unificada para os 3 endpoints
   - Range máximo: 31 dias
   - Rules dinâmicas por endpoint
   - Mensagens customizadas em português

3. **routes/api.php** (adicionar 3 rotas)
   - GET /api/speed-events/trends
   - GET /api/speed-events/ranking
   - GET /api/speed-events/heatmap
   - Middleware: auth:api (ajustar conforme projeto)

---

## 🎯 Endpoints Implementados

### 1. **Trends (Série Temporal)**

**Endpoint:** `GET /api/speed-events/trends`

**Descrição:** Agrupa eventos por bucket temporal (day/hour) e retorna métricas agregadas.

**Parâmetros:**

| Param | Tipo | Required | Default | Descrição |
|-------|------|----------|---------|-----------|
| `from` | ISO datetime | ✅ | - | Data/hora início (ex: 2025-01-20T00:00:00Z) |
| `to` | ISO datetime | ✅ | - | Data/hora fim (ex: 2025-01-27T23:59:59Z) |
| `deviceId` | integer | ❌ | null | Filtrar por device específico |
| `driverId` | integer | ❌ | null | Filtrar por driver específico |
| `bucket` | string | ❌ | `day` | Agrupamento: `day` ou `hour` |

**Response:**

```json
{
  "meta": {
    "from": "2025-01-20T00:00:00+00:00",
    "to": "2025-01-27T23:59:59+00:00",
    "bucket": "day",
    "total_buckets": 7,
    "deviceId": null,
    "driverId": null
  },
  "data": [
    {
      "bucket_start": "2025-01-20T00:00:00+00:00",
      "total_events": 15,
      "avg_exceed_by_kmh": 12.50,
      "max_exceed_by_kmh": 25.30
    },
    {
      "bucket_start": "2025-01-21T00:00:00+00:00",
      "total_events": 8,
      "avg_exceed_by_kmh": 9.20,
      "max_exceed_by_kmh": 18.50
    }
  ]
}
```

**Exemplo cURL:**

```bash
curl -X GET "http://localhost:8082/api/speed-events/trends?from=2025-01-20T00:00:00Z&to=2025-01-27T23:59:59Z&bucket=day" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**SQL Equivalente:**

```sql
-- bucket=day
SELECT 
  DATE_FORMAT(position_time, '%Y-%m-%d 00:00:00') as bucket_start,
  COUNT(*) as total_events,
  ROUND(AVG(exceed_by_kmh), 2) as avg_exceed_by_kmh,
  ROUND(MAX(exceed_by_kmh), 2) as max_exceed_by_kmh
FROM tarkan_logs.speed_events
WHERE event_type = 'overspeed_limit'
  AND position_time BETWEEN '2025-01-20 00:00:00' AND '2025-01-27 23:59:59'
GROUP BY bucket_start
ORDER BY bucket_start ASC;

-- bucket=hour
SELECT 
  DATE_FORMAT(position_time, '%Y-%m-%d %H:00:00') as bucket_start,
  COUNT(*) as total_events,
  ROUND(AVG(exceed_by_kmh), 2) as avg_exceed_by_kmh,
  ROUND(MAX(exceed_by_kmh), 2) as max_exceed_by_kmh
FROM tarkan_logs.speed_events
WHERE event_type = 'overspeed_limit'
  AND position_time BETWEEN '2025-01-20 00:00:00' AND '2025-01-27 23:59:59'
GROUP BY bucket_start
ORDER BY bucket_start ASC;
```

---

### 2. **Ranking (Top Violadores)**

**Endpoint:** `GET /api/speed-events/ranking`

**Descrição:** Retorna top devices ou drivers com mais violações, ordenado por total de eventos.

**Parâmetros:**

| Param | Tipo | Required | Default | Descrição |
|-------|------|----------|---------|-----------|
| `from` | ISO datetime | ✅ | - | Data/hora início |
| `to` | ISO datetime | ✅ | - | Data/hora fim |
| `groupBy` | string | ❌ | `device` | Agrupar por: `device` ou `driver` |
| `limit` | integer | ❌ | `10` | Quantidade de resultados (max: 100) |

**Response:**

```json
{
  "meta": {
    "from": "2025-01-01T00:00:00+00:00",
    "to": "2025-01-31T23:59:59+00:00",
    "groupBy": "device",
    "limit": 10,
    "total_returned": 10
  },
  "data": [
    {
      "key_id": 123,
      "total_events": 45,
      "avg_exceed_by_kmh": 15.20,
      "max_exceed_by_kmh": 30.50
    },
    {
      "key_id": 456,
      "total_events": 32,
      "avg_exceed_by_kmh": 12.80,
      "max_exceed_by_kmh": 28.00
    }
  ]
}
```

**Exemplo cURL:**

```bash
# Top 10 devices
curl -X GET "http://localhost:8082/api/speed-events/ranking?from=2025-01-01T00:00:00Z&to=2025-01-31T23:59:59Z&groupBy=device&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Top 5 drivers
curl -X GET "http://localhost:8082/api/speed-events/ranking?from=2025-01-01T00:00:00Z&to=2025-01-31T23:59:59Z&groupBy=driver&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**SQL Equivalente:**

```sql
-- groupBy=device
SELECT 
  device_id as key_id,
  COUNT(*) as total_events,
  ROUND(AVG(exceed_by_kmh), 2) as avg_exceed_by_kmh,
  ROUND(MAX(exceed_by_kmh), 2) as max_exceed_by_kmh
FROM tarkan_logs.speed_events
WHERE event_type = 'overspeed_limit'
  AND position_time BETWEEN '2025-01-01 00:00:00' AND '2025-01-31 23:59:59'
GROUP BY device_id
ORDER BY total_events DESC, max_exceed_by_kmh DESC, avg_exceed_by_kmh DESC
LIMIT 10;

-- groupBy=driver (ignora NULL)
SELECT 
  driver_id as key_id,
  COUNT(*) as total_events,
  ROUND(AVG(exceed_by_kmh), 2) as avg_exceed_by_kmh,
  ROUND(MAX(exceed_by_kmh), 2) as max_exceed_by_kmh
FROM tarkan_logs.speed_events
WHERE event_type = 'overspeed_limit'
  AND position_time BETWEEN '2025-01-01 00:00:00' AND '2025-01-31 23:59:59'
  AND driver_id IS NOT NULL
GROUP BY driver_id
ORDER BY total_events DESC, max_exceed_by_kmh DESC, avg_exceed_by_kmh DESC
LIMIT 5;
```

---

### 3. **Heatmap (Grid Geográfico)**

**Endpoint:** `GET /api/speed-events/heatmap`

**Descrição:** Agrupa eventos por grid lat/lng arredondado, retorna hotspots ordenados por total de eventos.

**Parâmetros:**

| Param | Tipo | Required | Default | Descrição |
|-------|------|----------|---------|-----------|
| `from` | ISO datetime | ✅ | - | Data/hora início |
| `to` | ISO datetime | ✅ | - | Data/hora fim |
| `precision` | integer | ❌ | `3` | Precisão de arredondamento (1-6) |
| `maxPoints` | integer | ❌ | `2000` | Máximo de pontos (max: 5000) |
| `deviceId` | integer | ❌ | null | Filtrar por device específico |

**Precision:**
- `precision=1`: agrupa por 0.1° (~11km)
- `precision=2`: agrupa por 0.01° (~1.1km)
- `precision=3`: agrupa por 0.001° (~110m) ← **default**
- `precision=4`: agrupa por 0.0001° (~11m)

**Response:**

```json
{
  "meta": {
    "from": "2025-01-01T00:00:00+00:00",
    "to": "2025-01-31T23:59:59+00:00",
    "precision": 3,
    "maxPoints": 2000,
    "total_returned": 150,
    "truncated": false,
    "deviceId": null
  },
  "data": [
    {
      "lat": -23.550,
      "lng": -46.634,
      "total_events": 12,
      "avg_exceed_by_kmh": 14.50,
      "max_exceed_by_kmh": 28.30
    },
    {
      "lat": -23.551,
      "lng": -46.633,
      "total_events": 8,
      "avg_exceed_by_kmh": 11.20,
      "max_exceed_by_kmh": 22.00
    }
  ]
}
```

**Truncated:**
- `false`: todos os pontos retornados
- `true`: resultado limitado a `maxPoints` (refine filtros ou reduza range)

**Exemplo cURL:**

```bash
# Heatmap geral (precision=3, max 2000 pontos)
curl -X GET "http://localhost:8082/api/speed-events/heatmap?from=2025-01-01T00:00:00Z&to=2025-01-31T23:59:59Z&precision=3&maxPoints=2000" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Heatmap de device específico
curl -X GET "http://localhost:8082/api/speed-events/heatmap?from=2025-01-01T00:00:00Z&to=2025-01-31T23:59:59Z&deviceId=123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**SQL Equivalente:**

```sql
-- precision=3 (factor=1000)
SELECT 
  ROUND(latitude * 1000) / 1000 as lat,
  ROUND(longitude * 1000) / 1000 as lng,
  COUNT(*) as total_events,
  ROUND(AVG(exceed_by_kmh), 2) as avg_exceed_by_kmh,
  ROUND(MAX(exceed_by_kmh), 2) as max_exceed_by_kmh
FROM tarkan_logs.speed_events
WHERE event_type = 'overspeed_limit'
  AND position_time BETWEEN '2025-01-01 00:00:00' AND '2025-01-31 23:59:59'
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL
GROUP BY lat, lng
ORDER BY total_events DESC
LIMIT 2000;

-- Com deviceId
SELECT 
  ROUND(latitude * 1000) / 1000 as lat,
  ROUND(longitude * 1000) / 1000 as lng,
  COUNT(*) as total_events,
  ROUND(AVG(exceed_by_kmh), 2) as avg_exceed_by_kmh,
  ROUND(MAX(exceed_by_kmh), 2) as max_exceed_by_kmh
FROM tarkan_logs.speed_events
WHERE event_type = 'overspeed_limit'
  AND position_time BETWEEN '2025-01-01 00:00:00' AND '2025-01-31 23:59:59'
  AND device_id = 123
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL
GROUP BY lat, lng
ORDER BY total_events DESC
LIMIT 2000;
```

---

## 🛡️ Guardrails e Limites

### 1. **Range Temporal**

- **Obrigatório:** `from` e `to` (ISO 8601)
- **Máximo:** 31 dias
- **Validação:** `to > from`
- **Erro:** 422 Unprocessable Entity

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "to": ["O range máximo permitido é de 31 dias."]
  }
}
```

### 2. **Limites por Endpoint**

| Endpoint | Parâmetro | Default | Max | Validação |
|----------|-----------|---------|-----|-----------|
| Trends | bucket | day | - | day\|hour |
| Ranking | limit | 10 | 100 | integer |
| Heatmap | precision | 3 | 6 | 1-6 |
| Heatmap | maxPoints | 2000 | 5000 | integer |

### 3. **Performance**

- **Event type:** Sempre filtra `event_type = 'overspeed_limit'`
- **Índices usados:** `idx_device_time`, `idx_driver_time`, `idx_event_type` (se existir)
- **Connection:** `tarkan_logs` (separado do Traccar)

---

## 🧪 Smoke Tests (5 minutos)

### Teste 1: Trends (day bucket)

```bash
curl -X GET "http://localhost:8082/api/speed-events/trends?from=2025-01-20T00:00:00Z&to=2025-01-27T23:59:59Z&bucket=day" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Esperado:**
- ✅ Status 200
- ✅ `meta.total_buckets` = 7 (se houver eventos em todos os dias)
- ✅ `data[].bucket_start` ordenado ASC
- ✅ `data[].total_events` > 0

### Teste 2: Trends (hour bucket)

```bash
curl -X GET "http://localhost:8082/api/speed-events/trends?from=2025-01-20T00:00:00Z&to=2025-01-20T23:59:59Z&bucket=hour" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Esperado:**
- ✅ Status 200
- ✅ `meta.total_buckets` ≤ 24
- ✅ `data[].bucket_start` em formato ISO com hora

### Teste 3: Ranking (device)

```bash
curl -X GET "http://localhost:8082/api/speed-events/ranking?from=2025-01-01T00:00:00Z&to=2025-01-31T23:59:59Z&groupBy=device&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Esperado:**
- ✅ Status 200
- ✅ `meta.total_returned` ≤ 10
- ✅ `data[].key_id` = device_id
- ✅ `data[0].total_events` ≥ `data[1].total_events` (ordenação DESC)

### Teste 4: Ranking (driver)

```bash
curl -X GET "http://localhost:8082/api/speed-events/ranking?from=2025-01-01T00:00:00Z&to=2025-01-31T23:59:59Z&groupBy=driver&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Esperado:**
- ✅ Status 200
- ✅ Nenhum `data[].key_id` = null (drivers NULL ignorados)
- ✅ Ordenação DESC por total_events

### Teste 5: Heatmap (sem deviceId)

```bash
curl -X GET "http://localhost:8082/api/speed-events/heatmap?from=2025-01-01T00:00:00Z&to=2025-01-31T23:59:59Z&precision=3&maxPoints=2000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Esperado:**
- ✅ Status 200
- ✅ `meta.truncated` = true ou false (conforme resultado)
- ✅ `data[].lat` e `data[].lng` arredondados (3 decimais)
- ✅ `data[].total_events` > 0

### Teste 6: Heatmap (com deviceId)

```bash
curl -X GET "http://localhost:8082/api/speed-events/heatmap?from=2025-01-01T00:00:00Z&to=2025-01-31T23:59:59Z&deviceId=123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Esperado:**
- ✅ Status 200
- ✅ Resultado só de device 123

### Teste 7: Validação (range > 31 dias)

```bash
curl -X GET "http://localhost:8082/api/speed-events/trends?from=2024-01-01T00:00:00Z&to=2025-12-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Esperado:**
- ✅ Status 422
- ✅ `errors.to[0]` = "O range máximo permitido é de 31 dias."

---

## 🔍 Performance Check (opcional)

### EXPLAIN Trends

```sql
EXPLAIN SELECT 
  DATE_FORMAT(position_time, '%Y-%m-%d 00:00:00') as bucket_start,
  COUNT(*) as total_events,
  ROUND(AVG(exceed_by_kmh), 2) as avg_exceed_by_kmh,
  ROUND(MAX(exceed_by_kmh), 2) as max_exceed_by_kmh
FROM tarkan_logs.speed_events
WHERE event_type = 'overspeed_limit'
  AND position_time BETWEEN '2025-01-20 00:00:00' AND '2025-01-27 23:59:59'
GROUP BY bucket_start
ORDER BY bucket_start ASC;
```

**Esperado:**
- type: `range` (usa índice em position_time)
- key: `idx_device_time` ou similar
- rows: < 10000 (para 7 dias)

### EXPLAIN Ranking

```sql
EXPLAIN SELECT 
  device_id as key_id,
  COUNT(*) as total_events,
  ROUND(AVG(exceed_by_kmh), 2) as avg_exceed_by_kmh,
  ROUND(MAX(exceed_by_kmh), 2) as max_exceed_by_kmh
FROM tarkan_logs.speed_events
WHERE event_type = 'overspeed_limit'
  AND position_time BETWEEN '2025-01-01 00:00:00' AND '2025-01-31 23:59:59'
GROUP BY device_id
ORDER BY total_events DESC
LIMIT 10;
```

**Esperado:**
- type: `range`
- Extra: `Using temporary; Using filesort` (aceitável para ranking)

### EXPLAIN Heatmap

```sql
EXPLAIN SELECT 
  ROUND(latitude * 1000) / 1000 as lat,
  ROUND(longitude * 1000) / 1000 as lng,
  COUNT(*) as total_events,
  ROUND(AVG(exceed_by_kmh), 2) as avg_exceed_by_kmh,
  ROUND(MAX(exceed_by_kmh), 2) as max_exceed_by_kmh
FROM tarkan_logs.speed_events
WHERE event_type = 'overspeed_limit'
  AND position_time BETWEEN '2025-01-01 00:00:00' AND '2025-01-31 23:59:59'
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL
GROUP BY lat, lng
ORDER BY total_events DESC
LIMIT 2000;
```

**Esperado:**
- type: `range`
- Extra: `Using temporary; Using filesort` (aceitável)

**Nota:** Se queries forem lentas (> 1s):
- Considerar índice composto: `(event_type, position_time)`
- Considerar tabela agregada diária (futuro)

---

## 📊 Métricas Esperadas

### Response Time

| Endpoint | Range | Expected |
|----------|-------|----------|
| Trends (day) | 7 dias | < 200ms |
| Trends (hour) | 1 dia | < 300ms |
| Ranking | 31 dias | < 500ms |
| Heatmap | 31 dias | < 1000ms |

### Queries

| Endpoint | Queries | Cache |
|----------|---------|-------|
| Trends | 1 SELECT | Não |
| Ranking | 1 SELECT | Não |
| Heatmap | 1 SELECT | Não |

**Nota:** Se necessário, adicionar cache Laravel (1 min) nos controllers.

---

## 🚀 Deploy Checklist

### Pré-Deploy

- [ ] Conferir índices em `tarkan_logs.speed_events`
  ```sql
  SHOW INDEX FROM tarkan_logs.speed_events;
  ```
- [ ] Confirmar connection `logs` em `config/database.php`
- [ ] Ajustar middleware auth em `routes/api.php` conforme projeto

### Deploy

1. **Copiar arquivos:**
   ```bash
   cp backend-pr10a/app/Http/Controllers/SpeedAnalyticsController.php back-end/app/Http/Controllers/
   cp backend-pr10a/app/Http/Requests/SpeedAnalyticsRequest.php back-end/app/Http/Requests/
   ```

2. **Adicionar rotas em `back-end/routes/api.php`:**
   ```php
   // PR-11A: Analytics
   Route::middleware('auth:api')->group(function () {
       Route::get('/speed-events/trends', [SpeedAnalyticsController::class, 'trends'])
           ->name('speed-analytics.trends');
       Route::get('/speed-events/ranking', [SpeedAnalyticsController::class, 'ranking'])
           ->name('speed-analytics.ranking');
       Route::get('/speed-events/heatmap', [SpeedAnalyticsController::class, 'heatmap'])
           ->name('speed-analytics.heatmap');
   });
   ```

3. **Testar rotas:**
   ```bash
   php artisan route:list | grep speed-analytics
   ```

4. **Executar smoke tests (seção acima)**

### Pós-Deploy

- [ ] Validar 7 smoke tests (todos 200/422)
- [ ] Conferir logs Laravel (`storage/logs/laravel.log`)
- [ ] Monitorar response time (< 1s ideal)
- [ ] Se lento, considerar cache ou índices

---

## 🎉 Resultado Final

### ✅ PR-11A Completo

**Entregue:**
- ✅ 3 endpoints analytics (trends, ranking, heatmap)
- ✅ Validação unificada (range 31 dias, params corretos)
- ✅ Read-only (zero risco de escrita)
- ✅ Somente tarkan_logs (zero toque Traccar)
- ✅ Response padronizado (meta + data)
- ✅ Documentação completa (curl + SQL + smoke tests)

**Arquivos:**
- SpeedAnalyticsController.php (~300 linhas)
- SpeedAnalyticsRequest.php (~150 linhas)
- Rotas em routes/api.php (3 rotas)
- PR-11A_ANALYTICS.md (este arquivo)

**Próximos passos:**
- PR-11B: Frontend (Vue components + charts)
- PR-11C: Tabela agregada diária (opcional, se performance exigir)

---

**Implementação PR-11A COMPLETA.**  
**Pronto para deploy.** ✅
