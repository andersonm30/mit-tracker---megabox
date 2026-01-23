<?php

namespace App\Services\Speed;

use App\Support\SpeedNormalizer;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * PR-10A: Detector de eventos de excesso de velocidade
 * 
 * GUARDRAILS:
 * - Debounce 10s: só notifica após excesso contínuo
 * - Rate-limit 5 min: máximo 1 evento por device (atômico via Cache::add)
 * - Clear on recovery: reseta quando volta ao limite
 * - Opt-in: só devices com speedLimitKmh > 0
 * - Out-of-order protection: elapsedSeconds = max(0, now - start)
 */
class SpeedLimitEventDetector
{
    private const DEBOUNCE_SECONDS = 10;  // Aguardar 10s consecutivos acima
    private const RATE_LIMIT_MINUTES = 5; // Máximo 1 evento a cada 5 min
    
    /**
     * Verifica se position excede speedLimit e deve gerar evento
     * 
     * @param array $position - Position data do Traccar (array)
     * @param object $device - Device object com attributes
     * @return array|null - Event data array (NÃO JSON) ou null se não gerar
     */
    public function checkSpeedLimit(array $position, $device): ?array
    {
        try {
            // 1. Pegar limite configurado (prioritize speedLimitKmh do PR-09B/C)
            $attributes = is_object($device->attributes) 
                ? (array) $device->attributes 
                : $device->attributes ?? [];
            
            $speedLimitKmh = $attributes['speedLimitKmh'] 
                          ?? $attributes['speedLimit'] 
                          ?? null;
            
            // Sem limite ou limite <= 0 → opt-out (não gera evento)
            if (!$speedLimitKmh || $speedLimitKmh <= 0) {
                $this->clearDebounce($device->id);
                return null;
            }
            
            // 2. Normalizar velocidade atual para km/h (usar PR-09A)
            $speedRaw = $position['speed'] ?? 0;
            $currentSpeedKmh = SpeedNormalizer::toKmh($speedRaw);
            
            // 3. Não está excedendo → limpar estado e sair
            if ($currentSpeedKmh <= $speedLimitKmh) {
                $this->clearDebounce($device->id);
                return null;
            }
            
            // 4. Está excedendo → verificar debounce
            $exceededStart = $this->getDebounceStart($device->id);
            
            if (!$exceededStart) {
                // Primeira detecção → iniciar debounce
                $this->setDebounceStart($device->id, $position['fixTime']);
                return null; // Aguardar 10s
            }
            
            // 5. Calcular tempo decorrido acima do limite
            // CORREÇÃO: proteger contra out-of-order positions
            $nowTs = strtotime($position['fixTime']);
            $elapsedSeconds = max(0, $nowTs - $exceededStart);
            
            if ($elapsedSeconds < self::DEBOUNCE_SECONDS) {
                // Ainda em debounce (< 10s)
                return null;
            }
            
            // 6. Passou debounce → verificar rate limit (não spammar)
            // CORREÇÃO: usar Cache::add() para atomicidade (evita race condition)
            $rateLimitKey = $this->rateLimitKey($device->id);
            $ttlSeconds = self::RATE_LIMIT_MINUTES * 60;
            
            if (!Cache::add($rateLimitKey, true, $ttlSeconds)) {
                // Cache::add() retornou false = chave já existe = rate limited
                return null;
            }
            
            // 7. Criar evento (payload como ARRAY, não JSON)
            // CORREÇÃO: Eloquent gerencia cast payload => array
            return [
                'event_type' => 'overspeed_limit',
                'device_id' => $device->id,
                'driver_id' => $this->extractDriverId($device, $position),
                'position_time' => $position['fixTime'],
                'server_time' => $position['serverTime'] ?? null,
                'speed_kmh' => round($currentSpeedKmh, 1),
                'speed_limit_kmh' => round($speedLimitKmh, 1),
                'exceed_by_kmh' => round($currentSpeedKmh - $speedLimitKmh, 1),
                'latitude' => $position['latitude'] ?? 0,
                'longitude' => $position['longitude'] ?? 0,
                'address' => $position['address'] ?? null,
                
                // CORREÇÃO: payload como array (cast automático)
                'payload' => [
                    'deviceName' => $device->name ?? null,
                    'protocol' => $position['protocol'] ?? null,
                    'attributes' => $position['attributes'] ?? [],
                    'raw' => [
                        'speed_raw' => $speedRaw,
                        'speed_unit' => 'kn', // Traccar default
                    ],
                ],
            ];
            
        } catch (\Exception $e) {
            // Não quebrar fluxo principal se detector falhar
            Log::error('[SpeedLimitEventDetector] Erro ao detectar evento', [
                'device_id' => $device->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return null;
        }
    }
    
    /**
     * Extrair driver_id da position ou device
     */
    private function extractDriverId($device, array $position): ?int
    {
        // Tentar position attributes primeiro (mais recente)
        $posAttrs = $position['attributes'] ?? [];
        
        $driverId = $posAttrs['driverId'] 
                 ?? $posAttrs['driver_id'] 
                 ?? null;
        
        if ($driverId) {
            return (int) $driverId;
        }
        
        // Fallback: device attributes
        $devAttrs = is_object($device->attributes) 
            ? (array) $device->attributes 
            : $device->attributes ?? [];
        
        $driverId = $devAttrs['driverId'] 
                 ?? $devAttrs['driver_id'] 
                 ?? $device->driverId 
                 ?? $device->driver_id 
                 ?? null;
        
        return $driverId ? (int) $driverId : null;
    }
    
    /**
     * Cache keys para debounce/rate-limit
     */
    private function debounceKey(int $deviceId): string
    {
        return "speed:debounce:{$deviceId}";
    }
    
    private function rateLimitKey(int $deviceId): string
    {
        return "speed:ratelimit:{$deviceId}";
    }
    
    /**
     * Debounce: salvar timestamp de início do excesso
     */
    private function setDebounceStart(int $deviceId, string $fixTime): void
    {
        $timestamp = strtotime($fixTime);
        
        // TTL 1 hora (tempo suficiente para position chegar)
        Cache::put($this->debounceKey($deviceId), $timestamp, now()->addHour());
    }
    
    private function getDebounceStart(int $deviceId): ?int
    {
        return Cache::get($this->debounceKey($deviceId));
    }
    
    private function clearDebounce(int $deviceId): void
    {
        Cache::forget($this->debounceKey($deviceId));
    }
}
