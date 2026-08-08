/**
 * =====================================================
 * QRE SERVICE WORLD COMPILER
 * =====================================================
 *
 * Human Need
 *      ↓
 * Service Meaning
 *      ↓
 * Relationship Experience
 *
 * Semantic service intelligence.
 *
 * NO DATABASE
 * NO RUNTIME
 * NO INDUSTRY TEMPLATES
 *
 * =====================================================
 */


import type {
  ServiceExperience
} from "./serviceTypes.js";




function extractSignals(
  prompt:string
):string[] {


 return prompt

  .toLowerCase()

  .split(/\s+/)

  .filter(

    word => word.length > 3

  );

}





function inferServicePurpose(

 signals:string[]

):string {


 if(
   signals.includes("remember")
   ||
   signals.includes("memory")
 ){

   return "preserve meaningful human moments";

 }



 if(
   signals.includes("help")
   ||
   signals.includes("care")
 ){

   return "create trust through meaningful support";

 }



 if(
   signals.includes("experience")
   ||
   signals.includes("event")
 ){

   return "create an emotionally significant interaction";

 }



 return "transform a human need into meaningful value";

}





function inferRelationshipGoals(

 signals:string[]

):string[] {


 const goals = new Set<string>();


 goals.add(
  "trust"
 );


 goals.add(
  "connection"
 );



 if(
  signals.includes("repeat")
  ||
  signals.includes("return")
 ){

  goals.add(
   "long_term_relationship"
  );

 }



 if(
  signals.includes("community")
 ){

  goals.add(
   "belonging"
  );

 }



 return [

  ...goals

 ];

}





function inferServiceMoments(

 purpose:string

):string[] {


 return [


  "need_recognition",


  "relationship_beginning",


  "service_transformation",


  "meaning_created",


  "future_connection"


 ];

}





export function compileServiceExperience(

 input:{

  prompt:string;

  entities?:any;

  meaning?:any;

 }

):ServiceExperience {


 if(!input.prompt.trim()){

  throw new Error(

   "Service experience requires meaning."

  );

 }



 const signals =

  extractSignals(

   input.prompt

  );





 return {


  name:

    input.entities?.organizations?.[0]

    ??

    "Emergent Service Experience",




  category:

    "semantic_service_world",




  purpose:

    inferServicePurpose(

      signals

    ),




  customerNeed:

    input.meaning?.why?.[0]

    ??

    "A human need seeking resolution and meaning.",




  serviceMoments:

    inferServiceMoments(

      input.prompt

    ),




  relationshipGoals:

    inferRelationshipGoals(

      signals

    )


 };


}



export const serviceCompiler =

compileServiceExperience;