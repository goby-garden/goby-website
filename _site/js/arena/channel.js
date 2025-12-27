const netlify_fn='/.netlify/functions/arena-api-v2';


const api_client_id="t9F7ZmHfgBO6kF5-K5s3B6PdALcNb8Bbb2zhlfnGaJA";

let user;

const page_size=20


const test_slug='_-typefaces-foundries-and-type-publications-to-explore';

// NEXT:
// turn requests into a while queue
// style page with top url input and block/channel rendering



async function init(){

    
    document.querySelector('#test-meta').addEventListener('click',async ()=>{
        // const results=await get_channel_meta(test_slug)
        const results=await get_channel_meta(test_slug)
        console.log('meta:',results);
    })
    document.querySelector('#test-contents').addEventListener('click',async ()=>{
        // const results=await get_channel_meta(test_slug)
        const results=await get_channel_contents({slug:test_slug})
        console.log('contents:',results);
    })
            
}

/**
 * Gets channel metadata and first block
 * @param {string} slug -
 * @returns 
 */
async function get_channel_meta(slug){
    return await make_v2_request(
        {
            method:"GET",
            type:'api',
            endpoint:`channels/${slug}`,
            params:{
                page:1,
                per:1
            }
        }
    );
}


async function get_channel_contents({slug,page = 1,per = 10, direction = 'desc'}){
    const endpoint=`channels/${slug}/contents`;
    const params={
        page,
        per,
        direction
    };

    const data={
        method:"GET",
        type:'api',
        endpoint,
        params
    };

    if(user) data.user=user;

    // user
    const returned=await make_v2_request(data);

    return returned?.contents;
}



async function make_v2_request(data={}){
    const body=JSON.stringify(data);

    let result;
    try{
        result=await fetch(netlify_fn, {
            method: "POST",
            headers:{
                'Content-Type': 'application/json'
            },
            body
        })
        
        result=await result.json().then((result) => result);            
        

    }catch(e){
        console.log('error requesting data from are.na:',e)
        // alert("error requesting data from are.na:",e?.message)
    }

    if(result!==undefined){
        return result;
    }   
}





window.addEventListener('load',init)