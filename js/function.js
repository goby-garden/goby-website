let channelContents;
let totalLength=0;
let metaArray=[];

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
