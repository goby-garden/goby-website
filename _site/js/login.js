//auth stuff
let token;


function authentication(){
  let apple='b7e90305232837caf2fd24598c3de3970819b57e2639574a652dffd4329afd19';
  let salsa='0f72500f45894e3e3b20dd035fa5fb942db18aa2bd2f0cca563193840a732aed';

  if(localStorage.getItem('token')){
    token=localStorage.getItem('token');
    login();
  }else{
    var queryString=new URLSearchParams(window.location.search);
    if(queryString.get('code')){
      let code=queryString.get('code');
      getAccessToken(code);
    }
  }


  // change for netlify proxy
  function getAccessToken(code){
    var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", accessTokenCallback);
        let fetchurl=`${proxy}https://dev.are.na/oauth/token?client_id=${apple}&client_secret=${salsa}&code=${code}&grant_type=authorization_code&redirect_uri=${redirect}`;
        oReq.open("POST", fetchurl);
        oReq.send();

    function accessTokenCallback(){
      console.log(this.responseText);
      token=JSON.parse(this.responseText)["access_token"];
      localStorage.setItem('token',token);
      login();
    }
  }

  //check if there's a token in local storage
  // Y? procede logged-in
  // N ? check if there's a code in local storage or the url params
  // Y? do request to get token, including slug and user id and procede logged-in
  // N? procede without log-in
  d3.select('#initiate-login').on('click',function(){
    console.log('clicked');
    let profileString=document.querySelector('#profile-url').value;

    if(validURL(profileString)){
      let userSlug=profileString.match(slugRegex)[0].replace('/','');
      console.log(userSlug);
      localStorage.setItem('user',userSlug);
      window.location.href = `https://dev.are.na/oauth/authorize?client_id=${apple}&redirect_uri=${redirect}&response_type=code`;
    }else{
      console.log('failed');
    }

    // redirect
    // "http://dev.are.na/oauth/authorize?client_id=a05374c81efe233cb167bf381902d931210d6c737ce8df19e443fffb860de6a3&redirect_uri=https://channel-duplicator.glitch.me/&response_type=code";
  })


}


function login(){
  //make this more complex later
  console.log('successfully authenticated, get user data');
  if(localStorage.getItem('userid')){
    console.log('set dom user');
    setDomUser()
  }else{
    console.log('made request for user')
    var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", userDataCallback);
        let fetchurl=`https://api.are.na/v2/users/${localStorage.getItem('user')}`;
        oReq.open("GET", fetchurl);
        oReq.send();

    function userDataCallback(){
      console.log('user returned')
      let jsonResponse=JSON.parse(this.responseText);
      localStorage.setItem('avatar',jsonResponse.avatar);
      localStorage.setItem('initials',jsonResponse.initials);
      localStorage.setItem('username',jsonResponse.username);
      localStorage.setItem('userid',jsonResponse.id);
      setDomUser();
    }
  }

  function setDomUser(){
    let avatar=localStorage.getItem('avatar');
    let username=localStorage.getItem('username');
    let initials=localStorage.getItem('initials');
    userid=localStorage.getItem('userid');
    d3.select('#account-stuff').classed('logged-in',true);
    d3.select('#initials').text(initials);
    d3.select('#account-stuff img').attr('src',avatar);
    d3.select('#editor-username').text(username);
    d3.select('#login-prompt').classed('show-on-click',true)
    console.log(userid,ownerid);
    if(ownerid!==undefined && parseInt(ownerid)==userid){
      d3.select('body').classed('edit-mode',true);
      d3.select('#avatar-wrapper').select('use').attr('href','#pencil-icon');
    }
  }
}


function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
}
