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
    can_edit?:boolean;
}=$state({
    length:0,
    blocks:[],
    schema:{
        fields:[],
        preferences:{ namespace_keys:true }
    }
})

export let expanded_block:{id:number | undefined} = $state({
    id:undefined
})

export let auth_modal = $state({
    open:false
})

export let profile: {
    slug?:string;
    name?:string;
    avatar?:string;
    // add more attributes once known
} = $state({
    slug:undefined
})


export let document_state:{
    activeElement:Element | undefined
} = $state({
    activeElement:undefined
})