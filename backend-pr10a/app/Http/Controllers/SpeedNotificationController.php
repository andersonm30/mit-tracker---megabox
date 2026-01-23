<?php

namespace App\Http\Controllers;

use App\Models\SpeedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * PR-10C: Controller para listar notificações enviadas (auditoria)
 * 
 * Endpoints:
 * - GET /api/speed-notifications?deviceId=123&from=...&to=...&channel=webhook&status=sent
 * 
 * @author PR-10C
 */
class SpeedNotificationController extends Controller
{
    /**
     * Listar notificações (auditoria)
     * 
     * GET /api/speed-notifications?deviceId=123&from=2025-01-19T00:00:00Z&to=2025-01-20T23:59:59Z&channel=webhook&status=sent&page=1&perPage=50
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        // Validação
        $validator = Validator::make($request->all(), [
            'deviceId' => 'nullable|integer|min:1',
            'from' => 'nullable|date_format:Y-m-d\TH:i:s\Z',
            'to' => 'nullable|date_format:Y-m-d\TH:i:s\Z',
            'channel' => 'nullable|in:webhook,email,whatsapp,push',
            'status' => 'nullable|in:queued,sent,failed,skipped',
            'page' => 'nullable|integer|min:1',
            'perPage' => 'nullable|integer|min:1|max:200',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        // Montar query
        $query = SpeedNotification::query();

        // Filtro por device
        if ($request->has('deviceId')) {
            $query->forDevice($request->input('deviceId'));
        }

        // Filtro por canal
        if ($request->has('channel')) {
            $query->forChannel($request->input('channel'));
        }

        // Filtro por status
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filtro por range de datas
        if ($request->has('from') && $request->has('to')) {
            $from = $request->input('from');
            $to = $request->input('to');

            // Validar range máximo (31 dias)
            $fromDate = new \DateTime($from);
            $toDate = new \DateTime($to);
            $diff = $fromDate->diff($toDate);

            if ($diff->days > 31) {
                return response()->json([
                    'error' => 'Range máximo: 31 dias',
                ], 422);
            }

            $query->dateRange($from, $to);
        }

        // Ordenar por created_at DESC
        $query->orderBy('created_at', 'desc');

        // Paginação
        $page = $request->input('page', 1);
        $perPage = $request->input('perPage', 50);

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        // Resposta
        return response()->json([
            'meta' => [
                'total' => $paginator->total(),
                'perPage' => $paginator->perPage(),
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
            ],
            'data' => $paginator->items(),
        ], 200);
    }

    /**
     * Detalhe de uma notificação
     * 
     * GET /api/speed-notifications/{id}
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(int $id)
    {
        $notification = SpeedNotification::with('speedEvent')->find($id);

        if (!$notification) {
            return response()->json([
                'error' => 'Notification not found',
            ], 404);
        }

        return response()->json([
            'data' => $notification,
        ], 200);
    }
}
