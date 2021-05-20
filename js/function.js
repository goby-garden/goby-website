let totalLength=0;
let blocks=[];
let goby;


// screens-are-scary
// interesting-shapes
// good-personal-blogs
// printed-matter-o0fah7ijg3u
// approaching-goby-u9rrzm6iqee
let slug='goby-test-channel';
let currentPage=1;
let per=10;
let chanLength;


function startUp(){
  postRequest(slug,'meta');
}


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
      totalLength=jsonResponse.length;
      fillMeta(jsonResponse);
      break;
      case 'update':
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



function fillMeta(data){
  //add channel name to header
  document.querySelector('#channel-name').insertAdjacentHTML('beforeend',data.title);
  //add username to header
  document.querySelector('#username').innerText=data.user["full_name"]
  
  if(data.metadata!==null){
    d3.select('#channel-description').text()
    document.querySelector('#channel-description').innerText=marked(data.metadata.description);
  }
  //record channel length in global var
  chanLength=data.length;

  //note to self:put a check here for errors in the future
  goby=JSON.parse(data.contents[0].content);
  postRequest(slug,'contents');
}

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
  console.log(blocks,goby);
}

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


window.addEventListener('load',startUp);