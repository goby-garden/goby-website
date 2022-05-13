import Database from 'better-sqlite3';
import Project from './sqlite.js';
import * as fs from 'fs';
import * as util from 'util';

const project=new Project('tags-talking-recover.db');


project.customRemoveRelation();

// console.log(project.retrieveAllClasses());

// project.createTable('class','Images');
// project.createTable('class','Sequence: Formal systems');
// project.createTable('class','Sequence: Worldbuilding');
// project.createTable('class','Sequence: Abstraction');
// project.createTable('class','Sequence: Critique');
// project.createTable('class','Entries');





// project.addProperty(
//   'Typefaces',
//   '2',
//   'Foundry',
//   'relation',
//   {
//     linked:true,
//     targets:[
//       {
//         class_id:null,
//         class_name:'Foundries',
//         prop_name:'Typefaces',
//         count:'multiple'
//       }
//     ],
//     default:null
//   },
//   'single',
//   {
//     display:true,
//     colwidth:4
//   }
// );
//
// project.addProperty(
//   'Typefaces',
//   '2',
//   'Classification',
//   'relation',
//   {
//     linked:false,
//     targets:[
//       {
//         class_id:null,
//         class_name:'Classifications'
//       }
//     ],
//     default:null
//   },
//   'multiple',
//   {
//     display:true,
//     colwidth:4
//   }
// );
//
// project.addProperty(
//   'Typefaces',
//   '2',
//   'Style',
//   'relation',
//   {
//     linked:false,
//     targets:[
//       {
//         class_id:null,
//         class_name:'Styles'
//       }
//     ],
//     default:null
//   },
//   'multiple',
//   {
//     display:true,
//     colwidth:4
//   }
// );
//
// project.addProperty(
//   'Typefaces',
//   '2',
//   'Website',
//   'data',
//   {
//     type:'resource'
//   },
//   'single'
// )
//
// // project.createTable('class','Projects');
//
// async function getTypefaces(){
//   let rawdata = await fs.readFileSync('typeface-data.json');
//   let parsed = JSON.parse(rawdata);
//   // console.log(parsed.values);
//
//   return parsed.values;
// }
//
//
// async function importTypefaces(){
//   const typefaces=await getTypefaces();
//   await project.customImport(typefaces,'2','Typefaces');
//
//   //test output
//   let print_tests=[
//     // JSON.parse(project.db.prepare(`SELECT metadata FROM system_classlist WHERE name = 'Typefaces'`).get().metadata).properties
//     project.db.prepare('SELECT * FROM [class_Typefaces]').all(),
//     project.db.prepare('SELECT * FROM junction_1').all()
//   ]
//   // console.log(print_tests);
//
//   project.db.close();
// }
//
// importTypefaces();
