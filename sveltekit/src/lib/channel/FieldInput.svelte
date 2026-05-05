<script lang="ts">
    import type {GobyFieldType} from './goby.d.ts';

    let {
        name,
        type,
        value,
        base = false
    }:{
        name:string;
        type:GobyFieldType;
        value?:string;
        base?:boolean;
    } = $props();
</script>

<div class="field" class:custom={!base} data-name="{name}">
    {#if !base}
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="monospace">{name}</label>
    {/if}
    
    <div class="field-value">
        {#if type=='string'}
        <div class="display prose" title={name}>
            {@html value}
            {#if !value}
                <span class="placeholder monospace">{base? `No ${name}`:'None'}</span>
            {/if}
        </div>
        {/if}
    </div>
    
</div>

<style>
     .field{
        box-sizing:border-box;
        display:flex;
        flex-flow:column nowrap;
        gap:5px;
    }

    .custom.field{
        /* background-color:rgb(245, 245, 245); */
        border:1px solid rgb(245, 245, 245);
        padding:10px;
    }

    /* .field[data-name="Title"]{
        font-weight:600;
        font-family:Arial;
    } */

    .field-value .prose{
        line-height:1.4em;
        font-family:Arial;

        & > :global(p:last-child){
            margin-bottom:0px;
        }
    }

    .placeholder{
        opacity:0.3;
    }

    .custom.field .display.prose{
        min-height:1em;
    }

</style>