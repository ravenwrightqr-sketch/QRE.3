/**
 * =====================================================
 * QRE OBJECT MOMENT PIPELINE TEST
 * =====================================================
 *
 * Tests:
 *
 * Prompt
 *   ↓
 * GameMaster
 *   ↓
 * ExperienceGenome
 *   ↓
 * ObjectGenome
 *   ↓
 * ObjectMoments
 *   ↓
 * ExperienceBlueprint
 *
 * =====================================================
 */


import {
  gameMaster,
} from "../src/compiler/gamemaster/gameMaster.js";




const tests = [

{
name:
"PET MEMORY",

prompt:
"Create a QR memory experience for my dog who goes everywhere with me, Starbucks, parks, road trips, and adventures."

},


{
name:
"CONCERT MEMORY",

prompt:
"Create a QR art memory from my Death By Romy concert experience where the night feels dark, emotional, and unforgettable."

},


{
name:
"FIRST CHILD TIMELINE",

prompt:
"Create a QR life story timeline for my first child from birth through childhood."

},


{
name:
"CYBERPUNK EXPERIENCE",

prompt:
"Create a dark cyberpunk meet up for lesbians"

}

];





for(
 const test of tests
){

console.log(
"\n\n================================="
);


console.log(
test.name
);


console.log(
"=================================\n"
);



const result = gameMaster(
 test.prompt
);



console.log(
"OBJECT TYPE:"
);



console.log(

result.genome?.object?.identity?.type

);



console.log(
"\nOBJECT MOMENTS:"
);



console.log(

JSON.stringify(

result.genome?.object?.moments,

null,

2

)

);



console.log(
"\nBLUEPRINT MOMENTS:"
);



console.log(

JSON.stringify(

result.blueprint?.moments,

null,

2

)

);



console.log(
"\nFULL RESULT:"
);



console.log(

JSON.stringify(

result,

null,

2

)

);


}