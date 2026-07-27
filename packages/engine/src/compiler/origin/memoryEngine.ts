/**
 * =====================================================
 * ORIGIN MEMORY ENGINE
 * =====================================================
 *
 * Converts experience states
 * into persistent meaning.
 *
 * =====================================================
 */


export interface OriginMemory {


 sourceScene:string;


 imprint:string;


 emotionalWeight:number;


 meaning:string;


 futureInfluence:string;


}





export function createMemory(

 state:any

):OriginMemory {


 return {


  sourceScene:

   state.sceneId,



  imprint:

   `${state.action} created a meaningful transition.`,



  emotionalWeight:

   0.8,



  meaning:

   state.memoryImpact,



  futureInfluence:

   state.nextPotential


 };


}