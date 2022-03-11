import WebIM from '../utils/WebIM'

const Chat = {
    state: {
        userList: {
            contactUserList: [],
            groupUserList: [],
            chatroomUserList: []
        },
        msgList: {
            contact: {},
            group: {},
            chatroom: {},
        },
        currentMsgs: [],

        noticeCallMsg: {}
    },
    mutations: {
        initChatState(state) {
			state.userList = {
				contactUserList: [],
				groupUserList: [],
				chatroomUserList: []
			}

			state.msgList = {
				contact: {},
				group: {},
				chatroom: {},
			}

			state.currentMsgs = []
		},
        UPDATEUSERLIST(state, payload) {
            const { userList, type } = payload;
            state.userList[type] = userList;
        },
        UPDATEMSGLIST(state, payload) {
            const { chatType, chatId, msg, bySelf, type, id } = payload;
            // 获得的消息为漫游历史消息，判断筛选出已存在msgList中的消息，这些消息不再添加进msgList
            if (payload.isHistory) {
                // 拿到该key已经存在的消息
                let nowKeyMsg = state.msgList[chatType][chatId];
                // 筛选，如果payload.mid不等于item.id，说明该消息不在msgList中
                let newHistoryMsg = nowKeyMsg && nowKeyMsg.filter(item => {
                    return item.mid !== payload.mid;
                })
                state.msgList[chatType][chatId] = newHistoryMsg;
            }
            const { params } = window.Vue.$route;
            let status = 'unread';
            if (params.id == payload.from) {
                status = 'read';
            }
            if (!state.msgList[chatType][chatId]) {
                state.msgList[chatType][chatId] = [{
                    msg,
                    bySelf,
                    type: type || '',
                    mid: id,
                    status,
                    ...payload
                }]
            }
            else {
                state.msgList[chatType][chatId].push({
                    msg,
                    bySelf,
                    type: type || '',
                    mid: id,
                    status,
                    ...payload
                });
                state.msgList[chatType][chatId] = state.msgList[chatType][chatId].sort((a, b) => {
                    return a.time - b.time;
                })
            }
            state.msgList = Object.assign({}, state.msgList);
        },
        UPDATECURRENTMSGLIST(state, messages) {
            state.currentMsgs = messages;
        },
        UPDATEMESSAGEMID(stete, message) {
            const { id, mid } = message;
            const { name } = window.Vue.$route;
            Object.keys(window.Vue.$store.state.msgList[name]).forEach((user) => {
                if (window.Vue.$store.state.msgList[name][user].length) {
                    stete.msgList[name][user].forEach((msg) => {
                        if (msg.id == id) {
                            msg.mid = mid;
                        }
                    });
                }
            });
        },
        UPDATEMESSAGESTATUS(state, message) {
            const { id, mid, action, readUser } = message;
            const { name } = window.Vue.$route;
            Object.keys(state.msgList[name]).forEach((user) => {
                if (action == "oneUserReadMsgs") {
                    if (state.msgList[name][readUser]) {
                        state.msgList[name][readUser].forEach((msg) => {
                            if (msg.status != "recall") {
                                msg.status = "read";
                            }
                        });
                    }
                }
                else if (state.msgList[name][user].length) {
                    state.msgList[name][user].forEach((msg) => {
                        if (action === "readMsgs" && !msg.bySelf) {
                            if (msg.status != "recall") {
                                msg.status = "read";
                            }
                        }
                        else if (msg.mid == id || msg.mid == mid) {
                            msg.status = message.status;
                            if (message.msg) {
                                msg.msg = message.msg;
                            }
                        }
                    });
                }
            });
        },
        NOTICECALL(state, payload) {
            state.noticeCallMsg = payload;
        },
    },
    actions: {
        onGetCurrentChatObjMsg(context, payload) {
            const { id, type } = payload;
            context.commit("UPDATECURRENTMSGLIST", context.state.msgList[type][id]);
        },
        onGetContactUserList(context, payload) {
            try {
                WebIM.conn.getRoster({
                    success: function (roster) {
                        const userList = roster.filter(user => ["both", "to"].includes(user.subscription));
                        const userInfoList = []
                        userList && userList.forEach(item => { return userInfoList.push(item.name) })
                        userInfoList && WebIM.conn.fetchUserInfoById(userInfoList).then((res) => {
                            let data = res.data;
                            userList.forEach((item, idx) => { return userList[idx].friendDetail = data[item.name] })
                            context.commit("UPDATEUSERLIST", {
                                userList,
                                type: "contactUserList",
                            });
                        })
                    }
                });
            }
            catch (e) {
                console.log("error", e);
            }
        },
        onSendText: function (context, payload) {
            const { chatType, chatId, message } = payload;
            // 生成本地消息id
            const id = WebIM.conn.getUniqueId();
            const time = +new Date();
            const chatroom = chatType === "chatroom";
            const type = chatType === "contact" ? "singleChat" : "groupChat";
            const msgObj = new WebIM.message("txt", id);
            msgObj.set({
                msg: message,
                to: chatId,
                chatType: type,
                roomType: chatroom,
                success: function () {
                    context.commit("UPDATEMSGLIST", {
                        chatType,
                        chatId: chatId,
                        msg: message,
                        bySelf: true,
                        time: time,
                        mid: id,
                        status: "sending"
                    });
                },
                fail: function (e) {
                    console.log("Send private text error", e);
                }
            });
            if (chatType === "group" || chatType === "chatroom") {
                msgObj.setGroup("groupchat");
            }
            WebIM.conn.send(msgObj.body);
        },
        sendImgMessage: function (context, payload) {
            const { chatType, chatId, roomType, file, callback } = payload;
            const id = WebIM.conn.getUniqueId();
            const msgObj = new WebIM.message("img", id);
            msgObj.set({
                file: file,
                to: chatId,
                chatType: chatType,
                roomType: roomType,
                onFileUploadError: function (error) {
                    console.log("图片上传失败", error);
                    callback();
                },
                onFileUploadComplete: function (data) {
                    console.log('data',data);
                    let url = data.uri + "/" + data.entities[0].uuid;
                    context.commit("UPDATEMSGLIST", {
                        msg: url,
                        chatType,
                        chatId: chatId,
                        bySelf: true,
                        type: "img",
                        time: data.timestamp,
                        mid: id,
                        status: "sending"
                    });
                    callback();
                },
                success: function () {
                    console.log("图片发送成功");
                }
            });
            if (chatType === "group" || chatType === "chatroom") {
                msgObj.setGroup("groupchat");
            }
            WebIM.conn.send(msgObj.body);
        },
        sendVideoMessage: function (context, payload) {
            const { chatType, chatId, roomType, file, callback } = payload;
            const id = WebIM.conn.getUniqueId();
            const msgObj = new WebIM.message("video", id);
            msgObj.set({
                file: file,
                to: chatId,
                chatType: chatType,
                roomType: roomType,
                onFileUploadError: function (error) {
                    console.log("视频上传失败", error);
                    callback();
                },
                onFileUploadComplete: function (data) {
                    console.log('data',data);
                    let url = data.uri + "/" + data.entities[0].uuid;
                    context.commit("UPDATEMSGLIST", {
                        msg: url,
                        chatType,
                        chatId: chatId,
                        bySelf: true,
                        type: "video",
                        time: data.timestamp,
                        mid: id,
                        status: "sending"
                    });
                    callback();
                },
                success: function () {
                    console.log("视频发送成功");
                }
            });
            if (chatType === "group" || chatType === "chatroom") {
                msgObj.setGroup("groupchat");
            }
            WebIM.conn.send(msgObj.body);
        },
        sendFileMessage: function (context, payload) {
            const { chatType, chatId, roomType, file, callback } = payload;
            const id = WebIM.conn.getUniqueId();
            const msgObj = new WebIM.message("file", id);
            msgObj.set({
                file: file,
                ext: {
                    file_length: file.data.size
                },
                to: chatId,
                chatType: chatType,
                roomType: roomType,
                onFileUploadError: function (error) {
                    console.log("文件上传失败", error);
                    callback();
                },
                onFileUploadComplete: function (data) {
                    let url = data.uri + "/" + data.entities[0].uuid;
                    context.commit("UPDATEMSGLIST", {
                        msg: url,
                        chatType,
                        chatId: chatId,
                        bySelf: true,
                        type: "file",
                        filename: file.data.name,
                        file_length: file.data.size,
                        time: data.timestamp,
                        mid: id,
                        status: "sending"
                    });
                    callback();
                },
                success: function () {
                    console.log("文件发送成功");
                }
            });
            if (chatType === "group" || chatType === "chatroom") {
                msgObj.setGroup("groupchat");
            }
            WebIM.conn.send(msgObj.body);
        },
        sendRecorder: function (context, payload) {
            const { useId, type, file,duration } = payload;
            const id = WebIM.conn.getUniqueId();
            const msgObj = new WebIM.message("audio", id);
            let isRoom = type == "chatroom" || type == "groupchat";
            msgObj.set({
                file: file,
                to: useId,
                type: "audio",
                roomType: isRoom,
                ext:{
                    duration
                },
                onFileUploadError: function (error) {
                    console.log("语音上传失败", error);
                },
                onFileUploadComplete: function (data) {
                    console.log("上传成功", data);
                    let url = data.uri + "/" + data.entities[0].uuid;
                    context.commit("UPDATEMSGLIST", {
                        msg: url,
                        chatType: type,
                        chatId: useId,
                        bySelf: true,
                        type: "audio",
                        filename: file.data.name,
                        file_length: file.data.size,
                        time: data.timestamp,
                        mid: id,
                        status: "sending",
                        duration
                    });
                },
                success: function (data) {
                    console.log("语音发送成功", data);
                },
                flashUpload: WebIM.flashUpload
            });

            if (type === "group" || type === "chatroom") {
                msgObj.setGroup("groupchat");
            }
            WebIM.conn.send(msgObj.body);
        },



        onCallVideo: function (context, payload) {
            const { chatType, to } = payload;
            const type = chatType === "contact" ? "singleChat" : "groupChat";
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            if (chatType === "contact") {
                // this.setState({
                //     showWebRTC: true
                // })
                WebIM.call.caller = userInfo.userId;
                WebIM.call.makeVideoCall(to, null, payload.rec, payload.recMerge);
            }
        },
        onCallVoice(payload) {
            const { chatType, to } = payload;
            const type = chatType === "contact" ? "singleChat" : "groupChat";
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            if (chatType === "contact") {
                WebIM.call.caller = userInfo.userId;
                WebIM.call.makeVoiceCall(to, null, payload.rec, payload.recMerge);
            }
        },

        getHistoryMessage: function (context, payload) {
            console.log('getHistoryMessage')
            const options = {
                queue: payload.name,
                isGroup: payload.isGroup,
                count: 30, // 每次获取消息条数
                success: function (msgs) {
                    try {
                        payload.success && payload.success(msgs);
                        if (msgs.length) {
                            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
                            const userId = userInfo && userInfo.userId;
                            msgs.forEach((item) => {
                                let time = Number(item.time);
                                let msg = {};
                                const bySelf = item.from == userId;
                                if (!item.filename) {
                                    msg = {
                                        chatType: payload.isGroup ? "group" : "contact",
                                        chatId: bySelf ? item.to : item.from,
                                        msg: item.data,
                                        bySelf: bySelf,
                                        time: time,
                                        mid: item.id,
                                        status: "read"
                                    };
                                    if (payload.isGroup) {
                                        msg.chatId = item.to;
                                    }
                                    else {
                                        msg.chatId = bySelf ? item.to : item.from;
                                    }
                                }
                                else if (!item.ext.file_length && item.filename !== "audio" && item.filename.substring(item.filename.length - 3) !== "mp4") { // 为图片的情况
                                    msg = {
                                        msg: item.url,
                                        chatType: payload.isGroup ? "group" : "contact",
                                        chatId: bySelf ? item.to : item.from,
                                        bySelf: bySelf,
                                        type: "img",
                                        time: time,
                                        mid: item.id,
                                        status: "read"
                                    };
                                    if (payload.isGroup) {
                                        msg.chatId = item.to;
                                    }
                                    else {
                                        msg.chatId = bySelf ? item.to : item.from;
                                    }
                                }
                                else if (item.filename === "audio") {
                                    console.log(item,'历史消息audio')
                                    msg = {
                                        msg: item.url,
                                        chatType: payload.isGroup ? "group" : "contact",
                                        chatId: bySelf ? item.to : item.from,
                                        bySelf: bySelf,
                                        type: "audio",
                                        time: time,
                                        mid: item.id,
                                        status: "read",
                                        duration:item.ext.duration
                                    };
                                    if (payload.isGroup) {
                                        msg.chatId = item.to;
                                    }
                                    else {
                                        msg.chatId = bySelf ? item.to : item.from;
                                    }
                                }
                                else if (item.filename.substring(item.filename.length - 3) === "mp4") {
                                    msg = {
                                        msg: item.url,
                                        chatType: payload.isGroup ? "group" : "contact",
                                        chatId: bySelf ? item.to : item.from,
                                        bySelf: bySelf,
                                        type: "video",
                                        time:time
                                    };
                                    if (payload.isGroup) {
                                        msg.chatId = item.to;
                                    }
                                    else {
                                        msg.chatId = bySelf ? item.to : item.from;
                                    }
                                }
                                else {
                                    msg = {
                                        msg: item.url,
                                        chatType: payload.isGroup ? "group" : "contact",
                                        chatId: bySelf ? item.to : item.from,
                                        bySelf: bySelf,
                                        type: "file",
                                        filename: item.filename,
                                        file_length: item.file_length,
                                        time: time,
                                        mid: item.id,
                                        status: "read"
                                    };
                                    if (payload.isGroup) {
                                        msg.chatId = item.to;
                                    }
                                    else {
                                        msg.chatId = bySelf ? item.to : item.from;
                                    }
                                }
                                msg.isHistory = true;
                                context.commit("UPDATEMSGLIST", msg);
                            });
                            context.commit("UPDATEMESSAGESTATUS", { action: "readMsgs" });
                        }
                    }
                    catch (e) {
                        console.log("error", e);
                    }
                },
                fail: function () { }
            };
            WebIM.conn.fetchHistoryMessages(options);
        },

        recallMessage: function (context, payload) {
            const { chatType, mid } = payload.message;
            const to = payload.to;
            const me = this;
            const chatTypeObj = {
                contact: "chat",
                group: "groupchat",
                chatroom: "chatroom"
            };
            const option = {
                mid,
                to,
                type: chatTypeObj[chatType],
                success: function () {
                    payload.message.status = "recall";
                    payload.message.msg = "消息已撤回";
                    window.Vue.$store.commit("UPDATEMESSAGESTATUS", payload.message);
                },
                fail: function () {
                    // me.$message('消息撤回失败');
                },
            };
            WebIM.conn.recallMessage(option);
        },
        initChatState(context) {
            context.commit("initChatState")
        }
    },
    getters: {
        onGetContactUserList(state) {
            return state.userList.contactUserList;
        },
        onGetGroupUserList(state) {
            return state.userList.groupUserList;
        },
        onGetChatroomUserList(state) {
            return state.userList.chatroomUserList;
        },
        onGetCurrentChatObjMsg(state) {
            return state.currentMsgs;
        },
        fetchHistoryMessages(state) {
            return state.currentMsgs;
        }
    }
}

export default Chat;
