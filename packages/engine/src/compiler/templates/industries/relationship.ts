import type {
  ExperienceIndustry,
  ExperienceGoal,
  ExperienceMomentType,
} from "@qre/contracts";


export const relationshipIndustry = {


  industry:
    "relationship" satisfies ExperienceIndustry,


  defaultGoal:
    "memory" satisfies ExperienceGoal,


  preferredDNA:[

    "cinematic",

    "emotional",

    "romantic",

  ],



  recommendedMoments:[

    "introduction",

    "meeting",

    "location",

    "story",

    "photos",

    "favorite_memories",

    "highlights",

    "future",

    "replay",

  ] satisfies ExperienceMomentType[],



} as const;