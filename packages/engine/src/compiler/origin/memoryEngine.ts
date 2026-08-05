/**
 * =====================================================
 * ORIGIN MEMORY ENGINE
 * =====================================================
 *
 * Experience State
 *        ↓
 * Semantic Imprint
 *        ↓
 * Future Meaning Influence
 *
 * Converts experience changes into
 * reusable meaning structures.
 *
 * NO DATABASE
 * NO STORAGE
 * NO FIXED NARRATIVE
 *
 * =====================================================
 */


export interface OriginMemory {


 sourceScene:string;


 imprint:string[];


 emotionalWeight:number;


 meaning:string[];


 futureInfluence:string[];


 preservedSignals:string[];


}





function unique(

 values:string[]=[]

):string[] {


 return [

  ...new Set(

   values.filter(Boolean)

  )

 ];

}





function calculateEmotionalWeight(

 state:any

):number {


 const emotions =

  state.emotions

  ?? [];



 const significance =

  state.significance

  ?? 0;



 const change =

  state.transitionStrength

  ?? 0;



 return Math.min(

  1,

  (

   emotions.length * .15 +

   significance * .5 +

   change * .35

  )

 );

}





export function createMemory(

 state:any

):OriginMemory {



 if(!state){

  throw new Error(

   "Memory requires experience state."

  );

 }



 const meaning = unique([

  ...(state.meaningSignals ?? []),

  state.memoryImpact,

  state.action,

  state.transition

 ]);



 const preservedSignals = unique([

  ...(state.emotions ?? []),

  ...(state.concepts ?? []),

  ...(state.entities ?? [])

 ]);





 return {


  sourceScene:


   state.sceneId

   ??

   "unknown",



  imprint:


   meaning.length

   ? meaning

   : [

      "unresolved experience signal"

     ],



  emotionalWeight:


   calculateEmotionalWeight(

    state

   ),



  meaning,



  futureInfluence:


   unique([

    ...(state.nextPotential ?? []),

    ...meaning

   ]),



  preservedSignals


 };


}