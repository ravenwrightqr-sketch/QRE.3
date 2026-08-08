/**
 * =====================================================
 * QRE COGNITIVE ATTENTION ENGINE
 * =====================================================
 *
 * ROLE:
 *
 * Determines which signals deserve deeper
 * reasoning resources.
 *
 *
 * Attention is not filtering.
 *
 * Attention is prioritization.
 *
 * =====================================================
 */


import type {
 Attention
} from "@qre/contracts";




export function attention(

 signals:string[]

):Attention {



 const ranking = signals.map(
  
  signal => {


   const text =
    signal.toLowerCase();



   const novelty =
    text.includes("new")
    ||
    text.includes("unknown")
    ||
    text.includes("hidden")
    ? .9
    : .5;



   const emotionalWeight =
    text.includes("love")
    ||
    text.includes("memory")
    ||
    text.includes("family")
    ||
    text.includes("relationship")
    ? .9
    : .4;



   const futureImpact =
    text.includes("future")
    ||
    text.includes("evolve")
    ||
    text.includes("growth")
    ? .8
    : .5;



   const conflictLevel =
    text.includes("problem")
    ||
    text.includes("contradiction")
    ||
    text.includes("risk")
    ? .8
    : .2;



   const score =

    (
      novelty +
      emotionalWeight +
      futureImpact +
      conflictLevel
    )
    /
    4;



   return {

    signal,

    score

   };


  }


 )
 .sort(
  (a,b)=>
   b.score-a.score
 );



 const selected =

 ranking
 .slice(0,3)
 .map(
  item =>
   item.signal
 );



 const priority =

 selected.length === 0

 ? 0

 :

 ranking[0]?.score ?? 0;



 return {


  signals,


  selected,


  priority,



  reason:

   "Attention allocated using novelty, emotion, future impact, and conflict analysis.",



  novelty:

   ranking[0]?.score ?? 0,



  emotionalWeight:

   .5,



  futureImpact:

   .5,



  conflictLevel:

   .2,



  confidence:

   selected.length > 0
   ? .8
   : 0,



  ranking



 };

}