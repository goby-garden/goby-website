<script lang="ts">
    import type { GobyField } from "../goby.d.ts";
    import { keyToClick } from "$lib/dom-utils";
    import parse from "$lib/markdown";
    import type { Attachment } from "svelte/attachments";
    import { document_state } from "../context.svelte.ts";

    let {
        field,
        edit_mode=$bindable(),
        readonly = false,
        height = 'fit',
        markdown = true,
        focused = $bindable(false),
        editable_field = $bindable(),
    }: {
        edit_mode:boolean,
        field:GobyField;
        editable_field?:GobyField;
        readonly?:boolean;
        height?: 'fill' | 'fit';
        markdown?:boolean;
        focused?:boolean;
    } = $props();


    let {
        name,
        canon = false
    } = $derived(field);

    // let editable_field=$state(field);
    $effect(()=>{
        if(!edit_mode){
            editable_field=field;
        }
    })

    

    let field_el:HTMLDivElement | undefined = $state();
    let string_el:HTMLDivElement | undefined=$state();
    let checkbox_el:HTMLInputElement | undefined = $state();
    let select_search_box:HTMLInputElement | undefined = $state();
    let select_search_value = $state();


    function handle_click() {
        if (editable_field?.type==="string") {
            if(string_el && !focused){
                string_el.focus();

                moveCursorToEnd();
            }
        }else if(editable_field?.type=="select"){
            console.log('select_search_box',select_search_box)
            if(select_search_box && !focused) select_search_box.focus();
        }else if(editable_field?.type=="boolean"){
            if(edit_mode){
                editable_field.value=!Boolean(editable_field.value);
            }else if(checkbox_el){
                checkbox_el.focus();
            }
        }
    }


    $effect(()=>{
        focused = !field_el || document_state.activeElement && field_el.contains(document_state.activeElement) || false;
        window.requestAnimationFrame(()=>{
            if(focused && !edit_mode) edit_mode=true;

            if(document_state.activeElement && field_el && field_el.isEqualNode(document_state.activeElement)){
                if(editable_field?.type=="string"){
                    string_el?.focus();
                }else if(editable_field?.type=="select"){
                    select_search_box?.focus();
                }
            }
        })

        if(!focused){
            select_search_value='';
        }
    })


    function moveCursorToEnd(){
        if(string_el){
            const range = document.createRange();
            range.selectNodeContents(string_el);
            const sel = window.getSelection();
            if(sel){
                sel.removeAllRanges();
                sel.addRange(range);
                sel.collapseToEnd();
            }
        }
    }



    let uid=$props.id();
    let el_id=$derived(`field-${name}-${uid}`);



    function isEmpty(field:GobyField){
        if(field.type=='string') return (field.value || '').trim().length==0;
        return !field.value;
    }
</script>

<svelte:window />

{#if editable_field}
    <div
        role="button"
        tabindex={-1}
        onclick={handle_click}
        onkeydown={keyToClick(handle_click)}
        class="field"
        class:edit-mode={edit_mode}
        class:custom={!canon}
        class:fill-height={height==="fill"}
        data-name={editable_field.name}
        data-type={editable_field.type}
        class:focused
        class:canon
        id={el_id}
        bind:this={field_el}
    >
        {#if (!canon || edit_mode) && name}
            <div class="field-label"><span class="monospace">{name}</span></div>
        {/if}
        {#if editable_field.type==="string"}
            <div class="value-wrapper">
                <div
                    aria-labelledby={el_id}
                    class="edit prose"
                    contenteditable="plaintext-only"
                    bind:this={string_el}
                    bind:innerText={editable_field.value}
                ></div>
                <div class="display prose" aria-hidden={edit_mode}>
                    {#if isEmpty(field)}
                        <span class="placeholder">
                            <span class="monospace">{canon ? `No ${name}` : "None"}</span>
                        </span>
                    {:else if editable_field.value}
                        {#if markdown}
                            {@html parse(editable_field.value)}
                        {:else }
                            { editable_field.value }
                        {/if}
                        
                    {/if}
                </div>
            </div>
        {:else if editable_field.type==="boolean"}
            <input bind:this={checkbox_el}  type="checkbox" bind:checked={editable_field.value} />
        {:else if editable_field.type==="select"}
            <div class="select-value-wrapper" class:single={editable_field.max=="single"}>
                <button class="option placeholder-opt selected">Tyrannosaurus</button>
                {#if editable_field.max=="multiple"}
                    <button class="option placeholder-opt selected">Triceratops</button>
                    <button class="option placeholder-opt selected">Stegasaurus</button>
                    <button class="option placeholder-opt selected">Brontosaurus</button>
                {/if}
                <div class="value-edit-wrapper">
                    <input bind:value={select_search_value} bind:this={select_search_box} type="text" class="select-search"  />
                    <div class="options-track">
                        <button class="option placeholder-opt">Iguanodon</button>
                        <button class="option placeholder-opt">Ankylosaur</button>
                        <button class="option placeholder-opt">Velociraptor</button>
                        <button class="option placeholder-opt">Spinosaurus</button>
                        <button class="option placeholder-opt">Alasaur</button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
{/if}


<style>
    .field {
        box-sizing: border-box;
        display: flex;
        flex-flow: row wrap;
        gap: 5px 10px;
        box-sizing:border-box;
        padding-inline:var(--field-padding-inline,0px);
        padding-block:var(--field-padding-block,0px);
        position:relative;
        /* padding:20px; */
    }

    .field[data-type="select"]{
        gap:10px;
    }

    .field.edit-mode{
        /* border-bottom:1px solid gainsboro; */
    }

    .field:not(.custom,.edit-mode){
        /* padding-bottom:0; */
    }

    .field.canon[data-name="Title"] .prose.display{
        font-weight:600;
    }
    
    .field[data-type="boolean"]{
        flex-flow:row nowrap;
        justify-content: space-between;
        align-items:center;
        cursor:pointer;
    }
    
    .field:not(.edit-mode) {
        cursor: pointer;
    }

    .custom.field,
    .edit-mode.field {
        /* border: 1px solid rgb(245, 245, 245); */
        /* padding: 10px; */
    }

    .field.focused{
        outline:1px solid rgba(22, 22, 22, 1);
        z-index:100;
        /* border: 1px solid rgba(54, 54, 54, 0.5); */
    }


    .edit-mode.field {
        background-color: var(--gray);
    }

    .edit-mode.field[data-type="string"]{
        cursor:text;
    }

    .field.fill-height{
        min-height:100%;
        /* height:100%;
        flex:1; */
    }

    .field .prose {
        line-height: 1.4em;
        font-family: Arial;
        min-width:0;
        width:100%;
        & > :global(p:last-child) {
            margin-bottom: 0px;
        }
    }

    .placeholder {
        opacity: 0.3;
        font-weight:400;
    }

    .value-wrapper {
        display: grid;
        grid-template-areas: "value";
    }

    .value-wrapper .display,
    .value-wrapper .edit {
        grid-area: value;
        min-height:0;
    }

    .field:not(.edit-mode) .prose.edit {
        opacity: 0;
        pointer-events: none;
        max-height:0px;
        position:absolute;
        top:0;
        left:0;
    }

    .field.edit-mode .prose.display{
        display:none;
    }

    .field:focus-visible{
        outline:none;
        border: 1px solid rgba(54, 54, 54, 0.5);
    }

    .prose[contenteditable]:focus-visible{
        outline:none;
    }

    input[type="checkbox"]{
        aspect-ratio:1;
        border:1px solid #363636;
        width:18px;
        box-sizing:border-box;
        padding:3px;
        pointer-events:all;
        cursor:pointer;
    }

    .field:not(.edit-mode) input[type="checkbox"]{
        pointer-events:none;
    }

    input[type="checkbox"]:checked::after{
        content:'';
        display:block;
        background-color: #363636;
        width:100%;
        height:100%;
        cursor:pointer;
    }

    .field-label{
        color:rgba(0,0,0,0.5);
        line-height: 1.4em;
    }

    .select-value-wrapper{
        display:contents;
    }

    .select-value-wrapper .option{
        /* background-color:var(--option-bg,#EAECFF); */
        /* background-color:var(--option-bg,#d5d9fb7e); */
        background-color:var(--option-bg,#d5d9fa);
        padding-inline:6px;
        padding-block:1px;
        text-align:left;
    }

    .value-edit-wrapper{
        position:relative;
        width:100px;
    }

    .select-value-wrapper.single{
        display:block;
        position:relative;
        flex:1;
    }
    
    .select-value-wrapper.single .value-edit-wrapper{
        position:absolute;
        top:0;
        left:0;
        width:100%;
    }

    .select-value-wrapper.single .option.selected{
        width:100%;
    }

    .select-search{
        /* flex:1; */
        background:transparent;
        field-sizing: content;
        width:100%;
    }

    .field:not(.focused) .select-search{
        position:absolute;
    }

    .options-track{
        position:absolute;
        bottom:-8px;
        left:calc(var(--track-padding) * -1);
        transform:translateY(100%);
        height:fit-content;
        display:flex;
        flex-flow:column nowrap;
        box-sizing:border-box;
        --track-padding:10px;
        width:calc(100% + var(--track-padding) * 2);
        outline:1px solid rgba(0,0,0,0.1);
        outline-offset:-1px;
        gap:4px;
        padding:var(--track-padding);
        /* padding-top:3px; */
        background-color: #f5f5f5da;
    }

    .options-track .option:not(.option:last-of-type){
        /* border-bottom:1px solid rgba(0,0,0,0.1); */
    }

    .field:not(.focused) .options-track{
        display:none;
    }

    .field:not(.edit-mode) .value-edit-wrapper{
        opacity:0;
        width:0;
        height:0;
        order: 1000;
    } 
    
</style>
