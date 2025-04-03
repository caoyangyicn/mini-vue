import { traverseNode } from './compile';
export function generate(ast) {
  const returns = traverseNode(ast);
  const code = `
with(ctx){
  const { h, Text, Fragment } = MiniVue;
  return ${returns}
}
`;
  return code;
}
