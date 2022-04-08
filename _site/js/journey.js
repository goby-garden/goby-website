
let observers=[];
const presentSteps = [];
let topDist = window.scrollY;

window.addEventListener('load',function(){
  createObserver({
    root: null,
    rootMargin: `${document.body.clientHeight}px 0px -50% 0px`,
    threshold: [0.01, 0.99],
    callback: intersectionControl,
    step: '.step',
  });

})

function intersectionControl(entries){
  entries.forEach((item, i) => {
    let changed=false;
    let step=item.target;
    let boxIn=true;
    if (item.isIntersecting&&step.dataset.pos!=='in') {
      step.dataset.pos='in';
      changed=true;
      boxIn=true;
    } else if(!item.isIntersecting&&step.dataset.pos!=='out') {
      step.dataset.pos='out';
      changed=true;
      boxIn=false;
    }


    if(changed){
      let vid=document.querySelector(`.wrap[data-vid="${step.dataset.vidtrigger}"]`);
      if(boxIn){
        vid.classList.remove('hide');
      }else if(step.dataset.vidtrigger!=='1'){
        vid.classList.add('hide');
      }
    }
  });

}


function createObserver(d) {
  let callback = d.callback;

  let options = {
    root: d.root,
    rootMargin: d.rootMargin,
    threshold: d.threshold,
  };

  let storedVals = [];

  observers.push(new IntersectionObserver(callback.bind(topDist), options));
  let ind = observers.length - 1;

  presentSteps.push(0);
  let currentObserver = observers[ind];
  let presentStep = presentSteps[ind];
  let currentInd = observers.length - 1;
  document.querySelectorAll(d.step).forEach((item, i) => {
    storedVals.push({ ind: i, y: Infinity, r: 0, entered: false });
    item.dataset.step = i;
    item.dataset.global = ind;
    item.dataset.pos='out';
    currentObserver.observe(item);
  });
}
