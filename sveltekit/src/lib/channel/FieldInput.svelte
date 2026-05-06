<script lang="ts">
    import type { GobyFieldType,GobyField } from "./goby.d.ts";
    import { keyToClick } from "$lib/dom-utils";
    import parse from "$lib/markdown";
    import type { Attachment } from "svelte/attachments";

    let {
        field,
        edit_mode = $bindable(false),
    }: {
        edit_mode: boolean;
        field:GobyField;
    } = $props();

    let {
        name,
        base = false
    } = $derived(field);

    let input_el:HTMLDivElement | undefined=$state();

    let textField=$derived(field.type==="string");

    function handle_click() {
        if (textField) {
            if(!edit_mode) edit_mode = true;
            if(input_el) input_el.focus();
        }else if(field.type=="boolean"){
            field.value=!Boolean(field.value);
        }
    }

    let focused = $state(false);
    const watchFocus:Attachment=(element)=>{
        element.addEventListener('focus',()=>{
            focused=true;
        })

        element.addEventListener('blur',()=>{
            focused=false;
        })
    }


    let uid=$props.id();
    let el_id=$derived(`field-${name}-${uid}`)
</script>

<div
    role="button"
    tabindex={edit_mode&&textField?-1:1}
    onclick={handle_click}
    onkeydown={keyToClick(handle_click)}
    class="field"
    class:edit-mode={edit_mode}
    class:custom={!base}
    data-type={field.type}
    class:focused
    id={el_id}
>
    {#if !base || edit_mode}
        <div class="monospace field-label">{name}</div>
    {/if}
    {#if field.type==="string"}
        <div class="value-wrapper">
            <div
                aria-labelledby={el_id}
                class="edit prose"
                contenteditable="plaintext-only"
                {@attach watchFocus}
                bind:this={input_el}
                bind:textContent={field.value}
            ></div>
            <div class="display prose" aria-hidden={edit_mode}>
                {#if !field.value}
                    <span class="placeholder monospace"
                        >{base ? `No ${name}` : "None"}</span
                    >
                {:else}
                    {@html parse(field.value)}
                {/if}
            </div>
        </div>
    {:else if field.type==="boolean"}
        <input type="checkbox" bind:checked={field.value} />
    {/if}
</div>

<style>
    .field {
        box-sizing: border-box;
        display: flex;
        flex-flow: column nowrap;
        gap: 5px;
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

    .field.edit-mode.focused{
        border: 1px solid rgba(54, 54, 54, 0.5);
    }


    .edit-mode.field {
        background-color: rgb(245, 245, 245);
    }

    .edit-mode.field[data-type="string"]{
        cursor:text;
    }

    .field .prose {
        line-height: 1.4em;
        font-family: Arial;

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
