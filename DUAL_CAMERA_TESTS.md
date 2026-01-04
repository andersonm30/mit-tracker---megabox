# Testes Manuais - Dual Camera Refactor

## Checklist de Testes para useDualCamera Composable

### 1. Ativação Básica
- [ ] Clicar no botão de câmeras duais
- [ ] Verificar se `showDualCameras` muda para `true`
- [ ] Verificar se os containers (left/right) são exibidos
- [ ] Verificar se as mensagens iniciais aparecem ("Selecione uma câmera")

### 2. Seleção de Câmeras
- [ ] Clicar em "Selecionar Câmeras"
- [ ] Verificar se `cameraSelected` muda para `true`
- [ ] Verificar se os comandos RTMP são enviados (console)
  - [ ] Left = IN (canal 1 ou 2 dependendo do protocolo)
  - [ ] Right = OUT (canal 0 ou 1 dependendo do protocolo)
- [ ] Verificar notificação de "Câmera ativada"

### 3. Polling Independente
- [ ] Verificar polling left no console (tentativas 1/20, 2/20...)
- [ ] Verificar polling right no console (tentativas 1/20, 2/20...)
- [ ] Verificar mensagens de status atualizando nos containers
- [ ] Aguardar até stream disponível ou timeout (MAX_POLL_ATTEMPTS = 20)

### 4. Reprodução de Vídeo
- [ ] Verificar se player left inicializa quando stream disponível
- [ ] Verificar se player right inicializa quando stream disponível
- [ ] Verificar se ambos reproduzem simultaneamente
- [ ] Verificar controles de volume/fullscreen funcionando

### 5. Fechar Dual Camera
- [ ] Clicar no botão de câmeras duais novamente
- [ ] Verificar se `showDualCameras` muda para `false`
- [ ] Verificar se `cleanupDualCameraResources()` é chamado
- [ ] Verificar se players são disposed (console)
- [ ] Verificar se intervals de polling são cleared
- [ ] Verificar se containers voltam ao estado inicial (loader + texto)

### 6. Trocar de Device
- [ ] Ativar dual camera em um dispositivo
- [ ] Navegar para outro dispositivo
- [ ] Verificar se cleanup automático é executado no `onBeforeUnmount`
- [ ] Verificar se não há leaks de memória (players/intervals)
- [ ] Abrir dual camera no novo dispositivo
- [ ] Verificar se funciona normalmente

### 7. Reabrir Após Fechar
- [ ] Ativar dual camera
- [ ] Fechar dual camera
- [ ] Reabrir dual camera
- [ ] Verificar se estado é resetado corretamente
- [ ] Verificar se mensagens voltam ao padrão
- [ ] Verificar se `cameraSelected` volta para `false`
- [ ] Selecionar câmeras novamente
- [ ] Verificar se funciona corretamente

### 8. Protocolo JIMIJC2XX
- [ ] Testar com dispositivo protocolo `jimijc2xx`
- [ ] Verificar se comando `START_LIVEJTT` é enviado
- [ ] Verificar se channels são mapeados corretamente:
  - [ ] IN = channel 2
  - [ ] OUT = channel 1

### 9. Protocolo Padrão (RTMP)
- [ ] Testar com dispositivo sem protocolo `jimijc2xx`
- [ ] Verificar se comando `custom` com `RTMP,ON,{channel}#,0` é enviado
- [ ] Verificar se channels são mapeados corretamente:
  - [ ] IN = channel IN
  - [ ] OUT = channel OUT

### 10. Tratamento de Erros
- [ ] Testar sem `window.$traccar` disponível (simular)
- [ ] Testar sem `uniqueId` no dispositivo
- [ ] Verificar se notificações de erro aparecem
- [ ] Verificar se mensagens de erro são exibidas nos containers
- [ ] Verificar se polling para após MAX_POLL_ATTEMPTS

### 11. Console Debug
Verificar no console:
- [ ] Logs de inicialização do polling
- [ ] Logs de tentativas (1/20, 2/20...)
- [ ] Logs de stream disponível
- [ ] Logs de player inicializado
- [ ] Logs de cleanup (dispose, clearInterval)

### 12. Verificação de Cleanup Completo
Após fechar dual camera, verificar se:
- [ ] `leftVideoPlayer = null`
- [ ] `rightVideoPlayer = null`
- [ ] `leftVideoInterval = null`
- [ ] `rightVideoInterval = null`
- [ ] `cameraSelected.value = false`
- [ ] `leftCameraMessage.value` resetado
- [ ] `rightCameraMessage.value` resetado
- [ ] Containers limpos e com fallback HTML

### 13. Verificação Visual
- [ ] Containers posicionados corretamente (lado a lado)
- [ ] Spinners de loading visíveis durante polling
- [ ] Mensagens de status visíveis e legíveis
- [ ] Vídeos ocupam 100% do container
- [ ] Controles de player acessíveis e funcionais

### 14. Performance
- [ ] Não há memory leaks (verificar Chrome DevTools Memory)
- [ ] Intervalos são limpos corretamente (verificar no Performance tab)
- [ ] VideoJS dispose é chamado (verificar console)
- [ ] Não há warnings de listeners não removidos

## Cenários de Teste Completos

### Cenário 1: Fluxo Feliz
1. Abrir device detail
2. Ativar dual camera
3. Selecionar câmeras
4. Aguardar streams
5. Reproduzir ambos vídeos
6. Fechar dual camera
7. ✅ Verificar cleanup completo

### Cenário 2: Trocar Device Durante Polling
1. Abrir device detail
2. Ativar dual camera
3. Selecionar câmeras
4. Durante polling, navegar para outro device
5. ✅ Verificar cleanup automático
6. ✅ Verificar que não há erros no console

### Cenário 3: Abrir/Fechar Múltiplas Vezes
1. Abrir device detail
2. Ativar dual camera → Fechar → Abrir → Fechar (3x)
3. ✅ Verificar que funciona corretamente todas as vezes
4. ✅ Verificar que não há leaks de memória acumulados

### Cenário 4: Timeout de Polling
1. Abrir device detail de dispositivo offline
2. Ativar dual camera
3. Selecionar câmeras
4. Aguardar 20 tentativas (60 segundos)
5. ✅ Verificar notificação de erro
6. ✅ Verificar mensagem de timeout nos containers
7. ✅ Verificar que intervals são cleared

## Checklist de Código

### Arquivos Modificados
- [x] `/src/composables/useDualCamera.js` - Criado
- [x] `/src/composables/useDeviceVideoPlayer.js` - Exporta `loadVideoJS` e `checkVideoAvailability`
- [x] `/src/templates/devices.internal.vue` - Integração com composable

### Comportamento Preservado
- [x] Left SEMPRE = IN
- [x] Right SEMPRE = OUT
- [x] Polling independente com 3s interval
- [x] Máximo 20 tentativas por canal
- [x] Timeout de 15s para carregar vídeo
- [x] Dispose garantido dos players
- [x] ClearInterval garantido dos pollings
- [x] Reset de mensagens e estado

### API Pública do Composable
```javascript
const {
  // State (reactive)
  showDualCameras,
  cameraSelected,
  leftCameraMessage,
  rightCameraMessage,
  
  // Methods
  toggleDual,
  selectCamera,
  loadLeftCamera,
  loadRightCamera,
  cleanupDualCameraResources,
} = useDualCamera({ store, KT, notify, loadVideoJS, checkVideoAvailability })
```

## Notas

- **loadVideoJS** e **checkVideoAvailability** são reutilizados de `useDeviceVideoPlayer`
- **Polling** é independente para cada câmera (left/right)
- **Cleanup** é executado em 3 momentos:
  1. Ao fechar dual camera (toggle)
  2. Ao trocar de device (onBeforeUnmount)
  3. Manualmente via `cleanupDualCameraResources()`
- **Template** não foi modificado (exceto binding de @select-camera)
- **Zero mudanças de comportamento** - apenas organização de código

## Resultado Esperado

✅ Dual camera funciona exatamente como antes
✅ Código mais organizado e reutilizável
✅ Sem memory leaks
✅ Cleanup garantido em todos os cenários
