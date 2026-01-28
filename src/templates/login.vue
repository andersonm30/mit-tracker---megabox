<template>
  <div class="mitapp-login">
    <div class="login__bg" aria-hidden="true"></div>
    <div class="login__overlay" aria-hidden="true"></div>

    <div class="login__shell">
      <div class="login__card" role="main" aria-label="Login">
        <!-- Toggle Dark Mode -->
        <button 
          class="login__theme-toggle"
          type="button"
          @click="toggleDarkMode"
          :aria-label="isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'"
          :title="isDarkMode ? 'Modo claro' : 'Modo escuro'"
        >
          <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
        </button>
        <div class="login__brand">
          <div class="login__logo">
            <img
              :style="{ width: logoWidth }"
              :src="currentLogo"
              alt="Logo"
            />
          </div>

          <div class="login__titles" v-if="loginTitle || loginSubtitle">
            <h1 class="login__title" v-if="loginTitle">{{ loginTitle }}</h1>
            <p class="login__subtitle" v-if="loginSubtitle">{{ loginSubtitle }}</p>
          </div>
        </div>

        <div class="login__content">
          <div class="login__share" v-if="route.name === 'Share'">
            <div class="login__shareText">
              {{ shareText }}
            </div>
            <el-progress :percentage="50" status="warning" :indeterminate="true" />
          </div>

          <template v-else>
            <div v-if="errorMsg" class="login__error" role="alert">
              {{ errorMsg }}
            </div>

            <div class="login__form">
              <div class="login__field">
                <div class="login__label">{{ KT('login.username') }}</div>
                <el-input
                  ref="userinput"
                  v-model="username"
                  @keydown.enter="focusPassword()"
                  :placeholder="KT('login.your_email')"
                  autocomplete="username"
                />
              </div>

              <div class="login__field">
                <div class="login__label">{{ KT('login.password') }}</div>
                <el-input
                  ref="passinput"
                  v-model="password"
                  @keydown.enter="doLogin()"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="KT('login.your_password')"
                  autocomplete="current-password"
                >
                  <template #append>
                    <button
                      class="login__eye"
                      type="button"
                      :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                      @click="togglePasswordVisibility"
                    >
                      <i class="far" :class="showPassword ? 'fa-eye' : 'fa-eye-slash'"></i>
                    </button>
                  </template>
                </el-input>
              </div>

              <div class="login__row">
                <div class="login__remember" v-if="loginCfg.showRememberMe">
                  <el-switch
                    v-model="rememberme"
                    :inactive-text="''"
                    :active-text="KT('rememberme')"
                    :active-value="true"
                    :inactive-value="false"
                  />
                </div>

                <el-button
                  class="login__btn"
                  type="primary"
                  :loading="loading"
                  @click="doLogin()"
                >
                  {{ KT('login.signin') }}
                </el-button>
              </div>

              <div class="login__footer" v-if="loginCfg.showForgotPassword && forgotUrl">
                <a class="login__link" :href="forgotUrl" target="_blank" rel="noopener">
                  {{ KT('login.forgot_password') || 'Esqueci minha senha' }}
                </a>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- IFTRUE_myFlag2 -->
    <div style="background: rgba(255,255,255,0.8);padding: 5px;color: #101010;z-index: 999999999;position: fixed; bottom: 0px;right: 0px;width: 100%; text-align: center;font-size: 11px;">
      Esta empresa de Rastreamento faz uso do <a style="color: #111111;text-decoration: none;" href="https://mit.app" target="_blank">MIT.app</a>
    </div>
    <!-- FITRUE_myFlag2 -->
  </div>
</template>
<script setup>
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/switch/style/css'
import 'element-plus/es/components/progress/style/css'
import 'element-plus/es/components/message-box/style/css'

import { ElInput } from "element-plus/es/components/input";
import { ElProgress } from "element-plus/es/components/progress";
import { ElSwitch } from "element-plus/es/components/switch";
import { ElButton } from "element-plus/es/components/button";
import { ElMessageBox } from "element-plus/es/components/message-box";

import KT from '../tarkan/func/kt'

import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex';
import { ref, computed, onMounted, inject } from 'vue';

import { useBranding } from '@/composables/useBranding';

const store = useStore();
const router = useRouter();
const route = useRoute();
const traccar = inject('traccar');

const { loginBranding, logoForTheme, initBranding } = useBranding();

const username = ref(route.query.user || '');
const password = ref(route.query.pass || '');
const showPassword = ref(false);
const rememberme = ref(false);
const loading = ref(false);
const errorMsg = ref('');

const userinput = ref(null);
const passinput = ref(null);

const isDarkMode = computed(() => store.state.ui?.darkMode ?? false);

const logoWidth = computed(() => {
  try { return store.getters['server/getLogoWidth']; }
  catch { return '220px'; }
});

const currentLogo = computed(() => logoForTheme(!!isDarkMode.value));

const loginCfg = computed(() => loginBranding.value || {});

const loginTitle = computed(() => {
  return loginCfg.value.title || null;
});

const loginSubtitle = computed(() => {
  return loginCfg.value.subtitle || null;
});

const forgotUrl = computed(() => loginCfg.value.forgotPasswordUrl || null);

const shareText = computed(() => {
  return 'Acessando compartilhamento, por favor aguarde...';
});

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value;
}

function toggleDarkMode() {
  const newValue = !isDarkMode.value;
  localStorage.setItem('darkMode', newValue ? 'true' : 'false');
  document.body.classList.toggle('dark-mode', newValue);
  store.commit('ui/setDarkMode', newValue);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('[theme] darkMode=', newValue, 'body.dark-mode=', document.body.classList.contains('dark-mode'));
  }
}

function focusPassword() {
  try { passinput.value?.focus(); } catch { /* ignore */ }
}

function loadRememberMe() {
  try {
    const raw = localStorage.getItem('rememberme');
    if (!raw) return;
    const decoded = atob(raw);
    const [u, p] = decoded.split('|');
    if (u) username.value = u;
    if (p) password.value = p;
    rememberme.value = true;
  } catch { /* ignore */ }
}

function saveRememberMe() {
  try {
    if (!rememberme.value) {
      localStorage.removeItem('rememberme');
      return;
    }
    const payload = btoa(`${username.value}|${password.value}`);
    localStorage.setItem('rememberme', payload);
  } catch { /* ignore */ }
}

function normalizeUsernameForDriver(u) {
  if (route.meta?.isDriver) {
    // preserva regra: prefixo qrcode-
    if (u && !u.startsWith('qrcode-')) return `qrcode-${u}`;
  }
  return u;
}

const doLogin = async () => {
  errorMsg.value = '';
  loading.value = true;

  try {
    const u = normalizeUsernameForDriver(username.value || '');
    const p = password.value || '';

    if (!u || !p) {
      errorMsg.value = 'Preencha usuário e senha.';
      return;
    }

    const r = await traccar.login(u, p);

    // Preserva fluxo: setAuth + rememberMe
    store.commit('setAuth', r);
    saveRememberMe();

    // Android WebView: updateUserId
    try {
      if (window?.appInterface?.updateUserId) {
        window.appInterface.updateUserId(r.id.toString());
      }
    } catch { /* ignore */ }

    // Load user data
    await store.dispatch("loadUserData");

    // Redirect logic (preservado do original)
    const regex = /(iPhone|iPad|iPod);[^OS]*OS (\d)/;
    const matches = navigator.userAgent.match(regex);

    if (route.query.to) {
      window.location.href = window.location.protocol + '//' + window.location.host + '' + route.query.to + '?time=' + new Date().getTime();
    } else if (matches) {
      if (route.meta.isDriver) {
        window.location.href = window.location.protocol + '//' + window.location.host + '/qr-driver?time=' + new Date().getTime();
      } else {
        window.location.href = window.location.protocol + '//' + window.location.host + '/home?time=' + new Date().getTime();
      }
    } else {
      if (route.meta.isDriver) {
        window.location.href = window.location.protocol + '//' + window.location.host + '/qr-driver?time=' + new Date().getTime();
      } else {
        router.push('/home');
      }
    }

  } catch (err) {
    store.commit("server/setPage", false);

    // Get error data from response (preservado)
    const errorData = err.response?.data || err.message || String(err);
    const errorString = String(errorData).toUpperCase();

    // Check for blocked/disabled user errors first
    if (errorString.includes('BLOCKED') ||
        errorString.includes('DISABLED') ||
        errorString.includes('ACCOUNT_BLOCKED') ||
        errorString.includes('USER_BLOCKED')) {
      errorMsg.value = KT('login.error.BLOCKED') || 'Conta bloqueada';
    }
    // Check for invalid credentials errors
    else if (errorString.includes('HTTP_401_UNAUTHORIZED') ||
        errorString.includes('UNAUTHORIZED') ||
        errorString.includes('JAKARTA') ||
        errorString.includes('401')) {
      errorMsg.value = KT('login.error.UNAUTHORIZED') || 'Usuário ou senha inválidos';
    } else {
      errorMsg.value = KT(err) || errorData;
    }

    // Fallback ElMessageBox se não houver errorMsg UI
    if (!errorMsg.value) {
      ElMessageBox.confirm(errorData)
        .then(() => {})
        .catch(() => {});
    }
  } finally {
    loading.value = false;
  }
};

const doLoginWithToken = () => {
  traccar.login(route.params.token, route.params.token).then((r) => {
    store.commit('setAuth', r);
    store.dispatch("loadUserData").then(() => {
      router.push('/devices/' + r.attributes.deviceId);

      store.commit("devices/setTrail", parseInt(r.attributes.deviceId));
      store.commit("devices/setFollow", parseInt(r.attributes.deviceId));
    });
  }).catch((err) => {
    ElMessageBox.confirm(KT('INVALID_SHARE') || err)
      .then(() => { /* ignore */ })
      .catch(() => { /* ignore */ });
  });
}

onMounted(() => {
  // Inicializa branding + tokens e escuta theme:updated
  initBranding();

  // Load remember me
  loadRememberMe();

  if (route.name === 'Share') {
    doLoginWithToken();
  } else {
    try { userinput.value?.focus(); } catch { /* ignore */ }
  }
});
</script>

<style scoped>
.mitapp-login{
  position: relative;
  width: var(--vw, 100vw);
  height: var(--vh, 100vh);
  overflow: hidden;
  color: var(--brand-text, var(--el-text-color-primary, #2C3E50));
}

.login__bg{
  position: absolute;
  inset: 0;
  background-image: var(--login-bg-image, url('/mit/assets/custom/bg.jpg'));
  background-size: cover;
  background-position: center;
  transform: scale(1.02);
}

.login__overlay{
  position: absolute;
  inset: 0;
  background: var(--login-overlay, var(--tk-login-filter, rgba(0,0,0,0.35)));
}

.login__shell{
  position: relative;
  height: 100%;
  display: grid;
  place-items: center;
  padding: 24px;
  box-sizing: border-box;
}

.login__card{
  position: relative;
  width: min(92vw, var(--login-card-max-width, 460px));
  background: var(--brand-surface, var(--el-bg-color, #FFFFFF));
  border: 1px solid var(--brand-border, rgba(255,255,255,0.18));
  border-radius: var(--login-radius, 20px);
  box-shadow: var(--brand-shadow-md, 0 20px 60px rgba(0,0,0,0.20));
  padding: var(--login-card-padding, 28px);
  box-sizing: border-box;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.login__theme-toggle{
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: var(--brand-surface-secondary, rgba(0,0,0,0.05));
  color: var(--brand-text, #2C3E50);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
  z-index: 10;
}
.login__theme-toggle:hover{
  background: var(--brand-primary, #409EFF);
  color: #FFFFFF;
  transform: scale(1.05);
}
.login__theme-toggle:focus-visible{
  outline: 2px solid var(--brand-primary, #409EFF);
  outline-offset: 2px;
}
.login__theme-toggle:active{
  transform: scale(0.95);
}

.login__brand{
  display: grid;
  gap: 14px;
  justify-items: center;
  text-align: center;
  margin-bottom: 14px;
}

.login__logo img{
  max-width: 100%;
  height: auto;
}

.login__titles{
  width: 100%;
}

.login__title{
  margin: 0;
  font-size: 20px;
  line-height: 1.15;
  font-weight: 700;
}

.login__subtitle{
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.35;
  color: var(--brand-text-muted, rgba(0,0,0,0.65));
}

.login__content{
  margin-top: 10px;
}

.login__share{
  text-align: center;
  display: grid;
  gap: 12px;
}

.login__shareText{
  font-size: 14px;
  color: var(--brand-text-muted, rgba(0,0,0,0.7));
}

.login__error{
  background: rgba(255, 0, 0, 0.08);
  border: 1px solid rgba(255, 0, 0, 0.22);
  color: rgba(180, 0, 0, 0.95);
  padding: 10px 12px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.login__form{
  display: grid;
  gap: 12px;
}

.login__label{
  font-size: 13px;
  margin: 0 0 6px;
  color: var(--brand-text, var(--el-text-color-primary, #2C3E50));
}

.login__row{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
}

.login__btn{
  flex: 0 0 auto;
}

.login__footer{
  margin-top: 10px;
  text-align: right;
}

.login__link{
  color: var(--brand-primary, #409EFF);
  text-decoration: none;
  font-size: 13px;
}
.login__link:hover{
  text-decoration: underline;
}

.login__eye{
  background: transparent;
  border: 0;
  padding: 0 10px;
  cursor: pointer;
  color: var(--brand-text-muted, rgba(0,0,0,0.65));
}
.login__eye:focus-visible{
  outline: 2px solid var(--brand-primary, #409EFF);
  outline-offset: 2px;
  border-radius: 8px;
}

/* Dark mode refinado */
:global(body.dark-mode) .login__card{
  box-shadow: var(--brand-shadow-md-dark, 0 20px 60px rgba(0,0,0,0.50));
}
:global(body.dark-mode) .login__subtitle{
  color: var(--brand-text-muted, rgba(255,255,255,0.75));
}
:global(body.dark-mode) .login__shareText{
  color: var(--brand-text-muted, rgba(255,255,255,0.75));
}
:global(body.dark-mode) .login__error{
  background: rgba(255, 80, 80, 0.12);
  border-color: rgba(255, 80, 80, 0.25);
  color: rgba(255, 210, 210, 0.95);
}
:global(body.dark-mode) .login__eye{
  color: var(--brand-text-muted, rgba(255,255,255,0.75));
}
:global(body.dark-mode) .login__theme-toggle{
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.9);
}
:global(body.dark-mode) .login__theme-toggle:hover{
  background: var(--brand-primary, #409EFF);
  color: #FFFFFF;
}

/* Mobile */
@media (max-width: 1000px){
  .login__card{
    width: min(92vw, 520px);
    padding: var(--login-card-padding-mobile, 20px);
  }
  .login__row{
    flex-direction: column;
    align-items: stretch;
  }
  .login__btn{
    width: 100%;
  }
  .login__footer{
    text-align: center;
  }
}
</style>
