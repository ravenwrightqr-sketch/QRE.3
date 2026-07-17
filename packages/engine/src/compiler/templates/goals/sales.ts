/**
 * =====================================================
 * QRE SALES GOAL DNA
 * =====================================================
 *
 * Universal conversion objective.
 *
 * Used by:
 *
 * restaurants
 * retail
 * events
 * services
 * creators
 * products
 *
 * This does NOT execute anything.
 * It only describes the experience strategy.
 *
 * =====================================================
 */

import type {
  ExperienceGoal,
  ExperienceMomentType,
} from "@qre/contracts";


export const salesGoal = {

  goal:
    "sell" satisfies ExperienceGoal,


  purpose:
    "Convert attention into action.",


  preferredMoments: [

    "welcome",

    "story",

    "product",

    "offer",

    "payment",

    "followup",

  ] satisfies ExperienceMomentType[],



  recommendedDNA: [

    "energetic",

    "viral",

    "premium",

  ],



  recommendedFeatures: [

    "product showcase",

    "special offer",

    "call to action",

    "checkout",

    "contact",

  ],



  analytics: [

    "views",

    "clicks",

    "conversions",

    "payments",

    "repeat_visits",

  ],

} as const;