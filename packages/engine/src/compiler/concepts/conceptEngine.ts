/**
 * =====================================================
 * QRE CONCEPT AWAKENING
 * =====================================================
 *
 * Semantic Signals
 *        ↓
 * Human Concepts
 *
 * Converts raw meaning into
 * universal experience concepts.
 *
 * NO DATABASE
 * NO EXECUTION
 * NO INDUSTRY LOGIC
 *
 * =====================================================
 */


import {

  CONCEPT_LEXICON,

} from "./lexicon.js";


import type {

  ExperienceConcept,

} from "./lexicon.js";





export interface ConceptAwakening {


  concepts:

    ExperienceConcept[];



  confidence:

    number;


}




export function awakenConcepts(

  signals: {

    emotions?: string[];

    themes?: string[];

    dna?: string[];

    intent?: string[];

  }

):ConceptAwakening {



const discovered = new Set<ExperienceConcept>();



const searchable = [

 ...(signals.emotions ?? []),

 ...(signals.themes ?? []),

 ...(signals.dna ?? []),

 ...(signals.intent ?? [])

]

.map(

 value =>

 value.toLowerCase()

);





for(

 const concept of CONCEPT_LEXICON

){


for(

 const signal of searchable

){


if(

 concept.emotions.includes(signal)

 ||

 concept.movement.includes(signal)

 ||

 concept.name === signal

){


discovered.add(

 concept.name

);


}



}



}





return {


concepts:

[

 ...discovered

],



confidence:

 discovered.size

 ?

 1

 :

 0.25



};



}




export const conceptAwakening =

awakenConcepts;