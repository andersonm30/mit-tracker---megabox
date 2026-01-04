# SPLIT_COMPONENTS_PLAN.md - Plano de Extração de Subcomponentes

Este documento acompanha a refatoração do `devices.internal.vue` em subcomponentes menores.

---

## 📊 Status Atual

### Componentes Já Extraídos (Fase Anterior)

| Componente | Descrição | Linhas Aprox. |
|------------|-----------|---------------|
| DeviceHeaderActions.vue | Botões de ação do header | ~150 |
| DeviceResumeIcons.vue | Ícones de status resumido | ~80 |
| DeviceMainInfo.vue | Informações principais do device | ~100 |
| DeviceLastPosition.vue | Última posição + share | ~120 |
| DeviceDriverCard.vue | Card do motorista atual | ~150 |
| DeviceOdometerHours.vue | Odômetro e horas motor | ~180 |
| DeviceDualCamera.vue | Dual camera view | ~200 |
| DeviceEventsHistory.vue | Lista de eventos recentes | ~120 |
| DeviceHistoryBar.vue | Barra de histórico | ~100 |
| DeviceAttributes.vue | Lista de atributos/favoritos | ~150 |

**Total já extraído:** ~1350 linhas

---

### Componentes a Extrair (Esta Fase)

| # | Componente | Descrição | Prioridade | Status |
|---|------------|-----------|------------|--------|
| 1 | DeviceFuelTemperature.vue | Seção combustível e temperatura | Alta | ✅ Concluído |
| 2 | DeviceDriverModal.vue | Modal de detalhes do motorista | Alta | ✅ Concluído |
| 3 | DeviceSpeedInfo.vue | Velocidade e RPM | Média | 🔲 Pendente |
| 4 | DevicePlateModel.vue | Placa e modelo do veículo | Média | 🔲 Pendente |

---

## 🏗️ O Que Fica no Parent (devices.internal.vue)

### Orquestração (NÃO MOVER)
- ✅ Store/Router access
- ✅ Composables (useDeviceVideoPlayer, useDualCamera)
- ✅ cleanupAll + registries (timers, controllers, listeners)
- ✅ Watchers consolidados
- ✅ State principal (device, position, refs)

### Lógica de Negócio
- ✅ Computed properties principais
- ✅ Permissões e guards
- ✅ Notificações (notifySuccess, notifyError, etc.)
- ✅ Integração Traccar (safeTraccarCall)

---

## ✅ Checklist "Sem Mudanças Visuais"

Após cada extração, verificar:

- [ ] `npm run verify:hardening` passa
- [ ] `npm run test:e2e` smoke tests passam
- [ ] `npm run build` sem warnings novos
- [ ] Visual idêntico (comparar screenshots se necessário)
- [ ] Fluxo de usuário idêntico

---

## 📁 Estrutura de Arquivos

```
src/
├── templates/
│   ├── devices.internal.vue          # Parent orquestrador
│   └── device-components/
│       ├── index.js                   # Exports
│       ├── DeviceHeaderActions.vue    # ✅ Existente
│       ├── DeviceResumeIcons.vue      # ✅ Existente
│       ├── DeviceMainInfo.vue         # ✅ Existente
│       ├── DeviceLastPosition.vue     # ✅ Existente
│       ├── DeviceDriverCard.vue       # ✅ Existente
│       ├── DeviceOdometerHours.vue    # ✅ Existente
│       ├── DeviceDualCamera.vue       # ✅ Existente
│       ├── DeviceEventsHistory.vue    # ✅ Existente
│       ├── DeviceHistoryBar.vue       # ✅ Existente
│       ├── DeviceAttributes.vue       # ✅ Existente
│       ├── DeviceFuelTemperature.vue  # ✅ Concluído
│       ├── DeviceDriverModal.vue      # ✅ Concluído
│       ├── DeviceSpeedInfo.vue        # 🔲 A criar
│       └── DevicePlateModel.vue       # 🔲 A criar
```

---

## 🔄 Processo de Extração

Para cada componente:

1. **Identificar** - Localizar seção no template
2. **Criar** - Novo arquivo .vue com props/emits
3. **Mover** - Template + CSS relacionado
4. **Conectar** - Props/emits no parent
5. **Testar** - verify-hardening + smoke tests
6. **Commit** - Mensagem clara

---

## 📋 Regras Técnicas

### Props
```javascript
// ✅ Correto - tipagem e defaults
defineProps({
  position: { type: Object, default: null },
  device: { type: Object, required: true }
})

// ❌ Evitar - acesso direto ao store
import { useStore } from 'vuex'
const store = useStore() // NÃO fazer nos subcomponentes
```

### Emits
```javascript
// ✅ Correto - emits explícitos
defineEmits(['update', 'close', 'action'])

// Parent escuta e executa a ação
@update="handleUpdate"
```

### Traduções
```javascript
// ✅ Correto - inject KT
const KT = inject('KT')

// ❌ Evitar - import direto
```

---

## 🎯 Próximos Passos

1. Extrair DeviceFuelTemperature.vue
2. Extrair DeviceDriverModal.vue  
3. Extrair DeviceSpeedInfo.vue
4. Extrair DevicePlateModel.vue
5. Consolidar CSS
6. Documentar props de cada componente
