/**
 * =====================================================
 * QRE OBJECT COMPILER TYPES
 * =====================================================
 *
 * Semantic Signals
 *        ↓
 * Object Identity
 *        ↓
 * Object Genome
 *
 * Everything can become meaningful.
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


import type {

  ObjectGenome,
  ObjectMoment,
  ObjectRelationship,

} from "@qre/contracts";





/**
 * Semantic input entering
 * the object intelligence layer.
 */
export type ObjectCompilationInput = {


  /**
   * Original human expression.
   */
  prompt:string;




  /**
   * Recognized entities.
   *
   * Produced by entity intelligence.
   */
  entities?: {


    people?:string[];


    places?:string[];


    objects?:string[];


    creatures?:string[];


    products?:string[];


    media?:string[];

  };





  /**
   * Meaning signals.
   */
  meaning?: {


    desiredFeeling?:string[];


    symbols?:string[];


    themes?:string[];


  };





  /**
   * Emotional intelligence.
   */
  emotions?: {


    emotions?:string[];


    intensity?:number;


  };





  /**
   * Memory signals.
   */
  memory?: {


    replay?:boolean;


    timeCapsule?:boolean;


    memories?:string[];


    markers?:string[];

  };





  /**
   * Existing semantic relationships.
   */
  relationships?: {


    subject?:string;


    predicate?:string;


    object?:string;


    confidence?:number;


  }[];





  /**
   * Creative DNA signals.
   */
  dna?: {


    traits?:string[];


  };


};







export type {


  ObjectGenome,


  ObjectMoment,


  ObjectRelationship,


};