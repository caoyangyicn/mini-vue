import { isNumeric, isString } from '../utils';

export const ShapeFlag = {
  ELEMENT: 1,
  TEXT: 1 << 1,
  FRAGMENT: 1 << 2,
  COMPONENT: 1 << 3,
  TEXT_CHILDREN: 1 << 4,
  ARRAY_CHILDREN: 1 << 5,
  CHILDREN: (1 << 4) | (1 << 5),
}

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');
export function h(type, props, children){
  let shapeFlag = 0;
  if(typeof type === 'string'){
    shapeFlag = ShapeFlag.ELEMENT;
  } else if(type === Text){
    shapeFlag = ShapeFlag.TEXT;
  } else if(type === Fragment){
    shapeFlag = ShapeFlag.FRAGMENT;
  } else {
    shapeFlag = ShapeFlag.COMPONENT;
  }
  if(isString(children) || isNumeric(children)){
    shapeFlag |= ShapeFlag.TEXT_CHILDREN;
    children = children.toString();
  } else if(Array.isArray(children)){
    shapeFlag |= ShapeFlag.ARRAY_CHILDREN;
  }
  return {
    type,
    props,
    children,
    shapeFlag
  }
}