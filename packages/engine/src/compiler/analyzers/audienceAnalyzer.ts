/**
 * =====================================================
 * QRE EXPERIENCE AUDIENCE ANALYZER
 * =====================================================
 *
 * TYPE:
 * Analyzer
 *
 * RESPONSIBILITY:
 * Understands who the experience is created for.
 *
 * INPUT:
 * Human prompt text
 *
 * OUTPUT:
 * AudienceUnderstanding
 *
 * DOES NOT:
 * - build experiences
 * - compile flows
 * - execute runtime
 * - manage users
 *
 * =====================================================
 */


import type {
  AudienceUnderstanding
} from "../models/understandingTypes.js";




const audienceSignals = {


fans: [
  "fan",
  "follower",
  "artist",
  "music",
  "concert",
  "album"
],



family: [
  "family",
  "wedding",
  "relationship",
  "bride",
  "groom",
  "anniversary"
],



business_owner: [
  "business",
  "customer",
  "brand",
  "client",
  "store",
  "company"
],



creator: [
  "creator",
  "artist",
  "designer",
  "maker"
],



community: [
  "community",
  "club",
  "group",
  "crowd",
  "members"
],



pet_owner: [
  "pet",
  "dog",
  "cat",
  "animal"
]

};



export function analyzeAudience(

 prompt:string

):AudienceUnderstanding {


const text =
prompt.toLowerCase();



const types:string[] = [];




for(
 const [type, signals]
 of Object.entries(audienceSignals)
){


if(
 signals.some(
  signal =>
   text.includes(signal)
 )
){

 types.push(
  type
 );

}


}




if(!types.length){

 types.push(
  "individual"
 );

}





let social:
AudienceUnderstanding["social"] =
"solo";



if(
 types.includes("community") ||
 types.includes("fans")
){

 social =
 "community";

}

else if(
 types.length > 1
){

 social =
 "shared";

}





return {


 types,


 social



};


}