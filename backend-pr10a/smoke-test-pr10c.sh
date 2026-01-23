#!/bin/bash

###############################################################################
# PR-10C - SMOKE TEST AUTOMATIZADO
# 
# Script para validar rapidamente se PR-10C está funcionando.
# 
# Uso:
#   chmod +x smoke-test-pr10c.sh
#   ./smoke-test-pr10c.sh
# 
# Autor: PR-10C
###############################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
BACKEND_PATH="/path/to/back-end" # AJUSTAR!
DB_HOST="localhost"
DB_USER="root"
DB_PASS=""
DB_NAME="tarkan_logs"
TEST_DEVICE_ID=123

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         PR-10C - SMOKE TEST AUTOMATIZADO                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$BACKEND_PATH"

###############################################################################
# TESTE 1: Event está registrado?
###############################################################################

echo -e "${YELLOW}[Teste 1] Verificando registro de eventos...${NC}"

EVENT_LIST=$(php artisan event:list 2>/dev/null | grep -i "SpeedEventCreated" || echo "")

if [[ -z "$EVENT_LIST" ]]; then
    echo -e "${RED}✗ FALHOU: SpeedEventCreated não está registrado${NC}"
    echo -e "${RED}  Solução: Registrar EventServiceProvider em config/app.php${NC}"
    exit 1
else
    echo -e "${GREEN}✓ PASSOU: Event SpeedEventCreated registrado${NC}"
    echo -e "  $EVENT_LIST"
fi

echo ""

###############################################################################
# TESTE 2: Worker de notificações está rodando?
###############################################################################

echo -e "${YELLOW}[Teste 2] Verificando worker de notificações...${NC}"

WORKER_COUNT=$(ps aux | grep "queue:work" | grep "notifications" | grep -v grep | wc -l)

if [[ $WORKER_COUNT -eq 0 ]]; then
    echo -e "${RED}✗ FALHOU: Worker de notificações não está rodando${NC}"
    echo -e "${RED}  Solução: php artisan queue:work --queue=notifications --tries=3 --timeout=60${NC}"
    exit 1
else
    echo -e "${GREEN}✓ PASSOU: Worker de notificações ativo ($WORKER_COUNT processo(s))${NC}"
fi

echo ""

###############################################################################
# TESTE 3: Migrations rodaram?
###############################################################################

echo -e "${YELLOW}[Teste 3] Verificando migrations...${NC}"

TABLES=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SHOW TABLES LIKE 'speed_notification%';" | wc -l)

if [[ $TABLES -lt 2 ]]; then
    echo -e "${RED}✗ FALHOU: Tabelas speed_notification_channels/speed_notifications não existem${NC}"
    echo -e "${RED}  Solução: php artisan migrate --database=logs${NC}"
    exit 1
else
    echo -e "${GREEN}✓ PASSOU: Tabelas existem ($TABLES tabelas)${NC}"
fi

echo ""

###############################################################################
# TESTE 4: Cache está configurado?
###############################################################################

echo -e "${YELLOW}[Teste 4] Verificando cache (throttling)...${NC}"

CACHE_DRIVER=$(php artisan tinker --execute="echo config('cache.default');" 2>/dev/null)

if [[ "$CACHE_DRIVER" == "file" ]]; then
    echo -e "${YELLOW}⚠ AVISO: Cache driver = file (multi-instância pode ter spam)${NC}"
    echo -e "${YELLOW}  Recomendação: usar Redis ou Memcached em produção${NC}"
else
    echo -e "${GREEN}✓ PASSOU: Cache driver = $CACHE_DRIVER${NC}"
fi

echo ""

###############################################################################
# TESTE 5: Criar SpeedEvent e verificar notificação
###############################################################################

echo -e "${YELLOW}[Teste 5] Criando SpeedEvent de teste...${NC}"

# Limpar notificações antigas do device de teste
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "DELETE FROM speed_notifications WHERE device_id = $TEST_DEVICE_ID;"

# Criar SpeedEvent
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S")
EVENT_HASH=$(echo -n "smoke-test-$(date +%s)" | sha256sum | cut -d' ' -f1)

mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" <<EOF
INSERT INTO speed_events 
(event_type, device_id, driver_id, position_time, server_time, 
 speed_kmh, speed_limit_kmh, exceed_by_kmh, latitude, longitude, 
 address, event_hash, created_at, updated_at)
VALUES 
('overspeed_limit', $TEST_DEVICE_ID, NULL, '$TIMESTAMP', '$TIMESTAMP', 
 105.5, 80, 25.5, -23.55, -46.63, 
 'Smoke Test Address', '$EVENT_HASH', '$TIMESTAMP', '$TIMESTAMP');
EOF

echo -e "${GREEN}✓ SpeedEvent criado (device_id=$TEST_DEVICE_ID, hash=$EVENT_HASH)${NC}"

# Aguardar event() disparar e job ser enfileirado
sleep 3

# Verificar se notificação foi criada
NOTIF_COUNT=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM speed_notifications WHERE device_id = $TEST_DEVICE_ID;")

if [[ $NOTIF_COUNT -eq 0 ]]; then
    echo -e "${RED}✗ FALHOU: Nenhuma notificação criada${NC}"
    echo -e "${RED}  Diagnóstico:${NC}"
    echo -e "${RED}    1. Event não está sendo disparado (ver INTEGRATION_PR10C.php)${NC}"
    echo -e "${RED}    2. Listener não está registrado (ver EventServiceProvider)${NC}"
    echo -e "${RED}    3. Job falhou (ver: php artisan queue:failed)${NC}"
    exit 1
else
    echo -e "${GREEN}✓ PASSOU: Notificação criada ($NOTIF_COUNT notificação(ões))${NC}"
    
    # Mostrar status
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -t -e "
    SELECT id, device_id, channel, status, created_at 
    FROM speed_notifications 
    WHERE device_id = $TEST_DEVICE_ID 
    ORDER BY id DESC 
    LIMIT 3;"
fi

echo ""

###############################################################################
# TESTE 6: Verificar jobs falhados
###############################################################################

echo -e "${YELLOW}[Teste 6] Verificando jobs falhados...${NC}"

FAILED_JOBS=$(php artisan queue:failed 2>/dev/null | grep "SendSpeedNotificationJob" | wc -l)

if [[ $FAILED_JOBS -gt 0 ]]; then
    echo -e "${RED}✗ AVISO: $FAILED_JOBS job(s) SendSpeedNotificationJob falhados${NC}"
    echo -e "${RED}  Verificar: php artisan queue:failed${NC}"
else
    echo -e "${GREEN}✓ PASSOU: Nenhum job falhado recente${NC}"
fi

echo ""

###############################################################################
# RESUMO FINAL
###############################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    RESUMO DOS TESTES                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Event registrado${NC}"
echo -e "${GREEN}✓ Worker rodando${NC}"
echo -e "${GREEN}✓ Migrations aplicadas${NC}"
echo -e "${GREEN}✓ Cache configurado${NC}"
echo -e "${GREEN}✓ Notificação criada automaticamente${NC}"

if [[ $FAILED_JOBS -gt 0 ]]; then
    echo -e "${YELLOW}⚠ Jobs falhados: $FAILED_JOBS${NC}"
else
    echo -e "${GREEN}✓ Nenhum job falhado${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  PR-10C ESTÁ OPERACIONAL! ✓                                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"

exit 0
