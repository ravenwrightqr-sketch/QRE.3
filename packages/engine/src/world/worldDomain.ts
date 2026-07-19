/**
 * =====================================================
 * QRE WORLD DOMAIN INTELLIGENCE
 * =====================================================
 *
 * Converts semantic meaning into a world category.
 *
 * NO DATABASE
 * NO EXECUTION
 *
 * HUMAN IDEA
 *      ↓
 * WORLD TYPE
 *      ↓
 * EXPERIENCE RULES
 *
 * =====================================================
 */

import type {
  SemanticAnalysis
} from "../semantic/semanticAnalyzer.js";


export type WorldDomain =

  | "memory_world"
  | "commerce_world"
  | "culture_world"
  | "discovery_world"
  | "journey_world"
  | "identity_world"
  | "community_world";




export function resolveWorldDomain(
  semantic: SemanticAnalysis
): WorldDomain {



if(
 semantic.themes.includes("memory") ||
 semantic.themes.includes("storytelling")
){

 return "memory_world";

}



if(
 semantic.themes.includes("commerce")
){

 return "commerce_world";

}



if(
 semantic.themes.includes("culture")
){

 return "culture_world";

}



if(
 semantic.themes.includes("discovery") ||
 semantic.themes.includes("adventure")
){

 return "discovery_world";

}



if(
 semantic.themes.includes("connection")
){

 return "community_world";

}



if(
 semantic.entities.includes("living_being")
){

 return "identity_world";

}



return "journey_world";


}