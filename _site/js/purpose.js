const observers = [];
const presentSteps = [];
let topDist = window.scrollY;
let readMode='theory';
let passedIntro=false;

const aside={
  id:undefined,
  on:false
};

const passedEnd={
  theory:false,
  practice:false,
}

const essayBox=document.querySelector('#essays');

window.addEventListener('load',function(){
  createObserver({
    root: null,
    rootMargin: `${document.body.clientHeight}px 0px -50% 0px`,
    threshold: [0.01, 0.99],
    callback: intersectionControl,
    step: '.step',
  });


  navSetUp();


  footNotesSetUp('theory');
  footNotesSetUp('practice');

  document.querySelectorAll('.language-games span').forEach((item, i) => {
    item.style.setProperty('--count', i);
  });




})

function navSetUp(){
  document.querySelectorAll('.nav').forEach((item, i) => {

    item.addEventListener('mouseenter',function(){
      console.log(item);
      essayBox.dataset.selected=item.dataset.which;
    })
    item.addEventListener('mouseleave',function(){
      essayBox.dataset.selected=readMode;
    })
    item.addEventListener('click',function(){
      // essayBox.dataset.selected=item.dataset.which;
      readMode=item.dataset.which;

      if(passedIntro){
        scaleArticles(readMode);

      }else{
       document.querySelector('div[data-trigger="scale"]').scrollIntoView({behavior: "smooth"});
      }


      // scaleArticles(passedIntro?readMode:'center');
    })
  });
}


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
        passedIntro=boxIn;
        scaleArticles(boxIn?readMode:'center');
        break;
        case 'language-games':
        if(boxIn){
          step.classList.add('view');
        }else{
          step.classList.remove('view');
        }
        break;
      }
    }


  });

}


function footNotesSetUp(essay){

  let links=document.querySelectorAll('#'+essay+' .footnote-link');
  // let domNotes=document.querySelectorAll('#'+essay+' .footnote');
  let fdata=footnotes[essay];
  let panel=document.querySelector('#footnote-panel')

  links.forEach((item, i) => {


    if(item.dataset.type!=='crossover'){
      item.id=essay+'link'+item.dataset.id;
      let corresponding=document.querySelector(`#${essay}  .footnote[data-id="${item.dataset.id}"]`);
      corresponding.id=essay+'note'+item.dataset.id;
      corresponding.style.order=i;
      item.addEventListener('click',function(){
        corresponding.scrollIntoView();
        corresponding.classList.add('glow');
        setTimeout(function () {
          corresponding.classList.remove('glow');
        }, 300);
      })
      corresponding.querySelector('.return-top').addEventListener('click',function(){
        item.scrollIntoView();
        item.classList.add('glow');
        setTimeout(function () {
          item.classList.remove('glow');
        }, 500);
      })
    }else{
      item.addEventListener('click',function(){
        const otherEssay=essay=='theory'?'practice':'theory';
        const counterPart=document.querySelector(`#${otherEssay} span[data-type="crossover"][data-id="${item.dataset.id}"]`);

        if(readMode!=='center'){
          console.log(readMode)
          readMode='center';
          scaleArticles('center');
          setTimeout(function () {
            let yPos=window.scrollY + counterPart.getBoundingClientRect().top - window.innerHeight/2;
            window.scrollTo({left:0,top:yPos,behavior:'smooth'});
            glowInOut(counterPart);
            // counterPart.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
          }, 1000);
        }else{
          let yPos=window.scrollY + counterPart.getBoundingClientRect().top - window.innerHeight/2;
          window.scrollTo({left:0,top:yPos,behavior:'smooth'});
          glowInOut(counterPart);
        }
        // console.log(counterPart);
      })
    }

    function glowInOut(el){
      setTimeout(function () {
        el.classList.add('glow');
        setTimeout(function () {
          el.classList.remove('glow');
        }, 1000);
      }, 500);

    }

    item.addEventListener('mouseover',function(){
      console.log(item);
      switch(item.dataset.type){
        case 'comment':
        aside.on=true;
        panel.classList.add('on');
        panel.style.left=checkPos(event.clientX,'x')+'px';
        panel.style.top=checkPos(event.clientY,'y')+'px';
        if(aside.id!==item.dataset.id){
          panel.querySelector('.f-content').innerHTML=fdata.find(a=>a.id==item.dataset.id).html;
        }
        panel.style.border=`1px solid ${essay=='theory'?'darkviolet':'green'}`;
        break;
        case 'expand':
        document.querySelector(`.real-blockquote[data-id="${item.dataset.id}"]`).classList.add('possible');
        break;
      }

    })

    item.addEventListener('mouseleave',function(){
      aside.on=false;
      panel.classList.remove('on');

      if(item.dataset.type=='expand'){
        document.querySelector(`.real-blockquote[data-id="${item.dataset.id}"]`).classList.remove('possible');
      }
    })

    item.addEventListener('mousemove',function(){
      panel.style.left=checkPos(event.clientX,'x')+'px';
      panel.style.top=checkPos(event.clientY,'y')+'px';
    })

    function checkPos(offset,dimension){
      let backset=dimension=='x'?panel.offsetWidth/2:-15;
      let dist=offset+(dimension=='x'?panel.offsetWidth:panel.offsetHeight) + 20 - backset;
      let span=dimension=='x'?window.innerWidth:window.innerHeight;
      let returnVal=offset - backset;

      if(dist>span){
        returnVal=offset - (dist-span);
      }

      if(returnVal<0){
        returnVal=0;
      }

      return returnVal;

      // if(dist>span){
      //   return offset - (dist-span);
      // }else if(dimension=='x' && ){
      //
      // }else{
      //   return offset - backset;
      // }
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

    // setTimeout(function () {
    //   console.log(passedEnd[mode])
    //   if(passedEnd[mode]){
    //     document.querySelector('div[data-trigger="scale"]').scrollIntoView({behavior: "smooth"});
    //   }
    // }, 300);
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
