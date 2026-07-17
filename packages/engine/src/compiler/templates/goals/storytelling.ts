/**
 * =====================================================
 * QRE STORYTELLING GOAL
 * =====================================================
 *
 * Universal narrative experience goal.
 *
 * This is one of QRE's core differentiators.
 *
 * Used by:
 *
 * memory products
 * weddings
 * personal keychains
 * jewelry
 * brands
 * founders
 * creators
 * pets
 * events
 *
 * Purpose:
 *
 * Turn information into an emotional journey.
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


export const storytellingGoal = {

  goal:
    "storytelling" satisfies ExperienceGoal,


  purpose:
    "Create an emotional narrative that people remember and share.",



  preferredMoments: [

    "introduction",

    "arrival",

    "story",

    "memory",

    "photos",

    "soundtrack",

    "highlights" as ExperienceMomentType,

    "replay",

    "future",

  ] satisfies ExperienceMomentType[],



  recommendedDNA: [

    "cinematic",

    "emotional",

    "romantic",

  ],



  recommendedFeatures: [

    "timeline",

    "photos",

    "video",

    "audio",

    "locations",

    "personal messages",

    "memory replay",

  ],



  analytics: [

    "story_started",

    "moment_completed",

    "time_spent",

    "replays",

    "shares",

  ],

} as const;