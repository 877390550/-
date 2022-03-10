import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from  './store'
import less from 'less'
import WebIM from './utils/WebIM'
import {Switch,MessageBox} from 'element-ui'
Vue.component(Switch.name, Switch)
Vue.component(MessageBox.name, MessageBox);
Vue.prototype.$msgbox = MessageBox;
Vue.use(less)
Vue.config.productionTip = false

window.Vue =new Vue({
  router,
  store,
  WebIM,
  render: h => h(App),
}).$mount('#app')

