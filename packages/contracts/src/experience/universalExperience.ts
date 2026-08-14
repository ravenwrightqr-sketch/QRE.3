/**
 * UNIVERSAL EXPERIENCE CONTRACT
 *
 * This contract intentionally contains no business-specific vocabulary.
 * Prompts become observable evidence, events, relationships, change, and
 * consequence. Presentation can then choose a human sentence without
 * inventing unsupported facts.
 */
export type UniversalEvidenceKind =
  | "subject"
  | "action"
  | "object"
  | "state"
  | "place"
  | "date"
  | "time"
  | "participant"
  | "detail";

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
  place?: string;
  date?: string;
  time?: string;
  evidenceIds: string[];
  importance: number;
};

export type UniversalRelation = {
  fromEventId: string;
  toEventId: string;
  kind:
    | "sequence"
    | "state_change"
    | "consequence"
    | "contrast"
    | "escalation"
    | "resolution";
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
  prompt?: string;
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
