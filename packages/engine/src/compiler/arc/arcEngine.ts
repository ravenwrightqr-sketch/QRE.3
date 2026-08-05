/**
 * =====================================================
 * QRE EXPERIENCE ARC ENGINE
 * =====================================================
 *
 * Converts meaning into emotional progression.
 *
 * =====================================================
 */
import type {
 ExperienceArc,
 ExperiencePhase
} from "@qre/contracts";



export function createExperienceArc(

 input:{

  emotions:string[];

  dna:string[];

  meaning:string[];

 }

):ExperienceArc {


const experiencePhases:ExperienceArc["phases"] = [

 "arrival",

 "curiosity",

 "discovery",

 "reveal"

];



if(

 input.dna.includes(
  "transformation"
 )

){

 experiencePhases.push(
  "transformation"
 );

}



experiencePhases.push(
 "memory"
);





const emotionalCurve = [

 input.emotions[0] ?? "curiosity",

 "wonder",

 "connection",

 "meaning"

];





let pacing:

ExperienceArc["pacing"] =

 "medium";



if(

 input.dna.includes(
  "cinematic"
 )

){

 pacing =
  "slow";

}



if(

 input.dna.includes(
  "interactive"
 )

){

 pacing =
  "fast";

}

return {

 phases:
  experiencePhases,


 emotionalCurve,


 peakMoment:
  "reveal",


 chapters:[

  {
   title:"Arrival",
   purpose:"Introduce the subject and create curiosity.",
   emotion:
    input.emotions[0] ?? "curiosity",
   reveal:
    "Something meaningful exists beneath the surface."
  },

  {
   title:"Discovery",
   purpose:"Reveal hidden meaning and connection.",
   emotion:"wonder",
   reveal:
    "The experience contains a deeper history."
  },

  {
   title:"Memory",
   purpose:"Create lasting emotional attachment.",
   emotion:"connection",
   reveal:
    "The moment becomes personally significant."
  }

 ],


 journeyQuestion:
  "What deeper meaning is waiting to be discovered?",


 transformation:{

  before:
   "An ordinary moment waiting for meaning",

  after:
   input.meaning[0]
   ??
   "create deeper meaning"

 },


 memoryImprint:

  "the experience becomes personally significant",


 pacing,


 confidence:

 0.8

};




}