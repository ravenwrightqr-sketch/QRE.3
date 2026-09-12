/**
 * V14 UNIVERSAL MEMORY INTELLIGENCE CONTRACT
 *
 * Domain-agnostic learned context for people, couples, pets, homes,
 * businesses, objects, vehicles, products, events, and places.
 */

import type { MemoryVisibility } from "./memoryContext.js";

export type MemorySignalKindV14 =
  | "preference"
  | "avoidance"
  | "routine"
  | "recurrence"
  | "association"
  | "state"
  | "seasonality"
  | "local_interest"
  | "relationship_pattern"
  | "milestone_pattern";

export type MemoryPreferenceV14 = {
  id: string;
  entityId: string;
  value: string;
  polarity: "likes" | "dislikes" | "prefers" | "avoids" | "unknown";
  confidence: number;
  evidenceEventIds: string[];
  firstObservedAt: string;
  lastObservedAt: string;
  visibility: MemoryVisibility;
};

export type MemoryRecurrenceV14 = {
  id: string;
  entityIds: string[];
  key: string;
  label: string;
  occurrences: number;
  intervalDays?: number;
  confidence: number;
  evidenceEventIds: string[];
  lastObservedAt: string;
  visibility: MemoryVisibility;
};

export type MemoryAssociationV14 = {
  id: string;
  entityIds: string[];
  left: string;
  right: string;
  occurrences: number;
  confidence: number;
  evidenceEventIds: string[];
  visibility: MemoryVisibility;
};

export type MemoryStateV14 = {
  id: string;
  entityId: string;
  state: string;
  confidence: number;
  evidenceEventIds: string[];
  observedAt: string;
  visibility: MemoryVisibility;
};

export type MemoryLocalInterestV14 = {
  id: string;
  locationId?: string;
  subjectEntityIds: string[];
  interest: string;
  evidenceEventIds: string[];
  occurrences: number;
  confidence: number;
  visibility: MemoryVisibility;
};

export type MemoryIntelligenceV14 = {
  preferences: MemoryPreferenceV14[];
  recurrences: MemoryRecurrenceV14[];
  associations: MemoryAssociationV14[];
  states: MemoryStateV14[];
  localInterests: MemoryLocalInterestV14[];
};
