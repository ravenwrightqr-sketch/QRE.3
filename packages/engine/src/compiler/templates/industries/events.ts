/**
 * =====================================================
 * QRE EVENT EXPERIENCE ENGINE
 * =====================================================
 *
 * Turns an event QR/NFC scan into a living experience.
 *
 * Designed for:
 *
 * festivals
 * raves
 * concerts
 * horror events
 * anime conventions
 * comic conventions
 * cosplay events
 * creator events
 * VIP experiences
 *
 *
 * Scan
 * ↓
 * Arrival
 * ↓
 * Identity
 * ↓
 * Event Story
 * ↓
 * Artist / Creator
 * ↓
 * Memories
 * ↓
 * Community
 * ↓
 * Return
 *
 * =====================================================
 */


import type {
  ExperienceGoal,
  ExperienceIndustry,
  ExperienceMomentType,
} from "@qre/contracts";



export const eventsIndustry = {


  industry:

    "event" satisfies ExperienceIndustry,



  defaultGoal:

    "memory" satisfies ExperienceGoal,



  purpose:

    "Create unforgettable interactive event experiences that connect fans, artists, and communities.",



  preferredDNA:[


    "cinematic",


    "viral",


    "energetic",


    "premium",


  ],



  recommendedMoments:[


    "welcome",


    "arrival",


    "venue",


    "artist",


    "performance",


    "setlist",


    "friends",


    "photos",


    "video",


    "highlights",


    "replay",


    "share",


    "reward",


  ] satisfies ExperienceMomentType[],



  supportedExperiences:[


    "festival",


    "rave",


    "concert",


    "horror_event",


    "anime_convention",


    "comic_convention",


    "cosplay_event",


    "creator_meetup",


    "vip_experience",


  ],



  features:[


    "digital event passport",


    "artist profiles",


    "exclusive content drops",


    "fan memories",


    "photo collection",


    "event timeline",


    "VIP unlocks",


    "collectible moments",


    "merch integration",


    "community sharing",


  ],



} as const;