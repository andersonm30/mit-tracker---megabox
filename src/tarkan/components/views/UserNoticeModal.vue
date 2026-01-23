<template>
  <el-dialog
    v-model="show"
    :title="noticeData.title || KT('notice.title') || 'Aviso'"
    :close-on-click-modal="noticeData.canClose"
    :close-on-press-escape="noticeData.canClose"
    :show-close="noticeData.canClose"
    width="500px"
    class="user-notice-dialog">
    
    <div class="notice-content">
      <p>{{ noticeData.description }}</p>
    </div>
    
    <template #footer v-if="noticeData.canClose">
      <el-button type="primary" @click="markAsSeen" :loading="isSaving">
        {{ KT('notice.understood') || 'Entendi' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, defineExpose } from 'vue';
import { useStore } from 'vuex';
import { ElDialog, ElButton, ElMessage } from 'element-plus';
import 'element-plus/es/components/dialog/style/css';
import 'element-plus/es/components/button/style/css';
import 'element-plus/es/components/message/style/css';
import KT from '@/tarkan/func/kt';

const store = useStore();
const show = ref(false);
const isSaving = ref(false);

// Dados do aviso vindos de store.state.auth.attributes
const noticeData = computed(() => {
  const attrs = store.state.auth?.attributes || {};
  return {
    enabled: attrs['tarkan.msg.habilitado'] === 'true',
    title: attrs['tarkan.msg.titulo'] || '',
    description: attrs['tarkan.msg.descricao'] || '',
    canClose: attrs['tarkan.msg.acesso'] === 'true',
    frequency: attrs['tarkan.msg.frequencia'] || 'sempre',
    lastSeenAt: attrs['tarkan.msg.lastSeenAt'] || '0',
    seenOnce: attrs['tarkan.msg.seenOnce'] === 'true'
  };
});

// Lógica de "deve mostrar agora?" (CORRIGIDA: diário por toDateString)
const shouldShowNotice = () => {
  if (!noticeData.value.enabled) return false;
  
  const now = Date.now();
  const lastSeen = parseInt(noticeData.value.lastSeenAt) || 0;
  
  switch (noticeData.value.frequency) {
    case 'unica':
      return !noticeData.value.seenOnce;
    
    case 'hora':
      // Máximo 1x por hora (3600000ms)
      return (now - lastSeen) > 3600000;
    
    case 'diario':
      // CORRETO: Compara dia do calendário (não 24h)
      if (lastSeen === 0) return true;
      const lastSeenDate = new Date(lastSeen).toDateString();
      const nowDate = new Date(now).toDateString();
      return lastSeenDate !== nowDate;
    
    case 'sempre':
      return true;
    
    default:
      return false;
  }
};

// Função para registrar "visto" no backend (CORRETA: usa window.$traccar.axios)
const markAsSeen = async () => {
  isSaving.value = true;
  
  try {
    const payload = {
      lastSeenAt: String(Date.now()),
      seenOnce: 'true'
    };
    
    // ✅ CORRETO: Usa window.$traccar.axios (padrão do projeto)
    await window.$traccar.axios.post('/api/users/notice/seen', payload);
    
    // ✅ CORRETO: Atualiza via mutation oficial (não mutação direta)
    store.commit('updateAuthAttributes', {
      'tarkan.msg.lastSeenAt': payload.lastSeenAt,
      'tarkan.msg.seenOnce': payload.seenOnce
    });
    
    show.value = false;
    
  } catch (err) {
    console.error('[UserNoticeModal] Erro ao marcar como visto:', err);
    ElMessage.error(KT('error.generic') || 'Erro ao processar aviso');
  } finally {
    isSaving.value = false;
  }
};

// Auto-registrar quando canClose=false (bloqueia só na primeira do período)
const autoMarkAsSeen = async () => {
  if (noticeData.value.canClose) return; // Só auto-marca se não pode fechar
  
  try {
    const payload = {
      lastSeenAt: String(Date.now()),
      seenOnce: noticeData.value.frequency === 'unica' ? 'true' : 'false'
    };
    
    await window.$traccar.axios.post('/api/users/notice/seen', payload);
    
    store.commit('updateAuthAttributes', {
      'tarkan.msg.lastSeenAt': payload.lastSeenAt,
      'tarkan.msg.seenOnce': payload.seenOnce
    });
    
  } catch (err) {
    console.error('[UserNoticeModal] Erro ao auto-registrar:', err);
  }
};

// Método exposto para App.vue
defineExpose({
  showNotice: (forceShow = false) => {
    if (forceShow || shouldShowNotice()) {
      show.value = true;
      
      // Se não pode fechar, auto-registra para liberar no resto do período
      if (!noticeData.value.canClose) {
        autoMarkAsSeen();
      }
    }
  }
});
</script>

<style scoped>
.user-notice-dialog .notice-content {
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  font-size: 14px;
  padding: 10px 0;
}

.user-notice-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid var(--el-border-color);
  padding: 16px 20px;
}

.user-notice-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.user-notice-dialog :deep(.el-dialog__footer) {
  border-top: 1px solid var(--el-border-color);
  padding: 16px 20px;
}
</style>
