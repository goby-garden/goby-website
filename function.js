

function startUp(){
  checkAuth();

  // postRequest();
}


function checkAuth(){
  var queryString=new URLSearchParams(window.location.search);
  let auth;
  if(queryString.get('code')!==null){
    document.querySelector('body').classList.add('authorized');
    auth=queryString.get('code');
    console.log(auth);
  }else{
    console.log('huh')
  }
}



function postRequest(slug){
  function reqListener () {
    var jsonResponse=JSON.parse(this.responseText);
    console.log(jsonResponse);
  }
  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", reqListener);
  let fetchurl="http://api.are.na/v2/channels/unexpected-wittgenstein?current_page=1&per=5";
  oReq.open("GET", fetchurl);
  oReq.send();
}

window.addEventListener('load',startUp);

// http://api.are.na/v2/channels/magic-moments-ckavscg25hs?current_page=1&per=1
