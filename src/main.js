import { createApp } from 'vue'
import App from './App.vue'

import A from './license.js';

import Tarkan from './tarkan/tarkanConnector'
import Traccar from './tarkan/traccarConnector'

import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import ptBR from 'element-plus/es/locale/lang/pt-br' // Importa o locale em português

import routes from './routes.js'

const loc = window.location;

const serverUrl = loc.protocol + '//' + A[2] + '/api';
const tarkanUrl = loc.protocol + '//' + A[3] + '/tarkan';

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
    console.log('Inicializando o Firebase na aplicação web');
    // Inicialize o Firebase aqui, se necessário
    // Por exemplo:
    // import { initializeApp } from 'firebase/app';
    // import { getMessaging } from 'firebase/messaging';
    // const firebaseConfig = { ... };
    // const app = initializeApp(firebaseConfig);
    // const messaging = getMessaging(app);
} else {
    console.log('Não inicializando o Firebase no WebView');
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
