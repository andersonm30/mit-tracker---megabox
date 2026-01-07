

export default {
    namespaced: true,
    state: () => ({
        groupList: []
    }),
    getters: {
        getGroupNameById(state){
            return (id)=>{
                const group = state.groupList.find((g)=> g.id === id);
                return (group)?group.name:'--';
            }
        },
        getGroup(state){
            return (id)=>{
                return state.groupList.find((g)=> g.id === id);
            }
        }
    },
    mutations: {
        setGroups(state,value){
            state.groupList = value;
        },
        removeGroup(state,value){
            state.groupList.splice(state.groupList.findIndex((a)=> a.id === value),1)
        },
        addGroup(state,value){
            state.groupList.push(value);
        },
        updateGroup(state,value){
            state.groupList.splice(state.groupList.findIndex((a)=> a.id === value.id),1,value)
        }
    },
    actions: {
        async load(context){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            const {data} = await api.getGroups();
            context.commit("setGroups", data);
        },
        async delete(context,params){
            if(params>0){
                const { getRuntimeApi } = await import('@/services/runtimeApiRef');
                const api = getRuntimeApi();
                const {data} = await api.deleteGroup(params);
                context.commit("removeGroup", params);
                return data;
            }
            throw new Error('ID inválido');
        },
        async save(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            
            if(params.id>0){
                const {data} = await api.updateGroup(params.id,params);
                context.commit("updateGroup", data);
                return data;
            } else {
                const {data} = await api.createGroup(params);
                context.commit("addGroup", data);
                return data;
            }

            })
        }
    }
}
