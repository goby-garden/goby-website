
//placeholder values
let userId=182020;
let editMode=true;

let goby={
  tags:['lettuce','tomato','cheddar','patty','pickles','onions'],
  fields:[
    {key:'type',default:'entree'}
  ],
  blocks:[]
}


let channelContents;

// approaching-goby-u9rrzm6iqee
// screens-are-scary
// interesting-shapes
// good-personal-blogs
let slug='approaching-goby-u9rrzm6iqee';
let currentPage=1;
let per=10;
let chanLength;

let feed=d3.select('#channel-feed');

function startUp(){

  // interesting-shapes
  postRequest(slug,'contents');
  postRequest(slug,'meta')
  if(editMode==true){
    let theForm=d3.select('#item-meta').select('form');
    theForm.on('click',function(){
      theForm.classed('edit',true);
      d3.select('#submit-cancel').classed('edit',true);
      textAreaHeights(true);
    })
  }

  d3.select('#close-item').on('click',function(){
    d3.select('#item-meta').classed('open',false);
    exitForm()
  })
  d3.select('#cancel-form').on('click',exitForm);

  d3.select('#add-new-tag').on('input',newTagAdd)
}

function exitForm(){
  d3.selectAll('form').classed('edit',false);
  d3.select('#submit-cancel').classed('edit',false);
  if(d3.select('form').node().dataset.id!==undefined){
    tagFolder();
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
    console.log(jsonResponse)
    switch(mode){
      case 'contents':
      channelContents=jsonResponse.contents;
      fillChannel();
      break;
      case 'meta':
      fillMeta(jsonResponse);
      break;
      case 'update':
      channelContents=channelContents.concat(jsonResponse.contents);
      fillChannel();
      // feed.selectAll('div')
      //   .data(channelContents,d=>d);
      break;
    }

  }
  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", reqListener);

  let fetchurl;

  if(mode=='meta'){
    fetchurl=`https://api.are.na/v2/channels/${slug}?page=1&per=1`;
  }else{
    fetchurl=`https://api.are.na/v2/channels/${slug}/contents?sort=position&direction=desc&page=${currentPage}&per=${per}`;
    console.log(fetchurl);
    currentPage++;
  }
  oReq.open("GET", fetchurl);
  oReq.send();
}


function fillMeta(data){
  // document.querySelector('#channel-meta').insertAdjacentHTML('beforeend',data.metadata.description)
  // d3.select('#channel-name').html(data.title);
  document.querySelector('#channel-name').insertAdjacentHTML('beforeend',data.title);

  chanLength=data.length;

  d3.select('#username').html(data.user["full_name"]);
  if(data.metadata!==null){
    d3.select('#channel-description').html(data.metadata.description);
  }
}

let chanLines='<line class="line" x1="0%" x2="100%" y1="0%" y2="100%"></line><line class="line" x1="100%" x2="0%" y1="0%" y2="100%"></line>'


function fillChannel(){
  feed.selectAll('div')
    .data(channelContents,d => d)
    .join('div')
    .attr('id',d => 'bl-'+d.id)
    .attr('class','block')
    .each((d,i,nodes)=>{
      let cNode=d3.select(nodes[i]);
      if(d.image){
        cNode
        .append("div")
        .attr('class','img-wrap')
        .append('img')
        .attr('alt',d.title)
        .attr('srcset',`${d.image.thumb.url} 1x, ${d.image.large.url} 2x`)
      }else if(d["content_html"]){
        cNode.append('div').classed('text-block',true)
        cNode.select('.text-block').node().insertAdjacentHTML('afterbegin',d["content_html"]);
      }else if(d.class="Channel"){
        cNode.classed('channel-block',true);
        cNode.append('svg')
        cNode.select('svg').node().insertAdjacentHTML('afterbegin',chanLines);
      }
      cNode.append('p').attr('class','block-title emphasis').html(d.title);

      if(i==channelContents.length-1){
        cNode.classed('loadmore'+i,true);
        observing(i);
      }

      if(goby.blocks.find(bl => bl.id==d.id)==undefined){
        let newJson={
          id:d.id,
          tags:[],
          fields:[],
        }
        goby.fields.forEach((item, i) => {
          newJson.fields.push({
            key:item.key,
            val:item.default
          })
        });
        goby.blocks.push(newJson);
      }
    })
    .on('click',focusBlock);
}

function focusBlock(){
  exitForm();
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

let formTitle=bTitle.select('input');
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


function updateForm(blockData,metadata){
  let theForm=d3.select('#item-meta').select('form');
  theForm.classed('user-own',(blockData.user.id==userId)?true:false);

  if(blockData.title.length>0){
    itemTitle.html(blockData.title);
  }else{
    itemTitle.html('<span class="no-emph">Untitled</span>');
  }

  formTitle.property('value',blockData.title);

  itemDesc.html(blockData["description_html"]);
  formDesc.property('value',blockData["description"]);
  textAreaOnInput(formDesc.node());


  let gobyItem=goby.blocks.find(bl=>bl.id==blockData.id);

  theForm.node().dataset.id=blockData.id;
  tagFolder();


  // <div class="tag">
  //   <input type="checkbox" name="" value="">
  //   <p>cheese</p>
  // </div>

  console.log(gobyItem);
}

function newTagAdd(){
  console.log(event);
  if(event.data==','){
   let newTagVal=document.querySelector('#add-new-tag').value.replace(',','');
   document.querySelector('#add-new-tag').value='';
   goby.tags.push(newTagVal);

   let tagFolder=d3.select('#tag-folder')
   tagFolder.append('div').attr('class','tag')
   .attr('id','tag-'+newTagVal)
   .append('input')
   .attr('type','checkbox')
   let newTag=d3.select('#tag-'+newTagVal);
   newTag.append('p').html(newTagVal);
   newTag.select('input').property('checked',true)
  }
}


function tagFolder(){
  let theForm=d3.select('#item-meta').select('form');
  console.log(theForm.node().dataset.id);
  let gobyItem=goby.blocks.find(bl=>bl.id==theForm.node().dataset.id);

  let tagFolder=d3.select('#tag-folder')
  tagFolder.selectAll('.tag').remove();
  goby.tags.forEach((tag, i) => {
    tagFolder.append('div').attr('class','tag')
    .attr('id','tag-'+tag)
    .append('input')
    .attr('type','checkbox')
    let newTag=d3.select('#tag-'+tag);
    newTag.append('p').html(tag);
    if(gobyItem.tags.find(a=>a==tag)!==undefined){
      newTag.select('input').property('checked',true)
    }
  });
}

function observing(num){
  const scroller = scrollama();
  scroller
    .setup({
      step: ".loadmore"+num,
      once:true
    })
    .onStepEnter((response) => {
      if((per)*(currentPage - 1)<chanLength){
        postRequest(slug,'update')
      }
    })
  window.addEventListener("resize", scroller.resize);
}


window.addEventListener('load',startUp);
