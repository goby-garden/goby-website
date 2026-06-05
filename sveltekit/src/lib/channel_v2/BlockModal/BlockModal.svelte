<script lang="ts">
    import {goto} from '$app/navigation';
    import {channel_data, expanded_block, profile} from '$lib/channel_v2/context.svelte';
    import parse from '$lib/markdown';
    import type { GobyField, GobyFieldMap, GobyFieldType } from '$lib/channel_v2/goby';
    import type {FieldBinding} from './types';
    import FieldInput from './FieldInput.svelte';
    import { save_block_fields, type ChannelBlock } from '$lib/arena-v3';

    let modal:HTMLElement | undefined = $state();

    let edit_mode=$state(false);

    let prev_expanded=$state(expanded_block.id);
    let clear_expand_timeout:ReturnType<typeof setTimeout> | undefined;

    let open=$derived(expanded_block.id!==undefined);

    let content_focused=$state(false);


    async function closeModal(save = false){
        if(edit_mode){
            const tracked_changes=field_bindings.filter((f)=>f.changed);
            if(tracked_changes.length>0){
                if(save && block){
                    // create a save function
                    // depending on if authenticated + have edit access, save to localstorage or api
                    // if authenticated, also needs to decide whether to save canon fields to root or to metadata depending on block ownership and config
                    // for api, use https://www.are.na/developers/explore/block/put-block to batch changes in one request
                    // await the response before closing edit_mode (non-eager)
                    const fields_with_changes=fields.filter((f)=>tracked_changes.some((b)=>b.key==f.key));

                    const changes:GobyField[]=fields_with_changes.map((f)=>{
                        const change={
                            ...f
                        }
                        const binding=tracked_changes.find((a)=>a.key==change.key);

                        if(binding && binding.key==change.key && binding.getValue){
                            change.value=binding.getValue();
                        }
                        return change;
                    })
                    // getValue


                    await save_block_fields({
                        authenticated:profile.authenticated,
                        changes,
                        channel_slug:channel_data.slug,
                        id:block.id,
                        schema:channel_data.schema
                    })
                }else{
                    // *possibly* flash an alert that you changed stuff, prompting you to either save or discard
                }
            }

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

    let block:ChannelBlock | undefined = $derived(channel_data.blocks.find(({id})=>expanded_block.id ?(id==expanded_block.id):(id==prev_expanded)));
    let isImage=(block:ChannelBlock)=>block?.type=='Image' || block?.type == 'Link';


    let canon_fields:GobyField[]=$derived.by(()=>{
        // need to generalize these as an accessor function, so they’re used in other places where title appears
        // e.g. title of each block in block Contents
        const title_override= block?.id && channel_data.schema?.overrides?.title?.values?.[block.id];
        const description_override= block?.id && channel_data.schema?.overrides?.description?.values?.[block.id];
        return [
            {
                name:'Title', type:'string',
                value:title_override ? title_override : block?.title || '', 
                canon:true,
                key:"goby.title"
            },
            {
                name:'Description', 
                type:'string',
                value:description_override ? description_override : block?.description?.markdown || '', 
                canon:true,
                key:"goby.description"
            }
        ]
    });

    let goby_fields:GobyField[] = $derived((channel_data.schema?.fields || []).map((field)=>{
        const core_fields={
            name:field.name,
            key:field.key,
        };

        const blockValue=block?.metadata?.[field.key];
        const localValue = block?.id && field.values ? field.values[block.id] : undefined;
        // for tomorrow: continue with process to save localValue, maybe as a fallback of blockValue.

        if(field.type==='select'){
            return {
                ...core_fields,
                type:field.type,
                value:null,
                max:field.max
            }
        }else if(field.type=="string"){
            const value = blockValue!==undefined && blockValue!==null ? `${blockValue}`:'';

            return {
                ...core_fields,
                type:field.type,
                value
            }
        }else{
            const value = typeof blockValue=="boolean"?blockValue:null;
            return {
                ...core_fields,
                type:field.type,
                value
            }
        }
    }))


    let fields = $derived([
        ...canon_fields,
        ...goby_fields
        // ...maybe newly created fields can go below here before they’re saved
    ]);


    // type GobyKeyValue = {
    //     [T in GobyFieldType]:
    //     {
    //         type:T
    //         value: GobyFieldMap[T] | null;
    //     }
    // }[GobyFieldType];


    // NOTE: now that I have this insane binding,
    // consider just binding up editable_field directly
    let field_bindings:FieldBinding[] = $state([]);
    
    $effect(()=>{
        if(!edit_mode){
            field_bindings = fields.map((f)=>({
                key:f.key,
                type:f.type,
                changed:false
            }));
        }
    })
    


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
</script>

<svelte:window onkeydown={closeOnEsc} />

<div bind:this={modal} class="modal" class:open aria-modal="true" class:edit-mode={edit_mode}>
    <button aria-label="Close block modal" class="backdrop-close" onclick={()=>closeModal()}></button>
    {#if block}
        <figure class="block-content panel" data-type={block?.type} class:focused={content_focused}>
            {#if isImage(block)}
                {#key block.id}
                    <img width={block.image?.width || 2000} height={block.image?.height || 2000} alt={block.image?.alt_text} src={block.image?.medium?.src} />
                {/key}
            {:else if block.type=='Embed'}
                {@html block.embed?.html || ''}
            {:else if block.type=='Attachment'}
                <iframe title="{block.title || ''}" src="{block.attachment.url}"></iframe>
            {:else if block.type=="Text" &&  typeof block?.content?.markdown == "string"}
                <div class="prose">
                    <FieldInput 
                        field={{
                            name:'',
                            key:'',
                            type:'string',
                            value:block.content.markdown
                        }} bind:edit_mode
                        bind:focused={content_focused}
                        height="fill"
                     />
                </div>
            {/if}
        </figure>
        <sidebar class="panel">
            <div class="sidebar-overscroll">
                <section class="fields">
                    {#key block.id}
                        {#each fields as field,f}
                            <div class="field-wrapper" class:description={field.key=="goby.description"} class:canon={field.canon}>
                                <!-- bind:changed={field_bindings[f].changed}  -->
                                <FieldInput bind:field_binding={field_bindings[f]} {field} bind:edit_mode markdown={field.key!=="goby.title"}/>
                            </div>
                        {/each}
                    {/key}
                </section>
            </div>
            {#if edit_mode}
                <div class="save-controls">
                    <button id="cancel-changes" onclick={()=>closeModal()}><span class="monospace">×</span></button>
                    <button id="save-changes" onclick={()=>closeModal(true)}><span class="monospace">Save changes</span></button>
                </div>
            {/if}
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
        height:100%;
        pointer-events:var(--pointer-events);
    }

    .sidebar-overscroll{
        height:fit-content;
        max-height:100%;
        width:100%;
        overflow-y:auto;
        overflow-x:hidden;
        margin:-1px;
        padding:1px;
        pointer-events:var(--pointer-events) !important;
    }

    .edit-mode .sidebar-overscroll::after{
        display:block;
        height:80px;
        content:'';
        width:100%;
    }

    .save-controls{
        position:absolute;
        bottom:0;
        width:calc(100% - 2px);
        border-bottom:1px solid gainsboro;
        display:flex;
        flex-flow:row nowrap;
        justify-content:flex-end;
        box-sizing:border-box;
        padding:15px;
        padding-top:30px;
        gap:10px;
        background:linear-gradient(0deg,var(--gray) 50%,transparent);
    }

    .save-controls button{
        background-color:rgba(22, 22, 22, 1);
        color:white;
        padding:6px 15px;
        text-transform:uppercase;
    }

    #save-changes{
        flex:1;
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
        border-top:1px solid gainsboro;
        pointer-events:var(--pointer-events);
    }

    .modal:not(.edit-mode) .field-wrapper.canon{
        --pad-v-inner:5px;
    }

    .field-wrapper.canon.description{
        --field-padding-block:var(--pad-v-inner) 15px;
    }

    .modal:not(.edit-mode) .field-wrapper.canon,
    .field-wrapper:first-child{
        border-top:none;
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
        pointer-events:var(--pointer-events) !important;
        /* flex: 1; */
        /* aspect-ratio:1; */
        width:calc(100lvh - 80px);
        max-width:100%;
    }

    figure iframe,
    figure :global(iframe),
    figure img{
        width:100%;
        height:100%;
        object-fit:contain;
        object-position:center;
        pointer-events:var(--pointer-events) !important;
    }

    figure[data-type="Image"],
    figure[data-type="Link"],
    figure[data-type="Embed"]{
        padding:20px;
    }

    figure[data-type="Text"]{
        max-width:800px;
        /* padding:0px; */

        &.focused{
            z-index:100;

            outline:1px solid rgba(22, 22, 22, 1);
        }
    }
    

    figure .prose{
        /* font-family:'Times New Roman', serif; */
        font-size:20px;
        line-height:1.4em;
        min-height:100%;
        height:100%;
        --field-padding-block:20px;
        --field-padding-inline:20px;
        overflow-y:auto;
        max-height:100%;
        pointer-events:var(--pointer-events);
        /* position:absolute;
        top:0;
        left:0;
        width:100%; */
    }

    .panel{
        position:relative;
        /* border:1px solid gainsboro; */
        box-sizing:border-box;
        background-color:white;
        padding:1px;
        outline:1px solid gainsboro;
        outline-offset:-1px;

        /* padding:1px;
        margin:-1px; */
        /* padding:20px; */
    }

    .edit-mode .panel{
        background-color:var(--gray);
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