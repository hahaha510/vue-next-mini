import { isObject } from '@vue/shared'
import { track } from './reactiveEffect'
import { trigger } from './reactiveEffect'
import { reactive } from './reactive'
export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    // 这里就是taget如果是proxy 就会直接返回target 避免再次代理
    if (key === ReactiveFlags.IS_REACTIVE) {
      return target
    }
    // 当取值时,应该让响应式属性和effect映射起来
    // 收集依赖 todo...
    track(target, key) //收集这个对象上的属性，和effect关联在一起
    let res = Reflect.get(target, key, receiver)
    if (isObject(res)) {
      //当取的值也是对象的时候，我需要对这个对象进行代理,递归代理
      return reactive(res)
    }
    return res
  },
  set(target, key, value, receiver) {
    //找到属性 让对应的effect重新执行
    let oldValue = target[key]
    let result = Reflect.set(target, key, value, receiver)
    if (oldValue !== value) {
      trigger(target, key, value, oldValue)
    }
    return result
  }
}
