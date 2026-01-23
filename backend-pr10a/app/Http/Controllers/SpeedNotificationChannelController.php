<?php

namespace App\Http\Controllers;

use App\Models\SpeedNotificationChannel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * PR-10C: Controller para gerenciar canais de notificação
 * 
 * Endpoints:
 * - GET /api/speed-notification-channels?deviceId=123
 * - POST /api/speed-notification-channels (criar/atualizar)
 * - PUT /api/speed-notification-channels/{id} (atualizar)
 * - DELETE /api/speed-notification-channels/{id} (deletar)
 * 
 * @author PR-10C
 */
class SpeedNotificationChannelController extends Controller
{
    /**
     * Listar canais de um device
     * 
     * GET /api/speed-notification-channels?deviceId=123
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        // Validação
        $validator = Validator::make($request->all(), [
            'deviceId' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $deviceId = $request->input('deviceId');

        // Buscar canais
        $channels = SpeedNotificationChannel::forDevice($deviceId)
            ->orderBy('channel')
            ->get();

        return response()->json([
            'data' => $channels,
        ], 200);
    }

    /**
     * Criar ou atualizar canal
     * 
     * POST /api/speed-notification-channels
     * Body: { deviceId, channel, enabled, target, throttle_seconds }
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Validação
        $validator = Validator::make($request->all(), [
            'deviceId' => 'required|integer|min:1',
            'channel' => 'required|in:webhook,email,whatsapp,push',
            'enabled' => 'required|boolean',
            'target' => 'required|string|max:255',
            'throttle_seconds' => 'nullable|integer|min:0|max:3600',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $data = [
            'device_id' => $request->input('deviceId'),
            'channel' => $request->input('channel'),
            'enabled' => $request->input('enabled'),
            'target' => $request->input('target'),
            'throttle_seconds' => $request->input('throttle_seconds', 300), // default: 5 min
        ];

        // Criar ou atualizar (upsert via unique constraint device_id + channel)
        $channel = SpeedNotificationChannel::updateOrCreate(
            [
                'device_id' => $data['device_id'],
                'channel' => $data['channel'],
            ],
            $data
        );

        return response()->json([
            'data' => $channel,
        ], 201);
    }

    /**
     * Atualizar canal existente
     * 
     * PUT /api/speed-notification-channels/{id}
     * Body: { enabled, target, throttle_seconds }
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, int $id)
    {
        // Buscar canal
        $channel = SpeedNotificationChannel::find($id);

        if (!$channel) {
            return response()->json([
                'error' => 'Channel not found',
            ], 404);
        }

        // Validação
        $validator = Validator::make($request->all(), [
            'enabled' => 'nullable|boolean',
            'target' => 'nullable|string|max:255',
            'throttle_seconds' => 'nullable|integer|min:0|max:3600',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        // Atualizar apenas campos fornecidos
        $channel->update($request->only(['enabled', 'target', 'throttle_seconds']));

        return response()->json([
            'data' => $channel,
        ], 200);
    }

    /**
     * Deletar canal
     * 
     * DELETE /api/speed-notification-channels/{id}
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(int $id)
    {
        $channel = SpeedNotificationChannel::find($id);

        if (!$channel) {
            return response()->json([
                'error' => 'Channel not found',
            ], 404);
        }

        $channel->delete();

        return response()->json([
            'message' => 'Channel deleted successfully',
        ], 200);
    }
}
