

export default {
    namespaced: true,
    state: () => ({
        driverList: []
    }),
    getters: {
        getDriver(state){
            return (id)=>{
                return state.driverList.find((u)=> u.id === id)
            }
        },
        getDriverByUniqueId(state){
            return (id)=>{
                return state.driverList.find((u)=> u.uniqueId === id)
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
                context.commit("updateDriver",data);
                return data;
            } else {
                const {data} = await api.createDriver(params);
                context.commit("addDrivers",data);
                return data;
            }
        },
        async deleteDriver(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            await api.deleteDriver(params);
            context.commit("deleteDriver", params);
        }
    }
}
