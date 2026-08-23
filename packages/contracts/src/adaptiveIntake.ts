export type AdaptiveStepKind = "question" | "choice" | "media" | "capability" | "review" | "create";

export type AdaptiveField =
  | "domain"
  | "subject"
  | "subjectType"
  | "name"
  | "status"
  | "facts"
  | "goal"
  | "audience"
  | "tone"
  | "output"
  | "media"
  | "location"
  | "time"
  | "capabilities";

export type AdaptiveCapabilityId =
  | "living_profile"
  | "memory"
  | "cinematic_video"
  | "gallery"
  | "event"
  | "ticket"
  | "reward"
  | "booking"
  | "menu"
  | "social"
  | "share"
  | "location"
  | "guestbook"
  | "property_record"
  | "pet_identity"
  | "collaborative_memory"
  | "contact"
  | "redirect";

export type AdaptiveExperienceBrief = {
  sessionId: string;
  assetId?: string;
  originalIntent: string;
  domain?: string;
  subject?: string;
  subjectType?: string;
  fields: Record<string, string>;
  facts: string[];
  preferences: string[];
  audience?: string;
  goal?: string;
  tone: string[];
  output?: string;
  media: string[];
  capabilities: AdaptiveCapabilityId[];
  rejectedCapabilities: AdaptiveCapabilityId[];
  answeredStepIds: string[];
  completeness: number;
  readyForAuthor: boolean;
};

export type AdaptiveCapabilityDefinition = {
  id: AdaptiveCapabilityId;
  label: string;
  description: string;
  intents: string[];
  requiredFields: AdaptiveField[];
  usefulFields: AdaptiveField[];
  outputs: string[];
  authoring: "none" | "optional" | "required";
  media: "none" | "optional" | "recommended" | "required";
};

export type AdaptiveStepOption = {
  id: string;
  label: string;
  value: string;
  capabilityId?: AdaptiveCapabilityId;
};

export type AdaptiveStep = {
  id: string;
  kind: AdaptiveStepKind;
  field?: AdaptiveField;
  title: string;
  explanation?: string;
  placeholder?: string;
  options?: AdaptiveStepOption[];
  optional?: boolean;
  why: string;
  readyForAuthor: boolean;
};

export type AdaptiveAnswer = {
  stepId: string;
  value?: string;
  values?: string[];
  selectedOptionIds?: string[];
  action: "submit" | "select" | "skip" | "upload";
};

export type AdaptiveIntakeState = {
  brief: AdaptiveExperienceBrief;
  step: AdaptiveStep;
  suggestedCapabilities: AdaptiveCapabilityId[];
};

export const ADAPTIVE_CAPABILITIES: readonly AdaptiveCapabilityDefinition[] = [
  { id: "living_profile", label: "Living profile", description: "A profile that can keep changing as the thing changes.", intents: ["identity", "profile", "introduce", "pet", "person", "business", "property"], requiredFields: ["name"], usefulFields: ["facts", "media", "location"], outputs: ["profile"], authoring: "optional", media: "optional" },
  { id: "memory", label: "Memory", description: "A persistent record of moments, facts, people and places.", intents: ["memory", "remember", "history", "archive", "life", "wedding", "travel", "memorial"], requiredFields: ["facts"], usefulFields: ["subject", "location", "time", "media"], outputs: ["memory"], authoring: "optional", media: "recommended" },
  { id: "cinematic_video", label: "Movie / video", description: "A cinematic sequence authored from supplied reality.", intents: ["movie", "video", "film", "cinematic", "story", "promo"], requiredFields: ["facts", "output"], usefulFields: ["tone", "audience", "media"], outputs: ["cinematicScenes"], authoring: "required", media: "recommended" },
  { id: "gallery", label: "Photo / media gallery", description: "A browsable media experience tied to the asset.", intents: ["gallery", "photos", "media", "album"], requiredFields: ["media"], usefulFields: ["facts", "location"], outputs: ["gallery"], authoring: "none", media: "required" },
  { id: "event", label: "Event experience", description: "A living experience for an event or gathering.", intents: ["event", "party", "festival", "wedding", "ceremony", "concert"], requiredFields: ["name", "time"], usefulFields: ["location", "media", "facts"], outputs: ["event"], authoring: "optional", media: "recommended" },
  { id: "ticket", label: "Ticket / entry", description: "A scannable event identity with check-in and redemption.", intents: ["ticket", "entry", "admission", "access"], requiredFields: ["name", "time"], usefulFields: ["location", "audience"], outputs: ["ticket"], authoring: "none", media: "optional" },
  { id: "reward", label: "Reward", description: "A reward, offer or points experience.", intents: ["reward", "offer", "discount", "loyalty", "points", "promotion", "sale"], requiredFields: ["goal"], usefulFields: ["audience", "time", "facts"], outputs: ["reward"], authoring: "none", media: "optional" },
  { id: "booking", label: "Booking / inquiry", description: "A direct action for booking or requesting contact.", intents: ["booking", "appointment", "contact", "inquiry", "schedule", "showing"], requiredFields: ["goal"], usefulFields: ["audience", "time"], outputs: ["booking"], authoring: "none", media: "optional" },
  { id: "menu", label: "Information / menu", description: "A clean information destination for a physical object.", intents: ["menu", "information", "details", "website", "catalog"], requiredFields: ["goal"], usefulFields: ["media"], outputs: ["menu"], authoring: "none", media: "optional" },
  { id: "social", label: "Social / links", description: "Live social or external links behind the object.", intents: ["instagram", "tiktok", "social", "links", "follow"], requiredFields: ["goal"], usefulFields: ["audience"], outputs: ["social"], authoring: "none", media: "none" },
  { id: "share", label: "Share", description: "A shareable experience or memory endpoint.", intents: ["share", "send", "give", "gift"], requiredFields: ["goal"], usefulFields: ["audience"], outputs: ["share"], authoring: "optional", media: "optional" },
  { id: "location", label: "Location", description: "A place anchor used for the physical site or a memory.", intents: ["location", "place", "map", "where"], requiredFields: ["location"], usefulFields: ["time", "facts"], outputs: ["geo"], authoring: "optional", media: "optional" },
  { id: "guestbook", label: "Guestbook", description: "A contribution surface for notes and memories.", intents: ["guestbook", "messages", "notes", "contribute", "memories"], requiredFields: ["goal"], usefulFields: ["audience", "media"], outputs: ["guestbook"], authoring: "optional", media: "optional" },
  { id: "property_record", label: "Property record", description: "A persistent property identity and knowledge record.", intents: ["property", "real estate", "home", "house", "estate", "building", "development"], requiredFields: ["name", "location"], usefulFields: ["facts", "media", "time"], outputs: ["property"], authoring: "optional", media: "recommended" },
  { id: "pet_identity", label: "Pet identity", description: "A living identity for a pet, rescue animal or animal for sale.", intents: ["dog", "cat", "pet", "puppy", "kitten", "rescue", "breeder", "adopt"], requiredFields: ["name", "subjectType"], usefulFields: ["facts", "media", "goal", "audience"], outputs: ["petProfile"], authoring: "optional", media: "recommended" },
  { id: "collaborative_memory", label: "Collaborative memory", description: "Let other people contribute memories to the object.", intents: ["guests", "community", "collaborative", "collect", "contribute"], requiredFields: ["goal"], usefulFields: ["audience", "media", "location"], outputs: ["collaborativeMemory"], authoring: "optional", media: "recommended" },
  { id: "contact", label: "Contact / inquiry", description: "Give the scanner a direct way to reach the owner or organization.", intents: ["contact", "call", "email", "message", "inquire"], requiredFields: ["goal"], usefulFields: ["audience"], outputs: ["contact"], authoring: "none", media: "none" },
  { id: "redirect", label: "Link / destination", description: "Send the scanner directly somewhere useful.", intents: ["link", "website", "url", "redirect"], requiredFields: ["goal"], usefulFields: ["audience"], outputs: ["redirect"], authoring: "none", media: "none" },
];