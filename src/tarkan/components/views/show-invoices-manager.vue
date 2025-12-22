<template>

  <show-invoices-manager-user ref="invoicesUserRef"></show-invoices-manager-user>

  <el-dialog :lock-scroll="true" :top="'50px'" :width="'80%'" v-model="show" title="Gestión de Facturas">

    <template v-slot:header>
      <div class="modal-header primary-bg">
        <div class="header-content">
          <div class="header-left">
            <i class="fas fa-file-invoice-dollar primary-icon"></i>
            <span class="modal-title">Gestão de Cobranças</span>
          </div>
          <div class="header-right">
            <!-- Barra de búsqueda -->
            <el-input
              v-model="searchText"
              placeholder="Buscar usuarios..."
              style="width: 300px;"
              clearable
              @input="filterUsers">
              <template #prefix>
                <i class="fas fa-search"></i>
              </template>
            </el-input>
            <el-button type="info" plain @click="exportToExcel">
              <i class="fas fa-file-excel"></i> Exportar
            </el-button>
            <el-button type="success" plain @click="generateExecutiveReport">
              <i class="fas fa-file-pdf"></i> Relatório PDF
            </el-button>
          </div>
        </div>
      </div>
    </template>


    <template v-slot:footer>
      <div style="border-top: #e0e0e0 1px solid;padding: 20px;display: flex;justify-content: space-between;">
        <div style="display: flex; gap: 10px;">
          <el-button
              @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('invoice.view'))"
              type="primary" :disabled="selected===0" @click="showUserInvoices()">
            <i class="fas fa-file-invoice-dollar"></i> Ver Facturas
          </el-button>
          
          <el-button
              @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('invoice.unlock'))"
              type="success" :disabled="selected===0" @click="unlockUser(true)">
            <i class="fas fa-user-check"></i> Desbloquear
          </el-button>
          
          <el-button
              @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('invoice.trustUnlock'))"
              type="warning" :disabled="selected===0" @click="unlockUser(false)">
            <i class="fas fa-user-clock"></i> Desbl. Temporal
          </el-button>
          
          <el-button
              @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('invoice.lock'))"
              type="danger" :disabled="selected===0" @click="lockUser()">
            <i class="fas fa-user-lock"></i> Bloquear
          </el-button>
        </div>
        <div style="display: flex; gap: 10px;">
          <el-button type="default" @click="show = false">Cerrar</el-button>
        </div>
      </div>
    </template>

    <!-- Cards con totales financieros -->
    <div class="financial-cards" style="display: flex; flex-wrap: wrap; gap: 15px; margin: 20px; margin-bottom: 10px;">
      <div class="card-stat clickable" :class="{ 'active-filter': activeCardFilter === 'week' }" style="flex: 1; min-width: 150px; padding: 15px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); cursor: pointer;" @click="filterByCard('week')">
        <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Semana</div>
        <div style="font-size: 18px; font-weight: bold;">{{ formatCurrency(getWeeklyStats().total) }}</div>
        <div style="font-size: 10px; opacity: 0.8;">{{ getWeeklyStats().count }} usuarios</div>
      </div>
      
      <div class="card-stat clickable" :class="{ 'active-filter': activeCardFilter === 'month' }" style="flex: 1; min-width: 150px; padding: 15px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); cursor: pointer;" @click="filterByCard('month')">
        <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Mes</div>
        <div style="font-size: 18px; font-weight: bold;">{{ formatCurrency(getMonthlyStats().total) }}</div>
        <div style="font-size: 10px; opacity: 0.8;">{{ getMonthlyStats().count }} usuarios</div>
      </div>
      
      <div class="card-stat clickable" :class="{ 'active-filter': activeCardFilter === 'debt' }" style="flex: 1; min-width: 150px; padding: 15px; border-radius: 8px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); cursor: pointer;" @click="filterByCard('debt')">
        <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Deuda Total</div>
        <div style="font-size: 18px; font-weight: bold;">{{ formatCurrency(getTotalDebt()) }}</div>
        <div style="font-size: 10px; opacity: 0.8;">{{ getPendingUsersCount() }} con deuda</div>
      </div>
      
      <div class="card-stat clickable" :class="{ 'active-filter': activeCardFilter === 'overdue' }" style="flex: 1; min-width: 150px; padding: 15px; border-radius: 8px; background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: #333; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); cursor: pointer;" @click="filterByCard('overdue')">
        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">Vencidos</div>
        <div style="font-size: 18px; font-weight: bold;">{{ formatCurrency(getOverdueStats().total) }}</div>
        <div style="font-size: 10px; opacity: 0.7;">{{ getOverdueStats().count }} usuarios</div>
      </div>
      
      <div class="card-stat clickable" :class="{ 'active-filter': activeCardFilter === 'due7' }" style="flex: 1; min-width: 150px; padding: 15px; border-radius: 8px; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #333; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); cursor: pointer;" @click="filterByCard('due7')">
        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">Vencen 7 días</div>
        <div style="font-size: 18px; font-weight: bold;">{{ formatCurrency(getDueSoonStats(7).total) }}</div>
        <div style="font-size: 10px; opacity: 0.7;">{{ getDueSoonStats(7).count }} usuarios</div>
      </div>
      
      <div class="card-stat clickable" :class="{ 'active-filter': activeCardFilter === 'due15' }" style="flex: 1; min-width: 150px; padding: 15px; border-radius: 8px; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); cursor: pointer;" @click="filterByCard('due15')">
        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">Vencen 15 días</div>
        <div style="font-size: 18px; font-weight: bold;">{{ formatCurrency(getDueSoonStats(15).total) }}</div>
        <div style="font-size: 10px; opacity: 0.7;">{{ getDueSoonStats(15).count }} usuarios</div>
      </div>
    </div>

    <!-- Tabla con columnas fijas y filtros -->
    <div style="position: relative; margin: 0 20px;">
      <div class="table-container" style="overflow-x: auto; border: 1px solid #EBEEF5; border-radius: 4px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);">
        <div class="table-wrapper" style="min-width: 1400px;">
          <!-- Cabezales con filtros -->
          <div class="header-row" style="display: flex; background: #f5f7fa; border-bottom: 2px solid #ddd; position: sticky; top: 0; z-index: 10;">
            <!-- Columnas fijas -->
            <div class="fixed-column" style="width: 80px; max-width: 80px; padding: 10px; font-size: 12px; font-weight: bold; background: #f5f7fa; border-right: 2px solid #ddd;">
              <div>{{KT('user.id')}}</div>
              <el-input v-model="filters.id" placeholder="ID" size="small" style="margin-top: 5px;" @input="applyFilters"/>
            </div>
            
            <div class="fixed-column" style="width: 180px; max-width: 180px; padding: 10px; font-size: 12px; font-weight: bold; background: #f5f7fa; border-right: 2px solid #ddd;">
              <div>{{KT('user.name')}}</div>
              <el-input v-model="filters.name" placeholder="Nome" size="small" style="margin-top: 5px;" @input="applyFilters"/>
            </div>
            
            <div class="fixed-column" style="width: 180px; max-width: 180px; padding: 10px; font-size: 12px; font-weight: bold; background: #f5f7fa; border-right: 2px solid #ddd;">
              <div>{{KT('user.email')}}</div>
              <el-input v-model="filters.email" placeholder="Email" size="small" style="margin-top: 5px;" @input="applyFilters"/>
            </div>
            
            <!-- Columnas desplazables -->
            <div class="scrollable-column" style="width: 140px; max-width: 140px; padding: 6px; font-size: 11px; font-weight: bold;">
              <div>{{KT('invoice.count')}}</div>
              <div style="display: flex; margin-top: 3px; width: 128px; align-items: center;">
                <el-select v-model="filters.invoiceCountOp" placeholder="≥" size="small" style="width: 28px; margin-right: 2px; flex-shrink: 0;" @change="applyFilters">
                  <el-option label="≥" value="gte"></el-option>
                  <el-option label="≤" value="lte"></el-option>
                  <el-option label="=" value="eq"></el-option>
                </el-select>
                <el-input-number v-model="filters.invoiceCount" placeholder="Nº" size="small" style="width: 98px; font-size: 11px;" @change="applyFilters" controls-position="right" :min="0"/>
              </div>
            </div>
            
            <div class="scrollable-column" style="width: 140px; max-width: 140px; padding: 6px; font-size: 11px; font-weight: bold;">
              <div>{{KT('invoice.pending')}}</div>
              <div style="display: flex; margin-top: 3px; width: 128px; align-items: center;">
                <el-select v-model="filters.pendingOp" placeholder="≥" size="small" style="width: 28px; margin-right: 2px; flex-shrink: 0;" @change="applyFilters">
                  <el-option label="≥" value="gte"></el-option>
                  <el-option label="≤" value="lte"></el-option>
                  <el-option label="=" value="eq"></el-option>
                </el-select>
                <el-input-number v-model="filters.pending" placeholder="Pend." size="small" style="width: 98px; font-size: 11px;" @change="applyFilters" controls-position="right" :min="0"/>
              </div>
            </div>
            
            <div class="scrollable-column" style="width: 140px; max-width: 140px; padding: 6px; font-size: 11px; font-weight: bold;">
              <div>{{KT('invoice.paid')}}</div>
              <div style="display: flex; margin-top: 3px; width: 128px; align-items: center;">
                <el-select v-model="filters.paidOp" placeholder="≥" size="small" style="width: 28px; margin-right: 2px; flex-shrink: 0;" @change="applyFilters">
                  <el-option label="≥" value="gte"></el-option>
                  <el-option label="≤" value="lte"></el-option>
                  <el-option label="=" value="eq"></el-option>
                </el-select>
                <el-input-number v-model="filters.paid" placeholder="Pagos" size="small" style="width: 98px; font-size: 11px;" @change="applyFilters" controls-position="right" :min="0"/>
              </div>
            </div>
            
            <div class="scrollable-column" style="min-width: 130px; padding: 10px; font-size: 12px; font-weight: bold;">
              <div>Último Venc.</div>
              <el-input v-model="filters.lastDue" placeholder="Últ. Venc." size="small" style="margin-top: 5px;" @input="applyFilters"/>
            </div>
            
            <div class="scrollable-column" style="min-width: 120px; padding: 10px; font-size: 12px; font-weight: bold;">
              <div>Estado Reg.</div>
              <el-select v-model="filters.regular" placeholder="Regular" size="small" style="width: 100%; margin-top: 5px;" @change="applyFilters" clearable>
                <el-option label="Regular" value="regular"></el-option>
                <el-option label="Atrasado" value="atrasado"></el-option>
                <el-option label="Irregular" value="irregular"></el-option>
              </el-select>
            </div>
            
            <div class="scrollable-column" style="min-width: 130px; padding: 10px; font-size: 12px; font-weight: bold;">
              <div>Deuda Total</div>
              <el-input v-model="filters.debt" placeholder="Deuda" size="small" style="margin-top: 5px;" @input="applyFilters"/>
            </div>
          </div>
          
          <!-- Cuerpo de la tabla -->
          <div style="height: calc(100vh - 580px); min-height: 400px; overflow-y: auto;">
            <div class="invoice-list">
              <div class="itm" v-for="(u,k) in displayedUsers" :key="k" 
                   @click="selected = (selected!==u.id)?u.id:0" 
                   @dblclick="showUserInvoices(u)"
                   :class="{tr1: (k%2),tr2: !(k%2),selected: (selected === u.id)}" 
                   style="display: flex; transition: background-color 0.3s; cursor: pointer;">
                
                <!-- Columnas fijas -->
                <div class="fixed-column" style="width: 80px; max-width: 80px; padding: 10px; font-size: 14px; background: inherit; border-right: 1px solid #eee; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{u.id}}</div>
                
                <div class="fixed-column" style="width: 180px; max-width: 180px; padding: 10px; font-size: 14px; text-align: left; background: inherit; border-right: 1px solid #eee; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{u.name}}
                </div>
                
                <div class="fixed-column" style="width: 180px; max-width: 180px; padding: 10px; font-size: 14px; text-align: left; background: inherit; border-right: 2px solid #ddd; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{u.email}}
                </div>
                
                <!-- Columnas desplazables -->
                <div class="scrollable-column" style="width: 140px; max-width: 140px; padding: 6px; font-size: 14px; text-align: center;">
                  <span style="font-weight: 500;">{{u.invoices.length}}</span>
                </div>
                
                <div class="scrollable-column" style="width: 140px; max-width: 140px; padding: 6px; font-size: 14px; text-align: center;">
                  <span style="color: #E6A23C; font-weight: 500;">{{pendingCount(u.invoices)}}</span>
                </div>
                
                <div class="scrollable-column" style="width: 140px; max-width: 140px; padding: 6px; font-size: 14px; text-align: center;">
                  <span style="color: #67C23A; font-weight: 500;">{{paidCount(u.invoices)}}</span>
                </div>
                
                <div class="scrollable-column" style="min-width: 130px; padding: 10px; font-size: 14px; text-align: center;">
                  {{ getLastDueDate(u) }}
                </div>
                
                <div class="scrollable-column" style="min-width: 120px; padding: 10px; font-size: 14px; text-align: center;">
                  <span :style="getRegularStatusStyle(u)" style="padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                    {{ getRegularStatus(u) }}
                  </span>
                </div>
                
                <div class="scrollable-column" style="min-width: 130px; padding: 10px; font-size: 14px; text-align: center;">
                  <span style="font-weight: bold; color: #303133;">
                    {{ formatCurrency(getUserTotalDebt(u)) }}
                  </span>
                </div>
              </div>
              
              <!-- Mensaje cuando no hay usuarios -->
              <div v-if="displayedUsers.length === 0" style="padding: 20px; text-align: center; color: #909399;">
                Nenhum usuário encontrado
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Paginación -->
    <div v-if="displayedUsers.length > 20" style="display: flex; justify-content: center; margin-top: 20px; margin-bottom: 20px;">
      <el-pagination
        layout="total, sizes, prev, pager, next, jumper"
        :total="displayedUsers.length"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        @current-change="onPageChange"
        @size-change="onSizeChange"
        :current-page="currentPage">
      </el-pagination>
    </div>

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
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/input-number/style/css'
import 'element-plus/es/components/pagination/style/css'
import 'element-plus/es/components/message/style/css'

import {ElButton, ElDialog, ElMessageBox, ElMessage, ElInput, ElSelect, ElOption, ElInputNumber, ElPagination} from "element-plus";

import {ref, defineExpose, defineAsyncComponent, computed} from 'vue';
import {useStore} from 'vuex';

// Importar dependencias para Excel y PDF
import { saveAs } from 'file-saver';
// import { jsPDF } from 'jspdf'; // Importación dinámica
import 'jspdf-autotable';
import { Chart, registerables } from 'chart.js';

// Registrar componentes de Chart.js
Chart.register(...registerables);

const ShowInvoicesManagerUser = defineAsyncComponent(()=> import("./show-invoices-manager-user.vue") );

const store = useStore();
const invoicesUserRef  = ref(null);

const selected = ref(0);
const show = ref(false);
const searchText = ref('');
const displayedUsers = ref([]);

// Paginación
const currentPage = ref(1);
const pageSize = ref(20);

// Filtros para columnas
const filters = ref({
  id: '',
  name: '',
  email: '',
  invoiceCount: null,
  invoiceCountOp: 'gte',
  pending: null,
  pendingOp: 'gte',
  paid: null,
  paidOp: 'gte',
  lastDue: '',
  regular: '',
  debt: ''
});

import KT from "@/tarkan/func/kt";



const pendingStatus = ['PENDING','OVERDUE'];
const paidStatus = ['RECEIVED_IN_CASH','RECEIVED','CONFIRMED']

const pendingCount = computed(()=>{
  return (invoices)=>{
    return invoices.filter((i)=> pendingStatus.includes(i.status)).length;
  }
})
const paidCount = computed(()=>{
  return (invoices)=>{
    return invoices.filter((i)=> paidStatus.includes(i.status)).length;
  }
})


const unlockUser = (perma)=>{

  const user = filteredUsers.value.find((u)=> u.id == selected.value);

  ElMessageBox.confirm(KT('invoice.confirmUnlock',user)).then(()=>{
    fetch("/tarkan/invoices/manager/" + selected.value + "/unlockUser?perma="+perma).then(() => {
      ElMessageBox.confirm(KT('invoice.confirmUnlockSuccess'));
    });
  });
}

const lockUser = ()=>{

  const user = filteredUsers.value.find((u)=> u.id == selected.value);

  ElMessageBox.confirm(KT('invoice.confirmLock',user)).then(()=>{
    fetch("/tarkan/invoices/manager/" + selected.value + "/lockUser").then(() => {
      ElMessageBox.confirm(KT('invoice.confirmLockSuccess'));
    });
  });
}

const showUserInvoices = (user = null)=>{
  if (!user) {
    user = filteredUsers.value.find((u)=> u.id == selected.value);
  }
  if (user) {
    invoicesUserRef.value.showInvoices(user);
  }
};



const showTip = (evt,text)=>{
  window.$showTip(evt,text);
}

const hideTip = (evt,text)=>{
  window.$hideTip(evt,text);
}


const filteredUsers = ref([]);




const showInvoices = ()=>{
    // VERIFICACIÓN DE SEGURIDAD: Solo administradores pueden acceder
    if (!store.state.auth.administrator) {
        ElMessage.error('Acceso denegado: Solo administradores pueden acceder a la gestión de facturas');
        return;
    }
    
    show.value = true;

    fetch("/tarkan/invoices/manager").then((response)=>{
      response.json().then((json)=>{
          // Ordenar por ID descendente (mayor arriba) por defecto
          const sortedJson = json.sort((a, b) => b.id - a.id);
          filteredUsers.value = sortedJson;
          displayedUsers.value = [...sortedJson];
          
          // Limpiar filtros
          searchText.value = '';
          filters.value = {
            id: '',
            name: '',
            email: '',
            invoiceCount: null,
            invoiceCountOp: 'gte',
            pending: null,
            pendingOp: 'gte',
            paid: null,
            paidOp: 'gte',
            lastDue: '',
            regular: '',
            debt: ''
          };
      })
    });
}

// Nuevas funciones para estadísticas y filtros
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

const getWeeklyStats = () => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  let total = 0;
  let count = 0;
  
  filteredUsers.value.forEach(user => {
    const recentInvoices = user.invoices.filter(invoice => 
      new Date(invoice.DueDateTime * 1000) >= oneWeekAgo
    );
    if (recentInvoices.length > 0) {
      total += recentInvoices.reduce((sum, inv) => sum + inv.value, 0);
      count++;
    }
  });
  
  return { total, count };
};

const getMonthlyStats = () => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  let total = 0;
  let count = 0;
  
  filteredUsers.value.forEach(user => {
    const recentInvoices = user.invoices.filter(invoice => 
      new Date(invoice.DueDateTime * 1000) >= oneMonthAgo
    );
    if (recentInvoices.length > 0) {
      total += recentInvoices.reduce((sum, inv) => sum + inv.value, 0);
      count++;
    }
  });
  
  return { total, count };
};

const getTotalDebt = () => {
  let total = 0;
  filteredUsers.value.forEach(user => {
    const pendingInvoices = user.invoices.filter(invoice => 
      pendingStatus.includes(invoice.status)
    );
    total += pendingInvoices.reduce((sum, inv) => sum + inv.value, 0);
  });
  return total;
};

const getPendingUsersCount = () => {
  return filteredUsers.value.filter(user => 
    user.invoices.some(invoice => pendingStatus.includes(invoice.status))
  ).length;
};

const getOverdueStats = () => {
  const now = new Date();
  let total = 0;
  let count = 0;
  
  filteredUsers.value.forEach(user => {
    const overdueInvoices = user.invoices.filter(invoice => 
      pendingStatus.includes(invoice.status) && 
      new Date(invoice.DueDateTime * 1000) < now
    );
    if (overdueInvoices.length > 0) {
      total += overdueInvoices.reduce((sum, inv) => sum + inv.value, 0);
      count++;
    }
  });
  
  return { total, count };
};

const getDueSoonStats = (days) => {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  let total = 0;
  let count = 0;
  
  filteredUsers.value.forEach(user => {
    const dueSoonInvoices = user.invoices.filter(invoice => {
      const dueDate = new Date(invoice.DueDateTime * 1000);
      return pendingStatus.includes(invoice.status) && 
             dueDate >= now && 
             dueDate <= futureDate;
    });
    if (dueSoonInvoices.length > 0) {
      total += dueSoonInvoices.reduce((sum, inv) => sum + inv.value, 0);
      count++;
    }
  });
  
  return { total, count };
};

const getLastDueDate = (user) => {
  const pendingInvoices = user.invoices.filter(invoice => 
    pendingStatus.includes(invoice.status)
  );
  
  if (pendingInvoices.length === 0) return '-';
  
  const latestDue = Math.max(...pendingInvoices.map(invoice => invoice.DueDateTime));
  return new Date(latestDue * 1000).toLocaleDateString();
};

const getRegularStatus = (user) => {
  const now = new Date();
  const pendingInvoices = user.invoices.filter(invoice => 
    pendingStatus.includes(invoice.status)
  );
  
  if (pendingInvoices.length === 0) return 'Regular';
  
  const oldestDue = Math.min(...pendingInvoices.map(invoice => invoice.DueDateTime));
  const daysDiff = Math.ceil((now - new Date(oldestDue * 1000)) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 0) {
    return 'Regular';
  } else if (daysDiff <= 30) {
    return 'Atrasado';
  } else {
    return 'Irregular';
  }
};

const getRegularStatusStyle = (user) => {
  const status = getRegularStatus(user);
  switch (status) {
    case 'Regular':
      return { backgroundColor: '#f0f9ff', color: '#1e40af' };
    case 'Atrasado':
      return { backgroundColor: '#fef3c7', color: '#d97706' };
    case 'Irregular':
      return { backgroundColor: '#fee2e2', color: '#dc2626' };
    default:
      return { backgroundColor: '#f3f4f6', color: '#6b7280' };
  }
};

const getUserTotalDebt = (user) => {
  const pendingInvoices = user.invoices.filter(invoice => 
    pendingStatus.includes(invoice.status)
  );
  return pendingInvoices.reduce((sum, inv) => sum + inv.value, 0);
};

// Variable para el filtro actual de tarjetas
const activeCardFilter = ref('');

// Función para filtrar por tarjetas
const filterByCard = (cardType) => {
  // Si se hace clic en la misma tarjeta, quitar el filtro
  if (activeCardFilter.value === cardType) {
    activeCardFilter.value = '';
  } else {
    activeCardFilter.value = cardType;
  }
  applyFilters();
};

// Funciones de filtrado
const filterUsers = () => {
  applyFilters();
};

const applyFilters = () => {
  let filtered = [...filteredUsers.value];
  
  // Filtro por tarjetas financieras
  if (activeCardFilter.value) {
    const now = new Date();
    
    switch (activeCardFilter.value) {
      case 'week': {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(user => 
          user.invoices.some(invoice => 
            new Date(invoice.DueDateTime * 1000) >= oneWeekAgo
          )
        );
        break;
      }
      
      case 'month': {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        filtered = filtered.filter(user => 
          user.invoices.some(invoice => 
            new Date(invoice.DueDateTime * 1000) >= oneMonthAgo
          )
        );
        break;
      }
        
      case 'debt':
        filtered = filtered.filter(user => 
          user.invoices.some(invoice => pendingStatus.includes(invoice.status))
        );
        break;
        
      case 'overdue':
        filtered = filtered.filter(user => 
          user.invoices.some(invoice => 
            pendingStatus.includes(invoice.status) && 
            new Date(invoice.DueDateTime * 1000) < now
          )
        );
        break;
        
      case 'due7': {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        filtered = filtered.filter(user => 
          user.invoices.some(invoice => {
            const dueDate = new Date(invoice.DueDateTime * 1000);
            return pendingStatus.includes(invoice.status) && 
                   dueDate >= now && 
                   dueDate <= sevenDaysFromNow;
          })
        );
        break;
      }
        
      case 'due15': {
        const fifteenDaysFromNow = new Date();
        fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
        filtered = filtered.filter(user => 
          user.invoices.some(invoice => {
            const dueDate = new Date(invoice.DueDateTime * 1000);
            return pendingStatus.includes(invoice.status) && 
                   dueDate >= now && 
                   dueDate <= fifteenDaysFromNow;
          })
        );
        break;
      }
    }
  }
  
  // Filtro de búsqueda general
  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    filtered = filtered.filter(user => 
      user.id.toString().includes(search) ||
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  }
  
  // Filtros por columna
  if (filters.value.id) {
    filtered = filtered.filter(user => 
      user.id.toString().includes(filters.value.id)
    );
  }
  
  if (filters.value.name) {
    filtered = filtered.filter(user => 
      user.name.toLowerCase().includes(filters.value.name.toLowerCase())
    );
  }
  
  if (filters.value.email) {
    filtered = filtered.filter(user => 
      user.email.toLowerCase().includes(filters.value.email.toLowerCase())
    );
  }
  
  if (filters.value.invoiceCount !== null && filters.value.invoiceCount !== undefined) {
    const op = filters.value.invoiceCountOp || 'gte';
    filtered = filtered.filter(user => {
      const count = user.invoices.length;
      switch (op) {
        case 'gte': return count >= filters.value.invoiceCount;
        case 'lte': return count <= filters.value.invoiceCount;
        case 'eq': return count === filters.value.invoiceCount;
        default: return true;
      }
    });
  }
  
  if (filters.value.pending !== null && filters.value.pending !== undefined) {
    const op = filters.value.pendingOp || 'gte';
    filtered = filtered.filter(user => {
      const count = pendingCount.value(user.invoices);
      switch (op) {
        case 'gte': return count >= filters.value.pending;
        case 'lte': return count <= filters.value.pending;
        case 'eq': return count === filters.value.pending;
        default: return true;
      }
    });
  }
  
  if (filters.value.paid !== null && filters.value.paid !== undefined) {
    const op = filters.value.paidOp || 'gte';
    filtered = filtered.filter(user => {
      const count = paidCount.value(user.invoices);
      switch (op) {
        case 'gte': return count >= filters.value.paid;
        case 'lte': return count <= filters.value.paid;
        case 'eq': return count === filters.value.paid;
        default: return true;
      }
    });
  }
  
  if (filters.value.regular) {
    filtered = filtered.filter(user => {
      const status = getRegularStatus(user).toLowerCase();
      return status.includes(filters.value.regular.toLowerCase());
    });
  }
  
  if (filters.value.debt) {
    const debtValue = parseFloat(filters.value.debt.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (!isNaN(debtValue)) {
      filtered = filtered.filter(user => 
        getUserTotalDebt(user) >= debtValue
      );
    }
  }
  
  // Ordenar por ID descendente (mayor arriba) después de filtrar
  filtered.sort((a, b) => b.id - a.id);
  
  displayedUsers.value = filtered;
  currentPage.value = 1;
};

// Funciones de paginación
const onPageChange = (page) => {
  currentPage.value = page;
};

const onSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

// Función para exportar a Excel
const exportToExcel = () => {
  try {
    // Crear datos para Excel
    const excelData = displayedUsers.value.map((user) => {
      return {
        'ID': user.id,
        'Nome': user.name || '',
        'Email': user.email || '',
        'Facturas Totais': user.invoices.length,
        'Pendentes': pendingCount.value(user.invoices),
        'Pagas': paidCount.value(user.invoices),
        'Último Vencimento': getLastDueDate(user),
        'Estado Regular': getRegularStatus(user),
        'Dívida Total': formatCurrency(getUserTotalDebt(user)),
        'Data Exportação': new Date().toLocaleDateString('pt-BR')
      };
    });

    // Convertir a CSV
    const headers = Object.keys(excelData[0] || {});
    const csvContent = [
      headers.join(','),
      ...excelData.map(row => 
        headers.map(header => {
          let value = row[header] || '';
          // Escapar comillas y comas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Crear Blob y descargar
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `gestao_cobrancas_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    saveAs(blob, fileName);

    ElMessageBox.alert(`Arquivo ${fileName} foi exportado com sucesso!`, 'Exportação Concluída', {
      confirmButtonText: 'OK',
      type: 'success'
    });
  } catch (error) {
    console.error('Erro ao exportar:', error);
    ElMessageBox.alert('Erro ao exportar dados para Excel', 'Erro', {
      confirmButtonText: 'OK',
      type: 'error'
    });
  }
};

// Función para generar informe PDF ejecutivo
const generateExecutiveReport = async () => {
  try {
    // Importación dinámica de jsPDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const today = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR');
    
    // === PÁGINA 1: PORTADA ===
    // Logo y título principal
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('RELATÓRIO EXECUTIVO', 105, 40, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setTextColor(52, 73, 94);
    doc.text('GESTÃO DE COBRANÇAS', 105, 55, { align: 'center' });
    
    // Línea decorativa
    doc.setDrawColor(52, 152, 219);
    doc.setLineWidth(1);
    doc.line(20, 65, 190, 65);
    
    // Información del reporte
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Data: ${today}`, 105, 80, { align: 'center' });
    doc.text(`Hora: ${currentTime}`, 105, 90, { align: 'center' });
    doc.text(`Total de Usuários: ${filteredUsers.value.length}`, 105, 100, { align: 'center' });
    
    // Estadísticas principales en portada
    const stats = calculateExecutiveStats();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('RESUMO EXECUTIVO', 105, 120, { align: 'center' });
    
    // Cajas de estadísticas
    const boxWidth = 80;
    const boxHeight = 20;
    const startY = 140;
    
    // Total Faturado
    doc.setFillColor(46, 204, 113);
    doc.roundedRect(20, startY, boxWidth, boxHeight, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('TOTAL FATURADO', 60, startY + 8, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(stats.totalBilled), 60, startY + 16, { align: 'center' });
    
    // Total Pendente
    doc.setFillColor(231, 76, 60);
    doc.roundedRect(110, startY, boxWidth, boxHeight, 3, 3, 'F');
    doc.text('TOTAL PENDENTE', 150, startY + 8, { align: 'center' });
    doc.text(formatCurrency(stats.totalPending), 150, startY + 16, { align: 'center' });
    
    // Taxa de cobrança
    doc.setFillColor(52, 152, 219);
    doc.roundedRect(65, startY + 30, boxWidth, boxHeight, 3, 3, 'F');
    doc.text('TAXA DE COBRANÇA', 105, startY + 38, { align: 'center' });
    doc.text(`${stats.collectionRate}%`, 105, startY + 46, { align: 'center' });
    
    // Pie de página portada
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('Relatório gerado automaticamente pelo Sistema de Gestão de Cobranças', 105, 270, { align: 'center' });
    
    // === PÁGINA 2: ANÁLISIS DETALHADO ===
    doc.addPage();
    
    // Título página 2
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('ANÁLISE DETALHADA', 20, 25);
    
    // Línea separadora
    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);
    
    // Análisis por período
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('1. ANÁLISE POR PERÍODO', 20, 45);
    
    const weeklyStats = getWeeklyStats();
    const monthlyStats = getMonthlyStats();
    const overdueStats = getOverdueStats();
    const due7Stats = getDueSoonStats(7);
    const due15Stats = getDueSoonStats(15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    let yPos = 55;
    doc.text(`• Faturamento Semanal: ${formatCurrency(weeklyStats.total)} (${weeklyStats.count} usuários)`, 25, yPos);
    yPos += 7;
    doc.text(`• Faturamento Mensal: ${formatCurrency(monthlyStats.total)} (${monthlyStats.count} usuários)`, 25, yPos);
    yPos += 7;
    doc.text(`• Faturas Vencidas: ${formatCurrency(overdueStats.total)} (${overdueStats.count} usuários)`, 25, yPos);
    yPos += 7;
    doc.text(`• Vencimento em 7 dias: ${formatCurrency(due7Stats.total)} (${due7Stats.count} usuários)`, 25, yPos);
    yPos += 7;
    doc.text(`• Vencimento em 15 dias: ${formatCurrency(due15Stats.total)} (${due15Stats.count} usuários)`, 25, yPos);
    
    // Análisis de riesgo
    yPos += 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('2. ANÁLISE DE RISCO', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const riskAnalysis = calculateRiskAnalysis();
    doc.text(`• Usuários Regulares: ${riskAnalysis.regular} (${((riskAnalysis.regular/filteredUsers.value.length)*100).toFixed(1)}%)`, 25, yPos);
    yPos += 7;
    doc.text(`• Usuários Atrasados: ${riskAnalysis.delayed} (${((riskAnalysis.delayed/filteredUsers.value.length)*100).toFixed(1)}%)`, 25, yPos);
    yPos += 7;
    doc.text(`• Usuários Irregulares: ${riskAnalysis.irregular} (${((riskAnalysis.irregular/filteredUsers.value.length)*100).toFixed(1)}%)`, 25, yPos);
    
    // Recomendações
    yPos += 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('3. RECOMENDAÇÕES', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const recommendations = generateRecommendations(stats, riskAnalysis);
    recommendations.forEach(rec => {
      doc.text(`• ${rec}`, 25, yPos);
      yPos += 7;
    });
    
    // === PÁGINA 3: TABELA DETALHADA ===
    doc.addPage();
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('DADOS DETALHADOS POR USUÁRIO', 20, 25);
    
    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);
    
    // Preparar dados para a tabela
    const tableData = displayedUsers.value.slice(0, 50).map((user) => [
      user.id.toString(),
      (user.name || '').substring(0, 25),
      user.invoices.length.toString(),
      pendingCount.value(user.invoices).toString(),
      paidCount.value(user.invoices).toString(),
      getRegularStatus(user),
      formatCurrency(getUserTotalDebt(user))
    ]);
    
    // Gerar tabela
    doc.autoTable({
      startY: 40,
      head: [['ID', 'Nome', 'Total', 'Pend.', 'Pagas', 'Status', 'Dívida']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 45 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 25 },
        6: { halign: 'right', cellWidth: 30 }
      }
    });
    
    // Rodapé em todas as páginas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
      doc.text(`Gerado em ${today} às ${currentTime}`, 105, 292, { align: 'center' });
    }
    
    // Salvar PDF
    const fileName = `relatorio_executivo_cobrancas_${today.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    
    ElMessageBox.alert(`Relatório ${fileName} gerado com sucesso!`, 'PDF Gerado', {
      confirmButtonText: 'OK',
      type: 'success'
    });
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    ElMessageBox.alert('Erro ao gerar relatório PDF', 'Erro', {
      confirmButtonText: 'OK',
      type: 'error'
    });
  }
};

// Funciones auxiliares para el reporte ejecutivo
const calculateExecutiveStats = () => {
  const totalUsers = filteredUsers.value.length;
  let totalBilled = 0;
  let totalPaid = 0;
  let totalPending = 0;
  
  filteredUsers.value.forEach(user => {
    user.invoices.forEach(invoice => {
      totalBilled += invoice.value;
      if (paidStatus.includes(invoice.status)) {
        totalPaid += invoice.value;
      } else if (pendingStatus.includes(invoice.status)) {
        totalPending += invoice.value;
      }
    });
  });
  
  const collectionRate = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : 0;
  
  return {
    totalUsers,
    totalBilled,
    totalPaid,
    totalPending,
    collectionRate
  };
};

const calculateRiskAnalysis = () => {
  let regular = 0;
  let delayed = 0;
  let irregular = 0;
  
  filteredUsers.value.forEach(user => {
    const status = getRegularStatus(user);
    switch (status) {
      case 'Regular':
        regular++;
        break;
      case 'Atrasado':
        delayed++;
        break;
      case 'Irregular':
        irregular++;
        break;
    }
  });
  
  return { regular, delayed, irregular };
};

const generateRecommendations = (stats, riskAnalysis) => {
  const recommendations = [];
  
  // Análise da taxa de cobrança
  if (stats.collectionRate < 70) {
    recommendations.push('Taxa de cobrança baixa (<70%). Implementar campanhas de cobrança mais agressivas.');
  } else if (stats.collectionRate < 85) {
    recommendations.push('Taxa de cobrança moderada. Focar em usuários atrasados para melhorar eficiência.');
  } else {
    recommendations.push('Excelente taxa de cobrança (>85%). Manter estratégias atuais.');
  }
  
  // Análise de risco
  const totalUsers = filteredUsers.value.length;
  const irregularPercentage = (riskAnalysis.irregular / totalUsers) * 100;
  const delayedPercentage = (riskAnalysis.delayed / totalUsers) * 100;
  
  if (irregularPercentage > 20) {
    recommendations.push(`Alto percentual de usuários irregulares (${irregularPercentage.toFixed(1)}%). Revisar políticas de crédito.`);
  }
  
  if (delayedPercentage > 15) {
    recommendations.push(`Muitos usuários atrasados (${delayedPercentage.toFixed(1)}%). Implementar lembretes automáticos.`);
  }
  
  // Análise de vencimentos próximos
  const due7Stats = getDueSoonStats(7);
  const due15Stats = getDueSoonStats(15);
  
  if (due7Stats.count > 0) {
    recommendations.push(`${due7Stats.count} usuários com vencimento em 7 dias. Enviar lembretes urgentes.`);
  }
  
  if (due15Stats.count > 0) {
    recommendations.push(`${due15Stats.count} usuários com vencimento em 15 dias. Programar lembretes preventivos.`);
  }
  
  // Análise de inadimplência
  const overdueStats = getOverdueStats();
  if (overdueStats.count > 0) {
    recommendations.push(`${overdueStats.count} usuários com faturas vencidas. Priorizar ações de cobrança.`);
  }
  
  return recommendations;
};

defineExpose({
  showInvoices
});





</script>

<style>

.itm{
  border-bottom: silver 1px dotted;
}

.itm div{
  border-right: silver 1px dotted;
}


.tr1{
  background: #f3f3f3;
}

.tr2{
  background: #f8f8f8;
}

.selected{
  background: rgba(5, 167, 227, 0.05) !important;
}

.itm div:last-child{
  border-right: none;
}

.el-select.el-select--large{
  width: 100%;
}

.el-dialog__header,.el-dialog__body,.el-dialog__footer{
  padding: 0px !important;
}

.el-dialog__footer{
  margin-top: 0px;
}

.el-tabs__nav-wrap{
  padding-left: 20px;
  padding-right: 20px;
}

.el-tabs__content{
  padding-left: 20px;
  padding-right: 20px;
}




.danger{
  --el-button-text-color: var(--el-color-danger) !important;
  --el-button-bg-color: #fef0f0 !important;
  --el-button-border-color: #fbc4c4 !important;
  --el-button-hover-text-color: var(--el-color-white) !important;
  --el-button-hover-bg-color: var(--el-color-danger) !important;
  --el-button-hover-border-color: var(--el-color-danger) !important;
  --el-button-active-text-color: var(--el-color-white) !important;
  --el-button-active-border-color: var(--el-color-danger) !important;
}

/* Estilos para cards financieros */
.financial-cards {
  animation: fadeInUp 0.5s ease-out;
}

.card-stat {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card-stat:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
}

/* Estilos para tabla con columnas fijas */
.table-container {
  position: relative;
}

.table-wrapper {
  position: relative;
}

.fixed-column {
  position: sticky;
  left: 0;
  z-index: 5;
  background: inherit;
}

.fixed-column:nth-child(1) {
  left: 0;
}

.fixed-column:nth-child(2) {
  left: 80px;
}

.fixed-column:nth-child(3) {
  left: 260px;
}

.header-row .fixed-column {
  background: #f5f7fa !important;
}

.scrollable-column {
  flex-shrink: 0;
}

/* Animaciones */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mejoras en la tabla */
.itm:hover {
  background: #f0f9ff !important;
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.selected {
  background: rgba(64, 158, 255, 0.1) !important;
  border-left: 4px solid #409EFF;
}

/* Responsive */
@media (max-width: 768px) {
  .financial-cards {
    flex-direction: column;
  }
  
  .card-stat {
    min-width: 100% !important;
  }
  
  .table-container {
    font-size: 12px;
  }
  
  .fixed-column, .scrollable-column {
    min-width: 100px !important;
    padding: 5px !important;
  }
}

/* Estilos para filtros */
.el-input__inner {
  font-size: 12px !important;
}

.el-select {
  font-size: 12px !important;
}

.el-input-number {
  width: 100% !important;
}

.el-input-number .el-input__inner {
  text-align: center !important;
}

/* Hacer más compactos los selectores de operadores */
.scrollable-column .el-select {
  font-size: 9px !important;
  max-width: 28px !important;
  min-width: 28px !important;
}

.scrollable-column .el-select .el-input__wrapper {
  padding: 0 3px !important;
  min-height: 20px !important;
  max-width: 28px !important;
}

.scrollable-column .el-select .el-input__inner {
  font-size: 9px !important;
  padding: 0 1px !important;
  text-align: center !important;
  min-height: 18px !important;
  line-height: 18px !important;
  max-width: 22px !important;
}

.scrollable-column .el-select .el-select__caret {
  font-size: 7px !important;
  right: 1px !important;
}

/* Forzar que los selectores no se expandan */
.scrollable-column .el-select.el-select--small {
  width: 28px !important;
  max-width: 28px !important;
}

/* Ajustar el input-number para que sea más compacto */
.scrollable-column .el-input-number {
  font-size: 11px !important;
}

.scrollable-column .el-input-number .el-input__inner {
  font-size: 11px !important;
  padding: 0 5px !important;
  text-align: center !important;
}

/* Estilo para las cards clickeables */
.card-stat.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.2) !important;
  transition: all 0.3s ease;
}

.card-stat.clickable:active {
  transform: translateY(0);
}

/* Estilo para tarjeta de filtro activa */
.card-stat.active-filter {
  border: 3px solid #ffffff !important;
  box-shadow: 0 8px 30px rgba(0,0,0,0.3) !important;
  transform: translateY(-3px) !important;
  position: relative;
}

.card-stat.active-filter::before {
  content: '✓';
  position: absolute;
  top: 5px;
  right: 10px;
  color: #ffffff;
  font-weight: bold;
  font-size: 16px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

/* Estilos del header como edit-device.vue */
.modal-header {
  border-bottom: none;
  padding: 20px;
  margin: 0; /* Sin márgenes negativos */
  width: 100%; /* Exactamente el ancho del formulario */
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
  box-sizing: border-box;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.primary-bg {
  background-color: #f5f7fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.primary-icon {
  color: var(--p-primary-600);
  font-size: 20px;
  margin-right: 12px;
}

.modal-title {
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--p-primary-700);
  font-size: 0.95em;
}

/* Variables CSS para colores primarios */
:root {
  --p-primary-600: #3b82f6;
  --p-primary-700: #1d4ed8;
}

</style>