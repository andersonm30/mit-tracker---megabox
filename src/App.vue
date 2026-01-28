<template>
  <div v-if="!store.getters['server/isReady']" style="width: 100%;position: absolute;left: 0px; top: 0px;z-index: 999999999 ">
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

  <div v-if="store.state.auth">
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
    <!-- FITRUE_myFlag -->

    <!-- ADIÇÕES (paridade com concorrente) -->
    <show-invoices ref="invoicesRef"></show-invoices>
    <show-invoices-manager ref="invoicesManagerRef"></show-invoices-manager>
    <edit-integrations ref="integrationsRef"></edit-integrations>
    <edit-events ref="editEventsRef"></edit-events>
    <!-- FIM ADIÇÕES -->

    <edit-user ref="editUserRef"></edit-user>
    <edit-notifications ref="editNotificationsRef"></edit-notifications>
    <edit-device ref="editDeviceRef"></edit-device>
    <qr-device ref="qrDeviceRef"></qr-device>
    <show-graphic ref="showGraphicsRef"></show-graphic>

    <!-- Modal de BLOQUEIO -->
    <div
      v-if="showBlockModal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="'blockTitle'"
      :aria-describedby="'blockDesc'"
      tabindex="-1"
      @keydown.esc.stop="cancelBlock"
      style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
             z-index: 9999; display: flex; align-items: center; justify-content: center;"
    >
      <div
        style="background: rgba(240,240,240,0.7); backdrop-filter: blur(10px); color: #333;
               border-radius: 12px; padding: 15px; width: 400px; max-width: 90%;
               box-shadow: 0 10px 30px rgba(0,0,0,0.5);"
      >
        <div style="display: flex; margin-bottom: 20px;">
          <img
            :src="getVehicleImage(currentDevice)"
            :alt="currentDevice?.name || 'Veículo'"
            @error="onVehicleImgError"
            style="width: 120px; height: 90px; object-fit: cover; margin-right: 15px;"
          />
          <div style="flex: 1;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">{{ currentDevice?.name }}</h3>
            <p v-if="currentDevice?.uniqueId" style="margin: 4px 0; color: #333; font-size: 14px;">
              <strong>{{KT('imei')}}</strong> {{ currentDevice.uniqueId }}
            </p>
            <p v-if="currentDevice?.attributes?.placa" style="margin: 4px 0; color: #333; font-size: 14px;">
              <strong>{{KT('plateLabel')}}</strong> {{ currentDevice.attributes.placa }}
            </p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;">
              <strong>{{KT('deviceStatus')}}</strong>
              <span :style="{ color: currentDevice?.status === 'online' ? '#27ae60' : '#e74c3c' }">
                {{ currentDevice?.status === 'online' ? KT('online') : KT('offline') }}
              </span>
            </p>
          </div>
        </div>

        <div id="blockDesc" style="background: #fff3cd; border: 1px solid #f39c12; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
          <i class="fas fa-exclamation-triangle" style="color: #e74c3c; font-size: 24px; margin-bottom: 8px;" aria-hidden="true"></i>
          <h4 id="blockTitle" style="color: #d63031; margin: 8px 0;">ATENÇÃO - USO APENAS EM EMERGÊNCIA</h4>
          <p style="color: #636e72; margin: 0; font-size: 14px;">
            {{ currentDevice?.status === 'online'
                ? 'Este comando deve ser usado somente em casos de emergência como roubo ou furto.'
                : KT('command.blockWarningOffline') }}
          </p>
        </div>

        <div style="margin: 20px 0;">
          <p style="text-align: center; margin-bottom: 15px; font-weight: 600;">{{KT('command.slideToConfirmBlock')}}</p>
          <div
            ref="blockSlider"
            role="slider"
            tabindex="0"
            @keydown.stop="onBlockKeydown"
            :aria-label="KT('command.slideToConfirmBlock')"
            aria-orientation="horizontal"
            :aria-valuemin="0"
            :aria-valuemax="100"
            :aria-valuenow="Math.round(blockProgress)"
            :aria-valuetext="Math.round(blockProgress) + '%'"
            :aria-disabled="commandLoading"
            :aria-busy="commandLoading ? 'true' : 'false'"
            style="position: relative; width: 100%; height: 50px; background: var(--el-fill-color-light, #e9ecef); border-radius: 25px; overflow: hidden; touch-action: none; user-select: none;"
            :style="{ pointerEvents: commandLoading ? 'none' : 'auto' }"
          >
            <div
              style="position: absolute; top: 0; left: 0; height: 100%; background: var(--el-color-danger); border-radius: 25px; transition: width 0.1s ease;"
              :style="{ width: blockProgress + '%' }"
              aria-hidden="true"
            ></div>

            <div
              ref="blockThumb"
              class="slider-thumb"
              :style="{
                left: blockThumbPosition + 'px',
                background: blockConfirmed ? 'var(--el-color-danger)' : 'white',
                color: blockConfirmed ? 'white' : '#495057',
                cursor: commandLoading ? 'not-allowed' : 'grab'
              }"
              @mousedown="startBlockDrag"
              @touchstart="startBlockDrag"
              aria-hidden="true"
            >
              <i class="fas fa-lock" style="font-size: 14px;" aria-hidden="true"></i>
            </div>

            <div
              style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                     color: #6c757d; font-weight: 600; pointer-events: none; z-index: 5; font-size: 14px;"
              :style="{ opacity: blockConfirmed ? 0 : 1 }"
              aria-hidden="true"
            >
              Deslize para Bloquear
            </div>
            <div
              v-if="blockConfirmed"
              style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #333; font-weight: 700; z-index: 5; font-size: 14px;"
              aria-live="polite"
            >
              {{KT('command.confirmed')}}
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <button @click="cancelBlock" :disabled="commandLoading" style="padding: 10px 20px; background: var(--el-color-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" :style="{ opacity: commandLoading ? 0.6 : 1, cursor: commandLoading ? 'not-allowed' : 'pointer' }">
            {{KT('cancel')}}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de DESBLOQUEIO -->
    <div
      v-if="showUnlockModal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="'unlockTitle'"
      :aria-describedby="'unlockDesc'"
      tabindex="-1"
      @keydown.esc.stop="cancelUnlock"
      style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
             z-index: 9999; display: flex; align-items: center; justify-content: center;"
    >
      <div
        style="background: rgba(240,240,240,0.7); backdrop-filter: blur(10px); color: #333;
               border-radius: 12px; padding: 15px; width: 400px; max-width: 90%;
               box-shadow: 0 10px 30px rgba(0,0,0,0.5);"
      >
        <div style="display: flex; margin-bottom: 20px;">
          <img
            :src="getVehicleImage(currentDevice)"
            :alt="currentDevice?.name || 'Veículo'"
            @error="onVehicleImgError"
            style="width: 120px; height: 90px; object-fit: cover; margin-right: 15px;"
          />
          <div style="flex: 1;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">{{ currentDevice?.name }}</h3>
            <p v-if="currentDevice?.uniqueId" style="margin: 4px 0; color: #333; font-size: 14px;">
              <strong>{{KT('imei')}}</strong> {{ currentDevice.uniqueId }}
            </p>
            <p v-if="currentDevice?.attributes?.placa" style="margin: 4px 0; color: #333; font-size: 14px;">
              <strong>{{KT('plateLabel')}}</strong> {{ currentDevice.attributes.placa }}
            </p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;">
              <strong>{{KT('deviceStatus')}}</strong>
              <span :style="{ color: currentDevice?.status === 'online' ? '#27ae60' : '#e74c3c' }">
                {{ currentDevice?.status === 'online' ? KT('online') : KT('offline') }}
              </span>
            </p>
          </div>
        </div>

        <div id="unlockDesc" style="background: #d4edda; border: 1px solid #27ae60; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
          <i class="fas fa-unlock" style="color: #27ae60; font-size: 24px; margin-bottom: 8px;" aria-hidden="true"></i>
          <h4 id="unlockTitle" style="color: #27ae60; margin: 8px 0;">CONFIRMAÇÃO NECESSÁRIA</h4>
          <p style="color: #636e72; margin: 0; font-size: 14px;">
            {{ currentDevice?.status === 'online' ? 'Confirme que deseja executar este comando no veículo.' : KT('command.unlockWarningOffline') }}
          </p>
        </div>

        <div style="margin: 20px 0;">
          <p style="text-align: center; margin-bottom: 15px; font-weight: 600;">{{KT('command.slideToConfirmUnlock')}}</p>
          <div
            ref="unlockSlider"
            role="slider"
            tabindex="0"
            @keydown.stop="onUnlockKeydown"
            :aria-label="KT('command.slideToConfirmUnlock')"
            aria-orientation="horizontal"
            :aria-valuemin="0"
            :aria-valuemax="100"
            :aria-valuenow="Math.round(unlockProgress)"
            :aria-valuetext="Math.round(unlockProgress) + '%'"
            :aria-disabled="commandLoading"
            :aria-busy="commandLoading ? 'true' : 'false'"
            style="position: relative; width: 100%; height: 50px; background: var(--el-fill-color-light, #e9ecef); border-radius: 25px; overflow: hidden; touch-action: none; user-select: none;"
            :style="{ pointerEvents: commandLoading ? 'none' : 'auto' }"
          >
            <div
              style="position: absolute; top: 0; height: 100%; background: var(--el-color-success); border-radius: 25px; transition: width 0.1s ease;"
              :style="{ width: unlockProgress + '%', left: '0', right: 'auto' }"
              aria-hidden="true"
            ></div>

            <div
              ref="unlockThumb"
              class="slider-thumb"
              :style="{
                left: unlockThumbPosition + 'px',
                background: unlockConfirmed ? 'var(--el-color-success)' : 'white',
                color: unlockConfirmed ? 'white' : '#495057',
                cursor: commandLoading ? 'not-allowed' : 'grab'
              }"
              @mousedown="startUnlockDrag"
              @touchstart="startUnlockDrag"
              aria-hidden="true"
            >
              <i class="fas fa-unlock" style="font-size: 14px;" aria-hidden="true"></i>
            </div>

            <div
              style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #6c757d; font-weight: 600; pointer-events: none; z-index: 5; font-size: 14px;"
              :style="{ opacity: unlockConfirmed ? 0 : 1 }"
              aria-hidden="true"
            >
              → Deslize para Desbloquear
            </div>
            <div
              v-if="unlockConfirmed"
              style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #333; font-weight: 700; z-index: 5; font-size: 14px;"
              aria-live="polite"
            >
              {{KT('command.confirmed')}}
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <button @click="cancelUnlock" :disabled="commandLoading" style="padding: 10px 20px; background: var(--el-color-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" :style="{ opacity: commandLoading ? 0.6 : 1, cursor: commandLoading ? 'not-allowed' : 'pointer' }">
            {{KT('cancel')}}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de ÂNCORA (ativar/desativar) -->
    <div
      v-if="showAnchorModal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="'anchorTitle'"
      :aria-describedby="'anchorDesc'"
      tabindex="-1"
      @keydown.esc.stop="cancelAnchor"
      style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
             z-index: 9999; display: flex; align-items: center; justify-content: center;"
    >
      <div
        style="background: rgba(240,240,240,0.7); backdrop-filter: blur(10px); color: #333;
               border-radius: 12px; padding: 15px; width: 400px; max-width: 90%;
               box-shadow: 0 10px 30px rgba(0,0,0,0.5);"
      >
        <div style="display: flex; margin-bottom: 20px;">
          <img
            :src="getVehicleImage(currentDevice)"
            :alt="currentDevice?.name || 'Veículo'"
            @error="onVehicleImgError"
            style="width: 120px; height: 90px; object-fit: cover; margin-right: 15px;"
          />
          <div style="flex: 1;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">{{ currentDevice?.name }}</h3>
            <p v-if="currentDevice?.uniqueId" style="margin: 4px 0; color: #333; font-size: 14px;">
              <strong>{{KT('imei')}}</strong> {{ currentDevice.uniqueId }}
            </p>
            <p v-if="currentDevice?.attributes?.placa" style="margin: 4px 0; color: #333; font-size: 14px;">
              <strong>{{KT('plateLabel')}}</strong> {{ currentDevice.attributes.placa }}
            </p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;">
              <strong>{{KT('deviceStatus')}}</strong>
              <span :style="{ color: currentDevice?.status === 'online' ? '#27ae60' : '#e74c3c' }">
                {{ currentDevice?.status === 'online' ? KT('online') : KT('offline') }}
              </span>
            </p>
          </div>
        </div>

        <div id="anchorDesc" style="background: #fff3cd; border: 1px solid #f39c12; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
          <i class="fas fa-anchor" style="color: #f39c12; font-size: 24px; margin-bottom: 8px;" aria-hidden="true"></i>
          <h4 id="anchorTitle" style="color: #f39c12; margin: 8px 0;">
            {{ currentCommand?.type === 'anchor_enable' ? KT('command.activateAnchor') : KT('command.deactivateAnchor') }}
          </h4>
          <p style="color: #636e72; margin: 0; font-size: 14px;">
            {{ currentCommand?.type === 'anchor_enable' ? KT('command.anchorActivateDescription') : KT('command.anchorDeactivateDescription') }}
          </p>
        </div>

        <div style="margin: 20px 0%;">
          <p style="text-align: center; margin-bottom: 15px; font-weight: 600;">{{KT('command.slideToConfirmGeneric')}}</p>
          <div
            ref="anchorSlider"
            role="slider"
            tabindex="0"
            @keydown.stop="onAnchorKeydown"
            :aria-label="KT('command.slideToConfirmGeneric')"
            aria-orientation="horizontal"
            :aria-valuemin="0"
            :aria-valuemax="100"
            :aria-valuenow="Math.round(anchorProgress)"
            :aria-valuetext="Math.round(anchorProgress) + '%'"
            :aria-disabled="commandLoading"
            :aria-busy="commandLoading ? 'true' : 'false'"
            style="position: relative; width: 100%; height: 50px; background: var(--el-fill-color-light, #e9ecef); border-radius: 25px; overflow: hidden; touch-action: none; user-select: none;"
            :style="{ pointerEvents: commandLoading ? 'none' : 'auto' }"
          >
            <div
              style="position: absolute; top: 0; height: 100%; background: var(--el-color-warning); border-radius: 25px; transition: width 0.1s ease;"
              :style="{
                width: anchorProgress + '%',
                left: currentCommand?.type === 'anchor_disable' ? 'auto' : '0',
                right: currentCommand?.type === 'anchor_disable' ? '0' : 'auto'
              }"
              aria-hidden="true"
            ></div>

            <div
              ref="anchorThumb"
              class="slider-thumb"
              :style="{
                left: anchorThumbPosition + 'px',
                background: anchorConfirmed ? 'var(--el-color-warning)' : 'white',
                color: anchorConfirmed ? 'white' : '#495057',
                cursor: commandLoading ? 'not-allowed' : 'grab'
              }"
              @mousedown="startAnchorDrag"
              @touchstart="startAnchorDrag"
              aria-hidden="true"
            >
              <i class="fas fa-anchor" style="font-size: 14px;" aria-hidden="true"></i>
            </div>

            <div
              style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                     color: #6c757d; font-weight: 600; pointer-events: none; z-index: 5; font-size: 14px;"
              :style="{ opacity: anchorConfirmed ? 0 : 1 }"
              aria-hidden="true"
            >
              {{ currentCommand?.type === 'anchor_enable' ? KT('command.slideRightToActivate') : KT('command.slideLeftToDeactivate') }}
            </div>
            <div
              v-if="anchorConfirmed"
              style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #333; font-weight: 700; z-index: 5; font-size: 14px;"
              aria-live="polite"
            >
              {{KT('command.confirmed')}}
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <button @click="cancelAnchor" :disabled="commandLoading" style="padding: 10px 20px; background: var(--el-color-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" :style="{ opacity: commandLoading ? 0.6 : 1, cursor: commandLoading ? 'not-allowed' : 'pointer' }">
            {{KT('cancel')}}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de EXCLUSÃO -->
    <div
      v-if="showDeleteModal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="'deleteTitle'"
      :aria-describedby="'deleteDesc'"
      tabindex="-1"
      @keydown.esc.stop="cancelDelete"
      style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
             z-index: 9999; display: flex; align-items: center; justify-content: center;"
    >
      <div
        style="background: rgba(240,240,240,0.7); backdrop-filter: blur(10px); color: #333;
               border-radius: 12px; padding: 15px; width: 400px; max-width: 90%;
               box-shadow: 0 10px 30px rgba(0,0,0,0.5);"
      >
        <div style="display: flex; margin-bottom: 20px;">
          <div style="margin-left: 15px;">
            <h3 id="deleteTitle" style="margin: 0 0 5px 0; font-size: 18px; color: #dc3545;">⚠️ {{KT('device.remove')}}</h3>
            <p style="margin: 5px 0;"><strong>{{KT('device.name')}}:</strong> {{ currentDevice?.name }}</p>
            <p style="margin: 5px 0;">
              <strong>{{KT('deviceStatus')}}</strong>
              <span :style="{ color: currentDevice?.status === 'online' ? '#27ae60' : '#e74c3c' }">
                {{ currentDevice?.status === 'online' ? KT('online') : KT('offline') }}
              </span>
            </p>
          </div>
        </div>

        <div id="deleteDesc" style="background: #f8d7da; border: 1px solid #dc3545; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
          <p style="margin: 0; font-weight: bold; color: #dc3545;">
            🗑️ {{KT('device.question_del1')}}
          </p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">
            {{KT('device.question_del2')}}
          </p>
        </div>

        <div style="margin: 20px 0;">
          <p style="text-align: center; margin-bottom: 15px; font-weight: 600;">{{KT('command.slideToConfirmDelete')}}</p>
          <div
            ref="deleteSlider"
            role="slider"
            tabindex="0"
            @keydown.stop="onDeleteKeydown"
            :aria-label="KT('command.slideToConfirmDelete')"
            aria-orientation="horizontal"
            :aria-valuemin="0"
            :aria-valuemax="100"
            :aria-valuenow="Math.round(deleteProgress)"
            :aria-valuetext="Math.round(deleteProgress) + '%'"
            :aria-disabled="commandLoading"
            :aria-busy="commandLoading ? 'true' : 'false'"
            style="position: relative; width: 100%; height: 50px; background: var(--el-fill-color-light, #e9ecef); border-radius: 25px; overflow: hidden; touch-action: none; user-select: none;"
            :style="{ pointerEvents: commandLoading ? 'none' : 'auto' }"
          >
            <div
              style="position: absolute; top: 0; left: 0; height: 100%; background: var(--el-color-danger); border-radius: 25px; transition: width 0.1s ease;"
              :style="{ width: deleteProgress + '%' }"
              aria-hidden="true"
            ></div>

            <div
              ref="deleteThumb"
              class="slider-thumb"
              :style="{
                left: deleteThumbPosition + 'px',
                background: deleteConfirmed ? 'var(--el-color-danger)' : 'white',
                color: deleteConfirmed ? 'white' : '#495057',
                cursor: commandLoading ? 'not-allowed' : 'grab'
              }"
              @mousedown="startDeleteDrag"
              @touchstart="startDeleteDrag"
              aria-hidden="true"
            >
              <i class="fas fa-trash" style="font-size: 14px;" aria-hidden="true"></i>
            </div>

            <div
              style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                     color: #6c757d; font-weight: 600; pointer-events: none; z-index: 5; font-size: 14px;"
              :style="{ opacity: deleteConfirmed ? 0 : 1 }"
              aria-hidden="true"
            >
              Deslizar para Excluir
            </div>
            <div
              v-if="deleteConfirmed"
              style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #333; font-weight: 700; z-index: 5; font-size: 14px;"
              aria-live="polite"
            >
              {{KT('command.confirmed')}}
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <button @click="cancelDelete" :disabled="commandLoading" style="padding: 10px 20px; background: var(--el-color-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" :style="{ opacity: commandLoading ? 0.6 : 1, cursor: commandLoading ? 'not-allowed' : 'pointer' }">
            {{KT('cancel')}}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== Wrapper com inert/aria-hidden para desativar o fundo quando qualquer modal estiver aberto ===== -->
    <div
      :inert="showBlockModal || showUnlockModal || showAnchorModal || showDeleteModal"
      :aria-hidden="(showBlockModal || showUnlockModal || showAnchorModal || showDeleteModal) ? 'true' : 'false'"
    >
      <div id="head">
        <!-- botão do menu com .stop para não propagar -->
        <div id="btnmenu" @click.stop="toggleSidebar" aria-label="Alternar menu">
          <i class="fas fa-bars" aria-hidden="true"></i>
        </div>
        <div id="logo">
          <img
            v-if="store.state.server.labelConf.headLogo.image"
            :src="logoSrc"
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
          <div id="menu" :class="{isopen: menuShown, 'sidebar-closed': sidebarClosed }" v-if="store.state.auth && !store.state.auth.attributes['isShared']">
            <ul>
              <router-link v-if="store.getters.advancedPermissions(8)" to="/devices" custom v-slot="{ href, navigate, isActive, isExactActive }">
                <li :class="{active: isActive || isExactActive,'exact-active': isExactActive}">
                  <a :href="href" @click="(e) => { navigate(e); autoCloseSidebarOnNav(); }">
                    <el-icon><i class="fas fa-car" aria-hidden="true"></i></el-icon>
                    <span class="text">{{$t('menu.devices')}}</span>
                  </a>
                </li>
              </router-link>

              <!-- Relatórios -->
              <router-link v-if="store.getters.advancedPermissions(72)" to="/reports" custom v-slot="{ href, navigate, isActive, isExactActive }">
                <li :class="{active: isActive,'exact-active': isExactActive}">
                  <a :href="href" @click="(e) => { navigate(e); autoCloseSidebarOnNav(); }">
                    <el-icon><i class="fas fa-chart-bar" aria-hidden="true"></i></el-icon>
                    <span class="text">{{$t('menu.reports')}}</span>
                  </a>
                </li>
              </router-link>

              <!-- Geocerca -->
              <router-link v-if="store.getters.advancedPermissions(40)" to="/geofence" custom v-slot="{ href, navigate, isActive, isExactActive }">
                <li :class="{active: isActive,'exact-active': isExactActive}">
                  <a :href="href" @click="(e) => { navigate(e); autoCloseSidebarOnNav(); }">
                    <el-icon><i class="fas fa-draw-polygon" aria-hidden="true"></i></el-icon>
                    <span class="text">{{$t('menu.geofence')}}</span>
                  </a>
                </li>
              </router-link>

              <!-- Comandos -->
              <router-link v-if="store.getters.advancedPermissions(56)" to="/commands" custom v-slot="{ href, navigate, isActive, isExactActive }">
                <li :class="{active: isActive,'exact-active': isExactActive}">
                  <a :href="href" @click="(e) => { navigate(e); autoCloseSidebarOnNav(); }">
                    <el-icon><i class="far fa-keyboard" aria-hidden="true"></i></el-icon>
                    <span class="text">{{$t('menu.commands')}}</span>
                  </a>
                </li>
              </router-link>

              <!-- Grupos -->
              <router-link v-if="store.getters.advancedPermissions(48)" to="/groups" custom v-slot="{ href, navigate, isActive, isExactActive }">
                <li :class="{active: isActive,'exact-active': isExactActive}">
                  <a :href="href" @click="(e) => { navigate(e); autoCloseSidebarOnNav(); }">
                    <el-icon><i class="far fa-object-group" aria-hidden="true"></i></el-icon>
                    <span class="text">{{$t('menu.groups')}}</span>
                  </a>
                </li>
              </router-link>

              <!-- Notificações -->
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

            <div id="version" @click="handleVersionClick">
              {{$t('version')}}
              <template v-if="store.state.server.serverInfo.version">
                @<br /> {{store.state.server.serverInfo.version}}
              </template>
            </div>
          </div>

          <div
            id="open"
            :class="{
              minimized: minimized,
              bottom: ($route.meta.mobileBottom),
              mobileExpanded: mobileExpand,
              shown: ($route.meta.shown),
              editing: store.state.geofences.mapEditing,
              allowExpand: $route.meta.allowExpand,
              expanded: ($route.meta.allowExpand && $route.query.expand==='true')
            }"
          >
            <div style="width: calc(100%);" :style="{display: (store.state.geofences.mapEditing)?'none':'' }">
              <div id="heading">
                <span @click="onOpenBack" aria-label="Voltar"><i class="fas fa-angle-double-left" aria-hidden="true"></i></span>
                {{KT($route.meta.title || 'page')}}
                <span @click="onOpenClose" aria-label="Fechar"><i class="fas fa-times-circle" aria-hidden="true"></i></span>
              </div>

              <div v-if="($route.meta.mobileBottom)" @click="minimized = !minimized" class="showOnMobile" style="position: absolute;right: 35px;top: 5px;font-size: 18px;" aria-label="Minimizar painel"><i class="fas fa-window-minimize" aria-hidden="true"></i></div>
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
              <!-- <div style="padding: 10px;"><el-button type="warning" plain>{{KT('Reset')}}</el-button></div> -->
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

          <!-- PROTEÇÃO DE CLIQUE NO MAPA: handler no container do mapa -->
          <div
            id="main"
            @click="handleMainClick"
            :class="{'sidebar-closed': sidebarClosed,menuShown: menuShown,editing: store.state.geofences.mapEditing,minimized: minimized,bottom: ($route.meta.mobileBottom),shown: ($route.meta.shown)}"
            :style="{width: (store.state.auth.attributes['isShared'])?'100vw':''}"
          >
            <!-- Street View CONDICIONAL: só renderiza quando ativo no store -->
            <street-view v-if="streetViewEnabled"></street-view>

            <!-- Seus iframes continuam condicionais como já estão -->
            <iframe-calor v-if="store.state.devices.toggleCalor"></iframe-calor>
            <iframe-percurso v-if="store.state.devices.showPercurso"></iframe-percurso>
            <iframe-pontos v-if="store.state.devices.showPontos"></iframe-pontos>

            <!-- Mapa principal -->
            <kore-map></kore-map>
          </div>
        </template>
      </div>
    </div>
    <!-- ===== FIM do wrapper inert ===== -->
  </div>

  <div v-else>
    <router-view></router-view>
  </div>

  <!-- Diálogo: Histórico de Versões -->
  <el-dialog
    v-model="showVersionHistory"
    title="Cronologia de Atualizações"
    width="750px"
    :close-on-click-modal="true"
    :z-index="999999999"
    append-to-body
    center
  >
    <!-- Wrapper interno para evitar aviso de "Extraneous non-props attributes (class)" -->
    <div class="version-history-dialog">
      <div class="version-timeline">
        <div
          v-for="(version, index) in versionHistory"
          :key="index"
          class="version-item"
        >
          <div class="version-header">
            <div class="version-number">{{ version.version }}</div>
            <div class="version-date">{{ version.date }}</div>
            <div class="version-type" :class="version.type">
              {{ version.typeLabel }}
            </div>
          </div>

          <div class="version-content">
            <h4>{{ version.title }}</h4>
            <ul class="changes-list">
              <li
                v-for="(change, changeIndex) in version.changes"
                :key="changeIndex"
                :class="change.type"
              >
                <i :class="getChangeIcon(change.type)" aria-hidden="true"></i>
                {{ change.description }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showVersionHistory = false">Fechar</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- Assistente IA Global -->
  <AIAssistantWrapper />
  
  <!-- Indicador de conexão -->
  <div v-if="!isOnline" class="connection-status offline">
    <i class="fas fa-wifi-slash"></i>
    <span>Sem conexão</span>
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
import 'element-plus/es/components/tabs/style/css'
import 'element-plus/es/components/tab-pane/style/css'

import { ElProgress } from 'element-plus/es/components/progress'
import { ElButton } from 'element-plus/es/components/button'
import { ElIcon } from 'element-plus/es/components/icon'
import { ElTooltip } from 'element-plus/es/components/tooltip'
import { ElDialog } from 'element-plus/es/components/dialog'

import router from './routes'

// Branding & Asset helpers (MIT.app)
import { assetUrl, deviceImageUrl, categoryImageUrl } from '@/branding/index.js'
import { ensureAsyncRefReady } from '@/utils/asyncComponent.js'

/* Async components */
const lazy = (name, loader) =>
  defineAsyncComponent({
    loader,
    timeout: 30000,
    onError(_e, retry, fail, attempts) {
      if (attempts <= 1) retry()
      else fail(_e)
    },
  })

/* Components */
const StreetView = lazy('StreetView', () => import('./tarkan/components/street-view'))
const IframePercurso = lazy('IframePercurso', () => import('./tarkan/components/iframe-percurso'))
const IframePontos = lazy('IframePontos', () => import('./tarkan/components/iframe-pontos'))
const IframeCalor = lazy('IframeCalor', () => import('./tarkan/components/iframe-calor'))
const KoreMap = lazy('KoreMap', () => import('./tarkan/components/kore-map'))

import KT from './tarkan/func/kt'
import actAnchor from './tarkan/func/actAnchor'

import 'leaflet/dist/leaflet.css'

const ContextMenu = lazy('ContextMenu', () => import('./tarkan/components/context-menu'))
const EditUser = lazy('EditUser', () => import('./tarkan/components/views/edit-user'))
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
const ShowInvoices = lazy('ShowInvoices', () => import('./tarkan/components/views/show-invoices'))
const ShowInvoicesManager = lazy('ShowInvoicesManager', () => import('./tarkan/components/views/show-invoices-manager'))
const EditIntegrations = lazy('EditIntegrations', () => import('./tarkan/components/views/edit-integrations'))
const EditEvents = lazy('EditEvents', () => import('./tarkan/components/views/edit-events'))
const EditNotifications = lazy('EditNotifications', () => import('./tarkan/components/views/edit-notifications'))
const EditDevice = lazy('EditDevice', () => import('./tarkan/components/views/edit-device'))
const QrDevice = lazy('QrDevice', () => import('./tarkan/components/views/qr-device'))
const Showtip = lazy('Showtip', () => import('./tarkan/components/showtip'))
const ShowGraphic = lazy('ShowGraphic', () => import('./tarkan/components/views/show-graphic'))
const PushNotificationBtn = lazy('PushNotificationBtn', () => import('./tarkan/components/push-notification-btn'))
const AIAssistantWrapper = lazy('AIAssistantWrapper', () => import('./components/AIAssistantWrapper.vue'))

/* ===========================
 *  SETUP
 * =========================== */
const store = useStore()

// CSS Variables
const css = getComputedStyle(document.documentElement)
const primaryColor = css.getPropertyValue('--el-color-primary')?.trim() || '#409EFF'

// Branding computed
const logoSrc = computed(() => assetUrl('custom/logo.png'))

// Street View computed (from store)
const streetViewEnabled = computed(() => store.state.ui?.streetViewEnabled ?? false)

// ===== DARK MODE GLOBAL (ativa tokens CSS em modais) =====
// App-dark.vue sempre está em dark mode
document.body.classList.add('dark-mode')

// Component Refs
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
const invoicesRef = ref(null)
const invoicesManagerRef = ref(null)
const integrationsRef = ref(null)
const editEventsRef = ref(null)

// UI State
const mobileExpand = ref(false)
const menuShown = ref(false)
const minimized = ref(false)
const sidebarClosed = ref(false)

// Slider refs
const blockSlider = ref(null)
const unlockSlider = ref(null)
const anchorSlider = ref(null)
const deleteSlider = ref(null)
const blockThumb = ref(null)
const unlockThumb = ref(null)
const anchorThumb = ref(null)
const deleteThumb = ref(null)

// Modal States
const showBlockModal = ref(false)
const showUnlockModal = ref(false)
const showAnchorModal = ref(false)
const showDeleteModal = ref(false)
const currentDevice = ref(null)
const currentCommand = ref(null)
const commandLoading = ref(false)

// Slider States
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
const anchorRTL = ref(false)

const deleteProgress = ref(0)
const deleteThumbPosition = ref(SLIDER_PADDING)
const deleteConfirmed = ref(false)
const deleteDragging = ref(false)

// Version History
const versionClickCount = ref(0)
const showVersionHistory = ref(false)
const clickTimeout = ref(null)

// Connection Status
const isOnline = ref(navigator.onLine)
const connectionSpeed = ref('good')

// Handlers
const currentHandlers = ref({ move: null, end: null, rafId: null })
const previouslyFocusedEl = ref(null)

/* ===========================
 *  SIDEBAR FUNCTIONS
 * =========================== */
const isPortrait = () => window.matchMedia && window.matchMedia('(orientation: portrait)').matches

const toggleSidebar = () => {
  if (isPortrait()) {
    menuShown.value = !menuShown.value
  } else {
    // Em desktop, não fecha automaticamente
    sidebarClosed.value = !sidebarClosed.value
  }
}

const restoreSidebar = () => {
  if (isPortrait()) {
    menuShown.value = false
  }
  // Mantém estado do sidebar em desktop
}

const autoCloseSidebarOnNav = () => {
  // Só fecha em mobile
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

const applyViewportVars = () => {
  const root = document.documentElement
  root.style.setProperty('--vh', `${window.innerHeight}px`)
  root.style.setProperty('--vw', `${window.innerWidth}px`)
}

const getVehicleImage = (device) => {
  if (!device) return categoryImageUrl('default')
  return deviceImageUrl(device.id, {
    timestamp: Date.now(),
    imageVersion: device?.attributes?.imageVersion || 0,
    driverUniqueId: device?.attributes?.driverUniqueId || '',
  })
}

const onVehicleImgError = (e) => {
  const cat = currentDevice.value?.category || 'default'
  e.target.onerror = null
  e.target.src = categoryImageUrl(cat)
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
  // Não fecha menu ao clicar no mapa
  if (modalOpen.value || 
      blockDragging.value || unlockDragging.value ||
      anchorDragging.value || deleteDragging.value) {
    e?.stopPropagation?.()
    e?.preventDefault?.()
    return
  }
}

/* ===========================
 *  VERSION HISTORY
 * =========================== */
const handleVersionClick = () => {
  if (!store.state?.auth?.administrator) return
  versionClickCount.value++
  if (clickTimeout.value) clearTimeout(clickTimeout.value)
  if (versionClickCount.value >= 10) {
    showVersionHistory.value = true
    versionClickCount.value = 0
    return
  }
  clickTimeout.value = setTimeout(() => { versionClickCount.value = 0 }, 2000)
}

const getChangeIcon = (type) =>
  type === 'feature' ? 'fas fa-plus-circle' :
  type === 'improvement' ? 'fas fa-arrow-up' :
  type === 'fix' ? 'fas fa-bug' :
  type === 'security' ? 'fas fa-shield-alt' :
  type === 'breaking' ? 'fas fa-exclamation-triangle' :
  'fas fa-circle'

const versionHistory = ref([
  {
    version: 'v3.2.1',
    date: '08/06/2025',
    type: 'patch',
    typeLabel: 'Correções',
    title: 'Correções e melhorias de estabilidade',
    changes: [
      { type: 'fix', description: 'Correção de sincronização de dispositivos offline' },
      { type: 'improvement', description: 'Mapa mais leve com muitos dispositivos' },
      { type: 'fix', description: 'Erro ao exportar PDF resolvido' }
    ]
  },
  {
    version: 'v3.2.0',
    date: '01/06/2025',
    type: 'minor',
    typeLabel: 'Funcionalidade',
    title: 'Nova UI e funcionalidades',
    changes: [
      { type: 'feature', description: 'Notificações push aprimoradas' },
      { type: 'feature', description: 'UI redesenhada' },
      { type: 'improvement', description: 'Controles de zoom reposicionados' },
      { type: 'feature', description: 'Filtros com estado online/offline' }
    ]
  }
])

/* ===========================
 *  CONNECTION STATUS
 * =========================== */
const updateConnectionStatus = () => {
  isOnline.value = navigator.onLine
  
  if ('connection' in navigator) {
    const connection = navigator.connection
    if (connection.effectiveType === '4g') {
      connectionSpeed.value = 'excellent'
    } else if (connection.effectiveType === '3g') {
      connectionSpeed.value = 'good'
    } else {
      connectionSpeed.value = 'slow'
    }
  }
}

/* ===========================
 *  SLIDER GEOMETRY
 * =========================== */
const calculateSliderGeometry = (sliderRef, thumbRef = null) => {
  const sliderEl = sliderRef?.value || sliderRef
  const thumbEl = thumbRef?.value || thumbRef
  const sliderRect = sliderEl?.getBoundingClientRect?.()
  if (!sliderRect) return null

  const thumbWidth = thumbEl?.offsetWidth ?? DEFAULT_THUMB_WIDTH
  const maxLeftRaw = sliderRect.width - thumbWidth - SLIDER_PADDING
  const maxLeft = Math.max(SLIDER_PADDING, maxLeftRaw)

  return { rect: sliderRect, thumbWidth, maxLeft, padding: SLIDER_PADDING }
}

const cleanupCurrentHandlers = () => {
  if (currentHandlers.value.rafId) {
    cancelAnimationFrame(currentHandlers.value.rafId)
    currentHandlers.value.rafId = null
  }
  if (currentHandlers.value.move) {
    document.removeEventListener('mousemove', currentHandlers.value.move)
    document.removeEventListener('touchmove', currentHandlers.value.move)
    currentHandlers.value.move = null
  }
  if (currentHandlers.value.end) {
    document.removeEventListener('mouseup', currentHandlers.value.end)
    document.removeEventListener('touchend', currentHandlers.value.end)
    currentHandlers.value.end = null
  }
}

/* ===========================
 *  DRAG HANDLERS
 * =========================== */
const startBlockDrag = (event) => {
  if (blockConfirmed.value || commandLoading.value) return
  cleanupCurrentHandlers()
  blockDragging.value = true
  event.preventDefault()

  const geometry = calculateSliderGeometry(blockSlider.value, blockThumb.value)
  if (!geometry) return

  const handleMove = (e) => {
    if (!blockDragging.value) return
    e.preventDefault()
    const clientX = e.type.includes('touch') ? e.touches[0]?.clientX : e.clientX
    if (clientX == null || !Number.isFinite(clientX)) return

    if (currentHandlers.value.rafId) cancelAnimationFrame(currentHandlers.value.rafId)
    currentHandlers.value.rafId = requestAnimationFrame(() => {
      const newLeft = Math.max(geometry.padding, Math.min(clientX - geometry.rect.left - geometry.thumbWidth/2, geometry.maxLeft))
      blockThumbPosition.value = newLeft
      blockProgress.value = ((newLeft - geometry.padding) / (geometry.maxLeft - geometry.padding)) * 100

      if (newLeft >= geometry.maxLeft - 5) {
        blockConfirmed.value = true
        blockDragging.value = false
        setTimeout(() => { handleBlockConfirmed() }, 500)
      }
    })
  }

  const handleEnd = () => {
    if (!blockConfirmed.value) {
      blockThumbPosition.value = SLIDER_PADDING
      blockProgress.value = 0
    }
    blockDragging.value = false
    cleanupCurrentHandlers()
  }

  currentHandlers.value.move = handleMove
  currentHandlers.value.end = handleEnd
  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleEnd)
  document.addEventListener('touchmove', handleMove, { passive: false })
  document.addEventListener('touchend', handleEnd, { passive: false })
}

const startUnlockDrag = (event) => {
  if (unlockConfirmed.value || commandLoading.value) return
  cleanupCurrentHandlers()
  unlockDragging.value = true
  event.preventDefault()

  const geometry = calculateSliderGeometry(unlockSlider.value, unlockThumb.value)
  if (!geometry) return

  const handleMove = (e) => {
    if (!unlockDragging.value) return
    e.preventDefault()
    const clientX = e.type.includes('touch') ? e.touches[0]?.clientX : e.clientX
    if (clientX == null || !Number.isFinite(clientX)) return

    if (currentHandlers.value.rafId) cancelAnimationFrame(currentHandlers.value.rafId)
    currentHandlers.value.rafId = requestAnimationFrame(() => {
      const newLeft = Math.max(geometry.padding, Math.min(clientX - geometry.rect.left - geometry.thumbWidth/2, geometry.maxLeft))
      unlockThumbPosition.value = newLeft
      unlockProgress.value = ((newLeft - geometry.padding) / (geometry.maxLeft - geometry.padding)) * 100

      if (newLeft >= geometry.maxLeft - 5) {
        unlockConfirmed.value = true
        unlockDragging.value = false
        setTimeout(() => { handleUnlockConfirmed() }, 500)
      }
    })
  }

  const handleEnd = () => {
    if (!unlockConfirmed.value) {
      unlockThumbPosition.value = SLIDER_PADDING
      unlockProgress.value = 0
    }
    unlockDragging.value = false
    cleanupCurrentHandlers()
  }

  currentHandlers.value.move = handleMove
  currentHandlers.value.end = handleEnd
  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleEnd)
  document.addEventListener('touchmove', handleMove, { passive: false })
  document.addEventListener('touchend', handleEnd, { passive: false })
}

const startAnchorDrag = (event) => {
  if (anchorConfirmed.value || commandLoading.value) return
  cleanupCurrentHandlers()
  anchorDragging.value = true
  event.preventDefault()

  const geometry = calculateSliderGeometry(anchorSlider.value, anchorThumb.value)
  if (!geometry) return

  const handleMove = (e) => {
    if (!anchorDragging.value) return
    e.preventDefault()
    const clientX = e.type.includes('touch') ? e.touches[0]?.clientX : e.clientX
    if (clientX == null || !Number.isFinite(clientX)) return

    if (currentHandlers.value.rafId) cancelAnimationFrame(currentHandlers.value.rafId)
    currentHandlers.value.rafId = requestAnimationFrame(() => {
      const newLeft = Math.max(geometry.padding, Math.min(clientX - geometry.rect.left - geometry.thumbWidth/2, geometry.maxLeft))
      anchorThumbPosition.value = newLeft
      anchorProgress.value = ((newLeft - geometry.padding) / (geometry.maxLeft - geometry.padding)) * 100

      if (newLeft >= geometry.maxLeft - 5) {
        anchorConfirmed.value = true
        anchorDragging.value = false
        setTimeout(() => { handleAnchorConfirmed() }, 500)
      }
    })
  }

  const handleEnd = () => {
    if (!anchorConfirmed.value) {
      anchorThumbPosition.value = SLIDER_PADDING
      anchorProgress.value = 0
    }
    anchorDragging.value = false
    cleanupCurrentHandlers()
  }

  currentHandlers.value.move = handleMove
  currentHandlers.value.end = handleEnd
  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleEnd)
  document.addEventListener('touchmove', handleMove, { passive: false })
  document.addEventListener('touchend', handleEnd, { passive: false })
}

const startDeleteDrag = (event) => {
  if (deleteConfirmed.value || commandLoading.value) return
  cleanupCurrentHandlers()
  deleteDragging.value = true
  event.preventDefault()

  const geometry = calculateSliderGeometry(deleteSlider.value, deleteThumb.value)
  if (!geometry) return

  const handleMove = (e) => {
    if (!deleteDragging.value) return
    e.preventDefault()
    const clientX = e.type.includes('touch') ? e.touches[0]?.clientX : e.clientX
    if (clientX == null || !Number.isFinite(clientX)) return

    if (currentHandlers.value.rafId) cancelAnimationFrame(currentHandlers.value.rafId)
    currentHandlers.value.rafId = requestAnimationFrame(() => {
      const newLeft = Math.max(geometry.padding, Math.min(clientX - geometry.rect.left - geometry.thumbWidth/2, geometry.maxLeft))
      deleteThumbPosition.value = newLeft
      deleteProgress.value = ((newLeft - geometry.padding) / (geometry.maxLeft - geometry.padding)) * 100

      if (newLeft >= geometry.maxLeft - 5) {
        deleteConfirmed.value = true
        deleteDragging.value = false
        executeDelete()
      }
    })
  }

  const handleEnd = () => {
    if (!deleteConfirmed.value) {
      deleteThumbPosition.value = SLIDER_PADDING
      deleteProgress.value = 0
    }
    deleteDragging.value = false
    cleanupCurrentHandlers()
  }

  currentHandlers.value.move = handleMove
  currentHandlers.value.end = handleEnd
  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleEnd)
  document.addEventListener('touchmove', handleMove, { passive: false })
  document.addEventListener('touchend', handleEnd, { passive: false })
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
    ElNotification({ title: KT('device.info'), message: KT('device.deviceDeleted'), type: 'success' })
    showDeleteModal.value = false
    router.push('/devices')
  } catch (_e) {
    const { ElMessage } = await import('element-plus')
    ElMessage.error('Erro ao excluir dispositivo')
  } finally {
    commandLoading.value = false
  }
}

/* Cancel functions */
const cancelBlock = () => {
  blockProgress.value = 0
  blockThumbPosition.value = SLIDER_PADDING
  blockConfirmed.value = false
  showBlockModal.value = false
  currentDevice.value = null
  currentCommand.value = null
}

const cancelUnlock = () => {
  unlockProgress.value = 0
  unlockThumbPosition.value = SLIDER_PADDING
  unlockConfirmed.value = false
  showUnlockModal.value = false
  currentDevice.value = null
  currentCommand.value = null
}

const cancelAnchor = () => {
  anchorProgress.value = 0
  anchorThumbPosition.value = SLIDER_PADDING
  anchorConfirmed.value = false
  showAnchorModal.value = false
  currentDevice.value = null
  currentCommand.value = null
}

const cancelDelete = () => {
  deleteProgress.value = 0
  deleteThumbPosition.value = SLIDER_PADDING
  deleteConfirmed.value = false
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
  blockProgress.value = 0
  blockThumbPosition.value = SLIDER_PADDING
  blockConfirmed.value = false
  blockDragging.value = false
  showBlockModal.value = true
  nextTick(() => blockSlider.value?.focus())
}

const onOpenUnlockModal = (event) => {
  const detail = event?.detail || {}
  currentDevice.value = detail.device || null
  currentCommand.value = detail.command || null
  unlockProgress.value = 0
  unlockThumbPosition.value = SLIDER_PADDING
  unlockConfirmed.value = false
  unlockDragging.value = false
  showUnlockModal.value = true
  nextTick(() => unlockSlider.value?.focus())
}

const onOpenAnchorModal = (event) => {
  const detail = event?.detail || {}
  currentDevice.value = detail.device || null
  currentCommand.value = detail.command || null
  anchorRTL.value = detail?.command?.type === 'anchor_disable'
  anchorProgress.value = 0
  anchorThumbPosition.value = SLIDER_PADDING
  anchorConfirmed.value = false
  anchorDragging.value = false
  showAnchorModal.value = true
  nextTick(() => anchorSlider.value?.focus())
}

const onOpenDeleteModal = (event) => {
  const detail = event?.detail || {}
  currentDevice.value = detail.device || null
  currentCommand.value = detail.command || null
  deleteProgress.value = 0
  deleteThumbPosition.value = SLIDER_PADDING
  deleteConfirmed.value = false
  deleteDragging.value = false
  showDeleteModal.value = true
  nextTick(() => deleteSlider.value?.focus())
}

/* ===========================
 *  USER MENU - COM FIX PARA ASYNC COMPONENTS
 * =========================== */
const userMenu = async (e) => {
  const tmp = []

  if (!store.state.auth.attributes['isShared']) {
    tmp.push({ 
      text: KT('usermenu.account'), 
      icon: 'fas fa-user-cog', 
      cb: async () => {
        await ensureAsyncRefReady(editUserRef, { requiredMethod: 'editUser', timeoutMs: 2000 })
        editUserRef.value?.editUser()
      }
    })

    if (store.state.auth.administrator) {
      tmp.push({ 
        text: KT('usermenu.logs'), 
        icon: 'fas fa-history', 
        cb: async () => {
          await ensureAsyncRefReady(logObjectsRef, { requiredMethod: 'showLogs', timeoutMs: 2000 })
          logObjectsRef.value?.showLogs('all')
        }
      })
      tmp.push({ 
        text: KT('usermenu.theme'), 
        icon: 'fas fa-palette', 
        cb: async () => {
          await ensureAsyncRefReady(editThemeRef, { requiredMethod: 'showTheme', timeoutMs: 2000 })
          editThemeRef.value?.showTheme()
        }
      })
    }

    if (store.getters.advancedPermissions(16)) {
      tmp.push({ 
        text: KT('usermenu.users'), 
        icon: 'fas fa-users', 
        cb: async () => {
          await ensureAsyncRefReady(editUsersRef, { requiredMethod: 'showUsers', timeoutMs: 2000 })
          editUsersRef.value?.showUsers()
        }
      })
    }

    if (store.getters.advancedPermissions(64)) {
      tmp.push({ text: KT('usermenu.computedAttributes'), icon: 'fas fa-calculator', cb: () => router.push('/computed') })
    }

    if (store.getters.isAdmin) {
      tmp.push({ 
        text: KT('usermenu.server'), 
        icon: 'fas fa-server', 
        cb: async () => {
          await ensureAsyncRefReady(editServerRef, { requiredMethod: 'showServer', timeoutMs: 2000 })
          editServerRef.value?.showServer()
        }
      })
    }

    if (store.getters.advancedPermissions(32)) {
      tmp.push({ 
        text: KT('usermenu.notifications'), 
        icon: 'fas fa-bell', 
        cb: async () => {
          await ensureAsyncRefReady(editNotificationsRef, { requiredMethod: 'showNotifications', timeoutMs: 2000 })
          editNotificationsRef.value?.showNotifications()
        }
      })
    }

    if (store.getters.advancedPermissions(80)) {
      tmp.push({ 
        text: KT('usermenu.drivers'), 
        icon: 'fas fa-id-card', 
        cb: async () => {
          await ensureAsyncRefReady(editDriversRef, { requiredMethod: 'showDrivers', timeoutMs: 2000 })
          editDriversRef.value?.showDrivers()
        }
      })
    }

    if (store.getters.advancedPermissions(88)) {
      tmp.push({ 
        text: KT('usermenu.calendars'), 
        icon: 'fas fa-calendar-alt', 
        cb: async () => {
          await ensureAsyncRefReady(editCalendarsRef, { requiredMethod: 'showCalendars', timeoutMs: 2000 })
          editCalendarsRef.value?.showCalendars()
        }
      })
    }

    if (store.getters.advancedPermissions(96)) {
      tmp.push({ 
        text: KT('usermenu.maintenance'), 
        icon: 'fas fa-tools', 
        cb: async () => {
          await ensureAsyncRefReady(editMaintenancesRef, { requiredMethod: 'showMaintenances', timeoutMs: 2000 })
          editMaintenancesRef.value?.showMaintenances()
        }
      })
    }
  }

  tmp.push({
    text: KT('usermenu.logout'),
    icon: 'fas fa-sign-out-alt',
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
      try { el.focus() } catch (error) {/* nada */}
    }
  }
})

/* ===========================
 *  ROUTER HOOKS
 * =========================== */
router.afterEach(() => {
  minimized.value = false
  // Não fecha sidebar automaticamente em desktop
  if (isPortrait()) {
    menuShown.value = false
  }
})

/* ===========================
 *  LIFECYCLE
 * =========================== */
onMounted(() => {
  applyViewportVars()
  window.addEventListener('resize', applyViewportVars)

  // Não fechar sidebar em desktop ao iniciar
  if (!isPortrait()) {
    sidebarClosed.value = false
  }

  window.localStorage.setItem('query', '')
  if (!window.localStorage.getItem('TKSESSIONTOKEN')) {
    const token = generateRandomToken()
    window.localStorage.setItem('TKSESSIONTOKEN', token)
  }

  // Event listeners
  window.addEventListener('openBlockModal', onOpenBlockModal)
  window.addEventListener('openUnlockModal', onOpenUnlockModal)
  window.addEventListener('openAnchorModal', onOpenAnchorModal)
  window.addEventListener('openDeleteModal', onOpenDeleteModal)

  window.addEventListener('online', updateConnectionStatus)
  window.addEventListener('offline', updateConnectionStatus)
  updateConnectionStatus()
})

onBeforeUnmount(() => {
  cleanupCurrentHandlers()
  window.removeEventListener('resize', applyViewportVars)
  window.removeEventListener('openBlockModal', onOpenBlockModal)
  window.removeEventListener('openUnlockModal', onOpenUnlockModal)
  window.removeEventListener('openAnchorModal', onOpenAnchorModal)
  window.removeEventListener('openDeleteModal', onOpenDeleteModal)
  document.removeEventListener('keydown', trapTabKeydown, true)

  blockDragging.value = false
  unlockDragging.value = false
  anchorDragging.value = false
  deleteDragging.value = false

  if (clickTimeout.value) {
    clearTimeout(clickTimeout.value)
    clickTimeout.value = null
  }

  window.removeEventListener('online', updateConnectionStatus)
  window.removeEventListener('offline', updateConnectionStatus)
})

/* ===========================
 *  PROVIDES
 * =========================== */
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
provide('act-anchor', actAnchor)
</script>

<style>
  /* ===== Base ===== */

  .showOnMobile {
    display: none;
  }

  .editing .leaflet-container {
    cursor: crosshair !important;
  }

  body.el-popup-parent--hidden {
    padding-right: 0 !important;
  }

  /* Deixe o body livre; o lock/deslock é feito via script quando um modal abre */
  html,
  body {
    height: 100%;
  }
  body {
    overflow: auto; /* liberado; script faz o lock quando preciso */
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
  }

  * {
    margin: 0;
    padding: 0;
  }

  #app {
    font-family: trebuchet ms, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji",
      "Segoe UI Emoji";
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: left;
    color: #2c3e50;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
  }

  #head {
    height: 2rem;
    overflow: hidden;
    border-bottom: var(--el-text-color-primary) 1px solid;
    background: var(--el-bg-color);
    display: flex;
    align-content: space-between;
    justify-content: space-between;
  }

  #head #user {
    display: flex;
  }

  #logo {
    padding: 0.5rem;
  }

  #content {
    display: flex;
    height: calc(var(--vh, 100vh) - 2rem);
  }

  /* ===== Sidebar / Versões ===== */

  :root {
    --sb-width: 78px;
  } /* largura padrão do menu */

  #menu {
    width: var(--sb-width);
    height: calc(var(--vh, 100vh) - 2rem);
    background: linear-gradient(180deg, var(--el-color-primary) 0%, #0a62c2 100%);
    position: relative;
    transition: all 0.3s;
    box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.08);
  }

  /* desktop: quando o app seta 'sidebarClosed' */
  #menu.sidebar-closed {
    width: 0 !important;
    overflow: hidden;
  }
  #menu.sidebar-closed #version {
    display: none;
  }

  /* badge de versão */
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
  }

  /* ===== Painel #open ===== */

  #open {
    height: calc(var(--vh, 100vh) - 2rem);
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
    background: #05a7e3;
    padding: 25px 5px;
    color: #fff;
    transform: translate(0, -50%);
    border-radius: 0 5px 5px 0;
    cursor: pointer;
  }
  #open.allowExpand .expandBtn:hover {
    filter: brightness(1.05);
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
    height: calc(var(--vh, 100vh) - 130px);
    padding: 7px;
  }

  #open.minimized {
    height: 35px !important;
  }

  /* ===== Scrollbar ===== */

  ::-webkit-scrollbar {
    width: 10px;
    height: 3px;
    background: #f5f5f5;
  }
  ::-webkit-scrollbar-thumb {
    width: 10px;
    height: 5px;
    background: #ccc;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--el-color-info);
  }
  /* Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: #ccc #f5f5f5;
  }

  /* ===== Menu (lista) — layout NOVO (ícone em cima, texto embaixo) ===== */

  #menu .indicator {
    display: none !important;
  } /* oculta indicador antigo */

  #menu ul {
    list-style: none;
    margin-top: 0.8rem;
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
    flex-direction: column; /* ícone em cima, texto embaixo */
    gap: 6px;
    width: 100%;
    height: auto;
    text-decoration: none !important;
  }

  /* Ícone em “pílula” */
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

  /* Paletas por item (ordem dos router-links) */
  #menu ul li:nth-child(1) a .el-icon {
    background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
  } /* Dispositivos */
  #menu ul li:nth-child(2) a .el-icon {
    background: linear-gradient(180deg, #a855f7 0%, #7c3aed 100%);
  } /* Relatórios */
  #menu ul li:nth-child(3) a .el-icon {
    background: linear-gradient(180deg, #fb923c 0%, #f97316 100%);
  } /* Geocerca */
  #menu ul li:nth-child(4) a .el-icon {
    background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%);
  } /* Comandos */
  #menu ul li:nth-child(5) a .el-icon {
    background: linear-gradient(180deg, #f472b6 0%, #db2777 100%);
  } /* Grupos */
  #menu ul li:nth-child(6) a .el-icon {
    background: linear-gradient(180deg, #34d399 0%, #10b981 100%);
  } /* Notificações */

  /* ===== Main (mapa) ===== */

  #main {
    width: calc(var(--vw, 100vw) - var(--sb-width));
    height: calc(var(--vh, 100vh) - 2rem);
    transition: all 0.3s;
  }

  /* quando sidebar fechado no desktop */
  #main.sidebar-closed {
    width: var(--vw, 100vw) !important;
  }

  /* minimizar */
  #main.minimized {
    height: calc(var(--vh, 100vh) - 50px) !important;
  }

  /* ===== Heading do painel ===== */

  #heading {
    text-align: center;
    font-weight: bold;
    background: var(--el-color-primary);
    border-radius: 20px;
    padding: 10px;
    color: var(--el-color-white);
    position: relative;
    z-index: 0;
    margin: 10px;
  }
  #heading span:first-child,
  #heading span:last-child {
    position: absolute;
    top: 0;
    padding: 6px;
    font-size: 25px;
    cursor: pointer;
  }
  #heading span:first-child {
    left: 0;
  }
  #heading span:last-child {
    right: 0;
  }

  /* ===== RTL ===== */

  body.rtl #app div #content {
    flex-direction: row-reverse !important;
  }

  /* ===== Notificações (temas) ===== */

  .notification-soft-red {
    --el-color-white:#ffdddd!important;
    --el-notification-icon-color:#181818!important;
    --el-notification-content-color:#181818!important;
  }
  .notification-soft-red .el-icon {
    color: #181818 !important;
  }

  .notification-red {
    --el-color-white:#f44336!important;
    --el-notification-icon-color:#fff!important;
    --el-notification-title-color:#fff!important;
  }
  .notification-red .el-icon {
    color: #fff !important;
  }

  .notification-soft-yellow {
    --el-color-white:#ffffcc!important;
    --el-notification-icon-color:#181818!important;
    --el-notification-title-color:#181818!important;
  }
  .notification-soft-yellow .el-icon {
    color: #181818 !important;
  }

  .notification-yellow {
    --el-color-white:#ffeb3b!important;
    --el-notification-icon-color:#181818!important;
    --el-notification-title-color:#181818!important;
  }
  .notification-yellow .el-icon {
    color: #181818 !important;
  }

  .notification-soft-green {
    --el-color-white:#ddffdd!important;
    --el-notification-icon-color:#181818!important;
    --el-notification-title-color:#181818!important;
  }
  .notification-soft-green .el-icon {
    color: #181818 !important;
  }

  .notification-green {
    --el-color-white:#4CAF50!important;
    --el-notification-icon-color:#fff!important;
    --el-notification-title-color:#fff!important;
  }
  .notification-green .el-icon {
    color: #fff !important;
  }

  .notification-soft-info {
    --el-color-white:#ddffff!important;
    --el-notification-icon-color:#181818!important;
    --el-notification-title-color:#181818!important;
  }
  .notification-soft-info .el-icon {
    color: #181818 !important;
  }

  .notification-info {
    --el-color-white:#2196F3!important;
    --el-notification-icon-color:#fff!important;
    --el-notification-title-color:#fff!important;
  }
  .notification-info .el-icon {
    color: #fff !important;
  }

  .el-notification__content {
    background: #fff !important;
    color: #000 !important;
    padding: 5px;
    border-radius: 5px;
    min-width: 255px;
  }

  /* ===== Filtros rápidos ===== */

  .customFilter {
    margin-left: 1px;
    padding: 10px;
    background: #fff;
    text-align: center;
    margin-bottom: 4px;
    border-radius: 4px;
    color: #fff;
    box-shadow: 0 0 3px rgba(45, 45, 45, 0.5);
    cursor: pointer;
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
    border: #fff 1px solid;
  }

  /* ===== Botões topo / expansor ===== */

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

  /* ===== Form em Element-Plus (compacto) ===== */

  .el-form-item {
    margin-bottom: 5px !important;
    padding: 0 !important;
  }
  .el-form-item__label {
    height: 20px !important;
    padding: 2px 0 0 0 !important;
    line-height: 20px !important;
  }

  /* ===== Dialog/Modal Improvements ===== */
  .el-dialog {
    border-radius: 12px !important;
    overflow: hidden;
  }

  .el-dialog__header {
    padding: 20px 20px 15px !important;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    position: relative;
  }

  .el-dialog__title {
    color: white !important;
    font-size: 18px !important;
    font-weight: 600 !important;
  }

  /* Botão X mais visível e funcional */
  .el-dialog__headerbtn {
    top: 20px !important;
    right: 20px !important;
    width: 32px !important;
    height: 32px !important;
    background: rgba(255, 255, 255, 0.2) !important;
    border-radius: 50% !important;
    transition: all 0.3s ease !important;
    z-index: 10 !important;
  }

  .el-dialog__headerbtn:hover {
    background: rgba(255, 255, 255, 0.3) !important;
    transform: rotate(90deg) !important;
  }

  .el-dialog__headerbtn .el-dialog__close {
    color: white !important;
    font-size: 18px !important;
    font-weight: 600 !important;
  }

  /* Corpo do dialog com mais espaçamento */
  .el-dialog__body {
    padding: 25px 25px 20px !important;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
  }

  /* Tabs com espaçamento adequado */
  .el-tabs {
    margin-top: 0 !important;
  }

  .el-tabs__header {
    margin-bottom: 20px !important;
    padding: 0 !important;
  }

  .el-tabs__nav-wrap {
    padding: 0 !important;
    margin-bottom: 15px !important;
  }

  .el-tabs__item {
    padding: 10px 20px !important;
    height: 42px !important;
    line-height: 42px !important;
    font-weight: 500 !important;
    transition: all 0.3s ease !important;
  }

  .el-tabs__item:hover {
    color: var(--el-color-primary) !important;
    background: rgba(64, 158, 255, 0.05);
    border-radius: 8px 8px 0 0;
  }

  .el-tabs__item.is-active {
    font-weight: 600 !important;
    background: rgba(64, 158, 255, 0.1);
    border-radius: 8px 8px 0 0;
  }

  .el-tabs__active-bar {
    height: 3px !important;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%) !important;
  }

  .el-tabs__content {
    padding: 0 !important;
  }

  /* Form items com melhor espaçamento */
  .el-form-item {
    margin-bottom: 18px !important;
  }

  .el-form-item__label {
    padding-bottom: 6px !important;
    font-weight: 500 !important;
    color: #606266 !important;
  }

  /* Inputs e selects mais espaçosos */
  .el-input__inner,
  .el-select .el-input__inner,
  .el-textarea__inner {
    padding: 8px 12px !important;
    height: 40px !important;
    border-radius: 8px !important;
  }

  .el-select {
    width: 100% !important;
  }

  /* Switch melhorado */
  .el-switch {
    height: 24px !important;
  }

  .el-switch__core {
    height: 24px !important;
    border-radius: 12px !important;
  }

  /* Footer do dialog */
  .el-dialog__footer {
    padding: 15px 25px 20px !important;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
  }

  /* Botões no footer */
  .el-dialog__footer .el-button {
    min-width: 100px !important;
    height: 40px !important;
    border-radius: 8px !important;
    font-weight: 500 !important;
  }

  .el-dialog__footer .el-button--primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    border: none !important;
  }

  .el-dialog__footer .el-button--default {
    background: white !important;
    border: 1px solid #dcdfe6 !important;
  }

  /* Grid de 2 colunas para formulários */
  .el-form .el-row {
    margin: 0 -10px !important;
  }

  .el-form .el-col {
    padding: 0 10px !important;
  }

  /* Scrollbar customizada para dialogs */
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

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .el-dialog {
      width: 95% !important;
      margin: 10px auto !important;
    }
    
    .el-dialog__body {
      padding: 20px 15px !important;
      max-height: calc(100vh - 180px) !important;
    }
    
    .el-tabs__item {
      padding: 8px 12px !important;
      font-size: 14px !important;
    }
    
    .el-form .el-col-24 {
      padding: 0 5px !important;
    }
  }

  /* Estado del dispositivo - melhor visual */
  .el-form-item__content .el-switch__label {
    font-weight: 500 !important;
    margin-left: 10px !important;
  }

  .el-switch.is-checked .el-switch__core {
    background: linear-gradient(135deg, #34d399 0%, #10b981 100%) !important;
    border-color: #10b981 !important;
  }
</style>
