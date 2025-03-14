import { ShapeFlag as shapeFlags, ShapeFlag as ShapeFlags } from './vnode';
import { patchProps } from './patchProps';

export function render(vnode, container){
  let prevVNode = container._vnode;
  if(!vnode) {
    if(prevVNode){
      unmount(prevVNode);
    }
  }else {
    patch(prevVNode, vnode, container);
  }
  container._vnode = vnode;
}

function isSameVnode(prevVNode, vnode) {
  return prevVNode.type === vnode.type;
}

function patch(prevVNode, vnode, container, anchor = null) {
  if(prevVNode && !isSameVnode(prevVNode, vnode)){
    anchor = (prevVNode.anchor || prevVNode.el).nextSibling;
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

function processElement(prevVNode, vnode, container, anchor = null) {
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
      container.textContent = children;
    } else if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
      unmountChildren(prevChildren);
      container.textContent = children;
    } else {
      container.textContent = children;
    }
  } else if(shapeFlag & shapeFlags.ARRAY_CHILDREN){
    if(prevShapeFlag & shapeFlags.TEXT_CHILDREN){
      container.textContent = '';
      mountChildren(children, container, anchor);
    } else if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
      patchArrayChildren(prevChildren, children, container, anchor);
    } else {
      mountChildren(children, container, anchor);
    }
  } else {
    if(prevShapeFlag & shapeFlags.TEXT_CHILDREN){
      container.textContent = '';
    } else if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
      unmountChildren(prevChildren);
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
  const preText = document.createTextNode('');
  const endText = document.createTextNode('');
  vnode.el = prevVNode? prevVNode.el: preText;
  vnode.anchor = prevVNode? prevVNode.anchor: endText;
  const fragmentStartAnchor = vnode.el;
  const fragmentEndAnchor = vnode.anchor;
  if(prevVNode){
    patchChildren(prevVNode, vnode, container, fragmentEndAnchor);
  } else {
    container.insertBefore(fragmentStartAnchor, anchor);
    container.insertBefore(fragmentEndAnchor, anchor);
    mountChildren(vnode.children, container, fragmentEndAnchor);
  }
}

function mountElement(vnode, container, anchor = null){
  const { type, props, shapeFlag, children } = vnode;
  const el = document.createElement(type);
  patchProps(null, props, el);

  if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
    mountText(vnode, el);
  } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
    mountChildren(children, el);
  }
  container.insertBefore(el, anchor);
  vnode.el = el;
}

function mountText(vnode, container, anchor =null) {
  const textNode = document.createTextNode(vnode.children);
  container.insertBefore(textNode, anchor);
  vnode.el = textNode;
}

function mountChildren(vnode, container, anchor) {
  vnode.forEach(child => {
      patch(null, child, container, anchor);
  })
}



