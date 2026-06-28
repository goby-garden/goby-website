<script lang="ts">
    import Modal from '../Modal.svelte';
    import {channel_data, document_state, expanded_block, profile} from '$lib/channel/context.svelte';

    let prev_expanded=$state(expanded_block.id);

    let open=$derived(expanded_block.id!==undefined);
</script>

