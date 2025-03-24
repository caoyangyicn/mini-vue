const queue = [];
let isFlushing = false;
let resolvedPromise = Promise.resolve();
let currentFlushPromise = null;

export function nextTick(fn){
  const p = currentFlushPromise || resolvedPromise;
  return fn? p.then(fn): p;
}

function flushJobs() {
  try{
    for(let i = 0; i < queue.length; i++){
      const job = queue[i];
      job();
    }
  }finally {
    isFlushing = false;
    queue.length = 0;
    currentFlushPromise = null;
  }
}

function queueFlush() {
  if(!isFlushing){
    isFlushing = true;
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}

export function queueJob(job){
  if(!queue.length || !queue.includes(job)){
    queue.push(job);
    queueFlush();
  }
}

