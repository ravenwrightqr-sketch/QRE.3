import type { MemoryContext, MemoryFact, MemoryRelation, MemoryEvent } from "./memoryContext.js";
import type { SubjectTruth } from "./subjectTruth.js";

export type CognitiveInference = {
  id: string;
  kind: "trait" | "preference" | "aversion" | "behavior" | "relationship" | "pattern" | "current_state" | "experience_opportunity";
  statement: string;
  confidence: number;
  sourceFactIds: string[];
};

export type CognitivePattern = {
  id: string;
  kind: "recurrence" | "preference" | "behavior" | "relationship" | "state_transition";
  statement: string;
  confidence: number;
  supportingFactIds: string[];
  supportingEventIds: string[];
};

export type CognitiveExperienceSelection = {
  request: string;
  goal: string;
  presentation: "cinematic" | "text" | "media" | "mixed";
  relevantFactIds: string[];
  relevantEventIds: string[];
};

/**
 * Canonical semantic snapshot passed between cognition layers.
 * Raw prose may be retained as source evidence, but meaning is represented
 * by typed facts, relations, events, inferences, patterns, and provenance.
 */
export type CognitiveState = {
  subject: SubjectTruth;
  sourceMemory?: MemoryContext;
  facts: MemoryFact[];
  relations: MemoryRelation[];
  events: MemoryEvent[];
  currentFactIds: string[];
  currentEventIds: string[];
  relevantFactIds: string[];
  relevantEventIds: string[];
  inferences: CognitiveInference[];
  patterns: CognitivePattern[];
  experience: CognitiveExperienceSelection;
  version: number;
  generatedAt: string;
};
