import type { Block, Channel } from "@aredotna/sdk";
import type { GobyField, GobySchema } from "./channel/goby";

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

export async function get_current_profile(){
    return await make_v3_request(
        {
            method:"GET",
            type:'api',
            category:`me`,
            endpoint:"/",
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


export async function save_block_fields({
    id,
    changes,
    authenticated,
    channel_slug,
    schema
}:{id:number; changes:GobyField[]; authenticated:boolean; channel_slug?:string; schema?:GobySchema}){
    if(!authenticated && schema!==undefined && channel_slug!==undefined){
        // first save changes on schema
        for(let change of changes){

            // if are.na canonical field (title or description)
            if(change.canon){
                // saves to schema.overrides
                if(!schema.overrides){
                    schema.overrides={
                        title:{values:{}},
                        description:{values:{}}
                    }
                }
                
                type CanonicalKey = keyof typeof schema.overrides;
                const isCanonicalKey=(k:string):k is CanonicalKey=>["title","description"].includes(k);

                const key=change.key.split('.')[1];
                if(isCanonicalKey(key) && change.type=="string"){
                    schema.overrides[key].values[id]=change.value || '';
                }
            }else{
                if(change.key==''){
                    const key=schema.preferences.namespace_keys ? `goby[${change.name}]`:change.name;
                    
                    if(change.type!=='select'){
                        schema.fields.push({
                            name:change.name,
                            type:change.type,
                            key,
                        })
                    }else if(change.type=='select'){
                        const options:{name:string}[]=(change.value || []).map((name)=>({name}));
                        schema.fields.push({
                            name:change.name,
                            type:change.type,
                            options,
                            max:change.max,
                            key
                        })
                    }

                    change.key=key;
                    
                }


                const field=schema.fields.find((f)=>f.key==change.key);

                if(field){
                    if(!field.values) field.values = {};

                    // will need to stringify tags
                    // this change and the below schema change will need to be in callbacks that only fire if the relevant async POST goes through to are.na
                    field.values[id]=change.value;

                    if(change.type=='select' && field.type=='select'){
                        for(let selection of change.value || []){
                            const is_new=!field.options.some((o)=>o.name==selection);
                            if(is_new){
                                field.options.push({
                                    name:selection
                                })
                            }
                        }
                    }
                    
                }
            }
        }

        // then write schema to localstorage as channel slug
        window.localStorage.setItem(channel_slug,JSON.stringify(schema));
    }
}



async function make_v3_request(data:{
        method:"GET" | "POST" | "PUT";
        type:"api" | 'auth';
        resourceId?:string;
        category:"channels" | "me";
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


export type ChannelBlock = Block | Channel;