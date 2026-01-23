<?php

/**
 * PR-10A: Adicionar estas rotas ao arquivo routes/api.php existente
 * 
 * INSTRUÇÕES:
 * 1. Abrir: C:\projeto\Versao-tarkan-Jesse\back-end\routes\api.php
 * 2. Adicionar use statement no topo:
 *    use App\Http\Controllers\SpeedEventController;
 * 3. Adicionar este grupo de rotas no final do arquivo
 */

use App\Http\Controllers\SpeedEventController;

// PR-10A: Endpoints de eventos de excesso de velocidade
Route::group(['prefix' => 'speed-events'], function() {
    // GET /api/speed-events?from=...&to=...&deviceId=...&driverId=...
    Route::get('/', [SpeedEventController::class, 'index']);
});
