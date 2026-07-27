/**
 * =====================================================
 * QRE OBJECT GENOME CONTRACT
 * =====================================================
 *
 * Everything is an object.
 *
 * Object
 *   ↓
 * Meaning
 *   ↓
 * Relationships
 *   ↓
 * Moments
 *   ↓
 * Memory
 *   ↓
 * Legacy
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


export type ObjectIdentity = {

  name?: string;

  type:string;

  category?:string[];

  attributes:string[];

};



export type ObjectHistory = {

  origin?:string;

  timeline:string[];

  importantMoments:string[];

};
export type ObjectRelationship = {

  subject:string;

  relationship:
    | "owned_by"
    | "created_by"
    | "loved_by"
    | "visited_by"
    | "connected_to"
    | "belongs_to"
    | "experienced_with"
    | "adopted_by"
    | "rescued_from"
    | "cared_for_by"
    | "occurred_at"
    | "witnessed_by"
    | "transformed_by";

  object:string;

  confidence:number;

};



export type ObjectMemory = {

  memories:string[];

  emotionalMarkers:string[];

  locations:string[];

  dates:string[];

};



export type ObjectLegacy = {

  meaning:string[];

  impact:string[];

  preservation:string[];

};
export type ObjectMoment = {

  id:string;

  title:string;

  description:string;

  location?:string;

  timestamp?:string;

  participants:string[];

  emotions:string[];

  significance:number;

  sensory?:{

    visual:string[];

    audio:string[];

    atmosphere:string[];

  };

};

export interface ObjectGenome {

identity:
ObjectIdentity;

history:
ObjectHistory;

relationships:
ObjectRelationship[];

moments:
ObjectMoment[];

memory:
ObjectMemory;

legacy:
ObjectLegacy;

emotionalSignature:
string[];

symbolicMeaning:
string[];

futurePossibilities:
string[];

}
