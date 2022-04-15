
let observers=[];
const presentSteps = [];
let topDist = window.scrollY;

let ind=0;
let steps=0;

window.addEventListener('keydown',function(){


  if(event.key=='ArrowRight'){
    event.preventDefault();
    let next=document.querySelector(`.slide[data-step="${ind == steps? 0 : ind + 1 }"]`);
    let scrolltop=next.offsetTop;
    window.scroll({
      top:scrolltop,
      left:0,
      behavior:'smooth'
    })

    // console.log(next,scrolltop);
    // next.scrollIntoView();
  }else if(event.key=='ArrowLeft'){
    event.preventDefault();
    let i=ind == 0? steps : ind - 1;
    // if(i==2) i =1;
    let back=document.querySelector(`.slide[data-step="${i}"]`);
    let current=document.querySelector(`.slide[data-step="${ind}"]`)
    // back.scrollIntoView();
    let scrolltop=back.offsetTop;
    if(back.classList.contains('stick')&&current.parentNode==back.parentNode){
      scrolltop=scrolltop - window.innerHeight;
      ind=parseInt(back.dataset.step);
    }
    // console.log(scrolltop)
    window.scroll({
      top:scrolltop,
      left:0,
      behavior:'smooth'
    })

  }
})


window.addEventListener('load',function(){
  createObserver({
    root: null,
    rootMargin: `${document.body.clientHeight}px 0px -50% 0px`,
    threshold: [0.01, 0.99],
    callback: intersectionControl,
    step: '.slide',
  });
})

function intersectionControl(entries){
  entries.forEach((item, i) => {

    let allIn = item.intersectionRatio >= 0.99;
    let allOut = item.intersectionRatio <= 0.01;
    let step=item.target;

    if(!allIn&&!allOut){
      ind=parseInt(step.dataset.step);
      console.log(ind);
    }

    if(step.dataset.vidtrigger){
      let vid=document.querySelector(`.wrap[data-viditem="${step.dataset.vidtrigger}"]`);
      if(!allIn&&!allOut){
        vid.classList.remove('hide');
        vid.querySelector('video').currentTime=0;
      }else{
        vid.classList.add('hide');
      }
    }

    // if(step.dataset.pauseme){
    //
    //   // let vid=step.querySelector("video");
    //   if(!allIn&&!allOut){
    //     document.querySelectorAll('.slide[dataset-pauseme="true"]').forEach((item, i) => {
    //       let vid=item.querySelector("video");
    //       console.log(vid);
    //       if(item.dataset.step==step.dataset.step){
    //         vid.pause();
    //       }else{
    //         vid.play();
    //       }
    //     });
    //   }
    // }

  });

}

//



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

  // steps=d.step.length+1;

  document.querySelectorAll(d.step).forEach((item, i) => {
    storedVals.push({ ind: i, y: Infinity, r: 0, entered: false });
    item.dataset.step = i;
    item.dataset.global = ind;
    item.dataset.pos='out';
    currentObserver.observe(item);
    steps=i;
  });
}
