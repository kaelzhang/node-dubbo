import net from 'net'
import url from 'url'
import qs from 'querystring'

import Zookeeper from 'node-zookeeper-client'
import ip from 'ip'

import Service from './service'


export default class Dubbo {
  constructor ({
    application,
    services = {},
    root = 'dubbo',
    version = '2.5.3.6',
    zookeeper
  }) {

    this._root = root
    this._version = version
    this._connected = false
    this._pendingServices = []

    this._ip = ip.address()
    this._baseQuery = {
      application,
      category   : 'consumers',
      check      : 'false',
      dubbo      : version,
      side       : 'consumer'
    }

    Object.keys(services).forEach(name => {
      const options = services[name]
      this.register(name, options)
    })

    const zk = this._zookeeper
             = Zookeeper.createClient(zookeeper.host, zookeeper)

    zk.connect()
    zk.once('connected', () => {
      this._pendingServices.forEach(name => {
        this._services[name].setup()
      })
    })
  }

  // Get a service
  service (name) {
    const existing = this._services[name]
    if (existing) {
      return existing
    }

    const service = this._services[name] = new Service(name)

    if (!this._connected) {
      this._pendingServices.push(name)
    } else {
      service.setup()
    }

    return service
  }

  // Register a service
  register (name, options) {
    this.service(name).register({
      options,
      path: {
        consumer: this._consumerPath(options),
        provider: this._providerPath(options)
      },
      zookeeper: this._zookeeper,
      dubboVersion: this._version
    })
    return this
  }

  _consumerPath ({
    interface: _interface,
    version,
    group
  }) {

    const path = url.format({
      protocol: 'consumer',
      slashes : 'true',
      host    : `${this._ip}/${_interface}`,
      query   : {
        ...this._baseQuery,
        _interface,
        revision: version,
        version,
        group,
        timestamp: Date.now()
      }
    })

    return `/${this._root}/${_interface}/consumers/${encodeURIComponent(path)}`
  }

  _providerPath ({
    interface: _interface
  }) {

    return `/${this._root}/${_interface}/providers`
  }
}
