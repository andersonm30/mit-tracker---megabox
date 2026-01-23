<?php

namespace App\Providers;

use App\Events\SpeedEventCreated;
use App\Listeners\SpeedEventCreatedListener;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

/**
 * PR-10C: EventServiceProvider para registrar listeners
 * 
 * Este arquivo pode ser um STUB se o projeto não tiver EventServiceProvider.
 * Se já existir, adicionar apenas o mapeamento SpeedEventCreated → Listener.
 * 
 * @author PR-10C
 */
class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // PR-10C: Speed Event Notifications
        SpeedEventCreated::class => [
            SpeedEventCreatedListener::class,
        ],

        // Adicionar outros eventos aqui...
    ];

    /**
     * Register any events for your application.
     *
     * @return void
     */
    public function boot()
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     *
     * @return bool
     */
    public function shouldDiscoverEvents()
    {
        return false;
    }
}
