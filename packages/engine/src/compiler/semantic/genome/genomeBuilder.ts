/**
 * =====================================================
 * QRE EXPERIENCE GENOME BUILDER
 * =====================================================
 *
 * Human Prompt
 *        ↓
 * Semantic Understanding
 *        ↓
 * Experience Genome
 *
 * Genome = Creative DNA
 *
 * The Genome understands:
 *
 * - intent
 * - emotion
 * - meaning
 * - world
 * - journey
 * - experience physics
 *
 * It does NOT know:
 *
 * - industries
 * - templates
 * - products
 * - database
 *
 * =====================================================
 */


import {
  analyzeSemanticPrompt,
} from "../semanticAnalyzer.js";


import {
  extractEntities,
} from "../entityExtractor.js";


import type {

  ExperienceGenome,
  ExperienceMeaning,
  ExperienceRelationship,
  ExperienceJourney,

} from "@qre/contracts";








/**
 * =====================================================
 * MEANING EXTRACTION
 * =====================================================
 */


function buildMeaning(

 semantic:any

):ExperienceMeaning {


return {


why:
semantic.intent,


emotions:
semantic.emotions,


memories:

semantic.themes.includes("memory")

?

[
 "personal memory"
]

:

[],



desiredFeeling:

semantic.emotions,


transformation:

semantic.experienceDNA?.includes(
 "transformation"
)

?

"create change"

:

undefined,


};


}









/**
 * =====================================================
 * EXPERIENCE DNA
 *
 * The creative fingerprint.
 *
 * This replaces templates.
 *
 * =====================================================
 */


function buildDNA(

 semantic:any

):string[] {


const dna = new Set<string>();



dna.add(
 "adaptive"
);



for(
 const value of semantic.experienceDNA ?? []
){

 dna.add(
  value
 );

}



if(
 semantic.emotions.includes("nostalgia")
){

 dna.add(
  "memory_driven"
 );

}



if(
 semantic.themes.includes("discovery")
){

 dna.add(
  "exploration"
 );

}



if(
 semantic.themes.includes("connection")
){

 dna.add(
  "human_connection"
 );

}



if(
 semantic.themes.includes("culture")
){

 dna.add(
  "immersive_culture"
 );

}



return [
 ...dna
];

}










/**
 * =====================================================
 * RELATIONSHIP GRAPH
 *
 * Future semantic graph layer.
 *
 * =====================================================
 */


function buildRelationships(

):ExperienceRelationship[] {


return [];

}









/**
 * =====================================================
 * EXPERIENCE ENERGY
 * =====================================================
 */


function resolveEnergy(

 semantic:any

){


if(
 semantic.experienceDNA?.includes(
 "cinematic"
 )
){

return "mysterious";

}



if(
 semantic.emotions.includes(
 "joy"
 )
){

return "playful";

}



if(
 semantic.emotions.includes(
 "love"
 )
){

return "emotional";

}



return "emotional";


}









/**
 * =====================================================
 * PACING
 * =====================================================
 */


function resolvePacing(

 semantic:any

){


if(
 semantic.experienceDNA?.includes(
 "cinematic"
 )
){

return "slow";

}



if(
 semantic.themes.includes(
 "discovery"
 )
){

return "fast";

}



return "medium";


}









/**
 * =====================================================
 * UNIVERSAL HUMAN JOURNEY
 * =====================================================
 */


function buildJourney(

 semantic:any

):ExperienceJourney[] {


const journey:ExperienceJourney[]=[


"arrival",


"discovery",


"reveal",


"return"


];



if(
 semantic.experienceDNA?.includes(
 "transformation"
 )
){

journey.splice(
 3,
 0,
 "transformation"
);

}



return journey;


}









/**
 * =====================================================
 * GENOME BUILDER
 *
 * Prompt → Experience DNA
 *
 * =====================================================
 */


export function buildExperienceGenome(

 prompt:string

):ExperienceGenome {



if(
 !prompt.trim()

){

throw new Error(
 "Experience prompt cannot be empty"
);

}





const semantic =

analyzeSemanticPrompt(
 prompt
);





const entities =

extractEntities(
 prompt
);





const meaning =

buildMeaning(
 semantic
);





const relationships =

buildRelationships();





return {



/**
 * Core intent
 */

intent:[

semantic.intent

],





/**
 * Creative DNA
 */

dna:

buildDNA(
 semantic
),





/**
 * Archetypal signals
 */

archetypes:

semantic.themes,





/**
 * Themes

 */

themes:

semantic.themes,





/**
 * Emotional layer
 */

emotions:

semantic.emotions,





/**
 * Meaning
 */

meaning,





/**
 * Semantic graph
 */

relationships,





/**
 * World entities
 */

entities,





/**
 * Experience physics
 */

energy:

resolveEnergy(
 semantic
),



pacing:

resolvePacing(
 semantic
),



social:

semantic.audience.length

?

"community"

:

"solo",





/**
 * Human journey
 */

journey:

buildJourney(
 semantic
),





/**
 * Dimensions
 */

discovery:

semantic.themes.includes(
 "discovery"
)

?

1

:

0.5,




memory:

semantic.themes.includes(
 "memory"
)

?

1

:

0.5,




commerce:

semantic.themes.includes(
 "commerce"
)

?

1

:

0,




immersion:

semantic.experienceDNA?.includes(
 "cinematic"
)

?

1

:

0.5,




interaction:

0.5,




replay:

semantic.themes.includes(
 "memory"
)

?

1

:

0.5,





/**
 * World context
 */

environments:

semantic.environments,




audience:

semantic.audience,



};


}






export const genomeBuilder =

buildExperienceGenome;