<template>
  <div>
    <button @click="startRecord">开始录制</button>
    <br><br><br><br><br><br><br><br>
    <button @click="stop">停止录制</button>
    <br><br><br><br><br><br><br><br>
    <div class="audiocontent">
    <audio :src="src" controls ref="audio"></audio>
    <div class="play">
      <svg t="1640184071063" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2036" width="200" height="200"><path d="M374.272 333.312v355.328c0 30.208 20.992 40.448 45.568 26.112l288.768-175.104c25.088-15.872 25.088-40.448 0-54.784L419.84 309.76c-7.68-5.12-14.336-6.656-20.992-6.656-14.336-2.56-24.576 9.216-24.576 30.208zM1024 512c0 282.624-229.376 512-512 512S0 794.624 0 512 229.376 0 512 0s512 229.376 512 512z" p-id="2037" fill="#69A3DC"></path></svg>
    </div>
    <div class="rightcontent">
    <div class="process">-------------------</div>
    <div class="bottomcontent">
    <div class="duration">00:03</div>
    <div class="time">11:53</div>
    </div>
    </div>
    
    </div>
  </div>
</template>

<script>
import * as RecordRTC from 'recordrtc'
export default {
data(){
  return{
    recordRTC:{},
    stream:{},
    src:''
  }
},
methods:{
  startRecord(){
    navigator.mediaDevices.getUserMedia({audio:true}).then(
      (stream)=>{
        let recordRTC=RecordRTC(stream,{
          type:'audio',
          recorderType:RecordRTC.StereoAudioRecorder,
          disableLogs:true
        });
        recordRTC.startRecording();
        this.recordRTC=recordRTC;
        this.stream=stream;
      }).catch(()=>{
        console.log('未授权')
      })
      },
      stop(){
        let recordRTC=this.recordRTC;
        recordRTC.stopRecording(()=>{
          var track=this.stream.getTracks()[0];
          track.stop();
          var blob=recordRTC.getBlob();
          console.log('blob',blob)
          var url=window.URL.createObjectURL(blob)
          console.log('url',url)
          this.src=url;
          console.log('audio',this.$refs)
        })
      }
}
}
</script>
<style lang="less" scoped>
@import url("./index.less");
</style>