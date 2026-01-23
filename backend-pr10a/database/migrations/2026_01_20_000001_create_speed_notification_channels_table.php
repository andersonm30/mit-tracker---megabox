<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PR-10C: Migration para criar tabela speed_notification_channels no banco de LOGS
 * 
 * Gerencia configuração de canais de notificação por device/cliente.
 * 
 * CRÍTICO: Usa Schema::connection('logs') para isolar do Traccar
 * 
 * Rodar: php artisan migrate --database=logs
 */
class CreateSpeedNotificationChannelsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::connection('logs')->create('speed_notification_channels', function (Blueprint $table) {
            $table->id();
            
            // Identificador do device (Traccar)
            $table->unsignedBigInteger('device_id')->comment('ID do device no Traccar');
            
            // Tipo de canal
            $table->enum('channel', ['webhook', 'email', 'whatsapp', 'push'])
                  ->default('webhook')
                  ->comment('Tipo de canal de notificação');
            
            // Status do canal
            $table->boolean('enabled')->default(true)->comment('Canal habilitado/desabilitado');
            
            // Destinatário/target
            $table->string('target', 255)->comment('URL webhook, email, phone, etc.');
            
            // Throttling
            $table->unsignedInteger('throttle_seconds')
                  ->default(300)
                  ->comment('Throttle em segundos (padrão: 5 min)');
            
            // Timestamps (Laravel)
            $table->timestamps();
            
            // Índices compostos
            $table->index(['device_id', 'channel', 'enabled'], 'idx_device_channel_enabled');
            $table->index('device_id', 'idx_device_id');
            
            // Constraint: 1 canal por device + tipo
            $table->unique(['device_id', 'channel'], 'uniq_device_channel');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::connection('logs')->dropIfExists('speed_notification_channels');
    }
}
