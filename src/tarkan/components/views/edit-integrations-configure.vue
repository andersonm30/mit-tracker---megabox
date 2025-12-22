<template>
  <!-- edit-integrations-configure: Placeholder component -->
  <el-dialog v-model="show" title="Configurar Integração">
    <div>Configuração de integração</div>
  </el-dialog>
</template>

<script setup>
import { ref, defineExpose } from 'vue'
import { ElDialog } from 'element-plus'
import 'element-plus/es/components/dialog/style/css'

const show = ref(false)

const configureIntegration = (integration) => {
  console.log('configure integration:', integration)
  show.value = true
}

defineExpose({ configureIntegration })
</script>
