<template>
  <div v-if="deviceProp" class="device-card" :class="cardStatusClass" :data-testid="`device-item-${deviceProp.id}`" data-testid-type="device-item">
    <!-- Badge offline -->
    <div v-if="isOffline" class="offline-badge">OFFLINE</div>
    
    <!-- Header -->
    <div class="device-header" @contextmenu.prevent="">
      <!-- Lado esquerdo -->
      <div
        class="header-left"
        @click="emit('device-click', deviceProp.id)"
        @contextmenu.prevent="actContext($event)"
      >
        <!-- Nome + protocolo -->
        <div class="name-line">
          <span class="name">{{ deviceProp.name }}</span>
          <span
            v-if="position?.protocol"
            class="protocol"
            @click.stop="copyToClipboard(position.protocol)"
            @mouseenter.stop="showTip($event, KT('device.protocol'))"
            @mouseleave="hideTip"
          >
            <i class="fas fa-qrcode"></i> {{ position.protocol }}
          </span>
        </div>

        <!-- IMEI + Placa -->
        <div class="meta-info">
          <div v-if="deviceProp.uniqueId" class="meta-item">
            <span
              @click.stop="copyToClipboard(deviceProp.uniqueId)"
              @mouseenter.stop="showTip($event, KT('device.imei'))"
              @mouseleave="hideTip"
            >
              <i class="fas fa-barcode"></i> {{ deviceProp.uniqueId }}
            </span>
          </div>

          <div v-if="deviceProp.attributes?.placa" class="meta-item">
            <span
              @click.stop="copyToClipboard(deviceProp.attributes.placa)"
              @mouseenter.stop="showTip($event, KT('device.plate'))"
              @mouseleave="hideTip"
            >
              <i class="fas fa-id-card"></i> {{ deviceProp.attributes.placa }}
            </span>
          </div>
        </div>

        <!-- Endereço -->
        <div v-if="position" class="address">
          <i class="fas fa-map-marker-alt"></i>
          <div class="address-text" @mousedown.stop style="user-select: text;">
            <span v-if="position.address">{{ position.address }}</span>
            <span v-else-if="position.latitude != null && position.longitude != null">
              {{ position.latitude }}, {{ position.longitude }}
            </span>
            <span v-else>{{ KT('device.noPosition') }}</span>
          </div>
        </div>
        <div v-else class="no-position">
          <i class="fas fa-eye-slash"></i>
          <span>{{ KT('device.noPosition') }}</span>
        </div>

        <!-- Condutor -->
        <div v-if="driverId" class="driver-info">
          <div class="driver-container">
            <i class="far fa-id-card"></i> {{ driverId }}
            <span v-if="driverObj" class="driver-name">{{ driverObj.name }}</span>
          </div>
        </div>

        <!-- Última atualização -->
        <div v-if="position" class="last-update">
          <div class="time-item">
            <i class="far fa-clock"></i>
            <span :class="{ 'outdated': position.fixTime && isOutdated(position.fixTime) }">
              {{ position.fixTime ? new Date(position.fixTime).toLocaleString() : KT('device.new') }}
            </span>
            <span class="update-label">
              {{ deviceProp.lastUpdate ? getLastUpdated(deviceProp.lastUpdate, new Date()) : KT('device.new') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Lado direito -->
      <div class="header-right">
        <!-- Hodômetro -->
        <div class="distance">
          <i class="fas fa-road"></i>
          <div class="odometer">
            <div v-for="(digit, index) in odometerDigits" :key="index" class="digit">{{ digit }}</div>
            <span class="unit">{{ distanceUnit }}</span>
          </div>
        </div>

        <!-- Botões -->
        <div class="action-buttons">
          <!-- Anchor -->
          <div
            v-if="canAnchor"
            class="round-button anchor-button"
            :class="{ 'active': isAnchored }"
            role="button"
            tabindex="0"
            @click.stop="safeActAnchor(deviceProp.id)"
            @keydown.enter.space.prevent="safeActAnchor(deviceProp.id)"
            @mouseenter.stop="showTip($event, KT(!isAnchored ? 'actions.anchorEnable' : 'actions.anchorDisable'))"
            @mouseleave="hideTip"
            aria-label="Âncora"
          >
            <i class="fas fa-anchor"></i>
          </div>

          <!-- Unlock -->
          <div
            v-if="( (position && position.attributes?.blocked && canUnlock) || (lockUnlockEnabled && canUnlock) )"
            class="round-button unlock-button"
            :class="{ 'disabled': deviceProp.status === 'offline' }"
            role="button"
            tabindex="0"
            @click.stop="deviceProp.status !== 'offline' && actUnlock(deviceProp.id)"
            @keydown.enter.space.prevent="deviceProp.status !== 'offline' && actUnlock(deviceProp.id)"
            @mouseenter.stop="showTip($event, KT('actions.engineResume'))"
            @mouseleave="hideTip"
            aria-label="Desbloquear"
          >
            <i class="fas fa-unlock"></i>
          </div>

          <!-- Lock -->
          <div
            v-if="( (position && !position.attributes?.blocked && canLock) || (lockUnlockEnabled && canLock) )"
            class="round-button lock-button"
            :class="{ 'disabled': deviceProp.status === 'offline' }"
            role="button"
            tabindex="0"
            @click.stop="deviceProp.status !== 'offline' && actBlock(deviceProp.id)"
            @keydown.enter.space.prevent="deviceProp.status !== 'offline' && actBlock(deviceProp.id)"
            @mouseenter.stop="showTip($event, KT('actions.engineStop'))"
            @mouseleave="hideTip"
            aria-label="Bloquear"
          >
            <i class="fas fa-lock"></i>
          </div>

          <!-- Editar -->
          <div
            class="round-button edit-button"
            role="button"
            tabindex="0"
            @click.stop="openEdit(deviceProp.id)"
            @keydown.enter.space.prevent="openEdit(deviceProp.id)"
            @mouseenter.stop="showTip($event, KT('device.edit'))"
            @mouseleave="hideTip"
            aria-label="Editar"
          >
            <i class="fas fa-pencil-alt"></i>
          </div>

          <!-- Ir para o dispositivo -->
          <div
            class="round-button navigate-button"
            role="button"
            tabindex="0"
            @click.stop="safeMarkerClick(deviceProp.id)"
            @keydown.enter.space.prevent="safeMarkerClick(deviceProp.id)"
            @mouseenter.stop="showTip($event, KT('device.details'))"
            @mouseleave="hideTip"
            aria-label="Detalhes"
          >
            <i class="fas fa-car"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer: indicadores dinâmicos -->
    <div class="device-footer">
      <div class="indicators">
        <!-- Alarme -->
        <div v-if="position?.attributes?.alarm" class="indicator alarm pulse-animation">
          <i class="fas fa-exclamation-triangle"></i>
          <span>{{ position.attributes.alarm }}</span>
        </div>

        <!-- Indicadores dinâmicos -->
        <div class="footer-indicators" v-if="footerIndicators.length">
          <div
            v-for="ind in footerIndicators"
            :key="ind.key"
            class="dynamic-indicator"
            :class="ind.statusClass"
            @mouseenter.stop="showTip($event, ind.tooltip)"
            @mouseleave="hideTip"
          >
            <i :class="ind.icon" :style="{ color: ind.color }"></i>
            <span v-if="ind.value" :class="ind.valueClass">{{ ind.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="device-not-found">
    {{ KT('device.notLoaded') || 'Dispositivo não carregado...' }}
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits, inject, unref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElNotification, ElMessage } from 'element-plus'
import KT from '../tarkan/func/kt.js'

const props = defineProps({
  device: { type: Object, required: true }
})
const emit = defineEmits(['device-click'])

const store = useStore()
const router = useRouter()

/* Tips */
const showTip = (evt, text) => window.$showTip && window.$showTip(evt, text)
const hideTip = () => window.$hideTip && window.$hideTip()

/* Injections + fallbacks */
const runtimeApi = inject('runtimeApi', null)
const injectedMarkerClick = inject('markerClick', null)
const markerContext = inject('markerContext', null)
const editDeviceRef = inject('edit-device', null)
const actAnchor = inject('act-anchor', null)

/* Helpers seguros */
function safeMarkerClick(id) {
  if (typeof injectedMarkerClick === 'function') return injectedMarkerClick(id)
  router.push('/devices/' + id)
}

// Wrapper seguro para actAnchor (aceita função ou ref contendo função)
function safeActAnchor(id) {
  try {
    const fn = unref(actAnchor) // desembrulha ref se necessário
    if (typeof fn === 'function') return fn(id)
    console.warn('act-anchor não é uma função válida')
  } catch (e) {
    console.warn('Erro ao executar act-anchor:', e)
  }
}

/* Derivados principais */
const deviceProp = computed(() => props.device)
const position = computed(() =>
  deviceProp.value ? store.getters['devices/getPosition']?.(deviceProp.value.id) ?? null : null
)

const distanceUnit = computed(() =>
  store.getters['server/getAttribute']?.('distanceUnit', 'km') ?? 'km'
)
const speedUnit = computed(() =>
  store.getters['server/getAttribute']?.('speedUnit', 'kmh') ?? 'kmh'
)

/* Driver - REGRA PADRONIZADA */
const effectiveDriverId = computed(() => {
  const attrs = position.value?.attributes ?? {};
  const driverUniqueId = attrs.driverUniqueId || null;
  const rfid = attrs.rfid || null;
  const rfidStatus = attrs.rfidStatus || null;
  
  // Prioridade: driverUniqueId > rfid (SÓ SE VALID) > device fallback
  if (driverUniqueId) return driverUniqueId;
  if (rfid && rfidStatus === 'VALID') return rfid;
  if (deviceProp.value?.attributes?.driverUniqueId) return deviceProp.value.attributes.driverUniqueId;
  return null;
});
const driverId = computed(() => effectiveDriverId.value);
const driverObj = computed(() =>
  effectiveDriverId.value ? store.getters['drivers/getDriverByUniqueId']?.(effectiveDriverId.value) ?? null : null
);

/* Conversões de velocidade */
const speedKmh = computed(() => {
  const s = Number(position.value?.speed ?? 0)
  const kmh = Math.round(s * 1.852)
  if (speedUnit.value === 'mph') return Math.round(kmh * 0.621371)
  return kmh
})

/* Estado */
const movingAttr = computed(() => !!position.value?.attributes?.motion)
const isMoving = computed(
  () => (movingAttr.value || speedKmh.value > 6) && deviceProp.value.status === 'online'
)
const isStoppedOnline = computed(
  () => !movingAttr.value && speedKmh.value === 0 && deviceProp.value.status === 'online'
)

/* Permissões / recursos */
const canAnchor = computed(() => store.getters.advancedPermissions?.(9))
const canLock = computed(() => store.getters.advancedPermissions?.(10))
const canUnlock = computed(() => store.getters.advancedPermissions?.(11))
const lockUnlockEnabled = computed(() =>
  !!store.getters['server/getAttribute']?.('tarkan.enableLockUnlock')
)
const isAnchored = computed(() =>
  canAnchor.value
    ? !!store.getters['geofences/isAnchored']?.(deviceProp.value.id)
    : false
)
const isOffline = computed(() => deviceProp.value?.status === 'offline')

// Computed para odômetro otimizado
const odometerDigits = computed(() => {
  const totalDistance = position.value?.attributes?.totalDistance
  if (totalDistance == null) return ['0', '0', '0', '0', '0']
  
  const unit = distanceUnit.value
  let dist = 0
  if (typeof totalDistance === 'number') {
    if (unit === 'km') dist = Math.floor(totalDistance / 1000)
    else if (unit === 'mi') dist = Math.floor(totalDistance / 1609.34)
    else dist = Math.floor(totalDistance)
  }
  return String(dist).padStart(5, '0').slice(-5).split('')
})

/* Indicadores do footer */
const footerIndicators = computed(() => {
  const arr = []

  if (isMoving.value) {
    arr.push({ key: 'movement', icon: 'fas fa-running', color: '#22c55e', tooltip: KT('device.moving'), statusClass: 'moving' })
  } else if (isStoppedOnline.value) {
    arr.push({ key: 'stopped', icon: 'fas fa-pause', color: '#eab308', tooltip: KT('device.stopped'), statusClass: 'stopped' })
  } else if (deviceProp.value.status === 'offline') {
    arr.push({ key: 'offline', icon: 'fas fa-power-off', color: '#ef4444', tooltip: KT('device.offline'), statusClass: 'offline' })
  }

  if (position.value?.attributes?.ignition !== undefined) {
    const on = !!position.value.attributes.ignition
    arr.push({
      key: 'ignition',
      icon: 'fas fa-key',
      color: on ? '#22c55e' : '#6b7280',
      tooltip: on ? KT('device.ignitionOn') : KT('device.ignitionOff'),
      statusClass: on ? 'ignition-on' : 'ignition-off'
    })
  }

  if (position.value?.attributes?.blocked !== undefined) {
    const b = !!position.value.attributes.blocked
    arr.push({
      key: 'lock',
      icon: b ? 'fas fa-lock' : 'fas fa-lock-open',
      color: b ? '#ef4444' : '#22c55e',
      tooltip: b ? KT('device.blocked') : KT('device.unblocked'),
      statusClass: b ? 'blocked' : 'unblocked'
    })
  }

  if (canAnchor.value) {
    arr.push({
      key: 'anchor',
      icon: 'fas fa-anchor',
      color: isAnchored.value ? '#3b82f6' : '#6b7280',
      tooltip: isAnchored.value ? KT('device.anchored') : KT('device.notAnchored'),
      statusClass: isAnchored.value ? 'anchored' : 'not-anchored'
    })
  }

  const sp = speedKmh.value
  // PR-09B: Leitura padronizada de speedLimit (preferir speedLimitKmh)
  const speedLimitKmh = Number(deviceProp.value?.attributes?.speedLimitKmh ?? deviceProp.value?.attributes?.speedLimit ?? 0);
  const overLimit = speedLimitKmh > 0 && sp > speedLimitKmh;
  const su = speedUnit.value === 'mph' ? 'mph' : 'km/h'
  
  // PR-09C: Badge com formatação consistente do limite de velocidade
  const speedLimitBadge = speedLimitKmh > 0 
    ? `Limite: ${speedLimitKmh} km/h` 
    : 'Sem limite';
  
  arr.push({
    key: 'speed',
    icon: 'fas fa-tachometer-alt',
    color: overLimit ? '#ef4444' : '#3b82f6',
    value: `${sp} ${su}`,
    tooltip: `Velocidade: ${sp} ${su} | ${speedLimitBadge}`,
    statusClass: overLimit ? 'speed-indicator over-speed-limit' : 'speed-indicator',
    valueClass: overLimit ? 'over-limit' : ''
  })

  if (position.value?.attributes?.rssi != null) {
    const rssi = Number(position.value.attributes.rssi)
    let color = '#ef4444'
    if (rssi > -70) color = '#22c55e'
    else if (rssi > -85) color = '#eab308'
    arr.push({ key: 'signal', icon: 'fas fa-signal', color, value: rssi, tooltip: `Sinal: ${rssi}`, statusClass: 'signal-indicator' })
  }

  if (position.value?.attributes?.sat != null) {
    const sat = Number(position.value.attributes.sat)
    let color = '#ef4444'
    if (sat >= 4) color = '#22c55e'
    else if (sat >= 3) color = '#eab308'
    arr.push({ key: 'satellites', icon: 'fas fa-satellite', color, value: sat, tooltip: `Satélites: ${sat}`, statusClass: 'satellite-indicator' })
  }

  if (position.value?.attributes?.power != null) {
    const power = Number(position.value.attributes.power)
    let color = '#ef4444'
    if (power >= 12.5) color = '#22c55e'
    else if (power >= 11.5) color = '#eab308'
    arr.push({ key: 'power', icon: 'fas fa-car-battery', color, value: `${power.toFixed(1)}v`, tooltip: `Energia: ${power.toFixed(1)}v`, statusClass: 'power-indicator' })
  }

  if (position.value?.attributes?.battery != null) {
    const bat = Number(position.value.attributes.battery)
    let color = '#ef4444'
    if (bat >= 3.7) color = '#22c55e'
    else if (bat >= 3.2) color = '#eab308'
    arr.push({ key: 'battery', icon: 'fas fa-battery-full', color, value: `${bat.toFixed(1)}v`, tooltip: `Bateria: ${bat.toFixed(1)}v`, statusClass: 'battery-indicator' })
  }

  if (position.value?.attributes?.fuel != null) {
    const fuel = Math.round(Number(position.value.attributes.fuel))
    let color = '#ef4444'
    if (fuel >= 50) color = '#22c55e'
    else if (fuel >= 25) color = '#eab308'
    arr.push({ key: 'fuel', icon: 'fas fa-gas-pump', color, value: `${fuel}%`, tooltip: `Combustível: ${fuel}%`, statusClass: 'fuel-indicator' })
  }

  if (position.value?.attributes?.coolantTemperature != null) {
    const temp = Number(position.value.attributes.coolantTemperature)
    let color = '#22c55e'
    if (temp > 100) color = '#ef4444'
    else if (temp > 90) color = '#eab308'
    arr.push({ key: 'coolantTemp', icon: 'fas fa-thermometer-full', color, value: `${temp}°C`, tooltip: `Temperatura do Motor: ${temp}°C`, statusClass: 'temperature-indicator' })
  }

  if (position.value?.attributes?.rpm != null) {
    const rpm = Number(position.value.attributes.rpm)
    let color = '#22c55e'
    if (rpm > 4000) color = '#ef4444'
    else if (rpm > 3000) color = '#eab308'
    arr.push({ key: 'rpm', icon: 'fas fa-tachometer-alt', color, value: `${rpm}`, tooltip: `RPM: ${rpm}`, statusClass: 'rpm-indicator' })
  }

  if (position.value?.attributes?.oilPressure != null) {
    const pressure = Number(position.value.attributes.oilPressure)
    let color = '#ef4444'
    if (pressure >= 20) color = '#22c55e'
    else if (pressure >= 10) color = '#eab308'
    arr.push({ key: 'oilPressure', icon: 'fas fa-oil-can', color, value: `${pressure} psi`, tooltip: `Pressão do Óleo: ${pressure} psi`, statusClass: 'oil-pressure-indicator' })
  }

  if (position.value?.attributes?.adBlue != null) {
    const adBlue = Math.round(Number(position.value.attributes.adBlue))
    let color = '#ef4444'
    if (adBlue >= 50) color = '#22c55e'
    else if (adBlue >= 25) color = '#eab308'
    arr.push({ key: 'adBlue', icon: 'fas fa-flask', color, value: `${adBlue}%`, tooltip: `AdBlue: ${adBlue}%`, statusClass: 'adblue-indicator' })
  }

  if (position.value?.attributes?.temperature != null) {
    const temp = Number(position.value.attributes.temperature)
    let color = '#22c55e'
    if (temp > 35 || temp < -10) color = '#ef4444'
    else if (temp > 30 || temp < 0) color = '#eab308'
    arr.push({ key: 'ambientTemp', icon: 'fas fa-thermometer-half', color, value: `${temp}°C`, tooltip: `Temperatura Ambiente: ${temp}°C`, statusClass: 'ambient-temp-indicator' })
  }

  if (position.value?.attributes?.alternatorVoltage != null) {
    const voltage = Number(position.value.attributes.alternatorVoltage)
    let color = '#ef4444'
    if (voltage >= 13.5 && voltage <= 14.5) color = '#22c55e'
    else if (voltage >= 12.5 && voltage <= 15.0) color = '#eab308'
    arr.push({ key: 'alternator', icon: 'fas fa-bolt', color, value: `${voltage.toFixed(1)}V`, tooltip: `Alternador: ${voltage.toFixed(1)}V`, statusClass: 'alternator-indicator' })
  }

  return arr
})

/* Classe do card */
const cardStatusClass = computed(() => {
  if (isMoving.value) return 'card-moving'
  if (isStoppedOnline.value) return 'card-online'
  if (deviceProp.value.status === 'offline') return 'card-offline'
  return 'card-unknown'
})

/* Ações */
function openEdit(id) {
  try {
    if (editDeviceRef?.editDevice) editDeviceRef.editDevice(id ?? deviceProp.value.id)
    else if (editDeviceRef?.value?.editDevice) editDeviceRef.value.editDevice(id ?? deviceProp.value.id)
    else console.warn('edit-device indisponível')
  } catch (e) {
    console.warn('Falha ao abrir editor', e)
  }
}

function isOutdated(date) {
  if (!date) return false
  return Date.now() - new Date(date).getTime() > 24 * 60 * 60 * 1000
}

async function actBlock(deviceId) {
  if (isOffline.value) return
  try {
    if (!runtimeApi) {
      throw new Error('Runtime API não disponível. Recarregue a página.')
    }
    const dv = store.getters['devices/getDevice']?.(deviceId)
    if (!dv) {
      ElMessage.error(KT('device.notLoaded') || 'Dispositivo não encontrado')
      return
    }
    const resp = await runtimeApi.getAvailableCommands(parseInt(deviceId))
    const list = resp.data || []
    await ElMessageBox.confirm(
      KT('device.questio_bloked') + dv.name + ' (IMEI ' + (dv.uniqueId || '—') + ')?',
      KT('device.question_yesblocked'),
      { confirmButtonText: KT('OK'), cancelButtonText: KT('Cancel'), type: 'warning' }
    )
    const changeNative = list.find(a => a.attributes?.['tarkan.changeNative'] === 'engineStop')
    await runtimeApi.sendCommand(changeNative ? { ...changeNative, deviceId } : { deviceId, type: 'engineStop' })
    ElNotification({ title: KT('device.success'), message: KT('device.command_sent'), type: 'success' })
  } catch (e) {
    if (e === 'cancel' || e === 'close') return ElMessage.info(KT('action_cancel'))
    console.warn('Falha ao enviar comando de bloqueio', e)
    ElMessage.error(KT('device.command_failed') || 'Falha ao enviar comando')
  }
}

async function actUnlock(deviceId) {
  if (isOffline.value) return
  try {
    if (!runtimeApi) {
      throw new Error('Runtime API não disponível. Recarregue a página.')
    }
    const dv = store.getters['devices/getDevice']?.(deviceId)
    if (!dv) {
      ElMessage.error(KT('device.notLoaded') || 'Dispositivo não encontrado')
      return
    }
    const resp = await runtimeApi.getAvailableCommands(parseInt(deviceId))
    const list = resp.data || []
    await ElMessageBox.confirm(
      KT('device.question_blocked') + dv.name + ' (IMEI ' + (dv.uniqueId || '—') + ')?',
      KT('device.question_noblocked'),
      { confirmButtonText: KT('OK'), cancelButtonText: KT('Cancel'), type: 'warning' }
    )
    const changeNative = list.find(a => a.attributes?.['tarkan.changeNative'] === 'engineResume')
    await runtimeApi.sendCommand(changeNative ? { ...changeNative, deviceId } : { deviceId, type: 'engineResume' })
    ElNotification({ title: KT('device.success'), message: KT('device.command_sent'), type: 'success' })
  } catch (e) {
    if (e === 'cancel' || e === 'close') return ElMessage.info(KT('action_cancel'))
    console.warn('Falha ao enviar comando de desbloqueio', e)
    ElMessage.error(KT('device.command_failed') || 'Falha ao enviar comando')
  }
}

/* Context menu */
function actContext(e) {
  if (typeof markerContext === 'function') {
    const fakeEvent = { originalEvent: e, target: { options: { id: deviceProp.value.id } } }
    return markerContext(fakeEvent, deviceProp.value.id)
  }
}

/* “Atualizado há …” */
function getLastUpdated(t, tt) {
  if (t == null) return KT('new')
  tt = tt || new Date()
  const diff = Math.round((new Date(tt).getTime() - new Date(t).getTime()) / 1000)
  if (diff < 0) return KT('now')
  if (diff >= 86400) return `${Math.floor(diff / 86400)} ${KT('days')}`
  if (diff >= 3600) return `${Math.floor(diff / 3600)} ${KT('hours')}`
  if (diff >= 60) return `${Math.floor(diff / 60)} ${KT('minutes')}`
  return KT('lessMinute')
}

/* Clipboard */
function copyToClipboard(text) {
  navigator.clipboard.writeText(String(text)).then(() => {
    ElMessage({ message: KT('copied_to_clipboard'), type: 'success', duration: 2000 })
  }).catch(() => {
    ElMessage({ message: KT('copy_failed'), type: 'error', duration: 2000 })
  })
}
</script>

<style scoped>
/* ===== Card base ===== */
.device-card {
  --radius: 12px;
  --border: #d1d5db;
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-hover: 0 2px 8px rgba(0,0,0,0.15);

  position: relative;
  display: flex;
  flex-direction: column;

  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: box-shadow .2s ease, border-color .2s ease;

  /* antes: height/max-height fixos -> cortava no mobile */
  min-height: 140px;
  height: auto;

  /* ESPAÇAMENTO ENTRE CARDS (reduzido) */
  margin-bottom: 6px;
}
.device-card:last-child { margin-bottom: 0; }

.device-card:hover {
  box-shadow: var(--shadow-hover);
  border-color: #9ca3af;
}

/* Faixa lateral com cantos perfeitos */
.device-card::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: var(--status-color, #f59e0b);
}

/* cores da faixa (mantidas) */
.device-card.card-online  { --status-color: #22c55e; }
.device-card.card-offline { --status-color: #ef4444; }
.device-card.card-moving  { --status-color: #3b82f6; }
.device-card.card-unknown { --status-color: #f59e0b; }

/* Badge offline discreto */
.offline-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #fff;
  background-color: #ef4444;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(239, 68, 68, 0.3);
  pointer-events: none;
}

/* ===== Header ===== */
.device-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  flex: 1 1 auto;
  box-shadow: inset 0 -1px 0 #e5e7eb;
}

.header-left {
  flex: 0.7;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding-left: 6px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color .2s ease, transform .1s ease;
}
.header-left:hover { background-color: rgba(0,0,0,.02); }
.header-left:active {
  transform: scale(0.995);
  transition: transform .08s ease;
}

.header-right {
  flex: 0.3;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 4px;
  padding-right: 6px;
}

/* Nome + protocolo */
.name-line { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
.name {
  font-weight: 700; font-size: 14px; color: #111827;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.2;
  flex: 1; min-width: 0;
}
.protocol {
  font-size: 10px; color: var(--el-color-info); background: var(--el-color-info-light-9);
  padding: 1px 4px; border-radius: 3px; cursor: copy; transition: all .2s ease;
  white-space: nowrap; flex-shrink: 0;
}
.protocol:hover { background: var(--el-color-info-light-7); color: var(--el-color-info-dark-2); }
.protocol i { margin-right: 2px; font-size: 9px; }

/* IMEI + Placa */
.meta-info { display: flex; flex-wrap: wrap; gap: 4px; font-size: 10px; }
.meta-item {
  padding: 1px 4px; background-color: #f3f4f6; border-radius: 3px; color: #374151;
  white-space: nowrap; cursor: copy; transition: background-color .2s ease;
}
.meta-item:hover { background-color: #e5e7eb; }
.meta-item i { margin-right: 3px; color: #6b7280; }

/* Endereço — sem altura fixa pra não cortar */
.address {
  display: flex; align-items: flex-start; gap: 6px;
  color: #3b82f6; font-size: 11px; line-height: 1.35;
  max-width: calc(100% - 20px);
}
.address i { flex-shrink: 0; margin-top: 2px; }
.address-text {
  overflow: hidden;
  word-wrap: break-word; word-break: break-word; hyphens: auto;
  /* antes tinha min/max-height; removi para o conteúdo crescer */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;      /* até 3 linhas no desktop */
}

/* Quando não tem posição */
.no-position { color: #6b7280; font-size: 11px; display: flex; align-items: center; gap: 6px; }

/* Condutor */
.driver-info { font-size: 11px; color: #6c757d; }
.driver-container { display: flex; align-items: center; gap: 4px; }
.driver-name {
  font-weight: 500; color: #007bff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px;
}

/* Última atualização */
.last-update { font-size: 10px; color: #4b5563; }
.time-item { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.time-item .outdated { color: #ef4444; }
.update-label { font-weight: 500; color: #28a745; margin-left: 8px; }

/* ===== Hodômetro ===== */
.distance { display: flex; align-items: center; gap: 4px; font-size: 10px; }
.distance i { color: #6c757d; }
.odometer { display: flex; align-items: center; gap: 1px; }
.digit {
  background-color: #f3f4f6; color: #111827;
  padding: 1px 3px; border-radius: 2px; font-size: 9px; font-weight: 600;
  border: 1px solid #e5e7eb; min-width: 8px; text-align: center;
}
.unit { margin-left: 2px; font-size: 8px; color: #6b7280; }

/* ===== Botões de ação ===== */
.action-buttons { display: flex; gap: 4px; align-items: center; justify-content: flex-end; }
.round-button {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: transform .1s ease, box-shadow .2s ease, background-color .2s ease;
  position: relative;
  border: 1px solid #e5e7eb; background-color: #fff; font-size: 11px;
}
.round-button:hover { transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,.1); }
.round-button:active { transform: translateY(0); }
.round-button:focus-visible {
  outline: 2px solid rgba(59,130,246,.6);
  outline-offset: 2px;
}
.round-button.disabled { opacity: .5; cursor: not-allowed; pointer-events: none; }

/* Cores específicas */
.anchor-button { color: #2563eb; border-color: #2563eb; }
.anchor-button.active { background-color: #2563eb; color: #fff; }
.anchor-button:hover:not(.disabled) { background-color: #eff6ff; }
.anchor-button.active:hover { background-color: #1d4ed8; }

.unlock-button { color: #16a34a; border-color: #16a34a; }
.unlock-button:hover:not(.disabled) { background-color: #f0fdf4; }

.lock-button { color: #dc2626; border-color: #dc2626; }
.lock-button:hover:not(.disabled) { background-color: #fef2f2; }

.edit-button { color: #2563eb; border-color: #2563eb; }
.edit-button:hover:not(.disabled) { background-color: #eff6ff; }

.navigate-button { color: #ea580c; border-color: #ea580c; }
.navigate-button:hover:not(.disabled) { background-color: #fff7ed; }

/* ===== Footer / Indicadores ===== */
.device-footer {
  background: #ffffff;
  box-shadow: inset 0 1px 0 #e5e7eb;
  padding: 6px 10px;
  width: 100%;
  box-sizing: border-box;
  flex: 0 0 auto;
}
.footer-indicators {
  display: flex; align-items: center; gap: 4px; width: 100%;
  flex-wrap: wrap; justify-content: flex-start;
}
.dynamic-indicator {
  display: flex; align-items: center; gap: 3px;
  padding: 2px 5px; border-radius: 4px; cursor: pointer; transition: all .2s ease;
  background: #f8fafc; border: 1px solid #e2e8f0; flex-shrink: 0; font-size: 10px;
}
.dynamic-indicator:hover { background: #f1f5f9; border-color: #cbd5e1; }
.dynamic-indicator i { font-size: 11px; transition: color .2s ease; }
.dynamic-indicator span { font-size: 10px; font-weight: 500; color: #374151; white-space: nowrap; }

/* Destaques e OFFLINE em vermelho */
.dynamic-indicator.speed-indicator span.over-limit { color: #ef4444; animation: indicator-blink 1s infinite; }
.dynamic-indicator.offline {
  background: #fef2f2;         /* fundo vermelho claro */
  border-color: #fecaca;
}
.dynamic-indicator.offline i,
.dynamic-indicator.offline span { color: #ef4444 !important; }

/* Alarme */
.indicator.alarm {
  background-color: #dc3545; color: #fff; padding: 6px 12px; border-radius: 20px;
  font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 6px; align-self: flex-start;
}
.pulse-animation { animation: pulse-alarm 1.5s infinite; }

/* ===== Animações ===== */
@keyframes indicator-blink { 0%,50%{opacity:1} 51%,100%{opacity:.5} }
@keyframes pulse-alarm { 0%{box-shadow:0 0 0 0 rgba(220,53,69,.7)} 70%{box-shadow:0 0 0 10px rgba(220,53,69,0)} 100%{box-shadow:0 0 0 0 rgba(220,53,69,0)} }

/* ===== Compactar listas com gap (se o contêiner usar gap) ===== */
.devices-page .cards,
.devices-page .device-list,
.devices-page .devices-list {
  gap: 6px;
  row-gap: 6px;
}

/* ===== Responsivo ===== */
@media (max-width: 640px) {
  .device-card { min-height: 135px; margin-bottom: 4px; }
  .device-header { gap: 6px; }
  .header-left { flex: .55; }
  .header-right { flex: .45; }

  .name { font-size: 13px; }

  /* no mobile, até 4 linhas se precisar */
  .address-text { 
    -webkit-line-clamp: 4;
    line-clamp: 4; 
  }

  .round-button { width: 26px; height: 26px; font-size: 10px; }
  .digit { min-width: 7px; font-size: 8px; }

  .devices-page .cards,
  .devices-page .device-list,
  .devices-page .devices-list {
    gap: 4px;
    row-gap: 4px;
  }
}
</style>
