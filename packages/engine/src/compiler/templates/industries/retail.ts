/**
 * =====================================================
 * QRE RETAIL INDUSTRY TEMPLATE
 * =====================================================
 *
 * Covers:
 *
 * jewelry
 * handmade products
 * collectibles
 * clothing
 * art pieces
 * QR keychains
 * NFC products
 * gifts
 * merchandise
 *
 * Industry question:
 *
 * "What type of business or object is this?"
 *
 * =====================================================
 */

import type {
  ExperienceIndustry,
  ExperienceGoal,
  ExperienceMomentType,
} from "@qre/contracts";


export const retailIndustry = {

  industry:
    "retail" satisfies ExperienceIndustry,


  supportedExperiences: [

    "jewelry",

    "handmade products",

    "collectibles",

    "art",

    "gifts",

    "merchandise",

    "personalized products",

    "physical keepsakes",

  ],



  defaultGoal:

    "storytelling" satisfies ExperienceGoal,



  preferredDNA: [

    "premium",

    "cinematic",

    "emotional",

  ],



  recommendedMoments: [

    "welcome",

    "introduction",

    "story",

    "product",

    "photos",

    "memory",

    "review",

    "share",

  ] satisfies ExperienceMomentType[],



  recommendedFeatures: [

    "product story",

    "maker story",

    "behind the scenes",

    "authentication",

    "customer memories",

    "social sharing",

    "repeat engagement",

  ],



  analytics: [

    "product_scans",

    "story_completion",

    "shares",

    "reviews",

    "repeat_scans",

  ],

} as const;