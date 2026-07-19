export type ExperienceMomentType =

  // =================================
  // CORE FLOW
  // =================================

  | "welcome"
  | "message"
  | "story"
  | "introduction"
  | "education"
  | "reveal"
  | "completion"



  // =================================
  // BUSINESS
  // =================================

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



  // =================================
  // LOCATION / PRESENCE
  // =================================

  | "arrival"
  | "location"
  | "venue"



  // =================================
  // MEDIA
  // =================================

  | "photos"
  | "video"
  | "soundtrack"
  | "replay"



  // =================================
  // MEMORY / STORYTELLING
  // =================================

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



  // =================================
  // WEDDING
  // =================================

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



  // =================================
  // EVENTS / CULTURE
  // =================================

  | "performance"
  | "artist"
  | "setlist"
  | "crowd"
  | "backstage"
  | "ticket"
  | "merch"



  // =================================
  // ENGAGEMENT
  // =================================

  | "playful"
  | "share"
  | "reaction"
  | "excited"



  // =================================
  // CANNABIS / PRODUCT PASSPORT
  // =================================

  | "strain_profile"
  | "product_passport"
  | "lab_results"
  | "terpene_profile"
  | "cultivation_story"
  | "batch_history"
  | "effects_guide"



  // =================================
  // PET / SAFETY / IDENTITY
  // =================================

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





export type ExperienceMoment = {

  type: ExperienceMomentType;

  component: ExperienceComponent;

  title: string;

  subtitle?: string;

  description?: string;

  icon?: string;

  animation?: string;

  editable: boolean;

  demo: boolean;

  order: number;

  payload: Record<string, unknown>;

};





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
    | "interaction";