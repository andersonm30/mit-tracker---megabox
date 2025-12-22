<template>
  <show-invoices-manager-user-add ref="invoicesUserAddRef" @invoice-added="onInvoiceAdded"></show-invoices-manager-user-add>

  <el-dialog :lock-scroll="true" :top="'50px'" :width="'60%'" v-model="show" title="Teste">
    <template v-slot:title>
      <div style="border-bottom: #e0e0e0 1px solid;padding: 20px;">
        <div class="modal-title" style="display: flex;width: calc(100% - 50px); justify-content: space-between; align-items: center;">
          <span>{{title}}</span>
          <el-button type="primary" @click="generateInvoicePDF" style="margin-left: 15px;">
            <i class="fas fa-file-pdf"></i> {{ KT('invoice.generatePDF') }}
          </el-button>
        </div>
      </div>
    </template>

    <template v-slot:footer>
      <div style="border-top: #e0e0e0 1px solid;padding: 20px;display: flex;justify-content: flex-start;">
        <el-button
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('invoice.add'))"
            type="primary" @click="showUserInvoicesAdd()"  >
          {{KT('invoice.add')}}
        </el-button>

        <el-button
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('invoice.add'))"
            type="danger" :disabled="selected===0" @click="doDelete()"  >
          {{KT('invoice.delete')}}
        </el-button>

        <el-button
            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('invoice.receivedCash'))"
            type="success" :disabled="selected===0" @click="setAsReceivedCash()"  >
          <i class="fas fa-money-bill-alt"></i>
        </el-button>
      </div>
    </template>

    <!-- Panel de información del usuario y resumen financiero -->
    <div class="info-panels" style="display: flex; flex-wrap: wrap; gap: 20px; margin: 20px;">
      <!-- Panel de información del usuario -->
      <div class="user-info" style="flex: 2; min-width: 350px; padding: 15px; border-radius: 8px; background-color: rgba(64, 158, 255, 0.05); border: 1px solid rgba(64, 158, 255, 0.2); box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; align-items: center;">
          <div style="font-size: 16px; font-weight: bold; color: #409EFF;">{{ KT('invoice.userInfo') }}</div>
          <div v-if="user && user.userType" style="padding: 2px 10px; background-color: rgba(103, 194, 58, 0.1); border-radius: 10px; font-size: 12px; color: #67C23A;">
            {{ user.userType }}
          </div>
        </div>
        
        <div style="display: flex; flex-wrap: wrap; gap: 15px;">
          <!-- Columna izquierda -->
          <div style="flex: 1; min-width: 200px;">
            <div class="info-row" style="margin-bottom: 10px;">
              <div style="font-weight: bold; font-size: 13px; color: #606266; margin-bottom: 3px;">{{ KT('user.name') }}</div>
              <div style="font-size: 14px; color: #303133; background-color: rgba(0,0,0,0.02); padding: 5px 10px; border-radius: 4px;">
                {{ user?.name || KT('notAvailable') }}
              </div>
            </div>
            
            <div class="info-row" style="margin-bottom: 10px;">
              <div style="font-weight: bold; font-size: 13px; color: #606266; margin-bottom: 3px;">{{ KT('user.billingCpfCnpj') }}</div>
              <div style="font-size: 14px; color: #303133; background-color: rgba(0,0,0,0.02); padding: 5px 10px; border-radius: 4px;">
                {{ user?.cpf || (user?.attributes && (formatDocument(user.attributes['tarkan.billingCpfCnpj'] || user.attributes.cpf || user.attributes.document || ''))) || KT('notAvailable') }}
              </div>
            </div>
            
            <div class="info-row" style="margin-bottom: 10px;" v-if="user?.company">
              <div style="font-weight: bold; font-size: 13px; color: #606266; margin-bottom: 3px;">{{ KT('user.company') }}</div>
              <div style="font-size: 14px; color: #303133; background-color: rgba(0,0,0,0.02); padding: 5px 10px; border-radius: 4px;">
                {{ user.company }}
              </div>
            </div>
          </div>
          
          <!-- Columna derecha -->
          <div style="flex: 1; min-width: 200px;">
            <div class="info-row" style="margin-bottom: 10px;">
              <div style="font-weight: bold; font-size: 13px; color: #606266; margin-bottom: 3px;">{{ KT('user.email') }}</div>
              <div style="font-size: 14px; color: #303133; background-color: rgba(0,0,0,0.02); padding: 5px 10px; border-radius: 4px;">
                {{ user?.email || KT('notAvailable') }}
              </div>
            </div>
            
            <div class="info-row" style="margin-bottom: 10px;">
              <div style="font-weight: bold; font-size: 13px; color: #606266; margin-bottom: 3px;">{{ KT('user.phone') }}</div>
              <div style="font-size: 14px; color: #303133; background-color: rgba(0,0,0,0.02); padding: 5px 10px; border-radius: 4px;">
                {{ user?.phone || KT('notAvailable') }}
              </div>
            </div>
            
            <div class="info-row" style="margin-bottom: 10px;">
              <div style="font-weight: bold; font-size: 13px; color: #606266; margin-bottom: 3px;">{{ KT('user.address') }}</div>
              <div style="font-size: 14px; color: #303133; background-color: rgba(0,0,0,0.02); padding: 5px 10px; border-radius: 4px; max-height: 60px; overflow: auto;">
                {{ user?.address || KT('notAvailable') }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Panel de resumen financiero -->
      <div class="financial-summary" style="flex: 1; min-width: 250px; padding: 15px; border-radius: 8px; background-color: rgba(103, 194, 58, 0.05); border: 1px solid rgba(103, 194, 58, 0.2); box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);">
        <div style="font-size: 16px; font-weight: bold; color: #67C23A; margin-bottom: 15px;">{{ KT('invoice.financialSummary') }}</div>
        
        <div class="finance-item" style="display: flex; justify-content: space-between; padding: 10px; margin-bottom: 8px; background-color: rgba(64, 158, 255, 0.1); border-radius: 6px;">
          <div style="font-weight: bold; color: #409EFF;">{{ KT('invoice.totalBilled') }}</div>
          <div style="font-size: 16px; font-weight: bold; color: #409EFF;">{{ formatCurrency(calculateTotalBilled()) }}</div>
        </div>
        
        <div class="finance-item" style="display: flex; justify-content: space-between; padding: 10px; margin-bottom: 8px; background-color: rgba(103, 194, 58, 0.1); border-radius: 6px;">
          <div style="font-weight: bold; color: #67C23A;">{{ KT('invoice.totalPaid') }}</div>
          <div style="font-size: 16px; font-weight: bold; color: #67C23A;">{{ formatCurrency(calculateTotalPaid()) }}</div>
        </div>

        <div class="finance-item" style="display: flex; justify-content: space-between; padding: 10px; margin-bottom: 8px; background-color: rgba(230, 162, 60, 0.1); border-radius: 6px;">
          <div style="font-weight: bold; color: #E6A23C;">{{ KT('invoice.pendingAmount') }}</div>
          <div style="font-size: 16px; font-weight: bold; color: #E6A23C;">{{ formatCurrency(calculatePendingAmount()) }}</div>
        </div>
        
        
      </div>
    </div>

    <!-- Campo de búsqueda -->
    <div style="padding: 10px 20px; background: #f5f7fa; border-bottom: 1px solid #e4e7ed;">
      <el-input
        v-model="searchQuery"
        placeholder="Buscar por ID, valor, estado..."
        prefix-icon="el-icon-search"
        clearable
        style="max-width: 400px;"
        @input="applyFilter"
      >
        <template #prefix>
          <i class="fas fa-search" style="color: #909399;"></i>
        </template>
      </el-input>
    </div>

    <div class="itm" style="display: flex;background: #eeeeee;">
      <div style="padding: 10px;width: 30px;font-size: 12px;">
        {{KT('invoice.id')}}
      </div>

      <div style="flex: 1;padding: 10px;font-size: 12px;text-align: center;">
        {{KT('invoice.dueDate')}}
      </div>
      <div style="flex: 1;padding: 10px;font-size: 12px;text-align: center;">
        {{KT('invoice.value')}}
      </div>
      <div style="width: 200px;padding: 10px;font-size: 12px;text-align: center;">
        {{KT('invoice.status')}}
      </div>
      <div style="width: 120px;padding: 10px;font-size: 12px;text-align: center;">
        {{KT('invoice.paidDate')}}
      </div>
      <div style="width: 200px;padding: 10px;font-size: 12px;text-align: center;">
        {{KT('invoice.balance')}}
      </div>
    </div>
    
    <div style="height: calc(100vh - 520px); min-height: 200px; overflow: hidden; overflow-y: auto; border: 1px solid #EBEEF5; border-radius: 4px; margin: 0 20px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);">
      <div class="invoice-list" style="width: 100%;">
        <div class="itm" v-for="(u,k) in paginatedInvoices" :key="k" @click="selected = (selected!==u.id)?u.id:0" :class="{tr1: (k%2),tr2: !(k%2),selected: (selected === u.id)}" style="display: flex; transition: background-color 0.3s;">
          <div style="width: 30px;padding: 10px;font-size: 14px;">{{u.id}}</div>
          <div style="flex: 1;padding: 10px;font-size: 14px;text-align: center;">{{new Date(u.DueDateTime*1000).toLocaleDateString()}}</div>
          <div style="flex: 1;padding: 10px;font-size: 14px;text-align: center;">{{$t('units.currency',{value: u.value})}}</div>
          <div style="width: 200px;padding: 10px;font-size: 14px;text-align: center;" :style="getStatusStyle(u.status)">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 10px; background-color: rgba(0,0,0,0.05);">
              {{KT('invoice.statuses.'+u.status)}}
            </span>
          </div>
          <div style="width: 120px;padding: 10px;font-size: 14px;text-align: center;">
   {{
  (u.payment_date == 0 || !u.payment_date) ? 
    "" : 
    (typeof u.payment_date === 'string' ? 
      new Date(u.payment_date).toLocaleDateString() : 
      new Date(u.payment_date * 1000).toLocaleDateString())
}}
     </div>
          <div style="width: 190px;padding: 10px;font-size: 14px;text-align: center;">
            <span style="font-weight: bold; color: #303133;">
              {{ formatCurrency(calculateRunningBalance(k)) }}
            </span>
            <!-- Mostrar link si existe, sin importar asaas_id -->
            <div v-if="u && u.link && u.link.trim()" style="margin-top: 5px;">
              <a target="_blank" :href="u.link">
                <el-button size="small" type="primary" style="width: 90px;">{{ KT('invoice.link') }}</el-button>
              </a>
            </div>
            <!-- Mostrar estado para debug -->
            <div v-else style="margin-top: 5px;">
              <el-button size="small" type="info" plain disabled style="width: 90px; font-size: 10px;">
                {{ u.asaas_id !== 0 ? 'ID:' + u.asaas_id : 'Sin Link' }}
              </el-button>
            </div>
          </div>
        </div>
        <!-- Mensaje cuando no hay facturas -->
        <div v-if="filteredUsers.length === 0" style="padding: 20px; text-align: center; color: #909399;">
          {{ KT('invoice.noInvoices') }}
        </div>
      </div>
    </div>
    
    <!-- Paginación si hay muchas facturas -->
    <div v-if="filteredUsers.length > 10" style="display: flex; justify-content: center; margin-top: 20px;">
      <el-pagination
        layout="prev, pager, next"
        :total="filteredUsers.length"
        :page-size="10"
        @current-change="onPageChange"
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
import 'element-plus/es/components/pagination/style/css'

import { ElButton, ElDialog, ElNotification, ElInput, ElPagination } from "element-plus";
import { ref, defineExpose, defineAsyncComponent, computed } from 'vue';
import { ElMessageBox } from "element-plus/es/components/message-box";
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ShowInvoicesManagerUserAdd = defineAsyncComponent(() => import("./show-invoices-manager-user-add.vue"));
const invoicesUserAddRef = ref(null);
const selected = ref(0);
const show = ref(false);

import KT from "@/tarkan/func/kt";

// Función para normalizar facturas que vienen de la API con valores string
const normalizeInvoice = (invoice) => {
  const normalized = {
    ...invoice, // IMPORTANTE: Mantener TODOS los campos originales
    value: parseFloat(invoice.value) || 0,
    id: parseInt(invoice.id) || 0,
    user_id: parseInt(invoice.user_id) || 0,
    asaas_id: parseInt(invoice.asaas_id) || 0,
    DueDateTime: parseInt(invoice.DueDateTime) || 0,
    payment_date: parseInt(invoice.payment_date) || 0
  };
  
  // Debug para verificar que no perdemos el link
  if (invoice.id && (invoice.link || invoice.asaas_id !== 0)) {
    console.log(`Normalizando factura ${invoice.id}:`, {
      original_link: invoice.link,
      normalized_link: normalized.link,
      original_asaas_id: invoice.asaas_id,
      normalized_asaas_id: normalized.asaas_id
    });
  }
  
  return normalized;
};

const filteredUsers = ref([]);
const allInvoices = ref([]); // Todas las facturas sin filtrar
const title = ref('');
const user = ref(false);
const searchQuery = ref(''); // Query de búsqueda

// Paginación
const currentPage = ref(1);
const pageSize = 10;

// Estados de facturas para diferentes categorías
const pendingStatus = ['PENDING', 'OVERDUE'];
const paidStatus = ['RECEIVED_IN_CASH', 'RECEIVED', 'CONFIRMED'];

// Función para obtener la fecha de vencimiento más reciente - comentada por ahora ya que no se usa
/* const getLastDueDate = () => {
  if (!filteredUsers.value.length) return KT('no');
  
  // Filtrar facturas pendientes o vencidas
  const pendingInvoices = filteredUsers.value.filter(invoice => 
    pendingStatus.includes(invoice.status));
  
  if (pendingInvoices.length === 0) return KT('no'); */
  
  /* // Encontrar la factura con la fecha de vencimiento más reciente
  const latestDueDate = Math.max(...pendingInvoices.map(invoice => invoice.DueDateTime));
  return new Date(latestDueDate * 1000).toLocaleDateString();
  */

const showInvoices = (invoices) => {
  show.value = true;
  user.value = invoices;
  title.value = invoices.name;
  currentPage.value = 1; // Reiniciar a la primera página al abrir

  // Formatear campos de usuario si existen
  if (user.value) {
    // Obtener y formatear CPF/CNPJ desde los atributos del usuario
    if (user.value.attributes) {
      // Buscar en orden de prioridad: tarkan.billingCpfCnpj, cpf, document
      const cpfValue = user.value.attributes?.['tarkan.billingCpfCnpj'] || 
                      user.value.attributes?.cpf || 
                      user.value.attributes?.document || '';
      
      if (cpfValue) {
        user.value.cpf = formatDocument(cpfValue);
      }
    }
    
    // Formatear dirección completa si sus componentes existen
    if (user.value.attributes) {
      // Si no hay dirección pero hay componentes individuales, construirla
      if (!user.value.address && 
          (user.value.attributes.rua || 
           user.value.attributes.hausenumber || 
           user.value.attributes.bairro || 
           user.value.attributes.cidade || 
           user.value.attributes.estado)) {
        
        user.value.address = `${ user.value.attributes.rua || '' } ${ user.value.attributes.hausenumber || '' }, ${ user.value.attributes.bairro || '' }, ${ user.value.attributes.cidade || '' }-${ user.value.attributes.estado || '' }`;
      }
    }
  }

  // Guardar todas las facturas sin filtrar y normalizarlas
  const rawInvoices = invoices.invoices || [];
  allInvoices.value = rawInvoices.map(invoice => normalizeInvoice(invoice));
  
  console.log('Facturas normalizadas al cargar:', allInvoices.value.slice(0, 3).map(inv => ({
    id: inv.id, 
    value: inv.value, 
    valueType: typeof inv.value
  })));
  
  // Aplicar filtro inicial (sin filtro de búsqueda)
  applyFilter();
};

// Función para manejar el cambio de página
const onPageChange = (page) => {
  currentPage.value = page;
  
  // Aplicar scroll al inicio de la lista cuando cambia la página
  const container = document.querySelector('.invoice-list');
  if (container) {
    container.scrollTop = 0;
  }
};

// Función para aplicar filtrado y ordenamiento
const applyFilter = () => {
  let filtered = [...allInvoices.value];
  
  // Aplicar filtro de búsqueda si existe
  if (searchQuery.value && searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(invoice => {
      // Buscar en ID
      const idMatch = invoice.id.toString().includes(query);
      
      // Buscar en valor (convertir a string y buscar)
      const valueMatch = invoice.value.toString().includes(query);
      
      // Buscar en estado (traducido)
      const statusMatch = invoice.status ? 
        KT(`invoice.statuses.${invoice.status}`).toLowerCase().includes(query) : false;
      
      // Buscar en fecha de vencimiento
      const dateMatch = invoice.DueDateTime ? 
        new Date(invoice.DueDateTime * 1000).toLocaleDateString().includes(query) : false;
      
      return idMatch || valueMatch || statusMatch || dateMatch;
    });
  }
  
  // Ordenar por ID descendente (más recientes primero)
  filtered.sort((a, b) => b.id - a.id);
  
  // Actualizar lista filtrada
  filteredUsers.value = filtered;
  
  // Resetear paginación a la primera página
  currentPage.value = 1;
};

// Obtener las facturas paginadas
const paginatedInvoices = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredUsers.value.slice(start, end);
});

// Función para calcular el total facturado
const calculateTotalBilled = () => {
  if (!filteredUsers.value.length) return 0;
  return filteredUsers.value.reduce((total, invoice) => total + invoice.value, 0);
};

// Función para calcular la cantidad pendiente
const calculatePendingAmount = () => {
  if (!filteredUsers.value.length) return 0;
  return filteredUsers.value
    .filter(invoice => pendingStatus.includes(invoice.status))
    .reduce((total, invoice) => total + invoice.value, 0);
};

// Función para calcular el total pagado
const calculateTotalPaid = () => {
  if (!filteredUsers.value.length) return 0;
  return filteredUsers.value
    .filter(invoice => paidStatus.includes(invoice.status))
    .reduce((total, invoice) => total + invoice.value, 0);
};

// Función para obtener estilo según el estado de la factura
const getStatusStyle = (status) => {
  if (pendingStatus.includes(status)) {
    return { color: '#E6A23C', fontWeight: 'bold' };
  } else if (paidStatus.includes(status)) {
    return { color: '#67C23A', fontWeight: 'bold' };
  }
  return {};
};

// Función para determinar si se debe mostrar el enlace de pago y opciones
// eslint-disable-next-line no-unused-vars
const shouldShowLinkAndPaymentOptions = (invoice) => {
  const hasLink = invoice && invoice.asaas_id !== 0 && invoice.link;
  
  // Debug para las primeras 3 facturas
  if (invoice && invoice.id <= 140) {
    console.log(`Factura ID ${invoice.id}:`, {
      asaas_id: invoice.asaas_id,
      hasLink: !!invoice.link,
      linkValue: invoice.link,
      shouldShow: hasLink
    });
  }
  
  return hasLink;
};

// Función para calcular el saldo acumulado hasta un índice determinado
const calculateRunningBalance = (index) => {
  if (!filteredUsers.value.length || !paginatedInvoices.value || index < 0) return 0;
  
  let balance = 0;
  for (let i = 0; i <= index; i++) {
    const invoice = paginatedInvoices.value[i];
    if (!invoice) continue; // Saltar si el invoice no está definido
    
    if (pendingStatus.includes(invoice.status)) {
      balance += invoice.value;
    } else if (paidStatus.includes(invoice.status)) {
      balance -= invoice.value;
    }
  }
  
  // Debug para la primera factura
  if (index === 0) {
    console.log('Balance calculado para índice 0:', balance);
    console.log('Primera factura:', paginatedInvoices.value[0]);
    console.log('pendingStatus:', pendingStatus);
  }
  
  return Math.abs(balance); // Devolvemos valor absoluto para simplificar
};

const setAsReceivedCash = () => {
  ElMessageBox.confirm(KT('invoice.confirmCash')).then(() => {
    fetch("/tarkan/invoices/manager/" + selected.value + "/setAsReceivedCash").then(() => {
      ElMessageBox.confirm(KT('invoice.confirmCashSuccess'));
      show.value = false;
    });
  });
};

const doDelete = () => {
  ElMessageBox.confirm(KT('invoice.confirmDelete')).then(() => {
    fetch("/tarkan/invoices/manager/" + selected.value + "/delete", { method: "POST" }).then(() => {
      filteredUsers.value.splice(filteredUsers.value.findIndex((u) => u.id === selected.value), 1);
      ElMessageBox.confirm(KT('invoice.confirmDeleteSuccess'));
      show.value = false;
    });
  });
};

const showUserInvoicesAdd = () => {
  invoicesUserAddRef.value.showInvoices(user.value);
};

// Función para manejar cuando se agrega una nueva factura
const onInvoiceAdded = (newInvoice) => {
  console.log('Nueva factura agregada con datos completos de API:', newInvoice);
  console.log('Datos de la nueva factura - ID:', newInvoice.id, 'Link:', newInvoice.link, 'Status:', newInvoice.status);
  
  // Esperar un tick para asegurar que user.value.invoices se ha actualizado
  setTimeout(() => {
    // Actualizar la lista de todas las facturas con los datos actualizados
    allInvoices.value = [...user.value.invoices];
    
    console.log('Todas las facturas después de agregar:', allInvoices.value.map(inv => ({
      id: inv.id, 
      link: inv.link, 
      status: inv.status,
      value: inv.value
    })));
    
    // Reaplicar el filtro para incluir la nueva factura con datos completos
    applyFilter();
    
    // Forzar actualización de la reactividad
    user.value = { 
      ...user.value, 
      invoices: [...user.value.invoices]
    };
    
    console.log('Lista filtrada después de aplicar filtro:', filteredUsers.value.length, 'facturas');
    console.log('Primera factura en lista filtrada:', filteredUsers.value[0]);
  }, 100);
};

const showTip = (evt, text) => {
  window.$showTip(evt, text);
};

const hideTip = (evt, text) => {
  window.$hideTip(evt, text);
};

// Función para formatear un CPF/CNPJ
const formatDocument = (document) => {
  if (!document) return '';
  
  // Eliminar caracteres no numéricos
  const cleanDoc = document.replace(/\D/g, '');
  
  // Si tiene 11 dígitos, es CPF
  if (cleanDoc.length === 11) {
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } 
  // Si tiene 14 dígitos, es CNPJ
  else if (cleanDoc.length === 14) {
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  
  // Si no tiene un formato reconocible, devolver el original
  return document;
};

// Función para generar el PDF de facturas
const generateInvoicePDF = () => {
  // Crear nuevo documento PDF
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Obtener fecha actual para el reporte
  const today = new Date().toLocaleDateString();
  
  // Configurar fuente y tamaño
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  
  // Encabezado con logo y título
  doc.text(KT('invoice.financialSummary'), 10, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data: ${today}`, 10, 30);
  
  // Línea divisoria horizontal
  doc.setDrawColor(200, 200, 200);
  doc.line(10, 32, 285, 32);
  
  // Panel izquierdo: Información del Cliente
  // Título del panel
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(KT('invoice.userInfo'), 10, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Datos del cliente en formato de tabla
  // Obtener CPF/CNPJ con prioridad desde los atributos del usuario
  let cpfDisplay = user.value?.cpf || KT('notAvailable');
  if (user.value?.attributes) {
    const cpfValue = user.value.attributes?.['tarkan.billingCpfCnpj'] || 
                     user.value.attributes?.cpf || 
                     user.value.attributes?.document || '';
    if (cpfValue) {
      cpfDisplay = formatDocument(cpfValue);
    }
  }
  
  const clienteData = [
    [KT('user.name') + ':', user.value?.name || KT('notAvailable')],
    [KT('user.billingCpfCnpj') + ':', cpfDisplay],
    [KT('user.email') + ':', user.value?.email || KT('notAvailable')],
    [KT('user.phone') + ':', user.value?.phone || KT('notAvailable')],
    [KT('user.address') + ':', user.value?.address || KT('notAvailable')]
  ];
  
  // Si hay información de empresa, agregarla
  if (user.value?.company) {
    clienteData.push([KT('user.company') + ':', user.value.company]);
  }
  
  // Dibujar datos del cliente
  let yPos = 46;
  clienteData.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], 10, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 40, yPos);
    yPos += 7;
  });
  
  // Panel derecho: Resumen financiero (en la parte superior derecha)
  const pageWidth = doc.internal.pageSize.width;
  const rightPanelX = pageWidth - 110; // 110mm desde el borde derecho
  
  // Título del panel financiero
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(KT('invoice.financialSummary'), rightPanelX, 40);
  
  // Fondo para el panel financiero
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(rightPanelX, 44, 100, 32, 3, 3, 'FD');
  
  // Contenido del panel financiero
  doc.setFontSize(10);
  
  // Total Facturado (con formato de moneda)
  doc.setFont('helvetica', 'bold');
  doc.text(KT('invoice.totalBilled') + ':', rightPanelX + 5, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(
    formatCurrency(calculateTotalBilled()), 
    rightPanelX + 95, 52, { align: 'right' }
  );



  // Total Pagado (con color verde)
  doc.setTextColor(103, 194, 58); // Restaurar color negro
  doc.setFont('helvetica', 'bold');
  doc.text(KT('invoice.totalPaid') + ':', rightPanelX + 5, 60);
  doc.setTextColor(103, 194, 58); // Color verde para los pagos
  doc.text(
    formatCurrency(calculateTotalPaid()), 
    rightPanelX + 95, 60, { align: 'right' }
  );
  
  // Pendiente de Pago (con color destacado)
  doc.setTextColor(230, 162, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(KT('invoice.pendingAmount') + ':', rightPanelX + 5, 68);
  doc.setTextColor(230, 162, 60); // Color naranja para destacar lo pendiente
  doc.text(
    formatCurrency(calculatePendingAmount()), 
    rightPanelX + 95, 68, { align: 'right' }
  );
  
  







  // Restaurar color de texto
  doc.setTextColor(0, 0, 0);
  
  // Agregar línea divisoria antes de la tabla
  doc.setDrawColor(200, 200, 200);
  doc.line(10, 90, 285, 90);
  
  // Título de la sección de facturas
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(KT('usermenu.invoices'), 10, 100);
  
  // Preparar datos para la tabla
  const tableData = filteredUsers.value.map((invoice, index) => {
    // Estado formateado con color
    let status = invoice.status ? KT(`invoice.statuses.${invoice.status}`) : KT('notAvailable');
    
    // Preparar el link para la factura en el PDF (si existe link de pago)
    const linkText = invoice.link ? '🔗' : '-';
    
    return [
      invoice.id.toString(),
      invoice.DueDateTime ? new Date(invoice.DueDateTime * 1000).toLocaleDateString() : '-',
      formatCurrency(invoice.value),
      status,
      (invoice.payment_date == 0 || !invoice.payment_date) ? '-' : (typeof invoice.payment_date === 'string' ? 
      new Date(invoice.payment_date).toLocaleDateString() : 
      new Date(invoice.payment_date * 1000).toLocaleDateString()),
       
        
      formatCurrency(calculateRunningBalance(index)),
      linkText
    ];
  });
  
  // Encabezados de la tabla con estilo mejorado
  const headers = [
    { header: KT('invoice.id'), dataKey: 'id' },
    { header: KT('invoice.dueDate'), dataKey: 'dueDate' },
    { header: KT('invoice.value'), dataKey: 'value' },
    { header: KT('invoice.status'), dataKey: 'status' },
    { header: KT('invoice.paidDate'), dataKey: 'paidDate' },
    { header: KT('invoice.balance'), dataKey: 'balance' },
    { header: KT('invoice.link'), dataKey: 'link' }
  ];
  
  // Generar la tabla con diseño mejorado
  doc.autoTable({
    startY: 110,
    head: [headers.map(h => h.header)],
    body: tableData,
    theme: 'grid', // Usar grid para mostrar todas las líneas de la tabla
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [64, 158, 255],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 10
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { left: 10, right: 10 }, // Reducir márgenes para aprovechar más espacio
    tableWidth: 'auto', // Usar automáticamente el ancho disponible
    // Estilos específicos para cada columna
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },  // ID centrado y un poco más amplio
      1: { halign: 'center', cellWidth: 35 },  // Fecha centrada ampliada
      2: { halign: 'right', cellWidth: 40 },   // Valor a la derecha ampliado
      3: { halign: 'center', cellWidth: 40 },  // Estado centrado ampliado
      4: { halign: 'center', cellWidth: 35 },  // Fecha de pago centrada ampliada
      5: { halign: 'right', cellWidth: 40 },   // Saldo a la derecha ampliado
      6: { halign: 'center', cellWidth: 25 }   // Link de pago centrado
    },
    // Personalizar la celda según el valor (para colorear estados y añadir links)
    didDrawCell: (data) => {
      // Procesar celdas de la columna de estado (índice 3)
      if (data.section === 'body' && data.column.index === 3) {
        const status = data.cell.text[0] || '';
        
        // Cambiar color del texto según el estado
        if (status.includes(KT('invoice.statuses.PENDING')) || status.includes(KT('invoice.statuses.OVERDUE'))) {
          doc.setTextColor(230, 162, 60); // Color naranja para pendientes
        } else if (status.includes(KT('invoice.statuses.RECEIVED')) || 
                  status.includes(KT('invoice.statuses.RECEIVED_IN_CASH')) || 
                  status.includes(KT('invoice.statuses.CONFIRMED'))) {
          doc.setTextColor(103, 194, 58); // Color verde para pagadas
        } else if (status.includes(KT('invoice.statuses.CANCELED'))) {
          doc.setTextColor(245, 108, 108); // Color rojo para canceladas
        }
        
        // Dibujar el texto de la celda con el nuevo color
        doc.text(status, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
          align: 'center',
          baseline: 'middle'
        });
        
        // Restaurar el color de texto para las siguientes celdas
        doc.setTextColor(0, 0, 0);
      }
      
      // Procesar celdas de la columna de link (índice 6)
      if (data.section === 'body' && data.column.index === 6) {
        const linkText = data.cell.text[0];
        
        // Si hay un link (indicado por 🔗)
        if (linkText === '🔗') {
          // Obtener el índice de la factura actual para saber cuál es el link
          const rowIndex = data.row.index;
          const invoice = filteredUsers.value[rowIndex];
          
          if (invoice && invoice.link) {
            // Guardar la posición y dimensiones para crear el link
            const linkX = data.cell.x;
            const linkY = data.cell.y;
            const linkWidth = data.cell.width;
            const linkHeight = data.cell.height;
            
            // Crear un color de fondo para el link para que se destaque
            doc.setFillColor(220, 230, 255); // Color azul claro
            doc.rect(linkX, linkY, linkWidth, linkHeight, 'F');
            
            // Dibujar el texto del link en azul, usando KT para traducción
            doc.setTextColor(0, 0, 255); // Color azul para links
            doc.text(KT('invoice.pay'), linkX + linkWidth / 2, linkY + linkHeight / 2, {
              align: 'center',
              baseline: 'middle'
            });
            
            // Crear el link en el PDF
            doc.link(linkX, linkY, linkWidth, linkHeight, { url: invoice.link });
            
            // Restaurar color de texto
            doc.setTextColor(0, 0, 0);
          }
        }
      }
    }
  });
  
  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
    doc.text(`Tarkan - ${today}`, 10, doc.internal.pageSize.height - 10);
  }
  
  // Guardar PDF con nombre personalizado incluyendo la fecha
  const fileName = `faturas_${user.value?.name || 'cliente'}_${today.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
  
  // Mostrar notificación
  ElNotification({
    title: KT('success'),
    message: 'PDF de faturas gerado com sucesso',
    type: 'success',
    duration: 3000
  });
};

defineExpose({
  showInvoices
});
// Estas variables están definidas pero no se utilizan actualmente
// Cuando se necesiten, se pueden descomentar

/* 
// Facturas generadas (asaas_id debe ser un enlace, no 0)
const billedInvoices = computed(() => 
  filteredUsers.value.filter(u => u.asaas_id !== 0).length
); // Facturas generadas

const paidInvoices = computed(() => 
  filteredUsers.value.filter(u => u.asaas_id !== 0 && u.status == 'RECEIVED').length
); // Facturas pagadas

const outstandingBalance = computed(() => 
  filteredUsers.value
    .filter(u => u.asaas_id !== 0 && u.status !== 'RECEIVED')
    .reduce((acc, u) => acc + u.value, 0)
); // Saldo pendiente

const nextInvoiceDate = computed(() => {
  const nextInvoice = filteredUsers.value
    .filter(u => u.asaas_id !== 0 && u.status !== 'RECEIVED')
    .sort((a, b) => a.DueDateTime - b.DueDateTime)[0];
  
  return nextInvoice ? new Date(nextInvoice.DueDateTime * 1000).toLocaleDateString() : 'N/A';
});

const nextInvoiceValue = computed(() => {
  const nextInvoice = filteredUsers.value
    .filter(u => u.asaas_id !==0 && u.status !== 'RECEIVED')
    .sort((a, b) => a.DueDateTime - b.DueDateTime)[0];
  
  return nextInvoice ? nextInvoice.value : 0;
});
*/

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};


</script>

<style>
.itm {
  border-bottom: silver 1px dotted;
}

.itm div {
  border-right: silver 1px dotted;
}

.tr1 {
  background: #f3f3f3;
}

.tr2 {
  background: #f8f8f8;
}

.selected {
  background: rgba(5, 167, 227, 0.05) !important;
}

.itm div:last-child {
  border-right: none;
}

.el-select.el-select--large {
  width: 100%;
}

.link-button {
  text-decoration: none;
}

.link-button:hover {
  opacity: 0.9;
}

.el-dialog__header, .el-dialog__body, .el-dialog__footer {
  padding: 0px !important;
}

.el-dialog__footer {
  margin-top: 0px;
}

.el-tabs__nav-wrap {
  padding-left: 20px;
  padding-right: 20px;
}

.el-tabs__content {
  padding-left: 20px;
  padding-right: 20px;
}

.danger {
  --el-button-text-color: var(--el-color-danger) !important;
  --el-button-bg-color: #fef0f0 !important;
  --el-button-border-color: #fbc4c4 !important;
  --el-button-hover-text-color: var(--el-color-white) !important;
  --el-button-hover-bg-color: var(--el-color-danger) !important;
  --el-button-hover-border-color: var(--el-color-danger) !important;
  --el-button-active-text-color: var(--el-color-white) !important;
  --el-button-active-border-color: var(--el-color-danger) !important;
}
</style>
