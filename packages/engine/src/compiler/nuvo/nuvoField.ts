/**
 * =====================================================
 * QRE NUVO FIELD
 * =====================================================
 *
 * Possibility Intelligence Layer.
 *
 * Genome:
 * "What exists"
 *
 * NUVO:
 * "What could become"
 *
 * Discovers:
 *
 * - latent potential
 * - future realities
 * - transformation arcs
 * - emotional evolution
 * - creative mutations
 * - unexplored possibilities
 * - semantic graph opportunities
 *
 * NO DATABASE.
 * NO RUNTIME.
 * NO INDUSTRY LOGIC.
 *
 * =====================================================
 */
import type {
  CompilerMind,
  ExperienceGenome,
  SemanticIR
} from "@qre/contracts";

import type {
  NuvoField,
  NuvoFuture,
  NuvoMutation,
} from "@qre/contracts";

export type {
  NuvoField,
  NuvoFuture,
  NuvoMutation,
} from "@qre/contracts";

function unique(
 values:string[]
):string[] {

 return [

  ...new Set(

   values.filter(Boolean)

  )

 ];

}


function flattenEntities(
 genome:ExperienceGenome
):string[] {


 return Object

  .values(
    genome.entities
  )

  .flat()

  .filter(
    (value):value is string =>
      typeof value === "string"
  );

}





function discoverSemanticPotential(
 semanticIR:SemanticIR
):string[] {


return unique([

 ...semanticIR.nodes

 .filter(
  node =>
   node.type !== "entity"
 )

 .map(
  node =>
   node.label
 )

]);


}





function discoverGraphInsights(
 semanticIR:SemanticIR
):string[] {


return unique(

 semanticIR.edges.map(

 edge =>

 `${edge.from} ${edge.relation} ${edge.to}`

 )

);


}





function discoverHiddenRelationships(
 semanticIR:SemanticIR
):string[] {


return unique(

 semanticIR.edges.map(

 edge =>

 `${edge.from}_${edge.to}`

 )

);


}





function discoverFutureQuestions(
 semanticIR:SemanticIR
):string[] {


return [

 semanticIR.unansweredQuestion ||

 "What deeper meaning is waiting to emerge?"

 ];

}







function discoverFutureRealities(
 genome:ExperienceGenome
):NuvoFuture[]{


const futures:NuvoFuture[]=[];



if(
 genome.memory === 1
){

 futures.push({

  name:"living_memory_world",

  description:
   "A meaningful experience evolves into an interactive emotional memory space.",

  transformation:
   "experience → memory → story → legacy",

  confidence:.92

 });

}



if(
 genome.immersion === 1
){

 futures.push({

  name:"cinematic_reality",

  description:
   "The concept becomes an environment people emotionally enter.",

  transformation:
   "idea → atmosphere → world",

  confidence:.90

 });

}



if(
 genome.interaction === 1
){

 futures.push({

  name:"adaptive_experience",

  description:
   "The experience responds and changes with participation.",

  transformation:
   "observer → participant → creator",

  confidence:.88

 });

}



if(
 genome.social === "community"
){

 futures.push({

  name:"collective_universe",

  description:
   "Individual experiences combine into shared meaning.",

  transformation:
   "person → community → culture",

  confidence:.86

 });

}



if(
 genome.discovery > .7
){

 futures.push({

  name:"exploration_realm",

  description:
   "The experience becomes a place of discovery.",

  transformation:
   "unknown → exploration → revelation",

  confidence:.82

 });

}



if(!futures.length){

 futures.push({

  name:"emergent_creation",

  description:
   "The concept contains unknown creative potential.",

  transformation:
   "idea → possibility → discovery",

  confidence:.35

 });

}



return futures;

}





function discoverMutations(
 genome:ExperienceGenome
):NuvoMutation[]{


const mutations:NuvoMutation[]=[];



if(
 genome.meaning.memories.length
){

 mutations.push({

 source:"memory",

 evolution:
  "transform history into narrative",

 potential:
  "emotional_archive"

 });

}



if(
 genome.relationships.length
){

 mutations.push({

 source:"relationship",

 evolution:
  "connect hidden human meanings",

 potential:
  "living_network"

 });

}



if(
 genome.symbols.length
){

 mutations.push({

 source:"symbol",

 evolution:
  "turn symbols into world language",

 potential:
  "mythology_system"

 });

}



return mutations;

}







function discoverOpportunities(
 genome:ExperienceGenome
):string[]{


const opportunities:string[]=[];


if(
 flattenEntities(genome).length
){

 opportunities.push(
  "expand entities into living systems"
 );

}


if(
 genome.meaning.memories.length
){

 opportunities.push(
  "preserve emotional history"
 );

}


if(
 genome.relationships.length
){

 opportunities.push(
  "reveal invisible meaning connections"
 );

}


return unique(opportunities);

}








function discoverLatentWorlds(
 genome:ExperienceGenome
):string[]{


const worlds:string[]=[];


if(genome.memory===1)
 worlds.push("memory_world");


if(genome.discovery>.5)
 worlds.push("exploration_world");


if(genome.immersion===1)
 worlds.push("cinematic_world");


if(genome.social==="community")
 worlds.push("collective_world");


return worlds;

}


export function awakenNuvo(

 mind:CompilerMind

):NuvoField {

const genome = mind.genome;

const semanticIR = mind.semanticIR!;
const entities =
 flattenEntities(genome);



return {


originPatterns:

 unique([

  ...genome.archetypes,

  ...genome.emotions,

  ...entities

 ]),



emergencePatterns:

 unique([

  ...genome.dna,

  ...genome.themes,

  ...genome.symbols

 ]),



hiddenForces:

 unique([

  ...genome.meaning.desiredFeeling,

  ...genome.meaning.memories,

  ...genome.meaning.why

 ]),



transformationPaths:

 unique([

  ...genome.transformation,

  genome.memory===1
   ? "experience_to_story"
   : "",

  genome.replay===1
   ? "story_to_return"
   : "",

  genome.social==="community"
   ? "individual_to_collective"
   : "",

  genome.immersion===1
   ? "idea_to_world"
   : ""

 ]),



futureRealities:
 discoverFutureRealities(genome),


creativeOpportunities:
 discoverOpportunities(genome),


mutations:
 discoverMutations(genome),


latentWorlds:
 discoverLatentWorlds(genome),



semanticPotential:
 discoverSemanticPotential(semanticIR),



graphInsights:
 discoverGraphInsights(semanticIR),



hiddenRelationships:
 discoverHiddenRelationships(semanticIR),



possibilityVectors:

 unique([

  ...genome.transformation,

  semanticIR.transformation,

  semanticIR.emotionalGravity

 ]),



emergentArchetypes:

 unique([

  ...genome.archetypes,

  ...semanticIR.nodes

   .filter(
    node=>node.type==="symbol"
   )

   .map(
    node=>node.label
   )

 ]),



futureQuestions:
 discoverFutureQuestions(semanticIR),



resonance:

 Math.min(

  1,

  (

   genome.discovery +

   genome.memory +

   genome.immersion +

   genome.interaction +

   genome.replay

  ) / 5

 )


};


}