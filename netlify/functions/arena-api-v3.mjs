const api_client_id=process.env.ARENA_CLIENT_ID;
const api_client_token=process.env.ARENA_CLIENT_TOKEN;
// not adding this to netlify, so it is local dev only
// const test_access_token=process.env.ARENA_PERSONAL_ACCESS_TOKEN;

import path from 'node:path'

// const api_client_secret=process.env.ARENA_V2_SECRET;

const api_root="https://api.are.na/v3";
const auth_root="https://www.are.na/oauth/authorize";

export default async (req) => {
    console.log("received a request")
    

    let input={};
    let cookies=[];
    try{
        cookies=(new Headers(req.headers)).get('Cookie')?.split(';') || [];
        input=await req.json();
        
        
    }catch(e){
        console.log('netlify fn error:',e)
    }

    const profile_access_token=cookies.find((a)=>a.includes('are.na_access_token'))?.split('=')?.[1];
    
    const root=input.type=='auth'?auth_root:api_root;
    
    const params={
        ...(input.params || {})
    }

    const param_string=object_to_param_string(params);

    const components=[root,input.category];
    if(input.resourceId) components.push(input.resourceId);
    if(input.endpoint && input.endpoint!=='/') components.push(input.endpoint)
    components.push(param_string);

    const url=path.join(...components)
    
    let data={};

    try{
        console.log(`fetching ${url}`);
        let response=await fetch(url,{
            method:input.method,
            headers:profile_access_token?new Headers({
            "Authorization":`Bearer ${profile_access_token}`
            }):{}
        });
        data=await response.json();
    }catch(e){
        console.log(e);
    }

    let cookieHeader = {};

    if(profile_access_token){
        cookieHeader={
            "Set-Cookie":[`are.na_access_token=${profile_access_token}`]
        }

        data.authenticated=true;
        // [`are.na_access_token=${test_access_token}`]
    }

    const gobyResponse = new Response(
        JSON.stringify(data),
        {
            headers: {
                'Content-Type': 'application/json',
                ...cookieHeader
            }
        }
    );

    return gobyResponse;
}


function object_to_param_string(obj){
    return Object.entries(obj).map(([key,value],i)=>{
        const prefix=i==0?'?':''
        return `${prefix}${key}=${value}`;
    }).join('&');
}