import { experienceCompiler } from "../compiler/experienceCompiler.js";


const tests = [

"Dog walker picked up Fido, walked him 2 miles, sent photos and brought him home",

"Pool service arrived, cleaned the pool, sent before and after photos, customer can tip",

"10pm Apocalypse Rave unforgettable night with friends",

"Cannabis strain passport with terpene information",

"Wedding memory time capsule"

];


for (const prompt of tests) {

 const result =
   experienceCompiler(prompt);


 console.log("\n====================");
 console.log(prompt);

 console.log("\nTITLE:");
 console.log(result.title);


 console.log("\nMOMENTS:");
 console.log(
   result.blueprint.moments.map(
     m => m.type
   )
 );


 console.log("\nFLOW:");
 console.log(
   result.flowSteps.map(
     s => s.type
   )
 );

}