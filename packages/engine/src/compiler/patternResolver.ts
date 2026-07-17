import type {
  ExperiencePattern,
} from "./patterns/patternTypes.js";

import {
  cannabisPattern,
} from "./patterns/cannabisPattern.js";

import {
  servicePattern,
} from "./patterns/servicePattern.js";


import {
  memoryPattern,
} from "./patterns/memoryPattern.js";


import {
  businessPattern,
} from "./patterns/businessPattern.js";


import {
  productPattern,
} from "./patterns/productPattern.js";


import {
  eventPattern,
} from "./patterns/eventPattern.js";



type ResolvePatternInput = {

  prompt:string;

  industry:string;

  goal?:string;

};





export function resolvePattern(
 input:ResolvePatternInput
):ExperiencePattern {


 const text =
   input.prompt.toLowerCase();

// =====================================================
// CANNABIS PRODUCT EXPERIENCES
// =====================================================

if (

 input.industry === "cannabis" ||

 text.includes("cannabis") ||

 text.includes("strain") ||

 text.includes("terpene") ||

 text.includes("lab results") ||

 text.includes("batch history")

) {

 return cannabisPattern;

}

 // =====================================================
 // PRODUCT EXPERIENCES
 // =====================================================

 if (

   text.includes("passport") ||

   text.includes("strain") ||

   text.includes("terpene") ||

   text.includes("lab") ||

   text.includes("batch") ||

   text.includes("product")

 ) {

   return productPattern;

 }





 // =====================================================
 // SERVICE EXPERIENCES
 // =====================================================

 if (

   text.includes("walker") ||

   text.includes("clean") ||

   text.includes("cleaned") ||

   text.includes("repair") ||

   text.includes("service") ||

   text.includes("arrived") ||

   text.includes("arrival") ||

   text.includes("picked up") ||

   text.includes("dropped off") ||

   text.includes("completed") ||

   text.includes("finished") ||

   text.includes("before and after") ||

   text.includes("tip")

 ) {

   return servicePattern;

 }





 // =====================================================
 // EVENT EXPERIENCES
 // =====================================================

 if (

   text.includes("rave") ||

   text.includes("concert") ||

   text.includes("festival") ||

   text.includes("show") ||

   text.includes("event") ||

   text.includes("party") ||

   text.includes("performance")

 ) {

   return eventPattern;

 }





 // =====================================================
 // BUSINESS EXPERIENCES
 // =====================================================

 if (

   input.goal === "loyalty" ||

   text.includes("restaurant") ||

   text.includes("customer") ||

   text.includes("loyalty") ||

   text.includes("booking") ||

   text.includes("merchant")

 ) {

   return businessPattern;

 }





 // =====================================================
 // MEMORY EXPERIENCES
 // =====================================================

 if (

   input.goal === "memory" ||

   text.includes("wedding") ||

   text.includes("relationship") ||

   text.includes("legacy") ||

   text.includes("time capsule") ||

   text.includes("anniversary") ||

   text.includes("family")

 ) {

   return memoryPattern;

 }





 // =====================================================
 // DEFAULT
 // =====================================================

 return servicePattern;

}