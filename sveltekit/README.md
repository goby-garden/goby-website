## What is this?

The bulk of goby-website runs on [11ty](https://www.11ty.dev/), hosted (mostly) statically on netlify. However, I wanted to build a page with some app-like qualities, and a declarative web framework like svelte makes it much easier and faster to build a dynamic interface. So this is a sveltekit app using [adapter-static](https://svelte.dev/docs/kit/adapter-static), and it generates routes which are then folded into the eleventy site using `addPassthroughCopy`, which was just as beautifully simple to set up as I hoped, to the credit of both tools.

## are.na/channel route

Next steps:

- [x] write function for arena v3 contents request in arena-v3.ts and make adjustments to netlify function if necessary
- [ ] render blocks of different types in a basic grid
    - use int observer to load more as you scroll (can follow a similar pattern to the goby.garden root page; or maybe use placeholders with knowing the full length of the channel) 
    - use total length from latest request to render placeholder blocks for the entire channel
    - populate them as the come in

- [ ] render basic lightbox for block with title/description/author/source/dates/etc.
- [ ] custom field editing UI
- [ ] the display/indication of that custom metadata in the top nav needs some work
    - probaby for now it can just have an option to copy paste the generated json into a block to save
- [ ] let’s halt our ambitions here for now

Far horizon:
- authentication, so you can actually edit!
- “bento box” system for deciding how fields display in block list and lightbox
    - clip or fit for text
    - fit or cover for images
- sorting and filtering by fields, both custom and are.na-native