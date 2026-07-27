/**
 * =====================================================
 * QRE VERSE FIELD
 * =====================================================
 *
 * MYTHOS
 *    ↓
 * VERSE
 *
 * Narrative language realization.
 *
 * No runtime.
 * No database.
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



export function awakenVerse(

 mythos:MythosField

):VerseField {


const opening =

`${mythos.title} begins with a moment that matters.`;



const body =

mythos.sceneSeeds.map(

 seed =>

 `${seed} becomes part of a story that carries meaning.`

);



const closing =

`${mythos.emotionalIntent}`;



return {


opening,


body,


closing,


complete:

[
 opening,
 ...body,
 closing

].join("\n\n")


};


}



export const verseField =

awakenVerse;