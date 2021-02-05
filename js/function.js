let editMode=true;



function startUp(){
  let slug='good-personal-blogs'
  // interesting-shapes
  postRequest(slug,'contents');
  postRequest(slug,'meta')

  if(editMode==true){
    let theForm=d3.select('#item-meta').select('form');
    theForm.on('click',function(){
      theForm.classed('edit',true);
      textAreaHeights(true);
    })
  }


}


function checkAuth(){
  var queryString=new URLSearchParams(window.location.search);
  let auth;
  if(queryString.get('code')!==null){
    document.querySelector('body').classList.add('authorized');
    auth=queryString.get('code');
  }else{
    console.log(queryString.get('code'));
  }
}



function postRequest(slug,mode){
  function reqListener () {
    var jsonResponse=JSON.parse(this.responseText);
    console.log(jsonResponse);
    if(mode=='contents'){
      fillChannel(jsonResponse)
    }else{
      fillMeta(jsonResponse);
    }

  }
  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", reqListener);

  let fetchurl;
  if(mode=='contents'){
    fetchurl=`https://api.are.na/v2/channels/${slug}/contents?sort=position&direction=desc&current_page=1&per=6`;
  }else{
    fetchurl=`https://api.are.na/v2/channels/${slug}?current_page=1&per=1`;
  }

  oReq.open("GET", fetchurl);
  oReq.send();
}


function fillMeta(data){
  // document.querySelector('#channel-meta').insertAdjacentHTML('beforeend',data.metadata.description)
  // d3.select('#channel-name').html(data.title);
  document.querySelector('#channel-name').insertAdjacentHTML('beforeend',data.title);
  d3.select('#username').html(data.user["full_name"]);
  if(data.metadata!==null){
    d3.select('#channel-description').html(data.metadata.description);
  }
}

function fillChannel(data){
  let feed=d3.select('#channel-feed')

  data.contents.forEach((block, i) => {
    feed.append('div').attr('id','bl-'+block.id).attr('class','block').datum(block);
    let domBlock=d3.select('#bl-'+block.id);
    if(block.image){
      domBlock
      .append('div').attr('class','img-wrap')
      .append('img')
      .attr('alt',block.title)
      .attr('srcset',`${block.image.thumb.url} 1x, ${block.image.large.url} 2x`)
    }
    domBlock.append('p').attr('class','block-title emphasis').html(block.title);
    domBlock.on('click',focusBlock);

  });
}

function focusBlock(){
  let theBlock=d3.select(event.currentTarget);
  d3.selectAll('.focused').classed('focused',false);
  theBlock.classed('focused',true);
  d3.select('#item-meta').classed('open',true);
  updateForm(theBlock.datum());

}

let bTitle=d3.select('#item-title');
let bDesc=d3.select('#item-description');
let bAuth=d3.select('#item-description');

let itemTitle=bTitle.select('.user-input');
let itemDesc=bDesc.select('.user-input');
let itemAuth=bAuth.select('.user-input');

let formTitle=bTitle.select('textarea');
let formDesc=bDesc.select('textarea');
let formAuth=bAuth.select('input');


//credit to DreamTeK on SO: https://stackoverflow.com/questions/454202/creating-a-textarea-with-auto-resize

function textAreaHeights(first){
  document.querySelectorAll('textarea').forEach((item, i) => {
    item.setAttribute('style', 'height:' + (item.scrollHeight) + 'px;overflow-y:hidden;');
    if(first){
      item.addEventListener("input", textAreaOnInput, false);
    }
  });
}

textAreaHeights(true);

// document.querySelectorAll('textarea').forEach((item, i) => {
//   item.setAttribute('style', 'height:' + (item.scrollHeight) + 'px;overflow-y:hidden;');
//   item.addEventListener("input", textAreaOnInput, false);
// });

function textAreaOnInput(node) {
  if(this.style!==undefined){
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  }else{
    node.setAttribute('style', 'height:' + (node.scrollHeight) + 'px;overflow-y:hidden;');
    node.style.height = 'auto';
    node.style.height = (node.scrollHeight) + 'px';
  }
}


window.addEventListener('resize',function(){
  d3.select('#item-meta').classed('open',false);
})


function updateForm(blockData,metadata){

  itemTitle.html(blockData.title);
  formTitle.property('value',blockData.title);
  textAreaOnInput(formTitle.node());

  itemDesc.html(blockData["description_html"]);
  formDesc.property('value',blockData["description"]);
  textAreaOnInput(formDesc.node());

  console.log(blockData);
}


window.addEventListener('load',startUp);

// http://api.are.na/v2/channels/magic-moments-ckavscg25hs?current_page=1&per=1
