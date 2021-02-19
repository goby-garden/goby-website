
//placeholder values
let userId=182020;
let editMode=true;
let username="nico-chilla";

let goby;

let gobyS={
  tags:['lettuce','tomato','cheddar','patty','pickles','onions'],
  fields:[
    {key:'type',default:''}
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
let bFields=d3.select('#item-fields');

let itemTitle=bTitle.select('.user-input');
let itemDesc=bDesc.select('.user-input');
let itemAuth=bAuth.select('.user-input');
let itemOrigLink=bOrig.select('.origin-link');
let itemOrigNonlink=bOrig.select('.non-link');

let formTitle=bTitle.select('input');
let formDesc=bDesc.select('textarea');
let formAuth=bAuth.select('input');
let formOrig=bOrig.select('input');

let tabindex=6;

// screens-are-scary
// interesting-shapes
// good-personal-blogs
// printed-matter-o0fah7ijg3u
// approaching-goby-u9rrzm6iqee
let slug='printed-matter-o0fah7ijg3u';
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
        d3.select('#item-title').select('.form-edit').node().focus();
      }
    })
  }

  d3.select('#close-item').on('click',function(){
    d3.select('#item-meta').classed('open',false);
    exitForm()
  })
  d3.select('#cancel-form').on('click',exitForm);
  d3.select('#submit-form').on('click',submitBlockData);
  d3.select('#add-new-tag').on('input',newTagAdd);
  d3.select('#add-new-field').on('click',newFieldAdd);
  d3.select('#form-sidecar').on('click',function(){
    let theClass=d3.select('#form-sidecar').attr('class');
    d3.select('#item-'+theClass).select('.form-edit').node().focus();
  })
  setUpFocus();
  d3.select('#you-question').on('click',function(){
    event.preventDefault();
    d3.select('#item-author').select('.form-edit').property('value',"@"+username)
  })
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
    console.log('origin changed',oldData.g.origin);
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

  document.querySelectorAll('#item-fields>.single-line').forEach((item, i) => {
    console.log(item.classList);
    if(item.classList.contains("new-field")){
      console.log('new field!')
      let newField={
        key:d3.select(item).select('.new-field-key').property('value'),
        val:d3.select(item).select('.new-field-value').property('value')
      }
      goby.fields.push({key:newField.key})
      oldData.g.fields.push(newField);
    }else{
      let fieldKey=item.dataset.key;
      let newVal=d3.select(item).select('input').property('value');
      let inBlock=oldData.g.fields.find(a=>a.key==fieldKey);
      if(inBlock==undefined){
        if(newVal.length>0){
          oldData.g.fields.push({key:fieldKey,val:newVal});
          gobyHasChanged=true;
        }
      }else if(newVal!==inBlock.val){
        inBlock.val=newVal;
        gobyHasChanged=true;
      }
    }


  });




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

let greenTimer;
let greenCounter;

function setUpFocus(){
  document.querySelectorAll('.form-section').forEach((item, i) => {
    let instructions={
      title:"What is this called?",
      author:"Who made this?",
      origin:"Where did you find this?",
      description:"What is this about?"
    }
    let moreInfo={
      title:"",
      author:"text or @username",
      origin:"text or URL (auto-fills link blocks)",
      description:""
    }
    let selected=d3.select(item);
    let sId=selected.attr('id');
    let sType=sId.replace('item-','');


    if(sId=='item-tags'||sId=='item-fields'){
    }else{
      selected.select('.form-edit').on('focus',function(){
        d3.select('#instructions').select('.maintext').text(instructions[sType]);
        d3.selectAll('.entry-sync').text(event.currentTarget.value);
        d3.select('#form-sidecar').attr('class',sType).style('opacity',1);
        d3.select('#media-type').text(moreInfo[sType]);
        document.querySelector('#form-sidecar').dataset.viewing="true";
        d3.select('#form-sidecar').style('pointer-events',"all");
      })

      selected.select('.form-edit').on('input',function(){
        d3.selectAll('.entry-sync').text(event.currentTarget.value);

        if((sType=="author"||sType=="origin")&&event.currentTarget.value.length>0&&event.inputType=="insertText"){
          d3.select('#form-sidecar').style('background-color','#B2FFB8');
          greenCounter=300;
          clearInterval(greenTimer);
          greenTimer=setInterval(function () {
            greenCounter=greenCounter-10;
            if(greenCounter==0){
              clearInterval(greenTimer);
              d3.select('#form-sidecar').style('background-color','white');
            }
          }, 10);
        }
      })
      selected.select('.form-edit').on('focusout',function(){
        d3.select('#form-sidecar').style('opacity',0);
        document.querySelector('#form-sidecar').dataset.viewing="false";
        setTimeout(function () {
          if(document.querySelector('#form-sidecar').dataset.viewing=="false"){
            d3.select('#form-sidecar').style('pointer-events',"none");
          }
        }, 300);

        // #FFC1C1
      })

    }

  });

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
      origin:""
    }
    // goby.fields.forEach((field, f) => {
    //   newJson.fields.push({
    //     key:field.key,
    //     val:field.default
    //   })
    // });
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
        console.log(metaArray);
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
      console.log(jsonResponse);
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
        if(gobyS.blocks.find(bl => bl.id==d.id)==undefined){
          let newJson={
            id:d.id,
            tags:[],
            fields:[],
            author:"",
            origin:""
          }
          // (d.b.class=="Link")?d.b.source.url:""
          // gobyS.fields.forEach((item, i) => {
          //   newJson.fields.push({
          //     key:item.key,
          //     val:item.default
          //   })
          // });
          gobyS.blocks.push(newJson);
        }

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
  formAuth.property('value',gob.author);

  useOrig=(gob.origin==""&&blockData.b.class=="Link")?blockData.b.source.url:gob.origin;
  if(useOrig.search(/https:\/\/|http:\/\//g)==0){
    itemOrigLink.classed('dont-show',false);
    itemOrigNonlink.classed('dont-show',true);
    itemOrigLink.attr('href',useOrig)
    bOrig.select('.item-label').classed('hidden-until-edit',true);
  }else{
    itemOrigNonlink.classed('dont-show',false);
    itemOrigLink.classed('dont-show',true);
    itemOrigNonlink.html(useOrig);
    bOrig.select('.item-label').classed('hidden-until-edit',false);
  }
  formOrig.property('value',gob.origin);

  d3.select('#item-id').html(blockData.id);

  theForm.node().dataset.id=blockData.id;
  tagFolder();

  gob.tags.forEach((item, i) => {
    d3.select('#tag-'+item).property('checked',true);
  });

  tabindex=6;
  bFields.selectAll('.single-line').remove();

  goby.fields.forEach((field, f) => {
    let inBlock=gob.fields.find(a=>a.key==field.key)
    bFields.insert('div','h5').attr('id','field-'+field.key).attr('class','single-line');
    let newBar=d3.select('#field-'+field.key);
    newBar.append('label').html(field.key+':');
    newBar.append('p').attr('class','user-input').html(inBlock==undefined?"":inBlock.val);
    newBar.append('input').attr('class','no-own-req form-edit')
    .attr('type','text')
    .property('value',inBlock==undefined?"":inBlock.val)
    .attr('tabindex',tabindex)
    .property('placeholder',field.default);
    newBar.node().dataset.key=field.key;
    tabindex++;
  });
  d3.select('#submit-form').attr('tabindex',tabindex);

  // <div class="single-line">
  //   <label for="item-field">Type:</label>
  //   <p class='user-input'>Entree</p>
  //   <input tabindex="6" class="no-own-req form-edit" type="text" name="item-field" placeholder="Entree" value="Entree">
  // </div>

  // <div class="tag">
  //   <input type="checkbox" name="" value="">
  //   <p>cheese</p>
  // </div>

}


function newFieldAdd(){
  bFields.insert('div','h5').attr('class','single-line new-field')
  let newField=bFields.select('div:last-of-type');
  newField.append('input').attr('class','no-own-req form-edit new-field-key')
  .attr('type','text')
  .property('value','')
  .attr('tabindex',tabindex)
  .property('placeholder','key');
  tabindex++;
  newField.append('span').html(':');
  newField.append('input').attr('class','no-own-req form-edit new-field-value')
  .attr('type','text')
  .property('value','')
  .attr('tabindex',tabindex)
  .property('placeholder','value');
  tabindex++;
  d3.select('#submit-form').attr('tabindex',tabindex);
  tabindex++;
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
