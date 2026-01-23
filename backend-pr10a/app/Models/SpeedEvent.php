<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * PR-10A: Model para eventos de excesso de velocidade
 * 
 * CRÍTICO: $connection = 'logs' isola do banco Traccar
 */
class SpeedEvent extends Model
{
    /**
     * Conexão isolada do Traccar (banco de logs)
     */
    protected $connection = 'logs';
    
    /**
     * Tabela no banco de logs
     */
    protected $table = 'speed_events';
    
    /**
     * Campos permitidos para mass assignment
     */
    protected $fillable = [
        'event_type',
        'device_id',
        'driver_id',
        'position_time',
        'server_time',
        'speed_kmh',
        'speed_limit_kmh',
        'exceed_by_kmh',
        'latitude',
        'longitude',
        'address',
        'payload',
        'event_hash', // PR-10A: Idempotência (evitar duplicação)
    ];
    
    /**
     * Casts de tipos
     * 
     * CRÍTICO: payload => 'array' faz Eloquent gerenciar JSON automaticamente
     */
    protected $casts = [
        'position_time' => 'datetime',
        'server_time' => 'datetime',
        'speed_kmh' => 'float',
        'speed_limit_kmh' => 'float',
        'exceed_by_kmh' => 'float',
        'latitude' => 'float',
        'longitude' => 'float',
        'payload' => 'array', // Laravel gerencia JSON encode/decode
    ];
    
    /**
     * Scope: filtrar por device
     */
    public function scopeForDevice($query, $deviceId)
    {
        if (!$deviceId) {
            return $query;
        }
        
        return $query->where('device_id', $deviceId);
    }
    
    /**
     * Scope: filtrar por driver
     */
    public function scopeForDriver($query, $driverId)
    {
        if (!$driverId) {
            return $query;
        }
        
        return $query->where('driver_id', $driverId);
    }
    
    /**
     * Scope: filtrar por período
     */
    public function scopeBetween($query, $from, $to)
    {
        return $query->whereBetween('position_time', [$from, $to]);
    }
    
    /**
     * Scope: apenas eventos de overspeed
     */
    public function scopeOverspeedOnly($query)
    {
        return $query->where('event_type', 'overspeed_limit');
    }
}
