/**
 * =====================================================
 *
 * EXPERIENCE MOMENT
 *
 * The atomic unit of a QRE living experience.
 *
 * Compiler creates Moments.
 * Runtime plays Moments.
 * Frontend renders Moments.
 *
 * =====================================================
 */


// =====================================================
// EXPERIENCE MEANING
// =====================================================

export type ExperienceMomentType =

  // Core experience
  | "welcome"
  | "introduction"
  | "story"
  | "message"
  | "reveal"
  | "education"
  | "completion"


  // Memory
  | "memory"
  | "meeting"
  | "family"
  | "friends"
  | "favorite_memories"
  | "highlights"
  | "timeline"
  | "milestone"
  | "legacy"
  | "future"
  | "time_capsule"


  // People / identity
  | "profile"
  | "social"
  | "guestbook"
  | "guest_messages"


  // Location
  | "arrival"
  | "location"
  | "venue"


  // Media
  | "photo"
  | "photos"
  | "video"
  | "audio"
  | "soundtrack"
  | "media"
  | "replay"


  // Commerce
  | "product"
  | "offer"
  | "booking"
  | "payment"
  | "reward"
  | "review"
  | "menu"
  | "ticket"
  | "merch"


  // Events
  | "performance"
  | "artist"
  | "setlist"
  | "crowd"
  | "backstage"


  // Engagement
  | "playful"
  | "interaction"
  | "reaction"
  | "share"
  | "excited"
  | "cta"


  // Product passports
  | "product_passport"
  | "strain_profile"
  | "lab_results"
  | "terpene_profile"
  | "cultivation_story"
  | "batch_history"
  | "effects_guide"


  // Pets / safety
  | "pet_profile"
  | "pet_story"
  | "pet_journey"
  | "pet_health"
  | "pet_birthday"
  | "lost_pet"
  | "emergency_info"
  | "medical_profile"
  | "care_instructions"
  | "adoption_story"





// =====================================================
// PLAYER RENDERING SYSTEM
// =====================================================

export type ExperienceComponent =

  | "hero"

  | "story"

  | "memory"

  | "gallery"

  | "video"

  | "audio"

  | "media"

  | "timeline"

  | "geo_memory"

  | "map"

  | "profile"

  | "social"

  | "product"

  | "payment"

  | "reward"

  | "review"

  | "menu"

  | "education"

  | "guestbook"

  | "countdown"

  | "cta"

  | "interaction";





// =====================================================
// MEDIA LAYER
// =====================================================

export type ExperienceMediaType =

  | "image"

  | "video"

  | "audio";



export type ExperienceMedia = {

  id:string;


  type:ExperienceMediaType;


  url:string;


  thumbnail?:string;


  duration?:number;


  title?:string;


  description?:string;


  metadata?:Record<string,unknown>;

};





// =====================================================
// AUDIO EXPERIENCE
// =====================================================

export type ExperienceAudio = {

  url:string;


  volume?:number;


  autoplay?:boolean;


  loop?:boolean;


  fadeIn?:number;


  fadeOut?:number;


  metadata?:Record<string,unknown>;

};





// =====================================================
// GEO / MEMORY CONTEXT
// =====================================================

export type ExperienceLocation = {

  latitude:number;

  longitude:number;

  accuracy?:number;

  name?:string;

  city?:string;

  region?:string;

};





// =====================================================
// USER INTERACTION
// =====================================================

export type ExperienceInteraction = {

  action:

    | "open"

    | "share"

    | "purchase"

    | "unlock"

    | "continue"

    | "submit";


  label?:string;


  url?:string;


  metadata?:Record<string,unknown>;

};





// =====================================================
// EXPERIENCE MOMENT
// =====================================================

export type ExperienceMoment = {


  /**
   * Meaning layer.
   */
  type:
    ExperienceMomentType;



  /**
   * Runtime renderer.
   */
  component:
    ExperienceComponent;



  title:
    string;



  subtitle?:string;



  description?:string;



  icon?:string;



  animation?:string;



  editable:
    boolean;



  demo:
    boolean;



  order:
    number;



  /**
   * Everything needed by runtime.
   */
  payload: {


    text?:string;


    media?:ExperienceMedia[];


    audio?:ExperienceAudio;



    location?:ExperienceLocation;



    interaction?:ExperienceInteraction;



    data?:Record<string,unknown>;


  };


};