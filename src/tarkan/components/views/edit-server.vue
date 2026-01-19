<template>
  <el-dialog :lock-scroll="true" v-model="show">

    <template v-slot:title>
      <div  style="border-bottom: #e0e0e0 1px solid;padding: 20px;">
        <div class="modal-title" >{{title}}</div>
      </div>
    </template>
    <template v-slot:footer>
      <div  style="border-top: #e0e0e0 1px solid;padding: 20px;display: flex;justify-content: space-between;">

        <el-button type="danger" plain @click="doCancel()">{{KT('cancel')}}</el-button>

        <el-button type="warning" plain @click="doRestart()">{{KT('server.restart')}}</el-button>
        <el-button type="primary" @click="doSave()">{{KT('save')}}</el-button>
      </div>
    </template>

    <el-tabs v-model="tab">

      <el-tab-pane :label="KT('server.preferences')" name="first">

        <el-form label-width="120px" label-position="top">



          <el-form-item :label="KT('server.language')" >
            <el-select v-model="formData.attributes['tarkan.lang']" @change="updateLanguage" filterable :size="'large'"  :placeholder="KT('server.language')" :no-match-text="KT('NO_MATCH_TEXT')" :no-data-text="KT('NO_DATA_TEXT')">
              <el-option
                  :label="'Português do Brasil'"
                  :value="'pt-BR'"
              >
              </el-option>
              <el-option
                  :label="'Inglês'"
                  :value="'en-US'"
              >
              </el-option>
              <el-option
                  :label="'Espanhol'"
                  :value="'es-ES'"
              >
              </el-option>
            </el-select>
          </el-form-item>

        <el-form-item :label="KT('server.map')" >
          <el-select v-model="formData.map" filterable :size="'large'"  :placeholder="KT('server.map')" :no-match-text="KT('NO_MATCH_TEXT')" :no-data-text="KT('NO_DATA_TEXT')">
          <el-option
              :label="'OpenStreetMap'"
              :value="'openstreet'"
          >
          </el-option>
          <el-option
              :label="'Google Maps Sat'"
              :value="'googleST'"
          >
          </el-option>
            <el-option
                :label="'Google Maps Trafego'"
                :value="'googleTR'"
            >
            </el-option>
            <el-option
                :label="'Google Maps'"
                :value="'googleSN'"
            >
            </el-option>
        </el-select>
        </el-form-item>

        <el-form-item label="Google API Key" >
          <el-input v-model="formData.attributes['google_api']" placeholder="Chave da API do Google Maps"></el-input>
        </el-form-item>

        <div style="border-top: 1px solid #e0e0e0; margin: 20px 0; padding-top: 15px;">
          <div style="font-weight: bold; margin-bottom: 15px; font-size: 14px; color: #303133;">Configuração SMS</div>
          
          <el-form-item label="SMS API URL" >
            <el-input v-model="formData.attributes['sms_api_url']" placeholder="URL da API de SMS"></el-input>
          </el-form-item>
          <el-form-item label="SMS API Key" >
            <el-input v-model="formData.attributes['sms_api_key']" placeholder="Chave da API de SMS"></el-input>
          </el-form-item>
          <el-form-item label="SMS API Type" >
            <el-input v-model="formData.attributes['sms_api_type']" placeholder="Tipo da API (GET/POST)"></el-input>
          </el-form-item>
          <el-form-item label="SMS API Refer" >
            <el-input v-model="formData.attributes['sms_api_refer']" placeholder="Referência da API"></el-input>
          </el-form-item>
        </div>


        <el-form-item :label="KT('server.latitude')" >
          <el-input v-model="formData.latitude" ></el-input>
        </el-form-item>
        <el-form-item :label="KT('server.longitude')" >
          <el-input v-model="formData.longitude" ></el-input>
        </el-form-item>
        <el-form-item :label="KT('server.zoom')" >
          <el-input v-model="formData.zoom"></el-input>
        </el-form-item>


        <el-form-item :label="KT('server.coordinateFormat')" >
          <el-input v-model="formData.coordinateFormat" ></el-input>
        </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane  :label="KT('server.permissions')" name="third">

        <el-form label-width="120px" label-position="top">
          <el-form-item :label="KT('server.registration')">
            <el-switch
                v-model="formData.registration"
                :inactive-text="KT('disabled')"
                :active-text="KT('enabled')"
                :active-value="true"
                :inactive-value="false"
            >
            </el-switch>
          </el-form-item>

          <el-form-item  :label="KT('server.readOnly')">
            <el-switch
                v-model="formData.readOnly"
                :inactive-text="KT('no')"
                :active-text="KT('yes')"
            >
            </el-switch>
          </el-form-item>


          <el-form-item  :label="KT('server.deviceReadonly')">
            <el-switch
                v-model="formData.deviceReadonly"
                :inactive-text="KT('no')"
                :active-text="KT('yes')"
            >
            </el-switch>
          </el-form-item>

          <el-form-item  :label="KT('server.limitCommands')">
            <el-switch
                v-model="formData.limitCommands"
                :inactive-text="KT('no')"
                :active-text="KT('yes')"
                :active-value="false"
                :inactive-value="true"
            >
            </el-switch>
          </el-form-item>


          <el-form-item v-if="store.state.auth.id === 1 && store.state.auth.administrator" :label="$t('server.deviceLimit')" >
            <el-switch
                v-model="deviceLimit"
                :inactive-text="$t('set')"
                :active-text="$t('unlimited')"

                :active-value="-1"
                :inactive-value="0"
                :disabled="isSupAdmin"
                @change="changeDeviceLimit($event)"
            >
            </el-switch>
            <el-input v-if="parseInt(formData.attributes['tarkan.deviceLimit'])!==-1" v-model="formData.attributes['tarkan.deviceLimit']"></el-input>
          </el-form-item>

        </el-form>

      </el-tab-pane>


      <el-tab-pane  :label="KT('server.tarkan')" name="firsttk">
        <el-form label-width="120px" label-position="top">

          <el-form-item :label="KT('server.enableLockUnlock')">
            <el-switch
                v-model="formData.attributes['tarkan.enableLockUnlock']"
                :inactive-text="KT('automatic')"
                :active-text="KT('always')"
                :active-value="true"
                :inactive-value="false"
            >
            </el-switch>
          </el-form-item>

          <el-form-item :label="KT('server.enableAdvancedPerms')">
            <el-switch
                v-model="formData.attributes['tarkan.enableAdvancedPerms']"
                :inactive-text="KT('disabled')"
                :active-text="KT('enabled')"
                :active-value="true"
                :inactive-value="false"
            >
            </el-switch>
          </el-form-item>

          <el-form-item :label="KT('server.enableQrDriverId')">
            <el-switch
                v-model="formData.attributes['tarkan.enableQrDriverId']"
                :inactive-text="KT('disabled')"
                :active-text="KT('enabled')"
                :active-value="true"
                :inactive-value="false"
            >
            </el-switch>
          </el-form-item>

          <el-form-item :label="KT('server.lazyDeletion')">
            <el-switch
                v-model="formData.attributes['tarkan.enableLazyDeletion']"
                :inactive-text="KT('disabled')"
                :active-text="KT('enabled')"
                :active-value="true"
                :inactive-value="false"
            >
            </el-switch>
          </el-form-item>

          <el-form-item :label="KT('server.showStops')">
            <el-switch
                v-model="formData.attributes['tarkan.enableStops']"
                :inactive-text="KT('disabled')"
                :active-text="KT('enabled')"
                :active-value="true"
                :inactive-value="false"
            >
            </el-switch>
          </el-form-item>

          <el-form-item :label="KT('server.showEvents')">
            <el-switch
                v-model="formData.attributes['tarkan.enableEvents']"
                :inactive-text="KT('disabled')"
                :active-text="KT('enabled')"
                :active-value="true"
                :inactive-value="false"
            >
            </el-switch>
          </el-form-item>

          <div style="border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0; padding-top: 20px;">
            <div style="font-weight: bold; margin-bottom: 15px; font-size: 14px; color: #303133;">Preferências de Mapa Padrão</div>

            <el-form-item :label="'Mostrar Geocercas por Padrão'">
              <el-switch
                  v-model="formData.attributes['tarkan.mapPref.geofences']"
                  :inactive-text="KT('disabled')"
                  :active-text="KT('enabled')"
                  :active-value="true"
                  :inactive-value="false"
              >
              </el-switch>
            </el-form-item>

            <el-form-item :label="'Mostrar Nome por Padrão'">
              <el-switch
                  v-model="formData.attributes['tarkan.mapPref.name']"
                  :inactive-text="KT('disabled')"
                  :active-text="KT('enabled')"
                  :active-value="true"
                  :inactive-value="false"
              >
              </el-switch>
            </el-form-item>

            <el-form-item :label="'Mostrar Status por Padrão'">
              <el-switch
                  v-model="formData.attributes['tarkan.mapPref.status']"
                  :inactive-text="KT('disabled')"
                  :active-text="KT('enabled')"
                  :active-value="true"
                  :inactive-value="false"
              >
              </el-switch>
            </el-form-item>
          </div>

          <div style="border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0; padding-top: 20px;">
            <div style="font-weight: bold; margin-bottom: 15px; font-size: 14px; color: #303133;">Billing / Cobrança</div>

            <el-form-item :label="KT('server.enableBilling') || 'Habilitar Billing'">
              <el-switch
                  v-model="formData.attributes['tarkan.enableBilling']"
                  :inactive-text="KT('disabled')"
                  :active-text="KT('enabled')"
                  :active-value="true"
                  :inactive-value="false"
              >
              </el-switch>
            </el-form-item>
          </div>

        </el-form>
      </el-tab-pane>

      <!-- Aba Billing -->
      <el-tab-pane v-if="store.state.auth.administrator && formData.attributes['tarkan.enableBilling']" :label="$t('user.billing') || 'Cobrança'" name="billing">
        <el-form label-width="120px" label-position="top">

          <el-form-item :label="$t('user.billingTrustUnlock') || 'Desbloqueio de Confiança'">
            <el-switch
                v-model="formData.attributes['tarkan.billingTrustUnlock']"
                :inactive-text="$t('disabled')"
                :active-text="$t('enabled')"
                :active-value="1"
                :inactive-value="0"
            >
            </el-switch>
          </el-form-item>

          <el-form-item :label="$t('user.billingTrustUnlockDays') || 'Dias de Confiança'">
            <el-input v-model="formData.attributes['tarkan.billingTrustUnlockDays']" :disabled="formData.attributes['tarkan.billingTrustUnlock'] != 1"></el-input>
          </el-form-item>

          <el-form-item :label="$t('user.billingSuspension') || 'Suspensão Automática'">
            <el-switch
                v-model="formData.attributes['tarkan.billingSuspension']"
                :inactive-text="$t('disabled')"
                :active-text="$t('enabled')"
                :active-value="1"
                :inactive-value="0"
            >
            </el-switch>
          </el-form-item>

          <el-form-item :label="$t('user.billingSuspensionDays') || 'Dias para Suspensão'">
            <el-input v-model="formData.attributes['tarkan.billingSuspensionDays']" :disabled="formData.attributes['tarkan.billingSuspension'] != 1"></el-input>
          </el-form-item>

          <el-form-item :label="$t('user.billingDescription') || 'Descrição da Fatura'">
            <el-input v-model="formData.attributes['tarkan.billingDescription']" type="textarea"></el-input>
          </el-form-item>

          <el-form-item :label="$t('user.billingDate') || 'Data de Vencimento'">
            <el-input v-model="formData.attributes['tarkan.billingDate']" type="date"></el-input>
          </el-form-item>

          <el-form-item :label="$t('user.billingPrice') || 'Valor Padrão'">
            <el-input v-model="formData.attributes['tarkan.billingPrice']" type="text"
                      :formatter="(value) => (value=='' || isNaN(parseFloat(value)))?0:(parseFloat(value)/100).toFixed(2).replace('.',',')"
                      :parser="(value) => value.replace(/\$\s?|(,*)/g, '')">
            </el-input>
          </el-form-item>

          <el-form-item :label="$t('user.billingInterest') || 'Juros (%)'">
            <el-input v-model="formData.attributes['tarkan.billingInterest']"></el-input>
          </el-form-item>

          <el-form-item :label="$t('user.billingFineMode') || 'Modo de Multa'">
            <el-switch
                v-model="formData.attributes['tarkan.billingFineMode']"
                :inactive-text="$t('fixed') || 'Fixo'"
                :active-text="$t('percent') || 'Percentual'"
                :active-value="'PERCENTAGE'"
                :inactive-value="'FIXED'"
            >
            </el-switch>
          </el-form-item>

          <el-form-item :label="$t('user.billingFine') || 'Valor da Multa'">
            <el-input v-model="formData.attributes['tarkan.billingFine']"></el-input>
          </el-form-item>

          <el-form-item :label="$t('user.billingDisccountMode') || 'Modo de Desconto'">
            <el-switch
                v-model="formData.attributes['tarkan.billingDisccountMode']"
                :inactive-text="$t('fixed') || 'Fixo'"
                :active-text="$t('percent') || 'Percentual'"
                :active-value="'PERCENTAGE'"
                :inactive-value="'FIXED'"
            >
            </el-switch>
          </el-form-item>

          <el-form-item :label="$t('user.billingDisccount') || 'Valor do Desconto'">
            <el-input v-model="formData.attributes['tarkan.billingDisccount']"></el-input>
          </el-form-item>

          <el-form-item :label="$t('user.billingDisccountDays') || 'Dias para Desconto'">
            <el-input v-model="formData.attributes['tarkan.billingDisccountDays']"></el-input>
          </el-form-item>

        </el-form>
      </el-tab-pane>

      <!-- Aba Atributos ocultada em 11/11/2025 às 19:26 -->
      <!--
      <el-tab-pane :label="KT('attribute.attributes')" name="fourth">

        <tab-attributes v-model="formData.attributes" :type="'server'"></tab-attributes>

      </el-tab-pane>
      -->
    </el-tabs>
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

import {
  ElDialog,
  ElNotification,
  ElTabs,
  ElTabPane,
  ElForm,
  ElSwitch,
  ElFormItem,
  ElSelect,
  ElOption,
  ElButton,
  ElInput,
  ElMessageBox
} from "element-plus";


import {ref,defineExpose} from 'vue';
import {useStore} from 'vuex'

const store = useStore();



// import TabAttributes from "./tab-attributes"; // Comentado em 11/11/2025 às 19:36 - componente não utilizado


const title = ref('');

const show = ref(false);
const tab = ref('first');

const deviceLimit = ref(-1);



const changeDeviceLimit = (e)=>{
  formData.value.attributes['tarkan.deviceLimit'] = e;
}



// eslint-disable-next-line no-undef
const formData = ref(defaultServerData);



import KT from '../../func/kt';
import i18n from '../../../lang'

const updateLanguage = (a)=>{
  i18n.setLocale(a);
}

const showServer = ()=>{

  title.value = KT('server.server');
  tab.value = 'first';
  // eslint-disable-next-line no-undef
  formData.value = JSON.parse(JSON.stringify(defaultServerData));
  let server = store.state.server.serverInfo;


  console.log(server,formData.value);

  // eslint-disable-next-line no-undef
  for(let k of Object.keys(defaultServerData)){
    if(k==='attributes' && server[k].length === 0){
      formData.value['attributes'] = {};
    }else {
      formData.value[k] = server[k];
    }
  }


  if(!formData.value.attributes['tarkan.deviceLimit']){
    formData.value.attributes['tarkan.deviceLimit'] = -1;
    deviceLimit.value = -1;
  }else{
    deviceLimit.value = 0;
  }

  show.value = true;
}

defineExpose({
  showServer
});


const doCancel = ()=>{
  show.value = false;
}

const doRestart = ()=>{
  ElMessageBox.confirm('Ao executar esta ação, o sistema pode demorar alguns minutos para voltar ao ar.','Deseja realmente reiniciar o servidor?').then(()=>{
    window.$traccar.restartServer().then(()=>{
      show.value = false;
      ElNotification({
        title: 'Info',
        message: 'Servidor reiniciando...',
        type: 'info',
      });
    })
  });
}


const doSave = ()=>{


  ElNotification({
    title: KT('info'),
    message: KT('server.saving'),
    type: 'info',
  });

  if(formData.value.attributes['tarkan.deviceLimit'] && formData.value.attributes['tarkan.deviceLimit'] !== false){
    formData.value.attributes['tarkan.deviceLimit'] = parseInt(formData.value.attributes['tarkan.deviceLimit']);
  }

  store.dispatch("server/save",formData.value).then(()=>{


    ElNotification({
      title: KT('success'),
      message: KT('server.saved'),
      type: 'info',
    });

      show.value = false;
  })
}


</script>

<style>

.el-select.el-select--large{
  width: 100%;
}

.el-dialog__header,.el-dialog__body,.el-dialog__footer{
  padding: 0px !important;
}

.el-dialog__footer{
  margin-top: 20px;
}

.el-tabs__nav-wrap{
  padding-left: 20px;
  padding-right: 20px;
}

.el-tabs__content{
  padding-left: 20px;
  padding-right: 20px;
}




</style>