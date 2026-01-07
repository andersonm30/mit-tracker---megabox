export default {
    namespaced: true,
    state: () => ({
        fenceList: [],
        mapEditing: 0,
        mapPointEditing: 0,
        mapPointEditingType: 'linestring',
        mapPointEditingParams: []
    }),
    getters: {
        isEditing(state){
          return state.mapEditing!==0;
        },
        fenceList(state){
            return state.fenceList.filter((f)=>{
                return f.attributes && !f.attributes['isAnchor'];
            });
        },
        anchorList(state){
            return state.fenceList.filter((f)=>{
                return f.attributes && f.attributes['isAnchor'];
            });
        },
        isAnchored(state){
            return (deviceId)=>{

                return state.fenceList.find((f)=> f.attributes && f.attributes['isAnchor'] && f.attributes['deviceId'] && parseInt(f.attributes.deviceId) === deviceId);
            }
        },
        getGeofenceByAttribute(state){
            return (att,value)=>{

                return state.fenceList.find((f)=> f.attributes[att] && f.attributes[att] === value);
            }
        },
        getGeofenceById(state){
          return (id)=>{
              return state.fenceList.find((f)=> f.id === id);
          }
        },
        getLatLngs(state){
          return state.mapPointEditingParams;
        },
        getTotalArea(state){
            if(state.mapPointEditingParams.length===0 && state.mapPointEditingType!=='CIRCLE'){
                return 'Área Não Definida';
            }else if(state.mapPointEditingType==='CIRCLE'){
                
                 return ((Math.PI * state.mapPointEditingParams[2] * state.mapPointEditingParams[2])/1000).toFixed(2) + 'km²'
            }
            return state.mapPointEditingParams.length+' pontos';
        },
        getCirclePosition(state){
            if(state.mapPointEditingParams.length===3) {
                return window.L.latLng(state.mapPointEditingParams[0], state.mapPointEditingParams[1]);
            }

            return false;
        }
    },
    mutations: {
        setGeofences(state,value){
            state.fenceList = value;
        },
        addGeofence(state,value){
            state.fenceList.push(value);
        },
        updateGeofence(state,value){



            state.fenceList.splice(state.fenceList.findIndex((f)=> f.id === value.id),1,JSON.parse(JSON.stringify(value)));
        },
        removeGeofence(state,value){
            state.fenceList.splice(state.fenceList.findIndex((f)=> f.id === value),1);
        },

        resetEditing(state){
            state.mapEditing = 0;
            state.mapPointEditingParams = [];
            state.mapPointeditingType = 'linestring';
        },
        enableEditing(state,value){
            state.mapEditing = 1;
            state.mapPointEditing = 1;
            state.mapPointEditingType = value;
        },
        disableEditing(state){
            state.mapEditing = 0;
        },
        setParams(state,value){
            state.mapPointEditingParams = value;
        },
        addParams(state,value){
            state.mapPointEditingParams.push(value);
        },
        setEditingState(state,value){
            state.mapPointEditing = value;
        }
    },
    actions: {
        async load(context){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            const {data} = await api.getGeofences();
            context.commit("setGeofences", data);
        },
        async delete(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            const {data} = await api.deleteGeofence(params);
            context.commit("removeGeofence", params);
            context.commit("resetEditing");
            return data;
        },
        async save(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            
            if (params.id > 0) {
                const {data} = await api.updateGeofence(params.id, params);
                context.commit("updateGeofence", data);
                context.commit("resetEditing");
                return data;
            } else {
                const {data} = await api.createGeofence(params);
                context.commit("addGeofence", data);
                context.commit("resetEditing");
                return data;
            }
        },
        enableEditing(context,params){
            context.commit("enableEditing",params);
        },
        disableEditing(context){
            console.log("disble editing");

            context.commit("disableEditing");
        },
        setupCircle(context,params){
            context.commit("setParams",params);
            context.commit("setEditingState",2);
        },
        completeCircle(context){
            context.commit("setEditingState",3);
        },
        setCircleRadius(context,params){
            let tmp = context.state.mapPointEditingParams;
                tmp[2] = params;
            context.commit("setParams",tmp);
        },
        setupLine(context,params){
            context.commit("addParams",params);
        },
        setupPolygon(context,params){
            context.commit("addParams",params);
        }
    }
}
