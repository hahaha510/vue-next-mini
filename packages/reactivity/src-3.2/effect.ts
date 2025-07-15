import { isArray } from '@vue/shared'
import { createDep, Dep } from './dep'
// 标记被激活的effect函数
export let activeEffect: ReactiveEffect | undefined

export function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}
export class ReactiveEffect<T = any> {
  constructor(public fn: () => T) {}
  run() {
    activeEffect = this
    // 执行改变视图的那个函数
    return this.fn()
  }
}
// key和effct函数的关系
type KeyToDepMap = Map<any, Dep>
// proxy对象和KeyToDepMap的关系
const targetMap = new WeakMap<any, KeyToDepMap>()

/**
 * 收集依赖
 * 建立key和effect(让视图变化的函数)的关系
 */
export function track(target: object, key: unknown) {
  if (!activeEffect) return
  // depsMap <属性,多个effects>
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }
  trackEffects(dep)
}
/**
 * 触发依赖
 * 找到key对用的effect函数 去执行 让视图变化
 * @param target
 * @param key
 * @param newValue
 * @returns
 */
export function trigger(target: object, key?: unknown, newValue?: unknown) {
  // console.log('触发依赖')
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  let dep = depsMap.get(key)
  if (!dep) {
    return
  }
  triggerEffects(dep)
}
// 依次收集activeEffect ,就是没执行一个effect函数 就把当前的effect函数收集起来
export function trackEffects(dep: Dep) {
  dep.add(activeEffect!)
}
// 拿到指定key对应的effect函数集合进行一遍历执行
export function triggerEffects(dep: Dep) {
  const effects = isArray(dep) ? dep : [...dep]
  for (const effect of effects) {
    effect.run()
  }
}
