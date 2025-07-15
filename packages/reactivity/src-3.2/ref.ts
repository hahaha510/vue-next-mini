import { hasChanged } from '@vue/shared'
import { createDep, Dep } from './dep'
import { activeEffect, trackEffects, triggerEffects } from './effect'
import { toReactive } from './reactive'
export interface Ref<T = any> {
  value: T
}

// ref函数
export function ref(value?: unknown) {
  return createRef(value, false)
}

/*** 创建 RefImpl 
实例
* @param rawValue 原始数据* 
  @param shallow boolean 形数据，表示《浅层的响应性（即：只有 .value 是响应性的）》
* @returns
*/

function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }
  return new RefImpl(rawValue, shallow)
}

// RefImpl类
class RefImpl<T> {
  private _value: T
  private _rawValue: T
  public dep?: Dep = undefined
  public readonly __v_isRef = true
  // 构造函数，接收一个泛型参数value和一个只读的布尔值__v_isShallow
  constructor(value: T, public readonly __v_isShallow: boolean) {
    // 复杂类型的时候 __v_isShallow为false
    // 如果__v_isShallow为true，则将value赋值给_value，否则将value转换为响应式对象
    this._value = __v_isShallow ? value : toReactive(value)
    // 原来的数据
    this._rawValue = value
  }
  get value() {
    trackRefValue(this)
    return this._value
  }
  set value(newVal) {
    /*** newVal 为新数据*
     * this._rawValue 为旧数据（原始数据）
     *  对比两个数据是否发生了变化
     */
    if (hasChanged(newVal, this._rawValue)) {
      // 更新原始数据
      this._rawValue = newVal
      // 更新 .value的值
      this._value = toReactive(newVal)
      triggerRefValue(this)
    }
  }
}
// 判断数据是否是RefImpl类型
export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true)
}
/*** 为 ref 的 value 进行依赖收集工作*/
export function trackRefValue(ref: any) {
  if (activeEffect) {
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}

export function triggerRefValue(ref: any) {
  if (ref.dep) {
    triggerEffects(ref.dep)
  }
}
