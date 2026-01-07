

export default {
    namespaced: true,
    state: () => ({
        commandList: []
    }),
    getters: {
    },
    mutations: {
        setCommands(state,value){
            state.commandList = value;
        },
        addCommand(state,value){
            state.commandList.push(value);
        },
        updateCommand(state,value){
            state.commandList.splice(state.commandList.findIndex((c)=> c.id === value.id),1,value)
        }        ,
        removeCommand(state,value){
            state.commandList.splice(state.commandList.findIndex((c)=> c.id === value),1)
        }

    },
    actions: {
        async load(context){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            const {data} = await api.getSavedCommands();
            context.commit("setCommands", data);
        },
        async delete(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            const {data} = await api.deleteSavedCommand(params);
            context.commit("removeCommand", data);
            return data;
        },
        async save(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            
            if(params.id>0){
                const {data} = await api.updateSavedCommand(params.id,params);
                context.commit("updateCommand", data);
                return data;
            } else {
                const {data} = await api.createSavedCommand(params);
                context.commit("addCommand", data);
                return data;
            }
        }
    }
}
