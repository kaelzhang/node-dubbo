import semver from 'semver'


export function error (message, code) {
  const e = new Error(message)
  e.code = code
  return e
}


export function reject (message, code) {
  return Promise.reject(error(message, code))
}


const STR_DOT = '.'

function cleanVersion (version) {
  const splitted = version.split(STR_DOT)
  const prefix = splitted.slice(0, 3)
  const suffix = splitted.slice(3)

  prefix.length = 3
  prefix = prefix.map(x => x || 0)
  return prefix.join(STR_DOT) + (
    suffix.length
      ? '-' + suffix.join(STR_DOT)
      : ''
  )
}

export function gte (a, b) {
  return semver.gte(cleanVersion(a), cleanVersion(b))
}
