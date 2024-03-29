
console.log('hullo');
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

let userid;



let slugRegex=/\/(?:.(?!\/))+$/g;
const redirect = window.location.hostname === "localhost"
  ? "http://localhost:8000/"
  : "https://goby.garden";

  const proxy = window.location.hostname === "localhost"
    ? "https://wnsr-cors.herokuapp.com/"
    : "https://wnsr-cors.herokuapp.com/";

// this stores all the individual block data fetched from arena
let blocks=[];

// this stores the goby's special metadata for each block
let goby;
let gobyid;
let ownerid;

//this selects the channel that is fetched
let slug;

function checkSlug(){
  var params=new URLSearchParams(window.location.search);
  let isSlug=params.get('channel')?true:false;
  if(isSlug){
    slug=params.get('channel');

  }else{
    slug='gobies';
  }
  console.log("slug:",slug);
}


//authentication wuz here

//login wuz here

//validURL wuz here



// log-in button
// window should prompt you to enter arena profile link and hit login
// login sends code request



// screens-are-scary
// interesting-shapes
// good-personal-blogs
// printed-matter-o0fah7ijg3u
// approaching-goby-u9rrzm6iqee
// gobies

let newKeys=[];




function startUp(){
  authentication();
  checkSlug();
  getRequest(slug,'meta');
  setUpButtons();
  textAreaHeights(true);
}

// api requests--------------

function getRequest(slug,mode){
  function reqListener () {
    var jsonResponse=JSON.parse(this.responseText);
    switch(mode){
      case 'contents':
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
  ownerid=data.owner.id;
  if(ownerid==userid){
    d3.select('body').classed('edit-mode',true);
    d3.select('#avatar-wrapper').select('use').attr('href','#pencil-icon');
  }

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
  gobyid=data.contents[0].id;
  getGobyAgain(gobyid)

  //caching issues with the API require me to make a second call to get goby
  function getGobyAgain(id){
    var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", gobyGot);
        let fetchurl=`https://api.are.na/v2/blocks/${id}`;
        oReq.open("GET", fetchurl);
        oReq.send();

    function gobyGot(){
      console.log(JSON.parse(this.responseText));
      goby=JSON.parse(JSON.parse(this.responseText).content);
    }
  }


  console.log('gobyid:',gobyid);
  getRequest(slug,'contents');
}

// adds each newly received block to blocks and goby based on
function handleNewData(contents){
  let gobyChanged=false;

  contents.forEach((block,b)=>{
    if(goby.blocks.find(a=>a.id==block.id)==undefined&&block.title!=="goby.json"){
      goby.blocks.push(newGobyBlock(block.id));
      gobyChanged=true;
    }
    if(blocks.find(a=>a.id==block.id)==undefined){
      blocks.push(block);
    }
  })
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

  d3.select('#submit-form').on('click',function(){
    checkForm();
    let theBlock=blocks.find(a=>a.id==parseInt(formQs.dataset.editing))
    updateForm(theBlock);
    exitForm();
  })

  d3.select('#login-prompt').on('click',function(){
    d3.select('#pop-up').style('display','flex');
  })

  d3.select('#cancel-popup').on('click',function(){
    d3.select('#pop-up').style('display','none');
  })


  addNewSetUp();

}

function exitForm(){
  d3.selectAll('.data-grouping').classed('edit',false);
  d3.select('#submit-cancel').classed('edit',false);
  d3.select('#add-new').classed('panel-2',false);
  newKeys=[];
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
    observer.unobserve(entries[0].target);
    //I might add an event listener for scroll here that fires the getRequest
    // that way if the layout changes and the last block happens to come into view, the request won't fire until the scroll down for more stuff
    getRequest(slug,'update');
  }
}



// form editing---------------------------------

function updateForm(blockData){


  // arena native ----------------
  let title=blockData.title.length>0?blockData.title:"<span class='no-emph'>untitled</span>";
  d3.select('#item-title p').html(title);
  d3.select('#item-title input').property('value',blockData.title);

  d3.select('#item-desc p').html(blockData.description?marked(blockData.description):"");

  d3.select('#item-desc textarea').html(blockData.description);
  d3.select('#item-desc textarea').property('value',d3.select('#item-desc textarea').text());

  // arena goby-------------------
  let gobyBlock=goby.blocks.find(a=>a.id==blockData.id);
  d3.select('#arena-goby').selectAll('.form-section').remove();
  // this goes through each goby data field and makes a form section for it
  goby.manifest.forEach((sData,i)=>{

    generateSection(sData.type,sData.key,gobyBlock[sData.key],i,sData.values)



  })


  // general----------------------
  d3.selectAll('form textarea').each((d,i,nodes)=>{
    textAreaOnInput(nodes[i]);
  })
  formQs.dataset.blocktype=blockData.class.toLowerCase();

}


function generateSection(type,key,value,index,existing){
  //add check for if index is defined and existing
  let newField=false;

  if(!index&&index!==0){
    index=document.querySelectorAll('#arena-goby .form-section').length;
    existing=[];
    newField=true;
  }

  d3.select('#arena-goby')
      .append('div')
      .attr('class',`form-section type-${type} ${newField?'new-field':''}`)
      .attr('data-type',type)
      .attr('data-domain','goby')
      .attr('data-key',key)
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
          newTag.attr('data-val',tag);
          newTag.append('input').attr('type','checkbox');
          newTag.append('p').text(tag);
          // gobyBlock[sData.key]
          if(value.find(a=>a==tag)!==undefined){
            newTag.select('input').property('checked',true);
          }
        })
        newSection.append('div').attr('class','add-new-tag form-edit')
        .append('input').datum([]).attr('class','new-tag-input').attr('type','text').attr('data-fieldname',key).attr('data-index',index).attr('tabindex',index+2);

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
        newSection.append('p').attr('class','form-display long-text').html(marked(value));
        if(newField){
          textAreaOnInput(newSection.select('textarea').node())
        }
      break;

    }

    if(newField){
      newSection.append('button').attr('type','button').attr('class','delete-field plus-button').html('⨉').on('click',function(){
        newSection.remove();
        newKeys = newKeys.filter(function(item) {
            return item !== key;
        })
      })
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
  if(!goby.manifest.find(a=>a.key==key)&&!newKeys.find(b=>b==key)&&key!==''){
    d3.select('#add-new input').property('value','');
    d3.select('#add-new').classed('panel-2',false);
    newKeys.push(key);
    generateSection(type,key,'');

  }
}


function generateTag(string,input){
  let currentGoby=goby.blocks.find(b=>b.id==formQs.dataset.editing);
  let existingTags=goby.manifest.find(a=>a.key==input.dataset.fieldname)?goby.manifest.find(a=>a.key==input.dataset.fieldname).values:[];

  if(!existingTags.includes(string)&&!d3.select(input).datum().includes(string)&&string.length>0){
    input.value="";
    let countTags=document.querySelectorAll(`#section-${input.dataset.index} .tag`).length
    d3.select(input).datum().push(string);
    d3.select('#section-'+input.dataset.index).insert('div','.add-new-tag').attr('class','tag new-tag').node().dataset.tag=countTags;
    let newTag=d3.select('#section-'+input.dataset.index).select(`.tag[data-tag="${countTags}"]`)
    newTag.attr('data-val',string);
    newTag.append('input').attr('type','checkbox');
    newTag.append('p').text(string);
    newTag.select('input').property('checked',true);
    newTag.on('change',function(){
      d3.select(d3.event.currentTarget).remove();

      d3.select(input).datum(
        d3.select(input).datum().filter(function(item) { return item !== string;})
      )


    })
  }
}


function putRequest(id,data){
  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", updateBlockCallback);
  // build fetch:
  let putTitle=data.title!==undefined?`title=${encodeURIComponent(data.title)}&`:'';
  let putDescription=data.description!==undefined?`description=${encodeURIComponent(data.description)}&`:'';
  let putContent=data.content!==undefined?`content=${encodeURIComponent(data.content)}&`:'';
  let fetchurl=`${proxy}https://api.are.na/v2/blocks/${id}?${putTitle}${putDescription}${putContent}access_token=${token}`;
  console.log(fetchurl);

  oReq.open("PUT", fetchurl);
  console.log('sending...')
  oReq.send();

  function updateBlockCallback(){
    console.log('did it work?',this.responseText);
  }
}



function checkForm(){
  let arenaBlock=blocks.find(a=>a.id==parseInt(formQs.dataset.editing));
  let gobyBlock=goby.blocks.find(a=>a.id==parseInt(formQs.dataset.editing));
  let arenaChanged=false;
  let gobyChanged=false;


  //going to have to make accomodations for bulk editing here eventually
  //I think enough can stay the same that it's worth trying to generalize it with some conditionals and functions


  // checks goby for changes-------------
  d3.selectAll('#scroll-wrapper .form-section').each((d,i,nodes)=>{
    let section=d3.select(nodes[i]);
    let key=nodes[i].dataset.key;
    let refBlock=nodes[i].dataset.domain=='native'?arenaBlock:gobyBlock;
    let isNewField=section.classed('new-field');
    let somethingChanged=false;
//

    if(nodes[i].dataset.type=='array'){
      //first find the tags with checked checkboxes and create an array of string values
      let domArray=Array.from(nodes[i].querySelectorAll('.tag'));
      domArray=domArray.filter(function(item){
        return item.querySelector('input').checked;
      })
      let newTags=domArray.map(x=>x.dataset.val);


      if(!isNewField){
        //compare the array with the goby stored array of values
        let tagsChanged=compareArrays(newTags,refBlock[key]);
        if(tagsChanged){
          somethingChanged=true;
          refBlock[key]=newTags;
          //check if any of the tags are new, and store them in the goby log if so
          let unsavedTags=domArray.filter(function(item){
            return item.classList.contains('new-tag');
          })
          unsavedTags=unsavedTags.map(x=>x.dataset.val);

          goby.manifest.find(a=>a.key==key).values=goby.manifest.find(a=>a.key==key).values.concat(unsavedTags);

        }
      }else{
        submitNewField(key,nodes[i].dataset.type,newTags,refBlock);
        somethingChanged=true;
      }

    }else{
      let comparable=nodes[i].dataset.type=='par'?section.select('textarea').property('value'):section.select('input').property('value');

      if(!isNewField){
        if(comparable!==refBlock[key]){
          somethingChanged=true;
          refBlock[key]=comparable;
        }
      }else{

        submitNewField(key,nodes[i].dataset.type,comparable,refBlock);
        somethingChanged=true;

      }
    }

    if(somethingChanged){
      switch(nodes[i].dataset.domain){
        case 'native':
          arenaChanged=true;
          break;
        case 'goby':
          gobyChanged=true;
          break;
      }
    }

  })


  if(gobyChanged){
    console.log('goby changed');
    putRequest(gobyid,{content:JSON.stringify(goby)})
  }
  if(arenaChanged){
    console.log('arena changed');
    if(arenaBlock.class!=="Channel"){
      putRequest(arenaBlock.id,{
        title:arenaBlock.title,
        description:arenaBlock.description
      })
    }
    // putRequest(gobyid,{content:JSON.stringify(goby)})
  }
}


function submitNewField(newKey,newType,newVal,currentBlock){
  // add new field to manifest
  goby.manifest.push({
    key:newKey,
    type:newType
  })
  // adds existing values to list if array
  if(newType=="array"){
    goby.manifest.find(a=>a.key==newKey).values=newVal;
  }

  //loop through blocks and create the keys
  goby.blocks.forEach((block,b)=>{
    block[newKey]=(newType=="array")?[]:"";
  })

  // change value on current block
  currentBlock[newKey]=newVal;
}

function compareArrays(arrayA,arrayB){
    let different=false
    //returns false if they are the same (order doesn't matter), true if they are different
    if(!array1ContainsArray2(arrayA,arrayB)){
      different=true;
    }
    if(!array1ContainsArray2(arrayB,arrayA)){
      different=true;
    }
    return different;
  }

  function array1ContainsArray2(array1,array2){
    //returns true if all the values in array 2 are in array1, false if not
    let contains=true;
    for(let i=0;i<array2.length;i++){
      if(!array1.includes(array2[i])){
        contains=false;
        break;
      }
    }
    return contains;

  }

window.addEventListener('keydown',function(){
  if(event.key=="Enter" &&document.activeElement){
    if(d3.select(document.activeElement).classed('new-tag-input')){
      generateTag(d3.select(document.activeElement).property('value'),d3.select(document.activeElement).node());

    }
  }
})


window.addEventListener('load',startUp);
