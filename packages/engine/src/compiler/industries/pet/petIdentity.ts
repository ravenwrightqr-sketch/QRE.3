/**
 * =====================================================
 * QRE PET IDENTITY EXPERIENCE
 * =====================================================
 *
 * A QR/NFC pet tag becomes:
 *
 * Pet Identity
 * ↓
 * Safety Profile
 * ↓
 * Personality
 * ↓
 * Owner Connection
 * ↓
 * Lost Recovery
 *
 * Designed for:
 *
 * - pet tags
 * - collars
 * - shelters
 * - breeders
 * - daycare
 * - travel
 *
 * =====================================================
 */

import type {
  ExperienceMomentType,
} from "@qre/contracts";


export const petIdentity = {


  industry:
    "pet",



  purpose:

    "Turn a pet tag into a living digital identity and safety profile.",



  preferredDNA:[

    "emotional",

    "trustworthy",

    "friendly",

    "viral",

  ],



  recommendedMoments:[


    "welcome",


    "pet_profile",


    "pet_story",


    "photos",


    "medical_profile",


    "care_instructions",


    "lost_pet",


    "emergency_info",


    "share",


  ] as ExperienceMomentType[],



  features:[


    "pet name",


    "owner contact protection",


    "medical information",


    "vaccination records",


    "personality profile",


    "favorite activities",


    "emergency instructions",


    "lost pet recovery",


  ],



} as const;