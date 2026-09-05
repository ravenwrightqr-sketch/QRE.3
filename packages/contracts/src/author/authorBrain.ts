import type { CognitiveExperiencePlan } from "../cognition/cognition.js";
import type { RealityGraph } from "../reality/realityGraph.js";
import type { SubjectTruth } from "../reality/subjectTruth.js";

export type AuthorRhythm = "hit" | "short" | "standard" | "long";

export type AuthorDomainContext = {
  category?: string;
  businessType?: string;
  businessName?: string;
  businessDescription?: string;
  serviceType?: string;
  serviceName?: string;
  subjectKind?: string;
  knownCapabilities?: string[];
  contextualSignals?: string[];
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
  movieMode?: boolean;
  returning?: boolean;
  visitNumber?: number;
  presenceSummary?: string[];
  facts: string[];
  sourceMoments: string[];
  memoryContext?: string[];
  trajectory?: string[];
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
