/**
 * =====================================================
 * QRE EXPERIENCE AUDIENCE ANALYZER
 * =====================================================
 *
 * TYPE:
 * Analyzer
 *
 * RESPONSIBILITY:
 * Understands who enters the experience,
 * why they enter,
 * how they behave,
 * and what they expect.
 *
 * INPUT:
 * Human prompt
 *
 * OUTPUT:
 * AudienceUnderstanding
 *
 * DOES NOT:
 * - build experiences
 * - compile experiences
 * - execute experiences
 * - manage users
 *
 * =====================================================
 */


import type {
  AudienceUnderstanding
} from "../models/understandingTypes.js";




const audienceSignals: Record<string,string[]> = {


  fans: [
    "fan",
    "follower",
    "artist",
    "music",
    "concert",
    "album",
    "tour",
    "community"
  ],


  family: [
    "family",
    "wedding",
    "parent",
    "child",
    "anniversary",
    "birthday",
    "memory"
  ],


  business_owner: [
    "business",
    "brand",
    "customer",
    "client",
    "store",
    "company",
    "restaurant"
  ],


  creator: [
    "creator",
    "artist",
    "designer",
    "maker",
    "producer"
  ],


  explorer: [
    "discover",
    "explore",
    "hidden",
    "unknown",
    "adventure"
  ],


  community: [
    "community",
    "club",
    "group",
    "crowd",
    "strangers",
    "people",
    "members"
  ],


  collector: [
    "collect",
    "rare",
    "exclusive",
    "limited",
    "artifact"
  ],


  pet_owner: [
    "pet",
    "dog",
    "cat",
    "animal"
  ]


};





function unique(
 values:string[]
){

 return [
  ...new Set(
    values.filter(Boolean)
  )
 ];

}






function detectTypes(
 text:string
){

 const types:string[]=[];


 for(
  const [type,signals]
  of Object.entries(audienceSignals)
 ){

  if(
   signals.some(
    signal =>
    text.includes(signal)
   )
  ){

   types.push(type);

  }

 }


 if(!types.length){

  types.push(
   "individual"
  );

 }


 return unique(types);

}







function resolveSocial(
 types:string[]
):AudienceUnderstanding["social"] {


 if(
  types.includes("community") ||
  types.includes("fans")
 ){

  return "community";

 }


 if(
  types.length > 1
 ){

  return "shared";

 }


 return "solo";

}









function resolveRoles(
 types:string[]
){

 const roles:string[]=[];


 const map:Record<string,string[]>={


 fans:[
  "fan",
  "supporter",
  "participant"
 ],


 family:[
  "family_member",
  "witness",
  "memory_holder"
 ],


 business_owner:[
  "customer",
  "brand_owner"
 ],


 creator:[
  "creator",
  "maker"
 ],


 explorer:[
  "explorer",
  "discoverer"
 ],


 community:[
  "participant",
  "member"
 ],


 collector:[
  "collector",
  "keeper"
 ],


 pet_owner:[
  "companion"
 ]


 };


 for(
  const type of types
 ){

  roles.push(
   ...(map[type] ?? [])
  );

 }


 return unique(roles);

}









function resolveRelationship(
 social:AudienceUnderstanding["social"]
){


 if(
  social === "community"
 ){

  return [
   "shared_identity",
   "collective_memory",
   "social_connection"
  ];

 }


 if(
  social === "shared"
 ){

  return [
   "personal_connection",
   "shared_meaning"
  ];

 }


 return [
  "individual_journey",
  "personal_discovery"
 ];


}

function resolveBehaviors(
 text:string
):string[] {


 const behaviors:string[] = [];



 const rules: Array<[string, string[]]> = [

  [
   "exploration",
   [
    "discover",
    "explore",
    "hidden",
    "secret"
   ]
  ],


  [
   "reflection",
   [
    "memory",
    "remember",
    "legacy",
    "past"
   ]
  ],


  [
   "interaction",
   [
    "play",
    "game",
    "challenge",
    "choose"
   ]
  ],


  [
   "creation",
   [
    "create",
    "design",
    "make"
   ]
  ]

 ];




 for(
  const [
   behavior,
   signals
  ] of rules
 ){


  if(
   signals.some(
    (signal:string)=>
     text.includes(signal)
   )
  ){

   behaviors.push(
    behavior
   );

  }


 }



 return unique(
  behaviors
 );

}









function resolveExpectations(
 social:AudienceUnderstanding["social"]
){

 if(
  social === "community"
 ){

  return [
   "belonging",
   "participation",
   "connection"
  ];

 }


 return [
  "meaning",
  "value",
  "personal_result"
 ];

}









export function analyzeAudience(

 prompt:string

):AudienceUnderstanding {


 const text =
 prompt.toLowerCase();



 const types =
 detectTypes(text);



 const social =
 resolveSocial(types);



 return {


  types,


  social,


  roles:
   resolveRoles(types),



  relationship:
   resolveRelationship(
    social
   ),



  behaviors:
   resolveBehaviors(text),



  expectations:
   resolveExpectations(
    social
   ),



  primary:
   types[0]

 };


}