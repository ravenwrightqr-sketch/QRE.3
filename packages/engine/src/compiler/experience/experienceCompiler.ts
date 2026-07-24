/**
 * =====================================================
 * QRE EXPERIENCE COMPILER
 * =====================================================
 *
 * Experience Genome
 *        ↓
 * Experience Blueprint
 *
 * Converts creative DNA into composed experience structure.
 *
 * NO DATABASE
 * NO EXECUTION
 * NO PLAYER LOGIC
 *
 * =====================================================
 */


import type {

  ExperienceGenome,
  ExperienceBlueprint,
  ExperienceMoment,
  ExperienceType,
  ExperienceTone,

} from "@qre/contracts";



import {

  compileScenes,

} from "./sceneCompiler.js";



import type {

  ExperienceScene,

} from "./experienceTypes.js";






function resolveType(

): ExperienceType {


return "story" as ExperienceType;


}






function resolveTone(

 genome:ExperienceGenome

):readonly ExperienceTone[] {


return genome.emotions.map(

 emotion => emotion as ExperienceTone

);


}






function sceneToMoment(

 scene:ExperienceScene,

 index:number

):ExperienceMoment {


return {


type:

 scene.type as any,



component:

 "story",



title:

 scene.title,



subtitle:

 undefined,



description:

 scene.emotionalIntent,



editable:

 true,



demo:

 false,



order:

 index,



payload: {


  sceneId:

    scene.id,


  atmosphere:

    scene.atmosphere,


  duration:

    scene.duration


}


};


}







function compileMoments(

 genome:ExperienceGenome

):ExperienceMoment[] {


return compileScenes(
 genome
).map(

(scene,index)=>

sceneToMoment(
 scene,
 index
)

);


}









export function compileExperience(

 genome:ExperienceGenome

):ExperienceBlueprint {


if(
 !genome
){

throw new Error(

"Cannot compile experience without genome"

);

}



return {


title:

 genome.meaning.why,



type:

 resolveType(),



tone:

 resolveTone(
  genome
 ),



meaning:

 genome.meaning,



moments:

 compileMoments(
  genome
 ),



entities:

 genome.entities,



metadata:{


archetypes:

 genome.archetypes,


themes:

 genome.themes,


dna:

 genome.dna


}


};


}






export const experienceCompiler =

compileExperience;