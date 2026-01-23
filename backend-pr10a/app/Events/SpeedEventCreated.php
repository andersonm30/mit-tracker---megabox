<?php

namespace App\Events;

use App\Models\SpeedEvent;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * PR-10C: Event disparado quando um SpeedEvent é criado
 * 
 * Este evento NÃO deve quebrar o webhook do Traccar.
 * Qualquer erro no listener deve ser silenciado/logado.
 * 
 * @author PR-10C
 */
class SpeedEventCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * SpeedEvent model instance
     * 
     * @var SpeedEvent
     */
    public $speedEvent;

    /**
     * Create a new event instance.
     *
     * @param SpeedEvent $speedEvent
     * @return void
     */
    public function __construct(SpeedEvent $speedEvent)
    {
        $this->speedEvent = $speedEvent;
    }
}
