<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * PR-10C: Model para speed_notification_channels (banco LOGS)
 * 
 * Gerencia configuração de canais de notificação por device.
 * 
 * @property int $id
 * @property int $device_id
 * @property string $channel (webhook, email, whatsapp, push)
 * @property bool $enabled
 * @property string $target (URL, email, phone)
 * @property int $throttle_seconds
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * 
 * @author PR-10C
 */
class SpeedNotificationChannel extends Model
{
    /**
     * Connection: banco de logs (não Traccar)
     * 
     * @var string
     */
    protected $connection = 'logs';

    /**
     * Table name
     * 
     * @var string
     */
    protected $table = 'speed_notification_channels';

    /**
     * Fillable attributes
     * 
     * @var array
     */
    protected $fillable = [
        'device_id',
        'channel',
        'enabled',
        'target',
        'throttle_seconds',
    ];

    /**
     * Casts
     * 
     * @var array
     */
    protected $casts = [
        'device_id' => 'integer',
        'enabled' => 'boolean',
        'throttle_seconds' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationship: notificações enviadas por este canal
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function notifications()
    {
        return $this->hasMany(SpeedNotification::class, 'device_id', 'device_id')
                    ->where('channel', $this->channel);
    }

    /**
     * Scope: apenas canais habilitados
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }

    /**
     * Scope: por device
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $deviceId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForDevice($query, int $deviceId)
    {
        return $query->where('device_id', $deviceId);
    }

    /**
     * Scope: por canal
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $channel
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForChannel($query, string $channel)
    {
        return $query->where('channel', $channel);
    }
}
