<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * PR-10C: Model para speed_notifications (banco LOGS)
 * 
 * Auditoria de envio de notificações.
 * 
 * @property int $id
 * @property int $speed_event_id
 * @property int $device_id
 * @property string $channel (webhook, email, whatsapp, push)
 * @property string $target (URL, email, phone)
 * @property string $status (queued, sent, failed, skipped)
 * @property string|null $error_message
 * @property \Carbon\Carbon|null $sent_at
 * @property string $notification_hash
 * @property array|null $payload
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * 
 * @author PR-10C
 */
class SpeedNotification extends Model
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
    protected $table = 'speed_notifications';

    /**
     * Fillable attributes
     * 
     * @var array
     */
    protected $fillable = [
        'speed_event_id',
        'device_id',
        'channel',
        'target',
        'status',
        'error_message',
        'sent_at',
        'notification_hash',
        'payload',
    ];

    /**
     * Casts
     * 
     * @var array
     */
    protected $casts = [
        'speed_event_id' => 'integer',
        'device_id' => 'integer',
        'sent_at' => 'datetime',
        'payload' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationship: speed event relacionado
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function speedEvent()
    {
        return $this->belongsTo(SpeedEvent::class, 'speed_event_id');
    }

    /**
     * Scope: apenas enviados
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }

    /**
     * Scope: apenas falhos
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope: apenas skipped (throttle)
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeSkipped($query)
    {
        return $query->where('status', 'skipped');
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

    /**
     * Scope: range de datas
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $from ISO 8601
     * @param string $to ISO 8601
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeDateRange($query, string $from, string $to)
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }
}
