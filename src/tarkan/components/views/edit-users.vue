<template>
  <el-dialog 
    class="users-dialog users-dialog--mitapp" 
    :lock-scroll="true" 
    :top="'50px'" 
    :width="'70%'" 
    v-model="show"
    @opened="handleModalOpened"
    @closed="handleModalClosed"
  >
    <!-- MITAPP: Header com gradiente laranja MIT -->
    <template #header>
      <div class="users-modal-header">
        <div class="header-content">
          <i class="fas fa-users header-icon"></i>
          <div class="header-title">{{ KT('user.users') }}</div>
        </div>
      </div>
    </template>

    <!-- Conteúdo do modal -->
    <div class="users-modal-body">
      <!-- MITAPP: Cards de Estatísticas - Grid 4 colunas (desktop) -->
      <div class="users-stats-grid">
        <div 
          class="stat-card stat-card--total" 
          :class="{ active: selectedFilter === 'all' }" 
          @click="filterBy('all')"
        >
          <i class="fas fa-users stat-icon"></i>
          <div class="stat-content">
            <div class="stat-number">{{ totalUsers }}</div>
            <div class="stat-label">{{ KT('total') || 'Total' }}</div>
          </div>
        </div>
        
        <div 
          class="stat-card stat-card--admin" 
          :class="{ active: selectedFilter === 'admin' }" 
          @click="filterBy('admin')"
        >
          <i class="fas fa-user-shield stat-icon"></i>
          <div class="stat-content">
            <div class="stat-number">{{ adminCount }}</div>
            <div class="stat-label">{{ KT('user.admins') || 'Admins' }}</div>
          </div>
        </div>
        
        <div 
          class="stat-card stat-card--suspended" 
          :class="{ active: selectedFilter === 'suspended' }" 
          @click="filterBy('suspended')"
        >
          <i class="fas fa-user-lock stat-icon"></i>
          <div class="stat-content">
            <div class="stat-number">{{ suspendedCount }}</div>
            <div class="stat-label">{{ KT('user.suspended') || 'Suspensos' }}</div>
          </div>
        </div>

        <!-- MITAPP: Card "Devedores" (condicional) -->
        <div 
          v-if="showDebtorsCard"
          class="stat-card stat-card--debtors" 
          :class="{ active: selectedFilter === 'debtors' }" 
          @click="filterBy('debtors')"
        >
          <i class="fas fa-exclamation-triangle stat-icon"></i>
          <div class="stat-content">
            <div class="stat-number">{{ debtorsCount }}</div>
            <div class="stat-label">{{ KT('user.debtors') || 'Devedores' }}</div>
          </div>
        </div>
      </div>

      <!-- Toolbar de Busca -->
      <div class="users-toolbar">
        <el-input 
          v-model="query" 
          :placeholder="KT('user.search') || 'Buscar usuário'" 
          clearable
          class="search-input"
        >
          <template #prefix>
            <i class="fas fa-search"></i>
          </template>
        </el-input>
        
        <div class="users-toolbar-meta">
          <span class="meta-text">
            {{ KT('showing') || 'Mostrando' }}
            <b>{{ filteredUsersFinal.length }}</b>
            {{ KT('of') || 'de' }}
            <b>{{ filteredUsers.length }}</b>
          </span>

          <span
            v-if="filteredUsersFinal.length > 0"
            class="actions-hint"
            @mouseenter.stop="showTip($event, KT('common.actions') || 'Ações')"
            @mouseleave="hideTip"
          >
            <i class="fas fa-ellipsis-v"></i>
            <span>{{ KT('hint.actions') || 'Use ⋯ para ações' }}</span>
          </span>

          <el-button
            v-if="query && query.trim()"
            plain
            class="clear-btn"
            @click="query = ''"
          >
            <i class="fas fa-times"></i>
            <span class="btn-text">{{ KT('clear') || 'Limpar' }}</span>
          </el-button>
        </div>
        
        <el-button
          v-if="store.getters.advancedPermissions(17)"
          @mouseleave="hideTip" 
          @mouseenter.stop="showTip($event,KT('user.add'))"
          type="primary" 
          @click="editUserRef.newUser()"
        >
          <i class="fas fa-user-plus"></i>
          <span class="btn-text">{{ KT('user.add') || 'Adicionar' }}</span>
        </el-button>
      </div>

      <!-- Área principal (tabela desktop / cards mobile) -->
      <div class="users-content">
        <!-- Empty State -->
        <div v-if="filteredUsersFinal.length === 0" class="users-empty">
          <i class="fas fa-user-slash empty-icon"></i>

          <div class="empty-title">
            {{ KT('user.noResults') || 'Nenhum usuário encontrado' }}
          </div>

          <div class="empty-subtitle">
            {{ KT('user.tryAdjustFilters') || 'Tente ajustar a busca ou os filtros acima.' }}
          </div>

          <div class="empty-actions">
            <el-button plain @click="selectedFilter = 'all'">
              <i class="fas fa-filter"></i>
              <span class="btn-text">{{ KT('total') || 'Total' }}</span>
            </el-button>

            <el-button plain @click="query = ''" :disabled="!(query && query.trim())">
              <i class="fas fa-eraser"></i>
              <span class="btn-text">{{ KT('clear') || 'Limpar busca' }}</span>
            </el-button>

            <el-button
              v-if="store.getters.advancedPermissions(17)"
              type="primary"
              @click="editUserRef.newUser()"
            >
              <i class="fas fa-user-plus"></i>
              <span class="btn-text">{{ KT('user.add') || 'Adicionar' }}</span>
            </el-button>
          </div>
        </div>

        <!-- DESKTOP: Tabela de Usuários -->
        <el-table 
          v-else
          class="users-table users-table--desktop"
          :data="filteredUsersFinal" 
          stripe
          highlight-current-row
          @row-click="handleRowClick"
          :row-class-name="getRowClass"
          height="100%"
          style="width: 100%"
        >
          <el-table-column 
            prop="id" 
            :label="KT('user.id')" 
            width="80"
          >
            <template #header>
              <div class="sortable-header" @click.stop="toggleSorting('id')">
                {{ KT('user.id') }}
                <i v-if="sorting==='id-asc'" class="fas fa-sort-up"></i>
                <i v-else-if="sorting==='id-desc'" class="fas fa-sort-down"></i>
                <i v-else class="fas fa-sort sort-inactive"></i>
              </div>
            </template>
          </el-table-column>

          <el-table-column 
            prop="name" 
            :label="KT('user.name')" 
            min-width="240"
          >
            <template #header>
              <div class="sortable-header" @click.stop="toggleSorting('name')">
                {{ KT('user.name') }}
                <i v-if="sorting==='name-asc'" class="fas fa-sort-up"></i>
                <i v-else-if="sorting==='name-desc'" class="fas fa-sort-down"></i>
                <i v-else class="fas fa-sort sort-inactive"></i>
              </div>
            </template>

            <template #default="{ row }">
              <div class="user-cell">
                <div class="user-avatar" :title="row.name">
                  {{ getInitials(row.name) }}
                </div>

                <div class="user-main">
                  <div class="user-name">{{ row.name }}</div>
                  <div class="user-sub">
                    <el-tag v-if="getEmailDomain(row.email)" type="info" effect="plain" size="small">
                      {{ getEmailDomain(row.email) }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column 
            prop="email" 
            :label="KT('user.email')" 
            min-width="220"
          >
            <template #header>
              <div class="sortable-header" @click.stop="toggleSorting('email')">
                {{ KT('user.email') }}
                <i v-if="sorting==='email-asc'" class="fas fa-sort-up"></i>
                <i v-else-if="sorting==='email-desc'" class="fas fa-sort-down"></i>
                <i v-else class="fas fa-sort sort-inactive"></i>
              </div>
            </template>
          </el-table-column>

          <!-- MITAPP: Coluna Dispositivos (nova) -->
          <el-table-column label="Dispositivos" width="130" align="center">
            <template #default="{ row }">
              <div 
                class="clickable-count device-count"
                @click.stop="showDevicesModal(row.id)"
                @dblclick.stop="refreshUserCounts(row.id)"
                @mouseenter.stop="showTip($event, 'Clique: ver dispositivos | Duplo: atualizar')"
                @mouseleave="hideTip"
              >
                <i v-if="!loadingCounts[row.id]" class="fas fa-car"></i>
                <i v-else class="fas fa-spinner fa-spin"></i>
                <span>{{ getUserDeviceCount(row.id) }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- MITAPP: Coluna Usuários (nova) -->
          <el-table-column label="Usuários" width="130" align="center">
            <template #default="{ row }">
              <div 
                class="clickable-count user-count"
                @click.stop="showUsersModal(row.id)"
                @dblclick.stop="refreshUserCounts(row.id)"
                @mouseenter.stop="showTip($event, 'Clique: ver usuários | Duplo: atualizar')"
                @mouseleave="hideTip"
              >
                <i v-if="!loadingCounts[row.id]" class="fas fa-users"></i>
                <i v-else class="fas fa-spinner fa-spin"></i>
                <span>{{ getUserUserCount(row.id) }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- MITAPP: Colunas de Billing (condicionais) -->
          <el-table-column 
            v-if="showBillingColumns"
            label="Fact. Pend." 
            width="120" 
            align="center"
          >
            <template #default="{ row }">
              <span class="billing-cell">{{ getPendingInvoices(row.id) }}</span>
            </template>
          </el-table-column>

          <el-table-column 
            v-if="showBillingColumns"
            label="Saldo Pend." 
            width="140" 
            align="center"
          >
            <template #default="{ row }">
              <span class="billing-cell billing-balance">
                {{ formatCurrency(getPendingBalance(row.id)) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column 
            v-if="showBillingColumns"
            label="Últ. Venc." 
            width="120" 
            align="center"
          >
            <template #default="{ row }">
              <span class="billing-cell">{{ getLastDueDate(row.id) }}</span>
            </template>
          </el-table-column>

          <el-table-column 
            :label="KT('user.admin')" 
            width="150" 
            align="center"
          >
            <template #header>
              <div class="sortable-header" @click.stop="toggleSorting('administrator')">
                {{ KT('user.admin') }}
                <i v-if="sorting==='administrator-asc'" class="fas fa-sort-up"></i>
                <i v-else-if="sorting==='administrator-desc'" class="fas fa-sort-down"></i>
                <i v-else class="fas fa-sort sort-inactive"></i>
              </div>
            </template>
            <template #default="{ row }">
              <el-tag v-if="row.administrator" type="danger" effect="plain" size="small">
                <i class="fas fa-crown"></i> {{ KT('user.admin') || 'Admin' }}
              </el-tag>
              <el-tag v-else type="info" effect="plain" size="small">
                {{ KT('user.user') || 'Usuário' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column 
            :label="KT('user.disabled')" 
            width="140" 
            align="center"
          >
            <template #header>
              <div class="sortable-header" @click.stop="toggleSorting('disabled')">
                {{ KT('user.disabled') }}
                <i v-if="sorting==='disabled-asc'" class="fas fa-sort-up"></i>
                <i v-else-if="sorting==='disabled-desc'" class="fas fa-sort-down"></i>
                <i v-else class="fas fa-sort sort-inactive"></i>
              </div>
            </template>
            <template #default="{ row }">
              <el-tag v-if="row.disabled" type="danger" size="small">
                {{ KT('user.suspended') || 'Suspenso' }}
              </el-tag>
              <el-tag v-else type="success" size="small">
                {{ KT('user.active') || 'Ativo' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column
            :label="KT('common.actions') || 'Ações'"
            width="90"
            align="center"
          >
            <template #default="{ row }">
              <el-dropdown
                trigger="click"
                placement="bottom-end"
                @command="(cmd) => handleRowAction(cmd, row)"
              >
                <el-button
                  class="row-actions-btn"
                  circle
                  plain
                  size="small"
                  @click.stop
                  @mouseenter.stop="showTip($event, KT('common.actions') || 'Ações')"
                  @mouseleave="hideTip"
                >
                  <i class="fas fa-ellipsis-v"></i>
                </el-button>

                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-if="store.getters.advancedPermissions(18)"
                      command="edit"
                    >
                      <i class="fas fa-user-edit"></i>
                      <span class="dd-text">{{ KT('user.edit') || 'Editar' }}</span>
                    </el-dropdown-item>

                    <el-dropdown-item
                      v-if="store.getters.advancedPermissions(19)"
                      command="delete"
                      class="danger-item"
                    >
                      <i class="fas fa-user-minus"></i>
                      <span class="dd-text">{{ KT('user.remove') || 'Remover' }}</span>
                    </el-dropdown-item>

                    <el-dropdown-item
                      v-if="store.state.auth.administrator"
                      command="logs"
                    >
                      <i class="fas fa-clipboard-list"></i>
                      <span class="dd-text">{{ KT('user.logs') || 'Logs' }}</span>
                    </el-dropdown-item>

                    <el-dropdown-item
                      v-if="store.getters.advancedPermissions(16) && store.getters.advancedPermissions(18)"
                      command="link_users"
                      :disabled="!(row && (row.userLimit===-1 || row.userLimit>0))"
                    >
                      <i class="fas fa-users"></i>
                      <span class="dd-text">{{ KT('user.users') || 'Usuários' }}</span>
                    </el-dropdown-item>

                    <el-dropdown-item
                      v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(8)"
                      command="link_devices"
                    >
                      <i class="fas fa-car"></i>
                      <span class="dd-text">{{ KT('device.devices') || 'Dispositivos' }}</span>
                    </el-dropdown-item>

                    <el-dropdown-item
                      v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(40)"
                      command="link_geofences"
                    >
                      <i class="fas fa-draw-polygon"></i>
                      <span class="dd-text">{{ KT('geofence.geofences') || 'Geocercas' }}</span>
                    </el-dropdown-item>

                    <el-dropdown-item
                      v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(48)"
                      command="link_groups"
                    >
                      <i class="far fa-object-group"></i>
                      <span class="dd-text">{{ KT('group.groups') || 'Grupos' }}</span>
                    </el-dropdown-item>

                    <el-dropdown-item
                      v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(32)"
                      command="link_notifications"
                    >
                      <i class="far fa-envelope"></i>
                      <span class="dd-text">{{ KT('notification.notifications') || 'Notificações' }}</span>
                    </el-dropdown-item>

                    <el-dropdown-item
                      v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(88)"
                      command="link_calendars"
                    >
                      <i class="far fa-calendar-alt"></i>
                      <span class="dd-text">{{ KT('calendar.calendars') || 'Calendários' }}</span>
                    </el-dropdown-item>

                    <el-dropdown-item
                      v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(64)"
                      command="link_attributes"
                    >
                      <i class="fas fa-server"></i>
                      <span class="dd-text">{{ KT('attribute.computedAttributes') || 'Atributos' }}</span>
                    </el-dropdown-item>

                    <el-dropdown-item
                      v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(56)"
                      command="link_commands"
                    >
                      <i class="far fa-keyboard"></i>
                      <span class="dd-text">{{ KT('command.savedCommands') || 'Comandos' }}</span>
                    </el-dropdown-item>

                    <!-- MITAPP: Ações extras (drivers, maintenance) -->
                    <el-dropdown-item
                      v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(80)"
                      command="link_drivers"
                    >
                      <i class="fas fa-user-tag"></i>
                      <span class="dd-text">{{ KT('driver.drivers') || 'Motoristas' }}</span>
                    </el-dropdown-item>

                    <el-dropdown-item
                      v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(96)"
                      command="link_maintenance"
                    >
                      <i class="fas fa-tools"></i>
                      <span class="dd-text">{{ KT('maintenance.maintenance') || 'Manutenção' }}</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>

        <!-- MITAPP: MOBILE - Cards View -->
        <div v-if="filteredUsersFinal.length > 0" class="mobile-users-list">
          <div
            v-for="user in filteredUsersFinal"
            :key="user.id"
            class="mobile-user-card"
            :class="{ selected: selected === user.id }"
            @click="selected = user.id"
            @dblclick="editUserRef?.editUser(user.id)"
          >
            <div class="mobile-user-header">
              <div class="mobile-user-avatar">{{ getInitials(user.name) }}</div>
              <div class="mobile-user-info">
                <div class="mobile-user-name">{{ user.name }}</div>
                <div class="mobile-user-email">{{ user.email }}</div>
              </div>
              <div class="mobile-user-id">ID: {{ user.id }}</div>
            </div>
            
            <div class="mobile-user-counts">
              <div class="mobile-count-item" @click.stop="showDevicesModal(user.id)">
                <i class="fas fa-car"></i>
                <span>{{ getUserDeviceCount(user.id) }}</span>
              </div>
              
              <div class="mobile-count-item" @click.stop="showUsersModal(user.id)">
                <i class="fas fa-users"></i>
                <span>{{ getUserUserCount(user.id) }}</span>
              </div>
            </div>
            
            <div class="mobile-user-status">
              <el-tag v-if="user.administrator" type="danger" size="small">
                {{ KT('user.admin') || 'Admin' }}
              </el-tag>
              <el-tag :type="user.disabled ? 'danger' : 'success'" size="small">
                {{ user.disabled ? (KT('user.suspended') || 'Suspenso') : (KT('user.active') || 'Ativo') }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MITAPP: Footer Expandido -->
    <template #footer>
      <div class="users-footer users-footer--expanded">
        <!-- Grupo 1: Ações Essenciais -->
        <div class="footer-group footer-group--actions">
          <el-button
            v-if="store.getters.advancedPermissions(19)"
            type="danger"
            :plain="selected === 0"
            :disabled="selected === 0"
            @click="doDelete()"
            @mouseenter.stop="showTip($event, KT('user.remove'))"
            @mouseleave="hideTip"
          >
            <i class="fas fa-user-minus"></i>
            <span class="btn-text">{{ KT('user.remove') || 'Remover' }}</span>
          </el-button>

          <el-button
            v-if="store.getters.advancedPermissions(18)"
            type="warning"
            :plain="selected === 0"
            :disabled="selected === 0"
            @click="editUserRef?.editUser(selected)"
            @mouseenter.stop="showTip($event, KT('user.edit'))"
            @mouseleave="hideTip"
          >
            <i class="fas fa-user-edit"></i>
            <span class="btn-text">{{ KT('user.edit') || 'Editar' }}</span>
          </el-button>

          <el-button
            v-if="store.state.server.isPlus && store.state.auth.administrator"
            plain
            :disabled="selected === 0"
            @click="logObjectsRef?.showLogs({ userId: selected })"
            @mouseenter.stop="showTip($event, KT('user.logs'))"
            @mouseleave="hideTip"
          >
            <i class="fas fa-clipboard-list"></i>
            <span class="btn-text">{{ KT('user.logs') || 'Logs' }}</span>
          </el-button>
        </div>

        <!-- Grupo 2: Relações -->
        <div class="footer-group footer-group--relations">
          <el-button
            v-if="store.getters.advancedPermissions(16) && store.getters.advancedPermissions(18)"
            plain
            :disabled="selected === 0 || !(user && (user.userLimit === -1 || user.userLimit > 0))"
            @click="handleRelationButtonClick('users')"
            @mouseenter.stop="showTip($event, KT('user.users'))"
            @mouseleave="hideTip"
          >
            <i class="fas fa-users"></i>
            <span class="btn-text">{{ KT('user.users') || 'Usuários' }}</span>
          </el-button>

          <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(8)"
            plain
            :disabled="selected === 0"
            @click="handleRelationButtonClick('devices')"
            @mouseenter.stop="showTip($event, KT('device.devices'))"
            @mouseleave="hideTip"
          >
            <i class="fas fa-car"></i>
            <span class="btn-text">{{ KT('device.devices') || 'Dispositivos' }}</span>
          </el-button>

          <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(40)"
            plain
            :disabled="selected === 0"
            @click="handleRelationButtonClick('geofences')"
            @mouseenter.stop="showTip($event, KT('geofence.geofences'))"
            @mouseleave="hideTip"
          >
            <i class="fas fa-draw-polygon"></i>
            <span class="btn-text">{{ KT('geofence.geofences') || 'Geocercas' }}</span>
          </el-button>

          <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(48)"
            plain
            :disabled="selected === 0"
            @click="handleRelationButtonClick('groups')"
            @mouseenter.stop="showTip($event, KT('group.groups'))"
            @mouseleave="hideTip"
          >
            <i class="far fa-object-group"></i>
            <span class="btn-text">{{ KT('group.groups') || 'Grupos' }}</span>
          </el-button>

          <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(32)"
            plain
            :disabled="selected === 0"
            @click="handleRelationButtonClick('notifications')"
            @mouseenter.stop="showTip($event, KT('notification.notifications'))"
            @mouseleave="hideTip"
          >
            <i class="far fa-envelope"></i>
            <span class="btn-text">{{ KT('notification.notifications') || 'Notificações' }}</span>
          </el-button>

          <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(88)"
            plain
            :disabled="selected === 0"
            @click="handleRelationButtonClick('calendars')"
            @mouseenter.stop="showTip($event, KT('calendar.calendars'))"
            @mouseleave="hideTip"
          >
            <i class="far fa-calendar-alt"></i>
            <span class="btn-text">{{ KT('calendar.calendars') || 'Calendários' }}</span>
          </el-button>

          <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(64)"
            plain
            :disabled="selected === 0"
            @click="handleRelationButtonClick('attributes')"
            @mouseenter.stop="showTip($event, KT('attribute.computedAttributes'))"
            @mouseleave="hideTip"
          >
            <i class="fas fa-server"></i>
            <span class="btn-text">{{ KT('attribute.computedAttributes') || 'Atributos' }}</span>
          </el-button>

          <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(80)"
            plain
            :disabled="selected === 0"
            @click="handleRelationButtonClick('drivers')"
            @mouseenter.stop="showTip($event, KT('driver.drivers'))"
            @mouseleave="hideTip"
          >
            <i class="fas fa-user-tag"></i>
            <span class="btn-text">{{ KT('driver.drivers') || 'Motoristas' }}</span>
          </el-button>

          <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(56)"
            plain
            :disabled="selected === 0"
            @click="handleRelationButtonClick('commands')"
            @mouseenter.stop="showTip($event, KT('command.savedCommands'))"
            @mouseleave="hideTip"
          >
            <i class="far fa-keyboard"></i>
            <span class="btn-text">{{ KT('command.savedCommands') || 'Comandos' }}</span>
          </el-button>

          <el-button
            v-if="store.getters.advancedPermissions(18) && store.getters.advancedPermissions(96)"
            plain
            :disabled="selected === 0"
            @click="handleRelationButtonClick('maintenance')"
            @mouseenter.stop="showTip($event, KT('maintenance.maintenance'))"
            @mouseleave="hideTip"
          >
            <i class="fas fa-tools"></i>
            <span class="btn-text">{{ KT('maintenance.maintenance') || 'Manutenção' }}</span>
          </el-button>
        </div>

        <!-- Grupo 3: Extras (Sessão + Exports) -->
        <div class="footer-group footer-group--extras">
          <el-button
            v-if="store.state.auth.administrator || (store.getters.advancedPermissions(16) && store.getters.advancedPermissions(18))"
            type="success"
            plain
            :disabled="selected === 0"
            @click="createSession"
            @mouseenter.stop="showTip($event, KT('user.changesession') || 'Assumir Sessão')"
            @mouseleave="hideTip"
          >
            <i class="fas fa-passport"></i>
            <span class="btn-text">{{ KT('user.changesession') || 'Sessão' }}</span>
          </el-button>

          <el-button
            type="info"
            plain
            :loading="isGeneratingPDF"
            :disabled="isGeneratingPDF || filteredUsers.length === 0"
            @click="generatePdf"
            @mouseenter.stop="showTip($event, KT('user.generatePDF') || 'Exportar PDF')"
            @mouseleave="hideTip"
          >
            <i v-if="!isGeneratingPDF" class="fas fa-file-pdf"></i>
            <i v-else class="fas fa-spinner fa-spin"></i>
            <span class="btn-text">PDF</span>
          </el-button>

          <el-button
            type="info"
            plain
            :disabled="filteredUsers.length === 0"
            @click="generateExcel"
            @mouseenter.stop="showTip($event, KT('user.generateExcel') || 'Exportar Excel')"
            @mouseleave="hideTip"
          >
            <i class="fas fa-file-excel"></i>
            <span class="btn-text">Excel</span>
          </el-button>
        </div>

        <!-- Botão Fechar (direita) -->
        <el-button plain @click="show = false" class="btn-close">
          <i class="fas fa-times"></i>
          <span class="btn-text">{{ KT('common.close') || 'Fechar' }}</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/switch/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/tab-pane/style/css'
import 'element-plus/es/components/tabs/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import 'element-plus/es/components/tag/style/css'
import 'element-plus/es/components/dropdown/style/css'
import 'element-plus/es/components/dropdown-menu/style/css'
import 'element-plus/es/components/dropdown-item/style/css'

import {ElDialog,ElMessage,ElButton,ElInput,ElTable,ElTableColumn,ElTag,ElDropdown,ElDropdownMenu,ElDropdownItem} from "element-plus";

import {ref,defineExpose,inject,computed,watch} from 'vue';
import {useStore} from 'vuex'

import {ElMessageBox} from "element-plus/es/components/message-box";
import {ElNotification} from "element-plus/es/components/notification";

const showTip = (evt,text)=>{
  window.$showTip(evt,text);
}

const hideTip = (evt,text)=>{
  window.$hideTip(evt,text);
}

const store = useStore();
const query = ref('');
const selected = ref(0);
const show = ref(false);
const selectedFilter = ref('all');

const editUserRef = inject('edit-user');
const linkObjectsRef = inject('link-objects');
const logObjectsRef = inject('log-objects');
const contextMenuRef = inject('contextMenu');

const sorting = ref('id-asc');

// MITAPP: Refs para cache de contadores
const deviceCounts = ref({})  // { userId: count }
const userCounts = ref({})    // { userId: count }
const loadingCounts = ref({}) // { userId: true/false }

// MITAPP: Refs para billing (condicional)
const userInvoices = ref({})  // { userId: [invoices] }

// MITAPP: Refs para exports
const isGeneratingPDF = ref(false)

// MITAPP: Registry de timers (prevenir memory leak)
const openTimers = ref([])
const addTimer = (id) => openTimers.value.push(id)
const clearOpenTimers = () => {
  openTimers.value.forEach(t => clearTimeout(t))
  openTimers.value = []
}

// MITAPP: Helper para checar valores definidos (não confundir 0 com undefined)
const hasValue = (v) => v !== undefined && v !== null

const toggleSorting = (s)=>{
  const p = sorting.value.split("-");

  if(p[0]===s){
    sorting.value = s+'-'+((p[1]==='asc')?'desc':'asc');
  }else{
    sorting.value = s+'-asc';
  }
}

// Helpers para avatar e chip de domínio
const getInitials = (name) => {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (first + last).toUpperCase() || '?';
};

const getEmailDomain = (email) => {
  if (!email) return '';
  const s = String(email);
  const at = s.indexOf('@');
  if (at === -1) return '';
  return s.slice(at + 1).trim().toLowerCase();
};

// Handler de clique na linha da tabela
const handleRowClick = (row) => {
  selected.value = (selected.value !== row.id) ? row.id : 0;
}

// Class name para highlight da linha selecionada
const getRowClass = ({row}) => {
  return row.id === selected.value ? 'selected-row' : '';
}

// Handler de ações por linha (menu ⋯)
const handleRowAction = (cmd, row) => {
  if (!row || !row.id) return;

  // mantém a linha "selecionada" coerente com a ação
  selected.value = row.id;

  switch (cmd) {
    case 'edit':
      editUserRef?.editUser(row.id);
      break;

    case 'delete':
      // reaproveita o fluxo atual de confirmação e segurança
      doDelete();
      break;

    case 'logs':
      logObjectsRef?.showLogs({ userId: row.id });
      break;

    case 'link_users':
      linkObjectsRef?.showObjects({ userId: row.id, type: 'users' });
      break;

    case 'link_devices':
      linkObjectsRef?.showObjects({ userId: row.id, type: 'devices' });
      break;

    case 'link_geofences':
      linkObjectsRef?.showObjects({ userId: row.id, type: 'geofences' });
      break;

    case 'link_groups':
      linkObjectsRef?.showObjects({ userId: row.id, type: 'groups' });
      break;

    case 'link_notifications':
      linkObjectsRef?.showObjects({ userId: row.id, type: 'notifications' });
      break;

    case 'link_calendars':
      linkObjectsRef?.showObjects({ userId: row.id, type: 'calendars' });
      break;

    case 'link_attributes':
      linkObjectsRef?.showObjects({ userId: row.id, type: 'attributes' });
      break;

    case 'link_commands':
      linkObjectsRef?.showObjects({ userId: row.id, type: 'commands' });
      break;

    // MITAPP: ações extras
    case 'link_drivers':
      linkObjectsRef?.showObjects({ userId: row.id, type: 'drivers' });
      break;

    case 'link_maintenance':
      linkObjectsRef?.showObjects({ userId: row.id, type: 'maintenance' });
      break;
  }
};

// Helper para garantir array (getter pode ser array ou função)
const getUsersList = () => {
  const g = store.getters['users/getUsers'];
  return Array.isArray(g) ? g : (typeof g === 'function' ? g() : []);
};

const filteredUsers = computed(() => {
  const p = sorting.value.split("-");
  const q = (query.value || '').trim().toLowerCase();

  return [...getUsersList()]
    .filter((f) => {
      // Oculta usuário com ID 1 apenas se o usuário logado não for o ID 1
      if (f.id === 1 && store.state.auth.id !== 1) return false;

      // sem query => não filtra (mantém tudo)
      if (!q) return true;

      // campos principais
      for (let k of Object.keys(f)) {
        const v = f[k];
        if (v !== null && v !== undefined && String(v).toLowerCase().includes(q)) return true;
      }

      // attributes safe
      const attrs = f?.attributes || {};
      for (let k of Object.keys(attrs)) {
        const v = attrs[k];
        if (v !== null && v !== undefined && String(v).toLowerCase().includes(q)) return true;
      }

      return false;
    })
    .sort((a, b) => {
      // FIX: Comparador estável para booleanos
      if (p[0] === 'administrator' || p[0] === 'disabled') {
        const aN = a[p[0]] ? 1 : 0
        const bN = b[p[0]] ? 1 : 0
        return p[1] === 'asc' ? (aN - bN) : (bN - aN)
      } else if (p[0] === 'name') {
        if (p[1] === 'asc') {
          return (a[p[0]].localeCompare(b[p[0]]));
        } else {
          const t = (a[p[0]].localeCompare(b[p[0]]));
          return (t === 1) ? -1 : ((t === -1) ? 1 : 0);
        }
      } else if (!a[p[0]] || !b[p[0]]) {
        return (p[1] === 'desc') ? 1 : -1;
      } else if (p[0] === 'created_at') {
        if (new Date(a[p[0]]) < new Date(b[p[0]])) {
          return (p[1] === 'asc') ? 1 : -1;
        } else if (new Date(a[p[0]]) > new Date(b[p[0]])) {
          return (p[1] === 'desc') ? 1 : -1;
        } else {
          return 0;
        }
      } else if (a[p[0]] > b[p[0]]) {
        return (p[1] === 'asc') ? 1 : -1;
      } else if (a[p[0]] < b[p[0]]) {
        return (p[1] === 'desc') ? 1 : -1;
      } else {
        return 0;
      }
    });
})

// MITAPP: Computed para contar devedores
const debtorsCount = computed(() => {
  return filteredUsers.value.filter(user => {
    const invoices = userInvoices.value[user.id] || []
    return invoices.some(inv => inv.status === 'pending' && inv.balance > 0)
  }).length
})

// MITAPP: Computed para verificar se deve mostrar card/colunas de billing
const showDebtorsCard = computed(() => {
  return store.state.auth.administrator && 
         store.state.server.modules?.includes?.('invoices')
})

const showBillingColumns = computed(() => {
  return store.state.auth.administrator && 
         store.state.server.modules?.includes?.('invoices')
})

// Computed para aplicar filtro de estatísticas
const filteredUsersFinal = computed(() => {
  const baseFiltered = filteredUsers.value;
  
  if (selectedFilter.value === 'all') {
    return baseFiltered;
  } else if (selectedFilter.value === 'admin') {
    return baseFiltered.filter(u => u.administrator === true);
  } else if (selectedFilter.value === 'suspended') {
    return baseFiltered.filter(u => u.disabled === true);
  } else if (selectedFilter.value === 'debtors') {
    // MITAPP: filtro devedores
    return baseFiltered.filter(user => {
      const invoices = userInvoices.value[user.id] || []
      return invoices.some(inv => inv.status === 'pending' && inv.balance > 0)
    })
  }
  
  return baseFiltered;
});

// Estatísticas computadas
const totalUsers = computed(() => filteredUsers.value.length);
const adminCount = computed(() => filteredUsers.value.filter(u => u.administrator).length);
const suspendedCount = computed(() => filteredUsers.value.filter(u => u.disabled).length);

// Computed para obter o usuário selecionado (para footer)
const user = computed(() => {
  if (selected.value === 0) return null
  return store.getters['users/getUser']?.(selected.value) || null
})

// Função para filtrar por tipo
const filterBy = (type) => {
  selectedFilter.value = type;
};

// Watch para resetar selected quando não estiver mais visível
watch(() => filteredUsersFinal.value, (newList) => {
  if (selected.value !== 0) {
    const isVisible = newList.some(u => u.id === selected.value);
    if (!isVisible) {
      selected.value = 0;
    }
  }
});

// Watch para limpar seleção ao trocar filtro (melhor UX)
watch(selectedFilter, () => {
  selected.value = 0;
});

// MITAPP: Watch para limpar cache ao fechar modal (prevenir memory leak)
watch(show, (newVal) => {
  if (!newVal) {
    // FIX: Limpar timers primeiro
    clearOpenTimers()
    
    // Limpar todos os caches
    deviceCounts.value = {}
    userCounts.value = {}
    loadingCounts.value = {}
    userInvoices.value = {}
    selected.value = 0
  }
})

// MITAPP: Funções para contadores de Dispositivos/Usuários
const getUserDeviceCount = (userId) => {
  if (loadingCounts.value[userId]) return '...'
  const v = deviceCounts.value[userId]
  return hasValue(v) ? v : '-'
}

const getUserUserCount = (userId) => {
  if (loadingCounts.value[userId]) return '...'
  const v = userCounts.value[userId]
  return hasValue(v) ? v : '-'
}

const showDevicesModal = async (userId) => {
  if (!userId) return
  
  // PERFORMANCE: Carregar contador se ainda não existe (lazy load)
  // FIX: Usar hasValue para não recarregar quando valor é 0
  if (!hasValue(deviceCounts.value[userId])) {
    await refreshUserCounts(userId)
  }
  
  linkObjectsRef?.showObjects({ userId, type: 'devices' })
}

const showUsersModal = async (userId) => {
  if (!userId) return
  
  // PERFORMANCE: Carregar contador se ainda não existe (lazy load)
  // FIX: Usar hasValue para não recarregar quando valor é 0
  if (!hasValue(userCounts.value[userId])) {
    await refreshUserCounts(userId)
  }
  
  linkObjectsRef?.showObjects({ userId, type: 'users' })
}

const refreshUserCounts = async (userId) => {
  if (!userId || loadingCounts.value[userId]) return
  
  loadingCounts.value[userId] = true
  try {
    // Tentar carregar devices e users em paralelo
    const [devices, users] = await Promise.all([
      store.dispatch('users/getUserDevices', userId).catch(() => []),
      store.dispatch('users/getUserUsers', userId).catch(() => [])
    ])
    
    deviceCounts.value[userId] = devices?.length || 0
    userCounts.value[userId] = users?.length || 0
  } catch (error) {
    console.error('Erro ao carregar contadores:', error)
    // FIX: Usar null para distinguir erro de valor 0 real
    deviceCounts.value[userId] = null
    userCounts.value[userId] = null
  } finally {
    loadingCounts.value[userId] = false
  }
}

// MITAPP: Funções para Billing (condicional)
const getPendingInvoices = (userId) => {
  const invoices = userInvoices.value[userId] || []
  return invoices.filter(inv => inv.status === 'pending').length
}

const getPendingBalance = (userId) => {
  const invoices = userInvoices.value[userId] || []
  return invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + (inv.balance || 0), 0)
}

const getLastDueDate = (userId) => {
  const invoices = userInvoices.value[userId] || []
  const pending = invoices.filter(inv => inv.status === 'pending')
  if (pending.length === 0) return '-'
  
  const sorted = pending.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const lastDue = sorted[0]?.dueDate
  return lastDue ? new Date(lastDue).toLocaleDateString('pt-BR') : '-'
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// MITAPP: Handler para botões de relação no footer
const handleRelationButtonClick = (type) => {
  if (selected.value === 0) return
  linkObjectsRef?.showObjects({ userId: selected.value, type })
}

// MITAPP: Criar sessão (assumir identidade)
const createSession = () => {
  if (selected.value === 0) return
  
  ElMessageBox.confirm(
    'Você vai assumir a identidade deste usuário. Deseja continuar?',
    'Confirmação',
    {
      confirmButtonText: 'Sim',
      cancelButtonText: 'Cancelar',
      type: 'warning',
    }
  ).then(() => {
    // Disparar ação para assumir sessão
    store.dispatch('auth/createSessionAs', selected.value).then(() => {
      ElNotification({
        title: 'Sucesso',
        message: 'Sessão criada com sucesso',
        type: 'success'
      })
    }).catch(err => {
      ElMessage.error('Erro ao criar sessão: ' + (err?.message || 'Erro desconhecido'))
    })
  }).catch(() => {
    ElMessage.info('Ação cancelada')
  })
}

// MITAPP: Exports PDF/Excel (Fase 1 - Arquitetura stub)
const generatePdf = async () => {
  if (isGeneratingPDF.value) return
  
  // STUB: Funcionalidade em desenvolvimento
  ElMessage.info('Funcionalidade de export PDF em desenvolvimento (Fase 2)')
  
  // TODO Fase 2: Implementar export real com jspdf
  // import('jspdf').then(module => { ... })
}

const generateExcel = async () => {
  // STUB: Funcionalidade em desenvolvimento
  ElMessage.info('Funcionalidade de export Excel em desenvolvimento (Fase 2)')
  
  // TODO Fase 2: Implementar export real com xlsx
  // import('xlsx').then(module => { ... })
}

// MITAPP: Carregar contadores e invoices ao abrir modal (lazy load otimizado)
const handleModalOpened = async () => {
  // PERFORMANCE FIX: Preload inteligente - apenas 3 primeiros usuários com delay
  // Evita travar abertura do modal
  // FIX: Registrar timers para cancelar ao fechar
  addTimer(setTimeout(() => {
    const visibleUsers = filteredUsersFinal.value.slice(0, 3)
    
    visibleUsers.forEach((user, index) => {
      if (!hasValue(deviceCounts.value[user.id]) && !loadingCounts.value[user.id]) {
        // Espaçar chamadas para evitar saturação
        addTimer(setTimeout(() => {
          refreshUserCounts(user.id)
        }, index * 150))
      }
    })
  }, 300))
  
  // Carregar invoices se módulo estiver ativo (em background)
  if (showDebtorsCard.value) {
    addTimer(setTimeout(() => {
      loadUserInvoices()
    }, 500))
  }
}

const loadUserInvoices = async () => {
  if (!store.state.auth.administrator) return
  
  const users = getUsersList().slice(0, 50) // Limitar a 50 para performance
  
  // FIX: Paralelização controlada ao invés de sequencial
  // 6 workers simultâneos = ~8x mais rápido que sequencial
  const limit = 6
  let i = 0

  const worker = async () => {
    while (i < users.length) {
      const idx = i++
      const u = users[idx]
      try {
        const invoices = await store.dispatch('invoices/getUserInvoices', u.id).catch(() => [])
        userInvoices.value[u.id] = invoices || []
      } catch (e) {
        userInvoices.value[u.id] = []
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, worker))
}

const handleModalClosed = () => {
  // FIX: Limpar timers para prevenir chamadas após fechar
  clearOpenTimers()
  
  // Cache já é limpo pelo watch(show), mas garantir
  deviceCounts.value = {}
  userCounts.value = {}
  loadingCounts.value = {}
  userInvoices.value = {}
  selected.value = 0
}

const doDelete = () =>{

  if(selected.value===0){
    ElMessage.error('Você precisa selecionar um usuário');
    return false;
  }

  if(selected.value===store.state.auth.id){
    ElMessage.error('Você não pode se deletar!');
    return false;
  }

  const user = store.getters["users/getUser"](selected.value);

  if(user.id < store.state.auth.id && user.administrator){
    ElMessage.error('Você não pode deletar um admin superior a você!');
    return false;
  }

  ElMessageBox.confirm(
      'Você está excluindo o usuário "'+user.name+'", deseja continuar?',
      'Perigo!',
      {
        confirmButtonText: 'Excluir',
        confirmButtonClass: 'danger',
        cancelButtonText: 'Cancelar',
        type: 'warning',
      }
  ).then(()=>{

    store.dispatch("users/deleteUser",selected.value).then(()=> {

      ElNotification({
        title: 'Successo',
        message: 'Usuário deletado com sucesso.',
        type: 'success',
      });
      selected.value = 0;
    }).catch((e)=>{

      ElNotification({
        title: 'Erro',
        message: e.response.data,
        type: 'danger',
      });
    });

  }).catch(()=>{

    ElMessage.error('Ação cancelada pelo usuário');
  })
}

const showUsers = ()=>{
    show.value = true;
}

defineExpose({
  showUsers,
  contextMenuRef
});

</script>

<style scoped>
/* ==========================================
   MITAPP - TOKENS CSS (Identidade MIT)
   ========================================== */

:deep(.users-dialog.el-dialog) {
  /* LIGHT MODE - Tokens MIT */
  --mit-bg: #ffffff;
  --mit-surface: #ffffff;
  --mit-muted-bg: #f8f9fa;
  --mit-border: #e5e7eb;
  --mit-text: #1f2937;
  --mit-subtext: #6b7280;
  --mit-subtle: #9ca3af;
  
  /* MITAPP: Paleta laranja MIT */
  --mit-accent: #FF6B35;
  --mit-accent-secondary: #F7931E;
  --mit-accent-gradient: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
  
  /* Secundários */
  --mit-success: #10b981;
  --mit-warning: #f59e0b;
  --mit-danger: #ef4444;
  --mit-info: #3b82f6;
  
  /* Sombras */
  --mit-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --mit-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* DARK MODE */
:global(body.dark-mode) :deep(.users-dialog.el-dialog),
:deep(.users-dialog.users-dialog--dark) {
  --mit-bg: #111827;
  --mit-surface: #1f2937;
  --mit-muted-bg: #1a1f2e;
  --mit-border: rgba(255, 255, 255, 0.1);
  --mit-text: rgba(255, 255, 255, 0.95);
  --mit-subtext: rgba(255, 255, 255, 0.75);
  --mit-subtle: rgba(255, 255, 255, 0.55);
  --mit-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  --mit-shadow-hover: 0 6px 16px rgba(0, 0, 0, 0.5);
}

/* ===== RESET FORÇADO ===== */
:deep(.users-dialog .el-dialog__header),
:deep(.users-dialog .el-dialog__body),
:deep(.users-dialog .el-dialog__footer) {
  padding: 0 !important;
  margin: 0 !important;
}

:deep(.users-dialog .el-dialog__body) {
  background: var(--mit-bg);
  padding-top: 0 !important;
}

/* ===== MITAPP: HEADER com gradiente laranja MIT ===== */
.users-modal-header {
  background: var(--mit-accent-gradient);
  color: white;
  padding: 16px 52px 16px 20px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
  max-width: calc(100% - 60px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.el-dialog__headerbtn) {
  z-index: 10;
  top: 16px;
  right: 16px;
}

/* ===== MITAPP: STATS GRID - 4 colunas (3+1 devedores) ===== */
.users-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  padding: 18px;
  background: var(--mit-muted-bg);
  border-bottom: 1px solid var(--mit-border);
}

@media (max-width: 1024px) {
  .users-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .users-stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: var(--el-color-primary, var(--mit-accent));
  color: white;
  padding: 16px 18px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.2s ease;
  box-shadow: var(--mit-shadow);
}

.stat-card:hover {
  box-shadow: var(--mit-shadow-hover);
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.stat-card.active {
  box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb, 255, 107, 53), 0.4);
  transform: scale(1.02);
  filter: brightness(1.15);
}

/* MITAPP: Variações sutis usando opacidade (tema unificado) */
.stat-card--total {
  opacity: 1;
}

.stat-card--admin {
  opacity: 0.92;
  filter: brightness(0.95);
}

.stat-card--suspended {
  opacity: 0.88;
  filter: brightness(0.9) saturate(0.95);
}

.stat-card--debtors {
  opacity: 0.95;
  filter: brightness(1.05) hue-rotate(-5deg);
}

.stat-icon {
  font-size: 28px;
  opacity: 0.95;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.92;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 600;
}

/* ===== LAYOUT ===== */
.users-modal-body {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 140px);
}

.users-content {
  flex: 1;
  min-height: 0;
  padding: 0 20px;
  background: var(--mit-bg);
}

.users-table {
  height: 100%;
}

/* ===== TOOLBAR ===== */
.users-toolbar {
  display: flex;
  gap: 12px;
  padding: 14px 18px;
  background: var(--mit-surface);
  border-bottom: 1px solid var(--mit-border);
  align-items: center;
}

.search-input {
  flex: 1;
}

.users-toolbar-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-text {
  font-size: 13px;
  color: var(--mit-subtext);
  white-space: nowrap;
}

.clear-btn {
  padding: 8px 12px;
}

.btn-text {
  margin-left: 6px;
}

.actions-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--mit-subtle);
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(156, 163, 175, 0.12);
  white-space: nowrap;
  user-select: none;
}

.actions-hint .fa-ellipsis-v {
  font-size: 11px;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .users-toolbar {
    flex-wrap: wrap;
  }

  .users-toolbar-meta {
    width: 100%;
    justify-content: space-between;
  }

  .meta-text {
    white-space: normal;
  }

  .btn-text {
    display: none;
  }

  .actions-hint {
    display: none;
  }
}

/* ===== TABELA DESKTOP ===== */
.users-table--desktop {
  display: block;
}

@media (max-width: 768px) {
  .users-table--desktop {
    display: none !important;
  }
}

:deep(.el-table) {
  font-size: 14px;
  background: var(--mit-bg);
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: rgba(107, 114, 128, 0.05);
  color: var(--mit-subtext);
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.el-table__row.selected-row) {
  background-color: rgba(255, 107, 53, 0.08);
}

:deep(.el-table__row) {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

:deep(.el-table__row:hover) {
  background-color: rgba(0, 0, 0, 0.02);
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s ease;
}

.sortable-header:hover {
  color: var(--mit-accent);
}

.sort-inactive {
  opacity: 0.25;
}

/* ===== MITAPP: COLUNAS COM CONTADORES CLICÁVEIS (tema unificado) ===== */
.clickable-count {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 8px;
  background: rgba(var(--el-color-primary-rgb, 255, 107, 53), 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 13px;
}

.clickable-count:hover {
  background: rgba(var(--el-color-primary-rgb, 255, 107, 53), 0.2);
  transform: scale(1.05);
}

.clickable-count i {
  font-size: 14px;
  color: var(--el-color-primary, var(--mit-accent));
}

.clickable-count span {
  color: var(--mit-text);
}

.device-count {
  opacity: 1;
}

.device-count:hover {
  opacity: 1;
}

.device-count i {
  opacity: 0.95;
}

.user-count {
  opacity: 0.95;
}

.user-count:hover {
  opacity: 1;
}

.user-count i {
  opacity: 0.9;
}

/* ===== MITAPP: COLUNAS DE BILLING ===== */
.billing-cell {
  font-size: 13px;
  color: var(--mit-subtext);
  font-weight: 500;
}

.billing-balance {
  font-weight: 700;
  color: var(--mit-accent);
}

/* ===== PREMIUM: Célula com avatar ===== */
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  color: #fff;
  background: var(--mit-accent-gradient);
  flex-shrink: 0;
  box-shadow: var(--mit-shadow);
}

.user-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: var(--mit-text);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;
}

.user-sub {
  display: flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 768px) {
  .user-name {
    max-width: 180px;
  }
}

/* ===== AÇÕES POR LINHA ===== */
.row-actions-btn {
  opacity: 0.6;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

:deep(.el-table__row:hover) .row-actions-btn {
  opacity: 1;
}

.row-actions-btn:hover {
  transform: scale(1.1);
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dd-text {
  margin-left: 4px;
}

:deep(.danger-item) {
  color: var(--mit-danger);
}

/* ===== EMPTY STATE ===== */
.users-empty {
  background: var(--mit-surface);
  padding: 32px 24px;
  border-bottom: 1px solid var(--mit-border);
  text-align: center;
}

.empty-icon {
  font-size: 40px;
  opacity: 0.3;
  margin-bottom: 12px;
  color: var(--mit-subtle);
}

.empty-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--mit-text);
  margin-bottom: 7px;
}

.empty-subtitle {
  font-size: 14px;
  color: var(--mit-subtext);
  margin-bottom: 18px;
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ===== MITAPP: MOBILE VIEW - Cards ===== */
.mobile-users-list {
  display: none;
  padding: 14px;
  max-height: calc(100vh - 340px);
  overflow-y: auto;
}

@media (max-width: 768px) {
  .mobile-users-list {
    display: block;
  }
}

.mobile-user-card {
  background: var(--mit-surface);
  border: 1px solid var(--mit-border);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.mobile-user-card:hover {
  box-shadow: var(--mit-shadow-hover);
  transform: translateY(-1px);
}

.mobile-user-card.selected {
  border-color: var(--mit-accent);
  background: rgba(255, 107, 53, 0.05);
}

.mobile-user-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.mobile-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  background: var(--mit-accent-gradient);
  flex-shrink: 0;
}

.mobile-user-info {
  flex: 1;
  min-width: 0;
}

.mobile-user-name {
  font-weight: 700;
  font-size: 15px;
  color: var(--mit-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-user-email {
  font-size: 12px;
  color: var(--mit-subtext);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-user-id {
  font-size: 11px;
  color: var(--mit-subtle);
  background: rgba(107, 114, 128, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.mobile-user-counts {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.mobile-count-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border-radius: 8px;
  background: rgba(107, 114, 128, 0.08);
  font-weight: 600;
  font-size: 14px;
  color: var(--mit-text);
  cursor: pointer;
  transition: background 0.2s ease;
}

.mobile-count-item:hover {
  background: rgba(107, 114, 128, 0.15);
}

.mobile-count-item i {
  font-size: 16px;
  color: var(--mit-accent);
}

.mobile-user-status {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* ===== MITAPP: FOOTER EXPANDIDO ===== */
.users-footer--expanded {
  padding: 12px 16px;
  border-top: 1px solid var(--mit-border);
  background: var(--mit-surface);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.footer-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.footer-group--actions {
  border-right: 1px solid var(--mit-border);
  padding-right: 12px;
}

.footer-group--relations {
  flex: 1;
  min-width: 0;
}

.footer-group--extras {
  border-left: 1px solid var(--mit-border);
  padding-left: 12px;
}

.btn-close {
  margin-left: auto;
}

@media (max-width: 768px) {
  .users-footer--expanded {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
    gap: 8px;
    padding: 12px;
  }

  .footer-group {
    display: contents;
  }

  .footer-group--actions,
  .footer-group--extras {
    border: none;
    padding: 0;
  }

  .users-footer--expanded :deep(.el-button) {
    min-width: 44px !important;
    height: 44px !important;
    padding: 0 !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .users-footer--expanded .btn-text {
    display: none !important;
  }

  .btn-close {
    margin-left: 0;
    grid-column: span 2;
  }
}

/* ===== TAGS ===== */
:deep(.el-tag) {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  font-weight: 600;
  font-size: 12px;
}

:deep(.el-tag .fas) {
  margin-right: 4px;
}
</style>




vc 