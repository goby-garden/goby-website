console.log('hello goby')
let kitchen=document.querySelector('#property-kitchen');
let recipePanel=document.querySelector('.recipe-panel-wrapper');
let createPropertyButton=document.querySelector('.create-property');

var  svgns = "http://www.w3.org/2000/svg";
var  xlinkns = "http://www.w3.org/1999/xlink";


let templates=[
  {
    name:'String',
    id:0,
    type:'data',
    set:'single'
  },
  {
    name:'Category',
    id:1,
    inputLabel:'using ',
    input:'select-role',
    type:'asym',
    set:'single'
  },
  {
    name:'Tag',
    id:2,
    inputLabel:'using ',
    input:'select-role',
    type:'asym',
    set:'multiple'
  },
  {
    name:'Hierarchy',
    id:3,
    inputLabel:'of ',
    input:'select-role',
    type:'asym',
    set:'multiple'
  }
]

let ontology={
  objects:[],
  properties:[],
  roles:[
    {
      name:'Text',
      id:0,
      properties:[]
    },
    {
      name:'Author',
      id:1,
      properties:[]
    },
    {
      name:'Publisher',
      id:2,
      properties:[]
    }
  ]
}

//create classes for each component






window.addEventListener('load',function(){
  domSetUp();
  document.querySelector('.begin-property').addEventListener('click',function(){
    kitchen.dataset.state='begin-new';
    recipePanel.dataset.open="true";
    newPropertyModule();
  })
})

//module generation--------------------------

function newPropertyModule(){
  let property=document.createElement('div');
  property.className='margin-box define-property';
  property.appendChild(newDeclarationModule());
  let recipeSection=document.createElement('div');
  recipeSection.className='recipe-section ia-writer';
  property.appendChild(recipeSection);
  kitchen.querySelector('.property-sandbox').insertBefore(property,createPropertyButton);

  // .appendChild(property);
  domSetUp(property);


  //remember to trigger event listener check
}

function newDeclarationModule(){
  let declaration=document.createElement('div');
  declaration.className='inline declaration ia-writer';
  declaration.appendChild(newStringModule('new property'));
  declaration.appendChild(document.createTextNode(" for "));
  declaration.appendChild(newDropDownModule('roles'));

  return declaration;
}

function newDropDownModule(type,selected){
  selected = selected ? selected:0;

  let dropdown=document.createElement('span');
  dropdown.className='dropdown-module';
  dropdown.dataset.dropped='false';
  let borderWrapper=document.createElement('div');
  borderWrapper.className='border-wrapper';
  let dropdownList=document.createElement('ul');
  dropdownList.className='dropdown-items plex';
  if(type=='roles'){
    ontology.roles.forEach((item, i) => {
      dropdownList.appendChild(newRoleItem(item.name,item.id,i==selected?'choice':''))
    });
    dropdownList.appendChild(newRoleItem('create-new','create-new','create-new'));
  }
  borderWrapper.appendChild(dropdownList);
  borderWrapper.appendChild(newIconButton('arrow-icon','dropdown-arrow'));
  borderWrapper.appendChild(newIconButton('target-icon','target'));
  dropdown.appendChild(borderWrapper);

  return dropdown;
}

function newRoleItem(name,id,domClass){
  let li=document.createElement('li');
  li.className=domClass;
  li.dataset.id=id;
  let span=document.createElement('span');
  span.className='list-style-wrap';
  span.appendChild(newIcon('solid-circle-icon',20));
  if(name=='create-new'){
    let input=document.createElement('input');
    input.className='plex compact';
    input.type='text';
    input.value='new role';
    span.appendChild(input);
  }else{
    span.appendChild(document.createTextNode(` ${name}`));
  }
  li.appendChild(span);

  return li;
}

function newIconButton(id,domClass){
  let button=document.createElement('button');
  button.className=domClass;
  button.appendChild(newIcon(id,20));
  return button;
}

function newIcon(id,size){
  let newSvg=document.createElementNS("http://www.w3.org/2000/svg", "svg");
  newSvg.setAttribute('class', 'inline');
  newSvg.setAttribute('width', size);
  newSvg.setAttribute('height', size);
  newSvg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
  // newSvg.innerHTML=`<use href="#${id}">`;
  let newUse = document.createElementNS(svgns, "use");
  newUse.setAttributeNS(xlinkns, "href", "#"+id);
  newSvg.appendChild(newUse);
  return newSvg;
}

function newStringModule(value){
  let stringModule=document.createElement('span');
  stringModule.className='string-module';
  let input=document.createElement('input');
  input.className='plex';
  input.type='text';
  input.value=value;
  stringModule.appendChild(input);
  // input.addEventListener('input',resizeInput);
  // resizeInput.call(input);
  return stringModule;
}


function newRecipeModule(type,id,param){
  let recipeModule=document.createElement('div');
  recipeModule.className='recipe';
  // recipeModule.dataset.ready='true';
  switch(type){
    case 'template':
    let templateSelector=document.createElement('div');
    templateSelector.appendChild(document.createTextNode("Define..."));
    templateSelector.appendChild(newSelectorModule('template',id));
    let specialParam=document.createElement('div');
    specialParam.className='special-parameters';
    templateSelector.appendChild(specialParam);
    recipeModule.appendChild(templateSelector);
    specialParamInput(recipeModule,id,param)
    break;
  }
  domSetUp(recipeModule);
  recipeCheck(recipeModule)
  return recipeModule;
}

function newSelectorModule(type,selected){
  let ul=document.createElement('ul');
  ul.className='item-selector-module plex';
  ul.dataset.type=type;
  switch(type){
    case 'template':
    templates.forEach((item, i) => {
      let li=document.createElement('li');
      li.className=`noselect ${item.id==selected?'select':''}`;
      li.dataset.id=item.id;
      li.appendChild(document.createTextNode(item.name));
      ul.appendChild(li);
    });
    break;
  }
  return ul;
}



// dom data checks------------------------------
function recipeCheck(recipe){
  let ready="false";
  let recipeSelected=recipe.querySelector('.item-selector-module .select');
  if(recipeSelected){
    ready="true";
    //add checks for role in the future
  }
  recipe.dataset.ready=ready;
}




// module manipulation-------------------------
function domSetUp(root){
  //event delegation
  root=root?root:document;

  root.querySelectorAll('input[type="text"]').forEach((item, i) => {
    item.addEventListener('input',resizeInput);
    resizeInput.call(item);
  });

  root.querySelectorAll('.dropdown-module .dropdown-arrow').forEach((item, i) => {
    item.addEventListener('click',dropdownToggle);
  });

  root.querySelectorAll('.dropdown-items li').forEach((item, i) => {
    item.addEventListener('click',dropdownSelect);
  });
  root.querySelectorAll('.item-selector-module>li').forEach((item, i) => {
    item.addEventListener('click',itemSelect);
  });

  root.querySelectorAll('.add-button').forEach((item, i) => {
    item.addEventListener('click',applyRecipe);
  });

}

function itemSelect(){
  let toggleOff=false;
  let itemSelector=this.parentNode;
  if(this.classList.contains('select')){
    this.classList.remove('select');
    toggleOff=true;
  }else{

    itemSelector.querySelectorAll('li').forEach((item, i) => {
      item.classList.remove('select');
    });
    this.classList.add('select');
  }
  switch(itemSelector.dataset.type){
    case 'template':
    specialParamInput(itemSelector.parentNode,toggleOff?'':this.dataset.id);
    recipeCheck(itemSelector.parentNode.parentNode);
    break;
  }
}


function applyRecipe(){
  let recipe=this.parentNode;
  if(recipe.dataset.ready=="true"&&!recipe.classList.contains('apply')){
    recipe.classList.add('apply');
    kitchen.dataset.state='placing';
    let offsetTop=recipe.offsetTop;
    let offsetLeft=recipe.offsetLeft;
    let origin={x:0,y:0};
    window.addEventListener('resize',resetOrigin);
    recipePanel.addEventListener('scroll',resetOrigin);
    window.addEventListener('mousemove',mousemove)
    window.addEventListener('click',click);
    window.addEventListener('keydown',keydown);
    let clickedOnce=false;
    function click(){
      if(clickedOnce==true){
        endMove();
        if(event.target.classList.contains('recipe-section')){
          console.log('apply');
          let recipeContainer=event.target;
          let chosenTemplate=recipe.querySelector('.item-selector-module .select').dataset.id;
          let chosenRole=chosenTemplate==0?undefined:recipe.querySelector('.choice').dataset.id;
          let newRecipe=newRecipeModule('template',chosenTemplate,chosenRole);
          recipeContainer.appendChild(newRecipe);
          recipePanel.dataset.open="false";
        }
      }else{
        clickedOnce=true;
      }
    }

    function keydown(){
      if(event.code=='Escape'){
        endMove();
      }
    }

    function mousemove(){
      recipe.style.setProperty('--x-offset', event.clientX - (origin.x + origin.width));
      recipe.style.setProperty('--y-offset', event.clientY - origin.y);
    }
    resetOrigin();
    function resetOrigin(){
      recipe.style.setProperty('--x-offset', 0);
      recipe.style.setProperty('--y-offset', 0);
      let bRect=recipe.getBoundingClientRect();
      origin.x=bRect.left;
      origin.y=bRect.top;
      origin.width=bRect.width;
    }
    function endMove(){
      console.log('end');
      window.removeEventListener('resize',resetOrigin);
      window.removeEventListener('click',click);
      window.removeEventListener('mousemove',mousemove);
      window.removeEventListener('keydown',keydown)
      recipePanel.removeEventListener('scroll',resetOrigin);
      recipe.classList.remove('apply');
      kitchen.dataset.state='begin-new';
    }
  }


}

function specialParamInput(recipe,id,selected){
  let specialParams=recipe.querySelector('.special-parameters');
  specialParams.innerHTML='';
  let template=templates.find(a=>a.id==parseInt(id));

  if(template&&template.input){
    let newParam=document.createElement('span');
    let label=document.createElement('label');
    label.innerText=template.inputLabel;
    newParam.appendChild(label);
    newParam.appendChild(newDropDownModule('roles',selected));
    specialParams.appendChild(newParam);
    domSetUp(specialParams);
  }
}

function resizeInput() {
  //thanks https://stackoverflow.com/questions/3392493/adjust-width-of-input-field-to-its-input/3395975
  this.style.setProperty('--width', this.value.length + "ch");
}

function dropdownToggle(){
  let dropdown=this.parentNode.parentNode;
  dropdown.dataset.dropped=dropdown.dataset.dropped=="true"?"false":"true";

}

function dropdownSelect(){
  let listContainer=this.parentNode.parentNode;
  listContainer.querySelectorAll('li').forEach((item, i) => {
    item.classList.remove('choice');
  });
  this.classList.add('choice');
  listContainer.parentNode.dataset.dropped="false";
}
