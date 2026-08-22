export type RealityFactType =
  | "identity"
  | "event"
  | "state"
  | "trait"
  | "preference"
  | "activity"
  | "social_preference"
  | "relationship"
  | "place"
  | "object"
  | "outcome"
  | "recurrence"
  | "goal"
  | "intention"
  | "unknown";

export type InferencePermission =
  | "reorder"
  | "compress"
  | "reframe"
  | "callback"
  | "derive_state"
  | "derive_relationship"
  | "derive_recurrence"
  | "derive_significance";

export type InferenceForbidden =
  | "invent_person"
  | "invent_relationship"
  | "invent_place"
  | "invent_object"
  | "invent_body_detail"
  | "invent_dialogue"
  | "invent_literal_event"
  | "invent_chronology"
  | "invent_business_fact"
  | "invent_private_fact";

export type RealityProvenance = {
  factType: RealityFactType;
  source: "prompt" | "memory" | "event" | "location" | "presence" | "history";
  observedAt?: string;
  entity?: string;
  confidence: number;
  permissions: InferencePermission[];
  forbiddenExpansions: InferenceForbidden[];
};
