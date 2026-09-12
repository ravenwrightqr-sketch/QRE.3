import type {
  AuthorBrainTruth,
  RealityEntityContinuity,
  RealityEvent,
  RealityEventStructure,
  RealityEvidence,
  RealityGraph,
  RealityPattern,
  RealityRelation,
} from "@qre/contracts";

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const lower = (value: string): string => value.toLowerCase();
const uniqueStrings = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const ACTION_PATTERNS = [
  /\b(?:loves?|likes?|hates?|needs?|wants?|prefers?|uses?|owns?|keeps?|visits?|chooses?|gets?|takes?|makes?|does?|works?|moves?|returns?|buys?|tries?|checks?|tests?|replaces?|repairs?|cleans?|delivers?)\b[^.?!]*/ig,
];

const TEMPORAL_MARKERS = [
  "before", "after", "then", "later", "again", "first", "next", "finally", "previously", "now", "today", "yesterday",
];

const STATE_MARKERS = [
  "became", "changed", "started", "stopped", "opened", "closed", "full", "empty", "broken", "fixed", "missing", "present", "new", "old", "active", "inactive",
];

const CONTRAST_MARKERS = [
  "but", "however", "instead", "unlike", "except", "although", "yet", "not ", "rather than",
];

const CAUSAL_MARKERS = [
  "because", "therefore", "so that", "so ", "leads to", "causes", "caused", "resulted", "which means",
];

function inferEntities(value: string, subject?: string): string[] {
  const candidates: string[] = [];
  if (subject) candidates.push(subject);

  for (const match of value.matchAll(/\b[A-Z][a-zA-Z0-9_-]{2,}\b/g)) {
    const token = match[0];
    if (!/^(The|This|That|Then|When|Before|After|Nothing|Everything|Today|Yesterday|First|Next|Finally)$/.test(token)) {
      candidates.push(token);
    }
  }

  const relation = value.match(/\b(?:loves?|likes?|hates?|needs?|wants?|prefers?|uses?|owns?|keeps?|chooses?|gets?|takes?|buys?|tries?)\s+(.+?)(?:[.!?]|$)/i);
  if (relation?.[1]) {
    const object = clean(relation[1]).replace(/^(the|a|an)\s+/i, "");
    if (object && object.length < 80) candidates.push(object);
  }

  return uniqueStrings(candidates).slice(0, 8);
}

function inferActions(value: string): string[] {
  const actions: string[] = [];
  for (const pattern of ACTION_PATTERNS) {
    for (const match of value.matchAll(pattern)) {
      const action = clean(match[0]);
      if (action) actions.push(action);
    }
  }
  return uniqueStrings(actions).slice(0, 6);
}

function inferStates(value: string): string[] {
  const result: string[] = [];
  const normalized = lower(value);
  for (const marker of STATE_MARKERS) {
    if (normalized.includes(marker)) result.push(marker.trim());
  }
  return result;
}

function inferTemporalMarkers(value: string): string[] {
  const normalized = lower(value);
  return TEMPORAL_MARKERS.filter((marker) => normalized.includes(marker));
}

function inferSemanticTags(value: string): string[] {
  const normalized = lower(value);
  const tags: string[] = [];
  if (CONTRAST_MARKERS.some((marker) => normalized.includes(marker))) tags.push("contrast");
  if (CAUSAL_MARKERS.some((marker) => normalized.includes(marker))) tags.push("cause_consequence");
  if (inferStates(value).length) tags.push("state_change");
  if (normalized.includes("again") || normalized.includes("repeat")) tags.push("recurrence");
  if (normalized.includes("only") || normalized.includes("always") || normalized.includes("never")) tags.push("rule");
  if (normalized.includes("more") || normalized.includes("less") || normalized.includes("most") || normalized.includes("least")) tags.push("comparison");
  return uniqueStrings(tags);
}

function makeEvidence(input: AuthorBrainTruth): RealityEvidence[] {
  const entries: Array<{ text: string; kind: RealityEvidence["kind"]; index: number }> = [];
  input.facts.forEach((text, index) => entries.push({ text, kind: "fact", index }));
  input.sourceMoments.forEach((text, index) => entries.push({ text, kind: "moment", index: 1000 + index }));
  (input.memoryContext ?? []).forEach((text, index) => entries.push({ text, kind: "memory", index: 2000 + index }));
  (input.trajectory ?? []).forEach((text, index) => entries.push({ text, kind: "trajectory", index: 3000 + index }));
  if (input.prompt) entries.push({ text: input.prompt, kind: "prompt", index: 4000 });
  if (input.subject) entries.push({ text: input.subject, kind: "identity", index: 4001 });

  return entries
    .map((entry) => ({
      id: `evidence-${entry.kind}-${entry.index + 1}`,
      text: clean(entry.text),
      kind: entry.kind,
    }))
    .filter((entry) => Boolean(entry.text))
    .filter((entry, index, values) => values.findIndex((other) => lower(other.text) === lower(entry.text)) === index);
}

function makeEvents(evidence: RealityEvidence[], input: AuthorBrainTruth): RealityEvent[] {
  const events = evidence.map((entry, index) => ({
    id: `event-${index + 1}`,
    label: entry.text,
    sourceIds: [entry.id],
    entities: inferEntities(entry.text, clean(input.subject) || undefined),
    place: clean(input.place) || undefined,
    time: undefined,
    goal: undefined,
    emotionalState: undefined,
    salient: entry.kind !== "prompt" || evidence.length <= 3,
    provenance: entry.kind === "memory" ? "memory" : entry.kind === "prompt" ? "prompt" : "explicit",
  })) as RealityEvent[];

  return events.filter((event, index, values) =>
    values.findIndex((other) => lower(other.label) === lower(event.label)) === index,
  );
}

function makeStructures(events: RealityEvent[]): RealityEventStructure[] {
  return events.map((event, index) => {
    const actions = inferActions(event.label);
    const states = inferStates(event.label);
    const temporalMarkers = inferTemporalMarkers(event.label);
    const semanticTags = inferSemanticTags(event.label);
    const anomalyScore = /\b(?:unexpected|strange|odd|weird|missing|despite|except|never|suddenly)\b/i.test(event.label) ? 0.85 : 0.15;
    const transitionScore = states.length || index > 0 ? 0.45 : 0.2;
    const recurrenceScore = /\b(?:again|every|always|usually|repeat|recurring)\b/i.test(event.label) ? 0.9 : 0.05;
    return {
      eventId: event.id,
      subjects: event.entities.slice(0, 3),
      actions,
      objects: event.entities.slice(1, 5),
      states,
      temporalMarkers,
      sensoryMarkers: [],
      semanticTags,
      recurrenceScore,
      transitionScore,
      anomalyScore,
      salienceScore: event.salient ? 1 : 0.45,
    };
  });
}

function makeRelations(events: RealityEvent[], structures: RealityEventStructure[]): RealityRelation[] {
  const relations: RealityRelation[] = [];

  for (let index = 1; index < events.length; index += 1) {
    const previous = events[index - 1];
    const current = events[index];
    relations.push({ from: previous.id, to: current.id, kind: "before", strength: 0.58 });
    relations.push({ from: current.id, to: previous.id, kind: "after", strength: 0.58 });

    const previousEntities = new Set(previous.entities.map(lower));
    const shared = current.entities.filter((entity) => previousEntities.has(lower(entity)));
    if (shared.length) {
      relations.push({ from: previous.id, to: current.id, kind: "recontextualizes", strength: Math.min(0.92, 0.58 + shared.length * 0.12) });
    }

    if (structures[index].states.length) {
      relations.push({ from: previous.id, to: current.id, kind: "changes", strength: 0.72 });
    }

    const currentText = lower(current.label);
    if (CONTRAST_MARKERS.some((marker) => currentText.includes(marker))) {
      relations.push({ from: previous.id, to: current.id, kind: "contrasts", strength: 0.82 });
    }
    if (CAUSAL_MARKERS.some((marker) => currentText.includes(marker))) {
      relations.push({ from: previous.id, to: current.id, kind: "causes", strength: 0.8 });
    }
  }

  const normalizedLabels = new Map<string, RealityEvent[]>();
  for (const event of events) {
    const key = lower(event.label).replace(/[^a-z0-9]+/g, " ").trim();
    const list = normalizedLabels.get(key) ?? [];
    list.push(event);
    normalizedLabels.set(key, list);
  }
  for (const list of normalizedLabels.values()) {
    if (list.length < 2) continue;
    for (let index = 1; index < list.length; index += 1) {
      relations.push({ from: list[index - 1].id, to: list[index].id, kind: "repeats", strength: 0.9 });
    }
  }

  const byEntity = new Map<string, RealityEvent[]>();
  for (const event of events) {
    for (const entity of event.entities) {
      const list = byEntity.get(lower(entity)) ?? [];
      list.push(event);
      byEntity.set(lower(entity), list);
    }
  }
  for (const [entity, list] of byEntity) {
    if (list.length < 3) continue;
    const selected = list.slice(0, 6);
    for (let index = 1; index < selected.length; index += 1) {
      relations.push({ from: selected[index - 1].id, to: selected[index].id, kind: "converges", strength: 0.62 });
    }
    void entity;
  }

  return relations.filter((relation, index, values) =>
    values.findIndex((other) =>
      other.from === relation.from && other.to === relation.to && other.kind === relation.kind,
    ) === index,
  );
}

function makeEntityContinuity(events: RealityEvent[]): RealityEntityContinuity[] {
  const entries = new Map<string, RealityEntityContinuity>();
  for (const event of events) {
    for (const entity of event.entities) {
      const key = lower(entity);
      const current = entries.get(key);
      if (current) {
        current.mentionCount += 1;
        current.eventIds.push(event.id);
        current.lastEventId = event.id;
        continue;
      }
      entries.set(key, {
        name: entity,
        mentionCount: 1,
        eventIds: [event.id],
        firstEventId: event.id,
        lastEventId: event.id,
        kind: "unknown",
        salienceScore: 0.8,
      });
    }
  }
  return [...entries.values()].slice(0, 48);
}

function makePatterns(events: RealityEvent[], structures: RealityEventStructure[], relations: RealityRelation[]): RealityPattern[] {
  const patterns: RealityPattern[] = [];
  const transitions = relations.filter((relation) => relation.kind === "changes");
  const recurrence = relations.filter((relation) => relation.kind === "repeats" || relation.kind === "converges");
  const contrast = relations.filter((relation) => relation.kind === "contrasts");
  const causal = relations.filter((relation) => relation.kind === "causes");

  if (transitions.length) {
    patterns.push({
      kind: "transition",
      label: "State changes are present in the supplied reality.",
      eventIds: uniqueStrings(transitions.flatMap((relation) => [relation.from, relation.to])),
      evidenceIds: uniqueStrings(transitions.flatMap((relation) => [relation.from, relation.to])),
      strength: Math.min(1, 0.45 + transitions.length * 0.1),
    });
  }
  if (recurrence.length) {
    patterns.push({
      kind: "recurrence",
      label: "Something repeats or returns across the supplied reality.",
      eventIds: uniqueStrings(recurrence.flatMap((relation) => [relation.from, relation.to])),
      evidenceIds: [],
      strength: Math.min(1, 0.5 + recurrence.length * 0.08),
    });
  }
  if (contrast.length) {
    patterns.push({
      kind: "tension",
      label: "The supplied reality contains a contradiction or contrast.",
      eventIds: uniqueStrings(contrast.flatMap((relation) => [relation.from, relation.to])),
      evidenceIds: [],
      strength: Math.min(1, 0.6 + contrast.length * 0.08),
    });
  }
  if (causal.length) {
    patterns.push({
      kind: "thread",
      label: "Some supplied events imply consequence or dependency.",
      eventIds: uniqueStrings(causal.flatMap((relation) => [relation.from, relation.to])),
      evidenceIds: [],
      strength: Math.min(1, 0.52 + causal.length * 0.08),
    });
  }

  const anomalies = structures.filter((structure) => structure.anomalyScore >= 0.75).map((structure) => structure.eventId);
  if (anomalies.length) {
    patterns.push({
      kind: "anomaly",
      label: "The supplied reality contains an unusual or exception-like detail.",
      eventIds: anomalies,
      evidenceIds: [],
      strength: 0.78,
    });
  }

  const motifs = events.length >= 3
    ? events.filter((event) => event.entities.length > 0).slice(0, 6).map((event) => event.id)
    : [];
  if (motifs.length >= 3) {
    patterns.push({ kind: "motif", label: "A recurring subject or object links multiple events.", eventIds: motifs, evidenceIds: [], strength: 0.58 });
  }

  return patterns.slice(0, 12);
}

export function buildAuthorRealityGraph(input: AuthorBrainTruth): RealityGraph {
  const evidence = makeEvidence(input);
  const events = makeEvents(evidence, input);
  const eventStructure = makeStructures(events);
  const relations = makeRelations(events, eventStructure);
  const entityContinuity = makeEntityContinuity(events);
  const patterns = makePatterns(events, eventStructure, relations);

  const recurringSignals = uniqueStrings([
    ...(input.creativeLearningContext ?? []).filter((line) => /revisit|callback|repeat|recur|return/i.test(line)),
    ...patterns.filter((pattern) => pattern.kind === "recurrence").map((pattern) => pattern.label),
  ]).slice(0, 16);

  const unresolvedTensions = uniqueStrings([
    ...patterns.filter((pattern) => pattern.kind === "tension" || pattern.kind === "anomaly").map((pattern) => pattern.label),
    ...structuresToTensions(events, eventStructure),
  ]).slice(0, 16);

  return {
    evidence,
    events,
    relations,
    eventStructure,
    entityContinuity,
    patterns,
    unresolvedTensions,
    recurringSignals,
    sensorySignals: [],
  };
}

function structuresToTensions(events: RealityEvent[], structures: RealityEventStructure[]): string[] {
  return structures.flatMap((structure) => {
    if (structure.semanticTags.includes("contrast")) {
      const event = events.find((value) => value.id === structure.eventId);
      return event ? [`Contrast: ${event.label}`] : [];
    }
    if (structure.semanticTags.includes("cause_consequence")) {
      const event = events.find((value) => value.id === structure.eventId);
      return event ? [`Consequence: ${event.label}`] : [];
    }
    return [];
  });
}
