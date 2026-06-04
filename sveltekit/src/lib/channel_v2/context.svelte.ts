import type { ChannelBlock } from "$lib/arena-v3";
import type { GobySchema } from "./goby";

export let page_size=24;

export let channel_data:{
    slug?:string;
    title?:string;
    description?:string;
    owner?:string;
    url?:string;
    blocks:ChannelBlock[]
    length:number;
    schema?:GobySchema;
}=$state({
    length:0,
    blocks:[],
    schema:{
        fields:[
            {type:'string',name:'Comments',key:'goby[Comments]'},
            {type:'boolean',name:'Watched',key:'goby[Watched]'}
        ]
    }
})

export let expanded_block:{id:number | undefined} = $state({
    id:undefined
})


