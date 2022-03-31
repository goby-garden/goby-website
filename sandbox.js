
//using this document to test sqlite.js functions before implementing in application environemnt

import Database from 'better-sqlite3';
import Project from './sqlite.js';


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





const project=new Project('typefaces-updated.db');
// let spaceData=await project.retrieveSpaceData();
// console.log(project.db.prepare('SELECT COUNT(*) AS length FROM system_classlist').get());



retrieveClassData();
//
async function retrieveClassData(){
  // let data=await project.retrieveClass('Typefaces','2');
  let data=await project.retrieveAllClasses();
  console.log(data[1].objects[0]);
  // console.log(project.updateDataProp(1,'Typefaces','Name','Signifier',false));
}
