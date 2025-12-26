<template>
  <el-dialog
    v-model="isVisible"
    :title="KT('device.custom_command')"
    width="480px"
    :before-close="handleClose"
    custom-class="command-modal"
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
          <div class="method-switch-container">
            <div class="method-option" :class="{ active: selectedMethod === 'gprs' }" @click="selectedMethod = 'gprs'">
              <i class="fas fa-wifi" :class="{ active: selectedMethod === 'gprs' }"></i>
              <span>GPRS</span>
            </div>
            <div class="method-divider"></div>
            <div class="method-option" :class="{ active: selectedMethod === 'sms', disabled: !smsAvailable }" @click="smsAvailable && (selectedMethod = 'sms')">
              <i class="fas fa-sms" :class="{ active: selectedMethod === 'sms' }"></i>
              <span>SMS</span>
              <span v-if="!smsAvailable" class="disabled-reason">(No configurado)</span>
            </div>
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
        <div v-if="deviceResponse && showResponse && deviceResponse.result" class="device-response-notification">
          <div class="response-status success">
            <i class="fas fa-check-circle"></i>
            <span>Resposta do Dispositivo</span>
          </div>
          <div class="response-details">
            <div class="response-item">
              <strong>Resultado:</strong> {{ deviceResponse.result || 'Sin resultado específico' }}
            </div>
            <div class="response-item" v-if="deviceResponse.detail">
              <strong>Detalle:</strong> {{ deviceResponse.detail }}
            </div>
            <div class="response-item time-item">
              <strong>Hora:</strong> <span class="time-value">{{ formatResponseTime(deviceResponse.timestamp) }}</span>
            </div>
          </div>
        </div>
        
        
        <!-- Info about device responses - solo si no hay respuesta -->
        <div v-if="!deviceResponse" class="device-response-info">
          <i class="fas fa-info-circle"></i>
          <span>Algunos dispositivos pueden no reportar el resultado del comando</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <el-button @click="handleClose" size="large">
          {{ showResponse ? 'Fechar' : KT('Cancel') }}
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
      get: () => {
        console.log('CommandModal isVisible getter:', props.modelValue);
        return props.modelValue;
      },
      set: (value) => {
        console.log('CommandModal isVisible setter:', value);
        emit('update:modelValue', value);
      }
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

<style scoped>
.command-modal :deep(.el-dialog) {
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.command-modal :deep(.el-dialog__header) {
  flex-shrink: 0;
  padding: 12px 20px;
}

.command-modal :deep(.el-dialog__body) {
  flex: 1;
  padding: 0 20px;
  overflow-y: auto;
  max-height: calc(85vh - 140px);
  min-height: 300px;
}

.command-modal :deep(.el-dialog__footer) {
  flex-shrink: 0;
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #ebeef5;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
}

/* ESTILOS UNIFICADOS PARA TODAS LAS SECCIONES */
.device-info,
.command-section,
.method-section,
.response-section {
  background: #f8fafc;
  border-radius: 6px;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin: 0;
}

/* Estilos específicos solo para device-info */
.device-info {
  border-left: 3px solid #409eff; /* Mantener el borde azul característico */
}

.device-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.device-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.device-status {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.device-status.online {
  background: #f0f9ff;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.device-status.offline {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.device-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.device-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.device-detail-item i {
  color: #409eff;
  width: 18px;
  flex-shrink: 0;
}

.detail-label {
  font-weight: 500;
  color: #606266;
  min-width: 70px;
}

.detail-value {
  color: #303133;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

/* Estilos para command-section y method-section */
.command-section,
.method-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  margin-bottom: 4px; /* Pequeño margen para separar del input */
}

.command-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.method-options {
  display: flex;
  justify-content: center;
}

.method-switch-container {
  display: flex;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 3px;
  border: 1px solid #e2e8f0;
  width: 100%;
  max-width: 280px;
}

.method-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px; /* Aumentado ligeramente */
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  color: #64748b;
  font-weight: 500;
  position: relative;
  font-size: 13px;
}

.method-option:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.7);
  color: #475569;
}

.method-option.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-weight: 600;
}

.method-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.method-option i {
  font-size: 16px;
  color: inherit;
  transition: color 0.2s ease;
}

.method-option i.active {
  color: #3b82f6;
}

.method-divider {
  width: 1px;
  background: #e2e8f0;
  margin: 8px 0;
}

.disabled-reason {
  font-size: 10px;
  opacity: 0.7;
  margin-left: 4px;
}

.method-description {
  margin-top: 8px;
}

.method-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.method-info.gprs {
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.method-info.sms {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #fde68a;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-footer .el-button {
  min-width: 110px;
}

/* Response Section Styles */
.response-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.response-header i {
  color: #6366f1;
}

.response-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  color: #6b7280;
  font-size: 14px;
}

.response-loading i {
  color: #3b82f6;
}

.response-data {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.response-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 11px;
  line-height: 1.2;
  min-height: auto;
}

.response-status.success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.response-status.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.response-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.response-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  font-size: 12px;
}

.response-item.time-item {
  padding: 4px 10px;
  font-size: 11px;
}

.time-value {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #6b7280;
  white-space: nowrap;
}

.response-item strong {
  color: #374151;
  min-width: 100px;
}

/* Device Response Notification Styles */
.device-response-notification {
  background: #f8fafc;
  border-radius: 6px;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin-top: 12px;
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
  gap: 6px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  font-size: 11px;
  color: #6b7280;
  margin-top: 8px;
}

.device-response-info i {
  color: #9ca3af;
  flex-shrink: 0;
  font-size: 12px;
}
</style>