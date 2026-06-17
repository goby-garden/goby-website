<script lang="ts">
    import {onMount} from 'svelte';
    import {goto} from '$app/navigation';
    import { get_channel_meta } from '$lib/arena-v3';
    import Nav from '$lib/channel_v2/Nav/Nav.svelte';
    import Contents from '$lib/channel_v2/Contents.svelte';
    import BlockModal from '$lib/channel_v2/BlockModal/BlockModal.svelte'
    import {channel_data, document_state, expanded_block} from '$lib/channel_v2/context.svelte';
    import parse from '$lib/markdown';

    let channel_slug:string | undefined=$state();

    $effect(()=>{
        if(channel_slug&&channel_slug!==channel_data.slug){
            
            // replaceState("",`${window.location.pathname}?${channel_data.slug}#${window.location.hash}`);
            channel_data.slug=channel_slug;
            console.log('setting ',channel_data.slug)
            goto(
                `${window.location.pathname}?${channel_data.slug}${window.location.hash}`,
                {
                    replaceState:true
                }
            )

            // https://www.are.na/word-and-image/the-making-is-a-remaking
            channel_data.blocks=[];
            load_channel(channel_slug);
        }
    })

    async function load_channel(slug:string){
        let results=await get_channel_meta(slug);
        console.log('results',results)
        if(results){
            channel_data.title=results.title;
            channel_data.description=results?.description?.markdown;
            channel_data.owner=results.owner?.name;
            channel_data.length=results.counts?.contents;

            if(!channel_data.url && results.owner?.slug){
                channel_data.url=`https://www.are.na/${results.owner?.slug}/${channel_data.slug}`
            }
            // if(window.location.hash.length>1)
        }
    }

    onMount(()=>{
        if(window.location.search.length>1){
            channel_slug=window.location.search.slice(1,window.location.search.length);
        }

        // https://hidde.blog/console-logging-the-focused-element-as-it-changes
        document.addEventListener('focus',()=>{
            if(document.activeElement ){
                document_state.activeElement = document.activeElement;
            }
            
        },true)
        document.addEventListener('blur',()=>{
            window.requestAnimationFrame(()=>{
                if(!document.activeElement || document.activeElement === document.body){
                    document_state.activeElement = undefined;
                }
                
            })
        },true)
    })

</script>

<main>
    <Nav bind:channel_slug />
    <header inert={expanded_block.id!==undefined}>
        {#if channel_data.title}
            <h1>{channel_data.owner} / <span class="channel-title">{channel_data.title}</span></h1>
        {/if}
        {#if channel_data.description}
            <div class="description prose">
                {@html parse(channel_data.description || '')}
            </div>
        {/if}
     </header>
     <Contents />
     <BlockModal />
</main>


<style>
    main{
        width:calc(100% - 40px);
        max-width:1100px;
        margin-inline:auto;
        padding-block:40px;
    }

    /* .channel-title{
        font-weight:600;
    } */
     h1{
        font-weight:600;
     }

    header{
        display:flex;
        flex-flow:column nowrap;
        gap:10px;
        margin-bottom:10px;
    }
</style>