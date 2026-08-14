import type { CognitiveAnalyticsSignal, CognitiveMindState } from "@qre/contracts";

export type UniversalMindContext = {
  memorySummary?: string[];
  memories?: unknown[];
  analytics?: CognitiveAnalyticsSignal;
  location?: { label?: string; city?: string; country?: string; latitude?: number; longitude?: number };
  event?: { name?: string; venue?: string; date?: string; description?: string; participants?: string[] };
  entityHints?: string[];
  creativePreferences?: string[];
  feedback?: { accepted?: string[]; rejected?: string[] };
  state?: CognitiveMindState;
};
