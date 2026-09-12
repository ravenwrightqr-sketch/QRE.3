/**
 * Canonical Author contract.
 *
 * The Author works from grounded reality plus authorized memory, learning,
 * presence, and business context. Cognition discovers relationships; Artist
 * selects a proposition and perceptual treatment; Mouth realizes the selected
 * idea as a SequencePlay; Judge validates the result.
 */
import type { RealityGraph } from "../reality/realityGraph.js";
import type { SequenceCandidate } from "../sequence/sequenceCandidate.js";
import type { SequencePlay } from "../sequence/sequencePlay.js";
import type { AuthorMetamorphicRelationSet } from "../cognition/metamorphic.js";
import type { AuthorTreatment } from "./treatment.js";

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
  creatorRole?: string;
  audience?: string[];
  objective?: string;
  desiredAction?: string;
  creativePreferences?: string[];
};

export type AuthorCreativeProposition = {
  text: string;
  pattern: string;
  sourceEventIds: string[];
  candidateId: string;
  relationIds: string[];
  treatment: AuthorTreatment;
};

export type AuthorBrainTruth = {
  prompt: string;
  subject?: string;
  place?: string;
  lens?: string;
  returning?: boolean;
  visitNumber?: number;
  facts: string[];
  sourceMoments: string[];
  memoryContext?: string[];
  trajectory?: string[];
  creativeLearningContext?: string[];
  domainContext?: AuthorDomainContext;
  realityGraph?: RealityGraph;
};

export type AuthorCognitionResult = {
  candidates: SequenceCandidate[];
  relations: AuthorMetamorphicRelationSet;
  readout: string[];
};

export type AuthorJudgeResult = {
  status: "ACCEPT" | "REJECT";
  grounding: number;
  movement: number;
  propositionFidelity: number;
  specificity: number;
  transformation: number;
  inventionRisk: number;
  genericity: number;
  relationFidelity: number;
  treatmentFidelity: number;
  informationPerCut: number;
  continuationPressure: number;
  necessity: number;
  reasons: string[];
};

export type CanonicalAuthorResult = {
  readout: { subject?: string; lines: string[]; text: string; eventIds: string[] };
  reality: RealityGraph;
  metamorphic: AuthorMetamorphicRelationSet;
  cognition: AuthorCognitionResult;
  proposition: AuthorCreativeProposition;
  sequence: SequencePlay;
  judgment: AuthorJudgeResult;
  selectedCandidateId: string;
};

export type AuthorScene = {
  text: string;
  kind?: "line" | "hook" | "movement" | "discovery" | "turn" | "payoff" | "afterglow";
};
