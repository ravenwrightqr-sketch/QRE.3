/**
 * =====================================================
 * QRE EXPERIENCE BLUEPRINT COMPOSER
 * =====================================================
 *
 * Experience Genome
 *        ↓
 * Experience Blueprint
 *
 * Genome is creative source of truth.
 *
 * Responsibilities:
 *
 * - Resolve industry
 * - Resolve goal
 * - Resolve experience type
 * - Generate moments
 * - Preserve meaning
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {

  ExperienceBlueprint,
  ExperienceGenome,
  ExperienceMoment,
  ExperienceMomentType,
  ExperienceComponent,
  ExperienceTone,
  ExperienceGoal,
  ExperienceType,
  ExperienceIndustry,

} from "@qre/contracts";








/**
 * =====================================================
 * MOMENT → COMPONENT
 * =====================================================
 */


function resolveComponent(

  type:ExperienceMomentType

):ExperienceComponent {


const components:

Partial<Record<
ExperienceMomentType,
ExperienceComponent
>>

= {


welcome:
"hero",


introduction:
"hero",


story:
"story",


memory:
"memory",


photos:
"gallery",


video:
"video",


location:
"geo_memory",


product:
"product",


reward:
"reward",


share:
"social",


profile:
"profile",


timeline:
"timeline",


followup:
"cta",


care_instructions:
"education",


};


return (

components[type]

??

"cta"

) as ExperienceComponent;


}










/**
 * =====================================================
 * PURPOSE INTELLIGENCE
 * =====================================================
 */


function resolveGoal(

 genome:ExperienceGenome

):ExperienceGoal {


if(
 genome.commerce >= .7
){
 return "conversion";
}


if(
 genome.memory >= .7
){
 return "memory";
}


if(
 genome.themes.includes(
   "connection"
 )
){
 return "storytelling";
}


if(
 genome.themes.includes(
   "education"
 )
){
 return "educate";
}


if(
 genome.replay >= .7
){
 return "retention";
}


return "welcome";


}









/**
 * =====================================================
 * INDUSTRY INTELLIGENCE
 * =====================================================
 */


function resolveIndustry(

 genome:ExperienceGenome

):ExperienceIndustry {


if(
 genome.commerce >= .7
){
 return "business";
}



if(
 genome.memory >= .7
){

 return "personal";

}



if(
 genome.themes.includes(
 "relationship"
 )
){

 return "relationship";

}



if(
 genome.themes.includes(
 "culture"
 )
){

 return "event";

}



return "generic";


}









/**
 * =====================================================
 * EXPERIENCE SHAPE
 * =====================================================
 */


function resolveType(

 genome:ExperienceGenome

):ExperienceType {


if(
 genome.memory >= .7
){

 return "story";

}



if(
 genome.commerce >= .7
){

 return "business";

}



if(
 genome.journey.includes(
 "transformation"
 )
){

 return "journey";

}



return "journey";


}










/**
 * =====================================================
 * TITLE ENGINE
 * =====================================================
 */


function createTitle(

 genome:ExperienceGenome

):string {



if(
 genome.meaning.memories.length
){

 return genome.meaning.memories[0];

}



if(
 genome.meaning.desiredFeeling.length
){

 return `${genome.meaning.desiredFeeling[0]} Experience`;

}



if(
 genome.entities.places.length
){

 return `${genome.entities.places[0]} Experience`;

}



if(
 genome.entities.people.length
){

 return `${genome.entities.people[0]} Story`;

}



return "QRE Experience";


}









/**
 * =====================================================
 * MOMENT GENERATION
 * =====================================================
 */


function generateMomentSequence(

 genome:ExperienceGenome

):ExperienceMomentType[] {


const moments =
new Set<ExperienceMomentType>();



moments.add(
"welcome"
);



if(
 genome.memory >= .5
){

 moments.add(
 "memory"
 );

}



if(
 genome.entities.places.length
){

 moments.add(
 "location"
 );

}



if(
 genome.entities.products.length
){

 moments.add(
 "product"
 );

}



if(
 genome.immersion >= .5
){

 moments.add(
 "video"
 );

}



if(
 genome.interaction >= .5
){

 moments.add(
 "story"
 );

}



moments.add(
"followup"
);



return [
 ...moments
];


}









/**
 * =====================================================
 * BUILD MOMENT
 * =====================================================
 */


function buildMoment(

 type:ExperienceMomentType,

 index:number,

 genome:ExperienceGenome

):ExperienceMoment {


return {


type,


component:
resolveComponent(type),



title:
`${type} moment`,



subtitle:
genome.meaning.why,



order:
index,



editable:true,



demo:true,



payload:{


entities:
genome.entities,


relationships:
genome.relationships,


meaning:
genome.meaning,


genome,



}


};


}









/**
 * =====================================================
 * PUBLIC COMPILER
 *
 * Genome → Blueprint
 *
 * =====================================================
 */


export function composeBlueprint(

 genome:ExperienceGenome

):ExperienceBlueprint {



const momentTypes =
generateMomentSequence(
 genome
);



const moments =
momentTypes.map(

(type,index)=>

buildMoment(

type,

index,

genome

)

);






const tone:

ExperienceTone[] =

[
 genome.energy,
 ...genome.emotions
]

.filter(

(value):value is ExperienceTone =>

typeof value === "string"

);


return {

title:
createTitle(
 genome
),


type:
resolveType(
 genome
),


tone,


meaning:
genome.meaning,


moments,


entities:
genome.entities,


};

}