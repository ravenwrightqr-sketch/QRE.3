/**
 * =====================================================
 * QRE LIFECYCLE INTELLIGENCE COMPILER
 * =====================================================
 *
 * ROLE:
 *
 * Converts semantic understanding into
 * a temporal identity model.
 *
 *
 * Meaning
 *      ↓
 * Entity
 *      ↓
 * Object Genome
 *      ↓
 * Lifecycle
 *
 *
 * Anything valuable has a timeline:
 *
 * pet
 * object
 * home
 * relationship
 * product
 * business
 *
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


import type {

 ExperienceLifecycle,
 LifecycleStage,
 LifecycleEvent

} from "@qre/contracts";




type LifecycleInput = {

 prompt:string;

 memory?:{

  timeCapsule?:boolean;

  replay?:boolean;

  memories?:string[];

 };


 entities?:{

  objects?:string[];

  creatures?:string[];

  people?:string[];

  places?:string[];

 };


 relationships?:unknown[];


 world?:{

  domains?:string[];

 };


};





function resolveStage(

 input:LifecycleInput

):LifecycleStage {


 if(

  input.memory?.timeCapsule

 ){

  return "legacy";

 }


 if(

  input.relationships &&
  input.relationships.length > 0

 ){

  return "relationship";

 }


 if(

  input.entities?.objects?.length

 ){

  return "acquisition";

 }


 return "creation";

}





function buildEvents(

 input:LifecycleInput

):LifecycleEvent[]{


 const events:LifecycleEvent[]=[];



 if(

  input.entities?.creatures?.length

 ){

  events.push({

   stage:"origin",

   description:

   "Living identity entered the human experience.",

   significance:.9

  });

 }



 if(

  input.entities?.objects?.length

 ){

  events.push({

   stage:"acquisition",

   description:

   "Object became part of human ownership and meaning.",

   significance:.7

  });

 }



 if(

  input.memory?.memories?.length

 ){

  events.push({

   stage:"relationship",

   description:

   "Meaningful memories accumulated through experience.",

   significance:.9

  });

 }



 return events;

}





function buildFuture(

 input:LifecycleInput

):string[]{


 const future = new Set<string>();


 future.add(
  "meaning_evolution"
 );


 future.add(
  "future_memory_creation"
 );


 if(

  input.memory?.replay

 ){

  future.add(
   "memory_replay"
  );

 }


 if(

  input.entities?.creatures?.length

 ){

  future.add(
   "lifelong_relationship"
  );

 }


 if(

  input.entities?.objects?.length

 ){

  future.add(
   "ownership_history"
  );

 }


 return [

  ...future

 ];

}







export function compileLifecycle(

 input:LifecycleInput

):ExperienceLifecycle {



 if(!input){

  throw new Error(
   "Lifecycle input required."
  );

 }



 return {


  currentStage:

   resolveStage(
    input
   ),



  events:

   buildEvents(
    input
   ),



  milestones:[],



  futurePossibilities:

   buildFuture(
    input
   )


 };

}



export const lifecycleCompiler =
compileLifecycle;