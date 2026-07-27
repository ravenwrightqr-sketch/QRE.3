/**
 * =====================================================
 * CONTEXT VOICE ENGINE
 * =====================================================
 *
 * Meaning adapts to context.
 *
 * =====================================================
 */


export interface ContextVoice {

 audience:string;

 tone:string;

 expression:string;

}





export function createContextVoice(

 synthesis:any,

 context:{

  audience:string;

  emotion:string;

 }

):ContextVoice {



 let tone =
 "reflective";



 if(
  context.emotion === "wonder"
 ){

  tone = "cinematic";

 }



 if(
  context.emotion === "love"
 ){

  tone = "intimate";

 }



 const expression =

 `${synthesis.dominantMeaning} becomes ${synthesis.futureDirection} through ${context.audience}.`;



 return {


  audience:

   context.audience,


  tone,


  expression


 };

}