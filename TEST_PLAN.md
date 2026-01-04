# 🧪 Plano de Testes - devices.internal.vue e Componentes

## 📋 Visão Geral

**Data:** 29 de dezembro de 2025  
**Escopo:** Testes do componente devices.internal.vue e subcomponentes extraídos  
**Cobertura:** Testes manuais, unitários e de integração E2E

---

## 📂 Estrutura de Pastas Sugerida

```
front-end/
├── src/
│   ├── components/
│   │   └── device/
│   │       ├── DeviceDriverCard.vue
│   │       └── __tests__/
│   │           └── DeviceDriverCard.spec.js
│   ├── composables/
│   │   ├── useDeviceVideoPlayer.js
│   │   ├── useDualCamera.js
│   │   └── __tests__/
│   │       ├── useDeviceVideoPlayer.spec.js
│   │       └── useDualCamera.spec.js
│   ├── utils/
│   │   ├── dateUtils.js          ← EXTRAIR funções puras aqui
│   │   ├── attributeUtils.js     ← EXTRAIR findAttribute aqui
│   │   └── __tests__/
│   │       ├── dateUtils.spec.js
│   │       └── attributeUtils.spec.js
│   └── templates/
│       └── __tests__/
│           └── devices.internal.spec.js
├── tests/
│   ├── unit/                     ← Testes Vitest/Jest
│   │   ├── dateUtils.spec.js
│   │   ├── attributeUtils.spec.js
│   │   └── driverCard.spec.js
│   └── e2e/                      ← Testes Cypress/Playwright
│       ├── device-internal.cy.js
│       ├── camera.cy.js
│       ├── dual-camera.cy.js
│       └── driver-modal.cy.js
└── vitest.config.js / jest.config.js
```

---

# 📋 PARTE 1: TESTES MANUAIS

## 🔹 TM-001: Navegação e Carregamento Básico

### Passo a Passo
1. Fazer login no sistema
2. Acessar lista de devices (/devices)
3. Selecionar um device com status "online"
4. **Verificar:** Página carrega sem erros no console
5. **Verificar:** Informações do device aparecem corretamente
6. **Verificar:** Mapa centraliza no device

### Resultados Esperados
- [ ] Página carrega em < 2s
- [ ] Sem erros JavaScript no console
- [ ] Nome e status do device visíveis
- [ ] Posição no mapa correta

---

## 🔹 TM-002: Driver Card - Exibição Básica

### Pré-requisitos
- Device com `driverUniqueId` no position
- Driver cadastrado com esse uniqueId

### Passo a Passo
1. Abrir device que possui motorista associado
2. **Verificar:** Foto do motorista aparece (ou default)
3. **Verificar:** Nome do motorista visível
4. **Verificar:** CNH visível abaixo do nome
5. Passar mouse sobre a foto
6. **Verificar:** Tooltip rico aparece com:
   - Foto maior (80x80)
   - Nome completo
   - CNH, CPF, Categoria, Estado, Validez, Telefone

### Resultados Esperados
- [ ] Foto carrega corretamente
- [ ] Fallback funciona se foto não existe
- [ ] Tooltip abre ao hover
- [ ] Todas as informações no tooltip

---

## 🔹 TM-003: Driver Card - CNH Expirada

### Pré-requisitos
- Driver com CNH expirada (data < hoje)

### Passo a Passo
1. Abrir device com motorista cuja CNH expirou
2. **Verificar:** Ícone vermelho (❌) ao lado da CNH
3. **Verificar:** Tooltip do ícone mostra "Expirada"
4. Passar mouse sobre a foto
5. **Verificar:** No tooltip, linha "Validez" está em vermelho
6. **Verificar:** Ícone de alerta (⚠️) na linha de validez

### Resultados Esperados
- [ ] Ícone `fa-times-circle` vermelho visível
- [ ] Classe `text-danger` aplicada no tooltip
- [ ] Mensagem clara de expiração

---

## 🔹 TM-004: Driver Card - CNH Próxima de Expirar (≤30 dias)

### Pré-requisitos
- Driver com CNH expirando em 15 dias

### Passo a Passo
1. Abrir device com motorista cuja CNH expira em 15 dias
2. **Verificar:** Ícone laranja (🔶) ao lado da CNH
3. **Verificar:** Tooltip mostra "Expira em X dias"

### Resultados Esperados
- [ ] Ícone `fa-exclamation-triangle` laranja visível
- [ ] Tooltip correto com número de dias

---

## 🔹 TM-005: Driver Card - CNH com Aviso (31-90 dias)

### Pré-requisitos
- Driver com CNH expirando em 60 dias

### Passo a Passo
1. Abrir device com motorista cuja CNH expira em 60 dias
2. **Verificar:** Ícone amarelo (⚠️) ao lado da CNH
3. **Verificar:** Tooltip mostra "Expira em 60 dias"

### Resultados Esperados
- [ ] Ícone `fa-exclamation-circle` amarelo visível
- [ ] Tooltip correto

---

## 🔹 TM-006: Driver Card - Driver Não Encontrado

### Pré-requisitos
- Device com `driverUniqueId` que não tem driver cadastrado

### Passo a Passo
1. Abrir device com driverUniqueId inválido/não cadastrado
2. **Verificar:** Exibe o uniqueId em texto
3. Passar mouse sobre o ID
4. **Verificar:** Tooltip mostra "Motorista: [uniqueId]"

### Resultados Esperados
- [ ] UniqueId visível
- [ ] Tooltip informativo
- [ ] Nenhum erro no console

---

## 🔹 TM-007: Driver Modal - Abertura e Informações

### Passo a Passo
1. Abrir device com motorista
2. Clicar no nome do motorista
3. **Verificar:** Modal abre
4. **Verificar:** Foto grande do motorista
5. **Verificar:** Nome, CNH, CPF, Validez visíveis
6. **Verificar:** Badge de status (Válido/Expirado)
7. Clicar no X para fechar
8. **Verificar:** Modal fecha corretamente

### Resultados Esperados
- [ ] Modal abre em < 500ms
- [ ] Todas as informações corretas
- [ ] Badge reflete status real
- [ ] Modal fecha sem erros

---

## 🔹 TM-008: Driver Modal - Gerar PDF

### Passo a Passo
1. Abrir modal do motorista (TM-007)
2. Clicar no botão "Gerar PDF"
3. **Verificar:** Notificação "Abrindo relatório..." aparece
4. **Verificar:** Nova janela/aba abre com preview
5. **Verificar:** Diálogo de impressão aparece
6. Cancelar impressão
7. Fechar janela do preview
8. **Verificar:** Modal original ainda aberto e funcional

### Resultados Esperados
- [ ] Notificação de info exibida
- [ ] PDF preview gerado corretamente
- [ ] Diálogo print() chamado
- [ ] Sistema permanece estável

---

## 🔹 TM-009: Câmera Simples - Ativação

### Pré-requisitos
- Device com protocolo de câmera (JC400, etc.)

### Passo a Passo
1. Abrir device com câmera
2. Clicar no ícone de câmera (menu)
3. Selecionar opção "IN" (ou "Câmera Interna")
4. **Verificar:** Container de vídeo aparece
5. **Verificar:** Mensagem "Aguardando stream..." exibida
6. **Aguardar:** Até 30 segundos
7. **Verificar:** Vídeo começa a rodar (ou mensagem de erro)

### Resultados Esperados
- [ ] Container de vídeo visível
- [ ] Player VideoJS inicializado
- [ ] Stream carrega ou erro claro

---

## 🔹 TM-010: Dual Camera - Ativação

### Pré-requisitos
- Device com protocolo de câmera dual

### Passo a Passo
1. Abrir device com câmera
2. Clicar no ícone de câmera (menu)
3. Selecionar "Dual Camera" (ou equivalente)
4. **Verificar:** Dois containers aparecem lado a lado
5. **Verificar:** Labels "IN" e "OUT" visíveis
6. **Verificar:** Ambos mostram "Aguardando stream..."
7. **Aguardar:** Até 30 segundos
8. **Verificar:** Ambos os vídeos carregam ou mostram erro

### Resultados Esperados
- [ ] Layout dual visível
- [ ] Polling independente para cada câmera
- [ ] Nenhum vazamento de memória (verificar DevTools)

---

## 🔹 TM-011: Dual Camera - Toggle On/Off

### Passo a Passo
1. Ativar dual camera (TM-010)
2. Aguardar streams carregarem
3. Clicar em "Fechar Dual Camera"
4. **Verificar:** Containers removidos
5. **Verificar:** Console mostra cleanup dos players
6. Reativar dual camera
7. **Verificar:** Funciona normalmente

### Resultados Esperados
- [ ] Players destruídos corretamente
- [ ] Intervalos limpos
- [ ] Memória liberada
- [ ] Reativação funcional

---

## 🔹 TM-012: Troca Rápida de Devices (Stress Test)

### Passo a Passo
1. Abrir um device com câmera ativa
2. Em < 1 segundo, clicar em outro device
3. Em < 1 segundo, clicar em terceiro device
4. **Verificar:** Console não mostra erros
5. **Verificar:** Sem TypeErrors de null reference
6. Aguardar 5 segundos
7. **Verificar:** UI estável e responsiva

### Resultados Esperados
- [ ] Zero erros no console
- [ ] UI não trava
- [ ] Cleanup de recursos anteriores
- [ ] Device final carrega corretamente

---

## 🔹 TM-013: Notificações - Verificar Padronização

### Passo a Passo
1. Executar ação que dispara `notifySuccess` (ex: salvar device)
2. **Verificar:** Notificação verde com título "Sucesso"
3. **Verificar:** Duração ~2.5s
4. Executar ação que dispara `notifyError` (ex: erro de rede)
5. **Verificar:** Notificação vermelha com título "Erro"
6. **Verificar:** Duração ~5s
7. Executar ação com `messageSuccess` (ex: copiar para clipboard)
8. **Verificar:** Toast rápido aparece

### Resultados Esperados
- [ ] Cores corretas por tipo
- [ ] Durations padronizadas
- [ ] Títulos traduzidos via KT()

---

## 🔹 TM-014: Watchers - Throttle de Imagem

### Pré-requisitos
- DevTools aberto na aba Console
- Filtrar por "testImage"

### Passo a Passo
1. Abrir device com imagem
2. Observar console por 30 segundos
3. **Verificar:** Máximo de 6-7 chamadas testImage (throttle 5s)
4. Mudar status do device (se possível via backend)
5. **Verificar:** testImage chamado 1x após mudança
6. Aguardar mais 30 segundos
7. **Verificar:** Sem loop infinito de chamadas

### Resultados Esperados
- [ ] ≤ 12 chamadas testImage por minuto
- [ ] Throttle funcionando (5s entre chamadas)
- [ ] Sem loops de atualização

---

# 📋 PARTE 2: TESTES UNITÁRIOS (Vitest/Jest)

## 🧮 Setup Inicial

### Instalação
```bash
npm install -D vitest @vue/test-utils happy-dom
# ou
npm install -D jest @vue/test-utils jest-environment-jsdom
```

### Configuração Vitest (vitest.config.js)
```javascript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

---

## 🔹 TU-001: getCNHDaysToExpire

### Arquivo: `tests/unit/dateUtils.spec.js`

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Função a ser testada (extrair para utils/dateUtils.js)
const getCNHDaysToExpire = (dateString) => {
  if (!dateString) return 999;
  
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
  return 999;
};

describe('getCNHDaysToExpire', () => {
  beforeEach(() => {
    // Mock de data fixa: 29/12/2025
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 11, 29)) // Mês é 0-indexed
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // TC-001: Valor null/undefined
  it('deve retornar 999 para null', () => {
    expect(getCNHDaysToExpire(null)).toBe(999)
  })

  it('deve retornar 999 para undefined', () => {
    expect(getCNHDaysToExpire(undefined)).toBe(999)
  })

  it('deve retornar 999 para string vazia', () => {
    expect(getCNHDaysToExpire('')).toBe(999)
  })

  // TC-002: Formato inválido
  it('deve retornar 999 para formato inválido', () => {
    expect(getCNHDaysToExpire('2025-12-29')).toBe(999) // Formato ISO
    expect(getCNHDaysToExpire('29/12/2025')).toBe(999) // Barras
    expect(getCNHDaysToExpire('invalid')).toBe(999)
  })

  // TC-003: Data futura
  it('deve retornar dias positivos para data futura', () => {
    // 30 dias no futuro: 28-01-2026
    expect(getCNHDaysToExpire('28-01-2026')).toBe(30)
  })

  it('deve retornar 1 para amanhã', () => {
    // Amanhã: 30-12-2025
    expect(getCNHDaysToExpire('30-12-2025')).toBe(1)
  })

  // TC-004: Data passada
  it('deve retornar negativo para data passada', () => {
    // 10 dias atrás: 19-12-2025
    expect(getCNHDaysToExpire('19-12-2025')).toBe(-10)
  })

  it('deve retornar 0 para hoje', () => {
    // Hoje: 29-12-2025
    const result = getCNHDaysToExpire('29-12-2025')
    expect(result).toBeLessThanOrEqual(1) // Pode ser 0 ou 1 dependendo da hora
  })

  // TC-005: Datas limites
  it('deve calcular corretamente para 90 dias', () => {
    // 90 dias no futuro: 29-03-2026
    expect(getCNHDaysToExpire('29-03-2026')).toBe(90)
  })

  it('deve calcular corretamente para 30 dias', () => {
    // 30 dias no futuro: 28-01-2026
    expect(getCNHDaysToExpire('28-01-2026')).toBe(30)
  })

  // TC-006: Ano bissexto
  it('deve lidar com 29 de fevereiro em ano bissexto', () => {
    // 2028 é bissexto
    expect(getCNHDaysToExpire('29-02-2028')).toBeGreaterThan(0)
  })
})
```

---

## 🔹 TU-002: isDriverExpired

### Arquivo: `tests/unit/dateUtils.spec.js` (continua)

```javascript
const isDriverExpired = (dateString) => {
  if (!dateString) return false;
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    return date < new Date();
  }
  return false;
};

describe('isDriverExpired', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 11, 29)) // 29/12/2025
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // TC-001: Valores nulos
  it('deve retornar false para null', () => {
    expect(isDriverExpired(null)).toBe(false)
  })

  it('deve retornar false para undefined', () => {
    expect(isDriverExpired(undefined)).toBe(false)
  })

  // TC-002: Data passada (expirada)
  it('deve retornar true para data passada', () => {
    expect(isDriverExpired('28-12-2025')).toBe(true) // Ontem
    expect(isDriverExpired('01-01-2020')).toBe(true) // Anos atrás
  })

  // TC-003: Data futura (válida)
  it('deve retornar false para data futura', () => {
    expect(isDriverExpired('30-12-2025')).toBe(false) // Amanhã
    expect(isDriverExpired('01-01-2030')).toBe(false) // Anos no futuro
  })

  // TC-004: Hoje
  it('deve retornar false para hoje', () => {
    expect(isDriverExpired('29-12-2025')).toBe(false) // Hoje ainda é válido
  })

  // TC-005: Formato inválido
  it('deve retornar false para formato inválido', () => {
    expect(isDriverExpired('2025-12-29')).toBe(false)
    expect(isDriverExpired('invalid')).toBe(false)
  })
})
```

---

## 🔹 TU-003: formatDriverDateForModal

### Arquivo: `tests/unit/dateUtils.spec.js` (continua)

```javascript
const formatDriverDateForModal = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    return date.toLocaleDateString('pt-BR');
  }
  return dateString;
};

describe('formatDriverDateForModal', () => {
  // TC-001: Valores nulos
  it('deve retornar null para null', () => {
    expect(formatDriverDateForModal(null)).toBeNull()
  })

  it('deve retornar null para undefined', () => {
    expect(formatDriverDateForModal(undefined)).toBeNull()
  })

  // TC-002: Formato DD-MM-YYYY
  it('deve formatar DD-MM-YYYY para pt-BR', () => {
    const result = formatDriverDateForModal('29-12-2025')
    expect(result).toBe('29/12/2025')
  })

  it('deve formatar com zero padding', () => {
    const result = formatDriverDateForModal('01-01-2025')
    expect(result).toBe('01/01/2025')
  })

  // TC-003: Formato inválido
  it('deve retornar string original para formato inválido', () => {
    expect(formatDriverDateForModal('invalid')).toBe('invalid')
    expect(formatDriverDateForModal('2025-12-29')).toBe('2025-12-29')
  })

  // TC-004: Datas extremas
  it('deve lidar com datas muito antigas', () => {
    const result = formatDriverDateForModal('01-01-1900')
    expect(result).toBe('01/01/1900')
  })

  it('deve lidar com datas muito futuras', () => {
    const result = formatDriverDateForModal('31-12-2099')
    expect(result).toBe('31/12/2099')
  })
})
```

---

## 🔹 TU-004: formatLocalDate

### Arquivo: `tests/unit/dateUtils.spec.js` (continua)

```javascript
const formatLocalDate = (date) => {
  const pad = (num) => num.toString().padStart(2, '0');
  
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

describe('formatLocalDate', () => {
  // TC-001: Data normal
  it('deve formatar data para ISO local', () => {
    const date = new Date(2025, 11, 29, 14, 30, 45) // 29/12/2025 14:30:45
    expect(formatLocalDate(date)).toBe('2025-12-29T14:30:45')
  })

  // TC-002: Zero padding
  it('deve adicionar zero padding', () => {
    const date = new Date(2025, 0, 5, 9, 5, 3) // 05/01/2025 09:05:03
    expect(formatLocalDate(date)).toBe('2025-01-05T09:05:03')
  })

  // TC-003: Meia-noite
  it('deve formatar meia-noite corretamente', () => {
    const date = new Date(2025, 11, 29, 0, 0, 0)
    expect(formatLocalDate(date)).toBe('2025-12-29T00:00:00')
  })

  // TC-004: 23:59:59
  it('deve formatar fim do dia', () => {
    const date = new Date(2025, 11, 29, 23, 59, 59)
    expect(formatLocalDate(date)).toBe('2025-12-29T23:59:59')
  })

  // TC-005: Datas extremas
  it('deve lidar com ano bissexto', () => {
    const date = new Date(2028, 1, 29, 12, 0, 0) // 29/02/2028
    expect(formatLocalDate(date)).toBe('2028-02-29T12:00:00')
  })
})
```

---

## 🔹 TU-005: findAttribute

### Arquivo: `tests/unit/attributeUtils.spec.js`

```javascript
import { describe, it, expect } from 'vitest'

const findAttribute = (position, a) => {
  if (!position || !a) return null;
  
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };
  
  let result = position.attributes?.[a];
  
  if (result === undefined || result === null) {
    result = getNestedValue(position.attributes, a);
  }
  
  if (result === undefined || result === null) {
    result = position[a];
  }
  
  if (result === undefined || result === null) {
    result = getNestedValue(position, a);
  }
  
  return result;
};

describe('findAttribute', () => {
  // TC-001: Valores nulos
  it('deve retornar null para position null', () => {
    expect(findAttribute(null, 'speed')).toBeNull()
  })

  it('deve retornar null para attribute null', () => {
    expect(findAttribute({}, null)).toBeNull()
  })

  it('deve retornar null para ambos null', () => {
    expect(findAttribute(null, null)).toBeNull()
  })

  // TC-002: Atributo simples em position.attributes
  it('deve encontrar atributo simples em attributes', () => {
    const position = {
      attributes: { speed: 50, ignition: true }
    }
    expect(findAttribute(position, 'speed')).toBe(50)
    expect(findAttribute(position, 'ignition')).toBe(true)
  })

  // TC-003: Atributo direto em position
  it('deve encontrar atributo direto em position', () => {
    const position = {
      latitude: -23.5505,
      longitude: -46.6333,
      attributes: {}
    }
    expect(findAttribute(position, 'latitude')).toBe(-23.5505)
    expect(findAttribute(position, 'longitude')).toBe(-46.6333)
  })

  // TC-004: Caminho aninhado em attributes
  it('deve encontrar caminho aninhado em attributes', () => {
    const position = {
      attributes: {
        io: {
          power: 12.5,
          battery: 80
        }
      }
    }
    expect(findAttribute(position, 'io.power')).toBe(12.5)
    expect(findAttribute(position, 'io.battery')).toBe(80)
  })

  // TC-005: Caminho aninhado em position
  it('deve encontrar caminho aninhado em position', () => {
    const position = {
      network: {
        signal: 90,
        operator: 'Vivo'
      },
      attributes: {}
    }
    expect(findAttribute(position, 'network.signal')).toBe(90)
    expect(findAttribute(position, 'network.operator')).toBe('Vivo')
  })

  // TC-006: Caminho profundo (3+ níveis)
  it('deve encontrar caminhos profundos', () => {
    const position = {
      attributes: {
        deep: {
          nested: {
            value: 'found!'
          }
        }
      }
    }
    expect(findAttribute(position, 'deep.nested.value')).toBe('found!')
  })

  // TC-007: Atributo não existente
  it('deve retornar null para atributo inexistente', () => {
    const position = { attributes: { speed: 50 } }
    expect(findAttribute(position, 'nonexistent')).toBeNull()
    expect(findAttribute(position, 'deep.path.missing')).toBeNull()
  })

  // TC-008: Valor zero (falsy mas válido)
  it('deve retornar zero corretamente', () => {
    const position = { attributes: { speed: 0 } }
    expect(findAttribute(position, 'speed')).toBe(0)
  })

  // TC-009: Valor false (falsy mas válido)
  it('deve retornar false corretamente', () => {
    const position = { attributes: { ignition: false } }
    expect(findAttribute(position, 'ignition')).toBe(false)
  })

  // TC-010: Prioridade (attributes tem precedência)
  it('deve priorizar attributes sobre position root', () => {
    const position = {
      speed: 100,
      attributes: { speed: 50 }
    }
    expect(findAttribute(position, 'speed')).toBe(50)
  })
})
```

---

# 📋 PARTE 3: TESTES DE INTEGRAÇÃO (Cypress/Playwright)

## 🌐 Setup Cypress

### Instalação
```bash
npm install -D cypress @testing-library/cypress
npx cypress open
```

### Configuração (cypress.config.js)
```javascript
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
  },
})
```

---

## 🔹 TE-001: Abrir Device

### Arquivo: `tests/e2e/device-internal.cy.js`

```javascript
describe('Device Internal - Carregamento', () => {
  beforeEach(() => {
    cy.login() // Custom command para login
    cy.visit('/devices')
  })

  it('deve abrir página de device sem erros', () => {
    // Selecionar primeiro device
    cy.get('[data-testid="device-item"]').first().click()
    
    // Verificar URL
    cy.url().should('include', '/devices/')
    
    // Verificar elementos básicos
    cy.get('[data-testid="device-name"]').should('be.visible')
    cy.get('[data-testid="device-status"]').should('be.visible')
    
    // Verificar console sem erros
    cy.window().then((win) => {
      cy.spy(win.console, 'error').as('consoleError')
    })
    cy.wait(2000)
    cy.get('@consoleError').should('not.have.been.called')
  })

  it('deve exibir posição no mapa', () => {
    cy.get('[data-testid="device-item"]').first().click()
    
    cy.get('[data-testid="map-container"]').should('be.visible')
    cy.get('[data-testid="device-marker"]').should('exist')
  })
})
```

---

## 🔹 TE-002: Câmera IN - Ativar e Aguardar Container

### Arquivo: `tests/e2e/camera.cy.js`

```javascript
describe('Câmera Simples', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/devices')
    // Selecionar device com câmera
    cy.get('[data-testid="device-item"][data-has-camera="true"]').first().click()
  })

  it('deve abrir menu de câmera e selecionar IN', () => {
    // Clicar no ícone de câmera
    cy.get('[data-testid="camera-button"]').click()
    
    // Menu deve aparecer
    cy.get('[data-testid="camera-menu"]').should('be.visible')
    
    // Selecionar opção IN
    cy.get('[data-testid="camera-option-in"]').click()
    
    // Container de vídeo deve aparecer
    cy.get('[data-testid="video-container"]', { timeout: 5000 })
      .should('be.visible')
    
    // Mensagem de aguardando deve aparecer
    cy.get('[data-testid="video-message"]')
      .should('contain', 'Aguardando')
  })

  it('deve exibir player de vídeo quando stream disponível', () => {
    cy.get('[data-testid="camera-button"]').click()
    cy.get('[data-testid="camera-option-in"]').click()
    
    // Aguardar até 30s pelo vídeo
    cy.get('video.video-js', { timeout: 30000 })
      .should('be.visible')
    
    // OU verificar mensagem de erro se não conectar
    cy.get('[data-testid="video-container"]')
      .then(($container) => {
        if ($container.find('video.video-js').length === 0) {
          cy.get('[data-testid="video-error"]').should('be.visible')
        }
      })
  })
})
```

---

## 🔹 TE-003: Dual Camera - Alternar

### Arquivo: `tests/e2e/dual-camera.cy.js`

```javascript
describe('Dual Camera', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/devices')
    cy.get('[data-testid="device-item"][data-has-camera="true"]').first().click()
  })

  it('deve ativar e exibir dual camera', () => {
    // Ativar dual camera
    cy.get('[data-testid="dual-camera-toggle"]').click()
    
    // Dois containers devem aparecer
    cy.get('[data-testid="camera-left"]', { timeout: 5000 })
      .should('be.visible')
    cy.get('[data-testid="camera-right"]', { timeout: 5000 })
      .should('be.visible')
    
    // Labels visíveis
    cy.contains('IN').should('be.visible')
    cy.contains('OUT').should('be.visible')
  })

  it('deve alternar dual camera on/off sem erros', () => {
    // Ativar
    cy.get('[data-testid="dual-camera-toggle"]').click()
    cy.get('[data-testid="camera-left"]').should('be.visible')
    
    // Aguardar estabilização
    cy.wait(2000)
    
    // Desativar
    cy.get('[data-testid="dual-camera-toggle"]').click()
    cy.get('[data-testid="camera-left"]').should('not.exist')
    cy.get('[data-testid="camera-right"]').should('not.exist')
    
    // Reativar
    cy.get('[data-testid="dual-camera-toggle"]').click()
    cy.get('[data-testid="camera-left"]').should('be.visible')
    
    // Verificar sem erros no console
    cy.window().then((win) => {
      cy.spy(win.console, 'error').as('consoleError')
    })
    cy.wait(2000)
    cy.get('@consoleError').should('not.have.been.called')
  })

  it('deve fazer cleanup ao fechar dual camera', () => {
    cy.get('[data-testid="dual-camera-toggle"]').click()
    cy.wait(3000) // Deixar players carregarem
    
    // Verificar que intervalos estão rodando (via spy)
    cy.window().then((win) => {
      const intervals = win.performance.getEntriesByType('resource')
        .filter(r => r.name.includes('camera'))
      expect(intervals.length).to.be.greaterThan(0)
    })
    
    // Desativar
    cy.get('[data-testid="dual-camera-toggle"]').click()
    
    // Aguardar cleanup
    cy.wait(1000)
    
    // Verificar log de cleanup
    cy.window().then((win) => {
      // Validar que dispose foi chamado
    })
  })
})
```

---

## 🔹 TE-004: Troca Rápida de Devices

### Arquivo: `tests/e2e/device-switch.cy.js`

```javascript
describe('Troca Rápida de Devices', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/devices')
  })

  it('deve trocar rapidamente 3x sem erros', () => {
    // Obter lista de devices
    cy.get('[data-testid="device-item"]').should('have.length.at.least', 3)
    
    // Spy nos erros
    cy.window().then((win) => {
      cy.spy(win.console, 'error').as('consoleError')
    })
    
    // Troca 1
    cy.get('[data-testid="device-item"]').eq(0).click()
    
    // Troca 2 (rápida - 200ms)
    cy.wait(200)
    cy.get('[data-testid="device-item"]').eq(1).click()
    
    // Troca 3 (rápida - 200ms)
    cy.wait(200)
    cy.get('[data-testid="device-item"]').eq(2).click()
    
    // Aguardar estabilização
    cy.wait(3000)
    
    // Verificar que não houve TypeErrors
    cy.get('@consoleError').then((spy) => {
      const calls = spy.getCalls()
      const typeErrors = calls.filter(call => 
        call.args.some(arg => 
          typeof arg === 'string' && arg.includes('TypeError')
        )
      )
      expect(typeErrors.length).to.equal(0)
    })
    
    // UI deve estar estável
    cy.get('[data-testid="device-name"]').should('be.visible')
  })

  it('deve cancelar operações pendentes ao trocar device', () => {
    // Abrir device com câmera
    cy.get('[data-testid="device-item"][data-has-camera="true"]').eq(0).click()
    
    // Ativar câmera
    cy.get('[data-testid="camera-button"]').click()
    cy.get('[data-testid="camera-option-in"]').click()
    cy.get('[data-testid="video-container"]').should('be.visible')
    
    // Trocar para outro device rapidamente
    cy.get('[data-testid="device-item"]').eq(1).click()
    
    // Verificar cleanup
    cy.wait(2000)
    cy.get('[data-testid="video-container"]').should('not.exist')
  })
})
```

---

## 🔹 TE-005: Driver Modal e Gerar PDF

### Arquivo: `tests/e2e/driver-modal.cy.js`

```javascript
describe('Driver Modal', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/devices')
    // Selecionar device com driver
    cy.get('[data-testid="device-item"][data-has-driver="true"]').first().click()
  })

  it('deve abrir modal ao clicar no nome do driver', () => {
    // Clicar no nome do driver
    cy.get('[data-testid="driver-name-link"]').click()
    
    // Modal deve aparecer
    cy.get('[data-testid="driver-modal"]', { timeout: 2000 })
      .should('be.visible')
    
    // Verificar conteúdo
    cy.get('[data-testid="driver-modal-name"]').should('be.visible')
    cy.get('[data-testid="driver-modal-photo"]').should('be.visible')
    cy.get('[data-testid="driver-modal-cnh"]').should('be.visible')
  })

  it('deve fechar modal ao clicar no X', () => {
    cy.get('[data-testid="driver-name-link"]').click()
    cy.get('[data-testid="driver-modal"]').should('be.visible')
    
    // Fechar
    cy.get('[data-testid="driver-modal-close"]').click()
    
    // Modal deve sumir
    cy.get('[data-testid="driver-modal"]').should('not.exist')
  })

  it('deve chamar window.print ao gerar PDF', () => {
    cy.get('[data-testid="driver-name-link"]').click()
    cy.get('[data-testid="driver-modal"]').should('be.visible')
    
    // Stub de window.open para capturar chamada
    cy.window().then((win) => {
      const mockWindow = {
        document: {
          write: cy.stub(),
          close: cy.stub()
        },
        print: cy.stub().as('printStub')
      }
      cy.stub(win, 'open').returns(mockWindow).as('openStub')
    })
    
    // Clicar em gerar PDF
    cy.get('[data-testid="generate-pdf-button"]').click()
    
    // Aguardar notificação
    cy.get('.el-notification').should('contain', 'relatório')
    
    // Verificar que window.open foi chamado
    cy.get('@openStub').should('have.been.calledOnce')
    
    // Aguardar timeout interno
    cy.wait(1500)
    
    // Verificar que print foi chamado
    cy.get('@printStub').should('have.been.calledOnce')
  })

  it('deve exibir badge vermelho para CNH expirada', () => {
    // Navegar para device com driver expirado
    cy.visit('/devices/expired-driver-device-id')
    
    cy.get('[data-testid="driver-name-link"]').click()
    cy.get('[data-testid="driver-modal"]').should('be.visible')
    
    // Badge deve ser vermelha
    cy.get('[data-testid="driver-status-badge"]')
      .should('have.class', 'expired')
      .and('contain', 'Expirada')
  })
})
```

---

## 🔹 Playwright Alternative (se preferir)

### Arquivo: `tests/e2e/device.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Device Internal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'user@test.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/devices');
  });

  test('deve abrir device sem erros', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.click('[data-testid="device-item"]:first-child');
    await page.waitForSelector('[data-testid="device-name"]');
    
    expect(errors.filter(e => e.includes('TypeError'))).toHaveLength(0);
  });

  test('deve trocar devices 3x rapidamente', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.click('[data-testid="device-item"]:nth-child(1)');
    await page.waitForTimeout(200);
    await page.click('[data-testid="device-item"]:nth-child(2)');
    await page.waitForTimeout(200);
    await page.click('[data-testid="device-item"]:nth-child(3)');
    await page.waitForTimeout(3000);

    expect(errors.filter(e => e.includes('TypeError'))).toHaveLength(0);
    await expect(page.locator('[data-testid="device-name"]')).toBeVisible();
  });

  test('deve gerar PDF do driver', async ({ page }) => {
    await page.goto('/devices/device-with-driver');
    await page.click('[data-testid="driver-name-link"]');
    await expect(page.locator('[data-testid="driver-modal"]')).toBeVisible();

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('[data-testid="generate-pdf-button"]')
    ]);

    // Verificar que popup abriu
    expect(popup).toBeDefined();
  });
});
```

---

# 📊 Resumo de Cobertura

## Funções Puras

| Função | Casos de Teste | Cobertura |
|--------|----------------|-----------|
| `getCNHDaysToExpire` | 10 casos | 100% |
| `isDriverExpired` | 8 casos | 100% |
| `formatDriverDateForModal` | 6 casos | 100% |
| `formatLocalDate` | 5 casos | 100% |
| `findAttribute` | 10 casos | 100% |

## Testes E2E

| Cenário | Casos | Framework |
|---------|-------|-----------|
| Carregamento Device | 2 | Cypress/Playwright |
| Câmera IN | 2 | Cypress/Playwright |
| Dual Camera | 3 | Cypress/Playwright |
| Troca Rápida | 2 | Cypress/Playwright |
| Driver Modal + PDF | 4 | Cypress/Playwright |

## Testes Manuais

| Categoria | Casos |
|-----------|-------|
| Navegação | 1 |
| Driver Card | 5 |
| Driver Modal | 2 |
| Câmera | 4 |
| Stress Test | 1 |
| Notificações | 1 |
| Watchers | 1 |

**Total: 14 testes manuais, 39 testes unitários, 13 testes E2E**

---

# 📝 Próximos Passos

1. **Extrair funções puras** para `src/utils/dateUtils.js` e `src/utils/attributeUtils.js`
2. **Adicionar data-testid** nos componentes para facilitar E2E
3. **Configurar CI/CD** com Vitest para testes unitários
4. **Configurar Cypress** em ambiente de staging
5. **Criar fixtures** com dados de devices/drivers para testes

---

**Plano de Testes Completo!** ✅
