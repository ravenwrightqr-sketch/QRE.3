/**
 * =====================================================
 * QRE ENTITY INTELLIGENCE EXTRACTOR
 * =====================================================
 *
 * Converts human language into world primitives.
 *
 * Prompt
 *    ↓
 * Entity Intelligence
 *    ↓
 * Experience World
 *
 * Entities are not words.
 * They are creative atoms.
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


import type {
  ExperienceEntities,
} from "@qre/contracts";




function unique(
 values:string[]
){

 return [

  ...new Set(

   values
    .map(v=>v.trim())
    .filter(Boolean)

  )

 ];

}






const dictionaries = {


creatures:[

 "dog",
 "cat",
 "wolf",
 "bird",
 "horse",
 "animal",
 "pet",
 "dragon",
 "creature"

],


objects:[

 "car",
 "house",
 "ring",
 "key",
 "book",
 "painting",
 "camera",
 "weapon",
 "artifact",
 "chair",
 "garden",
 "tree"

],


concepts:[

 "memory",
 "love",
 "legacy",
 "identity",
 "freedom",
 "dream",
 "hope",
 "family",
 "connection",
 "history",
 "future"

],


symbols:[

 "crown",
 "phoenix",
 "lightning",
 "star",
 "moon",
 "flower",
 "fire",
 "shadow"

],


worlds:[

 "fantasy",
 "cyberpunk",
 "gothic",
 "future",
 "dream",
 "universe",
 "realm",
 "dimension"

],


archetypes:[

 "hero",
 "creator",
 "guardian",
 "explorer",
 "artist",
 "warrior",
 "guide",
 "companion"

]

};









function detect(

 text:string,

 list:string[]

){

 return list.filter(

  item =>
   text.includes(item)

 );

}







function extractBasicKeywords(
 text:string
){

return text
.split(/\s+/)
.filter(
 word =>
  word.length > 5
);

}



function detectNamedEntities(
text:string
){

const words =
text
.split(/\s+/)
.map(word =>
word.replace(/[.,!?]/g,"")
);


const ignored = [

"Make",
"Create",
"Build",
"Generate",
"Design",
"Create"

];


return words.filter(

(word,index)=>{

const clean =
word.replace("'s","");


return (

!ignored.includes(clean) &&

(
/^[A-Z][a-z]+$/.test(word)
||
word.endsWith("'s")
)

);

}

)

.map(word =>
word.replace("'s","")

);

}





export function extractEntities(

 prompt:string

):ExperienceEntities {


const original =
prompt;


const text =
prompt.toLowerCase();


return {


people:
detectNamedEntities(original),


places:[],


organizations:[],


dates:

 text.match(
 /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g
 )
 ??
 [],


times:[],


events:
detect(
 text,
 [
  "concert",
  "festival",
  "party",
  "wedding",
  "birthday",
  "show"
 ]
),


products:
detect(
 text,
 [
  "qr",
  "tag",
  "keychain",
  "card",
  "poster",
  "shirt",
  "book"
 ]
),



urls:
text.match(
 /https?:\/\/[^\s]+/g
)
??
[],



phones:[],


emails:
text.match(
 /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
)
??
[],



media:
detect(
 text,
 [
  "photo",
  "video",
  "audio",
  "music",
  "film"
 ]
),



keywords:
unique(
 extractBasicKeywords(text)
),



objects:
detect(
 text,
 dictionaries.objects
),

creatures:
[
...detect(
 text,
 dictionaries.creatures
),

...detectNamedEntities(original)
],

concepts:
detect(
 text,
 dictionaries.concepts
),

symbols:
detect(
 text,
 dictionaries.symbols
),

worlds:
detect(
 text,
 dictionaries.worlds
),

archetypes:
detect(
 text,
 dictionaries.archetypes
)


};


}