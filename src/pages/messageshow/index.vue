<template>
  <div class="background" @click="emojishow = false">
    <div class="head">
      {{ $route.params.nickname }}
    </div>
    <div class="content" ref="msgContent">
      <div v-for="item in newArr" :key="item.mid" class="msgList">
        <div class="date" v-if="item.show_time">
          <span v-if="item.show_year">{{ renderTime(item.time).Y }}年 </span>
          <span v-if="item.show_time">{{ renderTime(item.time).date }}</span>
        </div>
        <div :class="{ right: item.bySelf, left: !item.bySelf }" class="themsg">
          <div class="text" v-if="item.type == ''">
            {{ item.msg }}&nbsp;&nbsp;
            <span class="time">{{ renderTime(item.time).time }}</span>
          </div>
          <div class="imgcontent" v-else-if="item.type == 'img'">
            <img :src="item.msg" class="img" />
            <span class="time"
              >&nbsp;{{ renderTime(item.time).time }}&nbsp;</span
            >
          </div>
          <div class="file" v-else-if="item.type === 'file'">
            <a :href="item.msg" :download="item.filename">
              <div class="img">
                <img src="../../../static/img/file-fill.png" alt="" />
              </div>
              <div class="incontent">
                <span class="filename">{{ item.filename }}</span>
                <span class="filesize">{{
                  readablizeBytes(item.file_length)
                }}</span>
              </div>
              <span class="time">{{ renderTime(item.time).time }}</span>
            </a>
          </div>
          <div class="video" v-else-if="item.type === 'video'">
            <video :src="item.msg" controls></video>
            <span class="time">{{ renderTime(item.time).time }}</span>
          </div>
          <div class="audio" v-else-if="item.type === 'audio'" @click.self="play($event)">
            <audio :src="item.msg"></audio>
            <div class="leftcontent">
              <svg
                t="1640184071063" class="icon"
                viewBox="0 0 1024 1024" version="1.1"
                xmlns="http://www.w3.org/2000/svg" p-id="2036" width="200" height="200"
              ><path d="M374.272 333.312v355.328c0 30.208 20.992 40.448 45.568 26.112l288.768-175.104c25.088-15.872 25.088-40.448 0-54.784L419.84 309.76c-7.68-5.12-14.336-6.656-20.992-6.656-14.336-2.56-24.576 9.216-24.576 30.208zM1024 512c0 282.624-229.376 512-512 512S0 794.624 0 512 229.376 0 512 0s512 229.376 512 512z" p-id="2037" fill="#69A3DC"
                ></path></svg>
            </div>
            <div class="rightcontent">
              <div class="progress">
                <div class="progress-bar"></div>
              </div>
              <div class="bottomcontent">
                <div class="duration" >
                  {{renderDuration(item.duration).M}}:{{renderDuration(item.duration).S}}
                </div> 
                <div class="time">
                  <span class="time">{{ renderTime(item.time).time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="bottom">
      <div class="file">
        <input
          type="file"
          style="display: none"
          ref="filebutton"
          @change="upload"
        />
        <span class="iconfont icon-huixingzhen" @click="fileclick"></span>
      </div>
      <div class="input" >
        <input v-show="!isRecording"
          type="text"
          value="input"
          v-model="input"
          @keyup.enter="sendTextMsg"
          ref="input"
          placeholder="输入要发送的内容"
        />
        <div class="isRecording" v-show="isRecording">
          {{renderRecordTimer.m}}:{{renderRecordTimer.s}},{{renderRecordTimer.ms}} &nbsp;&nbsp;&nbsp;左滑取消，松开发送
        </div>
      </div>
      <div class="emoji">
        <div class="emojicontent" v-show="emojishow">
          <span
            v-for="(item, index) in emoji"
            :key="item"
            @click.stop="selectemoji(index)"
          >
            {{ item }}
          </span>
        </div>
        <span class="iconfont icon-biaoqing" @click.stop="onshowemoji()"></span>
      </div>
      <div class="send">
        <span
          class="iconfont icon-xiangshangjiantouquan"
          v-if="input"
          @click="sendTextMsg"
        ></span>
        <span
          class="iconfont icon-yuyin2"
          v-else
          @touchstart="startRecord"
          @touchmove="touchmove"
          @touchend="stop"
        ></span>
      </div>
    </div>
  </div>
</template>

<script>
import * as RecordRTC from "recordrtc";
import { mapActions, mapGetters } from "vuex";
export default {
  data() {
    return {
      // ----语音----
      recordRTC: {},
      stream: {},
      src: "",
      isRecording:false,
      recordTime:0,
      timer:{},
      startX:0,
      moveX:0,
      blob:'',
      isCancel:false,
      // ----语音----
      input: "",
      emoji: [
        "😀",
        "😁",
        "😂",
        "🤣",
        "😃",
        "😄",
        "😅",
        "😆",
        "😉",
        "😊",
        "😋",
        "😎",
        "😍",
        "😘",
        "🥰",
        "😗",
        "😙",
        "🥲",
        "😚",
        "☺️",
        "🙂",
        "🤗",
        "🤩",
        "🤔",
        "🤨",
        "😐",
        "😑",
        "😶",
        "🙄",
        "😏",
        "😣",
        "😥",
        "😮",
        "🤐",
        "😯",
        "😪",
        "😫",
        "🥱",
        "😴",
        "😌",
        "😛",
        "😜",
        "😝",
        "🤤",
        "😒",
        "😓",
        "😔",
        "😕",
        "🙃",
        "🤑",
        "😲",
        "☹️",
        "🙁",
        "😖",
        "😞",
        "😟",
        "😤",
        "😢",
        "😭",
        "😦",
        "😧",
        "😨",
        "😩",
        "🤯",
        "😬",
        "😰",
        "😱",
        "🥵",
        "🥶",
        "😳",
        "🤪",
        "😵",
        "🥴",
        "😠",
        "😡",
        "🤬",
        "😷",
        "🤒",
        "🤕",
        "🤢",
        "🤮",
        "🤧",
        "😇",
        "🥳",
      ],
      emojishow: false,
    };
  },
  beforeMount() {
    this.judgeTime();
    this.authorize();
  },
  watch: {
    msgList: function () {
      this.judgeTime();
      setTimeout(() => {
        this.scrollBottom();
      }, 100);
    },
  },
  computed: {
    ...mapGetters({ msgList: "onGetCurrentChatObjMsg" }),
    newArr() {
      return this.judgeTime();
    },
    renderRecordTimer(){
      return{
        m:parseInt(this.recordTime/600),
        s:this.recordTime/10>10?parseInt(this.recordTime/10):"0"+parseInt(this.recordTime/10),
        ms:this.recordTime,
      }
    }
  },
  methods: {
    ...mapActions([
      "onSendText",
      "sendImgMessage",
      "sendFileMessage",
      "sendRecorder",
      "sendVideoMessage",
    ]),
    authorize() {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(
        (stream) => {
          this.recoder = new MediaRecorder(stream);
          console.log("授权成功");
        },
        () => {
          console.log("授权失败");
        }
      );
    },
    play(e) {
      var currenttime = 0;
      if (e.target.childNodes[0].paused) {
        e.target.childNodes[0].currenttime = currenttime;
        e.target.childNodes[0].play();
      } else {
        e.target.childNodes[0].pause();
        currenttime = e.target.childNodes[0].currenttime;
      }
    },
    cancel(){
      let recordRTC = this.recordRTC;
      recordRTC.stopRecording(() => {
        var track = this.stream.getTracks()[0];
        track.stop();
        this.isRecording=false;
        clearInterval(this.timer)
        this.recordTime=0;
        this.blob = recordRTC.getBlob();
      })
    },
    touchmove(e){
      if(this.startX-e.touches[0].clientX>50){
        this.cancel();
        this.isCancel=true;
      }
    },
    startRecord(e) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          let recordRTC = RecordRTC(stream, {
            type: "audio",
            recorderType: RecordRTC.StereoAudioRecorder,
            disableLogs: true,
          });
          this.isCancel=false;
          this.startX=e.touches[0].clientX;
          recordRTC.startRecording();
          this.isRecording=true;
          clearInterval(this.timer)
          this.recordTime=0;
          this.timer=setInterval(() => {
            this.recordTime++
          }, 100);
          this.recordRTC = recordRTC;
          this.stream = stream;
        })
        .catch(() => {
          console.log("未授权");
        });
    },
    stop() {
      this.cancel();
      setTimeout(() => {
         console.log('this.blob',this.blob)
         var url = window.URL.createObjectURL(this.blob);
        let uri = {
          url,
          filename: "audio",
          filetype: "audio",
          data:this.blob,
        };
        var audio=document.createElement("AUDIO");
        audio.src=url;
        audio.oncanplay=()=>{
          if(!this.isCancel){
           this.sendRecorder({
          type: "contact",
          useId: this.$route.params.id,
          file: uri,
          duration:audio.duration
        });
        }
        }
      }, 100);
    },
    selectemoji(i) {
      this.input = this.input + this.emoji[i];
      this.emojishow = false;
      this.$refs.input.focus();
    },
    onshowemoji() {
      this.emojishow = !this.emojishow;
    },
    readablizeBytes(value) {
      const s = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
      const e = Math.floor(Math.log(value) / Math.log(1024));
      return (value / Math.pow(1024, Math.floor(e))).toFixed(2) + " " + s[e];
    },
    upload(e) {
      const file = window.WebIM.utils.getFileUrl(e.target);
      console.log("file", file);
      console.log(file.filetype);
      const obj = {
        chatType: "contact",
        chatId: this.$route.params.id,
        file: file,
        callback: () => {
          this.$refs.filebutton.value = null;
        },
      };
      if (file.filetype === "png" || file.filetype === "jpg") {
        this.sendImgMessage(obj);
      } else if (file.filetype === "mp3") {
        console.log("这是音频文件");
      } else if (file.filetype === "mp4") {
        this.sendVideoMessage(obj);
      } else {
        this.sendFileMessage(obj);
      }
    },
    sendTextMsg() {
      if (this.input == "" || this.input == "\n") {
        this.input = "";
        return;
      }
      this.onSendText({
        chatType: "contact",
        chatId: this.$route.params.id,
        message: this.input,
      });
      this.input = "";
    },
    scrollBottom() {
      const dom = this.$refs.msgContent;
      if (!dom) return;
      dom.scrollTop = dom.scrollHeight;
    },
    fileclick() {
      this.$refs.filebutton.click();
    },
    renderTime(time) {
      const t = new Date(parseInt(time));
      const Y = t.getFullYear();
      const M = t.getMonth() + 1;
      const D = t.getDate();
      const H = t.getHours() < 10 ? "0" + t.getHours() : t.getHours();
      const F = t.getMinutes() < 10 ? "0" + t.getMinutes() : t.getMinutes();
      return {
        time: `${H}:${F}`,
        date: `${M}月${D}日`,
        Y,
        D,
      };
    },
    renderDuration(time){
      const inttime=parseInt(time)
      const M=inttime/60<10?"0"+(inttime/60).toFixed(0):(inttime/60).toFixed(0);
      const S=inttime%60<10?"0"+inttime%60:inttime%60;
      return{
        M,S
      }
    },
    judgeTime() {
      const currentYear = new Date().getFullYear();
      if (!this.msgList) return;
      const timeArr = this.msgList.map((item, index, array) => {
        item["show_time"] = true;
        item["show_year"] =
          this.renderTime(item.time).Y === currentYear ? false : true;
        if (index > 0) {
          if (
            this.renderTime(array[index]["time"]).Y ===
            this.renderTime(array[index - 1]["time"]).Y
          )
            item["show_year"] = false;
          if (
            this.renderTime(array[index]["time"]).D ===
            this.renderTime(array[index - 1]["time"]).D
          )
            item["show_time"] = false;
        }
        return item;
      });
      return timeArr;
    },
  },
};
</script>

<style lang="less">
@import url("./index.less");
</style>
<style scoped>
@import url("./iconfont/iconfont.css");
</style>