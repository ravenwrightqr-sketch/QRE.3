import type { CognitiveState } from "../experience/cognitiveState.js";
import type { ExperiencePresenceContext } from "../experience/presence.js";
import type { MediaAsset } from "../media.js";
import type { IdentityState } from "./identityState.js";
import type { AuthorRealityProvenance } from "./realityProvenance.js";
import type { CognitiveCreativeLearning } from "./cognition.js";

export type CognitiveAuthorGeo = {
  label?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  role?:
    | "physical_site"
    | "experience_place"
    | "event_venue"
    | "memory_place"
    | "reference_place";
  source?: string;
  time?: string;
};

export type CognitiveAuthorMedia = MediaAsset & {
  /** Photos are visual evidence / beats. QRE does not invent captions for them. */
  role?: "evidence" | "memory" | "photo_beat" | "reference";
  observedAt?: string;
  place?: string;
  source?: string;
  provenance?: AuthorRealityProvenance;
};

export type CognitiveAuthorCreativeSafety = {
  class: "ordinary" | "memorial";
  confidence: number;
  evidence: string[];
};

export type CognitiveAuthorContext = {
  /** Canonical semantic snapshot produced once by Universal Mind. */
  cognitiveState?: CognitiveState | null;
  identityState?: IdentityState | null;
  geo?: CognitiveAuthorGeo | null;
  presence?: ExperiencePresenceContext | null;
  analytics?: {
    scans?: number;
    completions?: number;
    abandons?: number;
    replays?: number;
    ctaClicks?: number;
    errors?: number;
    engagement?: number;
    friction?: number;
  } | null;
  domain?: {
    mode?: string;
    signature?: string;
    tensions?: Array<Record<string, unknown>>;
    opportunity?: Record<string, unknown> | null;
    continuity?: string[];
  } | null;
  creativeLearning?: CognitiveCreativeLearning | null;
  creativeSafety?: CognitiveAuthorCreativeSafety | null;
  provenanceFacts?: Array<{
    text: string;
    provenance: AuthorRealityProvenance;
  }>;
  media?: CognitiveAuthorMedia[];
  authorizedCreativeInstructions?: string[];
  textBeatTarget?: number;
  photoBeatsAreSilent?: boolean;
};