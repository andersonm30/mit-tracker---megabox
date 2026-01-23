<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

/**
 * PR-11A - Speed Analytics Request Validation
 * 
 * Validação unificada para os 3 endpoints de analytics:
 * - /api/speed-events/trends
 * - /api/speed-events/ranking
 * - /api/speed-events/heatmap
 * 
 * Guardrails:
 * - Range máximo: 31 dias
 * - from/to obrigatórios (ISO datetime)
 * - to > from
 * - Validações específicas por endpoint
 */
class SpeedAnalyticsRequest extends FormRequest
{
    /**
     * Determina se usuário está autorizado.
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        // Auth já é feita via middleware nas rotas
        return true;
    }
    
    /**
     * Rules dinâmicas baseadas no endpoint.
     * 
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $endpoint = $this->route()->getName();
        
        $baseRules = [
            'from' => ['required', 'date', 'before_or_equal:to'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'deviceId' => ['nullable', 'integer', 'min:1'],
            'driverId' => ['nullable', 'integer', 'min:1'],
        ];
        
        // Rules específicas por endpoint
        $endpointRules = match($endpoint) {
            'speed-analytics.trends' => [
                'bucket' => ['nullable', Rule::in(['day', 'hour'])],
            ],
            'speed-analytics.ranking' => [
                'groupBy' => ['nullable', Rule::in(['device', 'driver'])],
                'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            ],
            'speed-analytics.heatmap' => [
                'precision' => ['nullable', 'integer', 'min:1', 'max:6'],
                'maxPoints' => ['nullable', 'integer', 'min:100', 'max:5000'],
            ],
            default => [],
        };
        
        return array_merge($baseRules, $endpointRules);
    }
    
    /**
     * Validação customizada após rules padrão.
     * 
     * @return void
     * 
     * @throws \Illuminate\Validation\ValidationException
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Validar range máximo de 31 dias
            if ($this->has('from') && $this->has('to')) {
                try {
                    $from = Carbon::parse($this->input('from'));
                    $to = Carbon::parse($this->input('to'));
                    
                    $diffDays = $from->diffInDays($to);
                    
                    if ($diffDays > 31) {
                        $validator->errors()->add(
                            'to',
                            'O range máximo permitido é de 31 dias.'
                        );
                    }
                } catch (\Exception $e) {
                    $validator->errors()->add(
                        'from',
                        'Formato de data inválido. Use ISO 8601 (ex: 2025-01-20T00:00:00Z).'
                    );
                }
            }
        });
    }
    
    /**
     * Mensagens customizadas.
     * 
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'from.required' => 'O parâmetro "from" é obrigatório.',
            'from.date' => 'O parâmetro "from" deve ser uma data válida (ISO 8601).',
            'from.before_or_equal' => 'O parâmetro "from" deve ser anterior ou igual a "to".',
            
            'to.required' => 'O parâmetro "to" é obrigatório.',
            'to.date' => 'O parâmetro "to" deve ser uma data válida (ISO 8601).',
            'to.after_or_equal' => 'O parâmetro "to" deve ser posterior ou igual a "from".',
            
            'deviceId.integer' => 'O parâmetro "deviceId" deve ser um número inteiro.',
            'deviceId.min' => 'O parâmetro "deviceId" deve ser maior que 0.',
            
            'driverId.integer' => 'O parâmetro "driverId" deve ser um número inteiro.',
            'driverId.min' => 'O parâmetro "driverId" deve ser maior que 0.',
            
            'bucket.in' => 'O parâmetro "bucket" deve ser "day" ou "hour".',
            
            'groupBy.in' => 'O parâmetro "groupBy" deve ser "device" ou "driver".',
            
            'limit.integer' => 'O parâmetro "limit" deve ser um número inteiro.',
            'limit.min' => 'O parâmetro "limit" deve ser no mínimo 1.',
            'limit.max' => 'O parâmetro "limit" deve ser no máximo 100.',
            
            'precision.integer' => 'O parâmetro "precision" deve ser um número inteiro.',
            'precision.min' => 'O parâmetro "precision" deve ser no mínimo 1.',
            'precision.max' => 'O parâmetro "precision" deve ser no máximo 6.',
            
            'maxPoints.integer' => 'O parâmetro "maxPoints" deve ser um número inteiro.',
            'maxPoints.min' => 'O parâmetro "maxPoints" deve ser no mínimo 100.',
            'maxPoints.max' => 'O parâmetro "maxPoints" deve ser no máximo 5000.',
        ];
    }
}
