# OBSERVABILITY.md - Observabilidade para Produção

Este documento descreve o sistema de observabilidade implementado para monitoramento de recursos e performance.

---

## 📊 Visão Geral

O sistema de observabilidade fornece:

1. **Resource Monitor** - Monitoramento de timers, controllers, listeners e players
2. **APM Hooks (Spans)** - Marcadores de performance para integração com APM externo
3. **Thresholds** - Alertas quando recursos excedem limites configurados

---

## 🔧 Habilitação

### Em Desenvolvimento

O monitor é habilitado automaticamente quando `NODE_ENV === 'development'`.

### Em Staging/Produção

```javascript
// Habilitar via localStorage
localStorage.setItem('DEBUG_RESOURCES', '1');

// Depois recarregue a página
location.reload();
```

### Desabilitar

```javascript
localStorage.removeItem('DEBUG_RESOURCES');
location.reload();
```

---

## 🖥️ Console API

Quando habilitado, dois objetos globais ficam disponíveis:

### window.__DEBUG_RESOURCES__

```javascript
// Snapshot de recursos
window.__DEBUG_RESOURCES__.snapshot();
// { timestamp, controllers, timeouts, intervals, timersTotal, domListeners }

// Contagens individuais
window.__DEBUG_RESOURCES__.controllersCount();
window.__DEBUG_RESOURCES__.timersCount();
window.__DEBUG_RESOURCES__.domListenersCount();

// Cleanup manual (para testes)
window.__DEBUG_RESOURCES__.cleanup('motivo');
```

### window.__OBSERVABILITY__

```javascript
// Snapshot completo
window.__OBSERVABILITY__.getSnapshot();

// Iniciar/parar monitor (report a cada 60s)
window.__OBSERVABILITY__.startMonitor();
window.__OBSERVABILITY__.stopMonitor();

// Criar span manual
const span = window.__OBSERVABILITY__.createSpan('minha_operacao', { key: 'value' });
// ... operação ...
span.end({ success: true });

// Spans pré-definidos
window.__OBSERVABILITY__.spans.deviceLoad(deviceId);
window.__OBSERVABILITY__.spans.eventsFetch(deviceId);
window.__OBSERVABILITY__.spans.cameraOpen('front');
```

---

## 📈 Resource Monitor

O monitor reporta a cada **60 segundos** no `console.debug`:

```
[Observability] Resource Monitor {
  timeouts: 2,
  intervals: 1,
  timersTotal: 3,
  controllers: 1,
  domListeners: 5,
  players: 0
}
```

### Thresholds (Alertas)

Quando recursos excedem limites, um warning é emitido:

| Recurso | Threshold | Significado |
|---------|-----------|-------------|
| timers | > 10 | Muitos timers ativos |
| controllers | > 5 | Muitos AbortControllers |
| domListeners | > 20 | Muitos event listeners |
| players | > 2 | Muitos video players |

```
[Observability] ⚠️ Resource warnings: timers (15) > threshold (10)
```

---

## 🎯 APM Spans

Spans marcam operações para medir performance:

### Spans Pré-definidos

| Span | Descrição |
|------|-----------|
| `device_load` | Carregamento de dados do device |
| `events_fetch` | Fetch de eventos recentes |
| `camera_open` | Abertura de câmera |
| `cleanup` | Limpeza de recursos |
| `pdf_generate` | Geração de PDF |
| `history_fetch` | Fetch de histórico de posições |

### Uso no Código

```javascript
import { spans } from '@/utils/observability';

// Iniciar span
const span = spans.deviceLoad(deviceId);

try {
  // ... operação ...
  span.end({ success: true });
} catch (error) {
  span.recordError(error);
  span.end({ success: false });
}
```

### Integração com APM Externo

Se existir um APM (DataDog, NewRelic, etc), implemente:

```javascript
window.__APM__ = {
  recordSpan: ({ name, spanId, duration, attributes, timestamp }) => {
    // Enviar para seu APM
    datadogRum.addTiming(name, duration);
  }
};
```

---

## 🔍 O Que Olhar em Staging

### Checklist de Saúde

1. **Após navegação entre devices:**
   ```javascript
   window.__DEBUG_RESOURCES__.snapshot()
   // Esperado: controllers = 0-1, timersTotal < 5
   ```

2. **Após abrir/fechar câmera:**
   ```javascript
   window.__DEBUG_RESOURCES__.snapshot()
   // Esperado: players = 0 após fechar
   ```

3. **Após 5 minutos de uso:**
   ```javascript
   // Ver se há crescimento contínuo (memory leak)
   // Esperado: valores estáveis, sem crescimento
   ```

### Sinais de Problema

| Sintoma | Possível Causa |
|---------|----------------|
| `timersTotal` crescendo | Timer não cancelado no cleanup |
| `controllers` > 3 | AbortController não abortado |
| `domListeners` crescendo | Event listener não removido |
| `players` > 0 após fechar | Video player não destruído |

### Comandos Úteis

```javascript
// Monitoramento contínuo
window.__OBSERVABILITY__.startMonitor();

// Parar monitoramento
window.__OBSERVABILITY__.stopMonitor();

// Forçar cleanup e verificar
window.__DEBUG_RESOURCES__.cleanup('teste');
window.__DEBUG_RESOURCES__.snapshot();
// Esperado: tudo zerado
```

---

## 🛡️ Segurança

### Dados Sensíveis

O sistema **sanitiza automaticamente** campos sensíveis:

- password, token, secret
- apiKey, authorization
- cookie, session

Estes campos aparecem como `[REDACTED]` nos logs.

### Sampling

Para evitar spam em produção, spans podem ser amostrados:

```javascript
// No observability.js
const CONFIG = {
  SAMPLING_RATE: 0.1  // 10% das operações são logadas
};
```

---

## 📁 Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| [src/utils/observability.js](src/utils/observability.js) | Sistema de observabilidade |
| [src/utils/timerRegistry.js](src/utils/timerRegistry.js) | Registry de timers |
| [DEBUG_RESOURCES.md](DEBUG_RESOURCES.md) | Documentação de debug |
| [HARDENING_GATES.md](HARDENING_GATES.md) | Checklist de hardening |

---

## 🔄 Integração com devices.internal.vue

O componente principal já integra o monitor:

```javascript
// Em devices.internal.vue
import { startResourceMonitor, stopResourceMonitor, spans as obsSpans } from '@/utils/observability';

onMounted(() => {
  startResourceMonitor({
    getControllerCount: () => activeControllers.size,
    getDomListenerCount: () => domListeners.length,
    getPlayerCount: () => (videoPlayer?.isOpen?.value ? 1 : 0) + (dualCamera?.showDualCameras?.value ? 2 : 0)
  });
});

onBeforeUnmount(() => {
  stopResourceMonitor();
  cleanupAll('unmount');
});
```

### Spans Integrados

| Operação | Span | Arquivo |
|----------|------|---------|
| Busca de eventos | `obsSpans.eventsFetch` | devices.internal.vue |
| Limpeza de recursos | `obsSpans.cleanup` | devices.internal.vue |
| Abertura de câmera | `obsSpans.cameraOpen` | useDeviceVideoPlayer.js |

---

## 📊 Métricas Recomendadas para Dashboard

Se integrar com APM/Grafana:

1. **device_load_duration_p95** - Percentil 95 do tempo de load
2. **camera_open_success_rate** - Taxa de sucesso de abertura de câmera
3. **cleanup_duration_avg** - Tempo médio de cleanup
4. **active_resources_max** - Máximo de recursos ativos por sessão
5. **threshold_violations_count** - Quantas vezes thresholds foram excedidos
