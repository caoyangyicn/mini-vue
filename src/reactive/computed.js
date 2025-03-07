import { effect, track, trigger } from './effective';
import { isFunction } from '../utils';

export function computed(getterOrOption){
  let getter, setter;
  if(isFunction(getterOrOption)){
    getter = getterOrOption;
    setter = () => {
      console.warn('Write operation failed: computed value is readonly');
    }
  } else {
    getter = getterOrOption.get;
    setter = getterOrOption.set;
  }
  return new computedRef(getter, setter);
}

class computedRef{
    constructor(getter, setter){
        this._value = undefined;
        this.dirty = true;
        this._setter = setter;
        this.effect = effect(getter,{
          lazy: true,
          scheduler: () => {
            if(!this.dirty){
              this.dirty = true;
              trigger(this, 'value');
            }
          }
        });
    }

    get value(){
      if(this.dirty){
        this._value = this.effect();
        this.dirty = false;
        track(this, 'value');
      }
      return this._value;
    }
    set value(newValue){
        // todo
      this._setter = newValue;
    }
}