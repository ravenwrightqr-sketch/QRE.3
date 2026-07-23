/**
 * =====================================================
 * QRE ENTITY EXTRACTOR
 * =====================================================
 *
 * Extracts meaningful objects from experience prompts.
 *
 * Prompt
 *   ↓
 * Entity Extraction
 *   ↓
 * Blueprint
 *   ↓
 * Runtime / Demo / Geo / Memory
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  ExperienceEntities,
} from "@qre/contracts";





function unique(
 values:string[]
):string[] {

 return [
  ...new Set(
   values
    .map(
     value=>value.trim()
    )
    .filter(Boolean)
  ),
 ];

}







const placeSignals = [

 "at ",
 "inside ",
 "near ",
 "from ",
 "located in ",
 "visited "

];





const eventSignals = [

 "concert",
 "show",
 "festival",
 "party",
 "rave",
 "sesh",
 "birthday",
 "anniversary",
 "wedding",
 "celebration"

];





const productSignals = [

 "qr",
 "qr code",
 "keychain",
 "tag",
 "sticker",
 "card",
 "poster",
 "shirt",
 "painting",
 "album",
 "book",
 "collectible"

];





const keywordSignals = [

 "memory",
 "memories",
 "story",
 "photos",
 "photo",
 "video",
 "favorite",
 "collection",
 "reward",
 "loyalty",
 "unlock",
 "secret",
 "exclusive",
 "experience"

];







function extractAfterSignal(
 prompt:string,
 signal:string
):string|null {


 const lower =
  prompt.toLowerCase();



 const index =
  lower.indexOf(signal);



 if(index === -1){

  return null;

 }



 const result =
  prompt
   .slice(
    index + signal.length
   )
   .split(
    /[.,!?]/
   )[0]
   .trim();




 if(
  result.length < 2 ||
  result.split(" ").length > 6
 ){

  return null;

 }



 return result;

}








/**
 * Detect likely names.
 *
 * Example:
 *
 * "Create a concert experience
 *  for DeathbyRomy at The Wiltern"
 *
 * returns:
 *
 * people:
 * [
 *  "DeathbyRomy"
 * ]
 *
 */
function extractPeople(
 prompt:string
):string[] {


 const people:string[] = [];



 const patterns = [


  /for\s+([A-Z][A-Za-z0-9@.'-]+(?:\s+[A-Z][A-Za-z0-9.'-]+)?)/g,


  /by\s+([A-Z][A-Za-z0-9@.'-]+(?:\s+[A-Z][A-Za-z0-9.'-]+)?)/g,


  /artist\s+([A-Z][A-Za-z0-9.'-]+)/gi,


  /creator\s+([A-Z][A-Za-z0-9.'-]+)/gi,


 ];




 for(const pattern of patterns){


  const matches =
   prompt.matchAll(pattern);



  for(const match of matches){

   if(match[1]){

    people.push(
     match[1]
    );

   }

  }

 }



 return unique(
  people
 );

}









function extractUrls(
 prompt:string
):string[] {


 return (
  prompt.match(
   /https?:\/\/[^\s]+/gi
  )
  ?? []
 );

}







function extractEmails(
 prompt:string
):string[] {


 return (
  prompt.match(
   /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g
  )
  ?? []
 );

}







function extractPhones(
 prompt:string
):string[] {


 return (
  prompt.match(
   /\+?\d[\d\s()-]{7,}\d/g
  )
  ?? []
 );

}







function extractDates(
 prompt:string
):string[] {


 return (
  prompt.match(
   /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g
  )
  ?? []
 );

}








export function extractEntities(
 prompt:string
):ExperienceEntities {



 const lower =
  prompt.toLowerCase();




 const places:string[]=[];

 const events:string[]=[];

 const products:string[]=[];

 const keywords:string[]=[];

 const media:string[] = [];






 // -------------------------------
 // PLACES
 // -------------------------------

 for(const signal of placeSignals){


  const place =
   extractAfterSignal(
    prompt,
    signal
   );



  if(place){

   places.push(
    place
   );

  }

 }





 // -------------------------------
 // EVENTS
 // -------------------------------

 for(const event of eventSignals){


  if(lower.includes(event)){

   events.push(
    event
   );

  }

 }





 // -------------------------------
 // PRODUCTS
 // -------------------------------

 for(const product of productSignals){


  if(lower.includes(product)){


   products.push(
    product
   );


  }

 }





 // -------------------------------
 // KEYWORDS
 // -------------------------------

 for(const keyword of keywordSignals){


  if(lower.includes(keyword)){


   keywords.push(
    keyword
   );

  }

 }


return {


  people:

   extractPeople(
    prompt
   ),



  places:

   unique(
    places
   ),



  organizations:[],


  dates:

   extractDates(
    prompt
   ),



  times:[],



  events:

   unique(
    events
   ),



  products:

   unique(
    products
   ),



  urls:

   unique(
    extractUrls(prompt)
   ),



  emails:

   unique(
    extractEmails(prompt)
   ),



  phones:

   unique(
    extractPhones(prompt)
   ),



  keywords:

   unique(
    keywords
   ),



  media:

   unique(
    media
   ),


};





 

}