import { render } from './runtime/render';
import { h } from './runtime/vnode';
import { ref } from './reactive/ref';
import { nextTick } from './runtime/scheduler';
import { createApp } from './runtime';

createApp({
  setup(){
    const count = ref(0);
    const add = () => {
      count.value++;
      count.value++;
      count.value++;
      count.value++;
    }
    return {
      count,
      add
    };
  },
  render(ctx) {
    return [
      h('div', { id: 'div' }, ctx.count.value),
      h(
        'button',
        {
          id: 'btn',
          onClick: ctx.add,
        },
        'add'
      ),
    ];
  },
}).mount(document.body);

const div = document.getElementById('div');
const btn = document.getElementById('btn');
console.log(div.innerHTML);
btn.click();
nextTick(() => {
  console.log(div.innerHTML);
});
