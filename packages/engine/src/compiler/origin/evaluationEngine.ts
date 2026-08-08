/**
 * =====================================================
 * ORIGIN EVALUATION ENGINE
 * =====================================================
 *
 * Compares semantic evolution rather than
 * fixed experience states.
 *
 * Previous Meaning
 *        ↓
 * Current Meaning
 *        ↓
 * Semantic Improvement
 *
 * NO TEMPLATES
 * NO FIXED SCORES
 * =====================================================
 */

export interface ExperienceEvaluation{

 coherence:number;

 semanticGrowth:number;

 conceptualNovelty:number;

 stability:number;

 overall:number;

 findings:string[];

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





function overlap(

 a:string[]=[],

 b:string[]=[]

):number{


 if(!a.length || !b.length){

  return 0;

 }


 const shared =

  a.filter(

   value=>b.includes(value)

  ).length;


 return shared/

 Math.max(

  a.length,

  b.length

 );


}





export function evaluateExperience(

 current:{

  concepts?:string[];

  patterns?:string[];

 },

 previous:{

  concepts?:string[];

  patterns?:string[];

 }

):ExperienceEvaluation{


 const currentConcepts =

  unique(current.concepts);


 const previousConcepts =

  unique(previous.concepts);


 const coherence =

  overlap(

   currentConcepts,

   previousConcepts

  );


 const novelConcepts =

  currentConcepts.filter(

   concept=>

   !previousConcepts.includes(concept)

  );


 const conceptualNovelty =

  currentConcepts.length

  ? novelConcepts.length/

    currentConcepts.length

  : 0;


 const semanticGrowth =

  Math.min(

   1,

   coherence +

   conceptualNovelty

  );


 const stability =

  coherence;


 const findings:string[]=[];


 if(novelConcepts.length){

  findings.push(

   `Emerged concepts: ${novelConcepts.join(", ")}`

  );

 }


 if(coherence<0.3){

  findings.push(

   "Meaning shifted significantly."

  );

 }else if(coherence>0.8){

  findings.push(

   "Core meaning remained stable."

  );

 }


 return{

  coherence,

  semanticGrowth,

  conceptualNovelty,

  stability,

  overall:

   (

    coherence+

    semanticGrowth+

    conceptualNovelty+

    stability

   )/4,

  findings

 };


}