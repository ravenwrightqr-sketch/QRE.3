/**
 * =====================================================
 * QRE CULTURE / SESH EXPERIENCE TEMPLATE
 * =====================================================
 *
 * Community-driven experiences.
 *
 * Designed for:
 *
 * - Cannabis culture
 * - Creator communities
 * - Underground events
 * - Art collectives
 * - Local scenes
 * - Lifestyle brands
 *
 *
 * Scan
 * ↓
 * Identity
 * ↓
 * Community
 * ↓
 * Story
 * ↓
 * Loyalty
 *
 * =====================================================
 */


import type {
 ExperienceIndustry,
 ExperienceGoal,
 ExperienceMomentType,
} from "@qre/contracts";



export const seshIndustry = {


 industry:
   "sesh" satisfies ExperienceIndustry,



 title:
   "Culture & Community Experiences",



 defaultGoal:
   "loyalty" satisfies ExperienceGoal,



 preferredDNA:[


   "viral",


   "friendly",


   "premium",


   "emotional",


 ],



 recommendedMoments:[


   "welcome",


   "location",


   "arrival",


   "friends",


   "story",


   "photos",


   "highlights",


   "share",


   "reward",


   "followup",


 ] satisfies ExperienceMomentType[],



 keywords:[


   "sesh",


   "community",


   "culture",


   "creator",


   "collective",


   "cannabis",


   "art",


   "streetwear",


   "local scene",


   "underground",


   "lifestyle",


 ],



 experiences:[


   "community_passport",


   "creator_drop",


   "culture_archive",


   "member_identity",


   "local_rewards",


   "event_memory",


 ],



 recommendedFeatures:[


   "community profiles",


   "member rewards",


   "exclusive drops",


   "location memories",


   "creator stories",


   "social sharing",


   "membership identity",


 ],



} as const;