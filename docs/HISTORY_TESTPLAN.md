# 🧪 HISTORY TESTPLAN - Plano de Testes do Histórico

**Data:** 30/12/2025  
**Versão:** 1.0

---

## 📑 ÍNDICE

1. [Objetivo](#objetivo)
2. [Pré-requisitos](#pré-requisitos)
3. [Testes de Correções (Fase 2)](#testes-de-correções-fase-2)
4. [Testes de Migração (Fase 3)](#testes-de-migração-fase-3)
5. [Testes de Regressão](#testes-de-regressão)
6. [Testes de Performance](#testes-de-performance)
7. [Checklist Rápido](#checklist-rápido)

---

## 🎯 OBJETIVO

Validar que todas as correções e migrações do módulo HISTORY foram implementadas corretamente, sem causar regressões nas funcionalidades existentes.

---

## 📋 PRÉ-REQUISITOS

- [ ] Node.js instalado (v16+)
- [ ] Servidor backend Traccar/Tarkan rodando
- [ ] Dispositivo com histórico de posições (últimas 24h)
- [ ] Chrome DevTools aberto (F12)
- [ ] Console limpo antes de cada teste

```bash
# Iniciar o projeto
npm run serve
```

---

## 🔧 TESTES DE CORREÇÕES (FASE 2)

### TC-001: CORS Dev Server (SockJS)
**Objetivo:** Verificar que hot-reload funciona sem erros CORS

| Passo | Ação | Esperado | Status |
|-------|------|----------|--------|
| 1 | Iniciar `npm run serve` | Sem erros de CORS no console | ⬜ |
| 2 | Modificar qualquer arquivo .vue | Hot-reload automático | ⬜ |
| 3 | Verificar console | Sem `net::ERR_CONNECTION_REFUSED` | ⬜ |
| 4 | Verificar WebSocket | Conexão WS estável | ⬜ |

**Critério de Aceitação:** Zero erros de SockJS no console

---

### TC-002: MarkerCluster Fallback
**Objetivo:** Verificar que MarkerCluster carrega sem erro

| Passo | Ação | Esperado | Status |
|-------|------|----------|--------|
| 1 | Abrir aplicação | Sem erro de MarkerClusterGroup | ⬜ |
| 2 | Abrir mapa com múltiplos dispositivos | Clusters aparecem | ⬜ |
| 3 | Zoom in/out | Clusters expandem/colapsan | ⬜ |
| 4 | Forçar erro (remover L.MarkerClusterGroup) | Fallback funciona | ⬜ |

**Critério de Aceitação:** App funciona com ou sem MarkerCluster

---

### TC-003: Validação Content-Type
**Objetivo:** Verificar que respostas HTML não quebram o app

| Passo | Ação | Esperado | Status |
|-------|------|----------|--------|
| 1 | Fazer login | Sem erro de decode | ⬜ |
| 2 | Carregar lista de dispositivos | JSON válido processado | ⬜ |
| 3 | Simular resposta HTML (desligar backend) | Erro tratado graciosamente | ⬜ |
| 4 | Verificar console | Sem "No decoders for requested formats" | ⬜ |

**Critério de Aceitação:** Nunca exibir erro de decoder

---

### TC-004: Proxy /tarkan/*
**Objetivo:** Verificar que endpoints Tarkan funcionam

| Passo | Ação | Esperado | Status |
|-------|------|----------|--------|
| 1 | Acessar /tarkan/theme | Tema carrega | ⬜ |
| 2 | Acessar /tarkan/shares | Sem erro CORS | ⬜ |
| 3 | Verificar Network tab | Proxy funcionando | ⬜ |

**Critério de Aceitação:** Todos endpoints /tarkan/* acessíveis

---

## 📦 TESTES DE MIGRAÇÃO (FASE 3)

### TC-101: Store Routes Module
**Objetivo:** Verificar que o módulo Vuex routes está funcional

| Passo | Ação | Esperado | Status |
|-------|------|----------|--------|
| 1 | Abrir Vue DevTools | Module `routes` visível | ⬜ |
| 2 | Carregar histórico de dispositivo | State atualizado | ⬜ |
| 3 | Verificar `routePositions` | Dados corretos | ⬜ |
| 4 | Verificar `currentRoute` | Array de pontos | ⬜ |
| 5 | Verificar `routeMeta` | Metadados corretos | ⬜ |

```javascript
// Verificar no console
$store.state.routes.currentRoute.length
$store.getters['routes/hasRoute']
```

**Critério de Aceitação:** Todos getters retornam valores corretos

---

### TC-102: Atributos de Ponto na Timeline
**Objetivo:** Verificar badges de ignição/bloqueio/movimento/energia

| Passo | Ação | Esperado | Status |
|-------|------|----------|--------|
| 1 | Carregar histórico de dispositivo | Timeline aparece | ⬜ |
| 2 | Verificar ponto com ignição ON | Badge verde "Ligado" | ⬜ |
| 3 | Verificar ponto com ignição OFF | Badge vermelho "Desligado" | ⬜ |
| 4 | Verificar ponto com bloqueio | Badge laranja "Bloqueado" | ⬜ |
| 5 | Verificar ponto com movimento | Badge verde "Em movimento" | ⬜ |
| 6 | Verificar ponto parado | Badge azul "Parado" | ⬜ |
| 7 | Verificar ponto com energia externa | Badge verde "Conectado" | ⬜ |

**Critério de Aceitação:** Badges corretos para cada estado

---

### TC-103: Scroll Automático para Ponto Ativo
**Objetivo:** Verificar sincronização scroll com reprodução

| Passo | Ação | Esperado | Status |
|-------|------|----------|--------|
| 1 | Carregar histórico longo (100+ pontos) | Timeline populada | ⬜ |
| 2 | Iniciar reprodução automática | Ponto ativo highlighted | ⬜ |
| 3 | Scroll para início da lista | Manter reprodução | ⬜ |
| 4 | Aguardar próximo ponto | Scroll automático ocorre | ⬜ |
| 5 | Scroll smooth | Sem saltos bruscos | ⬜ |

**Critério de Aceitação:** Timeline segue ponto ativo

---

### TC-104: Estilos Visuais
**Objetivo:** Verificar aparência do ponto ativo

| Passo | Ação | Esperado | Status |
|-------|------|----------|--------|
| 1 | Selecionar ponto na timeline | Background primary-light-9 | ⬜ |
| 2 | Verificar borda esquerda | 3px solid primary | ⬜ |
| 3 | Verificar dot | Animação pulse | ⬜ |
| 4 | Verificar badges | Estilos corretos por tipo | ⬜ |

**Critério de Aceitação:** Visual consistente com design

---

## ⏪ TESTES DE REGRESSÃO

### TC-201: Funcionalidades Existentes
**Objetivo:** Garantir que nada quebrou

| Funcionalidade | Teste | Status |
|----------------|-------|--------|
| Seleção de dispositivo | Dropdown funciona | ⬜ |
| Seleção de período | DatePicker funciona | ⬜ |
| Carregar histórico | Botão Pesquisar funciona | ⬜ |
| Exibir rota no mapa | Polyline aparece | ⬜ |
| Play/Pause | Controles funcionam | ⬜ |
| Velocidade de reprodução | Slider funciona | ⬜ |
| Clique no ponto | Popup aparece | ⬜ |
| Zoom fit | Ajusta viewport | ⬜ |

---

### TC-202: Exportações Existentes
**Objetivo:** Garantir exports funcionam

| Export | Teste | Status |
|--------|-------|--------|
| PDF | Gera arquivo | ⬜ |
| Excel | Gera arquivo | ⬜ |
| CSV | Gera arquivo | ⬜ |

---

## ⚡ TESTES DE PERFORMANCE

### TC-301: Volume de Dados
**Objetivo:** Verificar performance com muitos pontos

| Cenário | Ação | Esperado | Status |
|---------|------|----------|--------|
| 100 pontos | Carregar histórico | < 1s | ⬜ |
| 1000 pontos | Carregar histórico | < 3s | ⬜ |
| 5000 pontos | Carregar histórico | < 10s | ⬜ |
| 10000 pontos | Carregar histórico | < 30s | ⬜ |

---

### TC-302: Memória
**Objetivo:** Verificar uso de memória

| Ação | Métrica | Limite | Status |
|------|---------|--------|--------|
| Carregar 1000 pontos | Heap usado | < 100MB | ⬜ |
| Reproduzir rota | Memória estável | Sem leak | ⬜ |
| Limpar histórico | Memória liberada | Volta ao baseline | ⬜ |

---

## ✅ CHECKLIST RÁPIDO

### Pré-deploy
- [ ] Zero erros no console
- [ ] Zero warnings no console (exceto deprecated)
- [ ] Build produção passa (`npm run build`)
- [ ] Testes unitários passam (`npm test`)

### Funcional
- [ ] Login funciona
- [ ] Mapa carrega
- [ ] Histórico carrega
- [ ] Reprodução funciona
- [ ] Exports funcionam

### Performance
- [ ] App carrega em < 5s
- [ ] Histórico carrega em < 10s
- [ ] Sem memory leaks

---

## 📝 TEMPLATE DE BUG REPORT

```markdown
## Bug Report

**ID:** BUG-XXX
**Teste:** TC-XXX
**Severidade:** [Crítico|Alto|Médio|Baixo]

### Descrição
[Descrição do bug]

### Passos para Reproduzir
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

### Resultado Esperado
[O que deveria acontecer]

### Resultado Atual
[O que aconteceu]

### Evidência
[Screenshot/Console log]

### Ambiente
- Browser: [Chrome/Firefox/Safari]
- Versão: [x.x.x]
- OS: [Windows/Mac/Linux]
```

---

## 📊 RESUMO DE EXECUÇÃO

| Categoria | Total | Passou | Falhou | Bloqueado |
|-----------|-------|--------|--------|-----------|
| Correções (Fase 2) | 4 | - | - | - |
| Migração (Fase 3) | 4 | - | - | - |
| Regressão | 2 | - | - | - |
| Performance | 2 | - | - | - |
| **TOTAL** | **12** | - | - | - |

---

*Documento gerado em 30/12/2025*
