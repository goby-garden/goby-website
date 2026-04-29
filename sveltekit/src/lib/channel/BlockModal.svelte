<script lang="ts">
    import {replaceState} from '$app/navigation'
    import {browser} from '$app/environment';
    import {onMount} from 'svelte';
    import {channel_data,focused_block} from './context.svelte'
 

    let open=$derived(focused_block.id!==undefined);

    let block = $derived(open && channel_data.blocks.find(({id})=>id==focused_block.id));

    $effect(()=>{
        if(browser && open && !block){
            closeModal();
        }
    })

    function closeModal(){
        history.replaceState("", document.title, window.location.pathname + window.location.search);
        focused_block.id=undefined;
    }

    $inspect('block',block)

    function parseHash(){
        if(browser){
            const hash=window.location.hash;
            if(hash){
                const [,id]=hash.split('-');
                if(id){
                    focused_block.id=parseInt(id);
                }
            }
        }
    }

    onMount(()=>{
        parseHash();
        window.addEventListener('hashchange',parseHash);
    })
</script>

<div class="modal" role="dialog" class:open>
    <sidebar>

    </sidebar>
</div>