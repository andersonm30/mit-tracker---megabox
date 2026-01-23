<?php

namespace App\Http\Controllers;

use App\Http\Requests\SpeedAnalyticsRequest;
use App\Models\SpeedEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * PR-11A - Speed Analytics Controller
 * 
 * Endpoints read-only para analytics de speed_events.
 * - Trends: série temporal (day/hour buckets)
 * - Ranking: top devices/drivers violadores
 * - Heatmap: grid geográfico (lat/lng rounded)
 * 
 * Guardrails:
 * - Range máximo: 31 dias
 * - Event type: overspeed_limit
 * - Connection: tarkan_logs
 * - Auth: middleware existente
 */
class SpeedAnalyticsController extends Controller
{
    /**
     * GET /api/speed-events/trends
     * 
     * Série temporal de eventos agrupados por bucket (day/hour).
     * 
     * @param SpeedAnalyticsRequest $request
     * @return JsonResponse
     * 
     * Params:
     * - from: ISO datetime (required)
     * - to: ISO datetime (required)
     * - deviceId: int (optional)
     * - driverId: int (optional)
     * - bucket: day|hour (default: day)
     * 
     * Response:
     * {
     *   "meta": { "from", "to", "bucket", "total_buckets" },
     *   "data": [
     *     {
     *       "bucket_start": "2025-01-20T00:00:00Z",
     *       "total_events": 15,
     *       "avg_exceed_by_kmh": 12.5,
     *       "max_exceed_by_kmh": 25.3
     *     }
     *   ]
     * }
     */
    public function trends(SpeedAnalyticsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        $from = Carbon::parse($validated['from'])->toDateTimeString();
        $to = Carbon::parse($validated['to'])->toDateTimeString();
        $bucket = $validated['bucket'] ?? 'day';
        
        // Formato do bucket para SQL
        $dateFormat = $bucket === 'hour' 
            ? '%Y-%m-%d %H:00:00'  // Agrupa por hora
            : '%Y-%m-%d 00:00:00'; // Agrupa por dia
        
        // Query base
        $query = SpeedEvent::query()
            ->selectRaw("
                DATE_FORMAT(position_time, '{$dateFormat}') as bucket_start,
                COUNT(*) as total_events,
                ROUND(AVG(exceed_by_kmh), 2) as avg_exceed_by_kmh,
                ROUND(MAX(exceed_by_kmh), 2) as max_exceed_by_kmh
            ")
            ->where('event_type', 'overspeed_limit')
            ->whereBetween('position_time', [$from, $to])
            ->groupBy('bucket_start')
            ->orderBy('bucket_start', 'ASC');
        
        // Filtros opcionais
        if (isset($validated['deviceId'])) {
            $query->where('device_id', $validated['deviceId']);
        }
        
        if (isset($validated['driverId'])) {
            $query->where('driver_id', $validated['driverId']);
        }
        
        $data = $query->get()->map(function ($item) {
            return [
                'bucket_start' => Carbon::parse($item->bucket_start)->toIso8601String(),
                'total_events' => (int) $item->total_events,
                'avg_exceed_by_kmh' => (float) $item->avg_exceed_by_kmh,
                'max_exceed_by_kmh' => (float) $item->max_exceed_by_kmh,
            ];
        });
        
        return response()->json([
            'meta' => [
                'from' => Carbon::parse($from)->toIso8601String(),
                'to' => Carbon::parse($to)->toIso8601String(),
                'bucket' => $bucket,
                'total_buckets' => $data->count(),
                'deviceId' => $validated['deviceId'] ?? null,
                'driverId' => $validated['driverId'] ?? null,
            ],
            'data' => $data,
        ]);
    }
    
    /**
     * GET /api/speed-events/ranking
     * 
     * Top devices ou drivers violadores.
     * 
     * @param SpeedAnalyticsRequest $request
     * @return JsonResponse
     * 
     * Params:
     * - from: ISO datetime (required)
     * - to: ISO datetime (required)
     * - groupBy: device|driver (default: device)
     * - limit: int (default: 10, max: 100)
     * 
     * Response:
     * {
     *   "meta": { "from", "to", "groupBy", "limit", "total_returned" },
     *   "data": [
     *     {
     *       "key_id": 123,
     *       "total_events": 45,
     *       "avg_exceed_by_kmh": 15.2,
     *       "max_exceed_by_kmh": 30.5
     *     }
     *   ]
     * }
     */
    public function ranking(SpeedAnalyticsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        $from = Carbon::parse($validated['from'])->toDateTimeString();
        $to = Carbon::parse($validated['to'])->toDateTimeString();
        $groupBy = $validated['groupBy'] ?? 'device';
        $limit = min($validated['limit'] ?? 10, 100);
        
        // Campo de agrupamento
        $groupField = $groupBy === 'driver' ? 'driver_id' : 'device_id';
        
        // Query base
        $query = SpeedEvent::query()
            ->selectRaw("
                {$groupField} as key_id,
                COUNT(*) as total_events,
                ROUND(AVG(exceed_by_kmh), 2) as avg_exceed_by_kmh,
                ROUND(MAX(exceed_by_kmh), 2) as max_exceed_by_kmh
            ")
            ->where('event_type', 'overspeed_limit')
            ->whereBetween('position_time', [$from, $to])
            ->groupBy('key_id')
            ->orderByDesc('total_events')
            ->orderByDesc('max_exceed_by_kmh')
            ->orderByDesc('avg_exceed_by_kmh')
            ->limit($limit);
        
        // Se groupBy=driver, ignorar NULL (drivers não atribuídos)
        if ($groupBy === 'driver') {
            $query->whereNotNull('driver_id');
        }
        
        $data = $query->get()->map(function ($item) {
            return [
                'key_id' => (int) $item->key_id,
                'total_events' => (int) $item->total_events,
                'avg_exceed_by_kmh' => (float) $item->avg_exceed_by_kmh,
                'max_exceed_by_kmh' => (float) $item->max_exceed_by_kmh,
            ];
        });
        
        return response()->json([
            'meta' => [
                'from' => Carbon::parse($from)->toIso8601String(),
                'to' => Carbon::parse($to)->toIso8601String(),
                'groupBy' => $groupBy,
                'limit' => $limit,
                'total_returned' => $data->count(),
            ],
            'data' => $data,
        ]);
    }
    
    /**
     * GET /api/speed-events/heatmap
     * 
     * Grid geográfico de violações (lat/lng rounded).
     * 
     * @param SpeedAnalyticsRequest $request
     * @return JsonResponse
     * 
     * Params:
     * - from: ISO datetime (required)
     * - to: ISO datetime (required)
     * - precision: int (default: 3, determina arredondamento)
     * - maxPoints: int (default: 2000, max: 5000)
     * - deviceId: int (optional)
     * 
     * Response:
     * {
     *   "meta": { "from", "to", "precision", "maxPoints", "total_returned", "truncated" },
     *   "data": [
     *     {
     *       "lat": -23.550,
     *       "lng": -46.634,
     *       "total_events": 12,
     *       "avg_exceed_by_kmh": 14.5,
     *       "max_exceed_by_kmh": 28.3
     *     }
     *   ]
     * }
     */
    public function heatmap(SpeedAnalyticsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        $from = Carbon::parse($validated['from'])->toDateTimeString();
        $to = Carbon::parse($validated['to'])->toDateTimeString();
        $precision = $validated['precision'] ?? 3;
        $maxPoints = min($validated['maxPoints'] ?? 2000, 5000);
        
        // Fator de arredondamento: 10^precision
        $factor = pow(10, $precision);
        
        // Query base com grid rounding
        $query = SpeedEvent::query()
            ->selectRaw("
                ROUND(latitude * {$factor}) / {$factor} as lat,
                ROUND(longitude * {$factor}) / {$factor} as lng,
                COUNT(*) as total_events,
                ROUND(AVG(exceed_by_kmh), 2) as avg_exceed_by_kmh,
                ROUND(MAX(exceed_by_kmh), 2) as max_exceed_by_kmh
            ")
            ->where('event_type', 'overspeed_limit')
            ->whereBetween('position_time', [$from, $to])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->groupBy('lat', 'lng')
            ->orderByDesc('total_events')
            ->limit($maxPoints);
        
        // Filtro opcional por device
        if (isset($validated['deviceId'])) {
            $query->where('device_id', $validated['deviceId']);
        }
        
        $data = $query->get()->map(function ($item) {
            return [
                'lat' => (float) $item->lat,
                'lng' => (float) $item->lng,
                'total_events' => (int) $item->total_events,
                'avg_exceed_by_kmh' => (float) $item->avg_exceed_by_kmh,
                'max_exceed_by_kmh' => (float) $item->max_exceed_by_kmh,
            ];
        });
        
        // Se atingiu o limite, marcar como truncated
        $truncated = $data->count() >= $maxPoints;
        
        return response()->json([
            'meta' => [
                'from' => Carbon::parse($from)->toIso8601String(),
                'to' => Carbon::parse($to)->toIso8601String(),
                'precision' => $precision,
                'maxPoints' => $maxPoints,
                'total_returned' => $data->count(),
                'truncated' => $truncated,
                'deviceId' => $validated['deviceId'] ?? null,
            ],
            'data' => $data,
        ]);
    }
}
