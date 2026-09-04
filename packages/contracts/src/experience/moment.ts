import type { GeoLocation } from "../geo/geoStory.js";
import type { MediaAsset } from "../media/media.js";

export type ExperienceMomentType =
  | "system" | "message" | "action" | "media" | "welcome" | "story" | "introduction" | "education" | "reveal" | "completion"
  | "offer" | "product" | "booking" | "payment" | "reward" | "review" | "social" | "profile" | "menu" | "followup" | "interaction"
  | "arrival" | "location" | "venue" | "photos" | "video" | "soundtrack" | "replay" | "memory" | "meeting" | "family" | "friends"
  | "favorite_memories" | "highlights" | "future" | "milestone" | "timeline" | "legacy" | "love_story" | "proposal" | "ceremony" | "vows"
  | "first_dance" | "guestbook" | "guest_messages" | "wedding_gallery" | "honeymoon" | "anniversary" | "time_capsule" | "performance"
  | "artist" | "setlist" | "crowd" | "backstage" | "ticket" | "merch" | "playful" | "share" | "reaction" | "excited" | "strain_profile"
  | "product_passport" | "lab_results" | "terpene_profile" | "cultivation_story" | "batch_history" | "effects_guide" | "pet_profile"
  | "lost_pet" | "emergency_info" | "medical_profile" | "care_instructions" | "adoption_story" | "pet_story" | "pet_journey" | "pet_health"
  | "pet_birthday";

export type ExperienceAction = "payment" | "redirect" | "unlock" | "flow" | "cta";

export type ExperienceComponent =
  | "hero" | "story" | "memory" | "gallery" | "video" | "timeline" | "geo_memory" | "reward" | "payment" | "review" | "profile"
  | "social" | "map" | "menu" | "product" | "education" | "countdown" | "guestbook" | "cta" | "interaction" | "system";

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
