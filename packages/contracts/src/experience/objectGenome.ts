/**
 * =====================================================
 * QRE OBJECT GENOME CONTRACT
 * =====================================================
 *
 * Everything is an object.
 *
 * Object
 *   ↓
 * Identity
 *   ↓
 * State
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


import type {
 ExperienceLifecycle
} from "./lifecycle.js";





export type ObjectIdentity = {

  name?: string;

  category?:string[];

  attributes:string[];

  type:
 | "person"
 | "animal"
 | "place"
 | "object"
 | "artifact"
 | "vehicle"
 | "home"
 | "product"
 | "brand"
 | "organization"
 | "unknown";

};






/**
 * Current condition of anything.
 *
 * Examples:
 *
 * Bella:
 * arrived → cared_for → ready_for_pickup
 *
 * Pallet:
 * received → stored → shipped
 *
 * Vehicle:
 * purchased → traveled → inherited
 */
export type ObjectState = {

  current:string;

  previous:string[];

  transitions:string[];

};


export type ObjectExperienceSignal = {

  phase:string;

  action:string;

  description:string;

  outcome?:string;

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

  associatedPeople:string[];

  triggers:string[];

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


  timeline:string[];


  participants:string[];


  emotions:string[];


  actions:string[];


  objects:string[];


  significance:number;



  sensory?:{


    visual:string[];


    audio:string[];


    atmosphere:string[];


  };



  outcome?:string;


};









export interface ObjectGenome {


identity:
ObjectIdentity;



/**
 * Universal changing state.
 */
state:
ObjectState;



history:
ObjectHistory;

experienceSignals:
ObjectExperienceSignal[];

lifecycle:
ExperienceLifecycle;



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