// 该文件与sotre无关，用来配置不同客户端的交互
import Vue from 'vue'
import { Notification,MessageBox } from 'element-ui';

Vue.component(Notification.name, Notification)
Vue.component(MessageBox.name, MessageBox)

function Noti({
    title,message,type,position
}){
    if(document.body.clientWidth>=870){
        Notification({
            title:title,message:message,type:type,position:position
        })
    }
    else{
        MessageBox({
            title:title,message:message,type:type
        })
    }
}

export default Noti