import type { CognitiveExperiencePlan } from "../cogauthor/cognition.js";
import type { CognitiveAuthorContext } from "../cogauthor/cognitiveAuthorContext.js";

export type AuthorRhythm = "hit" | "short" | "standard" | "long";

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
  cognitivePlan?: CognitiveExperiencePlan;
  cognitiveContext?: CognitiveAuthorContext;
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
  kind?: "line" | "hook" | "movement" | "discovery" | "turn" | "payoff" | "afterglow" | "photo";
  media?: import("../media.js").MediaAsset;
};

export type AuthorRenderedScene = AuthorScene & {
  durationHintMs?: number;
  transitionHint?: "none" | "fade" | "slide" | "zoom" | "cinematic" | "flash";
  audioMood?: string;
  visualHint?: string;
};
