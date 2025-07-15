import { mutableHandlers } from './baseHandlers'
import { isObject } from '@vue/shared'
export const reactiveMap = new WeakMap<object, any>()
// reactive 函数
export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap)
}

function createReactiveObject(
  target: object,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>
) {
  //如果实例已经被代理，则直接读取
  const isExistingProxy = proxyMap.get(target)
  if (isExistingProxy) {
    return isExistingProxy
  }
  // 未被代理生成proxy实例
  const proxy = new Proxy(target, baseHandlers)
  // 缓存代理对象
  proxyMap.set(target, proxy)
  return proxy
}
/**
 * 将指定对象数据变为 reactive 数据
 * 普通数据直接返回
 */
export const toReactive = <T extends unknown>(value: T): T =>
  isObject(value) ? reactive(value as object) : value
