import Vue from 'vue';
import Vuex from 'vuex';
import login from './login';
import agora from './agora';
import emedia from './emedia';
import friendModule from './friendModule';
import chat from './chat'
Vue.use(Vuex);
const store=new Vuex.Store({
    modules:{
        login,
        agora,
        emedia,
        friendModule,
        chat
    }
});
export default store;