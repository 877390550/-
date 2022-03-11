import Noti from './interactive'
import WebIM from '../utils/WebIM'
const Login={
    state:{
        isSignup:false,
        username:'',
        userDetail:{}
    },
    mutations:{
        SETUSERNAME(state,username){
            state.username=username;
        },
        SETSIGNUPFLAG(state,flag){
            state.isSignup=flag;
        },
        SETUSERDETAIL(state,user_datail){
            state.userDetail=user_datail;
        }
    },
    actions:{
        onLogin(context,payload){
            context.commit('SETUSERNAME',payload.username);
            const options={
                user:payload.username,
                pwd:payload.password,
                appKey:WebIM.config.appKey,
                apiUrl:WebIM.config.restServer
            }
            WebIM.conn.open(options);
            localStorage.setItem("userInfo", JSON.stringify({ userId: payload.username, password: payload.password }));
        },
        onLogout(context) {
			context.commit("SETUSERNAME", "");
			localStorage.setItem("userInfo", "");
			WebIM.conn.close();
		},
        onRegister(context,payload){
            const options={
                username: payload.username,
				password: payload.password,
                nickname: payload.nickname,
                appKey:WebIM.config.appKey,
                success(){
                    Noti({
                        title:'注册消息',
                        message:'注册成功，将跳转到登录页面...',
                        position:'bottom-right',
                        type:'success'
                    });
                    sessionStorage.setItem('nickname',options.nickname);
                    console.log('注册存储',sessionStorage.getItem('nickname'))
                    context.commit('SETSIGNUPFLAG',false);
                },
                error(err){
                    if (JSON.parse(err.data).error == "duplicate_unique_property_exists") {
						Noti({message:"用户已存在！",type:'error',position:'bottom-right'})
					} else if (JSON.parse(err.data).error == "illegal_argument") {
						if (JSON.parse(err.data).error_description === 'USERNAME_TOO_LONG') {
						return Noti({message:'用户名超过64个字节！',type:'error',position:'bottom-right'})
                        }
                        Noti({message:'用户名不合法！',type:'error',position:'bottom-right'})
					} else if (JSON.parse(err.data).error == "unauthorized") {
                        Noti({message:'注册失败，无权限！',type:'error',position:'bottom-right'})
                        
					} else if (JSON.parse(err.data).error == "resource_limited") {
                        Noti({message:'用户达到上限',type:'error',position:'bottom-right'})

					}
                }
            };
            WebIM.conn.registerUser(options);

        },
        getLoginUserInfo(context,payload){
            const{userId}=payload;
            WebIM.conn.fetchUserInfoById(userId).then((res)=>{
                // 这里做了修改
                // let user_detail=res.data[userId];
                // res.data[userId]&&context.commit('SETUSERDETAIL',user_detail)
                res.data[userId]&&context.commit('SETUSERDETAIL',res.data[userId])
                console.log('res.data',res.data);
            })
        },
        updateOwnUserInfo({commit},payload){
			const {infoValue,type} = payload;
			WebIM.conn.updateOwnUserInfo(type,infoValue).then((res) => {
				res.data &&commit('SETUSERDETAIL',res.data)
			})
		},
    }
}

export default Login