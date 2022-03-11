# signinandsignup

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

遇到的坑：
1.执行通过id搜索用户时，如果用户没有设置过昵称或头像，搜索返回空序列，但明明注册时传入了昵称，却没有生效-解决方案：注册时将昵称存储到sessionstorage中，待登录成功时将昵称取出，执行设置昵称的方法。
2.form中的button如果添加了@click.prevent事件，在按回车时也会触发事件，如果有两个button，则会执行第一个button中的事件，本项目使用到登录按钮和注册按钮，无论页面如何切换都触发注册事件-解决方案：原本使用v-show来渲染按钮，导致按钮始终存在，改用v-if来渲染，注册按钮不存在就触发登录按钮的事件了

