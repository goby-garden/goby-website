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

export async function get_access_token(code:string,redirect_uri:string){
    return await make_v3_request(
        {
            method:"POST",
            type:'api',
            category:`oauth`,
            endpoint:"/token",
            params:{},
            body:{
                grant_type:'authorization_code',
                // add client_id and client_secret server-side
                redirect_uri,
                code
            }
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

// NonNullable<NonNullable<ChannelBlock["connection"]>["metadata"]>[string]
type ConnectionMetadataValue=string | number | boolean | null;


export async function save_block_fields({
    id,
    changes,
    can_edit,
    channel_slug,
    schema,
    connection
}:{id:number; changes:GobyField[]; can_edit:boolean; channel_slug?:string; schema?:GobySchema; connection?:ChannelBlock["connection"] }){
    if(schema!==undefined && channel_slug!==undefined){
        const connection_updates:{key:string; value:ConnectionMetadataValue}[]=[];
        let schemaUpdated = false;

        // first save changes on schema
        for(let change of changes){

            // if are.na canonical field (title or description)
            if(change.canon){
                type CanonicalKey = keyof NonNullable<GobySchema["overrides"]>;
                const isCanonicalKey=(k:string):k is CanonicalKey=>["title","description"].includes(k);

                const key=change.key.split('__')[1];
                if(isCanonicalKey(key) && change.type=="string"){
                    if(can_edit){
                        // if authenticated and can edit channel connections,
                        // update connection with goby.<key>
                        connection_updates.push({
                            key:change.key,
                            value:change.value
                        })
                    }else{
                        // save as an override in the schema
                        if(!schema.overrides){
                            schema.overrides={
                                title:{values:{}},
                                description:{values:{}}
                            }
                        }
                        schema.overrides[key].values[id]=change.value || '';
                        
                        schemaUpdated=true;
                    }
                    

                }
            }else{
                // if no key, this means it is a new field that needs to be defined in the schema
                if(change.key==''){
                    const key=generate_new_key(change.name,schema,{
                        namespace_keys:schema.preferences.namespace_keys
                    })

                    if(key){
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
                        schemaUpdated=true;
                    }
                                      
                }


                const field=schema.fields.find((f)=>f.key==change.key);

                if(field){
                    if(can_edit){
                        // will need to stringify tags
                        const valueToSave = change.type=='select'?JSON.stringify(change.value || []) : change.value;
                        connection_updates.push({
                            key:change.key,
                            value:valueToSave
                        })
                    }else{
                        if(!field.values) field.values = {};
                        // this change and the below schema change might need to be in callbacks that only fire if the relevant async POST goes through to are.na
                        field.values[id]=change.value;
                        schemaUpdated=true;
                    }

                    if(change.type=='select' && field.type=='select'){
                        for(let selection of change.value || []){
                            const is_new=!field.options.some((o)=>o.name==selection);
                            if(is_new){
                                field.options.push({
                                    name:selection
                                })

                                schemaUpdated=true;
                            }
                        }
                    }
                    
                }
            }
        }

        console.log('connection_updates',connection_updates)

        const promises:Promise<any>[]=[];


        if(schemaUpdated){
            const stringified_schema=JSON.stringify(schema);
            if(can_edit){
                promises.push(new Promise(async (res)=>{
                    let channel_update=await make_v3_request({
                        method:"PUT",
                        type:'api',
                        category:'channels',
                        endpoint:'/',
                        resourceId:channel_slug,
                        params:{},
                        body:{
                            metadata:{
                                "goby__schema":stringified_schema
                            }
                        }
                    })

                    if(channel_update?.metadata?.goby__schema){
                        schema=channel_update?.metadata?.goby__schema;
                    }

                    res(true);
                }))
            }else{
                 // then write schema to localstorage as channel slug
                window.localStorage.setItem(channel_slug,stringified_schema);
            }
        }

        if(connection_updates.length>0){
            // fire away an async await req to update the blocks
            // maybe add a loading message to save button

            const metadata=connection_updates.reduce((obj:Record<string,ConnectionMetadataValue>,{key,value})=>{
                obj[key] = value;
                return obj;
            },{})

            if(can_edit){

                promises.push(new Promise(async (res)=>{
                    if(connection){
                        let connection_update = await make_v3_request({
                            method:"PUT",
                            type:'api',
                            category:'connections',
                            endpoint:'/',
                            resourceId:`${connection.id}`,
                            params:{},
                            body:{
                                metadata
                            }
                        })

                        if(connection_update?.metadata){
                            connection.metadata=connection_update?.metadata;
                        }
                    }

                    res(true);
                }))
            }
        }

        if(promises.length>0){
            await Promise.all(promises);
        }

    }
}

const filter_non_alphanumeric=(str:string)=>{
    let filtered='';
    for (let i = 0, len = str.length; i < len; i++) {
        let code = str.charCodeAt(i);
        // derived from
        // https://stackoverflow.com/questions/4434076/best-way-to-alphanumeric-check-in-javascript
        if ((code > 47 && code < 58) || // numeric (0-9)
            (code > 64 && code < 91) || // upper alpha (A-Z)
            (code > 96 && code < 123) ||  // lower alpha (a-z)
            str[i]==='_' // allow underscores
        ) {
            filtered+=str[i];
        }
    }
     return filtered;
}

function generate_new_key(name:string,schema:GobySchema,{namespace_keys = true} = {}){
    const existing_keys=[
        'goby__title',
        'goby__description',
        'goby__schema',
        ...schema.fields.map((a)=>a.key)
    ];

    const prefix=namespace_keys?'goby__':'';
    const escaped_key=prefix+filter_non_alphanumeric(name.trim().replaceAll(' ','_'))

    if(existing_keys.includes(escaped_key)){
        let i=1;
        let key=`${escaped_key}__${i}`;
        while(existing_keys.includes(key) || i>50){
            i++;
            key=`${escaped_key}__${i}`;
        }

        if(i<=50){
            return key;
        }
    }else{
        return escaped_key;
    }


    


    // generate_new_key
}


async function make_v3_request(data:{
        method:"GET" | "POST" | "PUT";
        type:"api" | 'auth';
        resourceId?:string;
        category:"channels" | "me" | "connections" | 'oauth';
        endpoint:"/" | "/contents" | '/token';
        params:{[key:string]:string|number}
        user?:string;
        body?:Record<string,any>
    }){
    const reqBody=JSON.stringify(data);

    let result;
    try{
        result=await fetch(netlify_fn, {
            method: "POST",
            headers:{
                'Content-Type': 'application/json'
            },
            body:reqBody
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