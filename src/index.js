import { render } from './runtime/render';
import { h } from './runtime/vnode';
import { ref } from './reactive/ref';

let Comp= {
  setup(){
    const count = ref(0);
    const add = () => {
      count.value++;
    }
    return {
      count,
      add
    };
  },
  render(ctx) {
    return [
      h('div', null, ctx.count.value),
      h(
        'button',
        {
          onClick: ctx.add,
        },
        'add'
      ),
    ];
  },
};

const vnode = h(Comp);
render(vnode, document.body);
