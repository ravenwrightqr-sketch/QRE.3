/**
 * =====================================================
 * QRE RESTAURANT EXPERIENCE ENGINE
 * =====================================================
 *
 * Turns a restaurant QR/NFC scan into a living brand
 * experience.
 *
 * Scan
 * ↓
 * Welcome
 * ↓
 * Menu / Product
 * ↓
 * Chef Story
 * ↓
 * Loyalty
 * ↓
 * Return Visit
 *
 * Designed for:
 *
 * restaurants
 * cafes
 * bars
 * breweries
 * food trucks
 * hospitality brands
 *
 * =====================================================
 */


import type {
  ExperienceGoal,
  ExperienceMomentType,
  ExperienceIndustry,
} from "@qre/contracts";



export const restaurantExperience = {


  industry:

    "restaurant" satisfies ExperienceIndustry,



  defaultGoal:

    "loyalty" satisfies ExperienceGoal,



  purpose:

    "Turn every table interaction into a memorable brand experience.",



  preferredDNA:[


    "premium",


    "friendly",


    "viral",


  ],



  recommendedMoments:[


    "welcome",


    "menu",


    "product",


    "story",


    "education",


    "offer",


    "reward",


    "review",


    "social",


    "followup",


  ] satisfies ExperienceMomentType[],



  features:[


    "digital menu",


    "chef story",


    "signature dish profiles",


    "ingredient education",


    "loyalty rewards",


    "customer reviews",


    "special offers",


    "return visit campaigns",


    "social sharing",


  ],



} as const;