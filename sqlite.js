import Database from 'better-sqlite3';


class Project{
  constructor(source){
    // ':memory:'
    this.db= new Database(source);


    //add conditional here to check if database is new or existing

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

    // this.db.prepare('INSERT INTO class_base VALUES (null)').run();
    // console.log(this.db.prepare('INSERT INTO system_root VALUES (null)').run());
  }

  addEmptyRow(class_name,name_value){
    //first add new row to root and get id
    this.db.prepare('INSERT INTO system_root VALUES (null)').run();
    const root_id=this.db.prepare('SELECT id FROM system_root ORDER BY id DESC').get().id;
    //get the last item in class table and use it to get the order for the new item
    const last_order=this.db.prepare(`SELECT system_order FROM [class_${class_name}] ORDER BY system_order DESC`).get();
    const new_order=last_order?last_order.system_order+1:1;
    //add new row with order and root id to class table
    this.db.prepare(`INSERT INTO [class_${class_name}] (system_id,system_order,user_Name) VALUES (${root_id},${new_order},'${name_value}')`).run();
    return root_id;

  }

  createTable(type,name,columns){
    //type will pass in 'class' or 'system' to use as a name prefix
    //columns will for now pass in an array of raw SQL column strings

    // columns=columns?columns:[`FOREIGN KEY(system_id) REFERENCES system_root(id)`,'system_id INTEGER UNIQUE','user_name TEXT'];
    columns=columns?columns:['system_id INTEGER UNIQUE','system_order INTEGER','user_Name TEXT',`FOREIGN KEY(system_id) REFERENCES system_root(id)`];

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
          name:'Name',
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
    console.log('---------',prop_type);
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
      let command_string=`ALTER TABLE [class_${class_name}] ADD COLUMN [user_${prop_name}] ${sql_datatype}  ${options.default?('DEFAULT '+options.default):''};`;
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

      for (const target of prop_meta.targets){
        delete target.prop_name;
        delete target.count;
      };
    }

    //update metadata json for table with new property




    this.db.prepare(`UPDATE system_classlist set metadata = '${JSON.stringify(class_meta)}' WHERE id = ${class_id}`).run();

  }


  addToJunction(junction_id,class_ids,row_ids){
    this.db.prepare(`INSERT INTO junction_${junction_id} (${class_ids.join(',')}) VALUES (${row_ids.join(',')})`).run();
  }

  customImport(items,class_id,class_name){

    let class_meta=JSON.parse(this.db.prepare(`SELECT metadata FROM system_classlist WHERE id = ${class_id}`).get().metadata);
    //get junction id for foundry, classification, style
    const junction_ids={
      'Foundry':class_meta.properties.find(a=>a.name=='Foundry').junction_id,
      'Classification':class_meta.properties.find(a=>a.name=='Classification').junction_id,
      'Style':class_meta.properties.find(a=>a.name=='Style').junction_id
    }
    const class_ids={
      'Foundry':class_meta.properties.find(a=>a.name=='Foundry').targets[0].class_id,
      'Classification':class_meta.properties.find(a=>a.name=='Classification').targets[0].class_id,
      'Style':class_meta.properties.find(a=>a.name=='Style').targets[0].class_id
    }
    const plurals={
      'Foundry':'Foundries',
      'Classification':'Classifications',
      'Style':'Styles'
    }


    for(const item of items){
      //first add new row to root and get id
      this.db.prepare('INSERT INTO system_root VALUES (null)').run();
      const root_id=this.db.prepare('SELECT id FROM system_root ORDER BY id DESC').get().id;
      //get the last item in class table and use it to get the order for the new item
      const last_order=this.db.prepare(`SELECT system_order FROM [class_${class_name}] ORDER BY system_order DESC`).get();
      const new_order=last_order?last_order.system_order+1:1;

      const columns=[];
      const values=[];
      // const relations=[];

      //for each key:
      for (let [key, value] of Object.entries(item)) {
        if(key=='Name'||key=='Website'){
          //adds name and website straight-up
          columns.push(`[user_${key}]`);
          values.push(`'${value}'`);
        }else{
          // relations.push({key:key,val:value});
          const relations=value.split(',');

          for(const relation of relations){
            //if it's a relation (foundry, classification, style):
            //looks for matching name in corresponding table
            const relation_row=this.db.prepare(`SELECT system_id FROM class_${plurals[key]} WHERE user_Name LIKE '${relation}'`).get();

            //if it can't find it, it creates a new row in that table and returns the ID
            //if it can find it, it returns the ID
            const relation_id=relation_row?relation_row.system_id:this.addEmptyRow(plurals[key],relation);
            //with both IDs in hand, find the appropriate junction table for that property, and add row with IDs
            this.addToJunction(junction_ids[key],['class_'+class_id,'class_'+class_ids[key]],[root_id,relation_id]);
          }
        }
      }
      //add main item to class table with data columns, order and root id
      this.db.prepare(`INSERT INTO [class_${class_name}] (system_id,system_order,${columns.join(',')}) VALUES (${root_id},${new_order},${values.join(',')})`).run();


    }



  }

}

export default Project;
