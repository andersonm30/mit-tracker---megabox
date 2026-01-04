import { createApp } from 'vue'
import App from './App.vue'

// ✨ Suprime warnings conhecidos do Vue
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args[0];
  if (typeof msg === 'string') {
    // Ignora warnings conhecidos que não afetam a funcionalidade
    if (msg.includes('App already provides property') ||
        msg.includes('Invalid prop: type check failed for prop "subdomains"') ||
        msg.includes('Extraneous non-props attributes')) {
      return;
    }
  }
  originalWarn.apply(console, args);
};

// import A from './license.js';

import Tarkan from './tarkan/tarkanConnector'
import Traccar from './tarkan/traccarConnector'

import ElementPlus from "element-plus";
// ✅ CORRIGIDO: o caminho antigo "dist/index.css" quebra em versões novas do Element Plus
import "element-plus/theme-chalk/index.css";

import ptBR from 'element-plus/es/locale/lang/pt-br' // Importa o locale em português

import routes from './routes.js'

// const loc = window.location;

// ✅ PRODUÇÃO (NÃO MEXER AGORA - MANTER COMENTADO COMO VOCÊ PEDIU)
// const serverUrl = loc.protocol + '//' + A[2] + '/api';
// const tarkanUrl = loc.protocol + '//' + A[3] + '/tarkan';

// ✅ LOCAL (NÃO MEXER)
const serverUrl = 'http://localhost:9797/api' // URL do servidor Traccar
const tarkanUrl = 'http://dev.martinianosit.com.br:8090/tarkan'

import store from "./store/index"
import KT from './tarkan/func/kt'
import './registerServiceWorker'
import i18n from './lang/index'

// Importa o axios para fazer requisições HTTP
import axios from 'axios'

// Verifica se o aplicativo está rodando dentro de um WebView
function isWebView() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /wv/.test(userAgent) || /Android/.test(userAgent);
}

// Inicializa o Firebase apenas se não estiver no WebView
if (window.location.protocol === 'https:' && !isWebView()) {
  // console.log('Inicializando o Firebase na aplicação web');
  // Inicialize o Firebase aqui, se necessário
} else {
  // console.log('Não inicializando o Firebase no WebView');
}

// Defina a função no objeto global window
window.updateNotificationToken = function(token) {
  console.log('Token recebido do aplicativo nativo:', token);
  // Dispara a ação para armazenar o token
  store.dispatch('setToken', token);
  // Envia o token ao servidor
  sendTokenToServer(token);
};

function sendTokenToServer(token) {
  // ⚠️ Mantive exatamente como está no seu código.
  // Se precisar bater no serverUrl, depois a gente ajusta.
  axios.post('/api/session', { token: token })
    .then(() => {
      console.log('Token enviado ao servidor com sucesso');
    })
    .catch(error => {
      console.error('Erro ao enviar o token ao servidor:', error);
    });
}

// Cria a aplicação Vue
const app = createApp(App)

app.use(ElementPlus, { locale: ptBR }) // Define o locale para português

app.use(i18n).mixin({
  methods: {
    KT: KT
  }
}).use(store).use(Tarkan, tarkanUrl).use(Traccar, serverUrl).use(routes);

app.mount('#app');
