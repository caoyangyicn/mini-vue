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

function patchUnkeyedChildren(prevChildren, children, container, anchor = null) {
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

function patchKeyedChildren(prevChildren, children, container, anchor){
  let i = 0;
  let epre = prevChildren.length - 1;
  let npre = children.length - 1;
  while(i <= epre && i <= npre && prevChildren[i].key === children[i].key) {
    patch(prevChildren[epre], children[npre], container, anchor);
    i++;
  }
  while(i <= epre && i <= npre && prevChildren[epre].key === children[npre].key) {
    patch(prevChildren[epre], children[npre], container, anchor);
    epre--;
    npre--;
  }

  if(i > epre){
    for(let j = i; j <= npre; j++){
      const next = j + 1 <= npre? children[npre + 1].el: anchor;
      patch(null, children[j], container, next);
    }
  }else if(i > npre){
    for(let j = i; j <= epre; j++){
      unmount(prevChildren[j]);
    }
  }else {
    let maxNewIndexSoFar = 0;
    let move = false;
    const map = new Map();
    for(let j = i; j <= epre; j++){
      const prev = prevChildren[j];
      map.set(prev.key, {prev, j});
    }
    const toMounted = [];
    prevChildren.forEach((child, index) => {
      map.set(child.key, {child, index});
    });

    const source = new Array(npre -i + 1).fill(-1);
    for(let k = 0; k < children.length; k++) {
      const child = children[i];
      if(map.has(child.key)){
        const { prev, j } = map.get(child.key);
        patch(prev, child, container, anchor);
        if(j < maxNewIndexSoFar) {
          move = true;
        } else {
          maxNewIndexSoFar = j;
        }
        source[k] = j;
        map.delete(child.key);
      } else {
        toMounted.push(k + i);
      }
    }
    map.forEach(({ prev }) => {unmount(prev)});
    if(move){
      const seq = getSquence(source);
      let j = seq.length - 1;
      for(let k = seq.length - 1; k > 0; k--) {
        if(seq[j] === k){
          j--;
        } else {
          const pos = k + i;
          const nextPos = pos + 1;
          const curAnchor = (children[nextPos] && children[nextPos].el) || anchor;
          if(source[k] === -1){
            patch(null, children[pos], container, anchor,curAnchor);
          } else {
            container.insertBefore(children[pos].el, curAnchor);
          }
        }

      }
    } else if(toMounted.length > 0){
      for(let k = toMounted.length; k > 0; k--){
        const pos = toMounted[k];
        const nextPos = pos + 1;
        const curAnchor = (children[nextPos] && children[nextPos].el) || anchor;
        patch(null, children[pos], container, anchor,curAnchor);
      }
    }
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
      if(prevChildren[0] &&prevChildren[0].key != null && children[0] && children[0].key != null){
        patchKeyedChildren(prevChildren, children, container, anchor);
      } else {
        patchUnkeyedChildren(prevChildren, children, container, anchor);
      }
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
var getSquence = function (nums) {
  const arr = [nums[0]];
  const position = [0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === -1) {
      continue;
    }
    if (nums[i] > arr[arr.length - 1]) {
      arr.push(nums[i]);
      position.push(arr.length - 1);
    } else {
      let l = 0,
        r = arr.length - 1;
      while (l <= r) {
        let mid = ~~((l + r) / 2);
        if (nums[i] > arr[mid]) {
          l = mid + 1;
        } else if (nums[i] < arr[mid]) {
          r = mid - 1;
        } else {
          l = mid;
          break;
        }
      }
      arr[l] = nums[i];
      position.push(l);
    }
  }

  let cur = arr.length - 1;
  for (let i = position.length - 1; i >= 0 && cur >= 0; i--) {
    if (position[i] === cur) {
      arr[cur--] = i;
    }
  }
  return arr;
};



