/**
 * =====================================================
 * QRE LOYALTY GOAL
 * =====================================================
 *
 * Universal retention experience goal.
 *
 * Used by:
 *
 * restaurants
 * retail
 * memberships
 * clubs
 * events
 * communities
 * creators
 *
 * Purpose:
 *
 * Convert one-time interaction
 * into repeat engagement.
 *
 * NO DATABASE
 * NO EXECUTION
 *
 * =====================================================
 */

import type {
  ExperienceGoal,
  ExperienceMomentType,
} from "@qre/contracts";


export const loyaltyGoal = {

  goal:
    "loyalty" satisfies ExperienceGoal,


  purpose:
    "Increase repeat visits, engagement, and customer connection.",



  preferredMoments: [

    "welcome",
     
    "education",
    
    "offer",

    "reward",

    "review",

    "followup",

    "social",

  ] satisfies ExperienceMomentType[],



  recommendedDNA: [

    "viral",

    "friendly",

    "energetic",

  ],



  recommendedFeatures: [

    "rewards",

    "discounts",

    "membership",

    "referrals",

    "return incentives",

  ],



  analytics: [

    "repeat_scans",

    "reward_claims",

    "offer_clicks",

    "reviews",

    "customer_retention",

  ],

} as const;