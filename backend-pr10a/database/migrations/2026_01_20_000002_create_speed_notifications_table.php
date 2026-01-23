<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PR-10C: Migration para criar tabela speed_notifications no banco de LOGS
 * 
 * Auditoria de envio de notificações (tracking + idempotência).
 * 
 * CRÍTICO: Usa Schema::connection('logs') para isolar do Traccar
 * 
 * Rodar: php artisan migrate --database=logs
 */
class CreateSpeedNotificationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::connection('logs')->create('speed_notifications', function (Blueprint $table) {
            $table->id();
            
            // Foreign keys
            $table->unsignedBigInteger('speed_event_id')->comment('FK para speed_events');
            $table->unsignedBigInteger('device_id')->comment('ID do device (denorm para queries)');
            
            // Dados do envio
            $table->enum('channel', ['webhook', 'email', 'whatsapp', 'push'])
                  ->comment('Canal usado');
            $table->string('target', 255)->comment('Destinatário (URL, email, phone)');
            
            // Status do envio
            $table->enum('status', ['queued', 'sent', 'failed', 'skipped'])
                  ->default('queued')
                  ->comment('Status: queued → sent/failed/skipped');
            
            // Erro (se falhou)
            $table->text('error_message')->nullable()->comment('Mensagem de erro (se failed)');
            
            // Timestamp do envio
            $table->dateTime('sent_at')->nullable()->comment('Quando foi enviado (se sent)');
            
            // Hash de idempotência
            $table->string('notification_hash', 64)
                  ->comment('SHA-256: speed_event_id|device_id|channel|target|floor(sent_window)');
            
            // Payload enviado (JSON)
            $table->json('payload')->nullable()->comment('Payload enviado ao canal');
            
            // Timestamps (Laravel)
            $table->timestamps();
            
            // Índices compostos
            $table->index(['device_id', 'created_at'], 'idx_device_created');
            $table->index(['speed_event_id', 'channel'], 'idx_event_channel');
            $table->index(['status', 'created_at'], 'idx_status_created');
            
            // Constraint: idempotência (não repetir mesmo envio)
            $table->unique('notification_hash', 'uniq_notification_hash');
            
            // Foreign key (opcional, recomendado)
            // $table->foreign('speed_event_id')->references('id')->on('speed_events')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::connection('logs')->dropIfExists('speed_notifications');
    }
}
