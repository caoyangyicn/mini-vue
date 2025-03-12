import { isBoolean } from '../utils';
import { ShapeFlag as shapeFlags, ShapeFlag as ShapeFlags } from './vnode';
import { patchProps, domPropsRE } from './patchProps';

export function render(vnode, container){
  let prevVNode = container._vnode;
  if(!vnode) {
    if(prevVNode){
      unmount(prevVNode);
    }
  }else {
    patch(prevVNode, vnode, container);
  }
  mount(vnode, container);
  container._vnode = vnode;
}

function isSameVnode(prevVNode, vnode) {
  return prevVNode.type === vnode.type;
}

function patch(prevVNode, vnode, container, anchor = null) {
  if(prevVNode && !isSameVnode(prevVNode, vnode)){
    unmount(prevVNode);
    prevVNode = null;
  }
  const { shapeFlag } = vnode;
  if(shapeFlag & ShapeFlags.COMPONENT){
    processComponent(prevVNode, vnode, container, anchor);
  } else if(shapeFlag & ShapeFlags.TEXT){
    processText(prevVNode, vnode, container, anchor);
  } else if(shapeFlag & shapeFlags.FRAGMENT){
    processFragment(prevVNode, vnode, container, anchor);
  } else {
    processElement(prevVNode, vnode, container, anchor);
  }

}

function unmount(vNode) {
  const { shapeFlag, el } = vNode;
  if(shapeFlag & ShapeFlags.COMPONENT){
    unmountComponent(vNode);
  } else if(shapeFlag & ShapeFlags.FRAGMENT){
    unmountFragement(vNode);
  } else {
    el.parentNode.removeChild(el);
  }
}

function processElement(prevVNode, vnode, container, anchor) {
  if(prevVNode){
    patchElement(prevVNode, vnode, container);
  } else {
    mountElement(vnode, container, anchor);
  }
}


function unmountChildren(prevChildren) {
  prevChildren.forEach((vnode) => {
    unmount(vnode);
  });
}

function patchArrayChildren(prevChildren, children, container, anchor = null) {
  const oldLength = prevChildren.length;
  const newLength = children.length;
  const commonLength = Math.min(oldLength, newLength);
  for(let i = 0; i < commonLength; i++){
    patch(prevChildren[i], children[i], container, anchor);
  }
  if(oldLength > newLength){
    unmountChildren(prevChildren.slice(commonLength));
  }
  if(newLength > oldLength){
    mountChildren(children.slice(commonLength), container, anchor);
  }
}

function patchChildren(prevVNode, vnode, container, anchor) {
  const { shapeFlag: prevShapeFlag, children: prevChildren} = prevVNode;
  const {shapeFlag, children} = vnode;
  if(shapeFlag & shapeFlags.TEXT_CHILDREN){
    if(prevShapeFlag & shapeFlags.TEXT_CHILDREN){
      container.textContent = vnode.textContent;
    } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
      unmountChildren(prevChildren);
      container.textContent = vnode.textContent;
    } else {
      container.textContent = vnode.textContent;
    }
  } else if(shapeFlags & shapeFlags.ARRAY_CHILDREN){
    if(prevShapeFlag & shapeFlags.TEXT_CHILDREN){
      container.textContent = '';
      mountChildren(children, container, anchor);
    } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
      patchArrayChildren(prevChildren, children, container, anchor);
    } else {
      mountChildren(children, container, anchor);
    }
  } else {
    if(prevShapeFlag & shapeFlags.TEXT_CHILDREN){
      container.textContent = '';
    } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
      mountChildren(children, container, anchor);
    }
  }
}
function patchElement(prevVNode, vnode) {
  vnode.el = prevVNode.el;
  patchProps(prevVNode.props, vnode.props, vnode.el);
  patchChildren(prevVNode, vnode, vnode.el);
}

function unmountFragement(vNode) {
// todo
  let { el: cur, anchor: end } = vNode;
  const parent = cur.parentNode;
  while(cur !== end){
    const next = cur.nextSibling;
    parent.removeChild(cur);
    cur = next;
  }
}


function unmountComponent(vNode) {
// todo

}

function processComponent(prevVNode, vnode, shapeFlag, anchor = null) {

}


function processText(prevVNode, vnode, container, anchor =null) {
  if(prevVNode){
    vnode.el = prevVNode.el;
    prevVNode.el.textContent = vnode.children;
  } else {
    mountText(vnode, container, anchor);
  }
}

function processFragment(prevVNode, vnode, container, anchor = null) {
  const fragmentStartAnchor = document.createTextNode('');
  const fragmentEndAnchor = document.createTextNode('');
  vnode.el = prevVNode? prevVNode.el: fragmentStartAnchor;
  vnode.anchor = prevVNode? prevVNode.anchor: fragmentEndAnchor;
  if(prevVNode){
    patchChildren(prevVNode, vnode, container, anchor);
  } else {
    container.insertBefore(fragmentStartAnchor, anchor);
    container.insertBefore(fragmentEndAnchor, anchor);
    mountChildren(vnode.children, container, fragmentEndAnchor);
  }
}


function mount(vnode, container){
  const { shapeFlag } = vnode;
  if(shapeFlag & ShapeFlags.ELEMENT){
    mountElement(vnode, container);
  } else if(shapeFlag & ShapeFlags.TEXT){
    mountText(vnode, container);
  } else if(shapeFlag & ShapeFlags.FRAGMENT){
    mountFragment(vnode, container);
  } else if(shapeFlag & ShapeFlags.COMPONENT){
    mountComponent(vnode, container);
  }
}




function mountElement(vnode, container, anchor = null){
  const { type, props, shapeFlag, child } = vnode;
  const el = document.createElement(type);
  // mountProps(el, props);
  patchProps(null, props, el);

  if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
    mountText(vnode, container);
  } else if(shapeFlag & ShapeFlags.FRAGMENT){
    mountChildren(child, container);
  }
  // container.appendChild(el);
  container.insertBefore(el, anchor);
  vnode.el = el;
}

function mountText(vnode, container) {
  const textNode = document.createTextNode(vnode.children);
  container.appendChild(textNode);
  vnode.el = textNode;
}
function mountFragment(vnode, container) {
  mountChildren(vnode, container);
}

function mountComponent(vnode, container){

}

function mountChildren(vnode, container, anchor) {
  vnode.forEach(child => {
      patch(null, child, container, anchor);
  })
}

function mountProps(el, props) {
  for(let key in props){
    let value = props[key];
    switch (key){
      case 'class':
        el.className = value;
        break;
      case 'style':
        for(let styleName in value){
          el.style[styleName] = value[styleName];
        }
        break;
      default:
        if(key[0] === 'o' && key[1] === 'n'){
          el.addEventListener(key.slice(2).toLowerCase(), value);
        }else if(domPropsRE.test(key)){
          if(value === '' && isBoolean(el[key])){
            value = true;
          }
        } else {
          if(value == null || value === false){
            el.removeAttribute(key);
          }else {
            el.setAttribute(key, value);
          }
        }
        break;
    }
  }
}

