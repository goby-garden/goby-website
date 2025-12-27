const api_client_id=process.env.ARENA_V2_CLIENT_ID;
const api_client_secret=process.env.ARENA_V2_SECRET;

const api_root="https://api.are.na/v2/";
const auth_root="https://dev.are.na/oauth/";

const auth_params={
    client_id:api_client_id,
    client_secret:api_client_secret
}


export default async (req) => {
    let input={};
    try{
        input=await req.json();
    }catch(e){
        console.log('netlify fn error:',e)
    }
    
    const root=input.type=='auth'?auth_root:api_root;
    
    const params={
        ...(input.type=='auth'?auth_params:{}),
        ...(input.params || {})
    }

    const param_string=object_to_param_string(params);

    const url=`${root}${input.endpoint}${param_string}`;
    
    let data={};

    try{
        console.log(`fetching ${url}`);
        let response=await fetch(url);
        data=await response.json();
    }catch(e){
        console.log(e);
    }


    return new Response(
        JSON.stringify(data),
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
}


function object_to_param_string(obj){
    return Object.entries(obj).map(([key,value],i)=>{
        const prefix=i==0?'?':''
        return `${prefix}${key}=${value}`;
    }).join('&');
}