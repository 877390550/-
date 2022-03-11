<template>
   <div class="panel" >
      <div class="content">
          <h3><slot name="title"></slot></h3>
          <p><slot name="content"></slot></p>
          <slot name="button"></slot>
      </div>
  </div>
</template>

<script>
export default {
    name:'Panel'
}
</script>

<style>

.panel{
    position: absolute;
    overflow: hidden;
    text-align: center;
    z-index: 4;
    top: 10%;
    width: 50%;
    padding: 0% 5% ;
}
.left-panel{
    left: 0;
}
.right-panel{
    right: 0;
}

.panel .content{
    color:#fff;
}

.panel h3{
    font-weight: 600;
    line-height: 1;
    font-size: 1.5rem;
}

.panel p{
    font-size: .95rem;
    padding: .7rem 0;
}


@media(max-width:870px){

    .panel h3{
        font-size: 1.2rem;
    }

    .panel p{
        font-size: .7rem;
        padding: .5rem 0;
    }
    
    .left-panel{
        top: 5%;
    }
    .right-panel{
        top: 75%;
        right: 50%;
    }
}
@media(max-width:570px){
    .panel{
        width: 100%;
    }
    .right-panel{
        left: 0;
        top: 78%;
    }
}

</style>