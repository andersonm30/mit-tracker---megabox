<template>
  <!-- Loading Progress -->
  <div v-if="!store.getters['server/isReady']" style="width: 100%;position: absolute;left: 0px; top: 0px;z-index: 999999999">
    <el-progress
      :percentage="100"
      :indeterminate="true"
      :duration="2"
      :show-text="false"
      :color="primaryColor"
    />
  </div>

  <context-menu ref="contextMenuRef"></context-menu>
  <showtip></showtip>

  <!-- WhatsApp Button -->
  <div
    v-if="store.state.server.labelConf.whatsapp && store.state.server.labelConf.whatsapp!=''"
    style="position: absolute;right: 0px; bottom: 12px;z-index: 9999999999;"
  >
    <a
      :href="'https://wa.me/'+store.state.server.labelConf.whatsapp"
      style="text-decoration: none;"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir conversa no WhatsApp"
    >
      <img src="img/whatsapp.png" alt="WhatsApp" />
    </a>
  </div>

  <!-- Indicador de conexão -->
  <div v-if="!isOnline" class="connection-status offline">
    <i class="fas fa-wifi-slash" aria-hidden="true"></i>
    <span>Sem conexão</span>
  </div>

  <div v-if="store.state.auth">
    /* IFTRUE_myFlag */
    <edit-calendars ref="editCalendarsRef"></edit-calendars>
    <link-objects ref="linkObjectsRef"></link-objects>
    <log-objects ref="logObjectsRef"></log-objects>

    <edit-share v-if="store.state.server.isPlus" ref="editShareRef"></edit-share>
    <edit-shares v-if="store.state.server.isPlus" ref="editSharesRef"></edit-shares>

    <edit-group ref="editGroupRef"></edit-group>
    <edit-users ref="editUsersRef"></edit-users>
    <edit-server ref="editServerRef"></edit-server>
    <edit-drivers ref="editDriversRef"></edit-drivers>
    <edit-maintenances ref="editMaintenancesRef"></edit-maintenances>
    <edit-theme v-if="store.state.server.isPlus" ref="editThemeRef"></edit-theme>
    /* FITRUE_myFlag */

    <edit-user ref="editUserRef"></edit-user>
    <edit-notifications ref="editNotificationsRef"></edit-notifications>
    <edit-device ref="editDeviceRef"></edit-device>
    <qr-device ref="qrDeviceRef"></qr-device>
    <show-graphic ref="showGraphicsRef"></show-graphic>
    <user-notice-modal ref="userNoticeModalRef"></user-notice-modal>

    <!-- ========== MODAL DE BLOQUEIO ========== -->
    <div
      v-if="showBlockModal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blockTitle"
      aria-describedby="blockDesc"
      tabindex="-1"
      @keydown.esc.stop="cancelBlock"
    >
      <div class="modal-content">
        <div class="modal-vehicle-info">
          <img
            :src="getVehicleImage(currentDevice)"
            :alt="currentDevice?.name || 'Veículo'"
            @error="onVehicleImgError"
            class="modal-vehicle-img"
          />
          <div class="modal-vehicle-details">
            <h3>{{ currentDevice?.name }}</h3>
            <p v-if="currentDevice?.uniqueId"><strong>IMEI:</strong> {{ currentDevice.uniqueId }}</p>
            <p v-if="currentDevice?.attributes?.placa"><strong>Placa:</strong> {{ currentDevice.attributes.placa }}</p>
            <p>
              <strong>Status:</strong>
              <span :class="currentDevice?.status === 'online' ? 'status-online' : 'status-offline'">
                {{ currentDevice?.status === 'online' ? 'Online' : 'Offline' }}
              </span>
            </p>
          </div>
        </div>

        <div id="blockDesc" class="modal-warning danger">
          <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
          <h4 id="blockTitle">ATENÇÃO - USO APENAS EM EMERGÊNCIA</h4>
          <p>{{ currentDevice?.status === 'online' ? 'Este comando deve ser usado somente em casos de emergência como roubo ou furto.' : 'O veículo está offline. O comando será enviado quando reconectar.' }}</p>
        </div>

        <div class="slider-container">
          <p class="slider-label">Deslize para confirmar bloqueio</p>
          <div
            ref="blockSlider"
            class="slider-track"
            role="slider"
            tabindex="0"
            @keydown.stop="onSliderKeydown('block', $event)"
            aria-label="Deslize para confirmar bloqueio"
            aria-orientation="horizontal"
            :aria-valuemin="0"
            :aria-valuemax="100"
            :aria-valuenow="Math.round(blockProgress)"
            :aria-disabled="commandLoading"
            :style="{ pointerEvents: commandLoading ? 'none' : 'auto' }"
          >
            <div class="slider-fill danger" :style="{ width: blockProgress + '%' }"></div>
            <div
              ref="blockThumb"
              class="slider-thumb"
              :class="{ confirmed: blockConfirmed }"
              :style="{ left: blockThumbPosition + 'px', background: blockConfirmed ? 'var(--el-color-danger)' : 'white' }"
              @pointerdown="startDrag('block', $event)"
            >
              <i class="fas fa-lock" aria-hidden="true"></i>
            </div>
            <span class="slider-text" :style="{ opacity: blockConfirmed ? 0 : 1 }">→ Deslize para Bloquear</span>
            <span v-if="blockConfirmed" class="slider-confirmed" aria-live="polite">✓ Confirmado</span>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelBlock" :disabled="commandLoading">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- ========== MODAL DE DESBLOQUEIO ========== -->
    <div
      v-if="showUnlockModal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlockTitle"
      aria-describedby="unlockDesc"
      tabindex="-1"
      @keydown.esc.stop="cancelUnlock"
    >
      <div class="modal-content">
        <div class="modal-vehicle-info">
          <img
            :src="getVehicleImage(currentDevice)"
            :alt="currentDevice?.name || 'Veículo'"
            @error="onVehicleImgError"
            class="modal-vehicle-img"
          />
          <div class="modal-vehicle-details">
            <h3>{{ currentDevice?.name }}</h3>
            <p v-if="currentDevice?.uniqueId"><strong>IMEI:</strong> {{ currentDevice.uniqueId }}</p>
            <p v-if="currentDevice?.attributes?.placa"><strong>Placa:</strong> {{ currentDevice.attributes.placa }}</p>
            <p>
              <strong>Status:</strong>
              <span :class="currentDevice?.status === 'online' ? 'status-online' : 'status-offline'">
                {{ currentDevice?.status === 'online' ? 'Online' : 'Offline' }}
              </span>
            </p>
          </div>
        </div>

        <div id="unlockDesc" class="modal-warning success">
          <i class="fas fa-unlock" aria-hidden="true"></i>
          <h4 id="unlockTitle">CONFIRMAÇÃO NECESSÁRIA</h4>
          <p>{{ currentDevice?.status === 'online' ? 'Confirme que deseja executar este comando no veículo.' : 'O veículo está offline. O comando será enviado quando reconectar.' }}</p>
        </div>

        <div class="slider-container">
          <p class="slider-label">Deslize para confirmar desbloqueio</p>
          <div
            ref="unlockSlider"
            class="slider-track"
            role="slider"
            tabindex="0"
            @keydown.stop="onSliderKeydown('unlock', $event)"
            aria-label="Deslize para confirmar desbloqueio"
            :aria-valuenow="Math.round(unlockProgress)"
            :aria-disabled="commandLoading"
            :style="{ pointerEvents: commandLoading ? 'none' : 'auto' }"
          >
            <div class="slider-fill success" :style="{ width: unlockProgress + '%' }"></div>
            <div
              ref="unlockThumb"
              class="slider-thumb"
              :class="{ confirmed: unlockConfirmed }"
              :style="{ left: unlockThumbPosition + 'px', background: unlockConfirmed ? 'var(--el-color-success)' : 'white' }"
              @pointerdown="startDrag('unlock', $event)"
            >
              <i class="fas fa-unlock" aria-hidden="true"></i>
            </div>
            <span class="slider-text" :style="{ opacity: unlockConfirmed ? 0 : 1 }">→ Deslize para Desbloquear</span>
            <span v-if="unlockConfirmed" class="slider-confirmed" aria-live="polite">✓ Confirmado</span>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelUnlock" :disabled="commandLoading">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- ========== MODAL DE ÂNCORA ========== -->
    <div
      v-if="showAnchorModal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="anchorTitle"
      aria-describedby="anchorDesc"
      tabindex="-1"
      @keydown.esc.stop="cancelAnchor"
    >
      <div class="modal-content">
        <div class="modal-vehicle-info">
          <img
            :src="getVehicleImage(currentDevice)"
            :alt="currentDevice?.name || 'Veículo'"
            @error="onVehicleImgError"
            class="modal-vehicle-img"
          />
          <div class="modal-vehicle-details">
            <h3>{{ currentDevice?.name }}</h3>
            <p v-if="currentDevice?.uniqueId"><strong>IMEI:</strong> {{ currentDevice.uniqueId }}</p>
            <p v-if="currentDevice?.attributes?.placa"><strong>Placa:</strong> {{ currentDevice.attributes.placa }}</p>
            <p>
              <strong>Status:</strong>
              <span :class="currentDevice?.status === 'online' ? 'status-online' : 'status-offline'">
                {{ currentDevice?.status === 'online' ? 'Online' : 'Offline' }}
              </span>
            </p>
          </div>
        </div>

        <div id="anchorDesc" class="modal-warning warning">
          <i class="fas fa-anchor" aria-hidden="true"></i>
          <h4 id="anchorTitle">{{ currentCommand?.type === 'anchor_enable' ? 'ATIVAR ÂNCORA' : 'DESATIVAR ÂNCORA' }}</h4>
          <p>{{ currentCommand?.type === 'anchor_enable' ? 'A âncora irá alertar se o veículo sair do local atual.' : 'A âncora será desativada e alertas de movimento serão suspensos.' }}</p>
        </div>

        <div class="slider-container">
          <p class="slider-label">Deslize para confirmar</p>
          <div
            ref="anchorSlider"
            class="slider-track"
            role="slider"
            tabindex="0"
            @keydown.stop="onSliderKeydown('anchor', $event)"
            aria-label="Deslize para confirmar"
            :aria-valuenow="Math.round(anchorProgress)"
            :aria-disabled="commandLoading"
            :style="{ pointerEvents: commandLoading ? 'none' : 'auto' }"
          >
            <div class="slider-fill warning" :style="{ width: anchorProgress + '%' }"></div>
            <div
              ref="anchorThumb"
              class="slider-thumb"
              :class="{ confirmed: anchorConfirmed }"
              :style="{ left: anchorThumbPosition + 'px', background: anchorConfirmed ? 'var(--el-color-warning)' : 'white' }"
              @pointerdown="startDrag('anchor', $event)"
            >
              <i class="fas fa-anchor" aria-hidden="true"></i>
            </div>
            <span class="slider-text" :style="{ opacity: anchorConfirmed ? 0 : 1 }">{{ currentCommand?.type === 'anchor_enable' ? '→ Ativar' : '→ Desativar' }}</span>
            <span v-if="anchorConfirmed" class="slider-confirmed" aria-live="polite">✓ Confirmado</span>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelAnchor" :disabled="commandLoading">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- ========== MODAL DE EXCLUSÃO ========== -->
    <div
      v-if="showDeleteModal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deleteTitle"
      aria-describedby="deleteDesc"
      tabindex="-1"
      @keydown.esc.stop="cancelDelete"
    >
      <div class="modal-content">
        <div class="modal-vehicle-info">
          <img
            :src="getVehicleImage(currentDevice)"
            :alt="currentDevice?.name || 'Veículo'"
            @error="onVehicleImgError"
            class="modal-vehicle-img"
          />
          <div class="modal-vehicle-details">
            <h3 id="deleteTitle" style="color: #dc3545;">⚠️ Excluir Dispositivo</h3>
            <p><strong>Nome:</strong> {{ currentDevice?.name }}</p>
            <p>
              <strong>Status:</strong>
              <span :class="currentDevice?.status === 'online' ? 'status-online' : 'status-offline'">
                {{ currentDevice?.status === 'online' ? 'Online' : 'Offline' }}
              </span>
            </p>
          </div>
        </div>

        <div id="deleteDesc" class="modal-warning danger">
          <p style="font-weight: bold;">🗑️ Tem certeza que deseja excluir este dispositivo?</p>
          <p style="font-size: 12px; margin-top: 5px;">Esta ação não pode ser desfeita.</p>
        </div>

        <div class="slider-container">
          <p class="slider-label">Deslize para confirmar exclusão</p>
          <div
            ref="deleteSlider"
            class="slider-track"
            role="slider"
            tabindex="0"
            @keydown.stop="onSliderKeydown('delete', $event)"
            aria-label="Deslize para confirmar exclusão"
            :aria-valuenow="Math.round(deleteProgress)"
            :aria-disabled="commandLoading"
            :style="{ pointerEvents: commandLoading ? 'none' : 'auto' }"
          >
            <div class="slider-fill danger" :style="{ width: deleteProgress + '%' }"></div>
            <div
              ref="deleteThumb"
              class="slider-thumb"
              :class="{ confirmed: deleteConfirmed }"
              :style="{ left: deleteThumbPosition + 'px', background: deleteConfirmed ? 'var(--el-color-danger)' : 'white' }"
              @pointerdown="startDrag('delete', $event)"
            >
              <i class="fas fa-trash" aria-hidden="true"></i>
            </div>
            <span class="slider-text" :style="{ opacity: deleteConfirmed ? 0 : 1 }">→ Deslize para Excluir</span>
            <span v-if="deleteConfirmed" class="slider-confirmed" aria-live="polite">✓ Confirmado</span>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelDelete" :disabled="commandLoading">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- ========== WRAPPER COM INERT PARA ACESSIBILIDADE ========== -->
    <div
      :inert="modalOpen"
      :aria-hidden="modalOpen ? 'true' : 'false'"
    >
      <div id="head">
        <div id="btnmenu" @click.stop="toggleSidebar" aria-label="Alternar menu">
          <i class="fas fa-bars" aria-hidden="true"></i>
        </div>
        <div id="logo">
          <img
            v-if="store.state.server.labelConf.headLogo.image"
            src="/tarkan/assets/custom/logo.png"
            @click="$router.push('/')"
            style="width: 11rem; cursor: pointer;"
            alt="Logo"
          />
          <div v-else style="font-weight: bold;text-transform: uppercase;font-family: montserrat, roboto;">
            <a @click.prevent="$router.push('/')" style="cursor: pointer; color: var(--el-text-color-primary); text-decoration: none;" aria-label="Ir para a página inicial">
              {{store.state.server.labelConf.headLogo.text}}
            </a>
          </div>
        </div>
        <div style="display: flex;">
          <el-tooltip :content="(store.state.events.mute)?'Ouvir Notificações':'Silenciar Notificações'">
            <div id="mute" @click="store.dispatch('events/toggleMute')" style="cursor: pointer;font-size: 1.2rem;margin: 0.3rem 0.5rem;" aria-label="Alternar som de notificações">
              <span v-if="store.state.events.mute"><i class="fas fa-volume-mute" style="color: silver;" aria-hidden="true"></i></span>
              <span v-else><i class="fas fa-volume-up" aria-hidden="true"></i></span>
            </div>
          </el-tooltip>

          <push-notification-btn v-if="store.state.auth"></push-notification-btn>

          <div id="user" @click="userMenu($event)" style="cursor: pointer;" aria-label="Abrir menu do usuário">
            <div class="uname" v-if="store.state.auth && !store.state.auth.attributes['isShared']" style="font-size: 0.8rem;margin: 0.5rem 0.5rem;">
              {{store.state.auth.name}}
            </div>
            <div class="uname" v-else style="text-align: right;font-size: 1.4rem;margin: 0.3rem 0.5rem;">
              <div style="font-size: 0.3rem;">Expira em:</div>
              <div style="font-size: 0.5rem">{{store.getters.expiresCountDown}}</div>
            </div>
            <i style="font-size: 1.4rem;margin: 0.3rem 0.5rem;" class="fas fa-user-circle" aria-hidden="true"></i>
          </div>
        </div>
      </div>

      <div id="content">
        <template v-if="store.getters['isDriver']">
          <router-view></router-view>
        </template>

        <template v-else>
          <div id="menu" :class="{isopen: menuShown, 'sidebar-closed': sidebarClosed}" v-if="store.state.auth && !store.state.auth.attributes['isShared']">
            <ul>
              <router-link v-if="store.getters.advancedPermissions(8)" to="/devices" custom v-slot="{ href, navigate, isActive, isExactActive }">
                <li :class="{active: isActive || isExactActive,'exact-active': isExactActive}">
                  <a :href="href" @click="(e) => { navigate(e); autoCloseSidebarOnNav(); }">
                    <el-icon><i class="fas fa-car" aria-hidden="true"></i></el-icon>
                    <span class="text">{{$t('menu.user')}}</span>
                  </a>
                </li>
              </router-link>

              <router-link v-if="store.getters.advancedPermissions(72)" to="/reports" custom v-slot="{ href, navigate, isActive, isExactActive }">
                <li :class="{active: isActive,'exact-active': isExactActive}">
                  <a :href="href" @click="(e) => { navigate(e); autoCloseSidebarOnNav(); }">
                    <el-icon><i class="fas fa-chart-bar" aria-hidden="true"></i></el-icon>
                    <span class="text">{{$t('menu.reports')}}</span>
                  </a>
                </li>
              </router-link>

              /* IFTRUE_myFlag */
              <router-link v-if="store.getters.advancedPermissions(40)" to="/geofence" custom v-slot="{ href, navigate, isActive, isExactActive }">
                <li :class="{active: isActive,'exact-active': isExactActive}">
                  <a :href="href" @click="(e) => { navigate(e); autoCloseSidebarOnNav(); }">
                    <el-icon><i class="fas fa-draw-polygon" aria-hidden="true"></i></el-icon>
                    <span class="text">{{$t('menu.geofence')}}</span>
                  </a>
                </li>
              </router-link>

              <router-link v-if="store.getters.advancedPermissions(56)" to="/commands" custom v-slot="{ href, navigate, isActive, isExactActive }">
                <li :class="{active: isActive,'exact-active': isExactActive}">
                  <a :href="href" @click="(e) => { navigate(e); autoCloseSidebarOnNav(); }">
                    <el-icon><i class="far fa-keyboard" aria-hidden="true"></i></el-icon>
                    <span class="text">{{$t('menu.commands')}}</span>
                  </a>
                </li>
              </router-link>

              <router-link v-if="store.getters.advancedPermissions(48)" to="/groups" custom v-slot="{ href, navigate, isActive, isExactActive }">
                <li :class="{active: isActive,'exact-active': isExactActive}">
                  <a :href="href" @click="(e) => { navigate(e); autoCloseSidebarOnNav(); }">
                    <el-icon><i class="far fa-object-group" aria-hidden="true"></i></el-icon>
                    <span class="text">{{$t('menu.groups')}}</span>
                  </a>
                </li>
              </router-link>
              /* FITRUE_myFlag */

              <router-link to="/notifications" custom v-slot="{ href, navigate, isActive, isExactActive }">
                <li :class="{active: isActive,'exact-active': isExactActive}">
                  <a :href="href" @click="(e) => { navigate(e); autoCloseSidebarOnNav(); }">
                    <el-icon><i class="fas fa-bell" aria-hidden="true"></i></el-icon>
                    <span class="text">{{$t('menu.notifications')}}</span>
                  </a>
                </li>
              </router-link>

              <div class="indicator"></div>
            </ul>

            <div id="version">
              {{$t('version')}}
              <template v-if="store.state.server.serverInfo.version">
                @<br />{{store.state.server.serverInfo.version}}
              </template>
            </div>
          </div>

          <div id="open" :class="{minimized: minimized, bottom: ($route.meta.mobileBottom), mobileExpanded: mobileExpand, shown: ($route.meta.shown), editing: store.state.geofences.mapEditing, allowExpand: $route.meta.allowExpand, expanded: ($route.meta.allowExpand && $route.query.expand==='true')}">
            <div style="width: calc(100%);" :style="{display: (store.state.geofences.mapEditing)?'none':''}">
              <div id="heading">
                <span @click="onOpenBack" aria-label="Voltar"><i class="fas fa-angle-double-left" aria-hidden="true"></i></span>
                {{KT($route.meta.title || 'page')}}
                <span @click="onOpenClose" aria-label="Fechar"><i class="fas fa-times-circle" aria-hidden="true"></i></span>
              </div>

              <div v-if="($route.meta.mobileBottom)" @click="minimized = !minimized" class="showOnMobile" style="position: absolute;right: 35px;top: 5px;font-size: 18px;" aria-label="Minimizar painel">
                <i class="fas fa-window-minimize" aria-hidden="true"></i>
              </div>
              <div v-if="($route.meta.mobileBottom)" @click="onOpenClose" class="showOnMobile" style="position: absolute;right: 5px;top: 5px;font-size: 18px;" aria-label="Fechar painel">
                <i class="fas fa-times-circle" aria-hidden="true"></i>
              </div>
              <div v-if="($route.meta.mobileBottom)" id="expander" @click="mobileExpand = !mobileExpand" aria-label="Alternar expansão do painel">
                <span v-if="!mobileExpand"><i class="fas fa-angle-double-up" aria-hidden="true"></i></span>
                <span v-else><i class="fas fa-angle-double-down" aria-hidden="true"></i></span>
              </div>

              <div id="rv"><router-view></router-view></div>
            </div>

            <div v-if="store.state.geofences.mapEditing">
              <div style="padding: 10px;"><el-button @click="store.dispatch('geofences/disableEditing')" type="primary">Concluir</el-button></div>
              <div style="padding: 10px;"><el-button @click="store.dispatch('geofences/disableEditing')" type="danger" plain>{{KT('Cancel')}}</el-button></div>
            </div>

            <div
              v-if="$route.meta.allowExpand"
              class="expandBtn"
              @click="$router.push({ query: { ...$route.query, expand: ($route.query.expand==='true' ? 'false' : 'true') } })"
              aria-label="Expandir painel"
            >
              <i class="fas fa-angle-double-right" aria-hidden="true"></i>
            </div>
          </div>

          <div
            id="main"
            @click="handleMainClick"
            :class="{'sidebar-closed': sidebarClosed, menuShown: menuShown, editing: store.state.geofences.mapEditing, minimized: minimized, bottom: ($route.meta.mobileBottom), shown: ($route.meta.shown)}"
            :style="mainDynamicStyle"
          >
            /* IFTRUE_myFlag */
            <street-view v-if="store.state.devices.streetview"></street-view>
            <iframe-calor v-if="store.state.devices.toggleCalor"></iframe-calor>
            <iframe-percurso v-if="store.state.devices.showPercurso"></iframe-percurso>
            <iframe-pontos v-if="store.state.devices.showPontos"></iframe-pontos>
            /* FITRUE_myFlag */

            <kore-map></kore-map>
          </div>
        </template>
      </div>
    </div>
  </div>

  <div v-else>
    <router-view></router-view>
  </div>
</template>

<script setup>
/* ===========================
 *  IMPORTS
 * =========================== */
import { defineAsyncComponent, ref, onMounted, onBeforeUnmount, provide, nextTick, computed, watch } from 'vue'
import { useStore } from 'vuex'

import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/tooltip/style/css'
import 'element-plus/es/components/progress/style/css'
import 'element-plus/es/components/dialog/style/css'

import { ElProgress } from 'element-plus/es/components/progress'
import { ElButton } from 'element-plus/es/components/button'
import { ElIcon } from 'element-plus/es/components/icon'
import { ElTooltip } from 'element-plus/es/components/tooltip'

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
/* IFTRUE_myFlag */
const StreetView = lazy('StreetView', () => import('./tarkan/components/street-view'))
/* FITRUE_myFlag */
const IframePercurso = lazy('IframePercurso', () => import('./tarkan/components/iframe-percurso'))
const IframePontos = lazy('IframePontos', () => import('./tarkan/components/iframe-pontos'))
const IframeCalor = lazy('IframeCalor', () => import('./tarkan/components/iframe-calor'))
const KoreMap = lazy('KoreMap', () => import('./tarkan/components/kore-map'))

import KT from './tarkan/func/kt'
import actAnchor from './tarkan/func/actAnchor'

import 'leaflet/dist/leaflet.css'

const ContextMenu = lazy('ContextMenu', () => import('./tarkan/components/context-menu'))
const EditUser = lazy('EditUser', () => import('./tarkan/components/views/edit-user'))
const UserNoticeModal = lazy('UserNoticeModal', () => import('./tarkan/components/UserNoticeModal'))

/* IFTRUE_myFlag */
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
/* FITRUE_myFlag */

const EditNotifications = lazy('EditNotifications', () => import('./tarkan/components/views/edit-notifications'))
const EditDevice = lazy('EditDevice', () => import('./tarkan/components/views/edit-device'))
const QrDevice = lazy('QrDevice', () => import('./tarkan/components/views/qr-device'))
const Showtip = lazy('Showtip', () => import('./tarkan/components/showtip'))
const ShowGraphic = lazy('ShowGraphic', () => import('./tarkan/components/views/show-graphic'))
const PushNotificationBtn = lazy('PushNotificationBtn', () => import('./tarkan/components/push-notification-btn'))

/* ===========================
 *  SETUP
 * =========================== */
const store = useStore()

// CSS Variables
const css = getComputedStyle(document.documentElement)
const primaryColor = css.getPropertyValue('--el-color-primary')?.trim() || '#409EFF'

/* ===========================
 *  COMPONENT REFS
 * =========================== */
const contextMenuRef = ref(null)
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

/* ===========================
 *  UI STATE
 * =========================== */
const mobileExpand = ref(false)
const menuShown = ref(false)
const minimized = ref(false)
const sidebarClosed = ref(false)

const mainDynamicStyle = computed(() => {
  const style = {}
  if (store.state?.auth?.attributes?.['isShared']) {
    style.width = '100vw'
  }
  style.paddingInlineEnd = menuShown.value && isPortrait()
    ? 'calc(var(--sar, 0px) + 12px)'
    : 'var(--sar, 0px)'
  return style
})

/* ===========================
 *  SLIDER REFS
 * =========================== */
const blockSlider = ref(null)
const unlockSlider = ref(null)
const anchorSlider = ref(null)
const deleteSlider = ref(null)
const blockThumb = ref(null)
const unlockThumb = ref(null)
const anchorThumb = ref(null)
const deleteThumb = ref(null)

/* ===========================
 *  MODAL STATES
 * =========================== */
const showBlockModal = ref(false)
const showUnlockModal = ref(false)
const showAnchorModal = ref(false)
const showDeleteModal = ref(false)
const currentDevice = ref(null)
const currentCommand = ref(null)
const commandLoading = ref(false)

/* ===========================
 *  SLIDER STATES
 * =========================== */
const SLIDER_PADDING = 2
const DEFAULT_THUMB_WIDTH = 46

const blockProgress = ref(0)
const blockThumbPosition = ref(SLIDER_PADDING)
const blockConfirmed = ref(false)
const blockDragging = ref(false)

const unlockProgress = ref(0)
const unlockThumbPosition = ref(SLIDER_PADDING)
const unlockConfirmed = ref(false)
const unlockDragging = ref(false)

const anchorProgress = ref(0)
const anchorThumbPosition = ref(SLIDER_PADDING)
const anchorConfirmed = ref(false)
const anchorDragging = ref(false)

const deleteProgress = ref(0)
const deleteThumbPosition = ref(SLIDER_PADDING)
const deleteConfirmed = ref(false)
const deleteDragging = ref(false)

/* ===========================
 *  CONNECTION STATUS
 * =========================== */
const isOnline = ref(navigator.onLine)

/* ===========================
 *  HANDLERS
 * =========================== */
const previouslyFocusedEl = ref(null)

/* ===========================
 *  SIDEBAR FUNCTIONS
 * =========================== */
const isPortrait = () => window.matchMedia && window.matchMedia('(orientation: portrait)').matches

const toggleSidebar = () => {
  if (isPortrait()) {
    menuShown.value = !menuShown.value
  } else {
    sidebarClosed.value = !sidebarClosed.value
  }
}

const restoreSidebar = () => {
  if (isPortrait()) {
    menuShown.value = false
  }
}

const autoCloseSidebarOnNav = () => {
  if (isPortrait()) {
    setTimeout(() => {
      menuShown.value = false
    }, 150)
  }
}

/* ===========================
 *  HELPER FUNCTIONS
 * =========================== */
function generateRandomToken() {
  const letters = 'TKZYxLSOPERT123965U'.split('')
  const tmp = []
  let i = 0
  while (i < 20) {
    const rand = Math.round(Math.random() * (letters.length - 1))
    tmp.push(letters[rand])
    i++
  }
  return tmp.join('')
}

const viewportCleanupFns = []

const applyViewportVars = () => {
  const root = document.documentElement
  const vv = window.visualViewport
  const height = vv?.height ?? window.innerHeight
  const width = vv?.width ?? window.innerWidth

  root.style.setProperty('--vh', `${height}px`)
  root.style.setProperty('--vw', `${width}px`)

  const safeTop = getComputedStyle(root).getPropertyValue('--sat') || '0px'
  const safeBottom = getComputedStyle(root).getPropertyValue('--sab') || '0px'
  root.style.setProperty('--safe-area-top', `env(safe-area-inset-top, ${safeTop})`)
  root.style.setProperty('--safe-area-bottom', `env(safe-area-inset-bottom, ${safeBottom})`)
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
    try { fn?.() } catch { /* noop */ }
  }
}

const getVehicleImage = (device) => {
  if (!device) return '/tarkan/assets/images/categories/default.png'
  const timestamp = Date.now()
  const cacheBuster = device?.attributes?.imageTimestamp || timestamp
  const imageVersion = device?.attributes?.imageVersion || 0
  return `/tarkan/assets/images/${device?.id}.png?ts=${cacheBuster}&v=${imageVersion}&_=${timestamp}`
}

const onVehicleImgError = (e) => {
  const cat = currentDevice.value?.category || 'default'
  e.target.onerror = null
  e.target.src = `/tarkan/assets/images/categories/${cat}.png`
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
  if (modalOpen.value ||
      blockDragging.value || unlockDragging.value ||
      anchorDragging.value || deleteDragging.value) {
    e?.stopPropagation?.()
    e?.preventDefault?.()
    return
  }
}

/* ===========================
 *  CONNECTION STATUS
 * =========================== */
const updateConnectionStatus = () => {
  isOnline.value = navigator.onLine
}

const emitMapInvalidate = (detail = {}) => {
  requestAnimationFrame(() => {
    window.dispatchEvent(new CustomEvent('map:invalidate', { detail }))
  })
}

/* ===========================
 *  SLIDE-TO-CONFIRM HELPER (Composable)
 *  Pointer Events + Haptics + RTL/LTR
 *  100% robusto para PWA + Android WebView + iOS Safari
 * =========================== */

/**
 * createSlideToConfirm - Factory para criar instância de slide-to-confirm
 * Usa Pointer Events unificados (mouse/touch/pen), com haptics e suporte RTL/LTR
 * 
 * @param {Object} options
 * @param {Ref} options.sliderRef - Ref do elemento slider
 * @param {Ref} options.thumbRef - Ref do elemento thumb
 * @param {Ref} options.progressRef - Ref para progress (0-100)
 * @param {Ref} options.thumbPosRef - Ref para posição do thumb (px)
 * @param {Ref} options.confirmedRef - Ref booleano de confirmação
 * @param {Ref} options.draggingRef - Ref booleano de dragging
 * @param {Ref} [options.disabledRef] - Ref booleano que bloqueia interação
 * @param {Function} options.onConfirm - Callback ao confirmar
 * @param {Function} [options.onReset] - Callback opcional ao resetar
 * @param {number} [options.padding=2] - Padding interno do slider
 * @param {number} [options.defaultThumbWidth=46] - Largura padrão do thumb
 * @param {number} [options.thresholdPx=5] - Pixels antes do final para confirmar
 * @param {number} [options.confirmDelayMs=250] - Delay antes de chamar onConfirm
 * @param {'ltr'|'rtl'} [options.direction='ltr'] - Direção estática do slider
 * @param {Ref<'ltr'|'rtl'>} [options.directionRef] - Direção dinâmica (sobrescreve direction)
 * @param {boolean} [options.haptics=true] - Habilitar vibração ao confirmar
 */
const createSlideToConfirm = (options) => {
  const {
    sliderRef,
    thumbRef,
    progressRef,
    thumbPosRef,
    confirmedRef,
    draggingRef,
    disabledRef = ref(false),
    onConfirm,
    onReset,
    padding = 2,
    defaultThumbWidth = 46,
    thresholdPx = 5,
    confirmDelayMs = 250,
    direction = 'ltr',
    directionRef = null,
    haptics = true
  } = options

  // Estado interno para controle do drag
  const state = {
    rafId: null,
    pointerId: null,
    captureEl: null,
    geometry: null,
    hasVibrated: false,
    prevUserSelect: null
  }

  // ===========================
  //  FUNÇÕES UTILITÁRIAS
  // ===========================

  /** Obtém direção atual (dinâmica ou estática) */
  const getDirection = () => directionRef?.value ?? direction

  /** Calcula geometria do slider */
  const getGeometry = () => {
    const sliderEl = sliderRef?.value
    const thumbEl = thumbRef?.value
    const sliderRect = sliderEl?.getBoundingClientRect?.()
    if (!sliderRect) return null

    const thumbWidth = thumbEl?.offsetWidth ?? defaultThumbWidth
    const maxLeftRaw = sliderRect.width - thumbWidth - padding
    const maxLeft = Math.max(padding, maxLeftRaw)

    return { rect: sliderRect, thumbWidth, maxLeft, padding }
  }

  /** Calcula posição inicial baseado na direção */
  const getInitialPosition = (geometry, dir = null) => {
    const d = dir ?? getDirection()
    // LTR: começa à esquerda (padding), RTL: começa à direita (maxLeft)
    return d === 'rtl' ? geometry.maxLeft : geometry.padding
  }

  /** Calcula progresso baseado na direção */
  const calculateProgress = (left, geometry, dir = null) => {
    const d = dir ?? getDirection()
    const range = geometry.maxLeft - geometry.padding
    if (range <= 0) return 0

    if (d === 'rtl') {
      // RTL: progresso cresce de direita (0%) para esquerda (100%)
      return ((geometry.maxLeft - left) / range) * 100
    }
    // LTR: progresso cresce de esquerda (0%) para direita (100%)
    return ((left - geometry.padding) / range) * 100
  }

  /** Verifica se atingiu threshold de confirmação */
  const isAtConfirmThreshold = (left, geometry, dir = null) => {
    const d = dir ?? getDirection()
    if (d === 'rtl') {
      // RTL: confirma quando chega à esquerda (left <= padding + threshold)
      return left <= geometry.padding + thresholdPx
    }
    // LTR: confirma quando chega à direita (left >= maxLeft - threshold)
    return left >= geometry.maxLeft - thresholdPx
  }

  /** Aplica posição ao thumb e atualiza progresso */
  const applyPosition = (left, geometry) => {
    thumbPosRef.value = left
    progressRef.value = calculateProgress(left, geometry)
  }

  /** Dispara vibração haptic (uma única vez por confirmação) */
  const triggerHaptics = () => {
    if (!haptics || state.hasVibrated) return
    state.hasVibrated = true
    try {
      if (navigator.vibrate) {
        navigator.vibrate(20)
      }
    } catch {
      // Silently fail - vibration may not be available
    }
  }

  // ===========================
  //  POINTER EVENT HANDLERS
  // ===========================

  /** Handler para pointermove */
  const onPointerMove = (e) => {
    // Só previne default se estiver arrastando
    if (!draggingRef.value || !state.geometry) return
    e.preventDefault()

    const clientX = e.clientX
    if (clientX == null || !Number.isFinite(clientX)) return

    // Cancela RAF anterior
    if (state.rafId) {
      cancelAnimationFrame(state.rafId)
      state.rafId = null
    }

    state.rafId = requestAnimationFrame(() => {
      if (!draggingRef.value || !state.geometry) return

      const geometry = state.geometry
      // Clamp do left entre padding e maxLeft
      const rawLeft = clientX - geometry.rect.left - geometry.thumbWidth / 2
      const newLeft = Math.max(geometry.padding, Math.min(rawLeft, geometry.maxLeft))

      applyPosition(newLeft, geometry)

      // Verifica se atingiu o threshold de confirmação
      if (isAtConfirmThreshold(newLeft, geometry)) {
        confirmedRef.value = true
        draggingRef.value = false
        triggerHaptics()
        cleanup()
        
        if (confirmDelayMs > 0) {
          setTimeout(() => onConfirm(), confirmDelayMs)
        } else {
          onConfirm()
        }
      }
    })
  }

  /** Handler para pointerup e pointercancel */
  const onPointerEnd = () => {
    if (!draggingRef.value) return

    // Se não confirmou, reseta posição
    if (!confirmedRef.value) {
      const geometry = getGeometry()
      if (geometry) {
        thumbPosRef.value = getInitialPosition(geometry)
        progressRef.value = 0
      }
    }

    draggingRef.value = false
    cleanup()
  }

  // ===========================
  //  CLEANUP (único e definitivo)
  // ===========================

  /** Cleanup completo - remove todos listeners, cancela RAF, restaura userSelect */
  const cleanup = () => {
    // 1. Cancela RAF pendente
    if (state.rafId) {
      cancelAnimationFrame(state.rafId)
      state.rafId = null
    }

    // 2. Remove listeners do captureEl (thumb ou slider)
    if (state.captureEl) {
      state.captureEl.removeEventListener('pointermove', onPointerMove)
      state.captureEl.removeEventListener('pointerup', onPointerEnd)
      state.captureEl.removeEventListener('pointercancel', onPointerEnd)
      state.captureEl.removeEventListener('lostpointercapture', onPointerEnd)
    }

    // 3. Remove fallback listeners do window
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerEnd)
    window.removeEventListener('pointercancel', onPointerEnd)

    // 4. Libera pointer capture (try/catch para evitar erros)
    if (state.pointerId != null && state.captureEl) {
      try {
        state.captureEl.releasePointerCapture(state.pointerId)
      } catch {
        // Pode falhar se o capture já foi liberado
      }
    }

    // 5. Restaura userSelect se estava em drag
    if (state.prevUserSelect !== null) {
      document.body.style.userSelect = state.prevUserSelect
      state.prevUserSelect = null
    }

    // 6. Zera estado
    state.pointerId = null
    state.captureEl = null
    state.geometry = null
  }

  // ===========================
  //  RESET
  // ===========================

  /** Reset do slider para posição inicial */
  const reset = () => {
    const geometry = getGeometry()
    const initialPos = geometry ? getInitialPosition(geometry) : padding
    thumbPosRef.value = initialPos
    progressRef.value = 0
    confirmedRef.value = false
    draggingRef.value = false
    state.hasVibrated = false
    cleanup()
    onReset?.()
  }

  // ===========================
  //  START DRAG
  // ===========================

  /** Inicia o drag (pointerdown) */
  const startDrag = (event) => {
    // Guards
    if (confirmedRef.value) return
    if (disabledRef.value) return

    // Cleanup anterior (garante estado limpo)
    cleanup()

    // Configura estado
    draggingRef.value = true
    state.hasVibrated = false
    state.geometry = getGeometry()

    if (!state.geometry) {
      draggingRef.value = false
      return
    }

    // Bloqueia seleção de texto durante drag
    state.prevUserSelect = document.body.style.userSelect || ''
    document.body.style.userSelect = 'none'

    // Previne comportamento padrão (seleção de texto, etc)
    event.preventDefault()

    // Tenta capturar no thumb primeiro, fallback para slider
    const thumbEl = thumbRef?.value
    const sliderEl = sliderRef?.value
    let captureEl = null
    let captureSuccess = false

    if (thumbEl && event.pointerId != null) {
      try {
        thumbEl.setPointerCapture(event.pointerId)
        captureEl = thumbEl
        captureSuccess = true
      } catch {
        // Thumb capture falhou, tenta slider
      }
    }

    if (!captureSuccess && sliderEl && event.pointerId != null) {
      try {
        sliderEl.setPointerCapture(event.pointerId)
        captureEl = sliderEl
        captureSuccess = true
      } catch {
        // Slider capture também falhou
      }
    }

    // Armazena referências
    state.pointerId = event.pointerId
    state.captureEl = captureEl

    // Registra listeners no captureEl (se existir)
    if (captureEl) {
      captureEl.addEventListener('pointermove', onPointerMove)
      captureEl.addEventListener('pointerup', onPointerEnd)
      captureEl.addEventListener('pointercancel', onPointerEnd)
      captureEl.addEventListener('lostpointercapture', onPointerEnd)
    }

    // Fallback: adiciona listeners no window (caso capture não funcione)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerEnd)
    window.addEventListener('pointercancel', onPointerEnd)
  }

  // ===========================
  //  KEYBOARD NAVIGATION
  // ===========================

  /** Navegação por teclado (ArrowRight/ArrowLeft/Home/End/Enter/Space) */
  const handleKeydown = (e) => {
    const validKeys = ['ArrowRight', 'ArrowLeft', 'Home', 'End', 'Enter', ' ']
    if (!validKeys.includes(e.key)) return
    if (confirmedRef.value || disabledRef.value) return

    e.preventDefault()
    const geometry = getGeometry()
    if (!geometry) return

    const dir = getDirection()
    const step = (geometry.maxLeft - geometry.padding) / 10
    let newLeft = thumbPosRef.value

    if (e.key === 'Home') {
      // Home: vai para 0% (posição inicial)
      newLeft = getInitialPosition(geometry)
    } else if (e.key === 'End') {
      // End: vai para 100% (posição de confirmação)
      newLeft = dir === 'rtl' ? geometry.padding : geometry.maxLeft
    } else if (e.key === 'Enter' || e.key === ' ') {
      // Enter/Space: confirma se já está em ~100%
      const currentProgress = progressRef.value
      if (currentProgress >= 95) {
        confirmedRef.value = true
        triggerHaptics()
        if (confirmDelayMs > 0) {
          setTimeout(() => onConfirm(), confirmDelayMs)
        } else {
          onConfirm()
        }
      }
      return
    } else {
      // ArrowRight/ArrowLeft com respeito à direção
      // LTR: Right aumenta progresso, Left diminui
      // RTL: Right diminui progresso, Left aumenta
      const keyDir = e.key === 'ArrowRight' ? 1 : -1
      const effectiveDir = dir === 'rtl' ? -keyDir : keyDir
      newLeft = Math.max(
        geometry.padding,
        Math.min(thumbPosRef.value + step * effectiveDir, geometry.maxLeft)
      )
    }

    applyPosition(newLeft, geometry)

    // Verifica confirmação
    if (isAtConfirmThreshold(newLeft, geometry)) {
      confirmedRef.value = true
      triggerHaptics()
      if (confirmDelayMs > 0) {
        setTimeout(() => onConfirm(), confirmDelayMs)
      } else {
        onConfirm()
      }
    }
  }

  // ===========================
  //  ARIA HELPERS
  // ===========================

  /** Retorna props ARIA para o slider */
  const getAriaProps = () => ({
    role: 'slider',
    tabindex: disabledRef.value ? -1 : 0,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': Math.round(progressRef.value),
    'aria-disabled': disabledRef.value || confirmedRef.value,
    'aria-busy': draggingRef.value
  })

  return {
    startDrag,
    handleKeydown,
    reset,
    cleanup,
    getDirection,
    getAriaProps
  }
}

/* ===========================
 *  SLIDE-TO-CONFIRM INSTANCES
 * =========================== */

// Block Slider
const blockSlideConfirm = createSlideToConfirm({
  sliderRef: blockSlider,
  thumbRef: blockThumb,
  progressRef: blockProgress,
  thumbPosRef: blockThumbPosition,
  confirmedRef: blockConfirmed,
  draggingRef: blockDragging,
  disabledRef: commandLoading,
  onConfirm: () => handleBlockConfirmed(),
  padding: SLIDER_PADDING,
  defaultThumbWidth: DEFAULT_THUMB_WIDTH
})

// Unlock Slider
const unlockSlideConfirm = createSlideToConfirm({
  sliderRef: unlockSlider,
  thumbRef: unlockThumb,
  progressRef: unlockProgress,
  thumbPosRef: unlockThumbPosition,
  confirmedRef: unlockConfirmed,
  draggingRef: unlockDragging,
  disabledRef: commandLoading,
  onConfirm: () => handleUnlockConfirmed(),
  padding: SLIDER_PADDING,
  defaultThumbWidth: DEFAULT_THUMB_WIDTH
})

// Anchor Slider - direção dinâmica baseada no comando
const anchorDirectionRef = ref('ltr')
const anchorSlideConfirm = createSlideToConfirm({
  sliderRef: anchorSlider,
  thumbRef: anchorThumb,
  progressRef: anchorProgress,
  thumbPosRef: anchorThumbPosition,
  confirmedRef: anchorConfirmed,
  draggingRef: anchorDragging,
  disabledRef: commandLoading,
  onConfirm: () => handleAnchorConfirmed(),
  padding: SLIDER_PADDING,
  defaultThumbWidth: DEFAULT_THUMB_WIDTH,
  directionRef: anchorDirectionRef
})

// Delete Slider (confirmDelayMs = 0 para execução imediata)
const deleteSlideConfirm = createSlideToConfirm({
  sliderRef: deleteSlider,
  thumbRef: deleteThumb,
  progressRef: deleteProgress,
  thumbPosRef: deleteThumbPosition,
  confirmedRef: deleteConfirmed,
  draggingRef: deleteDragging,
  disabledRef: commandLoading,
  onConfirm: () => executeDelete(),
  padding: SLIDER_PADDING,
  defaultThumbWidth: DEFAULT_THUMB_WIDTH,
  confirmDelayMs: 0
})

/* ===========================
 *  WRAPPER FUNCTIONS (para template)
 * =========================== */
const startDrag = (type, event) => {
  const instances = {
    block: blockSlideConfirm,
    unlock: unlockSlideConfirm,
    anchor: anchorSlideConfirm,
    delete: deleteSlideConfirm
  }
  instances[type]?.startDrag(event)
}

const onSliderKeydown = (type, e) => {
  const instances = {
    block: blockSlideConfirm,
    unlock: unlockSlideConfirm,
    anchor: anchorSlideConfirm,
    delete: deleteSlideConfirm
  }
  instances[type]?.handleKeydown(e)
}

// Cleanup global de todos os sliders
const cleanupAllSliders = () => {
  blockSlideConfirm.cleanup()
  unlockSlideConfirm.cleanup()
  anchorSlideConfirm.cleanup()
  deleteSlideConfirm.cleanup()
}

/* ===========================
 *  MODAL ACTIONS
 * =========================== */
const handleBlockConfirmed = async () => {
  commandLoading.value = true
  try {
    const deviceId = currentDevice.value.id
    const command = currentCommand.value
    await window.$traccar.sendCommand({ ...command, deviceId })
    const { ElNotification } = await import('element-plus')
    ElNotification({ title: 'Sucesso', message: 'Comando de bloqueio enviado', type: 'success' })
    showBlockModal.value = false
  } catch (_e) {
    const { ElMessage } = await import('element-plus')
    ElMessage.error('Erro ao enviar comando')
  } finally {
    commandLoading.value = false
  }
}

const handleUnlockConfirmed = async () => {
  commandLoading.value = true
  try {
    const deviceId = currentDevice.value.id
    const command = currentCommand.value
    await window.$traccar.sendCommand({ ...command, deviceId })
    const { ElNotification } = await import('element-plus')
    ElNotification({ title: 'Sucesso', message: 'Comando de desbloqueio enviado', type: 'success' })
    showUnlockModal.value = false
  } catch (_e) {
    const { ElMessage } = await import('element-plus')
    ElMessage.error('Erro ao enviar comando')
  } finally {
    commandLoading.value = false
  }
}

const handleAnchorConfirmed = async () => {
  const isEnabling = currentCommand.value?.type === 'anchor_enable'
  commandLoading.value = true
  try {
    const deviceId = currentDevice.value.id
    await actAnchor(deviceId, isEnabling)
    const { ElNotification } = await import('element-plus')
    ElNotification({ title: 'Sucesso', message: isEnabling ? 'Ancoragem ativada' : 'Ancoragem desativada', type: 'success' })
    showAnchorModal.value = false
  } catch (_e) {
    const { ElMessage } = await import('element-plus')
    ElMessage.error('Erro ao executar âncora')
  } finally {
    commandLoading.value = false
  }
}

const executeDelete = async () => {
  try {
    commandLoading.value = true
    await store.dispatch('devices/delete', currentDevice.value.id)
    const { ElNotification } = await import('element-plus')
    ElNotification({ title: 'Info', message: 'Dispositivo excluído com sucesso', type: 'success' })
    showDeleteModal.value = false
    router.push('/devices')
  } catch (_e) {
    const { ElMessage } = await import('element-plus')
    ElMessage.error('Erro ao excluir dispositivo')
  } finally {
    commandLoading.value = false
  }
}

/* ===========================
 *  CANCEL FUNCTIONS
 * =========================== */
const cancelBlock = () => {
  blockSlideConfirm.reset()
  showBlockModal.value = false
  currentDevice.value = null
  currentCommand.value = null
}

const cancelUnlock = () => {
  unlockSlideConfirm.reset()
  showUnlockModal.value = false
  currentDevice.value = null
  currentCommand.value = null
}

const cancelAnchor = () => {
  anchorSlideConfirm.reset()
  showAnchorModal.value = false
  currentDevice.value = null
  currentCommand.value = null
}

const cancelDelete = () => {
  deleteSlideConfirm.reset()
  showDeleteModal.value = false
  currentDevice.value = null
  currentCommand.value = null
}

/* ===========================
 *  EVENT LISTENERS
 * =========================== */
const onOpenBlockModal = (event) => {
  const detail = event?.detail || {}
  currentDevice.value = detail.device || null
  currentCommand.value = detail.command || null
  blockSlideConfirm.reset()
  showBlockModal.value = true
  nextTick(() => blockSlider.value?.focus())
}

const onOpenUnlockModal = (event) => {
  const detail = event?.detail || {}
  currentDevice.value = detail.device || null
  currentCommand.value = detail.command || null
  unlockSlideConfirm.reset()
  showUnlockModal.value = true
  nextTick(() => unlockSlider.value?.focus())
}

const onOpenAnchorModal = (event) => {
  const detail = event?.detail || {}
  currentDevice.value = detail.device || null
  currentCommand.value = detail.command || null
  // Define direção: RTL para desativar âncora, LTR para ativar
  anchorDirectionRef.value = detail.command?.type === 'anchor_disable' ? 'rtl' : 'ltr'
  anchorSlideConfirm.reset()
  showAnchorModal.value = true
  nextTick(() => anchorSlider.value?.focus())
}

const onOpenDeleteModal = (event) => {
  const detail = event?.detail || {}
  currentDevice.value = detail.device || null
  currentCommand.value = detail.command || null
  deleteSlideConfirm.reset()
  showDeleteModal.value = true
  nextTick(() => deleteSlider.value?.focus())
}

/* ===========================
 *  USER MENU
 * =========================== */
const userMenu = (e) => {
  const tmp = []

  if (!store.state.auth.attributes['isShared']) {
    tmp.push({ text: KT('usermenu.account'), cb: () => editUserRef.value.editUser() })

    if (store.state.auth.administrator && store.state.server.isPlus) {
      tmp.push({ text: KT('usermenu.logs'), cb: () => logObjectsRef.value.showLogs('all') })
      tmp.push({ text: KT('usermenu.theme'), cb: () => editThemeRef.value.showTheme() })
    }

    /* IFTRUE_myFlag */
    if (store.getters.advancedPermissions(16)) {
      tmp.push({ text: KT('usermenu.users'), cb: () => editUsersRef.value.showUsers() })
    }
    /* FITRUE_myFlag */

    /* IFTRUE_myFlag */
    if (store.getters.advancedPermissions(64)) {
      tmp.push({ text: KT('usermenu.computedAttributes'), cb: () => router.push('/computed') })
    }
    /* FITRUE_myFlag */

    /* IFTRUE_myFlag */
    if (store.getters.isAdmin) {
      tmp.push({ text: KT('usermenu.server'), cb: () => editServerRef.value.showServer() })
    }
    /* FITRUE_myFlag */

    if (store.getters.advancedPermissions(32)) {
      tmp.push({ text: KT('usermenu.notifications'), cb: () => editNotificationsRef.value.showNotifications() })
    }

    /* IFTRUE_myFlag */
    if (store.getters.advancedPermissions(80)) {
      tmp.push({ text: KT('usermenu.drivers'), cb: () => editDriversRef.value.showDrivers() })
    }
    /* FITRUE_myFlag */

    /* IFTRUE_myFlag */
    if (store.getters.advancedPermissions(88)) {
      tmp.push({ text: KT('usermenu.calendars'), cb: () => editCalendarsRef.value.showCalendars() })
    }
    /* FITRUE_myFlag */

    /* IFTRUE_myFlag */
    if (store.getters.advancedPermissions(96)) {
      tmp.push({ text: KT('usermenu.maintenance'), cb: () => editMaintenancesRef.value.showMaintenances() })
    }
    /* FITRUE_myFlag */
  }

  tmp.push({
    text: KT('usermenu.logout'),
    cb: () => {
      store.dispatch('logout').then(() => router.push('/login'))
    }
  })

  contextMenuRef.value.openMenu({ evt: e, menus: tmp })
}

/* ===========================
 *  ACCESSIBILITY
 * =========================== */
const modalOpen = computed(() =>
  showBlockModal.value || showUnlockModal.value ||
  showAnchorModal.value || showDeleteModal.value
)

const lockBodyScroll = () => {
  const y = window.scrollY || document.documentElement.scrollTop
  document.body.dataset.scrollY = String(y)
  document.body.style.position = 'fixed'
  document.body.style.top = `-${y}px`
  document.body.style.left = '0'
  document.body.style.right = '0'
  document.body.style.width = '100%'
}

const unlockBodyScroll = () => {
  const y = parseInt(document.body.dataset.scrollY || '0', 10)
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  document.body.style.width = ''
  delete document.body.dataset.scrollY
  window.scrollTo(0, y)
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    unlockBodyScroll()
  }
}

const trapTabKeydown = (e) => {
  if (!modalOpen.value || e.key !== 'Tab') return
  const dialog = document.querySelector('[role="dialog"][aria-modal="true"]')
  if (!dialog) return

  const focusables = dialog.querySelectorAll(
    'button, [href], input, select, textarea, [role="slider"], [tabindex]:not([tabindex="-1"])'
  )
  if (!focusables.length) return

  const first = focusables[0]
  const last = focusables[focusables.length - 1]

  if (!dialog.contains(document.activeElement)) {
    e.preventDefault()
    first.focus()
    return
  }

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(modalOpen, (open) => {
  if (open) {
    previouslyFocusedEl.value = document.activeElement
    lockBodyScroll()
    document.addEventListener('keydown', trapTabKeydown, true)
  } else {
    document.removeEventListener('keydown', trapTabKeydown, true)
    unlockBodyScroll()
    const el = previouslyFocusedEl.value
    previouslyFocusedEl.value = null
    if (el && typeof el.focus === 'function') {
      try { el.focus() } catch (error) { /* nada */ }
    }
  }
})

watch(menuShown, (open) => {
  emitMapInvalidate({ source: 'menu-toggle', open })
})

/* ===========================
 *  ROUTER HOOKS
 * =========================== */
router.afterEach(() => {
  minimized.value = false
  if (isPortrait()) {
    menuShown.value = false
  }
})

router.beforeEach((_to, _from, next) => {
  unlockBodyScroll()
  next()
})

/* ===========================
 *  LIFECYCLE
 * =========================== */
onMounted(() => {
  applyViewportVars()
  registerViewportListeners()
  document.addEventListener('visibilitychange', handleVisibilityChange, true)
  emitMapInvalidate({ source: 'mount' })

  if (!isPortrait()) {
    sidebarClosed.value = false
  }

  window.localStorage.setItem('query', '')
  if (!window.localStorage.getItem('TKSESSIONTOKEN')) {
    const token = generateRandomToken()
    window.localStorage.setItem('TKSESSIONTOKEN', token)
  }

  // Event listeners para modais
  window.addEventListener('openBlockModal', onOpenBlockModal)
  window.addEventListener('openUnlockModal', onOpenUnlockModal)
  window.addEventListener('openAnchorModal', onOpenAnchorModal)
  window.addEventListener('openDeleteModal', onOpenDeleteModal)

  // Connection status
  window.addEventListener('online', updateConnectionStatus)
  window.addEventListener('offline', updateConnectionStatus)
  updateConnectionStatus()
})

onBeforeUnmount(() => {
  cleanupAllSliders()
  cleanupViewportListeners()
  document.removeEventListener('visibilitychange', handleVisibilityChange, true)
  window.removeEventListener('openBlockModal', onOpenBlockModal)
  window.removeEventListener('openUnlockModal', onOpenUnlockModal)
  window.removeEventListener('openAnchorModal', onOpenAnchorModal)
  window.removeEventListener('openDeleteModal', onOpenDeleteModal)
  document.removeEventListener('keydown', trapTabKeydown, true)

  window.removeEventListener('online', updateConnectionStatus)
  window.removeEventListener('offline', updateConnectionStatus)
  unlockBodyScroll()
})

/* ===========================
 *  PROVIDES
 * =========================== */
const showRouteMarker = ref(false)
const setShowMarker = (b) => { showRouteMarker.value = b }

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
</script>

<style>
/* ===========================
 *  CSS VARIABLES
 * =========================== */
:root {
  --sb-width: 78px;
  --header-height: 2rem;
  /* Safe area fallbacks */
  --sat: env(safe-area-inset-top, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
  --sar: env(safe-area-inset-right, 0px);
}

/* ===========================
 *  BASE STYLES
 * =========================== */
.showOnMobile {
  display: none;
}

.editing .leaflet-container {
  cursor: crosshair !important;
}

body.el-popup-parent--hidden {
  padding-right: 0 !important;
}

html, body {
  height: 100%;
  min-height: var(--vh, 100vh);
  margin: 0;
  padding: 0;
}

body {
  overflow: hidden;
  position: relative;
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 100vw;
}

* {
  margin: 0;
  padding: 0;
}

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

/* ===========================
 *  HEADER
 * =========================== */
#head {
  padding-top: var(--sat);
  height: calc(var(--header-height) + var(--sat));
  min-height: calc(var(--header-height) + var(--sat));
  overflow: hidden;
  border-bottom: var(--el-text-color-primary) 1px solid;
  background: var(--el-bg-color);
  display: flex;
  align-content: space-between;
  justify-content: space-between;
  position: sticky;
  top: 0;
  isolation: isolate;
  pointer-events: auto;
  z-index: 1010;
  box-sizing: border-box;
}

#head #user {
  display: flex;
}

#logo {
  padding: 0.5rem;
}

#content {
  display: flex;
  height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
  max-height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
  width: 100%;
  max-width: 100vw;
  overflow: hidden;
  position: relative;
}

/* ===========================
 *  SIDEBAR / MENU MODERNO
 * =========================== */
#menu {
  width: var(--sb-width);
  height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
  max-height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
  background: linear-gradient(180deg, var(--el-color-primary) 0%, #0a62c2 100%);
  position: relative;
  transition: width 0.3s ease, opacity 0.3s ease;
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.08);
  z-index: 1005;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

#menu.sidebar-closed {
  width: 0 !important;
  overflow: hidden;
}

#menu.sidebar-closed #version {
  display: none;
}

/* Oculta indicador antigo */
#menu .indicator {
  display: none !important;
}

/* ===========================
 *  MENU LIST (NOVO LAYOUT)
 * =========================== */
#menu ul {
  list-style: none;
  margin-top: 0.8rem;
  padding: 0;
}

#menu ul li {
  position: relative;
  width: var(--sb-width);
  height: auto;
  padding: 8px 0 10px;
  z-index: 5;
}

#menu ul li a {
  color: #fff;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  height: auto;
  text-decoration: none !important;
}

/* Ícone em pílula (44x44) */
#menu ul li a .el-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff !important;
  font-size: 1.2rem;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  will-change: transform, box-shadow;
}

/* Texto abaixo do ícone */
#menu ul li a .text {
  position: static;
  display: block;
  width: 100%;
  transform: none !important;
  opacity: 1;
  color: #fff;
  font-weight: 700;
  font-size: 10px;
  line-height: 1.15;
  letter-spacing: 0.25px;
  text-align: center;
  text-transform: uppercase;
  padding: 0 4px 2px;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Hover/Active feedback */
#menu ul li:hover a .el-icon {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.22);
}

#menu ul li.active a .el-icon {
  transform: translateY(-1px) scale(1.03);
  box-shadow: 0 12px 22px rgba(0, 0, 0, 0.28);
}

/* Paletas por item (gradientes) */
#menu ul li:nth-child(1) a .el-icon { background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%); } /* Dispositivos */
#menu ul li:nth-child(2) a .el-icon { background: linear-gradient(180deg, #a855f7 0%, #7c3aed 100%); } /* Relatórios */
#menu ul li:nth-child(3) a .el-icon { background: linear-gradient(180deg, #fb923c 0%, #f97316 100%); } /* Geocerca */
#menu ul li:nth-child(4) a .el-icon { background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%); } /* Comandos */
#menu ul li:nth-child(5) a .el-icon { background: linear-gradient(180deg, #f472b6 0%, #db2777 100%); } /* Grupos */
#menu ul li:nth-child(6) a .el-icon { background: linear-gradient(180deg, #34d399 0%, #10b981 100%); } /* Notificações */

/* ===========================
 *  VERSION BADGE
 * =========================== */
#version {
  position: absolute;
  bottom: 0.6rem;
  left: 0.2rem;
  width: calc(var(--sb-width) - 0.4rem);
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 0.3rem 0.4rem;
  font-size: 0.55rem;
  border-radius: 10px;
  box-sizing: border-box;
  text-align: center;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

#version:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* ===========================
 *  PANEL #OPEN
 * =========================== */
#open {
  height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  display: flex;
  align-content: center;
  justify-content: space-between;
  transition: 0.2s;
  opacity: 0;
  width: 0;
  overflow: hidden;
}

#open.allowExpand .expandBtn {
  position: absolute;
  left: 555px;
  top: 50%;
  z-index: 9999999999;
  border: #fff 1px solid;
  background: var(--el-color-primary);
  padding: 25px 5px;
  color: #fff;
  transform: translate(0, -50%);
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  transition: all 0.2s;
}

#open.allowExpand .expandBtn:hover {
  filter: brightness(1.1);
  padding: 25px 8px;
}

#open.shown {
  opacity: 1;
  width: 700px;
}

#open.allowExpand.expanded {
  width: 1400px !important;
}

#open.allowExpand.expanded .expandBtn {
  left: 805px;
}

#open.allowExpand.expanded .expandBtn i {
  transform: rotate(180deg);
}

#open.shown.editing {
  width: 130px !important;
}

#open.shown.editing div {
  display: flex;
  flex-direction: column-reverse;
  align-content: space-between;
  justify-content: space-between;
}

#open #rv {
  overflow-y: auto;
  height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)) - 130px);
  padding: 7px;
}

#open.minimized {
  height: 35px !important;
}

/* ===========================
 *  SCROLLBAR
 * =========================== */
::-webkit-scrollbar {
  width: 8px;
  height: 4px;
  background: #f5f5f5;
}

::-webkit-scrollbar-thumb {
  width: 8px;
  height: 5px;
  background: #ccc;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--el-color-info);
}

* {
  scrollbar-width: thin;
  scrollbar-color: #ccc #f5f5f5;
}

/* ===========================
 *  MAIN (MAPA)
 * =========================== */
#main {
  width: calc(var(--vw, 100vw) - var(--sb-width));
  height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
  transition: width 0.3s ease;
  position: relative;
}

#main.sidebar-closed {
  width: var(--vw, 100vw) !important;
}

#main.minimized {
  height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)) - 15px) !important;
}

/* ===========================
 *  HEADING DO PAINEL
 * =========================== */
#heading {
  text-align: center;
  font-weight: bold;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, #0a62c2 100%);
  border-radius: 16px;
  padding: 12px 40px;
  color: var(--el-color-white);
  position: relative;
  z-index: 0;
  margin: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

#heading span:first-child,
#heading span:last-child {
  position: absolute;
  top: 0;
  padding: 8px;
  font-size: 22px;
  cursor: pointer;
  transition: transform 0.2s;
}

#heading span:first-child { left: 8px; }
#heading span:last-child { right: 8px; }

#heading span:hover {
  transform: scale(1.1);
}

/* ===========================
 *  RTL SUPPORT
 * =========================== */
body.rtl #app div #content {
  flex-direction: row-reverse !important;
}

/* ===========================
 *  NOTIFICATIONS
 * =========================== */
.notification-soft-red {
  --el-color-white: #ffdddd !important;
  --el-notification-icon-color: #181818 !important;
  --el-notification-content-color: #181818 !important;
}
.notification-soft-red .el-icon { color: #181818 !important; }

.notification-red {
  --el-color-white: #f44336 !important;
  --el-notification-icon-color: white !important;
  --el-notification-title-color: white !important;
}
.notification-red .el-icon { color: white !important; }

.notification-soft-yellow {
  --el-color-white: #ffffcc !important;
  --el-notification-icon-color: #181818 !important;
  --el-notification-title-color: #181818 !important;
}
.notification-soft-yellow .el-icon { color: #181818 !important; }

.notification-yellow {
  --el-color-white: #ffeb3b !important;
  --el-notification-icon-color: #181818 !important;
  --el-notification-title-color: #181818 !important;
}
.notification-yellow .el-icon { color: #181818 !important; }

.notification-soft-green {
  --el-color-white: #ddffdd !important;
  --el-notification-icon-color: #181818 !important;
  --el-notification-title-color: #181818 !important;
}
.notification-soft-green .el-icon { color: #181818 !important; }

.notification-green {
  --el-color-white: #4CAF50 !important;
  --el-notification-icon-color: white !important;
  --el-notification-title-color: white !important;
}
.notification-green .el-icon { color: white !important; }

.notification-soft-info {
  --el-color-white: #ddffff !important;
  --el-notification-icon-color: #181818 !important;
  --el-notification-title-color: #181818 !important;
}
.notification-soft-info .el-icon { color: #181818 !important; }

.notification-info {
  --el-color-white: #2196F3 !important;
  --el-notification-icon-color: white !important;
  --el-notification-title-color: white !important;
}
.notification-info .el-icon { color: white !important; }

.el-notification__content {
  background: white !important;
  color: black !important;
  padding: 5px;
  border-radius: 5px;
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
  margin-bottom: 4px;
  border-radius: 8px;
  color: white;
  box-shadow: 0 2px 8px rgba(45, 45, 45, 0.15);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.customFilter:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(45, 45, 45, 0.2);
}

.all { background: var(--el-color-info); }
.online { background: var(--el-color-success); }
.offline { background: var(--el-color-danger); }
.unknown { background: var(--el-color-warning); }
.motion { background: var(--el-color-primary); }

.customFilter.active {
  border: white 2px solid;
  box-shadow: 0 4px 16px rgba(45, 45, 45, 0.25);
}

/* ===========================
 *  BUTTONS / EXPANDER
 * =========================== */
#btnmenu {
  display: none;
  padding: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
}

#expander {
  display: none;
  text-align: center;
  padding: 5px;
  background: #f3f3f3;
}

/* ===========================
 *  FORM ITEMS
 * =========================== */
.el-form-item {
  margin-bottom: 5px !important;
  padding: 0 !important;
}

.el-form-item__label {
  height: 20px !important;
  padding: 2px 0 0 0 !important;
  line-height: 20px !important;
}

/* ===========================
 *  MODAL OVERLAY
 * =========================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  color: #333;
  border-radius: 16px;
  padding: 20px;
  width: 420px;
  max-width: 95%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Modal Vehicle Info */
.modal-vehicle-info {
  display: flex;
  margin-bottom: 20px;
  gap: 15px;
}

.modal-vehicle-img {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-vehicle-details {
  flex: 1;
}

.modal-vehicle-details h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
}

.modal-vehicle-details p {
  margin: 4px 0;
  color: #555;
  font-size: 14px;
}

.status-online { color: #27ae60; font-weight: 600; }
.status-offline { color: #e74c3c; font-weight: 600; }

/* Modal Warning */
.modal-warning {
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
  text-align: center;
}

.modal-warning.danger {
  background: linear-gradient(135deg, #fff3cd 0%, #ffe6e6 100%);
  border: 1px solid #f39c12;
}

.modal-warning.danger i { color: #e74c3c; font-size: 24px; margin-bottom: 8px; }
.modal-warning.danger h4 { color: #d63031; margin: 8px 0; }

.modal-warning.success {
  background: linear-gradient(135deg, #d4edda 0%, #e8f5e9 100%);
  border: 1px solid #27ae60;
}

.modal-warning.success i { color: #27ae60; font-size: 24px; margin-bottom: 8px; }
.modal-warning.success h4 { color: #27ae60; margin: 8px 0; }

.modal-warning.warning {
  background: linear-gradient(135deg, #fff3cd 0%, #fff8e1 100%);
  border: 1px solid #f39c12;
}

.modal-warning.warning i { color: #f39c12; font-size: 24px; margin-bottom: 8px; }
.modal-warning.warning h4 { color: #f39c12; margin: 8px 0; }

.modal-warning p {
  color: #636e72;
  margin: 0;
  font-size: 14px;
}

/* ===========================
 *  SLIDER CONTAINER
 * =========================== */
.slider-container {
  margin: 20px 0;
}

.slider-label {
  text-align: center;
  margin-bottom: 15px;
  font-weight: 600;
  color: #333;
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
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 25px;
  transition: width 0.1s ease;
}

.slider-fill.danger { background: linear-gradient(90deg, #e74c3c, #c0392b); }
.slider-fill.success { background: linear-gradient(90deg, #27ae60, #1e8449); }
.slider-fill.warning { background: linear-gradient(90deg, #f39c12, #d68910); }

.slider-thumb {
  position: absolute;
  top: 2px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: background 0.2s, transform 0.1s;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.05);
}

.slider-thumb.confirmed {
  color: white;
}

.slider-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #6c757d;
  font-weight: 600;
  pointer-events: none;
  z-index: 5;
  font-size: 14px;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.slider-confirmed {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-weight: 700;
  z-index: 5;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Modal Actions */
.modal-actions {
  text-align: center;
  margin-top: 20px;
}

.btn-cancel {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, #0a62c2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
  padding: 10px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  z-index: 9999999;
  animation: slideIn 0.3s ease;
}

.connection-status.offline {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ===========================
 *  DIALOG IMPROVEMENTS
 * =========================== */
.el-dialog {
  border-radius: 16px !important;
  overflow: hidden;
}

.el-dialog__header {
  padding: 20px 20px 15px !important;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.el-dialog__title {
  color: white !important;
  font-size: 18px !important;
  font-weight: 600 !important;
}

.el-dialog__headerbtn {
  top: 20px !important;
  right: 20px !important;
  width: 32px !important;
  height: 32px !important;
  background: rgba(255, 255, 255, 0.2) !important;
  border-radius: 50% !important;
  transition: all 0.3s ease !important;
}

.el-dialog__headerbtn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  transform: rotate(90deg) !important;
}

.el-dialog__headerbtn .el-dialog__close {
  color: white !important;
  font-size: 18px !important;
}

.el-dialog__body {
  padding: 25px !important;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.el-dialog__footer {
  padding: 15px 25px 20px !important;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

/* ===========================
 *  MOBILE (PORTRAIT)
 * =========================== */
@media (orientation: portrait) {
  #menu {
    width: 0;
    overflow: hidden;
    position: fixed;
    left: 0;
    top: calc(var(--header-height) + var(--sat));
    z-index: 1006;
    height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)) - var(--sab));
    max-height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)) - var(--sab));
    padding-bottom: var(--sab);
  }

  #menu.isopen {
    width: var(--sb-width) !important;
    overflow-y: auto;
    overflow-x: hidden;
    box-shadow: 6px 0 18px rgba(0, 0, 0, 0.16);
  }

  #main {
    width: var(--vw, 100vw);
    max-width: var(--vw, 100vw);
    height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
    max-height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
    box-sizing: border-box;
    transition: padding-inline-end 0.3s ease;
    will-change: padding-inline-end;
  }

  /* Evitar overflow lateral (faixa branca) */
  #content {
    overflow: hidden;
  }

  .uname {
    display: none !important;
  }

  #btnmenu {
    display: block;
  }

  #open.shown:not(.bottom) {
    position: absolute;
    overflow: hidden;
    left: 0;
    top: calc(var(--header-height) + var(--sat));
    width: 100%;
    height: calc(var(--vh, 100vh) - (var(--header-height) + var(--sat)));
    z-index: 1005;
  }

  #open.shown.bottom {
    position: fixed;
    width: 100%;
    height: 40vh;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    z-index: 1005;
    padding-bottom: var(--sab);
  }

  #open.bottom {
    box-shadow: 0 -3px 15px rgba(0, 0, 0, 0.15);
    border-radius: 15px 15px 0 0 !important;
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
    box-sizing: border-box;
  }

  #main.bottom.minimized {
    margin-bottom: 0;
    padding-bottom: 0;
  }

  #pano {
    position: fixed !important;
    left: 0 !important;
    bottom: 0;
    width: 100% !important;
    height: calc(44vh - 85px) !important;
    z-index: 1005 !important;
  }

  .el-dialog {
    --el-dialog-width: 95vw !important;
  }

  .el-dialog__footer {
    overflow: auto;
    margin-right: 10px;
  }

  .showOnMobile {
    display: block !important;
  }

  .modal-content {
    width: 95%;
    max-width: 95%;
  }
}
</style>
