<script lang="ts">
    let {
        placeholder = '',
        input_id='',
        url_type='channel',
        url_str=$bindable(),
        str_components=$bindable([]),
        display_value
    }:{
        placeholder:string;
        input_id:string;
        url_type:'channel' | 'block';
        url_str?:string;
        str_components?:{type:string;value:string}[];
        display_value?:string;
    } = $props();


    let input_el:HTMLInputElement | undefined=$state();
    let overscroll_el:HTMLDivElement | undefined = $state();
    let edit_mode=$state(true);

    // svelte-ignore state_referenced_locally
    let display_value_cache=$state(display_value)

    $effect(()=>{
        const fragments=url_str?.split('/') || [];
        const components:{type:string;value:string}[]=[];
        fragments.forEach((fragment,f)=>{
            let type="str";
            let trailing=f==fragments.length-1?'':'/';

            const proximate_domain=components.at(-2)?.type=="domain";

            if(fragment.includes('are.na')){
                type="domain"
            }else if(
                (proximate_domain&&url_type=="block"&&components.at(-1)?.value=="block/") || 
                (proximate_domain&&url_type=="channel")
            ){
                type="identifier";
            }

            components.push({
                type,
                value:fragment + trailing
            })
        })

        str_components=components;
    });

    $effect(()=>{
        if(display_value&&display_value!==display_value_cache){
            edit_mode=false;
            display_value_cache=display_value;
            overscroll_el?.scroll({left:0,behavior:'instant'});
        }
    })

    function toggle_edit(){
        edit_mode=!edit_mode;
        if(edit_mode){
            requestAnimationFrame(()=>{
                if(input_el) input_el.focus({preventScroll:true});
            })
        }else{
            // input_el?.blur();
            CSS.highlights.clear();
            overscroll_el?.scroll({left:0});
        }
    }
</script>

<div class="outer-input-wrapper" class:display-mode={!edit_mode} class:has-display-value={display_value}>
    <div class="input-wrapper" bind:this={overscroll_el}>
        <span class="input-mirror monospace" aria-hidden="true">
            {#each str_components as component,c (c)}
                <!-- {@const last=f==str_fragments.length-1} -->
                <span class:highlight={component.type=="identifier"}>{component.value}</span>
            {/each}
        </span>
        <input bind:this={input_el} disabled={!edit_mode} class="monospace" autocomplete="off" bind:value={url_str} id="{input_id}" type="text" {placeholder} />
        
        <div class="display-value">{display_value}</div>
    </div>
    <button class="toggle-edit monospace" onclick={toggle_edit}>{edit_mode?"title":"edit"}</button>
</div>


<style>
    .outer-input-wrapper{
        position:relative;
        height:fit-content;
        width:100%;
        --input-bg:rgb(236, 236, 236);
        background-color:var(--input-bg);
        border-radius:5px;
        overflow:hidden;
        display:flex;
        flex-flow:row nowrap;
    }

    .input-wrapper{
        overflow-x:auto;
        overflow-y:hidden;
        height:fit-content;
        width:100%;
        flex:1;
        scrollbar-width:0px;
        --shift:30px;
    }

    .has-display-value .input-wrapper{
        scroll-behavior: smooth;
    }

    .input-wrapper::-webkit-scrollbar{
        height:0px;
    }

    .input-wrapper{
        display:grid;
        grid-template-areas:'main';

        & > *{
            grid-area:main;
        }
    }
    input,.input-mirror,.display-value{
        padding-inline:10px;
        padding-block:7px;
        box-sizing:border-box;
        width:100%;
        min-width: fit-content;
        white-space: pre;
        background:transparent;
        line-height: 1.1em;
        transition:transform 0.2s, opacity 0.2s;
    }

    input.monospace::placeholder,
    .toggle-edit{
        --text-color:#757575;
        /* -webkit-text-stroke:0.03em var(--text-color); */
    }


    

    .display-value{
        pointer-events:none;
        font-family:Arial;
        transform:translateY(var(--shift));
        font-weight:600;
        font-size:14px;
        color:#111111;
        /* letter-spacing:1px; */
    }

    .display-mode{
        & .input-mirror,
        & input{
            transform:translateY(calc(var(--shift) * -1));
            opacity:0;
            pointer-events:none;
        }
        
        & .display-value{
            pointer-events:all;
            transform:translateY(0px);
            opacity:1;
        }
    }

    .input-mirror .highlight{
        background-color: palegoldenrod;
    }

    .input-mirror{
        pointer-events:none;
    }

    .toggle-edit{
        background-color:var(--input-bg);
        opacity:0;
        transition:opacity 0.2s;
        pointer-events:none;
        z-index:20;
        max-width:0px;
        padding:0px;
    }

    .has-display-value .toggle-edit{
        max-width:fit-content;
        padding:8px 10px;
        opacity:1;
        pointer-events:all;
    }


    input{
        field-sizing:content;
        overflow: visible !important;
    }
</style>