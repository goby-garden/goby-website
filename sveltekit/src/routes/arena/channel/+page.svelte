<script lang="ts">
    import { marked } from "marked";
   
    import {get_channel_meta, get_channel_contents} from '$lib/arena-v3';
    import {channel_data} from '$lib/channel/context.svelte';

    import Nav from '$lib/channel/Nav.svelte';
    import Contents from '$lib/channel/Contents.svelte';


    let user:string | undefined;



    async function load_channel(slug:string){
        let results=await get_channel_meta(slug);
        if(results){
            channel_data.title=results.title;
            channel_data.description=results?.description?.markdown;
            channel_data.owner=results.owner?.name;
        }

        // delay 300ms
        await new Promise((res)=>setTimeout(res,300));

        let {data,meta}=await get_channel_contents({
            slug
        })

        channel_data.blocks=data;
        channel_data.length=meta.total_count;
        
    }

    // async function test_channel_contents(slug:string){
    //     let results=await get_channel_contents({slug:slug});
    //     console.log(results);
    // }

    let channel_slug:string | undefined=$state();
    let block_id:string | undefined=$state()

    $effect(()=>{
        if(channel_slug){
            load_channel(channel_slug);
        }
    })

    $inspect('channel_data',channel_data)

    const note_to_team=`Hi are.na team! There’s nothing here yet, but this is a WIP <a href="https://www.are.na/block/41094297">idea</a> that I’m working on getting running in time for the meetup next week :^). Please prioritize other people who have projects ready — I just wanted it to put this in my RSVP so you know I’m potentially interested in sharing something. And no hard feelings if you can’t include me. Thank you / looking forward to it!!`;
</script>


<div class="grid">
    <Nav bind:channel_slug bind:block_id />
    
    {#if channel_data.description}
        <header>
            <div class="description prose">
                {@html marked(channel_data.description || '')}
            </div>
        </header>
    {/if}
    
    
        <Contents />

    <details id="what-is-this" open>
        <summary>what is this?</summary>
        {@html note_to_team}
    </details>


    <!-- <sidebar>
        <div id="arena-connection">
            <span class="icon">✱</span>
            <span class="icon">✱</span>
        </div>
        <div id="block-editor">

        </div>
    </sidebar> -->
</div>


<style>

    #what-is-this{
        & summary{
            margin-top:20px;
            margin-bottom:10px;
            font-style:italic;
            cursor:pointer;
        }
        line-height:1.3em;
        margin-bottom:10px;
    }

    .grid{
        /* display:grid; */
        --block-columns:4;
        /* grid-template-columns:repeat(var(--block-columns),1fr);
        grid-template-rows:min-content 1fr; */
        gap:15px;
        box-sizing:border-box;
        padding-inline:15px;
        padding-top:15px;
    }

    header{
        margin-block:10px;
    }

</style>