import type { ExperienceEntities } from "./entityExtractor.js";
import type { CognitivePremise } from "./premise.js";

/**
 * QRE COGNITIVE CONTRACT
 * Canonical semantic source of truth for cognition and realization planning.
 */
export type CognitiveClaimStatus = "observed" | "derived" | "hypothesized" | "unknown";
export type CognitiveEvidence = {
  source: "prompt" | "context" | "memory" | "event" | "location" | "history" | "creative_realization";
  detail: string;
  confidence: number;
};
export type CognitiveClaim<T> = { value: T; status: CognitiveClaimStatus; confidence: number; evidence: CognitiveEvidence[] };
export type CognitiveAssumption = { statement: string; reason: string; confidence: number };
export type ExperienceHypothesisKind = "story" | "memory" | "discovery" | "identity" | "game" | "utility" | "social" | "ritual" | "commerce" | "journey";
export type ExperienceHypothesis = {
  id: string;
  kind: ExperienceHypothesisKind;
  premise: string;
  rationale: string;
  evidence: CognitiveEvidence[];
  dimensions: { subjectFit: number; emotionalResonance: number; interactionNaturalness: number; memoryPotential: number; discoveryPotential: number; socialPotential: number; temporalPotential: number; commercialPotential: number; novelty: number; feasibility: number };
  score: number;
};
export type CognitiveBeatKind = "orientation" | "hook" | "need" | "threshold" | "origin" | "encounter" | "challenge" | "discovery" | "reveal" | "instruction" | "action" | "feedback" | "contribution" | "escalation" | "transformation" | "reflection" | "provenance" | "identity" | "milestone" | "unlock" | "payoff" | "earned_access" | "next_step" | "continuation";
export type CognitiveBeatDirective = { kind: CognitiveBeatKind; intent: string; subject: string; action: string; stateBefore: string; stateAfter: string; relationalFocus: string[]; evidence: CognitiveEvidence[]; confidence: number };
export type CognitiveExperienceRealization = { direction: ExperienceHypothesisKind; directives: CognitiveBeatDirective[]; semanticArc: string[]; conservedRoles: string[]; confidence: number };
export type CognitiveExperiencePlan = {
  direction?: ExperienceHypothesisKind; centralSubject: string; audience: string[]; whyInteract: string[]; emotionalIntent: string[]; purpose: string;
  interactionModel: string[]; storyStructure: string[]; memoryModel: string[]; geographicModel: string[]; socialModel: string[]; discoveryModel: string[];
  rewardModel: string[]; commerceModel: string[]; progressionModel: string[]; contentModel: string[]; dynamicBehavior: string[]; futureEvolution: string[];
  creativePossibilities: string[]; premise?: CognitivePremise; realization?: CognitiveExperienceRealization;
};
export type CognitiveCreativeLearning = { accepted: string[]; rejected: string[]; preferences: string[]; successfulLenses: string[]; avoidedPatterns: string[]; usedPhrases: string[]; noveltyPressure: number };
export type CognitiveAnalyticsSignal = {
  scans: number;
  completions: number;
  abandons: number;
  replays: number;
  ctaClicks: number;
  errors: number;
  engagement: number;
  friction: number;
  accepted: string[];
  rejected: string[];
  preferences: string[];
};
export type CognitiveEntityState = { entity: string; appearances: number; lastEventId?: string; places: string[]; relationships: string[]; states: string[] };
export type CognitiveRelationshipState = { from: string; to: string; relation: string; strength: number; eventCount: number };
export type CognitiveMindState = {
  compileCount: number;
  entityStates: CognitiveEntityState[];
  relationships: CognitiveRelationshipState[];
  eventHistory: string[];
  creativeLearning: CognitiveCreativeLearning;
  lastLens?: string;
  lastMomentCount?: number;
};
export type CognitiveExperienceState = {
  prompt: string; subject: CognitiveClaim<string>; participants: CognitiveClaim<string[]>; motivations: CognitiveClaim<string[]>; entities: ExperienceEntities;
  affordances: string[]; emotionalIntent: string[]; memoryOpportunities: string[]; geographicOpportunities: string[]; socialOpportunities: string[];
  discoveryOpportunities: string[]; temporalOpportunities: string[]; commercialOpportunities: string[]; hypotheses: ExperienceHypothesis[];
  selectedHypothesis: ExperienceHypothesis; plan: CognitiveExperiencePlan; assumptions: CognitiveAssumption[];
};
