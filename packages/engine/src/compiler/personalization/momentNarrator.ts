/**
 * =====================================================
 * QRE MOMENT NARRATOR
 * =====================================================
 *
 * Converts raw experience moments into emotional
 * human language.
 *
 * Compiler creative layer.
 *
 * NO DATABASE
 * NO API
 * NO EXECUTION
 *
 * =====================================================
 */

import type {
  ExperienceMomentType,
} from "@qre/contracts";


export type MomentNarrative = {

  title:string;

  subtitle:string;

  description?:string;

};



type NarrativeContext = {

  industry?:string;

  location?:string;

  brand?:string;

  person?:string;

  product?:string;

};



const narratives:
Partial<Record<
ExperienceMomentType,
MomentNarrative
>> = {


welcome:{
 title:"the experience ",
 subtitle:"welcome",
 description:"A moment created for you.",
},


message:{
 title:"A message created for this moment",
 subtitle:"message",
},


introduction:{
 title:"Where the story begins",
 subtitle:"introduction",
},


education:{
 title:"Discover something new",
 subtitle:"education",
},


story:{
 title:"The story behind this moment",
 subtitle:"story",
},


memory:{
 title:"A moment worth remembering",
 subtitle:"memory",
},


meeting:{
 title:"The moment everything changed",
 subtitle:"meeting",
},


location:{
 title:"The place where this memory lives",
 subtitle:"location",
},


arrival:{
 title:"You have arrived",
 subtitle:"arrival",
},


photos:{
 title:"Moments we never want to forget",
 subtitle:"photos",
},


video:{
 title:"Relive the moment",
 subtitle:"video",
},


soundtrack:{
 title:"The sound of this memory",
 subtitle:"soundtrack",
},


replay:{
 title:"Your story unfolds again",
 subtitle:"replay",
},


timeline:{
 title:"Every moment in sequence",
 subtitle:"timeline",
},


highlights:{
 title:"The moments that made it unforgettable",
 subtitle:"highlights",
},


favorite_memories:{
 title:"The memories closest to our hearts",
 subtitle:"favorite_memories",
},


future:{
 title:"The story still being written",
 subtitle:"future",
},


legacy:{
 title:"A story that lives beyond today",
 subtitle:"legacy",
},


milestone:{
 title:"A moment worth celebrating",
 subtitle:"milestone",
},


family:{
 title:"The people who made it meaningful",
 subtitle:"family",
},


friends:{
 title:"The memories we share together",
 subtitle:"friends",
},


proposal:{
 title:"The question that changed everything",
 subtitle:"proposal",
},


ceremony:{
 title:"A moment to remember forever",
 subtitle:"ceremony",
},


anniversary:{
 title:"Another chapter together",
 subtitle:"anniversary",
},


love_story:{
 title:"The story of two hearts",
 subtitle:"love_story",
},


vows:{
 title:"Words meant forever",
 subtitle:"vows",
},


first_dance:{
 title:"The first dance of a lifetime",
 subtitle:"first_dance",
},


guestbook:{
 title:"Messages from everyone who was there",
 subtitle:"guestbook",
},


guest_messages:{
 title:"Messages from the people who matter",
 subtitle:"guest_messages",
},


wedding_gallery:{
 title:"A gallery of forever moments",
 subtitle:"wedding_gallery",
},


honeymoon:{
 title:"The journey after forever begins",
 subtitle:"honeymoon",
},


reward:{
 title:"Something special is waiting",
 subtitle:"reward",
},


offer:{
 title:"A moment created just for you",
 subtitle:"offer",
},


product:{
 title:"Discover something special",
 subtitle:"product",
},


menu:{
 title:"Explore what is waiting",
 subtitle:"menu",
},


booking:{
 title:"Reserve your experience",
 subtitle:"booking",
},


payment:{
 title:"Complete your next step",
 subtitle:"payment",
},


review:{
 title:"Share your experience",
 subtitle:"review",
},


social:{
 title:"Share this moment",
 subtitle:"social",
},


profile:{
 title:"Discover the story behind this identity",
 subtitle:"profile",
},


pet_profile:{
 title:"Meet your companion",
 subtitle:"pet_profile",
},


pet_story:{
 title:"The story of a loyal friend",
 subtitle:"pet_story",
},


pet_journey:{
 title:"Every step of the journey",
 subtitle:"pet_journey",
},


pet_health:{
 title:"Care information that matters",
 subtitle:"pet_health",
},


emergency_info:{
 title:"Important information when needed",
 subtitle:"emergency_info",
},


lost_pet:{
 title:"Help bring this friend home",
 subtitle:"lost_pet",
},


pet_birthday:{
 title:"A birthday worth remembering",
 subtitle:"pet_birthday",
},


strain_profile:{
 title:"Discover the identity behind the strain",
 subtitle:"strain_profile",
},


product_passport:{
 title:"The complete product story",
 subtitle:"product_passport",
},


lab_results:{
 title:"Verified by science",
 subtitle:"lab_results",
},


terpene_profile:{
 title:"Explore the character behind the experience",
 subtitle:"terpene_profile",
},


cultivation_story:{
 title:"From cultivation to creation",
 subtitle:"cultivation_story",
},


batch_history:{
 title:"The journey of this batch",
 subtitle:"batch_history",
},


effects_guide:{
 title:"Understand the experience",
 subtitle:"effects_guide",
},


performance:{
 title:"The moment the crowd came alive",
 subtitle:"performance",
},


artist:{
 title:"Meet the creator behind the experience",
 subtitle:"artist",
},


setlist:{
 title:"The soundtrack of the night",
 subtitle:"setlist",
},


crowd:{
 title:"The energy of everyone who was there",
 subtitle:"crowd",
},


backstage:{
 title:"Behind the scenes",
 subtitle:"backstage",
},


venue:{
 title:"Where this experience happened",
 subtitle:"venue",
},


ticket:{
 title:"Your entry into the experience",
 subtitle:"ticket",
},


merch:{
 title:"Take the memory home",
 subtitle:"merch",
},


playful:{
 title:"Something unexpected awaits",
 subtitle:"playful",
},


share:{
 title:"Share the moment",
 subtitle:"share",
},


reaction:{
 title:"Your reaction becomes part of the story",
 subtitle:"reaction",
},


excited:{
 title:"The excitement begins",
 subtitle:"excited",
},

followup:{
 title:
   "Keep the memory alive",
 subtitle:
   "followup",
},


time_capsule:{
 title:
   "A story preserved forever",
 subtitle:
   "time_capsule",
},


medical_profile:{
 title:
   "Important information when it matters",
 subtitle:
   "medical_profile",
},


care_instructions:{
 title:
   "Care information for this companion",
 subtitle:
   "care_instructions",
},


adoption_story:{
 title:
   "The beginning of a new family",
 subtitle:
   "adoption_story",
},
};



export function narrateMoment(

type:ExperienceMomentType,

context:NarrativeContext = {}

):MomentNarrative {


const base =
  narratives[type]
  ??
  {
    title:"A moment created for this experience",
    subtitle:type,
    description:"An experience moment generated by QRE."
  };



let title =
base.title;



if(context.location){

title =
`${base.title} at ${context.location}`;

}



if(
context.product &&
type === "product"
){

title =
`Discover ${context.product}`;

}



if(
context.person &&
type === "artist"
){

title =
`Meet ${context.person}`;

}



if(
context.brand &&
type === "profile"
){

title =
`${context.brand} — the story behind the identity`;

}



return {

title,

subtitle:
base.subtitle,

description:
base.description,

};

}