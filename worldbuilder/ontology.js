
class Ontology{
  'use strict';
  constructor() {
    this.data={
      objects:[],
      properties:[],
      roles:[]
    }
    this.count=0;
  }


  //1. A thing that declares a new property
    //args:
    //name
    //single or multiple
    //relation or data
      //if data:
        //what type of data
        //determination function (returns a value) [optional]
      //if relation:
        //filtering function (iterates on objects and returns true/false) [optional]
        //type of relation (symmetric, asymmetric, linked) [optional, defaults to asymmetric]
    //defaults

  dubThee(){
    this.count++;
    return this.count;
  }


  declareProperty(name,type,options){

    let property={
      name:name,
      type:type,
      id:this.dubThee(),
      default:options&&options.default?options.default:false
    }

    switch(type){
      case 'relation':
      property.subtype=options&&options.subtype?options.subtype:'asym';
      property.filter=options&&options.filter?options.filter:false;
      break;
      case 'data':
      property.subtype=options&&options.subtype?options.subtype:'string';
      property.formula=options&&options.formula?options.formula:false;
      break;
      default:
      console.log('error - type incorrectly specified');
    }

    this.data.properties.push(property);
    return property;

  }




}


let tester=new Ontology();
let propTest=tester.declareProperty("author", "relation", {subtype:"linked",filter:"...",default:"12"})
console.log(propTest);

let sampleRelationArg=[
  "author", //name
  "relation",//type
  {
    subtype:"linked",
    filter:"...",
    default:"12" //object ID #
  }//type-specific options
];

let sampleDataArg=[
  "publish-year", //name
  "data",//type
  {
    type:"number",
    formula:"...",
    default:1950
  }//type-specific options
]
