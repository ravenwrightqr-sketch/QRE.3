/**
 * =====================================================
 * QRE CANNABIS LOYALTY EXPERIENCE ENGINE
 * =====================================================
 *
 * Turns a cannabis customer into a long-term community member.
 *
 * Scan
 * ↓
 * Brand Welcome
 * ↓
 * Product Discovery
 * ↓
 * Education
 * ↓
 * Rewards
 * ↓
 * Repeat Customer
 *
 * Designed for:
 *
 * dispensaries
 * cultivators
 * brands
 * delivery services
 * membership clubs
 *
 * =====================================================
 */

import type {
  ExperienceMomentType,
} from "@qre/contracts";



export const cannabisLoyaltyExperience = {


  industry:
    "cannabis",



  experience:
    "cannabis_loyalty",



  purpose:
    "Create trusted cannabis communities through education, rewards, and personalized customer experiences.",



  preferredDNA:[


    "premium",


    "trustworthy",


    "educational",


    "viral",


  ],



  recommendedMoments:[


    "welcome",


    "product_passport",


    "strain_profile",


    "effects_guide",


    "terpene_profile",


    "education",


    "offer",


    "reward",


    "social",


    "followup",



  ] satisfies ExperienceMomentType[],



  features:[


    "customer loyalty profile",


    "favorite products",


    "strain education",


    "personal recommendations",


    "member rewards",


    "exclusive drops",


    "customer reviews",


    "brand community",


    "repeat purchase incentives",


  ],



  analytics:[


    "product_scans",


    "education_views",


    "reward_claims",


    "repeat_visits",


    "favorite_products",


    "customer_retention",


  ],



} as const;