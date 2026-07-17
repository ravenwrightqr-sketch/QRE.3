/**
 * =====================================================
 * QRE WEDDING LOVE STORY EXPERIENCE
 * =====================================================
 *
 * Turns a wedding scan into a cinematic relationship journey.
 *
 * First meeting
 * ↓
 * The story
 * ↓
 * Proposal
 * ↓
 * Ceremony
 * ↓
 * Forever archive
 *
 * Designed for:
 *
 * weddings
 * engagements
 * anniversaries
 * couples
 * family keepsakes
 *
 * =====================================================
 */


import type {
  ExperienceMomentType,
} from "@qre/contracts";



export const weddingLoveStory = {


  industry:
    "wedding",



  experience:
    "love_story",



  purpose:

    "Create a cinematic digital story of a couple's journey.",



  preferredDNA:[


    "cinematic",


    "emotional",


    "premium",


  ],



  recommendedMoments:[


    "welcome",


    "love_story",


    "meeting",


    "proposal",


    "ceremony",


    "photos",


    "video",


    "timeline",


    "future",


    "anniversary",



  ] satisfies ExperienceMomentType[],



  features:[


    "couple introduction",


    "how we met story",


    "proposal memory",


    "relationship timeline",


    "photo gallery",


    "video memories",


    "future milestones",


    "anniversary archive",


  ],



} as const;