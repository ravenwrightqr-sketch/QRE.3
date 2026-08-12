import type { ExperienceEntities } from "./entityExtractor.js";
import type { CognitivePremise } from "./premise.js";
import type { RealityModel } from "./realityModel.js";

/**
 * QRE COGNITIVE CONTRACT
 *
 * Canonical semantic source of truth for cognition and realization planning.
 * The compiler may invent creative material, but invented material must remain
 * distinguishable from prompt/context evidence.
 */

export type CognitiveClaimStatus =
  | "observed"
  | "derived"
  | "hypothesized"
  | "unknown";

export type CognitiveEvidence = {
  source:
    | "prompt"
    | "context"
    | "memory"
    | "event"
    | "location"
    | "history"
    | "creative_realization";
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
  | "orientation" | "hook" | "need" | "threshold" | "origin" | "encounter"
  | "challenge" | "discovery" | "reveal" | "instruction" | "action" | "feedback"
  | "contribution" | "escalation" | "transformation" | "reflection" | "provenance"
  | "identity" | "milestone" | "unlock" | "payoff" | "earned_access" | "next_step"
  | "continuation";

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
  /** JEKYLL: conserved prompt reality. HYDE must not erase it. */
  reality?: RealityModel;
  premise?: CognitivePremise;
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