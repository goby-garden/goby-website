
class Ontology{
  'use strict';
  constructor() {
    this.data={
      objects:[],
      properties:[],
      roles:[],
      rules:[]
    }
    this.idcount=0;
  }

  //necessary functionality on API end:
    //define:
      // properties
      // roles, either brand-new or extending existing roles
      // rulesets

    //add:
      // objects to roles (new column)
      // properties to roles (new row)
      // individual connections of objects to other objects

    //modify:
      // property properties (ha)
      // object properties

    //resolve:
      //conflict when you modify a property in a way that conflicts with the data it holds



  //necessary functionality on DOM end:
    //pull inputs from DOM fields
    //add corresponding property to define when you select reciprocal relation


  dubThee(){
    this.count++;
    return this.count;
  }







}


// declareProperty(name,type,options){
//
//   let property={
//     name:name,
//     type:type,
//     id:this.dubThee(),
//     default:options&&options.default?options.default:false
//   }
//
//   switch(type){
//     case 'relation':
//     property.subtype=options&&options.subtype?options.subtype:'asym';
//     property.filter=options&&options.filter?options.filter:false;
//     break;
//     case 'data':
//     property.subtype=options&&options.subtype?options.subtype:'string';
//     property.formula=options&&options.formula?options.formula:false;
//     break;
//     default:
//     console.log('error - type incorrectly specified');
//   }
//
//   this.data.properties.push(property);
//   return property;
//
// }
//
// let tester=new Ontology();
// let propTest=tester.declareProperty("author", "relation", {subtype:"linked",filter:"...",default:"12"})
// console.log(propTest);
//
// let sampleRelationArg=[
//   "author", //name
//   "relation",//type
//   {
//     subtype:"linked",
//     filter:"...",
//     default:"12" //object ID #
//   }//type-specific options
// ];
//
// let sampleDataArg=[
//   "publish-year", //name
//   "data",//type
//   {
//     type:"number",
//     formula:"...",
//     default:1950
//   }//type-specific options
// ]
