import {DecoderV2} from 'hessian.js'

const RESPONSE_OK             = 20
const RESPONSE_WITH_EXCEPTION = 0
const RESPONSE_VALUE          = 1
const RESPONSE_NULL_VALUE     = 2

export default function decode (heap) {
  let flag, result

  if (heap[3] !== RESPONSE_OK) {
    return Promise.resolve(heap.slice(18, heap.length - 1).toString())
  }

  try {
    result = new DecoderV2(heap.slice(16, heap.length))
    flag = result.readInt()

    switch (flag) {
      case RESPONSE_NULL_VALUE:
        return Promise.resolve(null)

      case RESPONSE_VALUE:
        return Promise.resolve(result.read())

      case RESPONSE_WITH_EXCEPTION:
        const e = result.read()
        return Promise.reject(
          e instanceof Error
            ? e
            : new Error(e)
        )

      default:
        return Promise.reject(
          new Error(`Unknown result flag, expect '0' '1' '2', get ${flag}`)
        )
    }

  } catch (err) {
    return Promise.reject(err)
  }
}
