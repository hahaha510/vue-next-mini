export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run()
  })
  _effect.run()
  if (options) {
    Object.assign(_effect, options) //用用户传来的schedule进行覆盖
  }
  const runner: any = _effect.run.bind(_effect)
  runner.effect = _effect //可以在run方法上获取到effect的引用
  return runner //外界可以自己让其重新run
}
function cleanDepEffect(dep, effect) {
  dep.delete(effect)
  if (dep.size == 0) {
    dep.cleanup()
  }
}
// 清理effect函数
function preCleanEffect(effect) {
  // 将effect的依赖长度设置为0
  effect._depsLength = 0
  // 将effect的执行id设置为0
  effect._trackId = 0 //每次执行id+1，如果当前同一个effect执行，id就是相同的
}
function postCleanEffect(effect) {
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect) //删除映射表中对应的effect
    }
    effect.deps.length = effect._depsLength //更新依赖列表长度
  }
}
export let activeEffect
class ReactiveEffect {
  // 这个属性可以用来停止所有的effect 让它不做响应式处理 直接返回
  public active = true
  _trackId = 0 //用于记录当前effect执行了几次
  deps = []
  _depsLength = 0
  _running = 0 //effct是否正在运行
  constructor(public fn, public scheduler) {}
  run() {
    if (!this.active) {
      return this.fn()
    }
    let lastEffect = activeEffect
    try {
      // 把自己放在全局上，能让属性找到对应的effect
      activeEffect = this
      preCleanEffect(this)
      this._running++
      return this.fn() //到这一步会触发getter 然后去依赖收集
    } finally {
      this._running--
      postCleanEffect(this)
      activeEffect = lastEffect
    }
  }
}

// 双向记忆
// 1._trackId 用于记录执行次数(防止一个属性在当前effect中多次依赖收集) 只收集一次
// 2.拿到上一次的依赖的最后一个和这次比较
export function trackEffect(effect, dep) {
  // console.log(effect, dep)
  // 这里就是多个state.flag只会收集一次
  if (dep.get(effect) != effect._trackId) {
    dep.set(effect, effect._trackId)
  }
  // {flag,name}
  // {flag,age}
  let oldDep = effect.deps[effect._depsLength]
  if (oldDep != dep) {
    if (oldDep) {
      // oldDep.delete(effect)
      cleanDepEffect(oldDep, effect)
    }
    // 换成新的
    effect.deps[effect._depsLength++] = dep //永远按照本次最新的来存放
  }
  // dep.set(effect, effect._trackId)
  // effect.deps[effect._depsLength++] = dep
  // console.log(effect, effect.deps)
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    // 如果不是正在执行,才能执行effect
    if (!effect._running) {
      effect.scheduler() //相当于执行了effect.run()
    }
  }
}
