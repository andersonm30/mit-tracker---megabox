# PR-10B - PRE-CHECK VALIDATION

**Data:** 2025-01-19  
**Objetivo:** Validar endpoint GET /api/speed-events ANTES de implementar UI

---

## ⚠️ CHECK OBRIGATÓRIO (antes de codar)

### Passo 1: Pegar deviceId real

```bash
# Listar devices no Traccar ou backend
curl -u admin@example.com:admin http://localhost:8082/api/devices | jq '.[0].id'

# OU via MySQL
mysql -u root -p tarkan -e "SELECT id, name FROM tc_devices LIMIT 5;"

# Exemplo resultado: deviceId = 123
```

---

### Passo 2: Testar endpoint com "Hoje"

```bash
# Calcular range "hoje" (00:00:00 até agora)
TODAY_START=$(date -u +"%Y-%m-%dT00:00:00Z")
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Fazer GET (substituir DEVICE_ID)
curl -X GET "http://localhost:8000/api/speed-events?deviceId=123&from=${TODAY_START}&to=${NOW}&page=1&perPage=50" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json" | jq .

# OU no browser devtools:
fetch('/api/speed-events?deviceId=123&from=2025-01-19T00:00:00Z&to=2025-01-19T14:30:00Z&page=1&perPage=50')
  .then(r => r.json())
  .then(console.log)
```

---

### Passo 3: Verificar Response

**Esperado:**

```json
{
  "meta": {
    "total": 5,
    "perPage": 50,
    "currentPage": 1,
    "lastPage": 1
  },
  "data": [
    {
      "id": 1,
      "device_id": 123,
      "driver_id": 7,
      "position_time": "2025-01-19T10:30:00Z",
      "speed_kmh": 105.5,
      "speed_limit_kmh": 80.0,
      "exceed_by_kmh": 25.5,
      "latitude": -23.5505,
      "longitude": -46.6333,
      "address": "Av. Paulista, 1000 - São Paulo, SP"
    }
  ]
}
```

---

### Verificações

✅ **meta.total** retorna número correto (count de eventos hoje)  
✅ **data** é array ordenado por `position_time DESC`  
✅ **speed_kmh, speed_limit_kmh, exceed_by_kmh** já vêm em km/h (sem conversão no frontend)  
✅ **address** pode ser null (não é obrigatório)  
✅ **driver_id** pode ser null (se position sem motorista)

---

## ✅ Se tudo OK:

**Próximo:** Implementar PR-10B (store → componente → badges → i18n → docs)

---

## ❌ Se falhar:

### Erro 404: Rota não existe

```bash
# Verificar routes/api.php
grep "speed-events" back-end/routes/api.php

# Deve ter:
# Route::get('speed-events', [SpeedEventController::class, 'index']);
```

**Solução:** Adicionar rota (ver PR-10A_DEPLOY_AND_TEST.md, Passo 5)

---

### Erro 500: Internal Server Error

```bash
# Verificar logs
tail -f back-end/storage/logs/laravel.log

# Possíveis causas:
# - Tabela speed_events não existe (migration não rodou)
# - Connection 'logs' não configurada no config/database.php
# - Erro no SpeedEventController::index()
```

**Solução:** Rodar migration + verificar .env (LOGS_DB_*)

---

### Erro 401: Unauthorized

```bash
# Endpoint requer autenticação (Bearer token ou session)
# Verificar middleware em routes/api.php
```

**Solução:** Adicionar token ou session válida na requisição

---

### meta.total = 0 (mas existem eventos na tabela)

```bash
# Verificar SQL
mysql -u root -p tarkan_logs

SELECT COUNT(*) FROM speed_events 
WHERE device_id = 123 
  AND position_time >= '2025-01-19 00:00:00'
  AND position_time <= NOW();

# Se retornar > 0 mas API retorna 0:
# - Verificar timezone (UTC vs local)
# - Verificar filtro deviceId no controller
```

---

## 🧪 Teste Completo (7 cenários)

```bash
# 1. Hoje (com eventos)
curl "/api/speed-events?deviceId=123&from=2025-01-19T00:00:00Z&to=2025-01-19T23:59:59Z"

# 2. Hoje (sem eventos)
curl "/api/speed-events?deviceId=999&from=2025-01-19T00:00:00Z&to=2025-01-19T23:59:59Z"
# Esperado: meta.total = 0, data = []

# 3. Últimos 7 dias
curl "/api/speed-events?deviceId=123&from=2025-01-12T00:00:00Z&to=2025-01-19T23:59:59Z"

# 4. Com driverId
curl "/api/speed-events?deviceId=123&driverId=7&from=2025-01-19T00:00:00Z&to=2025-01-19T23:59:59Z"

# 5. Paginação (página 2)
curl "/api/speed-events?deviceId=123&from=2025-01-01T00:00:00Z&to=2025-01-31T23:59:59Z&page=2&perPage=10"

# 6. Range máximo (31 dias)
curl "/api/speed-events?deviceId=123&from=2024-12-19T00:00:00Z&to=2025-01-19T23:59:59Z"

# 7. Range inválido (> 31 dias)
curl "/api/speed-events?deviceId=123&from=2024-11-19T00:00:00Z&to=2025-01-19T23:59:59Z"
# Esperado: 422 Unprocessable Entity {"error": "Date range cannot exceed 31 days"}
```

---

## ✅ Checklist Pre-Check

- [ ] Endpoint GET /api/speed-events existe (rota registrada)
- [ ] Response tem estrutura correta (meta + data)
- [ ] meta.total funciona (count correto)
- [ ] data ordenado por position_time DESC
- [ ] Campos km/h já vêm prontos (sem conversão necessária)
- [ ] address e driver_id podem ser null (handled)
- [ ] Paginação funciona (page 2, perPage 10)
- [ ] Range máximo 31 dias validado (422 se exceder)
- [ ] Autenticação funciona (Bearer token ou session)

---

**Se tudo ✅ acima:** Pode seguir com implementação do PR-10B 🚀

**Se algum ❌:** Resolver backend antes de codar frontend
