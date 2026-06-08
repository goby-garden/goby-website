import type { ChannelBlock } from "$lib/arena-v3";
import type { GobySchema } from "./goby";

export function get_canon_value({
    field,
    block,
    overrides = {title:{values:{}},description:{values:{}}}
}:{
    field:'title' | 'description';
    block:ChannelBlock;
    overrides?:GobySchema["overrides"]
}){
    const base_value=field==="title"?block.title:block.description?.markdown;

    return overrides[field].values[block.id] || base_value;
}