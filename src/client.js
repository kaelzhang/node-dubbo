// Socket client with connection pool
import Pool from 'socket-pool'
import once from 'once'

import decode from './decoder'

const DEFAULT_BUFFER_LENGTH = 16
const SOCKET_ERROR = 'SOCKET_ERROR'
const SOCKET_CLOSE_ERROR = 'SOCKET_CLOSE_ERROR'

const extraLength = chunk => {
  const arr = Array.prototype.slice.call(chunk.slice(0, 16))
  let i = 0
  let extra = 0

  while (i < 3) {
    extra += arr.pop() * Math.pow(256, i++)
  }

  return extra
}

const throws = name => throw new Error(`${name} must be implemented`)

class RequestBase {
  constructor ({
    socket,
    host,
    port,
    buffer
  }) {

    this._socket = socket
    this._host = host
    this._port = port
    this._buffer = buffer
    this._resolve = this._reject = null
    this._chunks = []
    this._heap = null
  }

  _write () {
    throws('_write')
  }

  _release () {
    throws('_release')
  }

  _decode () {
    decode(this._heap).then(this._resolve, this._reject)
  }

  start () {
    return new Promise((resolve, reject) => {
      this._resolve = resolve = once(resolve)
      this._reject = reject = once(reject)

      let bufferLength = DEFAULT_BUFFER_LENGTH

      socket.on('error', err => {
        socket.destroy()
        err.code = SOCKET_ERROR
        reject(err)
      })

      socket.on('data', chunk => {
        if (!chunks.length) {
          bufferLength += extraLength(chunk)
        }

        const chunks = this._chunks
        chunks.push(chunk)

        const heap = this._heap = Buffer.concat(chunks)

        if (heap.length >= bufferLength) {
          this._done()
        }
      })

      this._write()
    }))
  }
}

class Request extends RequestBase {
  _write () {
    const socket = this._socket

    socket.on('close', err => {
      if (err) {
        err.code = SOCKET_CLOSE_ERROR
        return this._reject(err)
      }

      this._decode()
    })

    socket.connect(this._host, this._port, () => {
      socket.write(this._buffer)
    })
  }

  _done () {
    this._socket.destroy()
  }
}

class RequestForPool extends RequestBase {
  _write () {
    this._socket.write(this._buffer)
  }

  _done () {
    this._socket.release()
    this._decode()
  }
}

class ClientBase {
  constructor (Request) {
    this._Request = Request
  }

  _socket () {
    throws('_socket')
  }

  request (host, port, buffer) {
    return Promise.resolve(this._socket(host, port))
    .then(socket => new this._Request({
      socket,
      host,
      port,
      buffer
    }).start())
  }
}

export class Client extends ClientBase {
  constructor () {
    super(Request)
  }

  _socket () {
    return new net.Socket()
  }
}

export class ClientWithPool extends ClientBase {
  constructor (pool) {
    super(RequestForPool)

    this._pool = pool
    this._pools = {}
  }

  _getPool (host, port) {
    const key = `${host}:${port}`
    return this._pools[key] || (
      this._pools[key] = new Pool({
        pool: this._pool,
        connect: {
          host,
          port
        }
      })
    )
  }

  // Acquire the socket connection from the pool
  _socket (host, port) {
    const pool = this._getPool(host, port)
    return pool.acquire()
  }
}
