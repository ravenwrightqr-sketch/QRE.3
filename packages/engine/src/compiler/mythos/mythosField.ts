/**
 * =====================================================
 * QRE MYTHOS FIELD
 * =====================================================
 *
 * NOVA
 *   ↓
 * MYTHOS
 *
 * Converts creative intelligence into
 * narrative possibility.
 *
 * No templates.
 * No industry logic.
 *
 * Discovers:
 *
 * - story identity
 * - narrative movement
 * - scene potential
 * - emotional direction
 *
 * No database.
 * No runtime.
 *
 * =====================================================
 */


import type {
  NovaField,
} from "../nova/index.js";





export interface MythosField {


  title:string;


  premise:string;


  meaningTrajectory:string[];


  emotionalIntent:string;


  sceneSeeds:string[];


}







function createTitle(

 nova:NovaField

):string {


 const gravity =

  nova.creativeGravity;


 if(gravity){

  return gravity
   .replaceAll("→"," ")
   .trim();

 }


 return "Emergent Experience";


}








function createPremise(

 nova:NovaField

):string {


 return (

  `An experience emerges from ${nova.creativeGravity}.`

 );


}







function createNarrativeArc(

 nova:NovaField

):string[]{


 return [

  "initial resonance",

  "meaning discovery",

  "creative transformation",

  "lasting significance",

  ...nova.creativeTensions

 ];


}







function createSceneSeeds(

 nova:NovaField

):string[]{


 return [

  "the first encounter with meaning",

  "the hidden pattern becoming visible",

  "the moment of transformation",

  "the reflection after experience",

  ...nova.vectors

 ];


}







export function awakenMythos(

 nova:NovaField

):MythosField {


 if(!nova){

  throw new Error(
   "Nova field required."
  );

 }



 return {


  title:

   createTitle(
    nova
   ),



  premise:

   createPremise(
    nova
   ),



  meaningTrajectory:

   createNarrativeArc(
    nova
   ),



  emotionalIntent:

   nova.creativeGravity,



  sceneSeeds:

   createSceneSeeds(
    nova
   )


 };


}







export const mythosField =

awakenMythos;