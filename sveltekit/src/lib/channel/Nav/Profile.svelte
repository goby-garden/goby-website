<script lang="ts">
    import { profile, channel_data } from '$lib/channel/context.svelte';
    import {auth_modal} from '$lib/channel/context.svelte';

    const edit_access_icons={
        read:"☀︎",
        write:"✎"
    }
</script>

<div class="profile">
    {#if channel_data.blocks.length>0}
        <div class="access box" title={channel_data.can_edit ? "editing" : "viewing"}>
            <span class="menlo icon">
                {channel_data.can_edit ? edit_access_icons.write : edit_access_icons.read}
            </span>
        </div>
    {/if}
    {#if !profile.authenticated}
        <button class="log-in monospace" class:modal-open={auth_modal.open} onclick={()=>auth_modal.open=true}>log in</button>
    {/if}
</div>

<style>
    .profile{
        display:flex;
        flex-flow:row nowrap;
        gap:10px;
        color:#757575;
        
    }
    .box{
        padding:5px;
        border:1px solid var(--gray);
    }

    .icon{
        color:#757575;
        aspect-ratio:1;
        padding-inline:5px;
        font-size:18px;
    }

    .log-in{
        white-space:nowrap;
        text-decoration:underline;
        text-underline-offset:2px;
        text-decoration-thickness:1px;
    }

    .log-in:hover,
    .log-in.modal-open{
        color:black;
    }


</style>