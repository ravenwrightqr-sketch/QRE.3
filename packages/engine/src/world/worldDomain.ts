/**
 * =====================================================
 * QRE WORLD DOMAIN RESOLVER
 * =====================================================
 *
 * Human Meaning
 *      ↓
 * World Intelligence
 *      ↓
 * Primary Experience Universe
 *
 * =====================================================
 */


import type {
  ExperienceGenome,
  WorldDomain,
} from "@qre/contracts";




type WorldScore = {

  world:WorldDomain;

  score:number;

};





export function resolveWorldDomain(

 genome:ExperienceGenome

):WorldDomain {


const scores:WorldScore[] = [

 {
  world:"transformation_world",
  score:0
 },

 {
  world:"memory_world",
  score:0
 },

 {
  world:"relationship_world",
  score:0
 },

 {
  world:"identity_world",
  score:0
 },

 {
  world:"discovery_world",
  score:0
 },

 {
  world:"culture_world",
  score:0
 },

 {
  world:"commerce_world",
  score:0
 },

 {
  world:"community_world",
  score:0
 },

 {
  world:"service_world",
  score:0
 },

 {
  world:"journey_world",
  score:10
 }

];




function add(

 world:WorldDomain,

 amount:number

){

 const item =
 scores.find(
  x=>x.world===world
 );


 if(item){

  item.score += amount;

 }

}





/**
 * =====================================================
 *
 * TRANSFORMATION INTELLIGENCE
 *
 * The deepest layer wins.
 *
 * =====================================================
 */


if(

 genome.transformation.length

){

 add(
  "transformation_world",
  100
 );

}


if(

 genome.themes.includes("legacy")

){

 add(
  "transformation_world",
  90
 );

}



if(

 genome.themes.includes("growth")

){

 add(
  "transformation_world",
  80
 );

}



/**
 * =====================================================
 *
 * MEMORY INTELLIGENCE
 *
 * =====================================================
 */


if(

 genome.memory >= .5

){

 add(
  "memory_world",
  90
 );

}



if(

 genome.meaning.memories.length

){

 add(
  "memory_world",
  80
 );

}



if(

 genome.themes.includes("memory")

){

 add(
  "memory_world",
  70
 );

}



/**
 * =====================================================
 *
 * RELATIONSHIP INTELLIGENCE
 *
 * =====================================================
 */


if(

 genome.relationships.length

){

 add(
  "relationship_world",
  80
 );

}



if(

 genome.themes.includes("connection")

){

 add(
  "relationship_world",
  70
 );

}



/**
 * =====================================================
 *
 * OBJECT / IDENTITY
 *
 * =====================================================
 */


if(

 genome.entities.people.length ||

 genome.entities.places.length

){

 add(
  "identity_world",
  50
 );

}



if(

 genome.object

){

 add(
  "identity_world",
  40
 );

}



/**
 * =====================================================
 *
 * DISCOVERY
 *
 * =====================================================
 */


if(

 genome.discovery >= .7

){

 add(
  "discovery_world",
  70
 );

}

/**
 * =====================================================
 *
 * COMMERCE
 *
 * =====================================================
 */


if(

 genome.commerce >= .7 ||

 genome.entities.products.length

){

 add(
  "commerce_world",
  60
 );

}

/**
 * =====================================================
 *
 * FINAL WORLD DECISION
 *
 * =====================================================
 */


scores.sort(

(a,b)=>

b.score-a.score

);



return scores[0].world;


}