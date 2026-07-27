/**
 * =====================================================
 * QRE EXPERIENCE DIRECTOR
 * =====================================================
 *
 * Blueprint
 *      ↓
 * Creative Direction
 *      ↓
 * Cinematic Intent
 *
 * Decides:
 *
 * - emotional arc
 * - pacing
 * - atmosphere
 * - scene intention
 *
 * NO DATABASE
 * NO EXECUTION
 * NO PLAYER LOGIC
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

  emotionalArc:{
    phase:string;
    emotion:string[];
    intention:string;
  }[];

  sensory:string[];

  interactions:string[];

};



export function directExperience(

 blueprint:ExperienceBlueprint

):ExperienceDirection {


const emotions =
 blueprint.tone
 ?? [];



return {


title:

 blueprint.title,



atmosphere:

 [
  ...new Set([
    ...emotions,
    ...(blueprint.metadata?.dna ?? [])
  ])
 ],



pacing:

 emotions.includes("cinematic")

 ?

 "slow reveal"

 :

 "adaptive",



emotionalArc:


[

 {
  phase:"arrival",

  emotion:[
   emotions[0] ?? "curiosity"
  ],

  intention:
   "introduce the participant into the experience"
 },


 {
  phase:"discovery",

  emotion:[
   emotions[1] ?? "wonder"
  ],

  intention:
   "reveal deeper meaning"
 },


 {
  phase:"connection",

  emotion:[
   "connection"
  ],

  intention:
   "create human interaction"
 },


 {
  phase:"return",

  emotion:[
   "reflection"
  ],

  intention:
   "leave lasting meaning"
 }

],



sensory:

 blueprint.metadata?.dna
 ?.filter(
  dna =>
   dna.includes("visual") ||
   dna.includes("audio") ||
   dna.includes("cinematic")
 )
 ??
 [],



interactions:

 [

  "explore",

  "discover",

  "participate"

 ]


};


}



export const experienceDirector =
directExperience;