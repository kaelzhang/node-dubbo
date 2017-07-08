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

Dubbo/dubbox client for node.js

## Install

```sh
$ npm install dubbo --save
```

## Usage

```js
import Dubbo from 'dubbo'

const dubbo = new Dubbo({
  application: 'my-application-name',
  // parent node of dubbo
  root: 'dubbo-test',
  // dubbo version
  version: '2.8.4',
  zookeeper: {
    host          : '10.0.0.100:2181',

    // node-zookeeper-client createClient options
    sessionTimeout: 30000,
    spinDelay     : 1000,
    retries       : 5
  },
  services: {
    member: {
      interface: 'me.kael.service.memberService',
      timeout: 6000,
      group,
      version
    }
  }
})

// Use an already registered service
dubbo
// If a service is used before registered, an error will rejected
.service('member')
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


// Register a new service
dubbo
.register('order', {
  interface: 'me.kael.service.orderService'
})
.service('order')
.invoke('create', ...)
.then(...)
```

## License

MIT
