console.log('hello goby')



window.addEventListener('load',function(){
  domSetUp();
})


function domSetUp(){
  document.querySelectorAll('input[type="text"]').forEach((item, i) => {
    item.addEventListener('input',resizeInput);
    resizeInput.call(item);
  });

  document.querySelectorAll('.dropdown-module .dropdown-arrow').forEach((item, i) => {
    item.addEventListener('click',dropdownToggle);
  });

  document.querySelectorAll('.dropdown-items li').forEach((item, i) => {
    item.addEventListener('click',dropdownSelect);
  });
  document.querySelectorAll('.template-selector>li').forEach((item, i) => {
    item.addEventListener('click',itemSelect);
  });





}

function itemSelect(){
  if(this.classList.contains('select')){
    this.classList.remove('select');
  }else{
    let templateSelector=this.parentNode;
    templateSelector.querySelectorAll('li').forEach((item, i) => {
      item.classList.remove('select');
    });
    this.classList.add('select');
  }
}


function resizeInput() {
  //thanks https://stackoverflow.com/questions/3392493/adjust-width-of-input-field-to-its-input/3395975
  this.style.setProperty('--width', this.value.length + "ch");
}


function dropdownToggle(){
  let dropdown=this.parentNode;
  dropdown.dataset.dropped=dropdown.dataset.dropped=="true"?"false":"true";

}

function dropdownSelect(){
  let listContainer=this.parentNode;
  listContainer.querySelectorAll('li').forEach((item, i) => {
    item.classList.remove('choice');
  });
  this.classList.add('choice');
  listContainer.parentNode.dataset.dropped="false";
}
