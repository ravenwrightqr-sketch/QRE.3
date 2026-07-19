/**
 * =====================================================
 * QRE EXPERIENCE INTELLIGENCE CORE
 * =====================================================
 *
 * Universal Experience Compiler
 *
 * ANY HUMAN IDEA
 *        ↓
 * SEMANTIC INTELLIGENCE
 *        ↓
 * WORLD DOM INTELLIGENCE
 *        ↓
 * EXPERIENCE BLUEPRINT
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */

import type {
  ExperienceBlueprint,
  ExperienceMoment,
  ExperienceMomentType,
  ExperienceTone,
  ExperienceEntities,
  ExperienceType,
  ExperienceComponent,
} from "@qre/contracts";


import {
  resolveSemanticConcepts,
} from "../../semantic/conceptResolver.js";


import {
  composeWorldMoments
} from "../../world/worldComposer.js";


import {
  generateExperienceTitle,
} from "../personalization/titleGenerator.js";


import type {
  SemanticAnalysis,
} from "../../semantic/semanticAnalyzer.js";


import {
  narrateMoment,
} from "../personalization/momentNarrator.js";


import {
  getIndustryTemplate,
} from "../templates/index.js";


import type {
  DetectedIntent,
} from "../parser/intentDetector.js";


import {
  resolvePattern,
} from "../patternResolver.js";


import {
  atomToMomentType,
} from "../atoms/atomMapper.js";


import type {
  ExperienceEnhancement,
} from "../experienceEnhancer.js";





/**
 * =====================================================
 * TYPE NORMALIZATION BOUNDARY
 *
 * Intelligence systems can produce strings.
 * Composer compiles them into contracts.
 *
 * =====================================================
 */

function normalizeMomentTypes(
  values: readonly unknown[]
): ExperienceMomentType[] {

  return values.filter(

    (value): value is ExperienceMomentType =>

      typeof value === "string"

  );

}



function normalizeTones(
  values: readonly unknown[]
): ExperienceTone[] {

  return values.filter(

    (value): value is ExperienceTone =>

      typeof value === "string"

  );

}







/**
 * =====================================================
 * EXPERIENCE TYPE INTELLIGENCE
 * =====================================================
 */

function detectExperienceType(
  detected: DetectedIntent
): ExperienceType {


  switch(detected.industry) {


    case "memory":
    case "relationship":
    case "wedding":

      return "story";



    case "event":
    case "concert":
    case "festival":
    case "show":

      return "event";



    case "pet":

      return "tribute";



    case "restaurant":
    case "business":
    case "retail":
    case "cannabis":

      return "business";



    default:

      return "journey";


  }

}






/**
 * =====================================================
 * COMPONENT INTELLIGENCE
 * =====================================================
 */

function resolveComponent(
  type: ExperienceMomentType
): ExperienceComponent {


const components:

Partial<
Record<
ExperienceMomentType,
ExperienceComponent
>
>

= {


welcome:

"hero",



introduction:

"hero",



story:

"story",



love_story:

"story",



pet_story:

"story",



memory:

"memory",



photos:

"gallery",



video:

"video",



location:

"geo_memory",



arrival:

"geo_memory",



product:

"product",



product_passport:

"product",



reward:

"reward",



followup:

"cta",



share:

"social",



review:

"review",



profile:

"profile",



timeline:

"timeline",



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
 * SEMANTIC → MOMENTS
 * =====================================================
 */

function semanticToMoments(
 semantic: SemanticAnalysis
): ExperienceMomentType[] {


const moments =
new Set<ExperienceMomentType>();


for(
 const theme of semantic.themes
){


switch(theme){


case "memory":

moments.add("memory");

break;



case "storytelling":

moments.add("story");

break;



case "connection":

moments.add("meeting");

break;



case "commerce":

moments.add("product");

break;



case "culture":

moments.add("performance");

break;



case "discovery":

moments.add("playful");

break;



case "adventure":

moments.add("playful");

break;



case "companion":

moments.add("pet_story");

break;



default:

moments.add("introduction");

break;


}

}



for(
 const dna of semantic.experienceDNA
){


switch(dna){


case "cinematic":

moments.add("video");

break;



case "immersive":

moments.add("soundtrack");

break;



case "personal":

moments.add("profile");

break;



case "premium":

moments.add("reward");

break;



case "emotional":

moments.add("highlights");

break;



case "interactive":

moments.add("reaction");

break;


}

}



if(
 moments.size === 0
){

moments.add("welcome");

moments.add("story");

}


return [
...moments
];


}
/**
 * =====================================================
 * UNIVERSAL FALLBACK MOMENTS
 * =====================================================
 */

function generateUniversalMoments(
  prompt: string
): ExperienceMomentType[] {


const text =
prompt.toLowerCase();



const moments =
new Set<ExperienceMomentType>([

"welcome",

"followup",

]);



if(
 /photo|image|picture|gallery/
 .test(text)
){

moments.add("photos");

}



if(
 /place|location|travel|venue/
 .test(text)
){

moments.add("location");

}



if(
 /share|community|friend/
 .test(text)
){

moments.add("share");

}



return [
...moments
];


}







/**
 * =====================================================
 * MOMENT BUILDER
 * =====================================================
 */

function buildMoments(

  moments: readonly ExperienceMomentType[],

  entities: ExperienceEntities

): ExperienceMoment[] {


return moments.map(

(type,index)=>{


const narration =
narrateMoment(

type,

{

location:
entities.places[0],

person:
entities.people[0],

product:
entities.products[0],

}

);



const component =
resolveComponent(type);



return {


type,


component,


title:

narration.title,



subtitle:

narration.subtitle,



order:

index,



editable:

true,



demo:

true,



payload: {


component,


headline:

narration.title,


entities,


},


};


}

);


}









/**
 * =====================================================
 * BLUEPRINT COMPOSER
 *
 * Semantic world compiler.
 *
 * =====================================================
 */

export function composeBlueprint(

detected: DetectedIntent,

entities: ExperienceEntities,

prompt: string,

enhancement: ExperienceEnhancement,

semantic: SemanticAnalysis

): ExperienceBlueprint {



const template =

getIndustryTemplate(

detected.industry

);






/**
 * =====================================================
 * PATTERN INTELLIGENCE
 * =====================================================
 */

const pattern =

resolvePattern({

prompt,

industry:

detected.industry,

goal:

detected.goal,

});





const patternMoments =

normalizeMomentTypes(

pattern.atoms.map(

atom => atomToMomentType(atom)

)

);






/**
 * =====================================================
 * SEMANTIC INTELLIGENCE
 * =====================================================
 */

const semanticMoments =

semanticToMoments(

semantic

);






const resolvedSemanticMoments =

normalizeMomentTypes(

resolveSemanticConcepts([

...semantic.themes,

...semantic.experienceDNA,

...semantic.emotions,

])

);







/**
 * =====================================================
 * WORLD DOM INTELLIGENCE
 *
 * Highest level experience decisions.
 *
 * =====================================================
 */

const worldMoments =

normalizeMomentTypes(

composeWorldMoments(

semantic

)

);







/**
 * =====================================================
 * UNIVERSAL INTELLIGENCE
 * =====================================================
 */

const universalMoments =

generateUniversalMoments(

prompt  

);








/**
 * =====================================================
 * FINAL EXPERIENCE GRAPH
 *
 * Priority:
 *
 * WORLD DOM
 * ↓
 * SEMANTIC
 * ↓
 * ENHANCEMENT
 * ↓
 * PATTERN
 * ↓
 * UNIVERSAL
 * ↓
 * TEMPLATE
 *
 * =====================================================
 */

const finalMoments:

ExperienceMomentType[] = [

...new Set<ExperienceMomentType>([


...worldMoments,


...semanticMoments,


...resolvedSemanticMoments,


...normalizeMomentTypes(

enhancement.moments

),


...patternMoments,


...universalMoments,


...normalizeMomentTypes(

template.recommendedMoments

),


])

];







/**
 * =====================================================
 * EXPERIENCE TYPE
 * =====================================================
 */

const type =

detectExperienceType(

detected

);








/**
 * =====================================================
 * EXPERIENCE TONE
 * =====================================================
 */

const tone:

ExperienceTone[] = [

...new Set<ExperienceTone>([


...normalizeTones(

template.preferredDNA

),



...normalizeTones(

enhancement.tone

),


])

];









/**
 * =====================================================
 * FINAL BLUEPRINT
 * =====================================================
 */

return {


title:

generateExperienceTitle({

type,


industry:

detected.industry,


entities,


}),



industry:

detected.industry,



type,



goal:

detected.goal,



tone,



moments:

buildMoments(

finalMoments,

entities

),



entities,


};


}