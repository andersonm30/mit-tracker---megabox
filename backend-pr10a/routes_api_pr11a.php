// ============================================================================
// PR-11A - Speed Analytics Routes
// ============================================================================
// Adicionar estas rotas ao arquivo routes/api.php existente
// Após as rotas do PR-10A (/api/speed-events)
// ============================================================================

use App\Http\Controllers\SpeedAnalyticsController;

// PR-11A: Analytics (read-only, protegido por auth)
Route::middleware('auth:api')->group(function () {
    
    // Trends: série temporal (day/hour buckets)
    Route::get('/speed-events/trends', [SpeedAnalyticsController::class, 'trends'])
        ->name('speed-analytics.trends');
    
    // Ranking: top devices/drivers violadores
    Route::get('/speed-events/ranking', [SpeedAnalyticsController::class, 'ranking'])
        ->name('speed-analytics.ranking');
    
    // Heatmap: grid geográfico (lat/lng rounded)
    Route::get('/speed-events/heatmap', [SpeedAnalyticsController::class, 'heatmap'])
        ->name('speed-analytics.heatmap');
});

// ============================================================================
// IMPORTANTE: Ajustar middleware 'auth:api' conforme seu projeto
// Opções comuns:
// - auth:api (Laravel Passport/Sanctum)
// - auth:sanctum
// - jwt.auth (tymon/jwt-auth)
// - Seu middleware customizado
// ============================================================================
