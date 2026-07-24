/**
 * =====================================================
 * QRE EXPERIENCE GENOME TEST
 * =====================================================
 *
 * Prompt
 *   ↓
 * Understanding
 *   ↓
 * Semantic Cortex
 *   ↓
 * Experience Genome
 *
 * Compiler validation
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */

import {
  buildExperienceGenome,
} from "../semantic/genome/genomeBuilder.js";




function printResult(

 title:string,

 genome:any

){

console.log(
"\n===================================="
);

console.log(
title
);

console.log(
"GENOME:"
);

console.dir(
 genome,
 {
  depth:10
 }
);

}





/**
 * =====================================================
 * TEST 1
 * MEMORY EXPERIENCE
 * =====================================================
 */


const memoryPrompt = `

Create a magical birthday memory experience
for my daughter at Disneyland.
Capture the moment forever.

`;



const memoryGenome =

buildExperienceGenome(
 memoryPrompt
);



printResult(
 "MEMORY EXPERIENCE",
 memoryGenome
);



if(
 memoryGenome.memory !== 1
){

throw new Error(
 "Memory experience failed memory detection"
);

}



if(
 !memoryGenome.dna.includes(
  "memory_driven"
 )
){

throw new Error(
 "Memory DNA missing"
);

}





/**
 * =====================================================
 * TEST 2
 * CINEMATIC COMMUNITY EXPERIENCE
 * =====================================================
 */


const cinematicPrompt = `

Build a cinematic underground music experience
where people discover hidden worlds and connect.

`;



const cinematicGenome =

buildExperienceGenome(
 cinematicPrompt
);



printResult(
 "CINEMATIC EXPERIENCE",
 cinematicGenome
);



if(
 cinematicGenome.social !== "community"
){

throw new Error(
 "Community detection failed"
);

}



if(
 !cinematicGenome.dna.includes(
  "human_connection"
 )
){

throw new Error(
 "Connection DNA missing"
);

}





/**
 * =====================================================
 * TEST 3
 * LUXURY MEMORY CAPSULE
 * =====================================================
 */


const luxuryPrompt = `

Create a luxury travel memory capsule
that preserves a couple's journey forever.

`;



const luxuryGenome =

buildExperienceGenome(
 luxuryPrompt
);



printResult(
 "LUXURY MEMORY EXPERIENCE",
 luxuryGenome
);



if(
 luxuryGenome.memory !== 1
){

throw new Error(
 "Luxury memory detection failed"
);

}



if(
 luxuryGenome.interpretation.confidence < 0.5
){

throw new Error(
 "Interpretation confidence invalid"
);

}





console.log(
`
====================================
GENOME TESTS PASSED
====================================
`
);