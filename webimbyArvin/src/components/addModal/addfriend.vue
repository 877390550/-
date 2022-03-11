<template>
  <div type="text" @click="open"><slot/></div>
</template>
<script>
import { mapActions } from 'vuex';
  export default {
    data(){
      return{
        value:''
      }
    },
    props:['id'],
    methods: {
      changefocus(){
          document.getElementsByClassName('input')[0].focus();
      },
      ...mapActions(['addfriend']),
      open() {
        var self=this;
        const h = this.$createElement;
        this.$msgbox({
          title: '申请添加朋友',
          message: h('div', {ref:'abc'}, [
            h('span', null, '发送添加朋友申请'),
            h('br'),
            h('input',{class:'input',
            domProps:{
              placeholder:'我是...',
              type:'text',
            },
            attrs:{'value':self.value},
            // https://blog.csdn.net/qq_39977679/article/details/89353587，这里是如何实现绑定的呢？
            on:{
              input:function(event){
                self.value=event.target.value
              }.bind(self),
              keyup:function(event){
                if(event.keyCode==13){
                  self.addfriend({id:self.id,message:self.value});
                  self.$msgbox.close()
                }
              },
            }},''),
          ]),
          showCancelButton: true,
          confirmButtonText: '发送',
          cancelButtonText: '取消',
          beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
              this.addfriend({id:this.id,message:this.value});
                done();
            } else {
                done();
            }
          }
        })
        setTimeout(() => {
        this.changefocus();
        }, 200);
      }
    }
  }
</script>

<style lang="less">
.el-message-box{
  background-color: #242F3D;
  border: 1px solid #242F3D;
  color: #fff;
  .el-message-box__title{
    color: #fff;
    font-size: .9em;
  }
  .el-message-box__content{
    color: #fff;
  }
  .el-button--default{
    background-color: #242F3D;
    color: #fff;
  }
  .el-button--primary{
    background-color: #409eff;
  }
  input{
    width: 100%;
  }
}
</style> 
