/**
 * =====================================================
 * QRE GENERIC INDUSTRY TEMPLATE
 * =====================================================
 *
 * Universal fallback experience.
 *
 * Used when no specific industry
 * is detected.
 *
 * =====================================================
 */


import type {
  IndustryTemplate,
} from "../templateTypes.js";



export const genericIndustry = {


  industry:
    "generic",


  defaultGoal:
    "welcome",


  preferredDNA:[

    "friendly",

  ],


  recommendedMoments:[

    "welcome",

    "message",

    "story",

    "education",

    "followup",

  ],


} satisfies IndustryTemplate;