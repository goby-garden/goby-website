const netlify_fn='/.netlify/functions/arena-api-v2';
const api_client_id="t9F7ZmHfgBO6kF5-K5s3B6PdALcNb8Bbb2zhlfnGaJA";


/**
 * Gets channel metadata and first block
 */
export async function get_channel_meta(slug:string){
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


export async function get_channel_contents(
    {slug,page = 1,per = 10, direction = 'desc', user}:{slug:string,page?:number,per?:number,direction?:'asc'|'desc',user?:string}
){
    const endpoint=`channels/${slug}/contents`;
    const params={
        page,
        per,
        direction
    };

    const data:{
        method:"GET" | "POST";
        type:"api" | 'auth';
        endpoint:string;
        params:{[key:string]:string|number}
        user?:string;
    }={
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