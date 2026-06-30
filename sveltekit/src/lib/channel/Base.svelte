<script lang="ts">
    import {onMount} from 'svelte';
    import {goto} from '$app/navigation';
    import { get_access_token, get_channel_meta, get_current_profile, type ChannelBlock } from '$lib/arena-v3';
    import Nav from '$lib/channel/Nav/Nav.svelte';
    import Contents from '$lib/channel/Contents.svelte';
    import BlockModal from '$lib/channel/BlockModal/BlockModal.svelte'
    import {channel_data, document_state, expanded_block, profile} from '$lib/channel/context.svelte';
    import parse from '$lib/markdown';
    import ModalOverlay from './BlockModal/ModalOverlay.svelte';

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

            localStorage.setItem('last-slug',slug);

            const localSchema=localStorage.getItem(slug);
            const channelSchema = results.metadata?.["goby__schema"];

            const foundSchema = channelSchema || localSchema;
            const schema=foundSchema ? JSON.parse(foundSchema):undefined;

            if(typeof schema == 'object' && "fields" in schema){
                channel_data.schema=schema;
            }else{
                channel_data.schema={
                    fields:[],
                    preferences:{ namespace_keys:true }
                };
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

    $inspect('channel_data.schema',channel_data.schema)

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

    onMount(async ()=>{
        let slug_query='';
        let code;
        for(let [key,value] of new URLSearchParams(window.location.search)){
           if(value.length==0) slug_query=key;
           else if(key=='code') code=value;
        }

        if(slug_query.length>1){
            load_profile({cache_only:true});
            channel_slug=slug_query;
        }else{
            load_profile();
        }

        if(code){
            goto(
                window.location.pathname,
                {
                    replaceState:true
                }
            )

            console.log('detected code. exchanging for token!')
            const checkAuth=await get_access_token(code,'https://goby.garden/arena/channel');
            if(checkAuth?.authenticated){
                console.log('authenticated successfully!')
                load_profile();
                // window.location.search='';
            }

            const last_slug=localStorage.getItem('last-slug');
            console.log('last_slug',last_slug)
            if(last_slug) channel_data.slug=last_slug;
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
        
        
        // console.log('queryString',queryString)
        // queryString.get('code');
    })

    let rendered_blocks: (
        { render_id:string; } | { render_id:string; id:number; } & ChannelBlock
    )[] = $state([]);

    $effect(() => {
        let blocks:typeof rendered_blocks = [];
        for (let b = channel_data.length; b > 0; b--) {
        const matching = channel_data.blocks?.find(
            (block) => block.connection?.position == b,
        );

        const render_id=`${matching ? "block" : "placeholder"}-${matching?.id || b}`;
        if(matching!==undefined){
            blocks.push({
            render_id,
            ...matching
            })
        }else{
            blocks.push({
            render_id
            })
        }
        }
        rendered_blocks = blocks;
    });

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
     <Contents {rendered_blocks} />
     <!-- <BlockModal /> -->
     <ModalOverlay {rendered_blocks} />
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