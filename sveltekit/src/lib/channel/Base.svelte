<script lang="ts">
    import {onMount} from 'svelte';
    import {goto} from '$app/navigation';
    import { get_channel_meta, get_current_profile } from '$lib/arena-v3';
    import Nav from '$lib/channel/Nav/Nav.svelte';
    import Contents from '$lib/channel/Contents.svelte';
    import BlockModal from '$lib/channel/BlockModal/BlockModal.svelte'
    import {channel_data, expanded_block, profile} from '$lib/channel/context.svelte';
    import parse from '$lib/markdown';

    let channel_slug:string | undefined=$state();

    $effect(()=>{
        if(channel_slug&&channel_slug!==channel_data.slug){
            channel_data.slug=channel_slug;
            goto(
                `${window.location.pathname}?${channel_data.slug}${window.location.hash}`,
                {
                    replaceState:true
                }
            )
            channel_data.blocks=[];
            load_channel(channel_slug);
        }
    })

    async function load_channel(slug:string){
        let results=await get_channel_meta(slug);
        
        if(results){
            channel_data.title=results.title;
            channel_data.description=results?.description?.markdown;
            channel_data.owner=results.owner?.name;
            channel_data.length=results.counts?.contents;
            channel_data.can_edit=results.can?.update;


            const localSchema=localStorage.getItem(slug);
            const channelSchema = results.metadata?.["goby__schema"];

            const foundSchema = channelSchema || localSchema;
            const schema=foundSchema ? JSON.parse(foundSchema):undefined;

            if(typeof schema == 'object' && "fields" in schema){
                channel_data.schema=schema;
            }


            console.log('results',results)

            if(!channel_data.url && results.owner?.slug){
                channel_data.url=`https://www.are.na/${results.owner?.slug}/${channel_data.slug}`
            }

            if(results.authenticated && !profile.slug){
                load_profile()
            }
        }
    }

    async function load_profile({cache_only = false} = {}){
        const cachedString=localStorage.getItem('profile');
        const cached_profile=cachedString?JSON.parse(cachedString):undefined;

        if(cached_profile){
            profile.slug=cached_profile.slug;
            profile.name=cached_profile.name;
            profile.avatar=cached_profile.avatar;
        }else if(!cache_only){
            const profile_data=await get_current_profile();
            profile.slug=profile_data.slug;
            profile.name=profile_data.name;
            profile.avatar=profile_data.avatar;
            // localStorage.setItem('profile',JSON.stringify($state.snapshot(profile)));
        }
    }

    onMount(()=>{
        if(window.location.search.length>1){
            load_profile({cache_only:true});
            channel_slug=window.location.search.slice(1,window.location.search.length);
        }else{
            load_profile();
        }
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