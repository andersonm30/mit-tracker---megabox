<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="mode === 'create' ? 'Novo Motorista' : 'Editar Motorista'"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="!submitting"
    @open="onOpen"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="Nome" prop="name">
        <el-input
          v-model="form.name"
          placeholder="Nome completo do motorista"
          :disabled="submitting"
          clearable
        />
      </el-form-item>

      <el-form-item label="Identificador Único" prop="uniqueId">
        <el-input
          v-model="form.uniqueId"
          placeholder="CPF, RG ou RFID"
          :disabled="submitting"
          clearable
        />
      </el-form-item>

      <!-- Upload de foto (somente em modo edit) -->
      <el-form-item v-if="mode === 'edit' && props.driver" label="Foto">
        <driver-photo-upload
          :driver-id="props.driver.id"
          :current-photo-url="currentPhotoUrl"
          @uploaded="onPhotoUploaded"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose" :disabled="submitting">
        Cancelar
      </el-button>
      <el-button
        type="primary"
        @click="handleSubmit"
        :loading="submitting"
      >
        {{ mode === 'create' ? 'Cadastrar' : 'Salvar' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import DriverPhotoUpload from './driver-photo-upload.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'edit'].includes(value)
  },
  driver: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const store = useStore();
const formRef = ref(null);
const submitting = ref(false);

const form = ref({
  name: '',
  uniqueId: ''
});

// URL da foto atual com cache busting
const currentPhotoUrl = computed(() => {
  if (!props.driver?.id) return '';
  return store.getters['drivers/getDriverImageUrl'](props.driver.id);
});

const rules = {
  name: [
    { required: true, message: 'Nome é obrigatório', trigger: 'blur' },
    { min: 3, message: 'Nome deve ter no mínimo 3 caracteres', trigger: 'blur' }
  ],
  uniqueId: [
    { required: true, message: 'Identificador único é obrigatório', trigger: 'blur' },
    { min: 3, message: 'Identificador deve ter no mínimo 3 caracteres', trigger: 'blur' }
  ]
};

// Preencher form quando modal abrir
function onOpen() {
  if (props.mode === 'edit' && props.driver) {
    form.value = {
      name: props.driver.name || '',
      uniqueId: props.driver.uniqueId || ''
    };
  } else {
    form.value = {
      name: '',
      uniqueId: ''
    };
  }
  
  // Limpar validação anterior
  if (formRef.value) {
    formRef.value.clearValidate();
  }
}

// Watch para resetar form se props mudar enquanto modal aberto
watch(() => props.driver, () => {
  if (props.modelValue) {
    onOpen();
  }
});

async function handleSubmit() {
  if (!formRef.value) return;

  try {
    // Validar formulário
    const valid = await formRef.value.validate();
    if (!valid) return;

    submitting.value = true;

    // Montar payload
    const payload = {
      name: form.value.name.trim(),
      uniqueId: form.value.uniqueId.trim(),
      attributes: props.driver?.attributes || {}
    };

    // Se edit, incluir id
    if (props.mode === 'edit' && props.driver) {
      payload.id = props.driver.id;
    }

    // Salvar via store
    const savedDriver = await store.dispatch('drivers/save', payload);

    // Recarregar lista para garantir consistência
    await store.dispatch('drivers/load');

    // Sucesso
    ElMessage.success({
      message: props.mode === 'create' 
        ? 'Motorista cadastrado com sucesso' 
        : 'Motorista atualizado com sucesso',
      duration: 2000
    });

    // Emitir evento e fechar
    emit('saved', savedDriver);
    emit('update:modelValue', false);

  } catch (error) {
    console.error('[DriverFormModal] Erro ao salvar:', error);
    ElMessage.error({
      message: error.message || 'Erro ao salvar motorista',
      duration: 3000
    });
  } finally {
    submitting.value = false;
  }
}

function handleClose() {
  if (submitting.value) return;
  emit('update:modelValue', false);
}

// Handler para quando foto for enviada
function onPhotoUploaded() {
  // Atualizar timestamp no store para cache busting
  if (props.driver?.id) {
    store.commit('drivers/setImageUpdateTimestamp', { 
      driverId: props.driver.id 
    });
  }
}
</script>

<style scoped>
.el-form {
  padding-top: 10px;
}
</style>
