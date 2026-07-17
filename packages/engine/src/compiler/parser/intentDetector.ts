/**
 * =====================================================
 * QRE EXPERIENCE INTENT DETECTOR
 * =====================================================
 *
 * Determines the experience universe.
 *
 * Prompt
 *   ↓
 * Intent Detector
 *   ↓
 * Industry + Goal + Requirements
 *   ↓
 * Blueprint Composer
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  ExperienceIndustry,
  ExperienceGoal,
} from "@qre/contracts";



export type DetectedIntent = {


  industry:
    ExperienceIndustry;



  goal:
    ExperienceGoal;



  confidence:
    number;



  signals:
    string[];



  requiresGeo:
    boolean;



  requiresMedia:
    boolean;


};





type DetectionRule = {


  industry:
    ExperienceIndustry;


  goal:
    ExperienceGoal;


  keywords:
    string[];


};






const rules: DetectionRule[] = [



  // =====================================
  // RELATIONSHIP MEMORY
  // =====================================

  {

    industry:
      "relationship",


    goal:
      "memory",


    keywords:[

      "relationship",

      "girlfriend",

      "boyfriend",

      "partner",

      "couple",

      "love",

      "first date",

      "met",

      "anniversary",

      "proposal",

      "time capsule",

      "our story",

    ],

  },





  // =====================================
  // WEDDING
  // =====================================

  {

    industry:
      "wedding",


    goal:
      "memory",


    keywords:[

      "wedding",

      "ceremony",

      "bride",

      "groom",

      "vows",

      "marriage",

      "reception",

    ],

  },






  // =====================================
  // CONCERT
  // =====================================

  {

    industry:
      "concert",


    goal:
      "memory",


    keywords:[

      "concert",

      "rave",

      "dj",

   

      "band",

      "tour",

      "festival",

      "live music",

      "set",

    ],

  },

 // =====================================
  // CREATOR / ARTIST
  // =====================================

  {
    industry:
      "artist",

    goal:
      "storytelling",

    keywords:[

      "artist",

      "creator",

      "album",

      "portfolio",

      "gallery",

      "artwork",

      "painting",

      "photography",

      "studio",

      "collection",

    ],

  },


   // =====================================
// CANNABIS / PRODUCT PASSPORT
// =====================================

{

  industry:
    "cannabis",

  goal:
    "storytelling",

  keywords:[

    "cannabis",

    "weed",

    "dispensary",

    "strain",

    "flower",

    "terpene",

    "terpenes",

    "lab",

    "lab results",

    "batch",

    "batch history",

    "product passport",

    "cultivar",

    "edible",

    "extract",

  ],

},


  // =====================================
  // SHOW / PERFORMANCE
  // =====================================

  {

    industry:
      "show",


    goal:
      "memory",


    keywords:[

      "show",

      "performance",

      "theater",

      "comedy",

      "stage",

      "backstage",

    ],

  },






  // =====================================
  // SESH / CULTURE
  // =====================================

  {

    industry:
      "sesh",


    goal:
      "memory",


    keywords:[

      "sesh",

      "crew",

      "friends",

      "hangout",

      "night",

      "spot",

      "meetup",

    ],

  },






  // =====================================
  // HOSPITALITY
  // =====================================

  {

    industry:
      "hospitality",


    goal:
      "welcome",


    keywords:[

      "hotel",

      "airbnb",

      "guest",

      "vacation",

      "stay",

      "resort",

      "check in",

    ],

  },






  // =====================================
  // RESTAURANT
  // =====================================

  {

    industry:
      "restaurant",


    goal:
      "loyalty",


    keywords:[

      "restaurant",

      "pizza",

      "food",

      "menu",

      "chef",

      "dinner",

      "reservation",

      "coupon",

    ],

  },





  // =====================================
  // PET
  // =====================================

  {

    industry:
      "pet",


    goal:
      "memory",


    keywords:[

      "dog",

      "cat",

      "pet",

      "adoption",

      "rescue",

      "animal",

    ],

  },






  // =====================================
  // RETAIL
  // =====================================

  {

    industry:
      "retail",


    goal:
      "storytelling",


    keywords:[

      "product",

      "gift",

      "jewelry",

      "custom",

      "handmade",

      "collectible",

    ],

  },

];







function detectRequirements(
  text:string
){


  return {


    requiresGeo:

      [

        "where",

        "location",

        "place",

        "met",

        "venue",

        "hotel",

        "event",

        "concert",

        "rave",

      ]
      .some(
        word =>
          text.includes(word)
      ),





    requiresMedia:

      [

        "photo",

        "photos",

        "video",

        "gallery",

        "soundtrack",

        "playlist",

      ]
      .some(
        word =>
          text.includes(word)
      ),


  };


}









export function detectIntent(
  prompt:string
):DetectedIntent {


  const text =
    prompt.toLowerCase();




  let best:
    DetectionRule | undefined;



  let matches:
    string[] = [];



  let score =
    0;

    for(
  const rule of rules
){

  const found =
    rule.keywords.filter(
      keyword =>
        text.includes(keyword)
    );


  if(
    found.length > score
  ){

    score =
      found.length;


    best =
      rule;


    matches =
      found;

  }

}









  const requirements =
    detectRequirements(
      text
    );






  if(!best){


    return {

      industry:
        "generic",


      goal:
        "welcome",


      confidence:
        0,


      signals:
        [],


      ...requirements,


    };


  }







  return {


    industry:
      best.industry,


    goal:
      best.goal,


    confidence:

      Math.min(
        score / 5,
        1
      ),


    signals:
      matches,


    ...requirements,


  };


}