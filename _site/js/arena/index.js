let query_params={};
let channels=[];
let channel_index=[];
let groups={
    uncategorized:[]
};
let index_key={};

const main=document.querySelector('main');
const identity_input=document.querySelector('#identity-input');
const index_in_description_input=document.querySelector('#index-in-description');
const index_key_block_input=document.querySelector('#key-block');
const channel_wrapper=document.querySelector('#profile-channels');
const category_wrapper=channel_wrapper.querySelector('#categories');
const uncategorized_wrapper=channel_wrapper.querySelector('#uncategorized');
const profile_name_heading=document.querySelector('#profile-selection h1');
const profile_bio_wrapper=document.querySelector('#profile-bio');
const display_options_box=document.querySelector('#index-display-options');
const profile_data={
    name:'',
    bio:'',
    bio_html:''
}
let index_in_description=null;
let index_key_block='';
let gql_result={};

window.addEventListener('load',init);

function find_index_key_labels(md_str){
    // .replaceAll('`','')
    const lines=md_str.replaceAll('&gt;','>').replaceAll('&amp;','&').split('\n');
    const lines_with_equals=lines.filter(a=>a.includes(' = '));
    const lines_with_colon=lines.filter(a=>a.includes(': '));
    const uses_equals=lines_with_equals.length>2;
    const uses_colons=lines_with_colon.length>2;

   
    const valid_keys={};
    for(let line of lines){
        let processed=process_title_string(remove_code_on_line(line),{format:uses_equals?' = ':uses_colons?': ':false});
        
        if(
            processed.key.length>0 &&
            processed.title.length>0 &&
            !valid_keys[processed.key] &&
            groups[processed.key]
        ){
            valid_keys[processed.key]=processed.title;
        }
    }

    return valid_keys;
}

function remove_code_on_line(line){
    return line.replaceAll(/`([^`]*)`/g,"$1");
}


function find_arena_block_links(md_str){
    const block_link_regex=/\[([\w\s\d]+)\]\((https?:\/\/www\.are\.na\/block\/[\w\d./?=#]+)\)/g;

    return [...md_str.matchAll(block_link_regex)].flatMap((a)=>a[2].replace('https://www.are.na/block/',''));
    

    // \[([\w\s\d]+)\]\((https?:\/\/[\w\d./?=#]+)\)
}

function update_display_options(){
    index_in_description_input.checked=index_in_description?true:false;
    index_key_block_input.value=index_key_block.length>0?'https://www.are.na/block/'+index_key_block:'';
    display_options_box.classList.toggle('key-in-description',index_in_description);
}

function init(){
    
    identity_input.addEventListener('input',()=>{
        index_in_description=null;
        index_key_block='';
        update_display_options();
        handle_query_params([{key:'desc',value:null},{key:'key',value:null}]);
        handle_slug_input();
    });
    
    handle_query_params();
    if(query_params.profile){
        identity_input.value='https://www.are.na/'+query_params.profile;
    }
    if(query_params.desc=='true'){
        index_in_description=true;
        update_display_options();
    }
    if(query_params.key){
        index_key_block=query_params.key;
        update_display_options();
    }


    profile_bio_wrapper.addEventListener('click',function(e){
        console.log(e);
        if(profile_bio_wrapper.classList.contains('expandable')){
            profile_bio_wrapper.classList.toggle('view-full');
        }
        
    })
    

    index_in_description_input.addEventListener('change',async function(e){
        index_in_description=index_in_description_input.checked;
        handle_query_params([{
            key:'desc',
            value:index_in_description?true:null
        }]);
        update_display_options();

        await process_api_result(gql_result);
        populate_index();

    })

    index_key_block_input.addEventListener('input',async function(){
        const block_url_regex=/https?:\/\/www\.are\.na\/block\/([\w\d./?=#]+)/;
        const regex_match=index_key_block_input.value.match(block_url_regex);
        if(regex_match[1]){
            index_key_block=regex_match[1];
            handle_query_params([{key:'key',value:regex_match[1]}]);
            await process_api_result(gql_result);
            populate_index();
        }else{
            index_key_block='';
        }
        
        // index_key_block=index_key_block_input.value;
    })
    handle_slug_input();
    watch_sizing(['#categories','#uncategorized']);
}

async function handle_slug_input(){
    const v=identity_input.value;
    if(validURL(v)){
        const url_components=v.split('/');
        const i=url_components.findIndex((a)=>a.includes('are.na')) + 1;
        const slug=url_components[i];
        gql_result=await get_index(slug);
        if(gql_result.channel_index){
            profile_data.name=gql_result.name;
            profile_data.bio=gql_result.bio;
            profile_data.bio_html=gql_result.bio_html;


            handle_query_params([{
                key:'profile',
                value:slug
            }])
            await process_api_result(gql_result);
            populate_index();
        }
    }else{
        console.log('not valid slug')
        
    }
}


function arena_order(key){
    if(key=='uncategorized'){
        return 1000;
    }else{
        return channel_index.findIndex(a=>a.key==key);
    }
}


function watch_sizing(target_selectors){
    let observer=new ResizeObserver((entries)=>{
        for(let entry of entries){
            let h=entry.borderBoxSize[0].blockSize;
            entry.target.style.setProperty('--h',h+'px');
            entry.target.classList.add('height-set');
        }
    })

    for(let selector of target_selectors){
        observer.observe(document.querySelector(selector))
    }
}

function populate_index(){
    channel_wrapper.querySelector('#categories').innerHTML='';
    channel_wrapper.querySelector('#uncategorized').innerHTML='';
    profile_name_heading.innerText=profile_data.name;
    document.title=profile_data.name+" are.na index";
    const parsed_bio=profile_data.bio_html;
    profile_bio_wrapper.innerHTML=parsed_bio;
    profile_bio_wrapper.classList.toggle('expandable',profile_bio_wrapper.scrollHeight>profile_bio_wrapper.clientHeight);

    const index_key_arr=Object.keys(index_key);
    let sorted=Object.entries(groups).toSorted((a,b)=>{
        return arena_order(a[0]) - arena_order(b[0]);
    }).toSorted((a,b)=>{
        const a_ind=index_key_arr.indexOf(a[0]);
        const b_ind=index_key_arr.indexOf(b[0]);
        return a_ind==-1?1:a_ind - b_ind==-1?1:b_ind;
    })

    for(let [key,channels] of sorted){
        const uncategorized=key=='uncategorized';

        const group_wrapper=uncategorized?document.createElement('div'):document.createElement('details');
        
        if(!uncategorized){
            group_wrapper.open=index_key[key];
            const summary=document.createElement('summary');
            summary.classList.add('noselect')
            
            const name_group=document.createElement('div');
            name_group.classList.add('name-group');

            const key_label=document.createElement('span');
            key_label.innerText=key;
            key_label.classList.add('key-label');

            const name=document.createElement('h2');

            name.innerHTML=marked.parseInline(index_key[key] || '');
            name.classList.add('name-label');

            name_group.appendChild(key_label);
            name_group.appendChild(name);

            summary.appendChild(name_group);

            group_wrapper.appendChild(summary);
        }else{
            const heading=document.createElement('h2');
            heading.innerText='Uncategorized';
            group_wrapper.appendChild(heading);
        }
        
        group_wrapper.dataset.type=uncategorized?'uncategorized':'category';
        
        const ul = document.createElement('ul');
        
        for(let channel of channels){
            const li=document.createElement('li');
            const channel_anchor=document.createElement('a');
            const title=uncategorized?channel.title:channel.processed_title;
            channel_anchor.innerText=title;
            channel_anchor.href='https://are.na'+channel.href;
            channel_anchor.target="_blank";
            channel_anchor.classList.add('channel')
            channel_anchor.classList.add('noselect')
            channel_anchor.classList.toggle('open-channel',channel.visibility_name=='PUBLIC')

            const count=document.createElement('span');
            count.classList.add('block-count');
            count.innerText='('+channel.counts.contents+')';
            li.appendChild(channel_anchor);
            li.appendChild(count);
            ul.appendChild(li)
        }
        group_wrapper.appendChild(ul);

        if(!uncategorized) category_wrapper.appendChild(group_wrapper);
        else uncategorized_wrapper.appendChild(group_wrapper);
    }

    main.classList.add('profile-populated');
}

async function process_api_result(result){
    channel_index=result.channel_index;
    channels=result.channel_index.flatMap((a)=>a.channels);
    groups={
        uncategorized:[]
    };
    
    for(let channel of channels){
        const processed_name=process_title_string(channel.title);
        channel.key=processed_name.key;
        channel.processed_title=processed_name.title;

        if(processed_name.key.length>0){
            if(groups[processed_name.key]) groups[processed_name.key].push(channel);
            else groups[processed_name.key]=[channel];
        }else{
            groups.uncategorized=[...groups.uncategorized,channel]
        }
    }

    index_key={};

    let found_key={};

    found_key=find_index_key_labels(result.bio);
    if(!index_in_description){
        const block_ids=index_key_block.length>0?[index_key_block]:find_arena_block_links(result.bio);
        let found_better=false;
        for(let id of block_ids){
            try{
                let block_data=await request_arena_block(id);

                if(block_data?.class=='Text'){
                    key_block_labels=find_index_key_labels(block_data?.content || '');
                    if(Object.keys(key_block_labels).length>Object.keys(found_key).length){
                        found_key=key_block_labels;

                        found_better=true;
                        index_key_block_input.value='https://www.are.na/block/'+id;
                    }
                }
            }catch(e){
                console.log(e);
            }
        }

        if(!found_better&&index_in_description==null){
            index_in_description=true;
            update_display_options();
        }else if(!found_better){
            // index_key_block='';
            // handle_query_params([{key:'key',value:null}]);
        }
    }
    

    index_key=found_key;


    for(let [key,channels] of Object.entries(groups)){
        if(key!=='uncategorized' && channels.length==1 && !index_key[key]){
            groups.uncategorized.push(channels[0])
            delete groups[key];
        }
    }

    let space1="️ ";
    let space2=" ";
    console.log('special space?',space1.charCodeAt(0),'space:',space2.charCodeAt(0))

    for(let key of Object.keys(groups)){
        console.log(key,'-----------------')
        for(let char of key){
            console.log(char,char.charCodeAt(0));
        }
        // console.log(key,key.length,key.charCodeAt(0),key.charCodeAt(0));
    }
    // console.log(groups.keys());

    groups.uncategorized=groups.uncategorized.toSorted((a,b)=>{
        let a_order=arena_order(a.title[0].toUpperCase());
        let b_order=arena_order(b.title[0].toUpperCase());
        return a_order - b_order;
    });
    
}

function request_arena_block(block_id){
    return new Promise((resolve,reject)=>{
        const v2_req=new XMLHttpRequest();
        v2_req.addEventListener('load',function(){
            if (this.status >= 200 && this.status < 300) {
                resolve(JSON.parse(v2_req.response));
            } else {
                reject({
                    status: this.status,
                    statusText: v2_req.statusText
                });
            }
        })
        v2_req.open('GET', `https://api.are.na/v2/blocks/${block_id}`);
        v2_req.send();
    })
}


function process_title_string(str,{format}={}){
    const str_validated=str.replaceAll("️","");
    
    let key='';
    let title=str_validated;

    if(!format){
        const alphanumeric_regex=/[a-zA-Z\d\[“"]/;
        for(let char of str_validated){
            
            if(!char.match(alphanumeric_regex)){
                key+=char;
            }else{
                break;
            }
        }
        title=str_validated.replace(key,'');
    }else if(format==' = '){
        let split=str_validated.split('=');
        if(split.length>1){
            key=split[0].trim();
        }else{
            key='';
        }
        title=str_validated.replace(key,'').replace('=','');
    }else if(format==': '){
        let split=str_validated.split(':');
        if(split.length>1){
            key=split[0].trim();
        }else{
            key='';
        }
        title=str_validated.replace(key,'').replace(':','');
    }
    
    return {
        key:key.trim(),
        title:title.trim()
    }
}

function handle_query_params(set_params = []){
    let param_obj=new URLSearchParams(window.location.search);
    for(let param of set_params){
        if(param.value!==null){
            param_obj.set(param.key,param.value);
        }else{
            param_obj.delete(param.key);
        }
        
    }
    if(set_params.length>0){
        const updated_url = window.location.pathname + '?' + param_obj.toString();
        window.history.replaceState({}, '', updated_url);
    }
    let params={};
    for(let [key,value] of param_obj.entries()){
        params[key]=value;
    }
    query_params= params;
}

async function get_index(slug){
    let fetch_endpoint='/.netlify/functions/arena-gql';
    // fetch_endpoint='https://api.are.na/graphql';

    let result=await fetch(fetch_endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: gql_fetch_index,
            variables: {
                id: slug,
                type: "OWN"
            },
        })
    })
    .then((res) => res.json())
    .then((result) => result);
    console.log(result?.data?.identity);
    return {
        id:result?.data?.identity?.id,
        channel_index:result?.data?.identity?.identifiable?.channels_index,
        bio:result?.data?.identity?.identifiable?.bio,
        bio_html:result?.data?.identity?.identifiable?.bio_html,
        name:result?.data?.identity?.name
    };
}

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  }