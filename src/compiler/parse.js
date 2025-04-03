import {NodeTypes, ElementTypes, createRoot} from './ast';
import { isVoidTag, isNativeTag } from './index';
import { camelize } from '../utils';

function createParserContext(content) {
  return {
    source: content,
    options: {
      delimeters: ['{{', '}}'],
      isVoidTag, isNativeTag
    }
  };
}

function parseText(context) {
  let endIndex = context.source.length;
  const endTokens = ['<', context.options.delimeters[0]];
  for(let i = 0; i < endTokens.length; i++) {
    let index = context.source.indexOf(endTokens[i]);
    if(index !== -1 && index < endIndex) {
      endIndex = index;
    }
  }
  let content = parseTextData(context, endIndex);
  return {
    type: NodeTypes.TEXT,
    content,
  }
}
function parseTextData(context, length){
  const text = context.source.slice(0, length);
  advanceBy(context, length);
  return text;
}

function parseInterpolation(context) {
  const [open, close] = context.options.delimeters;
  advanceBy(context, open.length);

  const closeIndex = context.source.indexOf(close);
  const content = parseTextData(context, closeIndex);
  advanceBy(context, close.length);
  context.source.trim();
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
      isStatic: false,
    }
  };
}

function parseElement(context) {
  // start tag
  const element = parseTag(context);
  if(element.isselfClosing || context.options.isVoidTag(element.tag)) {
    return element;
  }

  // parseChildren
  element.children =parseChildren(context);

  parseTag(context);

  return element;
}

function isComponent(tag, context) {
  return !context.options.isNativeTag(tag);
}

function parseTag(context){
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceSpaces(context);
  const{props, directives } = parseAttributes(context);
  const isSelfClosing = context.source.startsWith('/>');
  advanceBy(context, isSelfClosing? 2: 1);
  const tagType = isComponent(tag, context)? ElementTypes.COMPONENT : ElementTypes.Element;

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType,
    props,
    directives,
    isSelfClosing,
    children: [],
  }
}

function parseAttributeValue(context) {
  const quote = context.source[0];
  advanceBy(context, 1);
  const endIndex = context.source.indexOf(quote);
  const content = parseTextData(context, endIndex);
  advanceBy(context, 1);
  return { content };
}

function parseAttribute(context) {
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  const name = match[0];
  advanceBy(context, name.length);
  advanceSpaces(context);
  let value;
  if(context.source[0] === '=') {
    advanceBy(context, 1);
    advanceSpaces(context);
    value = parseAttributeValue(context);
    advanceSpaces(context);
  }

  //// Directive
  if(/^(:|@|v-)/.test(name)){
    let dirName, argContent;

    if(name[0]===":"){
      dirName ='bind';
      argContent = name.slice(1);
    } else if(name[0]==="@"){
      dirName = 'on';
      argContent = name.slice(1);
    } else if(name.startsWith('v-')){
      [dirName, argContent] = name.slice(2).split(':');
    }
    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type:NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
      },
      arg: argContent && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: camelize(argContent),
        isStatic: true,
      },
    }
  }


  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
    },
  }
}

function parseAttributes(context){
  const props = [];
  const directives = [];
  while(context.source.length && !context.source.startsWith('>') && !context.source.startsWith('/>')){
    let attr = parseAttribute(context);
    if(attr.type === NodeTypes.DIRECTIVE){
      directives.push(attr);
    } else {
      props.push(attr);
    }
  }
  return { props, directives };
}

function parseChildren(context){
  const nodes = [];
  while(!isEnd(context)){
    const s = context.source;
    let node;
    if(s.startsWith(context.options.delimeters[0])){
      node = parseInterpolation(context);
    } else if(s[0] === '<'){
      node = parseElement(context);
    }else {
      node= parseText(context);
    }
    nodes.push(node);
  }

  //空白合并
  let removedWhitespaces = false;
  for(let i = 0; i < nodes.length; i++){
    const node = nodes[i];
    if(node.type === NodeTypes.TEXT){
      if (/[^\t\r\f\n ]/.test(node.content)) {
        // 文本节点有一些字符
        node.content = node.content.replace(/[\t\r\f\n ]+/g, ' ');
      } else {
        // 文本节点全是空白
        const prev = nodes[i - 1];
        const next = nodes[i + 1];
        if (
          !prev ||
          !next ||
          (prev.type === NodeTypes.ELEMENT &&
            next.type === NodeTypes.ELEMENT &&
            /[\r\n]/.test(node.content))
        ) {
          // 删除空白节点
          removedWhitespaces = true;
          nodes[i] = null;
        } else {
          node.content = ' ';
        }
      }
    }
  }
  return removedWhitespaces ? nodes.filter(Boolean) : nodes;
}

function isEnd(context){
  const s = context.source;
  return !s || s.startsWith('</');
}
function advanceBy(context, numberOfCharacters){
  context.source = context.source.slice(numberOfCharacters);
}
function advanceSpaces(context){
  const match = /^[\t\r\n\f ]+/.exec(context.source);
  if(match){
    advanceBy(context, match[0].length);
  }
}

export function parse(content){
  const context = createParserContext(content);
  const children = parseChildren(context);
  return createRoot(children);
}
