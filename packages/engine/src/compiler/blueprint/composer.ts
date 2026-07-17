/**
 * =====================================================
 * QRE EXPERIENCE BLUEPRINT COMPOSER
 * =====================================================
 *
 * Creative assembly layer.
 *
 * Intent
 *   ↓
 * Industry Template
 *   ↓
 * Goal
 *   ↓
 * Experience DNA
 *   ↓
 * Moments
 *   ↓
 * Experience Blueprint
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  ExperienceBlueprint,
  ExperienceGoal,
  ExperienceMoment,
  ExperienceMomentType,
  ExperienceTone,
  ExperienceEntities,
  ExperienceType,
  ExperienceComponent,
} from "@qre/contracts";


import {
  generateExperienceTitle,
} from "../personalization/titleGenerator.js";


import {
  narrateMoment,
} from "../personalization/momentNarrator.js";


import {
  industryTemplates,
} from "../templates/index.js";


import type {
  DetectedIntent,
} from "../parser/intentDetector.js";

import {
  resolvePattern,
} from "../patternResolver.js";
 



import {
 atomToMomentType,
} from "../atoms/atomMapper.js";





// =====================================================
// GOAL DETECTION
// =====================================================
function detectGoal(
 detected:DetectedIntent
){

 return {

   goal:
     detected.goal,


   preferredMoments:
     [] as readonly ExperienceMomentType[],

 };

}







// =====================================================
// EXPERIENCE TYPE
// =====================================================

function detectExperienceType(
 detected:DetectedIntent
):ExperienceType {


 switch(detected.industry){


 case "memory":
 case "legacy":

   return "time_capsule";


 case "relationship":
 case "wedding":

   return "story";


 case "concert":
 case "event":
 case "festival":
 case "show":

   return "event";


 case "pet":

   return "tribute";


 case "artist":

   return "collection";


 case "business":
 case "restaurant":
 case "cannabis":
 case "retail":

   return "business";


 default:

   return "journey";

 }

}








// =====================================================
// EXPERIENCE DNA
// =====================================================

function detectDNA(
 detected:DetectedIntent
):ExperienceTone[] {


 switch(detected.industry){


 case "cannabis":
   return [
    "premium",
    "trustworthy"
   ];


 case "pet":
   return [
    "friendly",
    "emotional"
   ];


 case "wedding":
   return [
    "emotional",
    "cinematic"
   ];


 case "event":
   return [
    "viral",
    "cinematic"
   ];


 default:
   return [
    "friendly"
   ];

 }

}








// =====================================================
// MOMENT → COMPONENT
// =====================================================

function resolveComponent(
 type:ExperienceMomentType
):ExperienceComponent {


 switch(type){


 case "welcome":
 case "introduction":

   return "hero";



 case "story":
 case "memory":
 case "meeting":
 case "legacy":
 case "love_story":
 case "proposal":
 case "ceremony":
 case "adoption_story":
 case "pet_story":
 case "pet_journey":

   return "story";



 case "photos":
 case "wedding_gallery":

   return "gallery";



 case "video":
 case "performance":
 case "artist":
 case "setlist":
 case "crowd":
 case "backstage":

   return "video";



 case "timeline":
 case "highlights":
 case "replay":
 case "pet_birthday":
 case "time_capsule":

   return "timeline";



 case "location":
 case "arrival":
 case "lost_pet":
 case "honeymoon":

   return "geo_memory";



 case "product":
 case "offer":
 case "merch":
 case "strain_profile":
 case "product_passport":
 case "lab_results":
 case "terpene_profile":
 case "batch_history":

   return "product";



 case "education":
 case "effects_guide":

   return "education";



 case "reward":

   return "reward";



 case "payment":
 case "booking":

   return "payment";



 case "review":

   return "review";



 case "social":
 case "share":
 case "reaction":

   return "social";



 case "guestbook":
 case "guest_messages":

   return "guestbook";



 case "pet_profile":
 case "pet_health":
 case "medical_profile":
 case "emergency_info":
 case "care_instructions":

   return "profile";



 case "venue":

   return "map";



 default:

   return "cta";

 }

}








// =====================================================
// PAYLOAD
// =====================================================

function buildMomentPayload(
 type:ExperienceMomentType,
 entities:ExperienceEntities
){


 const component =
   resolveComponent(type);



 const narration =
   narrateMoment(

    type,

    {

      location:
        entities.places[0],

      person:
        entities.people[0],

      product:
        entities.products[0],

    }

   );



 return {


  component,


  headline:
    narration.title,


  editable:true,


  demo:true,



  ...(component==="story" && {

    prompt:
      "Tell the story behind this moment",

    media:true,

  }),



  ...(component==="geo_memory" && {

    captureLocation:true,

    snapshot:true,

    timeline:true,

  }),



  ...(component==="gallery" && {

    upload:true,

  }),



  ...(component==="video" && {

    media:true,

  }),



  ...(component==="product" && {

    interactive:true,

  }),



 };

}









// =====================================================
// MOMENTS
// =====================================================

function buildMoments(

 moments:readonly ExperienceMomentType[],

 entities:ExperienceEntities

):ExperienceMoment[]{


 return moments.map(

 (type,index)=>{


 const component =
   resolveComponent(type);



 const narration =
   narrateMoment(

    type,

    {

     location:
       entities.places[0],

     person:
       entities.people[0],

     product:
       entities.products[0],

    }

   );



 return {


  type,


  component,


  title:
    narration.title,


  subtitle:
    narration.subtitle,


  editable:true,


  demo:true,


  order:index,


  payload:
    buildMomentPayload(

      type,

      entities

    ),

 };

 }

 );

}


// =====================================================
// COMPOSE
// =====================================================

export function composeBlueprint(

  detected:DetectedIntent,

  entities:ExperienceEntities,

  prompt:string

):ExperienceBlueprint {


 const pattern =
   resolvePattern({

     prompt,

     industry:
       detected.industry,

     goal:
       detected.goal,

   });



 const goal =
   detectGoal(detected);



 const type =
   detectExperienceType(detected);



 const tone =
   detectDNA(detected);

console.log(
  "ATOM TYPES",
  pattern.atoms.map(atom => atom.type)
);

 const atomMoments =
   pattern.atoms.map(

     atom =>
       atomToMomentType(atom)

   );



 const moments =
   atomMoments.length
     ? atomMoments
     : goal.preferredMoments;




 return {


 title:

   generateExperienceTitle({

    type,

    industry:
      detected.industry,

    entities,

   }),



 industry:
   detected.industry,



 type,



 goal:
   goal.goal,



 tone:
   tone.length
    ? tone
    : ["friendly"],



 moments:

   buildMoments(

    moments,

    entities

   ),



 entities,


 };

}




