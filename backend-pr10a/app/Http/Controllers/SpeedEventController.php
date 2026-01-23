<?php

namespace App\Http\Controllers;

use App\Models\SpeedEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * PR-10A: Controller para API de eventos de excesso de velocidade
 * 
 * Endpoint: GET /api/speed-events
 */
class SpeedEventController extends Controller
{
    /**
     * GET /api/speed-events
     * 
     * Query params:
     * - from (obrigatório, date ISO 8601)
     * - to (obrigatório, date ISO 8601)
     * - deviceId (opcional, integer)
     * - driverId (opcional, integer)
     * - page (opcional, default 1)
     * - perPage (opcional, default 50, max 500)
     * 
     * Response:
     * {
     *   "meta": {
     *     "from": "2026-01-01T00:00:00Z",
     *     "to": "2026-01-31T23:59:59Z",
     *     "total": 15,
     *     "perPage": 50,
     *     "currentPage": 1,
     *     "lastPage": 1
     *   },
     *   "data": [...]
     * }
     */
    public function index(Request $request)
    {
        // Validação de entrada
        $validator = Validator::make($request->all(), [
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
            'deviceId' => 'nullable|integer|min:1',
            'driverId' => 'nullable|integer|min:1',
            'page' => 'nullable|integer|min:1',
            'perPage' => 'nullable|integer|min:1|max:500',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 400);
        }
        
        // Guardrail: máximo 31 dias de range
        try {
            $from = new \DateTime($request->from);
            $to = new \DateTime($request->to);
            $diff = $from->diff($to)->days;
            
            if ($diff > 31) {
                return response()->json([
                    'error' => 'Date range cannot exceed 31 days',
                    'requested' => [
                        'from' => $request->from,
                        'to' => $request->to,
                        'days' => $diff,
                    ],
                    'max_allowed' => 31,
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Invalid date format',
                'message' => $e->getMessage(),
            ], 400);
        }
        
        // Query otimizada com scopes
        $query = SpeedEvent::query()
            ->overspeedOnly()
            ->between($request->from, $request->to)
            ->orderBy('position_time', 'desc');
        
        // Filtros opcionais
        if ($request->has('deviceId')) {
            $query->forDevice((int) $request->deviceId);
        }
        
        if ($request->has('driverId')) {
            $query->forDriver((int) $request->driverId);
        }
        
        // Paginação
        $perPage = min($request->perPage ?? 50, 500);
        
        try {
            $events = $query->paginate($perPage);
            
            return response()->json([
                'meta' => [
                    'from' => $request->from,
                    'to' => $request->to,
                    'total' => $events->total(),
                    'perPage' => $events->perPage(),
                    'currentPage' => $events->currentPage(),
                    'lastPage' => $events->lastPage(),
                    'filters' => [
                        'deviceId' => $request->deviceId,
                        'driverId' => $request->driverId,
                    ],
                ],
                'data' => $events->items(),
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch speed events',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
