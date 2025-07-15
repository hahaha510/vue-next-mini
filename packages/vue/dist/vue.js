var Vue = (function (exports) {
    'use strict';

    /**

    * 判断是否为一个对象*/
    var isObject = function (val) {
        return val !== null && typeof val === 'object';
    };

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function effect(fn, options) {
        var _effect = new ReactiveEffect(fn, function () {
            _effect.run();
        });
        _effect.run();
        if (options) {
            Object.assign(_effect, options); //用用户传来的schedule进行覆盖
        }
        var runner = _effect.run.bind(_effect);
        runner.effect = _effect; //可以在run方法上获取到effect的引用
        return runner; //外界可以自己让其重新run
    }
    function cleanDepEffect(dep, effect) {
        dep.delete(effect);
        if (dep.size == 0) {
            dep.cleanup();
        }
    }
    // 清理effect函数
    function preCleanEffect(effect) {
        // 将effect的依赖长度设置为0
        effect._depsLength = 0;
        // 将effect的执行id设置为0
        effect._trackId = 0; //每次执行id+1，如果当前同一个effect执行，id就是相同的
    }
    function postCleanEffect(effect) {
        if (effect.deps.length > effect._depsLength) {
            for (var i = effect._depsLength; i < effect.deps.length; i++) {
                cleanDepEffect(effect.deps[i], effect); //删除映射表中对应的effect
            }
            effect.deps.length = effect._depsLength; //更新依赖列表长度
        }
    }
    var activeEffect;
    var ReactiveEffect = /** @class */ (function () {
        function ReactiveEffect(fn, scheduler) {
            this.fn = fn;
            this.scheduler = scheduler;
            // 这个属性可以用来停止所有的effect 让它不做响应式处理 直接返回
            this.active = true;
            this._trackId = 0; //用于记录当前effect执行了几次
            this.deps = [];
            this._depsLength = 0;
            this._running = 0; //effct是否正在运行
        }
        ReactiveEffect.prototype.run = function () {
            if (!this.active) {
                return this.fn();
            }
            var lastEffect = activeEffect;
            try {
                // 把自己放在全局上，能让属性找到对应的effect
                activeEffect = this;
                preCleanEffect(this);
                this._running++;
                return this.fn(); //到这一步会触发getter 然后去依赖收集
            }
            finally {
                this._running--;
                postCleanEffect(this);
                activeEffect = lastEffect;
            }
        };
        return ReactiveEffect;
    }());
    // 双向记忆
    // 1._trackId 用于记录执行次数(防止一个属性在当前effect中多次依赖收集) 只收集一次
    // 2.拿到上一次的依赖的最后一个和这次比较
    function trackEffect(effect, dep) {
        // console.log(effect, dep)
        // 这里就是多个state.flag只会收集一次
        if (dep.get(effect) != effect._trackId) {
            dep.set(effect, effect._trackId);
        }
        // {flag,name}
        // {flag,age}
        var oldDep = effect.deps[effect._depsLength];
        if (oldDep != dep) {
            if (oldDep) {
                // oldDep.delete(effect)
                cleanDepEffect(oldDep, effect);
            }
            // 换成新的
            effect.deps[effect._depsLength++] = dep; //永远按照本次最新的来存放
        }
        // dep.set(effect, effect._trackId)
        // effect.deps[effect._depsLength++] = dep
        // console.log(effect, effect.deps)
    }
    function triggerEffects(dep) {
        var e_1, _a;
        try {
            for (var _b = __values(dep.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var effect_1 = _c.value;
                // 如果不是正在执行,才能执行effect
                if (!effect_1._running) {
                    effect_1.scheduler(); //相当于执行了effect.run()
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }

    // 保存现在全局上是哪个effct
    var targetMap = new WeakMap();
    // targetMap,depsMap,dep
    var createDep = function (cleanup, key) {
        var dep = new Map(); //创建收集器 还是一个map
        dep.cleanup = cleanup;
        dep.name = key; //源码 自定义的为了标识这个映射表是给那个属性服务的
        return dep;
    };
    function track(target, key) {
        // 相当于知道在当前激活的effct下 有哪些属性 即这个key实在effct中访问的
        if (activeEffect) {
            // console.log(target, key, activeEffect)
            var depsMap_1 = targetMap.get(target);
            if (!depsMap_1) {
                targetMap.set(target, (depsMap_1 = new Map()));
            }
            var dep = depsMap_1.get(key);
            if (!dep) {
                // 不简单放个map了 用createMap创建一个扩展map
                depsMap_1.set(key, (dep = createDep(function () { return depsMap_1.delete(key); }, key))); //后面用于清理不需要的属性
            }
            trackEffect(activeEffect, dep); //将当前的effect放入映射表dep中,后续根据
            // console.log(targetMap)
        }
    }
    function trigger(target, key, newValue, oldValue) {
        var depsMap = targetMap.get(target);
        if (!depsMap) {
            return;
        }
        var dep = depsMap.get(key);
        if (dep) {
            //修改属性对应的effect
            triggerEffects(dep);
        }
    }

    var ReactiveFlags;
    (function (ReactiveFlags) {
        ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    })(ReactiveFlags || (ReactiveFlags = {}));
    var mutableHandlers = {
        get: function (target, key, receiver) {
            // 这里就是taget如果是proxy 就会直接返回target 避免再次代理
            if (key === ReactiveFlags.IS_REACTIVE) {
                return target;
            }
            // 当取值时,应该让响应式属性和effect映射起来
            // 收集依赖 todo...
            track(target, key); //收集这个对象上的属性，和effect关联在一起
            var res = Reflect.get(target, key, receiver);
            if (isObject(res)) {
                //当取的值也是对象的时候，我需要对这个对象进行代理,递归代理
                return reactive(res);
            }
            return res;
        },
        set: function (target, key, value, receiver) {
            //找到属性 让对应的effect重新执行
            var oldValue = target[key];
            var result = Reflect.set(target, key, value, receiver);
            if (oldValue !== value) {
                trigger(target, key);
            }
            return result;
        }
    };

    // 缓存在这 防止一个对象被重复代理
    var reactiveMap = new WeakMap();
    function createReactiveObject(target) {
        if (!isObject(target)) {
            return target;
        }
        // 如果传进来的target是proxy 就是代理对象再次代理是没必要的
        // 随便访问一个属性 因为target是proxy 所以会触发get
        if (target[ReactiveFlags.IS_REACTIVE]) {
            return target;
        }
        // 如果已经被代理过 直接返回
        var existProxy = reactiveMap.get(target);
        if (existProxy) {
            return existProxy;
        }
        // 没有代理过 就代理
        var proxy = new Proxy(target, mutableHandlers);
        // 缓存
        reactiveMap.set(target, proxy);
        return proxy;
    }
    function reactive(target) {
        return createReactiveObject(target);
    }

    exports.effect = effect;
    exports.reactive = reactive;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=vue.js.map
