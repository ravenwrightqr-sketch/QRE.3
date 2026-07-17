/**
 * =====================================================
 * QRE PET TRAVEL EXPERIENCE
 * =====================================================
 *
 * Travel companion experience.
 *
 * Pet adventures
 * Pet-friendly locations
 * Travel memories
 * Emergency information
 *
 * =====================================================
 */

import type {
  ExperienceMomentType,
} from "@qre/contracts";


export const petTravelExperience = {


  industry:
    "pet",


  experience:
    "pet_travel",



  recommendedMoments:[


    "welcome",


    "pet_profile",


    "location",


    "pet_journey",


    "photos",


    "memory",


    "care_instructions",


    "emergency_info",


    "share",


  ] satisfies ExperienceMomentType[],



  features:[


    "travel profile",


    "favorite destinations",


    "pet friendly locations",


    "trip timeline",


    "adventure photos",


    "emergency information",


    "travel memories",


  ],



} as const;