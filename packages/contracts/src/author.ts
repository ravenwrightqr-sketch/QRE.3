import type { SequencePlay } from "./sequencePlay.js";
import type { CognitiveAuthorContext } from "./cogauthor/cognitiveAuthorContext.js";
import type { MovieBeatPlan } from "./cogauthor/movieBeatPlan.js";
import type { MediaAsset } from "./media.js";
import type { CognitiveExperiencePlan } from "./cogauthor/cognition.js";

export type AuthorRhythm = "hit" | "short" | "standard" | "long";

export type AuthorBrainTruth = {
  prompt: string;
  subject: string;
  place?: string;
  lens?: string;
  cognitivePlan?: CognitiveExperiencePlan;
  cognitiveContext?: CognitiveAuthorContext;
  facts: string[];
  sourceMoments: string[];
  memoryContext?: string[];
  trajectory?: string[];
  creativeLearningContext?: string[];
  returning?: boolean;
  visitNumber?: number;
  presenceSummary?: string[];
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

export type AuthorSceneKind =
  | "line"
  | "hook"
  | "movement"
  | "discovery"
  | "turn"
  | "payoff"
  | "afterglow"
  | "photo";

export type AuthorScene = {
  text: string;
  kind?: AuthorSceneKind;
  media?: MediaAsset;
};

export type AuthorResult = {
  brief: AuthorCreativeBrief;
  scenes: AuthorScene[];
  sequence?: SequencePlay;
  movieBeatPlan?: MovieBeatPlan;
  field: Record<string, unknown>;
  diagnostics: Record<string, unknown>;
};
