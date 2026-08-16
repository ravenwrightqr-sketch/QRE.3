import type { RealityEvent, RealityEvidence, RealityGraph, RealityRelation } from "@qre/contracts";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

function evidence(kind: RealityEvidence["kind"], text: string, index: number): RealityEvidence {
  return { id: `evidence-${kind}-${index + 1}`, text: clean(text), kind };
}

function entitiesFrom(text: string, subject?: string, place?: string): string[] {
  const values = new Set<string>();
  if (subject) values.add(clean(subject));
  if (place) values.add(clean(place));
  for (const match of text.matchAll(/\b[A-Z][A-Za-z0-9'’-]{1,}\b/g)) values.add(match[0]);
  return [...values].filter(Boolean).slice(0, 12);
}

function event(label: string, sourceIds: string[], entities: string[], provenance: RealityEvent["provenance"], index: number): RealityEvent {
  return {
    id: `event-${index + 1}`,
    label: clean(label),
    sourceIds,
    entities,
    salient: true,
    provenance,
  };
}

export function buildAuthorRealityGraph(input: {
  prompt: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  memoryContext?: string[];
  trajectory?: string[];
}): RealityGraph {
  const evidenceItems: RealityEvidence[] = [];
  const events: RealityEvent[] = [];
  const relations: RealityRelation[] = [];

  const pushEvidence = (kind: RealityEvidence["kind"], values: readonly string[] | undefined) => {
    for (const value of values ?? []) {
      const text = clean(value);
      if (text) evidenceItems.push(evidence(kind, text, evidenceItems.length));
    }
  };

  pushEvidence("prompt", [input.prompt]);
  pushEvidence("identity", input.subject ? [input.subject] : []);
  pushEvidence("fact", input.facts);
  pushEvidence("moment", input.sourceMoments);
  pushEvidence("memory", input.memoryContext);
  pushEvidence("trajectory", input.trajectory);

  const eventSources = evidenceItems.filter((item) => item.kind !== "identity");
  for (const source of eventSources) {
    const label = source.text;
    const provenance = source.kind === "memory" ? "memory" : source.kind === "prompt" ? "prompt" : "explicit";
    events.push(event(label, [source.id], entitiesFrom(label, input.subject, input.place), provenance, events.length));
  }

  for (let i = 1; i < events.length; i += 1) {
    relations.push({ from: events[i - 1].id, to: events[i].id, kind: "after", strength: 0.6 });
  }

  const joined = evidenceItems.map((item) => item.text).join(" ");
  const lower = joined.toLowerCase();

  if (/hates?|afraid|scared|nervous/.test(lower) && /loves?|happy|proud|confident/.test(lower)) {
    relations.push({ from: "event-1", to: "event-2", kind: "contrasts", strength: 0.9 });
  }

  const recurringSignals = [
    ...(input.trajectory ?? []),
    ...(input.memoryContext ?? []),
    ...input.facts.filter((fact, index, all) => all.filter((other) => other.toLowerCase().includes(fact.toLowerCase())).length > 1),
  ].map(clean).filter(Boolean).slice(0, 12);

  const sensorySignals = evidenceItems
    .map((item) => item.text)
    .filter((text) => /smell|sound|taste|touch|feel|look|color|light|dark|music|bass|glass|water|bubble|bow|wine/i.test(text))
    .slice(0, 12);

  const unresolvedTensions: string[] = [];
  if (/hates?/.test(lower) && /loves?/.test(lower)) unresolvedTensions.push("conflicting preferences");
  if (/scared|nervous/.test(lower) && /happy|proud|confident/.test(lower)) unresolvedTensions.push("state change");
  if (/calm|conversation/.test(lower) && /knives|glass|doors/.test(lower)) unresolvedTensions.push("social normality vs environmental threat");
  if (/first|again|return|second|third/.test(lower)) unresolvedTensions.push("recurrence and changed meaning");

  return {
    evidence: evidenceItems,
    events,
    relations,
    unresolvedTensions,
    recurringSignals,
    sensorySignals,
  };
}
