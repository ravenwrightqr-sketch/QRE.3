/**
 * =====================================================
 * QRE EXPERIENCE WORLD COMPOSER
 * =====================================================
 *
 * Genome
 *   ↓
 * World
 *
 * The emotional universe.
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  ExperienceGenome,
  ExperienceWorld,
  ExperienceJourney,
  ExperienceArchetype,
} from "@qre/contracts";


import {
  resolveWorldDomain
} from "./worldDomain.js";






export function composeWorld(

 genome:ExperienceGenome

):ExperienceWorld {



const domain =

 resolveWorldDomain(
  genome
 );





return {


domain,



archetype:

 resolveArchetype(
  genome
 ),



atmosphere:

 resolveAtmosphere(
  genome
 ),



journey:

 resolveJourney(
  genome
 ),



atoms:

 resolveAtoms(
  genome
 ),



themes:

 genome.themes,


};



}









function resolveArchetype(

 genome:ExperienceGenome

):ExperienceArchetype {


if(
 genome.memory >= .8
){

 return "memory_replay";

}



if(
 genome.immersion >= .8
){

 return "cinematic_story";

}



if(
 genome.discovery >= .8
){

 return "discovery";

}



if(
 genome.commerce >= .8
){

 return "brand_experience";

}



if(
 genome.themes.includes("culture")
){

 return "event";

}



if(
 genome.themes.includes("connection")
){

 return "relationship";

}



return "cinematic_story";


}









function resolveAtmosphere(

 genome:ExperienceGenome

):string[] {


return [

 genome.energy,

 ...genome.emotions,

]

.filter(Boolean)

.filter(

(value,index,array)=>

array.indexOf(value)===index

);


}









function resolveJourney(

 genome:ExperienceGenome

):ExperienceJourney[] {


const journey:ExperienceJourney[] = [


"arrival",


"discovery",


"reveal"


];



if(
 genome.memory >= .5
){

 journey.push(
  "memory"
 );

}



if(
 genome.interaction >= .5
){

 journey.push(
  "peak"
 );

}



journey.push(

"share",

"return"

);



return journey;


}









function resolveAtoms(

 genome:ExperienceGenome

):string[] {


const atoms:string[] = [


"identity",


"story"


];



if(

 genome.entities.people.length ||

 genome.entities.places.length

){

 atoms.push(
  "location"
 );

}



if(

 genome.entities.media.length

){

 atoms.push(
  "media"
 );

}



if(

 genome.immersion >= .5

){

 atoms.push(
  "audio"
 );

}



if(

 genome.discovery >= .5

){

 atoms.push(
  "interaction"
 );

}



if(

 genome.replay >= .5

){

 atoms.push(
  "replay"
 );

}



return [

 ...new Set(atoms)

];


}