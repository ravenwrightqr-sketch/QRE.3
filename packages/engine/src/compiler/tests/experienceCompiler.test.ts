/**
 * =====================================================
 * EXPERIENCE COMPILER INTEGRATION TEST
 * =====================================================
 *
 * Prompt
 *    ↓
 * Understanding
 *    ↓
 * Genome
 *    ↓
 * Experience Compiler
 *    ↓
 * Blueprint
 *
 * =====================================================
 */

import {
  buildExperienceGenome,
} from "../semantic/genome/genomeBuilder.js";


import {
  compileExperience,
} from "../experience/experienceCompiler.js";




function runTest(

 name:string,

 prompt:string

){


console.log("\n====================================");
console.log(name);
console.log("====================================");



const genome =

  buildExperienceGenome(
    prompt
  );



console.log("\nGENOME:");
console.dir(
  genome,
  {
    depth: null
  }
);




const blueprint =

  compileExperience(
    genome
  );



console.log("\nBLUEPRINT:");
console.dir(
  blueprint,
  {
    depth: null
  }
);



if(!blueprint){

 throw new Error(
  "Blueprint was not created"
 );

}



console.log(
 "\n✓ EXPERIENCE COMPILED"
);



}






runTest(

"DISNEY MEMORY EXPERIENCE",

`
Create a magical birthday memory experience
for my daughter at Disneyland.
Capture this moment forever.
`

);





runTest(

"UNDERGROUND CINEMATIC WORLD",

`
Create an underground cinematic music experience
where people discover hidden worlds and connect.
`

);





runTest(

"LUXURY MEMORY CAPSULE",

`
Create a luxury travel memory capsule
that preserves a couple's journey forever.
`

);



console.log("\n====================================");
console.log("EXPERIENCE COMPILER TESTS PASSED");
console.log("====================================");