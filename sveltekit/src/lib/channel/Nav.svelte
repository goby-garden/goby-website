<script lang="ts">
    import NavInput from './NavInput.svelte';
    import {channel_data} from '$lib/channel/context.svelte';
    let {
        channel_slug=$bindable(),
        block_id=$bindable(),
    }:{
        channel_slug?:string;
        block_id?:string
    }= $props();


    let channel_str_components:{type:string;value:string}[]=$state([]);
    let block_str_components:{type:string;value:string}[]=$state([])

    $effect(()=>{
        channel_slug=channel_str_components.find((a)=>a.type=="identifier")?.value?.replace('/','');
        block_id=block_str_components.find((a)=>a.type=="identifier")?.value.replace('/','');
    })


    let scrollY_cache=$state(0);
    let scrollY=$state(0);
    let show_nav=$state(true);

    $effect(()=>{
        if(scrollY_cache!==scrollY){
            show_nav=channel_data.title ? scrollY_cache>scrollY || scrollY==0:true;

            scrollY_cache=scrollY;
        }
    })

    
</script>

<svelte:window bind:scrollY />

<nav class:hide={!show_nav}>
    <li class="input-box" data-input-type="channel">
        <label for="channel-input" class="monospace">Channel</label>
        <NavInput 
            bind:str_components={channel_str_components} 
            bind:url_str={channel_data.url}
            url_type="channel" 
            input_id="channel-input" 
            placeholder="https://are.na/<user>/<channel-slug>" 
            display_value={channel_data.title?`${channel_data.owner} / ${channel_data.title}`:''}
        />
    </li>
    <li class="input-box" data-input-type="block">
        <label for="block-input" class="monospace">Metadata</label>
        <NavInput bind:str_components={block_str_components} url_type="block" input_id="block-input" placeholder="https://are.na/<block>/<id>" />
    </li>
    <li class="arena">
        <div class="profile">

        </div>
        <div id="arena-connection">
            <span class="icon">✱</span>
            <span class="icon">✱</span>
        </div>
    </li>
</nav>
<!-- <div id="arena-connection">
        <span class="icon">✱</span>
        <span class="icon">✱</span>
    </div> -->

<style>

    nav{
        display:grid;
        grid-template-columns:repeat(12,1fr);
        gap:15px;
        /* display:grid; */
        /* grid-template-columns:subgrid; */
        /* flex-flow:row nowrap; */
        /* gap:10px; */
        width:100%;
        /* grid-column: 1 / 12;
        grid-row:1; */
        position:sticky;
        top:15px;
        background-color: rgba(255,255,255,0.5);
        /* backdrop-filter:blur(20px); */
        transition:opacity 0.3s, transform 0.3s;
        
    }

    nav.hide{
        opacity:0;
        transform:translateY(-100%);
    }



    nav li{
        list-style:none;
        
        position:relative;
        min-width:0;
        
        display:flex;
        flex-flow:column nowrap;
        gap:5px;
    }

    nav li.input-box{
        grid-column:span 5;
    }

    nav li{
        flex:1;
    }

    nav li label{
        top:0px;
        left:0px;
    }

    .arena{
        display:flex;
        flex-flow:row nowrap;
        justify-content: flex-end;
        align-items: center;
        gap:10px;
    }

    .profile{
        border-radius:50%;
        background-color: palegoldenrod;
        width:45px;
        aspect-ratio:1;
    }

    #arena-connection{
        /* aspect-ratio:1; */
        display:flex;
        flex-flow:column nowrap;
        justify-content: center;
        text-align:center;
        font-size:25px;
        color:green;
        height:55px;
        width: fit-content;
        box-sizing:border-box;
    }

    #arena-connection .icon{
        line-height:1em;
    }
    
    .input-box[data-input-type="channel"]{
        grid-column:span 6;
    }

    .input-box[data-input-type="block"]{
        grid-column:span 5;
    }

    @media(min-width:900px){
       .input-box[data-input-type="channel"]{
            grid-column:span 8;
        }

        .input-box[data-input-type="block"]{
            grid-column:span 3;
        }
    }



    /* https://www.are.na/nico-chilla/_-editorial-on-screen */
</style>