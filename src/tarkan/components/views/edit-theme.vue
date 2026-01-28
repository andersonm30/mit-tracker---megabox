<template>
  <el-dialog :lock-scroll="true" width="750px" v-model="show">

    <template v-slot:title>
      <div  style="border-bottom: #e0e0e0 1px solid;padding: 20px;">
        <div class="modal-title" >{{title}}</div>
      </div>
    </template>
    <template v-slot:footer>
      <div  style="border-top: #e0e0e0 1px solid;padding: 20px;display: flex;justify-content: space-between;">

        <el-button type="danger" plain @click="doCancel()">Cancelar</el-button>
        <el-button type="primary" :loading="saving" :disabled="saving" @click="doSave()">Salvar</el-button>
      </div>
    </template>

    <el-tabs v-model="tab">

      <el-tab-pane label="Geral" name="general">

        <el-form label-width="150px" label-position="left">


          <div style="display: flex;justify-content: space-between">
            <div style="position: relative;background: var(--el-bg-color);width: 300px;height: 150px;">
              <img style="width: 100px;position: absolute;top: 50%;left: calc(50% - 100px);transform: translateY(-50%);" :src="'/mit/assets/custom/icons/android-chrome-192x192.png?uncache='+uncache">
            </div>

            <div>



              <el-form-item label="Icone">
                <el-upload
                    class="upload-demo"
                    action="/tarkan/theme/upload?type=fav-icon"
                    :on-success = "onSuccess"
                >
                  <el-button type="primary">Selecionar</el-button>
                </el-upload>
              </el-form-item>
            </div>

          </div>

          <el-form-item label="Nome do Aplicativo">
            <el-input v-model="labelConf.title"></el-input>
          </el-form-item>


          <el-form-item label="WhatsApp">
            <el-input v-model="labelConf.whatsapp"></el-input>
          </el-form-item>

          <el-form-item label="Logo Interno">
            <el-switch v-model="labelConf.headLogo.image" :active-value="false" :inactive-value="true" inactive-text="Exibir Logo em Imagem" active-text="Exibir Logo em Texto"></el-switch>
            <div style="height: 10px;"></div>
            <el-input v-if="!labelConf.headLogo.image" v-model="labelConf.headLogo.text"></el-input>
          </el-form-item>
        </el-form>
      </el-tab-pane>





      <el-tab-pane label="Tela de Login" name="first">
        <el-form label-width="150px" label-position="left">

          <div style="display: flex;justify-content: space-between">
            <div style="position: relative;">
              <div class="loginfake" :style="'background-image: url(/mit/assets/custom/bg.jpg?uncache='+uncache+');'"></div>
            </div>

            <div>
              <el-form-item  label="Cor do Filtro" >
                <el-color-picker @active-change="updateGlobal()" :show-alpha="true" v-model="formData['--tk-login-filter']" ></el-color-picker>
              </el-form-item>

              <el-form-item label="Imagem de Fundo">
                <el-upload
                    class="upload-demo"
                    action="/tarkan/theme/upload?type=bg-login"

                    :on-success = "onSuccess"
                >
                  <el-button type="primary">Selecionar</el-button>

                </el-upload>
              </el-form-item>



            </div>

          </div>

        </el-form>


      </el-tab-pane>

      <el-tab-pane label="Logos" name="first3">
        <el-form label-width="150px" label-position="left">

          <div style="display: flex;justify-content: space-between">
            <div class="loginfake" style="position: relative;width: 300px;height: 150px;" :style="'background-image: url(/mit/assets/custom/bg.jpg?uncache='+uncache+');'">
              <img style="z-index: 9999999;width: 200px;position: absolute;top: 50%;left: calc(50% - 100px);transform: translateY(-50%);" :src="'/mit/assets/custom/logoWhite.png?uncache='+uncache">
            </div>

            <div>



              <el-form-item label="Logo tela de Login">
                <el-upload
                    class="upload-demo"
                    action="/tarkan/theme/upload?type=logo-login"

                    :on-success = "onSuccess"
                >
                  <el-button type="primary">Selecionar</el-button>

                </el-upload>
              </el-form-item>

              <el-form-item label="Tamanho do Logo">
                <el-slider v-model="sizeLogo" @change="changeLogo($event)" :min="10" :max="100"></el-slider>
              </el-form-item>
            </div>

          </div>





          <div style="display: flex;justify-content: space-between">
            <div style="position: relative;background: var(--el-bg-color);width: 300px;height: 150px;">
              <img style="width: 200px;position: absolute;top: 50%;left: calc(50% - 100px);transform: translateY(-50%);" :src="'/mit/assets/custom/logo.png?uncache='+uncache">
            </div>

            <div>



              <el-form-item label="Logo Interno">
                <el-upload
                    class="upload-demo"
                    action="/tarkan/theme/upload?type=logo-interno"

                    :on-success = "onSuccess"
                >
                  <el-button type="primary">Selecionar</el-button>

                </el-upload>
              </el-form-item>
            </div>

          </div>
        </el-form>


      </el-tab-pane>

      <el-tab-pane label="Cores Gerais" name="first2">
        <el-form label-width="150px" label-position="left">
          <div style="display: flex;justify-content: space-between">
            <el-form-item  label="Cor de Fundo" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-bg-color']" ></el-color-picker>
            </el-form-item>

            <el-form-item  label="Cor do Texto" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-text-color-primary']" ></el-color-picker>
            </el-form-item>
          </div>

          <div style="display: flex;justify-content: space-between">
            <el-form-item  label="Branco Geral" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-white']" ></el-color-picker>
            </el-form-item>

            <el-form-item  label="Preto Geral" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-black']" ></el-color-picker>
            </el-form-item>
          </div>


          <div style="display: flex;justify-content: space-between">
            <el-form-item  label="Cor Principal" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-primary']" ></el-color-picker>
            </el-form-item>

            <el-form-item  label="Cor Principal Tom 1" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-primary-light-1']" ></el-color-picker>
            </el-form-item>
          </div>



          <div style="display: flex;justify-content: space-between">
            <el-form-item  label="Cor Principal Tom 2" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-primary-light-2']" ></el-color-picker>
            </el-form-item>

            <el-form-item  label="Cor Principal Tom 3" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-primary-light-3']" ></el-color-picker>
            </el-form-item>
          </div>



          <div style="display: flex;justify-content: space-between">
            <el-form-item  label="Cor Principal Tom 4" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-primary-light-4']" ></el-color-picker>
            </el-form-item>

            <el-form-item  label="Cor Principal Tom 5" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-primary-light-5']" ></el-color-picker>
            </el-form-item>
          </div>


          <div style="display: flex;justify-content: space-between">
            <el-form-item  label="Cor Principal Tom 6" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-primary-light-6']" ></el-color-picker>
            </el-form-item>

            <el-form-item  label="Cor Principal Tom 7" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-primary-light-7']" ></el-color-picker>
            </el-form-item>
          </div>


          <div style="display: flex;justify-content: space-between">
            <el-form-item  label="Cor Principal Tom 8" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-primary-light-8']" ></el-color-picker>
            </el-form-item>

            <el-form-item  label="Cor Principal Tom 9" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-primary-light-9']" ></el-color-picker>
            </el-form-item>
          </div>




        </el-form>


      </el-tab-pane>


      <el-tab-pane label="Cores de Texto" name="second">
        <el-form label-width="170px" label-position="left">
          <div style="display: flex;justify-content: space-between">
            <el-form-item  label="Cor de Texto Principal" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-text-color-primary']" ></el-color-picker>
            </el-form-item>

            <el-form-item  label="Cor do Texto Regular" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-text-color-regular']" ></el-color-picker>
            </el-form-item>
          </div>

          <div style="display: flex;justify-content: space-between">
            <el-form-item  label="Cor de Texto Secundária" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-text-color-secondary']" ></el-color-picker>
            </el-form-item>

            <el-form-item  label="Cor de Texto Clara" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-text-color-placeholder']" ></el-color-picker>
            </el-form-item>
          </div>

        </el-form>
      </el-tab-pane>


      <el-tab-pane label="Outras Cores" name="third">
        <el-form label-width="170px" label-position="left">
          <div style="display: flex;justify-content: space-between">
            <el-form-item  label="Sucesso" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-success']" ></el-color-picker>
            </el-form-item>

            <el-form-item  label="Sucesso Tom 1" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-success-light']" ></el-color-picker>
            </el-form-item>


            <el-form-item  label="Sucesso Tom 2" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-success-lighter']" ></el-color-picker>
            </el-form-item>
          </div>

          <div style="display: flex;justify-content: space-between">
            <el-form-item  label="Alerta" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-warning']" ></el-color-picker>
            </el-form-item>

            <el-form-item  label="Alerta Tom 1" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-warning-light']" ></el-color-picker>
            </el-form-item>


            <el-form-item  label="Alerta Tom 2" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-warning-lighter']" ></el-color-picker>
            </el-form-item>
          </div>


          <div style="display: flex;justify-content: space-between">
            <el-form-item  label="Perigo" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-danger']" ></el-color-picker>
            </el-form-item>

            <el-form-item  label="Perigo Tom 1" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-danger-light']" ></el-color-picker>
            </el-form-item>


            <el-form-item  label="Perigo Tom 2" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-danger-lighter']" ></el-color-picker>
            </el-form-item>
          </div>



          <div style="display: flex;justify-content: space-between">
            <el-form-item  label="Info" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-info']" ></el-color-picker>
            </el-form-item>

            <el-form-item  label="Info Tom 1" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-info-light']" ></el-color-picker>
            </el-form-item>


            <el-form-item  label="Info Tom 2" >
              <el-color-picker @active-change="updateGlobal()" v-model="formData['--el-color-info-lighter']" ></el-color-picker>
            </el-form-item>
          </div>



        </el-form>
      </el-tab-pane>

      <!-- ✅ TAB LOGIN WHITE-LABEL (novo) -->
      <el-tab-pane label="Login" name="login">
        <el-form label-width="170px" label-position="left">

          <el-form-item label="Título do card">
            <el-input
              v-model="login.title"
              placeholder="Bem-vindo"
              maxlength="60"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="Subtítulo do card">
            <el-input
              v-model="login.subtitle"
              placeholder="Acesse sua conta"
              maxlength="90"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="Modo do background">
            <el-select v-model="login.backgroundMode" style="width: 240px;">
              <el-option label="Imagem" value="image" />
              <el-option label="Gradiente" value="gradient" />
              <el-option label="Cor sólida" value="solid" />
            </el-select>
          </el-form-item>

          <el-form-item label="Background image URL" v-if="login.backgroundMode === 'image'">
            <el-input
              v-model="login.backgroundImageUrl"
              placeholder="/mit/assets/custom/bg.jpg"
            />
            <div style="margin-top:6px; font-size:12px; opacity:.75;">
              Dica: aceite URL absoluta ou path relativo.
            </div>
          </el-form-item>

          <el-form-item label="Overlay (filtro)">
            <el-color-picker
              v-model="login.overlay"
              :show-alpha="true"
            />
            <span style="margin-left:10px; font-size:12px; opacity:.75;">
              Ex: rgba(0,0,0,0.35)
            </span>
          </el-form-item>

          <div style="height: 20px;"></div>

          <el-form-item label="Exibir Remember Me">
            <el-switch v-model="login.showRememberMe" />
          </el-form-item>

          <el-form-item label="Exibir Esqueci Senha">
            <el-switch v-model="login.showForgotPassword" />
          </el-form-item>

          <el-form-item
            label="URL Esqueci Senha"
            v-if="login.showForgotPassword"
          >
            <el-input
              v-model="login.forgotPasswordUrl"
              placeholder="https://suaempresa.com/recuperar-senha"
            />
          </el-form-item>

        </el-form>
      </el-tab-pane>

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
import 'element-plus/es/components/color-picker/style/css'
import 'element-plus/es/components/upload/style/css'
import 'element-plus/es/components/slider/style/css'

import {ElDialog,ElTabs,ElTabPane,ElForm,ElSwitch,ElFormItem,ElButton,ElInput,ElSlider,ElUpload,ElColorPicker,ElMessage} from "element-plus";


import {ref,defineExpose,inject} from 'vue';
import {useStore} from 'vuex';

const store = useStore();
const runtimeApi = inject('runtimeApi', null);

const title = ref('');

const show = ref(false);
const tab = ref('general');

const uncache = ref(new Date().getTime());

const lastApplied = new Map();
const saving = ref(false);

// ✅ LOGIN WHITE-LABEL STATE (novo)
const login = ref({
  title: '',
  subtitle: '',
  backgroundMode: 'image', // 'image' | 'gradient' | 'solid'
  backgroundImageUrl: '',
  overlay: '',
  showRememberMe: true,
  showForgotPassword: false,
  forgotPasswordUrl: ''
});

const defaultConfig = {
  title: '',
  companyName: '',
  whatsapp: '',
  androidApp: {
    enabled: false,
    url: ''
  },
  appleApp: {
    enabled: false,
    url: ''
  },
  dataPolicy: {
    enabled: false,
    url: ''
  },
  loginBackground: {
    mode: 'static',
    sliderSpeed: 5000,
    sliderDirection: 'rightToLeft',
    useAnimatedEffect: false
  },
  headLogo: {
    image: false,
    text: ''
  }
};

const defaultColors = {
  "--tk-login-filter":"rgba(255, 255, 255, 0.65)",
  "--el-color-primary":"#007eff",
  "--el-color-white":"#ffffff",
  "--el-color-black":"#000000",
  "--el-color-primary-light-1":"#53a8ff",
  "--el-color-primary-light-2":"#66b1ff",
  "--el-color-primary-light-3":"#79bbff",
  "--el-color-primary-light-4":"#8cc5ff",
  "--el-color-primary-light-5":"#a0cfff",
  "--el-color-primary-light-6":"#b3d8ff",
  "--el-color-primary-light-7":"#c6e2ff",
  "--el-color-primary-light-8":"#d9ecff",
  "--el-color-primary-light-9":"#ecf5ff",
  "--el-color-success":"#67c23a",
  "--el-color-success-light":"#e1f3d8",
  "--el-color-success-lighter":"#f0f9eb",
  "--el-color-warning":"#e6a23c",
  "--el-color-warning-light":"#faecd8",
  "--el-color-warning-lighter":"#fdf6ec",
  "--el-color-danger":"#f56c6c",
  "--el-color-danger-light":"#fde2e2",
  "--el-color-danger-lighter":"#fef0f0",
  "--el-color-error":"#f56c6c",
  "--el-color-error-light":"#fde2e2",
  "--el-color-error-lighter":"#fef0f0",
  "--el-color-info":"#909399",
  "--el-color-info-light":"#e9e9eb",
  "--el-color-info-lighter":"#f4f4f5",
  "--el-bg-color":"#ffffff",
  "--el-text-color-disabled-base":"#bbb",
  "--el-text-color-primary":"#1a1a1a",
  "--el-text-color-regular":"#606266",
  "--el-text-color-secondary":"#909399",
  "--el-text-color-placeholder":"#c0c4cc",
  "--el-border-color-base":"#dcdfe6",
  "--el-border-color-light":"#e4e7ed",
  "--el-border-color-lighter":"#ebeef5",
  "--el-border-color-extra-light":"#f2f6fc"
};

const buildLabelConf = () => {
  // eslint-disable-next-line no-undef
  const conf = typeof window !== 'undefined' && window.CONFIG ? window.CONFIG : {};
  const merged = {
    ...defaultConfig,
    ...conf
  };

  merged.headLogo = {
    ...defaultConfig.headLogo,
    ...(conf && conf.headLogo ? conf.headLogo : {})
  };

  merged.androidApp = {
    ...defaultConfig.androidApp,
    ...(conf && conf.androidApp ? conf.androidApp : {})
  };

  merged.appleApp = {
    ...defaultConfig.appleApp,
    ...(conf && conf.appleApp ? conf.appleApp : {})
  };

  merged.dataPolicy = {
    ...defaultConfig.dataPolicy,
    ...(conf && conf.dataPolicy ? conf.dataPolicy : {})
  };

  merged.loginBackground = {
    ...defaultConfig.loginBackground,
    ...(conf && conf.loginBackground ? conf.loginBackground : {})
  };

  return merged;
};

const labelConf = ref(buildLabelConf());

const buildColors = () => {
  // eslint-disable-next-line no-undef
  const external = (typeof window !== 'undefined' && window.defaultThemeData && typeof window.defaultThemeData === 'object')
    ? window.defaultThemeData
    : {};
  return { ...defaultColors, ...external };
};

const formData = ref(buildColors());

const sizeLogo = ref(80);

const changeLogo = (e)=>{
  const tmp = JSON.parse(JSON.stringify(store.state.server.serverInfo));
  tmp.attributes['tarkan.logoWidth'] = e;

  store.dispatch("server/save",tmp);
}

let raf = null;
const updateGlobal = () => {
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    const source = formData.value || {};
    const root = document.documentElement;
    if (!root) return;

    for (const [k, raw] of Object.entries(source)) {
      if (!k.startsWith('--')) continue;
      if (!(k in defaultColors)) continue; // whitelist: only allowed CSS vars
      if (raw === null || raw === undefined) continue;

      const v = String(raw);
      if (lastApplied.get(k) === v) continue;

      root.style.setProperty(k, v);
      lastApplied.set(k, v);
    }
  });
}

const onSuccess = ()=>{
  uncache.value = new Date().getTime();
}

// ✅ Carregar config atual do login ao abrir modal
function hydrateLoginFromRuntime() {
  try {
    const cfg = window?.CONFIG || {};
    const existing = cfg.login || cfg.labelConf?.login || null;
    if (!existing) return;

    login.value = {
      ...login.value,
      ...existing
    };
  } catch { /* ignora erro de parsing */ }
}

const showTheme = ()=>{
  title.value = 'Editar Tema';
  tab.value = 'general';
  formData.value = buildColors();
  labelConf.value = buildLabelConf();
  
  // ✅ Carregar config do login
  hydrateLoginFromRuntime();
  
  show.value = true;
  
  const attrs = store?.state?.server?.serverInfo?.attributes || {};
  sizeLogo.value = attrs['tarkan.logoWidth'] || 80;
  
  lastApplied.clear();
  updateGlobal();
}

defineExpose({
  showTheme
});


const doCancel = ()=>{
  if (raf) {
    cancelAnimationFrame(raf);
    raf = null;
  }
  show.value = false;
}





const doSave = async ()=>{
  if (saving.value) return;
  
  saving.value = true;
  try {
    if (!runtimeApi?.saveTheme) {
      throw new Error('Integração runtimeApi.saveTheme não disponível');
    }

    await runtimeApi.saveTheme({config: labelConf.value,colors: formData.value});
    
    // eslint-disable-next-line no-undef
    if (typeof window !== 'undefined') {
      // keep runtime config in sync after save
      // eslint-disable-next-line no-undef
      window.CONFIG = JSON.parse(JSON.stringify(labelConf.value));
      // eslint-disable-next-line no-undef
      window.defaultThemeData = JSON.parse(JSON.stringify(formData.value));
      
      // ✅ Salvar login (canônico)
      window.CONFIG.login = {
        ...(window.CONFIG.login || {}),
        ...login.value
      };

      // (opcional) espelhar em labelConf se seu sistema usa labelConf
      if (!window.CONFIG.labelConf) window.CONFIG.labelConf = {};
      window.CONFIG.labelConf.login = window.CONFIG.login;

      // ✅ HARDENING: sanitizar URL antes de aplicar CSS var
      const safeCssUrl = (url) => {
        if (!url || typeof url !== 'string') return '';
        const trimmed = url.trim();
        if (trimmed.toLowerCase().includes('javascript:')) return '';
        if (trimmed.includes('<') || trimmed.includes('>')) return '';
        return trimmed.replace(/['"`]/g, '');
      };

      // ✅ IMPORTANTE: atualizar tokens do login em runtime via CSS var
      // (isso habilita o login a reagir sem reload)
      try {
        const bgUrl = safeCssUrl(window.CONFIG.login.backgroundImageUrl);
        if (bgUrl) {
          document.documentElement.style.setProperty('--login-bg-image', `url(${bgUrl})`);
        }
        
        // ✅ HARDENING: overlay com fallback seguro
        const overlay = (window.CONFIG.login.overlay || '').trim();
        document.documentElement.style.setProperty('--login-overlay', overlay || 'var(--tk-login-filter)');
      } catch { /* ignora erro ao aplicar tema */ }
      
      // Notify App.vue to refresh header/logo/whatsapp
      // ✅ HARDENING: payload consistente com timestamp
      // eslint-disable-next-line no-undef
      window.dispatchEvent(new CustomEvent('theme:updated', {
        detail: { 
          config: window.CONFIG, 
          colors: window.defaultThemeData,
          timestamp: Date.now()
        }
      }));
    }
    
    updateGlobal();
    show.value = false;
  } catch (error) {
    ElMessage.error(`Erro ao salvar tema: ${error?.response?.status || error?.message || error}`);
  } finally {
    saving.value = false;
  }
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




.loginfake{

  background-size: cover;
  width: 300px;
  height: 150px;
}

.loginfake:after {
  content: " ";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 170px;
  box-sizing: border-box;
  background: var(--tk-login-filter);
}

</style>