<?php

namespace App\Listeners;

use App\Events\SpeedEventCreated;
use App\Jobs\SendSpeedNotificationJob;
use Illuminate\Support\Facades\Log;

/**
 * PR-10C: Listener para SpeedEventCreated
 * 
 * Dispara SendSpeedNotificationJob quando um SpeedEvent é criado.
 * 
 * CRÍTICO: NÃO pode quebrar o webhook do Traccar.
 * Qualquer erro deve ser silenciado/logado.
 * 
 * @author PR-10C
 */
class SpeedEventCreatedListener
{
    /**
     * Create the event listener.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     *
     * @param SpeedEventCreated $event
     * @return void
     */
    public function handle(SpeedEventCreated $event)
    {
        try {
            // Disparar job de notificação (assíncrono)
            SendSpeedNotificationJob::dispatch($event->speedEvent->id);

            Log::debug('[PR-10C] SendSpeedNotificationJob dispatched', [
                'speed_event_id' => $event->speedEvent->id,
                'device_id' => $event->speedEvent->device_id,
            ]);

        } catch (\Exception $e) {
            // CRÍTICO: NÃO propagar exceção (não pode quebrar webhook)
            Log::error('[PR-10C] Erro ao disparar SendSpeedNotificationJob', [
                'speed_event_id' => $event->speedEvent->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Não re-throw: silenciar erro para não quebrar ProcessSpeedEventsJob
        }
    }

    /**
     * Handle a job failure (se registrado como ShouldQueue).
     *
     * @param SpeedEventCreated $event
     * @param \Throwable $exception
     * @return void
     */
    public function failed(SpeedEventCreated $event, \Throwable $exception)
    {
        Log::error('[PR-10C] Listener falhou', [
            'speed_event_id' => $event->speedEvent->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
