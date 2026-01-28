# QA SMOKE TEST
## MIT.app - Roteiro de Testes Manuais Rápidos

**Data:** 27/01/2026  
**Versão:** 1.0.0  
**Tempo estimado:** 10-15 minutos

---

## 🎯 Objetivo
Validar rapidamente as principais funcionalidades após o rebrand e correções de bugs.

---

## 📋 Pré-requisitos
- [ ] Projeto compilado sem erros (`npm run build` ou `npm run serve`)
- [ ] Backend rodando (API disponível)
- [ ] Credenciais de teste (admin e usuário comum)

---

## 🧪 Testes

### 1. Login e Branding
| # | Passo | Resultado Esperado | ✓/✗ |
|---|-------|-------------------|-----|
| 1.1 | Abrir página de login | Página carrega sem erros | |
| 1.2 | Verificar logo | Logo aparece corretamente | |
| 1.3 | Verificar rodapé | Texto menciona "MIT.app" (se habilitado) | |
| 1.4 | Verificar título da aba | Deve ser "MIT.app" ou similar | |
| 1.5 | Alternar dark mode | Botão funciona, tema muda | |
| 1.6 | Login com credenciais válidas | Redireciona para /home | |

### 2. Menu do Usuário (Bug #1 - Crítico)
| # | Passo | Resultado Esperado | ✓/✗ |
|---|-------|-------------------|-----|
| 2.1 | Clicar no ícone de usuário | Menu suspenso abre | |
| 2.2 | Clicar em "Minha Conta" | Modal de edição de usuário abre | |
| 2.3 | Fechar modal, abrir menu novamente | Menu abre normalmente | |
| 2.4 | Clicar em "Usuários" (se admin) | Modal de gerenciamento de usuários abre | |
| 2.5 | Repetir teste 2.4 10x rapidamente | Modal deve abrir TODAS as vezes | |
| 2.6 | Clicar em "Motoristas" | Modal de motoristas abre | |
| 2.7 | Clicar em "Servidor" (se admin) | Modal de configuração do servidor abre | |
| 2.8 | Clicar em "Notificações" | Modal de notificações abre | |
| 2.9 | Clicar em "Calendários" | Modal de calendários abre | |
| 2.10 | Clicar em "Manutenção" | Modal de manutenção abre | |

**Critério de aceite:** Todos os modais devem abrir em ≤2 segundos, sem falhas.

### 3. Street View (Bug #2 - Crítico)
| # | Passo | Resultado Esperado | ✓/✗ |
|---|-------|-------------------|-----|
| 3.1 | Login no sistema | Street View NÃO aparece | |
| 3.2 | Navegar pelo mapa | Street View NÃO aparece automaticamente | |
| 3.3 | Selecionar um dispositivo | Street View NÃO aparece automaticamente | |
| 3.4 | Ativar Street View (se houver botão) | Street View aparece | |
| 3.5 | Fechar Street View | Street View desaparece | |
| 3.6 | Fazer logout | Logout funciona | |
| 3.7 | Login novamente | Street View NÃO está ativo (foi resetado) | |

**Critério de aceite:** Street View só aparece quando explicitamente ativado.

### 4. Navegação Principal
| # | Passo | Resultado Esperado | ✓/✗ |
|---|-------|-------------------|-----|
| 4.1 | Clicar em "Dispositivos" no menu | Lista de dispositivos aparece | |
| 4.2 | Clicar em "Relatórios" no menu | Página de relatórios abre | |
| 4.3 | Clicar em "Geocerca" no menu | Página de geocercas abre | |
| 4.4 | Clicar em "Comandos" no menu | Página de comandos abre | |
| 4.5 | Clicar em "Grupos" no menu | Página de grupos abre | |
| 4.6 | Clicar em "Notificações" no menu | Página de notificações abre | |

### 5. Mapa e Dispositivos
| # | Passo | Resultado Esperado | ✓/✗ |
|---|-------|-------------------|-----|
| 5.1 | Visualizar mapa | Mapa carrega com marcadores | |
| 5.2 | Clicar em um dispositivo na lista | Painel de detalhes abre | |
| 5.3 | Clicar em um marcador no mapa | Popup ou painel abre | |
| 5.4 | Verificar imagem do dispositivo | Imagem carrega ou fallback aparece | |
| 5.5 | Verificar imagem do motorista (se houver) | Imagem carrega ou fallback aparece | |

### 6. Logout e Sessão
| # | Passo | Resultado Esperado | ✓/✗ |
|---|-------|-------------------|-----|
| 6.1 | Clicar em "Sair" no menu do usuário | Logout realizado | |
| 6.2 | Verificar redirecionamento | Voltou para página de login | |
| 6.3 | Tentar acessar /home diretamente | Redireciona para login | |

### 7. Responsividade (Mobile)
| # | Passo | Resultado Esperado | ✓/✗ |
|---|-------|-------------------|-----|
| 7.1 | Redimensionar janela para mobile | Layout se adapta | |
| 7.2 | Menu hambúrguer aparece | Botão de menu visível | |
| 7.3 | Clicar no menu hambúrguer | Menu lateral abre | |
| 7.4 | Navegar pelo menu mobile | Navegação funciona | |

---

## 🔍 Verificações Adicionais

### Console do Navegador
- [ ] Não há erros JavaScript críticos (vermelho)
- [ ] Não há warnings relacionados a "tarkan" em paths de UI
- [ ] Network tab: requests para assets carregam (200 OK)

### Busca por "tarkan" na UI
- [ ] Título da página não contém "tarkan"
- [ ] Nenhum texto visível menciona "tarkan"
- [ ] Alt text de imagens não menciona "tarkan"
- [ ] Rodapé não menciona "tarkan" (se visível)

---

## 📊 Resultado Final

| Categoria | Passou | Falhou | Total |
|-----------|--------|--------|-------|
| Login e Branding | | | 6 |
| Menu do Usuário | | | 10 |
| Street View | | | 7 |
| Navegação | | | 6 |
| Mapa e Dispositivos | | | 5 |
| Logout | | | 3 |
| Responsividade | | | 4 |
| **TOTAL** | | | **41** |

---

## 📝 Observações

_Espaço para anotações durante o teste:_

```
Data do teste: ___/___/______
Testador: _________________
Ambiente: [ ] Dev [ ] Staging [ ] Prod
Browser: _________________
Versão: _________________

Bugs encontrados:
1. 
2. 
3. 

Comentários:


```

---

## ✅ Critérios de Aprovação

- **Crítico:** Testes 2.x (Menu) e 3.x (Street View) devem passar 100%
- **Alto:** Testes 1.x (Login) e 6.x (Logout) devem passar 100%
- **Médio:** Testes 4.x e 5.x devem passar ≥90%
- **Baixo:** Testes 7.x (Mobile) podem ter issues conhecidas

---

*Documento gerado automaticamente pela implementação de QA MIT.app*
