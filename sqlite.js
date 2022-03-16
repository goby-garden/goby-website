import Database from 'better-sqlite3';
// require Database from 'better-sqlite3';
// require('better-sqlite3');

//a function that initializes a new project, for the moment in memory






class Project{
  constructor(source){
    // ':memory:'
    this.db= new Database(source);
    //System table to contain all objects in the project.
    this.createTable('system','root',['id INTEGER NOT NULL PRIMARY KEY']);
    // [TO ADD: special junction table for root objects to reference themselves in individual relation]

    //System table to contain metadata for all classes created by user
    this.createTable('system','classlist',['id INTEGER NOT NULL PRIMARY KEY','name TEXT','metadata TEXT']);
    //System table to contain all the junction tables and aggregate info about relations
    this.createTable('system','junctionlist',['id INTEGER NOT NULL PRIMARY KEY','metadata TEXT']);
    //A starting class with a name field
    this.createTable('class','base');

    //a starting item (ID #1) in the object root table
    // this.db.prepare('INSERT INTO system_root VALUES (null)').run();
    // this.db.prepare('INSERT INTO class_base VALUES (null)').run();
  }

  createTable(type,name,columns){
    //type will pass in 'class' or 'system' to use as a name prefix
    //columns will for now pass in an array of raw SQL column strings

    columns=columns?columns:['id INTEGER UNIQUE','name TEXT',`FOREIGN KEY(id) REFERENCES system_root(id)`];

    let column_string=columns.join(',');
    const sqlname=type=='class'?`[class_${name}]`:`${type}_${name}`;
    let command_string=`CREATE TABLE ${sqlname}(
      ${column_string}
    )`;
    let stmt=this.db.prepare(command_string);
    const info=stmt.run();

    //this will be constructed using addProperty
    const table_meta={
      properties:[
        {
          name:'name',
          type:'data',
          count:'single',
          type:'string',
          default:null
        }
      ]
    };


    if(type=='class'){
      this.db.prepare(`INSERT INTO system_classlist (name, metadata) VALUES ('${name}','${JSON.stringify(table_meta)}')`).run();
      //get the id of newest value from system_classlist and return
      const class_id=this.db.prepare('SELECT id FROM system_classlist ORDER BY id DESC').get().id;
      return class_id;
    }
  }

  //return 1. a SQL string and 2. a JSON with property data
  addProperty(class_name,class_id,prop_name,prop_type,options,count,label){
    //prop_type is data or relation
    //options is a JSON with type-specific instructions
    //count is single or multiple
    //label is true or false, makes it part of label if true

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


    let class_meta=JSON.parse(this.db.prepare(`SELECT metadata FROM system_classlist WHERE id = ${class_id}`).get().metadata);
    //create JSON for storage in system_classlist
    const prop_meta={
      name:prop_name,
      type:prop_type,
      count:count,
      ...options
    }
    //add property to property list
    class_meta.properties.push(prop_meta);


    //configure SQL command according to type and options

    if(prop_type=='data'){
      //if it's data
      let sql_datatype='';
      const text_datatypes=['string','resource'];
      const real_datatypes=['number'];

      if(count=='multiple'||text_datatypes.includes(options.datatype)){
        //multiple for data means a stringified array no matter what it is
        sql_datatype='TEXT';
      }else if(real_datatypes.includes(options.datatype)){
        sql_datatype='REAL';
      }
      //create property in table
      let command_string=`ALTER TABLE [class_${class_name}] ADD COLUMN [${prop_name}] ${sql_datatype}  ${options.default?('DEFAULT '+options.default):''};`;
      this.db.prepare(command_string).run();
      //update metadata json for table with new property
      // this.db.prepare(`UPDATE system_classlist set metadata = '${JSON.stringify(class_meta)}' WHERE id = ${class_id}`).run();

    }else if(prop_type=='relation'){
      //if it's a relation:
      //list of all the classes that will be in the junction table
      const participants=[
        {
          class_name:class_name,
          class_id:class_id,
          prop_name:prop_name,
          count:count,
          pointy_end:prop_meta.junction_id?true:false
        },
        ...options.targets
      ]

      //this will have been filled in on the front-end, or right after finishing a link declaration on the other side
      if(!prop_meta.junction_id){
        //IF no suitable existing junction table, create a new one:



        //sql column strings for create table
        const columns=[];

        //add string for each participant in junction
        for (const el of participants) {
          //if the class doesn't exist yet, create it and return the new class ID
          if(el.class_id==null){
            el.class_id=this.createTable('class',el.class_name);
          }
          columns.push(`class_${el.class_id} INTEGER`);
        }

        //adds new row to list of junction tables, with the list passed as a parameter
        this.db.prepare(`INSERT INTO system_junctionlist (metadata) VALUES ('${JSON.stringify(participants)}')`).run();
        //gets id of new row
        const junction_id=this.db.prepare('SELECT id FROM system_junctionlist ORDER BY id DESC').get().id;
        prop_meta.junction_id=junction_id;


        //create the junction table
        this.createTable('junction',junction_id,columns);

        if(prop_meta.linked){
          for (const target of prop_meta.targets){
            this.addProperty(
              target.class_name,
              target.class_id,
              target.prop_name,
              'relation',
              {
                linked:true,
                junction_id:junction_id,
                targets:[
                  {class_id:class_id, class_name:class_name, prop_name:prop_name}
                ],
                default:null
              },
              target.count,
              false
            )
          }
        }

      }else{
        //update prop_name and count in junction
        const junction_meta=JSON.parse(this.db.prepare(`SELECT metadata FROM system_junctionlist WHERE id = ${prop_meta.junction_id}`).get().metadata);


        let current_target=junction_meta.find(el=>el.class_id==class_id);
          // ^ ^ ^ may need revising for self-referential columns

        current_target.prop_name=prop_name;
        current_target.count=count;
        this.db.prepare(`UPDATE system_junctionlist set metadata = '${JSON.stringify(junction_meta)}' WHERE id = ${prop_meta.junction_id}`).run();
        //restricts the user from later on adding more targets in the case that this is the other end of a link
        prop_meta.pointy_end=true;
      }


    }

    //update metadata json for table with new property
    for (const target of prop_meta.targets){
      delete target.prop_name;
      delete target.count;
    };


    this.db.prepare(`UPDATE system_classlist set metadata = '${JSON.stringify(class_meta)}' WHERE id = ${class_id}`).run();

  }



  //not sure if prepared statements will be useful but leaving a note in case
  preparedUniversals(){
    // const stmts=[
    //   ['get-tables','.tables'];
    // ]

  }


}

const project=new Project(':memory:');


// project.addProperty(
//   'base',
//   '1',
//   'test-relation',
//   'relation',
//   {
//     linked:false,
//     targets:[
//       {
//         class_id:null,
//         class_name:'test',
//         prop_name:null,
//         count:null
//       }
//     ],
//     default:null
//   },
//   'single',
//   false
// );
project.addProperty(
  'base',
  '1',
  'test-relation',
  'relation',
  {
    linked:true,
    targets:[
      {
        class_id:null,
        class_name:'test',
        prop_name:'testing',
        count:'single'
      }
    ],
    default:null
  },
  'single',
  false
);
//test output
let print_tests=[
  // project.db.prepare('SELECT * FROM system_classlist').all(),
  'junction table: ------------',
  JSON.parse(project.db.prepare('SELECT * FROM system_junctionlist').get().metadata),
  'base class: ------------',
  JSON.parse(project.db.prepare(`SELECT metadata FROM system_classlist WHERE name = 'base'`).get().metadata).properties,
  'test class: ------------',
  JSON.parse(project.db.prepare(`SELECT metadata FROM system_classlist WHERE name = 'test'`).get().metadata).properties,
  // project.db.prepare('SELECT * FROM sqlite_schema WHERE rootpage=5').get()
]
console.log(print_tests);
