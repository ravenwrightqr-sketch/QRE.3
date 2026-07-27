/**
 * =====================================================
 * QRE NUVO FIELD
 * =====================================================
 *
 * The emergence layer.
 *
 * Genome describes meaning.
 *
 * NUVO describes becoming.
 *
 * It discovers:
 *
 * - latent potential
 * - emotional evolution
 * - transformation paths
 * - future states
 *
 * NO DATABASE.
 * NO EXECUTION.
 * NO INDUSTRY LOGIC.
 *
 * =====================================================
 */

import type {
  ExperienceGenome,
} from "@qre/contracts";


export interface NuvoField {

  originPatterns:
    string[];


  emergencePatterns:
    string[];


  hiddenForces:
    string[];


  transformationPaths:
    string[];


  resonance:
    number;

}



export function awakenNuvo(

  genome:ExperienceGenome

):NuvoField {


const originPatterns =
[
  ...genome.archetypes,
  ...genome.emotions
];



const emergencePatterns =
[
  ...genome.dna,
  ...genome.themes
];



const hiddenForces =
[
  ...genome.meaning.desiredFeeling,
  ...genome.meaning.memories
];



const transformationPaths:string[] = [];



if(
 genome.memory === 1
){

 transformationPaths.push(
   "moment_to_story"
 );

}



if(
 genome.replay === 1
){

 transformationPaths.push(
   "story_to_return"
 );

}



if(
 genome.social === "community"
){

 transformationPaths.push(
   "individual_to_collective"
 );

}



return {

 originPatterns,

 emergencePatterns,

 hiddenForces,

 transformationPaths,

 resonance:

 Math.min(
   1,
   (
    genome.discovery +
    genome.memory +
    genome.immersion
   ) / 3
 )

};


}