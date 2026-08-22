import type {
  CognitiveAnalyticsSignal,
  CognitiveClaim,
  CognitiveEntityState,
  CognitiveCreativeLearning,
  CognitiveRelationshipState,
} from "./cognition.js";

export type IdentityKind =
  | "pet"
  | "person"
  | "relationship"
  | "family"
  | "business"
  | "property"
  | "event"
  | "service"
  | "project"
  | "goal"
  | "memory"
  | "generic";

export type IdentityContext =
  | "home"
  | "daycare"
  | "vet"
  | "groomer"
  | "walker"
  | "vacation"
  | "service"
  | "event"
  | "work"
  | "travel"
  | "social"
  | "personal"
  | "public"
  | "unknown";

export type IdentityFact = {
  text: string;
  source: "prompt" | "memory" | "event" | "location" | "presence" | "history";
  confidence: number;
  observedAt?: string;
  entity?: string;
  status?: "active" | "superseded" | "derived";
};

export type IdentityIntent = {
  text: string;
  status: "active" | "completed" | "paused" | "unknown";
  evidence: string[];
  progress?: number;
};

export type IdentityLocation = {
  label?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  role?: string;
  source?: string;
  observedAt?: string;
};

export type IdentityState = {
  identityId: string;
  kind: IdentityKind;
  subject: CognitiveClaim<string>;
  canonicalFacts: IdentityFact[];
  currentState: string[];
  traits: IdentityFact[];
  preferences: IdentityFact[];
  activities: IdentityFact[];
  relationships: CognitiveRelationshipState[];
  history: IdentityFact[];
  recentEvents: string[];
  recurringPatterns: string[];
  goals: IdentityIntent[];
  intentions: IdentityIntent[];
  unresolvedQuestions: string[];
  locations: IdentityLocation[];
  activeContext: IdentityContext;
  behavioralLearning: CognitiveAnalyticsSignal;
  creativeLearning: CognitiveCreativeLearning;
  entityStates: CognitiveEntityState[];
  sourceMemoryCount: number;
  sourceEventCount: number;
  confidence: number;
  generatedAt: string;
};
