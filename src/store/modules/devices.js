import store from "../index";

// ============================================
// CONFIGURAÇÕES DE PERFORMANCE
// ============================================
const PERF_DEBUG = false; // Ativar logs de performance (dev only)
const MAP_THROTTLE_MS = 150; // Throttle de atualização do mapa por device
const REFRESH_CHUNK_SIZE = 200; // Devices por frame no refreshDevices
const ENABLE_MAP_THROTTLE = true; // Feature flag para throttle
const ENABLE_CHUNKED_REFRESH = true; // Feature flag para refresh em chunks

// Buffer de throttle por device: deviceId -> { lastUpdate, pending, timerId }
const deviceThrottleBuffer = new Map();

// Token de execução para cancelar refresh anterior
let refreshRunId = 0;

// ============================================
// 🔒 PATCH 2: Guard anti-WS duplicado
// ============================================
let wsConnecting = false;
let wsHandlersRegistered = false; // 🔒 Evita duplicar listeners

// ============================================
// BENCHMARK / MÉTRICAS (ativo apenas com PERF_DEBUG)
// ============================================
const perfMetrics = {
    wsEvents: [],           // timestamps dos eventos WS
    updatePositionTimes: [], // duração de cada updatePosition (ms)
    refreshDevicesTimes: [], // duração de cada refreshDevices (ms)
    benchmarkStart: 0,
    benchmarkDuration: 30000, // 30 segundos
    isRunning: false
};

// Helper de log de performance
const perfLog = (label, startTime, extra = '') => {
    if (!PERF_DEBUG) return;
    const elapsed = performance.now() - startTime;
    console.log(`[PERF] ${label}: ${elapsed.toFixed(2)}ms ${extra}`);
};

// Helper para métricas de WS
const trackWsEvent = () => {
    if (!PERF_DEBUG) return;
    const now = Date.now();
    perfMetrics.wsEvents.push(now);
    
    // Limpar eventos antigos (manter últimos 30s)
    const cutoff = now - perfMetrics.benchmarkDuration;
    while (perfMetrics.wsEvents.length > 0 && perfMetrics.wsEvents[0] < cutoff) {
        perfMetrics.wsEvents.shift();
    }
};

// Registrar tempo de updatePosition para p95
const recordUpdatePositionTime = (elapsed) => {
    if (!PERF_DEBUG) return;
    perfMetrics.updatePositionTimes.push(elapsed);
    // Manter últimas 1000 amostras
    if (perfMetrics.updatePositionTimes.length > 1000) {
        perfMetrics.updatePositionTimes.shift();
    }
};

// Registrar tempo de refreshDevices
const recordRefreshDevicesTime = (elapsed) => {
    if (!PERF_DEBUG) return;
    perfMetrics.refreshDevicesTimes.push(elapsed);
    if (perfMetrics.refreshDevicesTimes.length > 100) {
        perfMetrics.refreshDevicesTimes.shift();
    }
};

// Calcular percentil (p95)
const calculatePercentile = (arr, percentile) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
};

// Gerar relatório de benchmark
const generateBenchmarkReport = () => {
    if (!PERF_DEBUG) return;
    
    const now = Date.now();
    const windowMs = Math.min(perfMetrics.benchmarkDuration, now - (perfMetrics.benchmarkStart || now));
    const windowSec = windowMs / 1000;
    
    // WS events/s
    const recentWsEvents = perfMetrics.wsEvents.filter(t => t > now - windowMs);
    const wsPerSec = windowSec > 0 ? (recentWsEvents.length / windowSec).toFixed(1) : 0;
    const wsPeak = recentWsEvents.length;
    
    // p95 updatePosition
    const p95Update = calculatePercentile(perfMetrics.updatePositionTimes, 95).toFixed(2);
    const avgUpdate = perfMetrics.updatePositionTimes.length > 0 
        ? (perfMetrics.updatePositionTimes.reduce((a, b) => a + b, 0) / perfMetrics.updatePositionTimes.length).toFixed(2)
        : 0;
    
    // refreshDevices
    const avgRefresh = perfMetrics.refreshDevicesTimes.length > 0
        ? (perfMetrics.refreshDevicesTimes.reduce((a, b) => a + b, 0) / perfMetrics.refreshDevicesTimes.length).toFixed(2)
        : 0;
    const maxRefresh = perfMetrics.refreshDevicesTimes.length > 0
        ? Math.max(...perfMetrics.refreshDevicesTimes).toFixed(2)
        : 0;
    
    console.log('\n======== BENCHMARK REPORT ========');
    console.log(`Janela: ${windowSec.toFixed(0)}s`);
    console.log(`WS events/s: média=${wsPerSec}, pico=${wsPeak} em ${windowSec.toFixed(0)}s`);
    console.log(`updatePosition: avg=${avgUpdate}ms, p95=${p95Update}ms (${perfMetrics.updatePositionTimes.length} amostras)`);
    console.log(`refreshDevices: avg=${avgRefresh}ms, max=${maxRefresh}ms (${perfMetrics.refreshDevicesTimes.length} chamadas)`);
    console.log('===================================\n');
    
    return { wsPerSec, wsPeak, p95Update, avgUpdate, avgRefresh, maxRefresh };
};

// Iniciar benchmark (chamar manualmente no console: window.__startPerfBenchmark())
if (typeof window !== 'undefined') {
    window.__startPerfBenchmark = () => {
        perfMetrics.benchmarkStart = Date.now();
        perfMetrics.wsEvents = [];
        perfMetrics.updatePositionTimes = [];
        perfMetrics.refreshDevicesTimes = [];
        perfMetrics.isRunning = true;
        console.log('[PERF] Benchmark iniciado. Aguarde 30s ou chame window.__stopPerfBenchmark()');
        setTimeout(() => {
            if (perfMetrics.isRunning) {
                window.__stopPerfBenchmark();
            }
        }, perfMetrics.benchmarkDuration);
    };
    
    window.__stopPerfBenchmark = () => {
        perfMetrics.isRunning = false;
        generateBenchmarkReport();
    };
    
    window.__getPerfReport = generateBenchmarkReport;
}

// ============================================
// FUNÇÃO INTERNA: refreshOneDevice (não é action)
// ============================================
// Extraída para fora da action para poder ser chamada sem retornar Promise
// Isso evita o bug onde dispatch() sempre retorna Promise (truthy) em vez do boolean real
function refreshOneDeviceInternal(context, fk){
    const f = context.state.deviceList[fk];
    if (!f || !f.icon) return false;

    // Helper: compatibilidade icon array/object
    const eachIcon = (fn) => {
        const icons = Array.isArray(f.icon) ? f.icon : [f.icon].filter(Boolean);
        icons.forEach(i => { try { fn(i); } catch(e){ if(PERF_DEBUG) console.warn('eachIcon error:', e); } });
    };

    const statusFilter = context.state.applyFilters.statusFilter;
    const motionFilter = context.state.applyFilters.motionFilter;
    const stateFilter = context.state.applyFilters.stateFilter;
    const combinedStatusFilter = context.state.applyFilters.combinedStatusFilter;
    const advancedFilter = context.state.applyFilters.advancedFilter;
    const filterQuery = window.localStorage.getItem("query") || false;
    const position = context.getters.getPosition(f.id);

    let visible = true;
    let gotFiltered = false;

    // 1. FILTRO DE BUSCA (query text)
    if(filterQuery){
        gotFiltered = true;
        visible = false;
        eachIcon(i => i.remove?.());

        for(let k of Object.keys(f)){
            if(k==='status' && String(f[k]).toLowerCase().replace('unknown','desconhecido').match(filterQuery.toLowerCase())){
                visible = true;
                break;
            }else if(String(f[k]).toLowerCase().match(filterQuery.toLowerCase())){
                visible = true;
                break;
            }
        }

        if (!visible && f.attributes) {
            for(let k of Object.keys(f.attributes)){
                if(f.attributes[k] && f.attributes[k].toString().toLowerCase().match(filterQuery.toLowerCase())){
                    visible = true;
                    break;
                }
            }
        }

        if (visible) {
            eachIcon(i => {
                if (i.options?.el) i.options.el.classList.add('filter-visible');
                i.addToMap?.();
            });
        }
        return visible;
    }

    // 2. FILTRO DISPOSITIVO ÚNICO (showOnlyId)
    if(context.state.applyFilters.showOnlyId !== 0){
        gotFiltered = true;
        visible = (f.id === context.state.applyFilters.showOnlyId);
        if (visible) {
            eachIcon(i => {
                if (i.options?.el) i.options.el.classList.add('filter-visible');
                i.addToMap?.();
            });
        } else {
            eachIcon(i => {
                if (i.options?.el) i.options.el.classList.remove('filter-visible');
                i.remove?.();
            });
        }
        return visible;
    }

    // 3. FILTROS COMBINADOS (categoria + status + state + advanced)
    if (!f.category) f.category = 'default';

    // 3.1 Categoria oculta
    if (context.state.applyFilters.hideCategory.find(c => c === f.category)) {
        visible = false;
        gotFiltered = true;
    }

    // 3.2 stateFilter (device.state)
    if (visible && stateFilter !== 'all') {
        if (!f.attributes?.['device.state'] || f.attributes['device.state'] !== stateFilter) {
            visible = false;
            gotFiltered = true;
        }
    }

    // 3.3 statusFilter básico
    if (visible && statusFilter !== 'all') {
        if (f.status !== statusFilter) {
            visible = false;
            gotFiltered = true;
        }
    }

    // 3.4 motionFilter (só online + motion=true)
    if (visible && motionFilter) {
        if (f.status !== 'online' || !position?.attributes?.motion) {
            visible = false;
            gotFiltered = true;
        }
    }

    // 3.5 combinedStatusFilter (online/offline/unknown/moving/stopped)
    if (visible && combinedStatusFilter !== 'all' && statusFilter === 'all' && !motionFilter) {
        switch(combinedStatusFilter) {
            case 'online':
                if (f.status !== 'online') visible = false;
                break;
            case 'offline':
                if (f.status !== 'offline') visible = false;
                break;
            case 'unknown':
                if (f.status !== 'unknown') visible = false;
                break;
            case 'moving':
                if (f.status !== 'online' || !position?.attributes?.motion) visible = false;
                break;
            case 'stopped':
                if (f.status !== 'online' || position?.attributes?.motion) visible = false;
                break;
        }
        if (!visible) gotFiltered = true;
    }

    // 3.6 advancedFilter (anchor/driver/ignition/locked)
    if (visible && advancedFilter.type !== 'none') {
        switch(advancedFilter.type) {
            case 'anchor':
                if (!context.rootGetters['geofences/isAnchored']?.(f.id)) visible = false;
                break;
            case 'driver':
                if (!position?.attributes?.driverUniqueId) visible = false;
                break;
            case 'ignition':
                if (position?.attributes?.ignition !== advancedFilter.value) visible = false;
                break;
            case 'locked':
                if (position?.attributes?.blocked !== advancedFilter.value) visible = false;
                break;
        }
        if (!visible) gotFiltered = true;
    }

    // 4. APLICAR VISIBILIDADE + HOOK CSS
    if (visible) {
        eachIcon(i => {
            if (i.options?.el) i.options.el.classList.add('filter-visible');
            i.addToMap?.();
        });
    } else {
        eachIcon(i => {
            if (i.options?.el) i.options.el.classList.remove('filter-visible');
            i.remove?.();
        });
    }

    // 5. NOTIFICAR ROOT SE HÁ FILTROS ATIVOS
    if (gotFiltered) {
        context.dispatch("setFiltering", true, { root: true });
    }

    return visible;
}

export default {
    namespaced: true,
    state: () => ({
        deviceKeys: [],
        deviceList: {},
        positionsList: {},
        positionHistory: [],
        isFollowingId: 0,
        showRoutes: false,
        trail: false,
        streetview: false, // ✅ Desativado por padrão
        showPercurso: false,
        togglePercurso: false,
        togglePontosCorrelacao: false,
        toggleCalor: false,
        showPontos: false,   
        showPontosCorrelacao: false, 
        showCalorCorrelacao: false,   
        showCalor: false,
        routePlayPoint: 0, // Ponto atual na reprodução da rota
        _sorting: 'name-asc',
        filterCount: 0, // Contador de devices visíveis após filtros (UX)
        applyFilters: {
            showOnlyId: 0,
            statusFilter: 'all',
            motionFilter: false,
            hideCategory: [],
            stateFilter: 'all', // Filtro por device.state (device.attributes['device.state'])
            combinedStatusFilter: 'all', // online/offline/unknown/moving/stopped
            advancedFilter: { type: 'none', value: null } // anchor/driver/ignition/locked
        }
    }),
    getters: {
        sorting(state){
          return state._sorting;
        },
        getOrderedDevices(state){
           /* let tmp = [];

            console.log("LAG?");

            for(var K of Object.keys(state.deviceList)){
                tmp.push(state.deviceList[K]);
            }

            return tmp;*/
            //return state.deviceKeys;

            const p = state._sorting.split("-");

            return [...state.deviceKeys].sort((ak,bk)=>{
                const a = state.deviceList[ak];
                const b = state.deviceList[bk];

                if(p[0]==='state'){

                    const as = state.positionsList[ak];
                    const bs = state.positionsList[bk];

                    if(!as){
                        return 1;
                    }
                    if(!bs){
                        return -1;
                    }

                    if(p[1]==='motion'){
                        if(as.attributes['motion']===undefined){
                            return 1;
                        }
                        if(bs.attributes['motion']===undefined){
                            return -1;
                        }

                        return (as.attributes['motion']===bs.attributes['motion'])?0:(as.attributes['motion']===true)?-1:(bs.attributes['motion']===true)?1:0;
                    }

                    if(p[1]==='anchor'){

                        const aa = store.getters['geofences/isAnchored'](a.id)?true:false;
                        const ba = store.getters['geofences/isAnchored'](b.id)?true:false;

                        return (aa==ba)?0:(aa===true)?-1:(ba===true)?1:0;
                    }

                    if(p[1]==='locked'){
                        if(as.attributes['blocked']===undefined){
                            return 1;
                        }
                        if(bs.attributes['blocked']===undefined){
                            return -1;
                        }


                        return (as.attributes['blocked']===bs.attributes['blocked'])?0:(as.attributes['blocked']===true)?-1:(bs.attributes['blocked']===true)?1:0;
                    }
                    if(p[1]==='ignition'){

                        if(as.attributes['ignition']===undefined){
                            return 1;
                        }
                        if(bs.attributes['ignition']===undefined){
                            return -1;
                        }

                        return (as.attributes['ignition']===bs.attributes['ignition'])?0:(as.attributes['ignition']===true)?-1:(bs.attributes['ignition']===true)?1:0;
                    }

                    if(p[1]==='driver'){

                        const at = as.attributes['driverUniqueId']?true:false;
                        const bt = bs.attributes['driverUniqueId']?true:false;

                        return (at===bt)?0:(at===true)?-1:(bt===true)?1:0;
                    }


                    if(p[1]==='alert'){

                        const at = as.attributes['alarm']?true:false;
                        const bt = bs.attributes['alarm']?true:false;

                        return (at===bt)?0:(at===true)?-1:(bt===true)?1:0;
                    }


                }else if(p[0]==='lastUpdate'){

                    if(a[p[0]]===null){
                        return 1;
                    }else if(b[p[0]]===null){
                        return -1;
                    }else if(new Date(a[p[0]]).getTime()<new Date(b[p[0]]).getTime()){
                        return (p[1]==='asc')?1:-1;
                    }else if(new Date(a[p[0]]).getTime()>new Date(b[p[0]]).getTime()){
                        return (p[1]==='asc')?-1:1;
                    }else{
                        return 0;
                    }
                }else if(a[p[0]]>b[p[0]]){
                    return (p[1]==='asc')?1:-1;
                }else if(a[p[0]]<b[p[0]]){
                    return (p[1]==='desc')?1:-1;
                }else{
                    return 0;
                }
            })

        },
        isHiddenFilter(state){
          return (id)=>{
              return !state.applyFilters.hideCategory.find((f) => {

                  return f == id
              });
          }
        },
        // eslint-disable-next-line no-unused-vars
        getFilters(state){
            return state.applyFilters;
        },
        getDevice(state){
            return (deviceId)=>{
                if(!deviceId){
                    return false;
                }
                return state.deviceList[deviceId];
            }
        },
        getPosition(state){
            return (positionId)=>{
                if(!positionId){
                    return false;
                }
                return state.positionsList[positionId];
            }
        },
        getTrails(state){
            let tmp = [];

            state.positionHistory.forEach((p) => {
                tmp.push([p.latitude, p.longitude])
            });


            return tmp;
        },
        deviceCount(state){
            let tmp ={
                online: 0,
                offline: 0,
                unknown: 0,
                motion: 0
            };


            const all = state.deviceList;
            const _all = Object.keys(all);
            const positions = state.positionsList;

            _all.forEach((K)=>{
                const f = all[K];
                const pos = positions[K];

                if(f.status==='online'){
                    tmp.online++;
                }else if(f.status==='offline'){
                    tmp.offline++;
                }else if(f.status==='unknown'){
                    tmp.unknown++;
                }

                if(pos && pos.attributes['motion'] && pos.attributes['motion']===true){
                    tmp.motion++;
                }


            });

            tmp.all = _all.length;


            return tmp;
        }
    },
    mutations: {
        setRoutePlayPoint(state, index) {
            state.routePlayPoint = index;
        },
        setRoute(state,value){
            state.showRoutes = value;
        },
        setDeviceFilter(state,value){
          state.applyFilters.showOnlyId = value;
        },
        toggleHiddenFilter(state,value){
            const idx = state.applyFilters.hideCategory.findIndex((f)=> f === value);

            //console.log(value,idx);

            if(idx>-1){
                state.applyFilters.hideCategory.splice(idx,1);
            }else{
                state.applyFilters.hideCategory.push(value);
            }
        },
        setSorting(state,value){
            state._sorting = value;

            //const p = state._sorting.split("-");



        },
        setStatusFilter(state,value){
            state.applyFilters.statusFilter = value;
        },
        setStateFilter(state, value){
            state.applyFilters.stateFilter = value;
        },
        setCombinedStatusFilter(state, value){
            state.applyFilters.combinedStatusFilter = value;
        },
        setAdvancedFilter(state, payload){
            state.applyFilters.advancedFilter = payload;
        },
        toggleMotionFilter(state){
          state.applyFilters.motionFilter = !state.applyFilters.motionFilter;
        },
        setFilterCount(state, count){
            state.filterCount = count;
        },
        updateDeviceAttributes(state, payload){
            // Atualizar apenas atributos localmente (sem backend) - UX rápida
            const { id, attributes } = payload;
            if (!state.deviceList[id]) return;
            if (!state.deviceList[id].attributes) {
                state.deviceList[id].attributes = {};
            }
            // REATIVIDADE SEGURA: criar novo objeto deviceList
            const newDeviceList = { ...state.deviceList };
            newDeviceList[id] = {
                ...state.deviceList[id],
                attributes: { ...state.deviceList[id].attributes, ...attributes }
            };
            state.deviceList = newDeviceList;
        },
        toggleStreet(state){
            state.streetview = !state.streetview;
        },
    toggleCalor(state, value) {
      state.toggleCalor = value !== undefined ? value : !state.toggleCalor;
    },
          toggleCalorCorrelacao(state) {
            state.showCalorCorrelacao = !state.showCalorCorrelacao;
          },
          togglePontos(state) {
            state.showPontos = !state.showPontos;
          },
          togglePontosCorrelacao(state) {
            state.togglePontosCorrelacao = !state.togglePontosCorrelacao;
            },
        setTrail(state,value){
            if(value===false) {
                state.positionHistory = [];
            }else{

                const p = state.positionsList[value];

                state.positionHistory = [];
                state.positionHistory.push(p);
            }
            state.trail = value;
            state.isFollowingId = value;
        },
        setFollow(state,value){
          state.isFollowingId = value;
        },
        setDevices(state, devicesArray){
            // CORREÇÃO: value pode ser array, mas deviceList deve ser map {id:device}
            if (Array.isArray(devicesArray)) {
                const map = {};
                const keys = [];
                devicesArray.forEach(d => {
                    map[d.id] = d;
                    keys.push(d.id);
                });
                state.deviceList = map;
                state.deviceKeys = keys;
            } else {
                // Fallback: já é objeto (compatibilidade)
                state.deviceList = devicesArray;
                state.deviceKeys = Object.keys(devicesArray).map(k => parseInt(k));
            }
        },// Resete os estados quando necessário
            resetStates(state) {
                state.showCalor = false;
                state.showPercurso = false;
                state.toggleCalor = false;
                state.togglePercurso = false;
                state.showPontos = false;
                state.showPontosCorrelacao = false;
                state.togglePontosCorrelacao = false;
                // state.showCalorCorrelacao = false;
            // Adicione outros resets, se necessário
          },        
        async addDevice(state,value){
            // Garantir que o ID esteja nos deviceKeys 
            if(!state.deviceKeys.includes(value.id)) {
                state.deviceKeys.push(value.id);
            }
            
            // REATIVIDADE SEGURA: criar novo objeto para garantir que Vue detecte a mudança
            const newDeviceList = { ...state.deviceList };
            newDeviceList[value.id] = value;
            state.deviceList = newDeviceList;

            // 🎯 HANDSHAKE: Aguardar canvasMarkerReady antes de adicionar ícone
            if (window.__canvasMarkerReady && typeof L !== 'undefined' && window.addDevice) {
                const icon = window.addDevice(value);
                if (icon) {
                    value.icon = icon;
                }
            } else if (!window.__canvasMarkerReady) {
                // Aguardar evento e tentar novamente
                const handler = () => {
                    if (window.addDevice) {
                        const icon = window.addDevice(value);
                        if (icon) value.icon = icon;
                    }
                };
                window.addEventListener('tarkan:canvasMarkerReady', handler, { once: true });
            }


        },
        updateDevice(state,value){
            if(!state.deviceKeys.includes(value.id)) {
                state.deviceKeys.push(value.id);
            }

            const device = state.deviceList[value.id];
            if (!device) return;

            // Helper: compatibilidade icon array/object
            const eachIcon = (fn) => {
                const icons = Array.isArray(device.icon) ? device.icon : [device.icon].filter(Boolean);
                icons.forEach(i => { try { fn(i); } catch(e){ if(PERF_DEBUG) console.warn('eachIcon error:', e); } });
            };

            if(device.status !== value.status){
                eachIcon(i => i.updateStatus?.(value.status));
            }

            if(device.category!==value.category ||
                (value.attributes['tarkan.color'] && (!device.attributes['tarkan.color'] || device.attributes['tarkan.color']!==value.attributes['tarkan.color'])) ||
                (value.attributes['tarkan.color_extra'] && (!device.attributes['tarkan.color_extra'] || device.attributes['tarkan.color_extra']!==value.attributes['tarkan.color_extra']))){

                Object.assign(device,value);
                eachIcon(i => i.updateCanva?.(device));
            }else{
                Object.assign(device,value);
            }
        },
        removeDevice(state, id){
            delete state.deviceList[id];
            state.deviceKeys.splice(state.deviceKeys.findIndex((d)=> d === id), 1);
            // CORREÇÃO: limpar throttle buffer ao remover device
            const buf = deviceThrottleBuffer.get(id);
            if (buf?.timerId) clearTimeout(buf.timerId);
            deviceThrottleBuffer.delete(id);
        },
        setPositions(state,value){
            state.positionsList = {};

            value.forEach((p)=>{
                state.positionsList[p.deviceId] = p;
            });

        },
        addPosition(state, p){
            // CORREÇÃO: positionsList é objeto {deviceId:position}, não array
            state.positionsList[p.deviceId] = p;
        },
        updatePosition(state,p){
            const perfStart = PERF_DEBUG ? performance.now() : 0;
            trackWsEvent();
            
            state.positionsList[p.deviceId] = p;

            const device = state.deviceList[p.deviceId];
            if(device){

                if(p.deviceId === state.trail) {
                    state.positionHistory.push(p);
                }

                // GATE 4: Bloquear realtime durante playback
                // Realtime fica "mute" enquanto playback roda para evitar briga de markers
                const isPlaybackActive = window.__KORE_DEBUG__?.playbackActive ?? false;
                if (isPlaybackActive) {
                    // Ainda atualiza positionsList (UI/tabelas podem usar)
                    // Mas NÃO mexe em Leaflet markers/layers
                    perfLog('updatePosition (blocked by playback)', perfStart, `device:${p.deviceId}`);
                    recordUpdatePositionTime(performance.now() - perfStart);
                    return;
                }

                // PROTEÇÃO PARA MODO HISTÓRICO/RELATÓRIO:
                // Não mover marcadores nem centralizar mapa quando:
                // - showRoutes está ativo (visualizando rota histórica)
                // - showOnlyId !== 0 (filtro de dispositivo único ativo)
                // Isso evita conflito entre WebSocket e visualização de relatórios
                const isInReportMode = state.showRoutes || state.applyFilters.showOnlyId !== 0;
                
                if(!isInReportMode && typeof window.L !== 'undefined'){
                    // THROTTLE COM FLUSH GARANTIDO:
                    // Limita atualizações do mapa por device, mas SEMPRE aplica o último update
                    const now = Date.now();
                    const deviceBuffer = deviceThrottleBuffer.get(p.deviceId);
                    
                    if (ENABLE_MAP_THROTTLE && deviceBuffer && (now - deviceBuffer.lastUpdate) < MAP_THROTTLE_MS) {
                        // Guardar posição pendente
                        deviceBuffer.pending = p;
                        
                        // FLUSH GARANTIDO: Agendar timer para aplicar o último update
                        // Se já existe timer, não duplicar
                        if (!deviceBuffer.timerId) {
                            const remainingTime = MAP_THROTTLE_MS - (now - deviceBuffer.lastUpdate);
                            deviceBuffer.timerId = setTimeout(() => {
                                const buffer = deviceThrottleBuffer.get(p.deviceId);
                                if (buffer && buffer.pending) {
                                    const pendingPos = buffer.pending;
                                    const dev = state.deviceList[pendingPos.deviceId];
                                    if (dev && dev.icon && typeof window.L !== 'undefined') {
                                        // Helper: compatibilidade icon array/object
                                        const eachIcon = (fn) => {
                                            const icons = Array.isArray(dev.icon) ? dev.icon : [dev.icon].filter(Boolean);
                                            icons.forEach(i => { try { fn(i); } catch(e){ if(PERF_DEBUG) console.warn('eachIcon error:', e); } });
                                        };
                                        
                                        eachIcon(i => {
                                            // eslint-disable-next-line no-undef
                                            i.moveTo?.(L.latLng(pendingPos.latitude, pendingPos.longitude), 300);
                                            if (i.options?.img) i.options.img.rotate = pendingPos.course;
                                        });
                                    }
                                    buffer.lastUpdate = Date.now();
                                    buffer.pending = null;
                                    buffer.timerId = null;
                                }
                            }, remainingTime);
                        }
                        
                        perfLog('updatePosition (throttled+scheduled)', perfStart, `device:${p.deviceId}`);
                        recordUpdatePositionTime(performance.now() - perfStart);
                        return;
                    }
                    
                    // Limpar timer pendente se existir (chegou update natural)
                    if (deviceBuffer && deviceBuffer.timerId) {
                        clearTimeout(deviceBuffer.timerId);
                    }
                    
                    // Atualizar buffer de throttle
                    deviceThrottleBuffer.set(p.deviceId, { lastUpdate: now, pending: null, timerId: null });
                    
                    // Helper: compatibilidade icon array/object
                    const eachIcon = (fn) => {
                        const icons = Array.isArray(device.icon) ? device.icon : [device.icon].filter(Boolean);
                        icons.forEach(i => { try { fn(i); } catch(e){ if(PERF_DEBUG) console.warn('eachIcon error:', e); } });
                    };
                    
                    eachIcon(i => {
                        // eslint-disable-next-line no-undef
                        i.moveTo?.(L.latLng(p.latitude,p.longitude),500);
                        if (i.options?.img) i.options.img.rotate = p.course;
                    });

                    if(state.isFollowingId===device.id){
                        try {
                            window.$setMapCenter(window.L.latLng(p.latitude,p.longitude));
                        } catch (err) {
                            console.warn('Erro ao centralizar mapa:', err);
                        }
                    }
                }

                // DEFENSIVE CODING: proteger integrações globais opcionais
                if(window.$updateMapaPercurso && !isInReportMode){
                    try {
                        window.$updateMapaPercurso(device.id);
                    } catch (err) {
                        console.warn('Erro em $updateMapaPercurso:', err);
                    }
                }
            }
            
            const elapsed = performance.now() - perfStart;
            perfLog('updatePosition', perfStart, `device:${p.deviceId}`);
            recordUpdatePositionTime(elapsed);
        },
        updatePositions(state,positions){
            const perfStart = PERF_DEBUG ? performance.now() : 0;

            // GATE 4: Bloquear realtime durante playback
            const isPlaybackActive = window.__KORE_DEBUG__?.playbackActive ?? false;
            if (isPlaybackActive) {
                // Ainda atualiza positionsList (UI pode precisar)
                positions.forEach((p) => {
                    trackWsEvent();
                    state.positionsList[p.deviceId] = p;
                });
                perfLog('updatePositions (blocked by playback)', perfStart, `count:${positions.length}`);
                recordUpdatePositionTime(performance.now() - perfStart);
                return;
            }

            // PROTEÇÃO PARA MODO HISTÓRICO/RELATÓRIO:
            // Não atualizar posições no mapa quando em modo de visualização de rota
            const isInReportMode = state.showRoutes || state.applyFilters.showOnlyId !== 0;
            const now = Date.now();

            positions.forEach((p)=>{
                trackWsEvent();
                state.positionsList[p.deviceId] = p;

                if (PERF_DEBUG) console.log(p.deviceId,state.trail);

                const device = state.deviceList[p.deviceId];
                if(device){
                    // Só mover marcadores se NÃO estiver em modo de relatório
                    if(!isInReportMode && typeof window.L !== 'undefined'){
                        // THROTTLE COM FLUSH GARANTIDO:
                        const deviceBuffer = deviceThrottleBuffer.get(p.deviceId);
                        
                        if (ENABLE_MAP_THROTTLE && deviceBuffer && (now - deviceBuffer.lastUpdate) < MAP_THROTTLE_MS) {
                            // Guardar posição pendente
                            deviceBuffer.pending = p;
                            
                            // FLUSH GARANTIDO: Agendar timer para aplicar o último update
                            if (!deviceBuffer.timerId) {
                                const remainingTime = MAP_THROTTLE_MS - (now - deviceBuffer.lastUpdate);
                                deviceBuffer.timerId = setTimeout(() => {
                                    const buffer = deviceThrottleBuffer.get(p.deviceId);
                                    if (buffer && buffer.pending) {
                                        const pendingPos = buffer.pending;
                                        const dev = state.deviceList[pendingPos.deviceId];
                                        if (dev && dev.icon && typeof window.L !== 'undefined') {
                                            // Helper: compatibilidade icon array/object
                                            const eachIcon = (fn) => {
                                                const icons = Array.isArray(dev.icon) ? dev.icon : [dev.icon].filter(Boolean);
                                                icons.forEach(i => { try { fn(i); } catch(e){ if(PERF_DEBUG) console.warn('eachIcon error:', e); } });
                                            };
                                            
                                            eachIcon(i => {
                                                // eslint-disable-next-line no-undef
                                                i.moveTo?.(L.latLng(pendingPos.latitude, pendingPos.longitude), 300);
                                                if (i.options?.img) i.options.img.rotate = pendingPos.course;
                                            });
                                        }
                                        buffer.lastUpdate = Date.now();
                                        buffer.pending = null;
                                        buffer.timerId = null;
                                    }
                                }, remainingTime);
                            }
                            return; // Skip map update para este device
                        }
                        
                        // Limpar timer pendente se existir
                        if (deviceBuffer && deviceBuffer.timerId) {
                            clearTimeout(deviceBuffer.timerId);
                        }
                        
                        // Atualizar buffer de throttle
                        deviceThrottleBuffer.set(p.deviceId, { lastUpdate: now, pending: null, timerId: null });
                        
                        // eslint-disable-next-line no-undef
                        device.icon.moveTo(L.latLng(p.latitude,p.longitude),500);
                        device.icon.options.img.rotate = p.course;

                        if(state.isFollowingId===device.id){
                            try {
                                window.$setMapCenter(window.L.latLng(p.latitude,p.longitude));
                            } catch (err) {
                                console.warn('Erro ao centralizar mapa:', err);
                            }
                        }
                    }

                    // DEFENSIVE CODING: proteger integrações globais opcionais
                    if(window.$updatePano && state.streetview){
                        try {
                            console.log('devices.js: Chamando $updatePano para device:', device.id, 'position:', p);
                            window.$updatePano(device.id, p);
                        } catch (err) {
                            console.warn('Erro em $updatePano:', err);
                        }
                    }
                    if(window.$updateMapaPercurso && !isInReportMode){
                        try {
                            window.$updateMapaPercurso(device.id);
                        } catch (err) {
                            console.warn('Erro em $updateMapaPercurso:', err);
                        }
                    }
                }
            });
            
            perfLog('updatePositions', perfStart, `batch:${positions.length}`);
        }
    },
    actions: {
        setSorting(context,p){
            if(context.state._sorting.split("-")[0]===p){
                context.commit("setSorting",p+"-"+(context.state._sorting.split("-")[1]==='asc'?'desc':'asc'))
            }else{
                context.commit("setSorting",p+"-asc")
            }
        },
        setSortingState(context,p){
            context.commit("setSorting",p);
        },
        refreshOneDevice(context, fk){
            // ATENÇÃO: Esta action chama a função interna e retorna boolean
            // Para evitar problemas com Promise, use a função interna diretamente quando possível
            return refreshOneDeviceInternal(context, fk);
        },
        toggleHiddenFilter(context,value){
            context.commit("toggleHiddenFilter",value);
            context.dispatch("refreshDevices");
        },
        setDeviceFilter(context,value){
          context.commit("setDeviceFilter",value);
          context.dispatch("refreshDevices");
        },
        refreshDevices(context){
            const perfStart = PERF_DEBUG ? performance.now() : 0;
            if (PERF_DEBUG) console.log("REFRESH DEVICES");
            
            const deviceKeys = context.state.deviceKeys;
            const totalDevices = deviceKeys.length;
            let visibleCount = 0;
            
            // CANCELAR EXECUÇÃO ANTERIOR: incrementar runId para invalidar chunks pendentes
            refreshRunId++;
            const currentRunId = refreshRunId;
            
            // CHUNKED REFRESH: Processar em lotes para não travar UI
            if (ENABLE_CHUNKED_REFRESH && totalDevices > REFRESH_CHUNK_SIZE) {
                let index = 0;
                
                const processChunk = () => {
                    // ABORTAR se outro refresh foi iniciado
                    if (currentRunId !== refreshRunId) {
                        if (PERF_DEBUG) console.log(`[PERF] refreshDevices abortado (runId ${currentRunId} != ${refreshRunId})`);
                        return;
                    }
                    
                    const chunkEnd = Math.min(index + REFRESH_CHUNK_SIZE, totalDevices);
                    
                    for (let i = index; i < chunkEnd; i++) {
                        // ✅ CORREÇÃO: chamar função interna diretamente (não dispatch que retorna Promise)
                        const isVisible = refreshOneDeviceInternal(context, deviceKeys[i]);
                        if (isVisible) visibleCount++;
                    }
                    
                    index = chunkEnd;
                    
                    if (index < totalDevices) {
                        // Próximo chunk no próximo frame
                        requestAnimationFrame(processChunk);
                    } else {
                        // ✅ CORREÇÃO: usar commit em vez de atribuição direta (Vuex pattern)
                        context.commit("setFilterCount", visibleCount);
                        const elapsed = performance.now() - perfStart;
                        perfLog('refreshDevices (chunked)', perfStart, `total:${totalDevices}, visible:${visibleCount}`);
                        recordRefreshDevicesTime(elapsed);
                    }
                };
                
                requestAnimationFrame(processChunk);
            } else {
                // Processamento síncrono para listas pequenas
                deviceKeys.forEach((f) => {
                    // ✅ CORREÇÃO: chamar função interna diretamente (não dispatch que retorna Promise)
                    const isVisible = refreshOneDeviceInternal(context, f);
                    if (isVisible) visibleCount++;
                });
                // ✅ CORREÇÃO: usar commit em vez de atribuição direta (Vuex pattern)
                context.commit("setFilterCount", visibleCount);
                const elapsed = performance.now() - perfStart;
                perfLog('refreshDevices (sync)', perfStart, `total:${totalDevices}, visible:${visibleCount}`);
                recordRefreshDevicesTime(elapsed);
            }
        },
        setStatusFilter(context,value){
          context.commit("setStatusFilter",value);
          context.dispatch("refreshDevices");
        },
        setStateFilter(context, value){
            context.commit("setStateFilter", value);
            context.dispatch("refreshDevices");
        },
        setCombinedStatusFilter(context, value){
            context.commit("setCombinedStatusFilter", value);
            context.dispatch("refreshDevices");
        },
        setAdvancedFilter(context, payload){
            context.commit("setAdvancedFilter", payload);
            context.dispatch("refreshDevices");
        },
        toggleMotionFilter(context) {
            context.commit("toggleMotionFilter")
            context.dispatch("refreshDevices");
        },
        updateAttributes(context, payload){
            // Atualizar atributos localmente (UX rápida) + refresh visual
            context.commit("updateDeviceAttributes", payload);
            setTimeout(() => {
                context.dispatch("refreshOneDevice", payload.id);
            }, 100);
        },
        setTrail(context,value){
            context.commit("setTrail",value);
        },
        toggleStreet(context){
            context.commit("toggleStreet")
        },
        toggleCalor(context){
            context.commit("toggleCalor")
        },
        togglePontos(context){
            context.commit("togglePontos")
        },
        togglePontosCorrelacao(context){
            context.commit("togglePontosCorrelacao")
        },
        toggleCalorCorrelacao(context){
            context.commit("toggleCalorCorrelacao")
        },
        resetDeviceStates({ commit }) {
            commit('resetStates');
          },
        // eslint-disable-next-line no-unused-vars
        async connectWs(context){
            // 🔒 GUARD: Evita dupla conexão WS
            if (wsConnecting) {
                console.warn('[devices/connectWs] Já conectando, ignorando chamada duplicada');
                return;
            }

            wsConnecting = true;

            try {
                const { getRuntimeApi } = await import('@/services/runtimeApiRef');
                const api = getRuntimeApi();

                // Verifica se já está conectado
                if (api.isWsConnected?.()) {
                    console.warn('[devices/connectWs] WS já conectada');
                    wsConnecting = false;
                    return;
                }

                // 🔒 Registra handlers apenas 1 vez (Emitter acumula infinitamente)
                if (!wsHandlersRegistered) {
                    api.on('open',()=>{
                        wsConnecting = false;
                        //console.log("WS OPEN")
                    })
                    api.on('close',()=>{
                        wsConnecting = false;
                        wsHandlersRegistered = false; // Reset para permitir reconexão
                        window.setTimeout(()=>{
                            api.startWS();
                        },5000);
                    })
                    api.on('message',(m)=>{
                        if(m.positions){
                            m.positions.forEach((p)=>{
                                context.commit("updatePosition",p);
                            });
                            //context.commit("updatePositions",m.positions);
                        }

                        if(m.devices){
                            // eslint-disable-next-line no-unused-vars
                            m.devices.forEach((d)=>{
                                context.commit("updateDevice",d)

                                setTimeout(()=> {
                                    context.dispatch("refreshOneDevice", d.id);
                                },500);
                            })
                        }

                        if(m.events){
                            context.dispatch("events/proccessNotifications",m.events,{root: true});
                        }
                    })

                    wsHandlersRegistered = true;
                }

                api.startWS();
            } catch(err) {
                wsConnecting = false;
                console.error('[devices/connectWs] Erro ao conectar WS:', err);
                throw err;
            }
        },
        waitForDevice(){
            return new Promise((resolve)=> {
                const checkDevice = ()=>{
                    if(window.addDevice){
                        resolve();
                    }else{
                        setTimeout(checkDevice,1000);
                    }
                }

                checkDevice();
            });
        },
        async load(context,waitDevice=true){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();

            if(waitDevice) {
                await context.dispatch("waitForDevice");
                await window.loadModels();
            }

            try {
                const {data} = await api.getDevices();
                data.forEach((d) => {
                    if (!(d.uniqueId.split("-").length == 3 && d.uniqueId.split("-")[0] === "deleted")) {
                        context.commit("addDevice", d);
                    }
                });
            } catch(err) {
                console.error('❌ [devices/load] Erro ao carregar devices:', err);
                throw err;
            }
        },
        async delete(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            const {data} = await api.deleteDevice(params);
            context.commit("removeDevice",params);
            return data;
        },
        async save(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();

            if (params.id) {
                const {data} = await api.updateDevice(params.id, params);
                context.commit("updateDevice",data);
                return data;
            } else {
                const {data} = await api.createDevice(params);
                context.commit("addDevice",data);
                return data;
            }
        },
        async accumulators(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();

            if (params.deviceId) {
                const {data} = await api.updateAccumulators(params.deviceId, params);
                return data;
            }
        },
        async positions(context){
            try {
                const { getRuntimeApi } = await import('@/services/runtimeApiRef');
                const api = getRuntimeApi();
                const {data} = await api.getPositions();
                context.commit("setPositions", data);

                if(data.length>0) {
                    let tmp = [];
                    for(var p in data){
                        tmp.push([data[p].latitude,data[p].longitude]);
                    }

                    // 🎯 HANDSHAKE: Aguardar mapReady antes de fitBounds
                    const performFitBounds = () => {
                        if(typeof L !== 'undefined' && window.$map?.fitBounds) {
                            const zoom = (context.rootState.server.serverInfo.attributes && context.rootState.server.serverInfo.attributes['web.selectZoom']) ? context.rootState.server.serverInfo.attributes['web.selectZoom'] : 17;
                            // eslint-disable-next-line no-undef
                            const bds = L.latLngBounds(tmp);
                            window.$map.fitBounds(bds, {maxZoom: zoom});
                        }
                    };
                    
                    if (window.__mapReady) {
                        setTimeout(performFitBounds, 500);
                    } else {
                        window.addEventListener('tarkan:mapReady', () => {
                            setTimeout(performFitBounds, 500);
                        }, { once: true });
                    }
                }
            } catch(err) {
                console.warn('⚠️ [positions] Erro ao carregar posições (pode ser abort normal):', err.message);
                // Não bloquear o fluxo com throw, apenas log
            }
        }
    }
}
