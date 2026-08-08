/**
 * =====================================================
 * ORIGIN MEMORY FIELD
 * =====================================================
 *
 * Semantic Memory Structure.
 *
 * Stores significance patterns,
 * not raw information.
 *
 * Question:
 *
 * "What meaning survives?"
 *
 * =====================================================
 */


export interface MemoryField {


  moments:string[];


  significance:number[];


  emotionalThreads:string[];


  futureEchoes:string[];


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







function calculateSignificance(

 concept:string,

 emotions:string[]

):number {


 const emotionalConnection =

  emotions.filter(

   emotion =>

    concept.includes(emotion)

  ).length;



 return Math.min(

  1,

  .3 +

  emotionalConnection * .2

 );

}








function discoverFutureEchoes(

 concepts:string[],

 emotions:string[]

):string[] {


 return unique([

  ...concepts,

  ...emotions

 ]);

}








export function buildMemoryField(


 concepts:string[],


 emotions:string[]


):MemoryField {



 const meaningfulConcepts =

  unique(concepts);



 const emotionalThreads =

  unique(emotions);





 return {


  moments:

   meaningfulConcepts,



  significance:


   meaningfulConcepts.map(

    concept =>

     calculateSignificance(

      concept,

      emotionalThreads

     )

   ),



  emotionalThreads,



  futureEchoes:


   discoverFutureEchoes(

    meaningfulConcepts,

    emotionalThreads

   )


 };


}