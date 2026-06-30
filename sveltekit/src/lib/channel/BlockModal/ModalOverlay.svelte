<script lang="ts">
    import Modal from '../Modal.svelte';
    import {channel_data, document_state, expanded_block, profile} from '$lib/channel/context.svelte';
    import type { ChannelBlock } from '$lib/arena-v3';

    let {
        rendered_blocks
    }:{
        rendered_blocks:(
            { render_id:string; } | { render_id:string; id:number; } & ChannelBlock
        )[]
    } = $props();

    let prev_expanded=$state(expanded_block.id);

    let open=$derived(expanded_block.id!==undefined);

    let position={x:0,y:0};

    // maybe I can set the positions of elements in a Map(), so that I guarantee uniqueness and ergonomic lookup

    let peripheral_blocks=$derived.by(()=>{
        console.log('hello')
        let blocks:{x:number;y:number;block_id:number; render_id:string;}[]=[]
        
        let rendered_block=rendered_blocks.find((b)=>"id" in b && b.id==expanded_block.id);
        let index=rendered_blocks.findIndex((b)=>"id" in b && b.id==expanded_block.id);
        // let offset = index % 4;

        if(!rendered_block?.render_id || !expanded_block.id) return blocks;
        
        blocks.push({
            ...position,
            block_id:expanded_block.id,
            render_id:rendered_block.render_id
        })

        for(let i of [-1,1]){
            let adjacent=rendered_blocks[index + i];
            if(adjacent && "id" in adjacent){
                blocks.push({
                    x:position.x+i,
                    y:position.y,
                    render_id:adjacent.render_id,
                    block_id:adjacent.id
                })
            }
            let vertical=rendered_blocks[index + i * 4];

            if(vertical && "id" in vertical){
                blocks.push({
                    x:position.x,
                    y:position.y + i,
                    render_id:vertical.render_id,
                    block_id:vertical.id
                })
            }
        }

        return blocks;
    })

    $inspect('peripheral_blocks',peripheral_blocks)
</script>


<Modal open={expanded_block.id!==undefined}>
    <div class="overscroll" style="--expanded-x:{position.x}; --expanded-y:{position.y};">
        <div class="block-navigator">
            {#each peripheral_blocks as block (block.render_id)}
                <div class="block-cell" style="--block-x:{block.x}; --block-y:{block.y};">
                    {block.block_id}
                </div>
            {/each}
            
        </div>
    </div>
</Modal>


<style>
    .overscroll{
        /* overflow:auto; */
        overflow:hidden;
        width:100%;
        height:100%;
        scrollbar-width:none;
        pointer-events:var(--pointer-events);
    }

    .overscroll::-webkit-scrollbar{
        display:none;
    }

    .block-navigator{
        position:relative;
        /* display:grid; */
        /* set this via a store value and reactive variables in the future
         *  to make consistent with content grid */
        /* grid-template-columns:repeat(4,100cqw); */
        /* grid-template-rows:auto; */
        transform:translate(
            calc(var(--expanded-x) * -100cqw),
            calc(var(--expanded-y) * -100cqw)
        )
    }

    .block-cell{
        position:absolute;
        left:calc(100cqw * var(--block-x));
        width:100cqw;

        top:calc(100cqh * var(--block-y));
        height:100cqh;

        box-sizing:border-box;
        border:3px solid red;
        scroll-snap-align:center;
    }
</style>