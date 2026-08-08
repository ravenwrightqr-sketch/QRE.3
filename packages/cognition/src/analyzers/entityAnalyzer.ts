/**
 * =====================================================
 * QRE EXPERIENCE ENTITY ANALYZER
 * =====================================================
 *
 * Entity Intelligence Boundary.
 *
 * Human Prompt
 *      ↓
 * Entity Analysis
 *      ↓
 * World Primitives
 *      ↓
 * Understanding Kernel
 *
 *
 * Detects:
 *
 * CORE:
 * - people
 * - places
 * - organizations
 * - dates
 * - times
 * - events
 * - products
 * - urls
 * - emails
 * - phones
 * - keywords
 * - media
 *
 * CREATIVE INTELLIGENCE:
 *
 * - objects
 * - creatures
 * - concepts
 * - symbols
 * - worlds
 * - archetypes
 *
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


import type {
  ExperienceEntities
} from "@qre/contracts";





function unique(
 values:string[]
){

 return [

  ...new Set(

   values

    .map(
     value =>
      value.trim()
    )

    .filter(Boolean)

  )

 ];

}






function detectWords(

 text:string,

 words:string[]

){

 return words.filter(

  word =>
   text.includes(word)

 );

}








export function analyzeEntities(

 prompt:string

):ExperienceEntities {


const lower =
 prompt.toLowerCase();





const people:string[]=[];

const places:string[]=[];

const organizations:string[]=[];

const dates:string[]=[];

const times:string[]=[];

const events:string[]=[];

const products:string[]=[];

const urls:string[]=[];

const phones:string[]=[];

const emails:string[]=[];

const keywords:string[]=[];

const media:string[]=[];



/**
 * CREATIVE INTELLIGENCE
 */


const objects:string[]=[];

const creatures:string[]=[];

const concepts:string[]=[];

const symbols:string[]=[];

const worlds:string[]=[];

const archetypes:string[]=[];








//
// PEOPLE
//

for(
 const match of prompt.matchAll(

 /(?:for|by|with|from)\s+([A-Z][A-Za-z0-9.'@-]*(?:\s[A-Z][A-Za-z0-9.'-]*)?)/g

 )
){

 if(match[1]){

  people.push(
   match[1]
  );

 }

}








//
// PLACES
//

for(
 const match of prompt.matchAll(

 /(?:at|in|near|inside)\s+([A-Z][A-Za-z\s]+)/g

 )
){

 if(match[1]){

  places.push(
   match[1]
  );

 }

}








//
// EVENTS
//

events.push(

 ...detectWords(

  lower,

  [
   "wedding",
   "concert",
   "festival",
   "birthday",
   "anniversary",
   "party",
   "rave",
   "show"
  ]

 )

);









//
// PRODUCTS
//

products.push(

 ...detectWords(

  lower,

  [
   "qr",
   "qr code",
   "tag",
   "keychain",
   "sticker",
   "card",
   "poster",
   "shirt",
   "painting",
   "album",
   "book",
   "collectible"
  ]

 )

);









//
// MEDIA
//

media.push(

 ...detectWords(

  lower,

  [
   "photo",
   "image",
   "video",
   "film",
   "audio",
   "music",
   "voice",
   "gallery"
  ]

 )

);










//
// DATES
//

dates.push(

 ...(prompt.match(

 /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g

 ) ?? [])

);










//
// URL
//

urls.push(

 ...(prompt.match(

 /https?:\/\/[^\s]+/gi

 ) ?? [])

);










//
// EMAIL
//

emails.push(

 ...(prompt.match(

 /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi

 ) ?? [])

);










//
// PHONE
//

phones.push(

 ...(prompt.match(

 /\+?\d[\d\s()-]{7,}\d/g

 ) ?? [])

);









//
// KEYWORDS
//

keywords.push(

 ...lower

 .split(/\s+/)

 .filter(

  word =>
   word.length > 5

 )

);









//
// CREATIVE OBJECTS
//

objects.push(

 ...detectWords(

  lower,

  [
   "car",
   "house",
   "book",
   "ring",
   "camera",
   "garden",
   "artifact",
   "key",
   "painting"
  ]

 )

);









//
// CREATURES
//

creatures.push(

 ...detectWords(

  lower,

  [
   "dog",
   "cat",
   "pet",
   "animal",
   "wolf",
   "bird",
   "dragon"
  ]

 )

);









//
// CONCEPTS
//

concepts.push(

 ...detectWords(

  lower,

  [
   "memory",
   "love",
   "legacy",
   "identity",
   "freedom",
   "dream",
   "hope",
   "family",
   "connection"
  ]

 )

);









//
// SYMBOLS
//

symbols.push(

 ...detectWords(

  lower,

  [
   "fire",
   "moon",
   "star",
   "phoenix",
   "lightning",
   "crown",
   "flower"
  ]

 )

);









//
// WORLDS
//

worlds.push(

 ...detectWords(

  lower,

  [
   "fantasy",
   "cyberpunk",
   "gothic",
   "future",
   "dream",
   "universe",
   "realm"
  ]

 )

);









//
// ARCHETYPES
//

archetypes.push(

 ...detectWords(

  lower,

  [
   "hero",
   "creator",
   "guardian",
   "explorer",
   "artist",
   "warrior",
   "guide",
   "companion"
  ]

 )

);








return {


people:
 unique(people),
places:
 unique(places),
organizations:
 unique(organizations),
dates:
 unique(dates),
times:
 unique(times),
events:
 unique(events),
products:
 unique(products),
urls:
 unique(urls),
emails:
 unique(emails),
phones:
 unique(phones),
keywords:
 unique(keywords),
media:
 unique(media),

/**
 * Creative intelligence fields
 */
objects:
 unique(objects),
creatures:
 unique(creatures),
concepts:
 unique(concepts),
symbols:
 unique(symbols),
worlds:
 unique(worlds),
archetypes:
 unique(archetypes)

};


}