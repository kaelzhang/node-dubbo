import {
  EncoderV2
} from 'hessian.js'

import {
  gte
} from './utils'

// 8 * 1024 * 1024 default body max length
const DEFAULT_LEN  = 8388608

const ENUM_TYPE = {
  boolean: 'Z',
  int    : 'I',
  short  : 'S',
  long   : 'J',
  double : 'D',
  float  : 'F'
}

export default class Encoder {
  constructor ({
    dubboVersion,
    interface,
    version,
    group,
    timeout
  }) {

    this._dubboVersion = dubboVersion
    this._interface = interface
    this._version = version
    this._group = group
    this._timeout = timeout
    this._gte280 = gte(dubboVersion, '2.8.0')

    const implicitArgs = {
      interface,
      path: interface,
      timeout
    }

    if (version) {
      implicitArgs.version = version
    }

    if (group) {
      implicitArgs.group = group
    }

    this._attachments = {
      $class: 'java.util.HashMap',
      $     : implicitArgs
    }
  }

  encode (method, args) {
    const body = this._body(method, args)
    const head = this._head(body.length)
    return Buffer.concat([head, body])
  }

  _head (len) {
    const head = [0xda, 0xbb, 0xc2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    if (len > DEFAULT_LEN) {
      throw new Error(`Data length too large: ${len}, max payload: ${DEFAULT_LEN}`)
    }

    let i = 15
    while (len >= 256) {
      head.splice(i--, 1, len % 256)
      len >>= 8
    }
    head.splice(i, 1, len)

    return new Buffer(head)
  }

  _body (method, args) {
    const body = new EncoderV2()

    body.write(this._dubboVersion)
    body.write(this._interface)
    body.write(this._version)
    body.write(method)

    if (this._gte280) {
      body.write(-1)
    }

    body.write(this._argsType(args))

    args.forEach(arg => {
      body.write(args)
    })

    body.write(this._attachments)

    return body.byteBuffer._bytes.slice(0, body.byteBuffer._offset)
  }

  _argsType (args) {
    if (!args.length) {
      return ''
    }

    let ret = ''

    args.forEach(arg => {
      const type = arg.$class

      ret += type.charAt(0) === '['
        ? ~type.indexOf('.')
          ? '[L' + type.slice(1).replace(/\./gi, '/') + ''
          : '[' + ENUM_TYPE[type.slice(1)]
        : type && ~type.indexOf('.')
          ? 'L' + type.replace(/\./gi, '/') + ''
          : ENUM_TYPE[type]
    })

    return ret
  }
}
