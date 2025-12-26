import store from "../index";

export default {
    namespaced: true,
    state: () => ({
        deviceKeys: [],
        deviceList: {},
        positionsList: {},
        positionHistory: [],
        isFollowingId: 0,
        showRoutes: false,
        showRouteMarkers: false,
        trail: false,
        streetview: false,
        _sorting: 'name-asc',
        routePlayPoint: 0, // Ponto atual na reprodução da rota
        filterCount: 0, // Contador de objetos filtrados
        applyFilters: {
            showOnlyId: 0,
            statusFilter: 'all',
            motionFilter: false,
            hideCategory: [],
            stateFilter: 'all',
            combinedStatusFilter: 'all', // Para el filtro de 6 estados
            advancedFilter: { // Para el filtro avanzado de 5 estados
                type: 'none',
                value: null
            },
            combinedAdvancedFilters: [] // Para permitir múltiples filtros avanzados combinados
        }
    }),
    getters: {
        sorting(state) {
            return state._sorting;
        },
        getDeviceList(state) {
            return Object.values(state.deviceList);
        },
        getOrderedDevices(state) {
            /* let tmp = [];
 
             console.log("LAG?");
 
             for(var K of Object.keys(state.deviceList)){
                 tmp.push(state.deviceList[K]);
             }
 
             return tmp;*/
            //return state.deviceKeys;

            const p = state._sorting.split("-");

            return [...state.deviceKeys].sort((ak, bk) => {
                const a = state.deviceList[ak];
                const b = state.deviceList[bk];

                if (p[0] === 'state') {

                    const as = state.positionsList[ak];
                    const bs = state.positionsList[bk];

                    if (!as) {
                        return 1;
                    }
                    if (!bs) {
                        return -1;
                    }

                    if (p[1] === 'motion') {
                        if (as.attributes['motion'] === undefined) {
                            return 1;
                        }
                        if (bs.attributes['motion'] === undefined) {
                            return -1;
                        }

                        return (as.attributes['motion'] === bs.attributes['motion']) ? 0 : (as.attributes['motion'] === true) ? -1 : (bs.attributes['motion'] === true) ? 1 : 0;
                    }

                    if (p[1] === 'anchor') {

                        const aa = store.getters['geofences/isAnchored'](a.id) ? true : false;
                        const ba = store.getters['geofences/isAnchored'](b.id) ? true : false;

                        return (aa == ba) ? 0 : (aa === true) ? -1 : (ba === true) ? 1 : 0;
                    }

                    if (p[1] === 'locked') {
                        if (as.attributes['blocked'] === undefined) {
                            return 1;
                        }
                        if (bs.attributes['blocked'] === undefined) {
                            return -1;
                        }


                        return (as.attributes['blocked'] === bs.attributes['blocked']) ? 0 : (as.attributes['blocked'] === true) ? -1 : (bs.attributes['blocked'] === true) ? 1 : 0;
                    }
                    if (p[1] === 'ignition') {

                        if (as.attributes['ignition'] === undefined) {
                            return 1;
                        }
                        if (bs.attributes['ignition'] === undefined) {
                            return -1;
                        }

                        return (as.attributes['ignition'] === bs.attributes['ignition']) ? 0 : (as.attributes['ignition'] === true) ? -1 : (bs.attributes['ignition'] === true) ? 1 : 0;
                    }

                    if (p[1] === 'driver') {

                        const at = as.attributes['driverUniqueId'] ? true : false;
                        const bt = bs.attributes['driverUniqueId'] ? true : false;

                        return (at === bt) ? 0 : (at === true) ? -1 : (bt === true) ? 1 : 0;
                    }


                    if (p[1] === 'alert') {

                        const at = as.attributes['alarm'] ? true : false;
                        const bt = bs.attributes['alarm'] ? true : false;

                        return (at === bt) ? 0 : (at === true) ? -1 : (bt === true) ? 1 : 0;
                    }


                } else if (p[0] === 'lastUpdate') {

                    if (a[p[0]] === null) {
                        return 1;
                    } else if (b[p[0]] === null) {
                        return -1;
                    } else if (new Date(a[p[0]]).getTime() < new Date(b[p[0]]).getTime()) {
                        return (p[1] === 'asc') ? 1 : -1;
                    } else if (new Date(a[p[0]]).getTime() > new Date(b[p[0]]).getTime()) {
                        return (p[1] === 'asc') ? -1 : 1;
                    } else {
                        return 0;
                    }
                } else if (a[p[0]] > b[p[0]]) {
                    return (p[1] === 'asc') ? 1 : -1;
                } else if (a[p[0]] < b[p[0]]) {
                    return (p[1] === 'desc') ? 1 : -1;
                } else {
                    return 0;
                }
            })

        },
        isHiddenFilter(state) {
            return (id) => {
                return !state.applyFilters.hideCategory.find((f) => {

                    return f == id
                });
            }
        },
        // eslint-disable-next-line no-unused-vars
        getFilters(state) {
            return state.applyFilters;
        },
        getDevice(state) {
            return (deviceId) => {
                if (!deviceId) {
                    return false;
                }
                return state.deviceList[deviceId];
            }
        },
        getPosition(state) {
            return (positionId) => {
                if (!positionId) {
                    return false;
                }
                return state.positionsList[positionId];
            }
        },
        getTrails(state) {
            let tmp = [];

            state.positionHistory.forEach((p) => {
                tmp.push([p.latitude, p.longitude])
            });


            return tmp;
        },
        deviceCount(state) {
            let tmp = {
                online: 0,
                offline: 0,
                unknown: 0,
                motion: 0
            };


            const all = state.deviceList;
            const _all = Object.keys(all);
            const positions = state.positionsList;

            _all.forEach((K) => {
                const f = all[K];
                const pos = positions[K];

                if (f.status === 'online') {
                    tmp.online++;
                } else if (f.status === 'offline') {
                    tmp.offline++;
                } else if (f.status === 'unknown') {
                    tmp.unknown++;
                }

                if (pos && pos.attributes['motion'] && pos.attributes['motion'] === true && f.status === 'online') {
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
        setRoute(state, value) {
            state.showRoutes = value;
        },
        setShowRouteMarkers(state, value) {
            state.showRouteMarkers = value;
        },
        setDeviceFilter(state, value) {
            state.applyFilters.showOnlyId = value;
        },
        toggleHiddenFilter(state, value) {
            const idx = state.applyFilters.hideCategory.findIndex((f) => f === value);

            //console.log(value,idx);

            if (idx > -1) {
                state.applyFilters.hideCategory.splice(idx, 1);
            } else {
                state.applyFilters.hideCategory.push(value);
            }
        },
        setSorting(state, value) {
            // Añadimos protección contra errores
            try {
                if (typeof value === 'string') {
                    state._sorting = value;
                } else {
                    console.warn("Valor de ordenación inválido:", value);
                    state._sorting = 'name-asc'; // Valor predeterminado seguro
                }
            } catch (err) {
                console.error("Error al establecer ordenación:", err);
                state._sorting = 'name-asc'; // Valor predeterminado en caso de error
            }
        },
        setStatusFilter(state, value) {
            state.applyFilters.statusFilter = value;
        },
        setStateFilter(state, value) {
            state.applyFilters.stateFilter = value;
        },
        setCombinedStatusFilter(state, value) {
            state.applyFilters.combinedStatusFilter = value;
        },
        setAdvancedFilter(state, payload) {
            state.applyFilters.advancedFilter = payload;
            
            // Actualizar también el filtro combinado
            if (payload.type === 'none') {
                // Limpiar todos los filtros combinados si se desactiva
                state.applyFilters.combinedAdvancedFilters = [];
            } else {
                // Verificar si ya existe un filtro del mismo tipo
                const existingIndex = state.applyFilters.combinedAdvancedFilters.findIndex(
                    filter => filter.type === payload.type
                );
                
                if (existingIndex >= 0) {
                    // Actualizar el valor si ya existe
                    state.applyFilters.combinedAdvancedFilters[existingIndex] = payload;
                } else {
                    // Agregar nuevo filtro a la lista combinada
                    state.applyFilters.combinedAdvancedFilters.push(payload);
                }
            }
        },
        setGpsBrandFilter(state, value) {
            const payload = value ? {type: 'gps_brand', value: value} : {type: 'none', value: null};
            state.applyFilters.advancedFilter = payload;
            
            // Actualizar también el filtro combinado
            if (payload.type === 'none') {
                // Eliminar filtro de marca de la lista combinada
                state.applyFilters.combinedAdvancedFilters = 
                    state.applyFilters.combinedAdvancedFilters.filter(f => f.type !== 'gps_brand');
            } else {
                // Actualizar o agregar filtro combinado
                const existingIndex = state.applyFilters.combinedAdvancedFilters.findIndex(
                    filter => filter.type === 'gps_brand'
                );
                if (existingIndex >= 0) {
                    state.applyFilters.combinedAdvancedFilters[existingIndex] = payload;
                } else {
                    state.applyFilters.combinedAdvancedFilters.push(payload);
                }
            }
        },
        setGpsModelFilter(state, value) {
            const payload = value ? {type: 'gps_model', value: value} : {type: 'none', value: null};
            state.applyFilters.advancedFilter = payload;
            
            // Actualizar también el filtro combinado
            if (payload.type === 'none') {
                // Eliminar filtro de modelo de la lista combinada
                state.applyFilters.combinedAdvancedFilters = 
                    state.applyFilters.combinedAdvancedFilters.filter(f => f.type !== 'gps_model');
            } else {
                // Actualizar o agregar filtro combinado
                const existingIndex = state.applyFilters.combinedAdvancedFilters.findIndex(
                    filter => filter.type === 'gps_model'
                );
                if (existingIndex >= 0) {
                    state.applyFilters.combinedAdvancedFilters[existingIndex] = payload;
                } else {
                    state.applyFilters.combinedAdvancedFilters.push(payload);
                }
            }
        },
        toggleMotionFilter(state) {
            state.applyFilters.motionFilter = !state.applyFilters.motionFilter;
        },
        toggleStreet(state) {
            state.streetview = !state.streetview;
        },
        setTrail(state, value) {
            if (value === false) {
                state.positionHistory = [];
            } else {

                const p = state.positionsList[value];

                state.positionHistory = [];
                state.positionHistory.push(p);
            }
            state.trail = value;
            state.isFollowingId = value;
        },
        setFollow(state, value) {
            state.isFollowingId = value;
        },
        setDevices(state, value) {
            state.deviceList = value;
            state.deviceKeys = [];
            value.forEach((d) => {
                state.deviceKeys.push(d.id);
            })
        },
        async addDevice(state, value) {
            // Garantir que o ID esteja nos deviceKeys 
            if (!state.deviceKeys.includes(value.id)) {
                state.deviceKeys.push(value.id);
            }
            
            // Criar um novo objeto deviceList para garantir reatividade
            const newDeviceList = { ...state.deviceList };
            newDeviceList[value.id] = value;
            state.deviceList = newDeviceList;

            // Adicionar o dispositivo ao mapa se o Leaflet estiver disponível
            if (typeof window.L !== 'undefined' && window.addDevice) {
                value.icon = window.addDevice(value);
            }
        },

        updateDevice(state, value) {

            //console.log("UPDATE?");

            if (!state.deviceKeys.includes(value.id)) {
                state.deviceKeys.push(value.id);
            }

            const device = state.deviceList[value.id];

            if (device.status !== value.status) {
                device.icon.forEach((i) => { i.updateStatus(value.status); })
            }


            //console.log(device.attributes['tarkan.color'],value.attributes['tarkan.color']);

            if (device.category !== value.category ||
                (value.attributes['tarkan.color'] && (!device.attributes['tarkan.color'] || device.attributes['tarkan.color'] !== value.attributes['tarkan.color'])) ||
                (value.attributes['tarkan.color_extra'] && (!device.attributes['tarkan.color_extra'] || device.attributes['tarkan.color_extra'] !== value.attributes['tarkan.color_extra']))) {


                Object.assign(device, value);
                device.icon.forEach((i) => { i.updateCanva(device); });
            } else {

                Object.assign(device, value);
            }




        },
        
        // Atualiza apenas os atributos específicos de um dispositivo sem enviar ao backend
        updateDeviceAttributes(state, payload) {
            const { id, attributes } = payload;
            
            if (!state.deviceList[id]) {
                console.warn(`Dispositivo com ID ${id} não encontrado`);
                return;
            }
            
            // Garantir que o objeto attributes existe
            if (!state.deviceList[id].attributes) {
                state.deviceList[id].attributes = {};
            }
            
            // Criar um novo objeto deviceList para garantir reatividade
            const newDeviceList = { ...state.deviceList };
            
            // Criar cópia do dispositivo
            newDeviceList[id] = { 
                ...state.deviceList[id],
                // Mesclar os novos atributos com os existentes
                attributes: {
                    ...state.deviceList[id].attributes,
                    ...attributes
                }
            };
            
            // Substituir o objeto inteiro para manter reatividade
            state.deviceList = newDeviceList;
        },
        removeDevice(state, value) {
            delete state.deviceList[value];
            state.deviceKeys.splice(state.deviceKeys.findIndex((d) => d === value), 1);
        },
        setPositions(state, value) {
            state.positionsList = {};

            value.forEach((p) => {
                state.positionsList[p.deviceId] = p;
            });

        },
        addPosition(state, value) {
            state.positionsList.push(value);
        },
        updatePosition(state, p) {
            state.positionsList[p.deviceId] = p;

            const device = state.deviceList[p.deviceId];
            if (device) {

                if (p.deviceId === state.trail) {
                    state.positionHistory.push(p);
                }

                //device.icon.setPosition(p.latitude,p.longitude,p.course,(state.isFollowingId===device.id));
                // eslint-disable-next-line no-undef
                // No actualizar posición si estamos en modo de informe de ruta
                if (state.applyFilters.showOnlyId == 0 && !state.showRoutes && typeof window.L !== 'undefined') {
                    device.icon.forEach((i) => {
                        i.moveTo(window.L.latLng(p.latitude, p.longitude), 500);
                        i.options.img.rotate = p.course;
                    });
                } else {
                    console.log("NO MOVE - Route mode active or filtered");
                }

                // No centrar mapa si estamos en modo de informe de ruta
                if (state.isFollowingId === device.id && !state.showRoutes && typeof window.L !== 'undefined') {
                    window.$setMapCenter(window.L.latLng(p.latitude, p.longitude));
                }
                
                // Actualizar Street View si está activo
                if (window.$updatePano && state.streetview) {
                    // Encapsulamos en un try-catch para evitar errores
                    try {
                        window.$updatePano(device.id);
                    } catch (error) {
                        console.error("Error al actualizar Street View:", error);
                    }
                }
            }
        },
        updatePositions(state, positions) {



            positions.forEach((p) => {
                state.positionsList[p.deviceId] = p;

                console.log(p.deviceId, state.trail);


                const device = state.deviceList[p.deviceId];
                if (device) {
                    //device.icon.setPosition(p.latitude,p.longitude,p.course,(state.isFollowingId===device.id));
                    // eslint-disable-next-line no-undef
                    // No actualizar posiciones múltiples si estamos en modo de informe de ruta
                    if (state.applyFilters.showOnlyId == 0 && !state.showRoutes && typeof window.L !== 'undefined') {
                        device.icon.forEach((i) => {
                            i.moveTo(window.L.latLng(p.latitude, p.longitude), 500);
                            i.options.img.rotate = p.course;
                        });
                    }

                    // No centrar mapa si estamos en modo de informe de ruta  
                    if (state.isFollowingId === device.id && !state.showRoutes && typeof window.L !== 'undefined') {
                        window.$setMapCenter(window.L.latLng(p.latitude, p.longitude));
                    }
                    
                    // Actualizar Street View si está activo
                    if (window.$updatePano && state.streetview) {
                        // Encapsulamos en un try-catch para evitar errores
                        try {
                            window.$updatePano(device.id);
                        } catch (error) {
                            console.error("Error al actualizar Street View:", error);
                        }
                    }
                }
            })
        }
    },
    actions: {
        
        // Atualiza apenas os atributos de um dispositivo no estado (sem salvar no backend)
        updateAttributes(context, payload) {
            context.commit('updateDeviceAttributes', payload);
            
            // Atualizar o estado visual dos dispositivos
            setTimeout(() => {
                context.dispatch("refreshOneDevice", payload.id);
            }, 100);
        },

        setSorting(context, p) {
            try {
                if (!p || typeof p !== 'string') {
                    // Protección contra valores inválidos
                    console.warn("setSorting recibió un valor inválido:", p);
                    context.commit("setSorting", "name-asc");
                    return;
                }
                
                const currentSort = context.state._sorting || "name-asc";
                
                // Verificar si tenemos formato válido
                if (currentSort.includes("-")) {
                    const currentField = currentSort.split("-")[0];
                    const currentDir = currentSort.split("-")[1];
                    
                    if (currentField === p) {
                        // Cambiar dirección si el campo es el mismo
                        const newDir = (currentDir === 'asc') ? 'desc' : 'asc';
                        context.commit("setSorting", p + "-" + newDir);
                    } else {
                        // Nuevo campo, ordenación ascendente por defecto
                        context.commit("setSorting", p + "-asc");
                    }
                } else {
                    // Si por alguna razón no tiene formato válido, resetear
                    context.commit("setSorting", p + "-asc");
                }
            } catch (err) {
                console.error("Error en acción setSorting:", err);
                // Si hay error, establecer ordenación segura por defecto
                context.commit("setSorting", "name-asc");
            }
        },
        setSortingState(context, p) {
            context.commit("setSorting", p);
        },
        refreshOneDevice(context, fk) {
            const f = context.state.deviceList[fk];
            if (!f || !f.icon || !f.icon[0]) return false;

            let gotFiltered = false;
            let visible = true;

            const statusFilter = context.state.applyFilters.statusFilter;
            const motionFilter = context.state.applyFilters.motionFilter;
            const stateFilter = context.state.applyFilters.stateFilter;
            const advancedFilter = context.state.applyFilters.advancedFilter;
            const combinedStatusFilter = context.state.applyFilters.combinedStatusFilter;
            const filterQuery = window.localStorage.getItem("query") || false;
            const position = context.getters.getPosition(f.id);

            if (filterQuery) {
                gotFiltered = true;
                visible = false;
                f.icon[0].remove();

                // Búsqueda por texto
                for (let k of Object.keys(f)) {
                    if (k === 'status' && String(f[k]).toLowerCase().replace('unknown', 'desconhecido').match(filterQuery.toLowerCase())) {
                        visible = true;
                        break;
                    } else if (String(f[k]).toLowerCase().match(filterQuery.toLowerCase())) {
                        visible = true;
                        break;
                    }
                }

                // Búsqueda en atributos
                if (!visible && f.attributes) {
                    for (let k of Object.keys(f.attributes)) {
                        if (f.attributes[k] && f.attributes[k].toString().toLowerCase().match(filterQuery.toLowerCase())) {
                            visible = true;
                            break;
                        }
                    }
                }

                if (visible) {
                    if (f.icon && f.icon[0] && f.icon[0].options && f.icon[0].options.el) {
                        f.icon[0].options.el.classList.add('filter-visible');
                    }
                    f.icon[0].addToMap();
                }
                return visible;
            } 
            else if (context.state.applyFilters.showOnlyId !== 0) {
                gotFiltered = true;
                visible = (f.id === context.state.applyFilters.showOnlyId);
                
                if (visible) {
                    if (f.icon && f.icon[0] && f.icon[0].options && f.icon[0].options.el) {
                        f.icon[0].options.el.classList.add('filter-visible');
                    }
                    f.icon[0].addToMap();
                } else {
                    if (f.icon && f.icon[0] && f.icon[0].options && f.icon[0].options.el) {
                        f.icon[0].options.el.classList.remove('filter-visible');
                    }
                    f.icon[0].remove();
                }
                return visible;
            } 
            else {
                // Verificar categoría
                if (!f.category) {
                    f.category = 'default';
                }

                if (context.state.applyFilters.hideCategory.find((c) => c === f.category)) {
                    visible = false;
                    gotFiltered = true;
                }

                // 1. Verificar filtro de estado (stateFilter)
                if (visible && stateFilter !== 'all') {
                    if (!f.attributes || !f.attributes['device.state'] || f.attributes['device.state'] !== stateFilter) {
                        visible = false;
                        gotFiltered = true;
                    }
                }

                // 2. Verificar statusFilter (filtro básico de estado)
                if (visible && statusFilter !== 'all') {
                    if (f.status !== statusFilter) {
                        visible = false;
                        gotFiltered = true;
                    }
                }

                // 3. Verificar motionFilter (filtro básico de movimiento)
                // REGLA BÁSICA: Si está offline, NO puede estar en movimiento
                if (visible && motionFilter) {
                    // PRIMERO: Si no está online, no está en movimiento - PUNTO
                    if (f.status !== 'online') {
                        visible = false;
                        gotFiltered = true;
                    }
                    // SEGUNDO: Si está online, verificar si realmente tiene motion=true
                    else if (!position || !position.attributes || position.attributes.motion !== true) {
                        visible = false;
                        gotFiltered = true;
                    }
                }

                // 4. Verificar combinedStatusFilter (segunda categoría) - solo si los básicos no están activos
                if (visible && combinedStatusFilter !== 'all' && statusFilter === 'all' && !motionFilter) {
                    switch(combinedStatusFilter) {
                        case 'online':
                            if (f.status !== 'online') {
                                visible = false;
                                gotFiltered = true;
                            }
                            break;
                        case 'offline':
                            if (f.status !== 'offline') {
                                visible = false;
                                gotFiltered = true;
                            }
                            break;
                        case 'unknown':
                            if (f.status !== 'unknown') {
                                visible = false;
                                gotFiltered = true;
                            }
                            break;
                        case 'moving':
                            // REGLA BÁSICA: Si está offline, NO puede estar en movimiento
                            if (f.status !== 'online' || !position || !position.attributes || !position.attributes.motion) {
                                visible = false;
                                gotFiltered = true;
                            }
                            break;
                        case 'stopped':
                            if (f.status !== 'online' || (position && position.attributes && position.attributes.motion)) {
                                visible = false;
                                gotFiltered = true;
                            }
                            break;
                    }
                }

                // 5. Verificar advancedFilter (tercera categoría)
                if (visible && advancedFilter.type !== 'none') {
                    switch(advancedFilter.type) {
                        case 'anchor':
                            if (!context.rootGetters['geofences/isAnchored'](f.id)) {
                                visible = false;
                                gotFiltered = true;
                            }
                            break;
                        case 'driver':
                            if (!position || !position.attributes || !position.attributes.driverUniqueId) {
                                visible = false;
                                gotFiltered = true;
                            }
                            break;
                        case 'ignition':
                            if (!position || !position.attributes || position.attributes.ignition !== advancedFilter.value) {
                                visible = false;
                                gotFiltered = true;
                            }
                            break;
                        case 'locked':
                            if (!position || !position.attributes || position.attributes.blocked !== advancedFilter.value) {
                                visible = false;
                                gotFiltered = true;
                            }
                            break;
                        case 'gps_brand':
                            if (!f.attributes || !f.attributes['device.gpsBrand'] || 
                                f.attributes['device.gpsBrand'] !== advancedFilter.value) {
                                visible = false;
                                gotFiltered = true;
                            }
                            break;
                        case 'gps_model':
                            if (!f.attributes || !f.attributes['device.model'] || 
                                f.attributes['device.model'] !== advancedFilter.value) {
                                visible = false;
                                gotFiltered = true;
                            }
                            break;
                        case 'technology':
                            if (!f.attributes || !f.attributes['device.technology'] || 
                                f.attributes['device.technology'] !== advancedFilter.value) {
                                visible = false;
                                gotFiltered = true;
                            }
                            break;
                    }
                }

                // Aplicar visibilidad a marcador
                if (visible) {
                    // Agregar la clase filter-visible al marcador para filtrado con clustering
                    if (f.icon && f.icon[0] && f.icon[0].options && f.icon[0].options.el) {
                        f.icon[0].options.el.classList.add('filter-visible');
                    }
                    f.icon[0].addToMap();
                } else {
                    // Quitar la clase filter-visible si existe
                    if (f.icon && f.icon[0] && f.icon[0].options && f.icon[0].options.el) {
                        f.icon[0].options.el.classList.remove('filter-visible');
                    }
                    f.icon[0].remove();
                }
            }

            if (gotFiltered) {
                context.dispatch("setFiltering", true, { root: true });
            }

            return visible;
        },
        toggleHiddenFilter(context, value) {
            context.commit("toggleHiddenFilter", value);
            context.dispatch("refreshDevices");
        },
        setDeviceFilter(context, value) {
            context.commit("setDeviceFilter", value);
            context.dispatch("refreshDevices");
        },
        refreshDevices(context) {
            console.log("REFRESH DEVICES");
            context.state.deviceKeys.forEach((f) => {
                context.dispatch("refreshOneDevice", f);
            });
        },
        setStatusFilter(context, value) {
            console.log("Setting status filter to:", value);
            context.commit("setStatusFilter", value);
            
            // Desactivar filtro de movimiento cuando se selecciona un filtro de estado
            if (context.state.applyFilters.motionFilter) {
                console.log("Desactivando filtro de movimiento al seleccionar filtro de estado");
                context.commit("toggleMotionFilter"); // Esto lo desactiva
            }
            
            // Actualizar el estado de filtrado
            const isFiltering = value !== 'all' || 
                              context.state.applyFilters.stateFilter !== 'all' ||
                              context.state.applyFilters.motionFilter ||
                              context.state.applyFilters.combinedStatusFilter !== 'all';
                              
            console.log("Setting isFiltering state after status filter:", isFiltering);
            context.dispatch("setFiltering", isFiltering, { root: true });
            
            context.dispatch("refreshDevices");
        },
        setStateFilter(context, value) {
            console.log("Setting state filter to:", value);
            context.commit("setStateFilter", value);
            
            // Actualizar el estado de filtrado
            const isFiltering = value !== 'all' || 
                              context.state.applyFilters.statusFilter !== 'all' ||
                              context.state.applyFilters.motionFilter ||
                              context.state.applyFilters.combinedStatusFilter !== 'all';
                              
            console.log("Setting isFiltering state after state filter:", isFiltering);
            context.dispatch("setFiltering", isFiltering, { root: true });
            
            context.dispatch("refreshDevices");
        },
        setCombinedStatusFilter(context, value) {
            console.log("Setting combined status filter to:", value);
            context.commit("setCombinedStatusFilter", value);
            
            // Depending on the combined filter, we may need to set other filters
            switch(value) {
                case 'online':
                    context.commit("setStatusFilter", 'online');
                    if (context.state.applyFilters.motionFilter) {
                        context.commit("toggleMotionFilter");
                    }
                    break;
                case 'offline':
                    context.commit("setStatusFilter", 'offline');
                    if (context.state.applyFilters.motionFilter) {
                        context.commit("toggleMotionFilter");
                    }
                    break;
                case 'unknown':
                    context.commit("setStatusFilter", 'unknown');
                    if (context.state.applyFilters.motionFilter) {
                        context.commit("toggleMotionFilter");
                    }
                    break;
                case 'moving':
                    context.commit("setStatusFilter", 'all');
                    // Make sure motionFilter is true
                    if (!context.state.applyFilters.motionFilter) {
                        context.commit("toggleMotionFilter");
                    }
                    break;
                case 'stopped':
                    // Implement stopped filter logic (devices that are online but not moving)
                    context.commit("setStatusFilter", 'online');
                    // Make sure motionFilter is false
                    if (context.state.applyFilters.motionFilter) {
                        context.commit("toggleMotionFilter");
                    }
                    break;
                case 'all':
                default:
                    context.commit("setStatusFilter", 'all');
                    // Make sure motionFilter is false
                    if (context.state.applyFilters.motionFilter) {
                        context.commit("toggleMotionFilter");
                    }
                    break;
            }
            
            // Calcular si estamos filtrando para asegurar que el CSS se aplique correctamente
            const isFiltering = value !== 'all' || 
                              context.state.applyFilters.stateFilter !== 'all' ||
                              context.state.applyFilters.motionFilter ||
                              context.state.applyFilters.statusFilter !== 'all' ||
                              context.state.applyFilters.advancedFilter.type !== 'none';
                              
            console.log("Setting isFiltering state after combined filter:", isFiltering);
            context.dispatch("setFiltering", isFiltering, { root: true });
            
            // Actualizar la visualización de dispositivos
            context.dispatch("refreshDevices");
        },
        
        setAdvancedFilter(context, payload) {
            console.log("Setting advanced filter:", payload);
            
            // Ahora permitimos que los filtros avanzados coexistan con todos los demás filtros
            // No reseteamos ningún filtro para permitir combinaciones
            
            context.commit("setAdvancedFilter", payload);
            
            // Calcular si estamos filtrando
            const isFiltering = payload.type !== 'none' || 
                              context.state.applyFilters.combinedStatusFilter !== 'all' ||
                              context.state.applyFilters.stateFilter !== 'all' ||
                              context.state.applyFilters.motionFilter ||
                              context.state.applyFilters.statusFilter !== 'all';
                              
            console.log("Setting isFiltering state after advanced filter:", isFiltering);
            context.dispatch("setFiltering", isFiltering, { root: true });
            
            // Actualizar la visualización de dispositivos
            context.dispatch("refreshDevices");
        },
        
        // Nueva acción para filtrar por marca de GPS
        setGpsBrandFilter(context, brand) {
            if (brand) {
                context.dispatch("setAdvancedFilter", {type: 'gps_brand', value: brand});
            } else {
                context.dispatch("setAdvancedFilter", {type: 'none', value: null});
            }
        },
        
        // Nueva acción para filtrar por modelo de GPS
        setGpsModelFilter(context, model) {
            if (model) {
                context.dispatch("setAdvancedFilter", {type: 'gps_model', value: model});
            } else {
                context.dispatch("setAdvancedFilter", {type: 'none', value: null});
            }
        },
        
        // Nueva acción para filtrar por tecnología
        setTechnologyFilter(context, tech) {
            if (tech) {
                context.dispatch("setAdvancedFilter", {type: 'technology', value: tech});
            } else {
                context.dispatch("setAdvancedFilter", {type: 'none', value: null});
            }
        },
        toggleMotionFilter(context) {
            console.log("Toggling motion filter");
            context.commit("toggleMotionFilter");
            
            // Si se activa el filtro de movimiento, desactivar filtro de estado
            if (context.state.applyFilters.motionFilter && context.state.applyFilters.statusFilter !== 'all') {
                console.log("Desactivando filtro de estado al activar filtro de movimiento");
                context.commit("setStatusFilter", 'all');
            }
            
            // Actualizar el estado de filtrado después del toggle
            setTimeout(() => {
                const isFiltering = context.state.applyFilters.motionFilter || 
                                  context.state.applyFilters.stateFilter !== 'all' ||
                                  context.state.applyFilters.statusFilter !== 'all' ||
                                  context.state.applyFilters.combinedStatusFilter !== 'all';
                                  
                console.log("Setting isFiltering state after motion filter toggle:", isFiltering);
                context.dispatch("setFiltering", isFiltering, { root: true });
                
                context.dispatch("refreshDevices");
            }, 0);
        },
        setTrail(context, value) {
            context.commit("setTrail", value);
        },
        toggleStreet(context) {
            context.commit("toggleStreet")
        },
        // eslint-disable-next-line no-unused-vars
        connectWs(context) {
            const traccar = window.$traccar;

            traccar.on('open', () => {
                //console.log("WS OPEN")
            })
            traccar.on('close', () => {
                window.setTimeout(() => {
                    traccar.startWS();
                }, 5000);
            })
            traccar.on('message', (m) => {
                if (m.positions) {
                    m.positions.forEach((p) => {
                        context.commit("updatePosition", p);
                    });
                    //context.commit("updatePositions",m.positions);
                }

                if (m.devices) {
                    // eslint-disable-next-line no-unused-vars
                    m.devices.forEach((d) => {
                        // Verificar si el dispositivo perdió conductor antes de actualizar
                        const currentDevice = context.state.deviceList[d.id];
                        const hadDriver = currentDevice && currentDevice.attributes && currentDevice.attributes.qrDriverId;
                        const hasDriver = d.attributes && d.attributes.qrDriverId;
                        
                        context.commit("updateDevice", d)

                        // Se o dispositivo tinha um condutor e não tem mais, verificar sessão imediatamente
                        if (hadDriver && !hasDriver) {
                            console.log("🚨 Dispositivo perdeu condutor - verificando sessão imediatamente");
                            setTimeout(() => {
                                context.dispatch("checkSession", null, { root: true });
                            }, 100);
                        }

                        setTimeout(() => {
                            context.dispatch("refreshOneDevice", d.id);
                        }, 500);
                    })
                }

                // ADICIONAR SUPORTE PARA USUÁRIOS NO WEBSOCKET
                if (m.users) {
                    m.users.forEach((u) => {
                        context.commit("users/updateUser", u, { root: true });
                        // Se é o usuário atual, atualizar auth
                        if (context.rootState.auth && context.rootState.auth.id === u.id) {
                            console.log("🔄 Atualizando usuário autenticado via WebSocket");
                            context.commit("setAuth", u, { root: true });
                        }
                    });
                }

                if (m.events) {
                    context.dispatch("events/proccessNotifications", m.events, { root: true });
                }
            })

            traccar.startWS();
        },
        waitForDevice() {
            return new Promise((resolve) => {
                const checkDevice = () => {
                    if (window.addDevice) {
                        resolve();
                    } else {
                        setTimeout(checkDevice, 1000);
                    }
                }

                checkDevice();
            });
        },
        load(context, waitDevice = true) {
            return new Promise((resolve) => {

                if (waitDevice) {

                    context.dispatch("waitForDevice").then(() => {

                        window.loadModels().then(() => {

                            const traccar = window.$traccar;
                            traccar.getDevices().then(({ data }) => {
                                data.forEach((d) => {

                                    if (!(d.uniqueId.split("-").length == 3 && d.uniqueId.split("-")[0] === "deleted")) {
                                        context.commit("addDevice", d);
                                    }

                                })

                                resolve();
                            })
                        });
                    });
                } else {
                    const traccar = window.$traccar;
                    traccar.getDevices().then(({ data }) => {
                        data.forEach((d) => {

                            if (!(d.uniqueId.split("-").length == 3 && d.uniqueId.split("-")[0] === "deleted")) {
                                context.commit("addDevice", d);
                            }

                        })

                        resolve();
                    })

                }
            });
        },
        delete(context, params) {
            return new Promise((resolve, reject) => {
                const traccar = window.$traccar;
                traccar.deleteDevice(params).then(({ data }) => {
                    context.commit("removeDevice", params);
                    resolve(data);
                }).catch((err) => {
                    console.log(err);
                    reject();
                })

            });


        },
        save(context, params) {
            return new Promise((resolve, reject) => {
                const traccar = window.$traccar;

                if (params.id) {
                    // Atualizar dispositivo existente
                    traccar.updateDevice(params.id, params).then(({ data }) => {
                        context.commit("updateDevice", data);
                        resolve(data);
                        // Atualizar o estado visual dos dispositivos
                        context.dispatch("refreshDevices");
                    }).catch((err) => {
                        console.error("Erro ao atualizar dispositivo:", err);
                        reject(err);
                    })
                } else {
                    // Criar novo dispositivo
                    traccar.createDevice(params).then(({ data }) => {
                        // Adicionar o novo dispositivo
                        context.commit("addDevice", data);
                        
                        // Forçar atualização da lista de dispositivos no componente
                        setTimeout(() => {
                            // Usar setTimeout para garantir que o estado seja atualizado primeiro
                            context.dispatch("refreshDevices");
                        }, 100);
                        
                        resolve(data);
                    }).catch((err) => {
                        console.error("Erro ao criar dispositivo:", err);
                        reject(err);
                    })
                }
            });
        },
        accumulators(context, params) {
            return new Promise((resolve, reject) => {
                const traccar = window.$traccar;


                if (params.deviceId) {
                    traccar.updateAccumulators(params.deviceId, params).then(({ data }) => {
                        // Actualizar la posición local con los nuevos valores de accumulators
                        const currentPosition = context.state.positionsList[params.deviceId];
                        if (currentPosition && currentPosition.attributes) {
                            // Actualizar totalDistance si se proporcionó
                            if (params.totalDistance !== undefined) {
                                currentPosition.attributes.totalDistance = params.totalDistance;
                            }
                            // Actualizar hours si se proporcionó
                            if (params.hours !== undefined) {
                                currentPosition.attributes.hours = params.hours;
                            }
                            // Commit la posición actualizada
                            context.commit("updatePosition", currentPosition);
                        }
                        resolve(data);
                    }).catch((err) => {
                        reject(err);
                    })
                }
            });
        },
        /* eslint-disable no-unused-vars */
        positions(context) {
            return new Promise((resolve) => {
                const traccar = window.$traccar;
                traccar.getPositions().then(({ data }) => {
                    context.commit("setPositions", data);

                    if (data.length > 0) {
                        let tmp = [];
                        for (var p in data) {
                            tmp.push([data[p].latitude, data[p].longitude]);
                        }

                        setTimeout(() => {
                            const waitForMap = () => {
                                return new Promise((resolve) => {
                                    const checkMap = () => {
                                        if (window.$map) {
                                            resolve();
                                        } else {
                                            setTimeout(checkMap, 500);
                                        }
                                    };
                                    checkMap();
                                });
                            };

                            const centerMap = async () => {
                                // Esperar a que Leaflet esté disponible
                                const waitForL = () => {
                                    return new Promise((resolve) => {
                                        const checkLeaflet = () => {
                                            if (window.L) {
                                                resolve();
                                            } else {
                                                setTimeout(checkLeaflet, 500);
                                            }
                                        };
                                        checkLeaflet();
                                    });
                                };

                                await waitForL();
                                await waitForMap();

                                try {
                                    // Verificar configuración del usuario
                                    const userLat = parseFloat(context.rootState.auth?.latitude);
                                    const userLng = parseFloat(context.rootState.auth?.longitude);
                                    const userZoom = parseInt(context.rootState.auth?.zoom) || false;

                                    // Verificar configuración del servidor
                                    const serverLat = parseFloat(context.rootState.server?.serverInfo?.latitude);
                                    const serverLng = parseFloat(context.rootState.server?.serverInfo?.longitude);
                                    const serverZoom = parseInt(context.rootState.server?.serverInfo?.zoom) || 17;

                                    // Definir zoom predeterminado
                                    const defaultZoom = 17;

                                    // Validar coordenadas (dentro de rangos válidos para un mapa)
                                    const isValidLat = (lat) => !isNaN(lat) && lat !== 0 && lat >= -90 && lat <= 90;
                                    const isValidLng = (lng) => !isNaN(lng) && lng !== 0 && lng >= -180 && lng <= 180;

                                    // Verificamos si el usuario tiene coordenadas válidas
                                    if (isValidLat(userLat) && isValidLng(userLng)) {
                                        // Centramos el mapa en las coordenadas del usuario con zoom del usuario o predeterminado
                                        const zoom = userZoom || serverZoom || defaultZoom;
                                        console.log("Centrando en coordenadas del usuario", userLat, userLng, zoom);
                                        window.$map.setView([userLat, userLng], zoom);
                                    }
                                    // Verificamos si hay coordenadas en los atributos del servidor
                                    else if (isValidLat(serverLat) && isValidLng(serverLng)) {
                                        // Centramos el mapa en las coordenadas del servidor
                                        console.log("Centrando en coordenadas del servidor", serverLat, serverLng, serverZoom);
                                        window.$map.setView([serverLat, serverLng], serverZoom);
                                    }
                                    // Si no hay coordenadas válidas, centramos en los dispositivos
                                    else if (tmp && tmp.length > 0) {
                                        // Centramos el mapa según la cantidad de dispositivos
                                        console.log("Centrando en los dispositivos");
                                        const bds = window.L.latLngBounds(tmp);
                                        window.$map.fitBounds(bds, { maxZoom: serverZoom || defaultZoom });
                                    } else {
                                        // Si no hay nada para centrar, usamos coordenadas por defecto
                                        console.log("Usando coordenadas por defecto");
                                        window.$map.setView([0, 0], defaultZoom);
                                    }
                                } catch (error) {
                                    console.error("Error al centrar el mapa:", error);
                                }
                            };

                            // Ejecutar la función de centrado
                            centerMap();
                        }, 500);
                    }

                    resolve();
                });
            });
        }


    }
}
