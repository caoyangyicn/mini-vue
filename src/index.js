import { parse } from './compiler/parse';

console.log(JSON.stringify(parse(`<div id="foo" v-if="ok">hello {{ name }}</div>`)));

/**

 {
 "type": "ROOT",
 "children": [
 {
 "type": "ELEMENT",
 "tag": "div",
 "tagType": "ELEMENT",
 "props": [
 {
 "type": "ATTRIBUTE",
 "name": "id",
 "value": { "type": "TEXT", "content": "foo" }
 }
 ],
 "directives": [
 {
 "type": "DIRECTIVE",
 "name": "if",
 "exp": {
 "type": "SIMPLE_EXPRESSION",
 "content": "ok",
 "isStatic": false
 }
 }
 ],
 "isSelfClosing": false,
 "children": [
 { "type": "TEXT", "content": "hello " },
 {
 "type": "INTERPOLATION",
 "content": {
 "type": "SIMPLE_EXPRESSION",
 "isStatic": false,
 "content": "name"
 }
 }
 ]
 }
 ]
 }
 */