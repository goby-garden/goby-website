
// dom variables--------------------
let feed=d3.select('#channel-feed');
let chanLines='<line class="line" x1="0%" x2="100%" y1="0%" y2="100%"></line><line class="line" x1="100%" x2="0%" y1="0%" y2="100%"></line>';



//data variables----------------
let currentPage=1;
let per=10;
let chanLength;
let blocks=[];
let goby;
let slug='goby-test-channel';
// screens-are-scary
// interesting-shapes
// good-personal-blogs
// printed-matter-o0fah7ijg3u
// approaching-goby-u9rrzm6iqee





function startUp(){
  postRequest(slug,'meta');
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


function fillMeta(data){
  //add channel name to header
  document.querySelector('#channel-name').insertAdjacentHTML('beforeend',data.title);
  //add username to header
  d3.select('#username').text(data.user["full_name"]);
  
  if(data.metadata!==null){
    d3.select('#channel-description').text(marked(data.metadata.description));
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
  fillWithBlocks();
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

function fillWithBlocks(){
  let domBlocks=feed.selectAll('div')
    .data(blocks.filter(a=>a.title!=="goby.json"),d => d)
    .join('div')
    .attr('id',d => 'bl-'+d.id)
    .attr('class','block')
  domBlocks.append('svg')
  .node().insertAdjacentHTML('afterbegin',chanLines);
  domBlocks.filter((d, i) =>d.image)
  .append("div")
  .attr('class','img-wrap')
  .append('img')
  .attr('alt',d=>d.title)
  .attr('srcset',d=>`${d.image.thumb.url} 1x, ${d.image.large.url} 2x`)
  domBlocks.filter((d, i) =>d["content_html"])
  .classed('text-block',true)
  .append('div').classed('text-block-wrap',true)
  .html(d=>d["content_html"]);
  domBlocks.filter((d, i) =>d.class="Channel")
  .classed('channel-block',true);
}









window.addEventListener('load',startUp);