/**
 * =====================================================
 * QRE EXPERIENCE RELATIONSHIP ANALYZER
 * =====================================================
 *
 * Responsibility:
 * Build semantic relationships between
 * extracted experience entities.
 *
 *
 * Input:
 *
 * Prompt context
 * +
 * ExperienceEntities
 *
 *
 * Output:
 *
 * ExperienceRelationship[]
 *
 *
 * Determines:
 *
 * - person relationships
 * - location relationships
 * - time relationships
 * - media relationships
 * - product relationships
 *
 *
 * This analyzer does NOT:
 *
 * - create experiences
 * - execute flows
 * - store data
 * - access database
 * - control runtime
 *
 *
 * Pipeline:
 *
 * EntityAnalyzer
 *       ↓
 * RelationshipAnalyzer
 *       ↓
 * Understanding Kernel
 *
 *
 * NO DATABASE
 * NO RUNTIME
 * NO EXECUTION
 *
 * =====================================================
 */


import type {

  ExperienceRelationship,

  ExperienceEntities

} from "@qre/contracts";






export function analyzeRelationships(

  prompt:string,

  entities:ExperienceEntities

):ExperienceRelationship[] {



const relationships:

ExperienceRelationship[] = [];






const subject =

entities.events[0]

??

"experience";







/**
 * PEOPLE
 *
 * Existing contract:
 * celebrates
 * created_by
 * shared_with
 */

for(const person of entities.people){


relationships.push({

subject:person,

predicate:"shared_with",

object:subject,

confidence:.75

});


}








/**
 * LOCATIONS
 */

for(const place of entities.places){


relationships.push({

subject,

predicate:"located_at",

object:place,

confidence:.85

});


}









/**
 * TIME
 *
 * Existing contract:
 * performed_at
 * remembered_at
 */

for(const date of entities.dates){


relationships.push({

subject,

predicate:"performed_at",

object:date,

confidence:.8

});


}









/**
 * MEDIA
 *
 * Existing contract:
 * belongs_to
 */

if(

entities.media.length

){


relationships.push({

subject:"media",

predicate:"belongs_to",

object:subject,

confidence:.7

});


}









/**
 * PRODUCTS / OBJECTS
 */

for(const product of entities.products){


relationships.push({

subject,

predicate:"belongs_to",

object:product,

confidence:.7

});


}








return relationships;


}