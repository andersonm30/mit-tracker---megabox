<template>
  <div class="driver-photo-upload">
    <!-- Preview da foto atual ou placeholder -->
    <div class="photo-preview" :class="{ 'has-image': hasPhoto }">
      <img v-if="photoUrl" :src="photoUrl" alt="Foto do motorista" @error="onImageError" />
      <div v-else class="placeholder">
        <el-icon :size="60"><Avatar /></el-icon>
        <span>Sem foto</span>
      </div>
    </div>

    <!-- Área de drag & drop + file picker -->
    <div 
      class="upload-area"
      :class="{ 'is-dragover': isDragover, 'is-uploading': isUploading }"
      @drop.prevent="onDrop"
      @dragover.prevent="isDragover = true"
      @dragleave="isDragover = false"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        @change="onFileSelect"
        style="display: none"
      />
      
      <div v-if="!isUploading" class="upload-content" @click="$refs.fileInput.click()">
        <el-icon :size="40"><Upload /></el-icon>
        <p class="upload-text">
          Arraste uma foto aqui ou <span class="link">clique para selecionar</span>
        </p>
        <p class="upload-hint">JPG, PNG até 10MB • Recomendado: 800x800px</p>
      </div>

      <div v-else class="upload-loading">
        <el-icon class="is-loading" :size="40"><Loading /></el-icon>
        <p>Processando imagem...</p>
      </div>
    </div>

    <!-- Preview da imagem selecionada (antes do upload) -->
    <div v-if="previewDataUrl && !isUploading" class="selected-preview">
      <img :src="previewDataUrl" alt="Preview" />
      <div class="preview-actions">
        <el-button size="small" type="primary" @click="uploadPhoto">
          Confirmar Upload
        </el-button>
        <el-button size="small" @click="cancelPreview">
          Cancelar
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElIcon } from 'element-plus'
import { Avatar, Upload, Loading } from '@element-plus/icons-vue'
import axios from 'axios'

const props = defineProps({
  driverId: {
    type: [Number, String],
    required: true
  },
  currentPhotoUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['uploaded', 'error'])

// Estado
const isDragover = ref(false)
const isUploading = ref(false)
const photoUrl = ref(props.currentPhotoUrl)
const previewDataUrl = ref(null)
const selectedFile = ref(null)
const fileInput = ref(null)

// Computed
const hasPhoto = computed(() => !!photoUrl.value)

// Watch para atualizar foto quando prop mudar
watch(() => props.currentPhotoUrl, (newUrl) => {
  photoUrl.value = newUrl
})

// Validação de arquivo
function validateFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!validTypes.includes(file.type)) {
    ElMessage.error('Formato inválido. Use JPG ou PNG.')
    return false
  }

  if (file.size > maxSize) {
    ElMessage.error('Arquivo muito grande. Máximo 10MB.')
    return false
  }

  return true
}

// Redimensionar e comprimir imagem client-side
function resizeAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 800
        
        let width = img.width
        let height = img.height
        
        // Manter proporção
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        // Comprimir a 70% quality
        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/jpeg', 0.7)
      }
      
      img.onerror = reject
      img.src = e.target.result
    }
    
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Handler de seleção de arquivo
async function onFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  
  if (!validateFile(file)) return
  
  selectedFile.value = file
  
  // Criar preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewDataUrl.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// Handler de drag & drop
async function onDrop(event) {
  isDragover.value = false
  
  const file = event.dataTransfer.files[0]
  if (!file) return
  
  if (!validateFile(file)) return
  
  selectedFile.value = file
  
  // Criar preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewDataUrl.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// Upload da foto
async function uploadPhoto() {
  if (!selectedFile.value) return
  
  try {
    isUploading.value = true
    
    // Redimensionar e comprimir
    const processedBlob = await resizeAndCompressImage(selectedFile.value)
    
    // Criar FormData
    const formData = new FormData()
    formData.append('image', processedBlob, 'photo.jpg')
    
    // Fazer upload
    const response = await axios.post(
      `/api/drivers/${props.driverId}/photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    
    // Sucesso
    if (response.data.success) {
      ElMessage.success('Foto atualizada com sucesso!')
      
      // Atualizar URL com timestamp para cache busting
      photoUrl.value = response.data.photo_url + '?t=' + response.data.timestamp
      
      // Emitir evento
      emit('uploaded', {
        photoUrl: response.data.photo_url,
        timestamp: response.data.timestamp
      })
      
      // Limpar preview
      cancelPreview()
    }
    
  } catch (error) {
    console.error('Erro no upload:', error)
    
    let errorMessage = 'Erro ao fazer upload da foto'
    
    if (error.response?.status === 404) {
      errorMessage = 'Motorista não encontrado'
    } else if (error.response?.status === 422) {
      errorMessage = error.response.data.errors?.image?.[0] || 'Arquivo inválido'
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    }
    
    ElMessage.error(errorMessage)
    emit('error', error)
    
  } finally {
    isUploading.value = false
  }
}

// Cancelar preview
function cancelPreview() {
  previewDataUrl.value = null
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Handler de erro ao carregar imagem
function onImageError() {
  photoUrl.value = null
}
</script>

<style scoped>
.driver-photo-upload {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.photo-preview {
  width: 150px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e4e7ed;
  margin: 0 auto;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-preview .placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #909399;
}

.photo-preview .placeholder span {
  font-size: 12px;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.upload-area.is-dragover {
  border-color: #409eff;
  background: #ecf5ff;
  transform: scale(1.02);
}

.upload-area.is-uploading {
  cursor: not-allowed;
  opacity: 0.6;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.upload-text .link {
  color: #409eff;
  text-decoration: underline;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.upload-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #409eff;
}

.upload-loading p {
  margin: 0;
  font-size: 14px;
}

.selected-preview {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  background: #fff;
}

.selected-preview img {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 4px;
  margin-bottom: 15px;
}

.preview-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>
