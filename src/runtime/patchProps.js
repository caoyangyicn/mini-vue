import { isBoolean } from '../utils';

export const domPropsRE = /\[A-Z]|^(?:value|checked|selected|muted)$/;
export function patchProps(preProps, props, el) {
  if(preProps === props) return;
  preProps = preProps || {};
  props = props || {};
  for(let key in props){
    const prev = preProps[key];
    const next = props[key];
    if(prev !== next){
      patchDomProp(prev, next, key, el);
    }
  }
  for(const key in preProps){
    if(key !== 'key' && props[key] == null){
      patchDomProp(preProps[key], null, key, el);
    }
  }
}

export function patchDomProp(prev, next, key, el) {
  switch (key){
    case 'class':
      el.className = next || '';
      break;
    case 'style':
      for(let styleName in next){
        el.style[styleName] = next[styleName];
      }
      if(prev){
        for(const styleName in prev){
          if(!next[styleName]){
            el.style[styleName] = '';
          }
        }
      }
      break;
    default:
      if(key[0] === 'o' && key[1] === 'n'){
        const eventName = key.slice(2).toLowerCase();
        if(prev){
          el.removeEventListener(eventName, prev);
        }
        if(next){
          el.addEventListener(eventName, next);
        }
      }else if(domPropsRE.test(key)){
        if(next === '' && isBoolean(el[key])){
          next = true;
        }
      } else {
        if(next == null || next === false){
          el.removeAttribute(key);
        }else {
          el.setAttribute(key, next);
        }
      }
      break;
  }
}