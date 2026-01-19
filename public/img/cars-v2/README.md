# Ícones V2 - Pasta de Novos Ícones

## 📁 Como Adicionar Ícones

### Passo 1: Renomear os Arquivos

Renomeie seus ícones seguindo o padrão:

```
v2_icon1_base.png
v2_icon1_color1.png   (opcional - se tiver camada colorível)

v2_icon2_base.png
v2_icon2_color1.png

v2_icon3_base.png
...até...
v2_icon20_base.png
```

### Passo 2: Copiar para Esta Pasta

Copie os arquivos renomeados para:
```
K:\projeto\Versao-tarkan-Jesse\front-end\public\img\cars-v2\
```

### Passo 3: Pronto!

Os ícones aparecerão automaticamente na aba "Ícones V2" quando editar um dispositivo.

## 🎨 Tipos de Arquivos

- **_base.png**: Imagem base (sempre necessária)
- **_color1.png**: Camada que será colorida (opcional)
- **_color2.png**: Segunda camada colorível (opcional)

## ⚡ Comando Rápido (PowerShell)

Se seus arquivos já estiverem com nomes corretos:
```powershell
Copy-Item K:\wox\device_icons\v2_icon*_*.png K:\projeto\Versao-tarkan-Jesse\front-end\public\img\cars-v2\
```

## 💡 Dica

**O cliente escolhe visualmente pela imagem**, então o nome genérico (v2_icon1, v2_icon2, etc.) não importa. O importante é que a imagem apareça corretamente!

## 📝 Tem mais de 20 ícones?

Edite o arquivo `src/tarkan/components/views/edit-device.vue` e adicione mais entradas no array `availableCarsV2`.

