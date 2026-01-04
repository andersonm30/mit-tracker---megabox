# DEBUG_RESOURCES - Instrumentação de Debug

Instrumentação leve para monitorar recursos (timers, controllers, listeners) do componente `devices.internal.vue` em desenvolvimento.

## 🔧 Ativar Debug

### Opção 1: Via localStorage (produção também)
```javascript
localStorage.setItem('DEBUG_RESOURCES', '1');
location.reload(); // Recarregar para aplicar
```

### Opção 2: Automático em DEV
A instrumentação ativa automaticamente quando `import.meta.env.DEV === true`.

### Desativar
```javascript
localStorage.removeItem('DEBUG_RESOURCES');
location.reload();
```

## 📊 API Disponível

Após ativar, acesse via `window.__DEBUG_RESOURCES__`:

### `controllersCount()`
Retorna número de AbortControllers ativos (requests pendentes).

```javascript
window.__DEBUG_RESOURCES__.controllersCount()
// → 3
```

### `timersCount()`
Retorna contagem de timers ativos no registry.

```javascript
window.__DEBUG_RESOURCES__.timersCount()
// → { timeouts: 2, intervals: 1 }
```

### `domListenersCount()`
Retorna número de DOM event listeners registrados.

```javascript
window.__DEBUG_RESOURCES__.domListenersCount()
// → 5
```

### `cleanup(reason)`
Força execução do cleanupAll manualmente (para testes).

```javascript
window.__DEBUG_RESOURCES__.cleanup('test')
// Console: [cleanupAll] reason=manual:test controllers=3 timers=2 listeners=5
```

### `snapshot()`
Retorna JSON completo com todas as métricas e timestamp.

```javascript
window.__DEBUG_RESOURCES__.snapshot()
// → {
//     timestamp: "2025-12-29T22:30:00.000Z",
//     controllers: 3,
//     timeouts: 2,
//     intervals: 1,
//     timersTotal: 3,
//     domListeners: 5,
//     cleanupInProgress: false
//   }
```

## 🧪 Casos de Uso

### Verificar se cleanup está funcionando
```javascript
// Antes de trocar device
console.log('ANTES:', window.__DEBUG_RESOURCES__.snapshot());

// Troque de device na UI

// Depois (deve estar zerado ou próximo)
console.log('DEPOIS:', window.__DEBUG_RESOURCES__.snapshot());
```

### Monitorar em loop
```javascript
// Monitora a cada 2 segundos
setInterval(() => {
  const s = window.__DEBUG_RESOURCES__.snapshot();
  console.table({
    controllers: s.controllers,
    timers: s.timersTotal,
    listeners: s.domListeners
  });
}, 2000);
```

### Detectar memory leak
```javascript
// Troque entre 10 devices e verifique
// Se os números continuam subindo, há leak
const snapshots = [];
setInterval(() => {
  snapshots.push(window.__DEBUG_RESOURCES__.snapshot());
  if (snapshots.length > 10) {
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    if (last.timersTotal > first.timersTotal + 5) {
      console.warn('⚠️ Possível leak de timers detectado!');
    }
  }
}, 5000);
```

### Forçar cleanup manual
```javascript
// Se suspeitar de recursos travados
window.__DEBUG_RESOURCES__.cleanup('force-cleanup');
```

## 📋 Logs no Console

Quando DEBUG_RESOURCES está ativo, o cleanupAll loga métricas:

```
[cleanupAll] reason=device-change controllers=2 timers=3 listeners=4
[cleanupAll] Concluído: device-change | Restante: controllers=0 timers=0 listeners=0
```

Se os números "Restante" não forem zero, há recursos não limpos.

## ⚠️ Importante

- **Não afeta UI/UX** - apenas loga no console
- **Não cria timers/watchers extras** - apenas expõe contagens existentes
- **Seguro em produção** - só ativa com flag explícita
- **Fallback seguro** - try/catch em todos os métodos

## 🏗️ Arquitetura

```
devices.internal.vue
├── activeControllers (Set) ─────→ controllersCount()
├── domListeners (Array) ────────→ domListenersCount()
└── timerRegistry.js
    ├── timeouts (Set) ──────────→ timersCount().timeouts
    └── intervals (Set) ─────────→ timersCount().intervals
```

## 🔗 Relacionados

- [TEST_PLAN.md](TEST_PLAN.md) - Plano de testes
- [tests/smoke/README.md](tests/smoke/README.md) - Smoke tests Playwright
- [timerRegistry.js](src/utils/timerRegistry.js) - Registry de timers
