// PR-10A.1: Registro do ProcessSpeedEventsJob no Kernel.php
//
// Este código deve ser adicionado ao método schedule() em:
// back-end/app/Console/Kernel.php
//
// Localização: protected function schedule(Schedule $schedule)
// {
//     // ... código existente ...
//
//     // PR-10A.1: Polling de speed events (cada 1 minuto)
//     $schedule->job(new \App\Jobs\ProcessSpeedEventsJob)
//              ->everyMinute()
//              ->withoutOverlapping();
// }

// Exemplo completo do método:

protected function schedule(Schedule $schedule)
{
    // Existing scheduled tasks...
    
    // PR-10A.1: Speed Events Polling (captura 100% das violações)
    //
    // Executa a cada 1 minuto:
    // - Busca positions novas desde último cursor (Cache::get('speed:last_position_id'))
    // - Processa batch de 500 positions por execução
    // - Detecta violações de velocidade (reusa SpeedLimitEventDetector)
    // - Cria eventos idempotentes (event_hash unique)
    // - Atualiza cursor automaticamente (Cache::forever('speed:last_position_id', $newId))
    //
    // withoutOverlapping: Previne execução simultânea (lock automático Laravel)
    //
    // Como desabilitar:
    // - Comentar as 3 linhas abaixo
    // - OU remover o job do schedule temporariamente
    // - OU adicionar flag no .env: SPEED_POLLING_ENABLED=false (requer código adicional)
    //
    $schedule->job(new \App\Jobs\ProcessSpeedEventsJob)
             ->everyMinute()
             ->withoutOverlapping();
}
