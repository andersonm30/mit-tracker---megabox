<template>
  <!-- Loading Progress -->
  <div v-if="!store.getters['server/isReady']" class="global-loading-bar">
    <el-progress :percentage="100" :indeterminate="true" :duration="2" :show-text="false" :color="primaryColor" />
  </div>

  <context-menu ref="contextMenuRef"></context-menu>
  <showtip></showtip>

  <!-- WhatsApp Button (fixed + safe-area para não sumir em iPhones) -->
  <a
    v-if="whatsappNumber && whatsappNumber !== ''"
    :href="'https://wa.me/' + whatsappNumber"
    class="whatsapp-float"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Abrir conversa no WhatsApp"
  >
    <img src="img/whatsapp.png" alt="WhatsApp" />
  </a>

  <!-- Componentes que dependem de auth (modais e editores) -->
  <template v-if="store.state.auth">
    <!-- IFTRUE_myFlag -->
    <edit-calendars ref="editCalendarsRef"></edit-calendars>
    <link-objects ref="linkObjectsRef"></link-objects>
    <log-objects ref="logObjectsRef"></log-objects>

    <edit-share ref="editShareRef"></edit-share>
    <edit-shares ref="editSharesRef"></edit-shares>

    <edit-group ref="editGroupRef"></edit-group>
    <edit-users ref="editUsersRef"></edit-users>
    <edit-server ref="editServerRef"></edit-server>
    <edit-drivers ref="editDriversRef"></edit-drivers>
    <edit-maintenances ref="editMaintenancesRef"></edit-maintenances>
    <edit-theme ref="editThemeRef"></edit-theme>
    <show-invoices ref="invoicesRef"></show-invoices>
    <show-invoices-manager ref="invoicesManagerRef"></show-invoices-manager>
    <edit-integrations ref="integrationsRef"></edit-integrations>
    <edit-events ref="editEventsRef"></edit-events>
    <!-- FITRUE_myFlag -->

    <edit-user ref="editUserRef"></edit-user>
    <edit-notifications ref="editNotificationsRef"></edit-notifications>
    <edit-device ref="editDeviceRef"></edit-device>
    <qr-device ref="qrDeviceRef"></qr-device>
    <show-graphic ref="showGraphicsRef"></show-graphic>
    <user-notice-modal ref="userNoticeModalRef"></user-notice-modal>

    <!-- ========== MODAL UNIFICADO DE CONFIRMAÇÃO ========== -->
    <ConfirmSliderModal
      v-model="showConfirmModal"
      :device="currentDevice"
      :mode="currentModalMode"
      :loading="commandLoading"
      :title="modalConfig.title"
      :title-icon="modalConfig.titleIcon"
      :warning-title="modalConfig.warningTitle"
      :warning-text="modalConfig.warningText"
      :confirm-label="modalConfig.confirmLabel"
      :slider-label="modalConfig.sliderLabel"
      :icon-class="modalConfig.iconClass"
      :color-variant="modalConfig.colorVariant"
      :rtl="modalConfig.rtl"
      :allow-click-outside="currentModalMode !== 'delete'"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />

    <!-- Indicador de conexão (fora do inert para sempre aparecer) -->
    <div v-if="!isOnline" class="connection-status offline">
      <i class="fas fa-wifi-slash" aria-hidden="true"></i>
      <span>Sem conexão</span>
    </div>

    <!-- ===== HEADER: SEMPRE ATIVO (fora do inert) ===== -->
    <div id="head">
      <div id="btnmenu" v-if="shouldShowHamburger" @click.stop="toggleMenu" 
        :aria-label="isMenuOverlayOpen ? 'Fechar menu' : 'Abrir menu'"
        :class="{ 'menu-active': isMenuOverlayOpen }">
        <i :class="isMenuOverlayOpen ? 'fas fa-times' : 'fas fa-bars'" aria-hidden="true"></i>
      </div>

      <div id="logo">
        <img v-if="headLogo?.image" src="/tarkan/assets/custom/logo.png"
          @click="$router.push('/')" style="width: 11rem; cursor: pointer;" alt="Logo" />
        <div v-else style="font-weight: bold; text-transform: uppercase; font-family: montserrat, roboto;">
          <a @click.prevent="$router.push('/')"
            style="cursor: pointer; color: var(--el-text-color-primary); text-decoration: none;"
            aria-label="Ir para a página inicial">
            {{ headLogo?.text || '' }}
          </a>
        </div>
      </div>

      <div style="display: flex;">
        <el-tooltip :content="(store.state.events.mute) ? 'Ouvir Notificações' : 'Silenciar Notificações'">
          <div id="mute" @click="store.dispatch('events/toggleMute')"
            style="cursor: pointer; font-size: 1.2rem; margin: 0.3rem 0.5rem;"
            aria-label="Alternar som de notificações">
            <span v-if="store.state.events.mute">
              <i class="fas fa-volume-mute" style="color: silver;" aria-hidden="true"></i>
            </span>
            <span v-else>
              <i class="fas fa-volume-up" aria-hidden="true"></i>
            </span>
          </div>
        </el-tooltip>

        <push-notification-btn v-if="store.state.auth"></push-notification-btn>

        <div id="user" @click="userMenu($event)" style="cursor: pointer;" aria-label="Abrir menu do usuário">
          <div class="uname" v-if="store.state.auth && !store.state.auth.attributes['isShared']"
            style="font-size: 0.8rem; margin: 0.5rem 0.5rem;">
            {{ store.state.auth.name }}
          </div>

          <div class="uname" v-else style="text-align: right; font-size: 1.4rem; margin: 0.3rem 0.5rem;">
            <div style="font-size: 0.3rem;">Expira em:</div>
            <div style="font-size: 0.5rem">{{ store.getters.expiresCountDown }}</div>
          </div>

          <i style="font-size: 1.4rem; margin: 0.3rem 0.5rem;" class="fas fa-user-circle" aria-hidden="true"></i>
        </div>
      </div>
    </div>

    <div id="content">
      <template v-if="store.getters['isDriver']">
        <router-view></router-view>
      </template>

      <template v-else>
        <!-- ===== MENU: SEMPRE ATIVO (fora do inert) ===== -->
        <div id="menu" v-if="shouldRenderMenu" :class="{ isopen: effectiveMenuOpen, 'sidebar-closed': sidebarClosed }">
          <ul>
            <router-link v-if="store.getters.advancedPermissions(8)" to="/devices" custom
              v-slot="{ href, navigate, isActive, isExactActive }">
              <li :class="{ active: isActive || isExactActive, 'exact-active': isExactActive }">
                <a :href="href" @click.prevent="onMenuItemClick(navigate)" :aria-label="$t('menu.devices')">
                  <el-icon><i class="fas fa-location-arrow" aria-hidden="true"></i></el-icon>
                  <span class="text">{{ $t('menu.devices') }}</span>
                </a>
              </li>
            </router-link>

            <router-link v-if="store.getters.advancedPermissions(72)" to="/reports" custom
              v-slot="{ href, navigate, isActive, isExactActive }">
              <li :class="{ active: isActive, 'exact-active': isExactActive }">
                <a :href="href" @click.prevent="onMenuItemClick(navigate)" :aria-label="$t('menu.reports')">
                  <el-icon><i class="fas fa-chart-bar" aria-hidden="true"></i></el-icon>
                  <span class="text">{{ $t('menu.reports') }}</span>
                </a>
              </li>
            </router-link>

            <router-link v-if="store.getters.advancedPermissions(40)" to="/geofence" custom
              v-slot="{ href, navigate, isActive, isExactActive }">
              <li :class="{ active: isActive, 'exact-active': isExactActive }">
                <a :href="href" @click.prevent="onMenuItemClick(navigate)" :aria-label="$t('menu.geofence')">
                  <el-icon><i class="fas fa-draw-polygon" aria-hidden="true"></i></el-icon>
                  <span class="text">{{ $t('menu.geofence') }}</span>
                </a>
              </li>
            </router-link>

            <router-link v-if="store.getters.advancedPermissions(56)" to="/commands" custom
              v-slot="{ href, navigate, isActive, isExactActive }">
              <li :class="{ active: isActive, 'exact-active': isExactActive }">
                <a :href="href" @click.prevent="onMenuItemClick(navigate)" :aria-label="$t('menu.commands')">
                  <el-icon><i class="far fa-keyboard" aria-hidden="true"></i></el-icon>
                  <span class="text">{{ $t('menu.commands') }}</span>
                </a>
              </li>
            </router-link>

            <router-link v-if="store.getters.advancedPermissions(48)" to="/groups" custom
              v-slot="{ href, navigate, isActive, isExactActive }">
              <li :class="{ active: isActive, 'exact-active': isExactActive }">
                <a :href="href" @click.prevent="onMenuItemClick(navigate)" :aria-label="$t('menu.groups')">
                  <el-icon><i class="far fa-object-group" aria-hidden="true"></i></el-icon>
                  <span class="text">{{ $t('menu.groups') }}</span>
                </a>
              </li>
            </router-link>

            <router-link to="/notifications" custom v-slot="{ href, navigate, isActive, isExactActive }">
              <li :class="{ active: isActive, 'exact-active': isExactActive }">
                <a :href="href" @click.prevent="onMenuItemClick(navigate)" :aria-label="$t('menu.notifications')">
                  <el-icon><i class="fas fa-bell" aria-hidden="true"></i></el-icon>
                  <span class="text">{{ $t('menu.notifications') }}</span>
                </a>
              </li>
            </router-link>

            <div class="indicator"></div>
          </ul>

          <div id="version">
            <template v-if="store.state.server?.serverInfo?.version">
              {{ $t('version') }}@ {{ store.state.server.serverInfo.version || '-' }}
            </template>
          </div>

        </div>

        <!-- ===== Wrapper inert: SOMENTE painel e mapa ficam bloqueados quando modal aberto ===== -->
        <div class="inert-wrap" v-bind="modalOpen ? { inert: '' } : {}" :aria-hidden="modalOpen ? 'true' : 'false'">
          <!-- PAINEL LATERAL -->
          <div id="open" :class="{
            minimized: minimized,
            bottom: ($route.meta.mobileBottom),
            mobileExpanded: mobileExpand,
            shown: ($route.meta.shown),
            editing: store.state.geofences.mapEditing,
            allowExpand: $route.meta.allowExpand,
            expanded: ($route.meta.allowExpand && $route.query.expand === 'true')
          }">
            <div style="width: calc(100%);" :style="{ display: (store.state.geofences.mapEditing) ? 'none' : '' }">
              <div id="heading">
                <span @click="onOpenBack" aria-label="Voltar"><i class="fas fa-angle-double-left"
                    aria-hidden="true"></i></span>
                {{ KT($route.meta.title || 'page') }}
                <span @click="onOpenClose" aria-label="Fechar"><i class="fas fa-times-circle"
                    aria-hidden="true"></i></span>
              </div>

              <div v-if="($route.meta.mobileBottom)" @click="minimized = !minimized" class="showOnMobile"
                style="position: absolute; right: 35px; top: 5px; font-size: 18px;" aria-label="Minimizar painel">
                <i class="fas fa-window-minimize" aria-hidden="true"></i>
              </div>

              <div v-if="($route.meta.mobileBottom)" @click="onOpenClose" class="showOnMobile"
                style="position: absolute; right: 5px; top: 5px; font-size: 18px;" aria-label="Fechar painel">
                <i class="fas fa-times-circle" aria-hidden="true"></i>
              </div>

              <div v-if="($route.meta.mobileBottom)" id="expander" @click="mobileExpand = !mobileExpand"
                aria-label="Alternar expansão do painel">
                <span v-if="!mobileExpand"><i class="fas fa-angle-double-up" aria-hidden="true"></i></span>
                <span v-else><i class="fas fa-angle-double-down" aria-hidden="true"></i></span>
              </div>

              <div id="rv"><router-view></router-view></div>
            </div>

            <div v-if="store.state.geofences.mapEditing">
              <div style="padding: 10px;"><el-button @click="store.dispatch('geofences/disableEditing')"
                  type="primary">Concluir</el-button></div>
              <div style="padding: 10px;"><el-button @click="store.dispatch('geofences/disableEditing')" type="danger"
                  plain>{{
                  KT('Cancel') }}</el-button></div>
            </div>

            <div v-if="$route.meta.allowExpand" class="expandBtn"
              @click="$router.push({ query: { ...$route.query, expand: ($route.query.expand === 'true' ? 'false' : 'true') } })"
              aria-label="Expandir painel">
              <i class="fas fa-angle-double-right" aria-hidden="true"></i>
            </div>
          </div>

          <!-- SCRIM: fecha menu ao clicar fora (mesmo com iframe) -->
          <div v-if="isMenuOverlayOpen" class="menu-scrim" @click="closeMobileMenu()" aria-hidden="true" />

          <!-- MAPA -->
          <div id="main" @click="handleMainClick" :class="{
            'sidebar-closed': sidebarClosed,
            menuShown: effectiveMenuOpen,
            editing: store.state.geofences.mapEditing,
            minimized: minimized,
            bottom: $route.meta.mobileBottom,
            shown: $route.meta.shown
          }" :style="mainDynamicStyle">
            <StreetView v-if="store.state.devices.streetview" />

            <!-- REMOVIDO: IframeCalor, IframePercurso, IframePontos -->
            <!-- Heatmap agora é via toggleHeatmap() direto no Leaflet do KoreMap -->

            <KoreMap />
          </div>
        </div>
        <!-- ===== FIM wrapper inert (só painel + mapa) ===== -->
      </template>
    </div>
  </template>

  <!-- Se não estiver autenticado, mantém o fluxo padrão -->
  <template v-else>
    <router-view></router-view>
  </template>

  <!-- Assistente IA Global -->
  <AIAssistantWrapper />
</template>



<script setup>
/* ===========================
 *  IMPORTS
 * =========================== */
import {
  defineAsyncComponent,
  ref,
  onMounted,
  onBeforeUnmount,
  provide,
  computed,
  watch,
  nextTick,
  inject,
} from 'vue'
import { useStore } from 'vuex'

import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/tooltip/style/css'
import 'element-plus/es/components/progress/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/tabs/style/css'
import 'element-plus/es/components/tab-pane/style/css'

import { ElProgress } from 'element-plus/es/components/progress'
import { ElButton } from 'element-plus/es/components/button'
import { ElIcon } from 'element-plus/es/components/icon'
import { ElTooltip } from 'element-plus/es/components/tooltip'

import { useModalA11yLock } from '@/composables/useModalA11yLock'

import router from './routes'

/* ===========================
 *  LAZY LOADER HELPER
 * =========================== */
const lazy = (name, loader) =>
  defineAsyncComponent({
    loader,
    timeout: 30000,
    onError(_e, retry, fail, attempts) {
      if (attempts <= 1) retry()
      else fail(_e)
    },
  })

/* ===========================
 *  ASYNC COMPONENTS
 * =========================== */
const StreetView = lazy('StreetView', () => import('./tarkan/components/street-view'))
// REMOVIDO: IframePercurso, IframePontos, IframeCalor (legado PHP)
// Heatmap agora via L.heatLayer no kore-map.vue
const KoreMap = lazy('KoreMap', () => {
  // console.log('[App.vue] 🔵 Lazy loading KoreMap...');
  return import('./tarkan/components/kore-map').then(module => {
    // console.log('[App.vue] ✅ KoreMap loaded successfully');
    return module;
  }).catch(error => {
    console.error('[App.vue] ❌ ERRO ao carregar KoreMap:', error);
    throw error;
  });
})

import KT from './tarkan/func/kt'
import actAnchor from './tarkan/func/actAnchor'

// Componente unificado de modal com slider
import ConfirmSliderModal from './components/ConfirmSliderModal.vue'

import 'leaflet/dist/leaflet.css'

const ContextMenu = lazy('ContextMenu', () => import('./tarkan/components/context-menu'))
const EditUser = lazy('EditUser', () => import('./tarkan/components/views/edit-user'))
const UserNoticeModal = lazy('UserNoticeModal', () => import('./tarkan/components/UserNoticeModal'))

const EditShare = lazy('EditShare', () => import('./tarkan/components/views/edit-share'))
const EditShares = lazy('EditShares', () => import('./tarkan/components/views/edit-shares'))
const EditGroup = lazy('EditGroup', () => import('./tarkan/components/views/edit-group'))
const EditUsers = lazy('EditUsers', () => import('./tarkan/components/views/edit-users'))
const EditServer = lazy('EditServer', () => import('./tarkan/components/views/edit-server'))
const EditDrivers = lazy('EditDrivers', () => import('./tarkan/components/views/edit-drivers'))
const LinkObjects = lazy('LinkObjects', () => import('./tarkan/components/views/link-objects'))
const LogObjects = lazy('LogObjects', () => import('./tarkan/components/views/log-objects'))
const EditCalendars = lazy('EditCalendars', () => import('./tarkan/components/views/edit-calendars'))
const EditMaintenances = lazy('EditMaintenances', () => import('./tarkan/components/views/edit-maintenances'))
const EditTheme = lazy('EditTheme', () => import('./tarkan/components/views/edit-theme'))

const EditNotifications = lazy('EditNotifications', () => import('./tarkan/components/views/edit-notifications'))
const EditDevice = lazy('EditDevice', () => import('./tarkan/components/views/edit-device'))
const QrDevice = lazy('QrDevice', () => import('./tarkan/components/views/qr-device'))
const Showtip = lazy('Showtip', () => import('./tarkan/components/showtip'))
const ShowGraphic = lazy('ShowGraphic', () => import('./tarkan/components/views/show-graphic'))
const PushNotificationBtn = lazy('PushNotificationBtn', () => import('./tarkan/components/push-notification-btn'))
const ShowInvoices = lazy('ShowInvoices', () => import('./tarkan/components/views/show-invoices'))
const ShowInvoicesManager = lazy('ShowInvoicesManager', () => import('./tarkan/components/views/show-invoices-manager'))
const EditIntegrations = lazy('EditIntegrations', () => import('./tarkan/components/views/edit-integrations'))
const EditEvents = lazy('EditEvents', () => import('./tarkan/components/views/edit-events'))
const AIAssistantWrapper = lazy('AIAssistantWrapper', () => import('./components/AIAssistantWrapper.vue'))

/* ===========================
 *  SETUP
 * =========================== */
const store = useStore()
const runtimeApi = inject('runtimeApi', null)

/** CSS Vars (SSR-safe) */
const primaryColor = ref('#409EFF')

/** Runtime config (window.CONFIG) + fallback no store */
const runtimeConfig = ref(typeof window !== 'undefined' ? (window.CONFIG || {}) : {})

const refreshRuntimeConfig = () => {
  runtimeConfig.value = (typeof window !== 'undefined' && window.CONFIG)
    ? { ...window.CONFIG }
    : {}
}

const syncPrimaryColor = () => {
  try {
    const css = getComputedStyle(document.documentElement)
    primaryColor.value = css.getPropertyValue('--el-color-primary')?.trim() || '#409EFF'
  } catch {
    /* fallback */
  }
}

let themeRaf = null
const onThemeUpdated = () => {
  if (themeRaf) cancelAnimationFrame(themeRaf)
  themeRaf = requestAnimationFrame(() => {
    refreshRuntimeConfig()
    syncPrimaryColor()
    themeRaf = null
  })
}

/** labelConf: prioriza runtimeConfig sobre store */
const labelConf = computed(() => {
  const fromRuntime = runtimeConfig.value
  const fromStore = store.state.server?.labelConf
  return (fromRuntime && typeof fromRuntime === 'object' && Object.keys(fromRuntime).length > 0) 
    ? fromRuntime 
    : (fromStore || {})
})

const headLogo = computed(() => labelConf.value?.headLogo || {})

/** WhatsApp: sanitiza número e adiciona DDI 55 se necessário */
const whatsappNumber = computed(() => {
  const raw = String(labelConf.value?.whatsapp || '')
  let digits = raw.replace(/\D/g, '')

  // BR: se veio sem DDI e parece número nacional (10/11 dígitos), prefixa 55
  if (digits && (digits.length === 10 || digits.length === 11)) {
    digits = '55' + digits
  }
  return digits
})

/* ===========================
 *  COMPONENT REFS
 * =========================== */
const contextMenuRef = ref(null)
// radialMenuRef: reservado para futuro componente radial-menu (legado ou planejado)
const radialMenuRef = ref(null)
const editDeviceRef = ref(null)
const qrDeviceRef = ref(null)
const editUserRef = ref(null)
const editUsersRef = ref(null)
const editShareRef = ref(null)
const editSharesRef = ref(null)
const editGroupRef = ref(null)
const editNotificationsRef = ref(null)
const editServerRef = ref(null)
const editDriversRef = ref(null)
const linkObjectsRef = ref(null)
const logObjectsRef = ref(null)
const editCalendarsRef = ref(null)
const editMaintenancesRef = ref(null)
const editThemeRef = ref(null)
const showGraphicsRef = ref(null)
const userNoticeModalRef = ref(null)
const invoicesRef = ref(null)
const invoicesManagerRef = ref(null)
const integrationsRef = ref(null)
const editEventsRef = ref(null)

/* ===========================
 *  UI STATE
 * =========================== */
const mobileExpand = ref(false)

// menuShown: controla overlay do menu no mobile (portrait)
// sidebarClosed: controla colapso da sidebar no desktop (landscape)
const menuShown = ref(false)
const minimized = ref(false)
const sidebarClosed = ref(false)

/* Desktop x Mobile - REATIVO para detectar orientação */
const portrait = ref(false)
const computePortrait = () => {
  // Fallback baseado em dimensão para devices frágeis (Android split-screen, tablets)
  const vv = window.visualViewport
  const w = vv?.width ?? window.innerWidth
  const h = vv?.height ?? window.innerHeight
  
  // Tablet em janela estreita (<900px) é tratado como mobile
  const isNarrow = w < 900
  
  // Priorizar matchMedia quando disponível, fallback para dimensão
  if (window.matchMedia) {
    try {
      const isOrientationPortrait = window.matchMedia('(orientation: portrait)').matches
      return isOrientationPortrait || isNarrow
    } catch {
      return h >= w || isNarrow
    }
  }
  return h >= w || isNarrow
}

const updatePortrait = () => {
  const newValue = computePortrait()
  if (portrait.value !== newValue) {
    portrait.value = newValue
    // Invalidar mapa após mudança de orientação (layout mudou)
    nextTick(() => emitMapInvalidate({ source: 'orientation-change' }))
  }
}

/**
 * restoreSidebar - ALTERADO conforme referência
 * Em portrait (mobile): fecha o menu.
 * Em desktop: não faz nada (sidebar fica controlada por sidebarClosed).
 */
const restoreSidebar = () => {
  if (portrait.value) {
    menuShown.value = false
  }
}

/**
 * toggleSidebar - ALTERADO conforme referência
 * Em portrait (mobile): toggla menuShown.
 * Em desktop: toggla sidebarClosed para colapsar/expandir.
 */
const toggleSidebar = (e) => {
  e?.stopPropagation?.()
  if (portrait.value) {
    menuShown.value = !menuShown.value
  } else {
    sidebarClosed.value = !sidebarClosed.value
  }
}

// Alias para manter compatibilidade com template existente
const toggleMenu = toggleSidebar

/**
 * onMenuItemClick - ALTERADO conforme referência
 * Fecha menu automaticamente após navegação somente em mobile (portrait).
 */
const onMenuItemClick = (navigate) => {
  navigate?.()
  // autoCloseSidebarOnNav: só fecha em mobile
  if (portrait.value) {
    menuShown.value = false
  }
}

/**
 * shouldRenderMenu - O menu só existe quando:
 * - Autenticado
 * - Não é driver
 * - No mobile: sempre renderiza (precisa existir para abrir overlay)
 * - No desktop: não renderiza quando meta.shown
 */
const shouldRenderMenu = computed(() => {
  if (!store.state.auth) return false
  if (store.getters['isDriver']) return false

  // 🔥 FIX: no mobile, o menu precisa existir mesmo com meta.shown
  if (portrait.value) return true

  if (router.currentRoute.value?.meta?.shown) return false
  return true
})

/**
 * effectiveMenuOpen - Estado real de abertura do menu:
 * - Mobile: só "abre" se o menu existir E menuShown=true
 * - Desktop: se renderiza e não está "sidebarClosed", consideramos "aberto"
 */
const effectiveMenuOpen = computed(() => {
  // Mobile: só "abre" se o menu existir
  if (portrait.value) return shouldRenderMenu.value && menuShown.value

  // Desktop: se renderiza e não está "sidebarClosed", consideramos "aberto"
  return shouldRenderMenu.value && !sidebarClosed.value
})

/** Computed para detectar menu overlay aberto (mobile only) */
const isMenuOverlayOpen = computed(() => portrait.value && effectiveMenuOpen.value)

/**
 * shouldShowHamburger - Garante que o hamburger sempre apareça no mobile
 * Mobile: sempre visível (usuário precisa conseguir abrir o menu)
 * Desktop: respeita regra atual (esconde quando meta.shown)
 */
const shouldShowHamburger = computed(() => {
  // Mobile: sempre mostrar
  if (portrait.value) return true

  // Desktop: respeita regra atual (esconde quando meta.shown)
  return !router.currentRoute.value?.meta?.shown
})

/** Ajuste principal (shared / safe-area) */
const mainDynamicStyle = computed(() => {
  const style = {}
  if (store.state?.auth?.attributes?.['isShared']) {
    style.width = '100vw'
  }
  // Quando menu overlay aberto em mobile, não aplicar padding extra (evita faixa branca)
  style.paddingInlineEnd = isMenuOverlayOpen.value ? '0px' : 'var(--sar, 0px)'
  return style
})

/* ===========================
 *  MODAL UNIFICADO - ESTADOS
 * =========================== */
const showConfirmModal = ref(false)
const currentModalMode = ref('block') // 'block' | 'unlock' | 'anchor_enable' | 'anchor_disable' | 'delete'
const currentDevice = ref(null)
const currentCommand = ref(null)
const commandLoading = ref(false)

/** Configuração dinâmica do modal baseada no modo */
const modalConfig = computed(() => {
  const isOnlineDevice = currentDevice.value?.status === 'online'
  const offlineWarning = 'O veículo está offline. O comando será enviado quando reconectar.'
  const noInternetWarning = 'Sem conexão com a internet. Conecte-se para executar este comando.'
  
  // Helper para aplicar mensagem offline consistentemente
  // Prioriza mensagem de internet quando navegador está offline
  const needOnlineMsg = (fallback) => {
    if (!isOnline.value) return noInternetWarning
    return isOnlineDevice ? fallback : offlineWarning
  }

  const configs = {
    block: {
      title: currentDevice.value?.name || 'Veículo',
      titleIcon: '',
      warningTitle: 'ATENÇÃO - USO APENAS EM EMERGÊNCIA',
      warningText: needOnlineMsg('Este comando deve ser usado somente em casos de emergência como roubo ou furto.'),
      confirmLabel: 'Deslize para Bloquear',
      sliderLabel: 'Deslize para confirmar bloqueio',
      iconClass: 'fas fa-lock',
      colorVariant: 'danger',
      rtl: false,
    },
    unlock: {
      title: currentDevice.value?.name || 'Veículo',
      titleIcon: '',
      warningTitle: 'CONFIRMAÇÃO NECESSÁRIA',
      warningText: needOnlineMsg('Confirme que deseja executar este comando no veículo.'),
      confirmLabel: 'Deslize para Desbloquear',
      sliderLabel: 'Deslize para confirmar desbloqueio',
      iconClass: 'fas fa-unlock',
      colorVariant: 'success',
      rtl: false,
    },
    anchor_enable: {
      title: currentDevice.value?.name || 'Veículo',
      titleIcon: 'fas fa-anchor',
      warningTitle: 'ATIVAR ÂNCORA',
      warningText: needOnlineMsg('A âncora irá alertar se o veículo sair do local atual.'),
      confirmLabel: 'Ativar Âncora',
      sliderLabel: 'Deslize para confirmar',
      iconClass: 'fas fa-anchor',
      colorVariant: 'warning',
      rtl: false,
    },
    anchor_disable: {
      title: currentDevice.value?.name || 'Veículo',
      titleIcon: 'fas fa-anchor',
      warningTitle: 'DESATIVAR ÂNCORA',
      warningText: needOnlineMsg('A âncora será desativada e alertas de movimento serão suspensos.'),
      confirmLabel: 'Desativar Âncora',
      sliderLabel: 'Deslize para a ESQUERDA para confirmar',
      iconClass: 'fas fa-anchor',
      colorVariant: 'warning',
      rtl: true, // ← RTL REAL: confirma deslizando para ESQUERDA
    },
    delete: {
      title: '⚠️ Excluir Dispositivo',
      titleIcon: '',
      warningTitle: 'AÇÃO IRREVERSÍVEL',
      warningText: 'Tem certeza que deseja excluir este dispositivo? Esta ação não pode ser desfeita.',
      confirmLabel: 'Deslize para Excluir',
      sliderLabel: 'Deslize para confirmar exclusão',
      iconClass: 'fas fa-trash',
      colorVariant: 'danger',
      rtl: false,
    },
  }

  return configs[currentModalMode.value] || configs.block
})

/* ===========================
 *  CONNECTION STATUS
 * =========================== */
const isOnline = ref(navigator.onLine)
const connectionSpeed = ref('good')

const updateConnectionStatus = () => {
  isOnline.value = navigator.onLine

  if ('connection' in navigator) {
    const connection = navigator.connection
    if (connection?.effectiveType === '4g') connectionSpeed.value = 'excellent'
    else if (connection?.effectiveType === '3g') connectionSpeed.value = 'good'
    else connectionSpeed.value = 'slow'
  }
}

/* ===========================
 *  HELPERS
 * =========================== */
function generateRandomToken(length = 20) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  
  // Usa crypto.getRandomValues se disponível (mais seguro)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, (n) => charset[n % charset.length]).join('')
  }
  
  // Fallback para Math.random (ambientes sem crypto)
  return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('')
}

// ============================================================================
// MAP INVALIDATE - Rate-limited dispatcher
// ============================================================================

/**
 * Sistema de rate-limit inteligente para map:invalidate
 * 
 * PROBLEMA: viewport scroll pode disparar 60fps → storm de invalidateSize()
 * SOLUÇÃO: throttle por source sem perder responsividade em UX crítica
 * 
 * CONFIGURAÇÃO:
 * - viewport scroll: max 150ms (6-7fps, imperceptível mas economiza 90% dos events)
 * - menu/sidebar/mount/orientation: imediato (UX crítica)
 * - modal-close: imediato (já tem nextTick no composable)
 * 
 * INVARIANTES:
 * - Cada source tem throttle isolado (Map por source = sem starvation)
 * - RAF global = múltiplos invalidates no mesmo frame colapsam em 1 (último detail vence)
 * 
 * KILL SWITCH (ops/debug):
 * localStorage.DISABLE_VIEWPORT_THROTTLE='1' → desliga throttle sem redeploy (lido dinamicamente)
 */

// Sources que devem ter throttle (ms)
const THROTTLE_CONFIG = {
  viewport: 150, // scroll suave mobile = storm, throttle pesado OK
}

// Sources imediatas (whitelist defensiva): menu-overlay, sidebar-toggle, mount, orientation-change, modal-close
// IMMEDIATE_SOURCES garante que estes sources NUNCA recebam throttle.
// Hoje só throttlamos viewport, mas se algum source for adicionado ao THROTTLE_CONFIG no futuro,
// esta whitelist protege UX crítica (menu/sidebar instant, orientation sem delay).
const IMMEDIATE_SOURCES = new Set([
  'menu-overlay',
  'sidebar-toggle', 
  'mount',
  'orientation-change',
  'modal-close',
])

// State para throttling por source (isolado por source = sem starvation)
const throttleTimers = new Map()
const lastEmitTime = new Map()

// Logging DEV-only (ativar com localStorage.DEBUG_PERF=1)
const DEBUG_PERF = typeof localStorage !== 'undefined' && localStorage.DEBUG_PERF === '1'
const perfCounters = DEBUG_PERF ? new Map() : null

// Kill switch (ops): desliga throttle sem redeploy (lido dinamicamente)
const isThrottleDisabled = () =>
  typeof localStorage !== 'undefined' &&
  localStorage.DISABLE_VIEWPORT_THROTTLE === '1'

let invalidateRaf = null
let warnedThrottleOff = false // Guard: warn throttle desabilitado só 1x
const emitMapInvalidate = (detail = {}) => {
  const source = detail.source || 'unknown'

  // Logging DEV
  if (DEBUG_PERF) {
    perfCounters.set(source, (perfCounters.get(source) || 0) + 1)
  }

  // Kill switch: bypass throttle completamente (lido dinamicamente, sem reload)
  if (isThrottleDisabled()) {
    if (!warnedThrottleOff) {
      console.warn('[PERF] ⚠️  Throttle desabilitado via localStorage.DISABLE_VIEWPORT_THROTTLE')
      warnedThrottleOff = true
    }
    if (invalidateRaf) cancelAnimationFrame(invalidateRaf)
    invalidateRaf = requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('map:invalidate', { detail }))
      invalidateRaf = null
    })
    return
  }

  // Throttle por source (se configurado)
  const throttleMs = THROTTLE_CONFIG[source]
  if (throttleMs && !IMMEDIATE_SOURCES.has(source)) {
    const now = Date.now()
    const lastEmit = lastEmitTime.get(source) || 0
    const elapsed = now - lastEmit

    if (elapsed < throttleMs) {
      // Já existe timer? cancela e reagenda
      if (throttleTimers.has(source)) {
        clearTimeout(throttleTimers.get(source))
      }

      // Agenda disparo no final do throttle
      const timer = setTimeout(() => {
        throttleTimers.delete(source)
        lastEmitTime.set(source, Date.now())
        
        if (invalidateRaf) cancelAnimationFrame(invalidateRaf)
        invalidateRaf = requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('map:invalidate', { detail }))
          invalidateRaf = null
        })
      }, throttleMs - elapsed)

      throttleTimers.set(source, timer)
      return
    }

    lastEmitTime.set(source, now)
  }

  // Disparo imediato (sources imediatas ou fora do throttle)
  if (invalidateRaf) cancelAnimationFrame(invalidateRaf)
  invalidateRaf = requestAnimationFrame(() => {
    window.dispatchEvent(new CustomEvent('map:invalidate', { detail }))
    invalidateRaf = null
  })
}

// Logging periódico DEV (a cada 10s)
if (DEBUG_PERF) {
  setInterval(() => {
    if (perfCounters.size > 0) {
      console.log('[PERF] map:invalidate (últimos 10s):', Object.fromEntries(perfCounters))
      perfCounters.clear()
    }
  }, 10000)
}

/** viewport vars robusto (visualViewport) */
const viewportCleanupFns = []

const applyViewportVars = () => {
  const root = document.documentElement
  const vv = window.visualViewport
  const height = vv?.height ?? window.innerHeight
  const width = vv?.width ?? window.innerWidth

  root.style.setProperty('--vh', `${height}px`)
  root.style.setProperty('--vw', `${width}px`)
  // Nota: --sat/--sab/--sar/--sal já definidos no :root via env()
}

const registerViewportListeners = () => {
  const handler = () => {
    applyViewportVars()
    emitMapInvalidate({ source: 'viewport' })
  }

  window.addEventListener('resize', handler)
  viewportCleanupFns.push(() => window.removeEventListener('resize', handler))

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handler)
    window.visualViewport.addEventListener('scroll', handler)
    viewportCleanupFns.push(() => window.visualViewport.removeEventListener('resize', handler))
    viewportCleanupFns.push(() => window.visualViewport.removeEventListener('scroll', handler))
  }
}

const cleanupViewportListeners = () => {
  while (viewportCleanupFns.length) {
    const fn = viewportCleanupFns.pop()
    try {
      fn?.()
    } catch {
      /* noop */
    }
  }
}

/* ===========================
 *  NAVIGATION HANDLERS
 * =========================== */
const onOpenBack = () => {
  restoreSidebar()
  const meta = router.currentRoute.value?.meta || {}
  if (meta.backBtn) router.push(meta.backBtn)
  else router.back()
}

const onOpenClose = () => {
  restoreSidebar()
  router.push('/home')
}

const handleMainClick = (e) => {
  // Impede interação quando modal está aberto
  if (modalOpen.value || showConfirmModal.value) {
    e?.stopPropagation?.()
    e?.preventDefault?.()
    return
  }

  // Fecha menu no mobile ao tocar no mapa
  if (portrait.value && menuShown.value) {
    menuShown.value = false
  }
}

/* ===========================
 *  MODAL HANDLERS UNIFICADOS
 * =========================== */

/** Handler unificado de confirmação do modal */
const handleModalConfirm = async () => {
  const mode = currentModalMode.value
  
  switch (mode) {
    case 'block':
      await handleBlockCommand()
      break
    case 'unlock':
      await handleUnlockCommand()
      break
    case 'anchor_enable':
    case 'anchor_disable':
      await handleAnchorCommand()
      break
    case 'delete':
      await handleDeleteCommand()
      break
  }
}

/** Handler de cancelamento do modal */
const handleModalCancel = () => {
  currentDevice.value = null
  currentCommand.value = null
  commandLoading.value = false
}

/** Comando de bloqueio */
const handleBlockCommand = async () => {
  commandLoading.value = true
  try {
    if (!runtimeApi) {
      throw new Error('Runtime API não disponível. Recarregue a página.')
    }
    
    if (!isOnline.value) {
      throw new Error('Sem conexão com a internet.')
    }
    
    const deviceId = currentDevice.value?.id
    if (!deviceId) throw new Error('Dispositivo não identificado.')
    
    const command = currentCommand.value
    await runtimeApi.sendCommand({ ...command, deviceId })
    
    const { ElNotification } = await import('element-plus')
    ElNotification({ title: 'Sucesso', message: 'Comando de bloqueio enviado', type: 'success' })
    showConfirmModal.value = false
  } catch (err) {
    const { ElMessage } = await import('element-plus')
    const msg = err?.message || 'Erro ao enviar comando'
    ElMessage.error(msg)
    console.error('[Block]', err)
  } finally {
    commandLoading.value = false
  }
}

/** Comando de desbloqueio */
const handleUnlockCommand = async () => {
  commandLoading.value = true
  try {
    if (!runtimeApi) {
      throw new Error('Runtime API não disponível. Recarregue a página.')
    }
    
    if (!isOnline.value) {
      throw new Error('Sem conexão com a internet.')
    }
    
    const deviceId = currentDevice.value?.id
    if (!deviceId) throw new Error('Dispositivo não identificado.')
    
    const command = currentCommand.value
    await runtimeApi.sendCommand({ ...command, deviceId })
    
    const { ElNotification } = await import('element-plus')
    ElNotification({ title: 'Sucesso', message: 'Comando de desbloqueio enviado', type: 'success' })
    showConfirmModal.value = false
  } catch (err) {
    const { ElMessage } = await import('element-plus')
    const msg = err?.message || 'Erro ao enviar comando'
    ElMessage.error(msg)
    console.error('[Unlock]', err)
  } finally {
    commandLoading.value = false
  }
}

/** Comando de âncora */
const handleAnchorCommand = async () => {
  const isEnabling = currentModalMode.value === 'anchor_enable'
  commandLoading.value = true
  try {
    // PRIORIDADE: validar internet primeiro (evita flip-flop de mensagem)
    if (!isOnline.value) {
      throw new Error('Sem conexão com a internet.')
    }
    
    const deviceId = currentDevice.value?.id
    if (!deviceId) throw new Error('Dispositivo não identificado.')
    
    // Validar se device está online (comando âncora requer device conectado)
    // Esta validação só roda se internet estiver OK
    const isDeviceOnline = currentDevice.value?.status === 'online'
    if (!isDeviceOnline) {
      throw new Error('O veículo está offline. Comando de âncora requer conexão ativa.')
    }
    
    await actAnchor(deviceId, isEnabling)
    
    const { ElNotification } = await import('element-plus')
    ElNotification({
      title: 'Sucesso',
      message: isEnabling ? 'Ancoragem ativada' : 'Ancoragem desativada',
      type: 'success',
    })
    showConfirmModal.value = false
  } catch (err) {
    const { ElMessage } = await import('element-plus')
    const msg = err?.message || 'Erro ao executar âncora'
    ElMessage.error(msg)
    console.error('[Anchor]', err)
  } finally {
    commandLoading.value = false
  }
}

/** Comando de exclusão */
const handleDeleteCommand = async () => {
  commandLoading.value = true
  try {
    // Exclusão só depende de internet (operação de servidor)
    // NÃO depende de device.status (pode excluir device offline)
    if (!isOnline.value) {
      throw new Error('Sem conexão com a internet.')
    }
    
    const deviceId = currentDevice.value?.id
    if (!deviceId) throw new Error('Dispositivo não identificado.')
    
    await store.dispatch('devices/delete', deviceId)
    
    const { ElNotification } = await import('element-plus')
    ElNotification({ title: 'Sucesso', message: 'Dispositivo excluído com sucesso', type: 'success' })
    showConfirmModal.value = false
    router.push('/devices')
  } catch (err) {
    const { ElMessage } = await import('element-plus')
    const msg = err?.message || 'Erro ao excluir dispositivo'
    ElMessage.error(msg)
    console.error('[Delete]', err)
  } finally {
    commandLoading.value = false
  }
}

/* ===========================
 *  EVENT LISTENERS (OPEN MODALS)
 * =========================== */
const onOpenBlockModal = (event) => {
  const detail = event?.detail || {}
  currentDevice.value = detail.device || null
  currentCommand.value = detail.command || null
  currentModalMode.value = 'block'
  showConfirmModal.value = true
}

const onOpenUnlockModal = (event) => {
  const detail = event?.detail || {}
  currentDevice.value = detail.device || null
  currentCommand.value = detail.command || null
  currentModalMode.value = 'unlock'
  showConfirmModal.value = true
}

const onOpenAnchorModal = (event) => {
  const detail = event?.detail || {}
  currentDevice.value = detail.device || null
  currentCommand.value = detail.command || null
  // Define modo baseado no tipo do comando
  currentModalMode.value = detail.command?.type === 'anchor_disable' ? 'anchor_disable' : 'anchor_enable'
  showConfirmModal.value = true
}

const onOpenDeleteModal = (event) => {
  const detail = event?.detail || {}
  currentDevice.value = detail.device || null
  currentCommand.value = detail.command || null
  currentModalMode.value = 'delete'
  showConfirmModal.value = true
}

/* ===========================
 *  USER MENU - ALTERADO: Adicionados ícones conforme referência
 * =========================== */
const userMenu = (e) => {
  const tmp = []
  const auth = store.state.auth

  if (!auth?.attributes?.['isShared']) {
    // account: fas fa-user-cog
    tmp.push({
      text: KT('usermenu.account'),
      icon: 'fas fa-user-cog',
      cb: () => editUserRef.value?.editUser?.()
    })

    if (auth?.administrator) {
      // logs: fas fa-history
      tmp.push({
        text: KT('usermenu.logs'),
        icon: 'fas fa-history',
        cb: () => logObjectsRef.value?.showLogs?.('all')
      })
      // theme: fas fa-palette
      tmp.push({
        text: KT('usermenu.theme'),
        icon: 'fas fa-palette',
        cb: () => editThemeRef.value?.showTheme?.()
      })
    }

    if (store.getters.advancedPermissions?.(16)) {
      // users: fas fa-users
      tmp.push({
        text: KT('usermenu.users'),
        icon: 'fas fa-users',
        cb: () => editUsersRef.value?.showUsers?.()
      })
    }

    if (store.getters.advancedPermissions?.(64)) {
      // computedAttributes: fas fa-calculator
      tmp.push({
        text: KT('usermenu.computedAttributes'),
        icon: 'fas fa-calculator',
        cb: () => router.push('/computed')
      })
    }

    if (store.getters.isAdmin) {
      // server: fas fa-server
      tmp.push({
        text: KT('usermenu.server'),
        icon: 'fas fa-server',
        cb: () => editServerRef.value?.showServer?.()
      })
    }

    if (store.getters.advancedPermissions?.(32)) {
      // notifications: fas fa-bell
      tmp.push({
        text: KT('usermenu.notifications'),
        icon: 'fas fa-bell',
        cb: () => editNotificationsRef.value?.showNotifications?.()
      })
    }

    if (store.getters.advancedPermissions?.(36)) {
      // events/anuncio: fas fa-bullhorn
      tmp.push({
        text: KT('notification.title2', 'Anuncio'),
        icon: 'fas fa-bullhorn',
        cb: () => editEventsRef.value?.showEvents?.()
      })
    }

    if (store.getters.advancedPermissions?.(80)) {
      // drivers: fas fa-id-card
      tmp.push({
        text: KT('usermenu.drivers'),
        icon: 'fas fa-id-card',
        cb: () => editDriversRef.value?.showDrivers?.()
      })
    }

    if (store.getters.advancedPermissions?.(88)) {
      // calendars: fas fa-calendar-alt
      tmp.push({
        text: KT('usermenu.calendars'),
        icon: 'fas fa-calendar-alt',
        cb: () => editCalendarsRef.value?.showCalendars?.()
      })
    }

    if (store.getters.advancedPermissions?.(96)) {
      // maintenance: fas fa-tools
      tmp.push({
        text: KT('usermenu.maintenance'),
        icon: 'fas fa-tools',
        cb: () => editMaintenancesRef.value?.showMaintenances?.()
      })
    }
  }

  // logout: fas fa-sign-out-alt
  tmp.push({
    text: KT('usermenu.logout'),
    icon: 'fas fa-sign-out-alt',
    cb: () => {
      store.dispatch('logout').then(() => router.push('/login'))
    },
  })

  contextMenuRef.value?.openMenu?.({ evt: e, menus: tmp })
}

/* ===========================
 *  ACCESSIBILITY + BODY SCROLL LOCK
 * =========================== */

// Modal unificado - aplica lockBodyScroll
const isCustomModalOpen = computed(() => showConfirmModal.value)

// Todos os modais custom - usado para inert/trap
const modalOpen = computed(() => isCustomModalOpen.value)

// Composable que encapsula toda lógica de modal a11y + body lock + inert
const { initInertFallback, notifyModalDomChanged, invalidateFocusCache } = useModalA11yLock({
  modalOpen,
  isMenuOverlayOpen,
  menuShown,
  portrait,
  emitInvalidate: (detail) => emitMapInvalidate(detail),
  onEscapeClose: () => {
    if (showConfirmModal.value) {
      showConfirmModal.value = false
      handleModalCancel()
    }
  },
})

// Watch commandLoading: invalidar cache quando DOM do modal mudar (botões disabled/spinner)
watch(commandLoading, () => notifyModalDomChanged())

// Watch currentModalMode: invalidar cache quando tipo de modal mudar (botões diferentes)
watch(currentModalMode, () => notifyModalDomChanged())

// Watch showConfirmModal: invalidar cache quando modal abrir/fechar diretamente
watch(showConfirmModal, () => invalidateFocusCache())

// Watch para menu overlay: classe no body + invalidate mapa
watch(isMenuOverlayOpen, (open) => {
  if (open) {
    document.body.classList.add('menu-open')
  } else {
    document.body.classList.remove('menu-open')
  }
  emitMapInvalidate({ source: 'menu-overlay', open })
})

/**
 * closeMobileMenu - fecha menu garantindo consistência em Safari/iOS
 * Evita "menu preso" quando orientation muda durante animação
 */
const closeMobileMenu = () => {
  menuShown.value = false
  requestAnimationFrame(() => {
    document.body.classList.remove('menu-open')
  })
}

// Watcher para desktop: quando sidebarClosed muda, invalida o mapa
watch(sidebarClosed, (closed) => {
  emitMapInvalidate({ source: 'sidebar-toggle', closed })
})

/* ===========================
 *  ROUTER HOOKS - Guardados para remoção no unmount (evita acumular)
 * =========================== */
let removeAfterEach = null
let removeBeforeEach = null

/* ===========================
 *  LIFECYCLE
 * =========================== */
onMounted(() => {
  // Inicializa fallback inert para Safari antigo
  initInertFallback()

  // Registra router guards (guardar funções de remoção)
  removeAfterEach = router.afterEach((to) => {
    minimized.value = false
    /**
     * Não fechar menu automaticamente em rotas "shown" no mobile.
     * Isso evita UX confusa onde menu some sem motivo aparente.
     * No desktop, continua fechando para manter área útil.
     */
    if (!portrait.value && to?.meta?.shown && to.path !== '/home') {
      menuShown.value = false
    }
  })

  removeBeforeEach = router.beforeEach((_to, _from, next) => {
    // Se navegar com modal aberto, feche o modal (o composable destrava o body)
    if (showConfirmModal.value) {
      showConfirmModal.value = false
      handleModalCancel()
    }
    next()
  })
  // CSS primary (SSR-safe)
  try {
    const css = getComputedStyle(document.documentElement)
    primaryColor.value = css.getPropertyValue('--el-color-primary')?.trim() || '#409EFF'
  } catch {
    /* fallback */
  }

  applyViewportVars()
  registerViewportListeners()
  // handleVisibilityChange agora está no composable useModalA11yLock
  
  // FIX 1: Atrasar invalidate até DOM/KoreMap/Leaflet estarem prontos
  // nextTick garante DOM montado + RAF garante Leaflet inicializado
  nextTick(() => {
    requestAnimationFrame(() => {
      emitMapInvalidate({ source: 'mount' })
    })
  })

  // Inicializa portrait reativo e registra listeners
  portrait.value = computePortrait()
  window.addEventListener('resize', updatePortrait, { passive: true })
  window.addEventListener('orientationchange', updatePortrait, { passive: true })
  
  // Idempotente: remove antes de adicionar (evita acumular em HMR)
  if (typeof window !== 'undefined') {
    window.removeEventListener('theme:updated', onThemeUpdated)
    window.addEventListener('theme:updated', onThemeUpdated, { passive: true })
  }

  if (!portrait.value) sidebarClosed.value = false

  window.localStorage.setItem('query', '')
  if (!window.localStorage.getItem('TKSESSIONTOKEN')) {
    const token = generateRandomToken()
    window.localStorage.setItem('TKSESSIONTOKEN', token)
  }

  window.addEventListener('openBlockModal', onOpenBlockModal)
  window.addEventListener('openUnlockModal', onOpenUnlockModal)
  window.addEventListener('openAnchorModal', onOpenAnchorModal)
  window.addEventListener('openDeleteModal', onOpenDeleteModal)

  window.addEventListener('online', updateConnectionStatus)
  window.addEventListener('offline', updateConnectionStatus)
  updateConnectionStatus()
})

onBeforeUnmount(() => {
  // Remove router guards (evita acumular em hot reload)
  removeAfterEach?.()
  removeBeforeEach?.()

  // O componente ConfirmSliderModal cuida do próprio cleanup
  // O composable useModalA11yLock cuida de keydown/visibilitychange/bodyScroll/modal-open
  cleanupViewportListeners()

  // Remove listeners de orientação (evita memory leak em HMR)
  window.removeEventListener('resize', updatePortrait)
  window.removeEventListener('orientationchange', updatePortrait)
  window.removeEventListener('theme:updated', onThemeUpdated)

  window.removeEventListener('openBlockModal', onOpenBlockModal)
  window.removeEventListener('openUnlockModal', onOpenUnlockModal)
  window.removeEventListener('openAnchorModal', onOpenAnchorModal)
  window.removeEventListener('openDeleteModal', onOpenDeleteModal)

  window.removeEventListener('online', updateConnectionStatus)
  window.removeEventListener('offline', updateConnectionStatus)
})

/* ===========================
 *  PROVIDES
 * =========================== */
const showRouteMarker = ref(false)
const setShowMarker = (b) => {
  showRouteMarker.value = b
}

provide('setRouteMarker', setShowMarker)
provide('act-anchor', actAnchor)

provide('contextMenu', contextMenuRef)
provide('radialMenu', radialMenuRef)

provide('edit-device', editDeviceRef)
provide('qr-device', qrDeviceRef)
provide('edit-user', editUserRef)
provide('edit-users', editUsersRef)
provide('edit-share', editShareRef)
provide('edit-shares', editSharesRef)
provide('edit-group', editGroupRef)
provide('link-objects', linkObjectsRef)
provide('log-objects', logObjectsRef)
provide('show-graphics', showGraphicsRef)
provide('invoices', invoicesRef)
provide('invoices-manager', invoicesManagerRef)
provide('integrations', integrationsRef)
provide('edit-events', editEventsRef)
</script>

<style>
/* ===========================
 *  DESIGN SYSTEM / TOKENS
 * =========================== */
:root {
  /* Layout */
  --sb-width: 82px;
  --panel-width: 550px;
  --header-height: 2rem;

  /* Safe area fallbacks */
  --sat: env(safe-area-inset-top, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
  --sar: env(safe-area-inset-right, 0px);

  /* Radius */
  --r-sm: 10px;
  --r-md: 14px;
  --r-lg: 16px;
  --r-xl: 18px;

  /* Shadows */
  --shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.10);
  --shadow-md: 0 10px 24px rgba(0, 0, 0, 0.14);
  --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.28);

  /* Motion */
  --ease: cubic-bezier(.2, .8, .2, 1);
  --t-fast: 160ms;
  --t-med: 240ms;

  /* Header z-index stack (hierarquia consistente)
   * Ordem visual: panel < menu < head < whatsapp < conn < modal < loading
   * Modal é sempre prioridade máxima (interação do usuário)
   */
  --z-head: 1100;
  --z-menu: 1060;
  --z-panel: 1050;
  --z-whatsapp: 9000;
  /* WhatsApp float button */
  --z-conn: 9500;
  /* indicador de conexão - abaixo de modais */
  --z-modal: 10000;
  /* modais sempre acima de tudo */
  --z-loading: 10500;
  /* barra de loading global - acima de tudo */

  /* White-label sidebar (clientes podem sobrescrever) */
  --wl-sidebar-top: var(--el-color-primary, #F4801E);
  --wl-sidebar-bottom: #0f1219;

  /* Sidebar: mostrar labels (1 = sim, 0 = não) */
  --sb-show-labels: 1;
}

/* ===========================
 *  BASE / RESET
 * =========================== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  min-height: var(--vh, 100vh);
  margin: 0;
  padding: 0;
}

body {
  /* overflow removido - controlado via lockBodyScroll para evitar conflitos no iOS */
  width: 100%;
  max-width: 100vw;
  position: relative;
}

/* body.el-popup-parent--hidden removido - conflita com lockBodyScroll paddingRight */

#app {
  font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  text-align: left;
  color: #2c3e50;

  display: flex;
  flex-direction: column;

  overflow: hidden;
  position: relative;
  width: 100%;
  max-width: 100vw;
  min-height: var(--vh, 100vh);
}

.showOnMobile {
  display: none;
}

.editing .leaflet-container {
  cursor: crosshair !important;
}

/* Scrollbar global */
::-webkit-scrollbar {
  width: 8px;
  height: 4px;
  background: #f5f5f5;
}

::-webkit-scrollbar-thumb {
  background: #c9c9c9;
  border-radius: 6px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--el-color-info);
}

* {
  scrollbar-width: thin;
  scrollbar-color: #c9c9c9 #f5f5f5;
}

/* ===========================
 *  HEADER (FIXED)
 * =========================== */
#head {
  padding-top: var(--sat);
  height: calc(var(--header-height) + var(--sat));
  min-height: calc(var(--header-height) + var(--sat));

  background: var(--el-bg-color);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);

  display: flex;
  justify-content: space-between;
  align-items: center;

  position: fixed;
  top: 0;
  left: 0;
  right: 0;

  z-index: var(--z-head);
  pointer-events: auto;
  isolation: isolate;
}

#head #user {
  display: flex;
  align-items: center;
}

#btnmenu {
  display: none;
  padding: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: transform var(--t-fast) var(--ease);
}

#btnmenu.menu-active {
  transform: rotate(90deg);
}

#btnmenu.menu-active i {
  color: var(--el-color-primary);
}

/* ===========================
 *  MODAL OPEN: bloqueia painel e mapa, header parcialmente ativo
 * =========================== */
.modal-open #head {
  pointer-events: auto; /* header continua ativo para fechar/voltar */
}

.modal-open #head #btnmenu,
.modal-open #head #user,
.modal-open #head #mute {
  pointer-events: none;
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-open #open,
.modal-open #main {
  pointer-events: none;
  user-select: none;
}

/* Menu overlay aberto: trava scroll do body (evita "scroll atrás" no iOS) */
body.menu-open {
  overflow: hidden;
  touch-action: none;
}

#logo {
  padding: 0.5rem 0.75rem;
}

/* ===========================
 *  CONTENT WRAPPER
 * =========================== */
#content {
  display: flex;

  margin-top: calc(var(--header-height) + var(--sat));
  height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
  max-height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));

  width: 100%;
  max-width: 100vw;

  overflow: hidden;
  position: relative;
}

/* Wrapper inert - FIX: display:flex para que filhos (#menu, #open, #main) possam usar flex */
.inert-wrap {
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  min-width: 0;
}

/* Só bloqueia quando modal está aberto (simula inert) */
.inert-wrap.is-inert {
  pointer-events: none;
  user-select: none;
}

/* ===========================
 *  SIDEBAR / MENU (DESKTOP)
 * =========================== */
#menu {
  flex: 0 0 var(--sb-width);
  width: var(--sb-width);

  height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
  max-height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));

  /* Sidebar white-label friendly (variáveis definidas no :root) */
  background: linear-gradient(
    180deg,
    var(--wl-sidebar-top) 0%,
    var(--wl-sidebar-bottom) 100%
  );

  position: relative;
  z-index: var(--z-menu);

  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;

  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.10);
  transition: width var(--t-med) var(--ease), opacity var(--t-med) var(--ease), flex-basis var(--t-med) var(--ease);
}

#menu.sidebar-closed {
  flex-basis: 0 !important;
  width: 0 !important;
  overflow: hidden;
}

#menu.sidebar-closed #version {
  display: none;
}

#menu .indicator {
  display: none !important;
}

/* Menu list */
#menu ul {
  list-style: none;
  margin-top: 0.8rem;
  padding: 0 4px;
  /* Respiro lateral */
}

#menu ul li {
  position: relative;
  width: calc(var(--sb-width) - 6px);
  /* Ajusta para o padding */
  margin: 0 auto;
  padding: 8px 0 10px;
  /* Respiro vertical otimizado */
}

#menu ul li a {
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  /* Mais espaço entre ícone e texto */

  width: 100%;
  text-decoration: none !important;
  padding: 4px 0;
  /* Área de clique maior */
  border-radius: 12px;
  transition: background var(--t-fast) var(--ease);
}

#menu ul li a:hover {
  background: rgba(255, 255, 255, 0.08);
}

#menu ul li a:active {
  background: rgba(255, 255, 255, 0.12);
}

/* Pílula do ícone */
#menu ul li a .el-icon {
  width: 46px;
  /* Ligeiramente maior */
  height: 46px;
  border-radius: 14px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #fff !important;
  font-size: 1.25rem;
  /* Ícone ligeiramente maior */

  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
  transition: transform var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease), filter var(--t-fast) var(--ease);
  will-change: transform, box-shadow, filter;
}

#menu ul li a .text {
  display: block;
  width: 100%;
  max-width: calc(var(--sb-width) - 10px);
  /* Limita largura do texto */

  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  /* Reduzido de 800 para melhor legibilidade */
  font-size: 10px;
  line-height: 1.25;
  /* Melhor legibilidade */
  letter-spacing: 0.2px;
  text-align: center;
  text-transform: uppercase;

  padding: 0 2px 2px;
  white-space: nowrap;
  /* Evita quebra de linha */
  overflow: hidden;
  text-overflow: ellipsis;
  /* Trunca com ... se necessário */
}

/* Modo compact (só ícones) - ativado via classe ou variável */
#menu.is-icons-only .text {
  display: none !important;
}

#menu.is-icons-only ul li a {
  gap: 0;
  padding-top: 8px;
  padding-bottom: 8px;
}

/* Feedback */
#menu ul li:hover a .el-icon {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.28);
  filter: brightness(1.03);
}

#menu ul li.active a .el-icon {
  transform: translateY(-1px) scale(1.03);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.32);
}

/* Gradientes por item (mantido) */
#menu ul li:nth-child(1) a .el-icon {
  background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
}

#menu ul li:nth-child(2) a .el-icon {
  background: linear-gradient(180deg, #a855f7 0%, #7c3aed 100%);
}

#menu ul li:nth-child(3) a .el-icon {
  background: linear-gradient(180deg, #fb923c 0%, #f97316 100%);
}

#menu ul li:nth-child(4) a .el-icon {
  background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%);
}

#menu ul li:nth-child(5) a .el-icon {
  background: linear-gradient(180deg, #f472b6 0%, #db2777 100%);
}

#menu ul li:nth-child(6) a .el-icon {
  background: linear-gradient(180deg, #34d399 0%, #10b981 100%);
}

/* Badge versão */
#version {
  position: absolute;
  bottom: 0.65rem;
  left: 0.2rem;
  width: calc(var(--sb-width) - 0.4rem);

  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.95);

  padding: 0.35rem 0.45rem;
  font-size: 0.56rem;

  border-radius: 10px;
  text-align: center;
  font-weight: 700;

  cursor: default;
  user-select: text;
}

/* ===========================
 *  PANEL (#open)
 * =========================== */
#open {
  height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);

  display: flex;
  justify-content: space-between;
  align-content: center;

  transition: opacity var(--t-med) var(--ease), width var(--t-med) var(--ease);
  opacity: 0;
  width: 0;

  overflow: hidden;
  position: relative;
  z-index: var(--z-panel);
}

#open.shown {
  opacity: 1;
  width: var(--panel-width);
}

#open.allowExpand.expanded {
  width: calc(var(--panel-width) * 2) !important;
}

#open.shown.editing {
  width: 130px !important;
}

#open.shown.editing div {
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-between;
}

#open #rv {
  overflow-y: auto;
  overflow-x: hidden;
  height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)) - 80px);
  padding: 10px 8px;
  /* Scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: #c9c9c9 transparent;
}

#open #rv::-webkit-scrollbar {
  width: 6px;
}

#open #rv::-webkit-scrollbar-track {
  background: transparent;
}

#open #rv::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 6px;
}

#open #rv::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}

/* Expand button */
#open.allowExpand .expandBtn {
  position: absolute;
  left: calc(var(--panel-width) - 145px);
  top: 50%;
  z-index: calc(var(--z-panel) + 5);

  border: 1px solid rgba(255, 255, 255, 0.8);
  background: var(--el-color-primary);

  padding: 22px 6px;
  color: #fff;

  transform: translate(0, -50%);
  border-radius: 0 10px 10px 0;
  cursor: pointer;

  transition: transform var(--t-fast) var(--ease), padding var(--t-fast) var(--ease), filter var(--t-fast) var(--ease);
}

#open.allowExpand .expandBtn:hover {
  filter: brightness(1.08);
  padding: 22px 10px;
}

#open.allowExpand.expanded .expandBtn {
  left: calc(var(--panel-width) * 2 - 155px);
}

#open.allowExpand.expanded .expandBtn i {
  transform: rotate(180deg);
}

/* Heading do painel */
#heading {
  text-align: center;
  font-weight: 800;
  letter-spacing: 0.2px;

  /* White-label-friendly: usa primary + escurecimento neutro */
  background: linear-gradient(135deg, var(--el-color-primary) 0%, rgba(0, 0, 0, 0.30) 140%);
  border-radius: var(--r-xl);

  padding: 12px 42px;
  color: var(--el-color-white);

  position: relative;
  margin: 10px;

  box-shadow: var(--shadow-sm);
}

#heading span:first-child,
#heading span:last-child {
  position: absolute;
  top: 0;
  padding: 8px;
  font-size: 22px;
  cursor: pointer;
  transition: transform var(--t-fast) var(--ease), filter var(--t-fast) var(--ease);
}

#heading span:first-child {
  left: 8px;
}

#heading span:last-child {
  right: 8px;
}

#heading span:hover {
  transform: scale(1.08);
  filter: brightness(1.05);
}

/* RTL */
body.rtl #app div #content {
  flex-direction: row-reverse !important;
}

/* ===========================
 *  MAIN (MAPA)
 * =========================== */
#main {
  flex: 1 1 auto;
  width: auto !important;

  height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
  position: relative;
  z-index: 1;

  transition: width var(--t-med) var(--ease), padding-inline-end var(--t-med) var(--ease), margin-left var(--t-med) var(--ease), filter var(--t-med) var(--ease);
}

#main.sidebar-closed {
  width: auto !important;
}

#main.minimized {
  height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)) - 15px) !important;
}

/* ===========================
 *  FORM ITEMS (Element Plus)
 * =========================== */
.el-form-item {
  margin-bottom: 6px !important;
  padding: 0 !important;
}

.el-form-item__label {
  height: 20px !important;
  padding: 2px 0 0 0 !important;
  line-height: 20px !important;
}

/* ===========================
 *  NOTIFICATIONS (classes utilitárias)
 * =========================== */
.notification-soft-red {
  --el-color-white: #ffdddd !important;
  --el-notification-icon-color: #181818 !important;
  --el-notification-content-color: #181818 !important;
}

.notification-soft-red .el-icon {
  color: #181818 !important;
}

.notification-red {
  --el-color-white: #f44336 !important;
  --el-notification-icon-color: #fff !important;
  --el-notification-title-color: #fff !important;
}

.notification-red .el-icon {
  color: #fff !important;
}

.notification-soft-yellow {
  --el-color-white: #ffffcc !important;
  --el-notification-icon-color: #181818 !important;
  --el-notification-title-color: #181818 !important;
}

.notification-soft-yellow .el-icon {
  color: #181818 !important;
}

.notification-yellow {
  --el-color-white: #ffeb3b !important;
  --el-notification-icon-color: #181818 !important;
  --el-notification-title-color: #181818 !important;
}

.notification-yellow .el-icon {
  color: #181818 !important;
}

.notification-soft-green {
  --el-color-white: #ddffdd !important;
  --el-notification-icon-color: #181818 !important;
  --el-notification-title-color: #181818 !important;
}

.notification-soft-green .el-icon {
  color: #181818 !important;
}

.notification-green {
  --el-color-white: #4CAF50 !important;
  --el-notification-icon-color: #fff !important;
  --el-notification-title-color: #fff !important;
}

.notification-green .el-icon {
  color: #fff !important;
}

.notification-soft-info {
  --el-color-white: #ddffff !important;
  --el-notification-icon-color: #181818 !important;
  --el-notification-title-color: #181818 !important;
}

.notification-soft-info .el-icon {
  color: #181818 !important;
}

.notification-info {
  --el-color-white: #2196F3 !important;
  --el-notification-icon-color: #fff !important;
  --el-notification-title-color: #fff !important;
}

.notification-info .el-icon {
  color: #fff !important;
}

.el-notification__content {
  background: #fff !important;
  color: #111 !important;
  padding: 6px;
  border-radius: 8px;
  min-width: 255px;
}

/* ===========================
 *  CUSTOM FILTERS
 * =========================== */
.customFilter {
  margin-left: 1px;
  padding: 10px;
  background: white;
  text-align: center;
  margin-bottom: 6px;
  border-radius: 10px;
  color: white;
  box-shadow: 0 2px 10px rgba(45, 45, 45, 0.14);
  cursor: pointer;
  transition: transform var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease);
}

.customFilter:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(45, 45, 45, 0.18);
}

.all {
  background: var(--el-color-info);
}

.online {
  background: var(--el-color-success);
}

.offline {
  background: var(--el-color-danger);
}

.unknown {
  background: var(--el-color-warning);
}

.motion {
  background: var(--el-color-primary);
}

.customFilter.active {
  border: 2px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 10px 22px rgba(45, 45, 45, 0.22);
}

/* ===========================
 *  MODALS (Overlay + Slide-to-confirm)
 * =========================== */
.modal-overlay {
  position: fixed;
  inset: 0;

  background: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(6px);

  z-index: var(--z-modal);

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
}

.modal-content {
  width: 420px;
  max-width: 96vw;

  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);

  color: #222;
  border-radius: var(--r-lg);
  padding: 18px;

  box-shadow: var(--shadow-lg);
  animation: modalSlideIn 240ms var(--ease);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-14px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Vehicle info */
.modal-vehicle-info {
  display: flex;
  gap: 14px;
  margin-bottom: 16px;
}

.modal-vehicle-img {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}

.modal-vehicle-details {
  flex: 1;
}

.modal-vehicle-details h3 {
  margin: 0 0 6px;
  color: #1f2937;
  font-size: 18px;
  font-weight: 800;
}

.modal-vehicle-details p {
  margin: 4px 0;
  color: #4b5563;
  font-size: 13.5px;
}

.status-online {
  color: #16a34a;
  font-weight: 700;
}

.status-offline {
  color: #dc2626;
  font-weight: 700;
}

/* Warning boxes */
.modal-warning {
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.modal-warning h4 {
  margin: 8px 0 6px;
  font-weight: 900;
  letter-spacing: 0.2px;
}

.modal-warning p {
  color: #374151;
  margin: 0;
  font-size: 13.5px;
}

.modal-warning.danger {
  background: linear-gradient(135deg, #fff7ed 0%, #ffe4e6 100%);
  border-color: rgba(220, 38, 38, 0.25);
}

.modal-warning.danger i {
  color: #dc2626;
  font-size: 22px;
  margin-bottom: 6px;
}

.modal-warning.danger h4 {
  color: #b91c1c;
}

.modal-warning.success {
  background: linear-gradient(135deg, #ecfdf5 0%, #e7f8ee 100%);
  border-color: rgba(22, 163, 74, 0.25);
}

.modal-warning.success i {
  color: #16a34a;
  font-size: 22px;
  margin-bottom: 6px;
}

.modal-warning.success h4 {
  color: #16a34a;
}

.modal-warning.warning {
  background: linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%);
  border-color: rgba(245, 158, 11, 0.25);
}

.modal-warning.warning i {
  color: #f59e0b;
  font-size: 22px;
  margin-bottom: 6px;
}

.modal-warning.warning h4 {
  color: #d97706;
}

/* Slider */
.slider-container {
  margin: 16px 0;
}

.slider-label {
  text-align: center;
  margin-bottom: 12px;
  font-weight: 800;
  color: #111827;
  font-size: 13.5px;
}

.slider-track {
  position: relative;
  width: 100%;
  height: 50px;

  background: var(--el-fill-color-light, #e9ecef);
  border-radius: 25px;
  overflow: hidden;

  touch-action: none;
  overscroll-behavior: contain;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;

  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.10);
  outline: none;
}

.slider-track:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25), inset 0 2px 5px rgba(0, 0, 0, 0.10);
}

/* Slider disabled state (commandLoading) */
.slider-track[aria-disabled="true"] {
  opacity: 0.75;
  cursor: not-allowed;
}

.slider-track[aria-disabled="true"] .slider-thumb {
  cursor: not-allowed;
}

/* Garante cursor not-allowed em todos os filhos (evita piscar) */
.slider-track[aria-disabled="true"] * {
  cursor: not-allowed !important;
}

.slider-fill {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  border-radius: 25px;
  transition: width 100ms var(--ease);
}

.slider-fill.danger {
  background: linear-gradient(90deg, #ef4444, #b91c1c);
}

.slider-fill.success {
  background: linear-gradient(90deg, #22c55e, #15803d);
}

.slider-fill.warning {
  background: linear-gradient(90deg, #f59e0b, #b45309);
}

.slider-thumb {
  position: absolute;
  top: 2px;

  width: 46px;
  height: 46px;
  border-radius: 999px;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: grab;
  z-index: 10;

  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.20);
  transition: background var(--t-fast) var(--ease), transform var(--t-fast) var(--ease);
  touch-action: none;
}

.slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.05);
}

.slider-thumb.confirmed {
  color: #fff;
}

.slider-text,
.slider-confirmed {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  z-index: 5;
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
  pointer-events: none;
}

.slider-text {
  color: #6b7280;
  transition: opacity var(--t-fast) var(--ease);
}

.slider-confirmed {
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.30);
}

/* Actions */
.modal-actions {
  text-align: center;
  margin-top: 16px;
}

.btn-cancel {
  padding: 12px 24px;
  /* White-label-friendly */
  background: linear-gradient(135deg, var(--el-color-primary) 0%, rgba(0, 0, 0, 0.30) 140%);
  color: white;

  border: none;
  border-radius: 10px;

  cursor: pointer;
  font-size: 14px;
  font-weight: 800;

  transition: transform var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease), filter var(--t-fast) var(--ease);
}

.btn-cancel:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  filter: brightness(1.03);
}

.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===========================
 *  CONNECTION STATUS
 * =========================== */
.connection-status {
  position: fixed;
  bottom: 20px;
  left: 20px;

  padding: 10px 14px;
  border-radius: 10px;

  display: flex;
  align-items: center;
  gap: 8px;

  font-size: 13px;
  font-weight: 800;

  z-index: var(--z-conn);
  box-shadow: var(--shadow-sm);

  animation: connIn 240ms var(--ease);
}

.connection-status.offline {
  background: linear-gradient(135deg, #fee2e2, #ffd7d7);
  color: #b91c1c;
  border: 1px solid #fecaca;
}

@keyframes connIn {
  from {
    transform: translateY(10px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* ===========================
 *  WHATSAPP FLOAT BUTTON
 * =========================== */
.whatsapp-float {
  position: fixed;
  right: calc(12px + var(--sar, 0px));
  bottom: calc(12px + var(--sab, 0px));
  z-index: var(--z-whatsapp);

  text-decoration: none;
  display: block;

  isolation: isolate; /* evita "furar" stacking context em Safari */
  transition: transform var(--t-fast) var(--ease), filter var(--t-fast) var(--ease), opacity var(--t-fast) var(--ease);
}

/* Esconde WhatsApp quando modal está aberto (evita conflito de clique) */
.modal-open .whatsapp-float {
  pointer-events: none;
  opacity: 0.4;
}

.whatsapp-float:hover {
  transform: scale(1.08);
  filter: drop-shadow(0 4px 12px rgba(37, 211, 102, 0.35));
}

.whatsapp-float:active {
  transform: scale(0.96);
}

.whatsapp-float img {
  display: block;
  width: 56px;
  height: 56px;
  object-fit: contain;
}

/* ===========================
 *  GLOBAL LOADING BAR
 * =========================== */
.global-loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  z-index: var(--z-loading);
  pointer-events: none;
}

.global-loading-bar .el-progress {
  --el-progress-text-color: transparent;
}

.global-loading-bar .el-progress__bar {
  height: 4px !important;
}

/* ===========================
 *  ELEMENT PLUS DIALOG (ONE SOURCE OF TRUTH)
 * =========================== */
.el-dialog {
  border-radius: var(--r-lg) !important;
  overflow: hidden;
}

.el-dialog__header {
  padding: 18px 18px 14px !important;
  /* White-label: segue o tema do cliente */
  background: linear-gradient(
    135deg,
    var(--el-color-primary) 0%,
    rgba(0, 0, 0, 0.35) 140%
  );
  color: white;
  position: relative;
}

.el-dialog__title {
  color: white !important;
  font-size: 18px !important;
  font-weight: 800 !important;
}

.el-dialog__headerbtn {
  top: 18px !important;
  right: 18px !important;

  width: 34px !important;
  height: 34px !important;

  background: rgba(255, 255, 255, 0.18) !important;
  border-radius: 999px !important;

  transition: transform var(--t-med) var(--ease), background var(--t-med) var(--ease) !important;
  z-index: 10 !important;
}

.el-dialog__headerbtn:hover {
  background: rgba(255, 255, 255, 0.28) !important;
  transform: rotate(90deg) !important;
}

.el-dialog__headerbtn .el-dialog__close {
  color: white !important;
  font-size: 18px !important;
  font-weight: 900 !important;
}

.el-dialog__body {
  padding: 22px 22px 18px !important;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.el-dialog__footer {
  padding: 14px 22px 18px !important;
  background: #f8fafc;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.el-dialog__footer .el-button {
  min-width: 100px !important;
  height: 40px !important;
  border-radius: 10px !important;
  font-weight: 700 !important;
}

.el-dialog__footer .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
}

.el-dialog__footer .el-button--default {
  background: white !important;
  border: 1px solid #dcdfe6 !important;
}

/* Dialog scrollbar */
.el-dialog__body::-webkit-scrollbar {
  width: 8px;
}

.el-dialog__body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.el-dialog__body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.el-dialog__body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* ===========================
 *  MOBILE (PORTRAIT)
 * =========================== */
#expander {
  display: none;
  text-align: center;
  padding: 5px;
  background: #f3f3f3;
}

@media (orientation: portrait) {

  /* Menu vira overlay */
  #menu {
    flex: 0 0 0;
    width: 0;
    overflow: hidden;

    position: fixed;
    left: 0;
    top: calc(var(--header-height) + var(--sat));

    z-index: var(--z-menu);

    height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)) - var(--sab));
    max-height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)) - var(--sab));
    padding-bottom: var(--sab);
  }

  #menu.isopen {
    flex: 0 0 var(--sb-width);
    width: var(--sb-width) !important;
    overflow-y: auto;
    overflow-x: hidden;
    box-shadow: 10px 0 24px rgba(0, 0, 0, 0.16);
    padding-bottom: calc(var(--sab) + 70px); /* espaço para o badge de versão */
  }

  /* Badge versão: sticky no mobile para não sumir no scroll */
  #menu.isopen #version {
    position: sticky;
    bottom: calc(10px + var(--sab));
    left: 0.2rem;
    margin-top: 12px;
    z-index: 2;
  }

  /* Mobile: só ícones (sem texto) para economia de espaço */
  #menu .text {
    display: none !important;
  }

  #menu ul li a {
    gap: 0;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  #menu ul li {
    padding: 6px 0;
  }

  #btnmenu {
    display: block;
  }

  .uname {
    display: none !important;
  }

  #main {
    flex: 1 1 auto;
    width: 100vw !important;
    max-width: 100vw !important;
    height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
    max-height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
  }

  /* Scrim: camada escura clicável quando menu está aberto (fecha menu) */
  .menu-scrim {
    position: fixed;
    left: var(--sb-width);
    top: calc(var(--header-height) + var(--sat));
    right: 0;
    bottom: 0;
    z-index: calc(var(--z-menu) - 1);
    background: rgba(0, 0, 0, 0.25);
    cursor: pointer;
  }

  /* Menu overlay: mapa fica por baixo do scrim */
  #main.menuShown {
    width: 100vw !important;
    max-width: 100vw !important;
    margin-left: 0 !important;
    overflow: hidden;
  }

  #content {
    overflow: hidden;
  }

  /* Painel bottom */
  #open.shown.bottom {
    position: fixed;
    width: 100%;
    height: 40vh;

    left: 0;
    right: 0;
    bottom: 0;
    top: auto;

    z-index: var(--z-panel);
    padding-bottom: var(--sab);
  }

  #open.bottom {
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.16);
    border-radius: 16px 16px 0 0 !important;
    overflow: hidden;
  }

  #open.bottom.mobileExpanded {
    height: calc(var(--vh, 100vh) - 100px) !important;
  }

  #open.bottom #heading {
    display: none !important;
  }

  #open.bottom .kr-spacer {
    display: none !important;
  }

  #open.bottom #expander {
    display: block !important;
  }

  #main.bottom {
    height: calc(var(--vh, 100vh) - 0rem);
    margin-bottom: -40vh;
    padding-bottom: 40vh;
  }

  #main.bottom.minimized {
    margin-bottom: 0;
    padding-bottom: 0;
  }

  /* Painel fullscreen (quando não é bottom) */
  #open.shown:not(.bottom) {
    position: fixed !important;
    left: 0 !important;
    top: calc(var(--header-height) + var(--sat)) !important;

    width: 100vw !important;
    height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat))) !important;
    max-height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat))) !important;

    z-index: var(--z-panel) !important;
    background: var(--el-bg-color) !important;
    overflow: hidden;
  }

  #open.shown #rv {
    width: 100%;
    height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)) - 60px) !important;
    max-height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)) - 60px) !important;
    overflow-y: auto;
    padding: 10px;
  }

  /* Dialog */
  .el-dialog {
    --el-dialog-width: 95vw !important;
  }

  .el-dialog__footer {
    overflow: auto;
    margin-right: 10px;
  }

  .modal-content {
    width: 96vw;
    max-width: 96vw;
  }
}

/* Mobile dialog (largura pequena) */
@media (max-width: 768px) {
  .el-dialog {
    width: 95% !important;
    margin: 10px auto !important;
  }

  .el-dialog__body {
    padding: 18px 14px !important;
    max-height: calc(100vh - 180px) !important;
  }
}
</style>