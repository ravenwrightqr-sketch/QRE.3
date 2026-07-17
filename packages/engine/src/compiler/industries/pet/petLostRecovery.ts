/**
 * =====================================================
 * QRE PET LOST RECOVERY EXPERIENCE
 * =====================================================
 *
 * Emergency pet identity + recovery flow.
 *
 * Purpose:
 *
 * Help lost pets return home faster.
 *
 * QR/NFC powered.
 *
 * =====================================================
 */


import type {
  ExperienceMomentType,
} from "@qre/contracts";


export const petLostRecoveryExperience = {


  industry:
    "pet",


  experience:
    "lost_pet_recovery",


  recommendedMoments:[


    "welcome",


    "pet_profile",


    "emergency_info",


    "location",


    "share",


    "followup",


  ] satisfies ExperienceMomentType[],



  features:[


    "pet identity",


    "owner contact",


    "emergency information",


    "location reporting",


    "lost pet alert",


    "social sharing",


  ],



} as const;