import websdk from 'easemob-websdk'
import config from './WebIMConfig'
import Noti from '../store/interactive'
import AgoraRTC from "agora-rtc-sdk-ng"

const CALLSTATUS = {
	idle: 0,
	inviting: 1,
	alerting: 2,
	confirmRing: 3, // caller
	receivedConfirmRing: 4, // callee
	answerCall: 5,
	receivedAnswerCall: 6,
	confirmCallee: 7
}

function ack(message) {
	var bodyId = message.id; // 需要发送已读回执的消息id
	var msg = new WebIM.message("read", WebIM.conn.getUniqueId());
	msg.set({
		id: bodyId,
		to: message.from
	});
	WebIM.conn.send(msg.body);
}
const rtc = {
	// 用来放置本地客户端。
	client: null,
	// 用来放置本地音视频频轨道对象。
	localAudioTrack: null,
	localVideoTrack: null,
};

// 初始化sdk
let WebIM = {};
WebIM = window.WebIM = websdk;
WebIM.config = config;
let conn = WebIM.conn = new WebIM.connection({
	appKey: WebIM.config.appKey,
	isHttpDNS: WebIM.config.isHttpDNS,
	isMultiLoginSessions: WebIM.config.isMultiLoginSessions,
	https: WebIM.config.https,
	url: WebIM.config.socketServer,
	apiUrl: WebIM.config.restServer,
	isAutoLogin: WebIM.config.isAutoLogin,
	autoReconnectNumMax: WebIM.config.autoReconnectNumMax,
	autoReconnectInterval: WebIM.config.autoReconnectInterval,
	delivery: WebIM.config.delivery,
	useOwnUploadFun: WebIM.config.useOwnUploadFun
})
// 添加回调函数
conn.listen({
	// 注册或登录成功跳转聊天界面，连接成功回调
	onOpened() {
		console.log('连接成功')
		const username = window.Vue.$store.state.login.username || localStorage.getItem("userInfo") && JSON.parse(localStorage.getItem("userInfo")).userId;
		window.Vue.$store.dispatch('getLoginUserInfo', { userId: username })
		window.Vue.$router.push('/chat')
	},
	// 连接关闭回调
	onClosed() {
		window.Vue.$router.push('/login');
	},
	onTextMessage(message) {
		console.log('onTextMessage', message);
		const { from, to, type, time } = message;
		const chatId = type !== "chat" ? to : from;
		const typeMap = {
			chat: "contact",
			groupchat: "group",
			chatroom: "chatroom"
		};
		window.Vue.$store.commit("UPDATEMSGLIST", {
			chatType: typeMap[message.type],
			chatId: chatId,
			msg: message.data,
			bySelf: false,
			from: message.from,
			mid: message.id,
			time: time
		});

		window.Vue.$store.commit('NOTICECALL', message)// 通知给通话组件，是否别人邀请通话

		type === 'chat' && ack(message);
		if (message.ext && message.ext.action === 'invite') {
			console.log('收到邀请消息', message)
			const { callerDevId, callId } = message.ext
			let callVideo = window.Vue.$store.getters.getAgora;
			message.calleeIMName = message.to
			message.callerIMName = message.from
			if (message.from == WebIM.conn.context.jid.name) {
				return // 自己在另一端发出的邀请
			}
			if (callVideo.callStatus > CALLSTATUS.idle) { // 正忙
				if (message.ext.callId == callVideo.callId) { // 多人会议中邀请别人
					window.Vue.$store.dispatch('sendAlerting', { to: from, calleeDevId: callerDevId, callId })// 回复alerting消息
					window.Vue.$store.dispatch('setCallStatus', CALLSTATUS.alerting)// 更改为alerting状态
				} else {
					return window.Vue.$store.dispatch('answerCall', { result: 'busy', callId: message.ext.callId, callerDevId: message.ext.callerDevId, to: from })
				}
			}
			window.Vue.$store.dispatch('updateConfr', message)
			window.Vue.$store.dispatch('sendAlerting', { to: from, calleeDevId: callerDevId, callId })// 回复alerting消息
			window.Vue.$store.dispatch('setCallStatus', CALLSTATUS.alerting)// 更改为alerting状态


		}
	}, // 收到文本消息
	onPictureMessage(message) {
		const { from, to, type, time } = message;
		const chatId = type !== "chat" ? to : from;
		const typeMap = {
			chat: "contact",
			groupchat: "group",
			chatroom: "chatroom"
		};
		window.Vue.$store.commit("UPDATEMSGLIST", {
			chatType: typeMap[message.type],
			chatId: chatId,
			msg: message.url,
			bySelf: false,
			type: "img",
			from: message.from,
			time: time
		});
		type === 'chat' && ack(message);
	}, // 收到图片消息
	onCmdMessage(msg) {
		console.log('onCmdMessage', msg)
		if (msg.action === "rtcCall") {
			console.log('tes11');
			if (msg.from === WebIM.conn.context.jid.name) {
				console.log('进来了');
				return // 多端情况， 另一端自己发的消息
			}
			let msgInfo = msg.ext
			let deviceId = '';

			let callerDevId = ''
			let callId = '';
			let callVideo = window.Vue.$store.getters.getAgora;
			switch (msgInfo.action) {
				case "alert":
					deviceId = msgInfo.calleeDevId
					callerDevId = msgInfo.callerDevId
					callId = msgInfo.callId

					console.log('收到回复的alert', msg)
					window.Vue.$store.dispatch('confirmRing', {
						msg, deviceId, callerDevId, callId,
					})
					break;
				case "confirmRing":
					console.log('收到confirmRing', msg)
					if (msgInfo.calleeDevId != WebIM.conn.context.jid.clientResource) {
						console.log('不是自己设备的confirmRing', msg)
						return // 多端情况另一端的消息
					}
					if (!msgInfo.status && callVideo.callStatus < CALLSTATUS.receivedConfirmRing) {
						console.warn('邀请已失效')
						window.Vue.$store.dispatch('hangup')
						window.Vue.$store.dispatch('setCallStatus', CALLSTATUS.idle)
						return
					}
					deviceId = msgInfo.calleeDevId
					window.Vue.$store.dispatch('setCallStatus', CALLSTATUS.receivedConfirmRing)
					console.log('清除定时器2')
					rtc.timer && clearTimeout(rtc.timer)
					break;
				case "answerCall":
					console.log('收到回复的answerCall', msg)
					console.log('清除定时器1')
					rtc.timer && clearTimeout(rtc.timer)
					deviceId = msgInfo.calleeDevId
					if (msgInfo.callerDevId != WebIM.conn.context.jid.clientResource) {
						console.log('不是自己设备的answerCall', msg)
						return // 多端情况另一端的消息
					}
					window.Vue.$store.dispatch('confirmCallee', { to: msg.from, calleeDevId: deviceId, result: msgInfo.result })
					if (msgInfo.result !== 'accept') {
						if (msgInfo.result === 'busy') {
							Noti({
								type: "error",
								message: '对方正忙'
							});
						} else if (msgInfo.result === 'refuse') {
							Noti({
								type: "error",
								message: '对方已拒绝'
							});
						}

						if (callVideo.confr.type !== 2) { // 单人情况挂断，多人不挂断
							window.Vue.$store.dispatch('hangup')
							window.Vue.$store.dispatch('setCallStatus', CALLSTATUS.idle)
						}
					}
					break;
				case "confirmCallee":
					console.log('收到confirmCallee', msg)
					if (msgInfo.calleeDevId != WebIM.conn.context.jid.clientResource) {
						if (msg.to == WebIM.conn.context.jid.name) {
							window.Vue.$store.dispatch('hangup')
							window.Vue.$store.dispatch('setCallStatus', CALLSTATUS.idle)
							return Noti({
								type: "error",
								message: '已在其他设备处理'
							});
						}
						return
					}

					if (msg.ext.result != 'accept' && callVideo.callStatus != 7) {
						// 不在通话中收到 busy refuse时挂断
						window.Vue.$store.dispatch('hangup')
						window.Vue.$store.dispatch('setCallStatus', CALLSTATUS.idle)
						return
					}
					window.Vue.$store.dispatch('setCallStatus', CALLSTATUS.confirmCallee)
					break;
				case "cancelCall":
					console.log('收到cancelCall', msg)
					if (msg.from == WebIM.conn.context.jid.name) {
						return // 多端情况另一端的消息
					}
					if (msg.from == callVideo.confr.callerIMName) {
						window.Vue.$store.dispatch('hangup')
						window.Vue.$store.dispatch('setCallStatus', CALLSTATUS.idle)
					}
					break;
				default:
					console.log('unexpected action')
					break;
			}
		}
	},
	// 收到命令消息
	onAudioMessage(message) {
		console.log('音频',message)
		const typeMap = {
			chat: "contact",
			groupchat: "group",
			chatroom: "chatroom"
		};
		const chatId = message.type !== "chat" ? message.to : message.from;
		let options = {
			url: message.url,
			headers: { Accept: "audio/mp3" },
			onFileDownloadComplete(response) {
				let objectUrl = WebIM.utils.parseDownloadResponse.call(WebIM.conn, response);
				window.Vue.$store.commit("UPDATEMSGLIST", {
					chatType: typeMap[message.type],
					chatId: chatId,
					msg: objectUrl,
					bySelf: false,
					type: "audio",
					from: message.from,
					time: message.time,
					duration:message.ext.duration
				});
			},
			onFileDownloadError: function () {
				console.log("音频下载失败");
			}
		};
		WebIM.utils.download.call(WebIM.conn, options);
		message.type === 'chat' && ack(message);
	}, // 收到音频消息
	onLocationMessage: function (message) {
		console.log("onLocationMessage", message);
		message.type === 'chat' && ack(message);
	}, // 收到位置消息
	onFileMessage: function (message) {
		const { from, to, type, time } = message;
		const chatId = type !== "chat" ? to : from;
		const typeMap = {
			chat: "contact",
			groupchat: "group",
			chatroom: "chatroom"
		};
		window.Vue.$store.commit("UPDATEMSGLIST", {
			chatType: typeMap[message.type],
			chatId: chatId,
			msg: message.url,
			bySelf: false,
			type: "file",
			filename: message.filename,
			file_length: message.file_length,
			from: message.from,
			time: time
		});
		type === 'chat' && ack(message);
	}, // 收到文件消息
	onVideoMessage: function (message) {
		console.log("onVideoMessage", message);
		const { from, to, type, time } = message;
		const chatId = type !== "chat" ? to : from;
		const typeMap = {
			chat: "contact",
			groupchat: "group",
			chatroom: "chatroom"
		};
		let options = {
			url: message.url,
			headers: {
				Accept: "video/mp4"
			},
			onFileDownloadComplete: function (response) {
				let objectURL = WebIM.utils.parseDownloadResponse.call(WebIM.conn, response);
				window.Vue.$store.commit("UPDATEMSGLIST", {
					chatType: typeMap[message.type],
					chatId: chatId,
					msg: objectURL,
					bySelf: false,
					type: "video",
					filename: message.filename,
					file_length: message.file_length,
					from: message.from,
					time: time
				});
			},
			onFileDownloadError: function () {
				console.log("视频下载失败");
			}
		};
		WebIM.utils.download.call(WebIM.conn, options);
		type === 'chat' && ack(message);
	}, // 收到视频消息
	onPresence(message) {
		console.log("onPresence", message);
		// let select_id = window.Vue.$store.state.group.groupInfo.gid; // 群组相关操作，更新数据时需要
		switch (message.type) {
			case "subscribe": 
				var options = {
					...message
				};
				window.Vue.$store.dispatch("handlerequest", options);
				break;
			case "subscribed":
				window.Vue.$store.dispatch("onGetContactUserList");
				Noti({
					type: "success",
					message: message.from + " " + "已同意添加好友"
				});
				break;
			case "unsubscribed":
				window.Vue.$store.dispatch("onGetContactUserList");
				// TODO
				if ("code" in message) {
					alert(message.from + " " + "请求被拒绝");
				}
				else {
					Noti({
						type: "success",
						message: message.from + " " + "不再是你的好友"
					});
				}
				break;

			case "direct_joined": // 被拉进群--不需要同意
				window.Vue.$store.dispatch("onGetGroupUserList")
				Noti({
					type: "success",
					message: `${message.from}邀请您加入群：${message.gid}`
				})
				break;
			case "invite": //收到邀请进群的通知
				
					var groupInviteOptions = {
						isShow: true,
						...message
					};
					window.Vue.$store.commit("updateGroupInviteNotifications", groupInviteOptions);
					break;
				
			case "joinGroupNotifications": // 收到申请进群的通知
				
					var groupOptions = {
						isShow: true,
						...message
					};
					window.Vue.$store.commit("updateGroupNotifications", groupOptions);
					break;
				
			case "memberJoinPublicGroupSuccess": // 成员加入聊天室成功回调
				// window.Vue.$store.dispatch("onGetGroupinfo", { select_id });
				Noti({
					type: "success",
					message: `${message.from}已加入群组`
				})
				break;
			case "joinPublicGroupSuccess":  //申请加入群组成功回调
				window.Vue.$store.dispatch("onGetGroupUserList");
				break;
			case "deleteGroupChat": // 解散群组
				window.Vue.$store.dispatch("onGetGroupUserList")
				Noti({
					type: "error",
					message: `${message.from}将群：${message.gid} 已解散`
				})
				break
			case "removedFromGroup": //移除
				window.Vue.$store.dispatch("onGetGroupUserList")
				Noti({
					type: "success",
					message: "已被" + message.from + "移除群：" + message.gid
				})
				break;
			case "leaveGroup":
				// window.Vue.$store.dispatch("onGetGroupinfo", { select_id });
				break;
			default:
				break;
		}
	}, // 处理“广播”或“发布-订阅”消息，如联系人订阅请求、处理群组、聊天室被踢解散等消息

	onRecallMessage: message => {
		console.log("撤回消息", message);
		message.status = "recall";
		message.msg = "对方撤回了一条消息";
		window.Vue.$store.commit("UPDATEMESSAGESTATUS", message);
	},
	onBlacklistUpdate: function (list) { // 黑名单变动
		// 查询黑名单，将好友拉黑，将好友从黑名单移除都会回调这个函数，list则是黑名单现有的所有好友信息
		// 更新好友黑名单
		console.log("黑名单变动", list);
		let blackList = list;
		window.Vue.$store.commit("updateBlackList", blackList);
	},
	onReceivedMessage: function (message) {
		console.log("onReceivedMessage", message);
		window.Vue.$store.commit("UPDATEMESSAGEMID", message);
		message.status = "sent";
		window.Vue.$store.commit("UPDATEMESSAGESTATUS", message);
	}, // 收到消息送达服务器回执


	onReadMessage: function (message) {
		console.log("onReadMessage", message);
		message.status = "read";
		window.Vue.$store.commit("UPDATEMESSAGESTATUS", message);
	}, // 收到消息已读回执

	onCreateGroup: function (message) {
		console.log("onCreateGroup", message);
		window.Vue.$store.dispatch("onGetGroupUserList");
	}, // 创建群组成功回执（需调用createGroupNew）
	onMutedMessage: function (message) {
		console.log("onMutedMessage", message);
	} // 如果用户在A群组被禁言，在A群发消息会走这个回调并且消息不会传递给群其它成员

})

WebIM.WebRTC = window.webrtc;
WebIM.EMedia = window.emedia;
WebIM.AgoraRTC = AgoraRTC;
WebIM.rtc = rtc;
export default WebIM
