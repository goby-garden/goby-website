<script lang="ts">
    import {replaceState} from '$app/navigation'
    import {browser} from '$app/environment';
    import {onMount} from 'svelte';
    import {channel_data,focused_block} from './context.svelte';
    import parse from "$lib/markdown";

    
 

    let open=$state(false);

    let prev_focused=$state(focused_block.id);
    
    let clear_focus_timeout:ReturnType<typeof setTimeout> | undefined;

    $effect(()=>{
        if(focused_block.id && focused_block.id!==prev_focused){
            if(clear_focus_timeout) clearTimeout(clear_focus_timeout);
            open=true;
            prev_focused=focused_block.id;
        }
    })

    let block:any = $derived(open && channel_data.blocks.find(({id})=>id==focused_block.id));
    

    let core_fields=$derived([
        {name:'Title', type:'string',value:block.title || ''},
        {name:'Description', type:'string',value:parse(block.description?.markdown || '')}
    ])

    // $effect(()=>{
    //     if(browser && open && !block){
    //         closeModal();
    //     }
    // })

    function closeModal(){
        open=false;
        setHash("");
        clear_focus_timeout=setTimeout(()=>{
            focused_block.id=undefined;
            prev_focused=focused_block.id;
        }, 300)

        // setTimeout(()=>{

        // })
    }

    function setHash(v:string){
        replaceState("",`${window.location.pathname}${window.location.search}#${v}`);
    }

    $inspect('block',block)

    function parseHash(){
        if(browser){
            const hash=window.location.hash;
            if(hash){
                const [,id]=hash.split('-');
                if(id){
                    focused_block.id=parseInt(id);
                }
            }
        }
    }

    onMount(()=>{
        parseHash();
        window.addEventListener('hashchange',parseHash);
    })

    let isImage=$derived(block.type=='Image' || block.type == 'Link');
</script>


<div class="modal" class:open>
    <button aria-label="Close block modal" class="backdrop-close" onclick={closeModal}></button>
    <div class="modal-panel" role="dialog">
        <figure
            class='panel-element'
            class:image={isImage}
            class:text={block.type=='Text'}
        >
          {#if isImage}
            <img alt={block.image.alt_text} src={block.image.medium?.src} />
          {:else if block.type=='Embed'}
            {@html block.embed?.html || ''}
          {:else if block.type=='Attachment'}
            <iframe title="{block.title || ''}" src="{block.attachment.url}"></iframe>
          {:else if block?.content?.markdown}
            <div class="prose">
              {@html parse(block.content.markdown)}
            </div>
          {/if}
        </figure>
        <sidebar>
            {#each core_fields as field}
                {#if field.value}
                    <div class="field panel-element" data-name="{field.name}">
                        <!-- <label class="monospace">{field.name}</label> -->
                        <div class="field-value">
                            {#if field.type=='string'}
                            <div class="display prose">
                                {@html field.value}
                                <!-- {core_fields} -->
                                <!-- {field.name=='title'} -->
                            </div>
                            {/if}
                        </div>
                        
                    </div>
                {/if}
                <!-- {@const v=block[field.arena_field]} -->
            {/each}
            <!-- <button onclick={closeModal}>x</button> -->
            <!-- {#if block}

            {/if} -->
        </sidebar>
    </div>
</div>


<style>
    .modal{
        /* opacity:0; */
        position:fixed;
        top:0;
        left: 0px;
        width:100%;
        height:100%;
        display:grid;
        grid-template-columns:repeat(12,1fr);
        padding-block:40px;
        padding-inline:20px;
        box-sizing:border-box;
        pointer-events:none;
        --block-bg: rgb(245, 245, 245);
    }

    .modal.open{
        opacity:1;
        pointer-events:all;
    }

    .backdrop-close{
        position:absolute;
        width:100%;
        height:100%;
        top:0;
        left:0;
        opacity:0;
        background-color:rgba(255,255,255,0.85);
        transition:opacity 0.3s;
    }

    .open .backdrop-close{
        opacity:1;
    }

    .modal-panel{
        grid-column: 1 / 13;
        height:100%;
        min-height:0;
        /* border:1px solid green; */
        display:flex;
        gap:15px;
        align-items:flex-start;
        position:relative;
        z-index:5;
        pointer-events: none;
    }

    .open .modal-panel >*{
        pointer-events:all;
    }

    figure,sidebar{
        opacity:0;
        transition:transform 0.3s, opacity 0.3s;
        
    }
    
    .panel-element{
        background-color:white;
        box-shadow: 1px 1px 10px 0px rgba(153, 113, 133, 0.15);
    }

    figure{
        min-height:0;
        min-width:0;
        height:100%;
        box-sizing:border-box;
        padding:20px;
        /* background-color: var(--block-bg); */
        
        border-radius:3px;
        transform:scale(0.85);
    }

    sidebar{
        display:flex;
        flex-flow:column nowrap;
        gap:10px;
        color:#363636;
        /* transform:translate(20px,20px); */
    }

    .field{
        box-sizing:border-box;
        padding:15px;
        display:flex;
        flex-flow:column nowrap;
        gap:5px;
    }

    .field[data-name="Title"]{
        font-weight:600;
        font-family:Arial;
    }

    .field-value .prose{
        line-height:1.4em;
        font-family:Arial;

        & > :global(p:last-child){
            margin-bottom:0px;
        }
    }

    

    .open figure{
        transform:scale(1);
    }

    .open sidebar{
        transform:translate(0px,0px);
        transition-delay:0.3s;
    }

    .open figure,
    .open sidebar{
        opacity:1;
    }

    figure.text{
        overflow-y:auto;
    }
    
    figure .prose{
        font-size:20px;
        line-height:1.25em;

        & :global(blockquote){
            padding-left:20px;
        }
    }

    figure iframe,
    figure :global(iframe),
    figure img{
        width:100%;
        height:100%;
        object-fit:contain;
        object-position:center;
    }


    figure :global(iframe){
        width:100%;
    }
    

    @media(min-width:900px){
        .modal-panel{
            display:grid;
            grid-template-columns:subgrid;
        }

        figure{
            grid-column:1 / 9;
        }

        sidebar{
            grid-column:9 / 13;
        }
    }

    @media(min-width:1200px){
        figure{
            grid-column:2 / 9;
        }

        sidebar{
            grid-column:9 / 12;
        }
    }
    
</style>