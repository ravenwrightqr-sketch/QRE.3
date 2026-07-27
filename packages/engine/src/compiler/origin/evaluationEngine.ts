/**
 * =====================================================
 * ORIGIN EVALUATION ENGINE
 * =====================================================
 *
 * Measures experiential improvement.
 *
 * =====================================================
 */


export interface ExperienceEvaluation {


 coherence:number;


 emotionalDepth:number;


 transformation:number;


 overall:number;


 improvement:string;


}





export function evaluateExperience(

 future:any,

 previous:any

):ExperienceEvaluation {



 const coherence =

 future.direction

 ? 0.9

 : 0.3;



 const emotionalDepth =

 future.purpose.includes(
 "human"
 )

 ? 0.9

 : 0.5;



 const transformation =

 future.direction.includes(
 "deepen"
 )

 ? 0.8

 : 0.4;



 return {


  coherence,


  emotionalDepth,


  transformation,


  overall:

   (

    coherence +

    emotionalDepth +

    transformation

   ) / 3,



  improvement:

   "Experience evolved toward deeper human significance."


 };


}