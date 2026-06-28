<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        children,
        open = false
    }:{
        children:Snippet;
        open: boolean;
    } = $props();
</script>

<div class="modal" class:open>
    {@render children()}
</div>

<style>
    .modal{
        position:fixed;
        width:100%;
        height:100%;
        top:0;
        left:0;
        --pointer-events:all;
        pointer-events:var(--pointer-events) !important;
        transition:opacity 0.3s;
        z-index:10000;
    }

    

    .modal:not(.open){
        opacity:0;
        --pointer-events:none;
    }
</style>