

export default {
    namespaced: true,
    state: () => ({
       list: []
    }),
    getters: {
        getMaintenanceById(state){
            return (id)=>{
                return state.list.find((g)=> g.id === id);
            }
        }
    },
    mutations: {
        set(state,value){
            state.list = value;
        },
        remove(state,value){
            state.list.splice(state.list.findIndex((a)=> a.id === value),1)
        },
        add(state,value){
            state.list.push(value);
        },
        update(state,value){
            state.list.splice(state.list.findIndex((a)=> a.id === value.id),1,value)
        }
    },
    actions: {
        async load(context){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            const {data} = await api.getMaintenance();
            context.commit("set", data);
        },
        async delete(context,params){
            if(params>0){
                const { getRuntimeApi } = await import('@/services/runtimeApiRef');
                const api = getRuntimeApi();
                const {data} = await api.deleteMaintenance(params);
                context.commit("remove", params);
                return data;
            }
            throw new Error('ID inválido');
        },
        async save(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            
            if(params.id>0){
                const {data} = await api.updateMaintenance(params.id,params);
                context.commit("update", data);
                return data;
            } else {
                const {data} = await api.createMaintenance(params);
                context.commit("add", data);
                return data;
            }
        }
    }
}
