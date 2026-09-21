import type { CognitiveExperiencePlan } from "../cognition/cognition.js";
import type { RealityGraph } from "../reality/realityGraph.js";
import type { SubjectTruth } from "../reality/subjectTruth.js";
import type { AuthorExperienceState } from "./authorExperienceState.js";
export type AuthorRhythm = "hit" | "short" | "standard" | "long";
export type AuthorPlayoutMode = "operational" | "experience";

export type AuthorWorldScope = {
  /** Stable semantic world identifier. Ownership/account identity is not enough to merge worlds. */
  worldId: string;
  /** Optional descriptive world kind for routing/presentation only. */
  kind?: string;
  /**
   * Explicitly related worlds whose memory may be consulted for this authoring request.
   * Cross-world access must be deliberate; shared account ownership never implies access.
   */
  relatedWorldIds?: string[];
};

export type AuthorScopedMemory = {
  worldId: string;
  text: string;
};

export type DogTagContext = {
  /** Persistent profile context. These are stable truths/background, never occurrence evidence by themselves. */
  name?: string;
  breed?: string;
  age?: string;
  nicknames?: string[];
  personalityTraits?: string[];
  likes?: string[];
  dislikes?: string[];
  favoriteFoods?: string[];
  favoriteActivities?: string[];
  socialPreferences?: string[];
  quirks?: string[];
  fears?: string[];
  comfortThings?: string[];
  importantPeople?: string[];
  importantAnimals?: string[];
  favoritePlaces?: string[];
  voiceHints?: string[];
  /** Optional perspective ideas. Hints influence framing only; they never create facts. */
  frameHints?: string[];
  /** Derived or owner-supplied stable patterns. Context only; never a physical occurrence. */
  contextualPatterns?: string[];
};

export type AuthorDomainContext = {
  category?: string;
  businessType?: string;
  businessName?: string;
  businessDescription?: string;
  serviceType?: string;
  serviceName?: string;
  subjectKind?: string;
  /** Canonical business onboarding context. Context only; never occurrence evidence. */
  services?: string[];
  differentiators?: string[];
  signals?: string[];
  subjectKinds?: string[];
  importantFacts?: string[];
  /** Legacy/derived aliases retained for current callers. */
  knownCapabilities?: string[];
  contextualSignals?: string[];
  /** Optional persistent Dog Tag profile. Uses the same universal Author; this is context, not a separate domain brain. */
  dogTag?: DogTagContext;
};

export type AuthorCreativeBrief = {
  angle: string;
  engine: string;
  question: string;
  strongestImage: string;
  tension: string;
  payoff: string;
  callback: string;
  rhythm: AuthorRhythm[];
  avoid: string[];
};

export type AuthorBrainTruth = {
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  subjectTruth?: SubjectTruth;
  cognitivePlan?: CognitiveExperiencePlan;
  realityGraph?: RealityGraph;
  domainContext?: AuthorDomainContext;
  /**
   * User-facing output intent.
   * operational = factual moving receipt/readout from supplied reality.
   * experience = semantic discovery + lens treatment + Mouth realization.
   */
  playoutMode?: AuthorPlayoutMode;
  /**
   * @deprecated Compatibility only. Prefer playoutMode.
   * true maps to experience; false maps to operational.
   */
  movieMode?: boolean;
  returning?: boolean;
  visitNumber?: number;
  presenceSummary?: string[];
  facts: string[];
  sourceMoments: string[];
  /**
   * Legacy unscoped memory. Used only when worldScope is absent.
   * Once a request declares worldScope, unscoped memory is intentionally ignored.
   */
  memoryContext?: string[];
  /** World-scoped memory available to the active authoring request. */
  scopedMemoryContext?: AuthorScopedMemory[];
  /** Active semantic world. Same-account ownership does not authorize cross-world memory. */
  worldScope?: AuthorWorldScope;
  trajectory?: string[];
  priorExperienceStates?: AuthorExperienceState[];
  creativeLearningContext?: string[];
};

export type AuthorScene = {
  text: string;
  kind?: "line" | "hook" | "movement" | "discovery" | "turn" | "payoff" | "afterglow";
};

export type AuthorRenderedScene = AuthorScene & {
  durationHintMs?: number;
  transitionHint?: "none" | "fade" | "slide" | "zoom" | "cinematic" | "flash";
  audioMood?: string;
  visualHint?: string;
};
