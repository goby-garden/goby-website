window.addEventListener('load',startUp)

function startUp(){
  authentication();

  d3.select('#initiate-search').on('click',function(){
    let channelString=document.querySelector('#channel-search input').value;

    if(validURL(channelString)){
      let channelSlug=channelString.match(slugRegex)[0].replace('/','');
      checkChannel(channelSlug)
    }else{
      console.log('failed');
    }
  })

}




//when you click on the channel input "go" button:
// — async request meta, check if first block is called goby.json
// — if so, send user to /edit?channel=<channel-slug>
// — if not, send user to /build?channel=<channel-slug>
