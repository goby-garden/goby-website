window.addEventListener('load',startUp)

let commentary=d3.select('#commentary');
let chanurl;

async function startUp(){
  await authentication();
  slug=checkSlug();
  if(slug){
    checkForChannel(slug);
  }

  d3.select('#initiate-search').on('click',function(){
    let channelString=document.querySelector('.pick-channel input').value;
    document.querySelector('.pick-channel input').value="";

    if(validURL(channelString)){
      let channelSlug=channelString.match(slugRegex)[0].replace('/','');
      checkForChannel(channelSlug);
    }else{
      console.log('failed');
    }
  })

  d3.select('#pick-different').on('click',function(){
    d3.select('#title-bar').classed('chosen',false);
    commentary.attr('class','');
  })

  d3.select('#install').on('click',function(){
    initiateBuild();
  })

}


async function checkForChannel(newSlug){
  metadata=await getRequest(newSlug,'meta');
  // https://www.are.na/nico-chilla/gobies
  //first check if the response was even valid
  if(metadata.contents){
    inspectChannel(newSlug,metadata);
    chanLength=metadata.length;
  }else{
    console.log("this channel doesn't exist");
  }
}


function inspectChannel(newSlug,metadata){
  slug=newSlug;
  chanurl=`https://are.na/${metadata.owner.slug}/${slug}`;
  //check if goby is initiated already, and if so, send you to it
  if(metadata.contents[0].title=='goby.json'){
    window.location.href =baseurl+'edit/?channel='+slug;
  }

  d3.select('#title-bar').classed('chosen',true);
  //add channel name to header
  d3.select('#channel-name').text(metadata.title);
  //add username to header
  d3.select('#username').text(metadata.user["full_name"]);

  if(localStorage.getItem('userid')){
    ownerid=metadata.owner.id;
      if(userid==metadata.owner.id){
        commentary.attr('class','a');
      }else{
        commentary.attr('class','b');
      }
    setDomUser();
  }else{
    commentary.attr('class','c');
    //if not logged in, add commentary saying you need to log in
    console.log("you're not logged in");
  }


}

function terminalLog(message){
  console.log(message);
  let newMessage=document.createElement('p');
  newMessage.innerHTML=`${message}`;
  let terminal=document.querySelector('#terminal')
  terminal.appendChild(newMessage);
  terminal.scrollTop = terminal.scrollHeight;
}

let blocks=[];
let ids=[];
// let goby;

async function initiateBuild(){
  blocks=[];
  ids=[];
  terminalLog('Initiating install');
  terminalLog('# Step 1: Created Goby object');
  let goby={
    manifest:[],
    blocks:[]
  }

  terminalLog('# Step 2: Loading in all blocks from channel');
  for(i=0; i<chanLength; i=i+per){
    let results=await getRequest([slug,currentPage,per],'asc');
    currentPage++;
    blocks=blocks.concat(results.contents);
    terminalLog("Fetched "+blocks.length+"/"+chanLength+" blocks");

  }
  console.log(blocks);

  terminalLog('# Step 3: Added blocks to goby');
  blocks.forEach((block, b) => {
    //NTS: add in predefined fields support (compare with manifest loop in newGobyBlock)
    goby.blocks.push({id:block.id});
    ids.push(block.id);
  });

  terminalLog('# Step 4: Uploading goby.json to the channel');
  let newBlock=await postRequest(slug,JSON.stringify(goby));
  // console.log(goby);
  console.log(newBlock);
  terminalLog('# Step 5: Moving goby.json to the bottom of the channel');
  ids.unshift(newBlock.id)

  await moveToBottom(newBlock.id);
  commentary.attr('class','');
  terminalLog(`Success! You will now be able to edit your channel <a href="${baseurl}edit?channel=${slug}">here</a>`);
  terminalLog("Sometimes Are.na's cache takes time to update, so you may have to wait a few minutes before the editor works.");
  terminalLog(`To make sure the install worked, check the very bottom of <a href="${chanurl}">your channel</a> for goby.json`)

}


function postRequest(slug,content){
  return new Promise((resolve, reject) => {
    function reqListener () {
      var jsonResponse=JSON.parse(this.responseText);
      // console.log(this.responseText);
      resolve(jsonResponse);
    }
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", reqListener);

    let putTitle=encodeURIComponent("goby.json");
    let putContent=encodeURIComponent(content);
    let fetchurl=`${proxy}https://api.are.na/v2/channels/${slug}/blocks?title=${putTitle}&content=${putContent}&position=1&access_token=${token}`;

    oReq.open("POST", fetchurl);
    oReq.send();

  });
}

function moveToBottom(id){
  return new Promise((resolve, reject) => {
    function reqListener () {
      console.log(this.responseText);
      resolve(this.responseText);
    }
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", reqListener);

    // let fetchurl=`${proxy}https://api.are.na/v2/channels/${slug}/sort?${arr}access_token=${token}`;
    let fetchurl=`${proxy}https://api.are.na/v2/channels/${slug}/sort?connectable_id=${id}&connectable_type=Block&new_position=1&access_token=${token}`;
    console.log(fetchurl);
    oReq.open("PUT", fetchurl);
    oReq.send();

  });
}
