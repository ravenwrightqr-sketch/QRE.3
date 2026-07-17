/**
 * =====================================================
 * QRE PERSONAL INDUSTRY TEMPLATE
 * =====================================================
 *
 * Covers:
 *
 * relationship stories
 * time capsules
 * family memories
 * anniversaries
 * proposals
 * personal gifts
 * life milestones
 *
 * This is the emotional engine
 * behind QRE memory products.
 *
 * =====================================================
 */

import type {
  ExperienceIndustry,
  ExperienceGoal,
  ExperienceMomentType,
} from "@qre/contracts";


export const personalIndustry = {

  industry:
    "personal" satisfies ExperienceIndustry,


  supportedExperiences: [

    "relationship",

    "time capsule",

    "anniversary",

    "proposal",

    "family story",

    "life milestone",

    "personal gift",

    "memory capsule",

  ],



  defaultGoal:

    "storytelling" satisfies ExperienceGoal,



  preferredDNA: [

    "cinematic",

    "emotional",

    "romantic",

  ],



  recommendedMoments: [

    "welcome",

    "introduction",

    "meeting",

    "story",

    "photos",

    "favorite_memories",

    "highlights",

    "future",

    "replay",

  ] satisfies ExperienceMomentType[],



  recommendedFeatures: [

    "timeline",

    "locations",

    "photos",

    "audio messages",

    "video memories",

    "future messages",

    "private sharing",

  ],



  analytics: [

    "memory_started",

    "moment_completed",

    "replays",

    "shares",

    "time_spent",

  ],

} as const;