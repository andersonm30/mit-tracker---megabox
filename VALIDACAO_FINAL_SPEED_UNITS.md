# Validação Final: Speed Units (Knots vs Km/h)

## Objetivo

Verificar se Traccar está retornando velocidade em **knots** ou **km/h** e garantir conversão consistente em todo o sistema.

---

## Passo 1: Diagnóstico (30 segundos)

### Abra qualquer relatório com movimento em rodovia

1. Gere relatório de motorista (período com rodovia/trajeto conhecido)
2. Olhe o KPI `max_speed`

### Classificação

**CASO A**: `max_speed` aparece entre **80-120** (ou coerente com rodovia)
- ✅ **Já está em km/h** → NÃO precisa converter
- Pule para [Checklist de Consistência](#checklist-de-consistência)

**CASO B**: `max_speed` aparece entre **40-70** (muito baixo para rodovia)
- ⚠️ **Está em knots** → PRECISA converter
- Continue para [Passo 2](#passo-2-ativar-conversão-caso-b)

### Regra Matemática
```
km/h = knots × 1.852
knots = km/h ÷ 1.852

Exemplo:
- 54 knots × 1.852 = 100 km/h ✅
- 100 km/h ÷ 1.852 = 54 knots
```

---

## Passo 2: Ativar Conversão (CASO B)

### Onde converter (recomendado: fonte única)

**Arquivo**: `back-end/app/Services/TraccarReportService.php`

**Método**: `calculateKPIs()` (ou onde você processa positions pela primeira vez)

### Código a adicionar

Localize onde você lê `$position['speed']` e adicione conversão:

```php
// Dentro do loop de positions
foreach ($positions as $position) {
    $speed = (float) ($position['speed'] ?? 0);
    
    // ✅ CONVERSÃO KNOTS → KM/H
    $speed = $speed * 1.852;
    
    // ... resto do código (cálculo de KPIs, etc)
}
```

### Onde NÃO converter

❌ **Não adicione conversão no frontend** (driver-speed-chart.vue)
- Backend já converte → frontend só renderiza

❌ **Não duplique conversão**
- Se converter em `calculateKPIs()`, NÃO converta de novo em `getSeries()`
- **Mas se converter no Service**, o `getSeries()` já vai receber km/h automaticamente

### Conversão no PR-08C (alternativa)

Se preferir converter **só no endpoint `/series`** (não recomendado, mas funcional):

**Arquivo**: `back-end/app/Http/Controllers/DriverReportController.php`

**Método**: `getSeries()`

```php
// Dentro do loop que gera série
foreach ($positions as $position) {
    $speed = (float) ($position['speed'] ?? 0);
    
    // ✅ CONVERSÃO KNOTS → KM/H
    $speed = $speed * 1.852;
    
    $series[] = [
        't' => strtotime($position['fixTime']) * 1000,
        'speed' => round($speed, 1)
    ];
}
```

⚠️ **IMPORTANTE**: Se fizer isso, também converta no `calculateKPIs()` para manter consistência!

---

## Passo 3: Checklist de Consistência

Após converter (ou confirmar que já está em km/h):

### 1. KPIs vs Gráfico

| Métrica | Onde verificar | O que esperar |
|---------|---------------|---------------|
| **max_speed** (KPI) | Card "Velocidades" | ≈ pico do gráfico |
| **average_speed** (KPI) | Card "Velocidades" | ≈ faixa média do gráfico (excluindo paradas) |
| **Tooltip do gráfico** | Hover no pico | Valor próximo ao max_speed |

**Divergências aceitáveis**:
- Média do KPI maior que média visual do gráfico → OK se KPI filtra `speed > 3` (ignora paradas)
- Diferença de 1-2 km/h → OK (arredondamento)

**Divergências NÃO aceitáveis**:
- max_speed = 100 no KPI, pico = 54 no gráfico → ⚠️ conversão aplicada apenas em um lugar
- Valores 1.85x diferentes → ⚠️ knots vs km/h

### 2. Teste com trajeto conhecido

1. Escolha período em rodovia (velocidade esperada ~80-100 km/h)
2. Gere relatório
3. Confirme:
   - `max_speed` próximo de 80-100 ✅
   - Gráfico mostra picos em 80-100 ✅
   - Tooltip em hover mostra valores coerentes ✅

### 3. Teste edge cases

- [ ] Período com veículo parado (speed = 0) → gráfico deve mostrar 0, não quebrar
- [ ] Período sem movimento → empty state no gráfico
- [ ] Período de 7 dias → downsample funciona (≤1000 pontos)

---

## Passo 4: Decisão Final

### Se CASO A (já está em km/h)

✅ **NÃO fazer nada**
- Sistema já está correto
- Documentar no código:

```php
// VALIDADO: Traccar configurado para retornar speed em km/h
// Nenhuma conversão necessária (verificado em 19/01/2026)
```

### Se CASO B (estava em knots)

✅ **Aplicar conversão em fonte única**
- Recomendado: `TraccarReportService.php` → `calculateKPIs()`
- Alternativa: `DriverReportController.php` → `getSeries()` + `calculateKPIs()`

✅ **Testar novamente** (executar Checklist de Consistência)

✅ **Documentar no código**:

```php
// CONVERSÃO KNOTS → KM/H
// Traccar configurado para retornar speed em knots (verificado em 19/01/2026)
// Multiplicador: 1.852 (1 knot = 1.852 km/h)
$speed = $speed * 1.852;
```

---

## Resumo Executivo

| Etapa | Tempo | Ação |
|-------|-------|------|
| **1. Diagnóstico** | 30s | Olhar max_speed: 80-120 (A) ou 40-70 (B)? |
| **2. Conversão** | 2min | Se B: adicionar `* 1.852` em fonte única |
| **3. Validação** | 3min | Checklist: KPIs ≈ gráfico, trajeto conhecido OK |
| **4. Documentar** | 1min | Comentário no código sobre decisão |

---

## Onde Aplicar Conversão (Resumo)

### ✅ Recomendado (fonte única)

**Arquivo**: `back-end/app/Services/TraccarReportService.php`

**Método**: `calculateKPIs()` ou equivalente que processa positions

**Linha**: Logo após `$speed = (float) ($position['speed'] ?? 0);`

**Código**: `$speed = $speed * 1.852;`

**Vantagem**: Um único ponto de conversão, todo sistema consistente

### ⚠️ Alternativa (dois pontos)

Se não quiser mexer no Service:

1. **DriverReportController** → `getSeries()` (linha onde lê speed de position)
2. **TraccarReportService** → `calculateKPIs()` (mesma coisa)

**Desvantagem**: Duplicação de lógica

---

## Próximos Passos Após Validação

1. ✅ Executar diagnóstico (A ou B)
2. ✅ Aplicar conversão se necessário (B)
3. ✅ Validar consistência (checklist)
4. ✅ Commitar com mensagem clara:

```bash
git commit -m "fix(reports): converter speed de knots para km/h"
# OU
git commit -m "docs(reports): validar speed já em km/h, sem conversão necessária"
```

---

**Status**: ⏳ AGUARDANDO VALIDAÇÃO MANUAL (5 minutos)  
**Última atualização**: 19/01/2026  
**Autor**: GitHub Copilot  
**Referências**: PR-06 (KPIs), PR-08C (series endpoint)
