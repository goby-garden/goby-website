
// dom variables--------------------
let feed=d3.select('#channel-feed');
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
        }
    )
  
  
    if(blocks.length<chanLength){
      observer.observe(document.querySelector('.block:last-child'));
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





window.addEventListener('load',startUp);