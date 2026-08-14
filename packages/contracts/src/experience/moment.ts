import type { GeoLocation } from "../geoStory.js";
import type { MediaAsset } from "../media.js";

/**
 * STATUS: CANONICAL
 * ROLE: Single experience atom used by authoring, compiler output, runtime,
 * cinematic scenes, memory, and delivery.
 * INPUT: semantic experience information and/or runtime material.
 * OUTPUT: one stable experience unit.
 * MUST NOT: contain Prisma/database concerns or cognitive implementation details.
 *
 * This replaces the retired root contracts/moment.ts boundary. Runtime fields
 * are optional so the same contract can move from authoring -> cognition ->
 * runtime without introducing a second incompatible moment vocabulary.
 */
export type ExperienceMomentType =
  // Runtime primitives
  | "system"
  | "message"
  | "action"
  | "media"
  // Core flow
  | "welcome"
  | "story"
  | "introduction"
  | "education"
  | "reveal"
  | "completion"
  // Business
  | "offer"
  | "product"
  | "booking"
  | "payment"
  | "reward"
  | "review"
  | "social"
  | "profile"
  | "menu"
  | "followup"
  | "interaction"
  // Location / presence
  | "arrival"
  | "location"
  | "venue"
  // Media
  | "photos"
  | "video"
  | "soundtrack"
  | "replay"
  // Memory / storytelling
  | "memory"
  | "meeting"
  | "family"
  | "friends"
  | "favorite_memories"
  | "highlights"
  | "future"
  | "milestone"
  | "timeline"
  | "legacy"
  // Wedding
  | "love_story"
  | "proposal"
  | "ceremony"
  | "vows"
  | "first_dance"
  | "guestbook"
  | "guest_messages"
  | "wedding_gallery"
  | "honeymoon"
  | "anniversary"
  | "time_capsule"
  // Events / culture
  | "performance"
  | "artist"
  | "setlist"
  | "crowd"
  | "backstage"
  | "ticket"
  | "merch"
  // Engagement
  | "playful"
  | "share"
  | "reaction"
  | "excited"
  // Product passport
  | "strain_profile"
  | "product_passport"
  | "lab_results"
  | "terpene_profile"
  | "cultivation_story"
  | "batch_history"
  | "effects_guide"
  // Pet / safety / identity
  | "pet_profile"
  | "lost_pet"
  | "emergency_info"
  | "medical_profile"
  | "care_instructions"
  | "adoption_story"
  | "pet_story"
  | "pet_journey"
  | "pet_health"
  | "pet_birthday";

export type ExperienceAction =
  | "payment"
  | "redirect"
  | "unlock"
  | "flow"
  | "cta";

export type ExperienceComponent =
  | "hero"
  | "story"
  | "memory"
  | "gallery"
  | "video"
  | "timeline"
  | "geo_memory"
  | "reward"
  | "payment"
  | "review"
  | "profile"
  | "social"
  | "map"
  | "menu"
  | "product"
  | "education"
  | "countdown"
  | "guestbook"
  | "cta"
  | "interaction"
  | "system";

export type ExperienceMomentMeta = Record<string, unknown> & {
  duration?: number;
  author?: string;
  event?: string;
  source?: string;
  lens?: string;
  realityEventId?: string;
};

export type ExperienceMoment = {
  type: ExperienceMomentType;
  component?: ExperienceComponent;

  title?: string;
  subtitle?: string;
  description?: string;
  text?: string;
  icon?: string;
  animation?: string;

  editable: boolean;
  demo: boolean;
  order: number;

  payload: Record<string, unknown>;
  meta?: ExperienceMomentMeta;

  action?: ExperienceAction;
  url?: string;
  label?: string;

  location?: GeoLocation;
  media?: MediaAsset[];
};