import { parse } from './parse';
import { generate } from './codegen';
import { NodeTypes } from './ast';
import { capitalize } from '../utils';

export function compile(template){
  const ast = parse(template);
  return generate(ast);
}

function createTextNode(node) {
  const child = createText(node);
  return `h(Text, null, ${child})`;
}


function createText({isStatic=true, content=''}){
  return isStatic ? JSON.stringify(content) : content;
}

function traverseChildren(node) {
  const { children } = node;
  if(children.length === 1){
    const child = children[0];
    if(child.type === NodeTypes.TEXT){
      return createText(child);
    }
    if(child.type === NodeTypes.INTERPOLATION){
      return createText(child.content);
    }
  }
  const results = [];
  for(let i = 0; i < children.length; i++){
    const child = children[i];
    results.push(traverseNode(child));
  }
  return `[${results.join(',')}]`;
}

function createPropsArr(node) {
  const {props, directives} = node;
  return [...props.map(prop => {
    return `${prop.name}: ${createText(prop.value)}`;
  }), ...directives.map(directive => {
      switch (directive.name) {
        case 'bind':
          return `${directive.arg.content}: ${createText(directive.exp)}`;
        case 'on':
          const eventName = `on${capitalize(directive.arg.content)}`;
          let exp = directive.exp.content;
          if (/\([^)]*?\)$/.test(exp) && !exp.includes('=>')) {
            exp = `$event => (${exp})`;
          }
          return `${eventName}:${exp}`;
        case 'html':
          return `innerHTML: ${createText(directive.exp)}`;
        default:
          return `${directive.name}: ${createText(directive.exp)}`;
      }
  })
  ]
}

function createElementNode(node) {
  const { children } = node;
  const tag = JSON.stringify(node.tag);
  const propsArr = createPropsArr(node);
  const propsStr = propsArr.length ? `{${ propsArr.join(',') }}`: 'null';
  if(!children.length){
    if(propsStr === 'null'){
      return `h(${tag})`;
    }
    return `h(${tag}, ${propsStr})`;
  }
  let childrenStr = traverseChildren(node);
  return `h(${tag}, ${propsStr}, ${childrenStr})`;
}

export function traverseNode(node){
  switch(node.type){
    case NodeTypes.ROOT:
      if(node.children.length ===1){
        return traverseNode(node.children[0]);
      }
      const result = traverseChildren(node);
      return result;
    case NodeTypes.ELEMENT:
      return createElementNode(node);
    case NodeTypes.TEXT:
      return createTextNode(node);
    case NodeTypes.INTERPOLATION:
      return createTextNode(node.content);
  }
}