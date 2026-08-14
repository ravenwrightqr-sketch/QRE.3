export type CognitiveMindRuntimeState = {
  compileCount?: number;
  eventHistory?: string[];
  entityStates?: Record<string, { appearances?: number; places?: string[]; relationships?: string[]; states?: string[] }>;
  relationships?: Record<string, { relation: string; strength?: number; eventCount?: number }>;
  creativeLearning?: {
    accepted?: string[];
    rejected?: string[];
    preferences?: string[];
    successfulLenses?: string[];
    avoidedPatterns?: string[];
    usedPhrases?: string[];
    noveltyPressure?: number;
  };
  lastLens?: string;
  lastMomentCount?: number;
};

export type UniversalMindContext = {
  memorySummary?: string[];
  memories?: unknown[];
  location?: { label?: string; city?: string; country?: string; latitude?: number; longitude?: number };
  event?: { name?: string; venue?: string; date?: string; description?: string; participants?: string[] };
  entityHints?: string[];
  creativePreferences?: string[];
  feedback?: { accepted?: string[]; rejected?: string[] };
  state?: CognitiveMindRuntimeState;
};
