/**
 * =====================================================
 * ORIGIN NARRATIVE ENGINE
 * =====================================================
 *
 * Converts synthesized meaning into narrative motion.
 *
 * Not templates.
 * Not industry content.
 *
 * A transformation model.
 *
 * =====================================================
 */


export interface OriginNarrative {


  opening:string;


  tension:string;


  transformation:string;


  resolution:string;


  closing:string;


}





export function createNarrative(

 synthesis:any,

 voice:any

):OriginNarrative {



 const meaning =

 synthesis.dominantMeaning;



 const patterns =

 synthesis.emergingPatterns
 .join(", ");




 return {


  opening:

   `A ${meaning} begins as a moment waiting to be understood.`,



  tension:

   `Time creates uncertainty around whether the meaning will remain.`,



  transformation:

   `${meaning} evolves through ${patterns} and becomes something greater than the original moment.`,



  resolution:

   `What existed briefly becomes preserved through human significance.`,



  closing:

   voice?.expression ??

   synthesis.futureDirection


 };


}