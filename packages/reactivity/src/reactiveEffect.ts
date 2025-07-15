// 保存现在全局上是哪个effct
import { activeEffect, triggerEffects } from './effect'
import { trackEffect } from './effect'
const targetMap = new WeakMap()
// targetMap,depsMap,dep
export const createDep = (cleanup, key) => {
  const dep = new Map() as any //创建收集器 还是一个map
  dep.cleanup = cleanup
  dep.name = key //源码 自定义的为了标识这个映射表是给那个属性服务的
  return dep
}
export function track(target, key) {
  // 相当于知道在当前激活的effct下 有哪些属性 即这个key实在effct中访问的
  if (activeEffect) {
    // console.log(target, key, activeEffect)
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      // 不简单放个map了 用createMap创建一个扩展map
      depsMap.set(key, (dep = createDep(() => depsMap.delete(key), key))) //后面用于清理不需要的属性
    }

    trackEffect(activeEffect, dep) //将当前的effect放入映射表dep中,后续根据
    // console.log(targetMap)
  }
}

export function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }
  let dep = depsMap.get(key)
  if (dep) {
    //修改属性对应的effect
    triggerEffects(dep)
  }
}
