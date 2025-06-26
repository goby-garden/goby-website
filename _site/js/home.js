window.addEventListener('load',init)

let init_fired=false;

// https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
const sleep = ms => new Promise(r => setTimeout(r, ms));

let md_streams={
  database_notes:{
    key:'database_notes',
    populated:false
  },
  interface_notes:{
    key:'interface_notes',
    populated:false
  }
};

let arena_streams=[
  {
    key:'arena_journal',
    populated:false,
    slug:'goby-journal',
    pages_loaded:0,
    contents:[]
  },
  {
    key:'arena_feature_repo',
    populated:false,
    slug:'goby-feature-repository',
    pages_loaded:0,
    contents:[]
  },
  {
    key:'arena_moods',
    populated:false,
    slug:'goby-moods',
    pages_loaded:0,
    contents:[]
  },
  {
    key:'arena_use_cases',
    populated:false,
    slug:'goby-hypothetical-use-cases',
    pages_loaded:0,
    contents:[]
  }
]

load_md('https://raw.githubusercontent.com/goby-garden/goby-database/main/notes.md','database_notes')
load_md('https://raw.githubusercontent.com/goby-garden/goby-interface/main/notes.md','interface_notes')

load_first_pages();


async function load_first_pages(){
  for(let chan of arena_streams){
    await load_next_page(chan)
    await sleep(500);
  }
}


function init(){
  init_fired=true;


  if(md_streams.database_notes.contents&&!md_streams.database_notes.populated) populate_md(md_streams.database_notes);
  if(md_streams.interface_notes.contents&&!md_streams.interface_notes.populated) populate_md(md_streams.interface_notes);
  
  for(let chan of arena_streams){
    if(chan.contents.length>0&&!chan.populated) populate_arena(chan);

    let options = {
      root: document.querySelector('#'+chan.key),
      rootMargin: "0px",
      threshold: 0.9,
    };

    let observer = new IntersectionObserver(callback, options);
    observer.observe(options.root.querySelector('.bottom-detect'))

    function callback(entries){
      if(entries[0].intersectionRatio>0.9){
        console.log('load next page')
        load_next_page(chan);
      }
      
    }
  }
  
  
  // console.log(md_streams);

    

}

async function load_md(url,delivery_address){
  const response = await fetch(url);
  let txt=await response.text();
  let parsed=marked(txt);
  md_streams[delivery_address].contents = parsed;
  if(init_fired) populate_md(md_streams[delivery_address])
}

function populate_md(item){
  item.populated=true;
  d3.select('#'+item.key).select('.contents').html(item.contents);

}


function populate_arena(item){
  let blocks=d3.select('#'+item.key+' .contents').selectAll('.block')
    .data(item.contents,d=>d.id)
  console.log(item.contents)
  blocks.enter()
    .append('div')
    .attr('class','block prose')
    .attr('data-type',(d)=>d.class)
    .each(function(d){
      let block=d3.select(this)
      let ref=block;
      let link_wrap;
      // https://www.are.na/block/
      if(d.class=='Link'||d.class=='Image'||d.class=='Channel'||d.class=='Attachment'){
        link_wrap=block.append('a').attr('href',d.class=='Link'?d.source.url
                    :d.class=='Channel'?'https://www.are.na/channel/'+d.id
                    : 'https://www.are.na/block/'+d.id)
                    .attr('target','_blank')
          
      }
      let date=new Date(d.connected_at);
      let date_string=date.toLocaleDateString('en-US')
      
      
      if(link_wrap){
        add_title(link_wrap);
      }else{
        add_title(ref);
      }
      
      function add_title(el){
        el.append('h3').text(d.title)
        .append('span').attr('class',`date ${d.title.length>0?'following':''}`).text(date_string)
      }
      
      
      
      if(d.class=='Text'){
        ref.append('div').html(d.content_html);
      }else if(d.class=='Image'){
      
        link_wrap.append('img').attr('src',d.image.display.url)
        
        console.log("slug=nico-chilla",d.user?.slug=='nico-chilla')
        const img_description=(d.user?.slug=='nico-chilla')?d.description_html:`<span class="attribution-note">— added to are.na by ${d.user.full_name}</span>`;
        
        if(img_description){
          ref.append('div').attr('class','image-desc').html(img_description);
        }
      }else if(d.class=="Link"){
        link_wrap.append('img').attr('src',d.image.thumb.url)
      }
      
    })


}


async function load_next_page(chan){
  chan.pages_loaded++;
  let req=`https://api.are.na/v2/channels/${chan.slug}/contents?sort=position&direction=desc&page=${chan.pages_loaded}&per=5`;
  const response = await fetch(req);
  let obj=await response.json();
  chan.contents=chan.contents.concat(obj.contents)
  // console.log(obj);
  if(init_fired) populate_arena(chan);

}

// async function logMovies() {
//   const response = await fetch("http://example.com/movies.json");
//   const movies = await response.json();
//   console.log(movies);
// }
