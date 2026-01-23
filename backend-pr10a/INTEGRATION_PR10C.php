<?php

/**
 * PR-10C: INTEGRAÇÃO - Disparar SpeedEventCreated após criar evento
 * 
 * Este arquivo mostra onde adicionar o event() no ProcessSpeedEventsJob.php existente.
 * 
 * Localização: app/Jobs/ProcessSpeedEventsJob.php
 * Linha: ~281 (após SpeedEvent::create())
 * 
 * @author PR-10C
 */

// ==============================
// ANTES (PR-10A.1):
// ==============================

try {
    // Criar evento (idempotente via event_hash unique)
    $event = SpeedEvent::create($data);

    // Dispatcher (stub PR-10A)
    $this->dispatcher->dispatch($event);

    return true;

} catch (\Illuminate\Database\QueryException $e) {
    // Silenciar duplicate key (idempotência funcionando)
    if (stripos($e->getMessage(), 'uniq_event_hash') !== false ||
        stripos($e->getMessage(), 'Duplicate entry') !== false) {
        return false; // Evento já existe
    }

    throw $e; // Re-throw outros erros
}

// ==============================
// DEPOIS (PR-10C):
// ==============================

use App\Events\SpeedEventCreated; // ADICIONAR import no topo do arquivo

// ... (código existente) ...

try {
    // Criar evento (idempotente via event_hash unique)
    $event = SpeedEvent::create($data);

    // PR-10C: Disparar event para notificações
    // Crítico: try/catch para não quebrar o webhook
    try {
        event(new SpeedEventCreated($event));
    } catch (\Exception $notifError) {
        // Silenciar erro: não pode quebrar o webhook do Traccar
        \Log::warning('[PR-10C] Erro ao disparar SpeedEventCreated', [
            'speed_event_id' => $event->id,
            'error' => $notifError->getMessage(),
        ]);
    }

    // Dispatcher (stub PR-10A)
    $this->dispatcher->dispatch($event);

    return true;

} catch (\Illuminate\Database\QueryException $e) {
    // Silenciar duplicate key (idempotência funcionando)
    if (stripos($e->getMessage(), 'uniq_event_hash') !== false ||
        stripos($e->getMessage(), 'Duplicate entry') !== false) {
        return false; // Evento já existe
    }

    throw $e; // Re-throw outros erros
}

// ==============================
// RESULTADO:
// ==============================

// SpeedEvent criado → event(SpeedEventCreated) → Listener → SendSpeedNotificationJob → canais → webhook/email
// Se erro: silenciado, webhook continua funcionando ✅
