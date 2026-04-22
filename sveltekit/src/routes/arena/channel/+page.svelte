<script lang="ts">
    import { marked } from "marked";

    import Nav from '$lib/channel/Nav.svelte';
    import {get_channel_meta} from '$lib/arena-v3';

    import {channel_data} from '$lib/channel/context.svelte';



    let user:string | undefined;



    async function test_channel_meta(slug:string){
        let results=await get_channel_meta(slug);
        if(results){
            channel_data.title=results.title;
            channel_data.description=results?.description?.markdown;
            channel_data.owner=results.owner?.name;
        }

        console.log(results);
    }

    // async function test_channel_contents(slug:string){
    //     let results=await get_channel_contents({slug:slug});
    //     console.log(results);
    // }

    let channel_slug:string | undefined=$state();
    let block_id:string | undefined=$state()

    $effect(()=>{
        if(channel_slug){
            test_channel_meta(channel_slug);
        }
    })

    $inspect('channel_data',channel_data)

    const note_to_team=`Hi are.na team! There’s nothing here yet, but this is a WIP <a href="https://www.are.na/block/41094297">idea</a> that I’m working on getting running in time for the meetup next week :^). Please prioritize other people who have projects ready — I just wanted it to put this in my RSVP so you know I’m potentially interested in sharing something. And no hard feelings if you can’t include me. Thank you / looking forward to it!!`;
</script>


<div class="grid">
    <Nav bind:channel_slug bind:block_id />
    
    {#if channel_data.description}
        <header>
            <div class="description">
                {@html marked(channel_data.description || '')}
            </div>
        </header>
    {/if}
    <details id="what-is-this" open>
        <summary>what is this?</summary>
        {@html note_to_team}
    </details>
    <main></main>
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

    main{
        grid-column:1 / calc(var(--block-columns) + 1);
        grid-row:2;
        min-height:100vh;
    }

    header{
        margin-block:10px;
    }

</style>