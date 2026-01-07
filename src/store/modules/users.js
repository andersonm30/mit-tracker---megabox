

export default {
    namespaced: true,
    state: () => ({
        userList: []
    }),
    getters: {
        getUser(state){
            return (id)=>{
                return state.userList.find((u)=> u.id === id)
            }
        },
        getUsers(state){
            return state.userList.filter((u)=>{
                if(u.attributes['isShared'] && u.attributes['isShared']!==null){
                    return false;
                }else{
                    return true;
                }
            })
        }
    },
    mutations: {
        setUsers(state,value){
            state.userList = value;
        },
        deleteUser(state,value){
            state.userList.splice(state.userList.findIndex((u)=> u.id === value),1)
        },
        updateUser(state,value){
            const user = state.userList.find((d)=>{
                return d.id === value.id;
            })

            if(user) {
                Object.assign(user, value);
            }

        },
        addUser(state,value){
            state.userList.push(value);
        }
    },
    actions: {
        async load(context){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            const {data} = await api.getUsers();
            context.commit("setUsers", data);
        },
        async save(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            
            console.log(params);
            if (params.id) {
                const {data} = await api.updateUser(params.id, params);
                context.commit("updateUser",data);
                if(context.rootState.auth.id === data.id){
                    context.commit("setAuth",data,{root: true});
                }
                return data;
            } else {
                const {data} = await api.createUser(params);
                context.commit("addUser",data);
                return data;
            }
        },
        async deleteUser(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            await api.deleteUser(params);
            context.commit("deleteUser", params);
        }
    }
}
