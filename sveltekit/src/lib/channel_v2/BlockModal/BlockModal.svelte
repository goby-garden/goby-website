<script lang="ts">
    import {goto} from '$app/navigation';
    import {channel_data, expanded_block, profile} from '$lib/channel_v2/context.svelte';
    import type { GobyField, GobyFieldMap, GobyFieldType } from '$lib/channel_v2/goby';
    import FieldInput from './FieldInput.svelte';
    import { save_block_fields, type ChannelBlock } from '$lib/arena-v3';
    import { get_canon_value } from '../goby-utils';

    let modal:HTMLElement | undefined = $state();

    let edit_mode=$state(false);

    let prev_expanded=$state(expanded_block.id);
    let clear_expand_timeout:ReturnType<typeof setTimeout> | undefined;

    let open=$derived(expanded_block.id!==undefined);

    let content_focused=$state(false);

    function differentValues({edited,field}:{edited:GobyField,field:GobyField}){
        const simplify = (v:typeof field.value)=>v=='\n' || !v ? '':v;
        return simplify(edited.value)!==simplify(field.value);
    }


    async function closeModal(save = false){
        if(edit_mode){
            const changes=editable_fields.filter((field,f)=>differentValues({edited:field,field:fields[f]}));
            if(changes.length>0){
                if(save && block){
                    // create a save function
                    // depending on if authenticated + have edit access, save to localstorage or api
                    // if authenticated, also needs to decide whether to save canon fields to root or to metadata depending on block ownership and config
                    // for api, use https://www.are.na/developers/explore/block/put-block to batch changes in one request
                    // await the response before closing edit_mode (non-eager)
                    // const changes=fields.filter((f)=>tracked_changes.some((b)=>b.key==f.key));
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

        // probably need a way of noting whether there is an override value, so that
        // we can determine where to make the change when the value is edited
        return [
            {
                name:'Title', type:'string',
                // also note the || '' is really important, as opposed to letting values be null
                // because otherwise the text binding in FieldInput overwrites it with the old value
                value:block && get_canon_value({field:'title', block,overrides:channel_data.schema?.overrides}) || '', 
                canon:true,
                key:"goby.title"
            },
            {
                name:'Description', 
                type:'string',
                value:block && get_canon_value({field:'description', block,overrides:channel_data.schema?.overrides}) || '', 
                canon:true,
                key:"goby.description"
            }
        ]
    });

    let goby_fields:GobyField[] = $derived.by(()=>{
        return (channel_data.schema?.fields || []).map((field)=>{
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
                    max:field.max,
                    options:field.options
                }
            }else if(field.type=="string"){
                const value = (typeof blockValue == 'string' && blockValue) || 
                            (typeof localValue == 'string' && localValue) || '';

                return {
                    ...core_fields,
                    type:field.type,
                    value
                }
            }else{
                const value = typeof blockValue=="boolean" ? blockValue :
                            typeof localValue=="boolean" ? localValue :
                            null;

                return {
                    ...core_fields,
                    type:field.type,
                    value
                }
            }
        })
    })


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
    let editable_fields:GobyField[] = $state([]);
    
    $effect(()=>{
        if(!edit_mode || block?.id!==prev_expanded){
            editable_fields = [...fields];
        }
    })
    


    const closeOnEsc = (e:KeyboardEvent) =>{
        if(e.key==="Escape" && open){
            console.log('document.activeElement ',document.activeElement )
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
                                <FieldInput bind:editable_field={editable_fields[f]} {field} bind:edit_mode markdown={field.key!=="goby.title"}/>
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
        min-height:100%;
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
        left:0px;
        bottom:0;
        width:calc(100% - 0px);
        border-bottom:1px solid gainsboro;
        border-inline:1px solid gainsboro;
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