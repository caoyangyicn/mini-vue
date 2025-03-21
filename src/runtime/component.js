import { reactive } from '../reactive/reactive';
import { normalizeVnode } from './vnode';

function initProps(instance, vnode){
  const { props: vnodeProps, type: Component } = vnode;
  const props = instance.props || {};
  const attrs = instance.attrs || {};
  for(const key in vnodeProps) {
    if(Component.props?.includes(key)){
      props[key] = vnodeProps[key];
    } else {
      attrs[key] = vnodeProps[key];
    }
  }
}

export function mountComponent(vnode, container, anchor, patch){
  const { type: Component } = vnode;
  const instance = {
    props: null,
    attr: null,
    setupState: null,
    ctx: null,
    mount: null,
  };

  initProps(instance, vnode);
  instance.setupState = Component.setup?.(instance.props, { attrs: instance.attrs }) || {};
  instance.ctx = {
    ...instance.props,
    ...instance.setupState
  }

  instance.mount = () => {
    const subTree = normalizeVnode(Component.render(instance.ctx));
    if(Object.keys(instance.attrs).length){
      subTree.props ={
        ...subTree.props,
        ...instance.attrs
      }
    }
    patch(null, subTree, container, anchor);
  };
  instance.mount();
}
