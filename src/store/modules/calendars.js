

export default {
    namespaced: true,
    state: () => ({
        calendarList: []
    }),
    getters: {
        getCalendarById(state){
            return (id)=>{
                return state.calendarList.find((u)=> u.id === id)
            }
        }
    },
    mutations: {
        setCalendars(state,value){
            state.calendarList = value;
        },
        deleteCalendar(state,value){
            state.calendarList.splice(state.calendarList.findIndex((u)=> u.id === value),1)
        },
        updateCalendar(state,value){
            const user = state.calendarList.find((d)=>{
                return d.id === value.id;
            })

            Object.assign(user,value);

        },
        addCalendar(state,value){
            state.calendarList.push(value);
        }
    },
    actions: {
        async load(context){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            const {data} = await api.getCalendars();
            context.commit("setCalendars", data);
        },
        async save(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            console.log(params);
            
            if (params.id) {
                const {data} = await api.updateCalendar(params.id, params);
                context.commit("updateCalendar",data);
                return data;
            } else {
                const {data} = await api.createCalendar(params);
                context.commit("addCalendar",data);
                return data;
            }
        },
        async deleteCalendar(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            await api.deleteCalendar(params);
            context.commit("deletecalendar", params);
        }
    }
}
