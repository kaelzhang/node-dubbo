// Socket client with connection pool
import Pool from 'socket-pool'
import once from 'once'

import decode from './decode'

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

  request (host, port, buffer) {
    const socket = await
    const chunks = []
    let bufferLength = 16

    return this._acquire(host, port)
    .then(socket => new Promise((resolve, reject) => {
      resolve = once(resolve)
      reject = once(reject)

      socket.on('error', err => {
        socket.destroy()
        err.code = 'SOCKET_ERROR'
        reject(err)
      })

      socket.on('data', chunk => {
        if (!chunks.length) {
          const arr = Array.prototype.slice.call(chunk.slice(0, 16))
          let i = 0

          while (i < 3) {
            bufferLength += arr.pop() * Math.pow(256, i++)
          }
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
}
