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
 * =====================================================
 */


import type {
  IndustryTemplate,
} from "../templateTypes.js";


export const retailIndustry = {


  industry:

    "retail",



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

    "storytelling",



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

  ],



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


} satisfies IndustryTemplate;