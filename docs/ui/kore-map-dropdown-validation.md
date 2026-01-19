# Validação de Dropdowns do Kore Map

> **Última atualização:** 2026-01-13  
> **Tempo estimado:** 30 segundos

## Contexto Técnico

Os dropdowns do `kore-map.vue` usam Element Plus, que **teleporta** o conteúdo para o `<body>`.  
Por isso, estilos em `<style scoped>` **não funcionam** — precisam estar em CSS global.

**Arquivo de estilos:** `src/assets/css/kore-map.poppers.css`  
**Classe namespace:** `kore-map-popper`

---

## Checklist de Validação (GO/NO-GO)

### Passo 1: Preparação
1. Abra o terminal e rode `npm run dev` (se não estiver rodando)
2. No browser, faça `Ctrl+Shift+R` (hard reload)
3. Navegue até o mapa principal

### Passo 2: Testar os Dropdowns

Teste **ambos** os dropdowns da barra lateral:

| Dropdown | Ícone | Localização | Conteúdo |
|----------|-------|-------------|----------|
| **Visibilidade** | 👁️ `fa-eye` | Barra lateral direita | Switches de camadas, clusters, geofences |
| **Camadas** | 📚 `fa-layer-group` | Barra lateral direita | Lista de mapas (satélite, ruas, etc) |

### Passo 3: Inspecionar no DevTools

1. Clique no dropdown 👁️
2. Pressione `F12` → Inspecione o menu aberto
3. Verifique na aba **Elements** se aparece a classe `kore-map-popper`
4. Repita para o dropdown 📚

### Passo 4: Verificar Estilos Computados

Na aba **Computed** do DevTools, confirme:

| Propriedade | Valor Esperado | ✓ |
|-------------|----------------|---|
| `z-index` | `99999` | ☐ |
| `background` | `rgba(228, 226, 226, 0.923)` | ☐ |
| `color` (item normal) | `rgb(0, 0, 0)` | ☐ |
| `color` (item :hover) | `rgb(0, 0, 0)` | ☐ |
| `arrow` background | Igual ao fundo | ☐ |
| `switch` tamanho | Consistente (16x34) | ☐ |

---

## Resultado

- ✅ **GO**: Todos os checks passaram → Entrega validada
- ❌ **NO-GO**: Algum falhou → Reportar sintoma

---

## Sintomas Conhecidos e Patches

Se algo falhar, identifique o sintoma:

| # | Sintoma | Causa Provável | Arquivo de Patch |
|---|---------|----------------|------------------|
| 1 | Dropdown atrás do mapa | z-index baixo | `kore-map.poppers.css` |
| 2 | Hover clareia/some texto | color herdado | `kore-map.poppers.css` |
| 3 | Arrow fica branca | border-color errado | `kore-map.poppers.css` |
| 4 | Switch desalinha | dimensões inconsistentes | `kore-map.poppers.css` |
| 5 | Mobile quebra | falta media query | `kore-map.poppers.css` |

---

## Referência Técnica

### Localização dos Dropdowns no Template

**Arquivo:** `src/tarkan/components/kore-map.vue`

```
Linha 28-152:  Dropdown 👁️ (Visibilidade)
               └─ popper-class="kore-map-popper"
               
Linha 155-172: Dropdown 📚 (Camadas/Mapas)
               └─ popper-class="kore-map-popper"
```

### Regra de Ouro

> ⚠️ **NUNCA** colocar CSS de popper em `<style scoped>`.  
> Poppers são teleportados para `<body>` e perdem o escopo.  
> Manter **SEMPRE** em `kore-map.poppers.css`.

---

## Histórico

| Data | Ação | Responsável |
|------|------|-------------|
| 2026-01-13 | Migração de CSS para arquivo global | — |
| 2026-01-13 | Criação deste documento | — |
