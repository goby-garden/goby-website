const observers = [];
const presentSteps = [];
let topDist = window.scrollY;
let readMode='theory';

const essayBox=document.querySelector('#essays');

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
      console.log('in');
    } else if(!item.isIntersecting&&step.dataset.pos!=='out') {
      step.dataset.pos='out';
      changed=true;
      boxIn=false;
      console.log('out');
    }


    if(changed){
      switch(step.dataset.trigger){
        case 'scale':
        scaleArticles(boxIn?readMode:'center');
        break;
      }
    }


  });

}

function scaleArticles(mode){
  console.log(essayBox);
  essayBox.className=mode;
  if(document.querySelector('.active')){
    document.querySelector('.active').classList.remove('active');
  }
  if(mode!=='center'){
    document.querySelector('#'+mode).classList.add('active');
  }

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
