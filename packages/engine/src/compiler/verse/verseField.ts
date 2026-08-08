/**
 * =====================================================
 * QRE VERSE FIELD
 * =====================================================
 *
 * Mythos
 *    ↓
 * Semantic Expression
 *    ↓
 * Verse
 *
 * Converts symbolic meaning into
 * adaptive narrative language.
 *
 * NO TEMPLATES
 * NO RUNTIME
 * NO DATABASE
 *
 * =====================================================
 */


import type {

 MythosField,

} from "../mythos/index.js";



export interface VerseField {


 opening:string;


 body:string[];


 closing:string;


 complete:string;


}




function createOpening(

 mythos:MythosField

):string {


 return [

   mythos.title,

   mythos.emotionalIntent

 ].filter(Boolean)

 .join(". ");

}





function createBody(

 mythos:MythosField

):string[] {


 return mythos.sceneSeeds.map(

  seed =>

   seed

 );


}





function createClosing(

 mythos:MythosField

):string {


 return mythos.emotionalIntent;

}





export function awakenVerse(

 mythos:MythosField

):VerseField {


 if(!mythos){

  throw new Error(
   "Mythos required."
  );

 }



 const opening =

  createOpening(

   mythos

  );



 const body =

  createBody(

   mythos

  );



 const closing =

  createClosing(

   mythos

  );



 return {


  opening,


  body,


  closing,


  complete:

   [

    opening,

    ...body,

    closing

   ]

   .filter(Boolean)

   .join("\n\n")


 };


}



export const verseField =

 awakenVerse;