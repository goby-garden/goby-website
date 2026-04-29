export let page_size=24;

export let channel_data:{
    slug?:string;
    title?:string;
    description?:string;
    owner?:string;
    url?:string;
    blocks:any[]
    length:number;
}=$state({
    length:0,
    blocks:[]
})

export let focused_block:{id:number | undefined} = $state({
    id:undefined
})


