<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import { onMount } from "svelte";
  import parse from "$lib/markdown";

  import { channel_data, page_size, expanded_block } from "$lib/channel_v2/context.svelte";
  import { get_channel_contents, type ChannelBlock } from "$lib/arena-v3";
    import { get_canon_value } from "./goby-utils";
  // import type { Block } from "@aredotna/sdk";

  let rendered_blocks: (
    { render_id:string; } | { render_id:string; id:number; } & ChannelBlock
  )[] = $state([]);

  $inspect('channel_data.blocks',channel_data.blocks)

  $effect(() => {
    let blocks:typeof rendered_blocks = [];
    for (let b = channel_data.length; b > 0; b--) {
      const matching = channel_data.blocks?.find(
        (block) => block.connection?.position == b,
      );

      const render_id=`${matching ? "block" : "placeholder"}-${matching?.id || b}`;
      if(matching!==undefined){
        blocks.push({
          render_id,
          ...matching
        })
      }else{
        blocks.push({
          render_id
        })
      }
    }
    rendered_blocks = blocks;
  });

  let observer: IntersectionObserver | undefined;

  onMount(() => {
    observer = new IntersectionObserver(handle_block_loading, {
      root: document,
      rootMargin: "10px",
      threshold: 0,
    });
  });

  let queue_running = false;
  const queue: Set<number> = new Set([]);

  async function run_contents_queue() {
    const page = [...queue][0];
    console.log(`Loading page ${page}`);

    if (page !== undefined && channel_data.slug) {
      queue_running = true;
      await new Promise((res) => setTimeout(res, 300));

      let { data, meta } = await get_channel_contents({
        slug: channel_data.slug,
        page: page,
        per: page_size,
      });

      const schema=JSON.parse(localStorage.getItem(channel_data.slug) || '');

      if(typeof schema == 'object' && "fields" in schema){
        channel_data.schema=schema;
      }

      if(!meta || !data){
        queue_running = false;
        return;
      }

      channel_data.length = meta.total_count;
      merge_blocks(data);

      queue.delete(page);

      check_for_hashed_block();
    }

    if (queue.size > 0) {
      // delay 300ms
      await new Promise((res) => setTimeout(res, 300));
      run_contents_queue();
    } else {
      queue_running = false;
    }
  }


  /** Check if loaded block has been hashed in the url and open it in modal if so*/
  function check_for_hashed_block(){
    const hashedId=parseInt(window.location.hash.replace('block-','').slice(1,window.location.hash.length));
      if(
        window.location.hash.includes('block-')
        && hashedId 
        && channel_data.blocks.some((b)=>b.id==hashedId
        && expanded_block.id !== hashedId
      )){
        set_expanded_block(hashedId)
      }
  }

  function merge_blocks(new_blocks: ChannelBlock[] = []) {
    const brand_new = [];
    for (let block of new_blocks) {
      let matching = channel_data.blocks.find(
        (existing) => existing.id === block.id,
      );
      if (matching) {
        matching = block;
      } else {
        brand_new.push(block);
      }
    }
    channel_data.blocks = [...channel_data.blocks, ...brand_new];
  }

  function handle_block_loading(entries: IntersectionObserverEntry[]) {
    for (let entry of entries) {
      if (entry.intersectionRatio > 0) {
        const page = parseInt((entry.target as HTMLElement).dataset.page || "");
        queue.add(page);
        if (!queue_running) {
          run_contents_queue();
        }
      }
    }
  }

  const observer_attachment: Attachment = (element) => {
    if (observer) observer.observe(element);
    return () => {
      if (observer && element) observer.unobserve(element);
    };
  };

  function set_expanded_block(id:number | undefined){
    if(id){
      expanded_block.id=id;
    }
  }

  $inspect('channel_data.blocks',channel_data.blocks)
</script>

<main inert={expanded_block.id!==undefined}>
  {#each rendered_blocks as block, b (block.render_id)}
    {@const title = "title" in block && get_canon_value({field:'title',block,overrides:channel_data.schema?.overrides})}
    <a
      data-sveltekit-reload
      class="block"
      class:loaded={"id" in block}
      class:channel={"type" in block && block?.type === "Channel"}
      class:expanded={expanded_block.id && "id" in block && block?.id == expanded_block.id}
      {@attach !("id" in block) && observer_attachment}
      href={"id" in block ? `#block-${block?.id}` : null}
      data-page={Math.ceil((b + 1) / page_size)}
      onclick={ ()=>set_expanded_block("id" in block ? block.id : undefined)}
    >
      <figure class="block-inner">
        <div class="block-preview">
          {#if "type" in block}
            {#if "image" in block}
              <img alt={block.image?.alt_text} src={block.image?.small?.src} />
            {:else if block.type=="Text" && block?.content?.markdown}
              <div class="block-text-preview prose">
                {@html parse(block.content.markdown)}
              </div>
            {/if}
          {/if}
        </div>

        <figcaption class="block-labels" class:no-title={!("title" in block) || !block?.title}>
          
          {#if title}
            <div class="title-overflow-wrap">
                <span class="block-title label-span" title="Block title"
                  >{title}</span
                >
            </div>
            {/if}
            {#if "id" in block}
              {@const block_author = block.type=="Channel" ?block.owner : block.user}
              {@const block_connector = block.connection?.connected_by}
              {#if block_author}
                {@const same_as_connector=block_connector?.id == block_author.id}
                <span title="block author{same_as_connector?" and connector":""}" class="person author" class:connector={same_as_connector}>
                  <span>{block_author.name}</span>
                </span>
              {/if}
              {#if block_connector && block_connector?.id !== block_author.id}
                <span title="block connector" class="person connector">
                  <span>{block_connector.name}</span>
                </span>
              {/if}
            {/if}
        </figcaption>
      </figure>
    </a>
  {/each}
</main>

<style>
  main {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 15px;
    width:100%;
    max-width: 1100px;
    margin-inline: auto;
    /* margin-top: 40px; */
  }

  a.block {
    text-decoration: none;
    color: inherit;
  }

  .block {
    grid-column: span 3;
    box-sizing: border-box;
    padding: 9px;
    padding-bottom: 6px;
    --block-bg: rgb(245, 245, 245);
    background-color: var(--block-bg);
    border: 1px solid transparent;
    color: #363636;
    position: relative;
  }

  .block.loaded {
    animation: fadein forwards 0.6s;
  }

  @keyframes fadein {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  .block figure {
    overflow: hidden;
    display: flex;
    flex-flow: column nowrap;
    gap: 5px;
  }

  .block-preview {
    /* border:1px solid gainsboro; */
    aspect-ratio: 1;
    display: grid;
    grid-template-areas: "main";
    min-height: 0;
  }

  .block-preview img {
    grid-area: main;
    object-fit: contain;
    object-position: left center;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
  }

  .block-labels {
    width: 100%;

    display: flex;
    flex-flow: row nowrap;
    gap: 5px;

    font-family: Arial;
    color: #363636;
    font-size: 14px;
    font-weight: 200;
    min-height:22px;

    & .label-span {
      white-space: nowrap;
    }
  }

  .block.channel .block-labels{
    flex-flow:column nowrap;
    align-items:flex-start;
  }

  .title-overflow-wrap {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space:nowrap;
  }

  .block.channel {
    border: 1px solid gainsboro;
    background-color: transparent;

    & .block-preview {
      display: none;
    }

    & .block-title {
      font-weight: 600;
    }
  }

  .block[href]:hover,
  .block.channel[href]:hover,
  .block.expanded,
  .block.channel[href].expanded {
    border: 1px solid #363636;
  }

  .block.expanded,
  .block[href]:not(.channel):hover{
    & .title-overflow-wrap{
      display:none;
    }
  }

  .person{
    background-color:rgba(0,0,0,0.1);
    padding-inline:3px;
    display:inline-flex;
    flex-flow:row nowrap;
    min-width:0;

    & span{
      overflow: hidden;
      text-overflow: ellipsis;
      white-space:nowrap;
      flex:1;
    }
  }

  .block[href]:not(:hover,.expanded) .person:not(.no-title .author,.channel .author){
    display:none;
  }

  .author::before,
  .connector::after{
    order:-1;
    padding-right:3px;
    margin-right:3px;
    border-right:1px solid var(--block-bg);
    border-right:1px solid rgba(0,0,0,0.1);
    font-family: 'Menlo', 'Fragment Mono', Arial, sans-serif;
    min-height:0;
    box-sizing:border-box;
    display:inline-block;
  }
  .author::before{
    content:'+';
  }

  .channel .author::before{
    content:'⊞';
  }

  .connector::after{
    content:'*';
    position:relative;
  }

  /* .author.connector::before{
    content:'+';
  } */


  .block-text-preview {
    height: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
    line-height: 1.3em;
    font-size: 14px;
    position: relative;

    &::after {
      content: "";
      width: 100%;
      height: 20px;
      background: linear-gradient(0deg, var(--block-bg), transparent);
      position: absolute;
      bottom: 0;
      left: 0;
    }
  }
</style>
