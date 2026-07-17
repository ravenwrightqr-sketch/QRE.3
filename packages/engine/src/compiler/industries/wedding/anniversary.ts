/**
 * =====================================================
 * QRE WEDDING ANNIVERSARY EXPERIENCE
 * =====================================================
 *
 * A wedding memory that grows over time.
 *
 * Wedding Day
 * ↓
 * First Anniversary
 * ↓
 * New Memories
 * ↓
 * Family Timeline
 * ↓
 * Forever Archive
 *
 * Designed for:
 *
 * couples
 * anniversaries
 * family keepsakes
 * premium gifts
 *
 * =====================================================
 */


import type {
  ExperienceMomentType,
} from "@qre/contracts";



export const weddingAnniversaryExperience = {


  industry:
    "wedding",



  experience:
    "anniversary",



  purpose:

    "Create a lifelong relationship memory experience that evolves after the wedding day.",



  preferredDNA:[


    "emotional",


    "cinematic",


    "premium",


    "personal",


  ],



  recommendedMoments:[


    "welcome",


    "memory",


    "timeline",


    "photos",


    "video",


    "anniversary",


    "future",


    "family",


    "milestone",


    "legacy",



  ] satisfies ExperienceMomentType[],



  features:[


    "anniversary timeline",


    "relationship milestones",


    "new photo memories",


    "family updates",


    "future messages",


    "private couple archive",


    "yearly memory updates",


  ],



  analytics:[


    "return_visits",


    "memory_updates",


    "anniversary_views",


    "family_interactions",


  ],



} as const;