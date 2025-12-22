<template>


    <el-dialog :lock-scroll="true"  :width="'50%'" v-model="show"  title="Teste">
  
      <template v-slot:title>
        <div  style="border-bottom: #e0e0e0 1px solid;padding: 20px;">
          <div class="modal-title" style="display: flex;width: calc(100% - 50px)">
            {{KT('login.suspended')}}
          </div>
        </div>
      </template>
  
  
      <template v-slot:footer>
        <div  style="border-top: #e0e0e0 1px solid;padding: 20px;display: flex;justify-content: space-between;">
  
  
          <el-button v-if="trustAvailable"
              type="primary" @click="doTrustUnlock()"  >
            <i class="fas fa-user-lock"></i> Realizar desbloqueio de confiança
          </el-button>
  
          <el-button v-else @click="doCancel()"
              type="primary">
            <i class="fas fa-check"></i> OK
          </el-button>
  
  
          <el-button @click="doCancel()"
              type="danger">
            <i class="fas fa-ban"></i> Cancelar
          </el-button>
  
  
  
  
  
        </div>
      </template>
  
      <div style="padding: 20px;    word-break: break-word;">
        {{KT((store.getters['server/getAttribute']('tarkan.billingTrustUnlock'))?'ACCOUNT_IS_SUSPENDED_TRUST':'ACCOUNT_IS_SUSPENDED')}}
      </div>
  
  
      <template v-if="filteredUsers.length>0">
      <div class="itm" style="display: flex;background: #eeeeee;">
  
        <div  style="flex: 1;padding: 10px;font-size: 12px;text-align: center;">
          {{KT('invoice.dueDate')}}
  
        </div>
        <div  style="flex: 1;padding: 10px;font-size: 12px;text-align: center;">
          {{KT('invoice.value')}}
  
        </div>
        <div  style="width: 200px;padding: 10px;font-size: 12px;text-align: center;">
          {{KT('invoice.status')}}
        </div>
        <div style="width: 200px;padding: 10px;font-size: 12px;text-align: center;">
  
        </div>
      </div>
      <div style="height: calc(100vh - 500px); overflow: hidden; overflow-y: scroll;">
  
  
  
        <div class="itm" v-for="(u,k) in filteredUsers" :key="k" @click="selected = (selected!==u.id)?u.id:0" :class="{tr1: (k%2),tr2: !(k%2),selected: (selected === u.id)}" style="display: flex;">
  
          <div style="flex: 1;padding: 10px;font-size: 14px;text-align: center;">{{new Date(u.DueDateTime*1000).toLocaleDateString()}}</div>
          <div style="flex: 1;padding: 10px;font-size: 14px;text-align: center;">{{$t('units.currency',{value: u.value})}}</div>
          <div style="width: 200px;padding: 10px;font-size: 14px;text-align: center;">{{KT('invoice.statuses.'+u.status)}}</div>
          <div style="width: 190px;padding: 10px;font-size: 14px;text-align: center;"><a target="_blank" :href="u.link">Pagar agora</a></div>
        </div>
  
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
  
  import {ElButton, ElDialog} from "element-plus";
  
  import {ref, defineExpose, inject} from 'vue';
  
  import {useStore} from 'vuex';
  
  
  const filteredUsers = ref([]);
  
  const store = useStore();
  
  
  
  const show = ref(false);
  
  import KT from "@/tarkan/func/kt";
  import {ElMessageBox} from "element-plus/es/components/message-box";
  
  
  const trustAvailable = ref(false);
  
  
  const user = ref('');
  const pass = ref('');
  
  const doLogin = inject('doLogin');
  
  
  const showBox = (username,password,trust,invoices)=>{
  
    user.value = username;
    pass.value = password;
  
    console.log(trust);
  
    trustAvailable.value = trust;
  
    filteredUsers.value = invoices;
  
    show.value = true;
  }
  
  const doCancel = ()=>{
    show.value = false;
  }
  
  const doTrustUnlock = ()=>{
  
  
    const data = {'username': user.value,'password': pass.value};
  
  
    show.value = false;
  
    fetch("/tarkan/invoices/unlock", {
      "headers": {
        "content-type": "application/json",
      },
      "body": JSON.stringify(data),
      "method": "POST"
    }).then((r)=>{
        r.json().then((j)=> {
          if(j.error == 'already trust'){
            ElMessageBox.confirm(KT('invoice.alreadyTrust') || r.err)
                .then(() => {
                })
                .catch(() => {
                  // catch error
                })
          }else {
            doLogin();
          }
  
        });
    });
  }
  
  
  defineExpose({
    showBox
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