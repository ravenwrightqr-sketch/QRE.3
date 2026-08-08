/**
 * =====================================================
 * ORIGIN RESONANCE ENGINE
 * =====================================================
 *
 * Determines how strongly a memory
 * connects to existing meaning.
 *
 * =====================================================
 */


export interface MemoryResonance {


 memory:string;


 connectedPatterns:string[];


 resonanceStrength:number;


 futureSignal:string;


}





export function analyzeResonance(

 memory:any,

 existing:any[]

):MemoryResonance {



 const connectedPatterns = [

  memory.futureInfluence,

  memory.meaning

 ];




 return {


  memory:

   memory.sourceScene,



  connectedPatterns,



  resonanceStrength:

   existing.length > 0

   ? 0.9

   : 0.5,



  futureSignal:

   "increase meaning preservation"


 };


}