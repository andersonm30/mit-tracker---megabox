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

// Cria a aplicação Vue
const app = createApp(App)

app.use(ElementPlus, { locale: ptBR }) // Define o locale para português

app.use(i18n).mixin({
    methods: {
        KT: KT
    }
}).use(store).use(Tarkan, tarkanUrl).use(Traccar, serverUrl).use(routes);

app.mount('#app');
