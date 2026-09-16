/** Universal, domain-neutral memory for people, pets, couples, projects, places, and any recurring subject. */

export type MemorySubjectKindV12 =
  | "person"
  | "pet"
  | "relationship"
  | "family"
  | "project"
  | "place"
  | "event_series"
  | "generic";

export type MemoryRelationshipV12 = {
  type: string;
  members: string[];
  confidence: number;
};

export type MemoryEventV12 = {
  id: string;
  sequence: number;
  summary: string;
  facts: string[];
  anchors: string[];
  places: string[];
  times: string[];
  dates: string[];
};

export type UniversalMemoryV12 = {
  version: "v12";
  key: string;
  ownerKey: string;
  subjectKey: string;
  subject: string;
  kind: MemorySubjectKindV12;
  members: string[];
  relationships: MemoryRelationshipV12[];
  events: MemoryEventV12[];
  recurringAnchors: string[];
  recurringPatterns: string[];
  continuitySignals: string[];
};
