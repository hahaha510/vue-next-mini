import { track, trigger } from './effect'

const get = createGetter()
const set = createSetter()
export const mutableHandlers: ProxyHandler<Object> = {
  get,
  set
}
function createGetter() {
  return function (target: object, key: string | symbol, receiver: object) {
    const res = Reflect.get(target, key, receiver)
    track(target, key)
    return res
  }
}
function createSetter() {
  return function (
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ) {
    const res = Reflect.set(target, key, value, receiver)
    trigger(target, key)
    return res
  }
}
