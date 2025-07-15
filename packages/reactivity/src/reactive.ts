import { isObject } from '@vue/shared'
import { mutableHandlers } from './baseHander'
import { ReactiveFlags } from './baseHander'
// 缓存在这 防止一个对象被重复代理
const reactiveMap = new WeakMap()

function createReactiveObject(target) {
  if (!isObject(target)) {
    return target
  }
  // 如果传进来的target是proxy 就是代理对象再次代理是没必要的
  // 随便访问一个属性 因为target是proxy 所以会触发get
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }

  // 如果已经被代理过 直接返回
  const existProxy = reactiveMap.get(target)
  if (existProxy) {
    return existProxy
  }
  // 没有代理过 就代理
  let proxy = new Proxy(target, mutableHandlers)
  // 缓存
  reactiveMap.set(target, proxy)
  return proxy
}

export function reactive(target) {
  return createReactiveObject(target)
}

export function toReactive(rawvalue){
  return isObject(rawvalue) ? reactive(rawvalue) : rawvalue
}