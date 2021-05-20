let channelContents;
let totalLength=0;
let metaArray=[];

// screens-are-scary
// interesting-shapes
// good-personal-blogs
// printed-matter-o0fah7ijg3u
// approaching-goby-u9rrzm6iqee
let slug='printed-matter-o0fah7ijg3u';
let currentPage=1;
let per=10;
let chanLength;



function postRequest(slug,mode){
  function reqListener () {
    var jsonResponse=JSON.parse(this.responseText);
    console.log(jsonResponse)
    switch(mode){
      case 'contents':
      channelContents=jsonResponse.contents;

      break;
      case 'meta':
      totalLength=jsonResponse.length;
      fillMeta(jsonResponse)
      break;
      case 'update':
      channelContents=channelContents.concat(jsonResponse.contents);
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
  document.querySelector('#username').innerText(data.user["full_name"]);
  
  if(data.metadata!==null){
    document.querySelector('#channel-description').innerText(marked(data.metadata.description));
  }
  //record channel length in global var
  chanLength=data.length;

  goby=JSON.parse(data.contents[0].content);
  postRequest(slug,'contents');
}
