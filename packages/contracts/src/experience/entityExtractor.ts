/**
 * =====================================================
 * QRE EXPERIENCE ENTITY INTELLIGENCE CONTRACT
 * =====================================================
 *
 * Entities are world primitives.
 *
 * They are not extracted words.
 *
 * They are things that can:
 *
 * - exist
 * - relate
 * - accumulate history
 * - carry meaning
 * - generate experiences
 *
 *
 * Human Prompt
 *      ↓
 * Entity Intelligence
 *      ↓
 * Experience World
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


export type EntityType =

 | "person"

 | "place"

 | "organization"

 | "object"

 | "creature"

 | "product"

 | "event"

 | "concept"

 | "symbol"

 | "world"

 | "unknown";





/**
 * =====================================================
 * UNIVERSAL ENTITY
 * =====================================================
 */

export interface ExperienceEntity {


 /**
  * Entity label.
  */
 name:string;



 /**
  * Classification.
  */
 type:EntityType;



 /**
  * Semantic attributes.
  */
 attributes:string[];



 /**
  * Importance to experience.
  */
 significance:number;



 /**
  * Meaning attached.
  */
 meaning:string[];



 /**
  * Lifecycle/history signals.
  */
 history?:string[];


}






/**
 * =====================================================
 * ENTITY RELATIONSHIP
 * =====================================================
 */

export interface EntityRelationship {


 source:string;


 relationship:string;


 target:string;


 confidence:number;


}






/**
 * =====================================================
 * EXPERIENCE ENTITIES
 * =====================================================
 */

export type ExperienceEntities = {


 /**
  * Structured entities.
  *
  * New intelligence layer.
  */
 resolved?:ExperienceEntity[];



 /**
  * Relationships between entities.
  */
 relationships?:EntityRelationship[];



 /**
  * Human beings.
  */
 people:string[];



 /**
  * Physical locations.
  */
 places:string[];



 /**
  * Organizations.
  */
 organizations:string[];



 /**
  * Time anchors.
  */
 dates:string[];


 times:string[];



 /**
  * Events and experiences.
  */
 events:string[];



 /**
  * Commercial objects.
  */
 products:string[];



 /**
  * Digital references.
  */
 urls:string[];


 emails:string[];


 phones:string[];



 /**
  * Media primitives.
  */
 media:string[];



 /**
  * Search language.
  */
 keywords:string[];



 /**
  * Physical meaningful things.
  *
  * Examples:
  *
  * guitar
  * car
  * ring
  * house
  */
 objects:string[];



 /**
  * Living entities.
  *
  * Examples:
  *
  * dog
  * cat
  * tree
  */
 creatures:string[];



 /**
  * Abstract meaning.
  *
  * Examples:
  *
  * love
  * freedom
  * legacy
  */
 concepts:string[];



 /**
  * Cultural meaning.
  */
 symbols:string[];



 /**
  * Imagined or generated spaces.
  */
 worlds:string[];



 /**
  * Narrative patterns.
  */
 archetypes:string[];


};