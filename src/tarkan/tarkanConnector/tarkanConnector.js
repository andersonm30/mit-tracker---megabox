'use strict';

import axios from 'axios';

// 🔧 DEBUG FLAG: Ativar logs de debug (desativar em produção)
const DEBUG_TARKAN = false; // Altere para true apenas quando precisar debugar

const debugLog = (...args) => {
    if (DEBUG_TARKAN) console.log('[TarkanConnector]', ...args);
};

const debugError = (...args) => {
    if (DEBUG_TARKAN) console.error('[TarkanConnector]', ...args);
};

// 🛡️ Validador de Content-Type para evitar processar HTML como JSON
const validateJsonResponse = (response) => {
    const contentType = response.headers?.['content-type'] || '';
    if (contentType.includes('text/html')) {
        debugError('Resposta HTML recebida em vez de JSON. Possível redirect/erro de auth.');
        const error = new Error('RESPONSE_HTML_NOT_JSON');
        error.isHtmlResponse = true;
        error.response = response;
        throw error;
    }
    return response;
};

let connector = function(server,vue){
    this.server = server;
    this.vue = vue;
    this.vm = false;
    this.ws = null;
    this.listeners = {"open": [],"message":[],"close":[]};

    this.axios = axios.create({
        baseURL: this.server,
        timeout: 30000,
        withCredentials: true,
        validateStatus: function (status) {
            return (status < 400); // Resolve only if the status code is less than 500
        }
    });

    // 🛡️ Interceptor para validar respostas e logar erros
    this.axios.interceptors.response.use(
        (response) => {
            // Validar que não é HTML quando esperamos JSON
            if (response.config.responseType !== 'blob' && 
                response.config.responseType !== 'arraybuffer') {
                return validateJsonResponse(response);
            }
            return response;
        },
        (error) => {
            if (error.response) {
                debugError(`HTTP ${error.response.status}:`, error.config?.url);
            } else if (error.code === 'ERR_NETWORK') {
                debugError('Erro de rede/CORS:', error.config?.url);
            }
            return Promise.reject(error);
        }
    );

    vue.mixin({created: function(){
            connector.vm = this;
        }})

    debugLog('Connector inicializado:', server);
}

// 🛡️ Wrapper com tratamento de erro para chamadas críticas
connector.prototype._safeCall = function(promise) {
    return promise.catch((error) => {
        if (error.isHtmlResponse) {
            debugError('Servidor retornou HTML. Verifique autenticação.');
        }
        throw error;
    });
};

connector.prototype.getShares = function(){
    return this._safeCall(this.axios.get("/shares"));
}

connector.prototype.createShare = function(params){
    return this.axios.post("/shares",params);
}

connector.prototype.updateShare = function(id,params){
    return this.axios.put("/shares/"+id,params);
}

connector.prototype.deleteShare = function(shareId){
    return this.axios.delete("/shares/"+shareId);
}


connector.prototype.saveTheme = function(data){
    return this.axios.put("/theme",data);
}


connector.prototype.getUserLogs = function(userId){
    return this.axios.get("/users/"+userId+"/logs")
}
connector.prototype.getDeviceLogs = function(deviceId){
    return this.axios.get("/devices/"+deviceId+"/logs")
}

connector.prototype.getServerLogs = function(){
    return this.axios.get("/server/logs")
}

connector.prototype.checkDriver = function(id){
    return this.axios.post("/qr-driver",{id: id});
}

connector.prototype.checkOutDriver = function(){
    return this.axios.post("/qr-driver",{id: 0});
}

connector.prototype.autoLink = function(data){
    return this.axios.post("/autolink",data);
}

export default connector;

