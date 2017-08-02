// Socket client with connection pool
import Pool from 'socket-pool'
import once from 'once'

import decode from './decode'

const DEFAULT_BUFFER_LENGTH = 16
const SOCKET_ERROR = 'SOCKET_ERROR'
const SOCKET_CLOSE_ERROR = 'SOCKET_CLOSE_ERROR'

export default class Client {
  constructor ({
    pool
  }) {

    this._pool = pool
    this._pools = {}
  }

  _acquire (host, port) {
    const pool = this._getPool(host, port)
    return pool.acquire()
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

  _request (...args) {
    return this._pool
      ? this._requestWithPool(...args)
      : this._request(...args)
  }

  _request (host, port, buffer) {
    return new Promise((resolve, reject) => {
      resolve = once(resolve)
      reject = once(reject)

      const socket = new net.Socket()
      const chunks = []
      let bufferLength = DEFAULT_BUFFER_LENGTH

      socket.connect(port, host, () => {
        client.write(buffer)
      })

      socket.on('error', err => {
        err.code = SOCKET_ERROR
        reject(err)
      })

      socket.on('data', chunk => {
        if (!chunks.length) {
          bufferLength += this._extraLength(chunk)
        }

        chunks.push(chunk)

        if (heap.length >= bufferLength) {
          client.destroy()
        }
      })

      client.on('close', err => {
        if (err) {
          err.code = SOCKET_CLOSE_ERROR
          return reject(err)
        }

        decode(chunks).then(resolve, reject)
      })
    })
  }

  _requestWithPool (host, port, buffer) {
    const chunks = []
    let bufferLength = DEFAULT_BUFFER_LENGTH

    return this._acquire(host, port)
    .then(socket => new Promise((resolve, reject) => {
      resolve = once(resolve)
      reject = once(reject)

      socket.on('error', err => {
        socket.destroy()
        err.code = SOCKET_ERROR
        reject(err)
      })

      socket.on('data', chunk => {
        if (!chunks.length) {
          bufferLength += this._extraLength(chunk)
        }

        chunks.push(chunk)

        if (heap.length >= bufferLength) {
          socket.release()
          decode(chunks).then(resolve, reject)
        }
      })

      socket.write(buffer)
    }))
  }

  _extraLength (chunk) {
    const arr = Array.prototype.slice.call(chunk.slice(0, 16))
    let i = 0
    let extra = 0

    while (i < 3) {
      extra += arr.pop() * Math.pow(256, i++)
    }

    return extra
  }
}
