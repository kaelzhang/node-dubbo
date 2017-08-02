import test from 'ava'
import Dubbo from '../src'

test('basic', t => {
  const dubbo = new Dubbo({
    application: 'test',
    root: 'dubbo',
    version: '2.5.4',
    zookeeper: {
      host: '127.0.0.1:2181',
      sessionTimeout: 30000,
      spinDelay     : 1000,
      retries       : 5
    },
    
  })
})
