import type { ExperienceEntities } from "./entityExtractor.js";
import type { CognitivePremise } from "./premise.js";

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
 *   → EXPERIENCE DIRECTION → COGNITIVE PLAN → SEMANTIC REALIZATION
 *   → UNIVERSAL COMPILATION → BLUEPRINT → FLOW → MOMENTS
 *   → CINEMATIC SCENES
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
 * CONSERVATION RULE:
 *   The selected plan carries a role-based premise so realization can
 *   preserve relationships among facts instead of relying on noun lists.
 *
 * REALIZATION RULE:
 *   Semantic realization describes what each experiential operation is
 *   supposed to accomplish. It does not contain presentation copy.
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

export type CognitiveBeatKind =
  | "orientation"
  | "hook"
  | "need"
  | "threshold"
  | "origin"
  | "encounter"
  | "challenge"
  | "discovery"
  | "reveal"
  | "instruction"
  | "action"
  | "feedback"
  | "contribution"
  | "escalation"
  | "transformation"
  | "reflection"
  | "provenance"
  | "identity"
  | "milestone"
  | "unlock"
  | "payoff"
  | "earned_access"
  | "next_step"
  | "continuation";

/**
 * Semantic instruction for one experiential operation.
 *
 * This is deliberately not presentation copy. It records the cognitive
 * function of a beat so any later language/media renderer can realize it
 * without reconstructing the meaning from nouns or templates.
 */
export type CognitiveBeatDirective = {
  kind: CognitiveBeatKind;
  intent: string;
  subject: string;
  action: string;
  stateBefore: string;
  stateAfter: string;
  relationalFocus: string[];
  evidence: CognitiveEvidence[];
  confidence: number;
};

export type CognitiveExperienceRealization = {
  direction: ExperienceHypothesisKind;
  directives: CognitiveBeatDirective[];
  semanticArc: string[];
  conservedRoles: string[];
  confidence: number;
};

/**
 * Cognitive direction selected before universal compilation.
 *
 * `direction` is optional only so existing cognitive-state construction can
 * remain source-compatible during this migration. Canonical compiler output
 * always fills it from selectedHypothesis.kind before universal compilation.
 */
export type CognitiveExperiencePlan = {
  direction?: ExperienceHypothesisKind;
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

  /**
   * Conserved semantic premise. Optional during migration so historical
   * callers remain source-compatible while new cognitive paths populate it.
   */
  premise?: CognitivePremise;

  /**
   * Semantic beat realization. Optional for compatibility with historical
   * plan producers; canonical cognitive compilation populates it.
   */
  realization?: CognitiveExperienceRealization;
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
