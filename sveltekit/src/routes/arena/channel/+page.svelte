<script lang="ts">
    import {get_channel_meta,get_channel_contents} from '$lib/arena-v2';


    let user:string | undefined;


    const test_slug='_-typefaces-foundries-and-type-publications-to-explore';


    async function test_channel_meta(){
        let results=await get_channel_meta(test_slug);
        console.log(results);
    }

    async function test_channel_contents(){
        let results=await get_channel_contents({slug:test_slug});
        console.log(results);
    }
    

</script>

<input id="channel-input" type="text" placeholder="https://are.na/<user>/<channel-slug>" />
<br>
<button id="test-meta" onclick={test_channel_meta}>test channel meta</button>
<br>
<button id="test-contents" onclick={test_channel_contents}>test channel contents</button>

<style>
    #channel-input{
        background-color:rgb(236, 236, 236);
        padding:10px;
        box-sizing:border-box;
        width:100%;
        appearance:none;
    }


    input{
        outline:none;
        border:none;
        border-radius:0;
        appearance:none;
        font-size:inherit;
        font-family:inherit;
    }

    button{
        margin-top:5px;
        border:1px solid black;
        padding:10px;
    }
</style>