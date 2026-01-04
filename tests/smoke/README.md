# Smoke Tests - Device Internal

Testes automatizados para validar o cleanup de recursos do componente `devices.internal.vue`.

## 📋 Pré-requisitos

1. **Node.js** instalado (v16+)
2. **Dev server** rodando:
   ```bash
   npm run serve
   ```
3. **Playwright browsers** instalados:
   ```bash
   npx playwright install chromium
   ```

## 🚀 Como Rodar

### Executar todos os testes
```bash
npm run test:e2e
```

### Executar com UI interativa (debug)
```bash
npm run test:e2e:ui
```

### Executar teste específico
```bash
npx playwright test -g "troca rápida"
```

### Ver relatório HTML após execução
```bash
npx playwright show-report
```

## 🧪 O Que Cada Teste Garante

### Teste A: `troca rápida 10x sem TypeError`
- **Objetivo**: Validar que trocas rápidas de device não causam erros
- **Fluxo**: Clica em 10 devices diferentes com 200ms entre cada
- **Garante**: 
  - Nenhum `TypeError` no console
  - Nenhum `Cannot read properties of null/undefined`
  - UI final está estável (device name visível)

### Teste B: `route-leave mata tudo`
- **Objetivo**: Validar que `cleanupAll('route-leave')` cancela todos os recursos
- **Fluxo**: Entra em device → Navega para outra rota → Monitora requests
- **Garante**:
  - Requests de polling param após sair
  - Nenhum request repetindo indefinidamente
  - Nenhum erro no console

### Teste C: `camera open/close + trocar device não vaza`
- **Objetivo**: Validar cleanup de recursos de câmera
- **Fluxo**: Abre câmera → Fecha → Troca device
- **Garante**:
  - Stream de vídeo é limpo corretamente
  - Polling de câmera para ao fechar
  - Troca de device não causa erro

### Teste D: `dual camera toggle on/off + trocar device`
- **Objetivo**: Validar toggle rápido de câmera dual
- **Fluxo**: Toggle ON → OFF → ON → Troca device imediatamente
- **Garante**:
  - Recursos são limpos a cada toggle
  - Troca abrupta não causa memory leak
  - UI permanece estável

### Teste E: `navegação back/forward não quebra`
- **Objetivo**: Validar cleanup com navegação do browser
- **Fluxo**: Device 0 → Device 1 → Back → Forward
- **Garante**:
  - History navigation funciona
  - Cleanup é chamado corretamente
  - UI permanece estável

### Teste STRESS: `20 trocas consecutivas`
- **Objetivo**: Validar ausência de memory leak em uso prolongado
- **Fluxo**: 20 trocas de device com verificações periódicas
- **Garante**:
  - Heap não cresce indefinidamente
  - Nenhum erro acumulado

## 🎯 Data-testid Utilizados

| Seletor | Componente | Descrição |
|---------|------------|-----------|
| `data-testid="device-detail"` | devices.internal.vue | Container principal do detalhe |
| `data-testid="device-name"` | devices.internal.vue | Nome do device no header |
| `data-testid="dual-camera-toggle"` | devices.internal.vue | Botão toggle dual camera |
| `data-testid="dual-camera-container"` | DeviceDualCamera | Container das câmeras |
| `data-testid-type="device-item"` | devices.item.vue | Item na visualização cards |
| `data-testid-type="device-list-item"` | devices.vue | Item na visualização lista |

## ⚙️ Configuração

O arquivo `playwright.config.js` está configurado com:

- **baseURL**: `http://localhost:8080` (ajustar se necessário)
- **trace**: Ligado em falha (para debug)
- **screenshots**: Capturados em falha
- **timeout**: 60s por teste

### Ajustar porta do dev server

Se o dev server roda em outra porta (ex: 8083):

```bash
# Via variável de ambiente
BASE_URL=http://localhost:8083 npm run test:e2e
```

Ou edite `playwright.config.js`:
```js
baseURL: 'http://localhost:8083',
```

## 🐛 Troubleshooting

### Testes pulando por "Nenhum device encontrado"
- Verifique se há devices cadastrados no sistema
- Verifique se o usuário está autenticado

### Testes pulando por "Nenhum device com câmera"
- Teste C e D requerem devices com protocolo de câmera
- Se não houver, os testes serão pulados automaticamente

### Erros de timeout
- Aumente os timeouts em `playwright.config.js`
- Verifique se o dev server está respondendo

## 📊 Integração com CI/CD

Adicione ao seu workflow:

```yaml
- name: Run E2E Tests
  run: |
    npm run serve &
    sleep 10
    npm run test:e2e
```

Ou use o webServer do Playwright (descomentar em `playwright.config.js`):
```js
webServer: {
  command: 'npm run serve',
  url: 'http://localhost:8080',
  reuseExistingServer: !process.env.CI,
},
```
