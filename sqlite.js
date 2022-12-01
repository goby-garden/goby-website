import Database from 'better-sqlite3';

//removed base class from init
//added meta prop to createTable

class Project{
  constructor(source){
    // ':memory:'
    this.db= new Database(source);

    this.text_datatypes=['string','resource'];
    this.real_datatypes=['number'];

    this.colors=[
      { regular: '#c579c8', light: '#daacda' },
      { regular: '#ff8d7e', light: '#ffc4b7' },
      { regular: '#ff7ffc', light: '#ffb9ff' },
      { regular: '#ffb14e', light: '#ffdf9a' },
      { regular: '#beb8eb', light: '#e6e4f1' },
      { regular: '#67b4e3', light: '#bad6eb' },
      { regular: '#6fd8c8', light: '#cef7ef' },
      { regular: '#ace054', light: '#e2ffa3' },
      { regular: '#ffc6ea', light: '#fffdff' },
      { regular: '#7ab17f', light: '#bbd1bc' }
    ];

    // this.colors=[
    //   { regular: '#c579c8', light: '#daacda' },
    //   { regular: '#000000', light: '#e6e6e6' },
    //   { regular: '#f05161', light: '#f9dee0' },
    //   { regular: '#66b245', light: '#e4efdd' },
    //   { regular: '#65a7db', light: '#e3edf7' },
    //   { regular: '#fde700', light: '#fdfadc' },
    //   { regular: '#63326E', light: '#D1ABD9' }
    // ];


    //check if root exists (if goby is initiated in file):
    const gobyInit=this.db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='system_root'`).get();
    if(!gobyInit){
      console.log('initializing goby database');
      this.init();
    }else{
      console.log('opened goby database');
    }
    this.run={
      class_meta:this.db.prepare(`SELECT metadata FROM system_classlist WHERE id = ?`),
      junction_meta:this.db.prepare(`SELECT metadata FROM system_junctionlist WHERE id = ?`)
    }



    // if(this.db.prepare(`SELECT name FROM system_classlist WHERE name='base'`).get()){
    //   this.dropClass('base','1');
    //   console.log('dropped');
    // }

  }

  dropClass(class_name,class_id){
    //drop table
    this.db.prepare(`DROP TABLE IF EXISTS [class_${class_name}]`).run();
    //delete from classlist
    this.db.prepare(`DELETE FROM system_classlist WHERE id=${class_id}`).run();


    //for future: deal with relation dependencies
  }

  init(){
    //System table to contain all objects in the project.
    this.createTable('system','root',['id INTEGER NOT NULL PRIMARY KEY']);
    // [TO ADD: special junction table for root objects to reference themselves in individual relation]

    //System table to contain metadata for all classes created by user
    this.createTable('system','classlist',['id INTEGER NOT NULL PRIMARY KEY','name TEXT','metadata TEXT']);
    //System table to contain all the junction tables and aggregate info about relations
    this.createTable('system','junctionlist',['id INTEGER NOT NULL PRIMARY KEY','metadata TEXT']);
    //System table to contain generated image data
    this.createTable('system','images',['file_path TEXT','img_type TEXT','img BLOB']);

    //A starting class with a name field
    // this.createTable('class','base');
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

  createTable(type,name,columns,meta){
    //type will pass in 'class' or 'system' to use as a name prefix
    //columns will for now pass in an array of raw SQL column strings
    columns=columns?columns:['system_id INTEGER UNIQUE','system_order INTEGER','user_Name TEXT',`FOREIGN KEY(system_id) REFERENCES system_root(id)`];

    let column_string=columns.join(',');
    const sqlname=type=='class'?`[class_${name}]`:`${type}_${name}`;
    let command_string=`CREATE TABLE ${sqlname}(
      ${column_string}
    )`;
    let stmt=this.db.prepare(command_string);
    const info=stmt.run();

    if(type=='class'){
      let latest=this.db.prepare('SELECT id FROM system_classlist ORDER BY id DESC').get()
      latest=latest?latest.id:1;

      //this will be constructed using addProperty
      const table_meta={
        properties:[
          {
            name:'Name',
            type:'data',
            count:'single',
            type:'string',
            default:null,
            style:{display:false,colwidth:4}
          }
        ],
        style:{
          color:this.colors[latest],
          stowed:meta.stowed,
          position:meta.position
        }
      };

      this.db.prepare(`INSERT INTO system_classlist (name, metadata) VALUES ('${name}','${JSON.stringify(table_meta)}')`).run();
      //get the id of newest value from system_classlist and return
      const class_id=this.db.prepare('SELECT id FROM system_classlist ORDER BY id DESC').get().id;
      return class_id;
    }
  }

  async retrieveSpaceData(){
    //returns data in a list of nodes, a list of relations, and a list of class metadata
    let classes=await this.db.prepare(`SELECT name, id, metadata FROM system_classlist`).all();
    let junctions=await this.db.prepare(`SELECT id, metadata FROM system_junctionlist`).all();

    let relations=[];
    for(const junction of junctions){
      junction.metadata=JSON.parse(junction.metadata)
      let targets=[];
      let lead={};
      let caseWhenStrings=[];
      for(let pt of junction.metadata.participants){
        if(pt.pointy_end==false){
          lead.id=pt.class_id;
          lead.prop=pt.prop_name;
        }else{
          targets.push('class_'+pt.class_id);
          caseWhenStrings.push(`= class_${pt.class_id} THEN ${pt.prop_name?`'${pt.prop_name}'`:"null"}`)
        }
      }
      let coalescence=`COALESCE(${targets.join(',')+', null'})`;
      let command_string=`SELECT
        class_${lead.id} as source,
        ${coalescence} as target,
        '${lead.prop}' as source_prop,
        CASE WHEN ${coalescence+' '+caseWhenStrings.join(' WHEN '+coalescence)}
        END AS target_prop
        FROM junction_${junction.id}`;

      let newRelations=this.db.prepare(command_string).all();
      relations=relations.concat(newRelations);
        // command_strings.push(command_string);
    }
    let objects=[];
    let colors={};
    for(const cls of classes){
      cls.metadata=JSON.parse(cls.metadata);
      let cls_objects=await this.db.prepare(`SELECT system_id, '${cls.id}' AS class_id, user_Name AS label FROM [class_${cls.name}]`).all();
      objects=objects.concat(cls_objects)
      colors[cls.id]=cls.metadata.style.color
    }
    objects=objects.filter(a=>a.label.length>0);

    return {objects,relations,colors};
    // return classes;
  }


  async saveImage(path,type,buffer){
    // console.log(buffer);
    let processedBuffer=await new Uint8Array(buffer);
    // console.log(processedBuffer);
    await this.db.prepare(`INSERT INTO system_images (file_path,img_type,img) VALUES ('${path}','${type}',?)`).run(processedBuffer);
    const images=await this.retrieveImages();
    return images;
  }

  //return 1. a SQL string and 2. a JSON with property data
  addProperty(class_name,class_id,prop_name,prop_type,options,count,style={display:false,colwidth:4}){

    //see testing for options examples


    let class_meta=JSON.parse(this.db.prepare(`SELECT metadata FROM system_classlist WHERE id = ${class_id}`).get().metadata);

    // let style={
    //   colwidth:4
    // }
    //create JSON for storage in system_classlist
    const prop_meta={
      name:prop_name,
      type:prop_type,
      count:count,
      style:style,
      ...options
    }
    //add property to property list
    class_meta.properties.push(prop_meta);


    //configure SQL command according to type and options
    if(prop_type=='data'){
      //if it's data
      let sql_datatype='';
      if(count=='multiple'||this.text_datatypes.includes(options.datatype)){
        //multiple for data means a stringified array no matter what it is
        sql_datatype='TEXT';
      }else if(this.real_datatypes.includes(options.datatype)){
        sql_datatype='REAL';
      }
      //create property in table
      let command_string=`ALTER TABLE [class_${class_name}] ADD COLUMN [user_${prop_name}] ${sql_datatype}  ${options.default?('DEFAULT '+options.default):''};`;
      this.db.prepare(command_string).run();

    }else if(prop_type=='relation'){
      //if it's a relation:
      //list of all the classes that will be in the junction table

      //copy targets with stringify/parse, and remove unecessary options key
      let siftedTargets=JSON.parse(JSON.stringify(options.targets));
      for (let target of siftedTargets){
        delete target.options
      }

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

        let junction_meta={
          participants:participants
        }

        //adds new row to list of junction tables, with the list passed as a parameter
        this.db.prepare(`INSERT INTO system_junctionlist (metadata) VALUES ('${JSON.stringify(junction_meta)}')`).run();
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
              target.count
            )
          }
        }

      }else{
        //update prop_name and count in junction
        const junction_meta=JSON.parse(this.db.prepare(`SELECT metadata FROM system_junctionlist WHERE id = ${prop_meta.junction_id}`).get().metadata);


        let current_target=junction_meta.participants.find(el=>el.class_id==class_id);
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
      }
    }

    //update metadata json for table with new property




    this.db.prepare(`UPDATE system_classlist set metadata = '${JSON.stringify(class_meta)}' WHERE id = ${class_id}`).run();

  }


  addToJunction(junction_id,class_ids,row_ids){
    this.db.prepare(`INSERT INTO junction_${junction_id} (${class_ids.join(',')}) VALUES (${row_ids.join(',')})`).run();
  }

  retrieveImages(){
    const images=this.db.prepare(`SELECT * FROM system_images`).all();
    return images;
  }

  retrieveClassUpdated(class_name,class_id,class_meta){
    class_meta=class_meta?class_meta:JSON.parse(this.run.class_meta.get(class_id).metadata);
    const class_string=`[class_${class_name}]`;

    //joined+added at beginning of the query, built from relations
    const cte_strings=[];

    //joined+added near the end of the query, built from relations
    const joins=[];

    //joined+added between SELECT and FROM, built from relations
    const relation_selections=[];

    let relation_properties=class_meta.properties.filter(a=>a.type=='relation');

    for (let prop of relation_properties){
      let junct_string=`junction_${prop.junction_id}`;
      const concat_strings=[];

      //creates instruction to concatenate all the selected items of a single class, puts them in array
      for(let target of prop.targets){
        concat_strings.push(
          `'${target.class_id}', json('[' || GROUP_CONCAT(class_${target.class_id}) || ']')`
        )
      }
      //creates JS object with class ids as keys to the items of each class
      const cte=`[${prop.name}_cte] AS (
        SELECT class_${class_id},
               json_object(${concat_strings.join(',')}) [user_${prop.name}]
        FROM ${junct_string}
        GROUP BY class_${class_id}
      )`;

      const join=`LEFT JOIN [${prop.name}_cte] ON [${prop.name}_cte].class_${class_id} = ${class_string}.system_id`;

      const selection=`[${prop.name}_cte].[user_${prop.name}]`;

      cte_strings.push(cte);
      relation_selections.push(selection);
      joins.push(join);
    }

    // let groupby=`GROUP BY ${class_string}.system_id ORDER BY ${class_string}.system_order`;

    let orderby=`ORDER BY ${class_string}.system_order`;

    let query=`
    ${cte_strings.length>0?"WITH "+cte_strings.join(','):''}
    SELECT [class_${class_name}].* ${cte_strings.length>0?', '+relation_selections.join(', '):''}
    FROM [class_${class_name}]
    ${joins.join(' ')}
    ${orderby}`;

    let class_data=this.db.prepare(query).all();
    let stringified_properties=class_meta.properties.filter(a=>a.type=='relation'||a.count=='multiple');
    class_data.map(row=>{
      for (let prop of stringified_properties){
        row['user_'+prop.name]=JSON.parse(row['user_'+prop.name]);
      }
    })
    return class_data;

  }

  deleteProperty(class_name,class_id,prop_name){
    let class_meta=JSON.parse(this.run.class_meta.get(class_id).metadata);
    let prop=class_meta.properties.find(a=>a.name==prop_name);

    if(prop.type=='relation'){

      //get junction table
      let junction_id=prop.junction_id;
      let junction_meta=JSON.parse(this.run.junction_meta.get(junction_id).metadata);
      //loop through junction table to remove prop definition from all participating properties
      //IN THE FUTURE: will need to instead allow you to keep other properties and just delink them
      for (var participant of junction_meta.participants) {
        if(participant.prop_name){
          //retrieve class meta
          let participant_meta=JSON.parse(this.run.class_meta.get(participant.class_id).metadata);
          //delete definition from all linked participants
          this.deletePropertyDefinition(participant.class_id,participant_meta,participant.prop_name);
        }
      }

      //delete junction table
      this.db.prepare(`DROP TABLE IF EXISTS [junction_${junction_id}]`).run();

      //delete junction row from junction list
      this.db.prepare(`DELETE FROM system_junctionlist WHERE id=${junction_id}`).run();

    }else{
      console.log(prop_name,'is a data prop')
    }


  }

  deletePropertyDefinition(class_id,class_meta,prop_name){

    //remove prop from array
    let removeIndex=class_meta.properties.findIndex(a=>a.name==prop_name);
    class_meta.properties.splice(removeIndex,1);

    //stringify and save back to class meta
    this.db.prepare(`UPDATE system_classlist set metadata = '${JSON.stringify(class_meta)}' WHERE id = ${class_id}`).run();
  }


  retrieveClass(class_name,class_id,class_meta){
    class_meta=class_meta?class_meta:JSON.parse(this.run.class_meta.get(class_id).metadata);
    const class_string=`[class_${class_name}]`;
    const joins=[];
    const relation_selects=[];
    let groupby=`GROUP BY ${class_string}.system_id ORDER BY ${class_string}.system_order`;

    let relation_properties=class_meta.properties.filter(a=>a.type=='relation');

    for (let prop of relation_properties){

      let junct_string=`junction_${prop.junction_id}`;
      const concat_strings=[];
      for(let target of prop.targets){
        concat_strings.push(
          `'"${target.class_id}": [' || group_concat(DISTINCT ${junct_string}.class_${target.class_id}) || ']'`
        )
      }
      const substring=`'{' || ${concat_strings.join(` || ',' || `)} || '}' as "user_${prop.name}"`;
      relation_selects.push(substring);
      joins.push(`LEFT JOIN ${junct_string} ON ${class_string}.system_id = ${junct_string}.class_${class_id}`);
    }

    let command_string=`SELECT [class_${class_name}].* ${relation_selects.length>0?', '+relation_selects.join(', '):''} FROM [class_${class_name}] ${joins.join(' ')} ${groupby}`;
    let class_data=this.db.prepare(command_string).all();

    let stringified_properties=class_meta.properties.filter(a=>a.type=='relation'||a.count=='multiple');
    class_data.map(row=>{
      for (let prop of stringified_properties){
        row['user_'+prop.name]=JSON.parse(row['user_'+prop.name]);
      }
    })
    return class_data;

    // return this.db.prepare(command_string).all();
  }

  retrieveAllClasses(){
    const classes=this.db.prepare(`SELECT name, id, metadata FROM system_classlist`).all();

    for(let cls of classes){
      cls.metadata=JSON.parse(cls.metadata);
      // cls.objects=this.retrieveClass(cls.name,cls.id,cls.metadata);
      cls.objects=this.retrieveClassUpdated(cls.name,cls.id,cls.metadata);
    }

    return classes;

    //get list of all classes with their name, id, and metadata from system_classlist
    //loops through list, calls retrieveClass, pushes to class data array
    //returns array
  }

  updateDataProp(object_id,class_name,prop_name,new_value,stringify,prop_type){
    let value=stringify?JSON.stringify(new_value):new_value;
    value=this.text_datatypes.includes(prop_type)?`'${value}'`:value;
    this.db.prepare(`UPDATE [class_${class_name}] set user_${prop_name} = ${value} WHERE system_id = ${object_id}`).run();
    return this.db.prepare(`SELECT user_${prop_name} FROM [class_${class_name}] WHERE system_id = ${object_id}`).get();
  }

  updateClassMeta(class_id,content){
    this.db.prepare(`UPDATE system_classlist set metadata = '${content}' WHERE id = ${class_id}`).run();
  }

  async updateRelation(action,class1_id,object1_id,class2_id,object2_id,junction_id){
    if(action=='add'){
      let result=await this.db.prepare(`INSERT INTO junction_${junction_id} (class_${class1_id}, class_${class2_id}) VALUES (${object1_id},${object2_id})`).run();
      console.log(result);
    }else{
      let result=await this.db.prepare(`DELETE FROM junction_${junction_id} WHERE class_${class1_id}=${object1_id} AND class_${class2_id}=${object2_id}`).run();
      console.log(result);
    }
    console.log('done updating');
    // this.db.prepare(`UPDATE [junction_${junction_id}] set user_${prop_name} = '${value}' WHERE system_id = ${object_id}`).run();
  }

  async customRemoveRelation(){
    let classes=this.db.prepare(`SELECT name, id, metadata FROM system_classlist`).all();

    for(let cls of classes){
      cls.metadata=JSON.parse(cls.metadata);
      let jIndex=cls.metadata.properties.findIndex(a=>a.type=='relation'&&a.junction_id==2);
      if(jIndex>=0){
        cls.metadata.properties.splice(jIndex,1);
      }
      // console.log(cls.metadata.properties);
      await this.db.prepare(`UPDATE system_classlist set metadata = '${JSON.stringify(cls.metadata)}' WHERE id = ${cls.id}`).run();
      // cls.objects=this.retrieveClass(cls.name,cls.id,cls.metadata);
    }

    // let class_meta=JSON.parse(this.db.prepare(`SELECT metadata FROM system_classlist WHERE id = ${class_id}`).get().metadata);



    // this.db.prepare(`DROP TABLE IF EXISTS junction_2`).run();
    // this.db.prepare(`DELETE FROM system_junctionlist WHERE id=2`).run();
  }

  customImport(items,class_id,class_name){
    // if(this.db.prepare(`SELECT name FROM system_classlist WHERE name='base'`).get()){
    //   this.dropClass('base','1');
    //   console.log('dropped base');
    // }
    this.dropClass('base','1');

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
            if(relation.length>0){
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
      }
      //add main item to class table with data columns, order and root id
      this.db.prepare(`INSERT INTO [class_${class_name}] (system_id,system_order,${columns.join(',')}) VALUES (${root_id},${new_order},${values.join(',')})`).run();


    }



  }

}

export default Project;
