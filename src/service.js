import {
  reject,
  error
} from './utils'
import Encoder from './encoder'
import decode from './decode'

import {EventEmitter} from 'events'
import qs from 'querystring'
import url from 'url'
import net from 'net'

import _debug from 'debug'
const debug = _debug('dubbo')


const CREATE_MODES = {

  // The znode will not be automatically deleted upon client's disconnect.
  PERSISTENT: 0,

  // The znode will not be automatically deleted upon client's disconnect,
  // and its name will be appended with a monotonically increasing number.
  PERSISTENT_SEQUENTIAL: 2,

  // The znode will be deleted upon the client's disconnect.
  EPHEMERAL: 1,

  // The znode will be deleted upon the client's disconnect, and its name
  // will be appended with a monotonically increasing number.
  EPHEMERAL_SEQUENTIAL: 3
}


export default class Service extends EventEmitter {

  constructor (name) {
    super()

    this._name = name
    this._hosts = []
    this._methods = {}
    this._setupError = null
    this._ready = false
  }

  // Register service informations
  register ({
    zookeeper,
    options: {
      interface: _interface,
      version,
      group,
      timeout = 6000
    },
    dubboVersion,
    path: {
      consumer,
      provider
    }
  }) {

    if (this._registered) {
      return
    }

    this._registered = true

    this._zookeeper = zookeeper
    this._version = version
    this._group = group
    this._consumer = consumer
    this._provider = provider
    this._err = null
    this._encoder = new Encoder({
      dubboVersion,
      interface: _interface,
      version,
      group,
      timeout
    })
  }

  // Setup service
  setup () {
    return Promise.all([this._createNode(), this._initProvider()])
    .then(() => {
      this._ready = true
      this.emit('ready')
    })
    .catch(err => {
      this._setupError = err
      this._ready = true
      this.emit('ready')
    })
  }

  // @returns `Promise`
  _createNode () {
    const zk = this._zookeeper
    const consumer = this._consumer

    return new Promise((resolve, reject) => {
      zk.exists(consumer, (err, stat) => {
        if (err) {
          return reject(err)
        }

        if (stat) {
          return resolve()
        }

        zk.create(consumer, CREATE_MODES.EPHEMERAL, (err, node) => {
          if (err) {
            return reject(err)
          }

          resolve()
        })
      })
    })
  }

  _initProvider () {
    return new Promise((resolve, reject) => {
      this._zookeeper.getChildren(
        this._provider,
        () => this._initProvider(),
        (err, children) => {
          if (err) {
            err.code = 'ERR_GET_CHILDREN'
            return reject(err)
          }

          resolve(children)
        }
      )
    })
    .then(children => this._applyProviders(children))
  }

  _applyProviders (children) {
    if (!children) {
      return reject(
        `no children found for "${this._provider}"`,
        'NO_CHILDREN'
      )
    }

    const available = children
    .map(child => qs.parse(decodeURIComponent(child)))
    .filter(zoo => zoo.version === this._version && zoo.group === this._group)

    if (!available.length) {
      return reject(
        `no available children found for "${this._provider}"`,
        'NO_AVAILABLE_CHILDREN'
      )
    }

    this._hosts = available.map(zoo => url.parse(Object.keys(zoo)[0]).host)

    const methodsHash = {}
    available.forEach(zoo => {
      zoo.methods.split(',').forEach(method => {
        methodsHash[method] = true
      })
    })

    this._methods = methodsHash
  }

  _selectHost () {
    return this._hosts[Math.random() * this._hosts.length | 0]
    .split(':')
    .reverse()
  }

  invoke (method, ...args) {
    if (!this._registered) {
      return reject(`service "this._name" must be registered before use`,
        'SERVICE_NOT_REGISTERED')
    }

    if (this._ready) {
      return this._invoke(method, args)
    }

    return new Promise((resolve, reject) => {
      this.once('ready', () => {
        this._invoke(method, args).then(resolve, reject)
      })
    })
  }

  _invoke (method, args) {
    if (this._setupError) {
      return Promise.reject(this._setupError)
    }

    if (!this._methods[method]) {
      return reject(`"${method}" is not an available method`)
    }

    const buffer = this._encoder.encode(method, args)

    return new Promise((resolve, reject) => {
      const client = new net.Socket()
      const chunks = []
      let heap
      let bl       = 16

      client.connect(...this._selectHost(), function () {
        client.write(buffer)
      })

      client.on('error', function (err) {
        this._initProvider()
        .then(
          () => {
            client.connect(...this._selectHost(), function () {
              client.write(buffer)
            })
          },
          reject
        )
      })

      client.on('data', function (chunk) {
        if (!chunks.length) {
          const arr = Array.prototype.slice.call(chunk.slice(0, 16))
          let i = 0

          while (i < 3) {
            bl += arr.pop() * Math.pow(256, i++)
          }
        }

        chunks.push(chunk)
        heap = Buffer.concat(chunks)

        if (heap.length >= bl) {
          client.destroy()
        }
      })

      client.on('close', function (err) {
        if (err) {
          return reject(err)
        }

        decode(heap).then(resolve, reject)
      })
    })
  }
}
