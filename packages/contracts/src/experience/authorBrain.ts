import type { SubjectTruth } from "./subjectTruth.js";

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
  subject?: string;
  subjectTruth?: SubjectTruth;
  facts: string[];
  sourceMoments: string[];
  memoryContext: string[];
  trajectory: string[];
  creativeLearningContext: string[];
};

export type AuthorScene = {
  text: string;
  kind?: "line" | "hook" | "movement" | "discovery" | "turn" | "payoff" | "afterglow";
};
