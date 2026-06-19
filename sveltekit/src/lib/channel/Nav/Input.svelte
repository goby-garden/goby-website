<script lang="ts">
    import { channel_data } from "../context.svelte";

    let {
        placeholder = '',
        input_id='',
        url_type='channel',
        url_str=$bindable(),
        str_components=$bindable([])
    }:{
        placeholder:string;
        input_id:string;
        url_type:'channel' | 'block';
        url_str?:string;
        str_components?:{type:string;value:string}[];
    } = $props();

    let input_el:HTMLInputElement | undefined=$state();


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
</script>


<input bind:this={input_el} class="monospace" autocomplete="off" bind:value={url_str} id={input_id} type="text" {placeholder} />

<style>
    input.monospace::placeholder,
    input:not(:focus,:hover){
        color:#757575;
    }

    input{
        box-sizing:border-box;
        width:100%;
        min-width: fit-content;
        overflow-x:auto;
    }

</style>
