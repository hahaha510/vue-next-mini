import { activeEffect, triggerEffects } from "./effect";
import { toReactive } from "./reactive";
export function ref(value) {
  return createRef(value);
}
function createRef(value) {
  return new RefImpl(value);
}
//因为reactive只处理对象，所以在handler进行数据劫持
//但是ref可以处理基本数据类型，我们用数据访问器进行数据劫持
class RefImpl {
    public __v_isRef = true; //ref标识
    public _value; //保存ref的值
    public dep;//用于收集对应的effect
    constructor(public rawvalue) {
        this._value=toReactive(rawvalue)
    }
    get value() {

        trackRefValue(this) //依赖收集
        return this._value
    }
    set value(newValue) {
        if(newValue!==this.rawvalue){
            this.rawvalue=newValue
            this._value=newValue
            triggerRefValue(this) //触发更新
        }
    }
}

function  trackRefValue(ref) {
    if(activeEffect){
    }
}
function triggerRefValue(ref) {
    let dep=ref.dep;
    if(dep){
        triggerEffects(dep)
    }
}

//toRef,toRefs 主要是针对reactive的属性解构

class ObjectRefImpl {
    public __v_isRef = true; //ref标识
    constructor(public _object,public _key){
        
    }
    get value(){
        return this._object[this._key]
    }
    set value(newValue){
        this._object[this._key]=newValue
    }
}
export function toRef(object,key){
    return new ObjectRefImpl(object,key)
}

export function toRefs(object){
    const res={}
    for(let key in object){ //挨个属性去调用toRef
        res[key]=toRef(object,key)
    }
    return res
}

export function proxyRefs(objectWithRef){
    return new Proxy(objectWithRef,{
        get(target,key,receiver){
            let r=Reflect.get(target,key,receiver)
            return r.__v_isRef?r.value:r //自动点value
        },
        set(target,key,value,receiver){
            const oldValue=target[key]
            if(oldValue.__v_isRef){
                oldValue.value=value
                return true
            }else{
                return Reflect.set(target,key,value,receiver)
            }
        }
        }
    )
}