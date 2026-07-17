/**
 * =====================================================
 * QRE PET INDUSTRY TEMPLATE
 * =====================================================
 *
 * AI recognition layer for pet experiences.
 *
 * Covers:
 *
 * - Pet identity tags
 * - Lost pet recovery
 * - Rescue stories
 * - Daycare profiles
 * - Travel companions
 * - Memorials
 * - Social pet profiles
 *
 * Scan
 * ↓
 * Pet Identity
 * ↓
 * Story
 * ↓
 * Safety
 * ↓
 * Connection
 *
 * =====================================================
 */


import type {
  IndustryTemplate,
} from "../templateTypes.js";



export const petIndustry = {


  industry:
    "pet",



  defaultGoal:
    "memory",



  preferredDNA:[


    "emotional",


    "trustworthy",


    "friendly",


    "cinematic",


  ],



  recommendedMoments:[


    "welcome",


    "pet_profile",


    "photos",


    "pet_story",


    "location",


    "care_instructions",


    "emergency_info",


    "share",


    "followup",


  ],



  keywords:[


    "dog",


    "cat",


    "pet",


    "puppy",


    "kitten",


    "rescue",


    "adoption",


    "lost pet",


    "missing dog",


    "missing cat",


    "daycare",


    "boarding",


    "grooming",


    "vet",


    "animal",


  ],



  experiences:[


    "pet_identity",


    "lost_pet_recovery",


    "pet_travel",


    "pet_social",


    "pet_memorial",


    "pet_rescue",


  ],



} satisfies IndustryTemplate;