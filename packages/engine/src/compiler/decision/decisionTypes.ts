/**
 * =====================================================
 * QRE CREATIVE DECISION TYPES
 * =====================================================
 *
 * Determines experiential priority.
 *
 * Understanding
 *       ↓
 * Decision
 *       ↓
 * Experience Structure
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


export interface CreativeDecision {


  primaryMeaning:string;


  emotionalPriority:string[];


  memoryPriority:string[];


  scenePriorities:string[];


  rejectedPaths:string[];


  creativeDirection:string;


  confidence:number;


}