/**
 * =====================================================
 * QRE WORLD DOMAIN RESOLVER
 * =====================================================
 *
 * Human Meaning
 *      ↓
 * Experience World
 *
 * NOT industry.
 * NOT templates.
 *
 * =====================================================
 */


import type {
  ExperienceGenome,
  WorldDomain,
} from "@qre/contracts";





export function resolveWorldDomain(

  genome:ExperienceGenome

):WorldDomain {



if(
 genome.meaning.memories.length ||
 genome.themes.includes("memory")
){

 return "memory_world";

}




if(
 genome.themes.includes("connection") ||
 genome.themes.includes("relationship")
){

 return "relationship_world";

}




if(
 genome.discovery >= .7 ||
 genome.themes.includes("adventure")
){

 return "discovery_world";

}




if(
 genome.immersion >= .7 ||
 genome.themes.includes("culture")
){

 return "culture_world";

}




if(
 genome.entities.products.length ||
 genome.commerce >= .7
){

 return "commerce_world";

}




if(
 genome.themes.includes("identity")
){

 return "identity_world";

}




if(
 genome.themes.includes("community")
){

 return "community_world";

}




return "journey_world";

}