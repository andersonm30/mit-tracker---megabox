<?php

namespace App\Jobs;

use App\Models\SpeedEvent;
use App\Models\SpeedNotificationChannel;
use App\Models\SpeedNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * PR-10C: Job para enviar notificações de SpeedEvent
 * 
 * Features:
 * - Throttling por canal/device (padrão: 5 min)
 * - Idempotência via notification_hash unique
 * - Canal webhook implementado (POST HTTP, timeout 3s, 2 retries)
 * - Auditoria em speed_notifications (queued → sent/failed/skipped)
 * 
 * Queue: 'notifications' (recomendado separar da default)
 * Timeout: 30s
 * Retries: 3 (backoff exponencial)
 * 
 * @author PR-10C
 */
class SendSpeedNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * SpeedEvent ID
     * 
     * @var int
     */
    protected $speedEventId;

    /**
     * Timeout em segundos
     * 
     * @var int
     */
    public $timeout = 30;

    /**
     * Retries
     * 
     * @var int
     */
    public $tries = 3;

    /**
     * Backoff em segundos (exponencial)
     * 
     * @var array
     */
    public $backoff = [5, 15, 30];

    /**
     * Create a new job instance.
     *
     * @param int $speedEventId
     * @return void
     */
    public function __construct(int $speedEventId)
    {
        $this->speedEventId = $speedEventId;
        $this->onQueue('notifications'); // Fila separada
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        // Carregar SpeedEvent
        $speedEvent = SpeedEvent::find($this->speedEventId);

        if (!$speedEvent) {
            Log::warning('[PR-10C] SpeedEvent não encontrado', [
                'speed_event_id' => $this->speedEventId,
            ]);
            return;
        }

        // Buscar canais habilitados para este device
        $channels = SpeedNotificationChannel::forDevice($speedEvent->device_id)
            ->enabled()
            ->get();

        if ($channels->isEmpty()) {
            Log::debug('[PR-10C] Nenhum canal habilitado para device', [
                'device_id' => $speedEvent->device_id,
            ]);
            return;
        }

        // Processar cada canal
        foreach ($channels as $channel) {
            $this->processChannel($speedEvent, $channel);
        }
    }

    /**
     * Processar um canal específico
     * 
     * @param SpeedEvent $speedEvent
     * @param SpeedNotificationChannel $channel
     * @return void
     */
    protected function processChannel(SpeedEvent $speedEvent, SpeedNotificationChannel $channel): void
    {
        // Aplicar throttling
        if ($this->isThrottled($speedEvent, $channel)) {
            $this->createNotification($speedEvent, $channel, 'skipped', null, 'Throttled');
            Log::debug('[PR-10C] Notificação throttled', [
                'device_id' => $speedEvent->device_id,
                'channel' => $channel->channel,
                'throttle_seconds' => $channel->throttle_seconds,
            ]);
            return;
        }

        // Verificar idempotência (notification_hash)
        $notificationHash = $this->makeNotificationHash($speedEvent, $channel);
        if (SpeedNotification::where('notification_hash', $notificationHash)->exists()) {
            Log::debug('[PR-10C] Notificação já existe (idempotência)', [
                'notification_hash' => $notificationHash,
            ]);
            return; // Já enviado
        }

        // Criar registro "queued"
        $notification = $this->createNotification($speedEvent, $channel, 'queued', $notificationHash);

        // Enviar notificação
        try {
            $this->sendNotification($speedEvent, $channel, $notification);
        } catch (\Exception $e) {
            Log::error('[PR-10C] Erro ao enviar notificação', [
                'notification_id' => $notification->id,
                'channel' => $channel->channel,
                'error' => $e->getMessage(),
            ]);

            // Atualizar status para "failed"
            $notification->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Enviar notificação de acordo com o canal
     * 
     * @param SpeedEvent $speedEvent
     * @param SpeedNotificationChannel $channel
     * @param SpeedNotification $notification
     * @return void
     * @throws \Exception
     */
    protected function sendNotification(
        SpeedEvent $speedEvent,
        SpeedNotificationChannel $channel,
        SpeedNotification $notification
    ): void {
        switch ($channel->channel) {
            case 'webhook':
                $this->sendWebhook($speedEvent, $channel, $notification);
                break;

            case 'email':
                $this->sendEmail($speedEvent, $channel, $notification);
                break;

            case 'whatsapp':
                // TODO PR-10C.1: implementar
                throw new \Exception('WhatsApp channel not implemented yet');

            case 'push':
                // TODO PR-10C.1: implementar
                throw new \Exception('Push channel not implemented yet');

            default:
                throw new \Exception("Unknown channel: {$channel->channel}");
        }
    }

    /**
     * Enviar webhook (POST HTTP)
     * 
     * @param SpeedEvent $speedEvent
     * @param SpeedNotificationChannel $channel
     * @param SpeedNotification $notification
     * @return void
     * @throws \Exception
     */
    protected function sendWebhook(
        SpeedEvent $speedEvent,
        SpeedNotificationChannel $channel,
        SpeedNotification $notification
    ): void {
        // Montar payload
        $payload = [
            'type' => $speedEvent->event_type,
            'deviceId' => $speedEvent->device_id,
            'driverId' => $speedEvent->driver_id,
            'timestamp' => $speedEvent->position_time->toIso8601String(),
            'speedKmh' => (float) $speedEvent->speed_kmh,
            'speedLimitKmh' => (float) $speedEvent->speed_limit_kmh,
            'exceedByKmh' => (float) $speedEvent->exceed_by_kmh,
            'latitude' => (float) $speedEvent->latitude,
            'longitude' => (float) $speedEvent->longitude,
            'address' => $speedEvent->address,
        ];

        // Atualizar payload no notification
        $notification->update(['payload' => $payload]);

        // Fazer request HTTP POST
        $response = Http::timeout(3) // 3 segundos
            ->retry(2, 100) // 2 retries, 100ms entre tentativas
            ->post($channel->target, $payload);

        // Verificar resposta
        if ($response->successful()) {
            $notification->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);

            Log::info('[PR-10C] Webhook enviado com sucesso', [
                'notification_id' => $notification->id,
                'target' => $channel->target,
                'status_code' => $response->status(),
            ]);
        } else {
            throw new \Exception("Webhook failed: HTTP {$response->status()} - {$response->body()}");
        }
    }

    /**
     * Enviar email (Laravel Mail)
     * 
     * @param SpeedEvent $speedEvent
     * @param SpeedNotificationChannel $channel
     * @param SpeedNotification $notification
     * @return void
     * @throws \Exception
     */
    protected function sendEmail(
        SpeedEvent $speedEvent,
        SpeedNotificationChannel $channel,
        SpeedNotification $notification
    ): void {
        // Payload
        $payload = [
            'type' => $speedEvent->event_type,
            'deviceId' => $speedEvent->device_id,
            'driverId' => $speedEvent->driver_id,
            'timestamp' => $speedEvent->position_time->format('d/m/Y H:i:s'),
            'speedKmh' => (float) $speedEvent->speed_kmh,
            'speedLimitKmh' => (float) $speedEvent->speed_limit_kmh,
            'exceedByKmh' => (float) $speedEvent->exceed_by_kmh,
            'address' => $speedEvent->address ?? 'Endereço não disponível',
        ];

        $notification->update(['payload' => $payload]);

        // Template simples (texto)
        $subject = "⚠️ Alerta de Velocidade - Device #{$speedEvent->device_id}";
        $body = "
Alerta de Excesso de Velocidade

Device: #{$speedEvent->device_id}
Motorista: #{$speedEvent->driver_id}
Data/Hora: {$payload['timestamp']}

Velocidade: {$payload['speedKmh']} km/h
Limite: {$payload['speedLimitKmh']} km/h
Excedeu: {$payload['exceedByKmh']} km/h

Endereço: {$payload['address']}
        ";

        try {
            \Mail::raw($body, function ($message) use ($channel, $subject) {
                $message->to($channel->target)
                    ->subject($subject);
            });

            $notification->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);

            Log::info('[PR-10C] Email enviado com sucesso', [
                'notification_id' => $notification->id,
                'target' => $channel->target,
            ]);

        } catch (\Exception $e) {
            throw new \Exception("Email failed: {$e->getMessage()}");
        }
    }

    /**
     * Verificar se canal está throttled
     * 
     * @param SpeedEvent $speedEvent
     * @param SpeedNotificationChannel $channel
     * @return bool
     */
    protected function isThrottled(SpeedEvent $speedEvent, SpeedNotificationChannel $channel): bool
    {
        // Chave do cache: device + canal
        $cacheKey = "speed_notification_throttle:{$speedEvent->device_id}:{$channel->channel}";

        // Verificar se existe no cache
        if (Cache::has($cacheKey)) {
            return true; // Throttled
        }

        // Marcar como throttled por N segundos
        Cache::put($cacheKey, true, $channel->throttle_seconds);

        return false; // Não throttled, pode enviar
    }

    /**
     * Criar notification_hash para idempotência
     * 
     * SHA-256: speed_event_id|device_id|channel|target|floor(sent_window)
     * sent_window: arredonda timestamp por throttle_seconds (ex: 5 min)
     * 
     * @param SpeedEvent $speedEvent
     * @param SpeedNotificationChannel $channel
     * @return string
     */
    protected function makeNotificationHash(SpeedEvent $speedEvent, SpeedNotificationChannel $channel): string
    {
        // Calcular sent_window (arredondar timestamp por throttle_seconds)
        $now = now()->timestamp;
        $window = floor($now / $channel->throttle_seconds);

        // Concatenar chave
        $key = implode('|', [
            $speedEvent->id,
            $speedEvent->device_id,
            $channel->channel,
            $channel->target,
            $window,
        ]);

        return hash('sha256', $key);
    }

    /**
     * Criar registro de notificação
     * 
     * @param SpeedEvent $speedEvent
     * @param SpeedNotificationChannel $channel
     * @param string $status (queued, sent, failed, skipped)
     * @param string|null $notificationHash
     * @param string|null $errorMessage
     * @return SpeedNotification
     */
    protected function createNotification(
        SpeedEvent $speedEvent,
        SpeedNotificationChannel $channel,
        string $status,
        ?string $notificationHash = null,
        ?string $errorMessage = null
    ): SpeedNotification {
        // Gerar hash se não fornecido
        if (!$notificationHash) {
            $notificationHash = $this->makeNotificationHash($speedEvent, $channel);
        }

        // Tentar criar (idempotência via unique hash)
        try {
            return SpeedNotification::create([
                'speed_event_id' => $speedEvent->id,
                'device_id' => $speedEvent->device_id,
                'channel' => $channel->channel,
                'target' => $channel->target,
                'status' => $status,
                'error_message' => $errorMessage,
                'notification_hash' => $notificationHash,
                'sent_at' => ($status === 'sent') ? now() : null,
            ]);

        } catch (\Illuminate\Database\QueryException $e) {
            // Silenciar duplicate key (idempotência funcionando)
            if (stripos($e->getMessage(), 'uniq_notification_hash') !== false ||
                stripos($e->getMessage(), 'Duplicate entry') !== false) {
                // Retornar existing
                return SpeedNotification::where('notification_hash', $notificationHash)->first();
            }

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     *
     * @param \Throwable $exception
     * @return void
     */
    public function failed(\Throwable $exception)
    {
        Log::error('[PR-10C] Job falhou após todas as tentativas', [
            'speed_event_id' => $this->speedEventId,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}
