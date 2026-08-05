/**
 * =====================================================
 * QRE EXPERIENCE DIRECTION EXTRACTOR
 * =====================================================
 *
 * Blueprint
 *      ↓
 * Experience Direction
 *
 *
 * Extracts semantic creative signals.
 *
 * Does not invent creative decisions.
 *
 * =====================================================
 */


import type {

 ExperienceBlueprint,

} from "@qre/contracts";


export type ExperienceDirection = {

title:string;

atmosphere:string[];

pacing:string;

moments:{
  index:number;
  purpose:string;
  meaning:string;
}[];

sensory:string[];

interactions:string[];

themes:string[];

transformation:string[];

};







export function directExperience(

 blueprint:ExperienceBlueprint

):ExperienceDirection {



const themes =

 blueprint.metadata?.themes

 ??

 [];




const dna =

 blueprint.metadata?.dna

 ??

 [];




const emotions =

 blueprint.tone

 ??

 [];




const transformation =

 blueprint.meaning.desiredFeeling

 ??

 [];






return {


title:

 blueprint.title,



atmosphere:

 [

  ...new Set([

   ...themes,

   ...dna,

   ...emotions

  ])

 ],




pacing:

 "",

moments:

 blueprint.moments.map(

  (moment,index)=>({

    index,

    purpose:
      moment.type,

    meaning:
      moment.description ?? ""

  })

),

sensory:

 [],


interactions:

 [],


themes,

transformation,


};

}


export const experienceDirector =

directExperience;