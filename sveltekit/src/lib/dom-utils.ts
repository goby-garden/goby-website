import type { Attachment } from 'svelte/attachments';

export function keyToClick(clickCallback:()=>void){
    return function keyHandler(e:KeyboardEvent){
        if(e.key==="Enter"){
            clickCallback();
        }
    }
}

// export function handle_focus(focused){
//     const attachment:Attachment=(element)=>{
//         element.addEventListener('focus',()=>{
//             focused=true;
//         })

//         element.addEventListener('blur',()=>{
//             focused=false;
//         })
//     }
//     return attachment;
// }
