/**
 * =====================================================
 * QRE MOVER ARC CONTRACT
 * =====================================================
 *
 * Transformation Movement Layer.
 *
 * SemanticIR:
 * "What does it mean?"
 *
 * Genome:
 * "What exists?"
 *
 * NUVO:
 * "What could become?"
 *
 * REVIK:
 * "How does it evolve?"
 *
 * MOVER ARC:
 * "How does transformation move?"
 *
 *
 * Defines:
 *
 * - transformation stages
 * - movement direction
 * - identity transitions
 * - emotional movement
 * - state changes
 * - narrative progression
 * - possibility realization
 *
 *
 * NO DATABASE.
 * NO RUNTIME.
 * NO EXECUTION.
 * NO INDUSTRY LOGIC.
 *
 * =====================================================
 */



export type MoverDirection =
  | "emergence"
  | "growth"
  | "discovery"
  | "healing"
  | "connection"
  | "transformation"
  | "transcendence";


export type MoverStageType =
  | "origin"
  | "awakening"
  | "challenge"
  | "shift"
  | "integration"
  | "legacy";




export interface MoverNode {
  id:string;
  label:string;
  state:string;
  stage:MoverStageType;
  meaning:string;
 /**
  * What identity exists here?
  */
 identity:string;
 /**
  * Emotional gravity of this state
  */
 emotionalWeight:number;
 /**
  * Future potential
  */
 possibilityWeight:number;
 /**
  * Confidence from compiler
  */
 confidence:number;

}

export interface MoverTransition {

  from:string;
  to:string;
  movement:MoverDirection;
  trigger:string;
  meaning:string;
  /**
   * Emotional force behind movement
   */
  emotionalForce:string;
  /**
   * Why this transition exists
   */
  transformationReason:string;
  /**
   * Probability pressure from NUVO
   */
  possibilityWeight:number;
  /**
   * Evolution pressure from REVIK
   */
  evolutionWeight:number;
  strength:number;
}

export interface MoverIdentityShift {

  before:string;
  after:string;
  reason:string;
  emotionalChange:string;

}

export interface MoverArcQuestion {

  question:string;
  purpose:string;
  unresolved:boolean;

}
export interface MoverConnection {

 from:string;

 to:string;

 attraction:number;

 resistance:number;

 emotionalGravity:number;

 narrativePotential:number;

}


export interface MoverTopology {

 nodes:MoverNode[];

 connections:MoverConnection[];

 dominantPath:string[];

 transformationDensity:number;

}

export interface MoverArc {

 origin:string;

 destination:string;

 nodes:MoverNode[];

 transitions:MoverTransition[];

 identityShifts:MoverIdentityShift[];

 emotionalMovements:string[];

 dominantDirection:MoverDirection;

 unansweredQuestions:MoverArcQuestion[];

 futureStates:string[];

 /**
  * The dominant transformation force
  */
 transformationForce:string;


 /**
  * Where movement wants to go
  */
 movementVector:string;


 /**
  * Number of possible futures
  */
 possibilityCount:number;


 transformationStrength:number;


 confidence:number;


 version:number;

}



