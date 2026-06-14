import type { ChannelBlock } from "$lib/arena-v3";
import type { GobySchema } from "./goby";
import { browser } from "$app/environment";

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
            {type:'select',name:'Tags',key:'goby[Tags]',max:'multiple',options:[]},
            {type:'select',name:'Category',key:'goby[Category]',max:'single',options:[]},
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


export let document_state:{
    activeElement:Element | undefined
} = $state({
    activeElement:undefined
})

if(browser){
    // https://hidde.blog/console-logging-the-focused-element-as-it-changes
    document.addEventListener('focus',()=>{
        if(document.activeElement ){
            document_state.activeElement = document.activeElement;
        }
        
    },true)
    document.addEventListener('blur',()=>{
        if(!document.activeElement || document.activeElement === document.body){
            document_state.activeElement = undefined;
        }
        
    },true)
}