/**
 * =====================================================
 * QRE KAIVO FIELD
 * =====================================================
 *
 * Meaning relationship lattice.
 *
 * REVIK discovers movement.
 *
 * KAIVO discovers resonance.
 *
 * NO DATABASE.
 * NO EXECUTION.
 *
 * =====================================================
 */

import type {
  RevikField,
} from "../revik/index.js";


export interface KaivoConnection {

  from:string;

  to:string;

  force:
    | "bond"
    | "memory"
    | "growth"
    | "identity"
    | "legacy";

  strength:number;

}



export interface KaivoField {


  connections:
    KaivoConnection[];


  resonanceNodes:
    string[];


  coherence:
    number;

}



export function awakenKaivo(

 revik:RevikField

):KaivoField {



const connections:KaivoConnection[] = [];



for(
 const chain of revik.evolutionChains
){


for(
 let i = 0;
 i < chain.length - 1;
 i++
){


connections.push({

 from:
  chain[i],

 to:
  chain[i + 1],

 force:

 chain[i + 1] === "legacy"

 ? "legacy"

 :

 chain[i + 1] === "memory"

 ? "memory"

 :

 "growth",


 strength:
 1

});


}


}



const resonanceNodes = [

 ...new Set(

 connections.flatMap(

 c =>

 [
  c.from,
  c.to
 ]

 )

 )

];



return {

 connections,


 resonanceNodes,


 coherence:

 Math.min(

 1,

  connections.length / 5

 )

};


}