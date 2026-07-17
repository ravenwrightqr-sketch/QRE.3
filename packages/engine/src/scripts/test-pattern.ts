import { resolvePattern } from "../compiler/patternResolver.js";


const tests = [

{
 prompt:
 "Dog walker picked up Fido, walked him 2 miles, sent photos and brought him home",

 industry:
 "service",

 goal:
 "service"

},


{
 prompt:
 "10pm Apocalypse Rave unforgettable night with friends",

 industry:
 "event",

 goal:
 "experience"

},


{
 prompt:
 "Cannabis strain passport with terpene information",

 industry:
 "cannabis",

 goal:
 "product"

},


{
 prompt:
 "Restaurant customer loyalty experience",

 industry:
 "restaurant",

 goal:
 "loyalty"

},


{
 prompt:
 "Wedding memory time capsule",

 industry:
 "wedding",

 goal:
 "memory"

}

];



for(const test of tests){


const result =
resolvePattern({

 prompt:
   test.prompt,

 industry:
   test.industry,

 goal:
   test.goal

});



console.log("\nPROMPT:");

console.log(
 test.prompt
);



console.log(
 "PATTERN:",
 result.type
);



console.log(
 "ATOMS:",
 result.atoms.map(a=>a.type)
);


}