<template>
  <el-dialog :lock-scroll="true" :top="'50px'" :width="'60%'" v-model="show" title="Teste">

    <template v-slot:header>
      <div  style="border-bottom: #e0e0e0 1px solid;padding: 20px;">
        <div class="modal-title" style="display: flex;width: calc(100% - 50px)">
          {{KT('invoice.add')}}
        </div>
      </div>
    </template>

    <template v-slot:footer>
      <div  style="border-top: #e0e0e0 1px solid;padding: 20px;display: flex;justify-content: space-between;">


        <el-button
            type="danger" @click="doCancel()"  >
          {{ KT('cancel') }}
        </el-button>


        <el-button
            type="primary"  @click="doAdd()"  >
          {{KT('ok')}}
        </el-button>






      </div>
    </template>

    <div style="padding: 20px">
    <el-form :label-position="'top'">

      <el-form-item :label="$t('user.billingDescription')">
        <el-input
            v-model="formData.attributes['tarkan.billingDescription']"
            :placeholder="store.getters['server/getAttribute']('tarkan.billingDescription','')"
            :size="'large'"></el-input>
      </el-form-item>

      <el-form-item :label="$t('invoice.dueDate')">
        <el-date-picker v-model="formData.attributes['tarkan.billingDate']" :size="'large'"></el-date-picker>
      </el-form-item>

      <el-form-item :label="$t('user.billingPrice')">
        <el-input v-model="formData.attributes['tarkan.billingPrice']"

                  type="text"

                  :formatter="(value) => (value=='' || isNaN(parseFloat(value)))?'':(parseFloat(value)/100).toFixed(2).replace('.',',')"
                  :parser="(value) => value==''?value:value.replace(/\$\s?|(,*)/g, '')"


                  :placeholder="parseFloat(store.getters['server/getAttribute']('tarkan.billingPrice','')/100).toFixed(2)"
                  :size="'large'"></el-input>
      </el-form-item>

      <el-form-item :label="$t('user.billingInterest')">
        <el-input v-model="formData.attributes['tarkan.billingInterest']"
 type="text" 
      :formatter="(value) => (value=='' || isNaN(parseFloat(value)))?'':(parseFloat(value)/100).toFixed(2).replace('.',',')"
                  :parser="(value) => value==''?value:value.replace(/\$\s?|(,*)/g, '')"



                  :placeholder="store.getters['server/getAttribute']('tarkan.billingInterest','')"
                  :size="'large'"></el-input>
      </el-form-item>

    <el-form-item :label="$t('user.billingFine')">
  <div style="display: flex; align-items: center; gap: 10px;">
    
    <!-- SWITCH para elegir entre Porcentaje y Fijo -->
    <el-switch
      v-model="formData.attributes['tarkan.billingFineMode']"
      :inactive-text="$t('fixed')"
      :active-text="$t('percent')"
      :active-value="'PERCENTAGE'"
      :inactive-value="'FIXED'"
    ></el-switch>

    <!-- INPUT con formato correcto para solo números y punto decimal -->
    <el-input 
      v-model="formData.attributes['tarkan.billingFine']"
      type="text" 
      :formatter="(value) => (value=='' || isNaN(parseFloat(value)))?'':(parseFloat(value)/100).toFixed(2).replace('.',',')"
                  :parser="(value) => value==''?value:value.replace(/\$\s?|(,*)/g, '')"


                  :placeholder="parseFloat(store.getters['server/getAttribute']('tarkan.billingFine','')/100).toFixed(2)"
                  :size="'large'"></el-input>
  
  </div>
</el-form-item>





      <el-form-item :label="$t('user.billingDisccountMode')" >
        <el-switch
            v-model="formData.attributes['tarkan.billingDisccountMode']"
            :inactive-text="$t('fixed')"
            :active-text="$t('percent')"
            :active-value="'PERCENTAGE'"
            :inactive-value="'FIXED'"
        >
        </el-switch>
      </el-form-item>


      <el-form-item :label="$t('user.billingDisccount')" :size="'large'">
        <el-input v-if="formData.attributes['tarkan.billingDisccountMode'] == 'PERCENTAGE'" v-model="formData.attributes['tarkan.billingDisccount']"

                  :placeholder="store.getters['server/getAttribute']('tarkan.billingDisccount','')"
                  :size="'large'"></el-input>

        <el-input v-else v-model="formData.attributes['tarkan.billingDisccount']"

                   type="text" 
      :formatter="(value) => (value=='' || isNaN(parseFloat(value)))?'':(parseFloat(value)/100).toFixed(2).replace('.',',')"
                  :parser="(value) => value==''?value:value.replace(/\$\s?|(,*)/g, '')"

                  :placeholder="store.getters['server/getAttribute']('tarkan.billingDisccount','')"
                  :size="'large'"></el-input>
      </el-form-item>


      <el-form-item :label="$t('user.billingDisccountDays')" :size="'large'">
        <el-input v-model="formData.attributes['tarkan.billingDisccountDays']"

                  :placeholder="store.getters['server/getAttribute']('tarkan.billingDisccountDays','')"
                  :size="'large'"></el-input>
      </el-form-item>
    </el-form></div>

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

import {ElButton, ElDatePicker, ElDialog, ElFormItem, ElInput, ElMessage, ElSwitch} from "element-plus";

import {ref,defineExpose,defineEmits} from 'vue';

const emit = defineEmits(['invoice-added']);


import {useStore} from 'vuex'

const store = useStore();
const show = ref(false);

import KT from "@/tarkan/func/kt";






const user = ref(false);
const formData = ref({attributes: {}});


const doCancel = ()=>{
  show.value = false;
}

// Función de WhatsApp deshabilitada - se implementará desde PHP backend
// const sendWhatsAppNotification = async (phone, message) => { ... }

// Función para formatear mensaje de WhatsApp (para uso futuro en PHP backend)
// eslint-disable-next-line no-unused-vars
const generateWhatsAppMessage = (invoice, userName) => {
  const value = (parseFloat(invoice.value) / 100).toFixed(2).replace('.', ',');
  const description = formData.value.attributes['tarkan.billingDescription'] || 'Factura';
  
  let message = `Hola ${userName}!\n\n`;
  message += `Se ha generado tu factura #${invoice.id}:\n`;
  message += `${description}\n`;
  message += `Valor: R$ ${value}\n`;
  
  if (invoice.link) {
    message += `\nLink de pago: ${invoice.link}\n`;
  }
  
  message += `\nGracias por tu preferencia!`;
  
  return message;
};

const doAdd = ()=>{
  // Crear una copia de los atributos para no modificar los originales
  const processedData = JSON.parse(JSON.stringify(formData.value.attributes));
  
  // Procesar el valor de descuento cuando es tipo FIXED para que coincida con el formato
  // de los otros campos (entero sin punto decimal)
  if (processedData['tarkan.billingDisccountMode'] === 'FIXED' && processedData['tarkan.billingDisccount']) {
    // Eliminar cualquier formato (comas, puntos) y convertir a número
    let rawValue = processedData['tarkan.billingDisccount'].toString().replace(/,/g, '.');
    let discountValue = parseFloat(rawValue);
    
    if (!isNaN(discountValue)) {
      // Mantener el formato como los otros campos (sin punto decimal)
      // NO convertir a un valor de dos decimales
      processedData['tarkan.billingDisccount'] = discountValue.toString().replace(/\./g, '');
    }
  }

  // Procesar el precio principal - CRÍTICO PARA EL VALOR CORRECTO
  if (processedData['tarkan.billingPrice']) {
    let priceValue = parseFloat(processedData['tarkan.billingPrice'].toString().replace(/,/g, '.'));
    if (!isNaN(priceValue)) {
      // El precio está almacenado internamente multiplicado por 100, así que enviarlo como está
      processedData['tarkan.billingPrice'] = Math.round(priceValue).toString();
    }
  }

  // También procesar el interés y la multa para asegurar consistencia
  if (processedData['tarkan.billingInterest']) {
    let interestValue = parseFloat(processedData['tarkan.billingInterest'].toString().replace(/,/g, '.'));
    if (!isNaN(interestValue)) {
      processedData['tarkan.billingInterest'] = Math.round(interestValue).toString();
    }
  }
  
  if (processedData['tarkan.billingFine']) {
    let fineValue = parseFloat(processedData['tarkan.billingFine'].toString().replace(/,/g, '.'));
    if (!isNaN(fineValue)) {
      processedData['tarkan.billingFine'] = Math.round(fineValue).toString();
    }
  }

  // Mapear campos desde el formulario a lo que espera la API
  // El campo billingDisccountDays del formulario parece mapear a dueDateLimitDays en la API
  if (processedData['tarkan.billingDisccountDays'] && processedData['tarkan.billingDisccountDays'] !== '0') {
    processedData['dueDateLimitDays'] = parseInt(processedData['tarkan.billingDisccountDays']);
  } else {
    // Valor por defecto si no está presente o es 0
    processedData['dueDateLimitDays'] = 0; // Cambiar de 30 a 0
  }
  
  // Otros campos que podrían ser requeridos por la API
  if (!processedData['installmentCount']) {
    processedData['installmentCount'] = 1; // Una sola cuota por defecto
  }
  
  // Asegurar que los valores sean números donde corresponda
  processedData['dueDateLimitDays'] = parseInt(processedData['dueDateLimitDays']) || 0; // Cambiar de 30 a 0
  processedData['installmentCount'] = parseInt(processedData['installmentCount']) || 1;

  // Solo para depuración - mostrar todos los campos que se enviarán
  console.log("🔄 Todos los valores procesados para enviar a la API:");
  console.log(JSON.stringify(processedData, null, 2));
  
  console.log("📋 Resumen de campos críticos:", {
    price: processedData['tarkan.billingPrice'],
    interest: processedData['tarkan.billingInterest'],
    fine: processedData['tarkan.billingFine'], 
    discount: processedData['tarkan.billingDisccount'],
    dueDateLimitDays: processedData['dueDateLimitDays'],
    installmentCount: processedData['installmentCount'],
    discountDays: processedData['tarkan.billingDisccountDays']
  });

  fetch("/tarkan/invoices/manager/"+user.value.id+"/save",{
    method: "POST",
    headers:{
      "content-type": "application/json"
    },
    body: JSON.stringify(processedData)
  }).then((r)=>{

    r.json().then((j)=> {
      if(j.error){
        ElMessage.success(KT('invoice.'+j.error));
      }else {
        console.log('Respuesta completa de API al crear factura:', j);
        console.log('Link de pago recibido:', j.link);
        console.log('ID asignado:', j.id);
        
        // Normalizar los valores numéricos que vienen como string desde la API
        const normalizedInvoice = {
          ...j,
          value: parseFloat(j.value) || 0,
          id: parseInt(j.id) || 0,
          user_id: parseInt(j.user_id) || 0,
          asaas_id: parseInt(j.asaas_id) || 0
        };
        
        console.log('Factura normalizada:', normalizedInvoice);
        
        user.value.invoices.push(normalizedInvoice);
        ElMessage.success(KT('invoice.addSuccess'));
        
        // TODO: Enviar notificación por WhatsApp desde backend PHP
        console.log('ℹ️ WhatsApp deshabilitado temporalmente - se implementará desde PHP backend');
        
        show.value = false;
        
        // Emitir evento para que el componente padre sepa que se agregó una factura
        emit('invoice-added', normalizedInvoice);
      }
    });

  });
}
const showInvoices = (_user)=>{
    // Limpiar formulario para nueva factura
    formData.value = {
        attributes: {
            'tarkan.billingDescription': '',
            'tarkan.billingDate': '',
            'tarkan.billingPrice': '',
            'tarkan.billingInterest': '',
            'tarkan.billingFine': '',
            'tarkan.billingFineMode': 'FIXED',
            'tarkan.billingDisccountMode': 'FIXED',
            'tarkan.billingDisccount': '',
            'tarkan.billingDisccountDays': '0' // Valor por defecto de 0 días de descuento
        }
    };

    // Si no se pasa usuario (caso de usuario común) o si el usuario no es admin, usar el usuario logueado
    if (!_user || !store.state.auth.administrator) {
        user.value = store.state.auth;
    } else {
        user.value = _user;
    }

    show.value = true;
}


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

</style>