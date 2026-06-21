const api_client_id=process.env.ARENA_CLIENT_ID;
const api_client_token=process.env.ARENA_CLIENT_TOKEN;
const api_client_secret=process.env.ARENA_CLIENT_SECRET;
// not adding this to netlify, so it is local dev only
// const test_access_token=process.env.GOBY_TEST_TOKEN;
const test_access_token=undefined;

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

    let profile_access_token=cookies.find((a)=>a.includes('are.na_access_token'))?.split('=')?.[1] || test_access_token;
    
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

    let body_params={};

    let headers={};

    if(profile_access_token){
        headers={
            ...headers,
            "Authorization":`Bearer ${profile_access_token}`
        }
    }

    if(input.body){
        if(input.endpoint=='/token'){
            input.body={
                ...(input.body || {}),
                client_id:api_client_id,
                client_secret:api_client_secret
            }
        }


        body_params={
            body:JSON.stringify(input.body)
        }

        headers={
            ...headers,
            'Content-Type':'application/json'
        }
    }

    // 'Content-Type': 'application/json'

    try{
        console.log(`${input.method=="GET"?"fetching":"updating"} ${url}`);
        let response=await fetch(url,{
            method:input.method,
            ...body_params,
            headers:new Headers(headers)
        });
        if(response.status!==200) console.log(`${response.status} response`,response);
        data=await response.json();
    }catch(e){
        console.log(e);
    }


    if(input.endpoint==='/token' && response.status==200){
        // add token and clean out the response
        profile_access_token=data.access_token;
        data={
            authenticated:true
        }
        
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