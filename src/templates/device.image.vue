<script setup>
import { defineProps, onMounted, onUnmounted, ref, watch, computed } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import { assetUrl, categoryImageUrl } from '@/branding'

const store = useStore()

const props = defineProps({
  id: { type: [Number, String], required: true },
  refresher: { type: [Boolean, String, Number], required: false, default: false },
  category: { type: String, default: 'default' },
  allowUpload: { type: Boolean, default: false }
})

const isDeviceLoading = ref(true)
const isCategoryLoading = ref(true)
const isDeviceLoaded = ref(false)
const isCategoryLoaded = ref(false)
const isUploading = ref(false)

const carImageData = ref(null)
const catImageData = ref(null)

// Logo padrão - usando helper de branding
const defaultLogo = assetUrl('logo.png')

// Computed para determinar qual imagem mostrar
const displayImage = computed(() => {
  if (isDeviceLoaded.value && carImageData.value) {
    return { src: carImageData.value, type: 'device' }
  }
  if (isCategoryLoaded.value && catImageData.value) {
    return { src: catImageData.value, type: 'category' }
  }
  // Sempre usar logo como fallback final
  return { src: defaultLogo, type: 'logo' }
})

const pendingRequests = new Map()
const uncache = ref(0)

const emitLoadedEvent = () => {
  try {
    window.dispatchEvent(new CustomEvent('device-image-loaded', { detail: { id: props.id } }))
  } catch (e) { console.error('Erro ao emitir evento de carregamento da imagem do dispositivo:', e) }
}

const getImage64 = (image) => {
  return new Promise((resolve) => {
    const _tmp = document.createElement('img')
    _tmp.onload = () => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = _tmp.width
      canvas.height = _tmp.height
      context.drawImage(_tmp, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    _tmp.onerror = () => resolve(false)
    _tmp.src = image
  })
}

// debounce simples
const debounce = (fn, delay) => {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

const changeImage = () => {
  if (!props.allowUpload) return

  const file = document.createElement('input')
  file.type = 'file'
  file.accept = 'image/*'
  file.click()
  file.onchange = async () => {
    if (!file.files?.[0]) return
    isUploading.value = true
    try {
      const formData = new FormData()
      formData.append('deviceId', props.id)
      formData.append('image', file.files[0])

      await axios.post(`/tarkan/devices/${props.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      uncache.value = Date.now()

      await store.dispatch('devices/updateAttributes', {
        id: props.id,
        attributes: { hasImage: true, imageTimestamp: Date.now() }
      })

      const deviceRequestKey = `device-${props.id}`
      const devicePromise = getImage64(assetUrl(`images/${props.id}.png?uncache=${uncache.value}`))
      pendingRequests.set(deviceRequestKey, devicePromise)

      devicePromise
        .then((d) => {
          if (d) {
            isDeviceLoaded.value = true
            carImageData.value = d
            try {
              const device = store.getters['devices/getDevice'](props.id)
              const timestamp = device?.attributes?.imageTimestamp || Date.now()
              store.dispatch('imageCache/cacheDeviceImage', { id: props.id, imageData: d, timestamp })
            } catch (err) {
              console.warn('Erro ao cachear imagem de dispositivo:', err)
            }
          }
          isDeviceLoading.value = false
          pendingRequests.delete(deviceRequestKey)
        })
        .catch(() => {
          isDeviceLoading.value = false
          pendingRequests.delete(deviceRequestKey)
        })
    } catch (e) {
      console.error(e)
    } finally {
      isUploading.value = false
    }
  }
}

const loadImages = debounce(() => {
  try {
    const deviceId = props.id || 'default'
    const deviceCategory = props.category || 'default'

    let cachedDeviceImage = null
    let cachedCategoryImage = null

    const deviceForCache = store.getters['devices/getDevice'](deviceId)
    const currentTimestamp = deviceForCache?.attributes?.imageTimestamp
    const lastCachedTimestamp = store.state.imageCache?.deviceTimestamps?.[deviceId]

    if (currentTimestamp && lastCachedTimestamp && currentTimestamp !== lastCachedTimestamp) {
      try {
        if (store._actions?.['imageCache/removeDeviceImage']) {
          store.dispatch('imageCache/removeDeviceImage', deviceId)
        } else {
          store.dispatch('imageCache/clearDeviceImage', deviceId)
        }
      } catch (err) {
        console.warn('Error limpiando cache:', err)
      }
    } else {
      // ⚠️ imageCache módulo não está mais disponível, usar cache em memória local
      // Código legacy comentado para evitar erro:
      // cachedDeviceImage = store.getters['imageCache/getDeviceImage'](deviceId)
      // cachedCategoryImage = store.getters['imageCache/getCategoryImage'](deviceCategory)
      cachedDeviceImage = null
      cachedCategoryImage = null
    }

    if (!isDeviceLoaded.value && !isCategoryLoaded.value) {
      isDeviceLoading.value = true
      isCategoryLoading.value = true
    }

    let devicePromise, categoryPromise

    const device = store.getters['devices/getDevice'](deviceId)
    const hasImage = !!device?.attributes?.hasImage

    // DEVICE
    if (device?.attributes && device.attributes.hasImage === false) {
      isDeviceLoading.value = false
      isDeviceLoaded.value = false
      carImageData.value = null
      devicePromise = Promise.resolve(null)
    } else if (cachedDeviceImage) {
      isDeviceLoaded.value = true
      carImageData.value = cachedDeviceImage
      devicePromise = Promise.resolve(cachedDeviceImage)
      isDeviceLoading.value = false
    } else if (hasImage) {
      const deviceRequestKey = `device-${deviceId}`
      if (pendingRequests.has(deviceRequestKey)) {
        devicePromise = pendingRequests.get(deviceRequestKey)
      } else {
        const imageTimestamp = device?.attributes?.imageTimestamp || Date.now()
        const imageVersion = device?.attributes?.imageVersion || 0
        devicePromise = getImage64(
          assetUrl(`images/${deviceId}.png?t=${imageTimestamp}&v=${imageVersion}&r=${Math.random()}`)
        )
        pendingRequests.set(deviceRequestKey, devicePromise)

        devicePromise
          .then((d) => {
            if (d) {
              isDeviceLoaded.value = true
              carImageData.value = d
              try {
                const timestamp = device?.attributes?.imageTimestamp || Date.now()
                store.dispatch('imageCache/cacheDeviceImage', { id: deviceId, imageData: d, timestamp })
              } catch (err) {
                console.warn('Erro ao cachear imagem de dispositivo:', err)
              }
            }
            isDeviceLoading.value = false
            pendingRequests.delete(deviceRequestKey)
          })
          .catch(() => {
            isDeviceLoading.value = false
            pendingRequests.delete(deviceRequestKey)
          })
      }
    } else {
      isDeviceLoading.value = false
      devicePromise = Promise.resolve(null)
    }

    // CATEGORY
    if (cachedCategoryImage) {
      isCategoryLoaded.value = true
      catImageData.value = cachedCategoryImage
      categoryPromise = Promise.resolve(cachedCategoryImage)
      isCategoryLoading.value = false
    } else {
      const categoryRequestKey = `category-${deviceCategory}`
      if (pendingRequests.has(categoryRequestKey)) {
        categoryPromise = pendingRequests.get(categoryRequestKey)
      } else {
        categoryPromise = getImage64(categoryImageUrl(deviceCategory))
        pendingRequests.set(categoryRequestKey, categoryPromise)

        categoryPromise
          .then((d) => {
            if (d) {
              isCategoryLoaded.value = true
              catImageData.value = d
              try {
                store.dispatch('imageCache/cacheCategoryImage', { category: deviceCategory, imageData: d })
              } catch (err) {
                console.warn('Erro ao cachear imagem de categoria:', err)
              }
            }
            isCategoryLoading.value = false
            pendingRequests.delete(categoryRequestKey)
          })
          .catch(() => {
            isCategoryLoading.value = false
            pendingRequests.delete(categoryRequestKey)
          })
      }
    }

    // fallback anti-travar loading
    const fallbackTimer = setTimeout(() => {
      if (isDeviceLoading.value) isDeviceLoading.value = false
      if (isCategoryLoading.value) isCategoryLoading.value = false
      emitLoadedEvent()
    }, 5000)

    Promise.all([devicePromise || Promise.resolve(), categoryPromise || Promise.resolve()])
      .then(() => {
        clearTimeout(fallbackTimer)
        isDeviceLoading.value = false
        isCategoryLoading.value = false
        emitLoadedEvent()
      })
      .catch((err) => {
        clearTimeout(fallbackTimer)
        console.error('Erro ao carregar imagens:', err)
        isDeviceLoading.value = false
        isCategoryLoading.value = false
        emitLoadedEvent()
      })
  } catch (err) {
    console.error('Erro durante o carregamento de imagens:', err)
    isDeviceLoading.value = false
    isCategoryLoading.value = false
    emitLoadedEvent()
  }
}, 300)

// watchers
watch(() => props.id, () => loadImages())
watch(() => props.category, () => loadImages())
watch(() => props.refresher, () => loadImages())

watch(
  () => store.getters['devices/getDevice'](props.id)?.attributes?.imageVersion,
  (n, o) => {
    if (n && o && n !== o) {
      isDeviceLoaded.value = false
      carImageData.value = null
      try {
        if (store._actions?.['imageCache/removeDeviceImage']) {
          store.dispatch('imageCache/removeDeviceImage', props.id)
        } else {
          store.dispatch('imageCache/clearDeviceImage', props.id)
        }
      } catch (err) {
        console.warn('Error limpiando cache:', err)
      }
      loadImages()
    }
  }
)

watch(
  () => store.getters['devices/getDevice'](props.id)?.attributes?.imageTimestamp,
  (n, o) => {
    if (n && o && n !== o) {
      isDeviceLoaded.value = false
      carImageData.value = null
      try {
        if (store._actions?.['imageCache/removeDeviceImage']) {
          store.dispatch('imageCache/removeDeviceImage', props.id)
        } else {
          store.dispatch('imageCache/clearDeviceImage', props.id)
        }
      } catch (err) {
        console.warn('Error limpiando cache:', err)
      }
      loadImages()
    }
  }
)

watch(
  () => store.getters['devices/getDevice'](props.id)?.attributes?.hasImage,
  (n, o) => {
    if (o === true && n === false) {
      isDeviceLoaded.value = false
      carImageData.value = null
      try {
        if (store._actions?.['imageCache/removeDeviceImage']) {
          store.dispatch('imageCache/removeDeviceImage', props.id)
        } else {
          store.dispatch('imageCache/clearDeviceImage', props.id)
        }
      } catch (err) {
        console.warn('Error al limpiar cache:', err)
      }
      loadImages()
    } else if (o === false && n === true) {
      loadImages()
    }
  }
)

const handleDeviceAdded = () => loadImages()

onMounted(() => {
  loadImages()
  window.addEventListener('device-added', handleDeviceAdded)
})

onUnmounted(() => {
  window.removeEventListener('device-added', handleDeviceAdded)
  pendingRequests.clear()
})
</script>

<template>
  <div class="device-img-container" style="position: relative;">
    <!-- Loading indicator -->
    <div v-if="(isDeviceLoading && isCategoryLoading) || isUploading" class="loading-indicator">
      <img src="/img/pulse2.gif" alt="Carregando..." />
    </div>

    <!-- Imagem final (device > category > logo como fallback) -->
    <div v-else class="device-image" :class="displayImage.type">
      <img 
        :src="displayImage.src" 
        :alt="displayImage.type === 'logo' ? 'Logo' : (displayImage.type === 'device' ? 'Veículo' : 'Categoria')"
        style="width: 100%; height: 100%; object-fit: contain;"
      />
    </div>

    <!-- Overlay de upload -->
    <div v-if="allowUpload" @click="changeImage()" class="image-uploader-action">
      <div>Upload Image</div>
    </div>
  </div>
</template>

<style scoped>
.image-uploader-action{
  opacity: 0;
  background: rgba(0,0,0,0.5);
  width: calc(100% - 30px);
  height: calc(100% - 30px);
  position: absolute;
  left: 15px;
  top: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease-in-out;
  color: white;
  border-radius: 15px;
  z-index: 2;
  cursor: pointer;
}

.device-img-container:hover .image-uploader-action{
  opacity: 1;
}

.device-img-container{
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  overflow: hidden;
  border-radius: 15px;
}

.device-image {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.device-image img{
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: opacity .3s ease;
  border-radius: 15px;
}

.loading-indicator{ 
  opacity: .7; 
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

/* Estados específicos para cada tipo de imagem */
.device-image.device img{ opacity: 1; }
.device-image.category img{ opacity: .9; }
.device-image.logo img{ 
  opacity: .8; 
  filter: brightness(1.1);
}

/* Fallback para quando não há imagem */
.error{
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 24px;
}
</style>
