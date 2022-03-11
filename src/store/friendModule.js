import Vue from 'vue';
import WebIM from '../utils/WebIM'
const FriendModule = {
	state: {
		friendRequest: [],
		blackList: {}
	},
	mutations: {
		changeFriendRequestState(state, data){
			state.friendRequest.unshift(data);
		},
		updateBlackList(state, blackList){
			state.blackList = blackList;
		}
	},
	actions: {
		handlerequest(context,payload){
			var data={
				id:'',
				name:'',
				head:'',
				greet:'',
				added:false,
			};
			const{from,status}=payload;
			data.id=from;
			console.log('from',from)
			data.greet=status?status:"请求添加你为朋友";
			WebIM.conn.fetchUserInfoById(from).then(res=>{
				data.name=res.data[from].nickname||from;
				data.head=res.data[from].avatarurl;
			})
			context.state.friendRequest.forEach((item,index)=>{
				if(item.id===from){
					context.state.friendRequest.splice(index,1);
				}
			})
			context.commit('changeFriendRequestState',data);
		},
		addfriend(context, payload){
			const { id,message } = payload;
			// WebIM.conn.subscribe({
			// 	to: id,
			// 	message:message
			// });
			WebIM.conn.addContact(id,message);
			console.log('发送了好友请求',id,message);
		},

		// 接受好友请求
		acceptSubscribe(context, payload){
			// WebIM.conn.subscribed({
			// 	to: payload,
			// 	message: "[resp:true]"
			// });
			WebIM.conn.acceptInvitation(payload);
			context.state.friendRequest.forEach((item,index)=>{
				if(item.id===payload){
					context.state.friendRequest.splice(index,1)
				}
			})
		},

		// 添加黑名单-单人
		onAddBlack(context, payload){
			let addName = payload.userId.name;
			WebIM.conn.addToBlackList({
				name: addName,
			});
			Vue.$store.dispatch("onGetContactUserList", { type: "addBlack", addName });
		},
		// 获取黑名单
		onGetfriendBlack(context, payload){
			WebIM.conn.getBlacklist();
		},

		// 移除黑名单
		onRemoveBlack(context, payload){
			let blackName = payload.removeName;
			WebIM.conn.removeFromBlackList({
				name: blackName,
				success(){
					console.log("Remove from black list success.");
				},
				error(){
					console.log("Remove from black list error.");
				}
			});
		},

		// 删除好友
		onDeltefriend(context, payload){
			let deleteName = payload.userId.name;
			let option = {
				to: deleteName,
				success(){  // 删除成功
					WebIM.conn.unsubscribed({
						to: deleteName
					});
					console.log("删除好友成功");
				},
				error(){    // 删除失败
				}
			}
			payload.callback();
			Vue.$router.push("/contact");
			WebIM.conn.removeRoster(option);
		}
	},
	getters: {
		getfriendrequest(state){
			return state.friendRequest
		}
	}

};
export default FriendModule;
