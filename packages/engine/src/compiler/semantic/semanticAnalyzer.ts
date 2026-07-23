/**
 * =====================================================
 * QRE SEMANTIC ANALYZER
 * =====================================================
 *
 * Human Language
 *        ↓
 * Meaning Signals
 *        ↓
 * Experience Genome
 *
 * This layer answers:
 *
 * "What is this human trying to create?"
 *
 * It does NOT create:
 *
 * - worlds
 * - moments
 * - flows
 * - runtime
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


export type SemanticSignal = {

  concept:string;

  confidence:number;

};



export type SemanticAnalysis = {


  /**
   * Human intention
   */
  intent:string;



  /**
   * Detected concepts
   */
  themes:string[];



  /**
   * Emotional language
   */
  emotions:string[];



  /**
   * Things mentioned
   */
  entities:string[];



  /**
   * Desired actions
   */
  actions:string[];



  /**
   * Physical/digital context
   */
  environments:string[];



  /**
   * Audience signals
   */
  audience:string[];



  /**
   * Creative DNA signals
   */
  experienceDNA:string[];



  /**
   * Future intelligence layer
   *
   * Allows confidence based reasoning.
   */
  signals:SemanticSignal[];

};





type SemanticRule = {

 theme:string;

 words:string[];

 emotion:string;

 dna:string;

};







const semanticRules:SemanticRule[] = [



{
 theme:"memory",

 words:[
  "memory",
  "remember",
  "past",
  "history",
  "legacy",
  "archive",
  "childhood",
  "timeline",
  "moment",
  "time capsule"
 ],

 emotion:"nostalgia",

 dna:"emotional"

},



{
 theme:"connection",

 words:[
  "love",
  "relationship",
  "family",
  "friend",
  "community",
  "together",
  "bond"
 ],

 emotion:"connection",

 dna:"human"

},



{
 theme:"commerce",

 words:[
  "business",
  "brand",
  "product",
  "company",
  "store",
  "customer",
  "client",
  "sell"
 ],

 emotion:"trust",

 dna:"conversion"

},



{
 theme:"culture",

 words:[
  "music",
  "concert",
  "festival",
  "club",
  "party",
  "artist",
  "performance"
 ],

 emotion:"energy",

 dna:"immersive"

},



{
 theme:"discovery",

 words:[
  "secret",
  "hidden",
  "unknown",
  "mystery",
  "exclusive",
  "rare",
  "explore",
  "underground"
 ],

 emotion:"curiosity",

 dna:"mysterious"

},



{
 theme:"adventure",

 words:[
  "quest",
  "mission",
  "challenge",
  "hunt",
  "puzzle",
  "game"
 ],

 emotion:"excitement",

 dna:"interactive"

},



{
 theme:"identity",

 words:[
  "identity",
  "profile",
  "creator",
  "artist",
  "owner"
 ],

 emotion:"recognition",

 dna:"personal"

},



{
 theme:"companion",

 words:[
  "dog",
  "cat",
  "pet",
  "animal",
  "rescue"
 ],

 emotion:"care",

 dna:"personal"

}



];









export function analyzeSemanticPrompt(
 prompt:string
):SemanticAnalysis {


const text =
 prompt
 .toLowerCase()
 .trim();



if(!text){

 throw new Error(
  "Semantic prompt cannot be empty"
 );

}




const themes =
new Set<string>();


const emotions =
new Set<string>();


const entities =
new Set<string>();


const actions =
new Set<string>();


const environments =
new Set<string>();


const audience =
new Set<string>();


const experienceDNA =
new Set<string>();


const signals:
SemanticSignal[] = [];





actions.add(
 "create"
);


experienceDNA.add(
 "adaptive"
);






for(
 const rule of semanticRules
){


const matches =
rule.words.filter(
 word =>
 text.includes(word)
);



if(matches.length){


const confidence =
Math.min(
 1,
 matches.length /
 3
);



themes.add(
 rule.theme
);



emotions.add(
 rule.emotion
);



experienceDNA.add(
 rule.dna
);



signals.push({

 concept:
 rule.theme,

 confidence

});


}


}








/**
 * MEDIA
 */

if(
 /photo|image|video|film|audio|music|sound|voice/
 .test(text)
){

entities.add(
 "media"
);


experienceDNA.add(
 "cinematic"
);


actions.add(
 "experience"
);


}





/**
 * LOCATION
 */

if(
 /place|location|city|venue|home|world|map|destination/
 .test(text)
){

environments.add(
 "location"
);


actions.add(
 "navigate"
);


}






/**
 * STYLE DNA
 */


if(
 /dark|gothic|cyber|punk|alternative|rebellious/
 .test(text)
){

experienceDNA.add(
 "alternative"
);


emotions.add(
 "intensity"
);


}



if(
 /luxury|premium|elite|exclusive/
 .test(text)
){

experienceDNA.add(
 "premium"
);


emotions.add(
 "aspiration"
);


}



if(
 /fun|wild|crazy|playful|chaos/
 .test(text)
){

experienceDNA.add(
 "playful"
);


emotions.add(
 "joy"
);


}








/**
 * AUDIENCE
 */


if(
 /fans|followers|members|community|crowd/
 .test(text)
){

audience.add(
 "community"
);

}



if(
 /customer|buyer|client|shopper/
 .test(text)
){

audience.add(
 "customer"
);

}



if(
 /my|mine|personal|private/
 .test(text)
){

audience.add(
 "individual"
);

}








/**
 * ENTITY SIGNALS
 */


if(
 /qr|nfc|tag|scan|code/
 .test(text)
){

entities.add(
 "digital_identity"
);

}



if(
 /story|experience|world|universe|portal|realm/
 .test(text)
){

entities.add(
 "experience"
);

}



if(
 /club|bar|venue|space|room/
 .test(text)
){

entities.add(
 "environment"
);

}







/**
 * OPEN WORLD FALLBACK
 */

if(
 !themes.size
){

themes.add(
 "human_expression"
);


experienceDNA.add(
 "open_world"
);


emotions.add(
 "curiosity"
);


signals.push({

 concept:
 "human_expression",

 confidence:
 .2

});


}





return {


intent:
 "experience_creation",


themes:
 [...themes],


emotions:
 [...emotions],


entities:
 [...entities],


actions:
 [...actions],


environments:
 [...environments],


audience:
 [...audience],


experienceDNA:
 [...experienceDNA],


signals

};


}