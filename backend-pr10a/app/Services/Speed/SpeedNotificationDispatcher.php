<?php

namespace App\Services\Speed;

use App\Models\SpeedEvent;
use Illuminate\Support\Facades\Log;

/**
 * PR-10A: Dispatcher de notificações de excesso de velocidade
 * 
 * STUB para futuras integrações:
 * - PR-10B: Webhook configurável
 * - PR-10C: WhatsApp via Twilio
 * - PR-10C: Push notifications (PWA)
 */
class SpeedNotificationDispatcher
{
    /**
     * Despacha notificações para evento de velocidade
     * 
     * @param SpeedEvent $event
     * @return void
     */
    public function dispatch(SpeedEvent $event): void
    {
        try {
            // PR-10A: apenas log (preparação para PR-10B/C)
            $this->logEvent($event);
            
            // Futuro PR-10B: webhook
            // if ($webhookUrl = $this->getWebhookUrl($event->device_id)) {
            //     $this->sendWebhook($webhookUrl, $event);
            // }
            
            // Futuro PR-10C: WhatsApp
            // if ($phoneNumber = $this->getPhoneNumber($event->device_id)) {
            //     $this->sendWhatsApp($phoneNumber, $event);
            // }
            
            // Futuro PR-10C: Push
            // if ($userId = $this->getUserForDevice($event->device_id)) {
            //     $this->sendPushNotification($userId, $event);
            // }
            
        } catch (\Exception $e) {
            // Não quebrar fluxo se notificação falhar
            Log::error('[SpeedNotificationDispatcher] Erro ao despachar notificação', [
                'event_id' => $event->id,
                'device_id' => $event->device_id,
                'error' => $e->getMessage(),
            ]);
        }
    }
    
    /**
     * Log do evento em canal dedicado (fallback se canal não existir)
     */
    private function logEvent(SpeedEvent $event): void
    {
        try {
            // Tentar canal dedicado speed_events
            Log::channel('speed_events')->info('Overspeed detected', [
                'event_id' => $event->id,
                'device_id' => $event->device_id,
                'driver_id' => $event->driver_id,
                'speed' => $event->speed_kmh,
                'limit' => $event->speed_limit_kmh,
                'exceed_by' => $event->exceed_by_kmh,
                'timestamp' => $event->position_time->toIso8601String(),
                'location' => [
                    'lat' => $event->latitude,
                    'lon' => $event->longitude,
                    'address' => $event->address,
                ],
            ]);
        } catch (\Exception $e) {
            // Fallback: canal default se speed_events não existir
            Log::info('[SpeedEvent] Overspeed detected', [
                'event_id' => $event->id,
                'device_id' => $event->device_id,
                'speed' => $event->speed_kmh,
                'limit' => $event->speed_limit_kmh,
                'exceed_by' => $event->exceed_by_kmh,
            ]);
        }
    }
}
