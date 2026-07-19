/**
 * =====================================================
 * QRE CULTURE / SESH EXPERIENCE TEMPLATE
 * =====================================================
 *
 * Community-driven experiences.
 *
 * =====================================================
 */


import type {
  IndustryTemplate,
} from "../templateTypes.js";


export const seshIndustry = {


  industry:
    "sesh",


  defaultGoal:
    "loyalty",


  preferredDNA: [

    "viral",

    "friendly",

    "premium",

    "emotional",

  ] as const,


  recommendedMoments: [

    "welcome",

    "location",

    "arrival",

    "friends",

    "story",

    "photos",

    "highlights",

    "share",

    "reward",

    "followup",

  ] as const,


  keywords: [

    "sesh",

    "community",

    "culture",

    "creator",

    "collective",

    "cannabis",

    "art",

    "streetwear",

    "local scene",

    "underground",

    "lifestyle",

  ],


  experiences: [

    "community_passport",

    "creator_drop",

    "culture_archive",

    "member_identity",

    "local_rewards",

    "event_memory",

  ],


  recommendedFeatures: [

    "community profiles",

    "member rewards",

    "exclusive drops",

    "location memories",

    "creator stories",

    "social sharing",

    "membership identity",

  ],


} satisfies IndustryTemplate;