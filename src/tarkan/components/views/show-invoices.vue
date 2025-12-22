<template>
  <el-dialog :lock-scroll="true" :top="'50px'" :width="'60%'" v-model="show" title="Teste">

    <template v-slot:title>
      <div  style="border-bottom: #e0e0e0 1px solid;padding: 20px;">
        <div class="modal-title" style="display: flex;width: calc(100% - 50px); justify-content: space-between; align-items: center;">
          <span>Minhas Faturas</span>
          <el-button type="primary" @click="generateInvoicePDF" style="margin-left: 15px;">
            <i class="fas fa-file-pdf"></i> {{ KT('invoice.generatePDF') }}
          </el-button>
        </div>
      </div>
    </template>
    
    <!-- Panel de información del usuario y resumen financiero -->
    <div class="info-panels" style="display: flex; flex-wrap: wrap; gap: 20px; margin: 20px;">
      <!-- Panel de información del usuario -->
      <div class="user-info" style="flex: 2; min-width: 350px; padding: 15px; border-radius: 8px; background-color: rgba(64, 158, 255, 0.05); border: 1px solid rgba(64, 158, 255, 0.2); box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; align-items: center;">
          <div style="font-size: 16px; font-weight: bold; color: #409EFF;">{{ KT('invoice.userInfo') }}</div>
          <div v-if="userInfo && userInfo.userType" style="padding: 2px 10px; background-color: rgba(103, 194, 58, 0.1); border-radius: 10px; font-size: 12px; color: #67C23A;">
            {{ userInfo.userType }}
          </div>
        </div>
        
        <div style="display: flex; flex-wrap: wrap; gap: 15px;">
          <!-- Columna izquierda -->
          <div style="flex: 1; min-width: 200px;">
            <div class="info-row" style="margin-bottom: 10px;">
              <div style="font-weight: bold; font-size: 13px; color: #606266; margin-bottom: 3px;">{{ KT('user.name') }}</div>
              <div style="font-size: 14px; color: #303133; background-color: rgba(0,0,0,0.02); padding: 5px 10px; border-radius: 4px;">
                {{ userInfo?.name || KT('notAvailable') }}
              </div>
            </div>
            
            <div class="info-row" style="margin-bottom: 10px;">
              <div style="font-weight: bold; font-size: 13px; color: #606266; margin-bottom: 3px;">{{ KT('user.billingCpfCnpj') }}</div>
              <div style="font-size: 14px; color: #303133; background-color: rgba(0,0,0,0.02); padding: 5px 10px; border-radius: 4px;">
                {{ userInfo?.cpf || KT('notAvailable') }}
              </div>
            </div>
            
            
            <div class="info-row" style="margin-bottom: 10px;" v-if="userInfo?.company">
              <div style="font-weight: bold; font-size: 13px; color: #606266; margin-bottom: 3px;">{{ KT('user.company') }}</div>
              <div style="font-size: 14px; color: #303133; background-color: rgba(0,0,0,0.02); padding: 5px 10px; border-radius: 4px;">
                {{ userInfo.company }}
              </div>
            </div>
          </div>
          
          <!-- Columna derecha -->
          <div style="flex: 1; min-width: 200px;">
            <div class="info-row" style="margin-bottom: 10px;">
              <div style="font-weight: bold; font-size: 13px; color: #606266; margin-bottom: 3px;">{{ KT('user.email') }}</div>
              <div style="font-size: 14px; color: #303133; background-color: rgba(0,0,0,0.02); padding: 5px 10px; border-radius: 4px;">
                {{ userInfo?.email || KT('notAvailable') }}
              </div>
            </div>
            
            <div class="info-row" style="margin-bottom: 10px;">
              <div style="font-weight: bold; font-size: 13px; color: #606266; margin-bottom: 3px;">{{ KT('user.phone') }}</div>
              <div style="font-size: 14px; color: #303133; background-color: rgba(0,0,0,0.02); padding: 5px 10px; border-radius: 4px;">
                {{ userInfo?.phone || KT('notAvailable') }}
              </div>
            </div>
            
            <div class="info-row" style="margin-bottom: 10px;">
              <div style="font-weight: bold; font-size: 13px; color: #606266; margin-bottom: 3px;">{{ KT('user.address') }}</div>
              <div style="font-size: 14px; color: #303133; background-color: rgba(0,0,0,0.02); padding: 5px 10px; border-radius: 4px; max-height: 60px; overflow: auto;">
                {{ userInfo?.address || KT('notAvailable') }}
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
          <div style="font-size: 16px; font-weight: bold; color: #409EFF;">{{ $t('units.currency', {value: calculateTotalBilled()}) }}</div>
        </div>
        <div class="finance-item" style="display: flex; justify-content: space-between; padding: 10px; margin-bottom: 8px; background-color: rgba(103, 194, 58, 0.1); border-radius: 6px;">
          <div style="font-weight: bold; color: #67C23A;">{{ KT('invoice.totalPaid') }}</div>
          <div style="font-size: 16px; font-weight: bold; color: #67C23A;">{{ $t('units.currency', {value: calculateTotalPaid()}) }}</div>
        </div>
        <div class="finance-item" style="display: flex; justify-content: space-between; padding: 10px; margin-bottom: 8px; background-color: rgba(230, 162, 60, 0.1); border-radius: 6px;">
          <div style="font-weight: bold; color: #E6A23C;">{{ KT('invoice.pendingAmount') }}</div>
          <div style="font-size: 16px; font-weight: bold; color: #E6A23C;">{{ $t('units.currency', {value: calculatePendingAmount()}) }}</div>
        </div>
        
        
      </div>
    </div>

    
    <div class="itm" style="display: flex;background: #eeeeee;">
      <div  style="padding: 10px;width: 30px;font-size: 12px;">
        {{KT('invoice.id')}}
      </div>

      <div  style="flex: 1;padding: 10px;font-size: 12px;text-align: center;">
        {{KT('invoice.dueDate')}}
      </div>
      <div  style="flex: 1;padding: 10px;font-size: 12px;text-align: center;">
        {{KT('invoice.value')}}
      </div>
      <div  style="width: 200px;padding: 10px;font-size: 12px;text-align: center;">
        {{KT('invoice.status')}}
      </div>
      <div  style="width: 120px;padding: 10px;font-size: 12px;text-align: center;">
        {{KT('invoice.paidDate')}}
      </div>
      <div style="width: 200px;padding: 10px;font-size: 12px;text-align: center;">
        {{KT('invoice.balance')}}
      </div>
    </div>
    <div style="height: calc(100vh - 500px); min-height: 200px; overflow: hidden; overflow-y: auto; border: 1px solid #EBEEF5; border-radius: 4px; margin: 0 20px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);">
      <div class="invoice-list" style="width: 100%;">
        <div class="itm" v-for="(u,k) in paginatedInvoices" :key="k" @click="selected = (selected!==u.id)?u.id:0" :class="{tr1: (k%2),tr2: !(k%2),selected: (selected === u.id)}" style="display: flex; transition: background-color 0.3s;">
          <div style="width: 30px; padding: 10px; font-size: 14px;">{{u.id}}</div>
          <div style="flex: 1; padding: 10px; font-size: 14px; text-align: center;">{{new Date(u.DueDateTime*1000).toLocaleDateString()}}</div>
          <div style="flex: 1; padding: 10px; font-size: 14px; text-align: center;">{{$t('units.currency',{value: u.value})}}</div>
          <div style="width: 200px; padding: 10px; font-size: 14px; text-align: center;" :style="getStatusStyle(u.status)">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 10px; background-color: rgba(0,0,0,0.05);">
              {{KT('invoice.statuses.'+u.status)}}
            </span>
          </div>
          <div style="width: 120px; padding: 10px; font-size: 14px; text-align: center;">
            {{
  (u.payment_date == 0 || !u.payment_date) ? 
    "" : 
    (typeof u.payment_date === 'string' ? 
      new Date(u.payment_date).toLocaleDateString() : 
      new Date(u.payment_date * 1000).toLocaleDateString())
}}
          </div>
          <div style="width: 190px; padding: 10px; font-size: 14px; text-align: center;">
            <span style="font-weight: bold; color: #303133;">
              {{ $t('units.currency', {value: calculateRunningBalance(k)}) }}
            </span>
            <div v-if="shouldShowPaymentLink(u.status)" style="margin-top: 5px;">
              <a target="_blank" :href="u.link" class="link-button">
                <el-button size="small" type="primary" style="width: 90px;">
                  <i class="fas fa-link" style="margin-right: 5px;"></i>
                  {{ KT('invoice.pay') }}
                </el-button>
              </a>
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

import {ElDialog,ElButton,ElPagination} from "element-plus";

import {ref,defineExpose,computed} from 'vue';
import {useStore} from 'vuex'
import { jsPDF } from 'jspdf';  // Importar jsPDF
// import {ElMessageBox} from "element-plus/es/components/message-box";
import {ElNotification} from "element-plus/es/components/notification";
import KT from '../../func/kt.js';

// Estas funciones se declaran pero no se utilizan actualmente
/* const showTip = (evt,text)=>{
  window.$showTip(evt,text);
}

const hideTip = (evt,text)=>{
  window.$hideTip(evt,text);
} */

const store = useStore();
// const query = ref(''); // No se usa actualmente
const selected = ref(0);
const show = ref(false);

// Datos de facturas
const filteredUsers = ref([]);

// Referencia al usuario actual que se obtendrá del store
const userInfo = ref(null);

// Paginación
const currentPage = ref(1);
const pageSize = 10;

// Estados de facturas para diferentes categorías
const pendingStatus = ['PENDING', 'OVERDUE'];
const paidStatus = ['RECEIVED_IN_CASH', 'RECEIVED', 'CONFIRMED'];




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

// Función para calcular el saldo acumulado hasta un índice determinado
const calculateRunningBalance = (index) => {
  if (!filteredUsers.value.length) return 0;
  
  let balance = 0;
  for (let i = 0; i <= index; i++) {
    const invoice = filteredUsers.value[i];
    if (pendingStatus.includes(invoice.status)) {
      balance += invoice.value;
    } else if (paidStatus.includes(invoice.status)) {
      balance -= invoice.value;
    }
  }
  return Math.abs(balance); // Devolvemos valor absoluto para simplificar
};

// Función para determinar si se debe mostrar el enlace de pago
const shouldShowPaymentLink = (status) => {
  return pendingStatus.includes(status);
};

// Función para obtener la fecha de vencimiento más reciente - comentada por ahora ya que no se usa
/* const getLastDueDate = () => {
  if (!userInvoices.value.length) return KT('no');
  
  // Filtrar facturas pendientes o vencidas
  const pendingInvoices = userInvoices.value.filter(invoice => 
    pendingStatus.includes(invoice.status));
  
  if (pendingInvoices.length === 0) return KT('no'); */
  
  /* // Encontrar la factura con la fecha de vencimiento más reciente
  const latestDueDate = Math.max(...pendingInvoices.map(invoice => invoice.DueDateTime));
  return new Date(latestDueDate * 1000).toLocaleDateString();
  */

// Función para obtener estilo según el estado de la factura
const getStatusStyle = (status) => {
  if (pendingStatus.includes(status)) {
    return { color: '#E6A23C', fontWeight: 'bold' };
  } else if (paidStatus.includes(status)) {
    return { color: '#67C23A', fontWeight: 'bold' };
  }
  return {};
};

// Función para formatear un CPF (XXX.XXX.XXX-XX)
const formatCPF = (cpf) => {
  if (!cpf) return '';
  
  // Eliminar caracteres no numéricos
  const cpfClean = cpf.replace(/\D/g, '');
  
  // Si no tiene 11 dígitos, devolver el valor original
  if (cpfClean.length !== 11) return cpf;
  
  // Aplicar formato XXX.XXX.XXX-XX
  return cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

// Función para obtener información del usuario actual desde el store
const getUserInfo = () => {
  try {
    // Obtener el ID del usuario actual desde el store de autenticación
    const currentUserId = store.state.auth.id;
    
    // Verificar si el ID del usuario existe
    if (!currentUserId) {
      console.error('ID de usuario no encontrado en el store de autenticación');
      throw new Error('ID de usuario no encontrado');
    }
    
    // Obtener la información completa del usuario desde el store de usuarios
    const user = store.getters['users/getUser'](currentUserId);
    
    if (user) {
      // Formatear y enriquecer la información del usuario
      userInfo.value = {
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        // Formatear CPF si existe en los atributos - primero check atributo tarkan.billingCpfCnpj
        cpf: user.attributes?.['tarkan.billingCpfCnpj'] ? formatCPF(user.attributes['tarkan.billingCpfCnpj']) : 
          (user.attributes?.cpf ? formatCPF(user.attributes.cpf) : 
          (user.attributes?.document ? formatCPF(user.attributes.document) : '')),
        // Obtener dirección compuesta de los atributos del usuario
        address: user.attributes?.address || (
          user.attributes ? 
          `${user.attributes.rua || ''} ${user.attributes.hausenumber || ''}, ${user.attributes.bairro || ''}, ${user.attributes.cidade || ''}-${user.attributes.estado || ''}` : 
          ''
        ),
        // Obtener información de empresa si existe
        company: user.attributes?.company || '',
        // Agregar cualquier otro dato relevante del usuario
        deviceCount: user.deviceLimit || 0,
        userType: user.administrator ? 'Administrador' : (user.userLimit > 0 ? 'Gerente' : 'Cliente')
      };
      
      console.log('Información de usuario cargada desde el store:', userInfo.value);
    } else {
      console.error('Usuario no encontrado en el store:', currentUserId);
      // Crear un objeto vacío para evitar errores
      userInfo.value = {
        name: '',
        email: '',
        phone: '',
        address: '',
        cpf: ''
      };
    }
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    // Crear un objeto vacío para evitar errores
    userInfo.value = {
      name: '',
      email: '',
      phone: '',
      address: '',
      cpf: ''
    };
  }
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

// Obtener las facturas paginadas
const paginatedInvoices = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredUsers.value.slice(start, end);
});

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
  doc.text(KT('usermenu.invoices'), 10, 22);
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
  const clienteData = [
    [KT('user.name') + ':', userInfo.value?.name || KT('notAvailable')],
    [KT('user.billingCpfCnpj') + ':', userInfo.value?.cpf || KT('notAvailable')],
    [KT('user.email') + ':', userInfo.value?.email || KT('notAvailable')],
    [KT('user.phone') + ':', userInfo.value?.phone || KT('notAvailable')],
    [KT('user.address') + ':', userInfo.value?.address || KT('notAvailable')]
     ];
  
  // Si hay información de empresa, agregarla
  if (userInfo.value?.company) {
    clienteData.push([KT('user.company') + ':', userInfo.value.company]);
  }
  
  // Información de tipo de usuario
  clienteData.push(['Tipo de Usuário:', userInfo.value?.userType || 'Cliente']);
  
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
    `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalBilled())}`, 
    rightPanelX + 95, 52, { align: 'right' }
  );
  
  // Pendiente de Pago (con color destacado)
  doc.setFont('helvetica', 'bold');
  doc.text(KT('invoice.pendingAmount') + ':', rightPanelX + 5, 60);
  doc.setTextColor(230, 162, 60); // Color naranja para destacar lo pendiente
  doc.text(
    `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatePendingAmount())}`, 
    rightPanelX + 95, 60, { align: 'right' }
  );
  
  // Total Pagado (con color verde)
  doc.setTextColor(0, 0, 0); // Restaurar color negro
  doc.setFont('helvetica', 'bold');
  doc.text(KT('invoice.totalPaid') + ':', rightPanelX + 5, 68);
  doc.setTextColor(103, 194, 58); // Color verde para los pagos
  doc.text(
    `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalPaid())}`, 
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
    let status = KT(`invoice.statuses.${invoice.status}`);
    
    return [
      invoice.id.toString(),
      new Date(invoice.DueDateTime * 1000).toLocaleDateString(),
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.value),
      status,
      (invoice.payment_date === 0 || !invoice.payment_date) ? '-' : new Date(invoice.payment_date*1000).toLocaleDateString(),
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateRunningBalance(index))
    ];
  });
  
  // Encabezados de la tabla con estilo mejorado
  const headers = [
    { header: KT('invoice.id'), dataKey: 'id' },
    { header: KT('invoice.dueDate'), dataKey: 'dueDate' },
    { header: KT('invoice.value'), dataKey: 'value' },
    { header: KT('invoice.status'), dataKey: 'status' },
    { header: KT('invoice.paidDate'), dataKey: 'paidDate' },
    { header: KT('invoice.balance'), dataKey: 'balance' }
  ];
  
  // Generar la tabla con diseño mejorado - ampliada para usar mejor el espacio horizontal
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
    // Estilos específicos para cada columna - ajustados para usar mejor el espacio horizontal
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },  // ID centrado y un poco más amplio
      1: { halign: 'center', cellWidth: 35 },  // Fecha centrada ampliada
      2: { halign: 'right', cellWidth: 40 },   // Valor a la derecha ampliado
      3: { halign: 'center', cellWidth: 40 },  // Estado centrado ampliado
      4: { halign: 'center', cellWidth: 35 },  // Fecha de pago centrada ampliada
      5: { halign: 'right', cellWidth: 40 }   // Saldo a la derecha ampliado
    },
    // Personalizar la celda según el valor (para colorear estados y añadir links)
    didDrawCell: (data) => {
      // Procesar celdas de la columna de estado (índice 3)
      if (data.section === 'body' && data.column.index === 3) {
        const status = data.cell.text[0] || '';
        
        // Cambiar color del texto según el estado
        if (status.includes(KT('invoice.statuses.PENDING')) || status.includes(KT('invoice.statuses.OVERDUE'))) {
          doc.setTextColor(230, 162, 60); // Color naranja para pendientes
          doc.text(status, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
            align: 'center',
            baseline: 'middle'
          });
        } else if (status.includes(KT('invoice.statuses.RECEIVED')) || 
                  status.includes(KT('invoice.statuses.RECEIVED_IN_CASH')) || 
                  status.includes(KT('invoice.statuses.CONFIRMED'))) {
          doc.setTextColor(103, 194, 58); // Color verde para pagadas
          doc.text(status, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
            align: 'center',
            baseline: 'middle'
          });
        } else if (status.includes(KT('invoice.statuses.CANCELED'))) {
          doc.setTextColor(245, 108, 108); // Color rojo para canceladas
          doc.text(status, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
            align: 'center',
            baseline: 'middle'
          });
        }
        
        // Restaurar el color de texto para las siguientes celdas
        doc.setTextColor(0, 0, 0);
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
  const fileName = `faturas_${userInfo.value?.name || 'cliente'}_${today.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
  
  // Mostrar notificación
  ElNotification({
    title: KT('success'),
    message: 'PDF de faturas gerado com sucesso',
    type: 'success',
    duration: 3000
  });
};

const showInvoices = async () => {
  show.value = true;
  currentPage.value = 1; // Reiniciar a la primera página al abrir
  
  try {
    // Cargar los usuarios del store si aún no están cargados
    if (store.state.users.userList.length === 0) {
      console.log('Cargando usuarios en el store...');
      await store.dispatch('users/load');
    }
    
    // Obtener información del usuario del store
    getUserInfo();
    
    // Mostrar indicador de carga
    ElNotification({
      title: 'Cargando',
      message: 'Buscando suas faturas...',
      type: 'info',
      duration: 2000
    });
    
    // Obtener facturas
    const response = await fetch("/tarkan/invoices");
    const json = await response.json();
    
    if (json && Array.isArray(json)) {
      // Ordenar facturas por fecha (las más recientes primero)
      filteredUsers.value = json.sort((a, b) => b.DueDateTime - a.DueDateTime);
      console.log(`Cargadas ${filteredUsers.value.length} facturas del usuario`);
    } else {
      console.error('Formato de respuesta inválido:', json);
      filteredUsers.value = [];
      ElNotification({
        title: 'Aviso',
        message: 'Nenhuma fatura encontrada',
        type: 'warning',
        duration: 3000
      });
    }
  } catch (error) {
    console.error('Error loading invoices:', error);
    ElNotification({
      title: 'Error',
      message: 'Não foi possível carregar as faturas',
      type: 'error',
      duration: 5000
    });
  }
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

.link-button {
  text-decoration: none;
}

.link-button:hover {
  opacity: 0.9;
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

</style>