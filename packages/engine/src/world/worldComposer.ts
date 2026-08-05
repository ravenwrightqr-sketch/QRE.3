/**
 * =====================================================
 * QRE EXPERIENCE WORLD COMPOSER
 * =====================================================
 *
 * Genome
 *   ↓
 * World Intelligence
 *   ↓
 * Experience World
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
  WorldRole,
  WorldSignature,
  WorldTransformation,
  WorldIdentity,
  WorldLaw,
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



const archetype =

resolveArchetype(
 genome
 );



const role =

resolveWorldRole(
 genome
 );


const signature =

resolveSignature(
 genome
 );


const purpose =

resolvePurpose(
 genome
 );


const worldIdentity =

resolveWorldIdentity(
 genome
 );
 const worldLaws =

resolveWorldLaws(
  genome
);


const emotionalPhysics =

resolveEmotionalPhysics(
  genome
);


const sensoryLanguage =

resolveSensoryLanguage(
  genome
);


const transformation =

resolveTransformation(
  genome
);


const journey =

resolveJourney(
  genome,
  domain
);


const atoms =

resolveAtoms(
  genome,
  domain
);


const themes =

[
 ...new Set([

  ...genome.themes,

  domain

 ])

];


const connectedWorlds =

genome.worlds.filter(

 world =>

 world !== domain

);



return {


domain,


archetype,


role,


purpose,


worldIdentity,


worldLaws,


signature,


emotionalPhysics,


sensoryLanguage,


transformation,


journey,


atoms,


themes,


connectedWorlds,



artifacts:[

 {

  world:domain,

  moments:[],


  metadata:{

   archetype,

   role,

   signature,

   purpose,

   worldIdentity,

   worldLaws,

   emotionalPhysics,

   sensoryLanguage,

   transformation

  }


 }

]

};


}


/**
 * =====================================================
 *
 * ARCHETYPE INTELLIGENCE
 *
 * =====================================================
 */


function resolveArchetype(

 genome:ExperienceGenome

):ExperienceArchetype {



if(
 genome.memory >= .8
){

return "ancestral_legacy";

}


if(
 genome.replay >= .7
){

return "memory_archive";

}


if(

 genome.interaction >= .8 &&

 genome.memory >= .5

){

return "personal_transformation";

}


if(

 genome.themes.includes("relationship") ||

 genome.themes.includes("connection")

){

return "relationship_journey";

}


if(

 genome.discovery >= .8

){

return "discovery_adventure";

}


if(

 genome.commerce >= .8

){

return "premium_brand_world";

}


if(

 genome.themes.includes("community")

){

return "community_movement";

}


return "cinematic_story";


}


/**
 * =====================================================
 *
 * WORLD ROLE
 *
 * =====================================================
 */


function resolveWorldRole(

 genome:ExperienceGenome

):WorldRole {



if(

 genome.memory >= .7

){

return "preserve";

}



if(

 genome.interaction >= .7 ||

 genome.themes.includes("connection")

){

return "connect";

}



if(

 genome.discovery >= .7

){

return "discover";

}



if(

 genome.commerce >= .7

){

return "sell";

}



if(

 genome.themes.includes("education")

){

return "teach";

}



return "transform";


}

/**
 * =====================================================
 *
 * PURPOSE
 *
 * =====================================================
 */


function resolvePurpose(

 genome:ExperienceGenome

):string {



if(

 genome.memory >= .7

){

return "Preserve meaningful human moments across generations";

}



if(

 genome.relationships.length

){

return "Create deeper human connection and belonging";

}



if(

 genome.discovery >= .7

){

return "Guide people through discovery and exploration";

}



if(

 genome.commerce >= .7

){

return "Create meaningful interaction between people and brands";

}



return "Create a memorable human experience";


}

/**
 * =====================================================
 *
 * WORLD IDENTITY
 *
 * =====================================================
 */
 function resolveWorldIdentity(

 genome:ExperienceGenome

):WorldIdentity {


const purpose = resolvePurpose(genome);


return {


name:

`${genome.emotions[0] ?? "human"} universe`,



description:

purpose,



philosophy:

genome.memory >= .7

?

"Every object carries a story. Every moment can become legacy."

:

"Every experience transforms the person who enters it.",



origin:

"Created from human meaning, emotion, and experience.",



promise:

purpose,



emotionalCore:

genome.emotions.join(", ") || "human connection",



symbol:

genome.symbols[0] ?? "memory"

};


}

/**
 * =====================================================
 *
 * WORLD LAWS
 *
 * Rules of reality.
 *
 * These are not tags.
 * These are physics.
 *
 * =====================================================
 */
 function resolveWorldLaws(

 genome:ExperienceGenome

):WorldLaw[] {


const laws:WorldLaw[] = [];



if(
 genome.memory >= .5
){

laws.push(

{
 principle:"objects preserve human history",

 reason:"Meaning accumulates through ownership and time.",

 effect:"Objects become emotional anchors and legacy carriers."
},


{
 principle:"time increases emotional value",

 reason:"Repeated human experiences strengthen attachment.",

 effect:"Past moments gain deeper significance."
},


{
 principle:"memories become stronger through replay",

 reason:"Revisiting experiences reinforces emotional connection.",

 effect:"Stories evolve across generations."
}

);

}



if(
 genome.relationships.length
){

laws.push(

{
 principle:"connection creates meaning",

 reason:"Human relationships give experiences purpose.",

 effect:"People feel belonging through shared moments."
},


{
 principle:"people complete the experience",

 reason:"The participant is part of the story.",

 effect:"Experiences become personal rather than passive."
}

);

}



if(
 genome.discovery >= .5
){

laws.push(

{
 principle:"curiosity unlocks progression",

 reason:"Exploration drives engagement.",

 effect:"Discovery reveals new layers of meaning."
},


{
 principle:"discovery rewards exploration",

 reason:"Hidden value encourages participation.",

 effect:"The world expands as users explore."
}

);

}



if(
 genome.interaction >= .5
){

laws.push(

{
 principle:"participation changes the world",

 reason:"Actions influence the experience state.",

 effect:"The universe becomes adaptive."
}

);

}



if(
 genome.replay >= .5
){

laws.push(

{
 principle:"experiences evolve through replay",

 reason:"Each interaction adds history.",

 effect:"The world becomes richer over time."
}

);

}



return laws;

}

/**
 * =====================================================
 *
 * SIGNATURE
 *
 * =====================================================
 */


function resolveSignature(

 genome:ExperienceGenome

):WorldSignature {


return {


semantic:

[
 ...genome.dna,
 ...genome.themes,
 ...genome.symbols

]

.filter(Boolean)

.filter(

(value,index,array)=>

array.indexOf(value)===index

),



emotional:

[
 ...genome.emotions,
 ...genome.tone

]

.filter(Boolean)

.filter(

(value,index,array)=>

array.indexOf(value)===index

),



visual:

genome.sensory.filter(

value =>

value.includes("visual") ||

value.includes("cinematic") ||

value.includes("image")

),



sensory:

genome.sensory.filter(Boolean)

.filter(

(value,index,array)=>

array.indexOf(value)===index

)


};


}


/**
 * =====================================================
 *
 * TRANSFORMATION
 *
 * =====================================================
 */


function resolveTransformation(

 genome:ExperienceGenome

):WorldTransformation {


return {


before:

"An ordinary moment waiting for meaning",



journey:

genome.transformation[0]

??

"Discover deeper human meaning",



after:

"An unforgettable human experience"


};


}

/**
 * =====================================================
 *
 * EMOTIONAL PHYSICS
 *
 * =====================================================
 */


function resolveEmotionalPhysics(

 genome:ExperienceGenome

):string[] {


const physics:string[] = [];



if(

 genome.memory >= .5

){

physics.push(

"objects carry human history",

"time increases emotional value"

);

}



if(

 genome.relationships.length

){

physics.push(

"connection creates meaning"

);

}



if(

 genome.discovery >= .5

){

physics.push(

"curiosity drives progression"

);

}



if(

 genome.transformation.length

){

physics.push(

"experiences create human change"

);

}



return physics;


}

/**
 * =====================================================
 *
 * SENSORY LANGUAGE
 *
 * =====================================================
 */


function resolveSensoryLanguage(

 genome:ExperienceGenome

):string[] {


return [

 ...genome.sensory,


 ...genome.dna.filter(

 value =>

 value.includes("visual") ||

 value.includes("audio") ||

 value.includes("cinematic")

 )

]

.filter(Boolean)

.filter(

(value,index,array)=>

array.indexOf(value)===index

);


}


/**
 * =====================================================
 *
 * JOURNEY
 *
 * =====================================================
 */


function resolveJourney(

 genome:ExperienceGenome,

 domain:string

):ExperienceJourney[] {



const journey:ExperienceJourney[] = [

"arrival",

"discovery",

"reveal"

];



if(

domain === "memory_world"

){

journey.push(

"memory"

);

}



if(

genome.relationships.length

){

journey.push(

"peak"

);

}



if(

genome.interaction >= .5

){

journey.push(

"transformation"

);

}



journey.push(

"share",

"return"

);



return [

...new Set(journey)

];


}

/**
 * =====================================================
 *
 * EXPERIENCE ATOMS
 *
 * =====================================================
 */


function resolveAtoms(

 genome:ExperienceGenome,

 domain:string

):string[] {


const atoms:string[] = [

"identity",

"story"

];



if(genome.object){

atoms.push("object");

}



if(genome.entities.people.length){

atoms.push("person");

}



if(genome.entities.places.length){

atoms.push("place");

}



if(genome.entities.media.length){

atoms.push("media");

}



if(domain === "memory_world"){

atoms.push(

"legacy",

"memory"

);

}



if(genome.immersion >= .5){

atoms.push(

"audio",

"visual"

);

}



if(genome.discovery >= .5){

atoms.push(

"interaction"

);

}



if(genome.replay >= .5){

atoms.push(

"replay"

);

}



return [

...new Set(atoms)

];


}