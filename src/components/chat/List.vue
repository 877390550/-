<template>
  <div class="userlist">
    <div class="mine" v-show="showmine">
      <div class="info">
        <img :src="userDetail.avatarurl" alt="" class="head" />
        <img
          src="../../assets/back.svg"
          alt=""
          class="back"
          @click="onshowmine"
        />
        <div>
          <span class="username nickname">{{
            userDetail.nickname || userName
          }}</span>
          <span class="username id">{{ userName }}</span>
        </div>
      </div>
      <div class="fun">
        <div class="top">
          <div>
            <a href="#">
              <span class="iconfont icon-yejianmoshi"></span>
            </a>
            <span>夜间模式</span>
            <div class="switch">
              <el-switch
                v-model="value"
                active-color="#276899"
                inactive-color="#999999"
              >
              </el-switch>
            </div>
          </div>
          <div @click="toLogout">
            <a href="#">
              <span class="iconfont icon-tuichu"></span>
            </a>
            <span>退出登录</span>
            <div class="switch"></div>
          </div>
        </div>
        <div class="bottom"></div>
      </div>
    </div>
    <div class="header">
      <div></div>
      <a href="#" @click="onshowmine">
        <span class="iconfont icon-bars"></span>
      </a>
      <input
        type="text"
        placeholder="搜索"
        v-model="input"
        @keyup.enter="search"
      />
    </div>
    <!-- 输入框的清空按钮，为了不占据header的flex位置，写到input之外 -->
    <a
      href="#"
      class="close"
      v-show="input && !this.showmine"
      @click="(input = ''), (searchshow = false)"
    >
      <span class="iconfont icon-guanbi"></span>
    </a>
    <div class="friendrequesttitle" v-if="request.length !== 0">好友请求</div>
    <div class="request" v-for="item in request" :key="item.id">
      <img :src="item.head" alt="" />
      <div class="right">
        <span class="name">{{ item.name }}({{ item.id }})</span>
        <span>{{ item.greet }}</span>
      </div>
      <div
        :class="[{ added: item.added }, 'add']"
        @click.once="confirm(item.id), (item.added = true)"
      >
        <span>{{ item.added ? "已添加" : "通过" }}</span>
      </div>
    </div>
    <hr class="friendrequesthr" v-if="request.length !== 0" />

    <div class="search" v-if="searchshow">
      <div class="title">搜索结果</div>
      <div v-if="nores" class="nores">找不到该用户</div>
      <div class="bottom" :class="{ friend: friendflag }" v-if="!nores">
        <img :src="searchres.head" alt="" />
        <div class="right">
          <span class="name">{{ searchres.name }}</span>
          <span>{{
            selfflag
              ? "搜索自己干什么？"
              : friendflag
              ? "对方是你的好友"
              : "对方还不是你的好友"
          }}</span>
        </div>
        <div class="add" v-show="!selfflag && !friendflag">
          <Addfriend :id="id">
            <span class="iconfont icon-tianjiayonghu"></span>
            <span>添加</span>
          </Addfriend>
        </div>
      </div>
      <hr />
    </div>
    <div
      v-for="item in userList[type]"
      :key="item.name"
      class="chatlist"
      @click="select(item)"
    >
      <img :src="item.friendDetail.avatarurl" alt="" class="avatar" />
      <div class="content">
        <div class="top">
          <span class="name">{{
            item.friendDetail.nickname || item.name
          }}</span>
          <span class="time">{{ getLastMsg(item).msgTime }}</span>
        </div>
        <div class="bottom">
          <span class="msg">{{ getLastMsg(item).lastMsg }}</span>
          <div class="unreadNum" v-if="getUnreadNum(item) != 0">
            <span>&nbsp;{{ getUnreadNum(item) }}&nbsp;</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import WebIM from "../../utils/WebIM";
import Addfriend from "../addModal/addfriend.vue";

export default {
  components: { Addfriend },
  data() {
    return {
      userName: JSON.parse(localStorage.getItem("userInfo")).userId,
      id: "",
      nores: false,
      searchshow: false,
      selfflag: false,
      searchres: {
        name: "",
        head: "",
      },
      input: "",
      value: false,
      showmine: false,
      activedKey: {
        contact: "",
        group: "",
        chatroom: "",
      },
      message: "",
      isHttps: window.location.protocol === "https:",
    };
  },
  beforeMount() {
    this.onGetContactUserList();
  },
  updated() {
    this.scollBottom();
  },
  watch:{
    contact:function(){
       var idlist=[];
      this.userList[this.type].forEach(item=>{
        idlist.push(item.name);
      })
      idlist.forEach(item=>{
        if(this.$store.state.chat.msgList.contact[item]===undefined){
          this.getHistoryMessage({ name: item, isGroup: false})
        }
      })
    },
    msgList(){
      console.log(this.msgList)
    }
  },
  computed: {
    ...mapGetters({
      contact: "onGetContactUserList",
      group: "onGetGroupUserList",
      msgList: "onGetCurrentChatObjMsg",
    }),
    friendflag() {
      var flag = false;
      this.contact.forEach((item) => {
        if (this.id === item.name) {
          flag = true;
          return;
        }
      });
      return flag;
    },
    request(){
      return this.$store.state.friendModule.friendRequest
    },
    userList() {
      return {
        contact: this.contact,
      };
    },
    userDetail() {
      return this.$store.state.login.userDetail;
    },
    chatList() {
      return this.$store.state.chat.msgList;
    },
  },
  props: [
    "type", // 聊天类型 contact, group, chatroom
    "card",
  ],
  methods: {
    ...mapActions([
      "onLogout",
      "initChatState",
      "onGetContactUserList",
      "onGetCurrentChatObjMsg",
      "onSendText",
      "onCallVideo",
      "onCallVoice",
      "getHistoryMessage",
      "recallMessage",
      "onGetAllFriendsInfo",
      "acceptSubscribe",
    ]),
    confirm(id) {
      this.acceptSubscribe(id);
    },
    select(user) {
      this.onGetCurrentChatObjMsg({type:'contact',id:user.name})
      this.$router.push({
        name: "message",
        params: {
          id: user.name,
          nickname:user.friendDetail.nickname
        }
      });
    },
    search() {
      this.id = this.input;
      this.nores = false;
      this.selfflag = false;
      WebIM.conn.fetchUserInfoById(this.input).then((res) => {
        if (res.data[this.input].nickname == undefined) {
          this.nores = true;
          return;
        }
        if (this.input == JSON.parse(localStorage.getItem("userInfo")).userId) {
          this.selfflag = true;
        }
        this.searchshow = true;
        this.searchres.name =
          res.data[this.input].nickname || res.data[this.input];
        this.searchres.head = res.data[this.input].avatarurl;
      });
    },
    onshowmine() {
      this.showmine = !this.showmine;
    },
    toLogout() {
      this.onLogout();
      this.initChatState();
    },
    getUnreadNum(item) {
      const { name, params } = this.$route;
      const chatList = this.chatList[name];
      let userId = "";
      if (name == "contact") {
        userId = item.name;
      } else if (name == "group") {
        userId = item.groupid;
      } else {
        userId = item.id;
        return 0;
      }
      const currentMsgs = chatList[userId] || [];
      let unReadNum = 0;
      currentMsgs.forEach((msg) => {
        if (msg.status !== "read" && msg.status !== "recall" && !msg.bySelf) {
          unReadNum++;
        }
      });
      return unReadNum;
    },
    callVideo() {
      if (this.type == "contact") {
        this.$refs.emediaModal.showEmediaModal();
        this.$refs.emediaModal.showCallerWait(
          this.$data.activedKey[this.type].name
        );
        const videoSetting = JSON.parse(localStorage.getItem("videoSetting"));
        const recMerge = (videoSetting && videoSetting.recMerge) || false;
        const rec = (videoSetting && videoSetting.rec) || false;
        this.onCallVideo({
          chatType: this.type,
          to: this.$data.activedKey[this.type].name,
          rec,
          recMerge,
        });
      } else if (this.type == "group") {
        this.getGroupMembers(this.$data.activedKey[this.type].groupid);
        this.$refs.addAvMembertModal.show();
      }
    },
    callVoice() {
      this.$refs.emediaModal.showEmediaModal();
      this.$refs.emediaModal.showCallerWait(
        this.$data.activedKey[this.type].name
      );
      const videoSetting = JSON.parse(localStorage.getItem("videoSetting"));
      const recMerge = (videoSetting && videoSetting.recMerge) || false;
      const rec = (videoSetting && videoSetting.rec) || false;
      this.onCallVoice({
        chatType: this.type,
        to: this.$data.activedKey[this.type].name,
        rec,
        recMerge,
      });
    },
    readablizeBytes(value) {
      let s = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
      let e = Math.floor(Math.log(value) / Math.log(1024));
      return (value / Math.pow(1024, Math.floor(e))).toFixed(2) + " " + s[e];
    },
    renderTime(time) {
      let t = new Date(parseInt(time));
      //   let Y = t.getFullYear();
      let M =
        t.getMonth() + 1 < 10 ? "0" + (t.getMonth() + 1) : t.getMonth() + 1;
      let D = t.getDate() < 10 ? "0" + t.getDate() : t.getDate();
      let H = t.getHours() < 10 ? "0" + t.getHours() : t.getHours();
      let F = t.getMinutes() < 10 ? "0" + t.getMinutes() : t.getMinutes();
      //   let S = t.getSeconds() < 10 ? "0" + t.getSeconds() : t.getSeconds();
      return `${M}-${D} ${H}:${F}`;
    },
    getLastMsg(item) {
      // const { name, params } = this.$route;
      //因为改了路由的名字，导致后面报错了
      const name = "contact";
      const chatList = this.chatList[name];
      let userId = "";
      if (name == "contact") {
        userId = item.name;
      } else if (name == "group") {
        userId = item.groupid;
      } else {
        userId = item.id;
      }
      const currentMsgs = chatList[userId] || [];
      let lastMsg = "";
      let lastType =currentMsgs.length && currentMsgs[currentMsgs.length - 1].type;
      if (currentMsgs.length) {
        if (lastType === "img") {
          lastMsg = "[图片]";
        } else if (lastType === "file") {
          lastMsg = currentMsgs[currentMsgs.length - 1].filename;
        } else if (lastType === "audio") {
          lastMsg = "[语音]";
        } else if (lastType === "video") {
          lastMsg = "[视频]";
        } else {
          lastMsg = currentMsgs[currentMsgs.length - 1].msg;
        }
      }
      const msgTime = currentMsgs.length
        ? this.renderTime(currentMsgs[currentMsgs.length - 1].time)
        : "";

      return {
        lastMsg,
        msgTime,
      };
    },

    scollBottom() {
      setTimeout(() => {
        const dom = this.$refs.msgContent;
        if (!dom) return;
        dom.scrollTop = dom.scrollHeight;
      }, 0);
    },
    handleCommand(item) {
      let name = "";
      if (this.type === "contact") {
        name = this.$data.activedKey[this.type].name;
      } else if (this.type === "group") {
        name = this.$data.activedKey[this.type].groupid;
      } else if (this.type === "chatroom") {
        name = this.$data.activedKey[this.type].id;
      }
      this.recallMessage({
        to: name,
        message: item,
      });
    },
  },
};
</script>
<style lang="less">
@import url("./List.less");
</style>