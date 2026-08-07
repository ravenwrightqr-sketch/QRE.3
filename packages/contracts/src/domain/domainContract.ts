/**
 * =====================================================
 * QRE DOMAIN ADAPTER CONTRACT
 * =====================================================
 *
 * ROLE:
 *
 * Cognitive lens for interpreting
 * universal entities.
 *
 *
 * Domains do not create experiences.
 *
 * They provide intelligence context:
 *
 * - vocabulary
 * - relationships
 * - goals
 * - opportunities
 * - meaning
 * - memory patterns
 *
 *
 * =====================================================
 */


export type DomainType =

 | "pet"

 | "wedding"

 | "relationship"

 | "home"

 | "object"

 | "warehouse"

 | "retail"

 | "health"

 | "education"

 | "event"

 | "general";





export interface DomainRelationship {


 from:string;


 to:string;


 meaning:string;


 importance:number;


}







export interface DomainOpportunity {


 discovery:string;


 value:number;


 reason:string;


}







export interface DomainGoalTemplate {


 target:string;


 reason:string;


 priority:number;


}







export interface DomainAdapter {


 /**
  * Domain identity.
  */
 domain:DomainType;



 /**
  * Human-readable description.
  */
 description:string;



 /**
  * Important entities.
  */
 entities:string[];



 /**
  * Relationship patterns.
  */
 relationships:
 DomainRelationship[];



 /**
  * Optimization goals.
  */
 goals:
 DomainGoalTemplate[];



 /**
  * Expansion opportunities.
  */
 opportunities:
 DomainOpportunity[];



 /**
  * Restrictions.
  */
 constraints?:
 string[];



 /**
  * Semantic meaning dimensions.
  *
  * What this domain represents
  * emotionally or culturally.
  */
 meaningFields?:
 string[];



 /**
  * Experience generation modes.
  *
  * Possible experiences produced.
  */
 experienceModes?:
 string[];



 /**
  * Memory dimensions.
  *
  * What history should be preserved.
  */
 memoryDimensions?:
 string[];



 /**
  * Signals used by cognition.
  */
 cognitiveSignals?:
 string[];



 /**
  * Entity categories.
  *
  * Universal entity mapping.
  */
 entityTypes?:
 string[];



 /**
  * How this domain evolves.
  */
 evolutionPaths?:
 string[];


}