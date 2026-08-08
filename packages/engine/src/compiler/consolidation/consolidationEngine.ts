import type {

 MemoryCandidate,
 ConsolidatedMemory

} from "./consolidationTypes.js";



export function consolidateMemory(

 memory:MemoryCandidate

):ConsolidatedMemory {


 const importance =

 (
  memory.emotionalWeight +

  memory.repetition +

  memory.futureInfluence

 )

 / 3;



 return {


  content:memory.content,


  importance,


  reason:

   importance > .7

   ? "Pattern has strong future significance."

   : "Pattern requires more reinforcement.",


  permanent:

   importance > .7


 };


}