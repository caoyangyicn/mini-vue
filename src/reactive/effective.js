let activeEffect;
const effectStack = [];
export function effect(fn, options = {}){
  const effectFn = () => {
    try {
      activeEffect = effectFn;
      effectStack.push(activeEffect);
      return fn;
    } finally {
      // todo
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1];
    }
  }
  if(options.lazy === true) {
    effectFn();
  }
  effectFn.scheduler = options.scheduler;
  return effectFn();
}

const targetMap = new WeakMap();
export function track(target, key){
  if(!activeEffect){
    return;
  }
  let depsMap = targetMap.get(target);
  if(!depsMap){
    targetMap.set(target, (depsMap = new Map()));
  }

  let deps = depsMap.get(key);
  if(!deps){
    depsMap.set(key, (deps = new Set()));
  }

  deps.add(activeEffect);
}

export function trigger(target, key){
  const depsMap = targetMap.get(target);
  if(!depsMap){
    return;
  }
  const deps = depsMap.get(key);
  if(deps){
    deps.forEach(effectFn => {
      if(effectFn.scheduler){
        effectFn(effectFn.scheduler);
      } else {
        effectFn()
      }
    });
  }
}