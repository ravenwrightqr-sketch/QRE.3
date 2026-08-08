/**
 * =====================================================
 * QRE CREATIVE DECISION ENGINE
 * =====================================================
 *
 * The creative director layer.
 *
 * It decides what deserves attention.
 *
 * =====================================================
 */


import type {

  CreativeDecision

} from "./decisionTypes.js";



export function makeCreativeDecision(

 input:{

  concepts:string[];

  emotions:string[];

  memories:string[];

  dna:string[];

 }

):CreativeDecision {



const primaryMeaning =

 input.concepts[0]

 ??

 "human expression";





const emotionalPriority =

 [

  ...input.emotions

 ]

 .slice(

  0,

  3

 );





const memoryPriority =

 [

  ...input.memories

 ]

 .slice(

  0,

  3

 );





const scenePriorities:string[] = [];



if(

 input.dna.includes(
  "cinematic"
 )

){

 scenePriorities.push(

  "visual_reveal"

 );

}



if(

 input.dna.includes(
  "memory_driven"
 )

){

 scenePriorities.push(

  "emotional_return"

 );

}



if(

 input.dna.includes(
  "human_connection"
 )

){

 scenePriorities.push(

  "relationship_moment"

 );

}





return {


 primaryMeaning,


 emotionalPriority,


 memoryPriority,


 scenePriorities,



 rejectedPaths:[

  "generic_content",

  "surface_information",

  "empty_interaction"

 ],



 creativeDirection:

 `${primaryMeaning} should be experienced through emotional transformation.`,



 confidence:

 0.75


};



}