<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Models\SpeedEvent;
use App\Tarkan\Services\SpeedLimitEventDetector;
use App\Tarkan\Services\SpeedNotificationDispatcher;
use App\Tarkan\traccarConnector;

/**
 * PR-10A.1: Job para processar speed events via polling de positions
 * 
 * Este job roda a cada 1 minuto, busca positions novas desde o último cursor,
 * e processa violações de velocidade de forma idempotente.
 * 
 * Arquitetura:
 * - Cursor: Cache key 'speed:last_position_id' (persiste último ID processado)
 * - Lock: Cache key 'speed:polling:lock' (TTL 300s, previne overlapping)
 * - Batch: 500 positions por execução (configurável)
 * - Idempotência: event_hash unique (reusa lógica do PR-10A)
 * - Cache de devices: In-memory per-run (evita N+1)
 * 
 * @author PR-10A.1
 * @see ProcessSpeedEventsJob::handle()
 */
class ProcessSpeedEventsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Tamanho do batch de positions (configurável)
     */
    const BATCH_SIZE = 500;

    /**
     * Cache key para armazenar último position_id processado
     */
    const CURSOR_KEY = 'speed:last_position_id';

    /**
     * Cache key para lock de execução (previne overlapping)
     */
    const LOCK_KEY = 'speed:polling:lock';

    /**
     * TTL do lock em segundos (5 minutos)
     */
    const LOCK_TTL = 300;

    /**
     * Cache in-memory para devices (evita N+1 por execução)
     * 
     * @var array
     */
    private $deviceCache = [];

    /**
     * Detector de violações de velocidade (reusa PR-10A)
     * 
     * @var SpeedLimitEventDetector
     */
    private $detector;

    /**
     * Dispatcher de notificações (stub PR-10A)
     * 
     * @var SpeedNotificationDispatcher
     */
    private $dispatcher;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->detector = new SpeedLimitEventDetector();
        $this->dispatcher = new SpeedNotificationDispatcher();
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $startTime = microtime(true);

        // Tentar adquirir lock (previne execução simultânea)
        $lockAcquired = Cache::add(self::LOCK_KEY, true, self::LOCK_TTL);

        if (!$lockAcquired) {
            Log::warning('[PR-10A.1] Job já está rodando (lock ativo), pulando execução');
            return;
        }

        try {
            // Obter cursor (último position_id processado)
            $lastPositionId = Cache::get(self::CURSOR_KEY, 0);

            Log::info('[PR-10A.1] Iniciando polling', [
                'last_position_id' => $lastPositionId,
                'batch_size' => self::BATCH_SIZE,
            ]);

            // Buscar positions novas desde cursor
            $positions = $this->fetchNewPositions($lastPositionId);

            if (empty($positions)) {
                Log::info('[PR-10A.1] Nenhuma position nova encontrada');
                return;
            }

            // Processar cada position
            $processedCount = 0;
            $eventsCreatedCount = 0;
            $errorsCount = 0;
            $newCursor = $lastPositionId;

            foreach ($positions as $position) {
                try {
                    $eventCreated = $this->processPosition($position);

                    if ($eventCreated) {
                        $eventsCreatedCount++;
                    }

                    $processedCount++;

                    // Atualizar cursor com o maior ID processado
                    if (isset($position['id']) && $position['id'] > $newCursor) {
                        $newCursor = $position['id'];
                    }

                } catch (\Exception $e) {
                    $errorsCount++;

                    Log::error('[PR-10A.1] Erro ao processar position', [
                        'position_id' => $position['id'] ?? 'unknown',
                        'device_id' => $position['deviceId'] ?? 'unknown',
                        'error' => $e->getMessage(),
                    ]);

                    // Continuar processando outras positions (não parar por 1 erro)
                    continue;
                }
            }

            // Atualizar cursor apenas se processou com sucesso
            if ($newCursor > $lastPositionId) {
                Cache::forever(self::CURSOR_KEY, $newCursor);
            }

            // Métricas
            $durationMs = round((microtime(true) - $startTime) * 1000);

            Log::info('[PR-10A.1] Polling completado', [
                'positions_fetched' => count($positions),
                'positions_processed' => $processedCount,
                'events_created' => $eventsCreatedCount,
                'errors' => $errorsCount,
                'new_cursor' => $newCursor,
                'duration_ms' => $durationMs,
            ]);

        } catch (\Exception $e) {
            Log::error('[PR-10A.1] Erro crítico no job', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        } finally {
            // Liberar lock
            Cache::forget(self::LOCK_KEY);
        }
    }

    /**
     * Buscar positions novas desde último ID processado
     * 
     * @param int $lastPositionId Último position_id processado
     * @return array Array de positions
     */
    private function fetchNewPositions(int $lastPositionId): array
    {
        try {
            // Criar connector (reutiliza config do env)
            $request = request(); // Request vazio, usa env vars
            $traccar = new traccarConnector($request);

            // Buscar positions desde lastPositionId
            // Usar método customizado (adicionado ao traccarConnector)
            $positions = $traccar->getPositionsSince($lastPositionId, self::BATCH_SIZE);

            return $positions ?? [];

        } catch (\Exception $e) {
            Log::error('[PR-10A.1] Failed to fetch positions from Traccar', [
                'last_position_id' => $lastPositionId,
                'error' => $e->getMessage(),
            ]);

            // Não avançar cursor se Traccar falhar
            return [];
        }
    }

    /**
     * Processar uma position (detectar violação e criar evento)
     * 
     * @param array $position Position do Traccar
     * @return bool True se evento criado, False caso contrário
     */
    private function processPosition(array $position): bool
    {
        // Validar campos obrigatórios
        $hasRequiredFields = 
            isset($position['deviceId']) &&
            isset($position['fixTime']) &&
            isset($position['latitude']) &&
            isset($position['longitude']) &&
            isset($position['speed']);

        if (!$hasRequiredFields) {
            return false;
        }

        // Buscar device (com cache in-memory)
        $device = $this->getDevice($position['deviceId']);

        if (!$device || !isset($device['speedLimitKmh'])) {
            return false; // Sem speedLimitKmh configurado (opt-in)
        }

        // Converter speed para km/h (Traccar retorna em knots por padrão)
        $speedKmh = $position['speed'] * 1.852; // knots para km/h
        $speedLimitKmh = $device['speedLimitKmh'];

        // Detector reusa lógica do PR-10A
        $violation = $this->detector->detect($speedKmh, $speedLimitKmh);

        if (!$violation) {
            return false; // Sem violação
        }

        // Preparar dados do evento
        $data = [
            'event_type' => 'speedLimitExceeded',
            'device_id' => $position['deviceId'],
            'driver_id' => $position['driverId'] ?? null,
            'position_time' => $position['fixTime'],
            'server_time' => now(),
            'speed_kmh' => round($speedKmh, 2),
            'speed_limit_kmh' => $speedLimitKmh,
            'exceed_by_kmh' => round($speedKmh - $speedLimitKmh, 2),
            'latitude' => $position['latitude'],
            'longitude' => $position['longitude'],
            'address' => $position['address'] ?? null,
            'payload' => $position, // Guardar position completa
            'event_hash' => $this->makeSpeedEventHash([
                'event_type' => 'speedLimitExceeded',
                'device_id' => $position['deviceId'],
                'position_time' => $position['fixTime'],
                'speed_kmh' => round($speedKmh, 2),
                'speed_limit_kmh' => $speedLimitKmh,
                'latitude' => $position['latitude'],
                'longitude' => $position['longitude'],
            ]),
        ];

        try {
            // Criar evento (idempotente via event_hash unique)
            $event = SpeedEvent::create($data);

            // Dispatcher (stub PR-10A)
            $this->dispatcher->dispatch($event);

            return true;

        } catch (\Illuminate\Database\QueryException $e) {
            // Silenciar duplicate key (idempotência funcionando)
            if (stripos($e->getMessage(), 'uniq_event_hash') !== false ||
                stripos($e->getMessage(), 'Duplicate entry') !== false) {
                return false; // Evento já existe
            }

            throw $e; // Re-throw outros erros
        }
    }

    /**
     * Buscar device do Traccar (com cache in-memory)
     * 
     * @param int $deviceId ID do device
     * @return array|null Device data ou null
     */
    private function getDevice(int $deviceId): ?array
    {
        // Verificar cache in-memory
        if (isset($this->deviceCache[$deviceId])) {
            return $this->deviceCache[$deviceId];
        }

        try {
            // Buscar device do Traccar
            $request = request();
            $traccar = new traccarConnector($request);
            $device = $traccar->getDevice($deviceId);

            // Cachear in-memory (válido apenas para esta execução)
            $this->deviceCache[$deviceId] = $device;

            return $device;

        } catch (\Exception $e) {
            Log::error('[PR-10A.1] Failed to fetch device', [
                'device_id' => $deviceId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Gerar hash único para evento (idempotência)
     * 
     * Reusa lógica do EventController@makeSpeedEventHash (PR-10A)
     * 
     * @param array $data Dados do evento
     * @return string Hash SHA-256
     */
    private function makeSpeedEventHash(array $data): string
    {
        $key = implode('|', [
            $data['event_type'] ?? '',
            $data['device_id'] ?? '',
            $data['position_time'] ?? '',
            $data['speed_kmh'] ?? '',
            $data['speed_limit_kmh'] ?? '',
            round($data['latitude'] ?? 0, 6), // 6 decimais (±10cm precisão)
            round($data['longitude'] ?? 0, 6),
        ]);

        return hash('sha256', $key);
    }
}
