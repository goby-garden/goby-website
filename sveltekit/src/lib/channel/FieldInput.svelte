<script lang="ts">
    import type { GobyField } from "./goby.d.ts";
    import { keyToClick } from "$lib/dom-utils";
    import parse from "$lib/markdown";
    import type { Attachment } from "svelte/attachments";

    let {
        field,
        editing=$bindable()
    }: {
        editing:string | undefined,
        field:GobyField;
    } = $props();

    let edit_mode=$derived(editing === field.key);

    let {
        name,
        base = false
    } = $derived(field);

    let editable_field=$state(field);
    $effect(()=>{
        editable_field=field;
    })


    let input_el:HTMLDivElement | undefined=$state();

    let textField=$derived(editable_field.type==="string");

    function handle_click() {
        if (textField) {
            if(!edit_mode){
                editing=field.key;
            }
            if(input_el) input_el.focus();
        }else if(editable_field.type=="boolean"&&!editing){
            editable_field.value=!Boolean(editable_field.value);
        }
    }

    let focused = $state(false);
    let mouseup=$state(true);

    $effect(()=>{
        if(focused && textField){
            editing=field.key;
        }
    })

    const focusOn=()=>{
        focused=true;
        if(textField) editing=field.key;
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

    $effect(()=>{
        if(mouseup && textField && !focused && editing === field.key) clearEditing();
    })

    async function clearEditing(){
        requestAnimationFrame(()=>{
            if(editing === field.key){
                console.log('clear editing')
                editing=undefined;
            }
        })
    }

    

    let uid=$props.id();
    let el_id=$derived(`field-${name}-${uid}`)

    const blurOnEsc = (e:KeyboardEvent) => {
        if(e.key==="Escape" && focused){
            requestAnimationFrame(()=>{
                focused=false;
                console.log('blurring')
                if(document.activeElement && document.activeElement instanceof HTMLElement){
                    document.activeElement.blur();
                }
            })
        }
    }
</script>

<svelte:window onkeydown={blurOnEsc} onmousedown={()=>mouseup=false} onmouseup={()=>mouseup=true}/>


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
    {#if !base || edit_mode}
        <div class="monospace field-label">{name}</div>
    {/if}
    {#if editable_field.type==="string"}
        <div class="value-wrapper">
            <div
                aria-labelledby={el_id}
                class="edit prose"
                contenteditable="plaintext-only"
                {@attach watchFocus}
                bind:this={input_el}
                bind:textContent={editable_field.value}
            ></div>
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
        border: 1px solid rgb(245, 245, 245);
        padding: 10px;
    }

    .field.focused,
    .field.edit-mode{
        border: 1px solid rgba(54, 54, 54, 0.5);
    }


    .edit-mode.field[data-type="string"] {
        background-color: rgb(245, 245, 245);
    }

    .edit-mode.field[data-type="string"]{
        cursor:text;
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
