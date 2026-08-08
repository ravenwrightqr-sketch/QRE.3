/**
 * =====================================================
 * QRE MEMORY INTELLIGENCE CONTRACT
 * =====================================================
 *
 * Universal memory interpretation layer.
 *
 * Everything meaningful can accumulate memory.
 *
 * =====================================================
 */

export type MemoryDomain =

 | "human"

 | "animal"

 | "object"

 | "place"

 | "relationship"

 | "organization"

 | "event"

 | "artifact";





export interface MemoryIdentity {


 subject:string;


 domain:MemoryDomain;


}





export interface MemoryMoment {


 id:string;


 description:string;


 timestamp?:string;


 location?:string;


 emotionalWeight:number;


 significance:number;


}





export interface MemoryRelationship {


 from:string;


 relationship:string;


 to:string;


 strength:number;


}





export interface MemoryEvolution {


 before:string;


 after:string;


 transformation:string;


}





export interface MemoryIntelligence {


 identity:MemoryIdentity;


 moments:MemoryMoment[];


 relationships:MemoryRelationship[];


 evolution:MemoryEvolution[];


 themes:string[];


 legacy:string[];


}