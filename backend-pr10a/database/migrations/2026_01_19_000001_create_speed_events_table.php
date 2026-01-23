<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PR-10A: Migration para criar tabela speed_events no banco de LOGS
 * 
 * CRÍTICO: Usa Schema::connection('logs') para isolar do Traccar
 * 
 * Rodar: php artisan migrate --database=logs
 */
class CreateSpeedEventsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::connection('logs')->create('speed_events', function (Blueprint $table) {
            $table->id();
            
            // Tipo de evento (futuro: pode ter outros além de overspeed_limit)
            $table->string('event_type', 50)->default('overspeed_limit');
            
            // Identificadores
            $table->unsignedBigInteger('device_id');
            $table->unsignedBigInteger('driver_id')->nullable();
            
            // Timestamps da posição (do Traccar)
            $table->dateTime('position_time')->comment('fixTime da posição');
            $table->dateTime('server_time')->nullable()->comment('serverTime da posição');
            
            // Velocidades (em km/h, normalizado)
            $table->decimal('speed_kmh', 6, 1)->comment('Velocidade real em km/h');
            $table->decimal('speed_limit_kmh', 6, 1)->comment('Limite configurado');
            $table->decimal('exceed_by_kmh', 6, 1)->comment('Quanto excedeu');
            
            // Localização
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('address', 255)->nullable()->comment('Geocoding reverso');
            
            // Dados extras (JSON)
            $table->json('payload')->nullable()->comment('Dados extras da position');
            
            // Idempotência (evitar duplicação por retry do Traccar)
            $table->string('event_hash', 64)->comment('SHA-256: event_type|device_id|position_time|speed_kmh|speed_limit_kmh|lat|lng');
            
            // Timestamps do registro (Laravel)
            $table->timestamps();
            
            // Índices compostos para queries comuns
            $table->index(['device_id', 'position_time'], 'idx_device_time');
            $table->index(['driver_id', 'position_time'], 'idx_driver_time');
            $table->index(['event_type', 'position_time'], 'idx_event_type');
            
            // Índice único para idempotência (previne duplicação)
            $table->unique('event_hash', 'uniq_event_hash');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::connection('logs')->dropIfExists('speed_events');
    }
}
