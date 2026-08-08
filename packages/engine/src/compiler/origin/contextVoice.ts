/**
 * =====================================================
 * CONTEXT VOICE ENGINE
 * =====================================================
 *
 * Semantic Context
 *        ↓
 * Voice Adaptation
 *
 * Determines how meaning should be expressed
 * within the current context.
 *
 * NO TEMPLATES
 * NO FIXED TONES
 * NO SCRIPTED PHRASES
 *
 * =====================================================
 */

export interface ContextVoice{

 audience:string;

 tone:string;

 expression:string;

 characteristics:string[];

}





function unique(

 values:string[]=[]

):string[]{

 return [

  ...new Set(

   values.filter(Boolean)

  )

 ];

}





function resolveTone(

 context:{

  audience:string;

  emotion:string;

 },

 synthesis:any

):string{


 const signals = unique([

  context.emotion,

  ...(synthesis.connectedPatterns ?? []),

  synthesis.futureSignal,

  synthesis.dominantMeaning

 ]);


 if(signals.length===0){

  return "neutral";

 }


 return signals.join(" • ");


}





function buildExpression(

 synthesis:any,

 context:any

):string{


 const ideas = unique([

  synthesis.dominantMeaning,

  synthesis.futureDirection,

  ...(synthesis.connectedPatterns ?? [])

 ]);


 return ideas.join(" → ");


}





export function createContextVoice(

 synthesis:any,

 context:{

  audience:string;

  emotion:string;

 }

):ContextVoice{


 const characteristics = unique([

  context.audience,

  context.emotion,

  synthesis.futureSignal,

  ...(synthesis.connectedPatterns ?? [])

 ]);


 return {

  audience:

   context.audience,


  tone:

   resolveTone(

    context,

    synthesis

   ),


  expression:

   buildExpression(

    synthesis,

    context

   ),


  characteristics

 };


}