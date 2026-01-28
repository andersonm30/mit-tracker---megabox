<template>
  <edit-user ref="editUserRef"></edit-user>
  <link-objects ref="linkObjectsRef" @objects-changed="handleObjectsChanged"></link-objects>
  <log-objects ref="logObjectsRef"></log-objects>
  <el-dialog 
    :lock-scroll="true" 
    v-model="show" 
    custom-class="users-dialog"
    :width="dialogWidth">
    
    <template v-slot:header>
      <div class="modal-header-full">
        <i class="fas fa-users header-icon"></i>
        <div class="header-title">{{ KT('user.users') }}</div>
      </div>
    </template>
    
    <template v-slot:footer>
      <div class="modal-footer">

        <el-button
            v-if="store.getters.advancedPermissions(19)"
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('user.remove'))"
            type="danger" :plain="selected===0" @click="doDelete()">
          <i class="fas fa-user-minus"></i>
        </el-button>

        <el-button
            v-if="store.getters.advancedPermissions(18)"
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('user.edit'))"
            type="warning" :plain="selected===0"  @click="editUserRef?.editUser(selected);">
          <i class="fas fa-user-edit"></i>
        </el-button>

        <el-button
            v-if="store.state.server.isPlus && store.state.auth.administrator"
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('user.logs'))"
            plain :disabled="selected===0" @click="logObjectsRef?.showLogs({userId: selected});">
          <i class="fas fa-clipboard-list"></i>
        </el-button>

        <div style="margin-left: 5px; margin-right: 5px;" :set="user = store.getters['users/getUser'](selected)">
          <el-button
              v-if="store.getters.advancedPermissions(16) && store.getters.advancedPermissions(18)"
              @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('user.users'))"
              plain :disabled="selected===0 || !(user && (user.userLimit===-1 || user.userLimit>0))" @click="handleRelationButtonClick('users');">
            <i class="fas fa-users"></i>
          </el-button>
        </div>

        <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(8)"
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('device.devices'))"
            plain :disabled="selected===0"  @click="handleRelationButtonClick('devices');">
          <i class="fas fa-car"></i>
        </el-button>

        <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(40)"
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('geofence.geofences'))"
            plain :disabled="selected===0"  @click="handleRelationButtonClick('geofences');">
          <i class="fas fa-draw-polygon"></i>
        </el-button>

        <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(48)"
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('group.groups'))"
            plain :disabled="selected===0" @click="handleRelationButtonClick('groups');">
          <i class="far fa-object-group"></i>
        </el-button>

        <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(32)"
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('notification.notifications'))"
            plain :disabled="selected===0" @click="handleRelationButtonClick('notifications');">
          <i class="far fa-envelope"></i>
        </el-button>

        <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(88)"
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('calendar.calendars'))"
            plain :disabled="selected===0" @click="handleRelationButtonClick('calendars');">
          <i class="far fa-calendar-alt"></i>
        </el-button>

        <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(64)"
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('attribute.computedAttributes'))"
            plain :disabled="selected===0" @click="handleRelationButtonClick('attributes');">
          <i class="fas fa-server"></i>
        </el-button>

        <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(80)"
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('driver.drivers'))"
            plain :disabled="selected===0" @click="handleRelationButtonClick('drivers');">
          <i class="fas fa-user-tag"></i>
        </el-button>

        <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(56)"
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('command.savedCommands'))"
            plain :disabled="selected===0" @click="handleRelationButtonClick('commands');">
          <i class="far fa-keyboard"></i>
        </el-button>

        <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(96)"
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('maintenance.maintenance'))"
            plain :disabled="selected===0" @click="handleRelationButtonClick('maintence');">
          <i class="fas fa-tools"></i>
        </el-button>

        <el-button
             v-if="store.state.auth.administrator || (store.getters.advancedPermissions(16) && store.getters.advancedPermissions(18))"
            @mouseleave="hideTip"
            @mouseenter.stop="showTip($event, KT('user.changesesion'))"
            type="success"
            plain
            :disabled="selected === 0"
            @click="createSession">
          <i class="fas fa-passport"></i>
        </el-button>

        <!-- Botones PDF y Excel en el footer -->
        <el-button 
          @click="generatePdf" 
          type="info"
          plain
          :loading="isGeneratingPDF"
          :disabled="isGeneratingPDF || filteredUsers.length === 0"
          @mouseenter.stop="showTip($event,KT('user.generatePDF'))"
          @mouseleave="hideTip">
          <i v-if="!isGeneratingPDF" class="fas fa-file-pdf"></i>
          <i v-else class="fas fa-spinner fa-spin"></i>
        </el-button>
        
        <el-button 
          @click="generateExcel" 
          type="info"
          plain
          :disabled="filteredUsers.length === 0"
          @mouseenter.stop="showTip($event,KT('user.generateExcel'))"
          @mouseleave="hideTip">
          <i class="fas fa-file-excel"></i>
        </el-button>

        <!-- Botones de importación de usuarios -->
        <el-button 
          @click="canImportUsers() ? openImportModal() : showUserLimitExceeded()"
          type="success"
          :disabled="!canImportUsers()"
          @mouseenter.stop="showTip($event,KT('user.importUsers'))"
          @mouseleave="hideTip">
          <i class="fas fa-upload"></i>
        </el-button>

        <el-button 
          @click="downloadTemplate"
          type="info"
          @mouseenter.stop="showTip($event,'Descargar Plantilla Excel')"
          @mouseleave="hideTip">
          <i class="fas fa-download"></i>
        </el-button>

      </div>
    </template>

    <!-- Card de estadísticas moderno -->
    <div class="users-stats-card" style="margin-top: 20px;">
      <div class="users-stat-item clickable" @click="filterBy('all')" :class="{ active: selectedFilter === 'all' }">
        <i class="fas fa-users stat-icon"></i>
        <span class="stat-number">{{ totalUsers }}</span>
        <span class="stat-label">{{ KT('total') }}</span>
      </div>
      <div class="users-stat-item clickable" @click="filterBy('admin')" :class="{ active: selectedFilter === 'admin' }">
        <i class="fas fa-user-shield stat-icon admin"></i>
        <span class="stat-number">{{ adminCount }}</span>
        <span class="stat-label">{{ KT('user.admins') }}</span>
      </div>
      <div class="users-stat-item clickable" @click="filterBy('suspended')" :class="{ active: selectedFilter === 'suspended' }">
        <i class="fas fa-user-lock stat-icon suspended"></i>
        <span class="stat-number">{{ suspendedCount }}</span>
        <span class="stat-label">{{ KT('user.suspended') }}</span>
      </div>
      <div class="users-stat-item clickable" @click="filterBy('debtors')" :class="{ active: selectedFilter === 'debtors' }">
        <i class="fas fa-exclamation-triangle stat-icon debtors"></i>
        <span class="stat-number">{{ debtorsCount }}</span>
        <span class="stat-label">{{ KT('user.debtors') }}</span>
      </div>
    </div>

    <!-- Búsqueda con botón Add -->
    <div class="search-container">
      <el-input 
        v-model="query" 
        :placeholder="KT('user.search')" 
        class="modern-input"
        clearable>
        <template #prefix>
          <i class="fas fa-search"></i>
        </template>
      </el-input>
      
      <el-button 
          v-if="store.getters.advancedPermissions(17)"
          type="primary" 
          @click="editUserRef?.newUser()"
          class="add-user-btn">
        <i class="fas fa-user-plus"></i>
        {{ KT('user.add') }}
      </el-button>
    </div>

    <!-- Header de tabla -->
    <div class="table-header">
      <div class="header-cell id-column clickable" @click="toggleSorting('id')">
        {{ KT('user.id') }}
        <i class="fas fa-sort" v-if="sorting !== 'id-asc' && sorting !== 'id-desc'"></i>
        <i class="fas fa-sort-numeric-up" v-if="sorting === 'id-asc'"></i>
        <i class="fas fa-sort-numeric-down" v-if="sorting === 'id-desc'"></i>
      </div>
      <div class="header-cell name-column clickable" @click="toggleSorting('name')">
        {{ KT('user.name') }}
        <i class="fas fa-sort" v-if="sorting !== 'name-asc' && sorting !== 'name-desc'"></i>
        <i class="fas fa-sort-alpha-up" v-if="sorting === 'name-asc'"></i>
        <i class="fas fa-sort-alpha-down" v-if="sorting === 'name-desc'"></i>
      </div>
      <div class="header-cell email-column clickable" @click="toggleSorting('email')">
        {{ KT('user.email') }}
        <i class="fas fa-sort" v-if="sorting !== 'email-asc' && sorting !== 'email-desc'"></i>
        <i class="fas fa-sort-alpha-up" v-if="sorting === 'email-asc'"></i>
        <i class="fas fa-sort-alpha-down" v-if="sorting === 'email-desc'"></i>
      </div>
      <div class="header-cell device-count-column clickable" @click="toggleSorting('deviceCount')">
        <span class="desktop-text">{{ KT('device.devices') }}</span>
        <i class="fas fa-car tablet-icon"></i>
        <i class="fas fa-sort" v-if="sorting !== 'deviceCount-asc' && sorting !== 'deviceCount-desc'"></i>
        <i class="fas fa-sort-numeric-up" v-if="sorting === 'deviceCount-asc'"></i>
        <i class="fas fa-sort-numeric-down" v-if="sorting === 'deviceCount-desc'"></i>
      </div>
      <div class="header-cell user-count-column clickable" @click="toggleSorting('userCount')">
        <span class="desktop-text">{{ KT('user.users') }}</span>
        <i class="fas fa-users tablet-icon"></i>
        <i class="fas fa-sort" v-if="sorting !== 'userCount-asc' && sorting !== 'userCount-desc'"></i>
        <i class="fas fa-sort-numeric-up" v-if="sorting === 'userCount-asc'"></i>
        <i class="fas fa-sort-numeric-down" v-if="sorting === 'userCount-desc'"></i>
      </div>
      <div class="header-cell pending-count-column clickable" @click="toggleSorting('pendingCount')" v-if="showBillingColumns">
        {{ KT('invoice.pendingCount') }}
        <i class="fas fa-sort" v-if="sorting !== 'pendingCount-asc' && sorting !== 'pendingCount-desc'"></i>
        <i class="fas fa-sort-numeric-up" v-if="sorting === 'pendingCount-asc'"></i>
        <i class="fas fa-sort-numeric-down" v-if="sorting === 'pendingCount-desc'"></i>
      </div>
      <div class="header-cell pending-balance-column clickable" @click="toggleSorting('pendingBalance')" v-if="showBillingColumns">
        {{ KT('invoice.pendingBalance') }}
        <i class="fas fa-sort" v-if="sorting !== 'pendingBalance-asc' && sorting !== 'pendingBalance-desc'"></i>
        <i class="fas fa-sort-numeric-up" v-if="sorting === 'pendingBalance-asc'"></i>
        <i class="fas fa-sort-numeric-down" v-if="sorting === 'pendingBalance-desc'"></i>
      </div>
      <div class="header-cell due-date-column clickable" @click="toggleSorting('lastDueDate')" v-if="showBillingColumns">
        {{ KT('invoice.lastDueDate') }}
        <i class="fas fa-sort" v-if="sorting !== 'lastDueDate-asc' && sorting !== 'lastDueDate-desc'"></i>
        <i class="fas fa-sort-alpha-up" v-if="sorting === 'lastDueDate-asc'"></i>
        <i class="fas fa-sort-alpha-down" v-if="sorting === 'lastDueDate-desc'"></i>
      </div>
      <div class="header-cell admin-column clickable" @click="toggleSorting('administrator')">
        {{ KT('user.admin') }}
        <i class="fas fa-sort" v-if="sorting !== 'administrator-asc' && sorting !== 'administrator-desc'"></i>
        <i class="fas fa-sort-up" v-if="sorting === 'administrator-asc'"></i>
        <i class="fas fa-sort-down" v-if="sorting === 'administrator-desc'"></i>
      </div>
      <div class="header-cell disabled-column clickable" @click="toggleSorting('disabled')">
        {{ KT('user.disabled') }}
        <i class="fas fa-sort" v-if="sorting !== 'disabled-asc' && sorting !== 'disabled-desc'"></i>
        <i class="fas fa-sort-up" v-if="sorting === 'disabled-asc'"></i>
        <i class="fas fa-sort-down" v-if="sorting === 'disabled-desc'"></i>
      </div>
      <div class="header-cell actions-column">
        {{ KT('actions') }}
      </div>
    </div>

    <!-- Lista de usuarios moderna -->
    <div class="users-list">
      <template v-for="(user, index) in filteredUsers" :key="user.id">
        <div 
          class="user-item" 
          @click="selected = (selected !== user.id) ? user.id : 0" 
          @dblclick="editUserRef?.editUser(user.id)"
          :class="{ 
            selected: selected === user.id, 
            even: index % 2 === 0,
            'with-billing': showBillingColumns 
          }">
          
          <!-- ID del usuario -->
          <div class="id-cell">{{ user.id }}</div>
          
          <!-- Nombre del usuario -->
          <div class="name-cell">{{ user.name || 'Sin nombre' }}</div>
          
          <!-- Email del usuario -->
          <div class="email-cell">{{ user.email || 'Sin email' }}</div>
          
          <!-- Dispositivos relacionados -->
          <div class="device-count-cell clickable-cell device-cell" @click.stop="showDevicesModal(user.id)" @dblclick.stop="refreshUserCounts(user.id)">
            <i class="fas fa-car"></i>
            <span class="count-text">{{ getUserDeviceCount(user.id) }}</span>
          </div>
          
          <!-- Usuarios relacionados -->
          <div class="user-count-cell clickable-cell user-cell" @click.stop="showUsersModal(user.id)" @dblclick.stop="refreshUserCounts(user.id)">
            <i class="fas fa-users"></i>
            <span class="count-text">{{ getUserUserCount(user.id) }}</span>
          </div>

          <!-- Columnas de facturación condicionales -->
          <div class="pending-count-cell" v-if="showBillingColumns">{{ getPendingInvoices(user.id) }}</div>
          
          <!-- Saldo pendiente -->
          <div class="pending-balance-cell" v-if="showBillingColumns">{{ formatCurrency(getPendingBalance(user.id)) }}</div>
          
          <!-- Fecha de vencimiento -->
          <div class="due-date-cell" v-if="showBillingColumns">{{ getLastDueDate(user.id) }}</div>
          
          <!-- Admin -->
          <div class="admin-cell">
            <el-tag v-if="user.administrator" type="danger" size="small">
              <i class="fas fa-crown"></i> Admin
            </el-tag>
          </div>
          
          <!-- Estado (deshabilitado) -->
          <div class="disabled-cell">
            <el-tag :type="user.disabled ? 'danger' : 'success'" size="small">
              {{ user.disabled ? KT('user.suspended') : KT('user.active') }}
            </el-tag>
          </div>
          
          <!-- Acciones expandibles -->
          <div class="actions-cell">
            <div class="actions-buttons">
              <el-button 
                size="small" 
                type="primary" 
                @click.stop="toggleUserExpansion(user.id, 'devices')"
                :loading="loadingExpanded[`${user.id}-devices`]"
                class="action-btn">
                <i class="fas fa-car"></i>
                Auto
              </el-button>
              <el-button 
                size="small" 
                type="success" 
                @click.stop="toggleUserExpansion(user.id, 'users')"
                :loading="loadingExpanded[`${user.id}-users`]"
                class="action-btn">
                <i class="fas fa-users"></i>
                Usuario
              </el-button>
            </div>
          </div>
        </div>
        
        <!-- Fila expandida (dentro del template v-for) -->
        <div v-if="isRowExpanded(user.id)" class="expanded-row" :key="`expanded-${user.id}`">
          <div class="expanded-content">
            <div class="expanded-header">
              <i :class="getExpandedIcon(user.id)" class="expanded-icon"></i>
              <span class="expanded-title">{{ getExpandedTitle(user.id) }}</span>
              <el-button 
                size="small" 
                type="primary"
                @click="generateExpandedPDF(user.id)"
                class="pdf-btn"
                :loading="generatingPDF[user.id]"
                :disabled="!expandedData[user.id] || expandedData[user.id].length === 0">
                <i v-if="!generatingPDF[user.id]" class="fas fa-file-pdf"></i>
                <i v-else class="fas fa-spinner fa-spin"></i>
              </el-button>
              <el-button 
                size="small" 
                text 
                @click="closeExpansion(user.id)"
                class="close-btn">
                <i class="fas fa-times"></i>
              </el-button>
            </div>
            <div class="expanded-list">
              <div v-if="!expandedData[user.id] || expandedData[user.id].length === 0" class="no-data">
                <i class="fas fa-info-circle" style="margin-right: 8px; color: #6b7280;"></i>
                <span v-if="isDeviceExpansion(user.id)">Este usuário não possui dispositivos atribuídos</span>
                <span v-else>Este usuário não possui usuários subordinados</span>
              </div>
              <div v-else>
                <div 
                  v-for="item in expandedData[user.id]" 
                  :key="item.id" 
                  class="expanded-item">
                  <div class="item-main">
                    <div class="item-header">
                      <div class="item-id">#{{ item.id }}</div>
                      <div class="item-name-fixed">{{ item.name || 'Sem nome' }}</div>
                      <!-- Datos para dispositivos -->
                      <div v-if="isDeviceExpansion(user.id)" class="item-details-inline">
                        <span v-if="item.attributes && item.attributes['device.state']"><strong>{{KT('device.state')}}:</strong> {{ KT('device.state_' + item.attributes['device.state']) }}</span>
                        <span v-if="item.attributes && item.attributes['device.gpsBrand']">| <strong>{{KT('device.brand')}}:</strong> {{ item.attributes['device.gpsBrand'] }}</span>
                        <span v-if="item.attributes && item.attributes['device.model']">| <strong>{{KT('device.model')}}:</strong> {{ item.attributes['device.model'] }}</span>
                        <span v-if="item.uniqueId">| <strong>IMEI:</strong> {{ item.uniqueId }}</span>
                        <span v-if="item.attributes && item.attributes.placa">| <strong>{{KT('device.plate')}}:</strong> {{ item.attributes.placa }}</span>
                        <span v-if="item.attributes && item.attributes['device.protocol']">| <strong>{{KT('device.protocol')}}:</strong> {{ item.attributes['device.protocol'] }}</span>
                        <span v-if="item.attributes && item.attributes['device.technology']">| <strong>{{KT('device.technology')}}:</strong> {{ item.attributes['device.technology'] }}</span>
                        <span v-if="item.attributes && item.attributes.color">| <strong>{{KT('device.color')}}:</strong> {{ item.attributes.color }}</span>
                        <span v-if="item.status">| <strong>{{KT('device.status')}}:</strong> <span :class="getStatusClass(item.status)">{{ KT('device.status_' + item.status) }}</span></span>
                        <span v-if="item.lastUpdate">| <strong>{{KT('device.lastUpdate')}}:</strong> {{ formatDate(item.lastUpdate) }}</span>
                      </div>
                      
                      <!-- Datos para usuarios -->
                      <div v-else class="item-details-inline">
                        <span v-if="item.email"><strong>{{KT('email')}}:</strong> {{ item.email }}</span>
                        <span v-if="item.phone">| <strong>{{KT('phone')}}:</strong> {{ item.phone }}</span>
                        <span v-if="item.administrator !== undefined">| <strong>{{KT('administrator')}}:</strong> {{ item.administrator ? KT('yes') : KT('no') }}</span>
                        <span v-if="item.disabled !== undefined">| <strong>{{KT('disabled')}}:</strong> {{ item.disabled ? KT('yes') : KT('no') }}</span>
                        <span v-if="item.expirationTime">| <strong>{{KT('expirationTime')}}:</strong> {{ formatDate(item.expirationTime) }}</span>
                        <span v-if="item.deviceLimit !== undefined && item.deviceLimit !== -1">| <strong>{{KT('deviceLimit')}}:</strong> {{ item.deviceLimit }}</span>
                        <span v-if="item.userLimit !== undefined && item.userLimit !== -1">| <strong>{{KT('userLimit')}}:</strong> {{ item.userLimit }}</span>
                        <span v-if="item.attributes && item.attributes.company">| <strong>{{KT('company')}}:</strong> {{ item.attributes.company }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Vista móvil de tarjetas (oculta por defecto) -->
    <div class="mobile-users-list">
      <div 
        class="mobile-user-card" 
        v-for="user in filteredUsers" 
        :key="user.id"
        @click="selected = (selected !== user.id) ? user.id : 0"
        @dblclick="editUserRef?.editUser(user.id)"
        :class="{ selected: selected === user.id }">
        
        <div class="mobile-user-header">
          <div class="mobile-user-name">{{ user.name || 'Sin nombre' }}</div>
          <div class="mobile-user-id">ID: {{ user.id }}</div>
        </div>
        
        <div class="mobile-user-info">
          <div class="mobile-info-item" @click.stop="showDevicesModal(user.id)" @dblclick.stop="refreshUserCounts(user.id)">
            <i class="fas fa-car mobile-info-icon"></i>
            <span>{{ getUserDeviceCount(user.id) }} dispositivos</span>
          </div>
          
          <div class="mobile-info-item" @click.stop="showUsersModal(user.id)" @dblclick.stop="refreshUserCounts(user.id)">
            <i class="fas fa-users mobile-info-icon"></i>
            <span>{{ getUserUserCount(user.id) }} usuarios</span>
          </div>
          
          <div class="mobile-info-item" v-if="user.email">
            <i class="fas fa-envelope mobile-info-icon"></i>
            <span>{{ user.email }}</span>
          </div>
          
          <div class="mobile-info-item">
            <i class="fas fa-phone mobile-info-icon"></i>
            <span>{{ user.phone || 'Sin teléfono' }}</span>
          </div>
        </div>
        
        <div class="mobile-user-status">
          <el-tag v-if="user.administrator" type="danger" size="small">
            <i class="fas fa-crown"></i> Admin
          </el-tag>
          <el-tag :type="user.disabled ? 'danger' : 'success'" size="small">
            {{ user.disabled ? KT('user.suspended') : KT('user.active') }}
          </el-tag>
        </div>
        
        <div class="mobile-billing-info" v-if="showBillingColumns">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Facturas pendientes:</span>
            <strong>{{ getPendingInvoices(user.id) }}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Saldo pendiente:</span>
            <strong>{{ formatCurrency(getPendingBalance(user.id)) }}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;" v-if="getLastDueDate(user.id) !== '-'">
            <span>Último vencimiento:</span>
            <strong>{{ getLastDueDate(user.id) }}</strong>
          </div>
        </div>
      </div>
    </div>

  </el-dialog>

  <!-- Modal de importación de usuarios -->
  <el-dialog 
    :lock-scroll="true" 
    v-model="showImportModal" 
    width="90%" 
    :close-on-click-modal="false"
    destroy-on-close
  >
    <template v-slot:header>
      <div style="border-bottom: #e0e0e0 1px solid; padding: 20px;">
        <div class="modal-title">
          <i class="fas fa-users"></i> {{KT('user.importUsers')}}
        </div>
      </div>
    </template>

    <div class="import-container">
      <!-- Indicador de pasos -->
      <div class="steps-indicator">
        <div class="step-item" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
          <div class="step-number">1</div>
          <div class="step-title">{{KT('user.selectFile')}}</div>
        </div>
        <div class="step-line" :class="{ completed: currentStep > 1 }"></div>
        <div class="step-item" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
          <div class="step-number">2</div>
          <div class="step-title">{{KT('user.previewAndMapping')}}</div>
        </div>
        <div class="step-line" :class="{ completed: currentStep > 2 }"></div>
        <div class="step-item" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
          <div class="step-number">3</div>
          <div class="step-title">{{KT('user.importing')}}</div>
        </div>
        <div class="step-line" :class="{ completed: currentStep > 3 }"></div>
        <div class="step-item" :class="{ active: currentStep >= 4, completed: currentStep > 4 }">
          <div class="step-number">4</div>
          <div class="step-title">{{KT('user.importComplete')}}</div>
        </div>
      </div>
      
      <!-- Paso 1: Selección de archivo -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="step-header">
          <h3>{{KT('user.selectExcelFile')}}</h3>
          <p>{{KT('user.selectExcelDescription')}}</p>
        </div>

        <div class="file-upload-area" 
             @drop="handleDrop" 
             @dragover.prevent 
             @dragenter.prevent
             @click="$refs.fileInput.click()">
          <div class="upload-content">
            <i class="fas fa-cloud-upload-alt upload-icon"></i>
            <p class="upload-text">{{KT('user.dragDropFile')}}</p>
            <p class="upload-subtext">{{KT('user.orClickToSelect')}}</p>
            <el-button type="primary" size="small">{{KT('user.selectFile')}}</el-button>
          </div>
          <input 
            ref="fileInput" 
            type="file" 
            accept=".xlsx,.xls" 
            @change="handleFileSelect" 
            style="display: none;">
        </div>

        <div v-if="selectedFile" class="file-info">
          <div class="file-details">
            <i class="fas fa-file-excel file-icon"></i>
            <div>
              <div class="file-name">{{ selectedFile.name }}</div>
              <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
            </div>
          </div>
        </div>

        <div class="template-section">
          <hr style="margin: 30px 0;">
          <p style="text-align: center; margin-bottom: 15px;">{{KT('user.orDownloadTemplate')}}</p>
          <div style="text-align: center;">
            <el-button @click="downloadTemplate" type="success" plain>
              <i class="fas fa-download"></i> {{KT('user.downloadTemplate')}}
            </el-button>
          </div>
        </div>
      </div>

      <!-- Paso 2: Vista previa y mapeo -->
      <div v-if="currentStep === 2" class="step-content">
        <div class="step-header">
          <h3>{{KT('user.previewAndMapping')}}</h3>
          <p>{{KT('user.previewDescription')}}</p>
        </div>

        <div class="preview-stats">
          <div class="stat-box">
            <span class="stat-label">{{KT('user.totalRows')}}</span>
            <span class="stat-value">{{ previewData.length }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">{{KT('user.validRows')}}</span>
            <span class="stat-value valid">{{ validRows }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">{{KT('user.errorRows')}}</span>
            <span class="stat-value error">{{ previewData.length - validRows }}</span>
          </div>
        </div>

        <div class="table-container">
          <table class="preview-table">
            <thead>
              <tr>
                <th v-for="(column, index) in excelColumns" :key="index">
                  {{ column }}
                </th>
                <th>Errores</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in previewData.slice(0, 50)" :key="index">
                <td v-for="(column, colIndex) in excelColumns" :key="colIndex"
                    :class="{'error-cell': hasRowError(row, column)}">
                  {{ row[column] }}
                </td>
                <td>
                  <div v-if="row.__errors && row.__errors.length > 0" class="error-list">
                    <span v-for="error in row.__errors" :key="error" class="error-tag">
                      {{ error }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="previewData.length > 50" class="preview-note">
          <div class="alert-info">
            <i class="fas fa-info-circle"></i>
            {{KT('user.showingFirst50Rows')}} {{ previewData.length }}
          </div>
        </div>
      </div>

      <!-- Paso 3: Importación en progreso -->
      <div v-if="currentStep === 3" class="step-content">
        <div class="step-header">
          <h3>{{KT('user.importing')}}</h3>
          <p>{{KT('user.importingDescription')}}</p>
        </div>

        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{width: importProgress + '%'}"></div>
            <span class="progress-text">{{ importProgress }}%</span>
          </div>
          
          <div class="progress-stats">
            <div class="stat">
              <span class="label">{{KT('user.processed')}}:</span>
              <span class="value">{{ processedCount }} / {{ totalToImport }}</span>
            </div>
            <div class="stat">
              <span class="label">{{KT('user.successful')}}:</span>
              <span class="value success">{{ successCount }}</span>
            </div>
            <div class="stat">
              <span class="label">{{KT('user.errors')}}:</span>
              <span class="value error">{{ errorCount }}</span>
            </div>
          </div>

          <div class="current-device" v-if="currentProcessingUser">
            <span class="processing-tag">{{KT('user.processing')}}: {{ currentProcessingUser }}</span>
          </div>
        </div>

        <div class="import-log" v-if="importLog.length > 0">
          <h4>{{KT('user.importLog')}}</h4>
          <div class="log-container">
            <div 
              v-for="(log, index) in importLog.slice(-10)" 
              :key="index"
              :class="['log-entry', log.type]">
              <i :class="log.type === 'success' ? 'fas fa-check' : 'fas fa-times'"></i>
              {{ log.message }}
            </div>
          </div>
        </div>
      </div>

      <!-- Paso 4: Resultado final -->
      <div v-if="currentStep === 4" class="step-content">
        <div class="step-header">
          <h3>{{KT('user.importComplete')}}</h3>
        </div>

        <div class="result-summary">
          <div class="result-icon">
            <i :class="successCount > 0 ? 'fas fa-check-circle success' : 'fas fa-times-circle error'"></i>
          </div>
          <h2>{{ getResultTitle() }}</h2>
          <p>{{ getResultSubtitle() }}</p>

          <div class="final-stats">
            <div class="stat-box">
              <span class="stat-label">{{KT('user.totalProcessed')}}</span>
              <span class="stat-value">{{ processedCount }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">{{KT('user.successful')}}</span>
              <span class="stat-value success">{{ successCount }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">{{KT('user.errors')}}</span>
              <span class="stat-value error">{{ errorCount }}</span>
            </div>
          </div>
        </div>

        <div v-if="errorLog.length > 0" class="error-details">
          <h4>{{KT('user.errorDetails')}}</h4>
          <table class="error-table">
            <thead>
              <tr>
                <th>{{KT('user.row')}}</th>
                <th>{{KT('user.name')}}</th>
                <th>{{KT('user.error')}}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="error in errorLog" :key="error.row">
                <td>{{ error.row }}</td>
                <td>{{ error.user }}</td>
                <td>{{ error.error }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <template v-slot:footer>
      <div style="border-top: #e0e0e0 1px solid; padding: 20px; display: flex; justify-content: space-between;">
        <div>
          <el-button v-if="currentStep > 1 && currentStep < 4" @click="previousStep" type="default">
            {{KT('user.previous')}}
          </el-button>
        </div>
        <div>
          <el-button @click="closeImportModal" type="default">
            {{ currentStep === 4 ? KT('user.close') : KT('cancel') }}
          </el-button>
          <el-button v-if="currentStep === 1" @click="nextStep" :disabled="!selectedFile" type="primary">
            {{KT('user.analyzeFile')}}
          </el-button>
          <el-button v-if="currentStep === 2" @click="startImport" :disabled="validRows === 0" type="primary">
            {{KT('user.startImport')}} {{ validRows }} usuários
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>

</template>

<script setup>
import {ElDialog, ElButton, ElInput, ElTag, ElMessage, ElMessageBox, ElNotification} from "element-plus";
import {ref, defineExpose, computed, watch, onMounted, onUnmounted} from 'vue';
import {useStore} from 'vuex'
import KT from '../../func/kt.js';
import * as XLSX from 'xlsx';
import LinkObjects from './link-objects.vue';
import LogObjects from './log-objects.vue';
import EditUser from './edit-user.vue';

const showTip = (evt,text)=>{
  window.$showTip(evt,text);
}

const hideTip = (evt,text)=>{
  window.$hideTip(evt,text);
}

const store = useStore();
const show = ref(false);
const query = ref('');
const selected = ref(0);
const selectedFilter = ref('all');
const sorting = ref('id-asc');
const isGeneratingPDF = ref(false);
const generatingPDF = ref({});

// Referencias para conteos y carga
const deviceCounts = ref({});
const userCounts = ref({});
const loadingCounts = ref({});
const batchCountsLoaded = ref(false);

// Variables para expansión de filas
const expandedRows = ref(new Set());
const expandedData = ref({});
const loadingExpanded = ref({});

// Datos de facturas
const userInvoices = ref({});

// Variables para importación de usuarios (copiadas de DeviceImportModal)
const showImportModal = ref(false);
const currentStep = ref(1);
const selectedFile = ref(null);
const previewData = ref([]);
const excelColumns = ref([]);
const importProgress = ref(0);
const processedCount = ref(0);
const successCount = ref(0);
const errorCount = ref(0);
const totalToImport = ref(0);
const currentProcessingUser = ref('');
const importLog = ref([]);
const errorLog = ref([]);

// Referencias de componentes
const linkObjectsRef = ref(null);
const logObjectsRef = ref(null);
const editUserRef = ref(null);

const users = computed(() => {
  try {
    const userList = store.getters['users/getUsers'];
    return userList || [];
  } catch (error) {
    console.error('Error in users computed:', error);
    return [];
  }
});

// Computed para mostrar columnas de facturación
const showBillingColumns = computed(() => {
  const enableBilling = store.getters['server/getAttribute']('tarkan.enableBilling', false);
  console.log('Checking billing columns:', enableBilling);
  return enableBilling === true;
});

// Computed para calcular el ancho del diálogo dinámicamente
const dialogWidth = computed(() => {
  if (typeof window === 'undefined') return '1200px';
  
  const isMobile = window.innerWidth <= 768;
  const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
  
  if (isMobile) {
    return '100vw';
  } else if (isTablet) {
    return '85vw';
  } else {
    // Ancho necesario para todas las columnas
    return '1800px';
  }
});

// Conteos de estadísticas
const totalUsers = computed(() => {
  return users.value.length;
});

const adminCount = computed(() => {
  return users.value.filter(user => user.administrator).length;
});

const suspendedCount = computed(() => {
  return users.value.filter(user => user.disabled).length;
});

const debtorsCount = computed(() => {
  return users.value.filter(user => getPendingBalance(user.id) > 0).length;
});

// Computed para importación (copiados de DeviceImportModal)
const validRows = computed(() => {
  return previewData.value.filter(row => !row.__errors || row.__errors.length === 0).length;
});

// Filtros de usuarios
const filteredUsers = computed(() => {
  let filtered = users.value;

  // Aplicar filtro de tipo
  if (selectedFilter.value === 'admin') {
    filtered = filtered.filter(user => user.administrator);
  } else if (selectedFilter.value === 'suspended') {
    filtered = filtered.filter(user => user.disabled);
  } else if (selectedFilter.value === 'debtors') {
    filtered = filtered.filter(user => getPendingBalance(user.id) > 0);
  }

  // Aplicar búsqueda
  if (query.value) {
    const searchTerm = query.value.toLowerCase();
    filtered = filtered.filter((user) => {
      return (user.name && user.name.toLowerCase().includes(searchTerm)) ||
             (user.email && user.email.toLowerCase().includes(searchTerm)) ||
             user.id.toString().includes(searchTerm);
    });
  }

  // Aplicar ordenamiento basado en sorting (formato "field-direction")
  const sortParts = sorting.value.split('-');
  const sortField = sortParts[0];
  const sortDirection = sortParts[1];
  
  if (sortField && sortDirection) {
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      // Campos especiales
      if (sortField === 'deviceCount') {
        aVal = getUserDeviceCount(a.id);
        bVal = getUserDeviceCount(b.id);
      } else if (sortField === 'userCount') {
        aVal = getUserUserCount(a.id);
        bVal = getUserUserCount(b.id);
      } else if (sortField === 'pendingCount') {
        aVal = getPendingInvoices(a.id);
        bVal = getPendingInvoices(b.id);
      } else if (sortField === 'pendingBalance') {
        aVal = getPendingBalance(a.id);
        bVal = getPendingBalance(b.id);
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || '';
      }
      
      if (sortDirection === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });
  }

  return filtered;
});

// Cargar todos los conteos en batch (optimizado)
const loadAllUsersCounts = async () => {
  if (batchCountsLoaded.value) {
    return;
  }
  
  try {
    await store.dispatch('users/getAllUsersCounts');
    batchCountsLoaded.value = true;
  } catch (error) {
    console.error('Error loading batch counts:', error);
  }
};

// Cargar conteos individuales solo cuando se hace click (lazy loading)
const loadUserCounts = async (userId) => {
  if (loadingCounts.value[userId]) return;
  
  loadingCounts.value[userId] = { devices: true, users: true };
  
  try {
    const [devices, subUsers] = await Promise.all([
      store.dispatch('users/getUserDevices', userId),
      store.dispatch('users/getUserUsers', userId)
    ]);
    
    deviceCounts.value[userId] = devices.length;
    userCounts.value[userId] = subUsers.length;
    
  } catch (error) {
    console.error(`Error loading counts for user ${userId}:`, error);
    deviceCounts.value[userId] = 0;
    userCounts.value[userId] = 0;
  } finally {
    loadingCounts.value[userId] = { devices: false, users: false };
  }
};

const toggleSorting = (s) => {
  const p = sorting.value.split("-");
  if (p[0] === s) {
    sorting.value = s + '-' + ((p[1] === 'asc') ? 'desc' : 'asc');
  } else {
    sorting.value = s + '-asc';
  }
};

// Funciones de filtrado
const filterBy = (type) => {
  selectedFilter.value = type;
  selected.value = 0;
};

// Funciones para contar dispositivos y usuarios (optimizadas)
const getUserDeviceCount = (userId) => {
  try {
    // Usar conteos batch si están disponibles
    if (store.getters['users/areCountsLoaded']) {
      return store.getters['users/getUserDeviceCount'](userId);
    }
    
    // Fallback a conteos locales individuales
    const count = deviceCounts.value[userId];
    return count !== undefined ? count : 0;
  } catch (error) {
    return 0;
  }
};

const getUserUserCount = (userId) => {
  try {
    // Usar conteos batch si están disponibles
    if (store.getters['users/areCountsLoaded']) {
      return store.getters['users/getUserSubUsersCount'](userId);
    }
    
    // Fallback a conteos locales individuales
    const count = userCounts.value[userId];
    return count !== undefined ? count : 0;
  } catch (error) {
    return 0;
  }
};

// Función para cargar facturas de todos los usuarios
const loadUserInvoices = () => {
  fetch("/tarkan/invoices/manager").then((response) => {
    response.json().then((json) => {
      const invoicesMap = {};
      json.forEach(user => {
        const pendingInvoices = (user.invoices || []).filter(inv => ['PENDING', 'OVERDUE'].includes(inv.status));
        let lastDueDate = 0;
        if (pendingInvoices.length > 0) {
          lastDueDate = Math.max(...pendingInvoices.map(invoice => invoice.DueDateTime || 0));
        }
        
        invoicesMap[user.id] = {
          pendingCount: pendingInvoices.length,
          pendingBalance: pendingInvoices.reduce((acc, inv) => acc + inv.value, 0),
          lastDueDate: lastDueDate
        };
      });
      userInvoices.value = invoicesMap;
    });
  }).catch(error => {
    console.log('No billing data available:', error);
  });
};

// Funciones de facturación
const getPendingInvoices = (userId) => {
  if (userInvoices.value[userId]) {
    return userInvoices.value[userId].pendingCount;
  }
  return 0;
};

const getPendingBalance = (userId) => {
  if (userInvoices.value[userId]) {
    return userInvoices.value[userId].pendingBalance;
  }
  return 0;
};

const getLastDueDate = (userId) => {
  if (userInvoices.value[userId] && userInvoices.value[userId].lastDueDate) {
    return new Date(userInvoices.value[userId].lastDueDate * 1000).toLocaleDateString();
  }
  return '-';
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.warn('Error formatando fecha:', error);
    return dateString;
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'online':
      return 'status-online';
    case 'offline':
      return 'status-offline';
    case 'unknown':
    default:
      return 'status-unknown';
  }
};


// Funciones de usuarios
const doDelete = () => {
  if (selected.value === 0) return;
  
  const user = users.value.find(u => u.id === selected.value);
  if (!user) return;
  
  ElMessageBox.confirm(
    `¿Está seguro de eliminar el usuario ${user.name}?`,
    KT('user.delete'),
    {
      confirmButtonText: KT('user.confirm'),
      cancelButtonText: KT('user.cancel'),
      type: 'warning',
    }
  ).then(() => {
    store.dispatch('users/deleteUser', selected.value).then(() => {
      ElMessage.success(KT('user.deleted'));
      selected.value = 0;
    }).catch(error => {
      ElMessage.error(`Error: ${error.message}`);
    });
  });
};

// Funciones de modales de relación con carga lazy
const showDevicesModal = async (userId) => {
  // Cerrar todas las expansiones abiertas
  expandedRows.value.clear();
  expandedData.value = {};
  
  selected.value = userId;
  
  // Cargar elementos individuales si no están en batch
  if (!store.getters['users/areCountsLoaded'] && !deviceCounts.value[userId]) {
    await loadUserCounts(userId);
  }
  
  openRelationModal('devices');
};

const showUsersModal = async (userId) => {
  // Cerrar todas las expansiones abiertas
  expandedRows.value.clear();
  expandedData.value = {};
  
  selected.value = userId;
  
  // Cargar elementos individuales si no están en batch
  if (!store.getters['users/areCountsLoaded'] && !userCounts.value[userId]) {
    await loadUserCounts(userId);
  }
  
  openRelationModal('users');
};

// Helper para manejar clicks en botones de relación inferiores
const handleRelationButtonClick = async (type) => {
  if (selected.value === 0) return;
  
  // Cargar elementos individuales si es necesario para usuarios o dispositivos
  if ((type === 'users' || type === 'devices') && 
      !store.getters['users/areCountsLoaded'] && 
      !deviceCounts.value[selected.value] && 
      !userCounts.value[selected.value]) {
    await loadUserCounts(selected.value);
  }
  
  openRelationModal(type);
};

const openRelationModal = (type) => {
  if (selected.value === 0 || !linkObjectsRef.value) return;
  
  try {
    linkObjectsRef.value.showObjects({
      userId: selected.value,
      type: type
    });
    
    // Agregar listener para cuando se cierre el modal de relaciones
    setupModalCloseListener(selected.value);
  } catch (error) {
    console.error('Error opening relation modal:', error);
    ElMessage.error(`Error al abrir la lista de ${type}`);
  }
};

// Variable para rastrear si hay modales abiertos
const hasOpenModal = ref(false);

// Función para configurar el listener de cierre de modal
const setupModalCloseListener = (userId) => {
  hasOpenModal.value = true;
  
  // Verificar periódicamente si el modal sigue abierto
  const checkModalInterval = setInterval(() => {
    const linkModals = document.querySelectorAll('.el-dialog__wrapper');
    const hasVisibleModal = Array.from(linkModals).some(modal => {
      const style = window.getComputedStyle(modal);
      return style.display !== 'none' && modal.offsetHeight > 0;
    });
    
    if (!hasVisibleModal && hasOpenModal.value) {
      // El modal se cerró
      hasOpenModal.value = false;
      refreshUserCounts(userId);
      clearInterval(checkModalInterval);
    }
  }, 500); // Verificar cada 500ms
  
  // Limpiar después de 10 segundos como máximo
  setTimeout(() => {
    clearInterval(checkModalInterval);
    hasOpenModal.value = false;
  }, 10000);
};

// Función para refrescar los conteos de un usuario específico
const refreshUserCounts = async (userId) => {
  try {
    console.log('Refreshing counts for user:', userId);
    
    // Limpiar conteos existentes para forzar recarga
    delete deviceCounts.value[userId];
    delete userCounts.value[userId];
    delete loadingCounts.value[userId];
    
    // Cargar nuevos conteos
    await loadUserCounts(userId);
    
    console.log('Counts refreshed for user:', userId);
  } catch (error) {
    console.error('Error refreshing user counts:', error);
  }
};

// Función de generación de PDF usando estrategia HTML
const generatePdf = async () => {
  const usersData = filteredUsers.value.length > 0 ? filteredUsers.value : users.value;
  
  if (!usersData || usersData.length === 0) {
    ElNotification({
      title: 'Sin datos',
      message: 'No hay usuarios para generar el PDF',
      type: 'warning',
      duration: 3000,
    });
    return;
  }

  const currentDate = new Date();
  const companyName = 'TARKAN GPS';

  const htmlContent = `
    <div style="width: 100%; max-width: 1200px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px;">
        <div>
          <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">${companyName}</h1>
          <p style="color: #7f8c8d; margin: 5px 0; font-size: 14px;">Sistema de Gestión de Usuarios</p>
        </div>
      </div>
      
      <div style="background: #2c3e50; color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
        <h2 style="margin: 0; font-size: 22px;">REPORTE GENERAL DE USUARIOS</h2>
        <p style="margin: 10px 0 0 0; font-size: 14px;">Total de usuarios: ${usersData.length}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; box-shadow: 0 2px 15px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: #34495e; color: white;">
            <th style="padding: 12px; border: 1px solid #ddd; font-size: 11px;">ID</th>
            <th style="padding: 12px; border: 1px solid #ddd; font-size: 11px;">NOMBRE</th>
            <th style="padding: 12px; border: 1px solid #ddd; font-size: 11px;">EMAIL</th>
            <th style="padding: 12px; border: 1px solid #ddd; font-size: 11px;">ESTADO</th>
            <th style="padding: 12px; border: 1px solid #ddd; font-size: 11px;">TIPO</th>
          </tr>
        </thead>
        <tbody>
          ${usersData.map((user, index) => `
            <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 10px;">${user.id}</td>
              <td style="padding: 10px; border: 1px solid #ddd; font-size: 10px;">${user.name || 'Sin nombre'}</td>
              <td style="padding: 10px; border: 1px solid #ddd; font-size: 10px;">${user.email || 'Sin email'}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 10px;">
                <span style="padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: bold;
                  ${user.disabled ? 'background: #e74c3c; color: white;' : 'background: #27ae60; color: white;'}">
                  ${user.disabled ? 'INACTIVO' : 'ACTIVO'}
                </span>
              </td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 10px;">
                <span style="padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: bold;
                  ${user.administrator ? 'background: #f39c12; color: white;' : 'background: #95a5a6; color: white;'}">
                  ${user.administrator ? 'ADMIN' : 'USUARIO'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ecf0f1; text-align: center;">
        <p style="margin: 0; color: #7f8c8d; font-size: 10px;">
          Documento generado por ${companyName} - ${currentDate.toLocaleDateString('es-ES')}
        </p>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>PDF Usuarios</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>${container.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
  
  ElNotification({
    title: 'PDF Generado',
    message: `Se generó el reporte con ${usersData.length} usuarios`,
    type: 'success',
    duration: 5000,
  });
};

// Función de generación de Excel
const generateExcel = () => {
  try {
    const data = filteredUsers.value.map(user => ({
      ID: user.id,
      Nombre: user.name || '',
      Email: user.email || '',
      Dispositivos: getUserDeviceCount(user.id),
      Usuarios: getUserUserCount(user.id),
      Estado: user.disabled ? 'Suspenso' : 'Ativo',
      Admin: user.administrator ? 'Admin' : 'User'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'usuarios.xlsx');
  } catch (error) {
    console.error('Error generating Excel:', error);
    ElMessage.error('Error al generar archivo Excel');
  }
};

// Función para crear sesión
const createSession = async () => {
  if (selected.value === 0) return;
  
  try {
    const response = await fetch("/api/session/"+selected.value);
    console.log('Sesión creada con éxito:', response);
    window.location.reload()
  } catch (error) {
    console.error('Error al crear sesión:', error);
  }
};

// Cargar conteos cuando cambie la lista de usuarios
watch(filteredUsers, (newUsers) => {
  if (newUsers.length > 0) {
    newUsers.slice(0, 20).forEach(user => {
      if (!Object.prototype.hasOwnProperty.call(deviceCounts.value, user.id)) {
        loadUserCounts(user.id);
      }
    });
  }
}, { immediate: true });

// Watcher para detectar cuando el modal principal se vuelve visible (regresa de otro modal)
watch(show, (newValue, oldValue) => {
  if (newValue && !oldValue && hasOpenModal.value) {
    // El modal principal se volvió visible después de haber tenido un modal secundario abierto
    hasOpenModal.value = false;
    if (selected.value > 0) {
      // Refrescar conteos del usuario seleccionado
      setTimeout(() => {
        refreshUserCounts(selected.value);
      }, 100);
    }
  }
});

onMounted(async () => {
  // Cargar conteos batch optimizados primero
  await loadAllUsersCounts();
  
  // Cargar facturas
  loadUserInvoices();
  
  // Agregar listener global para detectar cambios de focus
  window.addEventListener('focus', handleWindowFocus);
  
  // Listener para detectar clicks en cualquier lugar del documento
  document.addEventListener('click', handleGlobalClick);
});

// Función para manejar clicks globales
const handleGlobalClick = (event) => {
  // Si se hace click fuera de un modal y hay un usuario seleccionado
  // y han pasado al menos 2 segundos desde la última actualización
  if (!event.target.closest('.el-dialog') && selected.value > 0) {
    const now = Date.now();
    if (!lastRefreshTime.value || (now - lastRefreshTime.value) > 2000) {
      lastRefreshTime.value = now;
      refreshUserCounts(selected.value);
    }
  }
};

const lastRefreshTime = ref(0);

// Función para manejar cambios en objetos asignados
const handleObjectsChanged = async (event) => {
  console.log('🔄 Recibido evento objects-changed:', event);
  
  const { userId, type, hasChanges } = event;
  
  if (!hasChanges || !userId) return;
  
  try {
    console.log(`🔄 Actualizando conteos para usuario ${userId} después de cambios en ${type}`);
    
    // Solo actualizar el usuario específico que cambió
    if (type === 'users' || type === 'devices') {
      // Recargar conteos para este usuario específico
      // Esta función ya actualiza tanto los conteos locales como los del store
      await refreshSingleUserCounts(userId);
    }
    
    // No necesitamos recargar todos los conteos batch, solo actualizamos el usuario específico
    console.log('✅ Actualización optimizada completada');
    
  } catch (error) {
    console.error('❌ Error actualizando conteos después de cambios:', error);
  }
};

// Función para actualizar conteos de un usuario específico
const refreshSingleUserCounts = async (userId) => {
  try {
    console.log(`🔄 Refrescando conteos individuales para usuario ${userId}`);
    
    const [devices, subUsers] = await Promise.all([
      store.dispatch('users/getUserDevices', userId),
      store.dispatch('users/getUserUsers', userId)
    ]);
    
    // Actualizar conteos locales
    deviceCounts.value[userId] = devices.length;
    userCounts.value[userId] = subUsers.length;
    
    // Si hay conteos batch, actualizarlos también
    if (store.getters['users/areCountsLoaded']) {
      // Actualizar directamente en el store para que sea reactivo
      const currentCounts = store.state.users.usersCounts;
      currentCounts.deviceCounts[userId] = devices.length;
      currentCounts.userCounts[userId] = subUsers.length;
      
      // Commit de la mutación para que Vue detecte el cambio
      store.commit('users/setUsersCounts', currentCounts);
    }
    
    console.log(`✅ Conteos actualizados para usuario ${userId}: ${devices.length} dispositivos, ${subUsers.length} usuarios`);
    
  } catch (error) {
    console.error(`❌ Error refrescando conteos para usuario ${userId}:`, error);
  }
};

// Funciones para expansión de filas
const toggleUserExpansion = async (userId, type) => {
  const key = `${userId}-${type}`;
  const currentExpanded = expandedRows.value.has(key);
  
  if (currentExpanded) {
    closeExpansion(userId);
  } else {
    // Cerrar todas las expansiones existentes
    expandedRows.value.clear();
    expandedData.value = {};
    
    // Abrir nueva expansión
    expandedRows.value.add(key);
    loadingExpanded.value[key] = true;
    
    try {
      let data = [];
      if (type === 'devices') {
        const result = await store.dispatch('users/getUserDevices', userId);
        data = result || [];
      } else if (type === 'users') {
        const result = await store.dispatch('users/getUserUsers', userId);
        data = result || [];
      }
      
      expandedData.value[userId] = data;
      // Almacenar el tipo de expansión
      expandedData.value[`${userId}_type`] = type;
      
    } catch (error) {
      expandedData.value[userId] = [];
    } finally {
      loadingExpanded.value[key] = false;
    }
  }
};

const closeExpansion = (userId) => {
  // Cerrar todas las expansiones de este usuario
  const keysToRemove = Array.from(expandedRows.value).filter(key => key.startsWith(`${userId}-`));
  keysToRemove.forEach(key => expandedRows.value.delete(key));
  
  // Limpiar datos
  delete expandedData.value[userId];
  delete expandedData.value[`${userId}_type`];
};

const isRowExpanded = (userId) => {
  return Array.from(expandedRows.value).some(key => key.startsWith(`${userId}-`));
};

const isDeviceExpansion = (userId) => {
  // Verificar el tipo almacenado
  return expandedData.value[`${userId}_type`] === 'devices';
};

const getExpandedIcon = (userId) => {
  const devicesKey = `${userId}-devices`;
  const usersKey = `${userId}-users`;
  
  if (expandedRows.value.has(devicesKey)) {
    return 'fas fa-car';
  } else if (expandedRows.value.has(usersKey)) {
    return 'fas fa-users';
  }
  return '';
};

const getExpandedTitle = (userId) => {
  const devicesKey = `${userId}-devices`;
  const usersKey = `${userId}-users`;
  
  if (expandedRows.value.has(devicesKey)) {
    const count = expandedData.value[userId]?.length || 0;
    return `Dispositivos Asignados (${count})`;
  } else if (expandedRows.value.has(usersKey)) {
    const count = expandedData.value[userId]?.length || 0;
    return `Usuarios Subordinados (${count})`;
  }
  return '';
};

// Limpiar listeners al desmontar
onUnmounted(() => {
  window.removeEventListener('focus', handleWindowFocus);
  document.removeEventListener('click', handleGlobalClick);
});

// Función para manejar focus en la ventana
const handleWindowFocus = () => {
  // Solo refrescar si hay un usuario seleccionado y algunos conteos cargados
  if (selected.value > 0 && Object.keys(deviceCounts.value).length > 0) {
    refreshUserCounts(selected.value);
  }
};

// Función para refrescar todos los conteos visibles
const refreshAllVisibleCounts = () => {
  const visibleUsers = filteredUsers.value.slice(0, 20); // Primeros 20 usuarios visibles
  visibleUsers.forEach(user => {
    if (Object.prototype.hasOwnProperty.call(deviceCounts.value, user.id)) {
      refreshUserCounts(user.id);
    }
  });
};

const showUsers = () => {
  console.log('Final: showUsers called');
  
  store.dispatch('users/getUsers').then(() => {
    console.log('Final: Users loaded, opening modal');
    show.value = true;
    selectedFilter.value = 'all';
    selected.value = 0;
    loadUserInvoices();
  }).catch(error => {
    console.error('Final: Error loading users:', error);
  });
}

// Funciones auxiliares para validación de límites
const canImportUsers = () => {
  // Admin siempre puede importar usuarios
  if (store.state.auth.administrator) {
    return true;
  }
  
  const userLimit = store.state.auth.userLimit;
  
  // Sin límite definido
  if (userLimit === -1) {
    return true;
  }
  
  // Verificar si hay espacio para al menos un usuario más
  const currentUserCount = store.state.users.userList.length;
  return currentUserCount < userLimit;
};

const showUserLimitExceeded = () => {
  const currentCount = store.state.users.userList.length;
  const userLimit = store.state.auth.userLimit;
  
  ElMessageBox.alert(
    `Has alcanzado el límite de ${userLimit} usuarios permitidos.\n\nUsuarios actuales: ${currentCount}`,
    KT('user.userLimitReached'),
    {
      confirmButtonText: KT('common.ok'),
      type: 'warning'
    }
  );
};

// Funciones para importación de usuarios (copiadas y adaptadas de DeviceImportModal)
const openImportModal = () => {
  showImportModal.value = true;
  currentStep.value = 1;
  selectedFile.value = null;
  previewData.value = [];
  excelColumns.value = [];
  importProgress.value = 0;
  processedCount.value = 0;
  successCount.value = 0;
  errorCount.value = 0;
  totalToImport.value = 0;
  currentProcessingUser.value = '';
  importLog.value = [];
  errorLog.value = [];
};

const closeImportModal = () => {
  // Si hay importaciones exitosas, actualizar la lista
  const hadSuccessfulImports = successCount.value > 0;
  
  showImportModal.value = false;
  currentStep.value = 1;
  selectedFile.value = null;
  previewData.value = [];
  excelColumns.value = [];
  importProgress.value = 0;
  processedCount.value = 0;
  successCount.value = 0;
  errorCount.value = 0;
  totalToImport.value = 0;
  currentProcessingUser.value = '';
  importLog.value = [];
  errorLog.value = [];
  
  if (hadSuccessfulImports) {
    store.dispatch('users/getUsers');
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    selectedFile.value = files[0];
    processFile();
  }
};

const handleFileSelect = (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    selectedFile.value = files[0];
    processFile();
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const processFile = async () => {
  if (!selectedFile.value) return;
  
  if (!selectedFile.value.name.match(/\.(xlsx|xls)$/)) {
    ElMessage.error('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
    return;
  }

  try {
    const XLSX = await loadXLSX();
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
          excelColumns.value = Object.keys(jsonData[0]);
        }
        
        // Procesar y validar datos
        previewData.value = jsonData.map((row, index) => {
          const processedRow = processRowData(row);
          processedRow.__originalIndex = index + 2; // +2 porque Excel empieza en 1 y hay header
          return processedRow;
        });

        currentStep.value = 2;
        
      } catch (error) {
        console.error('Error processing file:', error);
        ElMessage.error('Error al procesar el archivo Excel');
      }
    };
    
    reader.readAsArrayBuffer(selectedFile.value);
    
  } catch (error) {
    console.error('Error loading XLSX library:', error);
    ElMessage.error('Error al cargar la librería de Excel');
  }
};

const loadXLSX = () => {
  return new Promise((resolve, reject) => {
    if (window.XLSX) {
      resolve(window.XLSX);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error('Failed to load XLSX library'));
    document.head.appendChild(script);
  });
};

// Mapeo de columnas para usuarios
const columnMapping = {
  name: ['name', 'Name', 'NAME', 'nombre', 'Nombre'],
  email: ['email', 'Email', 'EMAIL', 'correo', 'Correo'],
  password: ['password', 'Password', 'PASSWORD', 'contraseña', 'Contraseña'],
  phone: ['phone', 'Phone', 'PHONE', 'telefono', 'Teléfono'],
  // Dirección
  cep: ['cep', 'CEP'],
  rua: ['rua', 'Rua', 'calle', 'Calle'],
  hausenumber: ['hausenumber', 'numero', 'Número', 'number', 'Number'],
  complemento: ['complemento', 'Complemento'],
  bairro: ['bairro', 'Barrio', 'barrio'],
  cidade: ['cidade', 'Ciudad', 'ciudad'],
  estado: ['estado', 'Estado'],
  // Estados
  disabled: ['disabled', 'Disabled', 'deshabilitado', 'Deshabilitado'],
  administrator: ['administrator', 'Administrator', 'administrador', 'Administrador'],
  // Configuración Tarkan específica
  'tarkan.lang': ['Idioma', 'idioma', 'lang', 'language'],
  'tarkan.advancedPerms': ['Permisos Avanzados', 'permisos_avanzados', 'advanced_perms', 'advancedPerms']
};

const processRowData = (row) => {
  const processedRow = { ...row };
  const errors = [];

  // Validar name (obligatorio)
  const name = findValueInRow(row, columnMapping.name);
  if (!name || name.toString().trim() === '') {
    errors.push('Nombre es obligatorio');
  } else {
    processedRow.name = name.toString().trim();
  }

  // Validar email (obligatorio)
  const email = findValueInRow(row, columnMapping.email);
  if (!email || email.toString().trim() === '') {
    errors.push('Email es obligatorio');
  } else if (!email.toString().includes('@')) {
    errors.push('Email no válido');
  } else {
    processedRow.email = email.toString().trim();
  }

  // Procesar otros campos opcionales
  Object.keys(columnMapping).forEach(key => {
    if (key !== 'name' && key !== 'email') {
      const value = findValueInRow(row, columnMapping[key]);
      if (value && value.toString().trim() !== '') {
        processedRow[key] = value.toString().trim();
      }
    }
  });

  processedRow.__errors = errors;
  return processedRow;
};

const findValueInRow = (row, possibleKeys) => {
  for (let key of possibleKeys) {
    const lowerKey = key.toLowerCase();
    for (let rowKey of Object.keys(row)) {
      if (rowKey.toLowerCase() === lowerKey) {
        return row[rowKey];
      }
    }
  }
  return null;
};

const hasRowError = (row) => {
  return row.__errors && row.__errors.length > 0;
};

const nextStep = () => {
  if (currentStep.value < 4) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const startImport = async () => {
  currentStep.value = 3;
  
  const validData = previewData.value.filter(row => !row.__errors || row.__errors.length === 0);
  totalToImport.value = validData.length;
  processedCount.value = 0;
  successCount.value = 0;
  errorCount.value = 0;
  importProgress.value = 0;
  importLog.value = [];
  errorLog.value = [];

  // Verificar límites de usuarios antes de iniciar la importación
  const currentUserCount = store.state.users.userList.length;
  const userLimit = store.state.auth.userLimit;
  
  // Solo verificar límites si no es administrador y tiene límite definido
  if (!store.state.auth.administrator && userLimit > -1) {
    const remainingUsers = Math.max(0, userLimit - currentUserCount);
    
    if (validData.length > remainingUsers) {
      ElNotification({
        title: KT('user.error'),
        message: `${KT('user.importLimitExceeded')}: ${remainingUsers} ${KT('user.usersRemaining')}`,
        type: 'error',
        duration: 5000
      });
      
      importLog.value.push({
        type: 'error',
        message: `\u2717 Límite excedido: Solo puedes importar ${remainingUsers} usuarios más`
      });
      
      currentStep.value = 4;
      return;
    }
  }

  for (let i = 0; i < validData.length; i++) {
    // Verificar límite en cada iteración para usuarios no administradores
    if (!store.state.auth.administrator && userLimit > -1) {
      const currentCount = store.state.users.userList.length;
      if (currentCount >= userLimit) {
        errorCount.value++;
        importLog.value.push({
          type: 'error',
          message: `\u2717 ${KT('user.userLimitReached')}: ${validData[i].name}`
        });
        processedCount.value++;
        importProgress.value = Math.round((processedCount.value / totalToImport.value) * 100);
        continue;
      }
    }
    const row = validData[i];
    currentProcessingUser.value = row.name || `Usuario ${i + 1}`;
    
    try {
      // Preparar datos del usuario
      const userData = {
        name: row.name,
        email: row.email,
        password: row.password || 'default123',
        phone: row.phone || '',
        disabled: row.disabled === 'true' || false,
        administrator: row.administrator === 'true' || false,
        attributes: {}
      };

      // Agregar atributos de dirección si existen
      if (row.cep) userData.attributes['cep'] = row.cep;
      if (row.rua) userData.attributes['rua'] = row.rua;
      if (row.hausenumber) userData.attributes['hausenumber'] = row.hausenumber;
      if (row.complemento) userData.attributes['complemento'] = row.complemento;
      if (row.bairro) userData.attributes['bairro'] = row.bairro;
      if (row.cidade) userData.attributes['cidade'] = row.cidade;
      if (row.estado) userData.attributes['estado'] = row.estado;

      // Agregar configuración Tarkan específica
      if (row['tarkan.lang']) userData.attributes['tarkan.lang'] = row['tarkan.lang'];
      if (row['tarkan.advancedPerms']) userData.attributes['tarkan.advancedPerms'] = row['tarkan.advancedPerms'];

      // Guardar usuario usando el store
      await store.dispatch('users/save', userData);
      
      successCount.value++;
      importLog.value.push({
        type: 'success',
        message: `✓ ${userData.name} ${KT('user.importedSuccessfully')}`
      });
      
    } catch (error) {
      errorCount.value++;
      const errorMessage = error.response?.data || error.message || KT('user.unknownError');
      
      importLog.value.push({
        type: 'error',
        message: `✗ ${KT('user.errorIn')} ${row.name}: ${errorMessage}`
      });
      
      errorLog.value.push({
        row: row.__originalIndex,
        user: row.name || 'Sin nombre',
        error: errorMessage
      });
    }
    
    processedCount.value++;
    importProgress.value = Math.round((processedCount.value / totalToImport.value) * 100);
    
    // Pequeña pausa para no sobrecargar el servidor
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  currentProcessingUser.value = '';
  
  // Actualizar lista de usuarios
  store.dispatch('users/getUsers');
  
  // Ir al paso final
  currentStep.value = 4;
};

const getResultTitle = () => {
  if (successCount.value === totalToImport.value) {
    return KT('user.allUsersImported');
  } else if (successCount.value > 0) {
    return KT('user.partialImport');
  } else {
    return KT('user.importFailed');
  }
};

const getResultSubtitle = () => {
  return `${successCount.value} ${KT('user.of')} ${totalToImport.value} ${KT('user.usersImportedCorrectly')}`;
};

const downloadTemplate = () => {
  // Crear plantilla Excel con todos los campos de edit-user.vue
  const templateData = [
    {
      // Campos básicos
      'Nombre': 'Juan Pérez',
      'Email': 'juan@example.com',
      'Teléfono': '5511999999999',
      'Contraseña': 'password123',
      
      // Dirección
      'CEP': '01310-100',
      'Calle': 'Avenida Paulista',
      'Número': '1578',
      'Complemento': 'Apto 101',
      'Barrio': 'Bela Vista',
      'Ciudad': 'São Paulo',
      'Estado': 'SP',
      
      // Comunicación Personal
      'Teléfono Personal': '5511888888888',
      'WhatsApp Personal': '5511777777777',
      'Email Personal': 'juan.personal@example.com',
      
      // Comunicación Comercial
      'Teléfono Comercial': '5511666666666',
      'WhatsApp Comercial': '5511555555555',
      'Email Comercial': 'juan.comercial@example.com',
      
      // Configuración Tarkan
      'Facturación Habilitada': 'true',
      'Precio Facturación': '50.00',
      'CPF/CNPJ': '12345678901',
      'Idioma': 'pt-BR',
      'Permisos Avanzados': '00FFF0F080F0008000F8000000000000',
      
      // Coordenadas del mapa
      'Latitud': '-23.5505',
      'Longitud': '-46.6333',
      'Zoom': '13',
      
      // Estados
      'Deshabilitado': 'false',
      'Administrador': 'false',
      
      // Límites
      'Límite Dispositivos': '10',
      'Límite Usuarios': '5'
    }
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Usuarios');
  
  // Descargar archivo
  XLSX.writeFile(workbook, 'plantilla_usuarios.xlsx');
  ElMessage.success('Plantilla descargada exitosamente');
};

// Función para generar PDF del sublistado expandido
const generateExpandedPDF = async (userId) => {
  if (generatingPDF.value[userId]) return;
  
  generatingPDF.value[userId] = true;
  
  try {
    const data = expandedData.value[userId];
    if (!data || data.length === 0) {
      ElNotification({
        title: 'Aviso',
        message: 'No hay datos para generar el PDF',
        type: 'warning',
        duration: 3000,
      });
      return;
    }
    
    // Obtener el usuario actual para el nombre
    const user = filteredUsers.value.find(u => u.id === userId);
    const userName = user?.name || `Usuario ${userId}`;
    const companyName = 'TARKAN GPS';
    const currentDate = new Date();
    
    // Determinar si es devices o users
    const isDevices = isDeviceExpansion(userId);
    
    // Crear contenedor HTML para el PDF
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    
    let htmlContent = '';
    
    if (isDevices) {
      // HTML para dispositivos
      htmlContent = `
        <div style="width: 100%; max-width: 1200px; margin: 0 auto;">
          <!-- Header profesional -->
          <div style="border-bottom: 3px solid #2980b9; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">${companyName}</h1>
                <p style="color: #7f8c8d; margin: 5px 0; font-size: 14px;">Sistema de Gestión GPS</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; color: #34495e; font-size: 12px;">Fecha: ${currentDate.toLocaleDateString('es-ES')}</p>
                <p style="margin: 0; color: #34495e; font-size: 12px;">Hora: ${currentDate.toLocaleTimeString('es-ES')}</p>
              </div>
            </div>
          </div>
          
          <!-- Título del reporte -->
          <div style="background: #2c3e50; color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
            <h2 style="margin: 0; font-size: 22px;">REPORTE DE DISPOSITIVOS ASIGNADOS</h2>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Usuario: <strong>${userName.toUpperCase()}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Total de dispositivos: <strong>${data.length}</strong></p>
          </div>
          
          <!-- Tabla de dispositivos -->
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 2px 15px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: #34495e; color: white;">
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 9px;">#</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 9px;">ID</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 9px;">IMEI</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 9px;">NOMBRE</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 9px;">PLACA</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 9px;">MARCA GPS</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 9px;">MODELO GPS</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 9px;">MARCA VEH</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 9px;">MODELO VEH</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 9px;">COLOR</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 9px;">ESTADO</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 9px;">SIM</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((device, index) => `
                <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
                  <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 8px; font-weight: bold;">${index + 1}</td>
                  <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 8px;">${device.id || '-'}</td>
                  <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 8px; font-family: monospace;">${device.uniqueId || '-'}</td>
                  <td style="padding: 6px; text-align: left; border: 1px solid #ddd; font-size: 8px; font-weight: 500;">${device.name || '-'}</td>
                  <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 8px; font-weight: bold; color: #2980b9;">${device.attributes?.placa || '-'}</td>
                  <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 8px;">${device.attributes?.['device.gpsBrand'] || '-'}</td>
                  <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 8px;">${device.attributes?.['device.model'] || '-'}</td>
                  <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 8px;">${device.attributes?.brand || device.model || '-'}</td>
                  <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 8px;">${device.attributes?.model || '-'}</td>
                  <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 8px;">${device.attributes?.color || '-'}</td>
                  <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 8px;">
                    <span style="padding: 2px 6px; border-radius: 8px; font-size: 7px; font-weight: bold;
                      ${device.status === 'online' ? 'background: #27ae60; color: white;' : 
                        device.status === 'offline' ? 'background: #e74c3c; color: white;' : 
                        'background: #95a5a6; color: white;'}">
                      ${device.status?.toUpperCase() || 'DESC'}
                    </span>
                  </td>
                  <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 8px;">${device.attributes?.phone || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- Footer -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ecf0f1; text-align: center;">
            <p style="margin: 0; color: #7f8c8d; font-size: 10px;">
              Documento generado automáticamente por ${companyName} - ${currentDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      `;
      
      container.innerHTML = htmlContent;
      
      // Preparar para imprimir
      
      // Generar el PDF
      const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>PDF Usuarios</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>${container.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
      
      ElNotification({
        title: 'PDF Generado',
        message: `Se generó el reporte de ${data.length} dispositivos asignados a ${userName}`,
        type: 'success',
        duration: 5000,
      });
      
    } else {
      // HTML para usuarios
      htmlContent = `
        <div style="width: 100%; max-width: 1200px; margin: 0 auto;">
          <!-- Header profesional -->
          <div style="border-bottom: 3px solid #27ae60; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">${companyName}</h1>
                <p style="color: #7f8c8d; margin: 5px 0; font-size: 14px;">Sistema de Gestión de Usuarios</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; color: #34495e; font-size: 12px;">Fecha: ${currentDate.toLocaleDateString('es-ES')}</p>
                <p style="margin: 0; color: #34495e; font-size: 12px;">Hora: ${currentDate.toLocaleTimeString('es-ES')}</p>
              </div>
            </div>
          </div>
          
          <!-- Título del reporte -->
          <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
            <h2 style="margin: 0; font-size: 22px;">REPORTE DE USUARIOS SUBORDINADOS</h2>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Usuario Principal: <strong>${userName.toUpperCase()}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Total de usuarios: <strong>${data.length}</strong></p>
          </div>
          
          <!-- Tabla de usuarios -->
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 2px 15px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white;">
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-size: 11px;">#</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-size: 11px;">ID</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-size: 11px;">NOMBRE</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-size: 11px;">EMAIL</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-size: 11px;">TELÉFONO</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-size: 11px;">ADMINISTRADOR</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-size: 11px;">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((usuario, index) => `
                <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 10px; font-weight: bold;">${index + 1}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 10px;">${usuario.id || '-'}</td>
                  <td style="padding: 10px; text-align: left; border: 1px solid #ddd; font-size: 10px; font-weight: 500;">${usuario.name || '-'}</td>
                  <td style="padding: 10px; text-align: left; border: 1px solid #ddd; font-size: 10px; color: #2980b9;">${usuario.email || '-'}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 10px;">${usuario.phone || '-'}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 10px;">
                    <span style="padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: bold;
                      ${usuario.administrator ? 'background: #f39c12; color: white;' : 'background: #95a5a6; color: white;'}">
                      ${usuario.administrator ? 'SÍ' : 'NO'}
                    </span>
                  </td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 10px;">
                    <span style="padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: bold;
                      ${!usuario.disabled ? 'background: #27ae60; color: white;' : 'background: #e74c3c; color: white;'}">
                      ${!usuario.disabled ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- Footer -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ecf0f1; text-align: center;">
            <p style="margin: 0; color: #7f8c8d; font-size: 10px;">
              Documento generado automáticamente por ${companyName} - ${currentDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      `;
      
      container.innerHTML = htmlContent;
      
      // Preparar para imprimir
      
      // Generar el PDF
      const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>PDF Usuarios</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>${container.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
      
      ElNotification({
        title: 'PDF Generado',
        message: `Se generó el reporte de ${data.length} usuarios subordinados de ${userName}`,
        type: 'success',
        duration: 5000,
      });
    }
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    ElNotification({
      title: 'Error',
      message: 'Error al generar el PDF. Por favor, intente nuevamente.',
      type: 'error',
      duration: 5000,
    });
  } finally {
    generatingPDF.value[userId] = false;
  }
};

defineExpose({
  showUsers,
  refreshUserCounts,
  refreshAllVisibleCounts
})
</script>

<style scoped>
/* Estilos modernos aplicados desde edit-driver.vue */
:root {
  --p-primary-50: var(--p-blue-50);
  --p-primary-100: var(--p-blue-100);
  --p-primary-200: var(--p-blue-200);
  --p-primary-300: var(--p-blue-300);
  --p-primary-400: var(--p-blue-400);
  --p-primary-500: var(--p-blue-500);
  --p-primary-600: var(--p-blue-600);
  --p-primary-700: var(--p-blue-700);
  --p-primary-800: var(--p-blue-800);
  --p-primary-900: var(--p-blue-900);
  
  --p-border-radius-md: 6px;
  --p-border-radius-lg: 8px;
  --p-border-radius-xl: 12px;
}

.users-dialog {
  max-height: 90vh;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  font-family: "Noto Sans", sans-serif;
  font-weight: 300;
  overflow: hidden;
}

.modal-header-full {
  background: #f8fafc;
  color: #1f2937;
  padding: 20px;
  margin: 0;
  width: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border-bottom: 1px solid #e5e7eb;
}

.header-icon {
  font-size: 1.5rem;
  margin-right: 12px;
  color: #1f2937;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

/* Estadísticas Cards */
.users-stats-card {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 0 20px;
  flex-wrap: wrap;
}

.users-stat-item {
  flex: 1;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: var(--p-border-radius-lg);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  min-width: 140px;
  min-height: 50px;
}

.users-stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: var(--p-primary-300);
}

.users-stat-item.active {
  background: linear-gradient(135deg, var(--p-primary-50) 0%, var(--p-primary-100) 100%);
  border-color: var(--p-primary-400);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.stat-icon {
  font-size: 1.2rem;
  color: var(--p-primary-600);
  flex-shrink: 0;
}

.stat-icon.admin {
  color: #dc2626;
}

.stat-icon.suspended {
  color: #f59e0b;
}

.stat-icon.debtors {
  color: #ef4444;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--p-primary-700);
  line-height: 1;
  margin-right: 6px;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

/* Búsqueda */
.search-container {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
  padding: 0 20px;
}

.modern-input {
  flex: 1;
  --el-input-border-radius: var(--p-border-radius-lg);
  --el-input-border-color: #d1d5db;
  --el-input-focus-border-color: var(--p-primary-500);
}

.add-user-btn {
  --el-button-border-radius: var(--p-border-radius-lg);
  font-weight: 500;
}

/* Header de tabla */
.table-header {
  display: flex;
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  border-top: 1px solid #2d3748;
  border-bottom: 2px solid #1a202c;
  font-weight: 600;
  color: #ffffff;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.header-cell {
  padding: 8px 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  box-sizing: border-box;
  flex-shrink: 0;
  min-height: 35px;
}

.header-cell:last-child {
  border-right: none;
}

.header-cell.clickable {
  cursor: pointer;
}

.header-cell.clickable:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

/* Columnas sin facturación (9 columnas) */
.id-column { flex: 0 0 80px; min-width: 80px; text-align: center; }
.name-column { flex: 1 1 200px; min-width: 150px; }
.email-column { flex: 1 1 200px; min-width: 140px; }
.device-count-column { flex: 0 0 90px; min-width: 80px; text-align: center; }
.user-count-column { flex: 0 0 90px; min-width: 80px; text-align: center; }
.admin-column { flex: 0 0 90px; min-width: 80px; text-align: center; }
.disabled-column { flex: 0 0 90px; min-width: 80px; text-align: center; }
.actions-column { flex: 0 0 120px; min-width: 120px; text-align: center; }

/* Columnas con facturación (10 columnas) */
.table-header.with-billing .id-column, 
.user-item.with-billing .id-cell { flex: 0 0 6%; min-width: 50px; }

.table-header.with-billing .name-column,
.user-item.with-billing .name-cell { flex: 1 1 15%; min-width: 100px; }

.table-header.with-billing .email-column,
.user-item.with-billing .email-cell { flex: 1 1 18%; min-width: 120px; }

.table-header.with-billing .device-count-column,
.user-item.with-billing .device-count-cell { flex: 0 0 8%; min-width: 70px; }

.table-header.with-billing .user-count-column,
.user-item.with-billing .user-count-cell { flex: 0 0 8%; min-width: 70px; }

.pending-count-column { flex: 0 0 8%; min-width: 70px; text-align: center; }
.pending-balance-column { flex: 0 0 10%; min-width: 80px; text-align: center; }
.due-date-column { flex: 0 0 9%; min-width: 75px; text-align: center; }

.table-header.with-billing .admin-column,
.user-item.with-billing .admin-cell { flex: 0 0 9%; min-width: 70px; }

.table-header.with-billing .disabled-column,
.user-item.with-billing .disabled-cell { flex: 0 0 9%; min-width: 70px; }

/* Lista de usuarios */
.users-list {
  max-height: calc(100vh - 400px);
  overflow-y: auto;
  border-bottom: 1px solid #e5e7eb;
}

.user-item {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
}

.user-item:hover {
  background-color: #f8fafc;
}

.user-item.selected {
  background-color: rgba(59, 130, 246, 0.05);
  border-left: 4px solid var(--p-primary-500);
}

.user-item.even {
  background-color: #fafafa;
}

/* Celdas de la lista */
.id-cell, .name-cell, .email-cell, .device-count-cell, .user-count-cell, 
.pending-count-cell, .pending-balance-cell, .due-date-cell, .admin-cell, .disabled-cell {
  padding: 6px 8px;
  display: flex;
  align-items: center;
  border-right: 1px solid #f1f5f9;
  box-sizing: border-box;
}

.user-item > div:last-child {
  border-right: none !important;
}

.id-column {
  width: 80px;
  justify-content: center;
  font-weight: 600;
}

.id-cell {
  flex: 0 0 80px;
  min-width: 80px;
  justify-content: center;
}

.name-cell {
  flex: 1 1 200px;
  min-width: 150px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.email-cell {
  flex: 1 1 200px;
  min-width: 140px;
  text-overflow: ellipsis;
  white-space: nowrap;
}



.pending-count-cell {
  flex: 0 0 8%; min-width: 70px;
  justify-content: center;
}

.pending-balance-cell {
  flex: 0 0 10%; min-width: 80px;
  justify-content: center;
  font-size: 0.85rem;
}

.due-date-cell {
  flex: 0 0 9%; min-width: 75px;
  justify-content: center;
  font-size: 0.85rem;
}

.device-count-cell {
  flex: 0 0 90px; min-width: 80px;
  justify-content: center;
}

.user-count-cell {
  flex: 0 0 90px; min-width: 80px;
  justify-content: center;
}

.admin-cell {
  flex: 0 0 90px; min-width: 80px;
  justify-content: center;
}

.disabled-cell {
  flex: 0 0 90px; min-width: 80px;
  justify-content: center;
}

.clickable-cell {
  cursor: pointer;
  background: rgba(59, 130, 246, 0.1);
  transition: all 0.2s ease;
}

.clickable-cell:hover {
  background: rgba(59, 130, 246, 0.2);
}

.count-text {
  margin-left: 4px;
  font-weight: 600;
}

.clickable {
  cursor: pointer;
}

/* Responsivo - Móviles */
@media (max-width: 768px) {
  .users-dialog {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100vh !important;
    max-height: 100vh !important;
    margin: 0 !important;
    border-radius: 0 !important;
    overflow: hidden;
  }
  
  .modal-header-full {
    padding: 10px 16px;
    font-size: 0.9rem;
  }
  
  /* Cards de estadísticas - diseño móvil compacto */
  .users-stats-card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    padding: 8px;
    margin-bottom: 12px;
    overflow-x: hidden;
  }
  
  .users-stat-item {
    padding: 6px 8px;
    min-height: 50px;
    font-size: 0.8rem;
    min-width: 0;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .stat-icon {
    font-size: 1rem !important;
    margin-bottom: 2px;
  }
  
  .stat-number {
    font-size: 1.1rem;
    margin: 2px 0;
  }
  
  .stat-label {
    font-size: 0.65rem;
    line-height: 1.2;
  }
  
  /* Búsqueda en móvil */
  .search-container {
    padding: 0 12px;
    margin-bottom: 16px;
    display: flex !important;
    flex-direction: row !important;
    gap: 8px !important;
    align-items: stretch;
  }
  
  .modern-input {
    flex: 1 !important;
    min-width: 0 !important;
  }
  
  .add-user-btn {
    margin-top: 0 !important;
    width: auto !important;
    min-width: 80px !important;
    height: 44px !important;
    padding: 0 16px !important;
    flex-shrink: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 8px !important;
    font-size: 0.85rem !important;
  }
  
  .add-user-btn i {
    margin-right: 6px !important;
    font-size: 16px !important;
  }
  
  .add-user-btn span {
    display: inline !important;
    white-space: nowrap !important;
  }
  
  /* OCULTAR TABLA COMPLETA EN MÓVIL */
  .table-header,
  .users-list {
    display: none !important;
  }
  
  /* CREAR VISTA DE TARJETAS PARA MÓVIL - COMPACTA */
  .mobile-users-list {
    display: block !important;
    padding: 0 8px;
    max-height: calc(100vh - 280px);
    overflow-y: auto;
    overflow-x: hidden;
  }
  
  .mobile-user-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    margin-bottom: 8px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    width: 100%;
    box-sizing: border-box;
  }
  
  .mobile-user-card.selected {
    border-color: var(--p-primary-500);
    background-color: rgba(59, 130, 246, 0.05);
  }
  
  .mobile-user-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #f1f5f9;
    min-width: 0;
  }
  
  .mobile-user-name {
    font-weight: 600;
    font-size: 0.9rem;
    color: #1f2937;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }
  
  .mobile-user-id {
    font-size: 0.7rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 4px;
    border-radius: 3px;
    flex-shrink: 0;
    margin-left: 8px;
  }
  
  .mobile-user-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .mobile-info-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    min-width: 0;
  }
  
  .mobile-info-item span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  
  .mobile-info-icon {
    width: 14px;
    text-align: center;
    color: var(--p-primary-600);
    flex-shrink: 0;
  }
  
  .mobile-user-status {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .mobile-user-status .el-tag {
    font-size: 0.65rem !important;
    padding: 1px 4px !important;
    line-height: 1.3 !important;
  }
  
  .mobile-billing-info {
    background: #f8fafc;
    padding: 6px;
    border-radius: 4px;
    margin-top: 6px;
    font-size: 0.75rem;
  }
  
  .mobile-billing-info > div {
    margin-bottom: 2px !important;
  }
  
  /* Footer móvil - botones apropiados */
  .el-dialog__footer {
    padding: 16px !important;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .el-dialog__footer > div {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
    gap: 8px;
    max-width: 100%;
  }
  
  .el-dialog__footer .el-button {
    min-width: 44px !important;
    height: 44px !important;
    width: 100% !important;
    padding: 8px !important;
    font-size: 16px !important;
    border-radius: 8px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  .el-dialog__footer .el-button i {
    margin: 0 !important;
    font-size: 18px !important;
  }
  
  .el-dialog__footer .el-button span {
    display: none !important;
  }
}

/* Responsivo - Tablets */
@media (min-width: 769px) and (max-width: 1024px) {
  .users-dialog {
    max-height: 95vh;
  }
  
  /* Mantener tabla en tablets pero optimizada */
  .table-header.with-billing .due-date-column,
  .user-item.with-billing .due-date-cell {
    display: none;
  }
  
  .pending-balance-column, .pending-balance-cell {
    font-size: 0.75rem;
  }
  
  /* Iconos en lugar de texto en tablets */
  .desktop-text {
    display: none;
  }
  
  .tablet-icon {
    display: inline-block !important;
  }
  
  /* Footer responsivo en tablets */
  .el-dialog__footer {
    padding: 12px !important;
  }
  
  .el-dialog__footer > div {
    display: flex !important;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-start;
  }
  
  .el-dialog__footer .el-button {
    min-width: 36px !important;
    height: 36px !important;
    width: auto !important;
    padding: 6px 8px !important;
    font-size: 14px !important;
    flex: 0 0 auto;
  }
  
  .el-dialog__footer .el-button i {
    margin: 0 !important;
  }
  
  .el-dialog__footer .el-button span {
    display: none !important;
  }
}

/* Desktop - Mostrar texto completo */
@media (min-width: 1025px) {
  .desktop-text {
    display: inline;
  }
  
  .tablet-icon {
    display: none !important;
  }
  
  /* Ancho óptimo en desktop */
  .users-dialog {
    min-width: 1200px !important;
    max-width: none !important;
    width: 1200px !important;
  }
  
  .users-dialog .el-dialog {
    min-width: 1200px !important;
    max-width: none !important;
    width: 1200px !important;
  }
  
  /* Footer en desktop - mantener comportamiento original */
  .el-dialog__footer {
    padding: 20px !important;
  }
  
  .el-dialog__footer .el-button {
    min-width: auto !important;
    width: auto !important;
    padding: 8px 15px !important;
    font-size: 14px !important;
  }
  
  .el-dialog__footer .el-button span {
    display: inline;
  }
}

/* Ocultar iconos por defecto */
.tablet-icon {
  display: none;
}

/* Ocultar vista móvil por defecto */
.mobile-users-list {
  display: none;
}

/* Estilos base para el footer */
.el-dialog__footer {
  border-top: 1px solid #e0e0e0;
}

.el-dialog__footer > div {
  display: flex;
  gap: 5px;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
}

.el-dialog__footer .el-button {
  flex-shrink: 0;
  white-space: nowrap;
}

/* Estilos para el modal de importación de usuarios (copiados de DeviceImportModal) */
.import-container {
  padding: 20px;
  min-height: 500px;
}

.step-content {
  min-height: 400px;
}

.step-header {
  text-align: center;
  margin-bottom: 30px;
}

.step-header h3 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.step-header p {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.file-upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafcff;
  margin-bottom: 30px;
}

.file-upload-area:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  transition: color 0.3s ease;
}

.file-upload-area:hover .upload-icon {
  color: #409eff;
}

.upload-text {
  font-size: 16px;
  color: #606266;
  margin: 0;
  font-weight: 500;
}

.upload-subtext {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.file-info {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-icon {
  font-size: 24px;
  color: #67c23a;
}

.file-name {
  font-weight: 500;
  color: #303133;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.template-section {
  text-align: center;
  margin-top: 30px;
}

.preview-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
}

.stat-box {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  text-transform: uppercase;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-value.valid {
  color: #67c23a;
}

.stat-value.error {
  color: #f56c6c;
}

.table-container {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.preview-table th,
.preview-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
  border-right: 1px solid #ebeef5;
  font-size: 13px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-table th {
  background: #fafafa;
  font-weight: 600;
  color: #606266;
  position: sticky;
  top: 0;
  z-index: 1;
}

.preview-table th:last-child,
.preview-table td:last-child {
  border-right: none;
}

.error-cell {
  background: #fef0f0;
  color: #f56c6c;
}

.error-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.error-tag {
  background: #f56c6c;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.preview-note {
  text-align: center;
  margin-top: 15px;
}

.alert-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f0f9ff;
  color: #1f2937;
  border-radius: 6px;
  font-size: 13px;
}

.progress-container {
  margin: 30px 0;
}

.progress-bar {
  position: relative;
  background: #f5f7fa;
  border-radius: 10px;
  height: 20px;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  transition: width 0.3s ease;
  border-radius: 10px;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.progress-stats {
  display: flex;
  justify-content: space-around;
  background: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.stat {
  text-align: center;
}

.stat .label {
  font-size: 12px;
  color: #909399;
  display: block;
  margin-bottom: 5px;
}

.stat .value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.stat .value.success {
  color: #67c23a;
}

.stat .value.error {
  color: #f56c6c;
}

.current-device {
  text-align: center;
  margin-top: 15px;
}

.processing-tag {
  background: #e1f3d8;
  color: #529b2e;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 500;
}

.import-log {
  margin-top: 30px;
}

.import-log h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.log-container {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 15px;
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px solid #ebeef5;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry.success {
  color: #67c23a;
}

.log-entry.error {
  color: #f56c6c;
}

.result-summary {
  text-align: center;
  margin: 30px 0;
}

.result-icon {
  margin-bottom: 20px;
}

.result-icon i {
  font-size: 64px;
}

.result-icon i.success {
  color: #67c23a;
}

.result-icon i.error {
  color: #f56c6c;
}

.result-summary h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.result-summary p {
  color: #909399;
  margin: 0 0 30px 0;
  font-size: 16px;
}

.final-stats {
  display: flex;
  justify-content: space-around;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.error-details {
  margin-top: 30px;
}

.error-details h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.error-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
}

.error-table th,
.error-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
  font-size: 13px;
}

.error-table th {
  background: #fafafa;
  font-weight: 600;
  color: #606266;
}

.error-table tr:last-child td {
  border-bottom: none;
}

/* Estilos para el indicador de pasos */
.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 30px 0 40px 0;
  padding: 0 20px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 120px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
  background: #f5f7fa;
  color: #909399;
  border: 2px solid #e4e7ed;
  transition: all 0.3s ease;
}

.step-item.active .step-number {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.step-item.completed .step-number {
  background: #67c23a;
  color: white;
  border-color: #67c23a;
}

.step-item.completed .step-number:before {
  content: "✓";
  font-weight: bold;
}

.step-title {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  max-width: 100px;
  line-height: 1.2;
}

.step-item.active .step-title {
  color: #409eff;
  font-weight: 600;
}

.step-item.completed .step-title {
  color: #67c23a;
  font-weight: 600;
}

.step-line {
  flex: 1;
  height: 2px;
  background: #e4e7ed;
  margin: 0 10px;
  max-width: 80px;
  transition: all 0.3s ease;
}

.step-line.completed {
  background: #67c23a;
}

@media (max-width: 768px) {
  .steps-indicator {
    margin: 20px 0 30px 0;
  }
  
  .step-item {
    min-width: 80px;
  }
  
  .step-number {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }
  
  .step-title {
    font-size: 10px;
    max-width: 60px;
  }
}

/* === ESTILOS PARA EXPANSIÓN DE FILAS === */

/* Columna de acciones */
.actions-column {
  flex: 0 0 12%;
  min-width: 120px;
  text-align: center;
}

.actions-cell {
  flex: 0 0 12%;
  min-width: 120px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #f1f5f9;
}

.actions-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  --el-button-size: 24px;
  --el-button-padding: 4px 8px;
  --el-button-font-size: 11px;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 50px;
}

.action-btn i {
  margin-right: 2px;
  font-size: 10px;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* Fila expandida */
.expanded-row {
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-left: 4px solid var(--p-primary-500);
  animation: expandIn 0.3s ease-out;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
  margin-left: 60px; /* Reducir separación */
}

@keyframes expandIn {
  from {
    opacity: 0;
    max-height: 0;
    transform: scaleY(0);
  }
  to {
    opacity: 1;
    max-height: 400px;
    transform: scaleY(1);
  }
}

.expanded-content {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.expanded-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.expanded-icon {
  color: var(--p-primary-600);
  font-size: 16px;
  margin-right: 8px;
}

.expanded-title {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  flex: 1;
}

.pdf-btn {
  margin-right: 8px;
  --el-button-size: 28px;
  padding: 6px 12px;
  background: #2980b9;
  border-color: #2980b9;
}

.pdf-btn:hover {
  background: #3498db;
  border-color: #3498db;
}

.pdf-btn i {
  font-size: 14px;
}

.close-btn {
  --el-button-text-color: #9ca3af;
  --el-button-hover-text-color: #ef4444;
  --el-button-size: 20px;
  --el-button-padding: 0;
}

.expanded-list {
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.expanded-list::-webkit-scrollbar {
  width: 6px;
}

.expanded-list::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 3px;
}

.expanded-list::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.expanded-list::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.no-data {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-style: italic;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #d1d5db;
}

.expanded-item {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.expanded-item:hover {
  border-color: var(--p-primary-300);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.expanded-item:last-child {
  margin-bottom: 0;
}

.item-main {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.item-id {
  background: var(--p-primary-100);
  color: var(--p-primary-700);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-right: 12px;
  min-width: 40px;
  text-align: center;
}

.item-name {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  flex: 1;
}

.item-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.item-detail {
  display: flex;
  align-items: center;
  color: #6b7280;
  font-size: 12px;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.item-detail i {
  margin-right: 4px;
  font-size: 10px;
  color: var(--p-primary-500);
}

.item-details-inline {
  color: #6b7280;
  font-size: 12px;
  margin-top: 4px;
}

.item-details-inline span {
  margin-right: 8px;
}

.item-header {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

.item-name-fixed {
  width: 300px; /* Ancho ampliado para el nombre */
  flex-shrink: 0;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  margin-right: 20px;
  word-wrap: break-word;
}

.item-details-inline {
  flex: 1;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
}

/* Estilos para status de dispositivos */
.status-online {
  color: #16a34a !important;
  font-weight: 600;
}

.status-offline {
  color: #dc2626 !important;
  font-weight: 600;
}

.status-unknown {
  color: #f59e0b !important;
  font-weight: 600;
}

/* Responsive para columna de acciones */
@media (max-width: 1200px) {
  .actions-column,
  .actions-cell {
    flex: 0 0 10%;
    min-width: 100px;
  }
  
  .action-btn {
    --el-button-font-size: 10px;
    --el-button-padding: 3px 6px;
    min-width: 45px;
  }
}

@media (max-width: 768px) {
  .actions-column,
  .actions-cell {
    display: none;
  }
  
  .expanded-content {
    padding: 12px 16px;
  }
  
  .expanded-item {
    padding: 10px 12px;
  }
  
  .item-details {
    flex-direction: column;
    gap: 6px;
  }
}

/* Variables CSS para colores primarios */
:root {
  --p-primary-100: #dbeafe;
  --p-primary-300: #93c5fd;
  --p-primary-500: #3b82f6;
  --p-primary-600: #2563eb;
  --p-primary-700: #1d4ed8;
}
</style>

<style>
/* CSS global para forzar el estilo del header */
.users-dialog .el-dialog__header {
  padding: 0 !important;
}

.users-dialog .el-dialog__title {
  color: #1f2937 !important;
  font-weight: 600 !important;
}

.users-dialog .el-dialog__body {
  padding: 0 !important;
}

/* Forzar ancho fijo en desktop */
@media (min-width: 1025px) {
  .users-dialog .el-dialog {
    min-width: 1200px !important;
    max-width: none !important;
    width: 1200px !important;
  }
  
  .users-dialog .el-dialog__wrapper {
    min-width: 1200px !important;
  }
}
</style>