<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import { onMount } from "svelte";
  import parse from "$lib/markdown";

  import { channel_data, page_size } from "$lib/channel/context.svelte";
  import { get_channel_contents } from "$lib/arena-v3";

  let rendered_blocks: any[] = $state([]);

  $effect(() => {
    let blocks = [];
    for (let b = channel_data.length; b > 0; b--) {
      const matching = channel_data.blocks?.find(
        (block) => block.connection.position == b,
      );

      blocks.push({
        ...(matching || {}),
        render_id: `${matching ? "block" : "placeholder"}-${matching?.id || b}`,
      });
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

      channel_data.length = meta.total_count;
      merge_blocks(data);

      queue.delete(page);
    }

    if (queue.size > 0) {
      // delay 300ms
      await new Promise((res) => setTimeout(res, 300));
      run_contents_queue();
    } else {
      queue_running = false;
    }
  }

  function merge_blocks(new_blocks: any[] = []) {
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
    // console.log(entries);
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
</script>

<main>
  {#each rendered_blocks as block, b (block.render_id)}
    {@const block_author = block.user || block.owner}
    {@const block_connector = block.connection?.connected_by}
    <a
      class="block"
      class:loaded={block}
      class:channel={block?.type === "Channel"}
      {@attach !block?.id && observer_attachment}
      href={block?.id ? `#block-${block?.id}` : null}
      data-page={Math.ceil((b + 1) / page_size)}
    >
      <figure class="block-inner">
        <div class="block-preview">
          {#if block?.image}
            <img alt={block.image.alt_text} src={block.image.small?.src} />
          {:else if block?.content?.markdown}
            <div class="block-text-preview prose">
              {@html parse(block.content.markdown)}
            </div>
          {/if}
        </div>

        <figcaption class="block-labels" class:no-title={!block?.title}>
          
            <div class="title-overflow-wrap">
                {#if block?.title}
              <span class="block-title label-span" title="Block title"
                >{block.title}</span
              >
              {/if}
            </div>
          
          <div class="authors">
            {#if block_author}<span
                title="Owner of block"
                class:block-connector={block_connector.id == block_author.id}
                class="block-author label-span">{block_author.name}</span
              >{/if}
            <!-- {#if block_connector && block_connector.id !== block_author.id}
              <span
                title="Block connector"
                class="block-connector secondary label-span"
                >Added by <strong>{block_connector.name}</strong></span
              >
            {/if} -->
          </div>
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
    gap: 10px;
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
    font-size: 13px;
    font-weight: 200;
    padding-bottom: 2px;

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
  }

  .title-overflow-wrap,
  .authors .label-span {
    padding-block: 3px 3px;
  }

  .authors {
    display: none;
    flex-flow:row nowrap;

    & .label-span {
      display: inline-block;
      padding-inline: 8px;
      border-radius: 20px;
    }
  }

  .block-connector.secondary,
  .block:hover .block-connector {
    background-color: #363636;
    color: var(--block-bg);
    /* background-color: rgba(255, 255, 255, 0.5);
    outline:1px solid #363636;
    outline-offset:-1px; */
  }

  .block-connector.secondary {
    display: none;
    position: absolute;
    /* bottom:0px;
        transform:translateY(50%);
        right:7px; */

    /* transform:translateY(100%);
        bottom:-5px;
        right:0px; */

    transform: translateY(-100%);
    bottom: 15px;
    right: 6px;

        /* top:10px;
        right:6px; */
  }

  .block.channel .block-connector.secondary{
    bottom:10px;
    transform:none;
    /* bottom:0px;
    right:0px; */
    /* position:static; */
    /* transform:none; */
  }

  .block-author {
    background-color: rgba(200, 200, 200, 0.5);
  }

  .block:hover {
    z-index: 5000;
  }

  .no-title .authors,
  .block:hover .authors,
  .block.channel .authors{
    display:flex;
  }


  .block:hover .block-connector {
    display: inline-block;
  }

  .block:hover .block-title {
    /* display:none; */
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
  .block.channel[href]:hover {
    border: 1px solid #363636;
  }

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

    & > :global(p) {
      /* display: inline; */
    }

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
