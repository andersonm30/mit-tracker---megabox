<template>
  <el-dialog
    v-model="show"
    :close-on-click-modal="canClose"
    :close-on-press-escape="canClose"
    :show-close="canClose"
    :lock-scroll="true"
    :modal="true"
    width="90%"
    custom-class="user-notice-modal"
    :show-header="false"
    align-center
  >
    <div class="notice-header">
      <i class="fas fa-exclamation-circle notice-icon"></i>
      <h2 class="notice-title">{{ noticeTitle }}</h2>
    </div>

    <div class="notice-content">
      <p class="notice-description" v-html="noticeDescriptionWithLinks"></p>
    </div>

    <template #footer v-if="canClose">
      <div class="notice-footer">
        <el-button type="primary" size="large" @click="closeNotice" style="width: 100%;">
          <i class="fas fa-check"></i> Entendi
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch, defineExpose } from 'vue';
import { useStore } from 'vuex';
import { ElDialog, ElButton } from 'element-plus';
import 'element-plus/es/components/dialog/style/css';
import 'element-plus/es/components/button/style/css';

const store = useStore();
const show = ref(false);

const noticeTitle = computed(() => {
  return store.state.auth?.attributes?.['tarkan.msg.titulo'] || 'Aviso';
});

const noticeDescription = computed(() => {
  return store.state.auth?.attributes?.['tarkan.msg.descricao'] || '';
});

const noticeDescriptionWithLinks = computed(() => {
  const text = noticeDescription.value;
  if (!text) return '';

  // Escapa HTML para evitar XSS
  const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  const escapedText = escapeHtml(text);

  // Regex para detectar URLs
  const urlRegex = /(https?:\/\/[^\s<]+)|(wa\.me\/[^\s<]+)/gi;

  // Transforma URLs em links clicáveis
  const linkedText = escapedText.replace(urlRegex, (url) => {
    // Se não começa com http, adiciona https://
    const href = url.startsWith('http') ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: var(--el-color-primary); text-decoration: underline; font-weight: 500;">${url}</a>`;
  });

  return linkedText;
});

const canClose = computed(() => {
  return store.state.auth?.attributes?.['tarkan.msg.acesso'] === 'true';
});

const isNoticeEnabled = computed(() => {
  return store.state.auth?.attributes?.['tarkan.msg.habilitado'] === 'true';
});

const noticeFrequency = computed(() => {
  return store.state.auth?.attributes?.['tarkan.msg.frequencia'] || 'sempre';
});

const shouldShowNotice = () => {
  if (!store.state.auth?.id || !isNoticeEnabled.value || noticeDescription.value.trim() === '') {
    return false;
  }

  const userId = store.state.auth.id;
  const frequency = noticeFrequency.value;

  switch (frequency) {
    case 'unica': {
      // Exibe apenas uma vez (permanente)
      const uniqueShown = localStorage.getItem('userNoticeShown_unique_' + userId);
      return !uniqueShown;
    }

    case 'hora': {
      // Exibe uma vez por hora
      const hourlyData = localStorage.getItem('userNoticeShown_hourly_' + userId);
      if (!hourlyData) return true;

      const savedTime = new Date(hourlyData);
      const now = new Date();
      const hoursDiff = (now - savedTime) / (1000 * 60 * 60); // Diferença em horas
      return hoursDiff >= 1;
    }

    case 'diario': {
      // Exibe uma vez por dia
      const dailyData = localStorage.getItem('userNoticeShown_daily_' + userId);
      if (!dailyData) return true;

      const savedDate = new Date(dailyData).toDateString();
      const today = new Date().toDateString();
      return savedDate !== today;
    }

    case 'sempre':
    default:
      // Sempre exibe, nunca marca como visto
      return true;
  }
};

const checkAndShowNotice = () => {
  if (shouldShowNotice()) {
    setTimeout(() => {
      show.value = true;
    }, 500);
  }
};

const closeNotice = () => {
  show.value = false;

  if (!store.state.auth?.id) return;

  const userId = store.state.auth.id;
  const frequency = noticeFrequency.value;

  // Marca como visualizado de acordo com a frequência
  switch (frequency) {
    case 'unica':
      // Marca permanentemente
      localStorage.setItem('userNoticeShown_unique_' + userId, 'true');
      break;

    case 'hora':
      // Salva o timestamp atual
      localStorage.setItem('userNoticeShown_hourly_' + userId, new Date().toISOString());
      break;

    case 'diario':
      // Salva a data atual
      localStorage.setItem('userNoticeShown_daily_' + userId, new Date().toISOString());
      break;

    case 'sempre':
    default:
      // Não marca nada, sempre exibe
      break;
  }
};

// Observa mudanças no estado de autenticação
watch(() => store.state.auth?.id, (newVal) => {
  if (newVal) {
    checkAndShowNotice();
  }
});

onMounted(() => {
  checkAndShowNotice();
});

defineExpose({
  checkAndShowNotice
});
</script>

<style scoped>
.user-notice-modal {
  font-family: 'Trebuchet MS', Arial, sans-serif;
}

.notice-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 20px 15px 20px;
  border-bottom: 2px solid var(--el-color-primary-light-5);
}

.notice-icon {
  font-size: 28px;
  color: var(--el-color-primary);
  margin-right: 12px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.notice-title {
  margin: 0;
  font-size: 25px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  word-break: normal;
  overflow-wrap: break-word;
  hyphens: none;
}

.notice-content {
  padding: 25px 20px;
  text-align: center;
}

.notice-description {
  margin: 0;
  font-size: 17px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: normal;
  overflow-wrap: break-word;
  hyphens: none;
}

.notice-footer {
  padding: 25px 20px 20px 20px;
  border-top: 1px solid var(--el-border-color-light);
}

/* Responsividade Mobile */
@media (max-width: 768px) {
  .notice-header {
    padding: 15px 15px 12px 15px;
  }

  .notice-icon {
    font-size: 24px;
    margin-right: 10px;
  }

  .notice-title {
    font-size: 19px;
  }

  .notice-content {
    padding: 20px 15px;
  }

  .notice-description {
    font-size: 16px;
    line-height: 1.6;
  }

  .notice-footer {
    padding: 22px 15px 15px 15px;
  }
}

@media (max-width: 480px) {
  .notice-icon {
    font-size: 24px;
    margin-right: 10px;
  }

  .notice-description {
    font-size: 16px;
  }
}
</style>

<style>
/* Estilos globais para o modal */
.user-notice-modal {
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  max-width: 650px !important;
  padding: 20px;
}

.user-notice-modal .el-dialog__header {
  padding: 0 !important;
}

.user-notice-modal .el-dialog__body {
  padding: 0 !important;
}

.user-notice-modal .el-dialog__footer {
  padding: 0 !important;
}

.user-notice-modal .el-dialog__headerbtn {
  top: 25px;
  right: 25px;
  font-size: 20px;
}

.user-notice-modal .el-dialog__headerbtn:hover .el-dialog__close {
  color: var(--el-color-primary);
}

@media (max-width: 768px) {
  .user-notice-modal {
    margin-top: 22vh !important;
    margin-bottom: 20px !important;
    margin-left: auto !important;
    margin-right: auto !important;
    max-width: 95% !important;
    padding: 15px;
  }

  .user-notice-modal .el-dialog__headerbtn {
    top: 20px;
    right: 20px;
    font-size: 18px;
  }
}
</style>
