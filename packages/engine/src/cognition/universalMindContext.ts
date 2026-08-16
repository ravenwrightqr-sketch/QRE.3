import type { CognitiveAnalyticsSignal, CognitiveMindState, ExperiencePresenceContext } from "@qre/contracts";

export type GeoAnchorRole = "physical_site" | "experience_place" | "event_venue" | "memory_place" | "reference_place";

export type UniversalMindContext = {
  memorySummary?: string[];
  memories?: unknown[];
  analytics?: CognitiveAnalyticsSignal;
  presence?: ExperiencePresenceContext;
  location?: {
    label?: string;
    city?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    role?: GeoAnchorRole;
    source?: string;
  };
  event?: { name?: string; venue?: string; date?: string; description?: string; participants?: string[] };
  entityHints?: string[];
  creativePreferences?: string[];
  feedback?: { accepted?: string[]; rejected?: string[] };
  state?: CognitiveMindState;
};
