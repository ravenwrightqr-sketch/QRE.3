import type {
  CognitiveState,
  MemoryContext,
  MemoryFact,
  MemoryEvent,
  SubjectTruth,
} from "@qre/contracts";
import type { WorldModel } from "./worldModel.js";
import type { UniversalMindContext } from "./universalMindContext.js";

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const tokens = (value: string): Set<string> => new Set(clean(value).toLowerCase().split(/[^a-z0-9'-]+/).filter((token) => token.length > 2));
const overlap = (a: string, b: string): number => {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
};
const unique = <T extends { id: string }>(values: readonly T[]): T[] => {
  const seen = new Set<string>();
  return values.filter((value) => !seen.has(value.id) && seen.add(value.id));
};

function subjectEntityIds(subject: SubjectTruth | undefined, memory: MemoryContext): Set<string> {
  const name = clean(subject?.name).toLowerCase();
  if (!name) return new Set();
  return new Set(
    memory.entities
      .filter((entity) => entity.name.toLowerCase() === name || entity.canonicalKey.toLowerCase() === name)
      .map((entity) => entity.id),
  );
}

function relevantFacts(prompt: string, subjectIds: Set<string>, memory: MemoryContext): MemoryFact[] {
  const stableKinds = new Set(["identity", "attribute", "preference", "behavior", "relationship"]);
  const ranked = memory.facts
    .filter((fact) => fact.status === "active")
    .map((fact) => ({
      fact,
      score:
        (fact.entityId && subjectIds.has(fact.entityId) ? 4 : 0) +
        (stableKinds.has(fact.kind) ? 1.5 : 0) +
        overlap(`${fact.predicate} ${fact.value}`, prompt),
    }))
    .sort((a, b) => b.score - a.score);
  const matched = ranked.filter((item) => item.score > 0).map((item) => item.fact);
  const subjectFacts = ranked.filter((item) => item.fact.entityId && subjectIds.has(item.fact.entityId)).map((item) => item.fact);
  return unique([...subjectFacts, ...matched]).slice(0, 80);
}

function relevantEvents(prompt: string, subjectIds: Set<string>, memory: MemoryContext): MemoryEvent[] {
  const ranked = memory.events
    .map((event, index) => ({
      event,
      index,
      score: event.entityIds.some((id) => subjectIds.has(id)) ? 4 : 0,
    }))
    .map((item) => ({ ...item, score: item.score + overlap(item.event.summary, prompt) }))
    .sort((a, b) => b.score - a.score || b.event.occurredAt.localeCompare(a.event.occurredAt));

  // Relevance is ranked newest-first above, but the cognitive timeline MUST remain chronological.
  return unique(
    ranked
      .filter((item) => item.score > 0)
      .sort((a, b) => a.event.occurredAt.localeCompare(b.event.occurredAt) || a.index - b.index)
      .map((item) => item.event),
  ).slice(0, 48);
}

function patternKind(fact: MemoryFact): CognitiveState["patterns"][number]["kind"] {
  switch (fact.kind) {
    case "preference":
      return "preference";
    case "behavior":
      return "behavior";
    case "relationship":
      return "relationship";
    case "event":
    case "outcome":
      return "state_transition";
    default:
      return "recurrence";
  }
}

function buildPatterns(facts: MemoryFact[]): CognitiveState["patterns"] {
  const groups = new Map<string, MemoryFact[]>();
  for (const fact of facts) {
    const key = `${fact.kind}:${fact.predicate}:${fact.value}`.toLowerCase();
    const group = groups.get(key) ?? [];
    group.push(fact);
    groups.set(key, group);
  }
  let index = 0;
  return [...groups.entries()]
    .filter(([, group]) => group.length >= 2)
    .map(([key, group]) => ({
      id: `pattern-${++index}`,
      kind: patternKind(group[0]!),
      statement: `${group[0]!.predicate}: ${group[0]!.value}`,
      confidence: Math.min(1, Math.max(...group.map((fact) => fact.confidence)) + Math.min(0.2, (group.length - 2) * 0.05)),
      supportingFactIds: group.map((fact) => fact.id),
      supportingEventIds: [],
    }))
    .slice(0, 32);
}

export function buildCognitiveState(input: {
  prompt: string;
  subjectTruth?: SubjectTruth | null;
  memoryContext?: MemoryContext | null;
  world?: WorldModel | null;
  experienceGoal?: string;
  presentation?: "cinematic" | "text" | "media" | "mixed";
}): CognitiveState {
  const memory = input.memoryContext ?? {
    assetId: "unknown",
    generatedAt: new Date().toISOString(),
    entities: [],
    facts: [],
    relations: [],
    events: [],
  };
  const subjectName = clean(input.subjectTruth?.name) || clean(input.world?.participants[0]) || "the subject";
  const subject: SubjectTruth = input.subjectTruth ?? { name: subjectName, kind: "unknown", provenance: "runtime" };
  const subjectIds = subjectEntityIds(subject, memory);
  const facts = relevantFacts(input.prompt, subjectIds, memory);
  const events = relevantEvents(input.prompt, subjectIds, memory);
  const relevantFactIds = facts.map((fact) => fact.id);
  const relevantEventIds = events.map((event) => event.id);
  const currentEvents = events.filter((event) => event.source === "event" || overlap(event.summary, input.prompt) >= 0.5).slice(0, 12);
  const currentFacts = facts.filter((fact) => fact.kind === "event" || fact.kind === "outcome" || fact.kind === "context").slice(0, 16);
  const inferences: CognitiveState["inferences"] = [];
  for (const fact of facts.filter((item) => item.kind === "preference" || item.kind === "behavior" || item.kind === "attribute").slice(0, 32)) {
    inferences.push({
      id: `inference-${fact.id}`,
      kind: fact.kind === "attribute" ? "trait" : fact.kind === "preference" ? "preference" : "behavior",
      statement: `${fact.predicate}: ${fact.value}`,
      confidence: Math.max(0, Math.min(1, fact.confidence * 0.92)),
      sourceFactIds: [fact.id],
    });
  }

  return {
    subject,
    sourceMemory: input.memoryContext ?? undefined,
    facts,
    relations: unique(memory.relations.filter((relation) => subjectIds.size === 0 || subjectIds.has(relation.fromEntityId) || subjectIds.has(relation.toEntityId))),
    events,
    currentFactIds: currentFacts.map((fact) => fact.id),
    currentEventIds: currentEvents.map((event) => event.id),
    relevantFactIds,
    relevantEventIds,
    inferences,
    patterns: buildPatterns(facts),
    experience: {
      request: input.prompt,
      goal: input.experienceGoal ?? "experience",
      presentation: input.presentation ?? "cinematic",
      relevantFactIds,
      relevantEventIds,
    },
    version: 1,
    generatedAt: new Date().toISOString(),
  };
}
