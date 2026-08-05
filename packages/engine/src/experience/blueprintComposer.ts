/**
 * =====================================================
 * QRE EXPERIENCE BLUEPRINT COMPOSER
 * =====================================================
 *
 * Experience Genome
 *        ↓
 * Experience World
 *        ↓
 * Experience Blueprint
 *
 *
 * Enterprise Composition Layer
 *
 * RESPONSIBILITIES:
 *
 * ✅ compose canonical blueprint
 * ✅ preserve semantic DNA
 * ✅ attach world intelligence
 * ✅ translate cognitive outputs into experience structure
 *
 *
 * DOES NOT:
 *
 * ❌ detect intent
 * ❌ create meaning
 * ❌ resolve worlds
 * ❌ execute runtime
 * ❌ access database
 *
 * =====================================================
 */

import type {

  ExperienceBlueprint,
  ExperienceGenome,
  ExperienceMoment,
  ExperienceComponent,
  ExperienceTone,
  ExperienceType,
  ExperienceMomentType,
  ExperienceWorld,
  WorldDomain,

} from "@qre/contracts";



function resolveComponent(
 type:ExperienceMomentType
):ExperienceComponent {


const components:

Partial<Record<
 ExperienceMomentType,
 ExperienceComponent
>>

= {

 welcome:"hero",
 introduction:"hero",
 story:"story",
 memory:"memory",
 timeline:"timeline",
 photos:"gallery",
 video:"video",
 soundtrack:"video",
 location:"geo_memory",
 venue:"geo_memory",
 product:"product",
 reward:"reward",
 share:"social",
 social:"social",
 profile:"profile",
 cta:"cta",
 care_instructions:"education",
 education:"education",
 reveal:"story",
 legacy:"timeline",
 future:"story"

};


return (

 components[type]

 ??

 "story"

) as ExperienceComponent;

}




/**
 * =====================================================
 *
 * WORLD INTELLIGENCE
 *
 * ExperienceWorld is canonical.
 *
 * =====================================================
 */


/**
 * =====================================================
 *
 * WORLD INTELLIGENCE
 *
 * ExperienceWorld is canonical.
 *
 * =====================================================
 */


function resolveWorlds(

 world:ExperienceWorld

):WorldDomain[] {


const worlds = new Set<WorldDomain>();


if(world.domain){

 worlds.add(
  world.domain
 );

}


for(

 const connected of world.connectedWorlds ?? []

){

 worlds.add(
  connected
 );

}



return [

 ...worlds

];

}



function createTitle(

 genome:ExperienceGenome,

 world:ExperienceWorld

):string {


if(
 genome.meaning.memories.length
){

 return genome.meaning.memories[0];

}



if(
 genome.entities.people.length
){

 return `${genome.entities.people[0]} Experience`;

}



if(
world.worldIdentity?.name
){

 return world.worldIdentity.name;

}



if(
 genome.meaning.desiredFeeling.length
){

 return `${genome.meaning.desiredFeeling[0]} Experience`;

}



return "QRE Experience";

}




function buildObjectMoments(

 genome:ExperienceGenome

):ExperienceMoment[]{


return (

 genome.object?.moments ?? []

)

.map(

(moment,index)=>{


const type =

resolveMomentType(

 moment.title

);



return {

 type,

 component:

 resolveComponent(type),

 title:

 moment.title,


 subtitle:

 moment.description,


 description:

 moment.description,


 order:index,


 editable:true,


 demo:false,


 payload:{

  text:

  moment.description,


  data:{

   objectMoment:moment,

   meaning:genome.meaning,

   entities:genome.entities,

   relationships:genome.relationships,

   semanticDNA:genome.dna,

   symbols:genome.symbols,

   worlds:genome.worlds

  }

 }

};


}

);

}




function resolveMomentType(

title:string

):ExperienceMomentType {


const map:

Record<string,ExperienceMomentType> = {


Origin:
"introduction",

"First Encounter":
"story",

"Memory Capture":
"memory",

Relationship:
"story",

"Place Experience":
"location",

Legacy:
"legacy",

Future:
"future"

};



return map[title] ?? "story";

}





export function composeBlueprint(

 genome:ExperienceGenome,

 world:ExperienceWorld

):ExperienceBlueprint {



if(!genome){

 throw new Error(
  "Genome required"
 );

}



if(!world){

 throw new Error(
  "ExperienceWorld required"
 );

}



const worlds =

resolveWorlds(

 world

);



const moments =

buildObjectMoments(

 genome

);



const tone:

ExperienceTone[] =

[

 genome.energy,

 ...genome.emotions,

 ...genome.tone

]

.filter(

(value):value is ExperienceTone =>

typeof value==="string"

);





return {


title:

createTitle(

 genome,

 world

),



type:

resolveExperienceType(

 worlds,

 genome

),



tone:

[...new Set(tone)],



meaning:

genome.meaning,



moments,



entities:

genome.entities,


metadata:{


 archetypes:

  genome.archetypes,


 themes:

  genome.themes,


 dna:

  genome.dna,


 worlds,


 artifacts:

  world.artifacts

}



};

}





function resolveExperienceType(

 worlds:string[],

 genome:ExperienceGenome

):ExperienceType {



if(

 worlds.includes(
  "commerce_world"
 )

){

 return "business";

}



if(

 genome.memory >= .7

){

 return "story";

}



return "journey";

}




export const blueprintComposer =

composeBlueprint;