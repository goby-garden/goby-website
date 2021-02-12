
//placeholder values
let userId=182020;
let editMode=true;


let goby;

let gobyS={
  tags:['lettuce','tomato','cheddar','patty','pickles','onions'],
  fields:[
    {key:'type',default:'entree'}
  ],
  blocks:[]
}

let gobyF={"tags":["lettuce","tomato","cheddar","patty","pickles","onions"],"fields":[{"key":"type","default":"entree"}],"blocks":[{"id":10627054,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":10521773,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":10149541,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":9909165,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":9708562,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":9683239,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":9507460,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":9501650,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":9500615,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":9430764,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":9352498,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":9352422,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":9352414,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":9352393,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":9352381,"tags":[],"fields":[{"key":"type","val":"entree"}]},{"id":9352379,"tags":[],"fields":[{"key":"type","val":"entree"}]}]};


let channelContents;
let totalLength=0;
let metaArray=[];

//dom stuff
let theForm=d3.select('#item-meta').select('form');

let bTitle=d3.select('#item-title');
let bDesc=d3.select('#item-description');
let bAuth=d3.select('#item-author');
let bOrig=d3.select('#item-origin');

let itemTitle=bTitle.select('.user-input');
let itemDesc=bDesc.select('.user-input');
let itemAuth=bAuth.select('.user-input');
let itemOrig=bOrig.select('.user-input');

let formTitle=bTitle.select('input');
let formDesc=bDesc.select('textarea');
let formAuth=bAuth.select('input');
let formOrig=bOrig.select('input');


// screens-are-scary
// interesting-shapes
// good-personal-blogs
let slug='approaching-goby-u9rrzm6iqee';
let currentPage=1;
let per=10;
let chanLength;

let formOpen=false;


let feed=d3.select('#channel-feed');

function startUp(){
  postRequest(slug,'meta');
  if(editMode==true){
    d3.select('#edit-form').on('click',function(){
      if(formOpen==false){
        theForm.classed('edit',true);
        d3.select('#submit-cancel').classed('edit',true);
        textAreaHeights(true);
        formOpen=true;
      }
    })
  }

  d3.select('#close-item').on('click',function(){
    d3.select('#item-meta').classed('open',false);
    exitForm()
  })
  d3.select('#cancel-form').on('click',exitForm);
  d3.select('#submit-form').on('click',submitBlockData);
  d3.select('#add-new-tag').on('input',newTagAdd)
}

function exitForm(){
  d3.selectAll('form').classed('edit',false);
  d3.select('#submit-cancel').classed('edit',false);
  if(d3.select('form').node().dataset.id!==undefined){
    tagFolder();
  }
  setTimeout(function () {
    formOpen=false;
  }, 50);
}

function submitBlockData(){
  let oldData=metaArray.find(a=>a.id==theForm.node().dataset.id);
  let blockHasChanged=false;
  let gobyHasChanged=false;
  if(formTitle.property('value')!==oldData.b.title){
    oldData.b.title=formTitle.property('value');
    blockHasChanged=true;
    console.log('title changed')
  }
  if(formDesc.property('value')!==oldData.b.description){
    oldData.b.description=formDesc.property('value');
    oldData.b["description_html"]=marked(formDesc.property('value'));
    blockHasChanged=true;
    console.log('description changed',oldData.b.description);
  }
  if(formAuth.property('value')!==oldData.g.author){
    oldData.g.author=formAuth.property('value');
    gobyHasChanged=true;
    console.log('author changed')
  }
  if(formOrig.property('value')!==oldData.g.origin){
    oldData.g.origin=formOrig.property('value');
    gobyHasChanged=true;
    console.log('origin changed');
  }
  let newArr=[];
  document.querySelectorAll('.tag>input').forEach((item, i) => {
    let tagVal=item.dataset.tag;
    if(item.checked==true){
      newArr.push(tagVal);
    }
    // let tagVal=item.dataset.tag;
    // if(oldData.tags.find(a=>a==tagVal)==undefined){
    //   if(item.checked==true){
    //     oldData.tags.push(tagVal);
    //   }
    // }else{
    //   if(item.checked==false){
    //     oldData.tags=oldData.tags.filter(a=>a!==tagVal);
    //   }
    // }
  });

  if(!gobyHasChanged){
    checkAforB(oldData.g.tags,newArr);
    if(!gobyHasChanged){
      checkAforB(newArr,oldData.g.tags);
    }
  }else{
    oldData.g.tags=newArr;
  }

  exitForm();
  updateForm(oldData);


  function checkAforB(arrayA,arrayB){
    for(let i=0;i<arrayB.length;i++){
      if(arrayA.includes(arrayB[i])==false){
        gobyHasChanged=true;
        break;
      }
    }
    if(gobyHasChanged){
      oldData.g.tags=newArr;
    }
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


function metaArrayBuild(){
  //an array with all block data (.b), goby block data (.g), and yet unknown blocks

  for(let i=0; i<totalLength; i++){

      if(i<channelContents.length){
        metaArray.push({b:channelContents[i],id:channelContents[i].id});
      }else{
        if(i!==totalLength-1){
          metaArray.push({b:undefined,id:undefined});
        }
      }

  //for statement
  }


  metaArray.forEach((item, i) => {
    if(item.id!==undefined){
      doesGobyKnow(item);
    }
  });

  let outstanding=goby.blocks.filter(gBl=>metaArray.find(bl => bl.id==gBl.id)==undefined);
  outstanding.forEach((block, b) => {
    let unfilledItem=metaArray.find(bl => bl.id==undefined);
    unfilledItem.id=block.id;
    unfilledItem.g=block;
  });

  console.log(metaArray);
}

function doesGobyKnow(newBl){
  let found=goby.blocks.find(bl => bl.id==newBl.id)
  if(found!==undefined){
    newBl.g=found;
  }else{
    let newJson={
      id:newBl.id,
      tags:[],
      fields:[],
      author:"",
      origin:newBl.b!==undefined?((newBl.b.class=="Link")?newBl.b.source.url:""):""
    }
    goby.fields.forEach((field, f) => {
      newJson.fields.push({
        key:field.key,
        val:field.default
      })
    });
    goby.blocks.push(newJson);
    newBl.g=goby.blocks.find(bl => bl.id==newBl.id);
  }
}


function fillMetaArray(fetchedItems){
  fetchedItems.forEach((item, i) => {
    let found=metaArray.find(bl=>bl.id==item.id);
    if(found!==undefined){
      found.b=item;
    }else{
      if(item.title!=='goby.json'){
        let newDef=metaArray.find(bl=>bl.id==undefined)
        newDef.b=item;
        newDef.id=item.id;
      }
    }
    let resetFound=metaArray.find(bl=>bl.id==item.id);
    if(resetFound!==undefined){
      doesGobyKnow(resetFound);
    }

  });
}




function postRequest(slug,mode){
  function reqListener () {
    var jsonResponse=JSON.parse(this.responseText);
    console.log(jsonResponse)
    switch(mode){
      case 'contents':
      channelContents=jsonResponse.contents;
      metaArrayBuild();
      fillChannel();
      break;
      case 'meta':
      totalLength=jsonResponse.length;
      fillMeta(jsonResponse);
      break;
      case 'update':
      channelContents=channelContents.concat(jsonResponse.contents);
      fillMetaArray(jsonResponse.contents);
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
  //add channel name to header
  document.querySelector('#channel-name').insertAdjacentHTML('beforeend',data.title);
  //add username to header
  d3.select('#username').html(data.user["full_name"]);
  if(data.metadata!==null){
    d3.select('#channel-description').html(marked(data.metadata.description));
  }
  //record channel length in global var
  chanLength=data.length;

  goby=JSON.parse(data.contents[0].content);
  postRequest(slug,'contents');
}

let chanLines='<line class="line" x1="0%" x2="100%" y1="0%" y2="100%"></line><line class="line" x1="100%" x2="0%" y1="0%" y2="100%"></line>'


function fillChannel(){

  feed.selectAll('div')
    .data(metaArray,d => d)
    .join('div')
    .attr('id',d => 'bl-'+d.id)
    .attr('class','block')
    .each((d,i,nodes)=>{
      let cNode=d3.select(nodes[i]);
      cNode.append('svg')
      cNode.select('svg').node().insertAdjacentHTML('afterbegin',chanLines);
      if(d.b==undefined){
        cNode.classed('undefined-block',true)
      }else{
        definedBlock();
      }
      function definedBlock(){
        if(d.b.image){
          cNode
          .append("div")
          .attr('class','img-wrap')
          .append('img')
          .attr('alt',d.b.title)
          .attr('srcset',`${d.b.image.thumb.url} 1x, ${d.b.image.large.url} 2x`)
        }else if(d.b["content_html"]){
          cNode.classed('text-block',true);
          cNode.append('div').classed('text-block-wrap',true)
          cNode.select('.text-block-wrap').node().insertAdjacentHTML('afterbegin',d.b["content_html"]);
        }else if(d.b.class="Channel"){
          cNode.classed('channel-block',true);
        }
        cNode.append('p').attr('class','block-title emphasis').html(d.b.title);

        if(i==channelContents.length-1){
          cNode.classed('loadmore'+i,true);
          observing(i);
        }

        // don't delete this-- you'll use it when writing to goby.json
        // if(gobyS.blocks.find(bl => bl.id==d.id)==undefined){
        //   let newJson={
        //     id:d.id,
        //     tags:[],
        //     fields:[],
        //     author:"",
        //     origin:(d.b.class=="Link")?d.b.source.url:""
        //   }
        //   gobyS.fields.forEach((item, i) => {
        //     newJson.fields.push({
        //       key:item.key,
        //       val:item.default
        //     })
        //   });
        //   gobyS.blocks.push(newJson);
        // }

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


function updateForm(blockData){
  theForm.classed('user-own',(blockData.b.user.id==userId)?true:false);

  if(blockData.b.title.length>0){
    itemTitle.html(blockData.b.title);
  }else{
    itemTitle.html('<span class="no-emph">Untitled</span>');
  }

  formTitle.property('value',blockData.b.title);

  itemDesc.html(blockData.b["description_html"]);

  formDesc.property('value',blockData.b.description);
  textAreaOnInput(formDesc.node());

  let gob=blockData.g;

  itemAuth.html(gob.author);
  console.log(gob.author,gob.origin);
  formAuth.property('value',gob.author);

  itemOrig.attr('href',gob.origin)
  formOrig.property('value',gob.origin);

  theForm.node().dataset.id=blockData.id;
  tagFolder();

  gob.tags.forEach((item, i) => {
    d3.select('#tag-'+item).property('checked',true);
  });

  // <div class="tag">
  //   <input type="checkbox" name="" value="">
  //   <p>cheese</p>
  // </div>

}

function newTagAdd(){
  console.log(event);
  if(event.data==','){
   let newTagVal=document.querySelector('#add-new-tag').value.replace(',','');
   document.querySelector('#add-new-tag').value='';

   //need to implement post here
   goby.tags.push(newTagVal);

   let tagFolder=d3.select('#tag-folder')
   tagFolder.append('div').attr('class','tag')
   .attr('id','tag-'+newTagVal)
   .append('input')
   .attr('type','checkbox')
   let newTag=d3.select('#tag-'+newTagVal);
   newTag.append('p').html(newTagVal);
   newTag.select('input').property('checked',true)
   newTag.select('input').node().dataset.tag=newTagVal;
  }
}


function tagFolder(){
  let gobyItem=metaArray.find(bl=>bl.id==theForm.node().dataset.id).g;

  let tagFolder=d3.select('#tag-folder')
  tagFolder.selectAll('.tag').remove();
  goby.tags.forEach((tag, i) => {
    tagFolder.append('div').attr('class','tag')
    .attr('id','tag-'+tag)
    .append('input')
    .attr('type','checkbox')
    let newTag=d3.select('#tag-'+tag);
    newTag.append('p').html(tag);
    newTag.select('input').node().dataset.tag=tag;
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
