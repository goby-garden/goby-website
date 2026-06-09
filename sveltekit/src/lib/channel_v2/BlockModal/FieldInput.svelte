<script lang="ts">
    import type { GobyField } from "../goby.d.ts";
    import { keyToClick } from "$lib/dom-utils";
    import parse from "$lib/markdown";
    import type { Attachment } from "svelte/attachments";

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


    let input_el:HTMLDivElement | undefined=$state();
    let checkbox_el:HTMLInputElement | undefined = $state();

    function handle_click() {
        if (editable_field?.type==="string") {
            if(input_el && !focused){
                input_el.focus();

                moveCursorToEnd();
            }
        }else if(editable_field?.type=="boolean"){
            if(edit_mode){
                editable_field.value=!Boolean(editable_field.value);
            }else if(checkbox_el){
                checkbox_el.focus();
            }
        }
    }

    // let focused = $state(false);
    let mouseup=$state(true);


    let queue_focus_change=$state(false);

    const focusOn=()=>{
        window.requestAnimationFrame(()=>{
            focused=true;
            if(!edit_mode) edit_mode=true;
        })
    };

    const focusOff=()=>{
        if(mouseup){
            focused=false;
        }else if(focused){
            queue_focus_change=true;
        }
    }

    
    const watchFocus:Attachment=(element)=>{
        
        element.addEventListener('focus',focusOn)
        element.addEventListener('blur', focusOff)

        return ()=>{
            element.removeEventListener('focus',focusOn);
            element.removeEventListener('blur',focusOff);
        }
    }

    function moveCursorToEnd(){
        if(input_el){
            const range = document.createRange();
            range.selectNodeContents(input_el);
            const sel = window.getSelection();
            if(sel){
                sel.removeAllRanges();
                sel.addRange(range);
                sel.collapseToEnd();
            }
        }
    }

    function handle_mouse_up(){
        if(queue_focus_change){
            console.log('cue unfocus')
            focused=false;
            queue_focus_change=false;
        }
        mouseup=true;
        
    }
    


    let uid=$props.id();
    let el_id=$derived(`field-${name}-${uid}`);



    function isEmpty(field:GobyField){
        if(field.type=='string') return (field.value || '').trim().length==0;
        return !field.value;
    }
</script>

<svelte:window onmousedown={()=>mouseup=false} onmouseup={handle_mouse_up}/>

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
                    {@attach watchFocus}
                    bind:this={input_el}
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
            <input bind:this={checkbox_el} {@attach watchFocus} type="checkbox" bind:checked={editable_field.value} />
        {:else if editable_field.type==="select"}
            <div class="value-wrapper">
                <input type="text" class="select-search" />
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

    .field:not(.edit-mode) .select-search{
        display:none;
    }
    
</style>
