/**
 * =====================================================
 * QRE REVIK FIELD
 * =====================================================
 *
 * Evolution mechanics of meaning.
 *
 * NUVO discovers possibility.
 *
 * REVIK discovers transformation.
 *
 * NO DATABASE.
 * NO EXECUTION.
 * NO INDUSTRY.
 *
 * =====================================================
 */

import type {
  NuvoField,
} from "../nuvo/index.js";


export interface RevikField {


  evolutionChains:
    string[][];


  dominantMotion:
    string;


  futureStates:
    string[];


  evolutionStrength:
    number;


}




export function awakenRevik(

 nuvo:NuvoField

):RevikField {



const chains:string[][] = [];



if(
 nuvo.originPatterns.includes("memory")
){

 chains.push([

  "moment",

  "story",

  "legacy"

 ]);

}



if(
 nuvo.originPatterns.includes("connection")
){

 chains.push([

  "person",

  "relationship",

  "belonging"

 ]);

}



if(
 nuvo.emergencePatterns.includes("cinematic")
){

 chains.push([

  "experience",

  "emotion",

  "memory"

 ]);

}



const futureStates = [

 ...new Set(

 chains.map(

 chain =>

 chain[chain.length - 1]

 )

 )

];



return {


 evolutionChains:

 chains,


 dominantMotion:

 chains.length

 ? "transformation"

 : "stagnation",


 futureStates,


 evolutionStrength:

 Math.min(

 1,

 chains.length / 3

 )


};



}