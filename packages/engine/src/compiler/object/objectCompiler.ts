/**
 * =====================================================
 * QRE OBJECT GENOME COMPILER
 * =====================================================
 *
 * Semantic Object Intelligence Layer.
 *
 * Meaning Signals
 *        ↓
 * Object Identity
 *        ↓
 * Relationships
 *        ↓
 * Moments
 *        ↓
 * Memory
 *        ↓
 * Legacy
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


import type {

  ObjectCompilationInput

} from "./objectTypes.js";


import type {

 ObjectGenome,
 ObjectMoment,
 ObjectRelationship

} from "@qre/contracts";







function unique(

 values:string[] = []

):string[] {


 return [

  ...new Set(

   values.filter(Boolean)

  )

 ];

}








function inferObjectNature(

 input:ObjectCompilationInput

):string[] {


 return unique([


  ...(input.meaning?.desiredFeeling ?? []),


  ...(input.meaning?.symbols ?? []),


  ...(input.meaning?.themes ?? []),


  ...(input.emotions?.emotions ?? []),


  ...(input.dna?.traits ?? [])


 ]);

}








function resolveObjectType(

 input:ObjectCompilationInput

):string {


 const text =

  input.prompt.toLowerCase();



 if(

  text.includes("dog") ||

  text.includes("cat") ||

  text.includes("pet")

 ){

  return "living_being";

 }



 if(

  text.includes("brand") ||

  text.includes("business") ||

  text.includes("product")

 ){

  return "identity_object";

 }



 if(

  text.includes("memory") ||

  text.includes("gift") ||

  text.includes("heirloom")

 ){

  return "symbolic_object";

 }



 return "experience_object";


}








function buildMoments(

 input:ObjectCompilationInput

):ObjectMoment[]{


 const moments:ObjectMoment[] = [];



 const emotions =

  input.emotions?.emotions ?? [];





 if(emotions.length){


  moments.push({

   id:

    crypto.randomUUID(),


   title:

    "Emotional significance",


   description:

    "An object carrying emotional meaning.",


   participants:

    input.entities?.people ?? [],


   emotions,


   significance:

    .8

  });


 }





 if(

  input.memory?.memories?.length

 ){


  moments.push({

   id:

    crypto.randomUUID(),


   title:

    "Memory connection",


   description:

    "A preserved relationship between object and experience.",


   participants:

    input.entities?.people ?? [],


   emotions:

    emotions.length
    ?
    emotions
    :
    ["reflection"],


   significance:

    .9

  });


 }



 return moments;


}








function buildRelationships(

 input:ObjectCompilationInput

):ObjectRelationship[]{


 return (

  input.relationships ?? []

 )

 .map(

  relation => ({


   subject:

    relation.subject
    ??
    "unknown",



   relationship:

    "connected_to",



   object:

    relation.object
    ??
    "unknown",



   confidence:

    relation.confidence
    ??
    .5


  })

 );


}








export function compileObjectGenome(

 input:ObjectCompilationInput

):ObjectGenome {



 if(!input){

  throw new Error(
   "Object genome input required."
  );

 }



 const attributes =

  inferObjectNature(
   input
  );





 return {


  identity:{


   name:

    input.entities?.objects?.[0]
    ??
    input.entities?.products?.[0],



   type:

    resolveObjectType(
     input
    ),



   category:

    attributes,


   attributes


  },



  history:{


   origin:

    input.prompt,


   timeline:[],


   importantMoments:

    input.memory?.memories
    ??
    []


  },



  relationships:

   buildRelationships(
    input
   ),



  moments:

   buildMoments(
    input
   ),



  memory:{


   memories:

    input.memory?.memories
    ??
    [],



   emotionalMarkers:

    input.emotions?.emotions
    ??
    [],



   locations:[],


   dates:[]


  },



  legacy:{


   meaning:

    input.meaning?.symbols
    ??
    [],



   impact:

    input.dna?.traits
    ??
    [],



   preservation:

    input.memory?.timeCapsule

    ?

    ["preserved_memory"]

    :

    []


  },



  emotionalSignature:

   input.emotions?.emotions
   ??
   [],



  symbolicMeaning:

   input.meaning?.symbols
   ??
   [],



  futurePossibilities:[

   "future meaning evolution",

   "continued relationship development"

  ]


 };


}







export const objectCompiler =

compileObjectGenome;