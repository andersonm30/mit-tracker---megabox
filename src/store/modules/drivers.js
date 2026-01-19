export default {
    namespaced: true,
    state: () => ({
        driverList: [],
        imageUpdateTimestamp: {} // { driverId: timestamp }
    }),
    getters: {
        getDriver(state){
            return (id)=>{
                return state.driverList.find((u)=> u.id === id)
            }
        },
        getDriverByUniqueId(state){
            return (uniqueId)=>{
                const found = state.driverList.find((u)=> u.uniqueId === uniqueId);
                
                // 🔍 TELEMETRIA: Log para rastrear lookups de driver
                if (process.env.NODE_ENV === 'development' || window.DEBUG_DRIVER_LOOKUP) {
                    console.log('[drivers/getDriverByUniqueId]', {
                        uniqueId,
                        found: found ? { id: found.id, name: found.name, uniqueId: found.uniqueId } : null,
                        totalDrivers: state.driverList.length,
                        timestamp: new Date().toISOString()
                    });
                }
                
                return found;
            }
        },
        getDriverImageUrl(state){
            return (driverId) => {
                if (driverId === null || driverId === undefined) return '';
                const baseUrl = `/tarkan/assets/images/drivers/${driverId}.png`;
                const timestamp = state.imageUpdateTimestamp[driverId];
                return timestamp ? `${baseUrl}?t=${timestamp}` : baseUrl;
            }
        }
    },
    mutations: {
        setDrivers(state,value){
            state.driverList = value;
        },
        deleteDriver(state,value){
            state.driverList.splice(state.driverList.findIndex((u)=> u.id === value),1)
        },
        updateDrivers(state,value){
            const user = state.driverList.find((d)=>{
                return d.id === value.id;
            })

            Object.assign(user,value);

        },
        addDrivers(state,value){
            state.driverList.push(value);
        },
        setImageUpdateTimestamp(state, { driverId, timestamp }) {
            state.imageUpdateTimestamp = {
                ...state.imageUpdateTimestamp,
                [driverId]: timestamp || Date.now()
            };
        },
        clearImageTimestamp(state, driverId) {
            const { [driverId]: _, ...rest } = state.imageUpdateTimestamp;
            state.imageUpdateTimestamp = rest;
        }
    },
    actions: {
        async load(context){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            const {data} = await api.getDrivers();
            context.commit("setDrivers", data);
        },
        async save(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            console.log(params);
            
            if (params.id) {
                const {data} = await api.updateDriver(params.id, params);
                context.commit("updateDrivers",data);
                return data;
            } else {
                const {data} = await api.createDriver(params);
                context.commit("addDrivers",data);
                return data;
            }
        },
        async deleteDriver(context,params){
            // Normalize params to always be id (number)
            const id = typeof params === 'object' ? (params.id ?? params.driverId) : params;
            
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            await api.deleteDriver(id);
            context.commit("deleteDriver", id);
            // Limpar timestamp da imagem ao deletar motorista
            context.commit("clearImageTimestamp", id);
        }
    }
}
