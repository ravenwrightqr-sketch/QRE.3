/**
 * =====================================================
 * QRE SEMANTIC ANALYZER
 * =====================================================
 *
 * ANY HUMAN IDEA
 *      ↓
 * MEANING SIGNALS
 *      ↓
 * EXPERIENCE GENERATION
 *
 * Universal human intent interpreter.
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


export type SemanticAnalysis = {

  /**
   * Human intention
   */
  intent:string;


  /**
   * Meaning categories
   * Examples:
   * memory
   * cyberpunk
   * underground
   * luxury
   * adventure
   */
  themes:string[];


  /**
   * Emotional signals
   * Examples:
   * nostalgia
   * curiosity
   * excitement
   */
  emotions:string[];


  /**
   * Extracted things
   * Examples:
   * person
   * place
   * product
   * media
   */
  entities:string[];


  /**
   * What the user wants the experience to do
   * Examples:
   * create
   * explore
   * share
   * reveal
   * unlock
   */
  actions:string[];


  /**
   * Where it exists
   * Examples:
   * event
   * location
   * digital
   * physical
   */
  environments:string[];


  /**
   * Who it is for
   */
  audience:string[];


  /**
   * Experience DNA
   *
   * This is the creative genome.
   *
   * Examples:
   * cinematic
   * immersive
   * premium
   * mysterious
   * playful
   * emotional
   */
  experienceDNA:string[];

};




/**
 * Semantic vocabulary.
 *
 * This is NOT a template system.
 *
 * These are meaning detectors.
 *
 * Unknown concepts survive.
 */

const semanticSignals = [

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
      "journey",
      "moment"
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
      "bond",
      "people"
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
      "shop",
      "customer",
      "client",
      "sell",
      "service"
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
      "performance",
      "dance",
      "crowd"
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
      "game",
      "quest",
      "mission",
      "challenge",
      "hunt",
      "battle",
      "puzzle",
      "competition"
    ],
    emotion:"excitement",
    dna:"interactive"
  },


  {
    theme:"identity",
    words:[
      "profile",
      "identity",
      "who",
      "person",
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
      "companion",
      "rescue"
    ],
    emotion:"care",
    dna:"personal"
  },


];







export function analyzeSemanticPrompt(
  prompt:string
):SemanticAnalysis {


const text =
  prompt
    .toLowerCase()
    .trim();



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




/**
 * BASE HUMAN ACTION
 */

actions.add("create");

experienceDNA.add(
  "adaptive"
);







/**
 * CORE SEMANTIC MATCHING
 */

for(
  const signal of semanticSignals
){

  const matched =
    signal.words.some(
      word =>
        text.includes(word)
    );


  if(matched){

    themes.add(
      signal.theme
    );


    emotions.add(
      signal.emotion
    );


    experienceDNA.add(
      signal.dna
    );

  }

}







/**
 * MEDIA INTELLIGENCE
 */

if(
 /photo|image|picture|video|film|movie|gallery|audio|music|voice|sound/
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
 * GEO INTELLIGENCE
 */

if(
 /place|location|city|venue|travel|hotel|home|world|map|destination/
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
 * STYLE / AESTHETIC DNA
 */

if(
 /dark|gothic|cyber|punk|alternative|rebellious|underground/
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
 /luxury|premium|elite|exclusive|high end/
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
 /fun|funny|wild|crazy|playful|chaos/
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
 /fan|fans|followers|members|community|guest|crowd/
 .test(text)
){

 audience.add(
  "community"
 );

}


if(
 /customer|buyer|client|visitor|shopper/
 .test(text)
){

 audience.add(
  "customer"
 );

}


if(
 /\bmy\b|\bmine\b|personal|private|self/
 .test(text)
){

 audience.add(
  "individual"
 );

}







/**
 * ENTITY EXTRACTION
 *
 * Keep concepts, don't force categories.
 */

if(
 /qr|nfc|code|tag|scan/
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
 *
 * Unknown ideas still become experiences.
 */

if(
 themes.size === 0
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

}





/**
 * Remove duplicates naturally
 */

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

};


}