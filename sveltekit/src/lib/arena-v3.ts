const netlify_fn='/.netlify/functions/arena-api-v3';

/**
 * Gets channel metadata and first block
 */
export async function get_channel_meta(slug:string){
    return await make_v3_request(
        {
            method:"GET",
            type:'api',
            category:`channels`,
            endpoint:"/",
            resourceId:slug,
            params:{}
        }
    );
}


export async function get_channel_contents(
    {
        slug,
        page = 1,
        per = 12, 
        sort = 'position_desc'
    }:{slug:string,page?:number,per?:number,sort?:'position_asc'|'position_desc'}
){
    return await make_v3_request(
        {
            method:"GET",
            type:'api',
            category:`channels`,
            endpoint:"/contents",
            resourceId:slug,
            params:{
                page,
                per,
                sort
            }
        }
    );
}

// export async function get_channel_contents(
//     {slug,page = 1,per = 10, direction = 'desc', user}:{slug:string,page?:number,per?:number,direction?:'asc'|'desc',user?:string}
// ){
//     const endpoint=`channels/${slug}/contents`;
//     const params={
//         page,
//         per,
//         direction
//     };

//     const data:Parameters<typeof make_v2_request>[0]={
//         action:'channel_contents',
//         method:"GET",
//         type:'api',
//         endpoint,
//         params
//     };

//     if(user) data.user=user;

//     // user
//     const returned=await make_v2_request(data);

//     return returned?.contents;
// }



async function make_v3_request(data:{
        method:"GET" | "POST" | "PUT";
        type:"api" | 'auth';
        resourceId:string;
        category:"channels";
        endpoint:"/" | "/contents";
        params:{[key:string]:string|number}
        user?:string;
    }){
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