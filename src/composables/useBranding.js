// src/composables/useBranding.js
import { computed, ref } from 'vue';
import { assetUrl } from '@/branding';

/**
 * Fonte da verdade:
 * - window.CONFIG (edit-theme atualiza runtime)
 * - window.defaultThemeData (cores do tema atual)
 * - evento: "theme:updated"
 *
 * Este composable:
 * - expõe branding/loginBranding
 * - resolve logo para light/dark
 * - aplica tokens em :root (opcional, mas recomendado)
 */

function getRuntimeConfig() {
  // Suporta variações comuns sem quebrar:
  // - window.CONFIG direto
  // - window.CONFIG.labelConf (alguns projetos guardam a conf aqui)
  const cfg = (window && window.CONFIG) ? window.CONFIG : {};
  const labelConf = cfg?.labelConf ?? cfg?.labelconf ?? null;

  return {
    cfg,
    labelConf,
    theme: (window && window.defaultThemeData) ? window.defaultThemeData : null,
  };
}

function normalizeBranding(runtime) {
  const base = runtime.cfg || {};
  const labelConf = runtime.labelConf || {};

  // LOGIN: pode existir em window.CONFIG.login (novo)
  // ou em labelConf.login (caso você já salve assim no edit-theme)
  const login = base.login || labelConf.login || {};

  // Logo: mantém compat com seu login atual (logoWhite.png),
  // mas permite overrides via edit-theme.
  const branding = {
    appName: base.title || labelConf.title || base.appName || labelConf.appName || 'MITAPP',
    logoUrl:
      base.logoUrl ||
      labelConf.logoUrl ||
      assetUrl('custom/logoWhite.png'),

    // Opcional: se tiver uma logo dark separada
    logoDarkUrl:
      base.logoDarkUrl ||
      labelConf.logoDarkUrl ||
      null,

    // Opcional: cor primária do branding (se edit-theme fornecer)
    primaryColor:
      base.primaryColor ||
      labelConf.primaryColor ||
      runtime.theme?.['--el-color-primary'] ||
      null,

    // Login white-label
    login: {
      title: login.title || null,
      subtitle: login.subtitle || null,

      // backgroundMode: 'image' | 'gradient' | 'solid'
      backgroundMode: login.backgroundMode || 'image',

      // URL do background de login
      backgroundImageUrl:
        login.backgroundImageUrl ||
        assetUrl('custom/bg.jpg'),

      // overlay/ filtro (se quiser controlar por tema)
      overlay:
        login.overlay || null, // ex: "rgba(0,0,0,0.35)"

      // opções UI
      showRememberMe: login.showRememberMe !== false,
      showForgotPassword: login.showForgotPassword === true,
      forgotPasswordUrl: login.forgotPasswordUrl || null,
    },
  };

  return branding;
}

// ✅ HARDENING: Sanitizar URL do background (evitar CSS injection)
function safeCssUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  // bloqueia javascript: e outras strings perigosas
  if (trimmed.toLowerCase().includes('javascript:')) return '';
  if (trimmed.includes('<') || trimmed.includes('>')) return '';
  // remove aspas simples/duplas que podem quebrar CSS
  return trimmed.replace(/['"`]/g, '');
}

function applyBrandTokens(branding) {
  // Não quebra tokens.css: apenas override pontual se existir
  const root = document.documentElement;
  if (!root) return;

  if (branding?.primaryColor) {
    root.style.setProperty('--brand-primary', branding.primaryColor);
  }

  // Login bg (para o CSS do login usar)
  // ✅ HARDENING: sanitizar URL antes de aplicar
  const bgUrl = safeCssUrl(branding?.login?.backgroundImageUrl || '');
  if (bgUrl) {
    root.style.setProperty('--login-bg-image', `url(${bgUrl})`);
  }

  // Overlay opcional (se edit-theme mandar)
  // ✅ HARDENING: fallback seguro se vazio/inválido
  const overlay = (branding?.login?.overlay || '').trim();
  root.style.setProperty('--login-overlay', overlay || 'var(--tk-login-filter)');
}

export function useBranding() {
  const brandingRef = ref(normalizeBranding(getRuntimeConfig()));

  // Reage ao evento do edit-theme em runtime
  const bindThemeUpdated = () => {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('theme:updated', () => {
      // Se o edit-theme passar payload, melhor ainda. Mas não depende.
      brandingRef.value = normalizeBranding(getRuntimeConfig());
      try { applyBrandTokens(brandingRef.value); } catch (e) {
        console.warn('Falha ao aplicar brand tokens:', e);
      }
    });
  };

  const branding = computed(() => brandingRef.value);
  const loginBranding = computed(() => brandingRef.value?.login || {});

  const logoForTheme = (isDark) => {
    const b = brandingRef.value || {};
    // Se houver logoDarkUrl, usa no dark. Senão usa a mesma.
    if (isDark && b.logoDarkUrl) return b.logoDarkUrl;
    return b.logoUrl;
  };

  const initBranding = () => {
    brandingRef.value = normalizeBranding(getRuntimeConfig());
    try { applyBrandTokens(brandingRef.value); } catch (e) {
      console.warn('Falha ao inicializar brand tokens:', e);
    }
    bindThemeUpdated();
  };

  return {
    branding,
    loginBranding,
    logoForTheme,
    applyBrandTokens: () => applyBrandTokens(brandingRef.value),
    initBranding,
  };
}
