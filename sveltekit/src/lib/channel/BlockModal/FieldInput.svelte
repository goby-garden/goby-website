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
        focused = $bindable(),
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


    let editing = $derived(edit_mode && !readonly);


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
    let select_search_value = $state('');


    function handle_click() {
        if (editable_field?.type==="string") {
            if(string_el && !focused && !readonly){
                string_el.focus();

                moveCursorToEnd();
            }
        }else if(editable_field?.type=="select"){
            console.log('select_search_box',select_search_box)
            if(select_search_box && !focused && !readonly) select_search_box.focus();
        }else if(editable_field?.type=="boolean"){
            if(editing){
                editable_field.value=!Boolean(editable_field.value);
            }else if(checkbox_el && !readonly){
                checkbox_el.focus();
            }
        }
    }


    $effect(()=>{
        if(!readonly){
            focused = !field_el || document_state.activeElement && field_el.contains(document_state.activeElement) || false;
        }
        window.requestAnimationFrame(()=>{
            if(focused && !edit_mode) edit_mode=true;

            if(document_state.activeElement && field_el && field_el.isEqualNode(document_state.activeElement)){
                if(editable_field?.type=="string"){
                    string_el?.focus();
                }else if(editable_field?.type=="select"){
                    select_search_box?.focus();
                }
            }

            if(!focused){
                select_search_value='';
            }
        })

        
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

    function toggle_selection(name:string){
        if(edit_mode && editable_field?.type=="select"){
            const is_selected=editable_field.value?.includes(name);

            if(is_selected){
                editable_field.value=editable_field.value?.filter((n)=>n!==name) || [];
            }else{
                if(editable_field.max=='single' && (editable_field.value?.length || 0)>0){
                    editable_field.value=[];
                }

                editable_field.value=[...editable_field.value || [],name];
                const is_new=!editable_field.options.some((o)=>o.name==name);
                if(is_new){
                    editable_field.options=[...editable_field.options,{name}];
                    select_search_value='';
                    if(select_search_box && editable_field.max=='multiple') select_search_box.focus();
                }
            }
        }
    }

    let unselected_options=$derived.by(()=>{
        if(editable_field?.type=='select'){
            return editable_field.options.filter((o)=> 
                editable_field?.type=='select' && !(editable_field?.value || [] as string[]).includes(o.name)
            );
        }else{
            return [];
        }
    })

</script>

<svelte:window />

{#if editable_field}
    <div
        role="button"
        tabindex={-1}
        onclick={handle_click}
        onkeydown={keyToClick(handle_click)}
        class="field"
        class:edit-mode={editing}
        class:custom={!canon}
        class:fill-height={height==="fill"}
        data-name={editable_field.name}
        data-type={editable_field.type}
        class:focused
        class:canon
        class:readonly
        id={el_id}
        bind:this={field_el}
    >
        {#if (!canon || editing) && name}
            <div class="field-label noselect"><span class="monospace">{name}</span></div>
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
                <div class="display prose" aria-hidden={editing}>
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
            {@const single=editable_field.max=="single"}
            <!-- {@const unselected_options=editable_field.options.filter((o)=>editable_field?.type=="string" && !(editable_field?.value || [] as string[]).includes(o.name))} -->
            <div class="select-value-wrapper" class:single>
                <div class="single-selection-wrapper" class:typing={select_search_value.length>0}> 
                    {#each editable_field.value as selected}
                        <button 
                            onclick={()=>toggle_selection(selected)}
                            onkeydown={keyToClick(()=>toggle_selection(selected))}
                            class="option selected"
                        >{selected}</button>
                    {/each}
                    <div class="select-search-wrapper">
                        <input bind:value={select_search_value} bind:this={select_search_box} type="text" class="select-search"  />
                        {#if select_search_value.length==0 && single && editable_field.value && editable_field.value.length>0}
                            <button class="clear-selected box-button" onclick={()=>{ if(editable_field?.type=="select" && editable_field.value) toggle_selection(editable_field.value[0]);}}>
                                <span class="menlo">×</span>
                            </button>
                        {/if}
                        {#if select_search_value.length>0 && !editable_field.options.some((o)=>o.name==select_search_value)}
                            <button 
                                onclick={()=>toggle_selection(select_search_value)}
                                onkeydown={keyToClick(()=>toggle_selection(select_search_value))}
                                class="add-new-option box-button"
                            >
                            <!-- ╳ -->
                                <span class="menlo">+</span>
                            </button>
                        {/if}
                        
                    </div>
                </div>
                {#if unselected_options.length>0}
                    <div class="options-track">
                        {#each unselected_options as option}
                            <button 
                                class="option"
                                onclick={()=>toggle_selection(option.name)}
                                onkeydown={keyToClick(()=>toggle_selection(option.name))}
                            >
                                {option.name}
                            </button>
                        {/each}
                    </div>
                {/if}
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
        /* --field-pad-left:0px;
        --field-pad-right:0px;
        --field-pad-top:0px;
        --field-pad-bottom:0px; */
        --field-pad-inline:var(--field-pad-left) var(--field-pad-right);
        --field-pad-block:var(--field-pad-top) var(--field-pad-bottom);



        padding-inline:var(--field-pad-inline,0px);
        padding-block:var(--field-pad-block,0px);
        position:relative;
        transition:height 0.3s;
        interpolate-size: allow-keywords;
        height:fit-content;
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
    
    .field:not(.edit-mode,.readonly) {
        cursor: pointer;
    }

    .custom.field,
    .edit-mode.field {
        /* border: 1px solid rgb(245, 245, 245); */
        /* padding: 10px; */
    }

    .field:not(.focused) .clear-selected{
        display:none;
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

    .prose.display{
        pointer-events:var(--pointer-events) !important;
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

    .single-selection-wrapper{
        display:contents;
    }

    .select-value-wrapper{
        display:contents;
    }

    .select-value-wrapper .option,
    .box-button.add-new-option{
        --option-bg-opacity:0.5;
        background-color:rgba(var(--option-rgb,207, 207, 207), var(--option-bg-opacity));
        /* background-color:var(--option-bg,#d5d9fa); */
        padding-inline:6px;
        padding-block:1px;
        text-align:left;
    }
    
    .select-search-wrapper{
        display:flex;
        flex-flow:row nowrap;
    }

    .select-value-wrapper.single{
        & .single-selection-wrapper{
            display:grid;
            grid-template-areas:'main';
            flex:1;
        }

        .select-search{
            padding-inline:6px;
        }

        .option.selected,
        .select-search-wrapper{
            width:100%;
            grid-area:main;
        }

        .select-search{
            flex:1;
        }
    }

    .focused {
        & .option:not(.selected,:hover,:focus-visible),
        & .option.selected:hover,.option.selected:focus-visible{
            --option-bg-opacity:0.2;
            color:rgba(0,0,0,0.5);
        }
        
        & .box-button.add-new-option:not(:hover,:focus-visible){
            --option-bg-opacity:0.2;
        }
    }

    /* .edit-mode .option:not(.selected):not(:hover),
    .single .typing .option,
    .edit-mode .option.selected:hover{
        color:rgba(0,0,0,0.5);
        --option-bg-opacity:0.2;
    } */

    .single .typing .option{
        color:rgba(0,0,0,0);
    }

    /* .select-value-wrapper.single{
        display:block;
        position:relative;
        flex:1;
    }
    
    .select-value-wrapper.single .value-edit-wrapper{
        position:absolute;
        top:0;
        left:0;
        width:100%;
    } */

    /* .select-value-wrapper.single .option.selected{
        width:100%;
    } */

    .select-search{
        /* flex:1; */
        background:transparent;
        min-width:100px;
        width:100px;
        padding-block:1px;

        @supports(field-sizing:content){
            width:unset;
            /* width:unsets; */
            max-width:250px;
            field-sizing: content;
        }
    }

    .box-button{
        aspect-ratio:1;
    }

    .field:not(.focused) .select-search{
        position:absolute;
    }

    .option{
        white-space:nowrap;
    }

    .options-track{
        display:flex;
        flex-flow:row nowrap;
        gap:5px;
        overflow-x:auto;
        padding-top:10px;
        padding-bottom:var(--field-pad-bottom);
        margin-bottom:calc(var(--field-pad-bottom) * -1);
        border-top:1px solid gainsboro;
        padding-inline:var(--field-pad-inline);
        margin-left:calc(var(--field-pad-left) * -1);
        margin-right:calc(var(--field-pad-right) * -1);
        scrollbar-width:none;
        min-width:100%;
    }

    .options-track::-webkit-scrollbar{
        display:none;
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
