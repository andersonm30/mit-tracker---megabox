<template>
  <el-dialog
    v-model="isVisible"
    :title="KT('device.custom_command')"
    :before-close="handleClose"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    destroy-on-close
    width="650px"
    top="8vh"
  >
    <div class="modal-content">
      <!-- Device Info -->
      <div class="device-info">
        <div class="device-header">
          <i class="fas fa-microchip"></i>
          <span class="device-name">{{ device?.name }}</span>
          <span class="device-status" :class="device?.status">{{ device?.status?.toUpperCase() }}</span>
        </div>

        <div class="device-details">
          <div class="device-detail-item" v-if="devicePhone">
            <i class="fas fa-mobile-alt"></i>
            <span class="detail-label">{{ KT('device.phone_label') }}:</span>
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
        <label class="form-label">{{ KT('device.enter_command') }}</label>
        <el-input
          v-model="command"
          :placeholder="KT('device.type_command')"
          size="large"
          class="command-input"
          @keyup.enter="sendCommand"
        />
      </div>

      <!-- Method Selection -->
      <div class="method-section">
        <label class="form-label">{{ KT('device.transmission_method') }}</label>
        <div class="method-options">
          <div class="method-buttons">
            <el-button 
              :type="selectedMethod === 'gprs' ? 'primary' : 'default'"
              @click="selectedMethod = 'gprs'"
              size="large"
            >
              <i class="fas fa-wifi"></i> GPRS
            </el-button>
            <el-button 
              :type="selectedMethod === 'sms' ? 'primary' : 'default'"
              :disabled="!smsAvailable"
              @click="smsAvailable && (selectedMethod = 'sms')"
              size="large"
            >
              <i class="fas fa-sms"></i> SMS
              <span v-if="!smsAvailable" class="disabled-text">({{ KT('device.not_configured') }})</span>
            </el-button>
          </div>
        </div>

        <!-- Method Description -->
        <div class="method-description">
          <div v-if="selectedMethod === 'gprs'" class="method-info gprs">
            <i class="fas fa-info-circle"></i>
            <span>{{ KT('device.gprs_description') }}</span>
          </div>
          <div v-if="selectedMethod === 'sms' && smsAvailable" class="method-info sms">
            <i class="fas fa-info-circle"></i>
            <span>{{ KT('device.sms_description') }}</span>
          </div>
        </div>
      </div>

      <!-- Response Section -->
      <div v-if="showResponse" class="response-section">
        <div class="response-header">
          <i class="fas fa-reply"></i>
          <span>{{ KT('device.command_response') }}</span>
        </div>
        <div class="response-content">
          <div v-if="responseLoading" class="response-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>{{ KT('device.waiting_response') }}</span>
          </div>
          <div v-else-if="responseData" class="response-data">
            <div class="response-status" :class="responseData.success ? 'success' : 'error'">
              <i :class="responseData.success ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
              <span>{{ responseData.success ? KT('device.sent_success') : KT('device.send_error') }}</span>
            </div>
            <div class="response-details">
              <div class="response-item">
                <strong>{{ KT('device.method_label') }}:</strong> {{ responseData.method }}
              </div>
              <div class="response-item" v-if="responseData.messageId">
                <strong>{{ KT('device.message_id') }}:</strong> {{ responseData.messageId }}
              </div>
              <div class="response-item" v-if="responseData.description">
                <strong>{{ KT('device.description_label') }}:</strong> {{ responseData.description }}
              </div>
              <div class="response-item" v-if="responseData.cost">
                <strong>{{ KT('device.cost_label') }}:</strong> R$ {{ responseData.cost }}
              </div>
            </div>
          </div>
        </div>

        <!-- Device Response Notification -->
        <div v-if="deviceResponse && deviceResponse.result" class="device-response-notification">
          <div class="response-status success">
            <i class="fas fa-check-circle"></i>
            <span>{{ KT('device.device_response') }}</span>
          </div>
          <div class="response-details">
            <div class="response-item">
              <strong>{{ KT('device.result_label') }}:</strong> {{ deviceResponse.result || KT('device.no_result') }}
            </div>
            <div class="response-item" v-if="deviceResponse.detail">
              <strong>{{ KT('device.detail_label') }}:</strong> {{ deviceResponse.detail }}
            </div>
            <div class="response-item time-item">
              <strong>{{ KT('device.time_label') }}:</strong> <span class="time-value">{{ formatResponseTime(deviceResponse.timestamp) }}</span>
            </div>
          </div>
        </div>

        <!-- Info about device responses -->
        <div v-if="!deviceResponse" class="device-response-info">
          <i class="fas fa-info-circle"></i>
          <span>{{ KT('device.device_response_info') }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <el-button type="danger" plain @click="handleClose" size="large">
          {{ showResponse ? KT('device.close') : KT('Cancel') }}
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
          {{ KT('device.send_command') }}
        </el-button>
        <el-button
          v-else
          type="success"
          @click="sendAnother"
          size="large"
        >
          <i class="fas fa-plus"></i>
          {{ KT('device.send_another') }}
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
.modal-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.device-info,
.command-section,
.method-section,
.response-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 18px;
  border: 1px solid #e2e8f0;
}

.device-info {
  border-left: 4px solid var(--el-color-primary);
}

.device-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.device-header i {
  color: var(--el-color-primary);
  font-size: 18px;
}

.device-name {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.device-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.device-status.online {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.device-status.offline {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
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
  color: #606266;
}

.device-detail-item i {
  color: var(--el-color-primary);
  width: 18px;
}

.detail-label {
  font-weight: 500;
  min-width: 70px;
  color: #606266;
}

.detail-value {
  color: #303133;
  font-family: 'Courier New', monospace;
}

.form-label {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  margin-bottom: 10px;
  display: block;
}

.method-buttons {
  display: flex;
  gap: 12px;
}

.method-buttons .el-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.method-buttons .disabled-text {
  font-size: 11px;
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
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 13px;
}

.method-info.gprs {
  background: #ecf5ff;
  color: #409eff;
  border: 1px solid #b3d8ff;
}

.method-info.sms {
  background: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #f5dab1;
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
  color: #303133;
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
  color: #606266;
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
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #c2e7b0;
}

.response-status.error {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
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
  background: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  font-size: 13px;
  color: #606266;
}

.response-item strong {
  color: #303133;
  min-width: 100px;
}

.time-value {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #909399;
}

.device-response-notification {
  background: #f0f9eb;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #c2e7b0;
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
  background: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  font-size: 12px;
  color: #606266;
  margin-top: 12px;
}

.device-response-info i {
  color: #909399;
}
</style>
