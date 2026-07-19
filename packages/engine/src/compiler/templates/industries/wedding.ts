/**
 * =====================================================
 * QRE WEDDING INDUSTRY TEMPLATE
 * =====================================================
 *
 * Emotional memory architecture.
 *
 * Wedding QR/NFC experience compiler DNA.
 *
 * Used for:
 *
 * - Weddings
 * - Engagements
 * - Proposals
 * - Anniversaries
 * - Couple archives
 * - Family memory systems
 *
 *
 * Pipeline:
 *
 * Prompt
 *   ↓
 * Wedding Intent
 *   ↓
 * Wedding DNA
 *   ↓
 * Moments
 *   ↓
 * Blueprint
 *   ↓
 * Flow
 *   ↓
 * Cinematic Runtime
 *
 * =====================================================
 */


import type {
  IndustryTemplate,
} from "../templateTypes.js";



import type {
  ExperienceTone,
  ExperienceMomentType,
} from "@qre/contracts";





export const weddingIndustry = {


  industry:
    "wedding",



  defaultGoal:
    "memory",



  /**
   * Emotional design language.
   *
   * Controls:
   * - narration
   * - cinematic style
   * - player mood
   * - AI generation behavior
   */
  preferredDNA:
    [

      "cinematic",

      "emotional",

      "premium",

      "trustworthy",

    ] satisfies ExperienceTone[],





  /**
   * Default experience sequence.
   *
   * These become atoms/moments.
   *
   * Blueprint composer can modify.
   */
  recommendedMoments:
    [

      "welcome",

      "love_story",

      "ceremony",

      "guestbook",

      "photos",

      "video",

      "location",

      "timeline",

      "anniversary",

      "future",

    ] satisfies ExperienceMomentType[],






  /**
   * Prompt recognition signals.
   *
   * Used by intent detector.
   */
  keywords:
    [

      "wedding",

      "bride",

      "groom",

      "marriage",

      "engagement",

      "proposal",

      "anniversary",

      "ceremony",

      "venue",

      "love story",

      "family",

      "couple",

      "vows",

      "reception",

      "honeymoon",

    ],






  /**
   * Experience products this industry can create.
   *
   * Used for generation suggestions.
   */
  experiences:
    [

      "love_story",

      "guest_memory",

      "wedding_archive",

      "anniversary_journey",

      "couple_profile",

      "forever_timeline",

      "digital_guestbook",

    ],



} satisfies IndustryTemplate;