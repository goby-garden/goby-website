<script lang="ts">
    import '$lib/channel_v2/global.css';
    import Input from '$lib/channel_v2/Nav/Input.svelte';
    import {channel_data, expanded_block} from '$lib/channel_v2/context.svelte';

    let {
        channel_slug=$bindable(),
    }:{
        channel_slug?:string;
    } = $props();


    
    let channel_str_components:{type:string;value:string}[]=$state([]);

    $effect(()=>{
        channel_slug=channel_str_components.find((a)=>a.type=="identifier")?.value?.replace('/','');
    })

    $effect(()=>{
        if(channel_data.title){
            console.log('blurring',document.getElementById('channel-url-input'))
            document.getElementById('channel-url-input')?.blur();
        }
    })
</script>

<nav inert={expanded_block.id!==undefined}>
    <Input 
        bind:str_components={channel_str_components} 
        bind:url_str={channel_data.url}
        url_type="channel" 
        input_id="channel-url-input" 
        placeholder="https://www.are.na/<user>/<channel-slug>"
    />
    
    <!-- <input bind:this={input_el} class="monospace" autocomplete="off" bind:value={url_str} id="channel-url-input" type="text" placeholder="https://are.na/<user>/<channel-slug>" /> -->
</nav>


<style>
    nav{
        margin-bottom:10px;
    }
</style>


