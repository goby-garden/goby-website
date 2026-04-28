<script lang="ts">
    import type { Attachment } from 'svelte/attachments';
    import {onMount} from 'svelte';
    import { marked } from "marked";

    import { channel_data } from "$lib/channel/context.svelte";
    
    
    let rendered_blocks:any[]=$state([]);

    $effect(()=>{
        let blocks=[];

        for(let b=0;b<(channel_data?.length || 0);b++){
            const matching=channel_data.blocks?.[b];
            blocks.push({
                ...(matching || {}),
                render_id:`${matching?'block':'placeholder'}-${matching?.id || b}`
            })
        }
        rendered_blocks=blocks;
    })


    let observer:IntersectionObserver | undefined;

    onMount(()=>{
        observer=new IntersectionObserver(handle_block_loading,{
            root:document,
            rootMargin:'10px',
            threshold:0
        })
    })

    function handle_block_loading(entries:IntersectionObserverEntry[]){
        console.log(entries);
    }


    const observer_attachment:Attachment = (element)=>{
        if(observer) observer.observe(element);
        return ()=>{
            if(observer && element) observer.unobserve(element);
        }
    }

</script>

<main>
    {#each rendered_blocks as block, b (block.render_id)}
        <a
            class="block"
            class:loaded={block}
            class:channel={block?.type === "Channel"}
            {@attach (!block?.id) && observer_attachment}
            href={block?.id ? `#block-${block?.id}` : null}
            data-page={Math.ceil(b+1 / 12)}
        >
            <figure class="block-inner">
                <div class="block-preview">
                    {#if block?.image}
                        <img
                            alt={block.image.alt_text}
                            src={block.image.small?.src}
                        />
                    {:else if block?.content?.markdown}
                        <div class="block-text-preview prose">
                            {@html marked(block.content.markdown)}
                        </div>
                    {/if}
                </div>
                {#if block?.title}
                    <figcaption class="block-title">
                        <span>{block.title}</span>
                    </figcaption>
                {/if}
            </figure>
        </a>
    {/each}
</main>

<style>
    main {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 15px;
        max-width: 1100px;
        margin-inline: auto;
        margin-top: 20px;
    }

    a.block{
        text-decoration:none;
        color:inherit;
    }

    
    .block {
        grid-column: span 3;
        box-sizing: border-box;
        padding: 9px;
        padding-bottom: 6px;
        --block-bg: rgb(245, 245, 245);
        background-color: var(--block-bg);
        border:1px solid transparent;
        color:#363636;
    }

    .block figure{
        overflow: hidden;
        display: flex;
        flex-flow: column nowrap;
        gap: 10px;
    }

    .block-preview {
        /* border:1px solid gainsboro; */
        aspect-ratio: 1;
        display: grid;
        grid-template-areas: "main";
        min-height: 0;
    }

    .block-preview img {
        grid-area: main;
        object-fit: contain;
        object-position: left center;
        width: 100%;
        height: 100%;
        min-height: 0;
        min-width: 0;
    }

    .block-title {
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;

        font-family: Arial;
        color: #363636;
        font-size: 13px;
        font-weight: 200;
        padding-bottom: 5px;

        & span {
            white-space: nowrap;
        }
    }

    .block.channel {
        border: 1px solid gainsboro;
        background-color: transparent;

        & .block-preview {
            display: none;
        }
    }

     .block[href]:hover,
     .block.channel[href]:hover{
        border:1px solid #363636;
    }

    .block-text-preview {
        height: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        line-height: 1.3em;
        font-size: 14px;
        position: relative;

        & > :global(*) {
            display: inline;
        }

        &::after {
            content: "";
            width: 100%;
            height: 20px;
            background: linear-gradient(0deg, var(--block-bg), transparent);
            position: absolute;
            bottom: 0;
            left: 0;
        }
    }
</style>
