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
            {type:'boolean',name:'Watched',key:'goby[Watched]'},
            {type:'select',name:'Category',key:'goby[Category]',max:'single',options:[]},
            {type:'select',name:'Tags',key:'goby[Category]',max:'multiple',options:[]}
        ]
    }
})

export let expanded_block:{id:number | undefined} = $state({
    id:undefined
})

export let profile: {
    authenticated:false
} | {
    authenticated:true
    // add more attributes once known
} = $state({
    authenticated:false
})
