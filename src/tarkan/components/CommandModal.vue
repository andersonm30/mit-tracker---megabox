<template>
  <el-dialog 
    :lock-scroll="true" 
    v-model="isVisible"
    :before-close="handleClose"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    destroy-on-close
    append-to-body
    width="520px"
    top="10vh"
    custom-class="command-modal-dialog"
  >
    <template #header>
      <div class="command-modal-header">
        <div class="modal-title">
          <i class="fas fa-terminal"></i> 
          {{ KT('device.custom_command') }}
        </div>
        <button class="close-btn" @click="handleClose" type="button">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </template>

    <div class="command-modal-body">
      <!-- Device Info -->
      <div class="device-info-card">
        <div class="device-main-info">
          <i class="fas fa-microchip device-icon"></i>
          <span class="device-name">{{ device?.name }}</span>
          <span class="device-status-badge" :class="device?.status">{{ device?.status?.toUpperCase() }}</span>
        </div>
        
        <div class="device-details-row">
          <div class="detail-item" v-if="deviceImei">
            <i class="fas fa-barcode"></i>
            <span class="label">IMEI:</span>
            <span class="value">{{ deviceImei }}</span>
          </div>
          <div class="detail-item" v-if="devicePhone">
            <i class="fas fa-mobile-alt"></i>
            <span class="label">{{ KT('device.phone_label') }}:</span>
            <span class="value">{{ devicePhone }}</span>
          </div>
        </div>
      </div>

      <!-- Command Input -->
      <div class="form-section">
        <label class="section-label">{{ KT('device.enter_command') }}</label>
        <el-input
          v-model="command"
          :placeholder="KT('device.type_command')"
          size="large"
          @keyup.enter="sendCommand"
        />
      </div>

      <!-- Method Selection -->
      <div class="form-section">
        <label class="section-label">{{ KT('device.transmission_method') }}</label>
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
        
        <!-- Method Description -->
        <div class="method-hint">
          <i class="fas fa-info-circle"></i>
          <span v-if="selectedMethod === 'gprs'">{{ KT('device.gprs_description') }}</span>
          <span v-else-if="selectedMethod === 'sms' && smsAvailable">{{ KT('device.sms_description') }}</span>
        </div>
      </div>

      <!-- Response Section -->
      <div v-if="showResponse" class="response-section">
        <div class="response-title">
          <i class="fas fa-reply"></i>
          {{ KT('device.command_response') }}
        </div>
        
        <div v-if="responseLoading" class="response-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>{{ KT('device.waiting_response') }}</span>
        </div>
        
        <div v-else-if="responseData" class="response-result">
          <div class="result-status" :class="responseData.success ? 'success' : 'error'">
            <i :class="responseData.success ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
            <span>{{ responseData.success ? KT('device.sent_success') : KT('device.send_error') }}</span>
          </div>
          <div class="result-details">
            <p><strong>{{ KT('device.method_label') }}:</strong> {{ responseData.method }}</p>
            <p v-if="responseData.messageId"><strong>{{ KT('device.message_id') }}:</strong> {{ responseData.messageId }}</p>
            <p v-if="responseData.description"><strong>{{ KT('device.description_label') }}:</strong> {{ responseData.description }}</p>
            <p v-if="responseData.cost"><strong>{{ KT('device.cost_label') }}:</strong> R$ {{ responseData.cost }}</p>
          </div>
        </div>
        
        <!-- Device Response -->
        <div v-if="deviceResponse && deviceResponse.result" class="device-response-card">
          <div class="result-status success">
            <i class="fas fa-check-circle"></i>
            <span>{{ KT('device.device_response') }}</span>
          </div>
          <div class="result-details">
            <p><strong>{{ KT('device.result_label') }}:</strong> {{ deviceResponse.result || KT('device.no_result') }}</p>
            <p v-if="deviceResponse.detail"><strong>{{ KT('device.detail_label') }}:</strong> {{ deviceResponse.detail }}</p>
            <p><strong>{{ KT('device.time_label') }}:</strong> {{ formatResponseTime(deviceResponse.timestamp) }}</p>
          </div>
        </div>
        
        <div v-if="!deviceResponse" class="response-info-hint">
          <i class="fas fa-info-circle"></i>
          <span>{{ KT('device.device_response_info') }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="command-modal-footer">
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
  name: 'CommandModal',
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
    const eventsInfo = ref([])
    
    // Cargar eventos recientes del dispositivo para buscar commandResult
    const listenForDeviceResponse = () => {
      if (!props.device?.id) return
      
      // NO BUSCAR EVENTOS ANTERIORES - Solo hacer polling para eventos nuevos
      const commandSentTime = new Date().getTime()
      
      // Configurar polling cada 3 segundos para eventos nuevos únicamente
      const pollInterval = setInterval(() => {
        if (window.$traccar && props.device?.id) {
          console.log('Polling para eventos nuevos desde:', new Date(commandSentTime).toISOString())
          
          window.$traccar.getReportEvents(
            [props.device.id], 
            [], 
            new Date(commandSentTime).toISOString(), // Solo desde que se envió el comando
            new Date().toISOString(), 
            false
          ).then((r) => {
            console.log('Eventos encontrados en polling:', r.data)
            
            const newCommandResults = r.data.filter(event => {
              const eventTime = new Date(event.eventTime).getTime()
              const isCommandResult = event.type === 'commandResult'
              const isAfterCommand = eventTime > commandSentTime
              
              console.log('Evaluando evento:', {
                id: event.id,
                type: event.type,
                eventTime: eventTime,
                commandTime: commandSentTime,
                isCommandResult,
                isAfterCommand,
                attributes: event.attributes
              })
              
              return isCommandResult && isAfterCommand
            })
            
            console.log('Nuevos commandResults filtrados:', newCommandResults)
            
            if (newCommandResults.length > 0) {
              console.log('ENCONTRADO NUEVO COMANDO RESULT, procesando:', newCommandResults[0])
              processDeviceEvent(newCommandResults[0]) // Tomar el más reciente
              clearInterval(pollInterval) // Dejar de buscar
            }
          }).catch(error => {
            console.error('Error en polling:', error)
          })
        }
      }, 3000)
      
      // Limpiar interval después de 2 minutos
      setTimeout(() => {
        clearInterval(pollInterval)
      }, 120000)
    }
    
    // Función para procesar event real cuando llegue del WebSocket
    const processDeviceEvent = (event) => {
      console.log('=== PROCESANDO EVENTO ===')
      console.log('Evento completo:', event)
      console.log('Tipo de evento:', event.type)
      console.log('DeviceId del evento:', event.deviceId, 'vs props device:', props.device?.id)
      console.log('Attributes del evento:', event.attributes)
      console.log('Comando actual:', command.value)
      
      // Verificar que es un commandResult para este dispositivo
      if (event.type === 'commandResult' && event.deviceId === props.device?.id) {
        
        console.log('✅ Es commandResult para este dispositivo')
        
        // Intentar extraer el resultado de diferentes formas
        let resultText = null
        
        // Opción 1: event.attributes.result
        if (event.attributes?.result) {
          resultText = event.attributes.result
          console.log('🎯 Resultado encontrado en attributes.result:', resultText)
          
          // Si result es un objeto JSON string, parsearlo
          if (typeof resultText === 'string') {
            try {
              const parsed = JSON.parse(resultText)
              resultText = parsed.result || parsed || resultText
              console.log('📄 Resultado parseado desde JSON:', resultText)
            } catch (e) {
              console.log('📝 No es JSON válido, usando tal como viene:', resultText)
            }
          }
        }
        // Opción 2: directamente en attributes
        else if (event.attributes) {
          console.log('🔍 Buscando en attributes directamente:', event.attributes)
          // Buscar cualquier propiedad que pueda contener el resultado
          for (const [key, value] of Object.entries(event.attributes)) {
            console.log(`  - Attribute ${key}:`, value)
          }
          // Usar el primer valor que encuentre
          const firstValue = Object.values(event.attributes)[0]
          resultText = String(firstValue)
          console.log('🎯 Usando primer valor encontrado:', resultText)
        }
        
        const newDeviceResponse = {
          type: 'commandResult',
          message: 'Respuesta del dispositivo',
          result: resultText || 'Sin resultado específico',
          detail: `Event ID: ${event.id} - ${event.eventTime || event.serverTime}`,
          timestamp: new Date(event.eventTime || event.serverTime),
          originalCommand: command.value.trim(),
          eventId: event.id
        }
        
        console.log('🚀 ACTUALIZANDO deviceResponse con:', newDeviceResponse)
        deviceResponse.value = newDeviceResponse
        
        // Verificar que se actualizó
        setTimeout(() => {
          console.log('🔄 Verificación - deviceResponse después de actualizar:', deviceResponse.value)
        }, 100)
        
      } else {
        console.log('❌ Evento no procesado - tipo o deviceId no coincide')
        console.log('  - Tipo esperado: commandResult, recibido:', event.type)
        console.log('  - DeviceId esperado:', props.device?.id, 'recibido:', event.deviceId)
      }
    }

    // Computed properties
    const isVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    const devicePhone = computed(() => props.device?.attributes?.phone)
    
    const deviceImei = computed(() => props.device?.uniqueId)

    const smsAvailable = computed(() => {
      const smsApiUrl = store.getters['server/getAttribute']('sms_api_url')
      const smsApiKey = store.getters['server/getAttribute']('sms_api_key')
      return !!(smsApiUrl && smsApiKey)
    })

    // Methods
    const handleClose = () => {
      if (!loading.value) {
        console.log('🚪 CERRANDO MODAL - Limpiando todo')
        
        // LIMPIAR TODO ANTES DE CERRAR
        deviceResponse.value = null
        responseData.value = null
        eventsInfo.value = []
        showResponse.value = false
        responseLoading.value = false
        loading.value = false
        command.value = ''
        selectedMethod.value = 'gprs'
        
        isVisible.value = false
        resetForm()
        
        console.log('✅ Modal cerrado y limpiado')
      }
    }

    const resetForm = () => {
      console.log('🔄 resetForm - Limpiando TODO agresivamente')
      
      // FORZAR LIMPIEZA COMPLETA
      deviceResponse.value = null
      responseData.value = null
      eventsInfo.value = []
      showResponse.value = false
      responseLoading.value = false
      loading.value = false
      command.value = ''
      selectedMethod.value = 'gprs'
      
      // Verificar después de un tick
      setTimeout(() => {
        console.log('🔍 resetForm - Verificación después de limpiar:', {
          command: command.value,
          showResponse: showResponse.value,
          responseData: responseData.value,
          deviceResponse: deviceResponse.value
        })
      }, 50)
    }

    const sendAnother = () => {
      console.log('🔄 SEND ANOTHER - Limpiando TODO')
      
      // LIMPIAR TODO COMPLETAMENTE E INMEDIATAMENTE
      deviceResponse.value = null  // PRIMERO esto
      responseData.value = null
      eventsInfo.value = []
      showResponse.value = false
      responseLoading.value = false
      loading.value = false
      command.value = ''
      selectedMethod.value = 'gprs'
      
      console.log('✅ sendAnother - Todo limpiado:', {
        command: command.value,
        showResponse: showResponse.value,
        responseData: responseData.value,
        deviceResponse: deviceResponse.value
      })
    }

    const sendCommand = async () => {
      if (!command.value.trim() || loading.value) return
      
      // PRIMERO LIMPIAR - ANTES DE CUALQUIER COSA
      deviceResponse.value = null
      responseData.value = null
      eventsInfo.value = []
      showResponse.value = false
      console.log('🧹 LIMPIADO INMEDIATO al tocar enviar')
      
      loading.value = true
      
      try {
        let result
        
        if (selectedMethod.value === 'sms') {
          result = await sendViaSMS()
        } else {
          console.log('🚀 Llamando sendViaGPRS()')
          result = await sendViaGPRS()
          console.log('✅ sendViaGPRS() completado:', result)
        }
        
        // Mostrar respuesta
        showResponse.value = true
        responseData.value = result
        
        // Comando enviado exitosamente - buscar respuesta del dispositivo
        if (result.success) {
          listenForDeviceResponse()
        }
        
      } catch (error) {
        console.error('Error sending command:', error)
        showResponse.value = true
        responseData.value = {
          success: false,
          method: selectedMethod.value.toUpperCase(),
          description: error.message || KT('device.command_error')
        }
      } finally {
        loading.value = false
      }
    }

    const sendViaGPRS = async () => {
      // Construir comando igual que los guardados
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
        description: props.device.status !== 'online' ? 'Comando em fila, será executado quando dispositivo estiver online' : 'Comando enviado com sucesso via GPRS'
      }
    }

    const formatResponseTime = (timestamp) => {
      return new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(timestamp)
    }
    
    const getResponseTypeIcon = (type) => {
      return type === 'commandResult' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
    }
    
    const getResponseTypeLabel = (type) => {
      return type === 'commandResult' ? 'Resultado del Comando' : 'Evento'
    }
    
    const getEventResult = (event) => {
      try {
        if (event.attributes?.result) {
          if (typeof event.attributes.result === 'string') {
            const parsed = JSON.parse(event.attributes.result)
            return parsed.result || parsed || event.attributes.result
          }
          return event.attributes.result
        }
        
        // Buscar en otros campos de attributes
        if (event.attributes) {
          const keys = Object.keys(event.attributes)
          console.log('Attributes keys:', keys, event.attributes)
          return `Attributes: ${JSON.stringify(event.attributes)}`
        }
        
        return 'Sin resultado'
      } catch (e) {
        return event.attributes?.result || 'Error parsing'
      }
    }

    const sendViaSMS = async () => {
      const smsApiUrl = store.getters['server/getAttribute']('sms_api_url') || 'https://api.smsdev.com.br/v1/send'
      const smsApiKey = store.getters['server/getAttribute']('sms_api_key')
      const smsApiType = store.getters['server/getAttribute']('sms_api_type') || '9'
      const smsApiRefer = store.getters['server/getAttribute']('sms_api_refer')
      
      console.log('=== SMS CONFIGURATION ===')
      console.log('SMS API URL:', smsApiUrl)
      console.log('SMS API Key:', smsApiKey ? 'CONFIGURED' : 'NOT CONFIGURED')
      console.log('SMS API Type:', smsApiType)
      console.log('SMS API Refer:', smsApiRefer)
      console.log('Device Phone:', devicePhone.value)
      console.log('Command:', command.value.trim())
      
      if (!smsApiKey) {
        throw new Error('SMS API Key no configurado')
      }
      
      if (!devicePhone.value) {
        throw new Error('Dispositivo sin número de teléfono')
      }
      
      // Construir URL
      let fullUrl = `${smsApiUrl}?key=${smsApiKey}&type=${smsApiType}`
      
      if (smsApiRefer && smsApiRefer.trim()) {
        fullUrl += `&refer=${smsApiRefer}`
      }
      
      fullUrl += `&number=${devicePhone.value}&msg=${encodeURIComponent(command.value.trim())}`
      
      console.log('SMS Full URL (without key):', fullUrl.replace(smsApiKey, 'HIDDEN_KEY'))
      
      const response = await fetch(fullUrl, { method: 'GET' })
      
      console.log('SMS Response Status:', response.status)
      console.log('SMS Response OK:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('SMS API Error Response:', errorText)
        throw new Error(`SMS API error: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('SMS API Result:', result)
      
      // Verificar diferentes tipos de respuesta
      if (result.situacao && result.situacao !== 'OK') {
        throw new Error(`SMS error: ${result.descricao || result.situacao || 'Unknown error'}`)
      }
      
      // Si no tiene situacao, verificar otros campos comunes
      if (result.error) {
        throw new Error(`SMS error: ${result.error}`)
      }
      
      // Si llegamos aquí, asumir éxito
      return {
        success: true,
        method: 'SMS',
        messageId: result.id || result.messageId || 'N/A',
        description: result.descricao || result.message || 'SMS enviado com sucesso',
        cost: result.valor || result.cost || null
      }
    }

    // Watchers
    watch(() => props.modelValue, (newVal) => {
      if (newVal) {
        console.log('🔄 MODAL ABIERTO - Limpiando estado anterior')
        
        // LIMPIAR COMPLETAMENTE AL ABRIR EL MODAL
        deviceResponse.value = null
        responseData.value = null
        eventsInfo.value = []
        showResponse.value = false
        responseLoading.value = false
        loading.value = false
        command.value = ''
        
        // Always default to GPRS
        selectedMethod.value = 'gprs'
        
        console.log('✅ Modal limpiado al abrir:', {
          deviceResponse: deviceResponse.value,
          responseData: responseData.value,
          showResponse: showResponse.value
        })
      }
    })

    watch(smsAvailable, (available) => {
      if (!available && selectedMethod.value === 'sms') {
        selectedMethod.value = 'gprs'
      }
    })

    // Exponer función para uso externo
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
      sendViaGPRS,
      sendViaSMS,
      eventsInfo,
      listenForDeviceResponse,
      processDeviceEvent,
      formatResponseTime,
      getResponseTypeIcon,
      getResponseTypeLabel,
      getEventResult,
      KT
    }
  }
}
</script>

<style>
/* Dialog Container */
.command-modal-dialog {
  border-radius: 12px !important;
  overflow: hidden;
}

/* Esconder botão close padrão do Element Plus - usamos o nosso personalizado */
.command-modal-dialog .el-dialog__headerbtn {
  display: none !important;
}

.command-modal-dialog .el-dialog__header {
  padding: 0 !important;
  margin: 0 !important;
  margin-right: 0 !important;
}

.command-modal-dialog .el-dialog__body {
  padding: 0 !important;
}

.command-modal-dialog .el-dialog__footer {
  padding: 0 !important;
}

/* Header do Modal */
.command-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
}

.command-modal-header .modal-title {
  color: white;
  font-size: 17px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.command-modal-header .close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.command-modal-header .close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.command-modal-header .close-btn i {
  font-size: 14px;
}

/* Body do Modal */
.command-modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Card de Info do Dispositivo */
.device-info-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #409eff;
}

.device-main-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.device-icon {
  color: #409eff;
  font-size: 20px;
}

.device-name {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.device-status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.device-status-badge.online {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.device-status-badge.offline {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.device-details-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.detail-item i {
  color: #409eff;
}

.detail-item .label {
  font-weight: 500;
}

.detail-item .value {
  color: #303133;
  font-family: 'Courier New', monospace;
}

/* Seções do Formulário */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

/* Botões de Método */
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

.method-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #bae6fd;
  font-size: 13px;
  color: #0369a1;
}

.method-hint i {
  color: #0ea5e9;
}

/* Seção de Resposta */
.response-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.response-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #374151;
  font-size: 15px;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
}

.response-title i {
  color: #6366f1;
}

.response-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: #6b7280;
  font-size: 14px;
}

.response-loading i {
  color: #3b82f6;
  font-size: 20px;
}

.response-result,
.device-response-card {
  background: white;
  border-radius: 6px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.result-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 13px;
  margin-bottom: 12px;
}

.result-status.success {
  background: #dcfce7;
  color: #166534;
}

.result-status.error {
  background: #fef2f2;
  color: #dc2626;
}

.result-status i {
  font-size: 16px;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-details p {
  margin: 0;
  font-size: 13px;
  color: #374151;
  padding: 6px 0;
  border-bottom: 1px solid #f3f4f6;
}

.result-details p:last-child {
  border-bottom: none;
}

.result-details strong {
  color: #1f2937;
  margin-right: 8px;
}

.response-info-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fefce8;
  border-radius: 6px;
  border: 1px solid #fde68a;
  font-size: 12px;
  color: #854d0e;
}

.response-info-hint i {
  color: #eab308;
}

/* Footer do Modal */
.command-modal-footer {
  border-top: #e0e0e0 1px solid;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
}

.command-modal-footer .el-button {
  min-width: 120px;
}

.command-modal-footer .el-button i {
  margin-right: 6px;
}
</style>