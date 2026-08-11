/**
 * Conserved semantic premise carried from understanding to realization.
 *
 * This is deliberately role-based rather than domain/template based. A prompt
 * may contain any noun; the compiler preserves the role and the exact observed
 * value instead of turning the noun into a hard-coded compiler mode.
 */

import type { CognitiveClaim, CognitiveEvidence } from "./cognition.js";

export type CognitivePremiseRole =
  | "subject"
  | "event"
  | "medium"
  | "artifact"
  | "participants"
  | "outcome"
  | "emotion"
  | "affordance"
  | "temporal"
  | "place"
  | "social"
  | "transformation"
  | "constraint"
  | "detail";

export type CognitivePremiseSlot = {
  role: CognitivePremiseRole;
  values: string[];
  status: CognitiveClaim<string[]>["status"];
  confidence: number;
  salience: number;
  evidence: CognitiveEvidence[];
};

export type CognitivePremiseRelation = {
  from: CognitivePremiseRole;
  to: CognitivePremiseRole;
  relation: string;
  confidence: number;
  evidence: CognitiveEvidence[];
};

export type CognitivePremise = {
  slots: CognitivePremiseSlot[];
  relations: CognitivePremiseRelation[];
};
