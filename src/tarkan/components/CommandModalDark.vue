<template>
  <el-dialog
    v-model="isVisible"
    :title="KT('device.custom_command') || 'Comando Personalizado'"
    width="480px"
    :before-close="handleClose"
    custom-class="command-modal-dark"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    destroy-on-close
    top="2vh"
  >
    <div class="modal-content">
      <!-- Device Info -->
      <div class="device-info">
        <div class="device-header">
          <i class="fas fa-microchip"></i>
          <span class="device-name">{{ device?.name }}</span>
          <span class="device-status" :class="device?.status">{{ device?.status }}</span>
        </div>

        <div class="device-details">
          <div class="device-detail-item" v-if="devicePhone">
            <i class="fas fa-mobile-alt"></i>
            <span class="detail-label">Telefone:</span>
            <span class="detail-value">{{ devicePhone }}</span>
          </div>

          <div class="device-detail-item" v-if="deviceImei">
            <i class="fas fa-barcode"></i>
            <span class="detail-label">IMEI:</span>
            <span class="detail-value">{{ deviceImei }}</span>
          </div>
        </div>
      </div>

      <!-- Command Input -->
      <div class="command-section">
        <label class="form-label">{{ KT('device.enter_command') || 'Digite o comando' }}</label>
        <el-input
          v-model="command"
          :placeholder="KT('device.type_command') || 'Digite o comando aqui...'"
          size="large"
          class="command-input"
          @keyup.enter="sendCommand"
        />
      </div>

      <!-- Method Selection -->
      <div class="method-section">
        <label class="form-label">{{ KT('device.transmission_method') || 'Método de Transmissão' }}</label>
        <div class="method-options">
          <div class="method-switch-container">
            <div class="method-option" :class="{ active: selectedMethod === 'gprs' }" @click="selectedMethod = 'gprs'">
              <i class="fas fa-wifi" :class="{ active: selectedMethod === 'gprs' }"></i>
              <span>GPRS</span>
            </div>
            <div class="method-divider"></div>
            <div class="method-option" :class="{ active: selectedMethod === 'sms', disabled: !smsAvailable }" @click="smsAvailable && (selectedMethod = 'sms')">
              <i class="fas fa-sms" :class="{ active: selectedMethod === 'sms' }"></i>
              <span>SMS</span>
              <span v-if="!smsAvailable" class="disabled-reason">(Não configurado)</span>
            </div>
          </div>
        </div>

        <!-- Method Description -->
        <div class="method-description">
          <div v-if="selectedMethod === 'gprs'" class="method-info gprs">
            <i class="fas fa-info-circle"></i>
            <span>{{ KT('device.gprs_description') || 'Comando será enviado via conexão de dados (GPRS/3G/4G)' }}</span>
          </div>
          <div v-if="selectedMethod === 'sms' && smsAvailable" class="method-info sms">
            <i class="fas fa-info-circle"></i>
            <span>{{ KT('device.sms_description') || 'Comando será enviado via SMS (pode ter custo adicional)' }}</span>
          </div>
        </div>
      </div>

      <!-- Response Section -->
      <div v-if="showResponse" class="response-section">
        <div class="response-header">
          <i class="fas fa-reply"></i>
          <span>Resposta do Comando</span>
        </div>
        <div class="response-content">
          <div v-if="responseLoading" class="response-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Aguardando resposta...</span>
          </div>
          <div v-else-if="responseData" class="response-data">
            <div class="response-status" :class="responseData.success ? 'success' : 'error'">
              <i :class="responseData.success ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
              <span>{{ responseData.success ? 'Enviado com sucesso' : 'Erro no envio' }}</span>
            </div>
            <div class="response-details">
              <div class="response-item">
                <strong>Método:</strong> {{ responseData.method }}
              </div>
              <div class="response-item" v-if="responseData.messageId">
                <strong>ID da Mensagem:</strong> {{ responseData.messageId }}
              </div>
              <div class="response-item" v-if="responseData.description">
                <strong>Descrição:</strong> {{ responseData.description }}
              </div>
              <div class="response-item" v-if="responseData.cost">
                <strong>Custo:</strong> R$ {{ responseData.cost }}
              </div>
            </div>
          </div>
        </div>

        <!-- Device Response Notification -->
        <div v-if="deviceResponse && deviceResponse.result" class="device-response-notification">
          <div class="response-status success">
            <i class="fas fa-check-circle"></i>
            <span>Resposta do Dispositivo</span>
          </div>
          <div class="response-details">
            <div class="response-item">
              <strong>Resultado:</strong> {{ deviceResponse.result || 'Sem resultado específico' }}
            </div>
            <div class="response-item" v-if="deviceResponse.detail">
              <strong>Detalhe:</strong> {{ deviceResponse.detail }}
            </div>
            <div class="response-item time-item">
              <strong>Hora:</strong> <span class="time-value">{{ formatResponseTime(deviceResponse.timestamp) }}</span>
            </div>
          </div>
        </div>

        <!-- Info about device responses -->
        <div v-if="!deviceResponse" class="device-response-info">
          <i class="fas fa-info-circle"></i>
          <span>Alguns dispositivos podem não reportar o resultado do comando</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <el-button @click="handleClose" size="large">
          {{ showResponse ? 'Fechar' : KT('Cancel') || 'Cancelar' }}
        </el-button>
        <el-button
          v-if="!showResponse"
          type="primary"
          @click="sendCommand"
          :loading="loading"
          :disabled="!command.trim()"
          size="large"
        >
          <i class="fas fa-paper-plane"></i>
          {{ KT('device.send_command') || 'Enviar Comando' }}
        </el-button>
        <el-button
          v-else
          type="success"
          @click="sendAnother"
          size="large"
        >
          <i class="fas fa-plus"></i>
          Enviar Outro Comando
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { ElDialog, ElInput, ElButton } from 'element-plus'
import KT from '../func/kt'

export default {
  name: 'CommandModalDark',
  components: {
    ElDialog,
    ElInput,
    ElButton
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    device: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit, expose }) {
    const store = useStore()

    // Reactive data
    const command = ref('')
    const selectedMethod = ref('gprs')
    const loading = ref(false)
    const showResponse = ref(false)
    const responseLoading = ref(false)
    const responseData = ref(null)
    const deviceResponse = ref(null)

    // Computed properties
    const isVisible = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val)
    })

    const devicePhone = computed(() => {
      return props.device?.phone || props.device?.attributes?.phone || null
    })

    const deviceImei = computed(() => {
      return props.device?.uniqueId || null
    })

    const smsAvailable = computed(() => {
      const smsApiKey = store.getters['server/getAttribute']('sms_api_key')
      return !!smsApiKey && !!devicePhone.value
    })

    // Listen for device response
    const listenForDeviceResponse = () => {
      if (!props.device?.id) return

      const commandSentTime = new Date().getTime()

      const pollInterval = setInterval(() => {
        if (window.$traccar && props.device?.id) {
          window.$traccar.getReportEvents(
            [props.device.id],
            [],
            new Date(commandSentTime).toISOString(),
            new Date().toISOString(),
            false
          ).then((r) => {
            const newCommandResults = r.data.filter(event => {
              const eventTime = new Date(event.eventTime).getTime()
              return event.type === 'commandResult' && eventTime > commandSentTime
            })

            if (newCommandResults.length > 0) {
              processDeviceEvent(newCommandResults[0])
              clearInterval(pollInterval)
            }
          }).catch(error => {
            console.error('Erro no polling:', error)
          })
        }
      }, 3000)

      // Limpar interval após 2 minutos
      setTimeout(() => {
        clearInterval(pollInterval)
      }, 120000)
    }

    const processDeviceEvent = (event) => {
      if (event.type === 'commandResult' && event.deviceId === props.device?.id) {
        let resultText = null

        if (event.attributes?.result) {
          resultText = event.attributes.result
          if (typeof resultText === 'string') {
            try {
              const parsed = JSON.parse(resultText)
              resultText = parsed.result || parsed || resultText
            } catch (e) {
              // Keep original
            }
          }
        }

        deviceResponse.value = {
          type: 'commandResult',
          message: 'Resposta do dispositivo',
          result: resultText || 'Sem resultado específico',
          detail: `Event ID: ${event.id}`,
          timestamp: new Date(event.eventTime || event.serverTime),
          originalCommand: command.value.trim(),
          eventId: event.id
        }
      }
    }

    // Methods
    const handleClose = () => {
      resetForm()
      isVisible.value = false
    }

    const resetForm = () => {
      command.value = ''
      showResponse.value = false
      responseData.value = null
      responseLoading.value = false
      deviceResponse.value = null
    }

    const sendAnother = () => {
      deviceResponse.value = null
      responseData.value = null
      showResponse.value = false
      responseLoading.value = false
      loading.value = false
      command.value = ''
      selectedMethod.value = 'gprs'
    }

    const sendCommand = async () => {
      if (!command.value.trim() || loading.value) return

      deviceResponse.value = null
      responseData.value = null
      loading.value = true

      try {
        let result

        if (selectedMethod.value === 'sms') {
          result = await sendViaSMS()
        } else {
          result = await sendViaGPRS()
        }

        showResponse.value = true
        responseData.value = result

        if (result.success) {
          listenForDeviceResponse()
        }

      } catch (error) {
        console.error('Erro ao enviar comando:', error)
        showResponse.value = true
        responseData.value = {
          success: false,
          method: selectedMethod.value.toUpperCase(),
          description: error.message || 'Erro ao enviar comando'
        }
      } finally {
        loading.value = false
      }
    }

    const sendViaGPRS = async () => {
      const commandData = {
        id: 0,
        description: "Novo...",
        deviceId: props.device.id,
        type: 'custom',
        textChannel: false,
        attributes: {
          data: command.value.trim()
        }
      }

      await window.$traccar.sendCommand(commandData)

      return {
        success: true,
        method: 'GPRS',
        description: props.device.status !== 'online' 
          ? 'Comando em fila, será executado quando dispositivo estiver online' 
          : 'Comando enviado com sucesso via GPRS'
      }
    }

    const sendViaSMS = async () => {
      const smsApiUrl = store.getters['server/getAttribute']('sms_api_url') || 'https://api.smsdev.com.br/v1/send'
      const smsApiKey = store.getters['server/getAttribute']('sms_api_key')
      const smsApiType = store.getters['server/getAttribute']('sms_api_type') || '9'
      const smsApiRefer = store.getters['server/getAttribute']('sms_api_refer')

      if (!smsApiKey) {
        throw new Error('SMS API Key não configurado')
      }

      if (!devicePhone.value) {
        throw new Error('Dispositivo sem número de telefone')
      }

      let fullUrl = `${smsApiUrl}?key=${smsApiKey}&type=${smsApiType}`

      if (smsApiRefer && smsApiRefer.trim()) {
        fullUrl += `&refer=${smsApiRefer}`
      }

      fullUrl += `&number=${devicePhone.value}&msg=${encodeURIComponent(command.value.trim())}`

      const response = await fetch(fullUrl, { method: 'GET' })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`SMS API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()

      if (result.situacao && result.situacao !== 'OK') {
        throw new Error(`SMS error: ${result.descricao || result.situacao || 'Erro desconhecido'}`)
      }

      if (result.error) {
        throw new Error(`SMS error: ${result.error}`)
      }

      return {
        success: true,
        method: 'SMS',
        messageId: result.id || result.messageId || 'N/A',
        description: result.descricao || result.message || 'SMS enviado com sucesso',
        cost: result.valor || result.cost || null
      }
    }

    const formatResponseTime = (timestamp) => {
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(timestamp)
    }

    // Watchers
    watch(() => props.modelValue, (newVal) => {
      if (newVal) {
        deviceResponse.value = null
        responseData.value = null
        showResponse.value = false
        responseLoading.value = false
        loading.value = false
        command.value = ''
        selectedMethod.value = 'gprs'
      }
    })

    watch(smsAvailable, (available) => {
      if (!available && selectedMethod.value === 'sms') {
        selectedMethod.value = 'gprs'
      }
    })

    expose({
      processDeviceEvent
    })

    return {
      command,
      selectedMethod,
      loading,
      showResponse,
      responseLoading,
      responseData,
      isVisible,
      devicePhone,
      deviceImei,
      smsAvailable,
      deviceResponse,
      handleClose,
      resetForm,
      sendCommand,
      sendAnother,
      formatResponseTime,
      KT
    }
  }
}
</script>

<style scoped>
.command-modal-dark :deep(.el-dialog) {
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.command-modal-dark :deep(.el-dialog__header) {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.2), rgba(37, 99, 235, 0.2));
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 20px;
}

.command-modal-dark :deep(.el-dialog__title) {
  color: #ffffff;
  font-weight: 600;
}

.command-modal-dark :deep(.el-dialog__body) {
  flex: 1;
  padding: 0 20px;
  overflow-y: auto;
  max-height: calc(85vh - 140px);
  min-height: 300px;
  background: #1a1a2e;
}

.command-modal-dark :deep(.el-dialog__footer) {
  background: #1a1a2e;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 20px;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
}

.device-info,
.command-section,
.method-section,
.response-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.device-info {
  border-left: 3px solid #409eff;
}

.device-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.device-header i {
  color: #409eff;
  font-size: 18px;
}

.device-name {
  font-weight: 600;
  font-size: 15px;
  color: #ffffff;
}

.device-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.device-status.online {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.device-status.offline {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
  border: 1px solid rgba(245, 108, 108, 0.3);
}

.device-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.device-detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #909399;
}

.device-detail-item i {
  color: #606266;
  width: 18px;
}

.detail-label {
  font-weight: 500;
  min-width: 70px;
}

.detail-value {
  color: #c0c4cc;
  font-family: 'Courier New', monospace;
}

.form-label {
  font-weight: 600;
  color: #ffffff;
  font-size: 14px;
  margin-bottom: 8px;
  display: block;
}

.command-input :deep(.el-input__wrapper) {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.command-input :deep(.el-input__inner) {
  color: #ffffff;
}

.method-switch-container {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

.method-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  color: #909399;
  font-weight: 500;
  font-size: 14px;
}

.method-option:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #c0c4cc;
}

.method-option.active {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
  font-weight: 600;
}

.method-option.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.method-divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
}

.disabled-reason {
  font-size: 10px;
  opacity: 0.7;
  margin-left: 4px;
}

.method-description {
  margin-top: 12px;
}

.method-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 12px;
}

.method-info.gprs {
  background: rgba(64, 158, 255, 0.1);
  color: #79bbff;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.method-info.sms {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
  border: 1px solid rgba(230, 162, 60, 0.2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-footer .el-button {
  min-width: 120px;
}

/* Response Section */
.response-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-weight: 600;
  color: #ffffff;
  font-size: 15px;
}

.response-header i {
  color: #409eff;
}

.response-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
  color: #909399;
  font-size: 14px;
}

.response-loading i {
  color: #409eff;
  font-size: 18px;
}

.response-data {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.response-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 13px;
}

.response-status.success {
  background: rgba(103, 194, 58, 0.15);
  color: #67c23a;
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.response-status.error {
  background: rgba(245, 108, 108, 0.15);
  color: #f56c6c;
  border: 1px solid rgba(245, 108, 108, 0.3);
}

.response-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.response-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 13px;
  color: #c0c4cc;
}

.response-item strong {
  color: #ffffff;
  min-width: 100px;
}

.time-value {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #909399;
}

.device-response-notification {
  background: rgba(103, 194, 58, 0.1);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(103, 194, 58, 0.2);
  margin-top: 16px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.device-response-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: #909399;
  margin-top: 12px;
}

.device-response-info i {
  color: #606266;
}
</style>
