<script lang="ts">
    import {auth_modal} from '$lib/channel/context.svelte';
    import {browser} from '$app/environment';

    function closeModal(){
        auth_modal.open = false;
    }

    let location = $derived(`${browser && window?.location || "https://goby.garden"}`)
    
    let auth_url=$derived(`https://www.are.na/oauth/authorize?client_id=t9F7ZmHfgBO6kF5-K5s3B6PdALcNb8Bbb2zhlfnGaJA&redirect_uri=${encodeURIComponent(location)}&response_type=code&scope=write`);
</script>

<!-- eventually consolidate this modal wrapper with the one in BlockModal -->
<div class="modal" class:open={auth_modal.open}>
    <button aria-label="Close block modal" class="backdrop-close" onclick={()=>closeModal()}></button>

    <div class="auth-confirmation monospace">
        <!-- <h3>Give goby.garden access to your are.na?</h3> -->
        <p>If you’d like to save your edits on this page back to are.na, log in below to authorize goby.garden.</p>
        <p>
            <a id="authentication-portal" href="{auth_url}">Authenticate</a>
        </p>
        <p>Otherwise, you can still edit channels locally! The changes persist in your browser’s storage, and you can export the data as a JSON at any time.</p>
        <p>Feel free to explore the codebase <a href="https://github.com/goby-garden/goby-website/tree/master/sveltekit">here</a> or <a href="https://www.are.na/nico-chilla/span-span-span-span">contact me</a> with any questions you have.</p>
    </div>
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
        display:flex;
        flex-flow:column nowrap;
         box-sizing:border-box;
        padding:40px;
        z-index:10000;
    }

    

    .modal:not(.open){
        opacity:0;
        --pointer-events:none;
    }

    .backdrop-close{
        background-color:rgba(255,255,255,0.9);
        pointer-events:var(--pointer-events) !important;
        position:absolute;
        top:0;
        left:0;
        width:100%;
        height:100%;
        cursor:default;
    }

    .auth-confirmation{
        box-sizing:border-box;
        background-color:white;
        outline:1px solid gainsboro;
        outline-offset:-1px;
        max-width:600px;
        width:100%;
        height:fit-content;
        position:relative;
        margin-inline:auto;
        margin-block:auto;
        padding:20px;
    }

    #authentication-portal{
        border:1px solid #757575;
        text-decoration:none;
        color:#757575;
        padding:10px;
        box-sizing:border-box;
        width:100%;
        display:block;
        text-align:center;

        &:hover{
            color:white;
            background-color:black;
            border-color:black;
        }
    }

    p{
        margin-bottom:15px;
    }

</style>