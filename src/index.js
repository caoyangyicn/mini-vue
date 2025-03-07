// import { reactive } from './reactive/reactive';
// import { effect } from './reactive/effective';
import { ref } from './reactive/ref';
import { computed } from './reactive/computed';

// const observed = window.observed = reactive({ count: 0 });
// effect(() => {
//   console.log("observed.count is ", observed.count);
// });
// const foo = window.foo = ref(1);
// effect(() => {
//   console.log("foo.value is ", foo.value);
// });

const num = (window.num = ref(0));
const c = (window.c = computed(()=> {
  console.log('calculate c value');
  return num.value * 2;
}));