import type {

 AdaptationInput,
 AdaptationResult

} from "./adaptiveTypes.js";




export function adapt(

 input:AdaptationInput

):AdaptationResult {


 const contradictionImpact =

 input.contradictions.length * 0.1;



 const evidenceImpact =

 input.newEvidence.length * 0.05;



 const change =

 evidenceImpact - contradictionImpact;



 const confidence =

 Math.min(

  1,

  Math.max(

   0,

   input.previousConfidence + change

  )

 );



 return {


  previousState:

   "existing understanding",



  updatedState:

   confidence > input.previousConfidence

   ? "expanded understanding"

   : "reconsidered understanding",



  confidenceChange:

   change,



  adaptationReason:

   `Updated from ${input.newEvidence.length} supporting signals and ${input.contradictions.length} contradictions.`


 };

}