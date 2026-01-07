

export default {
    namespaced: true,
    state: () => ({
        attributesList: []
    }),
    getters: {
    },
    mutations: {
        setAttributes(state,value){
            state.attributesList = value;
        },
        addAttribute(state,value){
            state.attributesList.push(value);
        },
        updateAttribute(state,value){
            state.attributesList.splice(state.attributesList.findIndex((a)=> a.id === value.id),1,value)
        },
        removeAttribute(state,value){
            state.attributesList.splice(state.attributesList.findIndex((a)=> a.id === value),1)
        }
    },
    actions: {
        async load(context){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            const {data} = await api.getComputedAttributes();
            context.commit("setAttributes", data);
        },
        async delete(context,params){
            if(params>0){
                const { getRuntimeApi } = await import('@/services/runtimeApiRef');
                const api = getRuntimeApi();
                const {data} = await api.deleteComputedAttribute(params);
                context.commit("removeAttribute", params);
                return data;
            }
            throw new Error('ID inválido');
        },
        async save(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            
            if(params.id>0){
                const {data} = await api.updateComputedAttribute(params.id,params);
                context.commit("updateAttribute", data);
                return data;
            } else {
                const {data} = await api.createComputedAttribute(params);
                context.commit("addAttribute", data);
                return data;
            }
        }
    }
}
