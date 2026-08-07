import type {
  ExperienceGenome
} from "@qre/contracts";


export type HumanStoryArchetype =
  | "companion_journey"
  | "place_story"
  | "artifact_story"
  | "brand_story"
  | "human_journey"
  | "discovery_story";


export interface HumanStoryContext {

  archetype: HumanStoryArchetype;

  entity:string;

  language:string[];

  emotionalArc:string[];

  perspective:string;

  forbidden:string[];

}



export function resolveHumanStoryArchetype(
  genome:ExperienceGenome
):HumanStoryContext {


  const creature =
    genome.entities.creatures?.[0];


  const person =
    genome.entities.people?.[0];


  const object =
    genome.entities.objects?.[0];


  const organization =
    genome.entities.organizations?.[0];


  const place =
    genome.entities.places?.[0];



  if(creature){

    return {

      archetype:
        "companion_journey",

      entity:
        creature,

      language:[
        "love",
        "little moments",
        "gentle care",
        "trust",
        "being celebrated"
      ],

      emotionalArc:[
        "arrival",
        "comfort",
        "connection",
        "joy"
      ],

      perspective:
        "Tell the story like a beloved companion experiencing a meaningful day.",

      forbidden:[
        "retention",
        "interaction",
        "optimization",
        "conversion",
        "experience framework",
        "journey stage"
      ]

    };

  }



  if(place){

    return {

      archetype:
        "place_story",

      entity:
        place,

      language:[
        "memories",
        "stories",
        "people",
        "moments",
        "belonging"
      ],

      emotionalArc:[
        "arrival",
        "discovery",
        "attachment",
        "legacy"
      ],

      perspective:
        "Tell the story like a place holding human memories.",

      forbidden:[
        "location asset",
        "engagement",
        "retention",
        "user flow"
      ]

    };

  }



  if(object){

    return {

      archetype:
        "artifact_story",

      entity:
        object,

      language:[
        "meaning",
        "history",
        "hands",
        "memories",
        "connection"
      ],

      emotionalArc:[
        "creation",
        "discovery",
        "attachment",
        "legacy"
      ],

      perspective:
        "Tell the story like an object carrying human meaning.",

      forbidden:[
        "product",
        "conversion",
        "transaction",
        "retention"
      ]

    };

  }



  if(organization){

    return {

      archetype:
        "brand_story",

      entity:
        organization,

      language:[
        "people",
        "community",
        "moments",
        "trust",
        "shared stories"
      ],

      emotionalArc:[
        "discovery",
        "connection",
        "belonging",
        "return"
      ],

      perspective:
        "Tell the story like people remembering why they connected.",

      forbidden:[
        "customer acquisition",
        "retention",
        "conversion",
        "funnel"
      ]

    };

  }



  if(person){

    return {

      archetype:
        "human_journey",

      entity:
        person,

      language:[
        "moments",
        "change",
        "growth",
        "memories",
        "meaning"
      ],

      emotionalArc:[
        "beginning",
        "change",
        "growth",
        "reflection"
      ],

      perspective:
        "Tell the story like a person looking back on a meaningful moment.",

      forbidden:[
        "optimization",
        "performance",
        "retention"
      ]

    };

  }



  return {

    archetype:
      "discovery_story",

    entity:
      "Someone",

    language:[
      "wonder",
      "curiosity",
      "surprise",
      "discovery"
    ],

    emotionalArc:[
      "arrival",
      "exploration",
      "reveal",
      "memory"
    ],

    perspective:
      "Tell the story like someone discovering something meaningful.",

    forbidden:[
      "retention",
      "conversion",
      "engagement metric"
    ]

  };

}