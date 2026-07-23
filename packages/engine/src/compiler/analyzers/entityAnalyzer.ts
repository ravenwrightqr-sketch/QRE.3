/**
 * =====================================================
 * QRE EXPERIENCE ENTITY ANALYZER
 * =====================================================
 *
 * Responsibility:
 *
 * Extract real-world entities from human language.
 *
 *
 * Input:
 *
 * Human Prompt
 *
 *
 * Output:
 *
 * ExperienceEntities
 *
 *
 * Detects:
 *
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
 *
 * This analyzer does NOT:
 *
 * - interpret meaning
 * - create relationships
 * - build worlds
 * - execute experiences
 *
 *
 * Pipeline:
 *
 * Prompt
 *    ↓
 * EntityAnalyzer
 *    ↓
 * Understanding Kernel
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

value => value.trim()

)

.filter(Boolean)

)

];

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









//
// PEOPLE
//

for(

const match of prompt.matchAll(

/(?:for|by|with|from)\s+([A-Z][A-Za-z0-9.'@-]*(?:\s[A-Z][A-Za-z0-9.'-]*)?)/g

)

){

people.push(

match[1]

);

}









//
// PLACES
//

for(

const match of prompt.matchAll(

/(?:at|in|near|inside)\s+([A-Z][A-Za-z\s]+)/g

)

){

places.push(

match[1].trim()

);

}









//
// EVENTS
//

const eventWords = [

"wedding",

"concert",

"festival",

"birthday",

"anniversary",

"party",

"rave",

"show"

];





for(const word of eventWords){


if(lower.includes(word)){


events.push(word);


}


}









//
// MEDIA
//

if(

/photo|image|video|film|audio|music|voice|gallery/i

.test(prompt)

){

media.push(

"media"

);

}









//
// PRODUCTS
//

const productWords = [

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

];





for(const word of productWords){


if(lower.includes(word)){


products.push(word);


}


}









//
// DATES
//

dates.push(

...(prompt.match(

/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g

) ?? [])

);









//
// URLS
//

urls.push(

...(prompt.match(

/https?:\/\/[^\s]+/gi

) ?? [])

);









//
// EMAILS
//

emails.push(

...(prompt.match(

/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi

) ?? [])

);









//
// PHONES
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

word => word.length > 5

)

);









return {


people:unique(people),

places:unique(places),

organizations:unique(organizations),

dates:unique(dates),

times:unique(times),

events:unique(events),

products:unique(products),

urls:unique(urls),

emails:unique(emails),

phones:unique(phones),

keywords:unique(keywords),

media:unique(media)


};



}