/**
 * V13 UNIVERSAL MEMORY WORLD CONTRACT
 *
 * Extends the durable memory substrate with first-class world context.
 * The contract is domain-agnostic: people, couples, pets, homes, products,
 * vehicles, businesses, events, and places all use the same shape.
 */

import type {
  MemoryEntityKind,
  MemoryVisibility,
} from "./memoryContext.js";

export type MemoryWorldSubjectKindV13 = MemoryEntityKind;

export type MemoryLocationV13 = {
  id: string;
  name: string;
  canonicalKey: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  confidence: number;
  visibility: MemoryVisibility;
  observedAt: string;
  metadata?: Record<string, unknown>;
};

export type MemoryTimeContextV13 = {
  observedAt: string;
  date?: string;
  time?: string;
  dayOfWeek?: string;
  season?: string;
  recurrenceKey?: string;
  sequence?: number;
};

export type MemoryPatternV13 = {
  id: string;
  subjectEntityIds: string[];
  pattern: string;
  evidenceEventIds: string[];
  occurrences: number;
  confidence: number;
  firstObservedAt: string;
  lastObservedAt: string;
  visibility: MemoryVisibility;
  metadata?: Record<string, unknown>;
};

export type MemoryPreferenceV13 = {
  id: string;
  entityId: string;
  preference: string;
  polarity: "likes" | "dislikes" | "prefers" | "avoids" | "unknown";
  confidence: number;
  evidenceEventIds: string[];
  firstObservedAt: string;
  lastObservedAt: string;
  visibility: MemoryVisibility;
  metadata?: Record<string, unknown>;
};

export type MemoryMilestoneV13 = {
  id: string;
  entityIds: string[];
  type: "first" | "return" | "milestone" | "anniversary" | "change" | "last" | "custom";
  title: string;
  eventId: string;
  occurredAt: string;
  confidence: number;
  visibility: MemoryVisibility;
  metadata?: Record<string, unknown>;
};

export type MemoryWorldV13 = {
  subjectKind: MemoryWorldSubjectKindV13;
  locations: MemoryLocationV13[];
  timeContexts: MemoryTimeContextV13[];
  patterns: MemoryPatternV13[];
  preferences: MemoryPreferenceV13[];
  milestones: MemoryMilestoneV13[];
};
