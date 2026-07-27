/**
 * =====================================================
 * ORIGIN VOICE ENGINE
 * =====================================================
 *
 * Converts synthesized meaning
 * into natural language.
 *
 * =====================================================
 */


export interface OriginVoice {

  title:string;

  statement:string;

  narrative:string;

}




export function generateVoice(

 synthesis:any

):OriginVoice {


 const title =

 `${capitalize(
 synthesis.dominantMeaning
 )} Beyond Time`;



 const statement =

 `${synthesis.dominantMeaning} evolves through ${synthesis.futureDirection}.`;



 const narrative =

 [

  `A ${synthesis.dominantMeaning} begins.`,

  `It grows through ${synthesis.emergingPatterns.join(", ")}.`,

  synthesis.futureDirection

 ].join(" ");



 return {

  title,

  statement,

  narrative

 };

}



function capitalize(
 value:string
){

 return (

 value.charAt(0).toUpperCase()

 +

 value.slice(1)

 );

}