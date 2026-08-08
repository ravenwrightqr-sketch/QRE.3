import type { ExperienceEntities } from "./entityExtractor.js";

export type CognitiveClaimStatus = "observed" | "derived" | "hypothesized" | "unknown";

export type CognitiveEvidence = {
  source: "prompt" | "context" | "memory" | "event" | "location" | "history";
  detail: string;
  confidence: number;
};

export type CognitiveClaim<T> = {
  value: T;
  status: CognitiveClaimStatus;
  confidence: number;
  evidence: CognitiveEvidence[];
};

export type CognitiveAssumption = {
  statement: string;
  reason: string;
  confidence: number;
};

export type ExperienceHypothesisKind =
  | "story"
  | "memory"
  | "discovery"
  | "identity"
  | "game"
  | "utility"
  | "social"
  | "ritual"
  | "commerce"
  | "journey";

export type ExperienceHypothesis = {
  id: string;
  kind: ExperienceHypothesisKind;
  premise: string;
  rationale: string;
  evidence: CognitiveEvidence[];
  dimensions: {
    subjectFit: number;
    emotionalResonance: number;
    interactionNaturalness: number;
    memoryPotential: number;
    discoveryPotential: number;
    socialPotential: number;
    temporalPotential: number;
    commercialPotential: number;
    novelty: number;
    feasibility: number;
  };
  score: number;
};

export type CognitiveExperienceState = {
  prompt: string;
  subject: CognitiveClaim<string>;
  participants: CognitiveClaim<string[]>;
  motivations: CognitiveClaim<string[]>;
  entities: ExperienceEntities;
  affordances: string[];
  emotionalIntent: string[];
  memoryOpportunities: string[];
  geographicOpportunities: string[];
  socialOpportunities: string[];
  discoveryOpportunities: string[];
  temporalOpportunities: string[];
  commercialOpportunities: string[];
  hypotheses: ExperienceHypothesis[];
  selectedHypothesis: ExperienceHypothesis;
  assumptions: CognitiveAssumption[];
};
