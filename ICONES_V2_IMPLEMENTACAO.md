# 🎨 Atualização de Ícones - Sistema de Abas V2

## ✅ Mudanças Implementadas

### 1. **Redução do Tamanho dos Ícones** 
- ✅ Ícones reduzidos de 80px para 50px de altura
- ✅ Melhor aproveitamento do espaço na tela
- ✅ Arquivo modificado: `src/tarkan/components/views/dv-car.vue`

### 2. **Sistema de Abas para Ícones**
- ✅ Criado sistema com 2 abas: "Ícones Padrão" e "Ícones V2"
- ✅ Permite separar os ícones originais dos novos ícones solicitados pelos clientes
- ✅ Arquivo modificado: `src/tarkan/components/views/edit-device.vue`

### 3. **Suporte para Ícones V2**
- ✅ Criada pasta `public/img/cars-v2/` para os novos ícones
- ✅ Componente `dv-car.vue` atualizado para carregar de ambas as pastas
- ✅ Array `availableCarsV2` criado para gerenciar os novos ícones

### 4. **Traduções Adicionadas**
- ✅ Traduções PT-BR adicionadas para todos os ícones
- ✅ Arquivo atualizado: `src/lang/pt-BR.js`

---

## 📋 Próximos Passos - AÇÃO NECESSÁRIA

### 🔴 PASSO 1: Copiar os Ícones V2

Você mencionou que os novos ícones estão em `K:\wox\device_icons`. Agora você precisa:

**Opção A - Via PowerShell:**
```powershell
# Abra o PowerShell e execute:
Copy-Item K:\wox\device_icons\*.png K:\projeto\Versao-tarkan-Jesse\front-end\public\img\cars-v2\
```

**Opção B - Manualmente:**
1. Navegue até `K:\wox\device_icons`
2. Copie todos os arquivos `.png`
3. Cole em `K:\projeto\Versao-tarkan-Jesse\front-end\public\img\cars-v2\`

### 🔴 PASSO 2: Padronizar Nomenclatura dos Arquivos

Os arquivos devem seguir este padrão:
```
nome_do_icone_base.png      → Imagem base (obrigatório)
nome_do_icone_color1.png    → Cor primária (opcional)
nome_do_icone_color2.png    → Cor secundária (opcional)
```

**Exemplo:**
```
v2_car1_base.png
v2_car1_color1.png
v2_truck1_base.png
v2_truck1_color1.png
```

### 🔴 PASSO 3: Atualizar Lista de Ícones V2

Após copiar e renomear os arquivos, edite o arquivo:
`src/tarkan/components/views/edit-device.vue`

Localize o array `availableCarsV2` (linha ~978) e adicione os seus ícones:

```javascript
const availableCarsV2 = ref([
  // Exemplo - ajuste conforme seus arquivos:
  {key: 'v2_sedan', img: 'v2_sedan', color1: true, color2: false},
  {key: 'v2_suv', img: 'v2_suv', color1: true, color2: false},
  {key: 'v2_caminhonete', img: 'v2_caminhonete', color1: true, color2: false},
  {key: 'v2_van', img: 'v2_van', color1: true, color2: false},
  // Adicione mais conforme necessário
]);
```

### 🔴 PASSO 4: Adicionar Traduções (Opcional)

Se quiser nomes amigáveis para os ícones, edite:
`src/lang/pt-BR.js`

Localize a seção `map.devices` (linha ~863) e adicione:

```javascript
devices: {
  // ... ícones existentes ...
  v2_sedan: 'Sedan Moderno',
  v2_suv: 'SUV',
  v2_caminhonete: 'Caminhonete',
  v2_van: 'Van Executiva',
}
```

---

## 📊 Estrutura Atual

```
public/
└── img/
    ├── cars/           ← Ícones Padrão (não mexer)
    │   ├── car_base.png
    │   ├── car_color1.png
    │   └── ...
    └── cars-v2/        ← NOVOS Ícones V2 (adicionar aqui)
        ├── README.md
        └── [seus arquivos .png]
```

---

## 🎯 Como os Clientes Irão Usar

1. Cliente edita um dispositivo
2. Vai até a seção "Seleccione o Veículo"
3. Verá duas abas:
   - **Ícones Padrão**: Ícones originais do sistema
   - **Ícones V2**: Novos ícones personalizados
4. Seleciona o ícone desejado
5. Pode customizar cores usando os sliders

---

## ❓ Dúvidas Frequentes

**P: Os ícones V2 precisam ter as mesmas camadas dos padrão?**
R: Não necessariamente. Você pode ter apenas `_base.png` sem camadas de cor.

**P: Posso usar ícones coloridos?**
R: Sim! Se o ícone já for colorido, use apenas `_base.png` e defina `color1: false`.

**P: Como faço para remover um ícone V2?**
R: Remova a entrada do array `availableCarsV2` e delete os arquivos da pasta.

---

## ✉️ Próxima Ação

**Me informe:**
1. Quantos ícones você tem em `K:\wox\device_icons`?
2. Qual o nome dos arquivos?
3. Eles já seguem o padrão `nome_base.png`, `nome_color1.png`?

Assim posso te ajudar a configurar corretamente!
