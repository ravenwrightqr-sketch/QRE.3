/**
 * =====================================================
 * WORLD EXPERIENCE COMPOSER
 * =====================================================
 *
 * Decides what belongs in an experience.
 *
 * Semantic = possibilities
 * World = decisions
 *
 * =====================================================
 */


import type {
 ExperienceMomentType
} from "@qre/contracts";


import type {
 SemanticAnalysis
} from "../semantic/semanticAnalyzer.js";


import {
 resolveWorldDomain
} from "./worldDomain.js";




export function composeWorldMoments(

 semantic: SemanticAnalysis

):ExperienceMomentType[] {


const world =
 resolveWorldDomain(
   semantic
 );



switch(world){


case "memory_world":

return [

"welcome",
"story",
"photos",
"timeline",
"replay"

];




case "commerce_world":

return [

"welcome",
"profile",
"story",
"product",
"offer",
"reward",
"review"

];




case "culture_world":

return [

"welcome",
"arrival",
"venue",
"performance",
"photos",
"soundtrack",
"share",
"replay"

];




case "discovery_world":

return [

"welcome",
"location",
"playful",
"interaction",
"reward",
"replay"

];




case "identity_world":

return [

"welcome",
"profile",
"story",
"photos",
"care_instructions"

];




case "community_world":

return [

"welcome",
"meeting",
"story",
"share",
"social"

];




default:

return [

"welcome",
"story"

];


}


}