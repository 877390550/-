import Vue from 'vue'
import Router from 'vue-router'
import login from '../pages/login'
import chat from '../pages/chat'
import message from '../pages/messageshow/'
import test from '../pages/test'


Vue.use(Router)
export default new Router({
    routes:[
        {
            path:'',
            redirect:'/login'
        },
        {
            path:'/',
            redirect:'/login'
        },
        {
            path:'/signup',
            redirect:'/login'
        },
        {
            path:'/login',
            name:'login',
            component:login
        },
        {
            path:'/chat',
            name:'contact',
            component:chat,
            children:[
                {
                    path:'message/:id',
                    name:'message',
                    component:message
                },
            ]
        },
 
        {
            path:'/test',
            name:'test',
            component:test
        }
    ]

})