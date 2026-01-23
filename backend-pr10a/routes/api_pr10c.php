<?php

/**
 * PR-10C: Rotas da API para Speed Notifications
 * 
 * Este arquivo é um STUB para documentar as rotas.
 * Adicionar ao arquivo routes/api.php existente no projeto Laravel.
 * 
 * Middleware recomendado: 'auth:api' ou 'auth:sanctum'
 * 
 * @author PR-10C
 */

use App\Http\Controllers\SpeedNotificationChannelController;
use App\Http\Controllers\SpeedNotificationController;
use Illuminate\Support\Facades\Route;

// PR-10C: Speed Notification Channels (configuração)
Route::middleware(['auth:api'])->group(function () {
    
    // Listar canais de um device
    // GET /api/speed-notification-channels?deviceId=123
    Route::get('speed-notification-channels', [SpeedNotificationChannelController::class, 'index']);
    
    // Criar ou atualizar canal
    // POST /api/speed-notification-channels
    // Body: { deviceId, channel, enabled, target, throttle_seconds }
    Route::post('speed-notification-channels', [SpeedNotificationChannelController::class, 'store']);
    
    // Atualizar canal existente
    // PUT /api/speed-notification-channels/{id}
    // Body: { enabled, target, throttle_seconds }
    Route::put('speed-notification-channels/{id}', [SpeedNotificationChannelController::class, 'update']);
    
    // Deletar canal
    // DELETE /api/speed-notification-channels/{id}
    Route::delete('speed-notification-channels/{id}', [SpeedNotificationChannelController::class, 'destroy']);
});

// PR-10C: Speed Notifications (auditoria)
Route::middleware(['auth:api'])->group(function () {
    
    // Listar notificações (auditoria)
    // GET /api/speed-notifications?deviceId=123&from=...&to=...&channel=webhook&status=sent&page=1&perPage=50
    Route::get('speed-notifications', [SpeedNotificationController::class, 'index']);
    
    // Detalhe de uma notificação
    // GET /api/speed-notifications/{id}
    Route::get('speed-notifications/{id}', [SpeedNotificationController::class, 'show']);
});
