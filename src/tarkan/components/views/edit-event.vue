<template>
  <!-- edit-event: Placeholder component -->
  <el-dialog v-model="show" title="Editar Evento">
    <div>Edição de evento</div>
  </el-dialog>
</template>

<script setup>
import { ref, defineExpose } from 'vue'
import { ElDialog } from 'element-plus'
import 'element-plus/es/components/dialog/style/css'

const show = ref(false)

const newEvent = () => {
  console.log('new event')
  show.value = true
}

const EditEvent = (id) => {
  console.log('edit event:', id)
  show.value = true
}

defineExpose({ newEvent, EditEvent })
</script>
