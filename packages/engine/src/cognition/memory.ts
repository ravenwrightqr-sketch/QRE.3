/**
 * =====================================================
 * QRE COGNITION MEMORY CORE
 * =====================================================
 *
 * The Beast's experience memory layer.
 *
 * Responsibilities:
 *
 * - Record meaningful observations
 * - Track discovered patterns
 * - Track confidence
 * - Provide reflection history
 *
 * NO DATABASE
 * NO PRISMA
 * PURE COGNITION
 *
 * =====================================================
 */


export type MemoryType =

  | "experience"

  | "pattern"

  | "decision"

  | "failure"

  | "insight";




export type CognitiveMemory = {

  id:string;

  type:MemoryType;

  summary:string;

  confidence:number;

  context?:Record<string,unknown>;

  createdAt:string;

};





const memoryStore:CognitiveMemory[] = [];





/**
 * =====================================================
 * REMEMBER
 * =====================================================
 */

export function remember(

 memory:Omit<CognitiveMemory,"id"|"createdAt">

):CognitiveMemory {


 const entry:CognitiveMemory = {


  id:

    crypto.randomUUID(),



  createdAt:

    new Date().toISOString(),



  ...memory,


 };



 memoryStore.push(entry);



 return entry;

}





/**
 * =====================================================
 * RECALL
 * =====================================================
 */

export function recall():

readonly CognitiveMemory[] {


 return [

   ...memoryStore

 ];

}





/**
 * =====================================================
 * REFLECT ON EXPERIENCE
 * =====================================================
 */

export function reflectMemory(){


 return {


  total:

    memoryStore.length,


  strongestSignals:

    memoryStore

      .filter(

        m => m.confidence >= .8

      ),


 };

}