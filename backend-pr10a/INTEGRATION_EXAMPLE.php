<?php

/**
 * PR-10A: EXEMPLO DE INTEGRAÇÃO
 * 
 * Este arquivo mostra ONDE e COMO integrar o detector de eventos.
 * Você precisa identificar o ponto correto no seu backend onde:
 * - Positions do Traccar são recebidas/atualizadas
 * - Device já está carregado com attributes
 * - Position é um array válido
 * 
 * OPÇÕES COMUNS:
 * 1. WebhookController (se Traccar envia webhook)
 * 2. ProcessPositionsJob (se polling do Traccar)
 * 3. TraccarSyncService (se service layer de sync)
 * 
 * ONDE ADICIONAR ESTE CÓDIGO:
 * - Procure por "fixTime", "serverTime", "updatePosition", "processPosition"
 * - Adicione APÓS device estar carregado e position validada
 * - Adicione ANTES de salvar position (se aplicável)
 * 
 * EXEMPLO GENÉRICO (adaptar ao seu código):
 */

namespace App\Http\Controllers; // ou App\Jobs, App\Services

use App\Services\Speed\SpeedLimitEventDetector;
use App\Services\Speed\SpeedNotificationDispatcher;
use App\Models\SpeedEvent;
use Illuminate\Support\Facades\Log;

class ExamplePositionProcessor
{
    /**
     * Método onde position é processada
     * 
     * @param array $position - Position do Traccar (array com fixTime, speed, latitude, etc)
     * @param object $device - Device model com attributes carregados
     */
    public function processPosition(array $position, $device)
    {
        // ... seu código existente (validações, etc) ...
        
        
        // ======================================================================
        // PR-10A: DETECTAR EXCESSO DE VELOCIDADE
        // ======================================================================
        try {
            $detector = new SpeedLimitEventDetector();
            $eventData = $detector->checkSpeedLimit($position, $device);
            
            if ($eventData) {
                // Criar evento no banco de logs
                $event = SpeedEvent::create($eventData);
                
                // Despachar notificação (PR-10A: apenas log)
                $dispatcher = new SpeedNotificationDispatcher();
                $dispatcher->dispatch($event);
                
                // Log adicional para debug (opcional)
                Log::info('[PR-10A] Overspeed event created', [
                    'event_id' => $event->id,
                    'device_id' => $device->id,
                    'speed' => $event->speed_kmh,
                    'limit' => $event->speed_limit_kmh,
                ]);
            }
            
        } catch (\Exception $e) {
            // CRÍTICO: não quebrar fluxo principal se detector falhar
            Log::error('[PR-10A] SpeedEvent detection failed', [
                'device_id' => $device->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Continuar processamento normal (não throw exception)
        }
        // ======================================================================
        
        
        // ... resto do seu código existente ...
    }
}


/**
 * EXEMPLO ALTERNATIVO: Se position vem como objeto (não array)
 */
class ExamplePositionProcessorObjectBased
{
    public function processPosition($position, $device)
    {
        // Converter position object para array
        $positionArray = [
            'fixTime' => $position->fixTime,
            'serverTime' => $position->serverTime ?? null,
            'speed' => $position->speed,
            'latitude' => $position->latitude,
            'longitude' => $position->longitude,
            'address' => $position->address ?? null,
            'protocol' => $position->protocol ?? null,
            'attributes' => (array) ($position->attributes ?? []),
        ];
        
        // Usar detector
        try {
            $detector = new SpeedLimitEventDetector();
            $eventData = $detector->checkSpeedLimit($positionArray, $device);
            
            if ($eventData) {
                $event = SpeedEvent::create($eventData);
                (new SpeedNotificationDispatcher())->dispatch($event);
            }
        } catch (\Exception $e) {
            Log::error('[PR-10A] Detection failed', [
                'device_id' => $device->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}


/**
 * EXEMPLO ALTERNATIVO: Se processa múltiplas positions em batch
 */
class ExampleBatchProcessor
{
    public function processPositions(array $positions, $device)
    {
        $detector = new SpeedLimitEventDetector();
        $dispatcher = new SpeedNotificationDispatcher();
        
        foreach ($positions as $position) {
            try {
                $eventData = $detector->checkSpeedLimit($position, $device);
                
                if ($eventData) {
                    $event = SpeedEvent::create($eventData);
                    $dispatcher->dispatch($event);
                }
            } catch (\Exception $e) {
                // Log mas não quebra o loop
                Log::error('[PR-10A] Detection failed in batch', [
                    'device_id' => $device->id,
                    'position_time' => $position['fixTime'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}


/**
 * DICA: Como encontrar o ponto de integração
 * 
 * 1. Procurar no backend Laravel:
 *    grep -r "fixTime" app/
 *    grep -r "serverTime" app/
 *    grep -r "position" app/Http/Controllers/
 *    grep -r "position" app/Jobs/
 *    grep -r "position" app/Services/
 * 
 * 2. Procurar por métodos que recebem position:
 *    - updatePosition()
 *    - processPosition()
 *    - handleWebhook()
 *    - syncPositions()
 * 
 * 3. Verificar se já existe TraccarConnector/TraccarService:
 *    - Pode ter método que busca positions do Traccar
 *    - Adicione detector DEPOIS de buscar, ANTES de processar
 * 
 * 4. Se tiver webhook do Traccar:
 *    - Route::post('/traccar/webhook', ...)
 *    - Adicione detector no controller do webhook
 */
