## What is this?

The bulk of goby-website runs on [11ty](https://www.11ty.dev/), hosted (mostly) statically on netlify. However, I wanted to build a page with some app-like qualities, and a declarative web framework like svelte makes it much easier and faster to build a dynamic interface. So this is a sveltekit app using [adapter-static](https://svelte.dev/docs/kit/adapter-static), and it generates routes which are then folded into the eleventy site using `addPassthroughCopy`, which was just as beautifully simple to set up as I hoped, to the credit of both tools.

## are.na/channel route

**7/14/26 (time flies...)**

Next steps:


features/functionality:
- [x] field creator
    - button to create a new field (maybe a summary/detail)
        - opens edit mode
        - radio buttons to choose string / boolean / select
        - field-type specific properties:
            - for now just for select: either single or multiple, also radio buttons
        - creates new editable_field; need to figure out data management for that
        - BUG: when you create a new field, it clears changes to existing fields (I think because editable_fields is overwritten)
            - maybe what the $effect needs to do is set the values to undefined, and only if they don't already exist?
- [ ] goby schema representation in top left
    - lists fields, lets you add/remove and rename / possibly edit properties, using same flow as field creator
        - in the future possibly let you set colors for select options or the field as a whole
    - tells you where it is saving:
        - in localstorage if not authenticated, with an option to copy the json to clipboard
        - channel metadata if authenticated and owner/collaborator
        - in a block if authenticated but not owner/collaborator
- [ ] authentication flow and UI for it
- [ ] once authenticated, flow to save back to block and channel metadata

UI improvements:
- quad-directional arrow key navigation of modal
    - only functions when not in edit_mode
    - have to refactor modal to work by having a giant grid with empty placeholder for the modal rectangles, and only rendering the block currently selected + the blocks surrounding it in 4 directions
- a functional mobile display, which functions like a cabinet sliding up from below
- display urls for link blocks in modal
- ability to click to exit focus of a field in edit mode without exiting edit altogether
- preserve scroll position of focused field when you enter edit mode
- create centralized fn to propagate goby titles to other areas besides the modal where blocks are represented

very far-off:
- filtering/searching by field value
- bulk-editing



**5/17/26**

- I am thinking the text fields can have some in-built padding and no padding on the panels, so that the only thing that changes is the markdown and the labels that appear for title/desc


**5/16/26**

I sort of rushed into the UI without a technical plan or a notion of how the whole interface would function, and I think it is slowing down progress, because I am getting distracted with small decisions and spending time implementing things just to test how they’d feel. It definitely helped inform my sense of some of the interface and interactions I want though.

 I want to start somewhat from scratch, maybe not with a full vision for the look & feel, but with some specific constraints for the structure of the interface:

- a top “nav” input for channel. don’t worry about metadata block for now
    - don’t worry about the title change-in-place-thing. just add it below when it’s available, leaving a space for it so it doesn’t cause reflow
- a grid with int observer to load more blocks, just keep the same mechanism you have
    - left-align title for static, block author if no title
    - on hover, show block author ... and block connector inline next to them if not the same
        - maybe for connector, `→*` in mono
        - aggressive box highlight instead of pill
        - (can save the timestamps for lightbox)
        - (and can maybe mix things up later w/alt+hover or something)
- simple lightbox with column for main block content and column for metadata
    - don’t worry about grid; also can add drag-resizeable width
    - editing one field converts everything to edit mode, just like platform
    - quad-directional arrow keys to move between blocks in the grid
        - I obv have ideas for animation but that can come later
- no hash or localstorage shenanigans for now
- UI can generally feel pretty dry, no animations, minimal drop shadows for now
    - refs: neil.computer
- fragment for the mono for now


maybe for author connectors in block meta view, I can do something like this:

+----------------+---------------+--------------+
| + Added by     |               | A year ago   |
+----------------+  Nico Chilla  +--------------+
| * Connected by |               | 2 months ago |
+----------------+---------------+--------------+


----------------------

**Earlier**

Next steps:

- [x] write function for arena v3 contents request in arena-v3.ts and make adjustments to netlify function if necessary
- [x] render blocks of different types in a basic grid
    - use int observer to load more as you scroll (can follow a similar pattern to the goby.garden root page; or maybe use placeholders with knowing the full length of the channel) 
    - use total length from latest request to render placeholder blocks for the entire channel
    - populate them as the come in

- [ ] render basic lightbox for block with title/description/author/source/dates/etc.
- [ ] custom field editing UI
- [ ] the display/indication of that custom metadata in the top nav needs some work
    - probaby for now it can just have an option to copy paste the generated json into a block to save

Far horizon:
- authentication, so you can actually edit!
- “bento box” system for deciding how fields display in block list and lightbox
    - clip or fit for text
    - fit or cover for images
- sorting and filtering by fields, both custom and are.na-native
- consider making edit_mode for fields in mobile field-specific, rather than global

Bugs:
- [ ] gotta figure out whatever is going on with markdown single line break parsing (see https://www.are.na/nico-chilla/_-type-an-ode-to-the-monospace for example)