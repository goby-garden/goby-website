<script lang="ts">
    import type { GobySchema } from "../goby";
    import { document_state } from "$lib/channel/context.svelte";
    import { keyToClick } from "$lib/dom-utils";
    import {channel_data } from '$lib/channel/context.svelte';

    let base_field:GobySchema["fields"][number]={
        type:'string',
        key:'',
        name:''
    }

    let {
        field = $bindable(base_field),
        focused = $bindable(),
        edit_mode = $bindable(),
        new_fields,
        stage_new_field
    }: {
        field?: GobySchema["fields"][number];
        focused?: boolean;
        edit_mode: boolean;
        new_fields:GobySchema["fields"];
        stage_new_field:(f:Partial<typeof field>)=>void
    } = $props();

    let edit_container: HTMLDivElement | undefined = $state();
    let name_input: HTMLInputElement | undefined = $state();

    let svelte_id=$props.id();

    let existing_field=$derived(field.key.length>0);

    let valid_field=$derived(
        edit_mode
        && focused
        && field.name.length>0 
        && (field.type=='select'? field.max!==undefined: true)
        && !channel_data.schema?.fields?.some((f)=>f.name==field.name)
        && !new_fields.some((f)=>f.name==field.name)
    )

    $effect(() => {
        document_state.activeElement;
        requestAnimationFrame(()=>{
            focused =
                !edit_container ||
                (document_state.activeElement &&
                    edit_container.contains(document_state.activeElement)) ||
                false;
          
            if (focused) {
                edit_mode = true;
            }
        })
    });

    function handle_click() {
        console.log('click event')
        if (name_input && !focused) {
            name_input.focus();
        }
    }

    $effect(()=>{
        if(!focused && !existing_field){
            field.name='';
        }
    })

    function send_field_to_staging(){
        if(edit_mode && valid_field){
            stage_new_field(field);
            field=base_field;
        }
    }
</script>

<div
    role="button"
    tabindex={-1}
    bind:this={edit_container}
    class="edit-container"
    class:edit-mode={edit_mode}
    onclick={handle_click}
    onkeydown={keyToClick(handle_click)}
>
    <div class="row">
        <input
            bind:this={name_input}
            class="monospace edit-field-name"
            type="text"
            bind:value={field.name}
            placeholder="Add new field"
        />
        {#if !existing_field}
            <button 
                class="create-button box-button" disabled={!valid_field}
                onclick={()=>send_field_to_staging()}
                onkeydown={keyToClick(()=>send_field_to_staging())}
            >
            <span class="menlo">+</span>
        </button>
        {/if}
    </div>
    {#if edit_mode && focused}
        <div class="field-properties">
            <div class="row field-property">
                <div class="row-label monospace">type:</div>
                {#each ['string','select','boolean'] as type_option}
                    {@const input_id=svelte_id + type_option}
                    <label for={input_id} class:selected={field.type==type_option} class="config-option" >
                        <input id={input_id} type="radio" bind:group={field.type} value={type_option} />
                        <span class="monospace">{{"string":"text","select":"select","boolean":"checkbox"}[type_option]}</span>
                    </label>
                {/each}
            </div>
            {#if field.type === "select"}
                <div class="row field-property">
                    <div class="row-label monospace">max:</div>
                    {#each ['single','multiple'] as max_option}
                        {@const input_id=svelte_id + max_option}
                        <label for={input_id} class:selected={field.max==max_option} class="config-option" >
                            <input id={input_id} type="radio" bind:group={field.max} value={max_option} />
                            <span class="monospace">{max_option}</span>
                        </label>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .edit-container {
        padding: var(--field-pad-top) var(--field-pad-left)
            var(--field-pad-bottom) var(--field-pad-left);
        --row-gap: 6px;
    }

    .edit-container:not(.edit-mode,:hover){
        pointer-events:none;
    }

    .box-button{
        aspect-ratio:1;
        padding-inline:6px;
        padding-block:0px;
        pointer-events:all;
    }

    label.config-option:not(.selected){
        opacity:0.3;
    }

    label.config-option{
        cursor:pointer;
    }

    .config-option:not(.selected):hover,
    .config-option:not(.selected):focus-visible{
        opacity:0.5;
    }

    .edit-container,.field-properties{
        display: flex;
        flex-flow: column nowrap;
        gap: var(--row-gap);
    }

    input[type="radio"]{
        /* appearance:auto; */
    }

    .row {
        display: flex;
        flex-flow: row nowrap;
        align-items:center;
        gap:6px;
    }

    .edit-field-name,
    .row-label {
        color: rgba(0, 0, 0, 0.5);
        line-height: 1.4em;
    }

    .edit-field-name {
        flex: 1;
        background: transparent;
    }



    .edit-field-name::placeholder {
        color: black;
        opacity: 0.3;
    }

    .edit-container:not(.edit-mode):not(:hover) .edit-field-name::placeholder{
        opacity:0;
    }

    .create-button {
        color: rgba(0, 0, 0, 0.3);
        /* box-sizing:border-box; */
    }

    .create-button:not(:disabled){
        /* color:var(--gray); */
        color:rgba(0, 0, 0, 0.5);
        outline:1px solid rgba(0, 0, 0, 0.5);
        outline-offset:-1px;
        /* background-color:rgba(0, 0, 0, 0.3); */
    }

    .create-button:not(:disabled):hover,
    .create-button:not(:disabled):focus-visible{
        outline:none;
        background-color:rgba(0, 0, 0, 0.5);
        /* background-color:rgba(0, 0, 0, 0.5); */
        /* background-color:black; */
        color:var(--gray);
    }

    .row-label {
        padding-left: 0px;
    }

    .field-properties {
        --branch-icon-color: rgba(0, 0, 0, 0.3);
        margin-left:8px;
        position:relative;
        padding-top:4px;
    }

    .field-properties::before{
        content:'';
        border-left: 1px solid var(--branch-icon-color);
        position:absolute;
        top:0;
        left:0;

        height:calc(100% - 10px);
    }

    .row-label::before {
        content: "";
        display: inline-block;
        width: 10px;
        height:8px;

        border-bottom: 1px solid var(--branch-icon-color);

        margin-right: 6px;
        margin-top: 2px;
        vertical-align: top;
    }
</style>
