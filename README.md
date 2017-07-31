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

- TCP 长连接及长连接池
- 动态的服务注册
- 内部使用队列处理 Service 注册的握手过程，调用者无需关心

第一期基于 node-zookeeper-dubbo 的核心逻辑

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

    // node-zookeeper-client 的 createClient 方法的 options，
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
  },

  // 1. Object
  // 对于每一个 service，长连接池的大小
  // 这些参数会被直接传递给 generic-pool
  // 2. false
  // 若不希望使用连接池，则传递 false
  pool: {
    max: 200,
    min: 10,
    maxWaitingClients: 500
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
.then(isSuccess => {
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

## new Dubbo(options)

创建一个 `Dubbo` 实例

**options** `Object`

- **application** `String` 当前应用的名称
- **root** `String` dubbo 的父节点名
- **version** `String` 连接的 dubbo 服务使用的 dubbo 版本
- **zookeeper** `Object`
  - **host** `String` zookeeper 的地址，格式为 `<ip>[:<port>]`，若端口没有定义，则默认端口为 `2181`
  - 其他 [`node-zookeeper-client`](https://www.npmjs.com/package/node-zookeeper-client) 的参数，会直接传递
- **services** `Object.<name:ServiceOptions>` 需要预先注册的 services
- **pool** `Object` 连接池的 options，它会直接作为参数传递给 [`generic-pool`](https://www.npmjs.com/package/generic-pool)


**ServiceOptions** `Object`

- **interface**
- **timeout**
- **group**
- **version**

## dubbo.register(name, serviceOptions)

注册一个 dubbo service，一个被注册过的 service，可以立即调用它的 `service.invoke()` 方法，`dubbo` 与 service 进行 providers 和 consumers 的握手的过程，会被 service 内部的队列处理好。

- **name** `String`
- **serviceOptions** `ServiceOptions`

Returns `this`

## dubbo.service(name)

获取一个 service，即使一个名为 `name` 的 service，没有被注册过，该方法也会返回一个 `Service` 实例。

但是若一个 service 没有被注册过，那么在调动 `service.invoke()` 方法的时候，会得到一个 `Promise.reject()`

Returns `Service`


```js
// 若 `member` service 没有注册，仍然能够获取一个 member 实例
const member = dubbo.service('member')

member.invoke('login', arg).catch(err => {
  // 但是当调用 invoke 的时候，会得到一个 `SERVICE_NOT_REGISTERED` 的错误
  console.log(err.code === 'SERVICE_NOT_REGISTERED')
  // true
})

// 然后，我们若注册了 member 这个 service
dubbo.register('member', {
  interface: '...',
  ...
})

// 就可以使用这个 service 了
member.invoke('login', arg)
.then(isSuccess => {
  console.log('is successfull:', isSuccess)
})
```

## service.invoke(methodName, ...args)

请求一个 service 方法。

- **methodName** `String` service 中的方法名，若该方法名不存在，则会得到一个 `Promise.reject`
- **args** `any` 方法的参数，可传递多个，这里的方法，需要是 java 风格的对象。可以手动拼，或者使用 [`js-to-java`](https://www.npmjs.com/package/js-to-java) module.

```js
service.invoke('createProduct', product1, product2)
```

Returns `Promise`

## License

MIT
