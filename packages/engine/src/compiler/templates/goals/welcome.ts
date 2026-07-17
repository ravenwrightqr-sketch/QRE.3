/**
 * =====================================================
 * QRE WELCOME GOAL
 * =====================================================
 *
 * Universal first-impression experience goal.
 *
 * Used by:
 *
 * hospitality
 * restaurants
 * events
 * personal products
 * businesses
 * services
 *
 * Purpose:
 *
 * Turn a scan into a warm first interaction.
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


export const welcomeGoal = {

  goal:
    "welcome" satisfies ExperienceGoal,


  purpose:
    "Create a memorable first interaction and guide the visitor.",



  preferredMoments: [

    "welcome",

    "introduction",

    "story",

    "location",

    "education",

    "followup",

  ] satisfies ExperienceMomentType[],



  recommendedDNA: [

    "friendly",

    "cinematic",

    "premium",

  ],



  recommendedFeatures: [

    "brand introduction",

    "welcome message",

    "directions",

    "information",

    "contact",

  ],



  analytics: [

    "scan_started",

    "experience_started",

    "completion_rate",

    "return_visits",

  ],

} as const;