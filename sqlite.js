import Database from 'better-sqlite3';
// require Database from 'better-sqlite3';
// require('better-sqlite3');

//a function that initializes a new project, for the moment in memory



class Project{
  constructor(source){
    // ':memory:'
    this.db= new Database(source);
    //needs to create a hidden table to contain all objects entered. All objects will be represented and referenced from here, whatever their class may be
      // needs columns: UUID
    this.createTable('system','root',['id INTEGER NOT NULL PRIMARY KEY']);
    this.db.prepare('INSERT INTO system_root VALUES (null)').run();
    this.db.prepare('INSERT INTO system_root VALUES (null)').run();
;



    let print_tests=[
      this.db.prepare('SELECT name FROM sqlite_schema').get(),
      this.db.prepare('SELECT * FROM system_root').all()
    ]
    console.log(print_tests);
    //also needs to create a base class (table) for the user to work with
  }

  //not sure if prepared statements will be useful but leaving a note in case
  preparedUniversals(){
    // const stmts=[
    //   ['get-tables','.tables'];
    // ]

  }

  createTable(type,name,columns){
    //type will pass in 'class' or 'system' to use as a name prefix

    //column format:
    //'PRIMARY '

    let column_string=columns.join(',');
    let command_string=`CREATE TABLE ${type}_${name}(
      ${column_string}
    )`;
    let stmt=this.db.prepare(command_string);
    const info=stmt.run();
    console.log(info);

  }


}

const project=new Project(':memory:');
