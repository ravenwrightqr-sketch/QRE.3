/**
 * =====================================================
 * QRE REALITY MODEL CONTRACT
 * =====================================================
 *
 * JEKYLL: the conserved world described or evidenced by
 * the prompt/context. Creative realization may transform
 * presentation, but it must not erase observed reality.
 *
 * Domain-agnostic by design: a prompt can describe a dog,
 * a wedding, a repair, a rave, a memory, a product, a place,
 * or something QRE has never seen before.
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 * =====================================================
 */

import type { CognitiveClaimStatus, CognitiveEvidence } from "./cognition.js";

export type RealityAtomKind =
  | "subject"
  | "participant"
  | "place"
  | "object"
  | "event"
  | "action"
  | "state"
  | "outcome"
  | "emotion"
  | "instruction"
  | "temporal"
  | "audience"
  | "constraint"
  | "unknown";

export type RealityAtom = {
  id: string;
  kind: RealityAtomKind;
  value: string;
  normalized: string;
  status: CognitiveClaimStatus;
  confidence: number;
  salience: number;
  sourceText: string;
  evidence: CognitiveEvidence[];
};

export type RealityRelation = {
  from: string;
  to: string;
  relation:
    | "acts_on"
    | "participates_in"
    | "occurs_at"
    | "occurs_before"
    | "occurs_after"
    | "causes"
    | "changes_to"
    | "results_in"
    | "belongs_to"
    | "describes"
    | "targets"
    | "supports"
    | "unknown";
  confidence: number;
  evidence: CognitiveEvidence[];
};

export type RealityBeat = {
  id: string;
  order: number;
  sourceText: string;
  atomIds: string[];
  required: boolean;
  confidence: number;
  evidence: CognitiveEvidence[];
};

export type RealityModel = {
  version: 1;
  prompt: string;
  atoms: RealityAtom[];
  relations: RealityRelation[];
  sequence: RealityBeat[];
  observedText: string[];
  unresolved: string[];
  conservedAtomIds: string[];
  invariants: {
    preserveObservedEvidence: boolean;
    preserveSequenceWhenExplicit: boolean;
    distinguishCreativeMaterial: boolean;
    neverInventObservedFact: boolean;
  };
};
