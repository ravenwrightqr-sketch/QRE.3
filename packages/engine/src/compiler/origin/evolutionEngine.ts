/**
 * =====================================================
 * ORIGIN EVOLUTION ENGINE
 * =====================================================
 *
 * Semantic State Evolution.
 *
 * Previous Meaning
 *        ↓
 * Current Meaning
 *        ↓
 * Evolution Analysis
 *
 * Detects:
 *
 * - emergence
 * - persistence
 * - disappearance
 * - transformation
 *
 * NO TEMPLATES
 * NO FIXED PATHS
 *
 * =====================================================
 */


export interface EvolutionState {


  previous:string[];


  current:string[];


  emerged:string[];


  preserved:string[];


  disappeared:string[];


  transformed:string[];


  evolutionStrength:number;


}





function unique(

 values:string[]

):string[]{


 return [

  ...new Set(

   values.filter(Boolean)

  )

 ];

}





function similarity(

 a:string[],

 b:string[]

):number{


 if(!a.length && !b.length){

  return 1;

 }


 const shared =

  a.filter(

   value => b.includes(value)

  ).length;



 return shared /

 Math.max(

  a.length,

  b.length

 );

}





export function evolve(


 previous:string[],


 current:string[]


):EvolutionState {



 const before =

  unique(previous);



 const after =

  unique(current);





 const emerged =

  after.filter(

   item =>

    !before.includes(item)

  );





 const preserved =

  after.filter(

   item =>

    before.includes(item)

  );





 const disappeared =

  before.filter(

   item =>

    !after.includes(item)

  );





 const transformed =

  emerged.filter(

   item =>

    disappeared.length > 0

  );





 const similarityScore =

  similarity(

   before,

   after

  );





 const novelty =

  emerged.length /

  Math.max(

   after.length,

   1

  );





 return {


  previous:before,


  current:after,


  emerged,


  preserved,


  disappeared,


  transformed,


  evolutionStrength:

   Math.min(

    1,

    (

     novelty +

     (1 - similarityScore)

    ) / 2

   )


 };


}