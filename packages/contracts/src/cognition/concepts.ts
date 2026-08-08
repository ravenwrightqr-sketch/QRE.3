/**
 * =====================================================
 * QRE EXPERIENCE CONCEPT CONTRACTS
 * =====================================================
 *
 * Universal human meaning structures.
 *
 * These are shared semantic shapes.
 *
 * No execution.
 * No runtime.
 * No generation logic.
 *
 * =====================================================
 */


export type ExperienceConcept =

  | "connection"
  | "belonging"
  | "discovery"
  | "memory"
  | "legacy"
  | "identity"
  | "transformation"
  | "celebration"
  | "curiosity"
  | "trust"
  | "adventure"
  | "ritual"
  | "reflection"
  | "achievement"
  | "expression";




export interface ConceptDefinition {

  name: ExperienceConcept;

  essence:string;

  emotions:string[];

  movement:string[];

}

export type ConceptRelationship =

  | "supports"
  | "creates"
  | "transforms"
  | "reveals"
  | "preserves";


export interface ConceptConnection {

  from:ExperienceConcept;

  to:ExperienceConcept;

  relationship:ConceptRelationship;

}


export interface ConceptConstellation {

  concepts:ExperienceConcept[];

  connections:ConceptConnection[];

}