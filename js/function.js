
/* global d3, marked */

// dom variables--------------------
let feed=d3.select('#channel-feed');
let formQs=document.querySelector('form');
let chanLines='<line class="line" x1="0%" x2="100%" y1="0%" y2="100%"></line><line class="line" x1="100%" x2="0%" y1="0%" y2="100%"></line>';

let options = {threshold: 0.24}
let observer = new IntersectionObserver(loadMore, options);

//data variables----------------
let currentPage=1;
let per=10;
let chanLength;

// this stores all the individual block data fetched from arena
let blocks=[];

// this stores the goby's special metadata for each block
let goby;

//this selects the channel that is fetched
let slug='gobies';
// screens-are-scary
// interesting-shapes
// good-personal-blogs
// printed-matter-o0fah7ijg3u
// approaching-goby-u9rrzm6iqee
// gobies





function startUp(){
  postRequest(slug,'meta');
  setUpButtons();
  textAreaHeights(true);
}

// api requests--------------

function postRequest(slug,mode){
  function reqListener () {
    var jsonResponse=JSON.parse(this.responseText);
    console.log(jsonResponse)
    switch(mode){
      case 'contents':
      console.log(jsonResponse.contents);
      handleNewData(jsonResponse.contents);
      break;
      case 'meta':
      fillMeta(jsonResponse);
      break;
      case 'update':
      handleNewData(jsonResponse.contents);
      // channelContents=channelContents.concat(jsonResponse.contents);
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
    currentPage++;
  }
  oReq.open("GET", fetchurl);
  oReq.send();
}


// data reception and management--------------------------

//fills in channel info on page
function fillMeta(data){
  //add channel name to header
  document.querySelector('#channel-name').insertAdjacentHTML('beforeend',data.title);
  //add username to header
  d3.select('#username').text(data.user["full_name"]);
  
  if(data.metadata!==null){
    d3.select('#channel-description').html(marked(data.metadata.description));
  }
  //record channel length in global var
  chanLength=data.length;

  //note to self:put a check here for errors in the future
  goby=JSON.parse(data.contents[0].content);
  postRequest(slug,'contents');
}

// adds each newly received block to blocks and goby based on 
function handleNewData(contents){
  let gobyChanged=false;
  console.log('new items:', contents);
  
  contents.forEach((block,b)=>{
    if(goby.blocks.find(a=>a.id==block.id)==undefined&&block.title!=="goby.json"){
      goby.blocks.push(newGobyBlock(block.id));
      gobyChanged=true;
    }
    if(blocks.find(a=>a.id==block.id)==undefined){
      blocks.push(block);
    }
  })
  console.log(blocks,goby);
  fillWithBlocks(blocks.filter(a=>a.title!=="goby.json"));
}

// builds a new data entry for goby using an id and goby's existing fields
function newGobyBlock(id){
  let newBlock={id:id};
  goby.manifest.forEach((field,f)=>{
    if(field.type=="array"){
      newBlock[field.key]=[];
    }else{
      newBlock[field.key]="";
    }
  })
  return newBlock;
}

// updates blocks in channel according to data, using d3
function fillWithBlocks(blockList){
  feed.selectAll('.block')
    .data(blockList,d => d)
    .join(
        enter => {
          let nBlock=enter.append('div')
          nBlock
            .append('p').attr('class','block-title emphasis').html(d=>d.title);
          nBlock
            .attr('id',d => 'bl-'+d.id)
            .attr('class','block');
          nBlock.append('svg').html(chanLines);
          console.log(nBlock);
          nBlock.filter((d, i) =>d.image)
            .append("div")
            .attr('class','img-wrap')
            .append('img')
            .attr('alt',d=>d.title)
            .attr('srcset',d=>`${d.image.thumb.url} 1x, ${d.image.large.url} 2x`);
          nBlock.filter((d, i) =>d["content_html"])
            .classed('text-block',true)
            .append('div')
            .classed('text-block-wrap',true)
            .html(d=>d["content_html"]);
          nBlock.filter((d, i) =>d.class=="Channel")
          .classed('channel-block',true);
          nBlock.on('click',openBlock)
          
        }
    )
  
  
    if(blocks.length<chanLength){
      observer.observe(document.querySelector('.block:last-child'));
    }
  
}


// handles the event of clicking on a block
function openBlock(){
  // will need conditionals for bulk editing (checking if you're pressing the shift-key)
  exitForm();
  let theBlock=d3.select(event.currentTarget);
  d3.selectAll('.focused').classed('focused',false);
  theBlock.classed('focused',true);
  d3.select('#item-meta').classed('open',true);
  updateForm(theBlock.datum());
  formQs.dataset.editing=theBlock.datum().id;
}


function setUpButtons(){
  d3.select('#close-item').on('click',function(){
    d3.select('#item-meta').classed('open',false);
  });
  
  // enters block edit mode
  d3.select('#edit-form').on('click',function(){
      d3.selectAll('.data-grouping').classed('edit',true);
      d3.select('#submit-cancel').classed('edit',true);
      textAreaHeights(true);
      document.querySelector('#item-title input').focus();
    })
  
  d3.select('#cancel-form').on('click',function(){
    let theBlock=blocks.find(a=>a.id==parseInt(formQs.dataset.editing))
    updateForm(theBlock);
    exitForm();
  });
  
  addNewSetUp();
  
}

function exitForm(){
  d3.selectAll('.data-grouping').classed('edit',false);
  d3.select('#submit-cancel').classed('edit',false);
  d3.select('#add-new').classed('panel-2',false);
}






// These two functions resize textarea inputs to fit the content inside them, which browsers don't do by default
//credit to DreamTeK on SO: https://stackoverflow.com/questions/454202/creating-a-textarea-with-auto-resize

function textAreaHeights(first){
  document.querySelectorAll('textarea').forEach((item, i) => {
    item.setAttribute('style', 'height:' + (item.scrollHeight) + 'px;overflow-y:hidden;');
    if(first){
      item.addEventListener("input", textAreaOnInput, false);
    }
  });
}

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


// this requests more blocks when someone scrolls down enough
function loadMore(entries){
  if(entries[0].isIntersecting){
    console.log(entries[0],'time to load more baby')
    observer.unobserve(entries[0].target);
    //I might add an event listener for scroll here that fires the postRequest
    // that way if the layout changes and the last block happens to come into view, the request won't fire until the scroll down for more stuff
    postRequest(slug,'update');
  }
}


function updateForm(blockData){
  
  
  // arena native ----------------
  let title=blockData.title.length>0?blockData.title:"<span class='no-emph'>untitled</span>"
  d3.select('#item-title p').html(title);
  d3.select('#item-title input').property('value',blockData.title);
  
  d3.select('#item-desc p').html(blockData["description_html"]);
  
  d3.select('#item-desc textarea').html(blockData.description);
  d3.select('#item-desc textarea').property('value',d3.select('#item-desc textarea').text());
  console.log(blockData);
  
  // arena goby-------------------
  let gobyBlock=goby.blocks.find(a=>a.id==blockData.id);
  d3.select('#arena-goby').selectAll('.form-section').remove();
  // this goes through each goby data field and makes a form section for it
  goby.manifest.forEach((sData,i)=>{ 
    
    generateSection(sData.type,sData.key,gobyBlock[sData.key],i,sData.values)
    


  })
  
  console.log(gobyBlock);
  
  // general----------------------
  d3.selectAll('form textarea').each((d,i,nodes)=>{
    textAreaOnInput(nodes[i]);
  })
  formQs.dataset.blocktype=blockData.class.toLowerCase();
  
}


function generateSection(type,key,value,index,existing){
  //add check for if index is defined and existing
  if(!index){
    index=document.querySelectorAll('#arena-goby .form-section').length;
    existing=[];
  }
  
  d3.select('#arena-goby')
      .append('div')
      .attr('class',"form-section type-"+type)
      .attr('id','section-'+index);
  let svg=`<svg class="inline form-edit" width="24" height="22"><use href="#${type}-icon"></svg>`;
  let newSection=d3.select('#section-'+index);
    newSection.append('label')
      .text(key+":")
      .node()
      .insertAdjacentHTML('afterbegin',svg);
  switch(type){
      case "array":
        existing.forEach((tag,t)=>{
          newSection.append('div').attr('class','tag').node().dataset.tag=t;
          let newTag=newSection.select(`[data-tag="${t}"]`);
          newTag.append('input').attr('type','checkbox');
          newTag.append('p').text(tag);
          // gobyBlock[sData.key]
          if(value.find(a=>a==tag)!==undefined){
            newTag.select('input').property('checked',true);
          }
        })
        newSection.append('div').attr('class','add-new-tag form-edit')
        .append('input').attr('class','new-tag-input').attr('type','text').attr('data-fieldname',key).attr('data-index',index).attr('tabindex',index+2);
          
        newSection.select('.add-new-tag')
        .append('button').attr('class','plus-button').attr('type','button').html('+').on('click',function(){
          let newString=d3.select(d3.event.target.parentNode).select('input').property('value');
          generateTag(newString,d3.select(d3.event.target.parentNode).select('input').node())
        });
        
      break;
      case "url":
        newSection.select('label').classed('form-edit',true);
        newSection.append('input').attr('class','form-edit').attr('type','text')
          .property('value',value)
          .attr('tabindex',index+2);
        newSection.append('a').attr('target','_blank').attr('class','form-display').text(key).attr('href',value)
        .node()
        .insertAdjacentHTML('afterbegin',svg);
      break;
      case "string":
        newSection.append('input').attr('type','text').attr('class','form-edit')
          .property('value',value)
          .attr('tabindex',index+2);
        newSection.append('p').attr('class','form-display short-text').text(value);
      break;
      case "par":
        newSection.append('textarea')
          .attr('class','form-edit')
          .html(value)
          .attr('tabindex',index+2);
        newSection.append('p').attr('class','form-display long-text').text(marked(value));
      break;
        
    }
}


function addNewSetUp(){
  d3.selectAll('button.choose-type').on('click',function(){
  d3.select('#add-new').attr('data-type',d3.event.currentTarget.dataset.type);
    d3.select('#add-new').classed('panel-2',true)
  })
  d3.select('button.back-to-select').on('click',function(){
    d3.select('#add-new').classed('panel-2',false);
  })
  
  d3.select('#add-field').on('click',function(){
    let newType=d3.select('#add-new').attr('data-type');
    let newKey=d3.select('#add-new input').property('value')
    addField(newType,newKey);
  })
}

function addField(type,key){
  if(!goby.manifest.find(a=>a.key==key)&&key!==''){
    console.log('here comes a new one:',type,key);
    d3.select('#add-new input').property('value','');
    d3.select('#add-new').classed('panel-2',false);
    generateSection(type,key,'');
    
  }
}






function generateTag(string,input){
  let currentGoby=goby.blocks.find(b=>b.id==formQs.dataset.editing)
  if(!goby.manifest.find(a=>a.key==input.dataset.fieldname).values.includes(string)&&string.length>0){
    input.value="";
    let countTags=document.querySelectorAll(`#section-${input.dataset.index} .tag`).length
    
    d3.select('#section-'+input.dataset.index).insert('div','.add-new-tag').attr('class','tag').node().dataset.tag=countTags;
    let newTag=d3.select(`.tag[data-tag="${countTags}"]`)
    newTag.append('input').attr('type','checkbox');
    newTag.append('p').text(string);
    newTag.select('input').property('checked',true);
    newTag.on('change',function(){
      d3.select(d3.event.currentTarget).remove();
    })
  }
}

window.addEventListener('keydown',function(){
  if(event.key=="Enter" &&document.activeElement){
    if(d3.select(document.activeElement).classed('new-tag-input')){
      generateTag(d3.select(document.activeElement).property('value'),d3.select(document.activeElement).node());
    }
  }
})


window.addEventListener('load',startUp);