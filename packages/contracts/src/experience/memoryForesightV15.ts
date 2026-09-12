/**
 * V15 MEMORY FORESIGHT CONTRACT
 *
 * Derived context that helps a living identity know what matters next.
 * This is domain-agnostic: people, couples, pets, homes, businesses,
 * vehicles, products, events, and places share the same primitives.
 */
import type { MemoryVisibility } from "./memoryContext.js";

export type MemoryTemporalPatternV15 = {
  id: string;
  entityIds: string[];
  key: string;
  label: string;
  occurrences: number;
  confidence: number;
  evidenceEventIds: string[];
  lastObservedAt: string;
  visibility: MemoryVisibility;
};

export type MemoryCueV15 = {
  id: string;
  entityIds: string[];
  cue: string;
  kind: "returning" | "preference" | "place" | "time" | "relationship" | "milestone" | "state" | "seasonal";
  confidence: number;
  evidenceEventIds: string[];
  visibility: MemoryVisibility;
};

export type MemoryForesightV15 = {
  temporalPatterns: MemoryTemporalPatternV15[];
  cues: MemoryCueV15[];
};
