# ✅ MIGRAÇÃO CSS GLOBAL - CHECKLIST DE VALIDAÇÃO

## Status da Implementação

### 1. CSS Global ✅ COMPLETO
- **Arquivo**: `src/assets/css/kore-map.poppers.css` 
- **Status**: Criado e completo (254 linhas)
- **Conteúdo**:
  - Tema Light (`.kore-map-popper`)
  - Tema Dark (`.kore-map-popper--dark`)
  - z-index: 99999
  - Arrow matching background
  - Switch blindado (16px altura)
  - Hover mantém texto preto
  - Responsive mobile

### 2. Import no main.js ✅ COMPLETO
- **Linha 29**: `import "@/assets/css/kore-map.poppers.css";`
- **Ordem**: Após `element-plus/theme-chalk/index.css` (correto!)

### 3. kore-map.vue Limpo ✅ COMPLETO
- **Linha 3392-4572**: Apenas `<style scoped>` (layout/controles)
- **Linha 4574-4579**: Comentário indicando migração
- **Sem** `<style>` global
- **Sem** `:deep()` no CSS scoped

### 4. Componentes usando classes ✅ COMPLETO
- **Linha 29**: `popper-class="kore-map-popper"`
- **Linha 155**: `popper-class="kore-map-popper"`
- **kore-map-dark.vue**: Usa `kore-map-popper kore-map-popper--dark`

## 🧪 Testes de Validação (5 minutos)

### Teste 1: Dropdown de Camadas (👁️)
```
1. Ctrl + Shift + R (hard reload)
2. Abrir dropdown "👁️ Camadas"
3. F12 → Inspect no menu dropdown
4. Verificar:
   ✅ Classe: kore-map-popper (ou kore-map-popper--dark)
   ✅ z-index: 99999 (no computed styles)
   ✅ background: rgba(228, 226, 226, 0.923)
   ✅ Texto: preto (#000000)
   ✅ Hover: background #f5f5f5 + texto continua preto
   ✅ Arrow: mesma cor do fundo
   ✅ Switch: 16px altura, alinhado
```

### Teste 2: Dropdown de Bibliotecas (📚)
```
1. Abrir dropdown "📚 Bibliotecas"
2. F12 → Inspect
3. Verificar:
   ✅ Mesmas regras do Teste 1
   ✅ Ícones: cor primary (azul)
   ✅ Input: fundo branco, borda primary
```

### Teste 3: Mobile (Portrait)
```
1. F12 → Toggle device toolbar
2. Selecionar iPhone ou similar (portrait)
3. Abrir dropdowns
4. Verificar:
   ✅ max-width: 90vw
   ✅ max-height: 70vh
   ✅ Font-size reduzido (10px)
   ✅ Padding reduzido
   ✅ Não estoura da tela
```

### Teste 4: Tema Dark (se aplicável)
```
1. Abrir kore-map-dark.vue
2. Abrir dropdowns
3. F12 → Inspect
4. Verificar:
   ✅ Classe: kore-map-popper--dark
   ✅ background: rgba(0, 0, 0, 0.85)
   ✅ backdrop-filter: blur(8px)
   ✅ Texto: branco (#ffffff)
   ✅ Hover: rgba(255, 255, 255, 0.1)
```

### Teste 5: Playback Premium (bônus)
```
1. Carregar uma rota com curvas
2. Dar play
3. Observar:
   ✅ Curvas arredondadas (Bezier)
   ✅ Rotação suave (sem glitch 359°→0°)
   ✅ Sem jump no primeiro tick
   ✅ Stop cancela animação
```

## 🐛 Sintomas Conhecidos e Patches

### Sintoma 1: "Hover clareia o texto"
**Patch**: Verificar se `.kore-map-popper .el-dropdown-menu__item:hover *` tem `color: #000000 !important;`

### Sintoma 2: "Arrow fica branca"
**Patch**: Verificar `.kore-map-popper .el-popper__arrow::before` tem `background: rgba(228, 226, 226, 0.923) !important;`

### Sintoma 3: "Switch desalinha"
**Patch**: Verificar altura 16px e left calc(100% - 13.5px) no is-checked

### Sintoma 4: "z-index não funciona"
**Patch**: Verificar ordem de import no main.js (após element-plus)

### Sintoma 5: "Mobile estoura"
**Patch**: Media query portrait precisa ter !important nos max-width/height

## 📋 Checklist Final

- [x] CSS global sem `:deep()`
- [x] Import no main.js após Element Plus
- [x] kore-map.vue sem `<style>` global
- [x] Lint passou (0 erros)
- [ ] **TESTE MANUAL**: Abrir dropdowns e verificar visualmente
- [ ] **TESTE MANUAL**: Testar mobile
- [ ] **TESTE MANUAL**: Testar hover mantém texto preto

## 🎯 Próximos Passos

Se tudo funcionar:
1. Commit: "feat(css): migrar CSS de poppers para arquivo global"
2. Continuar com outras features

Se algo quebrar:
1. Identificar sintoma específico
2. Aplicar patch cirúrgico do item "Sintomas Conhecidos"
3. Não reverter tudo, apenas ajustar o CSS global

## 📝 Notas Técnicas

- **Por que não :deep()?** CSS global não precisa de :deep(), e usar causa erro de parsing
- **Por que !important?** Element Plus inline styles têm especificidade alta
- **Por que 99999?** Garante que fica acima de modals/overlays (padrão é ~2000-3000)
- **Por que 3 seletores?** Element Plus pode aplicar a classe no container OU no menu
