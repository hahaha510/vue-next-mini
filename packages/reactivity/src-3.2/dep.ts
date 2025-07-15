import { ReactiveEffect } from './effect'
// Dep就是依赖列表 是属性对应的所有effect的集合Set
export type Dep = Set<ReactiveEffect>
// 简单创建一个Dep
export const createDep = (effects?: ReactiveEffect[]): Dep => {
  const dep = new Set<ReactiveEffect>(effects) as Dep
  return dep
}
