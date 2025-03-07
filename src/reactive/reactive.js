import { hasChanged, isArray, isObject } from '../utils';
import { track, trigger } from './effective';

const proxyMap = new WeakMap();
export function reactive(target){
    if(!isObject(target)){
        return target;
    }
    if(isReactive(target)){
        return target;
    }
    if(proxyMap.has(target)){
        return proxyMap.get(target);
    }
    const proxy = new Proxy(target, {
        get(target, key,recevier){
            if(key === '__v_isReactive'){
                return true;
            }
            const res = Reflect.get(target, key, recevier);
            track(target, key);
            return isObject(res) ? reactive(res) : res;
        },
        set(target, key, value, recevier){
            let oldLength = target.length;
            const oldValue = target[key];
            if(hasChanged(oldValue, value)){
                trigger(target, key);
                if(isArray(target) && hasChanged(oldLength, target.length)){
                    trigger(target, 'length');
                }
            }
            return Reflect.set(target, key, value, recevier);
        }
    });
    proxyMap.set(target, proxy);
    return proxy;
}

export function isReactive(target){
    return target && target['__v_isReactive'] === true;
}