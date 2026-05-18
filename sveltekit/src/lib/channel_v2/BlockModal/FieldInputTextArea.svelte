<script lang="ts">
    import type { GobyField } from "../goby.d.ts";
    import { keyToClick } from "$lib/dom-utils";
    import parse from "$lib/markdown";
    import type { Attachment } from "svelte/attachments";

    let {
        field,
        edit_mode=$bindable()
    }: {
        edit_mode:boolean,
        field:GobyField;
    } = $props();


    let {
        name,
        base = false
    } = $derived(field);

    let editable_field=$state(field);
    $effect(()=>{
        editable_field=field;
    })


    let input_el:HTMLTextAreaElement | undefined=$state();

    let textField=$derived(editable_field.type==="string");

    function handle_click() {
        if (textField) {
            if(input_el) input_el.focus();
        }else if(editable_field.type=="boolean"){
            editable_field.value=!Boolean(editable_field.value);
        }
    }

    let focused = $state(false);
    let mouseup=$state(true);



    const focusOn=()=>{
        focused=true;
        if(!edit_mode) edit_mode=true;
    };

    const focusOff=()=>{
        focused=false;
    }
    
    const watchFocus:Attachment=(element)=>{
        
        element.addEventListener('focus',focusOn)
        element.addEventListener('blur', focusOff)

        return ()=>{
            element.removeEventListener('focus',focusOn);
            element.removeEventListener('blur',focusOff);
        }
    }


    let uid=$props.id();
    let el_id=$derived(`field-${name}-${uid}`)
</script>

<svelte:window onmousedown={()=>mouseup=false} onmouseup={()=>mouseup=true}/>


<div
    role="button"
    tabindex={-1}
    onclick={handle_click}
    onkeydown={keyToClick(handle_click)}
    class="field"
    class:edit-mode={edit_mode}
    class:custom={!base}
    data-name={editable_field.name}
    data-type={editable_field.type}
    class:focused
    class:base
    id={el_id}
>
    {#if (!base || edit_mode) && name}
        <div class="monospace field-label">{name}</div>
    {/if}
    {#if editable_field.type==="string"}
        <div class="value-wrapper">
            <div class="edit">
                <div class="value-mirror prose">{@html editable_field.value.replaceAll('\n','<br>')}</div>
                <textarea 
                    class="prose"
                    {@attach watchFocus}
                    aria-labelledby={el_id} 
                    bind:this={input_el}
                    bind:value={editable_field.value} >
                </textarea>
            </div>
            
            <!-- <div
                aria-labelledby={el_id}
                class="edit prose"
                contenteditable="plaintext-only"
                {@attach watchFocus}
                bind:this={input_el}
                bind:textContent={editable_field.value}
            ></div> -->
            <div class="display prose" aria-hidden={edit_mode}>
                {#if !editable_field.value}
                    <span class="placeholder monospace"
                        >{base ? `No ${name}` : "None"}</span
                    >
                {:else}
                    {@html parse(editable_field.value)}
                {/if}
            </div>
        </div>
    {:else if editable_field.type==="boolean"}
        <input {@attach watchFocus} type="checkbox" bind:checked={editable_field.value} />
    {/if}
</div>

<style>
    .field {
        box-sizing: border-box;
        display: flex;
        flex-flow: column nowrap;
        gap: 5px;
    }

    textarea,
    textarea:focus-visible{
        min-height:0px;
        resize:none;
        width:100%;
        background:transparent;
        outline:transparent;
        border:transparent;
        padding:0;
        height:100%;
        /* color:transparent; */
    }

    .value-mirror{
        pointer-events:none;
        color:transparent;
        height: fit-content;
    }

    .edit{
        display:grid;
        grid-template-areas:'main';

        & .value-mirror,
        & textarea{
            grid-area:main;
            min-height:0;
        }
    }

    .field.base[data-name="Title"] .prose.display{
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

    .field.focused,
    .field.edit-mode{
        /* border: 1px solid rgba(54, 54, 54, 0.5); */
    }
    
    .edit-mode.field[data-type="string"] {
        background-color: rgb(245, 245, 245);
    }

    .edit-mode.field[data-type="string"]{
        cursor:text;
    }

    .field .prose,
    .field textarea.prose {
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

    .field:not(.edit-mode) .edit {
        opacity: 0;
        pointer-events: none;
        max-height:0px;
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

    input[type="checkbox"]:checked::after{
        content:'';
        display:block;
        background-color: #363636;
        width:100%;
        height:100%;
        cursor:pointer;
    }
</style>
