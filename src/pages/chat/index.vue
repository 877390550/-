<template>
  <div class="layout">
      <router-view v-if="broken"/>
      <List
        :type="activeKey"
        ref="list"
      />
    <div class="message" v-if="!broken">
      <router-view/>
    </div>
  </div>
</template>

<script>
const rtc = WebIM.rtc;
import List from "../../components/chat/List.vue";
import { mapActions } from "vuex";
import WebIM from "../../utils/WebIM";
export default {
  data() {
    return {
      activedType: {
        contact: "",
        group: "",
        chatroom: "",
      },
      groupRead: false,
      contactRead: false,
      showSettingOptions: false,
      activeKey: "contact",
      selectedItem: "",
      showAddOptions: false,
      nowIsVideo: false,
      collapsed: false,
      current: ["contact"],
      nowClickID: "",
      showAlert: false,
    };
  },
  computed: {
    broken(){
      if(document.body.offsetWidth<570){
        return true;
      }else{
        return false
      }
    },
    chatList() {
      return this.$store.state.chat.msgList;
    },
    onSetCallStatus() {
      return this.$store.state.agora.callStatus;
    },
    //显隐主叫弹窗
    showCall() {
      const { confr, callStatus } = this.$store.state.agora;
      let bool =
        [1, 3, 5, 6, 7].includes(callStatus) &&
        typeof confr.type == "number" &&
        confr.type < 2
          ? true
          : false;
      return bool;
    },
    showConfr() {
      const { confr, callStatus } = this.$store.state.agora;
      return confr.type === 2 && [0, 3, 5, 6, 7].includes(callStatus)
        ? true
        : false;
    },
  },
  watch: {
    onSetCallStatus(msg) {
      let self = this;
      console.log("触发对msg》》", this.$store.state.agora);
      const { confr, callStatus, minisize } = this.$store.state.agora;
      console.log(
        "confr>>",
        confr,
        "callStatus>>",
        callStatus,
        "minisize>>",
        minisize
      );
      const status = {
        idle: 0,
        confirmRing: 3,
        answerCall: 5,
        receivedAnswerCall: 6,
        confirmCallee: 7,
      };

      self.$data.showAlert = callStatus == 4 ? true : false; // 显隐被叫弹窗

      if (callStatus === 3) {
        return self.$refs.call && self.$refs.call.join(); // 单人
      }
      if (callStatus === 7) {
        return self.$refs.multiCall && self.$refs.multiCall.join();
      }
    },
  },
  methods: {
    ...mapActions([
      "initChatState",
      "updateConfr",
      "setCallStatus",
      "hangup",
      "cancelCall",
    ]),
    test(){
      console.log(document.body.offsetWidth);
    },
    changeIsVideoState(v) {
      v ? (this.$data.nowIsVideo = true) : (this.$data.nowIsVideo = false);
    },

    EmediaModalFun(tos, callType) {
      // callType: 0 1v1音频, 1 1v1视频, 2 多人
      this.invite(tos, callType, this.$data.activeKey);
    },

    invite(tos, callType, selectTab) {
      // // callType: 0 1v1音频, 1 1v1视频, 2 多人
      console.log("tos", tos, "callType", callType, "selectTab", selectTab);
      console.log("tasdjahskjdhwkjasd>>", this.$route.params.id);
      const callId = WebIM.conn.getUniqueId().toString();
      const channelName = Math.uuid(8);
      const { callStatus } = this.$store.state.agora;
      switch (callType) {
        case 0:
          if (selectTab === "contact") {
            let id = WebIM.conn.getUniqueId();
            let msg = new WebIM.message("txt", id);
            let set_options = {
              msg: "邀请您进行语音通话",
              to: tos[0],
              chatType: "singleChat",
              ext: {
                action: "invite",
                channelName: channelName,
                type: 0, //0为1v1音频，1为1v1视频，2为多人通话
                callerDevId: WebIM.conn.context.jid.clientResource, // 主叫方设备Id
                callId: callId, // 随机uuid，每次呼叫都不同，代表一次呼叫
                ts: Date.now(),
                msgType: "rtcCallWithAgora",
                callerIMName: WebIM.conn.context.jid.name,
              },
            };
            msg.set(set_options);
            WebIM.conn.send(msg.body);

            this.updateConfr({
              ext: {
                channelName: channelName,
                token: null,
                type: 0,
                callerDevId: WebIM.conn.context.jid.clientResource,
                callId: callId,
              },
              to: tos[0],
              callerIMName: WebIM.conn.context.jid.name,
              calleeIMName: tos[0],
            });
            const inviteStatus = 1;
            this.setCallStatus(inviteStatus);
          }
          break;
        case 1:
          if (callStatus > 0) {
            console.log("正在通话中");
          }
          if (selectTab === "contact") {
            let id = WebIM.conn.getUniqueId();
            let msg = new WebIM.message("txt", id);

            let set_options = {
              msg: "邀请您进行视频通话",
              to: tos[0],
              chatType: "singleChat",
              ext: {
                action: "invite",
                channelName: channelName,
                type: 1, //0为1v1音频，1为1v1视频，2为多人通话
                callerDevId: WebIM.conn.context.jid.clientResource, // 主叫方设备Id
                callId: callId, // 随机uuid，每次呼叫都不同，代表一次呼叫
                ts: Date.now(),
                msgType: "rtcCallWithAgora",
              },
            };
            msg.set(set_options);
            WebIM.conn.send(msg.body);

            this.updateConfr({
              ext: {
                channelName: channelName,
                type: 1,
                callerDevId: WebIM.conn.context.jid.clientResource,
                callId: callId,
              },
              to: tos[0],
              callerIMName: WebIM.conn.context.jid.name,
              calleeIMName: tos[0],
            });
            const inviteStatus = 1;
            this.setCallStatus(inviteStatus);
          }
          var inviteStatus = 1;
          this.setCallStatus(inviteStatus);
          var to = tos[0];
          rtc.timer = setTimeout(() => {
            if (selectTab === "contact") {
              this.cancelCall(to);
              this.hangup();
            } else {
              // 多人不做超时
            }
          }, 30000);
          break;
        case 2:
          console.log("this.$refs.multiCall>>", this.$refs.multiCall);
          break;
        default:
          break;
      }
    },
  },
  components: {
    List,
  },
};
</script>

<style lang="less">
@import url("./index.less");
</style>
<style scoped>
@import url("./iconfont/iconfont.css");
</style>
