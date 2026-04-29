const api_client_id=process.env.ARENA_CLIENT_ID;
const api_client_token=process.env.ARENA_CLIENT_TOKEN;

// const api_client_secret=process.env.ARENA_V2_SECRET;

const api_root="https://api.are.na/v3";
const auth_root="https://www.are.na/oauth/authorize";

const auth_params={
    // client_id:api_client_id
}

export default async (req) => {
    console.log("received a request")


    let input={};
    try{
        input=await req.json();
    }catch(e){
        console.log('netlify fn error:',e)
    }
    
    const root=input.type=='auth'?auth_root:api_root;
    
    const params={
        ...auth_params,
        ...(input.params || {})
    }

    const param_string=object_to_param_string(params);

    const components=[root,input.category];
    if(input.resourceId) components.push(input.resourceId);
    if(input.endpoint && input.endpoint!=='/') components.push(input.endpoint)
    components.push(param_string);

    console.log(input.method)



    const url=components.join('/');
    
    let data={};

    try{
        console.log(`fetching ${url}`);
        let response=await fetch(url,{
            method:input.method,
            headers:{
                // "Authorization":`Bearer ${api_client_token}`
            }
        });
        data=await response.json();
    }catch(e){
        console.log(e);
    }


    return new Response(
        JSON.stringify(data),
        {
            headers: {
                'Content-Type': 'application/json',
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