[![Build Status](https://travis-ci.org/kaelzhang/node-dubbo.svg?branch=master)](https://travis-ci.org/kaelzhang/node-dubbo)
<!-- optional appveyor tst
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/kaelzhang/node-dubbo?branch=master&svg=true)](https://ci.appveyor.com/project/kaelzhang/node-dubbo)
-->
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/dubbo.svg)](http://badge.fury.io/js/dubbo)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/dubbo.svg)](https://www.npmjs.org/package/dubbo)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/kaelzhang/node-dubbo.svg)](https://david-dm.org/kaelzhang/node-dubbo)
-->

# dubbo

node.js dubbo/dubbox client with zookeeper support via dubbo default hessian protocol.

想到这个项目基本上只给国人用，就破例稍微接地气一点，下面都写中文文档

## Install

```sh
$ npm install dubbo --save
```

## Usage

```js
import Dubbo from 'dubbo'

const dubbo = new Dubbo({
  application: 'my-application-name',

  // Dubbo 父节点名
  root: 'dubbo-test',

  // Dubbo 的版本
  version: '2.8.4',
  zookeeper: {
    host          : '10.0.0.100:2181',

    // node-zookeeper-client 的 createClient 方法的 options
    sessionTimeout: 30000,
    spinDelay     : 1000,
    retries       : 5
  },

  // 需要注册的服务名，还可以使用 `dubbo.register` 方法来动态注册一个服务
  services: {
    member: {
      interface: 'me.kael.service.memberService',
      timeout: 6000,
      group,
      version
    }
  }
})


// 如果一个服务没有注册就被调用，那么会收到一个 Promise.reject
dubbo.service('member')

// `'login'` 为方法名
// invoke 方法可以接多个参数
.invoke('login', {
  $class: 'me.kael.member.dto.loginDTO',
  $: {
    mobile: {
      $class: 'java.lang.String',
      $: '18800008888'
    },
    password: {
      $class: 'java.lang.String',
      $: 'my-password'
    }
  }
})
.then(({
  isSuccess
}) => {
  console.log('is successful', isSuccess)
})


// 动态注册一个服务
dubbo.register('order', {
  interface: 'me.kael.service.orderService'
})
.service('order')
.invoke('create', ...)
.then(...)
```

## License

MIT
