/**
 * Universal prompt reasoning contract.
 *
 * No business/domain vocabulary belongs here. Every prompt is reduced to the
 * same observable primitives before realization: subject, events, change,
 * relationships, consequence, and payoff.
 */
export type UniversalEvidenceKind = "subject" | "action" | "object" | "state" | "place" | "time" | "participant" | "detail";

export type UniversalEvidence = {
  id: string;
  kind: UniversalEvidenceKind;
  text: string;
  sourceText: string;
  order: number;
  confidence: number;
};

export type UniversalEvent = {
  id: string;
  order: number;
  sourceText: string;
  actor: string;
  action?: string;
  object?: string;
  states: string[];
  details: string[];
  evidenceIds: string[];
  importance: number;
};

export type UniversalRelation = {
  fromEventId: string;
  toEventId: string;
  kind: "sequence" | "state_change" | "consequence" | "contrast" | "escalation" | "resolution";
  strength: number;
  reason: string;
};

export type UniversalChange = {
  before?: string;
  after?: string;
  triggerEventId?: string;
  confidence: number;
};

export type UniversalConsequence = {
  eventId: string;
  reason: string;
  strength: number;
};

export type UniversalExperienceModel = {
  subject: string;
  evidence: UniversalEvidence[];
  events: UniversalEvent[];
  relations: UniversalRelation[];
  change: UniversalChange;
  strongestConsequence?: UniversalConsequence;
  strongestDetails: string[];
};

export type UniversalExperienceResult = {
  version: "universal-v1";
  prompt: string;
  model: UniversalExperienceModel;
  lines: string[];
};
