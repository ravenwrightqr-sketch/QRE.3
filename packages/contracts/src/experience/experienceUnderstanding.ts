/**
 * =====================================================
 * QRE EXPERIENCE UNDERSTANDING CONTRACT
 * =====================================================
 *
 * Human intention interpretation layer.
 *
 * Prompt
 *      ↓
 * Understanding
 *      ↓
 * Meaning
 *      ↓
 * Genome
 *
 * NO DATABASE
 * NO RUNTIME
 * NO INDUSTRY LOGIC
 *
 * =====================================================
 */


import type {
  ExperienceIntent,
  ExperienceEntities,
  ExperienceRelationship,
  WorldDomain,
} from "@qre/contracts";


export type EmotionUnderstanding = {

  emotions:string[];

  atmosphere:string[];

  intensity:number;

  primary?:string;

};



export type MemoryUnderstanding = {

  past:boolean;

  present:boolean;

  future:boolean;

  legacy:boolean;

  replay:boolean;

  timeCapsule:boolean;

  mode?:
    | "archive"
    | "replay"
    | "timeline"
    | "legacy"
    | "time_capsule"
    | "none";

};



export type AudienceUnderstanding = {

  types:string[];

  social:
    | "solo"
    | "shared"
    | "community";

  roles:string[];

  relationship:string[];

  behaviors:string[];

  expectations:string[];

  primary?:string;

};



export type DNAUnderstanding = {

  traits:string[];

  style?:{

    atmosphere:string[];

    visual:string[];

    interaction:string[];

  };

};



export type WorldUnderstanding = {

  domains:WorldDomain[];

  primary:WorldDomain;

  confidence:number;

};



export type UnderstandingScore = {

  semantic:number;

  entity:number;

  relationship:number;

  emotional:number;

  memory:number;

  world:number;

  dna:number;

  overall:number;

};



export type HumanDesireUnderstanding = {

  desires:string[];

  motivations:string[];

  goals:string[];

  fears:string[];

  aspirations:string[];

};



export type SensoryUnderstanding = {

  visual:string[];

  audio:string[];

  physical:string[];

  environmental:string[];

};



export type CreationPotentialUnderstanding = {

  possibilities:string[];

  constraints:string[];

  opportunities:string[];

};



export interface ExperienceUnderstanding {


  prompt:string;


  intent:ExperienceIntent[];


  entities:ExperienceEntities;


  relationships:ExperienceRelationship[];


  emotions:EmotionUnderstanding;


  memory:MemoryUnderstanding;


  audience:AudienceUnderstanding;


  world:WorldUnderstanding;


  dna:DNAUnderstanding;


  desire:HumanDesireUnderstanding;


  sensory:SensoryUnderstanding;


  potential:CreationPotentialUnderstanding;


  scores:UnderstandingScore;


  confidence:number;


}