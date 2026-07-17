/**
 * =====================================================
 * QRE WEDDING GUEST MEMORY EXPERIENCE
 * =====================================================
 *
 * A wedding becomes a living archive.
 *
 * Guest Scan
 * ↓
 * Welcome
 * ↓
 * Guest Message
 * ↓
 * Photos
 * ↓
 * Shared Memories
 * ↓
 * Forever Collection
 *
 * Designed for:
 *
 * weddings
 * receptions
 * celebrations
 * family events
 *
 * =====================================================
 */


import type {
  ExperienceMomentType,
} from "@qre/contracts";



export const weddingGuestMemory = {


  industry:
    "wedding",



  experience:
    "guest_memory",



  purpose:

    "Transform guest interactions into a permanent digital memory archive.",



  preferredDNA:[


    "emotional",


    "cinematic",


    "premium",


    "viral",


  ],



  recommendedMoments:[


    "welcome",


    "guestbook",


    "message",


    "photos",


    "video",


    "share",


    "reaction",


    "timeline",


    "memory",



  ] satisfies ExperienceMomentType[],



  features:[


    "guest messages",


    "photo uploads",


    "video memories",


    "voice messages",


    "guest reactions",


    "memory timeline",


    "private family archive",


    "social sharing",


  ],



  analytics:[


    "guest_scans",


    "messages_created",


    "photos_uploaded",


    "memories_shared",


  ],



} as const;