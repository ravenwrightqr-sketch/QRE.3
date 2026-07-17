/**
 * =====================================================
 * QRE EXPERIENCE TITLE GENERATOR
 * =====================================================
 *
 * Gives every generated experience an identity.
 *
 * Compiler creative layer.
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  ExperienceType,
} from "@qre/contracts";





type TitleContext = {


  type:
    ExperienceType;


  industry:
    string;


  entities?: {


    people?:
      string[];


    places?:
      string[];


    events?:
      string[];


    products?:
      string[];


  };


};






function pick(
 values:string[]
):
string {

 return values[
   0
 ] ?? "";

}





function relationshipTitles():

string[] {

return [

"THE STORY OF US",

"WHERE IT ALL BEGAN",

"FOREVER STARTS HERE",

"A LOVE STORY PRESERVED",

];

}





function weddingTitles():

string[] {

return [

"THE BEGINNING OF FOREVER",

"THE DAY WE SAID YES",

"OUR WEDDING STORY",

"A LOVE STORY TO REMEMBER",

];

}





function memoryTitles():

string[] {

return [

"MOMENTS THAT LAST FOREVER",

"A STORY WORTH KEEPING",

"YOUR TIME CAPSULE",

];

}





function eventTitles():

string[] {

return [

"WHERE THE NIGHT BECAME ELECTRIC",

"THE MOMENTS THAT MADE IT",

"THE NIGHT WE NEVER FORGET",

"THE EXPERIENCE UNFOLDS",

"DANCE ABDUCTION"
];

}





function cannabisTitles():

string[] {

return [

"FROM SEED TO STORY",

"THE JOURNEY BEHIND THE PRODUCT",

"BEYOND THE LABEL",

"THE COMPLETE PRODUCT STORY",

];

}





function petTitles():

string[] {

return [

"MOMENTS WITH YOUR BEST FRIEND",

"A LIFETIME OF PAWPRINTS",

"THE STORY OF A LOYAL FRIEND",

];

}





function restaurantTitles():

string[] {

return [

"THE TABLE WHERE MEMORIES BEGIN",

"MORE THAN A MEAL",

"YOUR FAVORITE MOMENTS",

];

}





function genericTitles():

string[] {

return [

"YOUR EXPERIENCE",

"A STORY WAITING TO BEGIN",

"CREATE SOMETHING UNFORGETTABLE",

];

}





export function generateExperienceTitle(

 context:
 TitleContext

):

string {


const industry =
context.industry.toLowerCase();



//
// EVENT / CONCERT
//

//
// CREATOR / EVENT / CONCERT
//

if(

industry === "event" ||
industry === "concert" ||
industry === "show" ||
industry === "festival" ||
industry === "artist"

){

const artist =
pick(
 context.entities?.people ?? []
);


const place =
pick(
 context.entities?.places ?? []
);


const event =
pick(
 context.entities?.events ?? []
);



if(
industry === "artist" &&
artist
){

return `${artist.toUpperCase()} — THE STORY BEHIND THE CREATION`;

}


if(
artist &&
place
){

if(
 industry === "concert" ||
 industry === "show" ||
 industry === "festival" ||
 industry === "event"
){

return `${artist.toUpperCase()} AT ${place.toUpperCase()} — WHERE THE NIGHT BECAME ELECTRIC`;

}


return `${artist.toUpperCase()} — THE STORY BEHIND THE CREATION`;

}



if(
artist &&
event
){

return `${artist.toUpperCase()} — THE EXPERIENCE UNFOLDS`;

}



if(place){

return `${place.toUpperCase()} — WHERE THE NIGHT BECAME ELECTRIC`;

}



return eventTitles()[0];

}




//
// WEDDING
//

if(
industry === "wedding"
){

return weddingTitles()[0];

}




//
// RELATIONSHIP
//

if(
industry === "relationship"
){

return relationshipTitles()[0];

}





//
// CANNABIS
//

if(
industry === "cannabis"
){

return cannabisTitles()[0];

}




//
// PET
//

if(
industry === "pet"
){

return petTitles()[0];

}




//
// RESTAURANT
//

if(
industry === "restaurant"
){

return restaurantTitles()[0];

}





//
// MEMORY FALLBACK
//

if(
context.type === "time_capsule"
){

return memoryTitles()[0];

}




return genericTitles()[0];


}