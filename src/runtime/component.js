import { normalizeVnode } from './vnode';
import { effect, reactive } from '../reactive';
import { queueJob } from './scheduler';
import { compile } from '../compiler/compile';

function updateProps(instance, vnode){
  const { props: vnodeProps, type: Component } = vnode;
  const props = (instance.props = {});
  const attrs = (instance.attrs = {});
  for(const key in vnodeProps) {
    if(Component.props?.includes(key)){
      props[key] = vnodeProps[key];
    } else {
      attrs[key] = vnodeProps[key];
    }
  }
  instance.props = reactive(instance.props);
}

function fallTrought(instance, subTree){
  if(Object.keys(instance.attrs).length){
    subTree.props ={
      ...subTree.props,
      ...instance.attrs
    };
  }
}

export function mountComponent(vnode, container, anchor, patch) {
  const { type: Component } = vnode;
  const instance = (vnode.component = {
    props: null,
    attrs: null,
    setupState: null,
    ctx: null,
    isMounted: false,
    subtree: null,
    update: null,
    next: null
  });
  updateProps(instance, vnode);
  instance.setupState = Component.setup?.(instance.props, { attrs: instance.attrs });
  instance.ctx = {
    ...instance.props,
    ...instance.setupState
  }

  if(!Component.render && Component.template){
    let {template} = Component;
    if (template[0] === '#') {
      const el = document.querySelector(template);
      template = el ? el.innerHTML : '';
    }

    const code = compile(template);
    Component.render = new Function('ctx', code);
  }

  instance.update = effect(() => {
    if (instance.isMounted) {
      const prevSubTree = instance.subtree;
      const subTree = (instance.subtree = normalizeVnode(Component.render(instance.ctx)));
      fallTrought(instance, subTree);
      patch(prevSubTree, subTree, container, anchor);
      vnode.el = subTree.el;
    } else {
      if (instance.next) {
        vnode = instance.next;
        instance.next = null;
        updateProps(instance, vnode);
        instance.ctx = {
          ...instance.props,
          ...instance.setupState
        }
      }

      const subTree = (instance.subtree = normalizeVnode(Component.render(instance.ctx)));
      fallTrought(instance, subTree);
      patch(null, subTree, container, anchor);
      vnode.el = subTree.el;
      instance.isMounted = true;
    }
  }, {
    scheduler: queueJob
  });
}