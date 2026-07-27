/**
 * =====================================================
 * ORIGIN MEMORY FIELD
 * =====================================================
 *
 * Stores significance, not data.
 *
 * The question:
 *
 * "What should remain meaningful?"
 *
 * =====================================================
 */


export interface MemoryField {

  moments:string[];

  significance:number[];

  emotionalThreads:string[];

  futureEchoes:string[];

}




export function buildMemoryField(

 concepts:string[],

 emotions:string[]

):MemoryField {


 return {


  moments:

   concepts,


  significance:

   concepts.map(
    () => 0.8
   ),


  emotionalThreads:

   emotions,


  futureEchoes:

   [
    "meaning preservation",
    "future reflection"
   ]


 };


}