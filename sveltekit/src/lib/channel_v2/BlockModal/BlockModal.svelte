<script lang="ts">
    import {goto} from '$app/navigation';
    import {channel_data, expanded_block} from '$lib/channel_v2/context.svelte';
    import parse from '$lib/markdown';
    import type { GobyField } from '$lib/channel_v2/goby';
    import FieldInput from './FieldInput.svelte';

    let modal:HTMLElement | undefined = $state();

    // let open=$state(false);
    let edit_mode=$state(false);

    let prev_expanded=$state(expanded_block.id);
    let clear_expand_timeout:ReturnType<typeof setTimeout> | undefined;

    let open=$derived(expanded_block.id!==undefined);


    function closeModal(){
        console.log('edit_mode',edit_mode)
        if(edit_mode){
            edit_mode=false;
            return
        }

        prev_expanded=expanded_block.id;
        expanded_block.id=undefined;

        goto(
            `${window.location.pathname}${window.location.search}#`,
            {
                replaceState:true,
                noScroll:true
            }
        )
    }

    let block:{[key:string]:any} | undefined = $derived(channel_data.blocks.find(({id})=>expanded_block.id ?(id==expanded_block.id):(id==prev_expanded)));
    let isImage=$derived(block?.type=='Image' || block?.type == 'Link');


    let base_fields:GobyField[]=$derived([
        {
            name:'Title', type:'string',
            value:block?.title || '', 
            base:true,
            key:"goby.title"
        },
        {
            name:'Description', 
            type:'string',
            value:block?.description?.markdown || '', 
            base:true,
            key:"goby.description"
        }
    ])

    const closeOnEsc = (e:KeyboardEvent) =>{
        if(e.key==="Escape" && open){

            if(
                document.activeElement 
                && document.activeElement instanceof HTMLElement){
                document.activeElement.blur();
            }
            closeModal();
        }
    }


    $inspect('block',block)
</script>

<svelte:window onkeydown={closeOnEsc} />

<div bind:this={modal} class="modal" class:open aria-modal="true" class:edit-mode={edit_mode}>
    <button aria-label="Close block modal" class="backdrop-close" onclick={closeModal}></button>
    {#if block}
        <figure class="block-content panel" data-type={block?.type}>
            {#if isImage}
                {#key block.id}
                    <img width={block.image.width || 2000} height={block.image.height || 2000} alt={block.image.alt_text} src={block.image.medium?.src} />
                {/key}
            {:else if block.type=='Embed'}
                {@html block.embed?.html || ''}
            {:else if block.type=='Attachment'}
                <iframe title="{block.title || ''}" src="{block.attachment.url}"></iframe>
            {:else if typeof block?.content?.markdown == "string"}
                <div class="prose">
                    <FieldInput 
                        field={{
                            name:'',
                            key:'',
                            type:'string',
                            value:block.content.markdown
                        }} bind:edit_mode
                        height="fill"
                     />
                <!-- {@html parse(block.content.markdown)} -->
                </div>
            {/if}
        </figure>
        <sidebar class="panel">
            <section class="fields">
                {#key block.id}
                    {#each base_fields as field,f}
                        <div class="field-wrapper" class:base={field.base}>
                            <FieldInput {field} bind:edit_mode markdown={field.key!=="goby.title"}/>
                        </div>
                    {/each}
                {/key}
            </section>
        </sidebar>
    {/if}
</div>

<style>
    .modal{
        position:fixed;
        width:100%;
        height:100%;
        top:0;
        left:0;
        --pointer-events:all;
        pointer-events:var(--pointer-events) !important;
        transition:opacity 0.3s;
        display:flex;
        flex-flow:column nowrap;
        /* gap:20px; */

        overflow-y:auto;
        box-sizing:border-box;
        padding:40px;

        --sidebar-w:400px;
    }

    .backdrop-close{
        background-color:rgba(255,255,255,0.9);
        pointer-events:var(--pointer-events) !important;
        position:absolute;
        top:0;
        left:0;
        width:100%;
        height:100%;
        cursor:default;
    }


    .modal:not(.open){
        opacity:0;
        --pointer-events:none;
    }

    sidebar{
        flex:1;
        min-height:0;
        height:fit-content;
        margin-left:-1px;
    }

    sidebar,sidebar section{
        display:flex;
        flex-flow:column nowrap;
        /* gap:10px; */
    }

    sidebar section{
        display:contents;
    }
    

    .field-wrapper{
        --pad-v-outer:20px;
        --pad-v-inner:15px;
        --field-padding-block:var(--pad-v-inner);
        --field-padding-inline:20px;
        /* --inline-padding
        --field-padding:15px 20px; */
        border-bottom:1px solid gainsboro;
    }

    .modal:not(.edit-mode) .field-wrapper.base{
        --pad-v-inner:5px;
    }

    .modal:not(.edit-mode) .field-wrapper.base,
    .field-wrapper:last-child{
        border-bottom:none;
    }

    .field-wrapper:first-child{
        --field-padding-block:var(--pad-v-outer) var(--pad-v-inner);
    }

    .field-wrapper:last-child{
        --field-padding-block:var(--pad-v-inner) var(--pad-v-outer);
    }

    /* :edit-mode */

    .field-wrapper:first-child{
        /* --field-padding:20px 20px 15px; */
    }

    .field-wrapper:last-child{
        /* --field-padding:15px 20px 20px; */
    }

    figure{
        padding:20px;
        box-sizing:border-box;
        /* flex: 1; */
        /* aspect-ratio:1; */
    }

    figure iframe,
    figure :global(iframe),
    figure img{
        width:100%;
        height:100%;
        object-fit:contain;
        object-position:center;
    }

    figure[data-type="Text"]{
        max-width:800px;
        overflow-y:auto;
        padding:0px;
    }

    figure .prose{
        /* font-family:'Times New Roman', serif; */
        font-size:20px;
        line-height:1.4em;
        min-height:100%;
        display:contents;
        --field-padding-block:20px;
        --field-padding-inline:20px;
    }

    .panel{
        position:relative;
        border:1px solid gainsboro;
        box-sizing:border-box;
        background-color:white;
        /* padding:20px; */
    }

    @media(min-width:900px){
        .modal{
            flex-flow:row nowrap;
            justify-content:center;
        }

        figure{
            min-height:0;
        }

        sidebar{
             width:var(--sidebar-w);
             max-width:var(--sidebar-w);
             min-width: var(--sidebar-w);
        }
    }
</style>