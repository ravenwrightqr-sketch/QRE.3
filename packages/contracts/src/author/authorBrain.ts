/**
 * QRE Author contract.
 * The Author transforms supplied reality into a grounded SequencePlay.
 */
import type { RealityGraph } from "../reality/realityGraph.js";
import type { SequenceCandidate } from "../sequence/sequenceCandidate.js";
import type { SequencePlay } from "../sequence/sequencePlay.js";
import type { AuthorMetamorphicRelationSet } from "../cognition/metamorphic.js";

export type AuthorRhythm = "hit" | "short" | "standard" | "long";

export type AuthorCreativeProposition = {
  text: string;
  pattern: string;
  sourceEventIds: string[];
};

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
};

export type AuthorScene = { text: string; kind?: "line" | "hook" | "movement" | "discovery" | "turn" | "payoff" | "afterglow" };
