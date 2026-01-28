# 📸 SNAPSHOT DO LOGIN ATUAL (PRÉ-REFATORAÇÃO)

**Arquivo**: `src/templates/login.vue` (367 linhas)  
**Data**: 26/01/2026  
**Propósito**: Baseline para refatoração white-label enterprise

---

## 📋 TEMPLATE COMPLETO

```vue
<template>
  <div class="login">
      <div id="logo">
        <img :style="{width: store.getters['server/getLogoWidth']}" src="/tarkan/assets/custom/logoWhite.png">
      </div>

      <div id="login-form">
        <div style="text-align: center;" v-if="$route.name==='Share'">
          Acessando compartilhamento, por favor aguarde...<br><br>
            <div style="margin-left: 10%;">
            <el-progress :percentage="50" status="warning" :indeterminate="true" />
            </div>
        </div>
        <template v-else>
          <div>
            <div class="label">{{KT('login.username')}}</div>
            <el-input ref="userinput" v-model="username" @keydown.enter="passinput.focus()" :placeholder="KT('login.your_email')" />
          </div>

          <div>
            <div class="label">{{KT('login.password')}}</div>
            <el-input ref="passinput" v-model="password" @keydown.enter="doLogin()" :type="showPassword ? 'text' : 'password'" :placeholder="KT('login.your_password')">
                <template #append>
                  <span v-if="showPassword" @click="togglePasswordVisibility">
                    <i class="far fa-eye"></i>
                  </span>
                  <span v-else @click="togglePasswordVisibility">
                    <i class="far fa-eye-slash"></i>
                  </span>
                </template>
            </el-input>
          </div>

          <div style="margin-top: 10px; float: left;">
            <el-switch
                v-model="rememberme"
                :inactive-text="''"
                :active-text="KT('rememberme')"
                :active-value="true"
                :inactive-value="false"
            >
            </el-switch>
          </div>

          <div style="margin-top: 10px;float: right;">
            <el-button type="primary" @click="doLogin()">{{KT('login.signin')}}</el-button>
          </div>
        </template>
      </div>
  </div>
</template>
```

---

## 🎨 STYLE COMPLETO

```css
<style scoped>
.login{
  background: url('/tarkan/assets/custom/bg.jpg');
  background-size: cover;
  width: var(--vw,100vw);
  height: var(--vh,100vh);
}

.login:after {
  content: " ";
  position: absolute;
  left: 0;
  top: 0;
  width: var(--vw,100vw);
  height: var(--vh,100vh);
  background: var(--tk-login-filter);
}

#logo{
  position: absolute;
  left: 50%;
  top: 20%;
  width: 30%;
  transform: translate(-50%,-50%);
  z-index: 10;
  transition: width 0.3s;
  text-align: center;
}

#login-form{
  position: absolute;
  left: 50%;
  top: 50%;
  background: white;
  border-radius: 10px;
  z-index: 10;
  width: 30%;
  transform: translate(-50%,-50%);
  padding: 20px;
  box-sizing: border-box;
  text-align: left;
  transition: width 0.3s;
}

.label{
  font-size: 14px;
  margin-top: 10px;
  margin-bottom: 5px;
}

@media (max-width: 1000px) {
  #login-form, #logo {
    width: 80%;
  }
}
</style>
```

---

## ⚙️ LÓGICA SCRIPT (resumo funcional)

**Data**:
- `username`, `password`, `showPassword`, `rememberme`

**Methods**:
- `togglePasswordVisibility()` - toggle eye icon
- `doLogin()` - traccar.login → store.commit('setAuth') → redirect
- `doLoginWithToken()` - para route `Share` com token

**Integrações**:
- `store.getters['server/getLogoWidth']` - tamanho dinâmico do logo
- `KT('login.username')` - i18n via func/kt.js
- `window.appInterface.updateUserId()` - WebView Android

**Rotas especiais**:
- `route.name === 'Share'` - loading com progress bar
- `route.meta.isDriver` - adiciona prefixo `qrcode-` ao username

---

## 🚨 HARDCODES IDENTIFICADOS (P1 - CRÍTICO)

| Item | Local | Valor Hardcoded | Deve vir de |
|------|-------|-----------------|-------------|
| Logo login | template L4 | `/tarkan/assets/custom/logoWhite.png` | `window.CONFIG.logoUrl` |
| Background | style L2 | `url('/tarkan/assets/custom/bg.jpg')` | `window.CONFIG.login.backgroundImageUrl` |
| Cor do card | style L31 | `background: white` | `var(--brand-surface)` |
| Filtro overlay | style L14 | `var(--tk-login-filter)` | `var(--login-overlay)` (OK, mas isolado) |

---

## 🎯 GAPS PARA WHITE-LABEL

❌ **Não existe**:
- `window.CONFIG.login` (title, subtitle, backgroundMode, showForgotPassword, etc.)
- Dark mode CSS (body.dark-mode não afeta login)
- Tokens do sistema (--brand-surface, --brand-text, --brand-primary)
- Logo dark variant (logoWhite vs logoDark)

❌ **Não reativo**:
- Login não escuta `theme:updated` event
- Mudanças em edit-theme só aplicam após reload

---

## ✅ FUNCIONALIDADES A PRESERVAR (CRÍTICO)

✅ **Lógica de negócio**:
- `rememberme` → localStorage
- `route.name === 'Share'` com loading
- `route.meta.isDriver` com prefixo qrcode-
- `window.appInterface.updateUserId()` para Android
- Tratamento de erros (BLOCKED, UNAUTHORIZED, genérico)
- Redirect condicional (iOS vs desktop, /home vs /qr-driver)

✅ **Integrações**:
- `store.getters['server/getLogoWidth']` (tamanho dinâmico)
- `KT()` i18n para textos
- `traccar.login()` autenticação

✅ **UX**:
- Enter no username → foca password
- Enter no password → executa login
- Toggle visibilidade senha (eye icon)
- Responsivo mobile (80% width < 1000px)

---

## 📦 PRÓXIMOS PASSOS (ORDEM RECOMENDADA)

1. **Criar composable** `src/composables/useBranding.js`
   - Lê `window.CONFIG` + `window.defaultThemeData`
   - Expõe `branding`, `loginBranding`, `logoForTheme(isDarkMode)`
   - Fallbacks seguros para todos os campos

2. **Extender edit-theme** para salvar `window.CONFIG.login`
   - Adicionar tab "Login" com:
     * title, subtitle (strings)
     * backgroundMode (gradient/image/solid)
     * backgroundImageUrl (upload)
     * showForgotPassword, showRememberMe (booleans)

3. **Refatorar login.vue**
   - Template: usar `branding.login.title`, `logoForTheme(isDarkMode)`
   - Style: substituir hardcodes por `var(--brand-*)` + fallbacks
   - Script: adicionar `watch` para `theme:updated` event

4. **Validação QA**
   - Rodar checklist enterprise-ready (6 critérios)
   - Testar Android WebView, route Share, isDriver
   - Validar dark mode sem flash
   - Lighthouse A11y score

---

**Com esse snapshot, você pode gerar o patch completo da refatoração mantendo 100% das funcionalidades críticas** ✅
