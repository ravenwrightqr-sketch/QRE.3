import type { ExperienceEntities } from "./entityExtractor.js";

/**
 * ============================================================
 * QRE COGNITIVE CONTRACT — ARCHITECTURE LOCK
 * ============================================================
 *
 * PURPOSE:
 *   Canonical semantic contract for the cognitive compiler.
 *
 * CANONICAL PIPELINE:
 *   PROMPT → COGNITION → MEANING → HYPOTHESES → OPPORTUNITY SPACE
 *   → EXPERIENCE DIRECTION → COGNITIVE PLAN → UNIVERSAL COMPILATION
 *   → BLUEPRINT → FLOW → MOMENTS → CINEMATIC SCENES
 *
 * ARCHITECTURE RULE:
 *   THE COMPILER BECOMES SMARTER.
 *   IT DOES NOT INVENT ANOTHER ARCHITECTURE.
 *
 * CONTRACT RULE:
 *   This file is the shared semantic source of truth. Engine-local
 *   duplicates of these shapes are not permitted.
 *
 * COGNITIVE RULE:
 *   Claims distinguish observed input from derived or hypothesized meaning.
 *   Plans describe possibilities; they do not manufacture facts.
 *
 * ============================================================
 */

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

/**
 * The selected experience direction is deliberately semantic rather than
 * domain-specific. The universal compiler consumes it as guidance; it does
 * not become a second compiler or a template registry.
 */
export type CognitiveExperiencePlan = {
  direction: ExperienceHypothesisKind;
  centralSubject: string;
  audience: string[];
  whyInteract: string[];
  emotionalIntent: string[];
  purpose: string;
  interactionModel: string[];
  storyStructure: string[];
  memoryModel: string[];
  geographicModel: string[];
  socialModel: string[];
  discoveryModel: string[];
  rewardModel: string[];
  commerceModel: string[];
  progressionModel: string[];
  contentModel: string[];
  dynamicBehavior: string[];
  futureEvolution: string[];
  creativePossibilities: string[];
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
  plan: CognitiveExperiencePlan;
  assumptions: CognitiveAssumption[];
};
