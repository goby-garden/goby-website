
//using this document to test sqlite.js functions before implementing in application environemnt

import Database from 'better-sqlite3';
import Project from './sqlite.js';




const project=new Project('tags-talking.db');


testStuff();

async function testStuff(){
  // let data=await project.retrieveAllClasses();
  project.deleteProperty('Images',2,'Test');
  // console.log(data[1].objects[0]);
}


//options examples---------------------
const data_options_example={
  type:'string',
  default:null
}

const relation_options_example={
  linked:false,
  targets:[
    {
      class_id:2,
      class_name:'foundry',
      prop_name:null,
      count:null
    }
  ],
  default:null
}
//---------------------
