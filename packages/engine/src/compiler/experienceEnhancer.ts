/**
 * =====================================================
 * QRE EXPERIENCE ENHANCER
 * =====================================================
 *
 * User Idea
 *      ↓
 * Enhancement
 *      ↓
 * Experience Blueprint Intelligence
 *
 * Responsibilities:
 *
 * - Expand simple prompts
 * - Add emotional direction
 * - Add experience structure
 * - Add recommended moments
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * Compiler creates.
 * Runtime delivers.
 *
 * =====================================================
 */



export type ExperienceEnhancementInput = {

  prompt:string;

  industry?:string;

  intent?:string;

};







export type ExperienceEnhancement = {

  title:string;

  tone:string[];

  moments:string[];

  goals:string[];

  dna:string[];

};








function includesAny(

 value:string,

 words:string[]

){

  return words.some(

    word =>

      value.includes(word)

  );

}








export function enhanceExperience(

 input:ExperienceEnhancementInput

):ExperienceEnhancement {



  const text =

    input.prompt.toLowerCase();





  const tone:string[] = [];

  const moments:string[] = [];

  const goals:string[] = [];

  const dna:string[] = [];








  /**
   * DEFAULT EXPERIENCE DNA
   */


  dna.push(

    "cinematic",

    "personalized",

    "memorable"

  );





  /**
   * MEMORY EXPERIENCES
   */


  if(

    includesAny(

      text,

      [

        "memory",

        "memorial",

        "tribute",

        "remember"

      ]

    )

  ){

    tone.push(

      "emotional",

      "honoring"

    );


    moments.push(

      "welcome",

      "memory collection",

      "story timeline",

      "reflection moment",

      "sharing"

    );


    goals.push(

      "preserve meaningful memories",

      "create emotional connection"

    );

  }








  /**
   * EVENTS
   */


  if(

    includesAny(

      text,

      [

        "party",

        "event",

        "birthday",

        "celebration"

      ]

    )

  ){

    tone.push(

      "energetic",

      "social"

    );


    moments.push(

      "arrival",

      "interactive experience",

      "highlight moment",

      "reward"

    );


    goals.push(

      "increase engagement",

      "create shareable moments"

    );

  }









  /**
   * BUSINESS
   */


  if(

    includesAny(

      text,

      [

        "business",

        "restaurant",

        "shop",

        "brand",

        "customer"

      ]

    )

  ){

    tone.push(

      "professional",

      "trustworthy"

    );


    moments.push(

      "welcome",

      "product discovery",

      "customer action"

    );


    goals.push(

      "increase customer value",

      "improve retention"

    );

  }










  /**
   * FALLBACK
   */


  if(!moments.length){

    moments.push(

      "welcome",

      "story",

      "interaction",

      "completion"

    );


    goals.push(

      "create meaningful experience"

    );


    tone.push(

      "unique"

    );

  }









  return {

    title:

      input.prompt

        .trim()

        .slice(

          0,

          60

        ),


    tone:

      [...new Set(tone)],


    moments:

      [...new Set(moments)],


    goals:

      [...new Set(goals)],


    dna:

      [...new Set(dna)],


  };

}